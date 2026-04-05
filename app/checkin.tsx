// File: app/checkin.tsx
// MySky — Check In Hub (root-level modal)
// Slides up over the Tab Bar as a dedicated logging gateway.

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from '../components/ui/SkiaGradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Href } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { SkiaDynamicCosmos } from '../components/ui/SkiaDynamicCosmos';
import { MetallicText } from '../components/ui/MetallicText';
import { MetallicIcon } from '../components/ui/MetallicIcon';
import { GoldSubtitle } from '../components/ui/GoldSubtitle';

const PALETTE = {
  gold: '#D4B872',
  silverBlue: '#C9AE78',
  amethyst: '#9D76C1',
  bg: '#020817',
  textMain: '#FFFFFF',
  textMuted: 'rgba(226,232,240,0.45)',
  glassBorder: 'rgba(255,255,255,0.06)',
};

export default function CheckInHub() {
  const router = useRouter();

  const nav = (route: Href) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    router.push(route);
  };

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />

      {/* Nebula depth — atmospheric glow orbs */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={[styles.glowOrb, { top: -60, right: -60, backgroundColor: 'rgba(110, 140, 180, 0.12)' }]} />
        <View style={[styles.glowOrb, { bottom: 160, left: -120, backgroundColor: 'rgba(217, 191, 140, 0.06)' }]} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

          {/* ── Header ── */}
          <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
            <View style={styles.headerRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Log Entry</Text>
                <GoldSubtitle style={styles.subtitle}>Select your reflection pathway</GoldSubtitle>
              </View>
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  router.back();
                }}
                style={styles.closeButton}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Ionicons name="close-outline" size={22} color={PALETTE.textMuted} />
              </Pressable>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(160)} style={styles.section}>
            <SectionHeader label="INNER WORLD" icon="sparkles" />
            <Pressable
              onPress={() => nav('/daily-reflection' as Href)}
              style={({ pressed }) => [pressed && styles.pressableActive]}
            >
              <LinearGradient
                colors={['rgba(201, 174, 120, 0.12)', 'rgba(10, 10, 12, 0.8)']}
                style={styles.entryCard}
              >
                <View style={[styles.iconRing, { borderColor: PALETTE.silverBlue + '40', backgroundColor: PALETTE.silverBlue + '10' }]}>
                  <MetallicIcon name="sparkles" size={24} color={PALETTE.silverBlue} />
                </View>
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>Today&apos;s Questions</Text>
                  <Text style={styles.cardDescription}>Open your daily guided reflection prompts and seal each category.</Text>
                </View>
                <Ionicons name="chevron-forward-outline" size={18} color={PALETTE.textMuted} />
              </LinearGradient>
            </Pressable>
          </Animated.View>

          {/* ── Mood & Energy ── */}
          <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
            <SectionHeader label="DAILY RESONANCE" icon="sparkles-outline" />
            <Pressable
              onPress={() => nav('/(tabs)/internal-weather' as Href)}
              style={({ pressed }) => [pressed && styles.pressableActive]}
            >
              <LinearGradient
                colors={['rgba(212, 184, 114, 0.12)', 'rgba(10, 10, 12, 0.8)']}
                style={styles.entryCard}
              >
                <View style={[styles.iconRing, { borderColor: PALETTE.gold + '40', backgroundColor: PALETTE.gold + '10' }]}>
                  <MetallicIcon name="sparkles-outline" size={26} color={PALETTE.gold} />
                </View>
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>Mood & Energy</Text>
                  <Text style={styles.cardDescription}>Sync your current emotional and physical state.</Text>
                </View>
                <Ionicons name="chevron-forward-outline" size={18} color={PALETTE.textMuted} />
              </LinearGradient>
            </Pressable>
          </Animated.View>

          {/* ── Sleep & Dreams ── */}
          <Animated.View entering={FadeInDown.delay(280)} style={styles.section}>
            <SectionHeader label="REST LOG" icon="moon-outline" />
            <Pressable
              onPress={() => nav('/(tabs)/sleep' as Href)}
              style={({ pressed }) => [pressed && styles.pressableActive]}
            >
              <LinearGradient
                colors={['rgba(157, 118, 193, 0.1)', 'rgba(10, 10, 12, 0.8)']}
                style={styles.entryCard}
              >
                <View style={[styles.iconRing, { borderColor: PALETTE.amethyst + '40', backgroundColor: PALETTE.amethyst + '10' }]}>
                  <MetallicIcon name="moon-outline" size={24} color={PALETTE.amethyst} />
                </View>
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>Sleep & Dreams</Text>
                  <Text style={styles.cardDescription}>Log rest quality and capture subconscious imagery.</Text>
                </View>
                <Ionicons name="chevron-forward-outline" size={18} color={PALETTE.textMuted} />
              </LinearGradient>
            </Pressable>
          </Animated.View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const SectionHeader = ({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) => (
  <View style={styles.sectionHeaderWrap}>
    <View style={styles.sectionHeaderRow}>
      <MetallicIcon name={icon} size={18} variant="gold" />
      <MetallicText style={styles.sectionHeaderLabel} variant="gold">{label}</MetallicText>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020817' },
  safeArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 140 },
  glowOrb: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    opacity: 0.6,
  },
  header: { marginBottom: 32 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  title: { fontSize: 34, fontWeight: '800', color: PALETTE.textMain, letterSpacing: -0.5, marginBottom: 4 },
  subtitle: { fontSize: 12, fontStyle: 'normal', fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)' },
  section: { marginBottom: 0 },
  sectionHeaderWrap: { marginBottom: 20, marginTop: 8 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionHeaderLabel: { fontSize: 19, fontWeight: '700', color: '#FFFFFF' },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 28,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
    marginBottom: 32,
  },
  pressableActive: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
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
  cardText: { flex: 1 },
  cardTitle: { fontSize: 20, fontWeight: '700', color: PALETTE.textMain, marginBottom: 4 },
  cardDescription: { fontSize: 13, color: PALETTE.textMuted, lineHeight: 18 },
});
