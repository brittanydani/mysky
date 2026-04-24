/**
 * Gemini Pattern Insights — AI-Enhanced Personal Patterns
 *
 * Takes the deterministic CrossRefInsight[] (data-backed pattern cards) and
 * the full SelfKnowledgeContext, then asks Gemini to rewrite each insight body
 * so it feels deeply personal, specific, and human — while preserving every
 * data point from the original.
 *
 * Design:
 *   - Supplements, never replaces: original insights are the fallback.
 *   - Caches results per calendar day + data hash so repeated screen focuses
 *     don't hit the API.
 *   - Follows the same HTTP / retry / rate-limit pattern as
 *     geminiDreamInterpretation.ts.
 *
 * Privacy:
 *   - Sends aggregated pattern data only — no raw journal text, no PII,
 *     no natal chart coordinates, no user identifiers.
 */

import { EncryptedAsyncStorage } from '../storage/encryptedAsyncStorage';
import { supabase } from '../../lib/supabase';
import { toLocalDateString } from '../../utils/dateUtils';
import { logger } from '../../utils/logger';
import type { CrossRefInsight } from '../../utils/selfKnowledgeCrossRef';
import type { SelfKnowledgeContext } from './selfKnowledgeContext';
import type { DailyCheckIn } from '../patterns/types';

// ─── Config ───────────────────────────────────────────────────────────────────

const MAX_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 800;
const RETRY_MAX_DELAY_MS = 6_000;
const CACHE_KEY = '@mysky:gemini_pattern_insights';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GeminiPatternResult {
  insights: { id: string; title?: string; body: string }[];
  generatedAt: string;
}

export interface GeminiInsightInput {
  id: string;
  source: string;
  title: string;
  body: string;
  isConfirmed: boolean;
}

interface CachedResult {
  cacheKey: string;
  result: GeminiPatternResult;
}

interface PatternInsightRequestPayload {
  insights: GeminiInsightInput[];
  modelTier?: 'free' | 'premium';
  profile: {
    dominantArchetype?: string;
    coreValues?: string[];
    cognitiveStyleSummary?: string;
    drains?: string[];
    restores?: string[];
    somaticPattern?: string;
    topRelationshipPatterns?: string[];
    secureGrowthPatterns?: string[];
    reflectionPractice?: string;
  };
  behavioral: {
    checkInCount: number;
    averageMood: number | null;
    averageStress: number | null;
    frequentTags: Array<{ tag: string; count: number }>;
  };
}

// ─── Cache ────────────────────────────────────────────────────────────────────

function buildCacheKey(payload: PatternInsightRequestPayload): string {
  const today = toLocalDateString();
  const contentHash = simpleHash(JSON.stringify(payload));
  return `${today}:${contentHash}`;
}

/** djb2 string hash — fast, low-collision fingerprint for cache keys */
function simpleHash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash |= 0; // Convert to 32-bit integer
  }
  return hash;
}

async function getCachedResult(cacheKey: string): Promise<GeminiPatternResult | null> {
  try {
    const raw = await EncryptedAsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached: CachedResult = JSON.parse(raw);
    if (cached.cacheKey === cacheKey) return cached.result;
  } catch { /* ignore */ }
  return null;
}

async function setCachedResult(cacheKey: string, result: GeminiPatternResult): Promise<void> {
  try {
    await EncryptedAsyncStorage.setItem(CACHE_KEY, JSON.stringify({ cacheKey, result }));
  } catch { /* ignore */ }
}

async function getGeminiPatternAccessToken(): Promise<string | null> {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      logger.warn('[GeminiPatterns] Failed to read Supabase session; using local pattern insights fallback.', error);
      return null;
    }

    const token = data.session?.access_token ?? null;
    return token;
  } catch (error) {
    logger.warn('[GeminiPatterns] Failed to read Supabase session; using local pattern insights fallback.', error);
    return null;
  }
}

// ─── Build Structured Payload ────────────────────────────────────────────────

// Resolve relationship pattern tag IDs (t1–t14) to human-readable labels
const PATTERN_TAG_LABELS: Record<string, string> = {
  t1: 'People-pleasing', t2: 'Fear of abandonment', t3: 'Rushing intimacy',
  t4: 'Caretaking others', t5: 'Over-explaining', t6: 'Avoidant when close',
  t7: 'Emotional withdrawal', t8: 'Hyper-independence', t9: 'Shutting down',
  t10: 'Fear of enmeshment', t11: 'Need for control', t12: 'Difficulty with boundaries',
  t13: 'Testing the relationship', t14: 'Perfectionism in love',
  s1: 'Asking for reassurance directly', s2: 'Expressing needs clearly',
  s3: 'Letting myself be seen', s4: 'Staying present in connection',
  s5: 'Receiving care without deflecting', s6: 'Holding boundaries calmly',
  s7: 'Repairing after disconnection', s8: 'Self-soothing instead of spiraling',
  s9: 'Tolerating uncertainty', s10: 'Staying open instead of shutting down',
};
function resolvePatternTag(tag: string): string {
  return PATTERN_TAG_LABELS[tag] ?? tag;
}

function buildPatternInsightPayload(
  insights: GeminiInsightInput[],
  context: SelfKnowledgeContext,
  checkIns: DailyCheckIn[],
  modelTier: 'free' | 'premium' = 'free',
): PatternInsightRequestPayload {
  const profile: PatternInsightRequestPayload['profile'] = {};

  if (context.archetypeProfile) {
    profile.dominantArchetype = context.archetypeProfile.dominant;
  }
  if (context.coreValues?.topFive.length) {
    profile.coreValues = context.coreValues.topFive;
  }
  if (context.cognitiveStyle) {
    const s = context.cognitiveStyle;
    const scope = s.scope <= 2 ? 'big-picture' : s.scope >= 4 ? 'detail-oriented' : 'balanced';
    const proc = s.processing <= 2 ? 'visual/spatial' : s.processing >= 4 ? 'verbal/analytical' : 'balanced';
    const dec = s.decisions <= 2 ? 'quick/intuitive' : s.decisions >= 4 ? 'careful/deliberate' : 'adaptive';
    profile.cognitiveStyleSummary = `${scope} thinker, ${proc} processor, ${dec} decider`;
  }
  if (context.triggers) {
    if (context.triggers.drains.length) profile.drains = context.triggers.drains;
    if (context.triggers.restores.length) profile.restores = context.triggers.restores;
  }
  if (context.somaticEntries.length > 0) {
    const regionCounts: Record<string, number> = {};
    const emotionCounts: Record<string, number> = {};
    const sensationCounts: Record<string, number> = {};
    for (const e of context.somaticEntries) {
      regionCounts[e.region] = (regionCounts[e.region] ?? 0) + 1;
      emotionCounts[e.emotion] = (emotionCounts[e.emotion] ?? 0) + 1;
      if (e.sensation) sensationCounts[e.sensation] = (sensationCounts[e.sensation] ?? 0) + 1;
    }
    const topRegion = Object.entries(regionCounts).sort((a, b) => b[1] - a[1])[0];
    const topEmotion = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0];
    const topSensation = Object.entries(sensationCounts).sort((a, b) => b[1] - a[1])[0];
    if (topRegion && topEmotion) {
      const sensationPart = topSensation ? `, top sensation: ${topSensation[0]}` : '';
      profile.somaticPattern = `${topEmotion[0]} most often held in ${topRegion[0]}${sensationPart} (${context.somaticEntries.length} entries)`;
    }
  }
  if (context.relationshipPatterns.length > 0) {
    const tagCounts: Record<string, number> = {};
    const secureTagCounts: Record<string, number> = {};
    const SECURE_IDS = new Set(['s1','s2','s3','s4','s5','s6','s7','s8','s9','s10']);
    for (const e of context.relationshipPatterns) {
      for (const t of e.tags) {
        if (SECURE_IDS.has(t)) secureTagCounts[t] = (secureTagCounts[t] ?? 0) + 1;
        else tagCounts[t] = (tagCounts[t] ?? 0) + 1;
      }
    }
    const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
    if (topTags.length) {
      profile.topRelationshipPatterns = topTags.map(([t, c]) => `${resolvePatternTag(t)} (${c}×)`);
    }
    const topSecure = Object.entries(secureTagCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
    if (topSecure.length) {
      profile.secureGrowthPatterns = topSecure.map(([t, c]) => `${resolvePatternTag(t)} (${c}×)`);
    }
  }
  if (context.dailyReflections) {
    const r = context.dailyReflections;
    profile.reflectionPractice = `${r.totalDays} days, ${r.totalAnswers} answers, ${r.streak}-day streak`;
  }

  if (checkIns.length > 0) {
    const moods = checkIns.map(c => c.moodScore).filter((v): v is number => v != null);
    const avgMood = moods.length
      ? Math.round((moods.reduce((a, b) => a + b, 0) / moods.length) * 10) / 10
      : null;

    const stressScores = checkIns.map(c => {
      if (c.stressLevel === 'low') return 2 as number;
      if (c.stressLevel === 'medium') return 5 as number;
      if (c.stressLevel === 'high') return 9 as number;
      return null;
    }).filter((v): v is number => v != null);
    const avgStress = stressScores.length
      ? Math.round((stressScores.reduce((a, b) => a + b, 0) / stressScores.length) * 10) / 10
      : null;

    const tagCounts: Record<string, number> = {};
    for (const c of checkIns) {
      for (const t of c.tags) tagCounts[t] = (tagCounts[t] ?? 0) + 1;
    }

    return {
      insights,
      modelTier,
      profile,
      behavioral: {
        checkInCount: checkIns.length,
        averageMood: avgMood,
        averageStress: avgStress,
        frequentTags: Object.entries(tagCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([tag, count]) => ({ tag, count })),
      },
    };
  }

  return {
    insights,
    modelTier,
    profile,
    behavioral: {
      checkInCount: 0,
      averageMood: null,
      averageStress: null,
      frequentTags: [],
    },
  };
}

// ─── Retry Helpers ────────────────────────────────────────────────────────────

function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function computeRetryDelayMs(attempt: number): number {
  const expDelay = Math.min(RETRY_BASE_DELAY_MS * 2 ** attempt, RETRY_MAX_DELAY_MS);
  const jitter = Math.floor(Math.random() * 250);
  return expDelay + jitter;
}

// ─── Client-side Rate Limiter ────────────────────────────────────────────────

const MIN_CALL_INTERVAL_MS = 10_000;
let lastCallTimestamp = 0;

// ─── Main API Call ────────────────────────────────────────────────────────────

/**
 * Enhance pattern insights with Gemini.
 *
 * Returns enhanced insights keyed by ID, or null if the API is unavailable,
 * rate-limited, or fails. Callers should always fall back to original insights.
 */
export async function enhancePatternInsights(
  insights: CrossRefInsight[],
  context: SelfKnowledgeContext,
  checkIns: DailyCheckIn[],
  isPremium = false,
): Promise<GeminiPatternResult | null> {
  return enhanceInsightCopy(
    insights.map((insight) => ({
      id: insight.id,
      source: insight.source,
      title: insight.title,
      body: insight.body,
      isConfirmed: insight.isConfirmed,
    })),
    context,
    checkIns,
    isPremium,
  );
}

export async function enhanceInsightCopy(
  insights: GeminiInsightInput[],
  context: SelfKnowledgeContext,
  checkIns: DailyCheckIn[],
  isPremium = false,
): Promise<GeminiPatternResult | null> {
  if (!insights.length) return null;

  const modelTier = isPremium ? 'premium' : 'free';
  const payload = buildPatternInsightPayload(insights, context, checkIns, modelTier);

  // ── Check cache ──
  const cacheKey = buildCacheKey(payload);
  const cached = await getCachedResult(cacheKey);
  if (cached) return cached;

  // The edge function requires an authenticated Supabase session.
  // This enhancement is optional, so signed-out users fall back to the
  // deterministic local insights without surfacing a runtime error.
  const accessToken = await getGeminiPatternAccessToken();
  if (!accessToken) {
    return null;
  }

  // ── Rate limit ──
  const now = Date.now();
  if (now - lastCallTimestamp < MIN_CALL_INTERVAL_MS) return null;
  lastCallTimestamp = now;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const { data, error } = await supabase.functions.invoke('pattern-insights', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: payload,
      });

      if (error) {
        const status = (error as any)?.context?.status ?? 0;
        const message = (error as any)?.message ?? String(error);
        const retriable = status === 0 || status === 408 || status === 503 || status >= 500;

        if (status === 401 || status === 403) {
          logger.warn('[GeminiPatterns] Edge function unauthorized; using local pattern insights fallback.');
          return null;
        }

        if (retriable && attempt < MAX_RETRIES) {
          await wait(computeRetryDelayMs(attempt));
          continue;
        }

        if (retriable) {
          logger.warn('[GeminiPatterns] Edge function unavailable; using local pattern insights fallback.', status, message);
          return null;
        }

        logger.error('[GeminiPatterns] Edge function error:', status, message);
        return null;
      }

      if (!data?.insights || !Array.isArray(data.insights)) {
        logger.error('[GeminiPatterns] Invalid response structure');
        return null;
      }

      const validInsights = data.insights.filter(
        (i: any) => typeof i?.id === 'string' && typeof i?.body === 'string' && i.body.trim().length > 0,
      ).map((i: any) => ({
        id: i.id,
        title: i.title,
        body: i.body,
      }));
      if (!validInsights.length) {
        logger.error('[GeminiPatterns] No valid insights in response');
        return null;
      }

      const result: GeminiPatternResult = {
        insights: validInsights,
        generatedAt: typeof data.generatedAt === 'string' ? data.generatedAt : new Date().toISOString(),
      };

      await setCachedResult(cacheKey, result);
      return result;
    } catch (error: any) {
      const isNetwork = error instanceof TypeError;
      if (isNetwork && attempt < MAX_RETRIES) {
        await wait(computeRetryDelayMs(attempt));
        continue;
      }
      logger.error('[GeminiPatterns] Request failed:', error?.message);
      return null;
    }
  }

  return null;
}
