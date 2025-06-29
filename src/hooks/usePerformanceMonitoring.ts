import { useEffect, useCallback, useRef } from 'react';
import { performanceMonitor } from '../services/monitoring/performanceMonitor';
import { performanceDashboard } from '../services/monitoring/performanceDashboard';
import { performanceAlerts } from '../services/monitoring/performanceAlerts';
import { logger } from '../services/monitoring/logger';

interface PerformanceConfig {
  enableAutoMonitoring?: boolean;
  enableMemoryTracking?: boolean;
  enableNetworkTracking?: boolean;
  alertThresholds?: {
    slowOperation?: number;
    memoryUsage?: number;
    errorRate?: number;
  };
}

interface PerformanceMetrics {
  startTiming: (name: string, category: string, metadata?: Record<string, any>) => void;
  endTiming: (name: string, additionalMetadata?: Record<string, any>) => number | null;
  recordMetric: (name: string, duration: number, category: string, metadata?: Record<string, any>) => void;
  getReport: () => any;
  getAlerts: () => any[];
  clearData: () => void;
}

/**
 * Hook for comprehensive performance monitoring
 */
export const usePerformanceMonitoring = (config: PerformanceConfig = {}): PerformanceMetrics => {
  const {
    enableAutoMonitoring = true,
    enableMemoryTracking = true,
    enableNetworkTracking = true,
    alertThresholds = {},
  } = config;

  const activeTimings = useRef<Map<string, { startTime: number; category: string; metadata?: Record<string, any> }>>(new Map());

  // Initialize services on mount
  useEffect(() => {
    if (enableAutoMonitoring) {
      try {
        performanceMonitor.initialize();
        performanceDashboard.initialize();
        performanceAlerts.initialize(alertThresholds);
        
        logger.info('performance', 'Performance monitoring hook initialized', {
          enableMemoryTracking,
          enableNetworkTracking,
          alertThresholds,
        });
      } catch (error) {
        logger.error('performance', 'Failed to initialize performance monitoring', error as Error);
      }
    }

    // Cleanup on unmount
    return () => {
      if (enableAutoMonitoring) {
        performanceMonitor.stop();
        performanceDashboard.stop();
        performanceAlerts.stop();
      }
    };
  }, [enableAutoMonitoring, enableMemoryTracking, enableNetworkTracking, alertThresholds]);

  // Start timing a performance metric
  const startTiming = useCallback((
    name: string,
    category: string,
    metadata?: Record<string, any>
  ) => {
    if (!enableAutoMonitoring) return;

    const startTime = Date.now();
    activeTimings.current.set(name, { startTime, category, metadata });
    
    performanceMonitor.startTiming(name, category as any, metadata);
  }, [enableAutoMonitoring]);

  // End timing a performance metric
  const endTiming = useCallback((
    name: string,
    additionalMetadata?: Record<string, any>
  ): number | null => {
    if (!enableAutoMonitoring) return null;

    const timing = activeTimings.current.get(name);
    if (!timing) {
      logger.warn('performance', `No active timing found for: ${name}`);
      return null;
    }

    const duration = performanceMonitor.endTiming(name, additionalMetadata);
    activeTimings.current.delete(name);

    if (duration !== null) {
      // Record in dashboard
      performanceDashboard.recordMetric({
        name,
        duration,
        category: timing.category,
        timestamp: Date.now(),
        metadata: { ...timing.metadata, ...additionalMetadata },
      });

      // Check for alerts
      performanceAlerts.checkMetrics([{
        name,
        duration,
        category: timing.category,
        timestamp: Date.now(),
        metadata: { ...timing.metadata, ...additionalMetadata },
      }]);
    }

    return duration;
  }, [enableAutoMonitoring]);

  // Record a metric directly
  const recordMetric = useCallback((
    name: string,
    duration: number,
    category: string,
    metadata?: Record<string, any>
  ) => {
    if (!enableAutoMonitoring) return;

    const metric = {
      name,
      duration,
      category,
      timestamp: Date.now(),
      metadata,
    };

    // Record in dashboard
    performanceDashboard.recordMetric(metric);

    // Check for alerts
    performanceAlerts.checkMetrics([metric]);

    // Log if it's a slow operation
    if (duration > 2000) {
      logger.warn('performance', `Slow operation recorded: ${name}`, {
        duration,
        category,
        metadata,
      });
    }
  }, [enableAutoMonitoring]);

  // Get performance report
  const getReport = useCallback(() => {
    return {
      monitor: performanceMonitor.getPerformanceSummary(),
      dashboard: performanceDashboard.generateReport(),
      alerts: performanceAlerts.getAlerts(),
      alertStats: performanceAlerts.getAlertStats(),
    };
  }, []);

  // Get current alerts
  const getAlerts = useCallback(() => {
    return performanceAlerts.getAlerts();
  }, []);

  // Clear all performance data
  const clearData = useCallback(() => {
    performanceMonitor.clearMetrics();
    performanceDashboard.clearData();
    performanceAlerts.clearAlerts();
    activeTimings.current.clear();
    
    logger.info('performance', 'Performance data cleared');
  }, []);

  // Auto-monitor component lifecycle
  useEffect(() => {
    if (!enableAutoMonitoring) return;

    const componentName = 'Component';
    startTiming(`${componentName}_mount`, 'render');

    return () => {
      endTiming(`${componentName}_mount`);
    };
  }, [enableAutoMonitoring, startTiming, endTiming]);

  // Memory tracking
  useEffect(() => {
    if (!enableAutoMonitoring || !enableMemoryTracking) return;

    const memoryCheckInterval = setInterval(() => {
      try {
        if (typeof performance !== 'undefined' && (performance as any).memory) {
          const memory = (performance as any).memory;
          const memoryUsage = memory.usedJSHeapSize || 0;
          
          recordMetric('memory_usage', 0, 'memory', {
            usedJSHeapSize: memoryUsage,
            totalJSHeapSize: memory.totalJSHeapSize,
            jsHeapSizeLimit: memory.jsHeapSizeLimit,
          });
        }
      } catch (error) {
        logger.warn('performance', 'Failed to record memory usage', error as Error);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(memoryCheckInterval);
  }, [enableAutoMonitoring, enableMemoryTracking, recordMetric]);

  return {
    startTiming,
    endTiming,
    recordMetric,
    getReport,
    getAlerts,
    clearData,
  };
};

/**
 * Hook for monitoring specific operations
 */
export const useOperationMonitoring = (operationName: string, category: string = 'operation') => {
  const { startTiming, endTiming, recordMetric } = usePerformanceMonitoring();

  const monitorOperation = useCallback(async <T>(
    operation: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> => {
    const startTime = Date.now();
    startTiming(operationName, category, metadata);

    try {
      const result = await operation();
      const duration = Date.now() - startTime;
      
      endTiming(operationName, { success: true, ...metadata });
      recordMetric(operationName, duration, category, { success: true, ...metadata });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      endTiming(operationName, { success: false, error: error instanceof Error ? error.message : String(error), ...metadata });
      recordMetric(operationName, duration, category, { success: false, error: error instanceof Error ? error.message : String(error), ...metadata });
      
      throw error;
    }
  }, [operationName, category, startTiming, endTiming, recordMetric]);

  const monitorSyncOperation = useCallback(<T>(
    operation: () => T,
    metadata?: Record<string, any>
  ): T => {
    const startTime = Date.now();
    startTiming(operationName, category, metadata);

    try {
      const result = operation();
      const duration = Date.now() - startTime;
      
      endTiming(operationName, { success: true, ...metadata });
      recordMetric(operationName, duration, category, { success: true, ...metadata });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      endTiming(operationName, { success: false, error: error instanceof Error ? error.message : String(error), ...metadata });
      recordMetric(operationName, duration, category, { success: false, error: error instanceof Error ? error.message : String(error), ...metadata });
      
      throw error;
    }
  }, [operationName, category, startTiming, endTiming, recordMetric]);

  return {
    monitorOperation,
    monitorSyncOperation,
  };
}; 