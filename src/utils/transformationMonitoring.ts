// src/utils/transformationMonitoring.ts
/**
 * Performance monitoring and analytics for database transformations
 * Tracks transformation performance and identifies bottlenecks
 */

interface TransformationMetrics {
  operation: string;
  duration: number;
  recordCount: number;
  success: boolean;
  errorMessage?: string;
  timestamp: string;
}

interface PerformanceStats {
  totalOperations: number;
  averageDuration: number;
  successRate: number;
  totalRecords: number;
  slowestOperation: TransformationMetrics | null;
  fastestOperation: TransformationMetrics | null;
  recentErrors: string[];
}

/**
 * Performance monitoring service for database transformations
 */
class TransformationMonitoringService {
  private metrics: TransformationMetrics[] = [];
  private maxMetricsHistory = 1000; // Keep last 1000 operations

  /**
   * Measure the performance of a transformation operation
   */
  async measureTransformation<T>(
    operationName: string,
    operation: () => Promise<T>,
    recordCount: number = 1
  ): Promise<T> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    
    try {
      const result = await operation();
      const duration = Date.now() - startTime;
      
      this.recordMetric({
        operation: operationName,
        duration,
        recordCount,
        success: true,
        timestamp,
      });
      
      // Log slow operations (> 100ms for single records, > 1000ms for batch)
      const threshold = recordCount > 1 ? 1000 : 100;
      if (duration > threshold) {
        console.warn(`🐌 Slow transformation detected: ${operationName} took ${duration}ms for ${recordCount} records`);
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.recordMetric({
        operation: operationName,
        duration,
        recordCount,
        success: false,
        errorMessage,
        timestamp,
      });
      
      console.error(`❌ Transformation failed: ${operationName} - ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Measure synchronous transformation operations
   */
  measureSyncTransformation<T>(
    operationName: string,
    operation: () => T,
    recordCount: number = 1
  ): T {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    
    try {
      const result = operation();
      const duration = Date.now() - startTime;
      
      this.recordMetric({
        operation: operationName,
        duration,
        recordCount,
        success: true,
        timestamp,
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.recordMetric({
        operation: operationName,
        duration,
        recordCount,
        success: false,
        errorMessage,
        timestamp,
      });
      
      throw error;
    }
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(operationFilter?: string): PerformanceStats {
    const filteredMetrics = operationFilter 
      ? this.metrics.filter(m => m.operation.includes(operationFilter))
      : this.metrics;

    if (filteredMetrics.length === 0) {
      return {
        totalOperations: 0,
        averageDuration: 0,
        successRate: 0,
        totalRecords: 0,
        slowestOperation: null,
        fastestOperation: null,
        recentErrors: [],
      };
    }

    const successfulOps = filteredMetrics.filter(m => m.success);
    const failedOps = filteredMetrics.filter(m => !m.success);
    
    const totalDuration = filteredMetrics.reduce((sum, m) => sum + m.duration, 0);
    const totalRecords = filteredMetrics.reduce((sum, m) => sum + m.recordCount, 0);
    
    const sortedByDuration = [...filteredMetrics].sort((a, b) => a.duration - b.duration);
    
    return {
      totalOperations: filteredMetrics.length,
      averageDuration: Math.round(totalDuration / filteredMetrics.length),
      successRate: Math.round((successfulOps.length / filteredMetrics.length) * 100),
      totalRecords,
      slowestOperation: sortedByDuration[sortedByDuration.length - 1] || null,
      fastestOperation: sortedByDuration[0] || null,
      recentErrors: failedOps
        .slice(-5) // Last 5 errors
        .map(m => `${m.operation}: ${m.errorMessage}`)
        .filter(Boolean),
    };
  }

  /**
   * Get detailed performance report
   */
  getPerformanceReport(): string {
    const stats = this.getPerformanceStats();
    const productStats = this.getPerformanceStats('Product');
    const userProfileStats = this.getPerformanceStats('UserProfile');
    const scanStats = this.getPerformanceStats('Scan');

    return `
📊 TRANSFORMATION PERFORMANCE REPORT
=====================================

Overall Statistics:
  Total Operations: ${stats.totalOperations}
  Average Duration: ${stats.averageDuration}ms
  Success Rate: ${stats.successRate}%
  Total Records Processed: ${stats.totalRecords}

Product Transformations:
  Operations: ${productStats.totalOperations}
  Average Duration: ${productStats.averageDuration}ms
  Success Rate: ${productStats.successRate}%

User Profile Transformations:
  Operations: ${userProfileStats.totalOperations}
  Average Duration: ${userProfileStats.averageDuration}ms
  Success Rate: ${userProfileStats.successRate}%

Scan Transformations:
  Operations: ${scanStats.totalOperations}
  Average Duration: ${scanStats.averageDuration}ms
  Success Rate: ${scanStats.successRate}%

Performance Insights:
  Slowest Operation: ${stats.slowestOperation ? 
    `${stats.slowestOperation.operation} (${stats.slowestOperation.duration}ms)` : 'None'}
  Fastest Operation: ${stats.fastestOperation ? 
    `${stats.fastestOperation.operation} (${stats.fastestOperation.duration}ms)` : 'None'}

Recent Errors:
${stats.recentErrors.length > 0 ? 
  stats.recentErrors.map(error => `  - ${error}`).join('\n') : 
  '  No recent errors'}

Recommendations:
${this.getPerformanceRecommendations(stats)}
`;
  }

  /**
   * Clear metrics history
   */
  clearMetrics(): void {
    this.metrics = [];
    console.log('🧹 Transformation metrics cleared');
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): TransformationMetrics[] {
    return [...this.metrics];
  }

  /**
   * Record a transformation metric
   */
  private recordMetric(metric: TransformationMetrics): void {
    this.metrics.push(metric);
    
    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory);
    }
  }

  /**
   * Generate performance recommendations
   */
  private getPerformanceRecommendations(stats: PerformanceStats): string {
    const recommendations: string[] = [];

    if (stats.averageDuration > 50) {
      recommendations.push('  - Consider optimizing transformation logic for better performance');
    }

    if (stats.successRate < 95) {
      recommendations.push('  - Investigate and fix transformation errors to improve reliability');
    }

    if (stats.slowestOperation && stats.slowestOperation.duration > 500) {
      recommendations.push(`  - Optimize ${stats.slowestOperation.operation} operation (${stats.slowestOperation.duration}ms)`);
    }

    if (stats.recentErrors.length > 2) {
      recommendations.push('  - Address recent transformation errors to improve stability');
    }

    if (recommendations.length === 0) {
      recommendations.push('  - Performance looks good! 🎉');
    }

    return recommendations.join('\n');
  }
}

// Export singleton instance
export const transformationMonitoring = new TransformationMonitoringService();

/**
 * Decorator function to automatically measure transformation performance
 */
export function measureTransformation(operationName: string, recordCount: number = 1) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = function (...args: any[]) {
      return transformationMonitoring.measureSyncTransformation(
        `${target.constructor.name}.${operationName}`,
        () => method.apply(this, args),
        recordCount
      );
    };
  };
}

/**
 * Async decorator function to automatically measure transformation performance
 */
export function measureAsyncTransformation(operationName: string, recordCount: number = 1) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = function (...args: any[]) {
      return transformationMonitoring.measureTransformation(
        `${target.constructor.name}.${operationName}`,
        () => method.apply(this, args),
        recordCount
      );
    };
  };
}
