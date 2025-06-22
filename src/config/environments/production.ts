// src/config/environments/production.ts
export const productionConfig = {
  // API Configuration
  apiTimeout: 15000, // 15 seconds for production
  maxRetries: 2,
  
  // Feature Flags
  enableAnalytics: true,
  enableCrashReporting: true,
  enablePerformanceMonitoring: true,
  enableDebugMode: false,
  enableVerboseLogging: false,
  
  // Production-specific settings
  enableHotReload: false,
  enableReduxDevTools: false,
  enableNetworkInspector: false,
  
  // Cache settings
  cacheTimeout: 30 * 60 * 1000, // 30 minutes
  enableCachePersistence: true,
  
  // AI Configuration
  aiResponseTimeout: 20000, // 20 seconds for production
  enableAIFallbacks: true,
  
  // Database
  enableDatabaseLogging: false,
  connectionTimeout: 5000,
};
