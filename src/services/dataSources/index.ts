// src/services/dataSources/index.ts

import { Product, Ingredient } from "@/types";

/**
 * NIH Dietary Supplement Label Database API
 * https://dsld.od.nih.gov/api-guide
 */
class DSLDService {
  private baseUrl = "https://api.ods.od.nih.gov/dsld/v9";

  async searchByBarcode(barcode: string): Promise<Product | null> {
    try {
      const response = await fetch(`${this.baseUrl}/supplement?upc=${barcode}`);
      const data = await response.json();

      if (data.list && data.list.length > 0) {
        return this.transformDSLDProduct(data.list[0]);
      }
      return null;
    } catch (error) {
      console.error("DSLD API error:", error);
      return null;
    }
  }

  async searchByName(name: string): Promise<Product[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/supplement?search=${encodeURIComponent(name)}&limit=10`
      );
      const data = await response.json();

      return data.list?.map(this.transformDSLDProduct) || [];
    } catch (error) {
      console.error("DSLD API error:", error);
      return [];
    }
  }

  private transformDSLDProduct(dsldProduct: any): Product {
    return {
      id: `dsld_${dsldProduct.dsld_id}`,
      name: dsldProduct.product_name,
      brand: dsldProduct.brand_name,
      category: "supplement",
      barcode: dsldProduct.upc,
      ingredients:
        dsldProduct.ingredients?.map((ing: any) => ({
          name: ing.ingredient_name,
          amount: ing.amount,
          unit: ing.unit,
        })) || [],
      servingSize: dsldProduct.serving_size,
      servingsPerContainer: dsldProduct.servings_per_container,
      imageUrl: dsldProduct.label_images?.[0],
      verified: true,
      thirdPartyTested: false,
      certifications: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}

/**
 * RxNorm API for medications
 * https://lhncbc.nlm.nih.gov/RxNav/APIs/
 */
class RxNormService {
  private baseUrl = "https://rxnav.nlm.nih.gov/REST";

  async searchMedication(name: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/drugs.json?name=${encodeURIComponent(name)}`
      );
      const data = await response.json();

      if (data.drugGroup?.conceptGroup) {
        return this.extractDrugConcepts(data.drugGroup.conceptGroup);
      }
      return [];
    } catch (error) {
      console.error("RxNorm API error:", error);
      return [];
    }
  }

  async getInteractions(rxcui: string): Promise<any> {
    try {
      // Note: RxNorm interaction API is being discontinued
      // We'll need to use alternative sources
      return [];
    } catch (error) {
      console.error("RxNorm interaction error:", error);
      return [];
    }
  }

  private extractDrugConcepts(conceptGroups: any[]): any[] {
    const concepts: any[] = [];
    conceptGroups.forEach((group) => {
      if (group.conceptProperties) {
        concepts.push(...group.conceptProperties);
      }
    });
    return concepts;
  }
}

/**
 * OpenFDA API for drug safety and labels
 * https://open.fda.gov/apis/
 */
class OpenFDAService {
  private baseUrl = "https://api.fda.gov";

  async searchDrugLabel(name: string): Promise<any> {
    try {
      const response = await fetch(
        `${
          this.baseUrl
        }/drug/label.json?search=openfda.brand_name:"${encodeURIComponent(
          name
        )}"&limit=5`
      );
      const data = await response.json();

      return data.results || [];
    } catch (error) {
      console.error("OpenFDA API error:", error);
      return [];
    }
  }

  async getAdverseEvents(productName: string): Promise<any> {
    try {
      const response = await fetch(
        `${
          this.baseUrl
        }/drug/event.json?search=patient.drug.medicinalproduct:"${encodeURIComponent(
          productName
        )}"&limit=10`
      );
      const data = await response.json();

      return data.results || [];
    } catch (error) {
      console.error("OpenFDA adverse events error:", error);
      return [];
    }
  }

  async getRecalls(productName: string): Promise<any> {
    try {
      const response = await fetch(
        `${
          this.baseUrl
        }/drug/enforcement.json?search=product_description:"${encodeURIComponent(
          productName
        )}"&limit=5`
      );
      const data = await response.json();

      return data.results || [];
    } catch (error) {
      console.error("OpenFDA recalls error:", error);
      return [];
    }
  }
}

/**
 * Multi-source data aggregator
 * Combines data from all available sources
 */
export class DataSourceAggregator {
  private dsld = new DSLDService();
  private rxnorm = new RxNormService();
  private openfda = new OpenFDAService();

  /**
   * Search all sources by barcode
   */
  async searchByBarcode(barcode: string): Promise<Product | null> {
    // Try DSLD first (best for supplements)
    const dsldProduct = await this.dsld.searchByBarcode(barcode);
    if (dsldProduct) {
      // Enrich with FDA data
      await this.enrichWithFDAData(dsldProduct);
      return dsldProduct;
    }

    // If not found, try OpenFoodFacts (already in your app)
    // Return null if nothing found
    return null;
  }

  /**
   * Search all sources by name
   */
  async searchByName(name: string): Promise<Product[]> {
    const results: Product[] = [];

    // Search supplements
    const dsldResults = await this.dsld.searchByName(name);
    results.push(...dsldResults);

    // TODO: Add medication search via RxNorm
    // TODO: Add OpenFDA search

    return results;
  }

  /**
   * Get comprehensive safety data
   */
  async getSafetyData(productName: string): Promise<any> {
    const [labels, adverseEvents, recalls] = await Promise.all([
      this.openfda.searchDrugLabel(productName),
      this.openfda.getAdverseEvents(productName),
      this.openfda.getRecalls(productName),
    ]);

    return {
      labels,
      adverseEvents,
      recalls,
      hasSafetyIssues: recalls.length > 0 || adverseEvents.length > 0,
    };
  }

  /**
   * Enrich product with FDA data
   */
  private async enrichWithFDAData(product: Product): Promise<void> {
    const safetyData = await this.getSafetyData(product.name);

    // Add any warnings or recalls to the product
    if (safetyData.hasSafetyIssues) {
      // Store in product metadata or create alerts
      console.warn("Safety issues found for:", product.name);
    }
  }
}

// Export singleton instance
export const dataSourceAggregator = new DataSourceAggregator();
