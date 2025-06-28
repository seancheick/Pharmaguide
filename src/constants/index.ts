// src/constants/index.ts

export const COLORS = {
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  primaryLight: '#60A5FA',
  secondary: '#10B981',
  secondaryDark: '#059669',
  accent: '#F59E0B',
  error: '#EF4444',
  errorLight: '#FEF2F2',
  warning: '#F97316',
  warningLight: '#FFF7ED',
  success: '#22C55E',
  successLight: '#F0FDF4',
  info: '#3B82F6',
  infoLight: '#EFF6FF',

  // Grays
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',

  // Backgrounds
  background: '#FFFFFF',
  backgroundSecondary: '#F9FAFB',
  backgroundTertiary: '#F3F4F6',
  surface: '#FFFFFF',
  white: '#FFFFFF',

  // Glass morphism colors
  glass: 'rgba(255, 255, 255, 0.7)',
  glassLight: 'rgba(255, 255, 255, 0.9)',
  glassDark: 'rgba(0, 0, 0, 0.1)',
  glassBlur: 'rgba(255, 255, 255, 0.25)',

  // Borders
  border: '#E5E7EB',
  borderLight: 'rgba(229, 231, 235, 0.5)',
  borderGlass: 'rgba(255, 255, 255, 0.2)',

  // Text
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',

  // Interactive states
  hover: 'rgba(37, 99, 235, 0.1)',
  pressed: 'rgba(37, 99, 235, 0.2)',
  disabled: '#E5E7EB',

  // Shadows
  shadowLight: 'rgba(0, 0, 0, 0.05)',
  shadowMedium: 'rgba(0, 0, 0, 0.1)',
  shadowDark: 'rgba(0, 0, 0, 0.2)',
  shadowPrimary: 'rgba(37, 99, 235, 0.25)',
  shadowGlow: 'rgba(37, 99, 235, 0.4)',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const TYPOGRAPHY = {
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 30,
    xxxxl: 36,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  } as const,
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
  responsiveFontSizes: {
    xs: { small: 10, medium: 12, large: 14 },
    sm: { small: 12, medium: 14, large: 16 },
    base: { small: 14, medium: 16, large: 18 },
    md: { small: 14, medium: 16, large: 18 },
    lg: { small: 16, medium: 18, large: 20 },
    xl: { small: 18, medium: 20, large: 22 },
    xxl: { small: 20, medium: 24, large: 28 },
    xxxl: { small: 26, medium: 30, large: 34 },
    xxxxl: { small: 32, medium: 36, large: 40 },
  },
};

export const SHADOWS = {
  sm: {
    shadowColor: COLORS.shadowMedium,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: COLORS.shadowMedium,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 4,
  },
  lg: {
    shadowColor: COLORS.shadowDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
  },
};

export const API_ENDPOINTS = {
  HUGGINGFACE: 'https://api-inference.huggingface.co/models',
  HUGGINGFACE_MODELS: 'https://api-inference.huggingface.co/models',
  OPENFOODFACTS: 'https://world.openfoodfacts.org',
  GROQ: 'https://api.groq.com/openai/v1',
  PUBMED: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils',
  PUBMED_BACKUP: 'https://api.ncbi.nlm.nih.gov/lit/ctxp/v1/pubmed',
  DSLD: 'https://api.ods.od.nih.gov/dsld/v9',
  OPENFDA: 'https://api.fda.gov',
  USDA: 'https://api.nal.usda.gov/fdc/v1',
};

export const AI_MODELS = {
  HUGGINGFACE: {
    CLASSIFICATION: { id: 'facebook/bart-large-mnli', cacheable: true },
    CLASSIFICATION_ALT: {
      id: 'typeform/distilbert-base-uncased-mnli',
      cacheable: true,
    },
    EMBEDDINGS: {
      id: 'sentence-transformers/all-MiniLM-L6-v2',
      cacheable: true,
    },
    TEXT_GENERATION: { id: 'distilgpt2', cacheable: false },
    TEXT_GENERATION_ALT: { id: 'gpt2', cacheable: false },
    TEXT_GENERATION_SMALL: { id: 'google/flan-t5-small', cacheable: false },
    FALLBACK_TEXT: { id: 'EleutherAI/gpt-neo-125M', cacheable: false },
  },
  GROQ: {
    FAST: { id: 'llama3-8b-8192:v1', cacheable: true },
    FAST_ALT: { id: 'llama-3.1-8b-instant:v1', cacheable: true },
    BALANCED: { id: 'llama3-70b-8192:v1', cacheable: true },
  },
};

export interface InteractionRule {
  supplements: string[];
  medications: string[];
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  mechanism: string;
  evidence: string;
  management: string;
  sources: { id: string; type: VerificationLevel; url: string }[];
  category: string;
}

export const CRITICAL_INTERACTIONS: Record<string, InteractionRule> = {
  warfarin: {
    supplements: [
      'Vitamin K',
      'Ginkgo Biloba',
      'Garlic',
      'Fish Oil',
      'Vitamin E',
      'Ginger',
      'Turmeric',
      'Cranberry',
      'Coenzyme Q10',
      'Green Tea',
      'Dong Quai',
      'Feverfew',
      'Willow Bark',
    ],
    medications: ['Aspirin', 'Ibuprofen', 'Naproxen', 'Clopidogrel'],
    severity: 'CRITICAL',
    mechanism: 'Altered blood clotting - increases bleeding risk significantly',
    evidence:
      'Multiple high-quality clinical studies show significant INR changes and adverse events',
    management:
      'INR should be monitored closely, inform doctor about all supplements, dose adjustments may be needed',
    sources: [
      {
        id: 'pubmed_123456',
        type: 'CLINICAL_STUDY',
        url: 'https://pubmed.ncbi.nlm.nih.gov/123456/',
      },
    ],
    category: 'blood_thinner',
  },
  metformin: {
    supplements: [
      'Chromium',
      'Alpha-Lipoic Acid',
      'Bitter Melon',
      'Cinnamon',
      'Gymnema',
      'Fenugreek',
      'Berberine',
      'Vitamin B12',
    ],
    medications: ['Insulin', 'Glyburide', 'Glipizide'],
    severity: 'HIGH',
    mechanism: 'Enhanced glucose lowering effects, risk of hypoglycemia',
    evidence: 'Clinical studies show additive glucose-lowering effects',
    management: 'Monitor blood glucose closely, may need medication adjustment',
    sources: [
      {
        id: 'pubmed_234567',
        type: 'CLINICAL_STUDY',
        url: 'https://pubmed.ncbi.nlm.nih.gov/234567/',
      },
    ],
    category: 'diabetes',
  },
  insulin: {
    supplements: [
      'Chromium',
      'Alpha-Lipoic Acid',
      'Bitter Melon',
      'Cinnamon',
      'Gymnema',
      'Fenugreek',
      'Berberine',
      'Vanadium',
    ],
    medications: ['Metformin', 'Sulfonylureas'],
    severity: 'CRITICAL',
    mechanism:
      'Severe hypoglycemia risk from additive glucose-lowering effects',
    evidence: 'Multiple case reports of severe hypoglycemic episodes',
    management:
      'Frequent glucose monitoring required, immediate medical attention for symptoms',
    sources: [
      {
        id: 'pubmed_345678',
        type: 'CLINICAL_STUDY',
        url: 'https://pubmed.ncbi.nlm.nih.gov/345678/',
      },
    ],
    category: 'diabetes',
  },
  lisinopril: {
    supplements: [
      'Potassium',
      'Hawthorn',
      'Garlic',
      'Coenzyme Q10',
      'Magnesium',
      'Arginine',
      'Hibiscus',
    ],
    medications: ['Amlodipine', 'Hydrochlorothiazide', 'Losartan'],
    severity: 'HIGH',
    mechanism: 'Additive blood pressure lowering, risk of hypotension',
    evidence: 'Clinical studies show enhanced hypotensive effects',
    management: 'Monitor blood pressure regularly, adjust doses as needed',
    sources: [
      {
        id: 'pubmed_456789',
        type: 'CLINICAL_STUDY',
        url: 'https://pubmed.ncbi.nlm.nih.gov/456789/',
      },
    ],
    category: 'blood_pressure',
  },
  amlodipine: {
    supplements: [
      'Hawthorn',
      'Garlic',
      'Coenzyme Q10',
      'Magnesium',
      'Potassium',
      'Grapefruit',
    ],
    medications: ['Lisinopril', 'Metoprolol', 'Hydrochlorothiazide'],
    severity: 'HIGH',
    mechanism:
      'Enhanced hypotensive effects, potential for dangerous blood pressure drops',
    evidence: 'Multiple clinical trials demonstrate additive effects',
    management: 'Regular blood pressure monitoring, gradual dose adjustments',
    sources: [
      {
        id: 'pubmed_567890',
        type: 'CLINICAL_STUDY',
        url: 'https://pubmed.ncbi.nlm.nih.gov/567890/',
      },
    ],
    category: 'blood_pressure',
  },
  sertraline: {
    supplements: [
      "St. John's Wort",
      'SAM-e',
      '5-HTP',
      'Tryptophan',
      'Ginkgo',
      'Kava',
      'Valerian',
    ],
    medications: ['Fluoxetine', 'Paroxetine', 'Tramadol', 'Triptans'],
    severity: 'CRITICAL',
    mechanism: 'Serotonin syndrome risk from excessive serotonin activity',
    evidence: 'FDA warnings and multiple case reports of serotonin syndrome',
    management:
      'Avoid combination, seek immediate medical attention for symptoms',
    sources: [
      {
        id: 'pubmed_678901',
        type: 'CLINICAL_STUDY',
        url: 'https://pubmed.ncbi.nlm.nih.gov/678901/',
      },
    ],
    category: 'antidepressant',
  },
  fluoxetine: {
    supplements: [
      "St. John's Wort",
      'SAM-e',
      '5-HTP',
      'Tryptophan',
      'Ginkgo',
      'Kava',
    ],
    medications: ['Sertraline', 'Tramadol', 'Triptans'],
    severity: 'CRITICAL',
    mechanism: 'Serotonin syndrome and increased bleeding risk',
    evidence: 'Multiple clinical studies and FDA safety communications',
    management: 'Contraindicated combinations, close monitoring required',
    sources: [
      {
        id: 'pubmed_789012',
        type: 'CLINICAL_STUDY',
        url: 'https://pubmed.ncbi.nlm.nih.gov/789012/',
      },
    ],
    category: 'antidepressant',
  },
  levothyroxine: {
    supplements: [
      'Calcium',
      'Iron',
      'Magnesium',
      'Fiber',
      'Soy',
      'Biotin',
      'Kelp',
      'Iodine',
    ],
    medications: ['Calcium Carbonate', 'Omeprazole', 'Sucralfate'],
    severity: 'HIGH',
    mechanism: 'Reduced absorption leading to hypothyroidism',
    evidence: 'Well-documented absorption interactions in clinical studies',
    management: 'Separate administration by 4+ hours, monitor TSH levels',
    sources: [
      {
        id: 'pubmed_890123',
        type: 'CLINICAL_STUDY',
        url: 'https://pubmed.ncbi.nlm.nih.gov/890123/',
      },
    ],
    category: 'thyroid',
  },
  phenytoin: {
    supplements: [
      'Folic Acid',
      'Vitamin D',
      'Calcium',
      'Biotin',
      'Ginkgo',
      'Evening Primrose',
    ],
    medications: ['Carbamazepine', 'Valproic Acid'],
    severity: 'HIGH',
    mechanism: 'Altered drug metabolism and seizure threshold changes',
    evidence: 'Clinical studies show reduced anticonvulsant effectiveness',
    management: 'Monitor drug levels and seizure control closely',
    sources: [
      {
        id: 'pubmed_901234',
        type: 'CLINICAL_STUDY',
        url: 'https://pubmed.ncbi.nlm.nih.gov/901234/',
      },
    ],
    category: 'seizure',
  },
  cyclosporine: {
    supplements: [
      "St. John's Wort",
      'Echinacea',
      'Grapefruit',
      'Red Yeast Rice',
      'Berberine',
    ],
    medications: ['Tacrolimus', 'Sirolimus'],
    severity: 'CRITICAL',
    mechanism: 'Altered drug metabolism leading to rejection risk',
    evidence: 'Multiple case reports of organ rejection',
    management: 'Avoid herbal supplements, monitor drug levels frequently',
    sources: [
      {
        id: 'pubmed_912345',
        type: 'CLINICAL_STUDY',
        url: 'https://pubmed.ncbi.nlm.nih.gov/912345/',
      },
    ],
    category: 'immunosuppressant',
  },
  atorvastatin: {
    supplements: [
      'Red Yeast Rice',
      'Niacin',
      'Grapefruit',
      'Coenzyme Q10',
      'Berberine',
    ],
    medications: ['Simvastatin', 'Rosuvastatin'],
    severity: 'HIGH',
    mechanism: 'Increased risk of muscle toxicity and liver damage',
    evidence: 'Clinical studies show increased myopathy risk',
    management: 'Monitor liver enzymes and muscle symptoms',
    sources: [
      {
        id: 'pubmed_923456',
        type: 'CLINICAL_STUDY',
        url: 'https://pubmed.ncbi.nlm.nih.gov/923456/',
      },
    ],
    category: 'statin',
  },
  omeprazole: {
    supplements: [
      'Vitamin B12',
      'Magnesium',
      'Calcium',
      'Iron',
      "St. John's Wort",
    ],
    medications: ['Clopidogrel', 'Warfarin'],
    severity: 'MODERATE',
    mechanism: 'Reduced nutrient absorption and altered drug metabolism',
    evidence: 'Long-term studies show nutrient deficiencies',
    management: 'Monitor nutrient levels, consider supplementation',
    sources: [
      {
        id: 'pubmed_934567',
        type: 'CLINICAL_STUDY',
        url: 'https://pubmed.ncbi.nlm.nih.gov/934567/',
      },
    ],
    category: 'proton_pump_inhibitor',
  },
};

export interface SupplementInteraction {
  synergistic_supplements?: string[];
  conflicting_supplements?: string[];
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  mechanism: string;
  evidence: string;
  management: string;
  sources: { id: string; type: VerificationLevel; url: string }[];
  category: string;
}

export const SUPPLEMENT_INTERACTIONS: Record<string, SupplementInteraction> = {
  iron: {
    conflicting_supplements: [
      'Calcium',
      'Zinc',
      'Magnesium',
      'Green Tea',
      'Coffee',
    ],
    severity: 'MODERATE',
    mechanism: 'Competitive absorption leading to reduced bioavailability',
    evidence: 'Multiple absorption studies show significant interactions',
    management: 'Separate administration by 2+ hours',
    sources: [
      {
        id: 'pubmed_945678',
        type: 'CLINICAL_STUDY',
        url: 'https://pubmed.ncbi.nlm.nih.gov/945678/',
      },
    ],
    category: 'mineral',
  },
  calcium: {
    conflicting_supplements: [
      'Iron',
      'Zinc',
      'Magnesium',
      'Phosphorus',
      'Fiber',
    ],
    severity: 'MODERATE',
    mechanism: 'Competitive absorption and formation of insoluble complexes',
    evidence: 'Well-documented absorption interference',
    management: 'Take separately, limit single doses to 500mg',
    sources: [
      {
        id: 'pubmed_956789',
        type: 'CLINICAL_STUDY',
        url: 'https://pubmed.ncbi.nlm.nih.gov/956789/',
      },
    ],
    category: 'mineral',
  },
  zinc: {
    conflicting_supplements: ['Iron', 'Calcium', 'Copper', 'Fiber'],
    severity: 'MODERATE',
    mechanism: 'Competitive absorption at intestinal level',
    evidence: 'Clinical studies show reduced bioavailability',
    management: 'Take on empty stomach, separate from other minerals',
    sources: [
      {
        id: 'pubmed_967890',
        type: 'CLINICAL_STUDY',
        url: 'https://pubmed.ncbi.nlm.nih.gov/967890/',
      },
    ],
    category: 'mineral',
  },
  vitamin_d: {
    synergistic_supplements: ['Calcium', 'Magnesium', 'Vitamin K2'],
    conflicting_supplements: ['Thiazide Diuretics'],
    severity: 'LOW',
    mechanism: 'Enhanced calcium absorption and bone health',
    evidence: 'Multiple studies show synergistic effects',
    management: 'Take together for optimal bone health',
    sources: [
      {
        id: 'pubmed_978901',
        type: 'CLINICAL_STUDY',
        url: 'https://pubmed.ncbi.nlm.nih.gov/978901/',
      },
    ],
    category: 'vitamin',
  },
  magnesium: {
    conflicting_supplements: ['Calcium', 'Iron', 'Zinc', 'Fluoride'],
    severity: 'MODERATE',
    mechanism: 'Competitive absorption and chelation',
    evidence: 'Absorption studies show interference',
    management: 'Separate administration, take with food',
    sources: [
      {
        id: 'pubmed_989012',
        type: 'CLINICAL_STUDY',
        url: 'https://pubmed.ncbi.nlm.nih.gov/989012/',
      },
    ],
    category: 'mineral',
  },
};

export interface NutrientLimit {
  ul: number;
  unit: string;
  risk: string;
  populations_at_risk: string[];
  rdi?: number;
  evidenceLevel: keyof typeof EVIDENCE_LEVELS;
}

export const NUTRIENT_LIMITS: Record<string, NutrientLimit> = {
  vitamin_d: {
    rdi: 600,
    ul: 4000,
    unit: 'IU',
    risk: 'Hypercalcemia, kidney stones, heart arrhythmias',
    populations_at_risk: ['kidney disease', 'hypercalcemia', 'sarcoidosis'],
    evidenceLevel: 'A',
  },
  vitamin_a: {
    rdi: 900,
    ul: 10000,
    unit: 'IU',
    risk: 'Liver damage, birth defects (in pregnancy), bone loss',
    populations_at_risk: ['pregnancy', 'liver disease', 'smokers'],
    evidenceLevel: 'A',
  },
  iron: {
    rdi: 8,
    ul: 45,
    unit: 'mg',
    risk: 'GI distress, organ damage (liver, heart), oxidative stress',
    populations_at_risk: [
      'hemochromatosis',
      'liver disease',
      'men (unless deficient)',
    ],
    evidenceLevel: 'A',
  },
  zinc: {
    rdi: 11,
    ul: 40,
    unit: 'mg',
    risk: 'Copper deficiency, immune suppression, nausea, taste disturbances',
    populations_at_risk: ['long-term high dose users', "Wilson's disease"],
    evidenceLevel: 'A',
  },
  vitamin_e: {
    rdi: 15,
    ul: 1000,
    unit: 'mg',
    risk: 'Bleeding risk, hemorrhagic stroke (high doses)',
    populations_at_risk: [
      'blood thinners',
      'vitamin K deficiency',
      'history of stroke',
    ],
    evidenceLevel: 'A',
  },
  vitamin_b6: {
    rdi: 1.7,
    ul: 100,
    unit: 'mg',
    risk: 'Peripheral neuropathy (nerve damage, tingling, numbness)',
    populations_at_risk: ['kidney disease'],
    evidenceLevel: 'A',
  },
  magnesium: {
    rdi: 400,
    ul: 350,
    unit: 'mg',
    risk: 'Diarrhea, nausea, abdominal cramping (from supplements), hypotension (very high doses)',
    populations_at_risk: ['kidney disease', 'heart block'],
    evidenceLevel: 'A',
  },
  calcium: {
    rdi: 1000,
    ul: 2500,
    unit: 'mg',
    risk: 'Kidney stones, cardiovascular calcification, constipation',
    populations_at_risk: [
      'kidney disease',
      'hyperparathyroidism',
      'heart disease risk',
    ],
    evidenceLevel: 'A',
  },
  selenium: {
    rdi: 55,
    ul: 400,
    unit: 'mcg',
    risk: 'Hair loss, nail brittleness, neurological damage, fatigue (selenosis)',
    populations_at_risk: ['autoimmune thyroid disease (monitor)'],
    evidenceLevel: 'A',
  },
  folate: {
    rdi: 400,
    ul: 1000,
    unit: 'mcg',
    risk: 'May mask vitamin B12 deficiency symptoms, potential cognitive decline in elderly',
    populations_at_risk: ['undiagnosed B12 deficiency', 'elderly'],
    evidenceLevel: 'A',
  },
  iodine: {
    rdi: 150,
    ul: 1100,
    unit: 'mcg',
    risk: 'Thyroid dysfunction (hyper/hypothyroidism), thyroiditis, goiter',
    populations_at_risk: [
      'autoimmune thyroid disease',
      'pre-existing thyroid conditions',
    ],
    evidenceLevel: 'A',
  },
  copper: {
    rdi: 0.9,
    ul: 10,
    unit: 'mg',
    risk: 'Liver damage, neurological symptoms, gastrointestinal upset',
    populations_at_risk: ["Wilson's disease", 'liver disease'],
    evidenceLevel: 'A',
  },
  manganese: {
    rdi: 2.3,
    ul: 11,
    unit: 'mg',
    risk: "Neurological symptoms similar to Parkinson's disease",
    populations_at_risk: ['liver disease', 'iron deficiency'],
    evidenceLevel: 'B',
  },
  chromium: {
    rdi: 35,
    ul: 200,
    unit: 'mcg',
    risk: 'Liver and kidney damage (rare)',
    populations_at_risk: ['kidney disease', 'liver disease'],
    evidenceLevel: 'B',
  },
  niacin: {
    rdi: 16,
    ul: 35,
    unit: 'mg',
    risk: 'Flushing, liver toxicity, glucose intolerance',
    populations_at_risk: ['liver disease', 'diabetes', 'gout'],
    evidenceLevel: 'A',
  },
  vitamin_c: {
    rdi: 90,
    ul: 2000,
    unit: 'mg',
    risk: 'Digestive upset, kidney stones (rare)',
    populations_at_risk: ['kidney stones history', 'kidney disease'],
    evidenceLevel: 'A',
  },
  phosphorus: {
    rdi: 700,
    ul: 4000,
    unit: 'mg',
    risk: 'Kidney damage, bone problems, cardiovascular calcification',
    populations_at_risk: ['kidney disease', 'hyperparathyroidism'],
    evidenceLevel: 'A',
  },
  molybdenum: {
    rdi: 45,
    ul: 2000,
    unit: 'mcg',
    risk: 'Copper deficiency, joint pain',
    populations_at_risk: ['copper deficiency'],
    evidenceLevel: 'B',
  },
  boron: {
    rdi: 1,
    ul: 20,
    unit: 'mg',
    risk: 'Nausea, vomiting, diarrhea, skin rash',
    populations_at_risk: ['kidney disease'],
    evidenceLevel: 'B',
  },
};

export const EVIDENCE_LEVELS = {
  A: {
    label: 'Multiple RCTs',
    color: COLORS.success,
    description:
      'Supported by multiple high-quality randomized controlled trials (RCTs)',
    weight: 1.0,
    sources: ['PubMed', 'Cochrane'],
  },
  B: {
    label: 'Limited RCTs',
    color: COLORS.secondary,
    description:
      'Supported by limited randomized controlled trials or strong meta-analyses of observational studies',
    weight: 0.8,
    sources: ['PubMed', 'Cochrane'],
  },
  C: {
    label: 'Observational',
    color: COLORS.warning,
    description:
      'Supported by consistent observational studies, cohort studies, or case-control studies',
    weight: 0.6,
    sources: ['PubMed'],
  },
  D: {
    label: 'Expert Opinion',
    color: COLORS.info,
    description:
      'Based on expert consensus, mechanistic rationale, or animal/in vitro studies',
    weight: 0.4,
    sources: ['Textbooks', 'Guidelines'],
  },
  E: {
    label: 'Anecdotal',
    color: COLORS.gray500,
    description:
      'Based on personal reports or traditional use without scientific validation',
    weight: 0.2,
    sources: ['Community Reports'],
  },
};

export interface GamificationAchievement {
  id: string;
  name: string;
  description: string;
  points: number;
  icon: string;
  category: string;
  prerequisites?: string[];
}

export const GAMIFICATION = {
  POINTS: {
    DAILY_SCAN: 10,
    FIRST_SCAN: 50,
    STREAK_BONUS: 5,
    INTERACTION_FOUND: 20,
    SAFE_PRODUCT: 15,
    NEW_PRODUCT_SUBMITTED: 25,
    DATA_SUBMISSION: 50,
    DATA_VERIFICATION: 25,
    HELPFUL_RATING: 10,
    REFERRAL_SUCCESS: 100,
    SHARE_STACK: 20,
    AI_CONSULTATION: 5,
    AI_ANSWER_HELPFUL: 10,
    AI_ADVICE_SHARED: 20,
    COMPLETE_PROFILE: 100,
    FIRST_STACK_CREATED: 50,
    STACK_OPTIMIZED: 75,
    LEVEL_UP: 50,
    STACK_ADD: 10,
    STACK_REMOVE: 5,
    STACK_UPDATE: 5,
  },
  STREAK_BONUS_MULTIPLIER: {
    7: 1.5, // 7-day streak: 1.5x bonus
    30: 2, // 30-day streak: 2x bonus
    100: 3, // 100-day streak: 3x bonus
  },
  LEVELS: {
    BEGINNER: {
      min: 0,
      max: 100,
      title: 'Health Novice',
      perks: [
        'Basic scanning',
        'Limited stack size (5 items)',
        'Essential health tips',
      ],
    },
    EXPLORER: {
      min: 101,
      max: 500,
      title: 'Supplement Explorer',
      perks: [
        'Increased stack size (10 items)',
        'Basic AI chat access',
        'Unlock daily health challenges',
      ],
    },
    ANALYST: {
      min: 501,
      max: 1000,
      title: 'Stack Analyst',
      perks: [
        'Expanded stack size (15 items)',
        'Advanced AI features (e.g., personalized insights)',
        'Access to community forums',
      ],
    },
    EXPERT: {
      min: 1001,
      max: 5000,
      title: 'Health Expert',
      perks: [
        'Unlimited stack size',
        'Priority AI responses',
        'Early access to new features',
      ],
    },
    MASTER: {
      min: 5001,
      max: 10000,
      title: 'Pharma Master',
      perks: [
        'Special recognition badge',
        'Ability to contribute to product database',
        'Exclusive webinars',
      ],
    },
    GURU: {
      min: 10001,
      max: Infinity,
      title: 'Wellness Guru',
      perks: [
        'Top tier recognition',
        'Direct line to expert support',
        'Participate in content creation',
      ],
    },
  },
  ACHIEVEMENTS: {
    FIRST_STEPS: {
      id: 'first_steps',
      name: 'First Steps',
      description: 'Complete your first product scan',
      points: 50,
      icon: '🎯',
      category: 'scanning',
    },
    SAFETY_FIRST: {
      id: 'safety_first',
      name: 'Safety First',
      description: 'Identify your first interaction warning',
      points: 100,
      icon: '🛡️',
      category: 'safety',
      prerequisites: ['first_steps'],
    },
    STACK_BUILDER: {
      id: 'stack_builder',
      name: 'Stack Builder',
      description: 'Add 5 items to your stack',
      points: 75,
      icon: '📚',
      category: 'stack_management',
      prerequisites: ['first_steps'],
    },
    KNOWLEDGE_SEEKER: {
      id: 'knowledge_seeker',
      name: 'Knowledge Seeker',
      description: 'Have 10 AI consultations',
      points: 100,
      icon: '🧠',
      category: 'ai_engagement',
    },
    CONTRIBUTOR: {
      id: 'contributor',
      name: 'Community Contributor',
      description: 'Submit your first product for database expansion',
      points: 150,
      icon: '🤝',
      category: 'contribution',
    },
    STREAK_MASTER: {
      id: 'streak_master',
      name: 'Streak Master',
      description: 'Maintain a 7-day daily scanning streak',
      points: 200,
      icon: '🔥',
      category: 'streak',
      prerequisites: ['first_steps'],
    },
    OPTIMIZER: {
      id: 'optimizer',
      name: 'Stack Optimizer',
      description: 'Optimize your stack to reduce potential interactions',
      points: 120,
      icon: '✨',
      category: 'stack_management',
      prerequisites: ['stack_builder'],
    },
    SHARER: {
      id: 'sharer',
      name: 'Knowledge Sharer',
      description: 'Share AI advice or your stack with others (3 times)',
      points: 80,
      icon: '🗣️',
      category: 'social',
    },
  },
};

export type ProductCategory = keyof typeof PRODUCT_CATEGORIES;

export const PRODUCT_CATEGORIES = {
  vitamin: { label: 'Vitamins', icon: '💊', color: COLORS.primary },
  mineral: { label: 'Minerals', icon: '⚗️', color: COLORS.secondary },
  herbal: { label: 'Herbals', icon: '🌿', color: COLORS.success },
  probiotic: { label: 'Probiotics', icon: '🦠', color: COLORS.info },
  omega3: { label: 'Omega-3s', icon: '🐟', color: COLORS.accent },
  protein: { label: 'Protein', icon: '💪', color: COLORS.warning },
  specialty: { label: 'Specialty', icon: '✨', color: COLORS.primaryLight },
  multivitamin: {
    label: 'Multivitamins',
    icon: '🌈',
    color: COLORS.secondaryDark,
  },
  amino_acid: { label: 'Amino Acids', icon: '🧬', color: COLORS.gray600 },
  enzyme: { label: 'Enzymes', icon: '🧪', color: COLORS.error },
};

export const QUALITY_INDICATORS = {
  THIRD_PARTY_TESTED: {
    label: 'Third-Party Tested',
    points: 15,
    icon: '✓',
    description:
      'Independently verified for purity and potency by external labs.',
  },
  GMP_CERTIFIED: {
    label: 'GMP Certified',
    points: 10,
    icon: '🏭',
    description:
      'Manufactured in a facility adhering to Good Manufacturing Practices (GMP).',
  },
  ORGANIC: {
    label: 'Organic',
    points: 8,
    icon: '🌱',
    description:
      'Certified USDA Organic, ensuring no synthetic pesticides or fertilizers.',
  },
  NON_GMO: {
    label: 'Non-GMO',
    points: 5,
    icon: '🚫',
    description:
      'Verified by the Non-GMO Project, free from genetically modified organisms.',
  },
  VEGAN: {
    label: 'Vegan',
    points: 3,
    icon: '🌿',
    description: 'Free from all animal-derived ingredients.',
  },
  GLUTEN_FREE: {
    label: 'Gluten-Free',
    points: 3,
    icon: '🌾',
    description:
      'Certified gluten-free for individuals with sensitivities or celiac disease.',
  },
  SOY_FREE: {
    label: 'Soy-Free',
    points: 3,
    icon: '🚫',
    description:
      'Free from soy, suitable for those with soy allergies or preferences.',
  },
};

export const ANIMATIONS = {
  DURATION: {
    fast: 200,
    normal: 300,
    slow: 500,
    verySlow: 800,
  },
  EASING: {
    easeIn: [0.4, 0, 1, 1],
    easeOut: [0, 0, 0.2, 1],
    easeInOut: [0.4, 0, 0.2, 1],
    spring: [0.175, 0.885, 0.32, 1.275],
    bounce: [0.34, 1.56, 0.64, 1],
  },
};

export const APP_CONFIG = {
  MAX_STACK_ITEMS_FREE: 10,
  MAX_STACK_ITEMS_PRO: 999,
  MAX_RECENT_SCANS: 20,
  CACHE_DURATION_HOURS: 24,
  CHAT_CACHE_DURATION_HOURS: 2,
  AI_RESPONSE_MAX_LENGTH: 500,
  SCAN_COOLDOWN_MS: 1000,
  API_TIMEOUT_MS: 30000,
  MIN_PASSWORD_LENGTH: 8,
  DEBOUNCE_TIME_MS: 300,
  ANONYMOUS_USER_PREFIX: 'anon_',
  HIPAA_LOCAL_ONLY: true,
  TIER_THRESHOLDS: {
    RULE_BASED_MAX_AGE_HOURS: 168,
    CACHE_MAX_AGE_HOURS: 24,
    API_FALLBACK_TIMEOUT_MS: 5000,
  },
  ACHIEVEMENT_THRESHOLDS: {
    FIRST_10_SCANS: 10,
    SCAN_MASTER: 100,
    SAFETY_GUARDIAN: 10,
    LEVEL_5: 5,
    LEVEL_10: 10,
    WEEK_WARRIOR: 7,
    MONTHLY_CHAMPION: 30,
    CENTURY_LEGEND: 100,
    STACK_BUILDER: 5,
  },
};

export const ERROR_MESSAGES = {
  NETWORK_ERROR:
    'Network connection issue. Please check your internet and try again.',
  PRODUCT_NOT_FOUND:
    'Product not found. Try scanning again or enter details manually.',
  AI_UNAVAILABLE:
    'AI service is currently unavailable. Operating in rule-based or limited mode.',
  SCAN_ERROR:
    'Unable to process barcode. Please ensure good lighting and try again, or enter manually.',
  AUTH_ERROR:
    'Authentication failed. Please check your credentials and try again.',
  STACK_FULL:
    'Your stack has reached its limit. Upgrade to unlock unlimited items!',
  INVALID_INPUT: 'Please ensure all required fields are filled correctly.',
  PASSWORD_MISMATCH: 'Passwords do not match. Please re-enter them.',
  PASSWORD_TOO_SHORT: `Password must be at least ${APP_CONFIG.MIN_PASSWORD_LENGTH} characters long.`,
  GENERIC_ERROR: 'An unexpected error occurred. Please try again later.',
};

export const NOTIFICATION_TYPES = {
  DAILY_REMINDER: {
    id: 'daily_reminder',
    title: 'Daily Supplement Reminder',
    body: 'Time to log your supplements!',
    category: 'reminders',
  },
  INTERACTION_ALERT: {
    id: 'interaction_alert',
    title: 'Interaction Alert!',
    body: 'Potential interaction found in your stack.',
    category: 'safety',
  },
  NEW_FEATURE: {
    id: 'new_feature',
    title: 'New Feature Available!',
    body: 'Check out our latest update.',
    category: 'updates',
  },
  LEVEL_UP: {
    id: 'level_up',
    title: 'Level Up! 🎉',
    body: "You've reached a new gamification level!",
    category: 'gamification',
  },
};

export { STORAGE_KEYS } from './storage';

export type VerificationLevel =
  | 'FDA_VERIFIED'
  | 'NIH_VALIDATED'
  | 'CLINICAL_STUDY'
  | 'RULE_BASED'
  | 'AI_ANALYSIS';
export type EvidenceLevel = keyof typeof EVIDENCE_LEVELS;
export type GamificationPoint = keyof typeof GAMIFICATION.POINTS;
export type GamificationLevel = keyof typeof GAMIFICATION.LEVELS;
export type GamificationAchievementId = keyof typeof GAMIFICATION.ACHIEVEMENTS;
