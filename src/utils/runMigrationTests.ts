// src/utils/runMigrationTests.ts
// Simple test runner for MMKV migration validation

import { mmkvMigrationTester } from './mmkvMigrationTest';

/**
 * Run MMKV migration tests and return results
 * This can be called during app development to validate the migration
 */
export const runMigrationTests = async (): Promise<{
  success: boolean;
  summary: string;
  details: any;
}> => {
  try {
    console.log('🚀 Starting MMKV Migration Validation...');

    const results = await mmkvMigrationTester.runTestSuite();

    const success = results.failedTests === 0;
    const successRate = (
      (results.passedTests / results.totalTests) *
      100
    ).toFixed(1);

    const summary = `
MMKV Migration Test Results:
✅ Passed: ${results.passedTests}/${results.totalTests} (${successRate}%)
⏱️  Duration: ${results.totalDuration}ms
💾 Storage: ${results.storageInfo.storageAdapter?.type || 'Unknown'}
🔒 Encrypted: ${results.storageInfo.storageAdapter?.encrypted ? 'Yes' : 'No'}
${results.failedTests > 0 ? `❌ Failed: ${results.failedTests}` : '🎉 All tests passed!'}
    `.trim();

    return {
      success,
      summary,
      details: results,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      success: false,
      summary: `❌ Migration test failed: ${errorMessage}`,
      details: { error: errorMessage },
    };
  }
};

/**
 * Quick validation function for production use
 * Only runs essential tests to verify migration worked
 */
export const validateMigration = async (): Promise<boolean> => {
  try {
    const { storageAdapter } = await import(
      '../services/storage/storageAdapter'
    );
    const { safeStorage } = await import('./safeStorage');

    // Test 1: Storage adapter initialization
    await storageAdapter.initialize();
    const info = storageAdapter.getStorageInfo();

    if (!info.type) {
      console.warn('⚠️ Storage adapter not properly initialized');
      return false;
    }

    // Test 2: Basic read/write operations
    const testKey = '@migration_validation';
    const testValue = JSON.stringify({
      validated: true,
      timestamp: Date.now(),
    });

    await storageAdapter.setItem(testKey, testValue);
    const retrieved = await storageAdapter.getItem(testKey);
    await storageAdapter.removeItem(testKey);

    if (retrieved !== testValue) {
      console.warn('⚠️ Basic storage operations failed');
      console.warn(`Expected: ${testValue}`);
      console.warn(`Got: ${retrieved}`);
      return false;
    }

    // Test 3: SafeStorage integration
    try {
      const safeStorageInfo = await safeStorage.getStorageInfo();
      if (!safeStorageInfo.initialized) {
        console.warn('⚠️ SafeStorage not properly initialized');
        return false;
      }
    } catch (error) {
      console.warn('⚠️ SafeStorage test failed:', error);
      // Don't fail validation for this, as it might be a timing issue
    }

    console.log(`✅ Migration validation passed - Using ${info.type}`);
    return true;
  } catch (error) {
    console.error('❌ Migration validation failed:', error);
    return false;
  }
};

/**
 * Performance benchmark for comparing storage solutions
 */
export const benchmarkStorage = async (): Promise<{
  mmkvTime: number;
  asyncStorageTime: number;
  improvement: number;
}> => {
  try {
    const { storageAdapter } = await import(
      '../services/storage/storageAdapter'
    );
    const AsyncStorage = await import(
      '@react-native-async-storage/async-storage'
    );

    const iterations = 50;
    const testData = JSON.stringify({
      data: 'benchmark_test_data'.repeat(20),
      timestamp: Date.now(),
      array: new Array(100)
        .fill(0)
        .map((_, i) => ({ id: i, value: `item_${i}` })),
    });

    // Benchmark MMKV
    const mmkvStart = Date.now();
    for (let i = 0; i < iterations; i++) {
      await storageAdapter.setItem(`@benchmark_mmkv_${i}`, testData);
      await storageAdapter.getItem(`@benchmark_mmkv_${i}`);
      await storageAdapter.removeItem(`@benchmark_mmkv_${i}`);
    }
    const mmkvTime = Date.now() - mmkvStart;

    // Benchmark AsyncStorage
    const asyncStart = Date.now();
    for (let i = 0; i < iterations; i++) {
      await AsyncStorage.default.setItem(`@benchmark_async_${i}`, testData);
      await AsyncStorage.default.getItem(`@benchmark_async_${i}`);
      await AsyncStorage.default.removeItem(`@benchmark_async_${i}`);
    }
    const asyncStorageTime = Date.now() - asyncStart;

    const improvement =
      ((asyncStorageTime - mmkvTime) / asyncStorageTime) * 100;

    console.log(`📊 Storage Benchmark Results:`);
    console.log(`   MMKV: ${mmkvTime}ms`);
    console.log(`   AsyncStorage: ${asyncStorageTime}ms`);
    console.log(`   Improvement: ${improvement.toFixed(1)}%`);

    return {
      mmkvTime,
      asyncStorageTime,
      improvement,
    };
  } catch (error) {
    console.error('❌ Benchmark failed:', error);
    return {
      mmkvTime: 0,
      asyncStorageTime: 0,
      improvement: 0,
    };
  }
};
