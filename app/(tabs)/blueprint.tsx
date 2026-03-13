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
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from '../../components/ui/SkiaGradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Href } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/core';
import * as Haptics from 'expo-haptics';

import { SkiaDynamicCosmos } from '../../components/ui/SkiaDynamicCosmos';
import { localDb } from '../../services/storage/localDb';
import { usePremium } from '../../context/PremiumContext';
import { logger } from '../../utils/logger';

const PALETTE = {
  gold: '#C9AE78',
  silverBlue: '#8BC4E8',
  copper: '#CD7F5D',
  emerald: '#6EBF8B',
  rose: '#D4A3B3',
  amethyst: '#9D76C1',
  textMain: '#FFFFFF',
  textMuted: 'rgba(255,255,255,0.45)',
  glassBorder: 'rgba(255,255,255,0.06)',
};

interface BlueprintCard {
  title: string;
  eyebrow: string;
  description: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  gradientColors: [string, string];
  route: Href;
  premium?: boolean;
}

const CARDS: BlueprintCard[] = [
  {
    title: 'Your Chart',
    eyebrow: 'Natal Wheel',
    description: 'Planetary placements, house positions, and the aspects that define you.',
    icon: 'planet-outline',
    color: PALETTE.gold,
    gradientColors: ['rgba(201, 174, 120, 0.18)', 'rgba(14, 18, 30, 0.7)'],
    route: '/(tabs)/chart' as Href,
  },
  {
    title: 'Life Narrative',
    eyebrow: 'Your Story',
    description: 'The psychological forces and natal chapters that shape who you are.',
    icon: 'layers-outline',
    color: PALETTE.silverBlue,
    gradientColors: ['rgba(139, 196, 232, 0.18)', 'rgba(14, 18, 30, 0.7)'],
    route: '/(tabs)/story' as Href,
    premium: true,
  },
  {
    title: 'Connections',
    eyebrow: 'Relationships',
    description: 'Synastry reports and compatibility insights for the people in your life.',
    icon: 'people-outline',
    color: PALETTE.rose,
    gradientColors: ['rgba(212, 163, 179, 0.18)', 'rgba(14, 18, 30, 0.7)'],
    route: '/(tabs)/relationships' as Href,
    premium: true,
  },
  {
    title: 'Healing',
    eyebrow: 'Inner Work',
    description: 'Shadow work cards and astrology-driven guidance for deep growth.',
    icon: 'leaf-outline',
    color: PALETTE.emerald,
    gradientColors: ['rgba(110, 191, 139, 0.18)', 'rgba(14, 18, 30, 0.7)'],
    route: '/(tabs)/healing' as Href,
    premium: true,
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

  const nav = (route: Href) => {
    Haptics.selectionAsync().catch(() => {});
    router.push(route);
  };

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ── */}
          <Animated.View entering={FadeInDown.delay(80).duration(600)} style={styles.header}>
            <Text style={styles.title}>Blueprint</Text>
            <Text style={styles.subtitle}>
              {chartName ? `${chartName}'s identity map` : 'Your natal identity map'}
            </Text>
          </Animated.View>

          {/* ── Cards ── */}
          {CARDS.map((card, i) => (
            <Animated.View
              key={card.route as string}
              entering={FadeInDown.delay(160 + i * 80).duration(600)}
              style={styles.cardWrapper}
            >
              <Pressable
                onPress={() => nav(card.route)}
                style={({ pressed }) => [styles.pressable, pressed && styles.pressableActive]}
              >
                <LinearGradient colors={card.gradientColors} style={styles.card}>
                  <View style={[styles.iconRing, { borderColor: card.color + '40' }]}>
                    <Ionicons name={card.icon} size={26} color={card.color} />
                  </View>

                  <View style={styles.cardText}>
                    <Text style={styles.cardEyebrow}>{card.eyebrow}</Text>
                    <View style={styles.cardTitleRow}>
                      <Text style={styles.cardTitle}>{card.title}</Text>
                      {card.premium && !isPremium && (
                        <View style={styles.premiumBadge}>
                          <Ionicons name="star" size={9} color={PALETTE.gold} />
                        </View>
                      )}
                    </View>
                    <Text style={styles.cardDescription}>{card.description}</Text>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={PALETTE.textMuted}
                    style={styles.chevron}
                  />
                </LinearGradient>
              </Pressable>
            </Animated.View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0D16',
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    paddingTop: 8,
  },

  // ── Header ──
  header: {
    marginBottom: 28,
    paddingTop: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: PALETTE.textMain,
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: PALETTE.textMuted,
    letterSpacing: 0.2,
  },

  // ── Cards ──
  cardWrapper: {
    marginBottom: 12,
    borderRadius: 18,
    overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  pressable: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  pressableActive: {
    opacity: 0.82,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
    gap: 14,
  },

  // ── Icon ring ──
  iconRing: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    flexShrink: 0,
  },

  // ── Text ──
  cardText: {
    flex: 1,
    gap: 2,
  },
  cardEyebrow: {
    fontSize: 11,
    color: PALETTE.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: PALETTE.textMain,
    letterSpacing: 0.2,
  },
  premiumBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(201,174,120,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(201,174,120,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardDescription: {
    fontSize: 13,
    color: PALETTE.textMuted,
    lineHeight: 18,
    marginTop: 2,
  },
  chevron: {
    flexShrink: 0,
  },
});
