/**
 * Insights Tab — Reflection-First Hub
 *
 * Emotional-intelligence-forward entry point. Surfaces daily reflection
 * prompts, a lightweight pattern snapshot, and intentional access to
 * the deeper daily context screen.
 *
 * Chart-based context is intentionally placed last and requires user action to reach.
 */

import React, { useCallback, useState } from 'react';
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
import { logger } from '../../utils/logger';
import { usePremium } from '../../context/PremiumContext';
import { AstrologyCalculator } from '../../services/astrology/calculator';
import { runPipeline } from '../../services/insights/pipeline';
import { computeEnhancedInsights, EnhancedInsightBundle } from '../../utils/journalInsights';

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

interface SnapshotData {
  avgMood: number | null;
  checkInCount: number;
  stressTrend: 'improving' | 'worsening' | 'stable' | null;
}

export default function InsightsScreen() {
  const router = useRouter();
  const { isPremium } = usePremium();
  const [snapshot, setSnapshot] = useState<SnapshotData>({
    avgMood: null,
    checkInCount: 0,
    stressTrend: null,
  });
  const [enhanced, setEnhanced] = useState<EnhancedInsightBundle | null>(null);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const charts = await localDb.getCharts();
          if (charts.length === 0) return;

          const chartId = charts[0].id;
          const checkIns = await localDb.getCheckIns(chartId, 30);

          if (checkIns.length === 0) return;

          const moods = checkIns.map(c => c.moodScore).filter((v): v is number => v != null);
          const avgMood = moods.length > 0
            ? Math.round((moods.reduce((a, b) => a + b, 0) / moods.length) * 10) / 10
            : null;

          // Stress trend: compare oldest half vs newest half
          // stressLevel is 'low' | 'medium' | 'high' — convert to numeric scale
          const levelToScore = (level: string | null | undefined): number | null => {
            if (level === 'low') return 2;
            if (level === 'medium') return 5;
            if (level === 'high') return 9;
            return null;
          };
          let stressTrend: SnapshotData['stressTrend'] = null;
          const stresses = checkIns.map(c => levelToScore(c.stressLevel)).filter((v): v is number => v != null);
          if (stresses.length >= 4) {
            const half = Math.floor(stresses.length / 2);
            const older = stresses.slice(half).reduce((a, b) => a + b, 0) / (stresses.length - half);
            const newer = stresses.slice(0, half).reduce((a, b) => a + b, 0) / half;
            if (newer < older - 0.5) stressTrend = 'improving';
            else if (newer > older + 0.5) stressTrend = 'worsening';
            else stressTrend = 'stable';
          }

          setSnapshot({ avgMood, checkInCount: checkIns.length, stressTrend });

          // ── Enhanced insights pipeline ──
          try {
            const saved = charts[0];
            const birthData = {
              date: saved.birthDate,
              time: saved.birthTime,
              hasUnknownTime: saved.hasUnknownTime,
              place: saved.birthPlace,
              latitude: saved.latitude,
              longitude: saved.longitude,
              timezone: saved.timezone,
              houseSystem: saved.houseSystem,
            };
            const natalChart = AstrologyCalculator.generateNatalChart(birthData);
            const extCheckIns = await localDb.getCheckIns(chartId, 90);
            const journalEntries = await localDb.getJournalEntries();
            const pipelineResult = runPipeline({ checkIns: extCheckIns, journalEntries, chart: natalChart, todayContext: null });
            setEnhanced(computeEnhancedInsights(pipelineResult.dailyAggregates, pipelineResult.chartProfile));
          } catch (e) {
            logger.error('Enhanced insights pipeline failed:', e);
          }
        } catch (e) {
          logger.error('Insights snapshot load failed:', e);
        }
      })();
    }, [])
  );

  const nav = (route: string) => {
    Haptics.selectionAsync().catch(() => {});
    router.push(route as Href);
  };

  const moodLabel = (avg: number): string => {
    if (avg >= 8) return 'Thriving';
    if (avg >= 6) return 'Steady';
    if (avg >= 4) return 'Getting by';
    return 'Struggling';
  };

  const stressIcon = (trend: SnapshotData['stressTrend']): { name: 'trending-down' | 'trending-up' | 'remove'; color: string } => {
    if (trend === 'improving') return { name: 'trending-down', color: theme.growth };
    if (trend === 'worsening') return { name: 'trending-up', color: theme.love };
    return { name: 'remove', color: theme.textMuted };
  };

  const prompt = getDailyPrompt();

  return (
    <View style={styles.container}>
      <StarField starCount={40} />

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 32 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ── */}
          <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
            <Text style={styles.title}>Today's Reflection</Text>
            <Text style={styles.subtitle}>Take a moment to check in with yourself</Text>
          </Animated.View>

          {/* ── Section 1: Daily Reflection Prompt ── */}
          <Animated.View entering={FadeInDown.delay(160).duration(600)} style={styles.section}>
            <LinearGradient
              colors={['rgba(122, 139, 224, 0.14)', 'rgba(122, 139, 224, 0.04)']}
              style={styles.promptCard}
            >
              <View style={styles.promptLabelRow}>
                <Ionicons name="sparkles" size={14} color="#7A8BE0" />
                <Text style={styles.promptLabel}>PROMPT FOR TODAY</Text>
              </View>
              <Text style={styles.promptText}>{prompt}</Text>

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

          {/* ── Section 2: Pattern Snapshot ── */}
          <Animated.View entering={FadeInDown.delay(240).duration(600)} style={styles.section}>
            <Text style={styles.sectionTitle}>This Week</Text>

            {snapshot.checkInCount === 0 ? (
              <LinearGradient
                colors={['rgba(30,45,71,0.7)', 'rgba(26,39,64,0.4)']}
                style={styles.snapshotEmpty}
              >
                <Ionicons name="pulse" size={28} color={theme.textMuted} />
                <Text style={styles.snapshotEmptyText}>
                  Log a few mood check-ins to see your patterns here
                </Text>
                <Pressable
                  onPress={() => nav('/(tabs)/mood')}
                  accessibilityRole="button"
                  accessibilityLabel="Start tracking mood"
                >
                  <Text style={styles.snapshotEmptyLink}>Start tracking →</Text>
                </Pressable>
              </LinearGradient>
            ) : (
              <View style={styles.snapshotRow}>
                {/* Mood Average */}
                <LinearGradient
                  colors={['rgba(122, 139, 224, 0.12)', 'rgba(122, 139, 224, 0.04)']}
                  style={styles.snapshotCard}
                >
                  <Text style={styles.snapshotMetricLabel}>AVG MOOD</Text>
                  <Text style={styles.snapshotMetricValue}>
                    {snapshot.avgMood != null ? snapshot.avgMood.toFixed(1) : '—'}
                  </Text>
                  <Text style={styles.snapshotMetricSub}>
                    {snapshot.avgMood != null ? moodLabel(snapshot.avgMood) : 'No data'}
                  </Text>
                </LinearGradient>

                {/* Stress Trend */}
                <LinearGradient
                  colors={['rgba(110, 191, 139, 0.12)', 'rgba(110, 191, 139, 0.04)']}
                  style={styles.snapshotCard}
                >
                  <Text style={styles.snapshotMetricLabel}>STRESS</Text>
                  {snapshot.stressTrend ? (() => {
                    const icon = stressIcon(snapshot.stressTrend);
                    return (
                      <>
                        <Ionicons name={icon.name} size={26} color={icon.color} />
                        <Text style={[styles.snapshotMetricSub, { color: icon.color }]}>
                          {snapshot.stressTrend === 'improving' ? 'Easing' :
                           snapshot.stressTrend === 'worsening' ? 'Rising' : 'Stable'}
                        </Text>
                      </>
                    );
                  })() : (
                    <Text style={styles.snapshotMetricValue}>—</Text>
                  )}
                </LinearGradient>

                {/* Check-in Count */}
                <LinearGradient
                  colors={['rgba(201, 169, 98, 0.10)', 'rgba(201, 169, 98, 0.03)']}
                  style={styles.snapshotCard}
                >
                  <Text style={styles.snapshotMetricLabel}>LOGGED</Text>
                  <Text style={styles.snapshotMetricValue}>{snapshot.checkInCount}</Text>
                  <Text style={styles.snapshotMetricSub}>last 30 days</Text>
                </LinearGradient>
              </View>
            )}

          </Animated.View>

          {/* ── Section 2b: Well-being Nudge (shown when there's data) ── */}
          {snapshot.checkInCount >= 3 && (
            <Animated.View entering={FadeInDown.delay(270).duration(600)} style={styles.section}>
              <LinearGradient
                colors={['rgba(110, 191, 139, 0.10)', 'rgba(110, 191, 139, 0.03)']}
                style={styles.nudgeCard}
              >
                <View style={styles.nudgeLabelRow}>
                  <Ionicons name="heart-outline" size={13} color={theme.growth} />
                  <Text style={styles.nudgeLabel}>WELL-BEING CHECK</Text>
                </View>
                <Text style={styles.nudgeText}>
                  {snapshot.stressTrend === 'worsening'
                    ? 'Your stress has been climbing. Consider one small act of care today — even five quiet minutes counts.'
                    : snapshot.stressTrend === 'improving'
                    ? 'Stress is easing up. Take note of what\'s been helping — those are your anchors.'
                    : snapshot.avgMood != null && snapshot.avgMood < 5
                    ? 'Your mood has been lower lately. Gentle reminder: you don\'t need to fix it — just be with it today.'
                    : snapshot.avgMood != null && snapshot.avgMood >= 7
                    ? 'You\'ve been doing well. This is a good time to reflect on what\'s been working.'
                    : 'You\'re showing up consistently. That matters more than the numbers.'}
                </Text>
              </LinearGradient>
            </Animated.View>
          )}

          {/* ── Section 2c: Deep Patterns (premium analytics) ── */}
          {snapshot.checkInCount > 0 && (
            <Animated.View entering={FadeInDown.delay(290).duration(600)} style={styles.section}>
              <Text style={styles.sectionTitle}>Your Patterns</Text>

              {isPremium ? (
                <>
                  {/* Blended insight: chart + mood + journal cross-connection */}
                  {enhanced && enhanced.blended.length > 0 && (
                    <LinearGradient
                      colors={['rgba(122, 139, 224, 0.10)', 'rgba(122, 139, 224, 0.03)']}
                      style={[styles.patternCard, { borderColor: 'rgba(122,139,224,0.15)' }]}
                    >
                      <View style={styles.patternLabelRow}>
                        <Ionicons name="git-merge-outline" size={13} color="#7A8BE0" />
                        <Text style={[styles.patternLabel, { color: '#7A8BE0' }]}>WHERE IT CONNECTS</Text>
                      </View>
                      <Text style={styles.patternTitle}>{enhanced.blended[0].title}</Text>
                      <Text style={styles.patternBody}>{enhanced.blended[0].body}</Text>
                      {enhanced.blended[0].journalPrompt ? (
                        <Pressable
                          style={styles.promptPill}
                          onPress={() => nav('/(tabs)/journal')}
                          accessibilityRole="button"
                          accessibilityLabel="Reflect in journal"
                        >
                          <Ionicons name="create-outline" size={13} color={theme.primary} />
                          <Text style={styles.promptPillText}>{enhanced.blended[0].journalPrompt}</Text>
                        </Pressable>
                      ) : null}
                    </LinearGradient>
                  )}

                  {/* Restores & Drains: keyword lift from journal */}
                  {enhanced && enhanced.keywordLift.hasData && (
                    <LinearGradient
                      colors={['rgba(110, 191, 139, 0.10)', 'rgba(110, 191, 139, 0.03)']}
                      style={[styles.patternCard, { borderColor: 'rgba(110,191,139,0.15)' }]}
                    >
                      <View style={styles.patternLabelRow}>
                        <Ionicons name="leaf-outline" size={13} color={theme.growth} />
                        <Text style={[styles.patternLabel, { color: theme.growth }]}>FROM YOUR JOURNAL</Text>
                      </View>
                      <Text style={styles.patternTitle}>What restores vs drains you</Text>
                      {enhanced.keywordLift.restores.length > 0 && (
                        <View style={styles.liftRow}>
                          <Text style={[styles.liftLabel, { color: theme.growth }]}>Tends to restore</Text>
                          <Text style={styles.liftWords}>
                            {enhanced.keywordLift.restores.map(r => r.label).join(', ')}
                          </Text>
                        </View>
                      )}
                      {enhanced.keywordLift.drains.length > 0 && (
                        <View style={[styles.liftRow, { marginTop: 8 }]}>
                          <Text style={[styles.liftLabel, { color: theme.love }]}>Tends to drain</Text>
                          <Text style={styles.liftWords}>
                            {enhanced.keywordLift.drains.map(d => d.label).join(', ')}
                          </Text>
                        </View>
                      )}
                      <Text style={styles.liftNote}>
                        Based on which words appear more on your best vs hardest days
                      </Text>
                    </LinearGradient>
                  )}

                  {/* Emotion tone shift */}
                  {enhanced && enhanced.emotionToneShift && (
                    <LinearGradient
                      colors={['rgba(201, 169, 98, 0.08)', 'rgba(201, 169, 98, 0.02)']}
                      style={[styles.patternCard, { borderColor: 'rgba(201,169,98,0.12)' }]}
                    >
                      <View style={styles.patternLabelRow}>
                        <Ionicons name="analytics-outline" size={13} color={theme.primary} />
                        <Text style={styles.patternLabel}>EMOTION TONE</Text>
                      </View>
                      <Text style={styles.patternBody}>{enhanced.emotionToneShift.insight}</Text>
                    </LinearGradient>
                  )}

                  {/* Not enough data yet */}
                  {(!enhanced || (enhanced.blended.length === 0 && !enhanced.keywordLift.hasData && !enhanced.emotionToneShift)) && (
                    <LinearGradient
                      colors={['rgba(30,45,71,0.7)', 'rgba(26,39,64,0.4)']}
                      style={styles.patternCard}
                    >
                      <Ionicons name="hourglass-outline" size={24} color={theme.textMuted} style={{ marginBottom: 8 }} />
                      <Text style={[styles.patternBody, { textAlign: 'center', color: theme.textMuted }]}>
                        Keep logging — patterns emerge after a few weeks of check-ins and journal entries.
                      </Text>
                    </LinearGradient>
                  )}
                </>
              ) : (
                /* Free teaser */
                <Pressable onPress={() => nav('/(tabs)/premium')} accessibilityRole="button" accessibilityLabel="Unlock deeper pattern analysis">
                  <LinearGradient
                    colors={['rgba(201,169,98,0.10)', 'rgba(201,169,98,0.03)']}
                    style={[styles.patternCard, { borderWidth: 1, borderColor: 'rgba(201,169,98,0.18)' }]}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <Ionicons name="lock-closed" size={16} color={theme.primary} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: theme.primary, marginBottom: 3 }}>
                          What restores vs drains you
                        </Text>
                        <Text style={{ fontSize: 12, color: theme.textMuted, lineHeight: 18 }}>
                          Deeper Sky reads your journal to surface what tends to help and what tends to wear you down
                        </Text>
                      </View>
                      <Ionicons name="arrow-forward" size={16} color={theme.primary} />
                    </View>
                  </LinearGradient>
                </Pressable>
              )}
            </Animated.View>
          )}

          {/* ── Section 3: Explore more ── */}
          <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.section}>
            <Text style={styles.sectionTitle}>Explore</Text>
            <View style={styles.exploreGrid}>
              <Pressable
                style={styles.exploreChip}
                onPress={() => nav('/(tabs)/story')}
                accessibilityRole="button"
                accessibilityLabel="My story"
              >
                <LinearGradient colors={['rgba(30,45,71,0.9)', 'rgba(26,39,64,0.7)']} style={styles.exploreChipGradient}>
                  <Ionicons name="book-outline" size={20} color="#8BC4E8" />
                  <Text style={styles.exploreChipTitle}>My Story</Text>
                  <Text style={styles.exploreChipSub}>Your timeline</Text>
                </LinearGradient>
              </Pressable>

              <Pressable
                style={styles.exploreChip}
                onPress={() => nav('/(tabs)/journal')}
                accessibilityRole="button"
                accessibilityLabel="View journal"
              >
                <LinearGradient colors={['rgba(30,45,71,0.9)', 'rgba(26,39,64,0.7)']} style={styles.exploreChipGradient}>
                  <Ionicons name="journal-outline" size={20} color="#8BC4E8" />
                  <Text style={styles.exploreChipTitle}>Journal</Text>
                  <Text style={styles.exploreChipSub}>Your entries</Text>
                </LinearGradient>
              </Pressable>

              <Pressable
                style={styles.exploreChip}
                onPress={() => nav('/(tabs)/healing')}
                accessibilityRole="button"
                accessibilityLabel="Healing and inner work"
              >
                <LinearGradient colors={['rgba(30,45,71,0.9)', 'rgba(26,39,64,0.7)']} style={styles.exploreChipGradient}>
                  <Ionicons name="heart-outline" size={20} color="#E07A98" />
                  <Text style={styles.exploreChipTitle}>Healing</Text>
                  <Text style={styles.exploreChipSub}>Inner work</Text>
                </LinearGradient>
              </Pressable>

              <Pressable
                style={styles.exploreChip}
                onPress={() => nav('/(tabs)/chart')}
                accessibilityRole="button"
                accessibilityLabel="Personal map"
              >
                <LinearGradient colors={['rgba(30,45,71,0.9)', 'rgba(26,39,64,0.7)']} style={styles.exploreChipGradient}>
                  <Ionicons name="map-outline" size={20} color={theme.primary} />
                  <Text style={styles.exploreChipTitle}>Personal Map</Text>
                  <Text style={styles.exploreChipSub}>Your blueprint</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </Animated.View>

          {/* ── Section 4: Advanced Astrological Context (intentional, secondary) ── */}
          <Animated.View entering={FadeInDown.delay(380).duration(600)} style={styles.section}>
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
                      Your timing, emotional cycles, and personal influences
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

  header: { marginTop: theme.spacing.lg, marginBottom: theme.spacing.lg },
  title: { fontSize: 30, fontWeight: '700', color: theme.textPrimary, fontFamily: 'serif' },
  subtitle: { color: theme.textSecondary, fontSize: 15, marginTop: 6, lineHeight: 22 },

  section: { marginBottom: theme.spacing.lg },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: theme.textPrimary, marginBottom: theme.spacing.md, letterSpacing: 0.3 },

  // Prompt card
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

  // Snapshot
  snapshotRow: { flexDirection: 'row', gap: theme.spacing.sm },
  snapshotCard: {
    flex: 1,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    minHeight: 90,
    justifyContent: 'center',
  },
  snapshotMetricLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: theme.textMuted,
    marginBottom: 6,
  },
  snapshotMetricValue: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  snapshotMetricSub: {
    fontSize: 11,
    color: theme.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  snapshotEmpty: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  snapshotEmptyText: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginTop: theme.spacing.md,
  },
  snapshotEmptyLink: {
    fontSize: 14,
    color: theme.primary,
    fontWeight: '600',
    marginTop: theme.spacing.md,
  },

  // Well-being nudge
  nudgeCard: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(110, 191, 139, 0.15)',
  },
  nudgeLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm },
  nudgeLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    color: theme.growth,
    marginLeft: theme.spacing.xs,
  },
  nudgeText: {
    fontSize: 15,
    color: theme.textSecondary,
    lineHeight: 23,
  },

  // Explore chips
  exploreGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  exploreChip: { width: '48%', flexGrow: 1, borderRadius: theme.borderRadius.lg, overflow: 'hidden' },
  exploreChipGradient: {
    padding: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 90,
    borderWidth: 1,
    borderColor: 'rgba(201,169,98,0.10)',
    borderRadius: theme.borderRadius.lg,
  },
  exploreChipTitle: { color: theme.textPrimary, fontWeight: '700', fontSize: 13, marginTop: 8 },
  exploreChipSub: { color: theme.textMuted, fontSize: 10, marginTop: 2, textAlign: 'center' },

  // Deep Patterns section
  patternCard: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: theme.spacing.sm,
  },
  patternLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    gap: 6,
  },
  patternLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: theme.primary,
  },
  patternTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  patternBody: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 22,
  },
  promptPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: theme.spacing.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: 'rgba(201,169,98,0.08)',
    alignSelf: 'flex-start',
  },
  promptPillText: {
    fontSize: 12,
    color: theme.primary,
    fontStyle: 'italic',
    flex: 1,
  },
  liftRow: {
    marginTop: 6,
  },
  liftLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  liftWords: {
    fontSize: 14,
    color: theme.textPrimary,
    fontWeight: '500',
  },
  liftNote: {
    fontSize: 11,
    color: theme.textMuted,
    marginTop: 10,
    fontStyle: 'italic',
  },

  // Astrology context card
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
