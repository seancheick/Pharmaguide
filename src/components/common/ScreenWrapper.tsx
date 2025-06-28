// src/components/common/ScreenWrapper.tsx
import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { ErrorBoundary } from './ErrorBoundary';
import { ScreenErrorBoundary } from './ScreenErrorBoundary';
import { LoadingScreen } from './LoadingScreen';
import { ErrorFallback, NetworkErrorFallback } from './ErrorFallback';
import { useNetworkState } from '../../hooks/useNetworkState';
import { COLORS } from '../../constants';

interface ScreenWrapperProps {
  children: React.ReactNode;
  screenName?: string;
  loading?: boolean;
  loadingMessage?: string;
  error?: Error | null;
  onRetry?: () => void;
  requiresNetwork?: boolean;
  safeArea?: boolean;
  backgroundColor?: string;
  showNetworkIndicator?: boolean;
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
  children,
  screenName = 'Screen',
  loading = false,
  loadingMessage,
  error,
  onRetry,
  requiresNetwork = false,
  safeArea = true,
  backgroundColor = COLORS.background,
  showNetworkIndicator = false,
}) => {
  const { isOffline } = useNetworkState();

  // Show loading state
  if (loading) {
    return (
      <LoadingScreen
        message={loadingMessage || `Loading ${screenName}...`}
        variant="screen"
      />
    );
  }

  // Show error state
  if (error) {
    return (
      <ErrorFallback
        error={error}
        resetError={onRetry}
        title={`${screenName} Error`}
        onRetry={onRetry}
      />
    );
  }

  // Show network error for screens that require network
  if (requiresNetwork && isOffline) {
    return (
      <NetworkErrorFallback
        onRetry={onRetry || (() => {})}
        onGoOffline={() => {
          // Handle offline mode if needed
        }}
      />
    );
  }

  const Container = safeArea ? SafeAreaView : View;

  return (
    <ScreenErrorBoundary screenName={screenName}>
      <Container style={[styles.container, { backgroundColor }]}>
        {children}
      </Container>
    </ScreenErrorBoundary>
  );
};

// Specialized wrappers for common screen types
export const AuthScreenWrapper: React.FC<{
  children: React.ReactNode;
  loading?: boolean;
}> = ({ children, loading }) => (
  <ScreenWrapper
    screenName="Authentication"
    loading={loading}
    loadingMessage="Setting up your account..."
    requiresNetwork={true}
    backgroundColor={COLORS.background}
  >
    {children}
  </ScreenWrapper>
);

export const DataScreenWrapper: React.FC<{
  children: React.ReactNode;
  loading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  screenName?: string;
}> = ({ children, loading, error, onRetry, screenName = 'Data' }) => (
  <ScreenWrapper
    screenName={screenName}
    loading={loading}
    error={error}
    onRetry={onRetry}
    requiresNetwork={true}
    showNetworkIndicator={true}
  >
    {children}
  </ScreenWrapper>
);

export const OfflineCapableScreenWrapper: React.FC<{
  children: React.ReactNode;
  loading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  screenName?: string;
}> = ({ children, loading, error, onRetry, screenName = 'Screen' }) => (
  <ScreenWrapper
    screenName={screenName}
    loading={loading}
    error={error}
    onRetry={onRetry}
    requiresNetwork={false}
    showNetworkIndicator={true}
  >
    {children}
  </ScreenWrapper>
);

// HOC for wrapping screens with error boundaries
export const withScreenWrapper = <P extends object>(
  Component: React.ComponentType<P>,
  options: {
    screenName?: string;
    requiresNetwork?: boolean;
    safeArea?: boolean;
  } = {}
) => {
  const WrappedComponent = (props: P) => (
    <ScreenWrapper
      screenName={options.screenName || Component.displayName || Component.name}
      requiresNetwork={options.requiresNetwork}
      safeArea={options.safeArea}
    >
      <Component {...props} />
    </ScreenWrapper>
  );

  WrappedComponent.displayName = `withScreenWrapper(${Component.displayName || Component.name})`;

  return WrappedComponent;
};

// Hook for screen-level error handling
export const useScreenError = (screenName: string) => {
  const [error, setError] = React.useState<Error | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handleError = React.useCallback((error: Error) => {
    console.error(`Screen error in ${screenName}:`, error);
    setError(error);
    setLoading(false);
  }, [screenName]);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  const retry = React.useCallback(() => {
    setError(null);
    setLoading(true);
  }, []);

  return {
    error,
    loading,
    setLoading,
    handleError,
    clearError,
    retry,
  };
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
