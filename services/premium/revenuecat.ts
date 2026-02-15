import Purchases, { 
  PurchasesOffering, 
  PurchasesPackage, 
  CustomerInfo,
  PurchasesEntitlementInfo,
  LOG_LEVEL 
} from 'react-native-purchases';
import { logger } from '../../utils/logger';
import { Platform } from 'react-native';

class RevenueCatService {
  private initPromise: Promise<void> | null = null;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      // Enable verbose logging for debugging
      if (__DEV__) { Purchases.setLogLevel(LOG_LEVEL.VERBOSE); } else { Purchases.setLogLevel(LOG_LEVEL.WARN); }

      const apiKey = Platform.select({
        ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY,
        android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY,
      });

      // Sanity check logging
      logger.info('[RevenueCat] Platform:', Platform.OS);
      logger.info('[RevenueCat] Using key prefix:', apiKey?.slice(0, 5));

      // Fail fast if wrong key format
      if (!apiKey || !(apiKey.startsWith("appl_") || apiKey.startsWith("goog_") || apiKey.startsWith("test_"))) {
        throw new Error(`[RevenueCat] Invalid API key: ${apiKey}`);
      }

      try {
        await Purchases.configure({ apiKey });
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

  async getCustomerInfo(): Promise<CustomerInfo | null> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      return await Purchases.getCustomerInfo();
    } catch (error) {
      logger.error('[RevenueCat] Failed to get customer info:', error);
      return null;
    }
  }

  isPremium(customerInfo: CustomerInfo): boolean {
    // Check for the 'premium' entitlement - this should match your RevenueCat dashboard
    return customerInfo.entitlements.active['premium'] !== undefined;
  }

  getActiveEntitlement(customerInfo: CustomerInfo): PurchasesEntitlementInfo | null {
    return customerInfo.entitlements.active['premium'] || null;
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