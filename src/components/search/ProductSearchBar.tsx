// src/components/search/ProductSearchBar.tsx
import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';

interface ProductSearchBarProps {
  onSearchPress: (query: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  showSuggestions?: boolean;
}

export const ProductSearchBar: React.FC<ProductSearchBarProps> = ({
  onSearchPress,
  onFocus,
  onBlur,
  placeholder = "Search supplements, vitamins, medications...",
  autoFocus = false,
  showSuggestions = true,
}) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const animatedValue = useRef(new Animated.Value(0)).current;

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    onFocus?.();
    
    // Animate search bar expansion
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [animatedValue, onFocus]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    onBlur?.();
    
    // Animate search bar contraction
    Animated.timing(animatedValue, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [animatedValue, onBlur]);

  const handleSearch = useCallback(() => {
    if (query.trim()) {
      Keyboard.dismiss();
      onSearchPress(query.trim());
    }
  }, [query, onSearchPress]);

  const handleClear = useCallback(() => {
    setQuery('');
    inputRef.current?.focus();
  }, []);

  const handleCancel = useCallback(() => {
    setQuery('');
    inputRef.current?.blur();
    Keyboard.dismiss();
  }, []);

  // Animated styles
  const searchBarStyle = {
    borderColor: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [COLORS.gray200, COLORS.primary],
    }),
    shadowOpacity: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.1, 0.2],
    }),
  };

  const cancelButtonOpacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const cancelButtonWidth = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 60],
  });

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Animated.View style={[styles.searchBar, searchBarStyle]}>
          {/* Search Icon */}
          <TouchableOpacity 
            style={styles.searchIcon}
            onPress={handleSearch}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="search" 
              size={20} 
              color={isFocused ? COLORS.primary : COLORS.textSecondary} 
            />
          </TouchableOpacity>

          {/* Text Input */}
          <TextInput
            ref={inputRef}
            style={styles.textInput}
            placeholder={placeholder}
            placeholderTextColor={COLORS.textSecondary}
            value={query}
            onChangeText={setQuery}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onSubmitEditing={handleSearch}
            autoFocus={autoFocus}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="never" // We'll handle clear manually
          />

          {/* Clear Button */}
          {query.length > 0 && (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={handleClear}
              activeOpacity={0.7}
            >
              <Ionicons 
                name="close-circle" 
                size={18} 
                color={COLORS.textSecondary} 
              />
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Cancel Button */}
        {isFocused && (
          <Animated.View 
            style={[
              styles.cancelButtonContainer,
              {
                opacity: cancelButtonOpacity,
                width: cancelButtonWidth,
              }
            ]}
          >
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={handleCancel}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>

      {/* Search Suggestions Placeholder */}
      {isFocused && showSuggestions && query.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsPlaceholder}>
            Search suggestions will appear here
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  textInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textPrimary,
    paddingVertical: 0, // Remove default padding
  },
  clearButton: {
    marginLeft: SPACING.sm,
    padding: SPACING.xs,
  },
  cancelButtonContainer: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  cancelButtonText: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  suggestionsContainer: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 8,
    marginTop: SPACING.xs,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  suggestionsPlaceholder: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
