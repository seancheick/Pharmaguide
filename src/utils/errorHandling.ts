// src/utils/errorHandling.ts

export enum ErrorType {
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NETWORK = 'NETWORK',
  SERVER = 'SERVER',
  CLIENT = 'CLIENT',
  RATE_LIMIT = 'RATE_LIMIT',
  NOT_FOUND = 'NOT_FOUND',
  UNKNOWN = 'UNKNOWN',
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface AppError {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  userMessage: string;
  code?: string;
  details?: Record<string, unknown>;
  timestamp: number;
  userId?: string;
  action?: string;
}

/**
 * Create a standardized error object
 */
export const createError = (
  type: ErrorType,
  severity: ErrorSeverity,
  message: string,
  userMessage: string,
  options: {
    code?: string;
    details?: Record<string, unknown>;
    userId?: string;
    action?: string;
  } = {}
): AppError => {
  return {
    type,
    severity,
    message,
    userMessage,
    code: options.code,
    details: options.details,
    timestamp: Date.now(),
    userId: options.userId,
    action: options.action,
  };
};

/**
 * Type guard: checks if value is an object with a string property
 */
function hasStringProp(
  obj: unknown,
  prop: string
): obj is { [key: string]: string } {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as Record<string, unknown>)[prop] === 'string'
  );
}

/**
 * Type guard: checks if value is an object with a nested object property
 */
function hasNestedProp(
  obj: unknown,
  prop: string
): obj is { [key: string]: unknown } {
  return typeof obj === 'object' && obj !== null && prop in obj;
}

/**
 * Sanitize error message to prevent information leakage
 */
export const sanitizeErrorMessage = (error: unknown): string => {
  if (!error) return 'An unexpected error occurred';

  // If it's already an AppError, return the user message
  if (hasStringProp(error, 'userMessage')) {
    return error.userMessage;
  }

  // Handle common error patterns
  let message = '';
  if (hasStringProp(error, 'message')) {
    message = error.message.toLowerCase();
  } else if (typeof error?.toString === 'function') {
    message = String(error.toString()).toLowerCase();
  }

  // Authentication errors
  if (message.includes('unauthorized') || message.includes('401')) {
    return 'Please sign in to continue';
  }

  if (message.includes('forbidden') || message.includes('403')) {
    return 'You do not have permission to perform this action';
  }

  // Network errors
  if (message.includes('network') || message.includes('fetch')) {
    return 'Network connection error. Please check your internet connection and try again.';
  }

  // Rate limiting
  if (message.includes('rate limit') || message.includes('429')) {
    return 'Too many requests. Please wait a moment and try again.';
  }

  // Server errors
  if (message.includes('500') || message.includes('server error')) {
    return 'Server error. Please try again later.';
  }

  // Validation errors (pass through as they're usually safe)
  if (message.includes('validation') || message.includes('invalid')) {
    return hasStringProp(error, 'message')
      ? error.message
      : 'Invalid input provided';
  }

  // Default safe message
  return 'Something went wrong. Please try again.';
};

/**
 * Handle API errors with proper categorization
 */
export const handleApiError = (
  error: unknown,
  action?: string,
  userId?: string
): AppError => {
  let status: unknown = undefined;
  let message: string = 'Unknown error';
  if (hasStringProp(error, 'message')) {
    message = error.message;
  }
  if (hasNestedProp(error, 'status')) {
    status = (error as { status: unknown }).status;
  } else if (
    hasNestedProp(error, 'response') &&
    hasNestedProp((error as { response: unknown }).response, 'status')
  ) {
    status = (error as { response: { status: unknown } }).response.status;
  }
  if (
    hasNestedProp(error, 'response') &&
    hasNestedProp((error as { response: unknown }).response, 'data') &&
    hasStringProp(
      (error as { response: { data: unknown } }).response.data,
      'message'
    )
  ) {
    message = (error as { response: { data: { message: string } } }).response
      .data.message;
  }

  let type: ErrorType;
  let severity: ErrorSeverity;
  let userMessage: string;

  switch (status) {
    case 400:
      type = ErrorType.VALIDATION;
      severity = ErrorSeverity.LOW;
      userMessage = 'Invalid request. Please check your input and try again.';
      break;
    case 401:
      type = ErrorType.AUTHENTICATION;
      severity = ErrorSeverity.MEDIUM;
      userMessage = 'Please sign in to continue.';
      break;
    case 403:
      type = ErrorType.AUTHORIZATION;
      severity = ErrorSeverity.MEDIUM;
      userMessage = 'You do not have permission to perform this action.';
      break;
    case 404:
      type = ErrorType.NOT_FOUND;
      severity = ErrorSeverity.LOW;
      userMessage = 'The requested resource was not found.';
      break;
    case 429:
      type = ErrorType.RATE_LIMIT;
      severity = ErrorSeverity.MEDIUM;
      userMessage = 'Too many requests. Please wait a moment and try again.';
      break;
    case 500:
    case 502:
    case 503:
    case 504:
      type = ErrorType.SERVER;
      severity = ErrorSeverity.HIGH;
      userMessage = 'Server error. Please try again later.';
      break;
    default:
      if (!status) {
        type = ErrorType.NETWORK;
        severity = ErrorSeverity.MEDIUM;
        userMessage =
          'Network connection error. Please check your internet connection.';
      } else {
        type = ErrorType.UNKNOWN;
        severity = ErrorSeverity.MEDIUM;
        userMessage = 'An unexpected error occurred. Please try again.';
      }
  }

  return createError(type, severity, message, userMessage, {
    code: String(status || 'UNKNOWN'),
    details: { originalError: error },
    userId,
    action,
  });
};

/**
 * Handle validation errors
 */
export const handleValidationError = (
  field: string,
  value: unknown,
  rule: string,
  userId?: string
): AppError => {
  const userMessage = `${field} ${rule}`;

  return createError(
    ErrorType.VALIDATION,
    ErrorSeverity.LOW,
    `Validation failed for ${field}: ${rule}`,
    userMessage,
    {
      code: 'VALIDATION_ERROR',
      details: {
        field,
        value: typeof value === 'string' ? value.substring(0, 100) : value,
        rule,
      },
      userId,
      action: 'validation',
    }
  );
};

/**
 * Handle authentication errors
 */
export const handleAuthError = (error: unknown, userId?: string): AppError => {
  let message = 'Authentication failed';
  if (hasStringProp(error, 'message')) {
    message = error.message;
  }

  let userMessage: string;
  let code: string;

  if (message.includes('email')) {
    userMessage = 'Invalid email address';
    code = 'INVALID_EMAIL';
  } else if (message.includes('password')) {
    userMessage = 'Invalid password';
    code = 'INVALID_PASSWORD';
  } else if (message.includes('user not found')) {
    userMessage = 'No account found with this email address';
    code = 'USER_NOT_FOUND';
  } else if (message.includes('email not confirmed')) {
    userMessage = 'Please confirm your email address before signing in';
    code = 'EMAIL_NOT_CONFIRMED';
  } else {
    userMessage = 'Authentication failed. Please check your credentials.';
    code = 'AUTH_FAILED';
  }

  return createError(
    ErrorType.AUTHENTICATION,
    ErrorSeverity.MEDIUM,
    message,
    userMessage,
    {
      code,
      userId,
      action: 'authentication',
    }
  );
};

/**
 * Log error safely (without sensitive information)
 */
export const logError = (error: AppError): void => {
  const logData = {
    type: error.type,
    severity: error.severity,
    code: error.code,
    timestamp: error.timestamp,
    userId: error.userId ? error.userId.substring(0, 8) + '...' : undefined, // Partial user ID
    action: error.action,
    // Don't log the full message or details in production
    message: __DEV__ ? error.message : 'Error logged',
  };

  if (
    error.severity === ErrorSeverity.CRITICAL ||
    error.severity === ErrorSeverity.HIGH
  ) {
    console.error('App Error:', logData);
  } else {
    console.warn('App Warning:', logData);
  }

  // In production, you would send this to your error tracking service
  // Example: Sentry.captureException(error);
};

/**
 * Create user-friendly error messages for common scenarios
 */
export const getErrorMessage = (error: unknown, context?: string): string => {
  if (!error) return 'An unexpected error occurred';

  // If it's already an AppError, return the user message
  if (hasStringProp(error, 'userMessage')) {
    return error.userMessage;
  }

  // Context-specific messages
  if (context) {
    switch (context) {
      case 'login':
        return 'Unable to sign in. Please check your email and password.';
      case 'signup':
        return 'Unable to create account. Please try again.';
      case 'scan':
        return 'Unable to scan product. Please try again.';
      case 'stack':
        return 'Unable to update your stack. Please try again.';
      case 'analysis':
        return 'Unable to analyze interactions. Please try again.';
      default:
        break;
    }
  }

  return sanitizeErrorMessage(error);
};

/**
 * Retry logic with exponential backoff
 */
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      // Don't retry on certain error types
      let status: unknown = undefined;
      if (hasNestedProp(error, 'status')) {
        status = (error as { status: unknown }).status;
      }
      if (status === 401 || status === 403 || status === 404) {
        throw error;
      }
      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }
      // Exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
};
