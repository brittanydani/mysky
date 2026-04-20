import {
  enqueueGeminiRequest,
  getPendingRequests,
  dequeueRequest,
  markAttempted,
  isNetworkError,
  type QueuedGeminiRequest,
} from '../geminiQueue';

const mockGetItem = jest.fn();
const mockSetItem = jest.fn();

jest.mock('../../storage/encryptedAsyncStorage', () => ({
  EncryptedAsyncStorage: {
    getItem: (...args: unknown[]) => mockGetItem(...args),
    setItem: (...args: unknown[]) => mockSetItem(...args),
  },
}));

jest.mock('../../../utils/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

function makeItem(overrides: Partial<QueuedGeminiRequest> = {}): QueuedGeminiRequest {
  return {
    id: 'test-id',
    type: 'dream-insights',
    payload: { dream: 'flying' },
    createdAt: new Date().toISOString(),
    attempts: 0,
    ...overrides,
  };
}

describe('enqueueGeminiRequest', () => {
  beforeEach(() => jest.clearAllMocks());

  it('adds a new item to an empty queue', async () => {
    mockGetItem.mockResolvedValue(null);
    mockSetItem.mockResolvedValue(undefined);

    await enqueueGeminiRequest('dream-insights', { dream: 'ocean' });

    const saved = JSON.parse(mockSetItem.mock.calls[0][1]) as QueuedGeminiRequest[];
    expect(saved).toHaveLength(1);
    expect(saved[0].type).toBe('dream-insights');
    expect(saved[0].payload).toEqual({ dream: 'ocean' });
    expect(saved[0].attempts).toBe(0);
  });

  it('evicts oldest item when queue exceeds 10', async () => {
    const existingQueue = Array.from({ length: 10 }, (_, i) =>
      makeItem({ id: `item-${i}`, createdAt: new Date(Date.now() - i * 1000).toISOString() }),
    );
    mockGetItem.mockResolvedValue(JSON.stringify(existingQueue));
    mockSetItem.mockResolvedValue(undefined);

    await enqueueGeminiRequest('pattern-insights', { note: 'new' });

    const saved = JSON.parse(mockSetItem.mock.calls[0][1]) as QueuedGeminiRequest[];
    expect(saved).toHaveLength(10);
    // oldest (item-0, the first in array) should be evicted
    expect(saved.find((i) => i.id === 'item-0')).toBeUndefined();
  });
});

describe('getPendingRequests', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns items that are within TTL and under max attempts', async () => {
    const item = makeItem({ createdAt: new Date().toISOString(), attempts: 0 });
    mockGetItem.mockResolvedValue(JSON.stringify([item]));
    mockSetItem.mockResolvedValue(undefined);

    const result = await getPendingRequests();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('test-id');
  });

  it('filters out expired items (older than 24 hours)', async () => {
    const old = makeItem({
      createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
    });
    mockGetItem.mockResolvedValue(JSON.stringify([old]));
    mockSetItem.mockResolvedValue(undefined);

    const result = await getPendingRequests();
    expect(result).toHaveLength(0);
  });

  it('filters out items that have reached max attempts (3)', async () => {
    const maxed = makeItem({ attempts: 3 });
    mockGetItem.mockResolvedValue(JSON.stringify([maxed]));
    mockSetItem.mockResolvedValue(undefined);

    const result = await getPendingRequests();
    expect(result).toHaveLength(0);
  });

  it('returns empty array when storage is empty', async () => {
    mockGetItem.mockResolvedValue(null);

    const result = await getPendingRequests();
    expect(result).toHaveLength(0);
  });
});

describe('dequeueRequest', () => {
  beforeEach(() => jest.clearAllMocks());

  it('removes only the matching item from the queue', async () => {
    const a = makeItem({ id: 'a' });
    const b = makeItem({ id: 'b' });
    mockGetItem.mockResolvedValue(JSON.stringify([a, b]));
    mockSetItem.mockResolvedValue(undefined);

    await dequeueRequest('a');

    const saved = JSON.parse(mockSetItem.mock.calls[0][1]) as QueuedGeminiRequest[];
    expect(saved).toHaveLength(1);
    expect(saved[0].id).toBe('b');
  });
});

describe('markAttempted', () => {
  beforeEach(() => jest.clearAllMocks());

  it('increments the attempt counter for the matching item', async () => {
    const item = makeItem({ id: 'x', attempts: 1 });
    mockGetItem.mockResolvedValue(JSON.stringify([item]));
    mockSetItem.mockResolvedValue(undefined);

    await markAttempted('x');

    const saved = JSON.parse(mockSetItem.mock.calls[0][1]) as QueuedGeminiRequest[];
    expect(saved[0].attempts).toBe(2);
  });

  it('does nothing if the id is not found', async () => {
    const item = makeItem({ id: 'x', attempts: 0 });
    mockGetItem.mockResolvedValue(JSON.stringify([item]));
    mockSetItem.mockResolvedValue(undefined);

    await markAttempted('not-exists');

    // saveQueue still called but attempts unchanged
    const saved = JSON.parse(mockSetItem.mock.calls[0][1]) as QueuedGeminiRequest[];
    expect(saved[0].attempts).toBe(0);
  });
});

describe('isNetworkError', () => {
  it('returns true for "Network request failed"', () => {
    expect(isNetworkError(new Error('Network request failed'))).toBe(true);
  });

  it('returns true for timeout errors', () => {
    expect(isNetworkError(new Error('Request timeout exceeded'))).toBe(true);
  });

  it('returns false for server-side errors', () => {
    expect(isNetworkError(new Error('400 Bad Request'))).toBe(false);
  });

  it('returns false for null/undefined', () => {
    expect(isNetworkError(null)).toBe(false);
    expect(isNetworkError(undefined)).toBe(false);
  });
});
