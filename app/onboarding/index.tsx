// File: app/onboarding/index.tsx
import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter, Href } from 'expo-router';

import { theme } from '../../constants/theme';
import { SkiaDynamicCosmos } from '../../components/ui/SkiaDynamicCosmos';

// ── Cinematic Palette ──
const PALETTE = {
  gold: '#C5B493',
  silverBlue: '#8BC4E8',
  textMain: '#FDFBF7',
  glassBorder: 'rgba(255,255,255,0.06)',
  glassHighlight: 'rgba(255,255,255,0.12)',
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
      <SkiaDynamicCosmos />
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.delay(80).duration(700)} style={styles.top}>
            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.logo}
              accessibilityLabel="MySky logo"
            />
            <Text style={styles.title}>Welcome to MySky</Text>
            <Text style={styles.subtitle}>Personal Growth, Mapped to You</Text>

            <Text style={styles.description}>
              Track your mood, sleep, and energy — journal your thoughts — and discover your patterns over time,
              guided by a framework built uniquely for you.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(240).duration(650)} style={styles.featuresContainer}>
            <LinearGradient 
              colors={['rgba(35, 40, 55, 0.4)', 'rgba(20, 24, 34, 0.7)']} 
              style={styles.featuresGlass}
            >
              {[
                { icon: 'pencil', text: 'Daily journaling & guided reflection' },
                { icon: 'pulse', text: 'Mood, sleep & energy tracking' },
                { icon: 'analytics', text: 'Pattern insights drawn from your own data' },
                { icon: 'lock-closed', text: 'Private & encrypted — only on your device' },
              ].map((f, idx) => (
                <View key={idx} style={[styles.featureRow, idx === 3 && { marginBottom: 0 }]}>
                  <View style={styles.featureIcon}>
                    <Ionicons name={f.icon as any} size={20} color={PALETTE.gold} />
                  </View>
                  <Text style={styles.featureText}>{f.text}</Text>
                </View>
              ))}
            </LinearGradient>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(380).duration(650)} style={styles.cta}>
            <Pressable
              style={({ pressed }) => [styles.ctaButton, pressed && styles.ctaPressed]}
              onPress={goNext}
              accessibilityRole="button"
              accessibilityLabel="Get started"
            >
              <LinearGradient
                colors={['#FFF4D4', '#C5B493', '#8B6508']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.ctaGradient}
              >
                <Text style={styles.ctaText}>Get Started</Text>
                <Ionicons name="arrow-forward" size={20} color="#1A1A1A" />
              </LinearGradient>
            </Pressable>

            <Pressable
              style={styles.secondaryButton}
              onPress={goRestore}
              accessibilityRole="button"
              accessibilityLabel="Restore from backup"
            >
              <Ionicons name="cloud-download-outline" size={16} color={PALETTE.gold} />
              <Text style={styles.secondaryText}>Restore from Backup</Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07090F' },
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  top: { alignItems: 'center', marginBottom: 32 },
  logo: { 
    width: 220, 
    height: 220, 
    resizeMode: 'contain', 
    alignSelf: 'center', 
    marginBottom: -10, // Adjusted to pull title closer to the asset
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: PALETTE.textMain,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: PALETTE.gold,
    fontStyle: 'italic',
    marginTop: 8,
    marginBottom: 24,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  
  featuresContainer: { marginBottom: 32 },
  featuresGlass: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
    borderTopColor: PALETTE.glassHighlight,
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
    backgroundColor: 'rgba(197, 180, 147, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureText: { 
    fontSize: 15, 
    color: theme.textSecondary, 
    flex: 1,
    lineHeight: 22,
  },
  
  cta: { alignItems: 'center' },
  ctaButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: PALETTE.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  ctaPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  ctaText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    marginRight: 8,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(197, 180, 147, 0.2)',
    backgroundColor: 'rgba(197, 180, 147, 0.05)',
  },
  secondaryText: { 
    fontSize: 14, 
    fontWeight: '600',
    color: PALETTE.gold, 
    marginLeft: 8,
  },
});

