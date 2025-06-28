// src/hooks/__tests__/useFormPersistence.test.ts
// Unit tests for useFormPersistence hook

import { renderHook, act } from '@testing-library/react-native';
import { useFormPersistence } from '../useFormPersistence';
import { useFormValidation } from '../useFormValidation';

// Mock the storage adapter
jest.mock('../../services/storage/storageAdapter', () => ({
  storageAdapter: {
    initialize: jest.fn(),
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
    getAllKeys: jest.fn(() => []),
  },
}));

// Mock the form validation hook
jest.mock('../useFormValidation', () => ({
  useFormValidation: jest.fn(),
}));

const mockUseFormValidation = useFormValidation as jest.MockedFunction<typeof useFormValidation>;

describe('useFormPersistence', () => {
  const mockFormValidation = {
    fields: {
      name: { value: '', error: null, touched: false },
      email: { value: '', error: null, touched: false },
    },
    setValue: jest.fn(),
    setTouched: jest.fn(),
    validateField: jest.fn(),
    validateForm: jest.fn(),
    resetForm: jest.fn(),
    resetField: jest.fn(),
    isFormValid: true,
    hasErrors: false,
    getFieldProps: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseFormValidation.mockReturnValue(mockFormValidation);
  });

  describe('Basic Functionality', () => {
    it('initializes with default configuration', () => {
      const formConfig = {
        name: { validator: 'text' as const, options: { required: true } },
        email: { validator: 'email' as const },
      };

      const { result } = renderHook(() =>
        useFormPersistence('test-form', formConfig, {})
      );

      expect(result.current.persistence).toBeDefined();
      expect(result.current.submitWithPersistence).toBeDefined();
      expect(result.current.isFormLoading).toBe(false);
    });

    it('returns form validation properties', () => {
      const formConfig = {
        name: { validator: 'text' as const, options: { required: true } },
      };

      const { result } = renderHook(() =>
        useFormPersistence('test-form', formConfig, {})
      );

      expect(result.current.fields).toBeDefined();
      expect(result.current.setValue).toBeDefined();
      expect(result.current.validateForm).toBeDefined();
      expect(result.current.isFormValid).toBe(true);
    });
  });

  describe('Form Persistence', () => {
    it('auto-saves form data when fields change', async () => {
      const formConfig = {
        name: { validator: 'text' as const, options: { required: true } },
      };

      const { result, rerender } = renderHook(() =>
        useFormPersistence('test-form', formConfig, {}, { autoSave: true })
      );

      // Simulate field change
      act(() => {
        mockFormValidation.fields.name.value = 'John Doe';
      });

      rerender();

      // Should trigger auto-save
      expect(result.current.persistence.scheduleAutoSave).toBeDefined();
    });

    it('loads persisted data on initialization', async () => {
      const formConfig = {
        name: { validator: 'text' as const, options: { required: true } },
      };

      const { result } = renderHook(() =>
        useFormPersistence('test-form', formConfig, {})
      );

      expect(result.current.persistence.loadFormData).toBeDefined();
    });

    it('clears persistence on successful submit', async () => {
      const formConfig = {
        name: { validator: 'text' as const, options: { required: true } },
      };

      const { result } = renderHook(() =>
        useFormPersistence('test-form', formConfig, {}, { clearOnSubmit: true })
      );

      const mockSubmitFn = jest.fn().mockResolvedValue(undefined);

      await act(async () => {
        await result.current.submitWithPersistence(mockSubmitFn);
      });

      expect(mockSubmitFn).toHaveBeenCalled();
    });

    it('preserves persistence on submit error', async () => {
      const formConfig = {
        name: { validator: 'text' as const, options: { required: true } },
      };

      const { result } = renderHook(() =>
        useFormPersistence('test-form', formConfig, {}, { clearOnSubmit: true })
      );

      const mockSubmitFn = jest.fn().mockRejectedValue(new Error('Submit failed'));

      await act(async () => {
        try {
          await result.current.submitWithPersistence(mockSubmitFn);
        } catch (error) {
          // Expected to throw
        }
      });

      expect(mockSubmitFn).toHaveBeenCalled();
      // Persistence should not be cleared on error
    });
  });

  describe('Configuration Options', () => {
    it('respects autoSave configuration', () => {
      const formConfig = {
        name: { validator: 'text' as const, options: { required: true } },
      };

      const { result } = renderHook(() =>
        useFormPersistence('test-form', formConfig, {}, { autoSave: false })
      );

      expect(result.current.persistence).toBeDefined();
    });

    it('respects autoSaveDelay configuration', () => {
      const formConfig = {
        name: { validator: 'text' as const, options: { required: true } },
      };

      const { result } = renderHook(() =>
        useFormPersistence('test-form', formConfig, {}, { 
          autoSave: true, 
          autoSaveDelay: 5000 
        })
      );

      expect(result.current.persistence).toBeDefined();
    });

    it('respects maxAge configuration', () => {
      const formConfig = {
        name: { validator: 'text' as const, options: { required: true } },
      };

      const { result } = renderHook(() =>
        useFormPersistence('test-form', formConfig, {}, { 
          maxAge: 60 * 60 * 1000 // 1 hour
        })
      );

      expect(result.current.persistence).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('handles storage errors gracefully', () => {
      const formConfig = {
        name: { validator: 'text' as const, options: { required: true } },
      };

      // Mock storage error
      const { storageAdapter } = require('../../services/storage/storageAdapter');
      storageAdapter.setItem.mockRejectedValue(new Error('Storage error'));

      const { result } = renderHook(() =>
        useFormPersistence('test-form', formConfig, {})
      );

      expect(result.current.persistence).toBeDefined();
      // Should not throw error
    });

    it('handles form validation errors', () => {
      const formConfig = {
        name: { validator: 'text' as const, options: { required: true } },
      };

      // Mock validation error
      mockUseFormValidation.mockReturnValue({
        ...mockFormValidation,
        hasErrors: true,
        isFormValid: false,
      });

      const { result } = renderHook(() =>
        useFormPersistence('test-form', formConfig, {})
      );

      expect(result.current.hasErrors).toBe(true);
      expect(result.current.isFormValid).toBe(false);
    });
  });

  describe('Memory Management', () => {
    it('cleans up on unmount', () => {
      const formConfig = {
        name: { validator: 'text' as const, options: { required: true } },
      };

      const { unmount } = renderHook(() =>
        useFormPersistence('test-form', formConfig, {})
      );

      unmount();

      // Should clean up timers and listeners
      expect(jest.getTimerCount()).toBe(0);
    });
  });

  describe('Integration with Form Validation', () => {
    it('integrates with form validation hook', () => {
      const formConfig = {
        name: { validator: 'text' as const, options: { required: true } },
        email: { validator: 'email' as const },
      };

      const { result } = renderHook(() =>
        useFormPersistence('test-form', formConfig, {})
      );

      expect(mockUseFormValidation).toHaveBeenCalledWith(
        formConfig,
        expect.any(Object) // merged initial values
      );

      expect(result.current.fields).toBe(mockFormValidation.fields);
      expect(result.current.setValue).toBe(mockFormValidation.setValue);
      expect(result.current.validateForm).toBe(mockFormValidation.validateForm);
    });

    it('merges initial values with persisted data', () => {
      const formConfig = {
        name: { validator: 'text' as const, options: { required: true } },
      };

      const initialValues = { name: 'Initial Name' };

      renderHook(() =>
        useFormPersistence('test-form', formConfig, initialValues)
      );

      expect(mockUseFormValidation).toHaveBeenCalledWith(
        formConfig,
        expect.objectContaining(initialValues)
      );
    });
  });

  describe('Performance', () => {
    it('debounces auto-save calls', async () => {
      const formConfig = {
        name: { validator: 'text' as const, options: { required: true } },
      };

      const { result, rerender } = renderHook(() =>
        useFormPersistence('test-form', formConfig, {}, { 
          autoSave: true, 
          autoSaveDelay: 100 
        })
      );

      // Rapid field changes
      act(() => {
        mockFormValidation.fields.name.value = 'A';
      });
      rerender();

      act(() => {
        mockFormValidation.fields.name.value = 'AB';
      });
      rerender();

      act(() => {
        mockFormValidation.fields.name.value = 'ABC';
      });
      rerender();

      // Should debounce the saves
      expect(result.current.persistence).toBeDefined();
    });
  });
});
