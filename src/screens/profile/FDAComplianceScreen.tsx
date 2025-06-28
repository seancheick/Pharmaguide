// src/screens/profile/FDAComplianceScreen.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants';
import { FDADisclaimer, SourceCitation } from '../../components/compliance';
import { useFDACompliance } from '../../hooks/useFDACompliance';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<ProfileStackParamList, 'FDACompliance'>;

export const FDAComplianceScreen: React.FC<Props> = ({ navigation }) => {
  const {
    consentState,
    grantConsent,
    revokeConsent,
    revokeAllConsent,
    hasValidConsent,
    isConsentExpired,
    getConsentExpiryDate,
  } = useFDACompliance();

  const handleToggleConsent = (type: 'ai_analysis' | 'interaction_check' | 'recommendation') => {
    if (hasValidConsent(type)) {
      Alert.alert(
        'Revoke Consent',
        `Are you sure you want to revoke consent for ${type.replace('_', ' ')}? This will disable related features.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Revoke',
            style: 'destructive',
            onPress: () => revokeConsent(type),
          },
        ]
      );
    } else {
      grantConsent(type);
    }
  };

  const handleRevokeAll = () => {
    Alert.alert(
      'Revoke All Consent',
      'This will revoke all FDA compliance consent and disable AI features. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke All',
          style: 'destructive',
          onPress: revokeAllConsent,
        },
      ]
    );
  };

  const expiryDate = getConsentExpiryDate();
  const isExpired = isConsentExpired();

  const complianceSources = [
    {
      id: 'fda_guidance',
      title: 'FDA Guidance for Industry: Mobile Medical Applications',
      source: 'FDA' as const,
      url: 'https://www.fda.gov/regulatory-information/search-fda-guidance-documents/mobile-medical-applications',
      year: 2022,
      evidenceLevel: 'A' as const,
      description: 'Official FDA guidance on mobile health applications and regulatory requirements',
    },
    {
      id: 'fda_supplements',
      title: 'FDA Dietary Supplement Health and Education Act',
      source: 'FDA' as const,
      url: 'https://www.fda.gov/food/dietary-supplements',
      year: 2024,
      evidenceLevel: 'A' as const,
      description: 'Comprehensive FDA regulations for dietary supplements and health claims',
    },
    {
      id: 'nih_supplements',
      title: 'NIH Office of Dietary Supplements',
      source: 'NIH' as const,
      url: 'https://ods.od.nih.gov/',
      year: 2024,
      evidenceLevel: 'A' as const,
      description: 'Evidence-based information on dietary supplements and their interactions',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>FDA Compliance</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <FDADisclaimer variant="full" />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Consent Status</Text>
          
          {isExpired && (
            <View style={styles.warningCard}>
              <Ionicons name="warning" size={20} color={COLORS.error} />
              <Text style={styles.warningText}>
                Your consent has expired. Please review and update your preferences.
              </Text>
            </View>
          )}

          {expiryDate && !isExpired && (
            <View style={styles.infoCard}>
              <Ionicons name="information-circle" size={20} color={COLORS.primary} />
              <Text style={styles.infoText}>
                Consent expires on {expiryDate.toLocaleDateString()}
              </Text>
            </View>
          )}

          <View style={styles.consentItem}>
            <View style={styles.consentHeader}>
              <Text style={styles.consentTitle}>AI Analysis</Text>
              <TouchableOpacity
                style={[
                  styles.toggle,
                  hasValidConsent('ai_analysis') && styles.toggleActive
                ]}
                onPress={() => handleToggleConsent('ai_analysis')}
              >
                <Text style={[
                  styles.toggleText,
                  hasValidConsent('ai_analysis') && styles.toggleTextActive
                ]}>
                  {hasValidConsent('ai_analysis') ? 'Enabled' : 'Disabled'}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.consentDescription}>
              Allow AI-powered supplement analysis and personalized recommendations
            </Text>
          </View>

          <View style={styles.consentItem}>
            <View style={styles.consentHeader}>
              <Text style={styles.consentTitle}>Interaction Checking</Text>
              <TouchableOpacity
                style={[
                  styles.toggle,
                  hasValidConsent('interaction_check') && styles.toggleActive
                ]}
                onPress={() => handleToggleConsent('interaction_check')}
              >
                <Text style={[
                  styles.toggleText,
                  hasValidConsent('interaction_check') && styles.toggleTextActive
                ]}>
                  {hasValidConsent('interaction_check') ? 'Enabled' : 'Disabled'}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.consentDescription}>
              Enable supplement-supplement and supplement-medication interaction analysis
            </Text>
          </View>

          <View style={styles.consentItem}>
            <View style={styles.consentHeader}>
              <Text style={styles.consentTitle}>Recommendations</Text>
              <TouchableOpacity
                style={[
                  styles.toggle,
                  hasValidConsent('recommendation') && styles.toggleActive
                ]}
                onPress={() => handleToggleConsent('recommendation')}
              >
                <Text style={[
                  styles.toggleText,
                  hasValidConsent('recommendation') && styles.toggleTextActive
                ]}>
                  {hasValidConsent('recommendation') ? 'Enabled' : 'Disabled'}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.consentDescription}>
              Receive personalized supplement recommendations based on your health profile
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Regulatory Information</Text>
          <Text style={styles.sectionDescription}>
            PharmaGuide is designed as a wellness education app and complies with FDA guidelines
            for mobile health applications. We maintain strict educational-only positioning to
            avoid medical device regulation.
          </Text>
          
          <SourceCitation sources={complianceSources} variant="full" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Usage</Text>
          <View style={styles.dataItem}>
            <Ionicons name="shield-checkmark" size={16} color={COLORS.success} />
            <Text style={styles.dataText}>All health data is stored locally on your device</Text>
          </View>
          <View style={styles.dataItem}>
            <Ionicons name="shield-checkmark" size={16} color={COLORS.success} />
            <Text style={styles.dataText}>No personal health information is sent to AI services</Text>
          </View>
          <View style={styles.dataItem}>
            <Ionicons name="shield-checkmark" size={16} color={COLORS.success} />
            <Text style={styles.dataText}>Only anonymized, generic data is used for analysis</Text>
          </View>
          <View style={styles.dataItem}>
            <Ionicons name="shield-checkmark" size={16} color={COLORS.success} />
            <Text style={styles.dataText}>Full HIPAA compliance maintained</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.revokeAllButton}
          onPress={handleRevokeAll}
        >
          <Ionicons name="close-circle" size={20} color={COLORS.error} />
          <Text style={styles.revokeAllText}>Revoke All Consent</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    marginRight: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  sectionDescription: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    lineHeight: TYPOGRAPHY.lineHeights.relaxed,
    marginBottom: SPACING.md,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.errorLight,
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.md,
  },
  warningText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.error,
    marginLeft: SPACING.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.md,
  },
  infoText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.primary,
    marginLeft: SPACING.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  consentItem: {
    backgroundColor: COLORS.backgroundSecondary,
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.md,
  },
  consentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  consentTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
  },
  consentDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: TYPOGRAPHY.lineHeights.relaxed,
  },
  toggle: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 16,
    backgroundColor: COLORS.disabled,
  },
  toggleActive: {
    backgroundColor: COLORS.primary,
  },
  toggleText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textSecondary,
  },
  toggleTextActive: {
    color: COLORS.background,
  },
  dataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  dataText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
  },
  revokeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.errorLight,
    padding: SPACING.md,
    borderRadius: 8,
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  revokeAllText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.error,
    marginLeft: SPACING.sm,
  },
});
