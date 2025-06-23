// src/screens/profile/AboutScreen.tsx
// 🚀 WORLD-CLASS: Comprehensive About & Legal Hub
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CustomHeader } from '../../components/common';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';
import { AboutScreenProps } from '../../types/navigation';

interface AboutItem {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  external?: boolean;
}

export const AboutScreen: React.FC<AboutScreenProps> = ({ navigation }) => {
  const handleWebsite = () => {
    const url = 'https://pharmaguide.app';
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to open website. Please try again later.');
    });
  };

  const handleSocial = (platform: string) => {
    const urls = {
      twitter: 'https://twitter.com/pharmaguide',
      linkedin: 'https://linkedin.com/company/pharmaguide',
      github: 'https://github.com/pharmaguide',
    };

    const url = urls[platform as keyof typeof urls];
    if (url) {
      Linking.openURL(url).catch(() => {
        Alert.alert('Error', 'Unable to open link. Please try again later.');
      });
    }
  };

  const aboutItems: AboutItem[] = [
    {
      id: 'app_info',
      title: 'App Information',
      description: 'Version, build info, and technical details',
      icon: 'information-circle',
      onPress: () => navigation.navigate('AppInfoScreen'),
    },
    {
      id: 'terms_of_service',
      title: 'Terms of Service',
      description: 'Legal terms and conditions of use',
      icon: 'document-text',
      onPress: () => navigation.navigate('TermsOfServiceScreen'),
    },
    {
      id: 'privacy_policy',
      title: 'Privacy Policy',
      description: 'How we collect, use, and protect your data',
      icon: 'shield-checkmark',
      onPress: () => navigation.navigate('PrivacyPolicyScreen'),
    },
    {
      id: 'credits',
      title: 'Credits & Acknowledgments',
      description: 'Team, contributors, and data sources',
      icon: 'people',
      onPress: () => navigation.navigate('CreditsScreen'),
    },
    {
      id: 'licenses',
      title: 'Open Source Licenses',
      description: 'Third-party libraries and licenses',
      icon: 'code-slash',
      onPress: () => navigation.navigate('LicensesScreen'),
    },
    {
      id: 'website',
      title: 'Visit Our Website',
      description: 'Learn more at pharmaguide.app',
      icon: 'globe',
      external: true,
      onPress: handleWebsite,
    },
  ];

  const appFeatures = [
    {
      icon: 'scan' as keyof typeof Ionicons.glyphMap,
      title: 'Smart Scanning',
      description:
        'Barcode and OCR technology for instant product identification',
    },
    {
      icon: 'analytics' as keyof typeof Ionicons.glyphMap,
      title: 'AI Analysis',
      description: 'Advanced AI evaluates supplement quality and safety',
    },
    {
      icon: 'warning' as keyof typeof Ionicons.glyphMap,
      title: 'Interaction Checking',
      description: 'Real-time analysis of drug and supplement interactions',
    },
    {
      icon: 'person' as keyof typeof Ionicons.glyphMap,
      title: 'Personalized',
      description: 'Recommendations tailored to your health profile',
    },
  ];

  const renderAboutItem = (item: AboutItem) => (
    <TouchableOpacity
      key={item.id}
      style={styles.aboutItem}
      onPress={item.onPress}
      activeOpacity={0.7}
    >
      <View style={styles.aboutHeader}>
        <View style={styles.aboutIconContainer}>
          <Ionicons name={item.icon} size={24} color={COLORS.primary} />
        </View>
        <View style={styles.aboutInfo}>
          <View style={styles.aboutTitleRow}>
            <Text style={styles.aboutTitle}>{item.title}</Text>
            {item.external && (
              <Ionicons name="open" size={16} color={COLORS.textSecondary} />
            )}
          </View>
          <Text style={styles.aboutDescription}>{item.description}</Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={COLORS.textSecondary}
        />
      </View>
    </TouchableOpacity>
  );

  const renderFeature = (feature: (typeof appFeatures)[0], index: number) => (
    <View key={index} style={styles.feature}>
      <View style={styles.featureIcon}>
        <Ionicons name={feature.icon} size={20} color={COLORS.primary} />
      </View>
      <View style={styles.featureContent}>
        <Text style={styles.featureTitle}>{feature.title}</Text>
        <Text style={styles.featureDescription}>{feature.description}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <CustomHeader
        title="About"
        rightElement={
          <TouchableOpacity
            onPress={handleWebsite}
            style={styles.websiteButton}
          >
            <Ionicons name="globe" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        }
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* App Hero */}
        <View style={styles.hero}>
          <View style={styles.appIcon}>
            <Ionicons name="shield-checkmark" size={48} color={COLORS.white} />
          </View>
          <Text style={styles.appName}>Pharmaguide</Text>
          <Text style={styles.appTagline}>
            Your trusted supplement safety companion
          </Text>
          <Text style={styles.appVersion}>Version 1.0.0 (Build 2024.1.0)</Text>
        </View>

        {/* Mission Statement */}
        <View style={styles.mission}>
          <Text style={styles.missionTitle}>Our Mission</Text>
          <Text style={styles.missionText}>
            To empower individuals with accurate, science-based information
            about supplements and medications, helping them make informed
            decisions about their health and safety.
          </Text>
        </View>

        {/* Key Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Features</Text>
          <View style={styles.featuresContainer}>
            {appFeatures.map(renderFeature)}
          </View>
        </View>

        {/* About & Legal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About & Legal</Text>
          <View style={styles.aboutContainer}>
            {aboutItems.map(renderAboutItem)}
          </View>
        </View>

        {/* Social Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connect With Us</Text>
          <View style={styles.socialContainer}>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleSocial('twitter')}
            >
              <Ionicons name="logo-twitter" size={24} color={COLORS.primary} />
              <Text style={styles.socialText}>Twitter</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleSocial('linkedin')}
            >
              <Ionicons name="logo-linkedin" size={24} color={COLORS.primary} />
              <Text style={styles.socialText}>LinkedIn</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleSocial('github')}
            >
              <Ionicons name="logo-github" size={24} color={COLORS.primary} />
              <Text style={styles.socialText}>GitHub</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Company Info */}
        <View style={styles.companyInfo}>
          <Text style={styles.companyName}>Pharmaguide Inc.</Text>
          <Text style={styles.companyAddress}>
            123 Health Tech Blvd{'\n'}
            San Francisco, CA 94105{'\n'}
            United States
          </Text>
          <Text style={styles.companyContact}>
            Email: info@pharmaguide.app{'\n'}
            Phone: 1-800-PHARMA-1
          </Text>
        </View>

        {/* Copyright */}
        <View style={styles.copyright}>
          <Text style={styles.copyrightText}>
            © 2024 Pharmaguide Inc. All rights reserved.
          </Text>
          <Text style={styles.copyrightSubtext}>
            Made with ❤️ for your health and safety
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  websiteButton: {
    padding: SPACING.sm,
  },
  content: {
    flex: 1,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  appIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  appName: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  appTagline: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  appVersion: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  mission: {
    backgroundColor: COLORS.primaryLight,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
    padding: SPACING.lg,
    borderRadius: 16,
  },
  missionTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  missionText: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.primary,
    lineHeight: 22,
  },
  section: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  featuresContainer: {
    gap: SPACING.md,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  featureDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  aboutContainer: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    overflow: 'hidden',
  },
  aboutItem: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  aboutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aboutIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  aboutInfo: {
    flex: 1,
  },
  aboutTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    gap: SPACING.xs,
  },
  aboutTitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    flex: 1,
  },
  aboutDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  socialContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  socialButton: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  socialText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  companyInfo: {
    backgroundColor: COLORS.backgroundSecondary,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
    padding: SPACING.lg,
    borderRadius: 12,
  },
  companyName: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  companyAddress: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: SPACING.sm,
  },
  companyContact: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  copyright: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  copyrightText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  copyrightSubtext: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
