// NOTE: react-native-purchases is NOT imported at the top level.
// On iOS 26 (RN New Architecture / TurboModules), the library accesses
// NativeModules.RNPurchases and creates a NativeEventEmitter at module eval
// time. Doing this before the JS engine is fully bootstrapped causes a
// use-after-free crash in convertNSExceptionToJSError / backtrace_symbols.
// All Purchases access goes through getPurchases() which lazy-loads the module
// the first time any RC method is actually called (well after bootstrap).
import type PurchasesType from 'react-native-purchases';
import type {
  PurchasesOffering,
  PurchasesPackage,
  CustomerInfo,
  PurchasesEntitlementInfo,
} from 'react-native-purchases';
import { logger } from '../../utils/logger';
import { Platform } from 'react-native';

type PurchasesModule = typeof import('react-native-purchases');

let _purchasesModule: PurchasesModule | null = null;

async function getPurchases(): Promise<typeof PurchasesType> {
  if (!_purchasesModule) {
    _purchasesModule = await import('react-native-purchases');
  }
  return _purchasesModule.default;
}

class RevenueCatService {
  private initPromise: Promise<void> | null = null;
  private initialized = false;
  private currentAppUserId: string | null = null;
  private readonly premiumEntitlementAliases = ['premium', 'pro', 'plus', 'deeper_sky'];

  async initialize(): Promise<void> {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      const apiKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;

      // Sanity check logging
      logger.info('[RevenueCat] Platform:', Platform.OS);

      // Fail fast if wrong key format
      if (!apiKey || !(apiKey.startsWith("appl_") || apiKey.startsWith("goog_"))) {
        throw new Error(`[RevenueCat] Invalid API key format (prefix: ${apiKey?.slice(0, 5) ?? 'none'})`);
      }

      try {
        const Purchases = await getPurchases();
        const alreadyConfigured = await Purchases.isConfigured().catch(() => false);

        if (!alreadyConfigured) {
          await Purchases.configure({ apiKey });
        }

        this.currentAppUserId = await Purchases.getAppUserID().catch(() => null);
        // NOTE: Purchases.setLogLevel() is a void TurboModule method. On iOS 26
        // (RN New Architecture) it throws an NSException that crashes inside
        // convertNSExceptionToJSError before we can catch it in JS. Removed
        // entirely — RC logs are not needed in production.
        this.initialized = true;
        logger.info('[RevenueCat] Initialized successfully');
      } catch (error) {
        logger.error('[RevenueCat] Failed to initialize:', error);
        throw error;
      }
    })();

    try {
      await this.initPromise;
    } catch (error) {
      // Reset so next call can retry
      this.initPromise = null;
      throw error;
    }
  }

  async getOfferings(): Promise<PurchasesOffering | null> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const Purchases = await getPurchases();
      const offerings = await Purchases.getOfferings();
      return offerings.current;
    } catch (error) {
      logger.error('[RevenueCat] Failed to get offerings:', error);
      return null;
    }
  }

  async purchasePackage(packageToPurchase: PurchasesPackage): Promise<{
    success: boolean;
    customerInfo?: CustomerInfo;
    error?: string;
    userCancelled?: boolean;
  }> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const Purchases = await getPurchases();
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      return { success: true, customerInfo };
    } catch (error: any) {
      logger.error('[RevenueCat] Purchase failed:', error);
      
      if (error.userCancelled) {
        return { success: false, userCancelled: true, error: 'Purchase was cancelled' };
      }
      
      // Handle specific error codes
      if (error.code === 'PURCHASE_NOT_ALLOWED_ERROR') {
        return { 
          success: false, 
          error: 'Purchases are not allowed on this device. Please check your device settings.' 
        };
      }
      
      if (error.code === 'PAYMENT_PENDING_ERROR') {
        return { 
          success: false, 
          error: 'Payment is pending approval. Please check back later.' 
        };
      }
      
      if (error.code === 'PRODUCT_NOT_AVAILABLE_FOR_PURCHASE_ERROR') {
        return { 
          success: false, 
          error: 'This product is not available for purchase. Please try again later.' 
        };
      }

      if (error.code === 'NETWORK_ERROR' || error.code === 'UNEXPECTED_BACKEND_RESPONSE_ERROR') {
        return {
          success: false,
          error: 'Network error — please check your connection and try again.',
        };
      }
      
      return { 
        success: false, 
        error: error.message || 'Purchase failed. Please try again.' 
      };
    }
  }

  async restorePurchases(): Promise<{
    success: boolean;
    customerInfo?: CustomerInfo;
    error?: string;
  }> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const Purchases = await getPurchases();
      const customerInfo = await Purchases.restorePurchases();
      return { success: true, customerInfo };
    } catch (error: any) {
      logger.error('[RevenueCat] Restore failed:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to restore purchases' 
      };
    }
  }

  async logIn(userId: string): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
    try {
      const Purchases = await getPurchases();
      const currentAppUserId = this.currentAppUserId ?? await Purchases.getAppUserID().catch(() => null);
      if (currentAppUserId === userId) {
        return;
      }
      await Purchases.logIn(userId);
      this.currentAppUserId = userId;
      logger.info('[RevenueCat] User logged in successfully');
    } catch (error) {
      logger.error('[RevenueCat] logIn failed:', error);
    }
  }

  async logOut(): Promise<void> {
    if (!this.initialized) return;
    try {
      const Purchases = await getPurchases();
      await Purchases.logOut();
      this.currentAppUserId = await Purchases.getAppUserID().catch(() => null);
      logger.info('[RevenueCat] Logged out');
    } catch (error) {
      logger.error('[RevenueCat] logOut failed:', error);
    }
  }

  async getCustomerInfo(): Promise<CustomerInfo | null> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const Purchases = await getPurchases();
      return await Purchases.getCustomerInfo();
    } catch (error) {
      logger.error('[RevenueCat] Failed to get customer info:', error);
      return null;
    }
  }

  isPremium(customerInfo: CustomerInfo): boolean {
    const activeEntitlements = customerInfo.entitlements.active;
    const activeKeys = Object.keys(activeEntitlements);

    if (activeKeys.length === 0) return false;

    // Prefer explicit known aliases first.
    const hasKnownPremiumEntitlement = this.premiumEntitlementAliases.some(
      key => activeEntitlements[key] !== undefined,
    );
    if (hasKnownPremiumEntitlement) return true;

    // Only known premium entitlement aliases grant access.
    // Do NOT fall through to `return true` — an unknown entitlement (trial, partner, etc.)
    // must not silently grant premium access.
    return false;
  }

  getActiveEntitlement(customerInfo: CustomerInfo): PurchasesEntitlementInfo | null {
    const activeEntitlements = customerInfo.entitlements.active;

    for (const key of this.premiumEntitlementAliases) {
      if (activeEntitlements[key]) return activeEntitlements[key];
    }

    const firstActiveEntitlement = Object.values(activeEntitlements)[0];
    return firstActiveEntitlement ?? null;
  }

  // Helper method to get package by type for easier selection
  getPackageByType(offering: PurchasesOffering, type: 'monthly' | 'annual' | 'lifetime'): PurchasesPackage | null {
    // RevenueCat package types - adjust these based on your actual package identifiers
    const typeMap = {
      monthly: ['monthly', '$rc_monthly', 'mysky_monthly'],
      annual: ['annual', 'yearly', '$rc_annual', 'mysky_annual', 'mysky_yearly'],
      lifetime: ['lifetime', '$rc_lifetime', 'mysky_lifetime'],
    };

    const identifiers = typeMap[type];
    
    return offering.availablePackages.find(pkg => 
      identifiers.some(id => 
        pkg.identifier.toLowerCase().includes(id.toLowerCase())
      )
    ) || null;
  }
}

export const revenueCatService = new RevenueCatService();