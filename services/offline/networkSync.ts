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
      const { error } = await supabase
        .from('daily_check_ins')
        .upsert({ ...checkIn, user_id: userId }, { onConflict: 'id' });
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
