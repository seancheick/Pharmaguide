// src/utils/databaseTransforms.ts
/**
 * Centralized database transformation utilities
 * Handles conversion between database snake_case and app camelCase
 */

import type { UserStack, Product } from '../types';
import type { UserProfile } from '../types/healthProfile';
import type {
  DatabaseUserStack,
  DatabaseProduct,
  ScanResult,
  DatabaseScanHistory,
  DatabaseUserProfile,
} from '../types/database';

/**
 * Transform UserStack (app format) to database format
 */
export function transformUserStackToDb(
  item: Partial<UserStack>
): Partial<DatabaseUserStack> {
  return {
    id: item.id,
    user_id: item.user_id,
    item_id: item.item_id,
    name: item.name,
    type: item.type,
    dosage: item.dosage,
    frequency: item.frequency,
    brand: item.brand,
    image_url: item.imageUrl, // camelCase → snake_case
    ingredients: item.ingredients,
    active: item.active,
    created_at: item.created_at,
    updated_at: item.updated_at,
    // Note: deleted_at is not part of the app UserStack interface
  };
}

/**
 * Transform database format to UserStack (app format)
 */
export function transformDbToUserStack(dbItem: DatabaseUserStack): UserStack {
  return {
    id: dbItem.id,
    user_id: dbItem.user_id,
    item_id: dbItem.item_id || '',
    name: dbItem.name || '',
    type: dbItem.type || 'supplement',
    dosage: dbItem.dosage || '',
    frequency: dbItem.frequency || '',
    brand: dbItem.brand || undefined,
    imageUrl: dbItem.image_url || undefined, // snake_case → camelCase
    ingredients: dbItem.ingredients || [],
    active: dbItem.active,
    created_at: dbItem.created_at,
    updated_at: dbItem.updated_at,
    // Note: deleted_at is not part of the app UserStack interface
  };
}

/**
 * Transform array of database items to app format
 */
export function transformDbArrayToUserStack(
  dbItems: DatabaseUserStack[]
): UserStack[] {
  return dbItems.map(transformDbToUserStack);
}

/**
 * Transform array of app items to database format
 */
export function transformUserStackArrayToDb(
  items: UserStack[]
): Partial<DatabaseUserStack>[] {
  return items.map(transformUserStackToDb);
}

/**
 * Create database insert payload from UserStack item
 */
export function createStackInsertPayload(
  item: Partial<UserStack>,
  userId: string,
  timestamp: string
): Partial<DatabaseUserStack> {
  return {
    user_id: userId,
    name: item.name,
    type: item.type,
    dosage: item.dosage,
    frequency: item.frequency,
    item_id: item.item_id,
    brand: item.brand,
    image_url: item.imageUrl, // Transform camelCase to snake_case for DB
    ingredients: item.ingredients,
    active: true,
    created_at: timestamp,
    updated_at: timestamp,
  };
}

/**
 * Create database update payload from UserStack item
 */
export function createStackUpdatePayload(
  updates: Partial<UserStack>,
  timestamp: string
): Partial<DatabaseUserStack> {
  const payload: Partial<DatabaseUserStack> = {
    updated_at: timestamp,
  };

  // Only include fields that are being updated
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.type !== undefined) payload.type = updates.type;
  if (updates.dosage !== undefined) payload.dosage = updates.dosage;
  if (updates.frequency !== undefined) payload.frequency = updates.frequency;
  if (updates.brand !== undefined) payload.brand = updates.brand;
  if (updates.imageUrl !== undefined) payload.image_url = updates.imageUrl;
  if (updates.ingredients !== undefined)
    payload.ingredients = updates.ingredients;
  if (updates.active !== undefined) payload.active = updates.active;

  return payload;
}

/**
 * Validate required fields for database operations
 */
export function validateStackItem(item: Partial<UserStack>): string[] {
  const errors: string[] = [];

  if (!item.name || item.name.trim() === '') {
    errors.push('Name is required');
  }

  if (!item.type || !['medication', 'supplement'].includes(item.type)) {
    errors.push('Valid type (medication or supplement) is required');
  }

  return errors;
}

/**
 * Sanitize stack item data before database operations
 */
export function sanitizeStackItem(
  item: Partial<UserStack>
): Partial<UserStack> {
  return {
    ...item,
    name: item.name?.trim(),
    brand: item.brand?.trim(),
    dosage: item.dosage?.trim(),
    frequency: item.frequency?.trim(),
    // Ensure ingredients is always an array
    ingredients: Array.isArray(item.ingredients) ? item.ingredients : [],
  };
}

// =====================================================
// PRODUCT TRANSFORMATIONS
// =====================================================

/**
 * Transform database format to Product (app format)
 * Handles type differences between database and app Product interfaces
 * Maps all database fields to app interface with proper defaults
 */
export function transformDbToProduct(dbProduct: DatabaseProduct): Product {
  return {
    id: dbProduct.id,
    name: dbProduct.name,
    brand: dbProduct.brand || '', // Handle null -> string conversion
    category: (dbProduct.category as any) || 'specialty', // Handle category type conversion
    barcode: dbProduct.barcode || undefined, // Handle null -> undefined conversion

    // Map active_ingredients to ingredients array
    ingredients: Array.isArray(dbProduct.active_ingredients)
      ? dbProduct.active_ingredients
      : dbProduct.active_ingredients
        ? [dbProduct.active_ingredients]
        : [],

    servingSize: dbProduct.dosage_form || '1 serving', // Map dosage_form to servingSize
    servingsPerContainer: 1, // Default value for app interface
    dosage: dbProduct.strength || undefined, // Map strength to dosage
    price: undefined, // Not stored in database
    imageUrl: dbProduct.image_url || undefined, // snake_case → camelCase, null -> undefined
    verified: dbProduct.verified,
    thirdPartyTested: dbProduct.fda_approved || false, // Map fda_approved to thirdPartyTested

    // Map warnings to certifications (or create separate field later)
    certifications: Array.isArray(dbProduct.warnings) ? [] : [], // Keep certifications empty for now

    createdAt: dbProduct.created_at, // snake_case → camelCase
    updatedAt: dbProduct.updated_at, // snake_case → camelCase
  };
}

/**
 * Transform Product (app format) to database format
 * Handles type differences between app and database Product interfaces
 * Maps all app fields to database schema with proper null handling
 */
export function transformProductToDb(
  product: Partial<Product>
): Partial<DatabaseProduct> {
  return {
    id: product.id,
    barcode: product.barcode || null, // Handle undefined -> null conversion
    name: product.name,
    generic_name: null, // Not provided by app interface
    brand: product.brand || null, // Handle empty string -> null conversion
    manufacturer: null, // Not provided by app interface
    category: (product.category as string) || null, // Handle category type conversion
    dosage_form:
      product.servingSize !== '1 serving' ? product.servingSize : null, // Map servingSize to dosage_form
    strength: product.dosage || null, // Map dosage to strength

    // Map ingredients to active_ingredients
    active_ingredients:
      product.ingredients && product.ingredients.length > 0
        ? product.ingredients
        : null,
    inactive_ingredients: null, // Not provided by app interface

    image_url: product.imageUrl || null, // camelCase → snake_case, undefined -> null
    verified: product.verified,
    fda_approved: product.thirdPartyTested || false, // Map thirdPartyTested to fda_approved
    otc_status: true, // Default to OTC
    warnings: null, // Not provided by app interface (certifications could map here later)

    created_at: product.createdAt, // camelCase → snake_case
    updated_at: product.updatedAt, // camelCase → snake_case
  };
}

/**
 * Transform array of database products to app format
 */
export function transformDbArrayToProduct(
  dbProducts: DatabaseProduct[]
): Product[] {
  return dbProducts.map(transformDbToProduct);
}

/**
 * Create database insert payload from Product item
 * Handles type differences and provides defaults for required fields
 * Maps all app fields to complete database schema
 */
export function createProductInsertPayload(
  product: Partial<Product>,
  timestamp: string
): Partial<DatabaseProduct> {
  return {
    barcode: product.barcode || null, // Handle undefined -> null conversion
    name: product.name,
    generic_name: null, // Not provided by app interface
    brand: product.brand || null, // Handle empty string -> null conversion
    manufacturer: null, // Not provided by app interface
    category: (product.category as string) || null, // Handle category type conversion
    dosage_form:
      product.servingSize !== '1 serving' ? product.servingSize : null, // Map servingSize to dosage_form
    strength: product.dosage || null, // Map dosage to strength

    // Map ingredients to active_ingredients
    active_ingredients:
      product.ingredients && product.ingredients.length > 0
        ? product.ingredients
        : null,
    inactive_ingredients: null, // Not provided by app interface

    image_url: product.imageUrl || null, // Transform camelCase to snake_case for DB, undefined -> null
    verified: product.verified || false,
    fda_approved: product.thirdPartyTested || false, // Map thirdPartyTested to fda_approved
    otc_status: true, // Default to OTC for new products
    warnings: null, // Not provided by app interface

    created_at: timestamp,
    updated_at: timestamp,
  };
}

/**
 * Create database update payload from Product item
 * Maps all updatable app fields to database schema
 */
export function createProductUpdatePayload(
  updates: Partial<Product>,
  timestamp: string
): Partial<DatabaseProduct> {
  const payload: Partial<DatabaseProduct> = {
    updated_at: timestamp,
  };

  // Only include fields that are being updated
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.brand !== undefined) payload.brand = updates.brand;
  if (updates.category !== undefined)
    payload.category = updates.category as string;
  if (updates.imageUrl !== undefined) payload.image_url = updates.imageUrl;
  if (updates.verified !== undefined) payload.verified = updates.verified;

  // Map new fields
  if (updates.servingSize !== undefined) {
    payload.dosage_form =
      updates.servingSize !== '1 serving' ? updates.servingSize : null;
  }
  if (updates.dosage !== undefined) payload.strength = updates.dosage;
  if (updates.ingredients !== undefined) {
    payload.active_ingredients =
      updates.ingredients && updates.ingredients.length > 0
        ? updates.ingredients
        : null;
  }
  if (updates.thirdPartyTested !== undefined)
    payload.fda_approved = updates.thirdPartyTested;

  return payload;
}

/**
 * Validate required fields for Product database operations
 */
export function validateProduct(product: Partial<Product>): string[] {
  const errors: string[] = [];

  if (!product.name || product.name.trim() === '') {
    errors.push('Product name is required');
  }

  return errors;
}

/**
 * Sanitize product data before database operations
 */
export function sanitizeProduct(product: Partial<Product>): Partial<Product> {
  return {
    ...product,
    name: product.name?.trim(),
    brand: product.brand?.trim(),
    // Handle category type conversion
    category: product.category as any,
    // Ensure ingredients is always an array
    ingredients: Array.isArray(product.ingredients) ? product.ingredients : [],
  };
}

// =====================================================
// SCAN HISTORY TRANSFORMATIONS
// =====================================================

/**
 * Transform database format to ScanResult (app format)
 */
export function transformDbToScanResult(
  dbScan: DatabaseScanHistory
): ScanResult {
  return {
    id: dbScan.id,
    productId: dbScan.product_id, // snake_case → camelCase
    scanType: (dbScan.scan_type as ScanResult['scanType']) || 'barcode',
    analysisScore: dbScan.analysis_score || 0,
    scannedAt: dbScan.scanned_at, // snake_case → camelCase
  };
}

/**
 * Transform ScanResult (app format) to database format
 */
export function transformScanResultToDb(
  scan: Partial<ScanResult>
): Partial<DatabaseScanHistory> {
  return {
    id: scan.id,
    product_id: scan.productId, // camelCase → snake_case
    scan_type: scan.scanType, // camelCase → snake_case
    analysis_score: scan.analysisScore, // camelCase → snake_case
    scanned_at: scan.scannedAt, // camelCase → snake_case
  };
}

/**
 * Transform array of database scan history to app format
 */
export function transformDbArrayToScanResult(
  dbScans: DatabaseScanHistory[]
): ScanResult[] {
  return dbScans.map(transformDbToScanResult);
}

/**
 * Create database insert payload from ScanResult item
 */
export function createScanInsertPayload(
  scan: Partial<ScanResult>,
  userId: string | null,
  timestamp: string
): Partial<DatabaseScanHistory> {
  return {
    user_id: userId, // camelCase → snake_case
    product_id: scan.productId, // camelCase → snake_case
    scan_type: scan.scanType || 'barcode', // camelCase → snake_case
    analysis_score: scan.analysisScore || 0, // camelCase → snake_case
    scanned_at: scan.scannedAt || timestamp, // camelCase → snake_case
    created_at: timestamp,
    updated_at: timestamp,
  };
}

/**
 * Create database update payload from ScanResult item
 */
export function createScanUpdatePayload(
  updates: Partial<ScanResult>,
  timestamp: string
): Partial<DatabaseScanHistory> {
  const payload: Partial<DatabaseScanHistory> = {
    updated_at: timestamp,
  };

  // Only include fields that are being updated
  if (updates.productId !== undefined) payload.product_id = updates.productId;
  if (updates.scanType !== undefined) payload.scan_type = updates.scanType;
  if (updates.analysisScore !== undefined)
    payload.analysis_score = updates.analysisScore;
  if (updates.scannedAt !== undefined) payload.scanned_at = updates.scannedAt;

  return payload;
}

/**
 * Validate required fields for ScanResult database operations
 */
export function validateScanResult(scan: Partial<ScanResult>): string[] {
  const errors: string[] = [];

  if (
    !scan.scanType ||
    !['barcode', 'ocr', 'voice', 'manual'].includes(scan.scanType)
  ) {
    errors.push('Valid scan type is required (barcode, ocr, voice, or manual)');
  }

  if (
    scan.analysisScore !== undefined &&
    (scan.analysisScore < 0 || scan.analysisScore > 100)
  ) {
    errors.push('Analysis score must be between 0 and 100');
  }

  return errors;
}

/**
 * Sanitize scan result data before database operations
 */
export function sanitizeScanResult(
  scan: Partial<ScanResult>
): Partial<ScanResult> {
  return {
    ...scan,
    scanType: scan.scanType || 'barcode',
    analysisScore: Math.max(0, Math.min(100, scan.analysisScore || 0)),
    scannedAt: scan.scannedAt || new Date().toISOString(),
  };
}

// =====================================================
// USER PROFILE TRANSFORMATIONS
// =====================================================

/**
 * Transform database format to UserProfile (app format)
 * HIPAA-COMPLIANT: Maps database fields to comprehensive UserProfile interface
 * Handles the mismatch between simple database schema and complex app interface
 */
export function transformDbToUserProfile(
  dbProfile: DatabaseUserProfile
): Partial<UserProfile> {
  // Calculate age from date_of_birth for age range anonymization
  const ageRange = dbProfile.date_of_birth
    ? calculateAgeRange(new Date(dbProfile.date_of_birth))
    : ('19-30' as const);

  // Map database fields to comprehensive UserProfile structure
  return {
    id: dbProfile.id,
    userId: dbProfile.user_id,

    // Map database fields to Demographics
    demographics:
      dbProfile.display_name || dbProfile.gender || dbProfile.date_of_birth
        ? {
            ageRange,
            biologicalSex: (dbProfile.gender as any) || 'prefer_not_to_say',
            displayName: dbProfile.display_name || undefined,
            pregnancyStatus: undefined,
            createdAt: dbProfile.created_at,
            updatedAt: dbProfile.updated_at,
          }
        : undefined,

    // Map health_goals to HealthGoals structure
    healthGoals:
      dbProfile.health_goals && dbProfile.health_goals.length > 0
        ? {
            primary: dbProfile.health_goals[0] as any,
            secondary: dbProfile.health_goals[1] as any,
            tertiary: dbProfile.health_goals[2] as any,
            createdAt: dbProfile.created_at,
            updatedAt: dbProfile.updated_at,
          }
        : undefined,

    // Map medical_conditions to HealthConditions structure
    healthConditions:
      dbProfile.medical_conditions && dbProfile.medical_conditions.length > 0
        ? {
            conditions: dbProfile.medical_conditions.map((name, index) => ({
              id: `condition_${index}`,
              name,
              category: 'other' as const,
              severity: undefined,
              diagnosed: undefined,
              managedWith: undefined,
              notes: undefined,
            })),
            consentGiven: true,
            consentTimestamp: dbProfile.created_at,
            lastUpdated: dbProfile.updated_at,
          }
        : undefined,

    // Map allergies to AllergiesAndSensitivities structure
    allergiesAndSensitivities:
      dbProfile.allergies && dbProfile.allergies.length > 0
        ? {
            allergies: dbProfile.allergies.map((name, index) => ({
              id: `allergy_${index}`,
              name,
              type: 'other' as const,
              severity: 'moderate' as const,
              reaction: undefined,
              confirmed: undefined,
            })),
            consentGiven: true,
            lastUpdated: dbProfile.updated_at,
          }
        : undefined,

    // Default privacy settings (HIPAA-compliant)
    privacySettings: {
      consents: [],
      dataRetentionPeriod: 2555, // 7 years (HIPAA-inspired)
      allowDataExport: true,
      allowDataDeletion: true,
      lastUpdated: dbProfile.updated_at,
    },

    // Default notification settings
    notificationSettings: {
      interactionAlerts: true,
      dailyReminders: false,
      weeklyReports: false,
      newFeatures: true,
      safetyUpdates: true,
      marketingEmails: false,
      pushNotifications: true,
      emailNotifications: false,
      smsNotifications: false,
    },

    // Default accessibility settings
    accessibilitySettings: {
      fontSize: 'medium' as const,
      highContrast: false,
      reduceMotion: false,
      screenReader: false,
      voiceOver: false,
      hapticFeedback: true,
      colorBlindSupport: false,
    },

    // Default app settings
    appSettings: {
      theme: 'system' as const,
      language: 'en',
      units: 'metric' as const,
      currency: 'USD',
      timezone: 'UTC',
      autoSync: true,
      offlineMode: false,
      cacheSize: 'medium' as const,
    },

    profileCompleteness: calculateProfileCompleteness(dbProfile),
    lastActiveAt: new Date().toISOString(),
    createdAt: dbProfile.created_at,
    updatedAt: dbProfile.updated_at,
  };
}

/**
 * Helper function to calculate age range from date of birth (HIPAA-compliant anonymization)
 */
function calculateAgeRange(
  birthDate: Date
): '0-5' | '6-12' | '13-18' | '19-30' | '31-50' | '51-65' | '66+' {
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();

  if (age <= 5) return '0-5';
  if (age <= 12) return '6-12';
  if (age <= 18) return '13-18';
  if (age <= 30) return '19-30';
  if (age <= 50) return '31-50';
  if (age <= 65) return '51-65';
  return '66+';
}

/**
 * Helper function to calculate profile completeness percentage
 */
function calculateProfileCompleteness(dbProfile: DatabaseUserProfile): number {
  let completeness = 0;
  const totalFields = 7;

  if (dbProfile.display_name) completeness += 1;
  if (dbProfile.date_of_birth) completeness += 1;
  if (dbProfile.gender) completeness += 1;
  if (dbProfile.health_goals && dbProfile.health_goals.length > 0)
    completeness += 1;
  if (dbProfile.medical_conditions && dbProfile.medical_conditions.length > 0)
    completeness += 1;
  if (dbProfile.allergies && dbProfile.allergies.length > 0) completeness += 1;
  if (dbProfile.medications && dbProfile.medications.length > 0)
    completeness += 1;

  return Math.round((completeness / totalFields) * 100);
}

/**
 * Transform UserProfile (app format) to database format
 * HIPAA-COMPLIANT: Maps comprehensive UserProfile to simple database schema
 * Flattens nested app structure to database fields
 */
export function transformUserProfileToDb(
  profile: Partial<UserProfile>
): Partial<DatabaseUserProfile> {
  return {
    // Map Demographics to database fields
    display_name: profile.demographics?.displayName || null,
    gender: profile.demographics?.biologicalSex || null,

    // Convert age range back to approximate date_of_birth (for analytics only)
    date_of_birth: profile.demographics?.ageRange
      ? approximateBirthDateFromAgeRange(profile.demographics.ageRange)
      : null,

    // Physical attributes (not provided by current app interface)
    avatar_url: null,
    bio: null,
    height_cm: null,
    weight_kg: null,
    activity_level: null,

    // Map health data arrays
    health_goals: profile.healthGoals
      ? [
          profile.healthGoals.primary,
          profile.healthGoals.secondary,
          profile.healthGoals.tertiary,
        ]
          .filter(Boolean)
          .map(goal => goal as string)
      : [],

    medical_conditions: profile.healthConditions?.conditions
      ? profile.healthConditions.conditions.map(condition => condition.name)
      : [],

    allergies: profile.allergiesAndSensitivities?.allergies
      ? profile.allergiesAndSensitivities.allergies.map(allergy => allergy.name)
      : [],

    medications: profile.currentMedications?.medications
      ? profile.currentMedications.medications.map(med => med.name)
      : [],
  };
}

/**
 * Helper function to approximate birth date from age range (for database storage)
 * HIPAA-COMPLIANT: Uses midpoint of age range for anonymization
 */
function approximateBirthDateFromAgeRange(ageRange: string): string | null {
  const currentYear = new Date().getFullYear();
  let approximateAge: number;

  switch (ageRange) {
    case '0-5':
      approximateAge = 3;
      break;
    case '6-12':
      approximateAge = 9;
      break;
    case '13-18':
      approximateAge = 16;
      break;
    case '19-30':
      approximateAge = 25;
      break;
    case '31-50':
      approximateAge = 40;
      break;
    case '51-65':
      approximateAge = 58;
      break;
    case '66+':
      approximateAge = 70;
      break;
    default:
      return null;
  }

  const approximateBirthYear = currentYear - approximateAge;
  return `${approximateBirthYear}-01-01`; // Use January 1st as default
}

/**
 * Create database insert payload from UserProfile item
 * HIPAA-COMPLIANT: Creates complete database record from UserProfile
 */
export function createUserProfileInsertPayload(
  profile: Partial<UserProfile>,
  userId: string,
  timestamp: string
): Partial<DatabaseUserProfile> {
  const dbProfile = transformUserProfileToDb(profile);

  return {
    user_id: userId,
    ...dbProfile,
    created_at: timestamp,
    updated_at: timestamp,
  };
}

/**
 * Create database update payload from UserProfile item
 * HIPAA-COMPLIANT: Maps UserProfile updates to database fields
 */
export function createUserProfileUpdatePayload(
  updates: Partial<UserProfile>,
  timestamp: string
): Partial<DatabaseUserProfile> {
  const dbUpdates = transformUserProfileToDb(updates);

  const payload: Partial<DatabaseUserProfile> = {
    updated_at: timestamp,
  };

  // Only include fields that are being updated (non-null values)
  Object.entries(dbUpdates).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      (payload as any)[key] = value;
    }
  });

  return payload;
}

/**
 * Validate required fields for UserProfile database operations
 * HIPAA-COMPLIANT: Validates UserProfile data before database operations
 */
export function validateUserProfile(profile: Partial<UserProfile>): string[] {
  const errors: string[] = [];

  // Validate Demographics
  if (profile.demographics) {
    const validBiologicalSex = ['male', 'female', 'prefer_not_to_say'];
    if (
      profile.demographics.biologicalSex &&
      !validBiologicalSex.includes(profile.demographics.biologicalSex)
    ) {
      errors.push('Invalid biological sex value');
    }

    const validAgeRanges = [
      'under_18',
      '18-24',
      '25-34',
      '35-44',
      '45-54',
      '55-64',
      '65_plus',
    ];
    if (
      profile.demographics.ageRange &&
      !validAgeRanges.includes(profile.demographics.ageRange)
    ) {
      errors.push('Invalid age range value');
    }
  }

  // Validate Health Goals
  if (profile.healthGoals) {
    const validGoals = [
      'energy_boost',
      'better_sleep',
      'immune_support',
      'heart_health',
      'brain_health',
      'bone_health',
      'manage_diabetes',
      'weight_management',
      'stress_relief',
      'athletic_performance',
      'healthy_aging',
      'digestive_health',
      'muscle_building',
      'joint_health',
      'skin_health',
      'eye_health',
      'liver_health',
      'kidney_health',
      'respiratory_health',
    ];

    if (
      profile.healthGoals.primary &&
      !validGoals.includes(profile.healthGoals.primary)
    ) {
      errors.push('Invalid primary health goal');
    }
  }

  // Validate Health Conditions
  if (profile.healthConditions?.conditions) {
    profile.healthConditions.conditions.forEach((condition, index) => {
      if (!condition.name || condition.name.trim() === '') {
        errors.push(`Health condition ${index + 1} must have a name`);
      }
    });
  }

  // Validate Allergies
  if (profile.allergiesAndSensitivities?.allergies) {
    profile.allergiesAndSensitivities.allergies.forEach((allergy, index) => {
      if (!allergy.name || allergy.name.trim() === '') {
        errors.push(`Allergy ${index + 1} must have a name`);
      }
    });
  }

  return errors;
}

/**
 * Sanitize user profile data before database operations
 * HIPAA-COMPLIANT: Cleans and sanitizes UserProfile data
 */
export function sanitizeUserProfile(
  profile: Partial<UserProfile>
): Partial<UserProfile> {
  const sanitized: Partial<UserProfile> = { ...profile };

  // Sanitize Demographics
  if (sanitized.demographics) {
    sanitized.demographics = {
      ...sanitized.demographics,
      displayName: sanitized.demographics.displayName?.trim() || undefined,
      biologicalSex: sanitized.demographics.biologicalSex?.toLowerCase() as any,
    };
  }

  // Sanitize Health Conditions
  if (sanitized.healthConditions?.conditions) {
    sanitized.healthConditions.conditions =
      sanitized.healthConditions.conditions
        .map(condition => ({
          ...condition,
          name: condition.name.trim(),
          notes: condition.notes?.trim() || undefined,
        }))
        .filter(condition => condition.name.length > 0);
  }

  // Sanitize Allergies
  if (sanitized.allergiesAndSensitivities?.allergies) {
    sanitized.allergiesAndSensitivities.allergies =
      sanitized.allergiesAndSensitivities.allergies
        .map(allergy => ({
          ...allergy,
          name: allergy.name.trim(),
          reaction: allergy.reaction?.trim() || undefined,
        }))
        .filter(allergy => allergy.name.length > 0);
  }

  // Sanitize Current Medications
  if (sanitized.currentMedications?.medications) {
    sanitized.currentMedications.medications =
      sanitized.currentMedications.medications
        .map(medication => ({
          ...medication,
          name: medication.name.trim(),
          genericName: medication.genericName?.trim() || undefined,
          dosage: medication.dosage?.trim() || undefined,
          frequency: medication.frequency?.trim() || undefined,
          prescribedBy: medication.prescribedBy?.trim() || undefined,
          indication: medication.indication?.trim() || undefined,
        }))
        .filter(medication => medication.name.length > 0);
  }

  return sanitized;
}
