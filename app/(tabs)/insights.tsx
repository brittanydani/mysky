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
              const natalChart = AstrologyCalculator.generateNatalChart(birthData);
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
                <GoldSubtitle style={styles.subtitle}>Personalized patterns & rhythmic guidance</GoldSubtitle>
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

          {/* ── Hub 1: Daily Reflection Prompt ── */}
          <Animated.View entering={FadeInDown.delay(160)} style={styles.section}>
            <LinearGradient colors={['rgba(212, 184, 114, 0.12)', 'rgba(10, 10, 12, 0.8)']} style={styles.glassCard}>
              <View style={styles.promptHeader}>
                <MetallicIcon name="sparkles-outline" size={14} variant="gold" />
                <MetallicText style={styles.promptEyebrow} variant="gold">REFLECTION PROMPT</MetallicText>
              </View>
              <Text style={styles.promptText}>{prompt}</Text>
              <View style={styles.actionRow}>
                <ActionPill label="Log Mood" icon="happy-outline" color={PALETTE.silverBlue} onPress={() => nav('/(tabs)/mood')} />
                <ActionPill label="Journal" icon="create-outline" color={PALETTE.gold} onPress={() => nav('/(tabs)/journal')} />
              </View>
            </LinearGradient>
          </Animated.View>

          {/* ── Hub 2: Quantitative Snapshot ── */}
          <View style={styles.metricRow}>
            <MetricBox label="AVG MOOD" value={moodLabel(snapshot.avgMood)} color={PALETTE.silverBlue} isText />
            <MetricBox label="STRESS" value={stressLabel(snapshot.avgStress, snapshot.stressTrend)} color={PALETTE.copper} isText />
            <MetricBox label="LOGS" value={snapshot.checkInCount.toString()} color={PALETTE.gold} />
          </View>

          {/* ── Hub 3: Personal Patterns (Self-Knowledge × Behavioral Data) ── */}
          {crossRefs.length > 0 && (
            <Animated.View entering={FadeInDown.delay(260)} style={styles.section}>
              <Text style={styles.sectionTitle}>Personal Patterns</Text>
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

          {/* ── Hub 4: Circadian Terrain (Premium) ── */}
          {isPremium && (
            <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
              <Text style={styles.sectionTitle}>Circadian Terrain</Text>
              <View style={styles.terrainContainer}>
                <CircadianRhythmTerrain height={240} />
              </View>
            </Animated.View>
          )}

          {/* ── Hub 5: Narrative Pattern Insights ── */}
          {enhanced && (
            <Animated.View entering={FadeInDown.delay(400)} style={styles.section}>
              {enhanced.blended.length > 0 && (
                <LinearGradient colors={['rgba(139, 196, 232, 0.1)', 'rgba(10, 10, 12, 0.8)']} style={styles.glassCard}>
                  <View style={styles.patternLabelRow}>
                    <MetallicIcon name="git-merge-outline" size={14} variant="gold" />
                    <MetallicText style={styles.insightLabel} variant="gold">WHERE IT CONNECTS</MetallicText>
                  </View>
                  <Text style={styles.patternTitle}>{enhanced.blended[0].title}</Text>
                  <Text style={styles.insightBody}>{enhanced.blended[0].body}</Text>
                </LinearGradient>
              )}

              {enhanced.keywordLift.hasData && (
                <LinearGradient colors={['rgba(110, 191, 139, 0.1)', 'rgba(10, 10, 12, 0.8)']} style={styles.glassCard}>
                  <MetallicText style={styles.insightLabel} variant="gold">KEYWORD LIFT</MetallicText>
                  {enhanced.keywordLift.restores.length > 0 && (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                      <MetallicText style={{ fontWeight: '600', fontSize: 15, lineHeight: 24 }} variant="gold">Restores: </MetallicText>
                      <Text style={styles.insightBody}>
                        {enhanced.keywordLift.restores.map(r => r.label).join(', ')}
                      </Text>
                    </View>
                  )}
                  {enhanced.keywordLift.drains.length > 0 && (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
                      <MetallicText style={{ fontWeight: '600', fontSize: 15, lineHeight: 24 }} variant="copper">Drains: </MetallicText>
                      <Text style={styles.insightBody}>
                        {enhanced.keywordLift.drains.map(d => d.label).join(', ')}
                      </Text>
                    </View>
                  )}
                </LinearGradient>
              )}

              {enhanced.emotionToneShift && (
                <LinearGradient colors={['rgba(212, 184, 114, 0.08)', 'rgba(10, 10, 12, 0.8)']} style={styles.glassCard}>
                  <MetallicText style={styles.insightLabel} variant="gold">EMOTION TONE</MetallicText>
                  <Text style={styles.insightBody}>{enhanced.emotionToneShift.insight}</Text>
                </LinearGradient>
              )}
            </Animated.View>
          )}

          {/* ── Hub 6: Cosmic Context ── */}
          <Animated.View entering={FadeInDown.delay(480)} style={[styles.section, { marginTop: 8 }]}>
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

