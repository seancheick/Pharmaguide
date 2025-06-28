// src/hooks/useProductAnalysis.ts
import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useStackStore } from '../stores/stackStore';
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

  // Save to recent scans on mount
  useEffect(() => {
    if (product && analysis) {
      saveToRecentScans(product, analysis);
      updateGamification();
    }
  }, [product, analysis]);

  // Set loading state based on analysis
  useEffect(() => {
    setLoading(!analysis);
  }, [analysis]);

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

  const saveToRecentScans = useCallback(
    async (prod: Product, anal: ProductAnalysis) => {
      try {
        // Use the shared storage key for recent scans
        const { STORAGE_KEYS } = await import('../constants/storage');
        const existingScans = await AsyncStorage.getItem(
          STORAGE_KEYS.RECENT_SCANS
        );
        const scans = existingScans ? JSON.parse(existingScans) : [];

        const evidenceLevel = determineEvidenceLevel(anal);

        const newScan = {
          id: Date.now().toString(),
          name: prod.name,
          brand: prod.brand,
          imageUrl: prod.imageUrl,
          score: anal.overallScore,
          hasInteraction: anal.stackInteraction
            ? anal.stackInteraction.overallRiskLevel !== 'NONE'
            : false,
          evidence: evidenceLevel,
          scannedAt: new Date().toISOString(),
        };

        const updatedScans = [newScan, ...scans].slice(0, 50);
        await AsyncStorage.setItem(
          STORAGE_KEYS.RECENT_SCANS,
          JSON.stringify(updatedScans)
        );
        console.log('Scan saved to recent scans:', prod.name);
      } catch (error) {
        console.error('Error saving recent scan:', error);
      }
    },
    [determineEvidenceLevel]
  );

  const updateGamification = useCallback(async () => {
    try {
      await gamificationService.awardPoints('DAILY_SCAN');
      await gamificationService.updateStreak();

      if (analysis.overallScore >= 70) {
        await gamificationService.awardPoints('SAFE_PRODUCT');
      }

      if (
        analysis.stackInteraction &&
        analysis.stackInteraction.overallRiskLevel !== 'NONE'
      ) {
        await gamificationService.awardPoints('INTERACTION_FOUND');
      }
    } catch (error) {
      console.error('Error updating gamification:', error);
    }
  }, [analysis]);

  const handleAddToStack = useCallback(async () => {
    if (analysis.stackInteraction?.overallRiskLevel === 'CRITICAL') {
      Alert.alert(
        'Critical Interaction Detected',
        'This product has CRITICAL interactions with your current stack. Adding it may pose a severe risk. Please consult your healthcare provider before proceeding.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Generate a proper UUID for the item_id instead of using barcode
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
      item_id: generateUUID(), // Use proper UUID instead of product.id (which might be a barcode)
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

  const handleTalkToAI = useCallback(() => {
    Alert.alert(
      'AI Pharmacist Ready! 🧠',
      `I'm ready to discuss ${product.name} in detail. Ask me about interactions, dosing, timing, alternatives, or any specific health goals!`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Chat',
          onPress: () => {
            console.log('Navigate to AI chat with product context');
            // Navigate to AI tab with product context
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
