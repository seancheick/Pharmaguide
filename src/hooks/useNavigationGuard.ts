// src/hooks/useNavigationGuard.ts
// Navigation guards for form protection and route safety

import { useEffect, useCallback, useRef } from 'react';
import { Alert, BackHandler } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { EventArg } from '@react-navigation/native';

export interface NavigationGuardConfig {
  hasUnsavedChanges: boolean;
  message?: string;
  title?: string;
  confirmText?: string;
  cancelText?: string;
  onSave?: () => Promise<void> | void;
  onDiscard?: () => Promise<void> | void;
  blockBackButton?: boolean;
  blockNavigation?: boolean;
}

export interface UseNavigationGuardReturn {
  canNavigate: boolean;
  showUnsavedChangesAlert: () => Promise<boolean>;
  forceNavigate: () => void;
  saveAndNavigate: () => Promise<void>;
}

/**
 * Navigation guard hook for protecting forms and handling unsaved changes
 */
export const useNavigationGuard = (
  config: NavigationGuardConfig
): UseNavigationGuardReturn => {
  const navigation = useNavigation();
  const pendingNavigationRef = useRef<(() => void) | null>(null);
  const isNavigatingRef = useRef(false);

  const {
    hasUnsavedChanges,
    message = 'You have unsaved changes. Are you sure you want to leave?',
    title = 'Unsaved Changes',
    confirmText = 'Leave',
    cancelText = 'Stay',
    onSave,
    onDiscard,
    blockBackButton = true,
    blockNavigation = true,
  } = config;

  /**
   * Show unsaved changes alert
   */
  const showUnsavedChangesAlert = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      const buttons = [
        {
          text: cancelText,
          style: 'cancel' as const,
          onPress: () => resolve(false),
        },
      ];

      // Add save button if onSave is provided
      if (onSave) {
        buttons.unshift({
          text: 'Save',
          onPress: async () => {
            try {
              await onSave();
              resolve(true);
            } catch (error) {
              console.error('Failed to save:', error);
              resolve(false);
            }
          },
        });
      }

      // Add discard button
      buttons.push({
        text: confirmText,
        style: 'destructive' as const,
        onPress: async () => {
          try {
            if (onDiscard) {
              await onDiscard();
            }
            resolve(true);
          } catch (error) {
            console.error('Failed to discard changes:', error);
            resolve(false);
          }
        },
      });

      Alert.alert(title, message, buttons);
    });
  }, [title, message, confirmText, cancelText, onSave, onDiscard]);

  /**
   * Handle navigation attempt
   */
  const handleNavigationAttempt = useCallback(
    async (navigationAction: () => void): Promise<void> => {
      if (!hasUnsavedChanges || isNavigatingRef.current) {
        navigationAction();
        return;
      }

      if (!blockNavigation) {
        navigationAction();
        return;
      }

      pendingNavigationRef.current = navigationAction;
      const shouldNavigate = await showUnsavedChangesAlert();

      if (shouldNavigate && pendingNavigationRef.current) {
        isNavigatingRef.current = true;
        pendingNavigationRef.current();
        pendingNavigationRef.current = null;
        
        // Reset navigation flag after a short delay
        setTimeout(() => {
          isNavigatingRef.current = false;
        }, 100);
      } else {
        pendingNavigationRef.current = null;
      }
    },
    [hasUnsavedChanges, blockNavigation, showUnsavedChangesAlert]
  );

  /**
   * Handle back button press
   */
  const handleBackPress = useCallback((): boolean => {
    if (!hasUnsavedChanges || !blockBackButton || isNavigatingRef.current) {
      return false; // Allow default back behavior
    }

    handleNavigationAttempt(() => {
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    });

    return true; // Prevent default back behavior
  }, [hasUnsavedChanges, blockBackButton, navigation, handleNavigationAttempt]);

  /**
   * Handle navigation events
   */
  const handleBeforeRemove = useCallback(
    (e: EventArg<'beforeRemove', true, any>) => {
      if (!hasUnsavedChanges || !blockNavigation || isNavigatingRef.current) {
        return;
      }

      // Prevent default behavior
      e.preventDefault();

      handleNavigationAttempt(() => {
        // Re-dispatch the action that was prevented
        navigation.dispatch(e.data.action);
      });
    },
    [hasUnsavedChanges, blockNavigation, navigation, handleNavigationAttempt]
  );

  /**
   * Force navigate without checks
   */
  const forceNavigate = useCallback(() => {
    isNavigatingRef.current = true;
    
    if (pendingNavigationRef.current) {
      pendingNavigationRef.current();
      pendingNavigationRef.current = null;
    }
    
    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 100);
  }, []);

  /**
   * Save and navigate
   */
  const saveAndNavigate = useCallback(async (): Promise<void> => {
    if (onSave) {
      try {
        await onSave();
        forceNavigate();
      } catch (error) {
        console.error('Failed to save before navigation:', error);
        throw error;
      }
    } else {
      forceNavigate();
    }
  }, [onSave, forceNavigate]);

  // Set up navigation event listeners
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', handleBeforeRemove);
    return unsubscribe;
  }, [navigation, handleBeforeRemove]);

  // Set up back button handler when screen is focused
  useFocusEffect(
    useCallback(() => {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
      return () => backHandler.remove();
    }, [handleBackPress])
  );

  return {
    canNavigate: !hasUnsavedChanges || !blockNavigation,
    showUnsavedChangesAlert,
    forceNavigate,
    saveAndNavigate,
  };
};

/**
 * Simple navigation guard for basic unsaved changes protection
 */
export const useSimpleNavigationGuard = (
  hasUnsavedChanges: boolean,
  message?: string
) => {
  return useNavigationGuard({
    hasUnsavedChanges,
    message,
    blockBackButton: true,
    blockNavigation: true,
  });
};

/**
 * Form navigation guard with save functionality
 */
export const useFormNavigationGuard = (
  hasUnsavedChanges: boolean,
  onSave: () => Promise<void> | void,
  onDiscard?: () => Promise<void> | void
) => {
  return useNavigationGuard({
    hasUnsavedChanges,
    onSave,
    onDiscard,
    blockBackButton: true,
    blockNavigation: true,
    message: 'You have unsaved changes. Would you like to save before leaving?',
    title: 'Save Changes?',
    confirmText: 'Discard',
    cancelText: 'Cancel',
  });
};

/**
 * Route protection hook for sensitive screens
 */
export const useRouteProtection = (
  shouldProtect: boolean,
  protectionMessage?: string
) => {
  return useNavigationGuard({
    hasUnsavedChanges: shouldProtect,
    message: protectionMessage || 'Are you sure you want to leave this screen?',
    title: 'Confirm Navigation',
    confirmText: 'Leave',
    cancelText: 'Stay',
    blockBackButton: true,
    blockNavigation: true,
  });
};

/**
 * Navigation guard utilities
 */
export const NavigationGuardUtils = {
  /**
   * Create a standard unsaved changes alert
   */
  createUnsavedChangesAlert: (
    onSave?: () => Promise<void>,
    onDiscard?: () => Promise<void>,
    customMessage?: string
  ): Promise<'save' | 'discard' | 'cancel'> => {
    return new Promise((resolve) => {
      const buttons = [
        {
          text: 'Cancel',
          style: 'cancel' as const,
          onPress: () => resolve('cancel'),
        },
      ];

      if (onSave) {
        buttons.unshift({
          text: 'Save',
          onPress: () => resolve('save'),
        });
      }

      buttons.push({
        text: 'Discard',
        style: 'destructive' as const,
        onPress: () => resolve('discard'),
      });

      Alert.alert(
        'Unsaved Changes',
        customMessage || 'You have unsaved changes. What would you like to do?',
        buttons
      );
    });
  },

  /**
   * Check if navigation should be blocked
   */
  shouldBlockNavigation: (
    hasUnsavedChanges: boolean,
    isFormDirty: boolean,
    hasErrors: boolean
  ): boolean => {
    return hasUnsavedChanges || (isFormDirty && !hasErrors);
  },

  /**
   * Create a confirmation alert for destructive actions
   */
  createConfirmationAlert: (
    title: string,
    message: string,
    confirmText: string = 'Confirm',
    cancelText: string = 'Cancel'
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      Alert.alert(
        title,
        message,
        [
          {
            text: cancelText,
            style: 'cancel',
            onPress: () => resolve(false),
          },
          {
            text: confirmText,
            style: 'destructive',
            onPress: () => resolve(true),
          },
        ]
      );
    });
  },
};
