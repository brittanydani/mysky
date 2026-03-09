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
import { usePremium } from '../../context/PremiumContext';\nimport { SkeletonLine, SkeletonCard } from '../../components/ui/SkeletonLoader';

const { width } = Dimensions.get('window');

// ── Cinematic Palette ──
const PALETTE = {
  gold: '#C9AE78',
  silverBlue: '#8BC4E8',
  copper: '#CD7F5D',
  emerald: '#6EBF8B',
  rose: '#D4A3B3',
  textMain: '#FFFFFF',
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

  // ── Stability Dashboard ──

  return (
    <View style={styles.container}>
      {/* LAYER 1: Atmospheric Shader — turbulence driven by energy, color by transits */}

      {/* REPLACEMENT: Subtle, drifting cosmic field */}
      <SkiaDynamicCosmos />

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
          </Animated.View>

          {/* ── Streak Row ── */}
          {dailyLoop && dailyLoop.streak.current > 0 && (
            <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.streakRow}>
              <View style={styles.streakPill}>
                <Ionicons name="flame" size={16} color={PALETTE.gold} />
                <Text style={styles.streakCount}>{dailyLoop.streak.current}</Text>
                <Text style={styles.streakLabel}>day streak</Text>
              </View>
              {dailyLoop.streak.milestone && (
                <View style={[styles.streakPill, { backgroundColor: `${PALETTE.gold}18` }]}>
                  <Ionicons name="trophy" size={14} color={PALETTE.gold} />
                  <Text style={[styles.streakLabel, { color: PALETTE.gold }]}>Milestone!</Text>
                </View>
              )}
              {dailyLoop.streak.checkedInToday && (
                <View style={[styles.streakPill, { backgroundColor: `${PALETTE.emerald}15` }]}>
                  <Ionicons name="checkmark-circle" size={14} color={PALETTE.emerald} />
                  <Text style={[styles.streakLabel, { color: PALETTE.emerald }]}>Today</Text>
                </View>
              )}
            </Animated.View>
          )}

          {/* ── Return Nudge ── */}
          {dailyLoop?.returnNudge && (
            <Animated.View entering={FadeInDown.delay(250).duration(600)}>
              <Pressable
                onPress={() => router.push(dailyLoop.returnNudge!.ctaRoute as Href)}
                style={[
                  styles.nudgeCard,
                  dailyLoop.returnNudge.urgency === 'motivating' && { borderColor: `${PALETTE.gold}30` },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.nudgeText}>{dailyLoop.returnNudge.text}</Text>
                </View>
                <View style={styles.nudgeCta}>
                  <Text style={styles.nudgeCtaText}>{dailyLoop.returnNudge.ctaLabel}</Text>
                  <Ionicons name="arrow-forward" size={14} color={PALETTE.gold} />
                </View>
              </Pressable>
            </Animated.View>
          )}

          {/* ── Stability Index Card ── */}
          <Animated.View entering={FadeInDown.delay(500).duration(600)}>
            <SkiaStabilityDashboard data={stabilityData} />
          </Animated.View>

          {/* ── Actionable Insight ── */}
          <Animated.View
            entering={FadeInDown.delay(700).duration(600)}
            style={styles.insightCard}
          >
            <View style={styles.insightGradient}>
              <View style={styles.insightHeader}>
                <Ionicons name={insightIcon as any} size={16} color={insightAccent} />
                <Text style={[styles.insightEyebrow, { color: insightAccent }]}>
                  {dailyLoop?.todayInsight?.type === 'milestone'
                    ? 'MILESTONE'
                    : dailyLoop?.todayInsight?.type === 'sleep-mood'
                      ? 'SLEEP–MOOD LINK'
                      : dailyLoop?.todayInsight?.type === 'pattern'
                        ? 'PATTERN NOTICED'
                        : 'DAILY REFLECTION'}
                </Text>
              </View>
              <Text style={styles.insightText}>{insightText}</Text>
            </View>
          </Animated.View>

          {/* ── Weekly Reflection ── */}
          {dailyLoop?.weeklyReflection?.hasEnoughData && (
            <Animated.View
              entering={FadeInDown.delay(800).duration(600)}
              style={styles.weeklyCard}
            >
              <View style={styles.weeklyGradient}>
                <View style={styles.insightHeader}>
                  <Ionicons name="calendar-outline" size={16} color={PALETTE.silverBlue} />
                  <Text style={[styles.insightEyebrow, { color: PALETTE.silverBlue }]}>THIS WEEK</Text>
                  {dailyLoop.weeklyReflection.moodDirection === 'up' && (
                    <View style={styles.trendBadge}>
                      <Ionicons name="trending-up" size={12} color={PALETTE.emerald} />
                    </View>
                  )}
                  {dailyLoop.weeklyReflection.moodDirection === 'down' && (
                    <View style={styles.trendBadge}>
                      <Ionicons name="trending-down" size={12} color={PALETTE.copper} />
                    </View>
                  )}
                </View>

                <Text style={styles.weeklySummaryText}>
                  {dailyLoop.weeklyReflection.summary}
                </Text>

                {/* Metric chips */}
                <View style={styles.weeklyMetrics}>
                  <View style={styles.metricChip}>
                    <Text style={styles.metricValue}>{dailyLoop.weeklyReflection.avgMood.toFixed(1)}</Text>
                    <Text style={styles.metricLabel}>Mood</Text>
                  </View>
                  {dailyLoop.weeklyReflection.avgSleep > 0 && (
                    <View style={styles.metricChip}>
                      <Text style={styles.metricValue}>{dailyLoop.weeklyReflection.avgSleep.toFixed(1)}h</Text>
                      <Text style={styles.metricLabel}>Sleep</Text>
                    </View>
                  )}
                  <View style={styles.metricChip}>
                    <Text style={styles.metricValue}>{dailyLoop.weeklyReflection.checkInCount}</Text>
                    <Text style={styles.metricLabel}>Check-ins</Text>
                  </View>
                  {dailyLoop.weeklyReflection.journalCount > 0 && (
                    <View style={styles.metricChip}>
                      <Text style={styles.metricValue}>{dailyLoop.weeklyReflection.journalCount}</Text>
                      <Text style={styles.metricLabel}>Journals</Text>
                    </View>
                  )}
                </View>
              </View>
            </Animated.View>
          )}

          {/* ── Gentle CTA when not enough data ── */}
          {dailyLoop && !dailyLoop.weeklyReflection.hasEnoughData && dailyLoop.weeklyReflection.checkInCount > 0 && (
            <Animated.View entering={FadeInDown.delay(800).duration(600)} style={styles.weeklyCard}>
              <View style={styles.weeklyGradient}>
                <View style={styles.insightHeader}>
                  <Ionicons name="sparkles-outline" size={16} color={PALETTE.gold} />
                  <Text style={[styles.insightEyebrow, { color: PALETTE.gold }]}>WEEKLY REFLECTION</Text>
                </View>
                <Text style={styles.weeklySummaryText}>
                  {dailyLoop.weeklyReflection.summary}
                </Text>
              </View>
            </Animated.View>
          )}

          {/* ── Premium Teaser ── */}
          {!isPremium && (
            <Animated.View entering={FadeInDown.delay(1050).duration(600)}>
              <Pressable onPress={() => router.push('/(tabs)/premium' as Href)}>
                <View style={styles.premiumPreviewCard}>
                  <View style={styles.premiumPreviewHeader}>
                    <Ionicons name="sparkles" size={18} color={PALETTE.gold} />
                    <Text style={styles.premiumPreviewLabel}>Deeper Insight</Text>
                  </View>
                  <Text style={styles.premiumPreviewTitle}>
                    Unlock the full Personal Reflection Engine
                  </Text>
                  <Text style={styles.premiumPreviewSub}>
                    Extended pattern reflections, personal connections, guided breath journaling, and full sleep pattern insights.
                  </Text>
                  <View style={styles.premiumPreviewCta}>
                    <Text style={[styles.premiumPreviewCtaText, { color: PALETTE.gold }]}>
                      Explore Deeper Insight
                    </Text>
                    <Ionicons name="arrow-forward" size={14} color={PALETTE.gold} />
                  </View>
                </View>
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
  container: { flex: 1, backgroundColor: '#020817' },
  loadingContainer: { justifyContent: 'center', alignItems: 'center' },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.9)',
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
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  },
  dateLabel: {
    color: 'rgba(255, 255, 255, 0.45)', // further muted
    fontSize: 13,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
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
  quickLinkSub: { color: 'rgba(255, 255, 255, 0.85)', fontSize: 11 },

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
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 22,
    marginBottom: 16,
  },
  premiumPreviewCta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  premiumPreviewCtaText: { fontSize: 14, fontWeight: '600' },

  // Streak
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingLeft: 4,
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  streakCount: {
    color: PALETTE.gold,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  },
  streakLabel: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Return nudge
  nudgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    gap: 12,
  },
  nudgeText: {
    color: PALETTE.textMain,
    fontSize: 14,
    lineHeight: 20,
  },
  nudgeCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${PALETTE.gold}15`,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  nudgeCtaText: {
    color: PALETTE.gold,
    fontSize: 12,
    fontWeight: '700',
  },

  // Weekly reflection
  weeklyCard: { marginBottom: 28 },
  weeklyGradient: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
    borderTopColor: PALETTE.glassHighlight,
  },
  weeklySummaryText: {
    color: PALETTE.textMain,
    fontSize: 14,
    lineHeight: 22,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  },
  weeklyMetrics: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  metricChip: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  metricValue: {
    color: PALETTE.textMain,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  },
  metricLabel: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  trendBadge: {
    marginLeft: 'auto',
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 4,
  },
});
