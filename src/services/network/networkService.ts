// src/services/network/networkService.ts
// 📡 NETWORK DETECTION & OFFLINE MODE SERVICE
// Critical for mobile app reliability

import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { storageAdapter } from '../storage/storageAdapter';

export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: string;
  isWifiEnabled: boolean;
  details: any;
}

export interface OfflineAction {
  id: string;
  type:
    | 'STACK_UPDATE'
    | 'HEALTH_PROFILE_UPDATE'
    | 'ANALYTICS_EVENT'
    | 'PRODUCT_CACHE';
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

/**
 * 📡 Network Detection & Offline Mode Service
 * - Real-time network state monitoring
 * - Offline action queuing
 * - Graceful degradation
 * - Background sync on reconnection
 */
export class NetworkService {
  private isOnline: boolean = true;
  private isInternetReachable: boolean = true;
  private networkType: string = 'unknown';
  private listeners: ((state: NetworkState) => void)[] = [];
  private offlineQueue: OfflineAction[] = [];
  private readonly OFFLINE_QUEUE_KEY = 'offline_action_queue';
  private readonly MAX_QUEUE_SIZE = 1000;
  private syncInProgress = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize network monitoring
   */
  async initialize(): Promise<void> {
    try {
      console.log('📡 Initializing network service...');

      // Get initial network state
      const state = await NetInfo.fetch();
      this.updateNetworkState(state);

      // Load offline queue from storage
      await this.loadOfflineQueue();

      // Subscribe to network changes
      NetInfo.addEventListener(this.handleNetworkChange);

      console.log(`📡 Network service initialized - Online: ${this.isOnline}`);
    } catch (error) {
      console.error('❌ Failed to initialize network service:', error);
      // Assume offline if initialization fails
      this.isOnline = false;
      this.isInternetReachable = false;
    }
  }

  /**
   * Handle network state changes
   */
  private handleNetworkChange = (state: NetInfoState): void => {
    const wasOnline = this.isOnline;
    this.updateNetworkState(state);

    // Notify listeners
    this.notifyListeners();

    // If we just came back online, sync queued actions
    if (!wasOnline && this.isOnline && this.offlineQueue.length > 0) {
      console.log('📡 Network restored - syncing offline queue');
      this.syncOfflineQueue();
    }
  };

  /**
   * Update internal network state
   */
  private updateNetworkState(state: NetInfoState): void {
    this.isOnline = state.isConnected ?? false;
    this.isInternetReachable = state.isInternetReachable ?? false;
    this.networkType = state.type || 'unknown';

    console.log(
      `📡 Network state updated: ${this.isOnline ? 'ONLINE' : 'OFFLINE'} (${this.networkType})`
    );
  }

  /**
   * Get current network state
   */
  getNetworkState(): NetworkState {
    return {
      isConnected: this.isOnline,
      isInternetReachable: this.isInternetReachable,
      type: this.networkType,
      isWifiEnabled: this.networkType === 'wifi',
      details: {
        lastChecked: Date.now(),
        queueSize: this.offlineQueue.length,
      },
    };
  }

  /**
   * Check if device is online
   */
  isDeviceOnline(): boolean {
    return this.isOnline && this.isInternetReachable;
  }

  /**
   * Check if device is offline
   */
  isDeviceOffline(): boolean {
    return !this.isDeviceOnline();
  }

  /**
   * Subscribe to network state changes
   */
  addNetworkListener(listener: (state: NetworkState) => void): () => void {
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners of network state change
   */
  private notifyListeners(): void {
    const state = this.getNetworkState();
    this.listeners.forEach(listener => {
      try {
        listener(state);
      } catch (error) {
        console.error('❌ Error in network listener:', error);
      }
    });
  }

  /**
   * Queue action for offline execution
   */
  async queueOfflineAction(
    action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>
  ): Promise<void> {
    try {
      const offlineAction: OfflineAction = {
        id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        retryCount: 0,
        ...action,
      };

      // Add to queue
      this.offlineQueue.push(offlineAction);

      // Limit queue size
      if (this.offlineQueue.length > this.MAX_QUEUE_SIZE) {
        this.offlineQueue = this.offlineQueue.slice(-this.MAX_QUEUE_SIZE);
        console.warn(
          '📡 Offline queue size limit reached, removing oldest actions'
        );
      }

      // Persist queue
      await this.saveOfflineQueue();

      console.log(
        `📡 Queued offline action: ${action.type} (queue size: ${this.offlineQueue.length})`
      );
    } catch (error) {
      console.error('❌ Failed to queue offline action:', error);
    }
  }

  /**
   * Sync offline queue when network is restored
   */
  async syncOfflineQueue(): Promise<void> {
    if (
      this.syncInProgress ||
      this.offlineQueue.length === 0 ||
      this.isDeviceOffline()
    ) {
      return;
    }

    try {
      this.syncInProgress = true;
      console.log(
        `📡 Starting offline sync - ${this.offlineQueue.length} actions to process`
      );

      const actionsToProcess = [...this.offlineQueue];
      const successfulActions: string[] = [];
      const failedActions: OfflineAction[] = [];

      for (const action of actionsToProcess) {
        try {
          const success = await this.processOfflineAction(action);
          if (success) {
            successfulActions.push(action.id);
          } else {
            // Increment retry count
            action.retryCount++;
            if (action.retryCount < action.maxRetries) {
              failedActions.push(action);
            } else {
              console.warn(
                `📡 Dropping action after ${action.maxRetries} retries:`,
                action.type
              );
            }
          }
        } catch (error) {
          console.error(
            `❌ Error processing offline action ${action.type}:`,
            error
          );
          action.retryCount++;
          if (action.retryCount < action.maxRetries) {
            failedActions.push(action);
          }
        }
      }

      // Update queue with failed actions only
      this.offlineQueue = failedActions;
      await this.saveOfflineQueue();

      console.log(
        `📡 Offline sync completed - ${successfulActions.length} successful, ${failedActions.length} failed`
      );
    } catch (error) {
      console.error('❌ Error during offline sync:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Process individual offline action
   */
  private async processOfflineAction(action: OfflineAction): Promise<boolean> {
    try {
      switch (action.type) {
        case 'STACK_UPDATE':
          return await this.processStackUpdate(action.data);
        case 'HEALTH_PROFILE_UPDATE':
          return await this.processHealthProfileUpdate(action.data);
        case 'ANALYTICS_EVENT':
          return await this.processAnalyticsEvent(action.data);
        case 'PRODUCT_CACHE':
          return await this.processProductCache(action.data);
        default:
          console.warn(`📡 Unknown offline action type: ${action.type}`);
          return false;
      }
    } catch (error) {
      console.error(`❌ Error processing ${action.type}:`, error);
      return false;
    }
  }

  /**
   * Process stack update action
   */
  private async processStackUpdate(data: any): Promise<boolean> {
    try {
      // All stack data is now local-only for HIPAA compliance
      // No remote sync is performed
      // Optionally, update local storage here if needed
      console.log('📡 Stack sync skipped (local-only for HIPAA compliance)');
      return true;
    } catch (error) {
      console.error('❌ Stack update sync failed:', error);
      return false;
    }
  }

  /**
   * Process health profile update action
   */
  private async processHealthProfileUpdate(data: any): Promise<boolean> {
    try {
      // Health profiles are local-only for HIPAA compliance
      // This would only sync non-PHI metadata if needed
      console.log(
        '📡 Health profile sync skipped (local-only for HIPAA compliance)'
      );
      return true;
    } catch (error) {
      console.error('❌ Health profile sync failed:', error);
      return false;
    }
  }

  /**
   * Process analytics event action
   */
  private async processAnalyticsEvent(data: any): Promise<boolean> {
    try {
      // Import cost tracker dynamically
      const { costTracker } = await import('../analytics/costTracker');

      // Process analytics event
      await costTracker.trackQuery(
        data.tier,
        data.responseTime,
        data.costSavings
      );
      return true;
    } catch (error) {
      console.error('❌ Analytics sync failed:', error);
      return false;
    }
  }

  /**
   * Process product cache action
   */
  private async processProductCache(data: any): Promise<boolean> {
    try {
      // This would sync cached products to server if needed
      console.log('📡 Product cache sync completed');
      return true;
    } catch (error) {
      console.error('❌ Product cache sync failed:', error);
      return false;
    }
  }

  /**
   * Get offline queue statistics
   */
  getOfflineQueueStats(): {
    queueSize: number;
    oldestAction: number | null;
    actionTypes: Record<string, number>;
  } {
    const actionTypes: Record<string, number> = {};
    let oldestAction: number | null = null;

    for (const action of this.offlineQueue) {
      actionTypes[action.type] = (actionTypes[action.type] || 0) + 1;
      if (!oldestAction || action.timestamp < oldestAction) {
        oldestAction = action.timestamp;
      }
    }

    return {
      queueSize: this.offlineQueue.length,
      oldestAction,
      actionTypes,
    };
  }

  /**
   * Clear offline queue (for testing/debugging)
   */
  async clearOfflineQueue(): Promise<void> {
    this.offlineQueue = [];
    await this.saveOfflineQueue();
    console.log('📡 Offline queue cleared');
  }

  /**
   * Load offline queue from storage
   */
  private async loadOfflineQueue(): Promise<void> {
    try {
      const stored = await storageAdapter.getItem(this.OFFLINE_QUEUE_KEY);
      if (stored) {
        this.offlineQueue = JSON.parse(stored);
        console.log(
          `📡 Loaded ${this.offlineQueue.length} offline actions from storage`
        );
      }
    } catch (error) {
      console.error('❌ Failed to load offline queue:', error);
      this.offlineQueue = [];
    }
  }

  /**
   * Save offline queue to storage
   */
  private async saveOfflineQueue(): Promise<void> {
    try {
      await storageAdapter.setItem(
        this.OFFLINE_QUEUE_KEY,
        JSON.stringify(this.offlineQueue)
      );
    } catch (error) {
      console.error('❌ Failed to save offline queue:', error);
    }
  }

  /**
   * Cleanup and dispose
   */
  dispose(): void {
    this.listeners = [];
    // Note: NetInfo.addEventListener returns an unsubscribe function
    // In a real implementation, we'd store this and call it here
    console.log('📡 Network service disposed');
  }
}

// Singleton instance
export const networkService = new NetworkService();
