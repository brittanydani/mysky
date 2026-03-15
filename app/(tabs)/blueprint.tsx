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
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from '../../components/ui/SkiaGradient';
import { BlurView } from 'expo-blur';
import { useRouter, Href } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/core';
import * as Haptics from 'expo-haptics';

import { SkiaDynamicCosmos } from '../../components/ui/SkiaDynamicCosmos';
import { localDb } from '../../services/storage/localDb';
import { usePremium } from '../../context/PremiumContext';
import { logger } from '../../utils/logger';
import { GoldSubtitle } from '../../components/ui/GoldSubtitle';
import { MetallicText } from '../../components/ui/MetallicText';

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
    premium: true,
  },
  {
    title: 'Life Narrative',
    description: '10 psychological chapters drawn from your natal chart.',
    icon: '✧',
    iconStyle: { color: PALETTE.silverBlue },
    gradientColors: ['rgba(110, 140, 180, 0.1)', 'transparent'],
    route: '/(tabs)/story' as Href,
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

export default function BlueprintScreen() {
  const router = useRouter();
  const { isPremium } = usePremium();
  const [chartName, setChartName] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const charts = await localDb.getCharts();
          if (charts.length > 0) setChartName(charts[0].name ?? null);
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

      {/* Deep Space Atmosphere */}
      <LinearGradient
        colors={['rgba(85, 65, 115, 0.1)', 'transparent']}
        style={styles.topGlow}
      />

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View entering={FadeInDown.delay(80).duration(600)} style={styles.header}>
            <Text style={styles.headerTitle}>Blueprint</Text>
            <GoldSubtitle style={styles.headerSubtitle}>
              {chartName
                ? `${chartName} · Know yourself deeply`
                : 'Values, patterns, body & mind'}
            </GoldSubtitle>
          </Animated.View>

          {/* Cards */}
          <View style={styles.grid}>
            {CARDS.map((card, i) => (
              <Animated.View
                key={card.route as string}
                entering={FadeInDown.delay(160 + i * 80).duration(600)}
              >
                <Pressable
                  style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                  onPress={() => nav(card.route, card.premium)}
                >
                  <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                  <LinearGradient colors={card.gradientColors} style={StyleSheet.absoluteFill} />

                  <View style={styles.cardContent}>
                      {card.premium ? (
                      <View style={styles.premiumHeader}>
                        <MetallicText style={[styles.cardIcon, card.iconStyle]} color={card.iconStyle.color as string}>{card.icon}</MetallicText>
                        <PremiumBadge />
                      </View>
                    ) : (
                      <MetallicText style={[styles.cardIcon, card.iconStyle]} color={card.iconStyle.color as string}>{card.icon}</MetallicText>
                    )}
                    <View>
                      <Text style={styles.cardTitle}>{card.title}</Text>
                      <Text style={styles.cardSubtitle}>{card.description}</Text>
                    </View>
                  </View>
                </Pressable>
              </Animated.View>
            ))}
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// Premium lock indicator
const PremiumBadge = () => (
  <View style={styles.badgeContainer}>
    <MetallicText style={styles.badgeIcon} variant="gold">✦</MetallicText>
    <MetallicText style={styles.badgeText} variant="gold">DEEPER SKY</MetallicText>
  </View>
);

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  safeArea: { flex: 1 },
  topGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 400 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 24 },

  // Header
  header: { marginBottom: 32 },
  headerTitle: {
    fontSize: 34,
    color: PALETTE.textMain,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    fontWeight: '300',
    marginBottom: 8,
  },
  headerSubtitle: { fontSize: 14 },

  // Grid
  grid: { gap: 20 },

  // Card
  card: {
    height: 180,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
  },
  cardPressed: { transform: [{ scale: 0.98 }], opacity: 0.9 },
  cardContent: { flex: 1, padding: 24, justifyContent: 'space-between' },

  premiumHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },

  cardIcon: { fontSize: 32 },
  cardTitle: {
    fontSize: 20,
    color: PALETTE.textMain,
    fontFamily: 'Georgia',
    fontWeight: '400',
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 13,
    color: PALETTE.textMuted,
    lineHeight: 18,
    paddingRight: 20,
  },

  // Premium badge
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(217, 191, 140, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(217, 191, 140, 0.3)',
  },
  badgeIcon: { color: PALETTE.gold, fontSize: 10, marginRight: 4 },
  badgeText: { color: PALETTE.gold, fontSize: 9, fontWeight: 'bold', letterSpacing: 1 },
});
