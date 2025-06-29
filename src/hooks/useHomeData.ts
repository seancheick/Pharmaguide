// src/hooks/useHomeData.ts
// 🚀 ENHANCED: Unified home data management with improved scan handling

import { useState, useEffect, useCallback } from 'react';
import { unifiedScanService, type RecentScan } from '../services/scanService';
import { gamificationService } from '../services/gamification/gamificationService';

interface GameStats {
  totalScans: number;
  safeProducts: number;
  interactionsFound: number;
  currentStreak: number;
  points: number; // Changed from totalPoints to match UnifiedGamificationCard
  level: number;
  levelTitle: string; // Added levelTitle for UnifiedGamificationCard
}

export const useHomeData = () => {
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  const [gameStats, setGameStats] = useState<GameStats>({
    totalScans: 0,
    safeProducts: 0,
    interactionsFound: 0,
    currentStreak: 0,
    points: 0,
    level: 1,
    levelTitle: 'Beginner',
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 🎯 Load recent scans using unified service
  const loadRecentScans = useCallback(async (): Promise<RecentScan[]> => {
    try {
      const scans = await unifiedScanService.getRecentScans(20);
      console.log('📱 Loaded recent scans:', scans.length);
      return scans;
    } catch (error) {
      console.error('❌ Error loading recent scans:', error);
      setError('Failed to load recent scans');
      return [];
    }
  }, []);

  // 🎯 Load game statistics - FIXED: Use correct method name
  const loadGameStats = useCallback(async (): Promise<GameStats> => {
    try {
      const progress = await gamificationService.getUserProgress();
      
      // Access statistics from the progress object
      const stats = progress.statistics;
      
      // Generate level title based on level
      const getLevelTitle = (level: number): string => {
        if (level >= 10) return 'Expert';
        if (level >= 5) return 'Advanced';
        if (level >= 3) return 'Intermediate';
        return 'Beginner';
      };

      return {
        totalScans: stats.totalScans,
        safeProducts: stats.safeProducts,
        interactionsFound: stats.interactionsFound,
        currentStreak: progress.streak.current,
        points: progress.points,
        level: progress.level,
        levelTitle: getLevelTitle(progress.level),
      };
    } catch (error) {
      console.error('❌ Error loading game stats:', error);
      return {
        totalScans: 0,
        safeProducts: 0,
        interactionsFound: 0,
        currentStreak: 0,
        points: 0,
        level: 1,
        levelTitle: 'Beginner',
      };
    }
  }, []);

  // 🎯 Load all data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [scans, stats] = await Promise.all([
        loadRecentScans(),
        loadGameStats(),
      ]);

      setRecentScans(scans);
      setGameStats(stats);
    } catch (error) {
      console.error('❌ Error loading home data:', error);
      setError('Failed to load home data');
    } finally {
      setLoading(false);
    }
  }, [loadRecentScans, loadGameStats]);

  // 🎯 Refresh data
  const refreshData = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);
      await loadData();
    } catch (error) {
      console.error('❌ Error refreshing data:', error);
      setError('Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  }, [loadData]);

  // 🎯 Add recent scan using unified service
  const addRecentScan = useCallback(
    async (scan: RecentScan) => {
      try {
        // Use unified service to save scan
        await unifiedScanService.saveScan(
          {
            id: scan.productId || scan.id,
            name: scan.name,
            brand: scan.brand || '',
            imageUrl: scan.imageUrl,
            dosage: scan.dosage,
            description: scan.description,
          } as any, // Type assertion for compatibility
          {
            overallScore: scan.score,
            stackInteraction: {
              overallRiskLevel: scan.hasInteraction ? 'MODERATE' : 'NONE',
              interactions: [],
            },
          } as any, // Type assertion for compatibility
          scan.scanType || 'barcode'
        );

        // Reload recent scans
        const updatedScans = await loadRecentScans();
        setRecentScans(updatedScans);

        // Update game stats
        const updatedStats = await loadGameStats();
        setGameStats(updatedStats);
        
        console.log('✅ Recent scan added successfully');
      } catch (error) {
        console.error('❌ Error adding recent scan:', error);
        setError('Failed to add scan');
      }
    },
    [loadRecentScans, loadGameStats]
  );

  // 🎯 Delete scan
  const deleteScan = useCallback(async (scanId: string) => {
    try {
      await unifiedScanService.deleteScan(scanId);
      
      // Reload recent scans
      const updatedScans = await loadRecentScans();
      setRecentScans(updatedScans);
      
      console.log('✅ Scan deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting scan:', error);
      setError('Failed to delete scan');
    }
  }, [loadRecentScans]);

  // 🎯 Sync with database
  const syncWithDatabase = useCallback(async (userId: string) => {
    try {
      await unifiedScanService.syncWithDatabase(userId);
      
      // Reload data after sync
      await loadData();
      
      console.log('✅ Data synced with database');
    } catch (error) {
      console.error('❌ Error syncing with database:', error);
      setError('Failed to sync data');
    }
  }, [loadData]);

  // 🎯 Clean up invalid scans
  const cleanupScans = useCallback(async () => {
    try {
      await unifiedScanService.cleanupInvalidScans();
      
      // Reload recent scans
      const updatedScans = await loadRecentScans();
      setRecentScans(updatedScans);
      
      console.log('✅ Scans cleaned up successfully');
    } catch (error) {
      console.error('❌ Error cleaning up scans:', error);
      setError('Failed to clean up scans');
    }
  }, [loadRecentScans]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    recentScans,
    gameStats,
    loading,
    refreshing,
    error,
    loadData,
    refreshData,
    addRecentScan,
    deleteScan,
    syncWithDatabase,
    cleanupScans,
  };
};
