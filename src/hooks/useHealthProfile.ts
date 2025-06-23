// src/hooks/useHealthProfile.ts
// 🔒 HIPAA-COMPLIANT: Local-Only Health Profile Management Hook
// ❌ NO PHI TRANSMISSION TO EXTERNAL SERVERS
import { useState, useEffect, useCallback } from 'react';
import { localHealthProfileService } from '../services/health/localHealthProfileService';
import {
  Demographics,
  HealthGoals,
  HealthConditions,
  AllergiesAndSensitivities,
} from '../types/healthProfile';
import { useAuth } from './useAuth';
import type { HealthProfile as BaseHealthProfile } from '../types';

export interface HealthProfile {
  demographics?: Demographics;
  goals?: HealthGoals;
  conditions?: HealthConditions;
  allergies?: AllergiesAndSensitivities;
  privacy?: {
    dataRetention?: 'indefinite' | '1_year' | '2_years' | '5_years';
    analyticsOptIn?: boolean;
    aiAnalysisOptIn?: boolean;
  };
}

export const useHealthProfile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<HealthProfile | null>(null);
  const [completeness, setCompleteness] = useState(0);

  const loadProfile = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // 🔒 HIPAA COMPLIANT: Load from local encrypted storage only
      await localHealthProfileService.initialize();
      const localProfile = await localHealthProfileService.getHealthProfile(
        user.id
      );

      if (localProfile) {
        // LocalHealthProfile extends HealthProfile, so we can safely cast
        const mappedProfile: HealthProfile = localProfile as HealthProfile;

        setProfile(mappedProfile);
        calculateCompleteness(mappedProfile);
      } else {
        // No profile exists yet
        setProfile(null);
        setCompleteness(0);
      }
    } catch (err) {
      console.error('❌ Error loading health profile from local storage:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const calculateCompleteness = (data: HealthProfile | null) => {
    if (!data) {
      setCompleteness(0);
      return;
    }
    let completed = 0;
    const total = 4;
    // Demographics: must have ageRange and biologicalSex
    if (
      data.demographics &&
      data.demographics.ageRange &&
      data.demographics.biologicalSex
    ) {
      completed++;
    }
    // Goals: must have primary
    if (
      data.goals &&
      typeof data.goals === 'object' &&
      'primary' in data.goals &&
      data.goals.primary
    ) {
      completed++;
    }
    // Conditions: must have at least one
    if (
      data.conditions &&
      typeof data.conditions === 'object' &&
      Array.isArray(data.conditions.conditions) &&
      data.conditions.conditions.length > 0
    ) {
      completed++;
    }
    // Allergies: must have at least one
    if (
      data.allergies &&
      typeof data.allergies === 'object' &&
      Array.isArray(data.allergies.allergies) &&
      data.allergies.allergies.length > 0
    ) {
      completed++;
    }
    setCompleteness(Math.round((completed / total) * 100));
  };

  const updateProfile = async (section: keyof HealthProfile, data: unknown) => {
    if (!user?.id) return { error: 'No user logged in' };
    try {
      setLoading(true);

      // 🔒 HIPAA COMPLIANT: Update local encrypted storage only
      await localHealthProfileService.initialize();

      // Build update object for local storage
      const updateData: Partial<HealthProfile> = {};

      if (section === 'demographics' && typeof data === 'object' && data) {
        updateData.demographics = data as Demographics;
      } else if (section === 'goals') {
        updateData.goals = data as HealthGoals;
      } else if (section === 'conditions') {
        updateData.conditions = data as HealthConditions;
      } else if (section === 'allergies') {
        updateData.allergies = data as AllergiesAndSensitivities;
      }

      // Save to local encrypted storage
      const updatedProfile = await localHealthProfileService.saveHealthProfile(
        user.id,
        updateData
      );

      // Map updated profile back to HealthProfile interface
      const mappedProfile: HealthProfile = updatedProfile as HealthProfile;

      setProfile(mappedProfile);
      calculateCompleteness(mappedProfile);

      console.log(
        `✅ Health profile ${section} updated locally (HIPAA compliant)`
      );
      return { data: updatedProfile, error: null };
    } catch (err) {
      console.error(`Error updating health profile ${section}:`, err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  };

  const resetError = () => setError(null);

  return {
    profile,
    loading,
    error,
    completeness,
    loadProfile,
    updateProfile,
    resetError,
    // Typed helper methods for specific updates
    updateDemographics: (data: Demographics) =>
      updateProfile('demographics', data),
    updateGoals: (data: HealthGoals) => updateProfile('goals', data),
    updateConditions: (data: HealthConditions) =>
      updateProfile('conditions', data),
    updateAllergies: (data: AllergiesAndSensitivities) =>
      updateProfile('allergies', data),
  };
};
