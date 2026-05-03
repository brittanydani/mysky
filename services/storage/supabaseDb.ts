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
import { logger } from '../../utils/logger';
import { withRetry, RETRY_PRESETS } from '../../utils/withRetry';
import {
  CheckInSchema,
  JournalEntrySchema,
  ValidationError,
} from '../validation/schemas';
import { offlineQueue } from '../offline/offlineQueue';
import type { HouseSystem } from '../astrology/types';
import type { SavedInsight } from './insightHistory';
import type { DailyCheckIn } from '../patterns/types';
import {
  type BirthProfileSync,
  invokeBirthProfileSync,
  isBirthProfileSyncUnavailableError,
  warnBirthProfileSyncUnavailable,
} from './birthProfileService';

// ─── Helpers ─────────────────────────────────────────────────────────────────

type Row = Record<string, unknown>;

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

function isLikelyNetworkError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /network request failed|failed to fetch|fetch timeout|request timeout|load failed/i.test(message);
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

function isRemoteUnavailableError(error: unknown): boolean {
  return isBirthProfileSyncUnavailableError(error);
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

// ─── Charts ──────────────────────────────────────────────────────────────────

export async function getCharts(): Promise<SavedChart[]> {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) return [];

  const data = await invokeBirthProfileSync('getLatest', {});
  const profile = data?.profile as BirthProfileSync | null;

  if (!profile || profile.isDeleted) return [];

  const chart = chartFromBirthProfile(profile);
  return isValidChart(chart) ? [chart] : [];
}

export async function saveChart(chart: SavedChart): Promise<void> {
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

  if (profile?.isDeleted) return;

  if (profile) {
    const persistedChart = chartFromBirthProfile(profile);
    if (!isValidChart(persistedChart)) {
      logger.warn('[SupabaseDb] Birth profile upsert returned an invalid chart.');
    }
  }
}

export async function upsertChart(chart: SavedChart): Promise<void> {
  return saveChart(chart);
}

export async function deleteChart(id: string): Promise<void> {
  const now = new Date().toISOString();

  await invokeBirthProfileSync('delete', {
    chartId: id,
    updatedAt: now,
    deletedAt: now,
  });
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

function journalEntryToRow(entry: JournalEntry, userId: string): Row {
  return {
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
  };
}

export async function getJournalEntries(): Promise<JournalEntry[]> {
  const userId = await getUserId();

  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', userId)
    .eq('is_deleted', false)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    logger.warn('[SupabaseDb] Failed to load journal entries from Supabase.', error);
    return [];
  }

  if (!data?.length) return [];
  return Promise.all((data as Row[]).map(mapJournalRow));
}

export async function getJournalEntriesPaginated(
  pageSize: number,
  afterDate?: string,
  afterCreatedAt?: string,
): Promise<JournalEntry[]> {
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

  if (error) {
    logger.warn('[SupabaseDb] Failed to load paginated journal entries from Supabase.', error);
    return [];
  }

  if (!data?.length) return [];
  return Promise.all((data as Row[]).map(mapJournalRow));
}

export async function getJournalEntryCount(): Promise<number> {
  const userId = await getUserId();

  const { count, error } = await supabase
    .from('journal_entries')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_deleted', false);

  if (error) {
    logger.warn('[SupabaseDb] Failed to count journal entries from Supabase.', error);
    return 0;
  }

  return count ?? 0;
}

export async function saveJournalEntry(entry: JournalEntry): Promise<void> {
  const validation = JournalEntrySchema.validate(entry);
  if (!validation.valid) {
    throw new ValidationError('Invalid journal entry', validation.errors);
  }

  const userId = await getUserId();
  const row = journalEntryToRow(entry, userId);

  try {
    await withRetry(
      async () => {
        const { error } = await supabase
          .from('journal_entries')
          .upsert(row, { onConflict: 'id' });

        if (error) throw error;
      },
      'saveJournalEntry',
      RETRY_PRESETS.standard,
    );
  } catch (error) {
    if (isLikelyNetworkError(error)) {
      await offlineQueue.enqueue({
        type: 'journal_entry',
        payload: { userId, entry: row },
      });
      logger.warn('[SupabaseDb] Journal entry queued for offline sync', { id: entry.id });
      return;
    }

    logger.warn('[SupabaseDb] Failed to save journal entry to Supabase.', {
      id: entry.id,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export async function addJournalEntry(entry: JournalEntry): Promise<void> {
  return saveJournalEntry(entry);
}

export async function updateJournalEntry(entry: JournalEntry): Promise<void> {
  return saveJournalEntry(entry);
}

export async function deleteJournalEntry(id: string): Promise<void> {
  const userId = await getUserId();
  const now = new Date().toISOString();

  const { error } = await supabase
    .from('journal_entries')
    .update({ is_deleted: true, deleted_at: now, updated_at: now })
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    logger.warn('[SupabaseDb] Failed to delete journal entry from Supabase.', error);
    throw error;
  }
}

// ─── Settings ────────────────────────────────────────────────────────────────

export async function getSettings(): Promise<AppSettings | null> {
  const userId = await getUserId();

  const { data, error } = await supabase
    .from('app_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    logger.warn('[SupabaseDb] Failed to load app settings from Supabase.', error);
    return null;
  }

  return data ? mapSettingsRow(data as Row) : null;
}

export async function updateSettings(settings: AppSettings): Promise<void> {
  const userId = await getUserId();
  const now = new Date().toISOString();

  const persisted: AppSettings = {
    ...settings,
    id: settings.id || userId,
    userId,
    createdAt: settings.createdAt || now,
    updatedAt: now,
  };

  const { error } = await supabase
    .from('app_settings')
    .upsert(settingsToRow(persisted, userId), { onConflict: 'user_id' });

  if (error) {
    logger.warn('[SupabaseDb] Failed to save app settings to Supabase.', error);
    throw error;
  }
}

export const saveSettings = updateSettings;



// ─── Sleep Entries ───────────────────────────────────────────────────────────

async function mapSleepRow(row: Row): Promise<SleepEntry> {
  return {
    id: asRequiredString(row.id),
    chartId: asRequiredString(row.chart_id),
    date: asRequiredString(row.date),
    durationHours: typeof row.duration_hours === 'number'
      ? row.duration_hours
      : coerceNumber(row.hours_slept, undefined as unknown as number),
    quality: typeof row.quality === 'number' ? row.quality : undefined,
    dreamText: asOptionalString(row.dream_text) ?? asOptionalString(row.dream),
    dreamMood: asOptionalString(row.dream_mood),
    dreamFeelings: asOptionalString(row.dream_feelings),
    dreamMetadata: asOptionalString(row.dream_metadata),
    notes: asOptionalString(row.notes),
    createdAt: asRequiredString(row.created_at),
    updatedAt: asRequiredString(row.updated_at),
    isDeleted: Boolean(row.is_deleted),
  };
}

export async function getSleepEntries(
  chartId: string,
  limit = 10000,
): Promise<SleepEntry[]> {
  const userId = await getUserId();

  const { data, error } = await supabase
    .from('sleep_entries')
    .select('*')
    .eq('user_id', userId)
    .eq('chart_id', chartId)
    .eq('is_deleted', false)
    .order('date', { ascending: false })
    .limit(limit);

  if (error) {
    logger.warn('[SupabaseDb] Failed to load sleep entries from Supabase.', error);
    return [];
  }

  if (!data?.length) return [];
  return Promise.all((data as Row[]).map(mapSleepRow));
}

export async function getSleepEntriesInRange(
  chartId: string,
  startDate: string,
  endDate: string,
): Promise<SleepEntry[]> {
  const userId = await getUserId();

  const { data, error } = await supabase
    .from('sleep_entries')
    .select('*')
    .eq('user_id', userId)
    .eq('chart_id', chartId)
    .eq('is_deleted', false)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false });

  if (error) {
    logger.warn('[SupabaseDb] Failed to load sleep entries range from Supabase.', error);
    return [];
  }

  if (!data?.length) return [];
  return Promise.all((data as Row[]).map(mapSleepRow));
}

export async function getSleepEntryByDate(
  chartId: string,
  date: string,
): Promise<SleepEntry | null> {
  const userId = await getUserId();

  const { data, error } = await supabase
    .from('sleep_entries')
    .select('*')
    .eq('user_id', userId)
    .eq('chart_id', chartId)
    .eq('date', date)
    .eq('is_deleted', false)
    .maybeSingle();

  if (error) {
    logger.warn('[SupabaseDb] Failed to load sleep entry from Supabase.', error);
    return null;
  }

  return data ? mapSleepRow(data as Row) : null;
}

export async function saveSleepEntry(entry: SleepEntry): Promise<void> {
  const userId = await getUserId();

  const { error } = await supabase.from('sleep_entries').upsert(
    {
      id: entry.id,
      user_id: userId,
      chart_id: entry.chartId,
      date: entry.date,
      duration_hours: entry.durationHours ?? null,
      hours_slept: entry.durationHours ?? null,
      quality: entry.quality ?? null,
      dream: entry.dreamText ?? null,
      dream_text: entry.dreamText ?? null,
      dream_mood: entry.dreamMood ?? null,
      dream_feelings: entry.dreamFeelings ?? null,
      dream_metadata: entry.dreamMetadata ?? null,
      notes: entry.notes ?? null,
      is_deleted: entry.isDeleted,
      created_at: entry.createdAt,
      updated_at: entry.updatedAt,
    },
    { onConflict: 'id' },
  );

  if (error) {
    logger.warn('[SupabaseDb] Failed to save sleep entry to Supabase.', error);
    throw error;
  }
}

export async function deleteSleepEntry(id: string): Promise<void> {
  const userId = await getUserId();
  const now = new Date().toISOString();

  const { error } = await supabase
    .from('sleep_entries')
    .update({ is_deleted: true, updated_at: now })
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    logger.warn('[SupabaseDb] Failed to delete sleep entry from Supabase.', error);
    throw error;
  }
}

// ─── Daily Check-Ins ─────────────────────────────────────────────────────────

async function mapCheckInRow(row: Row): Promise<DailyCheckIn> {
  return {
    id: asRequiredString(row.id),
    date: asRequiredString(row.log_date),
    chartId: asRequiredString(row.chart_id),
    timeOfDay: asRequiredString(row.time_of_day, 'morning') as DailyCheckIn['timeOfDay'],
    moodScore: coerceNumber(row.mood_score),
    energyLevel: asRequiredString(row.energy_level, 'medium') as DailyCheckIn['energyLevel'],
    stressLevel: asRequiredString(row.stress_level, 'medium') as DailyCheckIn['stressLevel'],
    tags: parseJsonValue<DailyCheckIn['tags']>(row.tags, []),
    note: asOptionalString(row.note) ?? asOptionalString(row.notes),
    wins: asOptionalString(row.wins),
    challenges: asOptionalString(row.challenges),
    moonSign: asRequiredString(row.moon_sign, 'unknown'),
    moonHouse: coerceNumber(row.moon_house),
    sunHouse: coerceNumber(row.sun_house),
    transitEvents: parseJsonValue<DailyCheckIn['transitEvents']>(row.transit_events, []),
    lunarPhase: asRequiredString(row.lunar_phase, 'unknown') as DailyCheckIn['lunarPhase'],
    retrogrades: parseJsonValue<string[]>(row.retrogrades, []),
    createdAt: asRequiredString(row.created_at),
    updatedAt: asRequiredString(row.updated_at),
  };
}

function checkInToRow(checkIn: DailyCheckIn, userId: string): Row {
  return {
    id: checkIn.id,
    user_id: userId,
    chart_id: checkIn.chartId,
    log_date: checkIn.date,
    time_of_day: checkIn.timeOfDay,
    mood_score: checkIn.moodScore,
    mood_value: Math.max(0, Math.min(10, Math.round(Number(checkIn.moodScore ?? 0)))),
    energy_level: checkIn.energyLevel,
    stress_level: checkIn.stressLevel,
    tags: JSON.stringify(checkIn.tags),
    note: checkIn.note ?? null,
    wins: checkIn.wins ?? null,
    challenges: checkIn.challenges ?? null,
    moon_sign: checkIn.moonSign,
    moon_house: checkIn.moonHouse,
    sun_house: checkIn.sunHouse,
    transit_events: JSON.stringify(checkIn.transitEvents),
    lunar_phase: checkIn.lunarPhase,
    retrogrades: JSON.stringify(checkIn.retrogrades),
    created_at: checkIn.createdAt,
    updated_at: checkIn.updatedAt,
  };
}

async function getExistingCheckInIdentity(
  userId: string,
  checkIn: DailyCheckIn,
): Promise<{ id: string; createdAt?: string } | null> {
  const { data, error } = await supabase
    .from('daily_check_ins')
    .select('id, created_at')
    .eq('user_id', userId)
    .eq('log_date', checkIn.date)
    .eq('time_of_day', checkIn.timeOfDay)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: asRequiredString((data as Row).id),
    createdAt: asOptionalString((data as Row).created_at),
  };
}

export async function getCheckIns(
  chartId: string,
  limit = 10000,
): Promise<DailyCheckIn[]> {
  const userId = await getUserId();

  const { data, error } = await supabase
    .from('daily_check_ins')
    .select('*')
    .eq('user_id', userId)
    .eq('chart_id', chartId)
    .order('log_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    logger.warn('[SupabaseDb] Failed to load daily check-ins from Supabase.', error);
    return [];
  }

  if (!data?.length) return [];
  return Promise.all((data as Row[]).map(mapCheckInRow));
}

export async function getCheckInByDate(
  date: string,
  chartId: string,
): Promise<DailyCheckIn | null> {
  const userId = await getUserId();

  const { data, error } = await supabase
    .from('daily_check_ins')
    .select('*')
    .eq('user_id', userId)
    .eq('chart_id', chartId)
    .eq('log_date', date)
    .maybeSingle();

  if (error) {
    logger.warn('[SupabaseDb] Failed to load daily check-in from Supabase.', error);
    return null;
  }

  return data ? mapCheckInRow(data as Row) : null;
}

export async function getCheckInsByDate(
  date: string,
  chartId: string,
): Promise<DailyCheckIn[]> {
  const userId = await getUserId();

  const { data, error } = await supabase
    .from('daily_check_ins')
    .select('*')
    .eq('user_id', userId)
    .eq('chart_id', chartId)
    .eq('log_date', date)
    .order('created_at', { ascending: true });

  if (error) {
    logger.warn('[SupabaseDb] Failed to load daily check-ins by date from Supabase.', error);
    return [];
  }

  if (!data?.length) return [];
  return Promise.all((data as Row[]).map(mapCheckInRow));
}

export async function getCheckInByDateAndTime(
  date: string,
  chartId: string,
  timeOfDay: string,
): Promise<DailyCheckIn | null> {
  const userId = await getUserId();

  const { data, error } = await supabase
    .from('daily_check_ins')
    .select('*')
    .eq('user_id', userId)
    .eq('chart_id', chartId)
    .eq('log_date', date)
    .eq('time_of_day', timeOfDay)
    .maybeSingle();

  if (error) {
    logger.warn('[SupabaseDb] Failed to load daily check-in slot from Supabase.', error);
    return null;
  }

  return data ? mapCheckInRow(data as Row) : null;
}

export async function getCheckInsInRange(
  chartId: string,
  startDate: string,
  endDate: string,
): Promise<DailyCheckIn[]> {
  const userId = await getUserId();

  const { data, error } = await supabase
    .from('daily_check_ins')
    .select('*')
    .eq('user_id', userId)
    .eq('chart_id', chartId)
    .gte('log_date', startDate)
    .lte('log_date', endDate)
    .order('log_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    logger.warn('[SupabaseDb] Failed to load daily check-ins range from Supabase.', error);
    return [];
  }

  if (!data?.length) return [];
  return Promise.all((data as Row[]).map(mapCheckInRow));
}

export async function getCheckInCount(chartId: string): Promise<number> {
  const userId = await getUserId();

  const { count, error } = await supabase
    .from('daily_check_ins')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('chart_id', chartId);

  if (error) {
    logger.warn('[SupabaseDb] Failed to count daily check-ins from Supabase.', error);
    return 0;
  }

  return count ?? 0;
}

export async function getTotalCheckInCount(): Promise<number> {
  const userId = await getUserId();

  const { count, error } = await supabase
    .from('daily_check_ins')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) {
    logger.warn('[SupabaseDb] Failed to count all daily check-ins from Supabase.', error);
    return 0;
  }

  return count ?? 0;
}

export async function saveCheckIn(checkIn: DailyCheckIn): Promise<void> {
  const validation = CheckInSchema.validate(checkIn);
  if (!validation.valid) {
    throw new ValidationError('Invalid check-in data', validation.errors);
  }

  const userId = await getUserId();
  const row = checkInToRow(checkIn, userId);

  try {
    const existing = await getExistingCheckInIdentity(userId, checkIn);
    const rowToSave = existing?.id
      ? {
          ...row,
          id: existing.id,
          created_at: existing.createdAt ?? row.created_at,
        }
      : row;

    await withRetry(
      async () => {
        const { error } = await supabase
          .from('daily_check_ins')
          .upsert(rowToSave, { onConflict: 'id' });

        if (error) throw error;
      },
      'saveCheckIn',
      RETRY_PRESETS.standard,
    );
  } catch (error) {
    if (isLikelyNetworkError(error)) {
      await offlineQueue.enqueue({
        type: 'checkin',
        payload: { userId, checkIn: row },
      });
      logger.warn('[SupabaseDb] Daily check-in queued for offline sync', { id: checkIn.id });
      return;
    }

    logger.warn('[SupabaseDb] Failed to save daily check-in to Supabase.', {
      id: checkIn.id,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

// ─── Insight History ─────────────────────────────────────────────────────────

async function mapInsightRow(row: Row): Promise<SavedInsight> {
  return {
    id: asRequiredString(row.id),
    date: asRequiredString(row.date),
    chartId: asRequiredString(row.chart_id),
    greeting: asRequiredString(row.greeting),
    loveHeadline: asRequiredString(row.love_headline),
    loveMessage: asRequiredString(row.love_message),
    energyHeadline: asRequiredString(row.energy_headline),
    energyMessage: asRequiredString(row.energy_message),
    growthHeadline: asRequiredString(row.growth_headline),
    growthMessage: asRequiredString(row.growth_message),
    gentleReminder: asRequiredString(row.gentle_reminder),
    journalPrompt: asRequiredString(row.journal_prompt),
    moonSign: asOptionalString(row.moon_sign),
    moonPhase: asOptionalString(row.moon_phase),
    signals: asOptionalString(row.signals),
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
      signals: insight.signals ?? null,
      is_favorite: insight.isFavorite,
      viewed_at: insight.viewedAt ?? null,
      created_at: insight.createdAt,
      updated_at: insight.updatedAt,
    },
    { onConflict: 'id' },
  );

  if (error) {
    logger.warn('[SupabaseDb] Failed to save insight to Supabase.', error);
    throw error;
  }
}

export async function getInsightByDate(
  date: string,
  chartId: string,
): Promise<SavedInsight | null> {
  const userId = await getUserId();

  const { data, error } = await supabase
    .from('insight_history')
    .select('*')
    .eq('user_id', userId)
    .eq('chart_id', chartId)
    .eq('date', date)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    logger.warn('[SupabaseDb] Failed to load insight by date from Supabase.', error);
    return null;
  }

  return data ? mapInsightRow(data as Row) : null;
}

export async function getInsightById(id: string): Promise<SavedInsight | null> {
  const userId = await getUserId();

  const { data, error } = await supabase
    .from('insight_history')
    .select('*')
    .eq('user_id', userId)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    logger.warn('[SupabaseDb] Failed to load insight by id from Supabase.', error);
    return null;
  }

  return data ? mapInsightRow(data as Row) : null;
}

export async function getInsightHistory(
  chartId: string,
  options: { limit?: number; offset?: number } = {},
): Promise<SavedInsight[]> {
  const userId = await getUserId();
  const limit = options.limit ?? 50;
  const offset = options.offset ?? 0;

  const { data, error } = await supabase
    .from('insight_history')
    .select('*')
    .eq('user_id', userId)
    .eq('chart_id', chartId)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    logger.warn('[SupabaseDb] Failed to load insight history from Supabase.', error);
    return [];
  }

  if (!data?.length) return [];
  return Promise.all((data as Row[]).map(mapInsightRow));
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

  if (error) {
    logger.warn('[SupabaseDb] Failed to update insight favorite in Supabase.', error);
    throw error;
  }
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

  if (error) {
    logger.warn('[SupabaseDb] Failed to update insight viewed state in Supabase.', error);
    throw error;
  }
}

// ─── Relationship Charts ─────────────────────────────────────────────────────

async function mapRelationshipRow(row: Row): Promise<RelationshipChart> {
  return {
    id: asRequiredString(row.id),
    name: asRequiredString(row.name) || asRequiredString(row.partner_name),
    relationship: asRequiredString(row.relationship, 'partner') as RelationshipChart['relationship'],
    birthDate: asRequiredString(row.birth_date),
    birthTime: asOptionalString(row.birth_time),
    hasUnknownTime: Boolean(row.has_unknown_time),
    birthPlace: asRequiredString(row.birth_place),
    latitude: coerceNumber(row.latitude),
    longitude: coerceNumber(row.longitude),
    timezone: asOptionalString(row.timezone),
    userChartId: asRequiredString(row.user_chart_id),
    createdAt: asRequiredString(row.created_at),
    updatedAt: asRequiredString(row.updated_at),
    isDeleted: Boolean(row.is_deleted),
    deletedAt: asOptionalString(row.deleted_at),
  };
}

export async function getRelationshipCharts(
  userChartId: string,
): Promise<RelationshipChart[]> {
  const userId = await getUserId();

  const { data, error } = await supabase
    .from('relationship_charts')
    .select('*')
    .eq('user_id', userId)
    .eq('user_chart_id', userChartId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  if (error) {
    logger.warn('[SupabaseDb] Failed to load relationship charts from Supabase.', error);
    return [];
  }

  if (!data?.length) return [];
  return Promise.all((data as Row[]).map(mapRelationshipRow));
}

export async function getRelationshipChartById(
  id: string,
): Promise<RelationshipChart | null> {
  const userId = await getUserId();

  const { data, error } = await supabase
    .from('relationship_charts')
    .select('*')
    .eq('user_id', userId)
    .eq('id', id)
    .eq('is_deleted', false)
    .maybeSingle();

  if (error) {
    logger.warn('[SupabaseDb] Failed to load relationship chart from Supabase.', error);
    return null;
  }

  return data ? mapRelationshipRow(data as Row) : null;
}

export async function saveRelationshipChart(
  chart: RelationshipChart,
): Promise<void> {
  const userId = await getUserId();

  const { error } = await supabase.from('relationship_charts').upsert(
    {
      id: chart.id,
      user_id: userId,
      user_chart_id: chart.userChartId,
      name: chart.name,
      partner_name: chart.name,
      relationship: chart.relationship,
      birth_date: chart.birthDate,
      birth_time: chart.birthTime ?? null,
      has_unknown_time: chart.hasUnknownTime,
      birth_place: chart.birthPlace,
      latitude: chart.latitude,
      longitude: chart.longitude,
      timezone: chart.timezone ?? null,
      is_deleted: chart.isDeleted,
      deleted_at: chart.deletedAt ?? null,
      created_at: chart.createdAt,
      updated_at: chart.updatedAt,
    },
    { onConflict: 'id' },
  );

  if (error) {
    logger.warn('[SupabaseDb] Failed to save relationship chart to Supabase.', error);
    throw error;
  }
}

export async function deleteRelationshipChart(id: string): Promise<void> {
  const userId = await getUserId();
  const now = new Date().toISOString();

  const { error } = await supabase
    .from('relationship_charts')
    .update({ is_deleted: true, deleted_at: now, updated_at: now })
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    logger.warn('[SupabaseDb] Failed to delete relationship chart from Supabase.', error);
    throw error;
  }
}

export async function getRelationshipChartCount(
  userChartId: string,
): Promise<number> {
  const userId = await getUserId();

  const { count, error } = await supabase
    .from('relationship_charts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('user_chart_id', userChartId)
    .eq('is_deleted', false);

  if (error) {
    logger.warn('[SupabaseDb] Failed to count relationship charts from Supabase.', error);
    return 0;
  }

  return count ?? 0;
}

export async function clearAccountScopedData(): Promise<void> {
  // Supabase is the source of truth. No account-scoped local settings cache is used.
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
    supabase.from('insight_feedback').delete().eq('user_id', userId),
    supabase.from('shown_insights').delete().eq('user_id', userId),
    supabase.from('insight_candidates').delete().eq('user_id', userId),
    supabase.from('insight_signals').delete().eq('user_id', userId),
    supabase.from('user_insight_memory').delete().eq('user_id', userId),
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
