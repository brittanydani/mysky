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
  relationshipCharts: any[];
  sleepEntries: any[];
  checkIns: any[];
  settings: any | null;
  consentRecord: any;
  lawfulBasisRecords: LawfulBasisRecord[];
  selfKnowledgeProfiles: any[];
  userPreferences: any[];
  dailyReflections: any[];
  somaticEntries: any[];
  triggerEvents: any[];
  relationshipPatterns: any[];
  insightHistory: any[];
  insightState: Record<string, any[]>;
  dreamEngineData: Record<string, any[]>;
  rawSupabaseTables: Partial<Record<string, any[]>>;
  asyncStorageData?: Record<string, string>;
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
    relationshipChartsCount: number;
    sleepEntriesCount: number;
    checkInsCount: number;
    selfKnowledgeProfilesCount: number;
    userPreferencesCount: number;
    dailyReflectionsCount: number;
    somaticEntriesCount: number;
    triggerEventsCount: number;
    relationshipPatternsCount: number;
    insightRecordsCount: number;
    settingsPresent: boolean;
    consentRecordPresent: boolean;
    lawfulBasisRecordsCount: number;
    supabaseTableCounts: Record<string, number>;
    asyncStorageKeysCount: number;
  };
  completedAt: string;
}
