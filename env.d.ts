// env.d.ts
// Place this in your project root

declare module '@env' {
  // API Keys
  export const USDA_API_KEY: string;
  export const PUBMED_API_KEY: string;
  export const DSLD_API_KEY: string;
  export const FDA_API_KEY: string;
  export const FOODREPO_API_KEY: string;
  
  // Base URLs (optional, but good practice)
  export const USDA_BASE_URL: string;
  export const PUBMED_BASE_URL: string;
  export const DSLD_BASE_URL: string;
  export const FDA_BASE_URL: string;
  export const FOODREPO_BASE_URL: string;
  
  // Future API keys
  export const GROQ_API_KEY: string;
  export const OPENAI_API_KEY: string;
  export const SUPABASE_URL: string;
  export const SUPABASE_ANON_KEY: string;
}