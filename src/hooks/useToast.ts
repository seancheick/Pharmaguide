// src/hooks/useToast.ts
import { useCallback } from 'react';
import { toastManager, ToastType } from '../components/common/Toast';

export interface UseToastReturn {
  showToast: (message: string, type?: ToastType, options?: ToastOptions) => void;
  showSuccess: (message: string, options?: ToastOptions) => void;
  showError: (message: string, options?: ToastOptions) => void;
  showWarning: (message: string, options?: ToastOptions) => void;
  showInfo: (message: string, options?: ToastOptions) => void;
  clearToasts: () => void;
}

export interface ToastOptions {
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export const useToast = (): UseToastReturn => {
  const showToast = useCallback((
    message: string,
    type: ToastType = 'info',
    options?: ToastOptions
  ) => {
    toastManager.show({
      message,
      type,
      duration: options?.duration,
      action: options?.action,
    });
  }, []);

  const showSuccess = useCallback((message: string, options?: ToastOptions) => {
    showToast(message, 'success', options);
  }, [showToast]);

  const showError = useCallback((message: string, options?: ToastOptions) => {
    showToast(message, 'error', options);
  }, [showToast]);

  const showWarning = useCallback((message: string, options?: ToastOptions) => {
    showToast(message, 'warning', options);
  }, [showToast]);

  const showInfo = useCallback((message: string, options?: ToastOptions) => {
    showToast(message, 'info', options);
  }, [showToast]);

  const clearToasts = useCallback(() => {
    toastManager.clear();
  }, []);

  return {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    clearToasts,
  };
};

// Utility functions for common toast scenarios
export const useActionToasts = () => {
  const { showSuccess, showError, showInfo } = useToast();

  const showSaveSuccess = useCallback(() => {
    showSuccess('Changes saved successfully');
  }, [showSuccess]);

  const showSaveError = useCallback(() => {
    showError('Failed to save changes. Please try again.');
  }, [showError]);

  const showDeleteSuccess = useCallback((itemName?: string) => {
    showSuccess(`${itemName || 'Item'} deleted successfully`);
  }, [showSuccess]);

  const showDeleteError = useCallback(() => {
    showError('Failed to delete item. Please try again.');
  }, [showError]);

  const showNetworkError = useCallback(() => {
    showError('Network error. Please check your connection.');
  }, [showError]);

  const showOfflineMode = useCallback(() => {
    showInfo('You are offline. Some features may be limited.');
  }, [showInfo]);

  const showSyncSuccess = useCallback(() => {
    showSuccess('Data synchronized successfully');
  }, [showSuccess]);

  const showValidationError = useCallback((field?: string) => {
    showError(`Please check ${field || 'your input'} and try again.`);
  }, [showError]);

  return {
    showSaveSuccess,
    showSaveError,
    showDeleteSuccess,
    showDeleteError,
    showNetworkError,
    showOfflineMode,
    showSyncSuccess,
    showValidationError,
  };
};
