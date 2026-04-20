import {
  V1_HIDDEN_FEATURES,
  UNLOCK_THRESHOLDS,
  INTEREST_OPTIONS,
  recordFirstUseDate,
  getDaysSinceFirstUse,
  isFeatureUnlocked,
} from '../progressiveDisclosure';

const mockGetItem = jest.fn();
const mockSetItem = jest.fn();

jest.mock('../../services/storage/encryptedAsyncStorage', () => ({
  EncryptedAsyncStorage: {
    getItem: (...args: unknown[]) => mockGetItem(...args),
    setItem: (...args: unknown[]) => mockSetItem(...args),
  },
}));

jest.mock('../logger', () => ({ logger: { error: jest.fn() } }));

describe('V1_HIDDEN_FEATURES', () => {
  it('healingRituals is hidden in v1', () => {
    expect(V1_HIDDEN_FEATURES.healingRituals).toBe(true);
  });
});

describe('UNLOCK_THRESHOLDS', () => {
  it('has defined thresholds for key features', () => {
    expect(typeof UNLOCK_THRESHOLDS.triggerGlimmer).toBe('number');
    expect(typeof UNLOCK_THRESHOLDS.somaticMap).toBe('number');
    expect(typeof UNLOCK_THRESHOLDS.relationships).toBe('number');
    expect(typeof UNLOCK_THRESHOLDS.innerTensions).toBe('number');
  });
});

describe('INTEREST_OPTIONS', () => {
  it('is a non-empty array with id, label, and icon', () => {
    expect(INTEREST_OPTIONS.length).toBeGreaterThan(0);
    for (const opt of INTEREST_OPTIONS) {
      expect(opt.id).toBeTruthy();
      expect(opt.label).toBeTruthy();
      expect(opt.icon).toBeTruthy();
    }
  });
});

describe('recordFirstUseDate', () => {
  beforeEach(() => jest.clearAllMocks());

  it('stores the current date when no existing record', async () => {
    mockGetItem.mockResolvedValue(null);
    mockSetItem.mockResolvedValue(undefined);

    await recordFirstUseDate();
    expect(mockSetItem).toHaveBeenCalledWith('@mysky:first_use_date', expect.any(String));
  });

  it('does not overwrite if a date already exists', async () => {
    mockGetItem.mockResolvedValue('2025-01-01T00:00:00.000Z');

    await recordFirstUseDate();
    expect(mockSetItem).not.toHaveBeenCalled();
  });
});

describe('getDaysSinceFirstUse', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 0 when no first use date is stored', async () => {
    mockGetItem.mockResolvedValue(null);
    expect(await getDaysSinceFirstUse()).toBe(0);
  });

  it('returns approximate days since stored date', async () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
    mockGetItem.mockResolvedValue(tenDaysAgo);

    const days = await getDaysSinceFirstUse();
    expect(days).toBe(10);
  });

  it('returns 0 on storage error', async () => {
    mockGetItem.mockRejectedValue(new Error('fail'));
    expect(await getDaysSinceFirstUse()).toBe(0);
  });
});

describe('isFeatureUnlocked', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns true for features with no threshold defined', async () => {
    mockGetItem.mockResolvedValue(new Date().toISOString());
    expect(await isFeatureUnlocked('someUnknownFeature')).toBe(true);
  });

  it('returns true when days since first use meets the threshold', async () => {
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
    mockGetItem.mockResolvedValue(eightDaysAgo); // 8 days, threshold for relationships is 7
    expect(await isFeatureUnlocked('relationships')).toBe(true);
  });

  it('returns false when days since first use is below threshold', async () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    mockGetItem.mockResolvedValue(twoDaysAgo); // 2 days, threshold for somaticMap is 5
    expect(await isFeatureUnlocked('somaticMap')).toBe(false);
  });
});
