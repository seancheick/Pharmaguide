// src/components/search/ProductSearchBar.tsx
import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  Pressable,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';

interface ProductSearchBarProps {
  onSearchPress: (query: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  showSuggestions?: boolean;
  onVoicePress?: () => void;
}

export const ProductSearchBar: React.FC<ProductSearchBarProps> = ({
  onSearchPress,
  onFocus,
  onBlur,
  placeholder = 'Search supplements, vitamins...',
  autoFocus = false,
  onVoicePress,
}) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showMic, setShowMic] = useState(true);
  const inputRef = useRef<TextInput>(null);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    onFocus?.();
    setShowMic(false);
  }, [onFocus]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    onBlur?.();
    if (!query) {
      setShowMic(true);
    }
  }, [query, onBlur]);

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

  const handleVoicePress = useCallback(() => {
    if (onVoicePress) {
      onVoicePress();
    }
  }, [onVoicePress]);

  return (
    <View style={styles.container}>
      <View style={styles.searchWrapper}>
        {/* Simplified background - guaranteed to be visible */}
        <View style={styles.searchBackground}>
          {/* Search Icon */}
          <TouchableOpacity
            style={styles.searchIconContainer}
            onPress={handleSearch}
            activeOpacity={0.7}
          >
            <View
              style={[styles.iconCircle, isFocused && styles.iconCircleFocused]}
            >
              <Ionicons
                name="search"
                size={20}
                color={isFocused ? COLORS.primary : COLORS.gray500}
              />
            </View>
          </TouchableOpacity>

          {/* Text Input */}
          <View style={styles.inputWrapper}>
            <TextInput
              ref={inputRef}
              style={[styles.textInput, isFocused && styles.textInputFocused]}
              placeholder={placeholder}
              placeholderTextColor={COLORS.gray400}
              value={query}
              onChangeText={setQuery}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onSubmitEditing={handleSearch}
              autoFocus={autoFocus}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
              selectionColor={COLORS.primary}
            />
          </View>

          {/* Clear Button */}
          {query.length > 0 && (
            <Pressable
              style={styles.clearButton}
              onPress={handleClear}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <View style={styles.clearIconContainer}>
                <Ionicons name="close" size={18} color={COLORS.gray500} />
              </View>
            </Pressable>
          )}

          {/* Voice Search Button */}
          {showMic && onVoicePress && !query && (
            <TouchableOpacity
              style={styles.voiceButton}
              onPress={handleVoicePress}
              activeOpacity={0.7}
            >
              <View style={styles.voiceIconContainer}>
                <MaterialIcons name="mic" size={18} color={COLORS.white} />
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    zIndex: 1,
  },
  searchWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  searchBackground: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    minHeight: 56,
  },
  searchIconContainer: {
    marginRight: SPACING.sm,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleFocused: {
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
  },
  inputWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  textInput: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
    paddingVertical: 0,
  },
  textInputFocused: {
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  clearButton: {
    marginLeft: SPACING.xs,
  },
  clearIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(107, 114, 128, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceButton: {
    marginLeft: SPACING.sm,
  },
  voiceIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
