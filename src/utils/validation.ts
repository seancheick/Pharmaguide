// src/utils/validation.ts
import { APP_CONFIG } from '../constants';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
}

export interface ValidationOptions {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  allowEmpty?: boolean;
  customPattern?: RegExp;
  customValidator?: (value: string) => ValidationResult;
}

/**
 * Email validation with comprehensive security checks
 */
export const validateEmail = (email: string): ValidationResult => {
  if (!email || email.trim().length === 0) {
    return { isValid: false, error: 'Email is required' };
  }

  const trimmedEmail = email.trim().toLowerCase();

  // Length check
  if (trimmedEmail.length > 254) {
    return { isValid: false, error: 'Email address is too long' };
  }

  // Basic format validation
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!emailRegex.test(trimmedEmail)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /\.{2,}/, // Multiple consecutive dots
    /^\./, // Starting with dot
    /\.$/, // Ending with dot
    /@\./, // @ followed by dot
    /\.@/, // Dot followed by @
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(trimmedEmail)) {
      return { isValid: false, error: 'Email format is invalid' };
    }
  }

  // Domain validation
  const [localPart, domain] = trimmedEmail.split('@');
  
  if (localPart.length > 64) {
    return { isValid: false, error: 'Email local part is too long' };
  }

  if (domain.length > 253) {
    return { isValid: false, error: 'Email domain is too long' };
  }

  return { isValid: true };
};

/**
 * Password validation with security requirements
 */
export const validatePassword = (password: string, confirmPassword?: string): ValidationResult => {
  if (!password) {
    return { isValid: false, error: 'Password is required' };
  }

  const warnings: string[] = [];

  // Length check
  if (password.length < APP_CONFIG.MIN_PASSWORD_LENGTH) {
    return { 
      isValid: false, 
      error: `Password must be at least ${APP_CONFIG.MIN_PASSWORD_LENGTH} characters long` 
    };
  }

  if (password.length > 128) {
    return { isValid: false, error: 'Password is too long (max 128 characters)' };
  }

  // Strength checks
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  let strengthScore = 0;
  if (hasLowercase) strengthScore++;
  if (hasUppercase) strengthScore++;
  if (hasNumbers) strengthScore++;
  if (hasSpecialChars) strengthScore++;

  if (strengthScore < 3) {
    warnings.push('Consider using a mix of uppercase, lowercase, numbers, and special characters');
  }

  // Common password checks
  const commonPasswords = [
    'password', '123456', '123456789', 'qwerty', 'abc123', 
    'password123', 'admin', 'letmein', 'welcome', 'monkey'
  ];

  if (commonPasswords.includes(password.toLowerCase())) {
    return { isValid: false, error: 'This password is too common. Please choose a stronger password.' };
  }

  // Sequential characters check
  if (/(.)\1{2,}/.test(password)) {
    warnings.push('Avoid repeating the same character multiple times');
  }

  // Confirmation check
  if (confirmPassword !== undefined && password !== confirmPassword) {
    return { isValid: false, error: 'Passwords do not match' };
  }

  return { 
    isValid: true, 
    warnings: warnings.length > 0 ? warnings : undefined 
  };
};

/**
 * Generic text validation with sanitization
 */
export const validateText = (
  value: string, 
  fieldName: string, 
  options: ValidationOptions = {}
): ValidationResult => {
  const {
    required = false,
    minLength = 0,
    maxLength = 1000,
    allowEmpty = !required,
    customPattern,
    customValidator
  } = options;

  // Handle empty values
  if (!value || value.trim().length === 0) {
    if (required) {
      return { isValid: false, error: `${fieldName} is required` };
    }
    if (allowEmpty) {
      return { isValid: true };
    }
  }

  const trimmedValue = value.trim();

  // Length validation
  if (trimmedValue.length < minLength) {
    return { 
      isValid: false, 
      error: `${fieldName} must be at least ${minLength} characters long` 
    };
  }

  if (trimmedValue.length > maxLength) {
    return { 
      isValid: false, 
      error: `${fieldName} must be no more than ${maxLength} characters long` 
    };
  }

  // Pattern validation
  if (customPattern && !customPattern.test(trimmedValue)) {
    return { isValid: false, error: `${fieldName} format is invalid` };
  }

  // Custom validation
  if (customValidator) {
    const customResult = customValidator(trimmedValue);
    if (!customResult.isValid) {
      return customResult;
    }
  }

  // XSS prevention - check for suspicious patterns
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  ];

  for (const pattern of xssPatterns) {
    if (pattern.test(trimmedValue)) {
      return { isValid: false, error: `${fieldName} contains invalid characters` };
    }
  }

  return { isValid: true };
};

/**
 * Sanitize text input to prevent XSS and other attacks
 */
export const sanitizeText = (text: string): string => {
  if (!text) return '';
  
  return text
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Validate dosage input for medications/supplements
 */
export const validateDosage = (dosage: string): ValidationResult => {
  if (!dosage || dosage.trim().length === 0) {
    return { isValid: false, error: 'Dosage is required' };
  }

  const trimmedDosage = dosage.trim();

  // Check for reasonable length
  if (trimmedDosage.length > 50) {
    return { isValid: false, error: 'Dosage description is too long' };
  }

  // Allow common dosage patterns
  const dosagePattern = /^[\d.,\s]+(mg|g|ml|l|mcg|iu|units?|tablets?|capsules?|drops?|tsp|tbsp|oz)\s*(daily|twice daily|once daily|as needed|per day|\/day)?$/i;
  
  if (!dosagePattern.test(trimmedDosage)) {
    return { 
      isValid: false, 
      error: 'Please enter a valid dosage (e.g., "500mg daily", "1 tablet twice daily")' 
    };
  }

  return { isValid: true };
};

/**
 * Validate frequency input
 */
export const validateFrequency = (frequency: string): ValidationResult => {
  if (!frequency || frequency.trim().length === 0) {
    return { isValid: false, error: 'Frequency is required' };
  }

  const trimmedFrequency = frequency.trim();

  if (trimmedFrequency.length > 100) {
    return { isValid: false, error: 'Frequency description is too long' };
  }

  // Common frequency patterns
  const validFrequencies = [
    'once daily', 'twice daily', 'three times daily', 'four times daily',
    'every 4 hours', 'every 6 hours', 'every 8 hours', 'every 12 hours',
    'as needed', 'with meals', 'before meals', 'after meals',
    'at bedtime', 'in the morning', 'in the evening'
  ];

  const isCommonFrequency = validFrequencies.some(freq => 
    trimmedFrequency.toLowerCase().includes(freq)
  );

  if (!isCommonFrequency) {
    return {
      isValid: true,
      warnings: ['Consider using standard frequency terms like "once daily" or "twice daily"']
    };
  }

  return { isValid: true };
};
