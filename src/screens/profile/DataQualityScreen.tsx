// src/screens/profile/DataQualityScreen.tsx
// 🚀 WORLD-CLASS: Data Quality & Contributions Hub
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';
import { DataQualityScreenProps } from '../../types/navigation';

interface DataQualityItem {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  badge?: number;
  onPress: () => void;
}

export const DataQualityScreen: React.FC<DataQualityScreenProps> = ({ navigation }) => {
  // Mock data - would come from actual service
  const stats = {
    submissionsCount: 3,
    pendingReviews: 2,
    approvedSubmissions: 8,
    contributionPoints: 150,
  };

  const dataQualityItems: DataQualityItem[] = [
    {
      id: 'report_issue',
      title: 'Report an Issue',
      description: 'Found incorrect product info or missing data?',
      icon: 'report-problem',
      onPress: () => navigation.navigate('ReportIssueScreen'),
    },
    {
      id: 'my_submissions',
      title: 'My Submissions',
      description: 'Track your product submissions and reviews',
      icon: 'upload',
      badge: stats.submissionsCount,
      onPress: () => navigation.navigate('MySubmissionsScreen'),
    },
    {
      id: 'contributions',
      title: 'My Contributions',
      description: 'View your contribution history and rewards',
      icon: 'star',
      onPress: () => navigation.navigate('ContributionsScreen'),
    },
  ];

  const handleQuickReport = () => {
    Alert.alert(
      'Quick Report',
      'What type of issue would you like to report?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Missing Product', onPress: () => console.log('Missing product') },
        { text: 'Wrong Information', onPress: () => console.log('Wrong info') },
        { text: 'Other Issue', onPress: () => navigation.navigate('ReportIssueScreen') },
      ]
    );
  };

  const renderDataQualityItem = (item: DataQualityItem) => (
    <TouchableOpacity
      key={item.id}
      style={styles.qualityItem}
      onPress={item.onPress}
      activeOpacity={0.7}
    >
      <View style={styles.qualityHeader}>
        <View style={styles.qualityIconContainer}>
          <MaterialIcons
            name={item.icon}
            size={24}
            color={COLORS.primary}
          />
        </View>
        <View style={styles.qualityInfo}>
          <View style={styles.qualityTitleRow}>
            <Text style={styles.qualityTitle}>{item.title}</Text>
            {item.badge && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.badge}</Text>
              </View>
            )}
          </View>
          <Text style={styles.qualityDescription}>{item.description}</Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={COLORS.textSecondary}
        />
      </View>
    </TouchableOpacity>
  );

  const renderStatCard = (title: string, value: number, icon: keyof typeof MaterialIcons.glyphMap, color: string) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <MaterialIcons name={icon} size={20} color={color} />
        <Text style={styles.statValue}>{value}</Text>
      </View>
      <Text style={styles.statTitle}>{title}</Text>
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
        <Text style={styles.title}>Data Quality</Text>
        <TouchableOpacity onPress={handleQuickReport} style={styles.quickReportButton}>
          <Ionicons name="add" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.hero}>
          <MaterialIcons name="verified" size={40} color={COLORS.success} />
          <Text style={styles.heroTitle}>Help Improve Our Database</Text>
          <Text style={styles.heroSubtitle}>
            Your contributions help make Pharmaguide more accurate and comprehensive for everyone
          </Text>
        </View>

        {/* Stats Overview */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Your Impact</Text>
          <View style={styles.statsGrid}>
            {renderStatCard('Pending Reviews', stats.pendingReviews, 'hourglass-empty', COLORS.warning)}
            {renderStatCard('Approved', stats.approvedSubmissions, 'check-circle', COLORS.success)}
            {renderStatCard('Total Submissions', stats.submissionsCount, 'upload', COLORS.info)}
            {renderStatCard('Points Earned', stats.contributionPoints, 'star', COLORS.primary)}
          </View>
        </View>

        {/* Data Quality Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Quality Actions</Text>
          <View style={styles.qualityContainer}>
            {dataQualityItems.map(renderDataQualityItem)}
          </View>
        </View>

        {/* How It Works */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          <View style={styles.howItWorksContainer}>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Submit</Text>
                <Text style={styles.stepDescription}>
                  Report issues or submit missing product information
                </Text>
              </View>
            </View>
            
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Review</Text>
                <Text style={styles.stepDescription}>
                  Our team reviews your submission for accuracy
                </Text>
              </View>
            </View>
            
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Reward</Text>
                <Text style={styles.stepDescription}>
                  Earn points and help improve the app for everyone
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Community Guidelines */}
        <View style={styles.guidelines}>
          <MaterialIcons name="info" size={20} color={COLORS.info} />
          <Text style={styles.guidelinesText}>
            Please ensure all submissions are accurate and follow our community guidelines. 
            False or misleading information may result in account restrictions.
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
  quickReportButton: {
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
  heroTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  heroSubtitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
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
  statsSection: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
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
    borderLeftWidth: 4,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  statValue: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  statTitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  qualityContainer: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    overflow: 'hidden',
  },
  qualityItem: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  qualityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qualityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  qualityInfo: {
    flex: 1,
  },
  qualityTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  qualityTitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    flex: 1,
  },
  badge: {
    backgroundColor: COLORS.error,
    borderRadius: 10,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    marginLeft: SPACING.sm,
  },
  badgeText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  qualityDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  howItWorksContainer: {
    gap: SPACING.lg,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.white,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  stepDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  guidelines: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.infoLight,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
    padding: SPACING.md,
    borderRadius: 12,
    gap: SPACING.sm,
  },
  guidelinesText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.info,
    lineHeight: 18,
  },
});
