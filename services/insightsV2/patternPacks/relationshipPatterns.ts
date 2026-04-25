import type { ArchivePattern } from '../types';

/**
 * Relationship Patterns Archive Patterns
 */

export const RELATIONSHIP_PATTERNS: ArchivePattern[] = [
  {
    key: 'relationships_001_safety_testing',
    title: 'How You Measure Safety',
    category: 'relationships',
    description: 'A pattern where trust is built through repeated evidence of consistency and follow-through.',
    requiredSignals: ['relationship_safety_testing'],
    supportingSignals: [
      'consistency_need',
      'tone_sensitivity',
      'repair_need',
      'trust_builds_slowly',
    ],
    shameLabel: 'suspicion',
    clarityReframe: 'discernment formed around the need for care to be real, not just spoken',
    lookbackDays: 90,
    minEvidenceCount: 4,
    minScore: 0.65,
  }
];
