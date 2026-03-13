// File: app/(tabs)/checkin.tsx
// MySky — Check In Hub

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from '../../components/ui/SkiaGradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Href } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { SkiaDynamicCosmos } from '../../components/ui/SkiaDynamicCosmos';
import { LiquidCheckInHub } from '../../components/ui/LiquidCheckInHub';

const { width } = Dimensions.get('window');

const PALETTE = {
  gold: '#D4B872',
  silverBlue: '#8BC4E8',
  amethyst: '#9D76C1',
  bg: '#0A0A0C',
  textMain: '#FFFFFF',
  textMuted: 'rgba(255,255,255,0.45)',
  glassBorder: 'rgba(255,255,255,0.08)',
};

export default function CheckInScreen() {
  const router = useRouter();

  const nav = (route: Href) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    router.push(route);
  };

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.content}>

          {/* ── Somatic Entry Point ── */}
          <Animated.View entering={FadeIn.duration(1000)} style={styles.orbWrapper}>
            <LiquidCheckInHub />
          </Animated.View>

          {/* ── Header ── */}
          <Animated.View entering={FadeInDown.delay(100).duration(800)} style={styles.header}>
            <Text style={styles.title}>Check In</Text>
            <Text style={styles.subtitle}>Align your internal weather</Text>
          </Animated.View>

          {/* ── Mood & Energy (Primary Action) ── */}
          <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.cardWrapper}>
            <Pressable
              onPress={() => nav('/(tabs)/mood' as Href)}
              style={({ pressed }) => [styles.pressable, pressed && styles.pressableActive]}
            >
              <LinearGradient
                colors={['rgba(212, 184, 114, 0.12)', 'rgba(10, 10, 12, 0.8)']}
                style={styles.card}
              >
                <View style={[styles.iconRing, { borderColor: PALETTE.gold + '40' }]}>
                  <Ionicons name="sparkles-outline" size={26} color={PALETTE.gold} />
                </View>
                <View style={styles.cardText}>
                  <Text style={styles.cardEyebrow}>Daily Resonance</Text>
                  <Text style={styles.cardTitle}>Mood & Energy</Text>
                  <Text style={styles.cardDescription}>Sync your current emotional and physical state.</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={PALETTE.textMuted} />
              </LinearGradient>
            </Pressable>
          </Animated.View>

          {/* ── Sleep & Dreams (Secondary Action) ── */}
          <Animated.View entering={FadeInDown.delay(450).duration(600)} style={styles.cardWrapper}>
            <Pressable
              onPress={() => nav('/(tabs)/sleep' as Href)}
              style={({ pressed }) => [styles.pressable, pressed && styles.pressableActive]}
            >
              <LinearGradient
                colors={['rgba(157, 118, 193, 0.1)', 'rgba(10, 10, 12, 0.8)']}
                style={styles.card}
              >
                <View style={[styles.iconRing, { borderColor: PALETTE.amethyst + '40' }]}>
                  <Ionicons name="moon-outline" size={24} color={PALETTE.amethyst} />
                </View>
                <View style={styles.cardText}>
                  <Text style={styles.cardEyebrow}>Nightly Archive</Text>
                  <Text style={styles.cardTitle}>Sleep & Dreams</Text>
                  <Text style={styles.cardDescription}>Log rest quality and capture subconscious imagery.</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={PALETTE.textMuted} />
              </LinearGradient>
            </Pressable>
          </Animated.View>

          {/* ── Footer Nudge ── */}
          <Animated.View entering={FadeInDown.delay(600).duration(600)} style={styles.footer}>
            <Text style={styles.footerText}>Self-awareness is a ritual, not a chore.</Text>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PALETTE.bg,
  },
  safeArea: {
    flex: 1,
  },
  orbWrapper: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: PALETTE.textMain,
    letterSpacing: -0.5,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  },
  subtitle: {
    fontSize: 14,
    color: PALETTE.textMuted,
    marginTop: 4,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  cardWrapper: {
    borderRadius: 24,
    marginBottom: 16,
    overflow: 'hidden',
  },
  pressable: {
    borderRadius: 24,
  },
  pressableActive: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
    borderRadius: 24,
  },
  iconRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginRight: 20,
  },
  cardText: {
    flex: 1,
  },
  cardEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: PALETTE.gold,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: PALETTE.textMain,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    color: PALETTE.textMuted,
    lineHeight: 18,
  },
  footer: {
    marginTop: 'auto',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: 'rgba(255,255,255,0.25)',
  },
});
