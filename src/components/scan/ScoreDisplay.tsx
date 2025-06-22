// src/components/scan/ScoreDisplay.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';
import type { ProductAnalysis } from '../../types';

interface ScoreDisplayProps {
  analysis: ProductAnalysis;
}

export const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ analysis }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return COLORS.success;
    if (score >= 60) return COLORS.secondary;
    if (score >= 40) return COLORS.warning;
    return COLORS.error;
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  if (analysis.overallScore === undefined) {
    return null;
  }

  return (
    <View>
      {/* Overall Score */}
      <View style={styles.scoreCard}>
        <View style={styles.scoreHeader}>
          <Text style={styles.scoreTitle}>Overall Quality Score</Text>
          <View
            style={[
              styles.scoreBadge,
              { backgroundColor: getScoreColor(analysis.overallScore) },
            ]}
          >
            <Text style={styles.scoreValue}>{analysis.overallScore}</Text>
          </View>
        </View>
        <Text
          style={[
            styles.scoreLabel,
            { color: getScoreColor(analysis.overallScore) },
          ]}
        >
          {getScoreLabel(analysis.overallScore)}
        </Text>
        <Text style={styles.scoreDescription}>
          Based on ingredient quality, bioavailability, dosage optimization,
          and purity standards
        </Text>
      </View>

      {/* Category Scores */}
      {analysis.categoryScores && (
        <View style={styles.categoryCard}>
          <Text style={styles.categoryTitle}>Detailed Breakdown</Text>
          {Object.entries(analysis.categoryScores).map(
            ([category, score]) => (
              <View key={`category-${category}`} style={styles.categoryRow}>
                <Text style={styles.categoryName}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Text>
                <View style={styles.categoryScoreContainer}>
                  <View style={styles.categoryScoreBar}>
                    <View
                      style={[
                        styles.categoryScoreFill,
                        {
                          width: `${score}%`,
                          backgroundColor: getScoreColor(score),
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.categoryScore}>{score}</Text>
                </View>
              </View>
            )
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  scoreCard: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: SPACING.lg,
    marginVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  scoreTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
  },
  scoreBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.background,
  },
  scoreLabel: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.medium,
    marginBottom: SPACING.xs,
  },
  scoreDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  categoryCard: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: SPACING.lg,
    marginVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  categoryTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  categoryName: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
    flex: 1,
  },
  categoryScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryScoreBar: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.gray200,
    borderRadius: 4,
    marginHorizontal: SPACING.sm,
  },
  categoryScoreFill: {
    height: '100%',
    borderRadius: 4,
  },
  categoryScore: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
    width: 30,
    textAlign: 'right',
  },
});
