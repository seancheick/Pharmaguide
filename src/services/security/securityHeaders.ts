// src/services/security/securityHeaders.ts
import { logger } from '../monitoring/logger';

interface SecurityHeadersConfig {
  enableCSP: boolean;
  enableHSTS: boolean;
  enableXFrameOptions: boolean;
  enableXContentTypeOptions: boolean;
  enableXXSSProtection: boolean;
  enableReferrerPolicy: boolean;
  enablePermissionsPolicy: boolean;
  cspDirectives?: string;
  hstsMaxAge?: number;
  environment: 'development' | 'staging' | 'production';
}

/**
 * Enhanced Security Headers Service
 * Implements OWASP security headers recommendations
 */
class SecurityHeadersService {
  private config: SecurityHeadersConfig = {
    enableCSP: true,
    enableHSTS: true,
    enableXFrameOptions: true,
    enableXContentTypeOptions: true,
    enableXXSSProtection: true,
    enableReferrerPolicy: true,
    enablePermissionsPolicy: true,
    hstsMaxAge: 31536000, // 1 year
    environment: 'production',
  };

  /**
   * Initialize security headers service
   */
  initialize(config: Partial<SecurityHeadersConfig>): void {
    this.config = { ...this.config, ...config };
    logger.info('security', 'Security headers service initialized', { 
      config: this.config 
    });
  }

  /**
   * Get complete OWASP security headers for API requests
   */
  getSecurityHeaders(options?: {
    userId?: string;
    requestType?: 'api' | 'static' | 'upload';
    allowInlineScripts?: boolean;
  }): Record<string, string> {
    const headers: Record<string, string> = {};

    // Content Security Policy (OWASP A05:2021)
    if (this.config.enableCSP) {
      headers['Content-Security-Policy'] = this.generateCSP(options);
    }

    // HTTP Strict Transport Security (OWASP A02:2021)
    if (this.config.enableHSTS && this.config.environment === 'production') {
      headers['Strict-Transport-Security'] = 
        `max-age=${this.config.hstsMaxAge}; includeSubDomains; preload`;
    }

    // X-Frame-Options (Clickjacking protection)
    if (this.config.enableXFrameOptions) {
      headers['X-Frame-Options'] = 'DENY';
    }

    // X-Content-Type-Options (MIME sniffing protection)
    if (this.config.enableXContentTypeOptions) {
      headers['X-Content-Type-Options'] = 'nosniff';
    }

    // X-XSS-Protection (Legacy XSS protection)
    if (this.config.enableXXSSProtection) {
      headers['X-XSS-Protection'] = '1; mode=block';
    }

    // Referrer Policy (Information disclosure protection)
    if (this.config.enableReferrerPolicy) {
      headers['Referrer-Policy'] = 'strict-origin-when-cross-origin';
    }

    // Permissions Policy (Feature policy)
    if (this.config.enablePermissionsPolicy) {
      headers['Permissions-Policy'] = this.generatePermissionsPolicy();
    }

    // Additional security headers
    headers['X-Permitted-Cross-Domain-Policies'] = 'none';
    headers['Cross-Origin-Embedder-Policy'] = 'require-corp';
    headers['Cross-Origin-Opener-Policy'] = 'same-origin';
    headers['Cross-Origin-Resource-Policy'] = 'same-origin';

    // Cache control for sensitive data
    if (options?.requestType === 'api') {
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate, private';
      headers['Pragma'] = 'no-cache';
      headers['Expires'] = '0';
    }

    // Request tracking (non-sensitive)
    if (options?.userId) {
      headers['X-User-Context'] = options.userId.substring(0, 8);
    }
    headers['X-Request-ID'] = this.generateRequestId();
    headers['X-Timestamp'] = Date.now().toString();

    return headers;
  }

  /**
   * Generate Content Security Policy
   */
  private generateCSP(options?: {
    allowInlineScripts?: boolean;
    requestType?: 'api' | 'static' | 'upload';
  }): string {
    if (this.config.cspDirectives) {
      return this.config.cspDirectives;
    }

    const directives = [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'", // React Native requires inline styles
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://api.supabase.co https://huggingface.co https://api.groq.com",
      "media-src 'self'",
      "object-src 'none'",
      "frame-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ];

    // Allow inline scripts for development
    if (options?.allowInlineScripts || this.config.environment === 'development') {
      directives[1] = "script-src 'self' 'unsafe-inline'";
    }

    // Special rules for upload endpoints
    if (options?.requestType === 'upload') {
      directives.push("frame-ancestors 'none'");
    }

    return directives.join('; ');
  }

  /**
   * Generate Permissions Policy
   */
  private generatePermissionsPolicy(): string {
    const policies = [
      'camera=(self)', // Allow camera for barcode scanning
      'microphone=()', // Deny microphone
      'geolocation=()', // Deny geolocation
      'payment=()', // Deny payment
      'usb=()', // Deny USB
      'magnetometer=()', // Deny magnetometer
      'gyroscope=()', // Deny gyroscope
      'accelerometer=()', // Deny accelerometer
      'ambient-light-sensor=()', // Deny ambient light
      'autoplay=()', // Deny autoplay
      'encrypted-media=()', // Deny encrypted media
      'fullscreen=(self)', // Allow fullscreen for app
      'picture-in-picture=()', // Deny picture-in-picture
    ];

    return policies.join(', ');
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate security headers in response
   */
  validateResponseHeaders(headers: Record<string, string>): {
    valid: boolean;
    missing: string[];
    warnings: string[];
  } {
    const requiredHeaders = [
      'X-Content-Type-Options',
      'X-Frame-Options',
      'Referrer-Policy',
    ];

    const recommendedHeaders = [
      'Content-Security-Policy',
      'Strict-Transport-Security',
      'X-XSS-Protection',
    ];

    const missing: string[] = [];
    const warnings: string[] = [];

    // Check required headers
    for (const header of requiredHeaders) {
      if (!headers[header.toLowerCase()]) {
        missing.push(header);
      }
    }

    // Check recommended headers
    for (const header of recommendedHeaders) {
      if (!headers[header.toLowerCase()]) {
        warnings.push(`Recommended header missing: ${header}`);
      }
    }

    // Validate specific header values
    const xFrameOptions = headers['x-frame-options'];
    if (xFrameOptions && !['DENY', 'SAMEORIGIN'].includes(xFrameOptions.toUpperCase())) {
      warnings.push('X-Frame-Options should be DENY or SAMEORIGIN');
    }

    const xContentType = headers['x-content-type-options'];
    if (xContentType && xContentType.toLowerCase() !== 'nosniff') {
      warnings.push('X-Content-Type-Options should be nosniff');
    }

    return {
      valid: missing.length === 0,
      missing,
      warnings,
    };
  }

  /**
   * Get security headers for different request types
   */
  getHeadersForRequestType(type: 'api' | 'static' | 'upload', userId?: string): Record<string, string> {
    return this.getSecurityHeaders({
      requestType: type,
      userId,
      allowInlineScripts: this.config.environment === 'development',
    });
  }

  /**
   * Get CORS headers for API responses
   */
  getCORSHeaders(origin?: string): Record<string, string> {
    const allowedOrigins = this.getAllowedOrigins();
    
    const headers: Record<string, string> = {
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 
        'authorization, x-client-info, apikey, content-type, x-user-context, x-request-id',
      'Access-Control-Max-Age': '86400', // 24 hours
      'Access-Control-Allow-Credentials': 'true',
    };

    // Set origin based on environment
    if (origin && allowedOrigins.includes(origin)) {
      headers['Access-Control-Allow-Origin'] = origin;
    } else if (this.config.environment === 'development') {
      headers['Access-Control-Allow-Origin'] = '*';
    } else {
      headers['Access-Control-Allow-Origin'] = allowedOrigins[0] || 'https://pharmaguide.app';
    }

    return headers;
  }

  /**
   * Get allowed origins based on environment
   */
  private getAllowedOrigins(): string[] {
    switch (this.config.environment) {
      case 'development':
        return ['http://localhost:3000', 'http://localhost:8081', 'exp://localhost:8081'];
      case 'staging':
        return ['https://staging.pharmaguide.app'];
      case 'production':
        return ['https://pharmaguide.app', 'https://www.pharmaguide.app'];
      default:
        return ['https://pharmaguide.app'];
    }
  }

  /**
   * Get security headers status for monitoring
   */
  getSecurityStatus(): {
    enabled: boolean;
    headers: string[];
    environment: string;
    config: SecurityHeadersConfig;
  } {
    const enabledHeaders = [];
    
    if (this.config.enableCSP) enabledHeaders.push('Content-Security-Policy');
    if (this.config.enableHSTS) enabledHeaders.push('Strict-Transport-Security');
    if (this.config.enableXFrameOptions) enabledHeaders.push('X-Frame-Options');
    if (this.config.enableXContentTypeOptions) enabledHeaders.push('X-Content-Type-Options');
    if (this.config.enableXXSSProtection) enabledHeaders.push('X-XSS-Protection');
    if (this.config.enableReferrerPolicy) enabledHeaders.push('Referrer-Policy');
    if (this.config.enablePermissionsPolicy) enabledHeaders.push('Permissions-Policy');

    return {
      enabled: enabledHeaders.length > 0,
      headers: enabledHeaders,
      environment: this.config.environment,
      config: this.config,
    };
  }
}

// Export singleton instance
export const securityHeaders = new SecurityHeadersService();
