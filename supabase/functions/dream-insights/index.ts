/**
 * Supabase Edge Function: dream-insights
 *
 * Owns the Gemini prompt and model selection for AI dream interpretations.
 * The client sends structured dream context and model tier only.
 * This keeps future prompt/model tuning server-side.
 *
 * Deploy:
 *   supabase functions deploy dream-insights
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";

const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") ?? "https://mysky.app";

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const REQUEST_TIMEOUT_MS = 25_000;
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW = "1 hour";
const MAX_PAYLOAD_BYTES = 64_000;
const GEMINI_MODELS = {
  free: ["gemini-2.5-flash-lite", "gemini-2.0-flash-lite", "gemini-1.5-flash-8b"],
  premium: ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"],
} as const;

const SYSTEM_PROMPT = `You are a dream interpreter for a personal growth app. Your approach is rooted in depth psychology, relational patterns, and somatic awareness, but you never name those frameworks.

VOICE
- Write like a thoughtful, perceptive person who sees the pattern quickly and says it clearly.
- Not a therapist. Not mystical. Not inflated.
- Second person. Warm. Grounded. Precise. Human.
- Mix short and medium sentences.

ARCHITECTURE — three distinct beats, one paragraph each:
1. MIRROR: Reflect the specific imagery, setting, and actions back to the dreamer. Stay entirely concrete. Do not interpret yet.
2. TRANSLATE: Offer exactly ONE clear psychological reading of the core metaphor. State it once, directly. Do not restate or echo this insight in any other paragraph.
3. THREAD: Connect that single insight to a broader pattern or quiet life tension the dream may be pointing toward.
Close with one grounding reflection question in the "question" field.

RULES
1. Each beat must carry a distinct idea. If paragraphs 2 and 3 express the same thesis in different words, rewrite until they diverge.
2. Never invent or assume the dreamer's emotional state. If an emotion is not explicitly stated in the dream log, do not declare it. If the emotional tone is ambiguous, ask rather than assert.
3. Never diagnose, predict, or claim a single exact meaning.
4. Build on the on-device summary when it exists instead of repeating it.
5. When symbols are present, weave them into one coherent reading instead of listing them.

BANNED
- No "This dream symbolizes".
- No "The subconscious is trying to tell you".
- No "In summary" or "overall".
- No therapy clichés or spiritual vagueness.
- No sentence longer than 28 words.
- No projected emotions (e.g. "this felt frightening for you", "you were anxious") unless the dreamer explicitly wrote that they felt that way.

Return strict JSON only:
{
  "paragraph": "Paragraph one...\\n\\nParagraph two...\\n\\nParagraph three...",
  "question": "Dream-specific reflection question"
}`;

interface DreamInsightRequestPayload {
  dreamText: string;
  modelTier: keyof typeof GEMINI_MODELS;
  feelings?: Array<{ id: string; label: string; intensity: number }>;
  symbols?: Array<{ word: string; category: string; description?: string }>;
  interpretiveThemes?: string[];
  patternAnalysis?: {
    primaryPattern: string;
    undercurrentLabel: string;
    endingType: string;
  };
  onDeviceSummary?: string;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });
}

function getGeminiApiKeys(): string[] {
  return [
    Deno.env.get("GEMINI_API_KEY"),
    Deno.env.get("GEMINI_API_KEY_SECONDARY"),
    Deno.env.get("GEMINI_API_KEY_TERTIARY"),
  ].filter((value, index, all): value is string => !!value && all.indexOf(value) === index);
}

function shouldTryFallbackStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

async function isRateLimited(
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string,
): Promise<boolean> {
  const { data, error } = await supabaseAdmin.rpc("check_gemini_rate_limit", {
    p_user_id: userId,
    p_max_requests: RATE_LIMIT_MAX,
    p_window_interval: RATE_LIMIT_WINDOW,
  });

  if (error) {
    console.error("Dream insights rate limit check failed:", error.code);
    return false;
  }

  return data === false;
}

function validatePayload(body: unknown): DreamInsightRequestPayload {
  if (!body || typeof body !== "object") {
    throw new Error("Missing request body");
  }

  const size = new TextEncoder().encode(JSON.stringify(body)).length;
  if (size > MAX_PAYLOAD_BYTES) {
    throw new Error("Request payload too large");
  }

  const payload = body as Record<string, unknown>;
  if (typeof payload.dreamText !== "string" || payload.dreamText.trim().length === 0) {
    throw new Error("Dream text is required");
  }

  const modelTier = payload.modelTier === "premium" ? "premium" : "free";
  return {
    dreamText: payload.dreamText,
    modelTier,
    feelings: Array.isArray(payload.feelings) ? payload.feelings as DreamInsightRequestPayload["feelings"] : [],
    symbols: Array.isArray(payload.symbols) ? payload.symbols as DreamInsightRequestPayload["symbols"] : [],
    interpretiveThemes: Array.isArray(payload.interpretiveThemes) ? payload.interpretiveThemes as string[] : [],
    patternAnalysis: payload.patternAnalysis && typeof payload.patternAnalysis === "object"
      ? payload.patternAnalysis as DreamInsightRequestPayload["patternAnalysis"]
      : undefined,
    onDeviceSummary: typeof payload.onDeviceSummary === "string" ? payload.onDeviceSummary : undefined,
  };
}

function buildUserPrompt(payload: DreamInsightRequestPayload): string {
  const parts: string[] = [];

  parts.push(`Dream narrative:\n"${payload.dreamText}"`);

  if (payload.feelings?.length) {
    parts.push(
      `Feelings during the dream: ${payload.feelings.map((feeling) => (
        feeling.intensity >= 4 ? `${feeling.label} (strong)` : feeling.label
      )).join(", ")}`,
    );
  }

  if (payload.symbols?.length) {
    parts.push(`Symbols identified in the dream:\n${payload.symbols.map((symbol) => (
      symbol.description
        ? `- ${symbol.word} (${symbol.category}): ${symbol.description}`
        : `- ${symbol.word} (${symbol.category})`
    )).join("\n")}`);
  }

  if (payload.interpretiveThemes?.length) {
    parts.push(`Interpretive themes: ${payload.interpretiveThemes.join(", ")}`);
  }

  if (payload.patternAnalysis) {
    parts.push(
      `Dream pattern: ${payload.patternAnalysis.primaryPattern} — undercurrent: ${payload.patternAnalysis.undercurrentLabel}, ending: ${payload.patternAnalysis.endingType}`,
    );
  }

  if (payload.onDeviceSummary) {
    parts.push(`Additional context from on-device analysis:\n${payload.onDeviceSummary}`);
  }

  return parts.join("\n\n");
}

function extractGeminiText(responseBody: unknown): string | null {
  const candidates = (responseBody as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> })?.candidates;
  const text = candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
  return text || null;
}

function parseGeminiJson(text: string): { paragraph: string; question: string } {
  let jsonText = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  const firstBrace = jsonText.indexOf("{");
  const lastBrace = jsonText.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    jsonText = jsonText.slice(firstBrace, lastBrace + 1);
  }

  const parsed = JSON.parse(jsonText) as { paragraph?: unknown; question?: unknown };
  if (typeof parsed.paragraph !== "string" || typeof parsed.question !== "string") {
    throw new Error("Invalid dream insight response structure");
  }

  return {
    paragraph: parsed.paragraph,
    question: parsed.question,
  };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const authHeader = req.headers.get("authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return jsonResponse({ error: "Missing authorization header" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const userToken = authHeader.replace("Bearer ", "");

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(userToken);
    if (authError || !user) {
      console.error("[dream-insights] Auth failed:", authError?.message ?? "No user returned");
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const supabaseAdmin = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );
    if (await isRateLimited(supabaseAdmin, user.id)) {
      return jsonResponse({ error: "AI insights are at capacity right now. Please wait a minute and try again." }, 429);
    }

    const payload = validatePayload(await req.json());

    const apiKeys = getGeminiApiKeys();
    if (!apiKeys.length) {
      console.error("No Gemini API key secrets are set");
      return jsonResponse({ error: "Gemini is not configured" }, 503);
    }

    const requestBody = {
      systemInstruction: {
        parts: [{ text: SYSTEM_PROMPT }],
      },
      contents: [
        {
          parts: [{ text: buildUserPrompt(payload) }],
        },
      ],
      generationConfig: {
        temperature: 0.35,
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
      },
    };

    const modelCandidates = GEMINI_MODELS[payload.modelTier];
    let lastStatus = 502;
    let lastResponseBody: unknown = null;

    for (let keyIndex = 0; keyIndex < apiKeys.length; keyIndex += 1) {
      const apiKey = apiKeys[keyIndex];

      for (let modelIndex = 0; modelIndex < modelCandidates.length; modelIndex += 1) {
        const model = modelCandidates[modelIndex];
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

        let geminiResponse: Response;
        try {
          geminiResponse = await fetch(`${GEMINI_BASE_URL}/${model}:generateContent`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": apiKey,
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timeout);
        }

        const responseBody = await geminiResponse.json().catch(() => null);
        if (geminiResponse.ok) {
          const text = extractGeminiText(responseBody);
          if (!text) {
            console.error("[dream-insights] No text returned from Gemini");
            return jsonResponse({ error: "No content returned from Gemini" }, 502);
          }

          const parsed = parseGeminiJson(text);
          return jsonResponse({
            paragraph: parsed.paragraph,
            question: parsed.question,
            generatedAt: new Date().toISOString(),
          });
        }

        lastStatus = geminiResponse.status >= 400 && geminiResponse.status < 600 ? geminiResponse.status : 502;
        lastResponseBody = responseBody;

        const hasNextAttempt = modelIndex < modelCandidates.length - 1 || keyIndex < apiKeys.length - 1;
        if (shouldTryFallbackStatus(geminiResponse.status) && hasNextAttempt) {
          console.warn("[dream-insights] Gemini request failed; trying fallback.", geminiResponse.status, { model, keyIndex });
          continue;
        }

        console.error("[dream-insights] Gemini API error:", geminiResponse.status, responseBody);
        if (lastStatus === 429) {
          return jsonResponse({ error: "AI insights are at capacity right now. Please wait a minute and try again." }, 429);
        }
        return jsonResponse({ error: `Gemini API error: ${geminiResponse.status}` }, lastStatus);
      }
    }

    console.error("[dream-insights] Gemini API error:", lastStatus, lastResponseBody);
    if (lastStatus === 429) {
      return jsonResponse({ error: "AI insights are at capacity right now. Please wait a minute and try again." }, 429);
    }
    return jsonResponse({ error: `Gemini API error: ${lastStatus}` }, lastStatus);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    console.error("[dream-insights] Unexpected error:", message);
    return jsonResponse({ error: message }, 500);
  }
});