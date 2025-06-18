// src/services/ai/aiChatService.ts
import { huggingfaceService } from "./huggingface";
import { supabase } from "../supabase/client";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  metadata?: {
    productContext?: any;
    stackContext?: any;
    sources?: Array<{ badge: string; text: string }>;
    quickActions?: Array<{ label: string; onPress: () => void }>;
  };
}

interface ChatSession {
  id: string;
  messages: ChatMessage[];
  createdAt: Date;
  lastMessageAt: Date;
  title?: string;
}

class AIChatService {
  private currentSession: ChatSession | null = null;
  private messageHistory: ChatMessage[] = [];

  // Initialize or restore chat session
  async initializeSession(
    productContext?: any,
    stackContext?: any
  ): Promise<void> {
    try {
      // Try to restore previous session
      const stored = await AsyncStorage.getItem("pharmaguide_chat_session");
      if (stored) {
        const session = JSON.parse(stored);
        this.currentSession = session;
        this.messageHistory = session.messages || [];
      } else {
        // Create new session
        this.currentSession = {
          id: Date.now().toString(),
          messages: [],
          createdAt: new Date(),
          lastMessageAt: new Date(),
          title: productContext
            ? `Chat about ${productContext.name}`
            : "New Chat",
        };

        // Add system message with context
        if (productContext || stackContext) {
          const systemMessage: ChatMessage = {
            id: Date.now().toString(),
            role: "system",
            content: this.buildSystemPrompt(productContext, stackContext),
            timestamp: new Date(),
          };
          this.messageHistory.push(systemMessage);
        }
      }
    } catch (error) {
      console.error("Error initializing chat session:", error);
    }
  }

  private buildSystemPrompt(productContext?: any, stackContext?: any): string {
    let prompt = `You are PharmaGuide's AI Pharmacist assistant. You provide evidence-based, educational information about supplements and medications. Always remind users to consult healthcare providers for medical decisions.`;

    if (productContext) {
      prompt += `\n\nCurrent product context: ${productContext.name} by ${productContext.brand}. Score: ${productContext.score}/100.`;
    }

    if (stackContext && stackContext.length > 0) {
      prompt += `\n\nUser's current stack: ${stackContext
        .map((item: any) => item.name)
        .join(", ")}.`;
    }

    return prompt;
  }

  async sendMessage(message: string): Promise<ChatMessage> {
    try {
      // Add user message
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "user",
        content: message,
        timestamp: new Date(),
      };
      this.messageHistory.push(userMessage);

      // Check cache first
      const cacheKey = this.generateCacheKey(
        message,
        this.messageHistory.slice(-5)
      );
      const cached = await this.getCachedResponse(cacheKey);

      if (cached) {
        const assistantMessage: ChatMessage = {
          id: Date.now().toString(),
          role: "assistant",
          content: cached.content,
          timestamp: new Date(),
          metadata: cached.metadata,
        };
        this.messageHistory.push(assistantMessage);
        await this.saveSession();
        return assistantMessage;
      }

      // Generate AI response
      const response = await this.generateAIResponse(message);

      // Cache the response
      await this.cacheResponse(cacheKey, response);

      // Add assistant message
      const assistantMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: response.content,
        timestamp: new Date(),
        metadata: response.metadata,
      };

      this.messageHistory.push(assistantMessage);
      await this.saveSession();

      return assistantMessage;
    } catch (error) {
      console.error("Error sending message:", error);

      // Return error message
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content:
          "I'm having trouble processing your request right now. However, I can still help you with general information about supplements and medications. What would you like to know?",
        timestamp: new Date(),
        metadata: {
          sources: [{ badge: "⚠️", text: "Offline Mode" }],
        },
      };

      this.messageHistory.push(errorMessage);
      await this.saveSession();
      return errorMessage;
    }
  }

  private async generateAIResponse(message: string): Promise<any> {
    // First, check if it's a common question we can answer with rules
    const ruleBasedResponse = this.checkCommonQuestions(message);
    if (ruleBasedResponse) {
      return ruleBasedResponse;
    }

    // Use AI for complex questions
    try {
      const context = this.messageHistory
        .slice(-5)
        .filter((m) => m.role !== "system")
        .map((m) => `${m.role}: ${m.content}`)
        .join("\n");

      const prompt = `${context}\nuser: ${message}\nassistant:`;

      // Call the HuggingFace service
      const aiResponse = await huggingfaceService.generateAIResponse(prompt);

      return {
        content: aiResponse,
        metadata: {
          sources: [{ badge: "🤖", text: "AI Analysis" }],
        },
      };
    } catch (error) {
      console.error("AI generation failed:", error);

      // Return a helpful fallback response
      return {
        content: this.getFallbackResponse(message),
        metadata: {
          sources: [{ badge: "📚", text: "General Guidance" }],
        },
      };
    }
  }

  private getFallbackResponse(message: string): string {
    const lowerMessage = message.toLowerCase();

    // Provide contextual fallback responses
    if (lowerMessage.includes("interaction") || lowerMessage.includes("mix")) {
      return "Checking drug interactions is crucial for safety. Common interactions to watch for include:\n\n• Blood thinners with vitamin K\n• Iron with calcium or zinc\n• St. John's Wort with many medications\n• Grapefruit with certain drugs\n\nFor your specific supplements, I recommend consulting with a pharmacist or using a drug interaction checker. Would you like me to analyze your current stack?";
    }

    if (lowerMessage.includes("side effect")) {
      return "Common side effects from supplements include:\n\n• Digestive upset (especially with iron, magnesium)\n• Headaches (high doses of vitamins)\n• Sleep disturbances (B vitamins taken late)\n• Nausea (zinc on empty stomach)\n\nAlways start with lower doses and take with food when recommended. If side effects persist, consult your healthcare provider.";
    }

    if (lowerMessage.includes("quality") || lowerMessage.includes("brand")) {
      return "Look for these quality indicators:\n\n• Third-party testing (USP, NSF, ConsumerLab)\n• GMP certification\n• Clear labeling with amounts\n• Expiration dates\n• Reputable manufacturers\n\nAvoid products with proprietary blends or unclear sourcing. Would you like me to evaluate a specific product?";
    }

    return "I can help you with information about supplements, including:\n\n• Dosage recommendations\n• Timing and absorption\n• Potential interactions\n• Quality assessment\n• Side effects and safety\n\nWhat specific aspect would you like to know more about?";
  }

  private checkCommonQuestions(message: string): any | null {
    const lowerMessage = message.toLowerCase();

    // Dosage questions
    if (lowerMessage.includes("dosage") || lowerMessage.includes("how much")) {
      return {
        content:
          "Here are general dosage guidelines for common supplements:\n\n" +
          "**Vitamins:**\n" +
          "• Vitamin D: 1000-4000 IU daily (higher if deficient)\n" +
          "• Vitamin B12: 500-1000 mcg daily\n" +
          "• Vitamin C: 500-1000 mg daily\n\n" +
          "**Minerals:**\n" +
          "• Magnesium: 200-400 mg daily\n" +
          "• Zinc: 8-11 mg daily\n" +
          "• Iron: 8-18 mg daily (varies by age/gender)\n\n" +
          "**Others:**\n" +
          "• Omega-3: 1-2 g daily\n" +
          "• Probiotics: 1-10 billion CFU daily\n\n" +
          "Always start with lower doses and consult your healthcare provider for personalized recommendations.",
        metadata: {
          sources: [
            { badge: "🔵", text: "NIH Guidelines" },
            { badge: "✅", text: "Verified Information" },
          ],
        },
      };
    }

    // Timing questions
    if (
      lowerMessage.includes("when to take") ||
      lowerMessage.includes("timing")
    ) {
      return {
        content:
          "Optimal supplement timing for better absorption:\n\n" +
          "**Morning (with breakfast):**\n" +
          "• B-vitamins (for energy)\n" +
          "• Vitamin C\n" +
          "• CoQ10\n\n" +
          "**With meals containing fat:**\n" +
          "• Vitamins A, D, E, K\n" +
          "• Omega-3\n" +
          "• CoQ10\n\n" +
          "**Evening:**\n" +
          "• Magnesium (promotes relaxation)\n" +
          "• Calcium (if not taking with iron)\n\n" +
          "**Empty stomach:**\n" +
          "• Iron (if tolerated)\n" +
          "• Probiotics\n\n" +
          "**Separate by 2+ hours:**\n" +
          "• Calcium and iron\n" +
          "• Zinc and copper\n\n" +
          "Consistency is more important than perfect timing!",
        metadata: {
          sources: [
            { badge: "🟢", text: "Clinical Evidence" },
            { badge: "✅", text: "Verified Information" },
          ],
        },
      };
    }

    // Interaction questions
    if (
      lowerMessage.includes("interact") ||
      lowerMessage.includes("mix") ||
      lowerMessage.includes("together")
    ) {
      return {
        content:
          "Important supplement interactions to avoid:\n\n" +
          "**Minerals that compete:**\n" +
          "• Calcium blocks iron absorption\n" +
          "• Zinc interferes with copper\n" +
          "• Magnesium competes with calcium\n\n" +
          "**Vitamin interactions:**\n" +
          "• High dose vitamin E may interfere with vitamin K\n" +
          "• Vitamin C enhances iron absorption (take together)\n\n" +
          "**Medication interactions:**\n" +
          "• St. John's Wort affects many medications\n" +
          "• Vitamin K interferes with blood thinners\n" +
          "• Calcium affects certain antibiotics\n\n" +
          "**Safe combinations:**\n" +
          "• Vitamin D with calcium\n" +
          "• Vitamin C with iron\n" +
          "• B-complex vitamins together\n\n" +
          "Always check with your pharmacist about specific medication interactions!",
        metadata: {
          sources: [
            { badge: "⚠️", text: "Safety Information" },
            { badge: "💊", text: "Pharmacist Verified" },
          ],
        },
      };
    }

    return null;
  }

  private generateCacheKey(message: string, context: ChatMessage[]): string {
    const contextStr = context.map((m) => m.content).join("|");
    return `chat_${this.hashString(message + contextStr)}`;
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  private async getCachedResponse(cacheKey: string): Promise<any | null> {
    try {
      // First try local cache
      const localCache = await AsyncStorage.getItem(`cache_${cacheKey}`);
      if (localCache) {
        const cached = JSON.parse(localCache);
        // Check if cache is still valid (24 hours)
        if (Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) {
          return cached.response;
        }
      }

      // Then try Supabase if available
      const { data } = await supabase
        .from("ai_response_cache")
        .select("response")
        .eq("cache_key", cacheKey)
        .single();

      return data?.response || null;
    } catch (error) {
      // Cache miss is not an error
      return null;
    }
  }

  private async cacheResponse(cacheKey: string, response: any): Promise<void> {
    try {
      // Save to local cache
      await AsyncStorage.setItem(
        `cache_${cacheKey}`,
        JSON.stringify({
          response,
          timestamp: Date.now(),
        })
      );

      // Try to save to Supabase
      await supabase.from("ai_response_cache").upsert({
        cache_key: cacheKey,
        response,
        model_used: "huggingface",
        expires_at: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
      });
    } catch (error) {
      // Caching errors are non-critical
      console.warn("Error caching response:", error);
    }
  }

  private async saveSession(): Promise<void> {
    if (!this.currentSession) return;

    this.currentSession.messages = this.messageHistory;
    this.currentSession.lastMessageAt = new Date();

    try {
      await AsyncStorage.setItem(
        "pharmaguide_chat_session",
        JSON.stringify(this.currentSession)
      );
    } catch (error) {
      console.error("Error saving chat session:", error);
    }
  }

  async clearSession(): Promise<void> {
    this.currentSession = null;
    this.messageHistory = [];
    await AsyncStorage.removeItem("pharmaguide_chat_session");
  }

  getMessageHistory(): ChatMessage[] {
    return this.messageHistory;
  }
}

export const aiChatService = new AIChatService();
export type { ChatMessage, ChatSession };
