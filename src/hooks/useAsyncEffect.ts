// src/hooks/useAsyncEffect.ts
import React, { useEffect, useRef, useCallback, useState } from 'react';

/**
 * Hook for handling async operations with automatic cleanup
 * Prevents memory leaks from async operations that complete after component unmount
 */
export const useAsyncEffect = (
  asyncFunction: (signal: AbortSignal) => Promise<void>,
  dependencies: React.DependencyList
) => {
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Create new AbortController for this effect
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    // Execute async function
    asyncFunction(signal).catch(error => {
      // Only log errors that aren't from aborted operations
      if (!signal.aborted) {
        console.error('Async effect error:', error);
      }
    });

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, dependencies);

  // Return abort function for manual cancellation
  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  return { abort };
};

/**
 * Hook for managing multiple async operations with cleanup
 */
export const useAsyncOperations = () => {
  const operationsRef = useRef<Map<string, AbortController>>(new Map());

  const startOperation = useCallback(
    async (
      key: string,
      asyncFunction: (signal: AbortSignal) => Promise<void>
    ) => {
      // Cancel existing operation with same key
      const existingController = operationsRef.current.get(key);
      if (existingController) {
        existingController.abort();
      }

      // Create new controller
      const controller = new AbortController();
      operationsRef.current.set(key, controller);

      try {
        await asyncFunction(controller.signal);
      } catch (error: any) {
        if (!controller.signal.aborted) {
          console.error(`Async operation '${key}' error:`, error);
          throw error;
        }
      } finally {
        // Clean up completed operation
        if (operationsRef.current.get(key) === controller) {
          operationsRef.current.delete(key);
        }
      }
    },
    []
  );

  const cancelOperation = useCallback((key: string) => {
    const controller = operationsRef.current.get(key);
    if (controller) {
      controller.abort();
      operationsRef.current.delete(key);
    }
  }, []);

  const cancelAllOperations = useCallback(() => {
    operationsRef.current.forEach(controller => {
      controller.abort();
    });
    operationsRef.current.clear();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAllOperations();
    };
  }, [cancelAllOperations]);

  return {
    startOperation,
    cancelOperation,
    cancelAllOperations,
  };
};

/**
 * Hook for debounced async operations with cleanup
 */
export const useDebouncedAsyncEffect = (
  asyncFunction: (signal: AbortSignal) => Promise<void>,
  dependencies: React.DependencyList,
  delay: number = 300
) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Abort existing operation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      asyncFunction(signal).catch(error => {
        if (!signal.aborted) {
          console.error('Debounced async effect error:', error);
        }
      });
    }, delay);

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [...dependencies, delay]);
};

/**
 * Hook for managing subscriptions with automatic cleanup
 */
export const useSubscription = <T>(
  subscribe: (callback: (data: T) => void) => () => void,
  dependencies: React.DependencyList = []
) => {
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const callbackRef = useRef<((data: T) => void) | null>(null);

  const setCallback = useCallback((callback: (data: T) => void) => {
    callbackRef.current = callback;
  }, []);

  useEffect(() => {
    // Unsubscribe from previous subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    // Create new subscription
    unsubscribeRef.current = subscribe((data: T) => {
      if (callbackRef.current) {
        callbackRef.current(data);
      }
    });

    // Cleanup function
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, dependencies);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  return { setCallback };
};

/**
 * Hook for safe async state updates
 */
export const useSafeAsyncState = <T>(initialState: T) => {
  const [state, setState] = useState<T>(initialState);
  const mountedRef = useRef(true);

  const setSafeState = useCallback((newState: T | ((prevState: T) => T)) => {
    if (mountedRef.current) {
      setState(newState);
    }
  }, []);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return [state, setSafeState] as const;
};
