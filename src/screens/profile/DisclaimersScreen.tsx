// src/screens/profile/DisclaimersScreen.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';
import { DisclaimersScreenProps } from '../../types/navigation';

interface Disclaimer {
  id: string;
  title: string;
  content: string;
  icon: string;
  type: 'medical' | 'legal' | 'data' | 'general';
}

export const DisclaimersScreen: React.FC<DisclaimersScreenProps> = ({ navigation }) => {
  const disclaimers: Disclaimer[] = [
    {
      id: 'medical',
      title: 'Medical Disclaimer',
      content: `Pharmaguide is for informational purposes only and is not intended to replace professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition or supplement regimen.

Never disregard professional medical advice or delay in seeking it because of something you have read in this app. If you think you may have a medical emergency, call your doctor or emergency services immediately.

The information provided in this app has not been evaluated by the Food and Drug Administration (FDA) and is not intended to diagnose, treat, cure, or prevent any disease.`,
      icon: 'medical',
      type: 'medical',
    },
    {
      id: 'accuracy',
      title: 'Information Accuracy',
      content: `While we strive to provide accurate and up-to-date information about supplements, medications, and their interactions, we cannot guarantee the completeness or accuracy of all information in our database.

Supplement formulations, dosages, and ingredients may change without notice. Always verify product information with the manufacturer or your healthcare provider before making decisions about your health.

Drug and supplement interaction data is based on available research and may not include all possible interactions. New interactions may be discovered as research continues.`,
      icon: 'info',
      type: 'data',
    },
    {
      id: 'liability',
      title: 'Limitation of Liability',
      content: `Pharmaguide and its developers shall not be liable for any direct, indirect, incidental, special, or consequential damages arising from the use of this app or reliance on the information provided.

Users assume full responsibility for their use of the app and any decisions made based on the information provided. We strongly recommend consulting with healthcare professionals before making any changes to your supplement or medication regimen.`,
      icon: 'shield-checkmark',
      type: 'legal',
    },
    {
      id: 'user_content',
      title: 'User-Generated Content',
      content: `User reviews, ratings, and submissions are opinions of individual users and do not reflect the views of Pharmaguide. We do not endorse or verify user-generated content.

While we moderate user submissions for inappropriate content, we cannot guarantee the accuracy of user-provided information. Always verify information from multiple sources.

By submitting content, you grant Pharmaguide the right to use, modify, and distribute your submissions to improve our services.`,
      icon: 'people',
      type: 'general',
    },
    {
      id: 'regulatory',
      title: 'Regulatory Compliance',
      content: `This app is designed for use in the United States and complies with applicable U.S. regulations. Information may not be applicable in other countries where different regulations apply.

Supplement regulations vary by country. Products available in one country may not be approved or available in another. Always check local regulations and consult local healthcare providers.

The app is not intended for use by healthcare professionals as a clinical decision-making tool.`,
      icon: 'flag',
      type: 'legal',
    },
  ];

  const getIconColor = (type: Disclaimer['type']) => {
    switch (type) {
      case 'medical': return COLORS.error;
      case 'legal': return COLORS.warning;
      case 'data': return COLORS.info;
      case 'general': return COLORS.primary;
      default: return COLORS.textSecondary;
    }
  };

  const renderDisclaimer = (disclaimer: Disclaimer) => (
    <View key={disclaimer.id} style={styles.disclaimerCard}>
      <View style={styles.disclaimerHeader}>
        <View style={[
          styles.disclaimerIcon,
          { backgroundColor: `${getIconColor(disclaimer.type)}20` }
        ]}>
          <MaterialIcons
            name={disclaimer.icon as any}
            size={24}
            color={getIconColor(disclaimer.type)}
          />
        </View>
        <Text style={styles.disclaimerTitle}>{disclaimer.title}</Text>
      </View>
      <Text style={styles.disclaimerContent}>{disclaimer.content}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Important Disclaimers</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Important Notice */}
        <View style={styles.importantNotice}>
          <MaterialIcons name="warning" size={24} color={COLORS.error} />
          <View style={styles.noticeContent}>
            <Text style={styles.noticeTitle}>Please Read Carefully</Text>
            <Text style={styles.noticeText}>
              These disclaimers contain important information about the limitations and proper use of Pharmaguide. 
              By using this app, you acknowledge that you have read and understood these disclaimers.
            </Text>
          </View>
        </View>

        {/* Disclaimers */}
        <View style={styles.disclaimersContainer}>
          {disclaimers.map(renderDisclaimer)}
        </View>

        {/* Emergency Information */}
        <View style={styles.emergencySection}>
          <View style={styles.emergencyHeader}>
            <MaterialIcons name="emergency" size={24} color={COLORS.error} />
            <Text style={styles.emergencyTitle}>Medical Emergency</Text>
          </View>
          <Text style={styles.emergencyText}>
            If you are experiencing a medical emergency, do not use this app. 
            Call emergency services (911 in the US) or go to your nearest emergency room immediately.
          </Text>
          <Text style={styles.emergencySubtext}>
            For poison control emergencies in the US, call 1-800-222-1222.
          </Text>
        </View>

        {/* Last Updated */}
        <View style={styles.lastUpdated}>
          <Text style={styles.lastUpdatedText}>
            Last updated: January 2024
          </Text>
          <Text style={styles.lastUpdatedSubtext}>
            We may update these disclaimers from time to time. Please review them periodically.
          </Text>
        </View>

        {/* Contact Information */}
        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>Questions About These Disclaimers?</Text>
          <Text style={styles.contactText}>
            If you have questions about these disclaimers or need clarification, please contact our support team.
          </Text>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => navigation.navigate('ContactSupportScreen')}
            activeOpacity={0.7}
          >
            <MaterialIcons name="support-agent" size={18} color={COLORS.white} />
            <Text style={styles.contactButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  backButton: {
    padding: SPACING.sm,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  importantNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.errorLight,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: 12,
    gap: SPACING.md,
  },
  noticeContent: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.error,
    marginBottom: SPACING.sm,
  },
  noticeText: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.error,
    lineHeight: 22,
  },
  disclaimersContainer: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.lg,
  },
  disclaimerCard: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  disclaimerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  disclaimerIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  disclaimerTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    flex: 1,
  },
  disclaimerContent: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  emergencySection: {
    backgroundColor: COLORS.errorLight,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.xl,
    padding: SPACING.lg,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.error,
  },
  emergencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  emergencyTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.error,
  },
  emergencyText: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.error,
    lineHeight: 22,
    marginBottom: SPACING.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  emergencySubtext: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.error,
    lineHeight: 20,
  },
  lastUpdated: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  lastUpdatedText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
    marginBottom: SPACING.xs,
  },
  lastUpdatedSubtext: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  contactSection: {
    backgroundColor: COLORS.primaryLight,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
    padding: SPACING.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  contactTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  contactText: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  contactButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    gap: SPACING.sm,
  },
  contactButtonText: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.white,
  },
});
