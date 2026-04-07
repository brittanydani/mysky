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

import { enhancePatternInsights } from '../geminiInsightsService';

describe('geminiInsightsService', () => {
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
    expect(mockInvoke).toHaveBeenCalledWith('gemini-proxy', expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Bearer token' }),
    }));
    expect(mockLogger.warn).toHaveBeenCalledWith(
      '[GeminiPatterns] Edge function unauthorized; using local pattern insights fallback.',
    );
    expect(mockLogger.error).not.toHaveBeenCalled();
  });
});