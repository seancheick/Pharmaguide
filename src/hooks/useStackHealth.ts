// src/hooks/useStackHealth.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { useStackStore } from '../stores/stackStore';
import { useStackAnalysis } from './useStackAnalysis';
import type { StackInteractionResult } from '../types';

interface StackHealthData {
  analysis: StackInteractionResult | null;
  loading: boolean;
  error: string | null;
  refreshAnalysis: () => Promise<void>;
}

export const useStackHealth = (): StackHealthData => {
  const stackStore = useStackStore();
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout>();
  const lastStackLengthRef = useRef<number>(0);

  // Safely destructure with fallbacks
  const stack = stackStore?.stack || [];
  const initialized = stackStore?.initialized || false;
  const storeLoading = stackStore?.loading || false;

  // Use stack analysis with proper parameters
  const { analysis, analyzing, analyzeStack } = useStackAnalysis({
    stack,
    initialized,
    storeLoading,
  });

  const refreshAnalysis = useCallback(async () => {
    try {
      setError(null);
      await analyzeStack();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze stack');
    }
  }, [analyzeStack]);

  // Auto-refresh analysis when stack changes (with debounce and change detection)
  useEffect(() => {
    // Only analyze if stack actually changed in length or if it's the first time
    if (
      initialized &&
      stack.length > 0 &&
      stack.length !== lastStackLengthRef.current
    ) {
      // Clear any existing debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      // Debounce the analysis to prevent rapid-fire calls
      debounceRef.current = setTimeout(() => {
        refreshAnalysis();
        lastStackLengthRef.current = stack.length;
      }, 500); // 500ms debounce
    } else if (stack.length === 0) {
      // Reset when stack is empty
      lastStackLengthRef.current = 0;
    }

    // Cleanup debounce on unmount
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [stack.length, initialized, refreshAnalysis]);

  return {
    analysis,
    loading: analyzing,
    error,
    refreshAnalysis,
  };
};
