// src/components/auth/AuthForm.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ValidatedInput } from '../common/ValidatedInput';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';

interface AuthFormProps {
  isSignIn: boolean;
  loading: boolean;
  onBack: () => void;
  onSubmit: () => void;
  onToggleMode: () => void;
  onForgotPassword: () => void;
  onGuestMode: () => void;
  getFieldProps: (field: string) => any;
  fields: any;
}

export const AuthForm: React.FC<AuthFormProps> = ({
  isSignIn,
  loading,
  onBack,
  onSubmit,
  onToggleMode,
  onForgotPassword,
  onGuestMode,
  getFieldProps,
  fields,
}) => {
  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formWrapper}>
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            disabled={loading}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={COLORS.textPrimary}
            />
          </TouchableOpacity>

          {/* Form Header */}
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>
              {isSignIn ? 'Welcome Back' : 'Create Account'}
            </Text>
            <Text style={styles.formSubtitle}>
              {isSignIn
                ? 'Sign in to continue'
                : 'Join us on your health journey'}
            </Text>
          </View>

          {/* Form Fields */}
          <View style={styles.formFields}>
            <ValidatedInput
              label="Email"
              placeholder="Enter your email"
              validationType="email"
              required
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              editable={!loading}
              {...getFieldProps('email')}
            />

            <ValidatedInput
              label="Password"
              placeholder="Enter your password"
              validationType="password"
              required
              secureTextEntry
              showPasswordToggle
              autoComplete={isSignIn ? 'password' : 'password-new'}
              editable={!loading}
              confirmPassword={fields.confirmPassword?.value}
              {...getFieldProps('password')}
            />

            {!isSignIn && (
              <ValidatedInput
                label="Confirm Password"
                placeholder="Confirm your password"
                validationType="password"
                required
                secureTextEntry
                showPasswordToggle
                autoComplete="password-new"
                editable={!loading}
                {...getFieldProps('confirmPassword')}
              />
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              loading && styles.submitButtonDisabled,
            ]}
            onPress={onSubmit}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.submitButtonText}>
                {isSignIn ? 'Sign In' : 'Create Account'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Forgot Password Link (only show for sign in) */}
          {isSignIn && (
            <TouchableOpacity
              style={styles.forgotPasswordButton}
              onPress={onForgotPassword}
              disabled={loading}
            >
              <Text style={styles.forgotPasswordText}>
                Forgot Password?
              </Text>
            </TouchableOpacity>
          )}

          {/* Switch Auth Mode */}
          <TouchableOpacity
            onPress={onToggleMode}
            disabled={loading}
            style={styles.switchButton}
          >
            <Text style={styles.switchText}>
              {isSignIn
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </Text>
          </TouchableOpacity>

          {/* Or Continue as Guest */}
          <View style={styles.orContainer}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>OR</Text>
            <View style={styles.orLine} />
          </View>

          <TouchableOpacity
            style={styles.guestButtonAlt}
            onPress={onGuestMode}
            activeOpacity={0.8}
            disabled={loading}
          >
            <Text style={styles.guestButtonAltText}>
              Continue without account
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
  },
  formWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    marginHorizontal: SPACING.lg,
    borderRadius: 24,
    padding: SPACING.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    alignSelf: 'flex-start',
  },
  formHeader: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  formTitle: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  formSubtitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
  },
  formFields: {
    marginBottom: SPACING.xl,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.md,
    elevation: 3,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    textAlign: 'center',
  },
  forgotPasswordButton: {
    paddingVertical: SPACING.sm,
    alignSelf: 'center',
  },
  forgotPasswordText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.sizes.sm,
    textAlign: 'center',
  },
  switchButton: {
    paddingVertical: SPACING.sm,
  },
  switchText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.sizes.sm,
    textAlign: 'center',
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.gray200,
  },
  orText: {
    color: COLORS.textTertiary,
    fontSize: TYPOGRAPHY.sizes.sm,
    marginHorizontal: SPACING.md,
  },
  guestButtonAlt: {
    paddingVertical: SPACING.md,
  },
  guestButtonAltText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.sizes.base,
    textAlign: 'center',
  },
});
