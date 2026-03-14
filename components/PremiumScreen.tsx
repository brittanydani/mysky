import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert, ActivityIndicator, Platform, Linking } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from './ui/SkiaGradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Href } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { theme } from '../constants/theme';
import { SkiaDynamicCosmos } from './ui/SkiaDynamicCosmos';
import MySkyDiamondSkia from './skia/MySkyDiamondSkia';
import { usePremium } from '../context/PremiumContext';
import { config } from '../constants/config';
import { DEEPER_SKY_FEATURES, DEEPER_SKY_MARKETING } from '../services/premium/deeperSkyFeatures';

type PlanType = 'monthly' | 'yearly' | 'lifetime';
type IoniconName = keyof typeof Ionicons.glyphMap;

interface PremiumScreenProps {
  onClose?: () => void;
}

export default function PremiumScreen({ onClose }: PremiumScreenProps = {}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isPremium, offerings, loading, purchase, restore } = usePremium();
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('yearly');
  const [restoring, setRestoring] = useState(false);

  // Resolve display prices from live RevenueCat offerings
  const resolvedTiers = config.premium.tiers.map((tier) => {
    if (!offerings) return tier;

    const identifierMap: Record<string, string[]> = {
      monthly: ['monthly', '$rc_monthly', 'mysky_monthly'],
      yearly: ['annual', 'yearly', '$rc_annual', 'mysky_annual', 'mysky_yearly'],
      lifetime: ['lifetime', '$rc_lifetime', 'mysky_lifetime'],
    };

    const ids = identifierMap[tier.id] ?? [];
    const pkg = offerings.availablePackages.find((p) =>
      ids.some((id) => p.identifier.toLowerCase().includes(id.toLowerCase()))
    );

    if (!pkg) return tier;

    return {
      ...tier,
      price: pkg.product.priceString,
      period: tier.period,
    };
  });

  const safeGoBack = useCallback(() => {
    if (onClose) {
      onClose();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/settings' as Href);
    }
  }, [router, onClose]);

  const handleSelectPlan = useCallback((plan: PlanType) => {
    if (loading || restoring) return;
    setSelectedPlan(plan);
    Haptics.selectionAsync().catch(() => {});
  }, [loading, restoring]);

  const handlePurchase = useCallback(async () => {
    if (!offerings) {
      Alert.alert('Not Available', 'Subscription packages are not available right now. Please try again later.');
      return;
    }

    const identifierMap: Record<PlanType, string[]> = {
      monthly: ['monthly', '$rc_monthly', 'mysky_monthly'],
      yearly: ['annual', 'yearly', '$rc_annual', 'mysky_annual', 'mysky_yearly'],
      lifetime: ['lifetime', '$rc_lifetime', 'mysky_lifetime'],
    };

    const identifiers = identifierMap[selectedPlan];
    const pkg = offerings.availablePackages.find(p =>
      identifiers.some(id => p.identifier.toLowerCase().includes(id.toLowerCase()))
    );

    if (!pkg) {
      Alert.alert('Not Available', 'This plan is not available right now. Please try another option.');
      return;
    }

    try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}

    const result = await purchase(pkg);

    if (result.success) {
      try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
      Alert.alert('Welcome to Deeper Sky ✨', 'Your premium features are now unlocked.');
    } else if (result.error) {
      Alert.alert('Purchase Failed', result.error);
    }
  }, [offerings, selectedPlan, purchase]);

  const handleRestore = useCallback(async () => {
    setRestoring(true);
    const result = await restore();
    setRestoring(false);

    if (result.success && result.hasPremium) {
      try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
      Alert.alert('Restored', 'Your purchases have been restored successfully.');
    } else if (result.success && !result.hasPremium) {
      Alert.alert('No Purchases Found', 'No active purchases were found for this account.');
    } else {
      Alert.alert('Restore Failed', result.error || 'Could not restore purchases. Please try again.');
    }
  }, [restore]);

  const openSubscriptions = useCallback(async () => {
    try {
      const url = Platform.select({
        ios: 'https://apps.apple.com/account/subscriptions',
        android: 'https://play.google.com/store/account/subscriptions',
        default: 'https://apps.apple.com/account/subscriptions',
      });
      if (url) await Linking.openURL(url);
    } catch {
      // Fall through silently if linking fails
    }
  }, []);

  const navigateToLegal = useCallback((path: '/terms' | '/privacy') => {
    if (onClose) onClose();
    setTimeout(() => router.push(path as Href), 350);
  }, [onClose, router]);

  // ── Active Premium State ──
  if (isPremium) {
    return (
      <View style={styles.container}>
        <SkiaDynamicCosmos />
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <ScrollView style={styles.scrollView} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}>
            <Pressable onPress={safeGoBack} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color={theme.textPrimary} />
            </Pressable>
            <View style={styles.diamondContainer}>
              <MySkyDiamondSkia size={140} />
            </View>
            <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
              <Text style={styles.premiumBadge}>✨ Deeper Sky Active</Text>
              <Text style={styles.title}>You're a Deeper Sky member</Text>
              <Text style={styles.subtitle}>
                All premium features are unlocked. Thank you for supporting MySky.
              </Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.featureList}>
              {DEEPER_SKY_FEATURES.map((feature) => (
                <View key={feature.id} style={styles.featureItem}>
                  <Ionicons name={feature.icon as IoniconName} size={20} color={theme.primary} />
                  <View style={styles.featureInfo}>
                    <Text style={styles.featureName}>{feature.name}</Text>
                    <Text style={styles.featureDesc}>{feature.premiumVersion}</Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={18} color={theme.primary} />
                </View>
              ))}
            </Animated.View>

            <Pressable
              onPress={openSubscriptions}
              accessibilityRole="link"
              accessibilityLabel="Manage your subscription"
            >
              <Text style={[styles.manageText, { textDecorationLine: 'underline' }]}>
                {Platform.select({
                  ios: 'Manage your subscription in Settings → Apple ID → Subscriptions',
                  android: 'Manage your subscription in Google Play → Subscriptions',
                  default: 'Manage your subscription in your app store settings',
                })}
              </Text>
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // ── Paywall State ──
  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />

      {/* Atmospheric background blurs */}
      <View style={styles.atmosphereLayer} pointerEvents="none">
        <View style={styles.atmosphereOrb1} />
        <View style={styles.atmosphereOrb2} />
      </View>

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Back button */}
          <Pressable onPress={safeGoBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={theme.textPrimary} />
          </Pressable>

          {/* ── Hero: Ethereal Eclipse ── */}
          <Animated.View entering={FadeInDown.delay(100).duration(700)} style={styles.heroSection}>
            <View style={styles.heroEclipse}>
              <View style={styles.heroRingOuter} />
              <View style={styles.heroRingInner} />
              <View style={styles.heroCore} />
              <MySkyDiamondSkia size={60} />
            </View>
          </Animated.View>

          {/* ── Value Copywriting ── */}
          <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.header}>
            <Text style={styles.premiumBadge}>✦ {DEEPER_SKY_MARKETING.headline}</Text>
            <Text style={styles.heroTitle}>
              Unlock your complete{'\n'}architectural blueprint
            </Text>
            <Text style={styles.heroSubtitle}>
              Map your subconscious patterns, decode your dreams, and receive personalized daily guidance.
            </Text>
          </Animated.View>

          {/* ── Value Propositions ── */}
          <Animated.View entering={FadeInDown.delay(280).duration(600)} style={styles.valueSection}>
            {[
              { icon: 'moon-outline', title: 'Map your subconscious', desc: 'Unlimited dream journaling with symbolic reflections', color: '#9D76C1' },
              { icon: 'analytics-outline', title: 'Decode your patterns', desc: 'Deep trend analysis across mood, energy, and stress', color: '#8BC4E8' },
              { icon: 'sparkles-outline', title: 'Daily cosmic guidance', desc: 'Personalized action steps aligned to your natal chart', color: '#D4B872' },
              { icon: 'shield-checkmark-outline', title: 'Encrypted vault', desc: 'Full backup & restore with end-to-end encryption', color: '#6EBF8B' },
            ].map((item, idx) => (
              <Animated.View key={item.title} entering={FadeInDown.delay(320 + idx * 60).duration(500)} style={styles.valueRow}>
                <View style={[styles.valueIconContainer, { borderColor: `${item.color}30` }]}>
                  <Ionicons name={item.icon as IoniconName} size={22} color={item.color} />
                </View>
                <View style={styles.valueText}>
                  <Text style={styles.valueTitle}>{item.title}</Text>
                  <Text style={styles.valueDesc}>{item.desc}</Text>
                </View>
              </Animated.View>
            ))}
          </Animated.View>

          {/* Flexible space to push pricing to the bottom on larger screens */}
          <View style={styles.spacer} />

          {/* ── Pricing Cards ── */}
          <Animated.View entering={FadeInDown.delay(500).duration(600)} style={styles.pricingRow}>
            {resolvedTiers.filter(t => t.id !== 'lifetime').map((tier) => {
              const isAnnual = tier.id === 'yearly';
              const isSelected = selectedPlan === tier.id;
              return (
                <Pressable
                  key={tier.id}
                  onPress={() => handleSelectPlan(tier.id as PlanType)}
                  disabled={loading || restoring}
                  style={[
                    styles.pricingCard,
                    isSelected && styles.pricingCardSelected,
                    isAnnual && isSelected && styles.pricingCardAnnual,
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                >
                  {isAnnual && (
                    <View style={styles.bestValueBadge}>
                      <Text style={styles.bestValueText}>BEST VALUE</Text>
                    </View>
                  )}
                  <Text style={styles.pricingPeriod}>
                    {isAnnual ? '12 Months' : '1 Month'}
                  </Text>
                  <Text
                    style={[styles.pricingPrice, isSelected && styles.pricingPriceSelected]}
                    adjustsFontSizeToFit
                    numberOfLines={1}
                  >
                    {tier.price}
                  </Text>
                  <Text style={[styles.pricingMeta, isSelected && styles.pricingMetaSelected]}>
                    {isAnnual ? `${tier.period}` : 'Billed monthly'}
                  </Text>
                </Pressable>
              );
            })}
          </Animated.View>

          {/* Lifetime option */}
          {resolvedTiers.find(t => t.id === 'lifetime') && (
            <Animated.View entering={FadeInDown.delay(550).duration(500)}>
              <Pressable
                onPress={() => handleSelectPlan('lifetime')}
                disabled={loading || restoring}
                style={[
                  styles.lifetimeRow,
                  selectedPlan === 'lifetime' && styles.lifetimeRowSelected,
                ]}
                accessibilityRole="radio"
                accessibilityState={{ selected: selectedPlan === 'lifetime' }}
              >
                <View style={styles.lifetimeTextContainer}>
                  <Text style={styles.lifetimeLabel}>Lifetime Access</Text>
                  <Text style={styles.lifetimeDesc}>One-time purchase, forever yours</Text>
                </View>
                <Text
                  style={[styles.lifetimePrice, selectedPlan === 'lifetime' && { color: '#D4B872' }]}
                  adjustsFontSizeToFit
                  numberOfLines={1}
                >
                  {resolvedTiers.find(t => t.id === 'lifetime')?.price}
                </Text>
              </Pressable>
            </Animated.View>
          )}
        </ScrollView>

        {/* ── Sticky Bottom CTA ── */}
        <View style={[styles.stickyBottom, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Animated.View entering={FadeInUp.delay(600).duration(600)}>
            <Pressable
              onPress={handlePurchase}
              disabled={loading || restoring}
              style={({ pressed }) => [
                styles.ctaButton,
                pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] },
                (loading || restoring) && { opacity: 0.7 },
              ]}
            >
              <LinearGradient
                colors={[theme.primary, theme.primaryDark]}
                style={styles.ctaGradient}
              >
                {loading ? (
                  <ActivityIndicator color={theme.background} />
                ) : (
                  <Text style={styles.ctaText}>
                    {selectedPlan === 'yearly' ? 'Start 7-Day Free Trial' : `Continue with ${resolvedTiers.find(t => t.id === selectedPlan)?.name}`}
                  </Text>
                )}
              </LinearGradient>
            </Pressable>
          </Animated.View>

          {/* Legal bar */}
          <View style={styles.legalBar}>
            <Pressable onPress={handleRestore} disabled={restoring || loading} hitSlop={12}>
              {restoring ? (
                <ActivityIndicator size="small" color={theme.textMuted} />
              ) : (
                <Text style={styles.legalBarLink}>Restore</Text>
              )}
            </Pressable>
            <Text style={styles.legalBarDot}>·</Text>
            <Pressable onPress={() => navigateToLegal('/terms')} disabled={loading} hitSlop={12}>
              <Text style={styles.legalBarLink}>Terms</Text>
            </Pressable>
            <Text style={styles.legalBarDot}>·</Text>
            <Pressable onPress={() => navigateToLegal('/privacy')} disabled={loading} hitSlop={12}>
              <Text style={styles.legalBarLink}>Privacy</Text>
            </Pressable>
          </View>

          <Text style={styles.legalMicro}>
            {Platform.OS === 'ios'
              ? 'Auto-renews. Cancel anytime in Settings → Apple ID → Subscriptions.'
              : 'Auto-renews. Cancel anytime in Google Play → Subscriptions.'}
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 24,
  },
  spacer: {
    flex: 1,
    minHeight: 24,
  },

  // ── Atmosphere ──
  atmosphereLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  atmosphereOrb1: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(139, 196, 232, 0.06)',
  },
  atmosphereOrb2: {
    position: 'absolute',
    bottom: 100,
    left: -80,
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: 'rgba(201, 174, 120, 0.05)',
  },

  backButton: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diamondContainer: {
    alignItems: 'center',
    marginBottom: 4,
  },

  // ── Hero Eclipse ──
  heroSection: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  heroEclipse: {
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroRingOuter: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  heroRingInner: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    borderColor: 'rgba(201, 174, 120, 0.15)',
    shadowColor: '#D4B872',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  heroCore: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(201, 174, 120, 0.05)',
  },

  // ── Header ──
  header: {
    marginBottom: theme.spacing.xl,
    alignItems: 'center',
  },
  premiumBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.primary,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: theme.spacing.md,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.textPrimary,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    letterSpacing: 0.3,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
    lineHeight: 36,
  },
  heroSubtitle: {
    fontSize: 15,
    color: theme.textSecondary,
    lineHeight: 24,
    textAlign: 'center',
    paddingHorizontal: 16,
  },

  // ── Value Propositions ──
  valueSection: {
    marginBottom: 32,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  valueIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.02)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  valueText: {
    flex: 1,
  },
  valueTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textPrimary,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    marginBottom: 4,
  },
  valueDesc: {
    fontSize: 13,
    color: theme.textSecondary,
    lineHeight: 18,
  },

  // ── Pricing Cards ──
  pricingRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  pricingCard: {
    flex: 1,
    paddingVertical: 24,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.02)',
    alignItems: 'center',
  },
  pricingCardSelected: {
    borderColor: 'rgba(212, 184, 114, 0.35)',
    backgroundColor: 'rgba(212, 184, 114, 0.04)',
    shadowColor: '#D4B872',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  pricingCardAnnual: {
    borderColor: 'rgba(212, 184, 114, 0.5)',
    borderWidth: 1.5,
  },
  bestValueBadge: {
    backgroundColor: '#D4B872',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 12,
  },
  bestValueText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#020817',
    letterSpacing: 1,
  },
  pricingPeriod: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 8,
  },
  pricingPrice: {
    fontSize: 26,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  pricingPriceSelected: {
    color: '#FFF',
  },
  pricingMeta: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
  },
  pricingMetaSelected: {
    color: '#D4B872',
  },

  // ── Lifetime ──
  lifetimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(255,255,255,0.01)',
  },
  lifetimeRowSelected: {
    borderColor: 'rgba(212, 184, 114, 0.3)',
    backgroundColor: 'rgba(212, 184, 114, 0.03)',
  },
  lifetimeTextContainer: {
    flex: 1,
    paddingRight: 12,
  },
  lifetimeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textPrimary,
  },
  lifetimeDesc: {
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 4,
  },
  lifetimePrice: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.textPrimary,
  },

  // ── Sticky Bottom ──
  stickyBottom: {
    paddingTop: 16,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: 'rgba(2, 8, 23, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  ctaButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#D4B872',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  ctaGradient: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
  },
  ctaText: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.background,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
  legalBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 12,
  },
  legalBarLink: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.4)',
  },
  legalBarDot: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.2)',
  },
  legalMicro: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 14,
  },

  // ── Already premium state ──
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.textPrimary,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    letterSpacing: 0.3,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: theme.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
  },
  featureList: {
    marginBottom: theme.spacing.xl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  featureInfo: {
    flex: 1,
  },
  featureName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.textPrimary,
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 13,
    color: theme.textSecondary,
    lineHeight: 18,
  },
  manageText: {
    fontSize: 13,
    color: theme.textMuted,
    textAlign: 'center',
    marginTop: theme.spacing.xl,
    fontStyle: 'italic',
  },
});
