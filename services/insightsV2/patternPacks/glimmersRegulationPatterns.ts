import type { ArchivePattern } from '../types';

/**
 * Glimmers + Regulation Archive Patterns
 */

export const GLIMMERS_REGULATION_PATTERNS: ArchivePattern[] = [
  {
    key: 'glimmers_001_quiet_relief',
    title: 'The Quiet Relief Pattern',
    category: 'glimmersRegulation',
    description: 'A pattern where the system softens in response to low-demand quiet or nature.',
    requiredSignals: ['glimmer_softening'],
    supportingSignals: [
      'quiet_safety',
      'nature_regulation',
      'beauty_glimmer',
      'somatic_safety',
      'emotional_softening',
    ],
    shameLabel: 'doing nothing',
    clarityReframe: 'a nervous system learning what safety feels like in real time',
    lookbackDays: 30,
    minEvidenceCount: 2,
    minScore: 0.5,
  }
];
