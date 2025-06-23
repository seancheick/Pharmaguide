// src/components/common/OfflineIndicator.tsx
// 📡 OFFLINE MODE INDICATOR
// Visual indicator for network status and offline mode

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNetworkState } from '../../hooks/useNetworkState';

interface OfflineIndicatorProps {
  style?: any;
  showDetails?: boolean;
}

/**
 * 📡 Offline Indicator Component
 * - Shows current network status
 * - Displays offline queue information
 * - Provides sync controls
 * - Animated status changes
 */
export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  style,
  showDetails = false,
}) => {
  const {
    isOnline,
    isOffline,
    networkType,
    queueSize,
    syncOfflineQueue,
    clearOfflineQueue,
    getQueueStats,
  } = useNetworkState();

  const [showModal, setShowModal] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    try {
      setSyncing(true);
      await syncOfflineQueue();
      Alert.alert(
        'Sync Complete',
        'All offline actions have been synchronized.'
      );
    } catch (error) {
      Alert.alert(
        'Sync Failed',
        'Failed to sync offline actions. Please try again.'
      );
    } finally {
      setSyncing(false);
    }
  };

  const handleClearQueue = () => {
    Alert.alert(
      'Clear Offline Queue',
      'Are you sure you want to clear all queued offline actions? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearOfflineQueue();
            Alert.alert(
              'Queue Cleared',
              'All offline actions have been removed.'
            );
          },
        },
      ]
    );
  };

  const getStatusConfig = () => {
    if (isOnline) {
      return {
        icon: 'wifi' as const,
        color: '#34C759',
        text: 'Online',
        backgroundColor: '#E8F5E8',
      };
    } else {
      return {
        icon: 'cloud-offline' as const,
        color: '#FF3B30',
        text: 'Offline',
        backgroundColor: '#FFE8E8',
      };
    }
  };

  const statusConfig = getStatusConfig();

  if (!showDetails && isOnline && queueSize === 0) {
    // Don't show indicator when online and no queue
    return null;
  }

  return (
    <>
      <TouchableOpacity
        style={[
          styles.indicator,
          { backgroundColor: statusConfig.backgroundColor },
          style,
        ]}
        onPress={() => setShowModal(true)}
        disabled={!showDetails}
      >
        <Ionicons
          name={statusConfig.icon}
          size={16}
          color={statusConfig.color}
        />
        <Text style={[styles.statusText, { color: statusConfig.color }]}>
          {statusConfig.text}
        </Text>
        {queueSize > 0 && (
          <View style={styles.queueBadge}>
            <Text style={styles.queueText}>{queueSize}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Detailed Status Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Network Status</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Current Status */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Current Status</Text>
              <View style={styles.statusRow}>
                <Ionicons
                  name={statusConfig.icon}
                  size={24}
                  color={statusConfig.color}
                />
                <View style={styles.statusInfo}>
                  <Text
                    style={[styles.statusLabel, { color: statusConfig.color }]}
                  >
                    {statusConfig.text}
                  </Text>
                  <Text style={styles.statusDetail}>
                    Connection: {networkType.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>

            {/* Offline Queue */}
            {queueSize > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Offline Queue</Text>
                <View style={styles.queueInfo}>
                  <Text style={styles.queueDescription}>
                    {queueSize} action{queueSize !== 1 ? 's' : ''} waiting to
                    sync
                  </Text>
                  <QueueDetails getQueueStats={getQueueStats} />
                </View>
              </View>
            )}

            {/* Actions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Actions</Text>

              {queueSize > 0 && isOnline && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.syncButton]}
                  onPress={handleSync}
                  disabled={syncing}
                >
                  <Ionicons
                    name={syncing ? 'sync' : 'cloud-upload'}
                    size={20}
                    color="#FFFFFF"
                  />
                  <Text style={styles.actionButtonText}>
                    {syncing ? 'Syncing...' : 'Sync Now'}
                  </Text>
                </TouchableOpacity>
              )}

              {queueSize > 0 && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.clearButton]}
                  onPress={handleClearQueue}
                >
                  <Ionicons name="trash" size={20} color="#FF3B30" />
                  <Text style={[styles.actionButtonText, { color: '#FF3B30' }]}>
                    Clear Queue
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Offline Mode Info */}
            {isOffline && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Offline Mode</Text>
                <Text style={styles.offlineInfo}>
                  You're currently offline. The app will continue to work with
                  limited functionality:
                </Text>
                <View style={styles.featureList}>
                  <FeatureItem
                    available={true}
                    text="Rule-based safety checks"
                  />
                  <FeatureItem
                    available={true}
                    text="Cached analysis results"
                  />
                  <FeatureItem available={true} text="Local stack management" />
                  <FeatureItem available={false} text="New AI analysis" />
                  <FeatureItem available={false} text="Product search" />
                  <FeatureItem available={false} text="Data synchronization" />
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
};

/**
 * Queue details component
 */
interface QueueDetailsProps {
  getQueueStats: () => any;
}

const QueueDetails: React.FC<QueueDetailsProps> = ({ getQueueStats }) => {
  const stats = getQueueStats();

  return (
    <View style={styles.queueDetails}>
      {Object.entries(stats.actionTypes).map(([type, count]) => (
        <View key={type} style={styles.queueTypeRow}>
          <Text style={styles.queueType}>{type.replace('_', ' ')}</Text>
          <Text style={styles.queueCount}>{count as number}</Text>
        </View>
      ))}
      {stats.oldestAction && (
        <Text style={styles.queueAge}>
          Oldest: {new Date(stats.oldestAction).toLocaleString()}
        </Text>
      )}
    </View>
  );
};

/**
 * Feature availability item
 */
interface FeatureItemProps {
  available: boolean;
  text: string;
}

const FeatureItem: React.FC<FeatureItemProps> = ({ available, text }) => (
  <View style={styles.featureItem}>
    <Ionicons
      name={available ? 'checkmark-circle' : 'close-circle'}
      size={16}
      color={available ? '#34C759' : '#FF3B30'}
    />
    <Text
      style={[styles.featureText, { color: available ? '#34C759' : '#FF3B30' }]}
    >
      {text}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginHorizontal: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  queueBadge: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  queueText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  placeholder: {
    width: 24,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  statusInfo: {
    marginLeft: 12,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusDetail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  queueInfo: {
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  queueDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  queueDetails: {
    marginTop: 8,
  },
  queueTypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  queueType: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
  },
  queueCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
  },
  queueAge: {
    fontSize: 11,
    color: '#999',
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 12,
  },
  syncButton: {
    backgroundColor: '#007AFF',
  },
  clearButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  offlineInfo: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  featureList: {
    marginTop: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  featureText: {
    fontSize: 14,
    marginLeft: 8,
  },
});
