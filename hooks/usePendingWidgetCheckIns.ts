import { useEffect } from 'react';

/**
 * Widgets temporarily disabled.
 * This hook is intentionally a no-op for now.
 */
export function usePendingWidgetCheckIns(): void {
  useEffect(() => {
    return;
  }, []);
}
