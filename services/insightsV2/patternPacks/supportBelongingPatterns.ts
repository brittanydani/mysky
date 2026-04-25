import type { ArchivePattern } from '../types';

/**
 * Support + Belonging Archive Patterns
 */

export const SUPPORT_BELONGING_PATTERNS: ArchivePattern[] = [
  {
    key: 'support_belonging_001_support_scarcity',
    title: 'Your Relationship with Being Caught',
    category: 'supportBelonging',
    description: 'Support feels precious, limited, uncertain, or difficult to ask for.',
    requiredSignals: ['support_scarcity'],
    supportingSignals: [
      'support_need',
      'self_blame',
      'loneliness',
      'small_circle_pressure',
      'fear_of_being_too_much',
      'minimizes_need',
      'wants_to_be_caught',
    ],
    conflictingSignals: ['receiving_openness', 'support_abundance_shift'],
    shameLabel: 'neediness',
    clarityReframe: 'a human need for care to meet the weight before crisis has to prove it',
    lookbackDays: 90,
    minEvidenceCount: 4,
    minScore: 0.6,
  },
  {
    key: 'support_belonging_002_belonging_ache',
    title: 'The Belonging Ache',
    category: 'supportBelonging',
    description: 'A pattern of feeling like an outsider or that full authenticity is not welcome.',
    requiredSignals: ['belonging_ache'],
    supportingSignals: [
      'loneliness',
      'wants_to_be_seen',
      'selective_vulnerability',
      'fear_of_being_too_much',
    ],
    shameLabel: 'being too much',
    clarityReframe: 'the human need to be known, included, and welcomed without performance',
    lookbackDays: 90,
    minEvidenceCount: 3,
    minScore: 0.55,
  }
];
