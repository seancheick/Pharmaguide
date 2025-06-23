// src/services/ai/AIModelManager.ts
// Advanced AI Model Management with Intelligent Selection and Fallback

interface ModelConfig {
  id: string;
  name: string;
  provider: 'groq' | 'huggingface' | 'openai' | 'anthropic';
  endpoint: string;
  maxTokens: number;
  costPerToken: number;
  averageLatency: number;
  reliability: number; // 0-1 score
  capabilities: ModelCapability[];
  priority: number; // Higher = preferred
  isAvailable: boolean;
  lastHealthCheck: number;
  errorCount: number;
  successCount: number;
}

interface ModelCapability {
  type: 'analysis' | 'reasoning' | 'interaction' | 'personalization' | 'safety';
  strength: number; // 0-1 score
}

interface ModelPerformanceMetrics {
  responseTime: number;
  tokenUsage: number;
  errorRate: number;
  qualityScore: number;
  timestamp: number;
}

interface ModelSelectionCriteria {
  taskType: 'analysis' | 'reasoning' | 'interaction' | 'personalization' | 'safety';
  priority: 'speed' | 'quality' | 'cost' | 'reliability';
  maxLatency?: number;
  maxCost?: number;
  requiresHighQuality?: boolean;
}

/**
 * Advanced AI Model Manager with intelligent selection and performance optimization
 */
export class AIModelManager {
  private models: Map<string, ModelConfig> = new Map();
  private performanceMetrics: Map<string, ModelPerformanceMetrics[]> = new Map();
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private readonly maxMetricsHistory = 100;
  private readonly healthCheckIntervalMs = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.initializeModels();
    this.startHealthChecking();
  }

  /**
   * Initialize available AI models with their configurations
   */
  private initializeModels(): void {
    const models: ModelConfig[] = [
      {
        id: 'groq-llama3-70b',
        name: 'Llama 3 70B (Groq)',
        provider: 'groq',
        endpoint: 'llama3-70b-8192',
        maxTokens: 8192,
        costPerToken: 0.0000008, // Very low cost
        averageLatency: 800, // ms
        reliability: 0.95,
        capabilities: [
          { type: 'analysis', strength: 0.9 },
          { type: 'reasoning', strength: 0.95 },
          { type: 'interaction', strength: 0.85 },
          { type: 'personalization', strength: 0.8 },
          { type: 'safety', strength: 0.9 }
        ],
        priority: 100, // Highest priority
        isAvailable: true,
        lastHealthCheck: Date.now(),
        errorCount: 0,
        successCount: 0
      },
      {
        id: 'groq-mixtral-8x7b',
        name: 'Mixtral 8x7B (Groq)',
        provider: 'groq',
        endpoint: 'mixtral-8x7b-32768',
        maxTokens: 32768,
        costPerToken: 0.0000006,
        averageLatency: 600,
        reliability: 0.92,
        capabilities: [
          { type: 'analysis', strength: 0.85 },
          { type: 'reasoning', strength: 0.9 },
          { type: 'interaction', strength: 0.9 },
          { type: 'personalization', strength: 0.85 },
          { type: 'safety', strength: 0.85 }
        ],
        priority: 90,
        isAvailable: true,
        lastHealthCheck: Date.now(),
        errorCount: 0,
        successCount: 0
      },
      {
        id: 'hf-clinical-bert',
        name: 'Clinical BERT (HuggingFace)',
        provider: 'huggingface',
        endpoint: 'emilyalsentzer/Bio_ClinicalBERT',
        maxTokens: 512,
        costPerToken: 0.000002,
        averageLatency: 1200,
        reliability: 0.88,
        capabilities: [
          { type: 'analysis', strength: 0.95 },
          { type: 'reasoning', strength: 0.7 },
          { type: 'interaction', strength: 0.6 },
          { type: 'personalization', strength: 0.75 },
          { type: 'safety', strength: 0.9 }
        ],
        priority: 70, // Specialized for clinical analysis
        isAvailable: true,
        lastHealthCheck: Date.now(),
        errorCount: 0,
        successCount: 0
      },
      {
        id: 'hf-biobert',
        name: 'BioBERT (HuggingFace)',
        provider: 'huggingface',
        endpoint: 'dmis-lab/biobert-base-cased-v1.1',
        maxTokens: 512,
        costPerToken: 0.000002,
        averageLatency: 1000,
        reliability: 0.85,
        capabilities: [
          { type: 'analysis', strength: 0.9 },
          { type: 'reasoning', strength: 0.65 },
          { type: 'interaction', strength: 0.5 },
          { type: 'personalization', strength: 0.7 },
          { type: 'safety', strength: 0.85 }
        ],
        priority: 60,
        isAvailable: true,
        lastHealthCheck: Date.now(),
        errorCount: 0,
        successCount: 0
      }
    ];

    models.forEach(model => {
      this.models.set(model.id, model);
      this.performanceMetrics.set(model.id, []);
    });

    console.log(`✅ Initialized ${models.length} AI models`);
  }

  /**
   * Select the best model for a given task based on criteria
   */
  selectOptimalModel(criteria: ModelSelectionCriteria): ModelConfig | null {
    const availableModels = Array.from(this.models.values())
      .filter(model => model.isAvailable)
      .filter(model => this.hasCapability(model, criteria.taskType));

    if (availableModels.length === 0) {
      console.warn('No available models for task type:', criteria.taskType);
      return null;
    }

    // Score models based on criteria
    const scoredModels = availableModels.map(model => ({
      model,
      score: this.calculateModelScore(model, criteria)
    }));

    // Sort by score (highest first)
    scoredModels.sort((a, b) => b.score - a.score);

    const selectedModel = scoredModels[0].model;
    console.log(`🎯 Selected model: ${selectedModel.name} (score: ${scoredModels[0].score.toFixed(2)})`);
    
    return selectedModel;
  }

  /**
   * Get fallback model chain for resilient processing
   */
  getFallbackChain(criteria: ModelSelectionCriteria): ModelConfig[] {
    const availableModels = Array.from(this.models.values())
      .filter(model => model.isAvailable)
      .filter(model => this.hasCapability(model, criteria.taskType))
      .sort((a, b) => {
        // Primary sort by reliability
        const reliabilityDiff = b.reliability - a.reliability;
        if (Math.abs(reliabilityDiff) > 0.05) return reliabilityDiff;
        
        // Secondary sort by priority
        return b.priority - a.priority;
      });

    return availableModels.slice(0, 3); // Return top 3 as fallback chain
  }

  /**
   * Record model performance metrics
   */
  recordPerformance(
    modelId: string,
    responseTime: number,
    tokenUsage: number,
    success: boolean,
    qualityScore?: number
  ): void {
    const model = this.models.get(modelId);
    if (!model) return;

    // Update success/error counts
    if (success) {
      model.successCount++;
    } else {
      model.errorCount++;
    }

    // Update reliability score
    const totalRequests = model.successCount + model.errorCount;
    model.reliability = totalRequests > 0 ? model.successCount / totalRequests : 0.5;

    // Record detailed metrics
    const metrics: ModelPerformanceMetrics = {
      responseTime,
      tokenUsage,
      errorRate: model.errorCount / Math.max(totalRequests, 1),
      qualityScore: qualityScore || 0.8,
      timestamp: Date.now()
    };

    const modelMetrics = this.performanceMetrics.get(modelId) || [];
    modelMetrics.push(metrics);

    // Keep only recent metrics
    if (modelMetrics.length > this.maxMetricsHistory) {
      modelMetrics.splice(0, modelMetrics.length - this.maxMetricsHistory);
    }

    this.performanceMetrics.set(modelId, modelMetrics);

    // Update average latency
    const recentMetrics = modelMetrics.slice(-10); // Last 10 requests
    model.averageLatency = recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length;
  }

  /**
   * Get model performance statistics
   */
  getModelStats(modelId: string): {
    averageResponseTime: number;
    reliability: number;
    totalRequests: number;
    averageQuality: number;
    costEfficiency: number;
  } | null {
    const model = this.models.get(modelId);
    const metrics = this.performanceMetrics.get(modelId);
    
    if (!model || !metrics) return null;

    const recentMetrics = metrics.slice(-50); // Last 50 requests
    const totalRequests = model.successCount + model.errorCount;

    return {
      averageResponseTime: model.averageLatency,
      reliability: model.reliability,
      totalRequests,
      averageQuality: recentMetrics.length > 0 
        ? recentMetrics.reduce((sum, m) => sum + m.qualityScore, 0) / recentMetrics.length 
        : 0.8,
      costEfficiency: totalRequests > 0 
        ? (model.successCount / totalRequests) / model.costPerToken 
        : 0
    };
  }

  /**
   * Get all available models with their current status
   */
  getAvailableModels(): Array<{
    id: string;
    name: string;
    provider: string;
    isAvailable: boolean;
    reliability: number;
    averageLatency: number;
    capabilities: string[];
  }> {
    return Array.from(this.models.values()).map(model => ({
      id: model.id,
      name: model.name,
      provider: model.provider,
      isAvailable: model.isAvailable,
      reliability: model.reliability,
      averageLatency: model.averageLatency,
      capabilities: model.capabilities.map(c => c.type)
    }));
  }

  /**
   * Force health check for all models
   */
  async performHealthCheck(): Promise<void> {
    console.log('🔍 Performing AI model health check...');
    
    const healthPromises = Array.from(this.models.values()).map(async (model) => {
      try {
        const isHealthy = await this.checkModelHealth(model);
        model.isAvailable = isHealthy;
        model.lastHealthCheck = Date.now();
        
        if (!isHealthy) {
          console.warn(`⚠️ Model ${model.name} is unhealthy`);
        }
      } catch (error) {
        console.error(`❌ Health check failed for ${model.name}:`, error);
        model.isAvailable = false;
        model.lastHealthCheck = Date.now();
      }
    });

    await Promise.allSettled(healthPromises);
    
    const healthyCount = Array.from(this.models.values()).filter(m => m.isAvailable).length;
    console.log(`✅ Health check complete: ${healthyCount}/${this.models.size} models available`);
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  // Private helper methods

  private hasCapability(model: ModelConfig, taskType: string): boolean {
    return model.capabilities.some(cap => cap.type === taskType && cap.strength > 0.5);
  }

  private calculateModelScore(model: ModelConfig, criteria: ModelSelectionCriteria): number {
    let score = 0;

    // Base score from capability strength
    const capability = model.capabilities.find(cap => cap.type === criteria.taskType);
    score += (capability?.strength || 0) * 40;

    // Priority-based scoring
    switch (criteria.priority) {
      case 'speed':
        score += (1 - (model.averageLatency / 3000)) * 30; // Normalize to 3s max
        score += model.reliability * 20;
        score += (1 - model.costPerToken * 1000000) * 10; // Cost factor
        break;
      case 'quality':
        score += (capability?.strength || 0) * 40;
        score += model.reliability * 30;
        score += (1 - (model.averageLatency / 5000)) * 10; // Less weight on speed
        break;
      case 'cost':
        score += (1 - model.costPerToken * 1000000) * 40;
        score += model.reliability * 30;
        score += (capability?.strength || 0) * 20;
        break;
      case 'reliability':
        score += model.reliability * 50;
        score += (capability?.strength || 0) * 30;
        score += (1 - (model.averageLatency / 3000)) * 20;
        break;
    }

    // Apply constraints
    if (criteria.maxLatency && model.averageLatency > criteria.maxLatency) {
      score *= 0.5; // Penalty for exceeding latency requirement
    }

    if (criteria.maxCost && model.costPerToken > criteria.maxCost) {
      score *= 0.3; // Heavy penalty for exceeding cost requirement
    }

    if (criteria.requiresHighQuality && (capability?.strength || 0) < 0.8) {
      score *= 0.6; // Penalty for insufficient quality
    }

    return Math.max(0, Math.min(100, score));
  }

  private async checkModelHealth(model: ModelConfig): Promise<boolean> {
    // Implement actual health check based on provider
    // For now, return true with some randomness to simulate real conditions
    return Math.random() > 0.05; // 95% uptime simulation
  }

  private startHealthChecking(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck().catch(console.error);
    }, this.healthCheckIntervalMs);

    // Initial health check
    setTimeout(() => this.performHealthCheck(), 1000);
  }
}
