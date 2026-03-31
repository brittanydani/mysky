// Mock secureStorage so no SecureStore native layer is needed
const lawfulBasisRecords: any[] = [];

const mockGetPolicyVersion = jest.fn().mockResolvedValue('1.0');
const mockGetLawfulBasisRecords = jest.fn(async () => [...lawfulBasisRecords]);
const mockSaveLawfulBasisRecords = jest.fn(async (records: any[]) => {
  lawfulBasisRecords.length = 0;
  lawfulBasisRecords.push(...records);
});
const mockAuditDataAccess = jest.fn().mockResolvedValue(undefined);

jest.mock('../../storage/secureStorage', () => ({
  secureStorage: {
    getPrivacyPolicyVersion: mockGetPolicyVersion,
    getLawfulBasisRecords: mockGetLawfulBasisRecords,
    saveLawfulBasisRecords: mockSaveLawfulBasisRecords,
    auditDataAccess: mockAuditDataAccess,
  },
}));

jest.mock('../../storage/models', () => ({
  generateId: jest.fn(() => 'audit-id-001'),
}));

import { LawfulBasisAuditService } from '../lawfulBasisAudit';

const makeInput = (overrides: Record<string, unknown> = {}) => ({
  lawfulBasis: 'consent' as const,
  purpose: 'Personalise daily astrological insights',
  dataCategories: ['natal_chart', 'check_in'],
  processingActivities: ['read', 'display'],
  ...overrides,
});

describe('LawfulBasisAuditService', () => {
  let service: LawfulBasisAuditService;

  beforeEach(() => {
    service = new LawfulBasisAuditService();
    lawfulBasisRecords.length = 0;
    jest.clearAllMocks();
    mockGetPolicyVersion.mockResolvedValue('1.0');
    mockGetLawfulBasisRecords.mockImplementation(async () => [...lawfulBasisRecords]);
    mockSaveLawfulBasisRecords.mockImplementation(async (recs: any[]) => {
      lawfulBasisRecords.length = 0;
      lawfulBasisRecords.push(...recs);
    });
    mockAuditDataAccess.mockResolvedValue(undefined);
  });

  describe('recordProcessingOperation()', () => {
    it('creates a record with the provided fields', async () => {
      const input = makeInput();
      const record = await service.recordProcessingOperation(input);

      expect(record.id).toBe('audit-id-001');
      expect(record.lawfulBasis).toBe('consent');
      expect(record.purpose).toBe(input.purpose);
      expect(record.dataCategories).toEqual(input.dataCategories);
      expect(record.processingActivities).toEqual(input.processingActivities);
    });

    it('uses provided policyVersion instead of fetching', async () => {
      const record = await service.recordProcessingOperation(makeInput({ policyVersion: '2.5' }));
      expect(record.policyVersion).toBe('2.5');
      expect(mockGetPolicyVersion).not.toHaveBeenCalled();
    });

    it('fetches policy version from secureStorage when not provided', async () => {
      mockGetPolicyVersion.mockResolvedValue('3.1');
      const record = await service.recordProcessingOperation(makeInput());
      expect(record.policyVersion).toBe('3.1');
    });

    it('defaults to policy version 1.0 when secureStorage returns null', async () => {
      mockGetPolicyVersion.mockResolvedValue(null);
      const record = await service.recordProcessingOperation(makeInput());
      expect(record.policyVersion).toBe('1.0');
    });

    it('uses provided timestamp when given', async () => {
      const ts = '2026-01-01T00:00:00.000Z';
      const record = await service.recordProcessingOperation(makeInput({ timestamp: ts }));
      expect(record.timestamp).toBe(ts);
    });

    it('generates a timestamp when not provided', async () => {
      const record = await service.recordProcessingOperation(makeInput());
      expect(record.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('prepends new record to existing records (newest first)', async () => {
      const existing = {
        id: 'old-id',
        timestamp: '2026-01-01T00:00:00.000Z',
        policyVersion: '1.0',
        lawfulBasis: 'consent' as const,
        purpose: 'old',
        dataCategories: [],
        processingActivities: [],
      };
      lawfulBasisRecords.push(existing);
      mockGetLawfulBasisRecords.mockResolvedValue([existing]);

      await service.recordProcessingOperation(makeInput());

      const saved = mockSaveLawfulBasisRecords.mock.calls[0][0];
      expect(saved[0].id).toBe('audit-id-001'); // new is first
      expect(saved[1].id).toBe('old-id');
    });

    it('calls auditDataAccess after saving', async () => {
      await service.recordProcessingOperation(makeInput());
      expect(mockAuditDataAccess).toHaveBeenCalledWith(
        'lawful_basis_record',
        expect.objectContaining({ recordId: 'audit-id-001' }),
      );
    });

    it('includes retentionPeriod when provided', async () => {
      const record = await service.recordProcessingOperation(
        makeInput({ retentionPeriod: '2 years' }),
      );
      expect(record.retentionPeriod).toBe('2 years');
    });
  });

  describe('getComplianceReport()', () => {
    it('returns zeros when no records exist', async () => {
      const report = await service.getComplianceReport();
      expect(report.totalRecords).toBe(0);
      expect(report.byLawfulBasis).toEqual({});
      expect(report.lastUpdated).toBeUndefined();
    });

    it('counts records by lawful basis', async () => {
      mockGetLawfulBasisRecords.mockResolvedValue([
        { ...makeInput(), id: '1', timestamp: '2026-03-30T10:00:00Z', policyVersion: '1.0', lawfulBasis: 'consent' },
        { ...makeInput(), id: '2', timestamp: '2026-03-29T10:00:00Z', policyVersion: '1.0', lawfulBasis: 'contract' },
        { ...makeInput(), id: '3', timestamp: '2026-03-28T10:00:00Z', policyVersion: '1.0', lawfulBasis: 'consent' },
      ]);
      const report = await service.getComplianceReport();
      expect(report.totalRecords).toBe(3);
      expect(report.byLawfulBasis['consent']).toBe(2);
      expect(report.byLawfulBasis['contract']).toBe(1);
    });

    it('sets lastUpdated to the timestamp of the first (newest) record', async () => {
      mockGetLawfulBasisRecords.mockResolvedValue([
        { id: '1', timestamp: '2026-03-30T10:00:00Z', lawfulBasis: 'consent', purpose: '', dataCategories: [], processingActivities: [], policyVersion: '1.0' },
      ]);
      const report = await service.getComplianceReport();
      expect(report.lastUpdated).toBe('2026-03-30T10:00:00Z');
    });
  });

  describe('generateComplianceReport()', () => {
    it('includes the full records array', async () => {
      const recs = [
        { id: '1', timestamp: '2026-03-30T10:00:00Z', lawfulBasis: 'consent' as const, purpose: 'test', dataCategories: [], processingActivities: [], policyVersion: '1.0' },
      ];
      mockGetLawfulBasisRecords.mockResolvedValue(recs);
      const report = await service.generateComplianceReport();
      expect(report.records).toEqual(recs);
      expect(report.totalRecords).toBe(1);
    });
  });
});
