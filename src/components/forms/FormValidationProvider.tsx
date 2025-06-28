// src/components/forms/FormValidationProvider.tsx
// Global form validation context and provider

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Alert } from 'react-native';

export interface ValidationError {
  field: string;
  message: string;
  type: 'error' | 'warning';
}

export interface FormValidationState {
  errors: ValidationError[];
  isValidating: boolean;
  hasErrors: boolean;
  hasWarnings: boolean;
  touchedFields: Set<string>;
  dirtyFields: Set<string>;
}

export interface FormValidationContextType {
  validationState: FormValidationState;
  addError: (field: string, message: string, type?: 'error' | 'warning') => void;
  removeError: (field: string) => void;
  clearErrors: () => void;
  setFieldTouched: (field: string) => void;
  setFieldDirty: (field: string) => void;
  setValidating: (isValidating: boolean) => void;
  validateForm: () => boolean;
  showValidationSummary: () => void;
}

const FormValidationContext = createContext<FormValidationContextType | undefined>(undefined);

export const useFormValidationContext = (): FormValidationContextType => {
  const context = useContext(FormValidationContext);
  if (!context) {
    throw new Error('useFormValidationContext must be used within a FormValidationProvider');
  }
  return context;
};

interface FormValidationProviderProps {
  children: ReactNode;
  onValidationChange?: (state: FormValidationState) => void;
}

export const FormValidationProvider: React.FC<FormValidationProviderProps> = ({
  children,
  onValidationChange,
}) => {
  const [validationState, setValidationState] = useState<FormValidationState>({
    errors: [],
    isValidating: false,
    hasErrors: false,
    hasWarnings: false,
    touchedFields: new Set(),
    dirtyFields: new Set(),
  });

  const updateValidationState = useCallback((updater: (prev: FormValidationState) => FormValidationState) => {
    setValidationState(prev => {
      const newState = updater(prev);
      onValidationChange?.(newState);
      return newState;
    });
  }, [onValidationChange]);

  const addError = useCallback((field: string, message: string, type: 'error' | 'warning' = 'error') => {
    updateValidationState(prev => {
      const filteredErrors = prev.errors.filter(error => error.field !== field);
      const newErrors = [...filteredErrors, { field, message, type }];
      
      return {
        ...prev,
        errors: newErrors,
        hasErrors: newErrors.some(error => error.type === 'error'),
        hasWarnings: newErrors.some(error => error.type === 'warning'),
      };
    });
  }, [updateValidationState]);

  const removeError = useCallback((field: string) => {
    updateValidationState(prev => {
      const filteredErrors = prev.errors.filter(error => error.field !== field);
      
      return {
        ...prev,
        errors: filteredErrors,
        hasErrors: filteredErrors.some(error => error.type === 'error'),
        hasWarnings: filteredErrors.some(error => error.type === 'warning'),
      };
    });
  }, [updateValidationState]);

  const clearErrors = useCallback(() => {
    updateValidationState(prev => ({
      ...prev,
      errors: [],
      hasErrors: false,
      hasWarnings: false,
    }));
  }, [updateValidationState]);

  const setFieldTouched = useCallback((field: string) => {
    updateValidationState(prev => ({
      ...prev,
      touchedFields: new Set([...prev.touchedFields, field]),
    }));
  }, [updateValidationState]);

  const setFieldDirty = useCallback((field: string) => {
    updateValidationState(prev => ({
      ...prev,
      dirtyFields: new Set([...prev.dirtyFields, field]),
    }));
  }, [updateValidationState]);

  const setValidating = useCallback((isValidating: boolean) => {
    updateValidationState(prev => ({
      ...prev,
      isValidating,
    }));
  }, [updateValidationState]);

  const validateForm = useCallback((): boolean => {
    return !validationState.hasErrors;
  }, [validationState.hasErrors]);

  const showValidationSummary = useCallback(() => {
    const errors = validationState.errors.filter(error => error.type === 'error');
    const warnings = validationState.errors.filter(error => error.type === 'warning');

    if (errors.length === 0 && warnings.length === 0) {
      return;
    }

    let message = '';
    
    if (errors.length > 0) {
      message += 'Please fix the following errors:\n\n';
      errors.forEach((error, index) => {
        message += `${index + 1}. ${error.message}\n`;
      });
    }

    if (warnings.length > 0) {
      if (errors.length > 0) message += '\n';
      message += 'Warnings:\n\n';
      warnings.forEach((warning, index) => {
        message += `${index + 1}. ${warning.message}\n`;
      });
    }

    Alert.alert(
      errors.length > 0 ? 'Form Validation Errors' : 'Form Warnings',
      message.trim(),
      [{ text: 'OK' }]
    );
  }, [validationState.errors]);

  const contextValue: FormValidationContextType = {
    validationState,
    addError,
    removeError,
    clearErrors,
    setFieldTouched,
    setFieldDirty,
    setValidating,
    validateForm,
    showValidationSummary,
  };

  return (
    <FormValidationContext.Provider value={contextValue}>
      {children}
    </FormValidationContext.Provider>
  );
};

// Higher-order component for form validation
export const withFormValidation = <P extends object>(
  Component: React.ComponentType<P>
): React.FC<P & { onValidationChange?: (state: FormValidationState) => void }> => {
  return ({ onValidationChange, ...props }) => (
    <FormValidationProvider onValidationChange={onValidationChange}>
      <Component {...(props as P)} />
    </FormValidationProvider>
  );
};

// Form validation utilities
export const FormValidationUtils = {
  /**
   * Create a validation error
   */
  createError: (field: string, message: string): ValidationError => ({
    field,
    message,
    type: 'error',
  }),

  /**
   * Create a validation warning
   */
  createWarning: (field: string, message: string): ValidationError => ({
    field,
    message,
    type: 'warning',
  }),

  /**
   * Check if field has errors
   */
  hasFieldError: (errors: ValidationError[], field: string): boolean => {
    return errors.some(error => error.field === field && error.type === 'error');
  },

  /**
   * Check if field has warnings
   */
  hasFieldWarning: (errors: ValidationError[], field: string): boolean => {
    return errors.some(error => error.field === field && error.type === 'warning');
  },

  /**
   * Get field errors
   */
  getFieldErrors: (errors: ValidationError[], field: string): string[] => {
    return errors
      .filter(error => error.field === field && error.type === 'error')
      .map(error => error.message);
  },

  /**
   * Get field warnings
   */
  getFieldWarnings: (errors: ValidationError[], field: string): string[] => {
    return errors
      .filter(error => error.field === field && error.type === 'warning')
      .map(error => error.message);
  },

  /**
   * Validate required field
   */
  validateRequired: (value: any, fieldName: string): ValidationError | null => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return FormValidationUtils.createError(fieldName, `${fieldName} is required`);
    }
    return null;
  },

  /**
   * Validate email format
   */
  validateEmail: (value: string, fieldName: string = 'Email'): ValidationError | null => {
    if (!value) return null;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return FormValidationUtils.createError(fieldName, 'Please enter a valid email address');
    }
    return null;
  },

  /**
   * Validate phone number
   */
  validatePhone: (value: string, fieldName: string = 'Phone'): ValidationError | null => {
    if (!value) return null;
    
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    const cleanPhone = value.replace(/[\s\-\(\)]/g, '');
    
    if (!phoneRegex.test(cleanPhone)) {
      return FormValidationUtils.createError(fieldName, 'Please enter a valid phone number');
    }
    return null;
  },

  /**
   * Validate minimum length
   */
  validateMinLength: (value: string, minLength: number, fieldName: string): ValidationError | null => {
    if (value && value.length < minLength) {
      return FormValidationUtils.createError(
        fieldName,
        `${fieldName} must be at least ${minLength} characters long`
      );
    }
    return null;
  },

  /**
   * Validate maximum length
   */
  validateMaxLength: (value: string, maxLength: number, fieldName: string): ValidationError | null => {
    if (value && value.length > maxLength) {
      return FormValidationUtils.createError(
        fieldName,
        `${fieldName} must be no more than ${maxLength} characters long`
      );
    }
    return null;
  },

  /**
   * Validate pattern match
   */
  validatePattern: (value: string, pattern: RegExp, fieldName: string, message?: string): ValidationError | null => {
    if (value && !pattern.test(value)) {
      return FormValidationUtils.createError(
        fieldName,
        message || `${fieldName} format is invalid`
      );
    }
    return null;
  },
};
