// src/components/home/UnifiedGamificationCard.tsx
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { AnimatedScore } from '../common/AnimatedCounter';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';
import type { UserStack, StackInteractionResult } from '../../types';

interface GameStats {
  points: number;
  level: number;
  levelTitle: string;
  currentStreak: number;
  longestStreak: number;
}

interface UnifiedGamificationCardProps {
  gameStats: GameStats;
  stack: UserStack[];
  stackAnalysis?: StackInteractionResult | null;
  onUpgradePress?: () => void;
  showUpgradePrompt?: boolean;
}

export const UnifiedGamificationCard: React.FC<
  UnifiedGamificationCardProps
> = ({
  gameStats,
  stack = [],
  stackAnalysis,
  onUpgradePress,
  showUpgradePrompt = false,
}) => {
  // Animation refs
  const progressAnimatedValue = useRef(new Animated.Value(0)).current;

  // Calculate stack health score
  const calculateStackHealthScore = (): number => {
    if (!stack || stack.length === 0) return 0;

    let baseScore = 75; // Start with a good base score

    if (stackAnalysis) {
      // Adjust score based on risk level
      switch (stackAnalysis.overallRiskLevel) {
        case 'CRITICAL':
          baseScore = Math.max(0, baseScore - 50);
          break;
        case 'HIGH':
          baseScore = Math.max(10, baseScore - 35);
          break;
        case 'MODERATE':
          baseScore = Math.max(30, baseScore - 20);
          break;
        case 'LOW':
          baseScore = Math.max(60, baseScore - 10);
          break;
        case 'NONE':
          baseScore = Math.min(100, baseScore + 10);
          break;
      }

      // Deduct points for interactions
      const interactionPenalty = Math.min(
        30,
        stackAnalysis.interactions.length * 5
      );
      baseScore = Math.max(0, baseScore - interactionPenalty);

      // Deduct points for nutrient warnings
      const nutrientPenalty = Math.min(
        20,
        (stackAnalysis.nutrientWarnings?.length || 0) * 3
      );
      baseScore = Math.max(0, baseScore - nutrientPenalty);
    }

    // Bonus for having items in stack (engagement)
    const stackSizeBonus = Math.min(15, (stack?.length || 0) * 2);
    baseScore = Math.min(100, baseScore + stackSizeBonus);

    return Math.round(baseScore);
  };

  // Get score color based on health score
  const getScoreColor = (score: number): string => {
    if (score >= 80) return COLORS.success;
    if (score >= 50) return COLORS.warning;
    return COLORS.error;
  };

  // Get score label
  const getScoreLabel = (score: number): string => {
    if (score >= 80) return 'Excellent';
    if (score >= 50) return 'Good';
    return 'Poor';
  };

  // Calculate progress to next level
  const getProgressToNextLevel = (): number => {
    const currentLevelBase = (gameStats.level - 1) * 1000;
    const nextLevelBase = gameStats.level * 1000;
    const progress =
      (gameStats.points - currentLevelBase) /
      (nextLevelBase - currentLevelBase);
    return Math.max(0, Math.min(1, progress));
  };

  // Calculate points needed for next level
  const getPointsToNextLevel = (): number => {
    const nextLevelBase = gameStats.level * 1000;
    return Math.max(0, nextLevelBase - gameStats.points);
  };

  const stackHealthScore = calculateStackHealthScore();
  const scoreColor = getScoreColor(stackHealthScore);
  const scoreLabel = getScoreLabel(stackHealthScore);
  const progress = getProgressToNextLevel();
  const pointsToNext = getPointsToNextLevel();

  // Safety check for gameStats
  if (!gameStats) {
    return null;
  }

  // Animate progress when it changes
  useEffect(() => {
    Animated.timing(progressAnimatedValue, {
      toValue: progress,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [progress, progressAnimatedValue]);

  return (
    <View style={styles.container}>
      {/* Main Gamification Card */}
      <View style={styles.card}>
        {/* Header with Level and Points */}
        <View style={styles.header}>
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

        {/* Stack Health Score - Prominent Display */}
        <View style={styles.scoreSection}>
          <View style={styles.scoreContainer}>
            <AnimatedScore
              score={stackHealthScore}
              style={[styles.scoreValue, { color: scoreColor }]}
              getScoreColor={getScoreColor}
              showLabel={true}
              getScoreLabel={getScoreLabel}
              duration={1000}
            />
          </View>
          <View style={styles.scoreInfo}>
            <Text style={styles.scoreTitle}>Stack Health Score</Text>
            <View style={styles.stackInfo}>
              <Ionicons name="layers" size={16} color={COLORS.textSecondary} />
              <Text style={styles.stackText}>
                {stack?.length || 0} item{(stack?.length || 0) !== 1 ? 's' : ''}{' '}
                in your stack
              </Text>
            </View>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {/* Streak */}
          <View style={styles.statItem}>
            <View style={styles.statIcon}>
              <Ionicons name="flame" size={20} color={COLORS.error} />
            </View>
            <Text style={styles.statValue}>{gameStats.currentStreak}</Text>
            <Text style={styles.statLabel}>day streak</Text>
          </View>

          {/* Level Progress */}
          <View style={[styles.statItem, styles.progressItem]}>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      width: progressAnimatedValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                        extrapolate: 'clamp',
                      }),
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {pointsToNext} XP to Level {gameStats.level + 1}
              </Text>
            </View>
          </View>
        </View>

        {/* Upgrade Prompt */}
        {showUpgradePrompt && (
          <TouchableOpacity
            style={styles.upgradePrompt}
            onPress={onUpgradePress}
            activeOpacity={0.8}
          >
            <View style={styles.upgradeContent}>
              <MaterialIcons name="upgrade" size={20} color={COLORS.primary} />
              <Text style={styles.upgradeText}>
                Upgrade to unlock more features
              </Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={COLORS.primary}
              />
            </View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: SPACING.lg,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
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
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warningLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 16,
    elevation: 1,
    shadowColor: COLORS.warning,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  pointsText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.warning,
    marginLeft: SPACING.xs,
  },
  scoreSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  scoreContainer: {
    alignItems: 'center',
    marginRight: SPACING.lg,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: TYPOGRAPHY.weights.bold,
    lineHeight: 52,
  },
  scoreLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  scoreInfo: {
    flex: 1,
  },
  scoreTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  stackInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stackText: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: SPACING.md,
  },
  progressItem: {
    flex: 2,
    alignItems: 'stretch',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  progressContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.gray200,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  upgradePrompt: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    padding: SPACING.md,
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  upgradeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.primary,
    marginHorizontal: SPACING.sm,
    flex: 1,
    textAlign: 'center',
  },
});
