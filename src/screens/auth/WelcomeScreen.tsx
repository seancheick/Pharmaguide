import React from "react";
import { View, Text, StyleSheet, SafeAreaView, Image } from "react-native";
import { Button } from "../../components/common";
import { COLORS, SPACING, TYPOGRAPHY } from "../../constants";

interface WelcomeScreenProps {
  navigation: any;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>💊</Text>
          </View>
          <Text style={styles.title}>PharmaGuide</Text>
          <Text style={styles.subtitle}>
            Your AI-Powered Supplement Assistant
          </Text>
        </View>

        <View style={styles.features}>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>📱</Text>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Smart Scanning</Text>
              <Text style={styles.featureDescription}>
                Instantly analyze products with barcode scanning
              </Text>
            </View>
          </View>

          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🛡️</Text>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Safety First</Text>
              <Text style={styles.featureDescription}>
                Check interactions and personalized recommendations
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            title="Get Started"
            onPress={() => navigation.navigate("Signup")}
            variant="primary"
            size="large"
            style={styles.primaryButton}
          />

          <Button
            title="I Have an Account"
            onPress={() => navigation.navigate("Login")}
            variant="outline"
            size="large"
          />
        </View>

        <Text style={styles.footer}>
          Join thousands making smarter supplement choices
        </Text>
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
    paddingVertical: SPACING.xl,
    justifyContent: "space-between",
  },
  header: {
    alignItems: "center",
    marginTop: SPACING.xxl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.gray100,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  logo: {
    fontSize: 40,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xxxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.textSecondary,
    textAlign: "center",
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
    fontSize: 24,
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
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  actions: {
    gap: SPACING.md,
  },
  primaryButton: {
    marginBottom: SPACING.sm,
  },
  footer: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textTertiary,
    textAlign: "center",
    marginTop: SPACING.lg,
  },
});
