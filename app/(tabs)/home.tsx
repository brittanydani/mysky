// File: app/(tabs)/home.tsx
// MySky — The Stability Dashboard
//
// Command center for the Biometric Wellness Suite. Focuses on the
// Stability Index — a proprietary wellness metric measuring how
// synchronised your Sleep, Mood, and Energy signals are.
//
// Layers:
//   1. NebulaBackground — atmospheric shader driven by energy & transits
//   2. SkiaUnifiedAura  — fluid Mood/Energy/Tension signature
//   3. SkiaStabilityDashboard — 7-day Bézier coherence graph
//   4. Actionable Insights — text engine with stability recommendations

import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Href } from 'expo-router';
import Animated, { FadeInDown, FadeIn, FadeInUp } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/core';

import { theme } from '../../constants/theme';

// ── Custom Skia Suite ──
import NebulaBackground from '../../components/ui/NebulaBackground';
import StarField from '../../components/ui/StarField';
import SkiaUnifiedAura from '../../components/ui/SkiaUnifiedAura';
import SkiaStabilityDashboard, { computeStabilityIndex } from '../../components/ui/SkiaStabilityDashboard';
import type { StabilityDataPoint } from '../../components/ui/SkiaStabilityDashboard';
import SkiaWarpTransition from '../../components/ui/SkiaWarpTransition';
import type { WarpRef } from '../../components/ui/SkiaWarpTransition';

import BirthDataModal from '../../components/BirthDataModal';
import { localDb } from '../../services/storage/localDb';
import { NatalChart, BirthData } from '../../services/astrology/types';
import { AstrologyCalculator } from '../../services/astrology/calculator';
import { ChartDisplayManager } from '../../services/astrology/chartDisplayManager';
import { CheckInService } from '../../services/patterns/checkInService';
import { config } from '../../constants/config';
import { logger } from '../../utils/logger';
import { parseLocalDate } from '../../utils/dateUtils';
import { usePremium } from '../../context/PremiumContext';

const { width } = Dimensions.get('window');

// ── Cinematic Palette ──
const PALETTE = {
  gold: '#D4AF37',
  silverBlue: '#8BC4E8',
  copper: '#CD7F5D',
  emerald: '#6EBF8B',
  rose: '#D4A3B3',
  textMain: '#FDFBF7',
  glassBorder: 'rgba(255,255,255,0.06)',
  glassHighlight: 'rgba(255,255,255,0.12)',
};

// ── Insight Engine ─────────────────────────────────────────────────────────

function generateInsight(
  stabilityIndex: number,
  mood: number,
  energy: number,
  sleep: number,
): string {
  const sleepDeficit = 8 - sleep;
  if (stabilityIndex >= 80) {
    return `Your stability is ${stabilityIndex}% today. Your signals are coherent — maintain this rhythm and your vitality will continue to build.`;
  }
  if (sleepDeficit > 1.5) {
    return `Your stability is ${stabilityIndex}% today. Increasing rest by ${sleepDeficit.toFixed(0)} hours could stabilise your emerald vitality and lift mood coherence.`;
  }
  if (energy < 5) {
    return `Your stability is ${stabilityIndex}% today. Your energy signal is low — consider gentle movement or sunlight exposure to restore your baseline.`;
  }
  if (mood < 4) {
    return `Your stability is ${stabilityIndex}% today. Your emotional weather is heavy. A somatic breath session could help re-center your internal landscape.`;
  }
  return `Your stability is ${stabilityIndex}% today. Small adjustments to rest and movement could shift your coherence toward alignment.`;
}

// ── Quick Action Card ───────────────────────────────────────────────────────

function QuickActionCard({
  icon,
  label,
  sublabel,
  accentColor,
  onPress,
  delay,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sublabel: string;
  accentColor: string;
  onPress: () => void;
  delay: number;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(delay)} style={{ flex: 1 }}>
      <Pressable onPress={onPress} style={styles.actionCard}>
        <View style={[styles.actionIconCircle, { backgroundColor: `${accentColor}15` }]}>
          <Ionicons name={icon} size={20} color={accentColor} />
        </View>
        <Text style={styles.actionLabel}>{label}</Text>
        <Text style={styles.actionSublabel}>{sublabel}</Text>
      </Pressable>
    </Animated.View>
  );
}

// ── Home Screen ─────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const { isPremium } = usePremium();
  const warpRef = useRef<WarpRef>(null);

  const [userChart, setUserChart] = useState<NatalChart | null>(null);
  const [showEditBirth, setShowEditBirth] = useState(false);
  const [loading, setLoading] = useState(true);

  // Aura data — derived from latest check-in (defaults until loaded)
  const [mood, setMood] = useState(7);
  const [energy, setEnergy] = useState(8);
  const [tension, setTension] = useState(3);

  // Stability data — last 7 days of combined metrics
  const [stabilityData, setStabilityData] = useState<StabilityDataPoint[]>([]);
  const [latestSleep, setLatestSleep] = useState(7);

  // ── Chart Loading ──

  const loadUserChart = useCallback(
    async (opts?: { silent?: boolean }) => {
      const silent = opts?.silent ?? false;
      if (!silent) setLoading(true);

      try {
        const charts = await localDb.getCharts();

        if (charts.length > 0) {
          const savedChart = charts[0];
          const birthData = {
            date: savedChart.birthDate,
            time: savedChart.birthTime,
            hasUnknownTime: savedChart.hasUnknownTime,
            place: savedChart.birthPlace,
            latitude: savedChart.latitude,
            longitude: savedChart.longitude,
            timezone: savedChart.timezone,
            houseSystem: savedChart.houseSystem,
          };

          const chart = AstrologyCalculator.generateNatalChart(birthData);
          chart.id = savedChart.id;
          chart.name = savedChart.name;
          chart.createdAt = savedChart.createdAt;
          chart.updatedAt = savedChart.updatedAt;

          setUserChart(chart);

          // Hydrate latest check-in data for the aura
          try {
            const checkins = await localDb.getCheckIns(chart.id, 7);
            if (checkins.length > 0) {
              const latest = checkins[0];
              if (latest.moodScore != null) setMood(latest.moodScore);
              const energyMap: Record<string, number> = { low: 3, medium: 5, high: 8 };
              if (latest.energyLevel) setEnergy(energyMap[latest.energyLevel] ?? 5);
              const stressMap: Record<string, number> = { low: 2, medium: 5, high: 8 };
              if (latest.stressLevel) setTension(stressMap[latest.stressLevel] ?? 3);
            }

            // Build stability data from check-ins + sleep entries
            const sleepEntries = await localDb.getSleepEntries(chart.id, 7);
            const sleepByDate: Record<string, number> = {};
            for (const s of sleepEntries) {
              sleepByDate[s.date] = s.durationHours ?? 7;
            }

            const stabilityPoints: StabilityDataPoint[] = checkins
              .slice(0, 7)
              .reverse()
              .map(ci => {
                const energyMapLocal: Record<string, number> = { low: 3, medium: 5, high: 8 };
                return {
                  date: ci.date,
                  mood: ci.moodScore,
                  energy: energyMapLocal[ci.energyLevel] ?? 5,
                  sleep: sleepByDate[ci.date] ?? 7,
                };
              });
            setStabilityData(stabilityPoints);

            if (sleepEntries.length > 0 && sleepEntries[0].durationHours != null) {
              setLatestSleep(sleepEntries[0].durationHours);
            }
          } catch {
            // Silently fall back to defaults
          }
        } else {
          setUserChart(null);
          router.replace('/onboarding' as Href);
        }
      } catch (error) {
        logger.error('Failed to load user chart:', error);
        setUserChart(null);
        router.replace('/onboarding' as Href);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [router],
  );

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          await loadUserChart();
        } catch (e) {
          logger.error('Home focus load failed:', e);
        }
      })();
    }, [loadUserChart]),
  );

  const handleEditBirthData = async (
    birthData: BirthData,
    extra?: { chartName?: string },
  ) => {
    setShowEditBirth(false);
    try {
      const chart = AstrologyCalculator.generateNatalChart(birthData);

      const charts = await localDb.getCharts();
      const existingId = charts.length > 0 ? charts[0].id : chart.id;

      const savedChart = {
        id: existingId,
        name: extra?.chartName ?? chart.name,
        birthDate: chart.birthData.date,
        birthTime: chart.birthData.time,
        hasUnknownTime: chart.birthData.hasUnknownTime,
        birthPlace: chart.birthData.place,
        latitude: chart.birthData.latitude,
        longitude: chart.birthData.longitude,
        timezone: chart.birthData.timezone,
        houseSystem: chart.birthData.houseSystem,
        createdAt: charts.length > 0 ? charts[0].createdAt : chart.createdAt,
        updatedAt: new Date().toISOString(),
        isDeleted: false,
      };

      await localDb.saveChart(savedChart);

      chart.id = existingId;
      chart.name = savedChart.name;
      chart.createdAt = savedChart.createdAt;
      chart.updatedAt = savedChart.updatedAt;
      setUserChart(chart);
    } catch (error) {
      logger.error('Failed to update chart:', error);
    }
  };

  const displayChart = userChart
    ? ChartDisplayManager.formatChartWithTimeWarnings(userChart)
    : null;

  // ── Stability computation ──
  const stability = useMemo(() => computeStabilityIndex(stabilityData), [stabilityData]);
  const insightText = useMemo(
    () => generateInsight(stability.index, mood, energy, latestSleep),
    [stability.index, mood, energy, latestSleep],
  );

  // ── Loading / Onboarding Gates ──

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <NebulaBackground mood={5} />
        <StarField starCount={40} />
        <Text style={styles.loadingText}>Calibrating your signals...</Text>
      </View>
    );
  }

  if (!userChart) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <NebulaBackground mood={3} />
        <StarField starCount={40} />
        <Text style={styles.loadingText}>Preparing onboarding…</Text>
      </View>
    );
  }

  // ── Stability Dashboard ──

  return (
    <View style={styles.container}>
      {/* LAYER 1: Atmospheric Shader — turbulence driven by energy, color by transits */}
      <NebulaBackground mood={mood} energy={energy} />

      {/* LAYER 2: Particle depth field */}
      <StarField starCount={60} />

      {/* LAYER 3: Interactive UI */}
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* ── Header ── */}
          <Animated.View entering={FadeInDown.duration(1000)} style={styles.header}>
            <View>
              <Text style={styles.greeting}>
                {userChart.name || 'Welcome'}
              </Text>
              <Text style={styles.dateLabel}>
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </View>
            <Pressable
              onPress={() => router.push('/settings' as Href)}
              style={styles.profileBtn}
            >
              <Ionicons
                name="settings-outline"
                size={24}
                color={theme.textMuted}
              />
            </Pressable>
          </Animated.View>

          {/* ── Unified Aura — Fluid Mood/Energy/Tension Signature ── */}
          <Animated.View
            entering={FadeIn.delay(300).duration(1200)}
            style={styles.auraContainer}
          >
            <SkiaUnifiedAura mood={mood} energy={energy} tension={tension} />
          </Animated.View>

          {/* ── Stability Index Card ── */}
          <Animated.View entering={FadeInDown.delay(500).duration(600)}>
            <SkiaStabilityDashboard data={stabilityData} />
          </Animated.View>

          {/* ── Actionable Insight ── */}
          <Animated.View
            entering={FadeInDown.delay(700).duration(600)}
            style={styles.insightCard}
          >
            <LinearGradient
              colors={['rgba(35, 40, 55, 0.4)', 'rgba(20, 24, 34, 0.7)']}
              style={styles.insightGradient}
            >
              <View style={styles.insightHeader}>
                <Ionicons name="analytics" size={16} color={PALETTE.emerald} />
                <Text style={styles.insightEyebrow}>WELLNESS INSIGHT</Text>
              </View>
              <Text style={styles.insightText}>{insightText}</Text>
            </LinearGradient>
          </Animated.View>

          {/* ── Biometric Quick Actions ── */}
          <Animated.View entering={FadeInDown.delay(850).duration(600)}>
            <Text style={styles.sectionTitle}>Daily Rituals</Text>
          </Animated.View>
          <View style={styles.actionRow}>
            <QuickActionCard
              icon="cloudy"
              label="Weather"
              sublabel="Check in"
              accentColor={PALETTE.gold}
              onPress={() => router.push('/(tabs)/mood' as Href)}
              delay={900}
            />
            <QuickActionCard
              icon="moon"
              label="Restore"
              sublabel="Log sleep"
              accentColor={PALETTE.silverBlue}
              onPress={() => router.push('/(tabs)/sleep' as Href)}
              delay={950}
            />
            <QuickActionCard
              icon="document-text"
              label="Archive"
              sublabel="Reflect"
              accentColor={PALETTE.rose}
              onPress={() => router.push('/(tabs)/journal' as Href)}
              delay={1000}
            />
          </View>

          {/* ── Explore Cards ── */}
          <Animated.View
            entering={FadeInDown.delay(1050).duration(600)}
            style={styles.sectionBlock}
          >
            <Text style={styles.sectionTitle}>Explore</Text>
            <View style={styles.quickLinksRow}>
              <Pressable
                style={styles.quickLink}
                onPress={() => router.push('/(tabs)/story' as Href)}
              >
                <LinearGradient
                  colors={['rgba(35, 40, 55, 0.4)', 'rgba(20, 24, 34, 0.7)']}
                  style={styles.quickLinkGradient}
                >
                  <View style={[styles.quickLinkIconWrap, { backgroundColor: 'rgba(212, 175, 55, 0.15)' }]}>
                    <Ionicons name="compass-outline" size={22} color={PALETTE.gold} />
                  </View>
                  <View style={{ flex: 1, justifyContent: 'center' }}>
                    <Text style={styles.quickLinkTitle}>Architecture</Text>
                    <Text style={styles.quickLinkSub}>Your framework</Text>
                  </View>
                </LinearGradient>
              </Pressable>

              <Pressable
                style={styles.quickLink}
                onPress={() => router.push('/(tabs)/growth' as Href)}
              >
                <LinearGradient
                  colors={['rgba(35, 40, 55, 0.4)', 'rgba(20, 24, 34, 0.7)']}
                  style={styles.quickLinkGradient}
                >
                  <View style={[styles.quickLinkIconWrap, { backgroundColor: 'rgba(110, 191, 139, 0.15)' }]}>
                    <Ionicons name="trending-up-outline" size={22} color={PALETTE.emerald} />
                  </View>
                  <View style={{ flex: 1, justifyContent: 'center' }}>
                    <Text style={styles.quickLinkTitle}>Patterns</Text>
                    <Text style={styles.quickLinkSub}>Track correlations</Text>
                  </View>
                </LinearGradient>
              </Pressable>

              <Pressable
                style={styles.quickLink}
                onPress={() => router.push('/(tabs)/chart' as Href)}
              >
                <LinearGradient
                  colors={['rgba(35, 40, 55, 0.4)', 'rgba(20, 24, 34, 0.7)']}
                  style={styles.quickLinkGradient}
                >
                  <View style={[styles.quickLinkIconWrap, { backgroundColor: 'rgba(139, 196, 232, 0.15)' }]}>
                    <Ionicons name="grid-outline" size={22} color={PALETTE.silverBlue} />
                  </View>
                  <View style={{ flex: 1, justifyContent: 'center' }}>
                    <Text style={styles.quickLinkTitle}>Profile</Text>
                    <Text style={styles.quickLinkSub}>Your blueprint</Text>
                  </View>
                </LinearGradient>
              </Pressable>
            </View>
          </Animated.View>

          {/* ── Premium Teaser ── */}
          {!isPremium && (
            <Animated.View entering={FadeInDown.delay(1100).duration(600)}>
              <Pressable onPress={() => router.push('/(tabs)/premium' as Href)}>
                <LinearGradient
                  colors={[`${PALETTE.gold}15`, 'rgba(20, 24, 34, 0.8)']}
                  style={styles.premiumPreviewCard}
                >
                  <View style={styles.premiumPreviewHeader}>
                    <Ionicons name="sparkles" size={18} color={PALETTE.gold} />
                    <Text style={styles.premiumPreviewLabel}>Deeper Wellness</Text>
                  </View>
                  <Text style={styles.premiumPreviewTitle}>
                    Unlock the full Biometric Correlation Engine
                  </Text>
                  <Text style={styles.premiumPreviewSub}>
                    Advanced pattern analysis, behavioral correlations, somatic breath journaling, and full restoration field analytics.
                  </Text>
                  <View style={styles.premiumPreviewCta}>
                    <Text style={[styles.premiumPreviewCtaText, { color: PALETTE.gold }]}>
                      Explore Deeper Wellness
                    </Text>
                    <Ionicons name="arrow-forward" size={14} color={PALETTE.gold} />
                  </View>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* LAYER 4: Global Warp Overlay */}
      <SkiaWarpTransition ref={warpRef} />

      {/* Birth Data Modal */}
      <BirthDataModal
        visible={showEditBirth}
        onClose={() => setShowEditBirth(false)}
        onSave={handleEditBirthData}
        initialData={{
          date: userChart.birthData.date,
          time: userChart.birthData.time,
          hasUnknownTime: userChart.birthData.hasUnknownTime,
          place: userChart.birthData.place,
          latitude: userChart.birthData.latitude,
          longitude: userChart.birthData.longitude,
          houseSystem: userChart.birthData.houseSystem,
          chartName: userChart.name,
        }}
      />
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07090F' },
  loadingContainer: { justifyContent: 'center', alignItems: 'center' },
  loadingText: {
    color: theme.textSecondary,
    fontStyle: 'italic',
    marginTop: 16,
  },
  safeArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 100 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    color: '#FDFBF7',
    fontSize: 24,
    fontWeight: '700',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  },
  dateLabel: {
    color: theme.textMuted,
    fontSize: 13,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  profileBtn: { opacity: 0.8 },

  // Aura
  auraContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },

  // Insight Card
  insightCard: { marginTop: 20, marginBottom: 28 },
  insightGradient: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
    borderTopColor: PALETTE.glassHighlight,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  insightEyebrow: {
    color: PALETTE.emerald,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  insightText: {
    color: PALETTE.textMain,
    fontSize: 15,
    lineHeight: 24,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  },

  // Quick Actions
  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  actionCard: {
    flex: 1,
    height: 100,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { color: '#FDFBF7', fontSize: 12, fontWeight: '600' },
  actionSublabel: { color: theme.textMuted, fontSize: 10 },

  // Sections
  sectionBlock: { marginBottom: 32 },
  sectionTitle: {
    color: PALETTE.textMain,
    fontSize: 20,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    marginBottom: 16,
    paddingLeft: 4,
  },

  // Quick links
  quickLinksRow: { flexDirection: 'row', gap: 10 },
  quickLink: { flex: 1, borderRadius: 16, overflow: 'hidden' },
  quickLinkGradient: {
    padding: 12,
    alignItems: 'flex-start',
    height: 110,
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
    borderRadius: 16,
  },
  quickLinkIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  quickLinkTitle: {
    color: PALETTE.textMain,
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 2,
  },
  quickLinkSub: { color: theme.textMuted, fontSize: 11 },

  // Premium preview
  premiumPreviewCard: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
    borderTopColor: PALETTE.glassHighlight,
    marginBottom: 32,
  },
  premiumPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  premiumPreviewLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.gold,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    flex: 1,
  },
  premiumPreviewTitle: {
    fontSize: 20,
    color: PALETTE.textMain,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    lineHeight: 28,
    marginBottom: 8,
  },
  premiumPreviewSub: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 22,
    marginBottom: 16,
  },
  premiumPreviewCta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  premiumPreviewCtaText: { fontSize: 14, fontWeight: '600' },
});

