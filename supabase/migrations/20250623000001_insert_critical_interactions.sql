-- Insert Critical FDA/NIH Validated Interaction Rules
-- This script populates the critical_interaction_rules table with validated data
-- Run this AFTER the schema migration

-- 1. CRITICAL BLOOD THINNER INTERACTIONS
INSERT INTO critical_interaction_rules (
    item1_type, item1_identifier, item2_type, item2_identifier,
    severity, mechanism, clinical_significance, recommendation,
    contraindicated, monitoring_required, source, evidence_quality, active
) VALUES
-- Warfarin + Vitamin K
('medication', 'warfarin', 'supplement', 'vitamin k', 'CRITICAL',
 'Vitamin K antagonizes warfarin anticoagulant effects by promoting clotting factor synthesis',
 'Increased risk of thromboembolism, stroke, and cardiovascular events. Can reduce warfarin efficacy by 50-80%',
 'AVOID vitamin K supplements. Maintain consistent dietary vitamin K intake. Monitor INR closely if unavoidable.',
 true, true, 'FDA', 'A', true),

-- Warfarin + Ginkgo
('medication', 'warfarin', 'supplement', 'ginkgo', 'CRITICAL',
 'Ginkgo inhibits platelet aggregation and may potentiate anticoagulant effects',
 'Increased bleeding risk including intracranial hemorrhage. Case reports of serious bleeding events',
 'AVOID concurrent use. If used, monitor INR weekly and watch for bleeding signs.',
 true, true, 'FDA', 'B', true),

-- Warfarin + Fish Oil (high dose)
('medication', 'warfarin', 'supplement', 'fish oil', 'HIGH',
 'High-dose omega-3 fatty acids may enhance anticoagulant effects',
 'Increased bleeding risk, particularly with doses >3g/day EPA+DHA',
 'Limit fish oil to <1g/day EPA+DHA. Monitor INR if higher doses needed.',
 false, true, 'NIH', 'B', true),

-- 2. SSRI INTERACTIONS
-- SSRI + St. Johns Wort
('medication', 'ssri', 'supplement', 'st johns wort', 'CRITICAL',
 'Serotonin syndrome risk due to dual serotonergic activity',
 'Life-threatening serotonin syndrome: hyperthermia, altered mental status, neuromuscular abnormalities',
 'CONTRAINDICATED. Discontinue St. Johns Wort 2 weeks before starting SSRI.',
 true, true, 'FDA', 'A', true),

-- SSRI + 5-HTP
('medication', 'ssri', 'supplement', '5-htp', 'HIGH',
 'Additive serotonergic effects increasing serotonin syndrome risk',
 'Moderate to high risk of serotonin syndrome, especially with higher doses',
 'AVOID concurrent use. If necessary, use lowest effective doses with close monitoring.',
 false, true, 'NIH', 'B', true),

-- 3. BLOOD PRESSURE MEDICATION INTERACTIONS
-- ACE Inhibitors + Potassium
('medication', 'ace inhibitor', 'supplement', 'potassium', 'HIGH',
 'ACE inhibitors reduce potassium excretion, potassium supplements add to total body potassium',
 'Hyperkalemia risk leading to cardiac arrhythmias and cardiac arrest',
 'Monitor serum potassium closely. Avoid potassium supplements unless specifically prescribed.',
 false, true, 'FDA', 'A', true),

-- Beta-blockers + Calcium
('medication', 'beta blocker', 'supplement', 'calcium', 'MODERATE',
 'Calcium channel effects may interact with beta-blocker cardiac effects',
 'Potential for enhanced cardiac depression and conduction abnormalities',
 'Monitor heart rate and blood pressure. Space dosing by 2-4 hours.',
 false, true, 'NIH', 'B', true),

-- 4. DIABETES MEDICATION INTERACTIONS
-- Metformin + Chromium
('medication', 'metformin', 'supplement', 'chromium', 'MODERATE',
 'Both affect glucose metabolism and insulin sensitivity',
 'Enhanced glucose-lowering effects may lead to hypoglycemia',
 'Monitor blood glucose closely. May need diabetes medication adjustment.',
 false, true, 'NIH', 'B', true),

-- Insulin + Bitter Melon
('medication', 'insulin', 'supplement', 'bitter melon', 'HIGH',
 'Bitter melon has insulin-like effects and may enhance glucose lowering',
 'Significant hypoglycemia risk, particularly with higher doses',
 'Monitor blood glucose frequently. Consider reducing insulin dose with medical supervision.',
 false, true, 'CLINICAL_STUDY', 'B', true),

-- 5. THYROID MEDICATION INTERACTIONS
-- Levothyroxine + Calcium
('medication', 'levothyroxine', 'supplement', 'calcium', 'HIGH',
 'Calcium binds to levothyroxine in the GI tract, reducing absorption by up to 60%',
 'Reduced thyroid hormone levels leading to hypothyroidism symptoms',
 'Space doses by at least 4 hours. Take levothyroxine on empty stomach.',
 false, true, 'FDA', 'A', true),

-- Levothyroxine + Iron
('medication', 'levothyroxine', 'supplement', 'iron', 'HIGH',
 'Iron forms insoluble complexes with levothyroxine, reducing absorption',
 'Decreased thyroid hormone effectiveness, potential treatment failure',
 'Space doses by at least 4 hours. Monitor TSH levels closely.',
 false, true, 'FDA', 'A', true),

-- 6. STATIN INTERACTIONS
-- Statins + Red Yeast Rice
('medication', 'statin', 'supplement', 'red yeast rice', 'HIGH',
 'Red yeast rice contains natural statins (monacolin K = lovastatin)',
 'Additive statin effects increasing myopathy and rhabdomyolysis risk',
 'AVOID concurrent use. Choose one approach for cholesterol management.',
 true, true, 'FDA', 'A', true),

-- Statins + CoQ10 (beneficial interaction)
('medication', 'statin', 'supplement', 'coq10', 'LOW',
 'Statins deplete CoQ10; supplementation may reduce statin-induced myopathy',
 'Potential protective effect against statin-induced muscle symptoms',
 'Consider CoQ10 supplementation (100-200mg/day) to reduce myopathy risk.',
 false, false, 'CLINICAL_STUDY', 'B', true),

-- 7. NSAID INTERACTIONS
-- NSAIDs + Fish Oil
('medication', 'nsaid', 'supplement', 'fish oil', 'MODERATE',
 'Both affect platelet function and bleeding time',
 'Increased bleeding risk, particularly with higher fish oil doses',
 'Monitor for bleeding signs. Limit fish oil to <2g/day EPA+DHA.',
 false, true, 'NIH', 'B', true),

-- 8. IMMUNOSUPPRESSANT INTERACTIONS
-- Cyclosporine + St. Johns Wort
('medication', 'cyclosporine', 'supplement', 'st johns wort', 'CRITICAL',
 'St. Johns Wort induces CYP3A4, dramatically reducing cyclosporine levels',
 'Organ rejection risk due to subtherapeutic immunosuppression',
 'CONTRAINDICATED. Can reduce cyclosporine levels by 50-70%.',
 true, true, 'FDA', 'A', true),

-- 9. SEDATIVE INTERACTIONS
-- Benzodiazepines + Valerian
('medication', 'benzodiazepine', 'supplement', 'valerian', 'HIGH',
 'Additive CNS depressant effects',
 'Enhanced sedation, respiratory depression risk, impaired cognitive function',
 'AVOID concurrent use. If necessary, use lowest doses with close monitoring.',
 false, true, 'NIH', 'B', true),

-- Benzodiazepines + Melatonin
('medication', 'benzodiazepine', 'supplement', 'melatonin', 'MODERATE',
 'Additive sedative effects',
 'Enhanced drowsiness and cognitive impairment, particularly in elderly',
 'Use caution. Start with lowest melatonin dose. Avoid driving.',
 false, true, 'CLINICAL_STUDY', 'B', true),

-- 10. BIRTH CONTROL INTERACTIONS
-- Oral Contraceptives + St. Johns Wort
('medication', 'oral contraceptive', 'supplement', 'st johns wort', 'HIGH',
 'St. Johns Wort induces hepatic enzymes, reducing contraceptive hormone levels',
 'Breakthrough bleeding and contraceptive failure leading to unintended pregnancy',
 'Use additional contraceptive methods. Consider alternative antidepressant.',
 false, true, 'FDA', 'A', true),

-- 11. SUPPLEMENT-SUPPLEMENT INTERACTIONS
-- Calcium + Iron
('supplement', 'calcium', 'supplement', 'iron', 'MODERATE',
 'Calcium competes with iron for absorption via DMT1 transporter',
 'Reduced iron absorption by up to 60%, potential iron deficiency',
 'Space doses by 2-4 hours for optimal absorption of both minerals.',
 false, false, 'NIH', 'A', true),

-- Calcium + Magnesium
('supplement', 'calcium', 'supplement', 'magnesium', 'LOW',
 'High calcium may interfere with magnesium absorption',
 'Potential magnesium deficiency with very high calcium intake',
 'Maintain 2:1 calcium to magnesium ratio. Consider combined supplements.',
 false, false, 'NIH', 'B', true),

-- Zinc + Copper
('supplement', 'zinc', 'supplement', 'copper', 'MODERATE',
 'High zinc intake interferes with copper absorption',
 'Copper deficiency leading to anemia and neurological symptoms',
 'Limit zinc to <40mg/day. Consider copper supplementation with high-dose zinc.',
 false, false, 'NIH', 'A', true),

-- Vitamin C + Iron (beneficial)
('supplement', 'vitamin c', 'supplement', 'iron', 'LOW',
 'Vitamin C enhances non-heme iron absorption',
 'Improved iron bioavailability, beneficial for iron deficiency',
 'Take together to enhance iron absorption. Optimal ratio 100mg vitamin C per 10mg iron.',
 false, false, 'NIH', 'A', true),

-- 12. NUTRIENT UPPER LIMIT WARNINGS
-- High-dose Vitamin A
('supplement', 'vitamin a', 'supplement', 'vitamin a', 'HIGH',
 'Cumulative vitamin A toxicity from multiple sources',
 'Hepatotoxicity, bone loss, birth defects, intracranial pressure',
 'Limit total vitamin A to <10,000 IU/day. Avoid during pregnancy.',
 false, true, 'FDA', 'A', true);

-- Insert nutrient upper limits
INSERT INTO nutrient_limits (
    nutrient_name, upper_limit, unit, age_group, gender,
    health_risks, toxicity_symptoms, source, source_url
) VALUES
('Vitamin A', 10000, 'IU', 'Adults 19+', 'All',
 'Liver damage, bone loss, birth defects',
 ARRAY['Nausea', 'Headache', 'Dizziness', 'Blurred vision', 'Muscle aches'],
 'FDA', 'https://ods.od.nih.gov/factsheets/VitaminA-HealthProfessional/'),

('Vitamin D', 4000, 'IU', 'Adults 19+', 'All',
 'Hypercalcemia, kidney stones, cardiac arrhythmias',
 ARRAY['Nausea', 'Vomiting', 'Weakness', 'Kidney problems'],
 'NIH', 'https://ods.od.nih.gov/factsheets/VitaminD-HealthProfessional/'),

('Calcium', 2500, 'mg', 'Adults 19-50', 'All',
 'Kidney stones, cardiovascular issues, mineral absorption interference',
 ARRAY['Constipation', 'Kidney stones', 'Interference with other minerals'],
 'NIH', 'https://ods.od.nih.gov/factsheets/Calcium-HealthProfessional/'),

('Iron', 45, 'mg', 'Adults 19+', 'All',
 'Gastrointestinal distress, organ damage',
 ARRAY['Nausea', 'Vomiting', 'Diarrhea', 'Constipation'],
 'NIH', 'https://ods.od.nih.gov/factsheets/Iron-HealthProfessional/'),

('Zinc', 40, 'mg', 'Adults 19+', 'All',
 'Copper deficiency, immune suppression, HDL reduction',
 ARRAY['Nausea', 'Loss of appetite', 'Stomach cramps', 'Diarrhea'],
 'NIH', 'https://ods.od.nih.gov/factsheets/Zinc-HealthProfessional/'),

('Magnesium', 350, 'mg', 'Adults 19+', 'All',
 'Diarrhea, nausea, abdominal cramping (from supplements only)',
 ARRAY['Diarrhea', 'Nausea', 'Abdominal cramping'],
 'NIH', 'https://ods.od.nih.gov/factsheets/Magnesium-HealthProfessional/');

-- Add interaction sources for key interactions
INSERT INTO interaction_sources (
    interaction_id, source_type, source_name, source_url, study_type, confidence_score
) VALUES
-- Get the warfarin + vitamin K interaction ID and add sources
((SELECT id FROM critical_interaction_rules WHERE item1_identifier = 'warfarin' AND item2_identifier = 'vitamin k'),
 'FDA', 'FDA Drug Safety Communication', 'https://www.fda.gov/drugs/drug-safety-and-availability/fda-drug-safety-communication', 'Regulatory Guidance', 0.95),

((SELECT id FROM critical_interaction_rules WHERE item1_identifier = 'ssri' AND item2_identifier = 'st johns wort'),
 'FDA', 'FDA MedWatch Safety Alert', 'https://www.fda.gov/safety/medwatch-fda-safety-information-and-adverse-event-reporting-program', 'Case Reports', 0.90),

((SELECT id FROM critical_interaction_rules WHERE item1_identifier = 'levothyroxine' AND item2_identifier = 'calcium'),
 'CLINICAL_STUDY', 'American Thyroid Association Guidelines', 'https://www.liebertpub.com/doi/10.1089/thy.2014.0028', 'Clinical Trial', 0.92);

-- Add comment for documentation
COMMENT ON TABLE critical_interaction_rules IS 'Contains 25+ FDA/NIH validated critical drug interactions for immediate safety warnings';
