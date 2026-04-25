import type { ArchivePattern } from '../types';

/**
 * Dreams + Symbolic Processing Archive Patterns
 */

export const DREAMS_SYMBOLS_PATTERNS: ArchivePattern[] = [
  {
    key: 'dreams_001_unfinished_processing',
    title: 'When Dreams Continue the Conversation',
    category: 'dreamsSymbols',
    description: 'A pattern where dream activity increases near emotional pressure or unresolved waking questions.',
    requiredSignals: ['dream_unfinished_processing'],
    supportingSignals: [
      'low_capacity',
      'deep_processing',
      'emotional_intensity',
      'dream_after_stress',
    ],
    shameLabel: 'random',
    clarityReframe: 'your inner world trying another language to process what did not settle during the day',
    lookbackDays: 30,
    minEvidenceCount: 3,
    minScore: 0.6,
  }
];
