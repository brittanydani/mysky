/**
 * Insights Tab — 5-Hub Reflection Architecture
 *
 * Atmospheric-consistent entry point with unified OLED depth,
 * tabular metric precision, and refined glassmorphism.
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
import { CircadianRhythmTerrain } from '../../components/ui/CircadianRhythmTerrain';
import { useCircadianStore } from '../../store/circadianStore';

// ── Unified 5-Hub Palette ──
const PALETTE = {
  gold: '#D4B872',
  silverBlue: '#8BC4E8',
  copper: '#CD7F5D',
  emerald: '#6EBF8B',
  bg: '#0A0A0C',
  textMain: '#FFFFFF',
  glassBorder: 'rgba(255,255,255,0.08)',
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
  const syncRhythm = useCircadianStore((s) => s.syncRhythm);

  useFocusEffect(
    useCallback(() => {
      syncRhythm().catch(() => {});
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

          setSnapshot({ avgMood, checkInCount: checkIns.length, stressTrend });

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
              setEnhanced(computeEnhancedInsights(pipelineResult.dailyAggregates, pipelineResult.chartProfile));
            } catch (e) {
              logger.error('Enhanced insights pipeline failed:', e);
            }
          }
        } catch (e) {
          logger.error('Insights load failed:', e);
        }
      })();
    }, [isPremium, syncRhythm])
  );

  const nav = (route: string) => {
    Haptics.selectionAsync().catch(() => {});
    router.push(route as Href);
  };

  const stressLabel = (trend: SnapshotData['stressTrend']): string => {
    if (trend === 'improving') return 'Easing';
    if (trend === 'worsening') return 'Rising';
    if (trend === 'stable') return 'Stable';
    return '—';
  };

  const prompt = getDailyPrompt();

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

          {/* ── Header ── */}
          <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
            <Text style={styles.title}>Insights</Text>
            <Text style={styles.subtitle}>Personalized patterns & rhythmic guidance</Text>
          </Animated.View>

          {/* ── Hub 1: Daily Reflection Prompt ── */}
          <Animated.View entering={FadeInDown.delay(160)} style={styles.section}>
            <LinearGradient colors={['rgba(212, 184, 114, 0.12)', 'rgba(10, 10, 12, 0.8)']} style={styles.glassCard}>
              <View style={styles.promptHeader}>
                <Ionicons name="sparkles-outline" size={14} color={PALETTE.gold} />
                <Text style={styles.promptEyebrow}>REFLECTION PROMPT</Text>
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
            <MetricBox label="AVG MOOD" value={snapshot.avgMood?.toFixed(1) ?? '—'} color={PALETTE.silverBlue} />
            <MetricBox label="STRESS" value={stressLabel(snapshot.stressTrend)} color={PALETTE.copper} isText />
            <MetricBox label="LOGS" value={snapshot.checkInCount.toString()} color={PALETTE.gold} />
          </View>

          {/* ── Hub 3: Circadian Terrain (Premium) ── */}
          {isPremium && (
            <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
              <Text style={styles.sectionTitle}>Circadian Terrain</Text>
              <View style={styles.terrainContainer}>
                <CircadianRhythmTerrain height={240} />
              </View>
            </Animated.View>
          )}

          {/* ── Hub 4: Narrative Pattern Insights ── */}
          {enhanced && (
            <Animated.View entering={FadeInDown.delay(400)} style={styles.section}>
              {enhanced.blended.length > 0 && (
                <LinearGradient colors={['rgba(139, 196, 232, 0.1)', 'rgba(10, 10, 12, 0.8)']} style={styles.glassCard}>
                  <View style={styles.patternLabelRow}>
                    <Ionicons name="git-merge-outline" size={14} color={PALETTE.silverBlue} />
                    <Text style={[styles.insightLabel, { color: PALETTE.silverBlue }]}>WHERE IT CONNECTS</Text>
                  </View>
                  <Text style={styles.patternTitle}>{enhanced.blended[0].title}</Text>
                  <Text style={styles.insightBody}>{enhanced.blended[0].body}</Text>
                </LinearGradient>
              )}

              {enhanced.keywordLift.hasData && (
                <LinearGradient colors={['rgba(110, 191, 139, 0.1)', 'rgba(10, 10, 12, 0.8)']} style={styles.glassCard}>
                  <Text style={[styles.insightLabel, { color: PALETTE.emerald }]}>KEYWORD LIFT</Text>
                  {enhanced.keywordLift.restores.length > 0 && (
                    <Text style={styles.insightBody}>
                      <Text style={{ color: PALETTE.emerald, fontWeight: '600' }}>Restores: </Text>
                      {enhanced.keywordLift.restores.map(r => r.label).join(', ')}
                    </Text>
                  )}
                  {enhanced.keywordLift.drains.length > 0 && (
                    <Text style={[styles.insightBody, { marginTop: 8 }]}>
                      <Text style={{ color: PALETTE.copper, fontWeight: '600' }}>Drains: </Text>
                      {enhanced.keywordLift.drains.map(d => d.label).join(', ')}
                    </Text>
                  )}
                </LinearGradient>
              )}

              {enhanced.emotionToneShift && (
                <LinearGradient colors={['rgba(212, 184, 114, 0.08)', 'rgba(10, 10, 12, 0.8)']} style={styles.glassCard}>
                  <Text style={styles.insightLabel}>EMOTION TONE</Text>
                  <Text style={styles.insightBody}>{enhanced.emotionToneShift.insight}</Text>
                </LinearGradient>
              )}
            </Animated.View>
          )}

          {/* ── Hub 5: Cosmic Context ── */}
          <Animated.View entering={FadeInDown.delay(480)} style={[styles.section, { marginTop: 8 }]}>
            <Pressable onPress={() => nav('/astrology-context')}>
              <LinearGradient colors={['rgba(212, 184, 114, 0.1)', 'rgba(212, 184, 114, 0.02)']} style={styles.cosmicCard}>
                <View style={styles.cosmicHeader}>
                  <View style={styles.cosmicIconWrap}>
                    <Ionicons name="planet-outline" size={18} color={PALETTE.gold} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cosmicTitle}>Cosmic Context</Text>
                    <Text style={styles.cosmicSubtitle}>View today's transits and influences</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.3)" />
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
    <Text style={[styles.metricLabel, { color }]}>{label}</Text>
    <Text style={[styles.metricValue, isText && { fontSize: 16 }]}>{value}</Text>
  </View>
);

const ActionPill = ({ label, icon, color, onPress }: { label: string; icon: keyof typeof Ionicons.glyphMap; color: string; onPress: () => void }) => (
  <Pressable onPress={onPress} style={[styles.actionPill, { borderColor: `${color}40` }]}>
    <Ionicons name={icon} size={16} color={color} />
    <Text style={[styles.actionLabel, { color }]}>{label}</Text>
  </Pressable>
);

// ── Styles ──

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PALETTE.bg },
  safeArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 120 },

  header: { marginTop: 20, marginBottom: 28 },
  title: { fontSize: 32, fontWeight: '700', color: PALETTE.textMain, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }) },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', marginTop: 4 },

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
});

