/**
 * Insights Pipeline
 *
 * Transforms raw data into insight-ready aggregates.
 * Three steps: Load → Normalize → Aggregate by dayKey.
 *
 * Pure functions — no I/O. The caller provides raw data.
 */

import { DailyCheckIn, EnergyLevel, StressLevel } from '../patterns/types';
import { JournalEntry, SleepEntry } from '../storage/models';
import { DailyAggregate, PipelineInput, PipelineResult } from './types';
import { todayDayKey, daysBetweenKeys } from './dayKey';
import { deriveChartProfile } from './chartProfile';
import type { KeywordResult, EmotionResult, SentimentResult } from '../journal/nlp';
import { mean } from '../../utils/stats';

// ─────────────────────────────────────────────────────────────────────────────
// Normalization helpers
// ─────────────────────────────────────────────────────────────────────────────

const ENERGY_MAP: Record<EnergyLevel, number> = { low: 2, medium: 5, high: 8 };
const STRESS_MAP: Record<StressLevel, number> = { low: 2, medium: 5, high: 8 };

/** Convert energy level enum to 1–10 numeric */
function energyToNum(e: EnergyLevel): number { return ENERGY_MAP[e] ?? 5; }

/** Convert stress level enum to 1–10 numeric */
function stressToNum(s: StressLevel): number { return STRESS_MAP[s] ?? 5; }

/** Clamp a numeric value to 1–10 */
function clamp(v: number): number {
  return Math.max(1, Math.min(10, v));
}

/** Normalize a tag: lowercase, trimmed, no special chars */
function normalizeTag(tag: string): string {
  return tag.toLowerCase().trim().replace(/[^a-z0-9_]/g, '');
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 1: Normalize raw data
// ─────────────────────────────────────────────────────────────────────────────

interface NormalizedCheckIn {
  dayKey: string;
  mood: number;       // 1–10
  energy: number;     // 1–10
  stress: number;     // 1–10
  tags: string[];
  createdAt: string;  // original ISO timestamp
  timeOfDay: string;  // 'morning' | 'afternoon' | 'evening' | 'night'
}

function normalizeCheckIn(ci: DailyCheckIn): NormalizedCheckIn {
  return {
    dayKey: ci.date, // already YYYY-MM-DD
    mood: clamp(ci.moodScore),
    energy: clamp(energyToNum(ci.energyLevel)),
    stress: clamp(stressToNum(ci.stressLevel)),
    tags: ci.tags.map(normalizeTag).filter(t => t.length > 0),
    createdAt: ci.createdAt,
    timeOfDay: ci.timeOfDay,
  };
}

interface NormalizedJournal {
  dayKey: string;
  wordCount: number;
  hasText: boolean;
  /** Parsed keyword result (from encrypted NLP summary) */
  keywords: string[];
  /** Parsed emotion counts (from encrypted NLP summary) */
  emotionCounts: Partial<Record<string, number>>;
  /** Parsed sentiment (from encrypted NLP summary) */
  sentiment: number | null;
}

function normalizeJournal(je: JournalEntry): NormalizedJournal {
  const text = (je.content ?? '').trim();
  const wordCount = je.contentWordCount ?? (text.length > 0 ? text.split(/\s+/).length : 0);

  // Parse NLP summaries (stored as JSON strings, decrypted by DB layer)
  let keywords: string[] = [];
  let emotionCounts: Partial<Record<string, number>> = {};
  let sentiment: number | null = null;

  try {
    if (je.contentKeywords) {
      const parsed = JSON.parse(je.contentKeywords) as KeywordResult;
      keywords = parsed.keywords ?? [];
    }
  } catch { /* ignore parse errors */ }

  try {
    if (je.contentEmotions) {
      const parsed = JSON.parse(je.contentEmotions) as EmotionResult;
      emotionCounts = parsed.counts ?? {};
    }
  } catch { /* ignore parse errors */ }

  try {
    if (je.contentSentiment) {
      const parsed = JSON.parse(je.contentSentiment) as SentimentResult;
      sentiment = parsed.sentiment ?? null;
    }
  } catch { /* ignore parse errors */ }

  return {
    dayKey: je.date, // already YYYY-MM-DD
    wordCount,
    hasText: text.length > 0,
    keywords,
    emotionCounts,
    sentiment,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 2: Aggregate by dayKey
// ─────────────────────────────────────────────────────────────────────────────

interface NormalizedSleep {
  dayKey: string;
  durationHours: number | null;
  quality: number | null;
  hasDream: boolean;
}

function normalizeSleep(se: SleepEntry): NormalizedSleep {
  const dur = se.durationHours;
  const qual = se.quality;
  return {
    dayKey: se.date, // YYYY-MM-DD
    durationHours: dur != null && dur >= 0 && dur <= 24 ? dur : null,
    quality: qual != null && qual >= 1 && qual <= 5 ? qual : null,
    hasDream: !!(se.dreamText && se.dreamText.trim().length > 0),
  };
}

function aggregateByDay(
  checkIns: NormalizedCheckIn[],
  journals: NormalizedJournal[],
  sleepEntries: NormalizedSleep[] = [],
): DailyAggregate[] {
  // Group check-ins by dayKey
  const checkInsByDay = new Map<string, NormalizedCheckIn[]>();
  for (const ci of checkIns) {
    const key = ci.dayKey;
    if (!checkInsByDay.has(key)) checkInsByDay.set(key, []);
    checkInsByDay.get(key)!.push(ci);
  }

  // Group journals by dayKey
  const journalsByDay = new Map<string, NormalizedJournal[]>();
  for (const j of journals) {
    const key = j.dayKey;
    if (!journalsByDay.has(key)) journalsByDay.set(key, []);
    journalsByDay.get(key)!.push(j);
  }

  // Group sleep entries by dayKey
  const sleepByDay = new Map<string, NormalizedSleep[]>();
  for (const s of sleepEntries) {
    const key = s.dayKey;
    if (!sleepByDay.has(key)) sleepByDay.set(key, []);
    sleepByDay.get(key)!.push(s);
  }

  // Collect all unique dayKeys
  const allDayKeys = new Set([...checkInsByDay.keys(), ...journalsByDay.keys(), ...sleepByDay.keys()]);

  const aggregates: DailyAggregate[] = [];

  for (const dayKey of allDayKeys) {
    const dayCheckIns = checkInsByDay.get(dayKey) ?? [];
    const dayJournals = journalsByDay.get(dayKey) ?? [];
    const daySleeps = sleepByDay.get(dayKey) ?? [];

    // Skip days that only have journal entries without check-ins nor sleep logs
    // so we don't skew the overall timeline with empty/void somatic snapshots
    if (dayCheckIns.length === 0 && daySleeps.length === 0) continue;

    const moods = dayCheckIns.map(c => c.mood);
    const energies = dayCheckIns.map(c => c.energy);
    const stresses = dayCheckIns.map(c => c.stress);

    // Unique tags across all check-ins for this day
    const tagsSet = new Set<string>();
    for (const ci of dayCheckIns) {
      for (const tag of ci.tags) tagsSet.add(tag);
    }

    // Journal NLP aggregates
    const keywordFreq: Record<string, number> = {};
    const emotionCountsSum: Record<string, number> = {};
    const sentiments: number[] = [];

    for (const j of dayJournals) {
      // Keyword union with frequency
      for (const kw of j.keywords) {
        keywordFreq[kw] = (keywordFreq[kw] ?? 0) + 1;
      }
      // Sum emotion counts
      for (const [cat, count] of Object.entries(j.emotionCounts)) {
        emotionCountsSum[cat] = (emotionCountsSum[cat] ?? 0) + (count ?? 0);
      }
      // Collect sentiments for averaging
      if (j.sentiment !== null) {
        sentiments.push(j.sentiment);
      }
    }

    // Top keywords by frequency across entries for this day
    const keywordsUnion = Object.entries(keywordFreq)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 12)
      .map(([word]) => word);

    const sentimentAvg = sentiments.length > 0
      ? parseFloat(mean(sentiments).toFixed(3))
      : null;

    // Day of week from the dayKey
    const dow = new Date(dayKey + 'T12:00:00').getDay();

    // Sleep data for this day (latest entry wins if multiple)
    const daySleep = sleepByDay.get(dayKey) ?? [];
    const sleepEntry = daySleep.length > 0 ? daySleep[daySleep.length - 1] : null;

    aggregates.push({
      dayKey,
      moodAvg: parseFloat(mean(moods).toFixed(1)),
      energyAvg: parseFloat(mean(energies).toFixed(1)),
      stressAvg: parseFloat(mean(stresses).toFixed(1)),
      checkInCount: dayCheckIns.length,
      tagsUnion: [...tagsSet],
      hasJournalText: dayJournals.some(j => j.hasText),
      journalCount: dayJournals.length,
      journalWordCount: dayJournals.reduce((sum, j) => sum + j.wordCount, 0),
      keywordsUnion,
      emotionCountsTotal: Object.keys(emotionCountsSum).length > 0 ? emotionCountsSum : {},
      sentimentAvg,
      checkInTimestamps: dayCheckIns.map(c => c.createdAt),
      timeOfDayLabels: dayCheckIns.map(c => c.timeOfDay),
      dayOfWeek: dow,
      sleepDurationHours: sleepEntry?.durationHours ?? null,
      sleepQuality: sleepEntry?.quality ?? null,
      hasDream: daySleep.some(s => s.hasDream),
    });
  }

  // Sort ascending by dayKey (oldest first)
  aggregates.sort((a, b) => a.dayKey.localeCompare(b.dayKey));

  return aggregates;
}

// ─────────────────────────────────────────────────────────────────────────────
// Pipeline: runPipeline
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Run the full pipeline: normalize → aggregate → derive profile.
 *
 * Pure function. Caller passes raw data, gets back aggregated result
 * ready for the insights engine.
 */
export function runPipeline(input: PipelineInput): PipelineResult {
  const { checkIns, journalEntries, sleepEntries, chart, todayContext } = input;

  // Step 1: Normalize
  const normalizedCheckIns = checkIns.map(normalizeCheckIn);
  const normalizedJournals = journalEntries.map(normalizeJournal);
  const normalizedSleep = (sleepEntries ?? []).map(normalizeSleep);

  // Step 2: Aggregate by day
  const dailyAggregates = aggregateByDay(normalizedCheckIns, normalizedJournals, normalizedSleep);

  // Derive chart profile
  const chartProfile = chart ? deriveChartProfile(chart) : null;

  // Window metadata
  const today = todayDayKey();
  const windowDays = dailyAggregates.length > 1
    ? daysBetweenKeys(dailyAggregates[0].dayKey, today)
    : 0;

  return {
    dailyAggregates,
    chartProfile,
    todayContext,
    windowDays,
    totalCheckIns: checkIns.length,
    totalJournalEntries: journalEntries.length,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Re-export normalization helpers (used by insightsEngine)
// ─────────────────────────────────────────────────────────────────────────────

export { energyToNum, stressToNum, clamp, mean };
