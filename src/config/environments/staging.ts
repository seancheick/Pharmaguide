// src/config/environments/staging.ts
export const stagingConfig = {
  // API Configuration
  apiTimeout: 20000, // 20 seconds for staging
  maxRetries: 2,
  
  // Feature Flags
  enableAnalytics: true,
  enableCrashReporting: true,
  enablePerformanceMonitoring: true,
  enableDebugMode: false,
  enableVerboseLogging: false,
  
  // Staging-specific settings
  enableHotReload: false,
  enableReduxDevTools: false,
  enableNetworkInspector: false,
  
  // Cache settings
  cacheTimeout: 15 * 60 * 1000, // 15 minutes
  enableCachePersistence: true,
  
  // AI Configuration
  aiResponseTimeout: 30000, // 30 seconds for staging
  enableAIFallbacks: true,
  
  // Database
  enableDatabaseLogging: false,
  connectionTimeout: 8000,
};
