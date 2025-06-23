// =====================================================
// PharmaGuide Database Types
// Generated from fresh database schema
// =====================================================

// ===== Base Database Types =====

export interface DatabaseUser {
  id: string;
  auth_id: string;
  email: string | null;
  is_anonymous: boolean;
  display_name: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface DatabaseProduct {
  id: string;
  barcode: string | null;
  name: string;
  brand: string | null;
  category: string | null;
  image_url: string | null;
  ingredients: any | null; // JSONB
  verified: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface DatabaseUserProfile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  age: number | null;
  gender: string | null;
  health_goals: string[]; // JSONB array
  conditions: string[]; // JSONB array
  allergies: string[]; // JSONB array
  medications: string[]; // JSONB array
  genetics: Record<string, any> | null; // JSONB
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface DatabaseUserPreferences {
  id: string;
  user_id: string;
  ai_response_style: 'concise' | 'detailed' | 'technical';
  budget_range: 'budget' | 'mid' | 'premium';
  primary_focus: 'safety' | 'efficacy' | 'value' | 'naturalness';
  notifications: {
    push_enabled: boolean;
    email_enabled: boolean;
    reminder_frequency: 'daily' | 'weekly' | 'monthly';
  };
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface DatabaseUserPoints {
  id: string;
  user_id: string;
  total_points: number;
  level: number;
  created_at: string;
  updated_at: string;
}

export interface DatabaseUserStreaks {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null; // Date string
  created_at: string;
  updated_at: string;
}

export interface DatabasePointsHistory {
  id: string;
  user_id: string;
  points_change: number;
  reason: string;
  metadata: Record<string, any> | null;
  created_at: string;
}

export interface DatabaseScanHistory {
  id: string;
  user_id: string | null; // Can be null for anonymous scans
  product_id: string | null;
  scan_type: string | null;
  analysis_score: number | null;
  scanned_at: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface DatabaseUserStack {
  id: string;
  user_id: string;
  item_id: string | null;
  name: string | null;
  type: 'medication' | 'supplement' | null;
  dosage: string | null;
  frequency: string | null;
  active: boolean;
  brand: string | null;
  image_url: string | null;
  ingredients: any | null; // JSONB
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface DatabaseInteraction {
  id: string;
  item1_id: string;
  item2_id: string;
  severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' | null;
  mechanism: string | null;
  evidence: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CriticalInteractionRule {
  id: string;
  item1Type: string;
  item1Identifier: string;
  item2Type: string;
  item2Identifier: string;
  severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  mechanism: string;
  clinicalSignificance: string;
  recommendation: string;
  contraindicated: boolean;
  monitoringRequired: boolean;
  source: 'FDA' | 'NIH' | 'PUBMED' | 'CLINICAL_STUDY' | 'MANUFACTURER' | 'AI';
  evidenceQuality: 'A' | 'B' | 'C' | 'D' | 'EXPERT_OPINION';
  sources: InteractionSource[];
}

export interface InteractionSource {
  sourceType:
    | 'FDA'
    | 'NIH'
    | 'PUBMED'
    | 'CLINICAL_STUDY'
    | 'MANUFACTURER'
    | 'AI';
  sourceName: string;
  sourceUrl?: string;
  confidenceScore?: number;
}

export interface NutrientLimit {
  id: string;
  nutrientName: string;
  upperLimit: number;
  unit: string;
  ageGroup?: string;
  gender?: string;
  healthRisks?: string;
  toxicitySymptoms?: string[];
  source: string;
  sourceUrl?: string;
}

export interface DatabaseAIResponseCache {
  id: string;
  cache_key: string | null;
  response: any | null; // JSONB
  model_used: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
}

export interface DatabaseUserRole {
  id: string;
  user_id: string;
  role: 'patient' | 'provider' | 'admin' | 'moderator';
  granted_at: string;
  granted_by: string | null;
  expires_at: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface DatabaseProviderPatient {
  id: string;
  provider_id: string;
  patient_id: string;
  status: 'pending' | 'active' | 'revoked';
  shared_data: {
    stack: boolean;
    history: boolean;
    profile: boolean;
  };
  invitation_code: string | null;
  invited_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
}

// ===== Joined Query Types =====

export interface DatabaseUserWithRelations extends DatabaseUser {
  profile?: DatabaseUserProfile;
  preferences?: DatabaseUserPreferences;
  points?: DatabaseUserPoints;
  streaks?: DatabaseUserStreaks;
  roles?: DatabaseUserRole[];
}

// ===== Function Return Types =====

export interface CreateUserWithProfileResponse {
  user_id: string;
}

export interface IncrementPointsResponse {
  success: boolean;
  new_total: number;
  new_level: number;
}

export interface UpdateStreakResponse {
  success: boolean;
  current_streak: number;
  longest_streak: number;
  message?: string;
}

// ===== Application Types (Used in your React Native app) =====

export interface User {
  id: string;
  authId: string;
  email: string | null;
  isAnonymous: boolean;
  displayName: string | null;
  profile?: UserProfile;
  preferences?: UserPreferences;
  points?: UserPoints;
  streaks?: UserStreaks;
  roles?: UserRole[];
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  firstName: string | null;
  lastName: string | null;
  age: number | null;
  gender: string | null;
  healthGoals: string[];
  conditions: string[];
  allergies: string[];
  medications: string[];
  genetics?: {
    mthfr?: string;
    comt?: string;
    [key: string]: string | undefined;
  };
}

export interface UserPreferences {
  aiResponseStyle: 'concise' | 'detailed' | 'technical';
  budgetRange: 'budget' | 'mid' | 'premium';
  primaryFocus: 'safety' | 'efficacy' | 'value' | 'naturalness';
  notifications: {
    pushEnabled: boolean;
    emailEnabled: boolean;
    reminderFrequency: 'daily' | 'weekly' | 'monthly';
  };
}

export interface UserPoints {
  total: number;
  level: number;
  levelTitle?: string;
  nextLevelAt?: number;
}

export interface UserStreaks {
  current: number;
  longest: number;
  lastActivity: string | null;
}

export interface UserRole {
  role: 'patient' | 'provider' | 'admin' | 'moderator';
  grantedAt: string;
  expiresAt: string | null;
}

export interface Product {
  id: string;
  barcode: string | null;
  name: string;
  brand: string | null;
  category: string | null;
  imageUrl: string | null;
  ingredients: Ingredient[];
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Ingredient {
  name: string;
  amount?: string;
  unit?: string;
  percentage?: number;
}

export interface StackItem {
  id: string;
  itemId: string | null;
  name: string;
  type: 'medication' | 'supplement';
  dosage: string | null;
  frequency: string | null;
  active: boolean;
  brand: string | null;
  imageUrl: string | null;
  ingredients: Ingredient[];
  createdAt: string;
  updatedAt: string;
}

export interface Interaction {
  id: string;
  item1Id: string;
  item2Id: string;
  severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  mechanism: string;
  evidence: string;
}

export interface ScanResult {
  id: string;
  productId: string | null;
  product?: Product;
  scanType: 'barcode' | 'ocr' | 'voice' | 'manual';
  analysisScore: number;
  scannedAt: string;
}

// ===== Supabase Table Names =====

export const TABLES = {
  USERS: 'users',
  PRODUCTS: 'products',
  USER_PROFILES: 'user_profiles',
  USER_PREFERENCES: 'user_preferences',
  USER_POINTS: 'user_points',
  USER_STREAKS: 'user_streaks',
  POINTS_HISTORY: 'points_history',
  SCAN_HISTORY: 'scan_history',
  USER_STACK: 'user_stack',
  INTERACTIONS: 'interactions',
  AI_RESPONSE_CACHE: 'ai_response_cache',
  USER_ROLES: 'user_roles',
  PROVIDER_PATIENTS: 'provider_patients',
  AUDIT_LOG: 'audit_log',
} as const;

// ===== RPC Function Names =====

export const RPC_FUNCTIONS = {
  CREATE_USER_WITH_PROFILE: 'create_user_with_profile',
  INCREMENT_POINTS: 'increment_points',
  UPDATE_STREAK: 'update_streak',
} as const;

// ===== Storage Buckets =====

export const STORAGE_BUCKETS = {
  PRODUCT_IMAGES: 'product-images',
  USER_UPLOADS: 'user-uploads',
} as const;
