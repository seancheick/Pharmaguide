// src/hooks/useAIConsent.ts
// 🔒 HIPAA-COMPLIANT: AI Consent Management Hook
// Manages user consent for AI analysis features

import React, { useState, useEffect, useCallback } from 'react';
import { localHealthProfileService } from '../services/health/localHealthProfileService';
import { useAuth } from './useAuth';

interface AIConsentState {
  hasConsent: boolean;
  isLoading: boolean;
  error: string | null;
  showConsentModal: boolean;
}

/**
 * Hook for managing AI analysis consent
 * - Checks consent before AI operations
 * - Shows consent modal when needed
 * - Stores consent locally only (HIPAA compliant)
 */
export const useAIConsent = () => {
  const { user } = useAuth();
  const [state, setState] = useState<AIConsentState>({
    hasConsent: false,
    isLoading: true,
    error: null,
    showConsentModal: false,
  });

  /**
   * Load current consent status
   */
  const loadConsentStatus = useCallback(async () => {
    if (!user?.id) {
      setState(prev => ({ ...prev, isLoading: false, hasConsent: false }));
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const hasConsent = await localHealthProfileService.hasAIConsent(user.id);

      setState(prev => ({
        ...prev,
        hasConsent,
        isLoading: false,
      }));
    } catch (error) {
      console.error('❌ Failed to load AI consent status:', error);
      setState(prev => ({
        ...prev,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to load consent status',
        isLoading: false,
        hasConsent: false, // Default to no consent for safety
      }));
    }
  }, [user?.id]);

  /**
   * Update consent status
   */
  const updateConsent = useCallback(
    async (hasConsent: boolean) => {
      if (!user?.id) return;

      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        await localHealthProfileService.updateAIConsent(user.id, hasConsent);

        setState(prev => ({
          ...prev,
          hasConsent,
          isLoading: false,
          showConsentModal: false,
        }));

        console.log(`✅ AI consent updated: ${hasConsent}`);
      } catch (error) {
        console.error('❌ Failed to update AI consent:', error);
        setState(prev => ({
          ...prev,
          error:
            error instanceof Error ? error.message : 'Failed to update consent',
          isLoading: false,
        }));
      }
    },
    [user?.id]
  );

  /**
   * Request AI analysis with consent check
   * Returns true if analysis can proceed, false if consent needed
   */
  const requestAIAnalysis = useCallback(async (): Promise<boolean> => {
    if (!user?.id) {
      setState(prev => ({ ...prev, error: 'User not logged in' }));
      return false;
    }

    // First check the current state to avoid unnecessary API calls
    if (state.hasConsent) {
      return true; // Can proceed with AI analysis
    }

    try {
      // Only check storage if we don't have consent in state
      const hasConsent = await localHealthProfileService.hasAIConsent(user.id);

      if (hasConsent) {
        // Update state to reflect consent
        setState(prev => ({ ...prev, hasConsent: true }));
        return true; // Can proceed with AI analysis
      } else {
        // Show consent modal
        setState(prev => ({ ...prev, showConsentModal: true }));
        return false; // Cannot proceed until consent given
      }
    } catch (error) {
      console.error('❌ Failed to check AI consent:', error);
      setState(prev => ({
        ...prev,
        error:
          error instanceof Error ? error.message : 'Failed to check consent',
      }));
      return false;
    }
  }, [user?.id, state.hasConsent]);

  // Note: showConsentModal function removed as it's not used

  /**
   * Hide consent modal
   */
  const hideConsentModal = useCallback(() => {
    setState(prev => ({ ...prev, showConsentModal: false }));
  }, []);

  /**
   * Reset error state
   */
  const resetError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  /**
   * Get consent status for display
   */
  const getConsentStatus = useCallback(() => {
    if (state.isLoading) return 'loading';
    if (state.error) return 'error';
    if (state.hasConsent) return 'granted';
    return 'not_granted';
  }, [state.hasConsent, state.isLoading, state.error]);

  /**
   * Check if AI features should be available
   */
  const canUseAI = useCallback(() => {
    return !state.isLoading && !state.error && state.hasConsent;
  }, [state.hasConsent, state.isLoading, state.error]);

  // Load consent status on mount and user change
  useEffect(() => {
    loadConsentStatus();
  }, [loadConsentStatus]);

  return {
    // State
    hasConsent: state.hasConsent,
    isLoading: state.isLoading,
    error: state.error,
    showConsentModal: state.showConsentModal,

    // Actions
    updateConsent,
    requestAIAnalysis,
    hideConsentModal,
    resetError,
    loadConsentStatus,

    // Computed
    consentStatus: getConsentStatus(),
    canUseAI: canUseAI(),

    // User info for modal
    userId: user?.id || '',
  };
};

/**
 * Higher-order component for protecting AI features
 */
export const withAIConsent = <P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> => {
  return (props: P) => {
    const { canUseAI, requestAIAnalysis } = useAIConsent();

    // If AI consent not granted, show consent request
    if (!canUseAI) {
      // This would trigger the consent modal
      requestAIAnalysis();
      return null; // Or return a placeholder component
    }

    return React.createElement(Component, props);
  };
};

/**
 * Error types for AI consent
 */
export const AIConsentErrors = {
  CONSENT_REQUIRED: 'AI_CONSENT_REQUIRED',
  USER_NOT_LOGGED_IN: 'USER_NOT_LOGGED_IN',
  CONSENT_UPDATE_FAILED: 'CONSENT_UPDATE_FAILED',
  CONSENT_CHECK_FAILED: 'CONSENT_CHECK_FAILED',
} as const;

/**
 * Utility function to check if error is consent-related
 */
export const isConsentError = (error: Error): boolean => {
  return error.message === AIConsentErrors.CONSENT_REQUIRED;
};

/**
 * Utility function to handle AI consent errors
 */
export const handleAIConsentError = (
  error: Error,
  showConsentModal: () => void
): boolean => {
  if (isConsentError(error)) {
    showConsentModal();
    return true; // Error handled
  }
  return false; // Error not handled
};
