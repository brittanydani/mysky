// File: app/(tabs)/blueprint.tsx
// MySky — Blueprint: Architecture Hub
//
// The user's personal blueprint — a hub screen linking to:
//   1. Core Force Map (radar hero)
//   2. Growth Insights
//   3. Energy Architecture
//   4. Relationships

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from '../../components/ui/SkiaGradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter, Href } from 'expo-router';
import { useFocusEffect } from '@react-navigation/core';
import * as Haptics from 'expo-haptics';

import { SkiaDynamicCosmos } from '../../components/ui/SkiaDynamicCosmos';
import { PsychologicalForcesRadar } from '../../components/ui/PsychologicalForcesRadar';
import { localDb } from '../../services/storage/localDb';
import { AstrologyCalculator } from '../../services/astrology/calculator';
import { CheckInService } from '../../services/patterns/checkInService';
import { DailyCheckIn } from '../../services/patterns/types';
import { NatalChart } from '../../services/astrology/types';
import { usePremium } from '../../context/PremiumContext';
import { logger } from '../../utils/logger';
import { SkeletonBlueprint } from '../../components/ui/SkeletonLoader';

const { width: SCREEN_W } = Dimensions.get('window');

const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

// ── Palette ──────────────────────────────────────────────────────────────────
const PALETTE = {
  gold: '#C9AE78',
  goldDim: 'rgba(201,174,120,0.55)',
  silverBlue: '#8BC4E8',
  amethyst: '#9D76C1',
  emerald: '#6EBF8B',
  textMain: '#FFFFFF',
  textSoft: 'rgba(255,255,255,0.72)',
  textMuted: 'rgba(255,255,255,0.42)',
  glassBorder: 'rgba(255,255,255,0.07)',
  glassBorderGold: 'rgba(201,174,120,0.18)',
};

// ── Force calculation ──

const FORCE_COLORS_MAP: Record<string, string> = {
  'Sun': '#C9AE78', 'Moon': '#8BC4E8', 'Mars': '#CD7F5D',
  'Venus': '#F4C2C2', 'Saturn': '#A9A9A9', 'Jupiter': '#9370DB',
  'Mercury': '#FFEA70', 'Pluto': '#9D76C1', 'Neptune': '#48D1CC',
  'Uranus': '#FF8C00', 'Aries': '#CD7F5D', 'Taurus': '#6EBF8B',
  'Gemini': '#FFEA70', 'Cancer': '#8BC4E8', 'Leo': '#C9AE78',
  'Virgo': '#A9A9A9', 'Libra': '#F4C2C2', 'Scorpio': '#9D76C1',
  'Sagittarius': '#9370DB', 'Capricorn': '#A9A9A9', 'Aquarius': '#48D1CC',
  'Pisces': '#8BC4E8',
};

function calculateForces(chart: NatalChart | null) {
  if (!chart || !chart.placements) return [];

  const scores: Record<string, { label: string; val: number; color: string }> = {};

  const addScore = (key: string, points: number) => {
    if (!scores[key]) scores[key] = { label: key, val: 0, color: FORCE_COLORS_MAP[key] || PALETTE.gold };
    scores[key].val += points;
  };

  chart.placements.forEach(p => {
    const isLuminary = ['Sun', 'Moon'].includes(p.planet.name);
    const isPersonal = ['Mercury', 'Venus', 'Mars'].includes(p.planet.name);
    const points = isLuminary ? 30 : isPersonal ? 20 : 10;
    addScore(p.planet.name, points);
    if (p.sign?.name) addScore(p.sign.name, points);
  });

  if (chart.risingSign) addScore(chart.risingSign.name, 30);

  return Object.values(scores)
    .sort((a, b) => b.val - a.val)
    .slice(0, 6)
    .map(f => ({
      label: f.label,
      value: Math.min(100, (f.val / 60) * 100),
      color: f.color,
    }));
}

/** Derive a short interpretation sentence from the force data. */
function buildInterpretation(
  forces: { label: string; value: number }[],
  behavioralForces?: { label: string; value: number }[],
): string {
  if (!forces.length) return 'Your foundational architecture is taking shape.';
  const baseline = forces[0];
  if (!behavioralForces || behavioralForces.length === 0) {
    return `${baseline.label} anchors your foundational architecture — the quiet force beneath every pattern.`;
  }
  let maxShift = 0;
  let shiftedLabel = '';
  forces.forEach((f, i) => {
    const b = behavioralForces[i];
    if (b) {
      const delta = Math.abs(b.value - f.value);
      if (delta > maxShift) { maxShift = delta; shiftedLabel = f.label; }
    }
  });
  if (maxShift > 12 && shiftedLabel) {
    return `Your recent life is stretching your natural blueprint — ${shiftedLabel} is currently most activated.`;
  }
  return `${baseline.label} and stability remain the strongest anchors in your current architecture.`;
}

// ── Module card definitions ──────────────────────────────────────────────────
interface ModuleCard {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  accentColor: string;
  route: string;
  premium: boolean;
}

const MODULE_CARDS: ModuleCard[] = [
  {
    id: 'growth',
    title: 'Growth Insights',
    description: 'Explore inner-child themes, fear patterns, avoidance, and the forces shaping your development.',
    icon: 'leaf-outline',
    accentColor: PALETTE.emerald,
    route: '/(tabs)/growth',
    premium: false,
  },
  {
    id: 'energy',
    title: 'Energy Architecture',
    description: 'View your energetic centers, focus areas, and current guidance on where activation is gathering.',
    icon: 'pulse-outline',
    accentColor: PALETTE.amethyst,
    route: '/(tabs)/energy',
    premium: true,
  },
  {
    id: 'relationships',
    title: 'Relationships',
    description: 'Map the relational patterns woven through your story and the people who shape your nervous system.',
    icon: 'people-outline',
    accentColor: PALETTE.silverBlue,
    route: '/(tabs)/relationships',
    premium: true,
  },
];

// ════════════════════════════════════════════════════════════════════════════
// Main screen
// ════════════════════════════════════════════════════════════════════════════

export default function BlueprintScreen() {
  const router = useRouter();
  const { isPremium } = usePremium();
  const [chart, setChart] = useState<NatalChart | null>(null);
  const [hasChart, setHasChart] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkIns, setCheckIns] = useState<DailyCheckIn[]>([]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      (async () => {
        try {
          setLoading(true);
          const charts = await localDb.getCharts();
          if (!isActive) return;
          if (charts.length > 0) {
            setHasChart(true);
            const saved = charts[0];
            const natal = AstrologyCalculator.generateNatalChart({
              date: saved.birthDate,
              time: saved.birthTime,
              hasUnknownTime: saved.hasUnknownTime,
              place: saved.birthPlace,
              latitude: saved.latitude,
              longitude: saved.longitude,
              timezone: saved.timezone,
              houseSystem: saved.houseSystem,
            });
            if (!isActive) return;
            setChart(natal);
            try {
              const recentCheckIns = await CheckInService.getAllCheckIns(saved.id, 30);
              if (isActive) setCheckIns(Array.isArray(recentCheckIns) ? recentCheckIns : []);
            } catch { /* non-critical */ }
          } else {
            setHasChart(false);
            setChart(null);
          }
        } catch (e) {
          logger.error('[Blueprint] load failed:', e);
        } finally {
          if (isActive) setLoading(false);
        }
      })();
      return () => { isActive = false; };
    }, [])
  );

  const forces = calculateForces(chart);

  const behavioralForces = useMemo(() => {
    if (!forces.length || checkIns.length < 3) return undefined;
    const recent = checkIns.slice(0, 30);
    const avgMood = recent.reduce((s, c) => s + c.moodScore, 0) / recent.length;
    const energyFactor = recent.filter(c => c.energyLevel === 'high').length / recent.length;
    const vitalityRatio = (avgMood / 10) * 0.7 + energyFactor * 0.3;
    return forces.map(f => ({
      ...f,
      value: Math.round(f.value * 0.5 + vitalityRatio * 50),
    }));
  }, [forces, checkIns]);

  const interpretation = useMemo(
    () => buildInterpretation(forces, behavioralForces),
    [forces, behavioralForces]
  );

  const handleModulePress = useCallback((item: ModuleCard) => {
    if (!hasChart) {
      router.push('/(tabs)/home' as Href);
      return;
    }
    if (item.premium && !isPremium) {
      router.push('/(tabs)/premium' as Href);
      return;
    }
    Haptics.selectionAsync().catch(() => {});
    router.push(item.route as Href);
  }, [hasChart, isPremium, router]);

  if (loading) {
    return (
      <View style={styles.container}>
        <SkiaDynamicCosmos />
        <SafeAreaView style={styles.safeArea}>
          <SkeletonBlueprint />
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── 1. Header ── */}
          <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
            <Text style={styles.title}>Architecture</Text>
            <Text style={styles.headerSub}>Your personal blueprint</Text>
          </Animated.View>

          {/* ── Hero: Core Force Map ── */}
          {hasChart && forces.length > 0 ? (
            <Animated.View entering={FadeInDown.delay(100).duration(550)} style={styles.heroCard}>
              <LinearGradient
                colors={['rgba(14,24,48,0.72)', 'rgba(6,12,28,0.88)']}
                style={styles.heroCardInner}
              >
                <View style={styles.heroCardHeader}>
                  <View>
                    <Text style={styles.heroCardTitle}>Core Force Map</Text>
                    <Text style={styles.heroCardSubtitle}>
                      {behavioralForces ? 'Baseline · Current overlay' : 'Foundational architecture'}
                    </Text>
                  </View>
                  <View style={styles.goldDot} />
                </View>
                <View style={styles.radarContainer}>
                  <PsychologicalForcesRadar
                    forces={forces}
                    size={SCREEN_W - 80}
                    behavioralForces={behavioralForces}
                  />
                </View>
                <View style={styles.interpretationRow}>
                  <Ionicons name="sparkles" size={13} color={PALETTE.goldDim} style={{ marginTop: 1 }} />
                  <Text style={styles.interpretationText}>{interpretation}</Text>
                </View>
              </LinearGradient>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.emptyCard}>
              <LinearGradient
                colors={['rgba(14,24,48,0.50)', 'rgba(2,8,23,0.72)']}
                style={styles.emptyCardInner}
              >
                <Ionicons name="compass-outline" size={44} color={PALETTE.textMuted} style={{ marginBottom: 18 }} />
                <Text style={styles.emptyTitle}>Your architecture awaits</Text>
                <Text style={styles.emptySubtitle}>
                  Enter your birth details to build a personalized map of your core forces, drives, and growth directions.
                </Text>
                <Pressable
                  onPress={() => router.push('/(tabs)/home' as Href)}
                  style={({ pressed }) => [styles.emptyButton, pressed && { opacity: 0.8 }]}
                  accessibilityRole="button"
                  accessibilityLabel="Build your blueprint"
                >
                  <Text style={styles.emptyButtonText}>Build Your Blueprint</Text>
                </Pressable>
              </LinearGradient>
            </Animated.View>
          )}

          {/* ── Module grid ── */}
          <Animated.View entering={FadeInDown.delay(220).duration(500)} style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>Pathways</Text>
          </Animated.View>

          {MODULE_CARDS.map((item, index) => (
            <Animated.View
              key={item.id}
              entering={FadeInDown.delay(280 + index * 80).duration(500)}
            >
              <Pressable
                style={({ pressed }) => [styles.moduleCard, pressed && styles.moduleCardPressed]}
                onPress={() => handleModulePress(item)}
                accessibilityRole="button"
                accessibilityLabel={`${item.title}: ${item.description}`}
              >
                <LinearGradient
                  colors={['rgba(13,22,44,0.80)', 'rgba(8,14,30,0.65)']}
                  style={styles.moduleCardInner}
                >
                  <View style={[styles.moduleIconWrap, { backgroundColor: `${item.accentColor}12` }]}>
                    <Ionicons name={item.icon} size={26} color={item.accentColor} />
                  </View>
                  <View style={styles.moduleTextCol}>
                    <View style={styles.moduleTitleRow}>
                      <Text style={styles.moduleTitle}>{item.title}</Text>
                      {item.premium && !isPremium && (
                        <View style={styles.proBadge}>
                          <Ionicons name="diamond-outline" size={9} color={PALETTE.gold} />
                          <Text style={styles.proBadgeText}>PRO</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.moduleDescription}>{item.description}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={17} color={PALETTE.textMuted} style={{ marginLeft: 8 }} />
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
  container: { flex: 1, backgroundColor: '#020817' },
  safeArea: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 120,
  },

  // ── Header
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    color: PALETTE.textMain,
    fontSize: 34,
    fontWeight: '700',
    fontFamily: SERIF,
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  headerSub: {
    color: PALETTE.textMuted,
    fontSize: 14,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  // ── Hero card (Core Force Map)
  heroCard: {
    marginBottom: 28,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: PALETTE.glassBorderGold,
  },
  heroCardInner: {
    borderRadius: 22,
    paddingTop: 22,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  heroCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  heroCardTitle: {
    color: PALETTE.textMain,
    fontSize: 20,
    fontWeight: '700',
    fontFamily: SERIF,
    letterSpacing: 0.2,
  },
  heroCardSubtitle: {
    color: PALETTE.textMuted,
    fontSize: 12,
    marginTop: 3,
    letterSpacing: 0.4,
  },
  goldDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PALETTE.gold,
    marginTop: 6,
    opacity: 0.7,
  },
  radarContainer: {
    alignItems: 'center',
  },
  interpretationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: PALETTE.glassBorder,
  },
  interpretationText: {
    flex: 1,
    color: PALETTE.textSoft,
    fontSize: 13,
    lineHeight: 20,
    fontStyle: 'italic',
  },

  // ── Empty state
  emptyCard: {
    marginBottom: 28,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
  },
  emptyCardInner: {
    borderRadius: 22,
    padding: 36,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 22,
    color: PALETTE.textMain,
    fontFamily: SERIF,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: PALETTE.textSoft,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  emptyButton: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: PALETTE.glassBorderGold,
  },
  emptyButtonText: {
    color: PALETTE.gold,
    fontWeight: '700',
    fontSize: 15,
  },

  // ── Section header
  sectionHeader: {
    marginBottom: 14,
  },
  sectionLabel: {
    color: PALETTE.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },

  // ── Module cards
  moduleCard: {
    marginBottom: 12,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
  },
  moduleCardPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.988 }],
  },
  moduleCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 18,
    borderRadius: 18,
  },
  moduleIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  moduleTextCol: {
    flex: 1,
  },
  moduleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  moduleTitle: {
    color: PALETTE.textMain,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: SERIF,
  },
  moduleDescription: {
    color: PALETTE.textSoft,
    fontSize: 13,
    lineHeight: 19,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(201,174,120,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(201,174,120,0.22)',
  },
  proBadgeText: {
    color: PALETTE.gold,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
