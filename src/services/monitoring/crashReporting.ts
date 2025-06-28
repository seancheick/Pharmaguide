// src/services/monitoring/crashReporting.ts
import * as Sentry from '@sentry/react-native';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

interface CrashReportingConfig {
  dsn: string;
  environment: 'development' | 'staging' | 'production';
  enableInExpoDevelopment?: boolean;
  tracesSampleRate?: number;
  enableAutoSessionTracking?: boolean;
}

interface UserContext {
  id?: string;
  email?: string;
  isAnonymous?: boolean;
  subscriptionTier?: string;
}

interface CustomError extends Error {
  context?: Record<string, any>;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  category?: 'api' | 'ui' | 'database' | 'auth' | 'analysis' | 'navigation';
}

class CrashReportingService {
  private initialized = false;
  private config: CrashReportingConfig | null = null;

  /**
   * Initialize crash reporting service
   */
  async initialize(config: CrashReportingConfig): Promise<void> {
    try {
      this.config = config;

      // Only initialize in production or if explicitly enabled in development
      if (
        config.environment === 'production' ||
        (config.environment === 'development' && config.enableInExpoDevelopment)
      ) {
        Sentry.init({
          dsn: config.dsn,
          environment: config.environment,
          enableAutoSessionTracking: config.enableAutoSessionTracking ?? true,
          tracesSampleRate: config.tracesSampleRate ?? 0.1,
          beforeSend: this.beforeSend,
          integrations: [
            new Sentry.ReactNativeTracing({
              enableUserInteractionTracing: true,
              enableNativeFramesTracking: true,
            }),
          ],
        });

        // Set initial context
        Sentry.setContext('app', {
          name: Constants.expoConfig?.name || 'PharmaGuide',
          version: Constants.expoConfig?.version || '1.0.0',
          buildNumber: Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode || 'unknown',
          platform: Platform.OS,
          platformVersion: Platform.Version,
        });

        this.initialized = true;
        console.log('✅ Crash reporting initialized');
      } else {
        console.log('⚠️ Crash reporting disabled in development');
      }
    } catch (error) {
      console.error('❌ Failed to initialize crash reporting:', error);
    }
  }

  /**
   * Filter and modify events before sending to Sentry
   */
  private beforeSend = (event: Sentry.Event): Sentry.Event | null => {
    // Filter out development-only errors
    if (this.config?.environment === 'development') {
      // Skip certain development errors
      if (event.exception?.values?.[0]?.value?.includes('Network request failed')) {
        return null;
      }
    }

    // Remove sensitive data
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
    }

    // Sanitize breadcrumbs
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
        if (breadcrumb.data) {
          // Remove sensitive data from breadcrumbs
          const sanitized = { ...breadcrumb.data };
          delete sanitized.password;
          delete sanitized.token;
          delete sanitized.apiKey;
          breadcrumb.data = sanitized;
        }
        return breadcrumb;
      });
    }

    return event;
  };

  /**
   * Set user context for crash reports
   */
  setUser(user: UserContext): void {
    if (!this.initialized) return;

    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.isAnonymous ? 'anonymous' : user.email,
      extra: {
        isAnonymous: user.isAnonymous,
        subscriptionTier: user.subscriptionTier,
      },
    });
  }

  /**
   * Clear user context (e.g., on logout)
   */
  clearUser(): void {
    if (!this.initialized) return;
    Sentry.setUser(null);
  }

  /**
   * Add breadcrumb for debugging
   */
  addBreadcrumb(message: string, category: string, data?: Record<string, any>): void {
    if (!this.initialized) return;

    Sentry.addBreadcrumb({
      message,
      category,
      level: 'info',
      data: data ? this.sanitizeData(data) : undefined,
      timestamp: Date.now() / 1000,
    });
  }

  /**
   * Report custom error with context
   */
  reportError(error: CustomError): void {
    if (!this.initialized) {
      console.error('Crash reporting not initialized:', error);
      return;
    }

    Sentry.withScope(scope => {
      // Set error severity
      if (error.severity) {
        scope.setLevel(this.mapSeverityToSentryLevel(error.severity));
      }

      // Set error category
      if (error.category) {
        scope.setTag('category', error.category);
      }

      // Add context
      if (error.context) {
        scope.setContext('error_context', this.sanitizeData(error.context));
      }

      // Capture the error
      Sentry.captureException(error);
    });
  }

  /**
   * Report custom message with context
   */
  reportMessage(
    message: string,
    level: 'info' | 'warning' | 'error' = 'info',
    context?: Record<string, any>
  ): void {
    if (!this.initialized) {
      console.log(`Crash reporting not initialized: ${level} - ${message}`);
      return;
    }

    Sentry.withScope(scope => {
      scope.setLevel(level);
      
      if (context) {
        scope.setContext('message_context', this.sanitizeData(context));
      }

      Sentry.captureMessage(message);
    });
  }

  /**
   * Start performance transaction
   */
  startTransaction(name: string, operation: string): Sentry.Transaction | null {
    if (!this.initialized) return null;

    return Sentry.startTransaction({
      name,
      op: operation,
    });
  }

  /**
   * Set custom tag
   */
  setTag(key: string, value: string): void {
    if (!this.initialized) return;
    Sentry.setTag(key, value);
  }

  /**
   * Set custom context
   */
  setContext(key: string, context: Record<string, any>): void {
    if (!this.initialized) return;
    Sentry.setContext(key, this.sanitizeData(context));
  }

  /**
   * Map custom severity to Sentry level
   */
  private mapSeverityToSentryLevel(severity: CustomError['severity']): Sentry.SeverityLevel {
    switch (severity) {
      case 'low':
        return 'info';
      case 'medium':
        return 'warning';
      case 'high':
        return 'error';
      case 'critical':
        return 'fatal';
      default:
        return 'error';
    }
  }

  /**
   * Sanitize data to remove sensitive information
   */
  private sanitizeData(data: Record<string, any>): Record<string, any> {
    const sanitized = { ...data };
    const sensitiveKeys = ['password', 'token', 'apiKey', 'secret', 'auth', 'authorization'];
    
    for (const key of sensitiveKeys) {
      if (key in sanitized) {
        sanitized[key] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * Check if crash reporting is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get current user context
   */
  getCurrentUser(): Sentry.User | null {
    if (!this.initialized) return null;
    return Sentry.getCurrentHub().getScope()?.getUser() || null;
  }
}

export const crashReporting = new CrashReportingService();

// Export types for use in other files
export type { CustomError, UserContext, CrashReportingConfig };
