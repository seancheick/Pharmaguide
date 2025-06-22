// src/components/home/StatsDashboard.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';

interface GameStats {
  points: number;
  level: number;
  levelTitle: string;
  currentStreak: number;
  longestStreak: number;
}

interface StatsDashboardProps {
  gameStats: GameStats;
  onUpgradePress?: () => void;
  showUpgradePrompt?: boolean;
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({
  gameStats,
  onUpgradePress,
  showUpgradePrompt = false,
}) => {
  const getProgressToNextLevel = () => {
    // Simple calculation - you can make this more sophisticated
    const currentLevelBase = (gameStats.level - 1) * 1000;
    const nextLevelBase = gameStats.level * 1000;
    const progress =
      (gameStats.points - currentLevelBase) /
      (nextLevelBase - currentLevelBase);
    return Math.max(0, Math.min(1, progress));
  };

  const progress = getProgressToNextLevel();

  return (
    <View style={styles.container}>
      {/* Level and Progress */}
      <View style={styles.levelCard}>
        <View style={styles.levelHeader}>
          <View style={styles.levelInfo}>
            <Text style={styles.levelTitle}>{gameStats.levelTitle}</Text>
            <Text style={styles.levelSubtitle}>Level {gameStats.level}</Text>
          </View>
          <View style={styles.pointsBadge}>
            <MaterialIcons name="stars" size={16} color={COLORS.warning} />
            <Text style={styles.pointsText}>
              {gameStats.points.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, { width: `${progress * 100}%` }]}
            />
          </View>
          <Text style={styles.progressText}>
            {Math.round(progress * 100)}% to next level
          </Text>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name="flame" size={20} color={COLORS.error} />
          </View>
          <Text style={styles.statValue}>{gameStats.currentStreak}</Text>
          <Text style={styles.statLabel}>Current Streak</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <MaterialIcons
              name="trending-up"
              size={20}
              color={COLORS.success}
            />
          </View>
          <Text style={styles.statValue}>{gameStats.longestStreak}</Text>
          <Text style={styles.statLabel}>Best Streak</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <MaterialIcons
              name="workspace-premium"
              size={20}
              color={COLORS.primary}
            />
          </View>
          <Text style={styles.statValue}>{gameStats.level}</Text>
          <Text style={styles.statLabel}>Level</Text>
        </View>
      </View>

      {/* Upgrade Prompt */}
      {showUpgradePrompt && (
        <TouchableOpacity
          style={styles.upgradeCard}
          onPress={onUpgradePress}
          activeOpacity={0.8}
        >
          <View style={styles.upgradeContent}>
            <View style={styles.upgradeIcon}>
              <MaterialIcons name="upgrade" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.upgradeText}>
              <Text style={styles.upgradeTitle}>Upgrade to Pro</Text>
              <Text style={styles.upgradeSubtitle}>
                Unlock unlimited features
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={COLORS.textSecondary}
            />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  levelCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  levelInfo: {
    flex: 1,
  },
  levelTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  levelSubtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warningLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  pointsText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.warning,
    marginLeft: SPACING.xs,
  },
  progressContainer: {
    marginTop: SPACING.sm,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.gray200,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: SPACING.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  statValue: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  upgradeCard: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  upgradeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  upgradeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  upgradeText: {
    flex: 1,
  },
  upgradeTitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  upgradeSubtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.primary,
  },
});
