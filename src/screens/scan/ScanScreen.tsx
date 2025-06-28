// src/screens/scan/ScanScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { ScanScreenProps } from '../../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import { Button, AnimatedTouchable } from '../../components/common';
import { useToast } from '../../hooks/useToast';
import { EmptyState } from '../../components/common/EmptyState';
import { BarcodeScanner } from './BarcodeScanner';
import { ProductAnalysisResults } from './ProductAnalysisResults';
import { productService } from '../../services/products';
import { useStackStore } from '../../stores/stackStore';
import type { Product, ProductAnalysis } from '../../types';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';

type ScanScreenState = 'idle' | 'scanning' | 'processing' | 'results';

export const ScanScreen = () => {
  const navigation = useNavigation<ScanScreenProps['navigation']>();
  const { showError, showInfo } = useToast();
  const [screenState, setScreenState] = useState<ScanScreenState>('idle');
  const [product, setProduct] = useState<Product | null>(null);
  const [analysis, setAnalysis] = useState<ProductAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { stack } = useStackStore();

  const startScanning = () => {
    console.log('📱 Starting scanner...');
    setScreenState('scanning');
  };

  const handleBarcodeScanned = async (barcode: string) => {
    console.log('🔍 Processing barcode:', barcode);
    setScreenState('processing');
    setIsLoading(true);

    try {
      const result = await productService.analyzeScannedProduct(barcode, stack);
      setProduct(result.product);
      setAnalysis(result.analysis);
      setScreenState('results');
      console.log(
        '✅ Analysis complete - Score:',
        result.analysis.overallScore
      );
    } catch (error) {
      console.error('Product analysis failed:', error);

      // Check if it's a "product not found" error
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const isProductNotFound =
        errorMessage.toLowerCase().includes('not found') ||
        errorMessage.toLowerCase().includes('no product');

      if (isProductNotFound) {
        showError('Product not found in our database');
        setScreenState('idle');
        // Show options for product not found
        Alert.alert(
          'Product Not Found',
          "This product isn't in our database yet. What would you like to do?",
          [
            {
              text: 'Cancel',
              onPress: () => setScreenState('idle'),
              style: 'cancel',
            },
            {
              text: 'Search Manually',
              onPress: () => navigation.navigate('Search'),
            },
            {
              text: 'Scan Label',
              onPress: () => navigation.navigate('OCR'),
            },
            {
              text: 'Submit Product',
              onPress: () => navigation.navigate('ProductSubmission'),
            },
          ]
        );
      } else {
        showError('Unable to analyze this product. Please try again.');
        setScreenState('idle');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanAnother = () => {
    console.log('🔄 Resetting for new scan');
    setProduct(null);
    setAnalysis(null);
    setScreenState('scanning');
  };

  const handleClose = () => {
    console.log('❌ Closing scanner');
    setProduct(null);
    setAnalysis(null);
    setScreenState('idle');
  };

  const renderIdleState = () => (
    <View style={styles.startScanContainer}>
      <AnimatedTouchable onPress={startScanning} style={styles.startScanButton}>
        <Ionicons name="scan" size={48} color={COLORS.background} />
        {/* Ensures Text is inside <Text> component */}
        <Text style={styles.startScanText}>Tap to Scan</Text>
      </AnimatedTouchable>
      <Text style={styles.instructionText}>
        Scan a medication barcode to check for interactions
      </Text>
    </View>
  );

  // --- START: Conditional Rendering Logic ---
  // This is the crucial part that was likely missing or incorrectly structured.
  // We return a component based on the current screenState.
  if (screenState === 'scanning') {
    return (
      <BarcodeScanner
        onBarcodeScanned={handleBarcodeScanned}
        onClose={handleClose}
      />
    );
  }

  if (screenState === 'processing') {
    // The headerBar is integrated directly into this full-screen view
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerBar}>
          <AnimatedTouchable onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={COLORS.textPrimary} />
          </AnimatedTouchable>
          <AnimatedTouchable style={styles.helpIconButton}>
            <Ionicons
              name="help-circle-outline"
              size={24}
              color={COLORS.textPrimary}
            />
          </AnimatedTouchable>
        </View>
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Analyzing product...</Text>
            <Text style={styles.loadingSubtext}>This may take a moment</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (screenState === 'results' && product && analysis) {
    // The headerBar is part of ProductAnalysisResults component's internal rendering
    return (
      <ProductAnalysisResults
        product={product}
        analysis={analysis}
        onClose={handleClose}
        onScanAnother={handleScanAnother}
      />
    );
  }
  // --- END: Conditional Rendering Logic ---

  // If none of the above states are met, it defaults to the idle state.
  return (
    <SafeAreaView style={styles.container}>
      {screenState !== 'idle' && (
        <View style={styles.header}>
          <AnimatedTouchable onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={COLORS.textPrimary} />
          </AnimatedTouchable>
        </View>
      )}

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Analyzing product...</Text>
            <Text style={styles.loadingSubtext}>This may take a moment</Text>
          </View>
        </View>
      )}

      {/* This is the main UI for the idle state */}
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="scan-outline" size={64} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>AI Product Scanner</Text>
          <Text style={styles.subtitle}>
            Scan any supplement barcode to get instant quality analysis with
            dynamic scoring
          </Text>
        </View>

        <View style={styles.features}>
          <View style={styles.feature}>
            <View style={styles.featureIcon}>
              <Ionicons
                name="analytics-outline"
                size={24}
                color={COLORS.secondary}
              />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Smart Scoring</Text>
              <Text style={styles.featureDescription}>
                Scores vary based on brand, form, and product characteristics
              </Text>
            </View>
          </View>

          <View style={styles.feature}>
            <View style={styles.featureIcon}>
              <Ionicons
                name="shield-checkmark-outline"
                size={24}
                color={COLORS.success}
              />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Quality Analysis</Text>
              <Text style={styles.featureDescription}>
                Identifies premium vs budget brands and ingredient forms
              </Text>
            </View>
          </View>

          <View style={styles.feature}>
            <View style={styles.featureIcon}>
              <Ionicons name="flash-outline" size={24} color={COLORS.warning} />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Instant Results</Text>
              <Text style={styles.featureDescription}>
                Get detailed analysis in seconds with caching for speed
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <AnimatedTouchable onPress={startScanning} style={styles.scanButton}>
            <Button
              title="Start Scanning"
              onPress={startScanning}
              variant="primary"
              size="large"
              icon={
                <Ionicons name="scan" size={20} color={COLORS.background} />
              }
            />
          </AnimatedTouchable>

          <AnimatedTouchable style={styles.helpButton}>
            {/* Ensures Text is inside <Text> component */}
            <Text style={styles.helpText}>
              ✨ Scores now vary by product quality!
            </Text>
          </AnimatedTouchable>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: SPACING.xxl,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xxxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: SPACING.md,
  },
  features: {
    marginVertical: SPACING.xl,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  featureDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  actions: {
    alignItems: 'center',
  },
  scanButton: {
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.xl,
  },
  helpButton: {
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.success + '20',
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
  },
  helpText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.success,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    backgroundColor: COLORS.background,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    minWidth: 250,
  },
  loadingText: {
    marginTop: 16,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
  },
  startScanContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  startScanButton: {
    backgroundColor: COLORS.primary,
    padding: SPACING.xl,
    borderRadius: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    shadowColor: COLORS.gray900,
  },
  startScanText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '600',
    color: COLORS.background,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  closeButton: {
    padding: SPACING.sm,
  },
  helpIconButton: {
    padding: SPACING.sm,
  },
  instructionText: {
    marginTop: SPACING.xl,
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
  },
});
