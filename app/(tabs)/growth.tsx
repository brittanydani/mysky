/**
 * Patterns Screen — accessed from (tabs)/growth route.
 *
 * 5-Hub Architecture: quantitative snapshot, data visualization,
 * and premium qualitative insights with Neural Pattern Mapping.
 */

import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Platform, Dimensions, ActivityIndicator } from 'react-native';
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
import { PatternOrbitMap } from '../../components/ui/PatternOrbitMap';
import { DailyCheckIn } from '../../services/patterns/types';
import { GoldSubtitle } from '../../components/ui/GoldSubtitle';
import { MetallicIcon } from '../../components/ui/MetallicIcon';
import { MetallicText } from '../../components/ui/MetallicText';
import {
  computeDeepPatternBundle,
  DeepPatternBundle,
  NS_BRANCH_COLORS,
  NS_STATE_FULL_LABELS,
  NS_STATE_DESCRIPTIONS,
  TRIGGER_DISPLAY,
} from '../../utils/deepPatternInsights';

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

interface SnapshotData {
  avgMood: number | null;
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

function buildWeeklyChangeCard(deepBundle: DeepPatternBundle | null, snapshot: SnapshotData): LoopCardContent | null {
  const weekSummary = deepBundle?.bundle.weekSummary;
  const timeOfDay = deepBundle?.bundle.timeOfDay;

  if (weekSummary) {
    const stressLine = weekSummary.stressTrend.direction === 'up'
      ? 'Stress has been rising.'
      : weekSummary.stressTrend.direction === 'down'
        ? 'Stress has been easing.'
        : 'Stress has stayed fairly steady.';

    return {
      label: 'WHAT CHANGED THIS WEEK',
      title: 'Your weekly signal',
      body: `${stressLine} Mood averaged ${weekSummary.avgMood.toFixed(1)}/10 and energy averaged ${((weekSummary.avgEnergy / 9) * 10).toFixed(1)}/10.${timeOfDay ? ` ${timeOfDay.insight}` : ''}`,
      accent: PALETTE.silverBlue,
    };
  }

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

function buildLearningCard(deepBundle: DeepPatternBundle | null, enhanced: EnhancedInsightBundle | null): LoopCardContent | null {
  const bundle = deepBundle?.bundle;
  const relational = deepBundle?.relational;
  const blueprintTheme = deepBundle?.blueprint[0];

  if (bundle?.tagInsights?.hasTagData) {
    const restore = bundle.tagInsights.restores[0]?.label;
    const drain = bundle.tagInsights.drains[0]?.label;
    if (restore && drain) {
      return {
        label: "WHAT YOU'RE LEARNING",
        title: 'Your strongest pattern right now',
        body: `${restore} tends to restore you, while ${drain} shows up more often on heavier days. This gets sharper as your history grows.`,
        accent: PALETTE.emerald,
      };
    }
  }

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

  if (relational && relational.moodLift !== null) {
    return {
      label: "WHAT YOU'RE LEARNING",
      title: 'Connection affects your baseline',
      body: relational.moodLift > 0
        ? `Relational days lift your mood by about ${relational.moodLift.toFixed(1)} points. Connection looks like a real source of regulation for you.`
        : `Relational days run about ${Math.abs(relational.moodLift).toFixed(1)} points lower. Connection may be meaningful, but it is also carrying weight.`,
      accent: PALETTE.rose,
    };
  }

  if (blueprintTheme) {
    return {
      label: "WHAT YOU'RE LEARNING",
      title: blueprintTheme.title,
      body: blueprintTheme.body,
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
    checkInCount: 0,
    stressTrend: null,
  });
  const [enhanced, setEnhanced] = useState<EnhancedInsightBundle | null>(null);
  const [trendCheckIns, setTrendCheckIns] = useState<DailyCheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [deepBundle, setDeepBundle] = useState<DeepPatternBundle | null>(null);
  const weeklyChangeCard = buildWeeklyChangeCard(deepBundle, snapshot);
  const learningCard = buildLearningCard(deepBundle, enhanced);
  const premiumTeaser = weeklyChangeCard ?? learningCard;

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      setTrendCheckIns([]);
      setDeepBundle(null);
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
          setTrendCheckIns(sorted);
          setSnapshot({ avgMood, checkInCount: checkIns.length, stressTrend });

          // Enhanced insights pipeline + deep bundle
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
            const sleepEntries = await localDb.getSleepEntries(chartId, 90);

            const pipelineResult = runPipeline({ checkIns, journalEntries, chart: natalChart, todayContext: null });
            setEnhanced(computeEnhancedInsights(pipelineResult.dailyAggregates, pipelineResult.chartProfile));

            const deep = computeDeepPatternBundle(checkIns, journalEntries, sleepEntries, natalChart);
            setDeepBundle(deep);
          } catch (e) {
            logger.error('Enhanced insights pipeline failed:', e);
          }
        } catch (e) {
          logger.error('Patterns load failed:', e);
        } finally {
          setLoading(false);
        }
      })();
    }, [])
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
            <MetricCard label="AVG MOOD" value={snapshot.avgMood?.toFixed(1) ?? '—'} color={PALETTE.silverBlue} sub={snapshot.avgMood ? moodSubLabel(snapshot.avgMood) : 'No data'} />
            <MetricCard label="STRESS" value={stressLabel(snapshot.stressTrend)} color={PALETTE.copper} isText />
            <MetricCard label="LOGGED" value={snapshot.checkInCount.toString()} color={PALETTE.gold} sub="last 30 days" />
          </View>

          {/* ── Hub 2: Visualization — Cosmic Pattern Orbit ── */}
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
                <Text style={{ color: PALETTE.gold, fontSize: 14, textAlign: 'center', marginTop: 12, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' }}>
                  Log a few check-ins to reveal your pattern orbit map.
                </Text>
              </View>
            )}
          </View>

          {weeklyChangeCard && (
            <>
              <SectionHeader title="What Changed This Week" icon="calendar-outline" />
              <LoopCard content={weeklyChangeCard} />
            </>
          )}

          {learningCard && (
            <>
              <SectionHeader title="What You're Learning" icon="school-outline" />
              <LoopCard content={learningCard} />
            </>
          )}

          {/* ── Hub 3: Deep Insights (Premium) ── */}
          <SectionHeader title="Deep Insights" icon="analytics-outline" />
          {isPremium ? (
            deepBundle ? (
              <DeepInsightLenses deepBundle={deepBundle} enhanced={enhanced} />
            ) : (
              <LinearGradient colors={['rgba(255,255,255,0.03)', 'rgba(10,10,12,0.8)']} style={styles.insightCard}>
                <View style={{ alignItems: 'center' }}>
                  <Ionicons name="hourglass-outline" size={28} color={theme.textMuted} style={{ marginBottom: 12 }} />
                  <Text style={[styles.insightBody, { textAlign: 'center', color: theme.textMuted }]}>
                    Keep logging — patterns emerge after a few weeks of check-ins and journal entries.
                  </Text>
                </View>
              </LinearGradient>
            )
          ) : (
            <Pressable onPress={() => router.push('/(tabs)/premium' as Href)}>
              <LinearGradient colors={['rgba(212, 184, 114, 0.1)', 'rgba(10, 10, 12, 0.8)']} style={styles.premiumLock}>
                <View style={styles.premiumLockIcon}>
                  <MetallicIcon name="lock-closed-outline" size={20} color={PALETTE.gold} />
                </View>
                <View style={styles.premiumLockTextWrap}>
                  <MetallicText style={styles.premiumText} color={PALETTE.gold}>Unlock your full private pattern report</MetallicText>
                  <Text style={styles.premiumTeaserText}>
                    {premiumTeaser
                      ? `${premiumTeaser.title}: ${premiumTeaser.body}`
                      : 'See what changed this week, what keeps repeating, and what your history is teaching you.'}
                  </Text>
                </View>
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

const LoopCard = ({ content }: { content: LoopCardContent }) => (
  <LinearGradient colors={[`${content.accent}18`, 'rgba(10,10,12,0.85)']} style={[styles.insightCard, styles.loopCard]}>
    <Text style={styles.insightLabel}>{content.label}</Text>
    <Text style={[styles.loopTitle, { color: content.accent }]}>{content.title}</Text>
    <Text style={styles.insightBody}>{content.body}</Text>
  </LinearGradient>
);

// ── Deep Insight Lenses ───────────────────────────────────────────────────────

const LensHeader = ({ icon, title, color }: { icon: string; title: string; color: string }) => (
  <View style={lensStyles.lensHeader}>
    <MetallicIcon name={icon as any} size={18} color={color} />
    <Text style={[lensStyles.lensTitle, { color }]}>{title}</Text>
  </View>
);

const InsightChip = ({ label, color }: { label: string; color: string }) => (
  <View style={[lensStyles.chip, { borderColor: color + '44', backgroundColor: color + '11' }]}>
    <Text style={[lensStyles.chipText, { color }]}>{label}</Text>
  </View>
);

const StatLine = ({ label, value, color = PALETTE.textMain }: { label: string; value: string; color?: string }) => (
  <View style={lensStyles.statLine}>
    <Text style={lensStyles.statLabel}>{label}</Text>
    <Text style={[lensStyles.statValue, { color }]}>{value}</Text>
  </View>
);

const NSBar = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <View style={lensStyles.nsBarRow}>
    <Text style={lensStyles.nsBarLabel}>{label}</Text>
    <View style={lensStyles.nsBarTrack}>
      <View style={[lensStyles.nsBarFill, { width: `${Math.round(value * 100)}%`, backgroundColor: color }]} />
    </View>
    <Text style={[lensStyles.nsBarPct, { color }]}>{Math.round(value * 100)}%</Text>
  </View>
);

function DeepInsightLenses({
  deepBundle,
  enhanced,
}: {
  deepBundle: DeepPatternBundle;
  enhanced: EnhancedInsightBundle | null;
}) {
  const { bundle, innerTensions, blueprint, relational, bodyTagStats } = deepBundle;
  const b = bundle;

  return (
    <View style={{ gap: 28 }}>

      {/* ── 1. Mood & Energy Patterns ── */}
      {b.hasEnoughData && (b.stability || b.timeOfDay || b.weekSummary) && (
        <View style={{ gap: 10 }}>
          <LensHeader icon="bar-chart-outline" title="Mood & Energy" color={PALETTE.silverBlue} />

          {b.stability && (
            <LinearGradient colors={['rgba(139,196,232,0.08)', 'rgba(10,10,12,0.85)']} style={styles.insightCard}>
              <Text style={styles.insightLabel}>INNER WEATHER</Text>
              <Text style={[lensStyles.lensSubtitle, { color: PALETTE.silverBlue }]}>{b.stability.label}</Text>
              <Text style={styles.insightBody}>{b.stability.description}</Text>
            </LinearGradient>
          )}

          {b.timeOfDay && (
            <LinearGradient colors={['rgba(139,196,232,0.06)', 'rgba(10,10,12,0.85)']} style={styles.insightCard}>
              <Text style={styles.insightLabel}>TIME OF DAY</Text>
              <Text style={styles.insightBody}>{b.timeOfDay.insight}</Text>
              <View style={{ marginTop: 12, gap: 6 }}>
                {b.timeOfDay.metricInsights.map((mi, i) => (
                  <StatLine
                    key={i}
                    label={`${mi.emoji} ${mi.label}`}
                    value={`${mi.highBucket} ↑  ${mi.lowBucket} ↓`}
                    color={PALETTE.silverBlue}
                  />
                ))}
              </View>
            </LinearGradient>
          )}

          {b.weekSummary && (
            <LinearGradient colors={['rgba(139,196,232,0.05)', 'rgba(10,10,12,0.85)']} style={styles.insightCard}>
              <Text style={styles.insightLabel}>THIS WEEK</Text>
              <View style={{ gap: 6, marginTop: 4 }}>
                <StatLine label="Mood" value={`${b.weekSummary.avgMood.toFixed(1)} / 10`} color={PALETTE.silverBlue} />
                <StatLine label="Energy" value={`${(b.weekSummary.avgEnergy / 9 * 10).toFixed(1)} / 10`} color={PALETTE.emerald} />
                <StatLine label="Stress trend" value={b.weekSummary.stressTrend.direction === 'up' ? 'Rising' : b.weekSummary.stressTrend.direction === 'down' ? 'Easing' : 'Stable'} color={b.weekSummary.stressTrend.direction === 'up' ? PALETTE.copper : PALETTE.emerald} />
              </View>
            </LinearGradient>
          )}

          {b.lunarPhase && b.lunarPhase.confidence !== 'low' && (
            <LinearGradient colors={['rgba(139,196,232,0.05)', 'rgba(10,10,12,0.85)']} style={styles.insightCard}>
              <Text style={styles.insightLabel}>MONTHLY CYCLES</Text>
              <Text style={styles.insightBody}>{b.lunarPhase.insight}</Text>
              <Text style={[lensStyles.statValue, { marginTop: 8, color: PALETTE.silverBlue, fontSize: 13 }]}>{b.lunarPhase.stat}</Text>
            </LinearGradient>
          )}
        </View>
      )}

      {/* ── 2. What Restores & Drains You ── */}
      {(b.tagInsights?.hasTagData || (b.noteThemes && b.noteThemes.totalNotedDays > 2)) && (
        <View style={{ gap: 10 }}>
          <LensHeader icon="flash-outline" title="What Restores & Drains You" color={PALETTE.emerald} />

          {b.tagInsights?.hasTagData && (
            <LinearGradient colors={['rgba(110,191,139,0.08)', 'rgba(10,10,12,0.85)']} style={styles.insightCard}>
              <Text style={styles.insightLabel}>FROM YOUR CHECK-INS</Text>
              {b.tagInsights.restores.length > 0 && (
                <>
                  <Text style={[styles.insightBody, { color: PALETTE.emerald, fontWeight: '600', marginBottom: 8 }]}>Restores you</Text>
                  <View style={lensStyles.chipRow}>
                    {b.tagInsights.restores.slice(0, 4).map(r => (
                      <InsightChip key={r.tag} label={r.label} color={PALETTE.emerald} />
                    ))}
                  </View>
                </>
              )}
              {b.tagInsights.drains.length > 0 && (
                <>
                  <Text style={[styles.insightBody, { color: PALETTE.copper, fontWeight: '600', marginTop: 14, marginBottom: 8 }]}>Drains you</Text>
                  <View style={lensStyles.chipRow}>
                    {b.tagInsights.drains.slice(0, 4).map(d => (
                      <InsightChip key={d.tag} label={d.label} color={PALETTE.copper} />
                    ))}
                  </View>
                </>
              )}
            </LinearGradient>
          )}

          {b.noteThemes && b.noteThemes.totalNotedDays > 2 && (
            <LinearGradient colors={['rgba(110,191,139,0.05)', 'rgba(10,10,12,0.85)']} style={styles.insightCard}>
              <Text style={styles.insightLabel}>FROM YOUR NOTES</Text>
              <Text style={styles.insightBody}>{b.noteThemes.insight}</Text>
              {b.noteThemes.restoreWords.length > 0 && (
                <View style={[lensStyles.chipRow, { marginTop: 12 }]}>
                  {b.noteThemes.restoreWords.slice(0, 4).map(w => (
                    <InsightChip key={w.word} label={w.word} color={PALETTE.emerald} />
                  ))}
                </View>
              )}
              {b.noteThemes.drainWords.length > 0 && (
                <View style={[lensStyles.chipRow, { marginTop: 8 }]}>
                  {b.noteThemes.drainWords.slice(0, 4).map(w => (
                    <InsightChip key={w.word} label={w.word} color={PALETTE.copper} />
                  ))}
                </View>
              )}
            </LinearGradient>
          )}
        </View>
      )}

      {/* ── 3. Journal & Reflection ── */}
      {(b.journalLinkage || b.journalThemes || enhanced) && (
        <View style={{ gap: 10 }}>
          <LensHeader icon="book-outline" title="Journal & Reflection" color={PALETTE.gold} />

          {b.journalLinkage && (
            <LinearGradient colors={['rgba(212,184,114,0.08)', 'rgba(10,10,12,0.85)']} style={styles.insightCard}>
              <Text style={styles.insightLabel}>WRITING IMPACT</Text>
              <Text style={styles.insightBody}>{b.journalLinkage.insight}</Text>
              <View style={{ marginTop: 12, gap: 6 }}>
                <StatLine label="Days you wrote" value={`${b.journalLinkage.daysWithJournal}`} color={PALETTE.gold} />
                <StatLine
                  label="Mood with journaling"
                  value={`${b.journalLinkage.moodWithJournal.toFixed(1)} vs ${b.journalLinkage.moodWithout.toFixed(1)}`}
                  color={b.journalLinkage.moodWithJournal >= b.journalLinkage.moodWithout ? PALETTE.emerald : PALETTE.copper}
                />
              </View>
            </LinearGradient>
          )}

          {b.journalThemes && b.journalThemes.topWords.length > 0 && (
            <LinearGradient colors={['rgba(212,184,114,0.06)', 'rgba(10,10,12,0.85)']} style={styles.insightCard}>
              <Text style={styles.insightLabel}>RECURRING THEMES</Text>
              <Text style={styles.insightBody}>{b.journalThemes.insight}</Text>
              <View style={[lensStyles.chipRow, { marginTop: 12 }]}>
                {b.journalThemes.topWords.slice(0, 6).map(word => (
                  <InsightChip key={word} label={word} color={PALETTE.gold} />
                ))}
              </View>
            </LinearGradient>
          )}

          {enhanced?.emotionToneShift && (
            <LinearGradient colors={['rgba(212,184,114,0.06)', 'rgba(10,10,12,0.85)']} style={styles.insightCard}>
              <Text style={styles.insightLabel}>EMOTIONAL TONE</Text>
              <Text style={styles.insightBody}>{enhanced.emotionToneShift.insight}</Text>
            </LinearGradient>
          )}

          {enhanced?.keywordLift.hasData && (
            <LinearGradient colors={['rgba(212,184,114,0.05)', 'rgba(10,10,12,0.85)']} style={styles.insightCard}>
              <Text style={styles.insightLabel}>LANGUAGE PATTERNS</Text>
              {enhanced.keywordLift.restores.length > 0 && (
                <>
                  <Text style={[styles.insightBody, { color: PALETTE.emerald, fontWeight: '600', marginBottom: 8 }]}>Words on your best days</Text>
                  <View style={lensStyles.chipRow}>
                    {enhanced.keywordLift.restores.slice(0, 4).map(r => (
                      <InsightChip key={r.label} label={r.label} color={PALETTE.emerald} />
                    ))}
                  </View>
                </>
              )}
              {enhanced.keywordLift.drains.length > 0 && (
                <>
                  <Text style={[styles.insightBody, { color: PALETTE.copper, fontWeight: '600', marginTop: 14, marginBottom: 8 }]}>Words on harder days</Text>
                  <View style={lensStyles.chipRow}>
                    {enhanced.keywordLift.drains.slice(0, 4).map(d => (
                      <InsightChip key={d.label} label={d.label} color={PALETTE.copper} />
                    ))}
                  </View>
                </>
              )}
            </LinearGradient>
          )}
        </View>
      )}

      {/* ── 4. Dream Life ── */}
      {innerTensions.dataQuality.totalEntries > 0 && (
        <View style={{ gap: 10 }}>
          <LensHeader icon="moon-outline" title="Dream Life" color={PALETTE.connection} />

          <LinearGradient colors={['rgba(157,118,193,0.08)', 'rgba(10,10,12,0.85)']} style={styles.insightCard}>
            <Text style={styles.insightLabel}>DREAM RECORD</Text>
            <View style={{ gap: 6 }}>
              <StatLine label="Sleep entries" value={`${innerTensions.dataQuality.totalEntries}`} color={PALETTE.connection} />
              <StatLine label="Entries with dream feelings" value={`${innerTensions.dataQuality.entriesWithFeelings}`} color={PALETTE.connection} />
              <StatLine label="Written dream entries" value={`${innerTensions.dataQuality.entriesWithText}`} color={PALETTE.connection} />
            </View>
          </LinearGradient>

          {innerTensions.dreamPatterns.length > 0 && (
            <LinearGradient colors={['rgba(157,118,193,0.06)', 'rgba(10,10,12,0.85)']} style={styles.insightCard}>
              <Text style={styles.insightLabel}>RECURRING DREAM THEMES</Text>
              <View style={{ gap: 10, marginTop: 4 }}>
                {innerTensions.dreamPatterns.map((dp, i) => (
                  <View key={i} style={lensStyles.dreamPatternRow}>
                    <Text style={[lensStyles.dreamPatternLabel, { color: PALETTE.connection }]}>{dp.label}</Text>
                    <Text style={lensStyles.dreamPatternCount}>{dp.count}×</Text>
                  </View>
                ))}
              </View>
            </LinearGradient>
          )}
        </View>
      )}

      {/* ── 5. Inner Blueprint ── */}
      {blueprint.length > 0 && (
        <View style={{ gap: 10 }}>
          <LensHeader icon="diamond-outline" title="Inner Blueprint" color={PALETTE.gold} />
          {blueprint.map((theme, i) => (
            <LinearGradient
              key={i}
              colors={['rgba(212,184,114,0.07)', 'rgba(10,10,12,0.85)']}
              style={styles.insightCard}
            >
              <View style={lensStyles.blueprintHeader}>
                <Text style={lensStyles.blueprintIcon}>{theme.icon}</Text>
                <Text style={[styles.insightLabel, { marginBottom: 0 }]}>{theme.title.toUpperCase()}</Text>
              </View>
              <Text style={[styles.insightBody, { marginTop: 10 }]}>{theme.body}</Text>
            </LinearGradient>
          ))}
        </View>
      )}

      {/* ── 6. Body & Nervous System ── */}
      {(innerTensions.dataQuality.entriesWithFeelings > 0 || bodyTagStats.entries.length > 0) && (
        <View style={{ gap: 10 }}>
          <LensHeader icon="body-outline" title="Body & Nervous System" color={PALETTE.copper} />

          {innerTensions.dataQuality.entriesWithFeelings > 0 && innerTensions.nsBranchForces.some(f => f.value > 0) && (
            <LinearGradient colors={['rgba(205,127,93,0.08)', 'rgba(10,10,12,0.85)']} style={styles.insightCard}>
              <Text style={styles.insightLabel}>NERVOUS SYSTEM STATES</Text>
              <View style={{ gap: 10, marginTop: 4 }}>
                {innerTensions.nsBranchForces
                  .filter(f => f.value > 0)
                  .map((f, i) => (
                    <NSBar key={i} label={f.label} value={f.value / 100} color={f.color} />
                  ))}
              </View>
              {innerTensions.nsConflict.conflictScore > 0.35 && (
                <Text style={[styles.insightBody, { marginTop: 14, color: 'rgba(255,255,255,0.7)' }]}>
                  Your nervous system has been holding conflicting states — safety alongside activation. This kind of tension often reflects something important pulling in two directions.
                </Text>
              )}
            </LinearGradient>
          )}

          {bodyTagStats.entries.length > 0 && (
            <LinearGradient colors={['rgba(205,127,93,0.06)', 'rgba(10,10,12,0.85)']} style={styles.insightCard}>
              <Text style={styles.insightLabel}>BODY SIGNALS LOGGED</Text>
              <View style={{ gap: 6, marginTop: 4 }}>
                {bodyTagStats.entries.slice(0, 6).map(stat => (
                  <StatLine
                    key={stat.tag}
                    label={stat.label}
                    value={`${stat.days}d · avg mood ${stat.avgMood.toFixed(1)}`}
                    color={stat.avgMood >= 6 ? PALETTE.emerald : stat.avgMood >= 4 ? PALETTE.gold : PALETTE.copper}
                  />
                ))}
              </View>
            </LinearGradient>
          )}
        </View>
      )}

      {/* ── 7. Relationship Mirror ── */}
      {relational && relational.relationalDays >= 3 && (
        <View style={{ gap: 10 }}>
          <LensHeader icon="people-outline" title="Relationship Mirror" color={PALETTE.silverBlue} />

          <LinearGradient colors={['rgba(139,196,232,0.08)', 'rgba(10,10,12,0.85)']} style={styles.insightCard}>
            <Text style={styles.insightLabel}>RELATIONAL MOOD</Text>
            <Text style={styles.insightBody}>{relational.insight}</Text>
            {relational.avgMoodWithRelTags !== null && relational.avgMoodWithoutRelTags !== null && (
              <View style={{ marginTop: 12, gap: 6 }}>
                <StatLine label="Relational days" value={relational.avgMoodWithRelTags.toFixed(1)} color={PALETTE.silverBlue} />
                <StatLine label="Solo days" value={relational.avgMoodWithoutRelTags.toFixed(1)} color={PALETTE.silverBlue} />
              </View>
            )}
          </LinearGradient>

          {(relational.conflictDays > 0 || relational.boundaryDays > 0 || relational.intimacyDays > 0) && (
            <LinearGradient colors={['rgba(139,196,232,0.06)', 'rgba(10,10,12,0.85)']} style={styles.insightCard}>
              <Text style={styles.insightLabel}>CONNECTION LANDSCAPE</Text>
              <View style={{ gap: 6, marginTop: 4 }}>
                {relational.socialDays > 0 && <StatLine label="Social days" value={`${relational.socialDays}`} color={PALETTE.silverBlue} />}
                {relational.intimacyDays > 0 && <StatLine label="Intimacy days" value={`${relational.intimacyDays}`} color={PALETTE.emerald} />}
                {relational.familyDays > 0 && <StatLine label="Family days" value={`${relational.familyDays}`} color={PALETTE.gold} />}
                {relational.conflictDays > 0 && <StatLine label="Conflict days" value={`${relational.conflictDays}`} color={PALETTE.copper} />}
                {relational.boundaryDays > 0 && <StatLine label="Boundary activations" value={`${relational.boundaryDays}`} color={PALETTE.copper} />}
              </View>
            </LinearGradient>
          )}
        </View>
      )}

      {/* ── 8. Inner Tensions ── */}
      {(innerTensions.topTriggers.length > 0 || innerTensions.ambivalence.detected || innerTensions.nsConflict.conflictScore > 0.3) && (
        <View style={{ gap: 10 }}>
          <LensHeader icon="swap-horizontal-outline" title="Inner Tensions" color={PALETTE.lavender} />

          {innerTensions.nsConflict.conflictScore > 0.3 && (
            <LinearGradient colors={['rgba(168,155,200,0.08)', 'rgba(10,10,12,0.85)']} style={styles.insightCard}>
              <Text style={styles.insightLabel}>COMPETING STATES</Text>
              <Text style={styles.insightBody}>
                Your dominant states — {innerTensions.nsConflict.dominantStates.slice(0, 2).map(s => NS_STATE_FULL_LABELS[s]).join(' and ')} — are pulling in different directions. This kind of conflict is information. Something beneath the surface is asking for attention.
              </Text>
              <View style={{ gap: 6, marginTop: 12 }}>
                {innerTensions.nsConflict.dominantStates.slice(0, 3).map(s => (
                  <View key={s} style={lensStyles.statLine}>
                    <View style={[lensStyles.nsDot, { backgroundColor: NS_BRANCH_COLORS[s] }]} />
                    <Text style={[lensStyles.statLabel, { flex: 1 }]}>{NS_STATE_FULL_LABELS[s]}</Text>
                    <Text style={[lensStyles.nsBarLabel, { color: 'rgba(255,255,255,0.4)' }]}>{NS_STATE_DESCRIPTIONS[s]}</Text>
                  </View>
                ))}
              </View>
            </LinearGradient>
          )}

          {innerTensions.ambivalence.detected && innerTensions.ambivalence.pairs.length > 0 && (
            <LinearGradient colors={['rgba(168,155,200,0.06)', 'rgba(10,10,12,0.85)']} style={styles.insightCard}>
              <Text style={styles.insightLabel}>AMBIVALENCE DETECTED</Text>
              <Text style={styles.insightBody}>
                Your dream life holds feelings that push and pull at the same time — this is called ambivalence. It is not a problem to solve but a signal that something matters deeply.
              </Text>
              <View style={[lensStyles.chipRow, { marginTop: 12 }]}>
                {innerTensions.ambivalence.pairs.slice(0, 3).map((pair, i) => (
                  <InsightChip key={i} label={`${TRIGGER_DISPLAY[pair.positiveTrigger]} ↔ ${TRIGGER_DISPLAY[pair.negativeTrigger]}`} color={PALETTE.lavender} />
                ))}
              </View>
            </LinearGradient>
          )}

          {innerTensions.topTriggers.length > 0 && (
            <LinearGradient colors={['rgba(168,155,200,0.06)', 'rgba(10,10,12,0.85)']} style={styles.insightCard}>
              <Text style={styles.insightLabel}>SENSITIVITY THEMES</Text>
              <Text style={[styles.insightBody, { marginBottom: 12 }]}>
                These themes surface most in your dream life — not as problems, but as places where your psyche is doing its deepest work.
              </Text>
              <View style={lensStyles.chipRow}>
                {innerTensions.topTriggers.map(({ trigger }) => (
                  <InsightChip key={trigger} label={TRIGGER_DISPLAY[trigger]} color={PALETTE.lavender} />
                ))}
              </View>
            </LinearGradient>
          )}
        </View>
      )}

    </View>
  );
}

const lensStyles = StyleSheet.create({
  lensHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  lensIcon: { fontSize: 18 },
  lensTitle: { fontSize: 17, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  lensSubtitle: { fontSize: 15, fontWeight: '600', marginBottom: 6 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: '600' },
  statLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 13 },
  statValue: { fontSize: 13, fontWeight: '600' },
  nsBarRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nsBarLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 12, width: 60 },
  nsBarTrack: { flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' },
  nsBarFill: { height: 4, borderRadius: 2 },
  nsBarPct: { fontSize: 12, fontWeight: '600', width: 34, textAlign: 'right' },
  nsDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  blueprintHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  blueprintIcon: { fontSize: 18, color: '#FFFFFF' },
  dreamPatternRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dreamPatternLabel: { fontSize: 14, fontWeight: '600', flex: 1 },
  dreamPatternCount: { color: 'rgba(255,255,255,0.4)', fontSize: 13 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020817' },
  safeArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 140 },
  header: { marginTop: 20, marginBottom: 32 },
  title: { fontSize: 34, fontWeight: '800', color: PALETTE.textMain, fontFamily: Platform.select({ ios: 'SFProDisplay-Bold', android: 'sans-serif-bold', default: 'System' }), letterSpacing: -0.5, marginBottom: 4 },
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
  loopCard: { marginBottom: 24 },
  loopTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  premiumLock: { padding: 24, borderRadius: 24, flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  premiumLockIcon: { paddingTop: 2 },
  premiumLockTextWrap: { flex: 1 },
  premiumText: { color: PALETTE.gold, fontWeight: '600' },
  premiumTeaserText: { color: 'rgba(255,255,255,0.72)', fontSize: 13, lineHeight: 20, marginTop: 8 },
});

