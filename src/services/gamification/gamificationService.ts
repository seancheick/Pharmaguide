// src/services/gamification/gamificationService.ts
import { storageAdapter } from '../storage/storageAdapter';
import { supabase } from '../supabase/client';
import { GAMIFICATION } from '../../constants';

interface UserProgress {
  points: number;
  level: number;
  levelTitle: string;
  streak: {
    current: number;
    longest: number;
    lastActivityDate: string | null;
  };
  achievements: string[];
  statistics: {
    totalScans: number;
    safeProducts: number;
    interactionsFound: number;
    submissionsApproved: number;
  };
}

interface PointsResult {
  success: boolean;
  previous_points: number;
  new_points: number;
  points_added: number;
  previous_level: number;
  new_level: number;
  level_up: boolean;
}

interface StreakResult {
  success: boolean;
  current_streak: number;
  longest_streak: number;
  streak_continued: boolean;
  streak_broken: boolean;
  message?: string;
}

class GamificationService {
  private userId: string | null = null;

  // Set the current user ID (call this when user logs in or app starts)
  setUserId(userId: string | null) {
    this.userId = userId;
  }

  async getUserProgress(): Promise<UserProgress> {
    try {
      if (!this.userId) {
        // Return cached local data for anonymous users
        return this.getLocalProgress();
      }

      // Fetch from database
      const [pointsData, streakData, statsData] = await Promise.all([
        supabase
          .from('user_points')
          .select('total_points, level')
          .eq('user_id', this.userId)
          .single(),

        supabase
          .from('user_streaks')
          .select('current_streak, longest_streak, last_activity_date')
          .eq('user_id', this.userId)
          .single(),

        this.getStatisticsFromCache(), // Still use local cache for detailed stats
      ]);

      const points = pointsData.data?.total_points || 0;
      const level = pointsData.data?.level || 1;
      const levelTitle = this.getLevelTitle(points);

      return {
        points,
        level,
        levelTitle,
        streak: {
          current: streakData.data?.current_streak || 0,
          longest: streakData.data?.longest_streak || 0,
          lastActivityDate: streakData.data?.last_activity_date || null,
        },
        achievements: await this.getAchievements(),
        statistics: statsData,
      };
    } catch (error) {
      console.error('Error getting user progress:', error);
      return this.getLocalProgress();
    }
  }

  async awardPoints(
    action: keyof typeof GAMIFICATION.POINTS,
    metadata?: any
  ): Promise<PointsResult | null> {
    try {
      const points = GAMIFICATION.POINTS[action];

      if (!this.userId) {
        // Handle local storage for anonymous users
        await this.awardPointsLocally(action, metadata);
        return null;
      }

      // Use the database function
      const { data, error } = await supabase.rpc('increment_points', {
        p_user_id: this.userId,
        p_points: points,
        p_reason: action.toLowerCase(),
        p_metadata: metadata || {},
      });

      if (error) throw error;

      // Update local statistics
      await this.updateStatistics(action, metadata);

      // Check achievements
      if (data?.level_up) {
        await this.checkAchievements();
        // Trigger level up notification
        this.onLevelUp?.(data.new_level);
      }

      return data;
    } catch (error) {
      console.error('Error awarding points:', error);
      // Fallback to local storage
      await this.awardPointsLocally(action, metadata);
      return null;
    }
  }

  async updateStreak(): Promise<StreakResult | null> {
    try {
      if (!this.userId) {
        // Handle local storage for anonymous users
        return await this.updateStreakLocally();
      }

      // Use the database function
      const { data, error } = await supabase.rpc('update_streak', {
        p_user_id: this.userId,
      });

      if (error) throw error;

      // Check streak achievements
      if (data?.streak_continued) {
        await this.checkStreakAchievements(data.current_streak);
      }

      return data;
    } catch (error) {
      console.error('Error updating streak:', error);
      return await this.updateStreakLocally();
    }
  }

  async getPointsHistory(limit: number = 20) {
    if (!this.userId) return [];

    try {
      const { data, error } = await supabase
        .from('points_history')
        .select('*')
        .eq('user_id', this.userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting points history:', error);
      return [];
    }
  }

  // Local storage methods for anonymous users
  private async getLocalProgress(): Promise<UserProgress> {
    try {
      await storageAdapter.initialize();
      const stored = await storageAdapter.getItem('user_progress');
      if (stored) {
        const progress = JSON.parse(stored);
        progress.levelTitle = this.getLevelTitle(progress.points);
        return progress;
      }
      return this.getDefaultProgress();
    } catch (error) {
      console.error('Error getting local progress:', error);
      return this.getDefaultProgress();
    }
  }

  private async awardPointsLocally(
    action: keyof typeof GAMIFICATION.POINTS,
    metadata?: any
  ): Promise<void> {
    try {
      const progress = await this.getLocalProgress();
      const points = GAMIFICATION.POINTS[action];

      progress.points += points;
      progress.level = Math.floor(progress.points / 100) + 1;
      progress.levelTitle = this.getLevelTitle(progress.points);

      await this.updateStatistics(action, metadata);
      await this.checkAchievements();

      await storageAdapter.setItem('user_progress', JSON.stringify(progress));
    } catch (error) {
      console.error('Error awarding points locally:', error);
    }
  }

  private async updateStreakLocally(): Promise<StreakResult> {
    try {
      const progress = await this.getLocalProgress();
      const today = new Date().toISOString().split('T')[0];
      const lastActivity = progress.streak.lastActivityDate;

      if (lastActivity === today) {
        return {
          success: true,
          current_streak: progress.streak.current,
          longest_streak: progress.streak.longest,
          streak_continued: false,
          streak_broken: false,
          message: 'Already updated today',
        };
      }

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      let streakContinued = false;
      let streakBroken = false;

      if (lastActivity === yesterdayStr) {
        progress.streak.current += 1;
        streakContinued = true;
      } else {
        progress.streak.current = 1;
        streakBroken = lastActivity !== null;
      }

      progress.streak.longest = Math.max(
        progress.streak.current,
        progress.streak.longest
      );
      progress.streak.lastActivityDate = today;

      await storageAdapter.setItem('user_progress', JSON.stringify(progress));

      return {
        success: true,
        current_streak: progress.streak.current,
        longest_streak: progress.streak.longest,
        streak_continued: streakContinued,
        streak_broken: streakBroken,
      };
    } catch (error) {
      console.error('Error updating streak locally:', error);
      return {
        success: false,
        current_streak: 0,
        longest_streak: 0,
        streak_continued: false,
        streak_broken: false,
      };
    }
  }

  private getLevelTitle(points: number): string {
    for (const [key, level] of Object.entries(GAMIFICATION.LEVELS)) {
      if (points >= level.min && points <= level.max) {
        return level.title;
      }
    }
    return GAMIFICATION.LEVELS.BEGINNER.title;
  }

  private async updateStatistics(
    action: string,
    metadata?: any
  ): Promise<void> {
    try {
      const stats = await this.getStatisticsFromCache();

      switch (action) {
        case 'DAILY_SCAN':
          stats.totalScans += 1;
          break;
        case 'SAFE_PRODUCT':
          stats.safeProducts += 1;
          break;
        case 'INTERACTION_FOUND':
          stats.interactionsFound += 1;
          break;
        case 'SUBMISSION':
          if (metadata?.approved) {
            stats.submissionsApproved += 1;
          }
          break;
      }

      await storageAdapter.setItem('user_statistics', JSON.stringify(stats));
    } catch (error) {
      console.error('Error updating statistics:', error);
    }
  }

  private async getStatisticsFromCache() {
    try {
      const stored = await storageAdapter.getItem('user_statistics');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error getting statistics:', error);
    }

    return {
      totalScans: 0,
      safeProducts: 0,
      interactionsFound: 0,
      submissionsApproved: 0,
    };
  }

  private async getAchievements(): Promise<string[]> {
    try {
      const stored = await storageAdapter.getItem('user_achievements');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error getting achievements:', error);
    }
    return [];
  }

  private async checkAchievements(): Promise<void> {
    const progress = await this.getUserProgress();
    const currentAchievements = progress.achievements;
    const newAchievements: string[] = [];

    // Scan milestones
    if (
      progress.statistics.totalScans >= 10 &&
      !currentAchievements.includes('FIRST_10_SCANS')
    ) {
      newAchievements.push('FIRST_10_SCANS');
    }
    if (
      progress.statistics.totalScans >= 100 &&
      !currentAchievements.includes('SCAN_MASTER')
    ) {
      newAchievements.push('SCAN_MASTER');
    }

    // Level achievements
    if (progress.level >= 5 && !currentAchievements.includes('LEVEL_5')) {
      newAchievements.push('LEVEL_5');
    }
    if (progress.level >= 10 && !currentAchievements.includes('LEVEL_10')) {
      newAchievements.push('LEVEL_10');
    }

    // Safety achievements
    if (
      progress.statistics.interactionsFound >= 10 &&
      !currentAchievements.includes('SAFETY_GUARDIAN')
    ) {
      newAchievements.push('SAFETY_GUARDIAN');
    }

    // Save new achievements
    if (newAchievements.length > 0) {
      const allAchievements = [...currentAchievements, ...newAchievements];
      await storageAdapter.setItem(
        'user_achievements',
        JSON.stringify(allAchievements)
      );

      // Trigger achievement notifications
      newAchievements.forEach(achievement => {
        this.onAchievementUnlocked?.(achievement);
      });
    }
  }

  private async checkStreakAchievements(currentStreak: number): Promise<void> {
    const achievements = await this.getAchievements();
    const newAchievements: string[] = [];

    if (currentStreak >= 7 && !achievements.includes('WEEK_WARRIOR')) {
      newAchievements.push('WEEK_WARRIOR');
    }
    if (currentStreak >= 30 && !achievements.includes('MONTHLY_CHAMPION')) {
      newAchievements.push('MONTHLY_CHAMPION');
    }
    if (currentStreak >= 100 && !achievements.includes('CENTURY_LEGEND')) {
      newAchievements.push('CENTURY_LEGEND');
    }

    if (newAchievements.length > 0) {
      const allAchievements = [...achievements, ...newAchievements];
      await storageAdapter.setItem(
        'user_achievements',
        JSON.stringify(allAchievements)
      );

      newAchievements.forEach(achievement => {
        this.onAchievementUnlocked?.(achievement);
      });
    }
  }

  private getDefaultProgress(): UserProgress {
    return {
      points: 0,
      level: 1,
      levelTitle: GAMIFICATION.LEVELS.BEGINNER.title,
      streak: {
        current: 0,
        longest: 0,
        lastActivityDate: null,
      },
      achievements: [],
      statistics: {
        totalScans: 0,
        safeProducts: 0,
        interactionsFound: 0,
        submissionsApproved: 0,
      },
    };
  }

  // Event handlers (set these from your UI)
  onLevelUp?: (newLevel: number) => void;
  onAchievementUnlocked?: (achievement: string) => void;
}

export const gamificationService = new GamificationService();
