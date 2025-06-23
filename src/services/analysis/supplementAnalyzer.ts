// src/services/analysis/supplementAnalyzer.ts
// Enhanced Supplement Analysis System with Clinical Focus

import {
  IngredientAnalyzer,
  DemographicFactors,
  IngredientAnalysisResult,
} from './ingredientAnalyzer';
import type { Product, StackItem } from '../../types';
import type { HealthProfile } from '../../hooks/useHealthProfile';

export interface EnhancedSupplementAnalysis {
  // Overall Assessment
  overallScore: number; // 0-100
  riskLevel: 'NONE' | 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  confidenceLevel: number; // 0-100
  evidenceGrade: 'A' | 'B' | 'C' | 'D';

  // Detailed Category Scores
  categoryScores: {
    ingredients: number; // 0-100
    bioavailability: number; // 0-100
    dosage: number; // 0-100
    purity: number; // 0-100
    value: number; // 0-100
    safety: number; // 0-100
  };

  // Ingredient-Level Analysis
  ingredientAnalyses: IngredientAnalysisResult[];

  // Clinical Assessment
  clinicalAssessment: {
    ageAppropriate: boolean;
    pregnancySafe: boolean;
    breastfeedingSafe: boolean;
    conditionCompatible: boolean;
    dosageOptimal: boolean;
  };

  // Personalized Recommendations
  personalizedRecommendations: {
    dosageAdjustments: string[];
    timingRecommendations: string[];
    lifestyleConsiderations: string[];
    monitoringAdvice: string[];
  };

  // Safety Profile
  safetyProfile: {
    contraindications: string[];
    warnings: string[];
    sideEffects: string[];
    drugInteractions: string[];
    nutrientInteractions: string[];
  };

  // Quality Assessment
  qualityAssessment: {
    formOptimization: string[];
    purityConcerns: string[];
    certificationStatus: string[];
    storageRequirements: string[];
  };

  // Evidence Summary
  evidenceSummary: {
    clinicalSupport: string[];
    researchGaps: string[];
    alternativeOptions: string[];
  };

  // Stack Integration
  stackCompatibility?: {
    synergies: string[];
    conflicts: string[];
    cumulativeRisks: string[];
    optimizationSuggestions: string[];
  };
}

export class SupplementAnalyzer {
  private ingredientAnalyzer: IngredientAnalyzer;

  constructor() {
    this.ingredientAnalyzer = new IngredientAnalyzer();
  }

  /**
   * Perform comprehensive supplement analysis with health profile integration
   */
  async analyzeSupplementComprehensive(
    product: Product,
    healthProfile?: HealthProfile,
    currentStack?: StackItem[]
  ): Promise<EnhancedSupplementAnalysis> {
    // Convert health profile to demographic factors
    const demographics = this.convertHealthProfileToDemographics(healthProfile);

    // Analyze individual ingredients
    const ingredientAnalyses = await this.analyzeIngredients(
      product,
      demographics
    );

    // Calculate category scores
    const categoryScores = this.calculateCategoryScores(ingredientAnalyses);

    // Perform clinical assessment
    const clinicalAssessment = this.performClinicalAssessment(
      ingredientAnalyses,
      demographics,
      healthProfile
    );

    // Generate personalized recommendations
    const personalizedRecommendations =
      this.generatePersonalizedRecommendations(
        ingredientAnalyses,
        demographics,
        healthProfile
      );

    // Assess safety profile
    const safetyProfile = this.assessSafetyProfile(
      ingredientAnalyses,
      demographics
    );

    // Evaluate quality
    const qualityAssessment = this.evaluateQuality(ingredientAnalyses, product);

    // Summarize evidence
    const evidenceSummary = this.summarizeEvidence(ingredientAnalyses);

    // Analyze stack compatibility if provided
    const stackCompatibility = currentStack
      ? await this.analyzeStackCompatibility(
          product,
          currentStack,
          demographics
        )
      : undefined;

    // Calculate overall metrics
    const overallScore = this.calculateOverallScore(
      categoryScores,
      clinicalAssessment
    );
    const riskLevel = this.determineRiskLevel(
      safetyProfile,
      clinicalAssessment
    );
    const confidenceLevel = this.calculateConfidenceLevel(ingredientAnalyses);
    const evidenceGrade = this.determineEvidenceGrade(ingredientAnalyses);

    return {
      overallScore,
      riskLevel,
      confidenceLevel,
      evidenceGrade,
      categoryScores,
      ingredientAnalyses,
      clinicalAssessment,
      personalizedRecommendations,
      safetyProfile,
      qualityAssessment,
      evidenceSummary,
      stackCompatibility,
    };
  }

  /**
   * Quick safety check for immediate risk assessment
   */
  async performSafetyCheck(
    product: Product,
    healthProfile?: HealthProfile
  ): Promise<{
    isSafe: boolean;
    riskLevel: 'NONE' | 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
    immediateWarnings: string[];
    requiresConsultation: boolean;
  }> {
    const demographics = this.convertHealthProfileToDemographics(healthProfile);
    const ingredientAnalyses = await this.analyzeIngredients(
      product,
      demographics
    );

    const immediateWarnings: string[] = [];
    let highestRisk: 'NONE' | 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'NONE';

    // Check for critical safety issues
    for (const analysis of ingredientAnalyses) {
      if (analysis.warnings.some(w => w.includes('⚠️'))) {
        immediateWarnings.push(
          ...analysis.warnings.filter(w => w.includes('⚠️'))
        );
        if (analysis.safetyScore < 30) {
          highestRisk = 'CRITICAL';
        } else if (analysis.safetyScore < 50 && highestRisk !== 'CRITICAL') {
          highestRisk = 'HIGH';
        } else if (
          analysis.safetyScore < 70 &&
          !['CRITICAL', 'HIGH'].includes(highestRisk)
        ) {
          highestRisk = 'MODERATE';
        }
      }
    }

    const requiresConsultation =
      highestRisk === 'CRITICAL' ||
      immediateWarnings.some(w => w.includes('CONTRAINDICATED')) ||
      (demographics?.pregnancyStatus &&
        ['pregnant', 'breastfeeding'].includes(demographics.pregnancyStatus));

    return {
      isSafe: highestRisk === 'NONE' || highestRisk === 'LOW',
      riskLevel: highestRisk,
      immediateWarnings,
      requiresConsultation,
    };
  }

  /**
   * Convert health profile to demographic factors for analysis
   */
  private convertHealthProfileToDemographics(
    healthProfile?: HealthProfile
  ): DemographicFactors | undefined {
    if (!healthProfile) return undefined;

    return {
      ageRange: healthProfile.demographics?.ageRange || '',
      biologicalSex: healthProfile.demographics?.biologicalSex || 'other',
      pregnancyStatus: healthProfile.demographics?.pregnancyStatus,
      healthConditions: healthProfile.conditions?.conditions || [],
      medications: [], // Will be populated from stack in future
    };
  }

  /**
   * Analyze all ingredients in the product
   */
  private async analyzeIngredients(
    product: Product,
    demographics?: DemographicFactors
  ): Promise<IngredientAnalysisResult[]> {
    if (!product.ingredients || product.ingredients.length === 0) {
      return [];
    }

    const analyses: IngredientAnalysisResult[] = [];

    for (const ingredient of product.ingredients) {
      const amount = parseFloat(ingredient.amount) || 0;
      const unit = ingredient.unit || 'mg';

      const analysis = this.ingredientAnalyzer.analyzeIngredient(
        ingredient.name,
        amount,
        unit,
        demographics
      );

      analyses.push(analysis);
    }

    return analyses;
  }

  /**
   * Calculate category scores from ingredient analyses
   */
  private calculateCategoryScores(analyses: IngredientAnalysisResult[]) {
    if (analyses.length === 0) {
      return {
        ingredients: 50,
        bioavailability: 50,
        dosage: 50,
        purity: 50,
        value: 50,
        safety: 50,
      };
    }

    // Calculate weighted averages
    const totalWeight = analyses.length;

    return {
      ingredients: Math.round(
        analyses.reduce((sum, a) => sum + a.overallScore, 0) / totalWeight
      ),
      bioavailability: Math.round(
        analyses.reduce((sum, a) => sum + a.bioavailabilityScore, 0) /
          totalWeight
      ),
      dosage: Math.round(
        analyses.reduce((sum, a) => sum + a.dosageScore, 0) / totalWeight
      ),
      purity: Math.round(
        analyses.reduce((sum, a) => sum + a.qualityScore, 0) / totalWeight
      ),
      value: Math.round(
        analyses.reduce((sum, a) => sum + a.evidenceScore, 0) / totalWeight
      ),
      safety: Math.round(
        analyses.reduce((sum, a) => sum + a.safetyScore, 0) / totalWeight
      ),
    };
  }

  /**
   * Perform clinical assessment based on demographics and health profile
   */
  private performClinicalAssessment(
    analyses: IngredientAnalysisResult[],
    demographics?: DemographicFactors,
    healthProfile?: HealthProfile
  ) {
    const avgSafetyScore =
      analyses.reduce((sum, a) => sum + a.safetyScore, 0) / analyses.length;
    const avgDosageScore =
      analyses.reduce((sum, a) => sum + a.dosageScore, 0) / analyses.length;

    return {
      ageAppropriate:
        !demographics?.ageRange?.includes('65+') || avgSafetyScore >= 70,
      pregnancySafe:
        demographics?.pregnancyStatus !== 'pregnant' ||
        analyses.every(a => !a.warnings.some(w => w.includes('pregnancy'))),
      breastfeedingSafe:
        demographics?.pregnancyStatus !== 'breastfeeding' ||
        analyses.every(a => !a.warnings.some(w => w.includes('breastfeeding'))),
      conditionCompatible:
        !demographics?.healthConditions?.length ||
        analyses.every(
          a => !a.warnings.some(w => w.includes('CONTRAINDICATED'))
        ),
      dosageOptimal: avgDosageScore >= 70,
    };
  }

  // Additional methods will be implemented in the next section...

  private generatePersonalizedRecommendations(
    analyses: IngredientAnalysisResult[],
    demographics?: DemographicFactors,
    healthProfile?: HealthProfile
  ) {
    const dosageAdjustments: string[] = [];
    const timingRecommendations: string[] = [];
    const lifestyleConsiderations: string[] = [];
    const monitoringAdvice: string[] = [];

    // Aggregate recommendations from all ingredients
    analyses.forEach(analysis => {
      analysis.recommendations.forEach(rec => {
        if (
          rec.includes('dosage') ||
          rec.includes('increase') ||
          rec.includes('decrease')
        ) {
          dosageAdjustments.push(`${analysis.ingredient}: ${rec}`);
        } else if (
          rec.includes('take') ||
          rec.includes('timing') ||
          rec.includes('hours')
        ) {
          timingRecommendations.push(`${analysis.ingredient}: ${rec}`);
        } else if (
          rec.includes('store') ||
          rec.includes('avoid') ||
          rec.includes('with')
        ) {
          lifestyleConsiderations.push(`${analysis.ingredient}: ${rec}`);
        } else {
          monitoringAdvice.push(`${analysis.ingredient}: ${rec}`);
        }
      });
    });

    // Add demographic-specific recommendations
    if (demographics?.ageRange?.includes('65+')) {
      monitoringAdvice.push(
        'Monitor for enhanced sensitivity due to age-related metabolism changes'
      );
      dosageAdjustments.push(
        'Consider starting with lower doses and gradually increasing'
      );
    }

    if (demographics?.pregnancyStatus === 'pregnant') {
      monitoringAdvice.push('Regular monitoring recommended during pregnancy');
      lifestyleConsiderations.push('Maintain consistent prenatal care');
    }

    if (demographics?.pregnancyStatus === 'breastfeeding') {
      monitoringAdvice.push(
        'Monitor infant for any changes while breastfeeding'
      );
    }

    // Add health goal-specific recommendations
    if (healthProfile?.goals?.primary === 'heart_health') {
      lifestyleConsiderations.push(
        'Combine with heart-healthy diet and regular exercise'
      );
    }

    if (healthProfile?.goals?.primary === 'bone_health') {
      lifestyleConsiderations.push(
        'Ensure adequate weight-bearing exercise and sunlight exposure'
      );
    }

    return {
      dosageAdjustments: [...new Set(dosageAdjustments)], // Remove duplicates
      timingRecommendations: [...new Set(timingRecommendations)],
      lifestyleConsiderations: [...new Set(lifestyleConsiderations)],
      monitoringAdvice: [...new Set(monitoringAdvice)],
    };
  }

  private assessSafetyProfile(
    analyses: IngredientAnalysisResult[],
    demographics?: DemographicFactors
  ) {
    const contraindications: string[] = [];
    const warnings: string[] = [];
    const sideEffects: string[] = [];
    const drugInteractions: string[] = [];
    const nutrientInteractions: string[] = [];

    // Aggregate safety information from all ingredients
    analyses.forEach(analysis => {
      // Collect warnings
      analysis.warnings.forEach(warning => {
        if (warning.includes('CONTRAINDICATED')) {
          contraindications.push(warning);
        } else if (warning.includes('⚠️')) {
          warnings.push(warning);
        } else if (warning.includes('side effects')) {
          sideEffects.push(warning);
        }
      });

      // Collect interactions
      analysis.interactions.forEach(interaction => {
        if (
          interaction.includes('interact with') &&
          interaction.includes('drug')
        ) {
          drugInteractions.push(interaction);
        } else if (
          interaction.includes('absorption') ||
          interaction.includes('nutrient')
        ) {
          nutrientInteractions.push(interaction);
        }
      });
    });

    return {
      contraindications: [...new Set(contraindications)],
      warnings: [...new Set(warnings)],
      sideEffects: [...new Set(sideEffects)],
      drugInteractions: [...new Set(drugInteractions)],
      nutrientInteractions: [...new Set(nutrientInteractions)],
    };
  }

  private evaluateQuality(
    analyses: IngredientAnalysisResult[],
    product: Product
  ) {
    const formOptimization: string[] = [];
    const purityConcerns: string[] = [];
    const certificationStatus: string[] = [];
    const storageRequirements: string[] = [];

    // Analyze bioavailability and form optimization
    analyses.forEach(analysis => {
      if (analysis.bioavailabilityScore < 70) {
        formOptimization.push(
          `${analysis.ingredient}: Consider more bioavailable form`
        );
      }

      if (analysis.qualityScore < 70) {
        purityConcerns.push(
          `${analysis.ingredient}: Quality concerns identified`
        );
      }

      // Extract storage recommendations
      analysis.recommendations.forEach(rec => {
        if (rec.includes('store') || rec.includes('storage')) {
          storageRequirements.push(rec);
        }
      });
    });

    // Add product-level quality assessments
    if (product.brand) {
      certificationStatus.push(
        `Brand: ${product.brand} - verify third-party testing`
      );
    }

    return {
      formOptimization: [...new Set(formOptimization)],
      purityConcerns: [...new Set(purityConcerns)],
      certificationStatus: [...new Set(certificationStatus)],
      storageRequirements: [...new Set(storageRequirements)],
    };
  }

  private summarizeEvidence(analyses: IngredientAnalysisResult[]) {
    const clinicalSupport: string[] = [];
    const researchGaps: string[] = [];
    const alternativeOptions: string[] = [];

    // Analyze evidence levels across ingredients
    const highEvidenceIngredients = analyses.filter(a => a.evidenceScore >= 80);
    const lowEvidenceIngredients = analyses.filter(a => a.evidenceScore < 50);

    highEvidenceIngredients.forEach(analysis => {
      clinicalSupport.push(
        `${analysis.ingredient}: Strong clinical evidence (Score: ${analysis.evidenceScore})`
      );
    });

    lowEvidenceIngredients.forEach(analysis => {
      researchGaps.push(
        `${analysis.ingredient}: Limited clinical evidence (Score: ${analysis.evidenceScore})`
      );
    });

    // Suggest alternatives for low-evidence ingredients
    if (lowEvidenceIngredients.length > 0) {
      alternativeOptions.push(
        'Consider well-researched alternatives for ingredients with limited evidence'
      );
    }

    // Add evidence-based recommendations
    if (analyses.every(a => a.evidenceScore >= 70)) {
      clinicalSupport.push('All ingredients have good clinical support');
    }

    return {
      clinicalSupport: [...new Set(clinicalSupport)],
      researchGaps: [...new Set(researchGaps)],
      alternativeOptions: [...new Set(alternativeOptions)],
    };
  }

  private async analyzeStackCompatibility(
    product: Product,
    stack: StackItem[],
    demographics?: DemographicFactors
  ) {
    const synergies: string[] = [];
    const conflicts: string[] = [];
    const cumulativeRisks: string[] = [];
    const optimizationSuggestions: string[] = [];

    // Analyze ingredient combinations with existing stack
    if (product.ingredients && stack.length > 0) {
      for (const newIngredient of product.ingredients) {
        for (const stackItem of stack) {
          if (stackItem.ingredients) {
            for (const existingIngredient of stackItem.ingredients) {
              // Check for beneficial synergies
              const synergy = this.checkIngredientSynergy(
                newIngredient.name,
                existingIngredient.name
              );
              if (synergy) {
                synergies.push(synergy);
              }

              // Check for conflicts
              const conflict = this.checkIngredientConflict(
                newIngredient.name,
                existingIngredient.name
              );
              if (conflict) {
                conflicts.push(conflict);
              }

              // Check for cumulative dosage risks
              if (
                newIngredient.name.toLowerCase() ===
                existingIngredient.name.toLowerCase()
              ) {
                const totalAmount =
                  (parseFloat(newIngredient.amount) || 0) +
                  (parseFloat(existingIngredient.amount) || 0);
                cumulativeRisks.push(
                  `${newIngredient.name}: Combined dosage of ${totalAmount}${newIngredient.unit} - verify safety`
                );
              }
            }
          }
        }
      }
    }

    // Generate optimization suggestions
    if (conflicts.length > 0) {
      optimizationSuggestions.push(
        'Consider spacing conflicting supplements by 2+ hours'
      );
    }

    if (synergies.length > 0) {
      optimizationSuggestions.push(
        'Take synergistic supplements together for enhanced benefits'
      );
    }

    if (cumulativeRisks.length > 0) {
      optimizationSuggestions.push(
        'Review total daily intake to avoid exceeding safe limits'
      );
    }

    return {
      synergies: [...new Set(synergies)],
      conflicts: [...new Set(conflicts)],
      cumulativeRisks: [...new Set(cumulativeRisks)],
      optimizationSuggestions: [...new Set(optimizationSuggestions)],
    };
  }

  private calculateOverallScore(
    categoryScores: any,
    clinicalAssessment: any
  ): number {
    // Weighted calculation based on category scores and clinical assessment
    const categoryWeight = 0.7;
    const clinicalWeight = 0.3;

    const avgCategoryScore =
      Object.values(categoryScores).reduce(
        (sum: number, score: any) => sum + score,
        0
      ) / Object.keys(categoryScores).length;

    // Clinical assessment bonus/penalty
    const clinicalFactors = Object.values(clinicalAssessment);
    const clinicalScore =
      (clinicalFactors.filter(Boolean).length / clinicalFactors.length) * 100;

    const overallScore =
      avgCategoryScore * categoryWeight + clinicalScore * clinicalWeight;

    return Math.round(Math.max(0, Math.min(100, overallScore)));
  }

  private determineRiskLevel(
    safetyProfile: any,
    clinicalAssessment: any
  ): 'NONE' | 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' {
    // Determine risk based on safety profile
    if (safetyProfile.contraindications.length > 0) {
      return 'CRITICAL';
    }

    if (safetyProfile.warnings.some((w: string) => w.includes('⚠️'))) {
      return 'HIGH';
    }

    if (
      !clinicalAssessment.pregnancySafe ||
      !clinicalAssessment.breastfeedingSafe ||
      !clinicalAssessment.conditionCompatible
    ) {
      return 'MODERATE';
    }

    if (
      safetyProfile.drugInteractions.length > 0 ||
      safetyProfile.nutrientInteractions.length > 0
    ) {
      return 'LOW';
    }

    return 'NONE';
  }

  private calculateConfidenceLevel(
    analyses: IngredientAnalysisResult[]
  ): number {
    if (analyses.length === 0) return 50;

    // Base confidence on evidence scores and data completeness
    const avgEvidenceScore =
      analyses.reduce((sum, a) => sum + a.evidenceScore, 0) / analyses.length;

    // Bonus for having complete data
    const dataCompletenessBonus = analyses.every(
      a => a.dosageScore > 0 && a.bioavailabilityScore > 0 && a.safetyScore > 0
    )
      ? 10
      : 0;

    // Penalty for unknown ingredients
    const unknownPenalty = analyses.filter(a => a.overallScore < 50).length * 5;

    const confidenceLevel =
      avgEvidenceScore + dataCompletenessBonus - unknownPenalty;

    return Math.round(Math.max(30, Math.min(95, confidenceLevel)));
  }

  private determineEvidenceGrade(
    analyses: IngredientAnalysisResult[]
  ): 'A' | 'B' | 'C' | 'D' {
    if (analyses.length === 0) return 'D';

    const avgEvidenceScore =
      analyses.reduce((sum, a) => sum + a.evidenceScore, 0) / analyses.length;

    if (avgEvidenceScore >= 85) return 'A';
    if (avgEvidenceScore >= 70) return 'B';
    if (avgEvidenceScore >= 55) return 'C';
    return 'D';
  }

  private checkIngredientSynergy(
    ingredient1: string,
    ingredient2: string
  ): string | null {
    const ing1 = ingredient1.toLowerCase();
    const ing2 = ingredient2.toLowerCase();

    // Common beneficial combinations
    if (
      (ing1.includes('vitamin d') && ing2.includes('calcium')) ||
      (ing1.includes('calcium') && ing2.includes('vitamin d'))
    ) {
      return 'Vitamin D enhances calcium absorption';
    }

    if (
      (ing1.includes('vitamin c') && ing2.includes('iron')) ||
      (ing1.includes('iron') && ing2.includes('vitamin c'))
    ) {
      return 'Vitamin C enhances iron absorption';
    }

    if (
      (ing1.includes('magnesium') && ing2.includes('vitamin d')) ||
      (ing1.includes('vitamin d') && ing2.includes('magnesium'))
    ) {
      return 'Magnesium supports vitamin D metabolism';
    }

    return null;
  }

  private checkIngredientConflict(
    ingredient1: string,
    ingredient2: string
  ): string | null {
    const ing1 = ingredient1.toLowerCase();
    const ing2 = ingredient2.toLowerCase();

    // Common conflicts
    if (
      (ing1.includes('calcium') && ing2.includes('iron')) ||
      (ing1.includes('iron') && ing2.includes('calcium'))
    ) {
      return 'Calcium may reduce iron absorption - space doses apart';
    }

    if (
      (ing1.includes('zinc') && ing2.includes('copper')) ||
      (ing1.includes('copper') && ing2.includes('zinc'))
    ) {
      return 'High zinc may interfere with copper absorption';
    }

    if (
      (ing1.includes('calcium') && ing2.includes('magnesium')) ||
      (ing1.includes('magnesium') && ing2.includes('calcium'))
    ) {
      return 'High calcium may compete with magnesium absorption';
    }

    return null;
  }
}
