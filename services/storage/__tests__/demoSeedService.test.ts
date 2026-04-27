import { DemoAccountBSeedService } from '../demoAccountBSeedService';

const mockAccountBSeedIfNeeded = jest.fn();
const mockAccountBCleanup = jest.fn();

const mockGetItem = jest.fn();
const mockSetItem = jest.fn();
const mockInitialize = jest.fn();

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: (...args: unknown[]) => mockGetItem(...args),
    setItem: (...args: unknown[]) => mockSetItem(...args),
    removeItem: jest.fn(),
  },
}));

jest.mock('../localDb', () => ({
  localDb: {
    initialize: () => mockInitialize(),
    getDb: jest.fn().mockResolvedValue({
      runAsync: jest.fn().mockResolvedValue({ changes: 0 }),
      getAllAsync: jest.fn().mockResolvedValue([]),
    }),
    getCharts: jest.fn().mockResolvedValue([]),
    getJournalEntries: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock('../encryptedAsyncStorage', () => ({
  EncryptedAsyncStorage: {
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../fieldEncryption', () => ({
  FieldEncryptionService: {
    encryptField: jest.fn().mockResolvedValue('enc:mock'),
    decryptField: jest.fn().mockResolvedValue('plaintext'),
  },
}));


jest.mock('../../astrology/calculator', () => ({}), { virtual: true });
jest.mock('../../../utils/logger', () => ({ logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() } }));
jest.mock('../../../utils/dateUtils', () => ({
  toLocalDateString: (d: Date) => d.toISOString().slice(0, 10),
}));
jest.mock('../../../lib/supabase', () => ({
  supabase: { functions: { invoke: jest.fn().mockResolvedValue({ data: null, error: null }) } },
}));

describe('DemoAccountBSeedService.isDemoAccount', () => {
  it('returns true for both demo emails (case-insensitive)', () => {
    expect(DemoAccountBSeedService.isDemoAccount('brithornick92@gmail.com')).toBe(true);
    expect(DemoAccountBSeedService.isDemoAccount('BRITHORNICK92@GMAIL.COM')).toBe(true);
  });

  it('returns false for any other email', () => {
    expect(DemoAccountBSeedService.isDemoAccount('user@example.com')).toBe(false);
    expect(DemoAccountBSeedService.isDemoAccount('other@outlook.com')).toBe(false);
  });

  it('returns false for null or undefined', () => {
    expect(DemoAccountBSeedService.isDemoAccount(null)).toBe(false);
    expect(DemoAccountBSeedService.isDemoAccount(undefined)).toBe(false);
  });
});

describe('DemoAccountBSeedService.seedIfNeeded', () => {
  beforeEach(() => jest.clearAllMocks());

  it('does nothing for a non-demo account', async () => {
    await DemoAccountBSeedService.seedIfNeeded('realuser@example.com');
    expect(mockInitialize).not.toHaveBeenCalled();
  });

  it('does nothing for null email', async () => {
    await DemoAccountBSeedService.seedIfNeeded(null);
    expect(mockInitialize).not.toHaveBeenCalled();
  });

  it('rejects seeding for a non-demo account', async () => {
    await expect(DemoAccountBSeedService.sendDemoDataToSupabase('realuser@example.com')).rejects.toThrow(
      'Demo data send is only available for the Account B demo user.',
    );
  });
});
