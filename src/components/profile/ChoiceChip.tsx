// src/components/profile/ChoiceChip.tsx
// Reusable choice chip component for health profile selections

import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants';

interface ChoiceChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'default' | 'primary' | 'danger';
}

export const ChoiceChip: React.FC<ChoiceChipProps> = ({
  label,
  selected,
  onPress,
  disabled = false,
  variant = 'default',
}) => {
  const getChipStyle = () => {
    if (disabled) return [styles.chip, styles.chipDisabled];
    if (selected) {
      switch (variant) {
        case 'primary':
          return [styles.chip, styles.chipSelectedPrimary];
        case 'danger':
          return [styles.chip, styles.chipSelectedDanger];
        default:
          return [styles.chip, styles.chipSelected];
      }
    }
    return styles.chip;
  };

  const getTextStyle = () => {
    if (disabled) return [styles.text, styles.textDisabled];
    if (selected) return [styles.text, styles.textSelected];
    return styles.text;
  };

  return (
    <TouchableOpacity
      style={getChipStyle()}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={getTextStyle()}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    marginRight: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  chipSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  chipSelectedPrimary: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  chipSelectedDanger: {
    borderColor: COLORS.error,
    backgroundColor: COLORS.error,
  },
  chipDisabled: {
    borderColor: COLORS.disabled,
    backgroundColor: COLORS.disabled,
    opacity: 0.5,
  },
  text: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.text,
  },
  textSelected: {
    color: COLORS.surface,
    fontWeight: '600',
  },
  textDisabled: {
    color: COLORS.textSecondary,
  },
});