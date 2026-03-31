/**
 * Patterns Screen — accessed from (tabs)/growth route.
 *
 * Unified hub: quantitative snapshot, data visualization,
 * and full insight sections (trends, correlations, personal patterns, etc.).
 */

import React, { useCallback, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Platform, Dimensions, ActivityIndicator } from 'react-native';
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
import { AstrologySettingsService } from '../../services/astrology/astrologySettingsService';
import { runPipeline } from '../../services/insights/pipeline';
import { computeEnhancedInsights, EnhancedInsightBundle } from '../../utils/journalInsights';
import { PatternOrbitMap } from '../../components/ui/PatternOrbitMap';
import { DailyCheckIn } from '../../services/patterns/types';
import { GoldSubtitle } from '../../components/ui/GoldSubtitle';
import { MetallicIcon } from '../../components/ui/MetallicIcon';
import { MetallicText } from '../../components/ui/MetallicText';
import { loadSelfKnowledgeContext } from '../../services/insights/selfKnowledgeContext';
import {
  computeSelfKnowledgeCrossRef,
  CrossRefInsight,
} from '../../utils/selfKnowledgeCrossRef';
import { enhancePatternInsights } from '../../services/insights/geminiInsightsService';
import { useCircadianStore } from '../../store/circadianStore';
import { useCorrelationStore } from '../../store/correlationStore';
import { exportInsightsToPdf, InsightsPdfInput } from '../../services/premium/insightsPdfExport';
import { DailyAggregate, ChartProfile } from '../../services/insights/types';
import { loadReflections } from '../../services/insights/dailyReflectionService';

const SCREEN_W = Dimensions.get('window').width;
const ORBIT_SIZE = Math.min(SCREEN_W - 24, 380);

const PALETTE = {
  gold: '#D4B872',
  silverBlue: '#8BC4E8',
  copper: '#CD7F5D',
  emerald: '#6EBF8B',
  connection: '#9D76C1',
  lavender: '#A89BC8',
  rose: '#D4A3B3',
  bg: '#0A0A0C',
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
    return {
      label: 'WHAT CHANGED THIS WEEK',
      title: 'Your pattern baseline is forming',
      body: `You have ${snapshot.checkInCount} check-ins in the last 30 days and an average mood of ${snapshot.avgMood.toFixed(1)}/10. Keep logging for a fuller weekly change signal.`,
      accent: PALETTE.silverBlue,
    };
  }

  return null;
}

function buildLearningCard(deepBundle: null, enhanced: EnhancedInsightBundle | null): LoopCardContent | null {
  if (enhanced?.keywordLift.hasData && enhanced.keywordLift.restores.length > 0) {
    const restoreWord = enhanced.keywordLift.restores[0]?.label;
    const drainWord = enhanced.keywordLift.drains[0]?.label;
    return {
      label: "WHAT YOU'RE LEARNING",
      title: 'Your language leaves clues',
      body: drainWord
        ? `Your writing shifts with your state. ${restoreWord} appears more on your better days, while ${drainWord} is more common on harder ones.`
        : `Your writing shifts with your state. ${restoreWord} appears more often on your better days.`,
      accent: PALETTE.gold,
    };
  }

  return null;
}

export default function PatternsScreen() {
  const router = useRouter();
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
  const syncRhythm = useCircadianStore((s) => s.syncRhythm);
  const circadianGrid = useCircadianStore((s) => s.grid);
  const correlations = useCorrelationStore((s) => s.correlations);
  const syncCorrelations = useCorrelationStore((s) => s.syncCorrelations);
  const [isExporting, setIsExporting] = useState(false);
  const pipelineRef = useRef<{ aggregates: DailyAggregate[]; profile: ChartProfile | null; windowDays: number; totalCheckIns: number; totalJournalEntries: number } | null>(null);
  const chartNameRef = useRef<string | undefined>(undefined);
  const weeklyChangeCard = buildWeeklyChangeCard(null, snapshot);
  const learningCard = buildLearningCard(null, enhanced);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      setTrendCheckIns([]);
      syncRhythm().catch(() => {});
      syncCorrelations().catch(() => {});
      (async () => {
        try {
          const charts = await localDb.getCharts();
          if (!charts?.length) return;
          const chartId = charts[0].id;
          chartNameRef.current = charts[0].name ?? undefined;
          const checkIns = await localDb.getCheckIns(chartId, 30);
          if (!checkIns.length) return;

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
          const stresses = checkIns.map(c => levelToScore(c.stressLevel)).filter((v): v is number => v != null);
          if (stresses.length >= 4) {
            const half = Math.floor(stresses.length / 2);
            const older = stresses.slice(half).reduce((a, b) => a + b, 0) / (stresses.length - half);
            const newer = stresses.slice(0, half).reduce((a, b) => a + b, 0) / half;
            if (newer < older - 0.5) stressTrend = 'improving';
            else if (newer > older + 0.5) stressTrend = 'worsening';
            else stressTrend = 'stable';
          }

          const avgStress = stresses.length
            ? Math.round((stresses.reduce((a, b) => a + b, 0) / stresses.length) * 10) / 10
            : null;

          const sorted = [...checkIns].sort((a, b) => a.date.localeCompare(b.date));
          setTrendCheckIns(sorted);
          setSnapshot({ avgMood, avgStress, checkInCount: checkIns.length, stressTrend });

          // ── Self-knowledge cross-reference (all users) ──
          try {
            const skContext = await loadSelfKnowledgeContext();
            const refs = computeSelfKnowledgeCrossRef(skContext, checkIns);
            setCrossRefs(refs);

            if (refs.length > 0) {
              enhancePatternInsights(refs, skContext, checkIns)
                .then(result => {
                  if (!active || !result?.insights.length) return;
                  const aiEnhanced = refs.map(ref => {
                    const match = result.insights.find(r => r.id === ref.id);
                    return match ? { ...ref, body: match.body } : ref;
                  });
                  setCrossRefs(aiEnhanced);
                })
                .catch(e => logger.error('Gemini pattern enhancement failed:', e));
            }
          } catch (e) {
            logger.error('Self-knowledge cross-ref failed:', e);
          }

          // ── Enhanced insights pipeline ──
          try {
            const saved = charts[0];
            const extCheckIns = await localDb.getCheckIns(chartId, 90);
            const journalEntries = await localDb.getJournalEntriesPaginated(90);

            let natalChart = null;
            if (isPremium) {
              try {
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
                const astroSettings = await AstrologySettingsService.getSettings();
                natalChart = AstrologyCalculator.generateNatalChart({ ...birthData, zodiacSystem: astroSettings.zodiacSystem, orbPreset: astroSettings.orbPreset });
              } catch (e) {
                logger.error('Natal chart generation failed:', e);
              }
            }

            const pipelineResult = runPipeline({ checkIns: extCheckIns, journalEntries, chart: natalChart, todayContext: null });
            pipelineRef.current = {
              aggregates: pipelineResult.dailyAggregates,
              profile: pipelineResult.chartProfile,
              windowDays: pipelineResult.windowDays,
              totalCheckIns: pipelineResult.totalCheckIns,
              totalJournalEntries: pipelineResult.totalJournalEntries,
            };
            setEnhanced(computeEnhancedInsights(pipelineResult.dailyAggregates, pipelineResult.chartProfile));
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
    }, [isPremium, syncRhythm, syncCorrelations])
  );

  const nav = (route: string) => {
    Haptics.selectionAsync().catch(() => {});
    router.push(route as Href);
  };

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
    if (isExporting) return;
    setIsExporting(true);
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
            {loading ? (
              <View style={{ height: ORBIT_SIZE, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="large" color={PALETTE.gold} />
              </View>
            ) : trendCheckIns.length >= 2 ? (
              <PatternOrbitMap checkIns={trendCheckIns} size={ORBIT_SIZE} />
            ) : (
              <View style={{ height: ORBIT_SIZE, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
                <MetallicIcon name="planet-outline" size={36} variant="gold" />
                <Text style={{ color: PALETTE.gold, fontSize: 14, textAlign: 'center', marginTop: 12 }}>
                  Log a few check-ins to reveal your pattern orbit map.
                </Text>
              </View>
            )}
          </View>

          {weeklyChangeCard && (
            <>
              <SectionHeader label="WHAT CHANGED THIS WEEK" icon="calendar-outline" />
              <LoopCard content={weeklyChangeCard} />
            </>
          )}

          {learningCard && (
            <>
              <SectionHeader label="WHAT YOU'RE LEARNING" icon="school-outline" />
              <LoopCard content={learningCard} />
            </>
          )}



          {/* ── Where It All Connects ── */}
          {enhanced && enhanced.blended.length > 0 && (
            <Animated.View entering={FadeInDown.delay(220)} style={styles.section}>
              <SectionHeader label="WHERE IT ALL CONNECTS" icon="git-merge-outline" />
              {enhanced.blended.map((card, i) => (
                <LinearGradient
                  key={i}
                  colors={['rgba(139, 196, 232, 0.1)', 'rgba(10,10,12,0.9)']}
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
      <MetallicIcon name={icon} size={14} variant="gold" />
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020817' },
  safeArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 140 },
  header: { marginTop: 20, marginBottom: 32 },
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
  section: { marginBottom: 24 },
  sectionHeaderWrap: { marginBottom: 20 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionHeaderLabel: { fontSize: 19, fontWeight: '700', color: '#FFFFFF' },
  sectionHeaderSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 4 },
  insightCard: { padding: 28, borderRadius: 24, borderWidth: 1, borderColor: PALETTE.glassBorder, marginBottom: 8 },
  insightLabel: { fontSize: 10, fontWeight: '800', color: PALETTE.gold, letterSpacing: 2, marginBottom: 12, textTransform: 'uppercase' },
  insightBody: { color: 'rgba(255,255,255,0.7)', fontSize: 15, lineHeight: 24 },
  loopCard: { marginBottom: 32 },
  loopTitle: { fontSize: 20, fontWeight: '700', marginBottom: 12 },



  // Blended
  blendedTitle: { fontSize: 18, fontWeight: '700', color: PALETTE.textMain, marginBottom: 10 },
  journalPromptBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 16, padding: 14, borderRadius: 14, backgroundColor: 'rgba(201,174,120,0.06)', borderWidth: 1, borderColor: 'rgba(201,174,120,0.15)' },
  journalPromptText: { flex: 1, color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 22 },
  statText: { fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 12, lineHeight: 16 },

  // Lift & Drain
  liftIntro: { fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 22, marginBottom: 16 },
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
  patternTitle: { fontSize: 18, fontWeight: '700', color: PALETTE.textMain, marginBottom: 8 },


});

