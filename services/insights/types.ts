/**
 * Insights Pipeline — Types
 *
 * Core types for the data pipeline that transforms raw check-ins,
 * journal entries, natal chart, and daily context into insight-ready data.
 */

import { NatalChart } from '../astrology/types';

// ─────────────────────────────────────────────────────────────────────────────
// Day Key
// ─────────────────────────────────────────────────────────────────────────────

/** YYYY-MM-DD in user's local timezone — the universal merge key */
export type DayKey = string;

// ─────────────────────────────────────────────────────────────────────────────
// Chart Profile (stable user baseline — computed once, cached)
// ─────────────────────────────────────────────────────────────────────────────

export type Element = 'Fire' | 'Earth' | 'Air' | 'Water';
export type Modality = 'Cardinal' | 'Fixed' | 'Mutable';

export interface ChartProfile {
  /** Dominant element across personal planets (Sun/Moon/Merc/Venus/Mars) */
  dominantElement: Element;
  /** Dominant modality across personal planets */
  dominantModality: Modality;

  /** Moon sign name (e.g. "Cancer") */
  moonSign: string;
  /** Moon house (0 if birth time unknown) */
  moonHouse: number;

  /** Saturn sign name */
  saturnSign: string;
  /** Saturn house (0 if unknown) */
  saturnHouse: number;

  /** Chiron sign name (null if not in chart) */
  chironSign: string | null;
  /** Chiron house (0 if unknown) */
  chironHouse: number;

  /** True if 2+ personal planets in 6th house */
  has6thHouseEmphasis: boolean;
  /** True if 2+ personal planets in 12th house */
  has12thHouseEmphasis: boolean;

  /** Stelliums: groups of 3+ planets in same sign */
  stelliums: { sign: string; count: number }[];

  /** Element counts across personal planets */
  elementCounts: Record<Element, number>;
  /** Modality counts across personal planets */
  modalityCounts: Record<Modality, number>;

  /** Whether birth time is known (affects house-based insights) */
  timeKnown: boolean;

  /** Hash for cache invalidation */
  versionHash: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Daily Aggregate (one row per dayKey — the time series)
// ─────────────────────────────────────────────────────────────────────────────

export interface DailyAggregate {
  dayKey: DayKey;

  /** Average mood across all check-ins for this day (1–10) */
  moodAvg: number;
  /** Average energy across all check-ins for this day (1–10) */
  energyAvg: number;
  /** Average stress across all check-ins for this day (1–10) */
  stressAvg: number;

  /** Number of check-ins this day */
  checkInCount: number;

  /** Union of all tags across check-ins for this day */
  tagsUnion: string[];

  /** Whether journal text exists for this day */
  hasJournalText: boolean;
  /** Number of journal entries for this day */
  journalCount: number;
  /** Total word count across journal entries */
  journalWordCount: number;

  // ── Journal NLP aggregates (from v10 NLP summaries) ──────────────────────
  /** Union of keywords across all entries for this day (top N by freq) */
  keywordsUnion: string[];
  /** Summed emotion counts across entries for this day */
  emotionCountsTotal: Partial<Record<string, number>>;
  /** Average sentiment across entries for this day (if present) */
  sentimentAvg: number | null;

  /** Check-in creation timestamps (preserved from raw data) */
  checkInTimestamps: string[];

  /** Per-check-in timeOfDay labels ('morning'|'afternoon'|'evening'|'night') for time-of-day analysis */
  timeOfDayLabels: string[];

  /** Day of week 0–6 (Sunday = 0) */
  dayOfWeek: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Today Context
// ─────────────────────────────────────────────────────────────────────────────

export interface TodayContext {
  dayKey: DayKey;
  theme: string | null;
  mantra: string | null;
  /** Optional transit intensity score (0–10) */
  transitIntensity?: number;
  /** Key topics for today */
  topics?: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Pipeline Input / Output
// ─────────────────────────────────────────────────────────────────────────────

export interface PipelineInput {
  /** Raw check-ins (all or last 90 days) */
  checkIns: import('../patterns/types').DailyCheckIn[];
  /** Raw journal entries (all or last 90 days) */
  journalEntries: import('../storage/models').JournalEntry[];
  /** Natal chart (null if user has no chart) */
  chart: NatalChart | null;
  /** Today's context (optional) */
  todayContext: TodayContext | null;
}

export interface PipelineResult {
  /** The aggregated daily time series */
  dailyAggregates: DailyAggregate[];
  /** Derived chart profile (null if no chart) */
  chartProfile: ChartProfile | null;
  /** Today context passed through */
  todayContext: TodayContext | null;

  /** Window metadata */
  windowDays: number;
  totalCheckIns: number;
  totalJournalEntries: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Cache
// ─────────────────────────────────────────────────────────────────────────────

export interface CacheKey {
  lastCheckInAt: string;
  lastJournalAt: string;
  todayDayKey: DayKey;
  chartProfileHash: string;
}

export interface CachedInsightBundle {
  key: string;
  bundle: import('../../utils/insightsEngine').InsightBundle;
  createdAt: string;
}
