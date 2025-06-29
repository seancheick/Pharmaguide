import { supabase } from '../supabase/client';
import { logger } from '../monitoring/logger';

export class SupabaseStorage {
  async getItem(key: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('app_storage')
        .select('value')
        .eq('key', key)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned - key doesn't exist
          return null;
        }
        throw error;
      }

      return data?.value || null;
    } catch (error) {
      logger.error('database', `Failed to get item from Supabase storage: ${key}`, error as Error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('app_storage')
        .upsert({
          key,
          value,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
    } catch (error) {
      logger.error('database', `Failed to set item in Supabase storage: ${key}`, error as Error);
      throw error;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('app_storage')
        .delete()
        .eq('key', key);

      if (error) throw error;
    } catch (error) {
      logger.error('database', `Failed to remove item from Supabase storage: ${key}`, error as Error);
      throw error;
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('app_storage')
        .select('key');

      if (error) throw error;

      return data?.map(item => item.key) || [];
    } catch (error) {
      logger.error('database', 'Failed to get all keys from Supabase storage', error as Error);
      return [];
    }
  }

  async clear(): Promise<void> {
    try {
      const { error } = await supabase
        .from('app_storage')
        .delete()
        .neq('key', ''); // Delete all rows

      if (error) throw error;
    } catch (error) {
      logger.error('database', 'Failed to clear Supabase storage', error as Error);
      throw error;
    }
  }
}

// Export singleton instance
export const supabaseStorage = new SupabaseStorage(); 