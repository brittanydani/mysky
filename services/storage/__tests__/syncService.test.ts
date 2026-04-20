import { enqueue, enqueueJournalEntry, enqueueCheckIn } from '../syncService';

const mockRunAsync = jest.fn().mockResolvedValue(undefined);
const mockGetDb = jest.fn().mockResolvedValue({ runAsync: mockRunAsync, getAllAsync: jest.fn().mockResolvedValue([]) });

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
    auth: { getSession: jest.fn().mockResolvedValue({ data: { session: null } }) },
    from: jest.fn().mockReturnValue({
      upsert: jest.fn().mockResolvedValue({ error: null }),
      delete: jest.fn().mockReturnValue({ in: jest.fn().mockResolvedValue({ error: null }) }),
    }),
    functions: { invoke: jest.fn() },
  },
}));

jest.mock('../../../utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

// Suppress flushQueue timer side effects
jest.useFakeTimers();

describe('enqueue', () => {
  beforeEach(() => jest.clearAllMocks());

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
