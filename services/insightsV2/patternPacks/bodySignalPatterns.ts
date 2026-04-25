import type { ArchivePattern } from '../types';

/**
 * Body Signals Archive Patterns
 */

export const BODY_SIGNAL_PATTERNS: ArchivePattern[] = [
  {
    key: 'body_signals_001_body_knows_first',
    title: 'The Body Knows First',
    category: 'bodySignals',
    description: 'A pattern where physical signals appear before the emotional story is fully named.',
    requiredSignals: ['body_knows_first'],
    supportingSignals: [
      'chest_pressure',
      'shoulder_burden',
      'jaw_restraint',
      'gut_signal',
      'head_pressure',
      'low_energy',
    ],
    shameLabel: 'weakness',
    clarityReframe: 'body intelligence speaking before the story is fully formed',
    lookbackDays: 60,
    minEvidenceCount: 4,
    minScore: 0.6,
  }
];
