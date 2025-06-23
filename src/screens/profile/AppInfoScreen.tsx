// src/screens/profile/AppInfoScreen.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';
import { AppInfoScreenProps } from '../../types/navigation';

interface AppFeature {
  id: string;
  title: string;
  description: string;
  icon: string;
}

interface AppStat {
  label: string;
  value: string;
  icon: string;
}

export const AppInfoScreen: React.FC<AppInfoScreenProps> = ({ navigation }) => {
  const appVersion = '1.0.0';
  const buildNumber = '100';
  const releaseDate = 'January 2024';

  const appFeatures: AppFeature[] = [
    {
      id: 'scanning',
      title: 'Barcode Scanning',
      description: 'Instantly scan supplement barcodes to add products to your stack',
      icon: 'qr-code-scanner',
    },
    {
      id: 'interactions',
      title: 'Interaction Analysis',
      description: 'Advanced AI-powered analysis of supplement and medication interactions',
      icon: 'warning',
    },
    {
      id: 'stack_management',
      title: 'Stack Management',
      description: 'Organize and track your supplements with detailed information',
      icon: 'layers',
    },
    {
      id: 'health_profile',
      title: 'Health Profile',
      description: 'Personalized recommendations based on your health information',
      icon: 'person',
    },
    {
      id: 'ai_insights',
      title: 'AI Health Insights',
      description: 'Get intelligent recommendations and health tips',
      icon: 'psychology',
    },
  ];

  const appStats: AppStat[] = [
    { label: 'Products in Database', value: '50,000+', icon: 'inventory' },
    { label: 'Known Interactions', value: '25,000+', icon: 'link' },
    { label: 'Active Users', value: '100,000+', icon: 'people' },
    { label: 'Countries Supported', value: '15+', icon: 'public' },
  ];

  const handleRateApp = () => {
    // Open app store for rating
    const appStoreUrl = 'https://apps.apple.com/app/pharmaguide';
    const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.pharmaguide';
    
    // For demo purposes, just show an alert
    console.log('Open app store for rating');
  };

  const handleShareApp = () => {
    // Share app functionality
    console.log('Share app');
  };

  const renderFeature = (feature: AppFeature) => (
    <View key={feature.id} style={styles.featureCard}>
      <View style={styles.featureIcon}>
        <MaterialIcons name={feature.icon as any} size={24} color={COLORS.primary} />
      </View>
      <View style={styles.featureInfo}>
        <Text style={styles.featureTitle}>{feature.title}</Text>
        <Text style={styles.featureDescription}>{feature.description}</Text>
      </View>
    </View>
  );

  const renderStat = (stat: AppStat) => (
    <View key={stat.label} style={styles.statCard}>
      <MaterialIcons name={stat.icon as any} size={24} color={COLORS.primary} />
      <Text style={styles.statValue}>{stat.value}</Text>
      <Text style={styles.statLabel}>{stat.label}</Text>
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
        <Text style={styles.title}>App Information</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* App Logo & Info */}
        <View style={styles.appInfoSection}>
          <View style={styles.appLogo}>
            <MaterialIcons name="medical-services" size={48} color={COLORS.primary} />
          </View>
          <Text style={styles.appName}>Pharmaguide</Text>
          <Text style={styles.appTagline}>Your Personal Supplement Safety Assistant</Text>
          <View style={styles.versionInfo}>
            <Text style={styles.versionText}>Version {appVersion} (Build {buildNumber})</Text>
            <Text style={styles.releaseText}>Released {releaseDate}</Text>
          </View>
        </View>

        {/* App Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>By the Numbers</Text>
          <View style={styles.statsGrid}>
            {appStats.map(renderStat)}
          </View>
        </View>

        {/* Key Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Features</Text>
          <View style={styles.featuresContainer}>
            {appFeatures.map(renderFeature)}
          </View>
        </View>

        {/* Mission Statement */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Mission</Text>
          <View style={styles.missionCard}>
            <Text style={styles.missionText}>
              Pharmaguide is dedicated to empowering individuals to make informed decisions about their 
              supplement and medication regimens. We believe everyone deserves access to accurate, 
              up-to-date information about potential interactions and health implications.
            </Text>
            <Text style={styles.missionSubtext}>
              Our goal is to bridge the gap between complex medical information and everyday health decisions, 
              making supplement safety accessible to everyone.
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleRateApp}
            activeOpacity={0.7}
          >
            <MaterialIcons name="star" size={20} color={COLORS.white} />
            <Text style={styles.actionButtonText}>Rate This App</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={handleShareApp}
            activeOpacity={0.7}
          >
            <MaterialIcons name="share" size={20} color={COLORS.primary} />
            <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
              Share with Friends
            </Text>
          </TouchableOpacity>
        </View>

        {/* Legal Links */}
        <View style={styles.legalSection}>
          <TouchableOpacity
            style={styles.legalLink}
            onPress={() => navigation.navigate('TermsOfServiceScreen')}
            activeOpacity={0.7}
          >
            <Text style={styles.legalLinkText}>Terms of Service</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.legalLink}
            onPress={() => navigation.navigate('PrivacyPolicyScreen')}
            activeOpacity={0.7}
          >
            <Text style={styles.legalLinkText}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.legalLink}
            onPress={() => navigation.navigate('LicensesScreen')}
            activeOpacity={0.7}
          >
            <Text style={styles.legalLinkText}>Open Source Licenses</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Copyright */}
        <View style={styles.copyrightSection}>
          <Text style={styles.copyrightText}>
            © 2024 Pharmaguide. All rights reserved.
          </Text>
          <Text style={styles.copyrightSubtext}>
            Made with ❤️ for your health and safety
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
  appInfoSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  appLogo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  appName: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  appTagline: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  versionInfo: {
    alignItems: 'center',
  },
  versionText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  releaseText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: SPACING.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.sm,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  featuresContainer: {
    gap: SPACING.md,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: SPACING.md,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  featureInfo: {
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
  missionCard: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    padding: SPACING.lg,
  },
  missionText: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textPrimary,
    lineHeight: 24,
    marginBottom: SPACING.md,
  },
  missionSubtext: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  actionsSection: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
    gap: SPACING.md,
  },
  actionButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  secondaryButton: {
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  actionButtonText: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.white,
  },
  secondaryButtonText: {
    color: COLORS.primary,
  },
  legalSection: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  legalLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  legalLinkText: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  copyrightSection: {
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  copyrightText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  copyrightSubtext: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
});
