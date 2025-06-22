// src/components/stack/StackStatistics.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';
import type { UserStack, StackInteractionResult } from '../../types';

interface StackStatisticsProps {
  stack: UserStack[];
  analysis: StackInteractionResult | null;
}

export const StackStatistics: React.FC<StackStatisticsProps> = ({
  stack,
  analysis,
}) => {
  const totalItems = stack.length;
  const supplements = stack.filter(item => item.type === 'supplement').length;
  const medications = stack.filter(item => item.type === 'medication').length;
  const interactions = analysis?.interactions.length || 0;
  const nutrientWarnings = analysis?.nutrientWarnings?.length || 0;

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'HIGH':
        return COLORS.error;
      case 'MEDIUM':
        return COLORS.warning;
      case 'LOW':
        return COLORS.info;
      default:
        return COLORS.success;
    }
  };

  const getOverallSafetyStatus = () => {
    if (!analysis) return { text: 'Not analyzed', color: COLORS.textSecondary };

    if (analysis.overallRiskLevel === 'NONE') {
      return { text: 'Safe', color: COLORS.success };
    } else if (analysis.overallRiskLevel === 'LOW') {
      return { text: 'Low risk', color: COLORS.info };
    } else if (analysis.overallRiskLevel === 'MEDIUM') {
      return { text: 'Medium risk', color: COLORS.warning };
    } else {
      return { text: 'High risk', color: COLORS.error };
    }
  };

  const safetyStatus = getOverallSafetyStatus();

  if (totalItems === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Stack Overview</Text>

      <View style={styles.statsGrid}>
        {/* Total Items */}
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <MaterialIcons name="inventory" size={20} color={COLORS.primary} />
          </View>
          <Text style={styles.statNumber}>{totalItems}</Text>
          <Text style={styles.statLabel}>Total Items</Text>
        </View>

        {/* Supplements */}
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name="fitness" size={20} color={COLORS.secondary} />
          </View>
          <Text style={styles.statNumber}>{supplements}</Text>
          <Text style={styles.statLabel}>Supplements</Text>
        </View>

        {/* Medications */}
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <MaterialIcons name="medication" size={20} color={COLORS.accent} />
          </View>
          <Text style={styles.statNumber}>{medications}</Text>
          <Text style={styles.statLabel}>Medications</Text>
        </View>

        {/* Safety Status */}
        <View style={styles.statCard}>
          <View
            style={[
              styles.statIcon,
              { backgroundColor: `${safetyStatus.color}20` },
            ]}
          >
            <MaterialIcons
              name={analysis?.overallSafe ? 'check-circle' : 'warning'}
              size={20}
              color={safetyStatus.color}
            />
          </View>
          <Text style={[styles.statNumber, { color: safetyStatus.color }]}>
            {safetyStatus.text}
          </Text>
          <Text style={styles.statLabel}>Safety</Text>
        </View>
      </View>

      {/* Interaction Summary */}
      {analysis && (interactions > 0 || nutrientWarnings > 0) && (
        <View style={styles.alertSummary}>
          <View style={styles.alertHeader}>
            <MaterialIcons name="info" size={16} color={COLORS.textSecondary} />
            <Text style={styles.alertTitle}>Alerts Summary</Text>
          </View>

          <View style={styles.alertStats}>
            {interactions > 0 && (
              <View style={styles.alertItem}>
                <MaterialIcons
                  name="error-outline"
                  size={16}
                  color={getRiskColor(analysis.overallRiskLevel)}
                />
                <Text style={styles.alertText}>
                  {interactions} interaction{interactions > 1 ? 's' : ''}
                </Text>
              </View>
            )}

            {nutrientWarnings > 0 && (
              <View style={styles.alertItem}>
                <MaterialIcons
                  name="warning"
                  size={16}
                  color={COLORS.warning}
                />
                <Text style={styles.alertText}>
                  {nutrientWarnings} nutrient warning
                  {nutrientWarnings > 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: SPACING.lg,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: SPACING.md,
    alignItems: 'center',
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${COLORS.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  statNumber: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs / 2,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  alertSummary: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.md,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  alertTitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },
  alertStats: {
    gap: SPACING.xs,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  alertText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textPrimary,
  },
});
