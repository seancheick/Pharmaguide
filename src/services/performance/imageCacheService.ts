// src/services/performance/imageCacheService.ts
import * as FileSystem from 'expo-file-system';
import { Image } from 'react-native';
import { logger } from '../monitoring/logger';
import { performanceMonitor } from '../monitoring/performanceMonitor';

interface CacheEntry {
  uri: string;
  localPath: string;
  timestamp: number;
  size: number;
  lastAccessed: number;
}

interface CacheConfig {
  maxCacheSize: number; // in bytes
  maxAge: number; // in milliseconds
  maxEntries: number;
  enablePrefetch: boolean;
}

class ImageCacheService {
  private cache = new Map<string, CacheEntry>();
  private cacheDir: string;
  private config: CacheConfig = {
    maxCacheSize: 100 * 1024 * 1024, // 100MB
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    maxEntries: 500,
    enablePrefetch: true,
  };
  private initialized = false;
  private currentCacheSize = 0;

  /**
   * Initialize image cache service
   */
  async initialize(config?: Partial<CacheConfig>): Promise<void> {
    try {
      if (config) {
        this.config = { ...this.config, ...config };
      }

      this.cacheDir = `${FileSystem.cacheDirectory}images/`;
      
      // Ensure cache directory exists
      const dirInfo = await FileSystem.getInfoAsync(this.cacheDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.cacheDir, { intermediates: true });
      }

      // Load existing cache entries
      await this.loadCacheIndex();
      
      // Clean up expired entries
      await this.cleanupExpiredEntries();

      this.initialized = true;
      logger.info('performance', 'Image cache service initialized', {
        cacheDir: this.cacheDir,
        config: this.config,
        existingEntries: this.cache.size,
        currentSize: this.currentCacheSize,
      });
    } catch (error) {
      logger.error('performance', 'Failed to initialize image cache', error);
      throw error;
    }
  }

  /**
   * Get cached image or download and cache it
   */
  async getCachedImage(uri: string): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }

    performanceMonitor.startTiming('image_cache_get', 'storage', { uri });

    try {
      const cacheKey = this.getCacheKey(uri);
      const cached = this.cache.get(cacheKey);

      // Check if we have a valid cached entry
      if (cached && await this.isValidCacheEntry(cached)) {
        // Update last accessed time
        cached.lastAccessed = Date.now();
        this.cache.set(cacheKey, cached);
        
        performanceMonitor.endTiming('image_cache_get', { hit: true });
        return cached.localPath;
      }

      // Download and cache the image
      const localPath = await this.downloadAndCache(uri, cacheKey);
      performanceMonitor.endTiming('image_cache_get', { hit: false });
      return localPath;
    } catch (error) {
      performanceMonitor.endTiming('image_cache_get', { error: true });
      logger.error('performance', 'Image cache get failed', error, { uri });
      return uri; // Fallback to original URI
    }
  }

  /**
   * Prefetch images for better performance
   */
  async prefetchImages(uris: string[]): Promise<void> {
    if (!this.config.enablePrefetch || !this.initialized) {
      return;
    }

    logger.info('performance', 'Prefetching images', { count: uris.length });

    const prefetchPromises = uris.map(async (uri) => {
      try {
        await this.getCachedImage(uri);
      } catch (error) {
        logger.warn('performance', 'Image prefetch failed', { uri, error });
      }
    });

    await Promise.allSettled(prefetchPromises);
  }

  /**
   * Download and cache an image
   */
  private async downloadAndCache(uri: string, cacheKey: string): Promise<string> {
    const localPath = `${this.cacheDir}${cacheKey}`;
    
    try {
      // Download the image
      const downloadResult = await FileSystem.downloadAsync(uri, localPath);
      
      if (downloadResult.status !== 200) {
        throw new Error(`Download failed with status ${downloadResult.status}`);
      }

      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(localPath);
      if (!fileInfo.exists) {
        throw new Error('Downloaded file does not exist');
      }

      // Create cache entry
      const cacheEntry: CacheEntry = {
        uri,
        localPath,
        timestamp: Date.now(),
        size: fileInfo.size || 0,
        lastAccessed: Date.now(),
      };

      // Check if we need to make space
      await this.ensureCacheSpace(cacheEntry.size);

      // Add to cache
      this.cache.set(cacheKey, cacheEntry);
      this.currentCacheSize += cacheEntry.size;

      // Save cache index
      await this.saveCacheIndex();

      logger.debug('performance', 'Image cached successfully', {
        uri,
        localPath,
        size: cacheEntry.size,
      });

      return localPath;
    } catch (error) {
      // Clean up failed download
      try {
        await FileSystem.deleteAsync(localPath, { idempotent: true });
      } catch {
        // Ignore cleanup errors
      }
      throw error;
    }
  }

  /**
   * Check if cache entry is valid
   */
  private async isValidCacheEntry(entry: CacheEntry): Promise<boolean> {
    // Check if file exists
    const fileInfo = await FileSystem.getInfoAsync(entry.localPath);
    if (!fileInfo.exists) {
      return false;
    }

    // Check if entry is expired
    const age = Date.now() - entry.timestamp;
    if (age > this.config.maxAge) {
      return false;
    }

    return true;
  }

  /**
   * Ensure we have enough cache space
   */
  private async ensureCacheSpace(requiredSize: number): Promise<void> {
    // Check if we need to free up space
    while (
      this.currentCacheSize + requiredSize > this.config.maxCacheSize ||
      this.cache.size >= this.config.maxEntries
    ) {
      await this.evictLeastRecentlyUsed();
    }
  }

  /**
   * Evict least recently used cache entry
   */
  private async evictLeastRecentlyUsed(): Promise<void> {
    if (this.cache.size === 0) return;

    let oldestEntry: CacheEntry | null = null;
    let oldestKey: string | null = null;

    for (const [key, entry] of this.cache.entries()) {
      if (!oldestEntry || entry.lastAccessed < oldestEntry.lastAccessed) {
        oldestEntry = entry;
        oldestKey = key;
      }
    }

    if (oldestEntry && oldestKey) {
      await this.removeCacheEntry(oldestKey, oldestEntry);
    }
  }

  /**
   * Remove cache entry
   */
  private async removeCacheEntry(key: string, entry: CacheEntry): Promise<void> {
    try {
      await FileSystem.deleteAsync(entry.localPath, { idempotent: true });
      this.cache.delete(key);
      this.currentCacheSize -= entry.size;
      
      logger.debug('performance', 'Cache entry evicted', {
        uri: entry.uri,
        size: entry.size,
      });
    } catch (error) {
      logger.warn('performance', 'Failed to remove cache entry', { key, error });
    }
  }

  /**
   * Clean up expired entries
   */
  private async cleanupExpiredEntries(): Promise<void> {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      const age = now - entry.timestamp;
      if (age > this.config.maxAge) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      const entry = this.cache.get(key);
      if (entry) {
        await this.removeCacheEntry(key, entry);
      }
    }

    if (expiredKeys.length > 0) {
      logger.info('performance', 'Cleaned up expired cache entries', {
        count: expiredKeys.length,
      });
    }
  }

  /**
   * Generate cache key from URI
   */
  private getCacheKey(uri: string): string {
    // Simple hash function for cache key
    let hash = 0;
    for (let i = 0; i < uri.length; i++) {
      const char = uri.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Load cache index from storage
   */
  private async loadCacheIndex(): Promise<void> {
    try {
      const indexPath = `${this.cacheDir}index.json`;
      const indexInfo = await FileSystem.getInfoAsync(indexPath);
      
      if (indexInfo.exists) {
        const indexContent = await FileSystem.readAsStringAsync(indexPath);
        const cacheData = JSON.parse(indexContent);
        
        this.cache.clear();
        this.currentCacheSize = 0;
        
        for (const [key, entry] of Object.entries(cacheData.entries || {})) {
          this.cache.set(key, entry as CacheEntry);
          this.currentCacheSize += (entry as CacheEntry).size;
        }
      }
    } catch (error) {
      logger.warn('performance', 'Failed to load cache index', { error });
    }
  }

  /**
   * Save cache index to storage
   */
  private async saveCacheIndex(): Promise<void> {
    try {
      const indexPath = `${this.cacheDir}index.json`;
      const cacheData = {
        version: 1,
        timestamp: Date.now(),
        entries: Object.fromEntries(this.cache.entries()),
      };
      
      await FileSystem.writeAsStringAsync(indexPath, JSON.stringify(cacheData));
    } catch (error) {
      logger.warn('performance', 'Failed to save cache index', { error });
    }
  }

  /**
   * Clear all cached images
   */
  async clearCache(): Promise<void> {
    try {
      await FileSystem.deleteAsync(this.cacheDir, { idempotent: true });
      await FileSystem.makeDirectoryAsync(this.cacheDir, { intermediates: true });
      
      this.cache.clear();
      this.currentCacheSize = 0;
      
      logger.info('performance', 'Image cache cleared');
    } catch (error) {
      logger.error('performance', 'Failed to clear cache', error);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    entries: number;
    totalSize: number;
    maxSize: number;
    hitRate: number;
  } {
    return {
      entries: this.cache.size,
      totalSize: this.currentCacheSize,
      maxSize: this.config.maxCacheSize,
      hitRate: 0, // TODO: Implement hit rate tracking
    };
  }
}

export const imageCacheService = new ImageCacheService();

// Export types
export type { CacheConfig, CacheEntry };
