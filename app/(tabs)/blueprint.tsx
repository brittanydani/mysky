// File: app/(tabs)/blueprint.tsx
// MySky — Blueprint Hub
//
// Identity hub. Four entry cards expose the natal chart, life narrative,
// relationships, and healing tools. Shows the user's chart name in the header
// when available, falling back gracefully to a generic label.

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from '../../components/ui/SkiaGradient';
import { useRouter, Href } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/core';
import * as Haptics from 'expo-haptics';

import { SkiaDynamicCosmos } from '../../components/ui/SkiaDynamicCosmos';
import { localDb } from '../../services/storage/localDb';
import { EncryptedAsyncStorage } from '../../services/storage/encryptedAsyncStorage';
import { usePremium } from '../../context/PremiumContext';
import { logger } from '../../utils/logger';
import { GoldSubtitle } from '../../components/ui/GoldSubtitle';
import { MetallicText } from '../../components/ui/MetallicText';
import { PremiumSegmentedControl } from '../../components/ui/PremiumSegmentedControl';
import { EnergyScrollContent } from '../../components/screens/EnergyScrollContent';

const PALETTE = {
  gold: '#C9AE78',
  silverBlue: '#C9AE78',
  rose: '#D4A3B3',
  sage: '#8CBEAA',
  lavender: '#A89BC8',
  emerald: '#C9AE78',
  textMain: '#FFFFFF',
  textMuted: 'rgba(255,255,255,0.6)',
  glassBorder: 'rgba(255,255,255,0.08)',
};

interface BlueprintCard {
  title: string;
  description: string;
  icon: string;
  iconStyle: TextStyle;
  gradientColors: [string, string];
  route: Href;
  premium?: boolean;
}

const CARDS: BlueprintCard[] = [
  {
    title: 'Inner World',
    description: 'Core Values, Jungian Archetypes, and Cognitive Style — your mind\'s blueprint.',
    icon: '◈',
    iconStyle: { color: PALETTE.lavender },
    gradientColors: ['rgba(168, 155, 200, 0.1)', 'transparent'],
    route: '/inner-world' as Href,
  },
  {
    title: 'Body & Nervous System',
    description: 'Somatic map and trigger log — how your body holds experience.',
    icon: '◍',
    iconStyle: { color: PALETTE.sage },
    gradientColors: ['rgba(140, 190, 170, 0.1)', 'transparent'],
    route: '/body-nervous' as Href,
  },
  {
    title: 'Relational Mirror',
    description: 'Attachment tendencies and nervous system patterns you notice in connection.',
    icon: '⚯',
    iconStyle: { color: PALETTE.rose },
    gradientColors: ['rgba(212, 163, 179, 0.1)', 'transparent'],
    route: '/relationship-patterns' as Href,
  },
  {
    title: 'Healing Space',
    description: 'Shadow work, inner child needs, and restorative anchors.',
    icon: '⚕',
    iconStyle: { color: PALETTE.emerald },
    gradientColors: ['rgba(110, 191, 139, 0.1)', 'transparent'],
    route: '/(tabs)/healing' as Href,
  },
  {
    title: 'Inner Tensions',
    description: 'Nervous system conflict, ambivalence, and shadow triggers.',
    icon: '⊗',
    iconStyle: { color: PALETTE.lavender },
    gradientColors: ['rgba(168, 155, 200, 0.1)', 'transparent'],
    route: '/(tabs)/inner-tensions' as Href,
  },
  {
    title: 'Cosmic Blueprint',
    description: 'Planets, houses, and aspects mapping the moment of your arrival.',
    icon: '⚝',
    iconStyle: { color: 'rgba(217,191,140,0.65)' },
    gradientColors: ['rgba(217, 191, 140, 0.07)', 'transparent'],
    route: '/(tabs)/chart' as Href,
  },
];

const IDENTITY_TABS = [
  { id: 'blueprint', label: 'Blueprint' },
  { id: 'energy',    label: 'Energy'    },
];

export default function BlueprintScreen() {
  const router = useRouter();
  const { isPremium } = usePremium();
  const [chartName, setChartName] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'blueprint' | 'energy'>('blueprint');

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const storedName = await EncryptedAsyncStorage.getItem('msky_user_name');
          if (storedName) { setChartName(storedName); }
          else {
            const charts = await localDb.getCharts();
            if (charts.length > 0) {
              const name = charts[0].name;
              const place = charts[0].birthPlace;
              setChartName(name && name !== place ? name : null);
            }
          }
        } catch (err) {
          logger.error('Blueprint: failed to load chart name', err);
        }
      })();
    }, []),
  );

  const nav = (route: Href, premium?: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (premium && !isPremium) {
      router.push('/(tabs)/premium' as Href);
      return;
    }
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

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View entering={FadeInDown.delay(80).duration(600)} style={styles.header}>
            <Text style={styles.headerTitle}>Identity</Text>
            <GoldSubtitle style={styles.headerSubtitle}>
              {chartName
                ? `${chartName} · Know yourself deeply`
                : 'Values, patterns, body & mind'}
            </GoldSubtitle>
          </Animated.View>

          {/* Tab Pill */}
          <Animated.View entering={FadeInDown.delay(120).duration(600)}>
            <PremiumSegmentedControl
              options={IDENTITY_TABS}
              selectedIndex={activeTab === 'blueprint' ? 0 : 1}
              onChange={(idx) => setActiveTab(idx === 0 ? 'blueprint' : 'energy')}
            />
          </Animated.View>

          {activeTab === 'blueprint' ? (
            /* Cards */
            <View style={styles.grid}>
              {CARDS.map((card, i) => (
              <Animated.View
                key={card.route as string}
                entering={FadeInDown.delay(160 + i * 80).duration(600)}
              >
                <Pressable
                  style={({ pressed }) => [pressed && styles.cardPressed]}
                  onPress={() => nav(card.route, card.premium)}
                >
                  <LinearGradient colors={card.gradientColors} style={styles.card}>
                    <View style={styles.cardIconRow}>
                      <MetallicText style={[styles.cardIcon, card.iconStyle]} color={card.iconStyle.color as string}>{card.icon}</MetallicText>
                      {card.premium && <PremiumBadge />}
                    </View>
                    <Text style={styles.cardTitle}>{card.title}</Text>
                    <Text style={styles.cardSubtitle}>{card.description}</Text>
                  </LinearGradient>
                </Pressable>
              </Animated.View>
            ))}
            </View>
          ) : (
            /* Energy Content */
            <EnergyScrollContent embedded />
          )}

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// Premium lock indicator
const PremiumBadge = () => (
  <View style={styles.badgeContainer}>
    <MetallicText style={styles.badgeIcon} variant="gold">✦</MetallicText>
  </View>
);

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020817' },
  safeArea: { flex: 1 },
  glowOrb: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    opacity: 0.6,
  },
  scrollContent: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 140 },

  // Header
  header: { marginBottom: 32 },
  headerTitle: {
    fontSize: 34,
    color: PALETTE.textMain,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  headerSubtitle: { fontSize: 14 },

  // Grid
  grid: { gap: 20 },

  // Card
  card: {
    padding: 28,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  cardPressed: { transform: [{ scale: 0.98 }], opacity: 0.9 },

  cardIconRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },

  cardIcon: { fontSize: 32 },
  cardTitle: {
    fontSize: 20,
    color: PALETTE.textMain,
    fontWeight: '700',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 16,
    color: PALETTE.textMuted,
    lineHeight: 24,
  },

  // Premium badge
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(217, 191, 140, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(217, 191, 140, 0.3)',
  },
  badgeIcon: { fontSize: 10 },
  badgeText: { fontSize: 9, fontWeight: 'bold', letterSpacing: 1 },
});
