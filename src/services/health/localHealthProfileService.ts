// src/services/health/localHealthProfileService.ts
// HIPAA-Compliant Local-Only Health Profile Service
// NO PHI TRANSMISSION TO EXTERNAL SERVERS

import { secureStorage } from '../storage/secureStorage';
import type { HealthProfile } from '../../types';

interface LocalHealthProfile {
  id: string;
  userId: string;
  version: number;
  createdAt: number;
  updatedAt: number;
  isComplete: boolean;
  demographics?: any;
  healthGoals?: any;
  healthConditions?: any;
  allergiesAndSensitivities?: any;
  privacySettings?: any;
  notificationSettings?: any;
  accessibilitySettings?: any;
  appSettings?: any;
  profileCompleteness: number;
  lastActiveAt: string;
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
  private profileCache: Map<string, { profile: LocalHealthProfile | null; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 30000; // 30 seconds cache TTL

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    await secureStorage.initialize();
    console.log('🏥 Local health profile service initialized');
  }

  /**
   * Clear cache for a specific user or all users
   */
  private clearCache(userId?: string): void {
    if (userId) {
      this.profileCache.delete(userId);
    } else {
      this.profileCache.clear();
    }
  }

  /**
   * Check if cached profile is still valid
   */
  private isCacheValid(userId: string): boolean {
    const cached = this.profileCache.get(userId);
    if (!cached) return false;

    const now = Date.now();
    return (now - cached.timestamp) < this.CACHE_TTL;
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
        // Merge with existing data, always provide safe defaults
        demographics: {
          ...existing?.demographics,
          ...profile.demographics,
        },
        healthConditions: {
          ...(existing?.healthConditions || { conditions: [], consentGiven: false, lastUpdated: new Date().toISOString() }),
          ...(profile.healthConditions || {}),
          conditions: (profile.healthConditions?.conditions || existing?.healthConditions?.conditions || []),
        },
        allergiesAndSensitivities: {
          ...(existing?.allergiesAndSensitivities || { allergies: [], consentGiven: false, lastUpdated: new Date().toISOString() }),
          ...(profile.allergiesAndSensitivities || {}),
          allergies: (profile.allergiesAndSensitivities?.allergies || existing?.allergiesAndSensitivities?.allergies || []),
        },
        healthGoals: {
          ...existing?.healthGoals,
          ...profile.healthGoals,
        },
        privacySettings: {
          ...existing?.privacySettings,
          ...profile.privacySettings,
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

      // Clear cache to ensure fresh data on next load
      this.clearCache(userId);

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
      // Check cache first to prevent excessive database scans
      if (this.isCacheValid(userId)) {
        const cached = this.profileCache.get(userId);
        console.log(`📋 Using cached health profile for user ${userId}`);
        return cached!.profile;
      }

      const profiles = await secureStorage.getHealthData(userId, this.DATA_TYPE);

      if (profiles.length === 0) {
        console.log(`ℹ️ No health profile found for user ${userId}`);
        // Cache the null result to prevent repeated database scans
        this.profileCache.set(userId, { profile: null, timestamp: Date.now() });
        return null;
      }

      // Return the most recent profile (profiles are sorted by updated_at DESC)
      const profileData = profiles[0];

      console.log(`✅ Found health profile for user ${userId}:`, {
        id: profileData.id,
        hasDemo: !!profileData.demographics,
        hasGoals: !!profileData.goals,
        hasConditions: !!profileData.conditions,
        hasAllergies: !!profileData.allergies,
        displayName: profileData.demographics?.displayName,
      });

      // Log audit trail (no PHI in logs)
      this.logAuditEvent(userId, 'profile_accessed', {
        profileId: profileData.id,
        timestamp: Date.now(),
      });

      // Return the actual profile data (already decrypted by secureStorage.getHealthData)
      const profile: LocalHealthProfile = {
        id: profileData.id || `profile_${userId}`,
        userId,
        version: profileData.version || 1,
        createdAt: profileData.createdAt || Date.now(),
        updatedAt: profileData.updatedAt || Date.now(),
        isComplete: profileData.isComplete || false,
        demographics: profileData.demographics || {},
        healthConditions: profileData.healthConditions || { conditions: [], consentGiven: false, lastUpdated: new Date().toISOString() },
        allergiesAndSensitivities: profileData.allergiesAndSensitivities || { allergies: [], consentGiven: false, lastUpdated: new Date().toISOString() },
        healthGoals: profileData.healthGoals || {},
        privacySettings: profileData.privacySettings || {
          dataRetention: 'indefinite',
          analyticsOptIn: false,
          aiAnalysisOptIn: false, // Default to opt-out for HIPAA compliance
        },
        // Additional UserProfile properties
        notificationSettings: profileData.notificationSettings || {
          newFeatures: false,
          safetyUpdates: true,
          marketingEmails: false,
          pushNotifications: true,
          emailNotifications: false,
          smsNotifications: false,
        },
        accessibilitySettings: profileData.accessibilitySettings || {
          fontSize: 'medium',
          highContrast: false,
          reduceMotion: false,
          screenReader: false,
          voiceOver: false,
          hapticFeedback: true,
          colorBlindSupport: false,
        },
        appSettings: profileData.appSettings || {
          theme: 'system',
          language: 'en',
          units: 'metric',
          currency: 'USD',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          autoSync: true,
          offlineMode: false,
          cacheSize: 'medium',
        },
        profileCompleteness: this.calculateCompletionPercentage({
          demographics: updatedProfile.demographics,
          healthConditions: updatedProfile.healthConditions,
          allergiesAndSensitivities: updatedProfile.allergiesAndSensitivities,
          healthGoals: updatedProfile.healthGoals,
          privacySettings: updatedProfile.privacySettings,
        } as any),
        profileCompleteness: 0, // Will be calculated below
        lastActiveAt: new Date().toISOString(),
      };

      // Cache the successful result
      this.profileCache.set(userId, { profile, timestamp: Date.now() });

      return profile;
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
        healthConditions: profile.healthConditions,
        allergiesAndSensitivities: profile.allergiesAndSensitivities,
        healthGoals: profile.healthGoals,
        privacySettings: profile.privacySettings,
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
      conditions: profile.healthConditions?.conditions?.filter((c: any) => 
        typeof c === 'string' && c.length > 0
      ), // ["diabetes", "hypertension"] - general categories only
      allergies: profile.allergiesAndSensitivities?.allergies?.filter((a: any) => 
        typeof a === 'string' && a.length > 0
      ), // ["penicillin", "shellfish"] - common allergens only
      goals: {
        primary: profile.healthGoals?.primary, // "weight_loss"
        secondary: profile.healthGoals?.secondary, // ["energy", "sleep"]
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
      return profile?.privacySettings?.aiAnalysisOptIn === true;
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
          privacySettings: {
            ...profile.privacySettings,
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
    const hasPrivacySettings = profile.privacySettings !== undefined;
    
    // Minimum requirements for complete profile
    return !!(hasBasicDemographics && hasPrivacySettings);
  }

  private calculateCompletionPercentage(profile: LocalHealthProfile): number {
    let completed = 0;
    const total = 5; // Total sections

    if (profile.demographics?.ageRange && profile.demographics?.biologicalSex) completed++;
    if (profile.healthConditions?.conditions && profile.healthConditions.conditions.length > 0) completed++;
    if (profile.allergiesAndSensitivities?.allergies && profile.allergiesAndSensitivities.allergies.length > 0) completed++;
    if (profile.healthGoals?.primary) completed++;
    if (profile.privacySettings) completed++;

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
