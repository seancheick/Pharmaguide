// src/tests/config/testConfig.ts
import { logger } from '../../services/monitoring/logger';

export interface TestConfig {
  environment: 'test' | 'development' | 'staging';
  enableMocking: boolean;
  enablePerformanceTesting: boolean;
  enableE2ETesting: boolean;
  testTimeout: number;
  retryAttempts: number;
  coverageThreshold: {
    statements: number;
    branches: number;
    functions: number;
    lines: number;
  };
}

export const defaultTestConfig: TestConfig = {
  environment: 'test',
  enableMocking: true,
  enablePerformanceTesting: false,
  enableE2ETesting: false,
  testTimeout: 10000,
  retryAttempts: 2,
  coverageThreshold: {
    statements: 80,
    branches: 70,
    functions: 80,
    lines: 80,
  },
};

/**
 * Initialize test environment
 */
export const initializeTestEnvironment = (config: Partial<TestConfig> = {}) => {
  const testConfig = { ...defaultTestConfig, ...config };

  // Configure logger for testing
  logger.initialize({
    enableConsoleLogging: false,
    enableRemoteLogging: false,
    logLevel: 'error',
    maxLocalLogs: 100,
    enablePerformanceLogging: false,
  });

  // Set global test timeout
  jest.setTimeout(testConfig.testTimeout);

  // Configure test environment variables
  process.env.NODE_ENV = 'test';
  process.env.EXPO_PUBLIC_APP_ENV = 'test';

  return testConfig;
};

/**
 * Test utilities for common testing patterns
 */
export const testUtils = {
  /**
   * Wait for a condition to be true
   */
  waitFor: async (
    condition: () => boolean | Promise<boolean>,
    timeout: number = 5000,
    interval: number = 100
  ): Promise<void> => {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    throw new Error(`Condition not met within ${timeout}ms`);
  },

  /**
   * Create a mock function with type safety
   */
  createMockFunction: <T extends (...args: any[]) => any>(
    implementation?: T
  ): jest.MockedFunction<T> => {
    return jest.fn(implementation) as jest.MockedFunction<T>;
  },

  /**
   * Generate test data
   */
  generateTestData: {
    user: (overrides?: Partial<any>) => ({
      id: 'test-user-123',
      email: 'test@example.com',
      isAnonymous: false,
      createdAt: new Date().toISOString(),
      ...overrides,
    }),

    product: (overrides?: Partial<any>) => ({
      id: 'test-product-123',
      name: 'Test Supplement',
      brand: 'Test Brand',
      category: 'specialty' as const,
      barcode: '1234567890123',
      ingredients: [
        {
          name: 'Vitamin D3',
          amount: 1000,
          unit: 'IU',
          form: 'cholecalciferol' as const,
          bioavailability: 'high' as const,
          evidenceLevel: 'strong' as const,
          category: 'active' as const,
        },
      ],
      servingSize: '1 capsule',
      servingsPerContainer: 60,
      verified: true,
      thirdPartyTested: true,
      certifications: ['NSF', 'USP'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides,
    }),

    stackItem: (overrides?: Partial<any>) => ({
      id: 'test-stack-item-123',
      userId: 'test-user-123',
      productId: 'test-product-123',
      name: 'Test Supplement',
      brand: 'Test Brand',
      type: 'supplement' as const,
      dosage: '1000 IU',
      frequency: 'daily',
      timeOfDay: 'morning',
      withFood: true,
      notes: 'Test notes',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides,
    }),

    analysis: (overrides?: Partial<any>) => ({
      overallScore: 85,
      categoryScores: {
        ingredients: 90,
        bioavailability: 85,
        dosage: 80,
        purity: 90,
        value: 75,
      },
      strengths: [
        {
          point: 'High quality ingredients',
          detail: 'Contains premium forms of nutrients',
          importance: 'high' as const,
          category: 'quality' as const,
        },
      ],
      weaknesses: [],
      recommendations: {
        goodFor: ['Bone health', 'Immune support'],
        avoidIf: ['Kidney stones', 'Hypercalcemia'],
      },
      aiReasoning: 'This supplement provides excellent bioavailable forms of key nutrients.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides,
    }),
  },

  /**
   * Performance testing utilities
   */
  performance: {
    measureExecutionTime: async <T>(
      fn: () => Promise<T> | T,
      label?: string
    ): Promise<{ result: T; duration: number }> => {
      const startTime = Date.now();
      const result = await fn();
      const duration = Date.now() - startTime;
      
      if (label) {
        console.log(`${label}: ${duration}ms`);
      }
      
      return { result, duration };
    },

    expectPerformance: (duration: number, maxDuration: number, operation: string) => {
      if (duration > maxDuration) {
        throw new Error(
          `Performance test failed: ${operation} took ${duration}ms, expected < ${maxDuration}ms`
        );
      }
    },
  },

  /**
   * Async testing utilities
   */
  async: {
    flushPromises: () => new Promise(resolve => setImmediate(resolve)),
    
    expectEventually: async <T>(
      getValue: () => T,
      expectedValue: T,
      timeout: number = 1000
    ): Promise<void> => {
      await testUtils.waitFor(
        () => getValue() === expectedValue,
        timeout
      );
    },
  },

  /**
   * Mock data persistence
   */
  mockStorage: {
    data: new Map<string, any>(),
    
    clear: () => {
      testUtils.mockStorage.data.clear();
    },
    
    set: (key: string, value: any) => {
      testUtils.mockStorage.data.set(key, JSON.stringify(value));
    },
    
    get: (key: string) => {
      const value = testUtils.mockStorage.data.get(key);
      return value ? JSON.parse(value) : null;
    },
    
    remove: (key: string) => {
      testUtils.mockStorage.data.delete(key);
    },
  },
};

/**
 * Test environment cleanup
 */
export const cleanupTestEnvironment = () => {
  // Clear all mocks
  jest.clearAllMocks();
  jest.restoreAllMocks();
  
  // Clear mock storage
  testUtils.mockStorage.clear();
  
  // Clear any timers
  jest.clearAllTimers();
  
  // Reset modules
  jest.resetModules();
};

/**
 * Custom matchers for testing
 */
export const customMatchers = {
  toBeWithinRange: (received: number, floor: number, ceiling: number) => {
    const pass = received >= floor && received <= ceiling;
    return {
      message: () =>
        `expected ${received} ${pass ? 'not ' : ''}to be within range ${floor} - ${ceiling}`,
      pass,
    };
  },

  toHaveValidStructure: (received: any, expectedKeys: string[]) => {
    const receivedKeys = Object.keys(received);
    const missingKeys = expectedKeys.filter(key => !receivedKeys.includes(key));
    const pass = missingKeys.length === 0;
    
    return {
      message: () =>
        `expected object to have keys ${expectedKeys.join(', ')}${
          missingKeys.length > 0 ? `, missing: ${missingKeys.join(', ')}` : ''
        }`,
      pass,
    };
  },
};

// Extend Jest matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeWithinRange(floor: number, ceiling: number): R;
      toHaveValidStructure(expectedKeys: string[]): R;
    }
  }
}

// Add custom matchers to Jest
if (typeof expect !== 'undefined') {
  expect.extend(customMatchers);
}
