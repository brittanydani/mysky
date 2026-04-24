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
import { EncryptedAsyncStorage } from './encryptedAsyncStorage';
import {
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

  const profile = data?.profile as ({
    chartId: string;
    name?: string | null;
    birthDate: string;
    birthTime?: string | null;
    hasUnknownTime: boolean;
    birthPlace: string;
    latitude: number;
    longitude: number;
    timezone?: string | null;
    houseSystem?: string | null;
    createdAt?: string;
    updatedAt: string;
    isDeleted: boolean;
    deletedAt?: string | null;
  } | null);

  if (!profile || profile.isDeleted) return [];

  const chart: SavedChart = {
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

  if (!isValidChart(chart)) return [];
  return [chart];
}

export async function saveChart(chart: SavedChart): Promise<void> {
  try {
    await invokeBirthProfileSync('upsert', {
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

export async function upsertChart(chart: SavedChart): Promise<void> {
  return saveChart(chart);
}

export async function deleteChart(id: string): Promise<void> {
  const now = new Date().toISOString();

  try {
    await invokeBirthProfileSync('delete', {
      chartId: id,
      updatedAt: now,
      deletedAt: now,
    });
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

  const charts = await getCharts();
  const remaining = charts.filter((c) => c.id !== id);

  if (remaining.length > 0) {
    await saveChart(remaining[0]);
  } else {
    await IdentityVault.destroyIdentity().catch(() => {});
  }
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
  if (error) throw error;
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

  if (error) throw error;
  return count ?? 0;
}

export async function saveJournalEntry(entry: JournalEntry): Promise<void> {
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

  if (error) throw error;
}

// ─── Settings ────────────────────────────────────────────────────────────────

export async function getSettings(): Promise<AppSettings | null> {
  try {
    const raw = await EncryptedAsyncStorage.getItem(SETTINGS_KEY);
    return raw ? (JSON.parse(raw) as AppSettings) : null;
  } catch {
    return null;
  }
}

export async function updateSettings(settings: AppSettings): Promise<void> {
  try {
    await EncryptedAsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    logger.error('[SupabaseDb] Failed to save settings:', e);
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
    .eq('is_deleted', false)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false });

  if (error) throw error;
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
    .eq('date', date)
    .eq('is_deleted', false)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return mapSleepRow(data as Row);
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
}

export async function deleteSleepEntry(id: string): Promise<void> {
  const userId = await getUserId();
  const now = new Date().toISOString();

  const { error } = await supabase
    .from('sleep_entries')
    .update({ is_deleted: true, updated_at: now })
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;
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
    .eq('log_date', date)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return mapCheckInRow(data as Row);
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
    .eq('log_date', date)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true });

  if (error) throw error;
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
    .eq('log_date', date)
    .eq('time_of_day', timeOfDay)
    .eq('is_deleted', false)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return mapCheckInRow(data as Row);
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
    .eq('is_deleted', false)
    .gte('log_date', startDate)
    .lte('log_date', endDate)
    .order('log_date', { ascending: false });

  if (error) throw error;
  if (!data?.length) return [];

  return Promise.all((data as Row[]).map(mapCheckInRow));
}

export async function getCheckInCount(chartId: string): Promise<number> {
  const userId = await getUserId();

  const { count, error } = await supabase
    .from('daily_check_ins')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_deleted', false);

  if (error) throw error;
  return count ?? 0;
}

export async function getTotalCheckInCount(): Promise<number> {
  const userId = await getUserId();

  const { count, error } = await supabase
    .from('daily_check_ins')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) throw error;
  return count ?? 0;
}

export async function saveCheckIn(checkIn: DailyCheckIn): Promise<void> {
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
    { onConflict: 'id' },
  );

  if (error) throw error;
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
    .eq('is_deleted', false)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return mapInsightRow(data as Row);
}

export async function getInsightById(id: string): Promise<SavedInsight | null> {
  const userId = await getUserId();

  const { data, error } = await supabase
    .from('insight_history')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return mapInsightRow(data as Row);
}

export async function getInsightHistory(
  chartId: string,
  options?: { limit?: number; favoritesOnly?: boolean },
): Promise<SavedInsight[]> {
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

  return Promise.all((data as Row[]).map(mapInsightRow));
}

export async function updateInsightFavorite(
  id: string,
  isFavorite: boolean,
): Promise<void> {
  const userId = await getUserId();

  const { error } = await supabase
    .from('insight_history')
    .update({ is_favorite: isFavorite, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function updateInsightViewedAt(
  id: string,
  viewedAt: string,
): Promise<void> {
  const userId = await getUserId();

  const { error } = await supabase
    .from('insight_history')
    .update({ viewed_at: viewedAt, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;
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

  return Promise.all((data as Row[]).map(mapRelationshipRow));
}

export async function getRelationshipChartById(
  id: string,
): Promise<RelationshipChart | null> {
  const userId = await getUserId();

  const { data, error } = await supabase
    .from('relationship_charts')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return mapRelationshipRow(data as Row);
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
}

export async function getRelationshipChartCount(
  userChartId?: string,
): Promise<number> {
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
}

// ─── Account cleanup ──────────────────────────────────────────────────────────

export async function clearAccountScopedData(): Promise<void> {
  try {
    await EncryptedAsyncStorage.removeItem(SETTINGS_KEY);
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
