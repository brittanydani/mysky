import type { ArchivePattern } from '../types';

/**
 * Family + Home Archive Patterns
 */

export const FAMILY_HOME_PATTERNS: ArchivePattern[] = [
  {
    key: 'family_001_pattern_breaker',
    title: 'The Family Pattern Breaker',
    category: 'familyHome',
    description: 'A pattern of consciously identifying and shifting inherited emotional dynamics.',
    requiredSignals: ['family_pattern_awareness'],
    supportingSignals: [
      'breaks_old_pattern',
      'boundary_rebuilding',
      'identity_rewriting',
      'family_loyalty_tension',
    ],
    shameLabel: 'disloyalty',
    clarityReframe: 'integrity choosing a different path for the future',
    lookbackDays: 180,
    minEvidenceCount: 3,
    minScore: 0.6,
  }
];
