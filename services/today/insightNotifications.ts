/**
 * Insight-Triggered Notification Scheduler
 *
 * Detects meaningful trends in check-in data and schedules
 * proactive notifications. Called once per app foreground after
 * the daily loop completes.
 *
 * Triggers:
 *   - 3-day consecutive mood decline
 *   - 3-day consecutive mood rise (celebrate)
 *   - Sleep quality drop (3-day average)
 *   - Streak milestone approaching
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { localDb } from '../storage/localDb';
import { toLocalDateString } from '../../utils/dateUtils';
import { logger } from '../../utils/logger';

const LAST_INSIGHT_NOTIF_KEY = '@mysky:last_insight_notif_date';

interface InsightNotification {
  title: string;
  body: string;
  route: string;
}

/**
 * Detect a consecutive mood decline or rise over 3+ days.
 * Returns daily mood averages sorted chronologically.
 */
function detectMoodTrend(
  checkIns: { date: string; moodScore: number }[],
): InsightNotification | null {
  // Average by date
  const byDate = new Map<string, number[]>();
  for (const c of checkIns) {
    if (c.moodScore == null) continue;
    if (!byDate.has(c.date)) byDate.set(c.date, []);
    byDate.get(c.date)!.push(c.moodScore);
  }

  const dailyAvgs = Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, vals]) => vals.reduce((a, b) => a + b, 0) / vals.length);

  if (dailyAvgs.length < 3) return null;

  const last3 = dailyAvgs.slice(-3);

  // 3-day decline
  if (last3[0] > last3[1] && last3[1] > last3[2] && last3[0] - last3[2] >= 1.5) {
    return {
      title: 'Mood Shift Detected',
      body: 'Your mood has been dipping for a few days. A quick check-in might help you see what\u2019s underneath.',
      route: '/(tabs)/internal-weather',
    };
  }

  // 3-day rise
  if (last3[0] < last3[1] && last3[1] < last3[2] && last3[2] - last3[0] >= 1.5) {
    return {
      title: 'Positive Momentum ✧',
      body: 'Your mood has been rising — something in your rhythm seems to be working. Take a moment to notice what.',
      route: '/(tabs)/patterns',
    };
  }

  return null;
}

/**
 * Detect sleep quality decline over recent entries.
 */
function detectSleepDrop(
  sleepEntries: { date: string; durationHours?: number }[],
): InsightNotification | null {
  const withDuration = sleepEntries.filter(
    (e): e is { date: string; durationHours: number } => e.durationHours != null,
  );
  if (withDuration.length < 5) return null;

  const sorted = [...withDuration].sort((a, b) => a.date.localeCompare(b.date));
  const recent3 = sorted.slice(-3);
  const older = sorted.slice(-6, -3);

  if (recent3.length < 3 || older.length < 2) return null;

  const recentAvg = recent3.reduce((s, e) => s + e.durationHours, 0) / recent3.length;
  const olderAvg = older.reduce((s, e) => s + e.durationHours, 0) / older.length;

  if (olderAvg - recentAvg >= 1.0 && recentAvg < 6.5) {
    return {
      title: 'Sleep Pattern Shift',
      body: `Your sleep has dropped to ${recentAvg.toFixed(1)}h lately. Rest patterns often show up in mood before you feel them.`,
      route: '/(tabs)/sleep',
    };
  }

  return null;
}

/**
 * Main entry point. Call after daily loop on foreground.
 * Schedules at most one insight notification per day.
 */
export async function scheduleInsightNotification(chartId: string): Promise<void> {
  try {
    const today = toLocalDateString(new Date());
    const lastDate = await AsyncStorage.getItem(LAST_INSIGHT_NOTIF_KEY);
    if (lastDate === today) return; // Already scheduled today

    const [checkIns, sleepEntries] = await Promise.all([
      localDb.getCheckIns(chartId, 14),
      localDb.getSleepEntries(chartId, 14),
    ]);

    // Try each trigger in priority order
    const insight =
      detectMoodTrend(checkIns) ??
      detectSleepDrop(sleepEntries);

    if (!insight) return;

    // Schedule for 10:00 AM tomorrow
    const Notifications = await import('expo-notifications');
    await Notifications.scheduleNotificationAsync({
      content: {
        title: insight.title,
        body: insight.body,
        data: { route: insight.route, type: 'insight' },
        color: '#D4AF37',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 10,
        minute: 0,
      },
    });

    await AsyncStorage.setItem(LAST_INSIGHT_NOTIF_KEY, today);
    logger.info('[InsightNotif] Scheduled:', insight.title);
  } catch (err) {
    logger.error('[InsightNotif] scheduleInsightNotification failed:', err);
  }
}
