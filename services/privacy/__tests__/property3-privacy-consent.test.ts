// Property-based test for privacy consent recording completeness
// **Feature: astrology-app-critical-fixes, Property 3: Privacy consent recording completeness**
// **Validates: Requirements 2.2, 9.2, 9.5**

import * as fc from 'fast-check';
import { PrivacyComplianceManager } from '../privacyComplianceManager';

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

const dateArb = () =>
  fc.integer({
    min: new Date('2000-01-01T00:00:00.000Z').getTime(),
    max: new Date('2035-12-31T23:59:59.999Z').getTime(),
  }).map((ts) => new Date(ts).toISOString());

const consentArb = () =>
  fc.record({
    granted: fc.boolean(),
    policyVersion: fc.constantFrom('1.0', '1.1', '2.0'),
    timestamp: dateArb(),
    method: fc.constantFrom('explicit', 'implied'),
    lawfulBasis: fc.constantFrom(
      'consent',
      'contract',
      'legal_obligation',
      'vital_interests',
      'public_task',
      'legitimate_interests'
    ),
    purpose: fc.stringMatching(/^[A-Za-z0-9 ]{3,40}$/),
  });

describe('Property 3: Privacy consent recording completeness', () => {
  beforeEach(() => {
    store.clear();
    jest.clearAllMocks();
  });

  test('**Feature: astrology-app-critical-fixes, Property 3: Privacy consent recording completeness**', async () => {
    await fc.assert(fc.asyncProperty(
      consentArb(),
      async (consent) => {
        const manager = new PrivacyComplianceManager();
        await manager.recordConsent(consent);

        const storedConsent = await manager.requestConsent();
        const consentHistoryRaw = store.get('consent_history');

        expect(consentHistoryRaw).toBeDefined();
        const parsedHistory = JSON.parse(consentHistoryRaw!);
        expect(parsedHistory.encrypted).toBe(true);
        expect(parsedHistory.payload?.data).toBeDefined();

        // Consent record should include timestamp and policy version
        if (consent.granted) {
          expect(storedConsent.required).toBe(false);
          expect(storedConsent.policyVersion).toBe(consent.policyVersion);
          expect(storedConsent.existingConsent?.timestamp).toBeDefined();
          expect(storedConsent.existingConsent?.policyVersion).toBe(consent.policyVersion);
          expect(storedConsent.existingConsent?.granted).toBe(true);
        }
      }
    ), {
      numRuns: 100,
      verbose: true,
    });
  });
});
