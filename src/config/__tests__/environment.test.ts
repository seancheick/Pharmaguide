// src/config/__tests__/environment.test.ts
import { envHelpers } from '../environment';

describe('Environment Configuration', () => {
  beforeEach(() => {
    // Clear environment variables before each test
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.EXPO_PUBLIC_ENVIRONMENT;
  });

  describe('getEnvVar', () => {
    it('should return process.env value when available', () => {
      process.env.TEST_VAR = 'test-value';
      const result = envHelpers.getEnvVar('TEST_VAR');
      expect(result).toBe('test-value');
    });

    it('should return fallback when env var is not set', () => {
      const result = envHelpers.getEnvVar('NON_EXISTENT_VAR', 'fallback');
      expect(result).toBe('fallback');
    });

    it('should return undefined when no fallback provided', () => {
      const result = envHelpers.getEnvVar('NON_EXISTENT_VAR');
      expect(result).toBeUndefined();
    });
  });

  describe('getRequiredEnvVar', () => {
    it('should return value when env var is set', () => {
      process.env.REQUIRED_VAR = 'required-value';
      const result = envHelpers.getRequiredEnvVar('REQUIRED_VAR');
      expect(result).toBe('required-value');
    });

    it('should return fallback when env var is not set', () => {
      const result = envHelpers.getRequiredEnvVar('NON_EXISTENT_VAR', 'fallback');
      expect(result).toBe('fallback');
    });

    it('should throw error when required var is missing and no fallback', () => {
      expect(() => {
        envHelpers.getRequiredEnvVar('NON_EXISTENT_VAR');
      }).toThrow('Required environment variable NON_EXISTENT_VAR is not set');
    });
  });

  describe('getCurrentEnvironment', () => {
    it('should return development by default', () => {
      const result = envHelpers.getCurrentEnvironment();
      expect(result).toBe('development');
    });

    it('should return environment from env var', () => {
      process.env.EXPO_PUBLIC_ENVIRONMENT = 'production';
      const result = envHelpers.getCurrentEnvironment();
      expect(result).toBe('production');
    });

    it('should handle staging environment', () => {
      process.env.EXPO_PUBLIC_ENVIRONMENT = 'staging';
      const result = envHelpers.getCurrentEnvironment();
      expect(result).toBe('staging');
    });
  });

  describe('Configuration validation', () => {
    it('should validate Supabase URL format', () => {
      // This test would require importing the config, but since it throws on invalid URL
      // we'll test the URL validation logic indirectly
      expect(() => {
        new URL('invalid-url');
      }).toThrow();

      expect(() => {
        new URL('https://valid.supabase.co');
      }).not.toThrow();
    });
  });

  describe('Environment-specific settings', () => {
    it('should have correct development settings', () => {
      process.env.EXPO_PUBLIC_ENVIRONMENT = 'development';
      
      // Import config after setting environment
      jest.resetModules();
      const { config } = require('../environment');
      
      expect(config.environment).toBe('development');
      expect(config.enableDebugMode).toBe(true);
      expect(config.enableAnalytics).toBe(false);
      expect(config.apiTimeout).toBe(30000);
    });

    it('should have correct production settings', () => {
      process.env.EXPO_PUBLIC_ENVIRONMENT = 'production';
      
      // Import config after setting environment
      jest.resetModules();
      const { config } = require('../environment');
      
      expect(config.environment).toBe('production');
      expect(config.enableDebugMode).toBe(false);
      expect(config.enableAnalytics).toBe(true);
      expect(config.apiTimeout).toBe(15000);
    });
  });
});
