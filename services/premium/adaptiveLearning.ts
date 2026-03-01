// adaptiveLearning.ts
// Feedback-driven personalization engine.
//
// When a user thumbs-up/down a card, this module computes small
// adjustments to their engine weights, trigger multipliers, and
// theme multipliers — then returns the updated model + delta
// for persistence.
//
// Design principles:
// - Conservative: changes are small and damped by feedback count.
// - Bounded: no weight can drift beyond safe ranges.
// - Auditable: every update produces a delta that can be logged.
// - Stateless: operates on a model snapshot; doesn't touch storage.

import type { ShadowTrigger } from './dreamTypes';

// ─── Types ────────────────────────────────────────────────────────────────────

export type EngineWeights = {
  feelings: number;
  text: number;
  checkIn: number;
  history: number;
  personality: number;
};

export type UserDreamModel = {
  engine_weights: EngineWeights;
  trigger_multipliers: Partial<Record<ShadowTrigger, number>>;
  theme_multipliers: Record<string, number>;
  feedback_count: number;
};

export type LearningDelta = {
  deltaEngineWeights: Partial<EngineWeights>;
  deltaTriggerMultipliers: Partial<Record<ShadowTrigger, number>>;
  deltaThemeMultipliers: Record<string, number>;
};

export type LearningContext = {
  themeId: string;
  matchedTriggers: Array<{ trigger: ShadowTrigger; score: number }>;
  textCoverage: number;
  feelingsStrength: number;
  checkInCompleteness: number;
  historyCompleteness: number;
  reasonTags?: string[];
};

export type LearningResult = {
  nextModel: UserDreamModel;
  delta: LearningDelta;
};

// ─── Constants ────────────────────────────────────────────────────────────────

/** Learning rate decays as user gives more feedback (stabilizes over time). */
function learningRate(feedbackCount: number): number {
  // Starts at 0.08, decays toward 0.015 after ~100 feedback events
  return Math.max(0.015, 0.08 / (1 + feedbackCount * 0.02));
}

/** Hard bounds on engine weights to prevent degenerate models. */
const WEIGHT_BOUNDS: Record<keyof EngineWeights, [number, number]> = {
  feelings: [0.30, 0.80],
  text: [0.05, 0.40],
  checkIn: [0.02, 0.25],
  history: [0.02, 0.20],
  personality: [0.00, 0.10],
};

/** Hard bounds on trigger/theme multipliers. */
const MULTIPLIER_BOUNDS: [number, number] = [0.50, 1.80];

// ─── Utilities ────────────────────────────────────────────────────────────────

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/** Re-normalize engine weights to sum to 1.0 after adjustment. */
function normalizeWeights(w: EngineWeights): EngineWeights {
  const total = w.feelings + w.text + w.checkIn + w.history + w.personality;
  if (total <= 0) return { feelings: 0.60, text: 0.20, checkIn: 0.10, history: 0.07, personality: 0.03 };
  return {
    feelings: w.feelings / total,
    text: w.text / total,
    checkIn: w.checkIn / total,
    history: w.history / total,
    personality: w.personality / total,
  };
}

/** Clamp all engine weights to their bounds. */
function clampWeights(w: EngineWeights): EngineWeights {
  return {
    feelings: clamp(w.feelings, ...WEIGHT_BOUNDS.feelings),
    text: clamp(w.text, ...WEIGHT_BOUNDS.text),
    checkIn: clamp(w.checkIn, ...WEIGHT_BOUNDS.checkIn),
    history: clamp(w.history, ...WEIGHT_BOUNDS.history),
    personality: clamp(w.personality, ...WEIGHT_BOUNDS.personality),
  };
}

// ─── Core Learning ────────────────────────────────────────────────────────────

/**
 * Compute a learning update from a single feedback event.
 *
 * Thumbs up (+1): reinforce the signals that contributed to this card.
 * Thumbs down (-1): weaken those signals, slightly boost alternatives.
 * Neutral (0): no-op (returns unchanged model).
 */
export function computeLearningUpdate(args: {
  model: UserDreamModel;
  rating: -1 | 0 | 1;
  ctx: LearningContext;
}): LearningResult {
  const { model, rating, ctx } = args;

  // Neutral feedback → no change
  if (rating === 0) {
    return {
      nextModel: { ...model },
      delta: {
        deltaEngineWeights: {},
        deltaTriggerMultipliers: {},
        deltaThemeMultipliers: {},
      },
    };
  }

  const lr = learningRate(model.feedback_count);
  const direction = rating; // +1 or -1

  // ── 1) Engine weight nudging ────────────────────────────────────────────
  //
  // If the card was good and text coverage was high, nudge text weight up.
  // If the card was bad and feelings strength was high, nudge feelings down.
  // Etc. We use the signal strengths as "evidence of contribution."

  const deltaWeights: Partial<EngineWeights> = {};
  const signalStrengths: Record<keyof EngineWeights, number> = {
    feelings: ctx.feelingsStrength,
    text: ctx.textCoverage,
    checkIn: ctx.checkInCompleteness,
    history: ctx.historyCompleteness,
    personality: 0, // personality is too subtle to learn from single feedback
  };

  const newWeights = { ...model.engine_weights };
  for (const key of Object.keys(signalStrengths) as (keyof EngineWeights)[]) {
    const strength = signalStrengths[key];
    if (strength <= 0) continue;

    const nudge = direction * lr * strength * 0.5;
    deltaWeights[key] = nudge;
    newWeights[key] = (newWeights[key] ?? 0) + nudge;
  }

  const clampedWeights = clampWeights(newWeights);
  const normalizedWeights = normalizeWeights(clampedWeights);

  // ── 2) Trigger multiplier nudging ───────────────────────────────────────
  //
  // If the user liked a card with high "shame" score, bump shame multiplier.
  // If they disliked it, weaken it. Proportional to the trigger's contribution.

  const deltaTriggers: Partial<Record<ShadowTrigger, number>> = {};
  const newTriggerMults = { ...model.trigger_multipliers };

  for (const mt of ctx.matchedTriggers) {
    const currentMult = newTriggerMults[mt.trigger] ?? 1.0;
    const nudge = direction * lr * mt.score;
    const nextMult = clamp(currentMult + nudge, ...MULTIPLIER_BOUNDS);
    deltaTriggers[mt.trigger] = nextMult - currentMult;
    newTriggerMults[mt.trigger] = nextMult;
  }

  // ── 3) Theme multiplier nudging ─────────────────────────────────────────
  //
  // Direct: if user liked this theme, boost it. If disliked, weaken it.

  const deltaThemes: Record<string, number> = {};
  const newThemeMults = { ...model.theme_multipliers };

  const currentThemeMult = newThemeMults[ctx.themeId] ?? 1.0;
  const themeNudge = direction * lr * 1.2; // slightly stronger signal for direct theme feedback
  const nextThemeMult = clamp(currentThemeMult + themeNudge, ...MULTIPLIER_BOUNDS);
  deltaThemes[ctx.themeId] = nextThemeMult - currentThemeMult;
  newThemeMults[ctx.themeId] = nextThemeMult;

  // ── 4) Special handling for reason tags ─────────────────────────────────

  if (ctx.reasonTags?.includes('too_vague') && rating === -1) {
    // User finds results vague — boost text weight to look for more evidence
    const extraTextNudge = lr * 0.3;
    normalizedWeights.text = clamp(
      normalizedWeights.text + extraTextNudge,
      ...WEIGHT_BOUNDS.text,
    );
    deltaWeights.text = (deltaWeights.text ?? 0) + extraTextNudge;
  }

  if (ctx.reasonTags?.includes('not_me') && rating === -1) {
    // Theme doesn't resonate — stronger theme multiplier penalty
    const extraPenalty = lr * 0.5;
    newThemeMults[ctx.themeId] = clamp(
      (newThemeMults[ctx.themeId] ?? 1.0) - extraPenalty,
      ...MULTIPLIER_BOUNDS,
    );
    deltaThemes[ctx.themeId] = (deltaThemes[ctx.themeId] ?? 0) - extraPenalty;
  }

  // Re-normalize after special handling
  const finalWeights = normalizeWeights(clampWeights(normalizedWeights));

  // ── Build result ────────────────────────────────────────────────────────

  const nextModel: UserDreamModel = {
    engine_weights: finalWeights,
    trigger_multipliers: newTriggerMults,
    theme_multipliers: newThemeMults,
    feedback_count: model.feedback_count + 1,
  };

  const delta: LearningDelta = {
    deltaEngineWeights: deltaWeights,
    deltaTriggerMultipliers: deltaTriggers,
    deltaThemeMultipliers: deltaThemes,
  };

  return { nextModel, delta };
}

// ─── Apply Model to Engine Input ──────────────────────────────────────────────

/**
 * Apply the user's personalized model to raw trigger scores before
 * feeding them to the theme selector.
 *
 * Call this between engine output and theme selection.
 */
export function applyModelMultipliers(
  triggerScores: Array<{ trigger: ShadowTrigger; score: number }>,
  model: UserDreamModel,
): Array<{ trigger: ShadowTrigger; score: number }> {
  return triggerScores.map(t => ({
    trigger: t.trigger,
    score: clamp(t.score * (model.trigger_multipliers[t.trigger] ?? 1.0), 0, 1),
  }));
}

/**
 * Apply theme multipliers to scored theme cards.
 * Call this after selectThemesForDream to re-rank based on user preference.
 */
export function applyThemeMultipliers<T extends { id: string; score: number }>(
  cards: T[],
  model: UserDreamModel,
): T[] {
  return cards
    .map(c => ({
      ...c,
      score: clamp(c.score * (model.theme_multipliers[c.id] ?? 1.0), 0, 1),
    }))
    .sort((a, b) => b.score - a.score);
}
