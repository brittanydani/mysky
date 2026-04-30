import { withRetry, RetryError, RETRY_PRESETS } from '../withRetry';
import { logger } from '../logger';

describe('withRetry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the operation result on first success', async () => {
    await expect(
      withRetry(() => Promise.resolve('ok'), 'fastOperation', {
        maxRetries: 0,
        timeoutMs: 100,
      }),
    ).resolves.toBe('ok');
  });

  it('retries transient failures with exponential backoff', async () => {
    const operation = jest
      .fn<Promise<string>, []>()
      .mockRejectedValueOnce(new Error('temporary'))
      .mockResolvedValueOnce('ok');
    const onRetry = jest.fn();

    const promise = withRetry(operation, 'transientOperation', {
      maxRetries: 1,
      baseDelayMs: 1,
      timeoutMs: 500,
      onRetry,
    });

    await expect(promise).resolves.toBe('ok');
    expect(operation).toHaveBeenCalledTimes(2);
    expect(logger.warn).toHaveBeenCalledWith('[transientOperation] Attempt 1 failed; retrying', {
      error: 'temporary',
      delayMs: 1,
    });
    expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
  });

  it('throws RetryError after exhausting retries', async () => {
    const promise = withRetry(
      () => Promise.reject(new Error('still failing')),
      'failingOperation',
      {
        maxRetries: 1,
        baseDelayMs: 1,
        timeoutMs: 500,
      },
    );

    await expect(promise).rejects.toMatchObject({
      name: 'RetryError',
      attempts: 2,
      lastError: expect.any(Error),
    });
  });

  it('times out hanging operations', async () => {
    const promise = withRetry(
      () => new Promise<string>(() => {}),
      'timeoutOperation',
      {
        maxRetries: 0,
        timeoutMs: 1,
      },
    );

    await expect(promise).rejects.toBeInstanceOf(RetryError);
    await expect(promise).rejects.toThrow('Request timeout after 1ms');
  });

  it('keeps retry presets available for common operation classes', () => {
    expect(RETRY_PRESETS.fast.timeoutMs).toBeLessThan(RETRY_PRESETS.standard.timeoutMs!);
    expect(RETRY_PRESETS.long.timeoutMs).toBeGreaterThan(RETRY_PRESETS.standard.timeoutMs!);
  });
});
