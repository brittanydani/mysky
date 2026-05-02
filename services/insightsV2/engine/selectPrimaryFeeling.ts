import {
  FEELING_SET_BY_KEY,
  type FeelingSetCopy,
  type FeelingSetKey,
} from '../feelingSets';
import { hasSignalRole } from '../signalTaxonomy';
import { sourcePriorityScore } from '../sourcePriority';
import type { SelectedFeelingSet, SignalKey, SignalSentiment, UserSignal } from '../types';

type SignalFeelingSetKey = Extract<SignalKey, FeelingSetKey>;

const SIGNAL_TO_FEELING_SET: Partial<Record<SignalKey, FeelingSetKey>> = {
  belonging_ache: 'loneliness',
  boundary_guilt: 'guilt',
  capacity_strain: 'overwhelm',
  depletion: 'drained',
  decision_uncertainty: 'uncertain',
  emotional_heaviness: 'sadness',
  emotional_intensity: 'vulnerability',
  emotional_softening: 'relief',
  energy_scarcity: 'drained',
  envy_as_longing: 'jealousy',
  fear_of_being_too_much: 'insecurity',
  fear_of_loss: 'fear',
  gratitude_and_grief: 'grief',
  grief_returns: 'grief',
  guilt_for_not_stepping_in: 'guilt',
  high_energy: 'energized',
  high_stress: 'pressured',
  love_scarcity: 'longing',
  low_capacity: 'drained',
  low_energy: 'exhaustion',
  low_mood: 'sadness',
  mixed_emotions: 'conflicted',
  mood_drop: 'sadness',
  mood_improvement: 'relief',
  ongoing_high_distress: 'overwhelm',
  overextension: 'overwhelm',
  quiet_emotional_change: 'conflicted',
  rest_guilt: 'guilt',
  rest_resistance: 'restlessness',
  rupture_sensitivity: 'hurt',
  scarcity_scanning: 'worry',
  scattered_attention: 'scattered',
  self_blame: 'shame',
  self_doubt: 'doubt',
  sensory_overload: 'overwhelm',
  shutdown: 'numbness',
  support_too_much_fear: 'insecurity',
  support_need: 'unsupported',
  support_scarcity: 'unsupported',
  time_scarcity: 'pressured',
  unseen_deep_landing: 'unseen',
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

  const mappedKey = SIGNAL_TO_FEELING_SET[key];
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
        Boolean(SIGNAL_TO_FEELING_SET[signal.key]);

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
