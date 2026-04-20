import { findMoodRecall } from '../journalRecall';
import type { JournalEntry } from '../../storage/models';

const mockGetJournalEntries = jest.fn();

jest.mock('../../storage/localDb', () => ({
  localDb: { getJournalEntries: () => mockGetJournalEntries() },
}));

jest.mock('../../../utils/logger', () => ({
  logger: { error: jest.fn() },
}));

function makeEntry(overrides: Partial<JournalEntry>): JournalEntry {
  return {
    id: 'e1',
    date: '2025-01-01',
    mood: 'calm',
    moonPhase: 'new',
    content: 'Some content',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDeleted: false,
    ...overrides,
  };
}

// Pin "today" to a fixed date so daysAgo calculations are deterministic
const TODAY = '2025-04-19';
beforeAll(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(`${TODAY}T12:00:00Z`));
});
afterAll(() => jest.useRealTimers());

describe('findMoodRecall', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns null when there are no journal entries', async () => {
    mockGetJournalEntries.mockResolvedValue([]);
    const result = await findMoodRecall('calm');
    expect(result).toBeNull();
  });

  it('returns a matching past entry with correct daysAgo', async () => {
    const entry = makeEntry({ mood: 'calm', date: '2025-04-10', content: 'Felt peaceful' });
    mockGetJournalEntries.mockResolvedValue([entry]);

    const result = await findMoodRecall('calm');

    expect(result).not.toBeNull();
    expect(result!.entry.id).toBe('e1');
    expect(result!.daysAgo).toBe(9);
  });

  it('excludes entries for today', async () => {
    const todayEntry = makeEntry({ mood: 'heavy', date: TODAY });
    mockGetJournalEntries.mockResolvedValue([todayEntry]);

    const result = await findMoodRecall('heavy');
    expect(result).toBeNull();
  });

  it('excludes entries matching excludeDate', async () => {
    const entry = makeEntry({ mood: 'stormy', date: '2025-04-15' });
    mockGetJournalEntries.mockResolvedValue([entry]);

    const result = await findMoodRecall('stormy', '2025-04-15');
    expect(result).toBeNull();
  });

  it('excludes entries matching excludeId', async () => {
    const entry = makeEntry({ id: 'skip-me', mood: 'soft', date: '2025-04-12' });
    mockGetJournalEntries.mockResolvedValue([entry]);

    const result = await findMoodRecall('soft', undefined, 'skip-me');
    expect(result).toBeNull();
  });

  it('skips entries with no content', async () => {
    const emptyEntry = makeEntry({ mood: 'okay', date: '2025-04-12', content: '   ' });
    mockGetJournalEntries.mockResolvedValue([emptyEntry]);

    const result = await findMoodRecall('okay');
    expect(result).toBeNull();
  });

  it('returns null when no entry matches the mood', async () => {
    const entry = makeEntry({ mood: 'calm', date: '2025-04-12' });
    mockGetJournalEntries.mockResolvedValue([entry]);

    const result = await findMoodRecall('stormy');
    expect(result).toBeNull();
  });

  it('returns null and does not throw when localDb rejects', async () => {
    mockGetJournalEntries.mockRejectedValue(new Error('DB error'));

    const result = await findMoodRecall('calm');
    expect(result).toBeNull();
  });
});
