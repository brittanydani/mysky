import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { EncryptionManager, EncryptedEnvelope } from './encryptionManager';
import { SavedChart, JournalEntry, AppSettings } from './models';
import { logger } from '../../utils/logger';

/**
 * NOTE:
 * SecureStore is meant for small secrets. Storing full journals/charts can hit size limits.
 * Strongly recommended: store charts/journal in SQLite; keep only keys + consent + settings here.
 */
class SecureStorageService {
  private static readonly KEYS = {
    CHARTS: 'secure_charts',
    JOURNAL: 'secure_journal',
    SETTINGS: 'secure_settings',
    DELETED_CHARTS: 'secure_deleted_charts',
    DELETED_JOURNAL: 'secure_deleted_journal',
    PRIVACY_CONSENT: 'privacy_consent',
    DATA_PROCESSING_CONSENT: 'data_processing_consent',
    PRIVACY_POLICY_VERSION: 'privacy_policy_version',
    LAWFUL_BASIS_RECORDS: 'lawful_basis_records',
    AUDIT_TRAIL: 'secure_audit_trail',
    CONSENT_HISTORY: 'consent_history',
  };

  // ---- helpers ----
  private async newId(): Promise<string> {
    // Works well in Expo SDKs that support randomUUID
    return Crypto.randomUUID();
  }

  // Privacy consent management
  async hasPrivacyConsent(): Promise<boolean> {
    try {
      const record = await this.getEncryptedItem<boolean>(SecureStorageService.KEYS.PRIVACY_CONSENT);
      return record === true;
    } catch (error) {
      logger.error('[SecureStorage] Error checking privacy consent:', error);
      return false;
    }
  }

  async setPrivacyConsent(granted: boolean, policyVersion: string = '1.0', reason: string = 'user_action'): Promise<void> {
    await this.setEncryptedItem(SecureStorageService.KEYS.PRIVACY_CONSENT, granted);

    await this.setEncryptedItem(SecureStorageService.KEYS.DATA_PROCESSING_CONSENT, {
      granted,
      timestamp: new Date().toISOString(),
      version: policyVersion,
    });

    await this.auditDataAccess('privacy_consent_update', { granted, policyVersion, reason });

    await this.appendConsentHistory({
      id: await this.newId(),
      granted,
      policyVersion,
      timestamp: new Date().toISOString(),
      reason,
    });
  }

  async getConsentRecord(): Promise<{ granted: boolean; timestamp?: string; version?: string } | null> {
    try {
      const record = await this.getEncryptedItem<{ granted: boolean; timestamp?: string; version?: string }>(
        SecureStorageService.KEYS.DATA_PROCESSING_CONSENT
      );
      await this.auditDataAccess('privacy_consent_read', { found: Boolean(record) });
      return record;
    } catch (error) {
      logger.error('[SecureStorage] Error getting consent record:', error);
      return null;
    }
  }

  async setPrivacyPolicyVersion(version: string): Promise<void> {
    await this.setEncryptedItem(SecureStorageService.KEYS.PRIVACY_POLICY_VERSION, {
      version,
      updatedAt: new Date().toISOString(),
    });
    await this.auditDataAccess('privacy_policy_version_update', { version });
  }

  async getPrivacyPolicyVersion(): Promise<string | null> {
    try {
      const record = await this.getEncryptedItem<{ version: string }>(SecureStorageService.KEYS.PRIVACY_POLICY_VERSION);
      await this.auditDataAccess('privacy_policy_version_read', { found: Boolean(record) });
      return record?.version ?? null;
    } catch (error) {
      logger.error('[SecureStorage] Error reading privacy policy version:', error);
      return null;
    }
  }

  // ---- charts (WARNING: SecureStore size limits) ----
  async saveChart(chart: SavedChart): Promise<void> {
    await this.requireConsent('chart_save');
    const charts = await this.getCharts();

    const existingIndex = charts.findIndex(c => c.id === chart.id);
    if (existingIndex >= 0) charts[existingIndex] = chart;
    else charts.push(chart);

    // Hard cap to reduce risk of SecureStore size explosion
    const capped = charts.slice(-50);
    await this.setEncryptedItem(SecureStorageService.KEYS.CHARTS, capped);

    await this.auditDataAccess('chart_save', { chartId: chart.id });
  }

  async getCharts(): Promise<SavedChart[]> {
    try {
      const charts = await this.getEncryptedItem<SavedChart[]>(SecureStorageService.KEYS.CHARTS);
      await this.auditDataAccess('chart_list', { count: charts?.length ?? 0 });
      return charts ?? [];
    } catch (error) {
      logger.error('[SecureStorage] Error getting charts:', error);
      return [];
    }
  }

  async deleteChart(chartId: string): Promise<void> {
    const charts = await this.getCharts();
    const updatedCharts = charts.filter(chart => chart.id !== chartId);
    await this.recordDeletion(SecureStorageService.KEYS.DELETED_CHARTS, chartId);
    await this.setEncryptedItem(SecureStorageService.KEYS.CHARTS, updatedCharts);
    await this.auditDataAccess('chart_delete', { chartId });
  }

  // ---- journal (WARNING: SecureStore size limits) ----
  async saveJournalEntry(entry: JournalEntry): Promise<void> {
    await this.requireConsent('journal_save');
    const entries = await this.getJournalEntries();

    const existingIndex = entries.findIndex(e => e.id === entry.id);
    if (existingIndex >= 0) entries[existingIndex] = entry;
    else entries.push(entry);

    // Hard cap to reduce risk of SecureStore size explosion
    const capped = entries.slice(-200);
    await this.setEncryptedItem(SecureStorageService.KEYS.JOURNAL, capped);

    await this.auditDataAccess('journal_save', { entryId: entry.id });
  }

  async getJournalEntries(): Promise<JournalEntry[]> {
    try {
      const entries = await this.getEncryptedItem<JournalEntry[]>(SecureStorageService.KEYS.JOURNAL);
      await this.auditDataAccess('journal_list', { count: entries?.length ?? 0 });
      return entries ?? [];
    } catch (error) {
      logger.error('[SecureStorage] Error getting journal entries:', error);
      return [];
    }
  }

  async deleteJournalEntry(entryId: string): Promise<void> {
    const entries = await this.getJournalEntries();
    const updatedEntries = entries.filter(entry => entry.id !== entryId);
    await this.recordDeletion(SecureStorageService.KEYS.DELETED_JOURNAL, entryId);
    await this.setEncryptedItem(SecureStorageService.KEYS.JOURNAL, updatedEntries);
    await this.auditDataAccess('journal_delete', { entryId });
  }

  // ---- settings (DO NOT require consent; not “personal data collection”) ----
  async getSettings(): Promise<AppSettings | null> {
    try {
      const settings = await this.getEncryptedItem<AppSettings>(SecureStorageService.KEYS.SETTINGS);
      await this.auditDataAccess('settings_read', { found: Boolean(settings) });
      return settings ?? null;
    } catch (error) {
      logger.error('[SecureStorage] Error getting settings:', error);
      return null;
    }
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    await this.setEncryptedItem(SecureStorageService.KEYS.SETTINGS, settings);
    await this.auditDataAccess('settings_update', { settingsId: settings.id });
  }

  // GDPR/CCPA: deletion (best effort)
  async deleteAllUserData(): Promise<void> {
    await this.bestEffortDeleteKey(SecureStorageService.KEYS.CHARTS);
    await this.bestEffortDeleteKey(SecureStorageService.KEYS.JOURNAL);
    await this.bestEffortDeleteKey(SecureStorageService.KEYS.SETTINGS);
    await this.bestEffortDeleteKey(SecureStorageService.KEYS.DELETED_CHARTS);
    await this.bestEffortDeleteKey(SecureStorageService.KEYS.DELETED_JOURNAL);
    await this.bestEffortDeleteKey(SecureStorageService.KEYS.PRIVACY_CONSENT);
    await this.bestEffortDeleteKey(SecureStorageService.KEYS.DATA_PROCESSING_CONSENT);
    await this.bestEffortDeleteKey(SecureStorageService.KEYS.AUDIT_TRAIL);
    await this.bestEffortDeleteKey(SecureStorageService.KEYS.CONSENT_HISTORY);
    await this.bestEffortDeleteKey(SecureStorageService.KEYS.PRIVACY_POLICY_VERSION);
    await this.bestEffortDeleteKey(SecureStorageService.KEYS.LAWFUL_BASIS_RECORDS);
  }

  // Audit trail - kept minimal to avoid SecureStore 2KB limit
  async auditDataAccess(operation: string, metadata?: Record<string, any>): Promise<void> {
    try {
      const entry = {
        id: await this.newId(),
        operation,
        metadata: metadata ?? {},
        timestamp: new Date().toISOString(),
      };

      const existing = (await this.getEncryptedItem<any[]>(SecureStorageService.KEYS.AUDIT_TRAIL)) ?? [];
      // Keep only last 20 entries to stay well under 2KB limit
      const updated = [entry, ...existing].slice(0, 20);
      await this.setEncryptedItem(SecureStorageService.KEYS.AUDIT_TRAIL, updated);
    } catch (error) {
      logger.error('[SecureStorage] Error recording audit trail:', error);
    }
  }

  async getAuditTrail(): Promise<any[]> {
    try {
      return (await this.getEncryptedItem<any[]>(SecureStorageService.KEYS.AUDIT_TRAIL)) ?? [];
    } catch {
      return [];
    }
  }

  async getConsentHistory(): Promise<any[]> {
    try {
      const history = (await this.getEncryptedItem<any[]>(SecureStorageService.KEYS.CONSENT_HISTORY)) ?? [];
      await this.auditDataAccess('consent_history_read', { count: history.length });
      return history;
    } catch {
      return [];
    }
  }

  // Lawful basis records for GDPR compliance
  async getLawfulBasisRecords(): Promise<any[]> {
    try {
      const records = (await this.getEncryptedItem<any[]>(SecureStorageService.KEYS.LAWFUL_BASIS_RECORDS)) ?? [];
      return records;
    } catch (error) {
      logger.error('[SecureStorage] Error getting lawful basis records:', error);
      return [];
    }
  }

  async saveLawfulBasisRecords(records: any[]): Promise<void> {
    try {
      // Keep a small limit to stay under SecureStore 2KB limit
      const capped = records.slice(0, 20);
      await this.setEncryptedItem(SecureStorageService.KEYS.LAWFUL_BASIS_RECORDS, capped);
    } catch (error) {
      logger.error('[SecureStorage] Error saving lawful basis records:', error);
      throw error;
    }
  }

  // Check if user has any data stored
  async hasUserData(): Promise<boolean> {
    try {
      const charts = await this.getCharts();
      const entries = await this.getJournalEntries();
      return charts.length > 0 || entries.length > 0;
    } catch (error) {
      logger.error('[SecureStorage] Error checking for user data:', error);
      return false;
    }
  }

  // Export all user data for GDPR data portability
  async exportAllUserData(): Promise<{
    charts: SavedChart[];
    journalEntries: JournalEntry[];
    settings: AppSettings | null;
    consentRecord: { granted: boolean; timestamp?: string; version?: string } | null;
    exportedAt: string;
  }> {
    const [charts, journalEntries, settings, consentRecord] = await Promise.all([
      this.getCharts(),
      this.getJournalEntries(),
      this.getSettings(),
      this.getConsentRecord(),
    ]);

    await this.auditDataAccess('data_export', {
      chartsCount: charts.length,
      entriesCount: journalEntries.length,
    });

    return {
      charts,
      journalEntries,
      settings,
      consentRecord,
      exportedAt: new Date().toISOString(),
    };
  }

  // Clear content data but keep consent/audit records
  async clearContentData(): Promise<void> {
    await this.bestEffortDeleteKey(SecureStorageService.KEYS.CHARTS);
    await this.bestEffortDeleteKey(SecureStorageService.KEYS.JOURNAL);
    await this.bestEffortDeleteKey(SecureStorageService.KEYS.SETTINGS);
    await this.bestEffortDeleteKey(SecureStorageService.KEYS.DELETED_CHARTS);
    await this.bestEffortDeleteKey(SecureStorageService.KEYS.DELETED_JOURNAL);
    await this.auditDataAccess('content_data_cleared', {});
  }

  private async appendConsentHistory(entry: any): Promise<void> {
    const existing = (await this.getEncryptedItem<any[]>(SecureStorageService.KEYS.CONSENT_HISTORY)) ?? [];
    // Keep only 20 entries to stay under SecureStore 2KB limit
    const updated = [entry, ...existing].slice(0, 20);
    await this.setEncryptedItem(SecureStorageService.KEYS.CONSENT_HISTORY, updated);
  }

  // Encryption wrapper helpers
  private async setEncryptedItem(key: string, value: any): Promise<void> {
    const payload = await EncryptionManager.encryptSensitiveData(value);
    const envelope: EncryptedEnvelope = { encrypted: true, payload };
    await SecureStore.setItemAsync(key, JSON.stringify(envelope));
  }

  private async getEncryptedItem<T>(key: string): Promise<T | null> {
    const stored = await SecureStore.getItemAsync(key);
    if (!stored) return null;

    const parsed = this.safeJsonParse(stored);
    if (!parsed) return null;

    if (this.isEncryptedEnvelope(parsed)) {
      return await EncryptionManager.decryptSensitiveData<T>(parsed.payload);
    }

    // Legacy plaintext storage detected; upgrade
    await this.setEncryptedItem(key, parsed);
    return parsed as T;
  }

  private safeJsonParse(value: string): any | null {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  private isEncryptedEnvelope(value: any): value is EncryptedEnvelope {
    return Boolean(value?.encrypted && value?.payload);
  }

  /**
   * Best-effort deletion for SecureStore/Keychain.
   * Overwriting is not guaranteed at the storage layer; we do a best-effort random set, then delete.
   */
  private async bestEffortDeleteKey(key: string): Promise<void> {
    try {
      const existing = await SecureStore.getItemAsync(key);
      if (existing) {
        const junk = Crypto.getRandomBytes(64);
        await SecureStore.setItemAsync(key, JSON.stringify({ junk: Array.from(junk), t: Date.now() }));
      }
      await SecureStore.deleteItemAsync(key);
    } catch (e) {
      // still attempt delete
      try { await SecureStore.deleteItemAsync(key); } catch {}
    }
  }

  private async requireConsent(operation: string): Promise<void> {
    const consent = await this.getConsentRecord();
    if (!consent?.granted) {
      await this.auditDataAccess('consent_blocked_operation', { operation });
      throw new Error('Privacy consent required before collecting data');
    }
  }

  private async recordDeletion(key: string, id: string): Promise<void> {
    const existing = (await this.getEncryptedItem<Array<{ id: string; deletedAt: string }>>(key)) ?? [];
    // Keep only 20 entries to stay under SecureStore 2KB limit
    const updated = [{ id, deletedAt: new Date().toISOString() }, ...existing].slice(0, 20);
    await this.setEncryptedItem(key, updated);
  }
}

export const secureStorage = new SecureStorageService();