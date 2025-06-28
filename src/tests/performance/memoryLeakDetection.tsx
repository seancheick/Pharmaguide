// src/tests/performance/memoryLeakDetection.ts
// Memory leak detection and monitoring utilities

import { renderHook, act } from '@testing-library/react-native';
import { renderWithProviders } from '../setup/testHelpers';

interface MemorySnapshot {
  timestamp: number;
  used: number;
  total: number;
  external: number;
  heapUsed: number;
  heapTotal: number;
  rss: number;
}

interface LeakDetectionResult {
  hasLeak: boolean;
  memoryIncrease: number;
  percentageIncrease: number;
  snapshots: MemorySnapshot[];
  analysis: string;
}

/**
 * Memory Leak Detection Utilities
 */
export class MemoryLeakDetector {
  private snapshots: MemorySnapshot[] = [];
  private gcEnabled: boolean;

  constructor() {
    this.gcEnabled = typeof global.gc === 'function';
    if (!this.gcEnabled) {
      console.warn('Garbage collection not available. Run with --expose-gc for better memory leak detection.');
    }
  }

  /**
   * Take a memory snapshot
   */
  takeSnapshot(): MemorySnapshot {
    const memoryUsage = process.memoryUsage();
    const snapshot: MemorySnapshot = {
      timestamp: Date.now(),
      used: memoryUsage.heapUsed,
      total: memoryUsage.heapTotal,
      external: memoryUsage.external,
      heapUsed: memoryUsage.heapUsed,
      heapTotal: memoryUsage.heapTotal,
      rss: memoryUsage.rss,
    };

    this.snapshots.push(snapshot);
    return snapshot;
  }

  /**
   * Force garbage collection if available
   */
  forceGC(): void {
    if (this.gcEnabled) {
      global.gc();
    }
  }

  /**
   * Clear all snapshots
   */
  clearSnapshots(): void {
    this.snapshots = [];
  }

  /**
   * Analyze memory usage for potential leaks
   */
  analyzeLeaks(threshold: number = 10 * 1024 * 1024): LeakDetectionResult {
    if (this.snapshots.length < 2) {
      return {
        hasLeak: false,
        memoryIncrease: 0,
        percentageIncrease: 0,
        snapshots: this.snapshots,
        analysis: 'Insufficient snapshots for analysis',
      };
    }

    const firstSnapshot = this.snapshots[0];
    const lastSnapshot = this.snapshots[this.snapshots.length - 1];
    
    const memoryIncrease = lastSnapshot.used - firstSnapshot.used;
    const percentageIncrease = (memoryIncrease / firstSnapshot.used) * 100;
    
    const hasLeak = memoryIncrease > threshold;
    
    let analysis = `Memory usage increased by ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB (${percentageIncrease.toFixed(2)}%)`;
    
    if (hasLeak) {
      analysis += '. Potential memory leak detected!';
    } else {
      analysis += '. Memory usage within acceptable range.';
    }

    return {
      hasLeak,
      memoryIncrease,
      percentageIncrease,
      snapshots: this.snapshots,
      analysis,
    };
  }

  /**
   * Test component for memory leaks
   */
  async testComponentLeaks(
    componentFactory: () => React.ReactElement,
    iterations: number = 100,
    gcInterval: number = 10
  ): Promise<LeakDetectionResult> {
    this.clearSnapshots();
    this.forceGC();
    this.takeSnapshot();

    for (let i = 0; i < iterations; i++) {
      const { unmount } = renderWithProviders(componentFactory());
      unmount();

      // Force GC periodically
      if (i % gcInterval === 0) {
        this.forceGC();
        this.takeSnapshot();
      }
    }

    this.forceGC();
    this.takeSnapshot();

    return this.analyzeLeaks();
  }

  /**
   * Test hook for memory leaks
   */
  async testHookLeaks(
    hookFactory: () => any,
    iterations: number = 100,
    gcInterval: number = 10
  ): Promise<LeakDetectionResult> {
    this.clearSnapshots();
    this.forceGC();
    this.takeSnapshot();

    for (let i = 0; i < iterations; i++) {
      const { unmount } = renderHook(hookFactory);
      unmount();

      // Force GC periodically
      if (i % gcInterval === 0) {
        this.forceGC();
        this.takeSnapshot();
      }
    }

    this.forceGC();
    this.takeSnapshot();

    return this.analyzeLeaks();
  }

  /**
   * Monitor memory usage over time
   */
  async monitorMemoryUsage(
    testFunction: () => Promise<void> | void,
    duration: number = 10000,
    interval: number = 1000
  ): Promise<MemorySnapshot[]> {
    this.clearSnapshots();
    
    const startTime = Date.now();
    const monitoringInterval = setInterval(() => {
      this.takeSnapshot();
    }, interval);

    try {
      await testFunction();
      
      // Continue monitoring for the specified duration
      await new Promise(resolve => {
        setTimeout(() => {
          clearInterval(monitoringInterval);
          resolve(void 0);
        }, duration - (Date.now() - startTime));
      });
    } catch (error) {
      clearInterval(monitoringInterval);
      throw error;
    }

    return this.snapshots;
  }

  /**
   * Generate memory usage report
   */
  generateReport(): string {
    if (this.snapshots.length === 0) {
      return 'No memory snapshots available';
    }

    const analysis = this.analyzeLeaks();
    let report = `Memory Usage Report\n`;
    report += `==================\n\n`;
    report += `Analysis: ${analysis.analysis}\n`;
    report += `Memory Increase: ${(analysis.memoryIncrease / 1024 / 1024).toFixed(2)}MB\n`;
    report += `Percentage Increase: ${analysis.percentageIncrease.toFixed(2)}%\n`;
    report += `Snapshots Taken: ${this.snapshots.length}\n\n`;

    report += `Detailed Snapshots:\n`;
    this.snapshots.forEach((snapshot, index) => {
      const time = new Date(snapshot.timestamp).toISOString();
      const heapMB = (snapshot.heapUsed / 1024 / 1024).toFixed(2);
      const totalMB = (snapshot.heapTotal / 1024 / 1024).toFixed(2);
      report += `${index + 1}. ${time} - Heap: ${heapMB}MB / ${totalMB}MB\n`;
    });

    return report;
  }
}

// Memory leak detection tests
describe('Memory Leak Detection', () => {
  let detector: MemoryLeakDetector;

  beforeEach(() => {
    detector = new MemoryLeakDetector();
  });

  afterEach(() => {
    detector.clearSnapshots();
  });

  describe('Component Memory Leaks', () => {
    it('should detect memory leaks in EnhancedValidatedInput', async () => {
      const { EnhancedValidatedInput } = require('../../components/forms/EnhancedValidatedInput');
      
      const result = await detector.testComponentLeaks(
        () => (
          <EnhancedValidatedInput
            label="Test Input"
            value="test value"
            onChangeText={() => {}}
            rules={[
              { type: 'required' },
              { type: 'email' },
            ]}
          />
        ),
        50, // 50 iterations
        5   // GC every 5 iterations
      );

      console.log(result.analysis);
      expect(result.hasLeak).toBe(false);
      
      if (result.hasLeak) {
        console.warn('Memory leak detected in EnhancedValidatedInput:');
        console.warn(detector.generateReport());
      }
    });

    it('should detect memory leaks in form components with complex state', async () => {
      const { EnhancedForm } = require('../../components/forms/EnhancedForm');
      
      const result = await detector.testComponentLeaks(
        () => (
          <EnhancedForm
            config={{
              formId: 'test-form',
              fields: {
                name: { validator: 'text', options: { required: true } },
                email: { validator: 'email' },
                phone: { validator: 'text', options: { pattern: /^\d{10}$/ } },
              },
              options: {
                autoSave: true,
                validateOnChange: true,
              },
            }}
            onSubmit={async () => {}}
          >
            {() => <div>Test Form</div>}
          </EnhancedForm>
        ),
        30,
        3
      );

      console.log(result.analysis);
      expect(result.hasLeak).toBe(false);
    });
  });

  describe('Hook Memory Leaks', () => {
    it('should detect memory leaks in useFormValidation', async () => {
      const { useFormValidation } = require('../../hooks/useFormValidation');
      
      const result = await detector.testHookLeaks(
        () => useFormValidation({
          name: { validator: 'text', options: { required: true } },
          email: { validator: 'email' },
          description: { validator: 'text', options: { maxLength: 500 } },
        }, {}),
        50,
        5
      );

      console.log(result.analysis);
      expect(result.hasLeak).toBe(false);
    });

    it('should detect memory leaks in useFormPersistence', async () => {
      const { useFormPersistence } = require('../../hooks/useFormPersistence');
      
      const result = await detector.testHookLeaks(
        () => useFormPersistence(
          'test-form',
          {
            name: { validator: 'text', options: { required: true } },
            email: { validator: 'email' },
          },
          {},
          { autoSave: true, autoSaveDelay: 100 }
        ),
        30,
        3
      );

      console.log(result.analysis);
      expect(result.hasLeak).toBe(false);
    });
  });

  describe('Service Memory Leaks', () => {
    it('should detect memory leaks in storage operations', async () => {
      const { storageAdapter } = require('../../services/storage/storageAdapter');
      
      const snapshots = await detector.monitorMemoryUsage(async () => {
        for (let i = 0; i < 100; i++) {
          await storageAdapter.setItem(`test-key-${i}`, `test-value-${i}`);
          await storageAdapter.getItem(`test-key-${i}`);
          await storageAdapter.removeItem(`test-key-${i}`);
        }
      }, 5000, 500);

      const analysis = detector.analyzeLeaks();
      console.log(analysis.analysis);
      expect(analysis.hasLeak).toBe(false);
    });

    it('should detect memory leaks in navigation state management', async () => {
      const { navigationStateManager } = require('../../services/navigation/navigationStateManager');
      
      const snapshots = await detector.monitorMemoryUsage(async () => {
        for (let i = 0; i < 50; i++) {
          const mockState = {
            index: 0,
            routes: [{ name: `Screen${i}`, key: `screen-${i}` }],
          };
          
          await navigationStateManager.saveNavigationState(mockState);
          await navigationStateManager.restoreNavigationState();
        }
      }, 3000, 300);

      const analysis = detector.analyzeLeaks();
      console.log(analysis.analysis);
      expect(analysis.hasLeak).toBe(false);
    });
  });

  describe('Long-Running Operations', () => {
    it('should monitor memory during extended form usage', async () => {
      const { useFormValidation } = require('../../hooks/useFormValidation');
      
      const snapshots = await detector.monitorMemoryUsage(async () => {
        const { result, unmount } = renderHook(() => 
          useFormValidation({
            field1: { validator: 'text', options: { required: true } },
            field2: { validator: 'email' },
            field3: { validator: 'text', options: { minLength: 5 } },
          }, {})
        );

        // Simulate extended form usage
        for (let i = 0; i < 200; i++) {
          act(() => {
            result.current.setValue('field1', `value-${i}`);
            result.current.setValue('field2', `email${i}@example.com`);
            result.current.setValue('field3', `description-${i}`);
            result.current.validateForm();
          });
          
          // Small delay to simulate real usage
          await new Promise(resolve => setTimeout(resolve, 10));
        }

        unmount();
      }, 10000, 1000);

      const analysis = detector.analyzeLeaks();
      console.log(`Extended form usage: ${analysis.analysis}`);
      expect(analysis.hasLeak).toBe(false);
    });
  });
});
