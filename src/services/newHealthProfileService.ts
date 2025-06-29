// src/services/newHealthProfileService.ts
// Clean, simple health profile service for persistence

import { secureStorage } from './storage/secureStorage';
import type { NewHealthProfile, PrivacyConsent, Demographics, HealthGoal, HealthCondition, Allergy } from '../types/newHealthProfile';

class NewHealthProfileService {
  private readonly STORAGE_KEY = 'new_health_profile';

  /**
   * Save complete health profile
   */
  async saveProfile(userId: string, profile: Partial<NewHealthProfile>): Promise<NewHealthProfile> {
    try {
      const existing = await this.getProfile(userId);
      
      const updatedProfile: NewHealthProfile = {
        id: existing?.id || `profile_${userId}_${Date.now()}`,
        userId,
        privacy: profile.privacy || existing?.privacy || {
          dataStorage: false,
          aiAnalysis: false,
          anonymousAnalytics: false,
          consentTimestamp: new Date().toISOString(),
        },
        demographics: profile.demographics || existing?.demographics || {
          ageRange: '',
          biologicalSex: '',
        },
        healthGoals: profile.healthGoals || existing?.healthGoals || [],
        healthConditions: profile.healthConditions || existing?.healthConditions || [],
        allergies: profile.allergies || existing?.allergies || [],
        isComplete: this.isProfileComplete(profile, existing),
        completedAt: this.isProfileComplete(profile, existing) ? new Date().toISOString() : existing?.completedAt,
        createdAt: existing?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save to secure storage
      await secureStorage.storeHealthData(
        userId,
        this.STORAGE_KEY,
        updatedProfile,
        updatedProfile.id
      );

      console.log('✅ Health profile saved successfully');
      return updatedProfile;
    } catch (error) {
      console.error('❌ Failed to save health profile:', error);
      throw new Error('Failed to save health profile');
    }
  }

  /**
   * Get health profile
   */
  async getProfile(userId: string): Promise<NewHealthProfile | null> {
    try {
      const profiles = await secureStorage.getHealthData(userId, this.STORAGE_KEY);
      
      if (profiles.length === 0) {
        return null;
      }

      return profiles[0] as NewHealthProfile;
    } catch (error) {
      console.error('❌ Failed to get health profile:', error);
      return null;
    }
  }

  /**
   * Update privacy consent
   */
  async updatePrivacyConsent(userId: string, consent: PrivacyConsent): Promise<NewHealthProfile> {
    return this.saveProfile(userId, { privacy: consent });
  }

  /**
   * Update health information (step 2)
   */
  async updateHealthInformation(
    userId: string,
    data: {
      demographics: Demographics;
      healthGoals: HealthGoal[];
      healthConditions: HealthCondition[];
      allergies: Allergy[];
    }
  ): Promise<NewHealthProfile> {
    return this.saveProfile(userId, data);
  }

  /**
   * Check if profile is complete
   */
  private isProfileComplete(current: Partial<NewHealthProfile>, existing?: NewHealthProfile | null): boolean {
    const profile = { ...existing, ...current };
    
    // Step 1: Privacy consent must be given
    const hasPrivacyConsent = profile.privacy?.dataStorage === true;
    
    // Step 2: Demographics must be filled
    const hasDemographics = profile.demographics?.ageRange && profile.demographics?.biologicalSex;
    
    return !!(hasPrivacyConsent && hasDemographics);
  }

  /**
   * Delete profile
   */
  async deleteProfile(userId: string): Promise<boolean> {
    try {
      const deletedCount = await secureStorage.deleteHealthData(userId, this.STORAGE_KEY);
      console.log('✅ Health profile deleted');
      return deletedCount > 0;
    } catch (error) {
      console.error('❌ Failed to delete health profile:', error);
      return false;
    }
  }

  /**
   * Check if user has AI consent
   */
  async hasAIConsent(userId: string): Promise<boolean> {
    try {
      const profile = await this.getProfile(userId);
      return profile?.privacy?.aiAnalysis === true;
    } catch (error) {
      console.error('❌ Failed to check AI consent:', error);
      return false;
    }
  }
}

export const newHealthProfileService = new NewHealthProfileService();