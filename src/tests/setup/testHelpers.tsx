// src/tests/setup/testHelpers.ts
// Comprehensive test helpers and utilities

import React from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { stackSlice } from '../../stores/stackStore';
import { authSlice } from '../../stores/authStore';
import { gamificationSlice } from '../../stores/gamificationStore';

// Mock MMKV for tests
jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    set: jest.fn(),
    getString: jest.fn(),
    getNumber: jest.fn(),
    getBoolean: jest.fn(),
    contains: jest.fn(),
    delete: jest.fn(),
    clearAll: jest.fn(),
    getAllKeys: jest.fn(() => []),
  })),
}));

// Mock React Native components
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Alert: {
      alert: jest.fn(),
    },
    Linking: {
      openURL: jest.fn(),
      canOpenURL: jest.fn(() => Promise.resolve(true)),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      getInitialURL: jest.fn(() => Promise.resolve(null)),
    },
    Dimensions: {
      get: jest.fn(() => ({ width: 375, height: 812 })),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
    Platform: {
      OS: 'ios',
      Version: '14.0',
      select: jest.fn(obj => obj.ios),
    },
    StatusBar: {
      setBarStyle: jest.fn(),
      setBackgroundColor: jest.fn(),
    },
  };
});

// Mock Expo modules
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
}));

jest.mock('expo-notifications', () => ({
  requestPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted' })
  ),
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve([])),
}));

// Test store configuration
export const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      stack: stackSlice.reducer,
      auth: authSlice.reducer,
      gamification: gamificationSlice.reducer,
    },
    preloadedState: initialState,
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        serializableCheck: false,
      }),
  });
};

// Test wrapper component
interface TestWrapperProps {
  children: React.ReactNode;
  initialState?: any;
  navigationInitialState?: any;
}

const TestWrapper: React.FC<TestWrapperProps> = ({
  children,
  initialState = {},
  navigationInitialState,
}) => {
  const store = createTestStore(initialState);

  return (
    <Provider store={store}>
      <NavigationContainer initialState={navigationInitialState}>
        {children}
      </NavigationContainer>
    </Provider>
  );
};

// Custom render function
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialState?: any;
  navigationInitialState?: any;
}

export const renderWithProviders = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { initialState, navigationInitialState, ...renderOptions } = options;

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <TestWrapper
      initialState={initialState}
      navigationInitialState={navigationInitialState}
    >
      {children}
    </TestWrapper>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Test data factories
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-123',
  email: 'test@example.com',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createMockProduct = (overrides = {}) => ({
  id: 'test-product-123',
  name: 'Test Supplement',
  brand: 'Test Brand',
  barcode: '1234567890123',
  ingredients: ['Vitamin D3', 'Magnesium'],
  servingSize: '1 capsule',
  servingsPerContainer: 60,
  ...overrides,
});

export const createMockStackItem = (overrides = {}) => ({
  id: 'test-stack-item-123',
  productId: 'test-product-123',
  name: 'Test Supplement',
  brand: 'Test Brand',
  dosage: '1000mg',
  frequency: 'Daily',
  timeOfDay: 'Morning',
  notes: 'With food',
  addedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createMockInteraction = (overrides = {}) => ({
  id: 'test-interaction-123',
  product1: 'Product A',
  product2: 'Product B',
  severity: 'moderate' as const,
  description: 'May reduce absorption',
  mechanism: 'Competitive binding',
  recommendation: 'Take 2 hours apart',
  sources: ['FDA', 'NIH'],
  ...overrides,
});

// Mock API responses
export const mockApiResponse = function <T>(data: T, delay = 0) {
  return new Promise<T>(resolve => {
    setTimeout(() => resolve(data), delay);
  });
};

export const mockApiError = (
  message = 'API Error',
  status = 500,
  delay = 0
) => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      const error = new Error(message);
      (error as any).status = status;
      reject(error);
    }, delay);
  });
};

// Test utilities
export const waitFor = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms));

export const flushPromises = () =>
  new Promise(resolve => setImmediate(resolve));

// Mock navigation helpers
export const createMockNavigation = (overrides = {}) => ({
  navigate: jest.fn(),
  goBack: jest.fn(),
  reset: jest.fn(),
  setParams: jest.fn(),
  dispatch: jest.fn(),
  canGoBack: jest.fn(() => true),
  isFocused: jest.fn(() => true),
  addListener: jest.fn(),
  removeListener: jest.fn(),
  ...overrides,
});

export const createMockRoute = (overrides = {}) => ({
  key: 'test-route-key',
  name: 'TestScreen',
  params: {},
  ...overrides,
});

// Performance testing helpers
export const measurePerformance = async (
  fn: () => Promise<void> | void,
  iterations = 1
) => {
  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fn();
    const end = performance.now();
    times.push(end - start);
  }

  return {
    average: times.reduce((sum, time) => sum + time, 0) / times.length,
    min: Math.min(...times),
    max: Math.max(...times),
    times,
  };
};

// Memory testing helpers
export const measureMemoryUsage = () => {
  if (typeof performance !== 'undefined' && (performance as any).memory) {
    return {
      used: (performance as any).memory.usedJSHeapSize,
      total: (performance as any).memory.totalJSHeapSize,
      limit: (performance as any).memory.jsHeapSizeLimit,
    };
  }
  return null;
};

// Accessibility testing helpers
export const checkAccessibility = (element: any) => {
  const issues: string[] = [];

  // Check for accessibility label
  if (
    !element.props.accessibilityLabel &&
    !element.props.accessibilityLabelledBy
  ) {
    issues.push('Missing accessibility label');
  }

  // Check for accessibility role
  if (!element.props.accessibilityRole) {
    issues.push('Missing accessibility role');
  }

  // Check for minimum touch target size (44x44 points)
  const style = element.props.style;
  if (style && (style.width < 44 || style.height < 44)) {
    issues.push('Touch target too small (minimum 44x44)');
  }

  return {
    isAccessible: issues.length === 0,
    issues,
  };
};

// Form testing helpers
export const fillForm = async (
  getByTestId: any,
  formData: Record<string, string>
) => {
  for (const [fieldName, value] of Object.entries(formData)) {
    const field = getByTestId(fieldName);
    // Simulate user input
    field.props.onChangeText?.(value);
  }

  // Allow for any async validation
  await flushPromises();
};

export const submitForm = async (
  getByTestId: any,
  submitButtonTestId = 'submit-button'
) => {
  const submitButton = getByTestId(submitButtonTestId);
  submitButton.props.onPress?.();
  await flushPromises();
};

// Network testing helpers
export const mockNetworkError = () => {
  const originalFetch = global.fetch;
  global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));

  return () => {
    global.fetch = originalFetch;
  };
};

export const mockSlowNetwork = (delay = 3000) => {
  const originalFetch = global.fetch;
  global.fetch = jest.fn((...args) => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(originalFetch(...args));
      }, delay);
    });
  });

  return () => {
    global.fetch = originalFetch;
  };
};

// Cleanup helpers
export const cleanupAfterEach = () => {
  jest.clearAllMocks();
  jest.clearAllTimers();
};

export const cleanupAfterAll = () => {
  jest.restoreAllMocks();
};

// Export commonly used testing library functions
export * from '@testing-library/react-native';
export { renderWithProviders as render };
