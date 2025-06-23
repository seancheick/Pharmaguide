// src/screens/home/HomeScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Modal,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { HomeScreenProps } from '../../types/navigation';
import { useAuth } from '../../hooks/useAuth';
import { useHomeData } from '../../hooks/useHomeData';
import { useStackStore } from '../../stores/stackStore';
import { useStackHealth } from '../../hooks/useStackHealth';
import {
  HomeHeader,
  UnifiedGamificationCard,
  RecentScansCarousel,
  DailyTips,
} from '../../components/home';
import { ProductSearchBar } from '../../components/search';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';

interface RecentScan {
  id: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  score: number;
  hasInteraction: boolean;
  scannedAt: string;
  evidence?: 'A' | 'B' | 'C' | 'D';
}

const HomeScreenComponent = React.memo(function HomeScreenComponent() {
  const navigation = useNavigation<HomeScreenProps['navigation']>();
  const { user, loading: authLoading } = useAuth();

  // Safely get stack data with fallbacks
  const stackStore = useStackStore();
  const stack = stackStore?.stack || [];

  // Only use stack health if stack store is available
  const { analysis: stackAnalysis } = useStackHealth();

  const { recentScans, gameStats, loading, refreshing, refreshData } =
    useHomeData();

  // UI state
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  // Navigation handlers
  const handleScanProduct = () => navigation.navigate('Scan');
  const handleNotificationPress = () => {
    // TODO: Implement notifications
    console.log('Notifications pressed');
  };
  const handleUpgradePress = () => {
    setShowUpgradePrompt(true);
  };
  const handleScanPress = (scan: RecentScan) => {
    // TODO: Navigate to scan details
    console.log('Scan pressed:', scan.id);
  };
  const handleHelpfulClick = (supplement: RecentScan, isHelpful: boolean) => {
    // TODO: Implement helpful feedback
    console.log('Helpful feedback:', supplement.id, isHelpful);
  };
  const handleSearchPress = (query: string) => {
    console.log('Search pressed:', query);
    navigation.navigate('Search', { initialQuery: query });
  };

  // Show loading screen
  if (loading || authLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refreshData} />
        }
      >
        {/* Header */}
        <HomeHeader
          userName={user?.profile?.firstName || undefined}
          onNotificationPress={handleNotificationPress}
          hasUnreadNotifications={false}
        />

        {/* Product Search Bar */}
        <ProductSearchBar
          onSearchPress={handleSearchPress}
          placeholder="Search supplements, vitamins, medications..."
        />

        {/* Guest User Banner */}
        {user?.is_anonymous && (
          <TouchableOpacity
            style={styles.guestBanner}
            onPress={handleUpgradePress}
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
                <Text style={styles.guestBannerTitle}>Save your progress</Text>
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

        {/* Unified Gamification Card */}
        <UnifiedGamificationCard
          gameStats={gameStats}
          stack={stack}
          stackAnalysis={stackAnalysis}
          onUpgradePress={handleUpgradePress}
          showUpgradePrompt={user?.is_anonymous}
        />

        {/* Recent Scans Carousel */}
        <RecentScansCarousel
          recentScans={recentScans}
          loading={false}
          onScanPress={handleScanPress}
          onScanAnother={handleScanProduct}
          onHelpfulClick={handleHelpfulClick}
        />

        {/* Daily Tips */}
        <DailyTips />
      </ScrollView>

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
            onPress={e => e.stopPropagation()}
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
                {'\n'}• Sync your data across all devices
                {'\n'}• Save your scan history permanently
                {'\n'}• Access personalized health insights
                {'\n'}• Track your health goals and progress
              </Text>

              <TouchableOpacity
                style={styles.modalPrimaryButton}
                onPress={() => {
                  setShowUpgradePrompt(false);
                  navigation.getParent()?.reset({
                    index: 0,
                    routes: [{ name: 'Welcome' }],
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
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: SPACING.xl * 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  guestBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
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

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.xl,
    paddingBottom: SPACING.xl * 2,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.gray300,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: SPACING.lg,
  },
  modalIconContainer: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modalIconBackground: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
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
    textAlign: 'center',
  },
  modalSecondaryButton: {
    paddingVertical: SPACING.md,
  },
  modalSecondaryButtonText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.sizes.base,
    textAlign: 'center',
  },
});

// Export the component directly (error boundary temporarily disabled)
export const HomeScreen = HomeScreenComponent;
