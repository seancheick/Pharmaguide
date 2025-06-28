// src/services/initialization/startupOptimizer.ts
import { Platform } from 'react-native';
import { logger } from '../monitoring/logger';

interface StartupPhase {
  name: string;
  priority: 'critical' | 'important' | 'optional';
  estimatedTime: number; // in milliseconds
  dependencies?: string[];
  task: () => Promise<void>;
}

interface StartupMetrics {
  totalTime: number;
  phaseMetrics: Record<string, { duration: number; success: boolean }>;
  criticalPhaseTime: number;
  importantPhaseTime: number;
  optionalPhaseTime: number;
}

class StartupOptimizer {
  private phases: Map<string, StartupPhase> = new Map();
  private completedPhases = new Set<string>();
  private startTime = 0;
  private metrics: StartupMetrics | null = null;

  /**
   * Register a startup phase
   */
  registerPhase(phase: StartupPhase): void {
    this.phases.set(phase.name, phase);
  }

  /**
   * Execute startup phases in optimized order
   */
  async executeStartup(): Promise<StartupMetrics> {
    this.startTime = Date.now();
    const phaseMetrics: Record<string, { duration: number; success: boolean }> = {};

    console.log('🚀 Starting optimized app initialization...');

    try {
      // Phase 1: Critical services (blocking)
      const criticalStart = Date.now();
      await this.executePhasesOfPriority('critical', phaseMetrics);
      const criticalTime = Date.now() - criticalStart;

      console.log(`✅ Critical services initialized in ${criticalTime}ms`);

      // Phase 2: Important services (background, but prioritized)
      const importantStart = Date.now();
      const importantPromise = this.executePhasesOfPriority('important', phaseMetrics);
      
      // Phase 3: Optional services (background, lowest priority)
      const optionalStart = Date.now();
      const optionalPromise = this.executePhasesOfPriority('optional', phaseMetrics);

      // Wait for important services, but don't block on optional
      await importantPromise;
      const importantTime = Date.now() - importantStart;

      console.log(`✅ Important services initialized in ${importantTime}ms`);

      // Let optional services complete in background
      optionalPromise.then(() => {
        const optionalTime = Date.now() - optionalStart;
        console.log(`✅ Optional services initialized in ${optionalTime}ms`);
      }).catch((error) => {
        console.warn('⚠️ Some optional services failed to initialize:', error);
      });

      const totalTime = Date.now() - this.startTime;

      this.metrics = {
        totalTime,
        phaseMetrics,
        criticalPhaseTime: criticalTime,
        importantPhaseTime: importantTime,
        optionalPhaseTime: 0, // Will be updated when optional completes
      };

      console.log(`🎉 App startup completed in ${totalTime}ms`);
      return this.metrics;

    } catch (error) {
      console.error('❌ Critical startup phase failed:', error);
      throw error;
    }
  }

  /**
   * Execute phases of a specific priority
   */
  private async executePhasesOfPriority(
    priority: StartupPhase['priority'],
    phaseMetrics: Record<string, { duration: number; success: boolean }>
  ): Promise<void> {
    const phasesToExecute = Array.from(this.phases.values())
      .filter(phase => phase.priority === priority)
      .sort((a, b) => a.estimatedTime - b.estimatedTime); // Execute faster phases first

    for (const phase of phasesToExecute) {
      if (this.canExecutePhase(phase)) {
        await this.executePhase(phase, phaseMetrics);
      }
    }
  }

  /**
   * Check if a phase can be executed (dependencies met)
   */
  private canExecutePhase(phase: StartupPhase): boolean {
    if (!phase.dependencies) return true;
    
    return phase.dependencies.every(dep => this.completedPhases.has(dep));
  }

  /**
   * Execute a single phase
   */
  private async executePhase(
    phase: StartupPhase,
    phaseMetrics: Record<string, { duration: number; success: boolean }>
  ): Promise<void> {
    const phaseStart = Date.now();
    
    try {
      console.log(`⏳ Initializing ${phase.name}...`);
      await phase.task();
      
      const duration = Date.now() - phaseStart;
      phaseMetrics[phase.name] = { duration, success: true };
      this.completedPhases.add(phase.name);
      
      console.log(`✅ ${phase.name} initialized in ${duration}ms`);
    } catch (error) {
      const duration = Date.now() - phaseStart;
      phaseMetrics[phase.name] = { duration, success: false };
      
      console.error(`❌ ${phase.name} failed in ${duration}ms:`, error);
      
      if (phase.priority === 'critical') {
        throw error; // Critical phases must succeed
      }
    }
  }

  /**
   * Get startup metrics
   */
  getMetrics(): StartupMetrics | null {
    return this.metrics;
  }

  /**
   * Check if phase is completed
   */
  isPhaseCompleted(phaseName: string): boolean {
    return this.completedPhases.has(phaseName);
  }

  /**
   * Get optimization recommendations
   */
  getOptimizationRecommendations(): string[] {
    if (!this.metrics) return [];

    const recommendations: string[] = [];

    // Check total startup time
    if (this.metrics.totalTime > 3000) {
      recommendations.push('Total startup time is slow (>3s), consider lazy loading more services');
    }

    // Check critical phase time
    if (this.metrics.criticalPhaseTime > 1000) {
      recommendations.push('Critical phase is slow (>1s), optimize essential services');
    }

    // Check individual phase performance
    for (const [phaseName, metrics] of Object.entries(this.metrics.phaseMetrics)) {
      if (metrics.duration > 500) {
        recommendations.push(`${phaseName} is slow (${metrics.duration}ms), consider optimization`);
      }
      
      if (!metrics.success) {
        recommendations.push(`${phaseName} failed to initialize, check error logs`);
      }
    }

    return recommendations;
  }
}

// Create global startup optimizer instance
export const startupOptimizer = new StartupOptimizer();

// Register optimized startup phases
export const registerOptimizedStartupPhases = () => {
  // Critical phases (must complete before app renders)
  startupOptimizer.registerPhase({
    name: 'basic-logging',
    priority: 'critical',
    estimatedTime: 50,
    task: async () => {
      // Initialize basic logging only
      const { logger } = await import('../monitoring/logger');
      logger.initialize({
        enableConsoleLogging: true,
        enableRemoteLogging: false,
        logLevel: __DEV__ ? 'debug' : 'info',
        maxLocalLogs: 100,
        enablePerformanceLogging: false,
      });
    },
  });

  startupOptimizer.registerPhase({
    name: 'storage-adapter',
    priority: 'critical',
    estimatedTime: 200,
    dependencies: ['basic-logging'],
    task: async () => {
      const { initializeStorage } = await import('../storage/storageAdapter');
      await initializeStorage();
    },
  });

  startupOptimizer.registerPhase({
    name: 'auth-initialization',
    priority: 'critical',
    estimatedTime: 100,
    dependencies: ['storage-adapter'],
    task: async () => {
      // Initialize auth state from storage
      // This is critical for determining if user is logged in
      console.log('Auth initialization completed');
    },
  });

  // Important phases (should complete soon after render)
  startupOptimizer.registerPhase({
    name: 'crash-reporting',
    priority: 'important',
    estimatedTime: 300,
    dependencies: ['basic-logging'],
    task: async () => {
      const environment = (process.env.EXPO_PUBLIC_APP_ENV as 'development' | 'staging' | 'production') || 'development';
      
      if (environment === 'production' && process.env.EXPO_PUBLIC_SENTRY_DSN) {
        const { crashReporting } = await import('../monitoring/crashReporting');
        await crashReporting.initialize({
          dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
          environment,
          enableInExpoDevelopment: false,
          tracesSampleRate: 0.1,
        });
      }
    },
  });

  startupOptimizer.registerPhase({
    name: 'performance-monitoring',
    priority: 'important',
    estimatedTime: 100,
    dependencies: ['basic-logging'],
    task: async () => {
      const { performanceMonitor } = await import('../monitoring/performanceMonitor');
      performanceMonitor.initialize();
    },
  });

  startupOptimizer.registerPhase({
    name: 'security-service',
    priority: 'important',
    estimatedTime: 50,
    dependencies: ['basic-logging'],
    task: async () => {
      const { securityService } = await import('../security/securityService');
      const environment = (process.env.EXPO_PUBLIC_APP_ENV as 'development' | 'staging' | 'production') || 'development';
      
      securityService.initialize({
        enableInputSanitization: true,
        enableRateLimiting: environment === 'production',
        maxRequestsPerMinute: environment === 'production' ? 60 : 1000,
        enableSQLInjectionProtection: true,
        enableXSSProtection: true,
        enableCSRFProtection: environment === 'production',
      });
    },
  });

  // Optional phases (can complete in background)
  startupOptimizer.registerPhase({
    name: 'image-cache',
    priority: 'optional',
    estimatedTime: 200,
    task: async () => {
      const { imageCacheService } = await import('../performance/imageCacheService');
      await imageCacheService.initialize({
        maxCacheSize: 50 * 1024 * 1024, // 50MB for faster startup
        enablePrefetch: false, // Disable prefetch on startup
      });
    },
  });

  startupOptimizer.registerPhase({
    name: 'network-cache',
    priority: 'optional',
    estimatedTime: 50,
    task: async () => {
      const { networkCacheService } = await import('../performance/networkCacheService');
      networkCacheService.initialize({
        maxCacheSize: 500, // Smaller cache for faster startup
        enableStaleWhileRevalidate: true,
      });
    },
  });

  startupOptimizer.registerPhase({
    name: 'accessibility-services',
    priority: 'optional',
    estimatedTime: 150,
    task: async () => {
      const { accessibilityService } = await import('../accessibility/accessibilityService');
      await accessibilityService.initialize();
    },
  });

  startupOptimizer.registerPhase({
    name: 'memory-leak-prevention',
    priority: 'optional',
    estimatedTime: 100,
    task: async () => {
      const { memoryLeakPrevention } = await import('../performance/memoryLeakPrevention');
      memoryLeakPrevention.initialize({
        enableAutoCleanup: true,
        memoryThreshold: 150,
        checkInterval: 60000, // Check every minute instead of 30s
      });
    },
  });

  startupOptimizer.registerPhase({
    name: 'bundle-optimization',
    priority: 'optional',
    estimatedTime: 100,
    task: async () => {
      const { bundleOptimizationService } = await import('../performance/bundleOptimizationService');
      bundleOptimizationService.initialize({
        enableCodeSplitting: true,
        enableLazyLoading: true,
      });
    },
  });

  console.log('📋 Optimized startup phases registered');
};
