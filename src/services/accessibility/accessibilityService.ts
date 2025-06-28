// src/services/accessibility/accessibilityService.ts
import { Platform, AccessibilityInfo, Dimensions } from 'react-native';
import { MMKV } from 'react-native-mmkv';
import { logger } from '../monitoring/logger';

interface AccessibilityConfig {
  enableScreenReader: boolean;
  enableHighContrast: boolean;
  enableLargeText: boolean;
  enableReducedMotion: boolean;
  enableKeyboardNavigation: boolean;
  enableVoiceNavigation: boolean;
  enableSemanticDescriptions: boolean;
  enableContextualAnnouncements: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  colorScheme: 'light' | 'dark' | 'high-contrast';
  voiceNavigationLanguage: 'en' | 'es' | 'fr' | 'de';
}

interface AccessibilityState {
  isScreenReaderEnabled: boolean;
  isReduceMotionEnabled: boolean;
  isReduceTransparencyEnabled: boolean;
  isBoldTextEnabled: boolean;
  isGrayscaleEnabled: boolean;
  isInvertColorsEnabled: boolean;
  prefersCrossFadeTransitions: boolean;
}

interface ColorContrastRatio {
  ratio: number;
  level: 'AA' | 'AAA' | 'fail';
  isAccessible: boolean;
}

class AccessibilityService {
  private storage: MMKV;
  private config: AccessibilityConfig;
  private state: AccessibilityState = {
    isScreenReaderEnabled: false,
    isReduceMotionEnabled: false,
    isReduceTransparencyEnabled: false,
    isBoldTextEnabled: false,
    isGrayscaleEnabled: false,
    isInvertColorsEnabled: false,
    prefersCrossFadeTransitions: false,
  };
  private listeners: Array<(config: AccessibilityConfig) => void> = [];

  constructor() {
    this.storage = new MMKV({
      id: 'accessibility-settings',
      encryptionKey: 'accessibility-key',
    });

    this.config = this.loadConfig();
  }

  /**
   * Initialize accessibility service
   */
  async initialize(): Promise<void> {
    try {
      // Detect system accessibility settings
      await this.detectSystemSettings();

      // Set up accessibility listeners
      this.setupAccessibilityListeners();

      // Apply current configuration
      this.applyConfiguration();

      logger.info('accessibility', 'Accessibility service initialized', {
        config: this.config,
        state: this.state,
      });
    } catch (error) {
      logger.error(
        'accessibility',
        'Failed to initialize accessibility service',
        error
      );
    }
  }

  /**
   * Get current accessibility configuration
   */
  getConfig(): AccessibilityConfig {
    return { ...this.config };
  }

  /**
   * Update accessibility configuration
   */
  updateConfig(updates: Partial<AccessibilityConfig>): void {
    this.config = { ...this.config, ...updates };
    this.saveConfig();
    this.applyConfiguration();
    this.notifyListeners();

    logger.info('accessibility', 'Accessibility configuration updated', {
      updates,
      newConfig: this.config,
    });
  }

  /**
   * Get current accessibility state
   */
  getState(): AccessibilityState {
    return { ...this.state };
  }

  /**
   * Subscribe to configuration changes
   */
  subscribe(listener: (config: AccessibilityConfig) => void): () => void {
    this.listeners.push(listener);

    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Check color contrast ratio
   */
  checkColorContrast(
    foreground: string,
    background: string
  ): ColorContrastRatio {
    const ratio = this.calculateContrastRatio(foreground, background);

    let level: 'AA' | 'AAA' | 'fail';
    let isAccessible: boolean;

    if (ratio >= 7) {
      level = 'AAA';
      isAccessible = true;
    } else if (ratio >= 4.5) {
      level = 'AA';
      isAccessible = true;
    } else {
      level = 'fail';
      isAccessible = false;
    }

    return { ratio, level, isAccessible };
  }

  /**
   * Get accessible color palette
   */
  getAccessibleColors(): Record<string, string> {
    if (this.config.colorScheme === 'high-contrast') {
      return {
        primary: '#000000',
        secondary: '#FFFFFF',
        background: '#FFFFFF',
        surface: '#F5F5F5',
        text: '#000000',
        textSecondary: '#333333',
        border: '#000000',
        error: '#D32F2F',
        warning: '#F57C00',
        success: '#388E3C',
        info: '#1976D2',
      };
    } else if (this.config.colorScheme === 'dark') {
      return {
        primary: '#BB86FC',
        secondary: '#03DAC6',
        background: '#121212',
        surface: '#1E1E1E',
        text: '#FFFFFF',
        textSecondary: '#B3B3B3',
        border: '#333333',
        error: '#CF6679',
        warning: '#FFB74D',
        success: '#81C784',
        info: '#64B5F6',
      };
    } else {
      return {
        primary: '#6200EE',
        secondary: '#03DAC6',
        background: '#FFFFFF',
        surface: '#F5F5F5',
        text: '#000000',
        textSecondary: '#666666',
        border: '#E0E0E0',
        error: '#B00020',
        warning: '#FF6F00',
        success: '#00C853',
        info: '#2196F3',
      };
    }
  }

  /**
   * Get font size multiplier
   */
  getFontSizeMultiplier(): number {
    switch (this.config.fontSize) {
      case 'small':
        return 0.85;
      case 'medium':
        return 1.0;
      case 'large':
        return 1.15;
      case 'extra-large':
        return 1.3;
      default:
        return 1.0;
    }
  }

  /**
   * Get accessible font sizes
   */
  getAccessibleFontSizes(): Record<string, number> {
    const multiplier = this.getFontSizeMultiplier();
    const baseSizes = {
      xs: 12,
      sm: 14,
      base: 16,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      xxxl: 30,
      xxxxl: 36,
    };

    const accessibleSizes: Record<string, number> = {};
    for (const [key, size] of Object.entries(baseSizes)) {
      accessibleSizes[key] = Math.round(size * multiplier);
    }

    return accessibleSizes;
  }

  /**
   * Check if animations should be reduced
   */
  shouldReduceMotion(): boolean {
    return this.state.isReduceMotionEnabled || this.config.enableReducedMotion;
  }

  /**
   * Get animation duration multiplier
   */
  getAnimationDurationMultiplier(): number {
    return this.shouldReduceMotion() ? 0.1 : 1.0;
  }

  /**
   * Generate accessibility announcement
   */
  announceForScreenReader(
    message: string,
    priority: 'low' | 'high' = 'low'
  ): void {
    if (!this.state.isScreenReaderEnabled) return;

    try {
      if (Platform.OS === 'ios') {
        AccessibilityInfo.announceForAccessibility(message);
      } else if (Platform.OS === 'android') {
        AccessibilityInfo.announceForAccessibility(message);
      }

      logger.debug('accessibility', 'Screen reader announcement', {
        message,
        priority,
      });
    } catch (error) {
      logger.warn('accessibility', 'Failed to announce for screen reader', {
        error,
      }

  /**
   * Generate semantic description for complex interactions
   */
  generateInteractionDescription(interaction: {
    type: 'warning' | 'caution' | 'info' | 'critical';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    affectedProducts?: string[];
    recommendations?: string[];
  }): {
    accessibilityLabel: string;
    accessibilityHint: string;
    accessibilityRole: string;
  } {
    const severityDescriptions = {
      low: 'minor concern',
      medium: 'moderate concern',
      high: 'important warning',
      critical: 'critical alert'
    };

    const typeDescriptions = {
      warning: 'Safety warning',
      caution: 'Caution notice',
      info: 'Information',
      critical: 'Critical alert'
    };

    const label = `${typeDescriptions[interaction.type]}: ${severityDescriptions[interaction.severity]}. ${interaction.description}`;

    let hint = 'Double tap to view detailed safety information';
    if (interaction.affectedProducts?.length) {
      hint += `. Affects ${interaction.affectedProducts.length} product${interaction.affectedProducts.length > 1 ? 's' : ''}`;
    }
    if (interaction.recommendations?.length) {
      hint += `. ${interaction.recommendations.length} recommendation${interaction.recommendations.length > 1 ? 's' : ''} available`;
    }

    return {
      accessibilityLabel: label,
      accessibilityHint: hint,
      accessibilityRole: interaction.severity === 'critical' ? 'alert' : 'button',
    };
  }

  /**
   * Generate semantic description for product analysis results
   */
  generateProductAnalysisDescription(analysis: {
    productName: string;
    score: number;
    riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
    interactions: number;
    benefits: number;
    warnings: number;
  }): {
    accessibilityLabel: string;
    accessibilityHint: string;
    accessibilityValue: { text: string };
  } {
    const riskDescriptions = {
      LOW: 'low risk',
      MODERATE: 'moderate risk',
      HIGH: 'high risk',
      CRITICAL: 'critical risk'
    };

    const scoreDescription = analysis.score >= 80 ? 'excellent' :
                           analysis.score >= 60 ? 'good' :
                           analysis.score >= 40 ? 'fair' : 'poor';

    const label = `${analysis.productName} analysis: ${scoreDescription} score of ${analysis.score} out of 100, ${riskDescriptions[analysis.riskLevel]}`;

    const details = [];
    if (analysis.interactions > 0) details.push(`${analysis.interactions} interaction${analysis.interactions > 1 ? 's' : ''}`);
    if (analysis.benefits > 0) details.push(`${analysis.benefits} benefit${analysis.benefits > 1 ? 's' : ''}`);
    if (analysis.warnings > 0) details.push(`${analysis.warnings} warning${analysis.warnings > 1 ? 's' : ''}`);

    const hint = details.length > 0 ?
      `Found ${details.join(', ')}. Double tap to view detailed analysis` :
      'Double tap to view detailed analysis';

    return {
      accessibilityLabel: label,
      accessibilityHint: hint,
      accessibilityValue: { text: `Score: ${analysis.score}, Risk: ${riskDescriptions[analysis.riskLevel]}` },
    };
  }

  /**
   * Generate contextual announcement for navigation
   */
  announceNavigationContext(context: {
    screenName: string;
    itemCount?: number;
    selectedItem?: string;
    availableActions?: string[];
  }): void {
    if (!this.config.enableContextualAnnouncements || !this.state.isScreenReaderEnabled) return;

    let announcement = `Navigated to ${context.screenName}`;

    if (context.itemCount !== undefined) {
      announcement += `. ${context.itemCount} item${context.itemCount !== 1 ? 's' : ''} available`;
    }

    if (context.selectedItem) {
      announcement += `. Currently selected: ${context.selectedItem}`;
    }

    if (context.availableActions?.length) {
      announcement += `. Available actions: ${context.availableActions.join(', ')}`;
    }

    this.announceForScreenReader(announcement, 'low');
  }

  /**
   * Generate semantic description for stack management
   */
  generateStackDescription(stack: {
    totalItems: number;
    interactions: number;
    riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
    lastUpdated?: string;
  }): {
    accessibilityLabel: string;
    accessibilityHint: string;
  } {
    const riskDescriptions = {
      LOW: 'low risk',
      MODERATE: 'moderate risk',
      HIGH: 'high risk',
      CRITICAL: 'critical risk'
    };

    const label = `Your supplement stack: ${stack.totalItems} item${stack.totalItems !== 1 ? 's' : ''}, ${riskDescriptions[stack.riskLevel]}`;

    let hint = `${stack.interactions} interaction${stack.interactions !== 1 ? 's' : ''} detected. Double tap to manage your stack`;

    if (stack.lastUpdated) {
      hint += `. Last updated ${stack.lastUpdated}`;
    }

    return {
      accessibilityLabel: label,
      accessibilityHint: hint,
    };
  });
    }
  }

  /**
   * Detect system accessibility settings
   */
  private async detectSystemSettings(): Promise<void> {
    try {
      // Check screen reader
      this.state.isScreenReaderEnabled =
        await AccessibilityInfo.isScreenReaderEnabled();

      // Check reduce motion (iOS only)
      if (Platform.OS === 'ios') {
        this.state.isReduceMotionEnabled =
          await AccessibilityInfo.isReduceMotionEnabled();
        this.state.isReduceTransparencyEnabled =
          await AccessibilityInfo.isReduceTransparencyEnabled();
        this.state.isBoldTextEnabled =
          await AccessibilityInfo.isBoldTextEnabled();
        this.state.isGrayscaleEnabled =
          await AccessibilityInfo.isGrayscaleEnabled();
        this.state.isInvertColorsEnabled =
          await AccessibilityInfo.isInvertColorsEnabled();
        this.state.prefersCrossFadeTransitions =
          await AccessibilityInfo.prefersCrossFadeTransitions();
      }

      logger.debug(
        'accessibility',
        'System accessibility settings detected',
        this.state
      );
    } catch (error) {
      logger.warn('accessibility', 'Failed to detect system settings', {
        error,
      });
    }
  }

  /**
   * Set up accessibility listeners
   */
  private setupAccessibilityListeners(): void {
    // Listen for screen reader changes
    AccessibilityInfo.addEventListener('screenReaderChanged', isEnabled => {
      this.state.isScreenReaderEnabled = isEnabled;
      logger.info('accessibility', 'Screen reader state changed', {
        isEnabled,
      });
    });

    // Listen for reduce motion changes (iOS only)
    if (Platform.OS === 'ios') {
      AccessibilityInfo.addEventListener('reduceMotionChanged', isEnabled => {
        this.state.isReduceMotionEnabled = isEnabled;
        logger.info('accessibility', 'Reduce motion state changed', {
          isEnabled,
        });
      });

      AccessibilityInfo.addEventListener('boldTextChanged', isEnabled => {
        this.state.isBoldTextEnabled = isEnabled;
        logger.info('accessibility', 'Bold text state changed', { isEnabled });
      });
    }
  }

  /**
   * Apply current configuration
   */
  private applyConfiguration(): void {
    // Apply font size changes
    if (this.config.enableLargeText) {
      // This would typically involve updating a theme provider
      logger.debug('accessibility', 'Large text enabled');
    }

    // Apply high contrast
    if (this.config.enableHighContrast) {
      this.config.colorScheme = 'high-contrast';
      logger.debug('accessibility', 'High contrast enabled');
    }

    // Apply reduced motion
    if (this.config.enableReducedMotion) {
      logger.debug('accessibility', 'Reduced motion enabled');
    }
  }

  /**
   * Calculate contrast ratio between two colors
   */
  private calculateContrastRatio(color1: string, color2: string): number {
    const luminance1 = this.getLuminance(color1);
    const luminance2 = this.getLuminance(color2);

    const lighter = Math.max(luminance1, luminance2);
    const darker = Math.min(luminance1, luminance2);

    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Get luminance of a color
   */
  private getLuminance(color: string): number {
    // Convert hex to RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    // Apply gamma correction
    const rs = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
    const gs = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
    const bs = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

    // Calculate luminance
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  /**
   * Load configuration from storage
   */
  private loadConfig(): AccessibilityConfig {
    try {
      const stored = this.storage.getString('config');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      logger.warn('accessibility', 'Failed to load config', { error });
    }

    // Return default configuration
    return {
      enableScreenReader: false,
      enableHighContrast: false,
      enableLargeText: false,
      enableReducedMotion: false,
      enableKeyboardNavigation: true,
      fontSize: 'medium',
      colorScheme: 'light',
    };
  }

  /**
   * Save configuration to storage
   */
  private saveConfig(): void {
    try {
      this.storage.set('config', JSON.stringify(this.config));
    } catch (error) {
      logger.error('accessibility', 'Failed to save config', error);
    }
  }

  /**
   * Notify listeners of configuration changes
   */
  private notifyListeners(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.config);
      } catch (error) {
        logger.warn('accessibility', 'Listener notification failed', { error });
      }
    }
  }
}

export const accessibilityService = new AccessibilityService();

// Export types
export type { AccessibilityConfig, AccessibilityState, ColorContrastRatio };
