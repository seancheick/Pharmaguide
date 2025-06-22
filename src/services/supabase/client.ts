// src/services/supabase/client.ts
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Temporary hardcoded values to fix the app
const supabaseUrl = 'https://myxpwegapxhcodcipyxu.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15eHB3ZWdhcHhoY29kY2lweXh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0ODIyMjEsImV4cCI6MjA2NTA1ODIyMX0.Ik5kKxOfcVF9W155uc3V1LyxAGXYj_AZjiu5IhaGXIo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Helper function to call Edge Functions
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
