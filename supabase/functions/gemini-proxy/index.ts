/**
 * Supabase Edge Function: gemini-proxy
 *
 * Securely proxies requests to the Google Gemini API.
 * The GEMINI_API_KEY secret lives here — never in the client bundle.
 *
 * Deploy:
 *   supabase functions deploy gemini-proxy
 *
 * Set secret:
 *   supabase secrets set GEMINI_API_KEY=AIza...
 *
 * Test locally:
 *   supabase functions serve gemini-proxy --env-file .env.local
 *
 * Accepted body:
 * {
 *   model: string,                  // e.g. "gemini-2.5-flash-lite"
 *   systemPrompt: string,
 *   userPrompt: string,
 *   generationConfig?: object,      // temperature, maxOutputTokens, etc.
 * }
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";

// ─── CORS ──────────────────────────────────────────────────────────────────────

const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") ?? "https://mysky.app";

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ─── Config ────────────────────────────────────────────────────────────────────

const GEMINI_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/models";
const REQUEST_TIMEOUT_MS = 25_000;

// ─── Allowlisted models ────────────────────────────────────────────────────────
// Only fast/cheap models are permitted. Clients cannot target expensive models.

const ALLOWED_MODELS = new Set([
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
]);

const FALLBACK_MODELS: Record<string, string[]> = {
  "gemini-2.5-flash": ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"],
  "gemini-2.5-flash-lite": ["gemini-2.5-flash-lite", "gemini-2.0-flash-lite", "gemini-1.5-flash-8b"],
  "gemini-2.0-flash": ["gemini-2.0-flash", "gemini-1.5-flash"],
  "gemini-2.0-flash-lite": ["gemini-2.0-flash-lite", "gemini-1.5-flash-8b"],
  "gemini-1.5-flash": ["gemini-1.5-flash"],
  "gemini-1.5-flash-8b": ["gemini-1.5-flash-8b"],
};

// ─── Rate limiting ─────────────────────────────────────────────────────────────

const RATE_LIMIT_MAX = 20;        // max requests per window per user
const RATE_LIMIT_WINDOW = "1 hour";

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
    console.error("Gemini rate limit check failed:", error.code);
    return true;
  }

  return data === false;
}

// ─── Payload validation ────────────────────────────────────────────────────────

interface ProxyPayload {
  model: string;
  systemPrompt: string;
  userPrompt: string;
  generationConfig?: Record<string, unknown>;
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

const MAX_PROMPT_CHARS = 32_000; // ~8k tokens — well above app needs, blocks abuse

function validatePayload(body: unknown): ProxyPayload {
  if (!body || typeof body !== "object") throw new Error("Missing request body");
  const p = body as Record<string, unknown>;

  if (typeof p.model !== "string" || p.model.trim().length === 0) {
    throw new Error("Missing or invalid 'model'");
  }
  const model = p.model.trim();
  if (!ALLOWED_MODELS.has(model)) {
    throw new Error(`Model '${model}' is not permitted`);
  }
  if (typeof p.systemPrompt !== "string" || p.systemPrompt.trim().length === 0) {
    throw new Error("Missing 'systemPrompt'");
  }
  if (p.systemPrompt.length > MAX_PROMPT_CHARS) {
    throw new Error("systemPrompt exceeds maximum allowed length");
  }
  if (typeof p.userPrompt !== "string" || p.userPrompt.trim().length === 0) {
    throw new Error("Missing 'userPrompt'");
  }
  if (p.userPrompt.length > MAX_PROMPT_CHARS) {
    throw new Error("userPrompt exceeds maximum allowed length");
  }

  // Sanitize generationConfig: allow temperature override but cap maxOutputTokens
  // to prevent cost-abuse via artificially large requests.
  const MAX_OUTPUT_TOKENS = 4096;
  let generationConfig: Record<string, unknown> | undefined;
  if (p.generationConfig && typeof p.generationConfig === "object") {
    const cfg = p.generationConfig as Record<string, unknown>;
    generationConfig = { ...cfg };
    if (
      typeof generationConfig.maxOutputTokens === "number" &&
      generationConfig.maxOutputTokens > MAX_OUTPUT_TOKENS
    ) {
      generationConfig.maxOutputTokens = MAX_OUTPUT_TOKENS;
    }
  }

  return {
    model,
    systemPrompt: p.systemPrompt,
    userPrompt: p.userPrompt,
    generationConfig,
  };
}

// ─── Main handler ──────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  try {
    // ── Auth: validate the caller's Supabase session inside the function ─────
    // This function accepts modern user access tokens, so legacy-secret gateway
    // verification stays disabled and we verify the session with auth.getUser().
    const authHeader = req.headers.get("authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "content-type": "application/json" },
        },
      );
    }

    // Verify the user identity with the same user-token pattern used by the
    // other authenticated edge functions in this project.
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const userToken = authHeader.replace("Bearer ", "");

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(userToken);
    if (authError || !user) {
      console.error("[gemini-proxy] Auth failed:", authError?.message ?? "No user returned");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    // ── Rate limit ────────────────────────────────────────────────────────────
    const supabaseAdmin = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );
    if (await isRateLimited(supabaseAdmin, user.id)) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Try again later." }),
        {
          status: 429,
          headers: { ...corsHeaders, "content-type": "application/json" },
        },
      );
    }

    // ── Parse + validate ──────────────────────────────────────────────────────
    let payload: ProxyPayload;
    try {
      const body = await req.json();
      payload = validatePayload(body);
    } catch (e: unknown) {
      return new Response(
        JSON.stringify({ error: (e as Error).message }),
        {
          status: 400,
          headers: { ...corsHeaders, "content-type": "application/json" },
        },
      );
    }

    // ── API key (server-side secret only) ─────────────────────────────────────
    const apiKeys = getGeminiApiKeys();
    if (!apiKeys.length) {
      console.error("No Gemini API key secrets are set");
      return new Response(
        JSON.stringify({ error: "Gemini is not configured" }),
        {
          status: 503,
          headers: { ...corsHeaders, "content-type": "application/json" },
        },
      );
    }

    // ── Forward to Gemini ─────────────────────────────────────────────────────
    const geminiBody = {
      systemInstruction: {
        parts: [{ text: payload.systemPrompt }],
      },
      contents: [
        {
          parts: [{ text: payload.userPrompt }],
        },
      ],
      generationConfig: payload.generationConfig ?? {
        temperature: 0.7,
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
      },
    };

    const modelCandidates = FALLBACK_MODELS[payload.model] ?? [payload.model];
    let lastStatus = 502;
    let lastErrorText = "Unknown error";

    for (let keyIndex = 0; keyIndex < apiKeys.length; keyIndex += 1) {
      const apiKey = apiKeys[keyIndex];

      for (let modelIndex = 0; modelIndex < modelCandidates.length; modelIndex += 1) {
        const model = modelCandidates[modelIndex];
        const url = `${GEMINI_BASE_URL}/${model}:generateContent`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

        let geminiResponse: Response;
        try {
          geminiResponse = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": apiKey,
            },
            body: JSON.stringify(geminiBody),
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timeout);
        }

        if (geminiResponse.ok) {
          const data = await geminiResponse.json();

          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!text) {
            console.error("[gemini-proxy] Empty candidate in response:", JSON.stringify(data));
            return new Response(
              JSON.stringify({ error: "No content returned from Gemini" }),
              {
                status: 502,
                headers: { ...corsHeaders, "content-type": "application/json" },
              },
            );
          }

          return new Response(JSON.stringify({ text }), {
            status: 200,
            headers: { ...corsHeaders, "content-type": "application/json" },
          });
        }

        lastStatus = geminiResponse.status;
        lastErrorText = await geminiResponse.text().catch(() => "Unknown error");

        const hasNextAttempt = modelIndex < modelCandidates.length - 1 || keyIndex < apiKeys.length - 1;
        if (shouldTryFallbackStatus(geminiResponse.status) && hasNextAttempt) {
          console.warn("[gemini-proxy] Gemini request failed; trying fallback.", geminiResponse.status, { model, keyIndex });
          continue;
        }

        console.error(`[gemini-proxy] Gemini error ${geminiResponse.status}:`, lastErrorText);

        if (geminiResponse.status === 429) {
          return new Response(
            JSON.stringify({ error: "AI insights are at capacity right now. Please wait a minute and try again." }),
            {
              status: 429,
              headers: { ...corsHeaders, "content-type": "application/json" },
            },
          );
        }

        return new Response(
          JSON.stringify({ error: `Gemini API error: ${geminiResponse.status}` }),
          {
            status: 502,
            headers: { ...corsHeaders, "content-type": "application/json" },
          },
        );
      }
    }

    console.error(`[gemini-proxy] Gemini error ${lastStatus}:`, lastErrorText);
    if (lastStatus === 429) {
      return new Response(
        JSON.stringify({ error: "AI insights are at capacity right now. Please wait a minute and try again." }),
        {
          status: 429,
          headers: { ...corsHeaders, "content-type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({ error: `Gemini API error: ${lastStatus}` }),
      {
        status: 502,
        headers: { ...corsHeaders, "content-type": "application/json" },
      },
    );
  } catch (err: unknown) {
    console.error("[gemini-proxy] Unhandled error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "content-type": "application/json" },
      },
    );
  }
});
