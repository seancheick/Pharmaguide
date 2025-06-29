// src/utils/retryWithBackoff.ts
// Exponential backoff retry utility for improved reliability

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  jitter?: boolean;
  retryCondition?: (error: any) => boolean;
  onRetry?: (error: any, attempt: number) => void;
}

export interface RetryResult<T> {
  result: T;
  attempts: number;
  totalTime: number;
}

/**
 * Default retry condition - retry on network errors and 5xx server errors
 */
const defaultRetryCondition = (error: any): boolean => {
  // Network errors
  if (error.code === 'NETWORK_ERROR' || error.message?.includes('network')) {
    return true;
  }
  
  // HTTP 5xx errors (server errors)
  if (error.status >= 500 && error.status < 600) {
    return true;
  }
  
  // Rate limiting (429)
  if (error.status === 429) {
    return true;
  }
  
  // Timeout errors
  if (error.code === 'TIMEOUT' || error.message?.includes('timeout')) {
    return true;
  }
  
  // Supabase function errors that should be retried
  if (error.message?.includes('Function returned an error') && 
      !error.message?.includes('400')) {
    return true;
  }
  
  return false;
};

/**
 * Add jitter to delay to prevent thundering herd
 */
const addJitter = (delay: number): number => {
  return delay + Math.random() * delay * 0.1; // ±10% jitter
};

/**
 * Calculate delay with exponential backoff
 */
const calculateDelay = (
  attempt: number, 
  baseDelay: number, 
  maxDelay: number, 
  multiplier: number,
  jitter: boolean
): number => {
  let delay = baseDelay * Math.pow(multiplier, attempt);
  delay = Math.min(delay, maxDelay);
  
  if (jitter) {
    delay = addJitter(delay);
  }
  
  return delay;
};

/**
 * Retry function with exponential backoff and jitter
 * 
 * @param fn - Async function to retry
 * @param options - Retry configuration options
 * @returns Promise with result and metadata
 * 
 * @example
 * ```typescript
 * const result = await retryWithBackoff(
 *   () => aiService.analyzeProduct(product),
 *   {
 *     maxRetries: 3,
 *     baseDelay: 1000,
 *     maxDelay: 10000,
 *     onRetry: (error, attempt) => console.log(`Retry ${attempt}: ${error.message}`)
 *   }
 * );
 * ```
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    backoffMultiplier = 2,
    jitter = true,
    retryCondition = defaultRetryCondition,
    onRetry,
  } = options;

  const startTime = Date.now();
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn();
      return {
        result,
        attempts: attempt + 1,
        totalTime: Date.now() - startTime,
      };
    } catch (error) {
      lastError = error;
      
      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break;
      }
      
      // Check if we should retry this error
      if (!retryCondition(error)) {
        break;
      }
      
      // Calculate delay for next attempt
      const delay = calculateDelay(
        attempt, 
        baseDelay, 
        maxDelay, 
        backoffMultiplier, 
        jitter
      );
      
      // Call retry callback if provided
      if (onRetry) {
        onRetry(error, attempt + 1);
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // All retries exhausted
  throw new Error(
    `Operation failed after ${maxRetries + 1} attempts. Last error: ${lastError?.message || lastError}`
  );
}

/**
 * Create a retryable version of a function with predefined options
 */
export function createRetryableFunction<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  options: RetryOptions = {}
) {
  return async (...args: T): Promise<R> => {
    const result = await retryWithBackoff(() => fn(...args), options);
    return result.result;
  };
}

/**
 * Specific retry configurations for different service types
 */
export const RetryConfigs = {
  // AI services - can tolerate longer delays
  aiService: {
    maxRetries: 3,
    baseDelay: 2000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    jitter: true,
  },
  
  // Database operations - should be faster
  database: {
    maxRetries: 2,
    baseDelay: 500,
    maxDelay: 5000,
    backoffMultiplier: 2,
    jitter: true,
  },
  
  // Product API - external service
  productApi: {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 15000,
    backoffMultiplier: 1.5,
    jitter: true,
  },
  
  // Critical operations - more aggressive retries
  critical: {
    maxRetries: 5,
    baseDelay: 1000,
    maxDelay: 60000,
    backoffMultiplier: 1.8,
    jitter: true,
  },
} as const;

/**
 * Circuit breaker pattern for preventing cascading failures
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  constructor(
    private failureThreshold = 5,
    private recoveryTimeout = 60000 // 1 minute
  ) {}
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }
    
    try {
      const result = await fn();
      
      if (this.state === 'HALF_OPEN') {
        this.state = 'CLOSED';
        this.failures = 0;
      }
      
      return result;
    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();
      
      if (this.failures >= this.failureThreshold) {
        this.state = 'OPEN';
      }
      
      throw error;
    }
  }
  
  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime,
    };
  }
}