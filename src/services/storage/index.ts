// src/services/storage/index.ts
// ===== PRIMARY STORAGE SERVICES =====
// These are the main storage services that should be used throughout the app

// Unified Storage - Main entry point for all storage operations
export { unifiedStorage, UnifiedStorageService } from './unifiedStorageService';

// Core Storage Implementations
export { MMKVStorage } from './mmkvStorage';
export { SecureStorage } from './secureStorage';

// Configuration and Migration
export { STORAGE_CONFIG, StorageTier } from './storageHierarchy';
export { StorageMigration } from './storageMigration';

// Storage Adapter for Auth
export { StorageAdapter } from './storageAdapter';

// Types
export type { StorageConfig } from './storageHierarchy';

// ===== DEPRECATED - SCHEDULED FOR REMOVAL =====
// These services are deprecated and will be removed in future versions
// Please use the unified storage service instead

/**
 * @deprecated Use UnifiedStorageService instead. Will be removed in v2.0
 */
export { AsyncStorageAdapter } from './asyncStorageAdapter';

/**
 * @deprecated Use SecureStorage with SQLite instead. Will be removed in v2.0  
 */
export { DrizzleAdapter } from './drizzleAdapter';

/**
 * @deprecated Use MMKVStorage directly or through UnifiedStorageService. Will be removed in v2.0
 */
export { PerformanceStorageWrapper } from './performanceStorageWrapper';

/**
 * @deprecated Use MMKVStorage directly. Will be removed in v2.0
 */
export { OptimizedMMKVStorage } from './optimizedMMKVStorage'; 