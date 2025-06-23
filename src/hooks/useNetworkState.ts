// src/hooks/useNetworkState.ts
// 📡 NETWORK STATE HOOK
// React hook for network detection and offline mode

import { useState, useEffect, useCallback } from 'react';
import { networkService, NetworkState } from '../services/network/networkService';

interface UseNetworkStateReturn {
  isOnline: boolean;
  isOffline: boolean;
  networkType: string;
  isWifiEnabled: boolean;
  queueSize: number;
  networkState: NetworkState;
  
  // Actions
  queueOfflineAction: (action: any) => Promise<void>;
  syncOfflineQueue: () => Promise<void>;
  clearOfflineQueue: () => Promise<void>;
  getQueueStats: () => any;
}

/**
 * 📡 Network State Hook
 * - Real-time network status
 * - Offline action management
 * - Queue statistics
 * - Sync controls
 */
export const useNetworkState = (): UseNetworkStateReturn => {
  const [networkState, setNetworkState] = useState<NetworkState>(() => 
    networkService.getNetworkState()
  );

  // Update network state when it changes
  useEffect(() => {
    const unsubscribe = networkService.addNetworkListener((state) => {
      setNetworkState(state);
    });

    // Get initial state
    setNetworkState(networkService.getNetworkState());

    return unsubscribe;
  }, []);

  // Queue offline action
  const queueOfflineAction = useCallback(async (action: any) => {
    await networkService.queueOfflineAction(action);
    // Update state to reflect new queue size
    setNetworkState(networkService.getNetworkState());
  }, []);

  // Sync offline queue
  const syncOfflineQueue = useCallback(async () => {
    await networkService.syncOfflineQueue();
    // Update state to reflect queue changes
    setNetworkState(networkService.getNetworkState());
  }, []);

  // Clear offline queue
  const clearOfflineQueue = useCallback(async () => {
    await networkService.clearOfflineQueue();
    // Update state to reflect empty queue
    setNetworkState(networkService.getNetworkState());
  }, []);

  // Get queue statistics
  const getQueueStats = useCallback(() => {
    return networkService.getOfflineQueueStats();
  }, []);

  return {
    isOnline: networkState.isConnected && networkState.isInternetReachable,
    isOffline: !networkState.isConnected || !networkState.isInternetReachable,
    networkType: networkState.type,
    isWifiEnabled: networkState.isWifiEnabled,
    queueSize: networkState.details?.queueSize || 0,
    networkState,
    
    // Actions
    queueOfflineAction,
    syncOfflineQueue,
    clearOfflineQueue,
    getQueueStats,
  };
};

/**
 * Hook for simple online/offline detection
 */
export const useOnlineStatus = (): boolean => {
  const { isOnline } = useNetworkState();
  return isOnline;
};

/**
 * Hook for offline queue management
 */
export const useOfflineQueue = () => {
  const { queueSize, queueOfflineAction, syncOfflineQueue, clearOfflineQueue, getQueueStats } = useNetworkState();
  
  return {
    queueSize,
    queueOfflineAction,
    syncOfflineQueue,
    clearOfflineQueue,
    getQueueStats,
  };
};
