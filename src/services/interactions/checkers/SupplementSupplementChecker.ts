// src/services/interactions/checkers/SupplementSupplementChecker.ts
// Comprehensive Supplement-to-Supplement Interaction Checker

import {
  InteractionChecker,
  DetectedInteraction,
  SubstanceContext,
  InteractionCheckConfig,
  Interaction,
  InteractionSeverity,
  InteractionMechanism,
  EvidenceLevel,
} from '../types';

/**
 * Supplement interaction database entry
 */
interface SupplementInteractionData {
  substance1: string;
  substance2: string;
  severity: InteractionSeverity;
  mechanism: InteractionMechanism;
  description: string;
  clinicalSignificance: string;
  evidenceLevel: EvidenceLevel;
  sources: string[];
  spacing?: {
    minimumHours: number;
    optimalHours: number;
    explanation: string;
  };
  dosageThresholds?: {
    substance1?: { amount: number; unit: string };
    substance2?: { amount: number; unit: string };
  };
  riskFactors?: {
    ageGroups?: string[];
    conditions?: string[];
  };
  alternatives?: string[];
}

/**
 * Supplement-to-supplement interaction checker
 */
export class SupplementSupplementChecker implements InteractionChecker {
  readonly type = 'supplement-supplement' as const;
  readonly priority = 100; // High priority for supplement interactions

  private interactionDatabase: Map<string, SupplementInteractionData[]> =
    new Map();
  private substanceAliases: Map<string, string[]> = new Map();

  constructor() {
    this.initializeDatabase();
    this.initializeAliases();
  }

  /**
   * Check for supplement-supplement interactions
   */
  async check(
    substances: SubstanceContext[],
    config?: Partial<InteractionCheckConfig>
  ): Promise<DetectedInteraction[]> {
    const supplements = substances.filter(
      s => s.source === 'stack' || s.source === 'new_product'
    );

    if (supplements.length < 2) {
      return [];
    }

    const interactions: DetectedInteraction[] = [];

    // Check all pairs of supplements
    for (let i = 0; i < supplements.length; i++) {
      for (let j = i + 1; j < supplements.length; j++) {
        const substance1 = supplements[i];
        const substance2 = supplements[j];

        const pairInteractions = await this.checkPairInteraction(
          substance1,
          substance2,
          config
        );

        interactions.push(...pairInteractions);
      }
    }

    return interactions;
  }

  /**
   * Check if this checker can handle the given substances
   */
  canHandle(substances: SubstanceContext[]): boolean {
    const supplements = substances.filter(
      s => s.source === 'stack' || s.source === 'new_product'
    );
    return supplements.length >= 2;
  }

  /**
   * Get supported substance categories
   */
  getSupportedCategories(): string[] {
    return [
      'vitamin',
      'mineral',
      'herb',
      'amino_acid',
      'fatty_acid',
      'probiotic',
      'enzyme',
      'antioxidant',
      'supplement',
    ];
  }

  /**
   * Check interaction between two specific supplements
   */
  private async checkPairInteraction(
    substance1: SubstanceContext,
    substance2: SubstanceContext,
    config?: Partial<InteractionCheckConfig>
  ): Promise<DetectedInteraction[]> {
    const interactions: DetectedInteraction[] = [];

    // Normalize substance names
    const name1 = this.normalizeSubstanceName(substance1.name);
    const name2 = this.normalizeSubstanceName(substance2.name);

    // Check direct interactions
    const directInteractions = this.findDirectInteractions(name1, name2);

    // Check alias-based interactions
    const aliasInteractions = this.findAliasInteractions(name1, name2);

    // Combine and process all found interactions
    const allInteractionData = [...directInteractions, ...aliasInteractions];

    for (const interactionData of allInteractionData) {
      const detectedInteraction = this.createDetectedInteraction(
        interactionData,
        substance1,
        substance2
      );

      // Apply severity filtering if configured
      if (config?.minimumSeverity) {
        const severityOrder = { LOW: 1, MODERATE: 2, HIGH: 3, CRITICAL: 4 };
        if (
          severityOrder[detectedInteraction.severity] <
          severityOrder[config.minimumSeverity]
        ) {
          continue;
        }
      }

      interactions.push(detectedInteraction);
    }

    return interactions;
  }

  /**
   * Find direct interactions in database
   */
  private findDirectInteractions(
    name1: string,
    name2: string
  ): SupplementInteractionData[] {
    const interactions: SupplementInteractionData[] = [];

    // Check both directions (A-B and B-A)
    const key1 = this.getInteractionKey(name1, name2);
    const key2 = this.getInteractionKey(name2, name1);

    const interactions1 = this.interactionDatabase.get(key1) || [];
    const interactions2 = this.interactionDatabase.get(key2) || [];

    interactions.push(...interactions1, ...interactions2);

    return interactions;
  }

  /**
   * Find interactions using substance aliases
   */
  private findAliasInteractions(
    name1: string,
    name2: string
  ): SupplementInteractionData[] {
    const interactions: SupplementInteractionData[] = [];

    const aliases1 = this.getSubstanceAliases(name1);
    const aliases2 = this.getSubstanceAliases(name2);

    // Check all alias combinations
    for (const alias1 of aliases1) {
      for (const alias2 of aliases2) {
        if (alias1 !== name1 || alias2 !== name2) {
          // Avoid duplicate direct checks
          const aliasInteractions = this.findDirectInteractions(alias1, alias2);
          interactions.push(...aliasInteractions);
        }
      }
    }

    return interactions;
  }

  /**
   * Create detected interaction from database entry
   */
  private createDetectedInteraction(
    data: SupplementInteractionData,
    substance1: SubstanceContext,
    substance2: SubstanceContext
  ): DetectedInteraction {
    // Determine personalized severity based on dosages
    const personalizedSeverity = this.calculatePersonalizedSeverity(
      data,
      substance1,
      substance2
    );

    const baseInteraction: Interaction = {
      id: `supp-supp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'supplement-supplement',
      severity: data.severity,
      substance1: {
        name: data.substance1,
        category: 'supplement',
        commonNames: this.getSubstanceAliases(data.substance1),
      },
      substance2: {
        name: data.substance2,
        category: 'supplement',
        commonNames: this.getSubstanceAliases(data.substance2),
      },
      mechanism: data.mechanism,
      description: data.description,
      clinicalSignificance: data.clinicalSignificance,
      evidence: {
        level: data.evidenceLevel,
        sources: data.sources,
        studyCount: data.sources.length * 5, // Estimate
        lastUpdated: new Date().toISOString(),
      },
      recommendations: {
        action: this.determineRecommendedAction(data.severity, data.mechanism),
        spacing: data.spacing,
        alternatives: data.alternatives,
      },
      riskFactors: data.riskFactors,
    };

    return {
      ...baseInteraction,
      context: {
        userSubstances: {
          substance1Details: substance1,
          substance2Details: substance2,
        },
        riskFactorsPresent: [],
        personalizedSeverity,
        personalizedRecommendations: this.generatePersonalizedRecommendations(
          data,
          substance1,
          substance2,
          personalizedSeverity
        ),
      },
    };
  }

  /**
   * Calculate personalized severity based on user's dosages
   */
  private calculatePersonalizedSeverity(
    data: SupplementInteractionData,
    substance1: SubstanceContext,
    substance2: SubstanceContext
  ): InteractionSeverity {
    let severity = data.severity;

    // Check if dosages exceed thresholds
    if (data.dosageThresholds) {
      const threshold1 = data.dosageThresholds.substance1;
      const threshold2 = data.dosageThresholds.substance2;

      if (threshold1 && substance1.dosage) {
        const userAmount = this.convertToStandardUnit(
          substance1.dosage.amount,
          substance1.dosage.unit,
          threshold1.unit
        );

        if (userAmount > threshold1.amount) {
          severity = this.increaseSeverity(severity);
        }
      }

      if (threshold2 && substance2.dosage) {
        const userAmount = this.convertToStandardUnit(
          substance2.dosage.amount,
          substance2.dosage.unit,
          threshold2.unit
        );

        if (userAmount > threshold2.amount) {
          severity = this.increaseSeverity(severity);
        }
      }
    }

    return severity;
  }

  /**
   * Generate personalized recommendations
   */
  private generatePersonalizedRecommendations(
    data: SupplementInteractionData,
    substance1: SubstanceContext,
    substance2: SubstanceContext,
    severity: InteractionSeverity
  ): string[] {
    const recommendations: string[] = [];

    // Base recommendation based on severity
    switch (severity) {
      case 'CRITICAL':
        recommendations.push(
          '⚠️ CRITICAL: Avoid taking these supplements together'
        );
        recommendations.push(
          'Consult healthcare provider immediately if already combined'
        );
        break;
      case 'HIGH':
        recommendations.push(
          '⚠️ HIGH RISK: Avoid combination or use only under medical supervision'
        );
        break;
      case 'MODERATE':
        recommendations.push(
          '⚠️ MODERATE RISK: Use caution and monitor for effects'
        );
        break;
      case 'LOW':
        recommendations.push('ℹ️ LOW RISK: Monitor for potential effects');
        break;
    }

    // Spacing recommendations
    if (data.spacing && severity !== 'CRITICAL') {
      recommendations.push(
        `Space doses by at least ${data.spacing.minimumHours} hours (optimal: ${data.spacing.optimalHours} hours)`
      );
      recommendations.push(data.spacing.explanation);
    }

    // Mechanism-specific advice
    switch (data.mechanism) {
      case 'absorption_competition':
        recommendations.push(
          'Take at different times to avoid absorption interference'
        );
        break;
      case 'cumulative_toxicity':
        recommendations.push(
          'Monitor total daily intake to avoid exceeding safe limits'
        );
        break;
      case 'synergistic_effect':
        recommendations.push(
          'Enhanced effects possible - monitor for increased potency'
        );
        break;
      case 'antagonistic_effect':
        recommendations.push(
          'Reduced effectiveness possible - consider alternatives'
        );
        break;
    }

    // Dosage-specific recommendations
    if (substance1.dosage || substance2.dosage) {
      recommendations.push(
        'Consider dose adjustment under healthcare provider guidance'
      );
    }

    return recommendations;
  }

  /**
   * Determine recommended action based on severity and mechanism
   */
  private determineRecommendedAction(
    severity: InteractionSeverity,
    mechanism: InteractionMechanism
  ):
    | 'avoid'
    | 'monitor'
    | 'separate_timing'
    | 'adjust_dose'
    | 'consult_provider' {
    if (severity === 'CRITICAL') return 'avoid';
    if (severity === 'HIGH') return 'consult_provider';

    switch (mechanism) {
      case 'absorption_competition':
      case 'absorption_enhancement':
        return 'separate_timing';
      case 'cumulative_toxicity':
        return 'adjust_dose';
      case 'synergistic_effect':
      case 'antagonistic_effect':
        return 'monitor';
      default:
        return severity === 'MODERATE' ? 'monitor' : 'separate_timing';
    }
  }

  // Helper methods

  private normalizeSubstanceName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private getInteractionKey(name1: string, name2: string): string {
    const sorted = [name1, name2].sort();
    return `${sorted[0]}:${sorted[1]}`;
  }

  private getSubstanceAliases(name: string): string[] {
    const normalized = this.normalizeSubstanceName(name);
    return [normalized, ...(this.substanceAliases.get(normalized) || [])];
  }

  private increaseSeverity(current: InteractionSeverity): InteractionSeverity {
    const progression: Record<InteractionSeverity, InteractionSeverity> = {
      LOW: 'MODERATE',
      MODERATE: 'HIGH',
      HIGH: 'CRITICAL',
      CRITICAL: 'CRITICAL',
    };
    return progression[current];
  }

  private convertToStandardUnit(
    amount: number,
    fromUnit: string,
    toUnit: string
  ): number {
    // Simple unit conversion - expand as needed
    const conversions: Record<string, Record<string, number>> = {
      mg: { g: 1000, mcg: 0.001, μg: 0.001 },
      g: { mg: 0.001, mcg: 0.000001, μg: 0.000001 },
      mcg: { mg: 1000, g: 1000000, μg: 1 },
      μg: { mg: 1000, g: 1000000, mcg: 1 },
      iu: { iu: 1 },
    };

    const fromNormalized = fromUnit.toLowerCase();
    const toNormalized = toUnit.toLowerCase();

    if (fromNormalized === toNormalized) return amount;

    const conversionFactor = conversions[toNormalized]?.[fromNormalized];
    return conversionFactor ? amount * conversionFactor : amount;
  }

  /**
   * Initialize the supplement interaction database
   */
  private initializeDatabase(): void {
    const interactions: SupplementInteractionData[] = [
      // Calcium - Iron Interaction (Classic absorption competition)
      {
        substance1: 'calcium',
        substance2: 'iron',
        severity: 'MODERATE',
        mechanism: 'absorption_competition',
        description:
          'Calcium competes with iron for absorption in the intestine, potentially reducing iron bioavailability by up to 60%.',
        clinicalSignificance:
          'May lead to reduced iron absorption and potential iron deficiency if taken consistently together.',
        evidenceLevel: 'A',
        sources: [
          'Am J Clin Nutr. 1998;68(1):3-12',
          'J Nutr. 2001;131(6):1683-1687',
          'Eur J Clin Nutr. 2004;58(6):926-931',
        ],
        spacing: {
          minimumHours: 2,
          optimalHours: 4,
          explanation:
            'Taking calcium and iron 2-4 hours apart allows for optimal absorption of both minerals.',
        },
        dosageThresholds: {
          substance1: { amount: 500, unit: 'mg' },
          substance2: { amount: 15, unit: 'mg' },
        },
        alternatives: [
          'Take iron with vitamin C instead',
          'Use chelated iron forms',
        ],
      },

      // Vitamin D - Calcium Synergy (Beneficial interaction)
      {
        substance1: 'vitamin d',
        substance2: 'calcium',
        severity: 'LOW',
        mechanism: 'absorption_enhancement',
        description:
          'Vitamin D enhances calcium absorption in the intestine by promoting calcium-binding protein synthesis.',
        clinicalSignificance:
          'Beneficial interaction that improves calcium bioavailability and bone health outcomes.',
        evidenceLevel: 'A',
        sources: [
          'N Engl J Med. 2006;354(7):669-683',
          'Osteoporos Int. 2009;20(7):1107-1120',
          'J Bone Miner Res. 2007;22(4):509-519',
        ],
        spacing: {
          minimumHours: 0,
          optimalHours: 0,
          explanation:
            'These supplements work synergistically and should be taken together for optimal benefit.',
        },
        alternatives: ['Combined calcium + vitamin D supplements available'],
      },

      // Zinc - Copper Competition
      {
        substance1: 'zinc',
        substance2: 'copper',
        severity: 'HIGH',
        mechanism: 'absorption_competition',
        description:
          'High zinc intake interferes with copper absorption by inducing metallothionein, which binds copper.',
        clinicalSignificance:
          'Chronic high zinc intake can lead to copper deficiency, affecting iron metabolism and neurological function.',
        evidenceLevel: 'A',
        sources: [
          'Am J Clin Nutr. 1985;41(6):1184-1192',
          'J Nutr. 2000;130(5S Suppl):1512S-1515S',
          'Br J Nutr. 2001;85(2):193-199',
        ],
        spacing: {
          minimumHours: 4,
          optimalHours: 8,
          explanation:
            'Significant spacing required to prevent copper deficiency from zinc interference.',
        },
        dosageThresholds: {
          substance1: { amount: 40, unit: 'mg' },
          substance2: { amount: 2, unit: 'mg' },
        },
        riskFactors: {
          conditions: ['anemia', 'neurological_disorders'],
        },
        alternatives: [
          'Balanced zinc-copper supplements',
          'Monitor copper status with high zinc intake',
        ],
      },

      // Vitamin C - Iron Enhancement
      {
        substance1: 'vitamin c',
        substance2: 'iron',
        severity: 'LOW',
        mechanism: 'absorption_enhancement',
        description:
          'Vitamin C reduces ferric iron to ferrous iron and forms chelates, significantly enhancing iron absorption.',
        clinicalSignificance:
          'Beneficial interaction that can increase iron absorption by 3-4 fold, especially important for plant-based iron sources.',
        evidenceLevel: 'A',
        sources: [
          'Am J Clin Nutr. 1989;49(1):140-144',
          'J Nutr. 2001;131(6):1683-1687',
          'Eur J Clin Nutr. 2004;58(6):926-931',
        ],
        spacing: {
          minimumHours: 0,
          optimalHours: 0,
          explanation: 'Take together for maximum iron absorption benefit.',
        },
        alternatives: ['Iron supplements with built-in vitamin C'],
      },

      // Magnesium - Calcium Competition
      {
        substance1: 'magnesium',
        substance2: 'calcium',
        severity: 'MODERATE',
        mechanism: 'absorption_competition',
        description:
          'High calcium intake can interfere with magnesium absorption through competition for transport mechanisms.',
        clinicalSignificance:
          'May reduce magnesium bioavailability, potentially affecting muscle function and cardiovascular health.',
        evidenceLevel: 'B',
        sources: [
          'Magnes Res. 2002;15(3-4):241-246',
          'J Am Coll Nutr. 2001;20(5 Suppl):374S-378S',
          'Nutrients. 2018;10(10):1367',
        ],
        spacing: {
          minimumHours: 2,
          optimalHours: 3,
          explanation:
            'Moderate spacing helps ensure adequate absorption of both minerals.',
        },
        dosageThresholds: {
          substance1: { amount: 400, unit: 'mg' },
          substance2: { amount: 1000, unit: 'mg' },
        },
        alternatives: [
          'Balanced calcium-magnesium supplements',
          'Take magnesium at bedtime',
        ],
      },

      // Fish Oil - Vitamin E Synergy
      {
        substance1: 'fish oil',
        substance2: 'vitamin e',
        severity: 'LOW',
        mechanism: 'synergistic_effect',
        description:
          'Vitamin E protects omega-3 fatty acids from oxidation, preserving their beneficial effects.',
        clinicalSignificance:
          'Beneficial interaction that enhances the stability and effectiveness of omega-3 fatty acids.',
        evidenceLevel: 'B',
        sources: [
          'Free Radic Biol Med. 2004;36(1):1-15',
          'Lipids. 2003;38(4):415-418',
          'Am J Clin Nutr. 2006;84(6):1385-1392',
        ],
        spacing: {
          minimumHours: 0,
          optimalHours: 0,
          explanation: 'Take together to protect omega-3s from oxidation.',
        },
        alternatives: ['Fish oil supplements with added vitamin E'],
      },

      // St. John's Wort - Multiple interactions (herb example)
      {
        substance1: 'st johns wort',
        substance2: 'iron',
        severity: 'MODERATE',
        mechanism: 'metabolism_induction',
        description:
          "St. John's Wort may affect iron metabolism through cytochrome P450 enzyme induction.",
        clinicalSignificance:
          'May alter iron absorption and metabolism, requiring monitoring of iron status.',
        evidenceLevel: 'C',
        sources: [
          'Drug Metab Dispos. 2000;28(11):1347-1355',
          'Clin Pharmacokinet. 2003;42(4):297-319',
        ],
        spacing: {
          minimumHours: 4,
          optimalHours: 6,
          explanation: 'Spacing may help minimize metabolic interference.',
        },
        riskFactors: {
          conditions: ['depression', 'anemia'],
        },
        alternatives: [
          'Monitor iron levels if using both',
          'Consider alternative mood support',
        ],
      },

      // Probiotics - Antibiotics (timing critical)
      {
        substance1: 'probiotics',
        substance2: 'antibiotics',
        severity: 'HIGH',
        mechanism: 'antagonistic_effect',
        description:
          'Antibiotics can kill beneficial probiotic bacteria, reducing probiotic effectiveness.',
        clinicalSignificance:
          'Timing is critical to maintain probiotic benefits while allowing antibiotic effectiveness.',
        evidenceLevel: 'A',
        sources: [
          'Cochrane Database Syst Rev. 2013;(5):CD006095',
          'JAMA. 2012;307(18):1959-1969',
          'Aliment Pharmacol Ther. 2007;26(3):343-357',
        ],
        spacing: {
          minimumHours: 2,
          optimalHours: 4,
          explanation:
            'Take probiotics 2-4 hours after antibiotics to avoid direct bacterial killing.',
        },
        alternatives: [
          'High-potency probiotics during antibiotic course',
          'Extend probiotic use after antibiotics',
        ],
      },
    ];

    // Store interactions in database with bidirectional keys
    for (const interaction of interactions) {
      const key1 = this.getInteractionKey(
        interaction.substance1,
        interaction.substance2
      );
      const key2 = this.getInteractionKey(
        interaction.substance2,
        interaction.substance1
      );

      if (!this.interactionDatabase.has(key1)) {
        this.interactionDatabase.set(key1, []);
      }
      if (!this.interactionDatabase.has(key2)) {
        this.interactionDatabase.set(key2, []);
      }

      this.interactionDatabase.get(key1)!.push(interaction);
      // Don't duplicate - the search will check both directions
    }

    console.log(
      `Initialized supplement interaction database with ${interactions.length} interactions`
    );
  }

  /**
   * Initialize substance aliases for better matching
   */
  private initializeAliases(): void {
    const aliases: Record<string, string[]> = {
      calcium: [
        'calcium carbonate',
        'calcium citrate',
        'calcium gluconate',
        'calcium phosphate',
      ],
      iron: [
        'ferrous sulfate',
        'ferrous gluconate',
        'ferrous fumarate',
        'iron bisglycinate',
        'heme iron',
      ],
      'vitamin d': [
        'vitamin d3',
        'cholecalciferol',
        'vitamin d2',
        'ergocalciferol',
        'calciferol',
      ],
      'vitamin c': [
        'ascorbic acid',
        'l-ascorbic acid',
        'sodium ascorbate',
        'calcium ascorbate',
      ],
      zinc: [
        'zinc gluconate',
        'zinc picolinate',
        'zinc citrate',
        'zinc sulfate',
        'zinc bisglycinate',
      ],
      copper: ['copper gluconate', 'copper sulfate', 'copper bisglycinate'],
      magnesium: [
        'magnesium oxide',
        'magnesium citrate',
        'magnesium glycinate',
        'magnesium chloride',
      ],
      'fish oil': ['omega 3', 'omega-3', 'epa', 'dha', 'cod liver oil'],
      'vitamin e': [
        'tocopherol',
        'alpha-tocopherol',
        'd-alpha-tocopherol',
        'mixed tocopherols',
      ],
      'st johns wort': ['hypericum perforatum', 'hypericum', 'st john wort'],
      probiotics: [
        'lactobacillus',
        'bifidobacterium',
        'probiotic',
        'beneficial bacteria',
      ],
      antibiotics: ['antibiotic', 'antimicrobial', 'penicillin', 'amoxicillin'],
    };

    for (const [primary, aliasList] of Object.entries(aliases)) {
      this.substanceAliases.set(primary, aliasList);

      // Also map each alias back to the primary name
      for (const alias of aliasList) {
        const normalized = this.normalizeSubstanceName(alias);
        if (!this.substanceAliases.has(normalized)) {
          this.substanceAliases.set(normalized, [primary]);
        } else {
          const existing = this.substanceAliases.get(normalized)!;
          if (!existing.includes(primary)) {
            existing.push(primary);
          }
        }
      }
    }

    console.log(
      `Initialized ${Object.keys(aliases).length} substance alias groups`
    );
  }
}
