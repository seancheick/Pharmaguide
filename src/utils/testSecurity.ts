// src/utils/testSecurity.ts
import { runAllSecurityTests } from '../tests/security-validation.test';

/**
 * Simple security test runner for development
 * Call this function to validate all security measures
 */
export const testSecurityMeasures = async (): Promise<boolean> => {
  try {
    console.log('🔒 Running Security Validation Tests...\n');
    await runAllSecurityTests();
    return true;
  } catch (error) {
    console.error('❌ Security test runner failed:', error);
    return false;
  }
};

// For development - uncomment to run tests
// testSecurityMeasures();
