// src/screens/stack/MyStackScreen.tsx

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackScreenProps } from '../../types/navigation';
import {
  StackEmptyState,
  LoadingFailedEmptyState,
} from '../../components/common/EmptyState';
import { useToast } from '../../hooks/useToast';
import { useStackStore } from '../../stores/stackStore';
import { useStackAnalysis } from '../../hooks/useStackAnalysis';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants';
import { CustomFAB } from '../../components/common/CustomFAB';
import { StackItemDetailModal } from '../../components/stack/StackItemDetailModal';
import { StackStatistics } from '../../components/stack/StackStatistics';
import { StackItemRenderer } from '../../components/stack/StackItemRenderer';
import { InteractionDisplay } from '../../components/stack/InteractionDisplay';
import {
  StackFilters,
  SortOption,
  FilterOption,
} from '../../components/stack/StackFilters';
import type { UserStack } from '../../types';

export function MyStackScreen() {
  const navigation = useNavigation<StackScreenProps['navigation']>();
  const { showSuccess, showError } = useToast();
  const {
    stack,
    removeFromStack,
    updateStack,
    loadStack,
    initialized,
    loading: storeLoading,
    error: storeError,
  } = useStackStore();

  // Use our new analysis hook
  const { analysis, analyzing, getRiskColor } = useStackAnalysis({
    stack,
    initialized,
    storeLoading,
  });

  // UI state
  const [selectedItem, setSelectedItem] = useState<UserStack | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');

  // Load stack when component mounts or store is not initialized
  useEffect(() => {
    if (!initialized) {
      loadStack();
    }
  }, [initialized, loadStack]);

  // Analysis is now handled by useStackAnalysis hook

  // Product mapping is now handled by useStackAnalysis hook

  // Analysis logic moved to useStackAnalysis hook

  // Enhanced item interaction handlers
  const handleItemPress = useCallback((item: UserStack) => {
    setSelectedItem(item);
    setShowDetailModal(true);
  }, []);

  const handleUpdateItem = useCallback(
    async (itemId: string, updates: Partial<UserStack>) => {
      try {
        await updateStack(itemId, updates);
        showSuccess('Item updated successfully');
      } catch (error: any) {
        showError(error.message || 'Failed to update item');
      }
    },
    [updateStack, showSuccess, showError]
  );

  const handleRemoveItem = useCallback(
    (itemToRemove: UserStack) => {
      Alert.alert(
        'Remove from Stack',
        `Are you sure you want to remove ${itemToRemove.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: async () => {
              try {
                await removeFromStack(itemToRemove.id);
                showSuccess(`${itemToRemove.name} removed from stack`);
              } catch (error: any) {
                showError(
                  error.message || 'Could not remove item. Please try again.'
                );
              }
            },
          },
        ]
      );
    },
    [removeFromStack, showSuccess, showError]
  );

  const handleRemoveItemFromModal = useCallback(
    async (itemId: string) => {
      try {
        await removeFromStack(itemId);
      } catch (error: any) {
        throw new Error(error.message || 'Failed to remove item');
      }
    },
    [removeFromStack]
  );

  // Sorting and filtering logic
  const filteredAndSortedStack = useMemo(() => {
    let filtered = stack;

    // Apply filter
    if (filterBy !== 'all') {
      filtered = stack.filter(item => item.type === filterBy);
    }

    // Apply sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'brand':
          return (a.brand || '').localeCompare(b.brand || '');
        case 'type':
          return a.type.localeCompare(b.type);
        case 'dateAdded':
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        default:
          return 0;
      }
    });

    return sorted;
  }, [stack, sortBy, filterBy]);

  // getRiskColor moved to useStackAnalysis hook

  // Stack item rendering moved to StackItemRenderer component

  // Show loading state if either the store is loading or analysis is in progress
  const isLoading = useMemo(
    () => !initialized || analyzing,
    [initialized, analyzing]
  );

  // Handle retry for loading errors
  const handleRetryLoad = useCallback(async () => {
    try {
      await loadStack();
    } catch (error: any) {
      showError('Failed to load stack. Please try again.');
    }
  }, [loadStack, showError]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {storeError ? (
        <LoadingFailedEmptyState
          onRetry={handleRetryLoad}
          error="Failed to load your stack"
        />
      ) : isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>
            {analyzing ? 'Analyzing interactions...' : 'Loading your stack...'}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={{ paddingBottom: SPACING.xl * 4 }}
        >
          {/* Stack Statistics */}
          {stack.length > 0 && (
            <StackStatistics stack={stack} analysis={analysis} />
          )}

          {/* Stack Safety Overview */}
          {analysis &&
            (analysis.overallRiskLevel !== 'NONE' ||
              (analysis.nutrientWarnings &&
                analysis.nutrientWarnings.length > 0)) && (
              <View
                style={[
                  styles.safetyAlert,
                  {
                    borderColor: getRiskColor(analysis.overallRiskLevel),
                    borderWidth: 2,
                    borderLeftWidth: 8,
                    backgroundColor: `${getRiskColor(
                      analysis.overallRiskLevel
                    )}10`, // Light tint of risk color
                  },
                ]}
              >
                <MaterialIcons
                  name="warning"
                  size={24}
                  color={getRiskColor(analysis.overallRiskLevel)}
                />
                <Text
                  style={[
                    styles.alertTitle,
                    { color: getRiskColor(analysis.overallRiskLevel) },
                  ]}
                >
                  {analysis.overallRiskLevel !== 'NONE'
                    ? `${analysis.interactions.length} Interaction(s) Detected`
                    : 'Nutrient Overload Detected'}
                </Text>
              </View>
            )}

          {/* Stack Filters and Items */}
          <StackFilters
            sortBy={sortBy}
            filterBy={filterBy}
            onSortChange={setSortBy}
            onFilterChange={setFilterBy}
            itemCount={filteredAndSortedStack.length}
          />

          <View style={styles.section}>
            {filteredAndSortedStack.length === 0 ? (
              stack.length === 0 ? (
                <StackEmptyState
                  onAddItem={() => navigation.navigate('Scan')}
                  onLearnMore={() => navigation.navigate('HelpScreen')}
                />
              ) : (
                <View style={styles.emptyState}>
                  <MaterialIcons
                    name="filter-list"
                    size={48}
                    color={COLORS.textSecondary}
                  />
                  <Text style={styles.emptyText}>
                    No items match your current filter
                  </Text>
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => setFilterBy('all')}
                  >
                    <Text style={styles.addButtonText}>Clear Filter</Text>
                  </TouchableOpacity>
                </View>
              )
            ) : (
              <View style={styles.stackList}>
                {filteredAndSortedStack.map(item => (
                  <StackItemRenderer
                    key={item.id}
                    item={item}
                    onItemPress={handleItemPress}
                    onRemovePress={handleRemoveItem}
                  />
                ))}
              </View>
            )}
          </View>

          {/* Interaction Display Component */}
          {analysis && (
            <InteractionDisplay
              analysis={analysis}
              getRiskColor={getRiskColor}
            />
          )}
        </ScrollView>
      )}

      {/* Add Item FAB */}
      <CustomFAB onPress={() => navigation.navigate('Scan')} />

      {/* Item Detail Modal */}
      <StackItemDetailModal
        visible={showDetailModal}
        item={selectedItem}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedItem(null);
        }}
        onUpdate={handleUpdateItem}
        onRemove={handleRemoveItemFromModal}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    flexGrow: 1,
    // SafeAreaView now handles top padding
  },
  safetyAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
    borderRadius: 12,
  },
  alertTitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.medium,
    marginLeft: SPACING.sm,
    flexShrink: 1, // Allow text to wrap
  },
  section: {
    paddingHorizontal: SPACING.md, // Adjust to use horizontal padding for sections
    paddingVertical: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 8,
  },
  addButtonText: {
    color: COLORS.background,
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  stackList: {
    // No specific styles needed here, children will handle spacing
  },
  // Stack item styles moved to StackItemRenderer component
  // Interaction styles moved to InteractionDisplay component

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
  },
});
