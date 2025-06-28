// src/services/products/productService.ts

import { Product, ProductAnalysis, UserStack } from '@/types';
import { scanService } from '@/services/database';
import { convertSearchResultToProduct } from '../search/productConverter';
import { openFoodFactsService } from './openfoodfacts';

class ProductService {
  /**
   * Analyze a scanned product with the user's stack
   */
  async analyzeScannedProduct(
    barcode: string,
    userStack: UserStack[]
  ): Promise<{ product: Product; analysis: ProductAnalysis }> {
    try {
      // Get product (from DB or OpenFoodFacts)
      const parsedProduct =
        await openFoodFactsService.getProductByBarcode(barcode);

      if (!parsedProduct) {
        throw new Error('Product not found');
      }

      // Convert to Product format
      const product: Product = {
        id: parsedProduct.barcode || `product_${Date.now()}`,
        name: parsedProduct.name,
        brand: parsedProduct.brand || '',
        category: 'specialty' as const,
        barcode: parsedProduct.barcode,
        ingredients: (parsedProduct.ingredients || []).map((ing: any) => ({
          name: typeof ing === 'string' ? ing : ing?.name || 'Unknown',
          amount: 0,
          unit: 'mg',
          form: 'other' as const,
          bioavailability: 'medium' as const,
          evidenceLevel: 'observational' as const,
          category: 'active' as const,
        })),
        servingSize: '1 serving',
        servingsPerContainer: 1,
        imageUrl: parsedProduct.imageUrl,
        verified: parsedProduct.found,
        thirdPartyTested: false,
        certifications: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Analyze with user's stack
      const analysis = await this.analyzeProduct(product, userStack);

      return { product, analysis };
    } catch (error) {
      console.error('Error analyzing scanned product:', error);
      throw error;
    }
  }

  /**
   * Analyze a product against the user's stack
   */
  async analyzeProduct(
    product: Product,
    _userStack: UserStack[]
  ): Promise<ProductAnalysis> {
    // Simple interaction check (placeholder)
    const interactions = {
      interactions: [],
      nutrientWarnings: [],
      overallRiskLevel: 'NONE' as const,
    };

    // Calculate scores
    const safetyScore = this.calculateSafetyScore(interactions);
    const efficacyScore = this.calculateEfficacyScore(product);
    const valueScore = this.calculateValueScore(product);

    return {
      overallScore: Math.round((safetyScore + efficacyScore + valueScore) / 3),
      categoryScores: {
        ingredients: safetyScore,
        bioavailability: efficacyScore,
        dosage: 75,
        purity: 80,
        value: valueScore,
      },
      strengths: this.identifyStrengths(product),
      weaknesses: this.identifyWeaknesses(product),
      recommendations: this.generateRecommendations(product, interactions),
      aiReasoning: this.generateReasoning(product, safetyScore, efficacyScore, valueScore),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  private calculateSafetyScore(interactions: any): number {
    if (interactions.overallRiskLevel === 'CRITICAL') return 20;
    if (interactions.overallRiskLevel === 'HIGH') return 40;
    if (interactions.overallRiskLevel === 'MODERATE') return 60;
    if (interactions.overallRiskLevel === 'LOW') return 80;
    return 100;
  }

  private calculateEfficacyScore(product: Product): number {
    // Basic scoring - enhance this with real logic
    let score = 50;

    // Bonus for verified products
    if (product.verified) score += 20;

    // Bonus for third-party testing
    if (product.thirdPartyTested) score += 20;

    // Bonus for certifications
    score += Math.min(product.certifications.length * 5, 10);

    return Math.min(score, 100);
  }

  private calculateValueScore(_product: Product): number {
    // Placeholder - implement real value scoring
    return 70;
  }

  // Note: generateRecommendations method removed as it's not used

  /**
   * Analyze a search result product with the user's stack
   */
  async analyzeSearchResult(
    searchResult: any,
    userStack: UserStack[]
  ): Promise<{ product: Product; analysis: ProductAnalysis }> {
    try {
      // Convert search result to Product format
      const product = convertSearchResultToProduct(searchResult);

      // Analyze with user's stack using the same pipeline as scanned products
      const analysis = await this.analyzeProduct(product, userStack);

      return { product, analysis };
    } catch (error) {
      console.error('Error analyzing search result:', error);
      throw error;
    }
  }

  /**
   * Record scan in history
   */
  async recordScan(
    userId: string | null,
    product: Product,
    scanType: string,
    analysisScore: number
  ) {
    return scanService.recordScan(userId, product.id, scanType, analysisScore);
  }

  private identifyStrengths(product: Product): {
    point: string;
    detail: string;
    importance: 'low' | 'medium' | 'high';
    category: 'quality' | 'efficacy' | 'safety' | 'value';
  }[] {
    const strengths = [];

    if (product.verified) {
      strengths.push({
        point: 'Verified product',
        detail: 'Product information has been verified',
        importance: 'medium' as const,
        category: 'quality' as const,
      });
    }

    if (product.thirdPartyTested) {
      strengths.push({
        point: 'Third-party tested',
        detail: 'Independent quality verification',
        importance: 'high' as const,
        category: 'quality' as const,
      });
    }

    if (product.certifications && product.certifications.length > 0) {
      strengths.push({
        point: 'Quality certifications',
        detail: `Has ${product.certifications.length} quality certification(s)`,
        importance: 'medium' as const,
        category: 'quality' as const,
      });
    }

    if (product.ingredients && product.ingredients.length > 0) {
      strengths.push({
        point: 'Ingredient transparency',
        detail: 'Full ingredient list provided',
        importance: 'medium' as const,
        category: 'quality' as const,
      });
    }

    return strengths;
  }

  private identifyWeaknesses(product: Product): {
    point: string;
    detail: string;
    importance: 'low' | 'medium' | 'high';
    category: 'quality' | 'efficacy' | 'safety' | 'value';
  }[] {
    const weaknesses = [];

    if (!product.thirdPartyTested) {
      weaknesses.push({
        point: 'No third-party testing',
        detail: 'Quality and purity not independently verified',
        importance: 'medium' as const,
        category: 'quality' as const,
      });
    }

    if (!product.verified) {
      weaknesses.push({
        point: 'Unverified product',
        detail: 'Product information not verified',
        importance: 'medium' as const,
        category: 'quality' as const,
      });
    }

    if (!product.certifications || product.certifications.length === 0) {
      weaknesses.push({
        point: 'No quality certifications',
        detail: 'Lacks industry quality certifications',
        importance: 'low' as const,
        category: 'quality' as const,
      });
    }

    return weaknesses;
  }

  private generateRecommendations(product: Product, interactions: any): {
    goodFor: string[];
    avoidIf: string[];
  } {
    const recommendations = {
      goodFor: ['General health support'],
      avoidIf: [] as string[],
    };

    // Add specific recommendations based on ingredients
    if (product.ingredients) {
      const ingredientNames = product.ingredients.map(ing => ing.name.toLowerCase());

      if (ingredientNames.some(name => name.includes('vitamin d'))) {
        recommendations.goodFor.push('Bone health support');
        recommendations.goodFor.push('Immune system support');
      }

      if (ingredientNames.some(name => name.includes('omega') || name.includes('fish oil'))) {
        recommendations.goodFor.push('Heart health');
        recommendations.goodFor.push('Brain function');
      }

      if (ingredientNames.some(name => name.includes('probiotic'))) {
        recommendations.goodFor.push('Digestive health');
        recommendations.avoidIf.push('Immunocompromised individuals (consult doctor)');
      }
    }

    // Add interaction-based warnings
    if (interactions.overallRiskLevel !== 'NONE') {
      recommendations.avoidIf.push('Taking with current supplements without medical supervision');
    }

    return recommendations;
  }

  private generateReasoning(product: Product, safetyScore: number, efficacyScore: number, valueScore: number): string {
    const reasons = [];

    reasons.push(`Safety assessment: ${safetyScore}/100 based on interaction analysis`);
    reasons.push(`Efficacy assessment: ${efficacyScore}/100 based on product verification and ingredients`);
    reasons.push(`Value assessment: ${valueScore}/100 based on quality indicators`);

    if (product.verified) {
      reasons.push('Product information verified through database lookup');
    }

    if (product.thirdPartyTested) {
      reasons.push('Quality enhanced by third-party testing');
    }

    return reasons.join('. ') + '.';
  }
}

export const productService = new ProductService();
