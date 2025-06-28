// src/hooks/useNavigationState.ts
// Hook for navigation state management and persistence

import { useEffect, useCallback, useRef } from 'react';
import { useNavigation, useNavigationState, useFocusEffect } from '@react-navigation/native';
import { navigationStateManager, NavigationStateUtils } from '../services/navigation/navigationStateManager';
import { useAuth } from './useAuth';

export interface UseNavigationStateOptions {
  persistState?: boolean;
  restoreOnMount?: boolean;
  autoSave?: boolean;
  autoSaveDelay?: number;
}

export interface UseNavigationStateReturn {
  saveCurrentState: () => Promise<void>;
  restoreState: () => Promise<void>;
  clearState: () => Promise<void>;
  canNavigateBack: boolean;
  currentRouteName?: string;
  navigationHistory: string[];
}

/**
 * Hook for navigation state management
 */
export const useNavigationState = (
  options: UseNavigationStateOptions = {}
): UseNavigationStateReturn => {
  const {
    persistState = true,
    restoreOnMount = true,
    autoSave = true,
    autoSaveDelay = 2000,
  } = options;

  const navigation = useNavigation();
  const { user } = useAuth();
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  const navigationHistoryRef = useRef<string[]>([]);
  const lastSavedStateRef = useRef<string>('');

  // Get current navigation state
  const currentState = useNavigationState(state => state);
  const currentRouteName = useNavigationState(state => {
    if (!state) return undefined;
    
    const route = state.routes[state.index];
    return route?.name;
  });

  /**
   * Save current navigation state
   */
  const saveCurrentState = useCallback(async (): Promise<void> => {
    if (!persistState || !currentState) return;

    try {
      const sanitizedState = NavigationStateUtils.sanitizeNavigationState(currentState);
      await navigationStateManager.saveNavigationState(sanitizedState);
      
      const stateString = JSON.stringify(sanitizedState);
      lastSavedStateRef.current = stateString;
    } catch (error) {
      console.error('Failed to save navigation state:', error);
    }
  }, [persistState, currentState]);

  /**
   * Restore navigation state
   */
  const restoreState = useCallback(async (): Promise<void> => {
    if (!persistState) return;

    try {
      const restoredState = await navigationStateManager.restoreNavigationState();
      
      if (restoredState && NavigationStateUtils.isValidNavigationState(restoredState)) {
        // Note: Actual state restoration would need to be handled at the NavigationContainer level
        console.log('📥 Navigation state available for restoration');
      }
    } catch (error) {
      console.error('Failed to restore navigation state:', error);
    }
  }, [persistState]);

  /**
   * Clear navigation state
   */
  const clearState = useCallback(async (): Promise<void> => {
    try {
      await navigationStateManager.clearNavigationState();
      lastSavedStateRef.current = '';
      navigationHistoryRef.current = [];
    } catch (error) {
      console.error('Failed to clear navigation state:', error);
    }
  }, []);

  /**
   * Auto-save navigation state with debouncing
   */
  const scheduleAutoSave = useCallback(() => {
    if (!autoSave || !currentState) return;

    const currentStateString = JSON.stringify(currentState);
    
    // Only save if state has actually changed
    if (currentStateString === lastSavedStateRef.current) return;

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      saveCurrentState();
    }, autoSaveDelay);
  }, [autoSave, currentState, autoSaveDelay, saveCurrentState]);

  /**
   * Update navigation history
   */
  const updateNavigationHistory = useCallback(() => {
    if (currentRouteName) {
      const history = navigationHistoryRef.current;
      
      // Add to history if it's a new route
      if (history[history.length - 1] !== currentRouteName) {
        history.push(currentRouteName);
        
        // Keep only last 10 routes
        if (history.length > 10) {
          history.shift();
        }
      }
    }
  }, [currentRouteName]);

  // Initialize navigation state manager
  useEffect(() => {
    navigationStateManager.initialize(user?.id);
  }, [user?.id]);

  // Restore state on mount
  useEffect(() => {
    if (restoreOnMount) {
      restoreState();
    }
  }, [restoreOnMount, restoreState]);

  // Auto-save when navigation state changes
  useEffect(() => {
    scheduleAutoSave();
  }, [scheduleAutoSave]);

  // Update navigation history when route changes
  useEffect(() => {
    updateNavigationHistory();
  }, [updateNavigationHistory]);

  // Save state when screen loses focus
  useFocusEffect(
    useCallback(() => {
      return () => {
        if (autoSave) {
          saveCurrentState();
        }
      };
    }, [autoSave, saveCurrentState])
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      // Save final state
      if (autoSave && currentState) {
        saveCurrentState();
      }
    };
  }, [autoSave, currentState, saveCurrentState]);

  return {
    saveCurrentState,
    restoreState,
    clearState,
    canNavigateBack: navigation.canGoBack(),
    currentRouteName,
    navigationHistory: [...navigationHistoryRef.current],
  };
};

/**
 * Hook for navigation guards
 */
export const useNavigationGuards = (
  screenName: string,
  guards: Array<{
    condition: () => boolean | Promise<boolean>;
    message?: string;
    onBlock?: () => void;
    priority?: number;
  }>
) => {
  useEffect(() => {
    // Register guards
    guards.forEach(guard => {
      const rule = NavigationStateUtils.createGuardRule(screenName, guard.condition, {
        message: guard.message,
        onBlock: guard.onBlock,
        priority: guard.priority,
      });
      
      navigationStateManager.registerGuard(rule);
    });

    // Cleanup guards on unmount
    return () => {
      guards.forEach(guard => {
        navigationStateManager.unregisterGuard(screenName, guard.condition);
      });
    };
  }, [screenName, guards]);

  const checkGuards = useCallback(async () => {
    return await navigationStateManager.checkNavigationGuards(screenName);
  }, [screenName]);

  return { checkGuards };
};

/**
 * Hook for route protection
 */
export const useRouteProtection = (
  screenName: string,
  protectionCondition: () => boolean | Promise<boolean>,
  options: {
    message?: string;
    onBlock?: () => void;
    priority?: number;
  } = {}
) => {
  const { checkGuards } = useNavigationGuards(screenName, [
    {
      condition: protectionCondition,
      message: options.message || `Access to ${screenName} is restricted`,
      onBlock: options.onBlock,
      priority: options.priority || 100, // High priority for route protection
    },
  ]);

  return { checkGuards };
};

/**
 * Navigation state utilities for components
 */
export const NavigationStateHookUtils = {
  /**
   * Create navigation state options
   */
  createOptions: (
    persistState: boolean = true,
    autoSave: boolean = true,
    autoSaveDelay: number = 2000
  ): UseNavigationStateOptions => ({
    persistState,
    restoreOnMount: persistState,
    autoSave,
    autoSaveDelay,
  }),

  /**
   * Check if current route matches
   */
  isCurrentRoute: (routeName: string, currentRouteName?: string): boolean => {
    return currentRouteName === routeName;
  },

  /**
   * Check if route is in navigation history
   */
  isInHistory: (routeName: string, history: string[]): boolean => {
    return history.includes(routeName);
  },

  /**
   * Get previous route from history
   */
  getPreviousRoute: (history: string[]): string | undefined => {
    return history.length > 1 ? history[history.length - 2] : undefined;
  },
};
