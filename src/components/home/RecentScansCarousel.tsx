// src/components/home/RecentScansCarousel.tsx
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ViewToken,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';
import { SupplementCard } from './SupplementCard';

interface RecentScan {
  id: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  score: number;
  hasInteraction: boolean;
  scannedAt: string;
  evidence?: 'A' | 'B' | 'C' | 'D';
  dosage?: string;
  description?: string;
}

interface RecentScansCarouselProps {
  recentScans: RecentScan[];
  loading: boolean;
  onScanPress: (scan: RecentScan) => void;
  onScanAnother: () => void;
  onHelpfulClick?: (supplement: any, isHelpful: boolean) => void;
}

export const RecentScansCarousel: React.FC<RecentScansCarouselProps> = ({
  recentScans,
  loading,
  onScanPress,
  onScanAnother,
  onHelpfulClick,
}) => {
  // Visibility tracking for performance optimization
  const [visibleItems, setVisibleItems] = useState(new Set<string>());

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const newVisibleItems = new Set(
        viewableItems.map(item => item.item?.id).filter(Boolean)
      );
      setVisibleItems(newVisibleItems);
    },
    []
  );

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50, // Item is considered visible when 50% is shown
    minimumViewTime: 100, // Minimum time item must be visible
  };
  const convertScanToSupplement = (scan: RecentScan) => ({
    id: scan.id,
    name: scan.name,
    brand: scan.brand,
    imageUrl: scan.imageUrl,
    rating: scan.score / 20, // Convert 0-100 score to 0-5 rating
    score: scan.score,
    riskStatus: scan.hasInteraction
      ? scan.score < 60
        ? 'High Risk'
        : 'Caution'
      : ('Safe' as 'Safe' | 'Caution' | 'High Risk'),
    evidence: scan.evidence,
    dosage: scan.dosage,
    description: scan.description,
  });

  const renderScanCard = ({ item }: { item: RecentScan }) => {
    const supplement = convertScanToSupplement(item);

    return (
      <SupplementCard
        supplement={supplement}
        onPress={() => onScanPress(item)}
        onHelpfulClick={onHelpfulClick}
      />
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="scan-outline" size={48} color={COLORS.textSecondary} />
      </View>
      <Text style={styles.emptyTitle}>No recent scans</Text>
      <Text style={styles.emptySubtitle}>
        Start scanning supplements to see them here
      </Text>
      <TouchableOpacity
        style={styles.scanButton}
        onPress={onScanAnother}
        activeOpacity={0.8}
      >
        <Ionicons name="scan" size={20} color={COLORS.white} />
        <Text style={styles.scanButtonText}>Scan Now</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLoadingSkeleton = () => (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3].map(index => (
        <View key={index} style={styles.skeletonCard}>
          <View style={styles.skeletonHeader}>
            <View style={styles.skeletonTitle} />
            <View style={styles.skeletonImage} />
          </View>
          <View style={styles.skeletonRating} />
          <View style={styles.skeletonStatus} />
          <View style={styles.skeletonDescription} />
        </View>
      ))}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Recent Scans</Text>
        </View>
        {renderLoadingSkeleton()}
      </View>
    );
  }

  // Debug log to check data
  console.log('Recent scans passed to carousel:', recentScans);

  // Limit carousel to 10 items
  const carouselScans = recentScans.slice(0, 10);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recent Scans</Text>
        {recentScans.length > 0 && (
          <TouchableOpacity onPress={onScanAnother}>
            <Text style={styles.seeAllText}>Scan Another</Text>
          </TouchableOpacity>
        )}
        {recentScans.length > 10 && (
          <TouchableOpacity onPress={() => alert('Show more scans (TODO: implement modal/screen)')}>
            <Text style={styles.seeAllText}>View More</Text>
          </TouchableOpacity>
        )}
      </View>

      {recentScans.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={carouselScans}
          renderItem={renderScanCard}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          snapToInterval={320 + SPACING.sm} // Card width + margin
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
            length: 320 + SPACING.sm,
            offset: (320 + SPACING.sm) * index,
            index,
          })}
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
  title: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  seeAllText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  listContainer: {
    paddingLeft: SPACING.lg,
    paddingRight: SPACING.sm,
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
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    gap: SPACING.sm,
  },
  scanButtonText: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.white,
  },
  skeletonContainer: {
    flexDirection: 'row',
    paddingLeft: SPACING.lg,
    gap: SPACING.sm,
  },
  skeletonCard: {
    width: 320,
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
