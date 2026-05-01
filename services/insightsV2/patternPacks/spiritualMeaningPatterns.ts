import type { ArchivePattern, SignalKey } from '../types';

const spiritualMeaningPattern = (
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
  category: 'spiritualMeaning',
  description,
  requiredSignals,
  supportingSignals,
  shameLabel,
  clarityReframe,
  lookbackDays: 180,
  minEvidenceCount: 3,
  minScore: 0.56,
  cooldownDays: 14,
  tags,
});

export const SPIRITUAL_MEANING_PATTERNS: ArchivePattern[] = [
  spiritualMeaningPattern(
    'spiritual_meaning_001_faith_meaning',
    'Meaning as an Anchor',
    ['faith_meaning'],
    ['spiritual_depth', 'ordinary_sacred', 'meaning_making', 'hope'],
    'needing an explanation',
    'meaning acting as an anchor when life feels too wide to hold plainly',
    'Faith, meaning, or symbolic interpretation may help the user stay oriented through uncertainty.',
    ['meaning', 'faith', 'anchor'],
  ),
  spiritualMeaningPattern(
    'spiritual_meaning_002_sacred_ordinary',
    'The Sacred Ordinary',
    ['ordinary_sacred'],
    ['beauty_glimmer', 'gratitude_and_grief', 'spiritual_depth', 'enoughness'],
    'romanticizing small things',
    'depth recognizing meaning in the moments the world rushes past',
    'Ordinary moments may carry spiritual, symbolic, or emotional significance.',
    ['ordinary', 'sacred', 'beauty'],
  ),
  spiritualMeaningPattern(
    'spiritual_meaning_003_purpose_as_compass',
    'Purpose as a Compass',
    ['purpose_signal'],
    ['legacy_signal', 'faith_meaning', 'values_conflict', 'future_self_orientation'],
    'taking life too seriously',
    'purpose giving direction when the next step is not fully visible',
    'A sense of purpose may act as a compass during change, doubt, or decision pressure.',
    ['purpose', 'compass', 'direction'],
  ),
];
