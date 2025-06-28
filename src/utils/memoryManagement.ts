// src/utils/memoryManagement.ts
import React from 'react';
import { AppState, AppStateStatus } from 'react-native';

interface MemoryWarning {
  timestamp: number;
  level: 'low' | 'medium' | 'high' | 'critical';
  availableMemory?: number;
  usedMemory?: number;
}

interface CacheItem<T> {
  data: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  size?: number;
}

/**
 * Memory-aware cache with automatic cleanup
 */
export class MemoryAwareCache<T> {
  private cache = new Map<string, CacheItem<T>>();
  private maxSize: number;
  private maxAge: number;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(
    maxSize: number = 100,
    maxAge: number = 30 * 60 * 1000 // 30 minutes
  ) {
    this.maxSize = maxSize;
    this.maxAge = maxAge;
    this.startCleanupTimer();
  }

  set(key: string, value: T, customTTL?: number): void {
    const now = Date.now();
    const item: CacheItem<T> = {
      data: value,
      timestamp: now,
      accessCount: 0,
      lastAccessed: now,
      size: this.estimateSize(value),
    };

    this.cache.set(key, item);

    // Trigger cleanup if cache is getting too large
    if (this.cache.size > this.maxSize) {
      this.cleanup();
    }
  }

  get(key: string): T | undefined {
    const item = this.cache.get(key);
    if (!item) return undefined;

    const now = Date.now();
    const age = now - item.timestamp;

    // Check if item has expired
    if (age > this.maxAge) {
      this.cache.delete(key);
      return undefined;
    }

    // Update access statistics
    item.accessCount++;
    item.lastAccessed = now;

    return item.data;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  private cleanup(): void {
    const now = Date.now();
    const itemsToRemove: string[] = [];

    // Remove expired items
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > this.maxAge) {
        itemsToRemove.push(key);
      }
    }

    // If still over limit, remove least recently used items
    if (this.cache.size - itemsToRemove.length > this.maxSize) {
      const sortedItems = Array.from(this.cache.entries())
        .filter(([key]) => !itemsToRemove.includes(key))
        .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);

      const excessCount = this.cache.size - itemsToRemove.length - this.maxSize;
      for (let i = 0; i < excessCount; i++) {
        itemsToRemove.push(sortedItems[i][0]);
      }
    }

    // Remove items
    itemsToRemove.forEach(key => this.cache.delete(key));

    if (itemsToRemove.length > 0) {
      console.log(`🧹 Cache cleanup: removed ${itemsToRemove.length} items`);
    }
  }

  private estimateSize(value: T): number {
    try {
      return JSON.stringify(value).length * 2; // Rough estimate in bytes
    } catch {
      return 1000; // Default size estimate
    }
  }

  private startCleanupTimer(): void {
    this.cleanupInterval = setInterval(
      () => {
        this.cleanup();
      },
      5 * 60 * 1000
    ); // Cleanup every 5 minutes
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}

/**
 * Memory management service
 */
class MemoryManager {
  private warnings: MemoryWarning[] = [];
  private listeners: ((warning: MemoryWarning) => void)[] = [];
  private appStateSubscription: any = null;

  constructor() {
    this.setupAppStateListener();
  }

  private setupAppStateListener(): void {
    this.appStateSubscription = AppState.addEventListener(
      'change',
      this.handleAppStateChange
    );
  }

  private handleAppStateChange = (nextAppState: AppStateStatus): void => {
    if (nextAppState === 'background') {
      // App is going to background, trigger memory cleanup
      this.triggerMemoryCleanup();
    }
  };

  /**
   * Register a memory warning listener
   */
  onMemoryWarning(listener: (warning: MemoryWarning) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Trigger memory cleanup across the app
   */
  triggerMemoryCleanup(): void {
    console.log('🧹 Triggering app-wide memory cleanup');

    // Emit memory warning to all listeners
    const warning: MemoryWarning = {
      timestamp: Date.now(),
      level: 'medium',
    };

    this.warnings.push(warning);
    this.listeners.forEach(listener => listener(warning));

    // Keep only recent warnings
    this.warnings = this.warnings.slice(-10);
  }

  /**
   * Get memory usage statistics
   */
  getMemoryStats(): {
    warningCount: number;
    recentWarnings: MemoryWarning[];
    lastCleanup?: number;
  } {
    return {
      warningCount: this.warnings.length,
      recentWarnings: this.warnings.slice(-5),
      lastCleanup: this.warnings[this.warnings.length - 1]?.timestamp,
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
    this.listeners = [];
    this.warnings = [];
  }
}

// Global memory manager instance
export const memoryManager = new MemoryManager();

/**
 * Hook for memory-aware components
 */
export const useMemoryManagement = () => {
  const [memoryWarning, setMemoryWarning] =
    React.useState<MemoryWarning | null>(null);

  React.useEffect(() => {
    const unsubscribe = memoryManager.onMemoryWarning(setMemoryWarning);
    return unsubscribe;
  }, []);

  const triggerCleanup = React.useCallback(() => {
    memoryManager.triggerMemoryCleanup();
  }, []);

  return {
    memoryWarning,
    triggerCleanup,
    stats: memoryManager.getMemoryStats(),
  };
};

/**
 * Memory-aware image cache
 */
export const imageCache = new MemoryAwareCache<string>(50, 60 * 60 * 1000); // 1 hour TTL

/**
 * Memory-aware API response cache
 */
export const apiCache = new MemoryAwareCache<any>(200, 30 * 60 * 1000); // 30 minutes TTL

/**
 * Memory-aware product analysis cache
 */
export const analysisCache = new MemoryAwareCache<any>(
  100,
  24 * 60 * 60 * 1000
); // 24 hours TTL

// Cleanup caches when memory warning is triggered
memoryManager.onMemoryWarning(warning => {
  if (warning.level === 'high' || warning.level === 'critical') {
    console.log('🧹 High memory warning: clearing caches');
    imageCache.clear();
    apiCache.clear();
    // Keep analysis cache as it's most valuable
    if (warning.level === 'critical') {
      analysisCache.clear();
    }
  }
});
