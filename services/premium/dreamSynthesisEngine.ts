// dreamSynthesisEngine.ts
// Multi-signal scoring engine for dream interpretation.
//
// Blends five signal sources into unified trigger scores + dominant profiles:
//   Wf = 0.60  Feelings (user-selected emotions + intensity)
//   Wt = 0.20  Text signals (regex-based phrase extraction)
//   Wc = 0.10  Check-ins (recent mood, energy, tags)
//   Wh = 0.07  History (recurring feelings, trends)
//   Wp = 0.03  Personality (nervous system / attachment baseline)
//
// Output is deterministic per input. No network calls, no AI.
//
// Re-exports core types from dreamTypes.ts for downstream consumers.

import type {
  AttachmentStyle,
  DreamFeelingDef,
  NervousSystemBranch,
  SelectedFeeling,
  ShadowTrigger,
} from './dreamTypes';
import { FEELING_MAP } from './dreamTypes';
import { detectAmbivalence, type AmbivalenceResult } from './ambivalenceEngine';
import { detectNervousSystemConflict, type NervousConflict } from './nervousSystemConflict';
import { inferDefaultsFromTriggers, getTriggerTaxonomy } from './triggerTaxonomy';

// ─── Re-exports for downstream consumers ──────────────────────────────────────
export type {
  AttachmentStyle as AttachmentTone,
  DreamFeelingDef as FeelingDefinition,
  NervousSystemBranch,
  SelectedFeeling,
  ShadowTrigger,
} from './dreamTypes';

// ─── Engine Input / Output Types ──────────────────────────────────────────────

export type PersonalityProcessingProfile = {
  nervousSystem?: Partial<Record<NervousSystemBranch, number>>;
  attachment?: Partial<Record<AttachmentStyle, number>>;
};

export type TextSignalsInput = {
  coverage: number; // 0..1
  triggers: Partial<Record<ShadowTrigger, number>>; // 0..1
};

export type CheckInSignalsInput = {
  completeness: number; // 0..1
  triggers?: Partial<Record<ShadowTrigger, number>>;
  nervousSystem?: Partial<Record<NervousSystemBranch, number>>;
};

export type HistorySignalsInput = {
  completeness: number; // 0..1
  recurring: boolean;
  recurrenceStrength: number; // 0..1
  triggers?: Partial<Record<ShadowTrigger, number>>;
};

export type EngineInput = {
  selectedFeelings: SelectedFeeling[];
  feelingDefs: DreamFeelingDef[];
  textSignals?: TextSignalsInput;
  checkInSignals?: CheckInSignalsInput;
  historySignals?: HistorySignalsInput;
  personalityProfile?: PersonalityProcessingProfile;
  supportedTriggers?: ShadowTrigger[];
};

export type TopTheme = {
  trigger: ShadowTrigger;
  score: number; // 0..1, blended
  sources: {
    feelings: number;
    text: number;
    checkIn: number;
    history: number;
    personality: number;
  };
};

export type DominantProfiles = {
  valenceScore: number; // -1..1
  activationAvg: number; // 1..3
  attachmentProfile: Partial<Record<AttachmentStyle, number>>;
  nervousSystemProfile: Partial<Record<NervousSystemBranch, number>>;
};

export type ConfidenceResult = {
  score: number; // 0..1
  level: 'Low' | 'Medium' | 'High';
  reasons: string[];
};

export type PatternFlags = {
  recurring: boolean;
  escalating: boolean;
  compensatory: boolean;
  alignedWithRecent: boolean;
  ambivalent: boolean;
  nervousConflict: boolean;
};

export type EngineOutput = {
  topThemes: TopTheme[];
  dominant: DominantProfiles;
  confidence: ConfidenceResult;
  patternFlags: PatternFlags;
  ambivalence: AmbivalenceResult;
  nervousConflict: NervousConflict;
  weights: typeof DEFAULT_WEIGHTS;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL_TRIGGERS: ShadowTrigger[] = [
  'abandonment', 'rejection', 'betrayal', 'shame', 'exposure', 'control',
  'power', 'helplessness', 'danger', 'intimacy', 'sexuality', 'consent_violation',
  'worthiness', 'responsibility', 'failure', 'grief', 'identity', 'belonging',
  'unpredictability', 'punishment', 'isolation', 'transformation',
];

const DEFAULT_WEIGHTS = {
  feelings: 0.60,
  text: 0.20,
  checkIn: 0.10,
  history: 0.07,
  personality: 0.03,
} as const;

const ALL_NERVOUS_BRANCHES: NervousSystemBranch[] = [
  'ventral_safety', 'fight', 'flight', 'freeze', 'collapse', 'mixed',
];

const ALL_ATTACHMENT_STYLES: AttachmentStyle[] = [
  'secure', 'anxious', 'avoidant', 'disorganized',
];

// ─── Utilities ────────────────────────────────────────────────────────────────

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function normalize(obj: Record<string, number>): Record<string, number> {
  const total = Object.values(obj).reduce((a, b) => a + b, 0);
  if (total === 0) return { ...obj };
  const result: Record<string, number> = {};
  for (const [k, v] of Object.entries(obj)) {
    result[k] = v / total;
  }
  return result;
}

// ─── Feelings Scoring ─────────────────────────────────────────────────────────

function scoreFeelings(
  feelings: SelectedFeeling[],
  feelingDefs: DreamFeelingDef[],
): {
  triggers: Record<ShadowTrigger, number>;
  nervousSystem: Record<NervousSystemBranch, number>;
  attachment: Record<AttachmentStyle, number>;
  valence: number;
  activation: number;
} {
  const defMap: Record<string, DreamFeelingDef> = {};
  for (const d of feelingDefs) defMap[d.id] = d;
  // Also merge in the canonical FEELING_MAP
  for (const [k, v] of Object.entries(FEELING_MAP)) {
    if (!defMap[k]) defMap[k] = v;
  }

  const triggers: Record<ShadowTrigger, number> = {} as Record<ShadowTrigger, number>;
  for (const t of ALL_TRIGGERS) triggers[t] = 0;

  const nervousSystem: Record<NervousSystemBranch, number> = {} as Record<NervousSystemBranch, number>;
  for (const b of ALL_NERVOUS_BRANCHES) nervousSystem[b] = 0;

  const attachment: Record<AttachmentStyle, number> = {} as Record<AttachmentStyle, number>;
  for (const a of ALL_ATTACHMENT_STYLES) attachment[a] = 0;

  let totalWeight = 0;
  let weightedValence = 0;
  let weightedActivation = 0;

  for (const sel of feelings) {
    const def = defMap[sel.id ?? (sel as any).feelingId];
    if (!def) continue;
    const intensity = clamp(sel.intensity ?? 0, 0, 5);
    if (intensity <= 0) continue;

    totalWeight += intensity;
    weightedValence += def.valence * intensity;
    weightedActivation += def.activation * intensity;

    nervousSystem[def.primaryBranch] += intensity;
    attachment[def.attachmentSignal] += intensity;

    for (const t of def.shadowTriggers) {
      triggers[t] += intensity;
    }
  }

  // Normalize triggers to 0..1
  const maxTrigger = Math.max(...Object.values(triggers), 1);
  for (const t of ALL_TRIGGERS) {
    triggers[t] = triggers[t] / maxTrigger;
  }

  const valence = totalWeight > 0 ? weightedValence / totalWeight : 0;
  const activation = totalWeight > 0 ? weightedActivation / totalWeight : 0;

  return {
    triggers,
    nervousSystem: normalize(nervousSystem) as Record<NervousSystemBranch, number>,
    attachment: normalize(attachment) as Record<AttachmentStyle, number>,
    valence: clamp(valence, -1, 1),
    activation: clamp(activation, 0, 1),
  };
}

// ─── Blending ─────────────────────────────────────────────────────────────────

function blendTriggerScores(
  feelingTriggers: Record<ShadowTrigger, number>,
  textSignals: TextSignalsInput | undefined,
  checkIn: CheckInSignalsInput | undefined,
  history: HistorySignalsInput | undefined,
  personality: PersonalityProcessingProfile | undefined,
  weights: typeof DEFAULT_WEIGHTS,
): TopTheme[] {
  const textReliability = textSignals?.coverage ?? 0;
  const checkInReliability = checkIn?.completeness ?? 0;
  const historyReliability = history?.completeness ?? 0;

  const themes: TopTheme[] = [];

  for (const trigger of ALL_TRIGGERS) {
    const fScore = feelingTriggers[trigger] ?? 0;
    const tScore = (textSignals?.triggers?.[trigger] ?? 0) * textReliability;
    const cScore = (checkIn?.triggers?.[trigger] ?? 0) * checkInReliability;
    const hScore = (history?.triggers?.[trigger] ?? 0) * historyReliability;
    const pScore = 0; // personality doesn't map directly to triggers

    const blended =
      weights.feelings * fScore +
      weights.text * tScore +
      weights.checkIn * cScore +
      weights.history * hScore +
      weights.personality * pScore;

    if (blended > 0.01) {
      themes.push({
        trigger,
        score: clamp(blended, 0, 1),
        sources: {
          feelings: fScore,
          text: tScore,
          checkIn: cScore,
          history: hScore,
          personality: pScore,
        },
      });
    }
  }

  // Boost recurring triggers
  if (history?.recurring) {
    for (const t of themes) {
      const histTrigger = history?.triggers?.[t.trigger] ?? 0;
      if (histTrigger > 0.3) {
        t.score = clamp(t.score + 0.05 * history.recurrenceStrength, 0, 1);
      }
    }
  }

  return themes.sort((a, b) => b.score - a.score);
}

// ─── Dominant Profile Builder ─────────────────────────────────────────────────

function buildDominantProfiles(
  feelingResult: ReturnType<typeof scoreFeelings>,
  checkIn: CheckInSignalsInput | undefined,
  personality: PersonalityProcessingProfile | undefined,
): DominantProfiles {
  // Blend nervous system from feelings + checkIn + personality
  const nsProfile: Record<string, number> = {};
  for (const b of ALL_NERVOUS_BRANCHES) {
    nsProfile[b] =
      0.70 * (feelingResult.nervousSystem[b] ?? 0) +
      0.20 * (checkIn?.nervousSystem?.[b] ?? 0) +
      0.10 * (personality?.nervousSystem?.[b] ?? 0);
  }

  // Blend attachment from feelings + personality
  const attProfile: Record<string, number> = {};
  for (const a of ALL_ATTACHMENT_STYLES) {
    attProfile[a] =
      0.85 * (feelingResult.attachment[a] ?? 0) +
      0.15 * (personality?.attachment?.[a] ?? 0);
  }

  // Map activation 0..1 to 1..3
  const activationAvg = 1 + feelingResult.activation * 2;

  return {
    valenceScore: feelingResult.valence,
    activationAvg,
    attachmentProfile: normalize(attProfile) as Partial<Record<AttachmentStyle, number>>,
    nervousSystemProfile: normalize(nsProfile) as Partial<Record<NervousSystemBranch, number>>,
  };
}

// ─── Confidence ───────────────────────────────────────────────────────────────

function computeConfidence(
  feelings: SelectedFeeling[],
  textSignals: TextSignalsInput | undefined,
  topThemes: TopTheme[],
): ConfidenceResult {
  const reasons: string[] = [];
  let score = 0;

  // Feeling signal quality
  const activeFeelings = feelings.filter(f => (f.intensity ?? 0) > 0);
  if (activeFeelings.length >= 3) {
    score += 0.30;
    reasons.push('Multiple feelings selected');
  } else if (activeFeelings.length >= 1) {
    score += 0.15;
    reasons.push('Some feelings selected');
  } else {
    reasons.push('No feelings selected');
  }

  // Text signal quality
  const textCov = textSignals?.coverage ?? 0;
  if (textCov >= 0.5) {
    score += 0.25;
    reasons.push('Good text coverage');
  } else if (textCov > 0.15) {
    score += 0.12;
    reasons.push('Some text signal');
  }

  // Theme coherence: do top themes agree?
  if (topThemes.length >= 2) {
    const topScore = topThemes[0]?.score ?? 0;
    if (topScore >= 0.4) {
      score += 0.20;
      reasons.push('Strong dominant theme');
    } else if (topScore >= 0.2) {
      score += 0.10;
      reasons.push('Moderate theme strength');
    }
  }

  // Multi-source agreement
  const topTheme = topThemes[0];
  if (topTheme) {
    const sourceCount = [
      topTheme.sources.feelings > 0.1,
      topTheme.sources.text > 0.05,
      topTheme.sources.checkIn > 0.03,
      topTheme.sources.history > 0.02,
    ].filter(Boolean).length;
    if (sourceCount >= 3) {
      score += 0.15;
      reasons.push('Multiple signal sources agree');
    } else if (sourceCount >= 2) {
      score += 0.08;
      reasons.push('Two signal sources agree');
    }
  }

  score = clamp(score, 0, 1);

  const level: ConfidenceResult['level'] =
    score >= 0.65 ? 'High' : score >= 0.35 ? 'Medium' : 'Low';

  return { score, level, reasons };
}

// ─── Pattern Flags ────────────────────────────────────────────────────────────

function computePatternFlags(
  topThemes: TopTheme[],
  history: HistorySignalsInput | undefined,
  ambivalence: AmbivalenceResult,
  nervousConflict: NervousConflict,
): PatternFlags {
  const recurring = history?.recurring ?? false;
  const recurrenceStrength = history?.recurrenceStrength ?? 0;

  // Escalating: recurring + current top themes are stronger than history average
  const topScore = topThemes[0]?.score ?? 0;
  const historyTopTrigger = topThemes[0]
    ? (history?.triggers?.[topThemes[0].trigger] ?? 0)
    : 0;
  const escalating = recurring && topScore > historyTopTrigger + 0.15;

  // Compensatory: current dominant trigger is inverse of history dominant
  const compensatory = (() => {
    if (!history?.triggers) return false;
    const histEntries = Object.entries(history.triggers)
      .filter(([, v]) => (v ?? 0) > 0.3)
      .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0));
    if (!histEntries.length || !topThemes.length) return false;
    const histTop = histEntries[0][0];
    const currTop = topThemes[0].trigger;
    // Consider compensatory if they're quite different (rough heuristic)
    return histTop !== currTop && topScore > 0.3;
  })();

  // Aligned: top trigger matches history top trigger
  const alignedWithRecent = (() => {
    if (!history?.triggers || !topThemes.length) return false;
    const histEntries = Object.entries(history.triggers)
      .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0));
    if (!histEntries.length) return false;
    return histEntries[0][0] === topThemes[0].trigger;
  })();

  return {
    recurring,
    escalating,
    compensatory,
    alignedWithRecent,
    ambivalent: ambivalence.detected,
    nervousConflict: nervousConflict.conflictScore > 0.35,
  };
}

// ─── Main Engine ──────────────────────────────────────────────────────────────

/**
 * Run the full dream synthesis engine.
 *
 * Deterministic: same inputs always produce the same output.
 * No network calls, no LLM — pure local scoring.
 */
export function runDreamSynthesisEngine(input: EngineInput): EngineOutput {
  const {
    selectedFeelings,
    feelingDefs,
    textSignals,
    checkInSignals,
    historySignals,
    personalityProfile,
    supportedTriggers,
  } = input;

  const weights = { ...DEFAULT_WEIGHTS };

  // 1) Score feelings
  const feelingResult = scoreFeelings(selectedFeelings, feelingDefs);

  // 2) Blend all trigger scores
  let topThemes = blendTriggerScores(
    feelingResult.triggers,
    textSignals,
    checkInSignals,
    historySignals,
    personalityProfile,
    weights,
  );

  // Filter to supported triggers if specified
  if (supportedTriggers?.length) {
    const allowed = new Set(supportedTriggers);
    topThemes = topThemes.filter(t => allowed.has(t.trigger));
  }

  // 3) Build dominant profiles
  const dominant = buildDominantProfiles(feelingResult, checkInSignals, personalityProfile);

  // 3b) No-feelings fallback: when user didn't select any feelings,
  //     use taxonomy defaults from text-extracted triggers to fill profiles.
  const noFeelings = selectedFeelings.length === 0 || selectedFeelings.every(f => (f.intensity ?? 0) === 0);
  if (noFeelings && topThemes.length > 0) {
    const inferred = inferDefaultsFromTriggers(topThemes.slice(0, 5));
    // Inject taxonomy-derived valence and activation into dominant profiles
    dominant.valenceScore = inferred.valence;
    dominant.activationAvg = 1 + inferred.activation * 2; // map 0..1 to 1..3

    // Enrich nervous system profile from taxonomy-associated branches
    const nsBoost: Record<string, number> = {};
    for (const t of topThemes.slice(0, 5)) {
      const tax = getTriggerTaxonomy(t.trigger);
      for (const branch of tax.associatedBranches) {
        nsBoost[branch] = (nsBoost[branch] ?? 0) + t.score;
      }
    }
    // Normalize and blend with existing (mostly-zero) profile
    const nsBTotal = Object.values(nsBoost).reduce((a, b) => a + b, 0);
    if (nsBTotal > 0) {
      for (const [branch, val] of Object.entries(nsBoost)) {
        dominant.nervousSystemProfile[branch as NervousSystemBranch] =
          (dominant.nervousSystemProfile[branch as NervousSystemBranch] ?? 0) * 0.3 +
          (val / nsBTotal) * 0.7;
      }
    }

    // Enrich attachment profile similarly
    const attBoost: Record<string, number> = {};
    for (const t of topThemes.slice(0, 5)) {
      const tax = getTriggerTaxonomy(t.trigger);
      for (const style of tax.associatedAttachment) {
        attBoost[style] = (attBoost[style] ?? 0) + t.score;
      }
    }
    const attBTotal = Object.values(attBoost).reduce((a, b) => a + b, 0);
    if (attBTotal > 0) {
      for (const [style, val] of Object.entries(attBoost)) {
        dominant.attachmentProfile[style as AttachmentStyle] =
          (dominant.attachmentProfile[style as AttachmentStyle] ?? 0) * 0.3 +
          (val / attBTotal) * 0.7;
      }
    }
  }

  // 4) Detect ambivalence
  const triggerScoreMap: Partial<Record<ShadowTrigger, number>> = {};
  for (const t of topThemes) triggerScoreMap[t.trigger] = t.score;
  const ambivalence = detectAmbivalence(triggerScoreMap);

  // 5) Detect nervous system conflict
  const nervousConflict = detectNervousSystemConflict(dominant.nervousSystemProfile);

  // 6) Compute confidence
  const confidence = computeConfidence(selectedFeelings, textSignals, topThemes);

  // 7) Compute pattern flags
  const patternFlags = computePatternFlags(topThemes, historySignals, ambivalence, nervousConflict);

  return {
    topThemes,
    dominant,
    confidence,
    patternFlags,
    ambivalence,
    nervousConflict,
    weights,
  };
}
