import React from "react";
import { View, Text, StyleSheet, SafeAreaView } from "react-native";
import { COLORS, TYPOGRAPHY, SPACING } from "../../constants";

export function AIScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>AI Pharmacist</Text>
        <Text style={styles.subtitle}>
          Your personal supplement expert is ready to help!
        </Text>

        <View style={styles.comingSoon}>
          <Text style={styles.comingSoonText}>
            🚀 Enhanced AI Chat Coming Soon!
          </Text>
          <Text style={styles.description}>
            Ask about interactions, dosing, alternatives, and more.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xxxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: SPACING.xl,
  },
  comingSoon: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 20,
    padding: SPACING.xl,
    alignItems: "center",
  },
  comingSoonText: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.primary,
    marginBottom: SPACING.md,
  },
  description: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
});
