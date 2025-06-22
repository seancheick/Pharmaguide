// src/components/stack/StackFilters.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';

export type SortOption = 'name' | 'brand' | 'type' | 'dateAdded';
export type FilterOption = 'all' | 'supplement' | 'medication';

interface StackFiltersProps {
  sortBy: SortOption;
  filterBy: FilterOption;
  onSortChange: (sort: SortOption) => void;
  onFilterChange: (filter: FilterOption) => void;
  itemCount: number;
}

export const StackFilters: React.FC<StackFiltersProps> = ({
  sortBy,
  filterBy,
  onSortChange,
  onFilterChange,
  itemCount,
}) => {
  const [showModal, setShowModal] = useState(false);

  const sortOptions: { value: SortOption; label: string; icon: string }[] = [
    { value: 'name', label: 'Name (A-Z)', icon: 'sort-by-alpha' },
    { value: 'brand', label: 'Brand', icon: 'business' },
    { value: 'type', label: 'Type', icon: 'category' },
    { value: 'dateAdded', label: 'Date Added', icon: 'schedule' },
  ];

  const filterOptions: { value: FilterOption; label: string; icon: string }[] =
    [
      { value: 'all', label: 'All Items', icon: 'inventory' },
      { value: 'supplement', label: 'Supplements', icon: 'fitness-center' },
      { value: 'medication', label: 'Medications', icon: 'medication' },
    ];

  const getSortLabel = () => {
    const option = sortOptions.find(opt => opt.value === sortBy);
    return option?.label || 'Name (A-Z)';
  };

  const getFilterLabel = () => {
    const option = filterOptions.find(opt => opt.value === filterBy);
    return option?.label || 'All Items';
  };

  const getFilterCount = () => {
    if (filterBy === 'all') return itemCount;
    return `${itemCount} filtered`;
  };

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>My Stack</Text>
          <Text style={styles.count}>({getFilterCount()})</Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowModal(true)}
          >
            <MaterialIcons name="tune" size={20} color={COLORS.primary} />
            <Text style={styles.filterButtonText}>Sort & Filter</Text>
          </TouchableOpacity>

          <View style={styles.activeFilters}>
            {filterBy !== 'all' && (
              <View style={styles.activeFilter}>
                <Text style={styles.activeFilterText}>{getFilterLabel()}</Text>
                <TouchableOpacity onPress={() => onFilterChange('all')}>
                  <MaterialIcons
                    name="close"
                    size={16}
                    color={COLORS.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Filter Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowModal(false)}
              style={styles.backButton}
            >
              <MaterialIcons
                name="arrow-back"
                size={24}
                color={COLORS.textPrimary}
              />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Sort & Filter</Text>
            <TouchableOpacity
              onPress={() => setShowModal(false)}
              style={styles.applyButton}
            >
              <Text style={styles.applyButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Sort Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sort By</Text>
              {sortOptions.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.option,
                    sortBy === option.value && styles.optionSelected,
                  ]}
                  onPress={() => onSortChange(option.value)}
                >
                  <MaterialIcons
                    name={option.icon as any}
                    size={20}
                    color={
                      sortBy === option.value
                        ? COLORS.primary
                        : COLORS.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.optionText,
                      sortBy === option.value && styles.optionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {sortBy === option.value && (
                    <MaterialIcons
                      name="check"
                      size={20}
                      color={COLORS.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Filter Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Filter By Type</Text>
              {filterOptions.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.option,
                    filterBy === option.value && styles.optionSelected,
                  ]}
                  onPress={() => onFilterChange(option.value)}
                >
                  <MaterialIcons
                    name={option.icon as any}
                    size={20}
                    color={
                      filterBy === option.value
                        ? COLORS.primary
                        : COLORS.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.optionText,
                      filterBy === option.value && styles.optionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {filterBy === option.value && (
                    <MaterialIcons
                      name="check"
                      size={20}
                      color={COLORS.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Reset Filters */}
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={() => {
                  onSortChange('name');
                  onFilterChange('all');
                }}
              >
                <MaterialIcons
                  name="refresh"
                  size={20}
                  color={COLORS.textSecondary}
                />
                <Text style={styles.resetButtonText}>Reset to Defaults</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  count: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 8,
    gap: SPACING.xs,
  },
  filterButtonText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.primary,
  },
  activeFilters: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  activeFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    gap: SPACING.xs,
  },
  activeFilterText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.white,
  },
  modal: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  backButton: {
    padding: SPACING.xs,
  },
  applyButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  applyButtonText: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.primary,
  },
  modalContent: {
    flex: 1,
    padding: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderRadius: 8,
    gap: SPACING.sm,
  },
  optionSelected: {
    backgroundColor: COLORS.backgroundSecondary,
  },
  optionText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textPrimary,
  },
  optionTextSelected: {
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.primary,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  resetButtonText: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
  },
});
