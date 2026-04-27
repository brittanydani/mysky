import { auditPrivacyEvent, getLawfulBasisRecords, getPrivacyPolicyVersion, saveLawfulBasisRecord } from './privacySupabaseService';
import { generateId } from '../storage/models';
import { LawfulBasis, LawfulBasisRecord } from './types';

export interface ProcessingOperationInput {
  lawfulBasis: LawfulBasis;
  purpose: string;
  dataCategories: string[];
  processingActivities: string[];
  retentionPeriod?: string;
  policyVersion?: string;
  timestamp?: string;
}

export class LawfulBasisAuditService {
  async recordProcessingOperation(input: ProcessingOperationInput): Promise<LawfulBasisRecord> {
    const policyVersion = input.policyVersion ?? (await getPrivacyPolicyVersion()) ?? '1.0';
    const record: LawfulBasisRecord = {
      id: generateId(),
      timestamp: input.timestamp ?? new Date().toISOString(),
      policyVersion,
      lawfulBasis: input.lawfulBasis,
      purpose: input.purpose,
      dataCategories: input.dataCategories,
      processingActivities: input.processingActivities,
      retentionPeriod: input.retentionPeriod,
    };

    await saveLawfulBasisRecord(record);
    await auditPrivacyEvent('lawful_basis_record', {
      recordId: record.id,
      lawfulBasis: record.lawfulBasis,
      purpose: record.purpose,
    });

    return record;
  }

  async getComplianceReport(): Promise<{
    totalRecords: number;
    byLawfulBasis: Record<string, number>;
    lastUpdated?: string;
  }> {
    const records = await getLawfulBasisRecords();
    const byLawfulBasis: Record<string, number> = {};
    records.forEach((record: LawfulBasisRecord) => {
      byLawfulBasis[record.lawfulBasis] = (byLawfulBasis[record.lawfulBasis] || 0) + 1;
    });

    const lastUpdated = records.length > 0 ? records[0].timestamp : undefined;

    return {
      totalRecords: records.length,
      byLawfulBasis,
      lastUpdated,
    };
  }

  async generateComplianceReport(): Promise<{
    totalRecords: number;
    byLawfulBasis: Record<string, number>;
    lastUpdated?: string;
    records: LawfulBasisRecord[];
  }> {
    const records = await getLawfulBasisRecords();
    const byLawfulBasis: Record<string, number> = {};
    records.forEach((record: LawfulBasisRecord) => {
      byLawfulBasis[record.lawfulBasis] = (byLawfulBasis[record.lawfulBasis] || 0) + 1;
    });

    const lastUpdated = records.length > 0 ? records[0].timestamp : undefined;

    return {
      totalRecords: records.length,
      byLawfulBasis,
      lastUpdated,
      records,
    };
  }
}
