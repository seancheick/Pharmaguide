// src/tests/integration/api.integration.test.ts
// Integration tests for API calls and external services

import { supabase } from '../../services/supabase/client';
import { HuggingFaceService } from '../../services/ai/huggingface';
import { productSearchService } from '../../services/product/productSearchService';
import { interactionService } from '../../services/interaction/interactionService';

// Mock network responses for integration tests
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  describe('Supabase Integration', () => {
    describe('Authentication', () => {
      it('should handle user registration flow', async () => {
        const mockUser = {
          id: 'test-user-123',
          email: 'test@example.com',
          created_at: '2024-01-01T00:00:00Z',
        };

        // Mock successful registration
        const mockSignUp = jest.spyOn(supabase.auth, 'signUp').mockResolvedValue({
          data: { user: mockUser, session: null },
          error: null,
        });

        const result = await supabase.auth.signUp({
          email: 'test@example.com',
          password: 'SecurePass123!',
        });

        expect(mockSignUp).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'SecurePass123!',
        });

        expect(result.data.user).toEqual(mockUser);
        expect(result.error).toBeNull();
      });

      it('should handle user login flow', async () => {
        const mockSession = {
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          user: {
            id: 'test-user-123',
            email: 'test@example.com',
          },
        };

        const mockSignIn = jest.spyOn(supabase.auth, 'signInWithPassword').mockResolvedValue({
          data: { user: mockSession.user, session: mockSession },
          error: null,
        });

        const result = await supabase.auth.signInWithPassword({
          email: 'test@example.com',
          password: 'SecurePass123!',
        });

        expect(mockSignIn).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'SecurePass123!',
        });

        expect(result.data.session).toEqual(mockSession);
        expect(result.error).toBeNull();
      });

      it('should handle authentication errors', async () => {
        const mockError = {
          message: 'Invalid login credentials',
          status: 400,
        };

        const mockSignIn = jest.spyOn(supabase.auth, 'signInWithPassword').mockResolvedValue({
          data: { user: null, session: null },
          error: mockError,
        });

        const result = await supabase.auth.signInWithPassword({
          email: 'invalid@example.com',
          password: 'wrongpassword',
        });

        expect(result.error).toEqual(mockError);
        expect(result.data.user).toBeNull();
      });
    });

    describe('Database Operations', () => {
      it('should handle user stack operations', async () => {
        const mockStackItem = {
          id: 'stack-item-123',
          user_id: 'test-user-123',
          product_name: 'Vitamin D3',
          dosage: '1000 IU',
          frequency: 'Daily',
          created_at: '2024-01-01T00:00:00Z',
        };

        const mockInsert = jest.fn().mockResolvedValue({
          data: [mockStackItem],
          error: null,
        });

        const mockFrom = jest.spyOn(supabase, 'from').mockReturnValue({
          insert: mockInsert,
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
        } as any);

        const result = await supabase
          .from('user_stacks')
          .insert({
            user_id: 'test-user-123',
            product_name: 'Vitamin D3',
            dosage: '1000 IU',
            frequency: 'Daily',
          });

        expect(mockFrom).toHaveBeenCalledWith('user_stacks');
        expect(mockInsert).toHaveBeenCalled();
        expect(result.data).toEqual([mockStackItem]);
      });

      it('should handle database errors', async () => {
        const mockError = {
          message: 'Database connection failed',
          code: 'PGRST301',
        };

        const mockInsert = jest.fn().mockResolvedValue({
          data: null,
          error: mockError,
        });

        jest.spyOn(supabase, 'from').mockReturnValue({
          insert: mockInsert,
        } as any);

        const result = await supabase
          .from('user_stacks')
          .insert({ invalid_data: true });

        expect(result.error).toEqual(mockError);
        expect(result.data).toBeNull();
      });
    });
  });

  describe('AI Service Integration', () => {
    let huggingFaceService: HuggingFaceService;

    beforeEach(() => {
      huggingFaceService = new HuggingFaceService();
    });

    it('should analyze product ingredients', async () => {
      const mockAnalysisResponse = {
        safety_score: 85,
        interactions: [
          {
            ingredient1: 'Vitamin D3',
            ingredient2: 'Magnesium',
            severity: 'low',
            description: 'May enhance absorption',
          },
        ],
        recommendations: [
          'Take with food for better absorption',
          'Monitor vitamin D levels regularly',
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAnalysisResponse),
      });

      const result = await huggingFaceService.analyzeProduct({
        name: 'Vitamin D3 + Magnesium',
        ingredients: ['Vitamin D3', 'Magnesium'],
        dosage: '1000 IU + 200mg',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('huggingface.co'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Bearer'),
            'Content-Type': 'application/json',
          }),
        })
      );

      expect(result).toEqual(mockAnalysisResponse);
    });

    it('should handle AI service errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Rate limit exceeded',
      });

      await expect(
        huggingFaceService.analyzeProduct({
          name: 'Test Product',
          ingredients: ['Test Ingredient'],
          dosage: '100mg',
        })
      ).rejects.toThrow('Rate limit exceeded');
    });

    it('should handle network timeouts', async () => {
      mockFetch.mockImplementationOnce(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Network timeout')), 100)
        )
      );

      await expect(
        huggingFaceService.analyzeProduct({
          name: 'Test Product',
          ingredients: ['Test Ingredient'],
          dosage: '100mg',
        })
      ).rejects.toThrow('Network timeout');
    });
  });

  describe('Product Search Integration', () => {
    it('should search products by barcode', async () => {
      const mockProduct = {
        barcode: '1234567890123',
        name: 'Vitamin D3',
        brand: 'Nature Made',
        ingredients: ['Vitamin D3', 'Cellulose'],
        serving_size: '1 tablet',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ product: mockProduct }),
      });

      const result = await productSearchService.searchByBarcode('1234567890123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('1234567890123'),
        expect.objectContaining({
          method: 'GET',
        })
      );

      expect(result).toEqual(mockProduct);
    });

    it('should search products by name', async () => {
      const mockResults = [
        {
          name: 'Vitamin D3 1000 IU',
          brand: 'Nature Made',
          score: 0.95,
        },
        {
          name: 'Vitamin D3 2000 IU',
          brand: 'NOW Foods',
          score: 0.87,
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ results: mockResults }),
      });

      const result = await productSearchService.searchByName('Vitamin D3');

      expect(result).toEqual(mockResults);
    });

    it('should handle product not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Product not found',
      });

      await expect(
        productSearchService.searchByBarcode('0000000000000')
      ).rejects.toThrow('Product not found');
    });
  });

  describe('Interaction Service Integration', () => {
    it('should check supplement interactions', async () => {
      const mockInteractions = [
        {
          supplement1: 'Vitamin D3',
          supplement2: 'Calcium',
          severity: 'moderate',
          description: 'May increase calcium absorption',
          recommendation: 'Monitor calcium levels',
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ interactions: mockInteractions }),
      });

      const result = await interactionService.checkInteractions([
        'Vitamin D3',
        'Calcium',
      ]);

      expect(result).toEqual(mockInteractions);
    });

    it('should handle no interactions found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ interactions: [] }),
      });

      const result = await interactionService.checkInteractions([
        'Vitamin C',
        'Vitamin E',
      ]);

      expect(result).toEqual([]);
    });
  });

  describe('Cross-Service Integration', () => {
    it('should handle complete product analysis workflow', async () => {
      // Mock product search
      const mockProduct = {
        barcode: '1234567890123',
        name: 'Multivitamin Complex',
        ingredients: ['Vitamin D3', 'Vitamin C', 'Calcium'],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ product: mockProduct }),
      });

      // Mock interaction check
      const mockInteractions = [
        {
          supplement1: 'Vitamin D3',
          supplement2: 'Calcium',
          severity: 'moderate',
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ interactions: mockInteractions }),
      });

      // Mock AI analysis
      const mockAnalysis = {
        safety_score: 78,
        recommendations: ['Take with food'],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAnalysis),
      });

      // Execute workflow
      const product = await productSearchService.searchByBarcode('1234567890123');
      const interactions = await interactionService.checkInteractions(product.ingredients);
      const analysis = await huggingFaceService.analyzeProduct(product);

      expect(product).toEqual(mockProduct);
      expect(interactions).toEqual(mockInteractions);
      expect(analysis).toEqual(mockAnalysis);
    });

    it('should handle partial failures gracefully', async () => {
      // Product search succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          product: { name: 'Test Product', ingredients: ['Vitamin C'] }
        }),
      });

      // Interaction check fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      // AI analysis succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ safety_score: 90 }),
      });

      const product = await productSearchService.searchByBarcode('1234567890123');
      
      await expect(
        interactionService.checkInteractions(product.ingredients)
      ).rejects.toThrow();

      const analysis = await huggingFaceService.analyzeProduct(product);

      expect(product).toBeDefined();
      expect(analysis).toBeDefined();
    });
  });
});
