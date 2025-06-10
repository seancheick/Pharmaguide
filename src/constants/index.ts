export const COLORS = {
  primary: "#2563EB",
  primaryDark: "#1D4ED8",
  secondary: "#10B981",
  accent: "#F59E0B",
  error: "#EF4444",
  warning: "#F97316",
  success: "#22C55E",

  // Grays
  gray50: "#F9FAFB",
  gray100: "#F3F4F6",
  gray200: "#E5E7EB",
  gray300: "#D1D5DB",
  gray400: "#9CA3AF",
  gray500: "#6B7280",
  gray600: "#4B5563",
  gray700: "#374151",
  gray800: "#1F2937",
  gray900: "#111827",

  // Backgrounds
  background: "#FFFFFF",
  backgroundSecondary: "#F9FAFB",
  surface: "#FFFFFF",

  // Text
  textPrimary: "#111827",
  textSecondary: "#6B7280",
  textTertiary: "#9CA3AF",
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const TYPOGRAPHY = {
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 30,
  },
  weights: {
    normal: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
  },
};

export const API_ENDPOINTS = {
  HUGGINGFACE: "https://api-inference.huggingface.co",
  HUGGINGFACE_MODELS: "https://api-inference.huggingface.co/models", // Added this line
  OPENFOODFACTS: "https://world.openfoodfacts.org",
  GROQ: "https://api.groq.com/openai/v1",
};

export const AI_MODELS = {
  HUGGINGFACE: {
    TEXT_GENERATION: "google/flan-t5-base", // Changed from gpt2
    TEXT_GENERATION_ALT: "microsoft/BioGPT", // Health-specific backup
    CLASSIFICATION: "cardiffnlp/twitter-roberta-base-sentiment-latest",
    CLASSIFICATION_ALT: "facebook/bart-large-mnli",
    EMBEDDINGS: "sentence-transformers/all-MiniLM-L6-v2",
  },
  GROQ: {
    FAST: "llama3-8b-8192",
    BALANCED: "mixtral-8x7b-32768",
  },
};

export const CRITICAL_INTERACTIONS = {
  warfarin: {
    supplements: ["vitamin_k", "ginkgo", "garlic", "fish_oil", "vitamin_e"],
    severity: "CRITICAL",
    mechanism: "Altered blood clotting",
    evidence: "Bleeding risk - monitor INR closely",
  },
  metformin: {
    supplements: ["chromium", "bitter_melon", "alpha_lipoic_acid"],
    severity: "MODERATE",
    mechanism: "Additive blood sugar lowering",
    evidence: "Hypoglycemia risk",
  },
  statin: {
    supplements: ["red_yeast_rice", "niacin", "coq10"],
    severity: "MODERATE",
    mechanism: "Increased muscle damage risk",
    evidence: "Myopathy and rhabdomyolysis risk",
  },
  ssri: {
    supplements: ["st_johns_wort", "5_htp", "sam_e"],
    severity: "HIGH",
    mechanism: "Serotonin syndrome risk",
    evidence: "FDA warning on serotonin syndrome",
  },
  blood_pressure: {
    supplements: ["licorice", "yohimbe", "bitter_orange"],
    severity: "HIGH",
    mechanism: "Blood pressure alterations",
    evidence: "Hypertension risk",
  },
};

export const NUTRIENT_LIMITS = {
  vitamin_d: { ul: 4000, unit: "IU", risk: "Hypercalcemia, kidney stones" },
  vitamin_a: { ul: 10000, unit: "IU", risk: "Liver damage, birth defects" },
  iron: { ul: 45, unit: "mg", risk: "GI distress, organ damage" },
  zinc: { ul: 40, unit: "mg", risk: "Copper deficiency, immune suppression" },
  vitamin_e: { ul: 1000, unit: "mg", risk: "Bleeding risk" },
  vitamin_b6: { ul: 100, unit: "mg", risk: "Nerve damage" },
  magnesium: { ul: 350, unit: "mg", risk: "Diarrhea (from supplements only)" },
  calcium: {
    ul: 2500,
    unit: "mg",
    risk: "Kidney stones, cardiovascular issues",
  },
};
