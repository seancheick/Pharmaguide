// src/services/ai/aiService.ts
import { supabase } from '@/services/supabase/client';
import { Product, StackItem } from '@/types'; // Use your existing types

type AIAnalysisResult = {
  success: boolean;
  data?: {
    content?: string;  // Groq response
    labels?: {        // HuggingFace response
      label: string;
      score: number;
    }[];
  };
  error?: string;
};

export class AIService {
  async analyzeProduct(
    product: Product,
    stack: StackItem[],
    analysisType: 'groq' | 'huggingface' = 'groq'
  ): Promise<AIAnalysisResult> {
    try {
      const { data, error } = await supabase.functions.invoke('ai-analysis', {
        body: {
          product: this.sanitizeProduct(product),
          stack: stack.map(this.sanitizeStackItem),
          analysisType
        },
        headers: { 'Cache-Control': 'no-cache' }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  private sanitizeProduct(product: Product) {
    return {
      id: product.id,
      name: product.name,
      ingredients: product.ingredients.map(i => ({
        name: i.name,
        amount: i.amount,
        unit: i.unit,
        category: i.category
      }))
    };
  }

  private sanitizeStackItem(item: StackItem) {
    return {
      id: item.id,
      name: item.name,
      type: item.type,
      ingredients: item.ingredients?.map(i => ({
        name: i.name,
        amount: i.amount,
        unit: i.unit
      })) || []
    };
  }

  private handleError(error: unknown): AIAnalysisResult {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('AI Service Error:', message);
    return {
      success: false,
      error: message,
      data: {
        content: "Fallback analysis: Consult a healthcare professional",
        labels: []
      }
    };
  }
}

export const aiService = new AIService();