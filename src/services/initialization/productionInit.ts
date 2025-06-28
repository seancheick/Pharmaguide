// src/services/initialization/productionInit.ts
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { initializeMonitoring, setMonitoringUser } from '../monitoring';
import { securityService } from '../security/securityService';
import { logger } from '../monitoring/logger';

interface ProductionConfig {
  environment: 'development' | 'staging' | 'production';
  sentryDsn?: string;
  enableCrashReporting: boolean;
  enablePerformanceMonitoring: boolean;
  enableSecurity: boolean;
  enableAnalytics: boolean;
  apiBaseUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
}

interface InitializationResult {
  success: boolean;
  services: {
    monitoring: boolean;
    security: boolean;
    analytics: boolean;
    database: boolean;
  };
  errors: string[];
  warnings: string[];
}

class ProductionInitializationService {
  private initialized = false;
  private config: ProductionConfig | null = null;

  /**
   * Initialize all production services
   */
  async initialize(config: ProductionConfig): Promise<InitializationResult> {
    const result: InitializationResult = {
      success: false,
      services: {
        monitoring: false,
        security: false,
        analytics: false,
        database: false,
      },
      errors: [],
      warnings: [],
    };

    try {
      this.config = config;
      
      console.log('🚀 Initializing PharmaGuide production services...');
      
      // 1. Initialize monitoring services
      try {
        const monitoringSuccess = await initializeMonitoring({
          environment: config.environment,
          sentryDsn: config.sentryDsn,
          enableCrashReporting: config.enableCrashReporting,
          enablePerformanceMonitoring: config.enablePerformanceMonitoring,
          enableLogging: true,
          enableSecurity: config.enableSecurity,
        });
        
        result.services.monitoring = monitoringSuccess;
        if (!monitoringSuccess) {
          result.warnings.push('Monitoring services failed to initialize');
        }
      } catch (error) {
        result.errors.push(`Monitoring initialization failed: ${error}`);
      }

      // 2. Initialize security service
      try {
        securityService.initialize({
          enableInputSanitization: true,
          enableRateLimiting: config.environment === 'production',
          maxRequestsPerMinute: config.environment === 'production' ? 60 : 1000,
          enableSQLInjectionProtection: true,
          enableXSSProtection: true,
          enableCSRFProtection: config.environment === 'production',
        });
        
        result.services.security = true;
        logger.info('app', 'Security service initialized');
      } catch (error) {
        result.errors.push(`Security initialization failed: ${error}`);
      }

      // 3. Set app context
      this.setAppContext();

      // 4. Validate environment
      const validationResult = this.validateEnvironment();
      if (validationResult.errors.length > 0) {
        result.errors.push(...validationResult.errors);
      }
      if (validationResult.warnings.length > 0) {
        result.warnings.push(...validationResult.warnings);
      }

      // 5. Initialize performance monitoring
      if (config.enablePerformanceMonitoring) {
        this.initializePerformanceTracking();
      }

      // 6. Set up error handling
      this.setupGlobalErrorHandling();

      // Determine overall success
      result.success = result.errors.length === 0;
      this.initialized = result.success;

      if (result.success) {
        logger.info('app', 'Production initialization completed successfully', {
          services: result.services,
          warnings: result.warnings,
        });
      } else {
        logger.error('app', 'Production initialization failed', undefined, {
          errors: result.errors,
          warnings: result.warnings,
        });
      }

      return result;
    } catch (error) {
      result.errors.push(`Critical initialization error: ${error}`);
      result.success = false;
      return result;
    }
  }

  /**
   * Set application context for monitoring
   */
  private setAppContext(): void {
    try {
      const appInfo = {
        name: Constants.expoConfig?.name || 'PharmaGuide',
        version: Constants.expoConfig?.version || '1.0.0',
        buildNumber: Constants.expoConfig?.ios?.buildNumber || 
                    Constants.expoConfig?.android?.versionCode || 'unknown',
        platform: Platform.OS,
        platformVersion: Platform.Version.toString(),
        environment: this.config?.environment || 'unknown',
      };

      logger.setContext('app', appInfo);
      logger.info('app', 'Application context set', appInfo);
    } catch (error) {
      logger.warn('app', 'Failed to set application context', { error });
    }
  }

  /**
   * Validate environment configuration
   */
  private validateEnvironment(): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!this.config) {
      errors.push('Configuration not provided');
      return { errors, warnings };
    }

    // Check required environment variables
    const requiredEnvVars = [
      'EXPO_PUBLIC_SUPABASE_URL',
      'EXPO_PUBLIC_SUPABASE_ANON_KEY',
    ];

    requiredEnvVars.forEach(envVar => {
      if (!process.env[envVar]) {
        errors.push(`Missing required environment variable: ${envVar}`);
      }
    });

    // Check production-specific requirements
    if (this.config.environment === 'production') {
      if (!this.config.sentryDsn && this.config.enableCrashReporting) {
        warnings.push('Crash reporting enabled but no Sentry DSN provided');
      }

      if (!this.config.enableSecurity) {
        warnings.push('Security features disabled in production');
      }
    }

    // Validate URLs
    try {
      new URL(this.config.supabaseUrl);
    } catch {
      errors.push('Invalid Supabase URL');
    }

    try {
      new URL(this.config.apiBaseUrl);
    } catch {
      errors.push('Invalid API base URL');
    }

    return { errors, warnings };
  }

  /**
   * Initialize performance tracking
   */
  private initializePerformanceTracking(): void {
    try {
      // Track app startup time
      const startupTime = Date.now();
      
      // Track initial render
      setTimeout(() => {
        const renderTime = Date.now() - startupTime;
        logger.info('performance', 'App startup completed', {
          startupTime: renderTime,
          platform: Platform.OS,
        });
      }, 100);

      // Track memory usage periodically
      if (Platform.OS === 'web') {
        setInterval(() => {
          if ((performance as any).memory) {
            const memory = (performance as any).memory;
            const memoryUsage = {
              used: memory.usedJSHeapSize,
              total: memory.totalJSHeapSize,
              limit: memory.jsHeapSizeLimit,
              usagePercent: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
            };

            if (memoryUsage.usagePercent > 80) {
              logger.warn('performance', 'High memory usage detected', memoryUsage);
            }
          }
        }, 60000); // Check every minute
      }
    } catch (error) {
      logger.warn('app', 'Failed to initialize performance tracking', { error });
    }
  }

  /**
   * Set up global error handling
   */
  private setupGlobalErrorHandling(): void {
    try {
      // Handle unhandled promise rejections
      if (typeof window !== 'undefined') {
        window.addEventListener('unhandledrejection', (event) => {
          logger.error('app', 'Unhandled promise rejection', event.reason, {
            promise: event.promise,
          });
        });
      }

      // Handle global errors
      if (typeof window !== 'undefined') {
        window.addEventListener('error', (event) => {
          logger.error('app', 'Global error', event.error, {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          });
        });
      }

      logger.info('app', 'Global error handling initialized');
    } catch (error) {
      logger.warn('app', 'Failed to set up global error handling', { error });
    }
  }

  /**
   * Set user context for monitoring
   */
  setUser(user: {
    id: string;
    email?: string;
    isAnonymous?: boolean;
    subscriptionTier?: string;
  }): void {
    if (!this.initialized) {
      logger.warn('app', 'Attempted to set user before initialization');
      return;
    }

    try {
      setMonitoringUser(user);
      logger.info('app', 'User context updated', {
        userId: user.id,
        isAnonymous: user.isAnonymous,
        subscriptionTier: user.subscriptionTier,
      });
    } catch (error) {
      logger.error('app', 'Failed to set user context', error);
    }
  }

  /**
   * Check if services are initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get current configuration
   */
  getConfig(): ProductionConfig | null {
    return this.config;
  }

  /**
   * Health check for all services
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: Record<string, boolean>;
    timestamp: string;
  }> {
    const services = {
      monitoring: logger.getSessionId() !== null,
      security: securityService.getSecurityStats().totalViolations >= 0,
      database: true, // TODO: Add actual database health check
      api: true, // TODO: Add actual API health check
    };

    const healthyServices = Object.values(services).filter(Boolean).length;
    const totalServices = Object.keys(services).length;
    
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyServices === totalServices) {
      status = 'healthy';
    } else if (healthyServices > totalServices / 2) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      services,
      timestamp: new Date().toISOString(),
    };
  }
}

export const productionInit = new ProductionInitializationService();

// Export types
export type { ProductionConfig, InitializationResult };
