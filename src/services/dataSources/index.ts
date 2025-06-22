// src/services/dataSources/index.ts

import { Product, Ingredient } from '@/types';

/**
 * NIH Dietary Supplement Label Database API
 * https://dsld.od.nih.gov/api-guide
 */
class DSLDService {
  private baseUrl = 'https://api.ods.od.nih.gov/dsld/v9';

  async searchByBarcode(barcode: string): Promise<Product | null> {
    try {
      // Use search-filter endpoint with UPC search
      const response = await fetch(
        `${this.baseUrl}/search-filter?q=${encodeURIComponent(barcode)}&sort_by=_score&sort_order=desc&status=2&from=0&size=1`
      );
      const data = await response.json();

      if (data.hits && data.hits.length > 0) {
        return this.transformDSLDProduct(data.hits[0]._source);
      }
      return null;
    } catch (error) {
      console.error('DSLD API error:', error);
      return null;
    }
  }

  async searchByName(name: string): Promise<Product[]> {
    try {
      // Use the correct search-filter endpoint for product name search
      const response = await fetch(
        `${this.baseUrl}/search-filter?q=${encodeURIComponent(name)}&sort_by=_score&sort_order=desc&status=1&from=0&size=20`
      );
      const data = await response.json();

      if (data.hits && data.hits.length > 0) {
        return data.hits.map((hit: any) =>
          this.transformDSLDProduct(hit._source)
        );
      }
      return [];
    } catch (error) {
      console.error('DSLD search by name error:', error);
      return [];
    }
  }

  /**
   * Advanced search with filters
   */
  async searchWithFilters(options: {
    query?: string;
    productName?: string;
    brand?: string;
    ingredientName?: string;
    productType?: string;
    supplementForm?: string;
    limit?: number;
  }): Promise<Product[]> {
    try {
      const params = new URLSearchParams();

      // Main query
      params.append('q', options.query || '*');
      params.append('sort_by', '_score');
      params.append('sort_order', 'desc');
      params.append('status', '1'); // Only on-market products
      params.append('from', '0');
      params.append('size', (options.limit || 20).toString());

      // Add filters
      if (options.productName) {
        params.append('product_name', options.productName);
      }
      if (options.brand) {
        params.append('brand', options.brand);
      }
      if (options.ingredientName) {
        params.append('ingredient_name', options.ingredientName);
      }
      if (options.productType) {
        params.append('product_type', options.productType);
      }
      if (options.supplementForm) {
        params.append('supplement_form', options.supplementForm);
      }

      const response = await fetch(
        `${this.baseUrl}/search-filter?${params.toString()}`
      );
      const data = await response.json();

      if (data.hits && data.hits.length > 0) {
        return data.hits.map((hit: any) =>
          this.transformDSLDProduct(hit._source)
        );
      }
      return [];
    } catch (error) {
      console.error('DSLD advanced search error:', error);
      return [];
    }
  }

  private transformDSLDProduct(dsldProduct: any): Product {
    // Handle the new DSLD API response format
    const productName =
      dsldProduct.fullName || dsldProduct.product_name || 'Unknown Product';
    const brandName =
      dsldProduct.brandName || dsldProduct.brand_name || 'Unknown Brand';
    const upcCode = dsldProduct.upcSku || dsldProduct.upc;

    return {
      id: `dsld_${dsldProduct.id || dsldProduct.dsld_id}`,
      name: productName,
      brand: brandName,
      category: this.mapDSLDCategory(
        dsldProduct.productType?.langualCodeDescription ||
          dsldProduct.product_type
      ),
      barcode: upcCode,
      ingredients: this.transformDSLDIngredients(
        dsldProduct.ingredientRows || dsldProduct.ingredients || []
      ),
      servingSize: this.extractServingSize(
        dsldProduct.servingSizes || dsldProduct.serving_size
      ),
      servingsPerContainer:
        dsldProduct.servingsPerContainer ||
        dsldProduct.servings_per_container ||
        30,
      dosage:
        this.extractDosage(dsldProduct.servingSizes) ||
        dsldProduct.directions ||
        'As directed',
      price: undefined,
      imageUrl: dsldProduct.thumbnail || dsldProduct.label_images?.[0],
      verified: true,
      thirdPartyTested: false,
      certifications: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Extract serving size from DSLD serving sizes array
   */
  private extractServingSize(servingSizes: any): string {
    if (Array.isArray(servingSizes) && servingSizes.length > 0) {
      const serving = servingSizes[0];
      const quantity = serving.minQuantity || serving.maxQuantity || 1;
      const unit = serving.unit || 'serving';
      return `${quantity} ${unit}`;
    }
    return '1 serving';
  }

  /**
   * Extract dosage information from serving sizes
   */
  private extractDosage(servingSizes: any): string | undefined {
    if (Array.isArray(servingSizes) && servingSizes.length > 0) {
      const serving = servingSizes[0];
      const dailyServings =
        serving.minDailyServings || serving.maxDailyServings;
      if (dailyServings) {
        return `Take ${dailyServings} time${dailyServings > 1 ? 's' : ''} daily`;
      }
    }
    return undefined;
  }

  /**
   * Map DSLD product type to our category system
   */
  private mapDSLDCategory(productType: string): string {
    if (!productType) return 'supplement';

    const type = productType.toLowerCase();
    if (type.includes('vitamin')) return 'vitamin';
    if (type.includes('mineral')) return 'mineral';
    if (type.includes('amino') || type.includes('protein')) return 'amino_acid';
    if (type.includes('botanical')) return 'herbal';
    if (type.includes('omega') || type.includes('fatty')) return 'omega3';
    if (type.includes('multi')) return 'multivitamin';

    return 'supplement';
  }

  /**
   * Transform DSLD ingredients to our format
   */
  private transformDSLDIngredients(ingredientRows: any[]): Ingredient[] {
    if (!Array.isArray(ingredientRows)) return [];

    return ingredientRows.map((row: any) => {
      const quantity = row.quantity?.[0];
      return {
        name: row.name || row.ingredient_name || 'Unknown Ingredient',
        amount: quantity?.quantity || row.amount || 0,
        unit: quantity?.unit || row.unit || 'mg',
        form: row.forms?.[0]?.name || 'other',
        dailyValuePercentage: quantity?.dailyValueTargetGroup?.[0]?.percent,
        bioavailability: 'medium', // Default
        evidenceLevel: 'clinical_trials', // Default
        category:
          row.category === 'vitamin' || row.category === 'mineral'
            ? 'active'
            : 'other',
      } as Ingredient;
    });
  }
}

/**
 * RxNorm API for medications
 * https://lhncbc.nlm.nih.gov/RxNav/APIs/
 */
class RxNormService {
  private baseUrl = 'https://rxnav.nlm.nih.gov/REST';

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
      console.error('RxNorm API error:', error);
      return [];
    }
  }

  async getInteractions(rxcui: string): Promise<any> {
    try {
      // Note: RxNorm interaction API is being discontinued
      // We'll need to use alternative sources
      return [];
    } catch (error) {
      console.error('RxNorm interaction error:', error);
      return [];
    }
  }

  private extractDrugConcepts(conceptGroups: any[]): any[] {
    const concepts: any[] = [];
    conceptGroups.forEach(group => {
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
  private baseUrl = 'https://api.fda.gov';

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
      console.error('OpenFDA API error:', error);
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
      console.error('OpenFDA adverse events error:', error);
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
      console.error('OpenFDA recalls error:', error);
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
      console.warn('Safety issues found for:', product.name);
    }
  }
}

// Export singleton instance
export const dataSourceAggregator = new DataSourceAggregator();
