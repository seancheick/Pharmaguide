// src/components/navigation/BackButton.tsx
// Enhanced back button with navigation guard support

import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';
import { useNavigationGuard } from '../../hooks/useNavigationGuard';

export interface BackButtonProps {
  onPress?: () => void;
  style?: ViewStyle;
  iconStyle?: TextStyle;
  iconSize?: number;
  iconColor?: string;
  disabled?: boolean;
  showLabel?: boolean;
  label?: string;
  labelStyle?: TextStyle;
  
  // Navigation guard props
  hasUnsavedChanges?: boolean;
  onSave?: () => Promise<void> | void;
  onDiscard?: () => Promise<void> | void;
  guardMessage?: string;
  
  // Accessibility
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({
  onPress,
  style,
  iconStyle,
  iconSize = 24,
  iconColor = COLORS.textPrimary,
  disabled = false,
  showLabel = false,
  label = 'Back',
  labelStyle,
  
  // Navigation guard props
  hasUnsavedChanges = false,
  onSave,
  onDiscard,
  guardMessage,
  
  // Accessibility
  accessibilityLabel = 'Go back',
  accessibilityHint = 'Navigate to the previous screen',
}) => {
  const navigation = useNavigation();

  // Set up navigation guard if needed
  const navigationGuard = useNavigationGuard({
    hasUnsavedChanges,
    onSave,
    onDiscard,
    message: guardMessage,
    blockBackButton: false, // We handle this manually
    blockNavigation: false, // We handle this manually
  });

  const handlePress = async () => {
    if (disabled) return;

    if (onPress) {
      // Custom onPress handler
      if (hasUnsavedChanges) {
        const shouldNavigate = await navigationGuard.showUnsavedChangesAlert();
        if (shouldNavigate) {
          onPress();
        }
      } else {
        onPress();
      }
    } else {
      // Default navigation behavior
      if (hasUnsavedChanges) {
        const shouldNavigate = await navigationGuard.showUnsavedChangesAlert();
        if (shouldNavigate && navigation.canGoBack()) {
          navigation.goBack();
        }
      } else if (navigation.canGoBack()) {
        navigation.goBack();
      }
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
    >
      <View style={styles.content}>
        <Ionicons
          name="arrow-back"
          size={iconSize}
          color={disabled ? COLORS.textDisabled : iconColor}
          style={[styles.icon, iconStyle]}
        />
        {showLabel && (
          <Text
            style={[
              styles.label,
              { color: disabled ? COLORS.textDisabled : iconColor },
              labelStyle,
            ]}
          >
            {label}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

/**
 * Back button with save functionality
 */
export const SaveableBackButton: React.FC<
  Omit<BackButtonProps, 'hasUnsavedChanges' | 'onSave'> & {
    hasUnsavedChanges: boolean;
    onSave: () => Promise<void> | void;
  }
> = ({ hasUnsavedChanges, onSave, ...props }) => {
  return (
    <BackButton
      {...props}
      hasUnsavedChanges={hasUnsavedChanges}
      onSave={onSave}
      guardMessage="You have unsaved changes. Would you like to save before going back?"
    />
  );
};

/**
 * Back button for forms with discard option
 */
export const FormBackButton: React.FC<
  Omit<BackButtonProps, 'hasUnsavedChanges' | 'onSave' | 'onDiscard'> & {
    hasUnsavedChanges: boolean;
    onSave?: () => Promise<void> | void;
    onDiscard?: () => Promise<void> | void;
  }
> = ({ hasUnsavedChanges, onSave, onDiscard, ...props }) => {
  return (
    <BackButton
      {...props}
      hasUnsavedChanges={hasUnsavedChanges}
      onSave={onSave}
      onDiscard={onDiscard}
      guardMessage="You have unsaved changes. What would you like to do?"
    />
  );
};

/**
 * Simple back button without guards
 */
export const SimpleBackButton: React.FC<
  Omit<BackButtonProps, 'hasUnsavedChanges' | 'onSave' | 'onDiscard' | 'guardMessage'>
> = (props) => {
  return <BackButton {...props} />;
};

/**
 * Header back button for use in navigation options
 */
export const HeaderBackButton: React.FC<{
  onPress?: () => void;
  hasUnsavedChanges?: boolean;
  onSave?: () => Promise<void> | void;
  tintColor?: string;
}> = ({ onPress, hasUnsavedChanges = false, onSave, tintColor = COLORS.textPrimary }) => {
  return (
    <BackButton
      onPress={onPress}
      hasUnsavedChanges={hasUnsavedChanges}
      onSave={onSave}
      iconColor={tintColor}
      style={styles.headerButton}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.sm,
    borderRadius: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    // Icon styles handled by Ionicons
  },
  label: {
    ...TYPOGRAPHY.body,
    marginLeft: SPACING.xs,
    fontWeight: '500',
  },
  headerButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.xs,
  },
});

/**
 * Navigation header options with back button
 */
export const createBackButtonHeaderOptions = (
  title?: string,
  hasUnsavedChanges?: boolean,
  onSave?: () => Promise<void> | void,
  customBackAction?: () => void
) => ({
  title: title || '',
  headerShown: true,
  headerLeft: () => (
    <HeaderBackButton
      onPress={customBackAction}
      hasUnsavedChanges={hasUnsavedChanges}
      onSave={onSave}
    />
  ),
  headerStyle: {
    backgroundColor: COLORS.background,
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitleStyle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
  },
  headerTintColor: COLORS.textPrimary,
});

/**
 * Back button utilities
 */
export const BackButtonUtils = {
  /**
   * Create navigation options with back button
   */
  createNavigationOptions: (
    title: string,
    hasUnsavedChanges: boolean = false,
    onSave?: () => Promise<void> | void
  ) => ({
    title,
    headerShown: true,
    headerLeft: () => (
      <HeaderBackButton
        hasUnsavedChanges={hasUnsavedChanges}
        onSave={onSave}
      />
    ),
  }),

  /**
   * Create form navigation options
   */
  createFormNavigationOptions: (
    title: string,
    hasUnsavedChanges: boolean,
    onSave: () => Promise<void> | void,
    onDiscard?: () => Promise<void> | void
  ) => ({
    title,
    headerShown: true,
    headerLeft: () => (
      <FormBackButton
        hasUnsavedChanges={hasUnsavedChanges}
        onSave={onSave}
        onDiscard={onDiscard}
      />
    ),
  }),

  /**
   * Check if back navigation should be allowed
   */
  canNavigateBack: (
    hasUnsavedChanges: boolean,
    isFormValid: boolean,
    hasErrors: boolean
  ): boolean => {
    if (!hasUnsavedChanges) return true;
    if (hasErrors) return false;
    return isFormValid;
  },
};
