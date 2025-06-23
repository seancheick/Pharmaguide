// src/screens/search/SearchScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { SearchScreenProps } from '../../types/navigation';
import {
  ProductSearchBar,
  SearchResults,
  SearchSuggestions,
} from '../../components/search';
import { searchService } from '../../services/search/searchService';
import { productService } from '../../services/products/productService';
import { useStackStore } from '../../stores/stackStore';
import { COLORS, SPACING } from '../../constants';

interface SearchResult {
  id: string;
  name: string;
  brand: string;
  category: string;
  imageUrl?: string;
  source: 'database' | 'dsld' | 'openfoodfacts';
  barcode?: string;
}

interface SearchSuggestion {
  text: string;
  type: 'recent' | 'popular' | 'category';
}

interface RouteParams {
  initialQuery?: string;
}

export const SearchScreen: React.FC = () => {
  const navigation = useNavigation<SearchScreenProps['navigation']>();
  const route = useRoute<SearchScreenProps['route']>();
  const { stack } = useStackStore();
  const { initialQuery } = (route.params as RouteParams) || {};

  // State
  const [query, setQuery] = useState(initialQuery || '');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);

  // Load initial suggestions
  useEffect(() => {
    loadSuggestions('');
  }, []);

  // Search when initial query is provided
  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  const loadSuggestions = useCallback(async (searchQuery: string) => {
    setSuggestionsLoading(true);
    try {
      const newSuggestions =
        await searchService.getSearchSuggestions(searchQuery);
      setSuggestions(newSuggestions);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
      setSuggestions([]);
    } finally {
      setSuggestionsLoading(false);
    }
  }, []);

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setQuery(searchQuery);
    setLoading(true);
    setShowSuggestions(false);

    try {
      const searchResults = await searchService.searchProducts(searchQuery);
      setResults(searchResults);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSuggestionPress = useCallback(
    (suggestion: string) => {
      handleSearch(suggestion);
    },
    [handleSearch]
  );

  const handleResultPress = useCallback(
    async (result: SearchResult) => {
      try {
        setLoading(true);

        let analysisResult;

        if (result.barcode) {
          // Use existing barcode analysis flow
          analysisResult = await productService.analyzeScannedProduct(
            result.barcode,
            stack
          );
        } else {
          // Use new search result analysis flow
          analysisResult = await productService.analyzeSearchResult(
            result,
            stack
          );
        }

        // Navigate to product analysis results (same as scan flow)
        navigation.navigate('ProductAnalysisResults', {
          productData: {
            product: analysisResult.product,
            analysis: analysisResult.analysis,
            onClose: () => navigation.goBack(),
            onScanAnother: () => navigation.goBack(),
          },
        });
      } catch (error) {
        console.error('Failed to analyze selected product:', error);
        Alert.alert(
          'Analysis Failed',
          'Unable to analyze this product. Please try again or select a different product.',
          [{ text: 'OK' }]
        );
      } finally {
        setLoading(false);
      }
    },
    [navigation, stack]
  );

  const handleSearchFocus = useCallback(() => {
    setShowSuggestions(true);
    if (query.trim()) {
      loadSuggestions(query);
    }
  }, [query, loadSuggestions]);

  const handleSearchBlur = useCallback(() => {
    // Don't hide suggestions immediately to allow for suggestion taps
    setTimeout(() => {
      setShowSuggestions(false);
    }, 150);
  }, []);

  const handleClearHistory = useCallback(async () => {
    try {
      await searchService.clearSearchHistory();
      loadSuggestions(query);
    } catch (error) {
      console.error('Failed to clear search history:', error);
    }
  }, [query, loadSuggestions]);

  const handleRetrySearch = useCallback(() => {
    if (query.trim()) {
      handleSearch(query);
    }
  }, [query, handleSearch]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Search Bar */}
        <ProductSearchBar
          onSearchPress={handleSearch}
          onFocus={handleSearchFocus}
          onBlur={handleSearchBlur}
          autoFocus={!initialQuery}
          placeholder="Search supplements, vitamins, medications..."
        />

        {/* Content Area */}
        <View style={styles.content}>
          {showSuggestions ? (
            <SearchSuggestions
              suggestions={suggestions}
              onSuggestionPress={handleSuggestionPress}
              onClearHistory={handleClearHistory}
              loading={suggestionsLoading}
            />
          ) : (
            <SearchResults
              results={results}
              loading={loading}
              query={query}
              onResultPress={handleResultPress}
              onRetry={handleRetrySearch}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
});
