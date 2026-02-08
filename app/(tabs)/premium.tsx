import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Href } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { theme } from '../../constants/theme';
import StarField from '../../components/ui/StarField';
import PricingCard from '../../components/ui/PricingCard';
import { usePremium } from '../../context/PremiumContext';
import { config } from '../../constants/config';
import { DEEPER_SKY_FEATURES } from '../../services/premium/deeperSkyFeatures';

export default function PremiumScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isPremium, isReady, offerings, purchase, restore, loading } = usePremium();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  const handleSelectPackage = (packageId: string) => {
    Haptics.selectionAsync();
    setSelectedPackage(packageId);
  };

  const handlePurchase = async () => {
    if (!offerings || !selectedPackage) {
      Alert.alert('Error', 'No package selected or offerings not available');
      return;
    }

    const packageToPurchase = offerings.availablePackages.find(
      pkg => pkg.identifier === selectedPackage
    );

    if (!packageToPurchase) {
      Alert.alert('Error', 'Selected package not found');
      return;
    }

    Haptics.selectionAsync();
    
    const result = await purchase(packageToPurchase);
    
    if (result.success) {
      Alert.alert('Success!', 'Welcome to MySky Premium! 🌟');
    } else if (result.error && !result.userCancelled) {
      // Only show error alerts for actual errors, not user cancellation
      Alert.alert('Purchase Failed', result.error);
    }
    // If userCancelled is true, we silently return without showing an error
  };

  const handleRestore = async () => {
    Haptics.selectionAsync();
    
    const result = await restore();
    
    if (result.success) {
      Alert.alert('Restored!', 'Your purchases have been restored.');
    } else if (result.error) {
      Alert.alert('Restore Failed', result.error);
    }
  };

  // If user is already premium, show warm personal view
  if (isPremium) {
    return (
      <View style={styles.container}>
        <StarField starCount={50} />

        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: insets.bottom + 40 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Warm glowing header */}
            <Animated.View
              entering={FadeInDown.delay(100).duration(800)}
              style={styles.premiumHeader}
            >
              <View style={styles.premiumGlowOrb}>
                <Text style={styles.premiumOrbEmoji}>{'  '}</Text>
              </View>
              <Text style={styles.premiumHeadline}>Your sky is open.</Text>
              <Text style={styles.premiumSubtitle}>
                You chose to go deeper with yourself.{'\n'}That matters.
              </Text>
            </Animated.View>

            {/* Gentle affirmation card */}
            <Animated.View
              entering={FadeInDown.delay(300).duration(600)}
            >
              <LinearGradient
                colors={['rgba(201, 169, 98, 0.12)', 'rgba(201, 169, 98, 0.04)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.premiumAffirmationCard}
              >
                <Text style={styles.premiumAffirmationText}>
                  "The sky doesn't rush to reveal itself.{'\n'}Neither do you."
                </Text>
              </LinearGradient>
            </Animated.View>

            {/* Feature list with warm emojis */}
            <Animated.View
              entering={FadeInDown.delay(450).duration(600)}
              style={styles.premiumFeatureList}
            >
              <Text style={styles.premiumFeatureListLabel}>Everything in Deeper Sky</Text>
              {DEEPER_SKY_FEATURES.map((feature, index) => (
                <Animated.View
                  key={feature.id}
                  entering={FadeInDown.delay(500 + index * 60).duration(400)}
                  style={styles.premiumFeatureRow}
                >
                  <Ionicons name={feature.icon as any} size={16} color={theme.primary} style={{ opacity: 0.8 }} />
                  <Text style={styles.premiumFeatureRowName}>{feature.name}</Text>
                </Animated.View>
              ))}
            </Animated.View>

            {/* Footer */}
            <Animated.View
              entering={FadeInDown.delay(700).duration(600)}
              style={styles.premiumFooter}
            >
              <Pressable
                style={styles.manageButton}
                onPress={() => {
                  Alert.alert(
                    'Manage Subscription',
                    'To manage your subscription, go to your device settings:\n\niOS: Settings > Apple ID > Subscriptions\nAndroid: Play Store > Account > Subscriptions'
                  );
                }}
              >
                <Text style={styles.manageText}>Manage Subscription</Text>
              </Pressable>
            </Animated.View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StarField starCount={50} />
      
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View 
            entering={FadeInDown.delay(100).duration(600)}
            style={styles.header}
          >
            <Text style={styles.deeperSkyLabel}>✨ INTRODUCING ✨</Text>
            <Text style={styles.title}>Deeper Sky</Text>
            <Text style={styles.subtitle}>Know yourself more completely.</Text>
          </Animated.View>

          {/* Key Illustration */}
          <Animated.View 
            entering={FadeInDown.delay(200).duration(800)}
            style={styles.illustrationContainer}
          >
            <View style={styles.glowCircle}>
              <Image
                source={require('../../assets/images/premium-key.png')}
                style={styles.keyImage}
                contentFit="contain"
              />
            </View>
          </Animated.View>

          {/* Premium Features */}
          <Animated.View
            entering={FadeInDown.delay(300).duration(600)}
            style={styles.featuresContainer}
          >
            {DEEPER_SKY_FEATURES
              .filter(f => ['natal-story', 'relationships', 'healing', 'daily-guidance'].includes(f.id))
              .map((feature) => (
              <View key={feature.id} style={styles.featureRow}>
                <View style={styles.featureRowText}>
                  <Text style={styles.featureRowName}>{feature.name}</Text>
                  <Text style={styles.featureRowDescription}>{feature.description}</Text>
                </View>
              </View>
            ))}
            <View style={styles.featureRow}>
              <View style={styles.featureRowText}>
                <Text style={styles.featureRowName}>Encrypted Backup</Text>
                <Text style={styles.featureRowDescription}>Back up and restore your data securely</Text>
              </View>
            </View>
          </Animated.View>

          {/* Pricing Tiers */}
          <Animated.View 
            entering={FadeInDown.delay(500).duration(600)}
            style={styles.pricingContainer}
          >
            <Text style={styles.pricingTitle}>Choose Your Path</Text>
            
            {!isReady ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading pricing...</Text>
              </View>
            ) : offerings?.availablePackages ? (
              offerings.availablePackages.map((pkg) => (
                <PricingCard
                  key={pkg.identifier}
                  name={pkg.product.title}
                  price={pkg.product.priceString}
                  period={
                    (pkg.product as any).subscriptionPeriod?.unit
                      ? 'per ' + (pkg.product as any).subscriptionPeriod.unit
                      : pkg.identifier.includes('month')
                        ? 'per month'
                        : pkg.identifier.includes('annual') || pkg.identifier.includes('year')
                          ? 'per year'
                          : 'one time'
                  }
                  description={pkg.product.description}
                  popular={pkg.identifier.includes('annual') || pkg.identifier.includes('yearly')}
                  selected={selectedPackage === pkg.identifier}
                  onPress={() => handleSelectPackage(pkg.identifier)}
                />
              ))
            ) : (
              // Fallback to config pricing if RevenueCat not available
              config.premium.tiers.map((tier) => (
                <PricingCard
                  key={tier.id}
                  name={tier.name}
                  price={tier.price}
                  period={tier.period}
                  description={tier.description}
                  popular={tier.popular}
                  selected={selectedPackage === tier.id}
                  onPress={() => handleSelectPackage(tier.id)}
                />
              ))
            )}
          </Animated.View>

          {/* CTA Button */}
          <Animated.View 
            entering={FadeInUp.delay(600).duration(600)}
            style={styles.ctaContainer}
          >
            <Pressable
              style={({ pressed }) => [
                styles.ctaButton,
                pressed && styles.ctaPressed,
                (!selectedPackage || loading) && styles.ctaDisabled,
              ]}
              onPress={handlePurchase}
              disabled={!selectedPackage || loading}
            >
              <LinearGradient
                colors={['#E8D5A8', '#C9A962', '#B8994F']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.ctaGradient}
              >
                <Text style={styles.ctaTitle}>
                  {loading ? 'Processing...' : 'Continue with Deeper Sky'}
                </Text>
              </LinearGradient>
            </Pressable>

            <Pressable
              style={styles.restoreButton}
              onPress={handleRestore}
              disabled={loading}
            >
              <Text style={styles.restoreText}>Restore Purchases</Text>
            </Pressable>
            
            <Pressable
              style={styles.manageButton}
              onPress={() => {
                // Open device subscription settings
                Alert.alert(
                  'Manage Subscription',
                  'To manage your subscription, go to your device settings:\n\niOS: Settings > Apple ID > Subscriptions\nAndroid: Play Store > Account > Subscriptions'
                );
              }}
            >
              <Text style={styles.manageText}>Manage Subscription</Text>
            </Pressable>

            <Text style={styles.ctaDisclaimer}>
              Auto-renews. Cancel anytime in device settings.{'\n'}
              By subscribing, you agree to our{' '}
              <Text style={styles.legalLink} onPress={() => router.push('/terms' as Href)}>Terms</Text>
              {' & '}
              <Text style={styles.legalLink} onPress={() => router.push('/privacy' as Href)}>Privacy Policy</Text>.
            </Text>
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
  header: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    alignItems: 'center',
  },
  deeperSkyLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.primary,
    letterSpacing: 3,
    marginBottom: theme.spacing.sm,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: theme.textPrimary,
    fontFamily: 'serif',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: theme.textSecondary,
    marginTop: theme.spacing.xs,
    fontStyle: 'italic',
  },
  premiumHeader: {
    alignItems: 'center',
    marginTop: theme.spacing.xxl + 16,
    marginBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  premiumGlowOrb: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(201, 169, 98, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    ...theme.shadows.glow,
  },
  premiumOrbEmoji: {
    fontSize: 32,
  },
  premiumHeadline: {
    fontSize: 26,
    fontWeight: '700',
    color: theme.textPrimary,
    fontFamily: 'serif',
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  premiumSubtitle: {
    fontSize: 15,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  premiumAffirmationCard: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.xxl,
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 98, 0.15)',
    alignItems: 'center',
  },
  premiumAffirmationText: {
    fontSize: 16,
    color: theme.primary,
    fontStyle: 'italic',
    fontFamily: 'serif',
    textAlign: 'center',
    lineHeight: 26,
  },
  premiumFeatureList: {
    marginBottom: theme.spacing.xl,
  },
  premiumFeatureListLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  premiumFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  premiumFeatureRowName: {
    fontSize: 14,
    color: theme.textSecondary,
    marginLeft: theme.spacing.md,
  },
  premiumFooter: {
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  glowCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(201, 169, 98, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.glow,
  },
  keyImage: {
    width: 100,
    height: 100,
  },
  featuresContainer: {
    marginBottom: theme.spacing.xl,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.textPrimary,
    fontFamily: 'serif',
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  // Feature row styles (compact paywall list)
  featureRowIcon: {
    fontSize: 22,
    marginRight: theme.spacing.md,
    width: 28,
    textAlign: 'center',
  },
  featureRowText: {
    flex: 1,
  },
  featureRowName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.primary,
    fontFamily: 'serif',
  },
  featureRowDescription: {
    fontSize: 13,
    color: theme.textSecondary,
    lineHeight: 18,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  pricingContainer: {
    marginBottom: theme.spacing.xl,
  },
  pricingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  loadingContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: theme.textMuted,
  },
  ctaContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  ctaButton: {
    width: '100%',
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadows.glow,
  },
  ctaPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  ctaDisabled: {
    opacity: 0.6,
  },
  ctaGradient: {
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0D1421',
    fontFamily: 'serif',
  },
  restoreButton: {
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  restoreText: {
    fontSize: 14,
    color: theme.primary,
    textDecorationLine: 'underline',
  },
  ctaDisclaimer: {
    fontSize: 11,
    color: theme.textMuted,
    marginTop: theme.spacing.md,
    textAlign: 'center',
    lineHeight: 16,
  },
  legalLink: {
    fontSize: 12,
    color: theme.primary,
    textDecorationLine: 'underline',
  },
  manageButton: {
    marginTop: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  manageText: {
    fontSize: 14,
    color: theme.textSecondary,
    textDecorationLine: 'underline',
  },
});
