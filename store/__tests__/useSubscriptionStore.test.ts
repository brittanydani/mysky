// Mock revenueCatService and react-native-purchases so no native modules are invoked.

const mockInitialize = jest.fn().mockResolvedValue(undefined);
const mockGetCustomerInfo = jest.fn();
const mockGetOfferings = jest.fn();
const mockPurchasePackage = jest.fn();
const mockRestorePurchases = jest.fn();
const mockIsPremium = jest.fn();
const mockAddCustomerInfoUpdateListener = jest.fn();

jest.mock('../../services/premium/revenuecat', () => ({
  revenueCatService: {
    initialize: mockInitialize,
    getCustomerInfo: mockGetCustomerInfo,
    getOfferings: mockGetOfferings,
    purchasePackage: mockPurchasePackage,
    restorePurchases: mockRestorePurchases,
    isPremium: mockIsPremium,
  },
}));

jest.mock('react-native-purchases', () => ({
  default: {
    addCustomerInfoUpdateListener: mockAddCustomerInfoUpdateListener,
  },
}));

jest.mock('../../utils/logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

// Import AFTER mocks are set up
import { useSubscriptionStore } from '../useSubscriptionStore';

function getStore() {
  return useSubscriptionStore.getState();
}

describe('useSubscriptionStore', () => {
  beforeEach(() => {
    // Reset store state and mocks before each test
    useSubscriptionStore.setState({
      isPro: false,
      isConfigured: false,
      packages: [],
      isPurchasing: false,
    });
    jest.clearAllMocks();
  });

  describe('initialize()', () => {
    it('delegates to revenueCatService.initialize', async () => {
      mockGetCustomerInfo.mockResolvedValue(null);
      await getStore().initialize();
      expect(mockInitialize).toHaveBeenCalledTimes(1);
    });

    it('sets isConfigured to true on success', async () => {
      mockGetCustomerInfo.mockResolvedValue(null);
      await getStore().initialize();
      expect(getStore().isConfigured).toBe(true);
    });

    it('sets isPro based on customer info', async () => {
      const fakeInfo = { activeSubscriptions: ['pro'] };
      mockGetCustomerInfo.mockResolvedValue(fakeInfo);
      mockIsPremium.mockReturnValue(true);
      await getStore().initialize();
      expect(getStore().isPro).toBe(true);
    });

    it('is idempotent — does not call initialize twice', async () => {
      mockGetCustomerInfo.mockResolvedValue(null);
      await getStore().initialize();
      await getStore().initialize();
      expect(mockInitialize).toHaveBeenCalledTimes(1);
    });

    it('sets isConfigured even when initialize throws', async () => {
      mockInitialize.mockRejectedValueOnce(new Error('Network error'));
      await getStore().initialize();
      expect(getStore().isConfigured).toBe(true);
    });
  });

  describe('fetchOfferings()', () => {
    it('populates packages from the current offering', async () => {
      const pkg = { identifier: '$rc_monthly' } as any;
      mockGetOfferings.mockResolvedValue({ availablePackages: [pkg] });
      await getStore().fetchOfferings();
      expect(getStore().packages).toEqual([pkg]);
    });

    it('leaves packages unchanged when offering is null', async () => {
      mockGetOfferings.mockResolvedValue(null);
      await getStore().fetchOfferings();
      expect(getStore().packages).toEqual([]);
    });

    it('leaves packages unchanged when fetchOfferings throws', async () => {
      mockGetOfferings.mockRejectedValueOnce(new Error('RC error'));
      await getStore().fetchOfferings();
      expect(getStore().packages).toEqual([]);
    });
  });

  describe('purchasePackage()', () => {
    const pkg = { identifier: '$rc_monthly' } as any;

    it('returns true and sets isPro when purchase succeeds', async () => {
      const fakeInfo = { activeSubscriptions: ['pro'] };
      mockPurchasePackage.mockResolvedValue({ success: true, customerInfo: fakeInfo });
      mockIsPremium.mockReturnValue(true);
      const result = await getStore().purchasePackage(pkg);
      expect(result).toBe(true);
      expect(getStore().isPro).toBe(true);
      expect(getStore().isPurchasing).toBe(false);
    });

    it('returns false when purchase result has success: false', async () => {
      mockPurchasePackage.mockResolvedValue({ success: false, customerInfo: null });
      const result = await getStore().purchasePackage(pkg);
      expect(result).toBe(false);
      expect(getStore().isPurchasing).toBe(false);
    });

    it('returns false and clears isPurchasing when purchase throws', async () => {
      mockPurchasePackage.mockRejectedValueOnce({ userCancelled: false, message: 'fail' });
      const result = await getStore().purchasePackage(pkg);
      expect(result).toBe(false);
      expect(getStore().isPurchasing).toBe(false);
    });
  });

  describe('restorePurchases()', () => {
    it('returns true and sets isPro when active entitlement found', async () => {
      const fakeInfo = { activeSubscriptions: ['pro'] };
      mockRestorePurchases.mockResolvedValue({ success: true, customerInfo: fakeInfo });
      mockIsPremium.mockReturnValue(true);
      const result = await getStore().restorePurchases();
      expect(result).toBe(true);
      expect(getStore().isPro).toBe(true);
    });

    it('returns false when customerInfo is null', async () => {
      mockRestorePurchases.mockResolvedValue({ success: true, customerInfo: null });
      const result = await getStore().restorePurchases();
      expect(result).toBe(false);
    });

    it('returns false and clears isPurchasing when restore throws', async () => {
      mockRestorePurchases.mockRejectedValueOnce(new Error('Network'));
      const result = await getStore().restorePurchases();
      expect(result).toBe(false);
      expect(getStore().isPurchasing).toBe(false);
    });
  });
});
