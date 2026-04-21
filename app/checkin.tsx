// File: app/checkin.tsx
// MySky — Check In Hub (root-level modal)
//
// Updated to "Lunar Sky" & "Smoked Glass" Aesthetic:
// 1. Purged legacy palette constants.
// 2. Implemented Smoked Glass architecture for navigation pathways.
// 3. Integrated "Velvet Glass" 1px directional light-catch borders.
// 4. Machado-style close button logic.

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
import { type AppTheme } from '../constants/theme';
import { useAppTheme, useThemedStyles } from '../context/ThemeContext';

export default function CheckInHub() {
  const router = useRouter();
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const nav = (route: Href) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    router.push(route);
  };

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />

      {/* Nebula depth — atmospheric glow orbs */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={[styles.glowOrb, { top: -60, right: -60, backgroundColor: 'rgba(162, 194, 225, 0.12)' }]} />
        <View style={[styles.glowOrb, { bottom: 160, left: -120, backgroundColor: 'rgba(168, 139, 235, 0.06)' }]} />
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
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Ionicons name="close-outline" size={22} color="#FFFFFF" />
              </Pressable>
            </View>
          </Animated.View>

          {/* ── Inner World (Atmosphere Blue) ── */}
          <Animated.View entering={FadeInDown.delay(160)} style={styles.section}>
            <SectionHeader label="INNER WORLD" icon="sparkles" />
            <Pressable
              onPress={() => nav('/daily-reflection' as Href)}
              style={({ pressed }) => [pressed && styles.pressableActive]}
            >
              <View style={[styles.entryCard, theme.velvetBorder]}>
                <LinearGradient
                  colors={['rgba(162, 194, 225, 0.20)', 'rgba(162, 194, 225, 0.05)']}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.iconRing}>
                  <MetallicIcon name="sparkles" size={24} variant="gold" />
                </View>
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>Today&apos;s Questions</Text>
                  <Text style={styles.cardDescription}>Guided identity prompts to record your core shifts.</Text>
                </View>
                <Ionicons name="chevron-forward-outline" size={18} color="rgba(255,255,255,0.4)" />
              </View>
            </Pressable>
          </Animated.View>

          {/* ── Daily Resonance (Sage Green) ── */}
          <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
            <SectionHeader label="DAILY RESONANCE" icon="pulse-outline" />
            <Pressable
              onPress={() => nav('/(tabs)/internal-weather' as Href)}
              style={({ pressed }) => [pressed && styles.pressableActive]}
            >
              <View style={[styles.entryCard, theme.velvetBorder]}>
                <LinearGradient
                  colors={['rgba(107, 144, 128, 0.20)', 'rgba(107, 144, 128, 0.05)']}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.iconRing}>
                  <MetallicIcon name="pulse-outline" size={26} variant="gold" />
                </View>
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>Mood & Energy</Text>
                  <Text style={styles.cardDescription}>Sync your current emotional and somatic weather.</Text>
                </View>
                <Ionicons name="chevron-forward-outline" size={18} color="rgba(255,255,255,0.4)" />
              </View>
            </Pressable>
          </Animated.View>

          {/* ── Rest Log (Nebula Purple) ── */}
          <Animated.View entering={FadeInDown.delay(280)} style={styles.section}>
            <SectionHeader label="REST LOG" icon="moon-outline" />
            <Pressable
              onPress={() => nav('/(tabs)/sleep' as Href)}
              style={({ pressed }) => [pressed && styles.pressableActive]}
            >
              <View style={[styles.entryCard, theme.velvetBorder]}>
                <LinearGradient
                  colors={['rgba(168, 139, 235, 0.20)', 'rgba(168, 139, 235, 0.05)']}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.iconRing}>
                  <MetallicIcon name="moon-outline" size={24} variant="gold" />
                </View>
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>Sleep & Dreams</Text>
                  <Text style={styles.cardDescription}>Capture rest quality and subconscious imagery.</Text>
                </View>
                <Ionicons name="chevron-forward-outline" size={18} color="rgba(255,255,255,0.4)" />
              </View>
            </Pressable>
          </Animated.View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const SectionHeader = ({ icon, label }: { icon: any; label: string }) => {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.sectionHeaderWrap}>
      <View style={styles.sectionHeaderRow}>
        <MetallicIcon name={icon} size={18} variant="gold" />
        <MetallicText style={styles.sectionHeaderLabel} variant="gold">{label}</MetallicText>
      </View>
    </View>
  );
};

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  safeArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 140 },
  glowOrb: { position: 'absolute', width: 320, height: 320, borderRadius: 160, opacity: 0.6 },
  header: { marginBottom: 28 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  closeButton: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', marginTop: 4,
  },
  title: { fontSize: 32, fontWeight: '800', color: theme.textPrimary, letterSpacing: -1, marginBottom: 4, maxWidth: '88%' },
  subtitle: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },
  section: { marginBottom: 0 },
  sectionHeaderWrap: { marginBottom: 20, marginTop: 8 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionHeaderLabel: { fontSize: 14, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  entryCard: {
    flexDirection: 'row', alignItems: 'center', padding: 24, borderRadius: 24,
    marginBottom: 32, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.08)',
  },
  pressableActive: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  iconRing: {
    width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', marginRight: 16,
  },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: theme.textPrimary, marginBottom: 6 },
  cardDescription: { fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 20 },
});
