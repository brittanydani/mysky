// Property-based test for lawful basis documentation
// **Feature: astrology-app-critical-fixes, Property 15: Lawful basis documentation**
// **Validates: Requirements 6.1**

import * as fc from 'fast-check';
import { LawfulBasisAuditService } from '../lawfulBasisAudit';

const store = new Map<string, string>();
const lawfulBasisRecords: any[] = [];

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
  getRandomBytesAsync: jest.fn(async (len: number) => new Uint8Array(len).fill(5)),
  randomUUID: jest.fn(() => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }),
}));

jest.mock('../../storage/secureStorage', () => ({
  secureStorage: {
    getPrivacyPolicyVersion: jest.fn(async () => '1.0'),
    getLawfulBasisRecords: jest.fn(async () => lawfulBasisRecords),
    saveLawfulBasisRecords: jest.fn(async (records: any[]) => {
      lawfulBasisRecords.length = 0;
      lawfulBasisRecords.push(...records);
    }),
    auditDataAccess: jest.fn(async () => {}),
  },
}));

const inputArb = () =>
  fc.record({
    lawfulBasis: fc.constantFrom(
      'consent',
      'contract',
      'legal_obligation',
      'vital_interests',
      'public_task',
      'legitimate_interests'
    ),
    purpose: fc.string({ minLength: 3, maxLength: 40 }).filter((value) => value.trim().length > 0),
    dataCategories: fc.array(fc.string({ minLength: 3, maxLength: 20 }), { minLength: 1, maxLength: 4 }),
    processingActivities: fc.array(fc.string({ minLength: 3, maxLength: 25 }), { minLength: 1, maxLength: 4 }),
    retentionPeriod: fc.option(fc.string({ minLength: 3, maxLength: 20 })),
  });

describe('Property 15: Lawful basis documentation', () => {
  beforeEach(() => {
    store.clear();
    lawfulBasisRecords.length = 0;
    jest.clearAllMocks();
  });

  test('**Feature: astrology-app-critical-fixes, Property 15: Lawful basis documentation**', () => {
    fc.assert(fc.asyncProperty(
      inputArb(),
      async (input) => {
        const service = new LawfulBasisAuditService();
        const record = await service.recordProcessingOperation(input);

        expect(record.id).toBeDefined();
        expect(record.timestamp).toBeDefined();
        expect(record.lawfulBasis).toBe(input.lawfulBasis);
        expect(record.purpose).toBe(input.purpose);
        expect(record.dataCategories.length).toBeGreaterThan(0);
        expect(record.processingActivities.length).toBeGreaterThan(0);

        const report = await service.getComplianceReport();
        expect(report.totalRecords).toBeGreaterThanOrEqual(1);
        expect(report.byLawfulBasis[input.lawfulBasis]).toBeGreaterThan(0);
      }
    ), {
      numRuns: 60,
      verbose: true,
    });
  });
});
