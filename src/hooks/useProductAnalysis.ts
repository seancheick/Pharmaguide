// src/hooks/useProductAnalysis.ts
// 🚀 ENHANCED: Unified product analysis with improved scan handling

import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useStackStore } from '../stores/stackStore';
import { unifiedScanService } from '../services/scanService';
import { gamificationService } from '../services/gamification/gamificationService';
import type { Product, ProductAnalysis } from '../types';

interface UseProductAnalysisProps {
  product: Product;
  analysis: ProductAnalysis;
}

interface UseProductAnalysisReturn {
  savedToStack: boolean;
  loading: boolean;
  handleAddToStack: () => Promise<void>;
  handleTalkToAI: () => void;
  determineEvidenceLevel: (analysis: ProductAnalysis) => 'A' | 'B' | 'C' | 'D';
}

export const useProductAnalysis = ({
  product,
  analysis,
}: UseProductAnalysisProps): UseProductAnalysisReturn => {
  const [savedToStack, setSavedToStack] = useState(false);
  const [loading, setLoading] = useState(false);
  const { addToStack } = useStackStore();
  const navigation = useNavigation();

  // 🎯 Save to unified scan service on mount (only for valid products)
  useEffect(() => {
    if (product && analysis && product.name !== 'Product Not Found') {
      saveToUnifiedService(product, analysis);
    }
  }, [product, analysis]);

  // 🎯 Set loading state based on analysis
  useEffect(() => {
    setLoading(!analysis);
  }, [analysis]);

  //  Determine evidence level
  const determineEvidenceLevel = useCallback(
    (anal: ProductAnalysis): 'A' | 'B' | 'C' | 'D' => {
      if (!anal.stackInteraction || !anal.stackInteraction.interactions) {
        return 'D';
      }

      if (
        anal.stackInteraction.interactions.some(i =>
          i.evidenceSources?.some(s => s.text.includes('Clinical'))
        )
      ) {
        return 'A';
      }
      if (
        anal.stackInteraction.interactions.some(i =>
          i.evidenceSources?.some(s => s.text.includes('Case'))
        )
      ) {
        return 'B';
      }
      if (anal.stackInteraction.interactions.length > 0) {
        return 'C';
      }
      return 'D';
    },
    []
  );

  // 🎯 Save to unified scan service
  const saveToUnifiedService = useCallback(
    async (prod: Product, anal: ProductAnalysis) => {
      try {
        await unifiedScanService.saveScan(
          prod,
          anal,
          'barcode' // Default scan type, could be made configurable
        );
        // Scan saved successfully - logging removed for production
      } catch (error) {
        console.error('❌ Error saving to unified service:', error);
      }
    },
    []
  );

  // 🎯 Add to stack handler
  const handleAddToStack = useCallback(async () => {
    if (analysis.stackInteraction?.overallRiskLevel === 'CRITICAL') {
      Alert.alert(
        'Critical Interaction Detected',
        'This product has CRITICAL interactions with your current stack. Adding it may pose a severe risk. Please consult your healthcare provider before proceeding.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Generate a proper UUID for the item_id
    const generateUUID = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
        /[xy]/g,
        function (c) {
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        }
      );
    };

    const itemToAdd = {
      item_id: generateUUID(),
      name: product.name,
      type: 'supplement' as 'medication' | 'supplement',
      dosage: product.dosage || 'As directed',
      frequency: 'Daily',
      ingredients:
        product.ingredients?.map(ing => ({
          name: ing.name,
          amount: ing.amount,
          unit: ing.unit,
        })) || [],
      brand: product.brand,
      imageUrl: product.imageUrl,
    };

    try {
      await addToStack(itemToAdd);
      setSavedToStack(true);
      Alert.alert(
        'Added to Stack! 📚',
        `${product.name} has been saved to your supplement stack for tracking and analysis.`,
        [{ text: 'Great!', style: 'default' }]
      );
    } catch (error) {
      console.error('Failed to add to stack:', error);
      Alert.alert('Error', 'Could not add product to stack. Please try again.');
    }
  }, [product, analysis, addToStack]);

  //  Talk to AI handler
  const handleTalkToAI = useCallback(() => {
    Alert.alert(
      'AI Pharmacist Ready! 🧠',
      `I'm ready to discuss ${product.name} in detail. Ask me about interactions, dosing, timing, alternatives, or any specific health goals!`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Chat',
          onPress: () => {
            // Navigate to AI chat with product context
            (navigation as any).navigate('MainTabs', {
              screen: 'AI',
              params: {
                productContext: {
                  name: product.name,
                  brand: product.brand,
                  analysis: analysis,
                  initialMessage: `I'd like to discuss ${product.name}${product.brand ? ` by ${product.brand}` : ''}. Can you help me understand more about this supplement?`,
                },
              },
            });
          },
        },
      ]
    );
  }, [product, analysis, navigation]);

  return {
    savedToStack,
    loading,
    handleAddToStack,
    handleTalkToAI,
    determineEvidenceLevel,
  };
};
