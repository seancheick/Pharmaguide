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
      setError(null);

      // 🔒 HIPAA COMPLIANT: Load from local encrypted storage only
      await localHealthProfileService.initialize();
      const localProfile = await localHealthProfileService.getHealthProfile(
        user.id
      );

      if (localProfile) {
        // LocalHealthProfile extends HealthProfile, so we can safely cast
        const mappedProfile: HealthProfile = localProfile as HealthProfile;

        console.log('✅ Loaded health profile from secure storage:', {
          hasDemo: !!mappedProfile.demographics,
          hasGoals: !!mappedProfile.goals,
          hasConditions: !!mappedProfile.conditions,
          hasAllergies: !!mappedProfile.allergies,
          displayName: mappedProfile.demographics?.displayName,
        });

        setProfile(mappedProfile);
        await calculateCompleteness(mappedProfile);
      } else {
        console.log('ℹ️ No health profile found in secure storage, checking AsyncStorage fallback...');

        // 🔄 FALLBACK: Check AsyncStorage for setup data that might not have been saved properly
        try {
          const AsyncStorage = await import('@react-native-async-storage/async-storage');
          const savedSetupData = await AsyncStorage.default.getItem('health_profile_setup_data');

          if (savedSetupData) {
            const setupData = JSON.parse(savedSetupData);
            console.log('📦 Found setup data in AsyncStorage, migrating to secure storage...', setupData);

            // Migrate the data to secure storage
            const migratedProfile: Partial<HealthProfile> = {};

            if (setupData.demographics) {
              migratedProfile.demographics = setupData.demographics;
            }
            if (setupData.goals) {
              migratedProfile.healthGoals = setupData.goals;
            }
            if (setupData.conditions) {
              migratedProfile.healthConditions = setupData.conditions;
            }
            if (setupData.allergies) {
              migratedProfile.allergiesAndSensitivities = setupData.allergies;
            }
            if (setupData.privacy) {
              migratedProfile.privacySettings = setupData.privacy;
            }

            // Save to secure storage
            const savedProfile = await localHealthProfileService.saveHealthProfile(
              user.id,
              migratedProfile
            );

            // Validate and safely map profile
            const mappedProfile: HealthProfile = {
              id: savedProfile.id,
              userId: savedProfile.userId,
              demographics: savedProfile.demographics,
              healthGoals: savedProfile.healthGoals,
              healthConditions: savedProfile.healthConditions,
              allergiesAndSensitivities: savedProfile.allergiesAndSensitivities,
              privacySettings: savedProfile.privacySettings,
              notificationSettings: savedProfile.notificationSettings,
              accessibilitySettings: savedProfile.accessibilitySettings,
              appSettings: savedProfile.appSettings,
              profileCompleteness: savedProfile.profileCompleteness,
              lastActiveAt: savedProfile.lastActiveAt,
              createdAt: savedProfile.createdAt?.toString() || new Date().toISOString(),
              updatedAt: savedProfile.updatedAt?.toString() || new Date().toISOString(),
            };
            setProfile(mappedProfile);
            await calculateCompleteness(mappedProfile);

            console.log('✅ Successfully migrated setup data to secure storage');

            // Clean up AsyncStorage after successful migration
            await AsyncStorage.default.removeItem('health_profile_setup_data');
            await AsyncStorage.default.removeItem('health_profile_setup_progress');
            await AsyncStorage.default.removeItem('health_profile_consents');

            return;
          }
        } catch (migrationError) {
          console.warn('⚠️ Migration from AsyncStorage failed:', migrationError);
        }

        // No profile exists yet
        setProfile(null);
        await calculateCompleteness(null);
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

  // Add a refresh function that can be called externally
  const refreshProfile = useCallback(async () => {
    try {
      await loadProfile();
    } catch (error) {
      console.error('❌ Failed to refresh health profile:', error);
      // Set error state but don't crash the app
      setError(error instanceof Error ? error.message : 'Failed to refresh profile');
    }
  }, [loadProfile]);

  const calculateCompleteness = async (data: HealthProfile | null) => {
    try {
      // 🔧 FIX: Use consistent 5-step calculation (20% each)
      // Steps: privacy_consent, demographics, health_goals, health_conditions, allergies
      let profileCompleted = 0;
      const profileTotal = 5; // 5 steps total for 20% each

      if (data) {
        // Privacy consent: check if privacy settings exist
        if (data.privacySettings) {
          profileCompleted++;
        }

        // Demographics: must have ageRange and biologicalSex
        if (
          data.demographics &&
          data.demographics.ageRange &&
          data.demographics.biologicalSex
        ) {
          profileCompleted++;
        }

        // Goals: must have primary
        if (
          data.healthGoals &&
          typeof data.healthGoals === 'object' &&
          'primary' in data.healthGoals &&
          data.healthGoals.primary
        ) {
          profileCompleted++;
        }

        // Conditions: optional but counts if present (or explicitly skipped)
        if (
          data.healthConditions &&
          typeof data.healthConditions === 'object' &&
          'conditions' in data.healthConditions
        ) {
          profileCompleted++;
        }

        // Allergies: optional but counts if present (or explicitly skipped)
        if (
          data.allergiesAndSensitivities &&
          typeof data.allergiesAndSensitivities === 'object' &&
          'allergies' in data.allergiesAndSensitivities
        ) {
          profileCompleted++;
        }
      }

      const calculatedCompleteness = Math.round((profileCompleted / profileTotal) * 100);
      setCompleteness(calculatedCompleteness);
      console.log(`📊 Profile completeness: ${profileCompleted}/${profileTotal} = ${calculatedCompleteness}%`);
    } catch (error) {
      console.error('❌ Error calculating completeness:', error);
      setCompleteness(0);
    }
  };

  const updateProfile = async (section: keyof HealthProfile, data: unknown) => {
    if (!user?.id) return { error: 'No user logged in' };
    try {
      setLoading(true);
      setError(null);

      console.log(`💾 Updating health profile section: ${section}`, data);

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
      } else if (section === 'privacy') {
        updateData.privacy = data as HealthProfile['privacy'];
      }

      // Save to local encrypted storage
      const updatedProfile = await localHealthProfileService.saveHealthProfile(
        user.id,
        updateData
      );

      // Map updated profile back to HealthProfile interface
      const mappedProfile: HealthProfile = updatedProfile as HealthProfile;

      console.log(`✅ Successfully saved ${section} to secure storage:`, {
        hasDemo: !!mappedProfile.demographics,
        hasGoals: !!mappedProfile.goals,
        hasConditions: !!mappedProfile.conditions,
        hasAllergies: !!mappedProfile.allergies,
        displayName: mappedProfile.demographics?.displayName,
      });

      setProfile(mappedProfile);
      await calculateCompleteness(mappedProfile);

      console.log(
        `✅ Health profile ${section} updated locally (HIPAA compliant)`
      );
      return { data: updatedProfile, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      console.error(`❌ Error updating health profile ${section}:`, err);
      setError(errorMessage);
      return { data: null, error: errorMessage };
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
    refreshProfile,
    updateProfile,
    resetError,
    // Typed helper methods for specific updates
    updateDemographics: (data: Demographics) =>
      updateProfile('demographics', data),
    updateGoals: (data: HealthGoals) => updateProfile('healthGoals', data),
    updateConditions: (data: HealthConditions) =>
      updateProfile('healthConditions', data),
    updateAllergies: (data: AllergiesAndSensitivities) =>
      updateProfile('allergiesAndSensitivities', data),
  };
};
