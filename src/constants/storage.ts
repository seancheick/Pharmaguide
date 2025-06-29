// src/constants/storage.ts

export const STORAGE_KEYS = {
  // User related
  USER_TOKEN: '@pharmaguide_user_token',
  USER_PROFILE: '@pharmaguide_user_profile',
  USER_DATA: '@pharmaguide_user_data',
  LOCAL_USER: '@pharmaguide_local_user',
  CURRENT_USER_ID: '@pharmaguide_current_user_id',

  // App data
  USER_STACK: '@pharmaguide_user_stack',
  RECENT_SCANS: '@pharmaguide_recent_scans',
  SCAN_HISTORY: '@pharmaguide_scan_history',
  USER_STREAK: '@pharmaguide_user_streak',
  USER_POINTS: '@pharmaguide_user_points',
  USER_PROGRESS: '@pharmaguide_user_progress',
  PREFERENCES: '@pharmaguide_preferences',
  GAMIFICATION_DATA: '@pharmaguide_gamification_data',

  // Chat
  CHAT_SESSION: '@pharmaguide_chat_session',
  CHAT_HISTORY: '@pharmaguide_chat_history',

  // Cache
  CACHE_PREFIX: '@pharmaguide_cache_',
  AI_CACHE_PREFIX: '@pharmaguide_ai_cache_',
  PRODUCT_CACHE_PREFIX: '@pharmaguide_product_',

  // App state
  APP_INITIALIZED: '@pharmaguide_app_initialized',
  DAILY_CHALLENGE_STATUS: '@pharmaguide_daily_challenge_status',

  // Health Profile Setup
  SETUP_PROGRESS: 'health_profile_setup_progress',
  SETUP_DATA: 'health_profile_setup_data',
  CONSENTS: 'health_profile_consents',

  // Search
  RECENT_SEARCHES: '@pharmaguide_recent_searches',
} as const;

// Helper functions
export const getNamespacedKey = (
  key: keyof typeof STORAGE_KEYS,
  suffix?: string
): string => {
  const baseKey = STORAGE_KEYS[key];
  return suffix ? `${baseKey}_${suffix.replace(/[@#$%^&*()]/g, '_')}` : baseKey;
};

// Usage example:
// const userStackKey = getNamespacedKey('USER_STACK');
// const userChatKey = getNamespacedKey('CHAT_SESSION', userId);
