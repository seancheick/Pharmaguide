// src/hooks/useHomeData.ts
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { gamificationService } from '../services/gamification/gamificationService';
import { STORAGE_KEYS } from '../constants';

interface RecentScan {
  id: string;
  name: string;
  brand: string;
  imageUrl?: string;
  score: number;
  hasInteraction: boolean;
  scannedAt: string;
  evidence?: 'A' | 'B' | 'C' | 'D';
}

interface GameStats {
  points: number;
  level: number;
  levelTitle: string;
  currentStreak: number;
  longestStreak: number;
}

interface UseHomeDataReturn {
  recentScans: RecentScan[];
  gameStats: GameStats;
  loading: boolean;
  refreshing: boolean;
  loadData: () => Promise<void>;
  refreshData: () => Promise<void>;
  addRecentScan: (scan: RecentScan) => Promise<void>;
}

export const useHomeData = (): UseHomeDataReturn => {
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  const [gameStats, setGameStats] = useState<GameStats>({
    points: 0,
    level: 1,
    levelTitle: 'Health Novice',
    currentStreak: 0,
    longestStreak: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRecentScans = useCallback(async (): Promise<RecentScan[]> => {
    try {
      const storedScans = await AsyncStorage.getItem(STORAGE_KEYS.RECENT_SCANS);
      if (storedScans) {
        const scans = JSON.parse(storedScans);
        // Sort by scannedAt date, most recent first
        return scans.sort(
          (a: RecentScan, b: RecentScan) =>
            new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime()
        );
      }
      return [];
    } catch (error) {
      console.error('Error loading recent scans:', error);
      return [];
    }
  }, []);

  const loadGameStats = useCallback(async (): Promise<GameStats> => {
    try {
      const progress = await gamificationService.getUserProgress();
      return {
        points: progress.points,
        level: progress.level,
        levelTitle: progress.levelTitle,
        currentStreak: progress.streak.current,
        longestStreak: progress.streak.longest,
      };
    } catch (error) {
      console.error('Error loading game stats:', error);
      return {
        points: 0,
        level: 1,
        levelTitle: 'Health Novice',
        currentStreak: 0,
        longestStreak: 0,
      };
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [scans, stats] = await Promise.all([
        loadRecentScans(),
        loadGameStats(),
      ]);

      setRecentScans(scans);
      setGameStats(stats);
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setLoading(false);
    }
  }, [loadRecentScans, loadGameStats]);

  const refreshData = useCallback(async () => {
    try {
      setRefreshing(true);
      await loadData();
    } finally {
      setRefreshing(false);
    }
  }, [loadData]);

  const addRecentScan = useCallback(
    async (scan: RecentScan) => {
      try {
        const currentScans = await loadRecentScans();

        // Remove any existing scan with the same ID
        const filteredScans = currentScans.filter(s => s.id !== scan.id);

        // Add new scan at the beginning
        const updatedScans = [scan, ...filteredScans].slice(0, 20); // Keep only last 20 scans

        await AsyncStorage.setItem(
          STORAGE_KEYS.RECENT_SCANS,
          JSON.stringify(updatedScans)
        );

        setRecentScans(updatedScans);

        // Update gamification stats for scanning
        await gamificationService.awardPoints('DAILY_SCAN');
        const updatedStats = await loadGameStats();
        setGameStats(updatedStats);
      } catch (error) {
        console.error('Error adding recent scan:', error);
      }
    },
    [loadRecentScans, loadGameStats]
  );

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    recentScans,
    gameStats,
    loading,
    refreshing,
    loadData,
    refreshData,
    addRecentScan,
  };
};
