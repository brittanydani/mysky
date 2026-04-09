jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      version: '1.0.0',
    },
  },
}));

import { getDreamReinterpretDailyLimit } from '../../constants/config';

describe('getDreamReinterpretDailyLimit', () => {
  it('returns the default limit when email is missing', () => {
    expect(getDreamReinterpretDailyLimit()).toBe(1);
    expect(getDreamReinterpretDailyLimit(null)).toBe(1);
  });

  it('returns the default limit for users not in the override list', () => {
    expect(getDreamReinterpretDailyLimit('someone@example.com')).toBe(1);
  });

  it('returns the override limit for allowlisted emails', () => {
    expect(getDreamReinterpretDailyLimit('brithornick92@gmail.com')).toBe(5);
  });

  it('normalizes allowlisted emails before lookup', () => {
    expect(getDreamReinterpretDailyLimit('  Brithornick92@gmail.com  ')).toBe(5);
  });
});