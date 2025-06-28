// src/utils/dataMigration.ts
/**
 * Data migration utilities for database schema changes
 * Helps migrate existing data to new enhanced schema
 */

import { supabase } from '../services/supabase/client';
import {
  transformDbToProduct,
  transformProductToDb,
  transformDbToUserProfile,
  transformUserProfileToDb,
} from './databaseTransforms';

interface MigrationResult {
  success: boolean;
  migratedCount: number;
  errors: string[];
  skippedCount: number;
}

/**
 * Migration utilities for Phase 3 database enhancements
 */
export class DataMigrationService {
  /**
   * Migrate products to new schema with enhanced fields
   */
  async migrateProductsToEnhancedSchema(): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: true,
      migratedCount: 0,
      errors: [],
      skippedCount: 0,
    };

    try {
      console.log('🔄 Starting product migration to enhanced schema...');

      // Get all products that might need migration
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .is('deleted_at', null);

      if (error) {
        result.success = false;
        result.errors.push(`Failed to fetch products: ${error.message}`);
        return result;
      }

      if (!products || products.length === 0) {
        console.log('✅ No products found to migrate');
        return result;
      }

      console.log(`📊 Found ${products.length} products to check for migration`);

      for (const product of products) {
        try {
          // Check if product needs migration (missing new fields)
          const needsMigration = this.productNeedsMigration(product);
          
          if (!needsMigration) {
            result.skippedCount++;
            continue;
          }

          // Transform through our centralized system to ensure consistency
          const appProduct = transformDbToProduct(product);
          const migratedDbProduct = transformProductToDb(appProduct);

          // Update with enhanced fields
          const { error: updateError } = await supabase
            .from('products')
            .update({
              ...migratedDbProduct,
              updated_at: new Date().toISOString(),
            })
            .eq('id', product.id);

          if (updateError) {
            result.errors.push(`Failed to migrate product ${product.id}: ${updateError.message}`);
            continue;
          }

          result.migratedCount++;
          
          if (result.migratedCount % 10 === 0) {
            console.log(`📈 Migrated ${result.migratedCount} products...`);
          }

        } catch (error) {
          result.errors.push(`Error processing product ${product.id}: ${error}`);
        }
      }

      console.log(`✅ Product migration complete: ${result.migratedCount} migrated, ${result.skippedCount} skipped`);
      
      if (result.errors.length > 0) {
        console.warn(`⚠️ Migration completed with ${result.errors.length} errors`);
        result.success = false;
      }

    } catch (error) {
      result.success = false;
      result.errors.push(`Migration failed: ${error}`);
      console.error('❌ Product migration failed:', error);
    }

    return result;
  }

  /**
   * Migrate user profiles to new schema with enhanced fields
   */
  async migrateUserProfilesToEnhancedSchema(): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: true,
      migratedCount: 0,
      errors: [],
      skippedCount: 0,
    };

    try {
      console.log('🔄 Starting user profile migration to enhanced schema...');

      // Get all user profiles that might need migration
      const { data: profiles, error } = await supabase
        .from('user_profiles')
        .select('*')
        .is('deleted_at', null);

      if (error) {
        result.success = false;
        result.errors.push(`Failed to fetch user profiles: ${error.message}`);
        return result;
      }

      if (!profiles || profiles.length === 0) {
        console.log('✅ No user profiles found to migrate');
        return result;
      }

      console.log(`📊 Found ${profiles.length} user profiles to check for migration`);

      for (const profile of profiles) {
        try {
          // Check if profile needs migration
          const needsMigration = this.userProfileNeedsMigration(profile);
          
          if (!needsMigration) {
            result.skippedCount++;
            continue;
          }

          // Transform through our centralized system to ensure consistency
          const appProfile = transformDbToUserProfile(profile);
          const migratedDbProfile = transformUserProfileToDb(appProfile);

          // Update with enhanced fields
          const { error: updateError } = await supabase
            .from('user_profiles')
            .update({
              ...migratedDbProfile,
              updated_at: new Date().toISOString(),
            })
            .eq('id', profile.id);

          if (updateError) {
            result.errors.push(`Failed to migrate profile ${profile.id}: ${updateError.message}`);
            continue;
          }

          result.migratedCount++;

        } catch (error) {
          result.errors.push(`Error processing profile ${profile.id}: ${error}`);
        }
      }

      console.log(`✅ User profile migration complete: ${result.migratedCount} migrated, ${result.skippedCount} skipped`);
      
      if (result.errors.length > 0) {
        console.warn(`⚠️ Migration completed with ${result.errors.length} errors`);
        result.success = false;
      }

    } catch (error) {
      result.success = false;
      result.errors.push(`Migration failed: ${error}`);
      console.error('❌ User profile migration failed:', error);
    }

    return result;
  }

  /**
   * Run all migrations
   */
  async runAllMigrations(): Promise<{
    products: MigrationResult;
    userProfiles: MigrationResult;
    overall: boolean;
  }> {
    console.log('🚀 Starting comprehensive data migration...');

    const products = await this.migrateProductsToEnhancedSchema();
    const userProfiles = await this.migrateUserProfilesToEnhancedSchema();

    const overall = products.success && userProfiles.success;

    console.log('📋 Migration Summary:');
    console.log(`  Products: ${products.migratedCount} migrated, ${products.skippedCount} skipped, ${products.errors.length} errors`);
    console.log(`  User Profiles: ${userProfiles.migratedCount} migrated, ${userProfiles.skippedCount} skipped, ${userProfiles.errors.length} errors`);
    console.log(`  Overall Status: ${overall ? '✅ SUCCESS' : '❌ FAILED'}`);

    return { products, userProfiles, overall };
  }

  /**
   * Check if a product needs migration to new schema
   */
  private productNeedsMigration(product: any): boolean {
    // Check if new fields are missing or null
    return (
      product.generic_name === undefined ||
      product.manufacturer === undefined ||
      product.dosage_form === undefined ||
      product.strength === undefined ||
      product.active_ingredients === undefined ||
      product.inactive_ingredients === undefined ||
      product.fda_approved === undefined ||
      product.otc_status === undefined ||
      product.warnings === undefined
    );
  }

  /**
   * Check if a user profile needs migration to new schema
   */
  private userProfileNeedsMigration(profile: any): boolean {
    // Check if the profile has old field structure or missing new fields
    return (
      profile.first_name !== undefined || // Old field structure
      profile.last_name !== undefined ||  // Old field structure
      profile.age !== undefined ||        // Old field structure
      profile.display_name === undefined ||
      profile.medical_conditions === undefined ||
      !Array.isArray(profile.health_goals)
    );
  }

  /**
   * Validate migration results
   */
  async validateMigration(): Promise<{
    products: { total: number; enhanced: number; percentage: number };
    userProfiles: { total: number; enhanced: number; percentage: number };
  }> {
    console.log('🔍 Validating migration results...');

    // Check products
    const { data: allProducts } = await supabase
      .from('products')
      .select('id, generic_name, manufacturer, fda_approved')
      .is('deleted_at', null);

    const enhancedProducts = allProducts?.filter(p => 
      p.generic_name !== null || p.manufacturer !== null || p.fda_approved !== null
    ).length || 0;

    // Check user profiles
    const { data: allProfiles } = await supabase
      .from('user_profiles')
      .select('id, display_name, medical_conditions, health_goals')
      .is('deleted_at', null);

    const enhancedProfiles = allProfiles?.filter(p => 
      p.display_name !== null || Array.isArray(p.medical_conditions) || Array.isArray(p.health_goals)
    ).length || 0;

    const results = {
      products: {
        total: allProducts?.length || 0,
        enhanced: enhancedProducts,
        percentage: allProducts?.length ? Math.round((enhancedProducts / allProducts.length) * 100) : 0,
      },
      userProfiles: {
        total: allProfiles?.length || 0,
        enhanced: enhancedProfiles,
        percentage: allProfiles?.length ? Math.round((enhancedProfiles / allProfiles.length) * 100) : 0,
      },
    };

    console.log('📊 Migration Validation Results:');
    console.log(`  Products: ${results.products.enhanced}/${results.products.total} (${results.products.percentage}%) enhanced`);
    console.log(`  User Profiles: ${results.userProfiles.enhanced}/${results.userProfiles.total} (${results.userProfiles.percentage}%) enhanced`);

    return results;
  }
}

// Export singleton instance
export const dataMigrationService = new DataMigrationService();
