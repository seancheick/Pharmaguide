// src/services/storage/asyncStorageAdapter.ts
// Adapter to make AsyncStorage conform to StorageInterface

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StorageInterface } from './storageAdapter';

export class AsyncStorageAdapter implements StorageInterface {
  async getItem(key: string): Promise<string | null> {
    return AsyncStorage.getItem(key);
  }
  async setItem(key: string, value: string): Promise<void> {
    return AsyncStorage.setItem(key, value);
  }
  async removeItem(key: string): Promise<void> {
    return AsyncStorage.removeItem(key);
  }
  async multiGet(keys: string[]): Promise<[string, string | null][]> {
    const result = await AsyncStorage.multiGet(keys);
    // Convert readonly KeyValuePair[] to mutable [string, string | null][]
    return result.map(([k, v]) => [k, v]);
  }
  async multiSet(keyValuePairs: [string, string][]): Promise<void> {
    // Cast to ReadonlyArray for type compatibility
    return AsyncStorage.multiSet(keyValuePairs as readonly [string, string][]);
  }
  async multiRemove(keys: string[]): Promise<void> {
    return AsyncStorage.multiRemove(keys);
  }
  async getAllKeys(): Promise<string[]> {
    const keys = await AsyncStorage.getAllKeys();
    // Convert readonly string[] to mutable string[]
    return [...keys];
  }
  async clear(): Promise<void> {
    return AsyncStorage.clear();
  }
}
