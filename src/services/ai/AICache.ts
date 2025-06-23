// src/services/ai/AICache.ts
// Intelligent AI Response Caching with Performance Optimization

import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  accessCount: number;
  lastAccessed: number;
  quality: number; // 0-1 score for cache entry quality
  size: number; // Estimated size in bytes
  tags: string[]; // For cache invalidation
}

interface CacheConfig {
  maxSize: number; // Maximum cache size in bytes
  defaultTTL: number; // Default time to live in ms
  maxEntries: number; // Maximum number of entries
  compressionThreshold: number; // Compress entries larger than this
  persistToDisk: boolean; // Whether to persist cache to AsyncStorage
}

interface CacheStats {
  hitRate: number;
  missRate: number;
  totalRequests: number;
  totalHits: number;
  totalMisses: number;
  currentSize: number;
  entryCount: number;
  averageResponseTime: number;
}

/**
 * Intelligent AI response caching with LRU eviction and performance optimization
 */
export class AICache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private config: CacheConfig;
  private stats: CacheStats;
  private persistenceQueue: Set<string> = new Set();
  private compressionEnabled: boolean = true;

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      maxSize: 50 * 1024 * 1024, // 50MB default
      defaultTTL: 24 * 60 * 60 * 1000, // 24 hours
      maxEntries: 1000,
      compressionThreshold: 10 * 1024, // 10KB
      persistToDisk: true,
      ...config
    };

    this.stats = {
      hitRate: 0,
      missRate: 0,
      totalRequests: 0,
      totalHits: 0,
      totalMisses: 0,
      currentSize: 0,
      entryCount: 0,
      averageResponseTime: 0
    };

    this.initializeCache();
  }

  /**
   * Get cached data with intelligent retrieval
   */
  async get<T>(key: string, tags?: string[]): Promise<T | null> {
    const startTime = Date.now();
    this.stats.totalRequests++;

    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.totalMisses++;
      this.updateStats();
      return null;
    }

    // Check expiration
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.totalMisses++;
      this.updateStats();
      return null;
    }

    // Check tag-based invalidation
    if (tags && this.hasInvalidTags(entry.tags, tags)) {
      this.cache.delete(key);
      this.stats.totalMisses++;
      this.updateStats();
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    this.stats.totalHits++;
    this.updateStats();

    // Update average response time
    const responseTime = Date.now() - startTime;
    this.stats.averageResponseTime = 
      (this.stats.averageResponseTime * (this.stats.totalRequests - 1) + responseTime) / this.stats.totalRequests;

    return this.deserializeData(entry.data);
  }

  /**
   * Set cached data with intelligent storage
   */
  async set<T>(
    key: string, 
    data: T, 
    options?: {
      ttl?: number;
      quality?: number;
      tags?: string[];
      priority?: 'low' | 'normal' | 'high';
    }
  ): Promise<void> {
    const ttl = options?.ttl || this.config.defaultTTL;
    const quality = options?.quality || 0.8;
    const tags = options?.tags || [];
    const priority = options?.priority || 'normal';

    // Serialize and estimate size
    const serializedData = this.serializeData(data);
    const estimatedSize = this.estimateSize(serializedData);

    // Check if we need to make space
    await this.ensureSpace(estimatedSize, priority);

    const entry: CacheEntry<any> = {
      data: serializedData,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
      accessCount: 0,
      lastAccessed: Date.now(),
      quality,
      size: estimatedSize,
      tags
    };

    this.cache.set(key, entry);
    this.stats.currentSize += estimatedSize;
    this.stats.entryCount++;

    // Queue for persistence if enabled
    if (this.config.persistToDisk) {
      this.persistenceQueue.add(key);
      this.schedulePersistence();
    }
  }

  /**
   * Invalidate cache entries by tags
   */
  invalidateByTags(tags: string[]): number {
    let invalidatedCount = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.some(tag => tags.includes(tag))) {
        this.stats.currentSize -= entry.size;
        this.cache.delete(key);
        invalidatedCount++;
      }
    }

    this.stats.entryCount = this.cache.size;
    return invalidatedCount;
  }

  /**
   * Clear cache with optional pattern matching
   */
  clear(pattern?: RegExp): number {
    let clearedCount = 0;

    if (pattern) {
      for (const [key, entry] of this.cache.entries()) {
        if (pattern.test(key)) {
          this.stats.currentSize -= entry.size;
          this.cache.delete(key);
          clearedCount++;
        }
      }
    } else {
      clearedCount = this.cache.size;
      this.cache.clear();
      this.stats.currentSize = 0;
    }

    this.stats.entryCount = this.cache.size;
    return clearedCount;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Get cache entries for debugging
   */
  getEntries(): Array<{
    key: string;
    size: number;
    accessCount: number;
    quality: number;
    age: number;
    tags: string[];
  }> {
    const now = Date.now();
    return Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      size: entry.size,
      accessCount: entry.accessCount,
      quality: entry.quality,
      age: now - entry.timestamp,
      tags: entry.tags
    }));
  }

  /**
   * Optimize cache by removing low-value entries
   */
  optimize(): {
    removedEntries: number;
    freedSpace: number;
  } {
    const entries = Array.from(this.cache.entries());
    const now = Date.now();

    // Score entries for removal (lower score = more likely to remove)
    const scoredEntries = entries.map(([key, entry]) => {
      const age = now - entry.timestamp;
      const timeSinceAccess = now - entry.lastAccessed;
      
      // Scoring factors
      const qualityScore = entry.quality * 30;
      const accessScore = Math.min(entry.accessCount * 5, 25);
      const freshnessScore = Math.max(0, 20 - (age / (60 * 60 * 1000))); // Decay over hours
      const recentAccessScore = Math.max(0, 15 - (timeSinceAccess / (60 * 60 * 1000)));
      const sizeScore = Math.max(0, 10 - (entry.size / (1024 * 1024))); // Penalty for large entries

      const totalScore = qualityScore + accessScore + freshnessScore + recentAccessScore + sizeScore;

      return { key, entry, score: totalScore };
    });

    // Sort by score (lowest first for removal)
    scoredEntries.sort((a, b) => a.score - b.score);

    // Remove bottom 20% if cache is getting full
    const removalThreshold = this.config.maxSize * 0.8;
    let removedEntries = 0;
    let freedSpace = 0;

    if (this.stats.currentSize > removalThreshold) {
      const toRemove = Math.ceil(scoredEntries.length * 0.2);
      
      for (let i = 0; i < toRemove && i < scoredEntries.length; i++) {
        const { key, entry } = scoredEntries[i];
        this.cache.delete(key);
        freedSpace += entry.size;
        removedEntries++;
      }

      this.stats.currentSize -= freedSpace;
      this.stats.entryCount = this.cache.size;
    }

    return { removedEntries, freedSpace };
  }

  /**
   * Preload cache from persistent storage
   */
  async loadFromStorage(): Promise<void> {
    if (!this.config.persistToDisk) return;

    try {
      const cacheData = await AsyncStorage.getItem('ai_cache');
      if (cacheData) {
        const parsed = JSON.parse(cacheData);
        const now = Date.now();

        for (const [key, entry] of Object.entries(parsed)) {
          const cacheEntry = entry as CacheEntry<any>;
          
          // Skip expired entries
          if (cacheEntry.expiresAt > now) {
            this.cache.set(key, cacheEntry);
            this.stats.currentSize += cacheEntry.size;
          }
        }

        this.stats.entryCount = this.cache.size;
        console.log(`📦 Loaded ${this.cache.size} cache entries from storage`);
      }
    } catch (error) {
      console.error('Failed to load cache from storage:', error);
    }
  }

  /**
   * Save cache to persistent storage
   */
  async saveToStorage(): Promise<void> {
    if (!this.config.persistToDisk) return;

    try {
      const cacheData = Object.fromEntries(this.cache.entries());
      await AsyncStorage.setItem('ai_cache', JSON.stringify(cacheData));
    } catch (error) {
      console.error('Failed to save cache to storage:', error);
    }
  }

  // Private helper methods

  private async initializeCache(): Promise<void> {
    await this.loadFromStorage();
    
    // Start periodic optimization
    setInterval(() => {
      this.optimize();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  private updateStats(): void {
    this.stats.hitRate = this.stats.totalRequests > 0 
      ? this.stats.totalHits / this.stats.totalRequests 
      : 0;
    this.stats.missRate = 1 - this.stats.hitRate;
  }

  private hasInvalidTags(entryTags: string[], requestTags: string[]): boolean {
    // Check if any request tags indicate this entry should be invalidated
    return requestTags.some(tag => tag.startsWith('invalidate:') && 
      entryTags.includes(tag.replace('invalidate:', '')));
  }

  private serializeData<T>(data: T): any {
    if (this.compressionEnabled && this.estimateSize(data) > this.config.compressionThreshold) {
      // In a real implementation, you might use a compression library
      return { compressed: true, data: JSON.stringify(data) };
    }
    return data;
  }

  private deserializeData<T>(data: any): T {
    if (data && data.compressed) {
      return JSON.parse(data.data);
    }
    return data;
  }

  private estimateSize(data: any): number {
    // Rough estimation of object size in bytes
    return JSON.stringify(data).length * 2; // UTF-16 encoding approximation
  }

  private async ensureSpace(requiredSize: number, priority: 'low' | 'normal' | 'high'): Promise<void> {
    const availableSpace = this.config.maxSize - this.stats.currentSize;
    
    if (availableSpace >= requiredSize) return;

    // Calculate how much space we need to free
    const spaceToFree = requiredSize - availableSpace;
    
    // Use different strategies based on priority
    if (priority === 'high') {
      // Aggressive cleanup for high priority items
      await this.freeSpace(spaceToFree * 1.5);
    } else if (priority === 'normal') {
      await this.freeSpace(spaceToFree * 1.2);
    } else {
      // For low priority, only free minimum required space
      await this.freeSpace(spaceToFree);
    }
  }

  private async freeSpace(targetSpace: number): Promise<void> {
    const entries = Array.from(this.cache.entries());
    const now = Date.now();

    // Sort by LRU with quality consideration
    entries.sort(([, a], [, b]) => {
      const aScore = (now - a.lastAccessed) / a.quality;
      const bScore = (now - b.lastAccessed) / b.quality;
      return bScore - aScore; // Higher score = more likely to remove
    });

    let freedSpace = 0;
    for (const [key, entry] of entries) {
      if (freedSpace >= targetSpace) break;
      
      this.cache.delete(key);
      freedSpace += entry.size;
    }

    this.stats.currentSize -= freedSpace;
    this.stats.entryCount = this.cache.size;
  }

  private schedulePersistence(): void {
    // Debounced persistence to avoid too frequent writes
    setTimeout(async () => {
      if (this.persistenceQueue.size > 0) {
        await this.saveToStorage();
        this.persistenceQueue.clear();
      }
    }, 5000); // 5 second delay
  }
}
