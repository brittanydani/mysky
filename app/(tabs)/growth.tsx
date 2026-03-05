/**
 * Reflect Tab — Daily Reflection + Behavioral Pattern Analytics
 *
 * Merges the former Insights + Growth tabs into a single reflection-first
 * screen. Daily prompt at top, followed by 30-day behavioral data
 * (mood trends, energy, stress). Astrology context is available at the
 * very bottom as an intentional, secondary link.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Href } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/core';
import * as Haptics from 'expo-haptics';

import { theme } from '../../constants/theme';
import { SkiaDynamicCosmos } from '../../components/ui/SkiaDynamicCosmos';
import SkiaReflectionMirror from '../../components/ui/SkiaReflectionMirror';
import SkiaKeywordStarfield from '../../components/reflect/SkiaKeywordStarfield';
import { localDb } from '../../services/storage/localDb';
import { DailyCheckIn } from '../../services/patterns/types';
import { TAG_LABELS } from '../../utils/tagAnalytics';
import { generateReflectionInsights, ReflectionInsightsResponse, ReflectionInsightsPayload } from '../../services/premium/reflectionInsights';
import { useAuth } from '../../context/AuthContext';
import { usePremium } from '../../context/PremiumContext';
import { logger } from '../../utils/logger';

// ── Cinematic Color Palette ──
const PALETTE = {
  gold: '#C5B493',
  silverBlue: '#8BC4E8',
  amethyst: '#9D76C1',
  copper: '#CD7F5D',
  emerald: '#6EBF8B',
  glassBorder: 'rgba(255,255,255,0.08)',
  glassHighlight: 'rgba(255,255,255,0.15)',
  textMain: '#FDFBF7',
};

// ── Rotating daily reflection prompts (non-astrological) ──
const REFLECTION_PROMPTS = [
  'What felt most charged for you today?',
  'Where did you notice tension — and what was underneath it?',
  'What restored your energy today?',
  'What are you quietly proud of, even if no one else noticed?',
  'What did you want to say but held back?',
  'Who or what brought a moment of ease today?',
  'What do you want to release before tomorrow?',
];

function getDailyPrompt(): string {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86_400_000
  );
  return REFLECTION_PROMPTS[dayOfYear % REFLECTION_PROMPTS.length];
}

// ── Data-Driven Somatic Intention ──
function getSomaticIntention(checkIns: DailyCheckIn[]): string {
  if (checkIns.length === 0) return "Ground yourself in the present moment.";
  
  const recent = checkIns[0];
  
  if (recent.stressLevel === 'high') {
    return "Based on your high 'Connection Pressure' yesterday, your intention today is to protect your Indigo Window.";
  }
  if (recent.energyLevel === 'low') {
    return "Your energy dropped recently. Focus on resting without guilt today.";
  }
  if (recent.moodScore && recent.moodScore >= 8) {
    return "You're in a high-resonance state. Anchor this feeling physically today.";
  }

  return "Pay attention to how your body holds boundaries today.";
}

// Group 30 check-ins into up to 4 weekly buckets
interface WeekBucket {
  label: string;
  avgMood: number | null;
  avgEnergy: number | null;
  avgStress: number | null;
  moodStability: string;
  energyStability: string;
  stressStability: string;
  count: number;
}

function levelToScore(level: string | null | undefined): number | null {
  if (level === 'low') return 2;
  if (level === 'medium') return 5;
  if (level === 'high') return 9;
  return null;
}

function calculateStability(values: number[], minVal: number, maxVal: number): string {
  if (values.length < 2) return '—';
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (values.length - 1);
  const stdDev = Math.sqrt(variance);
  const maxStdDev = (maxVal - minVal) / 2;
  
  let stability = 100 - ((stdDev / maxStdDev) * 100);
  stability = Math.max(0, Math.min(100, Math.round(stability)));
  return `${stability}%`;
}

function buildWeekBuckets(checkIns: DailyCheckIn[]): WeekBucket[] {
  if (checkIns.length === 0) return [];
  const now = new Date();
  const buckets: WeekBucket[] = [];

  for (let w = 0; w < 4; w++) {
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() - w * 7);
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 6);

    const inBucket = checkIns.filter(c => {
      const d = new Date(c.date);
      return d >= weekStart && d <= weekEnd;
    });

    const moods = inBucket.map(c => c.moodScore).filter((v): v is number => v != null);
    const energies = inBucket.map(c => levelToScore(c.energyLevel)).filter((v): v is number => v != null);
    const stresses = inBucket.map(c => levelToScore(c.stressLevel)).filter((v): v is number => v != null);

    const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

    buckets.push({
      label: w === 0 ? 'This week' : w === 1 ? 'Last week' : `${w + 1} weeks ago`,
      avgMood: avg(moods),
      avgEnergy: avg(energies),
      avgStress: avg(stresses),
      moodStability: calculateStability(moods, 1, 10),
      energyStability: calculateStability(energies, 2, 9),
      stressStability: calculateStability(stresses, 2, 9),
      count: inBucket.length,
    });
  }
  return buckets;
}

function trendDirection(buckets: WeekBucket[], field: 'avgMood' | 'avgEnergy' | 'avgStress'): 'up' | 'down' | 'flat' {
  const recent = buckets[0]?.[field];
  const previous = buckets[1]?.[field];
  if (recent == null || previous == null) return 'flat';
  if (recent > previous + 0.3) return 'up';
  if (recent < previous - 0.3) return 'down';
  return 'flat';
}

function scoreToPercent(score: number | null): number {
  if (score == null) return 0;
  return Math.min(100, Math.max(0, ((score - 1) / 9) * 100));
}

export default function ReflectScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { isPremium } = usePremium();
  const [checkIns, setCheckIns] = useState<DailyCheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasChart, setHasChart] = useState(false);
  const [mirrorText, setMirrorText] = useState('');
  const [showMirror, setShowMirror] = useState(false);
  const [aiInsights, setAiInsights] = useState<ReflectionInsightsResponse | null>(null);
  const [aiInsightsError, setAiInsightsError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          setLoading(true);
          const charts = await localDb.getCharts();
          if (charts.length === 0) {
            setHasChart(false);
            return;
          }
          setHasChart(true);
          const data = await localDb.getCheckIns(charts[0].id, 30);
          setCheckIns(data);
        } catch (e) {
          logger.error('Reflect data load failed:', e);
        } finally {
          setLoading(false);
        }
      })();
    }, [])
  );

  const nav = (route: string) => {
    Haptics.selectionAsync().catch(() => {});
    router.push(route as Href);
  };

  const buckets = buildWeekBuckets(checkIns);
  const moodTrend = trendDirection(buckets, 'avgMood');
  const energyTrend = trendDirection(buckets, 'avgEnergy');
  const stressTrend = trendDirection(buckets, 'avgStress');

  const energyMoodInsight = useMemo(() => {
    if (checkIns.length < 7) return null;
    const highEnergyDays = checkIns.filter(c => c.energyLevel === 'high');
    const lowEnergyDays = checkIns.filter(c => c.energyLevel === 'low');
    const avg = (items: DailyCheckIn[]) => {
      const moods = items.map(c => c.moodScore).filter((v): v is number => v != null);
      return moods.length > 0 ? moods.reduce((a, b) => a + b, 0) / moods.length : null;
    };
    const highAvg = avg(highEnergyDays);
    const lowAvg = avg(lowEnergyDays);
    if (highAvg != null && lowAvg != null && Math.abs(highAvg - lowAvg) >= 0.4) {
      return highAvg > lowAvg
        ? `On your high-energy days, your mood averages ${highAvg.toFixed(1)} — ${(highAvg - lowAvg).toFixed(1)} points higher than on low-energy days. For you, energy and emotional wellbeing move together.`
        : `Your mood holds steady even on low-energy days (${lowAvg.toFixed(1)} vs ${highAvg.toFixed(1)} on high-energy days) — you're more resilient than the numbers might suggest.`;
    }
    return null;
  }, [checkIns]);

  const bestEnergyDay = useMemo(() => {
    if (checkIns.length < 7) return null;
    const byDay: Record<number, number[]> = {};
    checkIns.forEach(c => {
      const day = new Date(c.date).getDay();
      const score = levelToScore(c.energyLevel);
      if (score != null) {
        if (!byDay[day]) byDay[day] = [];
        byDay[day].push(score);
      }
    });
    const dayNames = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'];
    let bestDay = -1;
    let bestAvg = -1;
    Object.entries(byDay).forEach(([day, values]) => {
      if (values.length >= 2) {
        const a = values.reduce((x, y) => x + y, 0) / values.length;
        if (a > bestAvg) { bestAvg = a; bestDay = parseInt(day); }
      }
    });
    return bestDay >= 0 ? dayNames[bestDay] : null;
  }, [checkIns]);

  const tagCorrelation = useMemo(() => {
    if (checkIns.length < 7) return null;
    const allMoods = checkIns.map(c => c.moodScore).filter((v): v is number => v != null);
    if (allMoods.length === 0) return null;
    const baseline = allMoods.reduce((a, b) => a + b, 0) / allMoods.length;

    const tagMap: Record<string, number[]> = {};
    checkIns.forEach(c => {
      if (c.moodScore == null) return;
      (c.tags ?? []).forEach(tag => {
        if (!tagMap[tag]) tagMap[tag] = [];
        tagMap[tag].push(c.moodScore!);
      });
    });

    const THRESHOLD = 0.6;
    type TagEntry = { tag: string; label: string; liftMood: number };
    const richRestores: TagEntry[] = [];
    const richDrains: TagEntry[] = [];

    Object.entries(tagMap).forEach(([tag, moods]) => {
      if (moods.length < 2) return;
      const avg = moods.reduce((a, b) => a + b, 0) / moods.length;
      const liftMood = parseFloat((avg - baseline).toFixed(2));
      const label = TAG_LABELS[tag] ?? tag.replace(/_/g, ' ');
      if (liftMood >= THRESHOLD) richRestores.push({ tag, label, liftMood });
      else if (liftMood <= -THRESHOLD) richDrains.push({ tag, label, liftMood });
    });

    richRestores.sort((a, b) => b.liftMood - a.liftMood);
    richDrains.sort((a, b) => a.liftMood - b.liftMood);

    return {
      restores: richRestores.slice(0, 3).map(r => r.label.toLowerCase()),
      drains: richDrains.slice(0, 3).map(d => d.label.toLowerCase()),
      richRestores: richRestores.slice(0, 3),
      richDrains: richDrains.slice(0, 3),
    };
  }, [checkIns]);

  const energyMoodDiff = useMemo(() => {
    if (checkIns.length < 7) return null;
    const high = checkIns.filter(c => c.energyLevel === 'high');
    const low = checkIns.filter(c => c.energyLevel === 'low');
    const avg = (items: DailyCheckIn[]) => {
      const m = items.map(c => c.moodScore).filter((v): v is number => v != null);
      return m.length > 0 ? m.reduce((a, b) => a + b, 0) / m.length : null;
    };
    const hAvg = avg(high);
    const lAvg = avg(low);
    if (hAvg == null || lAvg == null) return null;
    return parseFloat((hAvg - lAvg).toFixed(2));
  }, [checkIns]);

  const somaticPattern = useMemo(() => {
    if (checkIns.length < 10) return null;
    
    // Logic: Find the most common tension node on days where 'Stress' is High
    const highStressDays = checkIns.filter(c => c.stressLevel === 'high');
    const nodeFrequency: Record<string, number> = {};
    
    highStressDays.forEach(day => {
      day.silhouetteNodes?.forEach(node => {
        nodeFrequency[node] = (nodeFrequency[node] || 0) + 1;
      });
    });

    const topNode = Object.entries(nodeFrequency).sort((a,b) => b[1] - a[1])[0];
    return topNode ? topNode[0] : null;
  }, [checkIns]);

  useEffect(() => {
    if (checkIns.length < 7 || !session?.access_token || !isPremium) return;
    let cancelled = false;

    const payload: ReflectionInsightsPayload = {
      timeWindowLabel: 'last 30 days',
      mood: {
        trend: moodTrend,
        avg: buckets[0]?.avgMood != null ? parseFloat(buckets[0].avgMood.toFixed(1)) : 0,
        delta: parseFloat(((buckets[0]?.avgMood ?? 0) - (buckets[1]?.avgMood ?? 0)).toFixed(1)),
      },
      stress: {
        trend: stressTrend,
        avg: buckets[0]?.avgStress != null ? parseFloat(buckets[0].avgStress.toFixed(1)) : 0,
        delta: parseFloat(((buckets[0]?.avgStress ?? 0) - (buckets[1]?.avgStress ?? 0)).toFixed(1)),
      },
      energy: {
        trend: energyTrend,
        avg: buckets[0]?.avgEnergy != null ? parseFloat(buckets[0].avgEnergy.toFixed(1)) : 0,
        delta: parseFloat(((buckets[0]?.avgEnergy ?? 0) - (buckets[1]?.avgEnergy ?? 0)).toFixed(1)),
      },
      energyMood: {
        correlation: energyMoodDiff,
        interpretationHint:
          energyMoodDiff == null ? 'unknown'
          : energyMoodDiff > 0 ? 'moves_together'
          : energyMoodDiff < 0 ? 'inverse'
          : 'independent',
      },
      restores: {
        sampleSizeDays: checkIns.length,
        top: tagCorrelation?.richRestores ?? [],
        drains: tagCorrelation?.richDrains ?? [],
      },
    };

    generateReflectionInsights(payload, session?.access_token).then(result => {
      if (!cancelled) setAiInsights(result);
    }).catch(err => {
      if (!cancelled) {
        logger.warn('AI reflection insights unavailable:', err);
        setAiInsightsError('unavailable');
      }
    });

    return () => { cancelled = true; };
  }, [checkIns, session?.access_token, isPremium]);

  const trendIcon = (dir: 'up' | 'down' | 'flat', inverse = false) => {
    const isPositive = inverse ? dir === 'down' : dir === 'up';
    const isNegative = inverse ? dir === 'up' : dir === 'down';
    if (isPositive) return { name: 'trending-up' as const, color: PALETTE.emerald };
    if (isNegative) return { name: 'trending-down' as const, color: PALETTE.copper };
    return { name: 'remove' as const, color: theme.textMuted };
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <SkiaDynamicCosmos />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!hasChart) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <SkiaDynamicCosmos />
        <Ionicons name="journal-outline" size={56} color={theme.textMuted} style={{ marginBottom: 16 }} />
        <Text style={styles.emptyTitle}>Your Reflection Space</Text>
        <Text style={styles.emptySubtitle}>
          Log a few mood check-ins and journal entries to uncover your hidden patterns and emotional rhythms.
        </Text>
        <Pressable style={styles.ctaButton} onPress={() => nav('/(tabs)/mood')}>
          <Text style={styles.ctaText}>Log Your First Mood</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* ── Header ── */}
          <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
            <Text style={styles.title}>Reflect</Text>
            <Text style={styles.subtitle}>Current Window: Somatic Processing</Text>
          </Animated.View>

          {/* ── Daily Reflection Prompt (Cinematic Glass) ── */}
          <Animated.View entering={FadeInDown.delay(120).duration(600)} style={styles.section}>
            <LinearGradient colors={['rgba(139, 196, 232, 0.15)', 'rgba(20, 24, 34, 0.6)']} style={styles.glassCard}>
              <View style={styles.promptLabelRow}>
                <Ionicons name="sparkles" size={14} color={PALETTE.silverBlue} />
                <Text style={[styles.promptLabel, { color: PALETTE.silverBlue }]}>PROMPT FOR TODAY</Text>
              </View>
              <Text style={styles.promptText}>{getDailyPrompt()}</Text>

              <View style={styles.promptActions}>
                <Pressable style={styles.promptBtn} onPress={() => { setShowMirror(prev => !prev); }}>
                  <LinearGradient colors={['rgba(110, 191, 139, 0.25)', 'rgba(110, 191, 139, 0.1)']} style={styles.promptBtnGradient}>
                    <Ionicons name="eye-outline" size={18} color={PALETTE.emerald} />
                    <Text style={[styles.promptBtnText, { color: PALETTE.emerald }]}>Mirror Portal</Text>
                  </LinearGradient>
                </Pressable>

                <Pressable style={styles.promptBtn} onPress={() => nav('/(tabs)/mood')}>
                  <LinearGradient colors={['rgba(139, 196, 232, 0.25)', 'rgba(139, 196, 232, 0.1)']} style={styles.promptBtnGradient}>
                    <Ionicons name="happy-outline" size={18} color={PALETTE.silverBlue} />
                    <Text style={[styles.promptBtnText, { color: PALETTE.silverBlue }]}>Log Mood</Text>
                  </LinearGradient>
                </Pressable>

                <Pressable style={styles.promptBtn} onPress={() => nav('/(tabs)/journal')}>
                  <LinearGradient colors={['rgba(197, 180, 147, 0.25)', 'rgba(197, 180, 147, 0.1)']} style={styles.promptBtnGradient}>
                    <Ionicons name="create-outline" size={18} color={PALETTE.gold} />
                    <Text style={[styles.promptBtnText, { color: PALETTE.gold }]}>Write Journal</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* ── The Mirror Portal (Frosted Glass Reflection Space) ── */}
          {showMirror && (
            <Animated.View entering={FadeInDown.delay(80).duration(600)} style={styles.section}>
              <SkiaReflectionMirror
                prompt={getDailyPrompt()}
                instruction="Breathe slowly. Let the glass clear. Begin when you're ready."
                value={mirrorText}
                onChangeText={setMirrorText}
                placeholder="Let the words come..."
              />
            </Animated.View>
          )}

          {/* ── Somatic Intention (Cinematic Glass) ── */}
          <Animated.View entering={FadeInDown.delay(140).duration(600)} style={styles.section}>
            <LinearGradient colors={['rgba(110, 191, 139, 0.15)', 'rgba(20, 24, 34, 0.6)']} style={styles.glassCard}>
              <View style={styles.promptLabelRow}>
                <Ionicons name="leaf-outline" size={14} color={PALETTE.emerald} />
                <Text style={[styles.promptLabel, { color: PALETTE.emerald }]}>SOMATIC INTENTION</Text>
              </View>
              <Text style={styles.intentionText}>{getSomaticIntention(checkIns)}</Text>
            </LinearGradient>
          </Animated.View>

          {checkIns.length === 0 ? (
            <Animated.View entering={FadeInDown.delay(160).duration(600)}>
              <LinearGradient colors={['rgba(35, 40, 55, 0.5)', 'rgba(20, 24, 34, 0.8)']} style={styles.glassCardEmpty}>
                <Ionicons name="pulse" size={32} color={theme.textMuted} />
                <Text style={styles.emptyCardText}>No data yet. Log your mood daily to unlock trend analysis.</Text>
                <Pressable style={styles.inlineCtaButton} onPress={() => nav('/(tabs)/mood')}>
                  <Text style={styles.inlineCtaText}>Log Mood Now</Text>
                </Pressable>
              </LinearGradient>
            </Animated.View>
          ) : (
            <>
              {/* ── 30-Day Overview Widgets (Volatility) ── */}
              <Animated.View entering={FadeInDown.delay(160).duration(600)} style={styles.section}>
                <Text style={styles.sectionTitle}>System Stability</Text>
                <View style={styles.trendCards}>
                  {/* Mood Widget */}
                  <LinearGradient colors={['rgba(35, 40, 55, 0.6)', 'rgba(20, 24, 34, 0.8)']} style={styles.trendCard}>
                    <View style={styles.trendCardHeader}>
                      <Text style={[styles.trendCardLabel, { color: PALETTE.silverBlue }]}>MOOD</Text>
                      <Ionicons name={trendIcon(moodTrend).name} size={16} color={trendIcon(moodTrend).color} />
                    </View>
                    <Text style={styles.trendCardValue}>{buckets[0]?.moodStability || '—'}</Text>
                    <Text style={styles.trendCardSub}>stability</Text>
                  </LinearGradient>

                  {/* Energy Widget */}
                  <LinearGradient colors={['rgba(35, 40, 55, 0.6)', 'rgba(20, 24, 34, 0.8)']} style={styles.trendCard}>
                    <View style={styles.trendCardHeader}>
                      <Text style={[styles.trendCardLabel, { color: PALETTE.gold }]}>ENERGY</Text>
                      <Ionicons name={trendIcon(energyTrend).name} size={16} color={trendIcon(energyTrend).color} />
                    </View>
                    <Text style={styles.trendCardValue}>{buckets[0]?.energyStability || '—'}</Text>
                    <Text style={styles.trendCardSub}>stability</Text>
                  </LinearGradient>

                  {/* Stress Widget */}
                  <LinearGradient colors={['rgba(35, 40, 55, 0.6)', 'rgba(20, 24, 34, 0.8)']} style={styles.trendCard}>
                    <View style={styles.trendCardHeader}>
                      <Text style={[styles.trendCardLabel, { color: PALETTE.copper }]}>STRESS</Text>
                      <Ionicons name={trendIcon(stressTrend, true).name} size={16} color={trendIcon(stressTrend, true).color} />
                    </View>
                    <Text style={styles.trendCardValue}>{buckets[0]?.stressStability || '—'}</Text>
                    <Text style={styles.trendCardSub}>stability</Text>
                  </LinearGradient>
                </View>
              </Animated.View>

              {/* ── Mood by Week (Elevated Bars) ── */}
              {buckets.some(b => b.avgMood != null) && (
                <Animated.View entering={FadeInDown.delay(220).duration(600)} style={styles.section}>
                  <Text style={styles.sectionTitle}>Mood by Week</Text>
                  <LinearGradient colors={['rgba(35, 40, 55, 0.4)', 'rgba(20, 24, 34, 0.7)']} style={styles.glassCard}>
                    {buckets.map((bucket, i) => (
                      bucket.count > 0 ? (
                        <View key={i} style={styles.barRow}>
                          <Text style={styles.barLabel}>{bucket.label}</Text>
                          <View style={styles.barTrack}>
                            <View style={[styles.barFill, { 
                                width: `${scoreToPercent(bucket.avgMood)}%`, 
                                backgroundColor: i === 0 ? PALETTE.silverBlue : 'rgba(139, 196, 232, 0.4)',
                              }]} 
                            />
                          </View>
                          <Text style={styles.barValue}>{bucket.avgMood != null ? bucket.avgMood.toFixed(1) : '—'}</Text>
                        </View>
                      ) : null
                    ))}
                    <Text style={styles.barsNote}>Score out of 10 · Based on {checkIns.length} total check-ins</Text>
                  </LinearGradient>
                </Animated.View>
              )}

              {/* ── System Analysis ── */}
              <Animated.View entering={FadeInDown.delay(280).duration(600)} style={styles.section}>
                <Text style={styles.sectionTitle}>System Analysis</Text>

                {/* The visual linguistic cloud */}
                <View style={{ marginBottom: 16 }}>
                  <SkiaKeywordStarfield keywords={tagCorrelation ? [...tagCorrelation.restores, ...tagCorrelation.drains].filter(Boolean).slice(0, 5) : ['Quiet', 'Focus', 'Movement']} />
                </View>

                {/* 3-4 Punchy Bullets */}
                <LinearGradient colors={['rgba(35, 40, 55, 0.4)', 'rgba(20, 24, 34, 0.7)']} style={styles.glassCard}>
                  {checkIns.length >= 7 ? (
                    aiInsights ? (
                      <View style={{ gap: 16 }}>
                        {aiInsights.insights.slice(0, 3).map((line, i) => (
                          <View key={i} style={styles.observationItem}>
                            <View style={[styles.observationDot, { backgroundColor: i === 0 ? PALETTE.silverBlue : i === 1 ? PALETTE.emerald : PALETTE.gold }]} />
                            <Text style={[styles.insightLine, { marginBottom: 0 }]}>{line}</Text>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <View style={{ gap: 16 }}>
                        <View style={styles.observationItem}>
                          <View style={[styles.observationDot, { backgroundColor: PALETTE.silverBlue }]} />
                          <Text style={[styles.insightLine, { marginBottom: 0 }]}>
                            {moodTrend === 'up' ? 'Your mood has been moving upward — something is landing differently for you, even if you can\'t quite name it yet.'
                              : moodTrend === 'down' ? 'Something has been pulling at your mood this week. That\'s worth sitting with, not rushing past.'
                              : 'Your mood has been holding steady — that kind of groundedness is its own quiet accomplishment.'}
                          </Text>
                        </View>

                        <View style={styles.observationItem}>
                          <View style={[styles.observationDot, { backgroundColor: PALETTE.copper }]} />
                          <Text style={[styles.insightLine, { marginBottom: 0 }]}>
                            {stressTrend === 'down' ? 'The pressure has been easing. Whatever you\'ve been choosing differently, it\'s showing.'
                              : stressTrend === 'up' ? 'Stress has been building. Worth asking what\'s actually being required of you right now — and whether it\'s all yours to carry.'
                              : 'Stress is holding at a consistent level. Not escalating, but not releasing either — that\'s information worth noticing.'}
                          </Text>
                        </View>

                        {energyMoodInsight != null && (
                          <View style={styles.observationItem}>
                            <View style={[styles.observationDot, { backgroundColor: PALETTE.gold }]} />
                            <Text style={[styles.insightLine, { marginBottom: 0 }]}>{energyMoodInsight}</Text>
                          </View>
                        )}
                      </View>
                    )
                  ) : (
                    <Text style={styles.placeholderText}>Log at least 7 check-ins to unlock pattern observations.</Text>
                  )}

                  {somaticPattern && (
                    <View style={{ marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(197, 180, 147, 0.15)' }}>
                      <Text style={[styles.insightHighlight, { color: PALETTE.amethyst, marginBottom: 12 }]}>Somatic Pattern</Text>
                      <View style={{ gap: 12 }}>
                        <Text style={[styles.insightLine, { marginBottom: 0 }]}>
                          <Text style={{ fontWeight: '700', color: PALETTE.textMain }}>Observation: </Text>
                          You've frequently logged '{somaticPattern.charAt(0).toUpperCase() + somaticPattern.slice(1)}' tension on your high-stress days.
                        </Text>
                        <Text style={[styles.insightLine, { marginBottom: 0 }]}>
                          <Text style={{ fontWeight: '700', color: PALETTE.textMain }}>The Link: </Text>
                          This aligns with your current Blueprint load in the "Focus Domain".
                        </Text>
                        <Text style={[styles.insightLine, { marginBottom: 0 }]}>
                          <Text style={{ fontWeight: '700', color: PALETTE.textMain }}>The Directive: </Text>
                          Try the 4:8 breathing ratio tonight to prevent this tension from entering your "Indigo" recovery window.
                        </Text>
                      </View>
                    </View>
                  )}
                </LinearGradient>
              </Animated.View>

              {/* ── What Restores You ── */}
              <Animated.View entering={FadeInDown.delay(340).duration(600)} style={styles.section}>
                <Text style={styles.sectionTitle}>What Restores You</Text>
                <LinearGradient colors={['rgba(110, 191, 139, 0.12)', 'rgba(20, 24, 34, 0.7)']} style={styles.glassCard}>
                  {aiInsights ? (
                    <>
                      <Text style={styles.insightHighlight}>{aiInsights.micro_line}</Text>
                      {aiInsights.restores.map((line, i) => (
                        <Text key={i} style={styles.insightLine}>{line}</Text>
                      ))}
                    </>
                  ) : (
                    <View style={{ alignItems: 'center' }}>
                      <Ionicons name="leaf-outline" size={28} color={PALETTE.emerald} style={{ marginBottom: 12 }} />
                      <Text style={styles.restorativeMain}>
                        {tagCorrelation && tagCorrelation.restores.length > 0
                          ? `Days involving ${tagCorrelation.restores.length === 1 ? tagCorrelation.restores[0] : tagCorrelation.restores.slice(0, -1).join(', ') + ' and ' + tagCorrelation.restores[tagCorrelation.restores.length - 1]} tend to be your better ones — your own data shows it.`
                          : energyTrend === 'up'
                          ? 'Your energy has been rising — pay attention to what\'s been different. The pattern is starting to emerge.'
                          : 'Keep logging — once you have a few more weeks of data, what restores you will start to show up clearly.'}
                      </Text>

                      {tagCorrelation && tagCorrelation.drains.length > 0 && (
                        <Text style={styles.restorativeSub}>
                          {`Days with ${tagCorrelation.drains.length === 1 ? tagCorrelation.drains[0] : tagCorrelation.drains.slice(0, -1).join(', ') + ' or ' + tagCorrelation.drains[tagCorrelation.drains.length - 1]} tend to be harder for you. That's not judgment — it's just your pattern.`}
                        </Text>
                      )}

                      {bestEnergyDay != null && (
                        <Text style={styles.restorativeSub}>
                          Your energy and mood tend to peak on {bestEnergyDay} — consistent enough to actually plan around.
                        </Text>
                      )}
                    </View>
                  )}
                </LinearGradient>
              </Animated.View>
            </>
          )}

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07090F' },
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  loadingContainer: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: theme.textSecondary, textAlign: 'center', fontStyle: 'italic', marginTop: 16 },

  header: { marginTop: 16, marginBottom: 24 },
  title: { fontSize: 34, color: PALETTE.textMain, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }), letterSpacing: 0.5 },
  subtitle: { color: theme.textSecondary, fontSize: 15, marginTop: 4, fontStyle: 'italic', letterSpacing: 0.3 },

  emptyTitle: { fontSize: 24, color: PALETTE.textMain, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }), textAlign: 'center', marginBottom: 12 },
  emptySubtitle: { fontSize: 15, color: theme.textSecondary, textAlign: 'center', lineHeight: 22, paddingHorizontal: 32, marginBottom: 32 },
  ctaButton: { backgroundColor: 'rgba(197, 180, 147, 0.15)', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(197, 180, 147, 0.3)' },
  ctaText: { color: PALETTE.gold, fontWeight: '700', fontSize: 16 },

  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, color: PALETTE.textMain, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }), marginBottom: 12, letterSpacing: 0.3, paddingLeft: 4 },

  glassCard: { borderRadius: 20, padding: 20, borderWidth: 1, borderColor: PALETTE.glassBorder, borderTopColor: PALETTE.glassHighlight },
  glassCardEmpty: { borderRadius: 20, padding: 32, borderWidth: 1, borderColor: PALETTE.glassBorder, alignItems: 'center' },

  promptLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 6 },
  promptLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  promptText: { fontSize: 22, color: PALETTE.textMain, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }), lineHeight: 32, marginBottom: 24 },
  promptActions: { flexDirection: 'row', gap: 12 },
  promptBtn: { flex: 1, borderRadius: 16, overflow: 'hidden' },
  promptBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 8 },
  promptBtnText: { fontSize: 14, fontWeight: '700' },

  intentionText: { fontSize: 20, color: PALETTE.textMain, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }), lineHeight: 30 },

  trendCards: { flexDirection: 'row', gap: 10 },
  trendCard: { flex: 1, borderRadius: 16, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: PALETTE.glassBorder, borderTopColor: PALETTE.glassHighlight },
  trendCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  trendCardLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  trendCardValue: { fontSize: 24, fontWeight: '700', color: PALETTE.textMain },
  trendCardSub: { fontSize: 11, color: theme.textMuted, marginTop: 4 },

  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  barLabel: { width: 90, fontSize: 13, color: theme.textSecondary },
  barTrack: { flex: 1, height: 6, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  barValue: { width: 32, fontSize: 13, color: PALETTE.textMain, textAlign: 'right', fontWeight: '600' },
  barsNote: { fontSize: 11, color: theme.textMuted, marginTop: 8, textAlign: 'center', fontStyle: 'italic' },

  observationItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  observationDot: { width: 6, height: 6, borderRadius: 3, marginTop: 8, marginRight: 12 },
  
  insightLine: { fontSize: 15, color: theme.textSecondary, lineHeight: 24, marginBottom: 12 },
  insightHighlight: { fontSize: 16, color: PALETTE.textMain, fontWeight: '600', lineHeight: 24, marginBottom: 16 },
  placeholderText: { fontSize: 14, color: theme.textMuted, fontStyle: 'italic', textAlign: 'center', paddingVertical: 12 },

  restorativeMain: { fontSize: 16, color: PALETTE.textMain, textAlign: 'center', lineHeight: 24, marginBottom: 16, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }) },
  restorativeSub: { fontSize: 14, color: theme.textSecondary, textAlign: 'center', fontStyle: 'italic', lineHeight: 20, marginBottom: 12 },

  astroContextCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(197, 180, 147, 0.2)', gap: 16 },
  astroIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(197, 180, 147, 0.1)', justifyContent: 'center', alignItems: 'center' },
  astroContextTitle: { fontSize: 15, fontWeight: '600', color: PALETTE.gold, marginBottom: 2 },
  astroContextSub: { fontSize: 12, color: theme.textMuted },
  
  emptyCardText: { fontSize: 15, color: theme.textSecondary, textAlign: 'center', lineHeight: 22, marginVertical: 20 },
  inlineCtaButton: { backgroundColor: 'rgba(197, 180, 147, 0.15)', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(197, 180, 147, 0.3)' },
  inlineCtaText: { color: PALETTE.gold, fontWeight: '600', fontSize: 14 },
});
