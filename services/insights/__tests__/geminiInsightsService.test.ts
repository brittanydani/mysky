const encryptedStore = new Map<string, string>();

const mockInvoke = jest.fn();
const mockGetSession = jest.fn();
const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

jest.mock('../../storage/encryptedAsyncStorage', () => ({
  EncryptedAsyncStorage: {
    getItem: jest.fn(async (key: string) => encryptedStore.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => { encryptedStore.set(key, value); }),
    removeItem: jest.fn(async (key: string) => { encryptedStore.delete(key); }),
  },
}));

jest.mock('../../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
    },
    functions: {
      invoke: (...args: unknown[]) => mockInvoke(...args),
    },
  },
}));

jest.mock('../../../utils/logger', () => ({
  logger: mockLogger,
}));

import { enhanceInsightCopy, enhancePatternInsights } from '../geminiInsightsService';

describe('geminiInsightsService', () => {
  let mockNow = 1_000_000;

  const context = {
    coreValues: null,
    archetypeProfile: null,
    cognitiveStyle: null,
    somaticEntries: [],
    triggers: null,
    relationshipPatterns: [],
    dailyReflections: null,
  };

  const insights = [
    {
      id: 'pattern-1',
      source: 'checkins',
      title: 'Conflict lingers',
      body: 'Conflict days average mood 4.2 versus 5.5 on other days.',
      isConfirmed: true,
    },
  ];

  beforeEach(() => {
    encryptedStore.clear();
    jest.clearAllMocks();
    mockNow += 20_000;
    jest.spyOn(Date, 'now').mockReturnValue(mockNow);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns null without invoking the edge function when there is no session', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });

    const result = await enhancePatternInsights(insights as any, context as any, []);

    expect(result).toBeNull();
    expect(mockInvoke).not.toHaveBeenCalled();
    expect(mockLogger.warn).not.toHaveBeenCalled();
    expect(mockLogger.error).not.toHaveBeenCalled();
  });

  it('falls back quietly on unauthorized edge-function responses', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'token' } },
      error: null,
    });
    mockInvoke.mockResolvedValue({
      data: null,
      error: {
        message: 'Edge Function returned a non-2xx status code',
        context: { status: 401 },
      },
    });

    const result = await enhancePatternInsights(insights as any, context as any, []);

    expect(result).toBeNull();
    expect(mockInvoke).toHaveBeenCalledTimes(1);
    expect(mockInvoke).toHaveBeenCalledWith('pattern-insights', expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Bearer token' }),
    }));
    expect(mockLogger.warn).toHaveBeenCalledWith(
      '[GeminiPatterns] Edge function unauthorized; using local pattern insights fallback.',
    );
    expect(mockLogger.error).not.toHaveBeenCalled();
  });

  it('retries 503 edge-function responses and falls back without logging an error', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'token' } },
      error: null,
    });
    mockInvoke.mockResolvedValue({
      data: null,
      error: {
        message: 'Edge Function returned a non-2xx status code',
        context: { status: 503 },
      },
    });

    const result = await enhancePatternInsights(insights as any, context as any, []);

    expect(result).toBeNull();
    expect(mockInvoke).toHaveBeenCalledTimes(3);
    expect(mockLogger.warn).toHaveBeenCalledWith(
      '[GeminiPatterns] Edge function unavailable; using local pattern insights fallback.',
      503,
      'Edge Function returned a non-2xx status code',
    );
    expect(mockLogger.error).not.toHaveBeenCalled();
  });

  it('returns normalized insights from the dedicated pattern insights function', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'token' } },
      error: null,
    });
    mockInvoke.mockResolvedValue({
      data: {
        insights: [{ id: 'pattern-1', body: 'You feel conflict in your body long after the moment passes.' }],
        generatedAt: '2026-04-08T12:00:00.000Z',
      },
      error: null,
    });

    const result = await enhancePatternInsights(insights as any, context as any, []);

    expect(result).toEqual({
      insights: [{ id: 'pattern-1', body: 'You feel conflict in your body long after the moment passes.' }],
      generatedAt: '2026-04-08T12:00:00.000Z',
    });
    expect(mockInvoke).toHaveBeenCalledWith('pattern-insights', expect.any(Object));
  });

  it('reuses the same fallback behavior for generic insight copy enhancement', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });

    const result = await enhanceInsightCopy(insights as any, context as any, []);

    expect(result).toBeNull();
    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it('normalizes and caches generic insight copy enhancement responses', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'token' } },
      error: null,
    });
    mockInvoke.mockResolvedValue({
      data: {
        insights: [{ id: 'pattern-1', body: 'This reflection feels more precise and personal.' }],
        generatedAt: '2026-04-14T12:00:00.000Z',
      },
      error: null,
    });

    const firstResult = await enhanceInsightCopy(insights as any, context as any, []);
    const secondResult = await enhanceInsightCopy(insights as any, context as any, []);

    expect(firstResult).toEqual({
      insights: [{ id: 'pattern-1', body: 'This reflection feels more precise and personal.' }],
      generatedAt: '2026-04-14T12:00:00.000Z',
    });
    expect(secondResult).toEqual(firstResult);
    expect(mockInvoke).toHaveBeenCalledTimes(1);
  });
});