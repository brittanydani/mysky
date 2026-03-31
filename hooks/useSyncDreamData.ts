import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { useDreamMapStore } from '../store/dreamMapStore';

/**
 * Triggers dream cluster data sync via the shared dreamMapStore on focus.
 * Identity is derived server-side from the JWT (auth.uid()) — no user_id arg.
 */
export function useSyncDreamData() {
  const syncData = useDreamMapStore((s) => s.syncData);

  useFocusEffect(
    useCallback(() => {
      syncData();
    }, [syncData])
  );
}
