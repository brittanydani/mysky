/**
 * store/resonanceStore.ts
 * Zustand store for the CinematicResonanceHelix GlobalCanvas scene.
 *
 * react-native-mmkv is not installed — data lives in-memory for the session.
 * `hydrateFromCache` is a no-op placeholder so callers don't need to change
 * if MMKV is added later.
 */

import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface ResonancePayload {
  userData:    number[];
  partnerData: number[];
  insightText?: string;
  lastSynced:  string;
}

interface ResonanceStore {
  data:            ResonancePayload | null;
  isFetching:      boolean;
  error:           string | null;
  hydrateFromCache: () => void;
  clearCache:       () => void;
  syncData:         () => Promise<void>;
}

function isValidPayload(value: unknown): value is ResonancePayload {
  if (!value || typeof value !== 'object') return false;
  const p = value as ResonancePayload;
  return Array.isArray(p.userData) && Array.isArray(p.partnerData) && typeof p.lastSynced === 'string';
}

export const useResonanceStore = create<ResonanceStore>((set, get) => ({
  data:       null,
  isFetching: false,
  error:      null,

  // No-op until MMKV is installed — does not throw so callers are future-safe
  hydrateFromCache: () => {
    // If we already have data in the store from a previous sync this session,
    // there is nothing to do. MMKV persistence can be layered in here later.
  },

  clearCache: () => {
    set({ data: null });
  },

  syncData: async () => {
    if (get().isFetching) return;
    set({ isFetching: true, error: null });

    const { data, error } = await supabase.rpc('get_resonance_payload', {
      days_back: 14,
    });

    if (error) {
      set({
        isFetching: false,
        error: error.message ?? 'Failed to load resonance data.',
      });
      return;
    }

    const raw = data as Record<string, unknown> | null;
    const payload: ResonancePayload = {
      userData:    Array.isArray(raw?.userData)    ? (raw!.userData as number[])    : [6, 7, 5, 8, 6, 9, 7],
      partnerData: Array.isArray(raw?.partnerData) ? (raw!.partnerData as number[]) : [5, 6, 6, 7, 8, 8, 6],
      insightText: typeof raw?.insightText === 'string'
        ? raw.insightText
        : 'Notice where the strands move closest together — those brighter intervals show the strongest resonance.',
      lastSynced: typeof raw?.lastSynced === 'string'
        ? raw.lastSynced
        : new Date().toISOString(),
    };

    if (!isValidPayload(payload)) {
      set({ isFetching: false, error: 'Invalid payload format.' });
      return;
    }

    set({ data: payload, isFetching: false, error: null });
  },
}));
