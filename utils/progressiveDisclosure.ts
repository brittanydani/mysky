// utils/progressiveDisclosure.ts
// MySky — Progressive Disclosure & Feature Gating
//
// Controls which features are visible in v1 and manages
// time-based unlocking of deeper tools.

import { EncryptedAsyncStorage } from '../services/storage/encryptedAsyncStorage';
import { logger } from './logger';

// ── V1 Hidden Features ──────────────────────────────────────────────────────
// Features that exist in code but are hidden from navigation in v1.
// Set to `false` to re-enable a feature.

export const V1_HIDDEN_FEATURES = {
  /** Restorative Space / healing rituals card on Blueprint Hub */
  healingRituals: true,
  /** Energy tab (chakra system) on Blueprint Hub */
  energyTab: true,
  /** Intelligence Profile tool in Inner World */
  intelligenceProfile: true,
  /** Internal Tensions shown early (before threshold) */
  innerTensionsEarly: true,
} as const;

// ── Unlock Thresholds ───────────────────────────────────────────────────────
// Number of days since first use before a feature is surfaced.

export const UNLOCK_THRESHOLDS: Record<string, number> = {
  triggerGlimmer: 3,    // Glimmer prompts after 3 days
  somaticMap: 5,        // Somatic body map after 5 days
  relationships: 7,     // Relationship patterns after 7 days
  innerTensions: 14,    // Internal tensions after 14 days
};

// ── First-Use Tracking ──────────────────────────────────────────────────────

const FIRST_USE_KEY = '@mysky:first_use_date';

/** Record the date the user first opened the app (idempotent). */
export async function recordFirstUseDate(): Promise<void> {
  try {
    const existing = await EncryptedAsyncStorage.getItem(FIRST_USE_KEY);
    if (!existing) {
      await EncryptedAsyncStorage.setItem(FIRST_USE_KEY, new Date().toISOString());
    }
  } catch (err) {
    logger.error('progressiveDisclosure: failed to record first use date', err);
  }
}

/** Returns the number of days since the user first opened the app. */
export async function getDaysSinceFirstUse(): Promise<number> {
  try {
    const stored = await EncryptedAsyncStorage.getItem(FIRST_USE_KEY);
    if (!stored) return 0;
    const firstUse = new Date(stored);
    const now = new Date();
    const diffMs = now.getTime() - firstUse.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}

/** Check if a feature should be unlocked based on days since first use. */
export async function isFeatureUnlocked(featureKey: string): Promise<boolean> {
  const threshold = UNLOCK_THRESHOLDS[featureKey];
  if (threshold == null) return true; // No threshold = always unlocked
  const days = await getDaysSinceFirstUse();
  return days >= threshold;
}

// ── Interest-Based Preferences ──────────────────────────────────────────────

export const INTEREST_OPTIONS = [
  { id: 'mood', label: 'Track my mood & energy', icon: '◉' },
  { id: 'sleep', label: 'Understand my sleep patterns', icon: '☽' },
  { id: 'stress', label: 'Manage stress & triggers', icon: '⚡' },
  { id: 'self', label: 'Explore who I am', icon: '◈' },
  { id: 'relationships', label: 'Understand my relationships', icon: '⬡' },
  { id: 'astrology', label: 'Astrology-based reflection', icon: '✦' },
] as const;

const PREFS_KEY = '@mysky:feature_preferences';

export async function saveFeaturePreferences(selectedIds: string[]): Promise<void> {
  try {
    await EncryptedAsyncStorage.setItem(PREFS_KEY, JSON.stringify(selectedIds));
  } catch (err) {
    logger.error('progressiveDisclosure: failed to save preferences', err);
  }
}

export async function loadFeaturePreferences(): Promise<string[]> {
  try {
    const raw = await EncryptedAsyncStorage.getItem(PREFS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}
