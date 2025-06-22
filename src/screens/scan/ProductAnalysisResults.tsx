// src/screens/scan/ProductAnalysisResults.tsx
import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { AnimatedTouchable } from '../../components/common';
import { ProductInfoCard } from '../../components/scan/ProductInfoCard';
import { ScoreDisplay } from '../../components/scan/ScoreDisplay';
import { InteractionAlert } from '../../components/scan/InteractionAlert';
import { AnalysisSections } from '../../components/scan/AnalysisSections';
import { ActionButtons } from '../../components/scan/ActionButtons';
import { useProductAnalysis } from '../../hooks/useProductAnalysis';
import type { Product, ProductAnalysis } from '../../types';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';

interface ProductAnalysisResultsProps {
  product?: Product;
  analysis?: ProductAnalysis;
  onClose?: () => void;
  onScanAnother?: () => void;
}

export const ProductAnalysisResults: React.FC<ProductAnalysisResultsProps> = ({
  product: propProduct,
  analysis: propAnalysis,
  onClose: propOnClose,
  onScanAnother: propOnScanAnother,
}) => {
  const navigation = useNavigation();
  const route = useRoute();

  // Get data from props (ScanScreen) or route params (Navigation)
  const routeParams = route.params as any;
  const product = propProduct || routeParams?.product;
  const analysis = propAnalysis || routeParams?.analysis;
  const onClose =
    propOnClose || routeParams?.onClose || (() => navigation.goBack());
  const onScanAnother =
    propOnScanAnother ||
    routeParams?.onScanAnother ||
    (() => navigation.goBack());
  // Use our custom hook for business logic (only if we have product and analysis)
  const { savedToStack, loading, handleAddToStack, handleTalkToAI } =
    useProductAnalysis({
      product: product!,
      analysis: analysis!,
    });

  // Show loading if no product/analysis data
  if (!product || !analysis) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading product analysis...</Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>
            Analyzing product interactions...
          </Text>
        </View>
      ) : (
        <>
          {/* Header */}
          <View style={styles.header}>
            <AnimatedTouchable onPress={onClose} style={styles.headerButton}>
              <Ionicons name="close" size={24} color={COLORS.textPrimary} />
            </AnimatedTouchable>

            <AnimatedTouchable
              onPress={handleAddToStack}
              style={styles.headerButton}
            >
              <Ionicons
                name={savedToStack ? 'bookmark' : 'bookmark-outline'}
                size={24}
                color={savedToStack ? COLORS.primary : COLORS.textPrimary}
              />
            </AnimatedTouchable>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <ProductInfoCard product={product} />
            <ScoreDisplay analysis={analysis} />
            {analysis.stackInteraction && (
              <InteractionAlert stackInteraction={analysis.stackInteraction} />
            )}
            <AnalysisSections analysis={analysis} />
            <ActionButtons
              savedToStack={savedToStack}
              onScanAnother={onScanAnother}
              onAddToStack={handleAddToStack}
              onTalkToAI={handleTalkToAI}
            />
          </View>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  headerButton: {
    padding: SPACING.sm,
    borderRadius: SPACING.xs,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl * 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    minHeight: 300,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
  },
});
