// Mock expo-sqlite async API
const mockDb = {
  execAsync: jest.fn().mockResolvedValue(undefined),
  runAsync: jest.fn().mockResolvedValue({ changes: 0, lastInsertRowId: 0 }),
  getFirstAsync: jest.fn().mockResolvedValue(null),
  getAllAsync: jest.fn().mockResolvedValue([]),
  withTransactionAsync: jest.fn(async (fn: () => Promise<void>) => fn()),
};

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn().mockResolvedValue(mockDb),
}));

// Mock field encryption — pass through unencrypted for tests
jest.mock('../fieldEncryption', () => ({
  FieldEncryptionService: {
    initialize: jest.fn().mockResolvedValue(undefined),
    encryptField: jest.fn(async (val: string) => val),
    decryptField: jest.fn(async (val: string) => val),
  },
  isDecryptionFailure: jest.fn(() => false),
}));

jest.mock('../../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
    },
  },
}));

import { localDb } from '../localDb';

describe('localDb', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('opens the database and runs migrations', async () => {
      const SQLite = require('expo-sqlite');
      // Reset the singleton's internal state for each test
      (localDb as any).db = null;
      (localDb as any).initPromise = null;

      await localDb.initialize();

      expect(SQLite.openDatabaseAsync).toHaveBeenCalledWith('mysky.db');
      // Migrations involve execAsync calls
      expect(mockDb.execAsync).toHaveBeenCalled();
    });

    it('is safe to call multiple times', async () => {
      (localDb as any).db = null;
      (localDb as any).initPromise = null;

      await localDb.initialize();
      await localDb.initialize();

      // Should only open once
      const SQLite = require('expo-sqlite');
      expect(SQLite.openDatabaseAsync).toHaveBeenCalledTimes(1);
    });
  });

  describe('chart operations', () => {
    beforeEach(async () => {
      (localDb as any).db = null;
      (localDb as any).initPromise = null;
      await localDb.initialize();
      jest.clearAllMocks();
    });

    it('upsertChart calls runAsync with encrypted fields', async () => {
      const chart = {
        id: 'chart-1',
        name: 'Test',
        birthDate: '1990-01-01',
        birthTime: '12:00',
        hasUnknownTime: false,
        birthPlace: 'New York',
        latitude: 40.71,
        longitude: -74.0,
        timezone: 'America/New_York',
        houseSystem: 'whole-sign',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        isDeleted: false,
      };

      await localDb.upsertChart(chart as any);
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT OR REPLACE INTO saved_charts'),
        expect.arrayContaining(['chart-1'])
      );
    });

    it('getCharts returns decoded rows', async () => {
      mockDb.getAllAsync.mockResolvedValueOnce([
        {
          id: 'c1',
          name: 'Person',
          birth_date: '1990-01-01',
          birth_time: '12:00',
          has_unknown_time: 0,
          birth_place: 'NYC',
          latitude: '40.71',
          longitude: '-74.0',
          timezone: 'America/New_York',
          house_system: 'whole-sign',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
          is_deleted: 0,
        },
      ]);

      const charts = await localDb.getCharts();
      expect(charts.length).toBe(1);
      expect(charts[0].id).toBe('c1');
    });

    it('deleteChart performs soft delete', async () => {
      await localDb.deleteChart('chart-1');
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('is_deleted'),
        expect.arrayContaining(['chart-1'])
      );
    });

    it('deleteChartFromSync performs a local-only soft delete', async () => {
      await localDb.deleteChartFromSync('chart-1', '2026-04-04T00:00:00.000Z');
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('is_deleted'),
        ['2026-04-04T00:00:00.000Z', 'chart-1']
      );
    });
  });

  describe('journal operations', () => {
    beforeEach(async () => {
      (localDb as any).db = null;
      (localDb as any).initPromise = null;
      await localDb.initialize();
      jest.clearAllMocks();
    });

    it('addJournalEntry calls runAsync', async () => {
      const entry = {
        id: 'j1',
        chartId: 'c1',
        content: 'Today I reflected on...',
        title: 'Reflection',
        tags: ['growth'],
        keywords: ['reflection'],
        emotions: ['calm'],
        sentiment: 0.5,
        category: 'reflection',
        createdAt: '2025-06-01T12:00:00Z',
        updatedAt: '2025-06-01T12:00:00Z',
      };

      await localDb.addJournalEntry(entry as any);
      expect(mockDb.runAsync).toHaveBeenCalled();
    });

    it('getJournalEntries returns decoded rows', async () => {
      mockDb.getAllAsync.mockResolvedValueOnce([
        {
          id: 'j1',
          chart_id: 'c1',
          content: 'Test',
          title: 'Title',
          tags: '["tag1"]',
          keywords: '["kw1"]',
          emotions: '["calm"]',
          sentiment: 0.5,
          category: 'reflection',
          created_at: '2025-06-01T12:00:00Z',
          updated_at: '2025-06-01T12:00:00Z',
          is_deleted: 0,
        },
      ]);

      const entries = await localDb.getJournalEntries();
      expect(entries.length).toBe(1);
      expect(entries[0].id).toBe('j1');
    });

    it('getJournalEntryCount returns a number', async () => {
      mockDb.getFirstAsync.mockResolvedValueOnce({ cnt: 42 });
      const count = await localDb.getJournalEntryCount();
      expect(count).toBe(42);
    });
  });

  describe('settings operations', () => {
    beforeEach(async () => {
      (localDb as any).db = null;
      (localDb as any).initPromise = null;
      await localDb.initialize();
      jest.clearAllMocks();
    });

    it('getSettings returns null when no settings exist', async () => {
      mockDb.getFirstAsync.mockResolvedValueOnce(null);
      const settings = await localDb.getSettings();
      expect(settings).toBeNull();
    });

    it('updateSettings calls runAsync', async () => {
      await localDb.updateSettings({ theme: 'dark' } as any);
      expect(mockDb.runAsync).toHaveBeenCalled();
    });
  });

  describe('hardDeleteAllData', () => {
    beforeEach(async () => {
      (localDb as any).db = null;
      (localDb as any).initPromise = null;
      await localDb.initialize();
      jest.clearAllMocks();
    });

    it('deletes from all tables via execAsync', async () => {
      await localDb.hardDeleteAllData();
      // hardDeleteAllData uses execAsync with BEGIN TRANSACTION + DELETE + COMMIT
      const calls = mockDb.execAsync.mock.calls.map((c: any[]) => c[0]);
      const hasTransaction = calls.some((sql: string) => sql.includes('DELETE FROM saved_charts'));
      expect(hasTransaction).toBe(true);
    });

    it('can clear account-scoped data without deleting app settings', async () => {
      await localDb.clearAccountScopedData();
      const calls = mockDb.execAsync.mock.calls.map((c: any[]) => c[0]);
      const hasScopedDelete = calls.some((sql: string) => sql.includes('DELETE FROM sync_queue'));
      expect(hasScopedDelete).toBe(true);
    });
  });
});
