// src/components/home/HomeHeader.tsx
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { COLORS, SPACING, TYPOGRAPHY, ANIMATIONS } from '../../constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface HomeHeaderProps {
  userName?: string;
  onNotificationPress?: () => void;
  hasUnreadNotifications?: boolean;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({
  userName,
  onNotificationPress,
  hasUnreadNotifications = false,
}) => {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-20)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const notificationScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entry animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: ANIMATIONS.DURATION.slow,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for notification badge
    if (hasUnreadNotifications) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
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
      pulse.start();
      return () => pulse.stop();
    }
  }, [fadeAnim, slideAnim, pulseAnim, hasUnreadNotifications]);

  const handleNotificationPress = () => {
    // Animate button press
    Animated.sequence([
      Animated.timing(notificationScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(notificationScale, {
        toValue: 1,
        tension: 40,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();

    onNotificationPress?.();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getEmoji = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '☀️';
    if (hour < 17) return '🌤';
    if (hour < 20) return '🌅';
    return '🌙';
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {/* Background gradient decoration */}
      <LinearGradient
        colors={['rgba(37, 99, 235, 0.03)', 'rgba(37, 99, 235, 0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backgroundGradient}
      />

      <View style={styles.header}>
        <View style={styles.greetingContainer}>
          <View style={styles.greetingRow}>
            <Text style={styles.greeting}>
              {getGreeting()}
              {userName && <Text style={styles.userName}>, {userName}</Text>}
            </Text>
            <Text style={styles.emoji}>{getEmoji()}</Text>
          </View>
          <Text style={styles.subtitle}>Track your wellness journey</Text>
        </View>

        {/* Notification Button with Glass Effect */}
        <Animated.View style={{ transform: [{ scale: notificationScale }] }}>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={handleNotificationPress}
            activeOpacity={0.8}
          >
            {Platform.OS === 'ios' ? (
              <BlurView
                intensity={25}
                tint="light"
                style={styles.notificationBlur}
              >
                <View style={styles.notificationContent}>
                  <Ionicons
                    name={
                      hasUnreadNotifications
                        ? 'notifications'
                        : 'notifications-outline'
                    }
                    size={22}
                    color={COLORS.textPrimary}
                  />
                  {hasUnreadNotifications && (
                    <Animated.View
                      style={[
                        styles.notificationBadge,
                        { transform: [{ scale: pulseAnim }] },
                      ]}
                    >
                      <View style={styles.badgeInner} />
                    </Animated.View>
                  )}
                </View>
              </BlurView>
            ) : (
              <LinearGradient
                colors={['rgba(255,255,255,0.9)', 'rgba(249,250,251,0.9)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.notificationGradient}
              >
                <View style={styles.notificationContent}>
                  <Ionicons
                    name={
                      hasUnreadNotifications
                        ? 'notifications'
                        : 'notifications-outline'
                    }
                    size={22}
                    color={COLORS.textPrimary}
                  />
                  {hasUnreadNotifications && (
                    <Animated.View
                      style={[
                        styles.notificationBadge,
                        { transform: [{ scale: pulseAnim }] },
                      ]}
                    >
                      <View style={styles.badgeInner} />
                    </Animated.View>
                  )}
                </View>
              </LinearGradient>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Decorative elements */}
      <View style={styles.decorativeCircle1} />
      <View style={styles.decorativeCircle2} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    paddingBottom: SPACING.xs,
  },
  backgroundGradient: {
    position: 'absolute',
    top: -50,
    left: -50,
    right: -50,
    height: 200,
    transform: [{ rotate: '-3deg' }],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  greetingContainer: {
    flex: 1,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  greeting: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  userName: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.primary,
  },
  emoji: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    marginLeft: SPACING.sm,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
    letterSpacing: 0.1,
  },
  notificationButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  notificationBlur: {
    flex: 1,
    borderRadius: 24,
  },
  notificationGradient: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  notificationContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.white,
  },
  decorativeCircle1: {
    position: 'absolute',
    top: -30,
    right: 30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(37, 99, 235, 0.03)',
  },
  decorativeCircle2: {
    position: 'absolute',
    top: 20,
    right: -40,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(16, 185, 129, 0.03)',
  },
});
