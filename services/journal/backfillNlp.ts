/**
 * Journal NLP Backfill Service
 *
 * Re-analyzes existing journal entries that were created before the NLP
 * pipeline (v10 migration) and populates contentKeywords, contentEmotions,
 * contentSentiment, contentWordCount, and contentReadingMinutes.
 *
 * Designed to run once during app startup or on the Insights screen load.
 * Uses a flag in SecureStore to avoid re-running on every launch.
 */

import * as SecureStore from 'expo-secure-store';
import { localDb } from '../storage/localDb';
import { analyzeJournalContent } from './nlp';
import { logger } from '../../utils/logger';

const BACKFILL_KEY = 'journal_nlp_backfill_complete';

/**
 * Check whether the NLP backfill has already been completed.
 */
export async function isBackfillComplete(): Promise<boolean> {
  try {
    const val = await SecureStore.getItemAsync(BACKFILL_KEY);
    return val === 'true';
  } catch {
    return false;
  }
}

/**
 * Run the NLP backfill for all journal entries that are missing NLP data.
 *
 * - Fetches all non-deleted journal entries
 * - Filters to those without contentKeywords (the first NLP field set)
 * - Runs analyzeJournalContent on each and updates via localDb.updateJournalEntry
 * - Sets a flag in SecureStore so it doesn't re-run
 *
 * Returns the number of entries backfilled.
 */
export async function runNlpBackfill(): Promise<number> {
  // Check if already done
  if (await isBackfillComplete()) {
    return 0;
  }

  try {
    const allEntries = await localDb.getJournalEntries();

    // Filter to entries missing NLP data
    const needsBackfill = allEntries.filter(
      e => !e.contentKeywords && e.content && e.content.trim().length > 0,
    );

    if (needsBackfill.length === 0) {
      await SecureStore.setItemAsync(BACKFILL_KEY, 'true');
      logger.info('[NLP Backfill] No entries need backfill');
      return 0;
    }

    logger.info(`[NLP Backfill] Starting backfill for ${needsBackfill.length} entries`);

    let processed = 0;

    for (const entry of needsBackfill) {
      try {
        const nlp = analyzeJournalContent(entry.content);

        const updated = {
          ...entry,
          contentKeywords: JSON.stringify(nlp.keywords),
          contentEmotions: JSON.stringify(nlp.emotions),
          contentSentiment: JSON.stringify(nlp.sentiment),
          contentWordCount: nlp.wordCount,
          contentReadingMinutes: nlp.readingMinutes,
          updatedAt: entry.updatedAt, // preserve original updatedAt
        };

        await localDb.updateJournalEntry(updated);
        processed++;
      } catch (e) {
        logger.error(`[NLP Backfill] Failed for entry ${entry.id}:`, e);
        // Continue with remaining entries
      }
    }

    // Mark complete
    await SecureStore.setItemAsync(BACKFILL_KEY, 'true');
    logger.info(`[NLP Backfill] Complete: ${processed}/${needsBackfill.length} entries processed`);

    return processed;
  } catch (e) {
    logger.error('[NLP Backfill] Failed:', e);
    return 0;
  }
}

/**
 * Reset the backfill flag so it can run again.
 * Useful for testing or if the NLP algorithm changes.
 */
export async function resetBackfillFlag(): Promise<void> {
  await SecureStore.deleteItemAsync(BACKFILL_KEY);
}
