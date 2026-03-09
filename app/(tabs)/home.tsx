// File: app/(tabs)/home.tsx
// MySky — The Balance Dashboard
//
// Daily reflection dashboard. Shows a Balance Score derived from
// self-reported Sleep, Mood, and Energy check-ins.
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
import { SkiaGradient as LinearGradient } from '../../components/ui/SkiaGradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Href } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/core';


// ── Custom Skia Suite ──
import { SkiaDynamicCosmos } from '../../components/ui/SkiaDynamicCosmos';
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
import { getDailyLoopData, DailyLoopData } from '../../services/today/dailyLoop';
import { config } from '../../constants/config';
import { logger } from '../../utils/logger';
import { parseLocalDate } from '../../utils/dateUtils';
import { usePremium } from '../../context/PremiumContext';
import { SkeletonLine, SkeletonCard } from '../../components/ui/SkeletonLoader';

const { width } = Dimensions.get('window');

// ── Cinematic Palette ──
const PALETTE = {
  gold: '#C9AE78',
  silverBlue: '#8BC4E8',
  copper: '#CD7F5D',
  emerald: '#6EBF8B',
  rose: '#D4A3B3',
  textMain: '#FFFFFF',
  textMuted: 'rgba(255,255,255,0.45)',
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
    return `Your stability is ${stabilityIndex}% today. Your emotional weather is heavy. A gentle breathing pause could help re-center your inner landscape.`;
  }
  return `Your stability is ${stabilityIndex}% today. Small adjustments to rest and movement could shift your coherence toward alignment.`;
}

// ── Time-aware greeting ──
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

// ── Stability badge colors ──
const STABILITY_BADGE_COLORS: Record<string, string> = {
  Aligned: '#7DEBDB',
  Coherent: '#7DEBDB',
  Turbulent: '#D4832A',
  Depleted: '#A286F2',
  Recovering: '#A286F2',
};

// ── Stability badge display labels ──────────────────────────────────────────
const STABILITY_BADGE_LABELS: Record<string, string> = {
  Aligned: 'ALIGNED',
  Coherent: 'ALIGNED',
  Turbulent: 'TENSE',
  Depleted: 'DYSREGULATED',
  Recovering: 'RECOVERING',
};

// ── Stability one-line interpretation ────────────────────────────────────────
function getStabilityInterpretation(label: string): string {
  switch (label) {
    case 'Aligned':
    case 'Coherent':
      return 'Your mood, energy, and sleep are moving together this week.';
    case 'Turbulent':
      return 'Energy is rising while sleep is dropping. Your system may be compensating.';
    case 'Depleted':
      return 'Your recent signals suggest tension between activation and recovery.';
    case 'Recovering':
      return 'Your system is settling. Consistency is building momentum.';
    default:
      return 'Your patterns are coming into focus. Keep checking in.';
  }
}

// ── Daily reflective prompts ─────────────────────────────────────────────────
const REFLECTION_PROMPTS: Record<string, string[]> = {
  Aligned: [
    'What do you want more of today?',
    'Where today did you feel most like yourself?',
    'What quiet joy is asking for your attention right now?',
    'What would you like to carry forward from this week?',
  ],
  Coherent: [
    'What do you want more of today?',
    'Where today did you feel most like yourself?',
    'What quiet joy is asking for your attention right now?',
  ],
  Turbulent: [
    "What has your body been carrying that your mind hasn't named yet?",
    'What asked the most from you today?',
    'Where did you give more than you had to give?',
    'What would it feel like to set something down right now?',
  ],
  Depleted: [
    'What does rest look like for you right now?',
    'Which need has been waiting the longest?',
    'What would feel like genuine kindness toward yourself today?',
    'What can you let go of without losing yourself?',
  ],
  Recovering: [
    'What are you slowly returning to?',
    'What feels different now compared to last week?',
    'Where are you beginning to find solid ground again?',
    'What small act of care has been carrying you lately?',
  ],
};

const DEFAULT_PROMPTS = [
  'What is asking for your attention today?',
  'What does your body need that your mind keeps postponing?',
  'Where are you right now — truly?',
];

function getDailyPrompt(stabilityLabel: string): string {
  const prompts = REFLECTION_PROMPTS[stabilityLabel] ?? DEFAULT_PROMPTS;
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000,
  );
  return prompts[dayOfYear % prompts.length];
}

// ── Home Screen ─────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const { isPremium } = usePremium();
  const warpRef = useRef<WarpRef>(null);

  const [userChart, setUserChart] = useState<NatalChart | null>(null);
  const [showEditBirth, setShowEditBirth] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check-in data — used by insight engine
  const [mood, setMood] = useState(7);
  const [energy, setEnergy] = useState(8);

  // Stability data — last 7 days of combined metrics
  const [stabilityData, setStabilityData] = useState<StabilityDataPoint[]>([]);
  const [latestSleep, setLatestSleep] = useState(7);

  // Daily loop — streak, weekly summary, insights, nudge
  const [dailyLoop, setDailyLoop] = useState<DailyLoopData | null>(null);

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

          // Hydrate daily loop (streak, weekly summary, insights)
          try {
            const loopData = await getDailyLoopData(chart.id);
            setDailyLoop(loopData);
          } catch (err) {
            logger.error('Daily loop data failed:', err);
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

  // Prefer daily loop insight; fall back to legacy insight engine
  const insightText = useMemo(() => {
    if (dailyLoop?.todayInsight?.text) return dailyLoop.todayInsight.text;
    return generateInsight(stability.index, mood, energy, latestSleep);
  }, [dailyLoop, stability.index, mood, energy, latestSleep]);

  const insightIcon = dailyLoop?.todayInsight?.icon ?? 'analytics';
  const ACCENT_MAP: Record<string, string> = {
    gold: PALETTE.gold,
    emerald: PALETTE.emerald,
    silverBlue: PALETTE.silverBlue,
    copper: PALETTE.copper,
    rose: PALETTE.rose,
  };
  const insightAccent = ACCENT_MAP[dailyLoop?.todayInsight?.accentColor ?? 'emerald'] ?? PALETTE.emerald;

  // ── Aura color mapping ──
  const auraColor = useMemo(() => {
    if (stability.label === 'Aligned' && mood >= 7) return 'rgba(125, 235, 219, 0.10)'; // aligned cyan
    if (stability.label === 'Aligned') return 'rgba(125, 235, 219, 0.08)';              // aligned cyan soft
    if (stability.label === 'Turbulent') return 'rgba(212, 131, 42, 0.08)';             // turbulent amber
    if (mood <= 4) return 'rgba(162, 134, 242, 0.10)';                                  // depleted lavender
    return 'rgba(162, 134, 242, 0.08)';                                                  // recovering lavender soft
  }, [stability.label, mood]);

  // ── Loading / Onboarding Gates ──

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <SkiaDynamicCosmos />
        <View style={{ paddingHorizontal: 24, paddingTop: 80, gap: 20 }}>
          <SkeletonLine width="45%" height={22} />
          <SkeletonLine width="55%" height={12} />
          <SkeletonCard style={{ marginTop: 12 }} />
          <SkeletonCard />
        </View>
      </View>
    );
  }

  if (!userChart) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <SkiaDynamicCosmos />
        <Text style={styles.loadingText}>Preparing onboarding…</Text>
      </View>
    );
  }

  // ── Derived display values ──
  const badgeLabel = STABILITY_BADGE_LABELS[stability.label] ?? stability.label.toUpperCase();
  const badgeColor = STABILITY_BADGE_COLORS[stability.label] ?? PALETTE.textMuted;
  const stabilityInterpretation = getStabilityInterpretation(stability.label);
  const streak = dailyLoop?.streak.current ?? 0;
  const dailyPrompt = getDailyPrompt(stability.label);
  const weekData = dailyLoop?.weeklyReflection ?? null;

  const dateString = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <View style={styles.container}>
      {/* Background starfield */}
      <SkiaDynamicCosmos />

      {/* Mood-reactive ambient aura */}
      <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
        <View style={[styles.auraGlow, { backgroundColor: auraColor }]} />
      </View>

      {/* Main UI */}
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* ─── 1. HEADER ─────────────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.duration(800)} style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.greeting}>{userChart.name || 'Welcome'}</Text>
              <Text style={styles.dateLabel}>{dateString}</Text>
            </View>
            {streak > 0 && (
              <View style={styles.streakPill}>
                <Ionicons name="flame" size={13} color={PALETTE.gold} />
                <Text style={styles.streakPillText}>{streak}</Text>
                <Text style={styles.streakPillLabel}> day streak</Text>
              </View>
            )}
          </Animated.View>

          {/* ─── 2. STABILITY INDEX CARD ───────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(150).duration(700)} style={styles.cardWrap}>
            <Pressable
              onPress={() => router.push('/(tabs)/daily-synthesis' as Href)}
              style={styles.card}
              accessibilityRole="button"
              accessibilityLabel="Open Stability Index — Daily Context"
            >
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardEyebrow}>STABILITY INDEX</Text>
                  <Text style={styles.cardTitle}>Your daily pulse</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={PALETTE.textMuted} />
              </View>

              {/* Sparklines */}
              <SkiaStabilityDashboard data={stabilityData} />

              {/* Badge + interpretation */}
              <View style={styles.cardDivider} />
              <View style={styles.stabilityFooter}>
                <View
                  style={[
                    styles.badge,
                    { borderColor: (STABILITY_BADGE_COLORS[stability.label] ?? PALETTE.textMuted) + '40' },
                  ]}
                >
                  <View
                    style={[
                      styles.badgeDot,
                      { backgroundColor: badgeColor },
                    ]}
                  />
                  <Text style={[styles.badgeText, { color: badgeColor }]}>
                    {badgeLabel}
                  </Text>
                </View>
                <Text style={styles.stabilityInterpretation} numberOfLines={2}>
                  {stabilityInterpretation}
                </Text>
              </View>
            </Pressable>
          </Animated.View>

          {/* ─── 3. THIS WEEK ──────────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(250).duration(700)} style={styles.cardWrap}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardEyebrow}>THIS WEEK</Text>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {weekData?.hasEnoughData
                      ? weekData.summary
                      : 'Your week at a glance'}
                  </Text>
                </View>
                {weekData?.moodDirection === 'up' && (
                  <Ionicons name="trending-up" size={18} color={PALETTE.emerald} />
                )}
                {weekData?.moodDirection === 'down' && (
                  <Ionicons name="trending-down" size={18} color={PALETTE.copper} />
                )}
              </View>

              {weekData && weekData.checkInCount > 0 ? (
                <>
                  <View style={styles.metricRow}>
                    <View style={styles.metricCell}>
                      <Text style={styles.metricValue}>
                        {weekData.avgMood.toFixed(1)}
                      </Text>
                      <Text style={styles.metricLabel}>Mood Avg</Text>
                    </View>
                    {weekData.avgSleep > 0 && (
                      <View style={styles.metricCell}>
                        <Text style={styles.metricValue}>
                          {weekData.avgSleep.toFixed(1)}h
                        </Text>
                        <Text style={styles.metricLabel}>Sleep Avg</Text>
                      </View>
                    )}
                    <View style={styles.metricCell}>
                      <Text style={styles.metricValue}>{weekData.checkInCount}</Text>
                      <Text style={styles.metricLabel}>Check-ins</Text>
                    </View>
                    {weekData.journalCount > 0 && (
                      <View style={styles.metricCell}>
                        <Text style={styles.metricValue}>{weekData.journalCount}</Text>
                        <Text style={styles.metricLabel}>Journals</Text>
                      </View>
                    )}
                  </View>

                  <Pressable
                    onPress={() => router.push('/(tabs)/journal' as Href)}
                    style={styles.viewPatternsCta}
                    accessibilityRole="button"
                  >
                    <Text style={styles.viewPatternsText}>View patterns</Text>
                    <Ionicons name="arrow-forward" size={12} color={PALETTE.silverBlue} />
                  </Pressable>
                </>
              ) : (
                <Text style={styles.weekEmptyText}>
                  Check in a few times to unlock your weekly snapshot.
                </Text>
              )}
            </View>
          </Animated.View>

          {/* ─── 4. TODAY'S REFLECTION ────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(350).duration(700)} style={styles.cardWrap}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardEyebrow}>TODAY'S REFLECTION</Text>
                  <Text style={styles.cardTitle}>A question for today</Text>
                </View>
                <Ionicons
                  name="moon-outline"
                  size={18}
                  color={PALETTE.silverBlue}
                  style={{ opacity: 0.65 }}
                />
              </View>

              <Text style={styles.reflectionPrompt}>{dailyPrompt}</Text>

              <Pressable
                onPress={() => router.push('/(tabs)/checkin' as Href)}
                style={styles.ctaButton}
                accessibilityRole="button"
              >
                <Ionicons name="create-outline" size={14} color="#0B1220" />
                <Text style={styles.ctaButtonText}>Write Journal</Text>
              </Pressable>
            </View>
          </Animated.View>

          {/* ─── 5. WELL-BEING CHECK ──────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(450).duration(700)} style={styles.cardWrap}>
            <View style={[styles.card, styles.wellBeingCard]}>
              <Ionicons
                name="radio-button-on-outline"
                size={20}
                color={PALETTE.gold}
                style={{ marginBottom: 10 }}
              />
              <Text style={styles.wellBeingTitle}>Well-Being Check</Text>
              <Text style={styles.wellBeingBody}>
                Take a moment to log how you're feeling right now. It only takes 60 seconds.
              </Text>
              <Pressable
                onPress={() => router.push('/(tabs)/checkin' as Href)}
                style={styles.ctaButtonGhost}
                accessibilityRole="button"
              >
                <Text style={styles.ctaButtonGhostText}>Log Mood</Text>
              </Pressable>
            </View>
          </Animated.View>

          {/* ─── Premium teaser ───────────────────────────────────────── */}
          {!isPremium && (
            <Animated.View entering={FadeInDown.delay(550).duration(600)} style={styles.cardWrap}>
              <Pressable
                onPress={() => router.push('/(tabs)/premium' as Href)}
                style={styles.premiumCard}
                accessibilityRole="button"
              >
                <View style={styles.premiumCardHeader}>
                  <Ionicons name="sparkles" size={15} color={PALETTE.gold} />
                  <Text style={styles.premiumCardEyebrow}>DEEPER INSIGHT</Text>
                </View>
                <Text style={styles.premiumCardTitle}>
                  Unlock the full Reflection Engine
                </Text>
                <Text style={styles.premiumCardBody}>
                  Extended pattern reflections, personal connections, and full sleep insights.
                </Text>
                <View style={styles.premiumCardCta}>
                  <Text style={styles.premiumCardCtaText}>Explore Deeper Insight</Text>
                  <Ionicons name="arrow-forward" size={13} color={PALETTE.gold} />
                </View>
              </Pressable>
            </Animated.View>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Global Warp Overlay */}
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
  // ── Shell ──
  container: { flex: 1, backgroundColor: '#020817' },
  loadingContainer: { justifyContent: 'center', alignItems: 'center' },
  loadingText: {
    color: 'rgba(255,255,255,0.9)',
    fontStyle: 'italic',
    marginTop: 16,
  },
  safeArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 120 },
  auraGlow: {
    position: 'absolute',
    top: -80,
    left: '5%',
    width: '90%',
    height: 320,
    borderRadius: 160,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 24,
    paddingTop: 4,
  },
  headerLeft: { flex: 1 },
  greeting: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '700',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    letterSpacing: -0.5,
  },
  dateLabel: {
    color: 'rgba(255,255,255,0.42)',
    fontSize: 12,
    marginTop: 5,
    letterSpacing: 0.5,
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(201,174,120,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(201,174,120,0.20)',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 12,
  },
  streakPillText: {
    color: PALETTE.gold,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  },
  streakPillLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    fontWeight: '500',
  },

  // ── Cards ──
  cardWrap: { marginBottom: 16 },
  card: {
    borderRadius: 22,
    padding: 20,
    backgroundColor: 'rgba(11,18,32,0.70)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    borderTopColor: 'rgba(255,255,255,0.11)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  cardEyebrow: {
    color: 'rgba(255,255,255,0.38)',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    lineHeight: 22,
  },
  cardDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: 14,
  },

  // ── Stability footer ──
  stabilityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  badgeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.8,
  },
  stabilityInterpretation: {
    flex: 1,
    color: 'rgba(255,255,255,0.52)',
    fontSize: 12,
    lineHeight: 17,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  },

  // ── This Week metrics ──
  metricRow: {
    flexDirection: 'row',
    gap: 0,
    marginBottom: 16,
    paddingTop: 4,
  },
  metricCell: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
    paddingVertical: 10,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.06)',
  },
  metricValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  },
  metricLabel: {
    color: 'rgba(255,255,255,0.42)',
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  viewPatternsCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 5,
    paddingTop: 4,
  },
  viewPatternsText: {
    color: PALETTE.silverBlue,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  weekEmptyText: {
    color: 'rgba(255,255,255,0.38)',
    fontSize: 13,
    lineHeight: 20,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    fontStyle: 'italic',
  },

  // ── Today's Reflection ──
  reflectionPrompt: {
    color: '#FFFFFF',
    fontSize: 17,
    lineHeight: 26,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    marginBottom: 20,
    letterSpacing: 0.1,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: PALETTE.gold,
    borderRadius: 999,
    paddingVertical: 13,
    paddingHorizontal: 28,
    alignSelf: 'flex-start',
  },
  ctaButtonText: {
    color: '#0B1220',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // ── Well-Being Check ──
  wellBeingCard: {
    alignItems: 'center',
    paddingVertical: 26,
  },
  wellBeingTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    marginBottom: 8,
  },
  wellBeingBody: {
    color: 'rgba(255,255,255,0.52)',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
    maxWidth: 260,
  },
  ctaButtonGhost: {
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderWidth: 1,
    borderColor: 'rgba(201,174,120,0.35)',
    backgroundColor: 'rgba(201,174,120,0.08)',
  },
  ctaButtonGhostText: {
    color: PALETTE.gold,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // ── Premium card ──
  premiumCard: {
    borderRadius: 22,
    padding: 20,
    backgroundColor: 'rgba(11,18,32,0.70)',
    borderWidth: 1,
    borderColor: 'rgba(201,174,120,0.14)',
    borderTopColor: 'rgba(201,174,120,0.22)',
  },
  premiumCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 12,
  },
  premiumCardEyebrow: {
    color: PALETTE.gold,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
  premiumCardTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    lineHeight: 24,
    marginBottom: 6,
  },
  premiumCardBody: {
    color: 'rgba(255,255,255,0.50)',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 16,
  },
  premiumCardCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  premiumCardCtaText: {
    color: PALETTE.gold,
    fontSize: 13,
    fontWeight: '600',
  },
});
