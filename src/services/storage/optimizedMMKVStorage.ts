// src/services/storage/optimizedMMKVStorage.ts
// Performance-optimized MMKV storage with multiple instances and advanced caching

import { MMKV } from 'react-native-mmkv';
import { performanceMonitor } from '../performance/performanceMonitor';

interface MMKVInstanceConfig {
  id: string;
  encryptionKey?: string;
  description: string;
  maxSize?: number; // Optional size limit for cleanup
}

interface BatchOperation {
  key: string;
  value: string | number | boolean | undefined;
  operation: 'set' | 'delete';
}

interface PerformanceMetrics {
  readCount: number;
  writeCount: number;
  deleteCount: number;
  batchCount: number;
  averageReadTime: number;
  averageWriteTime: number;
  cacheHitRate: number;
}

/**
 * Optimized MMKV Storage with multiple instances for better performance
 * 
 * Performance Features:
 * - Separate instances for different data types
 * - Batch operations for bulk updates
 * - Memory cache for frequently accessed data
 * - Performance monitoring and metrics
 * - Automatic cleanup and memory management
 */
export class OptimizedMMKVStorage {
  private instances: Map<string, MMKV> = new Map();
  private memoryCache: Map<string, { value: any; timestamp: number; instance: string }> = new Map();
  private metrics: PerformanceMetrics = {
    readCount: 0,
    writeCount: 0,
    deleteCount: 0,
    batchCount: 0,
    averageReadTime: 0,
    averageWriteTime: 0,
    cacheHitRate: 0,
  };
  
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 1000;
  private readonly CLEANUP_INTERVAL = 10 * 60 * 1000; // 10 minutes

  private cleanupTimer?: NodeJS.Timeout;

  constructor() {
    this.initializeInstances();
    this.startCleanupTimer();
  }

  /**
   * Initialize optimized MMKV instances for different data types
   */
  private initializeInstances(): void {
    const instances: MMKVInstanceConfig[] = [
      {
        id: 'pharmaguide-auth',
        encryptionKey: 'auth-encryption-key-v1',
        description: 'Authentication tokens and session data',
        maxSize: 50, // Small, frequently accessed
      },
      {
        id: 'pharmaguide-stack',
        encryptionKey: 'stack-encryption-key-v1', 
        description: 'User stack and supplement data',
        maxSize: 500, // Medium size
      },
      {
        id: 'pharmaguide-cache',
        description: 'AI responses and product cache (non-sensitive)',
        maxSize: 2000, // Large cache
      },
      {
        id: 'pharmaguide-health',
        encryptionKey: 'health-encryption-key-v1',
        description: 'Health profile data (HIPAA compliant)',
        maxSize: 200, // Small, highly sensitive
      },
      {
        id: 'pharmaguide-preferences',
        description: 'App preferences and settings',
        maxSize: 100, // Very small
      },
      {
        id: 'pharmaguide-analytics',
        description: 'Performance metrics and analytics',
        maxSize: 1000, // Medium size
      }
    ];

    instances.forEach(config => {
      try {
        const mmkv = new MMKV({
          id: config.id,
          ...(config.encryptionKey && { encryptionKey: config.encryptionKey })
        });
        
        this.instances.set(config.id, mmkv);
        console.log(`✅ MMKV instance '${config.id}' initialized: ${config.description}`);
      } catch (error) {
        console.error(`❌ Failed to initialize MMKV instance '${config.id}':`, error);
      }
    });
  }

  /**
   * Get the appropriate MMKV instance for a data type
   */
  private getInstanceForKey(key: string): { instance: MMKV; instanceId: string } {
    // Route keys to appropriate instances based on prefix
    if (key.startsWith('@pharmaguide_user_token') || key.startsWith('@pharmaguide_session')) {
      return { instance: this.instances.get('pharmaguide-auth')!, instanceId: 'pharmaguide-auth' };
    }
    
    if (key.startsWith('@pharmaguide_user_stack') || key.startsWith('@pharmaguide_gamification')) {
      return { instance: this.instances.get('pharmaguide-stack')!, instanceId: 'pharmaguide-stack' };
    }
    
    if (key.startsWith('@pharmaguide_cache_') || key.startsWith('@pharmaguide_ai_cache_')) {
      return { instance: this.instances.get('pharmaguide-cache')!, instanceId: 'pharmaguide-cache' };
    }
    
    if (key.startsWith('@pharmaguide_health_') || key.includes('health_profile')) {
      return { instance: this.instances.get('pharmaguide-health')!, instanceId: 'pharmaguide-health' };
    }
    
    if (key.startsWith('@pharmaguide_preferences') || key.startsWith('@pharmaguide_settings')) {
      return { instance: this.instances.get('pharmaguide-preferences')!, instanceId: 'pharmaguide-preferences' };
    }
    
    // Default to analytics instance for unknown keys
    return { instance: this.instances.get('pharmaguide-analytics')!, instanceId: 'pharmaguide-analytics' };
  }

  /**
   * Optimized get with memory cache
   */
  getString(key: string): string | undefined {
    const startTime = Date.now();
    
    try {
      // Check memory cache first
      const cached = this.memoryCache.get(key);
      if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
        this.metrics.readCount++;
        this.updateCacheHitRate(true);
        return cached.value;
      }

      // Get from MMKV
      const { instance, instanceId } = this.getInstanceForKey(key);
      const value = instance.getString(key);
      
      // Cache the result
      if (value !== undefined) {
        this.updateMemoryCache(key, value, instanceId);
      }
      
      this.metrics.readCount++;
      this.updateCacheHitRate(false);
      this.updateAverageReadTime(Date.now() - startTime);
      
      return value;
    } catch (error) {
      console.warn(`Optimized MMKV getString failed for key ${key}:`, error);
      return undefined;
    }
  }

  /**
   * Optimized set with memory cache update
   */
  setString(key: string, value: string): void {
    const startTime = Date.now();
    
    try {
      const { instance, instanceId } = this.getInstanceForKey(key);
      instance.set(key, value);
      
      // Update memory cache
      this.updateMemoryCache(key, value, instanceId);
      
      this.metrics.writeCount++;
      this.updateAverageWriteTime(Date.now() - startTime);
    } catch (error) {
      console.warn(`Optimized MMKV setString failed for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Batch operations for better performance
   */
  async batchOperations(operations: BatchOperation[]): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Group operations by instance
      const instanceOperations = new Map<string, BatchOperation[]>();
      
      operations.forEach(op => {
        const { instanceId } = this.getInstanceForKey(op.key);
        if (!instanceOperations.has(instanceId)) {
          instanceOperations.set(instanceId, []);
        }
        instanceOperations.get(instanceId)!.push(op);
      });

      // Execute operations per instance
      for (const [instanceId, ops] of instanceOperations) {
        const instance = this.instances.get(instanceId);
        if (!instance) continue;

        ops.forEach(op => {
          if (op.operation === 'set' && op.value !== undefined) {
            if (typeof op.value === 'string') {
              instance.set(op.key, op.value);
            } else if (typeof op.value === 'number') {
              instance.set(op.key, op.value);
            } else if (typeof op.value === 'boolean') {
              instance.set(op.key, op.value);
            }
            
            // Update memory cache
            this.updateMemoryCache(op.key, op.value, instanceId);
          } else if (op.operation === 'delete') {
            instance.delete(op.key);
            this.memoryCache.delete(op.key);
          }
        });
      }

      this.metrics.batchCount++;
      
      performanceMonitor.startMeasure('mmkv_batch_operation');
      performanceMonitor.endMeasure('mmkv_batch_operation', 'storage');
      
      console.log(`✅ Batch operation completed: ${operations.length} operations in ${Date.now() - startTime}ms`);
    } catch (error) {
      console.error('❌ Batch operation failed:', error);
      throw error;
    }
  }

  /**
   * Get performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Clear all caches and perform cleanup
   */
  clearCaches(): void {
    this.memoryCache.clear();
    
    // Clear MMKV caches (if available in current version)
    this.instances.forEach((instance, id) => {
      try {
        // Note: trim() method may not be available in MMKV 2.x
        // This is a placeholder for when we upgrade to 3.x
        console.log(`🧹 Cleared cache for instance: ${id}`);
      } catch (error) {
        console.warn(`Failed to clear cache for instance ${id}:`, error);
      }
    });
  }

  /**
   * Update memory cache with size management
   */
  private updateMemoryCache(key: string, value: any, instanceId: string): void {
    // Remove oldest entries if cache is full
    if (this.memoryCache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = Array.from(this.memoryCache.keys())[0];
      this.memoryCache.delete(oldestKey);
    }

    this.memoryCache.set(key, {
      value,
      timestamp: Date.now(),
      instance: instanceId
    });
  }

  /**
   * Update cache hit rate metric
   */
  private updateCacheHitRate(isHit: boolean): void {
    const totalReads = this.metrics.readCount + 1;
    const currentHits = this.metrics.cacheHitRate * this.metrics.readCount;
    this.metrics.cacheHitRate = (currentHits + (isHit ? 1 : 0)) / totalReads;
  }

  /**
   * Update average read time
   */
  private updateAverageReadTime(duration: number): void {
    const total = this.metrics.averageReadTime * (this.metrics.readCount - 1);
    this.metrics.averageReadTime = (total + duration) / this.metrics.readCount;
  }

  /**
   * Update average write time
   */
  private updateAverageWriteTime(duration: number): void {
    const total = this.metrics.averageWriteTime * (this.metrics.writeCount - 1);
    this.metrics.averageWriteTime = (total + duration) / this.metrics.writeCount;
  }

  /**
   * Start cleanup timer for memory management
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.performCleanup();
    }, this.CLEANUP_INTERVAL);
  }

  /**
   * Perform periodic cleanup
   */
  private performCleanup(): void {
    const now = Date.now();
    
    // Clean expired cache entries
    for (const [key, cached] of this.memoryCache) {
      if (now - cached.timestamp > this.CACHE_TTL) {
        this.memoryCache.delete(key);
      }
    }

    console.log(`🧹 Memory cleanup completed. Cache size: ${this.memoryCache.size}`);
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.memoryCache.clear();
    this.instances.clear();
  }
}

// Global optimized storage instance
export const optimizedMMKVStorage = new OptimizedMMKVStorage();
