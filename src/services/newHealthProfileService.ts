// src/services/newHealthProfileService.ts
// Clean, simple health profile service for persistence

import { secureStorage } from './storage/secureStorage';
import { localHealthProfileService } from './health/localHealthProfileService';
import type { NewHealthProfile, PrivacyConsent, Demographics, HealthGoal, HealthCondition, Allergy } from '../types/newHealthProfile';
import type { UserProfile } from '../types/healthProfile';

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
    // Save to new health profile system
    const profile = await this.saveProfile(userId, data);
    
    // Also update the old health profile system for backward compatibility
    await this.syncToOldHealthProfile(userId, data);
    
    return profile;
  }

  /**
   * Sync new health profile data to old health profile system for backward compatibility
   */
  private async syncToOldHealthProfile(
    userId: string,
    data: {
      demographics: Demographics;
      healthGoals: HealthGoal[];
      healthConditions: HealthCondition[];
      allergies: Allergy[];
    }
  ): Promise<void> {
    try {
      const now = new Date().toISOString();
      
      // Transform new data to old format
      const oldFormatDemographics = {
        ageRange: data.demographics.ageRange as any,
        biologicalSex: data.demographics.biologicalSex as any,
        displayName: data.demographics.displayName,
        createdAt: now,
        updatedAt: now,
      };

      const oldFormatHealthGoals = {
        primary: data.healthGoals[0]?.id as any || undefined,
        secondary: data.healthGoals[1]?.id as any || undefined,
        createdAt: now,
        updatedAt: now,
      };

      const oldFormatHealthConditions = {
        conditions: data.healthConditions.map(condition => ({
          id: condition.id,
          name: condition.name,
          category: condition.category as any,
          severity: 'mild' as const,
          diagnosed: true,
          managedWith: 'lifestyle' as const,
        })),
        consentGiven: true,
        lastUpdated: now,
      };

      const oldFormatAllergies = {
        allergies: data.allergies.map(allergy => ({
          id: allergy.id,
          name: allergy.name,
          type: allergy.type as any,
          severity: 'mild' as const,
          confirmed: true,
        })),
        consentGiven: true,
        lastUpdated: now,
      };

      // Update old health profile service
      await localHealthProfileService.updateDemographics(userId, oldFormatDemographics);
      if (oldFormatHealthGoals.primary) {
        await localHealthProfileService.updateHealthGoals(userId, oldFormatHealthGoals);
      }
      if (oldFormatHealthConditions.conditions.length > 0) {
        await localHealthProfileService.updateHealthConditions(userId, oldFormatHealthConditions);
      }
      if (oldFormatAllergies.allergies.length > 0) {
        await localHealthProfileService.updateAllergiesAndSensitivities(userId, oldFormatAllergies);
      }

      console.log('✅ Synced new health profile to old format for backward compatibility');
    } catch (error) {
      console.error('❌ Failed to sync to old health profile format:', error);
      // Don't throw error - this is just for backward compatibility
    }
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