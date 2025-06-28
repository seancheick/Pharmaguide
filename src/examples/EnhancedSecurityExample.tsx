// src/examples/EnhancedSecurityExample.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TextInput, TouchableOpacity } from 'react-native';
import { BarcodeSanitizer } from '../utils/barcodeSanitizer';
import { requestDeduplicator } from '../services/performance/requestDeduplicator';
import { enhancedMemoryMonitor } from '../services/performance/enhancedMemoryMonitor';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants';
import { OptimizedIcon } from '../components/common/OptimizedIcon';

/**
 * Enhanced Security Example Screen
 * Demonstrates the new security and performance enhancements including:
 * - Enhanced barcode sanitization with OWASP security patterns
 * - Request deduplication for performance optimization
 * - Enhanced memory pressure monitoring
 */
export const EnhancedSecurityExample: React.FC = () => {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [sanitizationResult, setSanitizationResult] = useState<any>(null);
  const [requestMetrics, setRequestMetrics] = useState<any>(null);
  const [memoryStats, setMemoryStats] = useState<any>(null);

  // Test barcode sanitization
  const testBarcodeSanitization = () => {
    if (!barcodeInput.trim()) {
      Alert.alert('Error', 'Please enter a barcode to test');
      return;
    }

    const result = BarcodeSanitizer.sanitize(barcodeInput);
    setSanitizationResult(result);

    if (result.isValid) {
      Alert.alert(
        'Sanitization Successful',
        `Barcode: ${result.sanitized}\nFormat: ${result.detectedFormat}${
          result.securityWarnings ? `\nWarnings: ${result.securityWarnings.length}` : ''
        }`
      );
    } else {
      Alert.alert('Sanitization Failed', result.error || 'Unknown error');
    }
  };

  // Test request deduplication
  const testRequestDeduplication = async () => {
    const testKey = 'test_request';
    
    // Simulate multiple identical requests
    const promises = Array.from({ length: 5 }, (_, i) =>
      requestDeduplicator.deduplicate(
        testKey,
        () => new Promise(resolve => setTimeout(() => resolve(`Result ${i}`), 1000))
      )
    );

    try {
      const results = await Promise.all(promises);
      const metrics = requestDeduplicator.getMetrics();
      setRequestMetrics(metrics);

      Alert.alert(
        'Request Deduplication Test',
        `All 5 requests completed!\nDeduplication rate: ${metrics.cacheHitRate}%\nActive requests: ${metrics.activeRequests}`
      );
    } catch (error) {
      Alert.alert('Error', `Request test failed: ${(error as Error).message}`);
    }
  };

  // Test memory monitoring
  const testMemoryMonitoring = async () => {
    try {
      const pressure = await enhancedMemoryMonitor.checkMemoryPressure();
      const stats = enhancedMemoryMonitor.getMemoryStats();
      setMemoryStats({ pressure, stats });

      Alert.alert(
        'Memory Monitoring',
        `Memory Level: ${pressure.level}\nUsage: ${pressure.percentage}%\nAverage Pressure: ${stats.averagePressure}%`
      );
    } catch (error) {
      Alert.alert('Error', `Memory monitoring failed: ${(error as Error).message}`);
    }
  };

  // Sample malicious barcodes for testing
  const maliciousBarcodes = [
    "'; DROP TABLE products; --",
    "<script>alert('XSS')</script>",
    "../../../etc/passwd",
    "1234567890123", // Valid barcode
    "invalid-barcode-format",
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Enhanced Security & Performance</Text>
        <Text style={styles.subtitle}>
          Demonstrating OWASP security patterns, request deduplication, and memory monitoring
        </Text>
      </View>

      {/* Barcode Sanitization Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <OptimizedIcon type="ion" name="shield-checkmark" size={24} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Enhanced Barcode Sanitization</Text>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={barcodeInput}
            onChangeText={setBarcodeInput}
            placeholder="Enter barcode to test (try malicious inputs)"
            placeholderTextColor={COLORS.textSecondary}
          />
          <TouchableOpacity style={styles.button} onPress={testBarcodeSanitization}>
            <Text style={styles.buttonText}>Sanitize</Text>
          </TouchableOpacity>
        </View>

        {/* Quick test buttons */}
        <View style={styles.quickTests}>
          <Text style={styles.quickTestsTitle}>Quick Tests:</Text>
          {maliciousBarcodes.map((barcode, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickTestButton}
              onPress={() => {
                setBarcodeInput(barcode);
                setTimeout(() => testBarcodeSanitization(), 100);
              }}
            >
              <Text style={styles.quickTestText}>
                {barcode.length > 20 ? barcode.substring(0, 20) + '...' : barcode}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sanitization Results */}
        {sanitizationResult && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultTitle}>Sanitization Result:</Text>
            <View style={[styles.resultBadge, { 
              backgroundColor: sanitizationResult.isValid ? COLORS.success : COLORS.error 
            }]}>
              <Text style={styles.resultBadgeText}>
                {sanitizationResult.isValid ? 'VALID' : 'INVALID'}
              </Text>
            </View>
            
            <View style={styles.resultDetails}>
              <Text style={styles.resultLabel}>Original: {sanitizationResult.originalFormat}</Text>
              <Text style={styles.resultLabel}>Sanitized: {sanitizationResult.sanitized}</Text>
              <Text style={styles.resultLabel}>Format: {sanitizationResult.detectedFormat}</Text>
              {sanitizationResult.securityWarnings && (
                <Text style={[styles.resultLabel, { color: COLORS.warning }]}>
                  Warnings: {sanitizationResult.securityWarnings.join(', ')}
                </Text>
              )}
              {sanitizationResult.error && (
                <Text style={[styles.resultLabel, { color: COLORS.error }]}>
                  Error: {sanitizationResult.error}
                </Text>
              )}
            </View>
          </View>
        )}
      </View>

      {/* Request Deduplication Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <OptimizedIcon type="ion" name="flash" size={24} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Request Deduplication</Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={testRequestDeduplication}>
          <Text style={styles.buttonText}>Test Deduplication (5 requests)</Text>
        </TouchableOpacity>

        {requestMetrics && (
          <View style={styles.metricsContainer}>
            <Text style={styles.metricsTitle}>Request Metrics:</Text>
            <View style={styles.metricsGrid}>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>{requestMetrics.totalRequests}</Text>
                <Text style={styles.metricLabel}>Total Requests</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>{requestMetrics.deduplicatedRequests}</Text>
                <Text style={styles.metricLabel}>Deduplicated</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>{requestMetrics.cacheHitRate}%</Text>
                <Text style={styles.metricLabel}>Hit Rate</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>{requestMetrics.averageResponseTime}ms</Text>
                <Text style={styles.metricLabel}>Avg Response</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Memory Monitoring Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <OptimizedIcon type="ion" name="hardware-chip" size={24} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Enhanced Memory Monitoring</Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={testMemoryMonitoring}>
          <Text style={styles.buttonText}>Check Memory Pressure</Text>
        </TouchableOpacity>

        {memoryStats && (
          <View style={styles.memoryContainer}>
            <Text style={styles.metricsTitle}>Memory Status:</Text>
            
            <View style={styles.memoryPressure}>
              <View style={[styles.pressureBadge, {
                backgroundColor: 
                  memoryStats.pressure.level === 'critical' ? COLORS.error :
                  memoryStats.pressure.level === 'warning' ? COLORS.warning :
                  COLORS.success
              }]}>
                <Text style={styles.pressureBadgeText}>
                  {memoryStats.pressure.level.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.pressureText}>
                {memoryStats.pressure.percentage}% Memory Usage
              </Text>
            </View>

            <View style={styles.memoryDetails}>
              <Text style={styles.memoryLabel}>
                Average Pressure: {memoryStats.stats.averagePressure}%
              </Text>
              <Text style={styles.memoryLabel}>
                Max Pressure: {memoryStats.stats.maxPressure}%
              </Text>
              <Text style={styles.memoryLabel}>
                Warning Count: {memoryStats.stats.warningCount}
              </Text>
              <Text style={styles.memoryLabel}>
                Critical Count: {memoryStats.stats.criticalCount}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Security Features Info */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <OptimizedIcon type="ion" name="information-circle" size={24} color={COLORS.info} />
          <Text style={styles.sectionTitle}>Security & Performance Features</Text>
        </View>

        <View style={styles.featureList}>
          <View style={styles.feature}>
            <OptimizedIcon type="ion" name="checkmark-circle" size={16} color={COLORS.success} />
            <Text style={styles.featureText}>OWASP-based input validation with threat detection</Text>
          </View>
          
          <View style={styles.feature}>
            <OptimizedIcon type="ion" name="checkmark-circle" size={16} color={COLORS.success} />
            <Text style={styles.featureText}>Enhanced barcode sanitization with format detection</Text>
          </View>
          
          <View style={styles.feature}>
            <OptimizedIcon type="ion" name="checkmark-circle" size={16} color={COLORS.success} />
            <Text style={styles.featureText}>Request deduplication with performance metrics</Text>
          </View>
          
          <View style={styles.feature}>
            <OptimizedIcon type="ion" name="checkmark-circle" size={16} color={COLORS.success} />
            <Text style={styles.featureText}>Enhanced memory pressure monitoring</Text>
          </View>
          
          <View style={styles.feature}>
            <OptimizedIcon type="ion" name="checkmark-circle" size={16} color={COLORS.success} />
            <Text style={styles.featureText}>Automatic memory cleanup and cache management</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: SPACING.lg,
  },
  header: {
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: SPACING.md,
    marginRight: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textPrimary,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    justifyContent: 'center',
  },
  buttonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  quickTests: {
    marginBottom: SPACING.md,
  },
  quickTestsTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  quickTestButton: {
    backgroundColor: COLORS.gray100,
    padding: SPACING.sm,
    borderRadius: 6,
    marginBottom: SPACING.xs,
  },
  quickTestText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    fontFamily: 'monospace',
  },
  resultContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.lg,
    marginTop: SPACING.md,
  },
  resultTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  resultBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 6,
    marginBottom: SPACING.md,
  },
  resultBadgeText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  resultDetails: {
    gap: SPACING.xs,
  },
  resultLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    fontFamily: 'monospace',
  },
  metricsContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.lg,
    marginTop: SPACING.md,
  },
  metricsTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metric: {
    alignItems: 'center',
    width: '48%',
    marginBottom: SPACING.md,
  },
  metricValue: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },
  metricLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  memoryContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.lg,
    marginTop: SPACING.md,
  },
  memoryPressure: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  pressureBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 6,
    marginRight: SPACING.sm,
  },
  pressureBadgeText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  pressureText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textPrimary,
  },
  memoryDetails: {
    gap: SPACING.xs,
  },
  memoryLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  featureList: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.lg,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  featureText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
    flex: 1,
  },
});
