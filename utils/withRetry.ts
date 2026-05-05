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
  maxRetries: 1,
  baseDelayMs: 750,
  maxDelayMs: 2000,
  timeoutMs: 10000,
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

function stringifyThrownObject(value: Record<string, unknown>): string {
  const parts = [value.message, value.details, value.hint, value.code]
    .filter((part): part is string => typeof part === 'string' && part.length > 0);

  if (parts.length > 0) return parts.join(' | ');

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function normalizeThrownError(error: unknown): Error {
  if (error instanceof Error) return error;

  if (error && typeof error === 'object') {
    const normalized = new Error(stringifyThrownObject(error as Record<string, unknown>));
    normalized.name = 'NonErrorThrown';
    return normalized;
  }

  return new Error(String(error));
}

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
      lastError = normalizeThrownError(error);

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
    maxRetries: 1,
    baseDelayMs: 300,
    maxDelayMs: 1000,
    timeoutMs: 6000,
  },
  standard: {
    maxRetries: 1,
    baseDelayMs: 750,
    maxDelayMs: 2000,
    timeoutMs: 10000,
  },
  long: {
    maxRetries: 2,
    baseDelayMs: 1000,
    maxDelayMs: 5000,
    timeoutMs: 20000,
  },
} satisfies Record<string, RetryOptions>;
