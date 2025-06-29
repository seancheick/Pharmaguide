// src/config/environment.ts
import Constants from 'expo-constants';
import { developmentConfig } from './environments/development';
import { stagingConfig } from './environments/staging';
import { productionConfig } from './environments/production';

export type Environment = 'development' | 'staging' | 'production';

interface EnvironmentConfig {
  // Supabase Configuration
  supabaseUrl: string;
  supabaseAnonKey: string;

  // AI Service Configuration
  huggingfaceApiKey?: string;
  groqApiKey?: string;

  // App Configuration
  environment: Environment;
  appName: string;
  appVersion: string;

  // Feature Flags
  enableAnalytics: boolean;
  enableCrashReporting: boolean;
  enablePerformanceMonitoring: boolean;
  enableDebugMode: boolean;
  enableVerboseLogging: boolean;

  // Development Features
  enableHotReload: boolean;
  enableReduxDevTools: boolean;
  enableNetworkInspector: boolean;

  // API Configuration
  apiTimeout: number;
  maxRetries: number;
  aiResponseTimeout: number;
  enableAIFallbacks: boolean;

  // Cache Configuration
  cacheTimeout: number;
  enableCachePersistence: boolean;

  // Database Configuration
  enableDatabaseLogging: boolean;
  connectionTimeout: number;
}

/**
 * Get environment variable with fallback support
 * Checks process.env first, then Constants.expoConfig.extra, then fallback
 */
function getEnvVar(key: string, fallback?: string): string | undefined {
  try {
    // Check process.env first (for local development)
    if (process.env[key]) {
      return process.env[key];
    }

    // Check Expo Constants (for app.json extra config)
    if (Constants.expoConfig?.extra?.[key]) {
      return Constants.expoConfig.extra[key];
    }

    // Return fallback if provided
    return fallback;
  } catch (error) {
    console.warn(`Error getting environment variable ${key}:`, error);
    return fallback;
  }
}

/**
 * Get required environment variable or throw error
 */
function getRequiredEnvVar(key: string, fallback?: string): string {
  const value = getEnvVar(key, fallback);
  if (!value) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value;
}

/**
 * Determine current environment
 */
function getCurrentEnvironment(): Environment {
  const env = getEnvVar('EXPO_PUBLIC_ENVIRONMENT', 'development');

  // Auto-detect based on other indicators if not explicitly set
  if (env === 'development') {
    if (__DEV__) return 'development';
    if (Constants.appOwnership === 'expo') return 'development';
  }

  return env as Environment;
}

/**
 * Get environment-specific configuration
 */
function getEnvironmentSpecificConfig(environment: Environment) {
  switch (environment) {
    case 'development':
      return developmentConfig;
    case 'staging':
      return stagingConfig;
    case 'production':
      return productionConfig;
    default:
      return developmentConfig;
  }
}

/**
 * Create environment configuration with validation
 */
function createEnvironmentConfig(): EnvironmentConfig {
  const environment = getCurrentEnvironment();
  const envConfig = getEnvironmentSpecificConfig(environment);

  // Get Supabase configuration - MUST be provided via environment variables
  const supabaseUrl = getRequiredEnvVar('EXPO_PUBLIC_SUPABASE_URL');
  const supabaseAnonKey = getRequiredEnvVar('EXPO_PUBLIC_SUPABASE_ANON_KEY');

  // Validate Supabase URL format
  try {
    new URL(supabaseUrl);
  } catch (error) {
    throw new Error(`Invalid Supabase URL format: ${supabaseUrl}`);
  }

  return {
    // Supabase Configuration
    supabaseUrl,
    supabaseAnonKey,

    // AI Service Configuration
    huggingfaceApiKey: getEnvVar('EXPO_PUBLIC_HUGGINGFACE_API_KEY'),
    groqApiKey: getEnvVar('EXPO_PUBLIC_GROQ_API_KEY'),

    // App Configuration
    environment,
    appName: getEnvVar('EXPO_PUBLIC_APP_NAME', 'PharmaGuide'),
    appVersion: getEnvVar('EXPO_PUBLIC_APP_VERSION', '1.0.0'),

    // Merge environment-specific configuration
    ...envConfig,
  };
}

// Create and export the configuration with error handling
let config: EnvironmentConfig;
try {
  config = createEnvironmentConfig();
} catch (error) {
  console.error('Failed to create environment configuration:', error);
  // Re-throw the error - configuration is required for the app to function
  throw new Error(`Environment configuration failed: ${error.message}`);
}

export { config };

// Export helper functions for testing and debugging
export const envHelpers = {
  getEnvVar,
  getRequiredEnvVar,
  getCurrentEnvironment,
};

// Validate configuration
function validateConfiguration(config: EnvironmentConfig): void {
  const errors: string[] = [];

  if (!config.supabaseUrl) {
    errors.push('Supabase URL is required');
  }

  if (!config.supabaseAnonKey) {
    errors.push('Supabase anonymous key is required');
  }

  if (config.environment === 'production') {
    if (!config.huggingfaceApiKey && !config.groqApiKey) {
      console.warn('⚠️ No AI API keys configured for production environment');
    }
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
}

// Validate the configuration
validateConfiguration(config);

// Log configuration in development (without sensitive data)
if (__DEV__) {
  console.log('🔧 Environment Configuration:', {
    environment: config.environment,
    appName: config.appName,
    appVersion: config.appVersion,
    supabaseUrl: config.supabaseUrl,
    hasHuggingfaceKey: !!config.huggingfaceApiKey,
    hasGroqKey: !!config.groqApiKey,
    enableAnalytics: config.enableAnalytics,
    enableCrashReporting: config.enableCrashReporting,
    apiTimeout: config.apiTimeout,
    maxRetries: config.maxRetries,
  });
}
