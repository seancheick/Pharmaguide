// src/services/analysis/ingredientAnalyzer.ts
// Comprehensive Ingredient-Level Analysis System
// my old ingredient analyzer before your enhanced one

export interface IngredientProfile {
  name: string;
  category:
    | 'vitamin'
    | 'mineral'
    | 'herb'
    | 'amino_acid'
    | 'fatty_acid'
    | 'probiotic'
    | 'enzyme'
    | 'other';
  commonNames: string[];

  // Dosage Information
  recommendedDailyIntake?: {
    adult: { min: number; max: number; unit: string };
    elderly?: { min: number; max: number; unit: string };
    pregnant?: { min: number; max: number; unit: string };
    breastfeeding?: { min: number; max: number; unit: string };
  };

  upperLimit?: {
    adult: { amount: number; unit: string };
    elderly?: { amount: number; unit: string };
    pregnant?: { amount: number; unit: string };
    breastfeeding?: { amount: number; unit: string };
  };

  // Bioavailability & Absorption
  bioavailability: {
    form: string; // e.g., "D3", "Chelated", "Citrate"
    absorptionRate: number; // 0-100%
    bestTakenWith?: string[]; // e.g., ["fat", "food"]
    avoidWith?: string[]; // e.g., ["calcium", "coffee"]
  };

  // Safety Profile
  safety: {
    pregnancyCategory: 'A' | 'B' | 'C' | 'D' | 'X' | 'Unknown';
    breastfeedingCategory: 'Safe' | 'Caution' | 'Avoid' | 'Unknown';
    contraindications: string[];
    sideEffects: string[];
    drugInteractions: string[];
  };

  // Clinical Evidence
  evidence: {
    level: 'A' | 'B' | 'C' | 'D'; // A = Strong, D = Limited
    studyCount: number;
    benefits: string[];
    conditions: string[];
  };

  // Quality Markers
  quality: {
    purityConcerns?: string[];
    contaminants?: string[];
    certifications?: string[];
    storageRequirements?: string[];
  };
}

export interface IngredientAnalysisResult {
  ingredient: string;
  dosageScore: number; // 0-100
  bioavailabilityScore: number; // 0-100
  safetyScore: number; // 0-100
  qualityScore: number; // 0-100
  evidenceScore: number; // 0-100
  overallScore: number; // 0-100

  findings: {
    dosageAssessment: string;
    bioavailabilityAssessment: string;
    safetyAssessment: string;
    qualityAssessment: string;
    evidenceAssessment: string;
  };

  recommendations: string[];
  warnings: string[];
  interactions: string[];
}

export interface DemographicFactors {
  ageRange: string;
  biologicalSex: 'male' | 'female' | 'other';
  pregnancyStatus?: 'pregnant' | 'breastfeeding' | 'not_pregnant';
  healthConditions: string[];
  medications: string[];
}

export class IngredientAnalyzer {
  private ingredientDatabase: Map<string, IngredientProfile> = new Map();

  constructor() {
    this.initializeDatabase();
  }

  /**
   * Analyze a single ingredient with demographic considerations
   */
  analyzeIngredient(
    ingredientName: string,
    amount: number,
    unit: string,
    demographics?: DemographicFactors
  ): IngredientAnalysisResult {
    const profile = this.getIngredientProfile(ingredientName);

    if (!profile) {
      return this.generateUnknownIngredientAnalysis(
        ingredientName,
        amount,
        unit
      );
    }

    // Normalize amount to standard units
    const normalizedAmount = this.normalizeAmount(amount, unit, profile);

    // Calculate individual scores
    const dosageScore = this.calculateDosageScore(
      normalizedAmount,
      profile,
      demographics
    );
    const bioavailabilityScore = this.calculateBioavailabilityScore(profile);
    const safetyScore = this.calculateSafetyScore(profile, demographics);
    const qualityScore = this.calculateQualityScore(profile);
    const evidenceScore = this.calculateEvidenceScore(profile);

    // Calculate weighted overall score
    const overallScore = this.calculateOverallScore({
      dosageScore,
      bioavailabilityScore,
      safetyScore,
      qualityScore,
      evidenceScore,
    });

    return {
      ingredient: ingredientName,
      dosageScore,
      bioavailabilityScore,
      safetyScore,
      qualityScore,
      evidenceScore,
      overallScore,
      findings: this.generateFindings(profile, normalizedAmount, demographics),
      recommendations: this.generateRecommendations(
        profile,
        normalizedAmount,
        demographics
      ),
      warnings: this.generateWarnings(profile, normalizedAmount, demographics),
      interactions: this.generateInteractions(profile, demographics),
    };
  }

  /**
   * Analyze multiple ingredients for synergies and conflicts
   */
  analyzeIngredientCombination(
    ingredients: { name: string; amount: number; unit: string }[],
    demographics?: DemographicFactors
  ): {
    individualAnalyses: IngredientAnalysisResult[];
    combinationScore: number;
    synergies: string[];
    conflicts: string[];
    overallRecommendations: string[];
  } {
    const individualAnalyses = ingredients.map(ing =>
      this.analyzeIngredient(ing.name, ing.amount, ing.unit, demographics)
    );

    const synergies = this.identifySynergies(ingredients);
    const conflicts = this.identifyConflicts(ingredients);
    const combinationScore = this.calculateCombinationScore(
      individualAnalyses,
      synergies,
      conflicts
    );
    const overallRecommendations = this.generateCombinationRecommendations(
      individualAnalyses,
      synergies,
      conflicts
    );

    return {
      individualAnalyses,
      combinationScore,
      synergies,
      conflicts,
      overallRecommendations,
    };
  }

  /**
   * Get ingredient profile from database
   */
  private getIngredientProfile(
    ingredientName: string
  ): IngredientProfile | null {
    const normalizedName = ingredientName.toLowerCase().trim();

    // Direct match
    if (this.ingredientDatabase.has(normalizedName)) {
      return this.ingredientDatabase.get(normalizedName)!;
    }

    // Search by common names
    for (const [key, profile] of this.ingredientDatabase) {
      if (
        profile.commonNames.some(
          name =>
            name.toLowerCase().includes(normalizedName) ||
            normalizedName.includes(name.toLowerCase())
        )
      ) {
        return profile;
      }
    }

    return null;
  }

  /**
   * Calculate dosage appropriateness score
   */
  private calculateDosageScore(
    amount: number,
    profile: IngredientProfile,
    demographics?: DemographicFactors
  ): number {
    if (!profile.recommendedDailyIntake) return 70; // Default for unknown

    const targetRange = this.getTargetDosageRange(profile, demographics);
    if (!targetRange) return 70;

    const { min, max } = targetRange;

    if (amount >= min && amount <= max) {
      return 95; // Optimal range
    } else if (amount < min) {
      const ratio = amount / min;
      return Math.max(30, 70 * ratio); // Below optimal
    } else {
      // Check upper limit
      const upperLimit = this.getUpperLimit(profile, demographics);
      if (upperLimit && amount > upperLimit.amount) {
        return 20; // Potentially dangerous
      } else {
        const excessRatio = (amount - max) / max;
        return Math.max(40, 80 - excessRatio * 30); // Above optimal but safe
      }
    }
  }

  /**
   * Calculate bioavailability score based on form and absorption factors
   */
  private calculateBioavailabilityScore(profile: IngredientProfile): number {
    const baseScore = profile.bioavailability.absorptionRate;

    // Bonus for optimal forms
    let bonus = 0;
    if (profile.bioavailability.form.includes('chelated')) bonus += 10;
    if (profile.bioavailability.form.includes('methylated')) bonus += 10;
    if (profile.bioavailability.form.includes('active')) bonus += 5;

    return Math.min(100, baseScore + bonus);
  }

  /**
   * Calculate safety score based on profile and demographics
   */
  private calculateSafetyScore(
    profile: IngredientProfile,
    demographics?: DemographicFactors
  ): number {
    let score = 85; // Base safety score

    // Pregnancy considerations
    if (demographics?.pregnancyStatus === 'pregnant') {
      switch (profile.safety.pregnancyCategory) {
        case 'A':
          score += 10;
          break;
        case 'B':
          score += 5;
          break;
        case 'C':
          score -= 15;
          break;
        case 'D':
          score -= 30;
          break;
        case 'X':
          score -= 50;
          break;
        default:
          score -= 10;
          break;
      }
    }

    // Breastfeeding considerations
    if (demographics?.pregnancyStatus === 'breastfeeding') {
      switch (profile.safety.breastfeedingCategory) {
        case 'Safe':
          score += 5;
          break;
        case 'Caution':
          score -= 10;
          break;
        case 'Avoid':
          score -= 40;
          break;
        default:
          score -= 5;
          break;
      }
    }

    // Contraindications
    if (demographics?.healthConditions) {
      const relevantContraindications = profile.safety.contraindications.filter(
        contra =>
          demographics.healthConditions.some(condition =>
            contra.toLowerCase().includes(condition.toLowerCase())
          )
      );
      score -= relevantContraindications.length * 15;
    }

    // Drug interactions
    if (demographics?.medications) {
      const relevantInteractions = profile.safety.drugInteractions.filter(
        drug =>
          demographics.medications.some(med =>
            drug.toLowerCase().includes(med.toLowerCase())
          )
      );
      score -= relevantInteractions.length * 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate quality score based on purity and certification factors
   */
  private calculateQualityScore(profile: IngredientProfile): number {
    let score = 75; // Base quality score

    // Deduct for purity concerns
    if (profile.quality.purityConcerns) {
      score -= profile.quality.purityConcerns.length * 5;
    }

    // Deduct for contaminants
    if (profile.quality.contaminants) {
      score -= profile.quality.contaminants.length * 8;
    }

    // Add for certifications
    if (profile.quality.certifications) {
      score += profile.quality.certifications.length * 3;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate evidence score based on clinical research
   */
  private calculateEvidenceScore(profile: IngredientProfile): number {
    let score = 50; // Base evidence score

    // Evidence level bonus
    switch (profile.evidence.level) {
      case 'A':
        score += 30;
        break;
      case 'B':
        score += 20;
        break;
      case 'C':
        score += 10;
        break;
      case 'D':
        score += 0;
        break;
    }

    // Study count bonus (logarithmic scale)
    const studyBonus = Math.min(
      20,
      Math.log10(profile.evidence.studyCount + 1) * 10
    );
    score += studyBonus;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate weighted overall score
   */
  private calculateOverallScore(scores: {
    dosageScore: number;
    bioavailabilityScore: number;
    safetyScore: number;
    qualityScore: number;
    evidenceScore: number;
  }): number {
    // Weighted average with safety being most important
    const weights = {
      dosageScore: 0.25,
      bioavailabilityScore: 0.15,
      safetyScore: 0.35, // Safety is most important
      qualityScore: 0.15,
      evidenceScore: 0.1,
    };

    return Math.round(
      scores.dosageScore * weights.dosageScore +
        scores.bioavailabilityScore * weights.bioavailabilityScore +
        scores.safetyScore * weights.safetyScore +
        scores.qualityScore * weights.qualityScore +
        scores.evidenceScore * weights.evidenceScore
    );
  }

  // Additional helper methods will be implemented in the next section...

  private initializeDatabase(): void {
    // Vitamin D3
    this.ingredientDatabase.set('vitamin d3', {
      name: 'Vitamin D3',
      category: 'vitamin',
      commonNames: ['cholecalciferol', 'vitamin d', 'd3'],
      recommendedDailyIntake: {
        adult: { min: 600, max: 2000, unit: 'IU' },
        elderly: { min: 800, max: 2000, unit: 'IU' },
        pregnant: { min: 600, max: 1000, unit: 'IU' },
        breastfeeding: { min: 600, max: 1000, unit: 'IU' },
      },
      upperLimit: {
        adult: { amount: 4000, unit: 'IU' },
        elderly: { amount: 4000, unit: 'IU' },
        pregnant: { amount: 4000, unit: 'IU' },
        breastfeeding: { amount: 4000, unit: 'IU' },
      },
      bioavailability: {
        form: 'D3 (Cholecalciferol)',
        absorptionRate: 85,
        bestTakenWith: ['fat', 'food'],
        avoidWith: [],
      },
      safety: {
        pregnancyCategory: 'A',
        breastfeedingCategory: 'Safe',
        contraindications: ['hypercalcemia', 'kidney stones', 'sarcoidosis'],
        sideEffects: ['nausea', 'vomiting', 'weakness'],
        drugInteractions: ['thiazide diuretics', 'digoxin'],
      },
      evidence: {
        level: 'A',
        studyCount: 500,
        benefits: ['bone health', 'immune function', 'muscle strength'],
        conditions: ['osteoporosis', 'rickets', 'immune deficiency'],
      },
      quality: {
        purityConcerns: [],
        contaminants: [],
        certifications: ['USP', 'NSF'],
        storageRequirements: ['cool', 'dry', 'dark'],
      },
    });

    // Vitamin C
    this.ingredientDatabase.set('vitamin c', {
      name: 'Vitamin C',
      category: 'vitamin',
      commonNames: ['ascorbic acid', 'l-ascorbic acid', 'ascorbate'],
      recommendedDailyIntake: {
        adult: { min: 65, max: 500, unit: 'mg' },
        elderly: { min: 75, max: 500, unit: 'mg' },
        pregnant: { min: 85, max: 500, unit: 'mg' },
        breastfeeding: { min: 120, max: 500, unit: 'mg' },
      },
      upperLimit: {
        adult: { amount: 2000, unit: 'mg' },
        elderly: { amount: 2000, unit: 'mg' },
        pregnant: { amount: 2000, unit: 'mg' },
        breastfeeding: { amount: 2000, unit: 'mg' },
      },
      bioavailability: {
        form: 'Ascorbic Acid',
        absorptionRate: 80,
        bestTakenWith: ['food'],
        avoidWith: ['iron supplements'],
      },
      safety: {
        pregnancyCategory: 'A',
        breastfeedingCategory: 'Safe',
        contraindications: ['kidney stones', 'hemochromatosis'],
        sideEffects: ['diarrhea', 'nausea', 'stomach cramps'],
        drugInteractions: ['warfarin', 'chemotherapy drugs'],
      },
      evidence: {
        level: 'A',
        studyCount: 800,
        benefits: ['immune support', 'antioxidant', 'collagen synthesis'],
        conditions: ['scurvy', 'immune deficiency', 'wound healing'],
      },
      quality: {
        purityConcerns: [],
        contaminants: [],
        certifications: ['USP', 'GMP'],
        storageRequirements: ['cool', 'dry', 'light-protected'],
      },
    });

    // Calcium Carbonate
    this.ingredientDatabase.set('calcium carbonate', {
      name: 'Calcium Carbonate',
      category: 'mineral',
      commonNames: ['calcium', 'carbonate'],
      recommendedDailyIntake: {
        adult: { min: 1000, max: 1200, unit: 'mg' },
        elderly: { min: 1200, max: 1200, unit: 'mg' },
        pregnant: { min: 1000, max: 1300, unit: 'mg' },
        breastfeeding: { min: 1000, max: 1300, unit: 'mg' },
      },
      upperLimit: {
        adult: { amount: 2500, unit: 'mg' },
        elderly: { amount: 2000, unit: 'mg' },
        pregnant: { amount: 2500, unit: 'mg' },
        breastfeeding: { amount: 2500, unit: 'mg' },
      },
      bioavailability: {
        form: 'Carbonate',
        absorptionRate: 40,
        bestTakenWith: ['food', 'acid'],
        avoidWith: ['iron', 'zinc', 'fiber'],
      },
      safety: {
        pregnancyCategory: 'A',
        breastfeedingCategory: 'Safe',
        contraindications: ['kidney stones', 'hypercalcemia'],
        sideEffects: ['constipation', 'gas', 'bloating'],
        drugInteractions: ['tetracycline', 'iron', 'thyroid medications'],
      },
      evidence: {
        level: 'A',
        studyCount: 600,
        benefits: ['bone health', 'muscle function', 'nerve transmission'],
        conditions: ['osteoporosis', 'osteopenia', 'hypocalcemia'],
      },
      quality: {
        purityConcerns: ['lead contamination'],
        contaminants: ['heavy metals'],
        certifications: ['USP', 'NSF'],
        storageRequirements: ['dry', 'room temperature'],
      },
    });

    // Iron (Ferrous Sulfate)
    this.ingredientDatabase.set('iron', {
      name: 'Iron',
      category: 'mineral',
      commonNames: ['ferrous sulfate', 'ferrous gluconate', 'iron sulfate'],
      recommendedDailyIntake: {
        adult: { min: 8, max: 18, unit: 'mg' },
        elderly: { min: 8, max: 8, unit: 'mg' },
        pregnant: { min: 27, max: 27, unit: 'mg' },
        breastfeeding: { min: 9, max: 9, unit: 'mg' },
      },
      upperLimit: {
        adult: { amount: 45, unit: 'mg' },
        elderly: { amount: 45, unit: 'mg' },
        pregnant: { amount: 45, unit: 'mg' },
        breastfeeding: { amount: 45, unit: 'mg' },
      },
      bioavailability: {
        form: 'Ferrous Sulfate',
        absorptionRate: 25,
        bestTakenWith: ['vitamin c', 'empty stomach'],
        avoidWith: ['calcium', 'coffee', 'tea', 'dairy'],
      },
      safety: {
        pregnancyCategory: 'A',
        breastfeedingCategory: 'Safe',
        contraindications: ['hemochromatosis', 'hemosiderosis'],
        sideEffects: ['constipation', 'nausea', 'stomach upset'],
        drugInteractions: ['tetracycline', 'quinolones', 'levothyroxine'],
      },
      evidence: {
        level: 'A',
        studyCount: 400,
        benefits: ['oxygen transport', 'energy production', 'immune function'],
        conditions: ['iron deficiency anemia', 'fatigue'],
      },
      quality: {
        purityConcerns: [],
        contaminants: [],
        certifications: ['USP', 'GMP'],
        storageRequirements: ['dry', 'cool', 'child-resistant'],
      },
    });
  }

  private normalizeAmount(
    amount: number,
    unit: string,
    profile: IngredientProfile
  ): number {
    const normalizedUnit = unit.toLowerCase().trim();
    const targetUnit =
      profile.recommendedDailyIntake?.adult.unit.toLowerCase() || 'mg';

    // Convert common unit variations
    const unitConversions: { [key: string]: { [key: string]: number } } = {
      mg: { g: 1000, mcg: 0.001, μg: 0.001 },
      g: { mg: 0.001, mcg: 0.000001, μg: 0.000001 },
      mcg: { mg: 1000, g: 1000000, μg: 1 },
      μg: { mg: 1000, g: 1000000, mcg: 1 },
      iu: { iu: 1 }, // International Units don't convert easily
    };

    if (normalizedUnit === targetUnit) {
      return amount;
    }

    const conversion = unitConversions[targetUnit]?.[normalizedUnit];
    return conversion ? amount * conversion : amount;
  }

  private getTargetDosageRange(
    profile: IngredientProfile,
    demographics?: DemographicFactors
  ) {
    if (!profile.recommendedDailyIntake) return null;

    // Determine appropriate range based on demographics
    if (
      demographics?.pregnancyStatus === 'pregnant' &&
      profile.recommendedDailyIntake.pregnant
    ) {
      return profile.recommendedDailyIntake.pregnant;
    }

    if (
      demographics?.pregnancyStatus === 'breastfeeding' &&
      profile.recommendedDailyIntake.breastfeeding
    ) {
      return profile.recommendedDailyIntake.breastfeeding;
    }

    if (
      demographics?.ageRange?.includes('65+') ||
      demographics?.ageRange?.includes('elderly')
    ) {
      return (
        profile.recommendedDailyIntake.elderly ||
        profile.recommendedDailyIntake.adult
      );
    }

    return profile.recommendedDailyIntake.adult;
  }

  private getUpperLimit(
    profile: IngredientProfile,
    demographics?: DemographicFactors
  ) {
    if (!profile.upperLimit) return null;

    // Determine appropriate upper limit based on demographics
    if (
      demographics?.pregnancyStatus === 'pregnant' &&
      profile.upperLimit.pregnant
    ) {
      return profile.upperLimit.pregnant;
    }

    if (
      demographics?.pregnancyStatus === 'breastfeeding' &&
      profile.upperLimit.breastfeeding
    ) {
      return profile.upperLimit.breastfeeding;
    }

    if (
      demographics?.ageRange?.includes('65+') ||
      demographics?.ageRange?.includes('elderly')
    ) {
      return profile.upperLimit.elderly || profile.upperLimit.adult;
    }

    return profile.upperLimit.adult;
  }

  private generateFindings(
    profile: IngredientProfile,
    amount: number,
    demographics?: DemographicFactors
  ) {
    const targetRange = this.getTargetDosageRange(profile, demographics);
    const upperLimit = this.getUpperLimit(profile, demographics);

    // Dosage Assessment
    let dosageAssessment = '';
    if (targetRange) {
      if (amount >= targetRange.min && amount <= targetRange.max) {
        dosageAssessment = `Optimal dosage range (${targetRange.min}-${targetRange.max} ${targetRange.unit})`;
      } else if (amount < targetRange.min) {
        dosageAssessment = `Below recommended range. Consider ${targetRange.min}-${targetRange.max} ${targetRange.unit}`;
      } else if (upperLimit && amount > upperLimit.amount) {
        dosageAssessment = `Exceeds safe upper limit of ${upperLimit.amount} ${upperLimit.unit}`;
      } else {
        dosageAssessment = `Above optimal range but within safe limits`;
      }
    } else {
      dosageAssessment = 'Dosage guidelines not established';
    }

    // Bioavailability Assessment
    const bioavailabilityAssessment = `${profile.bioavailability.form} form with ${profile.bioavailability.absorptionRate}% absorption rate. ${
      profile.bioavailability.bestTakenWith?.length
        ? `Best taken with: ${profile.bioavailability.bestTakenWith.join(', ')}.`
        : ''
    } ${
      profile.bioavailability.avoidWith?.length
        ? `Avoid taking with: ${profile.bioavailability.avoidWith.join(', ')}.`
        : ''
    }`;

    // Safety Assessment
    let safetyAssessment = '';
    if (demographics?.pregnancyStatus === 'pregnant') {
      safetyAssessment = `Pregnancy Category ${profile.safety.pregnancyCategory}. `;
    }
    if (demographics?.pregnancyStatus === 'breastfeeding') {
      safetyAssessment += `Breastfeeding: ${profile.safety.breastfeedingCategory}. `;
    }
    if (profile.safety.contraindications.length > 0) {
      safetyAssessment += `Contraindicated in: ${profile.safety.contraindications.join(', ')}.`;
    }

    // Quality Assessment
    const qualityAssessment = `${
      profile.quality.certifications?.length
        ? `Certified: ${profile.quality.certifications.join(', ')}. `
        : 'No quality certifications specified. '
    }${
      profile.quality.purityConcerns?.length
        ? `Purity concerns: ${profile.quality.purityConcerns.join(', ')}.`
        : 'No known purity concerns.'
    }`;

    // Evidence Assessment
    const evidenceAssessment = `Evidence Level ${profile.evidence.level} based on ${profile.evidence.studyCount} studies. Primary benefits: ${profile.evidence.benefits.join(', ')}.`;

    return {
      dosageAssessment,
      bioavailabilityAssessment,
      safetyAssessment,
      qualityAssessment,
      evidenceAssessment,
    };
  }

  private generateRecommendations(
    profile: IngredientProfile,
    amount: number,
    demographics?: DemographicFactors
  ): string[] {
    const recommendations: string[] = [];
    const targetRange = this.getTargetDosageRange(profile, demographics);

    // Dosage recommendations
    if (targetRange && amount < targetRange.min) {
      recommendations.push(
        `Consider increasing dosage to ${targetRange.min}-${targetRange.max} ${targetRange.unit} for optimal benefits`
      );
    }

    // Timing recommendations
    if (profile.bioavailability.bestTakenWith?.includes('food')) {
      recommendations.push('Take with meals for better absorption');
    }
    if (profile.bioavailability.bestTakenWith?.includes('fat')) {
      recommendations.push(
        'Take with a fat-containing meal for optimal absorption'
      );
    }
    if (profile.bioavailability.bestTakenWith?.includes('empty stomach')) {
      recommendations.push('Take on empty stomach for best absorption');
    }

    // Spacing recommendations
    if (profile.bioavailability.avoidWith?.length) {
      recommendations.push(
        `Take 2+ hours apart from: ${profile.bioavailability.avoidWith.join(', ')}`
      );
    }

    // Storage recommendations
    if (profile.quality.storageRequirements?.length) {
      recommendations.push(
        `Store in ${profile.quality.storageRequirements.join(', ')} conditions`
      );
    }

    // Demographic-specific recommendations
    if (demographics?.ageRange?.includes('65+')) {
      recommendations.push(
        'Monitor for enhanced sensitivity due to age-related changes in metabolism'
      );
    }

    return recommendations;
  }

  private generateWarnings(
    profile: IngredientProfile,
    amount: number,
    demographics?: DemographicFactors
  ): string[] {
    const warnings: string[] = [];
    const upperLimit = this.getUpperLimit(profile, demographics);

    // Dosage warnings
    if (upperLimit && amount > upperLimit.amount) {
      warnings.push(
        `⚠️ DOSAGE EXCEEDS SAFE UPPER LIMIT: ${upperLimit.amount} ${upperLimit.unit}`
      );
    }

    // Pregnancy/breastfeeding warnings
    if (demographics?.pregnancyStatus === 'pregnant') {
      if (
        profile.safety.pregnancyCategory === 'D' ||
        profile.safety.pregnancyCategory === 'X'
      ) {
        warnings.push('⚠️ NOT RECOMMENDED during pregnancy');
      } else if (profile.safety.pregnancyCategory === 'C') {
        warnings.push(
          '⚠️ Use during pregnancy only if benefits outweigh risks'
        );
      }
    }

    if (
      demographics?.pregnancyStatus === 'breastfeeding' &&
      profile.safety.breastfeedingCategory === 'Avoid'
    ) {
      warnings.push('⚠️ AVOID during breastfeeding');
    }

    // Health condition warnings
    if (demographics?.healthConditions?.length) {
      const relevantContraindications = profile.safety.contraindications.filter(
        contra =>
          demographics.healthConditions.some(
            condition =>
              contra.toLowerCase().includes(condition.toLowerCase()) ||
              condition.toLowerCase().includes(contra.toLowerCase())
          )
      );

      relevantContraindications.forEach(contra => {
        warnings.push(`⚠️ CONTRAINDICATED with ${contra}`);
      });
    }

    // Side effect warnings
    if (profile.safety.sideEffects.length > 0) {
      warnings.push(
        `Possible side effects: ${profile.safety.sideEffects.join(', ')}`
      );
    }

    return warnings;
  }

  private generateInteractions(
    profile: IngredientProfile,
    demographics?: DemographicFactors
  ): string[] {
    const interactions: string[] = [];

    // Drug interactions
    if (
      demographics?.medications?.length &&
      profile.safety.drugInteractions.length > 0
    ) {
      const relevantInteractions = profile.safety.drugInteractions.filter(
        drug =>
          demographics.medications.some(
            med =>
              drug.toLowerCase().includes(med.toLowerCase()) ||
              med.toLowerCase().includes(drug.toLowerCase())
          )
      );

      relevantInteractions.forEach(drug => {
        interactions.push(
          `May interact with ${drug} - consult healthcare provider`
        );
      });
    }

    // Nutrient interactions
    if (profile.bioavailability.avoidWith?.length) {
      profile.bioavailability.avoidWith.forEach(nutrient => {
        interactions.push(
          `Absorption reduced by ${nutrient} - space doses apart`
        );
      });
    }

    return interactions;
  }

  private generateUnknownIngredientAnalysis(
    name: string,
    amount: number,
    unit: string
  ): IngredientAnalysisResult {
    return {
      ingredient: name,
      dosageScore: 50,
      bioavailabilityScore: 50,
      safetyScore: 60,
      qualityScore: 50,
      evidenceScore: 30,
      overallScore: 48,
      findings: {
        dosageAssessment: 'Unknown ingredient - dosage cannot be assessed',
        bioavailabilityAssessment: 'Bioavailability data not available',
        safetyAssessment: 'Safety profile unknown - exercise caution',
        qualityAssessment: 'Quality standards unknown',
        evidenceAssessment: 'Limited clinical evidence available',
      },
      recommendations: [
        'Consult healthcare provider before use',
        'Research ingredient safety',
      ],
      warnings: ['Unknown ingredient safety profile'],
      interactions: [],
    };
  }

  private identifySynergies(
    ingredients: { name: string; amount: number; unit: string }[]
  ): string[] {
    return [];
  }

  private identifyConflicts(
    ingredients: { name: string; amount: number; unit: string }[]
  ): string[] {
    return [];
  }

  private calculateCombinationScore(
    analyses: IngredientAnalysisResult[],
    synergies: string[],
    conflicts: string[]
  ): number {
    return 75;
  }

  private generateCombinationRecommendations(
    analyses: IngredientAnalysisResult[],
    synergies: string[],
    conflicts: string[]
  ): string[] {
    return [];
  }
}
