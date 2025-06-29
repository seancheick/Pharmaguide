import { logger } from '../monitoring/logger';
import { STORAGE_CONFIG, StorageTier } from './storageHierarchy';
import { MMKVStorage } from './mmkvStorage';
import { SecureStorage } from './secureStorage';
import { supabaseStorage } from './supabaseStorage';

// Create instances
const mmkvStorage = new MMKVStorage({ id: 'pharmaguide_unified' });
const secureStorage = new SecureStorage();

export class UnifiedStorageService {
  async getItem(key: string): Promise<string | null> {
    try {
      const config = STORAGE_CONFIG[key] || STORAGE_CONFIG['app_cache'];
      
      switch (config.tier) {
        case StorageTier.SECURE:
          // Use generic secure storage methods for non-health data
          return await secureStorage.getItem(key);
        case StorageTier.LOCAL:
          return mmkvStorage.getItem(key);
        case StorageTier.CLOUD:
          return await supabaseStorage.getItem(key);
        default:
          return mmkvStorage.getItem(key);
      }
    } catch (error) {
      logger.error('database', `Failed to get item: ${key}`, error as Error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      const config = STORAGE_CONFIG[key] || STORAGE_CONFIG['app_cache'];
      
      switch (config.tier) {
        case StorageTier.SECURE:
          await secureStorage.setItem(key, value);
          break;
        case StorageTier.LOCAL:
          mmkvStorage.setItem(key, value);
          break;
        case StorageTier.CLOUD:
          await supabaseStorage.setItem(key, value);
          break;
        default:
          mmkvStorage.setItem(key, value);
      }
    } catch (error) {
      logger.error('database', `Failed to set item: ${key}`, error as Error);
      throw error;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      const config = STORAGE_CONFIG[key] || STORAGE_CONFIG['app_cache'];
      
      switch (config.tier) {
        case StorageTier.SECURE:
          await secureStorage.removeItem(key);
          break;
        case StorageTier.LOCAL:
          mmkvStorage.removeItem(key);
          break;
        case StorageTier.CLOUD:
          await supabaseStorage.removeItem(key);
          break;
        default:
          mmkvStorage.removeItem(key);
      }
    } catch (error) {
      logger.error('database', `Failed to remove item: ${key}`, error as Error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      await secureStorage.cleanup();
      mmkvStorage.clear();
      await supabaseStorage.clear();
    } catch (error) {
      logger.error('database', 'Failed to clear storage', error as Error);
      throw error;
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      const secureKeys: string[] = []; // Secure storage doesn't have a simple getAllKeys method
      const localKeys = await mmkvStorage.getAllKeys();
      const cloudKeys = await supabaseStorage.getAllKeys();
      
      return [...secureKeys, ...localKeys, ...cloudKeys];
    } catch (error) {
      logger.error('database', 'Failed to get all keys', error as Error);
      return [];
    }
  }

  async migrateData(fromKey: string, toKey: string): Promise<void> {
    try {
      const value = await this.getItem(fromKey);
      if (value) {
        await this.setItem(toKey, value);
        await this.removeItem(fromKey);
        logger.info('database', `Migrated data from ${fromKey} to ${toKey}`);
      }
    } catch (error) {
      logger.error('database', `Failed to migrate data from ${fromKey} to ${toKey}`, error as Error);
      throw error;
    }
  }
}

// Export singleton instance
export const unifiedStorage = new UnifiedStorageService(); 