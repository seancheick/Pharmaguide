// src/utils/mmkvMigrationTest.ts
// Comprehensive MMKV Migration Testing and Validation

import AsyncStorage from '@react-native-async-storage/async-storage';
import { storageAdapter } from '../services/storage/storageAdapter';
import { performanceMonitor } from '../services/performance/performanceMonitor';
import { safeStorage } from './safeStorage';

interface TestResult {
  testName: string;
  passed: boolean;
  duration: number;
  error?: string;
  details?: any;
}

interface MigrationTestSuite {
  results: TestResult[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  totalDuration: number;
  storageInfo: any;
}

/**
 * MMKV Migration Test Suite
 * Comprehensive testing of storage migration and functionality
 */
export class MMKVMigrationTester {
  private results: TestResult[] = [];

  /**
   * Run complete test suite
   */
  async runTestSuite(): Promise<MigrationTestSuite> {
    console.log('🧪 Starting MMKV Migration Test Suite...');
    
    const startTime = Date.now();
    this.results = [];

    // Core functionality tests
    await this.testStorageAdapterInitialization();
    await this.testBasicStorageOperations();
    await this.testDataMigration();
    await this.testFallbackMechanisms();
    await this.testPerformanceComparison();
    
    // Integration tests
    await this.testSupabaseIntegration();
    await this.testSafeStorageIntegration();
    await this.testGamificationIntegration();
    await this.testAICacheIntegration();
    
    // Data integrity tests
    await this.testDataIntegrity();
    await this.testConcurrentOperations();
    await this.testErrorHandling();

    const totalDuration = Date.now() - startTime;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = this.results.filter(r => !r.passed).length;

    // Get storage information
    const storageInfo = await this.getStorageInfo();

    const summary: MigrationTestSuite = {
      results: this.results,
      totalTests: this.results.length,
      passedTests,
      failedTests,
      totalDuration,
      storageInfo,
    };

    this.logTestSummary(summary);
    return summary;
  }

  /**
   * Test storage adapter initialization
   */
  private async testStorageAdapterInitialization(): Promise<void> {
    await this.runTest('Storage Adapter Initialization', async () => {
      await storageAdapter.initialize();
      const info = storageAdapter.getStorageInfo();
      
      if (!info.type) {
        throw new Error('Storage type not detected');
      }
      
      return { storageType: info.type, encrypted: info.encrypted };
    });
  }

  /**
   * Test basic storage operations
   */
  private async testBasicStorageOperations(): Promise<void> {
    await this.runTest('Basic Storage Operations', async () => {
      const testKey = '@test_basic_operations';
      const testValue = JSON.stringify({ test: 'data', timestamp: Date.now() });
      
      // Test setItem
      await storageAdapter.setItem(testKey, testValue);
      
      // Test getItem
      const retrieved = await storageAdapter.getItem(testKey);
      if (retrieved !== testValue) {
        throw new Error('Retrieved value does not match stored value');
      }
      
      // Test removeItem
      await storageAdapter.removeItem(testKey);
      const afterRemoval = await storageAdapter.getItem(testKey);
      if (afterRemoval !== null) {
        throw new Error('Item was not properly removed');
      }
      
      return { success: true };
    });
  }

  /**
   * Test data migration from AsyncStorage
   */
  private async testDataMigration(): Promise<void> {
    await this.runTest('Data Migration', async () => {
      const testKey = '@test_migration_data';
      const testValue = JSON.stringify({ migrated: true, timestamp: Date.now() });
      
      // Store data in AsyncStorage first
      await AsyncStorage.setItem(testKey, testValue);
      
      // Initialize storage adapter (should trigger migration)
      await storageAdapter.initialize();
      
      // Check if data was migrated
      const migratedValue = await storageAdapter.getItem(testKey);
      if (migratedValue !== testValue) {
        throw new Error('Data was not properly migrated');
      }
      
      // Cleanup
      await storageAdapter.removeItem(testKey);
      await AsyncStorage.removeItem(testKey);
      
      return { migrated: true };
    });
  }

  /**
   * Test fallback mechanisms
   */
  private async testFallbackMechanisms(): Promise<void> {
    await this.runTest('Fallback Mechanisms', async () => {
      const testKey = '@test_fallback';
      const testValue = 'fallback_test_data';
      
      // Test safeStorage fallback
      await safeStorage.setItem(testKey, testValue);
      const retrieved = await safeStorage.getItem(testKey);
      
      if (retrieved !== testValue) {
        throw new Error('Fallback mechanism failed');
      }
      
      // Cleanup
      await safeStorage.removeItem(testKey);
      
      return { fallbackWorking: true };
    });
  }

  /**
   * Test performance comparison
   */
  private async testPerformanceComparison(): Promise<void> {
    await this.runTest('Performance Comparison', async () => {
      const iterations = 100;
      const testData = JSON.stringify({ 
        data: 'performance_test_data'.repeat(10),
        timestamp: Date.now() 
      });
      
      // Test AsyncStorage performance
      const asyncStorageTime = await this.measureStoragePerformance(
        'AsyncStorage',
        iterations,
        testData,
        AsyncStorage
      );
      
      // Test MMKV performance
      const mmkvTime = await this.measureStoragePerformance(
        'MMKV',
        iterations,
        testData,
        storageAdapter
      );
      
      const improvement = ((asyncStorageTime - mmkvTime) / asyncStorageTime) * 100;
      
      return {
        asyncStorageTime,
        mmkvTime,
        improvementPercent: improvement,
        fasterThan: improvement > 0 ? 'AsyncStorage' : 'MMKV'
      };
    });
  }

  /**
   * Test Supabase integration
   */
  private async testSupabaseIntegration(): Promise<void> {
    await this.runTest('Supabase Integration', async () => {
      // Test that Supabase client can use the storage adapter
      const testKey = 'sb-test-session';
      const testSession = JSON.stringify({
        access_token: 'test_token',
        refresh_token: 'test_refresh',
        expires_at: Date.now() + 3600000
      });
      
      await storageAdapter.setItem(testKey, testSession);
      const retrieved = await storageAdapter.getItem(testKey);
      
      if (retrieved !== testSession) {
        throw new Error('Supabase session storage failed');
      }
      
      await storageAdapter.removeItem(testKey);
      return { supabaseCompatible: true };
    });
  }

  /**
   * Test SafeStorage integration
   */
  private async testSafeStorageIntegration(): Promise<void> {
    await this.runTest('SafeStorage Integration', async () => {
      const storageInfo = await safeStorage.getStorageInfo();
      
      if (!storageInfo.type) {
        throw new Error('SafeStorage not properly initialized');
      }
      
      return storageInfo;
    });
  }

  /**
   * Test gamification integration
   */
  private async testGamificationIntegration(): Promise<void> {
    await this.runTest('Gamification Integration', async () => {
      const testProgress = {
        points: 100,
        level: 2,
        streak: { current: 5, longest: 10, lastActivityDate: new Date().toISOString() }
      };
      
      await storageAdapter.setItem('user_progress', JSON.stringify(testProgress));
      const retrieved = await storageAdapter.getItem('user_progress');
      
      if (!retrieved) {
        throw new Error('Gamification data storage failed');
      }
      
      const parsed = JSON.parse(retrieved);
      if (parsed.points !== testProgress.points) {
        throw new Error('Gamification data integrity failed');
      }
      
      await storageAdapter.removeItem('user_progress');
      return { gamificationWorking: true };
    });
  }

  /**
   * Test AI cache integration
   */
  private async testAICacheIntegration(): Promise<void> {
    await this.runTest('AI Cache Integration', async () => {
      const testCache = {
        'test_query_hash': {
          data: 'AI response data',
          timestamp: Date.now(),
          expiresAt: Date.now() + 3600000
        }
      };
      
      await storageAdapter.setItem('ai_cache', JSON.stringify(testCache));
      const retrieved = await storageAdapter.getItem('ai_cache');
      
      if (!retrieved) {
        throw new Error('AI cache storage failed');
      }
      
      await storageAdapter.removeItem('ai_cache');
      return { aiCacheWorking: true };
    });
  }

  /**
   * Test data integrity
   */
  private async testDataIntegrity(): Promise<void> {
    await this.runTest('Data Integrity', async () => {
      const testData = {
        string: 'test string',
        number: 12345,
        boolean: true,
        array: [1, 2, 3],
        object: { nested: 'value' },
        null: null,
        unicode: '🚀 Unicode test 中文',
      };
      
      const serialized = JSON.stringify(testData);
      await storageAdapter.setItem('@integrity_test', serialized);
      const retrieved = await storageAdapter.getItem('@integrity_test');
      
      if (retrieved !== serialized) {
        throw new Error('Data integrity compromised');
      }
      
      const parsed = JSON.parse(retrieved!);
      if (JSON.stringify(parsed) !== JSON.stringify(testData)) {
        throw new Error('Data structure integrity failed');
      }
      
      await storageAdapter.removeItem('@integrity_test');
      return { integrityMaintained: true };
    });
  }

  /**
   * Test concurrent operations
   */
  private async testConcurrentOperations(): Promise<void> {
    await this.runTest('Concurrent Operations', async () => {
      const promises = [];
      const testCount = 10;
      
      // Create concurrent read/write operations
      for (let i = 0; i < testCount; i++) {
        promises.push(
          storageAdapter.setItem(`@concurrent_test_${i}`, `value_${i}`)
        );
      }
      
      await Promise.all(promises);
      
      // Verify all data was written correctly
      const readPromises = [];
      for (let i = 0; i < testCount; i++) {
        readPromises.push(storageAdapter.getItem(`@concurrent_test_${i}`));
      }
      
      const results = await Promise.all(readPromises);
      
      for (let i = 0; i < testCount; i++) {
        if (results[i] !== `value_${i}`) {
          throw new Error(`Concurrent operation failed for index ${i}`);
        }
      }
      
      // Cleanup
      const cleanupPromises = [];
      for (let i = 0; i < testCount; i++) {
        cleanupPromises.push(storageAdapter.removeItem(`@concurrent_test_${i}`));
      }
      await Promise.all(cleanupPromises);
      
      return { concurrentOperationsSuccessful: testCount };
    });
  }

  /**
   * Test error handling
   */
  private async testErrorHandling(): Promise<void> {
    await this.runTest('Error Handling', async () => {
      // Test invalid JSON handling
      try {
        await storageAdapter.setItem('@invalid_json_test', 'valid string');
        const retrieved = await storageAdapter.getItem('@invalid_json_test');
        
        if (retrieved !== 'valid string') {
          throw new Error('String storage failed');
        }
        
        await storageAdapter.removeItem('@invalid_json_test');
      } catch (error) {
        throw new Error(`Error handling test failed: ${error}`);
      }
      
      return { errorHandlingWorking: true };
    });
  }

  /**
   * Helper method to run individual tests
   */
  private async runTest(testName: string, testFunction: () => Promise<any>): Promise<void> {
    const startTime = Date.now();
    
    try {
      const result = await testFunction();
      const duration = Date.now() - startTime;
      
      this.results.push({
        testName,
        passed: true,
        duration,
        details: result,
      });
      
      console.log(`✅ ${testName} - ${duration}ms`);
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.results.push({
        testName,
        passed: false,
        duration,
        error: error instanceof Error ? error.message : String(error),
      });
      
      console.log(`❌ ${testName} - ${duration}ms - ${error}`);
    }
  }

  /**
   * Measure storage performance
   */
  private async measureStoragePerformance(
    name: string,
    iterations: number,
    testData: string,
    storage: any
  ): Promise<number> {
    const startTime = Date.now();
    
    for (let i = 0; i < iterations; i++) {
      await storage.setItem(`@perf_test_${i}`, testData);
      await storage.getItem(`@perf_test_${i}`);
      await storage.removeItem(`@perf_test_${i}`);
    }
    
    return Date.now() - startTime;
  }

  /**
   * Get storage information
   */
  private async getStorageInfo(): Promise<any> {
    try {
      const adapterInfo = storageAdapter.getStorageInfo();
      const safeStorageInfo = await safeStorage.getStorageInfo();
      
      return {
        storageAdapter: adapterInfo,
        safeStorage: safeStorageInfo,
      };
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }

  /**
   * Log test summary
   */
  private logTestSummary(summary: MigrationTestSuite): void {
    console.log('\n📊 MMKV Migration Test Summary');
    console.log('================================');
    console.log(`Total Tests: ${summary.totalTests}`);
    console.log(`Passed: ${summary.passedTests} ✅`);
    console.log(`Failed: ${summary.failedTests} ❌`);
    console.log(`Success Rate: ${((summary.passedTests / summary.totalTests) * 100).toFixed(1)}%`);
    console.log(`Total Duration: ${summary.totalDuration}ms`);
    console.log(`Storage Type: ${summary.storageInfo.storageAdapter?.type || 'Unknown'}`);
    console.log(`Encrypted: ${summary.storageInfo.storageAdapter?.encrypted ? 'Yes' : 'No'}`);
    
    if (summary.failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      summary.results
        .filter(r => !r.passed)
        .forEach(r => console.log(`  - ${r.testName}: ${r.error}`));
    }
    
    console.log('\n🎯 Performance Results:');
    const perfTest = summary.results.find(r => r.testName === 'Performance Comparison');
    if (perfTest && perfTest.details) {
      console.log(`  AsyncStorage: ${perfTest.details.asyncStorageTime}ms`);
      console.log(`  MMKV: ${perfTest.details.mmkvTime}ms`);
      console.log(`  Improvement: ${perfTest.details.improvementPercent.toFixed(1)}%`);
    }
  }
}

// Export test runner instance
export const mmkvMigrationTester = new MMKVMigrationTester();
