// src/services/accessibility/keyboardNavigationService.ts
import { Platform } from 'react-native';
import { logger } from '../monitoring/logger';

interface FocusableElement {
  id: string;
  ref: any;
  tabIndex: number;
  isVisible: boolean;
  isEnabled: boolean;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  onFocus?: () => void;
  onBlur?: () => void;
}

interface KeyboardNavigationConfig {
  enableTabNavigation: boolean;
  enableArrowNavigation: boolean;
  enableEscapeKey: boolean;
  enableEnterKey: boolean;
  enableSpaceKey: boolean;
  trapFocus: boolean;
  autoFocus: boolean;
}

interface FocusTrap {
  id: string;
  elements: FocusableElement[];
  currentIndex: number;
  onEscape?: () => void;
}

class KeyboardNavigationService {
  private config: KeyboardNavigationConfig = {
    enableTabNavigation: true,
    enableArrowNavigation: true,
    enableEscapeKey: true,
    enableEnterKey: true,
    enableSpaceKey: true,
    trapFocus: false,
    autoFocus: true,
  };

  private focusableElements = new Map<string, FocusableElement>();
  private focusTraps = new Map<string, FocusTrap>();
  private currentFocusId: string | null = null;
  private keyboardListeners: Array<() => void> = [];
  private isInitialized = false;

  /**
   * Initialize keyboard navigation service
   */
  initialize(config?: Partial<KeyboardNavigationConfig>): void {
    if (this.isInitialized) return;

    if (config) {
      this.config = { ...this.config, ...config };
    }

    // Only enable on web platform
    if (Platform.OS === 'web') {
      this.setupKeyboardListeners();
    }

    this.isInitialized = true;
    logger.info('accessibility', 'Keyboard navigation service initialized', {
      config: this.config,
      platform: Platform.OS,
    });
  }

  /**
   * Register a focusable element
   */
  registerFocusableElement(element: FocusableElement): void {
    this.focusableElements.set(element.id, element);
    
    logger.debug('accessibility', 'Focusable element registered', {
      id: element.id,
      tabIndex: element.tabIndex,
      totalElements: this.focusableElements.size,
    });
  }

  /**
   * Unregister a focusable element
   */
  unregisterFocusableElement(id: string): void {
    this.focusableElements.delete(id);
    
    if (this.currentFocusId === id) {
      this.currentFocusId = null;
    }

    logger.debug('accessibility', 'Focusable element unregistered', {
      id,
      totalElements: this.focusableElements.size,
    });
  }

  /**
   * Create a focus trap
   */
  createFocusTrap(id: string, elementIds: string[], onEscape?: () => void): void {
    const elements = elementIds
      .map(elementId => this.focusableElements.get(elementId))
      .filter((element): element is FocusableElement => element !== undefined)
      .sort((a, b) => a.tabIndex - b.tabIndex);

    const focusTrap: FocusTrap = {
      id,
      elements,
      currentIndex: 0,
      onEscape,
    };

    this.focusTraps.set(id, focusTrap);

    // Auto-focus first element if enabled
    if (this.config.autoFocus && elements.length > 0) {
      this.focusElement(elements[0].id);
    }

    logger.info('accessibility', 'Focus trap created', {
      id,
      elementCount: elements.length,
    });
  }

  /**
   * Remove a focus trap
   */
  removeFocusTrap(id: string): void {
    this.focusTraps.delete(id);
    logger.info('accessibility', 'Focus trap removed', { id });
  }

  /**
   * Focus an element by ID
   */
  focusElement(id: string): boolean {
    const element = this.focusableElements.get(id);
    if (!element || !element.isVisible || !element.isEnabled) {
      return false;
    }

    try {
      // Blur current element
      if (this.currentFocusId) {
        const currentElement = this.focusableElements.get(this.currentFocusId);
        if (currentElement?.onBlur) {
          currentElement.onBlur();
        }
      }

      // Focus new element
      if (element.ref?.focus) {
        element.ref.focus();
      }

      if (element.onFocus) {
        element.onFocus();
      }

      this.currentFocusId = id;

      logger.debug('accessibility', 'Element focused', { id });
      return true;
    } catch (error) {
      logger.warn('accessibility', 'Failed to focus element', { id, error });
      return false;
    }
  }

  /**
   * Focus next element in tab order
   */
  focusNext(): boolean {
    const visibleElements = this.getVisibleElements();
    if (visibleElements.length === 0) return false;

    const currentIndex = this.currentFocusId 
      ? visibleElements.findIndex(el => el.id === this.currentFocusId)
      : -1;

    const nextIndex = (currentIndex + 1) % visibleElements.length;
    return this.focusElement(visibleElements[nextIndex].id);
  }

  /**
   * Focus previous element in tab order
   */
  focusPrevious(): boolean {
    const visibleElements = this.getVisibleElements();
    if (visibleElements.length === 0) return false;

    const currentIndex = this.currentFocusId 
      ? visibleElements.findIndex(el => el.id === this.currentFocusId)
      : 0;

    const prevIndex = currentIndex === 0 ? visibleElements.length - 1 : currentIndex - 1;
    return this.focusElement(visibleElements[prevIndex].id);
  }

  /**
   * Focus first element
   */
  focusFirst(): boolean {
    const visibleElements = this.getVisibleElements();
    if (visibleElements.length === 0) return false;

    return this.focusElement(visibleElements[0].id);
  }

  /**
   * Focus last element
   */
  focusLast(): boolean {
    const visibleElements = this.getVisibleElements();
    if (visibleElements.length === 0) return false;

    return this.focusElement(visibleElements[visibleElements.length - 1].id);
  }

  /**
   * Handle arrow key navigation
   */
  handleArrowNavigation(direction: 'up' | 'down' | 'left' | 'right'): boolean {
    if (!this.config.enableArrowNavigation || !this.currentFocusId) {
      return false;
    }

    const currentElement = this.focusableElements.get(this.currentFocusId);
    if (!currentElement) return false;

    const visibleElements = this.getVisibleElements();
    const targetElement = this.findElementInDirection(currentElement, direction, visibleElements);

    if (targetElement) {
      return this.focusElement(targetElement.id);
    }

    return false;
  }

  /**
   * Get visible and enabled elements sorted by tab index
   */
  private getVisibleElements(): FocusableElement[] {
    return Array.from(this.focusableElements.values())
      .filter(element => element.isVisible && element.isEnabled)
      .sort((a, b) => a.tabIndex - b.tabIndex);
  }

  /**
   * Find element in a specific direction
   */
  private findElementInDirection(
    currentElement: FocusableElement,
    direction: 'up' | 'down' | 'left' | 'right',
    elements: FocusableElement[]
  ): FocusableElement | null {
    const currentBounds = currentElement.bounds;
    let bestElement: FocusableElement | null = null;
    let bestDistance = Infinity;

    for (const element of elements) {
      if (element.id === currentElement.id) continue;

      const elementBounds = element.bounds;
      let isInDirection = false;
      let distance = 0;

      switch (direction) {
        case 'up':
          isInDirection = elementBounds.y < currentBounds.y;
          distance = currentBounds.y - elementBounds.y;
          break;
        case 'down':
          isInDirection = elementBounds.y > currentBounds.y;
          distance = elementBounds.y - currentBounds.y;
          break;
        case 'left':
          isInDirection = elementBounds.x < currentBounds.x;
          distance = currentBounds.x - elementBounds.x;
          break;
        case 'right':
          isInDirection = elementBounds.x > currentBounds.x;
          distance = elementBounds.x - currentBounds.x;
          break;
      }

      if (isInDirection && distance < bestDistance) {
        bestDistance = distance;
        bestElement = element;
      }
    }

    return bestElement;
  }

  /**
   * Set up keyboard event listeners
   */
  private setupKeyboardListeners(): void {
    if (typeof window === 'undefined') return;

    const handleKeyDown = (event: KeyboardEvent) => {
      this.handleKeyboardEvent(event);
    };

    window.addEventListener('keydown', handleKeyDown);
    this.keyboardListeners.push(() => {
      window.removeEventListener('keydown', handleKeyDown);
    });
  }

  /**
   * Handle keyboard events
   */
  private handleKeyboardEvent(event: KeyboardEvent): void {
    const { key, shiftKey, ctrlKey, metaKey, altKey } = event;

    // Skip if modifier keys are pressed (except Shift for Tab)
    if ((ctrlKey || metaKey || altKey) && !(key === 'Tab' && shiftKey)) {
      return;
    }

    let handled = false;

    switch (key) {
      case 'Tab':
        if (this.config.enableTabNavigation) {
          event.preventDefault();
          handled = shiftKey ? this.focusPrevious() : this.focusNext();
        }
        break;

      case 'ArrowUp':
        if (this.config.enableArrowNavigation) {
          event.preventDefault();
          handled = this.handleArrowNavigation('up');
        }
        break;

      case 'ArrowDown':
        if (this.config.enableArrowNavigation) {
          event.preventDefault();
          handled = this.handleArrowNavigation('down');
        }
        break;

      case 'ArrowLeft':
        if (this.config.enableArrowNavigation) {
          event.preventDefault();
          handled = this.handleArrowNavigation('left');
        }
        break;

      case 'ArrowRight':
        if (this.config.enableArrowNavigation) {
          event.preventDefault();
          handled = this.handleArrowNavigation('right');
        }
        break;

      case 'Escape':
        if (this.config.enableEscapeKey) {
          handled = this.handleEscapeKey();
        }
        break;

      case 'Home':
        event.preventDefault();
        handled = this.focusFirst();
        break;

      case 'End':
        event.preventDefault();
        handled = this.focusLast();
        break;
    }

    if (handled) {
      logger.debug('accessibility', 'Keyboard navigation handled', {
        key,
        shiftKey,
        currentFocus: this.currentFocusId,
      });
    }
  }

  /**
   * Handle escape key press
   */
  private handleEscapeKey(): boolean {
    // Check if we're in a focus trap
    for (const focusTrap of this.focusTraps.values()) {
      if (focusTrap.onEscape) {
        focusTrap.onEscape();
        return true;
      }
    }

    return false;
  }

  /**
   * Update element bounds
   */
  updateElementBounds(id: string, bounds: FocusableElement['bounds']): void {
    const element = this.focusableElements.get(id);
    if (element) {
      element.bounds = bounds;
    }
  }

  /**
   * Update element visibility
   */
  updateElementVisibility(id: string, isVisible: boolean): void {
    const element = this.focusableElements.get(id);
    if (element) {
      element.isVisible = isVisible;
    }
  }

  /**
   * Update element enabled state
   */
  updateElementEnabled(id: string, isEnabled: boolean): void {
    const element = this.focusableElements.get(id);
    if (element) {
      element.isEnabled = isEnabled;
    }
  }

  /**
   * Get current focus ID
   */
  getCurrentFocusId(): string | null {
    return this.currentFocusId;
  }

  /**
   * Check if element is focused
   */
  isElementFocused(id: string): boolean {
    return this.currentFocusId === id;
  }

  /**
   * Cleanup service
   */
  cleanup(): void {
    // Remove all keyboard listeners
    for (const removeListener of this.keyboardListeners) {
      removeListener();
    }
    this.keyboardListeners = [];

    // Clear all data
    this.focusableElements.clear();
    this.focusTraps.clear();
    this.currentFocusId = null;
    this.isInitialized = false;

    logger.info('accessibility', 'Keyboard navigation service cleaned up');
  }
}

export const keyboardNavigationService = new KeyboardNavigationService();

// Export types
export type { FocusableElement, KeyboardNavigationConfig, FocusTrap };
