// src/hooks/useVisibilityTracking.ts
import { useCallback, useState, useRef } from 'react';
import { ViewToken } from 'react-native';
import { logger } from '../services/monitoring/logger';

interface VisibilityConfig {
  itemVisiblePercentThreshold?: number;
  minimumViewTime?: number;
  waitForInteraction?: boolean;
}

interface VisibilityStats {
  totalItems: number;
  visibleItems: number;
  viewedItems: number;
  averageViewTime: number;
}

/**
 * React Native Visibility Tracking Hook
 * 
 * Provides intersection observer-like functionality for FlatList/ScrollView
 * Optimizes performance by tracking which items are actually visible
 */
export const useVisibilityTracking = (config: VisibilityConfig = {}) => {
  const {
    itemVisiblePercentThreshold = 50,
    minimumViewTime = 100,
    waitForInteraction = false,
  } = config;

  // Track visible items
  const [visibleItems, setVisibleItems] = useState(new Set<string>());
  
  // Track items that have been viewed (for analytics)
  const [viewedItems, setViewedItems] = useState(new Set<string>());
  
  // Track view times for analytics
  const viewTimes = useRef(new Map<string, number>());
  const viewStartTimes = useRef(new Map<string, number>());

  /**
   * Handle viewable items changed event from FlatList
   */
  const onViewableItemsChanged = useCallback(
    ({ viewableItems, changed }: { viewableItems: ViewToken[]; changed: ViewToken[] }) => {
      const now = Date.now();
      
      // Get currently visible item IDs
      const newVisibleItems = new Set(
        viewableItems
          .map(item => item.item?.id)
          .filter(Boolean)
      );

      // Track items that became visible
      const becameVisible = changed.filter(item => item.isViewable);
      const becameHidden = changed.filter(item => !item.isViewable);

      // Start timing for newly visible items
      becameVisible.forEach(item => {
        if (item.item?.id) {
          viewStartTimes.current.set(item.item.id, now);
        }
      });

      // Calculate view time for items that became hidden
      becameHidden.forEach(item => {
        if (item.item?.id) {
          const startTime = viewStartTimes.current.get(item.item.id);
          if (startTime) {
            const viewTime = now - startTime;
            
            // Only count as "viewed" if it was visible long enough
            if (viewTime >= minimumViewTime) {
              viewTimes.current.set(item.item.id, viewTime);
              setViewedItems(prev => new Set([...prev, item.item.id]));
            }
            
            viewStartTimes.current.delete(item.item.id);
          }
        }
      });

      setVisibleItems(newVisibleItems);

      // Log visibility changes for debugging
      if (changed.length > 0) {
        logger.debug('performance', 'Visibility changed', {
          visible: newVisibleItems.size,
          becameVisible: becameVisible.length,
          becameHidden: becameHidden.length,
        });
      }
    },
    [minimumViewTime]
  );

  /**
   * Check if an item is currently visible
   */
  const isItemVisible = useCallback((itemId: string): boolean => {
    return visibleItems.has(itemId);
  }, [visibleItems]);

  /**
   * Check if an item has been viewed (visible for minimum time)
   */
  const hasItemBeenViewed = useCallback((itemId: string): boolean => {
    return viewedItems.has(itemId);
  }, [viewedItems]);

  /**
   * Get view time for an item
   */
  const getItemViewTime = useCallback((itemId: string): number => {
    return viewTimes.current.get(itemId) || 0;
  }, []);

  /**
   * Get visibility statistics
   */
  const getVisibilityStats = useCallback((): VisibilityStats => {
    const totalViewTime = Array.from(viewTimes.current.values()).reduce((sum, time) => sum + time, 0);
    const averageViewTime = viewedItems.size > 0 ? totalViewTime / viewedItems.size : 0;

    return {
      totalItems: viewTimes.current.size + visibleItems.size,
      visibleItems: visibleItems.size,
      viewedItems: viewedItems.size,
      averageViewTime,
    };
  }, [visibleItems, viewedItems]);

  /**
   * Reset tracking data
   */
  const resetTracking = useCallback(() => {
    setVisibleItems(new Set());
    setViewedItems(new Set());
    viewTimes.current.clear();
    viewStartTimes.current.clear();
  }, []);

  /**
   * Viewability config for FlatList
   */
  const viewabilityConfig = {
    itemVisiblePercentThreshold,
    minimumViewTime,
    waitForInteraction,
  };

  /**
   * Optimized render item wrapper
   * Only renders complex content when item is visible
   */
  const createOptimizedRenderItem = useCallback(
    <T,>(
      renderItem: (info: { item: T; index: number }) => React.ReactElement,
      renderPlaceholder?: (info: { item: T; index: number }) => React.ReactElement
    ) => {
      return ({ item, index }: { item: T; index: number }) => {
        const itemId = (item as any)?.id;
        const isVisible = itemId ? isItemVisible(itemId) : true;

        if (!isVisible && renderPlaceholder) {
          return renderPlaceholder({ item, index });
        }

        return renderItem({ item, index });
      };
    },
    [isItemVisible]
  );

  return {
    // State
    visibleItems,
    viewedItems,
    
    // Event handlers
    onViewableItemsChanged,
    viewabilityConfig,
    
    // Utility functions
    isItemVisible,
    hasItemBeenViewed,
    getItemViewTime,
    getVisibilityStats,
    resetTracking,
    createOptimizedRenderItem,
  };
};

/**
 * Hook for simple visibility tracking without analytics
 */
export const useSimpleVisibilityTracking = (threshold: number = 50) => {
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
    itemVisiblePercentThreshold: threshold,
    minimumViewTime: 100,
  };

  const isItemVisible = useCallback((itemId: string): boolean => {
    return visibleItems.has(itemId);
  }, [visibleItems]);

  return {
    visibleItems,
    onViewableItemsChanged,
    viewabilityConfig,
    isItemVisible,
  };
};

/**
 * Hook for preloading content based on visibility
 */
export const useVisibilityPreloader = <T,>(
  items: T[],
  preloadFn: (item: T) => Promise<void>,
  preloadDistance: number = 2
) => {
  const { visibleItems, onViewableItemsChanged, viewabilityConfig } = useSimpleVisibilityTracking();
  const preloadedItems = useRef(new Set<string>());

  const handlePreloading = useCallback(async () => {
    const visibleArray = Array.from(visibleItems);
    
    for (const visibleId of visibleArray) {
      const visibleIndex = items.findIndex((item: any) => item.id === visibleId);
      
      if (visibleIndex !== -1) {
        // Preload items ahead
        for (let i = 1; i <= preloadDistance; i++) {
          const preloadIndex = visibleIndex + i;
          if (preloadIndex < items.length) {
            const preloadItem = items[preloadIndex];
            const preloadId = (preloadItem as any).id;
            
            if (!preloadedItems.current.has(preloadId)) {
              preloadedItems.current.add(preloadId);
              try {
                await preloadFn(preloadItem);
              } catch (error) {
                logger.warn('performance', 'Preload failed', { preloadId, error });
              }
            }
          }
        }
      }
    }
  }, [visibleItems, items, preloadFn, preloadDistance]);

  // Trigger preloading when visible items change
  React.useEffect(() => {
    handlePreloading();
  }, [handlePreloading]);

  return {
    visibleItems,
    onViewableItemsChanged,
    viewabilityConfig,
    preloadedCount: preloadedItems.current.size,
  };
};
