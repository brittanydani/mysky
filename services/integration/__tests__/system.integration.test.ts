// Integration tests for complete system

import { PrivacyComplianceManager } from '../../privacy/privacyComplianceManager';
import { DataRightsHandler } from '../../privacy/dataRightsHandler';
import { EnhancedAstrologyCalculator } from '../../astrology/calculator';
import { BirthData } from '../../astrology/types';
import { ChartDisplayManager } from '../../astrology/chartDisplayManager';
import { EmotionalOperatingSystemGenerator } from '../../astrology/emotionalOperatingSystem';
import { SavedChart, JournalEntry, AppSettings } from '../../storage/models';

const store = new Map<string, string>();

// In-memory storage for localDb mock
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
  getRandomBytesAsync: jest.fn(async (len: number) => new Uint8Array(len).fill(2)),
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
    saveChart: jest.fn(async (chart: SavedChart) => {
      const index = mockCharts.findIndex(c => c.id === chart.id);
      if (index >= 0) {
        mockCharts[index] = chart;
      } else {
        mockCharts.push(chart);
      }
    }),
    getCharts: jest.fn(async () => mockCharts.filter(c => !c.isDeleted)),
    deleteChart: jest.fn(async (id: string) => {
      const index = mockCharts.findIndex(c => c.id === id);
      if (index >= 0) {
        mockCharts[index].isDeleted = true;
      }
    }),
    saveJournalEntry: jest.fn(async (entry: JournalEntry) => {
      const index = mockJournals.findIndex(j => j.id === entry.id);
      if (index >= 0) {
        mockJournals[index] = entry;
      } else {
        mockJournals.push(entry);
      }
    }),
    getJournalEntries: jest.fn(async () => mockJournals.filter(j => !j.isDeleted)),
    deleteJournalEntry: jest.fn(async (id: string) => {
      const index = mockJournals.findIndex(j => j.id === id);
      if (index >= 0) {
        mockJournals[index].isDeleted = true;
      }
    }),
    saveSettings: jest.fn(async (settings: AppSettings) => {
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

// Import localDb after mock is set up
import { localDb } from '../../storage/localDb';

describe('Integration: privacy, storage, and calculator', () => {
  beforeEach(async () => {
    store.clear();
    // Reset mock data storage
    mockCharts = [];
    mockJournals = [];
    mockSettings = null;
    jest.clearAllMocks();
    await localDb.initialize();
  });

  test('consent -> store -> export -> delete flow', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    try {
      const privacyManager = new PrivacyComplianceManager();
      const dataRights = new DataRightsHandler();

      await privacyManager.recordConsent({
        granted: true,
        policyVersion: await privacyManager.getPolicyVersion(),
        timestamp: new Date().toISOString(),
        method: 'explicit',
        lawfulBasis: 'consent',
        purpose: 'astrology_personalization',
      });

      await localDb.saveChart({
        id: 'chart-1',
        name: 'Test Chart',
        birthDate: '2000-01-01',
        birthTime: '12:00',
        hasUnknownTime: false,
        birthPlace: 'Greenwich, UK',
        latitude: 51.4769,
        longitude: -0.0005,
        houseSystem: 'whole-sign',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDeleted: false,
      });

      const exportResult = await dataRights.handleDataExportRequest();
      expect(exportResult.success).toBe(true);
      expect(exportResult.package?.charts.length).toBe(1);

      const deletionResult = await dataRights.handleDataDeletionRequest();
      expect(deletionResult.success).toBe(true);

      const exportAfterDelete = await dataRights.handleDataExportRequest();
      expect(exportAfterDelete.package?.charts.length).toBe(0);
    } finally {
      consoleSpy.mockRestore();
    }
  });

  test('birth data -> chart -> emotional operating system flow', () => {
    const birthData: BirthData = {
      date: '1992-04-12',
      time: '13:45',
      hasUnknownTime: false,
      place: 'San Francisco, CA',
      latitude: 37.7749,
      longitude: -122.4194,
      houseSystem: 'whole-sign',
    };

    const chart = EnhancedAstrologyCalculator.generateNatalChart(birthData);
    expect(chart.houseSystem).toBe('whole-sign');

    const os = EmotionalOperatingSystemGenerator.generateEmotionalOS(chart);
    expect(os.emotionalLanguage.primaryMode.length).toBeGreaterThan(0);
  });

  test('unknown time handling flows through calculator', () => {
    const birthData: BirthData = {
      date: '1990-06-15',
      hasUnknownTime: true,
      place: 'New York, NY',
      latitude: 40.7128,
      longitude: -74.0060,
    };

    const chart = EnhancedAstrologyCalculator.generateNatalChart(birthData);
    expect(chart.risingSign).toBeNull();
    expect(chart.timeBasedFeaturesAvailable?.risingSign).toBe(false);
    expect(chart.timeBasedFeaturesAvailable?.houses).toBe(false);

    const display = ChartDisplayManager.formatChartWithTimeWarnings(chart);
    expect(display.warnings.length).toBeGreaterThan(0);
  });
});
