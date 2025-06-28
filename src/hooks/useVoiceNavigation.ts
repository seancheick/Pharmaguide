// src/hooks/useVoiceNavigation.ts
import { useEffect, useState, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { voiceNavigationService } from '../services/accessibility/voiceNavigationService';
import { useAccessibility } from './useAccessibility';
import { logger } from '../services/monitoring/logger';

interface VoiceNavigationHookOptions {
  enableAutoStart?: boolean;
  customCommands?: Array<{
    id: string;
    phrases: string[];
    action: () => void | Promise<void>;
    description: string;
    category?: 'navigation' | 'action' | 'information' | 'accessibility';
  }>;
  onCommandExecuted?: (commandId: string, transcript: string) => void;
  onError?: (error: Error) => void;
}

interface VoiceNavigationState {
  isSupported: boolean;
  isEnabled: boolean;
  isListening: boolean;
  isInitialized: boolean;
  availableCommands: number;
  lastCommand?: string;
  error?: string;
}

/**
 * Voice Navigation Hook
 * Provides easy integration of voice commands in React components
 */
export const useVoiceNavigation = (options: VoiceNavigationHookOptions = {}) => {
  const navigation = useNavigation();
  const { isScreenReaderEnabled } = useAccessibility();
  const [state, setState] = useState<VoiceNavigationState>({
    isSupported: false,
    isEnabled: false,
    isListening: false,
    isInitialized: false,
    availableCommands: 0,
  });

  const optionsRef = useRef(options);
  optionsRef.current = options;

  /**
   * Initialize voice navigation
   */
  const initialize = useCallback(async () => {
    try {
      const isSupported = voiceNavigationService.isSupported();
      
      if (!isSupported) {
        setState(prev => ({ 
          ...prev, 
          isSupported: false, 
          error: 'Voice navigation not supported on this platform' 
        }));
        return;
      }

      await voiceNavigationService.initialize(
        {
          enabled: true,
          language: 'en',
          confidenceThreshold: 0.7,
          enableVoiceFeedback: isScreenReaderEnabled,
          enableContinuousListening: false,
        },
        navigation
      );

      // Register custom commands
      if (optionsRef.current.customCommands) {
        optionsRef.current.customCommands.forEach(command => {
          voiceNavigationService.registerCommand(command.id, {
            phrases: command.phrases,
            action: async () => {
              try {
                await command.action();
                optionsRef.current.onCommandExecuted?.(command.id, '');
              } catch (error) {
                logger.error('accessibility', 'Custom voice command failed', error);
                optionsRef.current.onError?.(error as Error);
              }
            },
            description: command.description,
            category: command.category || 'action',
            enabled: true,
          });
        });
      }

      const commands = voiceNavigationService.getAvailableCommands();
      
      setState(prev => ({
        ...prev,
        isSupported: true,
        isInitialized: true,
        isEnabled: true,
        availableCommands: commands.length,
        error: undefined,
      }));

      // Auto-start if requested
      if (optionsRef.current.enableAutoStart) {
        await startListening();
      }

      logger.info('accessibility', 'Voice navigation hook initialized', {
        commandCount: commands.length,
        autoStart: optionsRef.current.enableAutoStart,
      });

    } catch (error) {
      logger.error('accessibility', 'Failed to initialize voice navigation hook', error);
      setState(prev => ({ 
        ...prev, 
        error: (error as Error).message,
        isInitialized: false,
      }));
      optionsRef.current.onError?.(error as Error);
    }
  }, [navigation, isScreenReaderEnabled]);

  /**
   * Start listening for voice commands
   */
  const startListening = useCallback(async () => {
    if (!state.isSupported || !state.isInitialized) {
      logger.warn('accessibility', 'Cannot start voice listening - not supported or initialized');
      return;
    }

    try {
      await voiceNavigationService.startListening();
      setState(prev => ({ ...prev, isListening: true, error: undefined }));
      logger.debug('accessibility', 'Voice listening started via hook');
    } catch (error) {
      logger.error('accessibility', 'Failed to start voice listening', error);
      setState(prev => ({ ...prev, error: (error as Error).message }));
      optionsRef.current.onError?.(error as Error);
    }
  }, [state.isSupported, state.isInitialized]);

  /**
   * Stop listening for voice commands
   */
  const stopListening = useCallback(() => {
    try {
      voiceNavigationService.stopListening();
      setState(prev => ({ ...prev, isListening: false }));
      logger.debug('accessibility', 'Voice listening stopped via hook');
    } catch (error) {
      logger.error('accessibility', 'Failed to stop voice listening', error);
      optionsRef.current.onError?.(error as Error);
    }
  }, []);

  /**
   * Toggle voice navigation on/off
   */
  const toggleVoiceNavigation = useCallback(async () => {
    if (!state.isSupported) return;

    if (state.isListening) {
      stopListening();
    } else {
      await startListening();
    }
  }, [state.isSupported, state.isListening, startListening, stopListening]);

  /**
   * Register a new voice command
   */
  const registerCommand = useCallback((
    id: string,
    phrases: string[],
    action: () => void | Promise<void>,
    description: string,
    category: 'navigation' | 'action' | 'information' | 'accessibility' = 'action'
  ) => {
    if (!state.isInitialized) {
      logger.warn('accessibility', 'Cannot register command - voice navigation not initialized');
      return;
    }

    voiceNavigationService.registerCommand(id, {
      phrases,
      action: async () => {
        try {
          await action();
          setState(prev => ({ ...prev, lastCommand: id }));
          optionsRef.current.onCommandExecuted?.(id, '');
        } catch (error) {
          logger.error('accessibility', 'Voice command execution failed', error);
          optionsRef.current.onError?.(error as Error);
        }
      },
      description,
      category,
      enabled: true,
    });

    const commands = voiceNavigationService.getAvailableCommands();
    setState(prev => ({ ...prev, availableCommands: commands.length }));

    logger.debug('accessibility', 'Voice command registered via hook', { id, description });
  }, [state.isInitialized]);

  /**
   * Unregister a voice command
   */
  const unregisterCommand = useCallback((id: string) => {
    if (!state.isInitialized) return;

    voiceNavigationService.unregisterCommand(id);
    const commands = voiceNavigationService.getAvailableCommands();
    setState(prev => ({ ...prev, availableCommands: commands.length }));

    logger.debug('accessibility', 'Voice command unregistered via hook', { id });
  }, [state.isInitialized]);

  /**
   * Get available commands
   */
  const getAvailableCommands = useCallback(() => {
    if (!state.isInitialized) return [];
    return voiceNavigationService.getAvailableCommands();
  }, [state.isInitialized]);

  /**
   * Speak text using voice synthesis
   */
  const speak = useCallback((text: string) => {
    if (!state.isSupported) return;
    
    // This would use the voice navigation service's speak method
    // For now, we'll use the accessibility service
    try {
      // voiceNavigationService.speak(text); // Would be implemented
      logger.debug('accessibility', 'Speaking text via voice navigation', { text });
    } catch (error) {
      logger.warn('accessibility', 'Failed to speak text', error);
    }
  }, [state.isSupported]);

  /**
   * Update voice navigation configuration
   */
  const updateConfig = useCallback((updates: {
    language?: 'en' | 'es' | 'fr' | 'de';
    confidenceThreshold?: number;
    enableVoiceFeedback?: boolean;
    enableContinuousListening?: boolean;
  }) => {
    if (!state.isInitialized) return;

    voiceNavigationService.updateConfig(updates);
    logger.debug('accessibility', 'Voice navigation config updated via hook', { updates });
  }, [state.isInitialized]);

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (state.isListening) {
        stopListening();
      }
      
      // Unregister custom commands
      if (optionsRef.current.customCommands) {
        optionsRef.current.customCommands.forEach(command => {
          voiceNavigationService.unregisterCommand(command.id);
        });
      }
    };
  }, [state.isListening, stopListening]);

  // Update state when screen reader status changes
  useEffect(() => {
    if (state.isInitialized) {
      updateConfig({ enableVoiceFeedback: isScreenReaderEnabled });
    }
  }, [isScreenReaderEnabled, state.isInitialized, updateConfig]);

  return {
    // State
    ...state,
    
    // Actions
    startListening,
    stopListening,
    toggleVoiceNavigation,
    registerCommand,
    unregisterCommand,
    speak,
    updateConfig,
    
    // Utilities
    getAvailableCommands,
    initialize,
  };
};

/**
 * Simple voice navigation hook for basic usage
 */
export const useSimpleVoiceNavigation = () => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported(voiceNavigationService.isSupported());
  }, []);

  const startListening = useCallback(async () => {
    if (!isSupported) return;
    
    try {
      await voiceNavigationService.startListening();
      setIsListening(true);
    } catch (error) {
      logger.error('accessibility', 'Simple voice navigation start failed', error);
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    if (!isSupported) return;
    
    try {
      voiceNavigationService.stopListening();
      setIsListening(false);
    } catch (error) {
      logger.error('accessibility', 'Simple voice navigation stop failed', error);
    }
  }, [isSupported]);

  return {
    isSupported,
    isListening,
    startListening,
    stopListening,
  };
};
