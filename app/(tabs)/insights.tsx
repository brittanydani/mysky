/**
 * Insights Tab — 5-Hub Reflection Architecture
 *
 * Atmospheric-consistent entry point with unified OLED depth,
 * tabular metric precision, and refined glassmorphism.
 */

import React, { useCallback, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Platform, ActivityIndicator } from 'react-native';
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
import { CircadianRhythmTerrain } from '../../components/ui/CircadianRhythmTerrain';
import { useCircadianStore } from '../../store/circadianStore';
import { loadSelfKnowledgeContext } from '../../services/insights/selfKnowledgeContext';
import {
  computeSelfKnowledgeCrossRef,
  CrossRefInsight,
} from '../../utils/selfKnowledgeCrossRef';
import { enhancePatternInsights } from '../../services/insights/geminiInsightsService';
import { GoldSubtitle } from '../../components/ui/GoldSubtitle';
import { MetallicIcon } from '../../components/ui/MetallicIcon';
import { MetallicText } from '../../components/ui/MetallicText';
import { useCorrelationStore } from '../../store/correlationStore';
import { exportInsightsToPdf, InsightsPdfInput } from '../../services/premium/insightsPdfExport';
import { DailyAggregate, ChartProfile } from '../../services/insights/types';

// ── Unified 5-Hub Palette ──
const PALETTE = {
  gold: '#C9AE78',
  silverBlue: '#C9AE78',
  copper: '#CD7F5D',
  emerald: '#C9AE78',
  rose: '#D4A3B3',
  lavender: '#A89BC8',
  bg: '#0A0A0C',
  textMain: '#FFFFFF',
  glassBorder: 'rgba(255,255,255,0.08)',
};

const CROSS_REF_ACCENT: Record<string, string> = {
  gold:       PALETTE.gold,
  silverBlue: PALETTE.silverBlue,
  copper:     PALETTE.copper,
  emerald:    PALETTE.emerald,
  rose:       PALETTE.rose,
  lavender:   PALETTE.lavender,
};

// ── Rotating daily reflection prompts ──
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
  avgStress: number | null;
}

export default function InsightsScreen() {
  const router = useRouter();
  const { isPremium } = usePremium();
  const [snapshot, setSnapshot] = useState<SnapshotData>({
    avgMood: null,
    checkInCount: 0,
    stressTrend: null,
    avgStress: null,
  });
  const [enhanced, setEnhanced] = useState<EnhancedInsightBundle | null>(null);
  const [crossRefs, setCrossRefs] = useState<CrossRefInsight[]>([]);
  const syncRhythm = useCircadianStore((s) => s.syncRhythm);
  const circadianGrid = useCircadianStore((s) => s.grid);
  const correlations = useCorrelationStore((s) => s.correlations);
  const syncCorrelations = useCorrelationStore((s) => s.syncCorrelations);
  const [isExporting, setIsExporting] = useState(false);
  const pipelineRef = useRef<{ aggregates: DailyAggregate[]; profile: ChartProfile | null; windowDays: number; totalCheckIns: number; totalJournalEntries: number } | null>(null);
  const chartNameRef = useRef<string | undefined>(undefined);

  useFocusEffect(
    useCallback(() => {
      let active = true;
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
            if (level === 'high') return 9;
            return null;
          };
          let stressTrend: SnapshotData['stressTrend'] = null;
          const stresses = checkIns.map(c => levelToScore(c.stressLevel)).filter((v): v is number => v != null);
          const avgStress = stresses.length
            ? Math.round((stresses.reduce((a, b) => a + b, 0) / stresses.length) * 10) / 10
            : null;
          if (stresses.length >= 4) {
            const half = Math.floor(stresses.length / 2);
            const older = stresses.slice(half).reduce((a, b) => a + b, 0) / (stresses.length - half);
            const newer = stresses.slice(0, half).reduce((a, b) => a + b, 0) / half;
            if (newer < older - 0.5) stressTrend = 'improving';
            else if (newer > older + 0.5) stressTrend = 'worsening';
            else stressTrend = 'stable';
          }

          setSnapshot({ avgMood, checkInCount: checkIns.length, stressTrend, avgStress });

          // ── Self-knowledge cross-reference (all users) ──
          try {
            const skContext = await loadSelfKnowledgeContext();
            const refs = computeSelfKnowledgeCrossRef(skContext, checkIns);
            setCrossRefs(refs);

            // Enhance with Gemini in the background (non-blocking)
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

          // ── Enhanced insights pipeline (premium) ──
          if (isPremium) {
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
              const astroSettings = await AstrologySettingsService.getSettings();
              const natalChart = AstrologyCalculator.generateNatalChart({ ...birthData, zodiacSystem: astroSettings.zodiacSystem, orbPreset: astroSettings.orbPreset });
              const extCheckIns = await localDb.getCheckIns(chartId, 90);
              const journalEntries = await localDb.getJournalEntriesPaginated(90);
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
          }
        } catch (e) {
          logger.error('Insights load failed:', e);
        }
      })();
      return () => { active = false; };
    }, [isPremium, syncRhythm, syncCorrelations])
  );

  const nav = (route: string) => {
    Haptics.selectionAsync().catch(() => {});
    router.push(route as Href);
  };

  // Describes the actual stress level the user is logging, combined with trend
  const stressLabel = (avg: number | null, trend: SnapshotData['stressTrend']): string => {
    if (avg === null) return '—';
    // avg: low≈2, medium≈5, high≈9
    if (avg < 3.5) {
      // Low stress zone
      if (trend === 'worsening') return 'Rising';
      return 'Calm';
    }
    if (avg < 6.5) {
      // Medium stress zone
      if (trend === 'improving') return 'Easing';
      if (trend === 'worsening') return 'Building';
      return 'Moderate';
    }
    // High stress zone
    if (trend === 'improving') return 'Easing';
    if (trend === 'worsening') return 'Escalating';
    return 'High';
  };

  // Describes mood quality from the actual average score (1–10)
  const moodLabel = (avg: number | null): string => {
    if (avg === null) return '—';
    if (avg < 2) return 'Struggling';
    if (avg < 3) return 'Heavy';
    if (avg < 4) return 'Low';
    if (avg < 4.8) return 'Difficult';
    if (avg < 5.5) return 'Mixed';
    if (avg < 6.5) return 'Neutral';
    if (avg < 7.5) return 'Good';
    if (avg < 8.5) return 'Lifted';
    if (avg < 9.3) return 'Vibrant';
    return 'Radiant';
  };

  const prompt = getDailyPrompt();

  // Direction label + icon for trends
  const trendArrow = (direction: string) => {
    if (direction === 'up') return { icon: 'arrow-up-outline' as const, color: PALETTE.emerald };
    if (direction === 'down') return { icon: 'arrow-down-outline' as const, color: PALETTE.rose };
    return { icon: 'remove-outline' as const, color: 'rgba(255,255,255,0.4)' };
  };

  const trendLabel = (metric: string, direction: string): string => {
    const map: Record<string, Record<string, string>> = {
      moodAvg:   { up: 'Lifting', down: 'Dipping', stable: 'Steady' },
      energyAvg: { up: 'Rising', down: 'Fading', stable: 'Consistent' },
      stressAvg: { up: 'Building', down: 'Easing', stable: 'Stable' },
    };
    return map[metric]?.[direction] ?? direction;
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
        <Pressable
          onPress={() => { Haptics.selectionAsync().catch(() => {}); router.back(); }}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back-outline" size={24} color={theme.textPrimary} />
        </Pressable>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

          {/* ── Header ── */}
          <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
            <View style={styles.headerRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Insights</Text>
                <GoldSubtitle style={styles.subtitle}>A mirror for your inner patterns</GoldSubtitle>
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

          {/* ── Snapshot Row ── */}
          <Animated.View entering={FadeInDown.delay(140)}>
            <View style={styles.metricRow}>
              <MetricBox label="AVG MOOD" value={moodLabel(snapshot.avgMood)} color={PALETTE.silverBlue} isText />
              <MetricBox label="STRESS" value={stressLabel(snapshot.avgStress, snapshot.stressTrend)} color={PALETTE.copper} isText />
              <MetricBox label="CHECK-INS" value={snapshot.checkInCount.toString()} color={PALETTE.gold} />
            </View>
          </Animated.View>

          {/* ── Trend Directions (Premium) ── */}
          {enhanced && enhanced.trends.length > 0 && (
            <Animated.View entering={FadeInDown.delay(180)} style={styles.section}>
              <SectionHeader icon="trending-up-outline" label="YOUR TRENDS" />
              <View style={styles.trendRow}>
                {(['moodAvg', 'energyAvg', 'stressAvg'] as const).map(metric => {
                  const t = enhanced.trends.find(tr => tr.metric === metric);
                  if (!t) return null;
                  const { icon, color } = trendArrow(t.direction);
                  const metricName = metric === 'moodAvg' ? 'Mood' : metric === 'energyAvg' ? 'Energy' : 'Stress';
                  return (
                    <View key={metric} style={styles.trendCard}>
                      <Text style={styles.trendMetricLabel}>{metricName}</Text>
                      <View style={styles.trendValueRow}>
                        <Ionicons name={icon} size={18} color={color} />
                        <Text style={[styles.trendValue, { color }]}>{trendLabel(metric, t.direction)}</Text>
                      </View>
                      {t.displayChange !== '' && (
                        <Text style={styles.trendChange}>{t.displayChange}</Text>
                      )}
                    </View>
                  );
                })}
              </View>
            </Animated.View>
          )}

          {/* ── Where It All Connects (Blended — with journal prompts) ── */}
          {enhanced && enhanced.blended.length > 0 && (
            <Animated.View entering={FadeInDown.delay(220)} style={styles.section}>
              <SectionHeader icon="git-merge-outline" label="WHERE IT ALL CONNECTS" />
              {enhanced.blended.map((card, i) => (
                <LinearGradient
                  key={i}
                  colors={['rgba(139, 196, 232, 0.1)', 'rgba(10,10,12,0.9)']}
                  style={styles.glassCard}
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
              <SectionHeader icon="swap-vertical-outline" label="WHAT LIFTS & DRAINS YOU" />
              <LinearGradient colors={['rgba(110, 191, 139, 0.08)', 'rgba(10, 10, 12, 0.9)']} style={styles.glassCard}>
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
              <SectionHeader icon="time-outline" label="WHEN YOU FEEL BEST" />
              {enhanced.timePatterns.map((tp, i) => (
                <LinearGradient
                  key={i}
                  colors={['rgba(168, 155, 200, 0.1)', 'rgba(10,10,12,0.9)']}
                  style={styles.glassCard}
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
              <SectionHeader icon="sparkles-outline" label="YOUR EMOTIONAL PATTERNS" />
              <LinearGradient colors={['rgba(212, 163, 179, 0.08)', 'rgba(10,10,12,0.9)']} style={styles.glassCard}>
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
              <SectionHeader icon="chatbubble-ellipses-outline" label="WHAT'S ON YOUR MIND" />
              <LinearGradient colors={['rgba(201, 174, 120, 0.08)', 'rgba(10,10,12,0.9)']} style={styles.glassCard}>
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
              <SectionHeader icon="book-outline" label="WHAT JOURNALING DOES FOR YOU" />
              {enhanced.journalImpact.map((card, i) => (
                <LinearGradient
                  key={i}
                  colors={['rgba(110, 191, 139, 0.08)', 'rgba(10,10,12,0.9)']}
                  style={styles.glassCard}
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
              <SectionHeader icon="pulse-outline" label="HOW YOUR TONE IS SHIFTING" />
              <LinearGradient colors={['rgba(212, 184, 114, 0.08)', 'rgba(10, 10, 12, 0.9)']} style={styles.glassCard}>
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
              <SectionHeader icon="analytics-outline" label="EMOTIONAL STABILITY" />
              <LinearGradient colors={['rgba(168, 155, 200, 0.08)', 'rgba(10,10,12,0.9)']} style={styles.glassCard}>
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
              <SectionHeader icon="git-network-outline" label="WHAT DRIVES WHAT" />
              <LinearGradient colors={['rgba(201, 174, 120, 0.08)', 'rgba(10,10,12,0.9)']} style={styles.glassCard}>
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
              <SectionHeader icon="person-circle-outline" label="PERSONAL PATTERNS" subtitle="From your self-knowledge profile, confirmed by data" />
              {crossRefs.map((insight) => {
                const accent = CROSS_REF_ACCENT[insight.accentColor] ?? PALETTE.gold;
                return (
                  <LinearGradient
                    key={insight.id}
                    colors={[`${accent}18`, 'rgba(10,10,12,0.9)']}
                    style={styles.glassCard}
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

          {/* ── Circadian Terrain (Premium) ── */}
          {isPremium && (
            <Animated.View entering={FadeInDown.delay(490)} style={styles.section}>
              <SectionHeader icon="radio-outline" label="CIRCADIAN TERRAIN" subtitle="Your mood rhythm by hour and day of week" />
              <View style={styles.terrainContainer}>
                <CircadianRhythmTerrain height={240} />
              </View>
            </Animated.View>
          )}

          {/* ── Reflection Prompt ── */}
          <Animated.View entering={FadeInDown.delay(510)} style={styles.section}>
            <LinearGradient colors={['rgba(212, 184, 114, 0.12)', 'rgba(10, 10, 12, 0.8)']} style={styles.glassCard}>
              <View style={styles.promptHeader}>
                <MetallicIcon name="sparkles-outline" size={14} variant="gold" />
                <MetallicText style={styles.promptEyebrow} variant="gold">TODAY'S REFLECTION</MetallicText>
              </View>
              <Text style={styles.promptText}>{prompt}</Text>
              <View style={styles.actionRow}>
                <ActionPill label="Log Mood" icon="happy-outline" color={PALETTE.silverBlue} onPress={() => nav('/(tabs)/mood')} />
                <ActionPill label="Journal" icon="create-outline" color={PALETTE.gold} onPress={() => nav('/(tabs)/journal')} />
              </View>
            </LinearGradient>
          </Animated.View>

          {/* ── Cosmic Context ── */}
          <Animated.View entering={FadeInDown.delay(530)} style={[styles.section, { marginTop: 4 }]}>
            <Pressable onPress={() => nav('/astrology-context')}>
              <LinearGradient colors={['rgba(212, 184, 114, 0.1)', 'rgba(212, 184, 114, 0.02)']} style={styles.cosmicCard}>
                <View style={styles.cosmicHeader}>
                  <View style={styles.cosmicIconWrap}>
                    <MetallicIcon name="planet-outline" size={18} variant="gold" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <MetallicText style={styles.cosmicTitle} variant="gold">Cosmic Context</MetallicText>
                    <Text style={styles.cosmicSubtitle}>View today's transits and influences</Text>
                  </View>
                  <Ionicons name="chevron-forward-outline" size={18} color="rgba(255,255,255,0.3)" />
                </View>
              </LinearGradient>
            </Pressable>
          </Animated.View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ── Extracted Components ──

const MetricBox = ({ label, value, color, isText }: { label: string; value: string; color: string; isText?: boolean }) => (
  <View style={styles.metricBox}>
    <MetallicText style={styles.metricLabel} color={color}>{label}</MetallicText>
    <Text style={[styles.metricValue, isText && { fontSize: 16 }]}>{value}</Text>
  </View>
);

const ActionPill = ({ label, icon, color, onPress }: { label: string; icon: keyof typeof Ionicons.glyphMap; color: string; onPress: () => void }) => (
  <Pressable onPress={onPress} style={[styles.actionPill, { borderColor: `${color}40` }]}>
    <MetallicIcon name={icon} size={16} color={color} />
    <MetallicText style={styles.actionLabel} color={color}>{label}</MetallicText>
  </Pressable>
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

// ── Styles ──

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020817' },
  safeArea: { flex: 1 },
  backButton: { padding: 8, paddingHorizontal: 16, alignSelf: 'flex-start' },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 120 },

  header: { marginTop: 20, marginBottom: 28 },
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
  title: { fontSize: 34, fontWeight: '800', color: PALETTE.textMain, fontFamily: Platform.select({ ios: 'SFProDisplay-Bold', android: 'sans-serif-bold', default: 'System' }), letterSpacing: -0.5, marginBottom: 4 },
  subtitle: { fontSize: 14 },

  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, color: PALETTE.textMain, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }), marginBottom: 16 },

  sectionHeaderWrap: { marginBottom: 14 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionHeaderLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  sectionHeaderSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 4 },

  glassCard: { padding: 24, borderRadius: 24, borderWidth: 1, borderColor: PALETTE.glassBorder, marginBottom: 8 },

  promptHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  promptEyebrow: { color: PALETTE.gold, fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  promptText: { color: PALETTE.textMain, fontSize: 20, lineHeight: 30, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }), marginBottom: 20 },

  actionRow: { flexDirection: 'row', gap: 12 },
  actionPill: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 16, borderWidth: 1 },
  actionLabel: { fontWeight: '700', fontSize: 13 },

  metricRow: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  metricBox: { flex: 1, padding: 16, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: PALETTE.glassBorder, alignItems: 'center' },
  metricLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 8 },
  metricValue: { color: PALETTE.textMain, fontSize: 22, fontWeight: '700', fontVariant: ['tabular-nums'] },

  // Trends
  trendRow: { flexDirection: 'row', gap: 10 },
  trendCard: { flex: 1, padding: 16, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: PALETTE.glassBorder },
  trendMetricLabel: { fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 },
  trendValueRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trendValue: { fontSize: 14, fontWeight: '700' },
  trendChange: { fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 4 },

  // Blended
  blendedTitle: { fontSize: 18, color: PALETTE.textMain, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }), marginBottom: 10 },
  journalPromptBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 16, padding: 14, borderRadius: 14, backgroundColor: 'rgba(201,174,120,0.06)', borderWidth: 1, borderColor: 'rgba(201,174,120,0.15)' },
  journalPromptText: { flex: 1, color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 22, fontStyle: 'italic' },
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

  terrainContainer: { borderRadius: 24, overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.3)', borderWidth: 1, borderColor: PALETTE.glassBorder },

  patternLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  patternTitle: { fontSize: 18, color: PALETTE.textMain, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }), marginBottom: 8 },
  insightLabel: { fontSize: 10, fontWeight: '800', color: PALETTE.gold, letterSpacing: 2, marginBottom: 12 },
  insightBody: { color: 'rgba(255,255,255,0.7)', fontSize: 15, lineHeight: 24 },

  cosmicCard: { padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(212, 184, 114, 0.2)' },
  cosmicHeader: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  cosmicIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(212, 184, 114, 0.1)', justifyContent: 'center', alignItems: 'center' },
  cosmicTitle: { fontSize: 15, fontWeight: '600', color: PALETTE.gold, marginBottom: 2 },
  cosmicSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.3)' },

  // Cross-reference cards
  crossRefHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  confirmedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  confirmedText: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
});

