// Property-based test for consent withdrawal enforcement
// **Feature: astrology-app-critical-fixes, Property 12: Consent withdrawal enforcement**
// **Validates: Requirements 9.3**

import * as fc from 'fast-check';

const store = new Map<string, string>();

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => store.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    store.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    store.delete(key);
  }),
}));

jest.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: { SHA256: 'SHA256' },
  digestStringAsync: jest.fn(async (_algo: string, data: string) => `hash:${data}`),
  getRandomBytesAsync: jest.fn(async (len: number) => new Uint8Array(len).fill(9)),
  randomUUID: jest.fn(() => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }),
}));

// Import after mocks
import { secureStorage } from '../../storage/secureStorage';

const chartArb = () =>
  fc.record({
    id: fc.uuid(),
    name: fc.option(fc.string({ minLength: 1, maxLength: 20 })),
    birthDate: fc.constant('1990-01-01'),
    birthTime: fc.option(fc.constant('12:00')),
    hasUnknownTime: fc.boolean(),
    birthPlace: fc.string({ minLength: 3, maxLength: 30 }),
    latitude: fc.float({ min: Math.fround(-89.9), max: Math.fround(89.9), noNaN: true, noDefaultInfinity: true }),
    longitude: fc.float({ min: Math.fround(-179.9), max: Math.fround(179.9), noNaN: true, noDefaultInfinity: true }),
    houseSystem: fc.option(fc.constantFrom('placidus', 'whole-sign', 'equal-house')),
    createdAt: fc.constant(new Date().toISOString()),
    updatedAt: fc.constant(new Date().toISOString()),
    isDeleted: fc.constant(false),
  });

describe('Property 12: Consent withdrawal enforcement', () => {
  beforeEach(() => {
    store.clear();
    jest.clearAllMocks();
  });

  test('**Feature: astrology-app-critical-fixes, Property 12: Consent withdrawal enforcement**', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
      await fc.assert(fc.asyncProperty(
        chartArb(),
        async (chart) => {
          // Withdraw consent
          await secureStorage.setPrivacyConsent(false, '1.0', 'withdrawn');

          // secureStorage.saveChart requires consent
          await expect(secureStorage.saveChart(chart as any)).rejects.toThrow(
            'Privacy consent required'
          );
        }
      ), {
        numRuns: 50,
        verbose: true,
      });
    } finally {
      consoleSpy.mockRestore();
    }
  });
});
