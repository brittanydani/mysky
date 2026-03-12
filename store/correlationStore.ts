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
}

// Fallback data used while RPC loads (gives the gyroscope interesting motion)
const FALLBACK: CorrelationPair[] = [
  { metric_a: 'mood',   metric_b: 'energy',  correlation:  0.72 },
  { metric_a: 'mood',   metric_b: 'stress',  correlation: -0.61 },
  { metric_a: 'mood',   metric_b: 'anxiety', correlation: -0.48 },
  { metric_a: 'energy', metric_b: 'stress',  correlation: -0.55 },
  { metric_a: 'energy', metric_b: 'anxiety', correlation: -0.38 },
  { metric_a: 'stress', metric_b: 'anxiety', correlation:  0.84 },
];

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
  correlations: FALLBACK,
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
      // Not enough data — keep fallback to keep the gyroscope alive
      set({ isFetching: false });
      return;
    }

    set({ correlations: data as CorrelationPair[], isFetching: false });
  },
}));
