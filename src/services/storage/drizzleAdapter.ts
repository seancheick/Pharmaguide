// src/services/storage/drizzleAdapter.ts
// Drizzle ORM adapter for structured data storage

import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite/next';
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import { performanceMonitor } from '../performance/performanceMonitor';
import * as schema from './schema';

export class DrizzleAdapter {
  private static instance: DrizzleAdapter;
  private db: any;
  private isInitialized = false;

  static getInstance(): DrizzleAdapter {
    if (!DrizzleAdapter.instance) {
      DrizzleAdapter.instance = new DrizzleAdapter();
    }
    return DrizzleAdapter.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Open SQLite database
      const expo = openDatabaseSync('pharmaguide.db');
      this.db = drizzle(expo, { schema });

      // Run migrations
      await migrate(this.db, { migrationsFolder: './drizzle/migrations' });

      this.isInitialized = true;
      console.log('✅ Drizzle ORM initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Drizzle ORM:', error);
      throw error;
    }
  }

  // User Stack Operations
  async getUserStack(userId: string) {
    return await performanceMonitor.measureAsync(
      'drizzle_get_user_stack',
      async () => {
        return await this.db.select().from(schema.userStacks)
          .where(schema.userStacks.userId.eq(userId))
          .orderBy(schema.userStacks.createdAt.desc());
      },
      'database'
    );
  }

  async addStackItem(stackItem: any) {
    return await performanceMonitor.measureAsync(
      'drizzle_add_stack_item',
      async () => {
        return await this.db.insert(schema.userStacks).values(stackItem);
      },
      'database'
    );
  }

  async updateStackItem(id: string, updates: any) {
    return await performanceMonitor.measureAsync(
      'drizzle_update_stack_item',
      async () => {
        return await this.db.update(schema.userStacks)
          .set(updates)
          .where(schema.userStacks.id.eq(id));
      },
      'database'
    );
  }

  async deleteStackItem(id: string) {
    return await performanceMonitor.measureAsync(
      'drizzle_delete_stack_item',
      async () => {
        return await this.db.delete(schema.userStacks)
          .where(schema.userStacks.id.eq(id));
      },
      'database'
    );
  }

  // Product Operations
  async getProduct(barcode: string) {
    return await this.db.select().from(schema.products)
      .where(schema.products.barcode.eq(barcode))
      .limit(1);
  }

  async cacheProduct(product: any) {
    return await this.db.insert(schema.products)
      .values(product)
      .onConflictDoUpdate({
        target: schema.products.barcode,
        set: product,
      });
  }

  // Interaction Operations
  async getInteractions(supplementIds: string[]) {
    return await this.db.select().from(schema.interactions)
      .where(schema.interactions.supplement1.in(supplementIds))
      .or(schema.interactions.supplement2.in(supplementIds));
  }

  // Analytics Operations
  async logEvent(event: any) {
    return await this.db.insert(schema.analyticsEvents).values(event);
  }

  async getAnalytics(userId: string, startDate: Date, endDate: Date) {
    return await this.db.select().from(schema.analyticsEvents)
      .where(
        schema.analyticsEvents.userId.eq(userId)
          .and(schema.analyticsEvents.timestamp.gte(startDate))
          .and(schema.analyticsEvents.timestamp.lte(endDate))
      );
  }

  // Health Profile Operations
  async saveHealthProfile(profile: any) {
    return await this.db.insert(schema.healthProfiles)
      .values(profile)
      .onConflictDoUpdate({
        target: schema.healthProfiles.userId,
        set: profile,
      });
  }

  async getHealthProfile(userId: string) {
    return await this.db.select().from(schema.healthProfiles)
      .where(schema.healthProfiles.userId.eq(userId))
      .limit(1);
  }

  // Utility methods
  async executeRaw(sql: string, params?: any[]) {
    return await this.db.run(sql, params);
  }

  async transaction<T>(callback: (tx: any) => Promise<T>): Promise<T> {
    return await this.db.transaction(callback);
  }

  async close(): Promise<void> {
    // Expo SQLite handles connection management
    this.isInitialized = false;
  }
}

export const drizzleAdapter = DrizzleAdapter.getInstance();
