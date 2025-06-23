// src/screens/profile/ContributionsScreen.tsx
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
import { ContributionsScreenProps } from '../../types/navigation';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
  progress?: number;
  maxProgress?: number;
}

interface ContributionStat {
  label: string;
  value: number;
  icon: string;
  color: string;
}

export const ContributionsScreen: React.FC<ContributionsScreenProps> = ({ navigation }) => {
  // Mock data - would come from API
  const stats: ContributionStat[] = [
    { label: 'Total Points', value: 1250, icon: 'star', color: COLORS.warning },
    { label: 'Products Added', value: 8, icon: 'add-circle', color: COLORS.success },
    { label: 'Issues Reported', value: 12, icon: 'warning', color: COLORS.error },
    { label: 'Corrections Made', value: 5, icon: 'create', color: COLORS.info },
  ];

  const achievements: Achievement[] = [
    {
      id: '1',
      title: 'First Contribution',
      description: 'Made your first submission',
      icon: 'trophy',
      earned: true,
    },
    {
      id: '2',
      title: 'Product Hunter',
      description: 'Added 5 new products',
      icon: 'search',
      earned: true,
    },
    {
      id: '3',
      title: 'Quality Assurance',
      description: 'Report 10 issues',
      icon: 'shield-checkmark',
      earned: true,
      progress: 12,
      maxProgress: 10,
    },
    {
      id: '4',
      title: 'Data Perfectionist',
      description: 'Make 20 corrections',
      icon: 'checkmark-circle',
      earned: false,
      progress: 5,
      maxProgress: 20,
    },
    {
      id: '5',
      title: 'Community Champion',
      description: 'Earn 2000 points',
      icon: 'people',
      earned: false,
      progress: 1250,
      maxProgress: 2000,
    },
  ];

  const renderStatCard = (stat: ContributionStat) => (
    <View key={stat.label} style={[styles.statCard, { borderLeftColor: stat.color }]}>
      <View style={styles.statHeader}>
        <MaterialIcons name={stat.icon as any} size={20} color={stat.color} />
        <Text style={styles.statValue}>{stat.value.toLocaleString()}</Text>
      </View>
      <Text style={styles.statLabel}>{stat.label}</Text>
    </View>
  );

  const renderAchievement = (achievement: Achievement) => (
    <View
      key={achievement.id}
      style={[
        styles.achievementCard,
        achievement.earned && styles.earnedAchievement,
      ]}
    >
      <View style={styles.achievementHeader}>
        <View style={[
          styles.achievementIcon,
          { backgroundColor: achievement.earned ? COLORS.warning : COLORS.gray200 }
        ]}>
          <MaterialIcons
            name={achievement.icon as any}
            size={24}
            color={achievement.earned ? COLORS.white : COLORS.textSecondary}
          />
        </View>
        <View style={styles.achievementInfo}>
          <Text style={[
            styles.achievementTitle,
            !achievement.earned && styles.unearned,
          ]}>
            {achievement.title}
          </Text>
          <Text style={styles.achievementDescription}>
            {achievement.description}
          </Text>
        </View>
        {achievement.earned && (
          <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
        )}
      </View>
      
      {achievement.progress !== undefined && achievement.maxProgress && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min((achievement.progress / achievement.maxProgress) * 100, 100)}%`,
                  backgroundColor: achievement.earned ? COLORS.success : COLORS.primary,
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {achievement.progress} / {achievement.maxProgress}
          </Text>
        </View>
      )}
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
        <Text style={styles.title}>My Contributions</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.hero}>
          <MaterialIcons name="star" size={40} color={COLORS.warning} />
          <Text style={styles.heroTitle}>Community Contributor</Text>
          <Text style={styles.heroSubtitle}>
            Thank you for helping improve Pharmaguide for everyone!
          </Text>
        </View>

        {/* Stats Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Impact</Text>
          <View style={styles.statsGrid}>
            {stats.map(renderStatCard)}
          </View>
        </View>

        {/* Achievements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <View style={styles.achievementsContainer}>
            {achievements.map(renderAchievement)}
          </View>
        </View>

        {/* Contribution Guidelines */}
        <View style={styles.guidelines}>
          <MaterialIcons name="info" size={20} color={COLORS.info} />
          <Text style={styles.guidelinesText}>
            Keep contributing to unlock more achievements and earn points! 
            Your contributions help make our database more accurate and comprehensive.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('ReportIssueScreen')}
            activeOpacity={0.7}
          >
            <MaterialIcons name="report-problem" size={20} color={COLORS.white} />
            <Text style={styles.actionButtonText}>Report Issue</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => navigation.navigate('MySubmissionsScreen')}
            activeOpacity={0.7}
          >
            <MaterialIcons name="history" size={20} color={COLORS.primary} />
            <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
              View Submissions
            </Text>
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
  statLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  achievementsContainer: {
    gap: SPACING.md,
  },
  achievementCard: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  earnedAchievement: {
    borderColor: COLORS.warning,
    backgroundColor: COLORS.warningLight,
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  unearned: {
    color: COLORS.textSecondary,
  },
  achievementDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  progressContainer: {
    marginTop: SPACING.sm,
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.gray200,
    borderRadius: 3,
    marginBottom: SPACING.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    textAlign: 'right',
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
  actionsContainer: {
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
});
