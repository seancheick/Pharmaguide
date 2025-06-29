import { logger } from './logger';
import { performanceDashboard } from './performanceDashboard';

interface PerformanceMetric {
  name: string;
  duration: number;
  category: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface Alert {
  type: 'warning' | 'error' | 'info';
  message: string;
  metric: any;
  timestamp: number;
  severity: 'low' | 'medium' | 'high';
  category: string;
  actionable: boolean;
  recommendation?: string;
}

interface AlertThresholds {
  memoryUsage: number; // in bytes
  responseTime: number; // in milliseconds
  errorRate: number; // percentage (0-1)
  frequentSlowOperations: number; // count
  memoryLeakThreshold: number; // percentage increase
  networkTimeout: number; // in milliseconds
}

export class PerformanceAlerts {
  private alerts: Alert[] = [];
  private isActive = false;
  private thresholds: AlertThresholds = {
    memoryUsage: 150 * 1024 * 1024, // 150MB
    responseTime: 2000, // 2 seconds
    errorRate: 0.05, // 5%
    frequentSlowOperations: 5, // Alert if more than 5 slow operations
    memoryLeakThreshold: 0.2, // 20% increase
    networkTimeout: 10000, // 10 seconds
  };

  private memoryHistory: number[] = [];
  private slowOperationHistory: PerformanceMetric[] = [];
  private errorHistory: PerformanceMetric[] = [];

  /**
   * Initialize performance alerts
   */
  initialize(customThresholds?: Partial<AlertThresholds>): void {
    this.isActive = true;
    if (customThresholds) {
      this.thresholds = { ...this.thresholds, ...customThresholds };
    }
    logger.info('performance', 'Performance alerts initialized', { thresholds: this.thresholds });
  }

  /**
   * Check metrics and generate alerts
   */
  checkMetrics(metrics: PerformanceMetric[]): Alert[] {
    if (!this.isActive) return [];

    const newAlerts: Alert[] = [];

    // Check each metric for issues
    metrics.forEach(metric => {
      const metricAlerts = this.checkMetric(metric);
      newAlerts.push(...metricAlerts);
    });

    // Check aggregate metrics
    const aggregateAlerts = this.checkAggregateMetrics(metrics);
    newAlerts.push(...aggregateAlerts);

    // Add new alerts to the list
    this.alerts.push(...newAlerts);

    // Keep only last 200 alerts to prevent memory issues
    if (this.alerts.length > 200) {
      this.alerts = this.alerts.slice(-200);
    }

    return newAlerts;
  }

  /**
   * Check a single metric for issues
   */
  private checkMetric(metric: PerformanceMetric): Alert[] {
    const alerts: Alert[] = [];

    // Check for slow operations
    if (metric.duration > this.thresholds.responseTime) {
      alerts.push({
        type: 'warning',
        message: `Slow operation detected: ${metric.name}`,
        metric: { duration: metric.duration, category: metric.category },
        timestamp: Date.now(),
        severity: metric.duration > 5000 ? 'high' : 'medium',
        category: 'performance',
        actionable: true,
        recommendation: `Consider optimizing ${metric.name} operation or implementing caching`,
      });
    }

    // Check for errors
    if (metric.metadata?.error || metric.metadata?.status >= 400) {
      alerts.push({
        type: 'error',
        message: `Operation failed: ${metric.name}`,
        metric: { error: metric.metadata?.error, status: metric.metadata?.status },
        timestamp: Date.now(),
        severity: 'high',
        category: 'error',
        actionable: true,
        recommendation: 'Investigate the root cause of this operation failure',
      });
    }

    // Check for network timeouts
    if (metric.duration > this.thresholds.networkTimeout) {
      alerts.push({
        type: 'error',
        message: `Network timeout: ${metric.name}`,
        metric: { duration: metric.duration, category: metric.category },
        timestamp: Date.now(),
        severity: 'high',
        category: 'network',
        actionable: true,
        recommendation: 'Check network connectivity and consider implementing retry logic',
      });
    }

    return alerts;
  }

  /**
   * Check aggregate metrics for patterns
   */
  private checkAggregateMetrics(metrics: PerformanceMetric[]): Alert[] {
    const alerts: Alert[] = [];

    // Check memory usage
    const memoryUsage = this.getCurrentMemoryUsage();
    if (memoryUsage > this.thresholds.memoryUsage) {
      alerts.push({
        type: 'error',
        message: 'High memory usage detected',
        metric: { memoryUsage, threshold: this.thresholds.memoryUsage },
        timestamp: Date.now(),
        severity: 'high',
        category: 'memory',
        actionable: true,
        recommendation: 'Implement memory cleanup strategies and investigate memory leaks',
      });
    }

    // Check for memory leaks
    const memoryLeakAlert = this.checkMemoryLeak();
    if (memoryLeakAlert) {
      alerts.push(memoryLeakAlert);
    }

    // Check for frequent slow operations
    const recentSlowOperations = metrics.filter(m => 
      m.duration > this.thresholds.responseTime && 
      Date.now() - m.timestamp < 60000 // Last minute
    );

    if (recentSlowOperations.length > this.thresholds.frequentSlowOperations) {
      alerts.push({
        type: 'error',
        message: 'Multiple slow operations detected',
        metric: { 
          count: recentSlowOperations.length, 
          operations: recentSlowOperations.map(m => m.name) 
        },
        timestamp: Date.now(),
        severity: 'high',
        category: 'performance',
        actionable: true,
        recommendation: 'Review and optimize the most frequently slow operations',
      });
    }

    // Check error rate
    const errorRate = this.calculateErrorRate(metrics);
    if (errorRate > this.thresholds.errorRate) {
      alerts.push({
        type: 'error',
        message: 'High error rate detected',
        metric: { errorRate, threshold: this.thresholds.errorRate },
        timestamp: Date.now(),
        severity: 'high',
        category: 'error',
        actionable: true,
        recommendation: 'Investigate the root cause of increased error rates',
      });
    }

    return alerts;
  }

  /**
   * Check for potential memory leaks
   */
  private checkMemoryLeak(): Alert | null {
    const currentMemory = this.getCurrentMemoryUsage();
    this.memoryHistory.push(currentMemory);

    // Keep only last 10 memory readings
    if (this.memoryHistory.length > 10) {
      this.memoryHistory = this.memoryHistory.slice(-10);
    }

    // Need at least 5 readings to detect a trend
    if (this.memoryHistory.length < 5) return null;

    // Calculate memory growth trend
    const recentMemory = this.memoryHistory.slice(-5);
    const isGrowing = recentMemory.every((value, index) => 
      index === 0 || value >= recentMemory[index - 1]
    );

    if (isGrowing) {
      const growthRate = (recentMemory[recentMemory.length - 1] - recentMemory[0]) / recentMemory[0];
      
      if (growthRate > this.thresholds.memoryLeakThreshold) {
        return {
          type: 'warning',
          message: 'Potential memory leak detected',
          metric: { growthRate, memoryHistory: recentMemory },
          timestamp: Date.now(),
          severity: 'medium',
          category: 'memory',
          actionable: true,
          recommendation: 'Investigate for memory leaks in event listeners, timers, or subscriptions',
        };
      }
    }

    return null;
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
   * Calculate error rate from metrics
   */
  private calculateErrorRate(metrics: PerformanceMetric[]): number {
    if (metrics.length === 0) return 0;
    
    const errorMetrics = metrics.filter(m => 
      m.metadata?.error || m.metadata?.status >= 400
    );
    
    return errorMetrics.length / metrics.length;
  }

  /**
   * Get all active alerts
   */
  getAlerts(): Alert[] {
    return [...this.alerts];
  }

  /**
   * Get alerts by category
   */
  getAlertsByCategory(category: string): Alert[] {
    return this.alerts.filter(alert => alert.category === category);
  }

  /**
   * Get alerts by severity
   */
  getAlertsBySeverity(severity: 'low' | 'medium' | 'high'): Alert[] {
    return this.alerts.filter(alert => alert.severity === severity);
  }

  /**
   * Get actionable alerts
   */
  getActionableAlerts(): Alert[] {
    return this.alerts.filter(alert => alert.actionable);
  }

  /**
   * Clear all alerts
   */
  clearAlerts(): void {
    this.alerts = [];
    logger.info('performance', 'Performance alerts cleared');
  }

  /**
   * Clear alerts by category
   */
  clearAlertsByCategory(category: string): void {
    this.alerts = this.alerts.filter(alert => alert.category !== category);
    logger.info('performance', `Cleared alerts for category: ${category}`);
  }

  /**
   * Update alert thresholds
   */
  updateThresholds(newThresholds: Partial<AlertThresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    logger.info('performance', 'Alert thresholds updated', { newThresholds });
  }

  /**
   * Get current thresholds
   */
  getThresholds(): AlertThresholds {
    return { ...this.thresholds };
  }

  /**
   * Get alert statistics
   */
  getAlertStats(): {
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    byCategory: Record<string, number>;
  } {
    const byType = this.alerts.reduce((acc, alert) => {
      acc[alert.type] = (acc[alert.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const bySeverity = this.alerts.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byCategory = this.alerts.reduce((acc, alert) => {
      acc[alert.category] = (acc[alert.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: this.alerts.length,
      byType,
      bySeverity,
      byCategory,
    };
  }

  /**
   * Stop performance alerts
   */
  stop(): void {
    this.isActive = false;
    logger.info('performance', 'Performance alerts stopped');
  }

  /**
   * Check if alerts are active
   */
  isMonitoringActive(): boolean {
    return this.isActive;
  }
}

// Export singleton instance
export const performanceAlerts = new PerformanceAlerts(); 