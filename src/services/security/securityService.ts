// src/services/security/securityService.ts
import { logger } from '../monitoring/logger';

interface SecurityConfig {
  enableInputSanitization: boolean;
  enableRateLimiting: boolean;
  maxRequestsPerMinute: number;
  enableSQLInjectionProtection: boolean;
  enableXSSProtection: boolean;
  enableCSRFProtection: boolean;
  enableOWASPValidation: boolean;
  enablePathTraversalProtection: boolean;
  enableCommandInjectionProtection: boolean;
}

type InputType =
  | 'email'
  | 'password'
  | 'text'
  | 'url'
  | 'filename'
  | 'search'
  | 'json'
  | 'sql'
  | 'html'
  | 'xml';

interface ValidationResult {
  valid: boolean;
  threat?: string;
  sanitized?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface SecurityViolation {
  type: 'rate_limit' | 'sql_injection' | 'xss' | 'csrf' | 'invalid_input';
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: string;
  userAgent?: string;
  ip?: string;
  timestamp: number;
}

/**
 * Enhanced OWASP Security Validator
 * Comprehensive threat detection based on OWASP Top 10
 */
class OWASPSecurityValidator {
  private readonly patterns = {
    // SQL Injection patterns (OWASP A03:2021)
    sqlInjection: [
      /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/gi,
      /('|(--)|(\|)|(\*)|(%27)|(%2D%2D)|(%7C)|(%2A))/gi,
      /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/gi,
      /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/gi,
    ],

    // XSS patterns (OWASP A03:2021)
    xss: [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      /(<|%3C)(script|iframe|object|embed|form)(\s|%20|>|%3E)/gi,
      /(alert|confirm|prompt|eval)\s*\(/gi,
    ],

    // Path Traversal patterns (OWASP A01:2021)
    pathTraversal: [
      /\.\.[\/\\]/g,
      /\.\.\%2f/gi,
      /\.\.\%5c/gi,
      /(\.\.\/){2,}/g,
      /\%2e\%2e\%2f/gi,
    ],

    // Command Injection patterns (OWASP A03:2021)
    commandInjection: [
      /[;&|`$(){}[\]]/g,
      /\b(cat|ls|pwd|whoami|id|uname|ps|netstat|ifconfig|ping|wget|curl)\b/gi,
      /(\||;|&|`|\$\(|\$\{)/g,
    ],

    // LDAP Injection patterns
    ldapInjection: [
      /(\(|\)|&|\||!|=|\*|<|>|~)/g,
      /(\%28|\%29|\%26|\%7C|\%21|\%3D|\%2A|\%3C|\%3E|\%7E)/gi,
    ],

    // XML/XXE patterns (OWASP A05:2021)
    xmlInjection: [
      /<!DOCTYPE[^>]*>/gi,
      /<!ENTITY[^>]*>/gi,
      /<\?xml[^>]*>/gi,
      /SYSTEM\s+["'][^"']*["']/gi,
    ],
  };

  validateInput(input: string, type: InputType): ValidationResult {
    if (!input || typeof input !== 'string') {
      return { valid: true, sanitized: '' };
    }

    // Check against security patterns
    for (const [threatType, patterns] of Object.entries(this.patterns)) {
      for (const pattern of patterns) {
        if (pattern.test(input)) {
          return {
            valid: false,
            threat: threatType,
            severity: this.getThreatSeverity(threatType),
            sanitized: this.sanitizeByThreat(input, threatType),
          };
        }
      }
    }

    // Type-specific validation
    return this.validateByType(input, type);
  }

  private getThreatSeverity(
    threat: string
  ): 'low' | 'medium' | 'high' | 'critical' {
    const severityMap: Record<string, 'low' | 'medium' | 'high' | 'critical'> =
      {
        sqlInjection: 'critical',
        xss: 'high',
        pathTraversal: 'high',
        commandInjection: 'critical',
        ldapInjection: 'medium',
        xmlInjection: 'medium',
      };
    return severityMap[threat] || 'low';
  }

  private sanitizeByThreat(input: string, threat: string): string {
    switch (threat) {
      case 'sqlInjection':
        return input.replace(/['"`;\\]/g, '');
      case 'xss':
        return input.replace(/<[^>]*>/g, '').replace(/javascript:/gi, '');
      case 'pathTraversal':
        return input.replace(/\.\.[\/\\]/g, '');
      case 'commandInjection':
        return input.replace(/[;&|`$(){}[\]]/g, '');
      default:
        return input.replace(/[<>"'&]/g, '');
    }
  }

  private validateByType(input: string, type: InputType): ValidationResult {
    const typeValidators: Record<
      InputType,
      (input: string) => ValidationResult
    > = {
      email: input => this.validateEmail(input),
      password: input => this.validatePassword(input),
      text: input => this.validateText(input),
      url: input => this.validateUrl(input),
      filename: input => this.validateFilename(input),
      search: input => this.validateSearch(input),
      json: input => this.validateJson(input),
      sql: input => ({
        valid: false,
        threat: 'sqlInjection',
        severity: 'critical',
      }),
      html: input => this.validateHtml(input),
      xml: input => this.validateXml(input),
    };

    return typeValidators[type]?.(input) || { valid: true, sanitized: input };
  }

  private validateEmail(input: string): ValidationResult {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input) || input.length > 254) {
      return { valid: false, threat: 'invalid_format', severity: 'low' };
    }
    return { valid: true, sanitized: input.toLowerCase().trim() };
  }

  private validatePassword(input: string): ValidationResult {
    if (input.length < 8 || input.length > 128) {
      return { valid: false, threat: 'weak_password', severity: 'medium' };
    }
    return { valid: true, sanitized: input };
  }

  private validateText(input: string): ValidationResult {
    if (input.length > 10000) {
      return { valid: false, threat: 'oversized_input', severity: 'low' };
    }
    return { valid: true, sanitized: input.trim() };
  }

  private validateUrl(input: string): ValidationResult {
    try {
      const url = new URL(input);
      if (!['http:', 'https:'].includes(url.protocol)) {
        return { valid: false, threat: 'invalid_protocol', severity: 'medium' };
      }
      return { valid: true, sanitized: url.toString() };
    } catch {
      return { valid: false, threat: 'invalid_url', severity: 'low' };
    }
  }

  private validateFilename(input: string): ValidationResult {
    const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
    if (invalidChars.test(input) || input.length > 255) {
      return { valid: false, threat: 'invalid_filename', severity: 'medium' };
    }
    return { valid: true, sanitized: input.trim() };
  }

  private validateSearch(input: string): ValidationResult {
    if (input.length > 200) {
      return { valid: false, threat: 'oversized_input', severity: 'low' };
    }
    const sanitized = input.replace(/[^\w\s-]/g, '').trim();
    return { valid: true, sanitized };
  }

  private validateJson(input: string): ValidationResult {
    try {
      JSON.parse(input);
      return { valid: true, sanitized: input };
    } catch {
      return { valid: false, threat: 'invalid_json', severity: 'low' };
    }
  }

  private validateHtml(input: string): ValidationResult {
    // Allow only safe HTML tags
    const allowedTags = ['p', 'br', 'strong', 'em', 'u', 'i'];
    const sanitized = input.replace(
      /<(?!\/?(?:p|br|strong|em|u|i)\b)[^>]*>/gi,
      ''
    );
    return { valid: true, sanitized };
  }

  private validateXml(input: string): ValidationResult {
    // Block XML with external entities
    if (/<!DOCTYPE|<!ENTITY|SYSTEM/gi.test(input)) {
      return { valid: false, threat: 'xmlInjection', severity: 'medium' };
    }
    return { valid: true, sanitized: input };
  }
}

class SecurityService {
  private config: SecurityConfig = {
    enableInputSanitization: true,
    enableRateLimiting: true,
    maxRequestsPerMinute: 60,
    enableSQLInjectionProtection: true,
    enableXSSProtection: true,
    enableCSRFProtection: true,
    enableOWASPValidation: true,
    enablePathTraversalProtection: true,
    enableCommandInjectionProtection: true,
  };

  private rateLimitMap = new Map<string, RateLimitEntry>();
  private violations: SecurityViolation[] = [];
  private owaspValidator = new OWASPSecurityValidator();

  /**
   * Initialize security service
   */
  initialize(config: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...config };
    logger.info('security', 'Security service initialized', {
      config: this.config,
    });
  }

  /**
   * Enhanced OWASP-based input validation
   */
  validateInputEnhanced(input: string, type: InputType): ValidationResult {
    if (!this.config.enableOWASPValidation) {
      return { valid: true, sanitized: input };
    }

    const result = this.owaspValidator.validateInput(input, type);

    if (!result.valid && result.threat) {
      this.reportViolation({
        type: result.threat as any,
        severity: result.severity || 'medium',
        details: `OWASP validation failed: ${result.threat} detected in ${type} input`,
        timestamp: Date.now(),
      });
    }

    return result;
  }

  /**
   * Sanitize user input to prevent XSS and injection attacks
   */
  sanitizeInput(
    input: string,
    options?: { allowHTML?: boolean; maxLength?: number }
  ): string {
    if (!this.config.enableInputSanitization) return input;

    let sanitized = input;

    // Trim whitespace
    sanitized = sanitized.trim();

    // Limit length
    if (options?.maxLength) {
      sanitized = sanitized.substring(0, options.maxLength);
    }

    // Remove or escape HTML if not allowed
    if (!options?.allowHTML) {
      sanitized = this.escapeHTML(sanitized);
    }

    // Remove SQL injection patterns
    if (this.config.enableSQLInjectionProtection) {
      sanitized = this.removeSQLInjectionPatterns(sanitized);
    }

    // Remove XSS patterns
    if (this.config.enableXSSProtection) {
      sanitized = this.removeXSSPatterns(sanitized);
    }

    return sanitized;
  }

  /**
   * Validate and sanitize email input
   */
  sanitizeEmail(email: string): string {
    const sanitized = this.sanitizeInput(email, { maxLength: 254 });

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitized)) {
      this.reportViolation({
        type: 'invalid_input',
        severity: 'low',
        details: 'Invalid email format',
        timestamp: Date.now(),
      });
      throw new Error('Invalid email format');
    }

    return sanitized.toLowerCase();
  }

  /**
   * Validate and sanitize URL input
   */
  sanitizeURL(url: string): string {
    const sanitized = this.sanitizeInput(url, { maxLength: 2048 });

    try {
      const urlObj = new URL(sanitized);

      // Only allow HTTP and HTTPS protocols
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        this.reportViolation({
          type: 'invalid_input',
          severity: 'medium',
          details: `Invalid URL protocol: ${urlObj.protocol}`,
          timestamp: Date.now(),
        });
        throw new Error('Invalid URL protocol');
      }

      return urlObj.toString();
    } catch (error) {
      this.reportViolation({
        type: 'invalid_input',
        severity: 'low',
        details: 'Invalid URL format',
        timestamp: Date.now(),
      });
      throw new Error('Invalid URL format');
    }
  }

  /**
   * Check rate limiting for a given identifier
   */
  checkRateLimit(identifier: string): boolean {
    if (!this.config.enableRateLimiting) return true;

    const now = Date.now();
    const entry = this.rateLimitMap.get(identifier);

    if (!entry) {
      // First request
      this.rateLimitMap.set(identifier, {
        count: 1,
        resetTime: now + 60000, // 1 minute
      });
      return true;
    }

    if (now > entry.resetTime) {
      // Reset window
      entry.count = 1;
      entry.resetTime = now + 60000;
      return true;
    }

    if (entry.count >= this.config.maxRequestsPerMinute) {
      // Rate limit exceeded
      this.reportViolation({
        type: 'rate_limit',
        severity: 'medium',
        details: `Rate limit exceeded: ${entry.count} requests`,
        timestamp: now,
      });
      return false;
    }

    entry.count++;
    return true;
  }

  /**
   * Validate API request headers
   */
  validateHeaders(headers: Record<string, string>): boolean {
    // Check for required security headers
    const requiredHeaders = ['user-agent'];

    for (const header of requiredHeaders) {
      if (!headers[header]) {
        this.reportViolation({
          type: 'invalid_input',
          severity: 'low',
          details: `Missing required header: ${header}`,
          timestamp: Date.now(),
        });
        return false;
      }
    }

    // Validate User-Agent
    const userAgent = headers['user-agent'];
    if (userAgent && this.isSuspiciousUserAgent(userAgent)) {
      this.reportViolation({
        type: 'invalid_input',
        severity: 'medium',
        details: `Suspicious User-Agent: ${userAgent}`,
        userAgent,
        timestamp: Date.now(),
      });
      return false;
    }

    return true;
  }

  /**
   * Escape HTML characters
   */
  private escapeHTML(input: string): string {
    const htmlEscapes: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
    };

    return input.replace(/[&<>"'/]/g, match => htmlEscapes[match]);
  }

  /**
   * Remove SQL injection patterns
   */
  private removeSQLInjectionPatterns(input: string): string {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
      /(--|\/\*|\*\/|;)/g,
      /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
      /('|(\\')|('')|(%27)|(%2527))/g,
    ];

    let sanitized = input;
    sqlPatterns.forEach(pattern => {
      if (pattern.test(sanitized)) {
        this.reportViolation({
          type: 'sql_injection',
          severity: 'high',
          details: `SQL injection pattern detected: ${pattern.source}`,
          timestamp: Date.now(),
        });
        sanitized = sanitized.replace(pattern, '');
      }
    });

    return sanitized;
  }

  /**
   * Remove XSS patterns
   */
  private removeXSSPatterns(input: string): string {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
      /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
    ];

    let sanitized = input;
    xssPatterns.forEach(pattern => {
      if (pattern.test(sanitized)) {
        this.reportViolation({
          type: 'xss',
          severity: 'high',
          details: `XSS pattern detected: ${pattern.source}`,
          timestamp: Date.now(),
        });
        sanitized = sanitized.replace(pattern, '');
      }
    });

    return sanitized;
  }

  /**
   * Check if User-Agent is suspicious
   */
  private isSuspiciousUserAgent(userAgent: string): boolean {
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /java/i,
      /^$/,
    ];

    return suspiciousPatterns.some(pattern => pattern.test(userAgent));
  }

  /**
   * Report security violation
   */
  private reportViolation(violation: SecurityViolation): void {
    this.violations.push(violation);

    // Keep only last 100 violations
    if (this.violations.length > 100) {
      this.violations = this.violations.slice(-100);
    }

    // Log violation
    logger.warn('security', `Security violation: ${violation.type}`, {
      severity: violation.severity,
      details: violation.details,
      userAgent: violation.userAgent,
      ip: violation.ip,
    });
  }

  /**
   * Get recent security violations
   */
  getViolations(count: number = 50): SecurityViolation[] {
    return this.violations.slice(-count);
  }

  /**
   * Clear rate limit for identifier
   */
  clearRateLimit(identifier: string): void {
    this.rateLimitMap.delete(identifier);
  }

  /**
   * Clear all rate limits
   */
  clearAllRateLimits(): void {
    this.rateLimitMap.clear();
  }

  /**
   * Get security statistics
   */
  getSecurityStats(): {
    totalViolations: number;
    violationsByType: Record<string, number>;
    violationsBySeverity: Record<string, number>;
    activeRateLimits: number;
  } {
    const violationsByType: Record<string, number> = {};
    const violationsBySeverity: Record<string, number> = {};

    this.violations.forEach(violation => {
      violationsByType[violation.type] =
        (violationsByType[violation.type] || 0) + 1;
      violationsBySeverity[violation.severity] =
        (violationsBySeverity[violation.severity] || 0) + 1;
    });

    return {
      totalViolations: this.violations.length,
      violationsByType,
      violationsBySeverity,
      activeRateLimits: this.rateLimitMap.size,
    };
  }
}

export const securityService = new SecurityService();

// Export types
export type { SecurityConfig, SecurityViolation };
