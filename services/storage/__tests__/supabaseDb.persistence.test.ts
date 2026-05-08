const mockGetSession = jest.fn();
const mockFrom = jest.fn();

jest.mock('../../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: mockGetSession,
    },
    from: mockFrom,
    functions: {
      invoke: jest.fn(),
    },
  },
}));

jest.mock('../../../utils/withRetry', () => ({
  RETRY_PRESETS: {
    standard: {},
  },
  withRetry: jest.fn((operation: () => Promise<unknown>) => operation()),
}));

import { getJournalEntries, saveCheckIn, saveJournalEntry } from '../supabaseDb';
import type { JournalEntry } from '../models';
import type { DailyCheckIn } from '../../patterns/types';

function mockSession(userId = 'user-123') {
  mockGetSession.mockResolvedValue({
    data: { session: { user: { id: userId }, access_token: 'token' } },
    error: null,
  });
}

describe('supabaseDb persistence behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSession();
  });

  it('throws journal read errors instead of converting them to an empty archive', async () => {
    const dbError = new Error('database unavailable');
    const query: any = {};
    Object.assign(query, {
      select: jest.fn(() => query),
      eq: jest.fn(() => query),
      order: jest
        .fn()
        .mockReturnValueOnce(query)
        .mockResolvedValueOnce({ data: null, error: dbError }),
    });
    mockFrom.mockReturnValue(query);

    await expect(getJournalEntries()).rejects.toThrow('database unavailable');
  });

  it('does not report journal save success when Supabase rejects the write', async () => {
    const dbError = new Error('Network request failed');
    mockFrom.mockReturnValue({
      upsert: jest.fn().mockResolvedValue({ error: dbError }),
    });

    const entry: JournalEntry = {
      id: 'journal-1',
      date: '2026-05-08',
      mood: 'okay',
      moonPhase: 'new',
      title: 'Real save',
      content: 'This should only count if Supabase accepts it.',
      createdAt: '2026-05-08T12:00:00.000Z',
      updatedAt: '2026-05-08T12:00:00.000Z',
      isDeleted: false,
    };

    await expect(saveJournalEntry(entry)).rejects.toThrow('Network request failed');
  });

  it('does not report check-in save success when Supabase rejects the write', async () => {
    const dbError = new Error('Network request failed');
    const selectQuery: any = {
      select: jest.fn(() => selectQuery),
      eq: jest.fn(() => selectQuery),
      order: jest.fn(() => selectQuery),
      limit: jest.fn(() => selectQuery),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    };
    const upsertQuery = {
      upsert: jest.fn().mockResolvedValue({ error: dbError }),
    };
    mockFrom
      .mockReturnValueOnce(selectQuery)
      .mockReturnValueOnce(upsertQuery);

    const checkIn: DailyCheckIn = {
      id: 'checkin-1',
      date: '2026-05-08',
      chartId: 'chart-1',
      timeOfDay: 'morning',
      moodScore: 6,
      energyLevel: 'medium',
      stressLevel: 'low',
      tags: [],
      moonSign: 'unknown',
      moonHouse: 0,
      sunHouse: 0,
      transitEvents: [],
      lunarPhase: 'unknown',
      retrogrades: [],
      createdAt: '2026-05-08T12:00:00.000Z',
      updatedAt: '2026-05-08T12:00:00.000Z',
    };

    await expect(saveCheckIn(checkIn)).rejects.toThrow('Network request failed');
  });
});
