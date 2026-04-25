import type { ArchivePattern } from '../types';

/**
 * Creativity + Expression Archive Patterns
 */

export const CREATIVITY_EXPRESSION_PATTERNS: ArchivePattern[] = [
  {
    key: 'creativity_001_creative_alchemy',
    title: 'How You Turn Feeling into Form',
    category: 'creativityExpression',
    description: 'A pattern where creation—writing, design, making—becomes a primary way to metabolize life and emotion.',
    requiredSignals: ['creative_processing'],
    supportingSignals: [
      'creative_aliveness',
      'expression_need',
      'beauty_making',
      'voice_emerging',
    ],
    shameLabel: 'distraction',
    clarityReframe: 'transformation through expression',
    lookbackDays: 90,
    minEvidenceCount: 3,
    minScore: 0.6,
  }
];
