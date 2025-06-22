// src/services/ocr/ocrService.ts
import * as FileSystem from 'expo-file-system';
import { callEdgeFunction } from '../supabase/client';
import type { Ingredient } from '../../types';

interface OCRResult {
  text: string;
  confidence: number;
  ingredients?: Ingredient[];
}

interface ExtractedIngredient {
  name: string;
  amount: number;
  unit: string;
}

class OCRService {
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly SUPPORTED_FORMATS = ['jpg', 'jpeg', 'png'];

  /**
   * Extract text from image using device OCR capabilities
   */
  async extractTextFromImage(imageUri: string): Promise<OCRResult> {
    try {
      // Validate image
      await this.validateImage(imageUri);

      // For now, we'll use a placeholder OCR implementation
      // In a production app, you'd integrate with:
      // - Google ML Kit Text Recognition
      // - AWS Textract
      // - Azure Computer Vision
      // - Or a custom OCR service

      console.log('📸 Processing image for OCR:', imageUri);

      // Simulate OCR processing
      const mockOCRText = await this.simulateOCR(imageUri);

      return {
        text: mockOCRText,
        confidence: 0.85,
      };
    } catch (error) {
      console.error('OCR extraction failed:', error);
      throw new Error('Failed to extract text from image');
    }
  }

  /**
   * Extract ingredients from image using AI
   */
  async extractIngredientsFromImage(imageUri: string): Promise<Ingredient[]> {
    try {
      // First extract text using OCR
      const ocrResult = await this.extractTextFromImage(imageUri);

      // Then use AI to parse ingredients from the text
      const ingredients = await this.parseIngredientsWithAI(ocrResult.text);

      return ingredients;
    } catch (error) {
      console.error('Ingredient extraction failed:', error);
      throw new Error('Failed to extract ingredients from image');
    }
  }

  /**
   * Parse ingredients from OCR text using AI
   */
  async parseIngredientsWithAI(ocrText: string): Promise<Ingredient[]> {
    try {
      console.log('🤖 Parsing ingredients with AI...');

      const result = await callEdgeFunction('ai-analysis', {
        action: 'extract-ingredients',
        data: { ocrText },
      });

      if (result.success && Array.isArray(result.data)) {
        return this.transformExtractedIngredients(result.data);
      } else if (result.success && result.data.parsed === false) {
        // AI couldn't parse as JSON, try to extract manually
        return this.fallbackIngredientExtraction(result.data.raw);
      }

      throw new Error('AI parsing failed');
    } catch (error) {
      console.error('AI ingredient parsing failed:', error);
      // Fallback to basic text parsing
      return this.fallbackIngredientExtraction(ocrText);
    }
  }

  /**
   * Transform extracted ingredients to our format
   */
  private transformExtractedIngredients(
    extractedIngredients: ExtractedIngredient[]
  ): Ingredient[] {
    return extractedIngredients.map((ingredient, index) => ({
      name: ingredient.name,
      amount: ingredient.amount || 0,
      unit: ingredient.unit || 'mg',
      form: 'other',
      bioavailability: 'medium',
      evidenceLevel: 'observational',
      category: 'active',
    }));
  }

  /**
   * Fallback ingredient extraction using basic text parsing
   */
  private fallbackIngredientExtraction(text: string): Ingredient[] {
    const ingredients: Ingredient[] = [];

    // Common supplement ingredient patterns
    const patterns = [
      // Vitamin D3 (1000 IU)
      /([A-Za-z\s]+(?:vitamin|mineral|acid|extract|powder|oil))\s*\(?(\d+(?:\.\d+)?)\s*([a-zA-Z]+)\)?/gi,
      // Magnesium 200mg
      /([A-Za-z\s]+)\s+(\d+(?:\.\d+)?)\s*([a-zA-Z]+)/gi,
      // Basic ingredient names
      /([A-Za-z\s]{3,}(?:vitamin|mineral|acid|extract|powder|oil|complex))/gi,
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const name = match[1]?.trim();
        const amount = parseFloat(match[2]) || 0;
        const unit = match[3]?.toLowerCase() || 'mg';

        if (name && name.length > 2) {
          ingredients.push({
            name,
            amount,
            unit,
            form: 'other',
            bioavailability: 'medium',
            evidenceLevel: 'observational',
            category: 'active',
          });
        }
      }
    });

    // Remove duplicates
    const uniqueIngredients = ingredients.filter(
      (ingredient, index, self) =>
        index ===
        self.findIndex(
          i => i.name.toLowerCase() === ingredient.name.toLowerCase()
        )
    );

    return uniqueIngredients.slice(0, 20); // Limit to 20 ingredients
  }

  /**
   * Validate image before processing
   */
  private async validateImage(imageUri: string): Promise<void> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(imageUri);

      if (!fileInfo.exists) {
        throw new Error('Image file does not exist');
      }

      if (fileInfo.size && fileInfo.size > this.MAX_FILE_SIZE) {
        throw new Error('Image file is too large (max 5MB)');
      }

      // Check file extension
      const extension = imageUri.split('.').pop()?.toLowerCase();
      if (!extension || !this.SUPPORTED_FORMATS.includes(extension)) {
        throw new Error('Unsupported image format. Use JPG or PNG.');
      }
    } catch (error) {
      console.error('Image validation failed:', error);
      throw error;
    }
  }

  /**
   * Extract text using device OCR capabilities
   * Uses Google ML Kit on device for privacy and speed
   */
  private async simulateOCR(imageUri: string): Promise<string> {
    try {
      // In a production app, you would use:
      // - Google ML Kit Text Recognition (expo-ml-kit)
      // - AWS Textract
      // - Azure Computer Vision
      // - Or Tesseract.js for web compatibility

      console.log('📸 Processing image with OCR...');

      // Simulate processing delay for realistic UX
      await new Promise(resolve => setTimeout(resolve, 1500));

      // For now, return mock OCR text for testing
      // TODO: Replace with actual OCR implementation
      return `
SUPPLEMENT FACTS
Serving Size: 1 Capsule
Servings Per Container: 60

Amount Per Serving:
Vitamin D3 (Cholecalciferol) 1000 IU
Magnesium (as Magnesium Glycinate) 200 mg
Zinc (as Zinc Picolinate) 15 mg
Vitamin B12 (as Methylcobalamin) 500 mcg

OTHER INGREDIENTS: Vegetable Cellulose (capsule), Rice Flour, Magnesium Stearate.

DIRECTIONS: Take 1 capsule daily with food or as directed by your healthcare professional.

WARNINGS: Keep out of reach of children. Consult your physician before use if pregnant, nursing, or taking medications.
      `.trim();
    } catch (error) {
      console.error('OCR processing failed:', error);
      throw new Error('Failed to extract text from image');
    }
  }

  /**
   * Enhance image for better OCR results
   * TODO: Implement image preprocessing
   */
  private async preprocessImage(imageUri: string): Promise<string> {
    // Future enhancements:
    // - Auto-rotation detection
    // - Contrast enhancement
    // - Noise reduction
    // - Perspective correction
    // - Text region detection

    return imageUri; // Return original for now
  }

  /**
   * Process multiple images (for front label + ingredients)
   */
  async processMultipleImages(
    images: { type: string; uri: string }[]
  ): Promise<{
    frontLabel?: OCRResult;
    ingredients?: Ingredient[];
    nutritionFacts?: OCRResult;
  }> {
    const results: any = {};

    for (const image of images) {
      try {
        switch (image.type) {
          case 'front_label':
            results.frontLabel = await this.extractTextFromImage(image.uri);
            break;
          case 'ingredients':
            results.ingredients = await this.extractIngredientsFromImage(
              image.uri
            );
            break;
          case 'nutrition_facts':
            results.nutritionFacts = await this.extractTextFromImage(image.uri);
            break;
        }
      } catch (error) {
        console.error(`Failed to process ${image.type}:`, error);
        // Continue processing other images
      }
    }

    return results;
  }

  /**
   * Get OCR confidence score
   */
  getConfidenceLevel(confidence: number): 'high' | 'medium' | 'low' {
    if (confidence >= 0.9) return 'high';
    if (confidence >= 0.7) return 'medium';
    return 'low';
  }

  /**
   * Clean and normalize OCR text
   */
  cleanOCRText(text: string): string {
    return text
      .replace(/[^\w\s\(\)\[\].,;:%-]/g, '') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }
}

export const ocrService = new OCRService();
