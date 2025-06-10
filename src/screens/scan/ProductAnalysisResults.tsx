import React, { useState, useEffect } from "react"; // Added useEffect
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Button } from "../../components/common";
import type { Product, ProductAnalysis, RiskLevel } from "../../types";
import { COLORS, SPACING, TYPOGRAPHY } from "../../constants";
import { useStackStore } from "../../stores/stackStore";
import AsyncStorage from "@react-native-async-storage/async-storage"; // NEW: Import AsyncStorage

interface ProductAnalysisResultsProps {
  product: Product;
  analysis: ProductAnalysis;
  onClose: () => void;
  onScanAnother: () => void;
}

export const ProductAnalysisResults: React.FC<ProductAnalysisResultsProps> = ({
  product,
  analysis,
  onClose,
  onScanAnother,
}) => {
  const [savedToStack, setSavedToStack] = useState(false);
  const { addToStack } = useStackStore();

  const getScoreColor = (score: number) => {
    if (score >= 80) return COLORS.success;
    if (score >= 60) return COLORS.secondary;
    if (score >= 40) return COLORS.warning;
    return COLORS.error;
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Poor";
  };

  // Fixed type safety as per Copilot's suggestion
  const getRiskColor = (risk: RiskLevel) => {
    switch (risk) {
      case "CRITICAL":
        return COLORS.error;
      case "HIGH":
        return COLORS.warning;
      case "MODERATE":
        return COLORS.accent || COLORS.warning; // Fallback if accent doesn't exist
      case "LOW":
        return COLORS.secondary;
      case "NONE":
      default:
        return COLORS.gray400;
    }
  };

  const handleAddToStack = async () => {
    // Check for critical interaction before adding
    if (analysis.stackInteraction?.overallRiskLevel === "CRITICAL") {
      Alert.alert(
        "Critical Interaction Detected",
        "This product has CRITICAL interactions with your current stack. Adding it may pose a severe risk. Please consult your healthcare provider before proceeding.",
        [{ text: "OK" }]
      );
      return;
    }

    const itemToAdd = {
      item_id: product.id,
      name: product.name,
      type: (product.category === "medication"
        ? "medication"
        : "supplement") as "medication" | "supplement",
      dosage: product.dosage || "As directed",
      frequency: "Daily",
      ingredients: product.ingredients.map((ing) => ({
        name: ing.name,
        amount: ing.amount,
        unit: ing.unit,
      })),
    };

    try {
      await addToStack(itemToAdd);
      setSavedToStack(true);
      Alert.alert(
        "Added to Stack! 📚",
        `${product.name} has been saved to your supplement stack for tracking and analysis.`,
        [{ text: "Great!", style: "default" }]
      );
    } catch (error) {
      console.error("Failed to add to stack:", error);
      Alert.alert("Error", "Could not add product to stack. Please try again.");
    }
  };

  const handleTalkToAI = () => {
    Alert.alert(
      "AI Pharmacist Ready! 🧠",
      `I'm ready to discuss ${product.name} in detail. Ask me about interactions, dosing, timing, alternatives, or any specific health goals!`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Start Chat",
          onPress: () =>
            console.log("Navigate to AI chat with product context"),
        },
      ]
    );
  };

  // NEW: saveToRecentScans function
  const saveToRecentScans = async (prod: Product, anal: ProductAnalysis) => {
    try {
      const existingScans = await AsyncStorage.getItem("recent_scans");
      const scans = existingScans ? JSON.parse(existingScans) : [];

      const newScan = {
        id: Date.now().toString(), // Unique ID for the scan record
        name: prod.name,
        brand: prod.brand,
        imageUrl: prod.imageUrl,
        score: anal.overallScore,
        // Check for stackInteraction existence and its riskLevel
        hasInteraction: anal.stackInteraction
          ? anal.stackInteraction.overallRiskLevel !== "NONE"
          : false,
        scannedAt: new Date().toISOString(),
      };

      // Add to beginning, keep only last 20 scans
      const updatedScans = [newScan, ...scans].slice(0, 20);
      await AsyncStorage.setItem("recent_scans", JSON.stringify(updatedScans));
      console.log("Scan saved to recent scans:", prod.name);
    } catch (error) {
      console.error("Error saving recent scan:", error);
    }
  };

  // NEW: Call saveToRecentScans when analysis completes
  useEffect(() => {
    if (product && analysis) {
      saveToRecentScans(product, analysis);
    }
  }, [product, analysis]); // Dependencies: run when product or analysis changes

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analysis Results</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Product Info */}
        <View style={styles.productCard}>
          {product.imageUrl ? (
            <Image
              source={{ uri: product.imageUrl }}
              style={styles.productImage}
            />
          ) : (
            <View style={styles.productImagePlaceholder}>
              <Ionicons name="image-outline" size={40} color={COLORS.gray400} />
              <Text style={styles.imagePlaceholderText}>No Image</Text>
            </View>
          )}
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.productBrand}>{product.brand}</Text>
            <Text style={styles.productCategory}>{product.category}</Text>
            <Text style={styles.productBarcode}>
              Barcode: {product.barcode}
            </Text>
          </View>
        </View>

        {/* Overall Score */}
        {analysis.overallScore !== undefined && (
          <View style={styles.scoreCard}>
            <View style={styles.scoreHeader}>
              <Text style={styles.scoreTitle}>Overall Quality Score</Text>
              <View
                style={[
                  styles.scoreBadge,
                  { backgroundColor: getScoreColor(analysis.overallScore) },
                ]}
              >
                <Text style={styles.scoreValue}>{analysis.overallScore}</Text>
              </View>
            </View>
            <Text
              style={[
                styles.scoreLabel,
                { color: getScoreColor(analysis.overallScore) },
              ]}
            >
              {getScoreLabel(analysis.overallScore)}
            </Text>
            <Text style={styles.scoreDescription}>
              Based on ingredient quality, bioavailability, dosage optimization,
              and purity standards
            </Text>
          </View>
        )}

        {/* Stack Interaction Alert - Fixed with proper optional chaining */}
        {analysis.stackInteraction &&
          analysis.stackInteraction.overallRiskLevel !== "NONE" &&
          analysis.stackInteraction.interactions && (
            <View
              style={[
                styles.interactionAlert,
                {
                  borderColor: getRiskColor(
                    analysis.stackInteraction.overallRiskLevel
                  ),
                },
              ]}
            >
              <View style={styles.alertHeader}>
                <MaterialIcons
                  name="warning"
                  size={24}
                  color={getRiskColor(
                    analysis.stackInteraction.overallRiskLevel
                  )}
                />
                <Text
                  style={[
                    styles.alertTitle,
                    {
                      color: getRiskColor(
                        analysis.stackInteraction.overallRiskLevel
                      ),
                    },
                  ]}
                >
                  Stack Interaction Alert
                </Text>
              </View>

              <Text style={styles.riskLevelText}>
                Risk Level: {analysis.stackInteraction.overallRiskLevel}
              </Text>

              {/* Show individual interactions with better key handling */}
              {analysis.stackInteraction.interactions.map(
                (interaction, index) => (
                  <View
                    key={`interaction-${index}`}
                    style={styles.interactionDetailSection}
                  >
                    <Text style={styles.interactionMessage}>
                      {interaction.message}
                    </Text>
                    {interaction.mechanism && (
                      <Text style={styles.mechanismText}>
                        Why: {interaction.mechanism}
                      </Text>
                    )}
                    {interaction.recommendation && (
                      <Text style={styles.recommendationText}>
                        {interaction.recommendation}
                      </Text>
                    )}
                  </View>
                )
              )}

              {/* Educational Disclaimer */}
              <View style={styles.disclaimerContainer}>
                <MaterialIcons
                  name="info-outline"
                  size={16}
                  color={COLORS.textSecondary}
                />
                <Text style={styles.disclaimerText}>
                  This information is for educational purposes only. Always
                  consult your healthcare provider before making any changes to
                  your medications or supplements.
                </Text>
              </View>
            </View>
          )}

        {/* Category Scores */}
        {analysis.categoryScores && (
          <View style={styles.categoryCard}>
            <Text style={styles.categoryTitle}>Detailed Breakdown</Text>
            {Object.entries(analysis.categoryScores).map(
              ([category, score]) => (
                <View key={`category-${category}`} style={styles.categoryRow}>
                  <Text style={styles.categoryName}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Text>
                  <View style={styles.categoryScoreContainer}>
                    <View style={styles.categoryScoreBar}>
                      <View
                        style={[
                          styles.categoryScoreFill,
                          {
                            width: `${score}%`,
                            backgroundColor: getScoreColor(score),
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.categoryScore}>{score}</Text>
                  </View>
                </View>
              )
            )}
          </View>
        )}

        {/* Strengths */}
        {analysis.strengths && analysis.strengths.length > 0 && (
          <View style={styles.strengthsCard}>
            <Text style={styles.strengthsTitle}>✅ Strengths</Text>
            {analysis.strengths.map((strength, index) => (
              <View key={`strength-${index}`} style={styles.strengthItem}>
                <Text style={styles.strengthPoint}>{strength.point}</Text>
                <Text style={styles.strengthDetail}>{strength.detail}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Weaknesses */}
        {analysis.weaknesses && analysis.weaknesses.length > 0 && (
          <View style={styles.weaknessesCard}>
            <Text style={styles.weaknessesTitle}>⚠️ Areas for Improvement</Text>
            {analysis.weaknesses.map((weakness, index) => (
              <View key={`weakness-${index}`} style={styles.weaknessItem}>
                <Text style={styles.weaknessPoint}>{weakness.point}</Text>
                <Text style={styles.weaknessDetail}>{weakness.detail}</Text>
              </View>
            ))}
          </View>
        )}

        {/* AI Reasoning */}
        {analysis.aiReasoning && (
          <View style={styles.reasoningCard}>
            <Text style={styles.reasoningTitle}>🧠 AI Analysis</Text>
            <Text style={styles.reasoningText}>{analysis.aiReasoning}</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            title="Scan Another Product"
            onPress={onScanAnother}
            variant="primary"
            size="large"
            style={styles.scanAnotherButton}
            icon={<Ionicons name="scan" size={20} color={COLORS.background} />}
          />

          {/* Dual button design - Fixed gap issue for React Native compatibility */}
          <View style={styles.dualButtonContainer}>
            <TouchableOpacity
              style={[
                styles.dualButton,
                styles.stackButton,
                savedToStack && styles.stackButtonSaved,
                styles.leftButton, // Added for margin handling
              ]}
              onPress={handleAddToStack}
              disabled={savedToStack}
            >
              <Ionicons
                name={savedToStack ? "checkmark-circle" : "library-outline"}
                size={20}
                color={savedToStack ? COLORS.success : COLORS.background}
              />
              <Text
                style={[
                  styles.dualButtonText,
                  savedToStack && styles.stackButtonTextSaved,
                ]}
              >
                {savedToStack ? "Added to Stack" : "Add to Stack"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.dualButton, styles.aiButton]}
              onPress={handleTalkToAI}
            >
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={20}
                color={COLORS.background}
              />
              <Text style={styles.dualButtonText}>Talk to AI Pharmacist</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl * 2,
  },
  productCard: {
    flexDirection: "row",
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: SPACING.lg,
    marginVertical: SPACING.md,
    alignItems: "center",
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: SPACING.md,
    resizeMode: "contain",
  },
  productImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: SPACING.md,
    backgroundColor: COLORS.gray100,
    justifyContent: "center",
    alignItems: "center",
  },
  imagePlaceholderText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.gray500,
    marginTop: SPACING.xs,
  },
  productInfo: {
    flex: 1,
    justifyContent: "center",
  },
  productName: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  productBrand: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  productCategory: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textTertiary,
    textTransform: "capitalize",
    marginBottom: SPACING.xs,
  },
  productBarcode: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textTertiary,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  scoreCard: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: SPACING.lg,
    marginVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  scoreHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.xs,
  },
  scoreTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
  },
  scoreBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  scoreValue: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.background,
  },
  scoreLabel: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.medium,
    marginBottom: SPACING.xs,
  },
  scoreDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  categoryCard: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: SPACING.lg,
    marginVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  categoryTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  categoryName: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
    flex: 1,
  },
  categoryScoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  categoryScoreBar: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.gray200,
    borderRadius: 4,
    marginHorizontal: SPACING.sm,
  },
  categoryScoreFill: {
    height: "100%",
    borderRadius: 4,
  },
  categoryScore: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
    width: 30,
    textAlign: "right",
  },
  strengthsCard: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: SPACING.lg,
    marginVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.success,
    borderLeftWidth: 4,
  },
  strengthsTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.success,
    marginBottom: SPACING.md,
  },
  strengthItem: {
    marginBottom: SPACING.sm,
  },
  strengthPoint: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  strengthDetail: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  weaknessesCard: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: SPACING.lg,
    marginVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.warning,
    borderLeftWidth: 4,
  },
  weaknessesTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.warning,
    marginBottom: SPACING.md,
  },
  weaknessItem: {
    marginBottom: SPACING.sm,
  },
  weaknessPoint: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  weaknessDetail: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  reasoningCard: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: SPACING.lg,
    marginVertical: SPACING.sm,
  },
  reasoningTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  reasoningText: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  actions: {
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.sm,
  },
  scanAnotherButton: {
    marginBottom: SPACING.lg,
  },
  dualButtonContainer: {
    flexDirection: "row",
    // Removed 'gap' for compatibility
  },
  dualButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderRadius: 12,
    minHeight: 52,
  },
  leftButton: {
    marginRight: SPACING.sm / 2, // Replaces gap for better compatibility
  },
  stackButton: {
    backgroundColor: COLORS.secondary,
  },
  stackButtonSaved: {
    backgroundColor: COLORS.success,
  },
  aiButton: {
    backgroundColor: COLORS.primary,
    marginLeft: SPACING.sm / 2, // Other half of the gap
  },
  dualButtonText: {
    color: COLORS.background,
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    marginLeft: SPACING.xs,
    textAlign: "center",
  },
  stackButtonTextSaved: {
    color: COLORS.background,
  },
  // Stack Interaction Alert Styles
  interactionAlert: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: SPACING.lg,
    marginVertical: SPACING.sm,
    borderWidth: 2,
    borderLeftWidth: 8,
  },
  alertHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  alertTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginLeft: SPACING.sm,
  },
  riskLevelText: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    marginLeft: SPACING.xl,
  },
  interactionDetailSection: {
    marginBottom: SPACING.md,
    paddingLeft: SPACING.md,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.gray200,
  },
  interactionMessage: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textPrimary,
    lineHeight: 22,
    marginBottom: SPACING.xs,
  },
  mechanismText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.gray600,
    lineHeight: 18,
    fontStyle: "italic",
  },
  recommendationText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.primaryDark,
    fontWeight: TYPOGRAPHY.weights.medium,
    marginTop: SPACING.xs,
    lineHeight: 18,
  },
  disclaimerContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: COLORS.gray100,
    borderRadius: 8,
    padding: SPACING.md,
    marginTop: SPACING.lg,
  },
  disclaimerText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginLeft: SPACING.sm,
  },
});
