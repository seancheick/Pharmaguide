// src/services/performance/requestDeduplicator.ts
import { logger } from '../monitoring/logger';
import { performanceMonitor } from '../monitoring/performanceMonitor';

interface RequestMetrics {
  totalRequests: number;
  deduplicatedRequests: number;
  activeRequests: number;
  averageResponseTime: number;
  cacheHitRate: number;
}

interface DeduplicationConfig {
  maxConcurrentRequests: number;
  requestTimeoutMs: number;
  enableMetrics: boolean;
  keyGenerator?: (args: any[]) => string;
}

/**
 * Request Deduplicator Service
 * Prevents duplicate in-flight requests and provides comprehensive metrics
 */
class RequestDeduplicator {
  private pendingRequests = new Map<string, Promise<any>>();
  private requestMetrics = new Map<string, number[]>(); // Response times
  private totalRequests = 0;
  private deduplicatedRequests = 0;
  
  private config: DeduplicationConfig = {
    maxConcurrentRequests: 10,
    requestTimeoutMs: 30000, // 30 seconds
    enableMetrics: true,
  };

  /**
   * Initialize request deduplicator
   */
  initialize(config?: Partial<DeduplicationConfig>): void {
    if (config) {
      this.config = { ...this.config, ...config };
    }

    logger.info('performance', 'Request deduplicator initialized', {
      config: this.config,
    });
  }

  /**
   * Deduplicate requests with comprehensive error handling and metrics
   */
  async deduplicate<T>(
    key: string,
    fn: () => Promise<T>,
    options?: {
      timeout?: number;
      retryOnError?: boolean;
      customKeyGenerator?: (...args: any[]) => string;
    }
  ): Promise<T> {
    const startTime = Date.now();
    const requestId = `${key}_${startTime}`;
    
    this.totalRequests++;

    try {
      // Check if request is already in flight
      const existing = this.pendingRequests.get(key);
      if (existing) {
        this.deduplicatedRequests++;
        
        if (this.config.enableMetrics) {
          logger.debug('performance', 'Request deduplicated', {
            key: key.substring(0, 50) + '...',
            requestId,
            activeRequests: this.pendingRequests.size,
          });
        }

        return existing;
      }

      // Check concurrent request limit
      if (this.pendingRequests.size >= this.config.maxConcurrentRequests) {
        throw new Error(
          `Maximum concurrent requests (${this.config.maxConcurrentRequests}) exceeded`
        );
      }

      // Create new request with timeout
      const timeoutMs = options?.timeout || this.config.requestTimeoutMs;
      const promise = this.createTimeoutPromise(fn, timeoutMs, key);

      // Store pending request
      this.pendingRequests.set(key, promise);

      // Start performance monitoring
      if (this.config.enableMetrics) {
        performanceMonitor.startTiming('request_deduplication', key, { requestId });
      }

      try {
        const result = await promise;
        
        // Record successful response time
        const responseTime = Date.now() - startTime;
        this.recordResponseTime(key, responseTime);

        if (this.config.enableMetrics) {
          performanceMonitor.endTiming('request_deduplication', {
            success: true,
            responseTime,
            requestId,
          });

          logger.debug('performance', 'Request completed successfully', {
            key: key.substring(0, 50) + '...',
            responseTime,
            requestId,
          });
        }

        return result;

      } catch (error) {
        // Record failed response time
        const responseTime = Date.now() - startTime;
        this.recordResponseTime(key, responseTime);

        if (this.config.enableMetrics) {
          performanceMonitor.endTiming('request_deduplication', {
            success: false,
            error: (error as Error).message,
            responseTime,
            requestId,
          });

          logger.warn('performance', 'Request failed', {
            key: key.substring(0, 50) + '...',
            error: (error as Error).message,
            responseTime,
            requestId,
          });
        }

        // Retry logic if enabled
        if (options?.retryOnError && this.shouldRetry(error as Error)) {
          logger.info('performance', 'Retrying failed request', { key, requestId });
          // Remove from pending requests to allow retry
          this.pendingRequests.delete(key);
          // Recursive call for retry (will create new promise)
          return this.deduplicate(key, fn, { ...options, retryOnError: false });
        }

        throw error;
      }

    } finally {
      // Always clean up pending request
      this.pendingRequests.delete(key);
    }
  }

  /**
   * Create a promise with timeout handling
   */
  private createTimeoutPromise<T>(
    fn: () => Promise<T>,
    timeoutMs: number,
    key: string
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      // Set up timeout
      const timeoutId = setTimeout(() => {
        reject(new Error(`Request timeout after ${timeoutMs}ms for key: ${key}`));
      }, timeoutMs);

      // Execute the function
      fn()
        .then(result => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  /**
   * Record response time for metrics
   */
  private recordResponseTime(key: string, responseTime: number): void {
    if (!this.config.enableMetrics) return;

    const keyMetrics = this.requestMetrics.get(key) || [];
    keyMetrics.push(responseTime);
    
    // Keep only last 100 response times per key
    if (keyMetrics.length > 100) {
      keyMetrics.shift();
    }
    
    this.requestMetrics.set(key, keyMetrics);
  }

  /**
   * Determine if a request should be retried
   */
  private shouldRetry(error: Error): boolean {
    const retryableErrors = [
      'network error',
      'timeout',
      'connection refused',
      'service unavailable',
      '503',
      '502',
      '504',
    ];

    const errorMessage = error.message.toLowerCase();
    return retryableErrors.some(retryableError => 
      errorMessage.includes(retryableError)
    );
  }

  /**
   * Get comprehensive request metrics
   */
  getMetrics(): RequestMetrics {
    const responseTimes = Array.from(this.requestMetrics.values()).flat();
    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;

    const cacheHitRate = this.totalRequests > 0 
      ? (this.deduplicatedRequests / this.totalRequests) * 100 
      : 0;

    return {
      totalRequests: this.totalRequests,
      deduplicatedRequests: this.deduplicatedRequests,
      activeRequests: this.pendingRequests.size,
      averageResponseTime: Math.round(averageResponseTime),
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
    };
  }

  /**
   * Get metrics for a specific request key
   */
  getKeyMetrics(key: string): {
    requestCount: number;
    averageResponseTime: number;
    lastResponseTime?: number;
  } {
    const keyMetrics = this.requestMetrics.get(key) || [];
    const averageResponseTime = keyMetrics.length > 0
      ? keyMetrics.reduce((sum, time) => sum + time, 0) / keyMetrics.length
      : 0;

    return {
      requestCount: keyMetrics.length,
      averageResponseTime: Math.round(averageResponseTime),
      lastResponseTime: keyMetrics[keyMetrics.length - 1],
    };
  }

  /**
   * Clear all pending requests (useful for cleanup)
   */
  clearPendingRequests(): void {
    const pendingCount = this.pendingRequests.size;
    this.pendingRequests.clear();
    
    if (pendingCount > 0) {
      logger.info('performance', 'Cleared pending requests', { count: pendingCount });
    }
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.totalRequests = 0;
    this.deduplicatedRequests = 0;
    this.requestMetrics.clear();
    
    logger.info('performance', 'Request deduplication metrics reset');
  }

  /**
   * Check if a request is currently pending
   */
  isPending(key: string): boolean {
    return this.pendingRequests.has(key);
  }

  /**
   * Get all pending request keys
   */
  getPendingKeys(): string[] {
    return Array.from(this.pendingRequests.keys());
  }

  /**
   * Generate a cache key from function arguments
   */
  generateKey(functionName: string, ...args: any[]): string {
    if (this.config.keyGenerator) {
      return this.config.keyGenerator(args);
    }

    // Default key generation
    const argsHash = this.hashArgs(args);
    return `${functionName}_${argsHash}`;
  }

  /**
   * Simple hash function for arguments
   */
  private hashArgs(args: any[]): string {
    const str = JSON.stringify(args, (key, value) => {
      // Handle circular references and functions
      if (typeof value === 'function') return '[Function]';
      if (typeof value === 'object' && value !== null) {
        if (value.constructor === Object || Array.isArray(value)) {
          return value;
        }
        return '[Object]';
      }
      return value;
    });

    // Simple hash function
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Create a deduplication wrapper for a function
   */
  createWrapper<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    functionName?: string
  ): T {
    const name = functionName || fn.name || 'anonymous';
    
    return ((...args: any[]) => {
      const key = this.generateKey(name, ...args);
      return this.deduplicate(key, () => fn(...args));
    }) as T;
  }
}

// Export singleton instance
export const requestDeduplicator = new RequestDeduplicator();
