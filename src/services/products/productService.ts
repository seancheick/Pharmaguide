// src/services/products/productService.ts

import { Product, ProductAnalysis, StackItem } from "@/types";
import { openFoodFactsService } from "./openfoodfacts";
import {
  productService as dbProductService,
  scanService,
  interactionService,
} from "@/services/database";
import { interactionChecker } from "../interactions/interactionService";

class ProductService {
  /**
   * Analyze a scanned product with the user's stack
   */
  async analyzeScannedProduct(
    barcode: string,
    userStack: StackItem[]
  ): Promise<{ product: Product; analysis: ProductAnalysis }> {
    try {
      // Get product (from DB or OpenFoodFacts)
      const product = await openFoodFactsService.getProduct(barcode);

      if (!product) {
        throw new Error("Product not found");
      }

      // Analyze with user's stack
      const analysis = await this.analyzeProduct(product, userStack);

      return { product, analysis };
    } catch (error) {
      console.error("Error analyzing scanned product:", error);
      throw error;
    }
  }

  /**
   * Analyze a product against the user's stack
   */
  async analyzeProduct(
    product: Product,
    userStack: StackItem[]
  ): Promise<ProductAnalysis> {
    // Check interactions with stack
    const interactions = await interactionChecker.checkProductWithStack(
      product,
      userStack
    );

    // Calculate scores
    const safetyScore = this.calculateSafetyScore(interactions);
    const efficacyScore = this.calculateEfficacyScore(product);
    const valueScore = this.calculateValueScore(product);

    return {
      overallScore: Math.round((safetyScore + efficacyScore + valueScore) / 3),
      safetyScore,
      efficacyScore,
      valueScore,
      interactions: interactions.interactions,
      nutrientWarnings: interactions.nutrientWarnings,
      certifications: product.certifications || [],
      thirdPartyTested: product.thirdPartyTested || false,
      recommendations: this.generateRecommendations(product, interactions),
    };
  }

  private calculateSafetyScore(interactions: any): number {
    if (interactions.overallRiskLevel === "CRITICAL") return 20;
    if (interactions.overallRiskLevel === "HIGH") return 40;
    if (interactions.overallRiskLevel === "MODERATE") return 60;
    if (interactions.overallRiskLevel === "LOW") return 80;
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

  private calculateValueScore(product: Product): number {
    // Placeholder - implement real value scoring
    return 70;
  }

  private generateRecommendations(
    product: Product,
    interactions: any
  ): string[] {
    const recommendations: string[] = [];

    if (
      interactions.overallRiskLevel === "HIGH" ||
      interactions.overallRiskLevel === "CRITICAL"
    ) {
      recommendations.push(
        "Consider consulting with a healthcare provider before use"
      );
    }

    if (interactions.nutrientWarnings.length > 0) {
      recommendations.push("Monitor total nutrient intake from all sources");
    }

    if (!product.thirdPartyTested) {
      recommendations.push(
        "Look for third-party tested alternatives for quality assurance"
      );
    }

    return recommendations;
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
}

export const productService = new ProductService();
