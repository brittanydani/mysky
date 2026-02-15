import { localDb } from './localDb';
import { secureStorage } from './secureStorage';
import { logger } from '../../utils/logger';

/**
 * Migration service to help existing users transition from SQLite to secure storage
 * This ensures privacy compliance for existing data
 */
export class MigrationService {
  private static readonly MIGRATION_KEY = 'data_migration_completed';

  /**
   * Check if migration has been completed
   */
  static async isMigrationCompleted(): Promise<boolean> {
    try {
      await localDb.initialize();
      const marker = await localDb.getMigrationMarker(MigrationService.MIGRATION_KEY);
      return marker === true;
    } catch (error) {
      logger.error('[Migration] Error checking migration status:', error);
      return false;
    }
  }

  /**
   * Migrate existing SQLite data to secure storage
   */
  static async migrateToSecureStorage(): Promise<{ success: boolean; error?: string }> {
    try {
      logger.info('[Migration] Starting data migration to secure storage...');

      // Check if migration already completed
      if (await MigrationService.isMigrationCompleted()) {
        logger.info('[Migration] Migration already completed');
        return { success: true };
      }

      // Initialize SQLite database to read existing data
      await localDb.initialize();

      // Migrate charts
      const existingCharts = await localDb.getCharts();
      logger.info(`[Migration] Found ${existingCharts.length} charts to migrate`);
      
      for (const chart of existingCharts) {
        await secureStorage.saveChart(chart);
      }

      // Migrate journal entries
      const existingEntries = await localDb.getJournalEntries();
      logger.info(`[Migration] Found ${existingEntries.length} journal entries to migrate`);
      
      for (const entry of existingEntries) {
        await secureStorage.saveJournalEntry(entry);
      }

      // Migrate settings
      const existingSettings = await localDb.getSettings();
      if (existingSettings) {
        await secureStorage.saveSettings(existingSettings);
      }

      // Mark migration as completed
      await localDb.setMigrationMarker(MigrationService.MIGRATION_KEY);

      logger.info('[Migration] Data migration completed successfully');
      return { success: true };

    } catch (error: any) {
      logger.error('[Migration] Migration failed:', error);
      return { 
        success: false, 
        error: error.message || 'Migration failed' 
      };
    }
  }

  /**
   * Perform migration if needed (call this on app startup)
   */
  static async performMigrationIfNeeded(): Promise<void> {
    try {
      // Check if user has given privacy consent first
      const hasConsent = await secureStorage.hasPrivacyConsent();
      if (!hasConsent) {
        logger.info('[Migration] Skipping migration - no privacy consent');
        return;
      }

      // Check if migration is needed
      if (await MigrationService.isMigrationCompleted()) {
        return;
      }

      // Check if there's any data to migrate
      await localDb.initialize();
      const [charts, entries] = await Promise.all([
        localDb.getCharts(),
        localDb.getJournalEntries(),
      ]);

      if (charts.length === 0 && entries.length === 0) {
        // No data to migrate, mark as completed
        await localDb.setMigrationMarker(MigrationService.MIGRATION_KEY);
        return;
      }

      // Perform migration
      const result = await MigrationService.migrateToSecureStorage();
      if (!result.success) {
        logger.error('[Migration] Failed to migrate data:', result.error);
      }

    } catch (error) {
      logger.error('[Migration] Error during migration check:', error);
    }
  }
}