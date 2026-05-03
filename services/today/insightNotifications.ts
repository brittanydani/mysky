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

import { getUserPreference, saveUserPreference } from '../storage/userProfileService';
import { supabaseDb } from '../storage/supabaseDb';
import { toLocalDateString } from '../../utils/dateUtils';
import { logger } from '../../utils/logger';
import {
  cancelMySkyNotification,
  hasNotificationPermission,
  scheduleMySkyNotification,
} from '../notifications/mySkyNotifications';
import type { MySkyNotificationKind } from '../notifications/notificationTheme';

const LAST_INSIGHT_NOTIF_KEY = '@mysky:last_insight_notif_date';
const FIRST_PATTERN_NOTIF_KEY = '@mysky:first_pattern_notif_sent';
const LAST_STREAK_MILESTONE_KEY = '@mysky:last_streak_milestone_notif';
const LAST_WEEKLY_PATTERN_NOTIF_KEY = '@mysky:last_weekly_pattern_notif';
const LAST_LOW_REST_NOTIF_KEY = '@mysky:last_low_rest_notif_date';
const DAY_MS = 24 * 60 * 60 * 1000;

interface InsightNotification {
  title: string;
  body: string;
  route: string;
  kind: MySkyNotificationKind;
  type: string;
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
      kind: 'moodShift',
      type: 'mood_shift',
    };
  }

  // 3-day rise
  if (last3[0] < last3[1] && last3[1] < last3[2] && last3[2] - last3[0] >= 1.5) {
    return {
      title: 'Positive Momentum',
      body: 'Your mood has been rising — something in your rhythm seems to be working. Take a moment to notice what.',
      route: '/(tabs)/patterns',
      kind: 'moodShift',
      type: 'mood_shift',
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
      kind: 'sleepShift',
      type: 'sleep_shift',
    };
  }

  return null;
}

function stressScore(stressLevel?: string): number {
  if (stressLevel === 'high') return 3;
  if (stressLevel === 'medium') return 2;
  if (stressLevel === 'low') return 1;
  return 0;
}

function energyScore(energyLevel?: string): number {
  if (energyLevel === 'high') return 3;
  if (energyLevel === 'medium') return 2;
  if (energyLevel === 'low') return 1;
  return 0;
}

function detectLowRestSupport(
  checkIns: { date: string; stressLevel?: string; energyLevel?: string }[],
): InsightNotification | null {
  const byDate = new Map<string, { stress: number[]; energy: number[] }>();
  for (const checkIn of checkIns) {
    const stress = stressScore(checkIn.stressLevel);
    const energy = energyScore(checkIn.energyLevel);
    if (stress === 0 || energy === 0) continue;
    const day = byDate.get(checkIn.date) ?? { stress: [], energy: [] };
    day.stress.push(stress);
    day.energy.push(energy);
    byDate.set(checkIn.date, day);
  }

  const daily = Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, values]) => ({
      date,
      avgStress: values.stress.reduce((sum, value) => sum + value, 0) / values.stress.length,
      avgEnergy: values.energy.reduce((sum, value) => sum + value, 0) / values.energy.length,
    }));

  if (daily.length < 3) return null;

  const recent3 = daily.slice(-3);
  const strainedDays = recent3.filter(day => day.avgStress >= 2.5 && day.avgEnergy <= 1.5);
  if (strainedDays.length < 2) return null;

  return {
    title: 'A Softer Pace May Help',
    body: 'Your recent check-ins show more strain and lower energy. A small reset may help before you push further.',
    route: '/(tabs)/healing',
    kind: 'lowRestSupport',
    type: 'low_rest_support',
  };
}

function weekKey(date: Date): string {
  const weekStart = new Date(date);
  const daysSinceMonday = (weekStart.getDay() + 6) % 7;
  weekStart.setDate(weekStart.getDate() - daysSinceMonday);
  return toLocalDateString(weekStart);
}

function daysSinceDateKey(dateKey: string, now = new Date()): number {
  const then = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(then.getTime())) return Number.POSITIVE_INFINITY;
  return Math.floor((now.getTime() - then.getTime()) / DAY_MS);
}

function detectWeeklyPattern(
  checkIns: { date: string; moodScore?: number; tags?: string[] }[],
  now = new Date(),
): InsightNotification | null {
  const dayOfWeek = now.getDay();
  if (dayOfWeek !== 0 && dayOfWeek !== 1) return null;

  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoKey = toLocalDateString(sevenDaysAgo);
  const recent = checkIns.filter(checkIn => checkIn.date >= sevenDaysAgoKey);
  const uniqueDays = new Set(recent.map(checkIn => checkIn.date));
  if (uniqueDays.size < 3) return null;

  const byDate = new Map<string, number[]>();
  const tagCounts = new Map<string, number>();
  for (const checkIn of recent) {
    if (typeof checkIn.moodScore === 'number') {
      const values = byDate.get(checkIn.date) ?? [];
      values.push(checkIn.moodScore);
      byDate.set(checkIn.date, values);
    }
    for (const tag of checkIn.tags ?? []) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }

  const dailyMood = Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, values]) => values.reduce((sum, value) => sum + value, 0) / values.length);
  if (dailyMood.length < 3) return null;

  const midpoint = Math.ceil(dailyMood.length / 2);
  const early = dailyMood.slice(0, midpoint);
  const late = dailyMood.slice(midpoint);
  const earlyAvg = early.reduce((sum, value) => sum + value, 0) / early.length;
  const lateAvg = late.length > 0
    ? late.reduce((sum, value) => sum + value, 0) / late.length
    : earlyAvg;
  const topTag = Array.from(tagCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0];
  const tagText = topTag ? ` ${topTag.replace(/_/g, ' ')} has been showing up often.` : '';

  const direction = lateAvg - earlyAvg;
  const body = direction >= 0.75
    ? `Your mood has been lifting across recent check-ins.${tagText} There may be a support worth noticing.`
    : direction <= -0.75
      ? `Your mood has been heavier across recent check-ins.${tagText} A pattern may be asking for care.`
      : `Your recent check-ins have enough signal for a weekly pattern.${tagText} Take a look while it is fresh.`;

  return {
    title: 'This Week Has a Pattern',
    body,
    route: '/(tabs)/patterns',
    kind: 'weeklyPattern',
    type: 'weekly_pattern',
  };
}

const STREAK_MILESTONES = [7, 14, 30, 60, 90, 180, 365];

/**
 * Cancel any pending streak-at-risk notification (call when user checks in).
 */
export async function cancelStreakAtRiskNotification(): Promise<void> {
  try {
    await cancelMySkyNotification('streakAtRisk');
  } catch {
    // ignore
  }
}

/**
 * Cancel any pending re-engagement notification (call when user opens app).
 */
export async function cancelReengagementNotification(): Promise<void> {
  try {
    await cancelMySkyNotification('reengagement');
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
    const checkIns = await supabaseDb.getCheckIns(chartId, 14);
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

    const canSchedule = await hasNotificationPermission();
    if (!canSchedule) {
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
        await scheduleMySkyNotification('streakAtRisk', {
          title: 'Keep Your Streak Going',
          body: 'A quick check-in keeps today connected to the pattern you have been building.',
          route: '/checkin',
          data: { type: 'streak_at_risk' },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: tonight9pm,
          },
        });
        logger.info('[InsightNotif] Streak-at-risk notification scheduled for 9 PM');
      }
      return;
    }

    // ── Re-engagement: 2–3 days absent ───────────────────────────────────────
    if (daysSinceLast === 2 || daysSinceLast === 3) {
      const tomorrow10am = new Date(now);
      tomorrow10am.setDate(tomorrow10am.getDate() + 1);
      tomorrow10am.setHours(10, 0, 0, 0);
      await scheduleMySkyNotification('reengagement', {
        title: 'Your Inner World Is Waiting',
        body: `It's been ${daysSinceLast} days since your last check-in. Even a quick entry keeps your patterns meaningful.`,
        route: '/checkin',
        data: { type: 'reengagement_short' },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: tomorrow10am },
      });
      logger.info('[InsightNotif] Short re-engagement notification scheduled');
      return;
    }

    // ── Lapse re-engagement: 7+ days absent ──────────────────────────────────
    if (daysSinceLast >= 7) {
      const tomorrow10am = new Date(now);
      tomorrow10am.setDate(tomorrow10am.getDate() + 1);
      tomorrow10am.setHours(10, 0, 0, 0);
      await scheduleMySkyNotification('reengagement', {
        title: 'Your Reflection Space Is Waiting',
        body: 'Your reflection space has been quiet. One check-in can reconnect you to your pattern.',
        route: '/(tabs)/internal-weather',
        data: { type: 'reengagement_long' },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: tomorrow10am },
      });
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
    const lastDate = await getUserPreference<string | null>(LAST_INSIGHT_NOTIF_KEY, null);
    if (lastDate === today) return; // Already scheduled today

    const canSchedule = await hasNotificationPermission();
    if (!canSchedule) return;

    const [checkIns, sleepEntries] = await Promise.all([
      supabaseDb.getCheckIns(chartId, 14),
      supabaseDb.getSleepEntries(chartId, 14),
    ]);

    // ── Streak milestone notification ─────────────────────────────────────────
    // Compute current streak
    const dateSet = new Set(checkIns.map((c) => c.date));
    const now = new Date();
    if (now.getHours() < 2) now.setDate(now.getDate() - 1);
    let currentStreak = 0;
    for (let i = 0; i < 366; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      if (dateSet.has(toLocalDateString(d))) currentStreak++;
      else break;
    }
    if (STREAK_MILESTONES.includes(currentStreak)) {
      const lastMilestoneRaw = await getUserPreference<string | null>(LAST_STREAK_MILESTONE_KEY, null);
      const lastMilestone = lastMilestoneRaw ? Number(lastMilestoneRaw) : 0;
      if (lastMilestone !== currentStreak) {
        const Notifications = await import('expo-notifications');
        await scheduleMySkyNotification('streakMilestone', {
          title: `${currentStreak}-Day Milestone`,
          body: `You've checked in for ${currentStreak} days in a row. That kind of consistency is rare — your patterns are becoming genuinely meaningful.`,
          route: '/(tabs)/patterns',
          data: { type: 'streak_milestone' },
          trigger: { seconds: 10, type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL },
        });
        await saveUserPreference(LAST_STREAK_MILESTONE_KEY, String(currentStreak));
        await saveUserPreference(LAST_INSIGHT_NOTIF_KEY, today);
        logger.info('[InsightNotif] Streak milestone notification scheduled:', currentStreak);
        return;
      }
    }

    // One-time "first pattern found" notification after 7+ unique check-in days
    const uniqueDays = new Set(checkIns.map((c) => c.date)).size;
    const alreadySentFirstPattern = await getUserPreference<string | null>(FIRST_PATTERN_NOTIF_KEY, null);
    if (!alreadySentFirstPattern && uniqueDays >= 7) {
      const Notifications = await import('expo-notifications');
      await scheduleMySkyNotification('firstPattern', {
        title: 'Your First Pattern Is Forming',
        body: "You've logged 7 days of check-ins. We've started to see patterns in your mood and energy — tap to uncover what your data is telling you.",
        route: '/(tabs)/patterns',
        data: { type: 'first_pattern' },
        trigger: { seconds: 30, type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL },
      });
      await saveUserPreference(FIRST_PATTERN_NOTIF_KEY, 'true');
      await saveUserPreference(LAST_INSIGHT_NOTIF_KEY, today);
      return;
    }

    const weeklyPattern = detectWeeklyPattern(checkIns, now);
    if (weeklyPattern) {
      const currentWeekKey = weekKey(now);
      const lastWeeklyKey = await getUserPreference<string | null>(LAST_WEEKLY_PATTERN_NOTIF_KEY, null);
      if (lastWeeklyKey !== currentWeekKey) {
        const deliveryAt = new Date(now);
        if (deliveryAt.getHours() >= 10) {
          deliveryAt.setDate(deliveryAt.getDate() + 1);
        }
        deliveryAt.setHours(10, 0, 0, 0);
        const Notifications = await import('expo-notifications');
        await scheduleMySkyNotification(weeklyPattern.kind, {
          title: weeklyPattern.title,
          body: weeklyPattern.body,
          route: weeklyPattern.route,
          data: { type: weeklyPattern.type },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: deliveryAt },
        });
        await saveUserPreference(LAST_WEEKLY_PATTERN_NOTIF_KEY, currentWeekKey);
        await saveUserPreference(LAST_INSIGHT_NOTIF_KEY, today);
        logger.info('[InsightNotif] Weekly pattern notification scheduled');
        return;
      }
    }

    const lastLowRestDate = await getUserPreference<string | null>(LAST_LOW_REST_NOTIF_KEY, null);
    const lowRestInsight = lastLowRestDate && daysSinceDateKey(lastLowRestDate, now) < 3
      ? null
      : detectLowRestSupport(checkIns);

    // Try each trigger in priority order
    const insight =
      lowRestInsight ??
      detectMoodTrend(checkIns) ??
      detectSleepDrop(sleepEntries);

    if (!insight) return;

    // Schedule for 10:00 AM tomorrow (one-time notification, not recurring)
    const tomorrow10am = new Date(now);
    tomorrow10am.setDate(tomorrow10am.getDate() + 1);
    tomorrow10am.setHours(10, 0, 0, 0);
    const Notifications = await import('expo-notifications');
    await scheduleMySkyNotification(insight.kind, {
      title: insight.title,
      body: insight.body,
      route: insight.route,
      data: { type: insight.type },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: tomorrow10am,
      },
    });

    if (insight.kind === 'lowRestSupport') {
      await saveUserPreference(LAST_LOW_REST_NOTIF_KEY, today);
    }
    await saveUserPreference(LAST_INSIGHT_NOTIF_KEY, today);
    logger.info('[InsightNotif] Scheduled:', insight.title);
  } catch (err) {
    logger.error('[InsightNotif] scheduleInsightNotification failed:', err);
  }
}
