// NotificationEngine uses dynamic import('expo-notifications').
// We mock the module and AsyncStorage so no native layer is required.

const mockSetNotificationHandler = jest.fn();
const mockGetPermissionsAsync = jest.fn();
const mockRequestPermissionsAsync = jest.fn();
const mockSetNotificationChannelAsync = jest.fn();
const mockCancelAllScheduledNotificationsAsync = jest.fn();
const mockScheduleNotificationAsync = jest.fn();
const mockCancelScheduledNotificationAsync = jest.fn();

jest.mock('expo-notifications', () => ({
  setNotificationHandler: mockSetNotificationHandler,
  getPermissionsAsync: mockGetPermissionsAsync,
  requestPermissionsAsync: mockRequestPermissionsAsync,
  setNotificationChannelAsync: mockSetNotificationChannelAsync,
  cancelAllScheduledNotificationsAsync: mockCancelAllScheduledNotificationsAsync,
  scheduleNotificationAsync: mockScheduleNotificationAsync,
  cancelScheduledNotificationAsync: mockCancelScheduledNotificationAsync,
  AndroidImportance: { DEFAULT: 3 },
  SchedulableTriggerInputTypes: { DAILY: 'daily' },
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationEngine } from '../NotificationEngine';

describe('NotificationEngine', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  describe('requestPermissions()', () => {
    it('returns true when permission is already granted', async () => {
      mockGetPermissionsAsync.mockResolvedValue({ status: 'granted' });
      const result = await NotificationEngine.requestPermissions();
      expect(result).toBe(true);
      expect(mockRequestPermissionsAsync).not.toHaveBeenCalled();
    });

    it('calls requestPermissionsAsync when status is not granted', async () => {
      mockGetPermissionsAsync.mockResolvedValue({ status: 'undetermined' });
      mockRequestPermissionsAsync.mockResolvedValue({ status: 'granted' });
      const result = await NotificationEngine.requestPermissions();
      expect(result).toBe(true);
      expect(mockRequestPermissionsAsync).toHaveBeenCalledTimes(1);
    });

    it('returns false when permission is denied', async () => {
      mockGetPermissionsAsync.mockResolvedValue({ status: 'undetermined' });
      mockRequestPermissionsAsync.mockResolvedValue({ status: 'denied' });
      const result = await NotificationEngine.requestPermissions();
      expect(result).toBe(false);
    });

    it('creates an Android notification channel on Android', async () => {
      const RN = require('react-native');
      RN.Platform.OS = 'android';
      mockGetPermissionsAsync.mockResolvedValue({ status: 'granted' });

      await NotificationEngine.requestPermissions();
      expect(mockSetNotificationChannelAsync).toHaveBeenCalledWith(
        'deeper-sky-rhythm',
        expect.objectContaining({ name: 'Daily Rhythm' }),
      );
      RN.Platform.OS = 'ios';
    });

    it('returns false and does not throw when expo-notifications is unavailable', async () => {
      mockGetPermissionsAsync.mockRejectedValueOnce(new Error('Module unavailable'));
      const result = await NotificationEngine.requestPermissions();
      expect(result).toBe(false);
    });
  });

  describe('clearAllSchedules()', () => {
    it('calls cancelAllScheduledNotificationsAsync', async () => {
      mockCancelAllScheduledNotificationsAsync.mockResolvedValue(undefined);
      await NotificationEngine.clearAllSchedules();
      expect(mockCancelAllScheduledNotificationsAsync).toHaveBeenCalledTimes(1);
    });

    it('does not throw when the module is unavailable', async () => {
      mockCancelAllScheduledNotificationsAsync.mockRejectedValueOnce(new Error('unavailable'));
      await expect(NotificationEngine.clearAllSchedules()).resolves.not.toThrow();
    });
  });

  describe('scheduleMorningRhythm()', () => {
    it('schedules a daily notification with the provided hour and minute', async () => {
      mockScheduleNotificationAsync.mockResolvedValue('notif-id-1');
      await NotificationEngine.scheduleMorningRhythm(7, 30);
      expect(mockScheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          trigger: expect.objectContaining({ hour: 7, minute: 30 }),
        }),
      );
    });

    it('uses default hour=8 minute=0 when no args are passed', async () => {
      mockScheduleNotificationAsync.mockResolvedValue('notif-id-1');
      await NotificationEngine.scheduleMorningRhythm();
      expect(mockScheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          trigger: expect.objectContaining({ hour: 8, minute: 0 }),
        }),
      );
    });

    it('does not throw when the module is unavailable', async () => {
      mockScheduleNotificationAsync.mockRejectedValueOnce(new Error('unavailable'));
      await expect(NotificationEngine.scheduleMorningRhythm()).resolves.not.toThrow();
    });
  });

  describe('scheduleEveningRhythm()', () => {
    it('schedules a daily notification with default hour=20 minute=0', async () => {
      mockScheduleNotificationAsync.mockResolvedValue('notif-id-2');
      await NotificationEngine.scheduleEveningRhythm();
      expect(mockScheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          trigger: expect.objectContaining({ hour: 20, minute: 0 }),
        }),
      );
    });
  });

  describe('scheduleCheckInReminder()', () => {
    it('persists the notification ID to AsyncStorage', async () => {
      mockCancelScheduledNotificationAsync.mockResolvedValue(undefined);
      mockScheduleNotificationAsync.mockResolvedValue('checkin-notif-id');
      await NotificationEngine.scheduleCheckInReminder(21, 0);
      const storedId = await AsyncStorage.getItem('notif_checkin_reminder_id');
      expect(storedId).toBe('checkin-notif-id');
    });

    it('cancels existing reminder before scheduling a new one', async () => {
      await AsyncStorage.setItem('notif_checkin_reminder_id', 'old-id');
      mockCancelScheduledNotificationAsync.mockResolvedValue(undefined);
      mockScheduleNotificationAsync.mockResolvedValue('new-id');
      await NotificationEngine.scheduleCheckInReminder(20, 0);
      expect(mockCancelScheduledNotificationAsync).toHaveBeenCalledWith('old-id');
    });
  });

  describe('cancelCheckInReminder()', () => {
    it('cancels the stored notification and removes the key', async () => {
      await AsyncStorage.setItem('notif_checkin_reminder_id', 'stored-id');
      mockCancelScheduledNotificationAsync.mockResolvedValue(undefined);
      await NotificationEngine.cancelCheckInReminder();
      expect(mockCancelScheduledNotificationAsync).toHaveBeenCalledWith('stored-id');
      const remaining = await AsyncStorage.getItem('notif_checkin_reminder_id');
      expect(remaining).toBeNull();
    });

    it('does nothing when no reminder is stored', async () => {
      await NotificationEngine.cancelCheckInReminder();
      expect(mockCancelScheduledNotificationAsync).not.toHaveBeenCalled();
    });
  });
});
