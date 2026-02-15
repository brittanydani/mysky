import { logger } from '../utils/logger';
// context/PremiumContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import type { CustomerInfo, PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import { revenueCatService } from '../services/premium/revenuecat';

type PurchaseResult = { success: boolean; error?: string; userCancelled?: boolean };
type RestoreResult = { success: boolean; error?: string };

interface PremiumContextType {
  isPremium: boolean;
  isReady: boolean;
  offerings: PurchasesOffering | null;
  customerInfo: CustomerInfo | null;
  loading: boolean;
  purchase: (packageToPurchase: PurchasesPackage) => Promise<PurchaseResult>;
  restore: () => Promise<RestoreResult>;
  refreshCustomerInfo: () => Promise<void>;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

export function usePremium(): PremiumContextType {
  const ctx = useContext(PremiumContext);
  if (!ctx) throw new Error('usePremium must be used within a PremiumProvider');
  return ctx;
}

interface PremiumProviderProps {
  children: ReactNode;
}

export function PremiumProvider({ children }: PremiumProviderProps) {
  const [isPremium, setIsPremium] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const updateCustomerInfo = (info: CustomerInfo | null) => {
    setCustomerInfo(info);
    // Set isPremium based on RevenueCat entitlements
    if (info) {
      setIsPremium(revenueCatService.isPremium(info));
    } else {
      setIsPremium(false);
    }
  };

  const refreshCustomerInfo = async () => {
    try {
      const info = await revenueCatService.getCustomerInfo();
      updateCustomerInfo(info);
    } catch (e) {
      logger.error('[PremiumContext] refreshCustomerInfo failed:', e);
    }
  };

  const purchase = async (packageToPurchase: PurchasesPackage): Promise<PurchaseResult> => {
    setLoading(true);
    try {
      const result = await revenueCatService.purchasePackage(packageToPurchase);
      if (result.success && result.customerInfo) updateCustomerInfo(result.customerInfo);
      return { success: result.success, error: result.error, userCancelled: result.userCancelled };
    } catch (e: any) {
      logger.error('[PremiumContext] purchase failed:', e);
      return { success: false, error: e?.message ?? 'Purchase failed' };
    } finally {
      setLoading(false);
    }
  };

  const restore = async (): Promise<RestoreResult> => {
    setLoading(true);
    try {
      const result = await revenueCatService.restorePurchases();
      if (result.success && result.customerInfo) updateCustomerInfo(result.customerInfo);
      return { success: result.success, error: result.error };
    } catch (e: any) {
      logger.error('[PremiumContext] restore failed:', e);
      return { success: false, error: e?.message ?? 'Restore failed' };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        await revenueCatService.initialize();

        const [ci, off] = await Promise.all([
          revenueCatService.getCustomerInfo(),
          revenueCatService.getOfferings(),
        ]);

        if (!mounted) return;
        updateCustomerInfo(ci);
        setOfferings(off);
      } catch (e) {
        logger.error('[PremiumContext] initialize failed:', e);
      } finally {
        if (mounted) setIsReady(true);
      }
    };

    init();
    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo<PremiumContextType>(
    () => ({
      isPremium,
      isReady,
      offerings,
      customerInfo,
      loading,
      purchase,
      restore,
      refreshCustomerInfo,
    }),
    [isPremium, isReady, offerings, customerInfo, loading]
  );

  return <PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>;
}