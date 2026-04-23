import { DemoSeedService } from '../demoAccountBSeedService';

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

jest.mock('../demoAccountBSeedService', () => ({
  DemoSeedService: {
    seedIfNeeded: (...args: unknown[]) => mockAccountBSeedIfNeeded(...args),
    cleanupStaleDemoArtifacts: (...args: unknown[]) => mockAccountBCleanup(...args),
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

describe('DemoSeedService.isDemoAccount', () => {
  it('returns true for both demo emails (case-insensitive)', () => {
    expect(DemoSeedService.isDemoAccount('brittanyapps@outlook.com')).toBe(true);
    expect(DemoSeedService.isDemoAccount('BRITTANYAPPS@OUTLOOK.COM')).toBe(true);
    expect(DemoSeedService.isDemoAccount('BrittanyApps@Outlook.com')).toBe(true);
    expect(DemoSeedService.isDemoAccount('brithornick92@gmail.com')).toBe(true);
    expect(DemoSeedService.isDemoAccount('BRITHORNICK92@GMAIL.COM')).toBe(true);
  });

  it('returns false for any other email', () => {
    expect(DemoSeedService.isDemoAccount('user@example.com')).toBe(false);
    expect(DemoSeedService.isDemoAccount('other@outlook.com')).toBe(false);
  });

  it('returns false for null or undefined', () => {
    expect(DemoSeedService.isDemoAccount(null)).toBe(false);
    expect(DemoSeedService.isDemoAccount(undefined)).toBe(false);
  });
});

describe('DemoSeedService.seedIfNeeded', () => {
  beforeEach(() => jest.clearAllMocks());

  it('does nothing for a non-demo account', async () => {
    await DemoSeedService.seedIfNeeded('realuser@example.com');
    expect(mockInitialize).not.toHaveBeenCalled();
  });

  it('does nothing for null email', async () => {
    await DemoSeedService.seedIfNeeded(null);
    expect(mockInitialize).not.toHaveBeenCalled();
  });

  it('initializes the db for the demo account', async () => {
    mockInitialize.mockResolvedValue(undefined);
    mockGetItem.mockResolvedValue('true'); // already seeded

    // Mock _repairUnreadableDemoSeedData and _dailyTopUp to avoid deep execution
    const repairSpy = jest.spyOn(DemoSeedService as any, '_repairUnreadableDemoSeedData').mockResolvedValue(false);
    const topUpSpy = jest.spyOn(DemoSeedService as any, '_dailyTopUp').mockResolvedValue(undefined);

    await DemoSeedService.seedIfNeeded('brittanyapps@outlook.com');

    expect(mockInitialize).toHaveBeenCalled();

    repairSpy.mockRestore();
    topUpSpy.mockRestore();
  });

  it('delegates Account B seeding to the Account B service', async () => {
    await DemoSeedService.seedIfNeeded('brithornick92@gmail.com');

    expect(mockAccountBSeedIfNeeded).toHaveBeenCalledWith('brithornick92@gmail.com');
    expect(mockInitialize).not.toHaveBeenCalled();
  });
});
