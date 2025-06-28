// src/services/accessibility/index.ts
export { accessibilityService } from './accessibilityService';
export { voiceNavigationService } from './voiceNavigationService';
export { keyboardNavigationService } from './keyboardNavigationService';

export type {
  AccessibilityConfig,
  AccessibilityState,
  ColorContrastRatio,
} from './accessibilityService';
export type {
  FocusableElement,
  KeyboardNavigationConfig,
  FocusTrap,
} from './keyboardNavigationService';

// Initialize accessibility services
import { accessibilityService } from './accessibilityService';
import { keyboardNavigationService } from './keyboardNavigationService';
import { logger } from '../monitoring/logger';

/**
 * Initialize all accessibility services
 */
export const initializeAccessibilityServices = async (config: {
  enableScreenReader?: boolean;
  enableHighContrast?: boolean;
  enableLargeText?: boolean;
  enableReducedMotion?: boolean;
  enableKeyboardNavigation?: boolean;
  fontSize?: 'small' | 'medium' | 'large' | 'extra-large';
  colorScheme?: 'light' | 'dark' | 'high-contrast';
}) => {
  try {
    logger.info('accessibility', 'Initializing accessibility services', config);

    // Initialize accessibility service
    await accessibilityService.initialize();

    // Update configuration if provided
    if (Object.keys(config).length > 0) {
      accessibilityService.updateConfig({
        enableScreenReader: config.enableScreenReader || false,
        enableHighContrast: config.enableHighContrast || false,
        enableLargeText: config.enableLargeText || false,
        enableReducedMotion: config.enableReducedMotion || false,
        enableKeyboardNavigation: config.enableKeyboardNavigation !== false,
        fontSize: config.fontSize || 'medium',
        colorScheme: config.colorScheme || 'light',
      });
    }

    // Initialize keyboard navigation
    keyboardNavigationService.initialize({
      enableTabNavigation: true,
      enableArrowNavigation: true,
      enableEscapeKey: true,
      autoFocus: true,
    });

    logger.info(
      'accessibility',
      'Accessibility services initialized successfully'
    );
    return true;
  } catch (error) {
    logger.error(
      'accessibility',
      'Failed to initialize accessibility services',
      error
    );
    return false;
  }
};

/**
 * Get accessibility status and metrics
 */
export const getAccessibilityStatus = () => {
  const config = accessibilityService.getConfig();
  const state = accessibilityService.getState();

  return {
    config,
    state,
    colors: accessibilityService.getAccessibleColors(),
    fontSizes: accessibilityService.getAccessibleFontSizes(),
    fontSizeMultiplier: accessibilityService.getFontSizeMultiplier(),
    shouldReduceMotion: accessibilityService.shouldReduceMotion(),
    currentFocus: keyboardNavigationService.getCurrentFocusId(),
    timestamp: new Date().toISOString(),
  };
};

/**
 * Perform accessibility audit
 */
export const performAccessibilityAudit = () => {
  const issues: string[] = [];
  const recommendations: string[] = [];

  const config = accessibilityService.getConfig();
  const state = accessibilityService.getState();

  // Check for common accessibility issues
  if (!config.enableScreenReader && state.isScreenReaderEnabled) {
    issues.push('Screen reader is enabled but app support is disabled');
    recommendations.push(
      'Enable screen reader support in accessibility settings'
    );
  }

  if (!config.enableReducedMotion && state.isReduceMotionEnabled) {
    issues.push('Reduce motion is enabled but app support is disabled');
    recommendations.push(
      'Enable reduced motion support in accessibility settings'
    );
  }

  if (config.colorScheme === 'light' && state.isInvertColorsEnabled) {
    issues.push('Colors are inverted but app is using light theme');
    recommendations.push('Consider switching to high contrast or dark theme');
  }

  // Check color contrast for common color combinations
  const colors = accessibilityService.getAccessibleColors();
  const primaryContrast = accessibilityService.checkColorContrast(
    colors.primary,
    colors.background
  );
  if (!primaryContrast.isAccessible) {
    issues.push(
      `Primary color contrast ratio is too low: ${primaryContrast.ratio.toFixed(2)}`
    );
    recommendations.push(
      'Increase contrast between primary color and background'
    );
  }

  const textContrast = accessibilityService.checkColorContrast(
    colors.text,
    colors.background
  );
  if (!textContrast.isAccessible) {
    issues.push(
      `Text contrast ratio is too low: ${textContrast.ratio.toFixed(2)}`
    );
    recommendations.push(
      'Increase contrast between text and background colors'
    );
  }

  // Calculate accessibility score
  let score = 100;
  score -= issues.length * 10; // Deduct 10 points per issue
  score = Math.max(0, score);

  return {
    score,
    issues,
    recommendations,
    config,
    state,
    timestamp: new Date().toISOString(),
  };
};
