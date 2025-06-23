// src/services/database.ts

import { supabase } from './supabase/client';
import {
  TABLES,
  RPC_FUNCTIONS,
  STORAGE_BUCKETS,
  Product,
  StackItem,
  Interaction,
  ScanResult,
  DatabaseProduct,
  DatabaseUserStack,
  DatabaseInteraction,
  DatabaseScanHistory,
  IncrementPointsResponse,
  UpdateStreakResponse,
} from '@/types/database';

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
    const { data, error } = await supabase
      .from(TABLES.PRODUCTS)
      .insert({
        barcode: product.barcode,
        name: product.name!,
        brand: product.brand,
        category: product.category,
        image_url: product.imageUrl,
        ingredients: product.ingredients,
        verified: false,
      })
      .select()
      .single();

    if (error || !data) return null;

    return this.transformProduct(data);
  },

  /**
   * Transform database product to app format
   */
  transformProduct(dbProduct: DatabaseProduct): Product {
    return {
      id: dbProduct.id,
      barcode: dbProduct.barcode,
      name: dbProduct.name,
      brand: dbProduct.brand,
      category: dbProduct.category,
      imageUrl: dbProduct.image_url,
      ingredients: dbProduct.ingredients || [],
      verified: dbProduct.verified,
      createdAt: dbProduct.created_at,
      updatedAt: dbProduct.updated_at,
    };
  },
};

/**
 * User Stack Service
 */
export const stackService = {
  /**
   * Get user's active stack
   */
  async getUserStack(userId: string): Promise<StackItem[]> {
    const { data, error } = await supabase
      .from(TABLES.USER_STACK)
      .select('*')
      .eq('user_id', userId)
      .eq('active', true)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map(this.transformStackItem);
  },

  /**
   * Add item to stack
   */
  async addToStack(
    userId: string,
    item: Partial<StackItem>
  ): Promise<StackItem | null> {
    const { data, error } = await supabase
      .from(TABLES.USER_STACK)
      .insert({
        user_id: userId,
        item_id: item.itemId,
        name: item.name,
        type: item.type,
        dosage: item.dosage,
        frequency: item.frequency,
        brand: item.brand,
        image_url: item.imageUrl,
        ingredients: item.ingredients,
      })
      .select()
      .single();

    if (error || !data) return null;

    // Award points for adding to stack
    await pointsService.awardPoints(userId, 10, 'stack_item_added');

    return this.transformStackItem(data);
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

  /**
   * Transform database stack item to app format
   */
  transformStackItem(dbItem: DatabaseUserStack): StackItem {
    return {
      id: dbItem.id,
      itemId: dbItem.item_id,
      name: dbItem.name || '',
      type: dbItem.type || 'supplement',
      dosage: dbItem.dosage,
      frequency: dbItem.frequency,
      active: dbItem.active,
      brand: dbItem.brand,
      imageUrl: dbItem.image_url,
      ingredients: dbItem.ingredients || [],
      createdAt: dbItem.created_at,
      updatedAt: dbItem.updated_at,
    };
  },
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
    const { data, error } = await supabase
      .from(TABLES.SCAN_HISTORY)
      .insert({
        user_id: userId,
        product_id: productId,
        scan_type: scanType,
        analysis_score: analysisScore,
      })
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
   */
  transformScanResult(dbScan: any): ScanResult {
    return {
      id: dbScan.id,
      productId: dbScan.product_id,
      product: dbScan.product
        ? productService.transformProduct(dbScan.product)
        : undefined,
      scanType: dbScan.scan_type || 'barcode',
      analysisScore: dbScan.analysis_score || 0,
      scannedAt: dbScan.scanned_at,
    };
  },
};

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
