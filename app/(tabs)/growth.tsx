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
import { GoldSubtitle } from '../../components/ui/GoldSubtitle';
import { MetallicIcon } from '../../components/ui/MetallicIcon';
import { MetallicText } from '../../components/ui/MetallicText';

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
            <GoldSubtitle style={styles.subtitle}>Analysis of your internal weather</GoldSubtitle>
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
                <MetallicText style={styles.chartLabel} color={PALETTE.gold}>30-DAY STABILITY MAP</MetallicText>
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
                    </Text>
                  )}
                  {enhanced.keywordLift.restores.length > 0 && (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
                      <MetallicText style={{ fontWeight: '600', fontSize: 15, lineHeight: 24 }} variant="green">
                        {enhanced.keywordLift.restores.map(r => r.label).join(', ')}
                      </MetallicText>
                      <Text style={styles.insightBody}>{' '}consistently stabilize your mood.</Text>
                    </View>
                  )}
                  {enhanced.keywordLift.drains.length > 0 && (
                    <Text style={[styles.insightBody, { marginTop: 12 }]}>
                      Meanwhile,{' '}
                    </Text>
                  )}
                  {enhanced.keywordLift.drains.length > 0 && (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
                      <MetallicText style={{ fontWeight: '600', fontSize: 15, lineHeight: 24 }} variant="copper">
                        {enhanced.keywordLift.drains.map(d => d.label).join(', ')}
                      </MetallicText>
                      <Text style={styles.insightBody}>{' '}tend to drain your energy.</Text>
                    </View>
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
                <MetallicIcon name="lock-closed" size={20} color={PALETTE.gold} />
                <MetallicText style={styles.premiumText} color={PALETTE.gold}>Unlock Neural Pattern Mapping</MetallicText>
              </LinearGradient>
            </Pressable>
          )}

          {/* ── Go Deeper: Energy Map ── */}
          <Animated.View entering={FadeInDown.delay(350).duration(600)} style={{ marginTop: 24 }}>
            <Pressable
              onPress={() => router.push('/(tabs)/energy' as Href)}
              accessibilityRole="button"
              accessibilityLabel="Open energy map"
            >
              <LinearGradient
                colors={['rgba(139, 196, 232, 0.1)', 'rgba(10, 10, 12, 0.8)']}
                style={[styles.premiumLock, { justifyContent: 'space-between', paddingHorizontal: 20 }]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <MetallicIcon name="flash-outline" size={20} variant="blue" />
                  <MetallicText style={[styles.premiumText, { color: undefined }]} variant="blue">Go Deeper · Energy Map</MetallicText>
                </View>
                <MetallicIcon name="arrow-forward" size={16} variant="blue" />
              </LinearGradient>
            </Pressable>
          </Animated.View>

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

const SectionHeader = ({ title, icon }: { title: string; icon: string }) => (
  <View style={styles.sectionHeader}>
    <MetallicIcon name={icon as any} size={18} color={PALETTE.gold} />
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020817' },
  safeArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 140 },
  header: { marginTop: 20, marginBottom: 32 },
  title: { fontSize: 34, fontWeight: '300', color: PALETTE.textMain, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }), marginBottom: 8 },
  subtitle: { fontSize: 14 },
  snapshotRow: { flexDirection: 'row', gap: 10, marginBottom: 32 },
  metricCard: { flex: 1, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: PALETTE.glassBorder, alignItems: 'center', minHeight: 100 },
  metricLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
  metricValue: { color: PALETTE.textMain, fontSize: 24, fontWeight: '700', fontVariant: ['tabular-nums'] },
  metricSub: { color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 4, textAlign: 'center' },
  visualSection: { alignItems: 'center', marginBottom: 32 },
  chartWrapper: { width: '100%', marginTop: 24, padding: 20, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(226, 194, 122, 0.14)', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 18, elevation: 10 },
  chartLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.8, marginBottom: 20, textAlign: 'center' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  sectionTitle: { color: PALETTE.textMain, fontSize: 18, fontWeight: '600', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  insightColumn: { gap: 12 },
  insightCard: { padding: 20, borderRadius: 20, borderWidth: 1, borderColor: PALETTE.glassBorder },
  insightLabel: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.4)', letterSpacing: 1, marginBottom: 8 },
  insightBody: { color: PALETTE.textMain, fontSize: 15, lineHeight: 24 },
  premiumLock: { padding: 24, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  premiumText: { color: PALETTE.gold, fontWeight: '600' },
});

