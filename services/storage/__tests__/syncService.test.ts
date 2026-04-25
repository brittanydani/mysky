import { enqueue, enqueueJournalEntry, enqueueCheckIn, invokeBirthProfileSync } from '../syncService';

const mockRunAsync = jest.fn().mockResolvedValue(undefined);
const mockGetDb = jest.fn().mockResolvedValue({ runAsync: mockRunAsync, getAllAsync: jest.fn().mockResolvedValue([]) });
const mockGetSession = jest.fn().mockResolvedValue({ data: { session: null } });
const mockInvoke = jest.fn();
const mockFrom = jest.fn().mockReturnValue({
  upsert: jest.fn().mockResolvedValue({ error: null }),
  delete: jest.fn().mockReturnValue({ in: jest.fn().mockResolvedValue({ error: null }) }),
});

jest.mock('../localDb', () => ({
  localDb: {
    getDb: () => mockGetDb(),
    initialize: jest.fn(),
  },
}));

jest.mock('../fieldEncryption', () => ({
  FieldEncryptionService: {
    decryptField: jest.fn().mockResolvedValue('5'),
  },
}));

jest.mock('../../../lib/supabase', () => ({
  supabase: {
    auth: { getSession: () => mockGetSession() },
    from: (...args: unknown[]) => mockFrom(...args),
    functions: { invoke: (...args: unknown[]) => mockInvoke(...args) },
  },
}));

jest.mock('../../../utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

// Suppress flushQueue timer side effects
jest.useFakeTimers();

describe('enqueue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockInvoke.mockResolvedValue({ data: null, error: null });
    mockFrom.mockReturnValue({
      upsert: jest.fn().mockResolvedValue({ error: null }),
      delete: jest.fn().mockReturnValue({ in: jest.fn().mockResolvedValue({ error: null }) }),
    });
  });

  it('inserts an item into the sync_queue with correct table and operation', async () => {
    await enqueue('journal_entries', 'entry-123', 'upsert', { mood: 'calm' });

    expect(mockRunAsync).toHaveBeenCalledTimes(1);
    const [sql, params] = mockRunAsync.mock.calls[0];
    expect(sql).toContain('INSERT OR REPLACE INTO sync_queue');
    expect(params[1]).toBe('journal_entries'); // table_name
    expect(params[2]).toBe('entry-123');       // record_id
    expect(params[3]).toBe('upsert');          // operation
    expect(JSON.parse(params[4])).toEqual({ mood: 'calm' }); // payload
  });

  it('does not throw when the db call fails', async () => {
    mockRunAsync.mockRejectedValueOnce(new Error('DB locked'));
    await expect(enqueue('sleep_entries', 'id-1', 'delete', {})).resolves.toBeUndefined();
  });
});

describe('enqueueJournalEntry', () => {
  beforeEach(() => jest.clearAllMocks());

  it('enqueues a journal entry without throwing', () => {
    expect(() =>
      enqueueJournalEntry({
        id: 'j-1',
        date: '2025-04-01',
        mood: 'calm',
        moonPhase: 'new',
        content: 'Test entry',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDeleted: false,
      }),
    ).not.toThrow();
  });
});

describe('enqueueCheckIn', () => {
  beforeEach(() => jest.clearAllMocks());

  it('enqueues a daily check-in without throwing', () => {
    expect(() =>
      enqueueCheckIn({
        id: 'ci-1',
        chartId: 'chart-1',
        date: '2025-04-01',
        timeOfDay: 'morning',
        moodScore: 7,
        energyLevel: 'high',
        stressLevel: 'low',
        tags: ['eq_grounded'],
        moonSign: 'Aries',
        moonHouse: 1,
        sunHouse: 10,
        transitEvents: [],
        lunarPhase: 'unknown',
        retrogrades: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    ).not.toThrow();
  });
});

describe('invokeBirthProfileSync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'user-1' } } } });
  });

  it('reads birth profiles directly from Supabase first', async () => {
    const maybeSingle = jest.fn().mockResolvedValue({
      data: {
        id: 'user-1',
        user_id: 'user-1',
        chart_id: 'chart-1',
        name: 'Brittany',
        birth_date: '1990-01-01',
        birth_time: '12:30:00',
        has_unknown_time: false,
        birth_place: 'Detroit, MI',
        latitude: 42.3314,
        longitude: -83.0458,
        timezone: 'America/Detroit',
        house_system: 'placidus',
        created_at: '2026-04-01T00:00:00.000Z',
        updated_at: '2026-04-02T00:00:00.000Z',
        is_deleted: false,
        deleted_at: null,
      },
      error: null,
    });
    const eq = jest.fn().mockReturnValue({ maybeSingle });
    const select = jest.fn().mockReturnValue({ eq });
    mockFrom.mockReturnValue({ select });

    await expect(
      invokeBirthProfileSync('getLatest', {}, { swallowUnavailableReadError: false }),
    ).resolves.toEqual({
      profile: {
        id: 'user-1',
        chartId: 'chart-1',
        name: 'Brittany',
        birthDate: '1990-01-01',
        birthTime: '12:30:00',
        hasUnknownTime: false,
        birthPlace: 'Detroit, MI',
        latitude: 42.3314,
        longitude: -83.0458,
        timezone: 'America/Detroit',
        houseSystem: 'placidus',
        createdAt: '2026-04-01T00:00:00.000Z',
        updatedAt: '2026-04-02T00:00:00.000Z',
        isDeleted: false,
        deletedAt: undefined,
      },
    });

    expect(mockFrom).toHaveBeenCalledWith('birth_profiles');
    expect(select).toHaveBeenCalledWith('*');
    expect(eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it('upserts birth profiles directly to Supabase first', async () => {
    const maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
    const upsert = jest.fn().mockResolvedValue({ error: null });
    mockFrom
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({ maybeSingle }),
        }),
      })
      .mockReturnValueOnce({ upsert });

    await expect(
      invokeBirthProfileSync('upsert', {
        profile: {
          id: 'chart-1',
          chartId: 'chart-1',
          name: 'Brittany',
          birthDate: '1990-01-01',
          birthTime: '12:30',
          hasUnknownTime: false,
          birthPlace: 'Detroit, MI',
          latitude: 42.3314,
          longitude: -83.0458,
          timezone: 'America/Detroit',
          houseSystem: 'placidus',
          createdAt: '2026-04-01T00:00:00.000Z',
          updatedAt: '2026-04-02T00:00:00.000Z',
          isDeleted: false,
        },
      }),
    ).resolves.toEqual({
      profile: expect.objectContaining({
        chartId: 'chart-1',
        createdAt: '2026-04-01T00:00:00.000Z',
        isDeleted: false,
      }),
    });

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'user-1',
        user_id: 'user-1',
        chart_id: 'chart-1',
        birth_time: '12:30:00',
      }),
      { onConflict: 'user_id' },
    );
    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it('uses the Edge Function only as a remote fallback when direct Supabase is unavailable', async () => {
    const directError = { message: 'Network request failed' };
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest.fn().mockResolvedValue({ data: null, error: directError }),
        }),
      }),
    });
    mockInvoke.mockResolvedValue({
      data: {
        profile: {
          chartId: 'chart-1',
          birthDate: '1990-01-01',
          hasUnknownTime: true,
          birthPlace: 'Detroit, MI',
          latitude: 42.3314,
          longitude: -83.0458,
          updatedAt: '2026-04-02T00:00:00.000Z',
          isDeleted: false,
        },
      },
      error: null,
    });

    await expect(invokeBirthProfileSync('getLatest')).resolves.toEqual({
      profile: expect.objectContaining({ chartId: 'chart-1' }),
    });

    expect(mockInvoke).toHaveBeenCalledWith('birth-profile-sync', {
      body: { action: 'getLatest' },
    });
  });
});
