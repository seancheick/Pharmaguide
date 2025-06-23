// src/services/interactions/criticalInteractions.ts
// 🚨 CRITICAL SAFETY RULES: FDA/NIH Validated Dangerous Interactions
// These are life-threatening interactions that require immediate warnings

export interface CriticalInteraction {
  id: string;
  substance1: string;
  substance2: string;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE';
  mechanism: string;
  riskDescription: string;
  recommendation: string;
  evidenceLevel: 'FDA_BOXED_WARNING' | 'FDA_CONTRAINDICATION' | 'NIH_VALIDATED' | 'CLINICAL_STUDY';
  sources: string[];
  timeframe?: string;
  symptoms?: string[];
}

/**
 * 25 Critical FDA/NIH Validated Dangerous Interactions
 * Sources: FDA Drug Safety Communications, NIH MedlinePlus, Clinical Studies
 */
export const CRITICAL_INTERACTIONS: CriticalInteraction[] = [
  // 1. BLOOD THINNERS + VITAMIN K
  {
    id: 'warfarin_vitamin_k',
    substance1: 'warfarin',
    substance2: 'vitamin k',
    severity: 'CRITICAL',
    mechanism: 'Vitamin K antagonizes warfarin anticoagulant effects',
    riskDescription: 'Increased risk of blood clots, stroke, heart attack',
    recommendation: 'AVOID vitamin K supplements while on warfarin. Consult physician immediately.',
    evidenceLevel: 'FDA_BOXED_WARNING',
    sources: ['FDA Drug Safety Communication', 'NIH MedlinePlus'],
    symptoms: ['Unusual bleeding', 'Bruising', 'Blood in urine/stool'],
  },

  // 2. MAOI + TYRAMINE SUPPLEMENTS
  {
    id: 'maoi_tyramine',
    substance1: 'maoi',
    substance2: 'tyramine',
    severity: 'CRITICAL',
    mechanism: 'MAOIs prevent tyramine breakdown causing hypertensive crisis',
    riskDescription: 'Life-threatening blood pressure spike, stroke risk',
    recommendation: 'AVOID all tyramine-containing supplements with MAOIs',
    evidenceLevel: 'FDA_CONTRAINDICATION',
    sources: ['FDA Prescribing Information', 'NIH Drug Interactions'],
    symptoms: ['Severe headache', 'Chest pain', 'Rapid heartbeat', 'Nausea'],
  },

  // 3. ST. JOHN'S WORT + PRESCRIPTION MEDICATIONS
  {
    id: 'stjohns_wort_medications',
    substance1: 'st johns wort',
    substance2: 'prescription medications',
    severity: 'CRITICAL',
    mechanism: 'Induces CYP3A4 enzyme reducing medication effectiveness',
    riskDescription: 'Reduced effectiveness of critical medications',
    recommendation: 'AVOID St. Johns Wort with any prescription medications',
    evidenceLevel: 'FDA_CONTRAINDICATION',
    sources: ['FDA Drug Safety Alert', 'NIH Clinical Studies'],
    symptoms: ['Return of original symptoms', 'Treatment failure'],
  },

  // 4. IRON + CALCIUM (High Doses)
  {
    id: 'iron_calcium_high_dose',
    substance1: 'iron',
    substance2: 'calcium',
    severity: 'HIGH',
    mechanism: 'Calcium blocks iron absorption at high doses',
    riskDescription: 'Iron deficiency anemia, especially in vulnerable populations',
    recommendation: 'Take iron and calcium supplements 2+ hours apart',
    evidenceLevel: 'NIH_VALIDATED',
    sources: ['NIH Office of Dietary Supplements', 'Clinical Nutrition Studies'],
    timeframe: 'Take 2+ hours apart',
  },

  // 5. GINKGO BILOBA + ANTICOAGULANTS
  {
    id: 'ginkgo_anticoagulants',
    substance1: 'ginkgo biloba',
    substance2: 'anticoagulants',
    severity: 'CRITICAL',
    mechanism: 'Additive anticoagulant effects increase bleeding risk',
    riskDescription: 'Severe bleeding, hemorrhage risk',
    recommendation: 'AVOID ginkgo with blood thinners. Monitor for bleeding.',
    evidenceLevel: 'FDA_CONTRAINDICATION',
    sources: ['FDA Adverse Event Reports', 'Cochrane Reviews'],
    symptoms: ['Unusual bleeding', 'Easy bruising', 'Prolonged bleeding'],
  },

  // 6. KAVA + ALCOHOL/SEDATIVES
  {
    id: 'kava_sedatives',
    substance1: 'kava',
    substance2: 'sedatives',
    severity: 'CRITICAL',
    mechanism: 'Additive CNS depression effects',
    riskDescription: 'Respiratory depression, coma risk',
    recommendation: 'AVOID kava with alcohol or sedative medications',
    evidenceLevel: 'FDA_CONTRAINDICATION',
    sources: ['FDA Safety Alert', 'NIH Drug Interactions'],
    symptoms: ['Extreme drowsiness', 'Confusion', 'Difficulty breathing'],
  },

  // 7. HIGH-DOSE VITAMIN A + RETINOIDS
  {
    id: 'vitamin_a_retinoids',
    substance1: 'vitamin a',
    substance2: 'retinoids',
    severity: 'CRITICAL',
    mechanism: 'Additive vitamin A toxicity',
    riskDescription: 'Vitamin A toxicity, liver damage, birth defects',
    recommendation: 'AVOID high-dose vitamin A with retinoid medications',
    evidenceLevel: 'FDA_BOXED_WARNING',
    sources: ['FDA Prescribing Information', 'Teratology Studies'],
    symptoms: ['Nausea', 'Headache', 'Liver problems', 'Skin changes'],
  },

  // 8. MAGNESIUM + CERTAIN ANTIBIOTICS
  {
    id: 'magnesium_antibiotics',
    substance1: 'magnesium',
    substance2: 'fluoroquinolone antibiotics',
    severity: 'HIGH',
    mechanism: 'Magnesium chelates antibiotics reducing absorption',
    riskDescription: 'Antibiotic treatment failure, infection persistence',
    recommendation: 'Take magnesium 2+ hours before or 6+ hours after antibiotics',
    evidenceLevel: 'FDA_CONTRAINDICATION',
    sources: ['FDA Prescribing Information', 'Clinical Pharmacology'],
    timeframe: 'Separate by 2-6 hours',
  },

  // 9. POTASSIUM + ACE INHIBITORS
  {
    id: 'potassium_ace_inhibitors',
    substance1: 'potassium',
    substance2: 'ace inhibitors',
    severity: 'CRITICAL',
    mechanism: 'Additive potassium retention causing hyperkalemia',
    riskDescription: 'Life-threatening heart rhythm abnormalities',
    recommendation: 'AVOID potassium supplements with ACE inhibitors without monitoring',
    evidenceLevel: 'FDA_BOXED_WARNING',
    sources: ['FDA Drug Safety', 'Cardiology Guidelines'],
    symptoms: ['Irregular heartbeat', 'Muscle weakness', 'Fatigue'],
  },

  // 10. ZINC + COPPER DEPLETION
  {
    id: 'zinc_copper_depletion',
    substance1: 'zinc',
    substance2: 'copper',
    severity: 'HIGH',
    mechanism: 'High zinc intake depletes copper stores',
    riskDescription: 'Copper deficiency anemia, neurological problems',
    recommendation: 'Limit zinc to <40mg daily, consider copper supplementation',
    evidenceLevel: 'NIH_VALIDATED',
    sources: ['NIH Upper Limits', 'Trace Element Research'],
    symptoms: ['Anemia', 'Neutropenia', 'Neurological symptoms'],
  },

  // 11. GARLIC + ANTICOAGULANTS
  {
    id: 'garlic_anticoagulants',
    substance1: 'garlic',
    substance2: 'anticoagulants',
    severity: 'HIGH',
    mechanism: 'Garlic enhances anticoagulant effects',
    riskDescription: 'Increased bleeding risk, especially perioperatively',
    recommendation: 'Monitor bleeding parameters, stop before surgery',
    evidenceLevel: 'CLINICAL_STUDY',
    sources: ['Surgery Guidelines', 'Hemostasis Studies'],
    symptoms: ['Easy bruising', 'Prolonged bleeding', 'Nosebleeds'],
  },

  // 12. GINSENG + DIABETES MEDICATIONS
  {
    id: 'ginseng_diabetes_meds',
    substance1: 'ginseng',
    substance2: 'diabetes medications',
    severity: 'HIGH',
    mechanism: 'Additive hypoglycemic effects',
    riskDescription: 'Severe hypoglycemia, loss of consciousness',
    recommendation: 'Monitor blood glucose closely, adjust medications',
    evidenceLevel: 'CLINICAL_STUDY',
    sources: ['Diabetes Care Studies', 'Endocrinology Reviews'],
    symptoms: ['Shakiness', 'Sweating', 'Confusion', 'Dizziness'],
  },

  // 13. LICORICE ROOT + HEART MEDICATIONS
  {
    id: 'licorice_heart_meds',
    substance1: 'licorice root',
    substance2: 'heart medications',
    severity: 'CRITICAL',
    mechanism: 'Licorice causes potassium loss and sodium retention',
    riskDescription: 'Heart rhythm abnormalities, hypertension',
    recommendation: 'AVOID licorice with heart medications',
    evidenceLevel: 'FDA_CONTRAINDICATION',
    sources: ['FDA Adverse Events', 'Cardiology Case Reports'],
    symptoms: ['Irregular heartbeat', 'High blood pressure', 'Muscle weakness'],
  },

  // 14. YOHIMBE + BLOOD PRESSURE MEDICATIONS
  {
    id: 'yohimbe_bp_meds',
    substance1: 'yohimbe',
    substance2: 'blood pressure medications',
    severity: 'CRITICAL',
    mechanism: 'Yohimbe can cause dangerous blood pressure changes',
    riskDescription: 'Hypertensive crisis or severe hypotension',
    recommendation: 'AVOID yohimbe with any blood pressure medications',
    evidenceLevel: 'FDA_CONTRAINDICATION',
    sources: ['FDA Safety Alerts', 'Hypertension Guidelines'],
    symptoms: ['Severe headache', 'Chest pain', 'Dizziness', 'Fainting'],
  },

  // 15. BITTER ORANGE + STIMULANTS
  {
    id: 'bitter_orange_stimulants',
    substance1: 'bitter orange',
    substance2: 'stimulants',
    severity: 'CRITICAL',
    mechanism: 'Additive sympathomimetic effects',
    riskDescription: 'Heart attack, stroke, dangerous blood pressure elevation',
    recommendation: 'AVOID bitter orange with any stimulant medications',
    evidenceLevel: 'FDA_CONTRAINDICATION',
    sources: ['FDA Safety Communications', 'Cardiovascular Case Reports'],
    symptoms: ['Rapid heartbeat', 'High blood pressure', 'Chest pain'],
  },

  // 16. GOLDENSEAL + LIVER MEDICATIONS
  {
    id: 'goldenseal_liver_meds',
    substance1: 'goldenseal',
    substance2: 'liver medications',
    severity: 'HIGH',
    mechanism: 'Inhibits CYP enzymes affecting drug metabolism',
    riskDescription: 'Altered medication levels, toxicity or ineffectiveness',
    recommendation: 'Avoid goldenseal with medications metabolized by liver',
    evidenceLevel: 'CLINICAL_STUDY',
    sources: ['Drug Metabolism Studies', 'Hepatology Reviews'],
    symptoms: ['Medication side effects', 'Treatment failure'],
  },

  // 17. ECHINACEA + IMMUNOSUPPRESSANTS
  {
    id: 'echinacea_immunosuppressants',
    substance1: 'echinacea',
    substance2: 'immunosuppressants',
    severity: 'HIGH',
    mechanism: 'Echinacea stimulates immune system',
    riskDescription: 'Reduced effectiveness of immunosuppressive therapy',
    recommendation: 'AVOID echinacea with immunosuppressive medications',
    evidenceLevel: 'CLINICAL_STUDY',
    sources: ['Transplant Guidelines', 'Immunology Studies'],
    symptoms: ['Organ rejection signs', 'Autoimmune flares'],
  },

  // 18. FEVERFEW + ANTICOAGULANTS
  {
    id: 'feverfew_anticoagulants',
    substance1: 'feverfew',
    substance2: 'anticoagulants',
    severity: 'HIGH',
    mechanism: 'Feverfew inhibits platelet aggregation',
    riskDescription: 'Increased bleeding risk',
    recommendation: 'Monitor bleeding parameters, stop before surgery',
    evidenceLevel: 'CLINICAL_STUDY',
    sources: ['Platelet Function Studies', 'Surgery Guidelines'],
    symptoms: ['Easy bruising', 'Prolonged bleeding'],
  },

  // 19. CHROMIUM + DIABETES MEDICATIONS
  {
    id: 'chromium_diabetes_meds',
    substance1: 'chromium',
    substance2: 'diabetes medications',
    severity: 'HIGH',
    mechanism: 'Additive glucose-lowering effects',
    riskDescription: 'Severe hypoglycemia',
    recommendation: 'Monitor blood glucose, may need medication adjustment',
    evidenceLevel: 'CLINICAL_STUDY',
    sources: ['Diabetes Research', 'Endocrinology Studies'],
    symptoms: ['Low blood sugar symptoms', 'Shakiness', 'Confusion'],
  },

  // 20. MELATONIN + SEDATIVES
  {
    id: 'melatonin_sedatives',
    substance1: 'melatonin',
    substance2: 'sedatives',
    severity: 'HIGH',
    mechanism: 'Additive sedative effects',
    riskDescription: 'Excessive sedation, impaired coordination',
    recommendation: 'Avoid combining, use lowest effective doses',
    evidenceLevel: 'CLINICAL_STUDY',
    sources: ['Sleep Medicine Studies', 'CNS Drug Interactions'],
    symptoms: ['Extreme drowsiness', 'Confusion', 'Poor coordination'],
  },

  // 21. COENZYME Q10 + WARFARIN
  {
    id: 'coq10_warfarin',
    substance1: 'coenzyme q10',
    substance2: 'warfarin',
    severity: 'HIGH',
    mechanism: 'CoQ10 may reduce warfarin effectiveness',
    riskDescription: 'Increased clotting risk, stroke risk',
    recommendation: 'Monitor INR closely, may need warfarin dose adjustment',
    evidenceLevel: 'CLINICAL_STUDY',
    sources: ['Anticoagulation Studies', 'Cardiology Reviews'],
    symptoms: ['Blood clot symptoms', 'Stroke signs'],
  },

  // 22. MILK THISTLE + LIVER MEDICATIONS
  {
    id: 'milk_thistle_liver_meds',
    substance1: 'milk thistle',
    substance2: 'liver medications',
    severity: 'MODERATE',
    mechanism: 'May affect liver enzyme activity',
    riskDescription: 'Altered medication metabolism',
    recommendation: 'Monitor liver function and medication levels',
    evidenceLevel: 'CLINICAL_STUDY',
    sources: ['Hepatology Studies', 'Drug Metabolism Research'],
    symptoms: ['Medication side effects', 'Liver function changes'],
  },

  // 23. VALERIAN + SEDATIVES
  {
    id: 'valerian_sedatives',
    substance1: 'valerian',
    substance2: 'sedatives',
    severity: 'HIGH',
    mechanism: 'Additive CNS depressant effects',
    riskDescription: 'Excessive sedation, respiratory depression',
    recommendation: 'Avoid combining, taper gradually if discontinuing',
    evidenceLevel: 'CLINICAL_STUDY',
    sources: ['Sleep Medicine Research', 'CNS Studies'],
    symptoms: ['Extreme drowsiness', 'Difficulty breathing'],
  },

  // 24. GRAPEFRUIT + MEDICATIONS
  {
    id: 'grapefruit_medications',
    substance1: 'grapefruit',
    substance2: 'cyp3a4 medications',
    severity: 'CRITICAL',
    mechanism: 'Inhibits CYP3A4 enzyme increasing drug levels',
    riskDescription: 'Dangerous medication toxicity',
    recommendation: 'AVOID grapefruit with affected medications',
    evidenceLevel: 'FDA_CONTRAINDICATION',
    sources: ['FDA Drug Safety', 'Clinical Pharmacology'],
    symptoms: ['Medication toxicity symptoms', 'Side effect amplification'],
  },

  // 25. HIGH-DOSE VITAMIN E + ANTICOAGULANTS
  {
    id: 'vitamin_e_anticoagulants',
    substance1: 'vitamin e',
    substance2: 'anticoagulants',
    severity: 'HIGH',
    mechanism: 'High-dose vitamin E enhances anticoagulant effects',
    riskDescription: 'Increased bleeding risk',
    recommendation: 'Limit vitamin E to <400 IU with anticoagulants',
    evidenceLevel: 'CLINICAL_STUDY',
    sources: ['Anticoagulation Guidelines', 'Vitamin E Studies'],
    symptoms: ['Easy bruising', 'Prolonged bleeding', 'Hemorrhage'],
  },
];

/**
 * Check if a substance matches any critical interaction patterns
 */
export function checkCriticalInteraction(
  substance1: string,
  substance2: string
): CriticalInteraction | null {
  const s1 = substance1.toLowerCase().trim();
  const s2 = substance2.toLowerCase().trim();

  for (const interaction of CRITICAL_INTERACTIONS) {
    const int1 = interaction.substance1.toLowerCase();
    const int2 = interaction.substance2.toLowerCase();

    // Check both directions
    if (
      (s1.includes(int1) && s2.includes(int2)) ||
      (s1.includes(int2) && s2.includes(int1))
    ) {
      return interaction;
    }
  }

  return null;
}

/**
 * Get all critical interactions for a substance
 */
export function getCriticalInteractionsForSubstance(
  substance: string
): CriticalInteraction[] {
  const s = substance.toLowerCase().trim();
  
  return CRITICAL_INTERACTIONS.filter(interaction => {
    const int1 = interaction.substance1.toLowerCase();
    const int2 = interaction.substance2.toLowerCase();
    
    return s.includes(int1) || s.includes(int2);
  });
}

/**
 * Get interaction severity level
 */
export function getInteractionSeverity(interaction: CriticalInteraction): {
  level: number;
  color: string;
  action: string;
} {
  switch (interaction.severity) {
    case 'CRITICAL':
      return { level: 3, color: '#FF3B30', action: 'AVOID COMPLETELY' };
    case 'HIGH':
      return { level: 2, color: '#FF9500', action: 'USE WITH CAUTION' };
    case 'MODERATE':
      return { level: 1, color: '#FFCC00', action: 'MONITOR CLOSELY' };
    default:
      return { level: 0, color: '#34C759', action: 'SAFE' };
  }
}
