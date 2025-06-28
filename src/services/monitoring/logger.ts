// src/services/monitoring/logger.ts
import { Platform } from 'react-native';
import { crashReporting } from './crashReporting';
import { performanceMonitor } from './performanceMonitor';

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';
type LogCategory = 'app' | 'auth' | 'api' | 'database' | 'ui' | 'analysis' | 'navigation' | 'performance';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  context?: Record<string, any>;
  error?: Error;
  userId?: string;
  sessionId?: string;
}

interface LoggerConfig {
  enableConsoleLogging: boolean;
  enableRemoteLogging: boolean;
  logLevel: LogLevel;
  maxLocalLogs: number;
  enablePerformanceLogging: boolean;
}

class LoggerService {
  private config: LoggerConfig = {
    enableConsoleLogging: true,
    enableRemoteLogging: false,
    logLevel: 'info',
    maxLocalLogs: 1000,
    enablePerformanceLogging: true,
  };

  private logs: LogEntry[] = [];
  private sessionId: string;
  private userId?: string;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  /**
   * Initialize logger with configuration
   */
  initialize(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Set log level based on environment
    if (__DEV__) {
      this.config.logLevel = 'debug';
      this.config.enableConsoleLogging = true;
    } else {
      this.config.logLevel = 'info';
      this.config.enableRemoteLogging = true;
    }

    this.info('logger', 'Logger initialized', { config: this.config });
  }

  /**
   * Set current user for logging context
   */
  setUser(userId: string): void {
    this.userId = userId;
    this.info('logger', 'User context set', { userId });
  }

  /**
   * Clear user context
   */
  clearUser(): void {
    this.userId = undefined;
    this.info('logger', 'User context cleared');
  }

  /**
   * Debug level logging
   */
  debug(category: LogCategory, message: string, context?: Record<string, any>): void {
    this.log('debug', category, message, context);
  }

  /**
   * Info level logging
   */
  info(category: LogCategory, message: string, context?: Record<string, any>): void {
    this.log('info', category, message, context);
  }

  /**
   * Warning level logging
   */
  warn(category: LogCategory, message: string, context?: Record<string, any>): void {
    this.log('warn', category, message, context);
  }

  /**
   * Error level logging
   */
  error(category: LogCategory, message: string, error?: Error, context?: Record<string, any>): void {
    this.log('error', category, message, context, error);
  }

  /**
   * Fatal level logging
   */
  fatal(category: LogCategory, message: string, error?: Error, context?: Record<string, any>): void {
    this.log('fatal', category, message, context, error);
  }

  /**
   * Log API requests and responses
   */
  logApiRequest(
    method: string,
    url: string,
    status: number,
    duration: number,
    requestSize?: number,
    responseSize?: number
  ): void {
    const context = {
      method,
      url: this.sanitizeUrl(url),
      status,
      duration,
      requestSize,
      responseSize,
    };

    if (status >= 400) {
      this.warn('api', `API request failed: ${method} ${url}`, context);
    } else if (duration > 3000) {
      this.warn('api', `Slow API request: ${method} ${url}`, context);
    } else {
      this.debug('api', `API request: ${method} ${url}`, context);
    }

    // Record network performance
    if (this.config.enablePerformanceLogging) {
      performanceMonitor.recordNetworkRequest(
        url,
        method,
        Date.now() - duration,
        Date.now(),
        status,
        responseSize
      );
    }
  }

  /**
   * Log user interactions
   */
  logUserInteraction(action: string, screen: string, context?: Record<string, any>): void {
    this.info('ui', `User interaction: ${action}`, {
      screen,
      action,
      ...context,
    });
  }

  /**
   * Log navigation events
   */
  logNavigation(from: string, to: string, params?: Record<string, any>): void {
    this.info('navigation', `Navigation: ${from} → ${to}`, {
      from,
      to,
      params: params ? this.sanitizeParams(params) : undefined,
    });
  }

  /**
   * Log analysis operations
   */
  logAnalysis(
    type: 'supplement' | 'interaction' | 'ai',
    duration: number,
    success: boolean,
    context?: Record<string, any>
  ): void {
    const message = `${type} analysis ${success ? 'completed' : 'failed'}`;
    const logContext = {
      type,
      duration,
      success,
      ...context,
    };

    if (success) {
      this.info('analysis', message, logContext);
    } else {
      this.error('analysis', message, undefined, logContext);
    }
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    category: LogCategory,
    message: string,
    context?: Record<string, any>,
    error?: Error
  ): void {
    // Check if log level is enabled
    if (!this.isLevelEnabled(level)) {
      return;
    }

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      context: context ? this.sanitizeContext(context) : undefined,
      error,
      userId: this.userId,
      sessionId: this.sessionId,
    };

    // Store log locally
    this.logs.push(logEntry);
    this.trimLogs();

    // Console logging
    if (this.config.enableConsoleLogging) {
      this.logToConsole(logEntry);
    }

    // Remote logging
    if (this.config.enableRemoteLogging) {
      this.logToRemote(logEntry);
    }
  }

  /**
   * Check if log level is enabled
   */
  private isLevelEnabled(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error', 'fatal'];
    const currentLevelIndex = levels.indexOf(this.config.logLevel);
    const logLevelIndex = levels.indexOf(level);
    return logLevelIndex >= currentLevelIndex;
  }

  /**
   * Log to console with formatting
   */
  private logToConsole(entry: LogEntry): void {
    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.category}]`;
    const message = `${prefix} ${entry.message}`;

    switch (entry.level) {
      case 'debug':
        console.debug(message, entry.context);
        break;
      case 'info':
        console.info(message, entry.context);
        break;
      case 'warn':
        console.warn(message, entry.context);
        break;
      case 'error':
      case 'fatal':
        console.error(message, entry.error || entry.context);
        break;
    }
  }

  /**
   * Log to remote service (Sentry)
   */
  private logToRemote(entry: LogEntry): void {
    if (!crashReporting.isInitialized()) return;

    // Add breadcrumb for all logs
    crashReporting.addBreadcrumb(entry.message, entry.category, entry.context);

    // Report errors and warnings to crash reporting
    if (entry.level === 'error' || entry.level === 'fatal') {
      if (entry.error) {
        crashReporting.reportError({
          ...entry.error,
          context: entry.context,
          severity: entry.level === 'fatal' ? 'critical' : 'high',
          category: this.mapCategoryToErrorCategory(entry.category),
        });
      } else {
        crashReporting.reportMessage(entry.message, 'error', entry.context);
      }
    } else if (entry.level === 'warn') {
      crashReporting.reportMessage(entry.message, 'warning', entry.context);
    }
  }

  /**
   * Map log category to error category
   */
  private mapCategoryToErrorCategory(category: LogCategory): 'api' | 'ui' | 'database' | 'auth' | 'analysis' | 'navigation' {
    switch (category) {
      case 'app':
      case 'ui':
        return 'ui';
      case 'performance':
      case 'api':
        return 'api';
      default:
        return category as any;
    }
  }

  /**
   * Sanitize URL to remove sensitive information
   */
  private sanitizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      // Remove sensitive query parameters
      const sensitiveParams = ['token', 'key', 'secret', 'password', 'auth'];
      sensitiveParams.forEach(param => {
        if (urlObj.searchParams.has(param)) {
          urlObj.searchParams.set(param, '[REDACTED]');
        }
      });
      return urlObj.toString();
    } catch {
      return url;
    }
  }

  /**
   * Sanitize navigation parameters
   */
  private sanitizeParams(params: Record<string, any>): Record<string, any> {
    const sanitized = { ...params };
    const sensitiveKeys = ['password', 'token', 'secret', 'auth'];
    
    sensitiveKeys.forEach(key => {
      if (key in sanitized) {
        sanitized[key] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  /**
   * Sanitize context data
   */
  private sanitizeContext(context: Record<string, any>): Record<string, any> {
    return this.sanitizeParams(context);
  }

  /**
   * Trim logs to max size
   */
  private trimLogs(): void {
    if (this.logs.length > this.config.maxLocalLogs) {
      this.logs = this.logs.slice(-this.config.maxLocalLogs);
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `${Platform.OS}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get recent logs
   */
  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * Get logs by category
   */
  getLogsByCategory(category: LogCategory, count: number = 50): LogEntry[] {
    return this.logs
      .filter(log => log.category === category)
      .slice(-count);
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
    this.info('logger', 'Logs cleared');
  }

  /**
   * Get current session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }
}

export const logger = new LoggerService();

// Export types
export type { LogLevel, LogCategory, LogEntry, LoggerConfig };
