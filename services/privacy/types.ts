export type ConsentMethod = 'explicit' | 'implied';

export type LawfulBasis =
  | 'consent'
  | 'contract'
  | 'legal_obligation'
  | 'vital_interests'
  | 'public_task'
  | 'legitimate_interests';

export interface ConsentData {
  granted: boolean;
  policyVersion: string;
  timestamp: string;
  method: ConsentMethod;
  lawfulBasis: LawfulBasis;
  purpose: string;
}

export interface ConsentResult {
  required: boolean;
  policyVersion: string;
  existingConsent?: ConsentData;
}

export interface ConsentRecord extends ConsentData {
  id: string;
}

export interface ConsentStatus {
  granted: boolean;
  policyVersion: string;
  timestamp?: string;
  expired?: boolean;
  expiresAt?: string;
  method: ConsentMethod;
  lawfulBasis: LawfulBasis;
  purpose: string;
}

export interface ConsentPreferences {
  granted: boolean;
  method: ConsentMethod;
  lawfulBasis: LawfulBasis;
  purpose: string;
  policyVersion: string;
  reason: string;
}

export interface LawfulBasisRecord {
  id: string;
  timestamp: string;
  policyVersion: string;
  lawfulBasis: LawfulBasis;
  purpose: string;
  dataCategories: string[];
  processingActivities: string[];
  retentionPeriod?: string;
}

export interface LawfulBasisAuditReport {
  totalRecords: number;
  byLawfulBasis: Record<string, number>;
  lastUpdated?: string;
  records: LawfulBasisRecord[];
}

export interface ExportPackage {
  charts: any[];
  journalEntries: any[];
  settings: any | null;
  consentRecord: any;
  lawfulBasisRecords: LawfulBasisRecord[];
  exportedAt: string;
}

export interface ExportResult {
  success: boolean;
  package?: ExportPackage;
  completedAt: string;
}

export interface DeletionResult {
  success: boolean;
  completedAt: string;
}

export interface AccessResult {
  success: boolean;
  dataInventory: {
    chartsCount: number;
    journalEntriesCount: number;
    settingsPresent: boolean;
    consentRecordPresent: boolean;
    lawfulBasisRecordsCount: number;
  };
  completedAt: string;
}
