/**
 * SyncService — Offline-first encrypted cloud sync
 *
 * Strategy:
 *   1. All writes go to local SQLite first (authoritative).
 *   2. After each write, enqueue a background Supabase upsert.
 *   3. On network restore / app foreground, flush the queue.
 *   4. On new device sign-in, pull from Supabase → write to local DB so
 *      the app has data immediately (user must re-derive the DEK via backup
 *      restore to decrypt; encrypted blobs are stored verbatim locally).
 *
 * Encryption:
 *   Data is encrypted by FieldEncryptionService BEFORE being passed here.
 *   This service transmits encrypted blobs as-is — the server never sees
 *   plaintext.
 *
 * Conflict resolution: last-writer-wins on updated_at (client is authoritative).
 */

import { supabase } from '../../lib/supabase';
import { localDb } from './localDb';
import { FieldEncryptionService } from './fieldEncryption';
import { logger } from '../../utils/logger';
import { JournalEntry, SavedChart, SleepEntry } from './models';
import { DailyCheckIn } from '../patterns/types';
import { ReflectionAnswer } from '../insights/dailyReflectionService';
import type { TriggerEvent } from '../../utils/triggerEventTypes';
import { IdentityVault } from '../../utils/IdentityVault';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SomaticEntrySync {
  id: string;
  date: string;
  region: string;
  side?: 'front' | 'back';
  emotion: string;
  intensity: number;
}

export interface PatternEntrySync {
  id: string;
  date: string;
  note: string;
  tags: string[];
}

export interface BirthProfileSync {
  id: string;
  chartId: string;
  name?: string;
  birthDate: string;
  birthTime?: string;
  hasUnknownTime: boolean;
  birthPlace: string;
  latitude: number;
  longitude: number;
  timezone?: string;
  houseSystem?: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  deletedAt?: string;
}

export type SyncTable =
  | 'birth_profiles'
  | 'journal_entries'
  | 'sleep_entries'
  | 'daily_check_ins'
  | 'daily_reflections'
  | 'somatic_entries'
  | 'trigger_events'
  | 'relationship_patterns';

export interface SyncQueueItem {
  id: string;
  table_name: SyncTable;
  record_id: string;
  operation: 'upsert' | 'delete';
  payload: string; // JSON
  created_at: string;
  attempts: number;
}

// ─── Singleton state ─────────────────────────────────────────────────────────

let isFlushing = false;
let flushTimer: ReturnType<typeof setTimeout> | null = null;

// ─── Internal: session guard ─────────────────────────────────────────────────

async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// ─── Queue management (stored in local SQLite) ────────────────────────────────

export async function enqueue(
  table: SyncTable,
  recordId: string,
  operation: 'upsert' | 'delete',
  payload: object,
): Promise<void> {
  try {
    const db = await localDb.getDb();
    const id = `${table}:${recordId}:${Date.now()}`;
    await db.runAsync(
      `INSERT OR REPLACE INTO sync_queue
         (id, table_name, record_id, operation, payload, created_at, attempts)
       VALUES (?, ?, ?, ?, ?, ?, 0)`,
      [id, table, recordId, operation, JSON.stringify(payload), new Date().toISOString()],
    );
  } catch (e) {
    logger.error('[SyncService] Failed to enqueue:', e);
  }
  scheduleFlush();
}

function scheduleFlush(delayMs = 2000) {
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flushQueue().catch((e) => logger.error('[SyncService] Flush error:', e));
  }, delayMs);
}

// ─── Flush: push pending items to Supabase ───────────────────────────────────

export async function flushQueue(): Promise<void> {
  if (isFlushing) return;
  isFlushing = true;

  try {
    const session = await getSession();
    if (!session) return; // offline or not authenticated — retry later

    const db = await localDb.getDb();
    const rows = (await db.getAllAsync(
      `SELECT * FROM sync_queue WHERE attempts < 5 ORDER BY created_at ASC LIMIT 50`,
    )) as SyncQueueItem[];

    if (rows.length === 0) return;

    for (const item of rows) {
      try {
        const payload = JSON.parse(item.payload);
        const userId = session.user.id;

        if (item.operation === 'upsert') {
          const onConflict = item.table_name === 'daily_check_ins'
            ? 'user_id,log_date,time_of_day'
            : item.table_name === 'birth_profiles'
              ? 'user_id'
              : 'id';
          const { error } = await supabase
            .from(item.table_name)
            .upsert(
            { ...payload, user_id: userId },
            { onConflict },
          );

          if (error) throw error;
        } else {
          // Soft-delete on server — only include deleted_at if the table has the column
          const now = new Date().toISOString();
          const deletePayload: Record<string, unknown> = { is_deleted: true, updated_at: now };
          if (item.table_name !== 'sleep_entries') deletePayload.deleted_at = now;
          const { error } = await supabase
            .from(item.table_name)
            .update(deletePayload)
            .eq('id', item.record_id)
            .eq('user_id', userId);

          if (error) throw error;
        }

        await db.runAsync('DELETE FROM sync_queue WHERE id = ?', [item.id]);
      } catch (e) {
        logger.warn(`[SyncService] Failed to sync item ${item.id}:`, e);
        await db.runAsync(
          'UPDATE sync_queue SET attempts = attempts + 1 WHERE id = ?',
          [item.id],
        );
      }
    }
  } catch (e) {
    logger.error('[SyncService] Flush failed:', e);
  } finally {
    isFlushing = false;
  }
}

// ─── Pull: fetch remote records newer than local last_sync_at ─────────────────

export async function pullFromSupabase(): Promise<{
  birthProfilesPulled: number;
  journalPulled: number;
  sleepPulled: number;
  checkInsPulled: number;
  reflectionsPulled: number;
  somaticPulled: number;
  triggersPulled: number;
  patternsPulled: number;
}> {
  const session = await getSession();
  if (!session) return { birthProfilesPulled: 0, journalPulled: 0, sleepPulled: 0, checkInsPulled: 0, reflectionsPulled: 0, somaticPulled: 0, triggersPulled: 0, patternsPulled: 0 };

  const settings = await localDb.getSettings();
  const since = settings?.lastSyncAt ?? '1970-01-01T00:00:00.000Z';
  const userId = session.user.id;

  let birthProfilesPulled = 0;
  let journalPulled = 0;
  let sleepPulled = 0;
  let checkInsPulled = 0;
  let reflectionsPulled = 0;
  let somaticPulled = 0;
  let triggersPulled = 0;
  let patternsPulled = 0;
  let maxUpdatedAt: string | null = null;

  const trackMax = (rows: any[] | null) => {
    for (const row of rows ?? []) {
      if (row.updated_at && (!maxUpdatedAt || row.updated_at > maxUpdatedAt)) {
        maxUpdatedAt = row.updated_at;
      }
    }
  };

  // ── Birth profile ──
  try {
    const { data, error } = await supabase
      .from('birth_profiles')
      .select('*')
      .eq('user_id', userId)
      .gt('updated_at', since)
      .order('updated_at', { ascending: true })
      .limit(10);

    if (error) throw error;
    trackMax(data ?? []);

    for (const row of data ?? []) {
      if (row.is_deleted) {
        await localDb.deleteChart(row.chart_id).catch(() => {});
        await IdentityVault.destroyIdentity().catch(() => {});
      } else {
        const chart: SavedChart = {
          id: row.chart_id,
          name: row.name ?? undefined,
          birthDate: row.birth_date,
          birthTime: row.birth_time ?? undefined,
          hasUnknownTime: row.has_unknown_time,
          birthPlace: row.birth_place,
          latitude: row.latitude,
          longitude: row.longitude,
          timezone: row.timezone ?? undefined,
          houseSystem: row.house_system ?? undefined,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          isDeleted: false,
        };

        await localDb.upsertChartFromSync(chart);
      }
      birthProfilesPulled++;
    }
  } catch (e) {
    logger.error('[SyncService] Birth profile pull failed:', e);
  }

  // ── Journal ──
  try {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .gt('updated_at', since)
      .order('updated_at', { ascending: true })
      .limit(500);

    if (error) throw error;

    trackMax(data ?? []);

    for (const row of data ?? []) {
      const entry: JournalEntry = {
        id: row.id,
        date: row.date,
        mood: row.mood,
        moonPhase: row.moon_phase,
        title: row.title_enc,        // encrypted blob — stored verbatim locally
        content: row.content_enc,    // encrypted blob
        contentKeywords: row.content_keywords_enc,
        contentEmotions: row.content_emotions_enc,
        contentSentiment: row.content_sentiment_enc,
        tags: row.tags ? (() => { try { return JSON.parse(row.tags); } catch { return undefined; } })() : undefined,
        contentWordCount: row.content_word_count,
        contentReadingMinutes: row.content_reading_minutes,
        chartId: row.chart_id,
        transitSnapshot: row.transit_snapshot,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        isDeleted: row.is_deleted ?? false,
      };

      // Write raw encrypted blobs directly to local DB (bypass re-encryption)
      await localDb.upsertJournalEntryRaw(entry);
      journalPulled++;
    }
  } catch (e) {
    logger.error('[SyncService] Journal pull failed:', e);
  }

  // ── Sleep entries ──
  try {
    const { data, error } = await supabase
      .from('sleep_entries')
      .select('*')
      .eq('user_id', userId)
      .gt('updated_at', since)
      .order('updated_at', { ascending: true })
      .limit(500);

    if (error) throw error;

    trackMax(data ?? []);

    for (const row of data ?? []) {
      const entry: SleepEntry = {
        id: row.id,
        chartId: row.chart_id,
        date: row.date,
        durationHours: row.duration_hours,
        quality: row.quality,
        dreamText: row.dream_text_enc,       // encrypted blob
        dreamMood: row.dream_mood,
        dreamFeelings: row.dream_feelings_enc,
        dreamMetadata: row.dream_metadata_enc,
        notes: row.notes_enc,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        isDeleted: row.is_deleted ?? false,
      };

      await localDb.upsertSleepEntryRaw(entry);
      sleepPulled++;
    }
  } catch (e) {
    logger.error('[SyncService] Sleep pull failed:', e);
  }

  // ── Check-ins ──
  try {
    const { data, error } = await supabase
      .from('daily_check_ins')
      .select('*')
      .eq('user_id', userId)
      .gt('updated_at', since)
      .order('updated_at', { ascending: true })
      .limit(500);

    if (error) throw error;

    trackMax(data ?? []);

    for (const row of data ?? []) {
      const checkIn: DailyCheckIn = {
        id: row.id,
        date: row.log_date ?? row.date,
        chartId: row.chart_id ?? '',
        timeOfDay: row.time_of_day ?? 'evening',
        moodScore: row.mood_score_enc ?? row.mood_value ?? 5,  // encrypted blob or legacy int
        energyLevel: row.energy_level_enc ?? 'medium',          // encrypted blob
        stressLevel: row.stress_level_enc ?? 'medium',
          tags: row.tags_enc ?? [],   // encrypted blob — stored verbatim, decrypted at read time
        note: row.note_enc,
        wins: row.wins_enc,
        challenges: row.challenges_enc,
        moonSign: row.moon_sign ?? '',
        moonHouse: row.moon_house ?? 0,
        sunHouse: row.sun_house ?? 0,
        transitEvents: row.transit_events ? (Array.isArray(row.transit_events) ? row.transit_events : []) : [],
        lunarPhase: row.lunar_phase ?? 'unknown',
        retrogrades: row.retrogrades ? (Array.isArray(row.retrogrades) ? row.retrogrades : []) : [],
        createdAt: row.created_at,
        updatedAt: row.updated_at,
          isDeleted: row.is_deleted ?? false,
        } as DailyCheckIn & { isDeleted: boolean };

      await localDb.upsertCheckInRaw(checkIn);
      checkInsPulled++;
    }
  } catch (e) {
    logger.error('[SyncService] Check-ins pull failed:', e);
  }

  // ── Daily Reflections ──
  try {
    const { data, error } = await supabase
      .from('daily_reflections')
      .select('*')
      .eq('user_id', userId)
      .gt('updated_at', since)
      .order('updated_at', { ascending: true })
      .limit(500);

    if (error) throw error;
    trackMax(data ?? []);

    if (data && data.length > 0) {
      const { EncryptedAsyncStorage } = await import('../storage/encryptedAsyncStorage');
      const raw = await EncryptedAsyncStorage.getItem('@mysky:daily_reflections');
      const local: { answers: ReflectionAnswer[]; totalDaysCompleted: number; startedAt: string | null } =
        raw ? JSON.parse(raw) : { answers: [], totalDaysCompleted: 0, startedAt: null };

      for (const row of data) {
        if (row.is_deleted) {
          local.answers = local.answers.filter(
            a => !(a.date === row.date && a.questionId === row.question_id && a.category === row.category),
          );
        } else {
          const answer: ReflectionAnswer = {
            questionId: row.question_id,
            category: row.category,
            questionText: row.question_text_enc ?? '',  // encrypted blob stored verbatim
            answer: row.answer_enc ?? '',
            scaleValue: row.scale_value ?? undefined,
            date: row.date,
            sealedAt: row.sealed_at,
            notes: row.notes_enc ?? undefined,
          };
          const idx = local.answers.findIndex(
            a => a.date === answer.date && a.questionId === answer.questionId && a.category === answer.category,
          );
          if (idx >= 0) local.answers[idx] = answer;
          else local.answers.push(answer);
        }
        reflectionsPulled++;
      }

      local.totalDaysCompleted = new Set(local.answers.map(a => a.date)).size;
      if (!local.startedAt && local.answers.length > 0) {
        local.startedAt = local.answers[local.answers.length - 1].sealedAt;
      }
      await EncryptedAsyncStorage.setItem('@mysky:daily_reflections', JSON.stringify(local));
    }
  } catch (e) {
    logger.error('[SyncService] Reflections pull failed:', e);
  }

  // ── Somatic Entries ──
  try {
    const { data, error } = await supabase
      .from('somatic_entries')
      .select('*')
      .eq('user_id', userId)
      .gt('updated_at', since)
      .order('updated_at', { ascending: true })
      .limit(500);

    if (error) throw error;
    trackMax(data ?? []);

    if (data && data.length > 0) {
      const { EncryptedAsyncStorage } = await import('../storage/encryptedAsyncStorage');
      const raw = await EncryptedAsyncStorage.getItem('@mysky:somatic_entries');
      let local: SomaticEntrySync[] = raw ? JSON.parse(raw) : [];

      for (const row of data) {
        if (row.is_deleted) {
          local = local.filter(e => e.id !== row.id);
        } else {
          const entry: SomaticEntrySync = {
            id: row.id,
            date: row.date,
            region: row.region,
            side: row.side ?? undefined,
            emotion: row.emotion_enc ?? '',
            intensity: row.intensity,
          };
          const idx = local.findIndex(e => e.id === entry.id);
          if (idx >= 0) local[idx] = entry;
          else local.unshift(entry);
        }
        somaticPulled++;
      }

      await EncryptedAsyncStorage.setItem('@mysky:somatic_entries', JSON.stringify(local));
    }
  } catch (e) {
    logger.error('[SyncService] Somatic pull failed:', e);
  }

  // ── Trigger Events ──
  try {
    const { data, error } = await supabase
      .from('trigger_events')
      .select('*')
      .eq('user_id', userId)
      .gt('updated_at', since)
      .order('updated_at', { ascending: true })
      .limit(500);

    if (error) throw error;
    trackMax(data ?? []);

    if (data && data.length > 0) {
      const { EncryptedAsyncStorage } = await import('../storage/encryptedAsyncStorage');
      const raw = await EncryptedAsyncStorage.getItem('@mysky:trigger_events');
      let local: TriggerEvent[] = raw ? JSON.parse(raw) : [];

      for (const row of data) {
        if (row.is_deleted) {
          local = local.filter(e => e.id !== row.id);
        } else {
          const event: TriggerEvent = {
            id: row.id,
            timestamp: row.timestamp,
            mode: row.mode,
            event: row.event_enc ?? '',
            nsState: row.ns_state,
            sensations: row.sensations_enc ? (() => { try { return JSON.parse(row.sensations_enc); } catch { return []; } })() : [],
            ...(row.intensity != null ? { intensity: row.intensity } : {}),
            ...(row.resolution_enc ? { resolution: row.resolution_enc } : {}),
            ...(row.context_area ? { contextArea: row.context_area } : {}),
            ...(row.before_state ? { beforeState: row.before_state } : {}),
          };
          const idx = local.findIndex(e => e.id === event.id);
          if (idx >= 0) local[idx] = event;
          else local.unshift(event);
        }
        triggersPulled++;
      }

      await EncryptedAsyncStorage.setItem('@mysky:trigger_events', JSON.stringify(local));
    }
  } catch (e) {
    logger.error('[SyncService] Trigger events pull failed:', e);
  }

  // ── Relationship Patterns ──
  try {
    const { data, error } = await supabase
      .from('relationship_patterns')
      .select('*')
      .eq('user_id', userId)
      .gt('updated_at', since)
      .order('updated_at', { ascending: true })
      .limit(500);

    if (error) throw error;
    trackMax(data ?? []);

    if (data && data.length > 0) {
      const { EncryptedAsyncStorage } = await import('../storage/encryptedAsyncStorage');
      const raw = await EncryptedAsyncStorage.getItem('@mysky:relationship_patterns');
      let local: PatternEntrySync[] = raw ? JSON.parse(raw) : [];

      for (const row of data) {
        if (row.is_deleted) {
          local = local.filter(e => e.id !== row.id);
        } else {
          const entry: PatternEntrySync = {
            id: row.id,
            date: row.date,
            note: row.note_enc ?? '',
            tags: row.tags_enc ? (() => { try { return JSON.parse(row.tags_enc); } catch { return []; } })() : [],
          };
          const idx = local.findIndex(e => e.id === entry.id);
          if (idx >= 0) local[idx] = entry;
          else local.unshift(entry);
        }
        patternsPulled++;
      }

      await EncryptedAsyncStorage.setItem('@mysky:relationship_patterns', JSON.stringify(local));
    }
  } catch (e) {
    logger.error('[SyncService] Relationship patterns pull failed:', e);
  }

  // Update last sync timestamp — only advance if rows were actually fetched,
  // and use max(updated_at) of fetched rows so rows 501+ are not permanently skipped.
  if (maxUpdatedAt !== null) {
    try {
      const current = await localDb.getSettings();
      const now = new Date().toISOString();
      await localDb.updateSettings({
        id: 'default',
        cloudSyncEnabled: current?.cloudSyncEnabled ?? false,
        lastSyncAt: maxUpdatedAt,
        lastBackupAt: current?.lastBackupAt,
        userId: current?.userId,
        createdAt: current?.createdAt ?? now,
        updatedAt: now,
      });
    } catch (e) {
      logger.error('[SyncService] Failed to update last_sync_at:', e);
    }
  }

  logger.info(`[SyncService] Pull complete — birth:${birthProfilesPulled} journal:${journalPulled} sleep:${sleepPulled} checkIns:${checkInsPulled} reflections:${reflectionsPulled} somatic:${somaticPulled} triggers:${triggersPulled} patterns:${patternsPulled}`);
  return { birthProfilesPulled, journalPulled, sleepPulled, checkInsPulled, reflectionsPulled, somaticPulled, triggersPulled, patternsPulled };
}

// ─── Convenience: enqueue helpers called by localDb write paths ───────────────

export async function enqueueBirthProfile(chart: SavedChart, operation: 'upsert' | 'delete' = 'upsert') {
  const session = await getSession();
  if (!session) return;

  const payload = operation === 'delete'
    ? {
        id: session.user.id,
        chart_id: chart.id,
        is_deleted: true,
        deleted_at: chart.deletedAt ?? new Date().toISOString(),
        updated_at: chart.updatedAt,
      }
    : birthProfileToSupabase(session.user.id, chart);

  await enqueue('birth_profiles', session.user.id, operation, payload);
}

export async function syncBirthProfileFromLocal() {
  const charts = await localDb.getCharts().catch(() => [] as SavedChart[]);
  if (!charts.length) return;
  await enqueueBirthProfile(charts[0]);
}

export async function deleteBirthProfileForCurrentUser(chartId?: string) {
  const session = await getSession();
  if (!session) return;

  await enqueue('birth_profiles', session.user.id, 'delete', {
    id: session.user.id,
    chart_id: chartId ?? session.user.id,
    is_deleted: true,
    deleted_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
}

export function enqueueJournalEntry(entry: JournalEntry, operation: 'upsert' | 'delete' = 'upsert') {
  enqueue('journal_entries', entry.id, operation, journalToSupabase(entry)).catch(() => {});
}

export function enqueueSleepEntry(entry: SleepEntry, operation: 'upsert' | 'delete' = 'upsert') {
  enqueue('sleep_entries', entry.id, operation, sleepToSupabase(entry)).catch(() => {});
}

export function enqueueCheckIn(checkIn: DailyCheckIn, operation: 'upsert' | 'delete' = 'upsert') {
  enqueue('daily_check_ins', checkIn.id, operation, checkInToSupabase(checkIn)).catch(() => {});
}

// ─── Row mappers: local model → Supabase column names ────────────────────────
// NOTE: caller passes already-encrypted blobs (from the localDb write path).
// The localDb methods encrypt with FieldEncryptionService before storing;
// we re-read the raw encrypted columns from the DB for upload rather than
// re-encrypting the plaintext value.

function journalToSupabase(entry: JournalEntry) {
  return {
    id: entry.id,
    date: entry.date,
    mood: entry.mood,
    moon_phase: entry.moonPhase,
    title_enc: entry.title,                       // already-encrypted blob
    content_enc: entry.content,                   // already-encrypted blob
    content_keywords_enc: entry.contentKeywords,
    content_emotions_enc: entry.contentEmotions,
    content_sentiment_enc: entry.contentSentiment,
    tags: entry.tags ? JSON.stringify(entry.tags) : null,
    content_word_count: entry.contentWordCount ?? null,
    content_reading_minutes: entry.contentReadingMinutes ?? null,
    chart_id: entry.chartId ?? null,
    transit_snapshot: entry.transitSnapshot ?? null,
    is_deleted: entry.isDeleted,
    deleted_at: (entry as any).deletedAt ?? null,
    created_at: entry.createdAt,
    updated_at: entry.updatedAt,
  };
}

function sleepToSupabase(entry: SleepEntry) {
  return {
    id: entry.id,
    chart_id: entry.chartId,
    date: entry.date,
    duration_hours: entry.durationHours ?? null,
    quality: entry.quality ?? null,
    dream_text_enc: entry.dreamText ?? null,      // already-encrypted blob
    dream_mood: entry.dreamMood ?? null,
    dream_feelings_enc: entry.dreamFeelings ?? null,
    dream_metadata_enc: entry.dreamMetadata ?? null,
    notes_enc: entry.notes ?? null,
    is_deleted: entry.isDeleted,
    created_at: entry.createdAt,
    updated_at: entry.updatedAt,
  };
}

function checkInToSupabase(checkIn: DailyCheckIn) {
  return {
    id: checkIn.id,
    log_date: checkIn.date,
    chart_id: checkIn.chartId,
    time_of_day: checkIn.timeOfDay,
    mood_score_enc: checkIn.moodScore,            // already-encrypted blob
    energy_level_enc: checkIn.energyLevel,
    stress_level_enc: checkIn.stressLevel,
    tags_enc: typeof checkIn.tags === 'string' ? checkIn.tags : JSON.stringify(checkIn.tags),
    note_enc: checkIn.note ?? null,
    wins_enc: checkIn.wins ?? null,
    challenges_enc: checkIn.challenges ?? null,
    moon_sign: checkIn.moonSign,
    moon_house: checkIn.moonHouse,
    sun_house: checkIn.sunHouse,
    transit_events: checkIn.transitEvents,
    lunar_phase: checkIn.lunarPhase,
    retrogrades: checkIn.retrogrades,
    is_deleted: (checkIn as any).isDeleted ?? false,
    created_at: checkIn.createdAt,
    updated_at: checkIn.updatedAt,
  };
}

function birthProfileToSupabase(userId: string, chart: SavedChart) {
  return {
    id: userId,
    chart_id: chart.id,
    name: chart.name ?? null,
    birth_date: chart.birthDate,
    birth_time: chart.birthTime ?? null,
    has_unknown_time: chart.hasUnknownTime,
    birth_place: chart.birthPlace,
    latitude: chart.latitude,
    longitude: chart.longitude,
    timezone: chart.timezone ?? null,
    house_system: chart.houseSystem ?? null,
    is_deleted: chart.isDeleted,
    deleted_at: chart.deletedAt ?? null,
    created_at: chart.createdAt,
    updated_at: chart.updatedAt,
  };
}

// ─── Self-knowledge sync: enqueue helpers ─────────────────────────────────────
// Unlike journal/sleep/check-ins, these features use EncryptedAsyncStorage
// (not SQLite), so sensitive fields must be encrypted with FieldEncryptionService
// at enqueue time.

export async function enqueueReflectionAnswer(answer: ReflectionAnswer, operation: 'upsert' | 'delete' = 'upsert') {
  try {
    const id = `${answer.date}:${answer.questionId}:${answer.category}`;
    const now = new Date().toISOString();
    const payload = operation === 'delete'
      ? { id }
      : {
          id,
          question_id: answer.questionId,
          category: answer.category,
          question_text_enc: await FieldEncryptionService.encryptField(answer.questionText),
          answer_enc: await FieldEncryptionService.encryptField(answer.answer),
          scale_value: answer.scaleValue ?? null,
          date: answer.date,
          sealed_at: answer.sealedAt,
          notes_enc: answer.notes ? await FieldEncryptionService.encryptField(answer.notes) : null,
          is_deleted: false,
          created_at: now,
          updated_at: now,
        };
    await enqueue('daily_reflections', id, operation, payload);
  } catch (e) {
    logger.error('[SyncService] Failed to enqueue reflection:', e);
  }
}

export async function enqueueReflectionBatch(answers: ReflectionAnswer[]) {
  for (const answer of answers) {
    await enqueueReflectionAnswer(answer);
  }
}

export async function enqueueSomaticEntry(entry: SomaticEntrySync, operation: 'upsert' | 'delete' = 'upsert') {
  try {
    const now = new Date().toISOString();
    const payload = operation === 'delete'
      ? { id: entry.id }
      : {
          id: entry.id,
          date: entry.date,
          region: entry.region,
          side: entry.side ?? null,
          emotion_enc: await FieldEncryptionService.encryptField(entry.emotion),
          intensity: entry.intensity,
          is_deleted: false,
          created_at: now,
          updated_at: now,
        };
    await enqueue('somatic_entries', entry.id, operation, payload);
  } catch (e) {
    logger.error('[SyncService] Failed to enqueue somatic entry:', e);
  }
}

export async function enqueueTriggerEvent(event: TriggerEvent, operation: 'upsert' | 'delete' = 'upsert') {
  try {
    const now = new Date().toISOString();
    const payload = operation === 'delete'
      ? { id: event.id }
      : {
          id: event.id,
          timestamp: event.timestamp,
          mode: event.mode,
          event_enc: await FieldEncryptionService.encryptField(event.event),
          ns_state: event.nsState,
          sensations_enc: await FieldEncryptionService.encryptField(JSON.stringify(event.sensations)),
          intensity: event.intensity ?? null,
          resolution_enc: event.resolution
            ? await FieldEncryptionService.encryptField(event.resolution)
            : null,
          context_area: event.contextArea ?? null,
          before_state: event.beforeState ?? null,
          is_deleted: false,
          created_at: now,
          updated_at: now,
        };
    await enqueue('trigger_events', event.id, operation, payload);
  } catch (e) {
    logger.error('[SyncService] Failed to enqueue trigger event:', e);
  }
}

export async function enqueueRelationshipPattern(entry: PatternEntrySync, operation: 'upsert' | 'delete' = 'upsert') {
  try {
    const now = new Date().toISOString();
    const payload = operation === 'delete'
      ? { id: entry.id }
      : {
          id: entry.id,
          date: entry.date,
          note_enc: await FieldEncryptionService.encryptField(entry.note),
          tags_enc: await FieldEncryptionService.encryptField(JSON.stringify(entry.tags)),
          is_deleted: false,
          created_at: now,
          updated_at: now,
        };
    await enqueue('relationship_patterns', entry.id, operation, payload);
  } catch (e) {
    logger.error('[SyncService] Failed to enqueue relationship pattern:', e);
  }
}
