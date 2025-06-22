// services/interaction/interactionService.ts
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
  NutrientWarning, // Import NutrientWarning type
} from '../../types';

export class InteractionService {
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
}

export const interactionService = new InteractionService();
