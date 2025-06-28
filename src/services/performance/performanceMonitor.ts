// src/services/performance/performanceMonitor.ts

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  category: 'navigation' | 'api' | 'render' | 'storage' | 'scan' | 'analysis';
  metadata?: Record<string, any>;
}

interface PerformanceThresholds {
  navigation: number;
  api: number;
  render: number;
  storage: number;
  scan: number;
  analysis: number;
}

class PerformanceMonitor {
  private markers: Map<string, number> = new Map();
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 1000; // Keep last 1000 metrics

  private thresholds: PerformanceThresholds = {
    navigation: 1000, // 1 second
    api: 5000, // 5 seconds
    render: 100, // 100ms
    storage: 500, // 500ms
    scan: 3000, // 3 seconds
    analysis: 10000, // 10 seconds
  };

  startMeasure(name: string, metadata?: Record<string, any>): void {
    this.markers.set(name, Date.now());
    if (metadata) {
      this.markers.set(`${name}_metadata`, metadata as any);
    }
  }

  endMeasure(
    name: string,
    category: PerformanceMetric['category'] = 'render'
  ): number {
    const start = this.markers.get(name);
    if (!start) return 0;

    const duration = Date.now() - start;
    const metadataValue = this.markers.get(`${name}_metadata`);
    const metadata =
      typeof metadataValue === 'object' && metadataValue !== null
        ? (metadataValue as Record<string, any>)
        : undefined;

    this.markers.delete(name);
    if (metadata) {
      this.markers.delete(`${name}_metadata`);
    }

    // Store metric
    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: Date.now(),
      category,
      metadata,
    };

    this.addMetric(metric);

    // Check threshold and warn if exceeded
    const threshold = this.thresholds[category];
    if (duration > threshold) {
      console.warn(
        `[Performance] ${name} exceeded threshold: ${duration}ms > ${threshold}ms`
      );
    } else {
      console.log(`[Performance] ${name}: ${duration}ms`);
    }

    return duration;
  }

  private addMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    category: PerformanceMetric['category'] = 'api'
  ): Promise<T> {
    this.startMeasure(name);
    try {
      const result = await fn();
      this.endMeasure(name, category);
      return result;
    } catch (error) {
      this.endMeasure(name, category);
      throw error;
    }
  }

  /**
   * Get performance statistics
   */
  getStats() {
    if (this.metrics.length === 0) {
      return {
        totalMetrics: 0,
        averageDuration: 0,
        slowestOperations: [],
        categoryStats: {},
      };
    }

    const totalDuration = this.metrics.reduce(
      (sum, metric) => sum + metric.duration,
      0
    );
    const averageDuration = totalDuration / this.metrics.length;

    // Get slowest operations
    const slowestOperations = [...this.metrics]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    return {
      totalMetrics: this.metrics.length,
      averageDuration,
      slowestOperations,
      categoryStats: {},
    };
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }
}

export const performanceMonitor = new PerformanceMonitor();
