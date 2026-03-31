import AsyncStorage from '@react-native-async-storage/async-storage';

import { logger } from '../../utils/logger';

const ANALYTICS_KEY = 'mysky.growth.analytics.v1';
const MAX_RECENT_EVENTS = 120;

type PrimitiveValue = string | number | boolean;

export type GrowthEventName =
  | 'app_opened'
  | 'onboarding_started'
  | 'onboarding_completed'
  | 'backup_restored'
  | 'checkin_hub_viewed'
  | 'checkin_path_selected'
  | 'mood_checkin_saved'
  | 'sleep_entry_saved'
  | 'journal_entry_saved'
  | 'paywall_viewed'
  | 'paywall_plan_selected'
  | 'paywall_purchase_started'
  | 'paywall_purchase_succeeded'
  | 'paywall_restore_succeeded'
  | 'home_quickstart_selected'
  | 'analytics_screen_viewed'
  | 'analytics_snapshot_shared';

export interface GrowthEventRecord {
  name: GrowthEventName;
  at: string;
  metadata?: Record<string, PrimitiveValue>;
}

export interface GrowthAnalyticsState {
  schemaVersion: 1;
  counts: Record<string, number>;
  firstSeenAt: Record<string, string>;
  lastSeenAt: Record<string, string>;
  recentEvents: GrowthEventRecord[];
  experiments: Record<string, string>;
}

function createDefaultState(): GrowthAnalyticsState {
  return {
    schemaVersion: 1,
    counts: {},
    firstSeenAt: {},
    lastSeenAt: {},
    recentEvents: [],
    experiments: {},
  };
}

function normalizeMetadata(metadata?: Record<string, PrimitiveValue>): Record<string, PrimitiveValue> | undefined {
  if (!metadata) return undefined;

  const entries = Object.entries(metadata)
    .filter(([, value]) => value !== undefined && value !== null)
    .slice(0, 6)
    .map(([key, value]) => [key, typeof value === 'string' ? value.slice(0, 64) : value] as const);

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

function buildCountKeys(name: GrowthEventName, metadata?: Record<string, PrimitiveValue>): string[] {
  const keys: string[] = [name];
  if (!metadata) return keys;

  for (const [key, value] of Object.entries(metadata)) {
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      keys.push(`${name}:${key}=${String(value)}`);
    }
  }

  return keys;
}

async function readState(): Promise<GrowthAnalyticsState> {
  try {
    const raw = await AsyncStorage.getItem(ANALYTICS_KEY);
    if (!raw) return createDefaultState();

    const parsed = JSON.parse(raw) as Partial<GrowthAnalyticsState>;
    return {
      schemaVersion: 1,
      counts: parsed.counts ?? {},
      firstSeenAt: parsed.firstSeenAt ?? {},
      lastSeenAt: parsed.lastSeenAt ?? {},
      recentEvents: Array.isArray(parsed.recentEvents) ? parsed.recentEvents.slice(-MAX_RECENT_EVENTS) : [],
      experiments: parsed.experiments ?? {},
    };
  } catch (error) {
    logger.error('[GrowthAnalytics] Failed to read state:', error);
    return createDefaultState();
  }
}

async function writeState(state: GrowthAnalyticsState): Promise<void> {
  try {
    await AsyncStorage.setItem(ANALYTICS_KEY, JSON.stringify(state));
  } catch (error) {
    logger.error('[GrowthAnalytics] Failed to persist state:', error);
  }
}

export async function trackGrowthEvent(
  name: GrowthEventName,
  metadata?: Record<string, PrimitiveValue>,
): Promise<void> {
  const state = await readState();
  const now = new Date().toISOString();
  const safeMetadata = normalizeMetadata(metadata);

  for (const key of buildCountKeys(name, safeMetadata)) {
    state.counts[key] = (state.counts[key] ?? 0) + 1;
    state.lastSeenAt[key] = now;
    if (!state.firstSeenAt[key]) {
      state.firstSeenAt[key] = now;
    }
  }

  state.recentEvents.push({ name, at: now, metadata: safeMetadata });
  if (state.recentEvents.length > MAX_RECENT_EVENTS) {
    state.recentEvents = state.recentEvents.slice(-MAX_RECENT_EVENTS);
  }

  await writeState(state);
}

export async function getGrowthExperimentVariant(
  experiment: string,
  variants: readonly string[],
): Promise<string> {
  const safeVariants = variants.filter(Boolean);
  if (safeVariants.length === 0) {
    throw new Error('Experiment variants must not be empty.');
  }

  const state = await readState();
  const existing = state.experiments[experiment];
  if (existing && safeVariants.includes(existing)) {
    return existing;
  }

  const assigned = safeVariants[Math.floor(Math.random() * safeVariants.length)];
  state.experiments[experiment] = assigned;
  await writeState(state);
  return assigned;
}

export async function getGrowthAnalyticsSnapshot(): Promise<GrowthAnalyticsState> {
  return readState();
}