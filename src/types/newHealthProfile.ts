// src/types/newHealthProfile.ts
// Clean, simplified health profile types for the new 2-step system

export interface Demographics {
  ageRange: string;
  biologicalSex: string;
  displayName?: string;
}

export interface HealthGoal {
  id: string;
  name: string;
  category: string;
}

export interface HealthCondition {
  id: string;
  name: string;
  category: string;
}

export interface Allergy {
  id: string;
  name: string;
  type: string;
}

export interface PrivacyConsent {
  dataStorage: boolean;
  aiAnalysis: boolean;
  anonymousAnalytics: boolean;
  consentTimestamp: string;
}

export interface NewHealthProfile {
  id: string;
  userId: string;
  
  // Step 1: Privacy & Consent
  privacy: PrivacyConsent;
  
  // Step 2: Combined Health Information
  demographics: Demographics;
  healthGoals: HealthGoal[];
  healthConditions: HealthCondition[];
  allergies: Allergy[];
  
  // Metadata
  isComplete: boolean;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Choice chip options for easy selection
export const AGE_RANGES = [
  { id: '18-24', label: '18-24' },
  { id: '25-34', label: '25-34' },
  { id: '35-44', label: '35-44' },
  { id: '45-54', label: '45-54' },
  { id: '55-64', label: '55-64' },
  { id: '65+', label: '65+' },
];

export const BIOLOGICAL_SEX_OPTIONS = [
  { id: 'male', label: 'Male' },
  { id: 'female', label: 'Female' },
  { id: 'other', label: 'Other' },
];

export const COMMON_HEALTH_GOALS = [
  { id: 'energy', name: 'Increase Energy', category: 'wellness' },
  { id: 'sleep', name: 'Better Sleep', category: 'wellness' },
  { id: 'immune', name: 'Immune Support', category: 'wellness' },
  { id: 'heart', name: 'Heart Health', category: 'cardiovascular' },
  { id: 'brain', name: 'Brain Health', category: 'cognitive' },
  { id: 'muscle', name: 'Muscle Growth', category: 'fitness' },
  { id: 'weight', name: 'Weight Management', category: 'fitness' },
  { id: 'joint', name: 'Joint Health', category: 'mobility' },
  { id: 'skin', name: 'Skin Health', category: 'beauty' },
  { id: 'none', name: 'None', category: 'none' },
];

export const COMMON_HEALTH_CONDITIONS = [
  { id: 'diabetes', name: 'Diabetes', category: 'metabolic' },
  { id: 'hypertension', name: 'High Blood Pressure', category: 'cardiovascular' },
  { id: 'anxiety', name: 'Anxiety', category: 'mental' },
  { id: 'depression', name: 'Depression', category: 'mental' },
  { id: 'arthritis', name: 'Arthritis', category: 'joint' },
  { id: 'asthma', name: 'Asthma', category: 'respiratory' },
  { id: 'thyroid', name: 'Thyroid Issues', category: 'endocrine' },
  { id: 'cholesterol', name: 'High Cholesterol', category: 'cardiovascular' },
  { id: 'none', name: 'None', category: 'none' },
];

export const COMMON_ALLERGIES = [
  { id: 'dairy', name: 'Dairy', type: 'food' },
  { id: 'nuts', name: 'Tree Nuts', type: 'food' },
  { id: 'shellfish', name: 'Shellfish', type: 'food' },
  { id: 'soy', name: 'Soy', type: 'food' },
  { id: 'gluten', name: 'Gluten', type: 'food' },
  { id: 'penicillin', name: 'Penicillin', type: 'medication' },
  { id: 'aspirin', name: 'Aspirin', type: 'medication' },
  { id: 'ibuprofen', name: 'Ibuprofen', type: 'medication' },
  { id: 'pollen', name: 'Pollen', type: 'environmental' },
  { id: 'none', name: 'None', type: 'none' },
];