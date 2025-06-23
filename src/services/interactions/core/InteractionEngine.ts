// src/services/interactions/core/InteractionEngine.ts
// Core Interaction Detection Engine with Plugin Architecture

import {
  InteractionChecker,
  InteractionCheckResult,
  InteractionCheckConfig,
  DetectedInteraction,
  SubstanceContext,
  UserInteractionContext,
  InteractionSeverity,
  InteractionType,
  InteractionCheckMetrics,
} from '../types';

/**
 * Dependency injection container for interaction checkers
 */
export class InteractionCheckerRegistry {
  private checkers: Map<InteractionType, InteractionChecker[]> = new Map();
  private metrics: InteractionCheckMetrics;

  constructor() {
    this.metrics = {
      totalChecks: 0,
      averageResponseTime: 0,
      cacheHitRate: 0,
      errorRate: 0,
      dataSourcesUsed: [],
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Register an interaction checker
   */
  register(checker: InteractionChecker): void {
    const type = checker.type;

    if (!this.checkers.has(type)) {
      this.checkers.set(type, []);
    }

    const checkers = this.checkers.get(type)!;

    // Insert in priority order (higher priority first)
    const insertIndex = checkers.findIndex(c => c.priority < checker.priority);
    if (insertIndex === -1) {
      checkers.push(checker);
    } else {
      checkers.splice(insertIndex, 0, checker);
    }

    console.log(`Registered ${type} checker with priority ${checker.priority}`);
  }

  /**
   * Get checkers for a specific interaction type
   */
  getCheckers(type: InteractionType): InteractionChecker[] {
    return this.checkers.get(type) || [];
  }

  /**
   * Get all registered checkers
   */
  getAllCheckers(): InteractionChecker[] {
    const allCheckers: InteractionChecker[] = [];
    for (const checkers of this.checkers.values()) {
      allCheckers.push(...checkers);
    }
    return allCheckers.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Get supported interaction types
   */
  getSupportedTypes(): InteractionType[] {
    return Array.from(this.checkers.keys());
  }

  /**
   * Get performance metrics
   */
  getMetrics(): InteractionCheckMetrics {
    return { ...this.metrics };
  }

  /**
   * Update metrics
   */
  updateMetrics(
    responseTime: number,
    cacheHit: boolean,
    error: boolean,
    dataSources: string[]
  ): void {
    this.metrics.totalChecks++;

    // Update average response time
    this.metrics.averageResponseTime =
      (this.metrics.averageResponseTime * (this.metrics.totalChecks - 1) +
        responseTime) /
      this.metrics.totalChecks;

    // Update cache hit rate
    const cacheHits =
      Math.round(this.metrics.cacheHitRate * (this.metrics.totalChecks - 1)) +
      (cacheHit ? 1 : 0);
    this.metrics.cacheHitRate = cacheHits / this.metrics.totalChecks;

    // Update error rate
    const errors =
      Math.round(this.metrics.errorRate * (this.metrics.totalChecks - 1)) +
      (error ? 1 : 0);
    this.metrics.errorRate = errors / this.metrics.totalChecks;

    // Update data sources
    dataSources.forEach(source => {
      if (!this.metrics.dataSourcesUsed.includes(source)) {
        this.metrics.dataSourcesUsed.push(source);
      }
    });

    this.metrics.timestamp = new Date().toISOString();
  }
}

/**
 * Core interaction detection engine
 */
export class InteractionEngine {
  private registry: InteractionCheckerRegistry;
  private cache: Map<
    string,
    { result: InteractionCheckResult; timestamp: number }
  > = new Map();
  private cacheTimeout: number = 1000 * 60 * 60; // 1 hour

  constructor(registry?: InteractionCheckerRegistry) {
    this.registry = registry || new InteractionCheckerRegistry();
  }

  /**
   * Register an interaction checker
   */
  registerChecker(checker: InteractionChecker): void {
    this.registry.register(checker);
  }

  /**
   * Check for interactions between substances
   */
  async checkInteractions(
    substances: SubstanceContext[],
    userContext?: UserInteractionContext,
    config?: Partial<InteractionCheckConfig>
  ): Promise<InteractionCheckResult> {
    const startTime = Date.now();
    let cacheHit = false;
    let error = false;
    const dataSources: string[] = [];

    try {
      // Generate cache key
      const cacheKey = this.generateCacheKey(substances, userContext, config);

      // Check cache
      const cached = this.getCachedResult(cacheKey);
      if (cached) {
        cacheHit = true;
        this.registry.updateMetrics(
          Date.now() - startTime,
          cacheHit,
          error,
          dataSources
        );
        return cached;
      }

      // Validate input
      if (!substances || substances.length < 2) {
        throw new Error(
          'At least 2 substances required for interaction checking'
        );
      }

      // Merge with default config
      const finalConfig = this.mergeConfig(config);

      // Get applicable checkers
      const applicableCheckers = this.getApplicableCheckers(
        substances,
        finalConfig
      );

      if (applicableCheckers.length === 0) {
        console.warn(
          'No applicable interaction checkers found for given substances'
        );
      }

      // Run interaction checks
      const allInteractions: DetectedInteraction[] = [];

      for (const checker of applicableCheckers) {
        try {
          const interactions = await checker.check(substances, finalConfig);
          allInteractions.push(...interactions);
          dataSources.push(checker.constructor.name);
        } catch (checkerError) {
          console.error(`Error in ${checker.constructor.name}:`, checkerError);
          error = true;
        }
      }

      // Process and deduplicate interactions
      const processedInteractions = this.processInteractions(
        allInteractions,
        userContext
      );

      // Generate result
      const result = this.generateResult(processedInteractions, finalConfig);

      // Cache result
      this.cacheResult(cacheKey, result);

      // Update metrics
      this.registry.updateMetrics(
        Date.now() - startTime,
        cacheHit,
        error,
        dataSources
      );

      return result;
    } catch (err) {
      error = true;
      this.registry.updateMetrics(
        Date.now() - startTime,
        cacheHit,
        error,
        dataSources
      );

      console.error('Interaction checking failed:', err);

      // Return safe fallback result
      return this.generateFallbackResult();
    }
  }

  /**
   * Check interactions for a specific type only
   */
  async checkInteractionsByType(
    substances: SubstanceContext[],
    type: InteractionType,
    userContext?: UserInteractionContext,
    config?: Partial<InteractionCheckConfig>
  ): Promise<DetectedInteraction[]> {
    const checkers = this.registry.getCheckers(type);
    const allInteractions: DetectedInteraction[] = [];

    for (const checker of checkers) {
      if (checker.canHandle(substances)) {
        try {
          const interactions = await checker.check(substances, config);
          allInteractions.push(...interactions);
        } catch (error) {
          console.error(`Error in ${type} checker:`, error);
        }
      }
    }

    return this.processInteractions(allInteractions, userContext);
  }

  /**
   * Get performance metrics
   */
  getMetrics(): InteractionCheckMetrics {
    return this.registry.getMetrics();
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get supported interaction types
   */
  getSupportedTypes(): InteractionType[] {
    return this.registry.getSupportedTypes();
  }

  /**
   * Validate if substances can be checked
   */
  canCheckSubstances(substances: SubstanceContext[]): boolean {
    if (!substances || substances.length < 2) {
      return false;
    }

    const applicableCheckers = this.getApplicableCheckers(
      substances,
      this.mergeConfig()
    );
    return applicableCheckers.length > 0;
  }

  // Private helper methods

  private generateCacheKey(
    substances: SubstanceContext[],
    userContext?: UserInteractionContext,
    config?: Partial<InteractionCheckConfig>
  ): string {
    const substanceKey = substances
      .map(s => `${s.name}:${s.dosage?.amount || 0}:${s.dosage?.unit || ''}`)
      .sort()
      .join('|');

    const contextKey = userContext ? JSON.stringify(userContext) : '';
    const configKey = config ? JSON.stringify(config) : '';

    return `${substanceKey}:${contextKey}:${configKey}`;
  }

  private getCachedResult(key: string): InteractionCheckResult | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.result;
    }

    if (cached) {
      this.cache.delete(key); // Remove expired cache
    }

    return null;
  }

  private cacheResult(key: string, result: InteractionCheckResult): void {
    this.cache.set(key, {
      result,
      timestamp: Date.now(),
    });
  }

  private mergeConfig(
    config?: Partial<InteractionCheckConfig>
  ): InteractionCheckConfig {
    return {
      includeTypes: [
        'supplement-supplement',
        'supplement-medication',
        'supplement-condition',
      ],
      minimumSeverity: 'LOW',
      includeEvidence: ['A', 'B', 'C', 'D'],
      personalizeForUser: true,
      includeAlternatives: true,
      checkTiming: true,
      ...config,
    };
  }

  private getApplicableCheckers(
    substances: SubstanceContext[],
    config: InteractionCheckConfig
  ): InteractionChecker[] {
    const applicableCheckers: InteractionChecker[] = [];

    for (const type of config.includeTypes) {
      const checkers = this.registry.getCheckers(type);
      for (const checker of checkers) {
        if (checker.canHandle(substances)) {
          applicableCheckers.push(checker);
        }
      }
    }

    return applicableCheckers;
  }

  private processInteractions(
    interactions: DetectedInteraction[],
    userContext?: UserInteractionContext
  ): DetectedInteraction[] {
    // Remove duplicates based on substance pairs
    const uniqueInteractions = new Map<string, DetectedInteraction>();

    for (const interaction of interactions) {
      const key = this.getInteractionKey(interaction);
      const existing = uniqueInteractions.get(key);

      if (
        !existing ||
        this.compareSeverity(interaction.severity, existing.severity) > 0
      ) {
        uniqueInteractions.set(key, interaction);
      }
    }

    // Apply user context personalization
    const processedInteractions = Array.from(uniqueInteractions.values());

    if (userContext) {
      return processedInteractions.map(interaction =>
        this.personalizeInteraction(interaction, userContext)
      );
    }

    return processedInteractions;
  }

  private getInteractionKey(interaction: DetectedInteraction): string {
    const names = [
      interaction.substance1.name,
      interaction.substance2.name,
    ].sort();
    return `${names[0]}:${names[1]}:${interaction.type}`;
  }

  private compareSeverity(
    severity1: InteractionSeverity,
    severity2: InteractionSeverity
  ): number {
    const severityOrder = { LOW: 1, MODERATE: 2, HIGH: 3, CRITICAL: 4 };
    return severityOrder[severity1] - severityOrder[severity2];
  }

  private personalizeInteraction(
    interaction: DetectedInteraction,
    userContext: UserInteractionContext
  ): DetectedInteraction {
    // Apply user-specific risk factors
    const riskFactorsPresent: string[] = [];
    let personalizedSeverity = interaction.severity;

    // Check age-related risk factors
    if (
      interaction.riskFactors?.ageGroups &&
      userContext.demographics?.ageRange
    ) {
      const userAgeGroup = userContext.demographics.ageRange;
      if (
        interaction.riskFactors.ageGroups.some(group =>
          userAgeGroup.includes(group)
        )
      ) {
        riskFactorsPresent.push(`Age group: ${userAgeGroup}`);
        personalizedSeverity = this.increaseSeverity(personalizedSeverity);
      }
    }

    // Check condition-related risk factors
    if (interaction.riskFactors?.conditions && userContext.healthConditions) {
      const relevantConditions = interaction.riskFactors.conditions.filter(
        condition =>
          userContext.healthConditions!.some(userCondition =>
            userCondition.toLowerCase().includes(condition.toLowerCase())
          )
      );

      if (relevantConditions.length > 0) {
        riskFactorsPresent.push(
          ...relevantConditions.map(c => `Condition: ${c}`)
        );
        personalizedSeverity = this.increaseSeverity(personalizedSeverity);
      }
    }

    return {
      ...interaction,
      context: {
        ...interaction.context,
        riskFactorsPresent,
        personalizedSeverity,
        personalizedRecommendations: this.generatePersonalizedRecommendations(
          interaction,
          userContext,
          riskFactorsPresent
        ),
      },
    };
  }

  private increaseSeverity(current: InteractionSeverity): InteractionSeverity {
    const severityProgression: Record<
      InteractionSeverity,
      InteractionSeverity
    > = {
      LOW: 'MODERATE',
      MODERATE: 'HIGH',
      HIGH: 'CRITICAL',
      CRITICAL: 'CRITICAL',
    };
    return severityProgression[current];
  }

  private generatePersonalizedRecommendations(
    interaction: DetectedInteraction,
    userContext: UserInteractionContext,
    riskFactors: string[]
  ): string[] {
    const recommendations: string[] = [];

    // Base recommendations
    switch (interaction.recommendations.action) {
      case 'avoid':
        recommendations.push('Avoid taking these substances together');
        break;
      case 'monitor':
        recommendations.push('Monitor for side effects when taking together');
        break;
      case 'separate_timing':
        if (interaction.recommendations.spacing) {
          recommendations.push(
            `Separate doses by at least ${interaction.recommendations.spacing.minimumHours} hours`
          );
        }
        break;
      case 'adjust_dose':
        recommendations.push(
          'Consider dose adjustment under healthcare provider guidance'
        );
        break;
      case 'consult_provider':
        recommendations.push('Consult healthcare provider before combining');
        break;
    }

    // Risk factor specific recommendations
    if (riskFactors.length > 0) {
      recommendations.push(
        'Extra caution recommended due to your health profile'
      );

      if (userContext.demographics?.pregnancyStatus === 'pregnant') {
        recommendations.push('Pregnancy requires additional monitoring');
      }

      if (userContext.demographics?.ageRange?.includes('65+')) {
        recommendations.push(
          'Age-related metabolism changes may increase risk'
        );
      }
    }

    return recommendations;
  }

  private generateResult(
    interactions: DetectedInteraction[],
    config: InteractionCheckConfig
  ): InteractionCheckResult {
    // Filter by minimum severity
    const filteredInteractions = interactions.filter(
      interaction =>
        this.compareSeverity(interaction.severity, config.minimumSeverity) >= 0
    );

    // Calculate summary
    const summary = {
      criticalCount: filteredInteractions.filter(i => i.severity === 'CRITICAL')
        .length,
      highCount: filteredInteractions.filter(i => i.severity === 'HIGH').length,
      moderateCount: filteredInteractions.filter(i => i.severity === 'MODERATE')
        .length,
      lowCount: filteredInteractions.filter(i => i.severity === 'LOW').length,
    };

    // Determine overall risk level
    let overallRiskLevel: InteractionSeverity = 'LOW';
    if (summary.criticalCount > 0) overallRiskLevel = 'CRITICAL';
    else if (summary.highCount > 0) overallRiskLevel = 'HIGH';
    else if (summary.moderateCount > 0) overallRiskLevel = 'MODERATE';

    // Generate recommendations
    const recommendations =
      this.generateOverallRecommendations(filteredInteractions);

    return {
      hasInteractions: filteredInteractions.length > 0,
      interactions: filteredInteractions,
      overallRiskLevel,
      summary,
      recommendations,
    };
  }

  private generateOverallRecommendations(interactions: DetectedInteraction[]) {
    const immediate: string[] = [];
    const timing: string[] = [];
    const monitoring: string[] = [];
    const alternatives: string[] = [];

    for (const interaction of interactions) {
      switch (interaction.recommendations.action) {
        case 'avoid':
          immediate.push(
            `Avoid: ${interaction.substance1.name} + ${interaction.substance2.name}`
          );
          break;
        case 'separate_timing':
          if (interaction.recommendations.spacing) {
            timing.push(
              `Space ${interaction.substance1.name} and ${interaction.substance2.name} by ${interaction.recommendations.spacing.minimumHours}+ hours`
            );
          }
          break;
        case 'monitor':
          monitoring.push(
            `Monitor for effects: ${interaction.substance1.name} + ${interaction.substance2.name}`
          );
          break;
        case 'consult_provider':
          immediate.push(
            `Consult provider: ${interaction.substance1.name} + ${interaction.substance2.name}`
          );
          break;
      }

      if (interaction.recommendations.alternatives) {
        alternatives.push(...interaction.recommendations.alternatives);
      }
    }

    return {
      immediate: [...new Set(immediate)],
      timing: [...new Set(timing)],
      monitoring: [...new Set(monitoring)],
      alternatives: [...new Set(alternatives)],
    };
  }

  private generateFallbackResult(): InteractionCheckResult {
    return {
      hasInteractions: false,
      interactions: [],
      overallRiskLevel: 'LOW',
      summary: {
        criticalCount: 0,
        highCount: 0,
        moderateCount: 0,
        lowCount: 0,
      },
      recommendations: {
        immediate: ['Interaction checking temporarily unavailable'],
        timing: [],
        monitoring: ['Monitor for any unusual effects'],
        alternatives: [],
      },
    };
  }
}

/**
 * Factory for creating and configuring interaction engines
 */
export class InteractionEngineFactory {
  /**
   * Create a fully configured interaction engine with default checkers
   */
  static createDefault(): InteractionEngine {
    const registry = new InteractionCheckerRegistry();
    const engine = new InteractionEngine(registry);

    // Register default checkers will be done when they're created
    console.log('Created default interaction engine');

    return engine;
  }

  /**
   * Create a minimal interaction engine for testing
   */
  static createMinimal(): InteractionEngine {
    const registry = new InteractionCheckerRegistry();
    return new InteractionEngine(registry);
  }

  /**
   * Create an interaction engine with custom configuration
   */
  static createCustom(checkers: InteractionChecker[]): InteractionEngine {
    const registry = new InteractionCheckerRegistry();
    const engine = new InteractionEngine(registry);

    checkers.forEach(checker => engine.registerChecker(checker));

    return engine;
  }
}
