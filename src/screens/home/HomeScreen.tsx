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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import { useHomeData } from '../../hooks/useHomeData';
import { useStackStore } from '../../stores/stackStore';
import {
  HomeHeader,
  StatsDashboard,
  RecentScansCarousel,
  QuickActions,
} from '../../components/home';
import { ProductSearchBar } from '../../components/search';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';

interface RecentScan {
  id: string;
  name: string;
  brand: string;
  imageUrl?: string;
  score: number;
  hasInteraction: boolean;
  scannedAt: string;
  evidence?: 'A' | 'B' | 'C' | 'D';
}

const HomeScreenComponent = React.memo(() => {
  const navigation = useNavigation();
  const { user, loading: authLoading } = useAuth();
  const { stack } = useStackStore();
  const {
    recentScans,
    gameStats,
    loading,
    refreshing,
    refreshData,
    addRecentScan,
  } = useHomeData();

  // UI state
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  // Navigation handlers
  const handleScanProduct = () => navigation.navigate('Scan' as never);
  const handleAIConsult = () => navigation.navigate('AI' as never);
  const handleStackAnalysis = () => navigation.navigate('Stack' as never);
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
  const handleHelpfulClick = (supplement: any, isHelpful: boolean) => {
    // TODO: Implement helpful feedback
    console.log('Helpful feedback:', supplement.id, isHelpful);
  };
  const handleSearchPress = (query: string) => {
    console.log('Search pressed:', query);
    navigation.navigate('Search' as never, { initialQuery: query } as never);
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
          userName={user?.profile?.firstName}
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

        {/* Stats Dashboard */}
        <StatsDashboard
          gameStats={gameStats}
          onUpgradePress={handleUpgradePress}
          showUpgradePrompt={user?.is_anonymous}
        />

        {/* Quick Actions */}
        <QuickActions
          onScanPress={handleScanProduct}
          onAIChatPress={handleAIConsult}
          onStackPress={handleStackAnalysis}
          onSearchPress={() => navigation.navigate('Search' as never)}
          stackItemCount={stack.length}
        />

        {/* Recent Scans Carousel */}
        <RecentScansCarousel
          recentScans={recentScans}
          loading={false}
          onScanPress={handleScanPress}
          onScanAnother={handleScanProduct}
          onHelpfulClick={handleHelpfulClick}
        />
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
                  navigation.reset({
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
