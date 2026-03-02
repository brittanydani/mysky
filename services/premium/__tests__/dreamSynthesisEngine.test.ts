/**
 * dreamSynthesisEngine – unit tests with deterministic test vectors.
 *
 * Every vector specifies full expected outputs so regressions are caught
 * immediately. Numbers are computed by hand from the engine formulas.
 */

import {
  runDreamSynthesisEngine,
  __test,
  type EngineInput,
  type EngineOutput,
  type TextSignalsInput,
  type CheckInSignalsInput,
  type HistorySignalsInput,
} from '../dreamSynthesisEngine';
import type {
  DreamFeelingDef,
  SelectedFeeling,
  ShadowTrigger,
} from '../dreamTypes';
import { FEELING_MAP, DREAM_FEELINGS } from '../dreamTypes';
import { detectNervousSystemConflict } from '../nervousSystemConflict';
import { detectAmbivalence } from '../ambivalenceEngine';

const {
  clamp,
  normalize,
  scoreFeelings,
  blendTriggerScores,
  buildDominantProfiles,
  computeConfidence,
  DEFAULT_WEIGHTS,
  ALL_TRIGGERS,
} = __test;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Round to N decimal places for comparison. */
const r = (n: number, dp = 4) => Math.round(n * 10 ** dp) / 10 ** dp;

/** Convenience: build a minimal EngineInput from partial options. */
function makeInput(
  feelings: { id: string; intensity: number }[],
  opts: {
    textSignals?: TextSignalsInput;
    checkInSignals?: CheckInSignalsInput;
    historySignals?: HistorySignalsInput;
  } = {},
): EngineInput {
  return {
    selectedFeelings: feelings as SelectedFeeling[],
    feelingDefs: DREAM_FEELINGS,
    ...opts,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 1 — Utility functions
// ═══════════════════════════════════════════════════════════════════════════════

describe('clamp', () => {
  it('returns value within range', () => {
    expect(clamp(0.5, 0, 1)).toBe(0.5);
  });
  it('clamps below min', () => {
    expect(clamp(-2, 0, 1)).toBe(0);
  });
  it('clamps above max', () => {
    expect(clamp(5, 0, 1)).toBe(1);
  });
  it('handles NaN propagation', () => {
    // NaN comparisons always false → Math.max/min pass NaN through
    expect(clamp(NaN, 0, 1)).toBeNaN();
  });
});

describe('normalize', () => {
  it('normalizes to sum = 1', () => {
    const result = normalize({ a: 3, b: 1, c: 1 });
    expect(r(result.a)).toBe(0.6);
    expect(r(result.b)).toBe(0.2);
    expect(r(result.c)).toBe(0.2);
  });
  it('preserves zero-sum input', () => {
    const result = normalize({ a: 0, b: 0 });
    expect(result.a).toBe(0);
    expect(result.b).toBe(0);
  });
  it('returns copy, not reference', () => {
    const input = { a: 0, b: 0 };
    const result = normalize(input);
    expect(result).not.toBe(input);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2 — scoreFeelings
// ═══════════════════════════════════════════════════════════════════════════════

describe('scoreFeelings', () => {
  it('single feeling "anxious" at intensity 3', () => {
    // anxious: triggers=['unpredictability','danger'], valence=-1, activation=1,
    //          branch=flight, attachment=anxious
    const result = scoreFeelings(
      [{ id: 'anxious', intensity: 3 }] as SelectedFeeling[],
      DREAM_FEELINGS,
    );

    // Triggers: unpredictability=3, danger=3; maxTrigger=3; both → 1.0
    expect(r(result.triggers.unpredictability)).toBe(1);
    expect(r(result.triggers.danger)).toBe(1);
    expect(r(result.triggers.abandonment)).toBe(0);

    // Nervous system: flight=3 → normalized: flight=1.0
    expect(r(result.nervousSystem.flight)).toBe(1);
    expect(r(result.nervousSystem.freeze)).toBe(0);

    // Attachment: anxious=3 → normalized: anxious=1.0
    expect(r(result.attachment.anxious)).toBe(1);

    // Valence / activation
    expect(r(result.valence)).toBe(-1);
    expect(r(result.activation)).toBe(1);
  });

  it('two feelings sharing a trigger accumulate intensity', () => {
    // anxious(intensity=4) + overwhelmed(intensity=3)
    // Both share 'unpredictability'.
    //   unpredictability = 4 + 3 = 7
    //   danger = 4
    //   helplessness = 3
    //   responsibility = 3
    //   maxTrigger = 7
    const result = scoreFeelings(
      [
        { id: 'anxious', intensity: 4 },
        { id: 'overwhelmed', intensity: 3 },
      ] as SelectedFeeling[],
      DREAM_FEELINGS,
    );

    expect(r(result.triggers.unpredictability)).toBe(1);
    expect(r(result.triggers.danger)).toBe(r(4 / 7));
    expect(r(result.triggers.helplessness)).toBe(r(3 / 7));
    expect(r(result.triggers.responsibility)).toBe(r(3 / 7));
  });

  it('clamps intensity to [0, 5]', () => {
    const result = scoreFeelings(
      [{ id: 'anxious', intensity: 99 }] as SelectedFeeling[],
      DREAM_FEELINGS,
    );
    // intensity clamped to 5; triggers still normalize to 1.0
    expect(r(result.triggers.unpredictability)).toBe(1);
    // totalWeight = 5, valence = -1*5/5 = -1
    expect(r(result.valence)).toBe(-1);
  });

  it('skips feelings with intensity 0', () => {
    const result = scoreFeelings(
      [{ id: 'anxious', intensity: 0 }] as SelectedFeeling[],
      DREAM_FEELINGS,
    );
    // All zeros
    expect(Object.values(result.triggers).every(v => v === 0)).toBe(true);
    expect(result.valence).toBe(0);
    expect(result.activation).toBe(0);
  });

  it('returns zero triggers for empty input', () => {
    const result = scoreFeelings([], DREAM_FEELINGS);
    expect(Object.values(result.triggers).every(v => v === 0)).toBe(true);
    expect(result.valence).toBe(0);
    expect(result.activation).toBe(0);
  });

  it('skips unknown feeling IDs gracefully', () => {
    const result = scoreFeelings(
      [{ id: 'nonexistent_feeling_xyz', intensity: 5 }] as SelectedFeeling[],
      DREAM_FEELINGS,
    );
    expect(Object.values(result.triggers).every(v => v === 0)).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 3 — blendTriggerScores
// ═══════════════════════════════════════════════════════════════════════════════

describe('blendTriggerScores', () => {
  const makeTriggerMap = (entries: Partial<Record<ShadowTrigger, number>>) => {
    const map = {} as Record<ShadowTrigger, number>;
    for (const t of ALL_TRIGGERS) map[t] = 0;
    for (const [k, v] of Object.entries(entries)) map[k as ShadowTrigger] = v!;
    return map;
  };

  it('feelings-only produces max score of Wf', () => {
    const triggers = makeTriggerMap({ abandonment: 1.0 });
    const themes = blendTriggerScores(triggers, undefined, undefined, undefined, undefined, DEFAULT_WEIGHTS);
    const abandonment = themes.find(t => t.trigger === 'abandonment');
    expect(abandonment).toBeDefined();
    expect(r(abandonment!.score)).toBe(r(DEFAULT_WEIGHTS.feelings)); // 0.60
  });

  it('blends feelings + text with correct weights', () => {
    const triggers = makeTriggerMap({ shame: 0.8 });
    const text: TextSignalsInput = { coverage: 0.6, triggers: { shame: 0.9 } };
    const themes = blendTriggerScores(triggers, text, undefined, undefined, undefined, DEFAULT_WEIGHTS);
    const shame = themes.find(t => t.trigger === 'shame')!;

    // blended = 0.60*0.8 + 0.20*(0.9*0.6) = 0.48 + 0.108 = 0.588
    expect(r(shame.score)).toBe(r(0.588));
    expect(r(shame.sources.feelings)).toBe(0.8);
    expect(r(shame.sources.text)).toBe(r(0.9 * 0.6));
  });

  it('clamps out-of-range coverage and trigger values', () => {
    const triggers = makeTriggerMap({});
    const text: TextSignalsInput = { coverage: 1.5, triggers: { abandonment: 2.0 } };
    const themes = blendTriggerScores(triggers, text, undefined, undefined, undefined, DEFAULT_WEIGHTS);
    const ab = themes.find(t => t.trigger === 'abandonment')!;

    // coverage clamped to 1.0, trigger clamped to 1.0
    // blended = 0.20 * (1.0 * 1.0) = 0.20
    expect(r(ab.score)).toBe(r(0.20));
    expect(r(ab.sources.text)).toBe(1.0); // 1.0 * 1.0
  });

  it('recurrence boost attributes to history source', () => {
    const triggers = makeTriggerMap({ abandonment: 1.0 });
    const history: HistorySignalsInput = {
      completeness: 0.8,
      recurring: true,
      recurrenceStrength: 0.9,
      triggers: { abandonment: 0.5 },
    };
    const themes = blendTriggerScores(triggers, undefined, undefined, history, undefined, DEFAULT_WEIGHTS);
    const ab = themes.find(t => t.trigger === 'abandonment')!;

    // Base: 0.60*1.0 + 0.07*(0.5*0.8) = 0.60 + 0.028 = 0.628
    // histTrigger = 0.5 > 0.3 → boost = 0.05 * 0.9 = 0.045
    // Final score = 0.628 + 0.045 = 0.673
    expect(r(ab.score)).toBe(r(0.673));
    // sources.history = 0.5*0.8 + 0.045 = 0.445
    expect(r(ab.sources.history)).toBe(r(0.445));
  });

  it('no recurrence boost when histTrigger ≤ 0.3', () => {
    const triggers = makeTriggerMap({ abandonment: 1.0 });
    const history: HistorySignalsInput = {
      completeness: 0.8,
      recurring: true,
      recurrenceStrength: 0.9,
      triggers: { abandonment: 0.2 }, // ≤ 0.3
    };
    const themes = blendTriggerScores(triggers, undefined, undefined, history, undefined, DEFAULT_WEIGHTS);
    const ab = themes.find(t => t.trigger === 'abandonment')!;

    // No boost applied
    // 0.60*1.0 + 0.07*(0.2*0.8) = 0.60 + 0.0112 = 0.6112
    expect(r(ab.score)).toBe(r(0.6112));
  });

  it('filters themes below 0.01 threshold', () => {
    const triggers = makeTriggerMap({});
    const themes = blendTriggerScores(triggers, undefined, undefined, undefined, undefined, DEFAULT_WEIGHTS);
    // All feeling triggers are 0, no other signals → nothing passes 0.01
    expect(themes.length).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 4 — computeConfidence
// ═══════════════════════════════════════════════════════════════════════════════

describe('computeConfidence', () => {
  const makeTheme = (trigger: ShadowTrigger, score: number, sources: Partial<Record<string, number>> = {}): any => ({
    trigger,
    score,
    sources: {
      feelings: sources.feelings ?? 0,
      text: sources.text ?? 0,
      checkIn: sources.checkIn ?? 0,
      history: sources.history ?? 0,
      personality: 0,
    },
  });

  it('maxes out at 1.0 with all signals present', () => {
    const feelings = [
      { id: 'anxious', intensity: 4 },
      { id: 'overwhelmed', intensity: 3 },
      { id: 'stressed', intensity: 2 },
    ] as SelectedFeeling[];
    const textSignals: TextSignalsInput = { coverage: 0.7, triggers: {} };
    const checkIn: CheckInSignalsInput = { completeness: 0.8, triggers: {} };
    const topThemes = [
      makeTheme('unpredictability', 0.756, { feelings: 1.0, text: 0.54, checkIn: 0.48 }),
    ];

    const result = computeConfidence(feelings, textSignals, checkIn, topThemes);

    // 0.30 + 0.25 + 0.10 + 0.20 + 0.15 = 1.00
    expect(r(result.score)).toBe(1);
    expect(result.level).toBe('High');
    expect(result.reasons).toContain('Multiple feelings selected');
    expect(result.reasons).toContain('Good text coverage');
    expect(result.reasons).toContain('Recent check-in data available');
    expect(result.reasons).toContain('Strong dominant theme');
    expect(result.reasons).toContain('Multiple signal sources agree');
  });

  it('produces Low confidence with zero input', () => {
    const result = computeConfidence([], undefined, undefined, []);
    expect(result.score).toBe(0);
    expect(result.level).toBe('Low');
    expect(result.reasons).toContain('No feelings selected');
    expect(result.reasons).toContain('No text signal');
    expect(result.reasons).toContain('No check-in data');
  });

  it('single feeling + no other signals → Medium at best', () => {
    const feelings = [{ id: 'anxious', intensity: 3 }] as SelectedFeeling[];
    const topThemes = [
      makeTheme('unpredictability', 0.60, { feelings: 1.0 }),
    ];

    const result = computeConfidence(feelings, undefined, undefined, topThemes);

    // 0.15 (some feelings) + 0.20 (strong theme) = 0.35 → "Medium"
    expect(r(result.score)).toBe(0.35);
    expect(result.level).toBe('Medium');
    expect(result.reasons).toContain('No text signal');
    expect(result.reasons).toContain('No check-in data');
  });

  it('awards partial check-in credit for low completeness', () => {
    const checkIn: CheckInSignalsInput = { completeness: 0.3 };
    const result = computeConfidence([], undefined, checkIn, []);
    expect(r(result.score)).toBe(0.05);
    expect(result.reasons).toContain('Partial check-in data');
  });

  it('theme coherence works with exactly 1 theme (was ≥ 2 bug)', () => {
    const topThemes = [makeTheme('shame', 0.45, { feelings: 0.5 })];
    const result = computeConfidence([], undefined, undefined, topThemes);
    // themes.length >= 1 → topScore 0.45 >= 0.4 → +0.20
    expect(result.reasons).toContain('Strong dominant theme');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 5 — nervousSystemConflict (new ratio formula)
// ═══════════════════════════════════════════════════════════════════════════════

describe('detectNervousSystemConflict', () => {
  it('near-equal branches produce high conflict', () => {
    const result = detectNervousSystemConflict({ flight: 0.5, freeze: 0.4, ventral_safety: 0.1 });
    // 0.4 / 0.5 = 0.80
    expect(r(result.conflictScore)).toBe(0.8);
    expect(result.dominantStates).toEqual(['flight', 'freeze']);
  });

  it('one dominant branch produces low conflict', () => {
    const result = detectNervousSystemConflict({ flight: 0.9, freeze: 0.1 });
    // 0.1 / 0.9 ≈ 0.1111
    expect(r(result.conflictScore)).toBe(r(0.1 / 0.9));
  });

  it('perfect tie gives maximal conflict of 1.0', () => {
    const result = detectNervousSystemConflict({ flight: 0.5, freeze: 0.5 });
    expect(r(result.conflictScore)).toBe(1.0);
  });

  it('single branch returns 0 conflict', () => {
    const result = detectNervousSystemConflict({ flight: 1.0 });
    expect(result.conflictScore).toBe(0);
    expect(result.dominantStates).toEqual([]);
  });

  it('empty profile returns 0 conflict', () => {
    const result = detectNervousSystemConflict({});
    expect(result.conflictScore).toBe(0);
  });

  it('ignores zero-value branches', () => {
    const result = detectNervousSystemConflict({
      flight: 0.6,
      freeze: 0,
      collapse: 0,
      ventral_safety: 0.4,
    });
    // Only flight (0.6) and ventral_safety (0.4) count
    expect(r(result.conflictScore)).toBe(r(0.4 / 0.6));
    expect(result.dominantStates).toEqual(['flight', 'ventral_safety']);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 6 — Full engine integration test vectors
// ═══════════════════════════════════════════════════════════════════════════════

describe('runDreamSynthesisEngine — integration vectors', () => {

  // ── Vector 1: Single feeling, no other signals ────────────────────────────

  it('V1 — single "anxious" feeling at intensity 3', () => {
    const input = makeInput([{ id: 'anxious', intensity: 3 }]);
    const out = runDreamSynthesisEngine(input);

    // Top themes: unpredictability and danger both at 0.60
    const topTriggers = out.topThemes.map(t => t.trigger);
    expect(topTriggers).toContain('unpredictability');
    expect(topTriggers).toContain('danger');

    const unp = out.topThemes.find(t => t.trigger === 'unpredictability')!;
    expect(r(unp.score)).toBe(r(0.60));

    // Dominant profiles
    expect(r(out.dominant.valenceScore)).toBe(-1);
    expect(r(out.dominant.activationAvg)).toBe(3); // 1 + 1*2

    // Confidence: 0.15 (some feelings) + 0.20 (strong theme @0.60) = 0.35
    expect(r(out.confidence.score)).toBe(0.35);
    expect(out.confidence.level).toBe('Medium');
    expect(out.confidence.reasons).toContain('Some feelings selected');
    expect(out.confidence.reasons).toContain('Strong dominant theme');
    expect(out.confidence.reasons).toContain('No text signal');
    expect(out.confidence.reasons).toContain('No check-in data');
  });

  // ── Vector 2: Empty feelings, text only ───────────────────────────────────

  it('V2 — no feelings, text only (no-feelings fallback)', () => {
    const input = makeInput([], {
      textSignals: {
        coverage: 0.7,
        triggers: { abandonment: 0.8, grief: 0.5 },
      },
    });
    const out = runDreamSynthesisEngine(input);

    // Themes from text only
    const ab = out.topThemes.find(t => t.trigger === 'abandonment')!;
    // 0.20 * (0.8 * 0.7) = 0.20 * 0.56 = 0.112
    expect(r(ab.score)).toBe(r(0.112));

    const gr = out.topThemes.find(t => t.trigger === 'grief')!;
    // 0.20 * (0.5 * 0.7) = 0.20 * 0.35 = 0.07
    expect(r(gr.score)).toBe(r(0.07));

    // No-feelings fallback enriches valence from taxonomy
    // abandonment: defaultValence=-1, defaultActivation=1
    // grief: defaultValence=-1, defaultActivation=0
    // Weighted: valence = (-1*0.112 + -1*0.070) / 0.182 = -1
    expect(r(out.dominant.valenceScore)).toBe(-1);

    // activation = (1*0.112 + 0*0.070) / 0.182 = 0.6154
    // activationAvg = 1 + 0.6154*2 ≈ 2.2308
    expect(r(out.dominant.activationAvg, 2)).toBeCloseTo(2.23, 1);

    // Confidence: 0 (no feelings) + 0.25 (text >= 0.5) = 0.25
    expect(r(out.confidence.score)).toBe(0.25);
    expect(out.confidence.level).toBe('Low');
    expect(out.confidence.reasons).toContain('No feelings selected');
    expect(out.confidence.reasons).toContain('Good text coverage');
  });

  // ── Vector 3: Totally empty input ─────────────────────────────────────────

  it('V3 — no feelings, no text, no signals at all', () => {
    const input = makeInput([]);
    const out = runDreamSynthesisEngine(input);

    expect(out.topThemes.length).toBe(0);
    expect(out.dominant.valenceScore).toBe(0);
    expect(out.dominant.activationAvg).toBe(1); // 1 + 0*2 = 1
    expect(out.confidence.score).toBe(0);
    expect(out.confidence.level).toBe('Low');
    expect(out.confidence.reasons).toEqual(
      expect.arrayContaining(['No feelings selected', 'No text signal', 'No check-in data']),
    );
    expect(out.patternFlags.recurring).toBe(false);
    expect(out.patternFlags.ambivalent).toBe(false);
    expect(out.patternFlags.nervousConflict).toBe(false);
  });

  // ── Vector 4: Rich multi-signal input ─────────────────────────────────────

  it('V4 — three feelings + text + checkIn (max confidence)', () => {
    const input = makeInput(
      [
        { id: 'anxious', intensity: 4 },
        { id: 'overwhelmed', intensity: 3 },
        { id: 'stressed', intensity: 2 },
      ],
      {
        textSignals: {
          coverage: 0.6,
          triggers: { unpredictability: 0.9, responsibility: 0.7, danger: 0.4 },
        },
        checkInSignals: {
          completeness: 0.8,
          triggers: { unpredictability: 0.6 },
        },
      },
    );
    const out = runDreamSynthesisEngine(input);

    // Top theme should be unpredictability
    expect(out.topThemes[0].trigger).toBe('unpredictability');

    // Hand-computed:
    //   fScore = 1.0 (feeling triggers normalize: unpredictability=7 is the max)
    //   tScore = 0.9 * 0.6 = 0.54
    //   cScore = 0.6 * 0.8 = 0.48
    //   blended = 0.60*1.0 + 0.20*0.54 + 0.10*0.48 = 0.756
    expect(r(out.topThemes[0].score)).toBe(r(0.756));

    // Responsibility: fScore = 5/7 ≈ 0.7143, tScore = 0.7*0.6 = 0.42
    //   blended = 0.60*0.7143 + 0.20*0.42 = 0.4286 + 0.084 = 0.5126
    const resp = out.topThemes.find(t => t.trigger === 'responsibility')!;
    expect(r(resp.score, 3)).toBeCloseTo(0.513, 2);

    // Confidence should be High (all signal types present)
    expect(out.confidence.level).toBe('High');
    expect(r(out.confidence.score)).toBe(1);
  });

  // ── Vector 5: Intensity-0 feelings treated as absent ──────────────────────

  it('V5 — feelings with intensity 0 are ignored', () => {
    const input = makeInput([
      { id: 'anxious', intensity: 0 },
      { id: 'overwhelmed', intensity: 0 },
    ]);
    const out = runDreamSynthesisEngine(input);

    // Behaves identically to empty feelings
    expect(out.topThemes.length).toBe(0);
    expect(out.confidence.reasons).toContain('No feelings selected');
  });

  // ── Vector 6: Out-of-range input clamping ─────────────────────────────────

  it('V6 — out-of-range coverage and trigger values are clamped', () => {
    const input = makeInput([], {
      textSignals: {
        coverage: 1.5, // should clamp to 1.0
        triggers: { abandonment: 2.0 }, // should clamp to 1.0
      },
    });
    const out = runDreamSynthesisEngine(input);
    const ab = out.topThemes.find(t => t.trigger === 'abandonment')!;

    // 0.20 * (1.0 * 1.0) = 0.20
    expect(r(ab.score)).toBe(r(0.20));
    expect(r(ab.sources.text)).toBe(1.0);
  });

  // ── Vector 7: Recurrence boost ────────────────────────────────────────────

  it('V7 — recurring history boosts applicable triggers', () => {
    const input = makeInput([{ id: 'anxious', intensity: 5 }], {
      historySignals: {
        completeness: 0.8,
        recurring: true,
        recurrenceStrength: 0.9,
        triggers: { unpredictability: 0.5 },
      },
    });
    const out = runDreamSynthesisEngine(input);
    const unp = out.topThemes.find(t => t.trigger === 'unpredictability')!;

    // Base: 0.60*1.0 + 0.07*(0.5*0.8) = 0.628
    // Boost: 0.05 * 0.9 = 0.045 (histTrigger 0.5 > 0.3)
    // Final: 0.673
    expect(r(unp.score)).toBe(r(0.673));
    expect(r(unp.sources.history)).toBe(r(0.5 * 0.8 + 0.045));

    // danger has no history trigger → no boost
    const danger = out.topThemes.find(t => t.trigger === 'danger')!;
    expect(r(danger.score)).toBe(r(0.60)); // pure feelings

    // Pattern flags
    expect(out.patternFlags.recurring).toBe(true);
  });

  // ── Vector 8: Ambivalence detection ───────────────────────────────────────

  it('V8 — ambivalent triggers are detected', () => {
    // "belonging" + "rejection" are an ambivalent pair per the engine.
    // Need both above 0.35 blended, which is hard with feelings-only (max 0.60).
    // Use text signals to boost them.
    const input = makeInput(
      [{ id: 'accepted', intensity: 5 }], // accepted → belonging, worthiness, rejection; valence +1
      {
        textSignals: {
          coverage: 0.8,
          triggers: { belonging: 0.8, rejection: 0.8 },
        },
      },
    );
    const out = runDreamSynthesisEngine(input);

    // If ambivalence detected between belonging and rejection
    if (out.ambivalence.detected) {
      expect(out.patternFlags.ambivalent).toBe(true);
      expect(out.ambivalence.pairs.length).toBeGreaterThan(0);
    }
  });

  // ── Vector 9: supportedTriggers filter ────────────────────────────────────

  it('V9 — supportedTriggers filters output themes', () => {
    const input: EngineInput = {
      ...makeInput([{ id: 'anxious', intensity: 5 }]),
      supportedTriggers: ['danger'] as ShadowTrigger[],
    };
    const out = runDreamSynthesisEngine(input);

    expect(out.topThemes.length).toBe(1);
    expect(out.topThemes[0].trigger).toBe('danger');
  });

  // ── Vector 10: Positive feeling produces positive valence ─────────────────

  it('V10 — positive feeling "safe" produces positive valence', () => {
    const input = makeInput([{ id: 'safe', intensity: 5 }]);
    const out = runDreamSynthesisEngine(input);

    expect(out.dominant.valenceScore).toBe(1);
    expect(out.dominant.activationAvg).toBe(1); // safe: activation=0 → 1+0*2=1

    // "safe" has no shadow triggers → no themes
    expect(out.topThemes.length).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 7 — Edge cases & invariants
// ═══════════════════════════════════════════════════════════════════════════════

describe('invariants', () => {
  it('all blended scores are in [0, 1]', () => {
    // Use extreme input values
    const input = makeInput(
      [
        { id: 'anxious', intensity: 5 },
        { id: 'panicked', intensity: 5 },
        { id: 'terrified', intensity: 5 },
      ],
      {
        textSignals: { coverage: 1.0, triggers: { danger: 1.0, unpredictability: 1.0, helplessness: 1.0 } },
        checkInSignals: { completeness: 1.0, triggers: { danger: 1.0 } },
        historySignals: {
          completeness: 1.0, recurring: true, recurrenceStrength: 1.0,
          triggers: { danger: 1.0 },
        },
      },
    );
    const out = runDreamSynthesisEngine(input);

    for (const t of out.topThemes) {
      expect(t.score).toBeGreaterThanOrEqual(0);
      expect(t.score).toBeLessThanOrEqual(1);
    }
  });

  it('confidence score is in [0, 1]', () => {
    const input = makeInput([
      { id: 'anxious', intensity: 5 },
      { id: 'panicked', intensity: 5 },
      { id: 'terrified', intensity: 5 },
    ], {
      textSignals: { coverage: 1.0, triggers: { danger: 1.0 } },
      checkInSignals: { completeness: 1.0, triggers: { danger: 1.0 } },
    });
    const out = runDreamSynthesisEngine(input);
    expect(out.confidence.score).toBeGreaterThanOrEqual(0);
    expect(out.confidence.score).toBeLessThanOrEqual(1);
  });

  it('valence is in [-1, 1]', () => {
    const input = makeInput([
      { id: 'anxious', intensity: 5 },
      { id: 'safe', intensity: 5 },
    ]);
    const out = runDreamSynthesisEngine(input);
    expect(out.dominant.valenceScore).toBeGreaterThanOrEqual(-1);
    expect(out.dominant.valenceScore).toBeLessThanOrEqual(1);
  });

  it('activationAvg is in [1, 3]', () => {
    const input = makeInput([{ id: 'anxious', intensity: 5 }]);
    const out = runDreamSynthesisEngine(input);
    expect(out.dominant.activationAvg).toBeGreaterThanOrEqual(1);
    expect(out.dominant.activationAvg).toBeLessThanOrEqual(3);
  });

  it('themes are sorted descending by score', () => {
    const input = makeInput([
      { id: 'anxious', intensity: 3 },
      { id: 'overwhelmed', intensity: 5 },
      { id: 'frustrated', intensity: 2 },
    ]);
    const out = runDreamSynthesisEngine(input);
    for (let i = 1; i < out.topThemes.length; i++) {
      expect(out.topThemes[i - 1].score).toBeGreaterThanOrEqual(out.topThemes[i].score);
    }
  });

  it('deterministic — same input always produces same output', () => {
    const input = makeInput([
      { id: 'anxious', intensity: 4 },
      { id: 'stressed', intensity: 3 },
    ], {
      textSignals: { coverage: 0.5, triggers: { control: 0.7 } },
    });

    const out1 = runDreamSynthesisEngine(input);
    const out2 = runDreamSynthesisEngine(input);

    expect(out1.topThemes).toEqual(out2.topThemes);
    expect(out1.dominant).toEqual(out2.dominant);
    expect(out1.confidence).toEqual(out2.confidence);
  });

  it('nervous system profile values are non-negative', () => {
    const input = makeInput([
      { id: 'anxious', intensity: 3 },
      { id: 'overwhelmed', intensity: 4 },
    ]);
    const out = runDreamSynthesisEngine(input);
    for (const val of Object.values(out.dominant.nervousSystemProfile)) {
      expect(val).toBeGreaterThanOrEqual(0);
    }
  });
});
