// src/services/ai/huggingface.ts
import { API_ENDPOINTS, AI_MODELS } from "../../constants";
import type {
  Product,
  ProductAnalysis,
  AnalysisPoint,
  IngredientForm,
} from "../../types";

interface HuggingFaceTextResponse {
  generated_text: string;
}

interface HuggingFaceClassificationResponse {
  sequence: string;
  labels: string[];
  scores: number[];
}

// Define the expected structure for HuggingFace Embedding API response
interface HuggingFaceEmbeddingResponse {
  // Sentence-transformers models usually return an array of arrays (embeddings)
  // The API response for a single input text is a single array of numbers.
  // For multiple inputs, it's an array of arrays.
  // The raw JSON might just be the array of numbers directly if inputs is a single string.
  // We'll treat it as number[][] for consistency, assuming `inputs` will always be an array of strings.
  [key: number]: number[]; // This matches an array of arrays.
}

interface HuggingFaceError {
  error: string;
  estimated_time?: number;
  warnings?: string[];
}

// Note: GroqChatResponse is now directly used within the callGroqAPI method's return type handling.
// interface GroqChatResponse {
//   choices: Array<{
//     message: {
//       content: string;
//     };
//   }>;
// }

class HuggingFaceService {
  // Renamed from HuggingFaceService if you plan to make it generic like AIService
  private apiKey: string;
  private groqApiKey: string; // Keep this specific for Groq calls
  private baseUrl: string; // For Hugging Face Inference API
  private groqBaseUrl: string; // For Groq API
  private requestCache: Map<string, { data: any; timestamp: number }> =
    new Map(); // Cache stores both analysis objects and chat strings
  private retryDelays = [1000, 2000, 4000]; // Exponential backoff
  private useGroq: boolean = false; // Flag to enable/disable Groq

  constructor() {
    this.apiKey = process.env.EXPO_PUBLIC_HUGGINGFACE_API_KEY || "";
    this.groqApiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY || ""; // Load Groq key
    this.baseUrl = API_ENDPOINTS.HUGGINGFACE;
    this.groqBaseUrl = API_ENDPOINTS.GROQ;

    // Enable Groq if API key is available
    this.useGroq = !!this.groqApiKey;

    if (!this.apiKey) {
      console.warn(
        "⚠️ HuggingFace API key not set. HF-specific AI features (classification, embeddings) will be limited or unavailable."
      );
    }

    if (!this.groqApiKey) {
      console.warn(
        "⚠️ Groq API key not set. Groq-powered chat/text generation will be unavailable."
      );
    }

    if (this.useGroq) {
      console.log(
        "✅ Groq API enabled for enhanced text generation (primary chat)"
      );
    }
  }

  /**
   * Generate AI response for chat using Groq (primary) or fallback to rule-based.
   * This method replaces generateChatResponse from previous iterations.
   * @param prompt The user's chat prompt.
   * @returns A Promise that resolves to the generated text.
   */
  async generateAIResponse(prompt: string): Promise<string> {
    // Try cache first
    const cacheKey = `chat_${this.simpleHash(prompt)}`;
    const cached = this.getCachedResponse(cacheKey); // Assuming getCachedResponse returns string or null
    if (cached) {
      console.log("📦 Using cached chat response");
      return cached;
    }

    // Try Groq first if available (much faster and more reliable for general text generation)
    if (this.useGroq) {
      try {
        const response = await this.callGroqAPI(prompt);
        if (response) {
          this.cacheResponse(cacheKey, response);
          return response;
        }
      } catch (error) {
        console.warn(
          "Groq API failed, falling back to rule-based response:",
          error
        );
      }
    }

    // Fallback to enhanced rule-based response if Groq fails or is not enabled
    const fallbackResponse = this.generateEnhancedRuleBasedResponse(prompt);
    this.cacheResponse(cacheKey, fallbackResponse); // Cache rule-based fallback
    return fallbackResponse;
  }

  /**
   * Makes a call to the Groq API for chat completions.
   * @param prompt The user's prompt to send to the Groq model.
   * @returns The content of the AI's response.
   * @throws Error if the API call fails or no content is received.
   */
  private async callGroqAPI(prompt: string): Promise<string> {
    if (!this.groqApiKey) {
      throw new Error("Groq API key not configured for this call.");
    }

    const payload = {
      model: AI_MODELS.GROQ.FAST, // Use the confirmed working Groq model
      messages: [
        {
          role: "system",
          content:
            "You are a knowledgeable AI pharmacist assistant helping users understand supplements and medications. Provide accurate, helpful information but always remind users to consult healthcare professionals for medical advice.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 300,
      stream: false,
    };

    try {
      const response = await fetch(`${this.groqBaseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.groqApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq API error: ${response.status} - ${errorText}`);
      }

      const data: any = await response.json(); // Use 'any' then safely access
      const generatedText = data.choices?.[0]?.message?.content;

      if (!generatedText) {
        throw new Error("No content received from Groq API.");
      }

      return generatedText;
    } catch (error: any) {
      console.error("Error calling Groq API:", error);
      throw new Error(`Failed to get response from Groq: ${error.message}`);
    }
  }

  /**
   * Enhanced rule-based response for chat fallback when AI is unavailable or fails.
   * @param prompt The user's prompt.
   * @returns A relevant rule-based response.
   */
  private generateEnhancedRuleBasedResponse(prompt: string): string {
    const lowerPrompt = prompt.toLowerCase();

    // Interaction queries
    if (
      lowerPrompt.includes("interact") ||
      lowerPrompt.includes("mix") ||
      lowerPrompt.includes("combine")
    ) {
      if (lowerPrompt.includes("warfarin")) {
        return "Warfarin has several important interactions with supplements. Vitamin K can reduce its effectiveness, while vitamin E, fish oil, garlic, and ginkgo may increase bleeding risk. Always maintain consistent vitamin K intake and consult your doctor before adding any supplements to your regimen.";
      }
      if (lowerPrompt.includes("statin")) {
        return "Statins can interact with several supplements. Red yeast rice contains natural statins and shouldn't be combined. High-dose niacin may increase muscle damage risk. CoQ10 is often recommended with statins as they may deplete this nutrient. Always discuss supplement use with your healthcare provider.";
      }
      return "Many medications and supplements can interact. Common interactions include blood thinners with vitamin K or fish oil, antidepressants with St. John's Wort, and diabetes medications with chromium. Always consult your healthcare provider before combining medications with supplements.";
    }

    // Dosage queries
    if (
      lowerPrompt.includes("dose") ||
      lowerPrompt.includes("dosage") ||
      lowerPrompt.includes("how much")
    ) {
      if (lowerPrompt.includes("vitamin d")) {
        return "Vitamin D dosing varies by individual needs. General recommendations are 600-800 IU daily for adults, but those with deficiency may need 1,000-4,000 IU. The upper limit is 4,000 IU daily. Blood testing can help determine your optimal dose. Consult your healthcare provider for personalized recommendations.";
      }
      if (lowerPrompt.includes("magnesium")) {
        return "Magnesium dosing depends on the form and purpose. For general health: 200-400mg daily. Magnesium citrate (150-300mg) helps with constipation. Magnesium glycinate (200-400mg) is best for sleep and anxiety without digestive effects. Start low and increase gradually to avoid diarrhea.";
      }
      return "Supplement dosing varies by individual needs, age, and health conditions. Always start with the lowest recommended dose and follow product instructions. For personalized dosing, consult with a healthcare provider who can consider your specific health needs and current medications.";
    }

    // Form/type queries
    if (
      lowerPrompt.includes("best form") ||
      lowerPrompt.includes("which type") ||
      lowerPrompt.includes("difference between")
    ) {
      if (lowerPrompt.includes("b12")) {
        return "For B12, methylcobalamin is generally preferred as it's the active form your body uses directly. It's especially beneficial for those with MTHFR mutations. Cyanocobalamin is cheaper but requires conversion in the body. Sublingual forms may offer better absorption than regular tablets.";
      }
      if (lowerPrompt.includes("magnesium")) {
        return "Different magnesium forms serve different purposes: Glycinate for sleep/anxiety (high absorption, gentle), Citrate for constipation relief, Threonate for brain health, Malate for energy/muscles. Avoid oxide except for constipation as it has poor absorption. Choose based on your primary health goal.";
      }
      return "Supplement forms vary in bioavailability and effects. Generally, chelated minerals, methylated B vitamins, and liposomal formulations offer superior absorption. The best form depends on your specific needs, tolerance, and health goals. Consider consulting a healthcare provider for personalized recommendations.";
    }

    // Safety queries
    if (
      lowerPrompt.includes("safe") ||
      lowerPrompt.includes("side effect") ||
      lowerPrompt.includes("risk")
    ) {
      return "Supplement safety depends on quality, dosage, and individual factors. Choose third-party tested products, follow recommended doses, and be aware of potential interactions with medications. Common side effects vary by supplement. Always consult healthcare providers if you have health conditions or take medications.";
    }

    // Generic helpful response
    return "I can help you understand supplements and their interactions. For specific questions, please ask about dosing, forms, interactions, or safety. Remember, while I provide educational information, always consult with healthcare professionals for personalized medical advice.";
  }

  /**
   * Main entry point for product analysis. Combines rule-based and AI (Groq for reasoning, HF for classification).
   * @param product The product to analyze.
   * @param useAI Flag to enable/disable AI enhancement.
   * @returns A Promise resolving to a partial ProductAnalysis object.
   */
  async generateProductAnalysis(
    product: Product,
    useAI: boolean = true
  ): Promise<Partial<ProductAnalysis>> {
    try {
      // Generate cache key
      const cacheKey = this.generateCacheKey(product);

      // Check cache first
      const cached = this.getCachedAnalysis(cacheKey);
      if (cached) {
        console.log("📦 Using cached analysis for:", product.name);
        return cached;
      }

      // Always start with rule-based analysis
      const baseAnalysis = this.generateAdvancedRuleBasedAnalysis(product);

      // Only attempt AI enhancement if useAI is true and we have at least one API key
      if (useAI && (this.apiKey || this.useGroq)) {
        try {
          // Try to enhance with AI
          const enhancedAnalysis = await this.tryAIEnhancement(
            product,
            baseAnalysis
          );
          // Return enhanced analysis, and then cache it
          const finalAnalysis = { ...baseAnalysis, ...enhancedAnalysis };
          this.cacheAnalysis(cacheKey, finalAnalysis);
          return finalAnalysis;
        } catch (aiError) {
          console.error(
            "AI enhancement failed for product analysis, using rule-based analysis:",
            aiError
          );
          this.cacheAnalysis(cacheKey, baseAnalysis); // Cache base if AI failed
          return baseAnalysis;
        }
      } else {
        // Skip AI enhancement
        console.log(
          "⚠️ Using rule-based analysis only (AI disabled or no API key)"
        );
        this.cacheAnalysis(cacheKey, baseAnalysis); // Cache base analysis
        return baseAnalysis;
      }
    } catch (error) {
      console.error("Product analysis error (outer catch):", error);
      // Fallback to rule-based analysis even if outer try-catch fails
      const fallbackAnalysis = this.generateAdvancedRuleBasedAnalysis(product);
      this.cacheAnalysis(cacheKey, fallbackAnalysis); // Cache fallback
      return fallbackAnalysis;
    }
  }

  /**
   * Attempts to enhance product analysis with AI reasoning (Groq) and recommendations (HF classification).
   * @param product The product being analyzed.
   * @param baseAnalysis The initial rule-based analysis.
   * @returns A Promise resolving to partial ProductAnalysis enhancements.
   */
  private async tryAIEnhancement(
    product: Product,
    baseAnalysis: Partial<ProductAnalysis>
  ): Promise<Partial<ProductAnalysis>> {
    const enhancements: Partial<ProductAnalysis> = {}; // Start with empty enhancements to apply

    try {
      // Generate AI reasoning using Groq if available
      if (this.useGroq) {
        const aiReasoning = await this.generateGroqReasoning(
          product,
          baseAnalysis
        );
        if (aiReasoning && aiReasoning !== baseAnalysis.aiReasoning) {
          enhancements.aiReasoning = aiReasoning;
        }
      }

      // Use HuggingFace for classification (if API key available)
      if (this.apiKey) {
        const aiRecommendations = await this.generateAIRecommendations(product);
        if (aiRecommendations) {
          // Merge AI recommendations with existing (rule-based) recommendations
          enhancements.recommendations = {
            goodFor: [
              ...new Set([
                ...(baseAnalysis.recommendations?.goodFor || []),
                ...aiRecommendations.goodFor,
              ]),
            ].slice(0, 6),
            avoidIf: [
              ...new Set([
                ...(baseAnalysis.recommendations?.avoidIf || []),
                ...aiRecommendations.avoidIf,
              ]),
            ].slice(0, 4),
          };
        }
      }
    } catch (error) {
      console.error("AI enhancement internal error:", error);
    }

    return enhancements; // Return only the AI-derived enhancements
  }

  /**
   * Generates AI reasoning for product analysis using Groq.
   * @param product The product to analyze.
   * @param analysis The base analysis for context.
   * @returns A Promise resolving to the AI-generated reasoning string.
   */
  private async generateGroqReasoning(
    product: Product,
    analysis: Partial<ProductAnalysis>
  ): Promise<string> {
    if (!this.useGroq) {
      return this.generateDefaultReasoning(product, analysis); // Fallback if Groq not enabled
    }

    const prompt = this.createEnhancedReasoningPrompt(product, analysis);

    try {
      const response = await this.callGroqAPI(prompt); // Use the existing callGroqAPI
      return this.cleanAIResponse(response);
    } catch (error) {
      console.error("Groq reasoning generation failed:", error);
      return this.generateDefaultReasoning(product, analysis); // Fallback on Groq error
    }
  }

  /**
   * Generates AI recommendations by analyzing ingredient safety using Hugging Face classification.
   * @param product The product containing ingredients to analyze.
   * @returns A Promise resolving to an object with 'goodFor' and 'avoidIf' recommendations.
   */
  private async generateAIRecommendations(
    product: Product
  ): Promise<{ goodFor: string[]; avoidIf: string[] } | null> {
    if (!this.apiKey) return null; // Cannot perform if HF API key is missing

    try {
      const ingredientAnalysis = await this.analyzeIngredientSafety(product);
      return {
        goodFor: ingredientAnalysis.benefits.slice(0, 6),
        avoidIf: ingredientAnalysis.warnings.slice(0, 4),
      };
    } catch (error) {
      console.error("AI recommendations failed:", error);
      return null;
    }
  }

  /**
   * Analyzes ingredient safety using working HuggingFace classification models.
   * @param product The product with ingredients to classify.
   * @returns A Promise resolving to benefits and warnings.
   */
  private async analyzeIngredientSafety(
    product: Product
  ): Promise<{ benefits: string[]; warnings: string[] }> {
    const benefits: string[] = [];
    const warnings: string[] = [];

    if (!this.apiKey) {
      console.warn(
        "HuggingFace API key not set, skipping ingredient safety classification."
      );
      return { benefits, warnings };
    }

    if (!product.ingredients || !Array.isArray(product.ingredients)) {
      return { benefits, warnings };
    }

    try {
      // Limit to top 3 ingredients to reduce API calls
      const topIngredients = product.ingredients.slice(0, 3);

      for (const ingredient of topIngredients) {
        const safetyPrompt = `Supplement ingredient "${ingredient.name}" (${
          ingredient.form || "standard form"
        }) safety assessment:`;

        try {
          // Use the working classification models from constants
          const classificationModels = [
            AI_MODELS.HUGGINGFACE.CLASSIFICATION, // facebook/bart-large-mnli
            AI_MODELS.HUGGINGFACE.CLASSIFICATION_ALT, // typeform/distilbert-base-uncased-mnli
          ];

          let classificationResponse: any = null;
          for (const model of classificationModels) {
            try {
              classificationResponse = await this.callHuggingFaceWithRetry(
                {
                  inputs: safetyPrompt,
                  parameters: {
                    candidate_labels: [
                      "safe for general use",
                      "beneficial for health",
                      "requires medical supervision",
                      "may cause side effects",
                      "not recommended for certain groups",
                    ],
                    multi_label: true,
                    threshold: 0.1, // Lower threshold to get more labels initially
                  },
                },
                model
              );
              // Break if a valid classification response is received from any model
              if (
                classificationResponse &&
                this.isValidClassificationResponse(classificationResponse)
              ) {
                break;
              }
            } catch (modelError) {
              console.warn(
                `Classification model ${model} failed, trying next...`,
                modelError
              );
            }
          }

          if (
            classificationResponse &&
            this.isValidClassificationResponse(classificationResponse)
          ) {
            const labels = classificationResponse.labels || [];
            const scores = classificationResponse.scores || [];

            labels.forEach((label: string, index: number) => {
              const score = scores[index] || 0;
              if (score > 0.6) {
                // Use a slightly lower confidence threshold for inclusion
                if (label.includes("safe") || label.includes("beneficial")) {
                  benefits.push(`${ingredient.name}: ${label}`);
                } else if (
                  label.includes("supervision") ||
                  label.includes("side effects") ||
                  label.includes("not recommended")
                ) {
                  warnings.push(`${ingredient.name}: ${label}`);
                }
              }
            });
          }
        } catch (error) {
          console.warn(`Classification failed for ${ingredient.name}:`, error);
        }
      }
    } catch (error) {
      console.error("Ingredient safety analysis failed:", error);
    }

    return { benefits, warnings };
  }

  /**
   * Generate embeddings using HuggingFace (for future semantic search features)
   * @param texts An array of strings to generate embeddings for.
   * @returns A Promise that resolves to an array of embedding vectors (arrays of numbers).
   * @throws Error if API call fails or response is invalid.
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (!this.apiKey) {
      throw new Error("HuggingFace API key not configured for embeddings.");
    }
    if (!texts || texts.length === 0) {
      return []; // Return empty array if no texts provided
    }

    const model = AI_MODELS.HUGGINGFACE.EMBEDDINGS; // sentence-transformers/all-MiniLM-L6-v2

    try {
      // Correct payload format: `inputs` should directly contain the array of texts for sentence-transformers
      const response = await this.callHuggingFaceWithRetry(
        { inputs: texts },
        model
      );

      // Feature extraction models typically return an array of arrays (embeddings)
      // The API response for multiple inputs is an array of arrays of numbers.
      if (
        Array.isArray(response) &&
        response.every(
          (item) =>
            Array.isArray(item) && item.every((val) => typeof val === "number")
        )
      ) {
        return response as number[][];
      } else {
        console.error("Invalid embeddings response structure:", response);
        throw new Error("Invalid response format for embeddings.");
      }
    } catch (error: any) {
      console.error("Failed to generate embeddings:", error);
      throw new Error(
        `Embeddings generation failed: ${error.message || "Unknown error"}`
      );
    }
  }

  /**
   * Makes API call with retry logic for HuggingFace Inference API.
   * @param payload The request body.
   * @param model The HuggingFace model ID.
   * @param retries Number of retries.
   * @returns A Promise resolving to the API response data.
   * @throws The last encountered error if all retries fail.
   */
  private async callHuggingFaceWithRetry(
    payload: any,
    model: string,
    retries: number = 3
  ): Promise<any> {
    let lastError: any;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await this.callHuggingFace(payload, model);

        // Check if model is loading
        if (this.isModelLoadingError(response)) {
          console.log(
            `Model ${model} is loading, waiting... (Attempt ${
              attempt + 1
            }/${retries})`
          );
          await this.waitForModel(model, response.estimated_time);
          continue; // Retry after waiting
        }

        return response;
      } catch (error: any) {
        lastError = error;

        if (attempt < retries - 1) {
          const delay = this.retryDelays[attempt] || 5000;
          console.log(
            `Retrying ${model} in ${delay}ms... (Error: ${
              error.message || error
            })`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError; // Re-throw the last error if all retries fail
  }

  /**
   * Makes a single API call to HuggingFace Inference API.
   * @param payload The request body.
   * @param model The HuggingFace model ID.
   * @returns A Promise resolving to the raw API response data.
   * @throws Error if the API call is not successful or response parsing fails.
   */
  private async callHuggingFace(payload: any, model: string): Promise<any> {
    if (!this.apiKey) {
      throw new Error("HuggingFace API key not configured");
    }

    const url = `${this.baseUrl}/${model}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "x-wait-for-model": "true", // Wait up to 10s for model to load
          "x-use-cache": "true", // Leverage HuggingFace's internal caching
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        let errorData;

        try {
          errorData = JSON.parse(text);
        } catch {
          // Catch JSON parse error
          errorData = { error: text };
        }

        if (
          response.status === 503 &&
          errorData &&
          typeof errorData.estimated_time === "number"
        ) {
          return errorData; // Model loading error
        }

        throw new Error(
          `HuggingFace API error (${model}): ${response.status} - ${
            errorData.error || text || "Unknown error"
          }`
        );
      }

      const text = await response.text();
      // Handle cases where response might be empty or not valid JSON for success
      if (!text || text.trim().length === 0) {
        console.warn(
          `Model ${model} returned OK but with empty/non-parseable text. Returning empty array.`
        );
        return []; // Default to empty array for empty successful responses
      }
      return JSON.parse(text);
    } catch (error: any) {
      if (
        error instanceof SyntaxError &&
        error.message.includes("JSON Parse error")
      ) {
        console.error(`JSON parsing error for model ${model}:`, error);
        throw new Error(
          `Failed to parse response from HuggingFace API (${model}): ${error.message}`
        );
      }
      throw error; // Re-throw other errors (network, etc.)
    }
  }

  /**
   * Advanced rule-based analysis for product scoring.
   * @param product The product data.
   * @returns A partial ProductAnalysis object based on rules.
   */
  private generateAdvancedRuleBasedAnalysis(
    product: Product
  ): Partial<ProductAnalysis> {
    const scores = this.calculateSemiDeterministicScores(product);
    const strengths = this.identifyStrengths(product);
    const weaknesses = this.identifyWeaknesses(product);
    const overallScore = this.calculateWeightedScore(scores);

    return {
      overallScore,
      categoryScores: scores,
      strengths,
      weaknesses,
      recommendations: this.generateBaseRecommendations(product),
      aiReasoning: this.generateDetailedReasoning(product, scores), // Base reasoning, can be overwritten by AI
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Semi-deterministic scoring for product attributes.
   * @param product The product data.
   * @returns An object with category scores.
   */
  private calculateSemiDeterministicScores(product: Product) {
    const productHash = this.simpleHash(product.name + product.brand);
    const variation = (productHash % 10) - 5; // -5 to +5 for consistency

    let ingredients = 50 + variation;
    let bioavailability = 45 + variation;
    let dosage = 60 + variation * 0.5;
    let purity = product.thirdPartyTested ? 80 : 45;
    let value = 55 + variation;

    const productName = product.name.toLowerCase();
    const brandName = product.brand.toLowerCase();

    // Premium brand bonuses
    const premiumBrands = [
      "thorne",
      "life extension",
      "jarrow",
      "now foods",
      "doctor's best",
      "nature made",
      "nordic naturals",
      "pure encapsulations",
      "garden of life",
      "solgar",
      "nutricost",
    ];

    const budgetBrands = [
      "spring valley",
      "equate",
      "kirkland",
      "member's mark",
      "nature's bounty",
      "cvs health",
      "walmart",
      "amazon basics",
    ];

    if (premiumBrands.some((brand) => brandName.includes(brand))) {
      ingredients += 20;
      purity += 25;
      bioavailability += 15;
      value -= 10;
    } else if (budgetBrands.some((brand) => brandName.includes(brand))) {
      ingredients -= 15;
      purity -= 20;
      value += 20;
    }

    // Product-specific scoring
    this.applyProductSpecificScoring(product, {
      ingredients,
      bioavailability,
      dosage,
      purity,
      value,
    });

    // Ensure realistic ranges
    return {
      ingredients: Math.max(15, Math.min(95, Math.round(ingredients))),
      bioavailability: Math.max(10, Math.min(90, Math.round(bioavailability))),
      dosage: Math.max(25, Math.min(85, Math.round(dosage))),
      purity: Math.max(20, Math.min(95, Math.round(purity))),
      value: Math.max(15, Math.min(90, Math.round(value))),
    };
  }

  /**
   * Applies product-specific scoring adjustments.
   * @param product The product data.
   * @param scores The current scores object.
   */
  private applyProductSpecificScoring(product: Product, scores: any): void {
    const productName = product.name.toLowerCase();

    // Fish oil/Omega-3
    if (productName.includes("fish oil") || productName.includes("omega")) {
      scores.bioavailability += 15;
      if (
        productName.includes("triglyceride") ||
        productName.includes("re-esterified")
      ) {
        scores.bioavailability += 25;
        scores.ingredients += 20;
      } else if (productName.includes("ethyl ester")) {
        scores.bioavailability -= 10;
      }
    }

    // Vitamin D
    if (productName.includes("vitamin d")) {
      if (
        productName.includes("d3") ||
        productName.includes("cholecalciferol")
      ) {
        scores.bioavailability += 25;
        scores.ingredients += 20;
      } else if (
        productName.includes("d2") ||
        productName.includes("ergocalciferol")
      ) {
        scores.bioavailability -= 15;
        scores.ingredients -= 10;
      }
    }

    // B12
    if (productName.includes("b12") || productName.includes("cobalamin")) {
      if (productName.includes("methyl")) {
        scores.bioavailability += 30;
        scores.ingredients += 25;
      } else if (productName.includes("cyano")) {
        scores.bioavailability -= 20;
        scores.ingredients -= 15;
      }
    }

    // Magnesium
    if (productName.includes("magnesium")) {
      if (
        productName.includes("glycinate") ||
        productName.includes("citrate") ||
        productName.includes("malate") ||
        productName.includes("threonate")
      ) {
        scores.bioavailability += 25;
        scores.ingredients += 20;
      } else if (productName.includes("oxide")) {
        scores.bioavailability -= 25;
        scores.ingredients -= 20;
      }
    }

    // Zinc
    if (productName.includes("zinc")) {
      if (
        productName.includes("picolinate") ||
        productName.includes("citrate")
      ) {
        scores.bioavailability += 20;
        scores.ingredients += 15;
      } else if (productName.includes("oxide")) {
        scores.bioavailability -= 15;
      }
    }

    // Probiotics
    if (productName.includes("probiotic")) {
      if (
        productName.includes("refrigerated") ||
        productName.includes("live")
      ) {
        scores.purity += 20;
        scores.ingredients += 15;
      }
      if (
        productName.includes("billion cfu") ||
        productName.includes("strain")
      ) {
        scores.dosage += 15;
      }
    }

    // Multivitamins
    if (productName.includes("multivitamin") || productName.includes("multi")) {
      scores.ingredients += 5;
      scores.bioavailability -= 15;
      scores.dosage -= 10;

      if (productName.includes("whole food") || productName.includes("raw")) {
        scores.bioavailability += 20;
        scores.ingredients += 15;
      }
    }
  }

  /**
   * Calculates weighted overall score from category scores.
   * @param scores An object containing category scores.
   * @returns The calculated overall score.
   */
  private calculateWeightedScore(scores: any): number {
    const weights = {
      ingredients: 0.3,
      bioavailability: 0.25,
      dosage: 0.2,
      purity: 0.15,
      value: 0.1,
    };

    return Math.round(
      scores.ingredients * weights.ingredients +
        scores.bioavailability * weights.bioavailability +
        scores.dosage * weights.dosage +
        scores.purity * weights.purity +
        scores.value * weights.value
    );
  }

  /**
   * Identifies product strengths based on predefined rules.
   * @param product The product data.
   * @returns An array of AnalysisPoint objects representing strengths.
   */
  private identifyStrengths(product: Product): AnalysisPoint[] {
    const strengths: AnalysisPoint[] = [];
    const productName = product.name.toLowerCase();
    const brandName = product.brand.toLowerCase();

    if (product.thirdPartyTested) {
      strengths.push({
        point: "Independent quality verification",
        detail: "Third-party tested for purity, potency, and safety compliance",
        importance: "high",
        category: "quality",
      });
    }

    const premiumBrands = [
      "thorne",
      "life extension",
      "jarrow",
      "nordic naturals",
      "pure encapsulations",
      "garden of life",
    ];

    if (premiumBrands.some((brand) => brandName.includes(brand))) {
      strengths.push({
        point: "Reputable brand with quality track record",
        detail: "Manufacturer known for high-quality supplements and research",
        importance: "medium",
        category: "quality",
      });
    }

    // Check for quality forms
    if (product.ingredients) {
      const hasQualityForms = product.ingredients.some(
        (ing) =>
          ing.form?.toLowerCase().includes("methylcobalamin") ||
          ing.form?.toLowerCase().includes("methylfolate") ||
          ing.form?.toLowerCase().includes("chelated") ||
          ing.form?.toLowerCase().includes("liposomal") ||
          ing.form?.toLowerCase().includes("glycinate")
      );

      if (hasQualityForms) {
        strengths.push({
          point: "Premium bioavailable forms",
          detail: "Uses highly absorbable forms for better effectiveness",
          importance: "high",
          category: "efficacy",
        });
      }
    }

    return strengths;
  }

  /**
   * Identifies product weaknesses based on predefined rules.
   * @param product The product data.
   * @returns An array of AnalysisPoint objects representing weaknesses.
   */
  private identifyWeaknesses(product: Product): AnalysisPoint[] {
    const weaknesses: AnalysisPoint[] = [];
    const productName = product.name.toLowerCase();
    const brandName = product.brand.toLowerCase();

    if (!product.thirdPartyTested) {
      weaknesses.push({
        point: "No independent quality verification",
        detail: "Quality and purity claims not verified by third-party testing",
        importance: "medium",
        category: "quality",
      });
    }

    const budgetBrands = [
      "spring valley",
      "equate",
      "kirkland",
      "cvs health",
      "walmart",
    ];

    if (budgetBrands.some((brand) => brandName.includes(brand))) {
      weaknesses.push({
        point: "Budget-tier manufacturing",
        detail:
          "Generic brands may use lower-quality ingredients and less stringent testing",
        importance: "medium",
        category: "quality",
      });
    }

    // Check for poor forms
    if (product.ingredients) {
      const hasPoorForms = product.ingredients.some(
        (ing) =>
          ing.form?.toLowerCase().includes("oxide") ||
          ing.form?.toLowerCase().includes("cyanocobalamin") ||
          ing.form?.toLowerCase().includes("folic acid")
      );

      if (hasPoorForms) {
        weaknesses.push({
          point: "Contains poorly absorbed forms",
          detail: "Some ingredients use forms with lower bioavailability",
          importance: "high",
          category: "efficacy",
        });
      }
    }

    return weaknesses;
  }

  /**
   * Generates base recommendations for a product.
   * @param product The product data.
   * @returns An object with 'goodFor' and 'avoidIf' recommendations.
   */
  private generateBaseRecommendations(product: Product) {
    const goodFor: string[] = [];
    const avoidIf: string[] = [];
    const productName = product.name.toLowerCase();

    if (product.thirdPartyTested) {
      goodFor.push("Quality-conscious consumers");
    }

    // Product-specific recommendations
    if (productName.includes("fish oil") || productName.includes("omega")) {
      goodFor.push("Heart health support", "Anti-inflammatory benefits");
      avoidIf.push("Fish allergies", "Blood thinning medications");
    }

    if (productName.includes("vitamin d")) {
      goodFor.push("Bone health", "Immune support", "Winter supplementation");
      avoidIf.push("Hypercalcemia", "Kidney disease");
    }

    if (productName.includes("b12")) {
      goodFor.push("Energy support", "Vegetarians and vegans");
      if (!productName.includes("methyl")) {
        avoidIf.push("MTHFR gene mutations (use methylated form)");
      }
    }

    if (productName.includes("magnesium")) {
      goodFor.push("Muscle relaxation", "Sleep support", "Stress management");
      if (productName.includes("oxide")) {
        avoidIf.push("Those needing high absorption");
      }
    }

    if (productName.includes("probiotic")) {
      goodFor.push("Digestive health", "Post-antibiotic recovery");
      avoidIf.push("Immunocompromised individuals");
    }

    if (productName.includes("zinc")) {
      goodFor.push("Immune support", "Wound healing");
      avoidIf.push("Copper deficiency", "Taking with calcium or iron");
    }

    return { goodFor, avoidIf };
  }

  /**
   * Generates detailed rule-based reasoning for product analysis.
   * @param product The product data.
   * @param scores The category scores.
   * @returns A detailed reasoning string.
   */
  private generateDetailedReasoning(product: Product, scores: any): string {
    const overallScore = this.calculateWeightedScore(scores);
    const productName = product.name.toLowerCase();

    let reasoning = `${product.name} by ${product.brand} receives a ${overallScore}/100 quality rating. `;

    // Best and worst aspects
    const categories = Object.entries(scores) as [string, number][];
    const bestCategory = categories.reduce((a, b) => (a[1] > b[1] ? a : b));
    const worstCategory = categories.reduce((a, b) => (a[1] < b[1] ? a : b));

    reasoning += `Its strongest aspect is ${bestCategory[0]} (${bestCategory[1]}/100), `;
    reasoning += `while ${worstCategory[0]} needs improvement (${worstCategory[1]}/100). `;

    // Add specific insights based on product type
    if (productName.includes("fish oil") || productName.includes("omega")) {
      reasoning +=
        "Fish oil quality varies significantly by processing method. ";
      if (productName.includes("triglyceride")) {
        reasoning +=
          "The triglyceride form offers superior absorption compared to ethyl esters. ";
      }
    } else if (productName.includes("vitamin d")) {
      reasoning += "Vitamin D3 is the preferred form for supplementation. ";
    } else if (productName.includes("magnesium")) {
      const form = productName.includes("glycinate")
        ? "glycinate"
        : productName.includes("citrate")
        ? "citrate"
        : productName.includes("oxide")
        ? "oxide"
        : "this";
      reasoning += `Magnesium ${form} has specific absorption characteristics and uses. `;
    }

    // Quality verification note
    if (product.thirdPartyTested) {
      reasoning += "Third-party testing provides quality assurance. ";
    } else {
      reasoning +=
        "Consider third-party tested products for verified quality. ";
    }

    return reasoning;
  }

  /**
   * Creates an enhanced reasoning prompt for AI analysis (used by Groq).
   * @param product The product data.
   * @param analysis The partial product analysis.
   * @returns A string prompt for the AI.
   */
  private createEnhancedReasoningPrompt(
    product: Product,
    analysis: Partial<ProductAnalysis>
  ): string {
    const ingredientList = (product.ingredients || [])
      .slice(0, 5)
      .map((ing) => `${ing.name} (${ing.form || "standard form"})`)
      .join(", ");

    return `Analyze this ${
      product.category || "supplement"
    } product for consumers:

Product: ${product.name} by ${product.brand}
Key Ingredients: ${ingredientList || "Not specified"}
Quality Score: ${analysis.overallScore}/100
Third-party Tested: ${product.thirdPartyTested ? "Yes" : "No"}

Provide a concise analysis (max 150 words) covering:
1. Overall quality assessment
2. Key benefits based on ingredients
3. Any concerns or limitations
4. Who would benefit most from this product

Focus on practical, evidence-based insights that help consumers make informed decisions.`;
  }

  /**
   * Cleans and formats AI response text.
   * @param text The raw AI-generated text.
   * @returns The cleaned and formatted text.
   */
  private cleanAIResponse(text: string): string {
    if (!text) return "";

    let cleaned = text.trim().replace(/\s+/g, " ");

    // Remove incomplete sentences
    const sentences = cleaned.match(/[^.!?]+[.!?]+/g) || [];
    cleaned = sentences.join(" ").trim();

    // Ensure proper capitalization
    if (cleaned.length > 0) {
      cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }

    // Truncate if too long
    if (cleaned.length > 300) {
      const lastPeriod = cleaned.lastIndexOf(".", 280);
      if (lastPeriod > 200) {
        cleaned = cleaned.slice(0, lastPeriod + 1);
      } else {
        cleaned = cleaned.slice(0, 280) + "...";
      }
    }

    return cleaned;
  }

  /**
   * Cache management methods.
   */
  private generateCacheKey(product: Product): string {
    const ingredientsHash = (product.ingredients || [])
      .map((ing) => `${ing.name}:${ing.form || ""}`)
      .sort()
      .join("|");

    return `analysis_${product.barcode || product.id}_${product.name}_${
      product.brand
    }_${ingredientsHash}_${product.verified}_${product.thirdPartyTested}`;
  }

  private getCachedAnalysis(key: string): Partial<ProductAnalysis> | null {
    const cached = this.requestCache.get(key);
    if (cached && Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) {
      return cached.data; // Return cached analysis object
    }
    return null;
  }

  private getCachedResponse(key: string): string | null {
    const cached = this.requestCache.get(key);
    if (cached && Date.now() - cached.timestamp < 2 * 60 * 60 * 1000) {
      // 2 hour cache for chat responses
      return cached.data; // Return cached chat string
    }
    return null;
  }

  private cacheAnalysis(key: string, analysis: Partial<ProductAnalysis>): void {
    this.requestCache.set(key, {
      data: analysis,
      timestamp: Date.now(),
    });
    this.cleanupCache();
  }

  private cacheResponse(key: string, response: string): void {
    this.requestCache.set(key, {
      data: response,
      timestamp: Date.now(),
    });
    this.cleanupCache();
  }

  private cleanupCache(): void {
    const MAX_CACHE_SIZE = 100;
    if (this.requestCache.size > MAX_CACHE_SIZE) {
      const firstKey = this.requestCache.keys().next().value;
      if (firstKey) {
        this.requestCache.delete(firstKey);
      }
    }
  }

  /**
   * Validation methods for API responses.
   */
  // Note: isValidTextResponse is no longer directly used for Groq, but kept for HF compatibility
  private isValidTextResponse(
    response: any
  ): response is HuggingFaceTextResponse[] {
    if (Array.isArray(response)) {
      return (
        response.length > 0 && typeof response[0]?.generated_text === "string"
      );
    }
    return response && typeof response.generated_text === "string";
  }

  private isValidClassificationResponse(
    response: any
  ): response is HuggingFaceClassificationResponse {
    return (
      response &&
      typeof response.sequence === "string" &&
      Array.isArray(response.labels) &&
      Array.isArray(response.scores) &&
      response.labels.length === response.scores.length
    );
  }

  private isModelLoadingError(response: any): response is HuggingFaceError {
    return (
      response &&
      typeof response.error === "string" &&
      response.error.includes("is currently loading") &&
      typeof response.estimated_time === "number"
    );
  }

  /**
   * Waits for model to load.
   * @param model The model name.
   * @param estimatedTime Estimated loading time in seconds.
   */
  private async waitForModel(
    model: string,
    estimatedTime?: number
  ): Promise<void> {
    const waitTime = Math.min((estimatedTime || 20) * 1000, 30000); // Max 30 seconds wait
    console.log(
      `Waiting ${Math.round(waitTime / 1000)}s for ${model} to load...`
    );
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }

  /**
   * Simple hash function.
   * @param str The string to hash.
   * @returns A numeric hash.
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  /**
   * Tests AI connections for both HuggingFace and Groq.
   * @returns True if at least one service is available, false otherwise.
   */
  async testAIConnection(): Promise<boolean> {
    console.log("Testing AI connections...");

    let hfSuccess = false;
    let groqSuccess = false;

    // Test HuggingFace classification (known working model)
    if (this.apiKey) {
      try {
        const response = await fetch(
          `${this.baseUrl}/${AI_MODELS.HUGGINGFACE.CLASSIFICATION}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              inputs: "Test supplement safety",
              parameters: {
                candidate_labels: ["safe", "unsafe"],
              },
            }),
          }
        );
        hfSuccess = response.ok;
        console.log(
          hfSuccess
            ? "✅ HuggingFace classification API working"
            : "❌ HuggingFace classification API failed"
        );
      } catch (error) {
        console.log("❌ HuggingFace classification API error:", error);
      }
    } else {
      console.warn("HuggingFace API key not set, skipping HF connection test.");
    }

    // Test Groq if enabled
    if (this.useGroq) {
      try {
        // Use a simple prompt for Groq test
        const response = await this.callGroqAPI("Hello, Groq test connection.");
        groqSuccess = !!response; // If response is not empty, assume success
        console.log("✅ Groq API connection successful");
      } catch (error) {
        console.log("❌ Groq API error:", error);
      }
    } else {
      console.warn("Groq API key not set, skipping Groq connection test.");
    }

    const anySuccess = hfSuccess || groqSuccess;
    console.log(
      anySuccess
        ? "✅ AI services available (at least one connection successful)"
        : "⚠️ AI services unavailable, operating in rule-based/limited mode"
    );

    return anySuccess;
  }

  /**
   * Clears the internal request cache.
   */
  clearCache(): void {
    this.requestCache.clear();
    console.log("✅ AI cache cleared");
  }
}

// Export singleton instance
export const huggingfaceService = new HuggingFaceService();

// Test connection on initialization in development
if (__DEV__) {
  huggingfaceService.testAIConnection();
}
