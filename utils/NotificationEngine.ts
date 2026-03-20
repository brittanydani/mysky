// File: utils/NotificationEngine.ts

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CHECK_IN_ID_KEY = 'notif_checkin_reminder_id';

export class NotificationEngine {
  /**
   * Requests OS-level notification permission. Required on iOS.
   * Also creates the Android notification channel on first call.
   * Configures foreground notification presentation on first invocation.
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
    } catch {
      return false;
    }
  }

  /**
   * Cancels all scheduled notifications to prevent duplicate triggers.
   */
  static async clearAllSchedules(): Promise<void> {
    try {
      const Notifications = await import('expo-notifications');
      await Notifications.cancelAllScheduledNotificationsAsync();
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
    } catch {
      // Notifications native module unavailable — skip
    }
  }

  /**
   * Schedules the daily check-in reminder with a tracked identifier so it
   * can be cancelled independently of other schedules.
   */
  static async scheduleCheckInReminder(hour: number = 20, minute: number = 0): Promise<void> {
    try {
      // Cancel any existing check-in reminder first
      await NotificationEngine.cancelCheckInReminder();

      const Notifications = await import('expo-notifications');
      const id = await Notifications.scheduleNotificationAsync({
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

      await AsyncStorage.setItem(CHECK_IN_ID_KEY, id);
    } catch {
      // Notifications native module unavailable — skip
    }
  }

  /**
   * Cancels the daily check-in reminder by its stored identifier.
   */
  static async cancelCheckInReminder(): Promise<void> {
    try {
      const id = await AsyncStorage.getItem(CHECK_IN_ID_KEY);
      if (id) {
        const Notifications = await import('expo-notifications');
        await Notifications.cancelScheduledNotificationAsync(id);
        await AsyncStorage.removeItem(CHECK_IN_ID_KEY);
      }
    } catch {
      // Notifications native module unavailable — skip
    }
  }
}
