// src/utils/inputValidation.ts
import React from 'react';
import { sanitizeText } from './sanitization';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  customValidator?: (value: string) => string | null;
  sanitize?: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
  sanitizedValue?: string;
}

export class InputValidator {
  /**
   * Validate a single input value against rules
   */
  static validate(value: string, rules: ValidationRule): ValidationResult {
    let sanitizedValue = value;
    const warnings: string[] = [];

    // Sanitize input if requested
    if (rules.sanitize) {
      sanitizedValue = sanitizeText(value);
      if (sanitizedValue !== value) {
        warnings.push('Input was sanitized for security');
      }
    }

    // Required validation
    if (
      rules.required &&
      (!sanitizedValue || sanitizedValue.trim().length === 0)
    ) {
      return {
        isValid: false,
        error: 'This field is required',
        sanitizedValue,
      };
    }

    // Skip other validations if empty and not required
    if (!sanitizedValue || sanitizedValue.trim().length === 0) {
      return {
        isValid: true,
        sanitizedValue,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    }

    const trimmedValue = sanitizedValue.trim();

    // Length validations
    if (rules.minLength && trimmedValue.length < rules.minLength) {
      return {
        isValid: false,
        error: `Must be at least ${rules.minLength} characters long`,
        sanitizedValue,
      };
    }

    if (rules.maxLength && trimmedValue.length > rules.maxLength) {
      return {
        isValid: false,
        error: `Must be no more than ${rules.maxLength} characters long`,
        sanitizedValue,
      };
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(trimmedValue)) {
      return {
        isValid: false,
        error: 'Invalid format',
        sanitizedValue,
      };
    }

    // Custom validation
    if (rules.customValidator) {
      const customError = rules.customValidator(trimmedValue);
      if (customError) {
        return {
          isValid: false,
          error: customError,
          sanitizedValue,
        };
      }
    }

    return {
      isValid: true,
      sanitizedValue,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Validate multiple inputs
   */
  static validateForm(
    values: Record<string, string>,
    rules: Record<string, ValidationRule>
  ): {
    isValid: boolean;
    errors: Record<string, string>;
    warnings: Record<string, string[]>;
    sanitizedValues: Record<string, string>;
  } {
    const errors: Record<string, string> = {};
    const warnings: Record<string, string[]> = {};
    const sanitizedValues: Record<string, string> = {};
    let isValid = true;

    for (const [field, value] of Object.entries(values)) {
      const fieldRules = rules[field];
      if (!fieldRules) continue;

      const result = this.validate(value, fieldRules);

      if (!result.isValid) {
        isValid = false;
        if (result.error) {
          errors[field] = result.error;
        }
      }

      if (result.warnings && result.warnings.length > 0) {
        warnings[field] = result.warnings;
      }

      sanitizedValues[field] = result.sanitizedValue || value;
    }

    return {
      isValid,
      errors,
      warnings,
      sanitizedValues,
    };
  }
}

// Predefined validation rules
export const ValidationRules = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    maxLength: 254,
    sanitize: true,
  } as ValidationRule,

  password: {
    required: true,
    minLength: 8,
    maxLength: 128,
    customValidator: (value: string) => {
      if (!/(?=.*[a-z])/.test(value)) {
        return 'Password must contain at least one lowercase letter';
      }
      if (!/(?=.*[A-Z])/.test(value)) {
        return 'Password must contain at least one uppercase letter';
      }
      if (!/(?=.*\d)/.test(value)) {
        return 'Password must contain at least one number';
      }
      if (!/(?=.*[!@#$%^&*])/.test(value)) {
        return 'Password must contain at least one special character (!@#$%^&*)';
      }
      return null;
    },
  } as ValidationRule,

  name: {
    required: true,
    minLength: 1,
    maxLength: 100,
    pattern: /^[a-zA-Z\s'-]+$/,
    sanitize: true,
  } as ValidationRule,

  productName: {
    required: true,
    minLength: 1,
    maxLength: 200,
    sanitize: true,
    customValidator: (value: string) => {
      // Check for suspicious patterns
      if (/<script|javascript:|on\w+=/i.test(value)) {
        return 'Invalid characters detected';
      }
      return null;
    },
  } as ValidationRule,

  dosage: {
    required: true,
    maxLength: 50,
    pattern:
      /^[\d.,\s]+(mg|g|mcg|iu|ml|l|tablets?|capsules?|drops?|tsp|tbsp)$/i,
    sanitize: true,
  } as ValidationRule,

  frequency: {
    required: true,
    maxLength: 100,
    pattern:
      /^(daily|twice daily|three times daily|weekly|as needed|with meals|before meals|after meals|\d+\s*(times?|x)\s*(per\s*)?(day|week|month))$/i,
    sanitize: true,
  } as ValidationRule,

  searchQuery: {
    required: false,
    maxLength: 200,
    sanitize: true,
    customValidator: (value: string) => {
      // Prevent SQL injection patterns
      if (/('|(--)|(\|)|(\*)|(%))/.test(value)) {
        return 'Invalid search characters';
      }
      return null;
    },
  } as ValidationRule,

  notes: {
    required: false,
    maxLength: 1000,
    sanitize: true,
  } as ValidationRule,

  phoneNumber: {
    required: false,
    pattern: /^\+?[\d\s\-\(\)]+$/,
    minLength: 10,
    maxLength: 20,
    sanitize: true,
  } as ValidationRule,

  url: {
    required: false,
    pattern: /^https?:\/\/.+/,
    maxLength: 500,
    sanitize: true,
  } as ValidationRule,
};

// Real-time validation hook
export const useRealTimeValidation = (
  initialValue: string = '',
  rules: ValidationRule,
  debounceMs: number = 300
) => {
  const [value, setValue] = React.useState(initialValue);
  const [validation, setValidation] = React.useState<ValidationResult>({
    isValid: true,
  });
  const [touched, setTouched] = React.useState(false);

  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const validateValue = React.useCallback(
    (val: string) => {
      const result = InputValidator.validate(val, rules);
      setValidation(result);
      return result;
    },
    [rules]
  );

  const handleChange = React.useCallback(
    (newValue: string) => {
      setValue(newValue);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        if (touched) {
          validateValue(newValue);
        }
      }, debounceMs);
    },
    [validateValue, touched, debounceMs]
  );

  const handleBlur = React.useCallback(() => {
    setTouched(true);
    validateValue(value);
  }, [value, validateValue]);

  const reset = React.useCallback(() => {
    setValue(initialValue);
    setValidation({ isValid: true });
    setTouched(false);
  }, [initialValue]);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    value,
    validation,
    touched,
    handleChange,
    handleBlur,
    reset,
    validate: () => validateValue(value),
  };
};
