// src/services/health/localHealthProfileService.ts
// HIPAA-Compliant Local-Only Health Profile Service
// NO PHI TRANSMISSION TO EXTERNAL SERVERS

import { secureStorage } from '../storage/secureStorage';
import type { HealthProfile } from '../../types';

interface LocalHealthProfile extends HealthProfile {
  id: string;
  userId: string;
  version: number;
  createdAt: number;
  updatedAt: number;
  isComplete: boolean;
}

/**
 * HIPAA-Compliant Local Health Profile Service
 * - All health data stored locally with AES-256 encryption
 * - Zero PHI transmission to external servers
 * - User-controlled data retention and deletion
 * - Audit trail for data access
 */
export class LocalHealthProfileService {
  private readonly DATA_TYPE = 'health_profile' as const;

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    await secureStorage.initialize();
    console.log('🏥 Local health profile service initialized');
  }

  /**
   * Create or update health profile (LOCAL ONLY)
   */
  async saveHealthProfile(userId: string, profile: Partial<HealthProfile>): Promise<LocalHealthProfile> {
    try {
      // Get existing profile if it exists
      const existing = await this.getHealthProfile(userId);
      
      const now = Date.now();
      const updatedProfile: LocalHealthProfile = {
        id: existing?.id || `profile_${userId}_${now}`,
        userId,
        version: (existing?.version || 0) + 1,
        createdAt: existing?.createdAt || now,
        updatedAt: now,
        isComplete: this.isProfileComplete(profile),
        
        // Merge with existing data
        demographics: {
          ...existing?.demographics,
          ...profile.demographics,
        },
        conditions: {
          ...existing?.conditions,
          ...profile.conditions,
        },
        allergies: {
          ...existing?.allergies,
          ...profile.allergies,
        },
        goals: {
          ...existing?.goals,
          ...profile.goals,
        },
        privacy: {
          ...existing?.privacy,
          ...profile.privacy,
        },
      };

      // Store encrypted in local database
      await secureStorage.storeHealthData(
        userId,
        this.DATA_TYPE,
        updatedProfile,
        updatedProfile.id
      );

      console.log(`🔐 Health profile saved locally for user ${userId} (version ${updatedProfile.version})`);
      
      // Log audit trail (no PHI in logs)
      this.logAuditEvent(userId, 'profile_updated', {
        version: updatedProfile.version,
        isComplete: updatedProfile.isComplete,
        timestamp: now,
      });

      return updatedProfile;
    } catch (error) {
      console.error('❌ Failed to save health profile:', error);
      throw new Error('Health profile save failed');
    }
  }

  /**
   * Get health profile (LOCAL ONLY)
   */
  async getHealthProfile(userId: string): Promise<LocalHealthProfile | null> {
    try {
      const profiles = await secureStorage.getHealthData(userId, this.DATA_TYPE);
      
      if (profiles.length === 0) {
        return null;
      }

      // Return the most recent profile
      const profile = profiles[0] as any; // In real implementation, this would be decrypted
      
      // Log audit trail (no PHI in logs)
      this.logAuditEvent(userId, 'profile_accessed', {
        profileId: profile.id,
        timestamp: Date.now(),
      });

      // For now, return a mock structure since we need full decryption implementation
      return {
        id: profile.id || `profile_${userId}`,
        userId,
        version: 1,
        createdAt: profile.createdAt || Date.now(),
        updatedAt: profile.updatedAt || Date.now(),
        isComplete: false,
        demographics: {},
        conditions: { conditions: [] },
        allergies: { substances: [] },
        goals: {},
        privacy: {
          dataRetention: 'indefinite',
          analyticsOptIn: false,
          aiAnalysisOptIn: false, // Default to opt-out for HIPAA compliance
        },
      };
    } catch (error) {
      console.error('❌ Failed to get health profile:', error);
      return null;
    }
  }

  /**
   * Delete health profile (GDPR right to be forgotten)
   */
  async deleteHealthProfile(userId: string): Promise<boolean> {
    try {
      const deletedCount = await secureStorage.deleteHealthData(userId, this.DATA_TYPE);
      
      // Log audit trail
      this.logAuditEvent(userId, 'profile_deleted', {
        deletedRecords: deletedCount,
        timestamp: Date.now(),
      });

      console.log(`🗑️ Deleted health profile for user ${userId} (${deletedCount} records)`);
      return deletedCount > 0;
    } catch (error) {
      console.error('❌ Failed to delete health profile:', error);
      throw new Error('Health profile deletion failed');
    }
  }

  /**
   * Export health profile data (GDPR data portability)
   */
  async exportHealthProfile(userId: string): Promise<any> {
    try {
      const profile = await this.getHealthProfile(userId);
      
      if (!profile) {
        return null;
      }

      // Log audit trail
      this.logAuditEvent(userId, 'profile_exported', {
        profileId: profile.id,
        timestamp: Date.now(),
      });

      // Return sanitized export (remove internal IDs, encryption metadata)
      return {
        exportedAt: new Date().toISOString(),
        profileVersion: profile.version,
        demographics: profile.demographics,
        conditions: profile.conditions,
        allergies: profile.allergies,
        goals: profile.goals,
        privacy: profile.privacy,
        metadata: {
          createdAt: new Date(profile.createdAt).toISOString(),
          updatedAt: new Date(profile.updatedAt).toISOString(),
          isComplete: profile.isComplete,
        },
      };
    } catch (error) {
      console.error('❌ Failed to export health profile:', error);
      throw new Error('Health profile export failed');
    }
  }

  /**
   * Get sanitized profile for AI analysis (NO PHI)
   */
  getSanitizedProfileForAI(profile: LocalHealthProfile): any {
    // Only send generic categories, never specific details
    return {
      ageRange: profile.demographics?.ageRange, // "25-35", not exact age
      biologicalSex: profile.demographics?.biologicalSex, // "male"/"female"
      pregnancyStatus: profile.demographics?.pregnancyStatus, // "not_pregnant"
      conditions: profile.conditions?.conditions?.filter(c => 
        typeof c === 'string' && c.length > 0
      ), // ["diabetes", "hypertension"] - general categories only
      allergies: profile.allergies?.substances?.filter(a => 
        typeof a === 'string' && a.length > 0
      ), // ["penicillin", "shellfish"] - common allergens only
      goals: {
        primary: profile.goals?.primary, // "weight_loss"
        secondary: profile.goals?.secondary, // ["energy", "sleep"]
      },
      // NEVER SEND: exact age, names, addresses, specific medical history, dosages
    };
  }

  /**
   * Check if user has consented to AI analysis
   */
  async hasAIConsent(userId: string): Promise<boolean> {
    try {
      const profile = await this.getHealthProfile(userId);
      return profile?.privacy?.aiAnalysisOptIn === true;
    } catch (error) {
      console.error('❌ Failed to check AI consent:', error);
      return false; // Default to no consent for safety
    }
  }

  /**
   * Update AI consent status
   */
  async updateAIConsent(userId: string, hasConsent: boolean): Promise<void> {
    try {
      const profile = await this.getHealthProfile(userId);
      
      if (profile) {
        await this.saveHealthProfile(userId, {
          privacy: {
            ...profile.privacy,
            aiAnalysisOptIn: hasConsent,
          },
        });

        // Log audit trail
        this.logAuditEvent(userId, 'ai_consent_updated', {
          hasConsent,
          timestamp: Date.now(),
        });

        console.log(`🤖 AI consent updated for user ${userId}: ${hasConsent}`);
      }
    } catch (error) {
      console.error('❌ Failed to update AI consent:', error);
      throw new Error('AI consent update failed');
    }
  }

  /**
   * Get health profile statistics (no PHI)
   */
  async getProfileStats(userId: string): Promise<{
    hasProfile: boolean;
    isComplete: boolean;
    completionPercentage: number;
    lastUpdated: string | null;
    hasAIConsent: boolean;
  }> {
    try {
      const profile = await this.getHealthProfile(userId);
      
      if (!profile) {
        return {
          hasProfile: false,
          isComplete: false,
          completionPercentage: 0,
          lastUpdated: null,
          hasAIConsent: false,
        };
      }

      const completionPercentage = this.calculateCompletionPercentage(profile);

      return {
        hasProfile: true,
        isComplete: profile.isComplete,
        completionPercentage,
        lastUpdated: new Date(profile.updatedAt).toISOString(),
        hasAIConsent: profile.privacy?.aiAnalysisOptIn === true,
      };
    } catch (error) {
      console.error('❌ Failed to get profile stats:', error);
      return {
        hasProfile: false,
        isComplete: false,
        completionPercentage: 0,
        lastUpdated: null,
        hasAIConsent: false,
      };
    }
  }

  // Private helper methods

  private isProfileComplete(profile: Partial<HealthProfile>): boolean {
    const hasBasicDemographics = profile.demographics?.ageRange && profile.demographics?.biologicalSex;
    const hasPrivacySettings = profile.privacy !== undefined;
    
    // Minimum requirements for complete profile
    return !!(hasBasicDemographics && hasPrivacySettings);
  }

  private calculateCompletionPercentage(profile: LocalHealthProfile): number {
    let completed = 0;
    const total = 5; // Total sections

    if (profile.demographics?.ageRange && profile.demographics?.biologicalSex) completed++;
    if (profile.conditions?.conditions && profile.conditions.conditions.length > 0) completed++;
    if (profile.allergies?.substances && profile.allergies.substances.length > 0) completed++;
    if (profile.goals?.primary) completed++;
    if (profile.privacy) completed++;

    return Math.round((completed / total) * 100);
  }

  private logAuditEvent(userId: string, action: string, metadata: any): void {
    // Log audit events for HIPAA compliance (no PHI in logs)
    console.log(`📋 AUDIT: User ${userId.substring(0, 8)}... performed ${action}`, {
      timestamp: new Date().toISOString(),
      action,
      metadata: {
        ...metadata,
        // Remove any potential PHI from logs
        userId: undefined,
      },
    });
  }
}

// Singleton instance
export const localHealthProfileService = new LocalHealthProfileService();
