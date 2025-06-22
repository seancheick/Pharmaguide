// src/hooks/useFormValidation.ts
import { useState, useCallback, useMemo } from 'react';
import { 
  ValidationResult, 
  ValidationOptions,
  validateEmail,
  validatePassword,
  validateText,
  validateDosage,
  validateFrequency,
  sanitizeText
} from '../utils/validation';

export type ValidatorType = 
  | 'email' 
  | 'password' 
  | 'text' 
  | 'dosage' 
  | 'frequency' 
  | 'custom';

export interface FieldConfig {
  validator: ValidatorType;
  options?: ValidationOptions;
  customValidator?: (value: string) => ValidationResult;
  sanitize?: boolean;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

export interface FieldState {
  value: string;
  error?: string;
  warnings?: string[];
  touched: boolean;
  isValid: boolean;
}

export interface FormConfig {
  [fieldName: string]: FieldConfig;
}

export interface UseFormValidationReturn {
  fields: { [fieldName: string]: FieldState };
  setValue: (fieldName: string, value: string) => void;
  setTouched: (fieldName: string, touched?: boolean) => void;
  validateField: (fieldName: string) => ValidationResult;
  validateForm: () => boolean;
  resetForm: () => void;
  resetField: (fieldName: string) => void;
  isFormValid: boolean;
  hasErrors: boolean;
  getFieldProps: (fieldName: string) => {
    value: string;
    onChangeText: (text: string) => void;
    onBlur: () => void;
    error?: string;
  };
}

export const useFormValidation = (
  config: FormConfig,
  initialValues: { [fieldName: string]: string } = {}
): UseFormValidationReturn => {
  
  // Initialize field states
  const [fields, setFields] = useState<{ [fieldName: string]: FieldState }>(() => {
    const initialFields: { [fieldName: string]: FieldState } = {};
    
    Object.keys(config).forEach(fieldName => {
      initialFields[fieldName] = {
        value: initialValues[fieldName] || '',
        touched: false,
        isValid: true,
      };
    });
    
    return initialFields;
  });

  // Get validator function based on type
  const getValidator = useCallback((
    validatorType: ValidatorType,
    fieldName: string,
    options?: ValidationOptions,
    customValidator?: (value: string) => ValidationResult
  ) => {
    switch (validatorType) {
      case 'email':
        return validateEmail;
      case 'password':
        return (value: string) => {
          // For password confirmation, check if there's a confirmPassword field
          const confirmField = fields[`${fieldName}Confirm`] || fields['confirmPassword'];
          return validatePassword(value, confirmField?.value);
        };
      case 'text':
        return (value: string) => validateText(value, fieldName, options);
      case 'dosage':
        return validateDosage;
      case 'frequency':
        return validateFrequency;
      case 'custom':
        return customValidator || (() => ({ isValid: true }));
      default:
        return () => ({ isValid: true });
    }
  }, [fields]);

  // Validate a single field
  const validateField = useCallback((fieldName: string): ValidationResult => {
    const fieldConfig = config[fieldName];
    const fieldState = fields[fieldName];
    
    if (!fieldConfig || !fieldState) {
      return { isValid: true };
    }

    const validator = getValidator(
      fieldConfig.validator,
      fieldName,
      fieldConfig.options,
      fieldConfig.customValidator
    );

    return validator(fieldState.value);
  }, [config, fields, getValidator]);

  // Set field value with optional validation
  const setValue = useCallback((fieldName: string, value: string) => {
    const fieldConfig = config[fieldName];
    
    if (!fieldConfig) return;

    // Sanitize if configured
    const sanitizedValue = fieldConfig.sanitize ? sanitizeText(value) : value;

    setFields(prev => {
      const newFields = { ...prev };
      newFields[fieldName] = {
        ...newFields[fieldName],
        value: sanitizedValue,
      };

      // Validate on change if configured
      if (fieldConfig.validateOnChange && newFields[fieldName].touched) {
        const validation = validateField(fieldName);
        newFields[fieldName] = {
          ...newFields[fieldName],
          error: validation.error,
          warnings: validation.warnings,
          isValid: validation.isValid,
        };
      }

      return newFields;
    });
  }, [config, validateField]);

  // Set field as touched and validate if configured
  const setTouched = useCallback((fieldName: string, touched: boolean = true) => {
    const fieldConfig = config[fieldName];
    
    if (!fieldConfig) return;

    setFields(prev => {
      const newFields = { ...prev };
      newFields[fieldName] = {
        ...newFields[fieldName],
        touched,
      };

      // Validate on blur if configured
      if (fieldConfig.validateOnBlur && touched) {
        const validation = validateField(fieldName);
        newFields[fieldName] = {
          ...newFields[fieldName],
          error: validation.error,
          warnings: validation.warnings,
          isValid: validation.isValid,
        };
      }

      return newFields;
    });
  }, [config, validateField]);

  // Validate entire form
  const validateForm = useCallback((): boolean => {
    let isFormValid = true;
    
    setFields(prev => {
      const newFields = { ...prev };
      
      Object.keys(config).forEach(fieldName => {
        const validation = validateField(fieldName);
        
        newFields[fieldName] = {
          ...newFields[fieldName],
          error: validation.error,
          warnings: validation.warnings,
          isValid: validation.isValid,
          touched: true,
        };

        if (!validation.isValid) {
          isFormValid = false;
        }
      });

      return newFields;
    });

    return isFormValid;
  }, [config, validateField]);

  // Reset entire form
  const resetForm = useCallback(() => {
    setFields(prev => {
      const newFields = { ...prev };
      
      Object.keys(config).forEach(fieldName => {
        newFields[fieldName] = {
          value: initialValues[fieldName] || '',
          touched: false,
          isValid: true,
          error: undefined,
          warnings: undefined,
        };
      });

      return newFields;
    });
  }, [config, initialValues]);

  // Reset single field
  const resetField = useCallback((fieldName: string) => {
    setFields(prev => ({
      ...prev,
      [fieldName]: {
        value: initialValues[fieldName] || '',
        touched: false,
        isValid: true,
        error: undefined,
        warnings: undefined,
      },
    }));
  }, [initialValues]);

  // Get props for input components
  const getFieldProps = useCallback((fieldName: string) => {
    const fieldState = fields[fieldName];
    
    return {
      value: fieldState?.value || '',
      onChangeText: (text: string) => setValue(fieldName, text),
      onBlur: () => setTouched(fieldName, true),
      error: fieldState?.touched ? fieldState?.error : undefined,
    };
  }, [fields, setValue, setTouched]);

  // Computed values
  const isFormValid = useMemo(() => {
    return Object.values(fields).every(field => field.isValid);
  }, [fields]);

  const hasErrors = useMemo(() => {
    return Object.values(fields).some(field => field.touched && field.error);
  }, [fields]);

  return {
    fields,
    setValue,
    setTouched,
    validateField,
    validateForm,
    resetForm,
    resetField,
    isFormValid,
    hasErrors,
    getFieldProps,
  };
};
