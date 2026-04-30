jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  mobileReplayIntegration: jest.fn(() => ({})),
  feedbackIntegration: jest.fn(() => ({})),
}));

import { scrubPII, scrubString } from '../sentry';

describe('Sentry PII scrubbing', () => {
  it('redacts sensitive keys in extra context', () => {
    const clean = scrubPII({ error: 'User error', email: 'test@example.com' });
    expect(clean.email).toBe('[REDACTED]');
    expect(clean.error).toBe('User error');
  });

  it('redacts birth data fields', () => {
    const clean = scrubPII({ birthplace: 'New York', birthtime: '14:30' });
    expect(clean.birthplace).toBe('[REDACTED]');
    expect(clean.birthtime).toBe('[REDACTED]');
  });

  it('redacts nested PII', () => {
    const clean = scrubPII({ user: { email: 'test@example.com', name: 'John' } });
    expect(clean.user.email).toBe('[REDACTED]');
    expect(clean.user.name).toBe('[REDACTED]');
  });

  it('scrubs PII-like strings', () => {
    expect(scrubString('test@example.com on 2026-04-29')).toBe('[EMAIL] on [DATE]');
  });
});
