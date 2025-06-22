// src/components/common/__tests__/ErrorBoundary.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ErrorBoundary, withErrorBoundary } from '../ErrorBoundary';

// Mock the config
jest.mock('../../../config', () => ({
  config: {
    enableDebugMode: true,
    enableCrashReporting: false,
    appVersion: '1.0.0',
    environment: 'development',
  },
}));

// Component that throws an error
const ThrowError: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow = false }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <Text>No error</Text>;
};

describe('ErrorBoundary', () => {
  // Suppress console.error for these tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render children when there is no error', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(getByText('No error')).toBeTruthy();
  });

  it('should render error UI when child component throws', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(getByText('Oops! Something went wrong')).toBeTruthy();
    expect(getByText(/We're sorry, but something unexpected happened/)).toBeTruthy();
  });

  it('should show debug information in development mode', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(getByText('Debug Information:')).toBeTruthy();
    expect(getByText(/Error: Test error/)).toBeTruthy();
  });

  it('should call onError callback when error occurs', () => {
    const onError = jest.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it('should render custom fallback when provided', () => {
    const customFallback = <Text>Custom error message</Text>;

    const { getByText } = render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(getByText('Custom error message')).toBeTruthy();
  });

  it('should reset error state when Try Again is pressed', () => {
    const { getByText, rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Error UI should be visible
    expect(getByText('Oops! Something went wrong')).toBeTruthy();

    // Press Try Again button
    const tryAgainButton = getByText('Try Again');
    fireEvent.press(tryAgainButton);

    // Re-render with no error
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    // Should show normal content
    expect(getByText('No error')).toBeTruthy();
  });

  it('should reset when resetKeys change', () => {
    let resetKeys = ['key1'];
    const { rerender, getByText } = render(
      <ErrorBoundary resetKeys={resetKeys}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Error UI should be visible
    expect(getByText('Oops! Something went wrong')).toBeTruthy();

    // Change reset keys
    resetKeys = ['key2'];
    rerender(
      <ErrorBoundary resetKeys={resetKeys}>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    // Should reset and show normal content
    expect(getByText('No error')).toBeTruthy();
  });

  describe('withErrorBoundary HOC', () => {
    it('should wrap component with error boundary', () => {
      const TestComponent: React.FC = () => <Text>Test Component</Text>;
      const WrappedComponent = withErrorBoundary(TestComponent);

      const { getByText } = render(<WrappedComponent />);

      expect(getByText('Test Component')).toBeTruthy();
    });

    it('should catch errors in wrapped component', () => {
      const WrappedComponent = withErrorBoundary(ThrowError);

      const { getByText } = render(<WrappedComponent shouldThrow={true} />);

      expect(getByText('Oops! Something went wrong')).toBeTruthy();
    });

    it('should pass through error boundary props', () => {
      const onError = jest.fn();
      const WrappedComponent = withErrorBoundary(ThrowError, { onError });

      render(<WrappedComponent shouldThrow={true} />);

      expect(onError).toHaveBeenCalled();
    });

    it('should set correct display name', () => {
      const TestComponent: React.FC = () => <Text>Test</Text>;
      TestComponent.displayName = 'TestComponent';

      const WrappedComponent = withErrorBoundary(TestComponent);

      expect(WrappedComponent.displayName).toBe('withErrorBoundary(TestComponent)');
    });
  });
});
