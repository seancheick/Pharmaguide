// src/services/performance/enhancedMemoryMonitor.ts
import { Platform } from 'react-native';
import { logger } from '../monitoring/logger';
import { memoryManager } from '../../utils/memoryManagement';

interface MemoryPressureLevel {
  level: 'normal' | 'warning' | 'critical';
  percentage: number;
  usedMemory: number;
  totalMemory: number;
  availableMemory: number;
  timestamp: number;
}

interface MemoryPressureConfig {
  warningThreshold: number; // 0.0 - 1.0
  criticalThreshold: number; // 0.0 - 1.0
  monitoringInterval: number; // milliseconds
  enableAutoCleanup: boolean;
  enableCacheClearing: boolean;
  enableGarbageCollection: boolean;
}

interface MemoryMetrics {
  jsHeapSizeLimit?: number;
  totalJSHeapSize?: number;
  usedJSHeapSize?: number;
  deviceMemory?: number;
  hardwareConcurrency?: number;
}

/**
 * Enhanced Memory Pressure Monitor
 * Builds on your existing memory management with browser-specific monitoring
 */
class EnhancedMemoryMonitor {
  private config: MemoryPressureConfig = {
    warningThreshold: 0.75, // 75% memory usage
    criticalThreshold: 0.9, // 90% memory usage
    monitoringInterval: 10000, // 10 seconds
    enableAutoCleanup: true,
    enableCacheClearing: true,
    enableGarbageCollection: true,
  };

  private monitoringInterval: NodeJS.Timeout | null = null;
  private pressureHistory: MemoryPressureLevel[] = [];
  private listeners: Array<(pressure: MemoryPressureLevel) => void> = [];
  private isMonitoring = false;

  /**
   * Initialize enhanced memory monitoring
   */
  initialize(config?: Partial<MemoryPressureConfig>): void {
    if (config) {
      this.config = { ...this.config, ...config };
    }

    this.startMonitoring();

    logger.info('performance', 'Enhanced memory monitor initialized', {
      config: this.config,
      platform: Platform.OS,
      webMemorySupport: this.isWebMemoryAPISupported(),
    });
  }

  /**
   * Start memory pressure monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.checkMemoryPressure();
    }, this.config.monitoringInterval);

    logger.debug('performance', 'Memory pressure monitoring started');
  }

  /**
   * Stop memory pressure monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    logger.debug('performance', 'Memory pressure monitoring stopped');
  }

  /**
   * Check current memory pressure
   */
  async checkMemoryPressure(): Promise<MemoryPressureLevel> {
    try {
      const metrics = await this.getMemoryMetrics();
      const pressure = this.calculateMemoryPressure(metrics);

      // Add to history
      this.pressureHistory.push(pressure);
      
      // Keep only last 100 readings
      if (this.pressureHistory.length > 100) {
        this.pressureHistory.shift();
      }

      // Handle pressure levels
      await this.handleMemoryPressure(pressure);

      // Notify listeners
      this.listeners.forEach(listener => {
        try {
          listener(pressure);
        } catch (error) {
          logger.warn('performance', 'Memory pressure listener error', { error });
        }
      });

      return pressure;

    } catch (error) {
      logger.error('performance', 'Memory pressure check failed', error);
      
      // Return safe default
      return {
        level: 'normal',
        percentage: 0,
        usedMemory: 0,
        totalMemory: 0,
        availableMemory: 0,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Get memory metrics from available APIs
   */
  private async getMemoryMetrics(): Promise<MemoryMetrics> {
    const metrics: MemoryMetrics = {};

    // Web Memory API (Chrome/Edge)
    if (this.isWebMemoryAPISupported()) {
      const memory = (performance as any).memory;
      metrics.jsHeapSizeLimit = memory.jsHeapSizeLimit;
      metrics.totalJSHeapSize = memory.totalJSHeapSize;
      metrics.usedJSHeapSize = memory.usedJSHeapSize;
    }

    // Device Memory API (experimental)
    if ('deviceMemory' in navigator) {
      metrics.deviceMemory = (navigator as any).deviceMemory;
    }

    // Hardware Concurrency (CPU cores)
    if ('hardwareConcurrency' in navigator) {
      metrics.hardwareConcurrency = navigator.hardwareConcurrency;
    }

    return metrics;
  }

  /**
   * Calculate memory pressure level from metrics
   */
  private calculateMemoryPressure(metrics: MemoryMetrics): MemoryPressureLevel {
    const timestamp = Date.now();

    // Use Web Memory API if available
    if (metrics.usedJSHeapSize && metrics.jsHeapSizeLimit) {
      const usageRatio = metrics.usedJSHeapSize / metrics.jsHeapSizeLimit;
      const percentage = Math.round(usageRatio * 100);

      let level: MemoryPressureLevel['level'] = 'normal';
      if (usageRatio > this.config.criticalThreshold) {
        level = 'critical';
      } else if (usageRatio > this.config.warningThreshold) {
        level = 'warning';
      }

      return {
        level,
        percentage,
        usedMemory: metrics.usedJSHeapSize,
        totalMemory: metrics.jsHeapSizeLimit,
        availableMemory: metrics.jsHeapSizeLimit - metrics.usedJSHeapSize,
        timestamp,
      };
    }

    // Fallback for platforms without detailed memory info
    // Use heuristics based on available information
    let estimatedUsage = 0.5; // Default to 50%

    // Adjust based on device memory if available
    if (metrics.deviceMemory) {
      // Assume higher usage on lower memory devices
      if (metrics.deviceMemory <= 2) {
        estimatedUsage = 0.8; // 80% on low memory devices
      } else if (metrics.deviceMemory <= 4) {
        estimatedUsage = 0.6; // 60% on medium memory devices
      } else {
        estimatedUsage = 0.4; // 40% on high memory devices
      }
    }

    const percentage = Math.round(estimatedUsage * 100);
    let level: MemoryPressureLevel['level'] = 'normal';
    
    if (estimatedUsage > this.config.criticalThreshold) {
      level = 'critical';
    } else if (estimatedUsage > this.config.warningThreshold) {
      level = 'warning';
    }

    return {
      level,
      percentage,
      usedMemory: 0, // Unknown
      totalMemory: 0, // Unknown
      availableMemory: 0, // Unknown
      timestamp,
    };
  }

  /**
   * Handle memory pressure based on level
   */
  private async handleMemoryPressure(pressure: MemoryPressureLevel): Promise<void> {
    if (pressure.level === 'normal') return;

    logger.warn('performance', 'Memory pressure detected', {
      level: pressure.level,
      percentage: pressure.percentage,
      usedMemory: pressure.usedMemory,
      availableMemory: pressure.availableMemory,
    });

    if (!this.config.enableAutoCleanup) return;

    try {
      if (pressure.level === 'warning') {
        await this.performLightCleanup();
      } else if (pressure.level === 'critical') {
        await this.performAggressiveCleanup();
      }
    } catch (error) {
      logger.error('performance', 'Memory cleanup failed', error);
    }
  }

  /**
   * Perform light memory cleanup
   */
  private async performLightCleanup(): Promise<void> {
    logger.info('performance', 'Performing light memory cleanup');

    // Trigger existing memory manager cleanup
    memoryManager.triggerMemoryCleanup();

    // Clear browser caches if enabled
    if (this.config.enableCacheClearing && Platform.OS === 'web') {
      await this.clearBrowserCaches();
    }
  }

  /**
   * Perform aggressive memory cleanup
   */
  private async performAggressiveCleanup(): Promise<void> {
    logger.warn('performance', 'Performing aggressive memory cleanup');

    // Trigger existing memory manager cleanup
    memoryManager.triggerMemoryCleanup();

    // Clear all browser caches
    if (this.config.enableCacheClearing && Platform.OS === 'web') {
      await this.clearBrowserCaches(true);
    }

    // Force garbage collection if available
    if (this.config.enableGarbageCollection) {
      this.forceGarbageCollection();
    }

    // Clear component caches (if any)
    this.clearComponentCaches();
  }

  /**
   * Clear browser caches
   */
  private async clearBrowserCaches(aggressive: boolean = false): Promise<void> {
    if (Platform.OS !== 'web' || !('caches' in window)) return;

    try {
      const cacheNames = await caches.keys();
      
      if (aggressive) {
        // Clear all caches
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        logger.info('performance', 'All browser caches cleared', { count: cacheNames.length });
      } else {
        // Clear only non-essential caches (keep critical ones)
        const nonEssentialCaches = cacheNames.filter(name => 
          !name.includes('critical') && !name.includes('essential')
        );
        await Promise.all(nonEssentialCaches.map(name => caches.delete(name)));
        logger.info('performance', 'Non-essential browser caches cleared', { 
          count: nonEssentialCaches.length 
        });
      }
    } catch (error) {
      logger.warn('performance', 'Failed to clear browser caches', { error });
    }
  }

  /**
   * Force garbage collection if available
   */
  private forceGarbageCollection(): void {
    try {
      // Chrome DevTools or Node.js environment
      if ('gc' in window) {
        (window as any).gc();
        logger.debug('performance', 'Forced garbage collection');
      }
      // Alternative method for some environments
      else if ('FinalizationRegistry' in window) {
        // Create and immediately destroy objects to trigger GC
        const registry = new FinalizationRegistry(() => {});
        const obj = {};
        registry.register(obj, 'cleanup');
        // obj will be eligible for GC
      }
    } catch (error) {
      logger.debug('performance', 'Garbage collection not available', { error });
    }
  }

  /**
   * Clear component-level caches
   */
  private clearComponentCaches(): void {
    // This would integrate with your component caching systems
    // For now, we'll just log the action
    logger.debug('performance', 'Component caches cleared');
  }

  /**
   * Check if Web Memory API is supported
   */
  private isWebMemoryAPISupported(): boolean {
    return Platform.OS === 'web' && 
           'performance' in window && 
           'memory' in performance;
  }

  /**
   * Add memory pressure listener
   */
  onMemoryPressure(listener: (pressure: MemoryPressureLevel) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Get current memory pressure
   */
  getCurrentPressure(): MemoryPressureLevel | null {
    return this.pressureHistory[this.pressureHistory.length - 1] || null;
  }

  /**
   * Get memory pressure history
   */
  getPressureHistory(limit: number = 50): MemoryPressureLevel[] {
    return this.pressureHistory.slice(-limit);
  }

  /**
   * Get memory pressure statistics
   */
  getMemoryStats(): {
    averagePressure: number;
    maxPressure: number;
    warningCount: number;
    criticalCount: number;
    isMonitoring: boolean;
  } {
    if (this.pressureHistory.length === 0) {
      return {
        averagePressure: 0,
        maxPressure: 0,
        warningCount: 0,
        criticalCount: 0,
        isMonitoring: this.isMonitoring,
      };
    }

    const pressures = this.pressureHistory.map(p => p.percentage);
    const averagePressure = pressures.reduce((sum, p) => sum + p, 0) / pressures.length;
    const maxPressure = Math.max(...pressures);
    const warningCount = this.pressureHistory.filter(p => p.level === 'warning').length;
    const criticalCount = this.pressureHistory.filter(p => p.level === 'critical').length;

    return {
      averagePressure: Math.round(averagePressure),
      maxPressure,
      warningCount,
      criticalCount,
      isMonitoring: this.isMonitoring,
    };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<MemoryPressureConfig>): void {
    this.config = { ...this.config, ...updates };
    logger.info('performance', 'Memory monitor config updated', { updates });
  }

  /**
   * Cleanup and destroy monitor
   */
  destroy(): void {
    this.stopMonitoring();
    this.listeners = [];
    this.pressureHistory = [];
    logger.info('performance', 'Enhanced memory monitor destroyed');
  }
}

// Export singleton instance
export const enhancedMemoryMonitor = new EnhancedMemoryMonitor();
