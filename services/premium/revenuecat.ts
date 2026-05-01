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
import Constants from 'expo-constants';

type PurchasesModule = typeof import('react-native-purchases');

let _purchasesModule: PurchasesModule | null = null;

async function getPurchases(): Promise<typeof PurchasesType> {
  if (!_purchasesModule) {
    _purchasesModule = await import('react-native-purchases');
  }
  return _purchasesModule.default;
}

type ValidationResult = {
  valid: boolean;
  errors: string[];
};

async function validateRevenueCatConfiguration(): Promise<ValidationResult> {
  const apiKey = Platform.OS === 'android'
    ? process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY
    : process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;

  if (!apiKey) {
    return { valid: false, errors: ['RevenueCat API key not configured'] };
  }

  const expectedPrefix = Platform.OS === 'android' ? 'goog_' : 'appl_';
  if (!apiKey.startsWith(expectedPrefix)) {
    return {
      valid: false,
      errors: [`Invalid API key format. Expected ${expectedPrefix} prefix.`],
    };
  }

  try {
    await getPurchases();
    return { valid: true, errors: [] };
  } catch (error) {
    return {
      valid: false,
      errors: [
        `RevenueCat module failed to load: ${
          error instanceof Error ? error.message : String(error)
        }`,
      ],
    };
  }
}

async function isPurchasesConfigured(Purchases: typeof PurchasesType): Promise<boolean> {
  if (typeof Purchases.isConfigured !== 'function') {
    return false;
  }

  try {
    return await Purchases.isConfigured();
  } catch {
    return false;
  }
}

async function getPurchasesAppUserId(Purchases: typeof PurchasesType): Promise<string | null> {
  if (typeof Purchases.getAppUserID !== 'function') {
    return null;
  }

  try {
    return await Purchases.getAppUserID();
  } catch {
    return null;
  }
}

class RevenueCatService {
  private initPromise: Promise<void> | null = null;
  private initialized = false;
  private disabledReason: string | null = null;
  private currentAppUserId: string | null = null;
  private readonly premiumEntitlementAliases = ['premium', 'pro', 'plus', 'deeper_sky'];

  private getUnsupportedReason(): string | null {
    if (Platform.OS !== 'ios') {
      return null;
    }

    const appVariant = Constants.expoConfig?.extra?.appVariant ?? process.env.APP_VARIANT ?? 'production';
    const allowDevBundle = process.env.EXPO_PUBLIC_REVENUECAT_ALLOW_DEV_BUNDLE === 'true';

    if (appVariant !== 'development' || allowDevBundle) {
      return null;
    }

    return 'disabled for the development app variant';
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      const unsupportedReason = this.getUnsupportedReason();
      if (unsupportedReason) {
        this.disabledReason = unsupportedReason;
        this.initialized = true;
        logger.info('[RevenueCat] Skipping initialization:', unsupportedReason);
        return;
      }

      const apiKey = Platform.OS === 'android'
        ? process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY
        : process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;

      // Sanity check logging
      logger.info('[RevenueCat] Platform:', Platform.OS);

      const validation = await validateRevenueCatConfiguration();
      if (!validation.valid) {
        logger.error('[RevenueCat] Configuration invalid', {
          errors: validation.errors,
        });
        throw new Error(`RevenueCat configuration error: ${validation.errors.join('; ')}`);
      }
      if (!apiKey) {
        throw new Error('RevenueCat configuration error: API key missing');
      }

      try {
        const Purchases = await getPurchases();
        const alreadyConfigured = await isPurchasesConfigured(Purchases);

        if (!alreadyConfigured) {
          await Purchases.configure({ apiKey });
        }

        this.currentAppUserId = await getPurchasesAppUserId(Purchases);
        // NOTE: Purchases.setLogLevel() is a void TurboModule method. On iOS 26
        // (RN New Architecture) it throws an NSException that crashes inside
        // convertNSExceptionToJSError before we can catch it in JS. Removed
        // entirely — RC logs are not needed in production.
        this.initialized = true;
        this.disabledReason = null;
        logger.info('[RevenueCat] Initialized successfully');
      } catch (error) {
        logger.error('[RevenueCat] Failed to initialize', {
          error: error instanceof Error ? error.message : String(error),
        });
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
    if (this.disabledReason) {
      return null;
    }

    try {
      const Purchases = await getPurchases();
      const offerings = await Purchases.getOfferings();
      return offerings.current;
    } catch (error) {
      logger.error('[RevenueCat] Failed to get offerings', {
        error: error instanceof Error ? error.message : String(error),
      });
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
    if (this.disabledReason) {
      return { success: false, error: 'Purchases are unavailable in this app build.' };
    }

    try {
      const Purchases = await getPurchases();
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      return { success: true, customerInfo };
    } catch (error: any) {
      logger.error('[RevenueCat] Purchase failed', {
        code: error?.code,
        message: error?.message,
        userCancelled: Boolean(error?.userCancelled),
      });
      
      if (error.userCancelled) {
        return { success: false, userCancelled: true, error: 'Purchase was canceled' };
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
    if (this.disabledReason) {
      return { success: false, error: 'Purchases are unavailable in this app build.' };
    }

    try {
      const Purchases = await getPurchases();
      const customerInfo = await Purchases.restorePurchases();
      return { success: true, customerInfo };
    } catch (error: any) {
      logger.error('[RevenueCat] Restore failed', {
        code: error?.code,
        message: error?.message,
      });
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
    if (this.disabledReason) {
      return;
    }
    try {
      const Purchases = await getPurchases();
      const currentAppUserId = this.currentAppUserId ?? await getPurchasesAppUserId(Purchases);
      if (currentAppUserId === userId) {
        return;
      }
      await Purchases.logIn(userId);
      this.currentAppUserId = userId;
      logger.info('[RevenueCat] User logged in successfully');
    } catch (error) {
      logger.error('[RevenueCat] logIn failed', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async logOut(): Promise<void> {
    if (!this.initialized) return;
    if (this.disabledReason) {
      return;
    }
    try {
      const Purchases = await getPurchases();
      await Purchases.logOut();
      this.currentAppUserId = await getPurchasesAppUserId(Purchases);
      logger.info('[RevenueCat] Logged out');
    } catch (error) {
      logger.error('[RevenueCat] logOut failed', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async getCustomerInfo(): Promise<CustomerInfo | null> {
    if (!this.initialized) {
      await this.initialize();
    }
    if (this.disabledReason) {
      return null;
    }

    try {
      const Purchases = await getPurchases();
      return await Purchases.getCustomerInfo();
    } catch (error) {
      logger.error('[RevenueCat] Failed to get customer info', {
        error: error instanceof Error ? error.message : String(error),
      });
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
  getPackageByType(offering: PurchasesOffering, type: 'monthly' | 'annual'): PurchasesPackage | null {
    // RevenueCat package types - adjust these based on your actual package identifiers
    const typeMap = {
      monthly: ['monthly', '$rc_monthly', 'mysky_monthly'],
      annual: ['annual', 'yearly', '$rc_annual', 'mysky_annual', 'mysky_yearly'],
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
