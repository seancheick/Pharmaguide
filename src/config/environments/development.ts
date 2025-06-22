// src/config/environments/development.ts
export const developmentConfig = {
  // API Configuration
  apiTimeout: 30000, // 30 seconds for development
  maxRetries: 3,
  
  // Feature Flags
  enableAnalytics: false,
  enableCrashReporting: false,
  enablePerformanceMonitoring: false,
  enableDebugMode: true,
  enableVerboseLogging: true,
  
  // Development-specific settings
  enableHotReload: true,
  enableReduxDevTools: true,
  enableNetworkInspector: true,
  
  // Cache settings
  cacheTimeout: 5 * 60 * 1000, // 5 minutes
  enableCachePersistence: true,
  
  // AI Configuration
  aiResponseTimeout: 45000, // 45 seconds for development
  enableAIFallbacks: true,
  
  // Database
  enableDatabaseLogging: true,
  connectionTimeout: 10000,
};
