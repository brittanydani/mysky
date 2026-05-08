jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

import { ConfigValidator } from '../configValidator';

const ORIGINAL_ENV = process.env;

function setRequiredEnv(overrides: Record<string, string | undefined> = {}) {
  process.env = {
    ...ORIGINAL_ENV,
    EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
    EXPO_PUBLIC_SUPABASE_ANON_KEY: 'eyJvalid.jwt',
    EXPO_PUBLIC_SENTRY_DSN: 'https://key@o0.ingest.sentry.io/1',
    EXPO_PUBLIC_REVENUECAT_IOS_API_KEY: 'appl_test_key',
    ...overrides,
  };
}

describe('ConfigValidator', () => {
  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it('passes valid required configuration', () => {
    setRequiredEnv();

    const result = ConfigValidator.validateStartup();

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.warnings).not.toEqual(
      expect.arrayContaining([
        expect.stringContaining('EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY'),
      ]),
    );
  });

  it('reports missing required values', () => {
    setRequiredEnv({
      EXPO_PUBLIC_SUPABASE_URL: undefined,
      EXPO_PUBLIC_SENTRY_DSN: undefined,
    });

    const result = ConfigValidator.validateStartup();

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        'Missing required environment variable: EXPO_PUBLIC_SUPABASE_URL',
        'Missing required environment variable: EXPO_PUBLIC_SENTRY_DSN',
      ]),
    );
  });

  it('validates URL and Supabase anon key formats', () => {
    setRequiredEnv({
      EXPO_PUBLIC_SUPABASE_URL: 'not-a-url',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: 'bad-key',
      EXPO_PUBLIC_SENTRY_DSN: 'also-bad',
    });

    const result = ConfigValidator.validateStartup();

    expect(result.valid).toBe(false);
    expect(result.errors.join('\n')).toContain('EXPO_PUBLIC_SUPABASE_URL is not a valid URL');
    expect(result.errors.join('\n')).toContain('EXPO_PUBLIC_SUPABASE_ANON_KEY does not look like');
    expect(result.errors.join('\n')).toContain('EXPO_PUBLIC_SENTRY_DSN is not a valid URL');
  });

  it('warns about invalid optional RevenueCat key format on iOS', () => {
    setRequiredEnv({ EXPO_PUBLIC_REVENUECAT_IOS_API_KEY: 'bad_key' });

    const result = ConfigValidator.validateStartup();

    expect(result.valid).toBe(true);
    expect(result.warnings.join('\n')).toContain('EXPO_PUBLIC_REVENUECAT_IOS_API_KEY');
  });
});
