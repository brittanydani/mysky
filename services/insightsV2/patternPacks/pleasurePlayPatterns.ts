import type { ArchivePattern, SignalKey } from '../types';

const pleasurePlayPattern = (
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
  category: 'pleasurePlay',
  description,
  requiredSignals,
  supportingSignals,
  shameLabel,
  clarityReframe,
  lookbackDays: 60,
  minEvidenceCount: 2,
  minScore: 0.5,
  cooldownDays: 7,
  tags,
});

export const PLEASURE_PLAY_PATTERNS: ArchivePattern[] = [
  pleasurePlayPattern(
    'pleasure_play_001_play_starved',
    'The Play-Starved Pattern',
    ['play_starved'],
    ['rest_resistance', 'overextension', 'creative_block', 'low_energy'],
    'being unserious',
    'aliveness asking for room that is not only useful',
    'The archive may show a need for play, delight, or unproductive aliveness after too much utility.',
    ['play', 'aliveness', 'utility'],
  ),
  pleasurePlayPattern(
    'pleasure_play_002_joy_tolerance',
    'Learning to Let Joy Stay',
    ['joy_tolerance'],
    ['play_glimmer', 'laughter_glimmer', 'fear_of_loss', 'calm_bracing'],
    'waiting for the other shoe to drop',
    'joy becoming safer to inhabit without immediately bracing',
    'Joy may be present but hard to fully trust when the system expects good moments to disappear.',
    ['joy', 'bracing', 'trust'],
  ),
  pleasurePlayPattern(
    'pleasure_play_003_beauty_as_aliveness',
    'Beauty as Aliveness',
    ['beauty_glimmer'],
    ['beauty_regulation', 'creative_aliveness', 'body_lightness', 'ordinary_sacred'],
    'being distracted by aesthetics',
    'beauty returning the system to felt aliveness',
    'Beauty, sensory pleasure, or delight may regulate the body and restore emotional aliveness.',
    ['beauty', 'pleasure', 'aliveness'],
  ),
];
