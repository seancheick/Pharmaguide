// src/components/common/OfflineModeScreen.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNetworkState } from '../../hooks/useNetworkState';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';

interface OfflineModeScreenProps {
  onRetry?: () => void;
  onContinueOffline?: () => void;
  title?: string;
  message?: string;
  showOfflineFeatures?: boolean;
}

export const OfflineModeScreen: React.FC<OfflineModeScreenProps> = ({
  onRetry,
  onContinueOffline,
  title = "You're Offline",
  message = "No internet connection detected. You can still use many features with local data.",
  showOfflineFeatures = true,
}) => {
  const {
    isOnline,
    networkType,
    queueSize,
    syncOfflineQueue,
    getQueueStats,
  } = useNetworkState();

  const handleRetry = async () => {
    if (isOnline && queueSize > 0) {
      await syncOfflineQueue();
    }
    onRetry?.();
  };

  const offlineFeatures = [
    {
      icon: 'search-outline',
      title: 'Browse Your Stack',
      description: 'View and manage your saved supplements and medications',
      available: true,
    },
    {
      icon: 'analytics-outline',
      title: 'Local Analysis',
      description: 'Get interaction warnings using our offline rule-based engine',
      available: true,
    },
    {
      icon: 'library-outline',
      title: 'Cached Data',
      description: 'Access previously viewed product information',
      available: true,
    },
    {
      icon: 'scan-outline',
      title: 'Barcode Scanning',
      description: 'Scan products and queue for analysis when online',
      available: true,
    },
    {
      icon: 'cloud-upload-outline',
      title: 'AI Analysis',
      description: 'Advanced AI features require internet connection',
      available: false,
    },
    {
      icon: 'refresh-outline',
      title: 'Live Data Updates',
      description: 'Real-time product and interaction data',
      available: false,
    },
  ];

  const queueStats = getQueueStats();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons
              name="cloud-offline-outline"
              size={64}
              color={COLORS.warning}
            />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
        </View>

        {/* Network Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Ionicons
              name={isOnline ? 'wifi' : 'wifi-off'}
              size={20}
              color={isOnline ? COLORS.success : COLORS.error}
            />
            <Text style={styles.statusTitle}>
              {isOnline ? `Connected (${networkType.toUpperCase()})` : 'No Connection'}
            </Text>
          </View>
          
          {queueSize > 0 && (
            <View style={styles.queueInfo}>
              <Text style={styles.queueText}>
                {queueSize} actions queued for sync
              </Text>
              {queueStats && (
                <Text style={styles.queueDetails}>
                  Last sync attempt: {new Date(queueStats.lastSyncAttempt || 0).toLocaleTimeString()}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Available Features */}
        {showOfflineFeatures && (
          <View style={styles.featuresSection}>
            <Text style={styles.sectionTitle}>Available Features</Text>
            {offlineFeatures.map((feature, index) => (
              <View
                key={index}
                style={[
                  styles.featureItem,
                  !feature.available && styles.featureItemDisabled,
                ]}
              >
                <View style={styles.featureIcon}>
                  <Ionicons
                    name={feature.icon as any}
                    size={24}
                    color={feature.available ? COLORS.primary : COLORS.gray400}
                  />
                </View>
                <View style={styles.featureContent}>
                  <Text
                    style={[
                      styles.featureTitle,
                      !feature.available && styles.featureTitleDisabled,
                    ]}
                  >
                    {feature.title}
                  </Text>
                  <Text
                    style={[
                      styles.featureDescription,
                      !feature.available && styles.featureDescriptionDisabled,
                    ]}
                  >
                    {feature.description}
                  </Text>
                </View>
                <Ionicons
                  name={feature.available ? 'checkmark-circle' : 'close-circle'}
                  size={20}
                  color={feature.available ? COLORS.success : COLORS.gray400}
                />
              </View>
            ))}
          </View>
        )}

        {/* Privacy Notice */}
        <View style={styles.privacyNotice}>
          <Ionicons name="shield-checkmark" size={20} color={COLORS.primary} />
          <Text style={styles.privacyText}>
            🔒 Your health data remains secure and encrypted on your device even when offline.
          </Text>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actions}>
        {onContinueOffline && (
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={onContinueOffline}
          >
            <Text style={styles.secondaryButtonText}>Continue Offline</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleRetry}
        >
          <Ionicons name="refresh" size={20} color={COLORS.background} />
          <Text style={styles.primaryButtonText}>
            {isOnline && queueSize > 0 ? 'Sync Now' : 'Try Again'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  iconContainer: {
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  message: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  statusCard: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  statusTitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
  },
  queueInfo: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  queueText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  queueDetails: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textTertiary,
  },
  featuresSection: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  featureItemDisabled: {
    opacity: 0.6,
  },
  featureIcon: {
    marginRight: SPACING.md,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  featureTitleDisabled: {
    color: COLORS.textTertiary,
  },
  featureDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
  },
  featureDescriptionDisabled: {
    color: COLORS.textTertiary,
  },
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
  },
  privacyText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  actions: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
    gap: SPACING.md,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: 12,
    gap: SPACING.sm,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  primaryButtonText: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.background,
  },
  secondaryButtonText: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
  },
});
