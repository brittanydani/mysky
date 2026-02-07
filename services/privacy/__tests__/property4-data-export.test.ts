// Property-based test for data export completeness
// **Feature: astrology-app-critical-fixes, Property 4: Data export completeness**
// **Validates: Requirements 7.1, 7.2, 7.3, 7.4**

import * as fc from 'fast-check';
import { SavedChart, JournalEntry, AppSettings } from '../../storage/models';

const store = new Map<string, string>();

// In-memory mock data for localDb
let mockCharts: SavedChart[] = [];
let mockJournals: JournalEntry[] = [];
let mockSettings: AppSettings | null = null;

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
  getRandomBytesAsync: jest.fn(async (len: number) => new Uint8Array(len).fill(3)),
  randomUUID: jest.fn(() => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }),
}));

// Mock localDb to use in-memory storage
jest.mock('../../storage/localDb', () => ({
  localDb: {
    initialize: jest.fn(async () => {}),
    saveChart: jest.fn(async (chart: any) => {
      const index = mockCharts.findIndex(c => c.id === chart.id);
      if (index >= 0) mockCharts[index] = chart;
      else mockCharts.push(chart);
    }),
    getCharts: jest.fn(async () => mockCharts.filter(c => !c.isDeleted)),
    saveJournalEntry: jest.fn(async (entry: any) => {
      const index = mockJournals.findIndex(j => j.id === entry.id);
      if (index >= 0) mockJournals[index] = entry;
      else mockJournals.push(entry);
    }),
    getJournalEntries: jest.fn(async () => mockJournals.filter(j => !j.isDeleted)),
    saveSettings: jest.fn(async (settings: any) => {
      mockSettings = settings;
    }),
    getSettings: jest.fn(async () => mockSettings),
    hardDeleteAllData: jest.fn(async () => {
      mockCharts = [];
      mockJournals = [];
      mockSettings = null;
    }),
  },
}));

// Import after mocks are set up
import { DataRightsHandler } from '../dataRightsHandler';
import { secureStorage } from '../../storage/secureStorage';

const MIN_TS = new Date('2000-01-01T00:00:00.000Z').getTime();
const MAX_TS = new Date('2035-12-31T23:59:59.999Z').getTime();
const dateArb = () => fc.integer({ min: MIN_TS, max: MAX_TS }).map((ts) => new Date(ts));

const chartArb = (): fc.Arbitrary<SavedChart> => fc.record({
  id: fc.uuid(),
  name: fc.option(fc.string({ minLength: 1, maxLength: 20 })),
  birthDate: dateArb().map((d) => d.toISOString().slice(0, 10)),
  birthTime: fc.option(fc.string({ minLength: 4, maxLength: 5 })),
  hasUnknownTime: fc.boolean(),
  birthPlace: fc.string({ minLength: 1, maxLength: 40 }),
  latitude: fc.float({ min: Math.fround(-89.9), max: Math.fround(89.9), noNaN: true, noDefaultInfinity: true }),
  longitude: fc.float({ min: Math.fround(-179.9), max: Math.fround(179.9), noNaN: true, noDefaultInfinity: true }),
  createdAt: dateArb().map((d) => d.toISOString()),
  updatedAt: dateArb().map((d) => d.toISOString()),
  isDeleted: fc.boolean(),
});

const journalArb = (): fc.Arbitrary<JournalEntry> => fc.record({
  id: fc.uuid(),
  date: dateArb().map((d) => d.toISOString().slice(0, 10)),
  mood: fc.constantFrom('calm', 'soft', 'okay', 'heavy', 'stormy'),
  moonPhase: fc.constantFrom('new', 'waxing', 'full', 'waning'),
  title: fc.option(fc.string({ minLength: 1, maxLength: 30 })),
  content: fc.string({ minLength: 1, maxLength: 120 }),
  createdAt: dateArb().map((d) => d.toISOString()),
  updatedAt: dateArb().map((d) => d.toISOString()),
  isDeleted: fc.boolean(),
});

const settingsArb = (): fc.Arbitrary<AppSettings> => fc.record({
  id: fc.uuid(),
  cloudSyncEnabled: fc.boolean(),
  lastSyncAt: fc.option(dateArb().map((d) => d.toISOString())),
  userId: fc.option(fc.string({ minLength: 1, maxLength: 20 })),
  createdAt: dateArb().map((d) => d.toISOString()),
  updatedAt: dateArb().map((d) => d.toISOString()),
});

// Helper to reset mock data
const resetMockData = () => {
  mockCharts = [];
  mockJournals = [];
  mockSettings = null;
};

describe('Property 4: Data export completeness', () => {
  beforeEach(() => {
    store.clear();
    resetMockData();
    jest.clearAllMocks();
  });

  test('**Feature: astrology-app-critical-fixes, Property 4: Data export completeness**', async () => {
    await fc.assert(fc.asyncProperty(
      fc.array(chartArb(), { maxLength: 5 }),
      fc.array(journalArb(), { maxLength: 5 }),
      fc.option(settingsArb()),
      async (charts, journals, settings) => {
        // Reset state for each property test run
        store.clear();
        resetMockData();

        const handler = new DataRightsHandler();

        // Seed storage (consent required before any data is stored)
        await secureStorage.setPrivacyConsent(true, '1.0', 'test_seed');
        
        // Add data directly to mock storage
        for (const chart of charts) {
          mockCharts.push(chart);
        }
        for (const entry of journals) {
          mockJournals.push(entry);
        }
        if (settings) {
          mockSettings = settings;
        }

        const result = await handler.handleDataExportRequest();

        expect(result.success).toBe(true);
        expect(result.package).toBeDefined();
        expect(result.package?.charts).toBeDefined();
        expect(result.package?.journalEntries).toBeDefined();
        expect(result.package?.exportedAt).toBeDefined();

        const expectedCharts = charts.filter((chart) => !chart.isDeleted);
        const expectedJournals = journals.filter((entry) => !entry.isDeleted);

        expect(result.package?.charts.length).toBe(expectedCharts.length);
        expect(result.package?.journalEntries.length).toBe(expectedJournals.length);

        if (settings) {
          expect(result.package?.settings?.id).toBe(settings.id);
        }
      }
    ), {
      numRuns: 50,
      verbose: true,
    });
  });
});
