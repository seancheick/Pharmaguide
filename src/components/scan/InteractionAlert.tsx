// src/components/scan/InteractionAlert.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';
import type { StackInteractionResult, RiskLevel } from '../../types';

interface InteractionAlertProps {
  stackInteraction: StackInteractionResult;
}

export const InteractionAlert: React.FC<InteractionAlertProps> = ({ 
  stackInteraction 
}) => {
  const getRiskColor = (risk: RiskLevel) => {
    switch (risk) {
      case 'CRITICAL':
        return COLORS.error;
      case 'HIGH':
        return COLORS.warning;
      case 'MODERATE':
        return COLORS.accent || COLORS.warning;
      case 'LOW':
        return COLORS.secondary;
      case 'NONE':
      default:
        return COLORS.gray400;
    }
  };

  // Don't render if no interactions
  if (
    !stackInteraction ||
    stackInteraction.overallRiskLevel === 'NONE' ||
    !stackInteraction.interactions
  ) {
    return null;
  }

  return (
    <View
      style={[
        styles.interactionAlert,
        {
          borderColor: getRiskColor(stackInteraction.overallRiskLevel),
        },
      ]}
    >
      <View style={styles.alertHeader}>
        <MaterialIcons
          name="warning"
          size={24}
          color={getRiskColor(stackInteraction.overallRiskLevel)}
        />
        <Text
          style={[
            styles.alertTitle,
            {
              color: getRiskColor(stackInteraction.overallRiskLevel),
            },
          ]}
        >
          Stack Interaction Alert
        </Text>
      </View>

      <Text style={styles.riskLevelText}>
        Risk Level: {stackInteraction.overallRiskLevel}
      </Text>

      {/* Individual Interactions */}
      {stackInteraction.interactions.map((interaction, index) => (
        <View
          key={`interaction-${index}`}
          style={styles.interactionDetailSection}
        >
          <Text style={styles.interactionMessage}>
            {interaction.message}
          </Text>
          {interaction.mechanism && (
            <Text style={styles.mechanismText}>
              Why: {interaction.mechanism}
            </Text>
          )}
          {interaction.recommendation && (
            <Text style={styles.recommendationText}>
              {interaction.recommendation}
            </Text>
          )}
        </View>
      ))}

      {/* Nutrient Warnings */}
      {stackInteraction.nutrientWarnings &&
        stackInteraction.nutrientWarnings.length > 0 && (
          <View style={styles.nutrientWarningsContainer}>
            <Text style={styles.nutrientWarningsTitle}>
              Nutrient Overload Warnings:
            </Text>
            {stackInteraction.nutrientWarnings.map((warning, index) => (
              <View
                key={`nutrient-warning-${index}`}
                style={styles.nutrientWarningItem}
              >
                <Text style={styles.nutrientWarningText}>
                  ⚠️{' '}
                  <Text style={{ fontWeight: 'bold' }}>
                    {warning.nutrient}
                  </Text>
                  : Current {warning.currentTotal} {warning.unit} (
                  {warning.percentOfLimit}% of UL)
                </Text>
                <Text style={styles.nutrientWarningRecommendation}>
                  Recommendation: {warning.recommendation}
                </Text>
              </View>
            ))}
          </View>
        )}

      {/* Educational Disclaimer */}
      <View style={styles.disclaimerContainer}>
        <MaterialIcons
          name="info-outline"
          size={16}
          color={COLORS.textSecondary}
        />
        <Text style={styles.disclaimerText}>
          This information is for educational purposes only. Always
          consult your healthcare provider before making any changes to
          your medications or supplements.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  interactionAlert: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: SPACING.lg,
    marginVertical: SPACING.sm,
    borderWidth: 2,
    borderLeftWidth: 8,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  alertTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginLeft: SPACING.sm,
  },
  riskLevelText: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    marginLeft: SPACING.xl,
  },
  interactionDetailSection: {
    marginBottom: SPACING.md,
    paddingLeft: SPACING.md,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.gray200,
  },
  interactionMessage: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textPrimary,
    lineHeight: 22,
    marginBottom: SPACING.xs,
  },
  mechanismText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.gray600,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  recommendationText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.primaryDark,
    fontWeight: TYPOGRAPHY.weights.medium,
    marginTop: SPACING.xs,
    lineHeight: 18,
  },
  nutrientWarningsContainer: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.gray100,
    borderRadius: 8,
    padding: SPACING.md,
  },
  nutrientWarningsTitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  nutrientWarningItem: {
    marginBottom: SPACING.xs,
  },
  nutrientWarningText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
  },
  nutrientWarningRecommendation: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textTertiary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  disclaimerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.gray100,
    borderRadius: 8,
    padding: SPACING.md,
    marginTop: SPACING.lg,
  },
  disclaimerText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginLeft: SPACING.sm,
  },
});
