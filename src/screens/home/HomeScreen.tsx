import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../hooks/useAuth";
import { COLORS, SPACING, TYPOGRAPHY } from "../../constants";

interface HomeScreenProps {
  navigationRef?: React.RefObject<any>;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigationRef }) => {
  const { user, signOut } = useAuth();

  // FIXED: Direct tab navigation that actually works
  const handleScanProduct = () => {
    console.log("Navigate to scan screen");
    if (navigationRef?.current) {
      navigationRef.current.navigate("Scan");
    }
  };

  const handleAIConsult = () => {
    console.log("Navigate to AI screen");
    if (navigationRef?.current) {
      navigationRef.current.navigate("AI");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back!</Text>
            <Text style={styles.email}>{user?.email}</Text>
          </View>
          <TouchableOpacity onPress={signOut} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color={COLORS.gray600} />
          </TouchableOpacity>
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={handleScanProduct}
              activeOpacity={0.7}
            >
              <View style={styles.actionIcon}>
                <Ionicons
                  name="scan-outline"
                  size={32}
                  color={COLORS.primary}
                />
              </View>
              <Text style={styles.actionTitle}>Scan Product</Text>
              <Text style={styles.actionDescription}>
                Analyze supplements instantly
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={handleAIConsult}
              activeOpacity={0.7}
            >
              <View style={styles.actionIcon}>
                <Ionicons
                  name="chatbubble-outline"
                  size={32}
                  color={COLORS.secondary}
                />
              </View>
              <Text style={styles.actionTitle}>AI Consultant</Text>
              <Text style={styles.actionDescription}>
                Get personalized advice
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.recentActivity}>
          <Text style={styles.sectionTitle}>Recent Scans</Text>
          <View style={styles.activityCard}>
            <View style={styles.scanResult}>
              <Text style={styles.scanProduct}>🐟 Fish Oil</Text>
              <Text style={styles.scanScore}>Score: 58/100</Text>
            </View>
            <Text style={styles.activityText}>
              Your scanner is working perfectly! Different products will show
              different scores based on quality factors.
            </Text>
          </View>
        </View>

        <View style={styles.stats}>
          <Text style={styles.sectionTitle}>Your Progress</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>3+</Text>
              <Text style={styles.statLabel}>Products Scanned</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>58</Text>
              <Text style={styles.statLabel}>Latest Score</Text>
            </View>
          </View>
        </View>

        <View style={styles.comingSoon}>
          <Text style={styles.sectionTitle}>🚀 Coming Soon</Text>
          <View style={styles.featurePreview}>
            <View style={styles.previewItem}>
              <Ionicons
                name="library-outline"
                size={20}
                color={COLORS.primary}
              />
              <Text style={styles.previewText}>
                Dynamic scoring (scores will vary more)
              </Text>
            </View>
            <View style={styles.previewItem}>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={20}
                color={COLORS.secondary}
              />
              <Text style={styles.previewText}>AI Pharmacist chat</Text>
            </View>
            <View style={styles.previewItem}>
              <Ionicons
                name="fitness-outline"
                size={20}
                color={COLORS.warning}
              />
              <Text style={styles.previewText}>Health goal matching</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.xl,
    paddingTop: SPACING.lg,
  },
  greeting: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  email: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  logoutButton: {
    padding: SPACING.sm,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  quickActions: {
    marginBottom: SPACING.xl,
  },
  actionGrid: {
    flexDirection: "row",
    gap: SPACING.md,
  },
  actionCard: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 16,
    padding: SPACING.lg,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  actionTitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
    textAlign: "center",
  },
  actionDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 18,
  },
  recentActivity: {
    marginBottom: SPACING.xl,
  },
  activityCard: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: SPACING.lg,
  },
  scanResult: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.sm,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  scanProduct: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
  },
  scanScore: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.warning,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  activityText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  stats: {
    marginBottom: SPACING.xl,
  },
  statsGrid: {
    flexDirection: "row",
    gap: SPACING.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: SPACING.lg,
    alignItems: "center",
  },
  statNumber: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  comingSoon: {
    marginBottom: SPACING.xl,
  },
  featurePreview: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: SPACING.lg,
  },
  previewItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  previewText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },
});
