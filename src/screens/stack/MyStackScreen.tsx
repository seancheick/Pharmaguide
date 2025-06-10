import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useStackStore } from "../../stores/stackStore";
import { interactionService } from "../../services/interactions";
import { COLORS, TYPOGRAPHY, SPACING } from "../../constants";

export function MyStackScreen() {
  const navigation = useNavigation();
  const { stack, removeFromStack, loadStack, initialized } = useStackStore();
  const [stackAnalysis, setStackAnalysis] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (!initialized) {
      loadStack();
    }
  }, [initialized]);

  useEffect(() => {
    if (stack.length > 1) {
      analyzeFullStack();
    } else {
      setStackAnalysis(null);
    }
  }, [stack]);

  const analyzeFullStack = async () => {
    setAnalyzing(true);
    try {
      const allInteractions = [];

      // Check all pairs in the stack
      for (let i = 0; i < stack.length; i++) {
        for (let j = i + 1; j < stack.length; j++) {
          const interaction = await interactionService.analyzeProductWithStack(
            stack[i] as any, // Type conversion for now
            [stack[j]]
          );

          if (interaction.riskLevel !== "NONE") {
            allInteractions.push({
              items: [stack[i].name, stack[j].name],
              ...interaction,
            });
          }
        }
      }

      setStackAnalysis({
        totalInteractions: allInteractions.length,
        interactions: allInteractions,
        overallSafe: allInteractions.length === 0,
      });
    } catch (error) {
      console.error("Stack analysis error:", error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleRemoveItem = (id: string, name: string) => {
    Alert.alert(
      "Remove from Stack",
      `Are you sure you want to remove ${name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => removeFromStack(id),
        },
      ]
    );
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "CRITICAL":
        return "#DC2626";
      case "HIGH":
        return "#EA580C";
      case "MODERATE":
        return "#F59E0B";
      case "LOW":
        return "#10B981";
      default:
        return COLORS.success;
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Stack Safety Overview */}
      {stackAnalysis && !stackAnalysis.overallSafe && (
        <View style={styles.safetyAlert}>
          <MaterialIcons name="warning" size={24} color="#F59E0B" />
          <Text style={styles.alertTitle}>
            {stackAnalysis.totalInteractions} Interaction(s) Detected
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
          stack.map((item) => (
            <View key={item.id} style={styles.stackItem}>
              <MaterialIcons
                name={item.type === "medication" ? "medication" : "eco"}
                size={24}
                color={
                  item.type === "medication" ? COLORS.primary : COLORS.secondary
                }
              />
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemDetails}>
                  {item.dosage} • {item.frequency}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleRemoveItem(item.id, item.name)}
              >
                <MaterialIcons name="close" size={24} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      {/* Interactions Detail */}
      {stackAnalysis && stackAnalysis.interactions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interaction Details</Text>
          {stackAnalysis.interactions.map((interaction: any, index: number) => (
            <View key={index} style={styles.interactionCard}>
              <View style={styles.interactionHeader}>
                <MaterialIcons
                  name="error-outline"
                  size={20}
                  color={getRiskColor(interaction.riskLevel)}
                />
                <Text style={styles.interactionItems}>
                  {interaction.items[0]} + {interaction.items[1]}
                </Text>
              </View>
              <Text
                style={[
                  styles.riskLevel,
                  { color: getRiskColor(interaction.riskLevel) },
                ]}
              >
                {interaction.riskLevel} Risk
              </Text>
              {interaction.interactions[0] && (
                <Text style={styles.interactionMessage}>
                  {interaction.interactions[0].message}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Add Item FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("Scan" as never)}
      >
        <MaterialIcons name="add" size={24} color={COLORS.white} />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safetyAlert: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    padding: SPACING.md,
    margin: SPACING.md,
    borderRadius: 12,
  },
  alertTitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: "#92400E",
    marginLeft: SPACING.sm,
  },
  section: {
    padding: SPACING.md,
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
  },
  addButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 8,
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  stackItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.backgroundSecondary,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.sm,
  },
  itemInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  itemName: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
  },
  itemDetails: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  interactionCard: {
    backgroundColor: COLORS.backgroundSecondary,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.sm,
  },
  interactionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.xs,
  },
  interactionItems: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
    marginLeft: SPACING.xs,
  },
  riskLevel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginBottom: SPACING.xs,
  },
  interactionMessage: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  fab: {
    position: "absolute",
    bottom: SPACING.lg,
    right: SPACING.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});
