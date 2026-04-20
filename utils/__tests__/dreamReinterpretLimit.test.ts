jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      version: '1.0.0',
    },
  },
}));

import { getDreamReinterpretPerDreamLimit } from '../../constants/config';

describe('getDreamReinterpretPerDreamLimit', () => {
  const originalAllowlist = process.env.EXPO_PUBLIC_DREAM_REINTERPRET_ALLOWLIST;

  beforeEach(() => {
    delete process.env.EXPO_PUBLIC_DREAM_REINTERPRET_ALLOWLIST;
  });

  afterAll(() => {
    if (typeof originalAllowlist === 'string') {
      process.env.EXPO_PUBLIC_DREAM_REINTERPRET_ALLOWLIST = originalAllowlist;
      return;
    }
    delete process.env.EXPO_PUBLIC_DREAM_REINTERPRET_ALLOWLIST;
  });

  it('returns the default limit when email is missing', () => {
    expect(getDreamReinterpretPerDreamLimit()).toBe(1);
    expect(getDreamReinterpretPerDreamLimit(null)).toBe(1);
  });

  it('returns the default limit for users not in the override list', () => {
    expect(getDreamReinterpretPerDreamLimit('someone@example.com')).toBe(1);
  });

  it('returns the override limit for allowlisted emails', () => {
    process.env.EXPO_PUBLIC_DREAM_REINTERPRET_ALLOWLIST = 'brithornick92@gmail.com';
    expect(getDreamReinterpretPerDreamLimit('brithornick92@gmail.com')).toBe(5);
  });

  it('normalizes allowlisted emails before lookup', () => {
    process.env.EXPO_PUBLIC_DREAM_REINTERPRET_ALLOWLIST = 'brithornick92@gmail.com';
    expect(getDreamReinterpretPerDreamLimit('  Brithornick92@gmail.com  ')).toBe(5);
  });
});