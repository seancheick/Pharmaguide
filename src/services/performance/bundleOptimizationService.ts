// src/services/performance/bundleOptimizationService.ts
import { Platform } from 'react-native';
import { logger } from '../monitoring/logger';
import { performanceMonitor } from '../monitoring/performanceMonitor';

interface BundleMetrics {
  totalSize: number;
  jsSize: number;
  assetsSize: number;
  loadTime: number;
  moduleCount: number;
  duplicateModules: string[];
}

interface OptimizationConfig {
  enableCodeSplitting: boolean;
  enableTreeShaking: boolean;
  enableAssetOptimization: boolean;
  enableLazyLoading: boolean;
  chunkSizeThreshold: number; // in KB
}

class BundleOptimizationService {
  private config: OptimizationConfig = {
    enableCodeSplitting: true,
    enableTreeShaking: true,
    enableAssetOptimization: true,
    enableLazyLoading: true,
    chunkSizeThreshold: 250, // 250KB
  };

  private loadedModules = new Set<string>();
  private lazyModules = new Map<string, () => Promise<any>>();
  private bundleMetrics: BundleMetrics | null = null;

  /**
   * Initialize bundle optimization service
   */
  initialize(config?: Partial<OptimizationConfig>): void {
    if (config) {
      this.config = { ...this.config, ...config };
    }

    // Start tracking bundle metrics
    this.trackBundleMetrics();

    // Set up lazy loading for heavy modules
    this.setupLazyModules();

    logger.info('performance', 'Bundle optimization service initialized', {
      config: this.config,
      platform: Platform.OS,
    });
  }

  /**
   * Register a module for lazy loading
   */
  registerLazyModule(name: string, loader: () => Promise<any>): void {
    this.lazyModules.set(name, loader);
    logger.debug('performance', 'Lazy module registered', { name });
  }

  /**
   * Load a module lazily
   */
  async loadModule<T = any>(name: string): Promise<T> {
    if (this.loadedModules.has(name)) {
      // Module already loaded, return from cache
      return require(name);
    }

    const loader = this.lazyModules.get(name);
    if (!loader) {
      throw new Error(`Lazy module '${name}' not registered`);
    }

    performanceMonitor.startTiming(`lazy_load_${name}`, 'render', { module: name });

    try {
      const module = await loader();
      this.loadedModules.add(name);
      
      performanceMonitor.endTiming(`lazy_load_${name}`, { success: true });
      logger.debug('performance', 'Lazy module loaded', { name });
      
      return module;
    } catch (error) {
      performanceMonitor.endTiming(`lazy_load_${name}`, { error: true });
      logger.error('performance', 'Lazy module load failed', error, { name });
      throw error;
    }
  }

  /**
   * Preload critical modules
   */
  async preloadCriticalModules(moduleNames: string[]): Promise<void> {
    logger.info('performance', 'Preloading critical modules', { modules: moduleNames });

    const preloadPromises = moduleNames.map(async (name) => {
      try {
        await this.loadModule(name);
      } catch (error) {
        logger.warn('performance', 'Critical module preload failed', { name, error });
      }
    });

    await Promise.allSettled(preloadPromises);
  }

  /**
   * Set up lazy loading for heavy modules
   */
  private setupLazyModules(): void {
    // Register common heavy modules for lazy loading
    this.registerLazyModule('camera', () => import('expo-camera'));
    this.registerLazyModule('barcode-scanner', () => import('expo-barcode-scanner'));
    this.registerLazyModule('image-picker', () => import('expo-image-picker'));
    this.registerLazyModule('file-system', () => import('expo-file-system'));
    this.registerLazyModule('notifications', () => import('expo-notifications'));
    
    // Register AI analysis modules
    this.registerLazyModule('ai-service', () => import('../ai/aiService'));
    this.registerLazyModule('analysis-engine', () => import('../analysis/supplementAnalyzer'));
    
    // Register chart libraries
    this.registerLazyModule('charts', () => import('react-native-chart-kit'));
    
    logger.debug('performance', 'Lazy modules setup complete', {
      count: this.lazyModules.size,
    });
  }

  /**
   * Track bundle metrics
   */
  private trackBundleMetrics(): void {
    const startTime = Date.now();

    // Simulate bundle analysis (in a real app, this would use actual bundle analyzer data)
    setTimeout(() => {
      const loadTime = Date.now() - startTime;
      
      this.bundleMetrics = {
        totalSize: this.estimateBundleSize(),
        jsSize: this.estimateJSSize(),
        assetsSize: this.estimateAssetsSize(),
        loadTime,
        moduleCount: this.loadedModules.size,
        duplicateModules: this.findDuplicateModules(),
      };

      logger.info('performance', 'Bundle metrics collected', this.bundleMetrics);

      // Check for optimization opportunities
      this.analyzeOptimizationOpportunities();
    }, 1000);
  }

  /**
   * Estimate bundle size (simplified)
   */
  private estimateBundleSize(): number {
    // This is a simplified estimation
    // In a real implementation, you'd use actual bundle analyzer data
    const baseSize = Platform.OS === 'web' ? 2000 : 1500; // KB
    const moduleSize = this.loadedModules.size * 50; // 50KB per module estimate
    return baseSize + moduleSize;
  }

  /**
   * Estimate JavaScript bundle size
   */
  private estimateJSSize(): number {
    return this.estimateBundleSize() * 0.7; // Assume 70% is JS
  }

  /**
   * Estimate assets size
   */
  private estimateAssetsSize(): number {
    return this.estimateBundleSize() * 0.3; // Assume 30% is assets
  }

  /**
   * Find duplicate modules (simplified)
   */
  private findDuplicateModules(): string[] {
    // This is a simplified implementation
    // In a real app, you'd analyze the actual bundle
    const commonDuplicates = [
      'lodash',
      'moment',
      'react',
      'react-native',
    ];

    return commonDuplicates.filter(module => {
      // Check if module might be duplicated
      return this.loadedModules.has(module);
    });
  }

  /**
   * Analyze optimization opportunities
   */
  private analyzeOptimizationOpportunities(): void {
    if (!this.bundleMetrics) return;

    const opportunities: string[] = [];

    // Check bundle size
    if (this.bundleMetrics.totalSize > this.config.chunkSizeThreshold * 10) {
      opportunities.push('Bundle size is large, consider code splitting');
    }

    // Check load time
    if (this.bundleMetrics.loadTime > 3000) {
      opportunities.push('Bundle load time is slow, consider lazy loading');
    }

    // Check duplicate modules
    if (this.bundleMetrics.duplicateModules.length > 0) {
      opportunities.push(`Duplicate modules detected: ${this.bundleMetrics.duplicateModules.join(', ')}`);
    }

    // Check module count
    if (this.bundleMetrics.moduleCount > 100) {
      opportunities.push('High module count, consider tree shaking');
    }

    if (opportunities.length > 0) {
      logger.warn('performance', 'Bundle optimization opportunities found', {
        opportunities,
        metrics: this.bundleMetrics,
      });
    } else {
      logger.info('performance', 'Bundle is well optimized', {
        metrics: this.bundleMetrics,
      });
    }
  }

  /**
   * Get optimization recommendations
   */
  getOptimizationRecommendations(): {
    recommendations: string[];
    metrics: BundleMetrics | null;
    score: number;
  } {
    const recommendations: string[] = [];
    let score = 100;

    if (!this.bundleMetrics) {
      return {
        recommendations: ['Bundle metrics not available'],
        metrics: null,
        score: 0,
      };
    }

    // Size recommendations
    if (this.bundleMetrics.totalSize > 5000) {
      recommendations.push('Consider implementing code splitting to reduce initial bundle size');
      score -= 20;
    }

    if (this.bundleMetrics.totalSize > 10000) {
      recommendations.push('Bundle size is very large, implement aggressive lazy loading');
      score -= 30;
    }

    // Load time recommendations
    if (this.bundleMetrics.loadTime > 2000) {
      recommendations.push('Optimize bundle loading with preloading strategies');
      score -= 15;
    }

    if (this.bundleMetrics.loadTime > 5000) {
      recommendations.push('Bundle load time is critical, implement progressive loading');
      score -= 25;
    }

    // Module recommendations
    if (this.bundleMetrics.duplicateModules.length > 0) {
      recommendations.push('Remove duplicate modules to reduce bundle size');
      score -= 10 * this.bundleMetrics.duplicateModules.length;
    }

    if (this.bundleMetrics.moduleCount > 150) {
      recommendations.push('High module count detected, enable tree shaking');
      score -= 10;
    }

    // Platform-specific recommendations
    if (Platform.OS === 'web') {
      recommendations.push('Consider implementing service worker for better caching');
      if (this.bundleMetrics.totalSize > 3000) {
        recommendations.push('Use dynamic imports for route-based code splitting');
      }
    }

    return {
      recommendations,
      metrics: this.bundleMetrics,
      score: Math.max(0, score),
    };
  }

  /**
   * Get current bundle metrics
   */
  getBundleMetrics(): BundleMetrics | null {
    return this.bundleMetrics;
  }

  /**
   * Get loaded modules count
   */
  getLoadedModulesCount(): number {
    return this.loadedModules.size;
  }

  /**
   * Check if module is loaded
   */
  isModuleLoaded(name: string): boolean {
    return this.loadedModules.has(name);
  }

  /**
   * Get lazy modules list
   */
  getLazyModules(): string[] {
    return Array.from(this.lazyModules.keys());
  }
}

export const bundleOptimizationService = new BundleOptimizationService();

// Export types
export type { BundleMetrics, OptimizationConfig };
