/**
 * Transit Notification Scheduler
 *
 * Computes significant transits for the next day and schedules a
 * personalized local notification. Called once per day (typically
 * on app foreground or after the daily loop completes).
 *
 * Only schedules if:
 *   1. The user has a saved natal chart with birth coordinates
 *   2. Notification permissions are granted
 *   3. A meaningful transit aspect is found
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTransitInfo, computeTransitAspectsToNatal } from '../astrology/transits';
import { NatalChart } from '../astrology/types';
import { toLocalDateString } from '../../utils/dateUtils';
import { logger } from '../../utils/logger';

const LAST_TRANSIT_NOTIF_KEY = '@mysky:last_transit_notif_date';
const TRANSIT_NOTIF_HOUR = 7;
const TRANSIT_NOTIF_MINUTE = 45;

// Human-readable aspect descriptions for notification body
const ASPECT_LABELS: Record<string, string> = {
  conjunction: 'aligns with',
  sextile: 'supports',
  square: 'challenges',
  trine: 'harmonizes with',
  opposition: 'opposes',
};

interface TransitNotification {
  title: string;
  body: string;
}

/**
 * Build a notification message from the most significant transit aspect.
 */
function buildTransitMessage(
  aspects: { transitPlanet: string; natalPlanet: string; aspectType: string }[],
): TransitNotification | null {
  if (aspects.length === 0) return null;

  // Prioritize aspects involving personal planets (Sun, Moon, Venus)
  const prioritized = [...aspects].sort((a, b) => {
    const priority = ['Sun', 'Moon', 'Venus', 'Saturn', 'Ascendant'];
    const aIdx = priority.indexOf(a.natalPlanet);
    const bIdx = priority.indexOf(b.natalPlanet);
    return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx);
  });

  const top = prioritized[0];
  const verb = ASPECT_LABELS[top.aspectType] || 'aspects';
  const natalLabel = top.natalPlanet === 'Ascendant' ? 'your Rising sign' : `your natal ${top.natalPlanet}`;

  return {
    title: `Transit ${top.transitPlanet} ✧`,
    body: `The Moon ${verb} ${natalLabel} today. Notice how this lands in your body and mood.`,
  };
}

/**
 * Schedule a transit notification for tomorrow morning if a significant
 * aspect is found. Skips if already scheduled today.
 */
export async function scheduleTransitNotification(
  chart: NatalChart,
): Promise<void> {
  try {
    const today = toLocalDateString(new Date());
    const lastDate = await AsyncStorage.getItem(LAST_TRANSIT_NOTIF_KEY);
    if (lastDate === today) return; // Already checked today

    // Compute tomorrow's transits
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const lat = chart.birthData?.latitude ?? 0;
    const lon = chart.birthData?.longitude ?? 0;

    const transitInfo = getTransitInfo(tomorrow, lat, lon);
    const aspects = computeTransitAspectsToNatal(chart, transitInfo.longitudes);

    const message = buildTransitMessage(
      aspects.map((a) => ({
        transitPlanet: 'Moon',
        natalPlanet: a.pointB,
        aspectType: a.type,
      })),
    );

    if (!message) {
      await AsyncStorage.setItem(LAST_TRANSIT_NOTIF_KEY, today);
      return;
    }

    const Notifications = await import('expo-notifications');

    // Cancel previous transit notification if any
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of scheduled) {
      if (notif.content.data?.type === 'transit') {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: message.title,
        body: message.body,
        data: { route: '/(tabs)/chart', type: 'transit' },
        color: '#A88BEB',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: TRANSIT_NOTIF_HOUR,
        minute: TRANSIT_NOTIF_MINUTE,
      },
    });

    await AsyncStorage.setItem(LAST_TRANSIT_NOTIF_KEY, today);
    logger.info(`[TransitNotif] Scheduled: ${message.body}`);
  } catch (e) {
    logger.warn('[TransitNotif] Failed to schedule transit notification:', e);
  }
}
