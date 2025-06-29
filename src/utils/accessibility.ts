// src/utils/accessibility.ts
import React from 'react';
import { AccessibilityInfo, Dimensions } from 'react-native';

export interface AccessibilityState {
  isScreenReaderEnabled: boolean;
  isReduceMotionEnabled: boolean;
  isReduceTransparencyEnabled: boolean;
  prefersCrossFadeTransitions: boolean;
}

/**
 * Accessibility utility class
 */
class AccessibilityManager {
  private state: AccessibilityState = {
    isScreenReaderEnabled: false,
    isReduceMotionEnabled: false,
    isReduceTransparencyEnabled: false,
    prefersCrossFadeTransitions: false,
  };

  private listeners: ((state: AccessibilityState) => void)[] = [];

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Check screen reader status
      const isScreenReaderEnabled =
        await AccessibilityInfo.isScreenReaderEnabled();

      // Check reduce motion preference
      const isReduceMotionEnabled =
        await AccessibilityInfo.isReduceMotionEnabled();

      // Check reduce transparency preference (iOS only)
      const isReduceTransparencyEnabled =
        await AccessibilityInfo.isReduceTransparencyEnabled();

      this.state = {
        isScreenReaderEnabled,
        isReduceMotionEnabled,
        isReduceTransparencyEnabled,
        prefersCrossFadeTransitions: isReduceMotionEnabled,
      };

      // Set up listeners for accessibility changes
      AccessibilityInfo.addEventListener(
        'screenReaderChanged',
        this.handleScreenReaderChange
      );
      AccessibilityInfo.addEventListener(
        'reduceMotionChanged',
        this.handleReduceMotionChange
      );
      AccessibilityInfo.addEventListener(
        'reduceTransparencyChanged',
        this.handleReduceTransparencyChange
      );

      this.notifyListeners();
    } catch (error) {
      console.warn('Failed to initialize accessibility settings:', error);
    }
  }

  private handleScreenReaderChange = (isEnabled: boolean): void => {
    this.state.isScreenReaderEnabled = isEnabled;
    this.notifyListeners();
  };

  private handleReduceMotionChange = (isEnabled: boolean): void => {
    this.state.isReduceMotionEnabled = isEnabled;
    this.state.prefersCrossFadeTransitions = isEnabled;
    this.notifyListeners();
  };

  private handleReduceTransparencyChange = (isEnabled: boolean): void => {
    this.state.isReduceTransparencyEnabled = isEnabled;
    this.notifyListeners();
  };

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state));
  }

  /**
   * Subscribe to accessibility state changes
   */
  subscribe(listener: (state: AccessibilityState) => void): () => void {
    this.listeners.push(listener);
    // Immediately call with current state
    listener(this.state);

    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Get current accessibility state
   */
  getState(): AccessibilityState {
    return { ...this.state };
  }

  /**
   * Check if screen reader is enabled
   */
  isScreenReaderEnabled(): boolean {
    return this.state.isScreenReaderEnabled;
  }

  /**
   * Check if reduce motion is enabled
   */
  isReduceMotionEnabled(): boolean {
    return this.state.isReduceMotionEnabled;
  }

  /**
   * Check if reduce transparency is enabled
   */
  isReduceTransparencyEnabled(): boolean {
    return this.state.isReduceTransparencyEnabled;
  }

  /**
   * Announce message to screen reader
   */
  announce(message: string, priority: 'low' | 'high' = 'low'): void {
    if (this.state.isScreenReaderEnabled) {
      AccessibilityInfo.announceForAccessibility(message);
    }
  }

  /**
   * Set focus to element (for screen readers)
   */
  setFocus(reactTag: number): void {
    if (this.state.isScreenReaderEnabled) {
      AccessibilityInfo.setAccessibilityFocus(reactTag);
    }
  }
}

// Global accessibility manager instance
export const accessibilityManager = new AccessibilityManager();

/**
 * Hook for accessibility-aware components
 */
export const useAccessibility = () => {
  const [accessibilityState, setAccessibilityState] =
    React.useState<AccessibilityState>(accessibilityManager.getState());

  React.useEffect(() => {
    const unsubscribe = accessibilityManager.subscribe(setAccessibilityState);
    return unsubscribe;
  }, []);

  return {
    ...accessibilityState,
    announce: accessibilityManager.announce.bind(accessibilityManager),
    setFocus: accessibilityManager.setFocus.bind(accessibilityManager),
  };
};

/**
 * Accessibility helpers
 */
export const AccessibilityHelpers = {
  /**
   * Get minimum touch target size
   */
  getMinTouchTargetSize(): { width: number; height: number } {
    return { width: 44, height: 44 }; // iOS HIG and Android guidelines
  },

  /**
   * Get accessible color contrast ratio
   */
  getContrastRatio(foreground: string, background: string): number {
    // Simplified contrast ratio calculation
    // In a real app, you'd use a proper color contrast library
    return 4.5; // Placeholder - should meet WCAG AA standards
  },

  /**
   * Generate accessibility label for complex components
   */
  generateLabel(parts: string[]): string {
    return parts.filter(Boolean).join(', ');
  },

  /**
   * Get accessible animation duration
   */
  getAnimationDuration(defaultDuration: number, reduceMotion: boolean): number {
    return reduceMotion
      ? Math.min(defaultDuration * 0.1, 100)
      : defaultDuration;
  },

  /**
   * Get accessible opacity for overlays
   */
  getOverlayOpacity(
    defaultOpacity: number,
    reduceTransparency: boolean
  ): number {
    return reduceTransparency
      ? Math.min(defaultOpacity + 0.3, 1)
      : defaultOpacity;
  },

  /**
   * Check if text size is large enough
   */
  isTextSizeAccessible(fontSize: number): boolean {
    return fontSize >= 16; // Minimum recommended size
  },

  /**
   * Get accessible font size based on system settings
   */
  getAccessibleFontSize(baseFontSize: number): number {
    // In a real implementation, you'd check system font scale
    const { fontScale } = Dimensions.get('window');
    return baseFontSize * (fontScale || 1);
  },
};

/**
 * Accessibility-aware component props
 */
export interface AccessibleComponentProps {
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: string;
  accessibilityState?: {
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean | 'mixed';
    busy?: boolean;
    expanded?: boolean;
  };
  accessibilityActions?: {
    name: string;
    label?: string;
  }[];
  onAccessibilityAction?: (event: {
    nativeEvent: { actionName: string };
  }) => void;
  accessible?: boolean;
  importantForAccessibility?: 'auto' | 'yes' | 'no' | 'no-hide-descendants';
}

/**
 * Create accessible button props
 */
export const createAccessibleButtonProps = (
  label: string,
  hint?: string,
  disabled?: boolean
): AccessibleComponentProps => ({
  accessible: true,
  accessibilityRole: 'button',
  accessibilityLabel: label,
  accessibilityHint: hint,
  accessibilityState: { disabled: disabled || false },
  importantForAccessibility: 'yes',
});

/**
 * Create accessible text input props
 */
export const createAccessibleTextInputProps = (
  label: string,
  value?: string,
  error?: string
): AccessibleComponentProps => ({
  accessible: true,
  accessibilityRole: 'text',
  accessibilityLabel: label,
  accessibilityValue: { text: value || '' },
  accessibilityHint: error || undefined,
  importantForAccessibility: 'yes',
});

/**
 * Create accessible list item props
 */
export const createAccessibleListItemProps = (
  label: string,
  position?: { index: number; total: number }
): AccessibleComponentProps => ({
  accessible: true,
  accessibilityRole: 'button',
  accessibilityLabel: position
    ? `${label}, ${position.index + 1} of ${position.total}`
    : label,
  importantForAccessibility: 'yes',
});
