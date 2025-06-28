// src/tests/integration/navigation.integration.test.tsx
// Integration tests for navigation flows and cross-component interactions

import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import {
  renderWithProviders,
  createMockUser,
  createMockProduct,
} from '../setup/testHelpers';
import { HomeScreen } from '../../screens/home/HomeScreen';
import { ScanScreen } from '../../screens/scan/ScanScreen';
import { ProductAnalysisResults } from '../../screens/product/ProductAnalysisResults';
import { StackScreen } from '../../screens/stack/StackScreen';
import { ProfileScreen } from '../../screens/profile/ProfileScreen';
import {
  mockProductSearchService,
  mockHuggingFaceService,
  resetAllMocks,
  setupDefaultMocks,
} from '../mocks/serviceMocks';

// Mock navigation components
const Stack = createStackNavigator();

const TestNavigator = ({ initialRouteName = 'Home' }) => (
  <Stack.Navigator initialRouteName={initialRouteName}>
    <Stack.Screen name="Home" component={HomeScreen} />
    <Stack.Screen name="Scan" component={ScanScreen} />
    <Stack.Screen
      name="ProductAnalysisResults"
      component={ProductAnalysisResults}
    />
    <Stack.Screen name="Stack" component={StackScreen} />
    <Stack.Screen name="Profile" component={ProfileScreen} />
  </Stack.Navigator>
);

// Mock services
jest.mock('../../services/product/productSearchService', () => ({
  productSearchService: mockProductSearchService,
}));

jest.mock('../../services/ai/huggingface', () => ({
  HuggingFaceService: jest
    .fn()
    .mockImplementation(() => mockHuggingFaceService),
}));

jest.mock('expo-barcode-scanner', () => ({
  BarCodeScanner: {
    requestPermissionsAsync: jest.fn(() =>
      Promise.resolve({ status: 'granted' })
    ),
    Constants: {
      BarCodeType: {
        ean13: 'ean13',
        ean8: 'ean8',
        upc_a: 'upc_a',
        upc_e: 'upc_e',
      },
    },
  },
}));

describe('Navigation Integration Tests', () => {
  const mockUser = createMockUser();
  const mockProduct = createMockProduct();

  beforeEach(() => {
    resetAllMocks();
    setupDefaultMocks();
  });

  describe('Home to Scan Flow', () => {
    it('should navigate from home to scan screen', async () => {
      const { getByTestId, getByText } = renderWithProviders(
        <TestNavigator />,
        {
          initialState: {
            auth: { user: mockUser, loading: false },
          },
        }
      );

      // Should start on home screen
      expect(getByText('Welcome to PharmaGuide')).toBeTruthy();

      // Tap scan button
      const scanButton = getByTestId('scan-button');
      fireEvent.press(scanButton);

      // Should navigate to scan screen
      await waitFor(() => {
        expect(getByText('Scan Product')).toBeTruthy();
      });
    });

    it('should handle barcode scan and navigate to results', async () => {
      const {
        productSearchService,
      } = require('../../services/product/productSearchService');
      productSearchService.searchByBarcode.mockResolvedValue(mockProduct);

      const { getByTestId } = renderWithProviders(
        <TestNavigator initialRouteName="Scan" />,
        {
          initialState: {
            auth: { user: mockUser, loading: false },
          },
        }
      );

      // Simulate barcode scan
      const barcodeScanner = getByTestId('barcode-scanner');
      fireEvent(barcodeScanner, 'onBarCodeScanned', {
        type: 'ean13',
        data: '1234567890123',
      });

      // Should navigate to product analysis results
      await waitFor(() => {
        expect(getByTestId('product-analysis-results')).toBeTruthy();
      });
    });
  });

  describe('Product Analysis Flow', () => {
    it('should display product information and analysis', async () => {
      const { HuggingFaceService } = require('../../services/ai/huggingface');
      const mockAnalysis = {
        safety_score: 85,
        interactions: [],
        recommendations: ['Take with food'],
      };

      HuggingFaceService.mockImplementation(() => ({
        analyzeProduct: jest.fn().mockResolvedValue(mockAnalysis),
      }));

      const { getByText, getByTestId } = renderWithProviders(
        <TestNavigator initialRouteName="ProductAnalysisResults" />,
        {
          initialState: {
            auth: { user: mockUser, loading: false },
          },
          navigationInitialState: {
            routes: [
              {
                name: 'ProductAnalysisResults',
                params: { product: mockProduct },
              },
            ],
            index: 0,
          },
        }
      );

      // Should display product information
      expect(getByText(mockProduct.name)).toBeTruthy();
      expect(getByText(mockProduct.brand)).toBeTruthy();

      // Should display analysis results
      await waitFor(() => {
        expect(getByText('Safety Score: 85')).toBeTruthy();
        expect(getByText('Take with food')).toBeTruthy();
      });
    });

    it('should allow adding product to stack', async () => {
      const { getByTestId, getByText } = renderWithProviders(
        <TestNavigator initialRouteName="ProductAnalysisResults" />,
        {
          initialState: {
            auth: { user: mockUser, loading: false },
            stack: { items: [] },
          },
          navigationInitialState: {
            routes: [
              {
                name: 'ProductAnalysisResults',
                params: { product: mockProduct },
              },
            ],
            index: 0,
          },
        }
      );

      // Tap add to stack button
      const addToStackButton = getByTestId('add-to-stack-button');
      fireEvent.press(addToStackButton);

      // Should show success message
      await waitFor(() => {
        expect(getByText('Added to your stack')).toBeTruthy();
      });
    });
  });

  describe('Stack Management Flow', () => {
    it('should display user stack items', () => {
      const mockStackItems = [
        {
          id: '1',
          productId: mockProduct.id,
          name: mockProduct.name,
          dosage: '1000mg',
          frequency: 'Daily',
        },
      ];

      const { getByText } = renderWithProviders(
        <TestNavigator initialRouteName="Stack" />,
        {
          initialState: {
            auth: { user: mockUser, loading: false },
            stack: { items: mockStackItems },
          },
        }
      );

      expect(getByText(mockProduct.name)).toBeTruthy();
      expect(getByText('1000mg')).toBeTruthy();
      expect(getByText('Daily')).toBeTruthy();
    });

    it('should allow editing stack items', async () => {
      const mockStackItems = [
        {
          id: '1',
          productId: mockProduct.id,
          name: mockProduct.name,
          dosage: '1000mg',
          frequency: 'Daily',
        },
      ];

      const { getByTestId, getByDisplayValue } = renderWithProviders(
        <TestNavigator initialRouteName="Stack" />,
        {
          initialState: {
            auth: { user: mockUser, loading: false },
            stack: { items: mockStackItems },
          },
        }
      );

      // Tap edit button
      const editButton = getByTestId('edit-stack-item-1');
      fireEvent.press(editButton);

      // Should show edit form
      await waitFor(() => {
        expect(getByDisplayValue('1000mg')).toBeTruthy();
      });

      // Change dosage
      const dosageInput = getByDisplayValue('1000mg');
      fireEvent.changeText(dosageInput, '2000mg');

      // Save changes
      const saveButton = getByTestId('save-stack-item');
      fireEvent.press(saveButton);

      // Should update the item
      await waitFor(() => {
        expect(getByTestId('stack-item-1-dosage')).toHaveTextContent('2000mg');
      });
    });

    it('should allow removing stack items', async () => {
      const mockStackItems = [
        {
          id: '1',
          productId: mockProduct.id,
          name: mockProduct.name,
          dosage: '1000mg',
          frequency: 'Daily',
        },
      ];

      const { getByTestId, queryByText } = renderWithProviders(
        <TestNavigator initialRouteName="Stack" />,
        {
          initialState: {
            auth: { user: mockUser, loading: false },
            stack: { items: mockStackItems },
          },
        }
      );

      // Tap remove button
      const removeButton = getByTestId('remove-stack-item-1');
      fireEvent.press(removeButton);

      // Confirm removal
      const confirmButton = getByTestId('confirm-remove');
      fireEvent.press(confirmButton);

      // Item should be removed
      await waitFor(() => {
        expect(queryByText(mockProduct.name)).toBeNull();
      });
    });
  });

  describe('Profile Management Flow', () => {
    it('should display user profile information', () => {
      const { getByText } = renderWithProviders(
        <TestNavigator initialRouteName="Profile" />,
        {
          initialState: {
            auth: { user: mockUser, loading: false },
          },
        }
      );

      expect(getByText(mockUser.email)).toBeTruthy();
    });

    it('should navigate to health profile setup', async () => {
      const { getByTestId, getByText } = renderWithProviders(
        <TestNavigator initialRouteName="Profile" />,
        {
          initialState: {
            auth: { user: mockUser, loading: false },
          },
        }
      );

      // Tap health profile button
      const healthProfileButton = getByTestId('health-profile-button');
      fireEvent.press(healthProfileButton);

      // Should navigate to health profile setup
      await waitFor(() => {
        expect(getByText('Health Profile Setup')).toBeTruthy();
      });
    });
  });

  describe('Cross-Component Interactions', () => {
    it('should maintain state across navigation', async () => {
      const { getByTestId, getByText } = renderWithProviders(
        <TestNavigator />,
        {
          initialState: {
            auth: { user: mockUser, loading: false },
            stack: { items: [] },
          },
        }
      );

      // Start on home, navigate to scan
      const scanButton = getByTestId('scan-button');
      fireEvent.press(scanButton);

      await waitFor(() => {
        expect(getByText('Scan Product')).toBeTruthy();
      });

      // Navigate to stack
      const stackButton = getByTestId('stack-tab-button');
      fireEvent.press(stackButton);

      await waitFor(() => {
        expect(getByText('Your Stack')).toBeTruthy();
      });

      // Navigate back to home
      const homeButton = getByTestId('home-tab-button');
      fireEvent.press(homeButton);

      await waitFor(() => {
        expect(getByText('Welcome to PharmaGuide')).toBeTruthy();
      });
    });

    it('should handle deep linking navigation', async () => {
      const { getByText } = renderWithProviders(<TestNavigator />, {
        initialState: {
          auth: { user: mockUser, loading: false },
        },
        navigationInitialState: {
          routes: [
            {
              name: 'ProductAnalysisResults',
              params: {
                product: mockProduct,
                fromDeepLink: true,
              },
            },
          ],
          index: 0,
        },
      });

      // Should navigate directly to product analysis
      expect(getByText(mockProduct.name)).toBeTruthy();
    });

    it('should handle authentication state changes', async () => {
      const { getByText, rerender } = renderWithProviders(<TestNavigator />, {
        initialState: {
          auth: { user: null, loading: false },
        },
      });

      // Should show login screen for unauthenticated user
      expect(getByText('Sign In')).toBeTruthy();

      // Simulate user login
      rerender(<TestNavigator />, {
        initialState: {
          auth: { user: mockUser, loading: false },
        },
      });

      // Should show home screen for authenticated user
      await waitFor(() => {
        expect(getByText('Welcome to PharmaGuide')).toBeTruthy();
      });
    });
  });

  describe('Error Handling in Navigation', () => {
    it('should handle navigation errors gracefully', async () => {
      const { getByTestId, getByText } = renderWithProviders(
        <TestNavigator initialRouteName="Scan" />,
        {
          initialState: {
            auth: { user: mockUser, loading: false },
          },
        }
      );

      // Mock service error
      const {
        productSearchService,
      } = require('../../services/product/productSearchService');
      productSearchService.searchByBarcode.mockRejectedValue(
        new Error('Network error')
      );

      // Simulate barcode scan
      const barcodeScanner = getByTestId('barcode-scanner');
      fireEvent(barcodeScanner, 'onBarCodeScanned', {
        type: 'ean13',
        data: '1234567890123',
      });

      // Should show error message
      await waitFor(() => {
        expect(getByText('Failed to load product information')).toBeTruthy();
      });
    });

    it('should handle missing navigation parameters', () => {
      const { getByText } = renderWithProviders(
        <TestNavigator initialRouteName="ProductAnalysisResults" />,
        {
          initialState: {
            auth: { user: mockUser, loading: false },
          },
          navigationInitialState: {
            routes: [
              {
                name: 'ProductAnalysisResults',
                params: {}, // Missing product parameter
              },
            ],
            index: 0,
          },
        }
      );

      // Should show error state
      expect(getByText('Product not found')).toBeTruthy();
    });
  });
});
