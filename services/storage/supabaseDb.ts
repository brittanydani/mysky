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
import { SavedChart, JournalEntry, AppSettings, RelationshipChart, SleepEntry } from './models';
import { FieldEncryptionService, isDecryptionFailure } from './fieldEncryption';
import { IdentityVault } from '../../utils/IdentityVault';
import { logger } from '../../utils/logger';
import type { HouseSystem } from '../astrology/types';
import type { SavedInsight } from './insightHistory';
import type { DailyCheckIn } from '../patterns/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getUserId(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const uid = data.session?.user?.id;
  if (!uid) throw new Error('Not authenticated');
  return uid;
}

function parseCoord(value: string | undefined | null, field: string, id: string): number {
  if (!value || isDecryptionFailure(value)) {
    logger.error(`[SupabaseDb] ${field} for ${id} is unreadable`);
    return Number.NaN;
  }
  const n = Number.parseFloat(value);
  if (!Number.isFinite(n)) {
    logger.error(`[SupabaseDb] ${field} for ${id} is invalid: ${value}`);
    return Number.NaN;
  }
  return n;
}

function isValidChart(chart: { id: string; birthDate: string; birthPlace: string; latitude: number; longitude: number }): boolean {
  if (!chart.birthDate || !chart.birthPlace?.trim()) {
    logger.error(`[SupabaseDb] Dropping invalid chart ${chart.id}: missing birth data`);
    return false;
  }
  if (!Number.isFinite(chart.latitude) || !Number.isFinite(chart.longitude)) {
    logger.error(`[SupabaseDb] Dropping invalid chart ${chart.id}: bad coordinates`);
    return false;
  }
  return true;
}

// ─── Charts ──────────────────────────────────────────────────────────────────

async function mapChartRow(row: Record<string, unknown>): Promise<SavedChart> {
  const [name, birthDate, birthTime, birthPlace, latStr, lngStr] = await Promise.all([
    row.name_enc ? FieldEncryptionService.decryptField(row.name_enc as string) : Promise.resolve(undefined),
    FieldEncryptionService.decryptField(row.birth_date_enc as string),
    row.birth_time_enc ? FieldEncryptionService.decryptField(row.birth_time_enc as string) : Promise.resolve(undefined),
    FieldEncryptionService.decryptField(row.birth_place_enc as string),
    FieldEncryptionService.decryptField(row.latitude_enc as string),
    FieldEncryptionService.decryptField(row.longitude_enc as string),
  ]);
  return {
    id: row.id as string,
    name: name && !isDecryptionFailure(name) ? name : undefined,
    birthDate: birthDate && !isDecryptionFailure(birthDate) ? birthDate : '',
    birthTime: birthTime && !isDecryptionFailure(birthTime) ? birthTime : undefined,
    hasUnknownTime: Boolean(row.has_unknown_time),
    birthPlace: birthPlace && !isDecryptionFailure(birthPlace) ? birthPlace : '',
    latitude: parseCoord(latStr, 'latitude', row.id as string),
    longitude: parseCoord(lngStr, 'longitude', row.id as string),
    timezone: (row.timezone as string | undefined) ?? undefined,
    houseSystem: (row.house_system as HouseSystem | undefined) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    isDeleted: Boolean(row.is_deleted),
    deletedAt: (row.deleted_at as string | undefined) ?? undefined,
  };
}

export async function getCharts(): Promise<SavedChart[]> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('birth_profiles')
    .select('*')
    .eq('user_id', userId)
    .eq('is_deleted', false)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  if (!data?.length) return [];

  const charts = await Promise.all((data as Record<string, unknown>[]).map(mapChartRow));
  return charts.filter(isValidChart);
}

async function encryptChartFields(chart: SavedChart) {
  const [name, birthDate, birthTime, birthPlace, latitude, longitude] = await Promise.all([
    chart.name ? FieldEncryptionService.encryptField(chart.name) : Promise.resolve(null),
    FieldEncryptionService.encryptField(chart.birthDate),
    chart.birthTime ? FieldEncryptionService.encryptField(chart.birthTime) : Promise.resolve(null),
    FieldEncryptionService.encryptField(chart.birthPlace),
    FieldEncryptionService.encryptField(String(chart.latitude)),
    FieldEncryptionService.encryptField(String(chart.longitude)),
  ]);
  return { name, birthDate, birthTime, birthPlace, latitude, longitude };
}

export async function saveChart(chart: SavedChart): Promise<void> {
  const userId = await getUserId();
  const enc = await encryptChartFields(chart);

  await supabase.functions.invoke('birth-profile-sync', {
    body: {
      action: 'upsert',
      id: chart.id,
      user_id: userId,
      chart_id: chart.id,
      name_enc: enc.name,
      birth_date_enc: enc.birthDate,
      birth_time_enc: enc.birthTime,
      has_unknown_time: chart.hasUnknownTime,
      birth_place_enc: enc.birthPlace,
      latitude_enc: enc.latitude,
      longitude_enc: enc.longitude,
      timezone: chart.timezone ?? null,
      house_system: chart.houseSystem ?? null,
      is_deleted: chart.isDeleted,
      deleted_at: chart.deletedAt ?? null,
      created_at: chart.createdAt,
      updated_at: chart.updatedAt,
    },
  });

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
  const userId = await getUserId();
  const now = new Date().toISOString();
  await supabase.functions.invoke('birth-profile-sync', {
    body: { action: 'delete', chart_id: id, user_id: userId, deleted_at: now, updated_at: now },
  });

  const charts = await getCharts();
  const remaining = charts.filter(c => c.id !== id);
  if (remaining.length > 0) {
    await saveChart(remaining[0]);
  } else {
    await IdentityVault.destroyIdentity().catch(() => {});
  }
}

export async function updateAllChartsHouseSystem(houseSystem: HouseSystem): Promise<void> {
  const charts = await getCharts();
  await Promise.all(charts.map(c => saveChart({ ...c, houseSystem, updatedAt: new Date().toISOString() })));
}

// ─── Journal Entries ──────────────────────────────────────────────────────────

async function mapJournalRow(row: Record<string, unknown>): Promise<JournalEntry> {
  const [title, content, contentKeywords, contentEmotions, contentSentiment] = await Promise.all([
    row.title_enc ? FieldEncryptionService.decryptField(row.title_enc as string) : Promise.resolve(undefined),
    FieldEncryptionService.decryptField(row.content_enc as string),
    row.content_keywords_enc ? FieldEncryptionService.decryptField(row.content_keywords_enc as string) : Promise.resolve(undefined),
    row.content_emotions_enc ? FieldEncryptionService.decryptField(row.content_emotions_enc as string) : Promise.resolve(undefined),
    row.content_sentiment_enc ? FieldEncryptionService.decryptField(row.content_sentiment_enc as string) : Promise.resolve(undefined),
  ]);
  return {
    id: row.id as string,
    date: row.date as string,
    mood: row.mood as JournalEntry['mood'],
    moonPhase: row.moon_phase as JournalEntry['moonPhase'],
    title: title && !isDecryptionFailure(title) ? title : undefined,
    content: content && !isDecryptionFailure(content) ? content : '',
    chartId: (row.chart_id as string | undefined) ?? undefined,
    transitSnapshot: (row.transit_snapshot as string | undefined) ?? undefined,
    contentKeywords: contentKeywords && !isDecryptionFailure(contentKeywords) ? contentKeywords : undefined,
    contentEmotions: contentEmotions && !isDecryptionFailure(contentEmotions) ? contentEmotions : undefined,
    contentSentiment: contentSentiment && !isDecryptionFailure(contentSentiment) ? contentSentiment : undefined,
    contentWordCount: row.content_word_count as number | undefined,
    contentReadingMinutes: row.content_reading_minutes as number | undefined,
    tags: row.tags ? JSON.parse(row.tags as string) : undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    isDeleted: Boolean(row.is_deleted),
    deletedAt: (row.deleted_at as string | undefined) ?? undefined,
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
  return Promise.all((data as Record<string, unknown>[]).map(mapJournalRow));
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
    query = query.or(`date.lt.${afterDate},and(date.eq.${afterDate},created_at.lt.${afterCreatedAt})`);
  }

  const { data, error } = await query;
  if (error) throw error;
  if (!data?.length) return [];
  return Promise.all((data as Record<string, unknown>[]).map(mapJournalRow));
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
    entry.contentKeywords ? FieldEncryptionService.encryptField(entry.contentKeywords) : Promise.resolve(null),
    entry.contentEmotions ? FieldEncryptionService.encryptField(entry.contentEmotions) : Promise.resolve(null),
    entry.contentSentiment ? FieldEncryptionService.encryptField(entry.contentSentiment) : Promise.resolve(null),
  ]);

  const { error } = await supabase.from('journal_entries').upsert({
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
  }, { onConflict: 'id' });

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
// App settings are not synced to Supabase — they are purely local preferences
// stored in EncryptedAsyncStorage.

import { EncryptedAsyncStorage } from './encryptedAsyncStorage';

const SETTINGS_KEY = '@mysky:app_settings';

export async function getSettings(): Promise<AppSettings | null> {
  try {
    const raw = await EncryptedAsyncStorage.getItem(SETTINGS_KEY);
    return raw ? JSON.parse(raw) : null;
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

async function mapSleepRow(row: Record<string, unknown>): Promise<SleepEntry> {
  const [dreamText, dreamFeelings, dreamMetadata, notes] = await Promise.all([
    row.dream_text_enc ? FieldEncryptionService.decryptField(row.dream_text_enc as string) : Promise.resolve(undefined),
    row.dream_feelings_enc ? FieldEncryptionService.decryptField(row.dream_feelings_enc as string) : Promise.resolve(undefined),
    row.dream_metadata_enc ? FieldEncryptionService.decryptField(row.dream_metadata_enc as string) : Promise.resolve(undefined),
    row.notes_enc ? FieldEncryptionService.decryptField(row.notes_enc as string) : Promise.resolve(undefined),
  ]);
  return {
    id: row.id as string,
    chartId: row.chart_id as string,
    date: row.date as string,
    durationHours: row.duration_hours as number | undefined,
    quality: row.quality as number | undefined,
    dreamText: dreamText && !isDecryptionFailure(dreamText) ? dreamText : undefined,
    dreamMood: (row.dream_mood as string | undefined) ?? undefined,
    dreamFeelings: dreamFeelings && !isDecryptionFailure(dreamFeelings) ? dreamFeelings : undefined,
    dreamMetadata: dreamMetadata && !isDecryptionFailure(dreamMetadata) ? dreamMetadata : undefined,
    notes: notes && !isDecryptionFailure(notes) ? notes : undefined,
    isDeleted: Boolean(row.is_deleted),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function getSleepEntries(chartId: string, limit = 30): Promise<SleepEntry[]> {
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
  return Promise.all((data as Record<string, unknown>[]).map(mapSleepRow));
}

export async function getSleepEntryByDate(chartId: string, date: string): Promise<SleepEntry | null> {
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
  return mapSleepRow(data as Record<string, unknown>);
}

export async function saveSleepEntry(entry: SleepEntry): Promise<void> {
  const userId = await getUserId();
  const [dreamTextEnc, dreamFeelingsEnc, dreamMetadataEnc, notesEnc] = await Promise.all([
    entry.dreamText ? FieldEncryptionService.encryptField(entry.dreamText) : Promise.resolve(null),
    entry.dreamFeelings ? FieldEncryptionService.encryptField(entry.dreamFeelings) : Promise.resolve(null),
    entry.dreamMetadata ? FieldEncryptionService.encryptField(entry.dreamMetadata) : Promise.resolve(null),
    entry.notes ? FieldEncryptionService.encryptField(entry.notes) : Promise.resolve(null),
  ]);

  const { error } = await supabase.from('sleep_entries').upsert({
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
  }, { onConflict: 'id' });

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

async function mapCheckInRow(row: Record<string, unknown>): Promise<DailyCheckIn> {
  const [moodScore, energyLevel, stressLevel, tags, note, wins, challenges] = await Promise.all([
    row.mood_score_enc ? FieldEncryptionService.decryptField(row.mood_score_enc as string) : Promise.resolve(String(row.mood_value ?? '0')),
    row.energy_level_enc ? FieldEncryptionService.decryptField(row.energy_level_enc as string) : Promise.resolve('medium'),
    row.stress_level_enc ? FieldEncryptionService.decryptField(row.stress_level_enc as string) : Promise.resolve('medium'),
    row.tags_enc ? FieldEncryptionService.decryptField(row.tags_enc as string) : Promise.resolve('[]'),
    row.note_enc ? FieldEncryptionService.decryptField(row.note_enc as string) : Promise.resolve(undefined),
    row.wins_enc ? FieldEncryptionService.decryptField(row.wins_enc as string) : Promise.resolve(undefined),
    row.challenges_enc ? FieldEncryptionService.decryptField(row.challenges_enc as string) : Promise.resolve(undefined),
  ]);

  const moodNum = moodScore && !isDecryptionFailure(moodScore) ? Number(moodScore) : 0;

  return {
    id: row.id as string,
    date: (row.log_date ?? row.date) as string,
    chartId: (row.chart_id as string | undefined) ?? '',
    moodScore: Number.isFinite(moodNum) ? moodNum : 0,
    energyLevel: (energyLevel && !isDecryptionFailure(energyLevel) ? energyLevel : 'medium') as DailyCheckIn['energyLevel'],
    stressLevel: (stressLevel && !isDecryptionFailure(stressLevel) ? stressLevel : 'medium') as DailyCheckIn['stressLevel'],
    tags: (() => { try { return JSON.parse((tags && !isDecryptionFailure(tags)) ? tags : '[]'); } catch { return []; } })(),
    note: note && !isDecryptionFailure(note) ? note : undefined,
    wins: wins && !isDecryptionFailure(wins) ? wins : undefined,
    challenges: challenges && !isDecryptionFailure(challenges) ? challenges : undefined,
    moonSign: (row.moon_sign as string | undefined) ?? 'unknown',
    moonHouse: (row.moon_house as number | undefined) ?? 0,
    sunHouse: (row.sun_house as number | undefined) ?? 0,
    transitEvents: row.transit_events ? JSON.parse(row.transit_events as string) : undefined,
    lunarPhase: ((row.lunar_phase as string | undefined) ?? 'unknown') as DailyCheckIn['lunarPhase'],
    retrogrades: row.retrogrades ? JSON.parse(row.retrogrades as string) : undefined,
    timeOfDay: ((row.time_of_day as DailyCheckIn['timeOfDay'] | undefined) ?? 'morning') as DailyCheckIn['timeOfDay'],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function getCheckIns(chartId: string, limit?: number): Promise<DailyCheckIn[]> {
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
  return Promise.all((data as Record<string, unknown>[]).map(mapCheckInRow));
}

export async function getCheckInByDate(date: string, chartId: string): Promise<DailyCheckIn | null> {
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
  return mapCheckInRow(data as Record<string, unknown>);
}

export async function getCheckInsByDate(date: string, chartId: string): Promise<DailyCheckIn[]> {
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
  return Promise.all((data as Record<string, unknown>[]).map(mapCheckInRow));
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
  return mapCheckInRow(data as Record<string, unknown>);
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
  return Promise.all((data as Record<string, unknown>[]).map(mapCheckInRow));
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
  const [moodEnc, energyEnc, stressEnc, tagsEnc, noteEnc, winsEnc, challengesEnc] = await Promise.all([
    FieldEncryptionService.encryptField(String(checkIn.moodScore)),
    FieldEncryptionService.encryptField(checkIn.energyLevel),
    FieldEncryptionService.encryptField(checkIn.stressLevel),
    FieldEncryptionService.encryptField(JSON.stringify(checkIn.tags ?? [])),
    checkIn.note ? FieldEncryptionService.encryptField(checkIn.note) : Promise.resolve(null),
    checkIn.wins ? FieldEncryptionService.encryptField(checkIn.wins) : Promise.resolve(null),
    checkIn.challenges ? FieldEncryptionService.encryptField(checkIn.challenges) : Promise.resolve(null),
  ]);

  const moodNum = Math.max(0, Math.min(10, Math.round(checkIn.moodScore)));

  const { error } = await supabase.from('daily_check_ins').upsert({
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
    transit_events: checkIn.transitEvents ? JSON.stringify(checkIn.transitEvents) : null,
    lunar_phase: checkIn.lunarPhase ?? null,
    retrogrades: checkIn.retrogrades ? JSON.stringify(checkIn.retrogrades) : null,
    time_of_day: checkIn.timeOfDay ?? null,
    created_at: checkIn.createdAt,
    updated_at: checkIn.updatedAt,
  }, { onConflict: 'user_id,log_date,time_of_day' });

  if (error) throw error;
}

// ─── Insight History ──────────────────────────────────────────────────────────

async function mapInsightRow(row: Record<string, unknown>): Promise<SavedInsight> {
  const [greeting, loveHeadline, loveMessage, energyHeadline, energyMessage, growthHeadline, growthMessage, gentleReminder, journalPrompt, signals] = await Promise.all([
    FieldEncryptionService.decryptField(row.greeting_enc as string),
    FieldEncryptionService.decryptField(row.love_headline_enc as string),
    FieldEncryptionService.decryptField(row.love_message_enc as string),
    FieldEncryptionService.decryptField(row.energy_headline_enc as string),
    FieldEncryptionService.decryptField(row.energy_message_enc as string),
    FieldEncryptionService.decryptField(row.growth_headline_enc as string),
    FieldEncryptionService.decryptField(row.growth_message_enc as string),
    FieldEncryptionService.decryptField(row.gentle_reminder_enc as string),
    FieldEncryptionService.decryptField(row.journal_prompt_enc as string),
    row.signals_enc ? FieldEncryptionService.decryptField(row.signals_enc as string) : Promise.resolve(undefined),
  ]);

  const clean = (v: string | undefined) => (v && !isDecryptionFailure(v) ? v : '');

  return {
    id: row.id as string,
    date: row.date as string,
    chartId: row.chart_id as string,
    greeting: clean(greeting),
    loveHeadline: clean(loveHeadline),
    loveMessage: clean(loveMessage),
    energyHeadline: clean(energyHeadline),
    energyMessage: clean(energyMessage),
    growthHeadline: clean(growthHeadline),
    growthMessage: clean(growthMessage),
    gentleReminder: clean(gentleReminder),
    journalPrompt: clean(journalPrompt),
    moonSign: (row.moon_sign as string | undefined) ?? undefined,
    moonPhase: (row.moon_phase as string | undefined) ?? undefined,
    signals: signals && !isDecryptionFailure(signals) ? signals : undefined,
    isFavorite: Boolean(row.is_favorite),
    viewedAt: (row.viewed_at as string | undefined) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function saveInsight(insight: SavedInsight): Promise<void> {
  const userId = await getUserId();
  const [greetingEnc, loveHEnc, loveMEnc, energyHEnc, energyMEnc, growthHEnc, growthMEnc, gentleEnc, journalEnc, signalsEnc] = await Promise.all([
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

  const { error } = await supabase.from('insight_history').upsert({
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
  }, { onConflict: 'id' });

  if (error) throw error;
}

export async function getInsightByDate(date: string, chartId: string): Promise<SavedInsight | null> {
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
  return mapInsightRow(data as Record<string, unknown>);
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
  return mapInsightRow(data as Record<string, unknown>);
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
  return Promise.all((data as Record<string, unknown>[]).map(mapInsightRow));
}

export async function updateInsightFavorite(id: string, isFavorite: boolean): Promise<void> {
  const userId = await getUserId();
  const { error } = await supabase
    .from('insight_history')
    .update({ is_favorite: isFavorite, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function updateInsightViewedAt(id: string, viewedAt: string): Promise<void> {
  const userId = await getUserId();
  const { error } = await supabase
    .from('insight_history')
    .update({ viewed_at: viewedAt, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}

// ─── Relationship Charts ──────────────────────────────────────────────────────

async function mapRelationshipRow(row: Record<string, unknown>): Promise<RelationshipChart> {
  const [name, birthDate, birthTime, birthPlace, latStr, lngStr] = await Promise.all([
    FieldEncryptionService.decryptField(row.name_enc as string),
    FieldEncryptionService.decryptField(row.birth_date_enc as string),
    row.birth_time_enc ? FieldEncryptionService.decryptField(row.birth_time_enc as string) : Promise.resolve(undefined),
    FieldEncryptionService.decryptField(row.birth_place_enc as string),
    FieldEncryptionService.decryptField(row.latitude_enc as string),
    FieldEncryptionService.decryptField(row.longitude_enc as string),
  ]);
  return {
    id: row.id as string,
    name: name && !isDecryptionFailure(name) ? name : '',
    relationship: row.relationship as RelationshipChart['relationship'],
    birthDate: birthDate && !isDecryptionFailure(birthDate) ? birthDate : '',
    birthTime: birthTime && !isDecryptionFailure(birthTime) ? birthTime : undefined,
    hasUnknownTime: Boolean(row.has_unknown_time),
    birthPlace: birthPlace && !isDecryptionFailure(birthPlace) ? birthPlace : '',
    latitude: parseCoord(latStr, 'latitude', row.id as string),
    longitude: parseCoord(lngStr, 'longitude', row.id as string),
    timezone: (row.timezone as string | undefined) ?? undefined,
    userChartId: row.user_chart_id as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    isDeleted: Boolean(row.is_deleted),
    deletedAt: (row.deleted_at as string | undefined) ?? undefined,
  };
}

export async function getRelationshipCharts(userChartId?: string): Promise<RelationshipChart[]> {
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
  return Promise.all((data as Record<string, unknown>[]).map(mapRelationshipRow));
}

export async function getRelationshipChartById(id: string): Promise<RelationshipChart | null> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('relationship_charts')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapRelationshipRow(data as Record<string, unknown>);
}

export async function saveRelationshipChart(chart: RelationshipChart): Promise<void> {
  const userId = await getUserId();
  const [nameEnc, birthDateEnc, birthTimeEnc, birthPlaceEnc, latEnc, lngEnc] = await Promise.all([
    FieldEncryptionService.encryptField(chart.name),
    FieldEncryptionService.encryptField(chart.birthDate),
    chart.birthTime ? FieldEncryptionService.encryptField(chart.birthTime) : Promise.resolve(null),
    FieldEncryptionService.encryptField(chart.birthPlace),
    FieldEncryptionService.encryptField(String(chart.latitude)),
    FieldEncryptionService.encryptField(String(chart.longitude)),
  ]);

  const { error } = await supabase.from('relationship_charts').upsert({
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
  }, { onConflict: 'id' });

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

export async function getRelationshipChartCount(userChartId?: string): Promise<number> {
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

/**
 * Clears local non-Supabase state (AsyncStorage keys) on sign-out.
 * Supabase rows are owned by the user and governed by RLS — they are not
 * deleted here. Account deletion goes through a dedicated server-side flow.
 */
export async function clearAccountScopedData(): Promise<void> {
  try {
    await EncryptedAsyncStorage.removeItem(SETTINGS_KEY);
  } catch {}
}

// ─── No-op stubs kept for call-site compatibility ─────────────────────────────
// These were SQLite-only concerns that no longer apply.

/** No-op: DB initialization is handled by Supabase session management. */
export async function initialize(): Promise<void> {}

/** No-op: No local DB to switch — Supabase is always the source of truth. */
export async function switchToUserDb(_userId: string): Promise<void> {}

/** No-op: No sync queue in network-first architecture. */
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
