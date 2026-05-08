import { revenueCatService } from './revenuecat';
import { logger } from '../../utils/logger';

export type PremiumFeature = 'deeper_sky' | 'dream_analysis' | 'astrology_insights';

export async function verifyPremiumAccess(
  userId: string,
  feature: PremiumFeature,
): Promise<boolean> {
  try {
    await revenueCatService.initialize();
    await revenueCatService.logIn(userId);

    const customerInfo = await revenueCatService.getCustomerInfo();
    const hasAccess = customerInfo ? revenueCatService.isPremium(customerInfo) : false;

    if (!hasAccess) {
      logger.warn('[Premium] Missing RevenueCat entitlement', {
        userIdPrefix: userId.slice(0, 8),
        feature,
      });
      return false;
    }

    return true;
  } catch (error) {
    logger.error('[Premium] Entitlement check failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

export async function requirePremium<T>(
  userId: string,
  feature: PremiumFeature,
  operation: () => Promise<T>,
): Promise<T> {
  const hasAccess = await verifyPremiumAccess(userId, feature);
  if (!hasAccess) {
    throw new Error(`Premium access required for: ${feature}`);
  }
  return operation();
}
