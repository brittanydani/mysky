/**
 * Offline Queue for Gemini Requests
 *
 * When Gemini API calls fail due to network issues (status 0, timeout,
 * fetch errors), the request payload is persisted to Supabase preferences.
 * On next app focus or connectivity restoration, queued items are retried.
 *
 * Scope: dream-insights only.
 * Max queue depth: 10 items (oldest evicted on overflow).
 * TTL: 24 hours per item.
 */

import { getUserPreference, saveUserPreference, deleteUserPreference } from '../storage/userProfileService';
import { logger } from '../../utils/logger';

// ─── Types ────────────────────────────────────────────────────────────────────

export type QueuedRequestType = 'dream-insights';

export interface QueuedGeminiRequest {
  id: string;
  type: QueuedRequestType;
  payload: Record<string, unknown>;
  createdAt: string;
  attempts: number;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const QUEUE_KEY = '@mysky:gemini_offline_queue';
const MAX_QUEUE_SIZE = 10;
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_ATTEMPTS = 3;

// ─── Queue Operations ─────────────────────────────────────────────────────────

async function loadQueue(): Promise<QueuedGeminiRequest[]> {
  try {
    const parsed = await getUserPreference<QueuedGeminiRequest[]>(QUEUE_KEY, []);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveQueue(queue: QueuedGeminiRequest[]): Promise<void> {
  try {
    await saveUserPreference(QUEUE_KEY, queue);
  } catch (e) {
    logger.error('[GeminiQueue] Failed to persist queue:', e);
  }
}

/**
 * Enqueue a failed Gemini request for later retry.
 */
export async function enqueueGeminiRequest(
  type: QueuedRequestType,
  payload: Record<string, unknown>,
): Promise<void> {
  const queue = await loadQueue();

  const item: QueuedGeminiRequest = {
    id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    payload,
    createdAt: new Date().toISOString(),
    attempts: 0,
  };

  queue.push(item);

  // Evict oldest if over limit
  while (queue.length > MAX_QUEUE_SIZE) {
    queue.shift();
  }

  await saveQueue(queue);
  logger.info(`[GeminiQueue] Enqueued ${type} request (queue size: ${queue.length})`);
}

/**
 * Get all pending queue items, pruning expired entries.
 */
export async function getPendingRequests(): Promise<QueuedGeminiRequest[]> {
  const queue = await loadQueue();
  const now = Date.now();

  const valid = queue.filter((item) => {
    if (item.type !== 'dream-insights') return false;
    const age = now - new Date(item.createdAt).getTime();
    return age < MAX_AGE_MS && item.attempts < MAX_ATTEMPTS;
  });

  if (valid.length !== queue.length) {
    await saveQueue(valid);
  }

  return valid;
}

/**
 * Mark a queued item as completed (remove from queue).
 */
export async function dequeueRequest(id: string): Promise<void> {
  const queue = await loadQueue();
  const filtered = queue.filter((item) => item.id !== id);
  await saveQueue(filtered);
}

/**
 * Increment the attempt counter for a queued item.
 */
export async function markAttempted(id: string): Promise<void> {
  const queue = await loadQueue();
  const item = queue.find((i) => i.id === id);
  if (item) {
    item.attempts += 1;
    await saveQueue(queue);
  }
}

/**
 * Returns true if the error looks like a network/connectivity issue
 * (as opposed to a server-side rejection that won't succeed on retry).
 */
export function isNetworkError(error: unknown): boolean {
  if (!error) return false;

  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  return (
    message.includes('network request failed') ||
    message.includes('fetch failed') ||
    message.includes('unable to resolve host') ||
    message.includes('timeout') ||
    message.includes('aborted') ||
    message.includes('status: 0') ||
    message.includes('networkerror')
  );
}

/**
 * Clear the entire queue (e.g., on logout).
 */
export async function clearQueue(): Promise<void> {
  await deleteUserPreference(QUEUE_KEY);
}
