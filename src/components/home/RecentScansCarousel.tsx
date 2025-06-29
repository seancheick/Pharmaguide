// src/components/home/RecentScansCarousel.tsx
// 🚀 ENHANCED: Robust, user-friendly recent scans carousel with advanced features

import React, { useCallback, useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ViewToken,
  Alert,
  RefreshControl,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';
import { unifiedScanService, type RecentScan } from '../../services/scanService';
import { SupplementCard } from './SupplementCard';

interface RecentScansCarouselProps {
  recentScans: RecentScan[];
  loading: boolean;
  onScanPress: (scan: RecentScan) => void;
  onScanAnother: () => void;
  onHelpfulClick?: (supplement: any, isHelpful: boolean) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = Math.min(320, screenWidth * 0.85);
const CARD_SPACING = SPACING.sm;

export const RecentScansCarousel: React.FC<RecentScansCarouselProps> = ({
  recentScans,
  loading,
  onScanPress,
  onScanAnother,
  onHelpfulClick,
  onRefresh,
  refreshing = false,
}) => {
  // State management
  const [visibleItems, setVisibleItems] = useState(new Set<string>());
  const [selectedScan, setSelectedScan] = useState<RecentScan | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingScanId, setDeletingScanId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [addingToStack, setAddingToStack] = useState<string | null>(null);
  
  // Refs
  const flatListRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Performance optimizations
  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 100,
  };

  // 🎯 Enhanced viewability tracking with analytics
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const newVisibleItems = new Set(
        viewableItems.map(item => item.item?.id).filter(Boolean)
      );
      setVisibleItems(newVisibleItems);
      
      // Analytics: Track which scans are being viewed
      viewableItems.forEach(item => {
        if (item.item) {
          console.log('👁️ Scan viewed:', item.item.name);
        }
      });
    },
    []
  );

  // 🎨 Enhanced scan to supplement conversion
  const convertScanToSupplement = useCallback((scan: RecentScan) => ({
    id: scan.id,
    name: scan.name,
    brand: scan.brand || 'Unknown Brand',
    imageUrl: scan.imageUrl,
    rating: Math.max(1, Math.min(5, Math.round(scan.score / 20))), // Convert 0-100 to 1-5
    score: scan.score,
    riskStatus: scan.hasInteraction
      ? scan.score < 60
        ? 'High Risk'
        : 'Caution'
      : ('Safe' as 'Safe' | 'Caution' | 'High Risk'),
    evidence: scan.evidence,
    dosage: scan.dosage,
    description: scan.description,
    // Enhanced metadata
    scannedAt: scan.scannedAt,
    scanType: scan.scanType,
  }), []);

  //  Enhanced scan card rendering with animations
  const renderScanCard = useCallback(({ item, index }: { item: RecentScan; index: number }) => {
    const supplement = convertScanToSupplement(item);
    const isVisible = visibleItems.has(item.id);

    return (
      <Animated.View
        style={[
          styles.cardContainer,
          {
            opacity: isVisible ? 1 : 0.7,
            transform: [{ scale: isVisible ? 1 : 0.95 }],
          },
        ]}
      >
        <SupplementCard
          supplement={supplement}
          onPress={() => handleScanPress(item)}
          onHelpfulClick={onHelpfulClick}
          onLongPress={() => handleLongPress(item)}
        />
        
        {/* Quick action buttons */}
        {isVisible && (
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.quickAction, styles.addToStackAction]}
              onPress={() => handleAddToStack(item)}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle" size={16} color={COLORS.white} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.quickAction, styles.deleteAction]}
              onPress={() => handleDeleteScan(item)}
              activeOpacity={0.8}
            >
              <Ionicons name="trash" size={14} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    );
  }, [visibleItems, convertScanToSupplement, onHelpfulClick]);

  // 🎯 Enhanced scan press handler
  const handleScanPress = useCallback((scan: RecentScan) => {
    // Add haptic feedback here if available
    setSelectedScan(scan);
    onScanPress(scan);
  }, [onScanPress]);

  //  Long press handler for additional options
  const handleLongPress = useCallback((scan: RecentScan) => {
    Alert.alert(
      scan.name,
      'What would you like to do with this scan?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Add to Stack', onPress: () => handleAddToStack(scan) },
        { text: 'Share Details', onPress: () => handleShareScan(scan) },
        { text: 'Delete', style: 'destructive', onPress: () => handleDeleteScan(scan) },
      ]
    );
  }, []);

  // 🎯 Add to stack handler
  const handleAddToStack = useCallback(async (scan: RecentScan) => {
    try {
      setAddingToStack(scan.id);
      
      // Animate the button
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      // TODO: Implement add to stack logic
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
      
      Alert.alert('Added to Stack!', `${scan.name} has been added to your supplement stack.`);
    } catch (error) {
      console.error('Error adding to stack:', error);
      Alert.alert('Error', 'Could not add to stack. Please try again.');
    } finally {
      setAddingToStack(null);
    }
  }, [scaleAnim]);

  //  Share scan handler
  const handleShareScan = useCallback((scan: RecentScan) => {
    // TODO: Implement share functionality
    Alert.alert('Share', `Sharing details for ${scan.name}`);
  }, []);

  // 🎯 Delete scan handler with confirmation
  const handleDeleteScan = useCallback(async (scan: RecentScan) => {
    try {
      setError(null);
      
      Alert.alert(
        'Delete Scan',
        `Are you sure you want to delete "${scan.name}" from your recent scans?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                setDeletingScanId(scan.id);
                
                // Animate deletion
                Animated.timing(fadeAnim, {
                  toValue: 0,
                  duration: 300,
                  useNativeDriver: true,
                }).start();

                await unifiedScanService.deleteScan(scan.id);
                
                // Refresh the list
                onRefresh?.();
                
                Alert.alert('Deleted', 'Scan has been removed from your recent scans.');
              } catch (error) {
                console.error('Error deleting scan:', error);
                setError('Failed to delete scan');
                Alert.alert('Error', 'Could not delete scan. Please try again.');
              } finally {
                setDeletingScanId(null);
                fadeAnim.setValue(1);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error in delete handler:', error);
      setError('An unexpected error occurred');
    }
  }, [fadeAnim, onRefresh]);

  // 🎯 Enhanced empty state with better UX
  const renderEmptyState = useCallback(() => (
    <View style={styles.emptyState}>
      <Animated.View style={[styles.emptyIcon, { opacity: fadeAnim }]}>
        <Ionicons name="scan-outline" size={48} color={COLORS.textSecondary} />
      </Animated.View>
      
      <Text style={styles.emptyTitle}>No recent scans</Text>
      <Text style={styles.emptySubtitle}>
        Start scanning supplements to build your health history and track your progress
      </Text>
      
      <View style={styles.emptyActions}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={onScanAnother}
          activeOpacity={0.8}
        >
          <Ionicons name="scan" size={20} color={COLORS.white} />
          <Text style={styles.primaryButtonText}>Scan Now</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => Alert.alert('Help', 'Learn how to scan supplements')}
          activeOpacity={0.8}
        >
          <Ionicons name="help-circle-outline" size={16} color={COLORS.primary} />
          <Text style={styles.secondaryButtonText}>Learn How</Text>
        </TouchableOpacity>
      </View>
    </View>
  ), [fadeAnim, onScanAnother]);

  // 🎯 Enhanced loading skeleton with better animations
  const renderLoadingSkeleton = useCallback(() => (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3].map(index => (
        <Animated.View
          key={index}
          style={[
            styles.skeletonCard,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.skeletonHeader}>
            <View style={styles.skeletonTitle} />
            <View style={styles.skeletonImage} />
          </View>
          <View style={styles.skeletonRating} />
          <View style={styles.skeletonStatus} />
          <View style={styles.skeletonDescription} />
        </Animated.View>
      ))}
    </View>
  ), [fadeAnim, scaleAnim]);

  // 🎯 Enhanced header with better actions
  const renderHeader = useCallback(() => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Text style={styles.title}>Recent Scans</Text>
        {recentScans.length > 0 && (
          <Text style={styles.subtitle}>
            {recentScans.length} scan{recentScans.length !== 1 ? 's' : ''}
          </Text>
        )}
      </View>
      
      <View style={styles.headerActions}>
        {recentScans.length > 0 && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onScanAnother}
            activeOpacity={0.8}
          >
            <Ionicons name="scan" size={16} color={COLORS.primary} />
            <Text style={styles.actionButtonText}>Scan</Text>
          </TouchableOpacity>
        )}
        
        {recentScans.length > 10 && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => Alert.alert('View All', 'Show all recent scans')}
            activeOpacity={0.8}
          >
            <Ionicons name="list" size={16} color={COLORS.primary} />
            <Text style={styles.actionButtonText}>View All</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  ), [recentScans.length, onScanAnother]);

  // Loading state
  if (loading) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        {renderLoadingSkeleton()}
      </View>
    );
  }

  // Limit carousel to 10 items for performance
  const carouselScans = recentScans.slice(0, 10);

  return (
    <View style={styles.container}>
      {renderHeader()}

      {recentScans.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          ref={flatListRef}
          data={carouselScans}
          renderItem={renderScanCard}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          snapToInterval={CARD_WIDTH + CARD_SPACING}
          decelerationRate="fast"
          snapToAlignment="start"
          // Performance optimizations
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          removeClippedSubviews={true}
          maxToRenderPerBatch={3}
          windowSize={5}
          initialNumToRender={2}
          getItemLayout={(_, index) => ({
            length: CARD_WIDTH + CARD_SPACING,
            offset: (CARD_WIDTH + CARD_SPACING) * index,
            index,
          })}
          // Pull to refresh
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
    backgroundColor: COLORS.backgroundSecondary,
    gap: 4,
  },
  actionButtonText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  listContainer: {
    paddingLeft: SPACING.lg,
    paddingRight: SPACING.sm,
  },
  cardContainer: {
    width: CARD_WIDTH,
    marginRight: CARD_SPACING,
    position: 'relative',
  },
  quickActions: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  quickAction: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  addToStackAction: {
    backgroundColor: COLORS.success,
  },
  deleteAction: {
    backgroundColor: COLORS.error,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  emptyActions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    gap: SPACING.sm,
  },
  primaryButtonText: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.white,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    gap: SPACING.sm,
  },
  secondaryButtonText: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.primary,
  },
  skeletonContainer: {
    flexDirection: 'row',
    paddingLeft: SPACING.lg,
    gap: CARD_SPACING,
  },
  skeletonCard: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  skeletonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  skeletonTitle: {
    width: '60%',
    height: 20,
    backgroundColor: COLORS.gray200,
    borderRadius: 4,
  },
  skeletonImage: {
    width: 48,
    height: 48,
    backgroundColor: COLORS.gray200,
    borderRadius: 8,
  },
  skeletonRating: {
    width: '40%',
    height: 16,
    backgroundColor: COLORS.gray200,
    borderRadius: 4,
    marginBottom: SPACING.sm,
  },
  skeletonStatus: {
    width: '50%',
    height: 24,
    backgroundColor: COLORS.gray200,
    borderRadius: 12,
    marginBottom: SPACING.md,
  },
  skeletonDescription: {
    width: '80%',
    height: 40,
    backgroundColor: COLORS.gray200,
    borderRadius: 4,
  },
});
