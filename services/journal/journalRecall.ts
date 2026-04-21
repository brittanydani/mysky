/**
 * Journal Recall Service
 *
 * Surfaces past journal entries that match the user's current mood.
 * "Last time you felt this way…" — the most powerful retention tool
 * a journaling app can have.
 */

import { localDb } from '../storage/localDb';
import { JournalEntry } from '../storage/models';
import { logger } from '../../utils/logger';
import { toLocalDateString } from '../../utils/dateUtils';

export interface JournalRecallResult {
  entry: JournalEntry;
  daysAgo: number;
}

/**
 * Find the most recent journal entry matching the given mood,
 * excluding today's entries and the entry being edited.
 */
export async function findMoodRecall(
  mood: JournalEntry['mood'],
  excludeDate?: string,
  excludeId?: string,
): Promise<JournalRecallResult | null> {
  try {
    const entries = await localDb.getJournalEntries();
    if (!entries.length) return null;

    const today = new Date();
    const todayStr = toLocalDateString(today);

    const match = entries.find(
      (e) =>
        e.mood === mood &&
        e.date !== todayStr &&
        (excludeDate == null || e.date !== excludeDate) &&
        (excludeId == null || e.id !== excludeId) &&
        e.content?.trim(),
    );

    if (!match) return null;

    const entryDate = new Date(match.date + 'T12:00:00');
    const daysAgo = Math.round(
      (today.getTime() - entryDate.getTime()) / 86_400_000,
    );

    return { entry: match, daysAgo };
  } catch (err) {
    logger.error('[JournalRecall] findMoodRecall failed:', err);
    return null;
  }
}
