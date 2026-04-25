import type { ArchivePattern } from '../types';

/**
 * Cognitive Style Archive Patterns
 */

export const COGNITIVE_STYLE_PATTERNS: ArchivePattern[] = [
  {
    key: 'cognitive_001_deep_processor',
    title: 'How You Process Pain',
    category: 'cognitiveStyle',
    description: 'A pattern of needing to find meaning and context before an experience can be released.',
    requiredSignals: ['deep_processing'],
    supportingSignals: [
      'meaning_making',
      'need_for_exact_words',
      'pattern_recognition',
      'analysis_as_regulation',
      'asks_why',
    ],
    shameLabel: 'overthinking',
    clarityReframe: 'your mind trying to make something emotionally safe enough to feel',
    lookbackDays: 90,
    minEvidenceCount: 5,
    minScore: 0.7,
  }
];
