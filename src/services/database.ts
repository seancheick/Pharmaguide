// src/services/database.ts

import {
  TABLES,
  RPC_FUNCTIONS,
  STORAGE_BUCKETS,
  Interaction,
  ScanResult,
  DatabaseProduct,
  DatabaseUserStack,
  DatabaseInteraction,
  DatabaseScanHistory,
  CriticalInteractionRule,
  NutrientLimit,
  IncrementPointsResponse,
  UpdateStreakResponse,
} from '../types/database';
import type { Product } from '../types';
import type { UserProfile } from '../types/healthProfile';
import {
  transformDbToUserStack,
  transformDbArrayToUserStack,
  createStackInsertPayload,
  validateStackItem,
  sanitizeStackItem,
  transformDbToProduct,
  createProductInsertPayload,
  validateProduct,
  sanitizeProduct,
  transformDbToScanResult,
  createScanInsertPayload,
  validateScanResult,
  sanitizeScanResult,
  transformDbToUserProfile,
  transformUserProfileToDb,
  createUserProfileInsertPayload,
  createUserProfileUpdatePayload,
  validateUserProfile,
  sanitizeUserProfile,
} from '../utils/databaseTransforms';
import type { UserStack } from '../types';
import { supabase } from './supabase/client';

/**
 * Product Service
 */
export const productService = {
  /**
   * Search products by barcode
   */
  async findByBarcode(barcode: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from(TABLES.PRODUCTS)
      .select('*')
      .eq('barcode', barcode)
      .is('deleted_at', null)
      .single();

    if (error || !data) return null;

    return this.transformProduct(data);
  },

  /**
   * Create a new product
   */
  async create(product: Partial<Product>): Promise<Product | null> {
    // Sanitize and validate input
    const sanitizedProduct = sanitizeProduct(product);
    const validationErrors = validateProduct(sanitizedProduct);
    if (validationErrors.length > 0) {
      console.error('Product validation failed:', validationErrors);
      return null;
    }

    const timestamp = new Date().toISOString();

    // Use centralized transformation for database insert
    const dbPayload = createProductInsertPayload(sanitizedProduct, timestamp);

    const { data, error } = await supabase
      .from(TABLES.PRODUCTS)
      .insert(dbPayload)
      .select()
      .single();

    if (error || !data) return null;

    // Use centralized transformation for response
    return transformDbToProduct(data);
  },

  /**
   * Transform database product to app format
   * @deprecated Use transformDbToProduct from databaseTransforms instead
   */
  transformProduct(dbProduct: DatabaseProduct): Product {
    // Use centralized transformation but handle type differences
    return transformDbToProduct(dbProduct) as Product;
  },
};

/**
 * User Stack Service
 */
export const stackService = {
  /**
   * Get user's active stack
   */
  async getUserStack(userId: string): Promise<UserStack[]> {
    const { data, error } = await supabase
      .from(TABLES.USER_STACK)
      .select('*')
      .eq('user_id', userId)
      .eq('active', true)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    // Use centralized transformation
    return transformDbArrayToUserStack(data);
  },

  /**
   * Add item to stack
   */
  async addToStack(
    userId: string,
    item: Partial<UserStack>
  ): Promise<UserStack | null> {
    // Sanitize and validate input
    const sanitizedItem = sanitizeStackItem(item);
    const validationErrors = validateStackItem(sanitizedItem);
    if (validationErrors.length > 0) {
      console.error('Validation failed:', validationErrors);
      return null;
    }

    const timestamp = new Date().toISOString();

    // Use centralized transformation for database insert
    const dbPayload = createStackInsertPayload(
      sanitizedItem,
      userId,
      timestamp
    );

    const { data, error } = await supabase
      .from(TABLES.USER_STACK)
      .insert(dbPayload)
      .select()
      .single();

    if (error || !data) return null;

    // Award points for adding to stack
    await pointsService.awardPoints(userId, 10, 'stack_item_added');

    // Use centralized transformation for response
    return transformDbToUserStack(data);
  },

  /**
   * Remove item from stack (soft delete)
   */
  async removeFromStack(userId: string, itemId: string): Promise<boolean> {
    const { error } = await supabase
      .from(TABLES.USER_STACK)
      .update({
        active: false,
        deleted_at: new Date().toISOString(),
      })
      .eq('id', itemId)
      .eq('user_id', userId);

    return !error;
  },

  // Legacy transformStackItem removed - now using centralized transformations
};

/**
 * Interactions Service (Hybrid: Legacy + Critical Rules)
 */
export const interactionService = {
  /**
   * Check interactions between two items (Legacy system)
   */
  async checkInteraction(
    item1Id: string,
    item2Id: string
  ): Promise<Interaction | null> {
    const { data, error } = await supabase
      .from(TABLES.INTERACTIONS)
      .select('*')
      .or(`item1_id.eq.${item1Id},item1_id.eq.${item2Id}`)
      .or(`item2_id.eq.${item1Id},item2_id.eq.${item2Id}`)
      .is('deleted_at', null)
      .single();

    if (error || !data) return null;

    return this.transformInteraction(data);
  },

  /**
   * Get all interactions for a product (Legacy system)
   */
  async getProductInteractions(productId: string): Promise<Interaction[]> {
    const { data, error } = await supabase
      .from(TABLES.INTERACTIONS)
      .select('*')
      .or(`item1_id.eq.${productId},item2_id.eq.${productId}`)
      .is('deleted_at', null);

    if (error || !data) return [];

    return data.map(this.transformInteraction);
  },

  /**
   * Check critical interaction rules by substance names (NEW system)
   */
  async checkCriticalInteractionRules(
    item1Type: string,
    item1Name: string,
    item2Type: string,
    item2Name: string
  ): Promise<CriticalInteractionRule[]> {
    const { data, error } = await supabase
      .from('critical_interaction_rules')
      .select(
        `
        *,
        interaction_sources (
          source_type,
          source_name,
          source_url,
          confidence_score
        )
      `
      )
      .eq('active', true)
      .or(
        `and(item1_type.eq.${item1Type},item1_identifier.ilike.%${item1Name}%,item2_type.eq.${item2Type},item2_identifier.ilike.%${item2Name}%),` +
          `and(item1_type.eq.${item2Type},item1_identifier.ilike.%${item2Name}%,item2_type.eq.${item1Type},item2_identifier.ilike.%${item1Name}%)`
      );

    if (error) {
      console.error('Error checking critical interaction rules:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Get all critical interactions for a substance
   */
  async getCriticalInteractionsForSubstance(
    itemType: string,
    itemName: string
  ): Promise<CriticalInteractionRule[]> {
    const { data, error } = await supabase
      .from('critical_interaction_rules')
      .select('*')
      .eq('active', true)
      .or(
        `and(item1_type.eq.${itemType},item1_identifier.ilike.%${itemName}%),` +
          `and(item2_type.eq.${itemType},item2_identifier.ilike.%${itemName}%)`
      );

    if (error) {
      console.error('Error getting critical interactions:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Get nutrient upper limits
   */
  async getNutrientLimits(nutrientName?: string): Promise<NutrientLimit[]> {
    let query = supabase.from('nutrient_limits').select('*');

    if (nutrientName) {
      query = query.ilike('nutrient_name', `%${nutrientName}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error getting nutrient limits:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Transform database interaction to app format (Legacy)
   */
  transformInteraction(dbInteraction: DatabaseInteraction): Interaction {
    return {
      id: dbInteraction.id,
      item1Id: dbInteraction.item1_id,
      item2Id: dbInteraction.item2_id,
      severity: dbInteraction.severity || 'LOW',
      mechanism: dbInteraction.mechanism || '',
      evidence: dbInteraction.evidence || '',
    };
  },

  /**
   * Transform critical interaction rule to app format (NEW)
   */
  transformCriticalInteractionRule(rule: any): CriticalInteractionRule {
    return {
      id: rule.id,
      item1Type: rule.item1_type,
      item1Identifier: rule.item1_identifier,
      item2Type: rule.item2_type,
      item2Identifier: rule.item2_identifier,
      severity: rule.severity,
      mechanism: rule.mechanism,
      clinicalSignificance: rule.clinical_significance,
      recommendation: rule.recommendation,
      contraindicated: rule.contraindicated,
      monitoringRequired: rule.monitoring_required,
      source: rule.source,
      evidenceQuality: rule.evidence_quality,
      sources: rule.interaction_sources || [],
    };
  },
};

/**
 * Scan History Service
 */
export const scanService = {
  /**
   * Record a scan
   */
  async recordScan(
    userId: string | null,
    productId: string | null,
    scanType: string,
    analysisScore: number
  ): Promise<ScanResult | null> {
    // Create scan data and validate
    const scanData: Partial<ScanResult> = {
      productId,
      scanType: scanType as ScanResult['scanType'],
      analysisScore,
      scannedAt: new Date().toISOString(),
    };

    const sanitizedScan = sanitizeScanResult(scanData);
    const validationErrors = validateScanResult(sanitizedScan);
    if (validationErrors.length > 0) {
      console.error('Scan validation failed:', validationErrors);
      return null;
    }

    const timestamp = new Date().toISOString();

    // Use centralized transformation for database insert
    const dbPayload = createScanInsertPayload(sanitizedScan, userId, timestamp);

    const { data, error } = await supabase
      .from(TABLES.SCAN_HISTORY)
      .insert(dbPayload)
      .select(
        `
        *,
        product:${TABLES.PRODUCTS}(*)
      `
      )
      .single();

    if (error || !data) return null;

    // Award points and update streak if user is logged in
    if (userId) {
      await pointsService.awardPoints(userId, 5, 'product_scanned');
      await streakService.updateStreak(userId);
    }

    return this.transformScanResult(data);
  },

  /**
   * Get user's scan history
   */
  async getUserScanHistory(userId: string, limit = 20): Promise<ScanResult[]> {
    const { data, error } = await supabase
      .from(TABLES.SCAN_HISTORY)
      .select(
        `
        *,
        product:${TABLES.PRODUCTS}(*)
      `
      )
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('scanned_at', { ascending: false })
      .limit(limit);

    if (error || !data) return [];

    return data.map(this.transformScanResult);
  },

  /**
   * Transform database scan to app format
   * @deprecated Use transformDbToScanResult from databaseTransforms instead
   */
  transformScanResult(dbScan: any): ScanResult {
    // Use centralized transformation
    const scanResult = transformDbToScanResult(dbScan);

    // Add product if available
    if (dbScan.product) {
      scanResult.product = productService.transformProduct(
        dbScan.product
      ) as any;
    }

    return scanResult;
  },
};

/**
 * User Profile Service (HIPAA-Compliant)
 * Handles anonymized user profile data in Supabase
 */
// All user profile/health profile data is now local-only. No Supabase sync or remote storage.
// Use localHealthProfileService and useHealthProfile for all profile operations.

/**
 * Points Service
 */
export const pointsService = {
  /**
   * Award points to user
   */
  async awardPoints(
    userId: string,
    points: number,
    reason: string,
    metadata?: Record<string, any>
  ): Promise<IncrementPointsResponse | null> {
    const { data, error } = await supabase.rpc(RPC_FUNCTIONS.INCREMENT_POINTS, {
      p_user_id: userId,
      p_points: points,
      p_reason: reason,
      p_metadata: metadata || null,
    });

    if (error) {
      console.error('Error awarding points:', error);
      return null;
    }

    return data as IncrementPointsResponse;
  },
};

/**
 * Streak Service
 */
export const streakService = {
  /**
   * Update user's streak
   */
  async updateStreak(userId: string): Promise<UpdateStreakResponse | null> {
    const { data, error } = await supabase.rpc(RPC_FUNCTIONS.UPDATE_STREAK, {
      p_user_id: userId,
    });

    if (error) {
      console.error('Error updating streak:', error);
      return null;
    }

    return data as UpdateStreakResponse;
  },
};

/**
 * Storage Service
 */
export const storageService = {
  /**
   * Upload product image
   */
  async uploadProductImage(
    file: File | Blob,
    filename: string
  ): Promise<string | null> {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKETS.PRODUCT_IMAGES)
      .upload(filename, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.error('Error uploading image:', error);
      return null;
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage
      .from(STORAGE_BUCKETS.PRODUCT_IMAGES)
      .getPublicUrl(data.path);

    return publicUrl;
  },

  /**
   * Upload user file (private)
   */
  async uploadUserFile(
    userId: string,
    file: File | Blob,
    filename: string
  ): Promise<string | null> {
    const path = `${userId}/${filename}`;

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKETS.USER_UPLOADS)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.error('Error uploading file:', error);
      return null;
    }

    return data.path;
  },

  /**
   * Get signed URL for private file
   */
  async getSignedUrl(
    bucket: string,
    path: string,
    expiresIn = 3600
  ): Promise<string | null> {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      console.error('Error creating signed URL:', error);
      return null;
    }

    return data.signedUrl;
  },
};
