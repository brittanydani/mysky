import type {
  NotificationContentInput,
  NotificationRequest,
  NotificationTriggerInput,
} from 'expo-notifications';

import {
  getNotificationTheme,
  MYSKY_NOTIFICATION_SCHEDULE_VERSION,
  type MySkyNotificationKind,
} from './notificationTheme';
import {
  deleteUserPreference,
  getUserPreference,
  saveUserPreference,
} from '../storage/userProfileService';

const SCHEDULE_VERSION_KEY = '@mysky:notification_schedule_version';

const NOTIFICATION_ID_KEYS: Record<MySkyNotificationKind, string[]> = {
  morningRhythm: ['@mysky:notif_id:morning_rhythm'],
  eveningRhythm: ['@mysky:notif_id:evening_rhythm', 'notif_checkin_reminder_id'],
  reflectionReminder: ['@mysky:notif_id:reflection_reminder', 'notif_reflection_reminder_id'],
  transit: ['@mysky:notif_id:transit'],
  streakAtRisk: ['@mysky:notif_id:streak_at_risk', '@mysky:streak_at_risk_notif_id'],
  reengagement: ['@mysky:notif_id:reengagement', '@mysky:reengagement_notif_id'],
  streakMilestone: ['@mysky:notif_id:streak_milestone'],
  firstPattern: ['@mysky:notif_id:first_pattern'],
  moodShift: ['@mysky:notif_id:mood_shift'],
  sleepShift: ['@mysky:notif_id:sleep_shift'],
  weeklyPattern: ['@mysky:notif_id:weekly_pattern'],
  lowRestSupport: ['@mysky:notif_id:low_rest_support'],
  insight: ['@mysky:notif_id:insight'],
};

export interface BuildNotificationContentArgs {
  title: string;
  body: string;
  route?: string;
  data?: Record<string, unknown>;
  subtitle?: string;
  interruptionLevel?: NotificationContentInput['interruptionLevel'];
}

export interface ScheduleMySkyNotificationArgs extends BuildNotificationContentArgs {
  trigger: NotificationTriggerInput;
  replaceExisting?: boolean;
  storeIdentifier?: boolean;
}

type NotificationsModule = typeof import('expo-notifications');

function primaryIdKey(kind: MySkyNotificationKind): string {
  return NOTIFICATION_ID_KEYS[kind][0];
}

function stringDataValue(data: Record<string, unknown> | undefined, key: string): string | undefined {
  const value = data?.[key];
  return typeof value === 'string' ? value : undefined;
}

function requestData(request: Pick<NotificationRequest, 'content'>): Record<string, unknown> | undefined {
  const data = request.content.data;
  return data && typeof data === 'object' ? data : undefined;
}

function titleMatches(request: Pick<NotificationRequest, 'content'>, title: string): boolean {
  return request.content.title === title;
}

function routeMatches(request: Pick<NotificationRequest, 'content'>, route: string): boolean {
  return stringDataValue(requestData(request), 'route') === route;
}

export function notificationRequestMatchesKind(
  request: Pick<NotificationRequest, 'content'>,
  kind: MySkyNotificationKind,
): boolean {
  const data = requestData(request);
  const notificationKind = stringDataValue(data, 'notificationKind');
  if (notificationKind === kind) return true;

  const type = stringDataValue(data, 'type');

  switch (kind) {
    case 'morningRhythm':
      return titleMatches(request, 'Subconscious Recall ✧');
    case 'eveningRhythm':
      return (
        type === 'evening_rhythm' ||
        type === 'checkin_reminder' ||
        (titleMatches(request, 'Internal Weather ☀') && routeMatches(request, '/checkin'))
      );
    case 'reflectionReminder':
      return type === 'reflection_reminder';
    case 'transit':
      return type === 'transit';
    case 'streakAtRisk':
      return type === 'streak_at_risk';
    case 'reengagement':
      return type === 'reengagement' || type === 'reengagement_short' || type === 'reengagement_long';
    case 'streakMilestone':
      return type === 'streak_milestone';
    case 'firstPattern':
      return type === 'first_pattern';
    case 'moodShift':
      return type === 'mood_shift' || titleMatches(request, 'Mood Shift Detected');
    case 'sleepShift':
      return type === 'sleep_shift' || titleMatches(request, 'Sleep Pattern Shift');
    case 'weeklyPattern':
      return type === 'weekly_pattern';
    case 'lowRestSupport':
      return type === 'low_rest_support';
    case 'insight':
      return type === 'insight';
    default:
      return false;
  }
}

export function buildThemedNotificationContent(
  kind: MySkyNotificationKind,
  args: BuildNotificationContentArgs,
): NotificationContentInput {
  const notificationTheme = getNotificationTheme(kind);
  const route = args.route ?? notificationTheme.defaultRoute;
  const data = args.data ?? {};
  const type = stringDataValue(data, 'type') ?? notificationTheme.analyticsType;

  return {
    title: args.title,
    body: args.body,
    subtitle: args.subtitle,
    color: notificationTheme.color,
    interruptionLevel: args.interruptionLevel,
    data: {
      ...data,
      route,
      type,
      notificationKind: kind,
      scheduleVersion: MYSKY_NOTIFICATION_SCHEDULE_VERSION,
    },
  };
}

async function loadNotifications(): Promise<NotificationsModule> {
  return import('expo-notifications');
}

export async function hasNotificationPermission(): Promise<boolean> {
  try {
    const Notifications = await loadNotifications();
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

export async function cancelMySkyNotification(
  kind: MySkyNotificationKind,
  notificationsModule?: NotificationsModule,
): Promise<void> {
  const Notifications = notificationsModule ?? await loadNotifications();
  const canceledIds = new Set<string>();

  for (const key of NOTIFICATION_ID_KEYS[kind]) {
    const id = await getUserPreference<string | null>(key, null);
    if (typeof id === 'string' && id.length > 0 && !canceledIds.has(id)) {
      canceledIds.add(id);
      await Notifications.cancelScheduledNotificationAsync(id);
    }
    await deleteUserPreference(key);
  }

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const request of scheduled) {
    if (notificationRequestMatchesKind(request, kind) && !canceledIds.has(request.identifier)) {
      canceledIds.add(request.identifier);
      await Notifications.cancelScheduledNotificationAsync(request.identifier);
    }
  }
}

export async function cancelMySkyNotifications(
  kinds: MySkyNotificationKind[],
): Promise<void> {
  const Notifications = await loadNotifications();
  for (const kind of kinds) {
    await cancelMySkyNotification(kind, Notifications);
  }
}

export async function scheduleMySkyNotification(
  kind: MySkyNotificationKind,
  args: ScheduleMySkyNotificationArgs,
): Promise<string | null> {
  const Notifications = await loadNotifications();
  if (args.replaceExisting !== false) {
    await cancelMySkyNotification(kind, Notifications);
  }

  const identifier = await Notifications.scheduleNotificationAsync({
    content: buildThemedNotificationContent(kind, args),
    trigger: args.trigger,
  });

  if (args.storeIdentifier !== false) {
    await saveUserPreference(primaryIdKey(kind), identifier);
  }

  return identifier;
}

function numberPreference(value: string | null, fallback: number): number {
  if (value == null) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function rescheduleUserControlledNotificationsFromPrefs(): Promise<void> {
  const Notifications = await loadNotifications();

  await cancelMySkyNotification('morningRhythm', Notifications);
  await cancelMySkyNotification('eveningRhythm', Notifications);
  await cancelMySkyNotification('reflectionReminder', Notifications);

  const hasPermission = await hasNotificationPermission();
  if (!hasPermission) return;

  const [
    rhythmEnabled,
    morningHour,
    morningMinute,
    eveningHour,
    eveningMinute,
    morningUnknown,
    eveningUnknown,
    dailyReminderEnabled,
    reflectionEnabled,
    reflectionHour,
    reflectionMinute,
  ] = await Promise.all([
    getUserPreference<string | null>('notif_enabled', null),
    getUserPreference<string | null>('notif_morning_hour', null),
    getUserPreference<string | null>('notif_morning_minute', null),
    getUserPreference<string | null>('notif_evening_hour', null),
    getUserPreference<string | null>('notif_evening_minute', null),
    getUserPreference<string | null>('notif_morning_unknown', null),
    getUserPreference<string | null>('notif_evening_unknown', null),
    getUserPreference<string | null>('pref_daily_reminder', null),
    getUserPreference<string | null>('notif_reflection_enabled', null),
    getUserPreference<string | null>('notif_reflection_hour', null),
    getUserPreference<string | null>('notif_reflection_minute', null),
  ]);

  const mh = numberPreference(morningHour, 8);
  const mm = numberPreference(morningMinute, 0);
  const eh = numberPreference(eveningHour, 20);
  const em = numberPreference(eveningMinute, 0);
  const rh = numberPreference(reflectionHour, 19);
  const rm = numberPreference(reflectionMinute, 0);

  if (rhythmEnabled === 'true') {
    if (morningUnknown !== 'true') {
      await scheduleMySkyNotification('morningRhythm', {
        title: 'Subconscious Recall',
        body: 'What surfaced overnight? Log your rest and dream patterns.',
        route: '/(tabs)/sleep',
        data: { type: 'morning_rhythm' },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: mh,
          minute: mm,
        },
      });
    }

    if (eveningUnknown !== 'true') {
      await scheduleMySkyNotification('eveningRhythm', {
        title: 'Internal Weather',
        body: 'The day is settling. Seal your mood, energy, and stress markers.',
        route: '/checkin',
        data: { type: 'evening_rhythm' },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: eh,
          minute: em,
        },
      });
    }
  } else if (dailyReminderEnabled === '1') {
    await scheduleMySkyNotification('eveningRhythm', {
      title: 'Internal Weather',
      body: 'The day is settling. Seal your mood, energy, and stress markers.',
      route: '/checkin',
      data: { type: 'checkin_reminder' },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: eh,
        minute: em,
      },
    });
  }

  if (reflectionEnabled === 'true') {
    await scheduleMySkyNotification('reflectionReminder', {
      title: 'Inner World',
      body: 'Your daily reflection questions are ready. A few minutes of honest self-inquiry goes a long way.',
      route: '/(tabs)/identity',
      data: { type: 'reflection_reminder' },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: rh,
        minute: rm,
      },
    });
  }
}

export async function migrateNotificationSchedulesIfNeeded(): Promise<void> {
  const existingVersion = await getUserPreference<number | string | null>(SCHEDULE_VERSION_KEY, null);
  if (Number(existingVersion) === MYSKY_NOTIFICATION_SCHEDULE_VERSION) return;

  await rescheduleUserControlledNotificationsFromPrefs();
  await saveUserPreference(SCHEDULE_VERSION_KEY, MYSKY_NOTIFICATION_SCHEDULE_VERSION);
}
