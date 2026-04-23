/**
 * Daily Scores — Layer 2 of the Narrative Insights Pipeline
 *
 * Transforms raw DailyAggregate rows into normalized composite scores
 * that make pattern detection meaningful and consistent.
 *
 * Scores computed per day (all 0–100 scale):
 *  - stability:  overall regulation and steadiness
 *  - restoration: how restored vs depleted the day looks
 *  - strain:      pressure and overwhelm accumulation
 *  - emotionalIntensity: activation level of the emotional system
 *  - connection:  relational support vs isolation
 *
 * All functions are pure — no I/O, no side effects.
 */

import { DailyAggregate } from '../services/insights/types';
import { mean } from './stats';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface DailyScores {
  dayKey: string;
  /** Overall regulation and steadiness (0–100, higher = steadier) */
  stability: number;
  /** Restoration vs depletion (0–100, higher = more restored) */
  restoration: number;
  /** Pressure accumulation (0–100, higher = more strain) */
  strain: number;
  /** Emotional activation level (0–100, higher = more activated) */
  emotionalIntensity: number;
  /** Relational support signal (0–100, higher = more connected) */
  connection: number;
}

export interface ScoredDay {
  /** Original aggregate data */
  aggregate: DailyAggregate;
  /** Derived composite scores */
  scores: DailyScores;
}

export interface TrendWindow {
  label: string;
  days: number;
  avg: number;
  direction: 'rising' | 'falling' | 'steady';
  volatility: number;
}

export interface ScoreTrends {
  stability: TrendWindow[];
  restoration: TrendWindow[];
  strain: TrendWindow[];
  emotionalIntensity: TrendWindow[];
  connection: TrendWindow[];
}

export interface Correlation {
  metricA: string;
  metricB: string;
  /** Positive = move together, negative = inverse */
  strength: number;
  /** Number of data points */
  n: number;
  /** Human-readable description */
  label: string;
}

export interface BestHardDayProfile {
  /** Average scores on best/hard days */
  avgStability: number;
  avgRestoration: number;
  avgStrain: number;
  avgEnergy: number;
  avgStress: number;
  avgSleepQuality: number | null;
  /** Most common tags */
  topTags: { tag: string; count: number }[];
  /** Most common emotions */
  topEmotions: { emotion: string; count: number }[];
  /** Number of days in this group */
  dayCount: number;
  /** Average mood */
  avgMood: number;
  /** Journal presence % */
  journalPct: number;
  /** Dream presence % */
  dreamPct: number;
}

export interface PatternProfile {
  scoredDays: ScoredDay[];
  trends: ScoreTrends;
  correlations: Correlation[];
  bestDayProfile: BestHardDayProfile | null;
  hardDayProfile: BestHardDayProfile | null;
  /** Overall averages across full window */
  overallAvg: DailyScores;
  /** Recent 7-day averages */
  recentAvg: DailyScores;
  windowDays: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Normalization helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Scale a value to 0–100 given known min/max. */
function scaleTo100(value: number, min: number, max: number): number {
  if (max <= min) return 50;
  return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
}

/** Inverse scale: high input → low score. */
function inverseScaleTo100(value: number, min: number, max: number): number {
  return 100 - scaleTo100(value, min, max);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

// ─────────────────────────────────────────────────────────────────────────────
// Connection tags
// ─────────────────────────────────────────────────────────────────────────────

const POSITIVE_CONNECTION_TAGS = ['social', 'intimacy', 'relationships', 'family'];
const NEGATIVE_CONNECTION_TAGS = ['loneliness', 'conflict', 'isolation'];

// ─────────────────────────────────────────────────────────────────────────────
// Daily score computation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute composite scores for a single day.
 *
 * Input values from DailyAggregate are on 1–10 scale (mood, energy, stress).
 * Sleep quality is 1–5. Sleep duration in hours.
 */
function computeDayScores(agg: DailyAggregate): DailyScores {
  // Normalize raw values to 0–100
  const moodScore = scaleTo100(agg.moodAvg, 1, 10);
  const energyScore = scaleTo100(agg.energyAvg, 1, 10);
  const inverseStress = inverseScaleTo100(agg.stressAvg, 1, 10);
  const sleepQualityScore = agg.sleepQuality != null
    ? scaleTo100(agg.sleepQuality, 1, 5)
    : 50; // neutral default when no sleep data
  const sleepHoursScore = agg.sleepDurationHours != null
    ? scaleTo100(clamp(agg.sleepDurationHours, 0, 10), 4, 9) // 4h = 0, 9h = 100
    : 50;

  // Connection signal from tags
  const hasPositiveConnection = agg.tagsUnion.some(t => POSITIVE_CONNECTION_TAGS.includes(t));
  const hasNegativeConnection = agg.tagsUnion.some(t => NEGATIVE_CONNECTION_TAGS.includes(t));
  let connectionBase = 50; // neutral
  if (hasPositiveConnection && !hasNegativeConnection) connectionBase = 80;
  else if (hasPositiveConnection && hasNegativeConnection) connectionBase = 55;
  else if (hasNegativeConnection) connectionBase = 25;

  // Overwhelm signal from tags
  const hasOverwhelm = agg.tagsUnion.includes('overwhelm') || agg.tagsUnion.includes('overstimulated');
  const overwhelmScore = hasOverwhelm ? 80 : scaleTo100(agg.stressAvg, 1, 10) * 0.6;

  // ── A. Stability score ──
  const stability = clamp(
    moodScore * 0.30 +
    energyScore * 0.20 +
    sleepQualityScore * 0.20 +
    inverseStress * 0.20 +
    (100 - overwhelmScore) * 0.10,
    0, 100,
  );

  // ── B. Restoration score ──
  const restoration = clamp(
    sleepQualityScore * 0.35 +
    sleepHoursScore * 0.20 +
    energyScore * 0.25 +
    inverseStress * 0.10 +
    connectionBase * 0.10,
    0, 100,
  );

  // ── C. Strain score ──
  const lowEnergyPenalty = 100 - energyScore;
  const poorSleepPenalty = 100 - sleepQualityScore;
  const strain = clamp(
    scaleTo100(agg.stressAvg, 1, 10) * 0.35 +
    overwhelmScore * 0.30 +
    lowEnergyPenalty * 0.20 +
    poorSleepPenalty * 0.15,
    0, 100,
  );

  // ── D. Emotional intensity ──
  const emotionCount = Object.values(agg.journalEmotionCountsTotal)
    .reduce<number>((s, v) => s + (v ?? 0), 0);
  const emotionDensity = scaleTo100(Math.min(emotionCount, 10), 0, 10);
  const sentimentSwing = agg.sentimentAvg != null
    ? scaleTo100(Math.abs(agg.sentimentAvg), 0, 1) // intense sentiment in either direction
    : 30;

  const emotionalIntensity = clamp(
    emotionDensity * 0.35 +
    scaleTo100(agg.stressAvg, 1, 10) * 0.25 +
    overwhelmScore * 0.20 +
    sentimentSwing * 0.20,
    0, 100,
  );

  // ── E. Connection score ──
  const connection = clamp(connectionBase, 0, 100);

  return {
    dayKey: agg.dayKey,
    stability: Math.round(stability),
    restoration: Math.round(restoration),
    strain: Math.round(strain),
    emotionalIntensity: Math.round(emotionalIntensity),
    connection: Math.round(connection),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Trend computation
// ─────────────────────────────────────────────────────────────────────────────

function computeWindowTrend(
  values: number[],
  windowSize: number,
  label: string,
): TrendWindow | null {
  if (values.length < windowSize) return null;

  const windowValues = values.slice(-windowSize);
  const avg = mean(windowValues);

  // Direction: compare recent half vs older half
  const mid = Math.floor(windowValues.length / 2);
  const olderHalf = mean(windowValues.slice(0, mid));
  const newerHalf = mean(windowValues.slice(mid));
  const change = newerHalf - olderHalf;

  let direction: TrendWindow['direction'];
  if (change > 8) direction = 'rising';
  else if (change < -8) direction = 'falling';
  else direction = 'steady';

  // Volatility: average absolute day-to-day change
  let totalChange = 0;
  for (let i = 1; i < windowValues.length; i++) {
    totalChange += Math.abs(windowValues[i] - windowValues[i - 1]);
  }
  const volatility = windowValues.length > 1
    ? totalChange / (windowValues.length - 1)
    : 0;

  return { label, days: windowSize, avg: Math.round(avg), direction, volatility: Math.round(volatility * 10) / 10 };
}

function computeScoreTrends(scoredDays: ScoredDay[]): ScoreTrends {
  const windows: { size: number; label: string }[] = [
    { size: 7, label: '7-day' },
    { size: 14, label: '14-day' },
    { size: 30, label: '30-day' },
  ];

  const build = (extract: (s: DailyScores) => number): TrendWindow[] => {
    const values = scoredDays.map(d => extract(d.scores));
    return windows
      .map(w => computeWindowTrend(values, w.size, w.label))
      .filter((t): t is TrendWindow => t != null);
  };

  return {
    stability: build(s => s.stability),
    restoration: build(s => s.restoration),
    strain: build(s => s.strain),
    emotionalIntensity: build(s => s.emotionalIntensity),
    connection: build(s => s.connection),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Correlation detection
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Simple grouped comparison correlation.
 * Splits data by median of metricA and compares average of metricB.
 */
function groupedCorrelation(
  scoredDays: ScoredDay[],
  extractA: (d: ScoredDay) => number | null,
  extractB: (d: ScoredDay) => number,
  labelA: string,
  labelB: string,
): Correlation | null {
  const valid = scoredDays
    .map(d => ({ a: extractA(d), b: extractB(d) }))
    .filter((v): v is { a: number; b: number } => v.a != null);

  if (valid.length < 7) return null;

  const sortedA = [...valid].sort((x, y) => x.a - y.a);
  const mid = Math.floor(sortedA.length / 2);
  const lowGroup = sortedA.slice(0, mid);
  const highGroup = sortedA.slice(mid);

  if (lowGroup.length < 3 || highGroup.length < 3) return null;

  const lowAvgB = mean(lowGroup.map(v => v.b));
  const highAvgB = mean(highGroup.map(v => v.b));
  const diff = highAvgB - lowAvgB;

  // Normalize strength to roughly -100 to +100
  const strength = clamp(diff, -100, 100);

  if (Math.abs(strength) < 5) return null; // too weak

  const dir = strength > 0 ? 'higher' : 'lower';
  const label = `When ${labelA} is higher, ${labelB} tends to be ${dir}`;

  return { metricA: labelA, metricB: labelB, strength: Math.round(strength), n: valid.length, label };
}

function detectCorrelations(scoredDays: ScoredDay[]): Correlation[] {
  const results: Correlation[] = [];

  // Sleep quality → stability
  const sleepStability = groupedCorrelation(
    scoredDays,
    d => d.aggregate.sleepQuality,
    d => d.scores.stability,
    'sleep quality', 'stability',
  );
  if (sleepStability) results.push(sleepStability);

  // Sleep quality → mood
  const sleepMood = groupedCorrelation(
    scoredDays,
    d => d.aggregate.sleepQuality,
    d => d.aggregate.moodAvg,
    'sleep quality', 'mood',
  );
  if (sleepMood) results.push(sleepMood);

  // Manual lagged correlation (groupedCorrelation can't access prior-day data)
  if (scoredDays.length >= 8) {
    const lagged: { strain: number; nextEnergy: number }[] = [];
    for (let i = 0; i < scoredDays.length - 1; i++) {
      lagged.push({
        strain: scoredDays[i].scores.strain,
        nextEnergy: scoredDays[i + 1].aggregate.energyAvg,
      });
    }
    const sortedLag = [...lagged].sort((a, b) => a.strain - b.strain);
    const mid = Math.floor(sortedLag.length / 2);
    const lowStrain = sortedLag.slice(0, mid);
    const highStrain = sortedLag.slice(mid);
    if (lowStrain.length >= 3 && highStrain.length >= 3) {
      const lowAvg = mean(lowStrain.map(l => l.nextEnergy));
      const highAvg = mean(highStrain.map(l => l.nextEnergy));
      const diff = highAvg - lowAvg;
      if (Math.abs(diff) > 0.3) {
        results.push({
          metricA: 'strain',
          metricB: 'next-day energy',
          strength: Math.round(clamp(diff * 10, -100, 100)),
          n: lagged.length,
          label: diff < 0
            ? 'High strain days tend to lower your energy the following day'
            : 'Higher strain days don\'t appear to reduce your next-day energy',
        });
      }
    }
  }

  // Connection → mood
  const connectionMood = groupedCorrelation(
    scoredDays,
    d => d.scores.connection !== 50 ? d.scores.connection : null, // skip neutral/unknown
    d => d.aggregate.moodAvg,
    'connection', 'mood',
  );
  if (connectionMood) results.push(connectionMood);

  // Emotional intensity → strain
  const intensityStrain = groupedCorrelation(
    scoredDays,
    d => d.scores.emotionalIntensity,
    d => d.scores.strain,
    'emotional intensity', 'strain',
  );
  if (intensityStrain) results.push(intensityStrain);

  // Dream → emotional intensity
  const dreamDays = scoredDays.filter(d => d.aggregate.hasDream);
  const noDreamDays = scoredDays.filter(d => !d.aggregate.hasDream);
  if (dreamDays.length >= 3 && noDreamDays.length >= 3) {
    const dreamIntensity = mean(dreamDays.map(d => d.scores.emotionalIntensity));
    const noDreamIntensity = mean(noDreamDays.map(d => d.scores.emotionalIntensity));
    const diff = dreamIntensity - noDreamIntensity;
    if (Math.abs(diff) > 5) {
      results.push({
        metricA: 'dream presence',
        metricB: 'emotional intensity',
        strength: Math.round(diff),
        n: scoredDays.length,
        label: diff > 0
          ? 'Dream-logged days tend to be more emotionally intense'
          : 'Dream-logged days tend to be calmer than average',
      });
    }
  }

  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// Best-day / hard-day profiling
// ─────────────────────────────────────────────────────────────────────────────

function buildDayProfile(scoredDays: ScoredDay[]): BestHardDayProfile | null {
  if (scoredDays.length < 2) return null;

  const tagCounts: Record<string, number> = {};
  const emotionCounts: Record<string, number> = {};

  for (const d of scoredDays) {
    for (const t of d.aggregate.tagsUnion) {
      tagCounts[t] = (tagCounts[t] ?? 0) + 1;
    }
    for (const [k, v] of Object.entries(d.aggregate.journalEmotionCountsTotal)) {
      emotionCounts[k] = (emotionCounts[k] ?? 0) + (v ?? 0);
    }
  }

  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag, count]) => ({ tag, count }));

  const topEmotions = Object.entries(emotionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .filter(([, count]) => count >= 2)
    .map(([emotion, count]) => ({ emotion, count }));

  const withSleep = scoredDays.filter(d => d.aggregate.sleepQuality != null);

  return {
    avgStability: Math.round(mean(scoredDays.map(d => d.scores.stability))),
    avgRestoration: Math.round(mean(scoredDays.map(d => d.scores.restoration))),
    avgStrain: Math.round(mean(scoredDays.map(d => d.scores.strain))),
    avgEnergy: Math.round(mean(scoredDays.map(d => d.aggregate.energyAvg) ) * 10) / 10,
    avgStress: Math.round(mean(scoredDays.map(d => d.aggregate.stressAvg)) * 10) / 10,
    avgSleepQuality: withSleep.length >= 2
      ? Math.round(mean(withSleep.map(d => d.aggregate.sleepQuality!)) * 10) / 10
      : null,
    topTags,
    topEmotions,
    dayCount: scoredDays.length,
    avgMood: Math.round(mean(scoredDays.map(d => d.aggregate.moodAvg)) * 10) / 10,
    journalPct: Math.round((scoredDays.filter(d => d.aggregate.hasJournalText).length / scoredDays.length) * 100),
    dreamPct: Math.round((scoredDays.filter(d => d.aggregate.hasDream).length / scoredDays.length) * 100),
  };
}

function detectBestAndHardDays(scoredDays: ScoredDay[]): {
  bestProfile: BestHardDayProfile | null;
  hardProfile: BestHardDayProfile | null;
} {
  if (scoredDays.length < 7) return { bestProfile: null, hardProfile: null };

  // Best days: stability > 75 AND mood > 70th percentile
  const bestDays = scoredDays.filter(d =>
    d.scores.stability > 75 && d.aggregate.moodAvg >= 6,
  );

  // Hard days: stability < 40 OR strain > 70
  const hardDays = scoredDays.filter(d =>
    d.scores.stability < 40 || d.scores.strain > 70,
  );

  return {
    bestProfile: buildDayProfile(bestDays),
    hardProfile: buildDayProfile(hardDays),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main entry points
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Score a single day. Useful for incremental processing.
 */
export function scoreDay(aggregate: DailyAggregate): ScoredDay {
  return {
    aggregate,
    scores: computeDayScores(aggregate),
  };
}

/**
 * Compute the full scored day series from aggregates.
 */
export function scoreDays(aggregates: DailyAggregate[]): ScoredDay[] {
  return [...aggregates]
    .sort((a, b) => a.dayKey.localeCompare(b.dayKey))
    .map(agg => scoreDay(agg));
}

/**
 * Build the complete pattern profile from scored days.
 *
 * This is Layer 2 — the "hidden intelligence" layer between raw data
 * and human-readable insights.
 */
export function buildPatternProfile(aggregates: DailyAggregate[]): PatternProfile {
  const scoredDays = scoreDays(aggregates);

  if (scoredDays.length === 0) {
    const empty: DailyScores = { dayKey: '', stability: 50, restoration: 50, strain: 50, emotionalIntensity: 50, connection: 50 };
    return {
      scoredDays,
      trends: { stability: [], restoration: [], strain: [], emotionalIntensity: [], connection: [] },
      correlations: [],
      bestDayProfile: null,
      hardDayProfile: null,
      overallAvg: empty,
      recentAvg: empty,
      windowDays: 0,
    };
  }

  const trends = computeScoreTrends(scoredDays);
  const correlations = detectCorrelations(scoredDays);
  const { bestProfile, hardProfile } = detectBestAndHardDays(scoredDays);

  const avgScores = (days: ScoredDay[]): DailyScores => ({
    dayKey: '',
    stability: Math.round(mean(days.map(d => d.scores.stability))),
    restoration: Math.round(mean(days.map(d => d.scores.restoration))),
    strain: Math.round(mean(days.map(d => d.scores.strain))),
    emotionalIntensity: Math.round(mean(days.map(d => d.scores.emotionalIntensity))),
    connection: Math.round(mean(days.map(d => d.scores.connection))),
  });

  const recent = scoredDays.slice(-7);

  return {
    scoredDays,
    trends,
    correlations,
    bestDayProfile: bestProfile,
    hardDayProfile: hardProfile,
    overallAvg: avgScores(scoredDays),
    recentAvg: avgScores(recent),
    windowDays: scoredDays.length,
  };
}
