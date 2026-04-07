/**
 * Patterns Screen — accessed from (tabs)/patterns route.
 *
 * Unified hub: quantitative snapshot, data visualization,
 * and full insight sections (trends, correlations, personal patterns, etc.).
 */

import React, { useCallback, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from '../../components/ui/SkiaGradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/core';
import * as Haptics from 'expo-haptics';

import { SkiaDynamicCosmos } from '../../components/ui/SkiaDynamicCosmos';
import { localDb } from '../../services/storage/localDb';
import { EncryptedAsyncStorage } from '../../services/storage/encryptedAsyncStorage';
import { computeTriggerPatternSummary, buildTriggerPatternNarrative } from '../../utils/triggerPatterns';
import { logger } from '../../utils/logger';
import { usePremium } from '../../context/PremiumContext';
import { runPipeline } from '../../services/insights/pipeline';
import { computeEnhancedInsights, EnhancedInsightBundle } from '../../utils/journalInsights';
import { computeNarrativeInsights, NarrativeInsightBundle, NarrativeInsight, NarrativeCategory } from '../../utils/narrativeInsights';
import { buildPersonalProfile } from '../../utils/personalProfile';
import { computeDeepInsights, DeepInsightBundle, DeepInsight } from '../../utils/deepInsights';
import { PatternOrbitMap } from '../../components/ui/PatternOrbitMap';
import { DailyCheckIn } from '../../services/patterns/types';
import { GoldSubtitle } from '../../components/ui/GoldSubtitle';
import { MetallicIcon } from '../../components/ui/MetallicIcon';
import { MetallicText } from '../../components/ui/MetallicText';
import { loadSelfKnowledgeContext, enrichSelfKnowledgeContext } from '../../services/insights/selfKnowledgeContext';
import {
  computeSelfKnowledgeCrossRef,
  CrossRefInsight,
} from '../../utils/selfKnowledgeCrossRef';
import { enhancePatternInsights } from '../../services/insights/geminiInsightsService';
import { useCircadianStore } from '../../store/circadianStore';
import { useCorrelationStore } from '../../store/correlationStore';
import { exportInsightsToPdf, InsightsPdfInput } from '../../services/premium/insightsPdfExport';
import { DailyAggregate, ChartProfile } from '../../services/insights/types';
import { TriggerEvent } from '../../utils/triggerEventTypes';

const SCREEN_W = Dimensions.get('window').width;
const ORBIT_SIZE = SCREEN_W - 48;

const PALETTE = {
  gold: '#D4B872',
  silverBlue: '#C9AE78',
  copper: '#CD7F5D',
  emerald: '#6EBF8B',
  connection: '#9D76C1',
  lavender: '#A89BC8',
  rose: '#D4A3B3',
  bg: '#020817',
  textMain: '#FFFFFF',
  glassBorder: 'rgba(255,255,255,0.06)',
};

const CROSS_REF_ACCENT: Record<string, string> = {
  gold:       PALETTE.gold,
  silverBlue: PALETTE.silverBlue,
  copper:     PALETTE.copper,
  emerald:    PALETTE.emerald,
  rose:       PALETTE.rose,
  lavender:   PALETTE.lavender,
};



interface SnapshotData {
  avgMood: number | null;
  avgStress: number | null;
  checkInCount: number;
  stressTrend: 'improving' | 'worsening' | 'stable' | null;
}

interface LoopCardContent {
  label: string;
  title: string;
  body: string;
  accent: string;
}

/** Map 1–10 average mood to a human-readable label. */
function moodSubLabel(avg: number): string {
  if (avg <= 3) return 'Low';
  if (avg <= 5) return 'Subdued';
  if (avg <= 6.5) return 'Steady';
  if (avg <= 8) return 'Good';
  return 'Elevated';
}

function buildWeeklyChangeCard(deepBundle: null, snapshot: SnapshotData): LoopCardContent | null {
  if (snapshot.avgMood !== null) {
    const moodLabel = moodSubLabel(snapshot.avgMood);
    const stressInfo = snapshot.avgStress !== null ? ` with average stress at ${snapshot.avgStress.toFixed(1)}/10` : '';
    const trendInfo = snapshot.stressTrend && snapshot.stressTrend !== 'stable'
      ? ` (stress ${snapshot.stressTrend === 'improving' ? 'easing' : 'rising'})`
      : '';

    let title: string;
    let body: string;
    if (snapshot.checkInCount >= 14) {
      title = `Mood: ${moodLabel}${trendInfo}`;
      body = `Across ${snapshot.checkInCount} check-ins over the past 30 days, your average mood is ${snapshot.avgMood.toFixed(1)}/10${stressInfo}. Your pattern baseline is established — week-to-week shifts will become visible as you continue.`;
    } else {
      title = 'Your pattern baseline is forming';
      body = `You have ${snapshot.checkInCount} check-ins over the past 30 days with an average mood of ${snapshot.avgMood.toFixed(1)}/10 (${moodLabel})${stressInfo}. A few more days of logging will sharpen your pattern signal.`;
    }

    return {
      label: 'YOUR 30-DAY SNAPSHOT',
      title,
      body,
      accent: '#FFFFFF',
    };
  }

  return null;
}

export default function PatternsScreen() {
  const { isPremium } = usePremium();
  const [snapshot, setSnapshot] = useState<SnapshotData>({
    avgMood: null,
    avgStress: null,
    checkInCount: 0,
    stressTrend: null,
  });
  const [enhanced, setEnhanced] = useState<EnhancedInsightBundle | null>(null);
  const [trendCheckIns, setTrendCheckIns] = useState<DailyCheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [crossRefs, setCrossRefs] = useState<CrossRefInsight[]>([]);
  const [narrative, setNarrative] = useState<NarrativeInsightBundle | null>(null);
  const [deepInsights, setDeepInsights] = useState<DeepInsightBundle | null>(null);
  const syncRhythm = useCircadianStore((s) => s.syncRhythm);
  const circadianGrid = useCircadianStore((s) => s.grid);
  const correlations = useCorrelationStore((s) => s.correlations);
  const syncCorrelations = useCorrelationStore((s) => s.syncCorrelations);
  const [isExporting, setIsExporting] = useState(false);
  const [triggerEvents, setTriggerEvents] = useState<TriggerEvent[]>([]);
  const pipelineRef = useRef<{ aggregates: DailyAggregate[]; profile: ChartProfile | null; windowDays: number; totalCheckIns: number; totalJournalEntries: number } | null>(null);
  const chartNameRef = useRef<string | undefined>(undefined);
  const weeklyChangeCard = buildWeeklyChangeCard(null, snapshot);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      setTrendCheckIns([]);
      syncRhythm().catch(() => {});
      syncCorrelations().catch(() => {});
      // Load trigger events for nervous system patterns
      EncryptedAsyncStorage.getItem('@mysky:trigger_events')
        .then(raw => { if (raw) setTriggerEvents(JSON.parse(raw)); })
        .catch(() => {});
      (async () => {
        try {
          const charts = await localDb.getCharts();
          if (!charts?.length) return;
          const chartId = charts[0].id;
          chartNameRef.current = charts[0].name ?? undefined;
          const checkIns = await localDb.getCheckIns(chartId, 30);
          if (!checkIns.length) return;

          const chronologicallySorted = [...checkIns].sort((a, b) =>
            a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt)
          );

          const moods = checkIns.map(c => c.moodScore).filter((v): v is number => v != null);
          const avgMood = moods.length
            ? Math.round((moods.reduce((a, b) => a + b, 0) / moods.length) * 10) / 10
            : null;

          // Stress trend: compare oldest half vs newest half
          const levelToScore = (level: string | null | undefined): number | null => {
            if (level === 'low') return 2;
            if (level === 'medium') return 5;
            if (level === 'high') return 8;
            return null;
          };
          let stressTrend: SnapshotData['stressTrend'] = null;
          const stresses = chronologicallySorted
            .map(c => levelToScore(c.stressLevel))
            .filter((v): v is number => v != null);
          if (stresses.length >= 4) {
            const half = Math.floor(stresses.length / 2);
            const olderWindow = stresses.slice(0, half);
            const newerWindow = stresses.slice(stresses.length - half);
            const older = olderWindow.reduce((a, b) => a + b, 0) / olderWindow.length;
            const newer = newerWindow.reduce((a, b) => a + b, 0) / newerWindow.length;
            if (newer < older - 0.5) stressTrend = 'improving';
            else if (newer > older + 0.5) stressTrend = 'worsening';
            else stressTrend = 'stable';
          }

          const avgStress = stresses.length
            ? Math.round((stresses.reduce((a, b) => a + b, 0) / stresses.length) * 10) / 10
            : null;

          setTrendCheckIns(chronologicallySorted);
          setSnapshot({ avgMood, avgStress, checkInCount: checkIns.length, stressTrend });

          // ── Self-knowledge cross-reference (all users) ──
          // Initial pass with AsyncStorage-only data. A second enriched pass runs
          // once SQLite journal/sleep data is loaded (see Enhanced insights block below).
          let skContext;
          try {
            skContext = await loadSelfKnowledgeContext();
            const refs = computeSelfKnowledgeCrossRef(skContext, checkIns);
            setCrossRefs(refs);
          } catch (e) {
            logger.error('Self-knowledge cross-ref failed:', e);
          }

          // ── Enhanced insights pipeline ──
          try {
            const extCheckIns = await localDb.getCheckIns(chartId, 90);
            const journalEntries = await localDb.getJournalEntriesPaginated(90);
            const sleepEntries = await localDb.getSleepEntries(chartId, 90);

            // ── Enrich cross-ref with journal + sleep data now that it's loaded ──
            try {
              const baseCtx = skContext ?? await loadSelfKnowledgeContext();
              const enrichedCtx = enrichSelfKnowledgeContext(baseCtx, journalEntries, sleepEntries);
              const enrichedRefs = computeSelfKnowledgeCrossRef(enrichedCtx, checkIns);
              setCrossRefs(enrichedRefs);

              if (enrichedRefs.length > 0) {
                enhancePatternInsights(enrichedRefs, enrichedCtx, checkIns)
                  .then(result => {
                    if (!active || !result?.insights.length) return;
                    const aiEnhanced = enrichedRefs.map(ref => {
                      const match = result.insights.find(r => r.id === ref.id);
                      return match ? { ...ref, body: match.body } : ref;
                    });
                    setCrossRefs(aiEnhanced);
                  })
                  .catch(e => logger.error('Gemini pattern enhancement failed:', e));
              }
            } catch (e) {
              logger.error('Enriched cross-ref failed:', e);
            }

            const pipelineResult = runPipeline({ checkIns: extCheckIns, journalEntries, sleepEntries, chart: null, todayContext: null });
            pipelineRef.current = {
              aggregates: pipelineResult.dailyAggregates,
              profile: pipelineResult.chartProfile,
              windowDays: pipelineResult.windowDays,
              totalCheckIns: pipelineResult.totalCheckIns,
              totalJournalEntries: pipelineResult.totalJournalEntries,
            };
            setEnhanced(computeEnhancedInsights(pipelineResult.dailyAggregates, pipelineResult.chartProfile));
            setNarrative(computeNarrativeInsights(pipelineResult.dailyAggregates));
            const personalProfile = buildPersonalProfile(pipelineResult.dailyAggregates);
            setDeepInsights(computeDeepInsights(personalProfile));
          } catch (e) {
            logger.error('Enhanced insights pipeline failed:', e);
          }
        } catch (e) {
          logger.error('Patterns load failed:', e);
        } finally {
          setLoading(false);
        }
      })();
      return () => { active = false; };
    }, [syncRhythm, syncCorrelations])
  );

  const stressLabel = (trend: SnapshotData['stressTrend']): string | null => {
    if (trend === 'improving') return 'Easing';
    if (trend === 'worsening') return 'Rising';
    if (trend === 'stable') return 'Stable';
    return null;
  };

  const correlationLabel = (r: number): string => {
    const abs = Math.abs(r);
    const sign = r > 0 ? 'positive' : 'negative';
    if (abs >= 0.7) return `strong ${sign}`;
    if (abs >= 0.4) return `moderate ${sign}`;
    return `weak ${sign}`;
  };

  const handleExportPdf = async () => {
    if (!isPremium) return;
    if (isExporting) return;
    setIsExporting(true);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      const pipe = pipelineRef.current;
      const input: InsightsPdfInput = {
        userName: chartNameRef.current,
        snapshot,
        dailyAggregates: pipe?.aggregates ?? [],
        chartProfile: pipe?.profile ?? null,
        enhanced,
        circadianGrid,
        correlations,
        crossRefs,
        windowDays: pipe?.windowDays ?? 30,
        totalCheckIns: pipe?.totalCheckIns ?? snapshot.checkInCount,
        totalJournalEntries: pipe?.totalJournalEntries ?? 0,
      };
      await exportInsightsToPdf(input);
    } catch (e) {
      logger.error('PDF export failed:', e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />

      {/* Nebula depth — atmospheric glow orbs */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={[styles.glowOrb, { top: -60, right: -60, backgroundColor: 'rgba(110, 140, 180, 0.12)' }]} />
        <View style={[styles.glowOrb, { bottom: 160, left: -120, backgroundColor: 'rgba(217, 191, 140, 0.06)' }]} />
      </View>

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

          <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
            <View style={styles.headerRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Patterns</Text>
                <GoldSubtitle style={styles.subtitle}>Analysis of your internal weather</GoldSubtitle>
              </View>
              {isPremium && (
                <Pressable
                  onPress={handleExportPdf}
                  disabled={isExporting}
                  style={styles.exportButton}
                  accessibilityRole="button"
                  accessibilityLabel="Download insights report"
                >
                  {isExporting ? (
                    <ActivityIndicator size="small" color={PALETTE.gold} />
                  ) : (
                    <MetallicIcon name="download-outline" size={20} variant="gold" />
                  )}
                </Pressable>
              )}
            </View>
          </Animated.View>

          {/* ── Quantitative Snapshot ── */}
          <View style={styles.snapshotRow}>
            <MetricCard label="AVG MOOD" value={snapshot.avgMood?.toFixed(1) ?? '—'} color={PALETTE.silverBlue} sub={snapshot.avgMood ? moodSubLabel(snapshot.avgMood) : 'No data'} />
            <MetricCard label="STRESS" value={snapshot.avgStress?.toFixed(1) ?? '—'} color={PALETTE.copper} sub={stressLabel(snapshot.stressTrend) ?? undefined} />
            <MetricCard label="LOGGED" value={snapshot.checkInCount.toString()} color={PALETTE.gold} sub="last 30 days" />
          </View>

          {/* ── Visualization — Cosmic Pattern Orbit ── */}
          <View style={styles.visualSection}>
            <View style={styles.orbitCard}>
              {/* Clipped background fills only the card bounds */}
              <View style={[StyleSheet.absoluteFill, styles.orbitCardBg]} pointerEvents="none">
                <LinearGradient
                  colors={['rgba(201,174,120,0.08)', 'rgba(10,10,12,0.90)']}
                  style={StyleSheet.absoluteFill}
                />
              </View>
              <View style={styles.orbitCardHeader}>
                <MetallicIcon name="planet-outline" size={14} variant="gold" />
                <MetallicText color={PALETTE.gold} style={styles.orbitCardEyebrow}>PATTERN ORBIT MAP</MetallicText>
              </View>
              {loading ? (
                <View style={{ height: ORBIT_SIZE, alignItems: 'center', justifyContent: 'center' }}>
                  <ActivityIndicator size="large" color={PALETTE.gold} />
                </View>
              ) : trendCheckIns.length >= 2 ? (
                <PatternOrbitMap checkIns={trendCheckIns} size={ORBIT_SIZE} />
              ) : (
                <View style={{ height: ORBIT_SIZE, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
                  <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14, textAlign: 'center', marginTop: 12 }}>
                    Log a few check-ins to reveal your pattern orbit map.
                  </Text>
                </View>
              )}
              <View style={styles.orbitCardFooter}>
                <Text style={styles.orbitCardFooterText}>7 life dimensions · Arc intensity reflects check-in data</Text>
              </View>
            </View>
          </View>

          {weeklyChangeCard && (
            <>
              <SectionHeader label="YOUR 30-DAY SNAPSHOT" icon="calendar-outline" />
              <LoopCard content={weeklyChangeCard} />
            </>
          )}

          {/* ── Where It All Connects ── */}
          {enhanced && enhanced.blended.length > 0 && (
            <Animated.View entering={FadeInDown.delay(220)} style={styles.section}>
              <SectionHeader label="WHERE IT ALL CONNECTS" icon="git-merge-outline" />
              {enhanced.blended.map((card, i) => (
                <LinearGradient
                  key={i}
                  colors={['rgba(201, 174, 120, 0.1)', 'rgba(10,10,12,0.9)']}
                  style={styles.insightCard}
                >
                  <Text style={styles.blendedTitle}>{card.title}</Text>
                  <Text style={styles.insightBody}>{card.body}</Text>
                  {card.stat !== '' && (
                    <Text style={styles.statText}>{card.stat}</Text>
                  )}
                  <View style={styles.journalPromptBox}>
                    <MetallicIcon name="create-outline" size={13} variant="gold" />
                    <Text style={styles.journalPromptText}>{card.journalPrompt}</Text>
                  </View>
                </LinearGradient>
              ))}
            </Animated.View>
          )}

          {/* ── What Lifts & Drains You ── */}
          {enhanced && enhanced.keywordLift.hasData && (
            <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
              <SectionHeader label="WHAT LIFTS & DRAINS YOU" icon="swap-vertical-outline" />
              <LinearGradient colors={['rgba(110, 191, 139, 0.08)', 'rgba(10, 10, 12, 0.9)']} style={styles.insightCard}>
                <Text style={styles.liftIntro}>
                  These themes appear more often on your best vs. hardest days — based on your own words.
                </Text>
                {enhanced.keywordLift.restores.length > 0 && (
                  <View style={styles.liftGroup}>
                    <View style={styles.liftLabelRow}>
                      <Ionicons name="arrow-up-circle-outline" size={16} color={PALETTE.emerald} />
                      <MetallicText style={[styles.liftGroupLabel, { color: PALETTE.emerald }]}>Restores you</MetallicText>
                    </View>
                    <View style={styles.pillRow}>
                      {enhanced.keywordLift.restores.map(r => (
                        <View key={r.label} style={[styles.liftPill, { borderColor: `${PALETTE.emerald}50`, backgroundColor: `${PALETTE.emerald}12` }]}>
                          <Text style={[styles.pillText, { color: PALETTE.emerald }]}>{r.label}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
                {enhanced.keywordLift.drains.length > 0 && (
                  <View style={[styles.liftGroup, { marginTop: 16 }]}>
                    <View style={styles.liftLabelRow}>
                      <Ionicons name="arrow-down-circle-outline" size={16} color={PALETTE.copper} />
                      <MetallicText style={[styles.liftGroupLabel, { color: PALETTE.copper }]}>Drains you</MetallicText>
                    </View>
                    <View style={styles.pillRow}>
                      {enhanced.keywordLift.drains.map(d => (
                        <View key={d.label} style={[styles.liftPill, { borderColor: `${PALETTE.copper}50`, backgroundColor: `${PALETTE.copper}12` }]}>
                          <Text style={[styles.pillText, { color: PALETTE.copper }]}>{d.label}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </LinearGradient>
            </Animated.View>
          )}

          {/* ── When You Feel Best ── */}
          {enhanced && enhanced.timePatterns.length > 0 && (
            <Animated.View entering={FadeInDown.delay(330)} style={styles.section}>
              <SectionHeader label="WHEN YOU FEEL BEST" icon="time-outline" />
              {enhanced.timePatterns.map((tp, i) => (
                <LinearGradient
                  key={i}
                  colors={['rgba(168, 155, 200, 0.1)', 'rgba(10,10,12,0.9)']}
                  style={styles.insightCard}
                >
                  <Text style={styles.insightBody}>{tp.insight}</Text>
                  {tp.buckets && tp.buckets.length > 0 && (
                    <View style={styles.timeGrid}>
                      {tp.buckets.map(b => (
                        <View key={b.label} style={styles.timeBucket}>
                          <Text style={styles.timeBucketLabel}>{b.label}</Text>
                          <View style={styles.timeBucketBar}>
                            <View style={[styles.timeBucketFill, { width: `${(b.avgMood / 10) * 100}%` as any, backgroundColor: PALETTE.lavender }]} />
                          </View>
                          <Text style={styles.timeBucketValue}>{b.avgMood.toFixed(1)}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  {tp.dayData && tp.dayData.length > 0 && (
                    <View style={styles.dayGrid}>
                      {tp.dayData.map(d => (
                        <View key={d.day} style={styles.dayColumn}>
                          <View style={styles.dayBarWrap}>
                            <View style={[styles.dayBarFill, { height: `${(d.avgMood / 10) * 100}%` as any, backgroundColor: PALETTE.lavender }]} />
                          </View>
                          <Text style={styles.dayLabel}>{d.day.slice(0, 3)}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  <Text style={styles.statText}>{tp.stat}</Text>
                </LinearGradient>
              ))}
            </Animated.View>
          )}

          {/* ── Your Emotional Patterns ── */}
          {enhanced && enhanced.emotionBucketLift.length > 0 && (
            <Animated.View entering={FadeInDown.delay(350)} style={styles.section}>
              <SectionHeader label="YOUR EMOTIONAL PATTERNS" icon="sparkles-outline" />
              <LinearGradient colors={['rgba(212, 163, 179, 0.08)', 'rgba(10,10,12,0.9)']} style={styles.insightCard}>
                <Text style={styles.liftIntro}>Which emotions show up more on your best and hardest days.</Text>
                {enhanced.emotionBucketLift.map((item, i) => {
                  const isPositive = item.lift > 0;
                  const color = isPositive ? PALETTE.emerald : PALETTE.copper;
                  return (
                    <View key={item.category} style={[styles.emotionRow, i > 0 && { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' }]}>
                      <Text style={styles.emotionName}>{item.category.charAt(0).toUpperCase() + item.category.slice(1)}</Text>
                      <View style={{ flex: 1, marginHorizontal: 12 }}>
                        <Text style={[styles.emotionInsight, { color: 'rgba(255,255,255,0.55)' }]}>{item.insight}</Text>
                      </View>
                      <View style={[styles.emotionBadge, { backgroundColor: `${color}20`, borderColor: `${color}40` }]}>
                        <Text style={[styles.emotionBadgeText, { color }]}>{isPositive ? 'BEST' : 'HARD'}</Text>
                      </View>
                    </View>
                  );
                })}
              </LinearGradient>
            </Animated.View>
          )}

          {/* ── What's On Your Mind ── */}
          {enhanced && enhanced.keywordThemes && (
            <Animated.View entering={FadeInDown.delay(370)} style={styles.section}>
              <SectionHeader label="WHAT'S ON YOUR MIND" icon="chatbubble-ellipses-outline" />
              <LinearGradient colors={['rgba(201, 174, 120, 0.08)', 'rgba(10,10,12,0.9)']} style={styles.insightCard}>
                <Text style={styles.insightBody}>{enhanced.keywordThemes.insight}</Text>
                <View style={[styles.pillRow, { marginTop: 16 }]}>
                  {enhanced.keywordThemes.topKeywords.map(kw => (
                    <View key={kw.word} style={[styles.keywordPill, { borderColor: `${PALETTE.gold}35` }]}>
                      <Text style={styles.keywordPillText}>{kw.word}</Text>
                      <Text style={styles.keywordPillCount}>{kw.dayCount}d</Text>
                    </View>
                  ))}
                </View>
              </LinearGradient>
            </Animated.View>
          )}

          {/* ── Does Journaling Help You? ── */}
          {enhanced && enhanced.journalImpact.length > 0 && (
            <Animated.View entering={FadeInDown.delay(390)} style={styles.section}>
              <SectionHeader label="WHAT JOURNALING DOES FOR YOU" icon="book-outline" />
              {enhanced.journalImpact.map((card, i) => (
                <LinearGradient
                  key={i}
                  colors={['rgba(110, 191, 139, 0.08)', 'rgba(10,10,12,0.9)']}
                  style={styles.insightCard}
                >
                  <Text style={styles.insightBody}>{card.insight}</Text>
                  <Text style={styles.statText}>{card.stat}</Text>
                </LinearGradient>
              ))}
            </Animated.View>
          )}

          {/* ── Emotional Tone Over Time ── */}
          {enhanced && enhanced.emotionToneShift && (
            <Animated.View entering={FadeInDown.delay(410)} style={styles.section}>
              <SectionHeader label="HOW YOUR TONE IS SHIFTING" icon="pulse-outline" />
              <LinearGradient colors={['rgba(212, 184, 114, 0.08)', 'rgba(10, 10, 12, 0.9)']} style={styles.insightCard}>
                <Text style={styles.insightBody}>{enhanced.emotionToneShift.insight}</Text>
                {enhanced.emotionToneShift.rising.length > 0 && (
                  <View style={[styles.toneRow, { marginTop: 16 }]}>
                    <Ionicons name="arrow-up-circle-outline" size={15} color={PALETTE.emerald} />
                    <Text style={[styles.toneLabel, { color: PALETTE.emerald }]}>Rising: </Text>
                    <Text style={styles.toneValue}>
                      {enhanced.emotionToneShift.rising.map(r => r.category).join(', ')}
                    </Text>
                  </View>
                )}
                {enhanced.emotionToneShift.falling.length > 0 && (
                  <View style={styles.toneRow}>
                    <Ionicons name="arrow-down-circle-outline" size={15} color={PALETTE.rose} />
                    <Text style={[styles.toneLabel, { color: PALETTE.rose }]}>Falling: </Text>
                    <Text style={styles.toneValue}>
                      {enhanced.emotionToneShift.falling.map(r => r.category).join(', ')}
                    </Text>
                  </View>
                )}
                <Text style={styles.statText}>{enhanced.emotionToneShift.stat}</Text>
              </LinearGradient>
            </Animated.View>
          )}

          {/* ── Emotional Stability ── */}
          {enhanced && enhanced.volatility.length > 0 && (
            <Animated.View entering={FadeInDown.delay(430)} style={styles.section}>
              <SectionHeader label="EMOTIONAL STABILITY" icon="analytics-outline" />
              <LinearGradient colors={['rgba(168, 155, 200, 0.08)', 'rgba(10,10,12,0.9)']} style={styles.insightCard}>
                <Text style={styles.liftIntro}>How consistent your scores have been day-to-day.</Text>
                {enhanced.volatility.map((v, i) => {
                  const label = v.metric === 'mood' ? 'Mood' : v.metric === 'stress' ? 'Stress' : 'Sentiment';
                  const color = v.level === 'low' ? PALETTE.emerald : v.level === 'moderate' ? PALETTE.gold : PALETTE.copper;
                  const description = v.level === 'low' ? 'Very consistent' : v.level === 'moderate' ? 'Some variation' : 'Noticeably variable';
                  return (
                    <View key={v.metric} style={[styles.stabilityRow, i > 0 && { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' }]}>
                      <Text style={styles.stabilityMetric}>{label}</Text>
                      <View style={styles.stabilityBar}>
                        <View style={[styles.stabilityFill, {
                          width: `${Math.min((v.stddev / 3) * 100, 100)}%` as any,
                          backgroundColor: color,
                        }]} />
                      </View>
                      <View style={[styles.stabilityBadge, { backgroundColor: `${color}20` }]}>
                        <Text style={[styles.stabilityBadgeText, { color }]}>{description}</Text>
                      </View>
                    </View>
                  );
                })}
              </LinearGradient>
            </Animated.View>
          )}

          {/* ── Correlations ── */}
          {correlations.length > 0 && (
            <Animated.View entering={FadeInDown.delay(450)} style={styles.section}>
              <SectionHeader label="WHAT DRIVES WHAT" icon="git-network-outline" />
              <LinearGradient colors={['rgba(201, 174, 120, 0.08)', 'rgba(10,10,12,0.9)']} style={styles.insightCard}>
                <Text style={styles.liftIntro}>Statistical relationships between your tracked metrics.</Text>
                {correlations.slice(0, 5).map((c, i) => {
                  const abs = Math.abs(c.correlation);
                  const isPositive = c.correlation > 0;
                  const color = abs >= 0.5 ? (isPositive ? PALETTE.emerald : PALETTE.rose) : PALETTE.gold;
                  return (
                    <View key={`${c.metric_a}-${c.metric_b}`} style={[styles.correlationRow, i > 0 && { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' }]}>
                      <Text style={styles.correlationMetrics}>
                        {c.metric_a} <Text style={{ color: 'rgba(255,255,255,0.3)' }}>×</Text> {c.metric_b}
                      </Text>
                      <View style={{ flex: 1, marginHorizontal: 12 }}>
                        <View style={styles.correlationBarWrap}>
                          <View style={[styles.correlationFill, { width: `${abs * 100}%` as any, backgroundColor: color }]} />
                        </View>
                      </View>
                      <Text style={[styles.correlationLabel, { color }]}>{correlationLabel(c.correlation)}</Text>
                    </View>
                  );
                })}
              </LinearGradient>
            </Animated.View>
          )}

          {/* ── Personal Patterns (Self-Knowledge × Behavioral Data) ── */}
          {crossRefs.length > 0 && (
            <Animated.View entering={FadeInDown.delay(470)} style={styles.section}>
              <SectionHeader label="PERSONAL PATTERNS" icon="person-circle-outline" subtitle="From your self-knowledge profile, confirmed by data" />
              {crossRefs.map((insight) => {
                const accent = CROSS_REF_ACCENT[insight.accentColor] ?? PALETTE.gold;
                return (
                  <LinearGradient
                    key={insight.id}
                    colors={[`${accent}18`, 'rgba(10,10,12,0.9)']}
                    style={styles.insightCard}
                  >
                    <View style={styles.crossRefHeader}>
                      <MetallicText style={styles.insightLabel} color={accent}>
                        {insight.source.toUpperCase()}
                      </MetallicText>
                      {insight.isConfirmed && (
                        <View style={[styles.confirmedBadge, { borderColor: `${accent}50` }]}>
                          <MetallicText style={styles.confirmedText} color={accent}>DATA CONFIRMED</MetallicText>
                        </View>
                      )}
                    </View>
                    <Text style={styles.patternTitle}>{insight.title}</Text>
                    <Text style={styles.insightBody}>{insight.body}</Text>
                  </LinearGradient>
                );
              })}
            </Animated.View>
          )}

          {/* ── Narrative Insights — Personalized Reflections ── */}
          {narrative && narrative.insights.length > 0 && (
            <Animated.View entering={FadeInDown.delay(500)} style={styles.section}>
              <SectionHeader label="YOUR INNER CLIMATE" icon="cloudy-night-outline" subtitle="Personalized reflections drawn from your patterns" />
              {narrative.insights.map((insight) => (
                <NarrativeCard key={insight.id} insight={insight} />
              ))}
            </Animated.View>
          )}

          {/* ── Deep Insights — The Mirror With Memory ── */}
          {deepInsights && deepInsights.insights.length > 0 && (() => {
            // Suppress pattern-level deep insight cards for topics already covered
            // in detail by the narrative "YOUR INNER CLIMATE" section above.
            const narrativeCategories = new Set(
              narrative?.insights.map((i) => i.category) ?? []
            );
            const NARRATIVE_OVERLAP: Record<string, NarrativeCategory> = {
              'pattern-sleep':        'sleep_connection',
              'pattern-best-day':     'best_day',
              'pattern-connection':   'connection_pattern',
            };
            const dedupedInsights = deepInsights.insights.filter((insight) => {
              const overlappingCategory = NARRATIVE_OVERLAP[insight.id];
              return !overlappingCategory || !narrativeCategories.has(overlappingCategory);
            });
            if (dedupedInsights.length === 0) return null;
            return (
            <Animated.View entering={FadeInDown.delay(600)} style={styles.section}>
              <SectionHeader label="YOUR INNER WORLD" icon="sparkles-outline" subtitle={deepInsights.maturity === 'deep' ? 'Deep reflections from months of self-knowledge' : deepInsights.maturity === 'established' ? 'Growing understanding from your patterns' : 'Early reflections as we learn about you'} />

              {/* Season / Chapter */}
              {deepInsights.season && (
                <LinearGradient colors={[`${PALETTE.gold}10`, 'rgba(10,10,12,0.9)']} style={styles.seasonCard}>
                  <MetallicText style={styles.seasonLabel} variant="gold">{deepInsights.season.label.toUpperCase()}</MetallicText>
                  <Text style={styles.insightBody}>{deepInsights.season.body}</Text>
                </LinearGradient>
              )}

              {/* What To Remember — distilled self-knowledge for hard days */}
              {deepInsights.whatToRemember.length > 0 && (
                <LinearGradient colors={[`${PALETTE.rose}10`, 'rgba(10,10,12,0.9)']} style={styles.seasonCard}>
                  <MetallicText style={styles.seasonLabel} variant="gold">WHAT TO REMEMBER</MetallicText>
                  {deepInsights.whatToRemember.map((r, i) => (
                    <Text key={`remember-${i}`} style={styles.memoryText}>• {r}</Text>
                  ))}
                </LinearGradient>
              )}

              {dedupedInsights.map((insight) => (
                <DeepInsightCard key={insight.id} insight={insight} />
              ))}

              {/* Narrative Memory */}
              {(deepInsights.memory.previousStruggles.length > 0 || deepInsights.memory.emergingPatterns.length > 0) && (
                <View style={styles.memoryWrap}>
                  <MetallicText style={styles.personalTruthsHeader} variant="gold">WHAT WE REMEMBER</MetallicText>
                  {deepInsights.memory.previousStruggles.map((s, i) => (
                    <Text key={`struggle-${i}`} style={styles.memoryText}>{s}</Text>
                  ))}
                  {deepInsights.memory.emergingPatterns.length > 0 && (
                    <Text style={styles.memoryText}>Emerging now: {deepInsights.memory.emergingPatterns.join(', ').toLowerCase()}.</Text>
                  )}
                  {deepInsights.memory.persistentTruths.map((t, i) => (
                    <Text key={`persist-${i}`} style={styles.memoryText}>{t}</Text>
                  ))}
                </View>
              )}

              {deepInsights.personalTruths.length > 0 && (
                <View style={styles.personalTruthsWrap}>
                  <MetallicText style={styles.personalTruthsHeader} variant="gold">PERSONAL TRUTHS</MetallicText>
                  {deepInsights.personalTruths.map((truth, i) => (
                    <Text key={i} style={styles.personalTruthText}>{truth}</Text>
                  ))}
                </View>
              )}
            </Animated.View>
            );
          })()}

          {/* ── Nervous System Patterns ── */}
          {triggerEvents.length >= 3 && (() => {
            const last30 = Date.now() - 30 * 24 * 60 * 60 * 1000;
            const recent = triggerEvents.filter(e => e.timestamp > last30);
            if (recent.length < 3) return null;
            const summary = computeTriggerPatternSummary(recent);
            const { drainCount, glimmerCount } = summary;
            const narrative = buildTriggerPatternNarrative(summary);

            return (
              <Animated.View entering={FadeInDown.delay(450)} style={styles.section}>
                <SectionHeader label="NERVOUS SYSTEM LOG" icon="pulse-outline" subtitle="From your polyvagal trigger entries" />
                <LinearGradient colors={['rgba(205, 127, 93, 0.08)', 'rgba(10,10,12,0.9)']} style={styles.insightCard}>
                  <View style={{ flexDirection: 'row', gap: 16, marginBottom: 16 }}>
                    <View style={{ flex: 1, backgroundColor: 'rgba(205,127,93,0.1)', borderRadius: 16, padding: 14, alignItems: 'center' }}>
                      <Text style={{ fontSize: 24, fontWeight: '800', color: PALETTE.copper }}>{drainCount}</Text>
                      <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2, letterSpacing: 0.8 }}>DRAINS</Text>
                    </View>
                    <View style={{ flex: 1, backgroundColor: 'rgba(140,190,170,0.1)', borderRadius: 16, padding: 14, alignItems: 'center' }}>
                      <Text style={{ fontSize: 24, fontWeight: '800', color: '#8CBEAA' }}>{glimmerCount}</Text>
                      <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2, letterSpacing: 0.8 }}>GLIMMERS</Text>
                    </View>
                  </View>
                  <Text style={styles.insightBody}>{narrative}</Text>
                </LinearGradient>
              </Animated.View>
            );
          })()}

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const MetricCard = ({ label, value, color, sub, isText }: { label: string; value: string; color: string; sub?: string; isText?: boolean }) => (
  <LinearGradient colors={['rgba(255,255,255,0.05)', 'rgba(10, 10, 12, 0.8)']} style={styles.metricCard}>
    <MetallicText style={styles.metricLabel} color={color}>{label}</MetallicText>
    <Text style={[styles.metricValue, isText && { fontSize: 16 }]}>{value}</Text>
    {sub && <Text style={styles.metricSub}>{sub}</Text>}
  </LinearGradient>
);

const SectionHeader = ({ icon, label, subtitle }: { icon: keyof typeof Ionicons.glyphMap; label: string; subtitle?: string }) => (
  <View style={styles.sectionHeaderWrap}>
    <View style={styles.sectionHeaderRow}>
      <MetallicIcon name={icon} size={18} variant="gold" />
      <MetallicText style={styles.sectionHeaderLabel} variant="gold">{label}</MetallicText>
    </View>
    {subtitle && <Text style={styles.sectionHeaderSubtitle}>{subtitle}</Text>}
  </View>
);

const LoopCard = ({ content }: { content: LoopCardContent }) => (
  <LinearGradient colors={[`${content.accent}18`, 'rgba(10,10,12,0.85)']} style={[styles.insightCard, styles.loopCard]}>
    <Text style={[styles.loopTitle, { color: content.accent }]}>{content.title}</Text>
    <Text style={styles.insightBody}>{content.body}</Text>
  </LinearGradient>
);

const NARRATIVE_ACCENT: Record<string, string> = {
  gold:       PALETTE.gold,
  silverBlue: PALETTE.silverBlue,
  copper:     PALETTE.copper,
  emerald:    PALETTE.emerald,
  rose:       PALETTE.rose,
  lavender:   PALETTE.lavender,
};

const NARRATIVE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  emotional_undercurrent: 'water-outline',
  energy_rhythm:          'battery-half-outline',
  stress_signal:          'alert-circle-outline',
  sleep_connection:       'moon-outline',
  restoration_pattern:    'leaf-outline',
  best_day:               'sunny-outline',
  hard_day:               'rainy-outline',
  sensitivity_theme:      'eye-outline',
  connection_pattern:     'heart-outline',
  growth_reflection:      'trending-up-outline',
  dream_theme:            'cloudy-night-outline',
  emerging_pattern:       'sparkles-outline',
};

const NarrativeCard = ({ insight }: { insight: NarrativeInsight }) => {
  const accent = NARRATIVE_ACCENT[insight.accent] ?? PALETTE.gold;
  const icon = NARRATIVE_ICONS[insight.category] ?? 'sparkles-outline';
  return (
    <LinearGradient colors={[`${accent}14`, 'rgba(10,10,12,0.9)']} style={styles.insightCard}>
      <View style={styles.narrativeHeader}>
        <MetallicIcon name={icon} size={14} variant="gold" />
        <MetallicText style={styles.insightLabel} color={accent}>{insight.label.toUpperCase()}</MetallicText>
        <View style={[styles.narrativeConfidence, { backgroundColor: `${accent}18`, borderColor: `${accent}40` }]}>
          <Text style={[styles.narrativeConfidenceText, { color: accent }]}>
            {insight.confidence === 'high' ? 'STRONG' : insight.confidence === 'medium' ? 'GROWING' : 'EMERGING'}
          </Text>
        </View>
      </View>
      <Text style={styles.insightBody}>{insight.body}</Text>
      <Text style={styles.statText}>{insight.stat}</Text>
    </LinearGradient>
  );
};

const DEEP_LEVEL_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  pattern:  'repeat-outline',
  meaning:  'layers-outline',
  need:     'heart-circle-outline',
  growth:   'trending-up-outline',
  identity: 'diamond-outline',
};

const DEEP_LEVEL_LABELS: Record<string, string> = {
  pattern:  'PATTERN',
  meaning:  'MEANING',
  need:     'NEED',
  growth:   'GROWTH',
  identity: 'IDENTITY',
};

const DeepInsightCard = ({ insight }: { insight: DeepInsight }) => {
  const accent = NARRATIVE_ACCENT[insight.accent] ?? PALETTE.gold;
  const icon = DEEP_LEVEL_ICONS[insight.level] ?? 'sparkles-outline';
  const levelLabel = DEEP_LEVEL_LABELS[insight.level] ?? insight.level.toUpperCase();
  return (
    <LinearGradient colors={[`${accent}14`, 'rgba(10,10,12,0.9)']} style={styles.insightCard}>
      <View style={styles.narrativeHeader}>
        <MetallicIcon name={icon} size={14} variant="gold" />
        <MetallicText style={styles.insightLabel} color={accent}>{insight.title.toUpperCase()}</MetallicText>
        <View style={[styles.narrativeConfidence, { backgroundColor: `${accent}18`, borderColor: `${accent}40` }]}>
          <Text style={[styles.narrativeConfidenceText, { color: accent }]}>
            {insight.confidence === 'strong' ? 'STRONG' : insight.confidence === 'growing' ? 'GROWING' : 'EMERGING'}
          </Text>
        </View>
      </View>
      <View style={styles.deepLevelBadge}>
        <Text style={[styles.deepLevelText, { color: accent }]}>{levelLabel}</Text>
        <Text style={[styles.deepLevelText, { color: `${accent}88`, marginLeft: 8 }]}>
          {insight.job === 'name' ? '◆ NAMING' : insight.job === 'clarify' ? '◆ CLARIFYING' : insight.job === 'guide' ? '◆ GUIDING' : '◆ INTEGRATING'}
        </Text>
      </View>
      <Text style={styles.insightBody}>{insight.body}</Text>
      {insight.detail && <Text style={styles.statText}>{insight.detail}</Text>}
      {insight.selfLanguage && (
        <Text style={[styles.selfLanguageText, { color: `${accent}CC` }]}>&ldquo;{insight.selfLanguage}&rdquo;</Text>
      )}
      {insight.reflectionPrompt && (
        <View style={styles.reflectionPromptWrap}>
          <Ionicons name="chatbubble-ellipses-outline" size={12} color="rgba(255,255,255,0.35)" />
          <Text style={styles.reflectionPromptText}>{insight.reflectionPrompt}</Text>
        </View>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020817' },
  safeArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 140 },
  header: { marginBottom: 32 },
  glowOrb: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    opacity: 0.6,
  },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  exportButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(212,175,55,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  title: { fontSize: 34, fontWeight: '800', color: PALETTE.textMain, letterSpacing: -0.5, marginBottom: 4 },
  subtitle: { fontSize: 12, fontStyle: 'normal', fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)' },
  snapshotRow: { flexDirection: 'row', gap: 12, marginBottom: 40 },
  metricCard: { flex: 1, padding: 20, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', minHeight: 110, backgroundColor: 'rgba(255,255,255,0.02)' },
  metricLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginBottom: 10, textTransform: 'uppercase', textAlign: 'center' },
  metricValue: { color: PALETTE.textMain, fontSize: 26, fontWeight: '500', fontVariant: ['tabular-nums'] },
  metricSub: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 8, textAlign: 'center', fontWeight: '500' },
  visualSection: { alignItems: 'center', marginBottom: 40 },
  orbitCard: { borderRadius: 24, paddingTop: 20, paddingBottom: 16, paddingHorizontal: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', width: '100%', overflow: 'visible' },
  orbitCardBg: { borderRadius: 24, overflow: 'hidden' },
  orbitCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', marginBottom: 8, paddingHorizontal: 20 },
  orbitCardEyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  orbitCardFooter: { marginTop: 8, alignSelf: 'center' },
  orbitCardFooterText: { fontSize: 11, color: 'rgba(255,255,255,0.30)', textAlign: 'center' },
  section: { marginBottom: 0 },
  sectionHeaderWrap: { marginBottom: 20, marginTop: 8 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionHeaderLabel: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  sectionHeaderSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 4 },
  insightCard: { padding: 28, borderRadius: 24, borderWidth: 1, borderColor: PALETTE.glassBorder, marginBottom: 32 },
  insightLabel: { fontSize: 10, fontWeight: '800', color: PALETTE.gold, letterSpacing: 2, marginBottom: 12, textTransform: 'uppercase' },
  insightBody: { color: 'rgba(255,255,255,0.7)', fontSize: 16, lineHeight: 24 },
  loopCard: { marginBottom: 32 },
  loopTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },



  // Blended
  blendedTitle: { fontSize: 15, fontWeight: '700', color: PALETTE.textMain, marginBottom: 10 },
  journalPromptBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 16, padding: 14, borderRadius: 14, backgroundColor: 'rgba(201,174,120,0.06)', borderWidth: 1, borderColor: 'rgba(201,174,120,0.15)' },
  journalPromptText: { flex: 1, color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 22 },
  statText: { fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 12, lineHeight: 16 },

  // Lift & Drain
  liftIntro: { fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 22, marginBottom: 16 },
  liftGroup: {},
  liftLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  liftGroupLabel: { fontSize: 13, fontWeight: '700' },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  liftPill: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  pillText: { fontSize: 13, fontWeight: '600' },

  // Time patterns
  timeGrid: { marginTop: 16, gap: 10 },
  timeBucket: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  timeBucketLabel: { width: 80, fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  timeBucketBar: { flex: 1, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.06)', overflow: 'hidden' },
  timeBucketFill: { height: '100%', borderRadius: 3 },
  timeBucketValue: { width: 28, textAlign: 'right', fontSize: 12, color: 'rgba(255,255,255,0.5)' },

  dayGrid: { flexDirection: 'row', gap: 6, marginTop: 16, height: 60, alignItems: 'flex-end' },
  dayColumn: { flex: 1, alignItems: 'center', gap: 6 },
  dayBarWrap: { flex: 1, width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden', justifyContent: 'flex-end' },
  dayBarFill: { width: '100%', borderRadius: 4 },
  dayLabel: { fontSize: 10, color: 'rgba(255,255,255,0.35)' },

  // Emotion patterns
  emotionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  emotionName: { width: 72, fontSize: 13, color: PALETTE.textMain, fontWeight: '600' },
  emotionInsight: { fontSize: 12, lineHeight: 18 },
  emotionBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  emotionBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },

  // Keywords
  keywordPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1, backgroundColor: 'rgba(201,174,120,0.06)' },
  keywordPillText: { color: PALETTE.textMain, fontSize: 13 },
  keywordPillCount: { fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: '700' },

  // Tone
  toneRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  toneLabel: { fontSize: 13, fontWeight: '700' },
  toneValue: { fontSize: 13, color: 'rgba(255,255,255,0.6)' },

  // Stability
  stabilityRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 },
  stabilityMetric: { width: 58, fontSize: 13, color: PALETTE.textMain, fontWeight: '600' },
  stabilityBar: { flex: 1, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.06)', overflow: 'hidden' },
  stabilityFill: { height: '100%', borderRadius: 3 },
  stabilityBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  stabilityBadgeText: { fontSize: 10, fontWeight: '700' },

  // Correlations
  correlationRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  correlationMetrics: { width: 130, fontSize: 12, color: 'rgba(255,255,255,0.6)', textTransform: 'capitalize' },
  correlationBarWrap: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.06)', overflow: 'hidden' },
  correlationFill: { height: '100%', borderRadius: 2 },
  correlationLabel: { fontSize: 10, fontWeight: '700', textAlign: 'right', width: 90 },

  // Cross-ref / personal patterns
  crossRefHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  confirmedBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  confirmedText: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  patternTitle: { fontSize: 15, fontWeight: '700', color: PALETTE.textMain, marginBottom: 8 },

  // Narrative insights
  narrativeHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  narrativeConfidence: { marginLeft: 'auto', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  narrativeConfidenceText: { fontSize: 8, fontWeight: '800', letterSpacing: 0.8 },
  deepLevelBadge: { marginBottom: 10 },
  deepLevelText: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' as const },
  personalTruthsWrap: { marginTop: 20, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(212,175,55,0.15)', backgroundColor: 'rgba(212,175,55,0.04)' },
  personalTruthsHeader: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 16 },
  personalTruthText: { color: 'rgba(255,255,255,0.78)', fontSize: 14, lineHeight: 22, marginBottom: 12, fontWeight: '400' },
  seasonCard: { padding: 20, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(212,175,55,0.12)', marginBottom: 16, backgroundColor: 'rgba(212,175,55,0.03)' },
  seasonLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 12 },
  memoryWrap: { marginTop: 16, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.02)' },
  memoryText: { color: 'rgba(255,255,255,0.65)', fontSize: 13, lineHeight: 20, marginBottom: 10, fontStyle: 'italic' as const, fontWeight: '400' },
  selfLanguageText: { fontSize: 13, fontStyle: 'italic' as const, marginTop: 10, fontWeight: '500' },
  reflectionPromptWrap: { flexDirection: 'row' as const, alignItems: 'flex-start' as const, gap: 8, marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)' },
  reflectionPromptText: { color: 'rgba(255,255,255,0.45)', fontSize: 13, lineHeight: 19, flex: 1, fontStyle: 'italic' as const, fontWeight: '400' },

});

