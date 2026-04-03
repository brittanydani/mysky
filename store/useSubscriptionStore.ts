/**
 * store/useSubscriptionStore.ts
 *
 * Zustand store that mirrors RevenueCat entitlement state globally.
 * All RC operations delegate to revenueCatService so configuration
 * and listener setup can never be duplicated (the service is a
 * guarded singleton).
 *
 * Use this store when you need isPro outside a React context, or
 * when a component prefers Zustand over the usePremium() hook.
 * Both this store and PremiumContext stay in sync because they both
 * subscribe to the same Purchases.addCustomerInfoUpdateListener.
 */

import { create } from 'zustand';
import Purchases from 'react-native-purchases';
import type { PurchasesPackage } from 'react-native-purchases';

import { revenueCatService } from '../services/premium/revenuecat';
import { logger } from '../utils/logger';

interface SubscriptionState {
  /** True when the user holds an active "Deeper Sky Active" entitlement. */
  isPro: boolean;
  /** True once initialize() has completed at least once. */
  isConfigured: boolean;
  /** Available packages from the current RevenueCat offering. */
  packages: PurchasesPackage[];
  /** True while a purchase or restore is in flight. */
  isPurchasing: boolean;

  /**
   * Idempotent boot step. Call once on app start (e.g. from _layout.tsx).
   * Delegates to revenueCatService so RC is never double-configured.
   */
  initialize: () => Promise<void>;

  /** Populates `packages` from the current RC offering. */
  fetchOfferings: () => Promise<void>;

  /** Returns true when the transaction completes and entitlement is active. */
  purchasePackage: (pkg: PurchasesPackage) => Promise<boolean>;

  /** Returns true when at least one active entitlement is restored. */
  restorePurchases: () => Promise<boolean>;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  isPro: false,
  isConfigured: false,
  packages: [],
  isPurchasing: false,

  initialize: async () => {
    if (get().isConfigured) return;

    try {
      await revenueCatService.initialize();

      const info = await revenueCatService.getCustomerInfo();
      if (info) {
        set({ isPro: revenueCatService.isPremium(info) });
      }

      // Keep isPro in sync whenever RevenueCat pushes an update.
      // NOTE: PremiumContext also registers a listener. Both are safe
      // because they run AFTER awaiting initialize() above.
      const listener = (updatedInfo: import('react-native-purchases').CustomerInfo) => {
        set({ isPro: revenueCatService.isPremium(updatedInfo) });
      };
      Purchases.addCustomerInfoUpdateListener(listener);

      set({ isConfigured: true });
    } catch (e) {
      logger.error('[useSubscriptionStore] initialize failed:', e);
      // Mark configured so we don't retry infinitely on every render
      set({ isConfigured: true });
    }
  },

  fetchOfferings: async () => {
    try {
      const offering = await revenueCatService.getOfferings();
      if (offering) {
        set({ packages: offering.availablePackages });
      }
    } catch (e) {
      logger.error('[useSubscriptionStore] fetchOfferings failed:', e);
    }
  },

  purchasePackage: async (pkg: PurchasesPackage) => {
    set({ isPurchasing: true });
    try {
      const result = await revenueCatService.purchasePackage(pkg);

      if (result.success && result.customerInfo) {
        set({
          isPro: revenueCatService.isPremium(result.customerInfo),
          isPurchasing: false,
        });
        return true;
      }

      set({ isPurchasing: false });
      return false;
    } catch (e: unknown) {
      set({ isPurchasing: false });
      const err = e as Record<string, unknown> | undefined;
      if (!err?.userCancelled) {
        logger.error('[useSubscriptionStore] purchasePackage failed:', e);
      }
      return false;
    }
  },

  restorePurchases: async () => {
    set({ isPurchasing: true });
    try {
      const result = await revenueCatService.restorePurchases();
      const isActive = result.customerInfo
        ? revenueCatService.isPremium(result.customerInfo)
        : false;
      set({ isPro: isActive, isPurchasing: false });
      return isActive;
    } catch (e) {
      set({ isPurchasing: false });
      logger.error('[useSubscriptionStore] restorePurchases failed:', e);
      return false;
    }
  },
}));
