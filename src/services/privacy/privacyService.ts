// src/services/privacy/privacyService.ts
import { supabase } from '../supabase/client';
import type { 
  PrivacyConsent, 
  ConsentType, 
  PrivacySettings,
  UserProfile 
} from '../../types/healthProfile';

interface ConsentRequest {
  consentType: ConsentType;
  granted: boolean;
  version: string;
}

interface ConsentMetadata {
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

class PrivacyService {
  private readonly CURRENT_PRIVACY_VERSION = '1.0.0';
  private readonly REQUIRED_CONSENTS: ConsentType[] = [
    'health_data_storage',
    'personalized_recommendations'
  ];

  /**
   * Record user consent for specific data usage
   */
  async recordConsent(
    userId: string,
    consentRequests: ConsentRequest[],
    metadata?: Partial<ConsentMetadata>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const consents: PrivacyConsent[] = consentRequests.map(request => ({
        consentType: request.consentType,
        granted: request.granted,
        timestamp: new Date().toISOString(),
        version: request.version,
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
      }));

      // Store consents in database
      const { error } = await supabase
        .from('privacy_consents')
        .upsert(
          consents.map(consent => ({
            user_id: userId,
            consent_type: consent.consentType,
            granted: consent.granted,
            timestamp: consent.timestamp,
            version: consent.version,
            ip_address: consent.ipAddress,
            user_agent: consent.userAgent,
          })),
          { onConflict: 'user_id,consent_type' }
        );

      if (error) {
        console.error('Failed to record consent:', error);
        return { success: false, error: 'Failed to record consent' };
      }

      return { success: true };
    } catch (error) {
      console.error('Privacy consent error:', error);
      return { success: false, error: 'Consent recording failed' };
    }
  }

  /**
   * Get user's current privacy settings
   */
  async getPrivacySettings(userId: string): Promise<PrivacySettings | null> {
    try {
      const { data, error } = await supabase
        .from('privacy_consents')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Failed to fetch privacy settings:', error);
        return null;
      }

      // Transform database records to PrivacyConsent format
      const consents: PrivacyConsent[] = data?.map(record => ({
        consentType: record.consent_type as ConsentType,
        granted: record.granted,
        timestamp: record.timestamp,
        version: record.version,
        ipAddress: record.ip_address,
        userAgent: record.user_agent,
      })) || [];

      return {
        consents,
        dataRetentionPeriod: 2555, // 7 years in days (HIPAA-inspired)
        allowDataExport: true,
        allowDataDeletion: true,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error fetching privacy settings:', error);
      return null;
    }
  }

  /**
   * Check if user has granted specific consent
   */
  async hasConsent(userId: string, consentType: ConsentType): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('privacy_consents')
        .select('granted')
        .eq('user_id', userId)
        .eq('consent_type', consentType)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return false;
      }

      return data.granted;
    } catch (error) {
      console.error('Error checking consent:', error);
      return false;
    }
  }

  /**
   * Check if user has all required consents
   */
  async hasRequiredConsents(userId: string): Promise<boolean> {
    try {
      const consentChecks = await Promise.all(
        this.REQUIRED_CONSENTS.map(consentType => 
          this.hasConsent(userId, consentType)
        )
      );

      return consentChecks.every(granted => granted);
    } catch (error) {
      console.error('Error checking required consents:', error);
      return false;
    }
  }

  /**
   * Revoke specific consent
   */
  async revokeConsent(
    userId: string, 
    consentType: ConsentType
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Record revocation
      const result = await this.recordConsent(
        userId,
        [{ consentType, granted: false, version: this.CURRENT_PRIVACY_VERSION }]
      );

      if (!result.success) {
        return result;
      }

      // If revoking required consent, may need to disable features
      if (this.REQUIRED_CONSENTS.includes(consentType)) {
        await this.handleRequiredConsentRevocation(userId, consentType);
      }

      return { success: true };
    } catch (error) {
      console.error('Error revoking consent:', error);
      return { success: false, error: 'Failed to revoke consent' };
    }
  }

  /**
   * Handle revocation of required consents
   */
  private async handleRequiredConsentRevocation(
    userId: string, 
    consentType: ConsentType
  ): Promise<void> {
    switch (consentType) {
      case 'health_data_storage':
        // Clear health profile data
        await this.clearHealthData(userId);
        break;
      case 'personalized_recommendations':
        // Disable personalized features
        await this.disablePersonalizedFeatures(userId);
        break;
    }
  }

  /**
   * Clear user's health data (GDPR right to be forgotten)
   */
  private async clearHealthData(userId: string): Promise<void> {
    try {
      // Clear health profile data
      await supabase
        .from('user_profiles')
        .update({
          health_conditions: null,
          allergies_and_sensitivities: null,
          current_medications: null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      console.log('Health data cleared for user:', userId);
    } catch (error) {
      console.error('Error clearing health data:', error);
    }
  }

  /**
   * Disable personalized features
   */
  private async disablePersonalizedFeatures(userId: string): Promise<void> {
    try {
      // Update user settings to disable personalization
      await supabase
        .from('user_profiles')
        .update({
          personalized_recommendations_enabled: false,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      console.log('Personalized features disabled for user:', userId);
    } catch (error) {
      console.error('Error disabling personalized features:', error);
    }
  }

  /**
   * Export user's data (CCPA/GDPR compliance)
   */
  async exportUserData(userId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // Check if user has consent for data export
      const hasExportConsent = await this.hasConsent(userId, 'health_data_storage');
      if (!hasExportConsent) {
        return { success: false, error: 'No consent for data export' };
      }

      // Fetch all user data
      const [profileData, stackData, scanHistory, privacyData] = await Promise.all([
        supabase.from('user_profiles').select('*').eq('user_id', userId),
        supabase.from('user_stacks').select('*').eq('user_id', userId),
        supabase.from('scan_history').select('*').eq('user_id', userId),
        supabase.from('privacy_consents').select('*').eq('user_id', userId),
      ]);

      const exportData = {
        exportDate: new Date().toISOString(),
        userId,
        profile: profileData.data?.[0] || null,
        supplementStack: stackData.data || [],
        scanHistory: scanHistory.data || [],
        privacyConsents: privacyData.data || [],
        dataRetentionInfo: {
          retentionPeriod: '7 years',
          automaticDeletion: true,
          lastUpdated: new Date().toISOString(),
        },
      };

      return { success: true, data: exportData };
    } catch (error) {
      console.error('Error exporting user data:', error);
      return { success: false, error: 'Data export failed' };
    }
  }

  /**
   * Delete user account and all data (right to be forgotten)
   */
  async deleteUserAccount(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Delete all user data in correct order (foreign key constraints)
      const deletions = [
        supabase.from('privacy_consents').delete().eq('user_id', userId),
        supabase.from('scan_history').delete().eq('user_id', userId),
        supabase.from('user_stacks').delete().eq('user_id', userId),
        supabase.from('user_profiles').delete().eq('user_id', userId),
        supabase.from('gamification_progress').delete().eq('user_id', userId),
      ];

      await Promise.all(deletions);

      // Delete auth user (this should be done last)
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      if (authError) {
        console.error('Error deleting auth user:', authError);
        // Continue anyway - data is deleted
      }

      console.log('User account and all data deleted:', userId);
      return { success: true };
    } catch (error) {
      console.error('Error deleting user account:', error);
      return { success: false, error: 'Account deletion failed' };
    }
  }

  /**
   * Get consent definitions for UI
   */
  getConsentDefinitions(): Record<ConsentType, { 
    title: string; 
    description: string; 
    required: boolean;
    category: 'essential' | 'functional' | 'analytics' | 'marketing';
  }> {
    return {
      health_data_storage: {
        title: 'Health Data Storage',
        description: 'Store your health conditions, allergies, and medications to provide personalized safety warnings.',
        required: true,
        category: 'essential',
      },
      personalized_recommendations: {
        title: 'Personalized Recommendations',
        description: 'Use your health profile to provide tailored supplement recommendations and dosage guidance.',
        required: true,
        category: 'essential',
      },
      health_conditions: {
        title: 'Health Conditions Tracking',
        description: 'Track your health conditions to identify condition-specific supplement interactions.',
        required: false,
        category: 'functional',
      },
      allergies_tracking: {
        title: 'Allergy & Sensitivity Tracking',
        description: 'Monitor allergies and sensitivities to prevent adverse reactions.',
        required: false,
        category: 'functional',
      },
      medication_tracking: {
        title: 'Medication Tracking',
        description: 'Track current medications to check for drug-supplement interactions.',
        required: false,
        category: 'functional',
      },
      anonymized_research: {
        title: 'Anonymous Research Data',
        description: 'Contribute anonymized data to improve supplement safety research.',
        required: false,
        category: 'analytics',
      },
      marketing_communications: {
        title: 'Marketing Communications',
        description: 'Receive emails about new features, health tips, and product recommendations.',
        required: false,
        category: 'marketing',
      },
      data_sharing_partners: {
        title: 'Data Sharing with Partners',
        description: 'Share anonymized data with trusted research partners and healthcare organizations.',
        required: false,
        category: 'analytics',
      },
      crash_analytics: {
        title: 'Crash & Error Reporting',
        description: 'Send crash reports and error logs to help improve app stability.',
        required: false,
        category: 'analytics',
      },
      usage_analytics: {
        title: 'Usage Analytics',
        description: 'Track how you use the app to improve features and user experience.',
        required: false,
        category: 'analytics',
      },
    };
  }

  /**
   * Get current privacy policy version
   */
  getCurrentPrivacyVersion(): string {
    return this.CURRENT_PRIVACY_VERSION;
  }

  /**
   * Check if consent needs to be updated due to policy changes
   */
  async needsConsentUpdate(userId: string): Promise<boolean> {
    try {
      const settings = await this.getPrivacySettings(userId);
      if (!settings) return true;

      // Check if any consent is from an older version
      const hasOldConsents = settings.consents.some(
        consent => consent.version !== this.CURRENT_PRIVACY_VERSION
      );

      return hasOldConsents;
    } catch (error) {
      console.error('Error checking consent update needs:', error);
      return true;
    }
  }
}

export const privacyService = new PrivacyService();
