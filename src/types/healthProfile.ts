// src/types/healthProfile.ts

export type AgeRange = '0-5' | '6-12' | '13-18' | '19-30' | '31-50' | '51-65' | '66+';
export type BiologicalSex = 'male' | 'female' | 'prefer_not_to_say';
export type PregnancyStatus = 'pregnant' | 'breastfeeding' | 'trying_to_conceive' | 'none' | 'not_applicable';

export interface Demographics {
  ageRange: AgeRange;
  biologicalSex: BiologicalSex;
  displayName?: string;
  pregnancyStatus?: PregnancyStatus;
  createdAt: string;
  updatedAt: string;
}

export type HealthGoal = 
  | 'energy_boost' 
  | 'better_sleep' 
  | 'immune_support'
  | 'heart_health' 
  | 'brain_health' 
  | 'bone_health'
  | 'manage_diabetes' 
  | 'weight_management' 
  | 'stress_relief'
  | 'athletic_performance' 
  | 'healthy_aging' 
  | 'digestive_health'
  | 'muscle_building'
  | 'joint_health'
  | 'skin_health'
  | 'eye_health'
  | 'liver_health'
  | 'kidney_health'
  | 'respiratory_health';

export interface HealthGoals {
  primary: HealthGoal;
  secondary?: HealthGoal;
  tertiary?: HealthGoal;
  createdAt: string;
  updatedAt: string;
}

export interface HealthCondition {
  id: string;
  name: string;
  category: HealthConditionCategory;
  severity?: 'mild' | 'moderate' | 'severe';
  diagnosed?: boolean;
  managedWith?: 'medication' | 'lifestyle' | 'both' | 'none';
  notes?: string;
}

export type HealthConditionCategory = 
  | 'cardiovascular'
  | 'metabolic'
  | 'gastrointestinal'
  | 'mental_health'
  | 'autoimmune'
  | 'respiratory'
  | 'neurological'
  | 'endocrine'
  | 'musculoskeletal'
  | 'kidney_liver'
  | 'blood_disorders'
  | 'cancer'
  | 'other';

export interface HealthConditions {
  conditions: HealthCondition[];
  consentGiven: boolean;
  consentTimestamp?: string;
  lastUpdated: string;
}

export interface Allergy {
  id: string;
  name: string;
  type: AllergyType;
  severity: AllergySeverity;
  reaction?: string;
  confirmed?: boolean;
}

export type AllergyType = 
  | 'food'
  | 'drug'
  | 'supplement'
  | 'environmental'
  | 'other';

export type AllergySeverity = 
  | 'mild'
  | 'moderate'
  | 'severe'
  | 'life_threatening';

export interface AllergiesAndSensitivities {
  allergies: Allergy[];
  consentGiven: boolean;
  consentTimestamp?: string;
  lastUpdated: string;
}

export interface Medication {
  id: string;
  name: string;
  genericName?: string;
  dosage?: string;
  frequency?: string;
  prescribedBy?: string;
  startDate?: string;
  endDate?: string;
  indication?: string;
  type: 'prescription' | 'otc' | 'supplement';
  active: boolean;
}

export interface CurrentMedications {
  medications: Medication[];
  consentGiven: boolean;
  consentTimestamp?: string;
  lastUpdated: string;
}

export type ConsentType = 
  | 'health_data_storage'
  | 'personalized_recommendations'
  | 'health_conditions'
  | 'allergies_tracking'
  | 'medication_tracking'
  | 'anonymized_research'
  | 'marketing_communications'
  | 'data_sharing_partners'
  | 'crash_analytics'
  | 'usage_analytics';

export interface PrivacyConsent {
  consentType: ConsentType;
  granted: boolean;
  timestamp: string;
  version: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface PrivacySettings {
  consents: PrivacyConsent[];
  dataRetentionPeriod: number; // days
  allowDataExport: boolean;
  allowDataDeletion: boolean;
  lastUpdated: string;
}

export interface NotificationSettings {
  interactionAlerts: boolean;
  dailyReminders: boolean;
  weeklyReports: boolean;
  newFeatures: boolean;
  safetyUpdates: boolean;
  marketingEmails: boolean;
  pushNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
}

export interface AccessibilitySettings {
  fontSize: 'small' | 'medium' | 'large' | 'extra_large';
  highContrast: boolean;
  reduceMotion: boolean;
  screenReader: boolean;
  voiceOver: boolean;
  hapticFeedback: boolean;
  colorBlindSupport: boolean;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  units: 'metric' | 'imperial';
  currency: string;
  timezone: string;
  autoSync: boolean;
  offlineMode: boolean;
  cacheSize: 'small' | 'medium' | 'large';
}

export interface UserProfile {
  id: string;
  userId: string;
  demographics?: Demographics;
  healthGoals?: HealthGoals;
  healthConditions?: HealthConditions;
  allergiesAndSensitivities?: AllergiesAndSensitivities;
  currentMedications?: CurrentMedications;
  privacySettings: PrivacySettings;
  notificationSettings: NotificationSettings;
  accessibilitySettings: AccessibilitySettings;
  appSettings: AppSettings;
  profileCompleteness: number; // 0-100%
  lastActiveAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileSetupStep {
  id: string;
  title: string;
  description: string;
  required: boolean;
  completed: boolean;
  consentRequired?: boolean;
  estimatedTime: number; // minutes
}

export interface PersonalizedRisk {
  type: 'age_specific' | 'condition_specific' | 'pregnancy_specific' | 'allergy_specific' | 'medication_specific';
  severity: 'low' | 'moderate' | 'high' | 'critical';
  message: string;
  recommendation: string;
  sources: string[];
  populationAffected: string[];
}

export interface PersonalizedRecommendation {
  type: 'dosage_adjustment' | 'timing_optimization' | 'alternative_suggestion' | 'monitoring_advice';
  title: string;
  description: string;
  reasoning: string;
  evidenceLevel: 'A' | 'B' | 'C' | 'D' | 'E';
  applicableGoals?: HealthGoal[];
  applicableConditions?: string[];
}

// Health condition definitions for UI
export const HEALTH_CONDITIONS = {
  cardiovascular: [
    { id: 'hypertension', name: 'High Blood Pressure (Hypertension)', common: true },
    { id: 'heart_disease', name: 'Heart Disease', common: true },
    { id: 'arrhythmia', name: 'Heart Rhythm Disorders', common: false },
    { id: 'high_cholesterol', name: 'High Cholesterol', common: true },
    { id: 'heart_failure', name: 'Heart Failure', common: false },
    { id: 'stroke_history', name: 'History of Stroke', common: false },
  ],
  metabolic: [
    { id: 'diabetes_type1', name: 'Type 1 Diabetes', common: false },
    { id: 'diabetes_type2', name: 'Type 2 Diabetes', common: true },
    { id: 'prediabetes', name: 'Prediabetes', common: true },
    { id: 'metabolic_syndrome', name: 'Metabolic Syndrome', common: true },
    { id: 'thyroid_hyper', name: 'Hyperthyroidism', common: false },
    { id: 'thyroid_hypo', name: 'Hypothyroidism', common: true },
  ],
  gastrointestinal: [
    { id: 'ibs', name: 'Irritable Bowel Syndrome (IBS)', common: true },
    { id: 'crohns', name: "Crohn's Disease", common: false },
    { id: 'ulcerative_colitis', name: 'Ulcerative Colitis', common: false },
    { id: 'celiac', name: 'Celiac Disease', common: false },
    { id: 'gerd', name: 'GERD/Acid Reflux', common: true },
    { id: 'liver_disease', name: 'Liver Disease', common: false },
  ],
  mental_health: [
    { id: 'depression', name: 'Depression', common: true },
    { id: 'anxiety', name: 'Anxiety Disorders', common: true },
    { id: 'bipolar', name: 'Bipolar Disorder', common: false },
    { id: 'adhd', name: 'ADHD', common: true },
    { id: 'ptsd', name: 'PTSD', common: false },
    { id: 'eating_disorder', name: 'Eating Disorders', common: false },
  ],
  autoimmune: [
    { id: 'rheumatoid_arthritis', name: 'Rheumatoid Arthritis', common: false },
    { id: 'lupus', name: 'Lupus', common: false },
    { id: 'multiple_sclerosis', name: 'Multiple Sclerosis', common: false },
    { id: 'psoriasis', name: 'Psoriasis', common: true },
    { id: 'hashimotos', name: "Hashimoto's Thyroiditis", common: false },
    { id: 'type1_diabetes', name: 'Type 1 Diabetes (Autoimmune)', common: false },
  ],
} as const;

// Common allergies for UI
export const COMMON_ALLERGIES = {
  food: [
    'Nuts (Tree nuts)', 'Peanuts', 'Shellfish', 'Fish', 'Dairy/Milk', 'Eggs', 
    'Soy', 'Wheat/Gluten', 'Sesame', 'Corn'
  ],
  drug: [
    'Penicillin', 'Sulfa drugs', 'NSAIDs (Ibuprofen, etc.)', 'Aspirin', 
    'Codeine', 'Morphine', 'Local anesthetics', 'Contrast dye'
  ],
  supplement: [
    'Magnesium', 'Iron', 'Fish Oil', 'Vitamin E', 'Ginkgo', 'Echinacea',
    'St. John\'s Wort', 'Garlic supplements'
  ],
  environmental: [
    'Latex', 'Iodine', 'Nickel', 'Fragrances', 'Preservatives', 'Dyes'
  ],
} as const;
