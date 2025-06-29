// src/utils/cleanupStorage.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/storage';

/**
 * Clean up invalid "Product Not Found" entries from recent scans
 */
export const cleanupRecentScans = async (): Promise<void> => {
  try {
    const existingScans = await AsyncStorage.getItem(STORAGE_KEYS.RECENT_SCANS);
    if (!existingScans) return;

    const scans = JSON.parse(existingScans);
    const validScans = scans.filter((scan: any) => 
      scan.name !== 'Product Not Found' && 
      scan.brand !== 'Unknown' &&
      scan.score > 0
    );

    if (validScans.length !== scans.length) {
      await AsyncStorage.setItem(STORAGE_KEYS.RECENT_SCANS, JSON.stringify(validScans));
      console.log(`🧹 Cleaned up ${scans.length - validScans.length} invalid scan entries`);
    }
  } catch (error) {
    console.error('Error cleaning up recent scans:', error);
  }
};

/**
 * Initialize storage cleanup on app start
 */
export const initializeStorageCleanup = async (): Promise<void> => {
  try {
    await cleanupRecentScans();
    console.log('✅ Storage cleanup completed');
  } catch (error) {
    console.error('❌ Storage cleanup failed:', error);
  }
};
