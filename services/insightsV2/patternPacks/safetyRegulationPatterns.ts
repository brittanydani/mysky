import type { ArchivePattern, SignalKey } from '../types';

const safetyRegulationPattern = (
  key: string,
  title: string,
  requiredSignals: SignalKey[],
  supportingSignals: SignalKey[],
  shameLabel: string,
  clarityReframe: string,
  description: string,
  tags: string[] = [],
): ArchivePattern => ({
  key,
  title,
  category: 'safetyRegulation',
  description,
  requiredSignals,
  supportingSignals,
  shameLabel,
  clarityReframe,
  lookbackDays: 90,
  minEvidenceCount: 3,
  minScore: 0.58,
  cooldownDays: 10,
  tags,
});

export const SAFETY_REGULATION_PATTERNS: ArchivePattern[] = [
  safetyRegulationPattern(
    'safety_regulation_001_calm_bracing',
    'When Calm Still Feels Watchful',
    ['calm_bracing'],
    ['calm_is_new', 'quiet_safety', 'relationship_safety_testing', 'fear_of_loss'],
    'not trusting peace',
    'a protective system learning that calm can last',
    'Calm may feel unfamiliar or suspicious when the system is used to preparing for disruption.',
    ['calm', 'bracing', 'safety'],
  ),
  safetyRegulationPattern(
    'safety_regulation_002_body_safety',
    'The Body Safety Signal',
    ['somatic_safety'],
    ['tension_release', 'body_lightness', 'quiet_safety', 'low_stress'],
    'being overly sensitive',
    'the body recognizing safety before the mind fully explains it',
    'Body softening, release, or lightness may show safety arriving through the nervous system.',
    ['body', 'safety', 'release'],
  ),
  safetyRegulationPattern(
    'safety_regulation_003_numbness_or_calm',
    'Numbness or Calm',
    ['numbness_vs_calm'],
    ['emotional_heaviness', 'quiet_safety', 'calm_is_new', 'body_heaviness'],
    'not knowing how you feel',
    'the system learning the difference between shutdown and peace',
    'The archive may show a distinction forming between true calm and protective numbness.',
    ['numbness', 'calm', 'regulation'],
  ),
];
