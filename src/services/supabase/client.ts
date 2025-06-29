// src/services/supabase/client.ts

import { createClient } from '@supabase/supabase-js';
import { storageAdapter } from '../storage/storageAdapter';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase URL and Anon Key must be defined in environment variables'
  );
}

const initializeSupabaseStorage = async () => {
  try {
    await storageAdapter.initialize();
    console.log('✅ Supabase storage adapter initialized');
  } catch (error) {
    console.error('❌ Critical: Supabase storage adapter initialization failed:', error);
    // Don't throw here as it could prevent app startup
    // Instead, the storage adapter should handle fallbacks gracefully
  }
};

initializeSupabaseStorage();

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export const callEdgeFunction = async (
  functionName: string,
  body?: any,
  options?: { headers?: Record<string, string> }
) => {
  try {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body,
      headers: options?.headers,
    });
    
    if (error) {
      console.error(`❌ Edge function ${functionName} error:`, error);
      throw new Error(`Failed to call ${functionName}: ${error.message}`);
    }
    
    return data;
  } catch (error) {
    console.error(`❌ Critical error calling edge function ${functionName}:`, error);
    throw new Error(`Service temporarily unavailable. Please try again later.`);
  }
};

export const searchProducts = async (query: string) => {
  try {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .rpc('search_products', { search_query: query })
      .select('id, name')
      .order('rank', { ascending: false })
      .limit(10);
      
    if (error) {
      console.error('❌ Product search error:', error);
      throw new Error('Failed to search products. Please try again.');
    }
    
    return data || [];
  } catch (error) {
    console.error('❌ Critical error during product search:', error);
    // Return empty array instead of crashing the search feature
    return [];
  }
};

export const getProfileSummary = async (userId: string) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const { data, error } = await supabase
      .from('user_profile_summary')
      .select('*')
      .eq('user_id', userId)
      .single();
      
    if (error) {
      console.error('❌ Profile summary fetch error:', error);
      
      // Handle specific error cases
      if (error.code === 'PGRST116') {
        // No rows returned - user profile doesn't exist yet
        return null;
      }
      
      throw new Error('Failed to load profile summary. Please try again.');
    }
    
    return data;
  } catch (error) {
    console.error('❌ Critical error fetching profile summary:', error);
    // For profile data, return null instead of crashing
    // The UI should handle missing profile gracefully
    return null;
  }
};
