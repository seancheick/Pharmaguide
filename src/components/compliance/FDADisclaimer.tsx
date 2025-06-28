// src/components/compliance/FDADisclaimer.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants';

interface FDADisclaimerProps {
  variant?: 'full' | 'compact' | 'modal';
  showIcon?: boolean;
  customText?: string;
}

export const FDADisclaimer: React.FC<FDADisclaimerProps> = ({
  variant = 'full',
  showIcon = true,
  customText,
}) => {
  const getDisclaimerText = () => {
    if (customText) return customText;
    
    switch (variant) {
      case 'compact':
        return 'Educational information only. Consult your healthcare provider.';
      case 'modal':
        return 'This analysis provides educational information only and is not intended to diagnose, treat, cure, or prevent any disease. Always consult your healthcare provider before making changes to your supplement regimen.';
      case 'full':
      default:
        return 'This app provides educational information only and is not intended to diagnose, treat, cure, or prevent any disease. The information presented should not be used as a substitute for professional medical advice, diagnosis, or treatment. Always consult your healthcare provider before making any changes to your supplement regimen or if you have questions about your health.';
    }
  };

  const getContainerStyle = () => {
    switch (variant) {
      case 'compact':
        return [styles.container, styles.compactContainer];
      case 'modal':
        return [styles.container, styles.modalContainer];
      case 'full':
      default:
        return [styles.container, styles.fullContainer];
    }
  };

  return (
    <View style={getContainerStyle()}>
      {showIcon && (
        <Ionicons
          name="information-circle"
          size={variant === 'compact' ? 16 : 20}
          color={COLORS.warning}
          style={styles.icon}
        />
      )}
      <Text style={[
        styles.text,
        variant === 'compact' && styles.compactText
      ]}>
        {getDisclaimerText()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.warningLight,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
    borderRadius: 8,
    padding: SPACING.md,
    marginVertical: SPACING.sm,
  },
  fullContainer: {
    marginHorizontal: SPACING.md,
  },
  compactContainer: {
    padding: SPACING.sm,
    marginVertical: SPACING.xs,
  },
  modalContainer: {
    margin: 0,
    marginBottom: SPACING.md,
  },
  icon: {
    marginRight: SPACING.sm,
    marginTop: 2,
  },
  text: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.sm,
    lineHeight: TYPOGRAPHY.lineHeights.relaxed,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  compactText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    lineHeight: TYPOGRAPHY.lineHeights.normal,
  },
});
