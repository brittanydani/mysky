import { useEffect } from 'react';
import { useTodayGraphStore, TodayGraphStats } from '../store/todayGraphStore';

interface UseTodayGraphDataArgs {
  daysBack?: number;
  enabled?: boolean;
}

const EMPTY_STATS: TodayGraphStats = {
  averageMood: null,
  minMood: null,
  maxMood: null,
  latestMood: null,
};

export function useTodayGraphData({
  daysBack = 14,
  enabled = true,
}: UseTodayGraphDataArgs = {}) {
  const data            = useTodayGraphStore((state) => state.data);
  const isFetching      = useTodayGraphStore((state) => state.isFetching);
  const error           = useTodayGraphStore((state) => state.error);
  const hydrateFromCache = useTodayGraphStore((state) => state.hydrateFromCache);
  const syncData        = useTodayGraphStore((state) => state.syncData);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    hydrateFromCache();

    syncData(daysBack).then(() => {
      if (cancelled) return;
    });

    return () => {
      cancelled = true;
    };
  }, [daysBack, enabled, hydrateFromCache, syncData]);

  return {
    data,
    isFetching,
    error,
    series: data?.series ?? [],
    stats: data?.stats ?? EMPTY_STATS,
    lastSynced: data?.lastSynced ?? null,
  };
}
