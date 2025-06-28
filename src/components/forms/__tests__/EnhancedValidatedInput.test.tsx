// src/components/forms/__tests__/EnhancedValidatedInput.test.tsx
// Unit tests for EnhancedValidatedInput component

import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../../../tests/setup/testHelpers';
import { EnhancedValidatedInput, ValidationRule } from '../EnhancedValidatedInput';

describe('EnhancedValidatedInput', () => {
  const defaultProps = {
    label: 'Test Input',
    value: '',
    onChangeText: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('renders correctly with required props', () => {
      const { getByText, getByDisplayValue } = renderWithProviders(
        <EnhancedValidatedInput {...defaultProps} value="test value" />
      );

      expect(getByText('Test Input')).toBeTruthy();
      expect(getByDisplayValue('test value')).toBeTruthy();
    });

    it('calls onChangeText when text changes', () => {
      const onChangeText = jest.fn();
      const { getByDisplayValue } = renderWithProviders(
        <EnhancedValidatedInput {...defaultProps} onChangeText={onChangeText} />
      );

      const input = getByDisplayValue('');
      fireEvent.changeText(input, 'new text');

      expect(onChangeText).toHaveBeenCalledWith('new text');
    });

    it('shows placeholder when focused', () => {
      const { getByPlaceholderText, getByDisplayValue } = renderWithProviders(
        <EnhancedValidatedInput {...defaultProps} placeholder="Enter text here" />
      );

      const input = getByDisplayValue('');
      fireEvent(input, 'focus');

      expect(getByPlaceholderText('Enter text here')).toBeTruthy();
    });
  });

  describe('Validation', () => {
    it('validates required fields', async () => {
      const rules: ValidationRule[] = [
        { type: 'required', message: 'This field is required' }
      ];

      const { getByDisplayValue, getByText } = renderWithProviders(
        <EnhancedValidatedInput
          {...defaultProps}
          rules={rules}
          validateOnBlur={true}
        />
      );

      const input = getByDisplayValue('');
      fireEvent(input, 'focus');
      fireEvent(input, 'blur');

      await waitFor(() => {
        expect(getByText('This field is required')).toBeTruthy();
      });
    });

    it('validates email format', async () => {
      const rules: ValidationRule[] = [
        { type: 'email', message: 'Invalid email format' }
      ];

      const { getByDisplayValue, getByText } = renderWithProviders(
        <EnhancedValidatedInput
          {...defaultProps}
          rules={rules}
          validateOnChange={true}
          debounceMs={0}
        />
      );

      const input = getByDisplayValue('');
      fireEvent.changeText(input, 'invalid-email');

      await waitFor(() => {
        expect(getByText('Invalid email format')).toBeTruthy();
      });
    });

    it('validates minimum length', async () => {
      const rules: ValidationRule[] = [
        { type: 'custom', minLength: 5, message: 'Minimum 5 characters required' }
      ];

      const { getByDisplayValue, getByText } = renderWithProviders(
        <EnhancedValidatedInput
          {...defaultProps}
          rules={rules}
          validateOnChange={true}
          debounceMs={0}
        />
      );

      const input = getByDisplayValue('');
      fireEvent.changeText(input, 'abc');

      await waitFor(() => {
        expect(getByText('Minimum 5 characters required')).toBeTruthy();
      });
    });

    it('validates custom patterns', async () => {
      const rules: ValidationRule[] = [
        { 
          type: 'custom', 
          pattern: /^\d+$/, 
          message: 'Only numbers allowed' 
        }
      ];

      const { getByDisplayValue, getByText } = renderWithProviders(
        <EnhancedValidatedInput
          {...defaultProps}
          rules={rules}
          validateOnChange={true}
          debounceMs={0}
        />
      );

      const input = getByDisplayValue('');
      fireEvent.changeText(input, 'abc123');

      await waitFor(() => {
        expect(getByText('Only numbers allowed')).toBeTruthy();
      });
    });

    it('shows success state for valid input', async () => {
      const rules: ValidationRule[] = [
        { type: 'email' }
      ];

      const { getByDisplayValue, getByTestId } = renderWithProviders(
        <EnhancedValidatedInput
          {...defaultProps}
          rules={rules}
          validateOnChange={true}
          debounceMs={0}
        />
      );

      const input = getByDisplayValue('');
      fireEvent.changeText(input, 'valid@email.com');
      fireEvent(input, 'blur');

      await waitFor(() => {
        // Should show success icon
        expect(getByTestId('validation-success-icon')).toBeTruthy();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper accessibility labels', () => {
      const { getByLabelText } = renderWithProviders(
        <EnhancedValidatedInput
          {...defaultProps}
          accessibilityLabel="Test input field"
          accessibilityHint="Enter your test value"
        />
      );

      expect(getByLabelText('Test input field')).toBeTruthy();
    });

    it('announces validation errors to screen readers', async () => {
      const rules: ValidationRule[] = [
        { type: 'required', message: 'This field is required' }
      ];

      const { getByDisplayValue, getByRole } = renderWithProviders(
        <EnhancedValidatedInput
          {...defaultProps}
          rules={rules}
          validateOnBlur={true}
        />
      );

      const input = getByDisplayValue('');
      fireEvent(input, 'focus');
      fireEvent(input, 'blur');

      await waitFor(() => {
        const errorText = getByRole('text');
        expect(errorText.props.accessibilityLiveRegion).toBe('polite');
      });
    });
  });

  describe('Password Input', () => {
    it('toggles password visibility', () => {
      const { getByDisplayValue, getByTestId } = renderWithProviders(
        <EnhancedValidatedInput
          {...defaultProps}
          secureTextEntry={true}
          value="password123"
        />
      );

      const input = getByDisplayValue('password123');
      const toggleButton = getByTestId('password-toggle-button');

      expect(input.props.secureTextEntry).toBe(true);

      fireEvent.press(toggleButton);

      expect(input.props.secureTextEntry).toBe(false);
    });
  });

  describe('Character Count', () => {
    it('shows character count when enabled', () => {
      const { getByText } = renderWithProviders(
        <EnhancedValidatedInput
          {...defaultProps}
          value="test"
          showCharacterCount={true}
          maxLength={10}
        />
      );

      expect(getByText('4/10')).toBeTruthy();
    });

    it('shows error state when over limit', () => {
      const { getByText } = renderWithProviders(
        <EnhancedValidatedInput
          {...defaultProps}
          value="this is too long"
          showCharacterCount={true}
          maxLength={10}
        />
      );

      const characterCount = getByText('16/10');
      expect(characterCount.props.style).toMatchObject({
        color: expect.any(String), // Should be error color
      });
    });
  });

  describe('Multiline Input', () => {
    it('renders as multiline when specified', () => {
      const { getByDisplayValue } = renderWithProviders(
        <EnhancedValidatedInput
          {...defaultProps}
          multiline={true}
          numberOfLines={4}
        />
      );

      const input = getByDisplayValue('');
      expect(input.props.multiline).toBe(true);
      expect(input.props.numberOfLines).toBe(4);
    });
  });

  describe('Icons', () => {
    it('renders left icon when provided', () => {
      const { getByTestId } = renderWithProviders(
        <EnhancedValidatedInput
          {...defaultProps}
          leftIcon="search"
        />
      );

      expect(getByTestId('left-icon')).toBeTruthy();
    });

    it('renders right icon when provided', () => {
      const { getByTestId } = renderWithProviders(
        <EnhancedValidatedInput
          {...defaultProps}
          rightIcon="close"
          onRightIconPress={jest.fn()}
        />
      );

      expect(getByTestId('right-icon')).toBeTruthy();
    });

    it('calls onRightIconPress when right icon is pressed', () => {
      const onRightIconPress = jest.fn();
      const { getByTestId } = renderWithProviders(
        <EnhancedValidatedInput
          {...defaultProps}
          rightIcon="close"
          onRightIconPress={onRightIconPress}
        />
      );

      const rightIcon = getByTestId('right-icon');
      fireEvent.press(rightIcon);

      expect(onRightIconPress).toHaveBeenCalled();
    });
  });

  describe('Debounced Validation', () => {
    it('debounces validation calls', async () => {
      const validator = jest.fn(() => ({ isValid: true }));
      const rules: ValidationRule[] = [
        { type: 'custom', validator }
      ];

      const { getByDisplayValue } = renderWithProviders(
        <EnhancedValidatedInput
          {...defaultProps}
          rules={rules}
          validateOnChange={true}
          debounceMs={100}
        />
      );

      const input = getByDisplayValue('');
      
      // Rapid changes should only trigger validation once after debounce
      fireEvent.changeText(input, 'a');
      fireEvent.changeText(input, 'ab');
      fireEvent.changeText(input, 'abc');

      // Should not have called validator yet
      expect(validator).not.toHaveBeenCalled();

      // Wait for debounce
      await waitFor(() => {
        expect(validator).toHaveBeenCalledTimes(1);
      }, { timeout: 200 });
    });
  });

  describe('Async Validation', () => {
    it('handles async validation', async () => {
      const asyncValidator = jest.fn(() => 
        Promise.resolve({ isValid: false, message: 'Async validation failed' })
      );

      const rules: ValidationRule[] = [
        { type: 'custom', asyncValidator }
      ];

      const { getByDisplayValue, getByText } = renderWithProviders(
        <EnhancedValidatedInput
          {...defaultProps}
          rules={rules}
          validateOnChange={true}
          debounceMs={0}
        />
      );

      const input = getByDisplayValue('');
      fireEvent.changeText(input, 'test');

      await waitFor(() => {
        expect(getByText('Async validation failed')).toBeTruthy();
      });
    });

    it('shows loading state during async validation', async () => {
      const asyncValidator = jest.fn(() => 
        new Promise(resolve => setTimeout(() => resolve({ isValid: true }), 100))
      );

      const rules: ValidationRule[] = [
        { type: 'custom', asyncValidator }
      ];

      const { getByDisplayValue, getByTestId } = renderWithProviders(
        <EnhancedValidatedInput
          {...defaultProps}
          rules={rules}
          validateOnChange={true}
          debounceMs={0}
        />
      );

      const input = getByDisplayValue('');
      fireEvent.changeText(input, 'test');

      // Should show loading indicator
      await waitFor(() => {
        expect(getByTestId('validation-loading-icon')).toBeTruthy();
      });
    });
  });
});
