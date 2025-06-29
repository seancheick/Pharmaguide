// src/services/scanService.ts
// 🚀 UNIFIED SCAN SERVICE: Synchronizes local cache and database storage

import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants';
import type { Product, ProductAnalysis } from '../types';
import { scanService as dbScanService } from './database';
import { gamificationService } from './gamification/gamificationService';
import { performanceMonitor } from './performance/performanceMonitor';

export interface RecentScan {
  id: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  score: number;
  hasInteraction: boolean;
  scannedAt: string;
  evidence?: 'A' | 'B' | 'C' | 'D';
  dosage?: string;
  description?: string;
  scanType?: 'barcode' | 'ocr' | 'voice' | 'manual';
  productId?: string;
}

export interface UnifiedScanResult {
  recentScan: RecentScan;
  dbScanId?: string;
  synced: boolean;
}

class UnifiedScanService {
  private syncQueue: (() => Promise<void>)[] = [];
  private isSyncing = false;

  /**
   * 🎯 MAIN ENTRY POINT: Save scan to both local cache and database
   */
  async saveScan(
    product: Product,
    analysis: ProductAnalysis,
    scanType: 'barcode' | 'ocr' | 'voice' | 'manual' = 'barcode',
    userId?: string
  ): Promise<UnifiedScanResult> {
    // Use performance monitor correctly
    performanceMonitor.startMeasure('scan_save', { scanType, hasInteractions: analysis.stackInteraction?.interactions?.length > 0 });
    
    try {
      // 1. Create recent scan object
      const recentScan = this.createRecentScan(product, analysis, scanType);
      
      // 2. Save to local cache immediately (for fast UI updates)
      await this.saveToRecentScans(recentScan);
      
      // 3. Queue database sync (for persistence and analytics)
      this.queueDatabaseSync(recentScan, userId);
      
      // 4. Update gamification
      await this.updateGamification(analysis);
      
      // 5. End performance monitoring
      performanceMonitor.endMeasure('scan_save', 'scan');

      return {
        recentScan,
        synced: false // Will be synced in background
      };
    } catch (error) {
      console.error('❌ Error saving scan:', error);
      performanceMonitor.endMeasure('scan_save', 'scan');
      throw error;
    }
  }

  /**
   * 📱 Save to local cache (AsyncStorage)
   */
  private async saveToRecentScans(scan: RecentScan): Promise<void> {
    try {
      const existingScans = await AsyncStorage.getItem(STORAGE_KEYS.RECENT_SCANS);
      let scans = existingScans ? JSON.parse(existingScans) : [];

      // Clean up invalid entries
      scans = scans.filter((s: any) => 
        s.name !== 'Product Not Found' && 
        s.brand !== 'Unknown' &&
        s.score > 0
      );

      // Remove duplicate by name and brand
      scans = scans.filter((s: any) => 
        !(s.name === scan.name && s.brand === scan.brand)
      );

      // Add new scan at the beginning
      const updatedScans = [scan, ...scans].slice(0, 50); // Keep last 50 scans
      
      await AsyncStorage.setItem(STORAGE_KEYS.RECENT_SCANS, JSON.stringify(updatedScans));
      console.log('✅ Scan saved to local cache:', scan.name);
    } catch (error) {
      console.error('❌ Error saving to local cache:', error);
      throw error;
    }
  }

  /**
   * 🗄️ Queue database sync (background operation)
   */
  private queueDatabaseSync(scan: RecentScan, userId?: string): void {
    this.syncQueue.push(async () => {
      try {
        const dbScan = await dbScanService.recordScan(
          userId || null,
          scan.productId || null,
          scan.scanType || 'barcode',
          scan.score
        );
        
        if (dbScan) {
          console.log('✅ Scan synced to database:', scan.name);
          return dbScan.id;
        }
      } catch (error) {
        console.error('❌ Database sync failed:', error);
        // Don't throw - this is a background operation
      }
    });

    // Process queue if not already running
    if (!this.isSyncing) {
      this.processSyncQueue();
    }
  }

  /**
   *  Process sync queue
   */
  private async processSyncQueue(): Promise<void> {
    if (this.isSyncing || this.syncQueue.length === 0) return;

    this.isSyncing = true;
    
    try {
      while (this.syncQueue.length > 0) {
        const syncOperation = this.syncQueue.shift();
        if (syncOperation) {
          await syncOperation();
        }
      }
    } catch (error) {
      console.error('❌ Error processing sync queue:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * 🎮 Update gamification
   */
  private async updateGamification(analysis: ProductAnalysis): Promise<void> {
    try {
      await gamificationService.awardPoints('DAILY_SCAN');
      await gamificationService.updateStreak();

      if (analysis.overallScore >= 70) {
        await gamificationService.awardPoints('SAFE_PRODUCT');
      }

      if (analysis.stackInteraction?.overallRiskLevel !== 'NONE') {
        await gamificationService.awardPoints('INTERACTION_FOUND');
      }
    } catch (error) {
      console.error('❌ Error updating gamification:', error);
    }
  }

  /**
   * 📊 Get recent scans from local cache
   */
  async getRecentScans(limit: number = 20): Promise<RecentScan[]> {
    try {
      const storedScans = await AsyncStorage.getItem(STORAGE_KEYS.RECENT_SCANS);
      if (!storedScans) return [];

      const scans = JSON.parse(storedScans);
      return scans.slice(0, limit);
    } catch (error) {
      console.error('❌ Error loading recent scans:', error);
      return [];
    }
  }

  /**
   * 🗑️ Delete scan from both local cache and database
   */
  async deleteScan(scanId: string, userId?: string): Promise<void> {
    try {
      // Remove from local cache
      const scans = await this.getRecentScans();
      const updatedScans = scans.filter(scan => scan.id !== scanId);
      await AsyncStorage.setItem(STORAGE_KEYS.RECENT_SCANS, JSON.stringify(updatedScans));

      // Remove from database if user is logged in
      if (userId) {
        // Note: Database deletion would require additional API endpoint
        console.log('️ Scan deleted from local cache:', scanId);
      }
    } catch (error) {
      console.error('❌ Error deleting scan:', error);
      throw error;
    }
  }

  /**
   * 🔄 Sync local cache with database
   */
  async syncWithDatabase(userId: string): Promise<void> {
    try {
      // Get database scans
      const dbScans = await dbScanService.getUserScanHistory(userId, 50);
      
      // Get local scans
      const localScans = await this.getRecentScans(50);
      
      // Merge and deduplicate
      const mergedScans = this.mergeScans(localScans, dbScans);
      
      // Save merged result
      await AsyncStorage.setItem(STORAGE_KEYS.RECENT_SCANS, JSON.stringify(mergedScans));
      
      console.log('✅ Scans synced with database');
    } catch (error) {
      console.error('❌ Error syncing with database:', error);
    }
  }

  /**
   * 🔗 Merge local and database scans
   */
  private mergeScans(localScans: RecentScan[], dbScans: any[]): RecentScan[] {
    const merged = new Map<string, RecentScan>();
    
    // Add local scans
    localScans.forEach(scan => {
      const key = `${scan.name}_${scan.brand}`;
      merged.set(key, scan);
    });
    
    // Add database scans (if not already present)
    dbScans.forEach(dbScan => {
      const key = `${dbScan.product?.name || 'Unknown'}_${dbScan.product?.brand || 'Unknown'}`;
      if (!merged.has(key)) {
        merged.set(key, this.convertDbScanToRecentScan(dbScan));
      }
    });
    
    // Convert back to array and sort by date
    return Array.from(merged.values())
      .sort((a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime())
      .slice(0, 50);
  }

  /**
   * 🔄 Convert database scan to recent scan format
   */
  private convertDbScanToRecentScan(dbScan: any): RecentScan {
    return {
      id: dbScan.id,
      name: dbScan.product?.name || 'Unknown',
      brand: dbScan.product?.brand || 'Unknown',
      imageUrl: dbScan.product?.imageUrl,
      score: dbScan.analysisScore || 0,
      hasInteraction: false, // Would need to be calculated
      scannedAt: dbScan.scannedAt,
      scanType: dbScan.scanType,
      productId: dbScan.productId,
    };
  }

  /**
   *  Create recent scan object from product and analysis
   */
  private createRecentScan(
    product: Product,
    analysis: ProductAnalysis,
    scanType: 'barcode' | 'ocr' | 'voice' | 'manual'
  ): RecentScan {
    const evidenceLevel = this.determineEvidenceLevel(analysis);
    
    return {
      id: Date.now().toString(),
      name: product.name,
      brand: product.brand,
      imageUrl: product.imageUrl,
      score: analysis.overallScore,
      hasInteraction: analysis.stackInteraction?.overallRiskLevel !== 'NONE',
      evidence: evidenceLevel,
      dosage: product.dosage,
      description: product.description,
      scannedAt: new Date().toISOString(),
      scanType,
      productId: product.id,
    };
  }

  /**
   *  Determine evidence level based on analysis
   */
  private determineEvidenceLevel(analysis: ProductAnalysis): 'A' | 'B' | 'C' | 'D' {
    if (!analysis.stackInteraction?.interactions?.length) {
      return 'D';
    }

    const interactions = analysis.stackInteraction.interactions;
    
    if (interactions.some(i => 
      i.evidenceSources?.some(s => s.text.includes('Clinical'))
    )) {
      return 'A';
    }
    
    if (interactions.some(i => 
      i.evidenceSources?.some(s => s.text.includes('Case'))
    )) {
      return 'B';
    }
    
    return 'C';
  }

  /**
   * 🧹 Clean up invalid scans
   */
  async cleanupInvalidScans(): Promise<void> {
    try {
      const scans = await this.getRecentScans();
      const validScans = scans.filter(scan => 
        scan.name !== 'Product Not Found' && 
        scan.brand !== 'Unknown' &&
        scan.score > 0 &&
        scan.name.trim().length > 0
      );
      
      if (validScans.length !== scans.length) {
        await AsyncStorage.setItem(STORAGE_KEYS.RECENT_SCANS, JSON.stringify(validScans));
        console.log(` Cleaned up ${scans.length - validScans.length} invalid scans`);
      }
    } catch (error) {
      console.error('❌ Error cleaning up scans:', error);
    }
  }
}

export const unifiedScanService = new UnifiedScanService();