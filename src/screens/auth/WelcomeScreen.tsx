// src/screens/auth/WelcomeScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, SafeAreaView, Alert } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useFormValidation } from '../../hooks/useFormValidation';
import { useAuthMode } from '../../hooks/useAuthMode';
import { authRateLimiter } from '../../utils/rateLimiting';
import { getErrorMessage } from '../../utils/errorHandling';
import { WelcomeContent } from '../../components/auth/WelcomeContent';
import { AuthForm } from '../../components/auth/AuthForm';
import { ForgotPasswordForm } from '../../components/auth/ForgotPasswordForm';
import { AnimatedBackground } from '../../components/auth/AnimatedBackground';
import { COLORS } from '../../constants';

export const WelcomeScreen = () => {
  const { signInWithEmail, signUpWithEmail, signInAnonymously, resetPassword } =
    useAuth();

  // Auth mode management
  const {
    currentMode,
    isSignIn,
    isForgotPassword,
    showAuthForm,
    showForm,
    hideForm,
    toggleAuthMode,
    showForgotPassword,
    backToSignIn,
  } = useAuthMode();

  // State
  const [loading, setLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  // Form validation
  const { getFieldProps, validateForm, fields, resetForm } = useFormValidation({
    email: {
      validator: 'email',
      validateOnBlur: true,
      validateOnChange: true,
      sanitize: true,
    },
    password: {
      validator: 'password',
      validateOnBlur: true,
      options: { required: true },
    },
    confirmPassword: {
      validator: 'password',
      validateOnBlur: true,
      options: { required: true },
    },
  });

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, scaleAnim]);

  // Reset form when hiding
  const handleHideForm = () => {
    hideForm();
    resetForm();
    setResetEmailSent(false);
  };

  const handleAuth = async () => {
    // Validate form
    if (!validateForm()) {
      Alert.alert('Error', 'Please fix the errors in the form');
      return;
    }

    // Check rate limiting
    const action = isSignIn ? 'signin' : 'signup';
    const isAllowed = await authRateLimiter.isAllowed(
      fields.email.value,
      action
    );
    if (!isAllowed) {
      const timeUntilReset = authRateLimiter.getTimeUntilReset(
        fields.email.value,
        action
      );
      Alert.alert(
        'Too Many Attempts',
        `Please wait ${Math.ceil(timeUntilReset / 1000 / 60)} minutes before trying again.`
      );
      return;
    }

    // Additional validation for sign up
    if (!isSignIn && fields.password.value !== fields.confirmPassword.value) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      if (isSignIn) {
        await signInWithEmail(fields.email.value.trim(), fields.password.value);
      } else {
        await signUpWithEmail(fields.email.value.trim(), fields.password.value);
        Alert.alert(
          'Success',
          'Account created! Please check your email to verify your account.'
        );
      }
    } catch (error: any) {
      const errorMessage = getErrorMessage(
        error,
        isSignIn ? 'login' : 'signup'
      );

      // Check if it's an existing email error for sign up
      if (!isSignIn && error.message.includes('already exists')) {
        Alert.alert('Account Already Exists', errorMessage, [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign In Instead',
            onPress: () => toggleAuthMode(),
          },
        ]);
      } else {
        Alert.alert(
          isSignIn ? 'Sign In Failed' : 'Sign Up Failed',
          errorMessage
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuestMode = async () => {
    // Prevent multiple rapid presses
    if (loading) return;

    setLoading(true);
    try {
      console.log('🎭 Starting guest authentication...');
      await signInAnonymously();
      console.log('✅ Guest authentication completed');
    } catch (error: any) {
      console.error('❌ Guest authentication failed:', error);
      Alert.alert(
        'Error',
        error.message || 'Could not continue as guest. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    // Validate email field
    if (!fields.email.value.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    if (fields.email.error) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    // Check rate limiting
    const isAllowed = await authRateLimiter.isAllowed(
      fields.email.value,
      'reset'
    );
    if (!isAllowed) {
      const timeUntilReset = authRateLimiter.getTimeUntilReset(
        fields.email.value,
        'reset'
      );
      Alert.alert(
        'Too Many Attempts',
        `Please wait ${Math.ceil(timeUntilReset / 1000 / 60)} minutes before trying again.`
      );
      return;
    }

    setLoading(true);
    try {
      await resetPassword(fields.email.value.trim());
      setResetEmailSent(true);
      Alert.alert(
        'Reset Email Sent',
        'Check your email for password reset instructions. The email may take a few minutes to arrive.',
        [
          {
            text: 'OK',
            onPress: () => {
              backToSignIn();
              setResetEmailSent(false);
              resetForm();
            },
          },
        ]
      );
    } catch (error: any) {
      const errorMessage = getErrorMessage(error, 'reset');
      Alert.alert('Reset Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background Elements */}
      <AnimatedBackground />

      <SafeAreaView style={styles.safeArea}>
        {showAuthForm ? (
          <>
            {isForgotPassword ? (
              <ForgotPasswordForm
                loading={loading}
                onBack={handleHideForm}
                onSubmit={handleForgotPassword}
                onBackToSignIn={() => {
                  backToSignIn();
                  resetForm();
                }}
                getFieldProps={getFieldProps}
              />
            ) : (
              <AuthForm
                isSignIn={isSignIn}
                loading={loading}
                onBack={handleHideForm}
                onSubmit={handleAuth}
                onToggleMode={toggleAuthMode}
                onForgotPassword={showForgotPassword}
                onGuestMode={handleGuestMode}
                getFieldProps={getFieldProps}
                fields={fields}
              />
            )}
          </>
        ) : (
          <WelcomeContent
            fadeAnim={fadeAnim}
            slideAnim={slideAnim}
            scaleAnim={scaleAnim}
            onGetStarted={() => showForm(false)}
            onSignIn={() => showForm(true)}
            onGuestMode={handleGuestMode}
            loading={loading}
          />
        )}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeArea: {
    flex: 1,
  },
});
