// src/hooks/useNewHealthProfile.ts
// Clean hook for the new health profile system

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { newHealthProfileService } from '../services/newHealthProfileService';
import type { NewHealthProfile } from '../types/newHealthProfile';

export const useNewHealthProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<NewHealthProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load profile
  const loadProfile = useCallback(async () => {
    if (!user?.id) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const profileData = await newHealthProfileService.getProfile(user.id);
      setProfile(profileData);
      
      console.log('✅ Health profile loaded:', {
        hasProfile: !!profileData,
        isComplete: profileData?.isComplete,
        completionPercentage: profileData ? Math.round(((profileData.privacy?.dataStorage ? 1 : 0) + (profileData.demographics?.ageRange && profileData.demographics?.biologicalSex ? 1 : 0)) / 2 * 100) : 0,
        demographics: profileData?.demographics ? 'present' : 'missing',
        privacy: profileData?.privacy ? 'present' : 'missing',
        userId: user.id.substring(0, 8) + '...',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load profile';
      console.error('❌ Error loading health profile:', err);
      setError(errorMessage);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Refresh profile
  const refreshProfile = useCallback(async () => {
    await loadProfile();
  }, [loadProfile]);

  // Check if profile exists and is complete
  const isProfileComplete = profile?.isComplete === true;
  const hasProfile = profile !== null;

  // Get completion percentage
  const completionPercentage = (() => {
    if (!profile) return 0;
    
    let completed = 0;
    const total = 2; // 2 steps total
    
    // Step 1: Privacy consent
    if (profile.privacy?.dataStorage) completed++;
    
    // Step 2: Demographics
    if (profile.demographics?.ageRange && profile.demographics?.biologicalSex) completed++;
    
    return Math.round((completed / total) * 100);
  })();

  // Get display name
  const displayName = profile?.demographics?.displayName || user?.email?.split('@')[0] || 'User';

  // Check AI consent
  const hasAIConsent = profile?.privacy?.aiAnalysis === true;

  // Load profile when user changes
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  return {
    profile,
    loading,
    error,
    hasProfile,
    isProfileComplete,
    completionPercentage,
    displayName,
    hasAIConsent,
    loadProfile,
    refreshProfile,
    resetError: () => setError(null),
    // Force immediate refresh without loading state
    forceRefresh: useCallback(async () => {
      if (!user?.id) return;
      try {
        const profileData = await newHealthProfileService.getProfile(user.id);
        setProfile(profileData);
        console.log('🔄 Profile force refreshed:', !!profileData);
      } catch (err) {
        console.error('❌ Error force refreshing profile:', err);
      }
    }, [user?.id]),
  };
};