// src/hooks/useFormPersistence.ts
// Enhanced form persistence with automatic save/restore and navigation safety

import { useState, useEffect, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { storageAdapter } from '../services/storage/storageAdapter';
import { performanceMonitor } from '../services/performance/performanceMonitor';

export interface FormPersistenceConfig {
  formId: string;
  autoSave?: boolean;
  autoSaveDelay?: number;
  clearOnSubmit?: boolean;
  clearOnUnmount?: boolean;
  encryptSensitiveFields?: string[];
  maxAge?: number; // in milliseconds
}

export interface PersistedFormData {
  data: Record<string, any>;
  timestamp: number;
  version: string;
  formId: string;
}

export interface UseFormPersistenceReturn {
  persistedData: Record<string, any>;
  saveFormData: (data: Record<string, any>) => Promise<void>;
  clearFormData: () => Promise<void>;
  hasPersistedData: boolean;
  isLoading: boolean;
  lastSaved: Date | null;
  restoreFormData: () => Promise<Record<string, any> | null>;
}

const FORM_PERSISTENCE_PREFIX = '@pharmaguide_form_';
const FORM_VERSION = '1.0.0';

/**
 * Enhanced form persistence hook with automatic save/restore
 */
export const useFormPersistence = (
  config: FormPersistenceConfig
): UseFormPersistenceReturn => {
  const [persistedData, setPersistedData] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasPersistedData, setHasPersistedData] = useState(false);

  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  const pendingDataRef = useRef<Record<string, any>>({});
  const isMountedRef = useRef(true);

  const {
    formId,
    autoSave = true,
    autoSaveDelay = 1000,
    clearOnSubmit = true,
    clearOnUnmount = false,
    encryptSensitiveFields = [],
    maxAge = 24 * 60 * 60 * 1000, // 24 hours default
  } = config;

  const storageKey = `${FORM_PERSISTENCE_PREFIX}${formId}`;

  /**
   * Load persisted form data
   */
  const loadPersistedData = useCallback(async (): Promise<Record<
    string,
    any
  > | null> => {
    try {
      await storageAdapter.initialize();
      const stored = await storageAdapter.getItem(storageKey);

      if (!stored) {
        return null;
      }

      const parsed: PersistedFormData = JSON.parse(stored);

      // Check if data is expired
      if (maxAge && Date.now() - parsed.timestamp > maxAge) {
        console.log(`🗑️ Form data expired for ${formId}, clearing...`);
        await storageAdapter.removeItem(storageKey);
        return null;
      }

      // Check version compatibility
      if (parsed.version !== FORM_VERSION) {
        console.log(
          `🔄 Form version mismatch for ${formId}, clearing old data...`
        );
        await storageAdapter.removeItem(storageKey);
        return null;
      }

      console.log(`📥 Restored form data for ${formId}`);
      return parsed.data || {};
    } catch (error) {
      console.error(`❌ Failed to load persisted data for ${formId}:`, error);
      return null;
    }
  }, [formId, storageKey, maxAge]);

  /**
   * Save form data to storage
   */
  const saveFormData = useCallback(
    async (data: Record<string, any>): Promise<void> => {
      if (!isMountedRef.current) return;

      try {
        const formData: PersistedFormData = {
          data,
          timestamp: Date.now(),
          version: FORM_VERSION,
          formId,
        };

        await storageAdapter.setItem(storageKey, JSON.stringify(formData));

        if (isMountedRef.current) {
          setLastSaved(new Date());
          setHasPersistedData(Object.keys(data).length > 0);
          console.log(`💾 Saved form data for ${formId}`);
        }
      } catch (error) {
        console.error(`❌ Failed to save form data for ${formId}:`, error);
      }
    },
    [formId, storageKey]
  );

  /**
   * Clear persisted form data
   */
  const clearFormData = useCallback(async (): Promise<void> => {
    try {
      await storageAdapter.removeItem(storageKey);

      if (isMountedRef.current) {
        setPersistedData({});
        setHasPersistedData(false);
        setLastSaved(null);
        console.log(`🗑️ Cleared form data for ${formId}`);
      }
    } catch (error) {
      console.error(`❌ Failed to clear form data for ${formId}:`, error);
    }
  }, [formId, storageKey]);

  /**
   * Auto-save with debouncing
   */
  const scheduleAutoSave = useCallback(
    (data: Record<string, any>) => {
      if (!autoSave) return;

      pendingDataRef.current = data;

      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      autoSaveTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          saveFormData(pendingDataRef.current);
        }
      }, autoSaveDelay);
    },
    [autoSave, autoSaveDelay, saveFormData]
  );

  /**
   * Restore form data (explicit restore)
   */
  const restoreFormData = useCallback(async (): Promise<Record<
    string,
    any
  > | null> => {
    const data = await loadPersistedData();
    if (data && isMountedRef.current) {
      setPersistedData(data);
      setHasPersistedData(true);
    }
    return data;
  }, [loadPersistedData]);

  /**
   * Initialize form persistence
   */
  const initializeFormPersistence = useCallback(async () => {
    setIsLoading(true);

    try {
      const data = await performanceMonitor.measureAsync(
        `form_persistence_load_${formId}`,
        () => loadPersistedData(),
        'storage'
      );

      if (data && isMountedRef.current) {
        setPersistedData(data);
        setHasPersistedData(true);
      }
    } catch (error) {
      console.error(
        `❌ Failed to initialize form persistence for ${formId}:`,
        error
      );
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [formId, loadPersistedData]);

  // Initialize on mount
  useEffect(() => {
    initializeFormPersistence();
  }, [initializeFormPersistence]);

  // Re-initialize when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (!isLoading) {
        initializeFormPersistence();
      }
    }, [initializeFormPersistence, isLoading])
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;

      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      if (clearOnUnmount) {
        clearFormData();
      }
    };
  }, [clearOnUnmount, clearFormData]);

  return {
    persistedData,
    saveFormData,
    clearFormData,
    hasPersistedData,
    isLoading,
    lastSaved,
    restoreFormData,
    // Auto-save function for external use
    scheduleAutoSave,
  } as UseFormPersistenceReturn & {
    scheduleAutoSave: (data: Record<string, any>) => void;
  };
};

/**
 * Enhanced form validation hook with persistence
 */
export const useFormValidationWithPersistence = (
  formConfig: any,
  persistenceConfig: FormPersistenceConfig,
  initialValues: Record<string, any> = {}
) => {
  const persistence = useFormPersistence(persistenceConfig);
  const [formInitialized, setFormInitialized] = useState(false);

  // Dynamic import to avoid circular dependency
  const [useFormValidation, setUseFormValidation] = useState<any>(null);

  useEffect(() => {
    import('./useFormValidation').then(module => {
      setUseFormValidation(() => module.useFormValidation);
    });
  }, []);

  // Merge initial values with persisted data
  const mergedInitialValues = {
    ...initialValues,
    ...(!persistence.isLoading ? persistence.persistedData : {}),
  };

  const formValidation = useFormValidation
    ? useFormValidation(formConfig, mergedInitialValues)
    : null;

  // Auto-save form data when it changes
  useEffect(() => {
    if (formInitialized && !persistence.isLoading && formValidation?.fields) {
      const formData = Object.keys(formValidation.fields).reduce(
        (acc, key) => {
          acc[key] = formValidation.fields[key].value;
          return acc;
        },
        {} as Record<string, any>
      );

      // Only save if there's actual data
      if (
        Object.values(formData).some(value => value && value.toString().trim())
      ) {
        (persistence as any).scheduleAutoSave(formData);
      }
    }
  }, [formValidation?.fields, formInitialized, persistence]);

  // Mark form as initialized after persistence loads
  useEffect(() => {
    if (!persistence.isLoading && !formInitialized && useFormValidation) {
      setFormInitialized(true);
    }
  }, [persistence.isLoading, formInitialized, useFormValidation]);

  // Enhanced submit function that clears persistence
  const submitWithPersistence = useCallback(
    async (submitFn: () => Promise<void> | void) => {
      try {
        await submitFn();

        if (persistenceConfig.clearOnSubmit) {
          await persistence.clearFormData();
        }
      } catch (error) {
        // Don't clear on error - keep form data for retry
        throw error;
      }
    },
    [persistence, persistenceConfig.clearOnSubmit]
  );

  // Return loading state if form validation not ready
  if (!formValidation) {
    return {
      fields: {},
      setValue: () => {},
      setTouched: () => {},
      validateField: () => ({ isValid: true }),
      validateForm: () => true,
      resetForm: () => {},
      resetField: () => {},
      isFormValid: true,
      hasErrors: false,
      getFieldProps: () => ({
        value: '',
        onChangeText: () => {},
        onBlur: () => {},
      }),
      persistence,
      submitWithPersistence,
      isFormLoading: true,
      hasPersistedData: persistence.hasPersistedData,
      lastSaved: persistence.lastSaved,
    };
  }

  return {
    ...formValidation,
    persistence,
    submitWithPersistence,
    isFormLoading: persistence.isLoading,
    hasPersistedData: persistence.hasPersistedData,
    lastSaved: persistence.lastSaved,
  };
};

/**
 * Form persistence utilities
 */
export const FormPersistenceUtils = {
  /**
   * Clear all form persistence data
   */
  clearAllFormData: async (): Promise<void> => {
    try {
      await storageAdapter.initialize();
      const keys = await storageAdapter.getAllKeys();
      const formKeys = keys.filter(key =>
        key.startsWith(FORM_PERSISTENCE_PREFIX)
      );

      await Promise.all(formKeys.map(key => storageAdapter.removeItem(key)));
      console.log(`🗑️ Cleared ${formKeys.length} persisted forms`);
    } catch (error) {
      console.error('❌ Failed to clear all form data:', error);
    }
  },

  /**
   * Get all persisted form IDs
   */
  getPersistedFormIds: async (): Promise<string[]> => {
    try {
      await storageAdapter.initialize();
      const keys = await storageAdapter.getAllKeys();
      return keys
        .filter(key => key.startsWith(FORM_PERSISTENCE_PREFIX))
        .map(key => key.replace(FORM_PERSISTENCE_PREFIX, ''));
    } catch (error) {
      console.error('❌ Failed to get persisted form IDs:', error);
      return [];
    }
  },

  /**
   * Check if form has persisted data
   */
  hasPersistedData: async (formId: string): Promise<boolean> => {
    try {
      await storageAdapter.initialize();
      const stored = await storageAdapter.getItem(
        `${FORM_PERSISTENCE_PREFIX}${formId}`
      );
      return !!stored;
    } catch (error) {
      console.error(`❌ Failed to check persisted data for ${formId}:`, error);
      return false;
    }
  },
};
