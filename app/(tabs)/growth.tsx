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
import StarField from '../../components/ui/StarField';
import SkiaReflectionMirror from '../../components/ui/SkiaReflectionMirror';
import { localDb } from '../../services/storage/localDb';
import { DailyCheckIn } from '../../services/patterns/types';
import { TAG_LABELS } from '../../utils/tagAnalytics';
import { generateReflectionInsights, ReflectionInsightsResponse, ReflectionInsightsPayload } from '../../services/premium/reflectionInsights';
import { useAuth } from '../../context/AuthContext';
import { logger } from '../../utils/logger';

// ── Cinematic Color Palette ──
const PALETTE = {
  gold: '#D4AF37',
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

// Rotating weekly intentions (by calendar week number)
const WEEKLY_INTENTIONS = [
  "Notice what gives you energy — and what quietly drains it.",
  "Let one thing be enough.",
  "Pay attention to how your body feels at the end of each day.",
  "Do one small thing you've been putting off.",
  "Notice what you're resisting — and get curious about why.",
  "Leave one hour unscheduled and see what you do with it.",
  "Reach out to someone you've been meaning to contact.",
  "Focus on what you can actually influence.",
  "Let yourself be bad at something new.",
  "What you do on ordinary days is who you are.",
  "Choose one expectation to quietly drop this week.",
  "Notice the moments when time feels slow in a good way.",
  "Finish something small that's been lingering.",
  "Say no to one thing without explaining yourself.",
  "Eat one meal without your phone.",
  "Notice the difference between tired and depleted.",
  "Let a conversation go deeper than usual.",
  "Stop optimizing one part of your routine.",
  "Watch how you talk to yourself when things go wrong.",
  "Write down three things that actually happened well today.",
  "Move your body in a way that isn't about fitness.",
  "Spend time outside for no reason.",
  "Do something slow on purpose.",
  "Notice what you envy — it's usually information.",
  "Let yourself want what you actually want.",
  "Be less available this week and see what opens up.",
  "Ask for help with something specific.",
  "Finish a thought before reaching for your phone.",
  "Pick one habit and do it without tracking it.",
  "Sit somewhere new. Notice what's different.",
  "Read something with no practical use.",
  "Let a problem rest overnight before responding to it.",
  "Notice what kind of tired you are.",
  "Do one thing this week that isn't for anyone else.",
  "Stop correcting your instincts and follow one.",
  "Write down what's actually bothering you.",
  "Let yourself be fully in one conversation this week.",
  "Decide something without researching it.",
  "Notice what you're tolerating.",
  "Go to bed when you're tired instead of when you feel ready.",
  "Do less than you planned. Notice what actually mattered.",
  "Don't explain yourself once this week.",
  "Notice what you're grateful for before checking your phone in the morning.",
  "Let yourself feel awkward about something instead of fixing it.",
  "Spend less time on something you do out of habit.",
  "Make one decision based on how it'll feel in a month, not a day.",
  "Call or text someone you love, without a reason.",
  "Acknowledge something difficult without trying to solve it yet.",
  "Do one thing you said you'd do, for yourself.",
  "Notice where you're performing versus actually feeling.",
];

function getWeeklyIntention(): string {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const weekNum = Math.floor((now.getTime() - startOfYear.getTime()) / (7 * 86_400_000));
  return WEEKLY_INTENTIONS[weekNum % WEEKLY_INTENTIONS.length];
}

// Group 30 check-ins into up to 4 weekly buckets
interface WeekBucket {
  label: string;
  avgMood: number | null;
  avgEnergy: number | null;
  avgStress: number | null;
  count: number;
}

function levelToScore(level: string | null | undefined): number | null {
  if (level === 'low') return 2;
  if (level === 'medium') return 5;
  if (level === 'high') return 9;
  return null;
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

  useEffect(() => {
    if (checkIns.length < 7 || !session?.access_token) return;
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
  }, [checkIns, session?.access_token]);

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
        <StarField starCount={40} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!hasChart) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <StarField starCount={40} />
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
      <StarField starCount={60} />

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* ── Header ── */}
          <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
            <Text style={styles.title}>Reflect</Text>
            <Text style={styles.subtitle}>Check in with yourself</Text>
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
                  <LinearGradient colors={['rgba(212, 175, 55, 0.25)', 'rgba(212, 175, 55, 0.1)']} style={styles.promptBtnGradient}>
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

          {/* ── Weekly Intention (Cinematic Glass) ── */}
          <Animated.View entering={FadeInDown.delay(140).duration(600)} style={styles.section}>
            <LinearGradient colors={['rgba(110, 191, 139, 0.15)', 'rgba(20, 24, 34, 0.6)']} style={styles.glassCard}>
              <View style={styles.promptLabelRow}>
                <Ionicons name="leaf-outline" size={14} color={PALETTE.emerald} />
                <Text style={[styles.promptLabel, { color: PALETTE.emerald }]}>THIS WEEK'S INTENTION</Text>
              </View>
              <Text style={styles.intentionText}>{getWeeklyIntention()}</Text>
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
              {/* ── 30-Day Overview Widgets ── */}
              <Animated.View entering={FadeInDown.delay(160).duration(600)} style={styles.section}>
                <Text style={styles.sectionTitle}>30-Day Overview</Text>
                <View style={styles.trendCards}>
                  {/* Mood Widget */}
                  <LinearGradient colors={['rgba(35, 40, 55, 0.6)', 'rgba(20, 24, 34, 0.8)']} style={styles.trendCard}>
                    <View style={styles.trendCardHeader}>
                      <Text style={[styles.trendCardLabel, { color: PALETTE.silverBlue }]}>MOOD</Text>
                      <Ionicons name={trendIcon(moodTrend).name} size={16} color={trendIcon(moodTrend).color} />
                    </View>
                    <Text style={styles.trendCardValue}>{buckets[0]?.avgMood != null ? buckets[0].avgMood.toFixed(1) : '—'}</Text>
                    <Text style={styles.trendCardSub}>this week avg</Text>
                  </LinearGradient>

                  {/* Energy Widget */}
                  <LinearGradient colors={['rgba(35, 40, 55, 0.6)', 'rgba(20, 24, 34, 0.8)']} style={styles.trendCard}>
                    <View style={styles.trendCardHeader}>
                      <Text style={[styles.trendCardLabel, { color: PALETTE.gold }]}>ENERGY</Text>
                      <Ionicons name={trendIcon(energyTrend).name} size={16} color={trendIcon(energyTrend).color} />
                    </View>
                    <Text style={styles.trendCardValue}>{buckets[0]?.avgEnergy != null ? buckets[0].avgEnergy.toFixed(1) : '—'}</Text>
                    <Text style={styles.trendCardSub}>this week avg</Text>
                  </LinearGradient>

                  {/* Stress Widget */}
                  <LinearGradient colors={['rgba(35, 40, 55, 0.6)', 'rgba(20, 24, 34, 0.8)']} style={styles.trendCard}>
                    <View style={styles.trendCardHeader}>
                      <Text style={[styles.trendCardLabel, { color: PALETTE.copper }]}>STRESS</Text>
                      <Ionicons name={trendIcon(stressTrend, true).name} size={16} color={trendIcon(stressTrend, true).color} />
                    </View>
                    <Text style={styles.trendCardValue}>{buckets[0]?.avgStress != null ? buckets[0].avgStress.toFixed(1) : '—'}</Text>
                    <Text style={styles.trendCardSub}>this week avg</Text>
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

              {/* ── Sign-in CTA (if no session) ── */}
              {checkIns.length >= 7 && !session && (
                <Animated.View entering={FadeInDown.delay(275).duration(600)} style={styles.section}>
                  <Pressable onPress={() => nav('/(auth)/sign-in')}>
                    <LinearGradient colors={['rgba(139, 196, 232, 0.15)', 'rgba(20, 24, 34, 0.8)']} style={[styles.glassCard, { flexDirection: 'row', alignItems: 'center', gap: 16 }]}>
                      <Ionicons name="sparkles-outline" size={24} color={PALETTE.silverBlue} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.sectionTitle, { marginBottom: 4, color: PALETTE.silverBlue }]}>Unlock AI Reflections</Text>
                        <Text style={{ fontSize: 13, color: theme.textSecondary, lineHeight: 18 }}>Sign in to generate deep insights written just for you, based on your actual data patterns.</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
                    </LinearGradient>
                  </Pressable>
                </Animated.View>
              )}

              {/* ── Observations (Raw Data) ── */}
              <Animated.View entering={FadeInDown.delay(280).duration(600)} style={styles.section}>
                <Text style={styles.sectionTitle}>Observations</Text>
                <LinearGradient colors={['rgba(35, 40, 55, 0.4)', 'rgba(20, 24, 34, 0.7)']} style={styles.glassCard}>
                  {checkIns.length >= 7 ? (
                    aiInsights ? (
                      aiInsights.observations.map((line, i) => (
                        <Text key={i} style={styles.insightLine}>{line}</Text>
                      ))
                    ) : (
                      <>
                        <View style={styles.observationItem}>
                          <View style={[styles.observationDot, { backgroundColor: PALETTE.silverBlue }]} />
                          <Text style={styles.insightLine}>
                            {moodTrend === 'up' ? 'Your mood has been moving upward — something is landing differently for you, even if you can\'t quite name it yet.'
                              : moodTrend === 'down' ? 'Something has been pulling at your mood this week. That\'s worth sitting with, not rushing past.'
                              : 'Your mood has been holding steady — that kind of groundedness is its own quiet accomplishment.'}
                          </Text>
                        </View>

                        <View style={styles.observationItem}>
                          <View style={[styles.observationDot, { backgroundColor: PALETTE.copper }]} />
                          <Text style={styles.insightLine}>
                            {stressTrend === 'down' ? 'The pressure has been easing. Whatever you\'ve been choosing differently, it\'s showing.'
                              : stressTrend === 'up' ? 'Stress has been building. Worth asking what\'s actually being required of you right now — and whether it\'s all yours to carry.'
                              : 'Stress is holding at a consistent level. Not escalating, but not releasing either — that\'s information worth noticing.'}
                          </Text>
                        </View>

                        {energyMoodInsight != null && (
                          <View style={styles.observationItem}>
                            <View style={[styles.observationDot, { backgroundColor: PALETTE.gold }]} />
                            <Text style={styles.insightLine}>{energyMoodInsight}</Text>
                          </View>
                        )}
                      </>
                    )
                  ) : (
                    <Text style={styles.placeholderText}>Log at least 7 check-ins to unlock pattern observations.</Text>
                  )}
                </LinearGradient>
              </Animated.View>

              {/* ── AI Synthesis ── */}
              {aiInsights && (
                <Animated.View entering={FadeInDown.delay(310).duration(600)} style={styles.section}>
                  <Text style={styles.sectionTitle}>Synthesis</Text>
                  <LinearGradient colors={['rgba(212, 175, 55, 0.08)', 'rgba(20, 24, 34, 0.7)']} style={styles.glassCard}>
                    {aiInsights.insights.map((line, i) => (
                      <Text key={i} style={styles.insightLine}>{line}</Text>
                    ))}
                  </LinearGradient>
                </Animated.View>
              )}

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

          {/* ── Astrology Context (Secondary Hook) ── */}
          <Animated.View entering={FadeInDown.delay(400).duration(600)} style={[styles.section, { marginTop: 16 }]}>
            <Pressable onPress={() => nav('/astrology-context')}>
              <LinearGradient colors={['rgba(212, 175, 55, 0.1)', 'rgba(212, 175, 55, 0.02)']} style={styles.astroContextCard}>
                <View style={styles.astroIconWrap}>
                  <Ionicons name="planet-outline" size={18} color={PALETTE.gold} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.astroContextTitle}>Cosmic Context</Text>
                  <Text style={styles.astroContextSub}>View today's transits and influences</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
              </LinearGradient>
            </Pressable>
          </Animated.View>

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
  ctaButton: { backgroundColor: 'rgba(212, 175, 55, 0.15)', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.3)' },
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

  astroContextCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.2)', gap: 16 },
  astroIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(212, 175, 55, 0.1)', justifyContent: 'center', alignItems: 'center' },
  astroContextTitle: { fontSize: 15, fontWeight: '600', color: PALETTE.gold, marginBottom: 2 },
  astroContextSub: { fontSize: 12, color: theme.textMuted },
  
  emptyCardText: { fontSize: 15, color: theme.textSecondary, textAlign: 'center', lineHeight: 22, marginVertical: 20 },
  inlineCtaButton: { backgroundColor: 'rgba(212, 175, 55, 0.15)', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.3)' },
  inlineCtaText: { color: PALETTE.gold, fontWeight: '600', fontSize: 14 },
});
