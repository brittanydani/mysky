import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { consumePendingCheckIns } from '../services/widgets/widgetDataService';
import { syncWidgetStreak } from '../services/widgets/widgetSyncService';
import { CheckInService } from '../services/patterns/checkInService';
import { AstrologyCalculator } from '../services/astrology/calculator';
import { logger } from '../utils/logger';

async function loadLocalDb() {
  const mod = await import('../services/storage/localDb');
  return mod.localDb;
}

/**
 * Listens for the app returning to the foreground and flushes any check-ins
 * that were queued by QuickCheckInIntent inside the widget extension.
 *
 * Each queued record carries only a Unix timestamp (the widget has no access
 * to the natal chart). This hook builds the full DailyCheckIn — with live
 * astrological context — and persists it via CheckInService.
 *
 * Mount once at the root layout level (__layout.tsx).
 */
export function usePendingWidgetCheckIns(): void {
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    // Attempt a flush immediately at mount in case the widget button was tapped
    // while the app was fully terminated (cold-launch path).
    flushPendingCheckIns();
    syncWidgetStreak();

    const subscription = AppState.addEventListener('change', (nextState) => {
      const wasBackground =
        appStateRef.current === 'background' ||
        appStateRef.current === 'inactive';
      if (wasBackground && nextState === 'active') {
        flushPendingCheckIns();
        syncWidgetStreak();
      }
      appStateRef.current = nextState;
    });

    return () => subscription.remove();
  }, []);
}

async function flushPendingCheckIns(): Promise<void> {
  // Pre-check: ensure we have chart data before consuming records from the
  // native bridge. consumePendingCheckIns atomically removes records, so
  // consuming them without a chart would silently drop the data.
  try {
    const localDb = await loadLocalDb();
    const charts = await localDb.getCharts();
    if (!charts.length) {
      logger.warn('[Widget] Skipping widget flush — no chart found yet.');
      return;
    }

    const saved = charts[0];
    const natal = AstrologyCalculator.generateNatalChart({
      date:           saved.birthDate,
      time:           saved.birthTime,
      hasUnknownTime: saved.hasUnknownTime,
      place:          saved.birthPlace,
      latitude:       saved.latitude,
      longitude:      saved.longitude,
      timezone:       saved.timezone,
      houseSystem:    saved.houseSystem,
    });

    consumePendingCheckIns(async (records) => {
      if (!records.length) return;

      for (let i = 0; i < records.length; i++) {
        try {
          await CheckInService.saveCheckIn(
            {
              moodScore:  5,          // neutral baseline — user can refine in-app
              energyLevel: 'medium',
              stressLevel: 'medium',
              tags:        [],
              note:        'Quick check-in logged from Home Screen widget',
            },
            natal,
            saved.id,
          );
        } catch (e) {
          logger.error('[Widget] Failed to flush single pending check-in:', e);
        }
      }

      logger.info(`[Widget] Flushed ${records.length} pending widget check-in(s).`);
      syncWidgetStreak();
    });
  } catch (e) {
    logger.error('[Widget] Failed to prepare widget flush:', e);
  }
}
