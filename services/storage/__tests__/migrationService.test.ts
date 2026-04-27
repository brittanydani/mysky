jest.mock('../../../utils/logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import { logger } from '../../../utils/logger';
import { MigrationService } from '../migrationService';

describe('MigrationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isMigrationCompleted()', () => {
    it('always returns true because legacy migration is no-op under Supabase architecture', async () => {
      await expect(MigrationService.isMigrationCompleted()).resolves.toBe(true);
    });
  });

  describe('migrateToSecureStorage()', () => {
    it('returns success without performing legacy local migration', async () => {
      await expect(MigrationService.migrateToSecureStorage()).resolves.toEqual({ success: true });
    });
  });

  describe('performMigrationIfNeeded()', () => {
    it('logs that migration is skipped under network-first Supabase architecture', async () => {
      await MigrationService.performMigrationIfNeeded();

      expect(logger.info).toHaveBeenCalledWith(
        '[Migration] No-op: app uses network-first Supabase architecture',
      );
    });
  });
});
