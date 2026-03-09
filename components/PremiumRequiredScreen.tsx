import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { SkiaGradient as LinearGradient } from './ui/SkiaGradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { theme } from '../constants/theme';
import { useRouter, Href } from 'expo-router';
import SkiaMetallicPill from './ui/SkiaMetallicPill';

interface PremiumRequiredScreenProps {
  feature?: string;
  teaser?: string;
}

// ── Cinematic Palette ──
const PALETTE = {
  gold: '#C9AE78',
  silverBlue: '#8BC4E8',
  textMain: '#F0EAD6',
  glassBorder: 'rgba(255,255,255,0.06)',
  glassHighlight: 'rgba(255,255,255,0.12)',
};

const PREVIEW_PERKS = [
  { icon: 'moon-outline' as const, text: 'Encrypted dream journal & sleep cycles' },
  { icon: 'analytics-outline' as const, text: 'Deep mood & behavioral trend mapping' },
  { icon: 'sparkles-outline' as const, text: 'Personalized guidance & action steps' },
  { icon: 'people-outline' as const, text: 'Unlimited relationship depth mapping' },
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
      router.replace('/(tabs)/home' as Href);
    }
  };

  return (
    <View style={styles.container}>
      {/* Hero section */}
      <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.heroSection}>
        <View style={styles.iconGlow}>
          <Ionicons name="telescope-outline" size={32} color={PALETTE.gold} />
        </View>
        <Text style={styles.title}>
          {feature ? `Unlock ${feature}` : 'Ascend Deeper'}
        </Text>
        <Text style={styles.description}>
          {teaser ||
            'Explore the planetary patterns and behavioral cycles uniquely shaping your experience.'}
        </Text>
      </Animated.View>

      {/* Glassmorphic Perks Card */}
      <Animated.View entering={FadeInDown.delay(250).duration(600)} style={styles.perksCard}>
        <LinearGradient 
          colors={['rgba(14,24,48,0.40)', 'rgba(2,8,23,0.60)']} 
          style={styles.perksGradient}
        >
          {PREVIEW_PERKS.map((perk, i) => (
            <Animated.View
              key={perk.text}
              entering={FadeInDown.delay(350 + i * 80).duration(400)}
              style={styles.perkRow}
            >
              <View style={styles.perkIconContainer}>
                <Ionicons name={perk.icon} size={16} color={PALETTE.silverBlue} />
              </View>
              <Text style={styles.perkText}>{perk.text}</Text>
            </Animated.View>
          ))}
        </LinearGradient>
      </Animated.View>

      {/* CTA Section */}
      <Animated.View entering={FadeInDown.delay(700).duration(600)} style={styles.ctaSection}>
        <SkiaMetallicPill
          label="View Subscription Plans"
          onPress={() => router.push('/(tabs)/premium' as Href)}
          icon={<Ionicons name="arrow-forward" size={18} color="#020817" />}
        />

        <Text style={styles.priceHint}>From $4.99/mo • Private & Secure</Text>

        <View style={styles.legalLinks}>
          <Pressable onPress={() => router.push('/terms' as Href)} hitSlop={12}>
            <Text style={styles.legalLink}>Terms</Text>
          </Pressable>
          <Text style={styles.legalSeparator}>•</Text>
          <Pressable onPress={() => router.push('/privacy' as Href)} hitSlop={12}>
            <Text style={styles.legalLink}>Privacy</Text>
          </Pressable>
        </View>

        <Pressable
          style={styles.skipButton}
          onPress={safeGoBack}
          accessibilityRole="button"
          accessibilityLabel="Dismiss and go back"
        >
          <Text style={styles.skipButtonText}>Maybe later</Text>
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
    backgroundColor: '#020817',
    padding: 24,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconGlow: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(232,214,174,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    color: PALETTE.textMain,
    marginBottom: 12,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 15,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
    fontStyle: 'italic',
  },
  perksCard: {
    width: '100%',
    marginBottom: 32,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
    borderTopColor: PALETTE.glassHighlight,
  },
  perksGradient: {
    padding: 20,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 10,
  },
  perkIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(139, 196, 232, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 196, 232, 0.15)',
  },
  perkText: {
    color: PALETTE.textMain,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  ctaSection: {
    width: '100%',
    alignItems: 'center',
  },
  ctaButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  ctaText: {
    color: '#020817',
    fontWeight: '700',
    fontSize: 16,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  },
  priceHint: {
    color: theme.textMuted,
    fontSize: 13,
    marginTop: 14,
    fontStyle: 'italic',
  },
  skipButton: {
    marginTop: 20,
    paddingVertical: 10,
  },
  skipButtonText: {
    color: theme.textMuted,
    fontWeight: '600',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  legalLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  legalLink: {
    fontSize: 12,
    color: PALETTE.silverBlue,
    opacity: 0.8,
  },
  legalSeparator: {
    fontSize: 12,
    color: theme.textMuted,
  },
});
