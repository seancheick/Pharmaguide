// src/screens/dev/MMKVTestScreen.tsx
// Development screen for testing MMKV migration (remove in production)

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { COLORS, SPACING } from '../../constants';
import { runMigrationTests, validateMigration, benchmarkStorage } from '../../utils/runMigrationTests';
import { storageAdapter } from '../../services/storage/storageAdapter';
import { safeStorage } from '../../utils/safeStorage';

interface TestResults {
  validation?: boolean;
  benchmark?: any;
  fullTest?: any;
  storageInfo?: any;
}

export const MMKVTestScreen: React.FC = () => {
  const [results, setResults] = useState<TestResults>({});
  const [loading, setLoading] = useState<string | null>(null);

  const runValidation = async () => {
    setLoading('validation');
    try {
      const isValid = await validateMigration();
      setResults(prev => ({ ...prev, validation: isValid }));
    } catch (error) {
      console.error('Validation error:', error);
      setResults(prev => ({ ...prev, validation: false }));
    }
    setLoading(null);
  };

  const runBenchmark = async () => {
    setLoading('benchmark');
    try {
      const benchmark = await benchmarkStorage();
      setResults(prev => ({ ...prev, benchmark }));
    } catch (error) {
      console.error('Benchmark error:', error);
    }
    setLoading(null);
  };

  const runFullTest = async () => {
    setLoading('fullTest');
    try {
      const testResults = await runMigrationTests();
      setResults(prev => ({ ...prev, fullTest: testResults }));
    } catch (error) {
      console.error('Full test error:', error);
    }
    setLoading(null);
  };

  const getStorageInfo = async () => {
    setLoading('storageInfo');
    try {
      const adapterInfo = storageAdapter.getStorageInfo();
      const safeStorageInfo = await safeStorage.getStorageInfo();
      
      setResults(prev => ({
        ...prev,
        storageInfo: {
          adapter: adapterInfo,
          safeStorage: safeStorageInfo,
        }
      }));
    } catch (error) {
      console.error('Storage info error:', error);
    }
    setLoading(null);
  };

  const TestButton: React.FC<{
    title: string;
    onPress: () => void;
    loading: boolean;
    result?: any;
  }> = ({ title, onPress, loading, result }) => (
    <TouchableOpacity
      style={[
        styles.testButton,
        loading && styles.testButtonLoading,
        result !== undefined && (result ? styles.testButtonSuccess : styles.testButtonError)
      ]}
      onPress={onPress}
      disabled={loading}
    >
      <Text style={styles.testButtonText}>
        {loading ? 'Running...' : title}
      </Text>
      {result !== undefined && (
        <Text style={styles.resultIndicator}>
          {result ? '✅' : '❌'}
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.title}>MMKV Migration Test Suite</Text>
        <Text style={styles.subtitle}>Development Testing Tools</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Tests</Text>
          
          <TestButton
            title="Validate Migration"
            onPress={runValidation}
            loading={loading === 'validation'}
            result={results.validation}
          />

          <TestButton
            title="Get Storage Info"
            onPress={getStorageInfo}
            loading={loading === 'storageInfo'}
            result={results.storageInfo ? true : undefined}
          />

          <TestButton
            title="Performance Benchmark"
            onPress={runBenchmark}
            loading={loading === 'benchmark'}
            result={results.benchmark ? true : undefined}
          />

          <TestButton
            title="Full Test Suite"
            onPress={runFullTest}
            loading={loading === 'fullTest'}
            result={results.fullTest?.success}
          />
        </View>

        {/* Results Display */}
        {results.storageInfo && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Storage Information</Text>
            <View style={styles.resultBox}>
              <Text style={styles.resultText}>
                Adapter Type: {results.storageInfo.adapter.type}
              </Text>
              <Text style={styles.resultText}>
                Encrypted: {results.storageInfo.adapter.encrypted ? 'Yes' : 'No'}
              </Text>
              <Text style={styles.resultText}>
                SafeStorage Initialized: {results.storageInfo.safeStorage.initialized ? 'Yes' : 'No'}
              </Text>
              {results.storageInfo.adapter.size && (
                <Text style={styles.resultText}>
                  Size: {(results.storageInfo.adapter.size / 1024).toFixed(2)} KB
                </Text>
              )}
            </View>
          </View>
        )}

        {results.benchmark && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Performance Results</Text>
            <View style={styles.resultBox}>
              <Text style={styles.resultText}>
                MMKV: {results.benchmark.mmkvTime}ms
              </Text>
              <Text style={styles.resultText}>
                AsyncStorage: {results.benchmark.asyncStorageTime}ms
              </Text>
              <Text style={[
                styles.resultText,
                results.benchmark.improvement > 0 ? styles.successText : styles.errorText
              ]}>
                Improvement: {results.benchmark.improvement.toFixed(1)}%
              </Text>
            </View>
          </View>
        )}

        {results.fullTest && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Full Test Results</Text>
            <View style={styles.resultBox}>
              <Text style={[
                styles.resultText,
                results.fullTest.success ? styles.successText : styles.errorText
              ]}>
                {results.fullTest.summary}
              </Text>
              {results.fullTest.details && (
                <>
                  <Text style={styles.resultText}>
                    Tests: {results.fullTest.details.passedTests}/{results.fullTest.details.totalTests}
                  </Text>
                  <Text style={styles.resultText}>
                    Duration: {results.fullTest.details.totalDuration}ms
                  </Text>
                </>
              )}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.warningText}>
            ⚠️ This is a development screen. Remove before production build.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SPACING.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  testButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 8,
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  testButtonLoading: {
    backgroundColor: COLORS.gray400,
  },
  testButtonSuccess: {
    backgroundColor: COLORS.success,
  },
  testButtonError: {
    backgroundColor: COLORS.error,
  },
  testButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  resultIndicator: {
    fontSize: 18,
  },
  resultBox: {
    backgroundColor: COLORS.gray100,
    padding: SPACING.md,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  resultText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
    fontFamily: 'monospace',
  },
  successText: {
    color: COLORS.success,
    fontWeight: '600',
  },
  errorText: {
    color: COLORS.error,
    fontWeight: '600',
  },
  warningText: {
    fontSize: 12,
    color: COLORS.warning,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
