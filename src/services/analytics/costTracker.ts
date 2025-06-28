// src/services/analytics/costTracker.ts
// 💰 COST TRACKING & OPTIMIZATION ANALYTICS
// Monitor three-tier architecture cost savings

import { storageAdapter } from '../storage/storageAdapter';

export interface CostMetrics {
  totalQueries: number;
  tier1Queries: number; // Rule-based (free)
  tier2Queries: number; // Cache hits (free)
  tier3Queries: number; // Live AI calls (cost)
  totalCostSaved: number; // USD saved vs pure AI
  actualCost: number; // USD spent on AI calls
  projectedCostWithoutTiers: number; // What it would cost with pure AI
  averageResponseTime: number;
  cacheHitRate: number;
  ruleMatchRate: number;
  costPerQuery: number;
  savingsRate: number; // Percentage saved
}

export interface DailyCostSummary {
  date: string;
  queries: number;
  costSaved: number;
  actualCost: number;
  tier1Percentage: number;
  tier2Percentage: number;
  tier3Percentage: number;
}

export interface CostAlert {
  type:
    | 'BUDGET_WARNING'
    | 'BUDGET_EXCEEDED'
    | 'EFFICIENCY_DROP'
    | 'HIGH_AI_USAGE';
  message: string;
  threshold: number;
  current: number;
  timestamp: number;
}

/**
 * 💰 Cost Tracking & Optimization Service
 * - Real-time cost monitoring
 * - Three-tier efficiency tracking
 * - Budget alerts and optimization recommendations
 * - ROI analytics for three-tier architecture
 */
export class CostTracker {
  private readonly STORAGE_KEY = 'cost_metrics_v1';
  private readonly DAILY_STORAGE_KEY = 'daily_cost_summary_v1';
  private readonly AI_COST_PER_QUERY = 0.002; // Estimated cost per AI query

  private metrics: CostMetrics = {
    totalQueries: 0,
    tier1Queries: 0,
    tier2Queries: 0,
    tier3Queries: 0,
    totalCostSaved: 0,
    actualCost: 0,
    projectedCostWithoutTiers: 0,
    averageResponseTime: 0,
    cacheHitRate: 0,
    ruleMatchRate: 0,
    costPerQuery: 0,
    savingsRate: 0,
  };

  private dailySummaries: DailyCostSummary[] = [];
  private budgetLimit: number = 50; // $50 monthly budget default
  private alerts: CostAlert[] = [];

  constructor() {
    this.loadMetrics();
  }

  /**
   * Track a query and its cost impact
   */
  async trackQuery(
    tier: 'RULE_BASED' | 'CACHED' | 'LIVE_AI',
    responseTime: number,
    costSavings: number = 0
  ): Promise<void> {
    try {
      this.metrics.totalQueries++;

      // Track tier usage
      switch (tier) {
        case 'RULE_BASED':
          this.metrics.tier1Queries++;
          this.metrics.totalCostSaved += this.AI_COST_PER_QUERY;
          break;
        case 'CACHED':
          this.metrics.tier2Queries++;
          this.metrics.totalCostSaved += this.AI_COST_PER_QUERY;
          break;
        case 'LIVE_AI':
          this.metrics.tier3Queries++;
          this.metrics.actualCost += this.AI_COST_PER_QUERY;
          break;
      }

      // Update projected cost (what it would cost with pure AI)
      this.metrics.projectedCostWithoutTiers =
        this.metrics.totalQueries * this.AI_COST_PER_QUERY;

      // Update average response time
      this.metrics.averageResponseTime =
        (this.metrics.averageResponseTime * (this.metrics.totalQueries - 1) +
          responseTime) /
        this.metrics.totalQueries;

      // Calculate rates
      this.updateRates();

      // Update daily summary
      await this.updateDailySummary();

      // Check for alerts
      this.checkAlerts();

      // Save metrics
      await this.saveMetrics();

      console.log(
        `💰 Cost tracked: ${tier} (${responseTime}ms) - Total saved: $${this.metrics.totalCostSaved.toFixed(4)}`
      );
    } catch (error) {
      console.error('❌ Failed to track cost:', error);
    }
  }

  /**
   * Set monthly budget limit
   */
  async setBudgetLimit(limit: number): Promise<void> {
    this.budgetLimit = limit;
    await this.saveMetrics();
    console.log(`💰 Budget limit set to $${limit}/month`);
  }

  /**
   * Get current cost metrics
   */
  getMetrics(): CostMetrics {
    return { ...this.metrics };
  }

  /**
   * Get daily cost summaries
   */
  getDailySummaries(days: number = 30): DailyCostSummary[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return this.dailySummaries.filter(
      summary => new Date(summary.date) >= cutoffDate
    );
  }

  /**
   * Get active cost alerts
   */
  getAlerts(): CostAlert[] {
    // Return alerts from last 24 hours
    const cutoffTime = Date.now() - 24 * 60 * 60 * 1000;
    return this.alerts.filter(alert => alert.timestamp > cutoffTime);
  }

  /**
   * Get cost optimization recommendations
   */
  getOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];

    // Low cache hit rate
    if (this.metrics.cacheHitRate < 0.3) {
      recommendations.push('Consider increasing cache TTL to improve hit rate');
    }

    // Low rule match rate
    if (this.metrics.ruleMatchRate < 0.2) {
      recommendations.push(
        'Add more rule-based interactions to reduce AI costs'
      );
    }

    // High AI usage
    if (this.metrics.tier3Queries / this.metrics.totalQueries > 0.5) {
      recommendations.push(
        'High AI usage detected - consider expanding rule database'
      );
    }

    // Cost efficiency
    if (this.metrics.savingsRate < 0.7) {
      recommendations.push(
        'Three-tier efficiency below 70% - optimize cache and rules'
      );
    }

    return recommendations;
  }

  /**
   * Get ROI analysis
   */
  getROIAnalysis(): {
    monthlySavings: number;
    yearlyProjection: number;
    efficiencyGain: number;
    breakEvenPoint: string;
  } {
    const dailyQueries =
      this.metrics.totalQueries / Math.max(this.dailySummaries.length, 1);
    const dailySavings =
      this.metrics.totalCostSaved / Math.max(this.dailySummaries.length, 1);

    const monthlySavings = dailySavings * 30;
    const yearlyProjection = monthlySavings * 12;
    const efficiencyGain = this.metrics.savingsRate;

    return {
      monthlySavings,
      yearlyProjection,
      efficiencyGain,
      breakEvenPoint:
        'Immediate - three-tier architecture has no implementation cost',
    };
  }

  /**
   * Export cost data for analysis
   */
  async exportCostData(): Promise<{
    metrics: CostMetrics;
    dailySummaries: DailyCostSummary[];
    alerts: CostAlert[];
    recommendations: string[];
    roi: any;
  }> {
    return {
      metrics: this.getMetrics(),
      dailySummaries: this.getDailySummaries(),
      alerts: this.getAlerts(),
      recommendations: this.getOptimizationRecommendations(),
      roi: this.getROIAnalysis(),
    };
  }

  /**
   * Reset cost tracking data
   */
  async resetData(): Promise<void> {
    this.metrics = {
      totalQueries: 0,
      tier1Queries: 0,
      tier2Queries: 0,
      tier3Queries: 0,
      totalCostSaved: 0,
      actualCost: 0,
      projectedCostWithoutTiers: 0,
      averageResponseTime: 0,
      cacheHitRate: 0,
      ruleMatchRate: 0,
      costPerQuery: 0,
      savingsRate: 0,
    };

    this.dailySummaries = [];
    this.alerts = [];

    await this.saveMetrics();
    console.log('💰 Cost tracking data reset');
  }

  // Private helper methods

  private updateRates(): void {
    if (this.metrics.totalQueries === 0) return;

    this.metrics.cacheHitRate =
      this.metrics.tier2Queries / this.metrics.totalQueries;
    this.metrics.ruleMatchRate =
      this.metrics.tier1Queries / this.metrics.totalQueries;
    this.metrics.costPerQuery =
      this.metrics.actualCost / this.metrics.totalQueries;
    this.metrics.savingsRate =
      this.metrics.projectedCostWithoutTiers > 0
        ? this.metrics.totalCostSaved / this.metrics.projectedCostWithoutTiers
        : 0;
  }

  private async updateDailySummary(): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    let todaySummary = this.dailySummaries.find(s => s.date === today);

    if (!todaySummary) {
      todaySummary = {
        date: today,
        queries: 0,
        costSaved: 0,
        actualCost: 0,
        tier1Percentage: 0,
        tier2Percentage: 0,
        tier3Percentage: 0,
      };
      this.dailySummaries.push(todaySummary);
    }

    // Update today's summary
    todaySummary.queries = this.metrics.totalQueries;
    todaySummary.costSaved = this.metrics.totalCostSaved;
    todaySummary.actualCost = this.metrics.actualCost;

    if (this.metrics.totalQueries > 0) {
      todaySummary.tier1Percentage =
        (this.metrics.tier1Queries / this.metrics.totalQueries) * 100;
      todaySummary.tier2Percentage =
        (this.metrics.tier2Queries / this.metrics.totalQueries) * 100;
      todaySummary.tier3Percentage =
        (this.metrics.tier3Queries / this.metrics.totalQueries) * 100;
    }

    // Keep only last 90 days
    this.dailySummaries = this.dailySummaries.slice(-90);
  }

  private checkAlerts(): void {
    const now = Date.now();

    // Budget warning (80% of monthly limit)
    const monthlySpend = this.metrics.actualCost; // Simplified - would need proper monthly calculation
    if (monthlySpend > this.budgetLimit * 0.8) {
      this.addAlert({
        type: 'BUDGET_WARNING',
        message: `Approaching monthly budget limit: $${monthlySpend.toFixed(2)} of $${this.budgetLimit}`,
        threshold: this.budgetLimit * 0.8,
        current: monthlySpend,
        timestamp: now,
      });
    }

    // Budget exceeded
    if (monthlySpend > this.budgetLimit) {
      this.addAlert({
        type: 'BUDGET_EXCEEDED',
        message: `Monthly budget exceeded: $${monthlySpend.toFixed(2)} of $${this.budgetLimit}`,
        threshold: this.budgetLimit,
        current: monthlySpend,
        timestamp: now,
      });
    }

    // Efficiency drop
    if (this.metrics.savingsRate < 0.5 && this.metrics.totalQueries > 10) {
      this.addAlert({
        type: 'EFFICIENCY_DROP',
        message: `Three-tier efficiency dropped to ${(this.metrics.savingsRate * 100).toFixed(1)}%`,
        threshold: 0.5,
        current: this.metrics.savingsRate,
        timestamp: now,
      });
    }

    // High AI usage
    const aiUsageRate = this.metrics.tier3Queries / this.metrics.totalQueries;
    if (aiUsageRate > 0.6 && this.metrics.totalQueries > 10) {
      this.addAlert({
        type: 'HIGH_AI_USAGE',
        message: `High AI usage: ${(aiUsageRate * 100).toFixed(1)}% of queries using live AI`,
        threshold: 0.6,
        current: aiUsageRate,
        timestamp: now,
      });
    }
  }

  private addAlert(alert: CostAlert): void {
    // Avoid duplicate alerts within 1 hour
    const recentAlert = this.alerts.find(
      a => a.type === alert.type && a.timestamp > Date.now() - 60 * 60 * 1000
    );

    if (!recentAlert) {
      this.alerts.push(alert);
      // Keep only last 50 alerts
      this.alerts = this.alerts.slice(-50);
    }
  }

  private async loadMetrics(): Promise<void> {
    try {
      const stored = await storageAdapter.getItem(this.STORAGE_KEY);
      if (stored) {
        this.metrics = { ...this.metrics, ...JSON.parse(stored) };
      }

      const dailyStored = await storageAdapter.getItem(this.DAILY_STORAGE_KEY);
      if (dailyStored) {
        this.dailySummaries = JSON.parse(dailyStored);
      }
    } catch (error) {
      console.error('❌ Failed to load cost metrics:', error);
    }
  }

  private async saveMetrics(): Promise<void> {
    try {
      await storageAdapter.setItem(
        this.STORAGE_KEY,
        JSON.stringify(this.metrics)
      );
      await storageAdapter.setItem(
        this.DAILY_STORAGE_KEY,
        JSON.stringify(this.dailySummaries)
      );
    } catch (error) {
      console.error('❌ Failed to save cost metrics:', error);
    }
  }
}

// Singleton instance
export const costTracker = new CostTracker();
