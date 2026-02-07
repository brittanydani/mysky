// Property-based test for comprehensive encryption
// **Feature: astrology-app-critical-fixes, Property 6: Comprehensive encryption**
// **Validates: Requirements 2.5, 4.1, 4.4, 4.5**

import * as fc from 'fast-check';
import { EncryptionManager } from '../encryptionManager';
import { AppSettings, JournalEntry, SavedChart } from '../models';

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
  getRandomBytesAsync: jest.fn(async (len: number) => new Uint8Array(len).fill(7)),
  randomUUID: jest.fn(() => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }),
}));

// Import after mocks are set up
import { secureStorage } from '../secureStorage';

const MIN_TS = new Date('2000-01-01T00:00:00.000Z').getTime();
const MAX_TS = new Date('2035-12-31T23:59:59.999Z').getTime();
const dateArb = () =>
  fc.integer({ min: MIN_TS, max: MAX_TS }).map((ts) => new Date(ts));

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

describe('Property 6: Comprehensive encryption', () => {
  beforeEach(() => {
    store.clear();
    jest.clearAllMocks();
  });

  test('**Feature: astrology-app-critical-fixes, Property 6: Comprehensive encryption**', async () => {
    await fc.assert(fc.asyncProperty(
      chartArb(),
      journalArb(),
      settingsArb(),
      async (chart, journal, settings) => {
        store.clear();
        
        // Enable consent first
        await secureStorage.setPrivacyConsent(true, '1.0', 'test_setup');
        
        // Save data via secureStorage (which uses encryption)
        await secureStorage.saveChart(chart);
        await secureStorage.saveJournalEntry(journal);
        await secureStorage.saveSettings(settings);

        // Stored values must be encrypted envelopes (no plaintext)
        const rawCharts = store.get('secure_charts');
        const rawJournal = store.get('secure_journal');
        const rawSettings = store.get('secure_settings');

        expect(rawCharts).toBeDefined();
        expect(rawJournal).toBeDefined();
        expect(rawSettings).toBeDefined();

        const parsedCharts = JSON.parse(rawCharts!);
        const parsedJournal = JSON.parse(rawJournal!);
        const parsedSettings = JSON.parse(rawSettings!);

        // Verify encrypted envelope structure
        expect(parsedCharts.encrypted).toBe(true);
        expect(parsedJournal.encrypted).toBe(true);
        expect(parsedSettings.encrypted).toBe(true);

        expect(parsedCharts.payload?.data).toBeDefined();
        expect(parsedJournal.payload?.data).toBeDefined();
        expect(parsedSettings.payload?.data).toBeDefined();

        // Ensure integrity validation works
        expect(await EncryptionManager.validateEncryptionIntegrity(parsedCharts.payload)).toBe(true);
        expect(await EncryptionManager.validateEncryptionIntegrity(parsedJournal.payload)).toBe(true);
        expect(await EncryptionManager.validateEncryptionIntegrity(parsedSettings.payload)).toBe(true);

        // Decrypted data must round-trip correctly
        const charts = await secureStorage.getCharts();
        const journals = await secureStorage.getJournalEntries();
        const loadedSettings = await secureStorage.getSettings();

        expect(charts.some((c) => c.id === chart.id)).toBe(true);
        expect(journals.some((j) => j.id === journal.id)).toBe(true);
        expect(loadedSettings?.id).toBe(settings.id);
      }
    ), {
      numRuns: 50,
      verbose: true,
    });
  });
});
