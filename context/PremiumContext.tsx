/**
 * context/PremiumContext.tsx
 * * Manages the "Deeper Sky" premium state via RevenueCat.
 * Synchronizes local state with cloud entitlements and handles IAP flows.
 */

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback, ReactNode, useRef } from 'react';
import Purchases from 'react-native-purchases';
import type { CustomerInfo, PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import * as Haptics from 'expo-haptics';

import { revenueCatService } from '../services/premium/revenuecat';
import { logger } from '../utils/logger';

type PurchaseResult = { success: boolean; error?: string; userCancelled?: boolean };
type RestoreResult = { success: boolean; hasPremium?: boolean; error?: string };

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

// ─── Constants ────────────────────────────────────────────────────────────────

// Dev-only: force premium ON for local testing. Production builds always use RevenueCat.
const DEBUG_FORCE_PREMIUM = __DEV__ && true;

export function PremiumProvider({ children }: { children: ReactNode }) {
  const [isPremium, setIsPremium] = useState<boolean>(DEBUG_FORCE_PREMIUM);
  const [isReady, setIsReady] = useState(false);
  const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [loading, setLoading] = useState(false);
  
  const isMounted = useRef(true);

  // ─── Logic ──────────────────────────────────────────────────────────────────

  const updatePremiumState = useCallback((info: CustomerInfo | null) => {
    if (!isMounted.current) return;
    
    setCustomerInfo(info);

    if (DEBUG_FORCE_PREMIUM) {
      setIsPremium(true);
      return;
    }

    const premiumActive = info ? revenueCatService.isPremium(info) : false;
    
    // Trigger haptic when user first becomes premium
    setIsPremium((prev) => {
      if (premiumActive && !prev) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
      return premiumActive;
    });
  }, []);

  const refreshCustomerInfo = useCallback(async () => {
    try {
      const info = await revenueCatService.getCustomerInfo();
      updatePremiumState(info);
    } catch (e) {
      logger.error('[PremiumContext] refreshCustomerInfo failed:', e);
    }
  }, [updatePremiumState]);

  const purchase = useCallback(async (pkg: PurchasesPackage): Promise<PurchaseResult> => {
    setLoading(true);
    try {
      const result = await revenueCatService.purchasePackage(pkg);
      if (result.success && result.customerInfo) {
        updatePremiumState(result.customerInfo);
      }
      return { success: result.success, error: result.error, userCancelled: result.userCancelled };
    } catch (e) {
      logger.error('[PremiumContext] purchase failed:', e);
      return { success: false, error: 'Purchase encountered an unexpected error.' };
    } finally {
      setLoading(false);
    }
  }, [updatePremiumState]);

  const restore = useCallback(async (): Promise<RestoreResult> => {
    setLoading(true);
    try {
      const result = await revenueCatService.restorePurchases();
      const hasPremium = result.customerInfo ? revenueCatService.isPremium(result.customerInfo) : false;
      if (result.success && result.customerInfo) {
        updatePremiumState(result.customerInfo);
      }
      return { success: result.success, hasPremium, error: result.error };
    } catch (e) {
      logger.error('[PremiumContext] restore failed:', e);
      return { success: false, error: 'Restore failed.' };
    } finally {
      setLoading(false);
    }
  }, [updatePremiumState]);

  // ─── Lifecycle ──────────────────────────────────────────────────────────────

  useEffect(() => {
    isMounted.current = true;

    const init = async () => {
      try {
        await revenueCatService.initialize();
        
        // Parallel fetch for speed, but atomic state update
        const [info, activeOfferings] = await Promise.all([
          revenueCatService.getCustomerInfo(),
          revenueCatService.getOfferings(),
        ]);

        if (isMounted.current) {
          setOfferings(activeOfferings);
          updatePremiumState(info);
          setIsReady(true);
          logger.info('[PremiumContext] System Ready');
        }
      } catch (e) {
        logger.error('[PremiumContext] Initialization failed:', e);
        if (isMounted.current) setIsReady(true); // Don't block app boot on failure
      }
    };

    init();

    // Entitlement Listener
    const removeListener = Purchases.addCustomerInfoUpdateListener((info) => {
      updatePremiumState(info);
    }) as unknown as (() => void);

    return () => {
      isMounted.current = false;
      if (typeof removeListener === 'function') removeListener();
    };
  }, []);

  // ─── Value ──────────────────────────────────────────────────────────────────

  const contextValue = useMemo(() => ({
    isPremium,
    isReady,
    offerings,
    customerInfo,
    loading,
    purchase,
    restore,
    refreshCustomerInfo,
  }), [isPremium, isReady, offerings, customerInfo, loading, purchase, restore, refreshCustomerInfo]);

  return (
    <PremiumContext.Provider value={contextValue}>
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium(): PremiumContextType {
  const context = useContext(PremiumContext);
  if (!context) {
    throw new Error('usePremium must be used within a PremiumProvider');
  }
  return context;
}
