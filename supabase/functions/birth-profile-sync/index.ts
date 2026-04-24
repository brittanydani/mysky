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

  return sanitizeLegacyRow(row);
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

      const createdAt = existing?.createdAt ?? profile.createdAt ?? new Date().toISOString();
      const birthTimeValue = profile.birthTime
        ? (profile.birthTime.length === 5 ? `${profile.birthTime}:00` : profile.birthTime)
        : null;

      const { error } = await admin.from("birth_profiles").upsert(
        {
          id: user.id,
          user_id: user.id,
          chart_id: profile.chartId,
          name: profile.name ?? null,
          birth_date: profile.birthDate,
          birth_time: birthTimeValue,
          birth_place: profile.birthPlace,
          latitude: profile.latitude,
          longitude: profile.longitude,
          timezone: profile.timezone ?? null,
          house_system: profile.houseSystem ?? null,
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
          name: existing?.name ?? null,
          birth_date: existing?.birthDate || null,
          birth_time: existing?.birthTime
            ? (existing.birthTime.length === 5 ? `${existing.birthTime}:00` : existing.birthTime)
            : null,
          birth_place: existing?.birthPlace || null,
          latitude: existing?.latitude ?? null,
          longitude: existing?.longitude ?? null,
          timezone: existing?.timezone ?? null,
          house_system: existing?.houseSystem ?? null,
          has_unknown_time: existing?.hasUnknownTime ?? false,
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
