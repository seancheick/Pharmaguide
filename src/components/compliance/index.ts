// src/components/compliance/index.ts
export { FDADisclaimer } from './FDADisclaimer';
export { SourceCitation, type CitationSource } from './SourceCitation';
export { ComplianceModal } from './ComplianceModal';

// FDA Compliance utilities and constants
export const FDA_COMPLIANCE = {
  DISCLAIMERS: {
    EDUCATIONAL_ONLY:
      'This app provides educational information only and is not intended to diagnose, treat, cure, or prevent any disease.',
    CONSULT_PROVIDER:
      'Always consult your healthcare provider before making any changes to your supplement regimen.',
    NOT_MEDICAL_ADVICE:
      'The information presented should not be used as a substitute for professional medical advice, diagnosis, or treatment.',
    INDIVIDUAL_VARIATION:
      'Individual responses may vary. This information may not apply to your specific health circumstances.',
  },
  EVIDENCE_LEVELS: {
    A: 'High Quality Evidence - Systematic reviews, meta-analyses, or high-quality RCTs',
    B: 'Moderate Quality Evidence - Well-designed controlled trials or cohort studies',
    C: 'Low Quality Evidence - Case-control studies or observational studies',
    D: 'Very Low Quality Evidence - Case reports, expert opinion, or theoretical',
  },
  REQUIRED_SOURCES: [
    'FDA Orange Book',
    'NIH National Library of Medicine',
    'PubMed Peer-Reviewed Studies',
    'Clinical Trial Databases',
    'FDA-Approved Drug Labels',
  ],
} as const;

// Helper function to create FDA-compliant source citations
export const createFDASource = (
  title: string,
  url?: string,
  year?: number,
  description?: string
) => ({
  id: `fda_${Date.now()}`,
  title,
  source: 'FDA',
  url,
  year,
  evidenceLevel: 'A',
  description,
});

export const createNIHSource = (
  title: string,
  url?: string,
  year?: number,
  description?: string
) => ({
  id: `nih_${Date.now()}`,
  title,
  source: 'NIH',
  url,
  year,
  evidenceLevel: 'A',
  description,
});

export const createPubMedSource = (
  title: string,
  evidenceLevel: 'A' | 'B' | 'C' | 'D',
  url?: string,
  year?: number,
  description?: string
) => ({
  id: `pubmed_${Date.now()}`,
  title,
  source: 'PubMed',
  url,
  year,
  evidenceLevel,
  description,
});
