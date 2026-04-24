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

// Mock field encryption — legacy encrypted rows still read as pass-through in tests
jest.mock('../fieldEncryption', () => ({
  FieldEncryptionService: {
    initialize: jest.fn().mockResolvedValue(undefined),
    encryptField: jest.fn(async (val: string) => val),
    decryptField: jest.fn(async (val: string) => val),
    isEncrypted: jest.fn(() => false),
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

jest.mock('../../../utils/IdentityVault', () => ({
  IdentityVault: {
    sealIdentity: jest.fn().mockResolvedValue(undefined),
    destroyIdentity: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../syncService', () => ({
  enqueueBirthProfile: jest.fn().mockResolvedValue(undefined),
  deleteBirthProfileForCurrentUser: jest.fn().mockResolvedValue(undefined),
  enqueueSleepEntry: jest.fn().mockResolvedValue(undefined),
  enqueueJournalEntry: jest.fn().mockResolvedValue(undefined),
}));

import { localDb } from '../localDb';

const flushAsyncWork = async () => {
  await new Promise<void>((resolve) => setImmediate(resolve));
  await new Promise<void>((resolve) => setImmediate(resolve));
};

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

    it('upsertChart calls runAsync with cached chart values', async () => {
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

    it('updateAllChartsHouseSystem updates local charts without syncing when no session exists', async () => {
      mockDb.getAllAsync.mockResolvedValueOnce([]);

      await localDb.updateAllChartsHouseSystem('placidus' as any);

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE saved_charts SET house_system = ?, updated_at = ?'),
        ['placidus', expect.any(String)]
      );

      const syncService = require('../syncService');
      expect(syncService.enqueueBirthProfile).not.toHaveBeenCalled();
    });

    it('updateAllChartsHouseSystem syncs each active chart when a session exists', async () => {
      const { supabase } = require('../../../lib/supabase');
      supabase.auth.getSession.mockResolvedValueOnce({ data: { session: { user: { id: 'u1' } } } });
      mockDb.getAllAsync.mockResolvedValueOnce([
        {
          id: 'c1',
          name: 'Person One',
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
        {
          id: 'c2',
          name: 'Person Two',
          birth_date: '1991-02-02',
          birth_time: '09:30',
          has_unknown_time: 0,
          birth_place: 'LA',
          latitude: '34.05',
          longitude: '-118.24',
          timezone: 'America/Los_Angeles',
          house_system: 'whole-sign',
          created_at: '2025-01-02T00:00:00Z',
          updated_at: '2025-01-02T00:00:00Z',
          is_deleted: 0,
        },
      ]);

      await localDb.updateAllChartsHouseSystem('koch' as any);

      const syncService = require('../syncService');
      expect(syncService.enqueueBirthProfile).toHaveBeenCalledTimes(2);
      expect(syncService.enqueueBirthProfile).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ id: 'c1', houseSystem: 'koch', updatedAt: expect.any(String) })
      );
      expect(syncService.enqueueBirthProfile).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ id: 'c2', houseSystem: 'koch', updatedAt: expect.any(String) })
      );
    });

    it('hardDeleteChart destroys identity and syncs deletion when no charts remain', async () => {
      const { supabase } = require('../../../lib/supabase');
      const { IdentityVault } = require('../../../utils/IdentityVault');
      const syncService = require('../syncService');
      supabase.auth.getSession.mockResolvedValueOnce({ data: { session: { user: { id: 'u1' } } } });
      mockDb.getAllAsync.mockResolvedValueOnce([]);

      await localDb.hardDeleteChart('chart-1');
      await flushAsyncWork();

      expect(mockDb.runAsync).toHaveBeenCalledWith('DELETE FROM saved_charts WHERE id = ?', ['chart-1']);
      expect(IdentityVault.destroyIdentity).toHaveBeenCalled();
      expect(syncService.deleteBirthProfileForCurrentUser).toHaveBeenCalledWith('chart-1');
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

    it('getSettings maps persisted flags and backup timestamp', async () => {
      mockDb.getFirstAsync.mockResolvedValueOnce({
        id: 'default',
        cloud_sync_enabled: 1,
        last_sync_at: '2025-06-02T00:00:00Z',
        last_backup_at: '2025-06-03T00:00:00Z',
        user_id: 'user-1',
        created_at: '2025-06-01T00:00:00Z',
        updated_at: '2025-06-04T00:00:00Z',
      });

      await expect(localDb.getSettings()).resolves.toEqual({
        id: 'default',
        cloudSyncEnabled: true,
        lastSyncAt: '2025-06-02T00:00:00Z',
        lastBackupAt: '2025-06-03T00:00:00Z',
        userId: 'user-1',
        createdAt: '2025-06-01T00:00:00Z',
        updatedAt: '2025-06-04T00:00:00Z',
      });
    });
  });

  describe('sleep entry operations', () => {
    beforeEach(async () => {
      (localDb as any).db = null;
      (localDb as any).initPromise = null;
      await localDb.initialize();
      jest.clearAllMocks();
    });

    it('getSleepEntries reads optional cached fields', async () => {
      mockDb.getAllAsync.mockResolvedValueOnce([
        {
          id: 'sleep-1',
          chart_id: 'chart-1',
          date: '2025-06-01',
          duration_hours: 7.5,
          quality: 4,
          dream_text: 'Flying over water',
          dream_mood: 'peaceful',
          dream_feelings: 'awe',
          dream_metadata: '{"symbol":"bird"}',
          notes: 'slept deeply',
          created_at: '2025-06-01T00:00:00Z',
          updated_at: '2025-06-01T00:00:00Z',
          is_deleted: 0,
        },
      ]);

      await expect(localDb.getSleepEntries('chart-1')).resolves.toEqual([
        {
          id: 'sleep-1',
          chartId: 'chart-1',
          date: '2025-06-01',
          durationHours: 7.5,
          quality: 4,
          dreamText: 'Flying over water',
          dreamMood: 'peaceful',
          dreamFeelings: 'awe',
          dreamMetadata: '{"symbol":"bird"}',
          notes: 'slept deeply',
          createdAt: '2025-06-01T00:00:00Z',
          updatedAt: '2025-06-01T00:00:00Z',
          isDeleted: false,
        },
      ]);
    });

    it('saveSleepEntry enqueues the raw stored entry when a session exists', async () => {
      const { supabase } = require('../../../lib/supabase');
      const syncService = require('../syncService');
      supabase.auth.getSession.mockResolvedValueOnce({ data: { session: { user: { id: 'u1' } } } });
      mockDb.getFirstAsync.mockResolvedValueOnce({
        id: 'sleep-1',
        chart_id: 'chart-1',
        date: '2025-06-01',
        duration_hours: 8,
        quality: 5,
        dream_text: 'Encrypted dream',
        dream_mood: 'joyful',
        dream_feelings: 'light',
        dream_metadata: '{"theme":"sky"}',
        notes: 'Encrypted notes',
        created_at: '2025-06-01T00:00:00Z',
        updated_at: '2025-06-01T00:00:00Z',
        is_deleted: 0,
      });

      await localDb.saveSleepEntry({
        id: 'sleep-1',
        chartId: 'chart-1',
        date: '2025-06-01',
        durationHours: 8,
        quality: 5,
        dreamText: 'Encrypted dream',
        dreamMood: 'joyful',
        dreamFeelings: 'light',
        dreamMetadata: '{"theme":"sky"}',
        notes: 'Encrypted notes',
        createdAt: '2025-06-01T00:00:00Z',
        updatedAt: '2025-06-01T00:00:00Z',
        isDeleted: false,
      } as any);
      await flushAsyncWork();

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT OR REPLACE INTO sleep_entries'),
        expect.arrayContaining(['sleep-1', 'chart-1', '2025-06-01'])
      );
      expect(syncService.enqueueSleepEntry).toHaveBeenCalledWith({
        id: 'sleep-1',
        chartId: 'chart-1',
        date: '2025-06-01',
        durationHours: 8,
        quality: 5,
        dreamText: 'Encrypted dream',
        dreamMood: 'joyful',
        dreamFeelings: 'light',
        dreamMetadata: '{"theme":"sky"}',
        notes: 'Encrypted notes',
        createdAt: '2025-06-01T00:00:00Z',
        updatedAt: '2025-06-01T00:00:00Z',
        isDeleted: false,
      });
    });
  });

  describe('migration marker operations', () => {
    beforeEach(async () => {
      (localDb as any).db = null;
      (localDb as any).initPromise = null;
      await localDb.initialize();
      jest.clearAllMocks();
    });

    it('getMigrationMarker returns false when a marker is absent', async () => {
      mockDb.getFirstAsync.mockResolvedValueOnce(null);
      await expect(localDb.getMigrationMarker('v21-sync-queue')).resolves.toBe(false);
    });

    it('setMigrationMarker records completion with a timestamp', async () => {
      await localDb.setMigrationMarker('v21-sync-queue');
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        'INSERT OR REPLACE INTO migration_markers (key, completed_at) VALUES (?, ?)',
        ['v21-sync-queue', expect.any(String)]
      );
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
