// src/services/products/index.ts
import { openFoodFactsService, ParsedProduct } from './openfoodfacts';
import { huggingfaceService } from '../ai/huggingface';
import { interactionService } from '../interactions';
import { scanRateLimiter } from '../../utils/rateLimiting';
import { sanitizeApiResponse } from '../../utils/sanitization';
import { getErrorMessage } from '../../utils/errorHandling';
import type {
  Product,
  ProductAnalysis,
  Ingredient,
  UserStack,
} from '../../types';
export { openFoodFactsService } from './openfoodfacts';
export { interactionService } from '../interactions';

export class ProductService {
  // Add a cache for product analysis results
  private productCache: Map<
    string,
    { product: Product; analysis: ProductAnalysis; timestamp: number }
  > = new Map();

  // Cache expiration time (24 hours in milliseconds)
  private CACHE_EXPIRATION = 24 * 60 * 60 * 1000;

  async analyzeScannedProduct(
    barcode: string,
    userStack?: UserStack[],
    userId?: string
  ): Promise<{ product: Product; analysis: ProductAnalysis }> {
    try {
      // Check rate limiting
      const isAllowed = await scanRateLimiter.isAllowed(userId);
      if (!isAllowed) {
        const timeUntilReset = scanRateLimiter.getTimeUntilReset(userId);
        throw new Error(
          `Scan rate limit exceeded. Try again in ${Math.ceil(timeUntilReset / 1000)} seconds.`
        );
      }

      console.log('📊 Starting product analysis for:', barcode);

      // Check cache first
      const cachedResult = this.productCache.get(barcode);
      if (
        cachedResult &&
        Date.now() - cachedResult.timestamp < this.CACHE_EXPIRATION
      ) {
        console.log('📦 Using cached product analysis for:', barcode);

        // Still check interactions even for cached products
        if (userStack && userStack.length > 0) {
          const stackAnalysis =
            await interactionService.analyzeProductWithStack(
              cachedResult.product,
              userStack
            );
          cachedResult.analysis.stackInteraction = stackAnalysis;
        }

        return {
          product: cachedResult.product,
          analysis: cachedResult.analysis,
        };
      }

      // Step 1: Get product data from OpenFoodFacts
      const parsedProduct = await openFoodFactsService.getProductByBarcode(
        // Capital F
        barcode
      );

      if (!parsedProduct.found) {
        throw new Error('Product not found in database');
      }

      // Step 2: Convert to our Product format
      const product = this.convertToProduct(parsedProduct);

      // Step 3: Generate AI analysis
      const partialAnalysis = await huggingfaceService.generateProductAnalysis(
        product,
        true
      );

      // Step 4: Add stack interaction analysis if userStack is provided
      const analysis = await this.addStackInteractionAnalysis(
        partialAnalysis,
        product,
        userStack
      );

      // Cache the result
      this.productCache.set(barcode, {
        product,
        analysis,
        timestamp: Date.now(),
      });

      console.log('✅ Product analysis complete:', {
        found: true,
        hasInteractions: analysis.stackInteraction?.overallRiskLevel !== 'NONE',
        name: product.name,
        score: analysis.overallScore,
      });

      return { product, analysis };
    } catch (error) {
      console.error('❌ Product analysis error:', error);

      // Return a fallback product and analysis
      const fallbackProduct = this.createNotFoundProduct(barcode);
      const fallbackAnalysis = this.createFallbackAnalysis();

      return { product: fallbackProduct, analysis: fallbackAnalysis };
    }
  }

  // ADD THIS METHOD - IT'S MISSING!
  private async addStackInteractionAnalysis(
    partialAnalysis: Partial<ProductAnalysis>,
    product: Product,
    userStack?: UserStack[]
  ): Promise<ProductAnalysis> {
    // Create full analysis with all required fields
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
      aiReasoning: partialAnalysis.aiReasoning || 'Analysis in progress...',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      generatedAt: partialAnalysis.generatedAt,
    };

    // Add stack interaction analysis if userStack is provided
    if (userStack && userStack.length > 0) {
      console.log('🔍 Checking interactions with user stack...');
      const stackAnalysis = await interactionService.analyzeProductWithStack(
        product,
        userStack
      );
      fullAnalysis.stackInteraction = stackAnalysis;
      console.log(
        `✅ Stack analysis complete. Risk: ${stackAnalysis.overallRiskLevel}`
      );
    }

    return fullAnalysis;
  }

  // ADD THIS METHOD - IT'S MISSING!
  private createFallbackAnalysis(): ProductAnalysis {
    return {
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
          point: 'Product not found',
          detail:
            'Unable to analyze this product. It may not be in our database.',
          importance: 'high',
          category: 'quality',
        },
      ],
      recommendations: {
        goodFor: [],
        avoidIf: [],
      },
      aiReasoning:
        'Product not found in database. Please try scanning another product.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  private convertToProduct(parsedProduct: ParsedProduct): Product {
    const ingredients: Ingredient[] = parsedProduct.ingredients.map(
      (name, index) => ({
        name: name.toLowerCase(),
        amount: 0,
        unit: 'mg',
        form: this.guessIngredientForm(name),
        dailyValuePercentage: undefined,
        bioavailability: this.guessBioavailability(name),
        evidenceLevel: 'marketing_claims',
        category: 'active',
      })
    );

    return {
      id: `scanned_${parsedProduct.barcode}`,
      name: parsedProduct.name,
      brand: parsedProduct.brand,
      category: this.mapCategory(parsedProduct.category),
      barcode: parsedProduct.barcode,
      ingredients,
      servingSize: 'Unknown',
      servingsPerContainer: 1,
      imageUrl: parsedProduct.imageUrl,
      verified: parsedProduct.found,
      thirdPartyTested: false,
      certifications: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  private guessIngredientForm(ingredientName: string): string {
    const name = ingredientName.toLowerCase();
    const formMap: { [key: string]: string } = {
      methylcobalamin: 'methylcobalamin',
      methylfolate: 'methylfolate',
      '5-mthf': 'methylfolate',
      chelated: 'chelated',
      glycinate: 'chelated',
      liposomal: 'liposomal',
      citrate: 'citrate',
      oxide: 'oxide',
      cyanocobalamin: 'cyanocobalamin',
      'folic acid': 'folic_acid',
      carbonate: 'carbonate',
    };
    for (const [key, value] of Object.entries(formMap)) {
      if (name.includes(key)) return value;
    }
    return 'other';
  }

  private guessBioavailability(
    ingredientName: string
  ): 'low' | 'medium' | 'high' {
    const name = ingredientName.toLowerCase();
    const highBio = [
      'liposomal',
      'methylcobalamin',
      'methylfolate',
      'chelated',
      'glycinate',
      'citrate',
    ];
    const lowBio = ['oxide', 'carbonate', 'cyanocobalamin', 'folic acid'];
    if (highBio.some(term => name.includes(term))) return 'high';
    if (lowBio.some(term => name.includes(term))) return 'low';
    return 'medium';
  }

  private mapCategory(category: string): any {
    const categoryMap = {
      supplement: 'specialty',
      vitamin: 'vitamin',
      mineral: 'mineral',
      protein: 'protein',
      herb: 'herbal',
      probiotic: 'probiotic',
      omega: 'omega3',
      unknown: 'specialty',
      food: 'specialty',
    };

    return categoryMap[category as keyof typeof categoryMap] || 'specialty';
  }

  private createNotFoundProduct(barcode: string): Product {
    return {
      id: `not_found_${barcode}`,
      name: 'Product Not Found',
      brand: 'Unknown',
      category: 'specialty',
      barcode: barcode,
      ingredients: [],
      servingSize: 'Unknown',
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
  userStack?: UserStack[],
  userId?: string
): Promise<{ product: Product; analysis: ProductAnalysis }> {
  return productService.analyzeScannedProduct(barcode, userStack, userId);
}
