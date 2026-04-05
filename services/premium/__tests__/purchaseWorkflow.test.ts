/**
 * Purchase Workflow — integration tests
 *
 * Tests the RevenueCat service + subscription store integration:
 * purchase flow, restore flow, entitlement checking, error handling.
 */

// ── Mocks ────────────────────────────────────────────────────────────────────

// Define __DEV__ for the test environment
(global as any).__DEV__ = false;

const mockConfigure = jest.fn().mockResolvedValue(undefined);
const mockGetOfferings = jest.fn();
const mockPurchasePackage = jest.fn();
const mockRestorePurchases = jest.fn();
const mockGetCustomerInfo = jest.fn();
const mockLogIn = jest.fn().mockResolvedValue(undefined);
const mockLogOut = jest.fn().mockResolvedValue(undefined);
const mockSetLogLevel = jest.fn();
const mockAddCustomerInfoUpdateListener = jest.fn();

jest.mock('react-native-purchases', () => {
  const mock = {
    configure: mockConfigure,
    getOfferings: mockGetOfferings,
    purchasePackage: mockPurchasePackage,
    restorePurchases: mockRestorePurchases,
    getCustomerInfo: mockGetCustomerInfo,
    logIn: mockLogIn,
    logOut: mockLogOut,
    setLogLevel: mockSetLogLevel,
    addCustomerInfoUpdateListener: mockAddCustomerInfoUpdateListener,
  };
  return {
    __esModule: true,
    default: mock,
    LOG_LEVEL: { VERBOSE: 0, WARN: 3 },
  };
});

jest.mock('react-native', () => ({
  Platform: { OS: 'ios', select: (obj: Record<string, any>) => obj.ios },
}));

jest.mock('../../../utils/logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

// Set required env vars
process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY = 'appl_test_key';

// Must import after mocks
import { revenueCatService } from '../revenuecat';

// Helper: create a mock CustomerInfo with specified active entitlements
function mockCustomerInfo(activeEntitlements: Record<string, any> = {}) {
  return {
    entitlements: { active: activeEntitlements },
    activeSubscriptions: Object.keys(activeEntitlements),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  // Reset the service singleton state
  (revenueCatService as any).initialized = false;
  (revenueCatService as any).initPromise = null;
});

describe('RevenueCat Service', () => {
  describe('initialization', () => {
    it('initializes with iOS API key', async () => {
      await revenueCatService.initialize();
      expect(mockConfigure).toHaveBeenCalledWith({ apiKey: 'appl_test_key' });
    });

    it('does not re-initialize if already initialized', async () => {
      await revenueCatService.initialize();
      await revenueCatService.initialize();
      expect(mockConfigure).toHaveBeenCalledTimes(1);
    });

    it('throws on invalid API key format', async () => {
      const original = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;
      process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY = 'bad_key';

      await expect(revenueCatService.initialize()).rejects.toThrow(/Invalid API key format/);

      process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY = original;
    });

    it('resets initPromise on failure so retry is possible', async () => {
      mockConfigure.mockRejectedValueOnce(new Error('Network'));

      await expect(revenueCatService.initialize()).rejects.toThrow('Network');
      expect((revenueCatService as any).initPromise).toBeNull();

      // Retry should work
      mockConfigure.mockResolvedValueOnce(undefined);
      await revenueCatService.initialize();
      expect(mockConfigure).toHaveBeenCalledTimes(2);
    });
  });

  describe('purchasePackage', () => {
    beforeEach(async () => {
      await revenueCatService.initialize();
    });

    it('returns success with customerInfo on successful purchase', async () => {
      const info = mockCustomerInfo({ premium: { isActive: true } });
      mockPurchasePackage.mockResolvedValue({ customerInfo: info });

      const result = await revenueCatService.purchasePackage({ identifier: 'monthly' } as any);
      expect(result.success).toBe(true);
      expect(result.customerInfo).toEqual(info);
    });

    it('returns userCancelled when user cancels', async () => {
      mockPurchasePackage.mockRejectedValue({ userCancelled: true });

      const result = await revenueCatService.purchasePackage({ identifier: 'monthly' } as any);
      expect(result.success).toBe(false);
      expect(result.userCancelled).toBe(true);
    });

    it('returns specific error for PURCHASE_NOT_ALLOWED_ERROR', async () => {
      mockPurchasePackage.mockRejectedValue({ code: 'PURCHASE_NOT_ALLOWED_ERROR' });

      const result = await revenueCatService.purchasePackage({ identifier: 'monthly' } as any);
      expect(result.success).toBe(false);
      expect(result.error).toContain('not allowed');
    });

    it('returns specific error for PAYMENT_PENDING_ERROR', async () => {
      mockPurchasePackage.mockRejectedValue({ code: 'PAYMENT_PENDING_ERROR' });

      const result = await revenueCatService.purchasePackage({ identifier: 'monthly' } as any);
      expect(result.success).toBe(false);
      expect(result.error).toContain('pending');
    });

    it('returns specific error for NETWORK_ERROR', async () => {
      mockPurchasePackage.mockRejectedValue({ code: 'NETWORK_ERROR' });

      const result = await revenueCatService.purchasePackage({ identifier: 'monthly' } as any);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Network');
    });

    it('returns generic error for unknown errors', async () => {
      mockPurchasePackage.mockRejectedValue(new Error('Something broke'));

      const result = await revenueCatService.purchasePackage({ identifier: 'monthly' } as any);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Something broke');
    });
  });

  describe('restorePurchases', () => {
    beforeEach(async () => {
      await revenueCatService.initialize();
    });

    it('returns success with customerInfo', async () => {
      const info = mockCustomerInfo({ premium: { isActive: true } });
      mockRestorePurchases.mockResolvedValue(info);

      const result = await revenueCatService.restorePurchases();
      expect(result.success).toBe(true);
      expect(result.customerInfo).toEqual(info);
    });

    it('returns error on failure', async () => {
      mockRestorePurchases.mockRejectedValue(new Error('Restore failed'));

      const result = await revenueCatService.restorePurchases();
      expect(result.success).toBe(false);
      expect(result.error).toBe('Restore failed');
    });
  });

  describe('isPremium - entitlement checking', () => {
    it('returns true for "premium" entitlement', () => {
      const info = mockCustomerInfo({ premium: { isActive: true } });
      expect(revenueCatService.isPremium(info as any)).toBe(true);
    });

    it('returns true for "pro" entitlement', () => {
      const info = mockCustomerInfo({ pro: { isActive: true } });
      expect(revenueCatService.isPremium(info as any)).toBe(true);
    });

    it('returns true for "plus" entitlement', () => {
      const info = mockCustomerInfo({ plus: { isActive: true } });
      expect(revenueCatService.isPremium(info as any)).toBe(true);
    });

    it('returns true for "deeper_sky" entitlement', () => {
      const info = mockCustomerInfo({ deeper_sky: { isActive: true } });
      expect(revenueCatService.isPremium(info as any)).toBe(true);
    });

    it('returns false for empty entitlements', () => {
      const info = mockCustomerInfo({});
      expect(revenueCatService.isPremium(info as any)).toBe(false);
    });

    it('returns false for unknown entitlement (prevents accidental premium)', () => {
      const info = mockCustomerInfo({ trial: { isActive: true } });
      expect(revenueCatService.isPremium(info as any)).toBe(false);
    });

    it('returns false for partner entitlement (no implicit grant)', () => {
      const info = mockCustomerInfo({ partner_deal: { isActive: true } });
      expect(revenueCatService.isPremium(info as any)).toBe(false);
    });
  });

  describe('logIn / logOut', () => {
    beforeEach(async () => {
      await revenueCatService.initialize();
    });

    it('logs in user with RevenueCat', async () => {
      await revenueCatService.logIn('user-123');
      expect(mockLogIn).toHaveBeenCalledWith('user-123');
    });

    it('logs out user from RevenueCat', async () => {
      await revenueCatService.logOut();
      expect(mockLogOut).toHaveBeenCalled();
    });

    it('handles logIn failure gracefully', async () => {
      mockLogIn.mockRejectedValueOnce(new Error('Network'));
      await revenueCatService.logIn('user-123');
      // Should not throw — error is caught
      const { logger } = require('../../../utils/logger');
      expect(logger.error).toHaveBeenCalledWith('[RevenueCat] logIn failed:', expect.any(Error));
    });
  });

  describe('getOfferings', () => {
    beforeEach(async () => {
      await revenueCatService.initialize();
    });

    it('returns current offering', async () => {
      const mockOffering = { identifier: 'default', availablePackages: [] };
      mockGetOfferings.mockResolvedValue({ current: mockOffering });

      const result = await revenueCatService.getOfferings();
      expect(result).toEqual(mockOffering);
    });

    it('returns null on failure', async () => {
      mockGetOfferings.mockRejectedValue(new Error('Network'));

      const result = await revenueCatService.getOfferings();
      expect(result).toBeNull();
    });
  });
});
