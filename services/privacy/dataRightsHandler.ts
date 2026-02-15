import { localDb } from '../storage/localDb';
import { secureStorage } from '../storage/secureStorage';
import { AccessResult, DeletionResult, ExportPackage, ExportResult } from './types';
import { logger } from '../../utils/logger';

type ProgressCallback = (step: string) => void;

export class DataRightsHandler {
  async handleDataExportRequest(onProgress?: ProgressCallback): Promise<ExportResult> {
    const startedAt = Date.now();
    try {
      onProgress?.('export_started');
      const exportPackage = await this.runWithTimeout(this.exportAllData(), 30_000);
      const completedAt = new Date().toISOString();

      await this.recordPrivacyOperation('data_export', Date.now() - startedAt, true);
      onProgress?.('export_completed');

      return {
        success: true,
        package: exportPackage,
        completedAt,
      };
    } catch (error: any) {
      const completedAt = new Date().toISOString();
      const isTimeout = error?.message?.includes('timeout');

      await this.recordPrivacyOperation('data_export', Date.now() - startedAt, false, error);

      if (isTimeout) {
        logger.warn('[Privacy] Data export exceeded 30 seconds');
      }

      return {
        success: false,
        completedAt,
      };
    }
  }

  async handleDataDeletionRequest(onProgress?: ProgressCallback): Promise<DeletionResult> {
    const startedAt = Date.now();
    try {
      onProgress?.('deletion_started');
      await secureStorage.deleteAllUserData();
      await localDb.initialize();
      await localDb.hardDeleteAllData();
      await this.recordPrivacyOperation('data_deletion', Date.now() - startedAt, true);
      onProgress?.('deletion_completed');
      return {
        success: true,
        completedAt: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error('[Privacy] Data deletion failed:', error);
      await this.recordPrivacyOperation('data_deletion', Date.now() - startedAt, false, error).catch(() => {});
      return {
        success: false,
        completedAt: new Date().toISOString(),
      };
    }
  }

  async handleDataAccessRequest(): Promise<AccessResult> {
    const startedAt = Date.now();
    const [charts, journalEntries, settings, consentRecord, lawfulBasisRecords] = await Promise.all([
      localDb.getCharts(),
      localDb.getJournalEntries(),
      localDb.getSettings(),
      secureStorage.getConsentRecord(),
      secureStorage.getLawfulBasisRecords(),
    ]);

    await this.recordPrivacyOperation('data_access', Date.now() - startedAt, true);

    return {
      success: true,
      dataInventory: {
        chartsCount: charts.length,
        journalEntriesCount: journalEntries.length,
        settingsPresent: Boolean(settings),
        consentRecordPresent: Boolean(consentRecord),
        lawfulBasisRecordsCount: lawfulBasisRecords.length,
      },
      completedAt: new Date().toISOString(),
    };
  }

  private async exportAllData(): Promise<ExportPackage> {
    const [charts, journalEntries, settings, consentRecord, lawfulBasisRecords] = await Promise.all([
      localDb.getCharts(),
      localDb.getJournalEntries(),
      localDb.getSettings(),
      secureStorage.getConsentRecord(),
      secureStorage.getLawfulBasisRecords(),
    ]);

    return {
      charts: charts.filter((chart) => !chart.isDeleted),
      journalEntries: journalEntries.filter((entry) => !entry.isDeleted),
      settings,
      consentRecord,
      lawfulBasisRecords,
      exportedAt: new Date().toISOString(),
    };
  }

  private async runWithTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<T>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('timeout')), timeoutMs);
    });

    try {
      return (await Promise.race([promise, timeout])) as T;
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  private async recordPrivacyOperation(
    operation: string,
    durationMs: number,
    success: boolean,
    error?: Error
  ): Promise<void> {
    await secureStorage.auditDataAccess('privacy_operation', {
      operation,
      durationMs,
      success,
      error: error?.message,
    });
  }
}