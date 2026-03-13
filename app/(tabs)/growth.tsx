/**
 * Patterns Screen — accessed from (tabs)/growth route.
 *
 * 5-Hub Architecture: quantitative snapshot, data visualization,
 * and premium qualitative insights with Neural Pattern Mapping.
 */

import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Platform, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from '../../components/ui/SkiaGradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Href } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/core';

import { theme } from '../../constants/theme';
import { SkiaDynamicCosmos } from '../../components/ui/SkiaDynamicCosmos';
import { localDb } from '../../services/storage/localDb';
import { logger } from '../../utils/logger';
import { usePremium } from '../../context/PremiumContext';
import { AstrologyCalculator } from '../../services/astrology/calculator';
import { runPipeline } from '../../services/insights/pipeline';
import { computeEnhancedInsights, EnhancedInsightBundle } from '../../utils/journalInsights';
import { BreathingMandala } from '../../components/ui/BreathingMandala';
import { NeonWaveChart } from '../../components/ui/NeonWaveChart';
import { DailyCheckIn } from '../../services/patterns/types';

const SCREEN_W = Dimensions.get('window').width;
const CHART_W = SCREEN_W - 72;

const PALETTE = {
  gold: '#D4B872',
  silverBlue: '#8BC4E8',
  copper: '#CD7F5D',
  emerald: '#6EBF8B',
  bg: '#0A0A0C',
  textMain: '#FFFFFF',
  glassBorder: 'rgba(255,255,255,0.06)',
};

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
  const [trendCheckIns, setTrendCheckIns] = useState<DailyCheckIn[]>([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const charts = await localDb.getCharts();
          if (!charts?.length) return;
          const chartId = charts[0].id;
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
          if (stresses.length >= 4) {
            const half = Math.floor(stresses.length / 2);
            const older = stresses.slice(half).reduce((a, b) => a + b, 0) / (stresses.length - half);
            const newer = stresses.slice(0, half).reduce((a, b) => a + b, 0) / half;
            if (newer < older - 0.5) stressTrend = 'improving';
            else if (newer > older + 0.5) stressTrend = 'worsening';
            else stressTrend = 'stable';
          }

          const sorted = [...checkIns].sort((a, b) => a.date.localeCompare(b.date));
          setTrendCheckIns(sorted.slice(-20));
          setSnapshot({ avgMood, checkInCount: checkIns.length, stressTrend });

          // Enhanced insights pipeline
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
            const journalEntries = await localDb.getJournalEntriesPaginated(90);
            const pipelineResult = runPipeline({ checkIns, journalEntries, chart: natalChart, todayContext: null });
            setEnhanced(computeEnhancedInsights(pipelineResult.dailyAggregates, pipelineResult.chartProfile));
          } catch (e) {
            logger.error('Enhanced insights pipeline failed:', e);
          }
        } catch (e) {
          logger.error('Patterns load failed:', e);
        }
      })();
    }, [isPremium])
  );

  const stressLabel = (trend: SnapshotData['stressTrend']): string => {
    if (trend === 'improving') return 'Easing';
    if (trend === 'worsening') return 'Rising';
    if (trend === 'stable') return 'Stable';
    return '—';
  };

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

          <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
            <Text style={styles.title}>Patterns</Text>
            <Text style={styles.subtitle}>Analysis of your internal weather</Text>
          </Animated.View>

          {/* ── Hub 1: Quantitative Snapshot ── */}
          <View style={styles.snapshotRow}>
            <MetricCard label="AVG MOOD" value={snapshot.avgMood?.toFixed(1) ?? '—'} color={PALETTE.silverBlue} sub={snapshot.avgMood ? 'Steady' : 'No data'} />
            <MetricCard label="STRESS" value={stressLabel(snapshot.stressTrend)} color={PALETTE.copper} isText />
            <MetricCard label="LOGGED" value={snapshot.checkInCount.toString()} color={PALETTE.gold} sub="last 30 days" />
          </View>

          {/* ── Hub 2: Visualization ── */}
          <View style={styles.visualSection}>
            <BreathingMandala size={240} />
            {trendCheckIns.length >= 2 && (
              <View style={styles.chartWrapper}>
                <Text style={styles.chartLabel}>30-DAY STABILITY MAP</Text>
                <NeonWaveChart checkIns={trendCheckIns} width={CHART_W} height={200} />
              </View>
            )}
          </View>

          {/* ── Hub 3: Qualitative Insights (Premium) ── */}
          <SectionHeader title="Deep Insights" icon="analytics-outline" />
          {isPremium ? (
            <View style={styles.insightColumn}>
              {/* Blended insight */}
              {enhanced?.blended && enhanced.blended.length > 0 && (
                <LinearGradient colors={['rgba(139, 196, 232, 0.1)', 'rgba(10, 10, 12, 0.8)']} style={styles.insightCard}>
                  <Text style={styles.insightLabel}>WHERE IT CONNECTS</Text>
                  <Text style={[styles.insightBody, { fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontSize: 17, marginBottom: 4 }]}>
                    {enhanced.blended[0].title}
                  </Text>
                  <Text style={styles.insightBody}>{enhanced.blended[0].body}</Text>
                </LinearGradient>
              )}

              {/* Restorative Anchors — Neural Map style */}
              {enhanced?.keywordLift.hasData && (
                <LinearGradient colors={['rgba(110, 191, 139, 0.1)', 'rgba(10, 10, 12, 0.8)']} style={styles.insightCard}>
                  <Text style={styles.insightLabel}>RESTORATIVE ANCHORS</Text>
                  {enhanced.keywordLift.restores.length > 0 && (
                    <Text style={styles.insightBody}>
                      Your journal suggests that{' '}
                      <Text style={{ color: PALETTE.emerald, fontWeight: '600' }}>
                        {enhanced.keywordLift.restores.map(r => r.label).join(', ')}
                      </Text>{' '}
                      consistently stabilize your mood.
                    </Text>
                  )}
                  {enhanced.keywordLift.drains.length > 0 && (
                    <Text style={[styles.insightBody, { marginTop: 12 }]}>
                      Meanwhile,{' '}
                      <Text style={{ color: PALETTE.copper, fontWeight: '600' }}>
                        {enhanced.keywordLift.drains.map(d => d.label).join(', ')}
                      </Text>{' '}
                      tend to drain your energy.
                    </Text>
                  )}
                </LinearGradient>
              )}

              {/* Emotion tone shift */}
              {enhanced?.emotionToneShift && (
                <LinearGradient colors={['rgba(212, 184, 114, 0.1)', 'rgba(10, 10, 12, 0.8)']} style={styles.insightCard}>
                  <Text style={styles.insightLabel}>EMOTION TONE</Text>
                  <Text style={styles.insightBody}>{enhanced.emotionToneShift.insight}</Text>
                </LinearGradient>
              )}

              {/* Not enough data */}
              {(!enhanced || (enhanced.blended.length === 0 && !enhanced.keywordLift.hasData && !enhanced.emotionToneShift)) && (
                <LinearGradient colors={['rgba(255,255,255,0.03)', 'rgba(10, 10, 12, 0.8)']} style={styles.insightCard}>
                  <View style={{ alignItems: 'center' }}>
                    <Ionicons name="hourglass-outline" size={28} color={theme.textMuted} style={{ marginBottom: 12 }} />
                    <Text style={[styles.insightBody, { textAlign: 'center', color: theme.textMuted }]}>
                      Keep logging — patterns emerge after a few weeks of check-ins and journal entries.
                    </Text>
                  </View>
                </LinearGradient>
              )}
            </View>
          ) : (
            <Pressable onPress={() => router.push('/(tabs)/premium' as Href)}>
              <LinearGradient colors={['rgba(212, 184, 114, 0.1)', 'rgba(10, 10, 12, 0.8)']} style={styles.premiumLock}>
                <Ionicons name="lock-closed" size={20} color={PALETTE.gold} />
                <Text style={styles.premiumText}>Unlock Neural Pattern Mapping</Text>
              </LinearGradient>
            </Pressable>
          )}

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const MetricCard = ({ label, value, color, sub, isText }: { label: string; value: string; color: string; sub?: string; isText?: boolean }) => (
  <LinearGradient colors={['rgba(255,255,255,0.05)', 'rgba(10, 10, 12, 0.8)']} style={styles.metricCard}>
    <Text style={[styles.metricLabel, { color }]}>{label}</Text>
    <Text style={[styles.metricValue, isText && { fontSize: 16 }]}>{value}</Text>
    {sub && <Text style={styles.metricSub}>{sub}</Text>}
  </LinearGradient>
);

const SectionHeader = ({ title, icon }: { title: string; icon: string }) => (
  <View style={styles.sectionHeader}>
    <Ionicons name={icon as any} size={18} color={PALETTE.gold} />
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PALETTE.bg },
  safeArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 140 },
  header: { marginTop: 20, marginBottom: 32 },
  title: { fontSize: 32, fontWeight: '700', color: PALETTE.textMain, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.5)', fontStyle: 'italic', marginTop: 4 },
  snapshotRow: { flexDirection: 'row', gap: 10, marginBottom: 32 },
  metricCard: { flex: 1, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: PALETTE.glassBorder, alignItems: 'center', minHeight: 100 },
  metricLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
  metricValue: { color: PALETTE.textMain, fontSize: 24, fontWeight: '700', fontVariant: ['tabular-nums'] },
  metricSub: { color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 4, textAlign: 'center' },
  visualSection: { alignItems: 'center', marginBottom: 32 },
  chartWrapper: { width: '100%', marginTop: 24, padding: 20, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 24, borderWidth: 1, borderColor: PALETTE.glassBorder },
  chartLabel: { color: PALETTE.gold, fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 20, textAlign: 'center' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  sectionTitle: { color: PALETTE.textMain, fontSize: 18, fontWeight: '600', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  insightColumn: { gap: 12 },
  insightCard: { padding: 20, borderRadius: 20, borderWidth: 1, borderColor: PALETTE.glassBorder },
  insightLabel: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.4)', letterSpacing: 1, marginBottom: 8 },
  insightBody: { color: PALETTE.textMain, fontSize: 15, lineHeight: 24 },
  premiumLock: { padding: 24, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  premiumText: { color: PALETTE.gold, fontWeight: '600' },
});

