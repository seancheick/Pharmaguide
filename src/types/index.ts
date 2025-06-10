export interface User {
  id: string;
  email: string;
  profile: UserProfile;
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  firstName?: string;
  lastName?: string;
  age?: number;
  gender?: "male" | "female" | "other" | "prefer_not_to_say";
  healthGoals: HealthGoal[];
  conditions: HealthCondition[];
  medications: Medication[];
  allergies: Allergy[];
  genetics?: GeneticProfile;
}

export interface UserPreferences {
  aiResponseStyle: "concise" | "detailed" | "technical";
  budgetRange: "budget" | "mid" | "premium";
  primaryFocus: "safety" | "efficacy" | "value" | "naturalness";
  notifications: NotificationSettings;
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
  bioavailability: "low" | "medium" | "high";
  evidenceLevel: EvidenceLevel;
  category: "active" | "inactive" | "excipient";
}

export interface ProductAnalysis {
  productId: string;
  overallScore: number;
  categoryScores: {
    ingredients: number;
    bioavailability: number;
    dosage: number;
    purity: number;
    value: number;
  };
  strengths: AnalysisPoint[];
  weaknesses: AnalysisPoint[];
  recommendations: {
    goodFor: string[];
    avoidIf: string[];
  };
  alternatives: Alternative[];
  safetyCheck: SafetyCheck;
  aiReasoning: string;
  generatedAt: string;
}

export interface AnalysisPoint {
  point: string;
  detail: string;
  importance: "low" | "medium" | "high";
  category: "safety" | "efficacy" | "quality" | "value";
}

export interface SafetyCheck {
  status: "safe" | "caution" | "warning" | "critical";
  interactions: DrugInteraction[];
  contraindications: string[];
  warnings: string[];
}

export interface DrugInteraction {
  type: "drug-drug" | "drug-supplement" | "supplement-supplement";
  severity: "minor" | "moderate" | "major" | "critical";
  description: string;
  recommendation: string;
  source: string;
}

export type ProductCategory =
  | "vitamin"
  | "mineral"
  | "amino_acid"
  | "herbal"
  | "protein"
  | "probiotic"
  | "omega3"
  | "multivitamin"
  | "specialty";

export type IngredientForm =
  | "methylcobalamin"
  | "cyanocobalamin"
  | "methylfolate"
  | "folic_acid"
  | "chelated"
  | "citrate"
  | "oxide"
  | "glycinate"
  | "liposomal"
  | "other";

export type EvidenceLevel =
  | "meta_analysis"
  | "rct_studies"
  | "clinical_trials"
  | "observational"
  | "case_reports"
  | "theoretical"
  | "marketing_claims";

export type RiskLevel = "NONE" | "LOW" | "MODERATE" | "HIGH" | "CRITICAL";

export interface InteractionDetail {
  type:
    | "Drug-Drug"
    | "Drug-Supplement"
    | "Supplement-Supplement"
    | "Nutrient-Limit";
  severity: RiskLevel;
  message: string;
  mechanism?: string;
  evidenceSources: Array<{
    badge: string;
    text: string;
  }>;
  recommendation: string;
}

export interface NutrientWarning {
  nutrient: string;
  currentTotal: number;
  upperLimit: number;
  unit: string;
  risk: string;
  percentOfLimit: number;
  recommendation: string;
}

export interface StackInteraction {
  riskLevel: RiskLevel;
  interactions: InteractionDetail[];
  nutrientWarnings?: NutrientWarning[];
  overallSafe: boolean;
}

export interface StackInteractionResult extends StackInteraction {}

export interface ProductAnalysis {
  overallScore: number;
  categoryScores: CategoryScores;
  strengths: AnalysisPoint[];
  weaknesses: AnalysisPoint[];
  recommendations: {
    goodFor: string[];
    avoidIf: string[];
  };
  aiReasoning?: string;
  stackInteraction?: StackInteraction; // NEW: Added
  generatedAt: string;
}

export interface UserStack {
  id: string;
  item_id: string;
  name: string;
  type: "medication" | "supplement";
  dosage: string;
  frequency: string;
  ingredients?: Array<{
    name: string;
    amount?: number;
    unit?: string;
  }>;
}
