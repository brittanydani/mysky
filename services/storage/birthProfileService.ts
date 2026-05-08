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
  profile: Partial<BirthProfileSync> | null;
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
  return isRecoverableBirthProfileSyncError(error);
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

function birthProfileFromFunctionProfile(profile: Partial<BirthProfileSync> | null): BirthProfileSync | null {
  if (!profile) return null;

  return {
    id: String(profile.id ?? profile.chartId ?? ''),
    chartId: String(profile.chartId ?? ''),
    name: profile.name ?? undefined,
    birthDate: String(profile.birthDate ?? ''),
    birthTime: profile.birthTime ?? undefined,
    hasUnknownTime: Boolean(profile.hasUnknownTime),
    birthPlace: String(profile.birthPlace ?? ''),
    latitude: Number(profile.latitude ?? 0),
    longitude: Number(profile.longitude ?? 0),
    timezone: profile.timezone ?? undefined,
    houseSystem: profile.houseSystem ?? undefined,
    createdAt: profile.createdAt,
    updatedAt: String(profile.updatedAt ?? new Date().toISOString()),
    isDeleted: Boolean(profile.isDeleted),
    deletedAt: profile.deletedAt,
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

  const match = candidate.birthDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    throw new Error('Birth date is invalid');
  }
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const birthDate = new Date(year, month, day);
  birthDate.setFullYear(year);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (
    Number.isNaN(birthDate.getTime()) ||
    birthDate.getFullYear() !== year ||
    birthDate.getMonth() !== month ||
    birthDate.getDate() !== day ||
    birthDate > today
  ) {
    throw new Error('Birth date is invalid');
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

function getFunctionHttpStatus(error: unknown): number | null {
  const context = (error as { context?: { status?: unknown } } | null)?.context;
  return typeof context?.status === 'number' ? context.status : null;
}

function isRecoverableBirthProfileSyncError(error: unknown): boolean {
  const candidate = error as NamedError | null;
  const status = getFunctionHttpStatus(error);
  const message = candidate?.message ?? '';

  if (candidate?.name === 'FunctionsFetchError' || candidate?.name === 'FunctionsRelayError') {
    return true;
  }

  if (candidate?.name === 'FunctionsHttpError') {
    return status === null || status === 404 || status >= 500;
  }

  return message.includes('Network request failed')
    || message.includes('Failed to fetch')
    || message.includes('fetch failed')
    || message.includes('Load failed')
    || message.includes('Fetch timeout');
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

async function invokeBirthProfileSyncRemote(
  action: 'getLatest' | 'upsert' | 'delete',
  payload: Record<string, unknown>,
): Promise<{ profile: BirthProfileSync | null }> {
  const session = await getSession();
  const token = session?.access_token;

  if (!token) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase.functions.invoke<BirthProfileFunctionResponse>(
    'birth-profile-sync',
    {
      body: { action, ...payload },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (error) throw error;

  if (!data || typeof data !== 'object' || !('profile' in data)) {
    throw new Error('Birth profile sync returned an invalid response');
  }

  return {
    profile: birthProfileFromFunctionProfile(data.profile),
  };
}

async function invokeBirthProfileSyncDirect(
  action: 'getLatest' | 'upsert' | 'delete',
  payload: Record<string, unknown>,
): Promise<{ profile: BirthProfileSync | null }> {
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

  if (!existing) {
    return { profile: tombstone };
  }

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
): Promise<{ profile: BirthProfileSync | null }> {
  try {
    return await invokeBirthProfileSyncRemote(action, payload);
  } catch (error) {
    if (isRecoverableBirthProfileSyncError(error)) {
      warnBirthProfileSyncUnavailable(error);
      return invokeBirthProfileSyncDirect(action, payload);
    }

    throw error;
  }
}
