import type { ArchivePattern } from '../types';

/**
 * Boundaries + Self-Trust Archive Patterns
 */

export const BOUNDARY_SELF_TRUST_PATTERNS: ArchivePattern[] = [
  {
    key: 'boundaries_001_boundary_rebuilding',
    title: 'Where You Draw the Line',
    category: 'boundariesSelfTrust',
    description: 'A growing shift in how limits are held, focusing on internal truth rather than external acceptance.',
    requiredSignals: ['boundary_rebuilding'],
    supportingSignals: [
      'self_trust_growth',
      'overexplaining',
      'boundary_guilt',
      'inner_authority',
      'says_no',
    ],
    shameLabel: 'becoming cold',
    clarityReframe: 'self-trust beginning to stand without needing everyone’s permission',
    lookbackDays: 90,
    minEvidenceCount: 3,
    minScore: 0.6,
  }
];
