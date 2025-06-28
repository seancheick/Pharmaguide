// src/components/common/Toast.tsx
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';
import { OptimizedIcon } from './OptimizedIcon';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  message: string;
  type: ToastType;
  duration?: number;
  onDismiss?: () => void;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type,
  duration = 4000,
  onDismiss,
  action,
}) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Show animation
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

    // Auto dismiss
    const timer = setTimeout(() => {
      dismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss?.();
    });
  };

  const getToastConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: 'checkmark-circle',
          backgroundColor: COLORS.success,
          borderColor: COLORS.successDark,
        };
      case 'error':
        return {
          icon: 'close-circle',
          backgroundColor: COLORS.error,
          borderColor: COLORS.errorDark,
        };
      case 'warning':
        return {
          icon: 'warning',
          backgroundColor: COLORS.warning,
          borderColor: COLORS.warningDark,
        };
      case 'info':
      default:
        return {
          icon: 'information-circle',
          backgroundColor: COLORS.info,
          borderColor: COLORS.infoDark,
        };
    }
  };

  const config = getToastConfig();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: `${config.backgroundColor}15`,
          borderColor: config.backgroundColor,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <View style={styles.content}>
        <OptimizedIcon
          type="ion"
          name={config.icon as any}
          size={20}
          color={config.backgroundColor}
          style={styles.icon}
        />
        <Text style={[styles.message, { color: config.borderColor }]}>
          {message}
        </Text>
        {action && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              { borderColor: config.backgroundColor },
            ]}
            onPress={action.onPress}
          >
            <Text
              style={[styles.actionText, { color: config.backgroundColor }]}
            >
              {action.label}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.dismissButton}
          onPress={dismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <OptimizedIcon
            type="ion"
            name="close"
            size={16}
            color={config.borderColor}
          />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

// Toast Manager Hook
interface ToastState {
  id: string;
  props: ToastProps;
}

class ToastManager {
  private toasts: ToastState[] = [];
  private listeners: ((toasts: ToastState[]) => void)[] = [];

  show(props: Omit<ToastProps, 'onDismiss'>) {
    const id = Date.now().toString();
    const toast: ToastState = {
      id,
      props: {
        ...props,
        onDismiss: () => this.dismiss(id),
      },
    };

    this.toasts = [...this.toasts, toast];
    this.notifyListeners();
  }

  dismiss(id: string) {
    this.toasts = this.toasts.filter(toast => toast.id !== id);
    this.notifyListeners();
  }

  clear() {
    this.toasts = [];
    this.notifyListeners();
  }

  subscribe(listener: (toasts: ToastState[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.toasts));
  }
}

export const toastManager = new ToastManager();

// Toast Container Component
export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = React.useState<ToastState[]>([]);

  useEffect(() => {
    const unsubscribe = toastManager.subscribe(setToasts);
    return unsubscribe;
  }, []);

  return (
    <View style={styles.toastContainer} pointerEvents="box-none">
      {toasts.map(toast => (
        <Toast key={toast.id} {...toast.props} />
      ))}
    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: SPACING.md,
  },
  container: {
    marginBottom: SPACING.sm,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minHeight: 48,
  },
  icon: {
    marginRight: SPACING.sm,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  actionButton: {
    marginLeft: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dismissButton: {
    marginLeft: SPACING.sm,
    padding: 4,
  },
});
