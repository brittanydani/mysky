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
import { type AppTheme } from '../../constants/theme';
import { useAppTheme, useThemedStyles } from '../../context/ThemeContext';


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
import { getLogicalToday } from '../../services/patterns/checkInService';
import { toLocalDateString } from '../../utils/dateUtils';
import { getDailyAffirmation, PersonalAffirmationContext } from '../../services/today/todayContentLibrary';
import { loadSelfKnowledgeContext, SelfKnowledgeContext } from '../../services/insights/selfKnowledgeContext';
import { enhanceInsightCopy } from '../../services/insights/geminiInsightsService';
import { logger } from '../../utils/logger';
import { EncryptedAsyncStorage } from '../../services/storage/encryptedAsyncStorage';
import { usePremium } from '../../context/PremiumContext';
import { MetallicIcon } from '../../components/ui/MetallicIcon';
import { MetallicText } from '../../components/ui/MetallicText';
import { SkiaGradient as LinearGradient } from '../../components/ui/SkiaGradient';
import { VelvetGlassSurface } from '../../components/ui/VelvetGlassSurface';
import { trackGrowthEvent } from '../../services/growth/localAnalytics';
import { scheduleTransitNotification } from '../../services/astrology/transitNotifications';
import { scheduleInsightNotification } from '../../services/today/insightNotifications';

const { width } = Dimensions.get('window');

// ── Cinematic Palette ──
const PALETTE = {
  gold: '#D4AF37',       // Metallic Champagne Gold (Icons/Text only)
  atmosphere: '#A2C2E1', // Icy Lunar Blue
  midnightSlate: '#2C3645', // Grounding Anchor Slate
  slateDeep: '#1A1E29',  // Anchor Bottom
  nebula: '#A88BEB',     // Subconscious Purple
  emerald: '#6B9080',
  bg: '#0A0A0F',
  textMain: '#FFFFFF',
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
    return `Your stability is ${stabilityIndex}% today. Increasing rest by ${sleepDeficit.toFixed(0)} hours could help stabilise your energy and lift mood coherence.`;
  }
  if (energy < 5) {
    return `Your stability is ${stabilityIndex}% today. Your energy signal is low — consider gentle movement or sunlight exposure to restore your baseline.`;
  }
  if (mood < 4) {
    return `Your stability is ${stabilityIndex}% today. Your emotional weather is heavy. A gentle breathing pause could help re-center your inner landscape.`;
  }
  return `Your stability is ${stabilityIndex}% today. Small adjustments to rest and movement could shift your coherence toward alignment.`;
}

function computeBalanceScore(mood: number, energy: number, sleep: number): number {
  const moodPts = MOOD_POINTS[Math.round(mood)] ?? mood;
  const energyPts = ENERGY_POINTS[Math.round(energy)] ?? energy;

  const clampedSleep = Math.min(Math.max(sleep, 0), 10);
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

  const weighted = sleepPts * 0.40 + moodPts * 0.35 + energyPts * 0.25;
  const lowestPts = Math.min(moodPts, energyPts, sleepPts);
  const capped = lowestPts <= 1 ? Math.min(weighted, 4) : weighted;

  return Math.round(capped * 10) / 10;
}

// ── Home Screen ─────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const { isPremium } = usePremium();
  const warpRef = useRef<WarpRef>(null);
  const isScreenActiveRef = useRef(false);

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
    const today = getLogicalToday();
    return weeklyCheckIns.some(c => c.date === today);
  }, [weeklyCheckIns]);

  // Daily loop — streak, weekly summary, insights, nudge
  const [dailyLoop, setDailyLoop] = useState<DailyLoopData | null>(null);
  const [aiInsightText, setAiInsightText] = useState<string | null>(null);

  // Self-knowledge context — used to personalize affirmations
  const [selfKnowledge, setSelfKnowledge] = useState<SelfKnowledgeContext | null>(null);

  // ── Chart Loading ──

  const loadUserChart = useCallback(
    async (opts?: { silent?: boolean }) => {
      const silent = opts?.silent ?? false;
      if (!silent && isScreenActiveRef.current) setLoading(true);

      const setIfActive = <T,>(setter: (value: T) => void, value: T) => {
        if (isScreenActiveRef.current) {
          setter(value);
        }
      };

      try {
        const charts = await localDb.getCharts();
        if (!isScreenActiveRef.current) return;

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

          setIfActive(setUserChart, chart);

          // Hydrate data in parallel — checkins, sleep, and self-knowledge are independent
          try {
            const [checkins, sleepEntries, selfKnowledge] = await Promise.all([
              localDb.getCheckIns(chart.id, 7),
              localDb.getSleepEntries(chart.id, 7),
              loadSelfKnowledgeContext(),
            ]);
            if (!isScreenActiveRef.current) return;

            setIfActive(setWeeklyCheckIns, checkins);
            setIfActive(setSelfKnowledge, selfKnowledge);
            let nextMood = mood;
            let nextEnergy = energy;
            if (checkins.length > 0) {
              const latest = checkins[0];
              if (latest.moodScore != null) {
                nextMood = latest.moodScore;
                setIfActive(setMood, latest.moodScore);
              }
              const energyMap: Record<string, number> = { low: 3, medium: 5, high: 8 };
              if (latest.energyLevel) {
                nextEnergy = energyMap[latest.energyLevel] ?? 5;
                setIfActive(setEnergy, nextEnergy);
              }
            }

            let nextSleep = latestSleep;
            if (sleepEntries.length > 0 && sleepEntries[0].durationHours != null) {
              nextSleep = sleepEntries[0].durationHours;
              setIfActive(setLatestSleep, nextSleep);
            }

            try {
              const loopData = await getDailyLoopData(chart.id, selfKnowledge);
              if (!isScreenActiveRef.current) return;
              setIfActive(setDailyLoop, loopData);

              // Schedule personalized transit notification for tomorrow
              scheduleTransitNotification(chart).catch(() => {});
              // Schedule data-driven insight notification
              if (chart?.id) scheduleInsightNotification(chart.id).catch(() => {});

              const hasCheckInToday = checkins.some((checkIn) => checkIn.date === getLogicalToday());
              const localInsightText = loopData.todayInsight.text || (
                hasCheckInToday
                  ? generateInsight(Math.round(computeBalanceScore(nextMood, nextEnergy, nextSleep) * 10), nextMood, nextEnergy, nextSleep)
                  : 'Log a check-in today to see your personalised daily reflection.'
              );
              try {
                const enhancedInsight = await enhanceInsightCopy(
                  [{
                    id: `today-${chart.id}`,
                    source: loopData.todayInsight.type,
                    title: 'Today\'s reflection',
                    body: localInsightText,
                    isConfirmed: hasCheckInToday,
                  }],
                  selfKnowledge,
                  checkins,
                );
                if (!isScreenActiveRef.current) return;
                setIfActive(setAiInsightText, enhancedInsight?.insights[0]?.body ?? null);
              } catch (err) {
                logger.error('AI insight enhancement failed:', err);
                setIfActive(setAiInsightText, 'We could not refresh your reflective insight right now. Your local summary is still available.');
              }
            } catch (err) {
              logger.error('Daily loop data failed:', err);
              setIfActive(setAiInsightText, 'We could not refresh your reflective insight right now. Try again in a moment.');
            }
          } catch (err) {
            logger.error('Failed to load check-ins, sleep, or self-knowledge:', err);
            setIfActive(setAiInsightText, 'We could not refresh your reflective insight right now. Your check-ins are still saved locally.');
          }
        } else {
          setIfActive(setUserChart, null);
          setIfActive(setAiInsightText, null);
        }
      } catch (error) {
        logger.error('Failed to load user chart:', error);
        setIfActive(setUserChart, null);
        setIfActive(setAiInsightText, null);
      } finally {
        if (!silent && isScreenActiveRef.current) setLoading(false);
      }
    },
    [energy, latestSleep, mood],
  );

  useFocusEffect(
    useCallback(() => {
      isScreenActiveRef.current = true;
      trackGrowthEvent('analytics_screen_viewed', { screen: 'home' }).catch(() => {});
      (async () => {
        try {
          await loadUserChart();
        } catch (e) {
          logger.error('Home focus load failed:', e);
        }
      })();

      return () => {
        isScreenActiveRef.current = false;
      };
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

  // ── Daily Affirmation ──
  const affirmation = useMemo(() => {
    // Derive top intelligence dimension (highest score across all dimensions)
    const ip = selfKnowledge?.intelligenceProfile;
    const topIntelligence = ip
      ? (Object.entries(ip) as [string, unknown][])
          .filter(([, v]) => typeof v === 'number')
          .sort((a, b) => (b[1] as number) - (a[1] as number))[0]?.[0]
      : undefined;

    // Derive avg somatic intensity from recent entries
    const somaticEntries = selfKnowledge?.somaticEntries ?? [];
    const avgSomaticIntensity = somaticEntries.length > 0
      ? somaticEntries.reduce((sum, e) => sum + e.intensity, 0) / somaticEntries.length
      : null;

    // Top somatic body region
    const regionCounts: Record<string, number> = {};
    for (const e of somaticEntries) {
      regionCounts[e.region] = (regionCounts[e.region] ?? 0) + 1;
    }
    const topSomaticRegion = Object.keys(regionCounts).sort((a, b) => regionCounts[b] - regionCounts[a])[0] ?? null;

    // All relationship tags (flattened from recent entries)
    const relationshipTags = (selfKnowledge?.relationshipPatterns ?? [])
      .flatMap(entry => entry.tags);

    // Top reflection category by count
    const byCategory = selfKnowledge?.dailyReflections?.byCategory ?? {};
    const topReflectionCategory = Object.keys(byCategory).sort((a, b) => byCategory[b] - byCategory[a])[0] ?? null;

    const ctx: PersonalAffirmationContext = {
      element: userChart?.sunSign?.element?.toLowerCase() as PersonalAffirmationContext['element'],
      modality: userChart?.sunSign?.quality?.toLowerCase() as PersonalAffirmationContext['modality'],
      mood,
      energy: energy >= 7 ? 'high' : energy >= 5 ? 'medium' : 'low',
      sleep: latestSleep,
      archetype: selfKnowledge?.archetypeProfile?.dominant,
      weeklyMoodTrend: dailyLoop?.weeklyReflection?.moodDirection,
      coreValues: selfKnowledge?.coreValues?.topFive,
      cognitiveScope: selfKnowledge?.cognitiveStyle?.scope,
      cognitiveProcessing: selfKnowledge?.cognitiveStyle?.processing,
      cognitiveDecisions: selfKnowledge?.cognitiveStyle?.decisions,
      topIntelligence,
      avgSomaticIntensity,
      topSomaticRegion,
      restores: selfKnowledge?.triggers?.restores,
      drains: selfKnowledge?.triggers?.drains,
      relationshipTags,
      topReflectionCategory,
    };
    return getDailyAffirmation(ctx);
  }, [userChart, mood, energy, latestSleep, selfKnowledge, dailyLoop]);

  // ── Balance Score + Stability Map ──

  const balanceScore = useMemo(() => {
    return computeBalanceScore(mood, energy, latestSleep);
  }, [mood, energy, latestSleep]);

  // Prefer daily loop insight; fall back to legacy insight engine
  const insightText = useMemo(() => {
    if (aiInsightText) return aiInsightText;
    if (dailyLoop?.todayInsight?.text) return dailyLoop.todayInsight.text;
    // Only generate a score-based insight if today's check-in data is present;
    // otherwise fall back to a neutral prompt to avoid showing fabricated numbers.
    if (hasDataToday) {
      return generateInsight(Math.round(balanceScore * 10), mood, energy, latestSleep);
    }
    return 'Log a check-in today to see your personalised daily reflection.';
  }, [aiInsightText, dailyLoop, balanceScore, mood, energy, latestSleep, hasDataToday]);

  /** Pixel heights (max ~120px) for each of the past 7 days, oldest → today */
  const stabilityBars = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      const dateStr = toLocalDateString(d);
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
        <Text style={styles.loadingText}>Set up your birth profile to get started</Text>
        <Pressable
          onPress={() => setShowEditBirth(true)}
          style={{ marginTop: 20, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 28, borderWidth: 1, borderColor: 'rgba(212, 175, 55,0.4)', backgroundColor: 'rgba(162, 194, 225, 0.08)' }}
        >
          <Text style={{ color: '#D4AF37', fontWeight: '600', fontSize: 16 }}>Add Birth Data</Text>
        </Pressable>
        <BirthDataModal
          visible={showEditBirth}
          onClose={() => setShowEditBirth(false)}
          onSave={handleEditBirthData}
        />
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
        <View style={[styles.glowOrb, { bottom: 160, left: -120, backgroundColor: 'rgba(212, 175, 55, 0.06)' }]} />
      </View>

      {/* LAYER 3: Interactive UI */}
      <SafeAreaView edges={['top']} style={styles.safeArea}>
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
            </View>
          </Animated.View>

          {/* ── Streak Row ── */}
          {dailyLoop && (dailyLoop.streak.current > 0 || dailyLoop.streak.atRisk || dailyLoop.streak.totalCheckIns === 0) && (
            <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.streakRow}>
              {dailyLoop.streak.totalCheckIns === 0 ? (
                /* First-time user: encourage first check-in */
                <View style={[styles.streakPill, { backgroundColor: 'rgba(162,194,225,0.12)' }]}>
                  <MetallicIcon name="flame-outline" size={16} variant="gold" />
                  <Text style={styles.streakLabel}>Start your streak — log today's check-in</Text>
                </View>
              ) : dailyLoop.streak.atRisk ? (
                /* At risk: show the streak they'll lose */
                <>
                  <View style={[styles.streakPill, { backgroundColor: 'rgba(217,140,140,0.15)' }]}>
                    <MetallicIcon name="flame-outline" size={16} variant="gold" />
                    <MetallicText style={styles.streakCount} variant="gold">{dailyLoop.streak.current}</MetallicText>
                    <Text style={[styles.streakLabel, { color: '#D98C8C' }]}>day streak at risk</Text>
                  </View>
                  <View style={[styles.streakPill, { backgroundColor: 'rgba(217,140,140,0.10)' }]}>
                    <MetallicIcon name="warning-outline" size={14} variant="gold" />
                    <Text style={[styles.streakLabel, { color: '#D98C8C' }]}>Check in to keep it</Text>
                  </View>
                </>
              ) : (
                /* Normal streak display */
                <>
                  <View style={styles.streakPill}>
                    <MetallicIcon name="flame-outline" size={16} variant="gold" />
                    <MetallicText style={styles.streakCount} variant="gold">{dailyLoop.streak.current}</MetallicText>
                    <Text style={styles.streakLabel}>day streak</Text>
                  </View>
                  {dailyLoop.streak.milestone && (
                    <View style={[styles.streakPill, { backgroundColor: `${PALETTE.gold}18` }]}>
                      <MetallicIcon name="trophy-outline" size={14} variant="gold" />
                      {theme.isDark ? (
                        <MetallicText style={styles.streakLabel} variant="gold">Milestone!</MetallicText>
                      ) : (
                        <Text style={[styles.streakLabel, styles.streakLabelLight]}>Milestone!</Text>
                      )}
                    </View>
                  )}
                  {dailyLoop.streak.checkedInToday && (
                    <View style={[styles.streakPill, { backgroundColor: `${PALETTE.emerald}15` }]}>
                      <MetallicIcon name="checkmark-circle-outline" size={14} variant="green" />
                      {theme.isDark ? (
                        <MetallicText style={styles.streakLabel} variant="green">Today</MetallicText>
                      ) : (
                        <Text style={[styles.streakLabel, styles.streakLabelLight]}>Today</Text>
                      )}
                    </View>
                  )}
                </>
              )}
            </Animated.View>
          )}

          {/* ── First Check-In Prompt (new users only) ── */}
          {dailyLoop && dailyLoop.streak.totalCheckIns === 0 && (
            <Animated.View entering={FadeInDown.delay(300).duration(700)}>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                  router.push('/checkin' as Href);
                }}
                accessibilityRole="button"
                accessibilityLabel="Log your first check-in"
              >
                <VelvetGlassSurface style={styles.firstCheckInCard} intensity={20}>
                  <LinearGradient
                    pointerEvents="none"
                    colors={['rgba(168, 139, 235, 0.25)', 'rgba(107, 144, 128, 0.10)']}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={styles.firstCheckInContent}>
                    <MetallicIcon name="add-circle-outline" size={28} variant="gold" />
                    <View style={{ flex: 1 }}>
                      <MetallicText style={styles.firstCheckInTitle} variant="gold">Log your first check-in</MetallicText>
                      <Text style={styles.firstCheckInBody}>Track your mood, energy, and sleep — your first step toward understanding your patterns.</Text>
                    </View>
                    <MetallicIcon name="chevron-forward-outline" size={18} variant="gold" />
                  </View>
                </VelvetGlassSurface>
              </Pressable>
            </Animated.View>
          )}

          {/* ── Daily Balance Score ── */}
          <SectionHeader title="Daily Balance" icon="pulse-outline" />
          <Animated.View entering={FadeInDown.delay(400).duration(600)}>
            <VelvetGlassSurface style={styles.scoreCard} intensity={20}>
              <LinearGradient
                pointerEvents="none"
                colors={['rgba(44, 54, 69, 0.85)', 'rgba(26, 30, 41, 0.40)']}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.scoreHeader}>
                <Text style={styles.cardLabel}>DAILY BALANCE</Text>
              </View>
              {hasDataToday ? (
                <>
                  <View style={styles.scoreMain}>
                    <Text style={styles.scoreValue}>{balanceScore.toFixed(1)}</Text>
                    <Text style={styles.scoreMax}>/ 10</Text>
                  </View>
                  <View style={styles.pillsRow}>
                    <ScorePill label="Sleep" val={`${latestSleep % 1 === 0 ? Math.floor(latestSleep) : latestSleep.toFixed(1)}h`} color="#8EB8D4" />
                    <ScorePill label="Mood" val={mood.toFixed(1)} color="#8EB8D4" />
                    <ScorePill label="Energy" val={energy.toFixed(1)} color="#D98C8C" />
                  </View>
                </>
              ) : (
                <View style={styles.scoreMain}>
                  <Text style={styles.noDataText}>No data yet</Text>
                </View>
              )}
            </VelvetGlassSurface>
          </Animated.View>

          {/* ── 7-Day Internal Weather ── */}
          <SectionHeader title="Internal Weather" icon="cloudy-outline" />
          <Animated.View entering={FadeInDown.delay(550).duration(600)}>
            <VelvetGlassSurface style={styles.graphCard} intensity={20}>
              <LinearGradient pointerEvents="none" colors={['rgba(162, 194, 225, 0.20)', 'rgba(162, 194, 225, 0.05)']} style={StyleSheet.absoluteFill} />
              <View style={styles.graphCardHeader}>
                <View style={styles.graphBadge}>
                  <Text style={styles.graphBadgeText}>7 DAYS</Text>
                </View>
              </View>
              <MoodTrendGraph bars={stabilityBars} dayLabels={stabilityDayLabels} />
            </VelvetGlassSurface>
          </Animated.View>

          {/* ── Actionable Insight ── */}
          <SectionHeader title="Daily Reflection" icon="sparkles-outline" />
          <Animated.View entering={FadeInDown.delay(700).duration(600)}>
            <VelvetGlassSurface style={styles.insightCard} intensity={20}>
              <LinearGradient
                pointerEvents="none"
                colors={['rgba(168, 139, 235, 0.20)', 'rgba(168, 139, 235, 0.05)']}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.insightPadding}>
                <View style={styles.insightHeader}>
                  <MetallicIcon name={insightIcon as any} size={16} variant="gold" />
                  <MetallicText style={styles.insightEyebrow} variant="gold">
                    {dailyLoop?.todayInsight?.type?.toUpperCase() || 'REFLECTION'}
                  </MetallicText>
                </View>
                <Text style={styles.insightText}>{insightText}</Text>
              </View>
            </VelvetGlassSurface>
          </Animated.View>

          {/* ── Daily Affirmation ── */}
          <SectionHeader title="Daily Affirmation" icon="sunny-outline" />
          <Animated.View entering={FadeInDown.delay(750).duration(600)}>
            <VelvetGlassSurface style={styles.insightCard} intensity={20}>
              <LinearGradient
                pointerEvents="none"
                colors={['rgba(162, 194, 225, 0.20)', 'rgba(162, 194, 225, 0.05)']}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.insightPadding}>
                <View style={styles.insightHeader}>
                  <MetallicIcon name="sunny-outline" size={16} variant="gold" />
                  <MetallicText style={styles.insightEyebrow} variant="gold">TODAY'S AFFIRMATION</MetallicText>
                </View>
                <Text style={styles.affirmationText}>{affirmation.text}</Text>
              </View>
            </VelvetGlassSurface>
          </Animated.View>

          {/* ── Weekly Reflection ── */}
          {dailyLoop?.weeklyReflection?.hasEnoughData && (
            <Animated.View entering={FadeInDown.delay(800).duration(600)}>
              <VelvetGlassSurface style={styles.weeklyCard} intensity={20}>
                <LinearGradient
                  pointerEvents="none"
                  colors={['rgba(44, 54, 69, 0.85)', 'rgba(26, 30, 41, 0.40)']}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.insightPadding}>
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
                  <Text style={styles.weeklySummaryText}>{dailyLoop.weeklyReflection.summary}</Text>
                  <View style={styles.weeklyMetrics}>
                    <MetricChip value={dailyLoop.weeklyReflection.avgMood.toFixed(1)} label="Mood" />
                    {dailyLoop.weeklyReflection.avgSleep > 0 && (
                      <MetricChip value={`${dailyLoop.weeklyReflection.avgSleep.toFixed(1)}h`} label="Sleep" />
                    )}
                    <MetricChip value={String(dailyLoop.weeklyReflection.checkInCount)} label="Check-ins" />
                    {dailyLoop.weeklyReflection.journalCount > 0 && (
                      <MetricChip value={String(dailyLoop.weeklyReflection.journalCount)} label="Journals" />
                    )}
                  </View>
                </View>
              </VelvetGlassSurface>
            </Animated.View>
          )}

          {/* ── Gentle CTA when not enough data ── */}
          {dailyLoop && !dailyLoop.weeklyReflection.hasEnoughData && dailyLoop.weeklyReflection.checkInCount > 0 && (
            <Animated.View entering={FadeInDown.delay(800).duration(600)}>
              <VelvetGlassSurface style={styles.weeklyCard} intensity={20}>
                <LinearGradient
                  pointerEvents="none"
                  colors={['rgba(44, 54, 69, 0.85)', 'rgba(26, 30, 41, 0.40)']}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.insightPadding}>
                  <View style={styles.insightHeader}>
                    <MetallicIcon name="sparkles-outline" size={16} variant="gold" />
                    <MetallicText style={styles.insightEyebrow} variant="gold">WEEKLY REFLECTION</MetallicText>
                  </View>
                  <Text style={styles.weeklySummaryText}>{dailyLoop.weeklyReflection.summary}</Text>
                </View>
              </VelvetGlassSurface>
            </Animated.View>
          )}

          {/* ── Engagement Nudge ── */}
          {dailyLoop && dailyLoop.streak.current >= 3 && dailyLoop.weeklyReflection.journalCount === 0 && (
            <Animated.View entering={FadeInDown.delay(900).duration(600)}>
              <Pressable onPress={() => router.push('/(tabs)/sleep' as Href)}>
                <VelvetGlassSurface style={styles.weeklyCard} intensity={20}>
                  <LinearGradient
                    pointerEvents="none"
                    colors={['rgba(168, 139, 235, 0.15)', 'rgba(26, 30, 41, 0.40)']}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={styles.insightPadding}>
                    <View style={styles.insightHeader}>
                      <MetallicIcon name="bulb-outline" size={16} variant="gold" />
                      <MetallicText style={styles.insightEyebrow} variant="gold">NEXT STEP</MetallicText>
                    </View>
                    <Text style={styles.weeklySummaryText}>
                      You have {dailyLoop.streak.current} days of mood data building. Try logging a sleep entry or journal to see how they connect in your weekly story.
                    </Text>
                  </View>
                </VelvetGlassSurface>
              </Pressable>
            </Animated.View>
          )}

          {/* ── Birth Time Nudge ── */}
          {userChart?.birthData?.hasUnknownTime && dailyLoop && dailyLoop.streak.totalCheckIns >= 3 && (
            <Animated.View entering={FadeInDown.delay(920).duration(600)}>
              <Pressable onPress={() => setShowEditBirth(true)}>
                <VelvetGlassSurface style={styles.weeklyCard} intensity={20}>
                  <LinearGradient
                    pointerEvents="none"
                    colors={['rgba(162, 194, 225, 0.15)', 'rgba(26, 30, 41, 0.40)']}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={styles.insightPadding}>
                    <View style={styles.insightHeader}>
                      <MetallicIcon name="time-outline" size={16} variant="gold" />
                      <MetallicText style={styles.insightEyebrow} variant="gold">UNLOCK MORE DEPTH</MetallicText>
                    </View>
                    <Text style={styles.weeklySummaryText}>
                      Adding your birth time unlocks your Rising sign, house placements, and more accurate daily transits — the full picture of your Blueprint.
                    </Text>
                  </View>
                </VelvetGlassSurface>
              </Pressable>
            </Animated.View>
          )}

          {/* ── Premium Teaser ── */}
          {dailyLoop?.weeklySynthesis?.hasEnoughData && (
            <Animated.View entering={FadeInDown.delay(950).duration(600)}>
              <VelvetGlassSurface style={styles.weeklyCard} intensity={20}>
                <LinearGradient
                  pointerEvents="none"
                  colors={['rgba(107, 144, 128, 0.20)', 'rgba(26, 30, 41, 0.40)']}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.insightPadding}>
                  <View style={styles.insightHeader}>
                    <MetallicIcon name="git-network-outline" size={16} variant="gold" />
                    <MetallicText style={styles.insightEyebrow} variant="gold">THIS WEEK'S STORY</MetallicText>
                  </View>
                  <Text style={styles.weeklySummaryText}>{dailyLoop.weeklySynthesis.narrative}</Text>
                  <View style={styles.weeklyMetrics}>
                    {dailyLoop.weeklySynthesis.signals.map((sig) => (
                      <MetricChip key={sig.domain} value={sig.label} label={sig.domain.charAt(0).toUpperCase() + sig.domain.slice(1)} />
                    ))}
                  </View>
                </View>
              </VelvetGlassSurface>
            </Animated.View>
          )}
          {!isPremium && dailyLoop?.weeklyReflection?.hasEnoughData && (
            <Animated.View entering={FadeInDown.delay(1100).duration(600)}>
              <Pressable onPress={() => router.push('/(tabs)/premium' as Href)}>
                <VelvetGlassSurface style={styles.premiumCard} intensity={20}>
                  <LinearGradient
                    pointerEvents="none"
                    colors={['rgba(44, 54, 69, 0.85)', 'rgba(26, 30, 41, 0.40)']}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={styles.insightPadding}>
                    <View style={styles.premiumHeader}>
                      <MetallicIcon name="sparkles-outline" size={18} variant="gold" />
                      <MetallicText style={styles.premiumLabel} variant="gold">Pattern Unlocked</MetallicText>
                    </View>
                    <Text style={styles.premiumTitle}>
                      You have {dailyLoop.weeklyReflection.checkInCount} check-ins this week — your first pattern trends are ready
                    </Text>
                    <Text style={styles.premiumSub}>
                      Deeper Sky can now show you what restores your energy, what drains it, and how your mood shifts across your week.
                    </Text>
                    <View style={styles.premiumCta}>
                      <MetallicText style={styles.premiumCtaText} variant="gold">See Your Patterns</MetallicText>
                      <MetallicIcon name="arrow-forward-outline" size={14} variant="gold" />
                    </View>
                  </View>
                </VelvetGlassSurface>
              </Pressable>
            </Animated.View>
          )}
          {!isPremium && !dailyLoop?.weeklyReflection?.hasEnoughData && (
            <Animated.View entering={FadeInDown.delay(1100).duration(600)}>
              <Pressable onPress={() => router.push('/(tabs)/premium' as Href)}>
                <VelvetGlassSurface style={styles.premiumCard} intensity={20}>
                  <LinearGradient
                    pointerEvents="none"
                    colors={['rgba(44, 54, 69, 0.85)', 'rgba(26, 30, 41, 0.40)']}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={styles.insightPadding}>
                    <View style={styles.premiumHeader}>
                      <MetallicIcon name="sparkles-outline" size={18} variant="gold" />
                      <MetallicText style={styles.premiumLabel} variant="gold">Deeper Insight</MetallicText>
                    </View>
                    <Text style={styles.premiumTitle}>
                      Unlock the full Personal Reflection Engine
                    </Text>
                    <Text style={styles.premiumSub}>
                      Extended pattern reflections, personal connections, guided breath journaling, and full sleep pattern insights.
                    </Text>
                    <View style={styles.premiumCta}>
                      <MetallicText style={styles.premiumCtaText} variant="gold">Explore Deeper Insight</MetallicText>
                      <MetallicIcon name="arrow-forward-outline" size={14} variant="gold" />
                    </View>
                  </View>
                </VelvetGlassSurface>
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
            colors={['rgba(162, 194, 225, 0.15)', 'rgba(162, 194, 225, 0.0)']}
          />
        </Path>
        {/* Glow halo */}
        <Path path={linePath} color="rgba(212, 175, 55,0.2)" style="stroke" strokeWidth={10}>
          <BlurMask blur={10} style="normal" />
        </Path>
        {/* Main line */}
        <Path path={linePath} color="rgba(212, 175, 55,0.85)" style="stroke" strokeWidth={2} />
        {/* Data point dots */}
        {pts.map((pt, i) => (
          <React.Fragment key={i}>
            {i === 6 && (
              <Circle cx={pt.x} cy={pt.y} r={10} color="rgba(212, 175, 55,0.14)">
                <BlurMask blur={6} style="normal" />
              </Circle>
            )}
            <Circle
              cx={pt.x}
              cy={pt.y}
              r={i === 6 ? 4.5 : 2}
              color={i === 6 ? '#D4AF37' : 'rgba(255,255,255,0.2)'}
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
              color: i === 6 ? 'rgba(212, 175, 55,0.85)' : 'rgba(255,255,255,0.28)',
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

// ── Section Header (matches Patterns screen) ────────────────────────────────

function SectionHeader({ title, icon }: { title: string; icon: string }) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.sectionHeader}>
      <MetallicIcon name={icon as any} size={18} color={PALETTE.gold} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

// ── Score Pill ──────────────────────────────────────────────────────────────

function ScorePill({ label, val, color }: { label: string; val: string; color: string }) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.pill}>
      <View style={[styles.pillDot, { backgroundColor: color }]} />
      <Text style={styles.pillLabel}>{label}</Text>
      <Text style={styles.pillVal}>{val}</Text>
    </View>
  );
}

function MetricChip({ value, label }: { value: string; label: string }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.metricChip}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

// ── Luminous Check-In FAB ────────────────────────────────────────────────────

function CheckInFAB() {
  const theme = useAppTheme();
  const fabStyles = useThemedStyles(createFabStyles);
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
        <BlurView intensity={60} tint={theme.blurTint} style={fabStyles.glassCircle}>
          <MetallicIcon name="add-outline" size={28} variant="gold" />
        </BlurView>
      </Animated.View>
    </Pressable>
  );
}

const createFabStyles = (theme: AppTheme) => StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 120,
    right: 24,
    zIndex: 100,
  },
  glowWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  glassCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    overflow: 'hidden',
  },
});

// ── Styles ──────────────────────────────────────────────────────────────────

const createStyles = (theme: AppTheme) => {
  const raisedBorder = theme.isDark ? 'rgba(255,255,255,0.10)' : theme.cardBorder;
  const raisedTopBorder = theme.isDark ? 'rgba(255,255,255,0.20)' : 'rgba(255,255,255,0.68)';

  return StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  loadingContainer: { justifyContent: 'center', alignItems: 'center' },
  loadingText: {
    color: theme.textPrimary,
    marginTop: 16,
  },
  safeArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 140 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
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
    color: theme.textPrimary,
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  dateLabelLight: {
    color: theme.textSecondary,
  },

  // Insight Card
  insightCard: { marginTop: 0, marginBottom: 32 },
  insightGradient: {
    borderRadius: 24,
    padding: 36,
    borderWidth: 1,
    borderColor: raisedBorder,
    borderTopColor: raisedTopBorder,
    backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
    overflow: 'hidden',
  },
  insightPadding: {
    padding: 24,
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
  insightEyebrowLight: {
    fontWeight: '800',
  },
  insightText: {
    color: theme.isDark ? 'rgba(255, 255, 255, 0.65)' : theme.textPrimary,
    fontSize: 15,
    lineHeight: 32,
  },

  // Daily Affirmation card
  affirmationCard: {
    borderRadius: 24,
    padding: 36,
    borderWidth: 1,
    borderColor: raisedBorder,
    borderTopColor: raisedTopBorder,
    marginBottom: 32,
    backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
    overflow: 'hidden',
  },
  affirmationText: {
    color: theme.isDark ? 'rgba(255, 255, 255, 0.65)' : theme.textPrimary,
    fontSize: 12,
    lineHeight: 22,
    fontStyle: 'italic',
    fontWeight: '200',
    paddingHorizontal: 8,
    letterSpacing: 0.3,
    textAlign: 'center',
  },

  // Premium preview
  premiumPreviewCard: {
    borderRadius: 24,
    padding: 36,
    borderWidth: 1,
    borderColor: raisedBorder,
    borderTopColor: raisedTopBorder,
    marginBottom: 32,
    backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
    overflow: 'hidden',
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
  premiumPreviewLabelLight: {
    color: theme.textSecondary,
  },
  premiumPreviewTitle: {
    fontSize: 20,
    color: theme.textPrimary,
    fontWeight: '700',
    lineHeight: 28,
    marginBottom: 8,
  },
  premiumPreviewSub: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 22,
    marginBottom: 16,
  },
  premiumCard: {
    marginBottom: 32,
    borderRadius: 24,
    overflow: 'hidden',
  },
  premiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  premiumLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: PALETTE.gold,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  premiumTitle: {
    fontSize: 18,
    color: theme.textPrimary,
    fontWeight: '700',
    lineHeight: 26,
    marginBottom: 8,
  },
  premiumSub: {
    fontSize: 13,
    color: theme.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  premiumCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  premiumCtaText: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
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
    fontVariant: ['tabular-nums'] as const,
  },
  streakLabel: {
    color: theme.textPrimary,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  streakLabelLight: {
    color: theme.textSecondary,
  },

  firstCheckInCard: { borderRadius: 20, marginBottom: 20, overflow: 'hidden' },
  firstCheckInContent: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 20 },
  firstCheckInTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  firstCheckInBody: { fontSize: 13, color: theme.textSecondary, lineHeight: 18 },

  // Weekly reflection
  weeklyCard: { marginBottom: 32 },
  weeklyGradient: {
    borderRadius: 24,
    padding: 36,
    borderWidth: 1,
    borderColor: raisedBorder,
    borderTopColor: raisedTopBorder,
    backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
    overflow: 'hidden',
  },
  weeklySummaryText: {
    color: theme.isDark ? 'rgba(255, 255, 255, 0.65)' : theme.textPrimary,
    fontSize: 14,
    lineHeight: 22,
  },
  weeklyMetrics: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.cardBorder,
  },
  metricChip: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  metricValue: {
    color: theme.isDark ? '#FFFFFF' : theme.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    fontVariant: ['tabular-nums'] as const,
  },
  metricLabel: {
    color: theme.isDark ? 'rgba(255, 255, 255, 0.40)' : theme.textPrimary,
    fontSize: 8,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
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
    color: theme.textSecondary,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  scoreCard: {
    padding: 34,
    borderRadius: 24,
    marginBottom: 32,
    overflow: 'hidden',
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 14,
  },
  scoreMain: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  scoreValue: {
    fontSize: 56,
    fontWeight: '700',
    color: theme.isDark ? '#FFFFFF' : theme.textPrimary,
    lineHeight: 58,
  },
  noDataText: {
    fontSize: 16,
    color: theme.textMuted,
  },
  scoreMax: {
    fontSize: 17,
    color: theme.textMuted,
    marginLeft: 8,
    marginBottom: 8,
    lineHeight: 20,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : theme.cardSurface,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    paddingVertical: 10,
    paddingHorizontal: 10,
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
    color: theme.isDark ? theme.textSecondary : 'rgba(26, 24, 21, 0.5)',
    textTransform: 'uppercase',
    fontWeight: '700',
    flex: 1,
  },
  pillVal: {
    fontSize: 12,
    color: theme.isDark ? theme.textPrimary : '#1A1815',
    fontWeight: '700',
  },

  // 7-Day Internal Weather
  graphCard: {
    paddingTop: 24,
    paddingHorizontal: 28,
    paddingBottom: 28,
    borderRadius: 24,
    marginBottom: 32,
    overflow: 'hidden',
  },
  graphCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  graphBadge: {
    backgroundColor: 'rgba(162, 194, 225, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  graphBadgeText: {
    fontSize: 9,
    color: theme.isDark ? 'rgba(212, 175, 55,0.74)' : theme.textSecondary,
    fontWeight: '700',
    letterSpacing: 1.5,
  },

  // Section headers (matches Patterns screen)
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
    marginTop: 8,
  },
  sectionTitle: {
    color: theme.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },

  // Explore Blueprint section
  sectionBlock: {
    marginBottom: 24,
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
    borderColor: theme.cardBorder,
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
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
    fontWeight: '600',
    color: theme.textPrimary,
    textAlign: 'center',
  },
  quickLinkSub: {
    fontSize: 10,
    color: theme.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },

  // Insight card CTA
  actionBtnText: {
    color: '#1A1815',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  });
};
