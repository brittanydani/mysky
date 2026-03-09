/**
 * Pattern Candidates
 *
 * Finds all possible pattern hypotheses from a normalized daily signal dataset.
 * Produces PatternCandidate[] for patternScoring.ts to evaluate.
 *
 * Each candidate is a testable hypothesis:
 *   "Does X correlate with state Y?"
 *
 * Pattern types:
 *   tag_effect         — tag correlates with mood/energy/stress
 *   keyword_effect     — journal keyword correlates with mood
 *   person_effect      — mentioned person correlates with state
 *   dream_waking_link  — dream symbol co-occurs with waking theme/state
 *   sleep_impact       — sleep hours/quality predicts next-day state
 *   state_correlation  — two numeric signals move together
 *   sentiment_mismatch — mood score conflicts with journal tone
 *   co_occurrence      — two keywords/tags appear together repeatedly
 *
 * Pure functions — no I/O, no side effects.
 */

import type { DailySignalRecord } from './patternInsightEngine';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type PatternType =
  | 'tag_effect'
  | 'keyword_effect'
  | 'person_effect'
  | 'dream_waking_link'
  | 'sleep_impact'
  | 'state_correlation'
  | 'sentiment_mismatch'
  | 'co_occurrence';

export type WindowLabel = '7d' | '30d' | '90d';

export interface PatternCandidate {
  id: string;
  type: PatternType;

  /** Primary subject — e.g. "movement", "mother", "water" */
  subject: string;
  /** Secondary subject for relational/link patterns — e.g. "overwhelmed" */
  relatedSubject?: string;
  /** Time window this candidate was computed over */
  window: WindowLabel;

  /** Days where subject was present */
  supportCount: number;
  /** Total days in the analysis window */
  eligibleCount: number;

  // Populated by patternScoring.ts
  effectSize?: number;
  confidenceScore?: number;

  // Computed scores (set by patternScoring.ts)
  supportScore?: number;
  effectStrengthScore?: number;
  specificityScore?: number;
  recencyScore?: number;
  salienceScore?: number;
  finalScore?: number;

  // Raw data cached for scoring
  payload: PatternPayload;
}

export interface PatternPayload {
  /** Average mood on subject days */
  avgMoodOnSubjectDays?: number;
  /** Overall average mood in window */
  overallMoodAvg?: number;
  /** Average stress on subject days */
  avgStressOnSubjectDays?: number;
  /** Overall average stress */
  overallStressAvg?: number;
  /** Average energy on subject days */
  avgEnergyOnSubjectDays?: number;
  /** Overall average energy */
  overallEnergyAvg?: number;
  /** Average next-day mood after sleep condition (sleep_impact) */
  avgNextDayMoodAfterCondition?: number;
  /** Average next-day mood in baseline (sleep_impact) */
  avgNextDayMoodBaseline?: number;
  /** Overlap ratio for dream_waking_link (0–1) */
  overlapRatio?: number;
  /** Rate of subject on low-mood days (for lift calculation) */
  rateOnLowMoodDays?: number;
  /** Rate of subject on high-mood days */
  rateOnHighMoodDays?: number;
  /** Rate of subject across all days */
  baselineRate?: number;
  /** Mismatch day count (sentiment_mismatch) */
  mismatchDayCount?: number;
  /** Average mismatch magnitude per mismatch day */
  avgMismatchMagnitude?: number;
  /** Correlation coefficient (state_correlation) */
  correlation?: number;
  /** Person effect: composite relational effect (-1 to 1) */
  relationalEffect?: number;
  /** DayKeys where subject appears (for recency scoring) */
  subjectDayKeys?: string[];
  /** Average sentiment on subject days */
  avgSentimentOnSubjectDays?: number;
  /** Overall average sentiment */
  overallSentimentAvg?: number;
  /** Direction of effect (positive = restorative, negative = draining) */
  direction?: 'restorative' | 'draining' | 'neutral';
  /** Pair co-occurrence info */
  pairLift?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

function mean(vals: number[]): number {
  if (vals.length === 0) return 0;
  return vals.reduce((s, v) => s + v, 0) / vals.length;
}

function pearsonCorrelation(xs: number[], ys: number[]): number {
  const n = xs.length;
  if (n < 3 || n !== ys.length) return 0;
  const mx = mean(xs);
  const my = mean(ys);
  let num = 0, dx2 = 0, dy2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx;
    const dy = ys[i] - my;
    num += dx * dy;
    dx2 += dx * dx;
    dy2 += dy * dy;
  }
  const denom = Math.sqrt(dx2 * dy2);
  return denom === 0 ? 0 : num / denom;
}

/**
 * Window cutoff date string (YYYY-MM-DD) for N days ago.
 */
function windowCutoff(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

/**
 * Filter records to those within a given day window.
 */
function inWindow(records: DailySignalRecord[], windowDays: number): DailySignalRecord[] {
  const cutoff = windowCutoff(windowDays);
  return records.filter(r => r.dayKey >= cutoff);
}

function windowLabel(days: number): WindowLabel {
  if (days <= 7) return '7d';
  if (days <= 30) return '30d';
  return '90d';
}

/** A stable ID that uniquely identifies a candidate */
function candidateId(type: PatternType, subject: string, related: string | undefined, win: WindowLabel): string {
  return [type, subject, related ?? '', win].join('|');
}

// ─────────────────────────────────────────────────────────────────────────────
// A. Tag Effect Candidates
// ─────────────────────────────────────────────────────────────────────────────

/**
 * For each tag that appears in ≥3 days, test whether it correlates with
 * better or worse mood (and stress/energy).
 */
export function findTagEffectCandidates(
  records: DailySignalRecord[],
  win: number,
): PatternCandidate[] {
  const window = inWindow(records, win);
  const wLabel = windowLabel(win);
  if (window.length < 7) return [];

  const moodRecords = window.filter(r => r.mood !== undefined);
  if (moodRecords.length < 5) return [];

  const overallMoodAvg = mean(moodRecords.map(r => r.mood!));
  const overallStressAvg = mean(window.filter(r => r.stress !== undefined).map(r => r.stress!));
  const overallEnergyAvg = mean(window.filter(r => r.energy !== undefined).map(r => r.energy!));

  // Collect all unique tags
  const allTags = new Set<string>();
  for (const r of window) { for (const t of r.tags) allTags.add(t); }

  const lowMoodDays = moodRecords.filter(r => r.isLowMood);
  const highMoodDays = moodRecords.filter(r => r.isHighMood);

  const candidates: PatternCandidate[] = [];

  for (const tag of allTags) {
    const tagDays = moodRecords.filter(r => r.tags.includes(tag));
    if (tagDays.length < 3) continue;

    const tagMoodAvg = mean(tagDays.map(r => r.mood!));
    const tagStressAvg = mean(tagDays.filter(r => r.stress !== undefined).map(r => r.stress!));
    const tagEnergyAvg = mean(tagDays.filter(r => r.energy !== undefined).map(r => r.energy!));
    const effectSize = tagMoodAvg - overallMoodAvg;

    const baselineRate = tagDays.length / window.length;
    const rateOnLowMood = lowMoodDays.length > 0
      ? lowMoodDays.filter(r => r.tags.includes(tag)).length / lowMoodDays.length
      : 0;
    const rateOnHighMood = highMoodDays.length > 0
      ? highMoodDays.filter(r => r.tags.includes(tag)).length / highMoodDays.length
      : 0;

    const direction: PatternPayload['direction'] = effectSize > 0.3
      ? 'restorative'
      : effectSize < -0.3
        ? 'draining'
        : 'neutral';

    candidates.push({
      id: candidateId('tag_effect', tag, undefined, wLabel),
      type: 'tag_effect',
      subject: tag,
      window: wLabel,
      supportCount: tagDays.length,
      eligibleCount: window.length,
      effectSize,
      payload: {
        avgMoodOnSubjectDays: parseFloat(tagMoodAvg.toFixed(2)),
        overallMoodAvg: parseFloat(overallMoodAvg.toFixed(2)),
        avgStressOnSubjectDays: parseFloat(tagStressAvg.toFixed(2)),
        overallStressAvg: parseFloat(overallStressAvg.toFixed(2)),
        avgEnergyOnSubjectDays: parseFloat(tagEnergyAvg.toFixed(2)),
        overallEnergyAvg: parseFloat(overallEnergyAvg.toFixed(2)),
        baselineRate: parseFloat(baselineRate.toFixed(3)),
        rateOnLowMoodDays: parseFloat(rateOnLowMood.toFixed(3)),
        rateOnHighMoodDays: parseFloat(rateOnHighMood.toFixed(3)),
        subjectDayKeys: tagDays.map(r => r.dayKey),
        direction,
      },
    });
  }

  return candidates;
}

// ─────────────────────────────────────────────────────────────────────────────
// B. Keyword Effect Candidates
// ─────────────────────────────────────────────────────────────────────────────

/**
 * For each journal keyword appearing ≥3 days, test mood correlation.
 */
export function findKeywordEffectCandidates(
  records: DailySignalRecord[],
  win: number,
): PatternCandidate[] {
  const window = inWindow(records, win);
  const wLabel = windowLabel(win);
  if (window.length < 7) return [];

  const moodRecords = window.filter(r => r.mood !== undefined && r.hasJournal);
  if (moodRecords.length < 5) return [];

  const overallMoodAvg = mean(moodRecords.map(r => r.mood!));
  const overallSentimentAvg = mean(
    moodRecords.filter(r => r.journalSentiment !== undefined).map(r => r.journalSentiment!),
  );

  const lowMoodDays = moodRecords.filter(r => r.isLowMood);
  const highMoodDays = moodRecords.filter(r => r.isHighMood);

  const allKeywords = new Set<string>();
  for (const r of window) { for (const kw of r.journalKeywords) allKeywords.add(kw); }

  const candidates: PatternCandidate[] = [];

  for (const kw of allKeywords) {
    const kwDays = moodRecords.filter(r => r.journalKeywords.includes(kw));
    if (kwDays.length < 3) continue;

    const kwMoodAvg = mean(kwDays.map(r => r.mood!));
    const effectSize = kwMoodAvg - overallMoodAvg;

    const baselineRate = kwDays.length / moodRecords.length;
    const rateOnLow = lowMoodDays.length > 0
      ? lowMoodDays.filter(r => r.journalKeywords.includes(kw)).length / lowMoodDays.length
      : 0;
    const rateOnHigh = highMoodDays.length > 0
      ? highMoodDays.filter(r => r.journalKeywords.includes(kw)).length / highMoodDays.length
      : 0;

    const kwSentimentAvg = mean(
      kwDays.filter(r => r.journalSentiment !== undefined).map(r => r.journalSentiment!),
    );

    const direction: PatternPayload['direction'] = effectSize > 0.3
      ? 'restorative'
      : effectSize < -0.3
        ? 'draining'
        : 'neutral';

    candidates.push({
      id: candidateId('keyword_effect', kw, undefined, wLabel),
      type: 'keyword_effect',
      subject: kw,
      window: wLabel,
      supportCount: kwDays.length,
      eligibleCount: moodRecords.length,
      effectSize,
      payload: {
        avgMoodOnSubjectDays: parseFloat(kwMoodAvg.toFixed(2)),
        overallMoodAvg: parseFloat(overallMoodAvg.toFixed(2)),
        baselineRate: parseFloat(baselineRate.toFixed(3)),
        rateOnLowMoodDays: parseFloat(rateOnLow.toFixed(3)),
        rateOnHighMoodDays: parseFloat(rateOnHigh.toFixed(3)),
        avgSentimentOnSubjectDays: parseFloat(kwSentimentAvg.toFixed(3)),
        overallSentimentAvg: parseFloat(overallSentimentAvg.toFixed(3)),
        subjectDayKeys: kwDays.map(r => r.dayKey),
        direction,
      },
    });
  }

  return candidates;
}

// ─────────────────────────────────────────────────────────────────────────────
// C. Person Effect Candidates
// ─────────────────────────────────────────────────────────────────────────────

/**
 * For each person mentioned ≥3 times, test composite relational effect.
 */
export function findPersonEffectCandidates(
  records: DailySignalRecord[],
  win: number,
): PatternCandidate[] {
  const window = inWindow(records, win);
  const wLabel = windowLabel(win);
  if (window.length < 7) return [];

  const scoredRecords = window.filter(r =>
    r.mood !== undefined && r.energy !== undefined && r.stress !== undefined
  );
  if (scoredRecords.length < 5) return [];

  const overallMoodAvg = mean(scoredRecords.map(r => r.mood!));
  const overallEnergyAvg = mean(scoredRecords.map(r => r.energy!));
  const overallStressAvg = mean(scoredRecords.map(r => r.stress!));

  const allPeople = new Set<string>();
  for (const r of window) { for (const p of r.people) allPeople.add(p); }

  const candidates: PatternCandidate[] = [];

  for (const person of allPeople) {
    const personDays = scoredRecords.filter(r => r.people.includes(person));
    if (personDays.length < 3) continue;

    const avgMood = mean(personDays.map(r => r.mood!));
    const avgEnergy = mean(personDays.map(r => r.energy!));
    const avgStress = mean(personDays.map(r => r.stress!));

    const moodDelta = avgMood - overallMoodAvg;
    const energyDelta = avgEnergy - overallEnergyAvg;
    const stressDelta = avgStress - overallStressAvg;

    // Composite relational effect: positive = beneficial, negative = draining
    const relationalEffect = (moodDelta / 2 + energyDelta / 2 - stressDelta / 2) / 3;

    const direction: PatternPayload['direction'] = relationalEffect > 0.2
      ? 'restorative'
      : relationalEffect < -0.2
        ? 'draining'
        : 'neutral';

    candidates.push({
      id: candidateId('person_effect', person, undefined, wLabel),
      type: 'person_effect',
      subject: person,
      window: wLabel,
      supportCount: personDays.length,
      eligibleCount: scoredRecords.length,
      effectSize: relationalEffect,
      payload: {
        avgMoodOnSubjectDays: parseFloat(avgMood.toFixed(2)),
        overallMoodAvg: parseFloat(overallMoodAvg.toFixed(2)),
        avgStressOnSubjectDays: parseFloat(avgStress.toFixed(2)),
        overallStressAvg: parseFloat(overallStressAvg.toFixed(2)),
        avgEnergyOnSubjectDays: parseFloat(avgEnergy.toFixed(2)),
        overallEnergyAvg: parseFloat(overallEnergyAvg.toFixed(2)),
        relationalEffect: parseFloat(relationalEffect.toFixed(3)),
        subjectDayKeys: personDays.map(r => r.dayKey),
        direction,
      },
    });
  }

  return candidates;
}

// ─────────────────────────────────────────────────────────────────────────────
// D. Dream–Waking Link Candidates
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Test whether dream keywords co-occur with waking tags or journal keywords
 * on the same day or the next day.
 * Requires ≥2 linked events (ideally 3).
 */
export function findDreamWakingLinkCandidates(
  records: DailySignalRecord[],
  win: number,
): PatternCandidate[] {
  const window = inWindow(records, win);
  const wLabel = windowLabel(win);
  if (window.length < 7) return [];

  const dreamDays = window.filter(r => r.hasDream && r.dreamKeywords.length > 0);
  if (dreamDays.length < 2) return [];

  // Build a dayKey → record map for next-day lookup
  const recordByDay = new Map<string, DailySignalRecord>();
  for (const r of window) recordByDay.set(r.dayKey, r);

  // Collect all dream symbols and waking concepts to test
  const allDreamSymbols = new Set<string>();
  for (const r of dreamDays) { for (const kw of r.dreamKeywords) allDreamSymbols.add(kw); }

  const allWakingConcepts = new Set<string>();
  for (const r of window) {
    for (const t of r.tags) allWakingConcepts.add(`tag:${t}`);
    for (const kw of r.journalKeywords) allWakingConcepts.add(`kw:${kw}`);
  }

  const candidates: PatternCandidate[] = [];

  for (const symbol of allDreamSymbols) {
    const symbolDays = dreamDays.filter(r => r.dreamKeywords.includes(symbol));
    if (symbolDays.length < 2) continue;

    for (const wakingLabel of allWakingConcepts) {
      const [wakingType, wakingValue] = wakingLabel.split(':') as [string, string];

      // Check same-day and next-day overlap
      let overlapCount = 0;
      for (const sDay of symbolDays) {
        const sameDay = sDay;
        const nextKey = nextDayKey(sDay.dayKey);
        const nextDay = recordByDay.get(nextKey);

        const sameHit = wakingType === 'tag'
          ? sameDay.tags.includes(wakingValue)
          : sameDay.journalKeywords.includes(wakingValue);

        const nextHit = nextDay
          ? (wakingType === 'tag'
            ? nextDay.tags.includes(wakingValue)
            : nextDay.journalKeywords.includes(wakingValue))
          : false;

        if (sameHit || nextHit) overlapCount++;
      }

      if (overlapCount < 2) continue;

      // Baseline rate of waking concept across the whole window
      const baselineCount = window.filter(r =>
        wakingType === 'tag'
          ? r.tags.includes(wakingValue)
          : r.journalKeywords.includes(wakingValue)
      ).length;
      const baselineRate = baselineCount / window.length;
      if (baselineRate === 0) continue;

      const overlapRatio = overlapCount / symbolDays.length;
      const lift = overlapRatio / baselineRate;

      // Only keep if meaningfully elevated
      if (lift < 1.3) continue;

      candidates.push({
        id: candidateId('dream_waking_link', symbol, wakingValue, wLabel),
        type: 'dream_waking_link',
        subject: symbol,
        relatedSubject: wakingValue,
        window: wLabel,
        supportCount: overlapCount,
        eligibleCount: symbolDays.length,
        payload: {
          overlapRatio: parseFloat(overlapRatio.toFixed(3)),
          baselineRate: parseFloat(baselineRate.toFixed(3)),
          subjectDayKeys: symbolDays.map(r => r.dayKey),
          direction: 'neutral',
        },
      });
    }
  }

  return candidates;
}

/** Increment a YYYY-MM-DD string by 1 day */
function nextDayKey(dayKey: string): string {
  const d = new Date(dayKey + 'T12:00:00');
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// E. Sleep Impact Candidates
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Test whether poor sleep (< 6h or low quality) predicts lower next-day mood/energy.
 * Uses lagged analysis: sleep night → next-day state.
 * Requires ≥5 paired nights.
 */
export function findSleepImpactCandidates(
  records: DailySignalRecord[],
  win: number,
): PatternCandidate[] {
  const window = inWindow(records, win);
  const wLabel = windowLabel(win);
  if (window.length < 7) return [];

  const recordByDay = new Map<string, DailySignalRecord>();
  for (const r of window) recordByDay.set(r.dayKey, r);

  const sleepDays = window.filter(r => r.sleepHours !== undefined);
  if (sleepDays.length < 5) return [];

  // Pair each sleep record with the next day's mood
  const poorSleepNextMoods: number[] = [];
  const goodSleepNextMoods: number[] = [];
  const poorSleepNextEnergy: number[] = [];
  const goodSleepNextEnergy: number[] = [];
  const poorSleepDayKeys: string[] = [];

  for (const r of sleepDays) {
    const next = recordByDay.get(nextDayKey(r.dayKey));
    if (!next || next.mood === undefined) continue;

    if (r.isLowSleep) {
      poorSleepNextMoods.push(next.mood);
      poorSleepDayKeys.push(r.dayKey);
      if (next.energy !== undefined) poorSleepNextEnergy.push(next.energy);
    } else {
      goodSleepNextMoods.push(next.mood);
      if (next.energy !== undefined) goodSleepNextEnergy.push(next.energy);
    }
  }

  if (poorSleepNextMoods.length < 3 || goodSleepNextMoods.length < 3) return [];

  const avgMoodAfterPoor = mean(poorSleepNextMoods);
  const avgMoodAfterGood = mean(goodSleepNextMoods);
  const effectSize = avgMoodAfterPoor - avgMoodAfterGood; // negative = poor sleep hurts

  const candidates: PatternCandidate[] = [];

  if (Math.abs(effectSize) >= 0.3) {
    candidates.push({
      id: candidateId('sleep_impact', 'sleep_hours', 'next_day_mood', wLabel),
      type: 'sleep_impact',
      subject: 'sleep_hours',
      relatedSubject: 'next_day_mood',
      window: wLabel,
      supportCount: poorSleepNextMoods.length,
      eligibleCount: sleepDays.length,
      effectSize,
      payload: {
        avgNextDayMoodAfterCondition: parseFloat(avgMoodAfterPoor.toFixed(2)),
        avgNextDayMoodBaseline: parseFloat(avgMoodAfterGood.toFixed(2)),
        subjectDayKeys: poorSleepDayKeys,
        direction: effectSize < 0 ? 'draining' : 'neutral',
      },
    });
  }

  // Also test sleep quality if present
  const qualityDays = window.filter(r => r.sleepQuality !== undefined);
  if (qualityDays.length >= 5) {
    const lowQualityNextMoods: number[] = [];
    const highQualityNextMoods: number[] = [];
    const lowQualityDayKeys: string[] = [];

    for (const r of qualityDays) {
      const next = recordByDay.get(nextDayKey(r.dayKey));
      if (!next || next.mood === undefined) continue;
      if ((r.sleepQuality ?? 5) <= 3) {
        lowQualityNextMoods.push(next.mood);
        lowQualityDayKeys.push(r.dayKey);
      } else {
        highQualityNextMoods.push(next.mood);
      }
    }

    if (lowQualityNextMoods.length >= 3 && highQualityNextMoods.length >= 3) {
      const qualityEffect = mean(lowQualityNextMoods) - mean(highQualityNextMoods);
      if (Math.abs(qualityEffect) >= 0.3) {
        candidates.push({
          id: candidateId('sleep_impact', 'sleep_quality', 'next_day_mood', wLabel),
          type: 'sleep_impact',
          subject: 'sleep_quality',
          relatedSubject: 'next_day_mood',
          window: wLabel,
          supportCount: lowQualityNextMoods.length,
          eligibleCount: qualityDays.length,
          effectSize: qualityEffect,
          payload: {
            avgNextDayMoodAfterCondition: parseFloat(mean(lowQualityNextMoods).toFixed(2)),
            avgNextDayMoodBaseline: parseFloat(mean(highQualityNextMoods).toFixed(2)),
            subjectDayKeys: lowQualityDayKeys,
            direction: qualityEffect < 0 ? 'draining' : 'neutral',
          },
        });
      }
    }
  }

  return candidates;
}

// ─────────────────────────────────────────────────────────────────────────────
// F. State Correlation Candidates
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Test correlations between numeric signal pairs:
 * mood–energy, mood–stress, sleep–mood, sleep–energy, energy–stress.
 * Requires ≥7 data points per pair.
 */
export function findStateCorrelationCandidates(
  records: DailySignalRecord[],
  win: number,
): PatternCandidate[] {
  const window = inWindow(records, win);
  const wLabel = windowLabel(win);
  if (window.length < 7) return [];

  const pairs: Array<{
    labelA: string;
    labelB: string;
    subjectKey: string;
    relatedKey: string;
    getA: (r: DailySignalRecord) => number | undefined;
    getB: (r: DailySignalRecord) => number | undefined;
  }> = [
    { labelA: 'mood', labelB: 'energy', subjectKey: 'mood', relatedKey: 'energy', getA: r => r.mood, getB: r => r.energy },
    { labelA: 'mood', labelB: 'stress', subjectKey: 'mood', relatedKey: 'stress', getA: r => r.mood, getB: r => r.stress },
    { labelA: 'energy', labelB: 'stress', subjectKey: 'energy', relatedKey: 'stress', getA: r => r.energy, getB: r => r.stress },
    { labelA: 'sleep', labelB: 'mood', subjectKey: 'sleep_hours', relatedKey: 'mood', getA: r => r.sleepHours, getB: r => r.mood },
    { labelA: 'sleep', labelB: 'energy', subjectKey: 'sleep_hours', relatedKey: 'energy', getA: r => r.sleepHours, getB: r => r.energy },
  ];

  const candidates: PatternCandidate[] = [];

  for (const pair of pairs) {
    const paired = window.filter(r => pair.getA(r) !== undefined && pair.getB(r) !== undefined);
    if (paired.length < 7) continue;

    const xs = paired.map(r => pair.getA(r)!);
    const ys = paired.map(r => pair.getB(r)!);
    const r = pearsonCorrelation(xs, ys);

    // Only keep if there is at least a moderate relationship
    if (Math.abs(r) < 0.3) continue;

    candidates.push({
      id: candidateId('state_correlation', pair.subjectKey, pair.relatedKey, wLabel),
      type: 'state_correlation',
      subject: pair.subjectKey,
      relatedSubject: pair.relatedKey,
      window: wLabel,
      supportCount: paired.length,
      eligibleCount: window.length,
      effectSize: r,
      payload: {
        correlation: parseFloat(r.toFixed(3)),
        overallMoodAvg: mean(window.filter(r2 => r2.mood !== undefined).map(r2 => r2.mood!)),
        direction: r > 0 ? 'restorative' : 'draining',
      },
    });
  }

  return candidates;
}

// ─────────────────────────────────────────────────────────────────────────────
// G. Sentiment Mismatch Candidates
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Detect days where mood score and journal sentiment conflict.
 * High mood + negative language, or low mood + positive language.
 * Requires ≥5 journal days.
 */
export function findSentimentMismatchCandidates(
  records: DailySignalRecord[],
  win: number,
): PatternCandidate[] {
  const window = inWindow(records, win);
  const wLabel = windowLabel(win);

  const journalDays = window.filter(r =>
    r.mood !== undefined && r.journalSentiment !== undefined && r.hasJournal
  );
  if (journalDays.length < 5) return [];

  const mismatchDays = journalDays.filter(r => r.isMoodToneMismatch);
  if (mismatchDays.length < 3) return [];

  // Average magnitude of mismatch
  const magnitudes = mismatchDays.map(r => {
    const normalizedMood = ((r.mood ?? 5) - 1) / 8;
    const normalizedSentiment = ((r.journalSentiment ?? 0) + 1) / 2;
    return Math.abs(normalizedMood - normalizedSentiment);
  });
  const avgMagnitude = mean(magnitudes);

  // Only worth surfacing if: ≥3 mismatch days and ≥30% of journal days are mismatched
  const mismatchRate = mismatchDays.length / journalDays.length;
  if (mismatchRate < 0.25 && mismatchDays.length < 4) return [];

  return [
    {
      id: candidateId('sentiment_mismatch', 'mood_vs_language', undefined, wLabel),
      type: 'sentiment_mismatch',
      subject: 'mood_vs_language',
      window: wLabel,
      supportCount: mismatchDays.length,
      eligibleCount: journalDays.length,
      effectSize: avgMagnitude,
      payload: {
        mismatchDayCount: mismatchDays.length,
        avgMismatchMagnitude: parseFloat(avgMagnitude.toFixed(3)),
        baselineRate: parseFloat(mismatchRate.toFixed(3)),
        subjectDayKeys: mismatchDays.map(r => r.dayKey),
        direction: 'neutral',
      },
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// H. Co-Occurrence Candidates
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Find keyword/tag pairs that repeatedly co-occur (pairLift above threshold).
 * Requires ≥3 co-occurrences.
 */
export function findCoOccurrenceCandidates(
  records: DailySignalRecord[],
  win: number,
): PatternCandidate[] {
  const window = inWindow(records, win);
  const wLabel = windowLabel(win);
  if (window.length < 10) return [];

  const journalDays = window.filter(r => r.hasJournal && r.journalKeywords.length > 0);
  if (journalDays.length < 5) return [];

  // Collect all concepts (keywords + tags normalized as 'kw:...' / 'tag:...')
  const conceptDays = new Map<string, string[]>(); // concept → dayKeys

  for (const r of journalDays) {
    const concepts: string[] = [
      ...r.journalKeywords.map(kw => `kw:${kw}`),
      ...r.tags.map(t => `tag:${t}`),
    ];
    for (const c of concepts) {
      if (!conceptDays.has(c)) conceptDays.set(c, []);
      conceptDays.get(c)!.push(r.dayKey);
    }
  }

  const concepts = [...conceptDays.keys()].filter(c => (conceptDays.get(c)?.length ?? 0) >= 3);
  if (concepts.length < 2) return [];

  const candidates: PatternCandidate[] = [];
  const n = journalDays.length;

  // Test all unique pairs
  for (let i = 0; i < concepts.length; i++) {
    for (let j = i + 1; j < concepts.length; j++) {
      const cA = concepts[i];
      const cB = concepts[j];
      const daysA = new Set(conceptDays.get(cA) ?? []);
      const daysB = new Set(conceptDays.get(cB) ?? []);

      const coOccurringDays = [...daysA].filter(d => daysB.has(d));
      if (coOccurringDays.length < 3) continue;

      const pA = daysA.size / n;
      const pB = daysB.size / n;
      const pAB = coOccurringDays.length / n;
      const expectedIfIndependent = pA * pB;
      const pairLift = expectedIfIndependent > 0 ? pAB / expectedIfIndependent : 0;

      // Only surface pairs with meaningful lift and at least 3 co-occurrences
      if (pairLift < 1.8) continue;

      const subjectLabel = cA.replace(/^(kw:|tag:)/, '');
      const relatedLabel = cB.replace(/^(kw:|tag:)/, '');

      // Check mood context: are these co-occurrences on hard days?
      const coMoods = journalDays
        .filter(r => coOccurringDays.includes(r.dayKey) && r.mood !== undefined)
        .map(r => r.mood!);
      const overallMoodAvg = mean(journalDays.filter(r => r.mood !== undefined).map(r => r.mood!));

      candidates.push({
        id: candidateId('co_occurrence', subjectLabel, relatedLabel, wLabel),
        type: 'co_occurrence',
        subject: subjectLabel,
        relatedSubject: relatedLabel,
        window: wLabel,
        supportCount: coOccurringDays.length,
        eligibleCount: n,
        effectSize: coMoods.length > 0 ? mean(coMoods) - overallMoodAvg : 0,
        payload: {
          pairLift: parseFloat(pairLift.toFixed(3)),
          baselineRate: parseFloat(pAB.toFixed(3)),
          subjectDayKeys: coOccurringDays,
          avgMoodOnSubjectDays: coMoods.length > 0 ? parseFloat(mean(coMoods).toFixed(2)) : undefined,
          overallMoodAvg: parseFloat(overallMoodAvg.toFixed(2)),
          direction: coMoods.length > 0 && (mean(coMoods) - overallMoodAvg) < -0.3 ? 'draining' : 'neutral',
        },
      });
    }
  }

  // Limit to top 10 by pairLift to avoid explosion
  return candidates
    .sort((a, b) => (b.payload.pairLift ?? 0) - (a.payload.pairLift ?? 0))
    .slice(0, 10);
}

// ─────────────────────────────────────────────────────────────────────────────
// Main: generate all candidates across all windows
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Run all candidate generators across standard windows (7d, 30d, 90d).
 * Returns a deduplicated merged list — where the same pattern appears in
 * multiple windows, the wider window's candidate is preferred (more data).
 */
export function generateAllCandidates(records: DailySignalRecord[]): PatternCandidate[] {
  const windows = [90, 30, 7];
  const allCandidates: PatternCandidate[] = [];

  for (const win of windows) {
    const batch: PatternCandidate[] = [
      ...findTagEffectCandidates(records, win),
      ...findKeywordEffectCandidates(records, win),
      ...findPersonEffectCandidates(records, win),
      ...findDreamWakingLinkCandidates(records, win),
      ...findSleepImpactCandidates(records, win),
      ...findStateCorrelationCandidates(records, win),
      ...findSentimentMismatchCandidates(records, win),
      ...findCoOccurrenceCandidates(records, win),
    ];
    allCandidates.push(...batch);
  }

  // Prefer the candidate with the most eligible data when IDs overlap
  const byId = new Map<string, PatternCandidate>();
  for (const c of allCandidates) {
    const existing = byId.get(c.id);
    if (!existing || c.eligibleCount > existing.eligibleCount) {
      byId.set(c.id, c);
    }
  }

  return [...byId.values()];
}
