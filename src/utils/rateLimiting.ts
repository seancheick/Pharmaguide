// src/utils/rateLimiting.ts
import { safeStorage } from './safeStorage';
import { sanitizeRateLimitData } from './sanitization';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (userId?: string, action?: string) => string;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
  firstRequest: number;
}

/**
 * Client-side rate limiting to prevent abuse
 */
export class RateLimiter {
  private config: RateLimitConfig;
  private storage: Map<string, RateLimitEntry> = new Map();

  constructor(config: RateLimitConfig) {
    this.config = config;
    this.loadFromStorage();
  }

  /**
   * Check if request is allowed under rate limit
   */
  async isAllowed(userId?: string, action?: string): Promise<boolean> {
    const key = this.config.keyGenerator 
      ? this.config.keyGenerator(userId, action)
      : `${userId || 'anonymous'}_${action || 'default'}`;

    const now = Date.now();
    const entry = this.storage.get(key);

    // No previous requests
    if (!entry) {
      this.storage.set(key, {
        count: 1,
        resetTime: now + this.config.windowMs,
        firstRequest: now,
      });
      await this.saveToStorage();
      return true;
    }

    // Reset window if expired
    if (now >= entry.resetTime) {
      this.storage.set(key, {
        count: 1,
        resetTime: now + this.config.windowMs,
        firstRequest: now,
      });
      await this.saveToStorage();
      return true;
    }

    // Check if under limit
    if (entry.count < this.config.maxRequests) {
      entry.count++;
      this.storage.set(key, entry);
      await this.saveToStorage();
      return true;
    }

    // Rate limit exceeded
    return false;
  }

  /**
   * Get remaining requests for a key
   */
  getRemainingRequests(userId?: string, action?: string): number {
    const key = this.config.keyGenerator 
      ? this.config.keyGenerator(userId, action)
      : `${userId || 'anonymous'}_${action || 'default'}`;

    const entry = this.storage.get(key);
    if (!entry || Date.now() >= entry.resetTime) {
      return this.config.maxRequests;
    }

    return Math.max(0, this.config.maxRequests - entry.count);
  }

  /**
   * Get time until reset
   */
  getTimeUntilReset(userId?: string, action?: string): number {
    const key = this.config.keyGenerator 
      ? this.config.keyGenerator(userId, action)
      : `${userId || 'anonymous'}_${action || 'default'}`;

    const entry = this.storage.get(key);
    if (!entry) return 0;

    return Math.max(0, entry.resetTime - Date.now());
  }

  /**
   * Clear rate limit for a key
   */
  async clearLimit(userId?: string, action?: string): Promise<void> {
    const key = this.config.keyGenerator 
      ? this.config.keyGenerator(userId, action)
      : `${userId || 'anonymous'}_${action || 'default'}`;

    this.storage.delete(key);
    await this.saveToStorage();
  }

  /**
   * Load rate limit data from storage
   */
  private async loadFromStorage(): Promise<void> {
    try {
      const data = await safeStorage.getItem('rate_limits');
      if (data) {
        const parsed = JSON.parse(data);
        this.storage = new Map(Object.entries(parsed));
      }
    } catch (error) {
      console.warn('Failed to load rate limit data:', error);
    }
  }

  /**
   * Save rate limit data to storage
   */
  private async saveToStorage(): Promise<void> {
    try {
      const data = Object.fromEntries(this.storage);
      await safeStorage.setItem('rate_limits', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save rate limit data:', error);
    }
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.storage.entries()) {
      if (now >= entry.resetTime) {
        this.storage.delete(key);
      }
    }
  }
}

// Pre-configured rate limiters for common actions
export const authRateLimiter = new RateLimiter({
  maxRequests: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  keyGenerator: (userId, action) => `auth_${action}_${userId || 'anonymous'}`,
});

export const scanRateLimiter = new RateLimiter({
  maxRequests: 30,
  windowMs: 60 * 1000, // 1 minute
  keyGenerator: (userId) => `scan_${userId || 'anonymous'}`,
});

export const analysisRateLimiter = new RateLimiter({
  maxRequests: 20,
  windowMs: 60 * 1000, // 1 minute
  keyGenerator: (userId) => `analysis_${userId || 'anonymous'}`,
});

export const apiRateLimiter = new RateLimiter({
  maxRequests: 100,
  windowMs: 60 * 1000, // 1 minute
  keyGenerator: (userId, action) => `api_${action}_${userId || 'anonymous'}`,
});

/**
 * Security headers for API requests
 */
export const getSecurityHeaders = (userId?: string): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  };

  // Add user context if available (but don't expose sensitive data)
  if (userId) {
    headers['X-User-Context'] = userId.substring(0, 8); // Only first 8 chars
  }

  // Add timestamp for request freshness
  headers['X-Timestamp'] = Date.now().toString();

  return headers;
};

/**
 * Validate request before sending
 */
export const validateRequest = (
  url: string,
  method: string,
  body?: any
): { isValid: boolean; error?: string } => {
  // URL validation
  try {
    new URL(url);
  } catch {
    return { isValid: false, error: 'Invalid URL' };
  }

  // Method validation
  const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
  if (!allowedMethods.includes(method.toUpperCase())) {
    return { isValid: false, error: 'Invalid HTTP method' };
  }

  // Body size validation (prevent large payloads)
  if (body) {
    const bodySize = JSON.stringify(body).length;
    if (bodySize > 1024 * 1024) { // 1MB limit
      return { isValid: false, error: 'Request body too large' };
    }
  }

  return { isValid: true };
};

/**
 * Secure fetch wrapper with rate limiting and security headers
 */
export const secureFetch = async (
  url: string,
  options: RequestInit = {},
  userId?: string,
  action?: string
): Promise<Response> => {
  // Validate request
  const validation = validateRequest(url, options.method || 'GET', options.body);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  // Check rate limit
  const isAllowed = await apiRateLimiter.isAllowed(userId, action);
  if (!isAllowed) {
    const timeUntilReset = apiRateLimiter.getTimeUntilReset(userId, action);
    throw new Error(`Rate limit exceeded. Try again in ${Math.ceil(timeUntilReset / 1000)} seconds.`);
  }

  // Add security headers
  const securityHeaders = getSecurityHeaders(userId);
  const headers = {
    ...securityHeaders,
    ...options.headers,
  };

  // Sanitize body if present
  let body = options.body;
  if (body && typeof body === 'string') {
    try {
      const parsed = JSON.parse(body);
      const sanitized = sanitizeRateLimitData(parsed);
      body = JSON.stringify(sanitized);
    } catch {
      // If not JSON, leave as is
    }
  }

  // Make request with timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      body,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Clean up rate limiters periodically
 */
export const startRateLimitCleanup = (): void => {
  setInterval(() => {
    authRateLimiter.cleanup();
    scanRateLimiter.cleanup();
    analysisRateLimiter.cleanup();
    apiRateLimiter.cleanup();
  }, 5 * 60 * 1000); // Clean up every 5 minutes
};
