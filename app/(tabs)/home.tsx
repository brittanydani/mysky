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
import {
  Canvas,
  Path,
  Skia,
  LinearGradient as SkiaLinearGradient,
  Circle,
  BlurMask,
  vec,
} from '@shopify/react-native-skia';
import { useRouter, Href } from 'expo-router';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from '@react-navigation/core';


// ── Custom Skia Suite ──
import { SkiaDynamicCosmos } from '../../components/ui/SkiaDynamicCosmos';
import SkiaWarpTransition from '../../components/ui/SkiaWarpTransition';
import type { WarpRef } from '../../components/ui/SkiaWarpTransition';

import BirthDataModal from '../../components/BirthDataModal';
import { localDb } from '../../services/storage/localDb';
import { NatalChart, BirthData } from '../../services/astrology/types';
import { DailyCheckIn } from '../../services/patterns/types';
import { AstrologyCalculator } from '../../services/astrology/calculator';
import { AstrologySettingsService } from '../../services/astrology/astrologySettingsService';
import { getDailyLoopData, DailyLoopData } from '../../services/today/dailyLoop';
import { loadSelfKnowledgeContext } from '../../services/insights/selfKnowledgeContext';
import { logger } from '../../utils/logger';
import { EncryptedAsyncStorage } from '../../services/storage/encryptedAsyncStorage';
import { usePremium } from '../../context/PremiumContext';
import { MetallicIcon } from '../../components/ui/MetallicIcon';
import { MetallicText } from '../../components/ui/MetallicText';

const { width } = Dimensions.get('window');

// ── Cinematic Palette ──
const PALETTE = {
  gold: '#C9AE78',
  silverBlue: '#C9AE78',
  copper: '#CD7F5D',
  emerald: '#C9AE78',
  rose: '#D4A3B3',
  bg: '#0A0A0C',
  textMain: '#FFFFFF',
  glassBorder: 'rgba(255,255,255,0.08)',
  glassHighlight: 'rgba(255,255,255,0.12)',
};

// ── Balance Score Lookup Tables ──────────────────────────────────────────────
// Pre-defined at module level to avoid re-creation inside useMemo.

// Mood: 1–10 scale
const MOOD_POINTS: Record<number, number> = {
  1: 0, 2: 1, 3: 2.5, 4: 3.5, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 10: 10,
};

// Energy: only 3 discrete values (low=3, medium=5, high=8)
const ENERGY_POINTS: Record<number, number> = {
  3: 1.5, 5: 5, 8: 9,
};

// Sleep: hours → points — harsh under 6h (real impairment territory)
const SLEEP_POINTS: [number, number][] = [
  [0, 0], [4, 0], [5, 2], [6, 5], [7, 8], [8, 9], [9, 10], [10, 10],
];

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

// ── Insight accent color mapping ──
const ACCENT_MAP: Record<string, string> = {
  gold: PALETTE.gold,
  emerald: PALETTE.emerald,
  silverBlue: PALETTE.silverBlue,
  copper: PALETTE.copper,
  rose: PALETTE.rose,
};

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

  const [latestSleep, setLatestSleep] = useState(7);

  // Weekly check-ins — used by 7-day Stability Map
  const [weeklyCheckIns, setWeeklyCheckIns] = useState<DailyCheckIn[]>([]);

  // True only when a check-in exists for today's date
  const hasDataToday = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return weeklyCheckIns.some(c => c.date === today);
  }, [weeklyCheckIns]);

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
          const astroSettings = await AstrologySettingsService.getSettings();
          const birthData = {
            date: savedChart.birthDate,
            time: savedChart.birthTime,
            hasUnknownTime: savedChart.hasUnknownTime,
            place: savedChart.birthPlace,
            latitude: savedChart.latitude,
            longitude: savedChart.longitude,
            timezone: savedChart.timezone,
            houseSystem: savedChart.houseSystem,
            zodiacSystem: astroSettings.zodiacSystem,
            orbPreset: astroSettings.orbPreset,
          };

          const chart = AstrologyCalculator.generateNatalChart(birthData);
          chart.id = savedChart.id;
          chart.name = savedChart.name;
          chart.createdAt = savedChart.createdAt;

          // Prefer the user's actual name over the chart name (which defaults to birth place)
          const storedName = await EncryptedAsyncStorage.getItem('msky_user_name');
          if (storedName) chart.name = storedName;
          chart.updatedAt = savedChart.updatedAt;

          setUserChart(chart);

          // Hydrate data in parallel — checkins, sleep, and self-knowledge are independent
          try {
            const [checkins, sleepEntries, selfKnowledge] = await Promise.all([
              localDb.getCheckIns(chart.id, 7),
              localDb.getSleepEntries(chart.id, 7),
              loadSelfKnowledgeContext(),
            ]);

            setWeeklyCheckIns(checkins);
            if (checkins.length > 0) {
              const latest = checkins[0];
              if (latest.moodScore != null) setMood(latest.moodScore);
              const energyMap: Record<string, number> = { low: 3, medium: 5, high: 8 };
              if (latest.energyLevel) setEnergy(energyMap[latest.energyLevel] ?? 5);
            }

            if (sleepEntries.length > 0 && sleepEntries[0].durationHours != null) {
              setLatestSleep(sleepEntries[0].durationHours);
            }

            try {
              const loopData = await getDailyLoopData(chart.id, selfKnowledge);
              setDailyLoop(loopData);
            } catch (err) {
              logger.error('Daily loop data failed:', err);
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
      const astroSettings = await AstrologySettingsService.getSettings();
      const chart = AstrologyCalculator.generateNatalChart({ ...birthData, zodiacSystem: astroSettings.zodiacSystem, orbPreset: astroSettings.orbPreset });

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

  const insightIcon = dailyLoop?.todayInsight?.icon ?? 'analytics';
  const insightAccent = ACCENT_MAP[dailyLoop?.todayInsight?.accentColor ?? 'emerald'] ?? PALETTE.emerald;

  // ── Balance Score + Stability Map ──

  const balanceScore = useMemo(() => {
    const moodPts = MOOD_POINTS[Math.round(mood)] ?? mood;
    const energyPts = ENERGY_POINTS[Math.round(energy)] ?? energy;

    // Linearly interpolate the sleep curve
    const clampedSleep = Math.min(Math.max(latestSleep, 0), 10);
    let sleepPts = 0;
    for (let i = 1; i < SLEEP_POINTS.length; i++) {
      const [h0, p0] = SLEEP_POINTS[i - 1];
      const [h1, p1] = SLEEP_POINTS[i];
      if (clampedSleep <= h1) {
        const t = (clampedSleep - h0) / (h1 - h0);
        sleepPts = p0 + t * (p1 - p0);
        break;
      }
    }

    // Weighted average: sleep 40%, mood 35%, energy 25%
    // Sleep drives both mood and energy; energy is the coarsest signal.
    const weighted = sleepPts * 0.40 + moodPts * 0.35 + energyPts * 0.25;

    // Critical-low cap: if any single metric is ≤ 1 point, the total
    // score can't exceed 4 — you're not "balanced" when one pillar fails.
    const lowestPts = Math.min(moodPts, energyPts, sleepPts);
    const capped = lowestPts <= 1 ? Math.min(weighted, 4) : weighted;

    return Math.round(capped * 10) / 10;
  }, [mood, energy, latestSleep]);

  // Prefer daily loop insight; fall back to legacy insight engine
  const insightText = useMemo(() => {
    if (dailyLoop?.todayInsight?.text) return dailyLoop.todayInsight.text;
    return generateInsight(Math.round(balanceScore * 10), mood, energy, latestSleep);
  }, [dailyLoop, balanceScore, mood, energy, latestSleep]);

  /** Pixel heights (max ~120px) for each of the past 7 days, oldest → today */
  const stabilityBars = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      const dateStr = d.toISOString().split('T')[0];
      const ci = weeklyCheckIns.find(c => c.date === dateStr);
      return ci ? Math.round((ci.moodScore / 10) * 108) + 12 : 12;
    });
  }, [weeklyCheckIns]);

  const stabilityDayLabels = useMemo(() => {
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const todayIndex = new Date().getDay();
    return Array.from({ length: 7 }, (_, i) => days[(todayIndex - 6 + i + 7) % 7]);
  }, []);

  // ── Loading / Onboarding Gates ──

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <SkiaDynamicCosmos />
        <Text style={styles.loadingText}>Preparing your reflections...</Text>
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

      {/* Nebula depth — atmospheric glow orbs */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={[styles.glowOrb, { top: -60, right: -60, backgroundColor: 'rgba(110, 140, 180, 0.12)' }]} />
        <View style={[styles.glowOrb, { bottom: 160, left: -120, backgroundColor: 'rgba(217, 191, 140, 0.06)' }]} />
      </View>

      {/* LAYER 3: Interactive UI */}
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* ── Hub Header: Balance Greeting + Aura ── */}
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
                <MetallicIcon name="flame-outline" size={16} variant="gold" />
                <MetallicText style={styles.streakCount} variant="gold">{dailyLoop.streak.current}</MetallicText>
                <Text style={styles.streakLabel}>day streak</Text>
              </View>
              {dailyLoop.streak.milestone && (
                <View style={[styles.streakPill, { backgroundColor: `${PALETTE.gold}18` }]}>
                  <MetallicIcon name="trophy-outline" size={14} variant="gold" />
                  <MetallicText style={styles.streakLabel} variant="gold">Milestone!</MetallicText>
                </View>
              )}
              {dailyLoop.streak.checkedInToday && (
                <View style={[styles.streakPill, { backgroundColor: `${PALETTE.emerald}15` }]}>
                  <MetallicIcon name="checkmark-circle-outline" size={14} variant="green" />
                  <MetallicText style={styles.streakLabel} variant="green">Today</MetallicText>
                </View>
              )}
            </Animated.View>
          )}

          {/* ── Daily Balance Score ── */}
          <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.scoreCard}>
            <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={styles.scoreHeader}>
              <Text style={styles.cardLabel}>DAILY BALANCE</Text>
              <View style={styles.trendBadgeScore}>
                <MetallicIcon name="trending-up-outline" size={12} color="#8CBEAA" />
                <MetallicText style={styles.trendTextScore} color="#8CBEAA">Score</MetallicText>
              </View>
            </View>
            {hasDataToday ? (
              <>
                <View style={styles.scoreMain}>
                  <Text style={styles.scoreValue}>{balanceScore.toFixed(1)}</Text>
                  <Text style={styles.scoreMax}>/ 10</Text>
                </View>
                <View style={styles.pillsRow}>
                  <ScorePill label="Sleep" val={`${latestSleep % 1 === 0 ? Math.floor(latestSleep) : latestSleep.toFixed(1)}h`} color="#C9AE78" />
                  <ScorePill label="Mood" val={mood.toFixed(1)} color="#D9BF8C" />
                  <ScorePill label="Energy" val={energy.toFixed(1)} color="#D98C8C" />
                </View>
              </>
            ) : (
              <View style={styles.scoreMain}>
                <Text style={styles.noDataText}>No data yet</Text>
              </View>
            )}
          </Animated.View>

          {/* ── 7-Day Internal Weather ── */}
          <Animated.View entering={FadeInDown.delay(550).duration(600)} style={styles.graphCard}>
            <View style={styles.graphCardHeader}>
              <Text style={styles.cardLabel}>INTERNAL WEATHER</Text>
              <View style={styles.graphBadge}>
                <Text style={styles.graphBadgeText}>7 DAYS</Text>
              </View>
            </View>
            <MoodTrendGraph bars={stabilityBars} dayLabels={stabilityDayLabels} />
          </Animated.View>

          {/* ── Actionable Insight ── */}
          <Animated.View
            entering={FadeInDown.delay(700).duration(600)}
            style={styles.insightCard}
          >
            <View style={styles.insightGradient}>
              <View style={styles.insightHeader}>
                <MetallicIcon name={insightIcon as any} size={16} color={insightAccent} />
                <MetallicText style={styles.insightEyebrow} color={insightAccent}>
                  {dailyLoop?.todayInsight?.type === 'milestone'
                    ? 'MILESTONE'
                    : dailyLoop?.todayInsight?.type === 'sleep-mood'
                      ? 'SLEEP–MOOD LINK'
                      : dailyLoop?.todayInsight?.type === 'pattern'
                        ? 'PATTERN NOTICED'
                        : 'DAILY REFLECTION'}
                </MetallicText>
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
                  <MetallicIcon name="calendar-outline" size={16} variant="gold" />
                  <MetallicText style={styles.insightEyebrow} variant="gold">THIS WEEK</MetallicText>
                  {dailyLoop.weeklyReflection.moodDirection === 'up' && (
                    <View style={styles.trendBadge}>
                      <MetallicIcon name="trending-up-outline" size={12} variant="green" />
                    </View>
                  )}
                  {dailyLoop.weeklyReflection.moodDirection === 'down' && (
                    <View style={styles.trendBadge}>
                      <MetallicIcon name="trending-down-outline" size={12} variant="copper" />
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
                  <MetallicIcon name="sparkles-outline" size={16} variant="gold" />
                  <MetallicText style={styles.insightEyebrow} variant="gold">WEEKLY REFLECTION</MetallicText>
                </View>
                <Text style={styles.weeklySummaryText}>
                  {dailyLoop.weeklyReflection.summary}
                </Text>
              </View>
            </Animated.View>
          )}

          {/* ── Premium Teaser ── */}
          {!isPremium && (
            <Animated.View entering={FadeInDown.delay(1100).duration(600)}>
              <Pressable onPress={() => router.push('/(tabs)/premium' as Href)}>
                <View style={styles.premiumPreviewCard}>
                  <View style={styles.premiumPreviewHeader}>
                    <MetallicIcon name="sparkles-outline" size={18} variant="gold" />
                    <MetallicText style={styles.premiumPreviewLabel} variant="gold">Deeper Insight</MetallicText>
                  </View>
                  <Text style={styles.premiumPreviewTitle}>
                    Unlock the full Personal Reflection Engine
                  </Text>
                  <Text style={styles.premiumPreviewSub}>
                    Extended pattern reflections, personal connections, guided breath journaling, and full sleep pattern insights.
                  </Text>
                  <View style={styles.premiumPreviewCta}>
                    <MetallicText style={styles.premiumPreviewCtaText} variant="gold">
                      Explore Deeper Insight
                    </MetallicText>
                    <MetallicIcon name="arrow-forward-outline" size={14} variant="gold" />
                  </View>
                </View>
              </Pressable>
            </Animated.View>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* LAYER 4: Luminous Check-In FAB */}
      <CheckInFAB />

      {/* LAYER 5: Global Warp Overlay */}
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

// ── Mood Trend Graph ─────────────────────────────────────────────────────────

function MoodTrendGraph({ bars, dayLabels }: { bars: number[]; dayLabels: string[] }) {
  // Canvas spans full card width (card has paddingHorizontal:24, scrollview has paddingHorizontal:24)
  // So card inner width = screen width - 48. We negate card padding so canvas goes edge-to-edge.
  const CANVAS_W = width - 48;
  const CANVAS_H = 160;
  const PAD_T = 20;
  const PAD_B = 30;
  const PAD_X = 16;
  const plotH = CANVAS_H - PAD_T - PAD_B;
  const plotW = CANVAS_W - PAD_X * 2;
  const baseY = PAD_T + plotH;

  const hasData = useMemo(() => bars.map(b => b > 12), [bars]);
  const normalized = useMemo(() => bars.map(b => (b - 12) / 108), [bars]);

  const pts = useMemo(
    () => normalized.map((n, i) => ({
      x: PAD_X + (i / 6) * plotW,
      y: PAD_T + plotH * (1 - Math.max(n, 0)),
    })),
    [normalized, plotW, plotH],
  );

  const { linePath, fillPath } = useMemo(() => {
    const lp = Skia.Path.Make();
    lp.moveTo(pts[0].x, pts[0].y);
    for (let i = 0; i < pts.length - 1; i++) {
      const dx = (pts[i + 1].x - pts[i].x) * 0.45;
      lp.cubicTo(pts[i].x + dx, pts[i].y, pts[i + 1].x - dx, pts[i + 1].y, pts[i + 1].x, pts[i + 1].y);
    }
    const fp = lp.copy();
    fp.lineTo(pts[pts.length - 1].x, baseY);
    fp.lineTo(pts[0].x, baseY);
    fp.close();
    return { linePath: lp, fillPath: fp };
  }, [pts, baseY]);

  return (
    // Negative margin cancels card's paddingHorizontal so canvas reaches card edges
    <View style={{ marginHorizontal: -24 }}>
      <Canvas style={{ width: CANVAS_W, height: CANVAS_H }}>
        {/* Area fill */}
        <Path path={fillPath} style="fill">
          <SkiaLinearGradient
            start={vec(CANVAS_W / 2, PAD_T)}
            end={vec(CANVAS_W / 2, baseY)}
            colors={['rgba(201,174,120,0.22)', 'rgba(201,174,120,0.0)']}
          />
        </Path>
        {/* Glow halo */}
        <Path path={linePath} color="rgba(201,174,120,0.2)" style="stroke" strokeWidth={10}>
          <BlurMask blur={10} style="normal" />
        </Path>
        {/* Main line */}
        <Path path={linePath} color="rgba(201,174,120,0.85)" style="stroke" strokeWidth={2} />
        {/* Data point dots */}
        {pts.map((pt, i) => (
          <React.Fragment key={i}>
            {i === 6 && hasData[i] && (
              <Circle cx={pt.x} cy={pt.y} r={10} color="rgba(201,174,120,0.14)">
                <BlurMask blur={6} style="normal" />
              </Circle>
            )}
            <Circle
              cx={pt.x}
              cy={pt.y}
              r={i === 6 ? 4.5 : hasData[i] ? 2.5 : 1.5}
              color={i === 6 ? '#C9AE78' : hasData[i] ? 'rgba(201,174,120,0.55)' : 'rgba(255,255,255,0.1)'}
            />
          </React.Fragment>
        ))}
      </Canvas>
      {/* Day labels sit below canvas, aligned to dot positions */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingHorizontal: PAD_X,
          marginTop: -24,
          paddingBottom: 8,
        }}
      >
        {dayLabels.map((label, i) => (
          <Text
            key={i}
            style={{
              fontSize: 10,
              color: i === 6 ? 'rgba(201,174,120,0.85)' : 'rgba(255,255,255,0.28)',
              fontWeight: '700',
              width: 20,
              textAlign: 'center',
            }}
          >
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
}

// ── Score Pill ──────────────────────────────────────────────────────────────

function ScorePill({ label, val, color }: { label: string; val: string; color: string }) {
  return (
    <View style={styles.pill}>
      <View style={[styles.pillDot, { backgroundColor: color }]} />
      <Text style={styles.pillLabel}>{label}</Text>
      <Text style={styles.pillVal}>{val}</Text>
    </View>
  );
}

// ── Luminous Check-In FAB ────────────────────────────────────────────────────

function CheckInFAB() {
  const router = useRouter();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPressIn={() => { scale.value = withSpring(0.88, { mass: 0.5, damping: 12 }); }}
      onPressOut={() => { scale.value = withSpring(1, { mass: 0.5, damping: 12 }); }}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        router.push('/checkin' as Href);
      }}
      style={fabStyles.container}
      accessibilityLabel="Log check-in"
      accessibilityRole="button"
    >
      <Animated.View style={[fabStyles.glowWrapper, animatedStyle]}>
        <BlurView intensity={60} tint="dark" style={fabStyles.glassCircle}>
          <MetallicIcon name="add-outline" size={28} variant="gold" />
        </BlurView>
      </Animated.View>
    </Pressable>
  );
}

const fabStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 120,
    right: 24,
    zIndex: 100,
  },
  glowWrapper: {
    shadowColor: '#D4B872',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 12,
  },
  glassCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 244, 214, 0.18)',
    overflow: 'hidden',
  },
});

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
    marginBottom: 24,
  },
  balanceAura: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(212, 184, 114, 0.2)',
    borderWidth: 1,
    borderColor: PALETTE.gold,
  },
  greeting: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '300',
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
    fontWeight: '400',
    lineHeight: 28,
    marginBottom: 8,
  },
  premiumPreviewSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
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
    fontVariant: ['tabular-nums'] as const,
  },
  streakLabel: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    fontVariant: ['tabular-nums'] as const,
  },
  metricLabel: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  trendBadge: {
    marginLeft: 'auto',
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 4,
  },

  // Nebula background glow orbs
  glowOrb: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    opacity: 0.6,
  },

  // Daily Balance Score card
  cardLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  scoreCard: {
    padding: 24,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 16,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  trendBadgeScore: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(140, 190, 170, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  trendTextScore: {
    color: '#8CBEAA',
    fontSize: 11,
    fontWeight: '700',
  },
  scoreMain: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  scoreValue: {
    fontSize: 60,
    color: '#FFFFFF',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  },
  noDataText: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.4)',
    fontStyle: 'italic',
    marginBottom: 20,
  },
  scoreMax: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.3)',
    marginLeft: 8,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 14,
    gap: 4,
  },
  pillDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  pillLabel: {
    fontSize: 8,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    fontWeight: '700',
    flex: 1,
  },
  pillVal: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // 7-Day Internal Weather
  graphCard: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 16,
    overflow: 'hidden',
  },
  graphCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  graphBadge: {
    backgroundColor: 'rgba(201,174,120,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  graphBadgeText: {
    fontSize: 9,
    color: 'rgba(201,174,120,0.7)',
    fontWeight: '700',
    letterSpacing: 1.5,
  },

  // Explore Blueprint section
  sectionBlock: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '300',
    color: '#FFFFFF',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    marginBottom: 12,
  },
  quickLinksRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickLink: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  quickLinkGradient: {
    padding: 14,
    gap: 10,
    alignItems: 'center',
  },
  quickLinkIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickLinkTitle: {
    fontSize: 13,
    fontWeight: '400',
    color: '#FFFFFF',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    textAlign: 'center',
  },
  quickLinkSub: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginTop: 2,
  },

  // Insight card CTA
  actionBtnText: {
    color: PALETTE.bg,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
