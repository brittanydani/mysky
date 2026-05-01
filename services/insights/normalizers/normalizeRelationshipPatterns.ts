import type { RelationshipPatternEntry } from '../selfKnowledgeContext';
import { SIGNALS } from '../signalDefinitions';
import { UserSignal } from '../types/knowledgeEngine';

const TAG_SIGNAL_MAP: Record<string, string[]> = {
  t1: [SIGNALS.HIGH_RESPONSIBILITY.key, SIGNALS.BOUNDARY_GROWTH.key],
  t2: [SIGNALS.REASSURANCE_NEED.key, SIGNALS.SUPPORT_SCARCITY.key],
  t3: [SIGNALS.MUTUALITY_NEED.key],
  t4: [SIGNALS.HIGH_RESPONSIBILITY.key, SIGNALS.SUPPORT_NEED.key],
  t5: [SIGNALS.OVEREXPLAINING.key, SIGNALS.NEED_FOR_EXACT_WORDS.key],
  t6: [SIGNALS.CALM_BRACING.key],
  t7: [SIGNALS.LONELINESS.key, SIGNALS.LOW_CAPACITY.key],
  t8: [SIGNALS.SUPPORT_SCARCITY.key, SIGNALS.FEAR_OF_BURDENING.key],
  t9: [SIGNALS.LOW_CAPACITY.key],
  t10: [SIGNALS.BOUNDARY_GROWTH.key, SIGNALS.CALM_BRACING.key],
  t11: [SIGNALS.CALM_BRACING.key],
  t12: [SIGNALS.BOUNDARY_GROWTH.key],
  t13: [SIGNALS.REASSURANCE_NEED.key],
  t14: [SIGNALS.SELF_BLAME.key],
  t15: [SIGNALS.REASSURANCE_NEED.key, SIGNALS.SUPPORT_SCARCITY.key],
  t16: [SIGNALS.FEAR_OF_BURDENING.key, SIGNALS.SELF_BLAME.key],
  t17: [SIGNALS.REASSURANCE_NEED.key, SIGNALS.SUPPORT_SCARCITY.key],
  t18: [SIGNALS.CALM_BRACING.key],
  t19: [SIGNALS.CALM_BRACING.key, SIGNALS.BOUNDARY_GROWTH.key],
  t20: [SIGNALS.LOW_CAPACITY.key],
  t21: [SIGNALS.MUTUALITY_NEED.key, SIGNALS.TRANSFORMATION.key],
  t22: [SIGNALS.CALM_BRACING.key, SIGNALS.REASSURANCE_NEED.key],
  t23: [SIGNALS.REASSURANCE_NEED.key, SIGNALS.NEED_FOR_EXACT_WORDS.key],
  t24: [SIGNALS.PATTERN_RECOGNITION.key, SIGNALS.CALM_BRACING.key],
  t25: [SIGNALS.REASSURANCE_NEED.key, SIGNALS.SELF_BLAME.key],
  t26: [SIGNALS.HIGH_RESPONSIBILITY.key, SIGNALS.LOW_CAPACITY.key],
  t27: [SIGNALS.INJUSTICE_SENSITIVITY.key, SIGNALS.TRANSFORMATION.key],
  s1: [SIGNALS.REASSURANCE_NEED.key, SIGNALS.SELF_TRUST_GROWTH.key],
  s2: [SIGNALS.SUPPORT_NEED.key, SIGNALS.SELF_TRUST_GROWTH.key],
  s3: [SIGNALS.MUTUALITY_NEED.key],
  s4: [SIGNALS.GLIMMER_QUIET_SAFETY.key],
  s5: [SIGNALS.SUPPORT_NEED.key],
  s6: [SIGNALS.BOUNDARY_GROWTH.key],
  s7: [SIGNALS.MUTUALITY_NEED.key, SIGNALS.TRANSFORMATION.key],
  s8: [SIGNALS.QUIET_AS_REPAIR.key],
  s9: [SIGNALS.CALM_BRACING.key, SIGNALS.SELF_TRUST_GROWTH.key],
  s10: [SIGNALS.SELF_TRUST_GROWTH.key],
};

const ACTIVATION_SIGNAL_MAP: Record<string, string[]> = {
  fear: [SIGNALS.REASSURANCE_NEED.key, SIGNALS.SUPPORT_SCARCITY.key],
  shame: [SIGNALS.SELF_BLAME.key],
  loneliness: [SIGNALS.LONELINESS.key, SIGNALS.SUPPORT_NEED.key],
  rejection: [SIGNALS.REASSURANCE_NEED.key],
  pressure: [SIGNALS.CALM_BRACING.key, SIGNALS.HIGH_RESPONSIBILITY.key],
  anger: [SIGNALS.INJUSTICE_SENSITIVITY.key],
  grief: [SIGNALS.TRANSFORMATION.key],
  confusion: [SIGNALS.NEED_FOR_EXACT_WORDS.key],
  tenderness: [SIGNALS.GLIMMER_QUIET_SAFETY.key],
  hope: [SIGNALS.SELF_TRUST_GROWTH.key],
};

const NEED_SIGNAL_MAP: Record<string, string[]> = {
  reassurance: [SIGNALS.REASSURANCE_NEED.key],
  space: [SIGNALS.BOUNDARY_GROWTH.key],
  clarity: [SIGNALS.NEED_FOR_EXACT_WORDS.key],
  comfort: [SIGNALS.SUPPORT_NEED.key],
  repair: [SIGNALS.MUTUALITY_NEED.key, SIGNALS.TRANSFORMATION.key],
  honesty: [SIGNALS.NEED_FOR_EXACT_WORDS.key],
  softness: [SIGNALS.GLIMMER_QUIET_SAFETY.key],
  boundaries: [SIGNALS.BOUNDARY_GROWTH.key],
  presence: [SIGNALS.SUPPORT_NEED.key],
  time: [SIGNALS.QUIET_AS_REPAIR.key],
};

const STATE_SIGNAL_MAP: Record<string, string[]> = {
  fight: [SIGNALS.CALM_BRACING.key, SIGNALS.INJUSTICE_SENSITIVITY.key],
  flight: [SIGNALS.CALM_BRACING.key, SIGNALS.REASSURANCE_NEED.key],
  freeze: [SIGNALS.LOW_CAPACITY.key],
  fawn: [SIGNALS.HIGH_RESPONSIBILITY.key, SIGNALS.BOUNDARY_GROWTH.key],
  secure: [SIGNALS.SELF_TRUST_GROWTH.key, SIGNALS.GLIMMER_QUIET_SAFETY.key],
};

const NOTE_SIGNAL_MAP: { key: string; terms: string[] }[] = [
  { key: SIGNALS.REASSURANCE_NEED.key, terms: ['reassurance', 'abandon', 'chosen', 'secure'] },
  { key: SIGNALS.MUTUALITY_NEED.key, terms: ['mutual', 'reciprocal', 'repair', 'connection', 'closeness'] },
  { key: SIGNALS.BOUNDARY_GROWTH.key, terms: ['boundary', 'boundaries', 'space', 'no ', 'limit'] },
  { key: SIGNALS.OVEREXPLAINING.key, terms: ['explain', 'over-explain', 'defend myself'] },
  { key: SIGNALS.LONELINESS.key, terms: ['lonely', 'alone', 'distant', 'withdraw'] },
  { key: SIGNALS.HIGH_RESPONSIBILITY.key, terms: ['caretake', 'responsible', 'carry', 'manage everyone'] },
];

function addSignal(
  signals: UserSignal[],
  entry: RelationshipPatternEntry,
  key: string,
  strength: number,
  label: string,
): void {
  signals.push({
    key,
    source: 'relationshipMirror',
    date: entry.date.slice(0, 10),
    strength,
    evidence: {
      source: 'relationshipMirror',
      date: entry.date.slice(0, 10),
      label,
    },
  });
}

export function normalizeRelationshipPatterns(entries: RelationshipPatternEntry[]): UserSignal[] {
  const signals: UserSignal[] = [];

  for (const entry of entries) {
    for (const tag of entry.tags ?? []) {
      const keys = TAG_SIGNAL_MAP[tag] ?? [];
      for (const key of keys) {
        addSignal(signals, entry, key, 0.75, tag);
      }
    }

    for (const activation of entry.activatedEmotions ?? []) {
      const keys = ACTIVATION_SIGNAL_MAP[activation] ?? [];
      for (const key of keys) {
        addSignal(signals, entry, key, 0.65, activation);
      }
    }

    for (const need of entry.needs ?? []) {
      const keys = NEED_SIGNAL_MAP[need] ?? [];
      for (const key of keys) {
        addSignal(signals, entry, key, 0.65, need);
      }
    }

    for (const state of [entry.stateBefore, entry.stateAfter]) {
      if (!state) continue;
      const keys = STATE_SIGNAL_MAP[state] ?? [];
      for (const key of keys) {
        addSignal(signals, entry, key, 0.55, state);
      }
    }

    const note = (entry.note ?? '').toLowerCase();
    for (const mapping of NOTE_SIGNAL_MAP) {
      const matched = mapping.terms.find((term) => note.includes(term));
      if (matched) {
        addSignal(signals, entry, mapping.key, 0.65, matched.trim());
      }
    }
  }

  return signals;
}
