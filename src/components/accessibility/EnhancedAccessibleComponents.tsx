// src/components/accessibility/EnhancedAccessibleComponents.tsx
import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useAccessibility } from '../../hooks/useAccessibility';
import { accessibilityService } from '../../services/accessibility/accessibilityService';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';
import { OptimizedIcon } from '../common/OptimizedIcon';

interface InteractionWarningProps {
  interaction: {
    type: 'warning' | 'caution' | 'info' | 'critical';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    affectedProducts?: string[];
    recommendations?: string[];
  };
  onPress: () => void;
  style?: ViewStyle;
}

/**
 * Enhanced Accessible Interaction Warning Component
 * Provides comprehensive screen reader support for complex interaction warnings
 */
export const EnhancedInteractionWarning: React.FC<InteractionWarningProps> = ({
  interaction,
  onPress,
  style,
}) => {
  const { isScreenReaderEnabled, announceForScreenReader } = useAccessibility();

  // Generate semantic accessibility props
  const accessibilityProps = accessibilityService.generateInteractionDescription(interaction);

  // Announce critical interactions immediately
  useEffect(() => {
    if (interaction.severity === 'critical' && isScreenReaderEnabled) {
      announceForScreenReader(
        `Critical interaction detected: ${interaction.description}`,
        'high'
      );
    }
  }, [interaction, isScreenReaderEnabled, announceForScreenReader]);

  const getIconName = () => {
    switch (interaction.severity) {
      case 'critical': return 'alert-circle';
      case 'high': return 'warning';
      case 'medium': return 'information-circle';
      default: return 'checkmark-circle';
    }
  };

  const getIconColor = () => {
    switch (interaction.severity) {
      case 'critical': return COLORS.error;
      case 'high': return COLORS.warning;
      case 'medium': return COLORS.info;
      default: return COLORS.success;
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      accessible={true}
      accessibilityRole={accessibilityProps.accessibilityRole as any}
      accessibilityLabel={accessibilityProps.accessibilityLabel}
      accessibilityHint={accessibilityProps.accessibilityHint}
      accessibilityState={{
        expanded: false,
      }}
      accessibilityActions={[
        { name: 'activate', label: 'View detailed information' },
        { name: 'longpress', label: 'Quick preview' },
      ]}
      onAccessibilityAction={(event) => {
        switch (event.nativeEvent.actionName) {
          case 'activate':
            onPress();
            break;
          case 'longpress':
            announceForScreenReader(
              `Quick preview: ${interaction.description}. ${interaction.recommendations?.join('. ') || ''}`,
              'high'
            );
            break;
        }
      }}
    >
      <View style={styles.iconContainer}>
        <OptimizedIcon
          type="ion"
          name={getIconName()}
          size={24}
          color={getIconColor()}
        />
      </View>
      
      <View style={styles.contentContainer}>
        <Text style={[styles.title, { color: getIconColor() }]}>
          {interaction.type.charAt(0).toUpperCase() + interaction.type.slice(1)}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {interaction.description}
        </Text>
        
        {interaction.affectedProducts && interaction.affectedProducts.length > 0 && (
          <Text style={styles.affectedProducts}>
            Affects: {interaction.affectedProducts.slice(0, 2).join(', ')}
            {interaction.affectedProducts.length > 2 && ` +${interaction.affectedProducts.length - 2} more`}
          </Text>
        )}
      </View>
      
      <View style={styles.chevronContainer}>
        <OptimizedIcon
          type="ion"
          name="chevron-forward"
          size={16}
          color={COLORS.textSecondary}
        />
      </View>
    </TouchableOpacity>
  );
};

interface ProductAnalysisCardProps {
  analysis: {
    productName: string;
    score: number;
    riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
    interactions: number;
    benefits: number;
    warnings: number;
  };
  onPress: () => void;
  style?: ViewStyle;
}

/**
 * Enhanced Accessible Product Analysis Card
 * Provides semantic descriptions for complex analysis results
 */
export const EnhancedProductAnalysisCard: React.FC<ProductAnalysisCardProps> = ({
  analysis,
  onPress,
  style,
}) => {
  const { isScreenReaderEnabled } = useAccessibility();

  // Generate semantic accessibility props
  const accessibilityProps = accessibilityService.generateProductAnalysisDescription(analysis);

  const getRiskColor = () => {
    switch (analysis.riskLevel) {
      case 'CRITICAL': return COLORS.error;
      case 'HIGH': return COLORS.warning;
      case 'MODERATE': return COLORS.info;
      default: return COLORS.success;
    }
  };

  const getScoreColor = () => {
    if (analysis.score >= 80) return COLORS.success;
    if (analysis.score >= 60) return COLORS.info;
    if (analysis.score >= 40) return COLORS.warning;
    return COLORS.error;
  };

  return (
    <TouchableOpacity
      style={[styles.analysisCard, style]}
      onPress={onPress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityProps.accessibilityLabel}
      accessibilityHint={accessibilityProps.accessibilityHint}
      accessibilityValue={accessibilityProps.accessibilityValue}
      accessibilityState={{
        expanded: false,
      }}
    >
      <View style={styles.analysisHeader}>
        <Text style={styles.productName} numberOfLines={1}>
          {analysis.productName}
        </Text>
        <View style={[styles.riskBadge, { backgroundColor: getRiskColor() }]}>
          <Text style={styles.riskText}>
            {analysis.riskLevel}
          </Text>
        </View>
      </View>

      <View style={styles.scoreContainer}>
        <View style={styles.scoreCircle}>
          <Text style={[styles.scoreText, { color: getScoreColor() }]}>
            {analysis.score}
          </Text>
          <Text style={styles.scoreLabel}>Score</Text>
        </View>

        <View style={styles.metricsContainer}>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{analysis.interactions}</Text>
            <Text style={styles.metricLabel}>Interactions</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{analysis.benefits}</Text>
            <Text style={styles.metricLabel}>Benefits</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{analysis.warnings}</Text>
            <Text style={styles.metricLabel}>Warnings</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

interface StackSummaryProps {
  stack: {
    totalItems: number;
    interactions: number;
    riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
    lastUpdated?: string;
  };
  onPress: () => void;
  style?: ViewStyle;
}

/**
 * Enhanced Accessible Stack Summary Component
 */
export const EnhancedStackSummary: React.FC<StackSummaryProps> = ({
  stack,
  onPress,
  style,
}) => {
  // Generate semantic accessibility props
  const accessibilityProps = accessibilityService.generateStackDescription(stack);

  const getRiskColor = () => {
    switch (stack.riskLevel) {
      case 'CRITICAL': return COLORS.error;
      case 'HIGH': return COLORS.warning;
      case 'MODERATE': return COLORS.info;
      default: return COLORS.success;
    }
  };

  return (
    <TouchableOpacity
      style={[styles.stackSummary, style]}
      onPress={onPress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityProps.accessibilityLabel}
      accessibilityHint={accessibilityProps.accessibilityHint}
    >
      <View style={styles.stackHeader}>
        <OptimizedIcon
          type="ion"
          name="layers"
          size={24}
          color={COLORS.primary}
        />
        <Text style={styles.stackTitle}>My Stack</Text>
        <View style={[styles.riskIndicator, { backgroundColor: getRiskColor() }]} />
      </View>

      <View style={styles.stackMetrics}>
        <View style={styles.stackMetric}>
          <Text style={styles.stackMetricValue}>{stack.totalItems}</Text>
          <Text style={styles.stackMetricLabel}>Items</Text>
        </View>
        <View style={styles.stackMetric}>
          <Text style={[styles.stackMetricValue, { color: getRiskColor() }]}>
            {stack.interactions}
          </Text>
          <Text style={styles.stackMetricLabel}>Interactions</Text>
        </View>
      </View>

      {stack.lastUpdated && (
        <Text style={styles.lastUpdated}>
          Updated {stack.lastUpdated}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    marginVertical: SPACING.xs,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    marginRight: SPACING.md,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginBottom: SPACING.xs,
  },
  description: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  affectedProducts: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textTertiary,
    marginTop: SPACING.xs,
  },
  chevronContainer: {
    marginLeft: SPACING.sm,
  },
  analysisCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.lg,
    marginVertical: SPACING.sm,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  analysisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  productName: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
  },
  riskBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
  },
  riskText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreCircle: {
    alignItems: 'center',
    marginRight: SPACING.lg,
  },
  scoreText: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  scoreLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
  metricsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metric: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
  },
  metricLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
  stackSummary: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.lg,
    marginVertical: SPACING.sm,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  stackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  stackTitle: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
  },
  riskIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  stackMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stackMetric: {
    alignItems: 'center',
  },
  stackMetricValue: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  stackMetricLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  lastUpdated: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
});
