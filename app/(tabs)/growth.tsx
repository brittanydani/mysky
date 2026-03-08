/**
 * Patterns Screen — Accessed from Balance Screen
 *
 * Emotional-intelligence-forward entry point. Surfaces daily reflection
 * prompts, a lightweight pattern snapshot, and intentional access to
 * the deeper daily context screen.
 *
 * Chart-based context is intentionally placed last and requires user action to reach.
 */

import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from '../../components/ui/SkiaGradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Href } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/core';
import * as Haptics from 'expo-haptics';

import { theme } from '../../constants/theme';
import { SkiaDynamicCosmos } from '../../components/ui/SkiaDynamicCosmos';
import { localDb } from '../../services/storage/localDb';
import { logger } from '../../utils/logger';
import { usePremium } from '../../context/PremiumContext';
import { AstrologyCalculator } from '../../services/astrology/calculator';
import { runPipeline } from '../../services/insights/pipeline';
import { computeEnhancedInsights, EnhancedInsightBundle } from '../../utils/journalInsights';

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

export default function PatternsScreen() {
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
            const journalEntries = await localDb.getJournalEntriesPaginated(90);
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
    if (trend === 'improving') return { name: 'trending-down', color: PALETTE.emerald };
    if (trend === 'worsening') return { name: 'trending-up', color: PALETTE.copper };
    return { name: 'remove', color: theme.textMuted };
  };

  const prompt = getDailyPrompt();

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 }]}
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
              colors={['rgba(139, 196, 232, 0.15)', 'rgba(20, 24, 34, 0.6)']}
              style={styles.glassCard}
            >
              <View style={styles.promptLabelRow}>
                <Ionicons name="sparkles" size={14} color={PALETTE.silverBlue} />
                <Text style={[styles.promptLabel, { color: PALETTE.silverBlue }]}>PROMPT FOR TODAY</Text>
              </View>
              <Text style={styles.promptText}>{prompt}</Text>

              <View style={styles.promptActions}>
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

          {/* ── Section 2: Pattern Snapshot ── */}
          <Animated.View entering={FadeInDown.delay(240).duration(600)} style={styles.section}>
            <Text style={styles.sectionTitle}>This Week</Text>

            {snapshot.checkInCount === 0 ? (
              <LinearGradient colors={['rgba(35, 40, 55, 0.4)', 'rgba(20, 24, 34, 0.7)']} style={styles.glassCard}>
                <View style={{ alignItems: 'center', paddingVertical: 10 }}>
                  <Ionicons name="pulse" size={32} color={theme.textMuted} style={{ marginBottom: 12 }} />
                  <Text style={styles.snapshotEmptyText}>Log a few mood check-ins to see your patterns here</Text>
                  <Pressable onPress={() => nav('/(tabs)/mood')}>
                    <Text style={styles.snapshotEmptyLink}>Start tracking →</Text>
                  </Pressable>
                </View>
              </LinearGradient>
            ) : (
              <View style={styles.snapshotRow}>
                {/* Mood Average */}
                <LinearGradient colors={['rgba(35, 40, 55, 0.6)', 'rgba(20, 24, 34, 0.8)']} style={styles.snapshotCard}>
                  <Text style={[styles.snapshotMetricLabel, { color: PALETTE.silverBlue }]}>AVG MOOD</Text>
                  <Text style={styles.snapshotMetricValue}>{snapshot.avgMood != null ? snapshot.avgMood.toFixed(1) : '—'}</Text>
                  <Text style={styles.snapshotMetricSub}>{snapshot.avgMood != null ? moodLabel(snapshot.avgMood) : 'No data'}</Text>
                </LinearGradient>

                {/* Stress Trend */}
                <LinearGradient colors={['rgba(35, 40, 55, 0.6)', 'rgba(20, 24, 34, 0.8)']} style={styles.snapshotCard}>
                  <Text style={[styles.snapshotMetricLabel, { color: PALETTE.copper }]}>STRESS</Text>
                  {snapshot.stressTrend ? (() => {
                    const icon = stressIcon(snapshot.stressTrend);
                    return (
                      <>
                        <Ionicons name={icon.name} size={22} color={icon.color} style={{ marginVertical: 2 }} />
                        <Text style={[styles.snapshotMetricSub, { color: icon.color }]}>
                          {snapshot.stressTrend === 'improving' ? 'Easing' : snapshot.stressTrend === 'worsening' ? 'Rising' : 'Stable'}
                        </Text>
                      </>
                    );
                  })() : (
                    <Text style={styles.snapshotMetricValue}>—</Text>
                  )}
                </LinearGradient>

                {/* Check-in Count */}
                <LinearGradient colors={['rgba(35, 40, 55, 0.6)', 'rgba(20, 24, 34, 0.8)']} style={styles.snapshotCard}>
                  <Text style={[styles.snapshotMetricLabel, { color: PALETTE.gold }]}>LOGGED</Text>
                  <Text style={styles.snapshotMetricValue}>{snapshot.checkInCount}</Text>
                  <Text style={styles.snapshotMetricSub}>last 30 days</Text>
                </LinearGradient>
              </View>
            )}
          </Animated.View>

          {/* ── Section 2b: Well-being Nudge ── */}
          {snapshot.checkInCount >= 3 && (
            <Animated.View entering={FadeInDown.delay(270).duration(600)} style={styles.section}>
              <LinearGradient colors={['rgba(110, 191, 139, 0.15)', 'rgba(20, 24, 34, 0.6)']} style={styles.glassCard}>
                <View style={styles.nudgeLabelRow}>
                  <Ionicons name="heart-outline" size={14} color={PALETTE.emerald} />
                  <Text style={[styles.nudgeLabel, { color: PALETTE.emerald }]}>WELL-BEING CHECK</Text>
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
                  {/* Blended insight */}
                  {enhanced && enhanced.blended.length > 0 && (
                    <LinearGradient colors={['rgba(139, 196, 232, 0.1)', 'rgba(20, 24, 34, 0.7)']} style={styles.glassCard}>
                      <View style={styles.patternLabelRow}>
                        <Ionicons name="git-merge-outline" size={14} color={PALETTE.silverBlue} />
                        <Text style={[styles.patternLabel, { color: PALETTE.silverBlue }]}>WHERE IT CONNECTS</Text>
                      </View>
                      <Text style={styles.patternTitle}>{enhanced.blended[0].title}</Text>
                      <Text style={styles.patternBody}>{enhanced.blended[0].body}</Text>
                      {enhanced.blended[0].journalPrompt ? (
                        <Pressable style={styles.promptPill} onPress={() => nav('/(tabs)/journal')}>
                          <Ionicons name="create-outline" size={14} color={PALETTE.gold} />
                          <Text style={styles.promptPillText}>{enhanced.blended[0].journalPrompt}</Text>
                        </Pressable>
                      ) : null}
                    </LinearGradient>
                  )}

                  {/* Restores & Drains */}
                  {enhanced && enhanced.keywordLift.hasData && (
                    <LinearGradient colors={['rgba(110, 191, 139, 0.1)', 'rgba(20, 24, 34, 0.7)']} style={styles.glassCard}>
                      <View style={styles.patternLabelRow}>
                        <Ionicons name="leaf-outline" size={14} color={PALETTE.emerald} />
                        <Text style={[styles.patternLabel, { color: PALETTE.emerald }]}>FROM YOUR JOURNAL</Text>
                      </View>
                      <Text style={styles.patternTitle}>What restores vs drains you</Text>
                      {enhanced.keywordLift.restores.length > 0 && (
                        <View style={styles.liftRow}>
                          <Text style={[styles.liftLabel, { color: PALETTE.emerald }]}>Tends to restore</Text>
                          <Text style={styles.liftWords}>{enhanced.keywordLift.restores.map(r => r.label).join(', ')}</Text>
                        </View>
                      )}
                      {enhanced.keywordLift.drains.length > 0 && (
                        <View style={[styles.liftRow, { marginTop: 12 }]}>
                          <Text style={[styles.liftLabel, { color: PALETTE.copper }]}>Tends to drain</Text>
                          <Text style={styles.liftWords}>{enhanced.keywordLift.drains.map(d => d.label).join(', ')}</Text>
                        </View>
                      )}
                      <Text style={styles.liftNote}>Based on which words appear more on your best vs hardest days</Text>
                    </LinearGradient>
                  )}

                  {/* Emotion tone shift */}
                  {enhanced && enhanced.emotionToneShift && (
                    <LinearGradient colors={['rgba(197, 180, 147, 0.1)', 'rgba(20, 24, 34, 0.7)']} style={styles.glassCard}>
                      <View style={styles.patternLabelRow}>
                        <Ionicons name="analytics-outline" size={14} color={PALETTE.gold} />
                        <Text style={[styles.patternLabel, { color: PALETTE.gold }]}>EMOTION TONE</Text>
                      </View>
                      <Text style={styles.patternBody}>{enhanced.emotionToneShift.insight}</Text>
                    </LinearGradient>
                  )}

                  {/* Not enough data yet */}
                  {(!enhanced || (enhanced.blended.length === 0 && !enhanced.keywordLift.hasData && !enhanced.emotionToneShift)) && (
                    <LinearGradient colors={['rgba(35, 40, 55, 0.4)', 'rgba(20, 24, 34, 0.7)']} style={styles.glassCard}>
                      <View style={{ alignItems: 'center' }}>
                        <Ionicons name="hourglass-outline" size={28} color={theme.textMuted} style={{ marginBottom: 12 }} />
                        <Text style={[styles.patternBody, { textAlign: 'center', color: theme.textMuted }]}>
                          Keep logging — patterns emerge after a few weeks of check-ins and journal entries.
                        </Text>
                      </View>
                    </LinearGradient>
                  )}
                </>
              ) : (
                /* Free teaser */
                <Pressable onPress={() => nav('/(tabs)/premium')}>
                  <LinearGradient colors={['rgba(197, 180, 147, 0.1)', 'rgba(20, 24, 34, 0.7)']} style={styles.glassCard}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <Ionicons name="lock-closed" size={18} color={PALETTE.gold} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: '600', color: PALETTE.gold, marginBottom: 4 }}>
                          What restores vs drains you
                        </Text>
                        <Text style={{ fontSize: 13, color: theme.textMuted, lineHeight: 18 }}>
                          Deeper Sky reads your journal to surface what tends to help and what tends to wear you down.
                        </Text>
                      </View>
                      <Ionicons name="arrow-forward" size={18} color={PALETTE.gold} />
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
              <Pressable style={styles.exploreChip} onPress={() => nav('/(tabs)/healing')}>
                 <LinearGradient colors={['rgba(35, 40, 55, 0.4)', 'rgba(20, 24, 34, 0.7)']} style={styles.exploreChipGradient}>
                   <View style={[styles.exploreIconWrap, { backgroundColor: 'rgba(212, 163, 179, 0.15)' }]}>
                     <Ionicons name="heart-outline" size={20} color={PALETTE.rose} />
                   </View>
                   <View>
                     <Text style={styles.exploreChipTitle}>Healing</Text>
                     <Text style={styles.exploreChipSub}>Inner work</Text>
                   </View>
                 </LinearGradient>
              </Pressable>

              <Pressable style={styles.exploreChip} onPress={() => nav('/(tabs)/relationships')}>
                 <LinearGradient colors={['rgba(35, 40, 55, 0.4)', 'rgba(20, 24, 34, 0.7)']} style={styles.exploreChipGradient}>
                   <View style={[styles.exploreIconWrap, { backgroundColor: 'rgba(224, 187, 228, 0.15)' }]}>
                     <Ionicons name="people-outline" size={20} color="#E0BBE4" />
                   </View>
                   <View>
                     <Text style={styles.exploreChipTitle}>Connections</Text>
                     <Text style={styles.exploreChipSub}>Relationship charts</Text>
                   </View>
                 </LinearGradient>
              </Pressable>
            </View>
          </Animated.View>

          {/* ── Section 4: Advanced Astrological Context ── */}
          <Animated.View entering={FadeInDown.delay(380).duration(600)} style={[styles.section, { marginTop: 8 }]}>
            <Pressable onPress={() => nav('/astrology-context')}>
              <LinearGradient colors={['rgba(197, 180, 147, 0.1)', 'rgba(197, 180, 147, 0.02)']} style={styles.astrologyCard}>
                <View style={styles.astrologyHeader}>
                  <View style={styles.astrologyIconWrap}>
                    <Ionicons name="planet-outline" size={18} color={PALETTE.gold} />
                  </View>
                  <View style={styles.astrologyTextWrap}>
                    <Text style={styles.astrologyTitle}>Cosmic Context</Text>
                    <Text style={styles.astrologySubtitle}>View today's transits and influences</Text>
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
  container: { flex: 1, backgroundColor: '#07090F' },
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },

  header: { marginTop: 16, marginBottom: 24 },
  title: { fontSize: 34, color: PALETTE.textMain, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }), letterSpacing: 0.5, marginBottom: 4 },
  subtitle: { color: theme.textSecondary, fontSize: 15, fontStyle: 'italic', letterSpacing: 0.3 },

  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, color: PALETTE.textMain, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }), marginBottom: 12, letterSpacing: 0.3, paddingLeft: 4 },

  glassCard: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
    borderTopColor: PALETTE.glassHighlight,
    marginBottom: 8,
  },

  promptLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 6 },
  promptLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  promptText: { fontSize: 22, color: PALETTE.textMain, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }), lineHeight: 32, marginBottom: 24 },
  
  promptActions: { flexDirection: 'row', gap: 12 },
  promptBtn: { flex: 1, borderRadius: 16, overflow: 'hidden' },
  promptBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 8 },
  promptBtnText: { fontSize: 14, fontWeight: '700' },

  snapshotRow: { flexDirection: 'row', gap: 10 },
  snapshotCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
    borderTopColor: PALETTE.glassHighlight,
    minHeight: 96,
  },
  snapshotMetricLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  snapshotMetricValue: { fontSize: 24, fontWeight: '700', color: PALETTE.textMain },
  snapshotMetricSub: { fontSize: 11, color: theme.textSecondary, marginTop: 4, textAlign: 'center' },
  
  snapshotEmptyText: { fontSize: 15, color: theme.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 16 },
  snapshotEmptyLink: { fontSize: 14, color: PALETTE.gold, fontWeight: '600' },

  nudgeLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 6 },
  nudgeLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  nudgeText: { fontSize: 16, color: PALETTE.textMain, lineHeight: 24, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }) },

  patternLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 6 },
  patternLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  patternTitle: { fontSize: 18, color: PALETTE.textMain, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }), marginBottom: 8 },
  patternBody: { fontSize: 15, color: theme.textSecondary, lineHeight: 24 },
  
  promptPill: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, backgroundColor: 'rgba(197, 180, 147, 0.1)' },
  promptPillText: { fontSize: 14, color: PALETTE.gold, fontStyle: 'italic', flex: 1 },
  
  liftRow: { marginTop: 6 },
  liftLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 4, textTransform: 'uppercase' },
  liftWords: { fontSize: 16, color: PALETTE.textMain, fontWeight: '500' },
  liftNote: { fontSize: 12, color: theme.textMuted, marginTop: 16, fontStyle: 'italic' },

  exploreGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  exploreChip: { width: '48%', flexGrow: 1, borderRadius: 16, overflow: 'hidden' },
  exploreChipGradient: { padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 80, borderWidth: 1, borderColor: PALETTE.glassBorder, borderRadius: 16 },
  exploreIconWrap: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  exploreChipTitle: { color: PALETTE.textMain, fontWeight: '600', fontSize: 15, marginBottom: 2 },
  exploreChipSub: { color: theme.textMuted, fontSize: 12 },

  astrologyCard: { padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(197, 180, 147, 0.2)' },
  astrologyHeader: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  astrologyIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(197, 180, 147, 0.1)', justifyContent: 'center', alignItems: 'center' },
  astrologyTextWrap: { flex: 1 },
  astrologyTitle: { fontSize: 15, fontWeight: '600', color: PALETTE.gold, marginBottom: 2 },
  astrologySubtitle: { fontSize: 12, color: theme.textMuted },
});

