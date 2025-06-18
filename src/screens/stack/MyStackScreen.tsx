import React, { useEffect, useState, useCallback, useMemo } from "react"; // Added useMemo
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Dimensions, // Import Dimensions for dynamic styling if needed
  Image,
} from "react-native";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useStackStore } from "../../stores/stackStore";
import { interactionService } from "../../services/interactions"; // Assuming this exists
import { COLORS, TYPOGRAPHY, SPACING } from "../../constants";
import { AnimatedTouchable } from "../../components/common";
import type {
  UserStack,
  StackInteractionResult,
  RiskLevel,
  Product,
} from "../../types"; // Import Product type

// Constants for dynamic styling if needed
const { width: SCREEN_WIDTH } = Dimensions.get("window");

export function MyStackScreen() {
  const navigation = useNavigation();
  const {
    stack,
    removeFromStack,
    loadStack,
    initialized,
    loading: storeLoading,
  } = useStackStore(); // Destructure storeLoading
  const [stackAnalysis, setStackAnalysis] =
    useState<StackInteractionResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Load stack when component mounts or store is not initialized
  useEffect(() => {
    if (!initialized) {
      loadStack();
    }
  }, [initialized, loadStack]);

  // Trigger analysis when stack changes (after it's loaded and not currently analyzing)
  useEffect(() => {
    if (initialized && !storeLoading) {
      // Ensure stack is initialized and not loading to avoid premature analysis
      if (stack.length > 0) {
        // Analyze if there are any items
        analyzeFullStack();
      } else {
        // If stack is empty, reset analysis
        setStackAnalysis({
          overallRiskLevel: "NONE",
          interactions: [],
          nutrientWarnings: [],
          overallSafe: true,
        });
      }
    }
  }, [stack, initialized, storeLoading]); // Re-run when stack, initialized, or storeLoading changes

  // Function to map UserStack to a Product-like structure for interactionService
  // This is crucial if interactionService expects 'Product' type, not 'UserStack'
  const mapUserStackToProduct = useCallback(
    (userStackItem: UserStack): Product => {
      // Map simple ingredients to full Ingredient objects
      const mappedIngredients = userStackItem.ingredients?.map(ingredient => ({
        name: ingredient.name,
        amount: ingredient.amount || 0,
        unit: ingredient.unit || "mg",
        form: "other" as const,
        bioavailability: "medium" as const,
        evidenceLevel: "theoretical" as const,
        category: "active" as const,
      })) || [];

      return {
        id: userStackItem.item_id, // Use item_id as product ID
        name: userStackItem.name,
        brand: userStackItem.brand || "Unknown Brand",
        category: "specialty", // Use valid ProductCategory value
        ingredients: mappedIngredients,
        // Add other required Product properties with default/dummy values if not in UserStack
        barcode: undefined,
        servingSize: userStackItem.dosage || "1 unit",
        servingsPerContainer: 1, // Default, as not in UserStack
        imageUrl: userStackItem.imageUrl,
        verified: false,
        thirdPartyTested: false,
        certifications: [],
        createdAt: userStackItem.created_at,
        updatedAt: userStackItem.updated_at,
        dosage: userStackItem.dosage,
        price: undefined, // Price not in UserStack
      };
    },
    []
  );

  const analyzeFullStack = async () => {
    setAnalyzing(true);
    setStackAnalysis(null); // Clear previous analysis while re-analyzing

    try {
      if (stack.length === 0) {
        setStackAnalysis({
          overallRiskLevel: "NONE",
          interactions: [],
          nutrientWarnings: [],
          overallSafe: true,
        });
        return;
      }

      const productsForAnalysis: Product[] = stack.map(mapUserStackToProduct);

      const allInteractions: StackInteractionResult["interactions"] = [];
      const allNutrientWarnings: StackInteractionResult["nutrientWarnings"] =
        [];
      let overallHighestRisk: RiskLevel = "NONE";
      let overallSafe = true;

      // Iterate through each product in the stack and check it against all *other* products
      // This is a common way to simulate pairwise full stack analysis with a per-product API
      for (let i = 0; i < productsForAnalysis.length; i++) {
        const currentProduct = productsForAnalysis[i];
        const remainingStack = productsForAnalysis.filter(
          (_, idx) => idx !== i
        );

        // Call the service for a single product against the rest of the stack
        const remainingUserStack = stack.filter((_, idx) => idx !== i);
        const result = await interactionService.analyzeProductWithStack(
          currentProduct,
          remainingUserStack
        );

        // Aggregate interactions, avoiding duplicates
        result.interactions.forEach((interaction) => {
          if (
            !allInteractions.some(
              (existing) =>
                existing.message === interaction.message &&
                existing.severity === interaction.severity
            )
          ) {
            // More robust duplicate check
            allInteractions.push(interaction);
          }
        });

        // Aggregate nutrient warnings, avoiding duplicates
        result.nutrientWarnings?.forEach((warning) => {
          if (
            !allNutrientWarnings.some(
              (existing) => existing.nutrient === warning.nutrient
            )
          ) {
            allNutrientWarnings.push(warning);
          }
        });

        // Escalating overall risk level - implement risk escalation inline
        const escalateRisk = (current: RiskLevel, newRisk: RiskLevel): RiskLevel => {
          const riskOrder = ["NONE", "LOW", "MODERATE", "HIGH", "CRITICAL"];
          const currentIndex = riskOrder.indexOf(current);
          const newIndex = riskOrder.indexOf(newRisk);
          return newIndex > currentIndex ? newRisk : current;
        };
        
        overallHighestRisk = escalateRisk(
          overallHighestRisk,
          result.overallRiskLevel
        );
        if (!result.overallSafe) overallSafe = false;
      }

      setStackAnalysis({
        overallRiskLevel: overallHighestRisk,
        interactions: allInteractions,
        nutrientWarnings: allNutrientWarnings,
        overallSafe: overallSafe, // Based on aggregated risks
      });
    } catch (error) {
      console.error("Stack analysis error:", error);
      Alert.alert("Error", "Failed to analyze stack. Please try again.");
      setStackAnalysis({
        overallRiskLevel: "NONE",
        interactions: [],
        nutrientWarnings: [],
        overallSafe: true,
      }); // Reset on error
    } finally {
      setAnalyzing(false);
    }
  };

  const handleRemoveItem = useCallback(
    (itemToRemove: UserStack) => {
      Alert.alert(
        "Remove from Stack",
        `Are you sure you want to remove ${itemToRemove.name}?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Remove",
            style: "destructive",
            onPress: async () => {
              try {
                await removeFromStack(itemToRemove.id);
              } catch (error: any) {
                Alert.alert(
                  "Removal Failed",
                  error.message || "Could not remove item. Please try again."
                );
              }
            },
          },
        ]
      );
    },
    [removeFromStack]
  ); // Depend on removeFromStack

  const getRiskColor = useCallback((level: RiskLevel) => {
    switch (level) {
      case "CRITICAL":
        return "#DC2626"; // Red-700
      case "HIGH":
        return "#EA580C"; // Orange-700
      case "MODERATE":
        return "#F59E0B"; // Amber-500
      case "LOW":
        return "#10B981"; // Emerald-500
      case "NONE":
      default:
        return COLORS.success; // A pleasant green for no risk/safe
    }
  }, []);

  const renderStackItem = useCallback(
    (item: UserStack) => (
      <AnimatedTouchable
        key={item.id}
        style={styles.stackItem}
        // onPress={() => handleItemPress(item)} // Re-add if you have a handleItemPress function
      >
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
        ) : (
          <View style={styles.itemImagePlaceholder}>
            <Ionicons name="cube-outline" size={24} color={COLORS.gray400} />
          </View>
        )}
        <View style={styles.stackItemContent}>
          <Text style={styles.itemName} numberOfLines={1}>
            {item.name}
          </Text>
          {item.brand && (
            <Text style={styles.itemBrand} numberOfLines={1}>
              {item.brand}
            </Text>
          )}
          {item.dosage && (
            <Text style={styles.itemDosage} numberOfLines={1}>
              Dosage: {item.dosage}
            </Text>
          )}
        </View>

        <TouchableOpacity
          onPress={() => handleRemoveItem(item)}
          style={styles.removeButton}
        >
          <MaterialIcons name="close" size={24} color={COLORS.error} />
        </TouchableOpacity>
      </AnimatedTouchable>
    ),
    [handleRemoveItem]
  ); // Depend on handleRemoveItem

  // Show loading state if either the store is loading or analysis is in progress
  const isLoading = useMemo(
    () => storeLoading || analyzing,
    [storeLoading, analyzing]
  );

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>
            {analyzing ? "Analyzing interactions..." : "Loading your stack..."}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={{ paddingBottom: SPACING.xl * 4 }}
        >
          {/* Stack Safety Overview */}
          {stackAnalysis &&
            (stackAnalysis.overallRiskLevel !== "NONE" ||
              (stackAnalysis.nutrientWarnings && stackAnalysis.nutrientWarnings.length > 0)) && (
              <View
                style={[
                  styles.safetyAlert,
                  {
                    borderColor: getRiskColor(stackAnalysis.overallRiskLevel),
                    borderWidth: 2,
                    borderLeftWidth: 8,
                    backgroundColor: `${getRiskColor(
                      stackAnalysis.overallRiskLevel
                    )}10`, // Light tint of risk color
                  },
                ]}
              >
                <MaterialIcons
                  name="warning"
                  size={24}
                  color={getRiskColor(stackAnalysis.overallRiskLevel)}
                />
                <Text
                  style={[
                    styles.alertTitle,
                    { color: getRiskColor(stackAnalysis.overallRiskLevel) },
                  ]}
                >
                  {stackAnalysis.overallRiskLevel !== "NONE"
                    ? `${stackAnalysis.interactions.length} Interaction(s) Detected`
                    : "Nutrient Overload Detected"}
                </Text>
              </View>
            )}

          {/* Stack Items */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>My Stack ({stack.length})</Text>

            {stack.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons
                  name="inventory"
                  size={48}
                  color={COLORS.textSecondary}
                />
                <Text style={styles.emptyText}>Your stack is empty</Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => navigation.navigate("Scan" as never)}
                >
                  <Text style={styles.addButtonText}>Add Your First Item</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.stackList}>
                {stack.map((item) => renderStackItem(item))}
              </View>
            )}
          </View>

          {/* Interactions Detail */}
          {stackAnalysis && stackAnalysis.interactions.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Interaction Details</Text>
              {stackAnalysis.interactions.map((interaction, index) => (
                <View key={index} style={styles.interactionCard}>
                  <View style={styles.interactionHeader}>
                    <MaterialIcons
                      name="error-outline"
                      size={20}
                      color={getRiskColor(interaction.severity)}
                    />
                    <Text style={styles.interactionItems}>
                      {interaction.message}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.riskLevel,
                      { color: getRiskColor(interaction.severity) },
                    ]}
                  >
                    {interaction.severity} Risk
                  </Text>
                  {interaction.mechanism && (
                    <Text style={styles.interactionMessage}>
                      **Why:** {interaction.mechanism}
                    </Text>
                  )}
                  {interaction.recommendation && (
                    <Text style={styles.interactionMessage}>
                      **Recommendation:** {interaction.recommendation}
                    </Text>
                  )}
                  {interaction.evidenceSources &&
                    interaction.evidenceSources.length > 0 && (
                      <View style={styles.evidenceSourcesContainer}>
                        <Text style={styles.evidenceSourcesTitle}>
                          Evidence:
                        </Text>
                        {interaction.evidenceSources.map((source, sIndex) => (
                          <View key={sIndex} style={styles.evidenceSourceBadge}>
                            <Text style={styles.evidenceSourceText}>
                              {source.badge}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                </View>
              ))}
            </View>
          )}

          {/* Nutrient Warnings Detail */}
          {stackAnalysis &&
            stackAnalysis.nutrientWarnings &&
            stackAnalysis.nutrientWarnings.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Nutrient Overload Warnings
                </Text>
                {stackAnalysis.nutrientWarnings.map((warning, index) => (
                  <View
                    key={`nutrient-warning-${index}`}
                    style={styles.interactionCard}
                  >
                    <View style={styles.interactionHeader}>
                      <MaterialIcons
                        name="warning"
                        size={20}
                        color={getRiskColor(warning.severity)}
                      />
                      <Text style={styles.interactionItems}>
                        {warning.nutrient} Overload
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.riskLevel,
                        { color: getRiskColor(warning.severity) },
                      ]}
                    >
                      {warning.severity} Risk
                    </Text>
                    <Text style={styles.interactionMessage}>
                      Current: {warning.currentTotal} {warning.unit} (Upper
                      Limit: {warning.upperLimit} {warning.unit})
                    </Text>
                    {warning.recommendation && (
                      <Text style={styles.interactionMessage}>
                        **Recommendation:** {warning.recommendation}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}
        </ScrollView>
      )}

      {/* Add Item FAB */}
      <TouchableOpacity
        onPress={() => navigation.navigate("Scan" as never)}
        style={styles.fab}
      >
        <MaterialIcons name="add" size={24} color={COLORS.background} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingTop: SPACING.md, // Add some top padding
  },
  safetyAlert: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
    borderRadius: 12,
  },
  alertTitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.medium,
    marginLeft: SPACING.sm,
    flexShrink: 1, // Allow text to wrap
  },
  section: {
    paddingHorizontal: SPACING.md, // Adjust to use horizontal padding for sections
    paddingVertical: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: SPACING.xl * 2,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
    textAlign: "center",
  },
  addButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 8,
  },
  addButtonText: {
    color: COLORS.background,
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  stackList: {
    // No specific styles needed here, children will handle spacing
  },
  stackItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.backgroundSecondary, // Changed from COLORS.background
    borderRadius: 12,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    shadowColor: COLORS.gray900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: SPACING.md,
    resizeMode: "contain",
  },
  itemImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: COLORS.gray100,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.md,
  },
  stackItemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
  },
  itemBrand: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  itemDosage: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  removeButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.sm,
  },
  interactionCard: {
    backgroundColor: COLORS.backgroundSecondary,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.sm,
  },
  interactionHeader: {
    flexDirection: "row",
    alignItems: "flex-start", // Align items to start if text wraps
    marginBottom: SPACING.xs,
  },
  interactionItems: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
    marginLeft: SPACING.xs,
    flexShrink: 1, // Allow text to wrap
  },
  riskLevel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginBottom: SPACING.xs,
    marginLeft: SPACING.lg, // Indent for alignment with icon
  },
  interactionMessage: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.xs / 2,
  },
  evidenceSourcesContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: SPACING.sm,
    flexWrap: "wrap", // Allow badges to wrap
  },
  evidenceSourcesTitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
    marginRight: SPACING.xs,
  },
  evidenceSourceBadge: {
    backgroundColor: COLORS.gray300,
    borderRadius: 6,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    marginRight: SPACING.xs,
    marginBottom: SPACING.xs, // For wrapping
  },
  evidenceSourceText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  fab: {
    position: "absolute",
    bottom: SPACING.xl,
    right: SPACING.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.gray900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: SPACING.xxl,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
  },
});
