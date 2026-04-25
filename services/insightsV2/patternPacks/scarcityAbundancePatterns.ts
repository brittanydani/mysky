import type { ArchivePattern } from '../types';

/**
 * Scarcity + Abundance Archive Patterns
 */

export const SCARCITY_ABUNDANCE_PATTERNS: ArchivePattern[] = [
  {
    key: 'scarcity_001_scarcity_scanner',
    title: 'The Scarcity Scanner',
    category: 'scarcityAbundance',
    description: 'A pattern of scanning for loss or potential deficiency in time, energy, or support.',
    requiredSignals: ['scarcity_scanning'],
    supportingSignals: [
      'fear_of_loss',
      'time_scarcity',
      'energy_scarcity',
      'receiving_care_difficulty',
    ],
    shameLabel: 'greed',
    clarityReframe: 'a protective habit from a time when enoughness was not guaranteed',
    lookbackDays: 90,
    minEvidenceCount: 3,
    minScore: 0.6,
  }
];
