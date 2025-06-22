// src/components/demo/SecurityDemo.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { ValidatedInput } from '../common/ValidatedInput';
import { useFormValidation } from '../../hooks/useFormValidation';
import { testSecurityMeasures } from '../../utils/testSecurity';
import { authRateLimiter, scanRateLimiter } from '../../utils/rateLimiting';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';

/**
 * Demo component to showcase security features
 * This is for development/testing purposes only
 */
export const SecurityDemo: React.FC = () => {
  const [testResults, setTestResults] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Form validation demo
  const { getFieldProps, validateForm, isFormValid, fields } = useFormValidation({
    email: { 
      validator: 'email', 
      validateOnBlur: true,
      validateOnChange: true,
      sanitize: true,
    },
    password: { 
      validator: 'password', 
      validateOnBlur: true,
      validateOnChange: true,
    },
    dosage: { 
      validator: 'dosage', 
      validateOnBlur: true,
      sanitize: true,
    },
    productName: { 
      validator: 'text', 
      options: { required: true, maxLength: 100 },
      validateOnBlur: true,
      sanitize: true,
    },
  });

  const runSecurityTests = async () => {
    setLoading(true);
    setTestResults('Running security tests...\n');
    
    try {
      // Capture console output
      const originalLog = console.log;
      let output = '';
      
      console.log = (...args) => {
        output += args.join(' ') + '\n';
        originalLog(...args);
      };

      await testSecurityMeasures();
      
      // Restore console.log
      console.log = originalLog;
      
      setTestResults(output);
    } catch (error) {
      setTestResults(`Error running tests: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testRateLimit = async (type: 'auth' | 'scan') => {
    const limiter = type === 'auth' ? authRateLimiter : scanRateLimiter;
    const testUserId = 'demo-user';
    
    let attempts = 0;
    let blocked = false;
    
    while (!blocked && attempts < 50) {
      const isAllowed = await limiter.isAllowed(testUserId, type);
      attempts++;
      
      if (!isAllowed) {
        blocked = true;
        const timeUntilReset = limiter.getTimeUntilReset(testUserId, type);
        Alert.alert(
          'Rate Limit Demo',
          `${type} rate limit triggered after ${attempts} attempts.\nTry again in ${Math.ceil(timeUntilReset / 1000)} seconds.`
        );
      }
    }
    
    if (!blocked) {
      Alert.alert('Rate Limit Demo', `Made ${attempts} requests without hitting limit.`);
    }
    
    // Clear for next test
    await limiter.clearLimit(testUserId, type);
  };

  const testMaliciousInput = () => {
    const maliciousInputs = [
      '<script>alert("XSS")</script>',
      'javascript:alert(1)',
      '<img src=x onerror=alert(1)>',
      'onload="alert(1)"'
    ];
    
    Alert.alert(
      'Malicious Input Test',
      'Try entering these malicious inputs in the form fields above:\n\n' +
      maliciousInputs.join('\n') +
      '\n\nNotice how they are sanitized and validated!'
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>🔒 Security Features Demo</Text>
      
      {/* Form Validation Demo */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📝 Form Validation & Sanitization</Text>
        
        <ValidatedInput
          label="Email"
          placeholder="Try: user@domain.com or <script>alert(1)</script>"
          validationType="email"
          required
          {...getFieldProps('email')}
        />
        
        <ValidatedInput
          label="Password"
          placeholder="Try: 123456 or SecurePass123!"
          validationType="password"
          required
          secureTextEntry
          showPasswordToggle
          {...getFieldProps('password')}
        />
        
        <ValidatedInput
          label="Dosage"
          placeholder="Try: 500mg daily or <script>alert(1)</script>"
          validationType="text"
          required
          {...getFieldProps('dosage')}
        />
        
        <ValidatedInput
          label="Product Name"
          placeholder="Try: Vitamin D or javascript:alert(1)"
          validationType="text"
          required
          maxLength={100}
          {...getFieldProps('productName')}
        />
        
        <View style={styles.formStatus}>
          <Text style={[styles.statusText, { color: isFormValid ? COLORS.success : COLORS.error }]}>
            Form Status: {isFormValid ? '✅ Valid' : '❌ Invalid'}
          </Text>
        </View>
      </View>

      {/* Rate Limiting Demo */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⏱️ Rate Limiting Demo</Text>
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => testRateLimit('auth')}
        >
          <Text style={styles.buttonText}>Test Auth Rate Limit (5/15min)</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => testRateLimit('scan')}
        >
          <Text style={styles.buttonText}>Test Scan Rate Limit (30/min)</Text>
        </TouchableOpacity>
      </View>

      {/* Security Tests */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🧪 Security Test Suite</Text>
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={runSecurityTests}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Running Tests...' : 'Run All Security Tests'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={testMaliciousInput}
        >
          <Text style={styles.buttonText}>Show Malicious Input Examples</Text>
        </TouchableOpacity>
        
        {testResults ? (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>Test Results:</Text>
            <ScrollView style={styles.resultsScroll} nestedScrollEnabled>
              <Text style={styles.resultsText}>{testResults}</Text>
            </ScrollView>
          </View>
        ) : null}
      </View>

      {/* Current Form Values */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Current Form Values (Sanitized)</Text>
        <Text style={styles.debugText}>
          Email: {fields.email?.value || 'empty'}{'\n'}
          Password: {'*'.repeat(fields.password?.value?.length || 0)}{'\n'}
          Dosage: {fields.dosage?.value || 'empty'}{'\n'}
          Product: {fields.productName?.value || 'empty'}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  section: {
    marginBottom: SPACING.xl,
    padding: SPACING.lg,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 8,
    marginBottom: SPACING.sm,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.medium,
    textAlign: 'center',
  },
  formStatus: {
    marginTop: SPACING.md,
    padding: SPACING.sm,
    backgroundColor: COLORS.background,
    borderRadius: 8,
  },
  statusText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    textAlign: 'center',
  },
  resultsContainer: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: SPACING.md,
  },
  resultsTitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  resultsScroll: {
    maxHeight: 200,
  },
  resultsText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    fontFamily: 'monospace',
  },
  debugText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    fontFamily: 'monospace',
    backgroundColor: COLORS.background,
    padding: SPACING.sm,
    borderRadius: 4,
  },
});
