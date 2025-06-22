// src/components/privacy/ConsentModal.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { privacyService } from '../../services/privacy/privacyService';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';
import type { ConsentType } from '../../types/healthProfile';

interface ConsentModalProps {
  visible: boolean;
  onClose: () => void;
  onConsentsGranted: (consents: Record<ConsentType, boolean>) => void;
  requiredOnly?: boolean;
  title?: string;
}

export const ConsentModal: React.FC<ConsentModalProps> = ({
  visible,
  onClose,
  onConsentsGranted,
  requiredOnly = false,
  title = 'Privacy & Data Consent',
}) => {
  const consentDefinitions = privacyService.getConsentDefinitions();
  const [consents, setConsents] = useState<Record<ConsentType, boolean>>(() => {
    const initial: Record<ConsentType, boolean> = {} as any;
    Object.keys(consentDefinitions).forEach(key => {
      const consentType = key as ConsentType;
      initial[consentType] = consentDefinitions[consentType].required;
    });
    return initial;
  });

  const [showDetails, setShowDetails] = useState<Record<ConsentType, boolean>>(
    {} as any
  );

  const toggleConsent = (consentType: ConsentType) => {
    const definition = consentDefinitions[consentType];

    if (definition.required) {
      Alert.alert(
        'Required Consent',
        'This consent is required for the app to function properly. You can disable it later in Settings if needed.',
        [{ text: 'OK' }]
      );
      return;
    }

    setConsents(prev => ({
      ...prev,
      [consentType]: !prev[consentType],
    }));
  };

  const toggleDetails = (consentType: ConsentType) => {
    setShowDetails(prev => ({
      ...prev,
      [consentType]: !prev[consentType],
    }));
  };

  const handleContinue = () => {
    // Check required consents
    const requiredConsents = Object.entries(consentDefinitions)
      .filter(([_, def]) => def.required)
      .map(([type, _]) => type as ConsentType);

    const missingRequired = requiredConsents.filter(
      consentType => !consents[consentType]
    );

    if (missingRequired.length > 0) {
      Alert.alert(
        'Required Consents Missing',
        'Please grant all required consents to continue using the app.',
        [{ text: 'OK' }]
      );
      return;
    }

    onConsentsGranted(consents);
  };

  const getConsentsByCategory = () => {
    const categories = {
      essential: [] as ConsentType[],
      functional: [] as ConsentType[],
      analytics: [] as ConsentType[],
      marketing: [] as ConsentType[],
    };

    Object.entries(consentDefinitions).forEach(([type, def]) => {
      if (!requiredOnly || def.required) {
        categories[def.category].push(type as ConsentType);
      }
    });

    return categories;
  };

  const renderConsentItem = (consentType: ConsentType) => {
    const definition = consentDefinitions[consentType];
    const isGranted = consents[consentType];
    const isExpanded = showDetails[consentType];

    return (
      <View key={consentType} style={styles.consentItem}>
        <View style={styles.consentHeader}>
          <View style={styles.consentInfo}>
            <View style={styles.consentTitleRow}>
              <Text style={styles.consentTitle}>{definition.title}</Text>
              {definition.required && (
                <View style={styles.requiredBadge}>
                  <Text style={styles.requiredText}>Required</Text>
                </View>
              )}
            </View>
            <Text
              style={styles.consentDescription}
              numberOfLines={isExpanded ? undefined : 2}
            >
              {definition.description}
            </Text>
          </View>

          <View style={styles.consentControls}>
            <Switch
              value={isGranted}
              onValueChange={() => toggleConsent(consentType)}
              trackColor={{ false: COLORS.gray300, true: COLORS.primaryLight }}
              thumbColor={isGranted ? COLORS.primary : COLORS.gray400}
              disabled={definition.required}
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.detailsButton}
          onPress={() => toggleDetails(consentType)}
        >
          <Text style={styles.detailsButtonText}>
            {isExpanded ? 'Show Less' : 'Learn More'}
          </Text>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={COLORS.primary}
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.expandedDetails}>
            <Text style={styles.detailsText}>
              {getDetailedDescription(consentType)}
            </Text>
            <View style={styles.dataUsageInfo}>
              <MaterialIcons name="info" size={16} color={COLORS.info} />
              <Text style={styles.dataUsageText}>
                {getDataUsageInfo(consentType)}
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  const getDetailedDescription = (consentType: ConsentType): string => {
    const descriptions = {
      health_data_storage:
        'Your health information is encrypted and stored securely on our servers. This data is used exclusively to provide personalized safety warnings and recommendations. We never sell or share your personal health information.',
      personalized_recommendations:
        'We use your health profile to customize supplement recommendations, dosage suggestions, and interaction warnings specifically for your needs. This helps ensure the advice you receive is relevant and safe.',
      health_conditions:
        'Tracking your health conditions allows us to identify supplements that may be beneficial or harmful for your specific situation. For example, people with diabetes need different supplement considerations.',
      allergies_tracking:
        'By knowing your allergies and sensitivities, we can warn you about supplements that contain ingredients you should avoid, preventing potentially dangerous reactions.',
      medication_tracking:
        "Monitoring your current medications helps us identify potential drug-supplement interactions that could affect your medication's effectiveness or cause adverse effects.",
      anonymized_research:
        "Your data is completely anonymized (no personal identifiers) and combined with other users' data to help researchers understand supplement safety patterns and improve recommendations for everyone.",
      marketing_communications:
        "We'll send you helpful health tips, new feature announcements, and relevant supplement information. You can unsubscribe at any time.",
      data_sharing_partners:
        'We may share anonymized, aggregated data with trusted research institutions and healthcare organizations to advance supplement safety research. No personal information is ever shared.',
      crash_analytics:
        'When the app crashes or encounters errors, we collect technical information to help us fix bugs and improve app stability. No personal or health data is included in these reports.',
      usage_analytics:
        "We track how features are used (like which screens are visited most) to understand what's helpful and what needs improvement. This data is anonymized and helps us make the app better for everyone.",
    };

    return (
      descriptions[consentType] ||
      'Additional information about this consent type.'
    );
  };

  const getDataUsageInfo = (consentType: ConsentType): string => {
    const usageInfo = {
      health_data_storage:
        'Data retention: 7 years or until account deletion. You can export or delete your data at any time.',
      personalized_recommendations:
        'Used in real-time for recommendations. Not shared with third parties.',
      health_conditions:
        'Stored securely with your profile. Used only for safety analysis.',
      allergies_tracking:
        'Checked against all supplement ingredients. Critical for safety warnings.',
      medication_tracking:
        'Cross-referenced with supplement database for interaction detection.',
      anonymized_research:
        'Completely anonymous. Cannot be traced back to you.',
      marketing_communications: 'Email address only. Unsubscribe anytime.',
      data_sharing_partners:
        'Aggregated statistics only. No personal information.',
      crash_analytics:
        'Technical data only. Automatically deleted after 90 days.',
      usage_analytics:
        'Anonymous usage patterns. Helps improve user experience.',
    };

    return (
      usageInfo[consentType] || 'Standard data protection practices apply.'
    );
  };

  const renderCategorySection = (
    category: string,
    consentTypes: ConsentType[]
  ) => {
    if (consentTypes.length === 0) return null;

    const categoryInfo = {
      essential: {
        title: 'Essential',
        description: 'Required for basic app functionality',
        icon: 'shield-checkmark' as const,
        color: COLORS.success,
      },
      functional: {
        title: 'Functional',
        description: 'Enhance your experience with personalized features',
        icon: 'settings' as const,
        color: COLORS.primary,
      },
      analytics: {
        title: 'Analytics',
        description: 'Help us improve the app and advance research',
        icon: 'analytics' as const,
        color: COLORS.info,
      },
      marketing: {
        title: 'Marketing',
        description: 'Stay informed about health tips and new features',
        icon: 'mail' as const,
        color: COLORS.warning,
      },
    };

    const info = categoryInfo[category as keyof typeof categoryInfo];

    return (
      <View key={category} style={styles.categorySection}>
        <View style={styles.categoryHeader}>
          <Ionicons name={info.icon} size={20} color={info.color} />
          <View style={styles.categoryInfo}>
            <Text style={styles.categoryTitle}>{info.title}</Text>
            <Text style={styles.categoryDescription}>{info.description}</Text>
          </View>
        </View>
        {consentTypes.map(renderConsentItem)}
      </View>
    );
  };

  const categories = getConsentsByCategory();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.introSection}>
            <MaterialIcons
              name="privacy-tip"
              size={32}
              color={COLORS.primary}
            />
            <Text style={styles.introTitle}>Your Privacy Matters</Text>
            <Text style={styles.introText}>
              We're committed to protecting your health information. Please
              review and customize your privacy preferences below.
            </Text>
          </View>

          {renderCategorySection('essential', categories.essential)}
          {renderCategorySection('functional', categories.functional)}
          {renderCategorySection('analytics', categories.analytics)}
          {renderCategorySection('marketing', categories.marketing)}

          <View style={styles.legalSection}>
            <Text style={styles.legalText}>
              By continuing, you agree to our{' '}
              <Text style={styles.linkText}>Privacy Policy</Text> and{' '}
              <Text style={styles.linkText}>Terms of Service</Text>.
            </Text>
            <Text style={styles.legalSubtext}>
              You can change these preferences anytime in Settings.
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
  },
  closeButton: {
    padding: SPACING.sm,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  introSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  introTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  introText: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  categorySection: {
    marginBottom: SPACING.xl,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  categoryInfo: {
    marginLeft: SPACING.sm,
    flex: 1,
  },
  categoryTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
  },
  categoryDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
  },
  consentItem: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  consentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  consentInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  consentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  consentTitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    flex: 1,
  },
  requiredBadge: {
    backgroundColor: COLORS.errorLight,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: SPACING.sm,
  },
  requiredText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.error,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  consentDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  consentControls: {
    alignItems: 'center',
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  detailsButtonText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.medium,
    marginRight: SPACING.xs,
  },
  expandedDetails: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
  },
  detailsText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  dataUsageInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.infoLight,
    padding: SPACING.sm,
    borderRadius: 8,
  },
  dataUsageText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.info,
    marginLeft: SPACING.xs,
    flex: 1,
    lineHeight: 16,
  },
  legalSection: {
    paddingVertical: SPACING.xl,
    alignItems: 'center',
  },
  legalText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  linkText: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  legalSubtext: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
  },
  continueButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
});
