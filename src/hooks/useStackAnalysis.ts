// src/hooks/useStackAnalysis.ts
import { useState, useEffect, useCallback } from 'react';
import { interactionService } from '../services/interactions';
import { useAuth } from './useAuth';
import type {
  UserStack,
  StackInteractionResult,
  RiskLevel,
  Product,
} from '../types';

interface UseStackAnalysisProps {
  stack: UserStack[];
  initialized: boolean;
  storeLoading: boolean;
}

interface UseStackAnalysisReturn {
  analysis: StackInteractionResult | null;
  analyzing: boolean;
  analyzeStack: () => Promise<void>;
  getRiskColor: (level: RiskLevel) => string;
}

export const useStackAnalysis = ({
  stack,
  initialized,
  storeLoading,
}: UseStackAnalysisProps): UseStackAnalysisReturn => {
  const [analysis, setAnalysis] = useState<StackInteractionResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const { user } = useAuth();

  // Risk level color mapping
  const getRiskColor = useCallback((level: RiskLevel): string => {
    switch (level) {
      case 'CRITICAL':
        return '#DC2626'; // Red-700
      case 'HIGH':
        return '#EA580C'; // Orange-700
      case 'MODERATE':
        return '#F59E0B'; // Amber-500
      case 'LOW':
        return '#10B981'; // Emerald-500
      case 'NONE':
      default:
        return '#10B981'; // Green for safe
    }
  }, []);

  // Map UserStack to Product for analysis
  const mapUserStackToProduct = useCallback((item: UserStack): Product => {
    return {
      id: item.id,
      name: item.name,
      brand: item.brand || '',
      category: item.type === 'supplement' ? 'Supplements' : 'Medications',
      barcode: item.barcode || '',
      imageUrl: item.imageUrl || '',
      ingredients: item.ingredients || [],
      servingSize: item.dosage || '',
      servingsPerContainer: 1,
      description: `${item.frequency || 'As needed'} - ${item.dosage || 'See label'}`,
      manufacturer: item.brand || 'Unknown',
      created_at: item.created_at,
      updated_at: item.updated_at,
    };
  }, []);

  // Risk escalation logic
  const escalateRisk = useCallback(
    (current: RiskLevel, newRisk: RiskLevel): RiskLevel => {
      const riskOrder = ['NONE', 'LOW', 'MODERATE', 'HIGH', 'CRITICAL'];
      const currentIndex = riskOrder.indexOf(current);
      const newIndex = riskOrder.indexOf(newRisk);
      return newIndex > currentIndex ? newRisk : current;
    },
    []
  );

  // Main analysis function
  const analyzeStack = useCallback(async () => {
    setAnalyzing(true);
    setAnalysis(null);

    try {
      if (stack.length === 0) {
        setAnalysis({
          overallRiskLevel: 'NONE',
          interactions: [],
          nutrientWarnings: [],
          overallSafe: true,
        });
        return;
      }

      const productsForAnalysis: Product[] = stack.map(mapUserStackToProduct);

      // Remove duplicates based on name to prevent self-interaction analysis
      const uniqueProducts = productsForAnalysis.filter(
        (product, index, array) =>
          array.findIndex(
            p => p.name.toLowerCase() === product.name.toLowerCase()
          ) === index
      );

      const allInteractions: StackInteractionResult['interactions'] = [];
      const allNutrientWarnings: StackInteractionResult['nutrientWarnings'] =
        [];
      let overallHighestRisk: RiskLevel = 'NONE';
      let overallSafe = true;

      // Analyze pairwise interactions using unique products only
      for (let i = 0; i < uniqueProducts.length; i++) {
        for (let j = i + 1; j < uniqueProducts.length; j++) {
          // Additional safety check - skip if it's the same product
          if (
            uniqueProducts[i].id === uniqueProducts[j].id ||
            uniqueProducts[i].name.toLowerCase() ===
              uniqueProducts[j].name.toLowerCase()
          ) {
            continue;
          }

          try {
            const result = await interactionService.checkInteraction(
              uniqueProducts[i],
              uniqueProducts[j],
              user?.id
            );

            if (result.interactions) {
              allInteractions.push(...result.interactions);
            }
            if (result.nutrientWarnings) {
              allNutrientWarnings.push(...result.nutrientWarnings);
            }

            overallHighestRisk = escalateRisk(
              overallHighestRisk,
              result.overallRiskLevel
            );
            if (!result.overallSafe) overallSafe = false;
          } catch (error) {
            // Handle rate limit errors gracefully - don't spam the console
            if (
              error instanceof Error &&
              error.message.includes('Rate limit exceeded')
            ) {
              console.warn(
                'Rate limit exceeded for interaction analysis - skipping remaining checks'
              );
              // Break out of both loops to prevent further rate limit hits
              i = uniqueProducts.length;
              break;
            } else {
              console.warn(
                `Failed to analyze interaction between ${uniqueProducts[i].name} and ${uniqueProducts[j].name}:`,
                error
              );
            }
          }
        }
      }

      setAnalysis({
        overallRiskLevel: overallHighestRisk,
        interactions: allInteractions,
        nutrientWarnings: allNutrientWarnings,
        overallSafe: overallSafe,
      });
    } catch (error) {
      console.error('Stack analysis failed:', error);
      setAnalysis({
        overallRiskLevel: 'NONE',
        interactions: [],
        nutrientWarnings: [],
        overallSafe: true,
      });
    } finally {
      setAnalyzing(false);
    }
  }, [stack, mapUserStackToProduct, escalateRisk]);

  // Auto-analyze when stack changes
  useEffect(() => {
    if (initialized && !storeLoading) {
      if (stack.length > 0) {
        analyzeStack();
      } else {
        setAnalysis({
          overallRiskLevel: 'NONE',
          interactions: [],
          nutrientWarnings: [],
          overallSafe: true,
        });
      }
    }
  }, [stack, initialized, storeLoading, analyzeStack]);

  return {
    analysis,
    analyzing,
    analyzeStack,
    getRiskColor,
  };
};
