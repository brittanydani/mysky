import { secureStorage } from '../storage/secureStorage';
import { generateId } from '../storage/models';
import { LawfulBasisAuditService } from './lawfulBasisAudit';
import {
  ConsentData,
  ConsentRecord,
  ConsentResult,
  LawfulBasisRecord,
  LawfulBasisAuditReport,
} from './types';

export class PrivacyComplianceManager {
  static DEFAULT_POLICY_VERSION = '1.0';
  private readonly audit = new LawfulBasisAuditService();
  static CONSENT_MAX_AGE_DAYS = 365;

  async requestConsent(): Promise<ConsentResult> {
    const policyVersion = (await secureStorage.getPrivacyPolicyVersion()) ?? PrivacyComplianceManager.DEFAULT_POLICY_VERSION;
    const existing = await secureStorage.getConsentRecord();

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

    await secureStorage.setPrivacyPolicyVersion(consent.policyVersion);
    await secureStorage.setPrivacyConsent(consent.granted, consent.policyVersion, 'consent_recorded');

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
    await secureStorage.setPrivacyConsent(false, await this.getPolicyVersion(), 'withdrawn');
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
    return (await secureStorage.getLawfulBasisRecords()) as LawfulBasisRecord[];
  }

  async generateLawfulBasisReport(): Promise<LawfulBasisAuditReport> {
    return this.audit.generateComplianceReport();
  }

  async setPolicyVersion(version: string): Promise<void> {
    await secureStorage.setPrivacyPolicyVersion(version);
  }

  async getPolicyVersion(): Promise<string> {
    return (await secureStorage.getPrivacyPolicyVersion()) ?? PrivacyComplianceManager.DEFAULT_POLICY_VERSION;
  }

  private isConsentExpired(timestamp?: string): boolean {
    if (!timestamp) return false;
    const maxAgeMs = PrivacyComplianceManager.CONSENT_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
    const expiryTime = new Date(timestamp).getTime() + maxAgeMs;
    return Date.now() > expiryTime;
  }
}
