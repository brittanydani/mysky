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
 *   - Streak milestone (7, 14, 30, 60, 90, 180, 365 days)
 *   - Streak at risk (checked in yesterday, not yet today)
 *   - Re-engagement after 2–3 days absence
 *   - Lapse re-engagement after 7+ days absence
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { localDb } from '../storage/localDb';
import { toLocalDateString } from '../../utils/dateUtils';
import { logger } from '../../utils/logger';

const LAST_INSIGHT_NOTIF_KEY = '@mysky:last_insight_notif_date';
const FIRST_PATTERN_NOTIF_KEY = '@mysky:first_pattern_notif_sent';
const LAST_STREAK_MILESTONE_KEY = '@mysky:last_streak_milestone_notif';
const STREAK_AT_RISK_NOTIF_ID_KEY = '@mysky:streak_at_risk_notif_id';
const REENGAGEMENT_NOTIF_ID_KEY = '@mysky:reengagement_notif_id';

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

const STREAK_MILESTONES = [7, 14, 30, 60, 90, 180, 365];

/**
 * Cancel any pending streak-at-risk notification (call when user checks in).
 */
export async function cancelStreakAtRiskNotification(): Promise<void> {
  try {
    const id = await AsyncStorage.getItem(STREAK_AT_RISK_NOTIF_ID_KEY);
    if (id) {
      const Notifications = await import('expo-notifications');
      await Notifications.cancelScheduledNotificationAsync(id);
      await AsyncStorage.removeItem(STREAK_AT_RISK_NOTIF_ID_KEY);
    }
  } catch {
    // ignore
  }
}

/**
 * Cancel any pending re-engagement notification (call when user opens app).
 */
export async function cancelReengagementNotification(): Promise<void> {
  try {
    const id = await AsyncStorage.getItem(REENGAGEMENT_NOTIF_ID_KEY);
    if (id) {
      const Notifications = await import('expo-notifications');
      await Notifications.cancelScheduledNotificationAsync(id);
      await AsyncStorage.removeItem(REENGAGEMENT_NOTIF_ID_KEY);
    }
  } catch {
    // ignore
  }
}

/**
 * Schedules streak-at-risk and re-engagement notifications.
 * These are time-sensitive and run independently of the once-per-day insight gate.
 */
async function scheduleStreakAndReengagementNotifications(
  chartId: string,
): Promise<void> {
  try {
    const Notifications = await import('expo-notifications');
    const checkIns = await localDb.getCheckIns(chartId, 14);
    const dateSet = new Set(checkIns.map((c) => c.date));

    const now = new Date();
    if (now.getHours() < 2) now.setDate(now.getDate() - 1);
    const today = toLocalDateString(now);
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = toLocalDateString(yesterday);

    const checkedInToday = dateSet.has(today);

    // Cancel any stale re-engagement notification on every foreground
    await cancelReengagementNotification();

    if (checkedInToday) {
      // User already checked in — cancel any at-risk notification too
      await cancelStreakAtRiskNotification();
      return;
    }

    // Compute days since last check-in
    let daysSinceLast = -1;
    for (let i = 0; i < 14; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      if (dateSet.has(toLocalDateString(d))) {
        daysSinceLast = i;
        break;
      }
    }

    // ── Streak-at-risk: checked in yesterday, not yet today ──────────────────
    if (dateSet.has(yesterdayStr)) {
      // Compute streak length from yesterday
      let streakLen = 0;
      for (let i = 1; i <= 90; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        if (dateSet.has(toLocalDateString(d))) streakLen++;
        else break;
      }

      // Cancel old at-risk id if any, then schedule for tonight at 9 PM
      await cancelStreakAtRiskNotification();
      const tonight9pm = new Date(now);
      tonight9pm.setHours(21, 0, 0, 0);
      // Only schedule if 9 PM is still in the future today
      if (tonight9pm > new Date()) {
        const streakLabel = streakLen === 1 ? '1-day start' : `${streakLen}-day streak`;
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: `Don't lose your ${streakLabel} 🔥`,
            body: "You haven't logged today yet. Check in before midnight to keep your streak alive.",
            data: { route: '/checkin', type: 'streak_at_risk' },
            color: '#D98C8C',
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: tonight9pm,
          },
        });
        await AsyncStorage.setItem(STREAK_AT_RISK_NOTIF_ID_KEY, id);
        logger.info('[InsightNotif] Streak-at-risk notification scheduled for 9 PM');
      }
      return;
    }

    // ── Re-engagement: 2–3 days absent ───────────────────────────────────────
    if (daysSinceLast === 2 || daysSinceLast === 3) {
      const tomorrow10am = new Date(now);
      tomorrow10am.setDate(tomorrow10am.getDate() + 1);
      tomorrow10am.setHours(10, 0, 0, 0);
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Your inner world is waiting ✧',
          body: `It's been ${daysSinceLast} days since your last check-in. Even a quick entry keeps your patterns meaningful.`,
          data: { route: '/checkin', type: 'reengagement_short' },
          color: '#A88BEB',
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: tomorrow10am },
      });
      await AsyncStorage.setItem(REENGAGEMENT_NOTIF_ID_KEY, id);
      logger.info('[InsightNotif] Short re-engagement notification scheduled');
      return;
    }

    // ── Lapse re-engagement: 7+ days absent ──────────────────────────────────
    if (daysSinceLast >= 7) {
      const tomorrow10am = new Date(now);
      tomorrow10am.setDate(tomorrow10am.getDate() + 1);
      tomorrow10am.setHours(10, 0, 0, 0);
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'We miss you ✦',
          body: "Your reflection space has been quiet. Come back — even one check-in reconnects you to your pattern.",
          data: { route: '/(tabs)/internal-weather', type: 'reengagement_long' },
          color: '#D4AF37',
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: tomorrow10am },
      });
      await AsyncStorage.setItem(REENGAGEMENT_NOTIF_ID_KEY, id);
      logger.info('[InsightNotif] Long re-engagement notification scheduled');
    }
  } catch (err) {
    logger.error('[InsightNotif] scheduleStreakAndReengagementNotifications failed:', err);
  }
}

/**
 * Main entry point. Call after daily loop on foreground.
 * Schedules at most one insight notification per day.
 * Also handles streak-at-risk and re-engagement (not gated by daily limit).
 */
export async function scheduleInsightNotification(chartId: string): Promise<void> {
  // Always run streak/re-engagement logic — not gated by daily limit
  await scheduleStreakAndReengagementNotifications(chartId);

  try {
    const today = toLocalDateString(new Date());
    const lastDate = await AsyncStorage.getItem(LAST_INSIGHT_NOTIF_KEY);
    if (lastDate === today) return; // Already scheduled today

    const [checkIns, sleepEntries] = await Promise.all([
      localDb.getCheckIns(chartId, 14),
      localDb.getSleepEntries(chartId, 14),
    ]);

    // ── Streak milestone notification ─────────────────────────────────────────
    // Compute current streak
    const dateSet = new Set(checkIns.map((c) => c.date));
    const now = new Date();
    if (now.getHours() < 2) now.setDate(now.getDate() - 1);
    let currentStreak = 0;
    for (let i = 0; i < 90; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      if (dateSet.has(toLocalDateString(d))) currentStreak++;
      else break;
    }
    if (STREAK_MILESTONES.includes(currentStreak)) {
      const lastMilestoneRaw = await AsyncStorage.getItem(LAST_STREAK_MILESTONE_KEY);
      const lastMilestone = lastMilestoneRaw ? Number(lastMilestoneRaw) : 0;
      if (lastMilestone !== currentStreak) {
        await AsyncStorage.setItem(LAST_STREAK_MILESTONE_KEY, String(currentStreak));
        const Notifications = await import('expo-notifications');
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `${currentStreak}-Day Milestone ✦`,
            body: `You've checked in for ${currentStreak} days in a row. That kind of consistency is rare — your patterns are becoming genuinely meaningful.`,
            data: { route: '/(tabs)/patterns', type: 'streak_milestone' },
            color: '#D4AF37',
          },
          trigger: { seconds: 10, type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL },
        });
        await AsyncStorage.setItem(LAST_INSIGHT_NOTIF_KEY, today);
        logger.info('[InsightNotif] Streak milestone notification scheduled:', currentStreak);
        return;
      }
    }

    // One-time "first pattern found" notification after 7+ unique check-in days
    const uniqueDays = new Set(checkIns.map((c) => c.date)).size;
    const alreadySentFirstPattern = await AsyncStorage.getItem(FIRST_PATTERN_NOTIF_KEY);
    if (!alreadySentFirstPattern && uniqueDays >= 7) {
      await AsyncStorage.setItem(FIRST_PATTERN_NOTIF_KEY, 'true');
      const Notifications = await import('expo-notifications');
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Your first pattern is forming ✧',
          body: "You've logged 7 days of check-ins. We've started to see patterns in your mood and energy — tap to uncover what your data is telling you.",
          data: { route: '/(tabs)/patterns', type: 'first_pattern' },
          color: '#A88BEB',
        },
        trigger: { seconds: 30, type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL },
      });
      await AsyncStorage.setItem(LAST_INSIGHT_NOTIF_KEY, today);
      return;
    }

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
