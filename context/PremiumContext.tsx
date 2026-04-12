/**
 * context/PremiumContext.tsx
 * * Manages the "Deeper Sky" premium state via RevenueCat.
 * Synchronizes local state with cloud entitlements and handles IAP flows.
 */

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback, ReactNode, useRef } from 'react';
import type { CustomerInfo, PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import * as Haptics from 'expo-haptics';
import Constants from 'expo-constants';

import { EncryptedAsyncStorage } from '../services/storage/encryptedAsyncStorage';
import { revenueCatService } from '../services/premium/revenuecat';
import { logger } from '../utils/logger';
import { useAuth } from './AuthContext';

const DEMO_PREMIUM_KEY = '@mysky:demo_premium';
const DEMO_REVIEWER_EMAIL = 'brittanyapps@outlook.com';

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

const DEBUG_FORCE_PREMIUM = __DEV__ && Constants.expoConfig?.extra?.betaPremium === true;

export function PremiumProvider({ children }: { children: ReactNode }) {
  const { session, loading: authLoading } = useAuth();
  const [isPremium, setIsPremium] = useState<boolean>(DEBUG_FORCE_PREMIUM);
  const [isReady, setIsReady] = useState(false);
  const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [loading, setLoading] = useState(false);
  
  const isMounted = useRef(true);
  // Track if we've already done the first haptic to avoid buzzing on every app launch
  const initialHapticDone = useRef(false);

  const activeUserId = session?.user?.id ?? null;
  const activeUserEmail = session?.user?.email ?? null;

  // ─── Logic ──────────────────────────────────────────────────────────────────

  const updatePremiumState = useCallback((info: CustomerInfo | null) => {
    if (!isMounted.current) return;
    
    setCustomerInfo(info);

    if (DEBUG_FORCE_PREMIUM) {
      setIsPremium(true);
      return;
    }

    const premiumActive = info ? revenueCatService.isPremium(info) : false;
    
    setIsPremium((prev) => {
      // Only fire haptic if they transition from free to premium while the app is open
      if (premiumActive && !prev && initialHapticDone.current) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
      return premiumActive;
    });

    // Mark that the first check is complete
    initialHapticDone.current = true;
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
      if (isMounted.current) setLoading(false);
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
      if (isMounted.current) setLoading(false);
    }
  }, [updatePremiumState]);

  // ─── Lifecycle ──────────────────────────────────────────────────────────────

  useEffect(() => {
    isMounted.current = true;
    let customerInfoListener: ((info: CustomerInfo) => void) | null = null;

    const init = async () => {
      if (authLoading) return;

      if (isMounted.current) {
        setCustomerInfo(null);
        setOfferings(null);
        setIsReady(false);
        setIsPremium(DEBUG_FORCE_PREMIUM);
      }

      if (!activeUserId) {
        if (isMounted.current) setIsReady(true);
        return;
      }

      try {
        const hasDemoPremiumOverride =
          activeUserEmail === DEMO_REVIEWER_EMAIL &&
          (await EncryptedAsyncStorage.getItem(DEMO_PREMIUM_KEY)) === 'true';

        await revenueCatService.initialize();
        await revenueCatService.logIn(activeUserId);

        if (isMounted.current) {
          customerInfoListener = (info: CustomerInfo) => {
            updatePremiumState(info);
            if (hasDemoPremiumOverride) setIsPremium(true);
          };
          try {
            const { default: Purchases } = await import('react-native-purchases');
            Purchases.addCustomerInfoUpdateListener(customerInfoListener);
          } catch (e) {
            logger.error('[PremiumContext] addCustomerInfoUpdateListener failed:', e);
            customerInfoListener = null;
          }
        }
        
        const [info, activeOfferings] = await Promise.all([
          revenueCatService.getCustomerInfo(),
          revenueCatService.getOfferings(),
        ]);

        if (isMounted.current) {
          setOfferings(activeOfferings);
          updatePremiumState(info);
          if (hasDemoPremiumOverride) setIsPremium(true);
          setIsReady(true);
          logger.info('[PremiumContext] System Ready');
        }
      } catch (e) {
        logger.error('[PremiumContext] Initialization failed:', e);
        if (isMounted.current) setIsReady(true);
      }
    };

    init();

    return () => {
      isMounted.current = false;
      if (customerInfoListener) {
        // Safe cleanup for the listener
        import('react-native-purchases')
          .then(({ default: Purchases }) => {
            if (customerInfoListener) Purchases.removeCustomerInfoUpdateListener(customerInfoListener);
          })
          .catch(() => {});
      }
    };
  }, [activeUserEmail, activeUserId, authLoading, updatePremiumState]);

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
