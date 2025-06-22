// src/utils/sanitization.ts

/**
 * Comprehensive data sanitization utilities for security and data integrity
 */

export interface SanitizationOptions {
  allowHtml?: boolean;
  maxLength?: number;
  preserveNewlines?: boolean;
  allowedTags?: string[];
  removeEmojis?: boolean;
}

/**
 * Sanitize text input to prevent XSS and other security issues
 */
export const sanitizeText = (
  input: string | null | undefined,
  options: SanitizationOptions = {}
): string => {
  if (!input) return '';

  const {
    allowHtml = false,
    maxLength = 10000,
    preserveNewlines = true,
    allowedTags = [],
    removeEmojis = false,
  } = options;

  let sanitized = String(input).trim();

  // Length limit
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  // Remove or escape HTML if not allowed
  if (!allowHtml) {
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  } else {
    // If HTML is allowed, only allow specific tags
    const tagPattern = new RegExp(`<(?!\/?(?:${allowedTags.join('|')})\s*\/?>)[^>]+>`, 'gi');
    sanitized = sanitized.replace(tagPattern, '');
  }

  // Remove dangerous protocols
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/data:/gi, '');
  sanitized = sanitized.replace(/vbscript:/gi, '');

  // Remove event handlers
  sanitized = sanitized.replace(/on\w+\s*=/gi, '');

  // Handle newlines
  if (!preserveNewlines) {
    sanitized = sanitized.replace(/\r?\n/g, ' ');
  }

  // Remove emojis if requested
  if (removeEmojis) {
    sanitized = sanitized.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '');
  }

  // Remove excessive whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim();

  return sanitized;
};

/**
 * Sanitize email addresses
 */
export const sanitizeEmail = (email: string | null | undefined): string => {
  if (!email) return '';
  
  return String(email)
    .trim()
    .toLowerCase()
    .replace(/[^\w@.-]/g, '') // Only allow word chars, @, ., and -
    .substring(0, 254); // RFC 5321 limit
};

/**
 * Sanitize numeric input
 */
export const sanitizeNumber = (
  input: string | number | null | undefined,
  options: { min?: number; max?: number; decimals?: number } = {}
): number | null => {
  if (input === null || input === undefined || input === '') return null;

  const { min, max, decimals } = options;
  let num = typeof input === 'number' ? input : parseFloat(String(input).replace(/[^\d.-]/g, ''));

  if (isNaN(num)) return null;

  // Apply decimal places
  if (typeof decimals === 'number') {
    num = parseFloat(num.toFixed(decimals));
  }

  // Apply bounds
  if (typeof min === 'number' && num < min) num = min;
  if (typeof max === 'number' && num > max) num = max;

  return num;
};

/**
 * Sanitize URL input
 */
export const sanitizeUrl = (url: string | null | undefined): string => {
  if (!url) return '';

  let sanitized = String(url).trim();

  // Remove dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:', 'ftp:'];
  for (const protocol of dangerousProtocols) {
    if (sanitized.toLowerCase().startsWith(protocol)) {
      return '';
    }
  }

  // Ensure safe protocols
  if (!/^https?:\/\//i.test(sanitized) && sanitized.length > 0) {
    sanitized = `https://${sanitized}`;
  }

  // Basic URL validation
  try {
    new URL(sanitized);
    return sanitized;
  } catch {
    return '';
  }
};

/**
 * Sanitize object properties recursively
 */
export const sanitizeObject = <T extends Record<string, any>>(
  obj: T,
  options: SanitizationOptions = {}
): T => {
  if (!obj || typeof obj !== 'object') return obj;

  const sanitized = { ...obj };

  Object.keys(sanitized).forEach(key => {
    const value = sanitized[key];

    if (typeof value === 'string') {
      sanitized[key] = sanitizeText(value, options);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' 
          ? sanitizeText(item, options)
          : typeof item === 'object' 
            ? sanitizeObject(item, options)
            : item
      );
    } else if (value && typeof value === 'object') {
      sanitized[key] = sanitizeObject(value, options);
    }
  });

  return sanitized;
};

/**
 * Sanitize API response data
 */
export const sanitizeApiResponse = <T>(data: T): T => {
  if (!data) return data;

  // For arrays
  if (Array.isArray(data)) {
    return data.map(item => sanitizeApiResponse(item)) as T;
  }

  // For objects
  if (typeof data === 'object' && data !== null) {
    return sanitizeObject(data as Record<string, any>, {
      allowHtml: false,
      maxLength: 5000,
      preserveNewlines: true,
    }) as T;
  }

  // For strings
  if (typeof data === 'string') {
    return sanitizeText(data, {
      allowHtml: false,
      maxLength: 5000,
      preserveNewlines: true,
    }) as T;
  }

  return data;
};

/**
 * Sanitize user input for storage
 */
export const sanitizeUserInput = (input: Record<string, any>): Record<string, any> => {
  return sanitizeObject(input, {
    allowHtml: false,
    maxLength: 1000,
    preserveNewlines: true,
    removeEmojis: false,
  });
};

/**
 * Sanitize search query
 */
export const sanitizeSearchQuery = (query: string | null | undefined): string => {
  if (!query) return '';

  return sanitizeText(query, {
    allowHtml: false,
    maxLength: 200,
    preserveNewlines: false,
    removeEmojis: true,
  })
    .replace(/[^\w\s-]/g, '') // Only allow word chars, spaces, and hyphens
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Sanitize file name
 */
export const sanitizeFileName = (fileName: string | null | undefined): string => {
  if (!fileName) return '';

  return String(fileName)
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace invalid chars with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^[._-]+|[._-]+$/g, '') // Remove leading/trailing special chars
    .substring(0, 255); // Limit length
};

/**
 * Sanitize medication/supplement data
 */
export const sanitizeMedicationData = (data: {
  name?: string;
  brand?: string;
  dosage?: string;
  frequency?: string;
  notes?: string;
}): typeof data => {
  return {
    name: sanitizeText(data.name, { maxLength: 200 }),
    brand: sanitizeText(data.brand, { maxLength: 100 }),
    dosage: sanitizeText(data.dosage, { maxLength: 100 }),
    frequency: sanitizeText(data.frequency, { maxLength: 100 }),
    notes: sanitizeText(data.notes, { maxLength: 1000, preserveNewlines: true }),
  };
};

/**
 * Rate limiting helper - sanitize and validate rate limit data
 */
export const sanitizeRateLimitData = (data: {
  userId?: string;
  action?: string;
  timestamp?: number;
}): typeof data => {
  return {
    userId: sanitizeText(data.userId, { maxLength: 50, allowHtml: false }),
    action: sanitizeText(data.action, { maxLength: 50, allowHtml: false }),
    timestamp: sanitizeNumber(data.timestamp, { min: 0 }) || Date.now(),
  };
};
