/**
 * innerTensionsEngine.ts
 *
 * Aggregates psychological signals across all sleep entries to produce the
 * "Inner Tensions" screen data. Blends four engines that previously had no
 * dedicated UI: nervousSystemConflict, ambivalenceEngine, dreamPatternEngine,
 * and triggerTaxonomy.
 *
 * All computation is local and deterministic. No network calls.
 */

import type { SleepEntry, JournalEntry } from '../storage/models';
import type { DailyCheckIn } from '../patterns/types';
import type { TriggerEvent } from '../../utils/triggerEventTypes';
import {
  FEELING_MAP,
  type DreamMetadata,
  type NervousSystemBranch,
  type SelectedFeeling,
  type ShadowTrigger,
} from './dreamTypes';
import { detectAmbivalence, type AmbivalenceResult } from './ambivalenceEngine';
import { detectNervousSystemConflict, type NervousConflict } from './nervousSystemConflict';
import { analyzeDreamPattern, type DreamPattern } from './dreamPatternEngine';
import { computeDreamAggregates } from './dreamAggregates';

// ─── Display Maps ─────────────────────────────────────────────────────────────

export const NS_BRANCH_COLORS: Record<NervousSystemBranch, string> = {
  ventral_safety: '#8CBEAA', // sage green
  fight:          '#D4826A', // coral
  flight:         '#A89BC8', // lavender
  freeze:         '#6BAED6', // clear blue (distinct from lavender)
  collapse:       '#C8A4A4', // muted rose
  mixed:          '#D4AF37', // gold
};

export const NS_BRANCH_LABELS: Record<NervousSystemBranch, string> = {
  ventral_safety: 'Safety',
  fight:          'Fight',
  flight:         'Flight',
  freeze:         'Freeze',
  collapse:       'Collapse',
  mixed:          'Mixed',
};

export const NS_STATE_FULL_LABELS: Record<NervousSystemBranch, string> = {
  ventral_safety: 'Safe & Connected',
  fight:          'Fight Activation',
  flight:         'Flight Anxiety',
  freeze:         'Freeze Response',
  collapse:       'Collapse',
  mixed:          'Mixed States',
};

export const NS_STATE_DESCRIPTIONS: Record<NervousSystemBranch, string> = {
  ventral_safety: 'regulation · connection · presence',
  fight:          'boundary activation · power · anger',
  flight:         'avoidance · anxiety · urgency',
  freeze:         'shutdown · overwhelm · voicelessness',
  collapse:       'hopelessness · depletion · grief',
  mixed:          'inner conflict · dual activation',
};

export const TRIGGER_DISPLAY: Record<ShadowTrigger, string> = {
  abandonment:       'Abandonment',
  rejection:         'Rejection',
  betrayal:          'Betrayal',
  shame:             'Shame',
  exposure:          'Exposure',
  control:           'Control',
  power:             'Power',
  helplessness:      'Helplessness',
  danger:            'Danger',
  intimacy:          'Intimacy',
  sexuality:         'Sexuality',
  consent_violation: 'Consent',
  worthiness:        'Worthiness',
  responsibility:    'Responsibility',
  failure:           'Failure',
  grief:             'Grief',
  identity:          'Identity',
  belonging:         'Belonging',
  unpredictability:  'Unpredictability',
  punishment:        'Punishment',
  isolation:         'Isolation',
  transformation:    'Transformation',
};

const PATTERN_LABELS: Record<DreamPattern, string> = {
  exposure:       'Exposure & Vulnerability',
  boundary:       'Boundary Tension',
  authority:      'Authority Presence',
  pursuit:        'Pursuit & Threat',
  lost:           'Lost Within',
  performance:    'Performance & Judgment',
  connection:     'Longing for Connection',
  conflict:       'Inner Conflict',
  caretaking:     'Protective Instinct',
  transformation: 'Threshold of Change',
  house_self:     'Inner House',
  stuck:          'Repetition & Stuckness',
};

const NS_BRANCH_KEYS: NervousSystemBranch[] = [
  'collapse', 'fight', 'flight', 'freeze', 'ventral_safety', 'mixed',
];

// ─── Journal mood → NS branch signal ─────────────────────────────────────────
// Weight is lower (0.6) than dream feelings (1.0) since mood is a single
// coarse-grained signal rather than a curated multi-feeling selection.
const JOURNAL_MOOD_NS: Record<
  JournalEntry['mood'],
  { branch: NervousSystemBranch; triggers: ShadowTrigger[]; weight: number }
> = {
  calm:   { branch: 'ventral_safety', triggers: ['belonging', 'identity'],                  weight: 0.6 },
  soft:   { branch: 'ventral_safety', triggers: ['transformation', 'worthiness'],            weight: 0.5 },
  okay:   { branch: 'mixed',          triggers: [],                                          weight: 0.3 },
  heavy:  { branch: 'collapse',       triggers: ['grief', 'worthiness', 'helplessness'],     weight: 0.7 },
  stormy: { branch: 'fight',          triggers: ['control', 'unpredictability', 'power'],    weight: 0.8 },
};

// ─── Daily check-in eq_* tag → NS branch ────────────────────────────────────
// Base weight 0.45 — check-ins are frequent but mood is a single point-in-time
// coarse signal, lighter than a full dream feeling set.
const CHECKIN_EQ_TAG_NS: Record<string, { branch: NervousSystemBranch; weight: number }> = {
  eq_calm:         { branch: 'ventral_safety', weight: 0.5 },
  eq_grounded:     { branch: 'ventral_safety', weight: 0.55 },
  eq_hopeful:      { branch: 'ventral_safety', weight: 0.45 },
  eq_focused:      { branch: 'ventral_safety', weight: 0.4 },
  eq_open:         { branch: 'ventral_safety', weight: 0.45 },
  eq_anxious:      { branch: 'flight',         weight: 0.6 },
  eq_scattered:    { branch: 'flight',         weight: 0.5 },
  eq_irritable:    { branch: 'fight',          weight: 0.6 },
  eq_disconnected: { branch: 'freeze',         weight: 0.55 },
  eq_heavy:        { branch: 'collapse',       weight: 0.65 },
};

// ─── Daily check-in moodScore (1-10) → NS branch ─────────────────────────────
function moodScoreToNS(score: number): { branch: NervousSystemBranch; weight: number } {
  if (score <= 2) return { branch: 'collapse',       weight: 0.5 };
  if (score <= 4) return { branch: 'freeze',         weight: 0.45 };
  if (score <= 6) return { branch: 'mixed',          weight: 0.35 };
  if (score <= 8) return { branch: 'ventral_safety', weight: 0.45 };
  return               { branch: 'ventral_safety', weight: 0.55 };
}

// ─── Daily check-in stressLevel → NS branch ──────────────────────────────────
const CHECKIN_STRESS_NS: Record<string, { branch: NervousSystemBranch; weight: number }> = {
  low:    { branch: 'ventral_safety', weight: 0.4 },
  medium: { branch: 'mixed',          weight: 0.3 },
  high:   { branch: 'fight',          weight: 0.55 },
};

// ─── Daily check-in theme tag → shadow triggers ───────────────────────────────
const CHECKIN_TAG_TRIGGERS: Record<string, ShadowTrigger[]> = {
  anxiety:      ['danger', 'unpredictability'],
  grief:        ['grief', 'abandonment'],
  conflict:     ['control', 'power'],
  loneliness:   ['isolation', 'abandonment'],
  overwhelm:    ['helplessness', 'responsibility'],
  boundaries:   ['control', 'rejection'],
  relationships:['intimacy', 'belonging'],
  family:       ['belonging', 'abandonment'],
  intimacy:     ['intimacy'],
  career:       ['failure', 'responsibility'],
  health:       ['helplessness', 'identity'],
  money:        ['failure', 'helplessness'],
  confidence:   ['worthiness', 'exposure'],
};

// ─── Trigger log NSState → NS branch ─────────────────────────────────────────
// drain = activating/distressing event → stressed branch
// nourish (glimmer) = regulating/positive → ventral_safety
function triggerEventToNS(
  nsState: TriggerEvent['nsState'],
  mode: TriggerEvent['mode'],
  intensity: TriggerEvent['intensity'],
): { branch: NervousSystemBranch; weight: number } | null {
  const baseWeight = 0.5 + ((intensity ?? 3) - 1) * 0.1; // 0.5–0.9
  if (mode === 'nourish') {
    return { branch: 'ventral_safety', weight: baseWeight * 0.7 };
  }
  switch (nsState) {
    case 'sympathetic': return { branch: 'fight',          weight: baseWeight };
    case 'dorsal':      return { branch: 'collapse',       weight: baseWeight };
    case 'ventral':     return { branch: 'ventral_safety', weight: baseWeight * 0.6 };
    case 'still':       return { branch: 'ventral_safety', weight: baseWeight * 0.5 };
    default:            return null;
  }
}

// ─── Journal tag id → extra trigger hints ────────────────────────────────────
const TAG_TRIGGER_MAP: Record<string, ShadowTrigger[]> = {
  anxiety:      ['danger', 'unpredictability'],
  anger:        ['control', 'power'],
  grief:        ['grief', 'abandonment'],
  shame:        ['shame', 'worthiness'],
  fear:         ['danger', 'helplessness'],
  betrayal:     ['betrayal', 'rejection'],
  loneliness:   ['isolation', 'abandonment'],
  identity:     ['identity', 'belonging'],
  boundaries:   ['control', 'rejection'],
  growth:       ['transformation'],
  healing:      ['transformation', 'worthiness'],
  relationships:['intimacy', 'belonging'],
  family:       ['belonging', 'abandonment'],
  work:         ['failure', 'responsibility'],
  body:         ['shame', 'identity'],
};

const FALLBACK_METADATA: DreamMetadata = {
  vividness: 3,
  lucidity: 1,
  controlLevel: 3,
  awakenState: 'calm',
  recurring: false,
};

// ─── Output Types ─────────────────────────────────────────────────────────────

export type PatternSummary = {
  pattern: DreamPattern;
  label: string;
  count: number;
  topConfidence: number;
};

export type InnerTensionsData = {
  dataQuality: {
    totalEntries: number;
    entriesWithFeelings: number;
    entriesWithText: number;
  };
  nsConflict: NervousConflict;
  nsProfile: Partial<Record<NervousSystemBranch, number>>;
  /** Ready to pass directly to PsychologicalForcesRadar */
  nsBranchForces: { label: string; value: number; color: string }[];
  ambivalence: AmbivalenceResult;
  topTriggers: { trigger: ShadowTrigger; score: number }[];
  dreamPatterns: PatternSummary[];
};

// ─── Engine ───────────────────────────────────────────────────────────────────

/**
 * Aggregate psychological signals from sleep entries, journal entries,
 * daily check-ins, and trigger log events.
 * Pass up to 90 recent entries of each type for a meaningful tension map.
 */
export function computeInnerTensions(
  sleepEntries: SleepEntry[],
  journalEntries: JournalEntry[] = [],
  checkIns: DailyCheckIn[] = [],
  triggerEvents: TriggerEvent[] = [],
): InnerTensionsData {
  const totalEntries = sleepEntries.length;

  const aggNS: Record<NervousSystemBranch, number> = {
    ventral_safety: 0, fight: 0, flight: 0, freeze: 0, collapse: 0, mixed: 0,
  };
  const aggTriggers: Record<ShadowTrigger, number> = {
    abandonment: 0, rejection: 0, betrayal: 0, shame: 0, exposure: 0,
    control: 0, power: 0, helplessness: 0, danger: 0, intimacy: 0,
    sexuality: 0, consent_violation: 0, worthiness: 0, responsibility: 0,
    failure: 0, grief: 0, identity: 0, belonging: 0, unpredictability: 0,
    punishment: 0, isolation: 0, transformation: 0,
  };

  let entriesWithFeelings = 0;
  let entriesWithText = 0;
  let totalWeight = 0;

  const patternCounts: Partial<Record<DreamPattern, { count: number; topConfidence: number }>> = {};

  for (const entry of sleepEntries) {
    if (entry.dreamText) entriesWithText++;

    let feelings: SelectedFeeling[] = [];
    if (entry.dreamFeelings) {
      try {
        const parsed = JSON.parse(entry.dreamFeelings) as SelectedFeeling[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          feelings = parsed;
          entriesWithFeelings++;
        }
      } catch { /* skip malformed */ }
    }

    // Accumulate NS branch + trigger weights from dream feelings
    for (const sel of feelings) {
      const def = FEELING_MAP[sel.id];
      if (!def || sel.intensity <= 0) continue;
      const w = sel.intensity;
      totalWeight += w;
      aggNS[def.primaryBranch] += w;
      for (const t of def.shadowTriggers) {
        aggTriggers[t] += w;
      }
    }

    // Dream pattern recognition (text-based, higher signal than feelings alone)
    if (entry.dreamText) {
      let metadata: DreamMetadata = FALLBACK_METADATA;
      if (entry.dreamMetadata) {
        try { metadata = JSON.parse(entry.dreamMetadata) as DreamMetadata; } catch { /* skip */ }
      }
      const aggregates = computeDreamAggregates(feelings, null);
      const seed = entry.id ? entry.id.charCodeAt(0) : 42;
      // keywordMatches=[] — pattern engine extracts features from text directly
      const result = analyzeDreamPattern(entry.dreamText, [], feelings, metadata, aggregates, seed);
      if (result) {
        const p = result.primaryPattern;
        if (!patternCounts[p]) patternCounts[p] = { count: 0, topConfidence: 0 };
        patternCounts[p]!.count++;
        patternCounts[p]!.topConfidence = Math.max(patternCounts[p]!.topConfidence, result.confidence);
      }
    }
  }

  // ── Process journal entries ───────────────────────────────────────────────
  for (const entry of journalEntries) {
    const moodSignal = JOURNAL_MOOD_NS[entry.mood];
    if (!moodSignal) continue;

    const w = moodSignal.weight;
    totalWeight += w;
    aggNS[moodSignal.branch] += w;
    for (const t of moodSignal.triggers) {
      aggTriggers[t] += w;
    }

    // Tag-based trigger hints (smaller weight)
    for (const tag of entry.tags ?? []) {
      const tagTriggers = TAG_TRIGGER_MAP[tag];
      if (!tagTriggers) continue;
      for (const t of tagTriggers) {
        aggTriggers[t] += w * 0.4;
      }
    }
  }

  // ── Process daily check-ins ─────────────────────────────────────────────────
  for (const ci of checkIns) {
    // moodScore signal
    const moodSig = moodScoreToNS(ci.moodScore);
    totalWeight += moodSig.weight;
    aggNS[moodSig.branch] += moodSig.weight;

    // stressLevel signal
    const stressSig = CHECKIN_STRESS_NS[ci.stressLevel];
    if (stressSig) {
      totalWeight += stressSig.weight;
      aggNS[stressSig.branch] += stressSig.weight;
    }

    // eq_* tags → direct NS branch signals
    for (const tag of ci.tags) {
      const eqSig = CHECKIN_EQ_TAG_NS[tag as string];
      if (eqSig) {
        totalWeight += eqSig.weight;
        aggNS[eqSig.branch] += eqSig.weight;
      }
      // theme tags → trigger hints
      const trigHints = CHECKIN_TAG_TRIGGERS[tag as string];
      if (trigHints) {
        const w = moodSig.weight * 0.4;
        for (const t of trigHints) aggTriggers[t] += w;
      }
    }
  }

  // ── Process trigger log events ─────────────────────────────────────────────
  for (const ev of triggerEvents) {
    const sig = triggerEventToNS(ev.nsState, ev.mode, ev.intensity);
    if (!sig) continue;
    totalWeight += sig.weight;
    aggNS[sig.branch] += sig.weight;
  }

  // ── Normalize NS profile ──────────────────────────────────────────────────
  const nsProfile: Partial<Record<NervousSystemBranch, number>> = {};
  if (totalWeight > 0) {
    for (const branch of NS_BRANCH_KEYS) {
      if (aggNS[branch] > 0) nsProfile[branch] = aggNS[branch] / totalWeight;
    }
  }

  // ── Normalize trigger scores (relative to max) ────────────────────────────
  const maxTrigger = Math.max(0, ...Object.values(aggTriggers));
  const triggerScores: Partial<Record<ShadowTrigger, number>> = {};
  if (maxTrigger > 0) {
    for (const [t, score] of Object.entries(aggTriggers) as [ShadowTrigger, number][]) {
      if (score > 0) triggerScores[t] = score / maxTrigger;
    }
  }

  // ── Run engines ───────────────────────────────────────────────────────────
  const nsConflict   = detectNervousSystemConflict(nsProfile);
  const ambivalence  = detectAmbivalence(triggerScores);

  // ── Build radar forces (NS branches as spokes) ────────────────────────────
  const nsBranchForces = NS_BRANCH_KEYS.map(branch => ({
    label: NS_BRANCH_LABELS[branch],
    value: Math.round((nsProfile[branch] ?? 0) * 100),
    color: NS_BRANCH_COLORS[branch],
  }));

  // ── Top triggers (score > 0.2, up to 5) ──────────────────────────────────
  const topTriggers = (Object.entries(triggerScores) as [ShadowTrigger, number][])
    .filter(([, s]) => s > 0.2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([trigger, score]) => ({ trigger, score }));

  // ── Dream patterns (sorted by frequency, up to 4) ────────────────────────
  const dreamPatterns: PatternSummary[] = (
    Object.entries(patternCounts) as [DreamPattern, { count: number; topConfidence: number }][]
  )
    .sort((a, b) => b[1].count - a[1].count || b[1].topConfidence - a[1].topConfidence)
    .slice(0, 4)
    .map(([pattern, data]) => ({
      pattern,
      label: PATTERN_LABELS[pattern],
      count: data.count,
      topConfidence: data.topConfidence,
    }));

  return {
    dataQuality: { totalEntries: totalEntries + journalEntries.length + checkIns.length + triggerEvents.length, entriesWithFeelings, entriesWithText },
    nsConflict,
    nsProfile,
    nsBranchForces,
    ambivalence,
    topTriggers,
    dreamPatterns,
  };
}
