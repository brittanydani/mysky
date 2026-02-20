import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Href } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { theme } from '../constants/theme';
import StarField from './ui/StarField';
import PricingCard from './ui/PricingCard';
import { usePremium } from '../context/PremiumContext';
import { config } from '../constants/config';
import { DEEPER_SKY_FEATURES, DEEPER_SKY_MARKETING } from '../services/premium/deeperSkyFeatures';

type PlanType = 'monthly' | 'yearly' | 'lifetime';

interface PremiumScreenProps {
  onClose?: () => void;
}

export default function PremiumScreen({ onClose }: PremiumScreenProps = {}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isPremium, offerings, loading, purchase, restore } = usePremium();
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('yearly');
  const [restoring, setRestoring] = useState(false);

  const safeGoBack = useCallback(() => {
    if (onClose) {
      onClose();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/settings' as Href);
    }
  }, [router, onClose]);

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
    } else if (result.userCancelled) {
      // User cancelled — do nothing
    } else if (result.error) {
      Alert.alert('Purchase Failed', result.error);
    }
  }, [offerings, selectedPlan, purchase]);

  const handleRestore = useCallback(async () => {
    setRestoring(true);
    const result = await restore();
    setRestoring(false);

    if (result.success) {
      try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
      Alert.alert('Restored', 'Your purchases have been restored successfully.');
    } else {
      Alert.alert('Restore Failed', result.error || 'Could not restore purchases. Please try again.');
    }
  }, [restore]);

  // Already premium — show confirmation
  if (isPremium) {
    return (
      <View style={styles.container}>
        <StarField starCount={30} />
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}>
            <Pressable onPress={safeGoBack} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color={theme.textPrimary} />
            </Pressable>
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
                  <Ionicons name={feature.icon as any} size={20} color={theme.primary} />
                  <View style={styles.featureInfo}>
                    <Text style={styles.featureName}>{feature.name}</Text>
                    <Text style={styles.featureDesc}>{feature.premiumVersion}</Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={18} color={theme.primary} />
                </View>
              ))}
            </Animated.View>

            <Text style={styles.manageText}>
              Manage your subscription in Settings → Apple ID → Subscriptions
            </Text>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StarField starCount={30} />

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Back button */}
          <Pressable onPress={safeGoBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={theme.textPrimary} />
          </Pressable>

          {/* Header */}
          <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
            <Text style={styles.premiumBadge}>✦ {DEEPER_SKY_MARKETING.headline}</Text>
            <Text style={styles.title}>{DEEPER_SKY_MARKETING.subheadline}</Text>
            <Text style={styles.subtitle}>{DEEPER_SKY_MARKETING.tagline}</Text>
          </Animated.View>

          {/* Feature highlights */}
          <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.featureList}>
            {DEEPER_SKY_FEATURES.map((feature) => (
              <View key={feature.id} style={styles.featureItem}>
                <Ionicons name={feature.icon as any} size={20} color={theme.primary} />
                <View style={styles.featureInfo}>
                  <Text style={styles.featureName}>{feature.name}</Text>
                  <Text style={styles.featureDesc}>{feature.description}</Text>
                </View>
              </View>
            ))}
          </Animated.View>

          {/* Free vs Premium comparison */}
          <Animated.View entering={FadeInDown.delay(250).duration(600)} style={styles.comparisonSection}>
            <View style={styles.comparisonColumn}>
              <Text style={styles.comparisonHeader}>Free</Text>
              {config.premiumFeatures.free.map((feat, i) => (
                <View key={i} style={styles.comparisonRow}>
                  <Ionicons name="checkmark" size={14} color={theme.textMuted} />
                  <Text style={styles.comparisonText}>{feat}</Text>
                </View>
              ))}
            </View>
            <View style={[styles.comparisonColumn, styles.premiumColumn]}>
              <Text style={[styles.comparisonHeader, { color: theme.primary }]}>Deeper Sky</Text>
              {config.premiumFeatures.premium.map((feat, i) => (
                <View key={i} style={styles.comparisonRow}>
                  <Ionicons name="star" size={14} color={theme.primary} />
                  <Text style={[styles.comparisonText, { color: theme.textPrimary }]}>{feat}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Pricing Cards */}
          <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.pricingSection}>
            <Text style={styles.sectionTitle}>Choose Your Plan</Text>
            {config.premium.tiers.map((tier) => (
              <PricingCard
                key={tier.id}
                name={tier.name}
                price={tier.price}
                period={tier.period}
                description={tier.description}
                popular={tier.popular}
                selected={selectedPlan === tier.id}
                onPress={() => setSelectedPlan(tier.id as PlanType)}
              />
            ))}
          </Animated.View>

          {/* Purchase Button */}
          <Animated.View entering={FadeInUp.delay(400).duration(600)} style={styles.purchaseSection}>
            <Pressable
              onPress={handlePurchase}
              disabled={loading}
              style={({ pressed }) => [styles.purchaseButton, pressed && styles.purchaseButtonPressed]}
            >
              <LinearGradient
                colors={[theme.primary, theme.primaryDark]}
                style={styles.purchaseGradient}
              >
                {loading ? (
                  <ActivityIndicator color={theme.background} />
                ) : (
                  <Text style={styles.purchaseButtonText}>
                    Continue with {config.premium.tiers.find(t => t.id === selectedPlan)?.name}
                  </Text>
                )}
              </LinearGradient>
            </Pressable>

            <Pressable onPress={handleRestore} disabled={restoring} style={styles.restoreButton}>
              {restoring ? (
                <ActivityIndicator size="small" color={theme.textMuted} />
              ) : (
                <Text style={styles.restoreText}>Restore Purchases</Text>
              )}
            </Pressable>
          </Animated.View>

          {/* Legal links — required for App Store subscription compliance */}
          <Animated.View entering={FadeInDown.delay(420).duration(600)} style={styles.legalSection}>
            <Text style={styles.legalDisclosure}>
              Subscriptions automatically renew unless cancelled at least 24 hours before the end of the current period. Manage or cancel anytime in Settings → Apple ID → Subscriptions.
            </Text>
            <Text style={styles.legalDisclosure}>
              MySky is for self-reflection and personal insight only. It is not medical, psychological, or financial advice.
            </Text>
            <View style={styles.legalLinks}>
              <Pressable
                onPress={() => {
                  if (onClose) onClose();
                  setTimeout(() => router.push('/terms' as Href), 350);
                }}
                accessibilityRole="link"
                hitSlop={12}
                style={styles.legalLinkPressable}
              >
                <Text style={styles.legalLink}>Terms of Use</Text>
              </Pressable>
              <Text style={styles.legalSeparator}>·</Text>
              <Pressable
                onPress={() => {
                  if (onClose) onClose();
                  setTimeout(() => router.push('/privacy' as Href), 350);
                }}
                accessibilityRole="link"
                hitSlop={12}
                style={styles.legalLinkPressable}
              >
                <Text style={styles.legalLink}>Privacy Policy</Text>
              </Pressable>
            </View>
          </Animated.View>

          {/* Trust line */}
          <Animated.View entering={FadeInDown.delay(450).duration(600)} style={styles.trustSection}>
            <Text style={styles.trustText}>{DEEPER_SKY_MARKETING.trustLine}</Text>
          </Animated.View>
        </ScrollView>
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
    paddingHorizontal: theme.spacing.lg,
  },
  backButton: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  premiumBadge: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.primary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: theme.spacing.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.textPrimary,
    fontFamily: 'serif',
    letterSpacing: 0.3,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: theme.textSecondary,
    lineHeight: 22,
  },
  featureList: {
    marginBottom: theme.spacing.xl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  featureInfo: {
    flex: 1,
  },
  featureName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.textPrimary,
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 13,
    color: theme.textSecondary,
    lineHeight: 18,
  },
  comparisonSection: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  comparisonColumn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
  },
  premiumColumn: {
    backgroundColor: 'rgba(201, 169, 98, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 98, 0.2)',
  },
  comparisonHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: theme.spacing.sm,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 6,
  },
  comparisonText: {
    fontSize: 12,
    color: theme.textSecondary,
    lineHeight: 16,
    flex: 1,
  },
  pricingSection: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: theme.spacing.md,
  },
  purchaseSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  purchaseButton: {
    width: '100%',
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  purchaseButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  purchaseGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  purchaseButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.background,
  },
  restoreButton: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.sm,
  },
  restoreText: {
    fontSize: 14,
    color: theme.textMuted,
    textDecorationLine: 'underline',
  },
  trustSection: {
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    gap: 4,
  },
  trustText: {
    fontSize: 13,
    color: theme.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  manageText: {
    fontSize: 13,
    color: theme.textMuted,
    textAlign: 'center',
    marginTop: theme.spacing.xl,
    fontStyle: 'italic',
  },
  legalSection: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
    gap: 6,
  },
  legalDisclosure: {
    fontSize: 11,
    color: theme.textMuted,
    textAlign: 'center',
    lineHeight: 16,
    opacity: 0.7,
  },
  legalLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legalLinkPressable: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  legalLink: {
    fontSize: 13,
    color: theme.primary,
    textDecorationLine: 'underline',
  },
  legalSeparator: {
    fontSize: 12,
    color: theme.textMuted,
  },
});
