// src/components/scan/AnalysisSections.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';
import type { ProductAnalysis } from '../../types';

interface AnalysisSectionsProps {
  analysis: ProductAnalysis;
}

export const AnalysisSections: React.FC<AnalysisSectionsProps> = ({ analysis }) => {
  return (
    <View>
      {/* Strengths */}
      {analysis.strengths && analysis.strengths.length > 0 && (
        <View style={styles.strengthsCard}>
          <Text style={styles.strengthsTitle}>✅ Strengths</Text>
          {analysis.strengths.map((strength, index) => (
            <View key={`strength-${index}`} style={styles.strengthItem}>
              <Text style={styles.strengthPoint}>{strength.point}</Text>
              <Text style={styles.strengthDetail}>{strength.detail}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Weaknesses */}
      {analysis.weaknesses && analysis.weaknesses.length > 0 && (
        <View style={styles.weaknessesCard}>
          <Text style={styles.weaknessesTitle}>⚠️ Areas for Improvement</Text>
          {analysis.weaknesses.map((weakness, index) => (
            <View key={`weakness-${index}`} style={styles.weaknessItem}>
              <Text style={styles.weaknessPoint}>{weakness.point}</Text>
              <Text style={styles.weaknessDetail}>{weakness.detail}</Text>
            </View>
          ))}
        </View>
      )}

      {/* AI Reasoning */}
      {analysis.aiReasoning && (
        <View style={styles.reasoningCard}>
          <Text style={styles.reasoningTitle}>🧠 AI Analysis</Text>
          <Text style={styles.reasoningText}>{analysis.aiReasoning}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  strengthsCard: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: SPACING.lg,
    marginVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.success,
    borderLeftWidth: 4,
  },
  strengthsTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.success,
    marginBottom: SPACING.md,
  },
  strengthItem: {
    marginBottom: SPACING.sm,
  },
  strengthPoint: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  strengthDetail: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  weaknessesCard: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: SPACING.lg,
    marginVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.warning,
    borderLeftWidth: 4,
  },
  weaknessesTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.warning,
    marginBottom: SPACING.md,
  },
  weaknessItem: {
    marginBottom: SPACING.sm,
  },
  weaknessPoint: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  weaknessDetail: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  reasoningCard: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: SPACING.lg,
    marginVertical: SPACING.sm,
  },
  reasoningTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  reasoningText: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
});
