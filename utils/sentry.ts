/**
 * utils/sentry.ts
 *
 * Lightweight Sentry wrapper for MySky.
 * Privacy-first: no PII is sent — only error messages, stack traces,
 * and breadcrumbs (app lifecycle, navigation). User IDs are not attached.
 */

import * as Sentry from '@sentry/react-native';

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN?.trim() ?? '';

const PII_KEYS = [
  'email',
  'phone',
  'address',
  'name',
  'user_id',
  'userid',
  'birthdate',
  'birthtime',
  'birthplace',
  'birthdata',
  'latitude',
  'longitude',
  'location',
  'content',
  'title',
  'dreamtext',
  'dream_text',
  'note',
  'journal_text',
  'entry_text',
  'moodscore',
  'mood_score',
  'energylevel',
  'energy_level',
  'stresslevel',
  'stress_level',
  'token',
  'authorization',
  'access_token',
  'refresh_token',
  'session_token',
  'bearer',
  'password',
  'apikey',
  'api_key',
  'ciphertext',
  'payload',
  'plaintext',
];

export function scrubString(value: string): string {
  return value
    .replace(/\d{4}-\d{2}-\d{2}/g, '[DATE]')
    .replace(/[\w.-]+@[\w.-]+\.\w+/g, '[EMAIL]')
    .replace(/\b\d{3}[-.]\d{3}[-.]\d{4}\b/g, '[PHONE]');
}

export function scrubPII<T>(value: T): T {
  if (value == null) return value;

  if (typeof value === 'string') {
    return scrubString(value) as T;
  }

  if (typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => scrubPII(item)) as T;
  }

  const scrubbed: Record<string, unknown> = {};
  for (const [key, nestedValue] of Object.entries(value)) {
    const normalizedKey = key.toLowerCase();
    if (PII_KEYS.some((piiKey) => normalizedKey.includes(piiKey))) {
      scrubbed[key] = '[REDACTED]';
    } else {
      scrubbed[key] = scrubPII(nestedValue);
    }
  }

  return scrubbed as T;
}

/**
 * Call once at app startup (before any other code runs).
 * Safe to call even if DSN is empty — Sentry silently no-ops.
 */
export function initSentry() {
  if (!DSN) return;

  try {
    Sentry.init({
      dsn: DSN,
      // Only send errors/fatal in production; in dev, Sentry is disabled.
      enabled: !__DEV__,
      // Capture 100% of errors, sample 10% of performance transactions.
      tracesSampleRate: 0.1,
      // Strip PII from events automatically.
      sendDefaultPii: false,
      // Attach breadcrumbs for navigation, console, and network (no bodies).
      enableAutoPerformanceTracing: true,
      // Enable Logs
      enableLogs: true,
      // Session Replay
      replaysSessionSampleRate: 0.01,
      replaysOnErrorSampleRate: 1,
      integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],
      beforeSend(event) {
        delete event.user;
        delete event.request;

        if (event.extra) {
          event.extra = scrubPII(event.extra);
        }

        if (event.contexts) {
          event.contexts = scrubPII(event.contexts);
        }

        if (event.breadcrumbs) {
          event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => ({
            ...breadcrumb,
            data: breadcrumb.data ? scrubPII(breadcrumb.data) : breadcrumb.data,
            message: breadcrumb.message ? scrubString(breadcrumb.message) : breadcrumb.message,
          }));
        }

        const exceptionValues = event.exception?.values;
        if (exceptionValues) {
          for (const exception of exceptionValues) {
            if (exception.value) {
              exception.value = scrubString(exception.value);
            }

            const frames = exception.stacktrace?.frames;
            if (!frames) continue;

            for (const frame of frames) {
              if (frame.context_line) {
                frame.context_line = scrubString(frame.context_line);
              }
              if (frame.vars) {
                frame.vars = scrubPII(frame.vars);
              }
            }
          }
        }

        return event;
      },
    });
  } catch {
    // Native Sentry module not available (e.g. plugin not linked).
    console.warn('[Sentry] Native module unavailable, error reporting disabled.');
  }
}

/**
 * Report a non-fatal error to Sentry with optional context tags.
 */
export function captureError(error: unknown, context?: Record<string, string>) {
  if (!DSN || __DEV__) return;

  try {
    if (error instanceof Error) {
      Sentry.captureException(error, context ? { tags: context } : undefined);
    } else {
      Sentry.captureMessage(String(error), {
        level: 'error',
        ...(context ? { tags: context } : {}),
      });
    }
  } catch {
    // Native module unavailable — silently ignore.
  }
}

export { Sentry };
