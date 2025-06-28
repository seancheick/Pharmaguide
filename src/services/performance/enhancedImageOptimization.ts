// src/services/performance/enhancedImageOptimization.ts
import * as FileSystem from 'expo-file-system';
import { Image } from 'expo-image';
import { imageCacheService } from './imageCacheService';
import { logger } from '../monitoring/logger';
import { performanceMonitor } from '../monitoring/performanceMonitor';

interface OptimizedImageSizes {
  thumbnail: string;    // 150x150 - for lists and previews
  medium: string;       // 400x400 - for cards and modals
  large: string;        // 800x800 - for full screen
  original: string;     // Original size
}

interface ImageOptimizationConfig {
  enableResponsiveSizes: boolean;
  enableBlurHash: boolean;
  enableWebPConversion: boolean;
  qualityThreshold: number; // 0-100
  maxFileSize: number; // in bytes
}

class EnhancedImageOptimizationService {
  private config: ImageOptimizationConfig = {
    enableResponsiveSizes: true,
    enableBlurHash: true,
    enableWebPConversion: true,
    qualityThreshold: 85,
    maxFileSize: 5 * 1024 * 1024, // 5MB
  };

  private optimizedCache = new Map<string, OptimizedImageSizes>();

  /**
   * Initialize enhanced image optimization service
   */
  initialize(config?: Partial<ImageOptimizationConfig>): void {
    if (config) {
      this.config = { ...this.config, ...config };
    }

    logger.info('performance', 'Enhanced image optimization service initialized', {
      config: this.config,
    });
  }

  /**
   * Optimize product image with multiple sizes and formats
   */
  async optimizeProductImage(uri: string): Promise<OptimizedImageSizes> {
    performanceMonitor.startTiming('image_optimization', 'processing', { uri });

    try {
      // Check cache first
      const cacheKey = this.getCacheKey(uri);
      const cached = this.optimizedCache.get(cacheKey);
      if (cached) {
        performanceMonitor.endTiming('image_optimization', { cached: true });
        return cached;
      }

      // Get original cached image
      const originalPath = await imageCacheService.getCachedImage(uri);

      // Generate responsive sizes
      const sizes = await this.generateResponsiveSizes(originalPath);

      // Cache the result
      this.optimizedCache.set(cacheKey, sizes);

      performanceMonitor.endTiming('image_optimization', { 
        cached: false,
        sizesGenerated: Object.keys(sizes).length 
      });

      logger.debug('performance', 'Image optimization complete', {
        uri,
        sizes: Object.keys(sizes),
      });

      return sizes;
    } catch (error) {
      performanceMonitor.endTiming('image_optimization', { error: true });
      logger.error('performance', 'Image optimization failed', error, { uri });
      
      // Fallback to original
      return {
        thumbnail: uri,
        medium: uri,
        large: uri,
        original: uri,
      };
    }
  }

  /**
   * Generate responsive image sizes
   * Uses expo-image's built-in optimization capabilities
   */
  private async generateResponsiveSizes(imagePath: string): Promise<OptimizedImageSizes> {
    if (!this.config.enableResponsiveSizes) {
      return {
        thumbnail: imagePath,
        medium: imagePath,
        large: imagePath,
        original: imagePath,
      };
    }

    try {
      // expo-image handles resizing automatically based on the component size
      // We'll use different cache keys for different sizes
      const baseUri = imagePath.startsWith('file://') ? imagePath : `file://${imagePath}`;
      
      return {
        thumbnail: `${baseUri}?width=150&height=150&resize=cover`,
        medium: `${baseUri}?width=400&height=400&resize=contain`,
        large: `${baseUri}?width=800&height=800&resize=contain`,
        original: baseUri,
      };
    } catch (error) {
      logger.warn('performance', 'Responsive size generation failed', { imagePath, error });
      return {
        thumbnail: imagePath,
        medium: imagePath,
        large: imagePath,
        original: imagePath,
      };
    }
  }

  /**
   * Preload critical images with multiple sizes
   */
  async preloadCriticalImages(uris: string[]): Promise<void> {
    if (uris.length === 0) return;

    logger.info('performance', 'Preloading critical images', { count: uris.length });

    const preloadPromises = uris.map(async (uri) => {
      try {
        await this.optimizeProductImage(uri);
      } catch (error) {
        logger.warn('performance', 'Critical image preload failed', { uri, error });
      }
    });

    await Promise.allSettled(preloadPromises);
  }

  /**
   * Get optimized image for specific size
   */
  async getOptimizedImage(
    uri: string, 
    size: keyof OptimizedImageSizes = 'medium'
  ): Promise<string> {
    try {
      const optimized = await this.optimizeProductImage(uri);
      return optimized[size];
    } catch (error) {
      logger.warn('performance', 'Failed to get optimized image', { uri, size, error });
      return uri; // Fallback to original
    }
  }

  /**
   * Clear optimization cache
   */
  clearCache(): void {
    this.optimizedCache.clear();
    logger.debug('performance', 'Image optimization cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      cachedImages: this.optimizedCache.size,
      memoryUsage: this.estimateMemoryUsage(),
    };
  }

  /**
   * Generate cache key for image URI
   */
  private getCacheKey(uri: string): string {
    // Simple hash function for cache key
    let hash = 0;
    for (let i = 0; i < uri.length; i++) {
      const char = uri.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `img_${Math.abs(hash)}`;
  }

  /**
   * Estimate memory usage of cached images
   */
  private estimateMemoryUsage(): number {
    // Rough estimation: each cached entry ~1KB metadata
    return this.optimizedCache.size * 1024;
  }

  /**
   * Smart image loading based on network conditions
   */
  async getImageForNetworkCondition(
    uri: string,
    networkType: 'wifi' | 'cellular' | 'unknown' = 'unknown'
  ): Promise<string> {
    const optimized = await this.optimizeProductImage(uri);

    // Use smaller images on cellular to save data
    switch (networkType) {
      case 'cellular':
        return optimized.thumbnail;
      case 'wifi':
        return optimized.large;
      default:
        return optimized.medium;
    }
  }
}

// Export singleton instance
export const enhancedImageOptimization = new EnhancedImageOptimizationService();
