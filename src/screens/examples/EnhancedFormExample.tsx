// src/screens/examples/EnhancedFormExample.tsx
// Example screen demonstrating enhanced form and navigation features

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { EnhancedForm, EnhancedFormUtils } from '../../components/forms/EnhancedForm';
import { ValidatedInput } from '../../components/common/ValidatedInput';
import { Button } from '../../components/common/Button';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';

export const EnhancedFormExample: React.FC = () => {
  const navigation = useNavigation();
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  // Form configuration with validation rules
  const formConfig = EnhancedFormUtils.createFormConfig(
    'example_form',
    {
      name: {
        validator: 'text',
        options: { required: true, minLength: 2, maxLength: 50 },
        validateOnBlur: true,
        sanitize: true,
      },
      email: {
        validator: 'email',
        validateOnBlur: true,
        validateOnChange: true,
        sanitize: true,
      },
      message: {
        validator: 'text',
        options: { required: true, minLength: 10, maxLength: 500 },
        validateOnBlur: true,
        sanitize: true,
      },
    },
    {
      // Form persistence options
      autoSave: true,
      autoSaveDelay: 1500,
      clearOnSubmit: true,
      maxAge: 60 * 60 * 1000, // 1 hour
      
      // Navigation options
      showBackButton: true,
      blockNavigation: true,
      
      // UI options
      scrollable: true,
      keyboardAvoiding: true,
      showLoadingOnSubmit: true,
    }
  );

  // Handle form submission
  const handleSubmit = async (formData: Record<string, any>) => {
    setSubmitStatus('submitting');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate random success/failure for demo
      if (Math.random() > 0.3) {
        console.log('Form submitted successfully:', formData);
        setSubmitStatus('success');
        
        Alert.alert(
          'Success!',
          'Your form has been submitted successfully.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        throw new Error('Simulated submission error');
      }
    } catch (error) {
      console.error('Form submission failed:', error);
      setSubmitStatus('error');
      
      Alert.alert(
        'Submission Failed',
        'There was an error submitting your form. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  // Handle field changes
  const handleFieldChange = (fieldName: string, value: any) => {
    console.log(`Field ${fieldName} changed to:`, value);
  };

  // Handle form state changes
  const handleFormStateChange = (state: {
    isValid: boolean;
    hasErrors: boolean;
    hasUnsavedChanges: boolean;
    isLoading: boolean;
  }) => {
    console.log('Form state changed:', state);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Enhanced Form Example</Text>
        <Text style={styles.subtitle}>
          This form demonstrates automatic persistence, navigation guards, and enhanced validation.
        </Text>
      </View>

      <EnhancedForm
        config={formConfig}
        onSubmit={handleSubmit}
        onFieldChange={handleFieldChange}
        onFormStateChange={handleFormStateChange}
        style={styles.form}
        contentContainerStyle={styles.formContent}
      >
        {({
          getFieldProps,
          isFormValid,
          hasErrors,
          hasUnsavedChanges,
          isLoading,
          submitForm,
          lastSaved,
        }) => (
          <>
            {/* Form Status Indicator */}
            <View style={styles.statusContainer}>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Form Valid:</Text>
                <Text style={[styles.statusValue, isFormValid ? styles.statusSuccess : styles.statusError]}>
                  {isFormValid ? 'Yes' : 'No'}
                </Text>
              </View>
              
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Has Errors:</Text>
                <Text style={[styles.statusValue, hasErrors ? styles.statusError : styles.statusSuccess]}>
                  {hasErrors ? 'Yes' : 'No'}
                </Text>
              </View>
              
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Unsaved Changes:</Text>
                <Text style={[styles.statusValue, hasUnsavedChanges ? styles.statusWarning : styles.statusSuccess]}>
                  {hasUnsavedChanges ? 'Yes' : 'No'}
                </Text>
              </View>
              
              {lastSaved && (
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Last Saved:</Text>
                  <Text style={styles.statusValue}>
                    {lastSaved.toLocaleTimeString()}
                  </Text>
                </View>
              )}
            </View>

            {/* Form Fields */}
            <View style={styles.fieldsContainer}>
              <ValidatedInput
                label="Full Name"
                placeholder="Enter your full name"
                validationType="text"
                required
                {...getFieldProps('name')}
              />

              <ValidatedInput
                label="Email Address"
                placeholder="Enter your email"
                validationType="email"
                required
                keyboardType="email-address"
                autoCapitalize="none"
                {...getFieldProps('email')}
              />

              <ValidatedInput
                label="Message"
                placeholder="Enter your message (minimum 10 characters)"
                validationType="text"
                required
                multiline
                numberOfLines={4}
                {...getFieldProps('message')}
              />
            </View>

            {/* Submit Button */}
            <View style={styles.submitContainer}>
              <Button
                title={isLoading ? 'Submitting...' : 'Submit Form'}
                onPress={submitForm}
                disabled={!isFormValid || isLoading}
                loading={isLoading}
                style={styles.submitButton}
              />
              
              {hasUnsavedChanges && (
                <Text style={styles.unsavedWarning}>
                  You have unsaved changes. They will be automatically saved.
                </Text>
              )}
            </View>
          </>
        )}
      </EnhancedForm>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  form: {
    flex: 1,
  },
  formContent: {
    padding: SPACING.lg,
  },
  statusContainer: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  statusLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  statusValue: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
  },
  statusSuccess: {
    color: COLORS.success,
  },
  statusError: {
    color: COLORS.error,
  },
  statusWarning: {
    color: COLORS.warning,
  },
  fieldsContainer: {
    marginBottom: SPACING.xl,
  },
  submitContainer: {
    marginTop: SPACING.lg,
  },
  submitButton: {
    marginBottom: SPACING.md,
  },
  unsavedWarning: {
    ...TYPOGRAPHY.caption,
    color: COLORS.warning,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
