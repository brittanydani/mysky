import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert, ActivityIndicator, Platform, Linking } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from './ui/SkiaGradient';
import { Ionicons } from '@expo/vector-icons';
import { MetallicText } from './ui/MetallicText';
import { MetallicIcon } from './ui/MetallicIcon';
import { useRouter, Href } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { theme } from '../constants/theme';
import { SkiaDynamicCosmos } from './ui/SkiaDynamicCosmos';
import MySkyDiamondSkia from './skia/MySkyDiamondSkia';
import { usePremium } from '../context/PremiumContext';
import { config, LEGAL_URL } from '../constants/config';
import { DEEPER_SKY_FEATURES, DEEPER_SKY_MARKETING } from '../services/premium/deeperSkyFeatures';
import { metallicFillColors, metallicFillPositions } from '../constants/mySkyMetallic';

type PlanType = 'monthly' | 'yearly' | 'lifetime';
type IoniconName = keyof typeof Ionicons.glyphMap;

interface PremiumScreenProps {
  onClose?: () => void;
  analyticsSource?: string;
  analyticsExperiment?: string;
  analyticsVariant?: string;
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
  const selectedTier = resolvedTiers.find((tier) => tier.id === selectedPlan);
  const subscriptionTiers = resolvedTiers.filter((tier) => tier.id !== 'lifetime');
  const lifetimeTier = resolvedTiers.find((tier) => tier.id === 'lifetime');

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
      Alert.alert('Welcome to Deeper Sky', 'Your premium features are now unlocked.');
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

  const navigateToLegal = useCallback((_path: '/terms' | '/privacy') => {
    Linking.openURL(LEGAL_URL).catch(() => {
      if (onClose) onClose();
      setTimeout(() => router.push(_path as Href), 350);
    });
  }, [onClose, router]);

  // ── Active Premium State ──
  if (isPremium) {
    return (
      <View style={styles.container}>
        <SkiaDynamicCosmos />
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <ScrollView style={styles.scrollView} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}>
            <Pressable onPress={safeGoBack} style={styles.backButton}>
              <Ionicons name="chevron-back-outline" size={24} color={theme.textPrimary} />
            </Pressable>
            <View style={styles.diamondContainer}>
              <MySkyDiamondSkia size={140} />
            </View>
            <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
              <Text style={styles.premiumBadge}>✦ Deeper Sky Active</Text>
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
                  <Ionicons name="checkmark-circle-outline" size={18} color={theme.primary} />
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
            <Ionicons name="chevron-back-outline" size={24} color={theme.textPrimary} />
          </Pressable>

          {/* ── Hero: Ethereal Eclipse ── */}
          <Animated.View entering={FadeInDown.delay(100).duration(700)} style={styles.heroSection}>
            <View style={styles.heroEclipse}>
              <View style={styles.heroRingOuter} />
              <View style={styles.heroRingInner} />
              <View style={styles.heroCore} />
              <MySkyDiamondSkia size={78} />
            </View>
          </Animated.View>

          {/* ── Value Copywriting ── */}
          <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.header}>
            <Text style={styles.premiumBadge}>✦ {DEEPER_SKY_MARKETING.headline}</Text>
            <Text style={styles.heroTitle}>See what your patterns are teaching you</Text>
            <Text style={styles.heroSubtitle}>
              Deeper Sky turns your sleep, mood, dreams, and journal history into weekly shifts, recurring themes, and more personal guidance.
            </Text>
          </Animated.View>

          {/* ── Value Propositions ── */}
          <Animated.View entering={FadeInDown.delay(280).duration(600)} style={styles.valueSection}>
            {[
              { icon: 'calendar-outline', title: 'Track change over time', desc: 'Weekly shifts, recurring themes, and longitudinal pattern insight', color: '#C9AE78' },
              { icon: 'analytics-outline', title: 'Understand what helps or hurts', desc: 'See what restores you, drains you, and repeats in your reflections', color: '#C9AE78' },
              { icon: 'sparkles-outline', title: 'Get more personal guidance', desc: 'Guidance shaped by your history, not just today\'s mood', color: '#C9AE78' },
              { icon: 'shield-checkmark-outline', title: 'Private by design', desc: 'Core reflections stay encrypted on-device and are not sold for ads', color: '#C9AE78' },
            ].map((item, idx) => (
              <Animated.View key={item.title} entering={FadeInDown.delay(320 + idx * 60).duration(500)} style={styles.valueRow}>
                <View style={[styles.valueIconContainer, { borderColor: `${item.color}30` }]}>
                  <MetallicIcon name={item.icon as IoniconName} size={22} color={item.color} />
                </View>
                <View style={styles.valueText}>
                  <Text style={styles.valueTitle}>{item.title}</Text>
                  <Text style={styles.valueDesc}>{item.desc}</Text>
                </View>
              </Animated.View>
            ))}
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(360).duration(600)} style={styles.trustCard}>
            <Text style={styles.trustLabel}>WHY MEMBERS STAY</Text>
            <Text style={styles.trustBody}>
              The value compounds as you log more. Deeper Sky highlights what changed this week, what keeps repeating, and what your private history is teaching you.
            </Text>
            <Text style={styles.trustFootnote}>
              Core analysis stays local whenever possible. Subscription verification and optional external features are clearly separated.
            </Text>
          </Animated.View>

          {/* Flexible space to push pricing to the bottom on larger screens */}
          <View style={styles.spacer} />

          {/* ── Pricing Cards ── */}
          <Animated.View entering={FadeInDown.delay(500).duration(600)} style={styles.pricingRow}>
            {subscriptionTiers.map((tier) => {
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
                  {isAnnual ? (
                    <LinearGradient
                      colors={[...metallicFillColors]}
                      locations={[...metallicFillPositions]}
                      start={[0, 0]}
                      end={[1, 0]}
                      style={styles.bestValueBadge}
                    >
                      <Text style={styles.bestValueText}>BEST FOR GROWTH</Text>
                    </LinearGradient>
                  ) : (
                    <View style={styles.pricingBadgePlaceholder} />
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
                  {isSelected ? (
                    <MetallicText color="#D4B872" style={[styles.pricingMeta, styles.pricingMetaSelected]}>
                      {isAnnual ? 'Build your pattern archive all year' : 'Flexible monthly access'}
                    </MetallicText>
                  ) : (
                    <Text style={styles.pricingMeta}>
                      {isAnnual ? 'Build your pattern archive all year' : 'Flexible monthly access'}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </Animated.View>

          {lifetimeTier ? (
            <Animated.View entering={FadeInDown.delay(560).duration(600)}>
              <Text style={styles.lifetimeSectionLabel}>Optional one-time unlock</Text>
              <Pressable
                onPress={() => handleSelectPlan('lifetime')}
                disabled={loading || restoring}
                style={[
                  styles.lifetimeOfferCard,
                  selectedPlan === 'lifetime' && styles.lifetimeOfferCardSelected,
                ]}
                accessibilityRole="radio"
                accessibilityState={{ selected: selectedPlan === 'lifetime' }}
              >
                <View style={styles.lifetimeOfferCopy}>
                  <Text style={styles.lifetimeOfferTitle}>Lifetime</Text>
                  <Text style={styles.lifetimeOfferDesc}>Best for people who already know they want one long-term private archive.</Text>
                </View>
                <View style={styles.lifetimeOfferPriceWrap}>
                  <Text style={styles.lifetimeOfferPrice}>{lifetimeTier.price}</Text>
                  <Text style={styles.lifetimeOfferMeta}>single purchase</Text>
                </View>
              </Pressable>
            </Animated.View>
          ) : null}
        </ScrollView>

        {/* ── Sticky Bottom CTA ── */}
        <View style={[styles.stickyBottom, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {/* Legal agreement line above CTA */}
          <Text style={styles.legalAgreement}>
            {'By continuing, you agree to our '}
            <Text style={styles.legalAgreementLink} onPress={() => navigateToLegal('/terms')}>
              Terms of Use (EULA)
            </Text>
            {' and '}
            <Text style={styles.legalAgreementLink} onPress={() => navigateToLegal('/privacy')}>
              Privacy Policy
            </Text>
            .
          </Text>

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
                colors={[...metallicFillColors]}
                locations={[...metallicFillPositions]}
                start={[0, 0]}
                end={[1, 1]}
                style={styles.ctaGradient}
              >
                {loading ? (
                  <ActivityIndicator color={theme.background} />
                ) : (
                  <Text style={styles.ctaText}>
                    {`Continue with ${selectedTier?.name ?? 'your plan'}`}
                  </Text>
                )}
              </LinearGradient>
            </Pressable>
          </Animated.View>

          <Text style={styles.ctaHint}>
            {selectedPlan === 'yearly'
              ? 'Yearly is the best fit if you want weekly pattern shifts, recurring themes, and a full year of progress.'
              : selectedPlan === 'lifetime'
                ? 'Lifetime works best if you already know you want to keep your full archive in one place long term.'
                : 'Monthly is the lightest way to try Deeper Sky before committing to a longer pattern-building cycle.'}
          </Text>

          {/* Legal bar */}
          <View style={styles.legalBar}>
            <Pressable onPress={handleRestore} disabled={restoring || loading} hitSlop={12}>
              {restoring ? (
                <ActivityIndicator size="small" color={theme.textMuted} />
              ) : (
                <Text style={styles.legalBarLink}>Restore Purchases</Text>
              )}
            </Pressable>
            <Text style={styles.legalBarDot}>·</Text>
            <Pressable onPress={() => navigateToLegal('/terms')} disabled={loading} hitSlop={12}>
              <Text style={styles.legalBarLink}>Terms of Use</Text>
            </Pressable>
            <Text style={styles.legalBarDot}>·</Text>
            <Pressable onPress={() => navigateToLegal('/privacy')} disabled={loading} hitSlop={12}>
              <Text style={styles.legalBarLink}>Privacy Policy</Text>
            </Pressable>
          </View>

          <Text style={styles.legalMicro}>
            {selectedPlan === 'lifetime'
              ? Platform.select({
                  ios: 'This is a one-time purchase. Payment will be charged to your Apple ID account at confirmation of purchase. No recurring charges.',
                  android: 'This is a one-time purchase. Payment will be charged to your Google Account at confirmation of purchase. No recurring charges.',
                  default: 'This is a one-time purchase. No recurring charges.',
                })
              : Platform.select({
                  ios: 'Payment will be charged to your Apple ID account at confirmation of purchase. Subscription automatically renews unless cancelled at least 24 hours before the end of the current period. Your account will be charged for renewal within 24 hours prior to the end of the current period. Manage or cancel subscriptions in Settings → Apple ID → Subscriptions.',
                  android: 'Payment will be charged to your Google Account at confirmation of purchase. Subscription automatically renews unless cancelled at least 24 hours before the end of the current period. Your account will be charged for renewal within 24 hours prior to the end of the current period. Manage or cancel subscriptions in Google Play → Subscriptions.',
                  default: 'Subscription automatically renews unless cancelled at least 24 hours before the end of the current period. Manage or cancel in your app store account settings.',
                })}
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
    marginTop: 0,
    marginBottom: 0,
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
    marginTop: -16,
    marginBottom: 0,
  },
  heroEclipse: {
    width: 150,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroRingOuter: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  heroRingInner: {
    position: 'absolute',
    width: 116,
    height: 116,
    borderRadius: 58,
    borderWidth: 1,
    borderColor: 'rgba(201, 174, 120, 0.18)',
    shadowColor: '#C9AE78',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
  },
  heroCore: {
    position: 'absolute',
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(201, 174, 120, 0.06)',
  },

  // ── Header ──
  header: {
    marginBottom: 8,
    alignItems: 'center',
  },
  premiumBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.primary,
    letterSpacing: 1,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: theme.textPrimary,
    letterSpacing: 0.3,
    marginBottom: 8,
    textAlign: 'center',
    lineHeight: 34,
  },
  heroSubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 21,
    textAlign: 'center',
    paddingHorizontal: 16,
  },

  // ── Value Propositions ──
  valueSection: {
    marginBottom: 12,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
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
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 4,
  },
  valueDesc: {
    fontSize: 13,
    color: theme.textSecondary,
    lineHeight: 18,
  },
  trustCard: {
    marginBottom: 16,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(197,181,161,0.18)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  trustLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  trustBody: {
    fontSize: 14,
    lineHeight: 22,
    color: theme.textPrimary,
    marginBottom: 8,
  },
  trustFootnote: {
    fontSize: 12,
    lineHeight: 18,
    color: theme.textSecondary,
  },

  // ── Pricing Cards ──
  pricingRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  pricingBadgePlaceholder: {
    height: 24,
    marginBottom: 12,
  },
  pricingCard: {
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 8,
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
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 12,
  },
  bestValueText: {
    fontSize: 7,
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
  lifetimeSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.38)',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
    textAlign: 'center',
  },
  lifetimeOfferCard: {
    marginBottom: 12,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(255,255,255,0.015)',
    flexDirection: 'row',
    alignItems: 'center',
    opacity: 0.86,
  },
  lifetimeOfferCardSelected: {
    borderColor: 'rgba(212, 184, 114, 0.24)',
    backgroundColor: 'rgba(212, 184, 114, 0.035)',
    opacity: 1,
  },
  lifetimeOfferCopy: {
    flex: 1,
    paddingRight: 16,
  },
  lifetimeOfferTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.textPrimary,
    marginBottom: 4,
  },
  lifetimeOfferDesc: {
    fontSize: 12,
    lineHeight: 17,
    color: theme.textSecondary,
  },
  lifetimeOfferPriceWrap: {
    alignItems: 'flex-end',
  },
  lifetimeOfferPrice: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  lifetimeOfferMeta: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.35)',
    marginTop: 4,
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
  legalAgreement: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  legalAgreementLink: {
    color: 'rgba(212, 184, 114, 0.85)',
    textDecorationLine: 'underline',
  },
  ctaButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#C9AE78',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 6,
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
    color: '#3A2A10',
  },
  ctaHint: {
    marginTop: 12,
    fontSize: 12,
    lineHeight: 18,
    color: theme.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 6,
  },
  legalBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 12,
  },
  legalBarLink: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.55)',
    textDecorationLine: 'underline',
  },
  legalBarDot: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.2)',
  },
  legalMicro: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 16,
    paddingHorizontal: 4,
  },

  // ── Already premium state ──
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.textPrimary,
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
  },
});
