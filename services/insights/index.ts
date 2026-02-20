/**
 * Insights Service — Barrel Export
 *
 * Unified API for the insights pipeline.
 *
 * Usage:
 *   import { runPipeline, deriveChartProfile, toDayKey, ... } from '../services/insights';
 */

// Types
export type {
  DayKey,
  ChartProfile,
  Element,
  Modality,
  DailyAggregate,
  TodayContext,
  PipelineInput,
  PipelineResult,
  CacheKey,
  CachedInsightBundle,
} from './types';

// Day Key utilities
export {
  toDayKey,
  todayDayKey,
  daysAgoDayKey,
  daysBetweenKeys,
  dayOfWeek,
  weekKey,
} from './dayKey';

// Chart Profile
export {
  deriveChartProfile,
  regulationStyle,
  emotionalNeeds,
} from './chartProfile';

// Pipeline
export {
  runPipeline,
  energyToNum,
  stressToNum,
} from './pipeline';

// Cache
export {
  buildCacheKeyString,
  makeCacheKey,
  getCachedBundle,
  setCachedBundle,
  invalidateCache,
  needsRecompute,
} from './cache';
