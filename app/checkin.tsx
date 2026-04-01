// File: app/checkin.tsx
// MySky — Check In Hub (root-level modal)
// Slides up over the Tab Bar as a dedicated logging gateway.

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from '../components/ui/SkiaGradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Href } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { SkiaDynamicCosmos } from '../components/ui/SkiaDynamicCosmos';
import { MetallicText } from '../components/ui/MetallicText';
import { MetallicIcon } from '../components/ui/MetallicIcon';
import { GoldSubtitle } from '../components/ui/GoldSubtitle';

const PALETTE = {
  gold: '#D4B872',
  silverBlue: '#8BC4E8',
  amethyst: '#9D76C1',
  bg: '#0A0A0C',
  textMain: '#FFFFFF',
  textMuted: 'rgba(255,255,255,0.45)',
  glassBorder: 'rgba(255,255,255,0.08)',
};

export default function CheckInHub() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const nav = (route: Href) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    router.push(route);
  };

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />

      <View style={[styles.content, { paddingBottom: insets.bottom + 32 }]}>

        {/* ── Drag Handle & Header ── */}
        <Animated.View entering={FadeIn.duration(600)} style={styles.header}>
          <View style={styles.dragHandle} />
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Log Entry</Text>
            <GoldSubtitle style={styles.subtitle}>Select your reflection pathway</GoldSubtitle>
          </View>
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
              <View style={[styles.iconRing, { borderColor: PALETTE.gold + '40', backgroundColor: PALETTE.gold + '10' }]}>
                <MetallicIcon name="sparkles-outline" size={26} color={PALETTE.gold} />
              </View>
              <View style={styles.cardText}>
                <MetallicText style={styles.cardEyebrow} color={PALETTE.gold}>Daily Resonance</MetallicText>
                <Text style={styles.cardTitle}>Mood & Energy</Text>
                <Text style={styles.cardDescription}>Sync your current emotional and physical state.</Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={18} color={PALETTE.textMuted} />
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
              <View style={[styles.iconRing, { borderColor: PALETTE.amethyst + '40', backgroundColor: PALETTE.amethyst + '10' }]}>
                <MetallicIcon name="moon-outline" size={24} color={PALETTE.amethyst} />
              </View>
              <View style={styles.cardText}>
                <MetallicText style={styles.cardEyebrow} color={PALETTE.amethyst}>Rest Log</MetallicText>
                <Text style={styles.cardTitle}>Sleep & Dreams</Text>
                <Text style={styles.cardDescription}>Log rest quality and capture subconscious imagery.</Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={18} color={PALETTE.textMuted} />
            </LinearGradient>
          </Pressable>
        </Animated.View>

        {/* ── Close Button ── */}
        <Animated.View entering={FadeInDown.delay(600).duration(600)} style={styles.closeWrapper}>
          <Pressable
            style={styles.closeButton}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              router.back();
            }}
          >
            <Text style={styles.closeButtonText}>Cancel</Text>
          </Pressable>
        </Animated.View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PALETTE.bg,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  header: {
    alignItems: 'center',
    paddingBottom: 8,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    marginBottom: 28,
  },
  titleContainer: {
    width: '100%',
    marginTop: 16,
  },
  title: {
    fontSize: 34,
    color: PALETTE.textMain,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 32,
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
  closeWrapper: {
    marginTop: 'auto',
  },
  closeButton: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  closeButtonText: {
    color: PALETTE.textMain,
    fontSize: 16,
    fontWeight: '600',
  },
});
