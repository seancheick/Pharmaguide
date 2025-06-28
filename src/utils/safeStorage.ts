// src/utils/safeStorage.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import { storageAdapter } from '../services/storage/storageAdapter';

// Memory storage fallback for when storage fails
const memoryStorage = new Map<string, string>();

// Track initialization status
let storageInitialized = false;

/**
 * Initialize storage adapter
 */
const initializeStorage = async (): Promise<void> => {
  if (!storageInitialized) {
    try {
      await storageAdapter.initialize();
      storageInitialized = true;
      console.log('✅ SafeStorage initialized with storage adapter');
    } catch (error) {
      console.warn('⚠️ Storage adapter initialization failed:', error);
      // Will fall back to AsyncStorage
    }
  }
};

/**
 * Safe storage wrapper that gracefully handles storage errors
 * Uses MMKV when available, falls back to AsyncStorage, then memory storage
 */
export const safeStorage = {
  /**
   * Get item from storage
   */
  async getItem(key: string): Promise<string | null> {
    await initializeStorage();

    try {
      const safeKey = key.replace(/[^a-zA-Z0-9_]/g, '_');

      // Try storage adapter first (MMKV or AsyncStorage)
      const result = await storageAdapter.getItem(safeKey);
      if (result !== null) {
        return result;
      }

      // Fallback to direct AsyncStorage
      return await AsyncStorage.getItem(safeKey);
    } catch (error) {
      console.warn(`SafeStorage: getItem failed for key ${key}:`, error);
      return memoryStorage.get(key) || null;
    }
  },

  /**
   * Set item in storage
   */
  async setItem(key: string, value: string): Promise<void> {
    await initializeStorage();

    try {
      const safeKey = key.replace(/[^a-zA-Z0-9_]/g, '_');

      // Try storage adapter first (MMKV or AsyncStorage)
      await storageAdapter.setItem(safeKey, value);
      memoryStorage.set(key, value); // Also store in memory as backup
    } catch (error) {
      console.warn(`SafeStorage: setItem failed for key ${key}:`, error);

      // Fallback to direct AsyncStorage
      try {
        const safeKey = key.replace(/[^a-zA-Z0-9_]/g, '_');
        await AsyncStorage.setItem(safeKey, value);
        memoryStorage.set(key, value);
      } catch (fallbackError) {
        console.warn(
          `SafeStorage: AsyncStorage fallback also failed for key ${key}:`,
          fallbackError
        );
        memoryStorage.set(key, value);
      }
    }
  },

  /**
   * Remove item from storage
   */
  async removeItem(key: string): Promise<void> {
    await initializeStorage();

    try {
      const safeKey = key.replace(/[^a-zA-Z0-9_]/g, '_');

      // Try storage adapter first
      await storageAdapter.removeItem(safeKey);
      memoryStorage.delete(key);
    } catch (error) {
      console.warn(`SafeStorage: removeItem failed for key ${key}:`, error);

      // Fallback to direct AsyncStorage
      try {
        const safeKey = key.replace(/[^a-zA-Z0-9_]/g, '_');
        await AsyncStorage.removeItem(safeKey);
        memoryStorage.delete(key);
      } catch (fallbackError) {
        console.warn(
          `SafeStorage: AsyncStorage fallback also failed for key ${key}:`,
          fallbackError
        );
        memoryStorage.delete(key);
      }
    }
  },

  /**
   * Remove multiple items from storage
   */
  async multiRemove(keys: string[]): Promise<void> {
    try {
      const safeKeys = keys.map(key => key.replace(/[^a-zA-Z0-9_]/g, '_'));
      await AsyncStorage.multiRemove(safeKeys);
      keys.forEach(key => memoryStorage.delete(key));
    } catch (error) {
      console.warn('SafeStorage: multiRemove failed:', error);
      keys.forEach(key => memoryStorage.delete(key));
    }
  },

  /**
   * Get all keys from storage
   */
  async getAllKeys(): Promise<string[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return keys;
    } catch (error) {
      console.warn('SafeStorage: getAllKeys failed:', error);
      return Array.from(memoryStorage.keys());
    }
  },

  /**
   * Clear all storage
   */
  async clear(): Promise<void> {
    await initializeStorage();

    try {
      await storageAdapter.clear();
      memoryStorage.clear();
    } catch (error) {
      console.warn('SafeStorage: clear failed:', error);

      // Fallback to AsyncStorage
      try {
        await AsyncStorage.clear();
        memoryStorage.clear();
      } catch (fallbackError) {
        console.warn(
          'SafeStorage: AsyncStorage clear fallback also failed:',
          fallbackError
        );
        memoryStorage.clear();
      }
    }
  },

  /**
   * Get storage information
   */
  async getStorageInfo(): Promise<{
    type: 'MMKV' | 'AsyncStorage';
    initialized: boolean;
    encrypted: boolean;
    size?: number;
  }> {
    await initializeStorage();

    try {
      const info = storageAdapter.getStorageInfo();
      return {
        ...info,
        initialized: storageInitialized,
      };
    } catch (error) {
      return {
        type: 'AsyncStorage',
        initialized: false,
        encrypted: false,
      };
    }
  },
};
