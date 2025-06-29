// src/utils/__tests__/databaseTransforms.test.ts
/**
 * Tests for centralized database transformation utilities
 * Simple unit tests without React Native dependencies
 */

// Mock React Native modules to avoid test setup issues
import {
  transformDbToProduct,
  transformProductToDb,
  createProductInsertPayload,
  validateProduct,
  sanitizeProduct,
  transformDbToScanResult,
  transformScanResultToDb,
  createScanInsertPayload,
  validateScanResult,
  sanitizeScanResult,
  transformDbToUserProfile,
  transformUserProfileToDb,
  validateUserProfile,
  sanitizeUserProfile,
} from '../databaseTransforms';

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Define minimal types for testing
type DatabaseProduct = {
  id: string;
  barcode: string | null;
  name: string;
  brand: string | null;
  category: string | null;
  image_url: string | null;
  ingredients: any | null;
  verified: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type Product = {
  id: string;
  name: string;
  brand: string;
  category: any;
  barcode?: string;
  ingredients: any[];
  servingSize: string;
  servingsPerContainer: number;
  imageUrl?: string;
  verified: boolean;
  thirdPartyTested: boolean;
  certifications: string[];
  createdAt: string;
  updatedAt: string;
};

describe('Database Transformations', () => {
  describe('Product Transformations', () => {
    const mockDbProduct: DatabaseProduct = {
      id: '123',
      barcode: '1234567890',
      name: 'Test Product',
      generic_name: 'Generic Test Product',
      brand: 'Test Brand',
      manufacturer: 'Test Manufacturer',
      category: 'supplement',
      dosage_form: 'tablet',
      strength: '500mg',
      active_ingredients: [{ name: 'Vitamin C', amount: 100, unit: 'mg' }],
      inactive_ingredients: [
        'microcrystalline cellulose',
        'magnesium stearate',
      ],
      image_url: 'https://example.com/image.jpg',
      verified: true,
      fda_approved: true,
      otc_status: true,
      warnings: [
        'Do not exceed recommended dose',
        'Consult physician if pregnant',
      ],
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
      deleted_at: null,
    };

    const mockAppProduct: Product = {
      id: '123',
      name: 'Test Product',
      brand: 'Test Brand',
      category: 'supplement' as any,
      barcode: '1234567890',
      ingredients: [
        { name: 'Vitamin C', amount: 100, unit: 'mg', form: 'powder' as any },
      ],
      servingSize: 'tablet',
      servingsPerContainer: 30,
      dosage: '500mg',
      imageUrl: 'https://example.com/image.jpg',
      verified: true,
      thirdPartyTested: true,
      certifications: [],
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
    };

    test('transformDbToProduct converts database format to app format', () => {
      const result = transformDbToProduct(mockDbProduct);

      expect(result.id).toBe(mockDbProduct.id);
      expect(result.name).toBe(mockDbProduct.name);
      expect(result.brand).toBe(mockDbProduct.brand);
      expect(result.imageUrl).toBe(mockDbProduct.image_url); // snake_case → camelCase
      expect(result.createdAt).toBe(mockDbProduct.created_at); // snake_case → camelCase
      expect(result.updatedAt).toBe(mockDbProduct.updated_at); // snake_case → camelCase

      // Test new field mappings
      expect(result.servingSize).toBe(mockDbProduct.dosage_form); // dosage_form → servingSize
      expect(result.dosage).toBe(mockDbProduct.strength); // strength → dosage
      expect(result.ingredients).toEqual(mockDbProduct.active_ingredients); // active_ingredients → ingredients
      expect(result.thirdPartyTested).toBe(mockDbProduct.fda_approved); // fda_approved → thirdPartyTested
      expect(result.verified).toBe(mockDbProduct.verified);
      expect(result.servingsPerContainer).toBe(1); // Default value
      expect(result.certifications).toEqual([]); // Default value (warnings not mapped to certifications)
    });

    test('transformProductToDb converts app format to database format', () => {
      const result = transformProductToDb(mockAppProduct);

      expect(result.id).toBe(mockAppProduct.id);
      expect(result.name).toBe(mockAppProduct.name);
      expect(result.brand).toBe(mockAppProduct.brand);
      expect(result.image_url).toBe(mockAppProduct.imageUrl); // camelCase → snake_case
      expect(result.created_at).toBe(mockAppProduct.createdAt); // camelCase → snake_case
      expect(result.updated_at).toBe(mockAppProduct.updatedAt); // camelCase → snake_case
    });

    test('createProductInsertPayload creates valid insert payload', () => {
      const timestamp = '2023-01-01T00:00:00Z';
      const result = createProductInsertPayload(mockAppProduct, timestamp);

      expect(result.name).toBe(mockAppProduct.name);
      expect(result.image_url).toBe(mockAppProduct.imageUrl);
      expect(result.created_at).toBe(timestamp);
      expect(result.updated_at).toBe(timestamp);
      expect(result.verified).toBe(false); // Default for new products
    });

    test('validateProduct validates required fields', () => {
      const validProduct = { name: 'Test Product' };
      const invalidProduct = { name: '' };

      expect(validateProduct(validProduct)).toEqual([]);
      expect(validateProduct(invalidProduct)).toContain(
        'Product name is required'
      );
    });

    test('sanitizeProduct cleans and sanitizes data', () => {
      const dirtyProduct = {
        name: '  Test Product  ',
        brand: '  Test Brand  ',
        ingredients: null as any,
      };

      const result = sanitizeProduct(dirtyProduct);

      expect(result.name).toBe('Test Product');
      expect(result.brand).toBe('Test Brand');
      expect(result.ingredients).toEqual([]);
    });
  });

  describe('Scan History Transformations', () => {
    const mockDbScan: DatabaseScanHistory = {
      id: '456',
      user_id: 'user123',
      product_id: 'product123',
      scan_type: 'barcode',
      analysis_score: 85,
      scanned_at: '2023-01-01T00:00:00Z',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
      deleted_at: null,
    };

    test('transformDbToScanResult converts database format to app format', () => {
      const result = transformDbToScanResult(mockDbScan);

      expect(result.id).toBe(mockDbScan.id);
      expect(result.productId).toBe(mockDbScan.product_id); // snake_case → camelCase
      expect(result.scanType).toBe(mockDbScan.scan_type); // snake_case → camelCase
      expect(result.analysisScore).toBe(mockDbScan.analysis_score); // snake_case → camelCase
      expect(result.scannedAt).toBe(mockDbScan.scanned_at); // snake_case → camelCase
    });

    test('validateScanResult validates scan type and analysis score', () => {
      const validScan = { scanType: 'barcode' as const, analysisScore: 50 };
      const invalidScan = { scanType: 'invalid' as any, analysisScore: 150 };

      expect(validateScanResult(validScan)).toEqual([]);
      expect(validateScanResult(invalidScan)).toContain(
        'Valid scan type is required (barcode, ocr, voice, or manual)'
      );
      expect(validateScanResult(invalidScan)).toContain(
        'Analysis score must be between 0 and 100'
      );
    });

    test('sanitizeScanResult cleans and sanitizes data', () => {
      const dirtyScan = {
        scanType: undefined as any,
        analysisScore: 150,
      };

      const result = sanitizeScanResult(dirtyScan);

      expect(result.scanType).toBe('barcode');
      expect(result.analysisScore).toBe(100); // Clamped to max
      expect(result.scannedAt).toBeDefined();
    });
  });

  describe('User Profile Transformations', () => {
    const mockDbProfile: DatabaseUserProfile = {
      id: '789',
      user_id: 'user123',
      first_name: 'John',
      last_name: 'Doe',
      age: 30,
      gender: 'male',
      health_goals: ['weight_loss', 'muscle_gain'],
      conditions: ['diabetes'],
      allergies: ['nuts'],
      medications: ['metformin'],
      genetics: null,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
      deleted_at: null,
    };

    test('transformDbToUserProfile converts database format to app format', () => {
      const result = transformDbToUserProfile(mockDbProfile);

      expect(result.firstName).toBe(mockDbProfile.first_name); // snake_case → camelCase
      expect(result.lastName).toBe(mockDbProfile.last_name); // snake_case → camelCase
      expect(result.healthGoals).toEqual(mockDbProfile.health_goals); // snake_case → camelCase
      expect(result.age).toBe(mockDbProfile.age);
      expect(result.gender).toBe(mockDbProfile.gender);
    });

    test('validateUserProfile validates demographics and health data', () => {
      const validProfile = {
        demographics: {
          biologicalSex: 'female' as const,
          ageRange: '25-34' as const,
        },
        healthGoals: {
          primary: 'energy_boost' as const,
        },
      };

      const invalidProfile = {
        demographics: {
          biologicalSex: 'invalid' as any,
          ageRange: 'invalid' as any,
        },
        healthGoals: {
          primary: 'invalid_goal' as any,
        },
      };

      expect(validateUserProfile(validProfile)).toEqual([]);
      expect(validateUserProfile(invalidProfile).length).toBeGreaterThan(0);
    });

    test('sanitizeUserProfile cleans and sanitizes data', () => {
      const dirtyProfile = {
        demographics: {
          displayName: '  John Doe  ',
          biologicalSex: 'MALE' as any,
        },
        healthConditions: {
          conditions: [
            { id: '1', name: '  diabetes  ', category: 'endocrine' as const },
            { id: '2', name: '', category: 'other' as const }, // Should be filtered out
          ],
          consentGiven: true,
          lastUpdated: '2023-01-01T00:00:00Z',
        },
      };

      const result = sanitizeUserProfile(dirtyProfile);

      expect(result.demographics?.displayName).toBe('John Doe');
      expect(result.demographics?.biologicalSex).toBe('male');
      expect(result.healthConditions?.conditions).toHaveLength(1);
      expect(result.healthConditions?.conditions?.[0].name).toBe('diabetes');
    });
  });
});
