/**
 * reflectionInsights.ts
 *
 * Client-side service for AI-generated reflective copy
 * (Observations, Insights, What Restores You).
 *
 * ARCHITECTURE (secure):
 *   MySky app → Supabase Edge Function (reflection-insights)
 *             → Anthropic API
 *
 * The Anthropic API key lives ONLY in the Supabase Edge Function environment.
 * The client never sees it.
 *
 * Setup:
 *   1. Deploy the Edge Function:  supabase functions deploy reflection-insights
 *   2. Set the secret:            supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
 *   3. Add to .env:               EXPO_PUBLIC_REFLECTION_INSIGHTS_URL=https://<ref>.supabase.co/functions/v1/reflection-insights
 *                                  EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
 *
 * Caching: one API call per calendar day per meaningful change in input data,
 * stored in expo-secure-store.
 */

import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

// ─── Configuration ────────────────────────────────────────────────────────────

/**
 * Your Supabase Edge Function URL.
 * Set in .env as EXPO_PUBLIC_REFLECTION_INSIGHTS_URL
 */
const EDGE_FUNCTION_URL =
  process.env.EXPO_PUBLIC_REFLECTION_INSIGHTS_URL ?? '';

const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

// ─── Response type ────────────────────────────────────────────────────────────

export type ReflectionInsightsResponse = {
  observations: string[];
  insights: string[];
  restores: string[];
  micro_line: string;
};

/** Convenience alias used by growth.tsx */
export type ReflectionOutput = ReflectionInsightsResponse;

// ─── Payload type ─────────────────────────────────────────────────────────────

export type ReflectionInsightsPayload = {
  timeWindowLabel: string;
  mood: { trend: string; avg: number | null; delta: number | null };
  stress: { trend: string; avg: number | null; delta: number | null };
  energy: { trend: string; avg: number | null; delta: number | null };
  energyMood?: {
    correlation: number | null;
    interpretationHint?: string;
  };
  restores: {
    sampleSizeDays: number;
    top: Array<{ tag: string; label: string; liftMood: number }>;
    drains: Array<{ tag: string; label: string; liftMood: number }>;
  };
};

/** Convenience alias used by growth.tsx */
export type ReflectionPayload = ReflectionInsightsPayload;

// ─── Cache ────────────────────────────────────────────────────────────────────

const CACHE_PREFIX = 'mysky_reflection_insights_v2';

interface CacheEntry {
  date: string;
  inputHash: string;
  output: ReflectionInsightsResponse;
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${(value as unknown[]).map(stableStringify).join(',')}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map(k => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',')}}`;
}

async function sha256Hex(input: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, input);
}

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function readCache(payload: ReflectionInsightsPayload): Promise<ReflectionInsightsResponse | null> {
  try {
    const hash = await sha256Hex(stableStringify(payload));
    const raw = await SecureStore.getItemAsync(`${CACHE_PREFIX}:${todayKey()}:${hash}`);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    const out = entry.output;
    if (
      Array.isArray(out.observations) &&
      Array.isArray(out.insights) &&
      Array.isArray(out.restores) &&
      typeof out.micro_line === 'string'
    ) return out;
    return null;
  } catch {
    return null;
  }
}

async function writeCache(payload: ReflectionInsightsPayload, output: ReflectionInsightsResponse): Promise<void> {
  try {
    const hash = await sha256Hex(stableStringify(payload));
    const entry: CacheEntry = { date: todayKey(), inputHash: hash, output };
    await SecureStore.setItemAsync(`${CACHE_PREFIX}:${todayKey()}:${hash}`, JSON.stringify(entry));
  } catch {
    // non-critical — silently skip
  }
}

// ─── Response normalizer ──────────────────────────────────────────────────────

function normalizeResponse(raw: unknown): ReflectionInsightsResponse {
  const candidate = typeof raw === 'string' ? tryParseJson(raw) : raw;
  if (!candidate || typeof candidate !== 'object') throw new Error('reflectionInsights: empty or non-object response');
  const obj = candidate as Record<string, unknown>;
  // Accept { observations, insights, restores, micro_line } or { parsed: {...} } or { output: {...} }
  const inner = (obj.parsed ?? obj.output ?? obj) as Record<string, unknown>;
  if (
    Array.isArray(inner.observations) &&
    Array.isArray(inner.insights) &&
    Array.isArray(inner.restores) &&
    typeof inner.micro_line === 'string'
  ) {
    return {
      observations: (inner.observations as unknown[]).map(String),
      insights: (inner.insights as unknown[]).map(String),
      restores: (inner.restores as unknown[]).map(String),
      micro_line: String(inner.micro_line),
    };
  }
  throw new Error('reflectionInsights: response shape invalid');
}

function tryParseJson(text: string): unknown | null {
  try { return JSON.parse(text); } catch { return null; }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetches AI-generated reflective copy via the Supabase Edge Function.
 * Returns cached result if available for today + same payload hash.
 *
 * @param userAccessToken - The Supabase user's session access_token.
 *   Required because the Edge Function verifies JWT at the gateway level.
 *   Pass `null` to skip the call (returns a thrown error).
 *
 * Throws on network failure or bad response — caller should catch
 * and fall back to template text (keep `aiInsights` state as null).
 */
export async function generateReflectionInsights(
  payload: ReflectionInsightsPayload,
  userAccessToken?: string | null,
): Promise<ReflectionInsightsResponse> {
  // ── Return cached if available ──────────────────────────────────────────────
  const cached = await readCache(payload);
  if (cached) return cached;

  // ── Validate config ─────────────────────────────────────────────────────────
  if (!EDGE_FUNCTION_URL) {
    throw new Error(
      'reflectionInsights: EXPO_PUBLIC_REFLECTION_INSIGHTS_URL is not set. ' +
        'Configure your Supabase Edge Function URL in .env.',
    );
  }

  // ── Call the Edge Function ──────────────────────────────────────────────────
  const headers: Record<string, string> = {
    'content-type': 'application/json',
  };

  // The Supabase API gateway requires the anon key as `apikey` header
  if (SUPABASE_ANON_KEY) {
    headers['apikey'] = SUPABASE_ANON_KEY;
  }

  // The Edge Function requires a valid user JWT (verified by Supabase gateway).
  // If the caller provided a user access token, use it. Otherwise fall back to
  // the anon key (which will be rejected by JWT verification — this is intentional).
  const bearer = userAccessToken || SUPABASE_ANON_KEY;
  if (bearer) {
    headers['authorization'] = `Bearer ${bearer}`;
  }

  const res = await fetch(EDGE_FUNCTION_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    throw new Error(
      `reflectionInsights: Edge Function returned ${res.status}: ${errBody}`,
    );
  }

  const json = await res.json();

  // Check for application-level errors from the Edge Function
  if (json.error) {
    throw new Error(`reflectionInsights: ${json.error}`);
  }

  const output = normalizeResponse(json);
  await writeCache(payload, output);
  return output;
}

/** Legacy alias — kept for backward compatibility. */
export const getReflectionInsights = generateReflectionInsights;
