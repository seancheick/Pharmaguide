// src/services/navigation/__tests__/deepLinkingService.test.ts
// Unit tests for DeepLinkingService

import { DeepLinkingService, DeepLinkValidators } from '../deepLinkingService';

// Mock React Native Linking
jest.mock('react-native', () => ({
  Linking: {
    addEventListener: jest.fn(),
    getInitialURL: jest.fn(),
    canOpenURL: jest.fn(() => Promise.resolve(true)),
    openURL: jest.fn(() => Promise.resolve()),
  },
}));

describe('DeepLinkingService', () => {
  let service: DeepLinkingService;
  let mockNavigationRef: any;

  beforeEach(() => {
    service = DeepLinkingService.getInstance();
    mockNavigationRef = {
      navigate: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('initializes with configuration', async () => {
      const config = {
        scheme: 'testapp',
        prefixes: ['https://testapp.com'],
        routes: {
          home: {
            path: '/',
            screen: 'Home',
          },
        },
        enableLogging: true,
      };

      await service.initialize(config, mockNavigationRef);

      expect(service).toBeDefined();
    });
  });

  describe('URL Parsing', () => {
    beforeEach(async () => {
      const config = {
        scheme: 'testapp',
        prefixes: ['https://testapp.com'],
        routes: {
          home: {
            path: '/',
            screen: 'Home',
          },
          product: {
            path: '/product/:id',
            screen: 'Product',
            validator: DeepLinkValidators.required(['id']),
          },
          search: {
            path: '/search',
            screen: 'Search',
          },
        },
        enableLogging: false,
      };

      await service.initialize(config, mockNavigationRef);
    });

    it('parses simple URLs correctly', () => {
      const result = service.parseDeepLink('testapp://');
      
      expect(result.isValid).toBe(true);
      expect(result.route).toBe('home');
    });

    it('parses URLs with path parameters', () => {
      const result = service.parseDeepLink('testapp://product/123');
      
      expect(result.isValid).toBe(true);
      expect(result.route).toBe('product');
      expect(result.params.id).toBe('123');
    });

    it('parses URLs with query parameters', () => {
      const result = service.parseDeepLink('testapp://search?q=vitamin&category=supplements');
      
      expect(result.isValid).toBe(true);
      expect(result.route).toBe('search');
      expect(result.params.q).toBe('vitamin');
      expect(result.params.category).toBe('supplements');
    });

    it('handles URLs with both path and query parameters', () => {
      const result = service.parseDeepLink('testapp://product/123?ref=email&utm_source=newsletter');
      
      expect(result.isValid).toBe(true);
      expect(result.route).toBe('product');
      expect(result.params.id).toBe('123');
      expect(result.params.ref).toBe('email');
      expect(result.params.utm_source).toBe('newsletter');
    });

    it('handles invalid URLs gracefully', () => {
      const result = service.parseDeepLink('testapp://invalid-route');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('No matching route found');
    });

    it('validates required parameters', () => {
      const result = service.parseDeepLink('testapp://product/');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Missing required parameters');
    });
  });

  describe('URL Generation', () => {
    beforeEach(async () => {
      const config = {
        scheme: 'testapp',
        prefixes: [],
        routes: {
          product: {
            path: '/product/:id',
            screen: 'Product',
          },
          search: {
            path: '/search',
            screen: 'Search',
          },
        },
        enableLogging: false,
      };

      await service.initialize(config, mockNavigationRef);
    });

    it('generates URLs with path parameters', () => {
      const url = service.generateDeepLink('product', { id: '123' });
      
      expect(url).toBe('testapp://product/123');
    });

    it('generates URLs with query parameters', () => {
      const url = service.generateDeepLink('search', { q: 'vitamin', category: 'supplements' });
      
      expect(url).toBe('testapp://search?q=vitamin&category=supplements');
    });

    it('handles mixed parameters correctly', () => {
      const url = service.generateDeepLink('product', { 
        id: '123', 
        ref: 'email',
        utm_source: 'newsletter'
      });
      
      expect(url).toBe('testapp://product/123?ref=email&utm_source=newsletter');
    });

    it('throws error for invalid route', () => {
      expect(() => {
        service.generateDeepLink('invalid-route', {});
      }).toThrow('Route invalid-route not found');
    });
  });

  describe('Navigation Handling', () => {
    beforeEach(async () => {
      const config = {
        scheme: 'testapp',
        prefixes: [],
        routes: {
          home: {
            path: '/',
            screen: 'Home',
          },
          product: {
            path: '/product/:id',
            screen: 'Product',
          },
        },
        enableLogging: false,
      };

      await service.initialize(config, mockNavigationRef);
    });

    it('navigates to valid routes', async () => {
      const result = await service.handleDeepLink('testapp://product/123');
      
      expect(result).toBe(true);
      expect(mockNavigationRef.navigate).toHaveBeenCalledWith('Product', { id: '123' });
    });

    it('handles navigation errors gracefully', async () => {
      mockNavigationRef.navigate.mockImplementation(() => {
        throw new Error('Navigation error');
      });

      const result = await service.handleDeepLink('testapp://product/123');
      
      expect(result).toBe(false);
    });
  });

  describe('Route Guards', () => {
    beforeEach(async () => {
      const config = {
        scheme: 'testapp',
        prefixes: [],
        routes: {
          protected: {
            path: '/protected',
            screen: 'Protected',
            guards: [() => false], // Always block
          },
          allowed: {
            path: '/allowed',
            screen: 'Allowed',
            guards: [() => true], // Always allow
          },
        },
        enableLogging: false,
      };

      await service.initialize(config, mockNavigationRef);
    });

    it('blocks navigation when guards return false', async () => {
      const result = await service.handleDeepLink('testapp://protected');
      
      expect(result).toBe(false);
      expect(mockNavigationRef.navigate).not.toHaveBeenCalled();
    });

    it('allows navigation when guards return true', async () => {
      const result = await service.handleDeepLink('testapp://allowed');
      
      expect(result).toBe(true);
      expect(mockNavigationRef.navigate).toHaveBeenCalledWith('Allowed', {});
    });
  });

  describe('Authentication Requirements', () => {
    beforeEach(async () => {
      const config = {
        scheme: 'testapp',
        prefixes: [],
        routes: {
          public: {
            path: '/public',
            screen: 'Public',
            requiresAuth: false,
          },
          private: {
            path: '/private',
            screen: 'Private',
            requiresAuth: true,
          },
        },
        enableLogging: false,
      };

      await service.initialize(config, mockNavigationRef);
    });

    it('allows access to public routes', async () => {
      const result = await service.handleDeepLink('testapp://public');
      
      expect(result).toBe(true);
      expect(mockNavigationRef.navigate).toHaveBeenCalledWith('Public', {});
    });

    // Note: Authentication check would need to be mocked based on actual implementation
  });

  describe('External URL Handling', () => {
    it('opens external URLs', async () => {
      const { Linking } = require('react-native');
      
      const result = await service.openExternalURL('https://example.com');
      
      expect(result).toBe(true);
      expect(Linking.openURL).toHaveBeenCalledWith('https://example.com');
    });

    it('handles URLs that cannot be opened', async () => {
      const { Linking } = require('react-native');
      Linking.canOpenURL.mockResolvedValue(false);
      
      const result = await service.openExternalURL('invalid://url');
      
      expect(result).toBe(false);
    });
  });
});

describe('DeepLinkValidators', () => {
  describe('required validator', () => {
    it('validates required fields are present', () => {
      const result = DeepLinkValidators.required({ id: '123', name: 'test' }, ['id', 'name']);
      
      expect(result.isValid).toBe(true);
    });

    it('fails when required fields are missing', () => {
      const result = DeepLinkValidators.required({ id: '123' }, ['id', 'name']);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Missing required parameters: name');
    });

    it('fails when required fields are empty', () => {
      const result = DeepLinkValidators.required({ id: '', name: 'test' }, ['id', 'name']);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Missing required parameters: id');
    });
  });

  describe('types validator', () => {
    it('validates correct types', () => {
      const result = DeepLinkValidators.types(
        { id: '123', count: 5, active: true },
        { id: 'string', count: 'number', active: 'boolean' }
      );
      
      expect(result.isValid).toBe(true);
    });

    it('fails for incorrect types', () => {
      const result = DeepLinkValidators.types(
        { id: 123, count: '5' },
        { id: 'string', count: 'number' }
      );
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('should be string');
      expect(result.error).toContain('should be number');
    });
  });

  describe('patterns validator', () => {
    it('validates matching patterns', () => {
      const result = DeepLinkValidators.patterns(
        { email: 'test@example.com', phone: '1234567890' },
        { 
          email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          phone: /^\d{10}$/
        }
      );
      
      expect(result.isValid).toBe(true);
    });

    it('fails for non-matching patterns', () => {
      const result = DeepLinkValidators.patterns(
        { email: 'invalid-email', phone: '123' },
        { 
          email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          phone: /^\d{10}$/
        }
      );
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('format is invalid');
    });
  });

  describe('ranges validator', () => {
    it('validates values within range', () => {
      const result = DeepLinkValidators.ranges(
        { age: 25, score: 85 },
        { 
          age: { min: 18, max: 65 },
          score: { min: 0, max: 100 }
        }
      );
      
      expect(result.isValid).toBe(true);
    });

    it('fails for values outside range', () => {
      const result = DeepLinkValidators.ranges(
        { age: 15, score: 150 },
        { 
          age: { min: 18, max: 65 },
          score: { min: 0, max: 100 }
        }
      );
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('must be at least 18');
      expect(result.error).toContain('must be at most 100');
    });
  });

  describe('sanitize validator', () => {
    it('removes dangerous content', () => {
      const result = DeepLinkValidators.sanitize({
        name: '<script>alert("xss")</script>John',
        description: 'javascript:alert(1)',
        __proto__: 'dangerous',
      });
      
      expect(result.isValid).toBe(true);
      expect(result.sanitizedParams.name).not.toContain('<script>');
      expect(result.sanitizedParams.description).not.toContain('javascript:');
      expect(result.sanitizedParams.__proto__).toBeUndefined();
    });

    it('limits string length', () => {
      const longString = 'a'.repeat(2000);
      const result = DeepLinkValidators.sanitize({ text: longString });
      
      expect(result.isValid).toBe(true);
      expect(result.sanitizedParams.text.length).toBeLessThanOrEqual(1000);
    });
  });

  describe('combine validator', () => {
    it('combines multiple validators', () => {
      const validator = DeepLinkValidators.combine(
        (params) => DeepLinkValidators.required(params, ['id']),
        (params) => DeepLinkValidators.types(params, { id: 'string' }),
        DeepLinkValidators.sanitize
      );

      const result = validator({ id: 'test123' });
      
      expect(result.isValid).toBe(true);
    });

    it('fails if any validator fails', () => {
      const validator = DeepLinkValidators.combine(
        (params) => DeepLinkValidators.required(params, ['id']),
        (params) => DeepLinkValidators.types(params, { id: 'string' })
      );

      const result = validator({ id: 123 }); // Wrong type
      
      expect(result.isValid).toBe(false);
    });
  });
});
