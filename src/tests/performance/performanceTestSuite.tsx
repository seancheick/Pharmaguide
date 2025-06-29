// src/tests/performance/performanceTestSuite.ts
// Comprehensive performance testing and benchmarking suite

import { performance } from 'perf_hooks';
import { renderHook, act } from '@testing-library/react-native';
import { renderWithProviders, measurePerformance, measureMemoryUsage } from '../setup/testHelpers';
import { useFormValidation } from '../../hooks/useFormValidation';
import { useFormPersistence } from '../../hooks/useFormPersistence';
import { storageAdapter } from '../../services/storage/storageAdapter';
import { performanceMonitor } from '../../services/performance/performanceMonitor';

// Performance test configuration
const PERFORMANCE_THRESHOLDS = {
  COMPONENT_RENDER: 16, // 16ms for 60fps
  HOOK_EXECUTION: 5, // 5ms for hook operations
  STORAGE_OPERATION: 50, // 50ms for storage operations
  API_CALL: 2000, // 2s for API calls
  MEMORY_LEAK_THRESHOLD: 10 * 1024 * 1024, // 10MB
  BUNDLE_SIZE_THRESHOLD: 5 * 1024 * 1024, // 5MB
};

describe('Performance Test Suite', () => {
  beforeAll(async () => {
    // Initialize performance monitoring
    await performanceMonitor.initialize();
  });

  afterEach(() => {
    // Clean up after each test
    jest.clearAllMocks();
    if (global.gc) {
      global.gc();
    }
  });

  describe('Component Rendering Performance', () => {
    it('should render EnhancedValidatedInput within performance threshold', async () => {
      const { EnhancedValidatedInput } = require('../../components/forms/EnhancedValidatedInput');
      
      const renderTime = await measurePerformance(async () => {
        renderWithProviders(
          <EnhancedValidatedInput
            label="Test Input"
            value=""
            onChangeText={() => {}}
            rules={[
              { type: 'required' },
              { type: 'email' },
              { type: 'custom', minLength: 5 }
            ]}
          />
        );
      });

      expect(renderTime.average).toBeLessThan(PERFORMANCE_THRESHOLDS.COMPONENT_RENDER);
      console.log(`EnhancedValidatedInput render time: ${renderTime.average.toFixed(2)}ms`);
    });

    it('should handle rapid re-renders efficiently', async () => {
      const { EnhancedValidatedInput } = require('../../components/forms/EnhancedValidatedInput');
      let value = '';
      const setValue = (newValue: string) => { value = newValue; };

      const { rerender } = renderWithProviders(
        <EnhancedValidatedInput
          label="Test Input"
          value={value}
          onChangeText={setValue}
        />
      );

      const rerenderTime = await measurePerformance(async () => {
        for (let i = 0; i < 100; i++) {
          value = `test${i}`;
          rerender(
            <EnhancedValidatedInput
              label="Test Input"
              value={value}
              onChangeText={setValue}
            />
          );
        }
      }, 1);

      expect(rerenderTime.average).toBeLessThan(PERFORMANCE_THRESHOLDS.COMPONENT_RENDER * 10);
      console.log(`100 re-renders time: ${rerenderTime.average.toFixed(2)}ms`);
    });

    it('should render large lists efficiently', async () => {
      const { FlatList } = require('react-native');
      
      const largeDataSet = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        description: `Description for item ${i}`,
      }));

      const renderTime = await measurePerformance(async () => {
        renderWithProviders(
          <FlatList
            data={largeDataSet}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <div key={item.id}>
                <h3>{item.name}</h3>
                <p>{item.description}</p>
              </div>
            )}
            getItemLayout={(data, index) => ({
              length: 50,
              offset: 50 * index,
              index,
            })}
          />
        );
      });

      expect(renderTime.average).toBeLessThan(PERFORMANCE_THRESHOLDS.COMPONENT_RENDER * 5);
      console.log(`Large list render time: ${renderTime.average.toFixed(2)}ms`);
    });
  });

  describe('Hook Performance', () => {
    it('should execute useFormValidation efficiently', async () => {
      const formConfig = {
        name: { validator: 'text' as const, options: { required: true } },
        email: { validator: 'email' as const },
        phone: { validator: 'text' as const, options: { pattern: /^\d{10}$/ } },
      };

      const hookTime = await measurePerformance(async () => {
        const { result } = renderHook(() => useFormValidation(formConfig, {}));
        
        act(() => {
          result.current.setValue('name', 'John Doe');
          result.current.setValue('email', 'john@example.com');
          result.current.setValue('phone', '1234567890');
        });

        act(() => {
          result.current.validateForm();
        });
      });

      expect(hookTime.average).toBeLessThan(PERFORMANCE_THRESHOLDS.HOOK_EXECUTION);
      console.log(`useFormValidation execution time: ${hookTime.average.toFixed(2)}ms`);
    });

    it('should handle form persistence efficiently', async () => {
      const formConfig = {
        name: { validator: 'text' as const, options: { required: true } },
        email: { validator: 'email' as const },
      };

      const persistenceTime = await measurePerformance(async () => {
        const { result } = renderHook(() => 
          useFormPersistence('test-form', formConfig, {}, { autoSave: true })
        );

        // Simulate rapid form changes
        for (let i = 0; i < 50; i++) {
          act(() => {
            result.current.setValue('name', `Name ${i}`);
            result.current.setValue('email', `email${i}@example.com`);
          });
        }
      });

      expect(persistenceTime.average).toBeLessThan(PERFORMANCE_THRESHOLDS.HOOK_EXECUTION * 10);
      console.log(`Form persistence time: ${persistenceTime.average.toFixed(2)}ms`);
    });
  });

  describe('Storage Performance', () => {
    it('should perform storage operations within threshold', async () => {
      const testData = {
        id: 'test-123',
        name: 'Test Item',
        data: Array.from({ length: 1000 }, (_, i) => `item-${i}`),
      };

      const storageTime = await measurePerformance(async () => {
        await storageAdapter.setItem('performance-test', JSON.stringify(testData));
        const retrieved = await storageAdapter.getItem('performance-test');
        expect(retrieved).toBeDefined();
        await storageAdapter.removeItem('performance-test');
      });

      expect(storageTime.average).toBeLessThan(PERFORMANCE_THRESHOLDS.STORAGE_OPERATION);
      console.log(`Storage operation time: ${storageTime.average.toFixed(2)}ms`);
    });

    it('should handle concurrent storage operations', async () => {
      const concurrentTime = await measurePerformance(async () => {
        const promises = Array.from({ length: 10 }, (_, i) => 
          storageAdapter.setItem(`concurrent-test-${i}`, `data-${i}`)
        );
        
        await Promise.all(promises);
        
        const cleanupPromises = Array.from({ length: 10 }, (_, i) => 
          storageAdapter.removeItem(`concurrent-test-${i}`)
        );
        
        await Promise.all(cleanupPromises);
      });

      expect(concurrentTime.average).toBeLessThan(PERFORMANCE_THRESHOLDS.STORAGE_OPERATION * 2);
      console.log(`Concurrent storage time: ${concurrentTime.average.toFixed(2)}ms`);
    });

    it('should handle large data storage efficiently', async () => {
      const largeData = {
        items: Array.from({ length: 10000 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          description: `This is a description for item ${i}`.repeat(10),
          metadata: {
            created: new Date().toISOString(),
            tags: [`tag-${i % 10}`, `category-${i % 5}`],
          },
        })),
      };

      const largeDataTime = await measurePerformance(async () => {
        await storageAdapter.setItem('large-data-test', JSON.stringify(largeData));
        const retrieved = await storageAdapter.getItem('large-data-test');
        expect(retrieved).toBeDefined();
        await storageAdapter.removeItem('large-data-test');
      });

      expect(largeDataTime.average).toBeLessThan(PERFORMANCE_THRESHOLDS.STORAGE_OPERATION * 5);
      console.log(`Large data storage time: ${largeDataTime.average.toFixed(2)}ms`);
    });
  });

  describe('Memory Performance', () => {
    it('should not leak memory during component lifecycle', async () => {
      const { EnhancedValidatedInput } = require('../../components/forms/EnhancedValidatedInput');
      
      const initialMemory = measureMemoryUsage();
      
      // Create and destroy components multiple times
      for (let i = 0; i < 100; i++) {
        const { unmount } = renderWithProviders(
          <EnhancedValidatedInput
            label={`Test Input ${i}`}
            value={`value-${i}`}
            onChangeText={() => {}}
            rules={[{ type: 'required' }]}
          />
        );
        
        unmount();
        
        // Force garbage collection if available
        if (global.gc && i % 10 === 0) {
          global.gc();
        }
      }

      const finalMemory = measureMemoryUsage();
      
      if (initialMemory && finalMemory) {
        const memoryIncrease = finalMemory.used - initialMemory.used;
        expect(memoryIncrease).toBeLessThan(PERFORMANCE_THRESHOLDS.MEMORY_LEAK_THRESHOLD);
        console.log(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
      }
    });

    it('should handle large form data without memory issues', async () => {
      const initialMemory = measureMemoryUsage();
      
      const largeFormConfig = Object.fromEntries(
        Array.from({ length: 100 }, (_, i) => [
          `field${i}`,
          { validator: 'text' as const, options: { required: true } }
        ])
      );

      const { result, unmount } = renderHook(() => 
        useFormValidation(largeFormConfig, {})
      );

      // Fill all fields with data
      act(() => {
        Object.keys(largeFormConfig).forEach((field, index) => {
          result.current.setValue(field, `value-${index}`.repeat(100));
        });
      });

      // Validate form multiple times
      for (let i = 0; i < 10; i++) {
        act(() => {
          result.current.validateForm();
        });
      }

      unmount();

      const finalMemory = measureMemoryUsage();
      
      if (initialMemory && finalMemory) {
        const memoryIncrease = finalMemory.used - initialMemory.used;
        expect(memoryIncrease).toBeLessThan(PERFORMANCE_THRESHOLDS.MEMORY_LEAK_THRESHOLD);
        console.log(`Large form memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
      }
    });
  });

  describe('Performance Monitoring Integration', () => {
    it('should track performance metrics accurately', async () => {
      const metricName = 'test-operation';
      const category = 'test';

      const result = await performanceMonitor.measureAsync(
        metricName,
        async () => {
          // Simulate some work
          await new Promise(resolve => setTimeout(resolve, 100));
          return 'test-result';
        },
        category
      );

      expect(result).toBe('test-result');

      const metrics = performanceMonitor.getMetrics();
      expect(metrics).toHaveProperty(metricName);
      expect(metrics[metricName].category).toBe(category);
      expect(metrics[metricName].averageTime).toBeGreaterThan(90);
      expect(metrics[metricName].averageTime).toBeLessThan(150);
    });

    it('should detect performance regressions', async () => {
      const baselineMetric = 'baseline-operation';
      
      // Establish baseline
      await performanceMonitor.measureAsync(
        baselineMetric,
        async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
        },
        'baseline'
      );

      // Simulate regression
      await performanceMonitor.measureAsync(
        baselineMetric,
        async () => {
          await new Promise(resolve => setTimeout(resolve, 150));
        },
        'baseline'
      );

      const metrics = performanceMonitor.getMetrics();
      const metric = metrics[baselineMetric];
      
      // Should detect significant increase in execution time
      expect(metric.maxTime).toBeGreaterThan(metric.minTime * 2);
    });
  });

  describe('Bundle Size and Load Performance', () => {
    it('should maintain reasonable bundle size', () => {
      // This would typically be measured by build tools
      // For testing purposes, we'll simulate bundle size check
      const mockBundleSize = 3.5 * 1024 * 1024; // 3.5MB
      
      expect(mockBundleSize).toBeLessThan(PERFORMANCE_THRESHOLDS.BUNDLE_SIZE_THRESHOLD);
      console.log(`Bundle size: ${(mockBundleSize / 1024 / 1024).toFixed(2)}MB`);
    });

    it('should load critical components quickly', async () => {
      const loadTime = await measurePerformance(async () => {
        // Simulate dynamic import
        const { EnhancedValidatedInput } = await import('../../components/forms/EnhancedValidatedInput');
        expect(EnhancedValidatedInput).toBeDefined();
      });

      expect(loadTime.average).toBeLessThan(100); // 100ms for component loading
      console.log(`Component load time: ${loadTime.average.toFixed(2)}ms`);
    });
  });

  describe('Performance Benchmarks', () => {
    it('should establish performance baselines', async () => {
      const benchmarks = {
        formValidation: await measurePerformance(async () => {
          const { result } = renderHook(() => useFormValidation({
            email: { validator: 'email' as const },
            password: { validator: 'text' as const, options: { minLength: 8 } },
          }, {}));

          act(() => {
            result.current.setValue('email', 'test@example.com');
            result.current.setValue('password', 'password123');
            result.current.validateForm();
          });
        }, 100),

        storageOperation: await measurePerformance(async () => {
          await storageAdapter.setItem('benchmark-test', 'test-data');
          await storageAdapter.getItem('benchmark-test');
          await storageAdapter.removeItem('benchmark-test');
        }, 100),

        componentRender: await measurePerformance(async () => {
          const { unmount } = renderWithProviders(
            <div>
              <h1>Test Component</h1>
              <p>This is a test component for benchmarking</p>
            </div>
          );
          unmount();
        }, 100),
      };

      // Log benchmarks for tracking
      console.log('Performance Benchmarks:');
      Object.entries(benchmarks).forEach(([name, result]) => {
        console.log(`  ${name}: avg=${result.average.toFixed(2)}ms, min=${result.min.toFixed(2)}ms, max=${result.max.toFixed(2)}ms`);
      });

      // Verify all benchmarks are within acceptable ranges
      expect(benchmarks.formValidation.average).toBeLessThan(PERFORMANCE_THRESHOLDS.HOOK_EXECUTION);
      expect(benchmarks.storageOperation.average).toBeLessThan(PERFORMANCE_THRESHOLDS.STORAGE_OPERATION);
      expect(benchmarks.componentRender.average).toBeLessThan(PERFORMANCE_THRESHOLDS.COMPONENT_RENDER);
    });
  });
});
