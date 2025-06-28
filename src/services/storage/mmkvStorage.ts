// MMKV Storage Implementation with Migration Support

import AsyncStorage from '@react-native-async-storage/async-storage';

// Dynamic import for MMKV to handle cases where it might not be available
import type { MMKV as MMKVType, MMKVConfiguration } from 'react-native-mmkv';
let MMKVClass: typeof import('react-native-mmkv').MMKV | undefined;
let isMMKVAvailable = false;

try {
  // Use dynamic import for ESM compatibility
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  // @ts-ignore
  const mmkvModule = require('react-native-mmkv');
  if (mmkvModule && mmkvModule.MMKV) {
    MMKVClass = mmkvModule.MMKV;
    isMMKVAvailable = true;
    console.log('✅ MMKV module loaded successfully');
  } else {
    console.warn('⚠️ MMKV module found but MMKV class not available');
  }
} catch (error: unknown) {
  let message = '';
  if (error instanceof Error) {
    message = error.message;
  } else {
    message = String(error);
  }
  console.warn(
    '⚠️ MMKV not available, will use AsyncStorage fallback:',
    message
  );
}

interface MMKVConfig {
  id: string;
  encryptionKey?: string;
  path?: string;
}

interface MigrationProgress {
  totalKeys: number;
  migratedKeys: number;
  failedKeys: string[];
  completed: boolean;
}

/**
 * MMKV Storage Service with AsyncStorage Migration
 * Provides high-performance storage with encryption support
 */
export class MMKVStorage {
  private mmkv: MMKVType | undefined;
  private migrationCompleted: boolean = false;
  private readonly MIGRATION_KEY = '@mmkv_migration_completed';
  private isAvailable: boolean = false;

  constructor(config: MMKVConfig) {
    if (isMMKVAvailable && MMKVClass) {
      try {
        console.log('🚀 Initializing MMKV storage...');
        const mmkvConfig: MMKVConfiguration = {
          id: config.id,
          encryptionKey: config.encryptionKey,
          path: config.path,
        };
        // Initialize MMKV instance
        this.mmkv = new MMKVClass(mmkvConfig);
        this.isAvailable = true;
        console.log('✅ MMKV storage initialized successfully');
      } catch (error) {
        console.warn('❌ Failed to initialize MMKV:', error);
        this.isAvailable = false;
      }
    } else {
      console.warn(
        '⚠️ MMKV not available, storage operations will use fallback'
      );
      this.isAvailable = false;
    }
  }

  /**
   * Initialize MMKV storage with migration from AsyncStorage
   */
  async initialize(): Promise<void> {
    console.log('🚀 Initializing MMKV storage...');

    if (!this.isAvailable) {
      console.warn('⚠️ MMKV not available, skipping initialization');
      return;
    }

    // Check if migration was already completed
    const migrationStatus = await AsyncStorage.getItem(this.MIGRATION_KEY);
    this.migrationCompleted = migrationStatus === 'true';

    if (!this.migrationCompleted) {
      await this.migrateFromAsyncStorage();
    }

    console.log('✅ MMKV storage initialized successfully');
  }

  /**
   * Migrate data from AsyncStorage to MMKV
   */
  private async migrateFromAsyncStorage(): Promise<MigrationProgress> {
    console.log('🔄 Starting AsyncStorage to MMKV migration...');

    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const progress: MigrationProgress = {
        totalKeys: allKeys.length,
        migratedKeys: 0,
        failedKeys: [],
        completed: false,
      };

      // Filter out keys we don't want to migrate
      const keysToMigrate = allKeys.filter(
        key =>
          !key.startsWith('@mmkv_') && // Skip MMKV-specific keys
          !key.includes('secure_') && // Skip secure storage keys
          key.startsWith('@pharmaguide_') // Only migrate our app keys
      );

      console.log(
        `📦 Migrating ${keysToMigrate.length} keys from AsyncStorage...`
      );

      // Migrate in batches to avoid blocking the main thread
      const batchSize = 50;
      for (let i = 0; i < keysToMigrate.length; i += batchSize) {
        const batch = keysToMigrate.slice(i, i + batchSize);
        try {
          // Batch read values for this batch
          const keyValuePairs = await AsyncStorage.multiGet(batch);
          for (const [key, value] of keyValuePairs) {
            try {
              if (value !== null && this.mmkv) {
                this.mmkv.set(key, value);
                progress.migratedKeys++;
              }
            } catch (error) {
              console.warn(`Failed to migrate key ${key}:`, error);
              progress.failedKeys.push(key);
            }
          }
        } catch (batchError) {
          console.warn('Failed to batch migrate keys:', batch, batchError);
          progress.failedKeys.push(...batch);
        }
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // Mark migration as completed
      await AsyncStorage.setItem(this.MIGRATION_KEY, 'true');
      this.migrationCompleted = true;
      progress.completed = true;

      console.log(
        `✅ Migration completed: ${progress.migratedKeys}/${progress.totalKeys} keys migrated`
      );

      if (progress.failedKeys.length > 0) {
        console.warn(
          `⚠️ Failed to migrate ${progress.failedKeys.length} keys:`,
          progress.failedKeys
        );
      }

      return progress;
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  private getMMKV(): MMKVType {
    if (!this.mmkv) {
      throw new Error('MMKV instance is not initialized');
    }
    return this.mmkv;
  }

  /**
   * Get item from storage (synchronous)
   */
  getString(key: string): string | undefined {
    if (!this.isAvailable) {
      return undefined;
    }
    try {
      return this.getMMKV().getString(key);
    } catch (error) {
      console.warn(`MMKV getString failed for key ${key}:`, error);
      return undefined;
    }
  }

  /**
   * Set item in storage (synchronous)
   */
  setString(key: string, value: string): void {
    if (!this.isAvailable) {
      throw new Error('MMKV not available');
    }
    try {
      this.getMMKV().set(key, value);
    } catch (error) {
      console.warn(`MMKV setString failed for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Check if MMKV is available and initialized
   */
  isMMKVAvailable(): boolean {
    return this.isAvailable;
  }

  /**
   * Get boolean from storage
   */
  getBoolean(key: string): boolean | undefined {
    if (!this.isAvailable) {
      return undefined;
    }
    try {
      return this.getMMKV().getBoolean(key);
    } catch (error) {
      console.warn(`MMKV getBoolean failed for key ${key}:`, error);
      return undefined;
    }
  }

  /**
   * Set boolean in storage
   */
  setBoolean(key: string, value: boolean): void {
    if (!this.isAvailable) {
      throw new Error('MMKV not available');
    }
    try {
      this.getMMKV().set(key, value);
    } catch (error) {
      console.warn(`MMKV setBoolean failed for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get number from storage
   */
  getNumber(key: string): number | undefined {
    if (!this.isAvailable) {
      return undefined;
    }
    try {
      return this.getMMKV().getNumber(key);
    } catch (error) {
      console.warn(`MMKV getNumber failed for key ${key}:`, error);
      return undefined;
    }
  }

  /**
   * Set number in storage
   */
  setNumber(key: string, value: number): void {
    if (!this.isAvailable) {
      throw new Error('MMKV not available');
    }
    try {
      this.getMMKV().set(key, value);
    } catch (error) {
      console.warn(`MMKV setNumber failed for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get object from storage (with JSON parsing)
   */
  getObject<T>(key: string): T | undefined {
    if (!this.isAvailable) {
      return undefined;
    }
    try {
      const value = this.getMMKV().getString(key);
      return value ? JSON.parse(value) : undefined;
    } catch (error) {
      console.warn(`MMKV getObject failed for key ${key}:`, error);
      return undefined;
    }
  }

  /**
   * Set object in storage (with JSON serialization)
   */
  setObject<T>(key: string, value: T): void {
    if (!this.isAvailable) {
      throw new Error('MMKV not available');
    }
    try {
      this.getMMKV().set(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`MMKV setObject failed for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Remove item from storage
   */
  delete(key: string): void {
    if (!this.isAvailable) {
      return;
    }
    try {
      this.getMMKV().delete(key);
    } catch (error) {
      console.warn(`MMKV delete failed for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Check if key exists
   */
  contains(key: string): boolean {
    if (!this.isAvailable) {
      return false;
    }
    try {
      return this.getMMKV().contains(key);
    } catch (error) {
      console.warn(`MMKV contains failed for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get all keys
   */
  async getAllKeys(): Promise<string[]> {
    if (!this.isAvailable) {
      return [];
    }
    try {
      return this.getMMKV().getAllKeys();
    } catch (error) {
      console.warn('MMKV getAllKeys failed:', error);
      return [];
    }
  }

  /**
   * Clear all data
   */
  clearAll(): void {
    if (!this.isAvailable) {
      return;
    }
    try {
      this.getMMKV().clearAll();
    } catch (error) {
      console.warn('MMKV clearAll failed:', error);
      throw error;
    }
  }

  /**
   * Get storage size in bytes
   */
  size(): number {
    if (!this.isAvailable) {
      return 0;
    }
    try {
      const keys = this.getMMKV().getAllKeys();
      let totalSize = 0;
      for (const key of keys) {
        const value = this.getMMKV().getString(key);
        if (value) {
          totalSize += key.length + value.length;
        }
      }
      return totalSize * 2; // UTF-16 approximation
    } catch (error) {
      console.warn('MMKV size calculation failed:', error);
      return 0;
    }
  }

  /**
   * AsyncStorage-compatible interface for drop-in replacement
   */
  async getItem(key: string): Promise<string | null> {
    if (!this.isAvailable) {
      return null;
    }
    return this.getString(key) || null;
  }

  async setItem(key: string, value: string): Promise<void> {
    if (!this.isAvailable) {
      throw new Error('MMKV not available');
    }
    this.setString(key, value);
  }

  async removeItem(key: string): Promise<void> {
    if (!this.isAvailable) {
      return;
    }
    this.delete(key);
  }

  async multiGet(keys: string[]): Promise<[string, string | null][]> {
    if (!this.isAvailable) {
      return keys.map(key => [key, null]);
    }
    return keys.map(key => [key, this.getString(key) || null]);
  }

  async multiSet(keyValuePairs: [string, string][]): Promise<void> {
    if (!this.isAvailable) {
      throw new Error('MMKV not available');
    }
    keyValuePairs.forEach(([key, value]) => this.setString(key, value));
  }

  async multiRemove(keys: string[]): Promise<void> {
    if (!this.isAvailable) {
      return;
    }
    keys.forEach(key => this.delete(key));
  }

  async clear(): Promise<void> {
    if (!this.isAvailable) {
      return;
    }
    this.clearAll();
  }
}
