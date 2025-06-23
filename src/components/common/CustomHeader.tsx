// src/components/common/CustomHeader.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';

interface CustomHeaderProps {
  title: string;
  onBackPress?: () => void;
  rightElement?: React.ReactNode;
  rightText?: string;
  onRightPress?: () => void;
  showBackButton?: boolean;
  backgroundColor?: string;
  titleColor?: string;
  backButtonColor?: string;
}

export const CustomHeader: React.FC<CustomHeaderProps> = ({
  title,
  onBackPress,
  rightElement,
  rightText,
  onRightPress,
  showBackButton = true,
  backgroundColor = COLORS.background,
  titleColor = COLORS.textPrimary,
  backButtonColor = COLORS.textPrimary,
}) => {
  const navigation = useNavigation();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      <View style={styles.container}>
        {/* Left Side - Back Button */}
        <View style={styles.leftContainer}>
          {showBackButton && (
            <TouchableOpacity
              onPress={handleBackPress}
              style={styles.backButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color={backButtonColor}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Center - Title */}
        <View style={styles.centerContainer}>
          <Text style={[styles.title, { color: titleColor }]} numberOfLines={1}>
            {title}
          </Text>
        </View>

        {/* Right Side - Action */}
        <View style={styles.rightContainer}>
          {rightElement || (
            rightText && onRightPress ? (
              <TouchableOpacity
                onPress={onRightPress}
                style={styles.rightButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.rightText}>{rightText}</Text>
              </TouchableOpacity>
            ) : null
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: COLORS.background,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    minHeight: 56,
  },
  leftContainer: {
    width: 40,
    alignItems: 'flex-start',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
  },
  rightContainer: {
    width: 80,
    alignItems: 'flex-end',
  },
  backButton: {
    padding: SPACING.xs,
    borderRadius: 8,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  rightButton: {
    padding: SPACING.xs,
  },
  rightText: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.primary,
  },
});
