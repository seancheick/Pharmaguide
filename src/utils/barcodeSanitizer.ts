// src/utils/barcodeSanitizer.ts
import { logger } from '../services/monitoring/logger';
import { securityService } from '../services/security/securityService';

interface BarcodeSanitizationResult {
  isValid: boolean;
  sanitized: string;
  originalFormat?: string;
  detectedFormat?: 'EAN-8' | 'EAN-13' | 'UPC-A' | 'UPC-E' | 'ITF-14' | 'CODE-128' | 'UNKNOWN';
  securityWarnings?: string[];
  error?: string;
}

/**
 * Enhanced Barcode Sanitizer with comprehensive security validation
 * Builds on your existing validation with additional security patterns
 */
export class BarcodeSanitizer {
  // Valid barcode patterns for different formats
  private static readonly BARCODE_PATTERNS = {
    'EAN-8': /^[0-9]{8}$/,
    'EAN-13': /^[0-9]{13}$/,
    'UPC-A': /^[0-9]{12}$/,
    'UPC-E': /^[0-9]{8}$/,
    'ITF-14': /^[0-9]{14}$/,
    'CODE-128': /^[0-9A-Za-z\-\.\s]{1,48}$/,
  };

  // Security threat patterns (enhanced from your existing patterns)
  private static readonly SECURITY_PATTERNS = {
    sqlInjection: [
      /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/gi,
      /('|(--)|(\|)|(\*)|(%27)|(%2D%2D)|(%7C)|(%2A))/gi,
      /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/gi,
      /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/gi,
    ],
    xss: [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      /(alert|confirm|prompt|eval)\s*\(/gi,
    ],
    pathTraversal: [
      /\.\.[\/\\]/g,
      /\.\.\%2f/gi,
      /\.\.\%5c/gi,
      /(\.\.\/){2,}/g,
    ],
    commandInjection: [
      /[;&|`$(){}[\]]/g,
      /\b(cat|ls|pwd|whoami|id|uname|ps|netstat|ifconfig|ping|wget|curl)\b/gi,
      /(\||;|&|`|\$\(|\$\{)/g,
    ],
    urlEncoded: [
      /%[0-9a-fA-F]{2}/g, // URL encoded characters
    ],
    suspiciousChars: [
      /[<>"'&]/g, // HTML/XML special characters
      /[\x00-\x1f\x7f-\x9f]/g, // Control characters
    ],
  };

  /**
   * Comprehensive barcode sanitization and validation
   */
  static sanitize(barcode: string | null | undefined): BarcodeSanitizationResult {
    if (!barcode || typeof barcode !== 'string') {
      return {
        isValid: false,
        sanitized: '',
        error: 'Barcode is required and must be a string',
      };
    }

    const originalFormat = barcode;
    const securityWarnings: string[] = [];

    try {
      // Step 1: Security validation using enhanced OWASP patterns
      const securityResult = securityService.validateInputEnhanced(barcode, 'text');
      if (!securityResult.valid && securityResult.threat) {
        securityWarnings.push(`Security threat detected: ${securityResult.threat}`);
        logger.warn('security', 'Barcode security validation failed', {
          barcode: barcode.substring(0, 10) + '...',
          threat: securityResult.threat,
          severity: securityResult.severity,
        });
      }

      // Step 2: Check for specific security patterns
      for (const [threatType, patterns] of Object.entries(this.SECURITY_PATTERNS)) {
        for (const pattern of patterns) {
          if (pattern.test(barcode)) {
            securityWarnings.push(`${threatType} pattern detected`);
            logger.warn('security', 'Barcode contains suspicious pattern', {
              barcode: barcode.substring(0, 10) + '...',
              threatType,
            });
          }
        }
      }

      // Step 3: Basic sanitization - remove common formatting characters
      let sanitized = barcode
        .replace(/[\s\-_]/g, '') // Remove spaces, hyphens, underscores
        .replace(/[^\w]/g, '') // Remove non-word characters
        .trim()
        .toUpperCase();

      // Step 4: Length validation
      if (sanitized.length === 0) {
        return {
          isValid: false,
          sanitized: '',
          originalFormat,
          securityWarnings,
          error: 'Barcode cannot be empty after sanitization',
        };
      }

      if (sanitized.length > 48) { // CODE-128 max length
        return {
          isValid: false,
          sanitized: sanitized.substring(0, 48),
          originalFormat,
          securityWarnings,
          error: 'Barcode too long (max 48 characters)',
        };
      }

      // Step 5: Format detection and validation
      const detectedFormat = this.detectBarcodeFormat(sanitized);
      
      // Step 6: Format-specific validation
      const formatValidation = this.validateBarcodeFormat(sanitized, detectedFormat);
      if (!formatValidation.isValid) {
        return {
          isValid: false,
          sanitized,
          originalFormat,
          detectedFormat,
          securityWarnings,
          error: formatValidation.error,
        };
      }

      // Step 7: Checksum validation for supported formats
      const checksumValidation = this.validateChecksum(sanitized, detectedFormat);
      if (!checksumValidation.isValid) {
        // Don't fail on checksum errors, but warn
        securityWarnings.push(checksumValidation.error || 'Checksum validation failed');
      }

      logger.debug('barcode', 'Barcode sanitization successful', {
        original: originalFormat.substring(0, 10) + '...',
        sanitized: sanitized.substring(0, 10) + '...',
        format: detectedFormat,
        securityWarnings: securityWarnings.length,
      });

      return {
        isValid: true,
        sanitized,
        originalFormat,
        detectedFormat,
        securityWarnings: securityWarnings.length > 0 ? securityWarnings : undefined,
      };

    } catch (error) {
      logger.error('barcode', 'Barcode sanitization failed', error, {
        barcode: barcode.substring(0, 10) + '...',
      });

      return {
        isValid: false,
        sanitized: '',
        originalFormat,
        securityWarnings,
        error: `Sanitization failed: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Detect barcode format based on pattern matching
   */
  private static detectBarcodeFormat(barcode: string): BarcodeSanitizationResult['detectedFormat'] {
    // Check numeric formats first (most common)
    if (this.BARCODE_PATTERNS['EAN-13'].test(barcode)) return 'EAN-13';
    if (this.BARCODE_PATTERNS['UPC-A'].test(barcode)) return 'UPC-A';
    if (this.BARCODE_PATTERNS['ITF-14'].test(barcode)) return 'ITF-14';
    if (this.BARCODE_PATTERNS['EAN-8'].test(barcode)) return 'EAN-8';
    if (this.BARCODE_PATTERNS['UPC-E'].test(barcode)) return 'UPC-E';
    
    // Check alphanumeric formats
    if (this.BARCODE_PATTERNS['CODE-128'].test(barcode)) return 'CODE-128';
    
    return 'UNKNOWN';
  }

  /**
   * Validate barcode against format-specific rules
   */
  private static validateBarcodeFormat(
    barcode: string, 
    format: BarcodeSanitizationResult['detectedFormat']
  ): { isValid: boolean; error?: string } {
    if (format === 'UNKNOWN') {
      return {
        isValid: false,
        error: 'Unrecognized barcode format',
      };
    }

    const pattern = this.BARCODE_PATTERNS[format];
    if (!pattern.test(barcode)) {
      return {
        isValid: false,
        error: `Invalid ${format} format`,
      };
    }

    return { isValid: true };
  }

  /**
   * Validate checksum for supported formats (builds on your existing validation)
   */
  private static validateChecksum(
    barcode: string, 
    format: BarcodeSanitizationResult['detectedFormat']
  ): { isValid: boolean; error?: string } {
    try {
      switch (format) {
        case 'EAN-13':
        case 'UPC-A':
          return this.validateEANChecksum(barcode);
        case 'EAN-8':
          return this.validateEAN8Checksum(barcode);
        default:
          // No checksum validation for other formats
          return { isValid: true };
      }
    } catch (error) {
      return {
        isValid: false,
        error: `Checksum validation error: ${(error as Error).message}`,
      };
    }
  }

  /**
   * EAN-13/UPC-A checksum validation (enhanced from your existing method)
   */
  private static validateEANChecksum(barcode: string): { isValid: boolean; error?: string } {
    if (barcode.length !== 13 && barcode.length !== 12) {
      return { isValid: false, error: 'Invalid length for EAN/UPC checksum' };
    }

    // Convert UPC-A to EAN-13 format for validation
    const ean13 = barcode.length === 12 ? '0' + barcode : barcode;
    
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(ean13[i], 10);
      if (isNaN(digit)) {
        return { isValid: false, error: 'Non-numeric character in barcode' };
      }
      sum += digit * (i % 2 === 0 ? 1 : 3);
    }

    const checkDigit = (10 - (sum % 10)) % 10;
    const providedCheckDigit = parseInt(ean13[12], 10);

    if (checkDigit !== providedCheckDigit) {
      return { 
        isValid: false, 
        error: `Invalid checksum: expected ${checkDigit}, got ${providedCheckDigit}` 
      };
    }

    return { isValid: true };
  }

  /**
   * EAN-8 checksum validation
   */
  private static validateEAN8Checksum(barcode: string): { isValid: boolean; error?: string } {
    if (barcode.length !== 8) {
      return { isValid: false, error: 'Invalid length for EAN-8 checksum' };
    }

    let sum = 0;
    for (let i = 0; i < 7; i++) {
      const digit = parseInt(barcode[i], 10);
      if (isNaN(digit)) {
        return { isValid: false, error: 'Non-numeric character in barcode' };
      }
      sum += digit * (i % 2 === 0 ? 1 : 3);
    }

    const checkDigit = (10 - (sum % 10)) % 10;
    const providedCheckDigit = parseInt(barcode[7], 10);

    if (checkDigit !== providedCheckDigit) {
      return { 
        isValid: false, 
        error: `Invalid EAN-8 checksum: expected ${checkDigit}, got ${providedCheckDigit}` 
      };
    }

    return { isValid: true };
  }

  /**
   * Quick validation for common use cases
   */
  static isValidBarcode(barcode: string): boolean {
    const result = this.sanitize(barcode);
    return result.isValid && (!result.securityWarnings || result.securityWarnings.length === 0);
  }

  /**
   * Get sanitized barcode or throw error
   */
  static getSanitizedBarcode(barcode: string): string {
    const result = this.sanitize(barcode);
    if (!result.isValid) {
      throw new Error(result.error || 'Invalid barcode');
    }
    return result.sanitized;
  }
}
