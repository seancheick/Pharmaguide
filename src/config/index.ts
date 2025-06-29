// src/config/index.ts
// Re-export commonly used configuration values for convenience
// Use lazy evaluation to avoid initialization issues
import { config } from './environment';

export { config, envHelpers, type Environment } from './environment';
export { developmentConfig } from './environments/development';
export { stagingConfig } from './environments/staging';
export { productionConfig } from './environments/production';

export const supabaseUrl = config.supabaseUrl;
export const supabaseAnonKey = config.supabaseAnonKey;
export const environment = config.environment;
export const appName = config.appName;
export const appVersion = config.appVersion;
export const enableAnalytics = config.enableAnalytics;
export const enableCrashReporting = config.enableCrashReporting;
export const enablePerformanceMonitoring = config.enablePerformanceMonitoring;
export const apiTimeout = config.apiTimeout;
export const maxRetries = config.maxRetries;
