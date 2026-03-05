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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Href } from 'expo-router';
import Animated, { FadeInDown, FadeIn, FadeInUp, useAnimatedSensor, SensorType } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/core';

import { theme } from '../../constants/theme';
import { SkiaTriadGlow } from '../../components/energy/SkiaTriadGlow';
import { ContextualOrbs, OrbData } from '../../components/energy/ContextualOrbs';

// ── Custom Skia Suite ──
import NebulaBackground from '../../components/ui/NebulaBackground';
import { SkiaDynamicCosmos } from '../../components/ui/SkiaDynamicCosmos';
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
import { getDailyLoopData, DailyLoopData } from '../../services/today/dailyLoop';
import { config } from '../../constants/config';
import { logger } from '../../utils/logger';
import { parseLocalDate } from '../../utils/dateUtils';
import * as Haptics from 'expo-haptics';
import { usePremium } from '../../context/PremiumContext';

const { width } = Dimensions.get('window');

// ── Cinematic Palette ──
const PALETTE = {
  gold: '#C5B493',
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
): string {
  return `Your stability is ${stabilityIndex}% today. Tap Patterns below to explore what's shaping it.`;
}

// ── Home Screen ─────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const { isPremium } = usePremium();
  const gyro = useAnimatedSensor(SensorType.GYROSCOPE);
  const warpRef = useRef<WarpRef>(null);

  const [userChart, setUserChart] = useState<NatalChart | null>(null);
  const [showEditBirth, setShowEditBirth] = useState(false);
  const [loading, setLoading] = useState(true);

  // Aura data — derived from latest check-in (defaults until loaded)
  const [mood, setMood] = useState(7);
  const [energy, setEnergy] = useState(8);
  const [tension, setTension] = useState(3);

  const [recentDeltas, setRecentDeltas] = useState<OrbData[]>([
    { id: '1', context: 'Development', delta: +0.2, time: '2h ago' },
    { id: '2', context: 'Parenting', delta: -0.1, time: '5h ago' },
    { id: '3', context: 'Recovery', delta: +0.4, time: '8h ago' },
  ]);

  const handleTriadCheckIn = useCallback((metrics: any, delta: number, context: string) => {
    logger.info(`Triad Check-in recorded: ${context} with delta ${delta}`);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Update local states based on check-in
    setMood(metrics.mood * 10); // scale 0-1 to 0-10 if needed
    setEnergy(metrics.energy * 10);
    setTension(metrics.stress * 10); 

    setRecentDeltas((prev) => {
      const newOrb: OrbData = {
        id: Date.now().toString(),
        context,
        delta,
        time: 'Just now'
      };
      return [newOrb, ...prev].slice(0, 5); // keep latest 5
    });
  }, []);

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
            const [checkins, sleepEntries] = await Promise.all([
              localDb.getCheckIns(chart.id, 7),
              localDb.getSleepEntries(chart.id, 7)
            ]);
            if (checkins.length > 0) {
              const latest = checkins[0];
              if (latest.moodScore != null) setMood(latest.moodScore);
              const energyMap: Record<string, number> = { low: 3, medium: 5, high: 8 };
              if (latest.energyLevel) setEnergy(energyMap[latest.energyLevel] ?? 5);
              const stressMap: Record<string, number> = { low: 2, medium: 5, high: 8 };
              if (latest.stressLevel) setTension(stressMap[latest.stressLevel] ?? 3);
            }
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
            // Loop data is now fetched alongside checkins
            // Loop data is now fetched alongside checkins
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
  const stability = useMemo(() => {
    const base = computeStabilityIndex(stabilityData);
    // resilienceBuffer handling: using streak to slightly boost stability resilience
    return { ...base, index: Math.min(100, base.index + (dailyLoop?.streak?.current || 0) * 0.5) }; 
  }, [stabilityData, dailyLoop?.streak?.current]);

  // Prefer daily loop insight; fall back to brief stability note
  const insightText = useMemo(() => {
    if (dailyLoop?.todayInsight?.text) return dailyLoop.todayInsight.text;
    return generateInsight(stability.index);
  }, [dailyLoop, stability.index]);

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
        <NebulaBackground mood={5} />
        <SkiaDynamicCosmos />
        <View style={{ width: 120, height: 16, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 8, marginTop: 24, alignSelf: "center" }} />
      </View>
    );
  }

  if (!userChart) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <NebulaBackground mood={3} />
        <SkiaDynamicCosmos />
        <View style={{ width: 140, height: 16, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 8, marginTop: 24, alignSelf: "center" }} />
      </View>
    );
  }

  // ── Stability Dashboard ──

  return (
    <View style={styles.container}>
      {/* LAYER 1: Atmospheric Shader — turbulence driven by energy, color by transits */}
      <NebulaBackground mood={mood} energy={energy} />

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

          {/* ── Dynamic Streak Orb ── */}
          {dailyLoop && dailyLoop.streak.current > 0 && (
            <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.streakRow}>
              <View style={[styles.streakPill, { backgroundColor: dailyLoop.streak.checkedInToday ? `${PALETTE.emerald}30` : `${PALETTE.gold}20`, borderColor: dailyLoop.streak.milestone ? PALETTE.gold : 'transparent', borderWidth: dailyLoop.streak.milestone ? 1 : 0 }]}>
                 <Ionicons name={dailyLoop.streak.milestone ? "trophy" : "flame"} size={16} color={dailyLoop.streak.checkedInToday ? PALETTE.emerald : PALETTE.gold} />
                 <Text style={[styles.streakCount, { color: dailyLoop.streak.checkedInToday ? PALETTE.emerald : PALETTE.gold }]}>{dailyLoop.streak.current}</Text>
                 <Text style={[styles.streakLabel, { color: dailyLoop.streak.checkedInToday ? PALETTE.emerald : PALETTE.gold }]}>{dailyLoop.streak.milestone ? 'MILESTONE' : 'DAY STREAK'}</Text>
              </View>
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

          {/* ── Unified Aura — Fluid Mood/Energy/Tension Signature ── */}
          <Animated.View
            entering={FadeIn.delay(300).duration(1200)}
            style={styles.auraContainer}
          >
            <Pressable onLongPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); router.push('/(tabs)/somatic' as Href) }}>
              <SkiaUnifiedAura mood={mood} energy={energy} tension={tension} />
            </Pressable>
          </Animated.View>

          {/* ── Skia Triad Check-In (Middle 1/3) ── */}
          <Animated.View entering={FadeIn.delay(400).duration(800)}>
            <SkiaTriadGlow 
              activeWindow="Gold" // Alternatively hook this into actual circadian logic
              onCheckIn={handleTriadCheckIn}
            />
          </Animated.View>

          {/* ── Contextual Orbs (Insights - Bottom 1/3) ── */}
          <Animated.View entering={FadeInDown.delay(450).duration(600)}>
            <ContextualOrbs orbs={recentDeltas} />
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
            </LinearGradient>
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
                </LinearGradient>
              </Pressable>
            </Animated.View>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* LAYER 4: Global Warp Overlay */}
      <SkiaWarpTransition ref={warpRef} />

      {/* RECURRING PATTERN ORB (Growth Pathway Overlay) */}
      <Animated.View entering={FadeInUp.delay(1500).duration(800)} style={styles.floatingOrbContainer}>
        <Pressable onPress={() => router.push((stability.index < 50 ? '/(tabs)/somatic' : '/(tabs)/healing') as Href)} style={[styles.floatingOrb, stability.index < 50 && { shadowColor: PALETTE.copper }]}>
           <LinearGradient colors={stability.index < 50 ? [`${PALETTE.copper}80`, `${PALETTE.copper}40`] : ['rgba(157, 118, 193, 0.4)', 'rgba(74, 53, 89, 0.8)']} style={[styles.floatingOrbGradient, stability.index < 50 && { borderColor: PALETTE.copper }]}>
              <Ionicons name={stability.index < 50 ? "water" : "leaf"} size={24} color={stability.index < 50 ? PALETTE.textMain : "#D4A3B3"} />
           </LinearGradient>
        </Pressable>
      </Animated.View>

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
  floatingOrbContainer: {
    position: 'absolute',
    bottom: 120, // above tab bar
    right: 20,
    zIndex: 100,
  },
  floatingOrb: {
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: '#D4A3B3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingOrbGradient: {
    flex: 1,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 163, 179, 0.4)',
  },
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
    backgroundColor: 'rgba(255,255,255,0.04)',
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
    color: theme.textMuted,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Return nudge
  nudgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
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

});
