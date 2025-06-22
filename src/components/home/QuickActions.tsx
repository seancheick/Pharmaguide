// src/components/home/QuickActions.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';

interface QuickActionsProps {
  onScanPress: () => void;
  onAIChatPress: () => void;
  onStackPress: () => void;
  onSearchPress?: () => void;
  stackItemCount?: number;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onScanPress,
  onAIChatPress,
  onStackPress,
  onSearchPress,
  stackItemCount = 0,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quick Actions</Text>

      <View style={styles.actionsGrid}>
        {/* Scan Action */}
        <TouchableOpacity
          style={[styles.actionCard, styles.primaryAction]}
          onPress={onScanPress}
          activeOpacity={0.8}
        >
          <View style={styles.actionIcon}>
            <Ionicons name="scan" size={28} color={COLORS.white} />
          </View>
          <Text style={styles.primaryActionTitle}>Scan Product</Text>
          <Text style={styles.primaryActionSubtitle}>
            Check for interactions
          </Text>
        </TouchableOpacity>

        {/* AI Chat Action */}
        <TouchableOpacity
          style={styles.actionCard}
          onPress={onAIChatPress}
          activeOpacity={0.8}
        >
          <View style={[styles.actionIcon, styles.secondaryIcon]}>
            <MaterialIcons
              name="psychology"
              size={24}
              color={COLORS.secondary}
            />
          </View>
          <Text style={styles.actionTitle}>AI Pharmacist</Text>
          <Text style={styles.actionSubtitle}>Get expert advice</Text>
        </TouchableOpacity>

        {/* Search Action */}
        {onSearchPress && (
          <TouchableOpacity
            style={styles.actionCard}
            onPress={onSearchPress}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIcon, styles.secondaryIcon]}>
              <Ionicons name="search" size={24} color={COLORS.secondary} />
            </View>
            <Text style={styles.actionTitle}>Search</Text>
            <Text style={styles.actionSubtitle}>Find products</Text>
          </TouchableOpacity>
        )}

        {/* Stack Action */}
        <TouchableOpacity
          style={styles.actionCard}
          onPress={onStackPress}
          activeOpacity={0.8}
        >
          <View style={[styles.actionIcon, styles.secondaryIcon]}>
            <MaterialIcons name="inventory-2" size={24} color={COLORS.accent} />
            {stackItemCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{stackItemCount}</Text>
              </View>
            )}
          </View>
          <Text style={styles.actionTitle}>My Stack</Text>
          <Text style={styles.actionSubtitle}>
            {stackItemCount > 0
              ? `${stackItemCount} items`
              : 'View supplements'}
          </Text>
        </TouchableOpacity>
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
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.lg,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  primaryAction: {
    backgroundColor: COLORS.primary,
    flex: 1.2, // Make scan button slightly larger
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    position: 'relative',
  },
  secondaryIcon: {
    backgroundColor: COLORS.backgroundSecondary,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  badgeText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.white,
  },
  primaryActionTitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.white,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  primaryActionSubtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.white,
    opacity: 0.9,
    textAlign: 'center',
  },
  actionTitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
