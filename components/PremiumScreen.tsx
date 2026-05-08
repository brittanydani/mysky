import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Href } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { type AppTheme } from '../constants/theme';
import { SkiaDynamicCosmos } from './ui/SkiaDynamicCosmos';
import { usePremium } from '../context/PremiumContext';
import { config, LEGAL_URL } from '../constants/config';
import { DEEPER_SKY_FEATURES, DEEPER_SKY_MARKETING } from '../services/premium/deeperSkyFeatures';
import { revenueCatService } from '../services/premium/revenuecat';
import { useThemedStyles } from '../context/ThemeContext';
import { trackGrowthEvent } from '../services/growth/localAnalytics';
import TermsOfServiceScreen from '../app/terms';
import PrivacyPolicyScreen from '../app/privacy';

// ── Absolute Monolithic Palette ──
const PALETTE = {
  bg: '#000000',          // Pure OLED Black
  pureWhite: '#FFFFFF',   // Stark Contrast
  textMuted: 'rgba(255, 255, 255, 0.45)',
  textFaint: 'rgba(255, 255, 255, 0.25)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
  glassSurface: 'rgba(255, 255, 255, 0.04)',
};

type PlanType = 'monthly' | 'yearly';
type IoniconName = keyof typeof Ionicons.glyphMap;

const PREMIUM_UNLOCKS: { icon: IoniconName; title: string; desc: string }[] = [
  {
    icon: 'sparkles-outline',
    title: 'More daily insight depth',
    desc: 'Expanded daily insight cards, clearer reflection prompts, weekly shifts, and recurring themes based on your own history.',
  },
  {
    icon: 'analytics-outline',
    title: 'Mood, sleep, and pattern trends',
    desc: 'Trend charts for mood and sleep, plus what restores you, drains you, and keeps repeating across check-ins and reflections.',
  },
  {
    icon: 'journal-outline',
    title: 'Journal pattern analysis',
    desc: 'Keyword lift, emotional tone shifts, writing patterns, and correlations between your journal history and lived signals.',
  },
  {
    icon: 'moon-outline',
    title: 'Richer dream interpretation',
    desc: 'AI dream interpretation with the richer model, recurring symbol clusters, sleep quality trends, and dream-history context.',
  },
  {
    icon: 'people-outline',
    title: 'Up to 10 relationship charts',
    desc: 'Save up to 10 relationship charts with deeper emotional breakdowns for partners, friends, family, or other important connections.',
  },
  {
    icon: 'book-outline',
    title: 'Full personal story',
    desc: 'All 10 story chapters, including love style, conflict patterns, inner child themes, shadow work, and reflection questions.',
  },
  {
    icon: 'heart-half-outline',
    title: 'Healing and relationship reflections',
    desc: 'Attachment themes, fear patterns, safety patterns, shadow work, and chart-tied inner-work prompts.',
  },
  {
    icon: 'compass-outline',
    title: 'Chiron, Nodes, and chart depth',
    desc: 'Chiron sensitivity mapping, Node-axis depth, extended stellium narratives, element analysis, and chart pattern details.',
  },
  {
    icon: 'document-text-outline',
    title: 'PDF chart export',
    desc: 'Export your birth chart, placements, house cusps, aspects, and all 10 personal story chapters as a PDF.',
  },
  {
    icon: 'shield-checkmark-outline',
    title: 'Backup and restore',
    desc: 'Export a portable .msky backup file and restore your profile data on another device.',
  },
];

interface PremiumScreenProps {
  onClose?: () => void;
  analyticsSource?: string;
  analyticsExperiment?: string;
  analyticsVariant?: string;
}

export default function PremiumScreen({ onClose, analyticsSource, analyticsExperiment, analyticsVariant }: PremiumScreenProps = {}) {
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isPremium, isReady, offerings, loading, purchase, restore } = usePremium();
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('yearly');
  const [restoring, setRestoring] = useState(false);
  const [activeLegalView, setActiveLegalView] = useState<'none' | 'terms' | 'privacy'>('none');

  React.useEffect(() => {
    trackGrowthEvent('paywall_viewed', {
      source: analyticsSource ?? 'unknown',
      experiment: analyticsExperiment ?? 'none',
      variant: analyticsVariant ?? 'none',
    }).catch(() => {});
  }, [analyticsExperiment, analyticsSource, analyticsVariant]);

  const findPackageForPlan = useCallback((plan: PlanType) => {
    if (!offerings) return null;

    const packageType = plan === 'monthly' ? 'monthly' : 'annual';
    return revenueCatService.getPackageByType(offerings, packageType);
  }, [offerings]);

  const resolvedTiers = React.useMemo(() => (
    config.premium.tiers.map((tier) => {
      const matchingPackage = findPackageForPlan(tier.id as PlanType);
      if (!matchingPackage) return tier;
      return {
        ...tier,
        price: matchingPackage.product.priceString,
        priceValue: matchingPackage.product.price,
      };
    })
  ), [findPackageForPlan]);

  const subscriptionTiers = resolvedTiers;
  const selectedTier = subscriptionTiers.find((tier) => tier.id === selectedPlan) ?? subscriptionTiers[0];

  const safeGoBack = useCallback(() => {
    if (onClose) {
      onClose();
      return;
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)/settings' as Href);
  }, [onClose, router]);

  const navigateToLegal = useCallback((route: '/terms' | '/privacy') => {
    if (onClose) {
      setActiveLegalView(route === '/terms' ? 'terms' : 'privacy');
    } else {
      router.push(route as Href);
    }
  }, [router, onClose]);

  const openSubscriptions = useCallback(() => {
    Linking.openURL('https://apps.apple.com/account/subscriptions').catch(() => {
      Alert.alert('Manage Subscription', 'Open Settings > Apple ID > Subscriptions to manage your plan.');
    });
  }, []);

  const openLegalWebsite = useCallback(() => {
    Linking.openURL(LEGAL_URL).catch(() => {});
  }, []);

  const handleSelectPlan = useCallback((plan: PlanType) => {
    Haptics.selectionAsync().catch(() => {});
    setSelectedPlan(plan);
    trackGrowthEvent('paywall_plan_selected', {
      source: analyticsSource ?? 'unknown',
      plan,
    }).catch(() => {});
  }, [analyticsSource]);

  const handlePurchase = useCallback(async () => {
    const packageToPurchase = findPackageForPlan(selectedPlan);

    if (!packageToPurchase) {
      Alert.alert('Not Available', 'Subscription plans are temporarily unavailable. Please try again shortly.');
      return;
    }

    const result = await purchase(packageToPurchase);
    if (result.success) {
      trackGrowthEvent('paywall_purchase_succeeded', {
        source: analyticsSource ?? 'unknown',
        plan: selectedPlan,
      }).catch(() => {});
      Alert.alert('Welcome to Deeper Sky', 'Your subscription is active and premium insights are now unlocked.');
      safeGoBack();
      return;
    }

    if (result.userCancelled) return;

    Alert.alert('Purchase Failed', result.error ?? 'Your purchase could not be completed.');
  }, [analyticsSource, findPackageForPlan, purchase, safeGoBack, selectedPlan]);

  const handleRestore = useCallback(async () => {
    setRestoring(true);
    try {
      const result = await restore();
      if (result.success && result.hasPremium) {
        Alert.alert('Restored', 'Your Deeper Sky purchase has been restored.');
        safeGoBack();
        return;
      }
      if (result.success && !result.hasPremium) {
        Alert.alert('No Purchases Found', 'We could not find an active Deeper Sky subscription for this Apple ID.');
        return;
      }
      Alert.alert('Restore Failed', result.error ?? 'We could not restore your purchases right now.');
    } finally {
      setRestoring(false);
    }
  }, [restore, safeGoBack]);

  if (activeLegalView === 'terms') {
    return <TermsOfServiceScreen onBack={() => setActiveLegalView('none')} />;
  }

  if (activeLegalView === 'privacy') {
    return <PrivacyPolicyScreen onBack={() => setActiveLegalView('none')} />;
  }

  if (!isReady) {
    return (
      <View style={[styles.container, styles.centered]}>
        <SkiaDynamicCosmos />
        <ActivityIndicator color={PALETTE.pureWhite} />
        <Text style={styles.loadingText}>Checking subscription...</Text>
      </View>
    );
  }

  // ── Active Premium State ──
  if (isPremium) {
    return (
      <View style={styles.container}>
        <SkiaDynamicCosmos />
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <ScrollView style={styles.scrollView} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}>
            <Pressable onPress={safeGoBack} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Go back">
              <Ionicons name="chevron-back-outline" size={24} color={PALETTE.pureWhite} />
            </Pressable>
            <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
              <Text style={styles.premiumBadge}>{"✦ DEEPER SKY ACTIVE"}</Text>
              <Text style={styles.title}>{"You're a Deeper Sky member."}</Text>
              <Text style={styles.heroSubtitle}>
                {"All premium features are unlocked. Thank you for supporting MySky."}
              </Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.featureList}>
              {DEEPER_SKY_FEATURES.map((feature) => (
                <View key={feature.id} style={styles.featureItem}>
                  <Ionicons name={feature.icon as IoniconName} size={28} color={PALETTE.pureWhite} style={styles.featureIcon} />
                  <View style={styles.featureInfo}>
                    <Text style={styles.featureName}>{feature.name}</Text>
                    <Text style={styles.featureDesc}>{feature.premiumVersion}</Text>
                  </View>
                  <Ionicons name="checkmark" size={24} color={PALETTE.pureWhite} />
                </View>
              ))}
            </Animated.View>

            <Pressable
              onPress={openSubscriptions}
              accessibilityRole="link"
              accessibilityLabel="Manage your subscription"
            >
              <Text style={styles.manageText}>
                {"Manage your subscription in Settings → Apple ID → Subscriptions"}
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

      {/* Extremely faint atmospheric depth so the text floats cleanly */}
      <View style={styles.atmosphereLayer} pointerEvents="none">
        <View style={styles.atmosphereOrb} />
      </View>

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 40) }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Back button */}
          <Pressable onPress={safeGoBack} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Go back">
            <Ionicons name="chevron-back-outline" size={24} color={PALETTE.pureWhite} />
          </Pressable>

          {/* ── Massive Editorial Headline ── */}
          <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
            <Text style={styles.premiumBadge}>{"✦ "}{DEEPER_SKY_MARKETING.headline}</Text>
            <Text style={styles.title}>{"See your patterns."}</Text>
            <Text style={styles.title}>{"More clearly."}</Text>
            <Text style={styles.heroSubtitle}>
              {"Deeper Sky turns your sleep, mood, dreams, relationships, chart, and journal history into weekly shifts, recurring themes, and reflection prompts grounded in your own data."}
            </Text>
          </Animated.View>

          {/* ── Exact Premium Unlocks ── */}
          <Animated.View entering={FadeInDown.delay(280).duration(600)} style={styles.unlockSection}>
            <Text style={styles.sectionLabel}>{"WHAT PREMIUM UNLOCKS"}</Text>
            <Text style={styles.sectionIntro}>
              {"Deeper Sky includes every premium feature below. No separate add-ons."}
            </Text>
            {PREMIUM_UNLOCKS.map((item, idx) => (
              <Animated.View key={item.title} entering={FadeInDown.delay(320 + idx * 40).duration(500)} style={styles.unlockRow}>
                <View style={styles.unlockIconBox}>
                  <Ionicons name={item.icon} size={20} color={PALETTE.pureWhite} />
                </View>
                <View style={styles.unlockText}>
                  <Text style={styles.unlockTitle}>{item.title}</Text>
                  <Text style={styles.unlockDesc}>{item.desc}</Text>
                </View>
              </Animated.View>
            ))}
          </Animated.View>

          {/* ── Editorial Trust Block ── */}
          <Animated.View entering={FadeInDown.delay(360).duration(600)} style={styles.trustBlock}>
            <Text style={styles.trustLabel}>{"WHY MEMBERS STAY"}</Text>
            <Text style={styles.trustBody}>
              {"The value compounds as you log more. Deeper Sky highlights what changed this week, what keeps repeating, and what your private history is teaching you."}
            </Text>
            <Text style={styles.trustFootnote}>
              {"Core analysis stays local whenever possible. AI dream interpretation and optional AI insight refinement are separate, clearly labeled features."}
            </Text>
          </Animated.View>

          <View style={styles.spacer} />

          {/* ── Stark Pricing Cards ── */}
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
                  ]}
                  accessibilityRole="radio"
                  accessibilityLabel={`${tier.name}, ${tier.price}`}
                  accessibilityState={{ selected: isSelected, disabled: loading || restoring }}
                >
                  {isAnnual ? (
                    <View style={[styles.bestValueBadge, !isSelected && styles.bestValueBadgeMuted]}>
                      <Text style={[styles.bestValueText, !isSelected && styles.bestValueTextMuted]}>{"BEST FOR GROWTH"}</Text>
                    </View>
                  ) : (
                    <View style={styles.pricingBadgePlaceholder} />
                  )}
                  <Text style={[styles.pricingPeriod, isSelected && styles.pricingPeriodSelected]}>
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
                    {isAnnual ? 'Build your pattern profile all year' : 'Flexible access'}
                  </Text>
                </Pressable>
              );
            })}
          </Animated.View>

          {/* ── In-Flow Editorial Footer ── */}
          <Animated.View entering={FadeInUp.delay(600).duration(600)} style={styles.footerContainer}>
            <Text style={styles.legalAgreement}>
              {'By continuing, you agree to our '}
              <Text style={styles.legalAgreementLink} onPress={openLegalWebsite}>
                Terms of Use & Privacy Policy
              </Text>
              {'. '}
              <Text style={styles.legalAgreementLink} onPress={() => navigateToLegal('/terms')}>
                Terms
              </Text>
              {' · '}
              <Text style={styles.legalAgreementLink} onPress={() => navigateToLegal('/privacy')}>
                Privacy
              </Text>
            </Text>

            <Pressable
              onPress={handlePurchase}
              disabled={loading || restoring}
              accessibilityRole="button"
              accessibilityLabel={`Continue with ${selectedTier?.name ?? 'your plan'}`}
              accessibilityState={{ disabled: loading || restoring }}
              style={({ pressed }) => [
                styles.ctaButton,
                pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                (loading || restoring) && { opacity: 0.7 },
              ]}
            >
              <View style={styles.ctaSolidBackground}>
                {loading ? (
                  <ActivityIndicator color="#000000" />
                ) : (
                  <Text style={styles.ctaText}>
                    {`Continue with ${selectedTier?.name ?? 'your plan'}`}
                  </Text>
                )}
              </View>
            </Pressable>

            <Text style={styles.ctaHint}>
              {selectedPlan === 'yearly'
                ? 'Yearly is the best fit if you want weekly pattern shifts, recurring themes, and a full year of progress.'
                : 'Monthly is the lightest way to try Deeper Sky before committing to a longer pattern-building cycle.'}
            </Text>

            {/* Stark Editorial Footnote Bar */}
            <View style={styles.legalBar}>
              <Pressable
                onPress={handleRestore}
                disabled={restoring || loading}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Restore purchases"
                accessibilityState={{ disabled: restoring || loading, busy: restoring }}
              >
                {restoring ? (
                  <ActivityIndicator size="small" color={PALETTE.textMuted} />
                ) : (
                  <Text style={styles.legalBarLink}>{"Restore Purchases"}</Text>
                )}
              </Pressable>
              <Text style={styles.legalBarDot}>{"·"}</Text>
              <Pressable
                onPress={() => navigateToLegal('/terms')}
                disabled={loading}
                hitSlop={12}
                accessibilityRole="link"
                accessibilityLabel="Terms of Use"
                accessibilityState={{ disabled: loading }}
              >
                <Text style={styles.legalBarLink}>{"Terms"}</Text>
              </Pressable>
              <Text style={styles.legalBarDot}>{"·"}</Text>
              <Pressable
                onPress={() => navigateToLegal('/privacy')}
                disabled={loading}
                hitSlop={12}
                accessibilityRole="link"
                accessibilityLabel="Privacy Policy"
                accessibilityState={{ disabled: loading }}
              >
                <Text style={styles.legalBarLink}>{"Privacy"}</Text>
              </Pressable>
            </View>

            <Text style={styles.legalMicro}>
              {"Payment will be charged to your Apple ID account at confirmation of purchase. Subscription automatically renews unless canceled at least 24 hours before the end of the current period. Manage or cancel subscriptions in Settings → Apple ID → Subscriptions."}
            </Text>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PALETTE.bg,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  loadingText: {
    color: PALETTE.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  spacer: {
    flex: 1,
    minHeight: 64,
  },

  // ── Atmosphere (Extreme Subtlety) ──
  atmosphereLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  atmosphereOrb: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(255, 255, 255, 0.02)', // Barely-there highlight
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: PALETTE.glassSurface,
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Monumental Editorial Typography ──
  header: {
    marginBottom: 64,
    marginTop: 40,
  },
  premiumBadge: {
    fontSize: 12,
    fontWeight: '800',
    color: PALETTE.pureWhite,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    marginBottom: 24,
  },
  title: {
    fontSize: 52,
    fontWeight: '800',
    color: PALETTE.pureWhite,
    letterSpacing: -2,
    lineHeight: 56,
  },
  heroSubtitle: {
    fontSize: 18,
    fontWeight: '500',
    color: PALETTE.textMuted,
    lineHeight: 28,
    letterSpacing: 0.2,
    marginTop: 24,
  },

  // ── Exact Premium Unlocks ──
  unlockSection: {
    marginBottom: 56,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: PALETTE.pureWhite,
    letterSpacing: 0,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  sectionIntro: {
    fontSize: 16,
    color: PALETTE.textMuted,
    lineHeight: 24,
    marginBottom: 24,
    fontWeight: '500',
  },
  unlockRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.glassBorder,
  },
  unlockIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: PALETTE.glassSurface,
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  unlockText: {
    flex: 1,
  },
  unlockTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: PALETTE.pureWhite,
    marginBottom: 6,
    letterSpacing: 0,
  },
  unlockDesc: {
    fontSize: 15,
    color: PALETTE.textMuted,
    lineHeight: 22,
  },

  // ── Editorial Trust Block ──
  trustBlock: {
    marginBottom: 40,
  },
  trustLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: PALETTE.pureWhite,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  trustBody: {
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '500',
    color: PALETTE.textMuted,
    marginBottom: 16,
  },
  trustFootnote: {
    fontSize: 15,
    lineHeight: 24,
    color: PALETTE.textFaint,
  },

  // ── Pricing Cards (Minimalist Stark Architecture) ──
  pricingRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 48, // Pushed away from footer
  },
  pricingBadgePlaceholder: {
    height: 24,
    marginBottom: 16,
  },
  pricingCard: {
    flex: 1,
    paddingVertical: 36,
    paddingHorizontal: 16,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pricingCardSelected: {
    borderColor: PALETTE.pureWhite,
    backgroundColor: PALETTE.glassSurface,
  },
  bestValueBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: PALETTE.pureWhite, 
    marginBottom: 16,
  },
  bestValueBadgeMuted: {
    backgroundColor: PALETTE.glassBorder,
  },
  bestValueText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#000000', 
    letterSpacing: 1.5,
  },
  bestValueTextMuted: {
    color: PALETTE.textMuted,
  },
  pricingPeriod: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textMuted,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  pricingPeriodSelected: {
    color: PALETTE.pureWhite,
  },
  pricingPrice: {
    fontSize: 42,
    fontWeight: '800',
    color: PALETTE.textMuted,
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -1.5,
  },
  pricingPriceSelected: {
    color: PALETTE.pureWhite,
  },
  pricingMeta: {
    fontSize: 14,
    color: PALETTE.textFaint,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
    fontWeight: '500',
  },
  pricingMetaSelected: {
    color: PALETTE.textMuted,
  },

  // ── Flowing Footer (Replaces Sticky Bottom) ──
  footerContainer: {
    paddingTop: 32,
    borderTopWidth: 1,
    borderTopColor: PALETTE.glassBorder,
  },
  legalAgreement: {
    fontSize: 13,
    color: PALETTE.textMuted,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  legalAgreementLink: {
    color: PALETTE.pureWhite,
    fontWeight: '600',
  },
  
  // High-End Solid White Material CTA
  ctaButton: {
    width: '100%',
    borderRadius: 36,
    overflow: 'hidden',
  },
  ctaSolidBackground: {
    backgroundColor: PALETTE.pureWhite,
    paddingVertical: 22,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 68,
  },
  ctaText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: 0.5,
  },
  
  ctaHint: {
    marginTop: 24,
    fontSize: 14,
    lineHeight: 22,
    color: PALETTE.textMuted,
    textAlign: 'center',
    paddingHorizontal: 16,
    fontWeight: '500',
  },
  legalBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    gap: 16,
  },
  legalBarLink: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textMuted,
    letterSpacing: 0.5,
  },
  legalBarDot: {
    fontSize: 14,
    color: PALETTE.glassBorder,
  },
  legalMicro: {
    fontSize: 11,
    color: PALETTE.textFaint,
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 18,
    paddingHorizontal: 8,
  },

  // ── Active Premium State ──
  featureList: {
    marginBottom: 48,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 24,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.glassBorder,
  },
  featureIcon: {
    marginTop: 2,
  },
  featureInfo: {
    flex: 1,
  },
  featureName: {
    fontSize: 20,
    fontWeight: '700',
    color: PALETTE.pureWhite,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  featureDesc: {
    fontSize: 16,
    color: PALETTE.textMuted,
    lineHeight: 24,
  },
  manageText: {
    fontSize: 15,
    fontWeight: '600',
    color: PALETTE.pureWhite,
    textAlign: 'center',
    marginTop: 32,
    textDecorationLine: 'underline',
  },
});
