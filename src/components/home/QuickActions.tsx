// src/components/home/QuickActions.tsx
import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { COLORS, SPACING, TYPOGRAPHY, ANIMATIONS } from '../../constants';

interface QuickActionsProps {
  onScanPress: () => void;
  onAIChatPress: () => void;
  onStackPress: () => void;
  onSearchPress?: () => void;
  stackItemCount?: number;
}

interface ActionCardProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  isPrimary?: boolean;
  onPress: () => void;
  badge?: number;
  delay?: number;
  gradient?: readonly [string, string, ...string[]];
}

const ActionCard: React.FC<ActionCardProps> = ({
  title,
  subtitle,
  icon,
  isPrimary = false,
  onPress,
  badge,
  delay = 0,
  gradient = [COLORS.white, COLORS.gray50],
}) => {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: ANIMATIONS.DURATION.normal,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, fadeAnim, delay]);

  const handlePressIn = () => {
    Animated.spring(pressAnim, {
      toValue: 0.95,
      tension: 40,
      friction: 6,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressAnim, {
      toValue: 1,
      tension: 40,
      friction: 6,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.actionCardContainer,
        isPrimary && styles.primaryCardContainer,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }, { scale: pressAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.actionCardTouchable}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        {isPrimary ? (
          <LinearGradient
            colors={gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.primaryGradient}
          >
            <View style={styles.primaryIconContainer}>{icon}</View>
            <Text style={styles.primaryActionTitle}>{title}</Text>
            <Text style={styles.primaryActionSubtitle}>{subtitle}</Text>
          </LinearGradient>
        ) : (
          <>
            {Platform.OS === 'ios' ? (
              <BlurView intensity={30} tint="light" style={styles.blurCard}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.7)', 'rgba(249,250,251,0.7)']}
                  style={styles.cardGradientOverlay}
                />
                <View style={styles.cardContent}>
                  <View
                    style={[
                      styles.actionIcon,
                      badge !== undefined && badge > 0 && styles.iconWithBadge,
                    ]}
                  >
                    {icon}
                    {badge !== undefined && badge > 0 && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>
                          {badge > 99 ? '99+' : badge}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.actionTitle}>{title}</Text>
                  <Text style={styles.actionSubtitle}>{subtitle}</Text>
                </View>
              </BlurView>
            ) : (
              <LinearGradient
                colors={['rgba(255,255,255,0.95)', 'rgba(249,250,251,0.95)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.androidCard}
              >
                <View style={styles.cardContent}>
                  <View
                    style={[
                      styles.actionIcon,
                      badge !== undefined && badge > 0 && styles.iconWithBadge,
                    ]}
                  >
                    {icon}
                    {badge !== undefined && badge > 0 && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>
                          {badge > 99 ? '99+' : badge}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.actionTitle}>{title}</Text>
                  <Text style={styles.actionSubtitle}>{subtitle}</Text>
                </View>
              </LinearGradient>
            )}
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

export const QuickActions: React.FC<QuickActionsProps> = ({
  onScanPress,
  onAIChatPress,
  onStackPress,
  onSearchPress,
  stackItemCount = 0,
}) => {
  const titleFadeAnim = useRef(new Animated.Value(0)).current;
  const titleSlideAnim = useRef(new Animated.Value(-10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(titleFadeAnim, {
        toValue: 1,
        duration: ANIMATIONS.DURATION.normal,
        useNativeDriver: true,
      }),
      Animated.spring(titleSlideAnim, {
        toValue: 0,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, [titleFadeAnim, titleSlideAnim]);

  return (
    <View style={styles.container}>
      <Animated.Text
        style={[
          styles.title,
          {
            opacity: titleFadeAnim,
            transform: [{ translateY: titleSlideAnim }],
          },
        ]}
      >
        Quick Actions
      </Animated.Text>

      <View style={styles.actionsGrid}>
        {/* Primary Scan Action */}
        <ActionCard
          title="Scan Product"
          subtitle="Check interactions"
          icon={<Ionicons name="scan" size={32} color={COLORS.white} />}
          isPrimary
          onPress={onScanPress}
          delay={0}
          gradient={[COLORS.primary, COLORS.primaryDark]}
        />

        {/* Secondary Actions Container */}
        <View style={styles.secondaryActionsContainer}>
          {/* AI Chat Action */}
          <ActionCard
            title="AI Assistant"
            subtitle="Get advice"
            icon={
              <MaterialIcons
                name="psychology"
                size={24}
                color={COLORS.primary}
              />
            }
            onPress={onAIChatPress}
            delay={100}
          />

          {/* Stack Action */}
          <ActionCard
            title="My Stack"
            subtitle={
              stackItemCount > 0 ? `${stackItemCount} items` : 'View all'
            }
            icon={
              <MaterialIcons
                name="inventory-2"
                size={24}
                color={COLORS.accent}
              />
            }
            onPress={onStackPress}
            badge={stackItemCount}
            delay={200}
          />

          {/* Search Action */}
          {onSearchPress && (
            <ActionCard
              title="Search"
              subtitle="Find products"
              icon={
                <Ionicons name="search" size={24} color={COLORS.secondary} />
              }
              onPress={onSearchPress}
              delay={300}
            />
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    letterSpacing: -0.3,
  },
  actionsGrid: {
    gap: SPACING.md,
  },
  secondaryActionsContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionCardContainer: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryCardContainer: {
    flex: 0,
    width: '100%',
    height: 120,
    marginBottom: SPACING.xs,
  },
  actionCardTouchable: {
    flex: 1,
  },
  primaryGradient: {
    flex: 1,
    padding: SPACING.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  blurCard: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardGradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  androidCard: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  cardContent: {
    flex: 1,
    padding: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...StyleSheet.absoluteFillObject,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    position: 'relative',
  },
  iconWithBadge: {
    marginBottom: SPACING.md,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  badgeText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.white,
  },
  primaryActionTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.white,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  primaryActionSubtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  actionTitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: 2,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
