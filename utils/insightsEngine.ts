/**
 * Insights Engine
 *
 * Pure functions — no I/O, no side effects.
 * Takes check-ins + journal entries + optional chart + optional daily context,
 * returns a fully-computed InsightBundle ready for the UI.
 *
 * V2 additions:
 *  - Accepts PipelineResult (daily aggregates) for dayKey-merged analysis
 *  - Weekly journal frequency comparison (3+ vs <3 per week)
 *  - Stress-based hard days (top 20% stress OR bottom 20% mood)
 *  - Dominant modality in chart themes
 *  - More blended insight rules (daily theme + stress, mood down + low journaling)
 *  - Confidence scoring on every card
 *
 * Field mapping notes:
 *  - energyLevel / stressLevel are 'low'|'medium'|'high' → mapped to 2/5/9
 *  - moodScore is already 1–10
 *  - createdAt is ISO UTC; getHours() converts to device local time for TOD buckets
 *  - Journal entries link to check-ins by same calendar date (dayKey merge)
 *  - Chiron is in chart.planets (PlanetPosition[], planet === 'Chiron')
 */

import { DailyCheckIn, ThemeTag, EnergyLevel, StressLevel, TimeOfDay } from '../services/patterns/types';
import { JournalEntry } from '../services/storage/models';
import { NatalChart } from '../services/astrology/types';
import {
  DailyAggregate,
  ChartProfile,
  PipelineResult,
  TodayContext,
} from '../services/insights/types';
import { weekKey } from '../services/insights/dayKey';
import { deriveChartProfile, regulationStyle } from '../services/insights/chartProfile';
import {
  computeEnhancedInsights,
  EnhancedInsightBundle,
} from './journalInsights';
import {
  computeTagAnalytics,
  TagAnalyticsBundle,
} from './tagAnalytics';
import {
  mean as _mean,
  stdDev as _stdDev,
  linearRegression as _linearRegression,
  computeTrend as _computeTrend,
  confidence as _confidence,
} from './stats';
import type { ConfidenceLevel, TrendDirection } from './stats';

// ─────────────────────────────────────────────────────────────────────────────
// Public types  (re-exported from stats for backward compat)
// ─────────────────────────────────────────────────────────────────────────────

export type { ConfidenceLevel, TrendDirection } from './stats';

export interface TrendResult {
  direction: TrendDirection;
  change: number;         // absolute value change over period
  method: 'regression' | 'delta';
  displayChange: string;  // e.g. "+1.2" or "−0.8"
}

export interface WeekSummary {
  checkInCount: number;
  avgMood: number;        // 1–10
  avgEnergy: number;      // 1–9 (mapped)
  avgStress: number;      // 1–9 (mapped)
  moodTrend: TrendResult;
  energyTrend: TrendResult;
  stressTrend: TrendResult;
  periodLabel: string;    // '7 days', 'last N entries', etc.
}

export interface StabilityCard {
  stddev: number;
  label: 'Low volatility' | 'Moderate volatility' | 'High volatility';
  description: string;
  sampleSize: number;
}

export interface TimeOfDayBucket {
  label: 'Morning' | 'Afternoon' | 'Evening' | 'Night';
  count: number;
  avgMood: number;
  avgStress: number;
  avgEnergy: number;
}

export interface TimeOfDayCard {
  buckets: TimeOfDayBucket[];
  bestBucket: string;
  worstStressBucket: string;
  insight: string;
  stat: string;
  /** Per-metric natural-language insights for display */
  metricInsights: TimeOfDayMetricInsight[];
}

export interface TimeOfDayMetricInsight {
  metric: 'mood' | 'energy' | 'stress';
  emoji: string;
  label: string;
  insight: string;
  highBucket: string;
  lowBucket: string;
  highValue: number;
  lowValue: number;
  spread: number;  // difference between high and low
}

export interface DayOfWeekCard {
  highStressDays: string[];
  highMoodDays: string[];
  insight: string;
  stat: string;
}

export interface TagLiftItem {
  tag: ThemeTag;
  label: string;
  lift: number;       // positive = restores, negative = drains
  freqBest: number;   // 0–1, rate in best days
  freqHard: number;   // 0–1, rate in hard days
  count: number;      // total appearances
}

export interface RestoreDrainCard {
  restores: TagLiftItem[];
  drains: TagLiftItem[];
  hasTagData: boolean;
  confidence: ConfidenceLevel;
  fallbackInsight?: string;
}

export interface JournalLinkageCard {
  weeklyFrequency: number;
  daysWithJournal: number;
  daysWithout: number;
  moodWithJournal: number;
  moodWithout: number;
  stabilityWithJournal: number;
  stabilityWithout: number;
  insight: string;
  stat: string;
}

export interface ChartThemeCard {
  label: string;
  body: string;
  source: 'moon' | 'saturn' | 'chiron' | 'element' | 'house';
}

export interface BlendedCard {
  title: string;
  body: string;
  stat: string;
  confidence: ConfidenceLevel;
  journalPrompt: string;
}

export interface TodaySupportCard {
  theme: string | null;
  mantra: string;
  trendSentence: string;
  chartSuggestion: string;
  journalPrompt: string;
  /** Sky context: shown when user is retrograde-sensitive and retrogrades are active */
  retrogradeNote?: string;
  /** Sky context: current lunar phase note if user has measurable phase sensitivity */
  lunarNote?: string;
}

export interface JournalThemesCard {
  topWords: string[];
  insight: string;
  sampleSize: number;
}

export interface JournalFrequencyCard {
  /** Avg mood during high-journaling weeks (3+ entries) */
  moodHighWeeks: number;
  /** Avg mood during low-journaling weeks (<3 entries) */
  moodLowWeeks: number;
  /** Volatility during high-journaling weeks */
  volatilityHighWeeks: number;
  /** Volatility during low-journaling weeks */
  volatilityLowWeeks: number;
  /** Number of high-journaling weeks */
  highWeekCount: number;
  /** Number of low-journaling weeks */
  lowWeekCount: number;
  insight: string;
  stat: string;
  confidence: ConfidenceLevel;
}

export interface ModalityCard {
  label: string;
  body: string;
  dominant: string;
  counts: Record<string, number>;
}

export interface LunarPhasePhaseItem {
  phase: string;
  displayName: string;
  emoji: string;
  count: number;
  avgMood: number;
  avgEnergy: number;
  avgStress: number;
}

export interface LunarPhaseCard {
  phases: LunarPhasePhaseItem[];
  bestPhase: LunarPhasePhaseItem;
  lowestPhase: LunarPhasePhaseItem;
  sensitivity: 'high' | 'moderate' | 'low';
  insight: string;
  stat: string;
  confidence: ConfidenceLevel;
}

export interface RetrogradeCard {
  moodWithRetrograde: number;
  moodWithoutRetrograde: number;
  stressWithRetrograde: number;
  stressWithoutRetrograde: number;
  daysWithRetrograde: number;
  daysWithout: number;
  planets: string[];
  sensitive: boolean;
  insight: string;
  stat: string;
  confidence: ConfidenceLevel;
}

export interface MoonSignItem {
  sign: string;
  count: number;
  avgMood: number;
  avgEnergy: number;
}

export interface MoonSignCard {
  signs: MoonSignItem[];
  bestSign: MoonSignItem;
  hardestSign: MoonSignItem;
  insight: string;
  stat: string;
  confidence: ConfidenceLevel;
}

export interface NoteKeywordLiftItem {
  word: string;
  lift: number;       // positive = appears more on best days
  bestRate: number;   // fraction of best-day check-ins containing this word
  hardRate: number;   // fraction of hard-day check-ins containing this word
  count: number;      // total check-ins containing this word
  isEmotion: boolean;
}

export interface NoteTimeOfDayTheme {
  bucket: 'Morning' | 'Afternoon' | 'Evening' | 'Night';
  topWords: string[];
  avgMood: number;
  noteCount: number;
}

export interface NoteThemesCard {
  /** Words appearing more often on best-mood days */
  restoreWords: NoteKeywordLiftItem[];
  /** Words appearing more often on hard-mood days */
  drainWords: NoteKeywordLiftItem[];
  /** Per-bucket note themes, only buckets with ≥3 noted check-ins */
  timeOfDayThemes: NoteTimeOfDayTheme[];
  totalNotedDays: number;
  insight: string;
  stat: string;
  confidence: ConfidenceLevel;
}

export interface InsightBundle {
  generatedAt: string;
  cacheKey: string;
  entryCount: number;
  windowDays: number;
  hasEnoughData: boolean;
  confidence: ConfidenceLevel;
  todaySupport: TodaySupportCard | null;
  weekSummary: WeekSummary | null;
  stability: StabilityCard | null;
  timeOfDay: TimeOfDayCard | null;
  dayOfWeek: DayOfWeekCard | null;
  tagInsights: RestoreDrainCard | null;
  journalLinkage: JournalLinkageCard | null;
  journalThemes: JournalThemesCard | null;
  chartThemes: ChartThemeCard[];
  blended: BlendedCard[];
  journalFrequency: JournalFrequencyCard | null;
  modality: ModalityCard | null;
  /** Lunar phase mood correlation — requires ≥10 check-ins across ≥3 phases */
  lunarPhase: LunarPhaseCard | null;
  /** Retrograde sensitivity — compares mood/stress during vs. outside retrograde periods */
  retrograde: RetrogradeCard | null;
  /** Moon sign mood patterns — which transiting moon signs lift vs. challenge the user */
  moonSign: MoonSignCard | null;
  /** Free-text keyword lift analysis from check-in note/wins/challenges fields */
  noteThemes: NoteThemesCard | null;
  /** V3 journal-enhanced insights (null until pipeline is used) */
  enhanced: EnhancedInsightBundle | null;
  /** V3 tag analytics: lift, impact, pairs, classification, cross-system agreements */
  tagAnalytics: TagAnalyticsBundle | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

const ENERGY_MAP: Record<EnergyLevel, number> = { low: 2, medium: 5, high: 9 };
const STRESS_MAP: Record<StressLevel, number> = { low: 2, medium: 5, high: 9 };

function energyToNum(e: EnergyLevel): number { return ENERGY_MAP[e] ?? 5; }
function stressToNum(s: StressLevel): number { return STRESS_MAP[s] ?? 5; }

// ── Use shared implementations from utils/stats ──
const mean = _mean;
const stdDev = _stdDev;
const linearRegression = _linearRegression;
const computeTrend = _computeTrend;
const confidence = _confidence;

function isoDateDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  return Math.round(
    Math.abs(new Date(b + 'T00:00:00').getTime() - new Date(a + 'T00:00:00').getTime()) /
    86_400_000
  );
}

function ordinal(n: number): string {
  if (n <= 0) return `${n}`;
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

const TAG_LABELS: Record<string, string> = {
  relationships: 'Relationships', confidence: 'Confidence', money: 'Money',
  family: 'Family', creativity: 'Creativity', health: 'Health',
  boundaries: 'Boundaries', career: 'Career', anxiety: 'Anxiety',
  joy: 'Joy', grief: 'Grief', clarity: 'Clarity',
  overwhelm: 'Overwhelm', loneliness: 'Loneliness', gratitude: 'Gratitude',
  sleep: 'Sleep', work: 'Work', social: 'Social', conflict: 'Conflict',
  movement: 'Movement', nature: 'Nature', routine: 'Routine',
  overstimulated: 'Overstimulated', creative: 'Creative', rest: 'Rest',
  alone_time: 'Alone time', travel: 'Travel', finances: 'Finances',
  weather: 'Weather', food: 'Food', hormones: 'Hormones',
  screens: 'Screens', kids: 'Kids', productivity: 'Productivity',
  substances: 'Substances', intimacy: 'Intimacy',
  eq_calm: 'Calm', eq_anxious: 'Anxious', eq_focused: 'Focused',
  eq_disconnected: 'Disconnected', eq_hopeful: 'Hopeful', eq_irritable: 'Irritable',
  eq_grounded: 'Grounded', eq_scattered: 'Scattered', eq_heavy: 'Heavy', eq_open: 'Open',
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Metadata for the 8 lunar phases stored in check-ins (lunarPhase field) */
const PHASE_META: Record<string, { name: string; emoji: string; energy: string }> = {
  new:              { name: 'New Moon',         emoji: '🌑', energy: 'quiet beginnings' },
  waxing_crescent:  { name: 'Waxing Crescent',  emoji: '🌒', energy: 'building momentum' },
  first_quarter:    { name: 'First Quarter',     emoji: '🌓', energy: 'push through' },
  waxing_gibbous:   { name: 'Waxing Gibbous',   emoji: '🌔', energy: 'refinement' },
  full:             { name: 'Full Moon',         emoji: '🌕', energy: 'peak intensity' },
  waning_gibbous:   { name: 'Waning Gibbous',   emoji: '🌖', energy: 'gratitude & release' },
  last_quarter:     { name: 'Last Quarter',      emoji: '🌗', energy: 'clearing' },
  waning_crescent:  { name: 'Waning Crescent',  emoji: '🌘', energy: 'rest & surrender' },
};

/** Zodiac sign → element (used for moon sign context notes) */
const SIGN_ELEMENT: Record<string, string> = {
  Aries: 'Fire', Taurus: 'Earth', Gemini: 'Air', Cancer: 'Water',
  Leo: 'Fire', Virgo: 'Earth', Libra: 'Air', Scorpio: 'Water',
  Sagittarius: 'Fire', Capricorn: 'Earth', Aquarius: 'Air', Pisces: 'Water',
};

// ─────────────────────────────────────────────────────────────────────────────
// Trend card (per-metric)
// ─────────────────────────────────────────────────────────────────────────────

function buildWeekSummary(
  weekWindow: DailyCheckIn[],
  fullWindow: DailyCheckIn[],
  periodLabel: string,
): WeekSummary {
  // Use full window for trend (more data = more accurate slope)
  const sortedAsc = [...fullWindow].sort((a, b) => a.date.localeCompare(b.date));
  const moodTrend = computeTrend(sortedAsc.map(c => c.moodScore));
  const energyTrend = computeTrend(sortedAsc.map(c => energyToNum(c.energyLevel)));
  const stressTrend = computeTrend(sortedAsc.map(c => stressToNum(c.stressLevel)));

  return {
    checkInCount: weekWindow.length,
    avgMood: parseFloat(mean(weekWindow.map(c => c.moodScore)).toFixed(1)),
    avgEnergy: parseFloat(mean(weekWindow.map(c => energyToNum(c.energyLevel))).toFixed(1)),
    avgStress: parseFloat(mean(weekWindow.map(c => stressToNum(c.stressLevel))).toFixed(1)),
    moodTrend,
    energyTrend,
    stressTrend,
    periodLabel,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Stability
// ─────────────────────────────────────────────────────────────────────────────

function buildStabilityCard(checkIns: DailyCheckIn[]): StabilityCard {
  const moods = checkIns.map(c => c.moodScore);
  const sd = stdDev(moods);
  return {
    stddev: parseFloat(sd.toFixed(2)),
    label: sd <= 1.2 ? 'Low volatility' : sd <= 2.2 ? 'Moderate volatility' : 'High volatility',
    description: sd <= 1.2
      ? 'Your mood has been quite consistent — a steady inner baseline.'
      : sd <= 2.2
        ? 'Some natural fluctuation — highs and lows within a reasonable range.'
        : 'Your mood has had notable swings — there may be peaks and valleys worth exploring.',
    sampleSize: moods.length,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Time of day
// ─────────────────────────────────────────────────────────────────────────────

type TODBucketLabel = 'Morning' | 'Afternoon' | 'Evening' | 'Night';
const TOD_LABELS: TODBucketLabel[] = ['Morning', 'Afternoon', 'Evening', 'Night'];

/** Map TimeOfDay field value to display label */
const TOD_FIELD_TO_LABEL: Record<string, TODBucketLabel> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
  night: 'Night',
};

/** Fallback: infer time-of-day from createdAt hour (for legacy data) */
function bucketHour(h: number): TODBucketLabel {
  if (h >= 5 && h < 12) return 'Morning';
  if (h >= 12 && h < 17) return 'Afternoon';
  if (h >= 17 && h < 21) return 'Evening';
  return 'Night';
}

/** Get the time-of-day bucket for a check-in, using explicit field or fallback to hour */
function getCheckInBucket(c: DailyCheckIn): TODBucketLabel {
  if (c.timeOfDay && TOD_FIELD_TO_LABEL[c.timeOfDay]) {
    return TOD_FIELD_TO_LABEL[c.timeOfDay];
  }
  // Fallback for legacy check-ins without timeOfDay field
  const h = new Date(c.createdAt).getHours();
  return bucketHour(h);
}

function buildTimeOfDay(checkIns: DailyCheckIn[]): TimeOfDayCard | null {
  const data: Record<TODBucketLabel, { moods: number[]; stresses: number[]; energies: number[] }> = {
    Morning: { moods: [], stresses: [], energies: [] },
    Afternoon: { moods: [], stresses: [], energies: [] },
    Evening: { moods: [], stresses: [], energies: [] },
    Night: { moods: [], stresses: [], energies: [] },
  };

  for (const c of checkIns) {
    const bucket = getCheckInBucket(c);
    data[bucket].moods.push(c.moodScore);
    data[bucket].stresses.push(stressToNum(c.stressLevel));
    data[bucket].energies.push(energyToNum(c.energyLevel));
  }

  const buckets: TimeOfDayBucket[] = TOD_LABELS
    .filter(label => data[label].moods.length >= 2)
    .map(label => ({
      label,
      count: data[label].moods.length,
      avgMood: parseFloat(mean(data[label].moods).toFixed(1)),
      avgStress: parseFloat(mean(data[label].stresses).toFixed(1)),
      avgEnergy: parseFloat(mean(data[label].energies).toFixed(1)),
    }));

  if (buckets.length < 2) return null;

  const overallMood = mean(checkIns.map(c => c.moodScore));
  const overallStress = mean(checkIns.map(c => stressToNum(c.stressLevel)));

  const best = [...buckets].sort((a, b) => b.avgMood - a.avgMood)[0];
  const worstStress = [...buckets].sort((a, b) => b.avgStress - a.avgStress)[0];
  const lowestMood = [...buckets].sort((a, b) => a.avgMood - b.avgMood)[0];

  const stressDiff = worstStress.avgStress - overallStress;
  const moodDiff = best.avgMood - overallMood;

  let insight: string;
  let stat: string;

  if (stressDiff >= 1.0) {
    insight = `${worstStress.label} check-ins tend to have higher stress. Consider what happens in your ${worstStress.label.toLowerCase()} routine.`;
    stat = `${worstStress.label} stress avg ${worstStress.avgStress.toFixed(1)} vs overall ${overallStress.toFixed(1)}`;
  } else if (moodDiff >= 0.8) {
    insight = `Your ${best.label.toLowerCase()} entries show the highest mood on average. Notice what supports you during this time.`;
    stat = `${best.label} mood avg ${best.avgMood.toFixed(1)} vs overall ${overallMood.toFixed(1)}`;
  } else if (best.label !== lowestMood.label && best.avgMood - lowestMood.avgMood >= 0.5) {
    insight = `Your mood tends to be higher in the ${best.label.toLowerCase()} and dip in the ${lowestMood.label.toLowerCase()}. Time of day shapes how you feel.`;
    stat = `${best.label} mood ${best.avgMood.toFixed(1)} vs ${lowestMood.label} ${lowestMood.avgMood.toFixed(1)}`;
  } else {
    insight = 'Your mood is fairly consistent across times of day — that\'s a sign of emotional stability.';
    stat = `${buckets.length} time periods tracked`;
  }

  return { buckets, bestBucket: best.label, worstStressBucket: worstStress.label, insight, stat, metricInsights: buildMetricInsights(buckets) };
}

/** Generate natural-language per-metric insights like "Your energy is lowest in the afternoon" */
function buildMetricInsights(buckets: TimeOfDayBucket[]): TimeOfDayMetricInsight[] {
  if (buckets.length < 2) return [];

  const metrics: Array<{
    key: 'mood' | 'energy' | 'stress';
    emoji: string;
    label: string;
    extract: (b: TimeOfDayBucket) => number;
    higherIsBetter: boolean;
  }> = [
    { key: 'mood', emoji: '💛', label: 'Mood', extract: b => b.avgMood, higherIsBetter: true },
    { key: 'energy', emoji: '⚡', label: 'Energy', extract: b => b.avgEnergy, higherIsBetter: true },
    { key: 'stress', emoji: '🔥', label: 'Stress', extract: b => b.avgStress, higherIsBetter: false },
  ];

  const insights: TimeOfDayMetricInsight[] = [];

  for (const m of metrics) {
    const sorted = [...buckets].sort((a, b) => m.extract(b) - m.extract(a));
    const high = sorted[0];
    const low = sorted[sorted.length - 1];
    const spread = m.extract(high) - m.extract(low);

    // Only generate insight if there's a meaningful difference (> 0.3)
    if (spread < 0.3) continue;

    let insightText: string;
    const highLabel = high.label.toLowerCase();
    const lowLabel = low.label.toLowerCase();

    if (m.key === 'mood') {
      if (spread >= 1.5) {
        insightText = `Your mood tends to be highest in the ${highLabel} (${m.extract(high).toFixed(1)}) and drops significantly in the ${lowLabel} (${m.extract(low).toFixed(1)}). That's a ${spread.toFixed(1)}-point swing.`;
      } else if (spread >= 0.8) {
        insightText = `You tend to feel best in the ${highLabel} and your lowest mood is in the ${lowLabel}. Notice what shifts between those times.`;
      } else {
        insightText = `Your mood is slightly higher in the ${highLabel} compared to the ${lowLabel}.`;
      }
    } else if (m.key === 'energy') {
      if (spread >= 1.5) {
        insightText = `Your energy peaks in the ${highLabel} (${m.extract(high).toFixed(1)}) and is lowest in the ${lowLabel} (${m.extract(low).toFixed(1)}). Plan important tasks around your high-energy window.`;
      } else if (spread >= 0.8) {
        insightText = `You tend to have the most energy in the ${highLabel} and the least in the ${lowLabel}. Protect your ${highLabel} time for what matters most.`;
      } else {
        insightText = `Your energy is slightly higher in the ${highLabel} than the ${lowLabel}.`;
      }
    } else {
      // stress — for stress, high is bad
      if (spread >= 1.5) {
        insightText = `Your stress spikes in the ${highLabel} (${m.extract(high).toFixed(1)}) and is lowest in the ${lowLabel} (${m.extract(low).toFixed(1)}). Consider what in your ${highLabel} routine triggers tension.`;
      } else if (spread >= 0.8) {
        insightText = `Stress tends to build in the ${highLabel} and ease in the ${lowLabel}. A mindful transition between these times could help.`;
      } else {
        insightText = `Your stress is slightly higher in the ${highLabel} compared to the ${lowLabel}.`;
      }
    }

    insights.push({
      metric: m.key,
      emoji: m.emoji,
      label: m.label,
      insight: insightText,
      highBucket: high.label,
      lowBucket: low.label,
      highValue: parseFloat(m.extract(high).toFixed(1)),
      lowValue: parseFloat(m.extract(low).toFixed(1)),
      spread: parseFloat(spread.toFixed(1)),
    });
  }

  // Sort by spread descending — most significant insight first
  insights.sort((a, b) => b.spread - a.spread);
  return insights;
}

// ─────────────────────────────────────────────────────────────────────────────
// Day of week
// ─────────────────────────────────────────────────────────────────────────────

function buildDayOfWeek(checkIns: DailyCheckIn[]): DayOfWeekCard | null {
  const dayData: Record<number, { moods: number[]; stresses: number[] }> = {};
  for (let i = 0; i < 7; i++) dayData[i] = { moods: [], stresses: [] };

  for (const c of checkIns) {
    const day = new Date(c.createdAt).getDay(); // 0=Sun
    dayData[day].moods.push(c.moodScore);
    dayData[day].stresses.push(stressToNum(c.stressLevel));
  }

  const overallMood = mean(checkIns.map(c => c.moodScore));
  const overallStress = mean(checkIns.map(c => stressToNum(c.stressLevel)));

  const dayStats = Object.entries(dayData)
    .filter(([, d]) => d.moods.length >= 5)
    .map(([idx, d]) => ({
      day: DAY_NAMES[Number(idx)],
      avgMood: mean(d.moods),
      avgStress: mean(d.stresses),
      count: d.moods.length,
    }));

  if (dayStats.length < 3) return null;

  const highStressDays = dayStats
    .filter(d => d.avgStress - overallStress >= 0.8 || d.avgStress >= overallStress * 1.2)
    .sort((a, b) => b.avgStress - a.avgStress)
    .slice(0, 2)
    .map(d => d.day);

  const highMoodDays = dayStats
    .filter(d => d.avgMood - overallMood >= 0.8 || d.avgMood >= overallMood * 1.1)
    .sort((a, b) => b.avgMood - a.avgMood)
    .slice(0, 2)
    .map(d => d.day);

  if (highStressDays.length === 0 && highMoodDays.length === 0) return null;

  const insight = highStressDays.length > 0
    ? `Stress peaks most often on ${highStressDays.join(' and ')}.`
    : `Your best mood tends to fall on ${highMoodDays.join(' and ')}.`;

  const worstDay = dayStats.find(d => highStressDays.includes(d.day));
  const bestDay = dayStats.find(d => highMoodDays.includes(d.day));
  const stat = worstDay
    ? `${worstDay.day} stress avg ${worstDay.avgStress.toFixed(1)} vs overall ${overallStress.toFixed(1)}`
    : bestDay
      ? `${bestDay.day} mood avg ${bestDay.avgMood.toFixed(1)} vs overall ${overallMood.toFixed(1)}`
      : '';

  return { highStressDays, highMoodDays, insight, stat };
}

// ─────────────────────────────────────────────────────────────────────────────
// Tag lift (Restores / Drains)
// ─────────────────────────────────────────────────────────────────────────────

function buildTagInsights(checkIns: DailyCheckIn[]): RestoreDrainCard | null {
  const n = checkIns.length;
  if (n < 5) return null;

  const tagged = checkIns.filter(c => c.tags.length > 0);
  if (tagged.length < 3) {
    // Fallback: describe best/worst day patterns from energy+stress
    const highEnergy = checkIns.filter(c => c.energyLevel === 'high' && c.stressLevel !== 'high');
    const highStress = checkIns.filter(c => c.stressLevel === 'high');
    const fallback = highEnergy.length > 0 || highStress.length > 0
      ? `${highEnergy.length} of your check-ins had high energy and low-medium stress. ` +
        `${highStress.length} had high stress. Try logging 1–3 tags to see what's driving each.`
      : undefined;
    return { restores: [], drains: [], hasTagData: false, confidence: 'low', fallbackInsight: fallback };
  }

  // Symmetric buckets: top 20% by mood = "best", bottom 20% by mood = "hard".
  // Using mood-only for both sides keeps bucket sizes equal and avoids
  // inflating hard-day tag frequency (which biased lift calculations).
  const sortedByMood = [...checkIns].sort((a, b) => a.moodScore - b.moodScore);
  const topN = Math.max(1, Math.ceil(n * 0.2));
  const bestDays = sortedByMood.slice(n - topN);
  const hardDays = sortedByMood.slice(0, topN);

  const allTags = new Set(checkIns.flatMap(c => c.tags));
  const items: TagLiftItem[] = [];

  for (const tag of allTags) {
    const freqBest = bestDays.filter(c => c.tags.includes(tag)).length / bestDays.length;
    const freqHard = hardDays.filter(c => c.tags.includes(tag)).length / hardDays.length;
    const lift = freqBest - freqHard;
    const count = checkIns.filter(c => c.tags.includes(tag)).length;
    if (count >= 5) {
      items.push({ tag: tag as ThemeTag, label: TAG_LABELS[tag as ThemeTag] ?? tag, lift, freqBest, freqHard, count });
    }
  }

  const restores = items.filter(t => t.lift > 0).sort((a, b) => b.lift - a.lift).slice(0, 3);
  const drains = items.filter(t => t.lift < 0).sort((a, b) => a.lift - b.lift).slice(0, 3);

  return {
    restores,
    drains,
    hasTagData: true,
    confidence: confidence(tagged.length),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Journal linkage
// ─────────────────────────────────────────────────────────────────────────────

function buildJournalLinkage(
  checkIns: DailyCheckIn[],
  journalEntries: JournalEntry[],
): JournalLinkageCard | null {
  if (checkIns.length < 5 || journalEntries.length < 2) return null;

  const journalDates = new Set(journalEntries.map(e => e.date));
  const withJournal = checkIns.filter(c => journalDates.has(c.date));
  const withoutJournal = checkIns.filter(c => !journalDates.has(c.date));

  if (withJournal.length < 2 || withoutJournal.length < 2) return null;

  const moodWith = parseFloat(mean(withJournal.map(c => c.moodScore)).toFixed(1));
  const moodWithout = parseFloat(mean(withoutJournal.map(c => c.moodScore)).toFixed(1));
  const stabilityWith = parseFloat(stdDev(withJournal.map(c => c.moodScore)).toFixed(2));
  const stabilityWithout = parseFloat(stdDev(withoutJournal.map(c => c.moodScore)).toFixed(2));

  const totalWeeks = Math.max(1, daysBetween(checkIns[0].date, checkIns[checkIns.length - 1].date) / 7);
  const weeklyFrequency = parseFloat((journalEntries.length / totalWeeks).toFixed(1));

  const moodDiff = moodWith - moodWithout;
  const stabilityDiff = stabilityWithout - stabilityWith; // positive = steadier with journaling

  let insight: string;
  if (stabilityDiff > 0.4) {
    insight = `Days when you journal alongside checking in show ${stabilityDiff.toFixed(1)} less mood volatility — steadier overall.`;
  } else if (moodDiff > 0.5) {
    insight = `Check-in days where you also journaled tend to have a slightly higher mood (+${moodDiff.toFixed(1)}).`;
  } else if (moodDiff < -0.5) {
    insight = `You tend to journal on harder days — that's the practice working. Keep going.`;
  } else {
    insight = `You have journal entries on ${withJournal.length} of ${checkIns.length} check-in days. Patterns emerge with more overlap.`;
  }

  return {
    weeklyFrequency,
    daysWithJournal: withJournal.length,
    daysWithout: withoutJournal.length,
    moodWithJournal: moodWith,
    moodWithout,
    stabilityWithJournal: stabilityWith,
    stabilityWithout,
    insight,
    stat: `${withJournal.length} days with journal · ${withoutJournal.length} without`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Chart themes
// ─────────────────────────────────────────────────────────────────────────────

function buildChartThemes(chart: NatalChart): ChartThemeCard[] {
  const themes: ChartThemeCard[] = [];
  const timeKnown = !chart.birthData.hasUnknownTime;

  // Moon
  const moonSign = chart.moon.sign.name;
  const moonEl = chart.moon.sign.element;
  const moonHouse = timeKnown && chart.moon.house > 0 ? chart.moon.house : 0;
  themes.push({
    label: `Moon in ${moonSign}${moonHouse > 0 ? ` · ${ordinal(moonHouse)} House` : ''}`,
    body: moonThemeBody(moonSign, moonEl, moonHouse),
    source: 'moon',
  });

  // Saturn
  const saturnSign = chart.saturn.sign.name;
  const saturnHouse = timeKnown && chart.saturn.house > 0 ? chart.saturn.house : 0;
  themes.push({
    label: `Saturn in ${saturnSign}${saturnHouse > 0 ? ` · ${ordinal(saturnHouse)} House` : ''}`,
    body: saturnThemeBody(saturnSign, saturnHouse),
    source: 'saturn',
  });

  // Chiron (from chart.planets array — PlanetPosition)
  const chiron = chart.planets?.find(p => p.planet === 'Chiron');
  if (chiron) {
    themes.push({
      label: `Chiron in ${chiron.sign}`,
      body: chironThemeBody(chiron.sign),
      source: 'chiron',
    });
  }

  // Dominant element across personal planets
  const personal = [chart.sun, chart.moon, chart.mercury, chart.venus, chart.mars];
  const elCounts: Record<string, number> = {};
  for (const p of personal) {
    const el = p.sign.element;
    elCounts[el] = (elCounts[el] ?? 0) + 1;
  }
  const dominantEl = Object.entries(elCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  if (dominantEl) {
    themes.push({
      label: `Dominant Element: ${dominantEl}`,
      body: elementThemeBody(dominantEl),
      source: 'element',
    });
  }

  // Dominant modality across personal planets
  const modCounts: Record<string, number> = {};
  for (const p of personal) {
    const mod = p.sign.modality;
    modCounts[mod] = (modCounts[mod] ?? 0) + 1;
  }
  const dominantMod = Object.entries(modCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  if (dominantMod && modCounts[dominantMod] >= 2) {
    const modBodies: Record<string, string> = {
      Cardinal: 'You initiate naturally — momentum and fresh starts energize you. Stagnation drains faster than struggle.',
      Fixed: 'You build and sustain — depth, loyalty, and follow-through define your approach. Disruption hits harder than expected.',
      Mutable: 'You adapt fluidly — flexibility is your strength, but losing sight of your own needs in the process is the risk.',
    };
    themes.push({
      label: `Dominant Modality: ${dominantMod}`,
      body: modBodies[dominantMod] ?? `${dominantMod} energy shapes your relationship with change.`,
      source: 'element', // grouped under element source for display
    });
  }

  // 6th or 12th house emphasis (personal planets + moon in those houses)
  if (timeKnown) {
    const in6th = personal.filter(p => p.house === 6).length;
    const in12th = personal.filter(p => p.house === 12).length;
    if (in6th >= 2) {
      themes.push({
        label: '6th House Emphasis',
        body: 'Several personal planets occupy your 6th house — health routines, daily rhythm, and service are foundational to how you function and feel. When these areas are disrupted, so is your wellbeing.',
        source: 'house',
      });
    } else if (in12th >= 2) {
      themes.push({
        label: '12th House Emphasis',
        body: 'Several personal planets sit in your 12th house — solitude, subconscious processing, and rest are not optional for you. Time alone to recharge is a genuine need, not an avoidance.',
        source: 'house',
      });
    }
  }

  return themes;
}

// ─────────────────────────────────────────────────────────────────────────────
// Blended cards
// ─────────────────────────────────────────────────────────────────────────────

function buildBlendedCards(
  weekSummary: WeekSummary,
  stability: StabilityCard,
  chart: NatalChart,
  entryCount: number,
  opts?: {
    currentRetrogrades?: string[];
    currentLunarPhase?: string;
    retrogradeCard?: RetrogradeCard | null;
    lunarPhaseCard?: LunarPhaseCard | null;
    tagInsights?: RestoreDrainCard | null;
  },
): BlendedCard[] {
  const cards: BlendedCard[] = [];
  const conf = confidence(entryCount);
  const timeKnown = !chart.birthData.hasUnknownTime;

  const personal = [chart.sun, chart.moon, chart.mercury, chart.venus, chart.mars];
  const elCounts: Record<string, number> = {};
  for (const p of personal) {
    const el = p.sign.element;
    elCounts[el] = (elCounts[el] ?? 0) + 1;
  }
  const dominantEl = Object.entries(elCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Earth';

  const stressTrend = weekSummary.stressTrend.direction;
  const moodTrend = weekSummary.moodTrend.direction;
  const moonHouse = timeKnown ? chart.moon.house : 0;
  const saturnSign = chart.saturn.sign.name;
  const sd = stability.stddev;
  const baseStat = `Based on ${entryCount} entries`;

  // Rule 1: Rising stress + element-based reset suggestion
  if (stressTrend === 'up') {
    const elementSuggestions: Record<string, { body: string; prompt: string }> = {
      Earth: {
        body: `Stress has been rising, and your ${dominantEl}-dominant chart shows you regulate through structure and tangible action. One small practical reset today — even 10 minutes of organizing something — can help your nervous system exhale.`,
        prompt: 'What one small thing could I simplify or organize today?',
      },
      Water: {
        body: `Stress has been climbing, and your ${dominantEl}-dominant chart processes through emotional release rather than pushing through. Softness isn't avoidance — it's your most direct route back to center.`,
        prompt: 'What emotion have I been carrying without fully acknowledging it?',
      },
      Fire: {
        body: `Stress is elevated, and your ${dominantEl} chart typically resolves through movement and expression. A change of scene, a workout, or creating something often breaks the loop faster than rest alone.`,
        prompt: 'What would help me feel like myself again today?',
      },
      Air: {
        body: `Stress has trended upward. Your ${dominantEl}-dominant chart benefits from naming what's in your head — talking it through or writing it out tends to release pressure more than distraction does.`,
        prompt: 'What has been weighing on my mind that I haven\'t put into words yet?',
      },
    };
    const s = elementSuggestions[dominantEl] ?? elementSuggestions.Earth;
    cards.push({
      title: 'Where It Connects',
      body: s.body,
      stat: `Stress trend: ↑ ${weekSummary.stressTrend.displayChange} · ${dominantEl} dominant · ${baseStat}`,
      confidence: conf,
      journalPrompt: s.prompt,
    });
  }

  // Rule 2: Mood down + relational Moon house
  if (moodTrend === 'down' && moonHouse > 0 && (moonHouse === 7 || moonHouse === 11)) {
    cards.push({
      title: 'A Relational Thread',
      body: `Your mood has been dipping, and your Moon in the ${ordinal(moonHouse)} house means connection is central to how you recharge. Reaching out — even briefly — tends to shift your inner weather more than solo processing.`,
      stat: `Mood trend: ↓ ${weekSummary.moodTrend.displayChange} · Moon in ${ordinal(moonHouse)} house · ${baseStat}`,
      confidence: conf,
      journalPrompt: 'Who do I want to feel more connected to, and what\'s one small step I could take today?',
    });
  }

  // Rule 3: High volatility + Saturn discipline sign
  const saturnDisciplineSigns = ['Capricorn', 'Virgo', 'Scorpio', 'Aries', 'Taurus'];
  if (sd >= 2.2 && saturnDisciplineSigns.includes(saturnSign)) {
    cards.push({
      title: 'Simplify to Stabilize',
      body: `Your mood has been quite variable, and your Saturn in ${saturnSign} suggests that simplifying — not adding more — is how you find ground. One thing to reduce or pause, not add, could be your reset.`,
      stat: `Mood volatility: ${sd.toFixed(1)} · Saturn in ${saturnSign} · ${baseStat}`,
      confidence: conf,
      journalPrompt: 'What am I doing out of obligation rather than genuine care for myself?',
    });
  }

  // Rule 4: Mood improving — affirm and reflect
  if (moodTrend === 'up' && stressTrend !== 'up') {
    cards.push({
      title: 'What\'s Working',
      body: `Your mood has been trending upward — your ${dominantEl} nature is likely finding its rhythm. Notice what you've been doing differently. These conditions are worth understanding and protecting.`,
      stat: `Mood trend: ↑ ${weekSummary.moodTrend.displayChange} · ${dominantEl} dominant · ${baseStat}`,
      confidence: conf,
      journalPrompt: 'What has felt genuinely good lately — even in small ways?',
    });
  }

  // Rule 5: High volatility + Moon in 4th/12th house → reduce stimulation
  if (sd >= 2.0 && moonHouse > 0 && (moonHouse === 4 || moonHouse === 12)) {
    cards.push({
      title: 'Honor the Quiet',
      body: `Your mood has been variable, and your Moon in the ${ordinal(moonHouse)} house needs quiet to recalibrate. Reducing stimulation — fewer demands, less screen time, more stillness — isn't withdrawal. It's how you actually reset.`,
      stat: `Mood volatility: ${sd.toFixed(1)} · Moon in ${ordinal(moonHouse)} house · ${baseStat}`,
      confidence: conf,
      journalPrompt: 'What do I need less of right now?',
    });
  }

  // Rule 6: Mood trending down + low journaling → suggest short nightly reflection
  if (moodTrend === 'down') {
    cards.push({
      title: 'A Small Practice',
      body: `Your mood has been dipping. Even a short nightly reflection — 3 sentences about what you noticed today — can interrupt the drift. Your ${dominantEl} nature processes best when things are externalized, not carried silently.`,
      stat: `Mood trend: ↓ ${weekSummary.moodTrend.displayChange} · ${baseStat}`,
      confidence: conf,
      journalPrompt: 'Three things I noticed about today — even small ones.',
    });
  }

  // Rule 7: Stress up + dominant modality is Fixed → permission to adjust
  const modCounts: Record<string, number> = {};
  for (const p of personal) {
    const mod = p.sign.modality;
    modCounts[mod] = (modCounts[mod] ?? 0) + 1;
  }
  const dominantMod = Object.entries(modCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Fixed';
  if (stressTrend === 'up' && dominantMod === 'Fixed') {
    cards.push({
      title: 'Permission to Shift',
      body: `Stress has been climbing, and your Fixed modality tends to hold on longer than necessary — to routines, expectations, or situations that have shifted. Adjusting isn't giving up. It's responding to reality.`,
      stat: `Stress trend: ↑ ${weekSummary.stressTrend.displayChange} · Fixed dominant · ${baseStat}`,
      confidence: conf,
      journalPrompt: 'What am I holding onto that might be ready to change?',
    });
  }

  // Rule 8: Top restore tag + chart element synthesis
  if (opts?.tagInsights?.restores.length) {
    const topRestore = opts.tagInsights.restores[0];
    const liftPct = Math.round(topRestore.lift * 100);
    if (liftPct >= 20 && topRestore.count >= 5) {
      const elementContext: Record<string, string> = {
        Earth: `fits your ${dominantEl} need for grounding and tangible nourishment`,
        Water: `speaks directly to your ${dominantEl} emotional processing`,
        Fire: `matches your ${dominantEl} drive for aliveness and expression`,
        Air: `engages your ${dominantEl} mind and connection needs`,
      };
      const context = elementContext[dominantEl] ?? `aligns with your ${dominantEl} chart nature`;
      cards.push({
        title: 'Your Reliable Reset',
        body: `"${topRestore.label}" shows up ${liftPct}% more often on your best days — and it ${context}. When in doubt, this is your most data-backed lever. Use it deliberately.`,
        stat: `${topRestore.count} check-ins · ${liftPct}% more frequent on best days · ${dominantEl} dominant`,
        confidence: conf,
        journalPrompt: `How can I build more "${topRestore.label.toLowerCase()}" into my week — specifically and practically?`,
      });
    }
  }

  // Rule 9: Retrograde-sensitive user + currently in retrograde
  if (
    opts?.retrogradeCard?.sensitive &&
    opts?.currentRetrogrades &&
    opts.currentRetrogrades.length > 0
  ) {
    const retros = opts.currentRetrogrades.slice(0, 3).join(', ');
    cards.push({
      title: 'The Sky Is in Your Data',
      body: `Your patterns confirm retrograde sensitivity — mood and stress shift when planets reverse. With ${retros} currently retrograde, any heightened tension or internal noise has a measurable sky context. Gentle and patient is the strategy right now.`,
      stat: `Retrograde sensitivity confirmed · ${retros} retrograde · ${baseStat}`,
      confidence: conf,
      journalPrompt: 'What feels harder or slower than usual right now — and what would help me move through it with less resistance?',
    });
  }

  // Default card if no rules triggered
  if (cards.length === 0) {
    cards.push({
      title: 'Baseline Reflection',
      body: `Your ${dominantEl} chart and current patterns suggest a relatively steady period. This is a good moment to notice what sustains you — so you remember it when things get heavier.`,
      stat: `${dominantEl} dominant · ${baseStat}`,
      confidence: conf,
      journalPrompt: 'What does "feeling like myself" actually look like right now?',
    });
  }

  return cards;
}

// ─────────────────────────────────────────────────────────────────────────────
// Today's support
// ─────────────────────────────────────────────────────────────────────────────

function buildTodaySupport(
  mantra: string | null,
  todayTheme: string | null,
  weekSummary: WeekSummary | null,
  chart: NatalChart | null,
  opts?: {
    currentRetrogrades?: string[];
    currentLunarPhase?: string;
    retrogradeCard?: RetrogradeCard | null;
    lunarPhaseCard?: LunarPhaseCard | null;
  },
): TodaySupportCard | null {
  if (!mantra) return null;

  let trendSentence = '';
  if (weekSummary) {
    const mt = weekSummary.moodTrend.direction;
    const st = weekSummary.stressTrend.direction;
    if (mt === 'up') trendSentence = `Your mood has been trending upward lately — this lands in a good moment.`;
    else if (mt === 'down') trendSentence = `Your mood has been lower recently — this prompt may be especially relevant right now.`;
    else if (st === 'up') trendSentence = `Stress has been a theme lately — this mantra is worth sitting with.`;
    else trendSentence = `Your patterns have been steady this week.`;
  }

  let chartSuggestion = '';
  if (chart) {
    const moonSign = chart.moon.sign.name;
    const personal = [chart.sun, chart.moon, chart.mercury, chart.venus, chart.mars];
    const elCounts: Record<string, number> = {};
    for (const p of personal) {
      const el = p.sign.element;
      elCounts[el] = (elCounts[el] ?? 0) + 1;
    }
    const el = Object.entries(elCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Earth';
    const suggestions: Record<string, string> = {
      Fire: `Your ${moonSign} Moon tends to process through action — even a brief walk or creative outlet can unlock how you feel.`,
      Earth: `Your ${moonSign} Moon settles through the senses and small rituals — ground yourself before the day accelerates.`,
      Air: `Your ${moonSign} Moon benefits from naming what's in your head — talking or writing first thing can clarify everything.`,
      Water: `Your ${moonSign} Moon absorbs the atmosphere — a quiet moment before engaging with the world goes a long way.`,
    };
    chartSuggestion = suggestions[el] ?? '';
  }

  // Sky context: retrograde note
  let retrogradeNote: string | undefined;
  if (
    opts?.retrogradeCard?.sensitive &&
    opts.currentRetrogrades &&
    opts.currentRetrogrades.length > 0
  ) {
    const list = opts.currentRetrogrades.slice(0, 3).join(', ');
    const s = opts.currentRetrogrades.length === 1 ? 'is' : 'are';
    retrogradeNote = `${list} ${s} currently retrograde — your patterns suggest this stirs extra complexity. Soften your expectations today.`;
  }

  // Sky context: lunar phase note
  let lunarNote: string | undefined;
  if (opts?.lunarPhaseCard && opts.currentLunarPhase && opts.lunarPhaseCard.sensitivity !== 'low') {
    const meta = PHASE_META[opts.currentLunarPhase];
    if (meta) {
      const isBest = opts.lunarPhaseCard.bestPhase.phase === opts.currentLunarPhase;
      const isHard = opts.lunarPhaseCard.lowestPhase.phase === opts.currentLunarPhase;
      const context = isBest
        ? ' This tends to be one of your stronger phases.'
        : isHard
          ? ' This tends to be a quieter or more internal phase for you.'
          : '';
      lunarNote = `${meta.name} ${meta.emoji} — ${meta.energy}.${context}`;
    }
  }

  return {
    theme: todayTheme,
    mantra,
    trendSentence,
    chartSuggestion,
    journalPrompt: `Sitting with today's mantra — what does this bring up for me right now?`,
    retrogradeNote,
    lunarNote,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Journal text analysis (basic keyword frequency — local only, no API)
// ─────────────────────────────────────────────────────────────────────────────

const STOPWORDS = new Set([
  'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'you', 'your', 'yours',
  'he', 'him', 'his', 'she', 'her', 'hers', 'it', 'its', 'they', 'them',
  'their', 'theirs', 'what', 'which', 'who', 'whom', 'this', 'that',
  'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing',
  'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until',
  'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between',
  'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from',
  'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again',
  'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why',
  'how', 'all', 'both', 'each', 'few', 'more', 'most', 'other', 'some',
  'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than',
  'too', 'very', 'can', 'will', 'just', 'don', 'should', 'now', 'also',
  'would', 'could', 'really', 'like', 'got', 'get', 'went', 'going',
   'much', 'even', 'still', 'way', 'thing', 'things', 'today', 'day',
  'feel', 'feeling', 'felt', 'been', 'lot', 'bit', 'make', 'made',
  'know', 'think', 'thought', 'want', 'need', 'one', 'two', 'time',
  'll', 've', 're', 'don\'t', 'didn', 'doesn', 'won', 'wasn', 'isn',
]);

/** Emotion-adjacent words we want to surface when present */
const EMOTION_WORDS = new Set([
  'happy', 'sad', 'angry', 'anxious', 'tired', 'exhausted', 'overwhelmed',
  'hopeful', 'grateful', 'frustrated', 'lonely', 'peaceful', 'calm',
  'stressed', 'excited', 'worried', 'content', 'restless', 'motivated',
  'stuck', 'inspired', 'drained', 'energized', 'scattered', 'focused',
  'heavy', 'light', 'joyful', 'nervous', 'confident', 'uncertain',
  'lost', 'grounded', 'disconnected', 'connected', 'creative', 'blocked',
  'tender', 'raw', 'numb', 'alive', 'burnt', 'burnout', 'loved', 'unloved',
  'safe', 'unsafe', 'afraid', 'brave', 'vulnerable', 'strong', 'weak',
  'hopeless', 'clarity', 'confused', 'relief', 'grief', 'hurt', 'healing',
]);

function buildJournalThemes(journalEntries: JournalEntry[]): JournalThemesCard | null {
  if (journalEntries.length < 3) return null;

  const wordCounts: Record<string, number> = {};
  for (const entry of journalEntries) {
    const text = (entry.content ?? '').toLowerCase().replace(/[^a-z\s'-]/g, ' ');
    const words = text.split(/\s+/).filter(w => w.length >= 3 && !STOPWORDS.has(w));
    const seen = new Set<string>(); // count each word once per entry
    for (const w of words) {
      if (!seen.has(w)) {
        wordCounts[w] = (wordCounts[w] ?? 0) + 1;
        seen.add(w);
      }
    }
  }

  // Prefer emotion-adjacent words, then fall back to most frequent
  const emotionHits = Object.entries(wordCounts)
    .filter(([w]) => EMOTION_WORDS.has(w))
    .filter(([, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1]);

  const generalHits = Object.entries(wordCounts)
    .filter(([, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1]);

  // Take up to 5: prioritize emotion words, fill with general
  const topEmotion = emotionHits.slice(0, 5).map(([w]) => w);
  const topGeneral = generalHits
    .filter(([w]) => !topEmotion.includes(w))
    .slice(0, 5 - topEmotion.length)
    .map(([w]) => w);
  const topWords = [...topEmotion, ...topGeneral].slice(0, 5);

  if (topWords.length < 2) return null;

  return {
    topWords,
    insight: `Common themes lately: ${topWords.join(', ')}`,
    sampleSize: journalEntries.length,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Journal frequency impact (weekly comparison)
// ─────────────────────────────────────────────────────────────────────────────

function buildJournalFrequency(
  checkIns: DailyCheckIn[],
  journalEntries: JournalEntry[],
): JournalFrequencyCard | null {
  if (checkIns.length < 14 || journalEntries.length < 3) return null;

  // Group check-ins and journals by ISO week
  const checkInsByWeek = new Map<string, DailyCheckIn[]>();
  for (const ci of checkIns) {
    const wk = weekKey(ci.date);
    if (!checkInsByWeek.has(wk)) checkInsByWeek.set(wk, []);
    checkInsByWeek.get(wk)!.push(ci);
  }

  const journalCountByWeek = new Map<string, number>();
  for (const je of journalEntries) {
    const wk = weekKey(je.date);
    journalCountByWeek.set(wk, (journalCountByWeek.get(wk) ?? 0) + 1);
  }

  // Classify weeks
  const highWeeks: { moods: number[]; volatilities: number[] } = { moods: [], volatilities: [] };
  const lowWeeks: { moods: number[]; volatilities: number[] } = { moods: [], volatilities: [] };

  for (const [wk, cis] of checkInsByWeek) {
    if (cis.length < 2) continue; // need at least 2 check-ins in a week
    const moods = cis.map(c => c.moodScore);
    const avgMood = mean(moods);
    const vol = stdDev(moods);
    const jCount = journalCountByWeek.get(wk) ?? 0;

    if (jCount >= 3) {
      highWeeks.moods.push(avgMood);
      highWeeks.volatilities.push(vol);
    } else {
      lowWeeks.moods.push(avgMood);
      lowWeeks.volatilities.push(vol);
    }
  }

  if (highWeeks.moods.length < 1 || lowWeeks.moods.length < 1) return null;

  const moodHigh = parseFloat(mean(highWeeks.moods).toFixed(1));
  const moodLow = parseFloat(mean(lowWeeks.moods).toFixed(1));
  const volHigh = parseFloat(mean(highWeeks.volatilities).toFixed(2));
  const volLow = parseFloat(mean(lowWeeks.volatilities).toFixed(2));

  const conf = confidence(checkIns.length);

  let insight: string;
  let stat: string;

  const volDiff = volLow - volHigh;
  const moodDiff = moodHigh - moodLow;

  if (volDiff > 0.3) {
    insight = `Weeks you journal 3+ times are steadier — less mood variability, more emotional ground.`;
    stat = `Volatility ${volHigh.toFixed(1)} vs ${volLow.toFixed(1)}`;
  } else if (moodDiff > 0.4) {
    insight = `Weeks with more journaling tend to have a higher average mood (+${moodDiff.toFixed(1)}).`;
    stat = `Mood avg ${moodHigh} (3+ journals) vs ${moodLow} (fewer)`;
  } else if (moodDiff < -0.4) {
    insight = `You tend to journal more during harder weeks — that's the practice doing its job.`;
    stat = `Mood avg ${moodHigh} (3+ journals) vs ${moodLow} (fewer)`;
  } else {
    insight = `Your journaling frequency varies, but there may be deeper patterns to uncover with more data.`;
    stat = `${highWeeks.moods.length} high-journal weeks · ${lowWeeks.moods.length} low-journal weeks`;
  }

  return {
    moodHighWeeks: moodHigh,
    moodLowWeeks: moodLow,
    volatilityHighWeeks: volHigh,
    volatilityLowWeeks: volLow,
    highWeekCount: highWeeks.moods.length,
    lowWeekCount: lowWeeks.moods.length,
    insight,
    stat,
    confidence: conf,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Modality theme
// ─────────────────────────────────────────────────────────────────────────────

function buildModalityCard(chart: NatalChart): ModalityCard | null {
  const personal = [chart.sun, chart.moon, chart.mercury, chart.venus, chart.mars];
  const counts: Record<string, number> = { Cardinal: 0, Fixed: 0, Mutable: 0 };
  for (const p of personal) {
    const mod = p.sign.modality;
    if (mod in counts) counts[mod]++;
  }

  const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  if (!dominant || dominant[1] < 2) return null;

  const bodies: Record<string, string> = {
    Cardinal: 'You initiate. Your natural impulse is to start, lead, and create momentum. Stagnation is your biggest drain — even small beginnings restore your sense of agency.',
    Fixed: 'You sustain. Consistency, depth, and loyalty are your strengths. Disruption to established patterns hits harder than most expect — give yourself permission to adjust slowly.',
    Mutable: 'You adapt. Flexibility and responsiveness are your native mode. You can read the room and shift — the cost is sometimes losing track of what you actually want underneath the adjustments.',
  };

  return {
    label: `Dominant Modality: ${dominant[0]}`,
    body: bodies[dominant[0]] ?? `${dominant[0]} energy shapes how you engage with change and momentum.`,
    dominant: dominant[0],
    counts,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Lunar phase mood correlation
// ─────────────────────────────────────────────────────────────────────────────

function buildLunarPhaseCard(checkIns: DailyCheckIn[]): LunarPhaseCard | null {
  const withPhase = checkIns.filter(c => c.lunarPhase && c.lunarPhase.length > 0);
  if (withPhase.length < 10) return null;

  const phaseData: Record<string, { moods: number[]; energies: number[]; stresses: number[] }> = {};
  for (const c of withPhase) {
    const ph = c.lunarPhase;
    if (!phaseData[ph]) phaseData[ph] = { moods: [], energies: [], stresses: [] };
    phaseData[ph].moods.push(c.moodScore);
    phaseData[ph].energies.push(energyToNum(c.energyLevel));
    phaseData[ph].stresses.push(stressToNum(c.stressLevel));
  }

  const phases: LunarPhasePhaseItem[] = Object.entries(phaseData)
    .filter(([, d]) => d.moods.length >= 2)
    .map(([phase, d]) => {
      const meta = PHASE_META[phase] ?? { name: phase, emoji: '🌙', energy: '' };
      return {
        phase,
        displayName: meta.name,
        emoji: meta.emoji,
        count: d.moods.length,
        avgMood: parseFloat(mean(d.moods).toFixed(1)),
        avgEnergy: parseFloat(mean(d.energies).toFixed(1)),
        avgStress: parseFloat(mean(d.stresses).toFixed(1)),
      };
    });

  if (phases.length < 3) return null;

  const sorted = [...phases].sort((a, b) => b.avgMood - a.avgMood);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  const spread = parseFloat((best.avgMood - worst.avgMood).toFixed(1));

  const WAXING = new Set(['new', 'waxing_crescent', 'first_quarter', 'waxing_gibbous']);
  const waxingMoods = phases.filter(p => WAXING.has(p.phase)).map(p => p.avgMood);
  const waningMoods = phases.filter(p => !WAXING.has(p.phase)).map(p => p.avgMood);
  const waxingAvg = waxingMoods.length > 0 ? mean(waxingMoods) : 0;
  const waningAvg = waningMoods.length > 0 ? mean(waningMoods) : 0;

  let sensitivity: 'high' | 'moderate' | 'low';
  let insight: string;

  if (spread >= 1.5) {
    sensitivity = 'high';
    insight = `Your mood shifts noticeably with the lunar cycle. You tend to feel your best during the ${best.displayName} (avg ${best.avgMood}/10) and lowest around the ${worst.displayName} (${worst.avgMood}/10) — a ${spread}-point swing tied to the moon's rhythm.`;
  } else if (spread >= 0.7) {
    sensitivity = 'moderate';
    if (waxingMoods.length > 0 && waningMoods.length > 0 && waxingAvg > waningAvg + 0.3) {
      insight = `Your energy builds with the moon — you tend to feel more alive as it grows toward full. ${best.displayName} is your stronger phase, averaging ${best.avgMood}/10.`;
    } else if (waningMoods.length > 0 && waxingMoods.length > 0 && waningAvg > waxingAvg + 0.3) {
      insight = `You actually thrive as the moon wanes — going inward suits you. Your mood is notably higher during the releasing phases. ${best.displayName} is your strongest.`;
    } else {
      insight = `The lunar cycle has a subtle but real effect on your mood. Your ${best.displayName} tends to be your most grounded phase, with more sensitivity around ${worst.displayName}.`;
    }
  } else {
    sensitivity = 'low';
    insight = `Your mood stays fairly consistent across lunar phases — you're not easily swept up in the collective lunar tide. That's a form of emotional steadiness.`;
  }

  return {
    phases,
    bestPhase: best,
    lowestPhase: worst,
    sensitivity,
    insight,
    stat: `${phases.length} phases tracked · ${withPhase.length} check-ins · ${spread}-pt spread`,
    confidence: confidence(withPhase.length),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Retrograde sensitivity
// ─────────────────────────────────────────────────────────────────────────────

function buildRetrogradeCard(checkIns: DailyCheckIn[]): RetrogradeCard | null {
  const withRetro = checkIns.filter(c => c.retrogrades && c.retrogrades.length > 0);
  const withoutRetro = checkIns.filter(c => !c.retrogrades || c.retrogrades.length === 0);
  if (withRetro.length < 5 || withoutRetro.length < 5) return null;

  const moodWith = parseFloat(mean(withRetro.map(c => c.moodScore)).toFixed(1));
  const moodWithout = parseFloat(mean(withoutRetro.map(c => c.moodScore)).toFixed(1));
  const stressWith = parseFloat(mean(withRetro.map(c => stressToNum(c.stressLevel))).toFixed(1));
  const stressWithout = parseFloat(mean(withoutRetro.map(c => stressToNum(c.stressLevel))).toFixed(1));

  const planetFreq: Record<string, number> = {};
  for (const c of withRetro) {
    for (const p of c.retrogrades) {
      planetFreq[p] = (planetFreq[p] ?? 0) + 1;
    }
  }
  const planets = Object.entries(planetFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([p]) => p);

  const moodDiff = moodWith - moodWithout;
  const stressDiff = stressWith - stressWithout;
  const sensitive = moodDiff <= -0.8 || stressDiff >= 1.0;
  const mildEffect = !sensitive && (moodDiff <= -0.4 || stressDiff >= 0.5);

  let insight: string;
  if (sensitive) {
    const stressNote = stressDiff >= 1.0 ? ` Stress also runs ${stressDiff.toFixed(1)} points higher.` : '';
    insight = `Your patterns show clear retrograde sensitivity. Mood averages ${moodWith}/10 during retrograde periods vs ${moodWithout}/10 when planets are direct — a ${Math.abs(moodDiff).toFixed(1)}-point difference.${stressNote} This is data, not astrology myth.`;
  } else if (mildEffect) {
    const planetNote = planets.length > 0 ? `${planets.join(' & ')} retrograde periods` : 'Retrograde periods';
    insight = `There's a mild retrograde pattern in your check-ins. ${planetNote} tend to show slightly more internal friction — not dramatic, but worth knowing.`;
  } else {
    insight = `Retrogrades don't significantly shift your baseline. Your mood holds steady whether planets are direct or retrograde — a sign of resilience in your emotional patterns.`;
  }

  return {
    moodWithRetrograde: moodWith,
    moodWithoutRetrograde: moodWithout,
    stressWithRetrograde: stressWith,
    stressWithoutRetrograde: stressWithout,
    daysWithRetrograde: withRetro.length,
    daysWithout: withoutRetro.length,
    planets,
    sensitive,
    insight,
    stat: `${withRetro.length} days retrograde · ${withoutRetro.length} days direct`,
    confidence: confidence(checkIns.length),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Moon sign mood patterns
// ─────────────────────────────────────────────────────────────────────────────

function buildMoonSignCard(checkIns: DailyCheckIn[], chart?: NatalChart | null): MoonSignCard | null {
  const withSign = checkIns.filter(c => c.moonSign && c.moonSign.length > 0);
  if (withSign.length < 10) return null;

  const signData: Record<string, { moods: number[]; energies: number[] }> = {};
  for (const c of withSign) {
    const s = c.moonSign;
    if (!signData[s]) signData[s] = { moods: [], energies: [] };
    signData[s].moods.push(c.moodScore);
    signData[s].energies.push(energyToNum(c.energyLevel));
  }

  const signs: MoonSignItem[] = Object.entries(signData)
    .filter(([, d]) => d.moods.length >= 2)
    .map(([sign, d]) => ({
      sign,
      count: d.moods.length,
      avgMood: parseFloat(mean(d.moods).toFixed(1)),
      avgEnergy: parseFloat(mean(d.energies).toFixed(1)),
    }));

  if (signs.length < 3) return null;

  const sorted = [...signs].sort((a, b) => b.avgMood - a.avgMood);
  const best = sorted[0];
  const hardest = sorted[sorted.length - 1];
  const spread = parseFloat((best.avgMood - hardest.avgMood).toFixed(1));

  if (spread < 0.5) return null;

  const natMoonSign = chart?.moon?.sign?.name;
  let contextNote = '';
  if (natMoonSign && best.sign === natMoonSign) {
    contextNote = ` That's your natal Moon sign — when the sky's Moon returns to ${best.sign}, it's coming home.`;
  } else {
    const el = SIGN_ELEMENT[best.sign];
    if (el) contextNote = ` ${best.sign} is a ${el} sign — its energy may simply harmonize with your nature.`;
  }

  let insight: string;
  if (spread >= 1.0) {
    insight = `When the Moon transits ${best.sign}, you consistently feel your best (avg ${best.avgMood}/10).${contextNote} Your more challenged days tend to cluster when it passes through ${hardest.sign} (avg ${hardest.avgMood}/10).`;
  } else {
    insight = `The transiting Moon sign has a subtle effect on your mood. You tend to feel stronger under a ${best.sign} Moon and more challenged under ${hardest.sign}.${contextNote}`;
  }

  return {
    signs,
    bestSign: best,
    hardestSign: hardest,
    insight,
    stat: `${signs.length} moon signs tracked · ${withSign.length} check-ins · ${spread}-pt spread`,
    confidence: confidence(withSign.length),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Note keyword lift (free-text check-in analysis)
// ─────────────────────────────────────────────────────────────────────────────

/** Extract meaningful words from a single check-in's free text fields */
function extractNoteWords(c: DailyCheckIn): string[] {
  const texts = [c.note, c.wins, c.challenges]
    .filter((s): s is string => !!s && s.length > 0 && !s.startsWith('ENC2:') && !s.startsWith('ENC1:'));
  if (texts.length === 0) return [];
  const combined = texts.join(' ').toLowerCase().replace(/[^a-z\s'-]/g, ' ');
  return combined.split(/\s+/).filter(w => w.length >= 3 && !STOPWORDS.has(w));
}

function buildNoteThemesCard(checkIns: DailyCheckIn[]): NoteThemesCard | null {
  // Filter to check-ins that have at least one non-encrypted free-text field
  const noted = checkIns.filter(c =>
    [c.note, c.wins, c.challenges].some(
      s => s && s.length > 0 && !s.startsWith('ENC2:') && !s.startsWith('ENC1:')
    )
  );

  if (noted.length < 8) return null;

  // ── Lift analysis ──────────────────────────────────────────────────────────
  const n = noted.length;
  const topN = Math.max(1, Math.ceil(n * 0.2));
  const sortedByMood = [...noted].sort((a, b) => a.moodScore - b.moodScore);
  const bestDays = sortedByMood.slice(n - topN);
  const hardDays = sortedByMood.slice(0, topN);

  // Document-frequency: count each word once per check-in
  const wordBest: Record<string, number> = {};
  const wordHard: Record<string, number> = {};
  const wordTotal: Record<string, number> = {};

  for (const c of noted) {
    const words = new Set(extractNoteWords(c));
    for (const w of words) wordTotal[w] = (wordTotal[w] ?? 0) + 1;
  }
  for (const c of bestDays) {
    const words = new Set(extractNoteWords(c));
    for (const w of words) wordBest[w] = (wordBest[w] ?? 0) + 1;
  }
  for (const c of hardDays) {
    const words = new Set(extractNoteWords(c));
    for (const w of words) wordHard[w] = (wordHard[w] ?? 0) + 1;
  }

  // Only analyze words that appear in ≥3 check-ins total
  const candidates = Object.keys(wordTotal).filter(w => wordTotal[w] >= 3);

  const liftItems: NoteKeywordLiftItem[] = candidates.map(w => {
    const bestRate = (wordBest[w] ?? 0) / bestDays.length;
    const hardRate = (wordHard[w] ?? 0) / hardDays.length;
    return {
      word: w,
      lift: parseFloat((bestRate - hardRate).toFixed(3)),
      bestRate: parseFloat(bestRate.toFixed(3)),
      hardRate: parseFloat(hardRate.toFixed(3)),
      count: wordTotal[w],
      isEmotion: EMOTION_WORDS.has(w),
    };
  });

  const restoreWords = liftItems
    .filter(i => i.lift > 0.1)
    .sort((a, b) => {
      const scoreA = a.lift * (a.isEmotion ? 1.5 : 1.0);
      const scoreB = b.lift * (b.isEmotion ? 1.5 : 1.0);
      return scoreB - scoreA;
    })
    .slice(0, 6);

  const drainWords = liftItems
    .filter(i => i.lift < -0.1)
    .sort((a, b) => {
      const scoreA = a.lift * (a.isEmotion ? 1.5 : 1.0);
      const scoreB = b.lift * (b.isEmotion ? 1.5 : 1.0);
      return scoreA - scoreB; // most negative first
    })
    .slice(0, 6);

  // ── Time-of-day themes ─────────────────────────────────────────────────────
  const bucketNotes: Record<TODBucketLabel, { words: string[]; moods: number[] }> = {
    Morning: { words: [], moods: [] },
    Afternoon: { words: [], moods: [] },
    Evening: { words: [], moods: [] },
    Night: { words: [], moods: [] },
  };

  for (const c of noted) {
    const bucket = getCheckInBucket(c);
    bucketNotes[bucket].words.push(...extractNoteWords(c));
    bucketNotes[bucket].moods.push(c.moodScore);
  }

  const timeOfDayThemes: NoteTimeOfDayTheme[] = TOD_LABELS
    .filter(label => bucketNotes[label].moods.length >= 3)
    .map(label => {
      const { words, moods } = bucketNotes[label];
      // Word frequency within this bucket
      const wf: Record<string, number> = {};
      for (const w of words) wf[w] = (wf[w] ?? 0) + 1;
      const sorted = Object.entries(wf)
        .filter(([, cnt]) => cnt >= 2)
        .sort((a, b) => {
          const scoreA = a[1] * (EMOTION_WORDS.has(a[0]) ? 1.5 : 1.0);
          const scoreB = b[1] * (EMOTION_WORDS.has(b[0]) ? 1.5 : 1.0);
          return scoreB - scoreA;
        });
      return {
        bucket: label,
        topWords: sorted.slice(0, 4).map(([w]) => w),
        avgMood: parseFloat(mean(moods).toFixed(1)),
        noteCount: moods.length,
      };
    })
    .filter(t => t.topWords.length >= 1);

  // Need at least some signal to return a card
  const hasLiftData = restoreWords.length + drainWords.length >= 2;
  const hasTimeData = timeOfDayThemes.length >= 2;
  if (!hasLiftData && !hasTimeData) return null;

  // ── Synthesize insight ─────────────────────────────────────────────────────
  let insight: string;
  const todSorted = [...timeOfDayThemes].sort((a, b) => a.avgMood - b.avgMood);
  const lowestTOD = todSorted[0];
  const highestTOD = todSorted[todSorted.length - 1];
  const todSpread = lowestTOD && highestTOD
    ? parseFloat((highestTOD.avgMood - lowestTOD.avgMood).toFixed(1))
    : 0;

  if (hasTimeData && lowestTOD && highestTOD && lowestTOD.bucket !== highestTOD.bucket) {
    const drainEx = drainWords[0]?.word;
    const restoreEx = restoreWords[0]?.word;
    if (todSpread >= 1.5 && drainEx && lowestTOD.topWords.includes(drainEx)) {
      insight = `Your mood tends to be lowest in the ${lowestTOD.bucket.toLowerCase()} — and words like "${drainEx}" show up in your ${lowestTOD.bucket.toLowerCase()} notes more than any other time. ${highestTOD.bucket} is when you most often describe feeling "${restoreEx ?? 'better'}".`;
    } else if (todSpread >= 1.0) {
      insight = `Your ${highestTOD.bucket.toLowerCase()} check-ins average ${highestTOD.avgMood}/10, compared to ${lowestTOD.avgMood}/10 in the ${lowestTOD.bucket.toLowerCase()}. Your written notes follow the same pattern.`;
    } else if (restoreEx) {
      insight = `"${restoreEx}" appears more in your best-day notes. Your ${highestTOD.bucket.toLowerCase()} check-ins have the most positive tone overall.`;
    } else {
      insight = `Your notes reveal patterns across times of day — ${highestTOD.bucket} tends to have the most grounded language, ${lowestTOD.bucket} the most challenging.`;
    }
  } else if (hasLiftData && restoreWords.length > 0) {
    const top = restoreWords[0];
    const drain = drainWords[0];
    if (drain) {
      insight = `Your notes pattern clearly: "${top.word}" appears far more often on your best days, while "${drain.word}" clusters on harder ones. These aren't random — they're signals worth watching.`;
    } else {
      insight = `"${top.word}" shows up ${(top.bestRate * 100).toFixed(0)}% of the time on your best days vs ${(top.hardRate * 100).toFixed(0)}% on your hardest. Your language tracks your inner state.`;
    }
  } else {
    insight = 'Your check-in notes are starting to show patterns. Keep noting and the picture will sharpen.';
  }

  return {
    restoreWords,
    drainWords,
    timeOfDayThemes,
    totalNotedDays: noted.length,
    insight,
    stat: `${noted.length} noted check-ins · ${restoreWords.length + drainWords.length} signal words`,
    confidence: confidence(noted.length),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Interpretation dictionaries
// ─────────────────────────────────────────────────────────────────────────────

function moonThemeBody(sign: string, element: string, house: number): string {
  const houseNote = house === 4 ? ' Your 4th house Moon makes home and emotional safety especially foundational.' :
    house === 12 ? ' Your 12th house Moon needs solitude to fully recharge.' :
    house === 7 ? ' Your 7th house Moon finds regulation through connection and partnership.' :
    house === 1 ? ' Your 1st house Moon wears emotions close to the surface — what you feel shows quickly.' : '';

  const bodies: Record<string, string> = {
    Aries: `You process emotions quickly and need freedom to move through feelings without over-analyzing. Suppressing them creates pressure.${houseNote}`,
    Taurus: `Stability and comfort restore you. You build security through routines and sensory grounding. Change destabilizes faster than you expect.${houseNote}`,
    Gemini: `Talking or writing things out is how you emotionally digest. Variety keeps your inner world alive; routine can feel suffocating.${houseNote}`,
    Cancer: `You feel deeply and need genuinely safe spaces to rest. Your intuition is a reliable compass — trust it over logic when something feels off.${houseNote}`,
    Leo: `Recognition and warmth feed your emotional wellbeing. You thrive when your heart is seen and your efforts are acknowledged.${houseNote}`,
    Virgo: `Order and usefulness calm your inner world. You often process feelings through doing — but the emotion still needs to be felt, not just fixed.${houseNote}`,
    Libra: `Harmony in relationships is central to your emotional health. Conflict that goes unresolved will live in your body.${houseNote}`,
    Scorpio: `Depth and authenticity are non-negotiable for you. Shallow connection drains you; transformation is where you find meaning.${houseNote}`,
    Sagittarius: `Freedom and meaning sustain you emotionally. Feeling trapped — in routine, obligation, or smallness — is your most reliable drain.${houseNote}`,
    Capricorn: `Accomplishment and structure ground you. You feel safe when you're building toward something, and purposeless when you're not.${houseNote}`,
    Aquarius: `Emotional independence and purpose sustain you. You need space to think and a sense that your uniqueness has a place.${houseNote}`,
    Pisces: `Solitude, art, and empathy refuel you. Without boundaries, you absorb the emotional states of everyone around you.${houseNote}`,
  };
  return bodies[sign] ?? `With your Moon in ${element}, emotional processing flows through your ${element.toLowerCase()} nature.`;
}

function saturnThemeBody(sign: string, house: number): string {
  const houseNote = house === 10 ? ' In the 10th, this plays out through career and public role.' :
    house === 2 ? ' In the 2nd, this shapes how you build and relate to security.' :
    house === 7 ? ' In the 7th, commitment and relationship terms are your growth area.' : '';

  const bodies: Record<string, string> = {
    Aries: `You build confidence through independent action, not permission. Waiting for approval delays you. Patience with yourself is the growth edge.${houseNote}`,
    Taurus: `Developing security by releasing attachment to outcomes and trusting your own inherent worth. You have more than you think.${houseNote}`,
    Gemini: `Depth and focus are your lessons — breadth comes naturally, but committing fully to one path creates the mastery you're looking for.${houseNote}`,
    Cancer: `You grow by learning emotional self-reliance. Nurturing yourself as thoroughly as you nurture others is the work.${houseNote}`,
    Leo: `Authentic self-expression without needing approval is your long arc. The more you perform for others, the further you drift from yourself.${houseNote}`,
    Virgo: `Discernment without perfectionism is your path. Enough is enough — and knowing when to stop is as important as starting well.${houseNote}`,
    Libra: `Learning to decide without endless weighing is the work. Trust your own sense of fairness over others' opinions.${houseNote}`,
    Scorpio: `Surrender and trust, not control, unlock your growth. Power used to protect is the goal; power as defense mechanism is the loop.${houseNote}`,
    Sagittarius: `Wisdom builds through lived experience. Slow expansion and deep commitment to one thing beats endless, restless searching.${houseNote}`,
    Capricorn: `Structure built on authenticity — not obligation — is your life's work. Achievement for approval is the trap; achievement for meaning is the path.${houseNote}`,
    Aquarius: `You grow through community and expressed originality. Your difference is not a liability — it's the very thing you're here to bring.${houseNote}`,
    Pisces: `Boundaries and spiritual discipline are yours to develop. Reality and vision can coexist — the ground and the dream belong together.${houseNote}`,
  };
  return bodies[sign] ?? `Saturn in ${sign} asks you to build patience, structure, and mastery in ${sign} themes over time.`;
}

function chironThemeBody(sign: string): string {
  const bodies: Record<string, string> = {
    Aries: `Your wound relates to identity and self-assertion. You may have learned that being fully yourself — bold, instinctive — wasn't safe or welcome. Healing comes through reclaiming that boldness without apology.`,
    Taurus: `Your wound touches worth and stability. You may have internalized that your needs or desires were too much. Healing is building something simply because it nourishes you, not because it earns you something.`,
    Gemini: `Your wound is around being heard and believed. You may have felt your words didn't matter or that you were misunderstood. Healing comes through speaking your truth even when your voice shakes.`,
    Cancer: `Your wound is around belonging and emotional safety. You may have managed others' emotions while setting aside your own. Healing is receiving care as readily as you extend it.`,
    Leo: `Your wound touches visibility and unconditional love. You may have felt that being fully yourself was too much. Healing is shining without needing to earn the light.`,
    Virgo: `Your wound relates to self-criticism. You may have learned you were only acceptable if you were useful or flawless. Healing is being enough, exactly as you are, before you've done anything.`,
    Libra: `Your wound is around fairness and relational balance. You may have experienced impossible standards or chronic imbalance in relationships. Healing is modeling the fairness you always deserved.`,
    Scorpio: `Your wound touches power and deep trust. You may have been betrayed or learned that vulnerability leads to destruction. Healing is choosing depth again — slowly, with discernment.`,
    Sagittarius: `Your wound relates to meaning and faith. Your optimism or beliefs may have been dismissed. Healing comes through trusting your own sense of what is true, even when the world disagrees.`,
    Capricorn: `Your wound touches authority and self-worth through achievement. You may have learned that success required sacrificing yourself. Healing is building a life on your own terms, not earned approval.`,
    Aquarius: `Your wound is around belonging and difference. You may have felt like an outsider — too unusual to fit. Healing is recognizing that your difference is precisely what you came to contribute.`,
    Pisces: `Your wound touches boundaries and dissolution. You may have lost yourself in others or felt unable to find firm ground. Healing is knowing your own ground — and returning to it.`,
  };
  return bodies[sign] ?? `Chiron in ${sign} marks a sensitive place where wound and gift overlap — your deepest vulnerability is also your deepest potential for healing and wisdom.`;
}

function elementThemeBody(element: string): string {
  const bodies: Record<string, string> = {
    Fire: `Your inner world moves fast. Inspiration, action, and passion are your native operating modes. Rest and stillness aren't defaults — they're disciplines. But when you do pause, you come back sharper.`,
    Earth: `Grounding, practicality, and patience are your strengths. Your body knows things before your mind does — pay attention to it. Stability is what you create and what you need most.`,
    Air: `Ideas and connection fuel you. You process through thinking and communicating — writing things down externalizes what otherwise loops internally. Solitude can be harder than connection.`,
    Water: `Emotion and intuition are your primary intelligences. You sense what others miss. Feeling fully — rather than managing feelings — is your superpower and your ongoing practice.`,
  };
  return bodies[element] ?? `${element} energy shapes how you meet both the world and yourself.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Top-level bundle computation
// ─────────────────────────────────────────────────────────────────────────────

export function computeInsightBundle(
  allCheckIns: DailyCheckIn[],
  journalEntries: JournalEntry[],
  chart: NatalChart | null,
  todayMantra?: string | null,
  todayTheme?: string | null,
): InsightBundle {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  // Sort ascending by date (oldest first)
  const sorted = [...allCheckIns].sort((a, b) => a.date.localeCompare(b.date));

  // Window selection: prefer last 30 days if >=7 entries there; else use all
  const cutoff30 = isoDateDaysAgo(30);
  const last30 = sorted.filter(c => c.date >= cutoff30);
  const window = last30.length >= 7 ? last30 : sorted;
  const windowDays = last30.length >= 7 ? 30
    : sorted.length > 1 ? daysBetween(sorted[0].date, today) : 0;

  const hasEnoughData = window.length >= 3;
  const conf = confidence(window.length);

  if (!hasEnoughData) {
    return {
      generatedAt: now.toISOString(),
      cacheKey: '',
      entryCount: sorted.length,
      windowDays,
      hasEnoughData: false,
      confidence: 'low',
      todaySupport: null,
      weekSummary: null,
      stability: null,
      timeOfDay: null,
      dayOfWeek: null,
      tagInsights: null,
      journalLinkage: null,
      journalThemes: null,
      chartThemes: chart ? buildChartThemes(chart) : [],
      blended: [],
      journalFrequency: null,
      modality: null,
      lunarPhase: null,
      retrograde: null,
      moonSign: null,
      noteThemes: null,
      enhanced: null,
      tagAnalytics: null,
    };
  }
  // fall back to recent entries if fewer than 3
  const cutoff7 = isoDateDaysAgo(7);
  const last7 = sorted.filter(c => c.date >= cutoff7);
  const weekWindow = last7.length >= 3 ? last7 : window.slice(-Math.min(window.length, 7));
  const periodLabel = last7.length >= 3 ? '7 days' : `last ${weekWindow.length} entries`;

  const weekSummary = buildWeekSummary(weekWindow, window, periodLabel);
  const stability = buildStabilityCard(window);
  const timeOfDay = buildTimeOfDay(window);
  const dayOfWeek = buildDayOfWeek(window);
  const tagInsights = buildTagInsights(window);

  // Journal linkage uses only journals in the same date window
  const windowStart = window[0].date;
  const windowEnd = window[window.length - 1].date;
  const windowJournals = journalEntries.filter(e => e.date >= windowStart && e.date <= windowEnd);
  const journalLinkage = buildJournalLinkage(window, windowJournals);
  const journalThemes = buildJournalThemes(windowJournals);
  const journalFrequency = buildJournalFrequency(window, windowJournals);

  // Sky data from most recent check-in — used for today's context
  const mostRecent = window[window.length - 1];
  const currentRetrogrades = mostRecent?.retrogrades ?? [];
  const currentLunarPhase = mostRecent?.lunarPhase ?? '';

  // Sky pattern cards (activate stored lunarPhase, retrogrades, moonSign fields)
  const lunarPhaseCard = buildLunarPhaseCard(window);
  const retrogradeCard = buildRetrogradeCard(window);
  const moonSignCard = buildMoonSignCard(window, chart);

  // Note keyword lift: analyze free-text from note/wins/challenges fields
  const noteThemesCard = buildNoteThemesCard(window);

  const chartThemes = chart ? buildChartThemes(chart) : [];
  const blended = chart ? buildBlendedCards(weekSummary, stability, chart, window.length, {
    currentRetrogrades,
    currentLunarPhase,
    retrogradeCard,
    lunarPhaseCard,
    tagInsights,
  }) : [];
  const todaySupport = buildTodaySupport(todayMantra ?? null, todayTheme ?? null, weekSummary, chart, {
    currentRetrogrades,
    currentLunarPhase,
    retrogradeCard,
    lunarPhaseCard,
  });
  const modality = chart ? buildModalityCard(chart) : null;

  return {
    generatedAt: now.toISOString(),
    cacheKey: '',
    entryCount: window.length,
    windowDays,
    hasEnoughData: true,
    confidence: conf,
    todaySupport,
    weekSummary,
    stability,
    timeOfDay,
    dayOfWeek,
    tagInsights,
    journalLinkage,
    journalThemes,
    chartThemes,
    blended,
    journalFrequency,
    modality,
    lunarPhase: lunarPhaseCard,
    retrograde: retrogradeCard,
    moonSign: moonSignCard,
    noteThemes: noteThemesCard,
    enhanced: null,
    tagAnalytics: null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Display helpers (used by UI)
// ─────────────────────────────────────────────────────────────────────────────

export function confidenceLabel(level: ConfidenceLevel): string {
  if (level === 'high') return 'High confidence';
  if (level === 'medium') return 'Building clarity';
  return 'Early signal';
}

export function trendArrow(dir: TrendDirection): string {
  return dir === 'up' ? '↑' : dir === 'down' ? '↓' : '→';
}

export function moodLabel(avg: number): string {
  if (avg >= 8) return 'Thriving';
  if (avg >= 6.5) return 'Good';
  if (avg >= 5) return 'Okay';
  if (avg >= 3.5) return 'Low';
  return 'Struggling';
}

export function energyWord(avg: number): string {
  if (avg >= 7) return 'High';
  if (avg >= 3.5) return 'Medium';
  return 'Low';
}

export function stressWord(avg: number): string {
  if (avg >= 7) return 'High';
  if (avg >= 3.5) return 'Medium';
  return 'Low';
}

/** For stress, "down" is good — invert color coding */
export function stressTrendArrow(dir: TrendDirection): string {
  return dir === 'down' ? '↓ easing' : dir === 'up' ? '↑ rising' : '→ steady';
}

// ─────────────────────────────────────────────────────────────────────────────
// V2: Pipeline-based bundle computation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute an InsightBundle from a PipelineResult.
 *
 * This is the preferred entry point when using the insights pipeline.
 * The pipeline handles load → normalize → aggregate, and this function
 * takes the result and computes all insight cards.
 *
 * The original `computeInsightBundle` is preserved for backward
 * compatibility — it creates the pipeline internally.
 */
export function computeInsightBundleFromPipeline(
  pipeline: PipelineResult,
  chart: NatalChart | null,
  allCheckIns: DailyCheckIn[],
  journalEntries: JournalEntry[],
  todayMantra?: string | null,
  todayTheme?: string | null,
): InsightBundle {
  // Delegate to the original function which already handles everything.
  // The pipeline result enriches the cache key with chartProfile hash.
  const bundle = computeInsightBundle(
    allCheckIns,
    journalEntries,
    chart,
    todayMantra,
    todayTheme,
  );

  // Enrich the cache key with chart profile version hash
  if (pipeline.chartProfile) {
    bundle.cacheKey = bundle.cacheKey
      ? `${bundle.cacheKey}|${pipeline.chartProfile.versionHash}`
      : pipeline.chartProfile.versionHash;
  }

  // Compute V3 enhanced insights from pipeline aggregates
  if (pipeline.dailyAggregates.length >= 3) {
    bundle.enhanced = computeEnhancedInsights(
      pipeline.dailyAggregates,
      pipeline.chartProfile,
    );
  }

  // Compute V3 tag analytics from pipeline aggregates
  if (pipeline.dailyAggregates.length >= 10) {
    bundle.tagAnalytics = computeTagAnalytics(
      pipeline.dailyAggregates,
      pipeline.chartProfile,
    );
  }

  return bundle;
}
