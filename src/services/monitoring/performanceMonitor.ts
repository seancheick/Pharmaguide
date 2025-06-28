// src/services/monitoring/performanceMonitor.ts
import { Platform } from 'react-native';
import { crashReporting } from './crashReporting';

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  category: 'storage' | 'scan' | 'analysis' | 'navigation' | 'api' | 'render';
  metadata?: Record<string, any>;
}

interface MemoryMetric {
  timestamp: number;
  usedJSHeapSize?: number;
  totalJSHeapSize?: number;
  jsHeapSizeLimit?: number;
  platform: string;
}

interface NetworkMetric {
  url: string;
  method: string;
  startTime: number;
  endTime: number;
  duration: number;
  status: number;
  size?: number;
  cached?: boolean;
}

class PerformanceMonitorService {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private memoryMetrics: MemoryMetric[] = [];
  private networkMetrics: NetworkMetric[] = [];
  private isMonitoring = false;
  private memoryCheckInterval?: NodeJS.Timeout;

  /**
   * Initialize performance monitoring
   */
  initialize(): void {
    this.isMonitoring = true;
    this.startMemoryMonitoring();
    console.log('✅ Performance monitoring initialized');
  }

  /**
   * Start timing a performance metric
   */
  startTiming(
    name: string,
    category: PerformanceMetric['category'],
    metadata?: Record<string, any>
  ): void {
    if (!this.isMonitoring) return;

    const metric: PerformanceMetric = {
      name,
      startTime: Date.now(),
      category,
      metadata,
    };

    this.metrics.set(name, metric);
    
    // Add breadcrumb for debugging
    crashReporting.addBreadcrumb(
      `Started timing: ${name}`,
      'performance',
      { category, metadata }
    );
  }

  /**
   * End timing a performance metric
   */
  endTiming(name: string, additionalMetadata?: Record<string, any>): number | null {
    if (!this.isMonitoring) return null;

    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`Performance metric "${name}" not found`);
      return null;
    }

    const endTime = Date.now();
    const duration = endTime - metric.startTime;

    metric.endTime = endTime;
    metric.duration = duration;
    
    if (additionalMetadata) {
      metric.metadata = { ...metric.metadata, ...additionalMetadata };
    }

    // Log slow operations
    if (duration > this.getSlowThreshold(metric.category)) {
      crashReporting.reportMessage(
        `Slow operation detected: ${name}`,
        'warning',
        {
          duration,
          category: metric.category,
          metadata: metric.metadata,
        }
      );
    }

    // Add breadcrumb
    crashReporting.addBreadcrumb(
      `Completed timing: ${name}`,
      'performance',
      { duration, category: metric.category }
    );

    // Report to crash reporting service
    if (crashReporting.isInitialized()) {
      const transaction = crashReporting.startTransaction(name, metric.category);
      if (transaction) {
        transaction.setData('duration', duration);
        transaction.setData('category', metric.category);
        if (metric.metadata) {
          transaction.setData('metadata', metric.metadata);
        }
        transaction.finish();
      }
    }

    return duration;
  }

  /**
   * Record network request performance
   */
  recordNetworkRequest(
    url: string,
    method: string,
    startTime: number,
    endTime: number,
    status: number,
    size?: number,
    cached?: boolean
  ): void {
    if (!this.isMonitoring) return;

    const metric: NetworkMetric = {
      url,
      method,
      startTime,
      endTime,
      duration: endTime - startTime,
      status,
      size,
      cached,
    };

    this.networkMetrics.push(metric);

    // Keep only last 100 network metrics
    if (this.networkMetrics.length > 100) {
      this.networkMetrics = this.networkMetrics.slice(-100);
    }

    // Log slow network requests
    if (metric.duration > 5000) { // 5 seconds
      crashReporting.reportMessage(
        `Slow network request: ${method} ${url}`,
        'warning',
        {
          duration: metric.duration,
          status,
          size,
          cached,
        }
      );
    }
  }

  /**
   * Record memory usage
   */
  recordMemoryUsage(): void {
    if (!this.isMonitoring) return;

    try {
      const memoryMetric: MemoryMetric = {
        timestamp: Date.now(),
        platform: Platform.OS,
      };

      // Web-specific memory metrics
      if (Platform.OS === 'web' && (performance as any).memory) {
        const memory = (performance as any).memory;
        memoryMetric.usedJSHeapSize = memory.usedJSHeapSize;
        memoryMetric.totalJSHeapSize = memory.totalJSHeapSize;
        memoryMetric.jsHeapSizeLimit = memory.jsHeapSizeLimit;
      }

      this.memoryMetrics.push(memoryMetric);

      // Keep only last 50 memory metrics
      if (this.memoryMetrics.length > 50) {
        this.memoryMetrics = this.memoryMetrics.slice(-50);
      }

      // Check for memory leaks (web only)
      if (memoryMetric.usedJSHeapSize && memoryMetric.jsHeapSizeLimit) {
        const memoryUsagePercent = (memoryMetric.usedJSHeapSize / memoryMetric.jsHeapSizeLimit) * 100;
        
        if (memoryUsagePercent > 80) {
          crashReporting.reportMessage(
            'High memory usage detected',
            'warning',
            {
              usedMemory: memoryMetric.usedJSHeapSize,
              totalMemory: memoryMetric.jsHeapSizeLimit,
              usagePercent: memoryUsagePercent,
            }
          );
        }
      }
    } catch (error) {
      console.warn('Failed to record memory usage:', error);
    }
  }

  /**
   * Start automatic memory monitoring
   */
  private startMemoryMonitoring(): void {
    // Record memory usage every 30 seconds
    this.memoryCheckInterval = setInterval(() => {
      this.recordMemoryUsage();
    }, 30000);
  }

  /**
   * Get slow operation threshold by category
   */
  private getSlowThreshold(category: PerformanceMetric['category']): number {
    switch (category) {
      case 'storage':
        return 1000; // 1 second
      case 'scan':
        return 3000; // 3 seconds
      case 'analysis':
        return 5000; // 5 seconds
      case 'navigation':
        return 500; // 500ms
      case 'api':
        return 3000; // 3 seconds
      case 'render':
        return 100; // 100ms
      default:
        return 2000; // 2 seconds
    }
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    completedMetrics: PerformanceMetric[];
    networkMetrics: NetworkMetric[];
    memoryMetrics: MemoryMetric[];
    averageDurations: Record<string, number>;
  } {
    const completedMetrics = Array.from(this.metrics.values()).filter(m => m.duration !== undefined);
    
    // Calculate average durations by category
    const averageDurations: Record<string, number> = {};
    const categoryGroups = completedMetrics.reduce((groups, metric) => {
      if (!groups[metric.category]) {
        groups[metric.category] = [];
      }
      groups[metric.category].push(metric.duration!);
      return groups;
    }, {} as Record<string, number[]>);

    for (const [category, durations] of Object.entries(categoryGroups)) {
      averageDurations[category] = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    }

    return {
      completedMetrics,
      networkMetrics: this.networkMetrics,
      memoryMetrics: this.memoryMetrics,
      averageDurations,
    };
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics.clear();
    this.networkMetrics = [];
    this.memoryMetrics = [];
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    this.isMonitoring = false;
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
      this.memoryCheckInterval = undefined;
    }
  }

  /**
   * Check if monitoring is active
   */
  isActive(): boolean {
    return this.isMonitoring;
  }
}

export const performanceMonitor = new PerformanceMonitorService();

// Export types
export type { PerformanceMetric, MemoryMetric, NetworkMetric };
