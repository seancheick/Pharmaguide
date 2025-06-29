// src/screens/home/HomeScreen.tsx
import React, { useCallback } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { COLORS, SPACING } from '../../constants';
import { useAuth } from '../../hooks/useAuth';
import { useNewHealthProfile } from '../../hooks/useNewHealthProfile';
import { useHomeData } from '../../hooks/useHomeData';
import { useStackStore } from '../../stores/stackStore';
import {
  HomeHeader,
  UnifiedGamificationCard,
  RecentScansCarousel,
  DailyTips,
} from '../../components/home';
import { ProductSearchBar } from '../../components/search';
import { ScreenErrorBoundary } from '../../components/common/ScreenErrorBoundary';

export const HomeScreen = React.memo(() => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { profile: healthProfile } = useNewHealthProfile();
  const { recentScans, gameStats, loading, refreshing, refreshData } = useHomeData();
  const { stack } = useStackStore();

  // Load data when screen focuses
  useFocusEffect(
    useCallback(() => {
      refreshData();
    }, [refreshData])
  );

  // Navigation handlers
  const handleScanProduct = useCallback(() => {
    navigation.navigate('Scan' as never);
  }, [navigation]);

  const handleScanPress = useCallback((scan: { id: string; name: string }) => {
    // Navigate to scan details or analysis screen
    console.log('View scan details:', scan.id);
  }, []);

  const handleHelpfulClick = useCallback((scanId: string) => {
    // Handle helpful feedback
    console.log('Helpful clicked for scan:', scanId);
  }, []);

  // Search handler - navigate to Search screen with query
  const handleSearch = useCallback((query: string) => {
    navigation.navigate('Search', { initialQuery: query });
  }, [navigation]);

  // Get user's display name with debugging
  const userName = React.useMemo(() => {
    console.log('🏠 HomeScreen - Health Profile Debug:', {
      hasHealthProfile: !!healthProfile,
      hasDemographics: !!healthProfile?.demographics,
      displayName: healthProfile?.demographics?.displayName,
      userEmail: user?.email,
      fallbackName: user?.email?.split('@')[0],
    });

    return (
      healthProfile?.demographics?.displayName ||
      user?.email?.split('@')[0] ||
      'User'
    );
  }, [healthProfile, user]);

  if (loading) {
    return (
      <ScreenErrorBoundary screenName="HomeScreen">
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        </SafeAreaView>
      </ScreenErrorBoundary>
    );
  }

  return (
    <ScreenErrorBoundary screenName="HomeScreen">
      <SafeAreaView style={styles.container}>
        <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshData}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Header - Keep unchanged as requested */}
        <HomeHeader userName={userName} />

        {/* Search Bar - Added right below HomeHeader */}
        <ProductSearchBar
          onSearchPress={handleSearch}
          placeholder="Search supplements, vitamins, medications..."
        />

        {/* Unified Gamification Card */}
        <UnifiedGamificationCard
          gameStats={gameStats}
          stack={stack}
          stackAnalysis={null}
          onUpgradePress={() => console.log('Upgrade pressed')}
          showUpgradePrompt={false}
        />

        {/* Recent Scans Carousel */}
        <RecentScansCarousel
          recentScans={recentScans}
          loading={loading}
          onScanPress={handleScanPress}
          onScanAnother={handleScanProduct}
          onHelpfulClick={handleHelpfulClick}
        />

        {/* Daily Tips */}
        <DailyTips />
      </ScrollView>
    </SafeAreaView>
    </ScreenErrorBoundary>
  );
});

// Add display name for React DevTools
HomeScreen.displayName = 'HomeScreen';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
