import { openFoodFactsService, ParsedProduct } from "./openfoodfacts";
import { huggingfaceService } from "../ai/huggingface";
import { interactionService } from "../interactions";
import type {
  Product,
  ProductAnalysis,
  Ingredient,
  UserStack,
} from "../../types";

export class ProductService {
  async analyzeScannedProduct(
    barcode: string,
    userStack?: UserStack[]
  ): Promise<{ product: Product; analysis: ProductAnalysis }> {
    try {
      console.log("📊 Starting product analysis for:", barcode);

      // Step 1: Get product data from OpenFoodFacts
      const parsedProduct = await openFoodFactsService.getProductByBarcode(
        barcode
      );

      if (!parsedProduct.found) {
        throw new Error("Product not found in database");
      }

      // Step 2: Convert to our Product format
      const product = this.convertToProduct(parsedProduct);

      // Step 3: Generate AI analysis
      const partialAnalysis = await huggingfaceService.generateProductAnalysis(
        product,
        true
      );

      // Step 4: Create full analysis with all required fields
      const fullAnalysis: ProductAnalysis = {
        overallScore: partialAnalysis.overallScore || 0,
        categoryScores: partialAnalysis.categoryScores || {
          ingredients: 0,
          bioavailability: 0,
          dosage: 0,
          purity: 0,
          value: 0,
        },
        strengths: partialAnalysis.strengths || [],
        weaknesses: partialAnalysis.weaknesses || [],
        recommendations: partialAnalysis.recommendations || {
          goodFor: [],
          avoidIf: [],
        },
        aiReasoning: partialAnalysis.aiReasoning || "Analysis in progress...",
        generatedAt: partialAnalysis.generatedAt || new Date().toISOString(),
      };

      // Step 5: Check stack interactions if user has items in stack
      if (userStack && userStack.length > 0) {
        console.log("🔍 Checking interactions with user stack...");
        const stackAnalysis = await interactionService.analyzeProductWithStack(
          product,
          userStack
        );

        // Add interaction data WITHOUT changing quality score
        fullAnalysis.stackInteraction = stackAnalysis;

        console.log(
          `✅ Stack analysis complete. Risk: ${stackAnalysis.riskLevel}`
        );
      }

      console.log("✅ Product analysis complete:", {
        name: product.name,
        score: fullAnalysis.overallScore,
        found: parsedProduct.found,
        hasInteractions: !!fullAnalysis.stackInteraction,
      });

      return { product, analysis: fullAnalysis };
    } catch (error) {
      console.error("Product analysis error:", error);

      // Return a fallback product and analysis
      const fallbackProduct = this.createNotFoundProduct(barcode);
      const fallbackAnalysis: ProductAnalysis = {
        overallScore: 0,
        categoryScores: {
          ingredients: 0,
          bioavailability: 0,
          dosage: 0,
          purity: 0,
          value: 0,
        },
        strengths: [],
        weaknesses: [
          {
            point: "Product not found",
            detail:
              "Unable to analyze this product. It may not be in our database.",
            importance: "high",
            category: "quality",
          },
        ],
        recommendations: {
          goodFor: [],
          avoidIf: [],
        },
        aiReasoning:
          "Product not found in database. Please try scanning another product.",
        generatedAt: new Date().toISOString(),
      };

      return { product: fallbackProduct, analysis: fallbackAnalysis };
    }
  }

  private convertToProduct(parsedProduct: ParsedProduct): Product {
    const ingredients: Ingredient[] = parsedProduct.ingredients.map(
      (name, index) => ({
        name: name.toLowerCase(),
        amount: 0,
        unit: "mg",
        form: this.guessIngredientForm(name),
        dailyValuePercentage: undefined,
        bioavailability: this.guessBioavailability(name),
        evidenceLevel: "marketing_claims",
        category: "active",
      })
    );

    return {
      id: `scanned_${parsedProduct.barcode}`,
      name: parsedProduct.name,
      brand: parsedProduct.brand,
      category: this.mapCategory(parsedProduct.category),
      barcode: parsedProduct.barcode,
      ingredients,
      servingSize: "Unknown",
      servingsPerContainer: 1,
      imageUrl: parsedProduct.imageUrl,
      verified: parsedProduct.found,
      thirdPartyTested: false,
      certifications: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  private guessIngredientForm(ingredientName: string): any {
    const name = ingredientName.toLowerCase();

    // Premium forms detection
    if (name.includes("methylcobalamin")) return "methylcobalamin";
    if (name.includes("methylfolate") || name.includes("5-mthf"))
      return "methylfolate";
    if (name.includes("chelated") || name.includes("glycinate"))
      return "chelated";
    if (name.includes("liposomal")) return "liposomal";
    if (name.includes("citrate")) return "citrate";

    // Poor forms detection
    if (name.includes("oxide")) return "oxide";
    if (name.includes("cyanocobalamin")) return "cyanocobalamin";
    if (name.includes("folic acid")) return "folic_acid";
    if (name.includes("carbonate")) return "carbonate";

    return "other";
  }

  private guessBioavailability(
    ingredientName: string
  ): "low" | "medium" | "high" {
    const name = ingredientName.toLowerCase();

    // High bioavailability indicators
    if (
      name.includes("liposomal") ||
      name.includes("methylated") ||
      name.includes("chelated") ||
      name.includes("glycinate")
    ) {
      return "high";
    }

    // Low bioavailability indicators
    if (
      name.includes("oxide") ||
      name.includes("carbonate") ||
      name.includes("sulfate")
    ) {
      return "low";
    }

    return "medium";
  }

  private mapCategory(category: string): any {
    const categoryMap = {
      supplement: "specialty",
      vitamin: "vitamin",
      mineral: "mineral",
      protein: "protein",
      herb: "herbal",
      probiotic: "probiotic",
      omega: "omega3",
      unknown: "specialty",
      food: "specialty",
    };

    return categoryMap[category] || "specialty";
  }

  private createNotFoundProduct(barcode: string): Product {
    return {
      id: `not_found_${barcode}`,
      name: "Product Not Found",
      brand: "Unknown",
      category: "specialty",
      barcode: barcode,
      ingredients: [],
      servingSize: "Unknown",
      servingsPerContainer: 1,
      imageUrl: undefined,
      verified: false,
      thirdPartyTested: false,
      certifications: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}

// Export the service instance
export const productService = new ProductService();

// Also export the analyzeScannedProduct function directly for convenience
export async function analyzeScannedProduct(
  barcode: string,
  userStack?: UserStack[]
): Promise<{ product: Product; analysis: ProductAnalysis }> {
  return productService.analyzeScannedProduct(barcode, userStack);
}
