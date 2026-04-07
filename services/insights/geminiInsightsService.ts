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

const GEMINI_MODEL = 'gemini-2.5-flash-lite';
const MAX_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 800;
const RETRY_MAX_DELAY_MS = 6_000;
const CACHE_KEY = '@mysky:gemini_pattern_insights';

// ─── System Prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are the inner voice of a personal growth app that knows this person deeply — their patterns, their data, their inner world. You are rewriting pattern insight cards to feel specific, warm, and unmistakably personal.

═══ YOUR ROLE ═══

You receive a set of pattern insights (each with an ID, title, and current body text) along with the user's full self-knowledge profile and behavioral data. Your job: rewrite each insight's body text so the user thinks "wow, this app really knows me."

═══ VOICE ═══

Write like a close friend who also happens to be perceptive and psychologically literate. Not a therapist. Not a coach. Not a wellness influencer. A person who sees you clearly and says what they see — with care.

Second person ("you"). Warm. Direct. Human.

Mix short and long sentences. Let the writing breathe:
  ✓ "You've been carrying more than usual. The data shows it, but you probably already knew."
  ✓ "Conflict doesn't just bother you — it lingers. Your mood drops and stays down for the whole day."
  ✗ "Based on the data analysis, it appears that interpersonal conflict events correlate with a statistically significant decrease in your reported mood scores."

Vary sentence openings. Never start two consecutive sentences the same way.

═══ CRITICAL RULES ═══

1. PRESERVE EVERY DATA POINT from the original insight. If the original says "mood averaged 4.2" or "5 check-in days" or "1.3 points lower" — those exact numbers MUST appear in your rewrite. You are enhancing the language, not replacing the data.

2. MAKE CONNECTIONS across insights. You see the full picture — the archetype, the triggers, the values, the somatic map, the relationship patterns. When one insight explains or deepens another, weave that in. Example: if someone is a Caregiver archetype AND conflict is their top drain, connect those dots: "As someone who moves through the world by caring for others, conflict doesn't just stress you — it threatens the harmony you've built your identity around."

3. BE SPECIFIC TO THIS PERSON. Reference their actual values, their actual archetype, their actual patterns by name. Never be generic.

4. ADD ONE PERSONAL OBSERVATION per insight that the template couldn't generate — something that connects the dots in a way only a holistic view allows.

5. Each rewritten body should be 2–4 sentences. Concise but rich.

═══ BANNED PATTERNS ═══

Never use: journey, powerful, tapestry, delve, resonate, embrace, navigate, unpack, realm, beacon, pivotal, landscape (metaphorical), profound, intricate, embark, unveil, unlock, harness, "it's important to remember", "this suggests that", "in summary", "overall", "let's explore", "let's unpack".

Never stack hedges: use ONE hedge per clause maximum.
Never write a sentence longer than 30 words.
No bullet points. No numbered lists. Flowing prose only.

═══ RESPONSE FORMAT ═══

Return strict JSON. No markdown. No code fences. No extra text.
{
  "insights": [
    { "id": "insight-id-here", "body": "Your rewritten body text here." },
    ...
  ]
}

Return one entry per insight ID provided in the input. Preserve the exact IDs.`;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GeminiPatternResult {
  insights: { id: string; body: string }[];
  generatedAt: string;
}

interface CachedResult {
  cacheKey: string;
  result: GeminiPatternResult;
}

// ─── Cache ────────────────────────────────────────────────────────────────────

function buildCacheKey(insights: CrossRefInsight[]): string {
  const today = toLocalDateString();
  // Use a simple hash of each body so cache invalidates when numbers change
  const contentHash = insights
    .map(i => `${i.id}:${simpleHash(i.body)}:${i.isConfirmed}`)
    .sort()
    .join('|');
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

// ─── Build User Prompt ────────────────────────────────────────────────────────

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

function buildUserPrompt(
  insights: CrossRefInsight[],
  context: SelfKnowledgeContext,
  checkIns: DailyCheckIn[],
): string {
  const parts: string[] = [];

  // ── User profile summary ──
  const profile: string[] = [];

  if (context.archetypeProfile) {
    profile.push(`Dominant archetype: ${context.archetypeProfile.dominant}`);
  }
  if (context.coreValues?.topFive.length) {
    profile.push(`Core values (top 5): ${context.coreValues.topFive.join(', ')}`);
  }
  if (context.cognitiveStyle) {
    const s = context.cognitiveStyle;
    const scope = s.scope <= 2 ? 'big-picture' : s.scope >= 4 ? 'detail-oriented' : 'balanced';
    const proc = s.processing <= 2 ? 'visual/spatial' : s.processing >= 4 ? 'verbal/analytical' : 'balanced';
    const dec = s.decisions <= 2 ? 'quick/intuitive' : s.decisions >= 4 ? 'careful/deliberate' : 'adaptive';
    profile.push(`Cognitive style: ${scope} thinker, ${proc} processor, ${dec} decider`);
  }
  if (context.triggers) {
    if (context.triggers.drains.length) {
      profile.push(`Self-reported drains: ${context.triggers.drains.join(', ')}`);
    }
    if (context.triggers.restores.length) {
      profile.push(`Self-reported restores: ${context.triggers.restores.join(', ')}`);
    }
  }
  if (context.somaticEntries.length > 0) {
    const regionCounts: Record<string, number> = {};
    const emotionCounts: Record<string, number> = {};
    for (const e of context.somaticEntries) {
      regionCounts[e.region] = (regionCounts[e.region] ?? 0) + 1;
      emotionCounts[e.emotion] = (emotionCounts[e.emotion] ?? 0) + 1;
    }
    const topRegion = Object.entries(regionCounts).sort((a, b) => b[1] - a[1])[0];
    const topEmotion = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0];
    if (topRegion && topEmotion) {
      profile.push(`Somatic pattern: ${topEmotion[0]} most often held in ${topRegion[0]} (${context.somaticEntries.length} entries)`);
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
      profile.push(`Top relationship patterns: ${topTags.map(([t, c]) => `${resolvePatternTag(t)} (${c}×)`).join(', ')}`);
    }
    const topSecure = Object.entries(secureTagCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
    if (topSecure.length) {
      profile.push(`Secure growth patterns (integration evidence): ${topSecure.map(([t, c]) => `${resolvePatternTag(t)} (${c}×)`).join(', ')}`);
    }
  }
  if (context.dailyReflections) {
    const r = context.dailyReflections;
    profile.push(`Reflection practice: ${r.totalDays} days, ${r.totalAnswers} answers, ${r.streak}-day streak`);
  }

  if (profile.length) {
    parts.push(`USER PROFILE:\n${profile.join('\n')}`);
  }

  // ── Behavioral snapshot ──
  if (checkIns.length > 0) {
    const moods = checkIns.map(c => c.moodScore).filter((v): v is number => v != null);
    const avgMood = moods.length ? (moods.reduce((a, b) => a + b, 0) / moods.length).toFixed(1) : 'N/A';

    const stressScores = checkIns.map(c => {
      if (c.stressLevel === 'low') return 2 as number;
      if (c.stressLevel === 'medium') return 5 as number;
      if (c.stressLevel === 'high') return 9 as number;
      return null;
    }).filter((v): v is number => v != null);
    const avgStress = stressScores.length ? (stressScores.reduce((a, b) => a + b, 0) / stressScores.length).toFixed(1) : 'N/A';

    // Tag frequency
    const tagCounts: Record<string, number> = {};
    for (const c of checkIns) {
      for (const t of c.tags) tagCounts[t] = (tagCounts[t] ?? 0) + 1;
    }
    const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);

    const behavioral = [
      `Check-ins: ${checkIns.length} over the recent period`,
      `Average mood: ${avgMood}/10`,
      `Average stress: ${avgStress}/9`,
      topTags.length ? `Most frequent tags: ${topTags.map(([t, c]) => `${t} (${c}×)`).join(', ')}` : null,
    ].filter(Boolean);

    parts.push(`BEHAVIORAL DATA:\n${behavioral.join('\n')}`);
  }

  // ── Insights to rewrite ──
  const insightBlock = insights.map(i => {
    const confirmed = i.isConfirmed ? ' [DATA-CONFIRMED]' : ' [PROFILE-BASED]';
    return `ID: ${i.id}\nSource: ${i.source}\nTitle: ${i.title}${confirmed}\nCurrent body: ${i.body}`;
  }).join('\n\n');

  parts.push(`INSIGHTS TO REWRITE:\n\n${insightBlock}`);

  return parts.join('\n\n---\n\n');
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
): Promise<GeminiPatternResult | null> {
  if (!insights.length) return null;

  // ── Check cache ──
  const cacheKey = buildCacheKey(insights);
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
      const { data, error } = await supabase.functions.invoke('gemini-proxy', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: {
          model: GEMINI_MODEL,
          systemPrompt: SYSTEM_PROMPT,
          userPrompt: buildUserPrompt(insights, context, checkIns),
          generationConfig: {
            temperature: 0.75,
            maxOutputTokens: 2048,
            responseMimeType: 'application/json',
          },
        },
      });

      if (error) {
        const status = (error as any)?.context?.status ?? 0;
        const message = (error as any)?.message ?? String(error);

        if (status === 401 || status === 403) {
          logger.warn('[GeminiPatterns] Edge function unauthorized; using local pattern insights fallback.');
          return null;
        }

        logger.error('[GeminiPatterns] Edge function error:', status, message);

        const retriable = status === 0 || status === 408 || status === 503 || status >= 500;
        if (retriable && attempt < MAX_RETRIES) {
          await wait(computeRetryDelayMs(attempt));
          continue;
        }
        return null;
      }

      const text: string = data?.text;
      if (!text) {
        logger.error('[GeminiPatterns] No text in edge function response');
        return null;
      }

      let parsed: any;
      try {
        parsed = JSON.parse(text);
      } catch {
        logger.error('[GeminiPatterns] Malformed JSON from Gemini:', text.slice(0, 200));
        return null;
      }

      if (!parsed.insights || !Array.isArray(parsed.insights)) {
        logger.error('[GeminiPatterns] Invalid response structure');
        return null;
      }

      const validInsights = parsed.insights.filter(
        (i: any) => typeof i?.id === 'string' && typeof i?.body === 'string' && i.body.trim().length > 0,
      );
      if (!validInsights.length) {
        logger.error('[GeminiPatterns] No valid insights in response');
        return null;
      }

      const result: GeminiPatternResult = {
        insights: validInsights,
        generatedAt: new Date().toISOString(),
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
