import type { ArchivePattern } from '../types';

/**
 * Identity + Growth Archive Patterns
 */

export const IDENTITY_GROWTH_PATTERNS: ArchivePattern[] = [
  {
    key: 'identity_001_transformation_seeker',
    title: 'The Person You Are Becoming',
    category: 'identityGrowth',
    description: 'A pattern of living between versions of oneself, with old roles loosening.',
    requiredSignals: ['transformation_season'],
    supportingSignals: [
      'identity_rewriting',
      'old_story_loosening',
      'chapter_shift',
      'self_definition',
      'growth_edge',
    ],
    shameLabel: 'instability',
    clarityReframe: 'becoming before the new shape has fully settled',
    lookbackDays: 180,
    minEvidenceCount: 4,
    minScore: 0.65,
  }
];
