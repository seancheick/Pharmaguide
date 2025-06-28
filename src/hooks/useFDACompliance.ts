// src/hooks/useFDACompliance.ts
import { useState, useCallback } from 'react';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV({
  id: 'fda-compliance',
  encryptionKey: 'fda-compliance-key',
});

interface FDAConsentState {
  hasConsentedToAIAnalysis: boolean;
  hasConsentedToInteractionCheck: boolean;
  hasConsentedToRecommendations: boolean;
  lastConsentDate: string | null;
  consentVersion: string;
}

interface FDAComplianceHook {
  consentState: FDAConsentState;
  showComplianceModal: boolean;
  pendingAnalysisType: 'ai_analysis' | 'interaction_check' | 'recommendation' | null;
  
  // Consent management
  requestConsent: (type: 'ai_analysis' | 'interaction_check' | 'recommendation') => Promise<boolean>;
  grantConsent: (type: 'ai_analysis' | 'interaction_check' | 'recommendation') => void;
  revokeConsent: (type: 'ai_analysis' | 'interaction_check' | 'recommendation') => void;
  revokeAllConsent: () => void;
  
  // Modal management
  showModal: (type: 'ai_analysis' | 'interaction_check' | 'recommendation') => void;
  hideModal: () => void;
  
  // Utility functions
  hasValidConsent: (type: 'ai_analysis' | 'interaction_check' | 'recommendation') => boolean;
  isConsentExpired: () => boolean;
  getConsentExpiryDate: () => Date | null;
}

const CONSENT_VERSION = '1.0.0';
const CONSENT_EXPIRY_DAYS = 365; // Consent expires after 1 year

export const useFDACompliance = (): FDAComplianceHook => {
  const [showComplianceModal, setShowComplianceModal] = useState(false);
  const [pendingAnalysisType, setPendingAnalysisType] = useState<'ai_analysis' | 'interaction_check' | 'recommendation' | null>(null);

  // Load consent state from storage
  const loadConsentState = useCallback((): FDAConsentState => {
    try {
      const stored = storage.getString('consent_state');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Check if consent version matches
        if (parsed.consentVersion === CONSENT_VERSION) {
          return parsed;
        }
      }
    } catch (error) {
      console.error('Failed to load FDA consent state:', error);
    }

    // Return default state
    return {
      hasConsentedToAIAnalysis: false,
      hasConsentedToInteractionCheck: false,
      hasConsentedToRecommendations: false,
      lastConsentDate: null,
      consentVersion: CONSENT_VERSION,
    };
  }, []);

  const [consentState, setConsentState] = useState<FDAConsentState>(loadConsentState);

  // Save consent state to storage
  const saveConsentState = useCallback((state: FDAConsentState) => {
    try {
      storage.set('consent_state', JSON.stringify(state));
      setConsentState(state);
    } catch (error) {
      console.error('Failed to save FDA consent state:', error);
    }
  }, []);

  // Check if consent is expired
  const isConsentExpired = useCallback((): boolean => {
    if (!consentState.lastConsentDate) return true;
    
    const consentDate = new Date(consentState.lastConsentDate);
    const expiryDate = new Date(consentDate);
    expiryDate.setDate(expiryDate.getDate() + CONSENT_EXPIRY_DAYS);
    
    return new Date() > expiryDate;
  }, [consentState.lastConsentDate]);

  // Get consent expiry date
  const getConsentExpiryDate = useCallback((): Date | null => {
    if (!consentState.lastConsentDate) return null;
    
    const consentDate = new Date(consentState.lastConsentDate);
    const expiryDate = new Date(consentDate);
    expiryDate.setDate(expiryDate.getDate() + CONSENT_EXPIRY_DAYS);
    
    return expiryDate;
  }, [consentState.lastConsentDate]);

  // Check if user has valid consent for a specific type
  const hasValidConsent = useCallback((type: 'ai_analysis' | 'interaction_check' | 'recommendation'): boolean => {
    if (isConsentExpired()) return false;
    
    switch (type) {
      case 'ai_analysis':
        return consentState.hasConsentedToAIAnalysis;
      case 'interaction_check':
        return consentState.hasConsentedToInteractionCheck;
      case 'recommendation':
        return consentState.hasConsentedToRecommendations;
      default:
        return false;
    }
  }, [consentState, isConsentExpired]);

  // Request consent (shows modal if needed)
  const requestConsent = useCallback(async (type: 'ai_analysis' | 'interaction_check' | 'recommendation'): Promise<boolean> => {
    if (hasValidConsent(type)) {
      return true;
    }

    return new Promise((resolve) => {
      setPendingAnalysisType(type);
      setShowComplianceModal(true);
      
      // Store the resolve function to be called when modal is closed
      const handleModalClose = (granted: boolean) => {
        setShowComplianceModal(false);
        setPendingAnalysisType(null);
        resolve(granted);
      };

      // This will be handled by the modal component
      (window as any).fdaConsentResolver = handleModalClose;
    });
  }, [hasValidConsent]);

  // Grant consent for a specific type
  const grantConsent = useCallback((type: 'ai_analysis' | 'interaction_check' | 'recommendation') => {
    const newState: FDAConsentState = {
      ...consentState,
      lastConsentDate: new Date().toISOString(),
      consentVersion: CONSENT_VERSION,
    };

    switch (type) {
      case 'ai_analysis':
        newState.hasConsentedToAIAnalysis = true;
        break;
      case 'interaction_check':
        newState.hasConsentedToInteractionCheck = true;
        break;
      case 'recommendation':
        newState.hasConsentedToRecommendations = true;
        break;
    }

    saveConsentState(newState);
  }, [consentState, saveConsentState]);

  // Revoke consent for a specific type
  const revokeConsent = useCallback((type: 'ai_analysis' | 'interaction_check' | 'recommendation') => {
    const newState: FDAConsentState = { ...consentState };

    switch (type) {
      case 'ai_analysis':
        newState.hasConsentedToAIAnalysis = false;
        break;
      case 'interaction_check':
        newState.hasConsentedToInteractionCheck = false;
        break;
      case 'recommendation':
        newState.hasConsentedToRecommendations = false;
        break;
    }

    saveConsentState(newState);
  }, [consentState, saveConsentState]);

  // Revoke all consent
  const revokeAllConsent = useCallback(() => {
    const newState: FDAConsentState = {
      hasConsentedToAIAnalysis: false,
      hasConsentedToInteractionCheck: false,
      hasConsentedToRecommendations: false,
      lastConsentDate: null,
      consentVersion: CONSENT_VERSION,
    };

    saveConsentState(newState);
  }, [saveConsentState]);

  // Show modal
  const showModal = useCallback((type: 'ai_analysis' | 'interaction_check' | 'recommendation') => {
    setPendingAnalysisType(type);
    setShowComplianceModal(true);
  }, []);

  // Hide modal
  const hideModal = useCallback(() => {
    setShowComplianceModal(false);
    setPendingAnalysisType(null);
  }, []);

  return {
    consentState,
    showComplianceModal,
    pendingAnalysisType,
    requestConsent,
    grantConsent,
    revokeConsent,
    revokeAllConsent,
    showModal,
    hideModal,
    hasValidConsent,
    isConsentExpired,
    getConsentExpiryDate,
  };
};
