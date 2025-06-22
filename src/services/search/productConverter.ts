// src/services/search/productConverter.ts
import type { Product, Ingredient, ProductCategory } from '../../types';

interface SearchResult {
  id: string;
  name: string;
  brand: string;
  category: string;
  imageUrl?: string;
  source: 'database' | 'dsld' | 'openfoodfacts';
  barcode?: string;
}

/**
 * Convert search result to Product format for analysis
 */
export const convertSearchResultToProduct = (searchResult: SearchResult): Product => {
  // Generate a unique ID if not provided
  const productId = searchResult.id || `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Map category string to ProductCategory enum
  const category = mapCategoryString(searchResult.category);
  
  // Create basic ingredients based on category (placeholder data)
  const ingredients = generateBasicIngredients(category, searchResult.name);
  
  return {
    id: productId,
    name: searchResult.name,
    brand: searchResult.brand,
    category,
    barcode: searchResult.barcode,
    ingredients,
    servingSize: "1 capsule", // Default serving size
    servingsPerContainer: 30, // Default container size
    dosage: "As directed", // Default dosage
    price: undefined, // Price not available from search
    imageUrl: searchResult.imageUrl,
    verified: searchResult.source === 'dsld', // DSLD is more verified
    thirdPartyTested: false, // Unknown from search results
    certifications: [], // Unknown from search results
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

/**
 * Map category string to ProductCategory enum
 */
const mapCategoryString = (categoryStr: string): ProductCategory => {
  const category = categoryStr.toLowerCase();
  
  if (category.includes('vitamin')) return 'vitamin';
  if (category.includes('mineral')) return 'mineral';
  if (category.includes('amino') || category.includes('protein')) return 'amino_acid';
  if (category.includes('herbal') || category.includes('herb')) return 'herbal';
  if (category.includes('protein')) return 'protein';
  if (category.includes('probiotic')) return 'probiotic';
  if (category.includes('omega') || category.includes('fish oil')) return 'omega3';
  if (category.includes('multi')) return 'multivitamin';
  
  return 'specialty'; // Default fallback
};

/**
 * Generate basic ingredients based on category and product name
 * This creates realistic placeholder data for analysis
 */
const generateBasicIngredients = (category: ProductCategory, productName: string): Ingredient[] => {
  const name = productName.toLowerCase();
  
  // Common ingredient patterns based on category
  switch (category) {
    case 'vitamin':
      return generateVitaminIngredients(name);
    case 'mineral':
      return generateMineralIngredients(name);
    case 'omega3':
      return generateOmega3Ingredients();
    case 'probiotic':
      return generateProbioticIngredients();
    case 'protein':
      return generateProteinIngredients();
    case 'multivitamin':
      return generateMultivitaminIngredients();
    case 'herbal':
      return generateHerbalIngredients(name);
    default:
      return generateGenericIngredients();
  }
};

const generateVitaminIngredients = (name: string): Ingredient[] => {
  const ingredients: Ingredient[] = [];
  
  if (name.includes('d3') || name.includes('vitamin d')) {
    ingredients.push({
      name: 'Vitamin D3 (Cholecalciferol)',
      amount: 1000,
      unit: 'IU',
      form: 'other',
      dailyValuePercentage: 250,
      bioavailability: 'high',
      evidenceLevel: 'rct_studies',
      category: 'active',
    });
  }
  
  if (name.includes('b12') || name.includes('cobalamin')) {
    ingredients.push({
      name: 'Vitamin B12',
      amount: 500,
      unit: 'mcg',
      form: 'methylcobalamin',
      dailyValuePercentage: 20833,
      bioavailability: 'high',
      evidenceLevel: 'rct_studies',
      category: 'active',
    });
  }
  
  if (name.includes('c') || name.includes('ascorbic')) {
    ingredients.push({
      name: 'Vitamin C (Ascorbic Acid)',
      amount: 500,
      unit: 'mg',
      form: 'other',
      dailyValuePercentage: 556,
      bioavailability: 'medium',
      evidenceLevel: 'rct_studies',
      category: 'active',
    });
  }
  
  // Add generic vitamin if no specific match
  if (ingredients.length === 0) {
    ingredients.push({
      name: 'Mixed Vitamins',
      amount: 100,
      unit: 'mg',
      form: 'other',
      dailyValuePercentage: 100,
      bioavailability: 'medium',
      evidenceLevel: 'clinical_trials',
      category: 'active',
    });
  }
  
  return ingredients;
};

const generateMineralIngredients = (name: string): Ingredient[] => {
  const ingredients: Ingredient[] = [];
  
  if (name.includes('magnesium')) {
    ingredients.push({
      name: 'Magnesium',
      amount: 200,
      unit: 'mg',
      form: 'glycinate',
      dailyValuePercentage: 48,
      bioavailability: 'high',
      evidenceLevel: 'rct_studies',
      category: 'active',
    });
  }
  
  if (name.includes('zinc')) {
    ingredients.push({
      name: 'Zinc',
      amount: 15,
      unit: 'mg',
      form: 'chelated',
      dailyValuePercentage: 136,
      bioavailability: 'high',
      evidenceLevel: 'rct_studies',
      category: 'active',
    });
  }
  
  if (name.includes('calcium')) {
    ingredients.push({
      name: 'Calcium',
      amount: 500,
      unit: 'mg',
      form: 'citrate',
      dailyValuePercentage: 38,
      bioavailability: 'medium',
      evidenceLevel: 'rct_studies',
      category: 'active',
    });
  }
  
  // Add generic mineral if no specific match
  if (ingredients.length === 0) {
    ingredients.push({
      name: 'Mixed Minerals',
      amount: 100,
      unit: 'mg',
      form: 'chelated',
      dailyValuePercentage: 100,
      bioavailability: 'medium',
      evidenceLevel: 'clinical_trials',
      category: 'active',
    });
  }
  
  return ingredients;
};

const generateOmega3Ingredients = (): Ingredient[] => [
  {
    name: 'EPA (Eicosapentaenoic Acid)',
    amount: 300,
    unit: 'mg',
    form: 'other',
    bioavailability: 'high',
    evidenceLevel: 'meta_analysis',
    category: 'active',
  },
  {
    name: 'DHA (Docosahexaenoic Acid)',
    amount: 200,
    unit: 'mg',
    form: 'other',
    bioavailability: 'high',
    evidenceLevel: 'meta_analysis',
    category: 'active',
  },
];

const generateProbioticIngredients = (): Ingredient[] => [
  {
    name: 'Lactobacillus acidophilus',
    amount: 1,
    unit: 'billion CFU',
    form: 'other',
    bioavailability: 'medium',
    evidenceLevel: 'rct_studies',
    category: 'active',
  },
  {
    name: 'Bifidobacterium bifidum',
    amount: 1,
    unit: 'billion CFU',
    form: 'other',
    bioavailability: 'medium',
    evidenceLevel: 'rct_studies',
    category: 'active',
  },
];

const generateProteinIngredients = (): Ingredient[] => [
  {
    name: 'Whey Protein Isolate',
    amount: 25,
    unit: 'g',
    form: 'other',
    bioavailability: 'high',
    evidenceLevel: 'rct_studies',
    category: 'active',
  },
];

const generateMultivitaminIngredients = (): Ingredient[] => [
  {
    name: 'Vitamin A',
    amount: 5000,
    unit: 'IU',
    form: 'other',
    dailyValuePercentage: 100,
    bioavailability: 'medium',
    evidenceLevel: 'rct_studies',
    category: 'active',
  },
  {
    name: 'Vitamin C',
    amount: 60,
    unit: 'mg',
    form: 'other',
    dailyValuePercentage: 100,
    bioavailability: 'medium',
    evidenceLevel: 'rct_studies',
    category: 'active',
  },
  {
    name: 'Vitamin D3',
    amount: 400,
    unit: 'IU',
    form: 'other',
    dailyValuePercentage: 100,
    bioavailability: 'high',
    evidenceLevel: 'rct_studies',
    category: 'active',
  },
];

const generateHerbalIngredients = (name: string): Ingredient[] => {
  if (name.includes('turmeric')) {
    return [{
      name: 'Turmeric Extract (Curcumin)',
      amount: 500,
      unit: 'mg',
      form: 'other',
      bioavailability: 'low',
      evidenceLevel: 'clinical_trials',
      category: 'active',
    }];
  }
  
  if (name.includes('ginkgo')) {
    return [{
      name: 'Ginkgo Biloba Extract',
      amount: 120,
      unit: 'mg',
      form: 'other',
      bioavailability: 'medium',
      evidenceLevel: 'clinical_trials',
      category: 'active',
    }];
  }
  
  return [{
    name: 'Herbal Extract',
    amount: 250,
    unit: 'mg',
    form: 'other',
    bioavailability: 'medium',
    evidenceLevel: 'observational',
    category: 'active',
  }];
};

const generateGenericIngredients = (): Ingredient[] => [
  {
    name: 'Active Compound',
    amount: 100,
    unit: 'mg',
    form: 'other',
    bioavailability: 'medium',
    evidenceLevel: 'clinical_trials',
    category: 'active',
  },
];
