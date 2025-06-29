// src/components/common/EnhancedOptimizedImage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ViewStyle, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useNetInfo } from '@react-native-community/netinfo';
import { COLORS } from '../../constants';
import { enhancedImageOptimization } from '../../services/performance/enhancedImageOptimization';
import { logger } from '../../services/monitoring/logger';
import { OptimizedIcon } from './OptimizedIcon';

interface EnhancedOptimizedImageProps {
  source: { uri: string } | number;
  style?: ViewStyle;
  placeholder?: React.ReactNode;
  fallbackIcon?: string;
  fallbackIconSize?: number;
  priority?: 'low' | 'normal' | 'high';
  cachePolicy?: 'memory' | 'disk' | 'memory-disk';
  contentFit?: 'cover' | 'contain' | 'fill' | 'scale-down';
  transition?: number;
  size?: 'thumbnail' | 'medium' | 'large' | 'original';
  enableNetworkOptimization?: boolean;
  enableVisibilityOptimization?: boolean;
  isVisible?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

export const EnhancedOptimizedImage: React.FC<EnhancedOptimizedImageProps> = ({
  source,
  style,
  placeholder,
  fallbackIcon = 'cube-outline',
  fallbackIconSize = 24,
  priority = 'normal',
  cachePolicy = 'memory-disk',
  contentFit = 'contain',
  transition = 200,
  size = 'medium',
  enableNetworkOptimization = true,
  enableVisibilityOptimization = false,
  isVisible = true,
  onLoad,
  onError,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [optimizedSource, setOptimizedSource] = useState<string | null>(null);
  const netInfo = useNetInfo();

  // Get optimized image source
  useEffect(() => {
    if (typeof source === 'number' || !source.uri) {
      setOptimizedSource(null);
      return;
    }

    const getOptimizedImage = async () => {
      try {
        let imageUri: string;

        if (enableNetworkOptimization && netInfo.type) {
          // Use network-aware optimization
          imageUri = await enhancedImageOptimization.getImageForNetworkCondition(
            source.uri,
            netInfo.type === 'wifi' ? 'wifi' : 'cellular'
          );
        } else {
          // Use size-based optimization
          imageUri = await enhancedImageOptimization.getOptimizedImage(source.uri, size);
        }

        setOptimizedSource(imageUri);
      } catch (error) {
        logger.warn('performance', 'Image optimization failed', { uri: source.uri, error });
        setOptimizedSource(source.uri); // Fallback to original
      }
    };

    // Only load if visible (when visibility optimization is enabled)
    if (!enableVisibilityOptimization || isVisible) {
      getOptimizedImage();
    }
  }, [source, size, enableNetworkOptimization, netInfo.type, enableVisibilityOptimization, isVisible]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  }, [onError]);

  const renderPlaceholder = () => {
    if (placeholder) {
      return placeholder;
    }

    if (hasError) {
      return (
        <View style={[styles.placeholder, style]}>
          <OptimizedIcon
            type="ion"
            name={fallbackIcon}
            size={fallbackIconSize}
            color={COLORS.gray400}
          />
        </View>
      );
    }

    if (isLoading) {
      return (
        <View style={[styles.placeholder, style]}>
          <ActivityIndicator size="small" color={COLORS.primary} />
        </View>
      );
    }

    return null;
  };

  // Don't render anything if visibility optimization is enabled and item is not visible
  if (enableVisibilityOptimization && !isVisible) {
    return (
      <View style={[styles.placeholder, style]}>
        <ActivityIndicator size="small" color={COLORS.gray300} />
      </View>
    );
  }

  // Handle static images (numbers)
  if (typeof source === 'number') {
    return (
      <View style={style}>
        <Image
          source={source}
          style={[
            StyleSheet.absoluteFillObject,
            { opacity: isLoading || hasError ? 0 : 1 },
          ]}
          contentFit={contentFit}
          priority={priority}
          cachePolicy={cachePolicy}
          transition={transition}
          onLoad={handleLoad}
          onError={handleError}
        />
        {renderPlaceholder()}
      </View>
    );
  }

  // Handle URI images with optimization
  const imageSource = optimizedSource ? { uri: optimizedSource } : source;

  return (
    <View style={style}>
      <Image
        source={imageSource}
        style={[
          StyleSheet.absoluteFillObject,
          { opacity: isLoading || hasError ? 0 : 1 },
        ]}
        contentFit={contentFit}
        priority={priority}
        cachePolicy={cachePolicy}
        transition={transition}
        onLoad={handleLoad}
        onError={handleError}
        placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }} // Generic blurhash
      />
      {renderPlaceholder()}
    </View>
  );
};

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: COLORS.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
});

/**
 * Hook for using enhanced optimized images with visibility tracking
 */
export const useEnhancedOptimizedImage = (
  uri: string,
  size: 'thumbnail' | 'medium' | 'large' | 'original' = 'medium'
) => {
  const [optimizedUri, setOptimizedUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadOptimizedImage = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const optimized = await enhancedImageOptimization.getOptimizedImage(uri, size);
        setOptimizedUri(optimized);
      } catch (err) {
        setError(err as Error);
        setOptimizedUri(uri); // Fallback to original
      } finally {
        setIsLoading(false);
      }
    };

    if (uri) {
      loadOptimizedImage();
    }
  }, [uri, size]);

  return {
    optimizedUri,
    isLoading,
    error,
  };
};

/**
 * Preload images for better performance
 */
export const preloadImages = async (uris: string[]): Promise<void> => {
  try {
    await enhancedImageOptimization.preloadCriticalImages(uris);
  } catch (error) {
    logger.warn('performance', 'Image preloading failed', { uris, error });
  }
};
