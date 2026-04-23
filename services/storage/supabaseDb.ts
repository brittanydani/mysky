/**
 * supabaseDb.ts — Network-first data layer
 *
 * Replaces the offline-first SQLite localDb. All reads and writes go directly
 * to Supabase. The app requires an active internet connection to function.
 *
 * Security model:
 * - Supabase RLS enforces row-level ownership (auth.uid() = user_id).
 * - Sensitive text fields are AES-256-GCM encrypted client-side by
 *   FieldEncryptionService before transmission. The server stores opaque
 *   ENC2: ciphertext — no plaintext PII is transmitted or stored server-side.
 * - TLS protects data in transit.
 *
 * Field naming:
 * - App types use camelCase.
 * - Supabase columns use snake_case with _enc suffix for encrypted fields.
 */

import { supabase } from '../../lib/supabase';
import {
  SavedChart,
  JournalEntry,
  AppSettings,
  RelationshipChart,
  SleepEntry,
} from './models';
import { FieldEncryptionService, isDecryptionFailure } from './fieldEncryption';
import { IdentityVault } from '../../utils/IdentityVault';
import { logger } from '../../utils/logger';
import type { HouseSystem } from '../astrology/types';
import type { SavedInsight } from './insightHistory';
import type { DailyCheckIn } from '../patterns/types';
import { EncryptedAsyncStorage } from './encryptedAsyncStorage';

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

function coerceNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

async function decryptOptionalField(value: unknown): Promise<string | undefined> {
  if (typeof value !== 'string' || !value.trim()) return undefined;

  try {
    const decrypted = await FieldEncryptionService.decryptField(value);
    if (!decrypted || isDecryptionFailure(decrypted)) return undefined;
    return decrypted;
  } catch {
    return undefined;
  }
}

async function decryptRequiredField(
  value: unknown,
  field: string,
  rowId: string,
): Promise<string | undefined> {
  const decrypted = await decryptOptionalField(value);
  if (!decrypted) {
    logger.error(`[SupabaseDb] ${field} for ${rowId} is unreadable`);
    return undefined;
  }
  return decrypted;
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

async function mapChartRow(row: Row): Promise<SavedChart> {
  const rowId = asRequiredString(row.id);

  const [name, birthDate, birthTime, birthPlace, latStr, lngStr] = await Promise.all([
    decryptOptionalField(row.name_enc),
    decryptRequiredField(row.birth_date_enc, 'birth_date', rowId),
    decryptOptionalField(row.birth_time_enc),
    decryptRequiredField(row.birth_place_enc, 'birth_place', rowId),
    decryptOptionalField(row.latitude_enc),
    decryptOptionalField(row.longitude_enc),
  ]);

  return {
    id: rowId,
    name,
    birthDate: birthDate ?? '',
    birthTime,
    hasUnknownTime: Boolean(row.has_unknown_time),
    birthPlace: birthPlace ?? '',
    latitude: parseCoord(latStr, 'latitude', rowId) ?? 0,
    longitude: parseCoord(lngStr, 'longitude', rowId) ?? 0,
    timezone: asOptionalString(row.timezone),
    houseSystem: row.house_system as HouseSystem | undefined,
    createdAt: asRequiredString(row.created_at),
    updatedAt: asRequiredString(row.updated_at),
    isDeleted: Boolean(row.is_deleted),
    deletedAt: asOptionalString(row.deleted_at),
  };
}

export async function getCharts(): Promise<SavedChart[]> {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) return [];

  const { data, error } = await supabase.functions.invoke('birth-profile-sync', {
    body: { action: 'getLatest' },
  });

  if (error) throw error;

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

async function encryptChartFields(chart: SavedChart) {
  const [name, birthDate, birthTime, birthPlace, latitude, longitude] = await Promise.all([
    chart.name ? FieldEncryptionService.encryptField(chart.name) : Promise.resolve(null),
    FieldEncryptionService.encryptField(chart.birthDate),
    chart.birthTime ? FieldEncryptionService.encryptField(chart.birthTime) : Promise.resolve(null),
    FieldEncryptionService.encryptField(chart.birthPlace),
    chart.latitude != null
      ? FieldEncryptionService.encryptField(String(chart.latitude))
      : Promise.resolve(null),
    chart.longitude != null
      ? FieldEncryptionService.encryptField(String(chart.longitude))
      : Promise.resolve(null),
  ]);

  return { name, birthDate, birthTime, birthPlace, latitude, longitude };
}

export async function saveChart(chart: SavedChart): Promise<void> {
  const { error } = await supabase.functions.invoke('birth-profile-sync', {
    body: {
      action: 'upsert',
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
    },
  });

  if (error) throw error;

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

  const { error } = await supabase.functions.invoke('birth-profile-sync', {
    body: {
      action: 'delete',
      chartId: id,
      updatedAt: now,
      deletedAt: now,
    },
  });

  if (error) throw error;

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
  const [title, content, contentKeywords, contentEmotions, contentSentiment] =
    await Promise.all([
      decryptOptionalField(row.title_enc),
      decryptOptionalField(row.content_enc),
      decryptOptionalField(row.content_keywords_enc),
      decryptOptionalField(row.content_emotions_enc),
      decryptOptionalField(row.content_sentiment_enc),
    ]);

  return {
    id: asRequiredString(row.id),
    date: asRequiredString(row.date),
    mood: row.mood as JournalEntry['mood'],
    moonPhase: row.moon_phase as JournalEntry['moonPhase'],
    title,
    content: content ?? '',
    chartId: asOptionalString(row.chart_id),
    transitSnapshot: asOptionalString(row.transit_snapshot),
    contentKeywords,
    contentEmotions,
    contentSentiment,
    contentWordCount:
      typeof row.content_word_count === 'number' ? row.content_word_count : undefined,
    contentReadingMinutes:
      typeof row.content_reading_minutes === 'number'
        ? row.content_reading_minutes
        : undefined,
    tags: safeJsonParse<string[] | undefined>(row.tags, undefined),
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
    .order('date', { ascending: false });

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

  const [titleEnc, contentEnc, keywordsEnc, emotionsEnc, sentimentEnc] = await Promise.all([
    entry.title ? FieldEncryptionService.encryptField(entry.title) : Promise.resolve(null),
    FieldEncryptionService.encryptField(entry.content),
    entry.contentKeywords
      ? FieldEncryptionService.encryptField(entry.contentKeywords)
      : Promise.resolve(null),
    entry.contentEmotions
      ? FieldEncryptionService.encryptField(entry.contentEmotions)
      : Promise.resolve(null),
    entry.contentSentiment
      ? FieldEncryptionService.encryptField(entry.contentSentiment)
      : Promise.resolve(null),
  ]);

  const { error } = await supabase.from('journal_entries').upsert(
    {
      id: entry.id,
      user_id: userId,
      date: entry.date,
      mood: entry.mood,
      moon_phase: entry.moonPhase,
      title_enc: titleEnc,
      content_enc: contentEnc,
      content_keywords_enc: keywordsEnc,
      content_emotions_enc: emotionsEnc,
      content_sentiment_enc: sentimentEnc,
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
  const [dreamText, dreamFeelings, dreamMetadata, notes] = await Promise.all([
    decryptOptionalField(row.dream_text_enc),
    decryptOptionalField(row.dream_feelings_enc),
    decryptOptionalField(row.dream_metadata_enc),
    decryptOptionalField(row.notes_enc),
  ]);

  return {
    id: asRequiredString(row.id),
    chartId: asRequiredString(row.chart_id),
    date: asRequiredString(row.date),
    durationHours:
      typeof row.duration_hours === 'number' ? row.duration_hours : undefined,
    quality: typeof row.quality === 'number' ? row.quality : undefined,
    dreamText,
    dreamMood: asOptionalString(row.dream_mood),
    dreamFeelings,
    dreamMetadata,
    notes,
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
    .eq('chart_id', chartId)
    .eq('is_deleted', false)
    .order('date', { ascending: false })
    .limit(limit);

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
    .eq('chart_id', chartId)
    .eq('date', date)
    .eq('is_deleted', false)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return mapSleepRow(data as Row);
}

export async function saveSleepEntry(entry: SleepEntry): Promise<void> {
  const userId = await getUserId();

  const [dreamTextEnc, dreamFeelingsEnc, dreamMetadataEnc, notesEnc] =
    await Promise.all([
      entry.dreamText
        ? FieldEncryptionService.encryptField(entry.dreamText)
        : Promise.resolve(null),
      entry.dreamFeelings
        ? FieldEncryptionService.encryptField(entry.dreamFeelings)
        : Promise.resolve(null),
      entry.dreamMetadata
        ? FieldEncryptionService.encryptField(entry.dreamMetadata)
        : Promise.resolve(null),
      entry.notes ? FieldEncryptionService.encryptField(entry.notes) : Promise.resolve(null),
    ]);

  const { error } = await supabase.from('sleep_entries').upsert(
    {
      id: entry.id,
      user_id: userId,
      chart_id: entry.chartId,
      date: entry.date,
      duration_hours: entry.durationHours ?? null,
      quality: entry.quality ?? null,
      dream_text_enc: dreamTextEnc,
      dream_mood: entry.dreamMood ?? null,
      dream_feelings_enc: dreamFeelingsEnc,
      dream_metadata_enc: dreamMetadataEnc,
      notes_enc: notesEnc,
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
  const [moodScore, energyLevel, stressLevel, tags, note, wins, challenges] =
    await Promise.all([
      row.mood_score_enc
        ? decryptOptionalField(row.mood_score_enc)
        : Promise.resolve(
            row.mood_value != null ? String(row.mood_value) : '0',
          ),
      row.energy_level_enc
        ? decryptOptionalField(row.energy_level_enc)
        : Promise.resolve('medium'),
      row.stress_level_enc
        ? decryptOptionalField(row.stress_level_enc)
        : Promise.resolve('medium'),
      row.tags_enc ? decryptOptionalField(row.tags_enc) : Promise.resolve('[]'),
      decryptOptionalField(row.note_enc),
      decryptOptionalField(row.wins_enc),
      decryptOptionalField(row.challenges_enc),
    ]);

  const moodNum = coerceNumber(moodScore, 0);

  return {
    id: asRequiredString(row.id),
    date: asRequiredString(row.log_date ?? row.date),
    chartId: asOptionalString(row.chart_id) ?? '',
    moodScore: moodNum,
    energyLevel: ((energyLevel ?? 'medium') as DailyCheckIn['energyLevel']),
    stressLevel: ((stressLevel ?? 'medium') as DailyCheckIn['stressLevel']),
    tags: safeJsonParse<string[]>(tags, []),
    note,
    wins,
    challenges,
    moonSign: asOptionalString(row.moon_sign) ?? 'unknown',
    moonHouse: typeof row.moon_house === 'number' ? row.moon_house : 0,
    sunHouse: typeof row.sun_house === 'number' ? row.sun_house : 0,
    transitEvents: safeJsonParse<DailyCheckIn['transitEvents']>(
      row.transit_events,
      [],
    ),
    lunarPhase:
      ((asOptionalString(row.lunar_phase) ?? 'unknown') as DailyCheckIn['lunarPhase']),
    retrogrades: safeJsonParse<string[]>(row.retrogrades, []),
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
    .eq('chart_id', chartId)
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
    .eq('chart_id', chartId)
    .eq('log_date', date)
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
    .eq('chart_id', chartId)
    .eq('log_date', date)
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
    .eq('chart_id', chartId)
    .eq('log_date', date)
    .eq('time_of_day', timeOfDay)
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
    .eq('chart_id', chartId)
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
    .eq('chart_id', chartId);

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

  const [moodEnc, energyEnc, stressEnc, tagsEnc, noteEnc, winsEnc, challengesEnc] =
    await Promise.all([
      FieldEncryptionService.encryptField(String(checkIn.moodScore)),
      FieldEncryptionService.encryptField(checkIn.energyLevel),
      FieldEncryptionService.encryptField(checkIn.stressLevel),
      FieldEncryptionService.encryptField(JSON.stringify(checkIn.tags ?? [])),
      checkIn.note ? FieldEncryptionService.encryptField(checkIn.note) : Promise.resolve(null),
      checkIn.wins ? FieldEncryptionService.encryptField(checkIn.wins) : Promise.resolve(null),
      checkIn.challenges
        ? FieldEncryptionService.encryptField(checkIn.challenges)
        : Promise.resolve(null),
    ]);

  const moodNum = Math.max(0, Math.min(10, Math.round(checkIn.moodScore)));

  const { error } = await supabase.from('daily_check_ins').upsert(
    {
      id: checkIn.id,
      user_id: userId,
      log_date: checkIn.date,
      chart_id: checkIn.chartId,
      mood_value: moodNum,
      mood_score_enc: moodEnc,
      energy_level_enc: energyEnc,
      stress_level_enc: stressEnc,
      tags_enc: tagsEnc,
      note_enc: noteEnc,
      wins_enc: winsEnc,
      challenges_enc: challengesEnc,
      moon_sign: checkIn.moonSign ?? null,
      moon_house: checkIn.moonHouse ?? null,
      sun_house: checkIn.sunHouse ?? null,
      transit_events: checkIn.transitEvents
        ? JSON.stringify(checkIn.transitEvents)
        : null,
      lunar_phase: checkIn.lunarPhase ?? null,
      retrogrades: checkIn.retrogrades ? JSON.stringify(checkIn.retrogrades) : null,
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
  const [
    greeting,
    loveHeadline,
    loveMessage,
    energyHeadline,
    energyMessage,
    growthHeadline,
    growthMessage,
    gentleReminder,
    journalPrompt,
    signals,
  ] = await Promise.all([
    decryptOptionalField(row.greeting_enc),
    decryptOptionalField(row.love_headline_enc),
    decryptOptionalField(row.love_message_enc),
    decryptOptionalField(row.energy_headline_enc),
    decryptOptionalField(row.energy_message_enc),
    decryptOptionalField(row.growth_headline_enc),
    decryptOptionalField(row.growth_message_enc),
    decryptOptionalField(row.gentle_reminder_enc),
    decryptOptionalField(row.journal_prompt_enc),
    decryptOptionalField(row.signals_enc),
  ]);

  const clean = (v?: string) => v ?? '';

  return {
    id: asRequiredString(row.id),
    date: asRequiredString(row.date),
    chartId: asRequiredString(row.chart_id),
    greeting: clean(greeting),
    loveHeadline: clean(loveHeadline),
    loveMessage: clean(loveMessage),
    energyHeadline: clean(energyHeadline),
    energyMessage: clean(energyMessage),
    growthHeadline: clean(growthHeadline),
    growthMessage: clean(growthMessage),
    gentleReminder: clean(gentleReminder),
    journalPrompt: clean(journalPrompt),
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

  const [
    greetingEnc,
    loveHEnc,
    loveMEnc,
    energyHEnc,
    energyMEnc,
    growthHEnc,
    growthMEnc,
    gentleEnc,
    journalEnc,
    signalsEnc,
  ] = await Promise.all([
    FieldEncryptionService.encryptField(insight.greeting),
    FieldEncryptionService.encryptField(insight.loveHeadline),
    FieldEncryptionService.encryptField(insight.loveMessage),
    FieldEncryptionService.encryptField(insight.energyHeadline),
    FieldEncryptionService.encryptField(insight.energyMessage),
    FieldEncryptionService.encryptField(insight.growthHeadline),
    FieldEncryptionService.encryptField(insight.growthMessage),
    FieldEncryptionService.encryptField(insight.gentleReminder),
    FieldEncryptionService.encryptField(insight.journalPrompt),
    insight.signals ? FieldEncryptionService.encryptField(insight.signals) : Promise.resolve(null),
  ]);

  const { error } = await supabase.from('insight_history').upsert(
    {
      id: insight.id,
      user_id: userId,
      date: insight.date,
      chart_id: insight.chartId,
      greeting_enc: greetingEnc,
      love_headline_enc: loveHEnc,
      love_message_enc: loveMEnc,
      energy_headline_enc: energyHEnc,
      energy_message_enc: energyMEnc,
      growth_headline_enc: growthHEnc,
      growth_message_enc: growthMEnc,
      gentle_reminder_enc: gentleEnc,
      journal_prompt_enc: journalEnc,
      moon_sign: insight.moonSign ?? null,
      moon_phase: insight.moonPhase ?? null,
      signals_enc: signalsEnc,
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

  const [name, birthDate, birthTime, birthPlace, latStr, lngStr] = await Promise.all([
    decryptRequiredField(row.name_enc, 'relationship name', rowId),
    decryptRequiredField(row.birth_date_enc, 'relationship birth_date', rowId),
    decryptOptionalField(row.birth_time_enc),
    decryptRequiredField(row.birth_place_enc, 'relationship birth_place', rowId),
    decryptOptionalField(row.latitude_enc),
    decryptOptionalField(row.longitude_enc),
  ]);

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

  const [nameEnc, birthDateEnc, birthTimeEnc, birthPlaceEnc, latEnc, lngEnc] =
    await Promise.all([
      FieldEncryptionService.encryptField(chart.name),
      FieldEncryptionService.encryptField(chart.birthDate),
      chart.birthTime ? FieldEncryptionService.encryptField(chart.birthTime) : Promise.resolve(null),
      FieldEncryptionService.encryptField(chart.birthPlace),
      chart.latitude != null
        ? FieldEncryptionService.encryptField(String(chart.latitude))
        : Promise.resolve(null),
      chart.longitude != null
        ? FieldEncryptionService.encryptField(String(chart.longitude))
        : Promise.resolve(null),
    ]);

  const { error } = await supabase.from('relationship_charts').upsert(
    {
      id: chart.id,
      user_id: userId,
      name_enc: nameEnc,
      relationship: chart.relationship,
      birth_date_enc: birthDateEnc,
      birth_time_enc: birthTimeEnc,
      has_unknown_time: chart.hasUnknownTime,
      birth_place_enc: birthPlaceEnc,
      latitude_enc: latEnc,
      longitude_enc: lngEnc,
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
