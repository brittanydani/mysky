import type { ArchivePattern } from '../types';

/**
 * Natal Chart Reflection Archive Patterns
 */

export const NATAL_CHART_REFLECTION_PATTERNS: ArchivePattern[] = [
  {
    key: 'chart_001_theme_confirmed',
    title: 'Chart Theme Confirmed by Archive',
    category: 'natalChartReflection',
    description: 'A pattern where a specific chart theme matches repeated lived data in the archive.',
    requiredSignals: ['chart_theme_confirmed'],
    supportingSignals: [
      'chart_emotional_depth_theme',
      'chart_responsibility_theme',
      'chart_relationship_theme',
      'deep_processing',
      'responsibility_weight',
    ],
    shameLabel: 'fate',
    clarityReframe: 'a symbolic mirror becoming more useful when compared with your actual life',
    lookbackDays: 365,
    minEvidenceCount: 3,
    minScore: 0.6,
  }
];
