// src/components/forms/EnhancedValidatedInput.tsx
// Enhanced input component with real-time validation and improved UX

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';

export interface ValidationRule {
  type: 'required' | 'email' | 'phone' | 'url' | 'number' | 'custom';
  message?: string;
  validator?: (value: string) => boolean | Promise<boolean>;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  asyncValidator?: (
    value: string
  ) => Promise<{ isValid: boolean; message?: string }>;
}

export interface EnhancedValidatedInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;

  // Validation
  rules?: ValidationRule[];
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  debounceMs?: number;

  // UI
  placeholder?: string;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'url';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  secureTextEntry?: boolean;
  editable?: boolean;

  // Styling
  style?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  errorStyle?: TextStyle;

  // Icons
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;

  // Accessibility
  accessibilityLabel?: string;
  accessibilityHint?: string;

  // Advanced features
  showCharacterCount?: boolean;
  maxLength?: number;
  autoCorrect?: boolean;
  autoFocus?: boolean;
  clearButtonMode?: 'never' | 'while-editing' | 'unless-editing' | 'always';
}

export interface ValidationState {
  isValid: boolean;
  isValidating: boolean;
  errors: string[];
  warnings: string[];
  touched: boolean;
  dirty: boolean;
}

export const EnhancedValidatedInput: React.FC<EnhancedValidatedInputProps> = ({
  label,
  value,
  onChangeText,
  onBlur,
  onFocus,
  rules = [],
  validateOnChange = false,
  validateOnBlur = true,
  debounceMs = 300,
  placeholder,
  multiline = false,
  numberOfLines = 1,
  keyboardType = 'default',
  autoCapitalize = 'none',
  secureTextEntry = false,
  editable = true,
  style,
  inputStyle,
  labelStyle,
  errorStyle,
  leftIcon,
  rightIcon,
  onRightIconPress,
  ...props
}) => {
  const [validationState, setValidationState] = useState<ValidationState>({
    isValid: true,
    isValidating: false,
    errors: [],
    warnings: [],
    touched: false,
    dirty: false,
  });

  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const animatedLabelPosition = useRef(
    new Animated.Value(value ? 1 : 0)
  ).current;
  const animatedBorderColor = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);

  // Validation functions
  const validateRequired = (val: string): boolean => {
    return val.trim().length > 0;
  };

  const validateEmail = (val: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(val);
  };

  const validatePhone = (val: string): boolean => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(val.replace(/[\s\-\(\)]/g, ''));
  };

  const validateUrl = (val: string): boolean => {
    try {
      new URL(val);
      return true;
    } catch {
      return false;
    }
  };

  const validateNumber = (val: string): boolean => {
    return !isNaN(Number(val)) && val.trim() !== '';
  };

  // Perform validation
  const performValidation = useCallback(
    async (val: string): Promise<ValidationState> => {
      const errors: string[] = [];
      const warnings: string[] = [];
      let isValidating = false;

      for (const rule of rules) {
        let isValid = true;
        let message = rule.message || `Invalid ${label.toLowerCase()}`;

        switch (rule.type) {
          case 'required':
            isValid = validateRequired(val);
            message = rule.message || `${label} is required`;
            break;
          case 'email':
            isValid = !val || validateEmail(val);
            message = rule.message || 'Please enter a valid email address';
            break;
          case 'phone':
            isValid = !val || validatePhone(val);
            message = rule.message || 'Please enter a valid phone number';
            break;
          case 'url':
            isValid = !val || validateUrl(val);
            message = rule.message || 'Please enter a valid URL';
            break;
          case 'number':
            isValid = !val || validateNumber(val);
            message = rule.message || 'Please enter a valid number';
            break;
          case 'custom':
            if (rule.validator) {
              isValid = await rule.validator(val);
            }
            break;
        }

        // Check length constraints
        if (rule.minLength && val.length < rule.minLength) {
          isValid = false;
          message =
            rule.message || `Minimum ${rule.minLength} characters required`;
        }

        if (rule.maxLength && val.length > rule.maxLength) {
          isValid = false;
          message =
            rule.message || `Maximum ${rule.maxLength} characters allowed`;
        }

        // Check pattern
        if (rule.pattern && val && !rule.pattern.test(val)) {
          isValid = false;
          message = rule.message || 'Invalid format';
        }

        if (!isValid) {
          errors.push(message);
        }

        // Handle async validation
        if (rule.asyncValidator && val) {
          isValidating = true;
          try {
            const result = await rule.asyncValidator(val);
            if (!result.isValid) {
              errors.push(result.message || message);
            }
          } catch (error) {
            console.warn('Async validation error:', error);
          }
          isValidating = false;
        }
      }

      return {
        isValid: errors.length === 0,
        isValidating,
        errors,
        warnings,
        touched: validationState.touched,
        dirty: val !== '',
      };
    },
    [rules, label, validationState.touched]
  );

  // Debounced validation
  const debouncedValidation = useCallback(
    (val: string) => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      debounceTimeoutRef.current = setTimeout(async () => {
        const newState = await performValidation(val);
        setValidationState(newState);
      }, debounceMs);
    },
    [performValidation, debounceMs]
  );

  // Handle text change
  const handleChangeText = useCallback(
    (text: string) => {
      onChangeText(text);

      setValidationState(prev => ({
        ...prev,
        dirty: true,
      }));

      if (validateOnChange) {
        debouncedValidation(text);
      }
    },
    [onChangeText, validateOnChange, debouncedValidation]
  );

  // Handle focus
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    onFocus?.();

    // Animate label
    Animated.timing(animatedLabelPosition, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();

    // Animate border
    Animated.timing(animatedBorderColor, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [onFocus, animatedLabelPosition, animatedBorderColor]);

  // Handle blur
  const handleBlur = useCallback(async () => {
    setIsFocused(false);
    onBlur?.();

    setValidationState(prev => ({
      ...prev,
      touched: true,
    }));

    if (validateOnBlur) {
      const newState = await performValidation(value);
      setValidationState(newState);
    }

    // Animate label back if no value
    if (!value) {
      Animated.timing(animatedLabelPosition, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }

    // Animate border back
    Animated.timing(animatedBorderColor, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [
    onBlur,
    validateOnBlur,
    performValidation,
    value,
    animatedLabelPosition,
    animatedBorderColor,
  ]);

  // Animate label position based on value
  useEffect(() => {
    Animated.timing(animatedLabelPosition, {
      toValue: value || isFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [value, isFocused, animatedLabelPosition]);

  // Get border color based on state
  const getBorderColor = () => {
    if (validationState.isValidating) return COLORS.warning;
    if (validationState.errors.length > 0 && validationState.touched)
      return COLORS.error;
    if (isFocused) return COLORS.primary;
    return COLORS.border;
  };

  // Get icon color
  const getIconColor = () => {
    if (validationState.errors.length > 0 && validationState.touched)
      return COLORS.error;
    if (isFocused) return COLORS.primary;
    return COLORS.textSecondary;
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const characterCount = value.length;
  const isOverLimit = maxLength ? characterCount > maxLength : false;

  return (
    <View
      style={style}
      accessible
      accessibilityLabel={label}
      accessibilityHint={placeholder}
    >
      <Text
        style={[styles.label, labelStyle]}
        accessibilityRole="text"
        accessibilityLabel={
          label + (rules.some(r => r.type === 'required') ? ' (required)' : '')
        }
      >
        {label}
        {rules.some(r => r.type === 'required') && (
          <Text accessibilityLabel="required" style={{ color: COLORS.error }}>
            {' '}
            *
          </Text>
        )}
      </Text>
      <View style={styles.inputWrapper}>
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={20}
            color={COLORS.gray}
            style={styles.icon}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
        )}
        <TextInput
          style={[styles.input, inputStyle]}
          value={value}
          onChangeText={onChangeText}
          onBlur={onBlur}
          onFocus={onFocus}
          placeholder={placeholder}
          multiline={multiline}
          numberOfLines={numberOfLines}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          secureTextEntry={secureTextEntry}
          editable={editable}
          accessible
          accessibilityLabel={label}
          accessibilityHint={placeholder}
          accessibilityState={{
            invalid: !!validationState.errors.length,
            required: rules.some(r => r.type === 'required'),
          }}
          accessibilityRole="textbox"
          {...props}
        />
        {rightIcon && (
          <TouchableOpacity
            onPress={onRightIconPress}
            style={styles.iconButton}
            accessible
            accessibilityRole="button"
            accessibilityLabel={
              rightIcon === 'eye' || rightIcon === 'eye-off'
                ? secureTextEntry
                  ? 'Show password'
                  : 'Hide password'
                : 'Action'
            }
          >
            <Ionicons
              name={rightIcon}
              size={20}
              color={COLORS.gray}
              accessibilityIgnoresInvertColors
            />
          </TouchableOpacity>
        )}
      </View>
      {validationState.errors.length > 0 && validationState.touched && (
        <Text
          style={[styles.error, errorStyle]}
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
        >
          {validationState.errors.join(', ')}
        </Text>
      )}
      {validationState.warnings.length > 0 && (
        <Text style={styles.warning} accessibilityLiveRegion="polite">
          {validationState.warnings.join(', ')}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  labelContainer: {
    position: 'absolute',
    left: SPACING.md,
    top: 0,
    zIndex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.xs,
  },
  label: {
    ...TYPOGRAPHY.caption,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginTop: SPACING.sm,
  },
  input: {
    flex: 1,
    ...TYPOGRAPHY.body,
    color: COLORS.textPrimary,
    paddingVertical: SPACING.xs,
  },
  multilineInput: {
    textAlignVertical: 'top',
    minHeight: 80,
  },
  inputWithLeftIcon: {
    marginLeft: SPACING.sm,
  },
  inputWithRightIcon: {
    marginRight: SPACING.sm,
  },
  leftIcon: {
    marginRight: SPACING.xs,
  },
  rightIconContainer: {
    padding: SPACING.xs,
  },
  statusIcon: {
    marginLeft: SPACING.xs,
  },
  characterCount: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textAlign: 'right',
    marginTop: SPACING.xs,
  },
  characterCountError: {
    color: COLORS.error,
  },
  errorContainer: {
    marginTop: SPACING.xs,
  },
  errorText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.error,
    marginBottom: SPACING.xs,
  },
  warningContainer: {
    marginTop: SPACING.xs,
  },
  warningText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.warning,
    marginBottom: SPACING.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginTop: SPACING.sm,
  },
  icon: {
    marginRight: SPACING.xs,
  },
  iconButton: {
    padding: SPACING.xs,
  },
});
