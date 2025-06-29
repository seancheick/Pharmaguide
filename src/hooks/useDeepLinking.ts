// src/hooks/useDeepLinking.ts
// Hook for deep linking functionality

import { useEffect, useCallback, useState } from 'react';
import { Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { deepLinkingService, DeepLinkConfig, ParsedDeepLink } from '../services/navigation/deepLinkingService';
import { useAuth } from './useAuth';

export interface UseDeepLinkingOptions {
  enableLogging?: boolean;
  handleInitialURL?: boolean;
  requireAuthForProtectedRoutes?: boolean;
}

export interface UseDeepLinkingReturn {
  handleURL: (url: string) => Promise<boolean>;
  generateLink: (routeName: string, params?: Record<string, any>) => string;
  openExternalURL: (url: string) => Promise<boolean>;
  isInitialized: boolean;
  lastHandledURL?: string;
  lastParsedLink?: ParsedDeepLink;
}

/**
 * Hook for deep linking functionality
 */
export const useDeepLinking = (
  config: DeepLinkConfig,
  options: UseDeepLinkingOptions = {}
): UseDeepLinkingReturn => {
  const {
    enableLogging = false,
    handleInitialURL = true,
    requireAuthForProtectedRoutes = true,
  } = options;

  const navigation = useNavigation();
  const { user, loading: authLoading } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastHandledURL, setLastHandledURL] = useState<string>();
  const [lastParsedLink, setLastParsedLink] = useState<ParsedDeepLink>();

  /**
   * Initialize deep linking service
   */
  useEffect(() => {
    const initializeDeepLinking = async () => {
      try {
        await deepLinkingService.initialize(
          { ...config, enableLogging },
          navigation.getParent() || navigation
        );
        setIsInitialized(true);
        
        if (enableLogging) {
          console.log('✅ Deep linking hook initialized');
        }
      } catch (error) {
        console.error('❌ Failed to initialize deep linking:', error);
      }
    };

    if (!authLoading) {
      initializeDeepLinking();
    }
  }, [config, enableLogging, navigation, authLoading]);

  /**
   * Handle incoming URL
   */
  const handleURL = useCallback(async (url: string): Promise<boolean> => {
    if (!isInitialized) {
      if (enableLogging) {
        console.warn('Deep linking not initialized, queuing URL:', url);
      }
      return false;
    }

    try {
      setLastHandledURL(url);
      
      // Parse the URL first to get link info
      const parsedLink = deepLinkingService.parseDeepLink(url);
      setLastParsedLink(parsedLink);
      
      if (enableLogging) {
        console.log('Handling deep link:', { url, parsedLink });
      }

      // Check authentication requirements
      if (requireAuthForProtectedRoutes && parsedLink.requiresAuth && !user) {
        if (enableLogging) {
          console.log('Protected route requires authentication, storing for later');
        }
        
        // Store the intended destination for after login
        // This could be implemented with your auth system
        return false;
      }

      // Handle the deep link
      const success = await deepLinkingService.handleDeepLink(url);
      
      if (enableLogging) {
        console.log(`Deep link handling ${success ? 'succeeded' : 'failed'}`);
      }
      
      return success;
    } catch (error) {
      console.error('Error handling deep link:', error);
      return false;
    }
  }, [isInitialized, enableLogging, requireAuthForProtectedRoutes, user]);

  /**
   * Generate deep link
   */
  const generateLink = useCallback((routeName: string, params: Record<string, any> = {}): string => {
    try {
      return deepLinkingService.generateDeepLink(routeName, params);
    } catch (error) {
      console.error('Error generating deep link:', error);
      return '';
    }
  }, []);

  /**
   * Open external URL
   */
  const openExternalURL = useCallback(async (url: string): Promise<boolean> => {
    try {
      return await deepLinkingService.openExternalURL(url);
    } catch (error) {
      console.error('Error opening external URL:', error);
      return false;
    }
  }, []);

  /**
   * Handle initial URL when app starts
   */
  useEffect(() => {
    if (!handleInitialURL || !isInitialized) return;

    const handleInitialUrl = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          if (enableLogging) {
            console.log('Handling initial URL:', initialUrl);
          }
          await handleURL(initialUrl);
        }
      } catch (error) {
        console.error('Error handling initial URL:', error);
      }
    };

    handleInitialUrl();
  }, [isInitialized, handleInitialURL, handleURL, enableLogging]);

  /**
   * Set up URL event listener
   */
  useEffect(() => {
    if (!isInitialized) return;

    const handleURLEvent = (event: { url: string }) => {
      handleURL(event.url);
    };

    const subscription = Linking.addEventListener('url', handleURLEvent);

    return () => {
      subscription?.remove();
    };
  }, [isInitialized, handleURL]);

  return {
    handleURL,
    generateLink,
    openExternalURL,
    isInitialized,
    lastHandledURL,
    lastParsedLink,
  };
};

/**
 * Hook for simple deep linking setup
 */
export const useSimpleDeepLinking = (
  scheme: string,
  routes: Record<string, { screen: string; path: string }>
) => {
  const config: DeepLinkConfig = {
    scheme,
    prefixes: [],
    routes: Object.fromEntries(
      Object.entries(routes).map(([key, value]) => [
        key,
        {
          path: value.path,
          screen: value.screen,
        },
      ])
    ),
    enableLogging: __DEV__,
  };

  return useDeepLinking(config, {
    enableLogging: __DEV__,
    handleInitialURL: true,
    requireAuthForProtectedRoutes: true,
  });
};

/**
 * Deep linking utilities for components
 */
export const DeepLinkingUtils = {
  /**
   * Create deep link configuration
   */
  createConfig: (
    scheme: string,
    prefixes: string[] = [],
    routes: Record<string, any> = {},
    options: Partial<DeepLinkConfig> = {}
  ): DeepLinkConfig => ({
    scheme,
    prefixes,
    routes,
    fallbackRoute: 'Home',
    enableLogging: __DEV__,
    ...options,
  }),

  /**
   * Create route configuration
   */
  createRoute: (
    path: string,
    screen: string,
    options: {
      requiresAuth?: boolean;
      validator?: (params: any) => { isValid: boolean; sanitizedParams?: any; error?: string };
      transformer?: (params: any) => any;
      guards?: (() => boolean | Promise<boolean>)[];
    } = {}
  ) => ({
    path,
    screen,
    ...options,
  }),

  /**
   * Validate URL format
   */
  isValidURL: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Extract domain from URL
   */
  extractDomain: (url: string): string | null => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return null;
    }
  },

  /**
   * Check if URL is external
   */
  isExternalURL: (url: string, appScheme: string): boolean => {
    if (!DeepLinkingUtils.isValidURL(url)) return false;
    
    try {
      const urlObj = new URL(url);
      return urlObj.protocol !== `${appScheme}:`;
    } catch {
      return false;
    }
  },

  /**
   * Sanitize URL parameters
   */
  sanitizeURLParams: (params: Record<string, any>): Record<string, any> => {
    const sanitized: Record<string, any> = {};
    
    Object.entries(params).forEach(([key, value]) => {
      // Skip dangerous keys
      if (['__proto__', 'constructor', 'prototype'].includes(key)) {
        return;
      }
      
      // Sanitize string values
      if (typeof value === 'string') {
        sanitized[key] = value
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '')
          .substring(0, 1000); // Limit length
      } else {
        sanitized[key] = value;
      }
    });
    
    return sanitized;
  },
};
