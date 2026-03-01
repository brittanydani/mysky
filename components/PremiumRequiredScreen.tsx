import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { theme } from '../constants/theme';
import { useRouter, Href } from 'expo-router';

interface PremiumRequiredScreenProps {
  /** Short contextual label for what the user tried to access */
  feature?: string;
  /** What the user will get with premium — specific to this screen */
  teaser?: string;
}

const PREVIEW_PERKS = [
  { icon: 'moon' as const, text: 'Encrypted dream journal with sleep entries' },
  { icon: 'analytics' as const, text: 'Sleep & mood trend charts over time' },
  { icon: 'journal' as const, text: 'Behavioral patterns from your writing' },
  { icon: 'people' as const, text: 'Unlimited relationship profiles' },
];

export default function PremiumRequiredScreen({
  feature,
  teaser,
}: PremiumRequiredScreenProps = {}) {
  const router = useRouter();

  const safeGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/settings' as Href);
    }
  };

  return (
    <View style={styles.container}>
      {/* Hero section */}
      <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.heroSection}>
        <View style={styles.iconGlow}>
          <Ionicons name="sparkles" size={32} color={theme.primary} />
        </View>
        <Text style={styles.title}>
          {feature ? `Unlock ${feature}` : 'Go Deeper'}
        </Text>
        <Text style={styles.description}>
          {teaser ||
            'Go deeper with your data — encrypted dream journal, sleep & mood trends, behavioral patterns, and healing insights designed just for you.'}
        </Text>
      </Animated.View>

      {/* What's included preview */}
      <Animated.View entering={FadeInDown.delay(250).duration(500)} style={styles.perksSection}>
        {PREVIEW_PERKS.map((perk, i) => (
          <Animated.View
            key={perk.text}
            entering={FadeInDown.delay(300 + i * 80).duration(400)}
            style={styles.perkRow}
          >
            <View style={styles.perkIcon}>
              <Ionicons name={perk.icon} size={16} color={theme.primary} />
            </View>
            <Text style={styles.perkText}>{perk.text}</Text>
          </Animated.View>
        ))}
      </Animated.View>

      {/* CTA */}
      <Animated.View entering={FadeInDown.delay(600).duration(500)} style={styles.ctaSection}>
        <Pressable
          onPress={() => router.push('/(tabs)/premium' as Href)}
          accessibilityRole="button"
          accessibilityLabel="See Deeper Sky plans"
        >
          <LinearGradient
            colors={[theme.primary, theme.primaryDark]}
            style={styles.upgradeButton}
          >
            <Ionicons name="sparkles" size={16} color={theme.background} />
            <Text style={styles.upgradeButtonText}>See Deeper Sky Plans</Text>
          </LinearGradient>
        </Pressable>

        <Text style={styles.priceHint}>Starting at $4.99/mo · Cancel anytime</Text>

        <Pressable style={styles.button} onPress={safeGoBack} accessibilityRole="button" accessibilityLabel="Go back">
          <Text style={styles.buttonText}>Not now</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.background,
    padding: 32,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  iconGlow: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(201, 169, 98, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 98, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 10,
    fontFamily: 'serif',
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  perksSection: {
    width: '100%',
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  perkIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(201, 169, 98, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  perkText: {
    color: theme.textSecondary,
    fontSize: 14,
    flex: 1,
  },
  ctaSection: {
    width: '100%',
    alignItems: 'center',
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: 15,
    paddingHorizontal: 40,
    width: '100%',
  },
  upgradeButtonText: {
    color: theme.background,
    fontWeight: '700',
    fontSize: 16,
  },
  priceHint: {
    color: theme.textMuted,
    fontSize: 12,
    marginTop: 10,
    fontStyle: 'italic',
  },
  button: {
    borderRadius: theme.borderRadius.lg,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginTop: 8,
  },
  buttonText: {
    color: theme.textMuted,
    fontWeight: '500',
    fontSize: 14,
  },
});
