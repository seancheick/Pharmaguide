// src/services/navigation/deepLinkingService.ts
// Deep linking service with parameter validation and security

import { Linking } from 'react-native';
import { NavigationContainerRef } from '@react-navigation/native';

export interface DeepLinkRoute {
  path: string;
  screen: string;
  params?: Record<string, unknown>;
  requiresAuth?: boolean;
  validator?: (params: Record<string, unknown>) => {
    isValid: boolean;
    sanitizedParams?: Record<string, unknown>;
    error?: string;
  };
  transformer?: (params: Record<string, unknown>) => Record<string, unknown>;
  guards?: (() => boolean | Promise<boolean>)[];
}

export interface DeepLinkConfig {
  scheme: string;
  prefixes: string[];
  routes: Record<string, DeepLinkRoute>;
  fallbackRoute?: string;
  enableLogging?: boolean;
}

export interface ParsedDeepLink {
  route: string;
  params: Record<string, unknown>;
  isValid: boolean;
  error?: string;
  requiresAuth: boolean;
}

/**
 * Deep Linking Service
 * Handles URL parsing, parameter validation, and secure navigation
 */
export class DeepLinkingService {
  private static instance: DeepLinkingService;
  private config: DeepLinkConfig = { scheme: '', prefixes: [], routes: {} };
  private navigationRef?: NavigationContainerRef<
    Record<string, object | undefined>
  >;
  private isInitialized = false;

  static getInstance(): DeepLinkingService {
    if (!DeepLinkingService.instance) {
      DeepLinkingService.instance = new DeepLinkingService();
    }
    return DeepLinkingService.instance;
  }

  /**
   * Initialize deep linking service
   */
  async initialize(
    config: DeepLinkConfig,
    navigationRef?: NavigationContainerRef<Record<string, object | undefined>>
  ): Promise<void> {
    this.config = config;
    this.navigationRef = navigationRef;
    this.isInitialized = true;

    // Set up URL event listener
    const handleURL = (event: { url: string }) => {
      this.handleDeepLink(event.url);
    };

    Linking.addEventListener('url', handleURL);

    // Handle initial URL if app was opened via deep link
    const initialUrl = await Linking.getInitialURL();
    if (initialUrl) {
      this.handleDeepLink(initialUrl);
    }

    if (this.config.enableLogging) {
      console.log('✅ Deep linking service initialized');
    }
  }

  /**
   * Handle incoming deep link
   */
  async handleDeepLink(url: string): Promise<boolean> {
    if (!this.isInitialized) {
      console.warn('Deep linking service not initialized');
      return false;
    }

    try {
      const parsedLink = this.parseDeepLink(url);

      if (!parsedLink.isValid) {
        if (this.config.enableLogging) {
          console.warn(`Invalid deep link: ${parsedLink.error}`);
        }
        return this.handleInvalidLink(url);
      }

      // Check authentication requirements
      if (parsedLink.requiresAuth && !this.isUserAuthenticated()) {
        if (this.config.enableLogging) {
          console.log(
            'Deep link requires authentication, redirecting to login'
          );
        }
        return this.handleAuthRequired(parsedLink);
      }

      // Execute route guards
      const routeConfig = this.config.routes[parsedLink.route];
      if (routeConfig.guards) {
        const guardResults = await Promise.all(
          routeConfig.guards.map(guard => guard())
        );

        if (guardResults.some(result => !result)) {
          if (this.config.enableLogging) {
            console.warn('Deep link blocked by route guard');
          }
          return this.handleBlockedNavigation(parsedLink);
        }
      }

      // Navigate to the route
      return this.navigateToRoute(parsedLink);
    } catch (error) {
      console.error('Error handling deep link:', error);
      return false;
    }
  }

  /**
   * Parse deep link URL
   */
  parseDeepLink(url: string): ParsedDeepLink {
    try {
      // Remove scheme and prefixes
      let cleanUrl = url;

      // Remove scheme
      if (cleanUrl.startsWith(`${this.config.scheme}://`)) {
        cleanUrl = cleanUrl.replace(`${this.config.scheme}://`, '');
      }

      // Remove prefixes
      for (const prefix of this.config.prefixes) {
        if (cleanUrl.startsWith(prefix)) {
          cleanUrl = cleanUrl.replace(prefix, '');
          break;
        }
      }

      // Parse path and query parameters
      const [path, queryString] = cleanUrl.split('?');
      const queryParams = this.parseQueryString(queryString || '');

      // Find matching route
      const matchedRoute = this.findMatchingRoute(path);
      if (!matchedRoute) {
        return {
          route: path,
          params: {},
          isValid: false,
          error: 'No matching route found',
          requiresAuth: false,
        };
      }

      const routeConfig = this.config.routes[matchedRoute.routeName];

      // Extract path parameters
      const pathParams = this.extractPathParams(path, routeConfig.path);

      // Combine all parameters
      const allParams = { ...pathParams, ...queryParams };

      // Validate parameters
      if (routeConfig.validator) {
        const validation = routeConfig.validator(allParams);
        if (!validation.isValid) {
          return {
            route: matchedRoute.routeName,
            params: allParams,
            isValid: false,
            error: validation.error || 'Parameter validation failed',
            requiresAuth: routeConfig.requiresAuth || false,
          };
        }

        // Use sanitized parameters if provided
        if (validation.sanitizedParams) {
          Object.assign(allParams, validation.sanitizedParams);
        }
      }

      // Transform parameters if transformer is provided
      if (routeConfig.transformer) {
        Object.assign(allParams, routeConfig.transformer(allParams));
      }

      return {
        route: matchedRoute.routeName,
        params: allParams,
        isValid: true,
        requiresAuth: routeConfig.requiresAuth || false,
      };
    } catch (error) {
      return {
        route: '',
        params: {},
        isValid: false,
        error: `Parse error: ${error instanceof Error ? error.message : String(error)}`,
        requiresAuth: false,
      };
    }
  }

  /**
   * Generate deep link URL
   */
  generateDeepLink(
    routeName: string,
    params: Record<string, unknown> = {}
  ): string {
    const routeConfig = this.config.routes[routeName];
    if (!routeConfig) {
      throw new Error(
        `Route ${routeName} not found in deep link configuration`
      );
    }

    // Validate parameters before generating link
    if (routeConfig.validator) {
      const validation = routeConfig.validator(params);
      if (!validation.isValid) {
        throw new Error(
          `Invalid parameters for route ${routeName}: ${validation.error}`
        );
      }
    }

    // Build path with parameters
    let path = routeConfig.path;
    const queryParams: Record<string, string> = {};

    // Replace path parameters
    Object.entries(params).forEach(([key, value]) => {
      const pathParam = `:${key}`;
      if (path.includes(pathParam)) {
        path = path.replace(pathParam, encodeURIComponent(String(value)));
      } else {
        queryParams[key] = String(value);
      }
    });

    // Build query string
    const queryString = Object.entries(queryParams)
      .map(
        ([key, value]) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
      )
      .join('&');

    // Combine everything
    const baseUrl = `${this.config.scheme}://${path}`;
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }

  /**
   * Navigate to external URL
   */
  async openExternalURL(url: string): Promise<boolean> {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to open external URL:', error);
      return false;
    }
  }

  /**
   * Parse query string into object
   */
  private parseQueryString(queryString: string): Record<string, unknown> {
    const params: Record<string, unknown> = {};

    if (!queryString) return params;

    queryString.split('&').forEach(param => {
      const [key, value] = param.split('=');
      if (key && value) {
        const decodedKey = decodeURIComponent(key);
        const decodedValue = decodeURIComponent(value);

        // Try to parse as number or boolean
        if (decodedValue === 'true') {
          params[decodedKey] = true;
        } else if (decodedValue === 'false') {
          params[decodedKey] = false;
        } else if (!isNaN(Number(decodedValue))) {
          params[decodedKey] = Number(decodedValue);
        } else {
          params[decodedKey] = decodedValue;
        }
      }
    });

    return params;
  }

  /**
   * Find matching route for path
   */
  private findMatchingRoute(
    path: string
  ): { routeName: string; params: Record<string, string> } | null {
    for (const [routeName, routeConfig] of Object.entries(this.config.routes)) {
      const match = this.matchPath(path, routeConfig.path);
      if (match) {
        return { routeName, params: match };
      }
    }
    return null;
  }

  /**
   * Match path against route pattern
   */
  private matchPath(
    path: string,
    pattern: string
  ): Record<string, string> | null {
    const pathSegments = path.split('/').filter(Boolean);
    const patternSegments = pattern.split('/').filter(Boolean);

    if (pathSegments.length !== patternSegments.length) {
      return null;
    }

    const params: Record<string, string> = {};

    for (let i = 0; i < patternSegments.length; i++) {
      const patternSegment = patternSegments[i];
      const pathSegment = pathSegments[i];

      if (patternSegment.startsWith(':')) {
        // Parameter segment
        const paramName = patternSegment.slice(1);
        params[paramName] = decodeURIComponent(pathSegment);
      } else if (patternSegment !== pathSegment) {
        // Literal segment doesn't match
        return null;
      }
    }

    return params;
  }

  /**
   * Extract path parameters
   */
  private extractPathParams(
    path: string,
    pattern: string
  ): Record<string, unknown> {
    const match = this.matchPath(path, pattern);
    return match || {};
  }

  /**
   * Check if user is authenticated
   */
  private isUserAuthenticated(): boolean {
    // This should be implemented based on your auth system
    // For now, return true as a placeholder
    return true;
  }

  /**
   * Handle invalid deep link
   */
  private handleInvalidLink(url: string): boolean {
    if (this.config.fallbackRoute && this.navigationRef) {
      this.navigationRef.navigate(this.config.fallbackRoute as never);
      return true;
    }
    return false;
  }

  /**
   * Handle authentication required
   */
  private handleAuthRequired(parsedLink: ParsedDeepLink): boolean {
    // Store the intended destination and redirect to login
    // This should be implemented based on your auth flow
    if (this.navigationRef) {
      this.navigationRef.navigate(
        'Auth' as never,
        {
          redirectTo: parsedLink.route,
          redirectParams: parsedLink.params,
        } as never
      );
      return true;
    }
    return false;
  }

  /**
   * Handle blocked navigation
   */
  private handleBlockedNavigation(parsedLink: ParsedDeepLink): boolean {
    if (this.config.fallbackRoute && this.navigationRef) {
      this.navigationRef.navigate(this.config.fallbackRoute as never);
      return true;
    }
    return false;
  }

  /**
   * Navigate to parsed route
   */
  private navigateToRoute(parsedLink: ParsedDeepLink): boolean {
    if (!this.navigationRef) {
      console.warn('Navigation ref not available');
      return false;
    }

    try {
      const routeConfig = this.config.routes[parsedLink.route];
      this.navigationRef.navigate(
        routeConfig.screen as never,
        parsedLink.params as never
      );

      if (this.config.enableLogging) {
        console.log(
          `Navigated to ${routeConfig.screen} with params:`,
          parsedLink.params
        );
      }

      return true;
    } catch (error) {
      console.error('Navigation error:', error);
      return false;
    }
  }
}

// Export singleton instance
export const deepLinkingService = DeepLinkingService.getInstance();

/**
 * Parameter validation utilities for deep links
 */
export const DeepLinkValidators = {
  /**
   * Validate required parameters
   */
  required: (params: Record<string, unknown>, requiredFields: string[]) => {
    const missing = requiredFields.filter(
      field =>
        !(field in params) ||
        params[field] === undefined ||
        params[field] === ''
    );

    if (missing.length > 0) {
      return {
        isValid: false,
        error: `Missing required parameters: ${missing.join(', ')}`,
      };
    }

    return { isValid: true };
  },

  /**
   * Validate parameter types
   */
  types: (
    params: Record<string, unknown>,
    typeMap: Record<string, 'string' | 'number' | 'boolean'>
  ) => {
    const errors: string[] = [];

    Object.entries(typeMap).forEach(([field, expectedType]) => {
      if (field in params) {
        const value = params[field];
        const actualType = typeof value;

        if (actualType !== expectedType) {
          errors.push(`${field} should be ${expectedType}, got ${actualType}`);
        }
      }
    });

    if (errors.length > 0) {
      return {
        isValid: false,
        error: errors.join(', '),
      };
    }

    return { isValid: true };
  },

  /**
   * Validate string patterns
   */
  patterns: (
    params: Record<string, unknown>,
    patternMap: Record<string, RegExp>
  ) => {
    const errors: string[] = [];

    Object.entries(patternMap).forEach(([field, pattern]) => {
      if (field in params && typeof params[field] === 'string') {
        if (!pattern.test(params[field] as string)) {
          errors.push(`${field} format is invalid`);
        }
      }
    });

    if (errors.length > 0) {
      return {
        isValid: false,
        error: errors.join(', '),
      };
    }

    return { isValid: true };
  },

  /**
   * Validate numeric ranges
   */
  ranges: (
    params: Record<string, unknown>,
    rangeMap: Record<string, { min?: number; max?: number }>
  ) => {
    const errors: string[] = [];

    Object.entries(rangeMap).forEach(([field, range]) => {
      if (field in params && typeof params[field] === 'number') {
        const value = params[field] as number;

        if (range.min !== undefined && value < range.min) {
          errors.push(`${field} must be at least ${range.min}`);
        }

        if (range.max !== undefined && value > range.max) {
          errors.push(`${field} must be at most ${range.max}`);
        }
      }
    });

    if (errors.length > 0) {
      return {
        isValid: false,
        error: errors.join(', '),
      };
    }

    return { isValid: true };
  },

  /**
   * Sanitize parameters
   */
  sanitize: (params: Record<string, unknown>) => {
    const sanitized: Record<string, unknown> = { ...params };

    // Remove potentially dangerous fields
    const dangerousFields = ['__proto__', 'constructor', 'prototype'];
    dangerousFields.forEach(field => {
      delete sanitized[field];
    });

    // Sanitize string values
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'string') {
        // Remove script tags and other dangerous content
        sanitized[key] = (sanitized[key] as string)
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '');

        // Limit string length
        if ((sanitized[key] as string).length > 1000) {
          sanitized[key] = (sanitized[key] as string).substring(0, 1000);
        }
      }
    });

    return { isValid: true, sanitizedParams: sanitized };
  },

  /**
   * Combine multiple validators
   */
  combine: (
    ...validators: ((params: Record<string, unknown>) => {
      isValid: boolean;
      error?: string;
      sanitizedParams?: Record<string, unknown>;
    })[]
  ) => {
    return (params: Record<string, unknown>) => {
      let sanitizedParams: Record<string, unknown> = { ...params };
      for (const validator of validators) {
        const result = validator(sanitizedParams);
        if (!result.isValid) {
          return result;
        }
        if (result.sanitizedParams) {
          sanitizedParams = { ...sanitizedParams, ...result.sanitizedParams };
        }
      }
      return { isValid: true, sanitizedParams };
    };
  },
};
