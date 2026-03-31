/**
 * store/circadianStore.ts
 * MySky — Circadian Rhythm Terrain Store
 *
 * Holds the 7x24 mood grid produced by the get_weekly_rhythm RPC.
 * Each element is the average mood_value (0–10) for that day/hour slot.
 * Slots with no recorded data default to 5 (mid-range neutral).
 *
 * Data flow:
 *   syncRhythm() → supabase.rpc('get_weekly_rhythm') → grid state
 *   CircadianRhythmTerrain reads grid via useCircadianStore selector.
 *
 * Note: data lives in-memory for the session. Ready for MMKV when added.
 */

import { create } from 'zustand';
import { supabase } from '../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

/** 7-element array (Sun–Sat). Each inner array has 24 elements (hour 0–23). */
export type CircadianGrid = number[][];

interface CircadianStore {
  grid: CircadianGrid;
  isFetching: boolean;
  error: string | null;
  syncRhythm: () => Promise<void>;
  clearCache: () => void;
}

// ─── Guard ────────────────────────────────────────────────────────────────────

function isValidGrid(value: unknown): value is CircadianGrid {
  if (!Array.isArray(value) || value.length !== 7) return false;
  return value.every(
    (row) =>
      Array.isArray(row) &&
      row.length === 24 &&
      row.every((v) => typeof v === 'number' && isFinite(v))
  );
}

// ─── Default ──────────────────────────────────────────────────────────────────

function generateDefaultGrid(): CircadianGrid {
  return Array(7)
    .fill(null)
    .map(() => Array(24).fill(5));
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useCircadianStore = create<CircadianStore>((set) => ({
  grid: generateDefaultGrid(),
  isFetching: false,
  error: null,

  syncRhythm: async () => {
    set({ isFetching: true, error: null });

    const { data, error } = await supabase.rpc('get_weekly_rhythm');

    if (error) {
      set({ isFetching: false, error: error.message });
      return;
    }

    if (!isValidGrid(data)) {
      set({ isFetching: false, error: 'Invalid grid shape from get_weekly_rhythm' });
      return;
    }

    set({ grid: data, isFetching: false });
  },

  clearCache: () => set({ grid: generateDefaultGrid(), error: null }),
}));
