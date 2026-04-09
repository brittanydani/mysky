/**
 * Gemini Dream Interpretation — AI-Enhanced Dream Insights
 *
 * Calls the dream-insights Supabase Edge Function, which owns the Gemini
 * prompt and model selection server-side. The client sends only structured
 * dream context and receives normalized JSON back.
 *
 * Designed to SUPPLEMENT — not replace — the existing on-device dream engine.
 *
 * Privacy:
 *   - Only the dream text + selected feelings are sent to Gemini.
 *   - No PII, no natal chart, no user identifiers.
 *   - The API key never leaves the server.
 *
 * Output: { paragraph, question } matching the shape consumed by the UI.
 */

import { logger } from '../../utils/logger';
import { supabase } from '../../lib/supabase';
import type { SelectedFeeling } from './dreamTypes';
import { FEELING_MAP } from './dreamTypes';

// ─── Config ───────────────────────────────────────────────────────────────────

const GEMINI_MODELS = {
  free: 'gemini-2.5-flash-lite',
  premium: 'gemini-2.5-flash',
} as const;
const MAX_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 800;
const RETRY_MAX_DELAY_MS = 6_000;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GeminiDreamResult {
  paragraph: string;
  question: string;
  generatedAt: string;
}

export interface GeminiDreamInput {
  dreamText: string;
  feelings?: SelectedFeeling[];
  modelTier?: GeminiDreamTier;
  /** Optional on-device interpretation to provide as additional context */
  onDeviceSummary?: string;
  /** Symbols extracted from the dream text by the on-device engine */
  symbols?: { word: string; category: string; description?: string }[];
  /** Interpretive themes derived from trigger analysis */
  interpretiveThemes?: string[];
  /** Pattern analysis from the on-device engine */
  patternAnalysis?: {
    primaryPattern: string;
    undercurrentLabel: string;
    endingType: string;
  };
}

export type GeminiDreamTier = keyof typeof GEMINI_MODELS;

/**
 * Compatibility helper for current UI/tests.
 * The server is now the authoritative source of the exact Gemini model used.
 */
export function getGeminiDreamModel(modelTier: GeminiDreamTier = 'free'): string {
  return GEMINI_MODELS[modelTier] ?? GEMINI_MODELS.free;
}

// ─── Availability ─────────────────────────────────────────────────────────────

/** Gemini is available only when the user has a valid Supabase session. */
export function isGeminiAvailable(hasAuthenticatedSession: boolean): boolean {
  return hasAuthenticatedSession;
}

interface DreamInsightRequestPayload {
  dreamText: string;
  modelTier: GeminiDreamTier;
  feelings: Array<{ id: string; label: string; intensity: number }>;
  symbols: Array<{ word: string; category: string; description?: string }>;
  interpretiveThemes: string[];
  patternAnalysis?: {
    primaryPattern: string;
    undercurrentLabel: string;
    endingType: string;
  };
  onDeviceSummary?: string;
}

function buildDreamInsightPayload(input: GeminiDreamInput): DreamInsightRequestPayload {
  return {
    dreamText: input.dreamText,
    modelTier: input.modelTier ?? 'free',
    feelings: (input.feelings ?? []).map((feeling) => {
      const def = FEELING_MAP[feeling.id];
      return {
        id: feeling.id,
        label: def?.label ?? feeling.id,
        intensity: feeling.intensity,
      };
    }),
    symbols: input.symbols ?? [],
    interpretiveThemes: input.interpretiveThemes ?? [],
    patternAnalysis: input.patternAnalysis,
    onDeviceSummary: input.onDeviceSummary,
  };
}

function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function computeRetryDelayMs(attempt: number): number {
  const expDelay = Math.min(RETRY_BASE_DELAY_MS * 2 ** attempt, RETRY_MAX_DELAY_MS);
  const jitter = Math.floor(Math.random() * 250);
  return expDelay + jitter;
}

function getFriendlyRateLimitMessage(): string {
  return 'AI insights are at capacity right now. Please wait a minute and try again.';
}

function getFriendlyAuthMessage(): string {
  return 'Sign in to use AI dream insights.';
}

async function getEdgeFunctionErrorDetails(error: unknown): Promise<{ status: number; message: string }> {
  const fallbackStatus = (error as any)?.context?.status ?? 0;
  const fallbackMessage = (error as any)?.message ?? String(error);
  const context = (error as any)?.context;

  if (!context || typeof context !== 'object') {
    return { status: fallbackStatus, message: fallbackMessage };
  }

  const responseLike = context as {
    status?: number;
    json?: () => Promise<unknown>;
    text?: () => Promise<string>;
    clone?: () => unknown;
    error?: string;
    message?: string;
  };

  const parsePayload = async (target: typeof responseLike): Promise<string | null> => {
    if (typeof target.json === 'function') {
      try {
        const payload = await target.json();
        if (payload && typeof payload === 'object') {
          const payloadError = (payload as { error?: unknown; message?: unknown }).error
            ?? (payload as { error?: unknown; message?: unknown }).message;
          if (typeof payloadError === 'string' && payloadError.trim().length > 0) {
            return payloadError;
          }
        }
      } catch {
        // Fall through to text parsing.
      }
    }

    if (typeof target.text === 'function') {
      try {
        const rawText = await target.text();
        if (!rawText) return null;
        try {
          const parsed = JSON.parse(rawText) as { error?: unknown; message?: unknown };
          const payloadError = parsed.error ?? parsed.message;
          if (typeof payloadError === 'string' && payloadError.trim().length > 0) {
            return payloadError;
          }
        } catch {
          return rawText.trim() || null;
        }
      } catch {
        return null;
      }
    }

    return null;
  };

  const cloned = typeof responseLike.clone === 'function'
    ? responseLike.clone() as typeof responseLike
    : responseLike;
  const payloadMessage = await parsePayload(cloned);
  const directMessage = typeof responseLike.error === 'string'
    ? responseLike.error
    : typeof responseLike.message === 'string'
      ? responseLike.message
      : null;

  return {
    status: responseLike.status ?? fallbackStatus,
    message: payloadMessage ?? directMessage ?? fallbackMessage,
  };
}

async function ensureGeminiDreamSession(): Promise<string> {
  try {
    const { data: current } = await supabase.auth.getSession();
    const token = current.session?.access_token;
    if (!token) {
      throw new Error(getFriendlyAuthMessage());
    }
    // Proactively refresh if the token is expired or expires within 60 seconds
    const expiresAt = current.session?.expires_at;
    if (expiresAt && expiresAt - Math.floor(Date.now() / 1000) < 60) {
      logger.info('[GeminiDream] Token expired or near-expiry, refreshing session...');
      const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError || !refreshed.session?.access_token) {
        logger.warn('[GeminiDream] Session refresh failed; AI dream insights unavailable.', refreshError);
        throw new Error(getFriendlyAuthMessage());
      }
      return refreshed.session.access_token;
    }

    return token;
  } catch (error) {
    if (error instanceof Error && error.message === getFriendlyAuthMessage()) {
      throw error;
    }
    logger.warn('[GeminiDream] Failed to read Supabase session; AI dream insights unavailable.', error);
    throw new Error(getFriendlyAuthMessage());
  }
}

// ─── Client-side Rate Limiter ────────────────────────────────────────────────

const MIN_CALL_INTERVAL_MS = 10_000; // 10 seconds between calls
let lastCallTimestamp = 0;

// ─── Gemini API Call ──────────────────────────────────────────────────────────

export async function generateGeminiDreamInterpretation(
  input: GeminiDreamInput,
): Promise<GeminiDreamResult> {
  if (!input.dreamText || input.dreamText.trim().length === 0) {
    throw new Error('Dream text is required for interpretation.');
  }

  const accessToken = await ensureGeminiDreamSession();

  const now = Date.now();
  if (now - lastCallTimestamp < MIN_CALL_INTERVAL_MS) {
    throw new Error(getFriendlyRateLimitMessage());
  }
  lastCallTimestamp = now;

  const payload = buildDreamInsightPayload(input);

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const { data, error } = await supabase.functions.invoke('dream-insights', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: payload,
      });

      if (error) {
        const { status, message } = await getEdgeFunctionErrorDetails(error);

        if (status === 401 || status === 403) {
          logger.warn('[GeminiDream] Edge function unauthorized; AI dream insights require sign-in.');
          throw new Error(getFriendlyAuthMessage());
        }

        logger.error('[GeminiDream] Edge function error:', status, message);

        if (status === 429) throw new Error(getFriendlyRateLimitMessage());

        const normalizedMessage = message.toLowerCase();
        if (normalizedMessage.includes('at capacity')) {
          throw new Error(getFriendlyRateLimitMessage());
        }
        if (normalizedMessage.includes('gemini api error: 404')) {
          throw new Error('AI insights are temporarily unavailable. Please try again soon.');
        }
        if (normalizedMessage.includes('gemini api error: 503')) {
          throw new Error('AI insights are temporarily unavailable. Please try again soon.');
        }

        const retriable = status === 0 || status === 408 || status === 503 || status >= 500;
        if (retriable && attempt < MAX_RETRIES) {
          await wait(computeRetryDelayMs(attempt));
          continue;
        }
        throw new Error(message);
      }

      if (!data?.paragraph || !data?.question) {
        throw new Error('Invalid response structure from Gemini');
      }

      return {
        paragraph: String(data.paragraph),
        question: String(data.question),
        generatedAt: typeof data.generatedAt === 'string' ? data.generatedAt : new Date().toISOString(),
      };
    } catch (error: any) {
      // Don't retry user-facing errors or exhausted retries
      const isNetwork = error instanceof TypeError;
      if (isNetwork && attempt < MAX_RETRIES) {
        await wait(computeRetryDelayMs(attempt));
        continue;
      }
      if (isNetwork) {
        throw new Error('Could not reach AI insights. Please check your connection and try again.');
      }
      throw error;
    }
  }

  throw new Error('AI insights are temporarily unavailable. Please try again soon.');
}
