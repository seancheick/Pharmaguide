// src/config/deepLinkingConfig.ts
// Deep linking configuration for PharmaGuide

import { DeepLinkConfig } from '../services/navigation/deepLinkingService';
import { DeepLinkValidators } from '../services/navigation/deepLinkingService';

/**
 * PharmaGuide Deep Linking Configuration
 */
export const pharmaGuideDeepLinkConfig: DeepLinkConfig = {
  scheme: 'pharmaguide',
  prefixes: [
    'https://pharmaguide.app',
    'https://www.pharmaguide.app',
  ],
  fallbackRoute: 'Home',
  enableLogging: __DEV__,
  routes: {
    // Home screen
    home: {
      path: '/',
      screen: 'Home',
      requiresAuth: false,
    },

    // Product scanning
    scan: {
      path: '/scan',
      screen: 'Scan',
      requiresAuth: false,
    },

    // Product details by barcode
    product: {
      path: '/product/:barcode',
      screen: 'ProductAnalysisResults',
      requiresAuth: false,
      validator: DeepLinkValidators.combine(
        (params) => DeepLinkValidators.required(params, ['barcode']),
        (params) => DeepLinkValidators.patterns(params, {
          barcode: /^[0-9]{8,14}$/, // UPC/EAN barcode format
        }),
        DeepLinkValidators.sanitize
      ),
      transformer: (params) => ({
        ...params,
        barcode: params.barcode.toString(),
      }),
    },

    // Product search results
    search: {
      path: '/search',
      screen: 'ProductSearch',
      requiresAuth: false,
      validator: DeepLinkValidators.combine(
        (params) => {
          if (params.q && typeof params.q === 'string' && params.q.length > 100) {
            return {
              isValid: false,
              error: 'Search query too long',
            };
          }
          return { isValid: true };
        },
        DeepLinkValidators.sanitize
      ),
    },

    // User stack
    stack: {
      path: '/stack',
      screen: 'Stack',
      requiresAuth: true,
    },

    // Shared stack
    sharedStack: {
      path: '/stack/shared/:shareId',
      screen: 'SharedStack',
      requiresAuth: false,
      validator: DeepLinkValidators.combine(
        (params) => DeepLinkValidators.required(params, ['shareId']),
        (params) => DeepLinkValidators.patterns(params, {
          shareId: /^[a-zA-Z0-9_-]{8,32}$/, // Share ID format
        }),
        DeepLinkValidators.sanitize
      ),
    },

    // Profile screens
    profile: {
      path: '/profile',
      screen: 'Profile',
      requiresAuth: true,
    },

    healthProfile: {
      path: '/profile/health',
      screen: 'NewHealthProfileSetup',
      requiresAuth: true,
    },

    // AI Chat
    aiChat: {
      path: '/chat',
      screen: 'AIChat',
      requiresAuth: true,
    },

    // AI Chat with specific topic
    aiChatTopic: {
      path: '/chat/:topic',
      screen: 'AIChat',
      requiresAuth: true,
      validator: DeepLinkValidators.combine(
        (params) => DeepLinkValidators.required(params, ['topic']),
        (params) => {
          const validTopics = [
            'interactions',
            'supplements',
            'medications',
            'health',
            'nutrition',
            'general',
          ];
          
          if (!validTopics.includes(params.topic)) {
            return {
              isValid: false,
              error: 'Invalid chat topic',
            };
          }
          
          return { isValid: true };
        },
        DeepLinkValidators.sanitize
      ),
    },

    // Authentication
    login: {
      path: '/auth/login',
      screen: 'Auth',
      requiresAuth: false,
      transformer: (params) => ({
        ...params,
        initialMode: 'login',
      }),
    },

    signup: {
      path: '/auth/signup',
      screen: 'Auth',
      requiresAuth: false,
      transformer: (params) => ({
        ...params,
        initialMode: 'signup',
      }),
    },

    resetPassword: {
      path: '/auth/reset',
      screen: 'Auth',
      requiresAuth: false,
      transformer: (params) => ({
        ...params,
        initialMode: 'reset',
      }),
    },

    // Email verification
    verifyEmail: {
      path: '/auth/verify',
      screen: 'EmailVerification',
      requiresAuth: false,
      validator: DeepLinkValidators.combine(
        (params) => {
          if (params.token && typeof params.token === 'string') {
            if (params.token.length < 10 || params.token.length > 200) {
              return {
                isValid: false,
                error: 'Invalid verification token',
              };
            }
          }
          return { isValid: true };
        },
        DeepLinkValidators.sanitize
      ),
    },

    // Password reset with token
    resetPasswordToken: {
      path: '/auth/reset/:token',
      screen: 'ResetPassword',
      requiresAuth: false,
      validator: DeepLinkValidators.combine(
        (params) => DeepLinkValidators.required(params, ['token']),
        (params) => DeepLinkValidators.patterns(params, {
          token: /^[a-zA-Z0-9_-]{20,200}$/, // Reset token format
        }),
        DeepLinkValidators.sanitize
      ),
    },

    // Interaction details
    interaction: {
      path: '/interaction/:interactionId',
      screen: 'InteractionDetails',
      requiresAuth: false,
      validator: DeepLinkValidators.combine(
        (params) => DeepLinkValidators.required(params, ['interactionId']),
        (params) => DeepLinkValidators.types(params, {
          interactionId: 'string',
        }),
        DeepLinkValidators.sanitize
      ),
    },

    // Educational content
    education: {
      path: '/education/:topic',
      screen: 'EducationalContent',
      requiresAuth: false,
      validator: DeepLinkValidators.combine(
        (params) => DeepLinkValidators.required(params, ['topic']),
        (params) => {
          const validTopics = [
            'supplements',
            'interactions',
            'safety',
            'dosage',
            'storage',
            'pregnancy',
            'children',
            'elderly',
          ];
          
          if (!validTopics.includes(params.topic)) {
            return {
              isValid: false,
              error: 'Invalid education topic',
            };
          }
          
          return { isValid: true };
        },
        DeepLinkValidators.sanitize
      ),
    },

    // Settings
    settings: {
      path: '/settings',
      screen: 'Settings',
      requiresAuth: true,
    },

    notifications: {
      path: '/settings/notifications',
      screen: 'NotificationSettings',
      requiresAuth: true,
    },

    privacy: {
      path: '/settings/privacy',
      screen: 'PrivacySettings',
      requiresAuth: true,
    },

    // Support and legal
    support: {
      path: '/support',
      screen: 'Support',
      requiresAuth: false,
    },

    faq: {
      path: '/faq',
      screen: 'FAQ',
      requiresAuth: false,
    },

    terms: {
      path: '/legal/terms',
      screen: 'TermsOfService',
      requiresAuth: false,
    },

    privacy_policy: {
      path: '/legal/privacy',
      screen: 'PrivacyPolicy',
      requiresAuth: false,
    },

    // Emergency/Safety
    emergency: {
      path: '/emergency',
      screen: 'EmergencyInfo',
      requiresAuth: false,
    },

    // Development/Testing (only in dev mode)
    ...__DEV__ && {
      test: {
        path: '/test/:testId',
        screen: 'TestScreen',
        requiresAuth: false,
        validator: DeepLinkValidators.combine(
          (params) => DeepLinkValidators.required(params, ['testId']),
          DeepLinkValidators.sanitize
        ),
      },
    },
  },
};

/**
 * Common deep link generators for PharmaGuide
 */
export const PharmaGuideDeepLinks = {
  /**
   * Generate product link
   */
  product: (barcode: string): string => {
    return `pharmaguide://product/${barcode}`;
  },

  /**
   * Generate search link
   */
  search: (query: string): string => {
    return `pharmaguide://search?q=${encodeURIComponent(query)}`;
  },

  /**
   * Generate shared stack link
   */
  sharedStack: (shareId: string): string => {
    return `pharmaguide://stack/shared/${shareId}`;
  },

  /**
   * Generate AI chat link with topic
   */
  aiChatTopic: (topic: string): string => {
    return `pharmaguide://chat/${topic}`;
  },

  /**
   * Generate education link
   */
  education: (topic: string): string => {
    return `pharmaguide://education/${topic}`;
  },

  /**
   * Generate email verification link
   */
  verifyEmail: (token: string): string => {
    return `pharmaguide://auth/verify?token=${encodeURIComponent(token)}`;
  },

  /**
   * Generate password reset link
   */
  resetPassword: (token: string): string => {
    return `pharmaguide://auth/reset/${token}`;
  },

  /**
   * Generate web-friendly links
   */
  web: {
    product: (barcode: string): string => {
      return `https://pharmaguide.app/product/${barcode}`;
    },
    
    search: (query: string): string => {
      return `https://pharmaguide.app/search?q=${encodeURIComponent(query)}`;
    },
    
    sharedStack: (shareId: string): string => {
      return `https://pharmaguide.app/stack/shared/${shareId}`;
    },
  },
};
