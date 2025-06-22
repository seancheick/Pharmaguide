// src/components/search/SearchSuggestions.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';

interface SearchSuggestion {
  text: string;
  type: 'recent' | 'popular' | 'category';
}

interface SearchSuggestionsProps {
  suggestions: SearchSuggestion[];
  onSuggestionPress: (suggestion: string) => void;
  onClearHistory?: () => void;
  loading?: boolean;
}

export const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({
  suggestions,
  onSuggestionPress,
  onClearHistory,
  loading = false,
}) => {
  const renderSuggestionItem = ({ item }: { item: SearchSuggestion }) => {
    const getIcon = () => {
      switch (item.type) {
        case 'recent':
          return <Ionicons name="time-outline" size={16} color={COLORS.textSecondary} />;
        case 'popular':
          return <Ionicons name="trending-up-outline" size={16} color={COLORS.secondary} />;
        case 'category':
          return <MaterialIcons name="category" size={16} color={COLORS.accent} />;
        default:
          return <Ionicons name="search-outline" size={16} color={COLORS.textSecondary} />;
      }
    };

    const getTypeLabel = () => {
      switch (item.type) {
        case 'recent':
          return 'Recent';
        case 'popular':
          return 'Popular';
        case 'category':
          return 'Category';
        default:
          return '';
      }
    };

    return (
      <TouchableOpacity
        style={styles.suggestionItem}
        onPress={() => onSuggestionPress(item.text)}
        activeOpacity={0.7}
      >
        <View style={styles.suggestionIcon}>
          {getIcon()}
        </View>
        
        <View style={styles.suggestionContent}>
          <Text style={styles.suggestionText} numberOfLines={1}>
            {item.text}
          </Text>
          {item.type !== 'recent' && (
            <Text style={styles.suggestionType}>
              {getTypeLabel()}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.insertIcon}
          onPress={() => onSuggestionPress(item.text)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-up-outline" size={16} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => {
    const hasRecentSearches = suggestions.some(s => s.type === 'recent');
    
    if (!hasRecentSearches) return null;

    return (
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Recent Searches</Text>
        {onClearHistory && (
          <TouchableOpacity onPress={onClearHistory} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderSeparator = ({ leadingItem }: { leadingItem: SearchSuggestion }) => {
    const nextIndex = suggestions.indexOf(leadingItem) + 1;
    const nextItem = suggestions[nextIndex];
    
    // Add separator between different types
    if (nextItem && leadingItem.type !== nextItem.type) {
      return <View style={styles.typeSeparator} />;
    }
    
    return <View style={styles.itemSeparator} />;
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="search-outline" size={32} color={COLORS.textSecondary} />
      <Text style={styles.emptyText}>Start typing to see suggestions</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingState}>
          <Text style={styles.loadingText}>Loading suggestions...</Text>
        </View>
      </View>
    );
  }

  if (suggestions.length === 0) {
    return (
      <View style={styles.container}>
        {renderEmptyState()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={suggestions}
        renderItem={renderSuggestionItem}
        keyExtractor={(item, index) => `${item.type}-${item.text}-${index}`}
        ListHeaderComponent={renderHeader}
        ItemSeparatorComponent={renderSeparator}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        style={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    marginTop: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    maxHeight: 300, // Limit height to prevent taking up too much space
  },
  list: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textSecondary,
  },
  clearButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  clearButtonText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minHeight: 44, // Ensure touch target is large enough
  },
  suggestionIcon: {
    marginRight: SPACING.sm,
    width: 20,
    alignItems: 'center',
  },
  suggestionContent: {
    flex: 1,
    justifyContent: 'center',
  },
  suggestionText: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  suggestionType: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  insertIcon: {
    padding: SPACING.xs,
    marginLeft: SPACING.sm,
  },
  itemSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.gray200,
    marginLeft: SPACING.md + 20 + SPACING.sm, // Align with text
  },
  typeSeparator: {
    height: SPACING.sm,
    backgroundColor: COLORS.gray100,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  loadingState: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
  },
});
