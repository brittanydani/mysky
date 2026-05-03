// File: utils/NotificationEngine.ts

import {
  cancelMySkyNotification,
  cancelMySkyNotifications,
  rescheduleUserControlledNotificationsFromPrefs,
  scheduleMySkyNotification,
} from '../services/notifications/mySkyNotifications';
import type { MySkyNotificationKind } from '../services/notifications/notificationTheme';

const ALL_KNOWN_NOTIFICATION_KINDS: MySkyNotificationKind[] = [
  'morningRhythm',
  'eveningRhythm',
  'reflectionReminder',
  'transit',
  'streakAtRisk',
  'reengagement',
  'streakMilestone',
  'firstPattern',
  'moodShift',
  'sleepShift',
  'weeklyPattern',
  'lowRestSupport',
  'insight',
];

export class NotificationEngine {
  /**
  * Requests OS-level notification permission and configures foreground
  * notification presentation on first invocation.
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      const Notifications = await import('expo-notifications');

      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: false,
          shouldSetBadge: false,
        }),
      });

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Cancels all known MySky schedules. This intentionally avoids Expo's
   * cancelAllScheduledNotificationsAsync so one settings toggle cannot erase
   * unrelated notification types.
   */
  static async clearAllSchedules(): Promise<void> {
    try {
      await cancelMySkyNotifications(ALL_KNOWN_NOTIFICATION_KINDS);
    } catch {
      // Notifications native module unavailable — skip
    }
  }

  static async rescheduleUserControlledFromPreferences(): Promise<void> {
    try {
      await rescheduleUserControlledNotificationsFromPrefs();
    } catch {
      // Notifications native module unavailable — skip
    }
  }

  /**
   * Schedules the morning dream & rest recall prompt.
   */
  static async scheduleMorningRhythm(hour: number = 8, minute: number = 0): Promise<void> {
    try {
      const Notifications = await import('expo-notifications');
      await scheduleMySkyNotification('morningRhythm', {
        title: 'Subconscious Recall',
        body: 'What surfaced overnight? Log your rest and dream patterns.',
        route: '/(tabs)/sleep',
        data: { type: 'morning_rhythm' },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
        },
      });
    } catch {
      // Notifications native module unavailable — skip
    }
  }

  static async cancelMorningRhythm(): Promise<void> {
    try {
      await cancelMySkyNotification('morningRhythm');
    } catch {
      // Notifications native module unavailable — skip
    }
  }

  /**
   * Schedules the evening internal weather prompt.
   */
  static async scheduleEveningRhythm(hour: number = 20, minute: number = 0): Promise<void> {
    try {
      const Notifications = await import('expo-notifications');
      await scheduleMySkyNotification('eveningRhythm', {
        title: 'Internal Weather',
        body: 'The day is settling. Seal your mood, energy, and stress markers.',
        route: '/checkin',
        data: { type: 'evening_rhythm' },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
        },
      });
    } catch {
      // Notifications native module unavailable — skip
    }
  }

  static async cancelEveningRhythm(): Promise<void> {
    try {
      await cancelMySkyNotification('eveningRhythm');
    } catch {
      // Notifications native module unavailable — skip
    }
  }

  static async cancelDailyRhythm(): Promise<void> {
    await Promise.all([
      NotificationEngine.cancelMorningRhythm(),
      NotificationEngine.cancelEveningRhythm(),
    ]);
  }

  /**
   * Schedules the daily check-in reminder with a tracked identifier so it
   * can be canceled independently of other schedules.
   */
  static async scheduleCheckInReminder(hour: number = 20, minute: number = 0): Promise<void> {
    try {
      const Notifications = await import('expo-notifications');
      await scheduleMySkyNotification('eveningRhythm', {
        title: 'Internal Weather',
        body: 'The day is settling. Seal your mood, energy, and stress markers.',
        route: '/checkin',
        data: { type: 'checkin_reminder' },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
        },
      });
    } catch {
      // Notifications native module unavailable — skip
    }
  }

  /**
   * Cancels the daily check-in reminder by its stored identifier.
   */
  static async cancelCheckInReminder(): Promise<void> {
    try {
      await cancelMySkyNotification('eveningRhythm');
    } catch {
      // Notifications native module unavailable — skip
    }
  }

  /**
   * Schedules the daily inner-world reflection reminder with a tracked
   * identifier so it can be canceled independently.
   */
  static async scheduleReflectionReminder(hour: number = 19, minute: number = 0): Promise<void> {
    try {
      const Notifications = await import('expo-notifications');
      await scheduleMySkyNotification('reflectionReminder', {
        title: 'Inner World',
        body: 'Your daily reflection questions are ready. A few minutes of honest self-inquiry goes a long way.',
        route: '/(tabs)/identity',
        data: { type: 'reflection_reminder' },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
        },
      });
    } catch {
      // Notifications native module unavailable — skip
    }
  }

  /**
   * Cancels the daily reflection reminder by its stored identifier.
   */
  static async cancelReflectionReminder(): Promise<void> {
    try {
      await cancelMySkyNotification('reflectionReminder');
    } catch {
      // Notifications native module unavailable — skip
    }
  }
}
