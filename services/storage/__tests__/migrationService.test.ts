jest.mock('../../../utils/logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock('../localDb', () => ({
  localDb: {
    initialize: jest.fn(),
    getMigrationMarker: jest.fn(),
    setMigrationMarker: jest.fn(),
    getSettings: jest.fn(),
    getCharts: jest.fn(),
    getJournalEntries: jest.fn(),
  },
}));

jest.mock('../secureStorage', () => ({
  secureStorage: {
    hasPrivacyConsent: jest.fn(),
    saveSettings: jest.fn(),
  },
}));

import { MigrationService } from '../migrationService';
import { localDb } from '../localDb';
import { secureStorage } from '../secureStorage';

const mockDb = localDb as jest.Mocked<typeof localDb>;
const mockStorage = secureStorage as jest.Mocked<typeof secureStorage>;

describe('MigrationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDb.initialize.mockResolvedValue(undefined as any);
    mockDb.getMigrationMarker.mockResolvedValue(false);
    mockDb.setMigrationMarker.mockResolvedValue(undefined as any);
    mockDb.getSettings.mockResolvedValue(null);
    mockDb.getCharts.mockResolvedValue([]);
    mockDb.getJournalEntries.mockResolvedValue([]);
    mockStorage.hasPrivacyConsent.mockResolvedValue(false);
    mockStorage.saveSettings.mockResolvedValue(undefined as any);
  });

  // ── isMigrationCompleted ─────────────────────────────────────────────────
  describe('isMigrationCompleted()', () => {
    it('returns true when marker is set', async () => {
      mockDb.getMigrationMarker.mockResolvedValue(true);
      expect(await MigrationService.isMigrationCompleted()).toBe(true);
      expect(mockDb.initialize).toHaveBeenCalledTimes(1);
    });

    it('returns false when marker is absent', async () => {
      mockDb.getMigrationMarker.mockResolvedValue(false);
      expect(await MigrationService.isMigrationCompleted()).toBe(false);
    });

    it('returns false and logs when localDb throws', async () => {
      mockDb.initialize.mockRejectedValue(new Error('DB error'));
      expect(await MigrationService.isMigrationCompleted()).toBe(false);
    });
  });

  // ── migrateToSecureStorage ───────────────────────────────────────────────
  describe('migrateToSecureStorage()', () => {
    it('skips and returns success when migration already completed', async () => {
      mockDb.getMigrationMarker.mockResolvedValue(true);
      const result = await MigrationService.migrateToSecureStorage();
      expect(result.success).toBe(true);
      expect(mockStorage.saveSettings).not.toHaveBeenCalled();
    });

    it('saves settings and sets marker when migration is needed', async () => {
      const settings = { id: 's1', theme: 'dark' } as any;
      mockDb.getSettings.mockResolvedValue(settings);
      const result = await MigrationService.migrateToSecureStorage();
      expect(result.success).toBe(true);
      expect(mockStorage.saveSettings).toHaveBeenCalledWith(settings);
      expect(mockDb.setMigrationMarker).toHaveBeenCalledWith('data_migration_completed');
    });

    it('skips saveSettings when no prior settings exist', async () => {
      mockDb.getSettings.mockResolvedValue(null);
      const result = await MigrationService.migrateToSecureStorage();
      expect(result.success).toBe(true);
      expect(mockStorage.saveSettings).not.toHaveBeenCalled();
    });

    it('returns error on unexpected failure', async () => {
      mockDb.getSettings.mockRejectedValue(new Error('Crash'));
      const result = await MigrationService.migrateToSecureStorage();
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/Crash/);
    });
  });

  // ── performMigrationIfNeeded ─────────────────────────────────────────────
  describe('performMigrationIfNeeded()', () => {
    it('skips entirely when no privacy consent', async () => {
      mockStorage.hasPrivacyConsent.mockResolvedValue(false);
      await MigrationService.performMigrationIfNeeded();
      expect(mockDb.getMigrationMarker).not.toHaveBeenCalled();
    });

    it('skips when migration already completed', async () => {
      mockStorage.hasPrivacyConsent.mockResolvedValue(true);
      mockDb.getMigrationMarker.mockResolvedValue(true);
      await MigrationService.performMigrationIfNeeded();
      expect(mockDb.getCharts).not.toHaveBeenCalled();
    });

    it('marks done without migrating when no data exists', async () => {
      mockStorage.hasPrivacyConsent.mockResolvedValue(true);
      mockDb.getMigrationMarker.mockResolvedValue(false);
      mockDb.getCharts.mockResolvedValue([]);
      mockDb.getJournalEntries.mockResolvedValue([]);
      await MigrationService.performMigrationIfNeeded();
      expect(mockDb.setMigrationMarker).toHaveBeenCalledWith('data_migration_completed');
    });

    it('runs migration when data exists', async () => {
      mockStorage.hasPrivacyConsent.mockResolvedValue(true);
      mockDb.getMigrationMarker.mockResolvedValue(false);
      mockDb.getCharts.mockResolvedValue([{ id: 'c1' }] as any);
      mockDb.getJournalEntries.mockResolvedValue([]);
      const settings = { id: 's1' } as any;
      mockDb.getSettings.mockResolvedValue(settings);
      await MigrationService.performMigrationIfNeeded();
      expect(mockStorage.saveSettings).toHaveBeenCalledWith(settings);
    });
  });
});
