// src/components/auth/WelcomeContent.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';

interface WelcomeContentProps {
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
  scaleAnim: Animated.Value;
  onGetStarted: () => void;
  onSignIn: () => void;
  onGuestMode: () => void;
  loading: boolean;
}

export const WelcomeContent: React.FC<WelcomeContentProps> = ({
  fadeAnim,
  slideAnim,
  scaleAnim,
  onGetStarted,
  onSignIn,
  onGuestMode,
  loading,
}) => {
  return (
    <View style={styles.content}>
      <Animated.View
        style={[
          styles.welcomeContent,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
          },
        ]}
      >
        {/* Logo/Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconBackground}>
            <MaterialIcons
              name="health-and-safety"
              size={64}
              color={COLORS.primary}
            />
          </View>
        </View>

        {/* App Name */}
        <Text style={styles.appName}>PharmaGuide</Text>
        <Text style={styles.tagline}>Your Personal Health Companion</Text>

        {/* Features */}
        <View style={styles.features}>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="scan" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.featureText}>
              Scan supplements instantly
            </Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons
                name="shield-checkmark"
                size={20}
                color={COLORS.secondary}
              />
            </View>
            <Text style={styles.featureText}>
              Check drug interactions
            </Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons
                name="chatbubble-ellipses"
                size={20}
                color={COLORS.accent}
              />
            </View>
            <Text style={styles.featureText}>
              AI-powered health advice
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onGetStarted}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={onSignIn}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>
              I have an account
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.guestButton}
            onPress={onGuestMode}
            activeOpacity={0.8}
            disabled={loading}
          >
            <Ionicons
              name="person-outline"
              size={20}
              color={COLORS.textSecondary}
              style={styles.guestIcon}
            />
            <Text style={styles.guestButtonText}>
              {loading ? 'Loading...' : 'Continue as Guest'}
            </Text>
            <Ionicons
              name="arrow-forward"
              size={16}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  welcomeContent: {
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: SPACING.xl,
  },
  iconBackground: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: COLORS.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  appName: {
    fontSize: 36,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  tagline: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl * 2,
    textAlign: 'center',
  },
  features: {
    marginBottom: SPACING.xl * 2,
    width: '100%',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  featureText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.sizes.base,
    flex: 1,
  },
  actionButtons: {
    width: '100%',
  },
  primaryButton: {
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
  primaryButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: COLORS.backgroundSecondary,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.lg,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
  },
  secondaryButtonText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.medium,
    textAlign: 'center',
  },
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  guestIcon: {
    marginRight: SPACING.xs,
  },
  guestButtonText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.sizes.base,
  },
});
