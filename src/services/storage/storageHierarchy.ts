// src/services/storage/storageHierarchy.ts
export enum StorageTier {
  SECURE = 'secure',      // PHI, auth tokens
  LOCAL = 'local',        // User preferences, cache
  CLOUD = 'cloud',        // Analytics, non-sensitive data
}

export interface StorageConfig {
  tier: StorageTier;
  encryption: boolean;
  sync: boolean;
  retention: number; // days
}

export const STORAGE_CONFIG: Record<string, StorageConfig> = {
  'health_profile': {
    tier: StorageTier.SECURE,
    encryption: true,
    sync: false, // HIPAA compliance
    retention: 365 * 7, // 7 years
  },
  'user_preferences': {
    tier: StorageTier.LOCAL,
    encryption: false,
    sync: true,
    retention: 365,
  },
  'app_cache': {
    tier: StorageTier.LOCAL,
    encryption: false,
    sync: false,
    retention: 30,
  },
  'analytics': {
    tier: StorageTier.CLOUD,
    encryption: false,
    sync: true,
    retention: 90,
  },
  'setup_progress': {
    tier: StorageTier.LOCAL,
    encryption: false,
    sync: false,
    retention: 30,
  },
  'auth_tokens': {
    tier: StorageTier.SECURE,
    encryption: true,
    sync: false,
    retention: 365,
  },
  'scan_history': {
    tier: StorageTier.LOCAL,
    encryption: false,
    sync: true,
    retention: 90,
  },
  'product_cache': {
    tier: StorageTier.LOCAL,
    encryption: false,
    sync: false,
    retention: 7,
  },
}; 