/**
 * supabaseDb.ts — Supabase-first data layer
 *
 * Supabase is the source of truth. Device storage is allowed only as a cache
 * for specific local UX concerns, not as the authoritative database.
 *
 * Security model:
 * - Supabase RLS enforces row-level ownership (auth.uid() = user_id).
 * - Application data is stored server-side in plaintext columns.
 * - TLS protects data in transit.
 *
 */

import { supabase } from '../../lib/supabase';
import {
  SavedChart,
  JournalEntry,
  AppSettings,
  RelationshipChart,
  SleepEntry,
} from './models';
import { IdentityVault } from '../../utils/IdentityVault';
import { logger } from '../../utils/logger';
import type { HouseSystem } from '../astrology/types';
import type { SavedInsight } from './insightHistory';
import type { DailyCheckIn } from '../patterns/types';
import { AccountScopedAsyncStorage } from './accountScopedStorage';
import {
  type BirthProfileSync,
  invokeBirthProfileSync,
  isBirthProfileSyncUnavailableError,
  warnBirthProfileSyncUnavailable,
} from './syncService';

// ─── Helpers ─────────────────────────────────────────────────────────────────

type Row = Record<string, unknown>;

const SETTINGS_KEY = '@mysky:app_settings';

async function getUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;

  const uid = data.session?.user?.id;
  if (!uid) throw new Error('Not authenticated');
  return uid;
}

function asOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

function asRequiredString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function safeJsonParse<T>(value: unknown, fallback: T): T {
  if (typeof value !== 'string' || !value.trim()) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function parseJsonValue<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value === 'string') return safeJsonParse<T>(value, fallback);
  if (typeof value === 'object') return value as T;
  return fallback;
}

function coerceNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function parseCoord(value: string | undefined, field: string, id: string): number | undefined {
  if (value == null) {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const n = Number.parseFloat(trimmed);
  if (!Number.isFinite(n)) {
    logger.error(`[SupabaseDb] ${field} for ${id} is invalid: ${trimmed}`);
    return undefined;
  }

  return n;
}

function isValidChart(
  chart: Pick<SavedChart, 'id' | 'birthDate' | 'birthPlace' | 'latitude' | 'longitude'>,
): boolean {
  if (!chart.birthDate || !chart.birthPlace?.trim()) {
    logger.error(`[SupabaseDb] Dropping invalid chart ${chart.id}: missing birth data`);
    return false;
  }

  // Coordinates are helpful, but should not cause the entire chart to be discarded.
  return true;
}

function chartFromBirthProfile(profile: BirthProfileSync): SavedChart {
  return {
    id: profile.chartId,
    name: profile.name ?? undefined,
    birthDate: profile.birthDate,
    birthTime: profile.birthTime ?? undefined,
    hasUnknownTime: Boolean(profile.hasUnknownTime),
    birthPlace: profile.birthPlace,
    latitude: profile.latitude,
    longitude: profile.longitude,
    timezone: profile.timezone ?? undefined,
    houseSystem: profile.houseSystem as HouseSystem | undefined,
    createdAt: profile.createdAt ?? new Date().toISOString(),
    updatedAt: profile.updatedAt,
    isDeleted: false,
    deletedAt: undefined,
  };
}

async function sealIdentityFromChart(chart: SavedChart): Promise<void> {
  await IdentityVault.sealIdentity({
    name: chart.name ?? 'My Chart',
    birthDate: chart.birthDate,
    birthTime: chart.birthTime,
    hasUnknownTime: chart.hasUnknownTime,
    locationCity: chart.birthPlace,
    locationLat: chart.latitude,
    locationLng: chart.longitude,
    timezone: chart.timezone,
  });
}

async function replaceCachedBirthCharts(charts: SavedChart[], deletedAt?: string): Promise<void> {
  try {
    const { localDb } = await import('./localDb');
    const existingCharts = await localDb.getCharts().catch(() => [] as SavedChart[]);
    const nextIds = new Set(charts.map((chart) => chart.id));
    const cacheDeletedAt = deletedAt ?? new Date().toISOString();

    const results = await Promise.allSettled([
      ...existingCharts
        .filter((chart) => !nextIds.has(chart.id))
        .map((chart) => localDb.deleteChartFromSync(chart.id, cacheDeletedAt)),
      ...charts.map((chart) => localDb.upsertChartFromSync(chart)),
    ]);

    const rejected = results.find((result) => result.status === 'rejected');
    if (rejected?.status === 'rejected') throw rejected.reason;
  } catch (error) {
    logger.warn('[SupabaseDb] Failed to refresh local birth chart cache:', error);
  }
}

function isRemoteUnavailableError(error: unknown): boolean {
  return isBirthProfileSyncUnavailableError(error);
}

async function getLocalCache() {
  const { localDb } = await import('./localDb');
  return localDb;
}

async function refreshLocalCache(label: string, operation: () => Promise<void>): Promise<void> {
  try {
    await operation();
  } catch (error) {
    logger.warn(`[SupabaseDb] Failed to refresh ${label} cache:`, error);
  }
}

async function useLocalCacheFallback<T>(
  label: string,
  error: unknown,
  operation: () => Promise<T>,
): Promise<T> {
  if (!isRemoteUnavailableError(error)) throw error;
  logger.warn(`[SupabaseDb] Remote ${label} unavailable; using local cache fallback.`, error);
  return operation();
}

async function markLocalRowDeleted(
  table: string,
  id: string,
  updatedAt: string,
  deletedAt?: string,
): Promise<void> {
  const localDb = await getLocalCache();
  const db = await localDb.getDb();
  const deletedAtClause = deletedAt ? ', deleted_at = ?' : '';
  const params = deletedAt ? [updatedAt, deletedAt, id] : [updatedAt, id];

  await db.runAsync(
    `UPDATE ${table} SET is_deleted = 1, updated_at = ?${deletedAtClause} WHERE id = ?`,
    params,
  );
}

function mapSettingsRow(row: Row): AppSettings {
  return {
    id: asRequiredString(row.id, 'default'),
    cloudSyncEnabled: Boolean(row.cloud_sync_enabled),
    lastSyncAt: asOptionalString(row.last_sync_at),
    lastBackupAt: asOptionalString(row.last_backup_at),
    userId: asOptionalString(row.user_id),
    createdAt: asRequiredString(row.created_at),
    updatedAt: asRequiredString(row.updated_at),
  };
}

function settingsToRow(settings: AppSettings, userId: string): Row {
  return {
    user_id: userId,
    id: settings.id,
    cloud_sync_enabled: settings.cloudSyncEnabled,
    last_sync_at: settings.lastSyncAt ?? null,
    last_backup_at: settings.lastBackupAt ?? null,
    created_at: settings.createdAt,
    updated_at: settings.updatedAt,
  };
}

async function readCachedSettings(): Promise<AppSettings | null> {
  try {
    const raw = await AccountScopedAsyncStorage.getItem(SETTINGS_KEY);
    return raw ? (JSON.parse(raw) as AppSettings) : null;
  } catch {
    return null;
  }
}

async function writeCachedSettings(settings: AppSettings): Promise<void> {
  await AccountScopedAsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// ─── Charts ──────────────────────────────────────────────────────────────────

export async function getCharts(): Promise<SavedChart[]> {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) return [];

  let data: { profile?: unknown } | null = null;

  try {
    data = await invokeBirthProfileSync('getLatest', {}, { swallowUnavailableReadError: false });
  } catch (error) {
    if (!isBirthProfileSyncUnavailableError(error)) throw error;
    warnBirthProfileSyncUnavailable(error);
    const { localDb } = await import('./localDb');
    return localDb.getCharts();
  }

  const profile = data?.profile as BirthProfileSync | null;

  if (!profile || profile.isDeleted) {
    await replaceCachedBirthCharts([], profile?.updatedAt);
    return [];
  }

  const chart = chartFromBirthProfile(profile);

  if (!isValidChart(chart)) return [];
  await replaceCachedBirthCharts([chart]);
  return [chart];
}

export async function saveChart(chart: SavedChart): Promise<void> {
  let persistedChart = chart;

  try {
    const { profile } = await invokeBirthProfileSync('upsert', {
      profile: {
        chartId: chart.id,
        name: chart.name ?? null,
        birthDate: chart.birthDate,
        birthTime: chart.birthTime ?? null,
        hasUnknownTime: chart.hasUnknownTime,
        birthPlace: chart.birthPlace,
        latitude: chart.latitude,
        longitude: chart.longitude,
        timezone: chart.timezone ?? null,
        houseSystem: chart.houseSystem ?? null,
        createdAt: chart.createdAt,
        updatedAt: chart.updatedAt,
        isDeleted: chart.isDeleted,
        deletedAt: chart.deletedAt ?? null,
      },
    });

    if (profile) {
      if (profile.isDeleted) {
        await replaceCachedBirthCharts([], profile.updatedAt);
        await IdentityVault.destroyIdentity().catch(() => {});
        return;
      }

      persistedChart = chartFromBirthProfile(profile);
    }
  } catch (error) {
    if (!isBirthProfileSyncUnavailableError(error)) throw error;
    logger.warn(
      '[SupabaseDb] Birth profile sync unavailable during save; writing chart locally and queueing retry.',
      error,
    );
    const { localDb } = await import('./localDb');
    await localDb.saveChart(chart);
    return;
  }

  if (!isValidChart(persistedChart)) return;
  await replaceCachedBirthCharts([persistedChart]);
  await sealIdentityFromChart(persistedChart);
}

export async function upsertChart(chart: SavedChart): Promise<void> {
  return saveChart(chart);
}

export async function deleteChart(id: string): Promise<void> {
  const now = new Date().toISOString();

  let profile: BirthProfileSync | null = null;

  try {
    const response = await invokeBirthProfileSync('delete', {
      chartId: id,
      updatedAt: now,
      deletedAt: now,
    });
    profile = response.profile;
  } catch (error) {
    if (!isBirthProfileSyncUnavailableError(error)) throw error;
    logger.warn(
      '[SupabaseDb] Birth profile sync unavailable during delete; deleting local chart and queueing retry.',
      error,
    );
    const { localDb } = await import('./localDb');
    await localDb.deleteChart(id);
    return;
  }

  if (profile && !profile.isDeleted) {
    const chart = chartFromBirthProfile(profile);
    if (isValidChart(chart)) {
      await replaceCachedBirthCharts([chart]);
      await sealIdentityFromChart(chart);
    }
    return;
  }

  await replaceCachedBirthCharts([], profile?.updatedAt ?? now);
  await IdentityVault.destroyIdentity().catch(() => {});
}

export async function updateAllChartsHouseSystem(houseSystem: HouseSystem): Promise<void> {
  const charts = await getCharts();
  await Promise.all(
    charts.map((c) =>
      saveChart({
        ...c,
        houseSystem,
        updatedAt: new Date().toISOString(),
      }),
    ),
  );
}

// ─── Journal Entries ──────────────────────────────────────────────────────────

async function mapJournalRow(row: Row): Promise<JournalEntry> {
  return {
    id: asRequiredString(row.id),
    date: asRequiredString(row.date),
    mood: row.mood as JournalEntry['mood'],
    moonPhase: row.moon_phase as JournalEntry['moonPhase'],
    title: asOptionalString(row.title),
    content: asRequiredString(row.content),
    chartId: asOptionalString(row.chart_id),
    transitSnapshot: asOptionalString(row.transit_snapshot),
    contentKeywords: asOptionalString(row.content_keywords),
    contentEmotions: asOptionalString(row.content_emotions),
    contentSentiment: asOptionalString(row.content_sentiment),
    contentWordCount:
      typeof row.content_word_count === 'number' ? row.content_word_count : undefined,
    contentReadingMinutes:
      typeof row.content_reading_minutes === 'number'
        ? row.content_reading_minutes
        : undefined,
    tags: parseJsonValue<string[] | undefined>(row.tags, undefined),
    createdAt: asRequiredString(row.created_at),
    updatedAt: asRequiredString(row.updated_at),
    isDeleted: Boolean(row.is_deleted),
    deletedAt: asOptionalString(row.deleted_at),
  };
}

export async function getJournalEntries(): Promise<JournalEntry[]> {
  try {
    const userId = await getUserId();

    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!data?.length) return [];

    const entries = await Promise.all((data as Row[]).map(mapJournalRow));
    await refreshLocalCache('journal entries', async () => {
      const localDb = await getLocalCache();
      await Promise.all(entries.map((entry) => localDb.upsertJournalEntryRaw(entry)));
    });
    return entries;
  } catch (error) {
    return useLocalCacheFallback('journal entries', error, async () => {
      const localDb = await getLocalCache();
      return localDb.getJournalEntries();
    });
  }
}

export async function getJournalEntriesPaginated(
  pageSize: number,
  afterDate?: string,
  afterCreatedAt?: string,
): Promise<JournalEntry[]> {
  try {
    const userId = await getUserId();

    let query = supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(pageSize);

    if (afterDate && afterCreatedAt) {
      query = query.or(
        `date.lt.${afterDate},and(date.eq.${afterDate},created_at.lt.${afterCreatedAt})`,
      );
    }

    const { data, error } = await query;
    if (error) throw error;
    if (!data?.length) return [];

    const entries = await Promise.all((data as Row[]).map(mapJournalRow));
    await refreshLocalCache('journal entries', async () => {
      const localDb = await getLocalCache();
      await Promise.all(entries.map((entry) => localDb.upsertJournalEntryRaw(entry)));
    });
    return entries;
  } catch (error) {
    return useLocalCacheFallback('journal entries page', error, async () => {
      const localDb = await getLocalCache();
      return localDb.getJournalEntriesPaginated(pageSize, afterDate, afterCreatedAt);
    });
  }
}

export async function getJournalEntryCount(): Promise<number> {
  try {
    const userId = await getUserId();

    const { count, error } = await supabase
      .from('journal_entries')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_deleted', false);

    if (error) throw error;
    return count ?? 0;
  } catch (error) {
    return useLocalCacheFallback('journal entry count', error, async () => {
      const localDb = await getLocalCache();
      return localDb.getJournalEntryCount();
    });
  }
}

export async function saveJournalEntry(entry: JournalEntry): Promise<void> {
  try {
    const userId = await getUserId();

    const { error } = await supabase.from('journal_entries').upsert(
      {
        id: entry.id,
        user_id: userId,
        date: entry.date,
        mood: entry.mood,
        moon_phase: entry.moonPhase,
        title: entry.title ?? null,
        content: entry.content,
        content_keywords: entry.contentKeywords ?? null,
        content_emotions: entry.contentEmotions ?? null,
        content_sentiment: entry.contentSentiment ?? null,
        tags: entry.tags ? JSON.stringify(entry.tags) : null,
        content_word_count: entry.contentWordCount ?? null,
        content_reading_minutes: entry.contentReadingMinutes ?? null,
        chart_id: entry.chartId ?? null,
        transit_snapshot: entry.transitSnapshot ?? null,
        is_deleted: entry.isDeleted,
        deleted_at: entry.deletedAt ?? null,
        created_at: entry.createdAt,
        updated_at: entry.updatedAt,
      },
      { onConflict: 'id' },
    );

    if (error) throw error;

    await refreshLocalCache('journal entries', async () => {
      const localDb = await getLocalCache();
      await localDb.upsertJournalEntryRaw(entry);
    });
  } catch (error) {
    if (!isRemoteUnavailableError(error)) throw error;
    logger.warn('[SupabaseDb] Remote journal save unavailable; writing local cache and queueing retry.', error);
    const localDb = await getLocalCache();
    await localDb.saveJournalEntry(entry);
  }
}

export async function addJournalEntry(entry: JournalEntry): Promise<void> {
  return saveJournalEntry(entry);
}

export async function updateJournalEntry(entry: JournalEntry): Promise<void> {
  return saveJournalEntry(entry);
}

export async function deleteJournalEntry(id: string): Promise<void> {
  const now = new Date().toISOString();
  try {
    const userId = await getUserId();

    const { error } = await supabase
      .from('journal_entries')
      .update({ is_deleted: true, deleted_at: now, updated_at: now })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;

    await refreshLocalCache('journal entries', () =>
      markLocalRowDeleted('journal_entries', id, now, now),
    );
  } catch (error) {
    if (!isRemoteUnavailableError(error)) throw error;
    logger.warn('[SupabaseDb] Remote journal delete unavailable; deleting local cache and queueing retry.', error);
    const localDb = await getLocalCache();
    await localDb.deleteJournalEntry(id);
  }
}

// ─── Settings ────────────────────────────────────────────────────────────────

export async function getSettings(): Promise<AppSettings | null> {
  try {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;

    if (data) {
      const settings = mapSettingsRow(data as Row);
      await refreshLocalCache('app settings', () => writeCachedSettings(settings));
      return settings;
    }

    const cached = await readCachedSettings();
    if (cached) {
      await updateSettings({ ...cached, userId });
      return { ...cached, userId };
    }

    return null;
  } catch (error) {
    return useLocalCacheFallback('app settings', error, readCachedSettings);
  }
}

export async function updateSettings(settings: AppSettings): Promise<void> {
  try {
    const userId = await getUserId();
    const persisted = { ...settings, userId };
    const { error } = await supabase
      .from('app_settings')
      .upsert(settingsToRow(persisted, userId), { onConflict: 'user_id' });

    if (error) throw error;

    await refreshLocalCache('app settings', () => writeCachedSettings(persisted));
  } catch (error) {
    if (!isRemoteUnavailableError(error)) throw error;
    logger.warn('[SupabaseDb] Remote app settings save unavailable; keeping existing cache unchanged.', error);
  }
}

export const saveSettings = updateSettings;

// ─── Sleep Entries ────────────────────────────────────────────────────────────

async function mapSleepRow(row: Row): Promise<SleepEntry> {
  return {
    id: asRequiredString(row.id),
    chartId: asRequiredString(row.chart_id),
    date: asRequiredString(row.date),
    durationHours:
      typeof row.duration_hours === 'number' ? row.duration_hours : undefined,
    quality: typeof row.quality === 'number' ? row.quality : undefined,
    dreamText: asOptionalString(row.dream_text),
    dreamMood: asOptionalString(row.dream_mood),
    dreamFeelings: asOptionalString(row.dream_feelings),
    dreamMetadata: asOptionalString(row.dream_metadata),
    notes: asOptionalString(row.notes),
    isDeleted: Boolean(row.is_deleted),
    createdAt: asRequiredString(row.created_at),
    updatedAt: asRequiredString(row.updated_at),
  };
}

export async function getSleepEntries(
  chartId: string,
  limit = 30,
): Promise<SleepEntry[]> {
  try {
    const userId = await getUserId();

    const { data, error } = await supabase
      .from('sleep_entries')
      .select('*')
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .order('date', { ascending: false })
      .limit(limit);

    if (error) throw error;
    if (!data?.length) return [];

    const entries = await Promise.all((data as Row[]).map(mapSleepRow));
    await refreshLocalCache('sleep entries', async () => {
      const localDb = await getLocalCache();
      await Promise.all(entries.map((entry) => localDb.upsertSleepEntryRaw(entry)));
    });
    return entries;
  } catch (error) {
    return useLocalCacheFallback('sleep entries', error, async () => {
      const localDb = await getLocalCache();
      return localDb.getSleepEntries(chartId, limit);
    });
  }
}

export async function getSleepEntriesInRange(
  chartId: string,
  startDate: string,
  endDate: string,
): Promise<SleepEntry[]> {
  try {
    const userId = await getUserId();

    const { data, error } = await supabase
      .from('sleep_entries')
      .select('*')
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    if (error) throw error;
    if (!data?.length) return [];

    const entries = await Promise.all((data as Row[]).map(mapSleepRow));
    await refreshLocalCache('sleep entries', async () => {
      const localDb = await getLocalCache();
      await Promise.all(entries.map((entry) => localDb.upsertSleepEntryRaw(entry)));
    });
    return entries;
  } catch (error) {
    return useLocalCacheFallback('sleep entries', error, async () => {
      const localDb = await getLocalCache();
      const cached = await localDb.getSleepEntries(chartId, 10000);
      return cached.filter((entry) => entry.date >= startDate && entry.date <= endDate);
    });
  }
}

export async function getSleepEntryByDate(
  chartId: string,
  date: string,
): Promise<SleepEntry | null> {
  try {
    const userId = await getUserId();

    const { data, error } = await supabase
      .from('sleep_entries')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .eq('is_deleted', false)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    const entry = await mapSleepRow(data as Row);
    await refreshLocalCache('sleep entries', async () => {
      const localDb = await getLocalCache();
      await localDb.upsertSleepEntryRaw(entry);
    });
    return entry;
  } catch (error) {
    return useLocalCacheFallback('sleep entry', error, async () => {
      const localDb = await getLocalCache();
      return localDb.getSleepEntryByDate(chartId, date);
    });
  }
}

export async function saveSleepEntry(entry: SleepEntry): Promise<void> {
  try {
    const userId = await getUserId();

    const { error } = await supabase.from('sleep_entries').upsert(
      {
        id: entry.id,
        user_id: userId,
        chart_id: entry.chartId,
        date: entry.date,
        duration_hours: entry.durationHours ?? null,
        quality: entry.quality ?? null,
        dream_text: entry.dreamText ?? null,
        dream_mood: entry.dreamMood ?? null,
        dream_feelings: entry.dreamFeelings ?? null,
        dream_metadata: entry.dreamMetadata ?? null,
        notes: entry.notes ?? null,
        is_deleted: entry.isDeleted ?? false,
        created_at: entry.createdAt,
        updated_at: entry.updatedAt,
      },
      { onConflict: 'id' },
    );

    if (error) throw error;

    await refreshLocalCache('sleep entries', async () => {
      const localDb = await getLocalCache();
      await localDb.upsertSleepEntryRaw(entry);
    });
  } catch (error) {
    if (!isRemoteUnavailableError(error)) throw error;
    logger.warn('[SupabaseDb] Remote sleep save unavailable; writing local cache and queueing retry.', error);
    const localDb = await getLocalCache();
    await localDb.saveSleepEntry(entry);
  }
}

export async function deleteSleepEntry(id: string): Promise<void> {
  const now = new Date().toISOString();
  try {
    const userId = await getUserId();

    const { error } = await supabase
      .from('sleep_entries')
      .update({ is_deleted: true, updated_at: now })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;

    await refreshLocalCache('sleep entries', () =>
      markLocalRowDeleted('sleep_entries', id, now),
    );
  } catch (error) {
    if (!isRemoteUnavailableError(error)) throw error;
    logger.warn('[SupabaseDb] Remote sleep delete unavailable; deleting local cache and queueing retry.', error);
    const localDb = await getLocalCache();
    await localDb.deleteSleepEntry(id);
  }
}

// ─── Daily Check-Ins ──────────────────────────────────────────────────────────

async function mapCheckInRow(row: Row): Promise<DailyCheckIn> {
  const moodNum = coerceNumber(
    row.mood_score != null ? row.mood_score : row.mood_value,
    0,
  );
  const tags = row.tags != null
    ? (typeof row.tags === 'string' ? row.tags : JSON.stringify(row.tags))
    : undefined;

  return {
    id: asRequiredString(row.id),
    date: asRequiredString(row.log_date ?? row.date),
    chartId: asOptionalString(row.chart_id) ?? '',
    moodScore: moodNum,
    energyLevel: ((asOptionalString(row.energy_level) ?? 'medium') as DailyCheckIn['energyLevel']),
    stressLevel: ((asOptionalString(row.stress_level) ?? 'medium') as DailyCheckIn['stressLevel']),
    tags: safeJsonParse<string[]>(tags, []),
    note: asOptionalString(row.note),
    wins: asOptionalString(row.wins),
    challenges: asOptionalString(row.challenges),
    moonSign: asOptionalString(row.moon_sign) ?? 'unknown',
    moonHouse: typeof row.moon_house === 'number' ? row.moon_house : 0,
    sunHouse: typeof row.sun_house === 'number' ? row.sun_house : 0,
    transitEvents: parseJsonValue<DailyCheckIn['transitEvents']>(
      row.transit_events,
      [],
    ),
    lunarPhase:
      ((asOptionalString(row.lunar_phase) ?? 'unknown') as DailyCheckIn['lunarPhase']),
    retrogrades: parseJsonValue<string[]>(row.retrogrades, []),
    timeOfDay:
      ((asOptionalString(row.time_of_day) ?? 'morning') as DailyCheckIn['timeOfDay']),
    createdAt: asRequiredString(row.created_at),
    updatedAt: asRequiredString(row.updated_at),
  };
}

export async function getCheckIns(
  chartId: string,
  limit?: number,
): Promise<DailyCheckIn[]> {
  try {
    const userId = await getUserId();

    let query = supabase
      .from('daily_check_ins')
      .select('*')
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .order('log_date', { ascending: false });

    if (limit) query = query.limit(limit);

    const { data, error } = await query;
    if (error) throw error;
    if (!data?.length) return [];

    const checkIns = await Promise.all((data as Row[]).map(mapCheckInRow));
    await refreshLocalCache('daily check-ins', async () => {
      const localDb = await getLocalCache();
      await Promise.all(checkIns.map((checkIn) => localDb.upsertCheckInRaw(checkIn)));
    });
    return checkIns;
  } catch (error) {
    return useLocalCacheFallback('daily check-ins', error, async () => {
      const localDb = await getLocalCache();
      return localDb.getCheckIns(chartId, limit);
    });
  }
}

export async function getCheckInByDate(
  date: string,
  chartId: string,
): Promise<DailyCheckIn | null> {
  try {
    const userId = await getUserId();

    const { data, error } = await supabase
      .from('daily_check_ins')
      .select('*')
      .eq('user_id', userId)
      .eq('log_date', date)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    const checkIn = await mapCheckInRow(data as Row);
    await refreshLocalCache('daily check-ins', async () => {
      const localDb = await getLocalCache();
      await localDb.upsertCheckInRaw(checkIn);
    });
    return checkIn;
  } catch (error) {
    return useLocalCacheFallback('daily check-in', error, async () => {
      const localDb = await getLocalCache();
      return localDb.getCheckInByDate(date, chartId);
    });
  }
}

export async function getCheckInsByDate(
  date: string,
  chartId: string,
): Promise<DailyCheckIn[]> {
  try {
    const userId = await getUserId();

    const { data, error } = await supabase
      .from('daily_check_ins')
      .select('*')
      .eq('user_id', userId)
      .eq('log_date', date)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });

    if (error) throw error;
    if (!data?.length) return [];

    const checkIns = await Promise.all((data as Row[]).map(mapCheckInRow));
    await refreshLocalCache('daily check-ins', async () => {
      const localDb = await getLocalCache();
      await Promise.all(checkIns.map((checkIn) => localDb.upsertCheckInRaw(checkIn)));
    });
    return checkIns;
  } catch (error) {
    return useLocalCacheFallback('daily check-ins by date', error, async () => {
      const localDb = await getLocalCache();
      return localDb.getCheckInsByDate(date, chartId);
    });
  }
}

export async function getCheckInByDateAndTime(
  date: string,
  chartId: string,
  timeOfDay: string,
): Promise<DailyCheckIn | null> {
  try {
    const userId = await getUserId();

    const { data, error } = await supabase
      .from('daily_check_ins')
      .select('*')
      .eq('user_id', userId)
      .eq('log_date', date)
      .eq('time_of_day', timeOfDay)
      .eq('is_deleted', false)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    const checkIn = await mapCheckInRow(data as Row);
    await refreshLocalCache('daily check-ins', async () => {
      const localDb = await getLocalCache();
      await localDb.upsertCheckInRaw(checkIn);
    });
    return checkIn;
  } catch (error) {
    return useLocalCacheFallback('daily check-in slot', error, async () => {
      const localDb = await getLocalCache();
      return localDb.getCheckInByDateAndTime(date, chartId, timeOfDay);
    });
  }
}

export async function getCheckInsInRange(
  chartId: string,
  startDate: string,
  endDate: string,
): Promise<DailyCheckIn[]> {
  try {
    const userId = await getUserId();

    const { data, error } = await supabase
      .from('daily_check_ins')
      .select('*')
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .gte('log_date', startDate)
      .lte('log_date', endDate)
      .order('log_date', { ascending: false });

    if (error) throw error;
    if (!data?.length) return [];

    const checkIns = await Promise.all((data as Row[]).map(mapCheckInRow));
    await refreshLocalCache('daily check-ins', async () => {
      const localDb = await getLocalCache();
      await Promise.all(checkIns.map((checkIn) => localDb.upsertCheckInRaw(checkIn)));
    });
    return checkIns;
  } catch (error) {
    return useLocalCacheFallback('daily check-ins range', error, async () => {
      const localDb = await getLocalCache();
      return localDb.getCheckInsInRange(chartId, startDate, endDate);
    });
  }
}

export async function getCheckInCount(chartId: string): Promise<number> {
  try {
    const userId = await getUserId();

    const { count, error } = await supabase
      .from('daily_check_ins')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_deleted', false);

    if (error) throw error;
    return count ?? 0;
  } catch (error) {
    return useLocalCacheFallback('daily check-in count', error, async () => {
      const localDb = await getLocalCache();
      return localDb.getCheckInCount(chartId);
    });
  }
}

export async function getTotalCheckInCount(): Promise<number> {
  try {
    const userId = await getUserId();

    const { count, error } = await supabase
      .from('daily_check_ins')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) throw error;
    return count ?? 0;
  } catch (error) {
    return useLocalCacheFallback('total daily check-in count', error, async () => {
      const localDb = await getLocalCache();
      return localDb.getCheckInCount('');
    });
  }
}

export async function saveCheckIn(checkIn: DailyCheckIn): Promise<void> {
  try {
    const userId = await getUserId();

    const moodNum = Math.max(0, Math.min(10, Math.round(checkIn.moodScore)));

    const { error } = await supabase.from('daily_check_ins').upsert(
      {
        id: checkIn.id,
        user_id: userId,
        log_date: checkIn.date,
        chart_id: checkIn.chartId,
        mood_value: moodNum,
        mood_score: moodNum,
        energy_level: checkIn.energyLevel,
        stress_level: checkIn.stressLevel,
        tags: checkIn.tags ?? [],
        note: checkIn.note ?? null,
        wins: checkIn.wins ?? null,
        challenges: checkIn.challenges ?? null,
        moon_sign: checkIn.moonSign ?? null,
        moon_house: checkIn.moonHouse ?? null,
        sun_house: checkIn.sunHouse ?? null,
        transit_events: checkIn.transitEvents ?? null,
        lunar_phase: checkIn.lunarPhase ?? null,
        retrogrades: checkIn.retrogrades ?? null,
        time_of_day: checkIn.timeOfDay ?? null,
        created_at: checkIn.createdAt,
        updated_at: checkIn.updatedAt,
      },
      { onConflict: 'user_id,log_date,time_of_day' },
    );

    if (error) throw error;

    await refreshLocalCache('daily check-ins', async () => {
      const localDb = await getLocalCache();
      await localDb.upsertCheckInRaw({ ...checkIn, moodScore: moodNum });
    });
  } catch (error) {
    if (!isRemoteUnavailableError(error)) throw error;
    logger.warn('[SupabaseDb] Remote check-in save unavailable; writing local cache and queueing retry.', error);
    const localDb = await getLocalCache();
    await localDb.saveCheckIn(checkIn);
  }
}

// ─── Insight History ──────────────────────────────────────────────────────────

async function mapInsightRow(row: Row): Promise<SavedInsight> {
  const clean = (v?: string) => v ?? '';
  const signals = row.signals != null
    ? (typeof row.signals === 'string' ? row.signals : JSON.stringify(row.signals))
    : undefined;

  return {
    id: asRequiredString(row.id),
    date: asRequiredString(row.date),
    chartId: asRequiredString(row.chart_id),
    greeting: clean(asOptionalString(row.greeting)),
    loveHeadline: clean(asOptionalString(row.love_headline)),
    loveMessage: clean(asOptionalString(row.love_message)),
    energyHeadline: clean(asOptionalString(row.energy_headline)),
    energyMessage: clean(asOptionalString(row.energy_message)),
    growthHeadline: clean(asOptionalString(row.growth_headline)),
    growthMessage: clean(asOptionalString(row.growth_message)),
    gentleReminder: clean(asOptionalString(row.gentle_reminder)),
    journalPrompt: clean(asOptionalString(row.journal_prompt)),
    moonSign: asOptionalString(row.moon_sign),
    moonPhase: asOptionalString(row.moon_phase),
    signals,
    isFavorite: Boolean(row.is_favorite),
    viewedAt: asOptionalString(row.viewed_at),
    createdAt: asRequiredString(row.created_at),
    updatedAt: asRequiredString(row.updated_at),
  };
}

export async function saveInsight(insight: SavedInsight): Promise<void> {
  const userId = await getUserId();

  const { error } = await supabase.from('insight_history').upsert(
    {
      id: insight.id,
      user_id: userId,
      date: insight.date,
      chart_id: insight.chartId,
      greeting: insight.greeting,
      love_headline: insight.loveHeadline,
      love_message: insight.loveMessage,
      energy_headline: insight.energyHeadline,
      energy_message: insight.energyMessage,
      growth_headline: insight.growthHeadline,
      growth_message: insight.growthMessage,
      gentle_reminder: insight.gentleReminder,
      journal_prompt: insight.journalPrompt,
      moon_sign: insight.moonSign ?? null,
      moon_phase: insight.moonPhase ?? null,
      signals: insight.signals ? safeJsonParse<unknown>(insight.signals, insight.signals) : null,
      is_favorite: insight.isFavorite,
      viewed_at: insight.viewedAt ?? null,
      is_deleted: false,
      created_at: insight.createdAt,
      updated_at: insight.updatedAt,
    },
    { onConflict: 'user_id,date,chart_id' },
  );

  if (error) throw error;

  await refreshLocalCache('insight history', async () => {
    const localDb = await getLocalCache();
    await localDb.saveInsight(insight);
  });
}

export async function getInsightByDate(
  date: string,
  chartId: string,
): Promise<SavedInsight | null> {
  try {
    const userId = await getUserId();

    const { data, error } = await supabase
      .from('insight_history')
      .select('*')
      .eq('user_id', userId)
      .eq('chart_id', chartId)
      .eq('date', date)
      .eq('is_deleted', false)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    const insight = await mapInsightRow(data as Row);
    await refreshLocalCache('insight history', async () => {
      const localDb = await getLocalCache();
      await localDb.saveInsight(insight);
    });
    return insight;
  } catch (error) {
    return useLocalCacheFallback('insight history', error, async () => {
      const localDb = await getLocalCache();
      return localDb.getInsightByDate(date, chartId);
    });
  }
}

export async function getInsightById(id: string): Promise<SavedInsight | null> {
  try {
    const userId = await getUserId();

    const { data, error } = await supabase
      .from('insight_history')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    const insight = await mapInsightRow(data as Row);
    await refreshLocalCache('insight history', async () => {
      const localDb = await getLocalCache();
      await localDb.saveInsight(insight);
    });
    return insight;
  } catch (error) {
    return useLocalCacheFallback('insight history', error, async () => {
      const localDb = await getLocalCache();
      return localDb.getInsightById(id);
    });
  }
}

export async function getInsightHistory(
  chartId: string,
  options?: { limit?: number; favoritesOnly?: boolean },
): Promise<SavedInsight[]> {
  try {
    const userId = await getUserId();

    let query = supabase
      .from('insight_history')
      .select('*')
      .eq('user_id', userId)
      .eq('chart_id', chartId)
      .eq('is_deleted', false)
      .order('date', { ascending: false });

    if (options?.favoritesOnly) query = query.eq('is_favorite', true);
    if (options?.limit) query = query.limit(options.limit);

    const { data, error } = await query;
    if (error) throw error;
    if (!data?.length) return [];

    const insights = await Promise.all((data as Row[]).map(mapInsightRow));
    await refreshLocalCache('insight history', async () => {
      const localDb = await getLocalCache();
      await Promise.all(insights.map((insight) => localDb.saveInsight(insight)));
    });
    return insights;
  } catch (error) {
    return useLocalCacheFallback('insight history', error, async () => {
      const localDb = await getLocalCache();
      return localDb.getInsightHistory(chartId, options);
    });
  }
}

export async function updateInsightFavorite(
  id: string,
  isFavorite: boolean,
): Promise<void> {
  const userId = await getUserId();
  const now = new Date().toISOString();

  const { error } = await supabase
    .from('insight_history')
    .update({ is_favorite: isFavorite, updated_at: now })
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;

  await refreshLocalCache('insight history', async () => {
    const localDb = await getLocalCache();
    await localDb.updateInsightFavorite(id, isFavorite);
  });
}

export async function updateInsightViewedAt(
  id: string,
  viewedAt: string,
): Promise<void> {
  const userId = await getUserId();
  const now = new Date().toISOString();

  const { error } = await supabase
    .from('insight_history')
    .update({ viewed_at: viewedAt, updated_at: now })
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;

  await refreshLocalCache('insight history', async () => {
    const localDb = await getLocalCache();
    await localDb.updateInsightViewedAt(id, viewedAt);
  });
}

// ─── Relationship Charts ──────────────────────────────────────────────────────

async function mapRelationshipRow(row: Row): Promise<RelationshipChart> {
  const rowId = asRequiredString(row.id);
  const name = asOptionalString(row.name);
  const birthDate = asOptionalString(row.birth_date);
  const birthTime = asOptionalString(row.birth_time);
  const birthPlace = asOptionalString(row.birth_place);
  const latStr = row.latitude != null ? String(row.latitude) : undefined;
  const lngStr = row.longitude != null ? String(row.longitude) : undefined;

  if (!name || !birthDate || !birthPlace) {
    logger.error(`[SupabaseDb] relationship row ${rowId} is missing required plaintext fields`);
  }

  return {
    id: rowId,
    name: name ?? '',
    relationship: row.relationship as RelationshipChart['relationship'],
    birthDate: birthDate ?? '',
    birthTime,
    hasUnknownTime: Boolean(row.has_unknown_time),
    birthPlace: birthPlace ?? '',
    latitude: parseCoord(latStr, 'latitude', rowId) ?? 0,
    longitude: parseCoord(lngStr, 'longitude', rowId) ?? 0,
    timezone: asOptionalString(row.timezone),
    userChartId: asRequiredString(row.user_chart_id),
    createdAt: asRequiredString(row.created_at),
    updatedAt: asRequiredString(row.updated_at),
    isDeleted: Boolean(row.is_deleted),
    deletedAt: asOptionalString(row.deleted_at),
  };
}

export async function getRelationshipCharts(
  userChartId?: string,
): Promise<RelationshipChart[]> {
  try {
    const userId = await getUserId();

    let query = supabase
      .from('relationship_charts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .order('updated_at', { ascending: false });

    if (userChartId) query = query.eq('user_chart_id', userChartId);

    const { data, error } = await query;
    if (error) throw error;
    if (!data?.length) return [];

    const charts = await Promise.all((data as Row[]).map(mapRelationshipRow));
    await refreshLocalCache('relationship charts', async () => {
      const localDb = await getLocalCache();
      await Promise.all(charts.map((chart) => localDb.saveRelationshipChart(chart)));
    });
    return charts;
  } catch (error) {
    return useLocalCacheFallback('relationship charts', error, async () => {
      const localDb = await getLocalCache();
      return localDb.getRelationshipCharts(userChartId);
    });
  }
}

export async function getRelationshipChartById(
  id: string,
): Promise<RelationshipChart | null> {
  try {
    const userId = await getUserId();

    const { data, error } = await supabase
      .from('relationship_charts')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    const chart = await mapRelationshipRow(data as Row);
    await refreshLocalCache('relationship charts', async () => {
      const localDb = await getLocalCache();
      await localDb.saveRelationshipChart(chart);
    });
    return chart;
  } catch (error) {
    return useLocalCacheFallback('relationship chart', error, async () => {
      const localDb = await getLocalCache();
      return localDb.getRelationshipChartById(id);
    });
  }
}

export async function saveRelationshipChart(
  chart: RelationshipChart,
): Promise<void> {
  const userId = await getUserId();

  const { error } = await supabase.from('relationship_charts').upsert(
    {
      id: chart.id,
      user_id: userId,
      name: chart.name,
      relationship: chart.relationship,
      birth_date: chart.birthDate,
      birth_time: chart.birthTime ?? null,
      has_unknown_time: chart.hasUnknownTime,
      birth_place: chart.birthPlace,
      latitude: chart.latitude,
      longitude: chart.longitude,
      timezone: chart.timezone ?? null,
      user_chart_id: chart.userChartId,
      is_deleted: chart.isDeleted ?? false,
      deleted_at: chart.deletedAt ?? null,
      created_at: chart.createdAt,
      updated_at: chart.updatedAt,
    },
    { onConflict: 'id' },
  );

  if (error) throw error;

  await refreshLocalCache('relationship charts', async () => {
    const localDb = await getLocalCache();
    await localDb.saveRelationshipChart(chart);
  });
}

export async function deleteRelationshipChart(id: string): Promise<void> {
  const userId = await getUserId();
  const now = new Date().toISOString();

  const { error } = await supabase
    .from('relationship_charts')
    .update({ is_deleted: true, deleted_at: now, updated_at: now })
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;

  await refreshLocalCache('relationship charts', async () => {
    const localDb = await getLocalCache();
    await localDb.deleteRelationshipChart(id);
  });
}

export async function getRelationshipChartCount(
  userChartId?: string,
): Promise<number> {
  try {
    const userId = await getUserId();

    let query = supabase
      .from('relationship_charts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_deleted', false);

    if (userChartId) query = query.eq('user_chart_id', userChartId);

    const { count, error } = await query;
    if (error) throw error;

    return count ?? 0;
  } catch (error) {
    return useLocalCacheFallback('relationship chart count', error, async () => {
      const localDb = await getLocalCache();
      return localDb.getRelationshipChartCount(userChartId);
    });
  }
}

// ─── Account cleanup ──────────────────────────────────────────────────────────

export async function clearAccountScopedData(): Promise<void> {
  try {
    await AccountScopedAsyncStorage.removeItem(SETTINGS_KEY);
  } catch {
    // ignore
  }
}

// ─── No-op stubs kept for call-site compatibility ─────────────────────────────

export async function initialize(): Promise<void> {}

export async function switchToUserDb(_userId: string): Promise<void> {}

export async function clearSyncQueue(): Promise<void> {}

/**
 * Hard deletes all user data from Supabase tables.
 * Used for account deletion / GDPR erasure flows.
 */
export async function hardDeleteAllData(): Promise<void> {
  const userId = await getUserId();

  await Promise.all([
    supabase.from('birth_profiles').delete().eq('user_id', userId),
    supabase.from('journal_entries').delete().eq('user_id', userId),
    supabase.from('daily_check_ins').delete().eq('user_id', userId),
    supabase.from('insight_history').delete().eq('user_id', userId),
    supabase.from('relationship_charts').delete().eq('user_id', userId),
    supabase.from('sleep_entries').delete().eq('user_id', userId),
    supabase.from('app_settings').delete().eq('user_id', userId),
  ]);

  await clearAccountScopedData();
}

// ─── Exported namespace ───────────────────────────────────────────────────────

export const supabaseDb = {
  // Compat stubs
  initialize,
  switchToUserDb,
  clearSyncQueue,
  clearAccountScopedData,
  hardDeleteAllData,

  // Charts
  getCharts,
  saveChart,
  upsertChart,
  deleteChart,
  updateAllChartsHouseSystem,

  // Journal
  getJournalEntries,
  getJournalEntriesPaginated,
  getJournalEntryCount,
  saveJournalEntry,
  addJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,

  // Settings
  getSettings,
  updateSettings,
  saveSettings,

  // Sleep
  getSleepEntries,
  getSleepEntriesInRange,
  getSleepEntryByDate,
  saveSleepEntry,
  deleteSleepEntry,

  // Check-ins
  getCheckIns,
  getCheckInByDate,
  getCheckInsByDate,
  getCheckInByDateAndTime,
  getCheckInsInRange,
  getCheckInCount,
  getTotalCheckInCount,
  saveCheckIn,

  // Insights
  saveInsight,
  getInsightByDate,
  getInsightById,
  getInsightHistory,
  updateInsightFavorite,
  updateInsightViewedAt,

  // Relationships
  getRelationshipCharts,
  getRelationshipChartById,
  saveRelationshipChart,
  deleteRelationshipChart,
  getRelationshipChartCount,
};
