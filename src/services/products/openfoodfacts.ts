// src/services/products/openfoodfacts.ts

import { API_ENDPOINTS } from "../../constants";

export interface OpenFoodFactsProduct {
  code: string;
  product: {
    product_name?: string;
    brands?: string;
    categories?: string;
    ingredients_text?: string;
    nutriments?: {
      [key: string]: number | string;
    };
    image_url?: string;
    quantity?: string;
    packaging?: string;
    stores?: string;
    countries?: string;
    nutrition_grades?: string;
    ecoscore_grade?: string;
    nova_group?: number;
  };
  status: number;
  status_verbose: string;
}

export interface ParsedProduct {
  barcode: string;
  name: string;
  brand: string;
  category: string;
  ingredients: string[];
  imageUrl?: string;
  found: boolean;
  source: "openfoodfacts" | "manual";
}

class OpenFoodFactsService {
  private baseUrl: string;
  private cache: Map<string, OpenFoodFactsProduct> = new Map();

  constructor() {
    this.baseUrl = API_ENDPOINTS.OPENFOODFACTS;
  }

  async getProductByBarcode(barcode: string): Promise<ParsedProduct> {
    try {
      // Check cache first
      if (this.cache.has(barcode)) {
        const cached = this.cache.get(barcode)!;
        return this.parseOpenFoodFactsProduct(cached);
      }

      console.log("🔍 Fetching product from OpenFoodFacts:", barcode);

      // Use the latest API v2 endpoint
      const response = await fetch(
        `${this.baseUrl}/api/v2/product/${barcode}?fields=product_name,brands,categories,ingredients_text,nutriments,image_url,quantity,packaging,nutrition_grades,ecoscore_grade,nova_group`,
        {
          headers: {
            "User-Agent": "PharmaGuide/1.0.0 (contact@pharmaguide.app)",
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`OpenFoodFacts API error: ${response.status}`);
      }

      const data: OpenFoodFactsProduct = await response.json();

      // Cache successful responses
      if (data.status === 1) {
        this.cache.set(barcode, data);
      }

      return this.parseOpenFoodFactsProduct(data);
    } catch (error) {
      console.error("OpenFoodFacts API error:", error);
      return this.createNotFoundProduct(barcode);
    }
  }

  private parseOpenFoodFactsProduct(data: OpenFoodFactsProduct): ParsedProduct {
    if (data.status !== 1 || !data.product) {
      return this.createNotFoundProduct(data.code);
    }

    const product = data.product;

    // Parse ingredients from text
    const ingredients = this.parseIngredients(product.ingredients_text || "");

    // Determine category (prioritize supplement-related categories)
    const category = this.parseCategory(product.categories || "");

    return {
      barcode: data.code,
      name: product.product_name || "Unknown Product",
      brand: product.brands?.split(",")[0]?.trim() || "Unknown Brand",
      category,
      ingredients,
      imageUrl: product.image_url,
      found: true,
      source: "openfoodfacts",
    };
  }

  private parseIngredients(ingredientsText: string): string[] {
    if (!ingredientsText) return [];

    // Clean and split ingredients
    return ingredientsText
      .split(/[,;]/)
      .map((ingredient) => ingredient.trim())
      .filter((ingredient) => ingredient.length > 0)
      .slice(0, 20); // Limit to first 20 ingredients
  }

  private parseCategory(categories: string): string {
    const categoryList = categories
      .toLowerCase()
      .split(",")
      .map((c) => c.trim());

    // Priority mapping for supplement categories
    const supplementKeywords = [
      "vitamin",
      "mineral",
      "supplement",
      "protein",
      "amino",
      "probiotic",
      "omega",
      "fish oil",
      "multivitamin",
      "herb",
      "botanical",
      "enzyme",
      "fiber",
      "collagen",
    ];

    for (const keyword of supplementKeywords) {
      if (categoryList.some((cat) => cat.includes(keyword))) {
        return "supplement";
      }
    }

    // Return the first meaningful category
    const meaningfulCategories = categoryList.filter(
      (cat) =>
        cat.length > 3 && !cat.includes("food") && !cat.includes("product")
    );

    return meaningfulCategories[0] || "food";
  }

  private createNotFoundProduct(barcode: string): ParsedProduct {
    return {
      barcode,
      name: "Product Not Found",
      brand: "Unknown",
      category: "unknown",
      ingredients: [],
      found: false,
      source: "manual",
    };
  }
}

export const openFoodFactsService = new OpenFoodFactsService();
