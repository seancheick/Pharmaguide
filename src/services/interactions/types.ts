// src/services/interactions/types.ts
// Core Type Definitions for Interaction Detection System

/**
 * Severity levels for interactions based on clinical significance
 */
export type InteractionSeverity = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

/**
 * Types of interactions supported by the system
 */
export type InteractionType = 
  | 'supplement-supplement'
  | 'supplement-medication' 
  | 'supplement-condition'
  | 'medication-medication'
  | 'supplement-food'
  | 'supplement-timing';

/**
 * Evidence levels for interaction data
 */
export type EvidenceLevel = 'A' | 'B' | 'C' | 'D';

/**
 * Mechanism categories for how interactions occur
 */
export type InteractionMechanism = 
  | 'absorption_competition'
  | 'absorption_enhancement'
  | 'metabolism_inhibition'
  | 'metabolism_induction'
  | 'receptor_competition'
  | 'synergistic_effect'
  | 'antagonistic_effect'
  | 'cumulative_toxicity'
  | 'nutrient_depletion'
  | 'ph_alteration'
  | 'protein_binding'
  | 'renal_excretion'
  | 'unknown';

/**
 * Core interaction data structure
 */
export interface Interaction {
  id: string;
  type: InteractionType;
  severity: InteractionSeverity;
  
  // Substances involved
  substance1: {
    name: string;
    category: string;
    commonNames: string[];
  };
  substance2: {
    name: string;
    category: string;
    commonNames: string[];
  };
  
  // Clinical details
  mechanism: InteractionMechanism;
  description: string;
  clinicalSignificance: string;
  
  // Evidence and sources
  evidence: {
    level: EvidenceLevel;
    sources: string[];
    studyCount: number;
    lastUpdated: string;
  };
  
  // Recommendations
  recommendations: {
    action: 'avoid' | 'monitor' | 'separate_timing' | 'adjust_dose' | 'consult_provider';
    spacing?: {
      minimumHours: number;
      optimalHours: number;
      explanation: string;
    };
    monitoring?: string[];
    alternatives?: string[];
  };
  
  // Risk factors
  riskFactors?: {
    ageGroups?: string[];
    conditions?: string[];
    dosageThresholds?: {
      substance1?: { amount: number; unit: string };
      substance2?: { amount: number; unit: string };
    };
  };
}

/**
 * Result of interaction checking
 */
export interface InteractionCheckResult {
  hasInteractions: boolean;
  interactions: DetectedInteraction[];
  overallRiskLevel: InteractionSeverity;
  summary: {
    criticalCount: number;
    highCount: number;
    moderateCount: number;
    lowCount: number;
  };
  recommendations: {
    immediate: string[];
    timing: string[];
    monitoring: string[];
    alternatives: string[];
  };
}

/**
 * Detected interaction with context
 */
export interface DetectedInteraction extends Interaction {
  context: {
    userSubstances: {
      substance1Details: SubstanceContext;
      substance2Details: SubstanceContext;
    };
    riskFactorsPresent: string[];
    personalizedSeverity: InteractionSeverity;
    personalizedRecommendations: string[];
  };
}

/**
 * Context about user's specific substance usage
 */
export interface SubstanceContext {
  name: string;
  dosage?: {
    amount: number;
    unit: string;
    frequency: string;
  };
  timing?: string;
  duration?: string;
  source: 'stack' | 'new_product' | 'medication';
}

/**
 * Configuration for interaction checking
 */
export interface InteractionCheckConfig {
  includeTypes: InteractionType[];
  minimumSeverity: InteractionSeverity;
  includeEvidence: EvidenceLevel[];
  personalizeForUser: boolean;
  includeAlternatives: boolean;
  checkTiming: boolean;
}

/**
 * Data source information for tracking reliability
 */
export interface DataSource {
  id: string;
  name: string;
  type: 'clinical_database' | 'research_api' | 'curated_list' | 'ai_generated';
  reliability: 'high' | 'medium' | 'low';
  updateFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
  lastUpdate: string;
  url?: string;
  description: string;
  evidenceLevel: EvidenceLevel;
}

/**
 * Interface for interaction data providers
 */
export interface InteractionDataProvider {
  id: string;
  name: string;
  supportedTypes: InteractionType[];
  
  /**
   * Check for interactions between two substances
   */
  checkInteraction(
    substance1: string,
    substance2: string,
    config?: Partial<InteractionCheckConfig>
  ): Promise<Interaction[]>;
  
  /**
   * Bulk check for multiple substance combinations
   */
  checkMultipleInteractions(
    substances: string[],
    config?: Partial<InteractionCheckConfig>
  ): Promise<Interaction[]>;
  
  /**
   * Get data source information
   */
  getDataSources(): DataSource[];
  
  /**
   * Check if provider is available
   */
  isAvailable(): Promise<boolean>;
}

/**
 * Interface for interaction checkers (plugin architecture)
 */
export interface InteractionChecker {
  readonly type: InteractionType;
  readonly priority: number;
  
  /**
   * Check for interactions
   */
  check(
    substances: SubstanceContext[],
    config?: Partial<InteractionCheckConfig>
  ): Promise<DetectedInteraction[]>;
  
  /**
   * Validate if this checker can handle the given substances
   */
  canHandle(substances: SubstanceContext[]): boolean;
  
  /**
   * Get supported substance categories
   */
  getSupportedCategories(): string[];
}

/**
 * User context for personalized interaction checking
 */
export interface UserInteractionContext {
  demographics?: {
    ageRange: string;
    biologicalSex: string;
    pregnancyStatus?: string;
  };
  healthConditions?: string[];
  allergies?: string[];
  medications?: string[];
  currentStack?: SubstanceContext[];
  healthGoals?: string[];
}

/**
 * Timing-based interaction data
 */
export interface TimingInteraction {
  substance1: string;
  substance2: string;
  conflictType: 'absorption_interference' | 'effectiveness_reduction' | 'side_effect_increase';
  minimumSeparation: number; // hours
  optimalSeparation: number; // hours
  explanation: string;
  severity: InteractionSeverity;
}

/**
 * Cumulative dosage tracking for safety
 */
export interface CumulativeDosageCheck {
  substance: string;
  totalDailyAmount: number;
  unit: string;
  sources: Array<{
    source: string;
    amount: number;
    timing?: string;
  }>;
  safetyThreshold: {
    upperLimit: number;
    unit: string;
    source: string;
  };
  riskLevel: InteractionSeverity;
  recommendations: string[];
}

/**
 * Interaction database entry for storage
 */
export interface InteractionDatabaseEntry {
  id: string;
  interaction: Interaction;
  metadata: {
    createdAt: string;
    updatedAt: string;
    version: string;
    dataSource: string;
    verified: boolean;
  };
  tags: string[];
  searchTerms: string[];
}

/**
 * Performance metrics for interaction checking
 */
export interface InteractionCheckMetrics {
  totalChecks: number;
  averageResponseTime: number;
  cacheHitRate: number;
  errorRate: number;
  dataSourcesUsed: string[];
  timestamp: string;
}
