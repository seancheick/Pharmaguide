// src/components/stack/StackItemRenderer.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { OptimizedIcon } from '../common/OptimizedIcon';
import { AnimatedTouchable, OptimizedImage } from '../common';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';
import type { UserStack } from '../../types';

interface StackItemRendererProps {
  item: UserStack;
  onItemPress: (item: UserStack) => void;
  onRemovePress: (item: UserStack) => void;
}

export const StackItemRenderer: React.FC<StackItemRendererProps> = ({
  item,
  onItemPress,
  onRemovePress,
}) => {
  const handleRemovePress = (e: any) => {
    e.stopPropagation();
    onRemovePress(item);
  };

  return (
    <AnimatedTouchable
      style={styles.stackItem}
      onPress={() => onItemPress(item)}
      activeOpacity={0.7}
    >
      {/* Item Image */}
      {item.imageUrl ? (
        <OptimizedImage
          source={{ uri: item.imageUrl }}
          style={styles.itemImage}
          priority="normal"
          contentFit="contain"
          fallbackIcon="cube-outline"
          fallbackIconSize={24}
        />
      ) : (
        <View style={styles.itemImagePlaceholder}>
          <OptimizedIcon
            type="ion"
            name="cube-outline"
            size={24}
            color={COLORS.gray400}
          />
        </View>
      )}

      {/* Item Content */}
      <View style={styles.stackItemContent}>
        <Text style={styles.itemName} numberOfLines={1}>
          {item.name}
        </Text>
        {item.brand && (
          <Text style={styles.itemBrand} numberOfLines={1}>
            {item.brand}
          </Text>
        )}
        {item.dosage && (
          <Text style={styles.itemDosage} numberOfLines={1}>
            Dosage: {item.dosage}
          </Text>
        )}
      </View>

      {/* Remove Button */}
      <TouchableOpacity
        onPress={handleRemovePress}
        style={styles.removeButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <OptimizedIcon
          type="material"
          name="close"
          size={20}
          color={COLORS.error}
        />
      </TouchableOpacity>
    </AnimatedTouchable>
  );
};

const styles = StyleSheet.create({
  stackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    shadowColor: COLORS.gray900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: SPACING.md,
  },
  itemImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: COLORS.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  stackItemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
  },
  itemBrand: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  itemDosage: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  removeButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.sm,
  },
});
