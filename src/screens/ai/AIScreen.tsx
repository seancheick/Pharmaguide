// src/screens/ai/AIScreen.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
  Animated,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants';
import { aiChatService, ChatMessage } from '../../services/ai/aiChatService';
import { useStackStore } from '../../stores/stackStore';
import { gamificationService } from '../../services/gamification/gamificationService';
import { useAIConsent } from '../../hooks/useAIConsent';
import { AIConsentModal } from '../../components/privacy/AIConsentModal';
import { handleAIConsentError } from '../../hooks/useAIConsent';
import { OfflineIndicator } from '../../components/common/OfflineIndicator';
import { useNetworkState } from '../../hooks/useNetworkState';
import type { AIScreenProps } from '../../types/navigation';
import { useToast } from '../../hooks/useToast';
import { LoadingScreen } from '../../components/common/LoadingScreen';

// Helper function to format timestamps
const formatTimestamp = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const MessageBubble = React.memo(
  ({
    message,
    showTimestamp,
    previousMessage,
  }: {
    message: ChatMessage;
    showTimestamp: boolean;
    previousMessage?: ChatMessage;
  }) => {
    const isUser = message.role === 'user';
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }, []);

    // Convert timestamp to Date object
    const messageDate =
      message.timestamp instanceof Date
        ? message.timestamp
        : new Date(message.timestamp);
    const previousDate =
      previousMessage?.timestamp instanceof Date
        ? previousMessage.timestamp
        : previousMessage
          ? new Date(previousMessage.timestamp)
          : null;

    // Show timestamp if it's the first message or if more than 5 minutes have passed
    const shouldShowTimestamp =
      showTimestamp ||
      !previousMessage ||
      !previousDate ||
      messageDate.getTime() - previousDate.getTime() > 300000; // 5 minutes in milliseconds

    return (
      <Animated.View
        style={[
          styles.messageWrapper,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {shouldShowTimestamp && (
          <Text style={styles.timestamp}>{formatTimestamp(messageDate)}</Text>
        )}

        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.assistantBubble,
          ]}
        >
          {!isUser && (
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Ionicons name="medical" size={20} color={COLORS.white} />
              </View>
            </View>
          )}

          <View
            style={[
              styles.bubbleContent,
              isUser ? styles.userBubbleContent : styles.assistantBubbleContent,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                isUser ? styles.userMessageText : styles.assistantMessageText,
              ]}
            >
              {message.content}
            </Text>

            {message.metadata?.sources &&
              message.metadata.sources.length > 0 && (
                <View style={styles.sourcesContainer}>
                  {message.metadata.sources.map((source, index) => (
                    <View key={index} style={styles.sourceBadge}>
                      <Text style={styles.sourceBadgeText}>
                        {source.badge} {source.text}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

            {!isUser && message.metadata?.quickActions && (
              <View style={styles.quickActionsContainer}>
                {message.metadata.quickActions.map((action, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.quickActionButton}
                    onPress={() => action.onPress()}
                  >
                    <Text style={styles.quickActionText}>{action.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      </Animated.View>
    );
  }
);

const SuggestedQuestion = React.memo(
  ({ question, onPress }: { question: string; onPress: () => void }) => (
    <TouchableOpacity
      style={styles.suggestedQuestion}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons
        name="help-circle-outline"
        size={16}
        color={COLORS.primary}
        style={styles.suggestionIcon}
      />
      <Text style={styles.suggestedQuestionText}>{question}</Text>
    </TouchableOpacity>
  )
);

const TypingIndicator = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateDots = () => {
      const createDotAnimation = (dot: Animated.Value, delay: number) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(dot, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(dot, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ])
        );

      Animated.parallel([
        createDotAnimation(dot1, 0),
        createDotAnimation(dot2, 150),
        createDotAnimation(dot3, 300),
      ]).start();
    };

    animateDots();
  }, []);

  const dotStyle = (animValue: Animated.Value) => ({
    opacity: animValue,
    transform: [
      {
        scale: animValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0.8, 1.2],
        }),
      },
    ],
  });

  return (
    <View style={styles.typingIndicator}>
      <Animated.View style={[styles.typingDot, dotStyle(dot1)]} />
      <Animated.View style={[styles.typingDot, dotStyle(dot2)]} />
      <Animated.View style={[styles.typingDot, dotStyle(dot3)]} />
    </View>
  );
};

export function AIScreen({ route }: { route?: any }) {
  const navigation = useNavigation<AIScreenProps['navigation']>();
  const { showError, showInfo } = useToast();

  // Get product context from navigation params
  const productContext = route?.params?.productContext;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const { stack } = useStackStore();

  // 🔒 HIPAA COMPLIANT: AI Consent Management
  const {
    hasConsent,
    canUseAI,
    showConsentModal: showModal,
    hideConsentModal,
    updateConsent,
    requestAIAnalysis,
    userId,
  } = useAIConsent();

  // 📡 Network State Management
  const { isOnline, isOffline } = useNetworkState();

  const suggestedQuestions = [
    "What's the best time to take magnesium?",
    'Can I take vitamin D with calcium?',
    'What are signs of vitamin B12 deficiency?',
    'How do I know if a supplement is high quality?',
    'What interactions should I watch for with my stack?',
  ];

  useEffect(() => {
    initializeChat();
  }, []);

  const initializeChat = async () => {
    await aiChatService.initializeSession(null, stack);
    const history = aiChatService.getMessageHistory();

    if (
      history.length === 0 ||
      (history.length === 1 && history[0].role === 'system')
    ) {
      // Check if we have product context from navigation
      let welcomeContent =
        "Hello! I'm your AI Pharmacist. I can help you understand supplements, check interactions, suggest dosages, and answer your health questions. What would you like to know?";
      let quickActions = [
        {
          label: 'Check my stack',
          onPress: () =>
            handleSuggestedQuestion(
              'Can you review my current supplement stack for interactions?'
            ),
        },
        {
          label: 'Dosage help',
          onPress: () =>
            handleSuggestedQuestion(
              'What are the recommended dosages for common vitamins?'
            ),
        },
      ];

      // If we have product context, customize the welcome message
      if (productContext) {
        welcomeContent = `Hello! I see you'd like to discuss ${productContext.name}${productContext.brand ? ` by ${productContext.brand}` : ''}. I'm here to help you understand this supplement, its interactions, dosing, and how it fits with your health goals. What would you like to know?`;
        quickActions = [
          {
            label: 'Check interactions',
            onPress: () =>
              handleSuggestedQuestion(
                `What interactions should I watch for with ${productContext.name}?`
              ),
          },
          {
            label: 'Dosage guidance',
            onPress: () =>
              handleSuggestedQuestion(
                `What's the recommended dosage for ${productContext.name}?`
              ),
          },
          {
            label: 'Best time to take',
            onPress: () =>
              handleSuggestedQuestion(
                `When is the best time to take ${productContext.name}?`
              ),
          },
        ];

        // If there's an initial message, set it as input
        if (productContext.initialMessage) {
          setInputText(productContext.initialMessage);
        }
      }

      // Add welcome message with quick actions
      const welcomeMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: welcomeContent,
        timestamp: new Date(),
        metadata: {
          sources: [{ badge: '👋', text: 'Welcome' }],
          quickActions,
        },
      };
      setMessages([welcomeMessage]);
    } else {
      setMessages(history.filter(m => m.role !== 'system'));
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    // 🔒 HIPAA COMPLIANCE: Check AI consent before processing
    const canProceed = await requestAIAnalysis();
    if (!canProceed) {
      return; // Consent modal will be shown
    }

    const userInput = inputText.trim();
    setInputText('');
    setShowSuggestions(false);
    Keyboard.dismiss();

    // Add user message immediately
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userInput,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setIsTyping(true);

    try {
      // Simulate typing delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Send message and get response
      const response = await aiChatService.sendMessage(userInput);

      setIsTyping(false);

      // Add AI response
      const aiResponse: ChatMessage = {
        ...response,
        timestamp: new Date(),
        metadata: {
          ...response.metadata,
          // Add contextual quick actions based on response
          quickActions: getContextualActions(response.content),
        },
      };

      setMessages(prev => [...prev, aiResponse]);

      // Award points for using AI chat
      const pointsResult = await gamificationService.awardPoints(
        'AI_CONSULTATION' as any,
        {
          question: userInput.substring(0, 100),
          timestamp: new Date().toISOString(),
        }
      );

      // Show level up notification if applicable
      if (pointsResult?.level_up) {
        // You could show a toast or modal here
        console.log('Level up!', pointsResult.new_level);
      }

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      setIsTyping(false);

      // Show toast notification
      showError(
        "I'm having trouble processing your request. Please try again."
      );

      // Add error message
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content:
          "I'm having trouble processing your request right now. Please try again in a moment.",
        timestamp: new Date(),
        metadata: {
          sources: [{ badge: '⚠️', text: 'Error' }],
        },
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const getContextualActions = (content: string): any[] => {
    const actions = [];

    // Add follow-up actions based on content
    if (content.toLowerCase().includes('interaction')) {
      actions.push({
        label: 'View my stack',
        onPress: () => navigation.navigate('Stack'),
      });
    }

    if (
      content.toLowerCase().includes('dosage') ||
      content.toLowerCase().includes('take')
    ) {
      actions.push({
        label: 'Set reminder',
        onPress: () => console.log('Set reminder'),
      });
    }

    return actions;
  };

  const handleSuggestedQuestion = (question: string) => {
    setInputText(question);
    setShowSuggestions(false);
    // Auto-send suggested questions
    setTimeout(() => {
      sendMessage();
    }, 100);
  };

  const renderMessage = ({
    item,
    index,
  }: {
    item: ChatMessage;
    index: number;
  }) => (
    <MessageBubble
      message={item}
      showTimestamp={index === 0}
      previousMessage={index > 0 ? messages[index - 1] : undefined}
    />
  );

  const keyExtractor = (item: ChatMessage) => item.id;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>AI Pharmacist</Text>
            <Text style={styles.headerSubtitle}>
              {canUseAI && isOnline
                ? 'Always here to help'
                : isOffline
                  ? 'Limited offline mode'
                  : 'Enable AI for personalized help'}
            </Text>
          </View>
          <OfflineIndicator showDetails={true} />
        </View>
        <TouchableOpacity
          style={styles.clearButton}
          onPress={async () => {
            await aiChatService.clearSession();
            initializeChat();
          }}
        >
          <Ionicons name="refresh" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          ListFooterComponent={
            <>
              {isTyping && (
                <View style={styles.typingContainer}>
                  <View style={styles.avatar}>
                    <Ionicons
                      name="medical"
                      size={20}
                      color={COLORS.background}
                    />
                  </View>
                  <View style={styles.typingBubble}>
                    <TypingIndicator />
                  </View>
                </View>
              )}

              {showSuggestions && messages.length <= 1 && (
                <View style={styles.suggestionsContainer}>
                  <Text style={styles.suggestionsTitle}>
                    Popular questions to get started:
                  </Text>
                  {suggestedQuestions.map((question, index) => (
                    <SuggestedQuestion
                      key={index}
                      question={question}
                      onPress={() => handleSuggestedQuestion(question)}
                    />
                  ))}
                </View>
              )}
            </>
          }
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask me anything about supplements..."
            placeholderTextColor={COLORS.textTertiary}
            multiline
            maxHeight={100}
            onSubmitEditing={sendMessage}
            blurOnSubmit={true}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim() || isLoading}
          >
            <Ionicons
              name="send"
              size={24}
              color={
                inputText.trim() && !isLoading
                  ? COLORS.background
                  : COLORS.textTertiary
              }
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* 🔒 HIPAA COMPLIANT: AI Consent Modal */}
      <AIConsentModal
        visible={showModal}
        onConsent={updateConsent}
        onClose={hideConsentModal}
        userId={userId}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  clearButton: {
    padding: SPACING.sm,
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  messageWrapper: {
    marginVertical: SPACING.xs,
  },
  timestamp: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginVertical: SPACING.md,
  },
  messageBubble: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: SPACING.xs,
  },
  userBubble: {
    justifyContent: 'flex-end',
  },
  assistantBubble: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    marginRight: SPACING.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bubbleContent: {
    maxWidth: '75%',
    borderRadius: 20,
    padding: SPACING.md,
  },
  userBubbleContent: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  assistantBubbleContent: {
    backgroundColor: COLORS.backgroundSecondary,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: TYPOGRAPHY.sizes.base,
    lineHeight: 22,
  },
  userMessageText: {
    color: COLORS.background,
  },
  assistantMessageText: {
    color: COLORS.textPrimary,
  },
  sourcesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SPACING.sm,
    gap: SPACING.xs,
  },
  sourceBadge: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 12,
  },
  sourceBadgeText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SPACING.sm,
    gap: SPACING.xs,
  },
  quickActionButton: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 16,
  },
  quickActionText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.sm,
  },
  typingBubble: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 20,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.textSecondary,
  },
  suggestionsContainer: {
    padding: SPACING.lg,
  },
  suggestionsTitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  suggestedQuestion: {
    backgroundColor: COLORS.backgroundSecondary,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  suggestionIcon: {
    marginRight: SPACING.sm,
  },
  suggestedQuestionText: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.primary,
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 24,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textPrimary,
    maxHeight: 100,
    marginRight: SPACING.sm,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.gray300,
  },
});
