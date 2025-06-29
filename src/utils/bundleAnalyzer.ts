// src/utils/bundleAnalyzer.ts
// Bundle analysis utilities for performance monitoring

interface BundleStats {
  totalSize: number;
  jsSize: number;
  assetsSize: number;
  moduleCount: number;
  chunkCount: number;
  largestModules: { name: string; size: number }[];
  recommendations: string[];
}

interface ModuleInfo {
  name: string;
  size: number;
  type: 'js' | 'asset' | 'font' | 'image';
}

/**
 * Bundle Analyzer Utility
 * 
 * Provides insights into bundle composition and optimization opportunities
 */
export class BundleAnalyzer {
  private static instance: BundleAnalyzer;
  private bundleStats: BundleStats | null = null;

  static getInstance(): BundleAnalyzer {
    if (!BundleAnalyzer.instance) {
      BundleAnalyzer.instance = new BundleAnalyzer();
    }
    return BundleAnalyzer.instance;
  }

  /**
   * Analyze bundle composition and provide optimization recommendations
   */
  analyzeBundleComposition(): BundleStats {
    // This would typically analyze the actual bundle files
    // For now, we'll provide a mock analysis based on common patterns
    
    const mockStats: BundleStats = {
      totalSize: 5.29 * 1024 * 1024, // 5.29 MB
      jsSize: 3.8 * 1024 * 1024,     // 3.8 MB
      assetsSize: 1.49 * 1024 * 1024, // 1.49 MB
      moduleCount: 1445,
      chunkCount: 1,
      largestModules: [
        { name: '@expo/vector-icons/MaterialCommunityIcons', size: 1.15 * 1024 * 1024 },
        { name: '@expo/vector-icons/FontAwesome6_Solid', size: 424 * 1024 },
        { name: 'react-native-reanimated', size: 380 * 1024 },
        { name: 'expo-camera', size: 320 * 1024 },
        { name: 'react-native-mmkv', size: 280 * 1024 },
        { name: '@react-navigation/native', size: 240 * 1024 },
        { name: 'expo-sqlite', size: 200 * 1024 },
        { name: 'react-native-gesture-handler', size: 180 * 1024 },
      ],
      recommendations: [],
    };

    // Generate recommendations based on analysis
    mockStats.recommendations = this.generateRecommendations(mockStats);
    
    this.bundleStats = mockStats;
    return mockStats;
  }

  /**
   * Generate optimization recommendations based on bundle analysis
   */
  private generateRecommendations(stats: BundleStats): string[] {
    const recommendations: string[] = [];
    
    // Icon font optimization
    const iconFontSize = stats.largestModules
      .filter(m => m.name.includes('vector-icons'))
      .reduce((sum, m) => sum + m.size, 0);
    
    if (iconFontSize > 1024 * 1024) { // > 1MB
      recommendations.push(
        `🎯 HIGH IMPACT: Icon fonts are ${(iconFontSize / 1024 / 1024).toFixed(1)}MB. ` +
        `Consider using selective imports or custom icon sets to reduce by ~70%.`
      );
    }

    // Code splitting
    if (stats.chunkCount === 1 && stats.jsSize > 2 * 1024 * 1024) {
      recommendations.push(
        `📦 MEDIUM IMPACT: Single bundle is ${(stats.jsSize / 1024 / 1024).toFixed(1)}MB. ` +
        `Implement code splitting to reduce initial load by ~40%.`
      );
    }

    // Tree shaking
    if (stats.moduleCount > 1000) {
      recommendations.push(
        `🌳 MEDIUM IMPACT: ${stats.moduleCount} modules detected. ` +
        `Enable tree shaking and remove unused imports to reduce by ~15-25%.`
      );
    }

    // Asset optimization
    const assetRatio = stats.assetsSize / stats.totalSize;
    if (assetRatio > 0.3) {
      recommendations.push(
        `🖼️ LOW IMPACT: Assets are ${(assetRatio * 100).toFixed(1)}% of bundle. ` +
        `Consider image compression and lazy loading for additional savings.`
      );
    }

    // Performance recommendations
    if (stats.totalSize > 4 * 1024 * 1024) {
      recommendations.push(
        `⚡ PERFORMANCE: Bundle size ${(stats.totalSize / 1024 / 1024).toFixed(1)}MB ` +
        `may impact startup time. Target <3MB for optimal performance.`
      );
    }

    return recommendations;
  }

  /**
   * Get optimization impact estimates
   */
  getOptimizationImpact(): Record<string, { savings: number; effort: 'low' | 'medium' | 'high' }> {
    if (!this.bundleStats) {
      this.analyzeBundleComposition();
    }

    return {
      iconOptimization: {
        savings: 0.7, // 70% reduction in icon fonts
        effort: 'medium',
      },
      codeSplitting: {
        savings: 0.4, // 40% reduction in initial bundle
        effort: 'high',
      },
      treeshaking: {
        savings: 0.2, // 20% reduction in unused code
        effort: 'low',
      },
      assetOptimization: {
        savings: 0.15, // 15% reduction in assets
        effort: 'low',
      },
      lazyLoading: {
        savings: 0.3, // 30% reduction in initial load
        effort: 'medium',
      },
    };
  }

  /**
   * Calculate potential bundle size after optimizations
   */
  calculateOptimizedSize(optimizations: string[]): number {
    if (!this.bundleStats) {
      this.analyzeBundleComposition();
    }

    const impact = this.getOptimizationImpact();
    let totalSavings = 0;

    optimizations.forEach(opt => {
      if (impact[opt]) {
        totalSavings += impact[opt].savings;
      }
    });

    // Cap total savings at 80% (realistic maximum)
    totalSavings = Math.min(totalSavings, 0.8);

    return this.bundleStats!.totalSize * (1 - totalSavings);
  }

  /**
   * Generate optimization roadmap
   */
  generateOptimizationRoadmap(): {
    phase: string;
    optimizations: string[];
    estimatedSavings: number;
    effort: string;
    priority: 'high' | 'medium' | 'low';
  }[] {
    return [
      {
        phase: 'Phase 1: Quick Wins',
        optimizations: ['treeshaking', 'assetOptimization'],
        estimatedSavings: 0.35, // 35% savings
        effort: '1-2 days',
        priority: 'high',
      },
      {
        phase: 'Phase 2: Icon Optimization',
        optimizations: ['iconOptimization'],
        estimatedSavings: 0.7, // 70% of icon fonts
        effort: '2-3 days',
        priority: 'high',
      },
      {
        phase: 'Phase 3: Code Splitting',
        optimizations: ['codeSplitting', 'lazyLoading'],
        estimatedSavings: 0.5, // 50% of initial bundle
        effort: '3-5 days',
        priority: 'medium',
      },
    ];
  }

  /**
   * Monitor bundle size changes over time
   */
  trackBundleSize(version: string, size: number): void {
    const timestamp = Date.now();
    const sizeData = {
      version,
      size,
      timestamp,
      date: new Date().toISOString(),
    };

    // In a real implementation, this would persist to storage
    console.log('📊 Bundle size tracking:', sizeData);
    
    // Store in local storage for development
    try {
      const history = JSON.parse(localStorage.getItem('bundleSizeHistory') || '[]');
      history.push(sizeData);
      
      // Keep only last 50 entries
      if (history.length > 50) {
        history.splice(0, history.length - 50);
      }
      
      localStorage.setItem('bundleSizeHistory', JSON.stringify(history));
    } catch (error) {
      console.warn('Failed to store bundle size history:', error);
    }
  }

  /**
   * Get bundle size trends
   */
  getBundleSizeTrends(): { version: string; size: number; date: string }[] {
    try {
      return JSON.parse(localStorage.getItem('bundleSizeHistory') || '[]');
    } catch (error) {
      console.warn('Failed to retrieve bundle size history:', error);
      return [];
    }
  }

  /**
   * Generate performance report
   */
  generatePerformanceReport(): {
    currentStats: BundleStats;
    recommendations: string[];
    optimizationRoadmap: ReturnType<typeof this.generateOptimizationRoadmap>;
    potentialSavings: Record<string, number>;
  } {
    const currentStats = this.analyzeBundleComposition();
    const optimizationRoadmap = this.generateOptimizationRoadmap();
    const impact = this.getOptimizationImpact();
    
    const potentialSavings: Record<string, number> = {};
    Object.entries(impact).forEach(([key, value]) => {
      potentialSavings[key] = currentStats.totalSize * value.savings;
    });

    return {
      currentStats,
      recommendations: currentStats.recommendations,
      optimizationRoadmap,
      potentialSavings,
    };
  }

  /**
   * Log bundle analysis results
   */
  logAnalysis(): void {
    const report = this.generatePerformanceReport();
    
    console.group('📦 Bundle Analysis Report');
    console.log('Current Size:', (report.currentStats.totalSize / 1024 / 1024).toFixed(2), 'MB');
    console.log('Module Count:', report.currentStats.moduleCount);
    console.log('Largest Modules:');
    report.currentStats.largestModules.forEach(module => {
      console.log(`  - ${module.name}: ${(module.size / 1024).toFixed(1)}KB`);
    });
    console.log('Recommendations:');
    report.recommendations.forEach(rec => console.log(`  ${rec}`));
    console.groupEnd();
  }
}

// Global bundle analyzer instance
export const bundleAnalyzer = BundleAnalyzer.getInstance();
