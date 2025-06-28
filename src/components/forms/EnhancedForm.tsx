// src/components/forms/EnhancedForm.tsx
// Enhanced form component with persistence, validation, and navigation guards

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useFormValidationWithPersistence } from '../../hooks/useFormPersistence';
import { useFormNavigationGuard } from '../../hooks/useNavigationGuard';
import { BackButton } from '../navigation/BackButton';
import { LoadingScreen } from '../common/LoadingScreen';
import { COLORS, SPACING } from '../../constants';

export interface EnhancedFormConfig {
  formId: string;
  fields: Record<string, any>;
  initialValues?: Record<string, any>;
  
  // Persistence options
  autoSave?: boolean;
  autoSaveDelay?: number;
  clearOnSubmit?: boolean;
  maxAge?: number;
  
  // Validation options
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  
  // Navigation options
  showBackButton?: boolean;
  blockNavigation?: boolean;
  customBackAction?: () => void;
  
  // Form options
  scrollable?: boolean;
  keyboardAvoiding?: boolean;
  showLoadingOnSubmit?: boolean;
}

export interface EnhancedFormProps {
  config: EnhancedFormConfig;
  onSubmit: (data: Record<string, any>) => Promise<void> | void;
  onFieldChange?: (fieldName: string, value: any) => void;
  onFormStateChange?: (state: {
    isValid: boolean;
    hasErrors: boolean;
    hasUnsavedChanges: boolean;
    isLoading: boolean;
  }) => void;
  children: (formProps: {
    fields: Record<string, any>;
    getFieldProps: (fieldName: string) => any;
    validateForm: () => boolean;
    isFormValid: boolean;
    hasErrors: boolean;
    hasUnsavedChanges: boolean;
    isLoading: boolean;
    submitForm: () => Promise<void>;
    resetForm: () => void;
    lastSaved: Date | null;
  }) => React.ReactNode;
  style?: any;
  contentContainerStyle?: any;
}

export const EnhancedForm: React.FC<EnhancedFormProps> = ({
  config,
  onSubmit,
  onFieldChange,
  onFormStateChange,
  children,
  style,
  contentContainerStyle,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const {
    formId,
    fields: fieldConfig,
    initialValues = {},
    autoSave = true,
    autoSaveDelay = 1000,
    clearOnSubmit = true,
    maxAge = 24 * 60 * 60 * 1000, // 24 hours
    showBackButton = true,
    blockNavigation = true,
    customBackAction,
    scrollable = true,
    keyboardAvoiding = true,
    showLoadingOnSubmit = true,
  } = config;

  // Form validation with persistence
  const form = useFormValidationWithPersistence(
    fieldConfig,
    {
      formId,
      autoSave,
      autoSaveDelay,
      clearOnSubmit,
      maxAge,
    },
    initialValues
  );

  // Navigation guard
  const navigationGuard = useFormNavigationGuard(
    hasUnsavedChanges && blockNavigation,
    async () => {
      // Auto-save before navigation
      if (hasUnsavedChanges) {
        const formData = Object.keys(form.fields).reduce((acc, key) => {
          acc[key] = form.fields[key].value;
          return acc;
        }, {} as Record<string, any>);
        await form.persistence.saveFormData(formData);
      }
    },
    async () => {
      // Discard changes
      await form.persistence.clearFormData();
    }
  );

  // Track form changes
  useEffect(() => {
    const formData = Object.keys(form.fields).reduce((acc, key) => {
      acc[key] = form.fields[key].value;
      return acc;
    }, {} as Record<string, any>);

    const hasData = Object.values(formData).some(value => 
      value && value.toString().trim()
    );

    const formChanged = JSON.stringify(formData) !== JSON.stringify(initialValues);
    setHasUnsavedChanges(hasData && formChanged);
  }, [form.fields, initialValues]);

  // Notify parent of form state changes
  useEffect(() => {
    if (onFormStateChange) {
      onFormStateChange({
        isValid: form.isFormValid,
        hasErrors: form.hasErrors,
        hasUnsavedChanges,
        isLoading: form.isFormLoading || isSubmitting,
      });
    }
  }, [
    form.isFormValid,
    form.hasErrors,
    hasUnsavedChanges,
    form.isFormLoading,
    isSubmitting,
    onFormStateChange,
  ]);

  // Enhanced field change handler
  const handleFieldChange = useCallback((fieldName: string, value: any) => {
    if (onFieldChange) {
      onFieldChange(fieldName, value);
    }
  }, [onFieldChange]);

  // Enhanced submit handler
  const submitForm = useCallback(async () => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      // Validate form
      const isValid = form.validateForm();
      if (!isValid) {
        Alert.alert(
          'Form Validation Error',
          'Please fix the errors in the form before submitting.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Get form data
      const formData = Object.keys(form.fields).reduce((acc, key) => {
        acc[key] = form.fields[key].value;
        return acc;
      }, {} as Record<string, any>);

      // Submit with persistence handling
      await form.submitWithPersistence(() => onSubmit(formData));
      
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Form submission error:', error);
      Alert.alert(
        'Submission Error',
        'Failed to submit the form. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [form, onSubmit, isSubmitting]);

  // Enhanced field props with change tracking
  const getEnhancedFieldProps = useCallback((fieldName: string) => {
    const baseProps = form.getFieldProps(fieldName);
    
    return {
      ...baseProps,
      onChangeText: (value: string) => {
        baseProps.onChangeText(value);
        handleFieldChange(fieldName, value);
      },
    };
  }, [form, handleFieldChange]);

  // Show loading screen while form is initializing
  if (form.isFormLoading) {
    return (
      <LoadingScreen
        message="Loading form..."
        variant="screen"
      />
    );
  }

  const formContent = (
    <View style={[styles.container, style]}>
      {showBackButton && (
        <BackButton
          hasUnsavedChanges={hasUnsavedChanges && blockNavigation}
          onSave={async () => {
            const formData = Object.keys(form.fields).reduce((acc, key) => {
              acc[key] = form.fields[key].value;
              return acc;
            }, {} as Record<string, any>);
            await form.persistence.saveFormData(formData);
          }}
          onDiscard={async () => {
            await form.persistence.clearFormData();
          }}
          onPress={customBackAction}
          style={styles.backButton}
        />
      )}

      {children({
        fields: form.fields,
        getFieldProps: getEnhancedFieldProps,
        validateForm: form.validateForm,
        isFormValid: form.isFormValid,
        hasErrors: form.hasErrors,
        hasUnsavedChanges,
        isLoading: form.isFormLoading || isSubmitting,
        submitForm,
        resetForm: form.resetForm,
        lastSaved: form.lastSaved,
      })}
    </View>
  );

  if (scrollable) {
    const content = (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {formContent}
      </ScrollView>
    );

    if (keyboardAvoiding) {
      return (
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {content}
        </KeyboardAvoidingView>
      );
    }

    return content;
  }

  if (keyboardAvoiding) {
    return (
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {formContent}
      </KeyboardAvoidingView>
    );
  }

  return formContent;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: SPACING.lg,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: SPACING.md,
  },
});

/**
 * Form utilities
 */
export const EnhancedFormUtils = {
  /**
   * Create form configuration
   */
  createFormConfig: (
    formId: string,
    fields: Record<string, any>,
    options: Partial<EnhancedFormConfig> = {}
  ): EnhancedFormConfig => ({
    formId,
    fields,
    autoSave: true,
    autoSaveDelay: 1000,
    clearOnSubmit: true,
    maxAge: 24 * 60 * 60 * 1000,
    showBackButton: true,
    blockNavigation: true,
    scrollable: true,
    keyboardAvoiding: true,
    showLoadingOnSubmit: true,
    ...options,
  }),

  /**
   * Check if form should show unsaved changes warning
   */
  shouldShowUnsavedWarning: (
    hasUnsavedChanges: boolean,
    isFormValid: boolean,
    hasErrors: boolean
  ): boolean => {
    return hasUnsavedChanges && !hasErrors;
  },
};
