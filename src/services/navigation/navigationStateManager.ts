// src/services/navigation/navigationStateManager.ts
// Navigation state persistence and recovery system

import { NavigationState, PartialState } from '@react-navigation/native';
import { storageAdapter } from '../storage/storageAdapter';
import { performanceMonitor } from '../performance/performanceMonitor';

interface NavigationStateData {
  state: NavigationState | PartialState<NavigationState>;
  timestamp: number;
  version: string;
  userId?: string;
}

interface NavigationGuardRule {
  screenName: string;
  condition: () => boolean | Promise<boolean>;
  message?: string;
  onBlock?: () => void;
  priority?: number;
}

const NAVIGATION_STATE_KEY = '@pharmaguide_navigation_state';
const NAVIGATION_GUARDS_KEY = '@pharmaguide_navigation_guards';
const STATE_VERSION = '1.0.0';
const MAX_STATE_AGE = 30 * 60 * 1000; // 30 minutes

/**
 * Navigation State Manager
 * Handles navigation state persistence, recovery, and route protection
 */
export class NavigationStateManager {
  private static instance: NavigationStateManager;
  private guards: Map<string, NavigationGuardRule[]> = new Map();
  private isInitialized = false;
  private currentUserId?: string;

  static getInstance(): NavigationStateManager {
    if (!NavigationStateManager.instance) {
      NavigationStateManager.instance = new NavigationStateManager();
    }
    return NavigationStateManager.instance;
  }

  /**
   * Initialize the navigation state manager
   */
  async initialize(userId?: string): Promise<void> {
    if (this.isInitialized) return;

    try {
      await storageAdapter.initialize();
      this.currentUserId = userId;
      this.isInitialized = true;
      
      console.log('✅ Navigation state manager initialized');
    } catch (error) {
      console.error('❌ Failed to initialize navigation state manager:', error);
    }
  }

  /**
   * Save navigation state
   */
  async saveNavigationState(state: NavigationState | PartialState<NavigationState>): Promise<void> {
    if (!this.isInitialized) return;

    try {
      const stateData: NavigationStateData = {
        state,
        timestamp: Date.now(),
        version: STATE_VERSION,
        userId: this.currentUserId,
      };

      await performanceMonitor.measureAsync(
        'navigation_state_save',
        () => storageAdapter.setItem(NAVIGATION_STATE_KEY, JSON.stringify(stateData)),
        'storage'
      );

      console.log('💾 Navigation state saved');
    } catch (error) {
      console.error('❌ Failed to save navigation state:', error);
    }
  }

  /**
   * Restore navigation state
   */
  async restoreNavigationState(): Promise<NavigationState | PartialState<NavigationState> | null> {
    if (!this.isInitialized) return null;

    try {
      const stored = await performanceMonitor.measureAsync(
        'navigation_state_restore',
        () => storageAdapter.getItem(NAVIGATION_STATE_KEY),
        'storage'
      );

      if (!stored) return null;

      const stateData: NavigationStateData = JSON.parse(stored);

      // Check if state is expired
      if (Date.now() - stateData.timestamp > MAX_STATE_AGE) {
        console.log('🗑️ Navigation state expired, clearing...');
        await this.clearNavigationState();
        return null;
      }

      // Check version compatibility
      if (stateData.version !== STATE_VERSION) {
        console.log('🔄 Navigation state version mismatch, clearing...');
        await this.clearNavigationState();
        return null;
      }

      // Check user ID match
      if (this.currentUserId && stateData.userId !== this.currentUserId) {
        console.log('👤 Navigation state user mismatch, clearing...');
        await this.clearNavigationState();
        return null;
      }

      console.log('📥 Navigation state restored');
      return stateData.state;
    } catch (error) {
      console.error('❌ Failed to restore navigation state:', error);
      return null;
    }
  }

  /**
   * Clear navigation state
   */
  async clearNavigationState(): Promise<void> {
    try {
      await storageAdapter.removeItem(NAVIGATION_STATE_KEY);
      console.log('🗑️ Navigation state cleared');
    } catch (error) {
      console.error('❌ Failed to clear navigation state:', error);
    }
  }

  /**
   * Register a navigation guard
   */
  registerGuard(rule: NavigationGuardRule): void {
    const { screenName } = rule;
    
    if (!this.guards.has(screenName)) {
      this.guards.set(screenName, []);
    }

    const guards = this.guards.get(screenName)!;
    guards.push(rule);

    // Sort by priority (higher priority first)
    guards.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    console.log(`🛡️ Navigation guard registered for ${screenName}`);
  }

  /**
   * Unregister a navigation guard
   */
  unregisterGuard(screenName: string, condition: () => boolean | Promise<boolean>): void {
    const guards = this.guards.get(screenName);
    if (!guards) return;

    const index = guards.findIndex(guard => guard.condition === condition);
    if (index !== -1) {
      guards.splice(index, 1);
      console.log(`🛡️ Navigation guard unregistered for ${screenName}`);
    }

    if (guards.length === 0) {
      this.guards.delete(screenName);
    }
  }

  /**
   * Check if navigation to a screen should be blocked
   */
  async checkNavigationGuards(screenName: string): Promise<{
    blocked: boolean;
    message?: string;
    guard?: NavigationGuardRule;
  }> {
    const guards = this.guards.get(screenName);
    if (!guards || guards.length === 0) {
      return { blocked: false };
    }

    for (const guard of guards) {
      try {
        const shouldBlock = await guard.condition();
        if (shouldBlock) {
          if (guard.onBlock) {
            guard.onBlock();
          }
          
          return {
            blocked: true,
            message: guard.message,
            guard,
          };
        }
      } catch (error) {
        console.error(`❌ Navigation guard error for ${screenName}:`, error);
      }
    }

    return { blocked: false };
  }

  /**
   * Clear all navigation guards
   */
  clearAllGuards(): void {
    this.guards.clear();
    console.log('🗑️ All navigation guards cleared');
  }

  /**
   * Get active guards for debugging
   */
  getActiveGuards(): Record<string, number> {
    const result: Record<string, number> = {};
    
    for (const [screenName, guards] of this.guards.entries()) {
      result[screenName] = guards.length;
    }

    return result;
  }

  /**
   * Set current user ID
   */
  setUserId(userId?: string): void {
    this.currentUserId = userId;
  }
}

/**
 * Navigation state utilities
 */
export const NavigationStateUtils = {
  /**
   * Check if navigation state is valid
   */
  isValidNavigationState(state: any): state is NavigationState {
    return (
      state &&
      typeof state === 'object' &&
      typeof state.index === 'number' &&
      Array.isArray(state.routes) &&
      state.routes.length > 0
    );
  },

  /**
   * Sanitize navigation state for storage
   */
  sanitizeNavigationState(state: NavigationState | PartialState<NavigationState>): NavigationState | PartialState<NavigationState> {
    // Remove any sensitive data or large objects
    const sanitized = JSON.parse(JSON.stringify(state));
    
    // Remove any params that might contain sensitive data
    const sanitizeRoutes = (routes: any[]) => {
      return routes.map(route => ({
        ...route,
        params: route.params ? this.sanitizeParams(route.params) : undefined,
        state: route.state ? { ...route.state, routes: sanitizeRoutes(route.state.routes || []) } : undefined,
      }));
    };

    if (sanitized.routes) {
      sanitized.routes = sanitizeRoutes(sanitized.routes);
    }

    return sanitized;
  },

  /**
   * Sanitize route parameters
   */
  sanitizeParams(params: any): any {
    if (!params || typeof params !== 'object') return params;

    const sanitized = { ...params };
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];
    sensitiveFields.forEach(field => {
      if (field in sanitized) {
        delete sanitized[field];
      }
    });

    // Limit string length to prevent storage bloat
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'string' && sanitized[key].length > 1000) {
        sanitized[key] = sanitized[key].substring(0, 1000) + '...';
      }
    });

    return sanitized;
  },

  /**
   * Create a navigation guard rule
   */
  createGuardRule(
    screenName: string,
    condition: () => boolean | Promise<boolean>,
    options: {
      message?: string;
      onBlock?: () => void;
      priority?: number;
    } = {}
  ): NavigationGuardRule {
    return {
      screenName,
      condition,
      message: options.message || `Navigation to ${screenName} is currently blocked`,
      onBlock: options.onBlock,
      priority: options.priority || 0,
    };
  },
};

// Export singleton instance
export const navigationStateManager = NavigationStateManager.getInstance();
