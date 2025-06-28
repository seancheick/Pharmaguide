// src/services/performance/index.ts
export { imageCacheService } from './imageCacheService';
export { networkCacheService } from './networkCacheService';
export { bundleOptimizationService } from './bundleOptimizationService';
export { memoryLeakPrevention } from './memoryLeakPrevention';
export { enhancedImageOptimization } from './enhancedImageOptimization';
export { requestDeduplicator } from './requestDeduplicator';
export { enhancedMemoryMonitor } from './enhancedMemoryMonitor';

export type {
  CacheConfig as ImageCacheConfig,
  CacheEntry as ImageCacheEntry,
} from './imageCacheService';
export type {
  CacheConfig as NetworkCacheConfig,
  CacheEntry as NetworkCacheEntry,
  RequestCacheKey,
} from './networkCacheService';
export type {
  BundleMetrics,
  OptimizationConfig,
} from './bundleOptimizationService';
export type {
  MemoryLeakConfig,
  LeakDetectionResult,
  TrackedResource,
} from './memoryLeakPrevention';

// Initialize all performance services
import { imageCacheService } from './imageCacheService';
import { networkCacheService } from './networkCacheService';
import { bundleOptimizationService } from './bundleOptimizationService';
import { memoryLeakPrevention } from './memoryLeakPrevention';
import { enhancedImageOptimization } from './enhancedImageOptimization';
import { requestDeduplicator } from './requestDeduplicator';
import { enhancedMemoryMonitor } from './enhancedMemoryMonitor';
import { logger } from '../monitoring/logger';

/**
 * Initialize all performance optimization services
 */
export const initializePerformanceServices = async (config: {
  enableImageCache?: boolean;
  enableNetworkCache?: boolean;
  enableBundleOptimization?: boolean;
  enableMemoryLeakPrevention?: boolean;
  imageCacheSize?: number;
  networkCacheSize?: number;
  memoryThreshold?: number;
}) => {
  try {
    logger.info('performance', 'Initializing performance services', config);

    // Initialize image caching
    if (config.enableImageCache !== false) {
      await imageCacheService.initialize({
        maxCacheSize: config.imageCacheSize || 100 * 1024 * 1024, // 100MB
        enablePrefetch: true,
      });

      // Initialize enhanced image optimization
      enhancedImageOptimization.initialize({
        enableResponsiveSizes: true,
        enableBlurHash: true,
        enableWebPConversion: true,
      });
    }

    // Initialize request deduplicator
    requestDeduplicator.initialize({
      maxConcurrentRequests: config.maxConcurrentRequests || 10,
      requestTimeoutMs: 30000,
      enableMetrics: true,
    });

    // Initialize enhanced memory monitor
    if (config.enableMemoryMonitoring !== false) {
      enhancedMemoryMonitor.initialize({
        warningThreshold: 0.75,
        criticalThreshold: 0.9,
        monitoringInterval: 10000,
        enableAutoCleanup: true,
      });
    }

    // Initialize network caching
    if (config.enableNetworkCache !== false) {
      networkCacheService.initialize({
        maxCacheSize: config.networkCacheSize || 1000,
        enableStaleWhileRevalidate: true,
      });
    }

    // Initialize bundle optimization
    if (config.enableBundleOptimization !== false) {
      bundleOptimizationService.initialize({
        enableCodeSplitting: true,
        enableLazyLoading: true,
      });
    }

    // Initialize memory leak prevention
    if (config.enableMemoryLeakPrevention !== false) {
      memoryLeakPrevention.initialize({
        enableAutoCleanup: true,
        memoryThreshold: config.memoryThreshold || 150, // 150MB
      });
    }

    logger.info('performance', 'Performance services initialized successfully');
    return true;
  } catch (error) {
    logger.error(
      'performance',
      'Failed to initialize performance services',
      error
    );
    return false;
  }
};

/**
 * Get comprehensive performance metrics
 */
export const getPerformanceMetrics = () => {
  return {
    imageCache: imageCacheService.getCacheStats(),
    networkCache: networkCacheService.getCacheStats(),
    bundleOptimization:
      bundleOptimizationService.getOptimizationRecommendations(),
    memoryLeaks: memoryLeakPrevention.getMemoryStats(),
    timestamp: new Date().toISOString(),
  };
};

/**
 * Perform performance cleanup
 */
export const performPerformanceCleanup = async () => {
  logger.info('performance', 'Performing performance cleanup');

  // Clean up memory leaks
  const cleanedResources = memoryLeakPrevention.cleanupAllResources();

  // Clear old cache entries
  await imageCacheService.clearCache();
  networkCacheService.clearCache();

  logger.info('performance', 'Performance cleanup completed', {
    cleanedResources,
  });

  return { cleanedResources };
};
