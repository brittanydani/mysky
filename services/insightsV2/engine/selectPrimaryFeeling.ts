import {
  FEELING_SET_BY_KEY,
  type FeelingSetCopy,
  type FeelingSetKey,
} from '../feelingSets';
import { hasSignalRole } from '../signalTaxonomy';
import { sourcePriorityScore } from '../sourcePriority';
import type { SelectedFeelingSet, SignalKey, SignalSentiment, UserSignal } from '../types';

type SignalFeelingSetKey = Extract<SignalKey, FeelingSetKey>;

export const SIGNAL_TO_FEELING_SET_KEY: Partial<Record<SignalKey, FeelingSetKey>> = {
  abundance_healing: 'gratitude',
  appreciation_lands_slow_rest: 'appreciated',
  asks_why: 'curiosity',
  automatic_giving_need: 'resentment',
  awareness_hard_to_follow: 'frustration',
  beautiful_impractical_frustration: 'frustration',
  becoming_visible: 'awkward',
  belonging_ache: 'loneliness',
  body_aliveness_cues: 'desire',
  body_rest_before_responsibility: 'compassion',
  breath_change: 'anxiety',
  busy_mind_quiet_time: 'restlessness',
  calm_bracing: 'defensive',
  care_with_boundaries: 'compassion',
  capacity_changes_consistency_hard: 'frustration',
  boundary_guilt: 'guilt',
  capacity_strain: 'overwhelm',
  caretaking_pressure: 'pressured',
  chest_pressure: 'anxiety',
  chosen_support: 'compassion',
  closeness_uncertainty: 'uncertain',
  compliment_lands: 'appreciated',
  composed_still_tracking: 'defensive',
  connection_glimmer: 'seen',
  control_for_uncertainty: 'anxiety',
  conversation_replay: 'embarrassment',
  creative_aliveness: 'inspired',
  creative_block: 'frustration',
  current_moment_grounding: 'acceptance',
  depletion: 'drained',
  decision_uncertainty: 'uncertain',
  disappointment_reduces_certainty: 'disappointment',
  distance_for_safety: 'defensive',
  done_well_satisfaction: 'pride',
  downtime_not_restore: 'boredom',
  dream_searching: 'curiosity',
  earned_pleasure_relaxation: 'relief',
  emotional_heaviness: 'sadness',
  emotional_intensity: 'vulnerability',
  emotional_softening: 'relief',
  energy_scarcity: 'drained',
  enoughness: 'acceptance',
  envy_as_longing: 'jealousy',
  excellence_pressure: 'pressured',
  expression_execution_pride: 'pride',
  expression_need: 'desire',
  fear_of_being_too_much: 'insecurity',
  fear_of_loss: 'fear',
  feeling_not_visible: 'unseen',
  fine_to_what_if_shift: 'worry',
  flexibility_need: 'restlessness',
  future_preoccupation: 'anxiety',
  good_enough_acceptance: 'acceptance',
  good_enough_misaligned: 'frustration',
  gratitude_and_grief: 'grief',
  grounded_around_family_intensity: 'grounded',
  guard_not_dropped: 'defensive',
  guilt_for_not_stepping_in: 'guilt',
  grief_returns: 'grief',
  handling_trust_keeps_engaged: 'defensive',
  high_standards: 'inadequacy',
  high_energy: 'energized',
  high_stress: 'pressured',
  honesty_over_delivery: 'confidence',
  inner_critic_softening: 'compassion',
  integrity_cost: 'conflicted',
  impatient_processing: 'impatient',
  indebted_receiving_discomfort: 'awkward',
  kindness_safety_gap: 'suspicious',
  laughter_glimmer: 'joy',
  layered_relaxation: 'calm',
  legacy_signal: 'admiration',
  lets_endings_complete: 'acceptance',
  limits_tested: 'irritation',
  love_scarcity: 'longing',
  logical_trust_worry_frustration: 'frustration',
  low_capacity: 'drained',
  low_energy: 'exhaustion',
  low_pressure_motivation: 'boredom',
  low_mood: 'sadness',
  low_stress: 'calm',
  meaning_making: 'curiosity',
  minimizes_need: 'insecurity',
  mixed_emotions: 'conflicted',
  mood_drop: 'sadness',
  mood_improvement: 'relief',
  mutual_flow_safety: 'trust',
  mutuality_need: 'tenderness',
  nature_regulation: 'peace',
  needs_belong: 'included',
  numbness_vs_calm: 'numbness',
  obligation_resistance: 'frustration',
  old_guilt_after_new_response: 'regret',
  ongoing_high_distress: 'overwhelm',
  one_more_thing_loop: 'impatient',
  open_receiving: 'awkward',
  ordinary_downtime: 'boredom',
  ordinary_sacred: 'admiration',
  outward_settled_under_ready: 'defensive',
  overextension: 'overwhelm',
  pattern_recognition: 'curiosity',
  past_self_compassion: 'compassion',
  permission_shift: 'acceptance',
  physical_pause_mind_moving: 'restlessness',
  play_glimmer: 'joy',
  pleasure_after_completion: 'relief',
  pleasure_without_productivity: 'desire',
  prepared_steadiness: 'anticipation',
  preparedness: 'anticipation',
  progress_without_productivity_life: 'pride',
  protective_care: 'compassion',
  purpose_signal: 'inspired',
  quick_disruption_recovery: 'relief',
  quiet_emotional_change: 'conflicted',
  relationship_safety_testing: 'suspicious',
  repair_need: 'bitterness',
  receiving_care_difficulty: 'awkward',
  receiving_openness: 'acceptance',
  receives_but_exposed_need: 'awkward',
  relief_after_ending: 'relief',
  resists_reassurance_need: 'suspicious',
  resource_anxiety_only_with_reason: 'anxiety',
  responsibility_weight: 'pressured',
  rest_guilt: 'guilt',
  rest_awareness_frustration: 'frustration',
  rest_resistance: 'restlessness',
  restless_without_progress: 'restlessness',
  ritual_regulation: 'grounded',
  rupture_sensitivity: 'hurt',
  scarcity_scanning: 'worry',
  scattered_attention: 'scattered',
  self_forgiveness: 'compassion',
  self_blame: 'shame',
  self_doubt: 'doubt',
  separate_pattern_mixed: 'conflicted',
  selective_vulnerability: 'awkward',
  sensory_overload: 'overwhelm',
  shutdown: 'numbness',
  settled_then_returns_frustration: 'frustration',
  silence_neutral: 'indifferent',
  small_circle_pressure: 'unsupported',
  small_good_moments_matter: 'gratitude',
  somatic_safety: 'safe',
  stable_core_self: 'grounded',
  stable_self_continuity: 'acceptance',
  success_not_constant_output: 'pride',
  sustainable_care: 'compassion',
  support_too_much_fear: 'insecurity',
  support_abundance_shift: 'included',
  support_need: 'unsupported',
  support_reaches_inside: 'seen',
  support_scarcity: 'unsupported',
  consistency_need: 'rejected',
  tension_release: 'relief',
  tone_sensitivity: 'suspicious',
  transformation_season: 'anticipation',
  trust_builds_slowly: 'mistrust',
  truth_telling: 'confidence',
  rhythm_following_frustration: 'frustration',
  time_scarcity: 'pressured',
  unbraced_stillness: 'safe',
  unseen_deep_landing: 'unseen',
  valued_without_usefulness: 'love',
  values_conflict: 'conflicted',
  voice_emerging: 'confidence',
  wants_to_be_seen: 'unseen',
  wants_to_build: 'inspired',
};

const NEGATIVE_FEELING_SETS = new Set<FeelingSetKey>([
  'anger',
  'anxiety',
  'awkward',
  'bitterness',
  'confusion',
  'defensive',
  'disappointment',
  'disconnected',
  'disgust',
  'doubt',
  'drained',
  'embarrassment',
  'exhaustion',
  'fear',
  'frustration',
  'grief',
  'guilt',
  'helplessness',
  'hurt',
  'inadequacy',
  'insecurity',
  'irritation',
  'jealousy',
  'loneliness',
  'longing',
  'mistrust',
  'numbness',
  'overwhelm',
  'powerlessness',
  'regret',
  'rejected',
  'resentment',
  'restlessness',
  'sadness',
  'scattered',
  'shame',
  'stuck',
  'suspicious',
  'trapped',
  'uncertain',
  'unseen',
  'unsafe',
  'unsupported',
  'worry',
]);

const POSITIVE_FEELING_SETS = new Set<FeelingSetKey>([
  'acceptance',
  'admiration',
  'appreciated',
  'calm',
  'compassion',
  'confidence',
  'contentment',
  'curiosity',
  'energized',
  'gratitude',
  'grounded',
  'hope',
  'included',
  'inspired',
  'joy',
  'love',
  'peace',
  'pride',
  'relief',
  'safe',
  'seen',
  'tenderness',
  'trust',
]);

const MIXED_FEELING_SETS = new Set<FeelingSetKey>([
  'anticipation',
  'boredom',
  'conflicted',
  'desire',
  'indifferent',
  'impatient',
  'vulnerability',
]);

function isFeelingSetKey(key: SignalKey): key is SignalFeelingSetKey {
  return key in FEELING_SET_BY_KEY;
}

function feelingSetForSignal(key: SignalKey): FeelingSetCopy | null {
  if (isFeelingSetKey(key)) return FEELING_SET_BY_KEY[key];

  const mappedKey = SIGNAL_TO_FEELING_SET_KEY[key];
  return mappedKey ? FEELING_SET_BY_KEY[mappedKey] : null;
}

function selectReframeSentence(set: FeelingSetCopy): string {
  return set.sentences[9] ?? set.sentences[1] ?? set.sentences[0];
}

function feelingSetSentiment(
  setKey: FeelingSetKey,
  signalSentiment: SignalSentiment | undefined,
): SignalSentiment {
  if (NEGATIVE_FEELING_SETS.has(setKey)) return 'negative';
  if (POSITIVE_FEELING_SETS.has(setKey)) return 'positive';
  if (MIXED_FEELING_SETS.has(setKey)) return 'mixed';
  return signalSentiment ?? 'neutral';
}

function feelingCandidateScore(signal: UserSignal): number {
  const directFeelingMatch = isFeelingSetKey(signal.key) ? 0.16 : 0;
  const sourceScore = sourcePriorityScore(signal.source) * 0.14;

  return signal.strength * 0.7 + sourceScore + directFeelingMatch;
}

export function selectPrimaryFeeling(signals: UserSignal[]): SelectedFeelingSet | null {
  const candidates = signals
    .map((signal) => {
      const feelingSet = feelingSetForSignal(signal.key);
      if (!feelingSet) return null;

      const isFeelingSignal =
        hasSignalRole(signal, 'feeling_state') ||
        Boolean(SIGNAL_TO_FEELING_SET_KEY[signal.key]);

      if (!isFeelingSignal) return null;

      return {
        signal,
        feelingSet,
        score: feelingCandidateScore(signal),
      };
    })
    .filter((candidate): candidate is {
      signal: UserSignal;
      feelingSet: FeelingSetCopy;
      score: number;
    } => Boolean(candidate))
    .sort((a, b) => b.score - a.score);

  const selected = candidates[0];
  if (!selected) return null;

  return {
    key: selected.feelingSet.key,
    setNumber: selected.feelingSet.setNumber,
    title: selected.feelingSet.title,
    signalKey: selected.signal.key,
    sentiment: feelingSetSentiment(selected.feelingSet.key, selected.signal.sentiment),
    roles: selected.signal.roles ?? [],
    source: selected.signal.source,
    strength: selected.signal.strength,
    selectedSentence: selected.feelingSet.sentences[0],
    reframeSentence: selectReframeSentence(selected.feelingSet),
    sentences: selected.feelingSet.sentences,
    evidence: selected.signal.evidence,
  };
}
