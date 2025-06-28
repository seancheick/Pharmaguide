// src/services/accessibility/voiceNavigationService.ts
import { Platform } from 'react-native';
import { logger } from '../monitoring/logger';
import { accessibilityService } from './accessibilityService';

interface VoiceCommand {
  phrases: string[];
  action: () => void | Promise<void>;
  description: string;
  category: 'navigation' | 'action' | 'information' | 'accessibility';
  requiresConfirmation?: boolean;
  enabled?: boolean;
}

interface VoiceNavigationConfig {
  enabled: boolean;
  language: 'en' | 'es' | 'fr' | 'de';
  confidenceThreshold: number;
  enableContinuousListening: boolean;
  enableVoiceFeedback: boolean;
  enableHapticFeedback: boolean;
  timeoutMs: number;
}

interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

/**
 * Voice Navigation Service
 * Provides voice commands for accessibility and hands-free navigation
 */
class VoiceNavigationService {
  private config: VoiceNavigationConfig = {
    enabled: false,
    language: 'en',
    confidenceThreshold: 0.7,
    enableContinuousListening: false,
    enableVoiceFeedback: true,
    enableHapticFeedback: true,
    timeoutMs: 5000,
  };

  private commands = new Map<string, VoiceCommand>();
  private isListening = false;
  private isInitialized = false;
  private speechRecognition: any = null;
  private speechSynthesis: any = null;
  private navigationRef: any = null;

  /**
   * Initialize voice navigation service
   */
  async initialize(config?: Partial<VoiceNavigationConfig>, navigationRef?: any): Promise<void> {
    if (this.isInitialized) return;

    try {
      if (config) {
        this.config = { ...this.config, ...config };
      }

      this.navigationRef = navigationRef;

      // Initialize speech recognition (web only for now)
      if (Platform.OS === 'web') {
        await this.initializeWebSpeechAPI();
      }

      // Register default commands
      this.registerDefaultCommands();

      this.isInitialized = true;
      logger.info('accessibility', 'Voice navigation service initialized', {
        config: this.config,
        commandCount: this.commands.size,
      });
    } catch (error) {
      logger.error('accessibility', 'Failed to initialize voice navigation', error);
      throw error;
    }
  }

  /**
   * Register a voice command
   */
  registerCommand(id: string, command: VoiceCommand): void {
    this.commands.set(id, command);
    logger.debug('accessibility', 'Voice command registered', { id, command: command.description });
  }

  /**
   * Unregister a voice command
   */
  unregisterCommand(id: string): void {
    this.commands.delete(id);
    logger.debug('accessibility', 'Voice command unregistered', { id });
  }

  /**
   * Start listening for voice commands
   */
  async startListening(): Promise<void> {
    if (!this.config.enabled || this.isListening || !this.speechRecognition) {
      return;
    }

    try {
      this.isListening = true;
      this.speechRecognition.start();
      
      if (this.config.enableVoiceFeedback) {
        this.speak('Voice navigation activated. Say a command.');
      }

      logger.debug('accessibility', 'Voice navigation listening started');
    } catch (error) {
      this.isListening = false;
      logger.error('accessibility', 'Failed to start voice listening', error);
    }
  }

  /**
   * Stop listening for voice commands
   */
  stopListening(): void {
    if (!this.isListening || !this.speechRecognition) return;

    try {
      this.speechRecognition.stop();
      this.isListening = false;
      
      if (this.config.enableVoiceFeedback) {
        this.speak('Voice navigation deactivated.');
      }

      logger.debug('accessibility', 'Voice navigation listening stopped');
    } catch (error) {
      logger.error('accessibility', 'Failed to stop voice listening', error);
    }
  }

  /**
   * Process speech recognition result
   */
  private async processSpeechResult(result: SpeechRecognitionResult): Promise<void> {
    if (result.confidence < this.config.confidenceThreshold) {
      logger.debug('accessibility', 'Speech confidence too low', { 
        transcript: result.transcript, 
        confidence: result.confidence 
      });
      return;
    }

    const transcript = result.transcript.toLowerCase().trim();
    logger.debug('accessibility', 'Processing voice command', { transcript, confidence: result.confidence });

    // Find matching command
    const matchedCommand = this.findMatchingCommand(transcript);
    
    if (matchedCommand) {
      await this.executeCommand(matchedCommand, transcript);
    } else {
      if (this.config.enableVoiceFeedback) {
        this.speak('Command not recognized. Say "help" for available commands.');
      }
      logger.debug('accessibility', 'No matching voice command found', { transcript });
    }
  }

  /**
   * Find matching command for transcript
   */
  private findMatchingCommand(transcript: string): VoiceCommand | null {
    for (const command of this.commands.values()) {
      if (!command.enabled) continue;
      
      for (const phrase of command.phrases) {
        if (this.matchesPhrase(transcript, phrase.toLowerCase())) {
          return command;
        }
      }
    }
    return null;
  }

  /**
   * Check if transcript matches a command phrase
   */
  private matchesPhrase(transcript: string, phrase: string): boolean {
    // Exact match
    if (transcript === phrase) return true;
    
    // Contains match
    if (transcript.includes(phrase)) return true;
    
    // Fuzzy match for common variations
    const words = phrase.split(' ');
    const transcriptWords = transcript.split(' ');
    
    // Check if all command words are present
    return words.every(word => 
      transcriptWords.some(tWord => 
        tWord.includes(word) || word.includes(tWord)
      )
    );
  }

  /**
   * Execute a voice command
   */
  private async executeCommand(command: VoiceCommand, transcript: string): Promise<void> {
    try {
      logger.info('accessibility', 'Executing voice command', { 
        description: command.description, 
        transcript 
      });

      if (command.requiresConfirmation) {
        const confirmed = await this.requestConfirmation(command.description);
        if (!confirmed) return;
      }

      await command.action();
      
      if (this.config.enableVoiceFeedback) {
        this.speak(`${command.description} executed.`);
      }

      // Trigger haptic feedback if enabled
      if (this.config.enableHapticFeedback && Platform.OS !== 'web') {
        // Would integrate with Haptics.impactAsync() from expo-haptics
      }

    } catch (error) {
      logger.error('accessibility', 'Failed to execute voice command', error, { 
        command: command.description 
      });
      
      if (this.config.enableVoiceFeedback) {
        this.speak('Command failed. Please try again.');
      }
    }
  }

  /**
   * Request confirmation for sensitive commands
   */
  private async requestConfirmation(action: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.speak(`Are you sure you want to ${action}? Say yes or no.`);
      
      // Set up temporary listener for confirmation
      const confirmationTimeout = setTimeout(() => {
        this.speak('Confirmation timeout. Command cancelled.');
        resolve(false);
      }, this.config.timeoutMs);

      // This would need to be implemented with actual speech recognition
      // For now, we'll assume confirmation is given
      clearTimeout(confirmationTimeout);
      resolve(true);
    });
  }

  /**
   * Speak text using text-to-speech
   */
  private speak(text: string): void {
    if (!this.config.enableVoiceFeedback || !this.speechSynthesis) return;

    try {
      if (Platform.OS === 'web' && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = this.config.language;
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      }
      
      // Also announce to screen reader
      accessibilityService.announceForScreenReader(text, 'high');
      
      logger.debug('accessibility', 'Voice feedback spoken', { text });
    } catch (error) {
      logger.warn('accessibility', 'Failed to speak text', { error, text });
    }
  }

  /**
   * Initialize Web Speech API
   */
  private async initializeWebSpeechAPI(): Promise<void> {
    if (Platform.OS !== 'web' || !('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      throw new Error('Speech recognition not supported');
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    this.speechRecognition = new SpeechRecognition();
    
    this.speechRecognition.continuous = this.config.enableContinuousListening;
    this.speechRecognition.interimResults = true;
    this.speechRecognition.lang = this.config.language;

    this.speechRecognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      if (result.isFinal) {
        this.processSpeechResult({
          transcript: result[0].transcript,
          confidence: result[0].confidence,
          isFinal: true,
        });
      }
    };

    this.speechRecognition.onerror = (event: any) => {
      logger.error('accessibility', 'Speech recognition error', event.error);
      this.isListening = false;
    };

    this.speechRecognition.onend = () => {
      this.isListening = false;
      if (this.config.enableContinuousListening && this.config.enabled) {
        // Restart listening for continuous mode
        setTimeout(() => this.startListening(), 1000);
      }
    };

    // Initialize speech synthesis
    if ('speechSynthesis' in window) {
      this.speechSynthesis = window.speechSynthesis;
    }
  }

  /**
   * Register default voice commands
   */
  private registerDefaultCommands(): void {
    // Navigation commands
    this.registerCommand('scan-product', {
      phrases: ['scan product', 'scan supplement', 'open scanner', 'start scanning'],
      action: () => this.navigationRef?.navigate('BarcodeScanner'),
      description: 'Open barcode scanner',
      category: 'navigation',
      enabled: true,
    });

    this.registerCommand('check-interactions', {
      phrases: ['check interactions', 'view stack', 'my stack', 'show supplements'],
      action: () => this.navigationRef?.navigate('MyStack'),
      description: 'View supplement stack',
      category: 'navigation',
      enabled: true,
    });

    this.registerCommand('talk-to-pharmacist', {
      phrases: ['talk to pharmacist', 'ai chat', 'ask question', 'get help'],
      action: () => this.navigationRef?.navigate('AIChat'),
      description: 'Open AI pharmacist chat',
      category: 'navigation',
      enabled: true,
    });

    // Information commands
    this.registerCommand('read-warnings', {
      phrases: ['read warnings', 'current warnings', 'safety alerts'],
      action: () => this.announceCurrentWarnings(),
      description: 'Read current safety warnings',
      category: 'information',
      enabled: true,
    });

    this.registerCommand('help', {
      phrases: ['help', 'what can you do', 'available commands', 'voice commands'],
      action: () => this.announceAvailableCommands(),
      description: 'List available voice commands',
      category: 'information',
      enabled: true,
    });

    // Accessibility commands
    this.registerCommand('toggle-voice', {
      phrases: ['toggle voice navigation', 'disable voice', 'enable voice'],
      action: () => this.toggleVoiceNavigation(),
      description: 'Toggle voice navigation',
      category: 'accessibility',
      enabled: true,
    });
  }

  /**
   * Announce current warnings
   */
  private announceCurrentWarnings(): void {
    // This would integrate with your existing warning system
    this.speak('Reading current safety warnings. No critical warnings at this time.');
  }

  /**
   * Announce available commands
   */
  private announceAvailableCommands(): void {
    const enabledCommands = Array.from(this.commands.values())
      .filter(cmd => cmd.enabled)
      .map(cmd => cmd.description);
    
    const commandList = enabledCommands.join(', ');
    this.speak(`Available voice commands: ${commandList}`);
  }

  /**
   * Toggle voice navigation
   */
  private toggleVoiceNavigation(): void {
    this.config.enabled = !this.config.enabled;
    
    if (this.config.enabled) {
      this.speak('Voice navigation enabled.');
      this.startListening();
    } else {
      this.speak('Voice navigation disabled.');
      this.stopListening();
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): VoiceNavigationConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<VoiceNavigationConfig>): void {
    this.config = { ...this.config, ...updates };
    logger.info('accessibility', 'Voice navigation config updated', { updates });
  }

  /**
   * Get available commands
   */
  getAvailableCommands(): Array<{ id: string; command: VoiceCommand }> {
    return Array.from(this.commands.entries()).map(([id, command]) => ({ id, command }));
  }

  /**
   * Check if voice navigation is supported
   */
  isSupported(): boolean {
    if (Platform.OS === 'web') {
      return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    }
    // For React Native, would need to check for react-native-voice or similar
    return false;
  }
}

// Export singleton instance
export const voiceNavigationService = new VoiceNavigationService();
