const mockInvoke = jest.fn();
const mockGetSession = jest.fn();
const mockRefreshSession = jest.fn();
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
      refreshSession: (...args: unknown[]) => mockRefreshSession(...args),
    },
    functions: {
      invoke: (...args: unknown[]) => mockInvoke(...args),
    },
  },
}));

jest.mock('../../../utils/logger', () => ({
  logger: mockLogger,
}));

import {
  generateGeminiDreamInterpretation,
  getGeminiDreamModel,
  isGeminiAvailable,
} from '../geminiDreamInterpretation';

describe('geminiDreamInterpretation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('reports Gemini unavailable without an authenticated session', () => {
    expect(isGeminiAvailable(false)).toBe(false);
    expect(isGeminiAvailable(true)).toBe(true);
    expect(getGeminiDreamModel('free')).toBe('gemini-2.5-flash-lite');
    expect(getGeminiDreamModel('premium')).toBe('gemini-2.5-flash');
  });

  it('uses the free Gemini model by default', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(50_000);
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'token', expires_at: 9_999_999_999 } },
      error: null,
    });
    mockInvoke.mockResolvedValue({
      data: { paragraph: 'Free paragraph', question: 'Free question?' },
      error: null,
    });

    await expect(
      generateGeminiDreamInterpretation({ dreamText: 'I was walking through a field.' }),
    ).resolves.toMatchObject({
      paragraph: 'Free paragraph',
      question: 'Free question?',
    });

    expect(mockInvoke).toHaveBeenCalledWith('dream-insights', expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Bearer token' }),
      body: expect.objectContaining({ modelTier: 'free' }),
    }));
  });

  it('uses the premium Gemini model when requested', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(70_000);
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'token', expires_at: 9_999_999_999 } },
      error: null,
    });
    mockInvoke.mockResolvedValue({
      data: { paragraph: 'Premium paragraph', question: 'Premium question?' },
      error: null,
    });

    await expect(
      generateGeminiDreamInterpretation({
        dreamText: 'I was swimming under bright stars.',
        modelTier: 'premium',
      }),
    ).resolves.toMatchObject({
      paragraph: 'Premium paragraph',
      question: 'Premium question?',
    });

    expect(mockInvoke).toHaveBeenCalledWith('dream-insights', expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Bearer token' }),
      body: expect.objectContaining({ modelTier: 'premium' }),
    }));
  });

  it('throws a friendly auth error without invoking the edge function when there is no session', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(90_000);
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });

    await expect(
      generateGeminiDreamInterpretation({ dreamText: 'I was falling through a red hallway.' }),
    ).rejects.toThrow('Sign in to use AI dream insights.');

    expect(mockInvoke).not.toHaveBeenCalled();
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  it('throws a friendly auth error for unauthorized edge-function responses', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(110_000);
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
  });

  it('surfaces the edge-function JSON error message for 502 responses', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(130_000);
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'token' } },
      error: null,
    });
    mockInvoke.mockResolvedValue({
      data: null,
      error: {
        message: 'Edge Function returned a non-2xx status code',
        context: {
          status: 502,
          json: jest.fn().mockResolvedValue({
            error: 'AI insights are at capacity right now. Please wait a minute and try again.',
          }),
          clone() {
            return this;
          },
        },
      },
    });

    await expect(
      generateGeminiDreamInterpretation({ dreamText: 'I was running through an empty station.' }),
    ).rejects.toThrow('AI insights are at capacity right now. Please wait a minute and try again.');

    expect(mockLogger.error).toHaveBeenCalledWith(
      '[GeminiDream] Edge function error:',
      502,
      'AI insights are at capacity right now. Please wait a minute and try again.',
    );
  });

  it('maps upstream Gemini 404s to a temporary-unavailable message', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(150_000);
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'token' } },
      error: null,
    });
    mockInvoke.mockResolvedValue({
      data: null,
      error: {
        message: 'Edge Function returned a non-2xx status code',
        context: {
          status: 502,
          json: jest.fn().mockResolvedValue({
            error: 'Gemini API error: 404',
          }),
          clone() {
            return this;
          },
        },
      },
    });

    await expect(
      generateGeminiDreamInterpretation({ dreamText: 'I was looking for a missing train.' }),
    ).rejects.toThrow('AI insights are temporarily unavailable. Please try again soon.');

    expect(mockLogger.error).toHaveBeenCalledWith(
      '[GeminiDream] Edge function error:',
      502,
      'Gemini API error: 404',
    );
  });
});