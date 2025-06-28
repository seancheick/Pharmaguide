// src/components/common/ValidatedInput.tsx
import React, { useState, useCallback } from 'react';
import {
  TextInput,
  StyleSheet,
  TextInputProps,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';
import {
  ValidationResult,
  validateEmail,
  validatePassword,
  validateText,
} from '../../utils/validation';
import { sanitizeText } from '../../utils/sanitization';

export type ValidationType = 'email' | 'password' | 'text' | 'none';

interface ValidatedInputProps
  extends Omit<TextInputProps, 'onChangeText' | 'onBlur'> {
  label?: string;
  error?: string;
  warning?: string;
  validationType?: ValidationType;
  onChangeText?: (text: string) => void;
  onBlur?: () => void;
  onValidation?: (result: ValidationResult) => void;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  sanitizeInput?: boolean;
  showPasswordToggle?: boolean;
  required?: boolean;
  maxLength?: number;
  confirmPassword?: string; // For password confirmation
}

export const ValidatedInput: React.FC<ValidatedInputProps> = ({
  label,
  error,
  warning,
  validationType = 'text',
  onChangeText,
  onBlur,
  onValidation,
  validateOnChange = false,
  validateOnBlur = true,
  sanitizeInput = true,
  showPasswordToggle = false,
  required = false,
  maxLength = 1000,
  confirmPassword,
  style,
  secureTextEntry,
  ...props
}) => {
  const [internalValue, setInternalValue] = useState(props.value || '');
  const [touched, setTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult>({
    isValid: true,
  });

  const validate = useCallback(
    (value: string): ValidationResult => {
      if (!value && !required) {
        return { isValid: true };
      }

      switch (validationType) {
        case 'email':
          return validateEmail(value);
        case 'password':
          return validatePassword(value, confirmPassword);
        case 'text':
          return validateText(value, label || 'Field', {
            required,
            maxLength,
          });
        case 'none':
        default:
          return { isValid: true };
      }
    },
    [validationType, required, maxLength, label, confirmPassword]
  );

  const handleChangeText = useCallback(
    (text: string) => {
      let processedText = text;

      // Sanitize input if enabled
      if (sanitizeInput && validationType !== 'password') {
        processedText = sanitizeText(text, { maxLength });
      }

      setInternalValue(processedText);

      // Validate on change if enabled and field has been touched
      if (validateOnChange && touched) {
        const result = validate(processedText);
        setValidationResult(result);
        onValidation?.(result);
      }

      onChangeText?.(processedText);
    },
    [
      sanitizeInput,
      validationType,
      maxLength,
      validateOnChange,
      touched,
      validate,
      onValidation,
      onChangeText,
    ]
  );

  const handleBlur = useCallback(() => {
    setTouched(true);

    // Validate on blur if enabled
    if (validateOnBlur) {
      const result = validate(internalValue);
      setValidationResult(result);
      onValidation?.(result);
    }

    onBlur?.();
  }, [validateOnBlur, validate, internalValue, onValidation, onBlur]);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  // Determine which error/warning to show
  const displayError = error || (touched && validationResult.error);
  const displayWarning = warning || (touched && validationResult.warnings?.[0]);

  // Determine input state for styling
  const hasError = Boolean(displayError);
  const hasWarning = Boolean(displayWarning && !hasError);
  const isPasswordField = validationType === 'password' || secureTextEntry;

  return (
    <View
      style={style}
      accessible
      accessibilityLabel={label}
      accessibilityHint={props.placeholder}
    >
      {label && (
        <Text
          style={styles.label}
          accessibilityRole="text"
          accessibilityLabel={label + (required ? ' (required)' : '')}
        >
          {label}
          {required && (
            <Text accessibilityLabel="required" style={{ color: COLORS.error }}>
              {' '}
              *
            </Text>
          )}
        </Text>
      )}
      <View
        style={[
          styles.inputContainer,
          hasError && styles.inputContainerError,
          hasWarning && styles.inputContainerWarning,
        ]}
      >
        <TextInput
          {...props}
          style={[
            styles.input,
            hasError && styles.inputError,
            hasWarning && styles.inputWarning,
            style,
          ]}
          value={internalValue}
          onChangeText={handleChangeText}
          onBlur={handleBlur}
          secureTextEntry={isPasswordField && !showPassword}
          placeholderTextColor={COLORS.textTertiary}
          maxLength={maxLength}
          accessible
          accessibilityLabel={label}
          accessibilityHint={props.placeholder}
          accessibilityState={{ invalid: !!error, required }}
          accessibilityRole="textbox"
        />

        {isPasswordField && showPasswordToggle && (
          <TouchableOpacity
            onPress={togglePasswordVisibility}
            style={styles.passwordToggle}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessible
            accessibilityRole="button"
            accessibilityLabel={
              showPassword ? 'Hide password' : 'Show password'
            }
          >
            <Ionicons
              name={showPassword ? 'eye-off' : 'eye'}
              size={20}
              color={COLORS.textSecondary}
              accessibilityIgnoresInvertColors
            />
          </TouchableOpacity>
        )}
      </View>

      {displayError && (
        <Text
          style={styles.errorText}
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
        >
          {displayError}
        </Text>
      )}

      {displayWarning && !hasError && (
        <Text style={styles.warningText} accessibilityLiveRegion="polite">
          {displayWarning}
        </Text>
      )}

      {maxLength && internalValue.length > maxLength * 0.8 && (
        <Text style={styles.characterCount}>
          {internalValue.length}/{maxLength}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  labelError: {
    color: COLORS.error,
  },
  required: {
    color: COLORS.error,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: COLORS.background,
  },
  inputContainerError: {
    borderColor: COLORS.error,
    backgroundColor: `${COLORS.error}05`,
  },
  inputContainerWarning: {
    borderColor: COLORS.warning,
    backgroundColor: `${COLORS.warning}05`,
  },
  input: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textPrimary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minHeight: 44,
  },
  inputError: {
    color: COLORS.textPrimary,
  },
  inputWarning: {
    color: COLORS.textPrimary,
  },
  passwordToggle: {
    padding: SPACING.sm,
    marginRight: SPACING.xs,
  },
  errorText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.error,
    marginLeft: SPACING.xs,
    flex: 1,
  },
  warningText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.warning,
    marginLeft: SPACING.xs,
    flex: 1,
  },
  characterCount: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textTertiary,
    textAlign: 'right',
    marginTop: SPACING.xs,
  },
});
