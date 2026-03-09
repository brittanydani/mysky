/**
 * Pattern Scoring
 *
 * Evaluates every PatternCandidate across 5 weighted dimensions:
 *
 *   A. Support          — how many days back this pattern
 *   B. Effect strength  — how large is the relationship
 *   C. Specificity      — is this signal distinctive, not just frequent
 *   D. Recency          — is it happening lately (decay-weighted)
 *   E. Emotional salience — is it psychologically significant
 *
 * Final score formula:
 *   finalScore = support×0.20 + effect×0.30 + specificity×0.20 + recency×0.15 + salience×0.15
 *
 * Thresholds:
 *   ≥ 0.78 → strong
 *   ≥ 0.62 → medium
 *   ≥ 0.50 → emerging
 *   < 0.50 → discard
 *
 * Pure functions — no I/O, no side effects.
 */

import type { PatternCandidate } from './patternCandidates';

// ─────────────────────────────────────────────────────────────────────────────
// Threshold tiers
// ─────────────────────────────────────────────────────────────────────────────

export type InsightTier = 'strong' | 'medium' | 'emerging' | 'discard';

export const TIER_THRESHOLDS = {
  strong: 0.78,
  medium: 0.62,
  emerging: 0.50,
} as const;

export function scoreTier(finalScore: number): InsightTier {
  if (finalScore >= TIER_THRESHOLDS.strong) return 'strong';
  if (finalScore >= TIER_THRESHOLDS.medium) return 'medium';
  if (finalScore >= TIER_THRESHOLDS.emerging) return 'emerging';
  return 'discard';
}

// ─────────────────────────────────────────────────────────────────────────────
// A. Support score
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Capped at 1.0 when supportCount >= 8.
 *   2 = 0.25,  4 = 0.50,  6 = 0.75,  8+ = 1.0
 */
export function computeSupportScore(supportCount: number): number {
  return Math.min(supportCount / 8, 1);
}

// ─────────────────────────────────────────────────────────────────────────────
// B. Effect strength score
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalizes the raw effectSize to 0–1 based on pattern type.
 *
 * Mood difference patterns (tag/keyword/person/sleep_impact):
 *   rawEffect = |avgSubjectMood - overallMood|  (0–9 scale)
 *   effectStrength = min(raw / 2.0, 1)
 *   i.e. 0.5pt → 0.25,   1.0pt → 0.50,  2.0+pt → 1.0
 *
 * Overlap ratio patterns (dream_waking_link):
 *   effectStrength = min(overlapRatio / 0.75, 1)
 *   i.e. 37% → 0.5,  75%+ → 1.0
 *
 * Correlation patterns (state_correlation):
 *   effectStrength = min(|r| / 0.60, 1)
 *   i.e. r=0.3 → 0.5,  r=0.6+ → 1.0
 *
 * Mismatch magnitude (sentiment_mismatch):
 *   effectStrength = min(avgMagnitude / 0.5, 1)
 *
 * Co-occurrence pairLift (co_occurrence):
 *   effectStrength = min((pairLift - 1) / 2.0, 1)
 *   i.e. lift=1 → 0,  lift=2 → 0.5,  lift=3+ → 1.0
 */
export function computeEffectStrengthScore(candidate: PatternCandidate): number {
  const p = candidate.payload;
  switch (candidate.type) {
    case 'tag_effect':
    case 'keyword_effect':
    case 'person_effect': {
      const raw = Math.abs((p.avgMoodOnSubjectDays ?? 5) - (p.overallMoodAvg ?? 5));
      return Math.min(raw / 2.0, 1);
    }
    case 'sleep_impact': {
      const raw = Math.abs((p.avgNextDayMoodAfterCondition ?? 5) - (p.avgNextDayMoodBaseline ?? 5));
      return Math.min(raw / 2.0, 1);
    }
    case 'dream_waking_link': {
      const ratio = p.overlapRatio ?? 0;
      return Math.min(ratio / 0.75, 1);
    }
    case 'state_correlation': {
      const r = Math.abs(p.correlation ?? 0);
      return Math.min(r / 0.60, 1);
    }
    case 'sentiment_mismatch': {
      const mag = p.avgMismatchMagnitude ?? 0;
      return Math.min(mag / 0.5, 1);
    }
    case 'co_occurrence': {
      const lift = p.pairLift ?? 1;
      return Math.min(Math.max(lift - 1, 0) / 2.0, 1);
    }
    default:
      return 0;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// C. Specificity score
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Measures how distinctive the pattern is — not just "this is common".
 * Uses lift: P(pattern on target days) / P(pattern on all days).
 *
 *   specificityScore = min((lift - 1) / 1.5, 1)
 *   lift 1.0 → 0,  lift 1.75 → 0.5,  lift 2.5+ → 1.0
 *
 * For patterns without a target-day rate (state_correlation, sentiment_mismatch,
 * co_occurrence) we use a fallback based on effect strength.
 */
export function computeSpecificityScore(candidate: PatternCandidate): number {
  const p = candidate.payload;

  switch (candidate.type) {
    case 'tag_effect':
    case 'keyword_effect': {
      const baseline = p.baselineRate ?? 0;
      if (baseline <= 0 || baseline >= 1) return 0;
      // Use high-mood rate for restoratives, low-mood rate for drains
      const targetRate = p.direction === 'restorative'
        ? (p.rateOnHighMoodDays ?? 0)
        : (p.rateOnLowMoodDays ?? 0);
      const lift = targetRate / baseline;
      return Math.min(Math.max(lift - 1, 0) / 1.5, 1);
    }
    case 'person_effect': {
      // Use support rate relative to journal days as proxy for baseline
      const baseline = candidate.supportCount / candidate.eligibleCount;
      if (baseline <= 0 || baseline >= 1) return 0.3;
      // We do not have a separate target rate for people — use effect size as proxy
      const raw = Math.abs(p.relationalEffect ?? 0);
      return Math.min(raw / 0.6, 1);
    }
    case 'sleep_impact': {
      // Specificity: how often is "poor sleep" in the data (not to be trivial)
      const rate = candidate.supportCount / candidate.eligibleCount;
      // More meaningful if it's not the majority of nights
      return rate <= 0.5 ? Math.min(rate * 2, 1) : Math.max(1 - rate, 0.2);
    }
    case 'dream_waking_link': {
      const baseline = p.baselineRate ?? 0;
      if (baseline <= 0) return 0;
      const overlapRatio = p.overlapRatio ?? 0;
      const lift = baseline > 0 ? overlapRatio / baseline : 0;
      return Math.min(Math.max(lift - 1, 0) / 1.5, 1);
    }
    case 'state_correlation': {
      // Correlations are inherently specific — scale by strength
      return Math.min(Math.abs(p.correlation ?? 0) / 0.6, 1);
    }
    case 'sentiment_mismatch': {
      // Specificity: how often are journal values available vs. mismatch occurring
      const rate = p.baselineRate ?? 0;
      // Elevated mismatch rate (>40%) is actually suspect — might signal always-mismatch
      return rate < 0.6 ? Math.min(rate * 1.5, 1) : 0.4;
    }
    case 'co_occurrence': {
      const lift = p.pairLift ?? 1;
      return Math.min(Math.max(lift - 1, 0) / 2.5, 1);
    }
    default:
      return 0;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// D. Recency score
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Weights supporting events by freshness using exponential decay.
 *
 * Decay bands (days ago):
 *   0–7  : weight 1.0
 *   8–14 : weight 0.75
 *   15–21: weight 0.50
 *   22–30: weight 0.25
 *   31+  : weight 0.10
 *
 * recencyScore = weightedSupport / rawSupport
 * (how "fresh" the average supporting event is)
 */
export function computeRecencyScore(subjectDayKeys: string[] | undefined): number {
  if (!subjectDayKeys || subjectDayKeys.length === 0) return 0.5; // default middle

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let weightedSum = 0;
  const n = subjectDayKeys.length;

  for (const dk of subjectDayKeys) {
    const d = new Date(dk + 'T00:00:00');
    const daysAgo = Math.round((today.getTime() - d.getTime()) / 86_400_000);
    let weight: number;
    if (daysAgo <= 7) weight = 1.00;
    else if (daysAgo <= 14) weight = 0.75;
    else if (daysAgo <= 21) weight = 0.50;
    else if (daysAgo <= 30) weight = 0.25;
    else weight = 0.10;
    weightedSum += weight;
  }

  return Math.min(weightedSum / n, 1);
}

// ─────────────────────────────────────────────────────────────────────────────
// E. Emotional salience score
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Boosts patterns that are psychologically significant:
 *   - extreme mood swings
 *   - high stress deviation
 *   - strong sentiment intensity
 *   - large relational effects
 *
 * salienceScore = min(
 *   (|avgMoodDelta|/2 + |avgStressDelta|/2 + |avgSentiment|/0.8) / 3,
 *   1
 * )
 */
export function computeSalienceScore(candidate: PatternCandidate): number {
  const p = candidate.payload;

  const moodDelta = Math.abs((p.avgMoodOnSubjectDays ?? p.avgNextDayMoodAfterCondition ?? 5) -
    (p.overallMoodAvg ?? p.avgNextDayMoodBaseline ?? 5));

  const stressDelta = Math.abs((p.avgStressOnSubjectDays ?? 5) - (p.overallStressAvg ?? 5));

  const sentimentIntensity = Math.abs(p.avgSentimentOnSubjectDays ?? p.avgMismatchMagnitude ?? 0);

  // For relational patterns, add relational effect as bonus
  const relationalBonus = Math.abs(p.relationalEffect ?? 0) * 0.5;

  const rawSalience = (
    (moodDelta / 2) +
    (stressDelta / 2) +
    (sentimentIntensity / 0.8) +
    relationalBonus
  ) / 3;

  return Math.min(rawSalience, 1);
}

// ─────────────────────────────────────────────────────────────────────────────
// Final score
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute and attach all sub-scores + final score to a candidate.
 * Returns the mutated candidate (also returns it for chaining).
 */
export function scoreCandidate(candidate: PatternCandidate): PatternCandidate {
  const supportScore = computeSupportScore(candidate.supportCount);
  const effectStrengthScore = computeEffectStrengthScore(candidate);
  const specificityScore = computeSpecificityScore(candidate);
  const recencyScore = computeRecencyScore(candidate.payload.subjectDayKeys);
  const salienceScore = computeSalienceScore(candidate);

  const finalScore =
    supportScore * 0.20 +
    effectStrengthScore * 0.30 +
    specificityScore * 0.20 +
    recencyScore * 0.15 +
    salienceScore * 0.15;

  candidate.supportScore = parseFloat(supportScore.toFixed(3));
  candidate.effectStrengthScore = parseFloat(effectStrengthScore.toFixed(3));
  candidate.specificityScore = parseFloat(specificityScore.toFixed(3));
  candidate.recencyScore = parseFloat(recencyScore.toFixed(3));
  candidate.salienceScore = parseFloat(salienceScore.toFixed(3));
  candidate.finalScore = parseFloat(finalScore.toFixed(3));
  candidate.confidenceScore = parseFloat(finalScore.toFixed(3));

  return candidate;
}

/**
 * Score all candidates and return sorted by finalScore descending.
 */
export function scoreAllCandidates(candidates: PatternCandidate[]): PatternCandidate[] {
  return candidates
    .map(scoreCandidate)
    .sort((a, b) => (b.finalScore ?? 0) - (a.finalScore ?? 0));
}

/**
 * Filter candidates to those above the minimum threshold (emerging = 0.50).
 */
export function filterByThreshold(
  candidates: PatternCandidate[],
  minTier: InsightTier = 'emerging',
): PatternCandidate[] {
  const minScore = minTier === 'strong'
    ? TIER_THRESHOLDS.strong
    : minTier === 'medium'
      ? TIER_THRESHOLDS.medium
      : TIER_THRESHOLDS.emerging;
  return candidates.filter(c => (c.finalScore ?? 0) >= minScore);
}

// ─────────────────────────────────────────────────────────────────────────────
// Diversity ranking
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Select the top N candidates with diversity across pattern types.
 * Prevents 5 tag insights in a row. Hard cap per type.
 *
 * Target distribution (configurable):
 *   - regulation (sleep_impact, state_correlation): 1
 *   - tag/keyword effect: max 2
 *   - person_effect: 1
 *   - dream/co_occurrence: 1
 *   - sentiment_mismatch: 1
 *   - fill remainder with highest scoring
 */
export function selectDiverseInsights(
  scoredCandidates: PatternCandidate[],
  maxTotal = 5,
): PatternCandidate[] {
  const maxPerType: Record<string, number> = {
    sleep_impact: 1,
    state_correlation: 1,
    tag_effect: 2,
    keyword_effect: 2,
    person_effect: 2,
    dream_waking_link: 1,
    sentiment_mismatch: 1,
    co_occurrence: 1,
  };

  const typeCounts: Record<string, number> = {};
  const selected: PatternCandidate[] = [];

  for (const c of scoredCandidates) {
    if (selected.length >= maxTotal) break;
    const current = typeCounts[c.type] ?? 0;
    const max = maxPerType[c.type] ?? 1;
    if (current >= max) continue;
    typeCounts[c.type] = current + 1;
    selected.push(c);
  }

  return selected;
}
