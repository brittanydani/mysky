import { generateId } from '../storage/models';
import { LawfulBasisAuditService } from './lawfulBasisAudit';
import {
  auditPrivacyEvent,
  deletePrivacyComplianceData,
  getConsentRecord,
  getLawfulBasisRecords,
  getPrivacyPolicyVersion,
  setPrivacyConsent,
  setPrivacyPolicyVersion,
} from './privacySupabaseService';
import {
  ConsentData,
  ConsentRecord,
  ConsentResult,
  ConsentStatus,
  LawfulBasisRecord,
  LawfulBasisAuditReport,
  ExportResult,
  DeletionResult,
  AccessResult,
} from './types';

async function loadSupabaseDb() {
  const mod = await import('../storage/supabaseDb');
  return mod.supabaseDb;
}

export class PrivacyComplianceManager {
  static DEFAULT_POLICY_VERSION = '1.0';
  private readonly audit = new LawfulBasisAuditService();
  static CONSENT_MAX_AGE_DAYS = 365;

  async requestConsent(): Promise<ConsentResult> {
    const policyVersion = (await getPrivacyPolicyVersion()) ?? PrivacyComplianceManager.DEFAULT_POLICY_VERSION;
    const existing = await getConsentRecord();

    const isExpired = this.isConsentExpired(existing?.timestamp);

    if (existing?.granted && existing.version === policyVersion && !isExpired) {
      return {
        required: false,
        policyVersion,
        existingConsent: {
          granted: existing.granted,
          policyVersion: existing.version ?? policyVersion,
          timestamp: existing.timestamp ?? new Date().toISOString(),
          method: 'explicit',
          lawfulBasis: 'consent',
          purpose: 'astrology_personalization',
        },
      };
    }

    return {
      required: true,
      policyVersion,
    };
  }

  async recordConsent(consent: ConsentData): Promise<ConsentRecord> {
    const record: ConsentRecord = {
      ...consent,
      id: generateId(),
    };

    await setPrivacyPolicyVersion(consent.policyVersion);
    await setPrivacyConsent(consent.granted, consent.policyVersion, 'consent_recorded');

    const lawfulRecord: LawfulBasisRecord = {
      id: generateId(),
      timestamp: consent.timestamp,
      policyVersion: consent.policyVersion,
      lawfulBasis: consent.lawfulBasis,
      purpose: consent.purpose,
      dataCategories: ['birth_data', 'journal_entries', 'usage_preferences'],
      processingActivities: ['chart_calculation', 'personalized_guidance', 'data_storage'],
    };

    await this.audit.recordProcessingOperation({
      policyVersion: lawfulRecord.policyVersion,
      lawfulBasis: lawfulRecord.lawfulBasis,
      purpose: lawfulRecord.purpose,
      dataCategories: lawfulRecord.dataCategories,
      processingActivities: lawfulRecord.processingActivities,
      timestamp: lawfulRecord.timestamp,
      retentionPeriod: lawfulRecord.retentionPeriod,
    });
    return record;
  }

  async withdrawConsent(): Promise<void> {
    const policyVersion = await this.getPolicyVersion();
    await setPrivacyConsent(false, policyVersion, 'withdrawn');

    // Record the withdrawal in the lawful basis audit trail for GDPR compliance
    await this.audit.recordProcessingOperation({
      policyVersion,
      lawfulBasis: 'consent',
      purpose: 'consent_withdrawal',
      dataCategories: ['birth_data', 'journal_entries', 'usage_preferences'],
      processingActivities: ['consent_withdrawn'],
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get current consent status including expiry information.
   * Useful for UI display and compliance checks.
   */
  async getConsentStatus(): Promise<ConsentStatus> {
    const policyVersion = await this.getPolicyVersion();
    const existing = await getConsentRecord();

    if (!existing) {
      return {
        granted: false,
        policyVersion,
        method: 'explicit',
        lawfulBasis: 'consent',
        purpose: 'astrology_personalization',
      };
    }

    const isExpired = this.isConsentExpired(existing.timestamp);
    const expiresAt = existing.timestamp
      ? new Date(
          new Date(existing.timestamp).getTime() +
            PrivacyComplianceManager.CONSENT_MAX_AGE_DAYS * 24 * 60 * 60 * 1000
        ).toISOString()
      : undefined;

    return {
      granted: existing.granted,
      policyVersion: existing.version ?? policyVersion,
      timestamp: existing.timestamp,
      expired: isExpired,
      expiresAt,
      method: 'explicit',
      lawfulBasis: 'consent',
      purpose: 'astrology_personalization',
    };
  }

  // ── GDPR Data Rights ──

  /**
   * Article 15 — Right of access.
   * Returns an inventory of all personal data held.
   */
  async handleAccessRequest(): Promise<AccessResult> {
    const db = await loadSupabaseDb();
    const [charts, journalEntries, settings, consentRecord, lawfulBasisRecords, asyncStorageData] =
      await Promise.all([
        db.getCharts(),
        db.getJournalEntries(),
        db.getSettings(),
        getConsentRecord(),
        getLawfulBasisRecords(),
        this.readLegacyLocalUserData(),
      ]);

    await auditPrivacyEvent('gdpr_access_request', {
      chartsCount: charts.length,
      entriesCount: journalEntries.length,
    });

    return {
      success: true,
      dataInventory: {
        chartsCount: charts.length,
        journalEntriesCount: journalEntries.length,
        settingsPresent: settings !== null,
        consentRecordPresent: consentRecord !== null,
        lawfulBasisRecordsCount: lawfulBasisRecords.length,
        asyncStorageKeysCount: Object.keys(asyncStorageData).length,
      },
      completedAt: new Date().toISOString(),
    };
  }

  /**
   * Article 20 — Right to data portability.
   * Exports all personal data in a structured, machine-readable format.
   */
  async handleExportRequest(): Promise<ExportResult> {
    const db = await loadSupabaseDb();
    const [charts, journalEntries, settings, consentRecord, lawfulBasisRecords, asyncStorageData] =
      await Promise.all([
        db.getCharts(),
        db.getJournalEntries(),
        db.getSettings(),
        getConsentRecord(),
        getLawfulBasisRecords(),
        this.readLegacyLocalUserData(),
      ]);

    // Calculate full natal chart data for each chart
    const { EnhancedAstrologyCalculator } = await import('../astrology/calculator');
    const { detectChartPatterns } = await import('../astrology/chartPatterns');
    const fullCharts = charts.map((chart) => {
      // Compose birth data for calculation
      const birthData = {
        date: chart.birthDate,
        time: chart.birthTime,
        hasUnknownTime: chart.hasUnknownTime,
        place: chart.birthPlace,
        latitude: chart.latitude,
        longitude: chart.longitude,
        timezone: chart.timezone,
        houseSystem: chart.houseSystem,
      };
      let natalChart = null;
      let chartPatterns = null;
      try {
        natalChart = EnhancedAstrologyCalculator.generateNatalChart(birthData);
        chartPatterns = detectChartPatterns(natalChart);
      } catch (e) {
        // If calculation fails, include error info
        natalChart = { error: String(e) };
        chartPatterns = null;
      }
      return {
        ...chart,
        natalChart,
        chartPatterns,
      };
    });

    await auditPrivacyEvent('gdpr_export_request', {
      chartsCount: fullCharts.length,
      entriesCount: journalEntries.length,
    });

    return {
      success: true,
      package: {
        charts: fullCharts,
        journalEntries,
        settings,
        consentRecord,
        lawfulBasisRecords,
        asyncStorageData: Object.keys(asyncStorageData).length > 0 ? asyncStorageData : undefined,
        exportedAt: new Date().toISOString(),
      },
      completedAt: new Date().toISOString(),
    };
  }

  /**
   * Article 17 — Right to erasure ("right to be forgotten").
   * Deletes personal data from Supabase-backed storage.
   */
  async handleDeletionRequest(): Promise<DeletionResult> {
    const db = await loadSupabaseDb();

    // Record audit entry before deletion (so we have proof the request was received)
    await auditPrivacyEvent('gdpr_deletion_request', {});

    await Promise.all([
      deletePrivacyComplianceData(),
      db.hardDeleteAllData(),
    ]);

    // Destroy any remaining local encrypted-key material and the identity vault.

    return {
      success: true,
      completedAt: new Date().toISOString(),
    };
  }

  async recordLawfulBasis(record: LawfulBasisRecord): Promise<void> {
    await this.audit.recordProcessingOperation({
      policyVersion: record.policyVersion,
      lawfulBasis: record.lawfulBasis,
      purpose: record.purpose,
      dataCategories: record.dataCategories,
      processingActivities: record.processingActivities,
      retentionPeriod: record.retentionPeriod,
      timestamp: record.timestamp,
    });
  }

  async getLawfulBasisRecords(): Promise<LawfulBasisRecord[]> {
    return (await getLawfulBasisRecords()) as LawfulBasisRecord[];
  }

  async generateLawfulBasisReport(): Promise<LawfulBasisAuditReport> {
    return this.audit.generateComplianceReport();
  }

  async setPolicyVersion(version: string): Promise<void> {
    await setPrivacyPolicyVersion(version);
  }

  async getPolicyVersion(): Promise<string> {
    return (await getPrivacyPolicyVersion()) ?? PrivacyComplianceManager.DEFAULT_POLICY_VERSION;
  }

  private isConsentExpired(timestamp?: string): boolean {
    // A missing timestamp means the consent record is malformed or legacy.
    // Treat it as expired so the user is prompted to re-consent, rather than
    // granting perpetual consent from a record with no provenance.
    if (!timestamp) return true;
    const maxAgeMs = PrivacyComplianceManager.CONSENT_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
    const expiryTime = new Date(timestamp).getTime() + maxAgeMs;
    return Date.now() > expiryTime;
  }

  private async readLegacyLocalUserData(): Promise<Record<string, string>> {
    return {};
  }
}
