import { performanceMonitor } from './performanceMonitor';
import { logger } from './logger';

interface PerformanceMetric {
  name: string;
  duration: number;
  category: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface PerformanceReport {
  averageResponseTime: number;
  memoryUsage: number;
  errorRate: number;
  recommendations: string[];
  slowestOperations: PerformanceMetric[];
  mostFrequentOperations: { name: string; count: number; avgDuration: number }[];
  categoryBreakdown: Record<string, { count: number; avgDuration: number }>;
}

interface Alert {
  type: 'warning' | 'error' | 'info';
  message: string;
  metric: any;
  timestamp: number;
  severity: 'low' | 'medium' | 'high';
}

export class PerformanceDashboard {
  private metrics: PerformanceMetric[] = [];
  private alerts: Alert[] = [];
  private isActive = false;
  private alertThresholds = {
    slowOperation: 2000, // 2 seconds
    memoryUsage: 150 * 1024 * 1024, // 150MB
    errorRate: 0.05, // 5%
    frequentSlowOperations: 5, // Alert if more than 5 slow operations
  };

  /**
   * Initialize the performance dashboard
   */
  initialize(): void {
    this.isActive = true;
    logger.info('performance', 'Performance dashboard initialized');
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: PerformanceMetric): void {
    if (!this.isActive) return;

    this.metrics.push(metric);
    
    // Keep only last 1000 metrics to prevent memory issues
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // Check for performance issues
    this.checkForIssues(metric);
  }

  /**
   * Generate a comprehensive performance report
   */
  generateReport(): PerformanceReport {
    if (this.metrics.length === 0) {
      return {
        averageResponseTime: 0,
        memoryUsage: 0,
        errorRate: 0,
        recommendations: ['No performance data available'],
        slowestOperations: [],
        mostFrequentOperations: [],
        categoryBreakdown: {},
      };
    }

    const completedMetrics = this.metrics.filter(m => m.duration > 0);
    const averageResponseTime = completedMetrics.reduce((sum, m) => sum + m.duration, 0) / completedMetrics.length;

    // Calculate category breakdown
    const categoryBreakdown: Record<string, { count: number; avgDuration: number }> = {};
    completedMetrics.forEach(metric => {
      if (!categoryBreakdown[metric.category]) {
        categoryBreakdown[metric.category] = { count: 0, avgDuration: 0 };
      }
      categoryBreakdown[metric.category].count++;
      categoryBreakdown[metric.category].avgDuration += metric.duration;
    });

    // Calculate average duration per category
    Object.keys(categoryBreakdown).forEach(category => {
      const breakdown = categoryBreakdown[category];
      breakdown.avgDuration = breakdown.avgDuration / breakdown.count;
    });

    // Find slowest operations
    const slowestOperations = [...completedMetrics]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    // Find most frequent operations
    const operationCounts: Record<string, { count: number; totalDuration: number }> = {};
    completedMetrics.forEach(metric => {
      if (!operationCounts[metric.name]) {
        operationCounts[metric.name] = { count: 0, totalDuration: 0 };
      }
      operationCounts[metric.name].count++;
      operationCounts[metric.name].totalDuration += metric.duration;
    });

    const mostFrequentOperations = Object.entries(operationCounts)
      .map(([name, data]) => ({
        name,
        count: data.count,
        avgDuration: data.totalDuration / data.count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Generate recommendations
    const recommendations = this.generateRecommendations(completedMetrics, categoryBreakdown);

    return {
      averageResponseTime,
      memoryUsage: this.getCurrentMemoryUsage(),
      errorRate: this.calculateErrorRate(),
      recommendations,
      slowestOperations,
      mostFrequentOperations,
      categoryBreakdown,
    };
  }

  /**
   * Get current memory usage
   */
  private getCurrentMemoryUsage(): number {
    try {
      if (typeof performance !== 'undefined' && (performance as any).memory) {
        return (performance as any).memory.usedJSHeapSize || 0;
      }
      return 0;
    } catch (error) {
      logger.warn('performance', 'Failed to get memory usage', error as Error);
      return 0;
    }
  }

  /**
   * Calculate error rate based on failed operations
   */
  private calculateErrorRate(): number {
    const errorMetrics = this.metrics.filter(m => 
      m.metadata?.error || m.metadata?.status >= 400
    );
    return this.metrics.length > 0 ? errorMetrics.length / this.metrics.length : 0;
  }

  /**
   * Check for performance issues and create alerts
   */
  private checkForIssues(metric: PerformanceMetric): void {
    // Check for slow operations
    if (metric.duration > this.alertThresholds.slowOperation) {
      this.createAlert({
        type: 'warning',
        message: `Slow operation detected: ${metric.name}`,
        metric: { duration: metric.duration, category: metric.category },
        timestamp: Date.now(),
        severity: metric.duration > 5000 ? 'high' : 'medium',
      });
    }

    // Check memory usage
    const memoryUsage = this.getCurrentMemoryUsage();
    if (memoryUsage > this.alertThresholds.memoryUsage) {
      this.createAlert({
        type: 'error',
        message: 'High memory usage detected',
        metric: { memoryUsage, threshold: this.alertThresholds.memoryUsage },
        timestamp: Date.now(),
        severity: 'high',
      });
    }

    // Check for frequent slow operations
    const recentSlowOperations = this.metrics
      .filter(m => m.duration > this.alertThresholds.slowOperation)
      .filter(m => Date.now() - m.timestamp < 60000); // Last minute

    if (recentSlowOperations.length > this.alertThresholds.frequentSlowOperations) {
      this.createAlert({
        type: 'error',
        message: 'Multiple slow operations detected',
        metric: { count: recentSlowOperations.length, operations: recentSlowOperations.map(m => m.name) },
        timestamp: Date.now(),
        severity: 'high',
      });
    }
  }

  /**
   * Create a performance alert
   */
  private createAlert(alert: Alert): void {
    this.alerts.push(alert);
    
    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    // Log the alert
    logger.warn('performance', `Performance alert: ${alert.message}`, {
      type: alert.type,
      severity: alert.severity,
      metric: alert.metric,
    });

    // Report to crash reporting if available
    if (typeof window !== 'undefined' && (window as any).crashReporting) {
      (window as any).crashReporting.reportMessage(
        `Performance Alert: ${alert.message}`,
        alert.type,
        alert.metric
      );
    }
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(
    metrics: PerformanceMetric[],
    categoryBreakdown: Record<string, { count: number; avgDuration: number }>
  ): string[] {
    const recommendations: string[] = [];

    // Check for slow categories
    Object.entries(categoryBreakdown).forEach(([category, data]) => {
      if (data.avgDuration > 1000) {
        recommendations.push(`Optimize ${category} operations (avg: ${data.avgDuration.toFixed(0)}ms)`);
      }
    });

    // Check for memory issues
    const memoryUsage = this.getCurrentMemoryUsage();
    if (memoryUsage > 100 * 1024 * 1024) { // 100MB
      recommendations.push('Consider implementing memory cleanup strategies');
    }

    // Check for error rate
    const errorRate = this.calculateErrorRate();
    if (errorRate > 0.01) { // 1%
      recommendations.push('Investigate high error rate in operations');
    }

    // Check for frequent operations that could be cached
    const frequentOperations = metrics.reduce((acc, metric) => {
      acc[metric.name] = (acc[metric.name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(frequentOperations).forEach(([name, count]) => {
      if (count > 10) {
        recommendations.push(`Consider caching for frequently called operation: ${name}`);
      }
    });

    return recommendations.length > 0 ? recommendations : ['Performance is within acceptable ranges'];
  }

  /**
   * Get all active alerts
   */
  getAlerts(): Alert[] {
    return [...this.alerts];
  }

  /**
   * Clear all metrics and alerts
   */
  clearData(): void {
    this.metrics = [];
    this.alerts = [];
    logger.info('performance', 'Performance dashboard data cleared');
  }

  /**
   * Get dashboard status
   */
  getStatus(): {
    isActive: boolean;
    metricsCount: number;
    alertsCount: number;
    lastUpdate: number;
  } {
    return {
      isActive: this.isActive,
      metricsCount: this.metrics.length,
      alertsCount: this.alerts.length,
      lastUpdate: this.metrics.length > 0 ? Math.max(...this.metrics.map(m => m.timestamp)) : 0,
    };
  }

  /**
   * Stop the dashboard
   */
  stop(): void {
    this.isActive = false;
    logger.info('performance', 'Performance dashboard stopped');
  }
}

// Export singleton instance
export const performanceDashboard = new PerformanceDashboard(); 