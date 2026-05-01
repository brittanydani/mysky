import type { ArchivePattern, SignalKey } from '../types';

const lifeDirectionPattern = (
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
  category: 'lifeDirection',
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

export const LIFE_DIRECTION_PATTERNS: ArchivePattern[] = [
  lifeDirectionPattern(
    'life_direction_001_future_self',
    'The Future Self Signal',
    ['future_self_orientation'],
    ['purpose_signal', 'wants_to_build', 'self_definition', 'growth_edge'],
    'being dissatisfied with now',
    'a future version of you beginning to give the present instructions',
    'The user may repeatedly sense a future self, direction, or next chapter asking for attention.',
    ['future-self', 'direction', 'growth'],
  ),
  lifeDirectionPattern(
    'life_direction_002_decision_fog',
    'The Decision Fog',
    ['decision_uncertainty'],
    ['seeks_context', 'values_conflict', 'clarity_before_release', 'chapter_shift'],
    'being indecisive',
    'a choice needing enough context to become honest',
    'Uncertainty may show up where the choice carries identity, values, or future consequences.',
    ['decision', 'uncertainty', 'context'],
  ),
  lifeDirectionPattern(
    'life_direction_003_life_reorientation',
    'The Life Reorientation Pattern',
    ['identity_rewriting'],
    ['chapter_shift', 'old_story_loosening', 'transformation_season', 'purpose_signal'],
    'starting over',
    'life reorganizing around a truer center',
    'Identity rewriting may point to a broader reorientation in direction, priorities, or self-definition.',
    ['reorientation', 'identity', 'purpose'],
  ),
];
