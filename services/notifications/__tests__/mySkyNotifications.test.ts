import { NOTIFICATION_COLORS } from '../notificationTheme';
import {
  buildThemedNotificationContent,
  notificationRequestMatchesKind,
  scheduleMySkyNotification,
} from '../mySkyNotifications';

const mockScheduled: any[] = [];
let mockNextId = 1;
const mockPrefs = new Map<string, unknown>();

const mockScheduleNotificationAsync = jest.fn(async (request: any) => {
  const identifier = `notif-${mockNextId++}`;
  mockScheduled.push({ identifier, ...request });
  return identifier;
});
const mockCancelScheduledNotificationAsync = jest.fn(async (identifier: string) => {
  const index = mockScheduled.findIndex(request => request.identifier === identifier);
  if (index >= 0) mockScheduled.splice(index, 1);
});
const mockGetAllScheduledNotificationsAsync = jest.fn(async () => mockScheduled);

jest.mock('expo-notifications', () => ({
  SchedulableTriggerInputTypes: {
    DAILY: 'daily',
    DATE: 'date',
    TIME_INTERVAL: 'timeInterval',
  },
  getPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  scheduleNotificationAsync: mockScheduleNotificationAsync,
  cancelScheduledNotificationAsync: mockCancelScheduledNotificationAsync,
  getAllScheduledNotificationsAsync: mockGetAllScheduledNotificationsAsync,
}));

jest.mock('../../storage/userProfileService', () => ({
  getUserPreference: jest.fn(async (key: string, fallback: unknown) => (
    mockPrefs.has(key) ? mockPrefs.get(key) : fallback
  )),
  saveUserPreference: jest.fn(async (key: string, value: unknown) => {
    mockPrefs.set(key, value);
  }),
  deleteUserPreference: jest.fn(async (key: string) => {
    mockPrefs.delete(key);
  }),
}));

describe('MySky notification scheduling', () => {
  beforeEach(() => {
    mockScheduled.splice(0, mockScheduled.length);
    mockPrefs.clear();
    mockNextId = 1;
    jest.clearAllMocks();
  });

  it('builds notification content with the MySky accent and routing metadata', () => {
    const content = buildThemedNotificationContent('sleepShift', {
      title: 'Sleep Pattern Shift',
      body: 'Rest patterns often show up in mood.',
      route: '/(tabs)/sleep',
      data: { source: 'test' },
    });

    expect(content.color).toBe(NOTIFICATION_COLORS.silverBlue);
    expect(content.data).toEqual(expect.objectContaining({
      route: '/(tabs)/sleep',
      type: 'sleep_shift',
      notificationKind: 'sleepShift',
      scheduleVersion: 2,
      source: 'test',
    }));
  });

  it('recognizes legacy rhythm notifications so OTA migration can cancel them', () => {
    expect(notificationRequestMatchesKind({
      content: {
        title: 'Internal Weather ☀',
        body: null,
        subtitle: null,
        data: { route: '/checkin' },
        categoryIdentifier: null,
        sound: null,
      } as any,
    }, 'eveningRhythm')).toBe(true);

    expect(notificationRequestMatchesKind({
      content: {
        title: 'Subconscious Recall ✧',
        body: null,
        subtitle: null,
        data: { route: '/(tabs)/patterns' },
        categoryIdentifier: null,
        sound: null,
      } as any,
    }, 'morningRhythm')).toBe(true);
  });

  it('replaces old scheduled requests for the same notification kind only', async () => {
    mockScheduled.push(
      {
        identifier: 'legacy-evening',
        content: {
          title: 'Internal Weather ☀',
          body: null,
          subtitle: null,
          data: { route: '/checkin' },
          categoryIdentifier: null,
          sound: null,
        },
        trigger: null,
      },
      {
        identifier: 'transit-kept',
        content: {
          title: 'Transit Moon',
          body: null,
          subtitle: null,
          data: { route: '/(tabs)/chart', type: 'transit' },
          categoryIdentifier: null,
          sound: null,
        },
        trigger: null,
      },
    );

    await scheduleMySkyNotification('eveningRhythm', {
      title: 'Internal Weather',
      body: 'The day is settling.',
      route: '/checkin',
      data: { type: 'evening_rhythm' },
      trigger: { type: 'daily', hour: 20, minute: 0 } as any,
    });

    expect(mockCancelScheduledNotificationAsync).toHaveBeenCalledWith('legacy-evening');
    expect(mockCancelScheduledNotificationAsync).not.toHaveBeenCalledWith('transit-kept');
    expect(mockPrefs.get('@mysky:notif_id:evening_rhythm')).toBe('notif-1');
    expect(mockScheduled.map(request => request.identifier)).toEqual(['transit-kept', 'notif-1']);
    expect(mockScheduled[1].content.color).toBe(NOTIFICATION_COLORS.copper);
  });
});
