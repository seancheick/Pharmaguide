// src/constants/storage.ts

export const STORAGE_KEYS = {
  // User related
  USER_DATA: "pharmaguide_user_data",
  USER_PROFILE: "pharmaguide_user_profile",
  LOCAL_USER: "pharmaguide_local_user",
  CURRENT_USER_ID: "pharmaguide_current_user_id",

  // App data
  USER_STACK: "pharmaguide_user_stack",
  RECENT_SCANS: "pharmaguide_recent_scans",
  USER_STREAK: "pharmaguide_user_streak",
  USER_POINTS: "pharmaguide_user_points",
  USER_PROGRESS: "pharmaguide_user_progress",

  // Chat
  CHAT_SESSION: "pharmaguide_chat_session",
  CHAT_HISTORY: "pharmaguide_chat_history",

  // Cache
  AI_CACHE_PREFIX: "pharmaguide_ai_cache_",
  PRODUCT_CACHE_PREFIX: "pharmaguide_product_",
} as const;

// Helper functions
export const getNamespacedKey = (
  key: keyof typeof STORAGE_KEYS,
  suffix?: string
): string => {
  const baseKey = STORAGE_KEYS[key];
  return suffix ? `${baseKey}_${suffix.replace(/[@#$%^&*()]/g, "_")}` : baseKey;
};

// Usage example:
// const userStackKey = getNamespacedKey('USER_STACK');
// const userChatKey = getNamespacedKey('CHAT_SESSION', userId);
