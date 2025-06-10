import { CRITICAL_INTERACTIONS, NUTRIENT_LIMITS } from "../../constants";
import type {
  Product,
  UserStack,
  InteractionDetail,
  RiskLevel,
  StackInteractionResult,
} from "../../types";

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
    healthProfile?: any // Keep this if you plan to use it for future checks
  ): Promise<StackInteractionResult> {
    const interactions: InteractionDetail[] = [];
    const nutrientWarnings: any[] = []; // This type could be more specific later
    let highestRisk: RiskLevel = "NONE";

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
      highestRisk = this.escalateRisk(highestRisk, nutrientCheck.riskLevel);
    }

    return {
      riskLevel: highestRisk,
      interactions,
      nutrientWarnings,
      overallSafe: highestRisk === "NONE" || highestRisk === "LOW",
    };
  }

  private async checkPairInteraction(
    product: Product,
    stackItem: UserStack
  ): Promise<InteractionDetail | null> {
    const productName = product.name.toLowerCase();
    const stackName = stackItem.name.toLowerCase();

    // Check our critical interactions database
    // Ensure CRITICAL_INTERACTIONS is structured correctly in constants,
    // e.g., keys are lowercase and consistent.
    for (const [drug, data] of Object.entries(CRITICAL_INTERACTIONS)) {
      if (stackName.includes(drug.toLowerCase())) {
        // Check if stack item is the 'drug' part
        for (const supplement of data.supplements || []) {
          if (productName.includes(supplement.toLowerCase())) {
            // Check if product is the 'supplement' part
            return {
              type: "Drug-Supplement", // Or Drug-Drug if you add that logic
              severity: data.severity as RiskLevel, // Cast to RiskLevel
              message: `${product.name} may interact with ${stackItem.name}`,
              mechanism: data.mechanism,
              evidenceSources: [
                {
                  // Ensure your types allow this structure
                  badge: "🔵",
                  text: `FDA: ${data.evidence}`,
                },
              ],
              recommendation:
                "Consult your healthcare provider before combining these",
            };
          }
        }
      }
      // Also check if 'product' is the drug and 'stackItem' is the supplement
      if (productName.includes(drug.toLowerCase())) {
        for (const supplement of data.supplements || []) {
          if (stackName.includes(supplement.toLowerCase())) {
            return {
              type: "Drug-Supplement",
              severity: data.severity as RiskLevel,
              message: `${stackItem.name} may interact with ${product.name}`,
              mechanism: data.mechanism,
              evidenceSources: [
                {
                  badge: "🔵",
                  text: `FDA: ${data.evidence}`,
                },
              ],
              recommendation:
                "Consult your healthcare provider before combining these",
            };
          }
        }
      }
      // Add logic for Drug-Drug interactions if CRITICAL_INTERACTIONS contains medication names for 'medications' key
    }

    return null;
  }

  private async checkNutrientLimits(product: Product, userStack: UserStack[]) {
    const warnings: any[] = [];
    let riskLevel: RiskLevel = "NONE";

    // Calculate total nutrients across stack
    const nutrients: {
      [key: string]: { total: number; unit: string; sources: string[] };
    } = {}; // More specific type for nutrients

    // Add nutrients from existing stack
    for (const item of userStack) {
      if (item.ingredients) {
        for (const ingredient of item.ingredients) {
          const nutrientName = ingredient.name.toLowerCase();
          // Assuming ingredient.amount and ingredient.unit are available and valid numbers
          if (
            NUTRIENT_LIMITS[nutrientName] &&
            typeof ingredient.amount === "number" &&
            ingredient.amount > 0
          ) {
            if (!nutrients[nutrientName]) {
              nutrients[nutrientName] = {
                total: 0,
                unit: NUTRIENT_LIMITS[nutrientName].unit,
                sources: [],
              };
            }
            nutrients[nutrientName].total += ingredient.amount;
            nutrients[nutrientName].sources.push(item.name);
          }
        }
      }
    }

    // Add nutrients from new product
    if (product.ingredients) {
      for (const ingredient of product.ingredients) {
        const nutrientName = ingredient.name.toLowerCase();
        // Assuming ingredient.amount and ingredient.unit are available and valid numbers
        if (
          NUTRIENT_LIMITS[nutrientName] &&
          typeof ingredient.amount === "number" &&
          ingredient.amount > 0
        ) {
          if (!nutrients[nutrientName]) {
            nutrients[nutrientName] = {
              total: 0,
              unit: NUTRIENT_LIMITS[nutrientName].unit,
              sources: [],
            };
          }
          nutrients[nutrientName].total += ingredient.amount;
          nutrients[nutrientName].sources.push(product.name); // Add the new product as a source

          const newTotal = nutrients[nutrientName].total; // Use the updated total
          const limit = NUTRIENT_LIMITS[nutrientName];

          if (newTotal > limit.ul) {
            // Check severity based on how much it exceeds the limit
            let currentWarningSeverity: RiskLevel = "LOW";
            const percentExceeded = (newTotal / limit.ul) * 100;
            if (percentExceeded > 200)
              currentWarningSeverity = "CRITICAL"; // Over 200% of UL
            else if (percentExceeded > 150)
              currentWarningSeverity = "HIGH"; // Over 150% of UL
            else if (percentExceeded > 110) currentWarningSeverity = "MODERATE"; // Over 110% of UL

            warnings.push({
              nutrient: nutrientName,
              currentTotal: newTotal,
              upperLimit: limit.ul,
              unit: limit.unit,
              risk: limit.risk,
              percentOfLimit: Math.round(percentExceeded),
              recommendation: `Reduce total ${nutrientName} intake by ${
                newTotal - limit.ul
              } ${limit.unit}. Consult a healthcare provider.`,
              severity: currentWarningSeverity, // Add severity to the warning itself
            });
            riskLevel = this.escalateRisk(riskLevel, currentWarningSeverity); // Escalate overall risk for nutrient checks
          }
        }
      }
    }

    return { warnings, riskLevel };
  }

  // FIXED: Renamed 'new' parameter to 'newRiskLevel'
  private escalateRisk(current: RiskLevel, newRiskLevel: RiskLevel): RiskLevel {
    const riskOrder = ["NONE", "LOW", "MODERATE", "HIGH", "CRITICAL"];
    const currentIndex = riskOrder.indexOf(current);
    const newIndex = riskOrder.indexOf(newRiskLevel);
    return newIndex > currentIndex ? newRiskLevel : current;
  }
}

export const interactionService = new InteractionService();
