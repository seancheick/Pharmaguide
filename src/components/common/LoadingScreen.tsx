// src/components/common/LoadingScreen.tsx
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';

interface LoadingScreenProps {
  message?: string;
  showLogo?: boolean;
  variant?: 'splash' | 'auth' | 'screen';
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Loading...',
  showLogo = true,
  variant = 'screen',
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Fade in animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous pulse animation for logo
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    pulseAnimation.start();

    return () => {
      pulseAnimation.stop();
    };
  }, [fadeAnim, scaleAnim, pulseAnim]);

  const getContainerStyle = () => {
    switch (variant) {
      case 'splash':
        return [styles.container, styles.splashContainer];
      case 'auth':
        return [styles.container, styles.authContainer];
      default:
        return [styles.container, styles.screenContainer];
    }
  };

  return (
    <View style={getContainerStyle()}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {showLogo && (
          <Animated.View
            style={[
              styles.logoContainer,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <View style={styles.logoBackground}>
              <Ionicons
                name="medical"
                size={variant === 'splash' ? 64 : 48}
                color={COLORS.primary}
              />
            </View>
            {variant === 'splash' && (
              <Text style={styles.appName}>PharmaGuide</Text>
            )}
          </Animated.View>
        )}

        <View style={styles.loadingContent}>
          <ActivityIndicator
            size={variant === 'splash' ? 'large' : 'small'}
            color={COLORS.primary}
            style={styles.spinner}
          />
          <Text style={[
            styles.message,
            variant === 'splash' && styles.splashMessage
          ]}>
            {message}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashContainer: {
    backgroundColor: COLORS.background,
  },
  authContainer: {
    backgroundColor: COLORS.background,
  },
  screenContainer: {
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.lg,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: width * 0.8,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  loadingContent: {
    alignItems: 'center',
  },
  spinner: {
    marginBottom: SPACING.md,
  },
  message: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  splashMessage: {
    fontSize: 18,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
});
