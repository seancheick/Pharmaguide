import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../monitoring/logger';
import { unifiedStorage } from './unifiedStorageService';

interface MigrationResult {
  success: boolean;
  migratedKeys: string[];
  failedKeys: string[];
  totalKeys: number;
}

export class StorageMigration {
  private static readonly MIGRATION_COMPLETE_KEY = '@storage_migration_complete_v2';

  /**
   * Check if migration has been completed
   */
  static async isMigrationComplete(): Promise<boolean> {
    try {
      const status = await unifiedStorage.getItem(this.MIGRATION_COMPLETE_KEY);
      return status === 'true';
    } catch (error) {
      logger.error('database', 'Failed to check migration status', error as Error);
      return false;
    }
  }

  /**
   * Mark migration as complete
   */
  private static async markMigrationComplete(): Promise<void> {
    try {
      await unifiedStorage.setItem(this.MIGRATION_COMPLETE_KEY, 'true');
    } catch (error) {
      logger.error('database', 'Failed to mark migration complete', error as Error);
    }
  }

  /**
   * Migrate data from AsyncStorage to unified storage
   */
  static async migrateFromAsyncStorage(): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: false,
      migratedKeys: [],
      failedKeys: [],
      totalKeys: 0,
    };

    try {
      logger.info('database', 'Starting AsyncStorage migration to unified storage');

      // Get all keys from AsyncStorage
      const allKeys = await AsyncStorage.getAllKeys();
      result.totalKeys = allKeys.length;

      logger.info('database', `Found ${allKeys.length} keys to migrate`);

      // Filter out migration-related keys and keys that should stay in AsyncStorage
      const keysToMigrate = allKeys.filter(key => {
        return !key.startsWith('@mmkv_') && // Skip MMKV-specific keys
               !key.startsWith('@secure_') && // Skip secure storage keys
               !key.includes('migration') && // Skip migration keys
               key.startsWith('@pharmaguide_'); // Only migrate our app keys
      });

      logger.info('database', `Migrating ${keysToMigrate.length} keys`);

      // Migrate in batches to avoid blocking the main thread
      const batchSize = 10;
      for (let i = 0; i < keysToMigrate.length; i += batchSize) {
        const batch = keysToMigrate.slice(i, i + batchSize);
        
        try {
          // Get values for this batch
          const keyValuePairs = await AsyncStorage.multiGet(batch);
          
          for (const [key, value] of keyValuePairs) {
            if (value !== null) {
              try {
                // Determine the appropriate storage tier based on key
                const storageKey = this.mapKeyToStorageTier(key);
                await unifiedStorage.setItem(storageKey, value);
                result.migratedKeys.push(key);
                
                // Remove from AsyncStorage after successful migration
                await AsyncStorage.removeItem(key);
              } catch (error) {
                logger.warn('database', `Failed to migrate key: ${key}`, error as Error);
                result.failedKeys.push(key);
              }
            }
          }
        } catch (batchError) {
          logger.error('database', 'Failed to migrate batch', batchError as Error);
          result.failedKeys.push(...batch);
        }

        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Mark migration as complete
      await this.markMigrationComplete();
      result.success = true;

      logger.info('database', 'Migration completed', {
        migrated: result.migratedKeys.length,
        failed: result.failedKeys.length,
        total: result.totalKeys,
      });

    } catch (error) {
      logger.error('database', 'Migration failed', error as Error);
      result.success = false;
    }

    return result;
  }

  /**
   * Map old keys to new storage tier keys
   */
  private static mapKeyToStorageTier(oldKey: string): string {
    // Remove the @pharmaguide_ prefix
    const cleanKey = oldKey.replace('@pharmaguide_', '');

    // Map specific keys to their appropriate storage tiers
    const keyMappings: Record<string, string> = {
      'health_profile': 'health_profile',
      'setup_progress': 'setup_progress',
      'user_preferences': 'user_preferences',
      'auth_tokens': 'auth_tokens',
      'scan_history': 'scan_history',
      'product_cache': 'product_cache',
      'analytics': 'analytics',
    };

    // Check if we have a specific mapping
    if (keyMappings[cleanKey]) {
      return keyMappings[cleanKey];
    }

    // Default mapping based on key patterns
    if (cleanKey.includes('health') || cleanKey.includes('profile') || cleanKey.includes('medical')) {
      return `health_profile_${cleanKey}`;
    }

    if (cleanKey.includes('auth') || cleanKey.includes('token') || cleanKey.includes('session')) {
      return `auth_tokens_${cleanKey}`;
    }

    if (cleanKey.includes('scan') || cleanKey.includes('barcode')) {
      return `scan_history_${cleanKey}`;
    }

    if (cleanKey.includes('product') || cleanKey.includes('supplement')) {
      return `product_cache_${cleanKey}`;
    }

    if (cleanKey.includes('analytics') || cleanKey.includes('metrics') || cleanKey.includes('events')) {
      return `analytics_${cleanKey}`;
    }

    // Default to app_cache for everything else
    return `app_cache_${cleanKey}`;
  }

  /**
   * Clean up old storage data after successful migration
   */
  static async cleanupOldStorage(): Promise<void> {
    try {
      logger.info('database', 'Cleaning up old storage data');

      // Get all keys from AsyncStorage
      const allKeys = await AsyncStorage.getAllKeys();
      
      // Remove all pharmaguide keys (they should have been migrated)
      const pharmaguideKeys = allKeys.filter(key => 
        key.startsWith('@pharmaguide_') && 
        !key.includes('migration')
      );

      if (pharmaguideKeys.length > 0) {
        await AsyncStorage.multiRemove(pharmaguideKeys);
        logger.info('database', `Cleaned up ${pharmaguideKeys.length} old keys`);
      }

    } catch (error) {
      logger.error('database', 'Failed to cleanup old storage', error as Error);
    }
  }

  /**
   * Rollback migration if needed
   */
  static async rollbackMigration(): Promise<void> {
    try {
      logger.warn('database', 'Rolling back storage migration');

      // Remove migration complete flag
      await unifiedStorage.removeItem(this.MIGRATION_COMPLETE_KEY);

      // Note: This is a destructive operation and should be used carefully
      // In a real implementation, you might want to backup data first
      logger.warn('database', 'Migration rollback completed');
    } catch (error) {
      logger.error('database', 'Failed to rollback migration', error as Error);
    }
  }
} 