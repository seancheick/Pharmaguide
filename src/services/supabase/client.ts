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
    console.warn('⚠️ Supabase storage adapter initialization failed:', error);
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
  const { data, error } = await supabase.functions.invoke(functionName, {
    body,
    headers: options?.headers,
  });
  if (error) throw error;
  return data;
};

export const searchProducts = async query => {
  const { data, error } = await supabase
    .rpc('search_products', { search_query: query })
    .select('id, name')
    .order('rank', { ascending: false })
    .limit(10);
  if (error) throw error;
  return data;
};

export const getProfileSummary = async userId => {
  const { data, error } = await supabase
    .from('user_profile_summary')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error) throw error;
  return data;
};
