// src/services/products/index.ts
import { huggingfaceService } from '../ai/huggingface';
import { interactionService } from '../interactions';
import { scanRateLimiter } from '../../utils/rateLimiting';
import type {
  Product,
  ProductAnalysis,
  Ingredient,
  IngredientForm,
  UserStack,
  ProductCategory,
} from '../../types';
import { openFoodFactsService, ParsedProduct } from './openfoodfacts';
export { openFoodFactsService } from './openfoodfacts';
export { interactionService } from '../interactions';

/**
 * Circuit Breaker Pattern for AI Service Protection
 * Prevents cascading failures when AI services are down
 */
class ProductServiceCircuitBreaker {
  private failures = 0;
  private lastFailTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private readonly failureThreshold = 5;
  private readonly resetTimeout = 60000; // 1 minute

  async execute<T>(
    primaryFn: () => Promise<T>,
    fallbackFn: () => Promise<T>,
    operation: string = 'AI Analysis'
  ): Promise<T> {
    // Check if circuit breaker is OPEN
    if (this.state === 'OPEN') {
      const timeSinceLastFail = Date.now() - this.lastFailTime;

      if (timeSinceLastFail < this.resetTimeout) {
        console.warn(
          `🔴 Circuit breaker OPEN for ${operation}, using fallback`
        );
        return fallbackFn();
      } else {
        // Try to transition to HALF_OPEN
        this.state = 'HALF_OPEN';
        console.log(
          `🟡 Circuit breaker HALF_OPEN for ${operation}, testing primary`
        );
      }
    }

    try {
      const result = await primaryFn();
      this.onSuccess(operation);
      return result;
    } catch (error) {
      const wasHalfOpen = this.state === 'HALF_OPEN';
      this.onFailure(operation, error);

      // If we were in HALF_OPEN and failed, or if circuit is now OPEN, use fallback
      if (wasHalfOpen || (this.state as string) === 'OPEN') {
        console.warn(`🔴 Circuit breaker using fallback for ${operation}`);
        return fallbackFn();
      }

      throw error;
    }
  }

  private onSuccess(operation: string) {
    if (this.failures > 0) {
      console.log(`✅ Circuit breaker recovered for ${operation}`);
    }
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure(operation: string, error: unknown) {
    this.failures++;
    this.lastFailTime = Date.now();

    console.warn(
      `⚠️ Circuit breaker failure ${this.failures}/${this.failureThreshold} for ${operation}:`,
      error instanceof Error ? error.message : String(error)
    );

    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
      console.error(
        `🔴 Circuit breaker OPEN for ${operation} after ${this.failures} failures`
      );
    }
  }

  getStatus() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailTime: this.lastFailTime,
      timeSinceLastFail: Date.now() - this.lastFailTime,
    };
  }
}

export class ProductService {
  // Add a cache for product analysis results
  private productCache: Map<
    string,
    { product: Product; analysis: ProductAnalysis; timestamp: number }
  > = new Map();

  // Cache expiration time (24 hours in milliseconds)
  private CACHE_EXPIRATION = 24 * 60 * 60 * 1000;

  // Circuit breaker for AI service protection
  private aiCircuitBreaker = new ProductServiceCircuitBreaker();

  /**
   * Get circuit breaker status for monitoring
   */
  getCircuitBreakerStatus() {
    return this.aiCircuitBreaker.getStatus();
  }

  /**
   * Enhanced Error Recovery - Multiple fallback layers for AI analysis
   * TIER 1: AI Analysis (HuggingFace/Groq)
   * TIER 2: Rule-based analysis (if available)
   * TIER 3: Basic analysis (always works)
   */
  private async analyzeWithEnhancedRecovery(
    product: Product,
    userStack?: UserStack[]
  ): Promise<ProductAnalysis> {
    // Primary: Try AI analysis with circuit breaker protection
    const primaryAnalysis = async (): Promise<ProductAnalysis> => {
      console.log('🤖 Attempting AI analysis...');
      const partialAnalysis = await huggingfaceService.generateProductAnalysis(
        product,
        true
      );
      return this.addStackInteractionAnalysis(
        partialAnalysis,
        product,
        userStack
      );
    };

    // Fallback: Rule-based analysis
    const fallbackAnalysis = async (): Promise<ProductAnalysis> => {
      console.log('📋 Using rule-based analysis fallback...');
      try {
        // Try to use rule-based engine if available
        const ruleBasedAnalysis = await this.createRuleBasedAnalysis(product);
        return this.addStackInteractionAnalysis(
          ruleBasedAnalysis,
          product,
          userStack
        );
      } catch (ruleError) {
        console.warn(
          'Rule-based analysis failed, using basic analysis:',
          ruleError
        );
        // Final fallback to basic analysis
        const basicAnalysis = this.createBasicAnalysis(product);
        return this.addStackInteractionAnalysis(
          basicAnalysis,
          product,
          userStack
        );
      }
    };

    try {
      return await this.aiCircuitBreaker.execute(
        primaryAnalysis,
        fallbackAnalysis,
        'Product Analysis'
      );
    } catch (error) {
      console.error(
        'All analysis methods failed, using emergency fallback:',
        error
      );
      // Emergency fallback - should never fail
      const emergencyAnalysis = this.createBasicAnalysis(product);
      return this.addStackInteractionAnalysis(
        emergencyAnalysis,
        product,
        userStack
      );
    }
  }

  /**
   * Create rule-based analysis (placeholder for future rule engine integration)
   */
  private async createRuleBasedAnalysis(
    product: Product
  ): Promise<Partial<ProductAnalysis>> {
    // This is a placeholder - in the future, integrate with your rule-based engine
    // For now, create a simplified analysis based on product data
    return {
      overallScore: this.calculateBasicScore(product),
      categoryScores: {
        ingredients: 75,
        bioavailability: 70,
        dosage: 75,
        purity: 80,
        value: 70,
      },
      strengths: [
        {
          point: 'Product information available',
          detail: 'Basic product data successfully retrieved',
          importance: 'medium' as const,
          category: 'quality' as const,
        },
      ],
      weaknesses: [],
      recommendations: {
        goodFor: ['General use'],
        avoidIf: [],
      },
      aiReasoning: 'Analysis completed using rule-based fallback system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Create basic analysis that always works (emergency fallback)
   */
  private createBasicAnalysis(product: Product): Partial<ProductAnalysis> {
    return {
      overallScore: 65, // Conservative default score
      categoryScores: {
        ingredients: 65,
        bioavailability: 65,
        dosage: 65,
        purity: 65,
        value: 65,
      },
      strengths: [
        {
          point: 'Product identified',
          detail: `Successfully identified ${product.name}`,
          importance: 'low' as const,
          category: 'quality' as const,
        },
      ],
      weaknesses: [
        {
          point: 'Limited analysis available',
          detail: 'Detailed analysis temporarily unavailable',
          importance: 'low' as const,
          category: 'quality' as const,
        },
      ],
      recommendations: {
        goodFor: ['Consult healthcare provider for guidance'],
        avoidIf: ['If you have known allergies to ingredients'],
      },
      aiReasoning:
        'Basic analysis - detailed AI analysis temporarily unavailable',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Calculate basic score based on available product data
   */
  private calculateBasicScore(product: Product): number {
    let score = 50; // Base score

    // Add points for having ingredients
    if (product.ingredients && product.ingredients.length > 0) {
      score += 15;
    }

    // Add points for having serving size info
    if (product.servingSize && product.servingSize !== 'Unknown') {
      score += 10;
    }

    // Add points for having brand info
    if (product.brand) {
      score += 5;
    }

    // Add points for having category
    if (product.category) {
      score += 5;
    }

    return Math.min(score, 80); // Cap at 80 for basic analysis
  }

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

      // Step 3: Generate AI analysis with enhanced error recovery
      const analysis = await this.analyzeWithEnhancedRecovery(
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
    const ingredients: Ingredient[] = parsedProduct.ingredients.map(name => ({
      name: name.toLowerCase(),
      amount: 0,
      unit: 'mg',
      form: this.guessIngredientForm(name),
      dailyValuePercentage: undefined,
      bioavailability: this.guessBioavailability(name),
      evidenceLevel: 'marketing_claims',
      category: 'active',
    }));

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

  private guessIngredientForm(ingredientName: string): IngredientForm {
    const name = ingredientName.toLowerCase();
    const formMap: { [key: string]: IngredientForm } = {
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
      carbonate: 'other', // carbonate is not in IngredientForm, map to 'other'
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

  private mapCategory(category: string): ProductCategory {
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

    return (categoryMap[category as keyof typeof categoryMap] ||
      'specialty') as ProductCategory;
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
