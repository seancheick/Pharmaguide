// src/services/storage/performanceStorageWrapper.ts
// Performance wrapper that enhances existing storage with optimizations

import { storageAdapter } from './storageAdapter';
import { optimizedMMKVStorage } from './optimizedMMKVStorage';
import { performanceMonitor } from '../performance/performanceMonitor';

interface CacheEntry {
  value: string;
  timestamp: number;
  hits: number;
}

interface PerformanceConfig {
  enableMemoryCache: boolean;
  enableBatching: boolean;
  enableMetrics: boolean;
  cacheSize: number;
  cacheTTL: number;
  batchDelay: number;
}

/**
 * Performance Storage Wrapper
 * 
 * Enhances existing storage with:
 * - Memory caching for frequently accessed keys
 * - Batch operations for bulk updates
 * - Performance monitoring and metrics
 * - Intelligent cache management
 * - Fallback to existing storage adapter
 */
export class PerformanceStorageWrapper {
  private memoryCache = new Map<string, CacheEntry>();
  private pendingBatch = new Map<string, string>();
  private batchTimer?: NodeJS.Timeout;
  private metrics = {
    reads: 0,
    writes: 0,
    cacheHits: 0,
    cacheMisses: 0,
    batchOperations: 0,
    averageReadTime: 0,
    averageWriteTime: 0,
  };

  private config: PerformanceConfig = {
    enableMemoryCache: true,
    enableBatching: true,
    enableMetrics: true,
    cacheSize: 500,
    cacheTTL: 5 * 60 * 1000, // 5 minutes
    batchDelay: 100, // 100ms batch delay
  };

  constructor(config?: Partial<PerformanceConfig>) {
    this.config = { ...this.config, ...config };
    this.startCleanupTimer();
  }

  /**
   * Enhanced getItem with memory cache
   */
  async getItem(key: string): Promise<string | null> {
    const startTime = Date.now();

    try {
      // Check memory cache first
      if (this.config.enableMemoryCache) {
        const cached = this.memoryCache.get(key);
        if (cached && this.isCacheValid(cached)) {
          cached.hits++;
          this.metrics.cacheHits++;
          this.metrics.reads++;
          return cached.value;
        }
      }

      // Try optimized MMKV first for better performance
      let value: string | null = null;
      
      try {
        const mmkvValue = optimizedMMKVStorage.getString(key);
        value = mmkvValue || null;
      } catch (error) {
        // Fallback to storage adapter
        value = await storageAdapter.getItem(key);
      }

      // Update cache if enabled
      if (value && this.config.enableMemoryCache) {
        this.updateCache(key, value);
      }

      this.metrics.cacheMisses++;
      this.metrics.reads++;
      
      if (this.config.enableMetrics) {
        this.updateAverageReadTime(Date.now() - startTime);
      }

      return value;
    } catch (error) {
      console.warn(`Performance storage getItem failed for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Enhanced setItem with batching and cache update
   */
  async setItem(key: string, value: string): Promise<void> {
    const startTime = Date.now();

    try {
      // Update memory cache immediately
      if (this.config.enableMemoryCache) {
        this.updateCache(key, value);
      }

      // Use batching if enabled
      if (this.config.enableBatching) {
        this.addToBatch(key, value);
      } else {
        await this.writeToStorage(key, value);
      }

      this.metrics.writes++;
      
      if (this.config.enableMetrics) {
        this.updateAverageWriteTime(Date.now() - startTime);
      }
    } catch (error) {
      console.warn(`Performance storage setItem failed for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Batch multiple operations for better performance
   */
  async batchSet(items: Array<{ key: string; value: string }>): Promise<void> {
    const startTime = Date.now();

    try {
      // Update memory cache for all items
      if (this.config.enableMemoryCache) {
        items.forEach(({ key, value }) => {
          this.updateCache(key, value);
        });
      }

      // Try optimized MMKV batch operation first
      try {
        const batchOps = items.map(({ key, value }) => ({
          key,
          value,
          operation: 'set' as const,
        }));
        
        await optimizedMMKVStorage.batchOperations(batchOps);
      } catch (error) {
        // Fallback to individual operations
        const keyValuePairs: [string, string][] = items.map(({ key, value }) => [key, value]);
        await storageAdapter.multiSet(keyValuePairs);
      }

      this.metrics.batchOperations++;
      this.metrics.writes += items.length;

      performanceMonitor.startMeasure('storage_batch_operation');
      performanceMonitor.endMeasure('storage_batch_operation', 'storage');

      console.log(`✅ Batch operation completed: ${items.length} items in ${Date.now() - startTime}ms`);
    } catch (error) {
      console.error('❌ Batch set operation failed:', error);
      throw error;
    }
  }

  /**
   * Remove item from storage and cache
   */
  async removeItem(key: string): Promise<void> {
    try {
      // Remove from memory cache
      this.memoryCache.delete(key);

      // Remove from pending batch
      this.pendingBatch.delete(key);

      // Remove from storage
      try {
        // Try optimized MMKV first
        const { instance } = (optimizedMMKVStorage as any).getInstanceForKey(key);
        instance.delete(key);
      } catch (error) {
        // Fallback to storage adapter
        await storageAdapter.removeItem(key);
      }
    } catch (error) {
      console.warn(`Performance storage removeItem failed for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    const cacheHitRate = this.metrics.reads > 0 
      ? (this.metrics.cacheHits / this.metrics.reads) * 100 
      : 0;

    return {
      ...this.metrics,
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      cacheSize: this.memoryCache.size,
      pendingBatchSize: this.pendingBatch.size,
    };
  }

  /**
   * Clear all caches
   */
  clearCaches(): void {
    this.memoryCache.clear();
    this.pendingBatch.clear();
    
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = undefined;
    }

    // Clear optimized MMKV caches
    optimizedMMKVStorage.clearCaches();
  }

  /**
   * Force flush pending batch operations
   */
  async flushBatch(): Promise<void> {
    if (this.pendingBatch.size === 0) return;

    const items = Array.from(this.pendingBatch.entries()).map(([key, value]) => ({
      key,
      value,
    }));

    this.pendingBatch.clear();
    
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = undefined;
    }

    await this.batchSet(items);
  }

  /**
   * Update memory cache with size management
   */
  private updateCache(key: string, value: string): void {
    // Remove oldest entries if cache is full
    if (this.memoryCache.size >= this.config.cacheSize) {
      const oldestKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(oldestKey);
    }

    this.memoryCache.set(key, {
      value,
      timestamp: Date.now(),
      hits: 1,
    });
  }

  /**
   * Check if cache entry is still valid
   */
  private isCacheValid(entry: CacheEntry): boolean {
    return (Date.now() - entry.timestamp) < this.config.cacheTTL;
  }

  /**
   * Add item to pending batch
   */
  private addToBatch(key: string, value: string): void {
    this.pendingBatch.set(key, value);

    // Schedule batch flush if not already scheduled
    if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => {
        this.flushBatch().catch(error => {
          console.error('Batch flush failed:', error);
        });
      }, this.config.batchDelay);
    }
  }

  /**
   * Write directly to storage (bypassing batch)
   */
  private async writeToStorage(key: string, value: string): Promise<void> {
    try {
      // Try optimized MMKV first
      optimizedMMKVStorage.setString(key, value);
    } catch (error) {
      // Fallback to storage adapter
      await storageAdapter.setItem(key, value);
    }
  }

  /**
   * Update average read time metric
   */
  private updateAverageReadTime(duration: number): void {
    const total = this.metrics.averageReadTime * (this.metrics.reads - 1);
    this.metrics.averageReadTime = (total + duration) / this.metrics.reads;
  }

  /**
   * Update average write time metric
   */
  private updateAverageWriteTime(duration: number): void {
    const total = this.metrics.averageWriteTime * (this.metrics.writes - 1);
    this.metrics.averageWriteTime = (total + duration) / this.metrics.writes;
  }

  /**
   * Start cleanup timer for cache management
   */
  private startCleanupTimer(): void {
    setInterval(() => {
      this.performCleanup();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * Perform periodic cleanup
   */
  private performCleanup(): void {
    const now = Date.now();
    
    // Clean expired cache entries
    for (const [key, entry] of this.memoryCache) {
      if (!this.isCacheValid(entry)) {
        this.memoryCache.delete(key);
      }
    }

    console.log(`🧹 Performance storage cleanup completed. Cache size: ${this.memoryCache.size}`);
  }
}

// Global performance storage instance
export const performanceStorage = new PerformanceStorageWrapper({
  enableMemoryCache: true,
  enableBatching: true,
  enableMetrics: true,
  cacheSize: 1000,
  cacheTTL: 10 * 60 * 1000, // 10 minutes
  batchDelay: 50, // 50ms for faster batching
});
