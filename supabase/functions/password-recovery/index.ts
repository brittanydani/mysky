/**
 * Supabase Edge Function: password-recovery
 *
 * Sends one-time email recovery codes and verifies them to set a new password.
 * Designed for native mobile flows where browser-based recovery links are awkward.
 *
 * Deploy:
 *   supabase functions deploy password-recovery --no-verify-jwt
 *
 * Required secrets:
 *   supabase secrets set RESEND_API_KEY=re_...
 *   supabase secrets set RECOVERY_EMAIL_FROM="MySky <auth@mysky.app>"
 *   supabase secrets set PASSWORD_RECOVERY_CODE_PEPPER=...
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";

const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") ?? "https://mysky.app";

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const CODE_TTL_MINUTES = 15;
const MAX_VERIFY_ATTEMPTS = 5;
const REQUEST_LIMIT_MAX = 3;
const REQUEST_LIMIT_WINDOW = "15 minutes";

type RequestAction =
  | { action: "request"; email: string }
  | { action: "verify"; email: string; code: string; newPassword: string };

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function generateRecoveryCode(): string {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return String(bytes[0] % 1_000_000).padStart(6, "0");
}

async function hashRecoveryCode(email: string, code: string, pepper: string): Promise<string> {
  const data = new TextEncoder().encode(`${normalizeEmail(email)}:${code}:${pepper}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

function validateBody(body: unknown): RequestAction {
  if (!body || typeof body !== "object") {
    throw new Error("Missing request body");
  }

  const payload = body as Record<string, unknown>;
  const action = payload.action;

  if (action === "request") {
    if (typeof payload.email !== "string" || !isValidEmail(payload.email.trim())) {
      throw new Error("Enter a valid email address.");
    }
    return { action, email: normalizeEmail(payload.email) };
  }

  if (action === "verify") {
    if (typeof payload.email !== "string" || !isValidEmail(payload.email.trim())) {
      throw new Error("Enter a valid email address.");
    }
    if (typeof payload.code !== "string" || payload.code.trim().length < 6) {
      throw new Error("Enter the 6-digit recovery code.");
    }
    if (typeof payload.newPassword !== "string" || payload.newPassword.length < 6) {
      throw new Error("Password must be at least 6 characters.");
    }
    return {
      action,
      email: normalizeEmail(payload.email),
      code: payload.code.trim(),
      newPassword: payload.newPassword,
    };
  }

  throw new Error("Unsupported action");
}

async function sendRecoveryEmail(email: string, code: string): Promise<void> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("RECOVERY_EMAIL_FROM");

  if (!apiKey || !from) {
    throw new Error("Password recovery email is not configured.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Your MySky recovery code",
      text: [
        "Use this one-time code to reset your MySky password:",
        "",
        `Recovery code: ${code}`,
        "",
        `This code expires in ${CODE_TTL_MINUTES} minutes.`,
        "If you did not request this, you can ignore this email.",
      ].join("\n"),
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111827; line-height: 1.5;">
          <p>Use this one-time code to reset your MySky password:</p>
          <p style="font-size: 32px; font-weight: 700; letter-spacing: 8px; margin: 24px 0;">${code}</p>
          <p>This code expires in ${CODE_TTL_MINUTES} minutes.</p>
          <p>If you did not request this, you can ignore this email.</p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Resend delivery failed:", errorText);
    throw new Error("Failed to send recovery email.");
  }
}

async function invalidateRecoveryCode(
  supabaseAdmin: ReturnType<typeof createClient>,
  codeId: number | null | undefined,
): Promise<void> {
  if (!codeId) return;

  await supabaseAdmin
    .from("password_recovery_codes")
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", codeId)
    .is("consumed_at", null);
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const payload = validateBody(await req.json());

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const pepper = Deno.env.get("PASSWORD_RECOVERY_CODE_PEPPER") ?? "";

    if (!supabaseUrl || !supabaseServiceKey || !pepper) {
      return jsonResponse({ error: "Password recovery is not configured." }, 503);
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    if (payload.action === "request") {
      const { data: allowed, error: limitError } = await supabaseAdmin.rpc(
        "check_password_recovery_request_limit",
        {
          p_identifier: payload.email,
          p_max_requests: REQUEST_LIMIT_MAX,
          p_window_interval: REQUEST_LIMIT_WINDOW,
        },
      );

      if (limitError) {
        console.error("Password recovery rate limit failed:", limitError.message);
        return jsonResponse({ ok: true });
      }

      if (allowed === false) {
        return jsonResponse({ ok: true });
      }

      const { data: userId, error: lookupError } = await supabaseAdmin.rpc(
        "find_auth_user_id_by_email",
        { p_email: payload.email },
      );

      if (lookupError) {
        console.error("Password recovery lookup failed:", lookupError.message);
        return jsonResponse({ error: "Password recovery is temporarily unavailable." }, 503);
      }

      if (!userId) {
        return jsonResponse({ ok: true });
      }

      const code = generateRecoveryCode();
      const codeHash = await hashRecoveryCode(payload.email, code, pepper);
      const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60_000).toISOString();

      await supabaseAdmin
        .from("password_recovery_codes")
        .update({ consumed_at: new Date().toISOString() })
        .eq("user_id", userId)
        .is("consumed_at", null);

      const { error: insertError } = await supabaseAdmin
        .from("password_recovery_codes")
        .insert({
          user_id: userId,
          email: payload.email,
          code_hash: codeHash,
          expires_at: expiresAt,
        });

      if (insertError) {
        console.error("Password recovery insert failed:", insertError.message);
        return jsonResponse({ error: "Password recovery is temporarily unavailable." }, 503);
      }

      try {
        await sendRecoveryEmail(payload.email, code);
      } catch (error) {
        await supabaseAdmin
          .from("password_recovery_codes")
          .update({ consumed_at: new Date().toISOString() })
          .eq("user_id", userId)
          .eq("email", payload.email)
          .eq("code_hash", codeHash)
          .is("consumed_at", null);
        throw error;
      }

      return jsonResponse({ ok: true });
    }

    const expectedHash = await hashRecoveryCode(payload.email, payload.code, pepper);
    const { data: consumeRows, error: consumeError } = await supabaseAdmin.rpc(
      "consume_password_recovery_code",
      {
        p_email: payload.email,
        p_code_hash: expectedHash,
        p_max_attempts: MAX_VERIFY_ATTEMPTS,
      },
    );

    if (consumeError) {
      console.error("Password recovery verify failed:", consumeError.message);
      return jsonResponse({ error: "Password recovery is temporarily unavailable." }, 503);
    }

    const consumeResult = consumeRows?.[0] as
      | { status?: string; user_id?: string | null; code_id?: number | null }
      | undefined;

    if (!consumeResult || consumeResult.status !== "verified" || !consumeResult.user_id) {
      return jsonResponse({ error: "That code is invalid or expired." }, 400);
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(consumeResult.user_id, {
      password: payload.newPassword,
    });

    if (updateError) {
      console.error("Password update failed:", updateError.message);
      await invalidateRecoveryCode(supabaseAdmin, consumeResult.code_id);
      return jsonResponse({ error: "Could not update password right now." }, 503);
    }

    await supabaseAdmin
      .from("password_recovery_codes")
      .update({ consumed_at: new Date().toISOString() })
      .eq("user_id", consumeResult.user_id)
      .is("consumed_at", null);

    return jsonResponse({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Password recovery failed.";
    return jsonResponse({ error: message }, 400);
  }
});