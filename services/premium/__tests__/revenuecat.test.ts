import { revenueCatService } from '../revenuecat';
import type { CustomerInfo, PurchasesOffering } from 'react-native-purchases';

jest.mock('../../../utils/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

// react-native-purchases is lazy-loaded via dynamic import — mock it
jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {
    isConfigured: jest.fn().mockResolvedValue(false),
    configure: jest.fn().mockResolvedValue(undefined),
    getAppUserID: jest.fn().mockResolvedValue('user-123'),
    getOfferings: jest.fn(),
    purchasePackage: jest.fn(),
    restorePurchases: jest.fn(),
    logIn: jest.fn(),
    logOut: jest.fn(),
    getCustomerInfo: jest.fn(),
  },
}));

jest.mock('react-native', () => ({ Platform: { OS: 'ios' } }));

function makeCustomerInfo(activeKeys: string[]): CustomerInfo {
  const active: Record<string, { identifier: string }> = {};
  for (const key of activeKeys) {
    active[key] = { identifier: key };
  }
  return { entitlements: { active } } as unknown as CustomerInfo;
}

describe('revenueCatService.isPremium', () => {
  it('returns true when "premium" entitlement is active', () => {
    expect(revenueCatService.isPremium(makeCustomerInfo(['premium']))).toBe(true);
  });

  it('returns true for known aliases: pro, plus, deeper_sky', () => {
    expect(revenueCatService.isPremium(makeCustomerInfo(['pro']))).toBe(true);
    expect(revenueCatService.isPremium(makeCustomerInfo(['plus']))).toBe(true);
    expect(revenueCatService.isPremium(makeCustomerInfo(['deeper_sky']))).toBe(true);
  });

  it('returns false when no entitlements are active', () => {
    expect(revenueCatService.isPremium(makeCustomerInfo([]))).toBe(false);
  });

  it('returns false for unknown entitlement keys', () => {
    expect(revenueCatService.isPremium(makeCustomerInfo(['trial_xyz', 'partner']))).toBe(false);
  });
});

describe('revenueCatService.getActiveEntitlement', () => {
  it('returns the first matching known entitlement', () => {
    const info = makeCustomerInfo(['premium']);
    const entitlement = revenueCatService.getActiveEntitlement(info);
    expect(entitlement?.identifier).toBe('premium');
  });

  it('returns null when there are no active entitlements', () => {
    expect(revenueCatService.getActiveEntitlement(makeCustomerInfo([]))).toBeNull();
  });

  it('returns first active entitlement for unknown keys as fallback', () => {
    const info = makeCustomerInfo(['some_other_entitlement']);
    const entitlement = revenueCatService.getActiveEntitlement(info);
    expect(entitlement?.identifier).toBe('some_other_entitlement');
  });
});

describe('revenueCatService.getPackageByType', () => {
  function makeOffering(identifiers: string[]): PurchasesOffering {
    return {
      availablePackages: identifiers.map((id) => ({ identifier: id } as any)),
    } as unknown as PurchasesOffering;
  }

  it('finds a monthly package by identifier', () => {
    const offering = makeOffering(['mysky_monthly', 'mysky_annual']);
    expect(revenueCatService.getPackageByType(offering, 'monthly')?.identifier).toBe('mysky_monthly');
  });

  it('finds an annual package by identifier', () => {
    const offering = makeOffering(['mysky_monthly', 'mysky_yearly']);
    expect(revenueCatService.getPackageByType(offering, 'annual')?.identifier).toBe('mysky_yearly');
  });

  it('returns null when no matching package exists', () => {
    const offering = makeOffering(['unknown_package']);
    expect(revenueCatService.getPackageByType(offering, 'monthly')).toBeNull();
  });
});
