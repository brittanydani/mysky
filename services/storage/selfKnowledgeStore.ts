import { supabase } from '../../lib/supabase';
import { logger } from '../../utils/logger';
import type { TriggerEvent } from '../../utils/triggerEventTypes';
import { FieldEncryptionService } from './fieldEncryption';
import { AccountScopedAsyncStorage } from './accountScopedStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DailyReflectionData, ReflectionAnswer } from '../insights/dailyReflectionService';

export interface SomaticEntryRecord {
  id: string;
  date: string;
  region: string;
  side?: 'front' | 'back';
  gender?: 'female' | 'male';
  emotion: string;
  sensation?: string | null;
  intensity: number;
}

export interface RelationshipPatternRecord {
  id: string;
  date: string;
  note: string;
  tags: string[];
}

const CACHE_KEYS = {
  dailyReflections: '@mysky:cache:daily_reflections',
  somaticEntries: '@mysky:cache:somatic_entries',
  triggerEvents: '@mysky:cache:trigger_events',
  relationshipPatterns: '@mysky:cache:relationship_patterns',
} as const;

const LEGACY_KEYS = {
  dailyReflections: '@mysky:daily_reflections',
  somaticEntries: '@mysky:somatic_entries',
  triggerEvents: '@mysky:trigger_events',
  relationshipPatterns: '@mysky:relationship_patterns',
} as const;

const EMPTY_REFLECTION_DATA: DailyReflectionData = {
  answers: [],
  totalDaysCompleted: 0,
  startedAt: null,
};

async function getUserId(): Promise<string | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    logger.warn('[SelfKnowledgeStore] Could not read auth session', error);
    return null;
  }

  return data.session?.user?.id ?? null;
}

function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function buildLegacyScopedKey(key: string, userId: string): string {
  return `${key}::user::${userId}`;
}

async function readLegacyEncryptedItem(key: string): Promise<string | null> {
  const userId = await getUserId();
  const scopedKey = userId ? buildLegacyScopedKey(key, userId) : key;
  const raw = (await AsyncStorage.getItem(scopedKey)) ?? (await AsyncStorage.getItem(key));
  if (raw === null) return null;

  if (!FieldEncryptionService.isEncrypted(raw)) {
    return raw;
  }

  try {
    return await FieldEncryptionService.decryptField(raw);
  } catch {
    return null;
  }
}

async function decryptLegacyValue(value: string | null | undefined): Promise<string | undefined> {
  if (!value) return undefined;
  try {
    return await FieldEncryptionService.decryptField(value);
  } catch {
    return value;
  }
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

async function preferPlainOrLegacy(
  plainValue: unknown,
  legacyEncryptedValue: string | null | undefined,
): Promise<string | undefined> {
  if (isNonEmptyString(plainValue)) {
    return plainValue;
  }

  return decryptLegacyValue(legacyEncryptedValue);
}

function buildReflectionData(answers: ReflectionAnswer[]): DailyReflectionData {
  const reflectionDates = [...new Set(answers.map((answer) => answer.date))];
  const startedAt = answers.length > 0
    ? [...answers]
      .sort((left, right) => left.sealedAt.localeCompare(right.sealedAt))[0]?.sealedAt ?? null
    : null;

  return {
    answers,
    totalDaysCompleted: reflectionDates.length,
    startedAt,
  };
}

export async function loadPlainAccountScopedJson<T>(
  key: string,
  fallback: T,
  legacyEncryptedKey?: string,
): Promise<T> {
  const cachedRaw = await AccountScopedAsyncStorage.getItem(key);
  if (cachedRaw !== null) {
    return safeJsonParse<T>(cachedRaw, fallback);
  }

  if (!legacyEncryptedKey) return fallback;

  const legacyRaw = await readLegacyEncryptedItem(legacyEncryptedKey);
  if (legacyRaw === null) return fallback;

  await AccountScopedAsyncStorage.setItem(key, legacyRaw);
  return safeJsonParse<T>(legacyRaw, fallback);
}

export async function savePlainAccountScopedJson<T>(key: string, value: T): Promise<void> {
  await AccountScopedAsyncStorage.setItem(key, JSON.stringify(value));
}

async function upsertReflectionRows(answers: ReflectionAnswer[]): Promise<void> {
  const userId = await getUserId();
  if (!userId || answers.length === 0) return;

  const now = new Date().toISOString();
  const rows = answers.map((answer) => ({
    id: `${answer.date}:${answer.questionId}:${answer.category}`,
    user_id: userId,
    question_id: answer.questionId,
    category: answer.category,
    question_text: answer.questionText,
    answer: answer.answer,
    scale_value: answer.scaleValue ?? null,
    date: answer.date,
    sealed_at: answer.sealedAt,
    notes: answer.notes ?? null,
    is_deleted: false,
    created_at: now,
    updated_at: now,
  }));

  const { error } = await supabase
    .from('daily_reflections')
    .upsert(rows, { onConflict: 'id' });

  if (error) {
    throw error;
  }
}

export async function loadDailyReflectionData(): Promise<DailyReflectionData> {
  const fallback = await loadPlainAccountScopedJson<DailyReflectionData>(
    CACHE_KEYS.dailyReflections,
    EMPTY_REFLECTION_DATA,
    LEGACY_KEYS.dailyReflections,
  );
  const userId = await getUserId();
  if (!userId) return fallback;

  try {
    const { data, error } = await supabase
      .from('daily_reflections')
      .select(`
        id,
        question_id,
        category,
        question_text,
        question_text_enc,
        answer,
        answer_enc,
        scale_value,
        date,
        sealed_at,
        notes,
        notes_enc,
        is_deleted
      `)
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .order('sealed_at', { ascending: true })
      .limit(5000);

    if (error) throw error;

    const answers: ReflectionAnswer[] = [];
    for (const row of data ?? []) {
      const questionText = await preferPlainOrLegacy(row.question_text, row.question_text_enc);
      const answerText = await preferPlainOrLegacy(row.answer, row.answer_enc);
      const notes = await preferPlainOrLegacy(row.notes, row.notes_enc);

      if (!questionText || !answerText) continue;

      answers.push({
        questionId: row.question_id,
        category: row.category,
        questionText,
        answer: answerText,
        scaleValue: row.scale_value ?? undefined,
        date: row.date,
        sealedAt: row.sealed_at,
        ...(notes ? { notes } : {}),
      });
    }

    if (answers.length === 0 && fallback.answers.length > 0) {
      upsertReflectionRows(fallback.answers).catch((upsertError) => {
        logger.warn('[SelfKnowledgeStore] Failed to backfill daily reflections to Supabase', upsertError);
      });
      return fallback;
    }

    const resolved = buildReflectionData(answers);
    await savePlainAccountScopedJson(CACHE_KEYS.dailyReflections, resolved);
    return resolved;
  } catch (error) {
    logger.warn('[SelfKnowledgeStore] Falling back to cached daily reflections', error);
    return fallback;
  }
}

export async function persistDailyReflectionData(
  data: DailyReflectionData,
  changedAnswers: ReflectionAnswer[],
): Promise<void> {
  await savePlainAccountScopedJson(CACHE_KEYS.dailyReflections, data);

  try {
    await upsertReflectionRows(changedAnswers);
  } catch (error) {
    logger.warn('[SelfKnowledgeStore] Failed to persist daily reflections to Supabase', error);
  }
}

async function upsertSomaticRows(entries: SomaticEntryRecord[]): Promise<void> {
  const userId = await getUserId();
  if (!userId || entries.length === 0) return;

  const rows = entries.map((entry) => ({
    id: entry.id,
    user_id: userId,
    date: entry.date,
    region: entry.region,
    side: entry.side ?? null,
    gender: entry.gender ?? null,
    emotion: entry.emotion,
    sensation: entry.sensation ?? null,
    intensity: entry.intensity,
    is_deleted: false,
    created_at: entry.date,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from('somatic_entries')
    .upsert(rows, { onConflict: 'id' });

  if (error) throw error;
}

export async function loadSomaticEntries(): Promise<SomaticEntryRecord[]> {
  const fallback = await loadPlainAccountScopedJson<SomaticEntryRecord[]>(
    CACHE_KEYS.somaticEntries,
    [],
    LEGACY_KEYS.somaticEntries,
  );
  const userId = await getUserId();
  if (!userId) return fallback;

  try {
    const { data, error } = await supabase
      .from('somatic_entries')
      .select('id,date,region,side,gender,emotion,emotion_enc,sensation,intensity,is_deleted')
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .order('date', { ascending: false })
      .limit(1000);

    if (error) throw error;

    const entries: SomaticEntryRecord[] = [];
    for (const row of data ?? []) {
      const emotion = await preferPlainOrLegacy(row.emotion, row.emotion_enc);
      if (!emotion) continue;

      entries.push({
        id: row.id,
        date: row.date,
        region: row.region,
        ...(row.side ? { side: row.side } : {}),
        ...(row.gender ? { gender: row.gender } : {}),
        emotion,
        ...(row.sensation ? { sensation: row.sensation } : {}),
        intensity: row.intensity,
      });
    }

    if (entries.length === 0 && fallback.length > 0) {
      upsertSomaticRows(fallback).catch((upsertError) => {
        logger.warn('[SelfKnowledgeStore] Failed to backfill somatic entries to Supabase', upsertError);
      });
      return fallback;
    }

    await savePlainAccountScopedJson(CACHE_KEYS.somaticEntries, entries);
    return entries;
  } catch (error) {
    logger.warn('[SelfKnowledgeStore] Falling back to cached somatic entries', error);
    return fallback;
  }
}

export async function addSomaticEntry(entry: SomaticEntryRecord): Promise<void> {
  const existing = await loadPlainAccountScopedJson<SomaticEntryRecord[]>(
    CACHE_KEYS.somaticEntries,
    [],
    LEGACY_KEYS.somaticEntries,
  );
  const next = [entry, ...existing.filter((candidate) => candidate.id !== entry.id)];
  await savePlainAccountScopedJson(CACHE_KEYS.somaticEntries, next);

  try {
    await upsertSomaticRows([entry]);
  } catch (error) {
    logger.warn('[SelfKnowledgeStore] Failed to persist somatic entry to Supabase', error);
  }
}

export async function deleteSomaticEntry(entryId: string): Promise<void> {
  const existing = await loadPlainAccountScopedJson<SomaticEntryRecord[]>(
    CACHE_KEYS.somaticEntries,
    [],
    LEGACY_KEYS.somaticEntries,
  );
  await savePlainAccountScopedJson(
    CACHE_KEYS.somaticEntries,
    existing.filter((entry) => entry.id !== entryId),
  );

  const userId = await getUserId();
  if (!userId) return;

  try {
    const { error } = await supabase
      .from('somatic_entries')
      .update({
        is_deleted: true,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('id', entryId);

    if (error) throw error;
  } catch (error) {
    logger.warn('[SelfKnowledgeStore] Failed to delete somatic entry in Supabase', error);
  }
}

function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }

  if (typeof value !== 'string' || !value.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string')
      : [];
  } catch {
    return [];
  }
}

async function upsertTriggerRows(events: TriggerEvent[]): Promise<void> {
  const userId = await getUserId();
  if (!userId || events.length === 0) return;

  const now = new Date().toISOString();
  const rows = events.map((event) => ({
    id: event.id,
    user_id: userId,
    timestamp: event.timestamp,
    mode: event.mode,
    event: event.event,
    ns_state: event.nsState,
    sensations: event.sensations,
    intensity: event.intensity ?? null,
    resolution: event.resolution ?? null,
    context_area: event.contextArea ?? null,
    before_state: event.beforeState ?? null,
    is_deleted: false,
    created_at: now,
    updated_at: now,
  }));

  const { error } = await supabase
    .from('trigger_events')
    .upsert(rows, { onConflict: 'id' });

  if (error) throw error;
}

export async function loadTriggerEvents(): Promise<TriggerEvent[]> {
  const fallback = await loadPlainAccountScopedJson<TriggerEvent[]>(
    CACHE_KEYS.triggerEvents,
    [],
    LEGACY_KEYS.triggerEvents,
  );
  const userId = await getUserId();
  if (!userId) return fallback;

  try {
    const { data, error } = await supabase
      .from('trigger_events')
      .select(`
        id,
        timestamp,
        mode,
        event,
        event_enc,
        ns_state,
        sensations,
        sensations_enc,
        intensity,
        resolution,
        resolution_enc,
        context_area,
        before_state,
        is_deleted
      `)
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .order('timestamp', { ascending: false })
      .limit(1000);

    if (error) throw error;

    const events: TriggerEvent[] = [];
    for (const row of data ?? []) {
      const eventText = await preferPlainOrLegacy(row.event, row.event_enc);
      if (!eventText) continue;

      const legacySensations = await decryptLegacyValue(row.sensations_enc);
      const resolution = await preferPlainOrLegacy(row.resolution, row.resolution_enc);
      events.push({
        id: row.id,
        timestamp: row.timestamp,
        mode: row.mode,
        event: eventText,
        nsState: row.ns_state,
        sensations: parseStringArray(row.sensations ?? legacySensations),
        ...(row.intensity != null ? { intensity: row.intensity } : {}),
        ...(resolution ? { resolution } : {}),
        ...(row.context_area ? { contextArea: row.context_area } : {}),
        ...(row.before_state ? { beforeState: row.before_state } : {}),
      });
    }

    if (events.length === 0 && fallback.length > 0) {
      upsertTriggerRows(fallback).catch((upsertError) => {
        logger.warn('[SelfKnowledgeStore] Failed to backfill trigger events to Supabase', upsertError);
      });
      return fallback;
    }

    await savePlainAccountScopedJson(CACHE_KEYS.triggerEvents, events);
    return events;
  } catch (error) {
    logger.warn('[SelfKnowledgeStore] Falling back to cached trigger events', error);
    return fallback;
  }
}

export async function addTriggerEvent(event: TriggerEvent): Promise<void> {
  const existing = await loadPlainAccountScopedJson<TriggerEvent[]>(
    CACHE_KEYS.triggerEvents,
    [],
    LEGACY_KEYS.triggerEvents,
  );
  const next = [event, ...existing.filter((candidate) => candidate.id !== event.id)];
  await savePlainAccountScopedJson(CACHE_KEYS.triggerEvents, next);

  try {
    await upsertTriggerRows([event]);
  } catch (error) {
    logger.warn('[SelfKnowledgeStore] Failed to persist trigger event to Supabase', error);
  }
}

async function upsertRelationshipPatternRows(entries: RelationshipPatternRecord[]): Promise<void> {
  const userId = await getUserId();
  if (!userId || entries.length === 0) return;

  const rows = entries.map((entry) => ({
    id: entry.id,
    user_id: userId,
    date: entry.date,
    note: entry.note,
    tags: entry.tags,
    is_deleted: false,
    created_at: entry.date,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from('relationship_patterns')
    .upsert(rows, { onConflict: 'id' });

  if (error) throw error;
}

export async function loadRelationshipPatterns(): Promise<RelationshipPatternRecord[]> {
  const fallback = await loadPlainAccountScopedJson<RelationshipPatternRecord[]>(
    CACHE_KEYS.relationshipPatterns,
    [],
    LEGACY_KEYS.relationshipPatterns,
  );
  const userId = await getUserId();
  if (!userId) return fallback;

  try {
    const { data, error } = await supabase
      .from('relationship_patterns')
      .select('id,date,note,note_enc,tags,tags_enc,is_deleted')
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .order('date', { ascending: false })
      .limit(1000);

    if (error) throw error;

    const entries: RelationshipPatternRecord[] = [];
    for (const row of data ?? []) {
      const note = await preferPlainOrLegacy(row.note, row.note_enc);
      if (!note) continue;

      const legacyTags = await decryptLegacyValue(row.tags_enc);
      entries.push({
        id: row.id,
        date: row.date,
        note,
        tags: parseStringArray(row.tags ?? legacyTags),
      });
    }

    if (entries.length === 0 && fallback.length > 0) {
      upsertRelationshipPatternRows(fallback).catch((upsertError) => {
        logger.warn('[SelfKnowledgeStore] Failed to backfill relationship patterns to Supabase', upsertError);
      });
      return fallback;
    }

    await savePlainAccountScopedJson(CACHE_KEYS.relationshipPatterns, entries);
    return entries;
  } catch (error) {
    logger.warn('[SelfKnowledgeStore] Falling back to cached relationship patterns', error);
    return fallback;
  }
}

export async function addRelationshipPattern(entry: RelationshipPatternRecord): Promise<void> {
  const existing = await loadPlainAccountScopedJson<RelationshipPatternRecord[]>(
    CACHE_KEYS.relationshipPatterns,
    [],
    LEGACY_KEYS.relationshipPatterns,
  );
  const next = [entry, ...existing.filter((candidate) => candidate.id !== entry.id)];
  await savePlainAccountScopedJson(CACHE_KEYS.relationshipPatterns, next);

  try {
    await upsertRelationshipPatternRows([entry]);
  } catch (error) {
    logger.warn('[SelfKnowledgeStore] Failed to persist relationship pattern to Supabase', error);
  }
}
