/**
 * Journal-Enhanced Insights Engine (V3)
 *
 * Adds journal NLP-powered insight cards on top of the existing
 * insightsEngine.ts. All functions are pure — no I/O, no side effects.
 *
 * Relies on DailyAggregate rows produced by the pipeline (which now
 * include keywordsUnion, emotionCountsTotal, sentimentAvg).
 */

import { DailyAggregate, ChartProfile, Element } from '../services/insights/types';
import type { ConfidenceLevel, TrendDirection } from './insightsEngine';
import { regulationStyle } from '../services/insights/chartProfile';
import {
  mean,
  stdDev,
  confidence,
  linearRegression,
} from './stats';

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────

function journalConfidence(
  totalDays: number,
  journalDays: number,
): ConfidenceLevel {
  const base = confidence(totalDays);
  if (journalDays < 6) return 'low';
  return base;
}

function sortByDayKey(aggregates: DailyAggregate[]): DailyAggregate[] {
  return [...aggregates].sort((a, b) => a.dayKey.localeCompare(b.dayKey));
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Trend insights (mood, stress, energy, journal metrics)
// ─────────────────────────────────────────────────────────────────────────────

export interface MetricTrend {
  metric: string;
  direction: TrendDirection;
  slope: number;
  method: 'regression' | 'split_delta';
  displayChange: string;
}

function localLinearRegression(ys: number[]): number {
  return linearRegression(ys).slope;
}

/**
 * Compute trend for a metric series.
 * Uses regression if >= 10 data points, split average delta otherwise.
 *
 * Thresholds:
 *  - Regression: slope > +0.03/day = rising, < -0.03 = falling
 *  - Split delta: delta >= +0.6 = rising, <= -0.6 = falling
 */
export function computeMetricTrend(
  values: number[],
  metricName: string,
): MetricTrend {
  const n = values.length;
  if (n < 2) {
    return {
      metric: metricName,
      direction: 'stable',
      slope: 0,
      method: 'split_delta',
      displayChange: '0',
    };
  }

  let direction: TrendDirection;
  let slopeVal: number;
  let method: 'regression' | 'split_delta';

  if (n >= 10) {
    slopeVal = localLinearRegression(values); // per-day slope
    method = 'regression';
    direction =
      slopeVal > 0.03 ? 'up' : slopeVal < -0.03 ? 'down' : 'stable';
  } else {
    const mid = Math.floor(n / 2);
    const delta = mean(values.slice(mid)) - mean(values.slice(0, mid)); // half-to-half delta
    slopeVal = delta;
    method = 'split_delta';
    direction = delta >= 0.6 ? 'up' : delta <= -0.6 ? 'down' : 'stable';
  }

  // IMPORTANT:
  // - regression slopeVal is per-day => total change approx slopeVal*(n-1)
  // - split_delta slopeVal is already a total delta => do NOT multiply by (n-1)
  const change = method === 'regression' ? slopeVal * (n - 1) : slopeVal;
  const display = change >= 0 ? `+${change.toFixed(1)}` : change.toFixed(1);

  return {
    metric: metricName,
    direction,
    slope: parseFloat(slopeVal.toFixed(4)),
    method,
    displayChange: display,
  };
}

/**
 * Compute trends for all core metrics + journal metrics.
 */
export function computeAllTrends(
  aggregates: DailyAggregate[],
): MetricTrend[] {
  const sorted = sortByDayKey(aggregates);

  return [
    computeMetricTrend(sorted.map(d => d.moodAvg), 'moodAvg'),
    computeMetricTrend(sorted.map(d => d.stressAvg), 'stressAvg'),
    computeMetricTrend(sorted.map(d => d.energyAvg), 'energyAvg'),
    computeMetricTrend(sorted.map(d => d.journalCount), 'journalCount'),
    computeMetricTrend(sorted.map(d => d.journalWordCount), 'journalWordCount'),
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Stability and Volatility
// ─────────────────────────────────────────────────────────────────────────────

export interface VolatilityResult {
  metric: string;
  stddev: number;
  level: 'low' | 'moderate' | 'high';
}

export function computeVolatility(
  values: number[],
  metricName: string,
  thresholds: { low: number; high: number } = { low: 1.2, high: 2.2 },
): VolatilityResult {
  if (values.length < 2) {
    return { metric: metricName, stddev: 0, level: 'low' };
  }

  const sd = stdDev(values);
  const safe = Number.isFinite(sd) ? sd : 0;
  const level =
    safe <= thresholds.low ? 'low' : safe <= thresholds.high ? 'moderate' : 'high';

  return {
    metric: metricName,
    stddev: parseFloat(safe.toFixed(2)),
    level,
  };
}

export function computeAllVolatility(
  aggregates: DailyAggregate[],
): VolatilityResult[] {
  const results: VolatilityResult[] = [
    computeVolatility(aggregates.map(d => d.moodAvg), 'mood'),
    computeVolatility(aggregates.map(d => d.stressAvg), 'stress'),
  ];

  const sentiments = aggregates
    .filter(d => d.sentimentAvg !== null)
    .map(d => d.sentimentAvg!);

  if (sentiments.length >= 5) {
    results.push(
      computeVolatility(sentiments, 'sentiment', { low: 0.3, high: 0.6 }),
    );
  }

  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Restores & Drains — Keyword Lift + Emotion Bucket Lift
// ─────────────────────────────────────────────────────────────────────────────

export interface LiftItem {
  label: string;
  lift: number;
  bestRate: number;
  hardRate: number;
  totalDays: number;
}

export interface RestoreDrainResult {
  restores: LiftItem[];
  drains: LiftItem[];
  hasData: boolean;
  confidence: ConfidenceLevel;
}

function splitBestHard(
  aggregates: DailyAggregate[],
): { bestDays: DailyAggregate[]; hardDays: DailyAggregate[] } | null {
  const n = aggregates.length;
  if (n < 10) return null;

  const topN = Math.max(1, Math.ceil(n * 0.2));

  // Best = top 20% by mood
  const byMood = [...aggregates].sort((a, b) => b.moodAvg - a.moodAvg);
  const bestDays = byMood.slice(0, topN);

  // Hard = top 20% by stress OR bottom 20% by mood (union)
  const byStress = [...aggregates].sort((a, b) => b.stressAvg - a.stressAvg);
  const hardByStress = new Set(byStress.slice(0, topN).map(d => d.dayKey));
  const hardByMood = new Set(byMood.slice(-topN).map(d => d.dayKey));
  const hardIds = new Set([...hardByStress, ...hardByMood]);
  const hardDays = aggregates.filter(d => hardIds.has(d.dayKey));

  if (bestDays.length < 3 || hardDays.length < 3) return null;

  return { bestDays, hardDays };
}

/**
 * 7B. Keyword lift: which journal keywords appear more on best vs hard days.
 */
export function computeKeywordLift(
  aggregates: DailyAggregate[],
): RestoreDrainResult {
  const split = splitBestHard(aggregates);
  if (!split) {
    return { restores: [], drains: [], hasData: false, confidence: 'low' };
  }

  const { bestDays, hardDays } = split;

  const keywordDayCounts: Record<string, number> = {};
  for (const d of aggregates) {
    for (const kw of d.keywordsUnion) {
      keywordDayCounts[kw] = (keywordDayCounts[kw] ?? 0) + 1;
    }
  }

  const items: LiftItem[] = [];
  for (const [kw, totalDays] of Object.entries(keywordDayCounts)) {
    if (totalDays < 4) continue;

    const bestRate =
      bestDays.filter(d => d.keywordsUnion.includes(kw)).length / bestDays.length;
    const hardRate =
      hardDays.filter(d => d.keywordsUnion.includes(kw)).length / hardDays.length;
    const lift = bestRate - hardRate;

    if (Math.abs(lift) >= 0.2) {
      items.push({ label: kw, lift, bestRate, hardRate, totalDays });
    }
  }

  const restores = items
    .filter(i => i.lift > 0)
    .sort((a, b) => b.lift - a.lift)
    .slice(0, 3);

  const drains = items
    .filter(i => i.lift < 0)
    .sort((a, b) => a.lift - b.lift)
    .slice(0, 3);

  const jDays = aggregates.filter(d => d.journalCount > 0).length;
  return {
    restores,
    drains,
    hasData: restores.length > 0 || drains.length > 0,
    confidence: journalConfidence(aggregates.length, jDays),
  };
}

/**
 * 7C. Emotion bucket lift: which emotion categories appear more on hard days.
 */
export interface EmotionLiftItem {
  category: string;
  lift: number;
  bestPresence: number;
  hardPresence: number;
  insight: string;
}

export function computeEmotionBucketLift(
  aggregates: DailyAggregate[],
): EmotionLiftItem[] {
  const split = splitBestHard(aggregates);
  if (!split) return [];

  const { bestDays, hardDays } = split;

  const categories = ['anxiety', 'sadness', 'anger', 'calm', 'joy', 'fatigue', 'stress'];
  const results: EmotionLiftItem[] = [];

  for (const cat of categories) {
    const bestPresence =
      bestDays.filter(d => (d.emotionCountsTotal[cat] ?? 0) >= 2).length /
      bestDays.length;
    const hardPresence =
      hardDays.filter(d => (d.emotionCountsTotal[cat] ?? 0) >= 2).length /
      hardDays.length;
    const lift = bestPresence - hardPresence;

    if (Math.abs(lift) >= 0.15) {
      const direction = lift > 0 ? 'best' : 'hardest';
      results.push({
        category: cat,
        lift,
        bestPresence,
        hardPresence,
        insight: `${capitalize(cat)} language appears more on your ${direction} days.`,
      });
    }
  }

  return results.sort((a, b) => Math.abs(b.lift) - Math.abs(a.lift));
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. Journal Impact Calculations
// ─────────────────────────────────────────────────────────────────────────────

export interface JournalImpactCard {
  type: 'journaling_vs_not' | 'writing_intensity' | 'weekly_consistency';
  insight: string;
  stat: string;
  confidence: ConfidenceLevel;
  data: Record<string, number>;
}

/**
 * 8A. Journaling days vs non-journaling days.
 */
export function computeJournalingImpact(
  aggregates: DailyAggregate[],
): JournalImpactCard | null {
  const journalDays = aggregates.filter(d => d.journalCount >= 1);
  const noJournalDays = aggregates.filter(d => d.journalCount === 0);

  if (journalDays.length < 6 || noJournalDays.length < 6) return null;

  const avgMoodJournal = mean(journalDays.map(d => d.moodAvg));
  const avgMoodNoJournal = mean(noJournalDays.map(d => d.moodAvg));
  const diffMood = avgMoodJournal - avgMoodNoJournal;

  const avgStressJournal = mean(journalDays.map(d => d.stressAvg));
  const avgStressNoJournal = mean(noJournalDays.map(d => d.stressAvg));
  const diffStress = avgStressJournal - avgStressNoJournal;

  if (Math.abs(diffMood) < 0.5 && Math.abs(diffStress) < 0.5) return null;

  let insight: string;
  if (diffMood >= 0.5) {
    insight = 'Days you journal tend to be calmer.';
  } else if (diffMood <= -0.5) {
    insight = 'You tend to journal on harder days — that\'s the practice working.';
  } else if (diffStress <= -0.5) {
    insight = 'Journaling days show lower stress on average.';
  } else {
    insight = 'Journaling days show higher stress — you process when it matters.';
  }

  return {
    type: 'journaling_vs_not',
    insight,
    stat: `Mood ${diffMood >= 0 ? '+' : ''}${diffMood.toFixed(1)} on journaling days`,
    confidence: journalConfidence(aggregates.length, journalDays.length),
    data: {
      avgMoodJournal: parseFloat(avgMoodJournal.toFixed(1)),
      avgMoodNoJournal: parseFloat(avgMoodNoJournal.toFixed(1)),
      diffMood: parseFloat(diffMood.toFixed(1)),
      avgStressJournal: parseFloat(avgStressJournal.toFixed(1)),
      avgStressNoJournal: parseFloat(avgStressNoJournal.toFixed(1)),
      diffStress: parseFloat(diffStress.toFixed(1)),
    },
  };
}

/**
 * 8B. Writing intensity effect on mood.
 */
export function computeWritingIntensityEffect(
  aggregates: DailyAggregate[],
): JournalImpactCard | null {
  const withJournal = aggregates.filter(d => d.journalCount >= 1);

  const low = withJournal.filter(d => d.journalWordCount < 80);
  const medium = withJournal.filter(
    d => d.journalWordCount >= 80 && d.journalWordCount <= 250,
  );
  const high = withJournal.filter(d => d.journalWordCount > 250);

  if (low.length < 4 || medium.length < 4 || high.length < 4) return null;

  const moodLow = mean(low.map(d => d.moodAvg));
  const moodMed = mean(medium.map(d => d.moodAvg));
  const moodHigh = mean(high.map(d => d.moodAvg));

  const volLow = stdDev(low.map(d => d.moodAvg));
  const volHigh = stdDev(high.map(d => d.moodAvg));

  let insight: string;
  if (moodHigh - moodLow >= 0.5) {
    insight = 'Longer reflections correlate with steadier mood.';
  } else if (moodLow - moodHigh >= 0.5) {
    insight = 'Shorter entries tend to come on calmer days — longer ones signal deeper processing.';
  } else if (volLow - volHigh >= 0.3) {
    insight = 'Writing more tends to stabilize your emotional range.';
  } else {
    insight = 'Writing length varies, but its presence matters more than its depth.';
  }

  return {
    type: 'writing_intensity',
    insight,
    stat: `Mood: short ${moodLow.toFixed(1)} · medium ${moodMed.toFixed(1)} · long ${moodHigh.toFixed(1)}`,
    confidence: journalConfidence(aggregates.length, withJournal.length),
    data: {
      moodLow: parseFloat(moodLow.toFixed(1)),
      moodMed: parseFloat(moodMed.toFixed(1)),
      moodHigh: parseFloat(moodHigh.toFixed(1)),
      countLow: low.length,
      countMed: medium.length,
      countHigh: high.length,
    },
  };
}

/**
 * 8C. Weekly journal consistency impact.
 */
export function computeWeeklyConsistency(
  aggregates: DailyAggregate[],
): JournalImpactCard | null {
  const weekMap = new Map<string, DailyAggregate[]>();
  for (const d of aggregates) {
    const wk = isoWeekKey(d.dayKey);
    if (!weekMap.has(wk)) weekMap.set(wk, []);
    weekMap.get(wk)!.push(d);
  }

  if (weekMap.size < 3) return null;

  const consistentWeeks: { moods: number[]; vol: number }[] = [];
  const inconsistentWeeks: { moods: number[]; vol: number }[] = [];

  for (const [, days] of weekMap) {
    const journalDaysCount = days.filter(d => d.journalCount >= 1).length;
    const moods = days.map(d => d.moodAvg);
    const vol = stdDev(moods);

    if (journalDaysCount >= 3) {
      consistentWeeks.push({ moods, vol });
    } else {
      inconsistentWeeks.push({ moods, vol });
    }
  }

  if (consistentWeeks.length < 1 || inconsistentWeeks.length < 1) return null;

  const volConsistent = mean(consistentWeeks.map(w => w.vol));
  const volInconsistent = mean(inconsistentWeeks.map(w => w.vol));
  const moodConsistent = mean(consistentWeeks.flatMap(w => w.moods));
  const moodInconsistent = mean(inconsistentWeeks.flatMap(w => w.moods));

  const volDiff = volInconsistent - volConsistent;

  let insight: string;
  if (volDiff > 0.3) {
    insight = 'Weeks you journal 3+ times tend to feel steadier.';
  } else if (moodConsistent - moodInconsistent > 0.4) {
    insight = 'Consistent journaling weeks have a higher average mood.';
  } else {
    insight = 'Journaling consistency varies — more data will reveal clearer patterns.';
  }

  return {
    type: 'weekly_consistency',
    insight,
    stat: `Volatility ${volConsistent.toFixed(1)} vs ${volInconsistent.toFixed(1)}`,
    confidence: journalConfidence(
      aggregates.length,
      aggregates.filter(d => d.journalCount >= 1).length,
    ),
    data: {
      volConsistent: parseFloat(volConsistent.toFixed(2)),
      volInconsistent: parseFloat(volInconsistent.toFixed(2)),
      moodConsistent: parseFloat(moodConsistent.toFixed(1)),
      moodInconsistent: parseFloat(moodInconsistent.toFixed(1)),
      consistentWeekCount: consistentWeeks.length,
      inconsistentWeekCount: inconsistentWeeks.length,
    },
  };
}

function isoWeekKey(dayKey: string): string {
  const d = new Date(dayKey + 'T12:00:00');
  const dayNum = d.getDay() || 7;
  d.setDate(d.getDate() + 4 - dayNum);
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7,
  );
  return `${d.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. Time Patterns
// ─────────────────────────────────────────────────────────────────────────────

export interface TimeOfDayBucketV3 {
  label: 'Morning' | 'Afternoon' | 'Evening' | 'Late night';
  count: number;
  avgMood: number;
  avgStress: number;
  avgEnergy: number;
  avgSentiment: number | null;
}

export interface TimePatternCard {
  type: 'time_of_day' | 'day_of_week';
  insight: string;
  stat: string;
  buckets?: TimeOfDayBucketV3[];
  dayData?: { day: string; avgMood: number; avgStress: number }[];
}

type TODLabel = 'Morning' | 'Afternoon' | 'Evening' | 'Late night';

function timeOfDayToLabel(tod: string): TODLabel {
  if (tod === 'morning') return 'Morning';
  if (tod === 'afternoon') return 'Afternoon';
  if (tod === 'evening') return 'Evening';
  return 'Late night'; // 'night' and any unknown value
}

/**
 * 9A. Time of day patterns using the check-in timeOfDay field (not creation timestamp).
 */
export function computeTimeOfDayPatterns(
  aggregates: DailyAggregate[],
): TimePatternCard | null {
  const buckets: Record<TODLabel, { moods: number[]; stresses: number[]; energies: number[] }> = {
    Morning: { moods: [], stresses: [], energies: [] },
    Afternoon: { moods: [], stresses: [], energies: [] },
    Evening: { moods: [], stresses: [], energies: [] },
    'Late night': { moods: [], stresses: [], energies: [] },
  };

  for (const d of aggregates) {
    for (const tod of d.timeOfDayLabels) {
      const label = timeOfDayToLabel(tod);
      buckets[label].moods.push(d.moodAvg);
      buckets[label].stresses.push(d.stressAvg);
      buckets[label].energies.push(d.energyAvg);
    }
  }

  const validBuckets: TimeOfDayBucketV3[] = [];
  for (const label of ['Morning', 'Afternoon', 'Evening', 'Late night'] as TODLabel[]) {
    const b = buckets[label];
    if (b.moods.length >= 5) {
      validBuckets.push({
        label,
        count: b.moods.length,
        avgMood: parseFloat(mean(b.moods).toFixed(1)),
        avgStress: parseFloat(mean(b.stresses).toFixed(1)),
        avgEnergy: parseFloat(mean(b.energies).toFixed(1)),
        avgSentiment: null,
      });
    }
  }

  if (validBuckets.length < 2) return null;

  const worst = [...validBuckets].sort((a, b) => a.avgMood - b.avgMood)[0];
  const best = [...validBuckets].sort((a, b) => b.avgMood - a.avgMood)[0];

  const diff = best.avgMood - worst.avgMood;
  const insight =
    diff >= 0.8
      ? `${worst.label} entries tend to have lower mood.`
      : `Your mood is fairly consistent across times of day.`;

  return {
    type: 'time_of_day',
    insight,
    stat: `${best.label} mood ${best.avgMood} vs ${worst.label} ${worst.avgMood}`,
    buckets: validBuckets,
  };
}

/**
 * 9B. Day of week patterns.
 */
const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export function computeDayOfWeekPatterns(
  aggregates: DailyAggregate[],
): TimePatternCard | null {
  const dayData: Record<number, { moods: number[]; stresses: number[] }> = {};
  for (let i = 0; i < 7; i++) dayData[i] = { moods: [], stresses: [] };

  for (const d of aggregates) {
    dayData[d.dayOfWeek].moods.push(d.moodAvg);
    dayData[d.dayOfWeek].stresses.push(d.stressAvg);
  }

  const validDays = Object.entries(dayData)
    .filter(([, v]) => v.moods.length >= 3)
    .map(([idx, v]) => ({
      day: DAY_NAMES[Number(idx)],
      avgMood: parseFloat(mean(v.moods).toFixed(1)),
      avgStress: parseFloat(mean(v.stresses).toFixed(1)),
      count: v.moods.length,
    }));

  if (validDays.length < 3) return null;

  const overallStress = mean(aggregates.map(d => d.stressAvg));
  const overallMood = mean(aggregates.map(d => d.moodAvg));

  const highStressDays = validDays
    .filter(d => d.avgStress - overallStress >= 0.8)
    .sort((a, b) => b.avgStress - a.avgStress)
    .slice(0, 2);

  const highMoodDays = validDays
    .filter(d => d.avgMood - overallMood >= 0.8)
    .sort((a, b) => b.avgMood - a.avgMood)
    .slice(0, 2);

  let insight: string;
  let stat: string;

  if (highStressDays.length > 0) {
    const names = highStressDays.map(d => d.day).join(' and ');
    insight = `Stress tends to peak on ${names}.`;
    stat = `${highStressDays[0].day} stress avg ${highStressDays[0].avgStress} vs overall ${overallStress.toFixed(1)}`;
  } else if (highMoodDays.length > 0) {
    const names = highMoodDays.map(d => d.day).join(' and ');
    insight = `Your best mood tends to fall on ${names}.`;
    stat = `${highMoodDays[0].day} mood avg ${highMoodDays[0].avgMood} vs overall ${overallMood.toFixed(1)}`;
  } else {
    return null;
  }

  return {
    type: 'day_of_week',
    insight,
    stat,
    dayData: validDays,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. Natal Chart Baseline Calculations
// ─────────────────────────────────────────────────────────────────────────────

export interface ChartBaselineCard {
  type: 'regulation_style' | 'emotional_need' | 'pressure_pattern' | 'healing_theme';
  label: string;
  body: string;
  confidence: ConfidenceLevel;
}

export function computeChartBaselines(
  profile: ChartProfile | null,
): ChartBaselineCard[] {
  if (!profile) return [];

  const cards: ChartBaselineCard[] = [];

  const regStyles: Record<Element, { label: string; body: string }> = {
    Earth: {
      label: 'Regulation through routine',
      body: 'Your Earth-dominant chart responds best to structure, tangible action, and grounding practices. When overwhelmed, simplify rather than add.',
    },
    Water: {
      label: 'Regulation through emotional processing',
      body: 'Your Water-dominant chart processes through feeling, not fixing. Give yourself permission to sit with emotions before solving.',
    },
    Air: {
      label: 'Regulation through expression',
      body: 'Your Air-dominant chart finds relief through talking, journaling, and reframing. Name what\'s circling in your head to release its grip.',
    },
    Fire: {
      label: 'Regulation through movement',
      body: 'Your Fire-dominant chart resets through action, change of scene, and creative expression. Stillness can intensify what movement would release.',
    },
  };

  const reg = regStyles[profile.dominantElement];
  cards.push({
    type: 'regulation_style',
    label: reg.label,
    body: reg.body,
    confidence: 'high',
  });

  if (profile.moonHouse > 0) {
    const moonNeeds: Record<number, { label: string; body: string }> = {
      1: { label: 'Emotional need: being seen', body: 'Your 1st house Moon needs visible self-expression. Suppressing emotions shows quickly — on your face and in your body.' },
      2: { label: 'Emotional need: stability', body: 'Your 2nd house Moon needs comfort and security. Financial or material anxiety hits your emotional core directly.' },
      3: { label: 'Emotional need: communication', body: 'Your 3rd house Moon needs to talk and learn. Mental stimulation is emotional nourishment for you.' },
      4: { label: 'Emotional need: home & safety', body: 'Your 4th house Moon needs a safe emotional foundation. Home literally is where you regulate — disruptions there destabilize everything.' },
      5: { label: 'Emotional need: creative play', body: 'Your 5th house Moon needs heartfelt expression and recognition. Joy is not a luxury — it\'s a requirement.' },
      6: { label: 'Emotional need: routine & wellness', body: 'Your 6th house Moon needs daily rhythm and purposeful work. When routines break down, so does your emotional baseline.' },
      7: { label: 'Emotional need: connection', body: 'Your 7th house Moon finds regulation through partnership and connection. Isolation drains faster than conflict.' },
      8: { label: 'Emotional need: depth & trust', body: 'Your 8th house Moon needs authenticity and transformative depth. Surface-level connection leaves you emptier.' },
      9: { label: 'Emotional need: meaning', body: 'Your 9th house Moon needs freedom and expanded vision. Feeling trapped — in routine or obligation — is your most reliable drain.' },
      10: { label: 'Emotional need: purpose', body: 'Your 10th house Moon needs achievement and external contribution. Purposelessness hits your emotional core.' },
      11: { label: 'Emotional need: belonging', body: 'Your 11th house Moon needs community and shared ideals. Feeling like an outsider depletes you more than most realize.' },
      12: { label: 'Emotional need: solitude & rest', body: 'Your 12th house Moon needs quiet and inner reflection. Time alone to recharge is a genuine need, not avoidance.' },
    };

    const moonCard = moonNeeds[profile.moonHouse];
    if (moonCard) {
      cards.push({
        type: 'emotional_need',
        label: moonCard.label,
        body: moonCard.body,
        confidence: 'high',
      });
    }
  }

  const saturnPatterns: Record<string, string> = {
    Capricorn: 'discipline and authentic achievement over obligation',
    Virgo: 'discernment without perfectionism',
    Scorpio: 'surrender and trust over control',
    Aries: 'patient self-reliance and independent action',
    Taurus: 'self-worth beyond material security',
    Gemini: 'depth and focus over breadth',
    Cancer: 'emotional self-reliance',
    Leo: 'authentic expression without needing approval',
    Libra: 'decisive action over endless balancing',
    Sagittarius: 'committed depth over restless searching',
    Aquarius: 'expressing originality within community',
    Pisces: 'boundaries and spiritual discipline',
  };

  const saturnBody = saturnPatterns[profile.saturnSign];
  if (saturnBody) {
    cards.push({
      type: 'pressure_pattern',
      label: `Saturn growth edge: ${saturnBody}`,
      body: `Your Saturn in ${profile.saturnSign} asks you to grow through ${saturnBody}. This is a lifelong practice, not a problem to solve.`,
      confidence: 'high',
    });
  }

  if (profile.chironSign) {
    const chironThemes: Record<string, string> = {
      Aries: 'reclaiming boldness and identity',
      Taurus: 'owning your worth and needs',
      Gemini: 'being heard and believed',
      Cancer: 'receiving care as readily as you give it',
      Leo: 'shining without earning the light',
      Virgo: 'being enough before doing anything',
      Libra: 'modeling the fairness you deserved',
      Scorpio: 'choosing depth again with discernment',
      Sagittarius: 'trusting your own truth',
      Capricorn: 'building on your terms, not earned approval',
      Aquarius: 'your difference is your contribution',
      Pisces: 'knowing your own ground and returning to it',
    };

    const chironBody = chironThemes[profile.chironSign];
    if (chironBody) {
      cards.push({
        type: 'healing_theme',
        label: `Healing theme: ${chironBody}`,
        body: `Your Chiron in ${profile.chironSign} marks where wound and gift overlap. The long arc of healing is ${chironBody}.`,
        confidence: 'high',
      });
    }
  }

  return cards;
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. Blended Insights (connects everything)
// ─────────────────────────────────────────────────────────────────────────────

export interface BlendedInsightCard {
  title: string;
  body: string;
  stat: string;
  confidence: ConfidenceLevel;
  journalPrompt: string;
  sources: string[];
}

export function computeBlendedInsights(
  aggregates: DailyAggregate[],
  trends: MetricTrend[],
  volatility: VolatilityResult[],
  profile: ChartProfile | null,
): BlendedInsightCard[] {
  const cards: BlendedInsightCard[] = [];
  const n = aggregates.length;
  if (n < 7 || !profile) return cards;

  // Ensure "recent 7 days" actually means recent
  const sorted = sortByDayKey(aggregates);
  const recentDays = sorted.slice(-7);

  const conf = confidence(n);
  const baseStat = `Based on ${n} days`;

  const stressTrend = trends.find(t => t.metric === 'stressAvg');
  const moodTrend = trends.find(t => t.metric === 'moodAvg');
  const moodVol = volatility.find(v => v.metric === 'mood');

  const recentEmotions: Record<string, number> = {};
  for (const d of recentDays) {
    for (const [cat, count] of Object.entries(d.emotionCountsTotal || {})) {
      recentEmotions[cat] = (recentEmotions[cat] ?? 0) + (count ?? 0);
    }
  }

  const hasFatigue = (recentEmotions.fatigue ?? 0) >= 3;
  const hasAnxiety = (recentEmotions.anxiety ?? 0) >= 3;
  const hasJoy = (recentEmotions.joy ?? 0) >= 3;
  const hasCalm = (recentEmotions.calm ?? 0) >= 3;

  const regStyle = regulationStyle(profile.dominantElement);

  // Rule 1: Stress up + fatigue/anxiety in journal
  if (stressTrend?.direction === 'up' && (hasFatigue || hasAnxiety)) {
    const emotionWord = hasFatigue ? 'fatigue' : 'anxiety';
    const suggestions: Record<Element, string> = {
      Earth: 'Try one small routine reset today — simplify your schedule, not add to it.',
      Water: 'Gentle processing is the path — reduce stimulation and let yourself feel without fixing.',
      Air: 'Write it out or talk with a trusted person. Name what\'s circling to release its grip.',
      Fire: 'A short movement reset — even 10 minutes — tends to break the loop for you.',
    };

    cards.push({
      title: 'Where It Connects',
      body: `Stress has been elevated and your writing shows more ${emotionWord} themes. Your chart suggests you regulate best through ${regStyle}. ${suggestions[profile.dominantElement]}`,
      stat: `Stress trend: ↑ ${stressTrend.displayChange} · ${capitalize(emotionWord)} in recent entries · ${baseStat}`,
      confidence: conf,
      journalPrompt: 'What is one thing I could simplify or release today?',
      sources: ['stress_trend', `journal_${emotionWord}`, 'chart_element'],
    });
  }

  // Rule 2: Mood down + no journaling recently
  const recentJournalDays = recentDays.filter(d => d.journalCount >= 1).length;
  if (moodTrend?.direction === 'down' && recentJournalDays <= 1) {
    cards.push({
      title: 'A Small Practice',
      body: `Your mood has been dipping and journaling has been sparse this week. Even a short nightly reflection — 3 sentences about what you noticed — can interrupt the drift. Your ${profile.dominantElement} nature processes best through ${regStyle}.`,
      stat: `Mood trend: ↓ ${moodTrend.displayChange} · ${recentJournalDays} journal days this week · ${baseStat}`,
      confidence: conf,
      journalPrompt: 'Three things I noticed about today — even small ones.',
      sources: ['mood_trend', 'journal_frequency', 'chart_element'],
    });
  }

  // Rule 3: High volatility + frequent emotion words
  if (moodVol?.level === 'high' && Object.values(recentEmotions).some(v => v >= 4)) {
    const topEmotion = Object.entries(recentEmotions).sort((a, b) => b[1] - a[1])[0];

    cards.push({
      title: 'The Emotional Weather',
      body: `Your mood has had notable swings and ${topEmotion[0]} language has been prominent in your writing. This isn't a problem to fix — it's a signal to soften your schedule and honor where you are.`,
      stat: `Mood volatility: ${moodVol.stddev.toFixed(1)} · ${capitalize(topEmotion[0])} count: ${topEmotion[1]} this week · ${baseStat}`,
      confidence: conf,
      journalPrompt: 'What do I need less of right now?',
      sources: ['mood_volatility', `journal_${topEmotion[0]}`, 'chart_element'],
    });
  }

  // Rule 4: Mood up + joy/calm in journal → affirm
  if (moodTrend?.direction === 'up' && stressTrend?.direction !== 'up' && (hasJoy || hasCalm)) {
    const positiveWord = hasJoy ? 'joy' : 'calm';
    cards.push({
      title: 'What\'s Working',
      body: `Your mood has been trending upward and ${positiveWord} themes are surfacing in your writing. Your ${profile.dominantElement} nature is finding its rhythm. Notice what you've been doing differently — these conditions are worth protecting.`,
      stat: `Mood trend: ↑ ${moodTrend.displayChange} · ${capitalize(positiveWord)} in recent entries · ${baseStat}`,
      confidence: conf,
      journalPrompt: 'What has felt genuinely good lately — even in small ways?',
      sources: ['mood_trend', `journal_${positiveWord}`, 'chart_element'],
    });
  }

  // Rule 5: Stress stable + consistent journaling → encouragement
  if (stressTrend?.direction === 'stable' && moodTrend?.direction !== 'down' && recentJournalDays >= 3) {
    cards.push({
      title: 'Steady Ground',
      body: `Your patterns have been stable and you've been journaling consistently this week. This is a good moment to notice what sustains you — so you remember it when things get heavier.`,
      stat: `Stress: stable · ${recentJournalDays}/7 journal days · ${baseStat}`,
      confidence: conf,
      journalPrompt: 'What does "feeling like myself" actually look like right now?',
      sources: ['stress_trend', 'journal_consistency'],
    });
  }

  if (cards.length === 0) {
    cards.push({
      title: 'Baseline Reflection',
      body: `Your ${profile.dominantElement} chart and current patterns suggest a relatively steady period. Your regulation style — ${regStyle} — is your anchor when things shift.`,
      stat: `${profile.dominantElement} dominant · ${baseStat}`,
      confidence: conf,
      journalPrompt: 'What does "feeling like myself" actually look like right now?',
      sources: ['chart_element'],
    });
  }

  return cards;
}

// ─────────────────────────────────────────────────────────────────────────────
// 13. Emotion Tone Shift (keyword themes + emotion bucket deltas)
// ─────────────────────────────────────────────────────────────────────────────

export interface EmotionToneShiftCard {
  rising: { category: string; delta: number }[];
  falling: { category: string; delta: number }[];
  insight: string;
  stat: string;
}

export function computeEmotionToneShift(
  aggregates: DailyAggregate[],
): EmotionToneShiftCard | null {
  const sorted = sortByDayKey(aggregates);
  const n = sorted.length;
  if (n < 10) return null;

  const mid = Math.floor(n / 2);
  const firstHalf = sorted.slice(0, mid);
  const secondHalf = sorted.slice(mid);

  function bucketRates(days: DailyAggregate[]): Record<string, number> {
    const sums: Record<string, number> = {};
    let total = 0;
    for (const d of days) {
      for (const [cat, count] of Object.entries(d.emotionCountsTotal || {})) {
        const c = count ?? 0;
        sums[cat] = (sums[cat] ?? 0) + c;
        total += c;
      }
    }
    if (total === 0) return {};
    const rates: Record<string, number> = {};
    for (const [cat, sum] of Object.entries(sums)) {
      rates[cat] = sum / total;
    }
    return rates;
  }

  const firstRates = bucketRates(firstHalf);
  const secondRates = bucketRates(secondHalf);

  if (Object.keys(firstRates).length === 0 && Object.keys(secondRates).length === 0) {
    return null;
  }

  const allCats = new Set([...Object.keys(firstRates), ...Object.keys(secondRates)]);
  const rising: { category: string; delta: number }[] = [];
  const falling: { category: string; delta: number }[] = [];

  for (const cat of allCats) {
    const delta = (secondRates[cat] ?? 0) - (firstRates[cat] ?? 0);
    if (delta >= 0.1) rising.push({ category: cat, delta: parseFloat(delta.toFixed(2)) });
    if (delta <= -0.1) falling.push({ category: cat, delta: parseFloat(delta.toFixed(2)) });
  }

  rising.sort((a, b) => b.delta - a.delta);
  falling.sort((a, b) => a.delta - b.delta);

  if (rising.length === 0 && falling.length === 0) return null;

  const risingSummary = rising.slice(0, 2).map(r => capitalize(r.category)).join(', ');
  const fallingSummary = falling.slice(0, 2).map(f => capitalize(f.category)).join(', ');

  let insight: string;
  if (rising.length > 0 && falling.length > 0) {
    insight = `${risingSummary} language has increased while ${fallingSummary} has decreased.`;
  } else if (rising.length > 0) {
    insight = `${risingSummary} themes have become more prominent in your writing.`;
  } else {
    insight = `${fallingSummary} themes have eased noticeably.`;
  }

  return {
    rising: rising.slice(0, 3),
    falling: falling.slice(0, 3),
    insight,
    stat: `Comparing first and second halves of ${n} days`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Keyword Themes Card (recent top keywords)
// ─────────────────────────────────────────────────────────────────────────────

export interface KeywordThemesCard {
  topKeywords: { word: string; dayCount: number }[];
  insight: string;
  sampleSize: number;
}

export function computeKeywordThemes(
  aggregates: DailyAggregate[],
): KeywordThemesCard | null {
  const jDays = aggregates.filter(d => d.keywordsUnion.length > 0);
  if (jDays.length < 3) return null;

  const keywordDayCounts: Record<string, number> = {};
  for (const d of jDays) {
    for (const kw of d.keywordsUnion) {
      keywordDayCounts[kw] = (keywordDayCounts[kw] ?? 0) + 1;
    }
  }

  const top = Object.entries(keywordDayCounts)
    .filter(([, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([word, dayCount]) => ({ word, dayCount }));

  if (top.length < 2) return null;

  const words = top.slice(0, 5).map(t => t.word);

  return {
    topKeywords: top,
    insight: `Common themes lately: ${words.join(', ')}`,
    sampleSize: jDays.length,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Full V3 Enhanced Bundle
// ─────────────────────────────────────────────────────────────────────────────

export interface EnhancedInsightBundle {
  trends: MetricTrend[];
  volatility: VolatilityResult[];
  keywordLift: RestoreDrainResult;
  emotionBucketLift: EmotionLiftItem[];
  emotionToneShift: EmotionToneShiftCard | null;
  keywordThemes: KeywordThemesCard | null;
  journalImpact: JournalImpactCard[];
  timePatterns: TimePatternCard[];
  chartBaselines: ChartBaselineCard[];
  blended: BlendedInsightCard[];
  confidence: ConfidenceLevel;
  sampleSize: number;
  journalDays: number;
}

/**
 * Compute the full V3 enhanced insight bundle from daily aggregates
 * and chart profile. This is the main entry point.
 */
export function computeEnhancedInsights(
  aggregates: DailyAggregate[],
  profile: ChartProfile | null,
): EnhancedInsightBundle {
  const sorted = sortByDayKey(aggregates);

  const n = sorted.length;
  const journalDays = sorted.filter(d => d.journalCount >= 1).length;

  const trends = computeAllTrends(sorted);
  const volatility = computeAllVolatility(sorted);
  const keywordLift = computeKeywordLift(sorted);
  const emotionBucketLift = computeEmotionBucketLift(sorted);
  const emotionToneShift = computeEmotionToneShift(sorted);
  const keywordThemes = computeKeywordThemes(sorted);

  const journalImpact: JournalImpactCard[] = [];
  const ji = computeJournalingImpact(sorted);
  if (ji) journalImpact.push(ji);
  const wi = computeWritingIntensityEffect(sorted);
  if (wi) journalImpact.push(wi);
  const wc = computeWeeklyConsistency(sorted);
  if (wc) journalImpact.push(wc);

  const timePatterns: TimePatternCard[] = [];
  const tod = computeTimeOfDayPatterns(sorted);
  if (tod) timePatterns.push(tod);
  const dow = computeDayOfWeekPatterns(sorted);
  if (dow) timePatterns.push(dow);

  const chartBaselines = computeChartBaselines(profile);
  const blended = computeBlendedInsights(sorted, trends, volatility, profile);

  return {
    trends,
    volatility,
    keywordLift,
    emotionBucketLift,
    emotionToneShift,
    keywordThemes,
    journalImpact,
    timePatterns,
    chartBaselines,
    blended,
    confidence: confidence(n),
    sampleSize: n,
    journalDays,
  };
}
