import { supabase } from '../../lib/supabase';
import { logger } from '../../utils/logger';

export interface BirthProfileSync {
  id: string;
  chartId: string;
  createdAt?: string;
  updatedAt: string;
  isDeleted: boolean;
  name?: string;
  birthDate: string;
  birthTime?: string;
  hasUnknownTime: boolean;
  birthPlace: string;
  latitude: number;
  longitude: number;
  timezone?: string;
  houseSystem?: string;
  deletedAt?: string;
}

interface BirthProfileFunctionResponse {
  profile: BirthProfileSync | null;
}

interface NamedError {
  name?: string;
  message?: string;
}

type BirthProfileRow = Record<string, unknown>;

let didWarnBirthProfileSyncUnavailable = false;

async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export function isBirthProfileSyncUnavailableError(error: unknown): boolean {
  const candidate = error as NamedError | null;
  const message = candidate?.message ?? '';

  return candidate?.name === 'FunctionsHttpError'
    || candidate?.name === 'FunctionsFetchError'
    || candidate?.name === 'FunctionsRelayError'
    || message.includes('non-2xx status code')
    || message.includes('Network request failed')
    || message.includes('Failed to fetch')
    || message.includes('fetch failed')
    || message.includes('Load failed');
}

export function warnBirthProfileSyncUnavailable(error: unknown) {
  if (didWarnBirthProfileSyncUnavailable) return;

  didWarnBirthProfileSyncUnavailable = true;
  logger.warn(
    '[BirthProfileService] Birth profile remote access is unavailable or misconfigured.',
    error,
  );
}

function birthProfileFromRow(row: BirthProfileRow): BirthProfileSync {
  return {
    id: String(row.id ?? row.user_id ?? ''),
    chartId: String(row.chart_id ?? ''),
    name: row.name != null ? String(row.name) : undefined,
    birthDate: String(row.birth_date ?? ''),
    birthTime: row.birth_time != null ? String(row.birth_time) : undefined,
    hasUnknownTime: Boolean(row.has_unknown_time),
    birthPlace: String(row.birth_place ?? ''),
    latitude: Number(row.latitude ?? 0),
    longitude: Number(row.longitude ?? 0),
    timezone: row.timezone != null ? String(row.timezone) : undefined,
    houseSystem: row.house_system != null ? String(row.house_system) : undefined,
    createdAt: row.created_at != null ? String(row.created_at) : undefined,
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
    isDeleted: Boolean(row.is_deleted),
    deletedAt: row.deleted_at != null ? String(row.deleted_at) : undefined,
  };
}

function validateBirthProfilePayload(profile: unknown): BirthProfileSync {
  if (!profile || typeof profile !== 'object') {
    throw new Error('Missing profile');
  }

  const candidate = profile as BirthProfileSync;

  if (!candidate.chartId || !candidate.birthDate || !candidate.birthPlace) {
    throw new Error('Birth profile is missing required fields');
  }

  if (!Number.isFinite(candidate.latitude) || !Number.isFinite(candidate.longitude)) {
    throw new Error('Birth profile coordinates are invalid');
  }

  return candidate;
}

function normalizeBirthTimeForDb(value: string | undefined): string | null {
  if (!value) return null;
  return value.length === 5 ? `${value}:00` : value;
}

async function getBirthProfileUserId(): Promise<string> {
  const session = await getSession();
  const userId = session?.user?.id;

  if (!userId) {
    throw new Error('Not authenticated');
  }

  return userId;
}

async function readLatestBirthProfileDirect(userId: string): Promise<BirthProfileSync | null> {
  const { data, error } = await supabase
    .from('birth_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;

  return data ? birthProfileFromRow(data as BirthProfileRow) : null;
}

async function invokeBirthProfileSyncDirect(
  action: 'getLatest' | 'upsert' | 'delete',
  payload: Record<string, unknown>,
): Promise<BirthProfileFunctionResponse> {
  const userId = await getBirthProfileUserId();

  if (action === 'getLatest') {
    const profile = await readLatestBirthProfileDirect(userId);
    const since = typeof payload.since === 'string' ? payload.since : undefined;

    if (!profile || (since && profile.updatedAt <= since)) {
      return { profile: null };
    }

    return { profile };
  }

  if (action === 'upsert') {
    const profile = validateBirthProfilePayload(payload.profile);
    const existing = await readLatestBirthProfileDirect(userId);

    if (
      existing &&
      existing.updatedAt > profile.updatedAt &&
      existing.chartId === profile.chartId
    ) {
      return { profile: existing };
    }

    const createdAt = existing?.createdAt ?? profile.createdAt ?? new Date().toISOString();

    const { error } = await supabase.from('birth_profiles').upsert(
      {
        id: userId,
        user_id: userId,
        chart_id: profile.chartId,
        name: profile.name ?? null,
        birth_date: profile.birthDate,
        birth_time: normalizeBirthTimeForDb(profile.birthTime),
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
      { onConflict: 'user_id' },
    );

    if (error) throw error;

    return {
      profile: {
        ...profile,
        createdAt,
        isDeleted: false,
        deletedAt: undefined,
      },
    };
  }

  const deleteUpdatedAt = typeof payload.updatedAt === 'string'
    ? payload.updatedAt
    : new Date().toISOString();

  const existing = await readLatestBirthProfileDirect(userId);

  if (existing && existing.updatedAt > deleteUpdatedAt) {
    return { profile: existing };
  }

  const createdAt = existing?.createdAt ?? new Date().toISOString();
  const deletedAt = typeof payload.deletedAt === 'string'
    ? payload.deletedAt
    : new Date().toISOString();

  const tombstone: BirthProfileSync = {
    id: userId,
    chartId: typeof payload.chartId === 'string'
      ? payload.chartId
      : existing?.chartId ?? userId,
    name: existing?.name,
    birthDate: existing?.birthDate ?? '',
    birthTime: existing?.birthTime,
    hasUnknownTime: existing?.hasUnknownTime ?? false,
    birthPlace: existing?.birthPlace ?? '',
    latitude: existing?.latitude ?? 0,
    longitude: existing?.longitude ?? 0,
    timezone: existing?.timezone,
    houseSystem: existing?.houseSystem,
    updatedAt: deleteUpdatedAt,
    createdAt,
    isDeleted: true,
    deletedAt,
  };

  const { error } = await supabase.from('birth_profiles').upsert(
    {
      id: userId,
      user_id: userId,
      chart_id: tombstone.chartId,
      name: existing?.name ?? null,
      birth_date: existing?.birthDate || null,
      birth_time: normalizeBirthTimeForDb(existing?.birthTime),
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
    { onConflict: 'user_id' },
  );

  if (error) throw error;

  return { profile: tombstone };
}

export async function invokeBirthProfileSync(
  action: 'getLatest' | 'upsert' | 'delete',
  payload: Record<string, unknown> = {},
): Promise<BirthProfileFunctionResponse> {
  return invokeBirthProfileSyncDirect(action, payload);
}
