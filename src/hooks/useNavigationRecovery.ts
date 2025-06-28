// src/hooks/useNavigationRecovery.ts
// Hook for navigation state recovery and persistence

import { useEffect, useCallback, useRef, useState } from 'react';
import { useNavigation, useNavigationState, useFocusEffect } from '@react-navigation/native';
import { AppState, AppStateStatus } from 'react-native';
import { navigationRecoveryService } from '../services/navigation/navigationRecoveryService';
import { useAuth } from './useAuth';

export interface NavigationRecoveryOptions {
  enableAutoSave?: boolean;
  autoSaveInterval?: number; // in milliseconds
  maxAge?: number; // maximum age for recovery
  validateRoutes?: boolean;
  fallbackRoute?: string;
  saveOnAppStateChange?: boolean;
  saveOnUnmount?: boolean;
}

export interface NavigationRecoveryReturn {
  createSnapshot: () => Promise<void>;
  restoreSnapshot: () => Promise<boolean>;
  clearSnapshot: () => Promise<void>;
  getNavigationHistory: () => string[];
  clearHistory: () => Promise<void>;
  isRecoveryAvailable: boolean;
  recoveryStats: any;
}

/**
 * Hook for navigation recovery functionality
 */
export const useNavigationRecovery = (
  validRoutes: string[] = [],
  options: NavigationRecoveryOptions = {}
): NavigationRecoveryReturn => {
  const {
    enableAutoSave = true,
    autoSaveInterval = 30000, // 30 seconds
    maxAge = 24 * 60 * 60 * 1000, // 24 hours
    validateRoutes = true,
    fallbackRoute = 'Home',
    saveOnAppStateChange = true,
    saveOnUnmount = true,
  } = options;

  const navigation = useNavigation();
  const { user } = useAuth();
  const [isRecoveryAvailable, setIsRecoveryAvailable] = useState(false);
  const [recoveryStats, setRecoveryStats] = useState<any>({});

  const autoSaveIntervalRef = useRef<NodeJS.Timeout>();
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const lastSaveTimeRef = useRef<number>(0);

  // Get current navigation state
  const currentState = useNavigationState(state => state);

  /**
   * Initialize recovery service
   */
  useEffect(() => {
    const initializeRecovery = async () => {
      try {
        await navigationRecoveryService.initialize(user?.id, validRoutes);
        
        // Update recovery availability
        const stats = navigationRecoveryService.getRecoveryStats();
        setRecoveryStats(stats);
        setIsRecoveryAvailable(true);
      } catch (error) {
        console.error('Failed to initialize navigation recovery:', error);
        setIsRecoveryAvailable(false);
      }
    };

    initializeRecovery();
  }, [user?.id, validRoutes]);

  /**
   * Create navigation snapshot
   */
  const createSnapshot = useCallback(async (): Promise<void> => {
    if (!currentState || !isRecoveryAvailable) return;

    try {
      await navigationRecoveryService.createSnapshot(currentState, {
        maxAge,
        validateRoutes,
        sanitizeParams: true,
        preserveHistory: true,
      });

      lastSaveTimeRef.current = Date.now();
      
      // Update stats
      const stats = navigationRecoveryService.getRecoveryStats();
      setRecoveryStats(stats);
    } catch (error) {
      console.error('Failed to create navigation snapshot:', error);
    }
  }, [currentState, isRecoveryAvailable, maxAge, validateRoutes]);

  /**
   * Restore navigation snapshot
   */
  const restoreSnapshot = useCallback(async (): Promise<boolean> => {
    if (!isRecoveryAvailable) return false;

    try {
      const restoredState = await navigationRecoveryService.restoreSnapshot({
        maxAge,
        validateRoutes,
        fallbackRoute,
      });

      if (restoredState) {
        console.log('📥 Navigation state restored from snapshot');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to restore navigation snapshot:', error);
      return false;
    }
  }, [isRecoveryAvailable, maxAge, validateRoutes, fallbackRoute]);

  /**
   * Clear navigation snapshot
   */
  const clearSnapshot = useCallback(async (): Promise<void> => {
    try {
      await navigationRecoveryService.clearSnapshot();
      setIsRecoveryAvailable(false);
    } catch (error) {
      console.error('Failed to clear navigation snapshot:', error);
    }
  }, []);

  /**
   * Get navigation history
   */
  const getNavigationHistory = useCallback((): string[] => {
    return navigationRecoveryService.getNavigationHistory();
  }, []);

  /**
   * Clear navigation history
   */
  const clearHistory = useCallback(async (): Promise<void> => {
    try {
      await navigationRecoveryService.clearNavigationHistory();
    } catch (error) {
      console.error('Failed to clear navigation history:', error);
    }
  }, []);

  /**
   * Auto-save navigation state
   */
  const startAutoSave = useCallback(() => {
    if (!enableAutoSave) return;

    if (autoSaveIntervalRef.current) {
      clearInterval(autoSaveIntervalRef.current);
    }

    autoSaveIntervalRef.current = setInterval(() => {
      const now = Date.now();
      
      // Only save if enough time has passed since last save
      if (now - lastSaveTimeRef.current > autoSaveInterval) {
        createSnapshot();
      }
    }, autoSaveInterval);
  }, [enableAutoSave, autoSaveInterval, createSnapshot]);

  /**
   * Stop auto-save
   */
  const stopAutoSave = useCallback(() => {
    if (autoSaveIntervalRef.current) {
      clearInterval(autoSaveIntervalRef.current);
      autoSaveIntervalRef.current = undefined;
    }
  }, []);

  /**
   * Handle app state changes
   */
  const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
    if (saveOnAppStateChange) {
      // Save when app goes to background
      if (appStateRef.current === 'active' && nextAppState.match(/inactive|background/)) {
        createSnapshot();
      }
    }

    appStateRef.current = nextAppState;
  }, [saveOnAppStateChange, createSnapshot]);

  // Set up app state listener
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [handleAppStateChange]);

  // Start/stop auto-save based on screen focus
  useFocusEffect(
    useCallback(() => {
      startAutoSave();
      return () => stopAutoSave();
    }, [startAutoSave, stopAutoSave])
  );

  // Save on unmount if enabled
  useEffect(() => {
    return () => {
      if (saveOnUnmount) {
        createSnapshot();
      }
      stopAutoSave();
    };
  }, [saveOnUnmount, createSnapshot, stopAutoSave]);

  // Update user ID when auth changes
  useEffect(() => {
    if (user?.id) {
      navigationRecoveryService.setUserId(user.id);
    }
  }, [user?.id]);

  // Update valid routes when they change
  useEffect(() => {
    navigationRecoveryService.setValidRoutes(validRoutes);
  }, [validRoutes]);

  return {
    createSnapshot,
    restoreSnapshot,
    clearSnapshot,
    getNavigationHistory,
    clearHistory,
    isRecoveryAvailable,
    recoveryStats,
  };
};

/**
 * Hook for simple navigation recovery
 */
export const useSimpleNavigationRecovery = (validRoutes: string[] = []) => {
  return useNavigationRecovery(validRoutes, {
    enableAutoSave: true,
    autoSaveInterval: 30000,
    validateRoutes: true,
    saveOnAppStateChange: true,
    saveOnUnmount: true,
  });
};

/**
 * Navigation recovery utilities
 */
export const NavigationRecoveryUtils = {
  /**
   * Create recovery options
   */
  createOptions: (
    enableAutoSave: boolean = true,
    autoSaveInterval: number = 30000,
    maxAge: number = 24 * 60 * 60 * 1000
  ): NavigationRecoveryOptions => ({
    enableAutoSave,
    autoSaveInterval,
    maxAge,
    validateRoutes: true,
    saveOnAppStateChange: true,
    saveOnUnmount: true,
  }),

  /**
   * Check if recovery should be attempted
   */
  shouldAttemptRecovery: (
    isFirstLaunch: boolean,
    hasValidSession: boolean,
    userLoggedIn: boolean
  ): boolean => {
    return !isFirstLaunch && hasValidSession && userLoggedIn;
  },

  /**
   * Get recovery statistics
   */
  getRecoveryStats: () => {
    return navigationRecoveryService.getRecoveryStats();
  },

  /**
   * Clear all recovery data
   */
  clearAllRecoveryData: async (): Promise<void> => {
    await navigationRecoveryService.clearSnapshot();
    await navigationRecoveryService.clearNavigationHistory();
  },
};
