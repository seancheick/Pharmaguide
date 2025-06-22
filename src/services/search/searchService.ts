// src/services/search/searchService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { dataSourceAggregator } from '../dataSources';
import { openFoodFactsService } from '../products/openfoodfacts';
import type { Product } from '../../types';
import { STORAGE_KEYS } from '../../constants';

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

interface SearchHistory {
  query: string;
  timestamp: string;
  resultCount: number;
}

class SearchService {
  private searchCache = new Map<string, { results: SearchResult[]; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_RECENT_SEARCHES = 10;
  private readonly MAX_SEARCH_RESULTS = 20;

  /**
   * Main search function that combines multiple data sources
   */
  async searchProducts(query: string): Promise<SearchResult[]> {
    if (!query.trim()) return [];

    const cacheKey = query.toLowerCase().trim();
    
    // Check cache first
    const cached = this.searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log('📦 Using cached search results for:', query);
      return cached.results;
    }

    console.log('🔍 Searching for products:', query);
    
    try {
      const results: SearchResult[] = [];

      // Search multiple sources in parallel
      const [dsldResults, openFoodFactsResults] = await Promise.allSettled([
        this.searchDSLD(query),
        this.searchOpenFoodFacts(query),
      ]);

      // Process DSLD results
      if (dsldResults.status === 'fulfilled') {
        results.push(...dsldResults.value);
      } else {
        console.warn('DSLD search failed:', dsldResults.reason);
      }

      // Process OpenFoodFacts results
      if (openFoodFactsResults.status === 'fulfilled') {
        results.push(...openFoodFactsResults.value);
      } else {
        console.warn('OpenFoodFacts search failed:', openFoodFactsResults.reason);
      }

      // Remove duplicates and limit results
      const uniqueResults = this.removeDuplicates(results);
      const limitedResults = uniqueResults.slice(0, this.MAX_SEARCH_RESULTS);

      // Cache results
      this.searchCache.set(cacheKey, {
        results: limitedResults,
        timestamp: Date.now(),
      });

      // Save to search history
      await this.saveSearchHistory(query, limitedResults.length);

      return limitedResults;
    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  }

  /**
   * Search DSLD (NIH Dietary Supplement Label Database)
   */
  private async searchDSLD(query: string): Promise<SearchResult[]> {
    try {
      const products = await dataSourceAggregator.searchByName(query);
      return products.map(product => ({
        id: product.id,
        name: product.name,
        brand: product.brand,
        category: product.category,
        imageUrl: product.imageUrl,
        source: 'dsld' as const,
        barcode: product.barcode,
      }));
    } catch (error) {
      console.error('DSLD search error:', error);
      return [];
    }
  }

  /**
   * Search OpenFoodFacts for broader product coverage
   */
  private async searchOpenFoodFacts(query: string): Promise<SearchResult[]> {
    try {
      // Note: OpenFoodFacts doesn't have a direct search by name API in the current implementation
      // This is a placeholder for when we enhance the OpenFoodFacts service
      // For now, we'll return empty array and focus on DSLD results
      return [];
    } catch (error) {
      console.error('OpenFoodFacts search error:', error);
      return [];
    }
  }

  /**
   * Remove duplicate products based on name and brand
   */
  private removeDuplicates(results: SearchResult[]): SearchResult[] {
    const seen = new Set<string>();
    return results.filter(result => {
      const key = `${result.name.toLowerCase()}-${result.brand.toLowerCase()}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Get search suggestions based on query
   */
  async getSearchSuggestions(query: string): Promise<SearchSuggestion[]> {
    if (!query.trim()) {
      return this.getDefaultSuggestions();
    }

    const suggestions: SearchSuggestion[] = [];
    
    // Add recent searches that match
    const recentSearches = await this.getRecentSearches();
    const matchingRecent = recentSearches
      .filter(search => search.query.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 3)
      .map(search => ({
        text: search.query,
        type: 'recent' as const,
      }));
    
    suggestions.push(...matchingRecent);

    // Add category suggestions
    const categoryMatches = this.getCategorySuggestions(query);
    suggestions.push(...categoryMatches);

    return suggestions.slice(0, 5); // Limit to 5 suggestions
  }

  /**
   * Get default suggestions when no query is provided
   */
  private async getDefaultSuggestions(): Promise<SearchSuggestion[]> {
    const suggestions: SearchSuggestion[] = [];
    
    // Add recent searches
    const recentSearches = await this.getRecentSearches();
    const recentSuggestions = recentSearches.slice(0, 3).map(search => ({
      text: search.query,
      type: 'recent' as const,
    }));
    
    suggestions.push(...recentSuggestions);

    // Add popular categories
    const popularCategories = [
      'Vitamin D',
      'Omega-3',
      'Multivitamin',
      'Protein Powder',
      'Probiotics',
    ];

    const categorySuggestions = popularCategories.map(category => ({
      text: category,
      type: 'popular' as const,
    }));

    suggestions.push(...categorySuggestions);

    return suggestions.slice(0, 5);
  }

  /**
   * Get category-based suggestions
   */
  private getCategorySuggestions(query: string): SearchSuggestion[] {
    const categories = [
      'Vitamin A', 'Vitamin B', 'Vitamin C', 'Vitamin D', 'Vitamin E', 'Vitamin K',
      'Calcium', 'Iron', 'Magnesium', 'Zinc', 'Potassium',
      'Omega-3', 'Fish Oil', 'Protein', 'Creatine', 'BCAA',
      'Probiotics', 'Prebiotics', 'Digestive Enzymes',
      'Multivitamin', 'Prenatal', 'Men\'s Health', 'Women\'s Health',
    ];

    return categories
      .filter(category => category.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 3)
      .map(category => ({
        text: category,
        type: 'category' as const,
      }));
  }

  /**
   * Save search to history
   */
  private async saveSearchHistory(query: string, resultCount: number): Promise<void> {
    try {
      const history = await this.getRecentSearches();
      
      // Remove existing entry for this query
      const filteredHistory = history.filter(item => item.query !== query);
      
      // Add new entry at the beginning
      const newHistory: SearchHistory[] = [
        {
          query,
          timestamp: new Date().toISOString(),
          resultCount,
        },
        ...filteredHistory,
      ].slice(0, this.MAX_RECENT_SEARCHES);

      await AsyncStorage.setItem(
        STORAGE_KEYS.RECENT_SEARCHES || '@pharmaguide_recent_searches',
        JSON.stringify(newHistory)
      );
    } catch (error) {
      console.error('Failed to save search history:', error);
    }
  }

  /**
   * Get recent searches
   */
  async getRecentSearches(): Promise<SearchHistory[]> {
    try {
      const stored = await AsyncStorage.getItem(
        STORAGE_KEYS.RECENT_SEARCHES || '@pharmaguide_recent_searches'
      );
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to get recent searches:', error);
      return [];
    }
  }

  /**
   * Clear search history
   */
  async clearSearchHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(
        STORAGE_KEYS.RECENT_SEARCHES || '@pharmaguide_recent_searches'
      );
    } catch (error) {
      console.error('Failed to clear search history:', error);
    }
  }

  /**
   * Clear search cache
   */
  clearCache(): void {
    this.searchCache.clear();
  }
}

export const searchService = new SearchService();
