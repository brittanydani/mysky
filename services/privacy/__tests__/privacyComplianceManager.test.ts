// Mock all I/O dependencies
const mockSecureStorage = {
  getPrivacyPolicyVersion: jest.fn().mockResolvedValue('1.0'),
  getConsentRecord: jest.fn().mockResolvedValue(null),
  setPrivacyPolicyVersion: jest.fn().mockResolvedValue(undefined),
  setPrivacyConsent: jest.fn().mockResolvedValue(undefined),
  getAllSecureData: jest.fn().mockResolvedValue({}),
  clearAll: jest.fn().mockResolvedValue(undefined),
  getLawfulBasisRecords: jest.fn().mockResolvedValue([]),
  auditDataAccess: jest.fn().mockResolvedValue(undefined),
  deleteAllUserData: jest.fn().mockResolvedValue(undefined),
};

jest.mock('../../storage/secureStorage', () => ({
  secureStorage: mockSecureStorage,
}));

const mockLocalDb = {
  initialize: jest.fn().mockResolvedValue(undefined),
  getCharts: jest.fn().mockResolvedValue([]),
  getJournalEntries: jest.fn().mockResolvedValue([]),
  getJournalEntryCount: jest.fn().mockResolvedValue(0),
  getSettings: jest.fn().mockResolvedValue(null),
  hardDeleteAllData: jest.fn().mockResolvedValue(undefined),
  getDb: jest.fn().mockResolvedValue({ getAllAsync: jest.fn().mockResolvedValue([]) }),
};

jest.mock('../../storage/localDb', () => ({
  localDb: mockLocalDb,
}));

jest.mock('../../storage/encryptedAsyncStorage', () => ({
  EncryptedAsyncStorage: {
    deleteAllUserData: jest.fn().mockResolvedValue(undefined),
    removeItem: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../../storage/models', () => ({
  generateId: jest.fn(() => 'mock-id-' + Math.random().toString(36).slice(2, 8)),
}));

jest.mock('../lawfulBasisAudit', () => ({
  LawfulBasisAuditService: jest.fn().mockImplementation(() => ({
    recordProcessingOperation: jest.fn().mockResolvedValue(undefined),
    getAuditLog: jest.fn().mockResolvedValue([]),
    generateReport: jest.fn().mockResolvedValue({ records: [], summary: {} }),
  })),
}));

import { PrivacyComplianceManager } from '../privacyComplianceManager';

describe('PrivacyComplianceManager', () => {
  let manager: PrivacyComplianceManager;

  beforeEach(() => {
    jest.clearAllMocks();
    manager = new PrivacyComplianceManager();
  });

  describe('requestConsent', () => {
    it('returns required=true when no existing consent', async () => {
      mockSecureStorage.getConsentRecord.mockResolvedValueOnce(null);
      const result = await manager.requestConsent();
      expect(result.required).toBe(true);
      expect(result.policyVersion).toBe('1.0');
    });

    it('returns required=false when valid consent exists', async () => {
      mockSecureStorage.getConsentRecord.mockResolvedValueOnce({
        granted: true,
        version: '1.0',
        timestamp: new Date().toISOString(),
      });
      const result = await manager.requestConsent();
      expect(result.required).toBe(false);
      expect(result.existingConsent).toBeDefined();
    });

    it('returns required=true when consent is for old policy version', async () => {
      mockSecureStorage.getConsentRecord.mockResolvedValueOnce({
        granted: true,
        version: '0.9',
        timestamp: new Date().toISOString(),
      });
      const result = await manager.requestConsent();
      expect(result.required).toBe(true);
    });

    it('returns required=true when consent is expired', async () => {
      const expired = new Date();
      expired.setDate(expired.getDate() - 400); // > 365 days
      mockSecureStorage.getConsentRecord.mockResolvedValueOnce({
        granted: true,
        version: '1.0',
        timestamp: expired.toISOString(),
      });
      const result = await manager.requestConsent();
      expect(result.required).toBe(true);
    });
  });

  describe('recordConsent', () => {
    it('records consent and returns a ConsentRecord', async () => {
      const consent = {
        granted: true,
        policyVersion: '1.0',
        timestamp: new Date().toISOString(),
        method: 'explicit' as const,
        lawfulBasis: 'consent' as const,
        purpose: 'astrology_personalization' as const,
      };

      const record = await manager.recordConsent(consent);

      expect(record.granted).toBe(true);
      expect(record.policyVersion).toBe('1.0');
      expect(record.id).toBeDefined();
      expect(mockSecureStorage.setPrivacyPolicyVersion).toHaveBeenCalledWith('1.0');
      expect(mockSecureStorage.setPrivacyConsent).toHaveBeenCalled();
    });
  });

  describe('handleAccessRequest (GDPR Art. 15)', () => {
    it('returns data inventory without deleting anything', async () => {
      mockLocalDb.getCharts.mockResolvedValueOnce([{ id: 'c1' }]);
      mockLocalDb.getJournalEntryCount.mockResolvedValueOnce(5);

      const result = await manager.handleAccessRequest();

      expect(result).toBeDefined();
      expect(mockLocalDb.hardDeleteAllData).not.toHaveBeenCalled();
    });
  });

  describe('handleDeletionRequest (GDPR Art. 17)', () => {
    it('deletes all data from local storage', async () => {
      const result = await manager.handleDeletionRequest();

      expect(result).toBeDefined();
      expect(mockLocalDb.hardDeleteAllData).toHaveBeenCalled();
    });
  });

  describe('constants', () => {
    it('has a default policy version of 1.0', () => {
      expect(PrivacyComplianceManager.DEFAULT_POLICY_VERSION).toBe('1.0');
    });

    it('has consent max age of 365 days', () => {
      expect(PrivacyComplianceManager.CONSENT_MAX_AGE_DAYS).toBe(365);
    });
  });
});
