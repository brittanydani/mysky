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

import type { SleepEntry } from '../storage/models';
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
  mixed:          '#C9AE78', // gold
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
 * Aggregate psychological signals from sleep entries.
 * Pass up to 90 recent entries for a meaningful tension map.
 */
export function computeInnerTensions(sleepEntries: SleepEntry[]): InnerTensionsData {
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
    dataQuality: { totalEntries, entriesWithFeelings, entriesWithText },
    nsConflict,
    nsProfile,
    nsBranchForces,
    ambivalence,
    topTriggers,
    dreamPatterns,
  };
}
