// src/utils/safeStorage.ts

import AsyncStorage from "@react-native-async-storage/async-storage";

// Memory storage fallback for when AsyncStorage fails
const memoryStorage = new Map<string, string>();

/**
 * Safe storage wrapper that gracefully handles AsyncStorage errors
 * Falls back to memory storage during development or when AsyncStorage fails
 */
export const safeStorage = {
  /**
   * Get item from storage
   */
  async getItem(key: string): Promise<string | null> {
    try {
      const safeKey = key.replace(/[^a-zA-Z0-9_]/g, "_");
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
    try {
      const safeKey = key.replace(/[^a-zA-Z0-9_]/g, "_");
      await AsyncStorage.setItem(safeKey, value);
      memoryStorage.set(key, value); // Also store in memory as backup
    } catch (error) {
      console.warn(`SafeStorage: setItem failed for key ${key}:`, error);
      memoryStorage.set(key, value);
    }
  },

  /**
   * Remove item from storage
   */
  async removeItem(key: string): Promise<void> {
    try {
      const safeKey = key.replace(/[^a-zA-Z0-9_]/g, "_");
      await AsyncStorage.removeItem(safeKey);
      memoryStorage.delete(key);
    } catch (error) {
      console.warn(`SafeStorage: removeItem failed for key ${key}:`, error);
      memoryStorage.delete(key);
    }
  },

  /**
   * Remove multiple items from storage
   */
  async multiRemove(keys: string[]): Promise<void> {
    try {
      const safeKeys = keys.map((key) => key.replace(/[^a-zA-Z0-9_]/g, "_"));
      await AsyncStorage.multiRemove(safeKeys);
      keys.forEach((key) => memoryStorage.delete(key));
    } catch (error) {
      console.warn("SafeStorage: multiRemove failed:", error);
      keys.forEach((key) => memoryStorage.delete(key));
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
      console.warn("SafeStorage: getAllKeys failed:", error);
      return Array.from(memoryStorage.keys());
    }
  },

  /**
   * Clear all storage
   */
  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
      memoryStorage.clear();
    } catch (error) {
      console.warn("SafeStorage: clear failed:", error);
      memoryStorage.clear();
    }
  },
};
