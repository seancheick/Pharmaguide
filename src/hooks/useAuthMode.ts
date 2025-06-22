// src/hooks/useAuthMode.ts
import { useState, useCallback } from 'react';

export type AuthMode = 'welcome' | 'signin' | 'signup' | 'forgot-password';

interface UseAuthModeReturn {
  currentMode: AuthMode;
  isSignIn: boolean;
  isForgotPassword: boolean;
  showAuthForm: boolean;
  showForm: (signIn: boolean) => void;
  hideForm: () => void;
  toggleAuthMode: () => void;
  showForgotPassword: () => void;
  backToSignIn: () => void;
}

export const useAuthMode = (): UseAuthModeReturn => {
  const [currentMode, setCurrentMode] = useState<AuthMode>('welcome');

  const showForm = useCallback((signIn: boolean) => {
    setCurrentMode(signIn ? 'signin' : 'signup');
  }, []);

  const hideForm = useCallback(() => {
    setCurrentMode('welcome');
  }, []);

  const toggleAuthMode = useCallback(() => {
    setCurrentMode(prev => prev === 'signin' ? 'signup' : 'signin');
  }, []);

  const showForgotPassword = useCallback(() => {
    setCurrentMode('forgot-password');
  }, []);

  const backToSignIn = useCallback(() => {
    setCurrentMode('signin');
  }, []);

  // Computed values
  const isSignIn = currentMode === 'signin';
  const isForgotPassword = currentMode === 'forgot-password';
  const showAuthForm = currentMode !== 'welcome';

  return {
    currentMode,
    isSignIn,
    isForgotPassword,
    showAuthForm,
    showForm,
    hideForm,
    toggleAuthMode,
    showForgotPassword,
    backToSignIn,
  };
};
