// src/services/performance/networkCacheService.ts
import { MMKV } from 'react-native-mmkv';
import { logger } from '../monitoring/logger';
import { performanceMonitor } from '../monitoring/performanceMonitor';

interface CacheEntry {
  data: any;
  timestamp: number;
  etag?: string;
  lastModified?: string;
  maxAge: number;
  staleWhileRevalidate?: number;
}

interface CacheConfig {
  defaultMaxAge: number; // in milliseconds
  maxCacheSize: number; // maximum number of entries
  enableStaleWhileRevalidate: boolean;
  compressionEnabled: boolean;
}

interface RequestCacheKey {
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: string;
}

class NetworkCacheService {
  private storage: MMKV;
  private config: CacheConfig = {
    defaultMaxAge: 5 * 60 * 1000, // 5 minutes
    maxCacheSize: 1000,
    enableStaleWhileRevalidate: true,
    compressionEnabled: true,
  };
  private hitCount = 0;
  private missCount = 0;

  constructor() {
    this.storage = new MMKV({
      id: 'network-cache',
      encryptionKey: 'network-cache-key',
    });
  }

  /**
   * Initialize network cache service
   */
  initialize(config?: Partial<CacheConfig>): void {
    if (config) {
      this.config = { ...this.config, ...config };
    }

    // Clean up expired entries on initialization
    this.cleanupExpiredEntries();

    logger.info('performance', 'Network cache service initialized', {
      config: this.config,
      existingEntries: this.getCacheSize(),
    });
  }

  /**
   * Get cached response or return null if not found/expired
   */
  async get(
    requestKey: RequestCacheKey,
    options?: { allowStale?: boolean }
  ): Promise<{ data: any; isStale: boolean } | null> {
    const cacheKey = this.generateCacheKey(requestKey);
    
    performanceMonitor.startTiming('network_cache_get', 'storage', { url: requestKey.url });

    try {
      const cachedData = this.storage.getString(cacheKey);
      if (!cachedData) {
        this.missCount++;
        performanceMonitor.endTiming('network_cache_get', { hit: false });
        return null;
      }

      const entry: CacheEntry = JSON.parse(cachedData);
      const now = Date.now();
      const age = now - entry.timestamp;

      // Check if entry is fresh
      if (age <= entry.maxAge) {
        this.hitCount++;
        performanceMonitor.endTiming('network_cache_get', { hit: true, fresh: true });
        return { data: entry.data, isStale: false };
      }

      // Check if we can serve stale content
      if (
        options?.allowStale &&
        this.config.enableStaleWhileRevalidate &&
        entry.staleWhileRevalidate &&
        age <= entry.maxAge + entry.staleWhileRevalidate
      ) {
        this.hitCount++;
        performanceMonitor.endTiming('network_cache_get', { hit: true, stale: true });
        return { data: entry.data, isStale: true };
      }

      // Entry is expired and can't be served stale
      this.missCount++;
      performanceMonitor.endTiming('network_cache_get', { hit: false, expired: true });
      return null;
    } catch (error) {
      this.missCount++;
      performanceMonitor.endTiming('network_cache_get', { error: true });
      logger.warn('performance', 'Network cache get failed', { cacheKey, error });
      return null;
    }
  }

  /**
   * Store response in cache
   */
  async set(
    requestKey: RequestCacheKey,
    data: any,
    options?: {
      maxAge?: number;
      etag?: string;
      lastModified?: string;
      staleWhileRevalidate?: number;
    }
  ): Promise<void> {
    const cacheKey = this.generateCacheKey(requestKey);
    
    performanceMonitor.startTiming('network_cache_set', 'storage', { url: requestKey.url });

    try {
      const entry: CacheEntry = {
        data,
        timestamp: Date.now(),
        maxAge: options?.maxAge || this.config.defaultMaxAge,
        etag: options?.etag,
        lastModified: options?.lastModified,
        staleWhileRevalidate: options?.staleWhileRevalidate,
      };

      // Ensure we don't exceed cache size limit
      await this.ensureCacheSpace();

      // Store the entry
      this.storage.set(cacheKey, JSON.stringify(entry));

      performanceMonitor.endTiming('network_cache_set', { success: true });
      
      logger.debug('performance', 'Network response cached', {
        url: requestKey.url,
        maxAge: entry.maxAge,
        size: JSON.stringify(data).length,
      });
    } catch (error) {
      performanceMonitor.endTiming('network_cache_set', { error: true });
      logger.error('performance', 'Network cache set failed', error, { cacheKey });
    }
  }

  /**
   * Check if request can be validated with conditional headers
   */
  getConditionalHeaders(requestKey: RequestCacheKey): Record<string, string> {
    const cacheKey = this.generateCacheKey(requestKey);
    const headers: Record<string, string> = {};

    try {
      const cachedData = this.storage.getString(cacheKey);
      if (cachedData) {
        const entry: CacheEntry = JSON.parse(cachedData);
        
        if (entry.etag) {
          headers['If-None-Match'] = entry.etag;
        }
        
        if (entry.lastModified) {
          headers['If-Modified-Since'] = entry.lastModified;
        }
      }
    } catch (error) {
      logger.warn('performance', 'Failed to get conditional headers', { cacheKey, error });
    }

    return headers;
  }

  /**
   * Handle 304 Not Modified response
   */
  async handleNotModified(requestKey: RequestCacheKey): Promise<any> {
    const cacheKey = this.generateCacheKey(requestKey);
    
    try {
      const cachedData = this.storage.getString(cacheKey);
      if (cachedData) {
        const entry: CacheEntry = JSON.parse(cachedData);
        
        // Update timestamp to extend cache life
        entry.timestamp = Date.now();
        this.storage.set(cacheKey, JSON.stringify(entry));
        
        this.hitCount++;
        logger.debug('performance', 'Cache entry refreshed via 304', { url: requestKey.url });
        
        return entry.data;
      }
    } catch (error) {
      logger.warn('performance', 'Failed to handle 304 response', { cacheKey, error });
    }

    return null;
  }

  /**
   * Invalidate cache entries by pattern
   */
  invalidate(pattern: string | RegExp): number {
    let invalidatedCount = 0;
    const keys = this.storage.getAllKeys();

    for (const key of keys) {
      let shouldInvalidate = false;
      
      if (typeof pattern === 'string') {
        shouldInvalidate = key.includes(pattern);
      } else {
        shouldInvalidate = pattern.test(key);
      }

      if (shouldInvalidate) {
        this.storage.delete(key);
        invalidatedCount++;
      }
    }

    logger.info('performance', 'Cache entries invalidated', {
      pattern: pattern.toString(),
      count: invalidatedCount,
    });

    return invalidatedCount;
  }

  /**
   * Generate cache key from request
   */
  private generateCacheKey(requestKey: RequestCacheKey): string {
    const keyData = {
      url: requestKey.url,
      method: requestKey.method.toUpperCase(),
      headers: this.normalizeHeaders(requestKey.headers),
      body: requestKey.body,
    };

    // Create a hash of the key data
    const keyString = JSON.stringify(keyData);
    let hash = 0;
    
    for (let i = 0; i < keyString.length; i++) {
      const char = keyString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return `net_${Math.abs(hash).toString(36)}`;
  }

  /**
   * Normalize headers for consistent caching
   */
  private normalizeHeaders(headers?: Record<string, string>): Record<string, string> {
    if (!headers) return {};

    const normalized: Record<string, string> = {};
    
    // Only include headers that affect response content
    const relevantHeaders = ['accept', 'accept-language', 'authorization'];
    
    for (const [key, value] of Object.entries(headers)) {
      const lowerKey = key.toLowerCase();
      if (relevantHeaders.includes(lowerKey)) {
        normalized[lowerKey] = value;
      }
    }

    return normalized;
  }

  /**
   * Ensure cache doesn't exceed size limit
   */
  private async ensureCacheSpace(): Promise<void> {
    const currentSize = this.getCacheSize();
    
    if (currentSize >= this.config.maxCacheSize) {
      // Remove oldest entries (simple LRU)
      const keys = this.storage.getAllKeys();
      const entries: { key: string; timestamp: number }[] = [];

      for (const key of keys) {
        try {
          const data = this.storage.getString(key);
          if (data) {
            const entry: CacheEntry = JSON.parse(data);
            entries.push({ key, timestamp: entry.timestamp });
          }
        } catch {
          // Remove invalid entries
          this.storage.delete(key);
        }
      }

      // Sort by timestamp and remove oldest
      entries.sort((a, b) => a.timestamp - b.timestamp);
      const toRemove = entries.slice(0, Math.ceil(currentSize * 0.1)); // Remove 10%

      for (const { key } of toRemove) {
        this.storage.delete(key);
      }

      logger.info('performance', 'Cache space freed', {
        removed: toRemove.length,
        remaining: currentSize - toRemove.length,
      });
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanupExpiredEntries(): void {
    const keys = this.storage.getAllKeys();
    const now = Date.now();
    let cleanedCount = 0;

    for (const key of keys) {
      try {
        const data = this.storage.getString(key);
        if (data) {
          const entry: CacheEntry = JSON.parse(data);
          const age = now - entry.timestamp;
          
          // Remove if expired beyond stale-while-revalidate window
          const maxStaleAge = entry.maxAge + (entry.staleWhileRevalidate || 0);
          if (age > maxStaleAge) {
            this.storage.delete(key);
            cleanedCount++;
          }
        }
      } catch {
        // Remove invalid entries
        this.storage.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.info('performance', 'Expired cache entries cleaned', { count: cleanedCount });
    }
  }

  /**
   * Get current cache size
   */
  private getCacheSize(): number {
    return this.storage.getAllKeys().length;
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    entries: number;
    hitRate: number;
    hitCount: number;
    missCount: number;
  } {
    const totalRequests = this.hitCount + this.missCount;
    
    return {
      entries: this.getCacheSize(),
      hitRate: totalRequests > 0 ? this.hitCount / totalRequests : 0,
      hitCount: this.hitCount,
      missCount: this.missCount,
    };
  }

  /**
   * Clear all cache entries
   */
  clearCache(): void {
    this.storage.clearAll();
    this.hitCount = 0;
    this.missCount = 0;
    logger.info('performance', 'Network cache cleared');
  }
}

export const networkCacheService = new NetworkCacheService();

// Export types
export type { CacheConfig, CacheEntry, RequestCacheKey };
