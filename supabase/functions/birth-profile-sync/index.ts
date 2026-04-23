import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "https://mysky.app",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface BirthProfilePayload {
  chartId: string;
  name?: string | null;
  birthDate: string;
  birthTime?: string | null;
  hasUnknownTime: boolean;
  birthPlace: string;
  latitude: number;
  longitude: number;
  timezone?: string | null;
  houseSystem?: string | null;
  createdAt?: string;
  updatedAt: string;
  isDeleted: boolean;
  deletedAt?: string | null;
}

interface RequestBody {
  action: "getLatest" | "upsert" | "delete";
  since?: string;
  profile?: BirthProfilePayload;
  chartId?: string | null;
  updatedAt?: string;
  deletedAt?: string | null;
}

const textEncoder = new TextEncoder();
let cachedKeyPromise: Promise<CryptoKey> | null = null;

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function toCryptoBytes(bytes: Uint8Array): Uint8Array<ArrayBuffer> {
  const arrayBuffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;

  return new Uint8Array(arrayBuffer);
}

async function getEncryptionKey(): Promise<CryptoKey> {
  if (!cachedKeyPromise) {
    cachedKeyPromise = (async () => {
      const secret = Deno.env.get("BIRTH_PROFILE_ENCRYPTION_KEY");
      if (!secret) throw new Error("BIRTH_PROFILE_ENCRYPTION_KEY secret is not set");

      const secretBytes = toCryptoBytes(textEncoder.encode(secret));
      const digest = await crypto.subtle.digest("SHA-256", secretBytes);

      return await crypto.subtle.importKey(
        "raw",
        digest,
        "AES-GCM",
        false,
        ["encrypt", "decrypt"],
      );
    })();
  }

  return cachedKeyPromise;
}

async function encryptProfile(profile: BirthProfilePayload): Promise<string> {
  const key = await getEncryptionKey();
  const iv = toCryptoBytes(crypto.getRandomValues(new Uint8Array(12)));
  const plaintext = toCryptoBytes(textEncoder.encode(JSON.stringify(profile)));

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    plaintext,
  );

  const ciphertext = new Uint8Array(encryptedBuffer);
  return `${toBase64(iv)}:${toBase64(ciphertext)}`;
}

async function decryptProfile(payload: string): Promise<BirthProfilePayload> {
  const key = await getEncryptionKey();
  const [ivBase64, cipherBase64] = payload.split(":");
  if (!ivBase64 || !cipherBase64) throw new Error("Invalid encrypted birth profile payload");

  const iv = toCryptoBytes(fromBase64(ivBase64));
  const ciphertext = toCryptoBytes(fromBase64(cipherBase64));

  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext,
  );

  return JSON.parse(new TextDecoder().decode(plaintext)) as BirthProfilePayload;
}

function sanitizeLegacyRow(row: Record<string, unknown>): BirthProfilePayload {
  return {
    chartId: String(row.chart_id ?? ""),
    name: row.name != null ? String(row.name) : null,
    birthDate: String(row.birth_date ?? ""),
    birthTime: row.birth_time != null ? String(row.birth_time) : null,
    hasUnknownTime: Boolean(row.has_unknown_time),
    birthPlace: String(row.birth_place ?? ""),
    latitude: Number(row.latitude ?? 0),
    longitude: Number(row.longitude ?? 0),
    timezone: row.timezone != null ? String(row.timezone) : null,
    houseSystem: row.house_system != null ? String(row.house_system) : null,
    createdAt: row.created_at != null ? String(row.created_at) : undefined,
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
    isDeleted: Boolean(row.is_deleted),
    deletedAt: row.deleted_at != null ? String(row.deleted_at) : null,
  };
}

function validateProfile(profile: BirthProfilePayload | undefined): BirthProfilePayload {
  if (!profile) throw new Error("Missing profile");
  if (!profile.chartId || !profile.birthDate || !profile.birthPlace) {
    throw new Error("Birth profile is missing required fields");
  }
  if (!Number.isFinite(profile.latitude) || !Number.isFinite(profile.longitude)) {
    throw new Error("Birth profile coordinates are invalid");
  }
  return profile;
}

async function getUser(req: Request) {
  const authHeader = req.headers.get("authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) throw new Error("Missing authorization header");

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } },
  );
  const {
    data: { user },
    error,
  } = await supabaseClient.auth.getUser();
  if (error || !user) throw new Error("Unauthorized");
  return user;
}

function getAdminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );
}

async function readLatestRow(admin: ReturnType<typeof createClient>, userId: string) {
  const { data, error } = await admin
    .from("birth_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as Record<string, unknown> | null;
}

async function materializeProfile(
  admin: ReturnType<typeof createClient>,
  row: Record<string, unknown> | null,
): Promise<BirthProfilePayload | null> {
  if (!row) return null;

  if (row.profile_enc) {
    const decrypted = await decryptProfile(String(row.profile_enc));
    return {
      ...decrypted,
      createdAt: String(row.created_at ?? decrypted.createdAt ?? decrypted.updatedAt),
      updatedAt: String(row.updated_at ?? decrypted.updatedAt),
      isDeleted: Boolean(row.is_deleted),
      deletedAt: row.deleted_at != null ? String(row.deleted_at) : decrypted.deletedAt ?? null,
    };
  }

  const legacy = sanitizeLegacyRow(row);
  const encrypted = await encryptProfile(legacy);
  const { error } = await admin
    .from("birth_profiles")
    .update({
      profile_enc: encrypted,
      name: null,
      birth_date: null,
      birth_time: null,
      birth_place: null,
      latitude: null,
      longitude: null,
      timezone: null,
      house_system: null,
    })
    .eq("user_id", row.user_id as string);
  if (error) throw error;
  return legacy;
}

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
    const user = await getUser(req);
    const admin = getAdminClient();
    const body = await req.json() as RequestBody;

    if (body.action === "getLatest") {
      const row = await readLatestRow(admin, user.id);
      const profile = await materializeProfile(admin, row);

      if (!profile || (body.since && profile.updatedAt <= body.since)) {
        return new Response(JSON.stringify({ profile: null }), {
          headers: { ...corsHeaders, "content-type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ profile }), {
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    if (body.action === "upsert") {
      const profile = validateProfile(body.profile);
      const existingRow = await readLatestRow(admin, user.id);
      const existing = await materializeProfile(admin, existingRow);

      if (
        existing &&
        existing.updatedAt > profile.updatedAt &&
        existing.chartId === profile.chartId
      ) {
        return new Response(JSON.stringify({ profile: existing }), {
          headers: { ...corsHeaders, "content-type": "application/json" },
        });
      }

      const encrypted = await encryptProfile(profile);
      const createdAt = existing?.createdAt ?? profile.createdAt ?? new Date().toISOString();

      const { error } = await admin.from("birth_profiles").upsert(
        {
          id: user.id,
          user_id: user.id,
          chart_id: profile.chartId,
          profile_enc: encrypted,
          name: null,
          birth_date: null,
          birth_time: null,
          birth_place: null,
          latitude: null,
          longitude: null,
          timezone: null,
          house_system: null,
          has_unknown_time: profile.hasUnknownTime,
          is_deleted: false,
          deleted_at: null,
          created_at: createdAt,
          updated_at: profile.updatedAt,
        },
        { onConflict: "user_id" },
      );
      if (error) throw error;

      return new Response(JSON.stringify({ profile: { ...profile, createdAt } }), {
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    if (body.action === "delete") {
      const deleteUpdatedAt = body.updatedAt ?? new Date().toISOString();
      const existingRow = await readLatestRow(admin, user.id);
      const existing = await materializeProfile(admin, existingRow);

      if (existing && existing.updatedAt > deleteUpdatedAt) {
        return new Response(JSON.stringify({ profile: existing }), {
          headers: { ...corsHeaders, "content-type": "application/json" },
        });
      }

      const createdAt = existing?.createdAt ?? new Date().toISOString();
      const tombstone: BirthProfilePayload = {
        chartId: body.chartId ?? existing?.chartId ?? user.id,
        birthDate: existing?.birthDate ?? "",
        hasUnknownTime: existing?.hasUnknownTime ?? false,
        birthPlace: existing?.birthPlace ?? "",
        latitude: existing?.latitude ?? 0,
        longitude: existing?.longitude ?? 0,
        updatedAt: deleteUpdatedAt,
        createdAt,
        isDeleted: true,
        deletedAt: body.deletedAt ?? new Date().toISOString(),
      };

      const { error } = await admin.from("birth_profiles").upsert(
        {
          id: user.id,
          user_id: user.id,
          chart_id: tombstone.chartId,
          profile_enc: null,
          name: null,
          birth_date: null,
          birth_time: null,
          birth_place: null,
          latitude: null,
          longitude: null,
          timezone: null,
          house_system: null,
          has_unknown_time: false,
          is_deleted: true,
          deleted_at: tombstone.deletedAt,
          created_at: createdAt,
          updated_at: tombstone.updatedAt,
        },
        { onConflict: "user_id" },
      );
      if (error) throw error;

      return new Response(JSON.stringify({ profile: tombstone }), {
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unsupported action" }), {
      status: 400,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status =
      message === "Unauthorized" || message === "Missing authorization header" ? 401 : 500;

    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }
});
