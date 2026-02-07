// Property-based test for privacy request timing compliance
// **Feature: astrology-app-critical-fixes, Property 11: Privacy request timing compliance**
// **Validates: Requirements 6.2, 7.5**

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

// Mock localDb to avoid SQLite dependency
jest.mock('../../storage/localDb', () => ({
  localDb: {
    initialize: jest.fn(async () => {}),
    getCharts: jest.fn(async () => []),
    getJournalEntries: jest.fn(async () => []),
    getSettings: jest.fn(async () => null),
    hardDeleteAllData: jest.fn(async () => {}),
  },
}));

// Import after mocks
import { DataRightsHandler } from '../dataRightsHandler';

const mockExportPackage = {
  charts: [],
  journalEntries: [],
  settings: null,
  consentRecord: null,
  lawfulBasisRecords: [],
  exportedAt: new Date().toISOString(),
};

describe('Property 11: Privacy request timing compliance', () => {
  beforeEach(() => {
    store.clear();
    jest.clearAllMocks();
  });

  test('**Feature: astrology-app-critical-fixes, Property 11: Privacy request timing compliance**', async () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      await fc.assert(fc.asyncProperty(
        fc.boolean(),
        async (shouldTimeout) => {
          const handler = new DataRightsHandler();
          jest.spyOn(handler as any, 'exportAllData').mockResolvedValue(mockExportPackage);

          const runWithTimeout = jest.spyOn(handler as any, 'runWithTimeout');
          if (shouldTimeout) {
            runWithTimeout.mockRejectedValue(new Error('timeout'));
          } else {
            runWithTimeout.mockResolvedValue(mockExportPackage);
          }

          const result = await handler.handleDataExportRequest();

          expect(runWithTimeout).toHaveBeenCalledWith(expect.any(Promise), 30000);
          expect(result.success).toBe(!shouldTimeout);
        }
      ), {
        numRuns: 30,
        verbose: true,
      });
    } finally {
      consoleSpy.mockRestore();
    }
  });
});
