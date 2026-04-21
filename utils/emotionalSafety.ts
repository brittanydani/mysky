// utils/emotionalSafety.ts
// MySky — Emotional Safety Guardrails
//
// Gentle interventions: rest day prompts, low-mood support,
// dream sensitivity, and glimmer (positive noticing) prompts.

import { EncryptedAsyncStorage } from '../services/storage/encryptedAsyncStorage';
import { logger } from './logger';
import { toLocalDateString } from './dateUtils';

// ── Rest Day Suggestion ─────────────────────────────────────────────────────
// After 7+ consecutive logging days, gently suggest a break.

const CONSECUTIVE_DAYS_KEY = '@mysky:consecutive_log_days';
const REST_PROMPT_KEY = '@mysky:last_rest_prompt';

/** Check whether the user should see a "rest day" suggestion. */
export async function shouldSuggestRestDay(): Promise<boolean> {
  try {
    const raw = await EncryptedAsyncStorage.getItem(CONSECUTIVE_DAYS_KEY);
    const days = raw ? parseInt(raw, 10) : 0;
    if (days < 7) return false;

    // Don't show again if prompted within the last 3 days
    const lastPrompt = await EncryptedAsyncStorage.getItem(REST_PROMPT_KEY);
    if (lastPrompt) {
      const daysSincePrompt = (Date.now() - new Date(lastPrompt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSincePrompt < 3) return false;
    }

    return true;
  } catch {
    return false;
  }
}

/** Record that the rest day prompt was shown/dismissed. */
export async function recordRestDayPrompt(): Promise<void> {
  try {
    await EncryptedAsyncStorage.setItem(REST_PROMPT_KEY, new Date().toISOString());
    // Reset consecutive days counter
    await EncryptedAsyncStorage.setItem(CONSECUTIVE_DAYS_KEY, '0');
  } catch (err) {
    logger.error('emotionalSafety: failed to record rest day prompt', err);
  }
}

/** Increment (or reset) the consecutive logging days counter. */
export async function updateConsecutiveLogDays(didLogToday: boolean): Promise<void> {
  try {
    if (didLogToday) {
      const raw = await EncryptedAsyncStorage.getItem(CONSECUTIVE_DAYS_KEY);
      const current = raw ? parseInt(raw, 10) : 0;
      await EncryptedAsyncStorage.setItem(CONSECUTIVE_DAYS_KEY, String(current + 1));
    } else {
      await EncryptedAsyncStorage.setItem(CONSECUTIVE_DAYS_KEY, '0');
    }
  } catch (err) {
    logger.error('emotionalSafety: failed to update consecutive log days', err);
  }
}

// ── Low Mood Pattern Detection ──────────────────────────────────────────────

interface MoodEntry {
  date: string;
  mood: number;
}

interface LowMoodResult {
  showSupportCard: boolean;
  lowDayCount: number;
}

/**
 * Check if mood has been consistently low (≤ 3) for 10+ of the last 14 days.
 * Returns whether to show a gentle support card.
 */
export function checkLowMoodPattern(recentMoods: MoodEntry[]): LowMoodResult {
  const last14 = recentMoods.slice(0, 14);
  const lowDays = last14.filter((m) => m.mood <= 3).length;
  return {
    showSupportCard: lowDays >= 10,
    lowDayCount: lowDays,
  };
}

// ── Dream Content Sensitivity ───────────────────────────────────────────────

const SENSITIVE_KEYWORDS = [
  'death', 'dying', 'suicide', 'kill', 'blood', 'abuse',
  'assault', 'violence', 'trauma', 'self-harm', 'hurt myself',
];

/** Check if dream text contains potentially sensitive content. */
export function hasSensitiveDreamContent(dreamText: string): boolean {
  const lower = dreamText.toLowerCase();
  return SENSITIVE_KEYWORDS.some((keyword) => lower.includes(keyword));
}

export const DREAM_SENSITIVITY_NOTICE =
  'This dream touches on heavy themes. Dream symbols are not predictions — they often reflect unprocessed emotions. If you\'re struggling, please reach out to a trusted person or crisis line.';

// ── Glimmer Prompts ─────────────────────────────────────────────────────────
// "Glimmers" are micro-moments of safety, joy, or connection (Deb Dana / polyvagal).
// These rotate daily to balance the app's focus on difficulty.

const GLIMMER_PROMPTS = [
  'What\'s one small thing that felt good today — even for a second?',
  'Did anything make you smile or exhale today?',
  'Was there a moment today when you felt safe or at ease?',
  'What\'s something your body enjoyed today — warmth, a stretch, a deep breath?',
  'Did you notice any moment of connection today — even a brief one?',
  'What\'s one thing that went better than expected today?',
  'Was there a sound, smell, or texture that felt grounding today?',
  'What\'s something you did today that you can give yourself credit for?',
];

/** Get today's glimmer prompt (rotates daily based on date). */
export function getDailyGlimmerPrompt(): string {
  const todayStr = toLocalDateString(new Date());
  // simple string hash so the prompt is stable for the local day
  let hash = 0;
  for (let i = 0; i < todayStr.length; i++) {
    hash = (hash << 5) - hash + todayStr.charCodeAt(i);
    hash |= 0; 
  }
  const dayIndex = Math.abs(hash);
  return GLIMMER_PROMPTS[dayIndex % GLIMMER_PROMPTS.length];
}

// ── Gentle Support Message ──────────────────────────────────────────────────

export const GENTLE_SUPPORT_MESSAGE = {
  title: 'We see you',
  body: 'It looks like things have been heavy lately. That takes real strength to sit with. You don\'t have to figure it all out right now.',
  cta: 'Got it',
};
