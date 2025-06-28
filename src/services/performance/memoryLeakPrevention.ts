// src/services/performance/memoryLeakPrevention.ts
import { Platform } from 'react-native';
import { logger } from '../monitoring/logger';
import { performanceMonitor } from '../monitoring/performanceMonitor';

interface MemoryLeakConfig {
  enableAutoCleanup: boolean;
  memoryThreshold: number; // in MB
  checkInterval: number; // in milliseconds
  enableEventListenerTracking: boolean;
  enableTimerTracking: boolean;
  enableSubscriptionTracking: boolean;
}

interface LeakDetectionResult {
  hasLeaks: boolean;
  memoryUsage: number;
  suspiciousPatterns: string[];
  recommendations: string[];
}

interface TrackedResource {
  id: string;
  type: 'timer' | 'listener' | 'subscription' | 'observer';
  createdAt: number;
  source: string;
  cleanup?: () => void;
}

class MemoryLeakPreventionService {
  private config: MemoryLeakConfig = {
    enableAutoCleanup: true,
    memoryThreshold: 150, // 150MB
    checkInterval: 30000, // 30 seconds
    enableEventListenerTracking: true,
    enableTimerTracking: true,
    enableSubscriptionTracking: true,
  };

  private trackedResources = new Map<string, TrackedResource>();
  private memoryCheckInterval?: NodeJS.Timeout;
  private memoryHistory: number[] = [];
  private isMonitoring = false;

  /**
   * Initialize memory leak prevention service
   */
  initialize(config?: Partial<MemoryLeakConfig>): void {
    if (config) {
      this.config = { ...this.config, ...config };
    }

    // Start memory monitoring
    this.startMemoryMonitoring();

    // Set up resource tracking
    this.setupResourceTracking();

    // Set up cleanup on app state changes
    this.setupAppStateCleanup();

    this.isMonitoring = true;
    logger.info('performance', 'Memory leak prevention service initialized', {
      config: this.config,
      platform: Platform.OS,
    });
  }

  /**
   * Track a resource that needs cleanup
   */
  trackResource(
    id: string,
    type: TrackedResource['type'],
    source: string,
    cleanup?: () => void
  ): void {
    if (!this.config.enableAutoCleanup) return;

    const resource: TrackedResource = {
      id,
      type,
      createdAt: Date.now(),
      source,
      cleanup,
    };

    this.trackedResources.set(id, resource);
    
    logger.debug('performance', 'Resource tracked for cleanup', {
      id,
      type,
      source,
      totalTracked: this.trackedResources.size,
    });
  }

  /**
   * Untrack a resource (when properly cleaned up)
   */
  untrackResource(id: string): void {
    const resource = this.trackedResources.get(id);
    if (resource) {
      this.trackedResources.delete(id);
      logger.debug('performance', 'Resource untracked', {
        id,
        type: resource.type,
        lifespan: Date.now() - resource.createdAt,
      });
    }
  }

  /**
   * Clean up a specific resource
   */
  cleanupResource(id: string): boolean {
    const resource = this.trackedResources.get(id);
    if (!resource) return false;

    try {
      if (resource.cleanup) {
        resource.cleanup();
      }
      this.trackedResources.delete(id);
      
      logger.debug('performance', 'Resource cleaned up', {
        id,
        type: resource.type,
        source: resource.source,
      });
      
      return true;
    } catch (error) {
      logger.error('performance', 'Resource cleanup failed', error, {
        id,
        type: resource.type,
      });
      return false;
    }
  }

  /**
   * Clean up all tracked resources
   */
  cleanupAllResources(): number {
    let cleanedCount = 0;
    const resourceIds = Array.from(this.trackedResources.keys());

    for (const id of resourceIds) {
      if (this.cleanupResource(id)) {
        cleanedCount++;
      }
    }

    logger.info('performance', 'All resources cleaned up', {
      cleanedCount,
      remaining: this.trackedResources.size,
    });

    return cleanedCount;
  }

  /**
   * Detect potential memory leaks
   */
  detectMemoryLeaks(): LeakDetectionResult {
    const memoryUsage = this.getCurrentMemoryUsage();
    const suspiciousPatterns: string[] = [];
    const recommendations: string[] = [];

    // Check memory growth trend
    if (this.memoryHistory.length >= 5) {
      const recentMemory = this.memoryHistory.slice(-5);
      const isGrowing = recentMemory.every((value, index) => 
        index === 0 || value >= recentMemory[index - 1]
      );
      
      if (isGrowing) {
        suspiciousPatterns.push('Continuous memory growth detected');
        recommendations.push('Check for unreleased references and event listeners');
      }
    }

    // Check memory threshold
    if (memoryUsage > this.config.memoryThreshold) {
      suspiciousPatterns.push(`Memory usage exceeds threshold (${memoryUsage}MB > ${this.config.memoryThreshold}MB)`);
      recommendations.push('Implement aggressive cleanup and reduce memory footprint');
    }

    // Check long-lived resources
    const now = Date.now();
    const longLivedResources = Array.from(this.trackedResources.values()).filter(
      resource => now - resource.createdAt > 300000 // 5 minutes
    );

    if (longLivedResources.length > 0) {
      suspiciousPatterns.push(`${longLivedResources.length} long-lived resources detected`);
      recommendations.push('Review and cleanup long-lived timers and listeners');
    }

    // Check resource count
    if (this.trackedResources.size > 100) {
      suspiciousPatterns.push(`High resource count (${this.trackedResources.size})`);
      recommendations.push('Implement resource pooling and cleanup strategies');
    }

    const hasLeaks = suspiciousPatterns.length > 0;

    if (hasLeaks) {
      logger.warn('performance', 'Potential memory leaks detected', {
        memoryUsage,
        suspiciousPatterns,
        trackedResources: this.trackedResources.size,
      });
    }

    return {
      hasLeaks,
      memoryUsage,
      suspiciousPatterns,
      recommendations,
    };
  }

  /**
   * Start memory monitoring
   */
  private startMemoryMonitoring(): void {
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
    }

    this.memoryCheckInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, this.config.checkInterval);
  }

  /**
   * Check current memory usage
   */
  private checkMemoryUsage(): void {
    const memoryUsage = this.getCurrentMemoryUsage();
    this.memoryHistory.push(memoryUsage);

    // Keep only last 20 measurements
    if (this.memoryHistory.length > 20) {
      this.memoryHistory = this.memoryHistory.slice(-20);
    }

    // Check for leaks
    const leakDetection = this.detectMemoryLeaks();
    
    if (leakDetection.hasLeaks && this.config.enableAutoCleanup) {
      // Trigger automatic cleanup
      this.performAutomaticCleanup();
    }

    // Log memory usage periodically
    if (this.memoryHistory.length % 5 === 0) {
      logger.debug('performance', 'Memory usage check', {
        current: memoryUsage,
        average: this.memoryHistory.reduce((a, b) => a + b, 0) / this.memoryHistory.length,
        trackedResources: this.trackedResources.size,
      });
    }
  }

  /**
   * Get current memory usage
   */
  private getCurrentMemoryUsage(): number {
    if (Platform.OS === 'web' && (performance as any).memory) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize / (1024 * 1024); // Convert to MB
    }
    
    // For native platforms, we can't directly measure memory
    // Return estimated usage based on tracked resources
    return this.trackedResources.size * 0.1; // Rough estimate
  }

  /**
   * Perform automatic cleanup
   */
  private performAutomaticCleanup(): void {
    logger.info('performance', 'Performing automatic cleanup');

    // Clean up old resources
    const now = Date.now();
    const oldResources = Array.from(this.trackedResources.entries()).filter(
      ([_, resource]) => now - resource.createdAt > 600000 // 10 minutes
    );

    let cleanedCount = 0;
    for (const [id] of oldResources) {
      if (this.cleanupResource(id)) {
        cleanedCount++;
      }
    }

    // Force garbage collection if available
    if (typeof global !== 'undefined' && global.gc) {
      try {
        global.gc();
        logger.debug('performance', 'Garbage collection triggered');
      } catch (error) {
        logger.warn('performance', 'Failed to trigger garbage collection', { error });
      }
    }

    logger.info('performance', 'Automatic cleanup completed', {
      cleanedResources: cleanedCount,
      remainingResources: this.trackedResources.size,
    });
  }

  /**
   * Set up resource tracking hooks
   */
  private setupResourceTracking(): void {
    if (this.config.enableTimerTracking) {
      this.setupTimerTracking();
    }

    if (this.config.enableEventListenerTracking) {
      this.setupEventListenerTracking();
    }
  }

  /**
   * Set up timer tracking
   */
  private setupTimerTracking(): void {
    // Track setTimeout and setInterval
    const originalSetTimeout = global.setTimeout;
    const originalSetInterval = global.setInterval;
    const originalClearTimeout = global.clearTimeout;
    const originalClearInterval = global.clearInterval;

    global.setTimeout = (callback: any, delay?: number, ...args: any[]) => {
      const id = originalSetTimeout(callback, delay, ...args);
      this.trackResource(
        `timeout_${id}`,
        'timer',
        'setTimeout',
        () => originalClearTimeout(id)
      );
      return id;
    };

    global.setInterval = (callback: any, delay?: number, ...args: any[]) => {
      const id = originalSetInterval(callback, delay, ...args);
      this.trackResource(
        `interval_${id}`,
        'timer',
        'setInterval',
        () => originalClearInterval(id)
      );
      return id;
    };

    global.clearTimeout = (id: any) => {
      this.untrackResource(`timeout_${id}`);
      return originalClearTimeout(id);
    };

    global.clearInterval = (id: any) => {
      this.untrackResource(`interval_${id}`);
      return originalClearInterval(id);
    };
  }

  /**
   * Set up event listener tracking
   */
  private setupEventListenerTracking(): void {
    // This would require more complex implementation
    // For now, we'll just log that it's available
    logger.debug('performance', 'Event listener tracking setup (placeholder)');
  }

  /**
   * Set up app state cleanup
   */
  private setupAppStateCleanup(): void {
    // Clean up resources when app goes to background
    if (Platform.OS !== 'web') {
      const { AppState } = require('react-native');
      
      AppState.addEventListener('change', (nextAppState: string) => {
        if (nextAppState === 'background') {
          logger.info('performance', 'App backgrounded, performing cleanup');
          this.performAutomaticCleanup();
        }
      });
    }
  }

  /**
   * Get memory statistics
   */
  getMemoryStats(): {
    currentUsage: number;
    averageUsage: number;
    peakUsage: number;
    trackedResources: number;
    resourcesByType: Record<string, number>;
  } {
    const currentUsage = this.getCurrentMemoryUsage();
    const averageUsage = this.memoryHistory.length > 0 
      ? this.memoryHistory.reduce((a, b) => a + b, 0) / this.memoryHistory.length 
      : 0;
    const peakUsage = Math.max(...this.memoryHistory, currentUsage);

    const resourcesByType: Record<string, number> = {};
    for (const resource of this.trackedResources.values()) {
      resourcesByType[resource.type] = (resourcesByType[resource.type] || 0) + 1;
    }

    return {
      currentUsage,
      averageUsage,
      peakUsage,
      trackedResources: this.trackedResources.size,
      resourcesByType,
    };
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
      this.memoryCheckInterval = undefined;
    }

    this.cleanupAllResources();
    this.isMonitoring = false;
    
    logger.info('performance', 'Memory leak prevention service stopped');
  }

  /**
   * Check if monitoring is active
   */
  isActive(): boolean {
    return this.isMonitoring;
  }
}

export const memoryLeakPrevention = new MemoryLeakPreventionService();

// Export types
export type { MemoryLeakConfig, LeakDetectionResult, TrackedResource };
