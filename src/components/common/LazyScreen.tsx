// src/components/common/LazyScreen.tsx
// Lazy loading wrapper for screens to enable code splitting

import React, { Suspense, ComponentType } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';
import { OptimizedIcon } from './OptimizedIcon';

interface LazyScreenProps {
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  showProgress?: boolean;
  screenName?: string;
}

interface LazyScreenWrapperProps extends LazyScreenProps {
  children: React.ReactNode;
}

/**
 * Loading fallback component for lazy screens
 */
const DefaultLoadingFallback: React.FC<{ screenName?: string }> = ({ screenName }) => (
  <SafeAreaView style={styles.container}>
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.loadingText}>
        {screenName ? `Loading ${screenName}...` : 'Loading...'}
      </Text>
      <View style={styles.iconContainer}>
        <OptimizedIcon
          name="refresh"
          size={16}
          color={COLORS.textSecondary}
        />
      </View>
    </View>
  </SafeAreaView>
);

/**
 * Error fallback component for lazy screens
 */
const DefaultErrorFallback: React.FC<{ screenName?: string }> = ({ screenName }) => (
  <SafeAreaView style={styles.container}>
    <View style={styles.errorContainer}>
      <OptimizedIcon
        name="alert-circle"
        size={48}
        color={COLORS.error}
      />
      <Text style={styles.errorTitle}>Failed to Load</Text>
      <Text style={styles.errorMessage}>
        {screenName ? `Unable to load ${screenName}. Please try again.` : 'Unable to load screen. Please try again.'}
      </Text>
    </View>
  </SafeAreaView>
);

/**
 * Lazy Screen Wrapper Component
 * 
 * Provides:
 * - Suspense boundary for lazy-loaded screens
 * - Loading states with progress indicators
 * - Error boundaries for failed loads
 * - Performance monitoring
 */
export const LazyScreenWrapper: React.FC<LazyScreenWrapperProps> = ({
  children,
  fallback,
  errorFallback,
  showProgress = true,
  screenName,
}) => {
  const loadingFallback = fallback || (
    showProgress ? <DefaultLoadingFallback screenName={screenName} /> : null
  );

  const errorComponent = errorFallback || <DefaultErrorFallback screenName={screenName} />;

  return (
    <ErrorBoundary fallback={errorComponent}>
      <Suspense fallback={loadingFallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
};

/**
 * Error Boundary for lazy loading failures
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy screen loading error:', error, errorInfo);
    
    // Log to performance monitor for analytics
    console.log('📊 Screen loading error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

/**
 * Higher-order component to make any screen lazy-loadable
 */
export function withLazyLoading<P extends object>(
  Component: ComponentType<P>,
  options?: LazyScreenProps
) {
  const LazyComponent = React.lazy(() => Promise.resolve({ default: Component }));
  
  const WrappedComponent: React.FC<P> = (props) => (
    <LazyScreenWrapper {...options}>
      <LazyComponent {...props} />
    </LazyScreenWrapper>
  );

  WrappedComponent.displayName = `withLazyLoading(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

/**
 * Utility to create lazy screen imports with performance monitoring
 */
export function createLazyScreen<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  screenName?: string
) {
  const LazyComponent = React.lazy(async () => {
    const startTime = Date.now();
    
    try {
      const module = await importFn();
      const loadTime = Date.now() - startTime;
      
      console.log(`📊 Screen loaded: ${screenName || 'Unknown'} in ${loadTime}ms`);
      
      return module;
    } catch (error) {
      console.error(`❌ Failed to load screen: ${screenName || 'Unknown'}`, error);
      throw error;
    }
  });

  const WrappedComponent: React.FC<P> = (props) => (
    <LazyScreenWrapper screenName={screenName} showProgress={true}>
      <LazyComponent {...props} />
    </LazyScreenWrapper>
  );

  WrappedComponent.displayName = `LazyScreen(${screenName || 'Unknown'})`;
  
  return WrappedComponent;
}

/**
 * Preload utility for critical screens
 */
export function preloadScreen<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>
): void {
  // Preload in the background without blocking
  setTimeout(() => {
    importFn().catch(error => {
      console.warn('Screen preload failed:', error);
    });
  }, 100);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
    marginTop: SPACING.lg,
    textAlign: 'center',
  },
  iconContainer: {
    marginTop: SPACING.md,
    opacity: 0.6,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  errorTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  errorMessage: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
