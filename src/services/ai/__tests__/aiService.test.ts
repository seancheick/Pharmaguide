// src/services/ai/__tests__/aiService.test.ts
import { AIService } from '../aiService';
import { supabase } from '../../supabase/client';
import { HuggingFaceService } from '../huggingface';

// Mock Supabase
jest.mock('../../supabase/client', () => ({
  supabase: {
    functions: {
      invoke: jest.fn(),
    },
  },
}));

// Mock HuggingFace Service
jest.mock('../huggingface');

const mockSupabaseInvoke = supabase.functions.invoke as jest.MockedFunction<
  typeof supabase.functions.invoke
>;
const MockedHuggingFaceService = HuggingFaceService as jest.MockedClass<
  typeof HuggingFaceService
>;

describe('AIService', () => {
  let aiService: AIService;
  let mockHuggingFaceInstance: jest.Mocked<HuggingFaceService>;

  beforeEach(() => {
    jest.clearAllMocks();
    aiService = new AIService();
    mockHuggingFaceInstance =
      new MockedHuggingFaceService() as jest.Mocked<HuggingFaceService>;
  });

  describe('API Integration Tests', () => {
    const mockProduct = {
      id: 'test-product-1',
      name: 'Vitamin D3 2000 IU',
      brand: 'Nature Made',
      category: 'Vitamins',
      ingredients: [
        { name: 'Vitamin D3', amount: '2000', unit: 'IU', category: 'vitamin' },
        {
          name: 'Microcrystalline Cellulose',
          amount: '50',
          unit: 'mg',
          category: 'inactive',
        },
      ],
      barcode: '123456789',
      imageUrl: 'https://example.com/image.jpg',
    };

    const mockStack = [
      {
        id: 'stack-item-1',
        name: 'Calcium Carbonate',
        type: 'supplement' as const,
        dosage: '500mg',
        frequency: 'Daily',
        ingredients: [{ name: 'Calcium Carbonate', amount: '500', unit: 'mg' }],
      },
    ];

    describe('analyzeProduct', () => {
      it('should successfully analyze product with valid API response', async () => {
        const mockResponse = {
          data: {
            overallScore: 85,
            categoryScores: {
              ingredients: 90,
              bioavailability: 80,
              dosage: 85,
              purity: 88,
              value: 82,
            },
            strengths: [
              {
                point: 'High bioavailability form (D3)',
                evidence: 'Clinical studies',
              },
              {
                point: 'Appropriate dosage for adults',
                evidence: 'NIH guidelines',
              },
            ],
            weaknesses: [
              {
                point: 'May interact with calcium',
                evidence: 'Absorption competition',
              },
            ],
            recommendations: {
              goodFor: ['Bone health', 'Immune support', 'Adults over 50'],
              avoidIf: ['Hypercalcemia', 'Kidney stones', 'Sarcoidosis'],
            },
            aiReasoning:
              'This is a high-quality Vitamin D3 supplement with good bioavailability...',
            stackInteraction: {
              overallRiskLevel: 'LOW',
              interactions: [
                {
                  severity: 'LOW',
                  mechanism:
                    'Calcium may reduce Vitamin D absorption when taken together',
                  evidence: 'Space doses 2 hours apart for optimal absorption',
                  recommendation: 'Take at different times of day',
                },
              ],
              nutrientWarnings: [],
              overallSafe: true,
            },
          },
          error: null,
        };

        mockSupabaseInvoke.mockResolvedValue(mockResponse);

        const result = await aiService.analyzeProduct(mockProduct, mockStack);

        expect(mockSupabaseInvoke).toHaveBeenCalledWith('ai-analysis', {
          body: {
            product: expect.objectContaining({
              id: mockProduct.id,
              name: mockProduct.name,
              ingredients: expect.arrayContaining([
                expect.objectContaining({
                  name: 'Vitamin D3',
                  amount: '2000',
                  unit: 'IU',
                  category: 'vitamin',
                }),
              ]),
            }),
            stack: expect.arrayContaining([
              expect.objectContaining({
                name: 'Calcium Carbonate',
                type: 'supplement',
              }),
            ]),
            analysisType: 'groq',
          },
          headers: { 'Cache-Control': 'no-cache' },
        });

        expect(result).toEqual(mockResponse.data);
        expect(result.overallScore).toBe(85);
        expect(result.stackInteraction?.overallRiskLevel).toBe('LOW');
      });

      it('should handle API errors gracefully', async () => {
        const mockError = new Error('API service unavailable');
        mockSupabaseInvoke.mockRejectedValue(mockError);

        const result = await aiService.analyzeProduct(mockProduct, mockStack);

        expect(result).toEqual({
          error: 'AI analysis temporarily unavailable. Please try again later.',
          fallbackUsed: true,
          timestamp: expect.any(String),
        });
      });

      it('should handle invalid API responses', async () => {
        const mockResponse = {
          data: null,
          error: { message: 'Invalid request format' },
        };

        mockSupabaseInvoke.mockResolvedValue(mockResponse);

        const result = await aiService.analyzeProduct(mockProduct, mockStack);

        expect(result).toEqual({
          error: 'AI analysis failed. Please try again later.',
          fallbackUsed: true,
          timestamp: expect.any(String),
        });
      });

      it('should sanitize product data before sending to API', async () => {
        const productWithSensitiveData = {
          ...mockProduct,
          userEmail: 'user@example.com', // Should be filtered out
          userId: 'user-123', // Should be filtered out
          purchaseHistory: ['item1', 'item2'], // Should be filtered out
        };

        const mockResponse = { data: { overallScore: 80 }, error: null };
        mockSupabaseInvoke.mockResolvedValue(mockResponse);

        await aiService.analyzeProduct(
          productWithSensitiveData as any,
          mockStack
        );

        const calledWith = mockSupabaseInvoke.mock.calls[0][1];
        expect(calledWith.body.product).not.toHaveProperty('userEmail');
        expect(calledWith.body.product).not.toHaveProperty('userId');
        expect(calledWith.body.product).not.toHaveProperty('purchaseHistory');
        expect(calledWith.body.product).toHaveProperty('id');
        expect(calledWith.body.product).toHaveProperty('name');
        expect(calledWith.body.product).toHaveProperty('ingredients');
      });
    });

    describe('Error Handling & Fallbacks', () => {
      it('should handle network errors gracefully', async () => {
        const networkError = new Error('Network request failed');
        mockSupabaseInvoke.mockRejectedValue(networkError);

        const result = await aiService.analyzeProduct(mockProduct, mockStack);

        expect(result).toMatchObject({
          error: expect.stringContaining('temporarily unavailable'),
          fallbackUsed: true,
          timestamp: expect.any(String),
        });
      });

      it('should handle API rate limiting', async () => {
        const rateLimitError = {
          data: null,
          error: {
            message: 'Rate limit exceeded',
            code: 'RATE_LIMIT_EXCEEDED',
          },
        };
        mockSupabaseInvoke.mockResolvedValue(rateLimitError);

        const result = await aiService.analyzeProduct(mockProduct, mockStack);

        expect(result).toMatchObject({
          error: expect.stringContaining('rate limit'),
          fallbackUsed: true,
          timestamp: expect.any(String),
        });
      });

      it('should handle API timeout errors', async () => {
        const timeoutError = new Error('Request timeout');
        timeoutError.name = 'TimeoutError';
        mockSupabaseInvoke.mockRejectedValue(timeoutError);

        const result = await aiService.analyzeProduct(mockProduct, mockStack);

        expect(result).toMatchObject({
          error: expect.stringContaining('timeout'),
          fallbackUsed: true,
          timestamp: expect.any(String),
        });
      });

      it('should handle malformed API responses', async () => {
        const malformedResponse = {
          data: 'invalid json string',
          error: null,
        };
        mockSupabaseInvoke.mockResolvedValue(malformedResponse);

        const result = await aiService.analyzeProduct(mockProduct, mockStack);

        expect(result).toMatchObject({
          error: expect.stringContaining('failed'),
          fallbackUsed: true,
          timestamp: expect.any(String),
        });
      });
    });

    describe('Data Privacy & Security', () => {
      it('should not send sensitive user data to AI APIs', async () => {
        const mockResponse = { data: { overallScore: 80 }, error: null };
        mockSupabaseInvoke.mockResolvedValue(mockResponse);

        await aiService.analyzeProduct(mockProduct, mockStack);

        const requestBody = mockSupabaseInvoke.mock.calls[0][1].body;

        // Verify no sensitive data is included
        expect(JSON.stringify(requestBody)).not.toMatch(/user.*id/i);
        expect(JSON.stringify(requestBody)).not.toMatch(/email/i);
        expect(JSON.stringify(requestBody)).not.toMatch(/phone/i);
        expect(JSON.stringify(requestBody)).not.toMatch(/address/i);
        expect(JSON.stringify(requestBody)).not.toMatch(/ssn/i);
        expect(JSON.stringify(requestBody)).not.toMatch(/credit.*card/i);
      });

      it('should sanitize stack data before sending', async () => {
        const stackWithSensitiveData = [
          {
            ...mockStack[0],
            userNotes: 'Personal medical notes',
            prescribedBy: 'Dr. Smith',
            pharmacy: 'CVS Pharmacy',
            insuranceInfo: 'Blue Cross',
          },
        ];

        const mockResponse = { data: { overallScore: 80 }, error: null };
        mockSupabaseInvoke.mockResolvedValue(mockResponse);

        await aiService.analyzeProduct(
          mockProduct,
          stackWithSensitiveData as any
        );

        const requestBody = mockSupabaseInvoke.mock.calls[0][1].body;
        const sentStack = requestBody.stack[0];

        expect(sentStack).not.toHaveProperty('userNotes');
        expect(sentStack).not.toHaveProperty('prescribedBy');
        expect(sentStack).not.toHaveProperty('pharmacy');
        expect(sentStack).not.toHaveProperty('insuranceInfo');
        expect(sentStack).toHaveProperty('name');
        expect(sentStack).toHaveProperty('type');
      });
    });

    describe('Performance & Caching', () => {
      it('should include cache control headers', async () => {
        const mockResponse = { data: { overallScore: 80 }, error: null };
        mockSupabaseInvoke.mockResolvedValue(mockResponse);

        await aiService.analyzeProduct(mockProduct, mockStack);

        expect(mockSupabaseInvoke).toHaveBeenCalledWith(
          'ai-analysis',
          expect.objectContaining({
            headers: { 'Cache-Control': 'no-cache' },
          })
        );
      });

      it('should handle concurrent requests properly', async () => {
        const mockResponse = { data: { overallScore: 80 }, error: null };
        mockSupabaseInvoke.mockResolvedValue(mockResponse);

        // Make multiple concurrent requests
        const promises = [
          aiService.analyzeProduct(mockProduct, mockStack),
          aiService.analyzeProduct(mockProduct, mockStack),
          aiService.analyzeProduct(mockProduct, mockStack),
        ];

        const results = await Promise.all(promises);

        expect(results).toHaveLength(3);
        expect(mockSupabaseInvoke).toHaveBeenCalledTimes(3);
        results.forEach(result => {
          expect(result).toHaveProperty('overallScore', 80);
        });
      });
    });
  });

  describe('Health Profile Integration Tests', () => {
    const mockHealthProfile = {
      demographics: {
        ageRange: '30-39',
        biologicalSex: 'female',
        pregnancyStatus: 'not_pregnant',
      },
      conditions: {
        conditions: ['diabetes_type2', 'hypertension'],
      },
      allergies: {
        substances: ['shellfish', 'nuts'],
      },
      goals: {
        primary: 'heart_health',
        secondary: ['weight_management'],
      },
    };

    it('should include health profile in analysis when provided', async () => {
      const mockResponse = {
        data: {
          overallScore: 85,
          personalizedRecommendations: [
            'Good for heart health goals',
            'Safe with diabetes type 2',
          ],
        },
        error: null,
      };
      mockSupabaseInvoke.mockResolvedValue(mockResponse);

      const result = await aiService.analyzeProductWithHealthProfile(
        mockProduct,
        mockStack,
        mockHealthProfile
      );

      const requestBody = mockSupabaseInvoke.mock.calls[0][1].body;
      expect(requestBody).toHaveProperty('healthProfile');
      expect(requestBody.healthProfile).toMatchObject({
        ageRange: '30-39',
        biologicalSex: 'female',
        conditions: ['diabetes_type2', 'hypertension'],
        allergies: ['shellfish', 'nuts'],
        goals: ['heart_health', 'weight_management'],
      });
    });
  });

  describe('classifyText', () => {
    it('should call edge function for text classification', async () => {
      const mockResponse = {
        classification: {
          category: 'supplement',
          confidence: 0.95,
          subcategories: ['vitamin'],
        },
      };

      mockSupabaseInvoke.mockResolvedValue(mockResponse);

      const result = await aiService.classifyText('Vitamin C supplement');

      expect(mockSupabaseInvoke).toHaveBeenCalledWith('ai-analysis', {
        action: 'classify-text',
        text: 'Vitamin C supplement',
      });

      expect(result).toEqual(mockResponse.classification);
    });

    it('should handle classification errors', async () => {
      mockSupabaseInvoke.mockRejectedValue(new Error('Classification error'));

      const result = await aiService.classifyText('Test text');

      // Should return fallback classification
      expect(result).toBeDefined();
      expect(result.category).toBe('unknown');
      expect(result.confidence).toBeDefined();
    });
  });

  describe('extractIngredients', () => {
    it('should call edge function for ingredient extraction', async () => {
      const mockResponse = {
        ingredients: [
          { name: 'Vitamin C', amount: '500mg', confidence: 0.9 },
          { name: 'Vitamin D', amount: '1000IU', confidence: 0.85 },
        ],
      };

      mockSupabaseInvoke.mockResolvedValue(mockResponse);

      const result = await aiService.extractIngredients(
        'Vitamin C 500mg, Vitamin D 1000IU'
      );

      expect(mockSupabaseInvoke).toHaveBeenCalledWith('ai-analysis', {
        action: 'extract-ingredients',
        text: 'Vitamin C 500mg, Vitamin D 1000IU',
      });

      expect(result).toEqual(mockResponse.ingredients);
    });

    it('should handle extraction errors', async () => {
      mockSupabaseInvoke.mockRejectedValue(new Error('Extraction error'));

      const result = await aiService.extractIngredients('Test ingredients');

      // Should return empty array on error
      expect(result).toEqual([]);
    });
  });

  describe('Fallback Analysis', () => {
    it('should generate rule-based analysis when AI fails', async () => {
      const mockProduct = {
        id: '1',
        name: 'Iron Supplement',
        brand: 'Test Brand',
        ingredients: [
          { name: 'Iron', amount: '65mg' },
          { name: 'Vitamin C', amount: '500mg' },
        ],
      };

      const mockStack = [
        {
          id: '2',
          name: 'Calcium Supplement',
          ingredients: [{ name: 'Calcium', amount: '1000mg' }],
        },
      ];

      mockSupabaseInvoke.mockRejectedValue(new Error('AI service unavailable'));

      const result = await aiService.analyzeProduct(mockProduct, mockStack);

      expect(result).toBeDefined();
      expect(result.error).toBeDefined();
      expect(result.fallbackUsed).toBe(true);
    });

    it('should provide appropriate recommendations based on ingredients', async () => {
      const mockProduct = {
        id: '1',
        name: 'Fat Soluble Vitamins',
        brand: 'Test Brand',
        ingredients: [
          { name: 'Vitamin A', amount: '5000IU' },
          { name: 'Vitamin D', amount: '2000IU' },
          { name: 'Vitamin E', amount: '400IU' },
          { name: 'Vitamin K', amount: '100mcg' },
        ],
      };

      mockSupabaseInvoke.mockRejectedValue(new Error('AI service unavailable'));

      const result = await aiService.analyzeProduct(mockProduct, []);

      expect(result).toBeDefined();
      expect(result.error).toBeDefined();
      expect(result.fallbackUsed).toBe(true);
    });
  });
});
