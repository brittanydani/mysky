/**
 * Retry utility with exponential backoff and request timeout.
 * Use this around network calls that can fail from temporary connection issues.
 */

import { logger } from './logger';

export interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  timeoutMs?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  timeoutMs: 30000,
  onRetry: () => {},
};

export class RetryError extends Error {
  readonly lastError: Error;
  readonly attempts: number;

  constructor(lastError: Error, attempts: number) {
    super(`Failed after ${attempts} attempts: ${lastError.message}`);
    this.name = 'RetryError';
    this.lastError = lastError;
    this.attempts = attempts;
  }
}

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

const withTimeout = async <T>(
  operation: () => Promise<T>,
  timeoutMs: number,
): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  try {
    return await Promise.race([
      operation(),
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`Request timeout after ${timeoutMs}ms`));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

export async function withRetry<T>(
  operation: () => Promise<T>,
  label: string,
  options: RetryOptions = {},
): Promise<T> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | null = null;
  const totalAttempts = config.maxRetries + 1;

  for (let attempt = 1; attempt <= totalAttempts; attempt += 1) {
    try {
      return await withTimeout(operation, config.timeoutMs);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt >= totalAttempts) {
        break;
      }

      const delayMs = Math.min(
        config.baseDelayMs * Math.pow(2, attempt - 1),
        config.maxDelayMs,
      );

      logger.warn(`[${label}] Attempt ${attempt} failed; retrying`, {
        error: lastError.message,
        delayMs,
      });

      config.onRetry(attempt, lastError);
      await wait(delayMs);
    }
  }

  throw new RetryError(lastError ?? new Error('Unknown retry error'), totalAttempts);
}

export const RETRY_PRESETS = {
  fast: {
    maxRetries: 2,
    baseDelayMs: 500,
    maxDelayMs: 3000,
    timeoutMs: 10000,
  },
  standard: {
    maxRetries: 3,
    baseDelayMs: 1000,
    maxDelayMs: 10000,
    timeoutMs: 30000,
  },
  long: {
    maxRetries: 2,
    baseDelayMs: 2000,
    maxDelayMs: 15000,
    timeoutMs: 60000,
  },
} satisfies Record<string, RetryOptions>;
