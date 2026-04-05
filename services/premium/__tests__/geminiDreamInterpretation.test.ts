const mockInvoke = jest.fn();
const mockGetSession = jest.fn();
const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

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

import { generateGeminiDreamInterpretation, isGeminiAvailable } from '../geminiDreamInterpretation';

describe('geminiDreamInterpretation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('reports Gemini unavailable without an authenticated session', () => {
    expect(isGeminiAvailable(false)).toBe(false);
    expect(isGeminiAvailable(true)).toBe(true);
  });

  it('throws a friendly auth error without invoking the edge function when there is no session', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(10_000);
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });

    await expect(
      generateGeminiDreamInterpretation({ dreamText: 'I was falling through a red hallway.' }),
    ).rejects.toThrow('Sign in to use AI dream insights.');

    expect(mockInvoke).not.toHaveBeenCalled();
    expect(mockLogger.warn).not.toHaveBeenCalled();
    jest.restoreAllMocks();
  });

  it('throws a friendly auth error for unauthorized edge-function responses', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(30_000);
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

    await expect(
      generateGeminiDreamInterpretation({ dreamText: 'I was standing in the ocean at night.' }),
    ).rejects.toThrow('Sign in to use AI dream insights.');

    expect(mockInvoke).toHaveBeenCalledTimes(1);
    expect(mockLogger.warn).toHaveBeenCalledWith(
      '[GeminiDream] Edge function unauthorized; AI dream insights require sign-in.',
    );
    expect(mockLogger.error).not.toHaveBeenCalled();
    jest.restoreAllMocks();
  });
});