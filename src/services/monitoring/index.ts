// src/services/monitoring/index.ts
export { crashReporting } from './crashReporting';
export { performanceMonitor } from './performanceMonitor';
export { logger } from './logger';

export type { CustomError, UserContext, CrashReportingConfig } from './crashReporting';
export type { PerformanceMetric, MemoryMetric, NetworkMetric } from './performanceMonitor';
export type { LogLevel, LogCategory, LogEntry, LoggerConfig } from './logger';

// Initialize monitoring services
import { crashReporting } from './crashReporting';
import { performanceMonitor } from './performanceMonitor';
import { logger } from './logger';
import { securityService } from '../security/securityService';

/**
 * Initialize all monitoring services
 */
export const initializeMonitoring = async (config: {
  environment: 'development' | 'staging' | 'production';
  sentryDsn?: string;
  enableCrashReporting?: boolean;
  enablePerformanceMonitoring?: boolean;
  enableLogging?: boolean;
  enableSecurity?: boolean;
}) => {
  try {
    // Initialize logger first
    if (config.enableLogging !== false) {
      logger.initialize({
        enableConsoleLogging: config.environment === 'development',
        enableRemoteLogging: config.environment === 'production',
        logLevel: config.environment === 'development' ? 'debug' : 'info',
        enablePerformanceLogging: config.enablePerformanceMonitoring !== false,
      });
    }

    // Initialize crash reporting
    if (config.enableCrashReporting !== false && config.sentryDsn) {
      await crashReporting.initialize({
        dsn: config.sentryDsn,
        environment: config.environment,
        enableInExpoDevelopment: false,
        tracesSampleRate: config.environment === 'production' ? 0.1 : 1.0,
        enableAutoSessionTracking: true,
      });
    }

    // Initialize performance monitoring
    if (config.enablePerformanceMonitoring !== false) {
      performanceMonitor.initialize();
    }

    // Initialize security service
    if (config.enableSecurity !== false) {
      securityService.initialize({
        enableInputSanitization: true,
        enableRateLimiting: config.environment === 'production',
        maxRequestsPerMinute: config.environment === 'production' ? 60 : 1000,
        enableSQLInjectionProtection: true,
        enableXSSProtection: true,
        enableCSRFProtection: true,
      });
    }

    logger.info('app', 'Monitoring services initialized successfully', {
      environment: config.environment,
      crashReporting: config.enableCrashReporting !== false,
      performanceMonitoring: config.enablePerformanceMonitoring !== false,
      logging: config.enableLogging !== false,
      security: config.enableSecurity !== false,
    });

    return true;
  } catch (error) {
    console.error('Failed to initialize monitoring services:', error);
    return false;
  }
};

/**
 * Set user context across all monitoring services
 */
export const setMonitoringUser = (user: {
  id: string;
  email?: string;
  isAnonymous?: boolean;
  subscriptionTier?: string;
}) => {
  crashReporting.setUser(user);
  logger.setUser(user.id);
};

/**
 * Clear user context across all monitoring services
 */
export const clearMonitoringUser = () => {
  crashReporting.clearUser();
  logger.clearUser();
};

/**
 * Get comprehensive monitoring status
 */
export const getMonitoringStatus = () => {
  return {
    crashReporting: {
      initialized: crashReporting.isInitialized(),
      currentUser: crashReporting.getCurrentUser(),
    },
    performanceMonitoring: {
      active: performanceMonitor.isActive(),
      summary: performanceMonitor.getPerformanceSummary(),
    },
    logging: {
      sessionId: logger.getSessionId(),
      recentLogs: logger.getRecentLogs(10),
    },
    security: {
      stats: securityService.getSecurityStats(),
      recentViolations: securityService.getViolations(5),
    },
  };
};
