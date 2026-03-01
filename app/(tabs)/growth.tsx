/**
 * Reflect Tab — Daily Reflection + Behavioral Pattern Analytics
 *
 * Merges the former Insights + Growth tabs into a single reflection-first
 * screen. Daily prompt at top, followed by 30-day behavioral data
 * (mood trends, energy, stress). Astrology context is available at the
 * very bottom as an intentional, secondary link.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Href } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/core';
import * as Haptics from 'expo-haptics';

import { theme } from '../../constants/theme';
import StarField from '../../components/ui/StarField';
import { localDb } from '../../services/storage/localDb';
import { DailyCheckIn } from '../../services/patterns/types';
import { logger } from '../../utils/logger';

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
  "Notice what gives you energy \u2014 and what quietly drains it.",
  "Let one thing be enough.",
  "Pay attention to how your body feels at the end of each day.",
  "Do one small thing you've been putting off.",
  "Notice what you're resisting \u2014 and get curious about why.",
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
  "Notice what you envy \u2014 it's usually information.",
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

// EnergyLevel / StressLevel are 'low' | 'medium' | 'high' strings — map to 1–10 scale
function levelToScore(level: string | null | undefined): number | null {
  if (level === 'low') return 2;
  if (level === 'medium') return 5;
  if (level === 'high') return 9;
  return null;
}

function buildWeekBuckets(checkIns: DailyCheckIn[]): WeekBucket[] {
  if (checkIns.length === 0) return [];

  // Bucket by calendar week (0 = most recent week)
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

// Bar width 0–100% from a 1–10 score
function scoreToPercent(score: number | null): number {
  if (score == null) return 0;
  return Math.min(100, Math.max(0, ((score - 1) / 9) * 100));
}

export default function ReflectScreen() {
  const router = useRouter();
  const [checkIns, setCheckIns] = useState<DailyCheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasChart, setHasChart] = useState(false);

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

  // Real energy–mood correlation from check-in data
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
        ? `On high-energy days your mood averages ${highAvg.toFixed(1)} — vs ${lowAvg.toFixed(1)} on low-energy days.`
        : `Your mood stays steady even on low-energy days (${lowAvg.toFixed(1)} vs ${highAvg.toFixed(1)} on high-energy days).`;
    }
    return null;
  }, [checkIns]);

  // Best day-of-week for energy from check-in data
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

  const trendIcon = (dir: 'up' | 'down' | 'flat', inverse = false) => {
    const isPositive = inverse ? dir === 'down' : dir === 'up';
    const isNegative = inverse ? dir === 'up' : dir === 'down';
    if (isPositive) return { name: 'trending-up' as const, color: theme.growth };
    if (isNegative) return { name: 'trending-down' as const, color: theme.love };
    return { name: 'remove' as const, color: theme.textMuted };
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <StarField starCount={30} />
        <Text style={styles.loadingText}>Loading…</Text>
      </View>
    );
  }

  if (!hasChart) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <StarField starCount={30} />
        <Ionicons name="leaf-outline" size={48} color={theme.textMuted} />
        <Text style={styles.emptyTitle}>Your reflection space</Text>
        <Text style={styles.emptySubtitle}>
          Log a few mood check-ins and journal entries to see your patterns and insights here.
        </Text>
        <Pressable
          style={styles.ctaButton}
          onPress={() => nav('/(tabs)/mood')}
          accessibilityRole="button"
          accessibilityLabel="Log your first mood"
        >
          <Text style={styles.ctaText}>Log Your First Mood</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StarField starCount={30} />

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 32 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ── */}
          <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
            <Text style={styles.title}>Reflect</Text>
            <Text style={styles.subtitle}>Check in with yourself</Text>
          </Animated.View>

          {/* ── Daily Reflection Prompt ── */}
          <Animated.View entering={FadeInDown.delay(120).duration(600)} style={styles.section}>
            <LinearGradient
              colors={['rgba(122, 139, 224, 0.14)', 'rgba(122, 139, 224, 0.04)']}
              style={styles.promptCard}
            >
              <View style={styles.promptLabelRow}>
                <Ionicons name="sparkles" size={14} color="#7A8BE0" />
                <Text style={styles.promptLabel}>PROMPT FOR TODAY</Text>
              </View>
              <Text style={styles.promptText}>{getDailyPrompt()}</Text>

              <View style={styles.promptActions}>
                <Pressable
                  style={styles.promptBtn}
                  onPress={() => nav('/(tabs)/mood')}
                  accessibilityRole="button"
                  accessibilityLabel="Log mood"
                >
                  <LinearGradient
                    colors={['rgba(122, 139, 224, 0.3)', 'rgba(122, 139, 224, 0.15)']}
                    style={styles.promptBtnGradient}
                  >
                    <Ionicons name="happy-outline" size={18} color="#7A8BE0" />
                    <Text style={[styles.promptBtnText, { color: '#7A8BE0' }]}>Log Mood</Text>
                  </LinearGradient>
                </Pressable>

                <Pressable
                  style={styles.promptBtn}
                  onPress={() => nav('/(tabs)/journal')}
                  accessibilityRole="button"
                  accessibilityLabel="Write in journal"
                >
                  <LinearGradient
                    colors={['rgba(201, 169, 98, 0.25)', 'rgba(201, 169, 98, 0.10)']}
                    style={styles.promptBtnGradient}
                  >
                    <Ionicons name="create-outline" size={18} color={theme.primary} />
                    <Text style={[styles.promptBtnText, { color: theme.primary }]}>Write Journal</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* ── Weekly Intention ── */}
          <Animated.View entering={FadeInDown.delay(140).duration(600)} style={styles.section}>
            <LinearGradient
              colors={['rgba(110, 191, 139, 0.12)', 'rgba(110, 191, 139, 0.04)']}
              style={styles.intentionCard}
            >
              <View style={styles.intentionLabelRow}>
                <Ionicons name="leaf-outline" size={13} color={theme.growth} />
                <Text style={styles.intentionLabel}>THIS WEEK'S INTENTION</Text>
              </View>
              <Text style={styles.intentionText}>{getWeeklyIntention()}</Text>
            </LinearGradient>
          </Animated.View>

          {checkIns.length === 0 ? (
            <Animated.View entering={FadeInDown.delay(160).duration(600)}>
              <LinearGradient
                colors={['rgba(30,45,71,0.8)', 'rgba(26,39,64,0.5)']}
                style={styles.emptyCard}
              >
                <Ionicons name="pulse" size={32} color={theme.textMuted} />
                <Text style={styles.emptyCardText}>
                  No data yet. Log your mood daily to unlock trend analysis.
                </Text>
                <Pressable
                  style={styles.inlineCtaButton}
                  onPress={() => nav('/(tabs)/mood')}
                  accessibilityRole="button"
                  accessibilityLabel="Log mood"
                >
                  <Text style={styles.inlineCtaText}>Log Mood Now</Text>
                </Pressable>
              </LinearGradient>
            </Animated.View>
          ) : (
            <>
              {/* ── Trend Summary Cards ── */}
              <Animated.View entering={FadeInDown.delay(160).duration(600)} style={styles.section}>
                <Text style={styles.sectionTitle}>30-Day Overview</Text>
                <View style={styles.trendCards}>
                  {/* Mood */}
                  <LinearGradient
                    colors={['rgba(122, 139, 224, 0.12)', 'rgba(122, 139, 224, 0.04)']}
                    style={styles.trendCard}
                  >
                    <View style={styles.trendCardHeader}>
                      <Text style={styles.trendCardLabel}>MOOD</Text>
                      <Ionicons name={trendIcon(moodTrend).name} size={16} color={trendIcon(moodTrend).color} />
                    </View>
                    <Text style={styles.trendCardValue}>
                      {buckets[0]?.avgMood != null ? buckets[0].avgMood.toFixed(1) : '—'}
                    </Text>
                    <Text style={styles.trendCardSub}>this week avg</Text>
                  </LinearGradient>

                  {/* Energy */}
                  <LinearGradient
                    colors={['rgba(110, 191, 139, 0.12)', 'rgba(110, 191, 139, 0.04)']}
                    style={styles.trendCard}
                  >
                    <View style={styles.trendCardHeader}>
                      <Text style={styles.trendCardLabel}>ENERGY</Text>
                      <Ionicons name={trendIcon(energyTrend).name} size={16} color={trendIcon(energyTrend).color} />
                    </View>
                    <Text style={styles.trendCardValue}>
                      {buckets[0]?.avgEnergy != null ? buckets[0].avgEnergy.toFixed(1) : '—'}
                    </Text>
                    <Text style={styles.trendCardSub}>this week avg</Text>
                  </LinearGradient>

                  {/* Stress (inverted — down is good) */}
                  <LinearGradient
                    colors={['rgba(224, 176, 122, 0.10)', 'rgba(224, 176, 122, 0.03)']}
                    style={styles.trendCard}
                  >
                    <View style={styles.trendCardHeader}>
                      <Text style={styles.trendCardLabel}>STRESS</Text>
                      <Ionicons name={trendIcon(stressTrend, true).name} size={16} color={trendIcon(stressTrend, true).color} />
                    </View>
                    <Text style={styles.trendCardValue}>
                      {buckets[0]?.avgStress != null ? buckets[0].avgStress.toFixed(1) : '—'}
                    </Text>
                    <Text style={styles.trendCardSub}>this week avg</Text>
                  </LinearGradient>
                </View>
              </Animated.View>

              {/* ── Weekly Mood Bars ── */}
              {buckets.some(b => b.avgMood != null) && (
                <Animated.View entering={FadeInDown.delay(220).duration(600)} style={styles.section}>
                  <Text style={styles.sectionTitle}>Mood by Week</Text>
                  <LinearGradient
                    colors={['rgba(30,45,71,0.8)', 'rgba(26,39,64,0.5)']}
                    style={styles.barsCard}
                  >
                    {buckets.map((bucket, i) => (
                      bucket.count > 0 ? (
                        <View key={i} style={styles.barRow}>
                          <Text style={styles.barLabel}>{bucket.label}</Text>
                          <View style={styles.barTrack}>
                            <View
                              style={[
                                styles.barFill,
                                {
                                  width: `${scoreToPercent(bucket.avgMood)}%`,
                                  backgroundColor: i === 0 ? theme.primary : 'rgba(201,169,98,0.5)',
                                },
                              ]}
                            />
                          </View>
                          <Text style={styles.barValue}>
                            {bucket.avgMood != null ? bucket.avgMood.toFixed(1) : '—'}
                          </Text>
                        </View>
                      ) : null
                    ))}
                    <Text style={styles.barsNote}>Score out of 10 · {checkIns.length} check-ins total</Text>
                  </LinearGradient>
                </Animated.View>
              )}

              {/* ── Correlation Scaffold ── */}
              <Animated.View entering={FadeInDown.delay(280).duration(600)} style={styles.section}>
                <Text style={styles.sectionTitle}>Observations</Text>
                <LinearGradient
                  colors={['rgba(30,45,71,0.7)', 'rgba(26,39,64,0.4)']}
                  style={styles.correlationCard}
                >
                  {checkIns.length >= 7 ? (
                    <>
                      {/* Journaling frequency vs mood — computed from available data */}
                      <View style={styles.correlationItem}>
                        <View style={styles.correlationDot} />
                        <Text style={styles.correlationText}>
                          {moodTrend === 'up'
                            ? 'Your mood has been climbing — something is working.'
                            : moodTrend === 'down'
                            ? 'Mood has dipped this week — a good time for gentle reflection.'
                            : 'Your mood has been holding steady.'}
                        </Text>
                      </View>

                      <View style={styles.correlationItem}>
                        <View style={styles.correlationDot} />
                        <Text style={styles.correlationText}>
                          {stressTrend === 'down'
                            ? 'Stress is easing — keep doing what you\'re doing.'
                            : stressTrend === 'up'
                            ? 'Stress is rising — consider a lighter day or journaling it out.'
                            : 'Stress levels are stable.'}
                        </Text>
                      </View>

                      {energyMoodInsight != null && (
                        <View style={styles.correlationItem}>
                          <View style={styles.correlationDot} />
                          <Text style={styles.correlationText}>{energyMoodInsight}</Text>
                        </View>
                      )}
                    </>
                  ) : (
                    <Text style={styles.correlationPlaceholder}>
                      Log at least 7 check-ins to unlock correlation insights.
                    </Text>
                  )}
                </LinearGradient>
              </Animated.View>

              {/* ── Restorative Patterns Scaffold ── */}
              <Animated.View entering={FadeInDown.delay(340).duration(600)} style={styles.section}>
                <Text style={styles.sectionTitle}>What Restores You</Text>
                <LinearGradient
                  colors={['rgba(110, 191, 139, 0.08)', 'rgba(110, 191, 139, 0.02)']}
                  style={styles.restorativeCard}
                >
                  <Ionicons name="leaf-outline" size={24} color={theme.growth} />
                  <Text style={styles.restorativeText}>
                    {energyTrend === 'up'
                      ? 'Your energy is rising — take note of what\'s been different this week.'
                      : 'Track more consistently to discover what restores your energy most.'}
                  </Text>

                  {bestEnergyDay != null && (
                    <Text style={styles.restorativeDetail}>
                      Your energy tends to be highest on {bestEnergyDay}.
                    </Text>
                  )}
                </LinearGradient>
              </Animated.View>
            </>
          )}

          {/* ── Explore ── */}
          <Animated.View entering={FadeInDown.delay(370).duration(600)} style={styles.section}>
            <Text style={styles.sectionTitle}>Explore</Text>
            <View style={styles.exploreRow}>
              <Pressable
                style={styles.exploreChip}
                onPress={() => nav('/(tabs)/chart')}
                accessibilityRole="button"
                accessibilityLabel="Personal map"
              >
                <Ionicons name="map-outline" size={16} color={theme.primary} />
                <Text style={styles.exploreChipText}>Personal Map</Text>
              </Pressable>

              <Pressable
                style={styles.exploreChip}
                onPress={() => nav('/(tabs)/story')}
                accessibilityRole="button"
                accessibilityLabel="My story"
              >
                <Ionicons name="book-outline" size={16} color="#8BC4E8" />
                <Text style={styles.exploreChipText}>My Story</Text>
              </Pressable>

              <Pressable
                style={styles.exploreChip}
                onPress={() => nav('/(tabs)/healing')}
                accessibilityRole="button"
                accessibilityLabel="Healing"
              >
                <Ionicons name="heart-outline" size={16} color="#E07A98" />
                <Text style={styles.exploreChipText}>Healing</Text>
              </Pressable>
            </View>
          </Animated.View>

          {/* ── Astrology Context — intentional, secondary ── */}
          <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.section}>
            <Pressable
              onPress={() => nav('/astrology-context')}
              accessibilityRole="button"
              accessibilityLabel="View daily context"
            >
              <LinearGradient
                colors={['rgba(201, 169, 98, 0.08)', 'rgba(201, 169, 98, 0.03)']}
                style={styles.astrologyCard}
              >
                <View style={styles.astrologyHeader}>
                  <View style={styles.astrologyIconWrap}>
                    <Ionicons name="partly-sunny-outline" size={18} color={theme.primary} />
                  </View>
                  <View style={styles.astrologyTextWrap}>
                    <Text style={styles.astrologyTitle}>Daily Context & Influences</Text>
                    <Text style={styles.astrologySubtitle}>
                      View your current influences
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
                </View>
              </LinearGradient>
            </Pressable>
          </Animated.View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: theme.spacing.lg },
  loadingContainer: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: theme.spacing.xl },
  loadingText: { fontSize: 16, color: theme.textSecondary, textAlign: 'center', fontStyle: 'italic' },

  header: { marginTop: theme.spacing.lg, marginBottom: theme.spacing.xl },
  title: { fontSize: 30, fontWeight: '700', color: theme.textPrimary, fontFamily: 'serif' },
  subtitle: { color: theme.textSecondary, fontSize: 15, marginTop: 6 },

  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: theme.textPrimary,
    fontFamily: 'serif',
    textAlign: 'center',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  emptySubtitle: {
    fontSize: 15,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  ctaButton: {
    backgroundColor: 'rgba(201, 169, 98, 0.2)',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 98, 0.3)',
  },
  ctaText: { color: theme.primary, fontWeight: '600', fontSize: 16 },

  section: { marginBottom: theme.spacing.lg },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: theme.spacing.md,
    letterSpacing: 0.3,
  },

  // Trend summary cards
  trendCards: { flexDirection: 'row', gap: theme.spacing.sm },
  trendCard: {
    flex: 1,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    minHeight: 90,
    justifyContent: 'center',
  },
  trendCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  trendCardLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5, color: theme.textMuted },
  trendCardValue: { fontSize: 22, fontWeight: '700', color: theme.textPrimary },
  trendCardSub: { fontSize: 10, color: theme.textMuted, marginTop: 2 },

  // Bar chart
  barsCard: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.md },
  barLabel: { width: 90, fontSize: 12, color: theme.textSecondary },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 4 },
  barValue: { width: 30, fontSize: 12, color: theme.textPrimary, textAlign: 'right', marginLeft: 8 },
  barsNote: { fontSize: 11, color: theme.textMuted, marginTop: theme.spacing.sm, textAlign: 'center' },

  // Empty card
  emptyCard: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: theme.spacing.lg,
  },
  emptyCardText: {
    fontSize: 15,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  inlineCtaButton: {
    backgroundColor: 'rgba(201, 169, 98, 0.15)',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 98, 0.25)',
  },
  inlineCtaText: { color: theme.primary, fontWeight: '600', fontSize: 14 },

  // Correlation
  correlationCard: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  correlationItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: theme.spacing.md },
  correlationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.primary,
    marginTop: 6,
    marginRight: theme.spacing.sm,
    flexShrink: 0,
  },
  correlationText: { flex: 1, fontSize: 14, color: theme.textSecondary, lineHeight: 21 },
  correlationPlaceholder: { fontSize: 14, color: theme.textMuted, fontStyle: 'italic', textAlign: 'center', padding: theme.spacing.md },

  // Restorative
  restorativeCard: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(110, 191, 139, 0.12)',
    alignItems: 'center',
  },
  restorativeText: {
    fontSize: 15,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: theme.spacing.md,
  },
  restorativeDetail: {
    fontSize: 13,
    color: theme.textMuted,
    textAlign: 'center',
    marginTop: theme.spacing.md,
    fontStyle: 'italic',
  },

  // Explore row
  exploreRow: { flexDirection: 'row', gap: theme.spacing.sm },
  exploreChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  exploreChipText: { fontSize: 12, fontWeight: '600', color: theme.textSecondary },

  // Weekly intention
  intentionCard: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(110, 191, 139, 0.15)',
  },
  intentionLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.md },
  intentionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    color: theme.growth,
    marginLeft: theme.spacing.xs,
  },
  intentionText: {
    fontSize: 19,
    color: theme.textPrimary,
    fontFamily: 'serif',
    lineHeight: 28,
  },

  // Daily reflection prompt
  promptCard: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(122, 139, 224, 0.15)',
  },
  promptLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.md },
  promptLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#7A8BE0',
    marginLeft: theme.spacing.xs,
  },
  promptText: {
    fontSize: 20,
    color: theme.textPrimary,
    fontFamily: 'serif',
    lineHeight: 30,
    marginBottom: theme.spacing.xl,
  },
  promptActions: { flexDirection: 'row', gap: theme.spacing.sm },
  promptBtn: { flex: 1, borderRadius: theme.borderRadius.lg, overflow: 'hidden' },
  promptBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    gap: 6,
  },
  promptBtnText: { fontSize: 14, fontWeight: '600' },

  // Astrology context card (bottom, intentionally subtle)
  astrologyCard: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 98, 0.12)',
  },
  astrologyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  astrologyIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(201, 169, 98, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  astrologyTextWrap: { flex: 1 },
  astrologyTitle: { fontSize: 14, fontWeight: '600', color: theme.primary, marginBottom: 3 },
  astrologySubtitle: { fontSize: 12, color: theme.textSecondary, lineHeight: 17 },
});
