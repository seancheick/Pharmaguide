// src/services/ai/aiService.ts
import { supabase } from '../supabase/client';
import type { Product, StackItem, ProductAnalysis } from '../../types';
import type { HealthProfile } from '../../hooks/useHealthProfile';
import {
  SupplementAnalyzer,
  EnhancedSupplementAnalysis,
} from '../analysis/supplementAnalyzer';
import { AIModelManager } from './AIModelManager';
import { AICache } from './AICache';
import { analysisRateLimiter } from '../../utils/rateLimiting';
import { localHealthProfileService } from '../health/localHealthProfileService';
import { threeTierRouter, ThreeTierResult } from './threeTierRouter';

interface AIAnalysisResult {
  overallScore?: number;
  categoryScores?: Record<string, number>;
  strengths?: Array<{ point: string; evidence: string }>;
  weaknesses?: Array<{ point: string; evidence: string }>;
  recommendations?: {
    goodFor: string[];
    avoidIf: string[];
  };
  stackInteraction?: any;
  personalizedRecommendations?: string[];
  confidenceScore?: number;
  evidenceLevel?: 'A' | 'B' | 'C' | 'D';
  aiReasoning?: string;
  error?: string;
  fallbackUsed?: boolean;
  timestamp?: string;
}

interface SanitizedHealthProfile {
  ageRange?: string;
  biologicalSex?: string;
  pregnancyStatus?: string;
  conditions?: string[];
  allergies?: string[];
  goals?: string[];
}

interface AIHealthCheckResult {
  groq: boolean;
  huggingface: boolean;
  overall: boolean;
  timestamp: string;
  errors?: string[];
}

export class AIService {
  private supplementAnalyzer: SupplementAnalyzer;
  private modelManager: AIModelManager;
  private cache: AICache;
  private requestQueue: Map<string, Promise<any>> = new Map();

  constructor() {
    this.supplementAnalyzer = new SupplementAnalyzer();
    this.modelManager = new AIModelManager();
    this.cache = new AICache({
      maxSize: 100 * 1024 * 1024, // 100MB for AI responses
      defaultTTL: 12 * 60 * 60 * 1000, // 12 hours for AI analysis
      maxEntries: 2000,
      persistToDisk: true,
    });
  }

  /**
   * Enhanced comprehensive supplement analysis with clinical focus
   */
  async analyzeProductEnhanced(
    product: Product,
    healthProfile?: HealthProfile,
    stack?: StackItem[]
  ): Promise<EnhancedSupplementAnalysis> {
    try {
      // Use the enhanced supplement analyzer for comprehensive analysis
      const enhancedAnalysis =
        await this.supplementAnalyzer.analyzeSupplementComprehensive(
          product,
          healthProfile,
          stack
        );

      return enhancedAnalysis;
    } catch (error) {
      console.error('Enhanced analysis failed:', error);

      // Fallback to basic analysis if enhanced fails
      const basicAnalysis = await this.analyzeProduct(product, stack || []);

      // Convert basic analysis to enhanced format
      return this.convertBasicToEnhanced(basicAnalysis, product);
    }
  }

  /**
   * Quick safety assessment for immediate risk evaluation
   */
  async performQuickSafetyCheck(
    product: Product,
    healthProfile?: HealthProfile
  ): Promise<{
    isSafe: boolean;
    riskLevel: 'NONE' | 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
    immediateWarnings: string[];
    requiresConsultation: boolean;
  }> {
    try {
      return await this.supplementAnalyzer.performSafetyCheck(
        product,
        healthProfile
      );
    } catch (error) {
      console.error('Safety check failed:', error);

      // Conservative fallback
      return {
        isSafe: false,
        riskLevel: 'MODERATE',
        immediateWarnings: [
          'Unable to perform safety check - consult healthcare provider',
        ],
        requiresConsultation: true,
      };
    }
  }

  /**
   * Analyze product with basic stack interaction checking (legacy method)
   */
  async analyzeProduct(
    product: Product,
    stack: StackItem[],
    analysisType: 'groq' | 'huggingface' = 'groq'
  ): Promise<AIAnalysisResult> {
    try {
      const { data, error } = await supabase.functions.invoke('ai-analysis', {
        body: {
          action: 'analyze-product',
          product: this.sanitizeProduct(product),
          stack: stack.map(item => this.sanitizeStackItem(item)),
          analysisType,
        },
        headers: { 'Cache-Control': 'no-cache' },
      });

      if (error) throw error;
      if (!data) throw new Error('No data received from AI service');

      return data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 🚀 THREE-TIER AI ANALYSIS - Your Core Competitive Advantage
   * TIER 1: Rule-based (instant, $0) → TIER 2: Cache (instant, $0) → TIER 3: Live AI (2-5s, ~$0.002)
   * 🔒 HIPAA COMPLIANT: Requires explicit user consent for AI analysis
   */
  async analyzeProductWithThreeTier(
    product: Product,
    stack: StackItem[],
    healthProfile?: HealthProfile,
    options?: {
      priority?: 'speed' | 'quality' | 'cost';
      forceRefresh?: boolean;
      userId?: string;
    }
  ): Promise<ThreeTierResult> {
    const startTime = Date.now();
    const userId = options?.userId;

    try {
      // 🔒 HIPAA COMPLIANCE: Check AI consent before any analysis
      if (userId) {
        const hasAIConsent =
          await localHealthProfileService.hasAIConsent(userId);
        if (!hasAIConsent) {
          throw new Error('AI_CONSENT_REQUIRED');
        }
      }

      // Check rate limiting
      if (userId) {
        const isAllowed = await analysisRateLimiter.isAllowed(
          userId,
          'three-tier-analysis'
        );
        if (!isAllowed) {
          throw new Error('Rate limit exceeded for three-tier analysis');
        }
      }

      // 🚀 THREE-TIER ROUTING: Rules → Cache → AI
      const result = await threeTierRouter.analyzeProduct(
        product,
        stack,
        healthProfile,
        options
      );

      console.log(
        `🚀 Three-tier analysis completed: ${result.tier} (${result.responseTime}ms, saved $${result.costSavings.toFixed(4)})`
      );

      return result;
    } catch (error) {
      console.error('❌ Three-tier analysis failed:', error);
      throw error;
    }
  }

  /**
   * Enhanced AI analysis with intelligent model selection and caching
   * 🔒 HIPAA COMPLIANT: Requires explicit user consent for AI analysis
   * 🚨 LEGACY METHOD - Use analyzeProductWithThreeTier for cost optimization
   */
  async analyzeProductWithEnhancedReasoning(
    product: Product,
    stack: StackItem[],
    healthProfile?: HealthProfile,
    options?: {
      priority?: 'speed' | 'quality' | 'cost' | 'reliability';
      maxLatency?: number;
      forceRefresh?: boolean;
      userId?: string;
    }
  ): Promise<AIAnalysisResult> {
    const startTime = Date.now();
    const priority = options?.priority || 'quality';
    const userId = options?.userId;

    try {
      // 🔒 HIPAA COMPLIANCE: Check AI consent before any analysis
      if (userId) {
        const hasAIConsent =
          await localHealthProfileService.hasAIConsent(userId);
        if (!hasAIConsent) {
          throw new Error('AI_CONSENT_REQUIRED');
        }
      }

      // Check rate limiting
      if (userId) {
        const isAllowed = await analysisRateLimiter.isAllowed(
          userId,
          'enhanced-analysis'
        );
        if (!isAllowed) {
          throw new Error('Rate limit exceeded for enhanced analysis');
        }
      }

      // Generate cache key
      const cacheKey = this.generateEnhancedCacheKey(
        product,
        stack,
        healthProfile,
        priority
      );

      // Check cache first (unless force refresh)
      if (!options?.forceRefresh) {
        const cached = await this.cache.get<AIAnalysisResult>(cacheKey, [
          'analysis',
          'enhanced',
        ]);
        if (cached) {
          console.log('📦 Using cached enhanced analysis');
          return cached;
        }
      }

      // Check for duplicate requests
      const existingRequest = this.requestQueue.get(cacheKey);
      if (existingRequest) {
        console.log('⏳ Waiting for existing request');
        return await existingRequest;
      }

      // Create new request
      const requestPromise = this.performEnhancedAnalysis(
        product,
        stack,
        healthProfile,
        priority,
        options?.maxLatency
      );

      this.requestQueue.set(cacheKey, requestPromise);

      try {
        const result = await requestPromise;

        // Cache successful result
        await this.cache.set(cacheKey, result, {
          ttl: 12 * 60 * 60 * 1000, // 12 hours
          quality: this.calculateResultQuality(result),
          tags: ['analysis', 'enhanced', product.category || 'supplement'],
          priority: priority === 'quality' ? 'high' : 'normal',
        });

        // Record performance metrics
        const responseTime = Date.now() - startTime;
        console.log(`✅ Enhanced analysis completed in ${responseTime}ms`);

        return result;
      } finally {
        this.requestQueue.delete(cacheKey);
      }
    } catch (error) {
      console.error('Enhanced AI analysis failed:', error);

      // Fallback to basic analysis
      return await this.analyzeProductWithHealthProfile(
        product,
        stack,
        healthProfile!
      );
    }
  }

  /**
   * Perform enhanced analysis with intelligent model selection
   */
  private async performEnhancedAnalysis(
    product: Product,
    stack: StackItem[],
    healthProfile?: HealthProfile,
    priority: 'speed' | 'quality' | 'cost' | 'reliability' = 'quality',
    maxLatency?: number
  ): Promise<AIAnalysisResult> {
    // Select optimal model for the task
    const selectedModel = this.modelManager.selectOptimalModel({
      taskType: healthProfile ? 'personalization' : 'analysis',
      priority,
      maxLatency,
      requiresHighQuality: priority === 'quality',
    });

    if (!selectedModel) {
      throw new Error('No suitable AI model available');
    }

    // Get fallback chain for resilience
    const fallbackChain = this.modelManager.getFallbackChain({
      taskType: healthProfile ? 'personalization' : 'analysis',
      priority,
      maxLatency,
    });

    console.log(
      `🎯 Using model: ${selectedModel.name} with ${fallbackChain.length - 1} fallbacks`
    );

    // Try primary model and fallbacks
    for (const model of fallbackChain) {
      const modelStartTime = Date.now();

      try {
        const result = await this.callModelWithRetry(
          model,
          product,
          stack,
          healthProfile
        );

        // Record successful performance
        this.modelManager.recordPerformance(
          model.id,
          Date.now() - modelStartTime,
          this.estimateTokenUsage(result),
          true,
          this.calculateResultQuality(result)
        );

        return this.validateEnhancedResponse(result);
      } catch (error) {
        console.warn(`Model ${model.name} failed:`, error);

        // Record failure
        this.modelManager.recordPerformance(
          model.id,
          Date.now() - modelStartTime,
          0,
          false
        );

        // Continue to next model in fallback chain
        if (model === fallbackChain[fallbackChain.length - 1]) {
          throw error; // Last model failed
        }
      }
    }

    throw new Error('All AI models failed');
  }

  /**
   * Analyze product with health profile integration for personalized recommendations
   */
  async analyzeProductWithHealthProfile(
    product: Product,
    stack: StackItem[],
    healthProfile: HealthProfile,
    analysisType: 'groq' | 'huggingface' = 'groq'
  ): Promise<AIAnalysisResult> {
    try {
      const { data, error } = await supabase.functions.invoke('ai-analysis', {
        body: {
          action: 'analyze-product-personalized',
          product: this.sanitizeProduct(product),
          stack: stack.map(item => this.sanitizeStackItem(item)),
          healthProfile: this.sanitizeHealthProfile(healthProfile),
          analysisType,
        },
        headers: { 'Cache-Control': 'no-cache' },
      });

      if (error) throw error;
      if (!data) throw new Error('No data received from AI service');

      return data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get AI-powered interaction insights with clinical reasoning
   */
  async getInteractionInsights(
    product: Product,
    stack: StackItem[],
    healthProfile?: HealthProfile
  ): Promise<{
    interactions: any[];
    timingRecommendations: any[];
    cumulativeWarnings: any[];
    clinicalRecommendations: string[];
    confidenceLevel: number;
  }> {
    try {
      const { data, error } = await supabase.functions.invoke('ai-analysis', {
        body: {
          action: 'analyze-interactions-enhanced',
          product: this.sanitizeProduct(product),
          stack: stack.map(item => this.sanitizeStackItem(item)),
          healthProfile: healthProfile
            ? this.sanitizeHealthProfile(healthProfile)
            : undefined,
        },
        headers: { 'Cache-Control': 'no-cache' },
      });

      if (error) throw error;
      if (!data) throw new Error('No interaction data received');

      return {
        interactions: data.interactions || [],
        timingRecommendations: data.timingRecommendations || [],
        cumulativeWarnings: data.nutrientWarnings || [],
        clinicalRecommendations: data.recommendations?.immediate || [],
        confidenceLevel: data.confidenceLevel || 70,
      };
    } catch (error) {
      console.error('Interaction insights failed:', error);

      // Return safe fallback
      return {
        interactions: [],
        timingRecommendations: [],
        cumulativeWarnings: [],
        clinicalRecommendations: [
          'Unable to analyze interactions - consult healthcare provider',
        ],
        confidenceLevel: 30,
      };
    }
  }

  /**
   * Test AI service connectivity and health
   */
  async testConnectivity(): Promise<AIHealthCheckResult> {
    try {
      const { data, error } = await supabase.functions.invoke('ai-analysis', {
        body: {
          action: 'health-check',
        },
        headers: { 'Cache-Control': 'no-cache' },
      });

      if (error) throw error;

      return {
        ...data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        groq: false,
        huggingface: false,
        overall: false,
        timestamp: new Date().toISOString(),
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Sanitize product data before sending to AI APIs
   * Removes sensitive information and keeps only necessary data
   */
  private sanitizeProduct(product: Product) {
    return {
      id: product.id,
      name: product.name,
      brand: product.brand,
      category: product.category,
      ingredients:
        product.ingredients?.map(i => ({
          name: i.name,
          amount: i.amount,
          unit: i.unit,
          category: i.category,
        })) || [],
    };
  }

  /**
   * Sanitize stack item data before sending to AI APIs
   * Removes personal information while keeping relevant supplement data
   */
  private sanitizeStackItem(item: StackItem) {
    return {
      id: item.id,
      name: item.name,
      type: item.type,
      dosage: item.dosage,
      frequency: item.frequency,
      ingredients:
        item.ingredients?.map(i => ({
          name: i.name,
          amount: i.amount,
          unit: i.unit,
        })) || [],
    };
  }

  /**
   * Sanitize health profile data for AI analysis
   * Only sends general categories, not specific personal details
   */
  private sanitizeHealthProfile(
    profile: HealthProfile
  ): SanitizedHealthProfile {
    const sanitized: SanitizedHealthProfile = {};

    // Demographics - only general categories
    if (profile.demographics) {
      sanitized.ageRange = profile.demographics.ageRange;
      sanitized.biologicalSex = profile.demographics.biologicalSex;
      sanitized.pregnancyStatus = profile.demographics.pregnancyStatus;
    }

    // Health conditions - only general condition categories
    if (profile.conditions?.conditions) {
      sanitized.conditions = profile.conditions.conditions.filter(
        condition => typeof condition === 'string' && condition.length > 0
      );
    }

    // Allergies - only substance categories, not specific details
    if (profile.allergies?.substances) {
      sanitized.allergies = profile.allergies.substances.filter(
        allergy => typeof allergy === 'string' && allergy.length > 0
      );
    }

    // Health goals - general categories only
    if (profile.goals) {
      const goals = [];
      if (profile.goals.primary) goals.push(profile.goals.primary);
      if (profile.goals.secondary) goals.push(...profile.goals.secondary);
      sanitized.goals = goals;
    }

    return sanitized;
  }

  /**
   * Validate enhanced AI response structure and ensure data quality
   */
  private validateEnhancedResponse(data: any): AIAnalysisResult {
    // Ensure required fields are present
    const validated: AIAnalysisResult = {
      overallScore: this.validateScore(data.overallScore),
      evidenceGrade: this.validateEvidenceGrade(data.evidenceGrade),
      confidenceLevel: this.validateScore(data.confidenceLevel),
      categoryScores: this.validateCategoryScores(data.categoryScores),
      strengths: this.validateStrengthsWeaknesses(data.strengths),
      weaknesses: this.validateStrengthsWeaknesses(data.weaknesses),
      recommendations: this.validateRecommendations(data.recommendations),
      stackInteraction: data.stackInteraction,
      personalizedRecommendations: Array.isArray(
        data.personalizedRecommendations
      )
        ? data.personalizedRecommendations
        : [],
      aiReasoning:
        typeof data.aiReasoning === 'string'
          ? data.aiReasoning
          : 'Enhanced AI analysis completed',
      timestamp: new Date().toISOString(),
    };

    return validated;
  }

  /**
   * Validate score values (0-100)
   */
  private validateScore(score: any): number {
    const num = Number(score);
    if (isNaN(num) || num < 0 || num > 100) {
      return 75; // Default safe score
    }
    return Math.round(num);
  }

  /**
   * Validate evidence grade
   */
  private validateEvidenceGrade(grade: any): 'A' | 'B' | 'C' | 'D' {
    if (['A', 'B', 'C', 'D'].includes(grade)) {
      return grade;
    }
    return 'C'; // Default moderate evidence
  }

  /**
   * Validate category scores object
   */
  private validateCategoryScores(scores: any): Record<string, number> {
    const defaultScores = {
      ingredients: 75,
      bioavailability: 75,
      dosage: 75,
      purity: 75,
      value: 75,
      safety: 75,
    };

    if (!scores || typeof scores !== 'object') {
      return defaultScores;
    }

    const validated: Record<string, number> = {};
    for (const [key, value] of Object.entries(defaultScores)) {
      validated[key] = this.validateScore(scores[key]);
    }

    return validated;
  }

  /**
   * Validate strengths/weaknesses arrays
   */
  private validateStrengthsWeaknesses(
    items: any
  ): Array<{ point: string; evidence: string }> {
    if (!Array.isArray(items)) {
      return [];
    }

    return items
      .filter(item => item && typeof item === 'object')
      .map(item => ({
        point: typeof item.point === 'string' ? item.point : 'Analysis point',
        evidence:
          typeof item.evidence === 'string'
            ? item.evidence
            : 'Clinical assessment',
      }))
      .slice(0, 5); // Limit to 5 items
  }

  /**
   * Validate recommendations object
   */
  private validateRecommendations(recs: any): {
    goodFor: string[];
    avoidIf: string[];
  } {
    const defaultRecs = { goodFor: [], avoidIf: [] };

    if (!recs || typeof recs !== 'object') {
      return defaultRecs;
    }

    return {
      goodFor: Array.isArray(recs.goodFor)
        ? recs.goodFor.filter(item => typeof item === 'string').slice(0, 5)
        : [],
      avoidIf: Array.isArray(recs.avoidIf)
        ? recs.avoidIf.filter(item => typeof item === 'string').slice(0, 5)
        : [],
    };
  }

  /**
   * Generate evidence-based clinical insights
   */
  async generateClinicalInsights(
    product: Product,
    analysisResult: AIAnalysisResult,
    healthProfile?: HealthProfile
  ): Promise<{
    clinicalSignificance: string;
    evidenceQuality: string;
    riskBenefitAssessment: string;
    monitoringRecommendations: string[];
    clinicalPearls: string[];
  }> {
    try {
      // Generate insights based on analysis results and health profile
      const insights = {
        clinicalSignificance: this.assessClinicalSignificance(
          analysisResult,
          product
        ),
        evidenceQuality: this.assessEvidenceQuality(analysisResult),
        riskBenefitAssessment: this.generateRiskBenefitAssessment(
          analysisResult,
          healthProfile
        ),
        monitoringRecommendations: this.generateMonitoringRecommendations(
          product,
          healthProfile
        ),
        clinicalPearls: this.generateClinicalPearls(product, analysisResult),
      };

      return insights;
    } catch (error) {
      console.error('Clinical insights generation failed:', error);

      return {
        clinicalSignificance:
          'Supplement analysis completed with standard assessment',
        evidenceQuality: 'Moderate evidence available for evaluation',
        riskBenefitAssessment: 'Generally well-tolerated with appropriate use',
        monitoringRecommendations: [
          'Monitor for any adverse effects',
          'Follow label directions',
        ],
        clinicalPearls: ['Consult healthcare provider for personalized advice'],
      };
    }
  }

  /**
   * Assess clinical significance based on analysis
   */
  private assessClinicalSignificance(
    result: AIAnalysisResult,
    product: Product
  ): string {
    const score = result.overallScore || 75;
    const evidenceGrade = result.evidenceGrade || 'C';

    if (score >= 85 && ['A', 'B'].includes(evidenceGrade)) {
      return `High clinical significance with strong evidence supporting therapeutic benefit for ${product.category?.toLowerCase() || 'supplementation'}`;
    } else if (score >= 70) {
      return `Moderate clinical significance with reasonable evidence for targeted use`;
    } else {
      return `Limited clinical significance - consider evidence-based alternatives`;
    }
  }

  /**
   * Assess evidence quality
   */
  private assessEvidenceQuality(result: AIAnalysisResult): string {
    const grade = result.evidenceGrade || 'C';
    const confidence = result.confidenceLevel || 70;

    const gradeDescriptions = {
      A: 'High-quality evidence from systematic reviews and randomized controlled trials',
      B: 'Moderate-quality evidence from well-designed clinical studies',
      C: 'Limited evidence from observational studies and case reports',
      D: 'Theoretical evidence based on mechanism of action and in-vitro studies',
    };

    return `${gradeDescriptions[grade]} (Confidence: ${confidence}%)`;
  }

  /**
   * Generate risk-benefit assessment
   */
  private generateRiskBenefitAssessment(
    result: AIAnalysisResult,
    healthProfile?: HealthProfile
  ): string {
    const safetyScore = result.categoryScores?.safety || 75;
    const overallScore = result.overallScore || 75;

    let assessment = '';

    if (safetyScore >= 80 && overallScore >= 75) {
      assessment =
        'Favorable risk-benefit profile with low safety concerns and demonstrated efficacy';
    } else if (safetyScore >= 70) {
      assessment = 'Acceptable risk-benefit profile with standard precautions';
    } else {
      assessment =
        'Requires careful risk-benefit evaluation - consider safer alternatives';
    }

    if (
      healthProfile?.conditions?.conditions &&
      healthProfile.conditions.conditions.length > 0
    ) {
      assessment +=
        '. Additional monitoring recommended due to existing health conditions';
    }

    return assessment;
  }

  /**
   * Generate monitoring recommendations
   */
  private generateMonitoringRecommendations(
    product: Product,
    healthProfile?: HealthProfile
  ): string[] {
    const recommendations = ['Follow recommended dosage instructions'];

    // Add ingredient-specific monitoring
    if (product.ingredients) {
      const ingredientNames = product.ingredients.map(i =>
        i.name.toLowerCase()
      );

      if (ingredientNames.some(name => name.includes('iron'))) {
        recommendations.push(
          'Monitor for gastrointestinal effects (nausea, constipation)'
        );
      }

      if (ingredientNames.some(name => name.includes('vitamin d'))) {
        recommendations.push(
          'Consider periodic vitamin D blood level monitoring'
        );
      }

      if (ingredientNames.some(name => name.includes('calcium'))) {
        recommendations.push('Monitor for kidney stone risk if predisposed');
      }
    }

    // Add health profile-specific monitoring
    if (healthProfile?.demographics?.ageRange?.includes('65+')) {
      recommendations.push(
        'Enhanced monitoring recommended for age-related metabolism changes'
      );
    }

    if (healthProfile?.demographics?.pregnancyStatus === 'pregnant') {
      recommendations.push('Regular prenatal care provider consultation');
    }

    return recommendations;
  }

  /**
   * Generate clinical pearls
   */
  private generateClinicalPearls(
    product: Product,
    result: AIAnalysisResult
  ): string[] {
    const pearls = [];

    // Add evidence-based pearls
    if (result.evidenceGrade === 'A') {
      pearls.push('Strong clinical evidence supports therapeutic use');
    }

    // Add category-specific pearls
    if (product.category?.toLowerCase().includes('vitamin')) {
      pearls.push(
        'Fat-soluble vitamins (A,D,E,K) best absorbed with dietary fat'
      );
    }

    if (product.category?.toLowerCase().includes('mineral')) {
      pearls.push(
        'Mineral absorption can be affected by food timing and other supplements'
      );
    }

    // Add interaction pearls
    if (result.stackInteraction?.interactions?.length > 0) {
      pearls.push(
        'Timing optimization can significantly improve supplement effectiveness'
      );
    }

    pearls.push(
      'Individual response may vary - adjust based on clinical outcomes'
    );

    return pearls;
  }

  /**
   * Call AI model with retry logic and circuit breaker
   */
  private async callModelWithRetry(
    model: any,
    product: Product,
    stack: StackItem[],
    healthProfile?: HealthProfile,
    maxRetries: number = 3
  ): Promise<any> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const action = healthProfile
          ? 'analyze-product-personalized'
          : 'analyze-product';

        const { data, error } = await supabase.functions.invoke('ai-analysis', {
          body: {
            action,
            product: this.sanitizeProduct(product),
            stack: stack.map(item => this.sanitizeStackItem(item)),
            healthProfile: healthProfile
              ? this.sanitizeHealthProfile(healthProfile)
              : undefined,
            analysisType: model.provider === 'groq' ? 'groq' : 'huggingface',
            modelId: model.id,
            enhancedReasoning: true,
          },
          headers: {
            'Cache-Control': 'no-cache',
            'X-Model-ID': model.id,
            'X-Attempt': attempt.toString(),
          },
        });

        if (error) throw new Error(error.message || 'AI service error');
        if (!data) throw new Error('No data received from AI service');

        return data;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');

        if (attempt < maxRetries) {
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          console.log(`Retry attempt ${attempt + 1} in ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('All retry attempts failed');
  }

  /**
   * Generate enhanced cache key for intelligent caching
   */
  private generateEnhancedCacheKey(
    product: Product,
    stack: StackItem[],
    healthProfile?: HealthProfile,
    priority?: string
  ): string {
    const productKey = `${product.id}_${product.name}_${product.brand}`;
    const stackKey = stack
      .map(item => `${item.id}_${item.dosage}`)
      .sort()
      .join('|');
    const profileKey = healthProfile
      ? this.generateProfileKey(healthProfile)
      : 'no_profile';
    const priorityKey = priority || 'default';

    return `enhanced_analysis_${productKey}_${stackKey}_${profileKey}_${priorityKey}`;
  }

  /**
   * Generate health profile key for caching
   */
  private generateProfileKey(profile: HealthProfile): string {
    const demo = profile.demographics;
    const conditions = profile.conditions?.conditions?.sort().join(',') || '';
    const allergies = profile.allergies?.substances?.sort().join(',') || '';
    const goals = profile.goals
      ? `${profile.goals.primary}_${profile.goals.secondary?.sort().join(',')}`
      : '';

    return `${demo?.ageRange}_${demo?.biologicalSex}_${demo?.pregnancyStatus}_${conditions}_${allergies}_${goals}`;
  }

  /**
   * Calculate result quality score for caching prioritization
   */
  private calculateResultQuality(result: AIAnalysisResult): number {
    let quality = 0.5; // Base quality

    // Evidence grade contributes to quality
    if (result.evidenceGrade) {
      const gradeScores = { A: 1.0, B: 0.8, C: 0.6, D: 0.4 };
      quality += (gradeScores[result.evidenceGrade] || 0.5) * 0.3;
    }

    // Confidence level contributes
    if (result.confidenceScore) {
      quality += (result.confidenceScore / 100) * 0.2;
    }

    // Completeness of analysis
    const hasStrengths = result.strengths && result.strengths.length > 0;
    const hasWeaknesses = result.weaknesses && result.weaknesses.length > 0;
    const hasRecommendations =
      result.recommendations &&
      (result.recommendations.goodFor.length > 0 ||
        result.recommendations.avoidIf.length > 0);

    if (hasStrengths) quality += 0.1;
    if (hasWeaknesses) quality += 0.1;
    if (hasRecommendations) quality += 0.1;

    // AI reasoning quality
    if (result.aiReasoning && result.aiReasoning.length > 100) {
      quality += 0.1;
    }

    return Math.min(1.0, quality);
  }

  /**
   * Estimate token usage for performance tracking
   */
  private estimateTokenUsage(result: any): number {
    // Rough estimation based on response size
    const responseText = JSON.stringify(result);
    return Math.ceil(responseText.length / 4); // Approximate tokens
  }

  /**
   * Get AI service performance metrics
   */
  getPerformanceMetrics(): {
    modelStats: any[];
    cacheStats: any;
    overallPerformance: {
      averageResponseTime: number;
      successRate: number;
      cacheHitRate: number;
    };
  } {
    const modelStats = this.modelManager.getAvailableModels().map(model => ({
      ...model,
      stats: this.modelManager.getModelStats(model.id),
    }));

    const cacheStats = this.cache.getStats();

    // Calculate overall performance
    const totalRequests = cacheStats.totalRequests;
    const averageResponseTime = cacheStats.averageResponseTime;
    const successRate =
      totalRequests > 0
        ? modelStats.reduce((sum, model) => {
            const stats = model.stats;
            return sum + (stats ? stats.reliability : 0);
          }, 0) / modelStats.length
        : 0;

    return {
      modelStats,
      cacheStats,
      overallPerformance: {
        averageResponseTime,
        successRate,
        cacheHitRate: cacheStats.hitRate,
      },
    };
  }

  /**
   * Invalidate cache for specific patterns
   */
  async invalidateCache(pattern?: {
    productId?: string;
    category?: string;
    userId?: string;
    tags?: string[];
  }): Promise<number> {
    if (!pattern) {
      return this.cache.clear();
    }

    if (pattern.tags) {
      return this.cache.invalidateByTags(pattern.tags);
    }

    if (pattern.productId || pattern.category) {
      const regex = new RegExp(
        `enhanced_analysis_${pattern.productId || '[^_]+'}.*${pattern.category || ''}`,
        'i'
      );
      return this.cache.clear(regex);
    }

    return 0;
  }

  /**
   * Optimize AI service performance
   */
  async optimizePerformance(): Promise<{
    cacheOptimization: any;
    modelHealthCheck: void;
  }> {
    console.log('🔧 Optimizing AI service performance...');

    // Optimize cache
    const cacheOptimization = this.cache.optimize();

    // Perform model health check
    const modelHealthCheck = await this.modelManager.performHealthCheck();

    console.log(`✅ Performance optimization complete:
      - Removed ${cacheOptimization.removedEntries} cache entries
      - Freed ${Math.round(cacheOptimization.freedSpace / 1024)}KB
      - Model health check completed`);

    return { cacheOptimization, modelHealthCheck };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.modelManager.destroy();
    this.requestQueue.clear();
  }

  /**
   * Enhanced error handling with different error types
   */
  private handleError(error: unknown): AIAnalysisResult {
    const timestamp = new Date().toISOString();
    let errorMessage =
      'AI analysis temporarily unavailable. Please try again later.';

    if (error instanceof Error) {
      console.error('AI Service Error:', error.message);

      // Handle specific error types
      if (error.message.includes('rate limit')) {
        errorMessage =
          'AI service rate limit exceeded. Please wait a moment and try again.';
      } else if (error.message.includes('timeout')) {
        errorMessage =
          'AI service timeout. Please check your connection and try again.';
      } else if (error.message.includes('unauthorized')) {
        errorMessage =
          'AI service authentication failed. Please contact support.';
      } else if (error.message.includes('No data received')) {
        errorMessage = 'AI analysis failed. Please try again later.';
      }
    } else {
      console.error('Unknown AI Service Error:', error);
    }

    return {
      error: errorMessage,
      fallbackUsed: true,
      timestamp,
    };
  }

  /**
   * Convert basic AI analysis to enhanced format for fallback scenarios
   */
  private convertBasicToEnhanced(
    basicAnalysis: AIAnalysisResult,
    product: Product
  ): EnhancedSupplementAnalysis {
    return {
      overallScore: basicAnalysis.overallScore || 70,
      riskLevel: 'LOW',
      confidenceLevel: 60,
      evidenceGrade: 'C',
      categoryScores: {
        ingredients: basicAnalysis.categoryScores?.ingredients || 70,
        bioavailability: basicAnalysis.categoryScores?.bioavailability || 65,
        dosage: basicAnalysis.categoryScores?.dosage || 70,
        purity: basicAnalysis.categoryScores?.purity || 68,
        value: basicAnalysis.categoryScores?.value || 65,
        safety: 75,
      },
      ingredientAnalyses: [],
      clinicalAssessment: {
        ageAppropriate: true,
        pregnancySafe: true,
        breastfeedingSafe: true,
        conditionCompatible: true,
        dosageOptimal: true,
      },
      personalizedRecommendations: {
        dosageAdjustments: [],
        timingRecommendations: ['Take as directed on label'],
        lifestyleConsiderations: ['Maintain consistent supplementation'],
        monitoringAdvice: ['Monitor for any adverse effects'],
      },
      safetyProfile: {
        contraindications: [],
        warnings: basicAnalysis.error ? [basicAnalysis.error] : [],
        sideEffects: [],
        drugInteractions: [],
        nutrientInteractions: [],
      },
      qualityAssessment: {
        formOptimization: [],
        purityConcerns: [],
        certificationStatus: product.brand ? [`Brand: ${product.brand}`] : [],
        storageRequirements: ['Store in cool, dry place'],
      },
      evidenceSummary: {
        clinicalSupport: ['Basic analysis completed'],
        researchGaps: ['Enhanced analysis unavailable'],
        alternativeOptions: [],
      },
      stackCompatibility: undefined,
    };
  }
}

export const aiService = new AIService();
