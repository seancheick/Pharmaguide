// src/components/common/OptimizedImage.tsx
import React, { useState } from 'react';
import { View, StyleSheet, ViewStyle, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { COLORS } from '../../constants';
import { OptimizedIcon } from './OptimizedIcon';

interface OptimizedImageProps {
  source: { uri: string } | number;
  style?: ViewStyle;
  placeholder?: React.ReactNode;
  fallbackIcon?: keyof typeof Ionicons.glyphMap;
  fallbackIconSize?: number;
  priority?: 'low' | 'normal' | 'high';
  cachePolicy?: 'memory' | 'disk' | 'memory-disk';
  contentFit?: 'cover' | 'contain' | 'fill' | 'scale-down';
  transition?: number;
  onLoad?: () => void;
  onError?: () => void;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  source,
  style,
  placeholder,
  fallbackIcon = 'cube-outline',
  fallbackIconSize = 24,
  priority = 'normal',
  cachePolicy = 'memory-disk',
  contentFit = 'contain',
  transition = 200,
  onLoad,
  onError,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

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
