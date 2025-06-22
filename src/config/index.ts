// src/config/index.ts
export { config, envHelpers, type Environment } from './environment';
export { developmentConfig } from './environments/development';
export { stagingConfig } from './environments/staging';
export { productionConfig } from './environments/production';

// Re-export commonly used configuration values for convenience
export const {
  supabaseUrl,
  supabaseAnonKey,
  environment,
  appName,
  appVersion,
  enableAnalytics,
  enableCrashReporting,
  enablePerformanceMonitoring,
  apiTimeout,
  maxRetries,
} = config;
