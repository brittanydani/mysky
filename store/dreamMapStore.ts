import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface DreamNodeData {
  id: string;
  label: string;
  color: string;
  size: number;
  recurrenceCount: number;
  detail: string;
}

export interface DreamLinkData {
  source: string;
  target: string;
  strength: number;
  coOccurrenceCount?: number;
}

export interface DreamClusterPayload {
  nodes: DreamNodeData[];
  links: DreamLinkData[];
  lastSynced: string;
}

interface DreamMapStore {
  data: DreamClusterPayload | null;
  activeNode: DreamNodeData | null;
  isFetching: boolean;
  error: string | null;
  hydrateFromCache: () => void;
  clearCache: () => void;
  setActiveNode: (node: DreamNodeData | null) => void;
  clearActiveNode: () => void;
  syncData: () => Promise<void>;
}

function isDreamNode(value: unknown): value is DreamNodeData {
  if (!value || typeof value !== 'object') return false;
  const n = value as DreamNodeData;
  return (
    typeof n.id === 'string' &&
    typeof n.label === 'string' &&
    typeof n.color === 'string' &&
    typeof n.size === 'number' &&
    typeof n.recurrenceCount === 'number' &&
    typeof n.detail === 'string'
  );
}

function isDreamLink(value: unknown): value is DreamLinkData {
  if (!value || typeof value !== 'object') return false;
  const l = value as DreamLinkData;
  return (
    typeof l.source === 'string' &&
    typeof l.target === 'string' &&
    typeof l.strength === 'number'
  );
}

export const useDreamMapStore = create<DreamMapStore>((set, get) => ({
  data: null,
  activeNode: null,
  isFetching: false,
  error: null,

  // No-op until MMKV is installed — data persists in-memory for the session
  hydrateFromCache: () => {},

  clearCache: () => {
    set({ data: null });
  },

  setActiveNode: (node) => set({ activeNode: node }),
  clearActiveNode: () => set({ activeNode: null }),

  syncData: async () => {
    if (get().isFetching) return;
    set({ isFetching: true, error: null });

    const { data, error } = await supabase.rpc('get_dream_cluster_data', {
      days_back: 30,
    });

    if (error) {
      set({
        isFetching: false,
        error: error.message ?? 'Failed to load dream cluster data.',
      });
      return;
    }

    const raw = data as Record<string, unknown> | null;
    const payload: DreamClusterPayload = {
      nodes: Array.isArray(raw?.nodes)
        ? (raw!.nodes as unknown[]).filter(isDreamNode)
        : [],
      links: Array.isArray(raw?.links)
        ? (raw!.links as unknown[]).filter(isDreamLink)
        : [],
      lastSynced:
        typeof raw?.lastSynced === 'string'
          ? raw.lastSynced
          : new Date().toISOString(),
    };

    set({ data: payload, isFetching: false, error: null });
  },
}));

