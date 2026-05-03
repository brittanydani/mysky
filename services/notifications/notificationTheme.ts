import { METALLIC_GOLD, MYSTIC } from '../../constants/theme';

export const MYSKY_NOTIFICATION_SCHEDULE_VERSION = 2;

export type MySkyNotificationKind =
  | 'morningRhythm'
  | 'eveningRhythm'
  | 'reflectionReminder'
  | 'transit'
  | 'streakAtRisk'
  | 'reengagement'
  | 'streakMilestone'
  | 'firstPattern'
  | 'moodShift'
  | 'sleepShift'
  | 'weeklyPattern'
  | 'lowRestSupport'
  | 'insight';

export const NOTIFICATION_COLORS = {
  gold: METALLIC_GOLD.mid,
  silverBlue: MYSTIC.silverBlue,
  copper: MYSTIC.copper,
  amethyst: MYSTIC.amethyst,
  sage: MYSTIC.success,
  love: MYSTIC.love,
  softWarning: MYSTIC.error,
} as const;

export interface MySkyNotificationTheme {
  color: string;
  defaultRoute: string;
  analyticsType: string;
}

export const NOTIFICATION_THEME_BY_KIND: Record<MySkyNotificationKind, MySkyNotificationTheme> = {
  morningRhythm: {
    color: NOTIFICATION_COLORS.silverBlue,
    defaultRoute: '/(tabs)/sleep',
    analyticsType: 'morning_rhythm',
  },
  eveningRhythm: {
    color: NOTIFICATION_COLORS.copper,
    defaultRoute: '/checkin',
    analyticsType: 'evening_rhythm',
  },
  reflectionReminder: {
    color: NOTIFICATION_COLORS.amethyst,
    defaultRoute: '/(tabs)/identity',
    analyticsType: 'reflection_reminder',
  },
  transit: {
    color: NOTIFICATION_COLORS.gold,
    defaultRoute: '/(tabs)/chart',
    analyticsType: 'transit',
  },
  streakAtRisk: {
    color: NOTIFICATION_COLORS.copper,
    defaultRoute: '/checkin',
    analyticsType: 'streak_at_risk',
  },
  reengagement: {
    color: NOTIFICATION_COLORS.sage,
    defaultRoute: '/checkin',
    analyticsType: 'reengagement',
  },
  streakMilestone: {
    color: NOTIFICATION_COLORS.gold,
    defaultRoute: '/(tabs)/patterns',
    analyticsType: 'streak_milestone',
  },
  firstPattern: {
    color: NOTIFICATION_COLORS.amethyst,
    defaultRoute: '/(tabs)/patterns',
    analyticsType: 'first_pattern',
  },
  moodShift: {
    color: NOTIFICATION_COLORS.love,
    defaultRoute: '/(tabs)/internal-weather',
    analyticsType: 'mood_shift',
  },
  sleepShift: {
    color: NOTIFICATION_COLORS.silverBlue,
    defaultRoute: '/(tabs)/sleep',
    analyticsType: 'sleep_shift',
  },
  weeklyPattern: {
    color: NOTIFICATION_COLORS.amethyst,
    defaultRoute: '/(tabs)/patterns',
    analyticsType: 'weekly_pattern',
  },
  lowRestSupport: {
    color: NOTIFICATION_COLORS.sage,
    defaultRoute: '/(tabs)/healing',
    analyticsType: 'low_rest_support',
  },
  insight: {
    color: NOTIFICATION_COLORS.gold,
    defaultRoute: '/insights',
    analyticsType: 'insight',
  },
};

export function getNotificationTheme(kind: MySkyNotificationKind): MySkyNotificationTheme {
  return NOTIFICATION_THEME_BY_KIND[kind];
}
