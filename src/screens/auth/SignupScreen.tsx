// src/screens/auth/SignupScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import { Button, Input } from '../../components/common'; // Import new components
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';

export const SignupScreen = () => {
  const navigation = useNavigation();
  const { signUpWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    // Validation
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await signUpWithEmail(email.trim(), password);
      Alert.alert(
        'Account Created',
        'Please check your email to verify your account and then sign in.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login' as never) }]
      );
    } catch (error: any) {
      // Check if it's an existing email error
      if (error.message.includes('already exists')) {
        Alert.alert('Account Already Exists', error.message, [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign In Instead',
            onPress: () => navigation.navigate('Login' as never),
          },
        ]);
      } else {
        Alert.alert(
          'Sign Up Failed',
          error.message || 'An error occurred. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Create Your Account</Text>
        <Text style={styles.subtitle}>
          Join us to personalize your health journey
        </Text>

        <Input
          label="Email"
          placeholder="email@example.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          style={styles.input}
        />

        <Input
          label="Password"
          placeholder="at least 6 characters"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password-new"
          style={styles.input}
        />

        <Input
          label="Confirm Password"
          placeholder="re-enter your password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoComplete="password-new"
          style={styles.input}
        />

        <Button
          title="Sign Up"
          onPress={handleSignup}
          loading={loading}
          disabled={loading}
          style={styles.button}
        />

        <TouchableOpacity
          onPress={() => navigation.navigate('Login' as never)}
          disabled={loading}
          style={styles.linkButton}
        >
          <Text style={styles.link}>Already have an account? Sign in</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: SPACING.xl,
    justifyContent: 'center',
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xxxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl * 2,
  },
  input: {
    marginBottom: SPACING.md,
  },
  button: {
    marginTop: SPACING.lg,
  },
  linkButton: {
    marginTop: SPACING.xl,
  },
  link: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.sizes.base,
    textAlign: 'center',
    fontWeight: TYPOGRAPHY.weights.medium,
  },
});
