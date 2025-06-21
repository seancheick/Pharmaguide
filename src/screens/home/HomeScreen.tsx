// src/screens/home/HomeScreen.tsx
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS, SPACING, TYPOGRAPHY } from "../../constants";
import { useAuth } from "../../hooks/useAuth";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Button } from "../../components/common";
import { gamificationService } from "../../services/gamification/gamificationService"; // Ensure this import is present

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH * 0.42;

interface RecentScan {
  id: string;
  name: string;
  brand: string;
  imageUrl?: string;
  score: number;
  hasInteraction: boolean;
  scannedAt: string;
  evidence?: "A" | "B" | "C" | "D";
}

export const HomeScreen = React.memo(() => {
  const navigation = useNavigation();
  const { user, loading: authLoading } = useAuth();
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  // New state for gamification stats
  const [gameStats, setGameStats] = useState({
    points: 0,
    level: 1,
    levelTitle: "Health Novice",
    currentStreak: 0,
    longestStreak: 0,
  });

  // Navigation handlers
  const handleScanProduct = () => navigation.navigate("Scan" as never);
  const handleAIConsult = () => navigation.navigate("AI" as never);
  const handleStackAnalysis = () => navigation.navigate("Stack" as never);

  // Load data when screen focuses
  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
      loadGameStats(); // Load game stats on focus
    }, [user?.id]) // Reload if user changes
  );

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const scansData = await AsyncStorage.getItem("pharmaguide_recent_scans");
      setRecentScans(scansData ? JSON.parse(scansData).slice(0, 10) : []);

      // The streak and totalPoints states are now managed by gameStats
      // const streakData = await AsyncStorage.getItem("pharmaguide_user_streak");
      // setStreak(streakData ? JSON.parse(streakData).count || 0 : 0);

      // const pointsData = await AsyncStorage.getItem("pharmaguide_user_points");
      // setTotalPoints(pointsData ? JSON.parse(pointsData) || 0 : 0);
    } catch (error) {
      console.error("Error loading dashboard:", error);
      setRecentScans([]);
      // setStreak(0);
      // setTotalPoints(0);
    } finally {
      setLoading(false);
    }
  };

  const loadGameStats = async () => {
    try {
      const progress = await gamificationService.getUserProgress();
      setGameStats({
        points: progress.points,
        level: progress.level,
        levelTitle: progress.levelTitle,
        currentStreak: progress.streak.current,
        longestStreak: progress.streak.longest,
      });
    } catch (error) {
      console.error("Error loading game stats:", error);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return COLORS.success;
    if (score >= 60) return COLORS.secondary;
    if (score >= 40) return COLORS.warning;
    return COLORS.error;
  };

  const getEvidenceColor = (level: string) => {
    const colors: { [key: string]: string } = {
      A: "#10B981",
      B: "#F59E0B",
      C: "#EF4444",
      D: "#6B7280",
    };
    return colors[level] || COLORS.gray400;
  };

  const renderRecentScan = ({ item }: { item: RecentScan }) => (
    <TouchableOpacity
      style={styles.scanCard}
      activeOpacity={0.8}
      onPress={() => console.log("View scan details:", item.id)}
    >
      {item.imageUrl ? (
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.scanImage}
          resizeMode="contain"
        />
      ) : (
        <View style={styles.scanImagePlaceholder}>
          <Ionicons name="cube-outline" size={32} color={COLORS.gray400} />
        </View>
      )}
      <View style={styles.scanInfo}>
        <Text style={styles.scanName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.scanBrand} numberOfLines={1}>
          {item.brand}
        </Text>
        <View style={styles.scanFooter}>
          <View
            style={[
              styles.scoreCircle,
              { backgroundColor: getScoreColor(item.score) },
            ]}
          >
            <Text style={styles.scoreText}>{item.score}</Text>
          </View>
          {item.hasInteraction && (
            <View style={styles.interactionBadge}>
              <MaterialIcons
                name="warning"
                size={12}
                color={COLORS.background}
              />
            </View>
          )}
          {item.evidence && (
            <View
              style={[
                styles.evidenceBadge,
                { backgroundColor: getEvidenceColor(item.evidence) },
              ]}
            >
              <Text style={styles.evidenceText}>{item.evidence}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const keyExtractor = (item: RecentScan) => item.id;

  const renderLoadingSkeleton = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.recentScansContainer}
    >
      {[1, 2, 3].map((index) => (
        <View key={index} style={styles.scanCardSkeleton}>
          <View style={styles.scanImagePlaceholderSkeleton} />
          <View style={styles.scanNameSkeleton} />
          <View style={styles.scanBrandSkeleton} />
          <View style={styles.scanFooterSkeleton} />
        </View>
      ))}
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      {loading || authLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>
                Hello
                {user?.profile?.firstName ? `, ${user.profile.firstName}` : ""}!
                👋
              </Text>
              <Text style={styles.subtitle}>Your health journey continues</Text>
            </View>
            <TouchableOpacity style={styles.notificationButton}>
              <Ionicons
                name="notifications-outline"
                size={24}
                color={COLORS.textPrimary}
              />
            </TouchableOpacity>
          </View>

          {/* Guest User Banner */}
          {user?.is_anonymous && (
            <TouchableOpacity
              style={styles.guestBanner}
              onPress={() => setShowUpgradePrompt(true)}
              activeOpacity={0.9}
            >
              <View style={styles.guestBannerContent}>
                <Ionicons
                  name="cloud-offline-outline"
                  size={24}
                  color={COLORS.primary}
                  style={styles.guestBannerIcon}
                />
                <View style={styles.guestBannerTextContainer}>
                  <Text style={styles.guestBannerTitle}>
                    Save your progress
                  </Text>
                  <Text style={styles.guestBannerSubtitle}>
                    Sign in to sync across devices
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={COLORS.primary}
                />
              </View>
            </TouchableOpacity>
          )}

          {/* Gamification Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Ionicons name="flame" size={28} color={COLORS.warning} />
              <Text style={styles.statNumber}>{gameStats.currentStreak}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="star" size={28} color={COLORS.accent} />
              <Text style={styles.statNumber}>{gameStats.points}</Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="trophy" size={28} color={COLORS.success} />
              <Text style={styles.statNumber}>{gameStats.level}</Text>
              <Text style={styles.statLabel}>{gameStats.levelTitle}</Text>
            </View>
          </View>

          {/* Primary Action: Stack Analysis */}
          <TouchableOpacity
            style={styles.primaryAction}
            onPress={handleStackAnalysis}
            activeOpacity={0.9}
          >
            <View style={styles.primaryActionContent}>
              <View style={styles.primaryActionIcon}>
                <MaterialIcons
                  name="analytics"
                  size={32}
                  color={COLORS.white}
                />
              </View>
              <View style={styles.primaryActionText}>
                <Text style={styles.primaryActionTitle}>
                  Stack Safety Analysis
                </Text>
                <Text style={styles.primaryActionSubtitle}>
                  Check all interactions in your stack
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={COLORS.white} />
            </View>
          </TouchableOpacity>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.actionCard, styles.scanActionCard]}
              onPress={handleScanProduct}
              activeOpacity={0.8}
            >
              <View style={styles.actionIconWrapper}>
                <Ionicons name="scan" size={28} color={COLORS.white} />
              </View>
              <Text style={styles.actionTitle}>Scan</Text>
              <Text style={styles.actionDescription}>New Product</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionCard, styles.aiActionCard]}
              onPress={handleAIConsult}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.actionIconWrapper,
                  { backgroundColor: "rgba(255,255,255,0.2)" },
                ]}
              >
                <Ionicons
                  name="chatbubble-ellipses"
                  size={28}
                  color={COLORS.white}
                />
              </View>
              <Text style={styles.actionTitle}>AI Chat</Text>
              <Text style={styles.actionDescription}>Ask Expert</Text>
            </TouchableOpacity>
          </View>

          {/* Recent Scans */}
          <View style={styles.recentSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Scans</Text>
              <TouchableOpacity onPress={() => console.log("View all scans")}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            {loading ? (
              renderLoadingSkeleton()
            ) : recentScans.length > 0 ? (
              <FlatList
                data={recentScans}
                renderItem={renderRecentScan}
                keyExtractor={keyExtractor}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.recentScansContainer}
              />
            ) : (
              <View style={styles.emptyState}>
                <Ionicons
                  name="scan-outline"
                  size={48}
                  color={COLORS.gray300}
                />
                <Text style={styles.emptyStateText}>No scans yet</Text>
                <Text style={styles.emptyStateSubtext}>
                  Scan your first product to get started
                </Text>
              </View>
            )}
          </View>

          {/* Daily Tip */}
          <View style={styles.tipCard}>
            <View style={styles.tipHeader}>
              <Ionicons name="bulb" size={24} color={COLORS.accent} />
              <Text style={styles.tipTitle}>Daily Health Tip</Text>
            </View>
            <Text style={styles.tipText}>
              Did you know? Taking iron with vitamin C can increase absorption
              by up to 300%! Try pairing your iron supplement with orange juice.
            </Text>
          </View>
        </ScrollView>
      )}

      {/* Upgrade Modal */}
      <Modal
        visible={showUpgradePrompt}
        transparent
        animationType="slide"
        onRequestClose={() => setShowUpgradePrompt(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowUpgradePrompt(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHandle} />

              <View style={styles.modalIconContainer}>
                <View style={styles.modalIconBackground}>
                  <Ionicons
                    name="cloud-upload"
                    size={32}
                    color={COLORS.primary}
                  />
                </View>
              </View>

              <Text style={styles.modalTitle}>Save Your Progress</Text>
              <Text style={styles.modalText}>
                Create an account to:
                {"\n"}• Sync your data across all devices
                {"\n"}• Save your scan history permanently
                {"\n"}• Access personalized health insights
                {"\n"}• Track your health goals and progress
              </Text>

              <TouchableOpacity
                style={styles.modalPrimaryButton}
                onPress={() => {
                  setShowUpgradePrompt(false);
                  navigation.reset({
                    index: 0,
                    routes: [{ name: "Welcome" }],
                  });
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.modalPrimaryButtonText}>
                  Sign in or Create Account
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSecondaryButton}
                onPress={() => setShowUpgradePrompt(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalSecondaryButtonText}>Maybe Later</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingBottom: SPACING.xl * 2 },
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  greeting: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.backgroundSecondary,
    justifyContent: "center",
    alignItems: "center",
  },

  // Guest Banner Styles
  guestBanner: {
    backgroundColor: COLORS.backgroundSecondary,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    borderRadius: 16,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  guestBannerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  guestBannerIcon: {
    marginRight: SPACING.md,
  },
  guestBannerTextContainer: {
    flex: 1,
  },
  guestBannerTitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  guestBannerSubtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
  },

  // Stats Container
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    gap: SPACING.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 16,
    padding: SPACING.md,
    alignItems: "center",
  },
  statNumber: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.xs,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  // Primary Action
  primaryAction: {
    backgroundColor: COLORS.primary,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.xl,
    borderRadius: 20,
    padding: SPACING.lg,
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  primaryActionContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  primaryActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.md,
  },
  primaryActionText: { flex: 1 },
  primaryActionTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.white,
  },
  primaryActionSubtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },

  // Quick Actions
  quickActions: {
    flexDirection: "row",
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  actionCard: {
    flex: 1,
    borderRadius: 20,
    padding: SPACING.lg,
    alignItems: "center",
    minHeight: 120,
  },
  scanActionCard: { backgroundColor: COLORS.secondary },
  aiActionCard: { backgroundColor: COLORS.accent },
  actionIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  actionTitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.white,
  },
  actionDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },

  // Recent Scans
  recentSection: { marginTop: SPACING.xl },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
  },
  seeAll: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  recentScansContainer: { paddingHorizontal: SPACING.lg },
  scanCard: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 16,
    padding: SPACING.md,
    marginRight: SPACING.md,
    width: CARD_WIDTH,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  scanImage: {
    width: "100%",
    height: 100,
    borderRadius: 12,
    marginBottom: SPACING.sm,
  },
  scanImagePlaceholder: {
    width: "100%",
    height: 100,
    borderRadius: 12,
    backgroundColor: COLORS.gray100,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  scanInfo: { flex: 1 },
  scanName: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  scanBrand: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  scanFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  scoreCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  scoreText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.background,
  },
  interactionBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.warning,
    justifyContent: "center",
    alignItems: "center",
  },
  evidenceBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: "auto",
  },
  evidenceText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.background,
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    paddingVertical: SPACING.xl * 2,
  },
  emptyStateText: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  emptyStateSubtext: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textTertiary,
    marginTop: SPACING.xs,
  },

  // Tip Card
  tipCard: {
    backgroundColor: COLORS.backgroundSecondary,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.xl,
    borderRadius: 16,
    padding: SPACING.lg,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
  },
  tipHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  tipTitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
  },
  tipText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.xl,
    paddingBottom: SPACING.xl * 2,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.gray300,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: SPACING.lg,
  },
  modalIconContainer: {
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  modalIconBackground: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.backgroundSecondary,
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    textAlign: "center",
  },
  modalText: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  modalPrimaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.sm,
  },
  modalPrimaryButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    textAlign: "center",
  },
  modalSecondaryButton: {
    paddingVertical: SPACING.md,
  },
  modalSecondaryButtonText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.sizes.base,
    textAlign: "center",
  },

  // Skeleton Styles
  scanCardSkeleton: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 16,
    padding: SPACING.md,
    marginRight: SPACING.md,
    width: CARD_WIDTH,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  scanImagePlaceholderSkeleton: {
    width: "100%",
    height: 100,
    borderRadius: 12,
    backgroundColor: COLORS.gray200,
    marginBottom: SPACING.sm,
  },
  scanNameSkeleton: {
    width: "80%",
    height: 20,
    borderRadius: 4,
    backgroundColor: COLORS.gray200,
    marginBottom: SPACING.xs,
  },
  scanBrandSkeleton: {
    width: "60%",
    height: 16,
    borderRadius: 4,
    backgroundColor: COLORS.gray200,
    marginBottom: SPACING.sm,
  },
  scanFooterSkeleton: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    width: "70%",
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.gray200,
  },
});
