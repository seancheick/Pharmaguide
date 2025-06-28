// src/components/common/NetworkStatusBanner.tsx
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNetworkState } from '../../hooks/useNetworkState';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';

interface NetworkStatusBannerProps {
  showWhenOnline?: boolean;
  autoHide?: boolean;
  autoHideDelay?: number;
  onPress?: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

export const NetworkStatusBanner: React.FC<NetworkStatusBannerProps> = ({
  showWhenOnline = false,
  autoHide = true,
  autoHideDelay = 3000,
  onPress,
}) => {
  const {
    isOnline,
    isOffline,
    networkType,
    queueSize,
    syncOfflineQueue,
  } = useNetworkState();

  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [isVisible, setIsVisible] = React.useState(false);
  const [lastOnlineState, setLastOnlineState] = React.useState(isOnline);

  useEffect(() => {
    const shouldShow = isOffline || (showWhenOnline && isOnline);
    const stateChanged = lastOnlineState !== isOnline;

    if (shouldShow && (!isVisible || stateChanged)) {
      showBanner();
      setLastOnlineState(isOnline);

      // Auto-hide for online state
      if (isOnline && autoHide) {
        const timer = setTimeout(() => {
          hideBanner();
        }, autoHideDelay);
        return () => clearTimeout(timer);
      }
    } else if (!shouldShow && isVisible) {
      hideBanner();
    }
  }, [isOnline, isOffline, showWhenOnline, autoHide, autoHideDelay]);

  const showBanner = () => {
    setIsVisible(true);
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideBanner = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsVisible(false);
    });
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (isOffline && queueSize > 0) {
      // Default action: try to sync when offline with queued items
      syncOfflineQueue();
    }
  };

  const getBannerConfig = () => {
    if (isOffline) {
      return {
        backgroundColor: COLORS.warning,
        textColor: COLORS.background,
        icon: 'cloud-offline-outline' as const,
        title: 'You\'re Offline',
        subtitle: queueSize > 0 
          ? `${queueSize} actions queued for sync`
          : 'Using offline mode with local data',
        actionText: queueSize > 0 ? 'Retry Sync' : undefined,
      };
    } else {
      return {
        backgroundColor: COLORS.success,
        textColor: COLORS.background,
        icon: 'cloud-done-outline' as const,
        title: 'Back Online',
        subtitle: `Connected via ${networkType.toUpperCase()}`,
        actionText: queueSize > 0 ? 'Syncing...' : undefined,
      };
    }
  };

  if (!isVisible) {
    return null;
  }

  const config = getBannerConfig();

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          backgroundColor: config.backgroundColor,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.content}
        onPress={handlePress}
        activeOpacity={0.8}
        disabled={!onPress && !(isOffline && queueSize > 0)}
      >
        <View style={styles.iconContainer}>
          <Ionicons
            name={config.icon}
            size={20}
            color={config.textColor}
          />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: config.textColor }]}>
            {config.title}
          </Text>
          <Text style={[styles.subtitle, { color: config.textColor }]}>
            {config.subtitle}
          </Text>
        </View>

        {config.actionText && (
          <View style={styles.actionContainer}>
            <Text style={[styles.actionText, { color: config.textColor }]}>
              {config.actionText}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={config.textColor}
            />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingTop: 44, // Account for status bar
    paddingBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
    shadowColor: COLORS.gray900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  iconContainer: {
    marginRight: SPACING.sm,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.xs,
    opacity: 0.9,
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  actionText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.medium,
    marginRight: 4,
  },
});
