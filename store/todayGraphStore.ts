import { create } from 'zustand';
import { supabase } from '../lib/supabase';

// react-native-mmkv is not installed — data lives in-memory for the session.
// Replace hydrateFromCache / clearCache with MMKV reads/writes once the package is added.

export interface TodayGraphPoint {
  logDate: string;
  moodValue: number;
}

export interface TodayGraphStats {
  averageMood: number | null;
  minMood: number | null;
  maxMood: number | null;
  latestMood: number | null;
}

export interface TodayGraphPayload {
  series: TodayGraphPoint[];
  stats: TodayGraphStats;
  lastSynced: string;
}

interface TodayGraphStore {
  data: TodayGraphPayload | null;
  isFetching: boolean;
  error: string | null;
  hydrateFromCache: () => void;
  clearCache: () => void;
  syncData: (daysBack?: number) => Promise<void>;
}

function isTodayGraphPoint(value: unknown): value is TodayGraphPoint {
  if (!value || typeof value !== 'object') return false;
  const p = value as TodayGraphPoint;
  return typeof p.logDate === 'string' && typeof p.moodValue === 'number';
}

function isNullableNumber(value: unknown): value is number | null {
  return value === null || typeof value === 'number';
}

function isTodayGraphStats(value: unknown): value is TodayGraphStats {
  if (!value || typeof value !== 'object') return false;
  const s = value as TodayGraphStats;
  return (
    isNullableNumber(s.averageMood) &&
    isNullableNumber(s.minMood) &&
    isNullableNumber(s.maxMood) &&
    isNullableNumber(s.latestMood)
  );
}

const EMPTY_STATS: TodayGraphStats = {
  averageMood: null,
  minMood: null,
  maxMood: null,
  latestMood: null,
};

function normalizePayload(data: unknown): TodayGraphPayload {
  const raw = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
  return {
    series: Array.isArray(raw.series) ? raw.series.filter(isTodayGraphPoint) : [],
    stats: isTodayGraphStats(raw.stats) ? raw.stats : EMPTY_STATS,
    lastSynced:
      typeof raw.lastSynced === 'string' ? raw.lastSynced : new Date().toISOString(),
  };
}

export const useTodayGraphStore = create<TodayGraphStore>((set, get) => ({
  data: null,
  isFetching: false,
  error: null,

  // No-op until MMKV is installed — data persists in-memory for the session.
  hydrateFromCache: () => {},

  clearCache: () => {
    set({ data: null });
  },

  syncData: async (daysBack = 14) => {
    if (get().isFetching) return;

    set({ isFetching: true, error: null });

    const { data, error } = await supabase.rpc('get_recent_check_in_series', {
      days_back: daysBack,
    });

    if (error) {
      set({
        isFetching: false,
        error: error.message ?? 'Failed to load today graph data.',
      });
      return;
    }

    set({
      data: normalizePayload(data),
      isFetching: false,
      error: null,
    });
  },
}));
