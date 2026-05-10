import { supabase } from '../../../lib/supabase';
import { RLSVerificationService } from '../rlsVerification';

const mockLimit = jest.fn();
const mockEq = jest.fn(() => ({ limit: mockLimit }));
const mockSelect = jest.fn(() => ({ eq: mockEq }));
const mockFrom = supabase.from as jest.Mock;

jest.mock('../../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock('../../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('RLSVerificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFrom.mockReturnValue({ select: mockSelect });
  });

  it('reports read isolation as verified when sentinel rows are not readable', async () => {
    mockLimit.mockResolvedValueOnce({ data: [], error: null });

    const result = await RLSVerificationService.auditPolicies('journal_entries');

    expect(result).toMatchObject({
      tableName: 'journal_entries',
      hasSelectPolicy: true,
      verifiedReadIsolation: true,
    });
    expect(mockSelect).toHaveBeenCalledWith('user_id');
    expect(mockEq).toHaveBeenCalledWith('user_id', '00000000-0000-0000-0000-000000000000');
  });

  it('does not claim a select policy when sentinel rows are readable', async () => {
    mockLimit.mockResolvedValueOnce({ data: [{ user_id: '00000000-0000-0000-0000-000000000000' }], error: null });

    const result = await RLSVerificationService.auditPolicies('journal_entries');

    expect(result.hasSelectPolicy).toBe(false);
    expect(result.verifiedReadIsolation).toBe(false);
  });
});
