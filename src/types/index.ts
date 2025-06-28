// src/types/index.ts
import type { UserProfile } from './healthProfile';

// Navigation types
export * from './navigation';

// Health Profile types - Import with alias to avoid conflicts
export * from './healthProfile';

// Type aliases for backward compatibility
export type StackItem = UserStack;
// Use the comprehensive UserProfile from healthProfile.ts
export type { UserProfile as HealthProfile } from './healthProfile';

// User types
export interface User {
  id: string;
  email: string | null;
  is_anonymous: boolean;
  profile: UserProfile;
  preferences: UserPreferences;
  points?: UserPoints;
  streaks?: UserStreaks;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  aiResponseStyle: 'concise' | 'detailed' | 'technical';
  budgetRange: 'budget' | 'mid' | 'premium';
  primaryFocus: 'safety' | 'efficacy' | 'value' | 'naturalness';
  notifications: {
    push_enabled: boolean;
    email_enabled: boolean;
    reminder_frequency: string;
  };
}

export interface UserPoints {
  total: number;
  level: number;
  levelTitle: string;
  nextLevelAt: number;
}

export interface UserStreaks {
  current: number;
  longest: number;
  lastActivity: string | null;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: ProductCategory;
  barcode?: string;
  ingredients: Ingredient[];
  servingSize: string;
  servingsPerContainer: number;
  dosage?: string;
  price?: number;
  imageUrl?: string;
  verified: boolean;
  thirdPartyTested: boolean;
  certifications: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  form: IngredientForm;
  dailyValuePercentage?: number;
  bioavailability: 'low' | 'medium' | 'high';
  evidenceLevel: EvidenceLevel;
  category: 'active' | 'inactive' | 'excipient';
}

export interface AnalysisPoint {
  point: string;
  detail: string;
  importance: 'low' | 'medium' | 'high';
  category: 'safety' | 'efficacy' | 'quality' | 'value';
}

export interface SafetyCheck {
  status: 'safe' | 'caution' | 'warning' | 'critical';
  interactions: DrugInteraction[];
  contraindications: string[];
  warnings: string[];
}

export interface DrugInteraction {
  type: 'drug-drug' | 'drug-supplement' | 'supplement-supplement';
  severity: 'minor' | 'moderate' | 'major' | 'critical'; // Assuming these are different from RiskLevel
  description: string;
  recommendation: string;
  source: string;
}

export type ProductCategory =
  | 'vitamin'
  | 'mineral'
  | 'amino_acid'
  | 'herbal'
  | 'protein'
  | 'probiotic'
  | 'omega3'
  | 'multivitamin'
  | 'specialty';

export type IngredientForm =
  | 'methylcobalamin'
  | 'cyanocobalamin'
  | 'methylfolate'
  | 'folic_acid'
  | 'chelated'
  | 'citrate'
  | 'oxide'
  | 'glycinate'
  | 'liposomal'
  | 'other';

export type EvidenceLevel =
  | 'meta_analysis'
  | 'rct_studies'
  | 'clinical_trials'
  | 'observational'
  | 'case_reports'
  | 'theoretical'
  | 'marketing_claims';

export type RiskLevel = 'NONE' | 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

// --- START: Unified Interaction and Stack Types ---

export interface InteractionDetail {
  type:
    | 'Drug-Drug'
    | 'Drug-Supplement'
    | 'Supplement-Supplement'
    | 'Nutrient-Limit';
  severity: RiskLevel;
  message: string;
  mechanism?: string;
  evidenceSources?: { badge: string; text: string }[];
  recommendation: string;
}

export interface NutrientWarning {
  nutrient: string;
  currentTotal: number;
  upperLimit: number;
  unit: string;
  risk: string;
  percentOfLimit: number;
  severity: RiskLevel;
  recommendation: string;
}

export interface StackInteractionResult {
  overallRiskLevel: RiskLevel;
  interactions: InteractionDetail[];
  nutrientWarnings?: NutrientWarning[];
  overallSafe: boolean;
}

export interface ProductAnalysis {
  productId?: string;
  overallScore: number;
  categoryScores: CategoryScores;
  strengths: AnalysisPoint[];
  weaknesses: AnalysisPoint[];
  recommendations: {
    goodFor: string[];
    avoidIf: string[];
  };
  alternatives?: Alternative[];
  safetyCheck?: SafetyCheck;
  aiReasoning: string;
  stackInteraction?: StackInteractionResult;
  generatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// --- END: Unified Interaction and Stack Types ---

export interface Alternative {
  name: string;
  brand: string;
  reasonForSuggestion: string;
  priceRange: string;
  link?: string;
}

export interface CategoryScores {
  ingredients: number;
  bioavailability: number;
  dosage: number;
  purity: number;
  value: number;
}

export interface UserStack {
  id: string;
  user_id: string;
  item_id: string;
  name: string;
  type: 'medication' | 'supplement';
  dosage: string;
  frequency: string;
  brand?: string;
  imageUrl?: string;
  ingredients?: { name: string; amount?: number; unit?: string }[];
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface HealthGoal {
  name: string;
}

export interface HealthCondition {
  name: string;
}

export interface Medication {
  name: string;
}

export interface Allergy {
  name: string;
}

export type GeneticProfile = object; // TODO: Replace with a more specific type if needed

export type NotificationSettings = object; // TODO: Replace with a more specific type if needed

export type AuthError = {
  message: string;
  code: string;
  originalError?: unknown; // NEW: Specify unknown instead of any
};
