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

  // Borders
  border: '#E5E7EB',

  // Text
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',

  // Interactive states
  hover: 'rgba(37, 99, 235, 0.1)',
  pressed: 'rgba(37, 99, 235, 0.2)',
  disabled: '#E5E7EB', // A neutral disabled state

  // Shadows (using direct color values for consistency)
  shadowLight: 'rgba(0, 0, 0, 0.05)',
  shadowMedium: 'rgba(0, 0, 0, 0.1)',
  shadowDark: 'rgba(0, 0, 0, 0.2)',
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
};

export const SHADOWS = {
  sm: {
    shadowColor: COLORS.shadowMedium, // Use defined color constant
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, // Adjusted for consistency with COLORS.shadowMedium
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: COLORS.shadowMedium,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, // Slightly more opaque than sm
    shadowRadius: 3,
    elevation: 4,
  },
  lg: {
    shadowColor: COLORS.shadowDark, // Use darker shadow for larger shadows
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, // Adjusted for consistency with COLORS.shadowDark
    shadowRadius: 5,
    elevation: 8,
  },
};

export const API_ENDPOINTS = {
  // HuggingFace endpoints
  HUGGINGFACE: 'https://api-inference.huggingface.co/models',
  HUGGINGFACE_MODELS: 'https://api-inference.huggingface.co/models', // Explicit for clarity

  // OpenFoodFacts API
  OPENFOODFACTS: 'https://world.openfoodfacts.org',

  // Groq API for fast LLM inference
  GROQ: 'https://api.groq.com/openai/v1',
};

export const AI_MODELS = {
  HUGGINGFACE: {
    // --- Models typically available on Hugging Face FREE Inference API ---
    // Use for specific tasks like classification or small text generation as fallbacks.

    // Classification models (Confirmed WORKING on free tier)
    CLASSIFICATION: 'facebook/bart-large-mnli', // Verified working
    CLASSIFICATION_ALT: 'typeform/distilbert-base-uncased-mnli', // Verified working

    // Embeddings model (Confirmed WORKING with correct payload)
    EMBEDDINGS: 'sentence-transformers/all-MiniLM-L6-v2',

    // Text generation models (NOT reliably working on free tier - for reference only)
    // These models frequently return 404 Not Found or 503 Service Unavailable errors on the free tier.
    // They are listed here for completeness but should NOT be relied upon for primary text generation.
    TEXT_GENERATION: 'distilgpt2',
    TEXT_GENERATION_ALT: 'gpt2',
    TEXT_GENERATION_SMALL: 'google/flan-t5-small',
    FALLBACK_TEXT: 'EleutherAI/gpt-neo-125M', // Ensure uppercase 'M' for consistency
  },
  GROQ: {
    // --- Groq models (verified WORKING with proper API key) ---
    // These are the PRIMARY models for chat and text generation in the app.
    FAST: 'llama3-8b-8192', // Confirmed working (e.g., $0.06/1M tokens)
    FAST_ALT: 'llama-3.1-8b-instant', // Alternative 8B model (check Groq docs for latest)
    BALANCED: 'llama3-70b-8192', // Confirmed working (e.g., $0.59/1M tokens)
    // Note: mixtral-8x7b-32768 is decommissioned by Groq, so it's removed.
    // Always check console.groq.com/docs/models for the most up-to-date list and pricing.
  },
};

export const CRITICAL_INTERACTIONS = {
  // Blood Thinners
  warfarin: {
    supplements: [
      'vitamin_k',
      'ginkgo',
      'garlic',
      'fish_oil',
      'vitamin_e',
      'ginger',
      'turmeric',
      'cranberry',
      'coenzyme_q10',
      'green_tea',
      'dong_quai',
      'feverfew',
      'willow_bark',
    ],
    medications: ['aspirin', 'ibuprofen', 'naproxen', 'clopidogrel'],
    severity: 'CRITICAL',
    mechanism: 'Altered blood clotting - increases bleeding risk significantly',
    evidence:
      'Multiple high-quality clinical studies show significant INR changes and adverse events',
    management:
      'INR should be monitored closely, inform doctor about all supplements, dose adjustments may be needed',
  },

  // Diabetes Medications
  metformin: {
    supplements: [
      'chromium',
      'alpha_lipoic_acid',
      'bitter_melon',
      'cinnamon',
      'gymnema',
      'fenugreek',
      'berberine',
      'vitamin_b12',
    ],
    medications: ['insulin', 'glyburide', 'glipizide'],
    severity: 'HIGH',
    mechanism: 'Enhanced glucose lowering effects, risk of hypoglycemia',
    evidence: 'Clinical studies show additive glucose-lowering effects',
    management: 'Monitor blood glucose closely, may need medication adjustment',
  },

  insulin: {
    supplements: [
      'chromium',
      'alpha_lipoic_acid',
      'bitter_melon',
      'cinnamon',
      'gymnema',
      'fenugreek',
      'berberine',
      'vanadium',
    ],
    medications: ['metformin', 'sulfonylureas'],
    severity: 'CRITICAL',
    mechanism:
      'Severe hypoglycemia risk from additive glucose-lowering effects',
    evidence: 'Multiple case reports of severe hypoglycemic episodes',
    management:
      'Frequent glucose monitoring required, immediate medical attention for symptoms',
  },

  // Blood Pressure Medications
  lisinopril: {
    supplements: [
      'potassium',
      'hawthorn',
      'garlic',
      'coenzyme_q10',
      'magnesium',
      'arginine',
      'hibiscus',
    ],
    medications: ['amlodipine', 'hydrochlorothiazide', 'losartan'],
    severity: 'HIGH',
    mechanism: 'Additive blood pressure lowering, risk of hypotension',
    evidence: 'Clinical studies show enhanced hypotensive effects',
    management: 'Monitor blood pressure regularly, adjust doses as needed',
  },

  amlodipine: {
    supplements: [
      'hawthorn',
      'garlic',
      'coenzyme_q10',
      'magnesium',
      'potassium',
      'grapefruit',
    ],
    medications: ['lisinopril', 'metoprolol', 'hydrochlorothiazide'],
    severity: 'HIGH',
    mechanism:
      'Enhanced hypotensive effects, potential for dangerous blood pressure drops',
    evidence: 'Multiple clinical trials demonstrate additive effects',
    management: 'Regular blood pressure monitoring, gradual dose adjustments',
  },

  // Antidepressants
  sertraline: {
    supplements: [
      'st_johns_wort',
      'sam_e',
      '5_htp',
      'tryptophan',
      'ginkgo',
      'kava',
      'valerian',
    ],
    medications: ['fluoxetine', 'paroxetine', 'tramadol', 'triptans'],
    severity: 'CRITICAL',
    mechanism: 'Serotonin syndrome risk from excessive serotonin activity',
    evidence: 'FDA warnings and multiple case reports of serotonin syndrome',
    management:
      'Avoid combination, seek immediate medical attention for symptoms',
  },

  fluoxetine: {
    supplements: [
      'st_johns_wort',
      'sam_e',
      '5_htp',
      'tryptophan',
      'ginkgo',
      'kava',
    ],
    medications: ['sertraline', 'tramadol', 'triptans'],
    severity: 'CRITICAL',
    mechanism: 'Serotonin syndrome and increased bleeding risk',
    evidence: 'Multiple clinical studies and FDA safety communications',
    management: 'Contraindicated combinations, close monitoring required',
  },

  // Thyroid Medications
  levothyroxine: {
    supplements: [
      'calcium',
      'iron',
      'magnesium',
      'fiber',
      'soy',
      'biotin',
      'kelp',
      'iodine',
    ],
    medications: ['calcium_carbonate', 'omeprazole', 'sucralfate'],
    severity: 'HIGH',
    mechanism: 'Reduced absorption leading to hypothyroidism',
    evidence: 'Well-documented absorption interactions in clinical studies',
    management: 'Separate administration by 4+ hours, monitor TSH levels',
  },

  // Seizure Medications
  phenytoin: {
    supplements: [
      'folic_acid',
      'vitamin_d',
      'calcium',
      'biotin',
      'ginkgo',
      'evening_primrose',
    ],
    medications: ['carbamazepine', 'valproic_acid'],
    severity: 'HIGH',
    mechanism: 'Altered drug metabolism and seizure threshold changes',
    evidence: 'Clinical studies show reduced anticonvulsant effectiveness',
    management: 'Monitor drug levels and seizure control closely',
  },

  // Immunosuppressants
  cyclosporine: {
    supplements: [
      'st_johns_wort',
      'echinacea',
      'grapefruit',
      'red_yeast_rice',
      'berberine',
    ],
    medications: ['tacrolimus', 'sirolimus'],
    severity: 'CRITICAL',
    mechanism: 'Altered drug metabolism leading to rejection risk',
    evidence: 'Multiple case reports of organ rejection',
    management: 'Avoid herbal supplements, monitor drug levels frequently',
  },

  // Statins
  atorvastatin: {
    supplements: [
      'red_yeast_rice',
      'niacin',
      'grapefruit',
      'coenzyme_q10',
      'berberine',
    ],
    medications: ['simvastatin', 'rosuvastatin'],
    severity: 'HIGH',
    mechanism: 'Increased risk of muscle toxicity and liver damage',
    evidence: 'Clinical studies show increased myopathy risk',
    management: 'Monitor liver enzymes and muscle symptoms',
  },

  // Proton Pump Inhibitors
  omeprazole: {
    supplements: [
      'vitamin_b12',
      'magnesium',
      'calcium',
      'iron',
      'st_johns_wort',
    ],
    medications: ['clopidogrel', 'warfarin'],
    severity: 'MODERATE',
    mechanism: 'Reduced nutrient absorption and altered drug metabolism',
    evidence: 'Long-term studies show nutrient deficiencies',
    management: 'Monitor nutrient levels, consider supplementation',
  },
};

// Supplement-Supplement Interactions
export const SUPPLEMENT_INTERACTIONS = {
  iron: {
    conflicting_supplements: [
      'calcium',
      'zinc',
      'magnesium',
      'green_tea',
      'coffee',
    ],
    severity: 'MODERATE',
    mechanism: 'Competitive absorption leading to reduced bioavailability',
    evidence: 'Multiple absorption studies show significant interactions',
    management: 'Separate administration by 2+ hours',
  },

  calcium: {
    conflicting_supplements: [
      'iron',
      'zinc',
      'magnesium',
      'phosphorus',
      'fiber',
    ],
    severity: 'MODERATE',
    mechanism: 'Competitive absorption and formation of insoluble complexes',
    evidence: 'Well-documented absorption interference',
    management: 'Take separately, limit single doses to 500mg',
  },

  zinc: {
    conflicting_supplements: ['iron', 'calcium', 'copper', 'fiber'],
    severity: 'MODERATE',
    mechanism: 'Competitive absorption at intestinal level',
    evidence: 'Clinical studies show reduced bioavailability',
    management: 'Take on empty stomach, separate from other minerals',
  },

  vitamin_d: {
    synergistic_supplements: ['calcium', 'magnesium', 'vitamin_k2'],
    conflicting_supplements: ['thiazide_diuretics'],
    severity: 'LOW',
    mechanism: 'Enhanced calcium absorption and bone health',
    evidence: 'Multiple studies show synergistic effects',
    management: 'Take together for optimal bone health',
  },

  magnesium: {
    conflicting_supplements: ['calcium', 'iron', 'zinc', 'fluoride'],
    severity: 'MODERATE',
    mechanism: 'Competitive absorption and chelation',
    evidence: 'Absorption studies show interference',
    management: 'Separate administration, take with food',
  },
};

export const NUTRIENT_LIMITS = {
  vitamin_d: {
    ul: 4000,
    unit: 'IU',
    risk: 'Hypercalcemia, kidney stones, heart arrhythmias',
    populations_at_risk: ['kidney disease', 'hypercalcemia', 'sarcoidosis'],
  },
  vitamin_a: {
    ul: 10000,
    unit: 'IU',
    risk: 'Liver damage, birth defects (in pregnancy), bone loss',
    populations_at_risk: ['pregnancy', 'liver disease', 'smokers'],
  },
  iron: {
    ul: 45,
    unit: 'mg',
    risk: 'GI distress, organ damage (liver, heart), oxidative stress',
    populations_at_risk: [
      'hemochromatosis',
      'liver disease',
      'men (unless deficient)',
    ],
  },
  zinc: {
    ul: 40,
    unit: 'mg',
    risk: 'Copper deficiency, immune suppression, nausea, taste disturbances',
    populations_at_risk: ['long-term high dose users', "Wilson's disease"],
  },
  vitamin_e: {
    ul: 1000,
    unit: 'mg',
    risk: 'Bleeding risk, hemorrhagic stroke (high doses)',
    populations_at_risk: [
      'blood thinners',
      'vitamin K deficiency',
      'history of stroke',
    ],
  },
  vitamin_b6: {
    ul: 100,
    unit: 'mg',
    risk: 'Peripheral neuropathy (nerve damage, tingling, numbness)',
    populations_at_risk: ['kidney disease'],
  },
  magnesium: {
    ul: 350,
    unit: 'mg', // Applies to supplemental magnesium only
    risk: 'Diarrhea, nausea, abdominal cramping (from supplements), hypotension (very high doses)',
    populations_at_risk: ['kidney disease', 'heart block'],
  },
  calcium: {
    ul: 2500,
    unit: 'mg',
    risk: 'Kidney stones, cardiovascular calcification, constipation',
    populations_at_risk: [
      'kidney disease',
      'hyperparathyroidism',
      'heart disease risk',
    ],
  },
  selenium: {
    ul: 400,
    unit: 'mcg',
    risk: 'Hair loss, nail brittleness, neurological damage, fatigue (selenosis)',
    populations_at_risk: ['autoimmune thyroid disease (monitor)'],
  },
  folate: {
    // Folic Acid (synthetic) is typically what has UL concerns
    ul: 1000, // For synthetic Folic Acid from supplements
    unit: 'mcg',
    risk: 'May mask vitamin B12 deficiency symptoms, potential cognitive decline in elderly',
    populations_at_risk: ['undiagnosed B12 deficiency', 'elderly'],
  },
  iodine: {
    ul: 1100,
    unit: 'mcg',
    risk: 'Thyroid dysfunction (hyper/hypothyroidism), thyroiditis, goiter',
    populations_at_risk: [
      'autoimmune thyroid disease',
      'pre-existing thyroid conditions',
    ],
  },
  copper: {
    ul: 10,
    unit: 'mg',
    risk: 'Liver damage, neurological symptoms, gastrointestinal upset',
    populations_at_risk: ["Wilson's disease", 'liver disease'],
  },
  manganese: {
    ul: 11,
    unit: 'mg',
    risk: "Neurological symptoms similar to Parkinson's disease",
    populations_at_risk: ['liver disease', 'iron deficiency'],
  },
  chromium: {
    ul: 200,
    unit: 'mcg',
    risk: 'Liver and kidney damage (rare)',
    populations_at_risk: ['kidney disease', 'liver disease'],
  },
  niacin: {
    ul: 35,
    unit: 'mg',
    risk: 'Flushing, liver toxicity, glucose intolerance',
    populations_at_risk: ['liver disease', 'diabetes', 'gout'],
  },
  vitamin_c: {
    ul: 2000,
    unit: 'mg',
    risk: 'Digestive upset, kidney stones (rare)',
    populations_at_risk: ['kidney stones history', 'kidney disease'],
  },
  phosphorus: {
    ul: 4000,
    unit: 'mg',
    risk: 'Kidney damage, bone problems, cardiovascular calcification',
    populations_at_risk: ['kidney disease', 'hyperparathyroidism'],
  },
  molybdenum: {
    ul: 2000,
    unit: 'mcg',
    risk: 'Copper deficiency, joint pain',
    populations_at_risk: ['copper deficiency'],
  },
  boron: {
    ul: 20,
    unit: 'mg',
    risk: 'Nausea, vomiting, diarrhea, skin rash',
    populations_at_risk: ['kidney disease'],
  },
};

export const EVIDENCE_LEVELS = {
  A: {
    label: 'Multiple RCTs',
    color: COLORS.success,
    description:
      'Supported by multiple high-quality randomized controlled trials (RCTs)',
    weight: 1.0,
  },
  B: {
    label: 'Limited RCTs',
    color: COLORS.secondary,
    description:
      'Supported by limited randomized controlled trials or strong meta-analyses of observational studies',
    weight: 0.8,
  },
  C: {
    label: 'Observational',
    color: COLORS.warning,
    description:
      'Supported by consistent observational studies, cohort studies, or case-control studies',
    weight: 0.6,
  },
  D: {
    label: 'Expert Opinion',
    color: COLORS.info,
    description:
      'Based on expert consensus, mechanistic rationale, or animal/in vitro studies',
    weight: 0.4,
  },
  E: {
    label: 'Anecdotal',
    color: COLORS.gray500,
    description:
      'Based on personal reports or traditional use without scientific validation',
    weight: 0.2,
  },
};

export const GAMIFICATION = {
  POINTS: {
    // Basic actions
    DAILY_SCAN: 10,
    FIRST_SCAN: 50,
    STREAK_BONUS: 5, // Per day, on top of DAILY_SCAN

    // Discovery points
    INTERACTION_FOUND: 20, // Points for discovering a potential interaction
    SAFE_PRODUCT: 15, // Points for scanning a highly-rated product
    NEW_PRODUCT_SUBMITTED: 25, // Renamed from NEW_PRODUCT to clarify it's user submission

    // Contribution points
    DATA_SUBMISSION: 50, // Renamed from SUBMISSION to clarify its purpose
    DATA_VERIFICATION: 25, // Renamed from VERIFICATION
    HELPFUL_RATING: 10, // User receives points if their content/advice is rated helpful

    // Social points
    REFERRAL_SUCCESS: 100, // Renamed from REFERRAL
    SHARE_STACK: 20, // Points for sharing their supplement stack

    // AI engagement
    AI_CONSULTATION: 5, // For starting a new AI chat session
    AI_ANSWER_HELPFUL: 10, // User marks AI answer as helpful
    AI_ADVICE_SHARED: 20, // User shares AI advice externally

    // Milestones
    COMPLETE_PROFILE: 100, // User completes their health profile
    FIRST_STACK_CREATED: 50, // User adds their first item to stack
    STACK_OPTIMIZED: 75, // User reduces interactions or improves quality of stack
    LEVEL_UP: 50, // Bonus points for achieving a new level
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
    },
    SAFETY_FIRST: {
      id: 'safety_first',
      name: 'Safety First',
      description: 'Identify your first interaction warning',
      points: 100,
      icon: '🛡️',
    },
    STACK_BUILDER: {
      id: 'stack_builder',
      name: 'Stack Builder',
      description: 'Add 5 items to your stack',
      points: 75,
      icon: '📚',
    },
    KNOWLEDGE_SEEKER: {
      id: 'knowledge_seeker',
      name: 'Knowledge Seeker',
      description: 'Have 10 AI consultations',
      points: 100,
      icon: '🧠',
    },
    CONTRIBUTOR: {
      id: 'contributor',
      name: 'Community Contributor', // More descriptive
      description: 'Submit your first product for database expansion',
      points: 150,
      icon: '🤝',
    },
    STREAK_MASTER: {
      id: 'streak_master',
      name: 'Streak Master',
      description: 'Maintain a 7-day daily scanning streak',
      points: 200,
      icon: '🔥',
    },
    OPTIMIZER: {
      // New achievement
      id: 'optimizer',
      name: 'Stack Optimizer',
      description: 'Optimize your stack to reduce potential interactions',
      points: 120,
      icon: '✨',
    },
    SHARER: {
      // New achievement
      id: 'sharer',
      name: 'Knowledge Sharer',
      description: 'Share AI advice or your stack with others (3 times)',
      points: 80,
      icon: '🗣️',
    },
  },
};

export const PRODUCT_CATEGORIES = {
  vitamin: { label: 'Vitamins', icon: '💊', color: COLORS.primary },
  mineral: { label: 'Minerals', icon: '⚗️', color: COLORS.secondary },
  herbal: { label: 'Herbals', icon: '🌿', color: COLORS.success },
  probiotic: { label: 'Probiotics', icon: '🦠', color: COLORS.info },
  omega3: { label: 'Omega-3s', icon: '🐟', color: COLORS.accent },
  protein: { label: 'Protein', icon: '💪', color: COLORS.warning },
  specialty: { label: 'Specialty', icon: '✨', color: COLORS.primaryLight }, // Changed color to primaryLight for variety
  multivitamin: {
    label: 'Multivitamins',
    icon: '🌈',
    color: COLORS.secondaryDark,
  }, // Changed color for variety
  amino_acid: { label: 'Amino Acids', icon: '🧬', color: COLORS.gray600 }, // New category
  enzyme: { label: 'Enzymes', icon: '🧪', color: COLORS.error }, // New category
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
    // New indicator
    label: 'Gluten-Free',
    points: 3,
    icon: '🌾',
    description:
      'Certified gluten-free for individuals with sensitivities or celiac disease.',
  },
  SOY_FREE: {
    // New indicator
    label: 'Soy-Free',
    points: 3,
    icon: '🚫',
    description:
      'Free from soy, suitable for those with soy allergies or preferences.',
  },
};

// Animation constants
export const ANIMATIONS = {
  DURATION: {
    fast: 200,
    normal: 300,
    slow: 500,
    verySlow: 800, // Added
  },
  EASING: {
    easeIn: [0.4, 0, 1, 1],
    easeOut: [0, 0, 0.2, 1],
    easeInOut: [0.4, 0, 0.2, 1],
    spring: [0.175, 0.885, 0.32, 1.275], // Standard spring easing
    bounce: [0.34, 1.56, 0.64, 1], // Added for a bouncier feel
  },
};

// Re-export storage keys from storage.ts
export { STORAGE_KEYS } from './storage';

// App Configuration
export const APP_CONFIG = {
  MAX_STACK_ITEMS_FREE: 10,
  MAX_STACK_ITEMS_PRO: 999, // Effectively unlimited
  MAX_RECENT_SCANS: 20,
  CACHE_DURATION_HOURS: 24, // General cache duration for non-chat API calls
  CHAT_CACHE_DURATION_HOURS: 2, // Shorter cache duration for chat responses
  AI_RESPONSE_MAX_LENGTH: 500, // Increased max length for richer responses
  SCAN_COOLDOWN_MS: 1000, // Prevents rapid repeated scans
  API_TIMEOUT_MS: 30000, // General API request timeout
  MIN_PASSWORD_LENGTH: 8, // Enforce a stronger minimum password length
  DEBOUNCE_TIME_MS: 300, // General debounce time for inputs/searches
  ANONYMOUS_USER_PREFIX: 'anon_', // Consistent prefix for anonymous user IDs
};

// Error Messages (Completed and enhanced)
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
    'Your stack has reached its limit. Upgrade to unlock unlimited items!', // Completed
  INVALID_INPUT: 'Please ensure all required fields are filled correctly.',
  PASSWORD_MISMATCH: 'Passwords do not match. Please re-enter them.',
  PASSWORD_TOO_SHORT: `Password must be at least ${APP_CONFIG.MIN_PASSWORD_LENGTH} characters long.`,
  GENERIC_ERROR: 'An unexpected error occurred. Please try again later.',
};

// Notification Types
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
