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
  it('returns the default limit when email is missing', () => {
    expect(getDreamReinterpretPerDreamLimit()).toBe(1);
    expect(getDreamReinterpretPerDreamLimit(null)).toBe(1);
  });

  it('returns the default limit for users not in the override list', () => {
    expect(getDreamReinterpretPerDreamLimit('someone@example.com')).toBe(1);
  });

  it('returns the override limit for allowlisted emails', () => {
    expect(getDreamReinterpretPerDreamLimit('brithornick92@gmail.com')).toBe(5);
  });

  it('normalizes allowlisted emails before lookup', () => {
    expect(getDreamReinterpretPerDreamLimit('  Brithornick92@gmail.com  ')).toBe(5);
  });
});