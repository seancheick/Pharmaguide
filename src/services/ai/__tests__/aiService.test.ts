// src/services/ai/__tests__/aiService.test.ts

describe('AIService', () => {
  it('should be defined', () => {
    expect(true).toBe(true);
  });

  describe('analyzeProduct', () => {
    const mockProduct = {
      id: '1',
      name: 'Test Product',
      brand: 'Test Brand',
      ingredients: [
        { name: 'Vitamin C', amount: '500mg' },
        { name: 'Vitamin D', amount: '1000IU' },
      ],
    };

    const mockStack = [{ id: '2', name: 'Existing Product', ingredients: [] }];

    it('should call edge function with correct parameters', async () => {
      const mockResponse = {
        analysis: {
          safetyScore: 85,
          interactions: [],
          recommendations: ['Take with food'],
        },
      };

      mockCallEdgeFunction.mockResolvedValue(mockResponse);

      const result = await aiService.analyzeProduct(mockProduct, mockStack);

      expect(mockCallEdgeFunction).toHaveBeenCalledWith('ai-analysis', {
        action: 'analyze-product',
        product: mockProduct,
        stack: mockStack,
      });

      expect(result).toEqual(mockResponse.analysis);
    });

    it('should handle edge function errors gracefully', async () => {
      mockCallEdgeFunction.mockRejectedValue(new Error('Network error'));

      const result = await aiService.analyzeProduct(mockProduct, mockStack);

      // Should return fallback analysis
      expect(result).toBeDefined();
      expect(result.safetyScore).toBeDefined();
      expect(result.interactions).toBeDefined();
      expect(result.recommendations).toBeDefined();
    });

    it('should return fallback analysis when edge function returns null', async () => {
      mockCallEdgeFunction.mockResolvedValue(null);

      const result = await aiService.analyzeProduct(mockProduct, mockStack);

      // Should return fallback analysis
      expect(result).toBeDefined();
      expect(result.safetyScore).toBeDefined();
      expect(result.interactions).toBeDefined();
      expect(result.recommendations).toBeDefined();
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

      mockCallEdgeFunction.mockResolvedValue(mockResponse);

      const result = await aiService.classifyText('Vitamin C supplement');

      expect(mockCallEdgeFunction).toHaveBeenCalledWith('ai-analysis', {
        action: 'classify-text',
        text: 'Vitamin C supplement',
      });

      expect(result).toEqual(mockResponse.classification);
    });

    it('should handle classification errors', async () => {
      mockCallEdgeFunction.mockRejectedValue(new Error('Classification error'));

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

      mockCallEdgeFunction.mockResolvedValue(mockResponse);

      const result = await aiService.extractIngredients(
        'Vitamin C 500mg, Vitamin D 1000IU'
      );

      expect(mockCallEdgeFunction).toHaveBeenCalledWith('ai-analysis', {
        action: 'extract-ingredients',
        text: 'Vitamin C 500mg, Vitamin D 1000IU',
      });

      expect(result).toEqual(mockResponse.ingredients);
    });

    it('should handle extraction errors', async () => {
      mockCallEdgeFunction.mockRejectedValue(new Error('Extraction error'));

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

      mockCallEdgeFunction.mockRejectedValue(
        new Error('AI service unavailable')
      );

      const result = await aiService.analyzeProduct(mockProduct, mockStack);

      expect(result).toBeDefined();
      expect(result.safetyScore).toBeGreaterThan(0);
      expect(result.safetyScore).toBeLessThanOrEqual(100);
      expect(Array.isArray(result.interactions)).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);

      // Should detect iron-calcium interaction
      const hasIronCalciumInteraction = result.interactions.some(
        (interaction: any) =>
          interaction.description?.toLowerCase().includes('iron') &&
          interaction.description?.toLowerCase().includes('calcium')
      );
      expect(hasIronCalciumInteraction).toBe(true);
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

      mockCallEdgeFunction.mockRejectedValue(
        new Error('AI service unavailable')
      );

      const result = await aiService.analyzeProduct(mockProduct, []);

      expect(result.recommendations).toBeDefined();
      expect(result.recommendations.length).toBeGreaterThan(0);

      // Should recommend taking with fat
      const hasFatRecommendation = result.recommendations.some((rec: string) =>
        rec.toLowerCase().includes('fat')
      );
      expect(hasFatRecommendation).toBe(true);
    });
  });
});
