// src/services/storage/storageAdapter.ts
// Universal Storage Adapter with MMKV Migration Support

import { MMKVStorage } from './mmkvStorage';
import { AsyncStorageAdapter } from './asyncStorageAdapter';

export interface StorageInterface {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  multiGet(keys: string[]): Promise<[string, string | null][]>;
  multiSet(keyValuePairs: [string, string][]): Promise<void>;
  multiRemove(keys: string[]): Promise<void>;
  getAllKeys(): Promise<string[]>;
  clear(): Promise<void>;
}

interface StorageConfig {
  useMMKV: boolean;
  encryptionKey?: string;
  fallbackToAsyncStorage: boolean;
  migrationEnabled: boolean;
}

/**
 * Universal Storage Adapter
 * Provides seamless switching between AsyncStorage and MMKV
 */
export class StorageAdapter implements StorageInterface {
  private storage: StorageInterface;
  private storageType: 'MMKV' | 'AsyncStorage';
  private mmkvStorage?: MMKVStorage;
  private config: StorageConfig;
  private initialized: boolean = false;

  constructor(config: Partial<StorageConfig> = {}) {
    this.config = {
      useMMKV: true, // Default to MMKV for better performance
      fallbackToAsyncStorage: true,
      migrationEnabled: true,
      ...config,
    };

    // Initialize storage based on configuration
    this.storage = new AsyncStorageAdapter(); // Use adapter
    this.storageType = 'AsyncStorage';
  }

  /**
   * Initialize the storage adapter
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      if (this.config.useMMKV) {
        console.log('🔄 Attempting to initialize MMKV storage...');

        // Try to initialize MMKV
        this.mmkvStorage = new MMKVStorage({
          id: 'pharmaguide-main',
          encryptionKey: this.config.encryptionKey,
        });

        // Check if MMKV is actually available
        if (this.mmkvStorage.isMMKVAvailable()) {
          if (this.config.migrationEnabled) {
            await this.mmkvStorage.initialize();
          }

          this.storage = this.mmkvStorage;
          this.storageType = 'MMKV';
          console.log('✅ Storage adapter using MMKV');
        } else {
          throw new Error('MMKV not available in this environment');
        }
      } else {
        console.log('📱 Using AsyncStorage (MMKV disabled in config)');
      }
    } catch (error: unknown) {
      let message = '';
      if (error instanceof Error) {
        message = error.message;
      } else {
        message = String(error);
      }
      console.warn(
        '⚠️ MMKV initialization failed, falling back to AsyncStorage:',
        message
      );

      if (!this.config.fallbackToAsyncStorage) {
        throw error;
      }

      this.storage = new AsyncStorageAdapter();
      this.storageType = 'AsyncStorage';
      console.log('📱 Storage adapter using AsyncStorage fallback');
    }

    this.initialized = true;
  }

  /**
   * Get item from storage
   */
  async getItem(key: string): Promise<string | null> {
    await this.ensureInitialized();

    try {
      return await this.storage.getItem(key);
    } catch (error) {
      console.warn(`Storage getItem failed for key ${key}:`, error);

      // Fallback to AsyncStorage if MMKV fails
      if (
        this.storageType !== 'AsyncStorage' &&
        this.config.fallbackToAsyncStorage
      ) {
        try {
          return await new AsyncStorageAdapter().getItem(key);
        } catch (fallbackError) {
          console.warn(
            `AsyncStorage fallback also failed for key ${key}:`,
            fallbackError
          );
        }
      }

      return null;
    }
  }

  /**
   * Set item in storage
   */
  async setItem(key: string, value: string): Promise<void> {
    await this.ensureInitialized();

    try {
      await this.storage.setItem(key, value);
    } catch (error) {
      console.warn(`Storage setItem failed for key ${key}:`, error);

      if (
        this.storageType !== 'AsyncStorage' &&
        this.config.fallbackToAsyncStorage
      ) {
        try {
          await new AsyncStorageAdapter().setItem(key, value);
        } catch (fallbackError) {
          console.warn(
            `AsyncStorage fallback also failed for key ${key}:`,
            fallbackError
          );
          throw fallbackError;
        }
      } else {
        throw error;
      }
    }
  }

  /**
   * Remove item from storage
   */
  async removeItem(key: string): Promise<void> {
    await this.ensureInitialized();

    try {
      await this.storage.removeItem(key);
    } catch (error) {
      console.warn(`Storage removeItem failed for key ${key}:`, error);

      if (
        this.storageType !== 'AsyncStorage' &&
        this.config.fallbackToAsyncStorage
      ) {
        try {
          await new AsyncStorageAdapter().removeItem(key);
        } catch (fallbackError) {
          console.warn(
            `AsyncStorage fallback also failed for key ${key}:`,
            fallbackError
          );
        }
      }
    }
  }

  /**
   * Get multiple items from storage
   */
  async multiGet(keys: string[]): Promise<[string, string | null][]> {
    await this.ensureInitialized();

    try {
      return await this.storage.multiGet(keys);
    } catch (error) {
      console.warn('Storage multiGet failed:', error);

      if (
        this.storageType !== 'AsyncStorage' &&
        this.config.fallbackToAsyncStorage
      ) {
        try {
          return await new AsyncStorageAdapter().multiGet(keys);
        } catch (fallbackError) {
          console.warn(
            'AsyncStorage multiGet fallback also failed:',
            fallbackError
          );
        }
      }

      return keys.map(key => [key, null]);
    }
  }

  /**
   * Set multiple items in storage
   */
  async multiSet(keyValuePairs: [string, string][]): Promise<void> {
    await this.ensureInitialized();

    try {
      await this.storage.multiSet(keyValuePairs);
    } catch (error) {
      console.warn('Storage multiSet failed:', error);

      if (
        this.storageType !== 'AsyncStorage' &&
        this.config.fallbackToAsyncStorage
      ) {
        try {
          await new AsyncStorageAdapter().multiSet(keyValuePairs);
        } catch (fallbackError) {
          console.warn(
            'AsyncStorage multiSet fallback also failed:',
            fallbackError
          );
          throw fallbackError;
        }
      } else {
        throw error;
      }
    }
  }

  /**
   * Remove multiple items from storage
   */
  async multiRemove(keys: string[]): Promise<void> {
    await this.ensureInitialized();

    try {
      await this.storage.multiRemove(keys);
    } catch (error) {
      console.warn('Storage multiRemove failed:', error);

      if (
        this.storageType !== 'AsyncStorage' &&
        this.config.fallbackToAsyncStorage
      ) {
        try {
          await new AsyncStorageAdapter().multiRemove(keys);
        } catch (fallbackError) {
          console.warn(
            'AsyncStorage multiRemove fallback also failed:',
            fallbackError
          );
        }
      }
    }
  }

  /**
   * Get all keys from storage
   */
  async getAllKeys(): Promise<string[]> {
    await this.ensureInitialized();

    try {
      return await this.storage.getAllKeys();
    } catch (error) {
      console.warn('Storage getAllKeys failed:', error);

      if (
        this.storageType !== 'AsyncStorage' &&
        this.config.fallbackToAsyncStorage
      ) {
        try {
          return await new AsyncStorageAdapter().getAllKeys();
        } catch (fallbackError) {
          console.warn(
            'AsyncStorage getAllKeys fallback also failed:',
            fallbackError
          );
        }
      }

      return [];
    }
  }

  /**
   * Clear all data from storage
   */
  async clear(): Promise<void> {
    await this.ensureInitialized();

    try {
      await this.storage.clear();
    } catch (error) {
      console.warn('Storage clear failed:', error);

      if (
        this.storageType !== 'AsyncStorage' &&
        this.config.fallbackToAsyncStorage
      ) {
        try {
          await new AsyncStorageAdapter().clear();
        } catch (fallbackError) {
          console.warn(
            'AsyncStorage clear fallback also failed:',
            fallbackError
          );
          throw fallbackError;
        }
      } else {
        throw error;
      }
    }
  }

  /**
   * Get storage statistics
   */
  getStorageInfo(): {
    type: 'MMKV' | 'AsyncStorage';
    encrypted: boolean;
    size?: number;
  } {
    return {
      type: this.mmkvStorage ? 'MMKV' : 'AsyncStorage',
      encrypted: !!this.config.encryptionKey,
      size: this.mmkvStorage?.size(),
    };
  }

  /**
   * Ensure storage is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }
}

// Global storage adapter instance
export const storageAdapter = new StorageAdapter({
  useMMKV: true, // Try MMKV first
  encryptionKey: undefined, // Will be set during initialization if needed
  fallbackToAsyncStorage: true, // Always fallback gracefully
  migrationEnabled: false, // Disable migration for now to avoid issues
});

// Initialize storage adapter
export const initializeStorage = async (): Promise<void> => {
  try {
    await storageAdapter.initialize();
    console.log('✅ Storage adapter initialized successfully');
  } catch (error) {
    console.warn('⚠️ Storage adapter initialization had issues:', error);
    // Continue anyway, fallback should handle it
  }
};
