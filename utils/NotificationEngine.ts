// File: utils/NotificationEngine.ts

import type * as NotificationsType from 'expo-notifications';
import { Platform } from 'react-native';

let Notifications: typeof NotificationsType | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Notifications = require('expo-notifications') as typeof NotificationsType;
  // Configure how notifications behave when the app is in the foreground
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    } as NotificationsType.NotificationBehavior),
  });
} catch {
  // expo-notifications native module not available in this environment
}

export class NotificationEngine {
  /**
   * Requests OS-level notification permission. Required on iOS.
   */
  static async requestPermissions(): Promise<boolean> {
    if (!Notifications) return false;
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return false;
    }

    // Android 8+ requires a named channel for local notifications
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('deeper-sky-rhythm', {
        name: 'Daily Rhythm',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#D9BF8C',
      });
    }

    return true;
  }

  /**
   * Cancels all scheduled notifications to prevent duplicate triggers.
   */
  static async clearAllSchedules(): Promise<void> {
    if (!Notifications) return;
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * Schedules the morning dream & rest recall prompt.
   * Default: 8:00 AM daily.
   */
  static async scheduleMorningRhythm(hour: number = 8, minute: number = 0): Promise<void> {
    if (!Notifications) return;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Subconscious Recall ✧',
        body: 'What was revealed in the dark? Log your rest and dream patterns.',
        data: { route: '/(tabs)/growth' },
        color: '#6E8CB4',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
  }

  /**
   * Schedules the evening internal weather prompt.
   * Default: 8:00 PM daily.
   */
  static async scheduleEveningRhythm(hour: number = 20, minute: number = 0): Promise<void> {
    if (!Notifications) return;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Internal Weather ☀',
        body: 'The day is settling. Seal your mood, energy, and stress markers.',
        data: { route: '/checkin' },
        color: '#D9BF8C',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
  }

  /**
   * Master initializer: requests permission, clears stale schedules,
   * and sets the standard dual daily rhythm.
   */
  static async initializeDailyRhythm(): Promise<boolean> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return false;

    await this.clearAllSchedules();
    await this.scheduleMorningRhythm(8, 0);
    await this.scheduleEveningRhythm(20, 0);

    return true;
  }
}
