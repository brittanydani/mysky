/**
 * Widget Sync Service
 *
 * Pushes streak and daily-reflection-prompt data into the shared
 * App Group UserDefaults so the WidgetKit extension can display them.
 *
 * Call `syncWidgetStreak()` after a check-in is saved and
 * `syncWidgetReflectionPrompt()` when today's questions are loaded.
 */

import { updateWidgetData, WidgetData } from './widgetDataService';
import { getStreakStatus } from '../today/dailyLoop';
import { localDb } from '../storage/localDb';
import { logger } from '../../utils/logger';

/** Last-pushed partial so we can merge with energy data. */
let lastPushed: Partial<WidgetData> = {};

/**
 * Merges new partial fields with the last-known widget state and pushes
 * a full update to the native bridge.
 */
function pushMerged(partial: Partial<WidgetData>): void {
  lastPushed = { ...lastPushed, ...partial };
  // Provide sensible defaults for required fields so the bridge always
  // receives a complete payload.
  const merged: WidgetData = {
    energyLevel: lastPushed.energyLevel ?? 0.5,
    focusTitle: lastPushed.focusTitle ?? '',
    transit: lastPushed.transit ?? '',
    statusText: lastPushed.statusText ?? '',
    captionText: lastPushed.captionText ?? '',
    orbColorR: lastPushed.orbColorR ?? 0.4,
    orbColorG: lastPushed.orbColorG ?? 0.4,
    orbColorB: lastPushed.orbColorB ?? 0.7,
    reflectionPrompt: lastPushed.reflectionPrompt,
    reflectionCategory: lastPushed.reflectionCategory,
    streakCount: lastPushed.streakCount,
    checkedInToday: lastPushed.checkedInToday,
    lastCheckInDate: lastPushed.lastCheckInDate,
  };
  updateWidgetData(merged);
}

/**
 * Push the current streak status into the widget.
 * Safe to call frequently — it reads from the local SQLite DB.
 */
export async function syncWidgetStreak(): Promise<void> {
  try {
    const charts = await localDb.getCharts();
    if (!charts.length) return;
    const streak = await getStreakStatus(charts[0].id);
    pushMerged({
      streakCount: streak.current,
      checkedInToday: streak.checkedInToday,
      lastCheckInDate: streak.checkedInToday
        ? new Date().toISOString().slice(0, 10)
        : undefined,
    });
  } catch (e) {
    logger.error('[WidgetSync] Failed to sync streak:', e);
  }
}

/**
 * Push a reflection prompt string into the widget.
 * Called when the daily questions are generated.
 */
export function syncWidgetReflectionPrompt(
  prompt: string,
  category: string,
): void {
  pushMerged({
    reflectionPrompt: prompt,
    reflectionCategory: category,
  });
}
