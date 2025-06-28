// src/services/navigation/navigationRecoveryService.ts
// Navigation state recovery and restoration service

import { NavigationState, PartialState } from '@react-navigation/native';
import { storageAdapter } from '../storage/storageAdapter';
import { performanceMonitor } from '../performance/performanceMonitor';

interface NavigationSnapshot {
  state: NavigationState | PartialState<NavigationState>;
  timestamp: number;
  version: string;
  userId?: string;
  sessionId: string;
  appVersion: string;
  routeHistory: string[];
  metadata: {
    lastActiveRoute: string;
    totalScreenTime: number;
    navigationCount: number;
  };
}

interface RecoveryOptions {
  maxAge?: number; // Maximum age in milliseconds
  validateRoutes?: boolean; // Validate routes exist before restoring
  sanitizeParams?: boolean; // Remove sensitive parameters
  preserveHistory?: boolean; // Keep navigation history
  fallbackRoute?: string; // Route to navigate to if recovery fails
}

const NAVIGATION_SNAPSHOT_KEY = '@pharmaguide_nav_snapshot';
const NAVIGATION_HISTORY_KEY = '@pharmaguide_nav_history';
const RECOVERY_VERSION = '1.0.0';
const DEFAULT_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours
const MAX_HISTORY_SIZE = 50;

/**
 * Navigation Recovery Service
 * Handles navigation state persistence and intelligent recovery
 */
export class NavigationRecoveryService {
  private static instance: NavigationRecoveryService;
  private sessionId: string;
  private routeHistory: string[] = [];
  private navigationCount: number = 0;
  private sessionStartTime: number = Date.now();
  private currentUserId?: string;
  private validRoutes: Set<string> = new Set();

  static getInstance(): NavigationRecoveryService {
    if (!NavigationRecoveryService.instance) {
      NavigationRecoveryService.instance = new NavigationRecoveryService();
    }
    return NavigationRecoveryService.instance;
  }

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  /**
   * Initialize the recovery service
   */
  async initialize(userId?: string, validRoutes: string[] = []): Promise<void> {
    try {
      await storageAdapter.initialize();
      this.currentUserId = userId;
      this.validRoutes = new Set(validRoutes);
      
      // Load existing navigation history
      await this.loadNavigationHistory();
      
      console.log('✅ Navigation recovery service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize navigation recovery service:', error);
    }
  }

  /**
   * Create a navigation snapshot
   */
  async createSnapshot(
    state: NavigationState | PartialState<NavigationState>,
    options: RecoveryOptions = {}
  ): Promise<void> {
    try {
      const {
        sanitizeParams = true,
        preserveHistory = true,
      } = options;

      // Sanitize state if requested
      const sanitizedState = sanitizeParams ? this.sanitizeNavigationState(state) : state;
      
      // Get current route name
      const currentRoute = this.getCurrentRouteName(state);
      if (currentRoute) {
        this.addToHistory(currentRoute);
      }

      const snapshot: NavigationSnapshot = {
        state: sanitizedState,
        timestamp: Date.now(),
        version: RECOVERY_VERSION,
        userId: this.currentUserId,
        sessionId: this.sessionId,
        appVersion: '1.0.0', // Should come from app config
        routeHistory: preserveHistory ? [...this.routeHistory] : [],
        metadata: {
          lastActiveRoute: currentRoute || 'unknown',
          totalScreenTime: Date.now() - this.sessionStartTime,
          navigationCount: this.navigationCount,
        },
      };

      await performanceMonitor.measureAsync(
        'navigation_snapshot_save',
        () => storageAdapter.setItem(NAVIGATION_SNAPSHOT_KEY, JSON.stringify(snapshot)),
        'storage'
      );

      console.log('📸 Navigation snapshot created');
    } catch (error) {
      console.error('❌ Failed to create navigation snapshot:', error);
    }
  }

  /**
   * Restore navigation state from snapshot
   */
  async restoreSnapshot(options: RecoveryOptions = {}): Promise<NavigationState | PartialState<NavigationState> | null> {
    try {
      const {
        maxAge = DEFAULT_MAX_AGE,
        validateRoutes = true,
        fallbackRoute,
      } = options;

      const stored = await performanceMonitor.measureAsync(
        'navigation_snapshot_restore',
        () => storageAdapter.getItem(NAVIGATION_SNAPSHOT_KEY),
        'storage'
      );

      if (!stored) {
        console.log('📭 No navigation snapshot found');
        return null;
      }

      const snapshot: NavigationSnapshot = JSON.parse(stored);

      // Validate snapshot
      const validationResult = this.validateSnapshot(snapshot, { maxAge, validateRoutes });
      if (!validationResult.isValid) {
        console.log(`❌ Snapshot validation failed: ${validationResult.reason}`);
        
        if (fallbackRoute) {
          return this.createFallbackState(fallbackRoute);
        }
        
        await this.clearSnapshot();
        return null;
      }

      // Restore navigation history
      if (snapshot.routeHistory) {
        this.routeHistory = snapshot.routeHistory;
      }

      console.log('📥 Navigation snapshot restored successfully');
      return snapshot.state;
    } catch (error) {
      console.error('❌ Failed to restore navigation snapshot:', error);
      return null;
    }
  }

  /**
   * Clear navigation snapshot
   */
  async clearSnapshot(): Promise<void> {
    try {
      await storageAdapter.removeItem(NAVIGATION_SNAPSHOT_KEY);
      console.log('🗑️ Navigation snapshot cleared');
    } catch (error) {
      console.error('❌ Failed to clear navigation snapshot:', error);
    }
  }

  /**
   * Get navigation history
   */
  getNavigationHistory(): string[] {
    return [...this.routeHistory];
  }

  /**
   * Clear navigation history
   */
  async clearNavigationHistory(): Promise<void> {
    try {
      this.routeHistory = [];
      await storageAdapter.removeItem(NAVIGATION_HISTORY_KEY);
      console.log('🗑️ Navigation history cleared');
    } catch (error) {
      console.error('❌ Failed to clear navigation history:', error);
    }
  }

  /**
   * Add route to navigation history
   */
  private addToHistory(routeName: string): void {
    // Don't add duplicate consecutive routes
    if (this.routeHistory[this.routeHistory.length - 1] === routeName) {
      return;
    }

    this.routeHistory.push(routeName);
    this.navigationCount++;

    // Limit history size
    if (this.routeHistory.length > MAX_HISTORY_SIZE) {
      this.routeHistory.shift();
    }

    // Save history periodically
    this.saveNavigationHistory();
  }

  /**
   * Save navigation history to storage
   */
  private async saveNavigationHistory(): Promise<void> {
    try {
      const historyData = {
        routes: this.routeHistory,
        timestamp: Date.now(),
        sessionId: this.sessionId,
        userId: this.currentUserId,
      };

      await storageAdapter.setItem(NAVIGATION_HISTORY_KEY, JSON.stringify(historyData));
    } catch (error) {
      console.error('❌ Failed to save navigation history:', error);
    }
  }

  /**
   * Load navigation history from storage
   */
  private async loadNavigationHistory(): Promise<void> {
    try {
      const stored = await storageAdapter.getItem(NAVIGATION_HISTORY_KEY);
      if (stored) {
        const historyData = JSON.parse(stored);
        
        // Only load if it's from the same user
        if (historyData.userId === this.currentUserId) {
          this.routeHistory = historyData.routes || [];
        }
      }
    } catch (error) {
      console.error('❌ Failed to load navigation history:', error);
    }
  }

  /**
   * Validate navigation snapshot
   */
  private validateSnapshot(
    snapshot: NavigationSnapshot,
    options: { maxAge: number; validateRoutes: boolean }
  ): { isValid: boolean; reason?: string } {
    // Check age
    if (Date.now() - snapshot.timestamp > options.maxAge) {
      return { isValid: false, reason: 'Snapshot too old' };
    }

    // Check version compatibility
    if (snapshot.version !== RECOVERY_VERSION) {
      return { isValid: false, reason: 'Version mismatch' };
    }

    // Check user ID
    if (this.currentUserId && snapshot.userId !== this.currentUserId) {
      return { isValid: false, reason: 'User mismatch' };
    }

    // Validate routes if requested
    if (options.validateRoutes && this.validRoutes.size > 0) {
      const routesInState = this.extractRoutesFromState(snapshot.state);
      const invalidRoutes = routesInState.filter(route => !this.validRoutes.has(route));
      
      if (invalidRoutes.length > 0) {
        return { isValid: false, reason: `Invalid routes: ${invalidRoutes.join(', ')}` };
      }
    }

    return { isValid: true };
  }

  /**
   * Sanitize navigation state
   */
  private sanitizeNavigationState(
    state: NavigationState | PartialState<NavigationState>
  ): NavigationState | PartialState<NavigationState> {
    const sanitized = JSON.parse(JSON.stringify(state));

    const sanitizeRoutes = (routes: any[]): any[] => {
      return routes.map(route => ({
        ...route,
        params: route.params ? this.sanitizeParams(route.params) : undefined,
        state: route.state ? {
          ...route.state,
          routes: sanitizeRoutes(route.state.routes || [])
        } : undefined,
      }));
    };

    if (sanitized.routes) {
      sanitized.routes = sanitizeRoutes(sanitized.routes);
    }

    return sanitized;
  }

  /**
   * Sanitize route parameters
   */
  private sanitizeParams(params: any): any {
    if (!params || typeof params !== 'object') return params;

    const sanitized = { ...params };
    
    // Remove sensitive fields
    const sensitiveFields = [
      'password', 'token', 'secret', 'key', 'auth', 'session',
      'credit_card', 'ssn', 'phone', 'email', 'address'
    ];
    
    sensitiveFields.forEach(field => {
      if (field in sanitized) {
        delete sanitized[field];
      }
    });

    // Limit string length
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'string' && sanitized[key].length > 500) {
        sanitized[key] = sanitized[key].substring(0, 500) + '...';
      }
    });

    return sanitized;
  }

  /**
   * Get current route name from navigation state
   */
  private getCurrentRouteName(state: NavigationState | PartialState<NavigationState>): string | null {
    if (!state || !state.routes || state.index === undefined) {
      return null;
    }

    const currentRoute = state.routes[state.index];
    if (!currentRoute) return null;

    // If the route has nested state, get the deepest route
    if (currentRoute.state) {
      return this.getCurrentRouteName(currentRoute.state);
    }

    return currentRoute.name;
  }

  /**
   * Extract all route names from navigation state
   */
  private extractRoutesFromState(state: NavigationState | PartialState<NavigationState>): string[] {
    const routes: string[] = [];

    const extractRoutes = (navState: any) => {
      if (navState.routes) {
        navState.routes.forEach((route: any) => {
          routes.push(route.name);
          if (route.state) {
            extractRoutes(route.state);
          }
        });
      }
    };

    extractRoutes(state);
    return routes;
  }

  /**
   * Create fallback navigation state
   */
  private createFallbackState(routeName: string): NavigationState {
    return {
      index: 0,
      routes: [{ name: routeName, key: `${routeName}-${Date.now()}` }],
      key: `fallback-${Date.now()}`,
      routeNames: [routeName],
      history: [],
      type: 'stack',
      stale: false,
    };
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Update valid routes
   */
  setValidRoutes(routes: string[]): void {
    this.validRoutes = new Set(routes);
  }

  /**
   * Set current user ID
   */
  setUserId(userId?: string): void {
    this.currentUserId = userId;
  }

  /**
   * Get recovery statistics
   */
  getRecoveryStats(): {
    sessionId: string;
    navigationCount: number;
    sessionDuration: number;
    historySize: number;
    currentUserId?: string;
  } {
    return {
      sessionId: this.sessionId,
      navigationCount: this.navigationCount,
      sessionDuration: Date.now() - this.sessionStartTime,
      historySize: this.routeHistory.length,
      currentUserId: this.currentUserId,
    };
  }
}

// Export singleton instance
export const navigationRecoveryService = NavigationRecoveryService.getInstance();
