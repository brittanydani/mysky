import { logger } from '../../utils/logger';

/**
 * Migration service — legacy SQLite-to-secure-storage migration.
 * All methods are now no-ops: the app uses Supabase directly (network-first).
 * Kept for call-site compatibility during the transition.
 */
export class MigrationService {
  static async isMigrationCompleted(): Promise<boolean> {
    return true;
  }

  static async migrateToSecureStorage(): Promise<{ success: boolean; error?: string }> {
    return { success: true };
  }

  static async performMigrationIfNeeded(): Promise<void> {
    logger.info('[Migration] No-op: app uses network-first Supabase architecture');
  }
}
