// src/components/common/ErrorFallback.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';
import { Button } from './Button';

interface ErrorFallbackProps {
  error?: Error;
  resetError?: () => void;
  title?: string;
  message?: string;
  showDetails?: boolean;
  showHomeButton?: boolean;
  showRetryButton?: boolean;
  onRetry?: () => void;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
  title = 'Something went wrong',
  message = 'We encountered an unexpected error. Please try again or contact support if the problem persists.',
  showDetails = false,
  showHomeButton = true,
  showRetryButton = true,
  onRetry,
}) => {
  const navigation = useNavigation();

  const handleGoHome = () => {
    resetError?.();
    navigation.navigate('Home' as never);
  };

  const handleGoBack = () => {
    resetError?.();
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Home' as never);
    }
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      resetError?.();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="warning" size={64} color={COLORS.error} />
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>

        {showDetails && error && (
          <View style={styles.detailsContainer}>
            <Text style={styles.detailsTitle}>Error Details:</Text>
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>
                {error.message || 'Unknown error occurred'}
              </Text>
              {__DEV__ && error.stack && (
                <Text style={styles.stackTrace}>
                  {error.stack.substring(0, 500)}...
                </Text>
              )}
            </View>
          </View>
        )}

        <View style={styles.buttonContainer}>
          {showRetryButton && (
            <Button
              title="Try Again"
              onPress={handleRetry}
              variant="primary"
              style={styles.button}
            />
          )}

          <Button
            title="Go Back"
            onPress={handleGoBack}
            variant="secondary"
            style={styles.button}
          />

          {showHomeButton && (
            <Button
              title="Go Home"
              onPress={handleGoHome}
              variant="outline"
              style={styles.button}
            />
          )}
        </View>

        <TouchableOpacity
          style={styles.supportButton}
          onPress={() => {
            // Navigate to support screen
            navigation.navigate('ContactSupportScreen' as never);
          }}
        >
          <Ionicons name="help-circle-outline" size={20} color={COLORS.primary} />
          <Text style={styles.supportText}>Contact Support</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

// Specific error fallbacks for different scenarios
export const NetworkErrorFallback: React.FC<Omit<ErrorFallbackProps, 'title' | 'message'>> = (props) => (
  <ErrorFallback
    {...props}
    title="Connection Problem"
    message="Unable to connect to our servers. Please check your internet connection and try again."
  />
);

export const LoadingErrorFallback: React.FC<Omit<ErrorFallbackProps, 'title' | 'message'>> = (props) => (
  <ErrorFallback
    {...props}
    title="Loading Failed"
    message="We couldn't load this content. Please try again or check your connection."
  />
);

export const AuthErrorFallback: React.FC<Omit<ErrorFallbackProps, 'title' | 'message'>> = (props) => (
  <ErrorFallback
    {...props}
    title="Authentication Error"
    message="There was a problem with your authentication. Please sign in again."
    showHomeButton={false}
  />
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
  },
  iconContainer: {
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  message: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.xl,
    maxWidth: 300,
  },
  detailsContainer: {
    width: '100%',
    marginBottom: SPACING.xl,
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  errorBox: {
    backgroundColor: COLORS.gray100,
    borderRadius: 8,
    padding: SPACING.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    fontFamily: 'monospace',
  },
  stackTrace: {
    fontSize: 10,
    color: COLORS.textTertiary,
    fontFamily: 'monospace',
    marginTop: SPACING.sm,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
  },
  button: {
    marginBottom: SPACING.md,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.lg,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  supportText: {
    fontSize: 14,
    color: COLORS.primary,
    marginLeft: SPACING.xs,
    fontWeight: '500',
  },
});
