/**
 * utils/sentry.ts
 *
 * Lightweight Sentry wrapper for MySky.
 * Privacy-first: no PII is sent — only error messages, stack traces,
 * and breadcrumbs (app lifecycle, navigation). User IDs are not attached.
 */

import * as Sentry from '@sentry/react-native';

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN ?? '';

/**
 * Call once at app startup (before any other code runs).
 * Safe to call even if DSN is empty — Sentry silently no-ops.
 */
export function initSentry() {
  if (!DSN) return;

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
    beforeSend(event) {
      // Extra safety: strip any user context that might slip through.
      delete event.user;
      return event;
    },
  });
}

/**
 * Report a non-fatal error to Sentry with optional context tags.
 */
export function captureError(error: unknown, context?: Record<string, string>) {
  if (!DSN || __DEV__) return;

  if (error instanceof Error) {
    Sentry.captureException(error, context ? { tags: context } : undefined);
  } else {
    Sentry.captureMessage(String(error), {
      level: 'error',
      ...(context ? { tags: context } : {}),
    });
  }
}

export { Sentry };
