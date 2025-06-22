// src/components/stack/InteractionDisplay.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';
import type { StackInteractionResult, RiskLevel } from '../../types';

interface InteractionDisplayProps {
  analysis: StackInteractionResult;
  getRiskColor: (level: RiskLevel) => string;
}

export const InteractionDisplay: React.FC<InteractionDisplayProps> = ({
  analysis,
  getRiskColor,
}) => {
  if (!analysis || (analysis.interactions.length === 0 && (!analysis.nutrientWarnings || analysis.nutrientWarnings.length === 0))) {
    return null;
  }

  return (
    <>
      {/* Interactions Detail */}
      {analysis.interactions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interaction Details</Text>
          {analysis.interactions.map((interaction, index) => (
            <View key={index} style={styles.interactionCard}>
              <View style={styles.interactionHeader}>
                <MaterialIcons
                  name="error-outline"
                  size={20}
                  color={getRiskColor(interaction.severity)}
                />
                <Text style={styles.interactionItems}>
                  {interaction.message}
                </Text>
              </View>
              <Text
                style={[
                  styles.riskLevel,
                  { color: getRiskColor(interaction.severity) },
                ]}
              >
                {interaction.severity} Risk
              </Text>
              {interaction.mechanism && (
                <Text style={styles.interactionMessage}>
                  **Why:** {interaction.mechanism}
                </Text>
              )}
              {interaction.recommendation && (
                <Text style={styles.interactionMessage}>
                  **Recommendation:** {interaction.recommendation}
                </Text>
              )}
              {interaction.evidenceSources &&
                interaction.evidenceSources.length > 0 && (
                  <View style={styles.evidenceSourcesContainer}>
                    <Text style={styles.evidenceSourcesTitle}>
                      Evidence:
                    </Text>
                    {interaction.evidenceSources.map((source, sIndex) => (
                      <View key={sIndex} style={styles.evidenceSourceBadge}>
                        <Text style={styles.evidenceSourceText}>
                          {source.badge}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
            </View>
          ))}
        </View>
      )}

      {/* Nutrient Warnings Detail */}
      {analysis.nutrientWarnings &&
        analysis.nutrientWarnings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Nutrient Overload Warnings
            </Text>
            {analysis.nutrientWarnings.map((warning, index) => (
              <View
                key={`nutrient-warning-${index}`}
                style={styles.interactionCard}
              >
                <View style={styles.interactionHeader}>
                  <MaterialIcons
                    name="warning"
                    size={20}
                    color={getRiskColor(warning.severity)}
                  />
                  <Text style={styles.interactionItems}>
                    {warning.nutrient} Overload
                  </Text>
                </View>
                <Text
                  style={[
                    styles.riskLevel,
                    { color: getRiskColor(warning.severity) },
                  ]}
                >
                  {warning.severity} Risk
                </Text>
                <Text style={styles.interactionMessage}>
                  Current: {warning.currentTotal} {warning.unit} (Upper
                  Limit: {warning.upperLimit} {warning.unit})
                </Text>
                {warning.recommendation && (
                  <Text style={styles.interactionMessage}>
                    **Recommendation:** {warning.recommendation}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}
    </>
  );
};

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  interactionCard: {
    backgroundColor: COLORS.backgroundSecondary,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.sm,
  },
  interactionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  interactionItems: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
    marginLeft: SPACING.xs,
    flexShrink: 1,
  },
  riskLevel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginBottom: SPACING.xs,
    marginLeft: SPACING.lg,
  },
  interactionMessage: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.xs / 2,
  },
  evidenceSourcesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    flexWrap: 'wrap',
  },
  evidenceSourcesTitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
    marginRight: SPACING.xs,
  },
  evidenceSourceBadge: {
    backgroundColor: COLORS.gray300,
    borderRadius: 6,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    marginRight: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  evidenceSourceText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
});
