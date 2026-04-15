/**
 * Gemini Queue Processor
 *
 * Call processGeminiQueue() on app focus to retry any queued requests.
 * Each item is retried once per focus cycle. Failed items stay in the queue
 * until they expire (24h) or exceed max attempts (3).
 */

import { supabase } from '../../lib/supabase';
import { logger } from '../../utils/logger';
import {
  getPendingRequests,
  dequeueRequest,
  markAttempted,
  type QueuedGeminiRequest,
} from './geminiQueue';

/**
 * Process all pending Gemini requests in the offline queue.
 * Returns the number of successfully retried items.
 */
export async function processGeminiQueue(): Promise<number> {
  const pending = await getPendingRequests();
  if (pending.length === 0) return 0;

  logger.info(`[GeminiQueueProcessor] Processing ${pending.length} queued request(s)`);

  // Verify we have an active session before attempting retries
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData?.session?.access_token) {
    logger.info('[GeminiQueueProcessor] No active session — skipping queue processing');
    return 0;
  }

  const accessToken = sessionData.session.access_token;
  let successCount = 0;

  for (const item of pending) {
    try {
      await markAttempted(item.id);
      await retryRequest(item, accessToken);
      await dequeueRequest(item.id);
      successCount += 1;
      logger.info(`[GeminiQueueProcessor] Successfully retried ${item.type} (${item.id})`);
    } catch (e) {
      logger.warn(`[GeminiQueueProcessor] Retry failed for ${item.id}:`, e instanceof Error ? e.message : e);
      // Item stays in queue with incremented attempt count
    }
  }

  return successCount;
}

async function retryRequest(item: QueuedGeminiRequest, accessToken: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke(item.type, {
    headers: { Authorization: `Bearer ${accessToken}` },
    body: item.payload,
  });

  if (error) {
    throw new Error(`Edge function error: ${error.message || 'unknown'}`);
  }

  if (!data) {
    throw new Error('Empty response from edge function');
  }

  // Note: We don't apply the result to the UI because the user may have
  // navigated away. The result is effectively discarded — the primary goal
  // is ensuring the server-side processing completes (e.g., for analytics
  // or model training). If the user re-opens the relevant screen, a fresh
  // call will be made.
}
