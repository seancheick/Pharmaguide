import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "../../components/common";
import { BarcodeScanner } from "./BarcodeScanner";
import { ProductAnalysisResults } from "./ProductAnalysisResults";
import { productService } from "../../services/products"; // Correct import for productService instance
import { useStackStore } from "../../stores/stackStore"; // NEW: Import useStackStore
import type { Product, ProductAnalysis } from "../../types";
import { COLORS, SPACING, TYPOGRAPHY } from "../../constants";

type ScanScreenState = "idle" | "scanning" | "processing" | "results";

export const ScanScreen = () => {
  const [screenState, setScreenState] = useState<ScanScreenState>("idle");
  const [product, setProduct] = useState<Product | null>(null);
  const [analysis, setAnalysis] = useState<ProductAnalysis | null>(null); // Changed to ProductAnalysis from Partial<ProductAnalysis>
  const [isLoading, setIsLoading] = useState(false);

  // NEW: Get the stack from the store
  const { stack } = useStackStore();

  const startScanning = () => {
    console.log("📱 Starting scanner...");
    setScreenState("scanning");
  };

  const handleBarcodeScanned = async (barcode: string) => {
    console.log("🔍 Processing barcode:", barcode);
    setScreenState("processing");
    setIsLoading(true);

    try {
      // UPDATED: Pass the user's stack to analyzeScannedProduct
      const result = await productService.analyzeScannedProduct(barcode, stack); // Pass stack
      setProduct(result.product);
      setAnalysis(result.analysis); // Now analysis will be a full ProductAnalysis with stackInteraction
      setScreenState("results");
      console.log(
        "✅ Analysis complete - Score:",
        result.analysis.overallScore
      );
    } catch (error) {
      console.error("Product analysis failed:", error);
      Alert.alert(
        "Analysis Failed",
        "Unable to analyze this product. Please try scanning another barcode.",
        [
          {
            text: "Try Again",
            onPress: () => setScreenState("scanning"),
          },
          {
            text: "Cancel",
            onPress: () => setScreenState("idle"),
            style: "cancel",
          },
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanAnother = () => {
    console.log("🔄 Resetting for new scan");
    setProduct(null);
    setAnalysis(null);
    setScreenState("scanning");
  };

  const handleClose = () => {
    console.log("❌ Closing scanner");
    setProduct(null);
    setAnalysis(null);
    setScreenState("idle");
  };

  if (screenState === "scanning") {
    return (
      <BarcodeScanner
        onBarcodeScanned={handleBarcodeScanned}
        onClose={handleClose}
      />
    );
  }

  if (screenState === "processing") {
    return (
      <View style={styles.processingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.processingTitle}>Analyzing Product...</Text>
        <Text style={styles.processingSubtitle}>
          🔍 Fetching product data{"\n"}
          🧠 Running quality analysis{"\n"}
          📊 Calculating scores with variety
        </Text>
      </View>
    );
  }

  // Changed to ProductAnalysis from Partial<ProductAnalysis> for the check
  if (screenState === "results" && product && analysis) {
    return (
      <ProductAnalysisResults
        product={product}
        analysis={analysis}
        onClose={handleClose}
        onScanAnother={handleScanAnother}
      />
    );
  }

  // Default idle state
  return (
    <SafeAreaView style={styles.container}>
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
          <Button
            title="Start Scanning"
            onPress={startScanning}
            variant="primary"
            size="large"
            style={styles.scanButton}
            icon={<Ionicons name="scan" size={20} color={COLORS.background} />}
          />

          <TouchableOpacity style={styles.helpButton}>
            <Text style={styles.helpText}>
              ✨ Scores now vary by product quality!
            </Text>
          </TouchableOpacity>
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
    justifyContent: "space-between",
  },
  header: {
    alignItems: "center",
    marginTop: SPACING.xxl,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.gray100,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xxxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    textAlign: "center",
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: SPACING.md,
  },
  features: {
    marginVertical: SPACING.xl,
  },
  feature: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.backgroundSecondary,
    justifyContent: "center",
    alignItems: "center",
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
    alignItems: "center",
  },
  scanButton: {
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.xl,
  },
  helpButton: {
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.success + "20",
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
  },
  helpText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.success,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  processingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.xl,
  },
  processingTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  processingSubtitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
});
