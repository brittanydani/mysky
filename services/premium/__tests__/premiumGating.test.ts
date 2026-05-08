const mockInitialize = jest.fn();
const mockLogIn = jest.fn();
const mockGetCustomerInfo = jest.fn();
const mockIsPremium = jest.fn();

jest.mock('../revenuecat', () => ({
  revenueCatService: {
    initialize: mockInitialize,
    logIn: mockLogIn,
    getCustomerInfo: mockGetCustomerInfo,
    isPremium: mockIsPremium,
  },
}));

jest.mock('../../../utils/logger', () => ({
  logger: { error: jest.fn(), warn: jest.fn() },
}));

import { verifyPremiumAccess } from '../premiumGating';

describe('verifyPremiumAccess', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockInitialize.mockResolvedValue(undefined);
    mockLogIn.mockResolvedValue(undefined);
  });

  it('uses RevenueCat customer info as the entitlement source', async () => {
    const customerInfo = { entitlements: { active: { deeper_sky: {} } } };
    mockGetCustomerInfo.mockResolvedValue(customerInfo);
    mockIsPremium.mockReturnValue(true);

    await expect(verifyPremiumAccess('user-123', 'deeper_sky')).resolves.toBe(true);

    expect(mockInitialize).toHaveBeenCalled();
    expect(mockLogIn).toHaveBeenCalledWith('user-123');
    expect(mockGetCustomerInfo).toHaveBeenCalled();
    expect(mockIsPremium).toHaveBeenCalledWith(customerInfo);
  });

  it('denies access when RevenueCat has no active premium entitlement', async () => {
    mockGetCustomerInfo.mockResolvedValue({ entitlements: { active: {} } });
    mockIsPremium.mockReturnValue(false);

    await expect(verifyPremiumAccess('user-123', 'dream_analysis')).resolves.toBe(false);
  });
});
