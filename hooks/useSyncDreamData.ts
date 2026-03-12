import { useEffect } from 'react';
import { useDreamMapStore } from '../store/dreamMapStore';

/**
 * Triggers dream cluster data sync via the shared dreamMapStore.
 * Identity is derived server-side from the JWT (auth.uid()) — no user_id arg.
 * @deprecated Prefer calling useDreamMapStore((s) => s.syncData) directly.
 */
export function useSyncDreamData(_daysBack = 60) {
  const syncData = useDreamMapStore((s) => s.syncData);

  useEffect(() => {
    syncData();
  }, [syncData]);
}
