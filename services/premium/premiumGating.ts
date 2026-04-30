import { supabase } from '../../lib/supabase';
import { logger } from '../../utils/logger';

export type PremiumFeature = 'deeper_sky' | 'dream_analysis' | 'astrology_insights';

type SubscriptionRow = {
  status?: string | null;
  entitlements?: unknown;
};

export async function verifyPremiumAccess(
  userId: string,
  feature: PremiumFeature,
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('status, entitlements')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (error || !data) {
      logger.warn('[Premium] No active subscription found', {
        userIdPrefix: userId.slice(0, 8),
        error: error?.message,
      });
      return false;
    }

    const subscription = data as SubscriptionRow;
    const hasEntitlement = Array.isArray(subscription.entitlements)
      && subscription.entitlements.includes(feature);

    if (!hasEntitlement) {
      logger.warn('[Premium] Missing entitlement', {
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
