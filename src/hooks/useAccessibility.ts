// src/hooks/useAccessibility.ts
import { useState, useEffect, useCallback } from 'react';
import { Platform, AccessibilityInfo } from 'react-native';
import { accessibilityService, AccessibilityConfig, AccessibilityState } from '../services/accessibility/accessibilityService';

interface AccessibilityHook {
  config: AccessibilityConfig;
  state: AccessibilityState;
  colors: Record<string, string>;
  fontSizes: Record<string, number>;
  fontSizeMultiplier: number;
  animationDurationMultiplier: number;
  shouldReduceMotion: boolean;
  isScreenReaderEnabled: boolean;
  
  // Actions
  updateConfig: (updates: Partial<AccessibilityConfig>) => void;
  announceForScreenReader: (message: string, priority?: 'low' | 'high') => void;
  checkColorContrast: (foreground: string, background: string) => { ratio: number; isAccessible: boolean };
  
  // Accessibility helpers
  getAccessibilityProps: (options: AccessibilityPropsOptions) => AccessibilityProps;
  getFocusableProps: (options?: FocusablePropsOptions) => FocusableProps;
  getSemanticProps: (role: SemanticRole, options?: SemanticPropsOptions) => SemanticProps;
}

interface AccessibilityPropsOptions {
  label: string;
  hint?: string;
  role?: 'button' | 'link' | 'text' | 'image' | 'header' | 'list' | 'listitem';
  state?: {
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean;
    expanded?: boolean;
    busy?: boolean;
  };
  value?: {
    min?: number;
    max?: number;
    now?: number;
    text?: string;
  };
  actions?: {
    name: string;
    label: string;
  }[];
}

interface AccessibilityProps {
  accessible: boolean;
  accessibilityLabel: string;
  accessibilityHint?: string;
  accessibilityRole?: string;
  accessibilityState?: any;
  accessibilityValue?: any;
  accessibilityActions?: any[];
  onAccessibilityAction?: (event: any) => void;
}

interface FocusablePropsOptions {
  autoFocus?: boolean;
  tabIndex?: number;
  onFocus?: () => void;
  onBlur?: () => void;
}

interface FocusableProps {
  focusable?: boolean;
  accessibilityElementsHidden?: boolean;
  importantForAccessibility?: 'auto' | 'yes' | 'no' | 'no-hide-descendants';
  onFocus?: () => void;
  onBlur?: () => void;
}

interface SemanticRole {
  type: 'navigation' | 'main' | 'complementary' | 'banner' | 'contentinfo' | 'form' | 'search';
  level?: number;
}

interface SemanticPropsOptions {
  label?: string;
  describedBy?: string;
  labelledBy?: string;
}

interface SemanticProps {
  accessibilityRole?: string;
  accessibilityLabel?: string;
  accessibilityLabelledBy?: string;
  accessibilityDescribedBy?: string;
  accessibilityLevel?: number;
}

export const useAccessibility = (): AccessibilityHook => {
  const [config, setConfig] = useState<AccessibilityConfig>(accessibilityService.getConfig());
  const [state, setState] = useState<AccessibilityState>(accessibilityService.getState());

  // Update local state when service configuration changes
  useEffect(() => {
    const unsubscribe = accessibilityService.subscribe((newConfig) => {
      setConfig(newConfig);
      setState(accessibilityService.getState());
    });

    return unsubscribe;
  }, []);

  // Initialize accessibility service
  useEffect(() => {
    accessibilityService.initialize();
  }, []);

  // Update configuration
  const updateConfig = useCallback((updates: Partial<AccessibilityConfig>) => {
    accessibilityService.updateConfig(updates);
  }, []);

  // Announce for screen reader
  const announceForScreenReader = useCallback((message: string, priority: 'low' | 'high' = 'low') => {
    accessibilityService.announceForScreenReader(message, priority);
  }, []);

  // Check color contrast
  const checkColorContrast = useCallback((foreground: string, background: string) => {
    const result = accessibilityService.checkColorContrast(foreground, background);
    return {
      ratio: result.ratio,
      isAccessible: result.isAccessible,
    };
  }, []);

  // Get accessibility props for components
  const getAccessibilityProps = useCallback((options: AccessibilityPropsOptions): AccessibilityProps => {
    const props: AccessibilityProps = {
      accessible: true,
      accessibilityLabel: options.label,
    };

    if (options.hint) {
      props.accessibilityHint = options.hint;
    }

    if (options.role) {
      props.accessibilityRole = options.role;
    }

    if (options.state) {
      props.accessibilityState = options.state;
    }

    if (options.value) {
      props.accessibilityValue = options.value;
    }

    if (options.actions) {
      props.accessibilityActions = options.actions.map(action => ({
        name: action.name,
        label: action.label,
      }));
    }

    return props;
  }, []);

  // Get focusable props
  const getFocusableProps = useCallback((options: FocusablePropsOptions = {}): FocusableProps => {
    const props: FocusableProps = {
      focusable: true,
      importantForAccessibility: 'yes',
    };

    if (Platform.OS === 'web') {
      // Web-specific focus handling
      if (options.tabIndex !== undefined) {
        (props as any).tabIndex = options.tabIndex;
      }
    }

    if (options.onFocus) {
      props.onFocus = options.onFocus;
    }

    if (options.onBlur) {
      props.onBlur = options.onBlur;
    }

    return props;
  }, []);

  // Get semantic props for landmarks
  const getSemanticProps = useCallback((role: SemanticRole, options: SemanticPropsOptions = {}): SemanticProps => {
    const props: SemanticProps = {};

    // Map semantic roles to accessibility roles
    switch (role.type) {
      case 'navigation':
        props.accessibilityRole = 'navigation';
        break;
      case 'main':
        props.accessibilityRole = 'main';
        break;
      case 'banner':
        props.accessibilityRole = 'banner';
        break;
      case 'contentinfo':
        props.accessibilityRole = 'contentinfo';
        break;
      case 'form':
        props.accessibilityRole = 'form';
        break;
      case 'search':
        props.accessibilityRole = 'search';
        break;
      case 'complementary':
        props.accessibilityRole = 'complementary';
        break;
    }

    if (options.label) {
      props.accessibilityLabel = options.label;
    }

    if (options.labelledBy) {
      props.accessibilityLabelledBy = options.labelledBy;
    }

    if (options.describedBy) {
      props.accessibilityDescribedBy = options.describedBy;
    }

    if (role.level) {
      props.accessibilityLevel = role.level;
    }

    return props;
  }, []);

  // Derived values
  const colors = accessibilityService.getAccessibleColors();
  const fontSizes = accessibilityService.getAccessibleFontSizes();
  const fontSizeMultiplier = accessibilityService.getFontSizeMultiplier();
  const animationDurationMultiplier = accessibilityService.getAnimationDurationMultiplier();
  const shouldReduceMotion = accessibilityService.shouldReduceMotion();
  const isScreenReaderEnabled = state.isScreenReaderEnabled;

  return {
    config,
    state,
    colors,
    fontSizes,
    fontSizeMultiplier,
    animationDurationMultiplier,
    shouldReduceMotion,
    isScreenReaderEnabled,
    updateConfig,
    announceForScreenReader,
    checkColorContrast,
    getAccessibilityProps,
    getFocusableProps,
    getSemanticProps,
  };
};

// Export types
export type {
  AccessibilityHook,
  AccessibilityPropsOptions,
  AccessibilityProps,
  FocusablePropsOptions,
  FocusableProps,
  SemanticRole,
  SemanticPropsOptions,
  SemanticProps,
};
