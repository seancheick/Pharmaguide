// src/components/common/Button.tsx

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';
import {
  createAccessibleButtonProps,
  useAccessibility,
  AccessibilityHelpers,
} from '../../utils/accessibility';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
}) => {
  const { isReduceMotionEnabled } = useAccessibility();
  const accessibilityProps = createAccessibleButtonProps(
    title,
    loading ? 'Loading, please wait' : undefined,
    disabled || loading
  );

  const buttonStyle = [
    styles.base,
    styles[variant],
    styles[size],
    disabled && styles.disabled,
    style,
  ];

  const textColorStyle = [styles.text, styles[`${variant}Text`], textStyle];

  // Ensure minimum touch target size for accessibility
  const minTouchTarget = AccessibilityHelpers.getMinTouchTargetSize();
  const accessibleStyle = {
    minWidth: minTouchTarget.width,
    minHeight: Math.max(
      minTouchTarget.height,
      buttonStyle.find(s => s?.minHeight)?.minHeight || 0
    ),
  };

  return (
    <TouchableOpacity
      style={[buttonStyle, accessibleStyle]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={isReduceMotionEnabled ? 1 : 0.8}
      {...accessibilityProps}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? COLORS.background : COLORS.primary}
        />
      ) : (
        <>
          {icon}
          <Text style={textColorStyle}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
  },

  // Variants
  primary: {
    backgroundColor: COLORS.primary,
  },
  secondary: {
    backgroundColor: COLORS.secondary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },

  // Sizes
  small: {
    paddingVertical: SPACING.xs,
    minHeight: 36,
  },
  medium: {
    paddingVertical: SPACING.sm,
    minHeight: 44,
  },
  large: {
    paddingVertical: SPACING.md,
    minHeight: 52,
  },

  // States
  disabled: {
    opacity: 0.5,
  },

  // Text styles
  text: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    marginLeft: SPACING.xs,
  },
  primaryText: {
    color: COLORS.background,
  },
  secondaryText: {
    color: COLORS.background,
  },
  outlineText: {
    color: COLORS.primary,
  },
  ghostText: {
    color: COLORS.primary,
  },
});
