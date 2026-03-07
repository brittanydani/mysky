// File: app/onboarding/index.tsx
import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from '../../components/ui/SkiaGradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter, Href } from 'expo-router';

import { theme } from '../../constants/theme';
import { SkiaDynamicCosmos } from '../../components/ui/SkiaDynamicCosmos';
import SkiaMetallicPill from '../../components/ui/SkiaMetallicPill';

// ── Cinematic Palette ──
export const COLORS = {
  bg: '#020817',
  heading: theme.textPrimary,
  body: 'rgba(226,232,240,0.78)',

  goldBright: '#FDF3D7',
  goldText: theme.textGold,
  goldIcon: '#E3CFA4',
  goldMuted: theme.textGold,

  goldGradient1: '#FFF4D6',
  goldGradient2: '#E9D9B8',
  goldGradient3: '#C9AE78',
  goldGradient4: '#9B7A46',
  goldGradient5: '#6B532E',

  buttonText: '#020817',

  glassBorder: theme.cardBorder,
  glassHighlight: theme.glass.highlight,
};

const PALETTE = {
  gold: theme.textGold,
  textMain: theme.textPrimary,
  glassBorder: theme.cardBorder,
  glassHighlight: theme.glass.highlight,
};

export default function OnboardingWelcomeScreen() {
  const router = useRouter();

  const goNext = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    router.push('/onboarding/consent' as Href);
  }, [router]);

  const goRestore = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    // Consent first, then restore route is available from there too
    router.push('/onboarding/consent?mode=restore' as Href);
  }, [router]);

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos fill={COLORS.bg} />
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.delay(80).duration(700)} style={styles.top}>
            <Image
              source={require('../../assets/images/mysky_logo.png')}
              style={styles.logo}
              accessibilityLabel="MySky logo"
            />
            <Text style={styles.title}>Welcome to MySky</Text>
            <Text style={styles.subtitle}>Personal Growth, Mapped to You</Text>

            <Text style={styles.description}>
              Track your mood, sleep, and energy, journal your thoughts, and uncover personal patterns over time.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(240).duration(650)} style={styles.featuresContainer}>
            <LinearGradient 
                colors={[theme.cardGradientStart, theme.cardGradientEnd]} 
                style={styles.featuresGlass}
              >
              {[
                { icon: 'pencil', text: 'Daily journaling & guided reflection' },
                { icon: 'pulse', text: 'Mood, sleep & energy tracking' },
                { icon: 'analytics', text: 'Insights from your own data' },
                { icon: 'lock-closed', text: 'Private & encrypted — only on your device' },
              ].map((f, idx) => (
                <View key={idx} style={[styles.featureRow, idx === 3 && { marginBottom: 0 }]}>
                  <View style={styles.featureIcon}>
                    <Ionicons name={f.icon as any} size={20} color={theme.textGold} />
                  </View>
                  <Text style={styles.featureText}>{f.text}</Text>
                </View>
              ))}
            </LinearGradient>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(380).duration(650)} style={styles.cta}>
            <SkiaMetallicPill
              label="Get Started"
              onPress={goNext}
              style={{ marginBottom: 16 }}
            />

            <Pressable
              style={styles.secondaryButton}
              onPress={goRestore}
              accessibilityRole="button"
              accessibilityLabel="Restore from backup"
            >
              <Ionicons name="cloud-download-outline" size={14} color="rgba(201, 174, 120, 0.6)" />
              <Text style={styles.secondaryText}>Restore from Backup</Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  top: { alignItems: 'center', marginBottom: 24 },
  logo: { width: 220, height: 220, resizeMode: 'contain', alignSelf: 'center', marginBottom: 8 },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: theme.textPrimary,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    textAlign: 'center',
    letterSpacing: 0.5,
    marginTop: -64,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: theme.textGold,
    fontStyle: 'italic',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  
  featuresContainer: { marginBottom: 24 },
  featuresGlass: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    borderTopColor: theme.glass.highlight,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  featureText: {
    fontSize: 15,
    color: 'rgba(226,232,240,0.88)',
    flex: 1,
    lineHeight: 22,
  },
  
  cta: { alignItems: 'center' },
  
  
  
  
  
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  secondaryText: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(201, 174, 120, 0.6)',
    marginLeft: 6,
    letterSpacing: 0.3,
  },
});

