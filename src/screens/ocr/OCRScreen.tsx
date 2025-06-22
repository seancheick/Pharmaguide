// src/screens/ocr/OCRScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { PhotoCaptureOverlay } from '../../components/ocr/PhotoCaptureOverlay';
import { ocrService } from '../../services/ocr/ocrService';
import { convertSearchResultToProduct } from '../../services/search/productConverter';
import { productService } from '../../services/products/productService';
import { useStackStore } from '../../stores/stackStore';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';
import type { Ingredient } from '../../types';

interface CapturedImage {
  type: 'front_label' | 'ingredients' | 'nutrition_facts';
  uri: string;
  processed: boolean;
}

interface RouteParams {
  productName?: string;
  brand?: string;
}

export const OCRScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { stack } = useStackStore();
  const { productName, brand } = (route.params as RouteParams) || {};

  // State
  const [currentCapture, setCurrentCapture] = useState<'front_label' | 'ingredients' | 'nutrition_facts' | null>(null);
  const [capturedImages, setCapturedImages] = useState<CapturedImage[]>([]);
  const [extractedIngredients, setExtractedIngredients] = useState<Ingredient[]>([]);
  const [processing, setProcessing] = useState(false);
  const [ocrResults, setOcrResults] = useState<any>({});

  const handlePhotoTaken = async (uri: string) => {
    if (!currentCapture) return;

    const newImage: CapturedImage = {
      type: currentCapture,
      uri,
      processed: false,
    };

    setCapturedImages(prev => [...prev.filter(img => img.type !== currentCapture), newImage]);
    setCurrentCapture(null);

    // Process the image immediately
    await processImage(newImage);
  };

  const processImage = async (image: CapturedImage) => {
    try {
      setProcessing(true);

      if (image.type === 'ingredients') {
        // Extract ingredients using AI
        const ingredients = await ocrService.extractIngredientsFromImage(image.uri);
        setExtractedIngredients(ingredients);
        
        // Update image as processed
        setCapturedImages(prev =>
          prev.map(img =>
            img.type === image.type ? { ...img, processed: true } : img
          )
        );
      } else {
        // Extract text for other types
        const result = await ocrService.extractTextFromImage(image.uri);
        setOcrResults(prev => ({
          ...prev,
          [image.type]: result,
        }));

        // Update image as processed
        setCapturedImages(prev =>
          prev.map(img =>
            img.type === image.type ? { ...img, processed: true } : img
          )
        );
      }
    } catch (error) {
      console.error('Image processing failed:', error);
      Alert.alert('Processing Failed', 'Unable to process the image. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleAnalyzeProduct = async () => {
    if (extractedIngredients.length === 0) {
      Alert.alert('No Ingredients', 'Please capture the ingredients list first.');
      return;
    }

    try {
      setProcessing(true);

      // Create a product from OCR results
      const ocrProduct = {
        id: `ocr_${Date.now()}`,
        name: productName || ocrResults.front_label?.text?.split('\n')[0] || 'OCR Product',
        brand: brand || 'Unknown Brand',
        category: 'supplement',
        source: 'ocr' as const,
      };

      // Convert to full product format
      const product = convertSearchResultToProduct(ocrProduct);
      
      // Replace ingredients with OCR extracted ones
      product.ingredients = extractedIngredients;

      // Analyze with user's stack
      const analysisResult = await productService.analyzeSearchResult(ocrProduct, stack);

      // Navigate to analysis results
      navigation.navigate('ProductAnalysisResults' as never, {
        product: analysisResult.product,
        analysis: analysisResult.analysis,
        onClose: () => navigation.goBack(),
        onScanAnother: () => navigation.goBack(),
      } as never);

    } catch (error) {
      console.error('Product analysis failed:', error);
      Alert.alert('Analysis Failed', 'Unable to analyze the product. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const getCaptureSteps = () => [
    {
      type: 'front_label' as const,
      title: 'Front Label',
      description: 'Capture the product name and brand',
      icon: 'document-text-outline',
      required: false,
    },
    {
      type: 'ingredients' as const,
      title: 'Ingredients List',
      description: 'Capture the supplement facts or ingredients',
      icon: 'list-outline',
      required: true,
    },
    {
      type: 'nutrition_facts' as const,
      title: 'Nutrition Facts',
      description: 'Capture additional nutrition information',
      icon: 'nutrition-outline',
      required: false,
    },
  ];

  const renderCaptureStep = (step: any) => {
    const captured = capturedImages.find(img => img.type === step.type);
    const isProcessed = captured?.processed || false;

    return (
      <TouchableOpacity
        key={step.type}
        style={[
          styles.captureStep,
          captured && styles.captureStepCompleted,
        ]}
        onPress={() => setCurrentCapture(step.type)}
        disabled={processing}
      >
        <View style={styles.stepIcon}>
          {captured ? (
            isProcessed ? (
              <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
            ) : (
              <ActivityIndicator size="small" color={COLORS.primary} />
            )
          ) : (
            <Ionicons name={step.icon as any} size={24} color={COLORS.textSecondary} />
          )}
        </View>
        
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>{step.title}</Text>
          <Text style={styles.stepDescription}>{step.description}</Text>
          {step.required && (
            <Text style={styles.requiredLabel}>Required</Text>
          )}
        </View>

        {captured && (
          <Image source={{ uri: captured.uri }} style={styles.stepPreview} />
        )}

        <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
      </TouchableOpacity>
    );
  };

  if (currentCapture) {
    return (
      <PhotoCaptureOverlay
        captureType={currentCapture}
        onPhotoTaken={handlePhotoTaken}
        onClose={() => setCurrentCapture(null)}
        title={getCaptureSteps().find(s => s.type === currentCapture)?.title}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Scan Supplement Label</Text>
          <Text style={styles.subtitle}>
            Capture photos to extract ingredient information
          </Text>
        </View>

        {/* Capture Steps */}
        <View style={styles.stepsContainer}>
          <Text style={styles.sectionTitle}>Capture Steps</Text>
          {getCaptureSteps().map(renderCaptureStep)}
        </View>

        {/* Extracted Ingredients */}
        {extractedIngredients.length > 0 && (
          <View style={styles.ingredientsContainer}>
            <Text style={styles.sectionTitle}>
              Extracted Ingredients ({extractedIngredients.length})
            </Text>
            {extractedIngredients.slice(0, 5).map((ingredient, index) => (
              <View key={index} style={styles.ingredientItem}>
                <Text style={styles.ingredientName}>{ingredient.name}</Text>
                <Text style={styles.ingredientAmount}>
                  {ingredient.amount} {ingredient.unit}
                </Text>
              </View>
            ))}
            {extractedIngredients.length > 5 && (
              <Text style={styles.moreIngredients}>
                +{extractedIngredients.length - 5} more ingredients
              </Text>
            )}
          </View>
        )}

        {/* Processing Status */}
        {processing && (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.processingText}>Processing images...</Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.analyzeButton,
            (extractedIngredients.length === 0 || processing) && styles.analyzeButtonDisabled,
          ]}
          onPress={handleAnalyzeProduct}
          disabled={extractedIngredients.length === 0 || processing}
        >
          <Text style={styles.analyzeButtonText}>
            {processing ? 'Processing...' : 'Analyze Product'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  stepsContainer: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  captureStep: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  captureStepCompleted: {
    borderColor: COLORS.success,
    backgroundColor: COLORS.successLight,
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  stepDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
  },
  requiredLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.error,
    fontWeight: TYPOGRAPHY.weights.medium,
    marginTop: SPACING.xs,
  },
  stepPreview: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: SPACING.sm,
  },
  ingredientsContainer: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  ingredientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  ingredientName: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textPrimary,
    flex: 1,
  },
  ingredientAmount: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  moreIngredients: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
    fontStyle: 'italic',
  },
  processingContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  processingText: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  bottomActions: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
    backgroundColor: COLORS.backgroundSecondary,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    marginRight: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gray300,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  analyzeButton: {
    flex: 2,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  analyzeButtonDisabled: {
    backgroundColor: COLORS.gray400,
  },
  analyzeButtonText: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
});
