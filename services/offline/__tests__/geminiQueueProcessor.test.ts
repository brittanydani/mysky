import { processGeminiQueue } from '../geminiQueueProcessor';

const mockGetPending = jest.fn();
const mockDequeue = jest.fn();
const mockMarkAttempted = jest.fn();
const mockGetSession = jest.fn();
const mockInvoke = jest.fn();

jest.mock('../geminiQueue', () => ({
  getPendingRequests: () => mockGetPending(),
  dequeueRequest: (id: string) => mockDequeue(id),
  markAttempted: (id: string) => mockMarkAttempted(id),
}));

jest.mock('../../../lib/supabase', () => ({
  supabase: {
    auth: { getSession: () => mockGetSession() },
    functions: { invoke: (...args: unknown[]) => mockInvoke(...args) },
  },
}));

jest.mock('../../../utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const fakeItem = {
  id: 'req-1',
  type: 'dream-insights' as const,
  payload: { dream: 'flying' },
  createdAt: new Date().toISOString(),
  attempts: 0,
};

describe('processGeminiQueue', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 0 immediately when queue is empty', async () => {
    mockGetPending.mockResolvedValue([]);

    const result = await processGeminiQueue();
    expect(result).toBe(0);
    expect(mockGetSession).not.toHaveBeenCalled();
  });

  it('returns 0 and skips retries when there is no active session', async () => {
    mockGetPending.mockResolvedValue([fakeItem]);
    mockGetSession.mockResolvedValue({ data: { session: null } });

    const result = await processGeminiQueue();
    expect(result).toBe(0);
    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it('retries queued items and returns success count', async () => {
    mockGetPending.mockResolvedValue([fakeItem]);
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'tok' } },
    });
    mockMarkAttempted.mockResolvedValue(undefined);
    mockInvoke.mockResolvedValue({ data: { ok: true }, error: null });
    mockDequeue.mockResolvedValue(undefined);

    const result = await processGeminiQueue();
    expect(result).toBe(1);
    expect(mockMarkAttempted).toHaveBeenCalledWith('req-1');
    expect(mockDequeue).toHaveBeenCalledWith('req-1');
  });

  it('keeps item in queue (does not dequeue) when edge function returns an error', async () => {
    mockGetPending.mockResolvedValue([fakeItem]);
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'tok' } },
    });
    mockMarkAttempted.mockResolvedValue(undefined);
    mockInvoke.mockResolvedValue({ data: null, error: { message: 'Service unavailable' } });

    const result = await processGeminiQueue();
    expect(result).toBe(0);
    expect(mockDequeue).not.toHaveBeenCalled();
  });

  it('keeps item in queue when edge function throws', async () => {
    mockGetPending.mockResolvedValue([fakeItem]);
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'tok' } },
    });
    mockMarkAttempted.mockResolvedValue(undefined);
    mockInvoke.mockRejectedValue(new Error('Network error'));

    const result = await processGeminiQueue();
    expect(result).toBe(0);
    expect(mockDequeue).not.toHaveBeenCalled();
  });

  it('processes multiple items independently — partial success', async () => {
    const item2 = { ...fakeItem, id: 'req-2' };
    mockGetPending.mockResolvedValue([fakeItem, item2]);
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'tok' } },
    });
    mockMarkAttempted.mockResolvedValue(undefined);
    // First succeeds, second fails
    mockInvoke
      .mockResolvedValueOnce({ data: { ok: true }, error: null })
      .mockResolvedValueOnce({ data: null, error: { message: 'fail' } });
    mockDequeue.mockResolvedValue(undefined);

    const result = await processGeminiQueue();
    expect(result).toBe(1);
    expect(mockDequeue).toHaveBeenCalledWith('req-1');
    expect(mockDequeue).not.toHaveBeenCalledWith('req-2');
  });
});
