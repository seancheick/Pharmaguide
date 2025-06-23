// src/screens/profile/TermsOfServiceScreen.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';
import { TermsOfServiceScreenProps } from '../../types/navigation';

interface TermsSection {
  id: string;
  title: string;
  content: string;
}

export const TermsOfServiceScreen: React.FC<TermsOfServiceScreenProps> = ({ navigation }) => {
  const lastUpdated = 'January 15, 2024';

  const termsSections: TermsSection[] = [
    {
      id: 'acceptance',
      title: '1. Acceptance of Terms',
      content: `By downloading, installing, or using the Pharmaguide mobile application ("App"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the App.

These Terms constitute a legally binding agreement between you and Pharmaguide ("we," "us," or "our"). We may update these Terms from time to time, and your continued use of the App constitutes acceptance of any changes.`,
    },
    {
      id: 'description',
      title: '2. Description of Service',
      content: `Pharmaguide is a mobile application that provides information about supplements, medications, and potential interactions. The App includes features such as:

• Barcode scanning for product identification
• Supplement and medication interaction analysis
• Personal health stack management
• AI-powered health insights and recommendations
• Educational content about supplements and health

The App is intended for informational purposes only and does not provide medical advice.`,
    },
    {
      id: 'medical_disclaimer',
      title: '3. Medical Disclaimer',
      content: `THE APP IS NOT INTENDED TO PROVIDE MEDICAL ADVICE, DIAGNOSIS, OR TREATMENT. The information provided through the App is for educational and informational purposes only.

You should always consult with qualified healthcare professionals before making any decisions about your health, medications, or supplements. Never disregard professional medical advice or delay seeking it because of information you have accessed through the App.

In case of a medical emergency, contact emergency services immediately.`,
    },
    {
      id: 'user_responsibilities',
      title: '4. User Responsibilities',
      content: `By using the App, you agree to:

• Provide accurate and complete information when creating your health profile
• Use the App only for lawful purposes
• Not attempt to reverse engineer, hack, or compromise the App's security
• Not share your account credentials with others
• Respect the intellectual property rights of others
• Report any bugs, security vulnerabilities, or inappropriate content

You are responsible for maintaining the confidentiality of your account information.`,
    },
    {
      id: 'data_accuracy',
      title: '5. Data Accuracy and Limitations',
      content: `While we strive to provide accurate and up-to-date information, we cannot guarantee the completeness, accuracy, or reliability of all data in the App.

Supplement formulations, ingredients, and interactions may change without notice. Product information is sourced from various databases and user submissions, which may contain errors or omissions.

You acknowledge that:
• Information may not reflect the most current research
• Individual responses to supplements may vary
• The App cannot account for all possible health conditions or medications`,
    },
    {
      id: 'privacy',
      title: '6. Privacy and Data Protection',
      content: `Your privacy is important to us. Our collection, use, and protection of your personal information is governed by our Privacy Policy, which is incorporated into these Terms by reference.

By using the App, you consent to the collection and use of your information as described in our Privacy Policy. We implement appropriate security measures to protect your personal health information.`,
    },
    {
      id: 'intellectual_property',
      title: '7. Intellectual Property',
      content: `The App and its content, including but not limited to text, graphics, images, logos, and software, are owned by Pharmaguide or its licensors and are protected by copyright, trademark, and other intellectual property laws.

You may not copy, modify, distribute, sell, or lease any part of the App or its content without our express written permission. You may not reverse engineer or attempt to extract the source code of the App.`,
    },
    {
      id: 'limitation_liability',
      title: '8. Limitation of Liability',
      content: `TO THE MAXIMUM EXTENT PERMITTED BY LAW, PHARMAGUIDE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, OR USE, ARISING FROM YOUR USE OF THE APP.

Our total liability to you for all claims arising from or related to the App shall not exceed the amount you paid for the App in the twelve months preceding the claim.`,
    },
    {
      id: 'termination',
      title: '9. Termination',
      content: `We may terminate or suspend your access to the App at any time, with or without cause, and with or without notice. You may also terminate your use of the App at any time by deleting it from your device.

Upon termination, your right to use the App will cease immediately. Provisions that by their nature should survive termination will remain in effect after termination.`,
    },
    {
      id: 'governing_law',
      title: '10. Governing Law',
      content: `These Terms shall be governed by and construed in accordance with the laws of [Jurisdiction], without regard to its conflict of law provisions.

Any disputes arising from these Terms or your use of the App shall be resolved through binding arbitration in accordance with the rules of [Arbitration Organization].`,
    },
  ];

  const renderSection = (section: TermsSection) => (
    <View key={section.id} style={styles.section}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <Text style={styles.sectionContent}>{section.content}</Text>
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
        <Text style={styles.title}>Terms of Service</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Introduction */}
        <View style={styles.introduction}>
          <Text style={styles.introTitle}>Terms of Service</Text>
          <Text style={styles.introText}>
            Please read these Terms of Service carefully before using Pharmaguide. 
            These terms govern your use of our mobile application and services.
          </Text>
          <Text style={styles.lastUpdated}>Last updated: {lastUpdated}</Text>
        </View>

        {/* Terms Sections */}
        <View style={styles.sectionsContainer}>
          {termsSections.map(renderSection)}
        </View>

        {/* Contact Information */}
        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>Questions About These Terms?</Text>
          <Text style={styles.contactText}>
            If you have any questions about these Terms of Service, please contact us at:
          </Text>
          <Text style={styles.contactEmail}>legal@pharmaguide.com</Text>
          
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => navigation.navigate('ContactSupportScreen')}
            activeOpacity={0.7}
          >
            <Ionicons name="mail" size={18} color={COLORS.white} />
            <Text style={styles.contactButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>

        {/* Acknowledgment */}
        <View style={styles.acknowledgment}>
          <Text style={styles.acknowledgmentText}>
            By continuing to use Pharmaguide, you acknowledge that you have read, 
            understood, and agree to be bound by these Terms of Service.
          </Text>
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
  introduction: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    backgroundColor: COLORS.primaryLight,
    marginBottom: SPACING.lg,
  },
  introTitle: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  introText: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
    lineHeight: 24,
    marginBottom: SPACING.md,
  },
  lastUpdated: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  sectionsContainer: {
    paddingHorizontal: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  sectionContent: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  contactSection: {
    backgroundColor: COLORS.backgroundSecondary,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.xl,
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
    marginBottom: SPACING.sm,
  },
  contactEmail: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.semibold,
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
  acknowledgment: {
    backgroundColor: COLORS.infoLight,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
    padding: SPACING.lg,
    borderRadius: 12,
  },
  acknowledgmentText: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.info,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
});
