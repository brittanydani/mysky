/**
 * Insights Cache
 *
 * Smart caching for the insight bundle.
 * Recomputes only when source data changes:
 *  - New mood check-in saved
 *  - New journal entry saved
 *  - Day changes (todayDayKey)
 *  - Chart profile changes
 *
 * Storage: memory (instant) + file system (survives restarts).
 */

import { File, Paths } from 'expo-file-system';
import { InsightBundle } from '../../utils/insightsEngine';
import { CacheKey, CachedInsightBundle } from './types';
import { logger } from '../../utils/logger';
import { FieldEncryptionService, isDecryptionFailure } from '../storage/fieldEncryption';

// ─────────────────────────────────────────────────────────────────────────────
// Module-level state
// ─────────────────────────────────────────────────────────────────────────────

let _memoryCache: CachedInsightBundle | null = null;
const _cacheFile = new File(Paths.cache, 'insights_bundle_v2.json');

// ─────────────────────────────────────────────────────────────────────────────
// Cache key
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a deterministic string key from the cache components.
 */
export function buildCacheKeyString(key: CacheKey): string {
  return `${key.lastCheckInAt}|${key.lastJournalAt}|${key.todayDayKey}|${key.chartProfileHash}`;
}

/**
 * Build a CacheKey from raw values.
 */
export function makeCacheKey(
  lastCheckInAt: string,
  lastJournalAt: string,
  todayDayKey: string,
  chartProfileHash: string,
): CacheKey {
  return { lastCheckInAt, lastJournalAt, todayDayKey, chartProfileHash };
}

// ─────────────────────────────────────────────────────────────────────────────
// Cache operations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check if we have a valid cache hit (memory first, then disk).
 * Returns the cached bundle or null.
 */
export async function getCachedBundle(key: CacheKey): Promise<InsightBundle | null> {
  const keyStr = buildCacheKeyString(key);

  // Memory hit
  if (_memoryCache && _memoryCache.key === keyStr) {
    return _memoryCache.bundle;
  }

  // Disk hit (cold start)
  try {
    if (_cacheFile.exists) {
      const raw = await _cacheFile.text();
      // Decrypt the on-disk blob (health-sensitive derivative data)
      const decrypted = await FieldEncryptionService.decryptField(raw);
      if (isDecryptionFailure(decrypted)) {
        // Cache is unreadable (key rotated, corrupted, etc.) — treat as miss
        logger.info('[InsightsCache] Disk cache decryption failed, treating as miss');
      } else {
        const parsed = JSON.parse(decrypted) as CachedInsightBundle;
        if (parsed?.key === keyStr && parsed?.bundle) {
          _memoryCache = parsed;
          return parsed.bundle;
        }
      }
    }
  } catch (e) {
    logger.warn('[InsightsCache] Failed to read disk cache', e);
  }

  return null;
}

/**
 * Store a computed bundle in both memory and disk cache.
 */
export async function setCachedBundle(key: CacheKey, bundle: InsightBundle): Promise<void> {
  const keyStr = buildCacheKeyString(key);
  const cached: CachedInsightBundle = {
    key: keyStr,
    bundle,
    createdAt: new Date().toISOString(),
  };

  // Memory
  _memoryCache = cached;

  // Disk (best-effort, encrypted at rest)
  try {
    const plaintext = JSON.stringify(cached);
    const encrypted = await FieldEncryptionService.encryptField(plaintext);
    _cacheFile.write(encrypted);
  } catch (e) {
    logger.warn('[InsightsCache] Failed to write disk cache', e);
  }
}

/**
 * Invalidate the cache (forces recompute on next access).
 */
export function invalidateCache(): void {
  _memoryCache = null;
  try {
    if (_cacheFile.exists) {
      _cacheFile.delete();
    }
  } catch {
    // best-effort
  }
}

/**
 * Check if we need to recompute (returns true if cache miss).
 */
export async function needsRecompute(key: CacheKey): Promise<boolean> {
  const result = await getCachedBundle(key);
  return result === null;
}
