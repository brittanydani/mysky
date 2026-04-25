import type { ArchivePattern } from '../types';

/**
 * Values + Integrity Archive Patterns
 */

export const VALUES_INTEGRITY_PATTERNS: ArchivePattern[] = [
  {
    key: 'values_001_justice_advocate',
    title: 'The Value Beneath Your Anger',
    category: 'valuesIntegrity',
    description: 'A pattern where emotional intensity is linked to violations of core principles like fairness or protection.',
    requiredSignals: ['justice_sensitivity'],
    supportingSignals: [
      'anger',
      'meaning_making',
      'boundary_rebuilding',
      'integrity_cost',
      'moral_weight',
    ],
    shameLabel: 'being reactive',
    clarityReframe: 'your ethics becoming impossible to silence',
    lookbackDays: 90,
    minEvidenceCount: 3,
    minScore: 0.65,
  }
];
