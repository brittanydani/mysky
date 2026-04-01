/**
 * store/correlationStore.ts
 * MySky — Emotional Correlations Store
 *
 * Holds up to 6 Pearson correlation coefficients between emotional metrics
 * produced by the get_emotional_correlations RPC.
 *
 * Data flow:
 *   syncCorrelations() → supabase.rpc → correlations state
 *   CorrelationGyroscope reads via useCorrelationStore
 *
 * No react-native-mmkv: data lives in-memory for the session.
 */

import { create } from 'zustand';
import { supabase } from '../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CorrelationPair {
  metric_a:    string;   // 'mood' | 'energy' | 'stress' | 'anxiety'
  metric_b:    string;
  correlation: number;   // -1.0 to 1.0
}

interface CorrelationStore {
  correlations: CorrelationPair[];
  isFetching:   boolean;
  error:        string | null;
  syncCorrelations: () => Promise<void>;
  clearCache: () => void;
}

// Empty until real user data arrives from the RPC.
// The gyroscope renders nothing when this array is empty.
const INITIAL_CORRELATIONS: CorrelationPair[] = [];

function isValidPairs(value: unknown): value is CorrelationPair[] {
  if (!Array.isArray(value)) return false;
  return value.every(
    (p) =>
      typeof p === 'object' &&
      p !== null &&
      typeof p.metric_a    === 'string' &&
      typeof p.metric_b    === 'string' &&
      typeof p.correlation === 'number' &&
      isFinite(p.correlation),
  );
}

export const useCorrelationStore = create<CorrelationStore>((set) => ({
  correlations: INITIAL_CORRELATIONS,
  isFetching:   false,
  error:        null,

  syncCorrelations: async () => {
    set({ isFetching: true, error: null });

    const { data, error } = await supabase.rpc('get_emotional_correlations');

    if (error) {
      set({ isFetching: false, error: error.message });
      return;
    }

    if (!isValidPairs(data) || (data as CorrelationPair[]).length === 0) {
      // Not enough data yet — leave empty so the UI shows an honest empty state
      set({ isFetching: false });
      return;
    }

    // Clamp correlations to valid Pearson range [-1, 1] as a safety net
    const clamped = (data as CorrelationPair[]).map(p => ({
      ...p,
      correlation: Math.max(-1, Math.min(1, p.correlation)),
    }));

    set({ correlations: clamped, isFetching: false });
  },

  clearCache: () => set({ correlations: INITIAL_CORRELATIONS, error: null }),
}));
