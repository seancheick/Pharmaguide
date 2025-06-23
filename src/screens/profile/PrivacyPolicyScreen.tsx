// src/screens/profile/PrivacyPolicyScreen.tsx
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
import { PrivacyPolicyScreenProps } from '../../types/navigation';

interface PrivacySection {
  id: string;
  title: string;
  content: string;
}

export const PrivacyPolicyScreen: React.FC<PrivacyPolicyScreenProps> = ({ navigation }) => {
  const lastUpdated = 'January 15, 2024';

  const privacySections: PrivacySection[] = [
    {
      id: 'introduction',
      title: '1. Introduction',
      content: `This Privacy Policy describes how Pharmaguide ("we," "us," or "our") collects, uses, and protects your personal information when you use our mobile application.

We are committed to protecting your privacy and ensuring the security of your personal health information. This policy explains what information we collect, how we use it, and your rights regarding your data.`,
    },
    {
      id: 'information_collected',
      title: '2. Information We Collect',
      content: `We collect several types of information:

Personal Information:
• Name, email address, and contact information
• Date of birth and demographic information
• Health conditions, medications, and allergies
• Supplement usage and health goals

Usage Information:
• App usage patterns and feature interactions
• Device information (model, operating system, unique identifiers)
• Log data (IP address, access times, pages viewed)

User-Generated Content:
• Product reviews and ratings
• Submitted product information and corrections
• Support communications`,
    },
    {
      id: 'how_we_use',
      title: '3. How We Use Your Information',
      content: `We use your information to:

Provide Services:
• Analyze supplement and medication interactions
• Provide personalized health recommendations
• Maintain your supplement stack and health profile

Improve Our App:
• Enhance app functionality and user experience
• Develop new features and services
• Conduct research and analytics

Communication:
• Send important safety alerts and notifications
• Provide customer support
• Send updates about app features (with your consent)

Legal Compliance:
• Comply with applicable laws and regulations
• Protect our rights and prevent fraud`,
    },
    {
      id: 'information_sharing',
      title: '4. Information Sharing',
      content: `We do not sell your personal information to third parties. We may share your information only in these limited circumstances:

Service Providers:
• Third-party services that help us operate the app
• Cloud storage and analytics providers
• Customer support platforms

Legal Requirements:
• When required by law or legal process
• To protect our rights or the safety of users
• In connection with a business transaction (merger, acquisition)

Anonymized Data:
• We may share aggregated, anonymized data for research purposes
• This data cannot be used to identify individual users`,
    },
    {
      id: 'data_security',
      title: '5. Data Security',
      content: `We implement comprehensive security measures to protect your information:

Technical Safeguards:
• Encryption of data in transit and at rest
• Secure authentication and access controls
• Regular security audits and monitoring

Organizational Measures:
• Employee training on data protection
• Limited access to personal information
• Incident response procedures

However, no method of transmission over the internet is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.`,
    },
    {
      id: 'your_rights',
      title: '6. Your Privacy Rights',
      content: `You have the following rights regarding your personal information:

Access and Portability:
• Request a copy of your personal data
• Export your data in a portable format

Correction and Deletion:
• Correct inaccurate personal information
• Request deletion of your personal data

Control and Consent:
• Opt out of non-essential communications
• Withdraw consent for data processing
• Control sharing of your information

To exercise these rights, contact us through the app or at privacy@pharmaguide.com.`,
    },
    {
      id: 'data_retention',
      title: '7. Data Retention',
      content: `We retain your personal information only as long as necessary to:

• Provide our services to you
• Comply with legal obligations
• Resolve disputes and enforce agreements

When you delete your account:
• Personal information is deleted within 30 days
• Some information may be retained for legal compliance
• Anonymized data may be retained for research purposes`,
    },
    {
      id: 'international_transfers',
      title: '8. International Data Transfers',
      content: `Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place:

• Standard contractual clauses for data transfers
• Adequacy decisions by relevant authorities
• Other legally recognized transfer mechanisms

We take steps to ensure your information receives the same level of protection regardless of where it is processed.`,
    },
    {
      id: 'children_privacy',
      title: '9. Children\'s Privacy',
      content: `Our app is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.

If we become aware that we have collected personal information from a child under 13, we will take steps to delete such information promptly.

Parents who believe their child has provided personal information should contact us immediately.`,
    },
    {
      id: 'changes_policy',
      title: '10. Changes to This Policy',
      content: `We may update this Privacy Policy from time to time. When we make changes:

• We will notify you through the app or by email
• The updated policy will be posted in the app
• Your continued use constitutes acceptance of changes

We encourage you to review this policy periodically to stay informed about how we protect your information.`,
    },
  ];

  const renderSection = (section: PrivacySection) => (
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
        <Text style={styles.title}>Privacy Policy</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Introduction */}
        <View style={styles.introduction}>
          <MaterialIcons name="privacy-tip" size={32} color={COLORS.primary} />
          <Text style={styles.introTitle}>Your Privacy Matters</Text>
          <Text style={styles.introText}>
            We are committed to protecting your personal information and being transparent 
            about how we collect, use, and share your data.
          </Text>
          <Text style={styles.lastUpdated}>Last updated: {lastUpdated}</Text>
        </View>

        {/* Privacy Sections */}
        <View style={styles.sectionsContainer}>
          {privacySections.map(renderSection)}
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.actionsTitle}>Manage Your Privacy</Text>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('PrivacySettingsScreen')}
            activeOpacity={0.7}
          >
            <MaterialIcons name="settings" size={20} color={COLORS.primary} />
            <Text style={styles.actionButtonText}>Privacy Settings</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => console.log('Request data export')}
            activeOpacity={0.7}
          >
            <MaterialIcons name="download" size={20} color={COLORS.primary} />
            <Text style={styles.actionButtonText}>Export My Data</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => console.log('Delete account')}
            activeOpacity={0.7}
          >
            <MaterialIcons name="delete" size={20} color={COLORS.error} />
            <Text style={[styles.actionButtonText, { color: COLORS.error }]}>Delete My Account</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Contact Information */}
        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>Questions About Your Privacy?</Text>
          <Text style={styles.contactText}>
            If you have questions about this Privacy Policy or how we handle your data, 
            please contact our privacy team.
          </Text>
          <Text style={styles.contactEmail}>privacy@pharmaguide.com</Text>
          
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => navigation.navigate('ContactSupportScreen')}
            activeOpacity={0.7}
          >
            <MaterialIcons name="support-agent" size={18} color={COLORS.white} />
            <Text style={styles.contactButtonText}>Contact Privacy Team</Text>
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
  introduction: {
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    backgroundColor: COLORS.primaryLight,
    marginBottom: SPACING.lg,
  },
  introTitle: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  introText: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
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
  actionsSection: {
    backgroundColor: COLORS.backgroundSecondary,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.xl,
    padding: SPACING.lg,
    borderRadius: 12,
  },
  actionsTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
    gap: SPACING.md,
  },
  actionButtonText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.weights.medium,
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
});
