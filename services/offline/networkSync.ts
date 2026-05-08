import { supabase } from '../../lib/supabase';
import { withRetry, RETRY_PRESETS } from '../../utils/withRetry';
import { offlineQueue, type QueuedOperation } from './offlineQueue';

type JournalPayload = Record<string, unknown> & {
  userId: string;
  entry: Record<string, unknown>;
};

type CheckInPayload = Record<string, unknown> & {
  userId: string;
  checkIn: Record<string, unknown>;
};

type PreferencePayload = Record<string, unknown> & {
  userId: string;
  preference: Record<string, unknown>;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

function assertPayload<T extends Record<string, unknown>>(payload: unknown): T {
  if (!isRecord(payload)) {
    throw new Error('Invalid queued operation payload');
  }
  return payload as T;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

async function buildCheckInRetryRow(
  userId: string,
  checkIn: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const logDate = asString(checkIn.log_date);
  const timeOfDay = asString(checkIn.time_of_day);
  if (!logDate || !timeOfDay) {
    return { ...checkIn, user_id: userId };
  }

  const { data, error } = await supabase
    .from('daily_check_ins')
    .select('id, created_at')
    .eq('user_id', userId)
    .eq('log_date', logDate)
    .eq('time_of_day', timeOfDay)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  const existing = isRecord(data) ? data : null;
  return existing?.id
    ? {
        ...checkIn,
        user_id: userId,
        id: existing.id,
        created_at: existing.created_at ?? checkIn.created_at,
      }
    : { ...checkIn, user_id: userId };
}

async function executeOperation(op: QueuedOperation): Promise<void> {
  switch (op.type) {
    case 'journal_entry': {
      const { userId, entry } = assertPayload<JournalPayload>(op.payload);
      const { error } = await supabase
        .from('journal_entries')
        .upsert({ ...entry, user_id: userId }, { onConflict: 'id' });
      if (error) throw error;
      return;
    }
    case 'checkin': {
      const { userId, checkIn } = assertPayload<CheckInPayload>(op.payload);
      const row = await buildCheckInRetryRow(userId, checkIn);
      const { error } = await supabase
        .from('daily_check_ins')
        .upsert(row, { onConflict: 'id' });
      if (error) throw error;
      return;
    }
    case 'preference': {
      const { userId, preference } = assertPayload<PreferencePayload>(op.payload);
      const { error } = await supabase
        .from('app_settings')
        .upsert({ ...preference, user_id: userId }, { onConflict: 'user_id' });
      if (error) throw error;
      return;
    }
    default:
      throw new Error(`Unknown queued operation type: ${String(op.type)}`);
  }
}

export async function setupNetworkSyncHandler(): Promise<void> {
  await offlineQueue.initialize();
  await processQueuedOperations();
}

export async function processQueuedOperations(): Promise<void> {
  await withRetry(
    () => offlineQueue.processQueue(executeOperation),
    'processOfflineQueue',
    RETRY_PRESETS.standard,
  );
}
