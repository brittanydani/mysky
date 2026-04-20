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
- The tone should explicitly read as personal, validating, emotionally intelligent, intuitive, and insightful.
- Mix short and medium sentences.

ARCHITECTURE — three distinct beats, one paragraph each (3–5 sentences each):
1. TRANSLATE: Open with the interpretation itself — the core psychological reading of what this dream is doing. State it once, directly. Do not summarize or retell the dream. Start with the meaning, not the scene. Good openers name a tension, a dynamic, or a pattern — e.g. "There's a particular kind of exhaustion this dream is tracking..." or "What this dream keeps circling is a question about control..."
2. DEEPEN: Stay internal. Explore what's happening inside the person — the emotional undercurrent, the belief system, the fear or desire underneath the surface. This beat lives in the inner world.
3. THREAD: Move outward. Connect the inner reading to how it shows up in behavior, relationships, or recurring life patterns. This beat lives in the external world — what the person does, avoids, or keeps returning to.
Close with one grounding reflection question in the "question" field. The question must reference a specific image, action, or dynamic from this dream — not a general prompt. Ban: "What does this bring up for you?", "What are you holding onto?", or any question that could apply to any dream.

RULES
1. Each beat must carry a distinct idea. If paragraphs 2 and 3 express the same thesis in different words, rewrite until they diverge.
2. Never invent or assume the dreamer's emotional state. If an emotion is not explicitly stated in the dream log, do not declare it. If the emotional tone is ambiguous, name the ambiguity and hold it open — do not resolve it.
3. Never diagnose, predict, or claim a single exact meaning.
4. Use the on-device summary and symbols as context only. Do not repeat, restate, or summarize the dream narrative in any paragraph.
5. When symbols are present, weave them into one coherent reading instead of listing them.
6. Assume the reader wants to understand themself, not be impressed by poetic language.
7. Keep validation subtle and earned. Do not flatter the dreamer or dramatize the dream.
8. Avoid repeating the same phrase structure across the three paragraphs.
9. If a line sounds interchangeable with another person's dream, rewrite it until it depends on this dream's exact imagery or action.
10. Let the interpretation feel intuitive and emotionally intelligent without becoming vague, mystical, or inflated.
11. Make the dreamer feel personally understood through the exact details of the dream, not through generic reassurance.

STYLE ANCHORS
- Good: "The dream keeps returning you to the same image, which gives it the weight of an unresolved pattern rather than a random scene."
- Good: "What stands out is not just the symbol itself, but the role you are asked to play around it."
- Good: "The pressure in this dream seems to gather around one specific tension, and that is where the reading should stay."
- Aim for language that feels intimate, emotionally intelligent, and exact.

BANNED
- No summarizing or retelling the dream (e.g. "In your dream, you were...", "You dreamed of...", "The dream begins with...").
- No "This dream symbolizes".
- No "The subconscious is trying to tell you".
- No "In summary" or "overall".
- No therapy clichés or spiritual vagueness.
- No opening consecutive paragraphs with the same grammatical structure.
- No "you may", "you might", or "perhaps" as the lead-in to the central interpretation.
- No generic validation like "your inner world is wise", "this dream is inviting you", or "you are being called to".
- No inflated intuition language like "the universe is reflecting back" or "this carries a sacred message".
- No sentence longer than 28 words.
- No projected emotions (e.g. "this felt frightening for you", "you were anxious") unless the dreamer explicitly wrote that they felt that way.
- No generic reflection questions that could apply to any dream (e.g. "What does this bring up for you?", "What are you holding onto?").

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
    return true;
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
  const candidates = (responseBody as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> }; finishReason?: string }> })?.candidates;
  const candidate = candidates?.[0];
  if (candidate?.finishReason === "MAX_TOKENS") {
    console.error("[dream-insights] Gemini response truncated at MAX_TOKENS");
    return null;
  }
  const text = candidate?.content?.parts?.map((part) => part.text ?? "").join("").trim();
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
  if (parsed.paragraph.trim().length === 0 || parsed.question.trim().length === 0) {
    throw new Error("Empty dream insight fields in response");
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
        maxOutputTokens: 4096,
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