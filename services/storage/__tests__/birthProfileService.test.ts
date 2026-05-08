const mockGetSession = jest.fn();
const mockInvoke = jest.fn();
const mockFrom = jest.fn();

jest.mock('../../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: mockGetSession,
    },
    functions: {
      invoke: mockInvoke,
    },
    from: mockFrom,
  },
}));

jest.mock('../../../utils/logger', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

import { invokeBirthProfileSync } from '../birthProfileService';

function mockSession(userId = 'user-123') {
  mockGetSession.mockResolvedValue({
    data: { session: { user: { id: userId }, access_token: 'token-123' } },
    error: null,
  });
}

function birthProfile(overrides: Record<string, unknown> = {}) {
  return {
    chartId: 'chart-1',
    name: 'Primary',
    birthDate: '1990-05-08',
    birthTime: '12:30',
    hasUnknownTime: false,
    birthPlace: 'Detroit, Michigan',
    latitude: 42.3314,
    longitude: -83.0458,
    timezone: 'America/Detroit',
    houseSystem: 'whole-sign',
    createdAt: '2026-05-08T12:00:00.000Z',
    updatedAt: '2026-05-08T12:00:00.000Z',
    isDeleted: false,
    ...overrides,
  };
}

function readQuery(data: unknown = null, error: unknown = null) {
  const query: any = {};
  Object.assign(query, {
    select: jest.fn(() => query),
    eq: jest.fn(() => query),
    maybeSingle: jest.fn().mockResolvedValue({ data, error }),
  });
  return query;
}

describe('birthProfileService sync path', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSession();
  });

  it('uses the birth-profile-sync edge function when available', async () => {
    const profile = birthProfile();
    mockInvoke.mockResolvedValue({
      data: { profile },
      error: null,
    });

    const result = await invokeBirthProfileSync('upsert', { profile });

    expect(mockInvoke).toHaveBeenCalledWith(
      'birth-profile-sync',
      expect.objectContaining({
        body: { action: 'upsert', profile },
        headers: { Authorization: 'Bearer token-123' },
      }),
    );
    expect(mockFrom).not.toHaveBeenCalled();
    expect(result.profile?.chartId).toBe('chart-1');
  });

  it('falls back to a direct Supabase upsert for recoverable edge-function failures', async () => {
    const profile = birthProfile();
    const functionError = new Error('Failed to fetch');
    functionError.name = 'FunctionsFetchError';
    const existingQuery = readQuery();
    const upsertQuery = {
      upsert: jest.fn().mockResolvedValue({ error: null }),
    };

    mockInvoke.mockResolvedValue({
      data: null,
      error: functionError,
    });
    mockFrom
      .mockReturnValueOnce(existingQuery)
      .mockReturnValueOnce(upsertQuery);

    const result = await invokeBirthProfileSync('upsert', { profile });

    expect(mockInvoke).toHaveBeenCalled();
    expect(upsertQuery.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-123',
        chart_id: 'chart-1',
        birth_date: '1990-05-08',
        birth_time: '12:30:00',
      }),
      { onConflict: 'user_id' },
    );
    expect(result.profile?.chartId).toBe('chart-1');
  });

  it('rejects impossible birth dates instead of saving through fallback', async () => {
    const profile = birthProfile({ birthDate: '2026-02-31' });
    const functionError = new Error('Failed to fetch');
    functionError.name = 'FunctionsFetchError';
    mockInvoke.mockResolvedValue({
      data: null,
      error: functionError,
    });

    await expect(invokeBirthProfileSync('upsert', { profile })).rejects.toThrow('Birth date is invalid');
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
