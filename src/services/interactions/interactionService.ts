// services/interaction/interactionService.ts
// Enhanced Interaction Service with backward compatibility

import { CRITICAL_INTERACTIONS, NUTRIENT_LIMITS } from '../../constants';
import { analysisRateLimiter } from '../../utils/rateLimiting';
import { sanitizeApiResponse } from '../../utils/sanitization';
import { handleApiError } from '../../utils/errorHandling';
import type {
  Product,
  UserStack,
  InteractionDetail,
  RiskLevel,
  StackInteractionResult,
  NutrientWarning,
} from '../../types';
import type { UserProfile } from '../../types/healthProfile';
import type { CitationSource } from '../../components/compliance';
import {
  FDA_COMPLIANCE,
  createFDASource,
  createNIHSource,
} from '../../components/compliance';

// Import enhanced interaction system
import {
  InteractionEngine,
  InteractionEngineFactory,
} from './core/InteractionEngine';
import { SupplementSupplementChecker } from './checkers/SupplementSupplementChecker';
import type {
  InteractionCheckResult,
  InteractionCheckConfig,
  SubstanceContext,
  UserInteractionContext,
  DetectedInteraction,
  InteractionSeverity,
} from './types';

export class InteractionService {
  private enhancedEngine: InteractionEngine;
  private enhancedInitialized: boolean = false;

  constructor() {
    // Initialize enhanced interaction engine
    this.enhancedEngine = InteractionEngineFactory.createDefault();
    this.initializeEnhancedEngine();
  }

  /**
   * Initialize the enhanced interaction engine
   */
  private async initializeEnhancedEngine(): Promise<void> {
    if (this.enhancedInitialized) return;

    try {
      // Register supplement-supplement checker
      const supplementChecker = new SupplementSupplementChecker();
      this.enhancedEngine.registerChecker(supplementChecker);

      this.enhancedInitialized = true;
      console.log('✅ Enhanced interaction engine initialized');
    } catch (error) {
      console.error(
        '❌ Failed to initialize enhanced interaction engine:',
        error
      );
    }
  }

  /**
   * Enhanced interaction analysis with comprehensive checking
   */
  async analyzeProductWithStackEnhanced(
    product: Product,
    userStack: UserStack[],
    healthProfile?: UserProfile,
    userId?: string
  ): Promise<{
    legacy: StackInteractionResult;
    enhanced: InteractionCheckResult;
    combined: StackInteractionResult;
  }> {
    // Run both legacy and enhanced analysis
    const legacyResult = await this.analyzeProductWithStack(
      product,
      userStack,
      healthProfile,
      userId
    );

    let enhancedResult: InteractionCheckResult;
    try {
      await this.initializeEnhancedEngine();

      // Convert to enhanced format
      const substances = this.convertToSubstanceContexts(product, userStack);
      const userContext = this.convertHealthProfileToUserContext(healthProfile);

      enhancedResult = await this.enhancedEngine.checkInteractions(
        substances,
        userContext
      );
    } catch (error) {
      console.error('Enhanced analysis failed, using legacy only:', error);
      enhancedResult = this.createFallbackEnhancedResult();
    }

    // Combine results for best of both worlds
    const combinedResult = this.combineResults(legacyResult, enhancedResult);

    return {
      legacy: legacyResult,
      enhanced: enhancedResult,
      combined: combinedResult,
    };
  }

  // Canonicalize interactions to prevent duplicates (A+B = B+A)
  private canonicalizeInteraction(item1: string, item2: string) {
    return item1 < item2
      ? { first: item1, second: item2 }
      : { first: item2, second: item1 };
  }

  async analyzeProductWithStack(
    product: Product,
    userStack: UserStack[],
    healthProfile?: any, // Keep this if you plan to use it for future checks
    userId?: string
  ): Promise<StackInteractionResult> {
    // Check rate limiting
    const isAllowed = await analysisRateLimiter.isAllowed(
      userId,
      'interaction'
    );
    if (!isAllowed) {
      const timeUntilReset = analysisRateLimiter.getTimeUntilReset(
        userId,
        'interaction'
      );
      throw new Error(
        `Rate limit exceeded. Try again in ${Math.ceil(timeUntilReset / 1000)} seconds.`
      );
    }

    const interactions: InteractionDetail[] = [];
    const nutrientWarnings: NutrientWarning[] = []; // Use NutrientWarning type
    let highestRisk: RiskLevel = 'NONE';

    // Check interactions with each item in stack
    for (const stackItem of userStack) {
      const interaction = await this.checkPairInteraction(product, stackItem);
      if (interaction) {
        interactions.push(interaction);
        highestRisk = this.escalateRisk(highestRisk, interaction.severity);
      }
    }

    // Check nutrient limits
    const nutrientCheck = await this.checkNutrientLimits(product, userStack);
    if (nutrientCheck.warnings.length > 0) {
      nutrientWarnings.push(...nutrientCheck.warnings);
      // The nutrientCheck.riskLevel itself is the highest risk from nutrient warnings
      highestRisk = this.escalateRisk(highestRisk, nutrientCheck.riskLevel);
    }

    return {
      overallRiskLevel: highestRisk, // Use overallRiskLevel as per the unified type
      interactions,
      nutrientWarnings,
      overallSafe: highestRisk === 'NONE' || highestRisk === 'LOW',
    };
  }

  private async checkPairInteraction(
    product: Product,
    stackItem: UserStack
  ): Promise<InteractionDetail | null> {
    const productName = product.name.toLowerCase();
    const stackName = stackItem.name.toLowerCase();

    // Check our critical interactions database
    for (const [drug, data] of Object.entries(CRITICAL_INTERACTIONS)) {
      if (stackName.includes(drug.toLowerCase())) {
        for (const supplement of data.supplements || []) {
          if (productName.includes(supplement.toLowerCase())) {
            return {
              type: 'Drug-Supplement',
              severity: data.severity as RiskLevel,
              message: `${product.name} may interact with ${stackItem.name}`,
              mechanism: data.mechanism,
              evidenceSources: [
                {
                  badge: '🔵',
                  text: `FDA: ${data.evidence}`,
                },
              ],
              recommendation:
                'Consult your healthcare provider before combining these',
            };
          }
        }
      }
      if (productName.includes(drug.toLowerCase())) {
        for (const supplement of data.supplements || []) {
          if (stackName.includes(supplement.toLowerCase())) {
            return {
              type: 'Drug-Supplement',
              severity: data.severity as RiskLevel,
              message: `${stackItem.name} may interact with ${product.name}`,
              mechanism: data.mechanism,
              evidenceSources: [
                {
                  badge: '🔵',
                  text: `FDA: ${data.evidence}`,
                },
              ],
              recommendation:
                'Consult your healthcare provider before combining these',
            };
          }
        }
      }
    }

    return null;
  }

  /**
   * Check supplement-supplement interactions
   */
  private checkSupplementInteraction(
    product: Product,
    stackItem: UserStack
  ): InteractionDetail | null {
    const productIngredients =
      product.ingredients?.map(i => i.name.toLowerCase()) || [];
    const stackIngredients =
      stackItem.ingredients?.map(i => i.name.toLowerCase()) || [];

    // Define supplement interaction patterns
    const supplementInteractions = {
      iron: {
        conflicting: ['calcium', 'zinc', 'magnesium', 'green_tea', 'coffee'],
        severity: 'MODERATE' as RiskLevel,
        mechanism: 'Competitive absorption leading to reduced bioavailability',
        management: 'Separate administration by 2+ hours',
      },
      calcium: {
        conflicting: ['iron', 'zinc', 'magnesium', 'phosphorus', 'fiber'],
        severity: 'MODERATE' as RiskLevel,
        mechanism:
          'Competitive absorption and formation of insoluble complexes',
        management: 'Take separately, limit single doses to 500mg',
      },
      zinc: {
        conflicting: ['iron', 'calcium', 'copper', 'fiber'],
        severity: 'MODERATE' as RiskLevel,
        mechanism: 'Competitive absorption at intestinal level',
        management: 'Take on empty stomach, separate from other minerals',
      },
    };

    // Check for interactions
    for (const productIngredient of productIngredients) {
      for (const stackIngredient of stackIngredients) {
        const interaction =
          supplementInteractions[
            productIngredient as keyof typeof supplementInteractions
          ];
        if (interaction?.conflicting?.includes(stackIngredient)) {
          return {
            type: 'Supplement-Supplement',
            severity: interaction.severity,
            message: `${product.name} and ${stackItem.name} may have reduced effectiveness when taken together`,
            mechanism: interaction.mechanism,
            evidenceSources: [
              {
                badge: '📚',
                text: 'Clinical absorption studies',
              },
            ],
            recommendation: interaction.management,
          };
        }
      }
    }

    return null;
  }

  // Updated to return NutrientWarning[]
  private async checkNutrientLimits(
    product: Product,
    userStack: UserStack[]
  ): Promise<{ warnings: NutrientWarning[]; riskLevel: RiskLevel }> {
    const warnings: NutrientWarning[] = []; // Use NutrientWarning type
    let highestNutrientRisk: RiskLevel = 'NONE'; // Track highest risk from nutrient warnings

    const nutrients: {
      [key: string]: { total: number; unit: string; sources: string[] };
    } = {};

    for (const item of userStack) {
      if (item.ingredients) {
        for (const ingredient of item.ingredients) {
          const nutrientName = ingredient.name.toLowerCase();
          const nutrientLimit =
            NUTRIENT_LIMITS[nutrientName as keyof typeof NUTRIENT_LIMITS];
          if (
            nutrientLimit &&
            typeof ingredient.amount === 'number' &&
            ingredient.amount > 0
          ) {
            if (!nutrients[nutrientName]) {
              nutrients[nutrientName] = {
                total: 0,
                unit: nutrientLimit.unit,
                sources: [],
              };
            }
            nutrients[nutrientName].total += ingredient.amount;
            nutrients[nutrientName].sources.push(item.name);
          }
        }
      }
    }

    if (product.ingredients) {
      for (const ingredient of product.ingredients) {
        const nutrientName = ingredient.name.toLowerCase();
        const nutrientLimit =
          NUTRIENT_LIMITS[nutrientName as keyof typeof NUTRIENT_LIMITS];
        if (
          nutrientLimit &&
          typeof ingredient.amount === 'number' &&
          ingredient.amount > 0
        ) {
          if (!nutrients[nutrientName]) {
            nutrients[nutrientName] = {
              total: 0,
              unit: nutrientLimit.unit,
              sources: [],
            };
          }
          nutrients[nutrientName].total += ingredient.amount;
          nutrients[nutrientName].sources.push(product.name);

          const currentTotal = nutrients[nutrientName].total;
          const limit = nutrientLimit;

          if (currentTotal > limit.ul) {
            let currentWarningSeverity: RiskLevel = 'LOW';
            const percentExceeded = (currentTotal / limit.ul) * 100;
            if (percentExceeded > 200) currentWarningSeverity = 'CRITICAL';
            else if (percentExceeded > 150) currentWarningSeverity = 'HIGH';
            else if (percentExceeded > 110) currentWarningSeverity = 'MODERATE';

            warnings.push({
              nutrient: nutrientName,
              currentTotal: currentTotal,
              upperLimit: limit.ul,
              unit: limit.unit,
              risk: limit.risk,
              percentOfLimit: Math.round(percentExceeded),
              severity: currentWarningSeverity,
              recommendation: `Reduce total ${nutrientName} intake by ${
                currentTotal - limit.ul
              } ${limit.unit}. Consult a healthcare provider.`,
            });
            // Escalate the overall risk for nutrient checks
            highestNutrientRisk = this.escalateRisk(
              highestNutrientRisk,
              currentWarningSeverity
            );
          }
        }
      }
    }

    return { warnings, riskLevel: highestNutrientRisk };
  }

  private escalateRisk(current: RiskLevel, newRiskLevel: RiskLevel): RiskLevel {
    const riskOrder = ['NONE', 'LOW', 'MODERATE', 'HIGH', 'CRITICAL'];
    const currentIndex = riskOrder.indexOf(current);
    const newIndex = riskOrder.indexOf(newRiskLevel);
    return newIndex > currentIndex ? newRiskLevel : current;
  }

  /**
   * Check interaction between two products with rate limiting
   */
  async checkInteraction(
    product1: Product,
    product2: Product,
    userId?: string
  ): Promise<StackInteractionResult> {
    // Check rate limiting
    const isAllowed = await analysisRateLimiter.isAllowed(userId, 'pairwise');
    if (!isAllowed) {
      const timeUntilReset = analysisRateLimiter.getTimeUntilReset(
        userId,
        'pairwise'
      );
      throw new Error(
        `Rate limit exceeded. Try again in ${Math.ceil(timeUntilReset / 1000)} seconds.`
      );
    }

    // Convert product2 to UserStack format for compatibility
    const stackItem: UserStack = {
      id: product2.id,
      user_id: userId || 'anonymous',
      item_id: product2.id,
      name: product2.name,
      brand: product2.brand || '',
      type: product2.category === 'Medications' ? 'medication' : 'supplement',
      dosage: product2.servingSize || '',
      frequency: 'As directed',
      ingredients: product2.ingredients || [],
      imageUrl: product2.imageUrl,
      barcode: product2.barcode,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return this.analyzeProductWithStack(
      product1,
      [stackItem],
      undefined,
      userId
    );
  }

  // Enhanced integration helper methods

  /**
   * Convert product and stack to substance contexts for enhanced analysis
   */
  private convertToSubstanceContexts(
    product: Product,
    userStack: UserStack[]
  ): SubstanceContext[] {
    const substances: SubstanceContext[] = [];

    // Add product ingredients
    if (product.ingredients) {
      for (const ingredient of product.ingredients) {
        substances.push({
          name: ingredient.name,
          dosage: {
            amount: parseFloat(ingredient.amount?.toString() || '0') || 0,
            unit: ingredient.unit || 'mg',
            frequency: 'daily',
          },
          source: 'new_product',
        });
      }
    }

    // Add stack items
    for (const item of userStack) {
      // Extract dosage from string format
      const dosageMatch = item.dosage?.match(/(\d+(?:\.\d+)?)\s*(\w+)/);
      const amount = dosageMatch ? parseFloat(dosageMatch[1]) : 0;
      const unit = dosageMatch ? dosageMatch[2] : 'mg';

      substances.push({
        name: item.name,
        dosage: {
          amount,
          unit,
          frequency: item.frequency || 'daily',
        },
        source: 'stack',
      });
    }

    return substances;
  }

  /**
   * Convert health profile to user context
   */
  private convertHealthProfileToUserContext(
    healthProfile?: UserProfile
  ): UserInteractionContext | undefined {
    if (!healthProfile) return undefined;

    return {
      demographics: healthProfile.demographics
        ? {
            ageRange: healthProfile.demographics.ageRange,
            biologicalSex: healthProfile.demographics.biologicalSex,
            pregnancyStatus: healthProfile.demographics.pregnancyStatus,
          }
        : undefined,
      healthConditions: healthProfile.conditions?.conditions || [],
      allergies: healthProfile.allergies?.substances || [],
      medications: [], // Will be populated when medication tracking is added
      healthGoals: healthProfile.goals
        ? [
            healthProfile.goals.primary,
            ...(healthProfile.goals.secondary || []),
          ].filter(Boolean)
        : [],
    };
  }

  /**
   * Create fallback enhanced result when enhanced analysis fails
   */
  private createFallbackEnhancedResult(): InteractionCheckResult {
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
        immediate: ['Enhanced analysis temporarily unavailable'],
        timing: [],
        monitoring: ['Monitor for any unusual effects'],
        alternatives: [],
      },
    };
  }

  /**
   * Combine legacy and enhanced results for best coverage
   */
  private combineResults(
    legacy: StackInteractionResult,
    enhanced: InteractionCheckResult
  ): StackInteractionResult {
    // Start with legacy result as base
    const combined: StackInteractionResult = { ...legacy };

    // Enhance with enhanced analysis insights
    if (enhanced.hasInteractions) {
      // Convert enhanced interactions to legacy format and merge
      const enhancedInteractions: InteractionDetail[] =
        enhanced.interactions.map(interaction => ({
          type: this.mapInteractionTypeToLegacy(interaction.type),
          severity: this.mapSeverityToLegacy(interaction.severity),
          message: interaction.description,
          mechanism: interaction.mechanism,
          evidenceSources: [
            {
              badge: '🔬',
              text: `Evidence Level ${interaction.evidence.level}`,
            },
          ],
          recommendation: interaction.recommendations.spacing
            ? `Space doses by ${interaction.recommendations.spacing.minimumHours}+ hours`
            : 'Monitor for effects',
        }));

      // Merge interactions, avoiding duplicates
      const existingMessages = new Set(
        combined.interactions.map(i => i.message)
      );
      const newInteractions = enhancedInteractions.filter(
        i => !existingMessages.has(i.message)
      );

      combined.interactions.push(...newInteractions);

      // Update overall risk level to highest
      const enhancedRisk = this.mapSeverityToLegacy(enhanced.overallRiskLevel);
      combined.overallRiskLevel = this.escalateRisk(
        combined.overallRiskLevel,
        enhancedRisk
      );
      combined.overallSafe =
        combined.overallRiskLevel === 'NONE' ||
        combined.overallRiskLevel === 'LOW';
    }

    return combined;
  }

  /**
   * Map enhanced interaction types to legacy format
   */
  private mapInteractionTypeToLegacy(type: string): string {
    switch (type) {
      case 'supplement-supplement':
        return 'Supplement-Supplement';
      case 'supplement-medication':
        return 'Drug-Supplement';
      case 'supplement-condition':
        return 'Supplement-Condition';
      default:
        return 'Unknown';
    }
  }

  /**
   * Map enhanced severity to legacy risk levels
   */
  private mapSeverityToLegacy(severity: InteractionSeverity): RiskLevel {
    switch (severity) {
      case 'CRITICAL':
        return 'CRITICAL';
      case 'HIGH':
        return 'HIGH';
      case 'MODERATE':
        return 'MODERATE';
      case 'LOW':
        return 'LOW';
      default:
        return 'NONE';
    }
  }

  /**
   * Get enhanced interaction metrics
   */
  getEnhancedMetrics() {
    return this.enhancedEngine.getMetrics();
  }

  /**
   * Check if enhanced analysis is available
   */
  isEnhancedAnalysisAvailable(): boolean {
    return this.enhancedInitialized;
  }

  /**
   * Enhance interaction results with FDA compliance information
   */
  private enhanceWithFDACompliance(
    result: StackInteractionResult
  ): StackInteractionResult & {
    fdaCompliance: { disclaimer: string; sources: CitationSource[] };
  } {
    const sources: CitationSource[] = [
      createFDASource(
        'FDA Drug Interactions Database',
        'https://www.fda.gov/drugs/drug-interactions-labeling',
        2024,
        'Official FDA guidance on drug and supplement interactions'
      ),
      createNIHSource(
        'NIH Dietary Supplement Interactions',
        'https://ods.od.nih.gov/factsheets/DietarySupplements-HealthProfessional/',
        2024,
        'Comprehensive database of supplement interaction research'
      ),
    ];

    // Add specific sources for detected interactions
    if (result.interactions && result.interactions.length > 0) {
      result.interactions.forEach(interaction => {
        if (
          interaction.severity === 'HIGH' ||
          interaction.severity === 'CRITICAL'
        ) {
          sources.push({
            id: `interaction_${interaction.id}`,
            title: `Clinical Evidence: ${interaction.description}`,
            source: 'PubMed',
            evidenceLevel: 'B',
            description: `Research supporting this ${interaction.severity.toLowerCase()} interaction`,
          });
        }
      });
    }

    const disclaimer = `${FDA_COMPLIANCE.DISCLAIMERS.EDUCATIONAL_ONLY} This interaction analysis is based on available research and may not identify all potential interactions. ${FDA_COMPLIANCE.DISCLAIMERS.INDIVIDUAL_VARIATION} ${FDA_COMPLIANCE.DISCLAIMERS.CONSULT_PROVIDER}`;

    return {
      ...result,
      fdaCompliance: {
        disclaimer,
        sources,
      },
    };
  }

  /**
   * Check interactions with FDA compliance information
   */
  async checkInteractionsWithCompliance(
    product: Product,
    stack: UserStack[],
    healthProfile?: UserProfile
  ): Promise<
    StackInteractionResult & {
      fdaCompliance: { disclaimer: string; sources: CitationSource[] };
    }
  > {
    const result = await this.checkProductWithStack(
      product,
      stack,
      healthProfile
    );
    return this.enhanceWithFDACompliance(result);
  }
}

export const interactionService = new InteractionService();
