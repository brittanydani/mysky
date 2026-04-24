/**
 * SyncService — queue and cache coordination
 *
 * Architecture:
 *   1. Supabase is the canonical store for core app content.
 *   2. Local SQLite is used only for queueing pending writes and optional cache.
 *   3. When the device is offline, writes are queued locally.
 *   4. On connectivity/app resume, queued writes are flushed to Supabase.
 *
 * Core app content is transmitted as plaintext over TLS and stored in plaintext
 * server columns protected by RLS. Some non-core local-only/self-knowledge
 * payloads still use existing encrypted storage helpers until those flows are
 * migrated separately.
 */

import { supabase } from '../../lib/supabase';
import { localDb } from './localDb';
import { FieldEncryptionService } from './fieldEncryption';
import { logger } from '../../utils/logger';
import { JournalEntry, SavedChart, SleepEntry } from './models';
import { DailyCheckIn } from '../patterns/types';
import { ReflectionAnswer } from '../insights/dailyReflectionService';
import type { TriggerEvent } from '../../utils/triggerEventTypes';

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
  createdAt?: string;
  updatedAt: string;
  isDeleted: boolean;
  name?: string;
  birthDate: string;
  birthTime?: string;
  hasUnknownTime: boolean;
  birthPlace: string;
  latitude: number;
  longitude: number;
  timezone?: string;
  houseSystem?: string;
  deletedAt?: string;
}

interface BirthProfileFunctionResponse {
  profile: BirthProfileSync | null;
}

interface NamedError {
  name?: string;
  message?: string;
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
let didWarnBirthProfileSyncUnavailable = false;

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function clampMoodValue(value: number): number {
  return Math.max(0, Math.min(10, Math.round(value)));
}

async function normalizeDailyCheckInPayload(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  const normalized = { ...payload };
  delete normalized.id;

  const explicitMoodValue = normalized.mood_value;
  if (typeof explicitMoodValue === 'number' && Number.isFinite(explicitMoodValue)) {
    normalized.mood_value = clampMoodValue(explicitMoodValue);
    return normalized;
  }

  const directMoodScore = normalized.moodScore;
  if (typeof directMoodScore === 'number' && Number.isFinite(directMoodScore)) {
    normalized.mood_value = clampMoodValue(directMoodScore);
    return normalized;
  }

  const plainMoodScore = normalized.mood_score;
  if (typeof plainMoodScore === 'number' && Number.isFinite(plainMoodScore)) {
    normalized.mood_value = clampMoodValue(plainMoodScore);
    return normalized;
  }

  return normalized;
}

// ─── Internal: session guard ─────────────────────────────────────────────────

async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export function isBirthProfileSyncUnavailableError(error: unknown): boolean {
  const candidate = error as NamedError | null;
  return candidate?.name === 'FunctionsHttpError'
    || candidate?.message?.includes('non-2xx status code') === true;
}

export function warnBirthProfileSyncUnavailable(error: unknown) {
  if (didWarnBirthProfileSyncUnavailable) return;
  didWarnBirthProfileSyncUnavailable = true;
  logger.warn(
    '[SyncService] Birth profile Edge Function is unavailable or misconfigured; skipping remote birth profile reads for this session.',
    error,
  );
}

export async function invokeBirthProfileSync(
  action: 'getLatest' | 'upsert' | 'delete',
  payload: Record<string, unknown> = {},
  options: { swallowUnavailableReadError?: boolean } = {},
): Promise<BirthProfileFunctionResponse> {
  const { swallowUnavailableReadError = true } = options;
  const { data, error } = await supabase.functions.invoke('birth-profile-sync', {
    body: { action, ...payload },
  });

  if (error) {
    if (
      action === 'getLatest'
      && swallowUnavailableReadError
      && isBirthProfileSyncUnavailableError(error)
    ) {
      warnBirthProfileSyncUnavailable(error);
      return { profile: null };
    }
    throw error;
  }
  return (data ?? { profile: null }) as BirthProfileFunctionResponse;
}

import * as Crypto from 'expo-crypto';

// ─── Queue management (stored in local SQLite) ────────────────────────────────

export async function enqueue(
  table: SyncTable,
  recordId: string,
  operation: 'upsert' | 'delete',
  payload: object,
): Promise<void> {
  try {
    const db = await localDb.getDb();
    const id = `${table}:${recordId}:${Crypto.randomUUID()}`;
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
  (flushTimer as unknown as { unref?: () => void }).unref?.();
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

        if (item.table_name === 'birth_profiles') {
          if (item.operation === 'upsert') {
            await invokeBirthProfileSync('upsert', { profile: payload });
          } else {
            await invokeBirthProfileSync('delete', {
              chartId: payload.chartId ?? payload.chart_id ?? null,
              updatedAt: payload.updatedAt ?? payload.updated_at ?? new Date().toISOString(),
              deletedAt: payload.deletedAt ?? payload.deleted_at ?? null,
            });
          }

          await db.runAsync('DELETE FROM sync_queue WHERE id = ?', [item.id]);
          continue;
        }

        if (item.operation === 'upsert') {
          const normalizedPayload = item.table_name === 'daily_check_ins'
            ? await normalizeDailyCheckInPayload(payload)
            : payload;
          const onConflict = item.table_name === 'daily_check_ins'
            ? 'user_id,log_date,time_of_day'
            : 'id';
          const { error } = await supabase
            .from(item.table_name)
            .upsert(
            { ...normalizedPayload, user_id: userId },
            { onConflict },
          );

          if (error) throw error;
        } else {
          // Soft-delete on server — only include deleted_at if the table has the column
          const now = new Date().toISOString();
          const deletePayload: Record<string, unknown> = { is_deleted: true, updated_at: now };
          const tablesWithDeletedAt = new Set<SyncTable>(['journal_entries', 'daily_check_ins', 'birth_profiles']);
          if (tablesWithDeletedAt.has(item.table_name)) deletePayload.deleted_at = now;
          let deleteQuery = supabase
            .from(item.table_name)
            .update(deletePayload)
            .eq('user_id', userId);

          if (item.table_name === 'daily_check_ins') {
            const logDate = typeof payload.log_date === 'string' ? payload.log_date : null;
            const timeOfDay = typeof payload.time_of_day === 'string' ? payload.time_of_day : null;
            const chartId = typeof payload.chart_id === 'string' ? payload.chart_id : null;

            if (logDate && timeOfDay) {
              deleteQuery = deleteQuery.eq('log_date', logDate).eq('time_of_day', timeOfDay);
              if (chartId) deleteQuery = deleteQuery.eq('chart_id', chartId);
            } else if (isUuid(item.record_id)) {
              deleteQuery = deleteQuery.eq('id', item.record_id);
            } else {
              throw new Error(
                `Cannot sync deleted daily check-in without composite key fields or UUID id: ${item.record_id}`,
              );
            }
          } else {
            deleteQuery = deleteQuery.eq('id', item.record_id);
          }

          const { error } = await deleteQuery;

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

// ─── Pull: refresh cache metadata and selected local-only datasets ────────────

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

  // ── Birth profile (canonical on Supabase; not cached into localDb here) ──
  try {
    const { profile } = await invokeBirthProfileSync('getLatest', { since });
    if (profile) {
      trackMax([{ updated_at: profile.updatedAt }]);
      birthProfilesPulled++;
    }
  } catch (e) {
    logger.error('[SyncService] Birth profile pull failed:', e);
  }

  // ── Journal metadata (canonical on Supabase; not mirrored into localDb) ──
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
    journalPulled += data?.length ?? 0;
  } catch (e) {
    logger.error('[SyncService] Journal pull failed:', e);
  }

  // ── Sleep metadata (canonical on Supabase; not mirrored into localDb) ──
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
    sleepPulled += data?.length ?? 0;
  } catch (e) {
    logger.error('[SyncService] Sleep pull failed:', e);
  }

  // ── Check-ins metadata (canonical on Supabase; not mirrored into localDb) ──
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
    checkInsPulled += data?.length ?? 0;
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
          const decrypt = (v: string | null) => v ? FieldEncryptionService.decryptField(v).catch(() => v) : '';
          const answer: ReflectionAnswer = {
            questionId: row.question_id,
            category: row.category,
            questionText: await decrypt(row.question_text_enc),
            answer: await decrypt(row.answer_enc),
            scaleValue: row.scale_value ?? undefined,
            date: row.date,
            sealedAt: row.sealed_at,
            notes: row.notes_enc ? await decrypt(row.notes_enc) : undefined,
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
            emotion: row.emotion_enc
              ? await FieldEncryptionService.decryptField(row.emotion_enc).catch(() => row.emotion_enc)
              : '',
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
          const decryptOrFallback = (v: string) => FieldEncryptionService.decryptField(v).catch(() => v);
          const eventText = row.event_enc ? await decryptOrFallback(row.event_enc) : '';
          const sensationsRaw = row.sensations_enc ? await decryptOrFallback(row.sensations_enc) : '[]';
          const resolutionText = row.resolution_enc ? await decryptOrFallback(row.resolution_enc) : undefined;
          const event: TriggerEvent = {
            id: row.id,
            timestamp: row.timestamp,
            mode: row.mode,
            event: eventText,
            nsState: row.ns_state,
            sensations: (() => { try { return JSON.parse(sensationsRaw); } catch { return []; } })(),
            ...(row.intensity != null ? { intensity: row.intensity } : {}),
            ...(resolutionText !== undefined ? { resolution: resolutionText } : {}),
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
          const decryptPat = (v: string) => FieldEncryptionService.decryptField(v).catch(() => v);
          const noteText = row.note_enc ? await decryptPat(row.note_enc) : '';
          const tagsRaw = row.tags_enc ? await decryptPat(row.tags_enc) : '[]';
          const entry: PatternEntrySync = {
            id: row.id,
            date: row.date,
            note: noteText,
            tags: (() => { try { return JSON.parse(tagsRaw); } catch { return []; } })(),
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
        id: chart.id,
        chartId: chart.id,
        isDeleted: true,
        deletedAt: chart.deletedAt ?? new Date().toISOString(),
        updatedAt: chart.updatedAt,
      }
    : birthProfileToSupabase(chart);

  await enqueue('birth_profiles', session.user.id, operation, payload);
}

export async function syncBirthProfileFromLocal() {
  const charts = await localDb.getCharts().catch(() => [] as SavedChart[]);
  if (!charts.length) return;

  const localProfile = birthProfileToSupabase(charts[0]);
  const { profile: remoteProfile } = await invokeBirthProfileSync('getLatest');
  if (remoteProfile && remoteProfile.updatedAt > localProfile.updatedAt) {
    if (remoteProfile.isDeleted) {
      await localDb.deleteChart(remoteProfile.chartId).catch(() => {});
      return;
    }

    logger.info('[SyncService] Remote birth profile is newer; leaving Supabase as source of truth.');
    return;
  }

  await enqueueBirthProfile(charts[0]);
}

export async function deleteBirthProfileForCurrentUser(chartId?: string) {
  const session = await getSession();
  if (!session) return;

  await enqueue('birth_profiles', session.user.id, 'delete', {
    id: session.user.id,
    chartId: chartId ?? session.user.id,
    isDeleted: true,
    deletedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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
// These helpers now emit plaintext payloads for canonical Supabase storage.

function journalToSupabase(entry: JournalEntry) {
  return {
    id: entry.id,
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
    dream_text: entry.dreamText ?? null,
    dream_mood: entry.dreamMood ?? null,
    dream_feelings: entry.dreamFeelings ?? null,
    dream_metadata: entry.dreamMetadata ?? null,
    notes: entry.notes ?? null,
    is_deleted: entry.isDeleted,
    created_at: entry.createdAt,
    updated_at: entry.updatedAt,
  };
}

function checkInToSupabase(checkIn: DailyCheckIn) {
  const moodScore = clampMoodValue(Number(checkIn.moodScore));
  return {
    id: checkIn.id,
    log_date: checkIn.date,
    chart_id: checkIn.chartId,
    time_of_day: checkIn.timeOfDay,
    mood_value: moodScore,
    mood_score: moodScore,
    energy_level: checkIn.energyLevel,
    stress_level: checkIn.stressLevel,
    tags: Array.isArray(checkIn.tags) ? checkIn.tags : [],
    note: checkIn.note ?? null,
    wins: checkIn.wins ?? null,
    challenges: checkIn.challenges ?? null,
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

function birthProfileToSupabase(chart: SavedChart): BirthProfileSync {
  return {
    id: chart.id,
    chartId: chart.id,
    name: chart.name ?? undefined,
    birthDate: chart.birthDate,
    birthTime: chart.birthTime ?? undefined,
    hasUnknownTime: chart.hasUnknownTime,
    birthPlace: chart.birthPlace,
    latitude: chart.latitude,
    longitude: chart.longitude,
    timezone: chart.timezone ?? undefined,
    houseSystem: chart.houseSystem ?? undefined,
    isDeleted: chart.isDeleted,
    deletedAt: chart.deletedAt ?? undefined,
    createdAt: chart.createdAt,
    updatedAt: chart.updatedAt,
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
