/**
 * Insights Screen
 *
 * Synthesizes mood check-ins, journal entries, and natal chart into
 * interpreted pattern cards. Does NOT duplicate the Mood tab's raw graphs —
 * it interprets and connects.
 *
 * Uses the insights pipeline (services/insights/) for:
 *  - DayKey-based aggregation
 *  - ChartProfile derivation and caching
 *  - Smart cache invalidation (check-in/journal/day/chart changes)
 */

import React, { useState, useCallback, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, Href } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/core';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { theme } from '../../constants/theme';
import { usePremium } from '../../context/PremiumContext';
import StarField from '../../components/ui/StarField';
import { localDb } from '../../services/storage/localDb';
import { AstrologyCalculator } from '../../services/astrology/calculator';
import { DailyInsightEngine } from '../../services/astrology/dailyInsightEngine';
import { logger } from '../../utils/logger';
import {
  computeInsightBundleFromPipeline,
  computeInsightBundle,
  InsightBundle,
  ConfidenceLevel,
  TrendDirection,
  TrendResult,
  TimeOfDayBucket,
  TagLiftItem,
  ChartThemeCard,
  BlendedCard,
  JournalThemesCard,
  JournalFrequencyCard,
  ModalityCard,
  confidenceLabel,
  trendArrow,
  moodLabel,
  energyWord,
  stressWord,
  stressTrendArrow,
} from '../../utils/insightsEngine';
import type {
  EnhancedInsightBundle,
  JournalImpactCard,
  EmotionLiftItem,
  LiftItem,
  BlendedInsightCard,
  KeywordThemesCard,
  EmotionToneShiftCard,
  ChartBaselineCard,
} from '../../utils/journalInsights';
import type {
  TagAnalyticsBundle,
  TagLiftResult,
  TagImpactItem,
  TagPairResult,
  ClassifiedTag,
  TagJournalAgreement,
  TagChartAgreement,
} from '../../utils/tagAnalytics';
import { NatalChart } from '../../services/astrology/types';
import {
  runPipeline,
  deriveChartProfile,
  todayDayKey,
  makeCacheKey,
  getCachedBundle,
  setCachedBundle,
} from '../../services/insights';
import { runNlpBackfill } from '../../services/journal/backfillNlp';

// ─────────────────────────────────────────────────────────────────────────────

export default function InsightsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isPremium } = usePremium();

  const [loading, setLoading] = useState(true);
  const [bundle, setBundle] = useState<InsightBundle | null>(null);
  const [chart, setChart] = useState<NatalChart | null>(null);
  const loadingRef = useRef(false);

  const loadData = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;

    try {
      const today = todayDayKey();
      const charts = await localDb.getCharts();
      const chartId = charts.length > 0 ? charts[0].id : 'none';

      // Peek at latest updatedAt for cache key (limit-1 queries)
      const [recentCheckIns, recentJournals] = await Promise.all([
        charts.length > 0 ? localDb.getCheckIns(chartId, 1) : Promise.resolve([]),
        localDb.getJournalEntries(),
      ]);

      const lastCheckInAt = recentCheckIns[0]?.updatedAt ?? 'none';
      const lastJournalAt = recentJournals[0]?.updatedAt ?? 'none';

      // Derive chart profile hash for cache key
      let chartProfileHash = 'none';
      let natalChart: NatalChart | null = null;
      if (charts.length > 0) {
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
        natalChart = AstrologyCalculator.generateNatalChart(birthData);
        natalChart.id = saved.id;
        const profile = deriveChartProfile(natalChart);
        chartProfileHash = profile.versionHash;
      }

      const cacheKey = makeCacheKey(lastCheckInAt, lastJournalAt, today, chartProfileHash);

      // Check cache (memory + disk)
      const cached = await getCachedBundle(cacheKey);
      if (cached) {
        setChart(natalChart);
        setBundle(cached);
        setLoading(false);
        loadingRef.current = false;
        return;
      }

      // Cache miss — run NLP backfill for pre-v10 entries (no-op if already done)
      await runNlpBackfill();

      // Fetch all data and run pipeline
      const allCheckIns = charts.length > 0
        ? await localDb.getCheckIns(chartId, 90)
        : [];

      let mantra: string | null = null;
      let todayTheme: string | null = null;

      if (natalChart) {
        try {
          const insight = DailyInsightEngine.generateDailyInsight(natalChart, new Date());
          mantra = insight.mantra ?? null;
          todayTheme = insight.headline ?? null;
        } catch {
          // mantra / theme are optional
        }
      }

      // Run pipeline: normalize → aggregate → derive profile
      const pipelineResult = runPipeline({
        checkIns: allCheckIns,
        journalEntries: recentJournals,
        chart: natalChart,
        todayContext: todayTheme ? { dayKey: today, theme: todayTheme, mantra } : null,
      });

      // Compute insight bundle from pipeline result
      const computed = computeInsightBundleFromPipeline(
        pipelineResult,
        natalChart,
        allCheckIns,
        recentJournals,
        mantra,
        todayTheme,
      );

      // Store in cache (memory + disk)
      await setCachedBundle(cacheKey, computed);

      setChart(natalChart);
      setBundle(computed);
    } catch (e) {
      logger.error('[Insights] Failed to load data:', e);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadData();
    }, [loadData])
  );

  // ─── Loading ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <StarField starCount={25} />
        <Text style={styles.loadingText}>Reading your patterns…</Text>
      </View>
    );
  }

  // ─── Empty / insufficient data ────────────────────────────────────────────

  if (!bundle?.hasEnoughData) {
    const count = bundle?.entryCount ?? 0;
    return (
      <View style={styles.container}>
        <StarField starCount={25} />
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <ScrollView
            contentContainerStyle={[styles.scrollContent, { paddingBottom: 32 }]}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View entering={FadeInDown.delay(80).duration(600)} style={styles.header}>
              <Text style={styles.title}>Insights</Text>
              <Text style={styles.headerSub}>Your mood, journal, and chart — synthesized.</Text>
            </Animated.View>

            {/* Chart themes visible even without check-in data */}
            {bundle?.chartThemes && bundle.chartThemes.length > 0 && (
              <Animated.View entering={FadeInDown.delay(160).duration(600)} style={styles.section}>
                <SectionLabel label="Your Chart Themes" />
                {bundle.chartThemes.map((t, i) => (
                  <ChartThemeBlock key={t.label} card={t} delay={200 + i * 60} />
                ))}
              </Animated.View>
            )}

            <Animated.View entering={FadeInDown.delay(320).duration(600)} style={styles.emptyState}>
              <Ionicons name="sparkles-outline" size={48} color={theme.textMuted} />
              <Text style={styles.emptyTitle}>Your patterns are taking shape</Text>
              <Text style={styles.emptySubtitle}>
                {count === 0
                  ? 'Check in with your mood for at least 3 days and your first insight cards will appear here.'
                  : `You have ${count} check-in${count === 1 ? '' : 's'} so far. Add ${Math.max(0, 3 - count)} more to unlock trend and pattern cards.`}
              </Text>
              <Pressable style={styles.emptyButton} onPress={() => router.push('/(tabs)/mood' as Href)} accessibilityRole="button" accessibilityLabel="Check in now">
                <Text style={styles.emptyButtonText}>Check In Now</Text>
              </Pressable>
            </Animated.View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  const {
    weekSummary, stability, timeOfDay, dayOfWeek,
    tagInsights, journalLinkage, journalThemes, chartThemes, blended,
    todaySupport, confidence: conf, entryCount, windowDays,
    journalFrequency, modality, enhanced, tagAnalytics,
  } = bundle;

  // ─── Full screen ──────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <StarField starCount={25} />
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 32 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View entering={FadeInDown.delay(60).duration(600)} style={styles.header}>
            <Text style={styles.title}>Insights</Text>
            <Text style={styles.headerSub}>
              {entryCount} check-in{entryCount === 1 ? '' : 's'} · {windowDays > 0 ? `${windowDays}-day window` : 'all time'}
              {'  ·  '}<Text style={[styles.confidencePill, { color: confColor(conf) }]}>{confidenceLabel(conf)}</Text>
            </Text>
          </Animated.View>

          {/* ── Section 1: Today's Support ─────────────────────────────── */}
          {todaySupport && (
            <Animated.View entering={FadeInDown.delay(120).duration(600)} style={styles.section}>
              <SectionLabel label="Today's Support" />
              <LinearGradient
                colors={['rgba(201,169,98,0.14)', 'rgba(26,39,64,0.5)']}
                style={[styles.card, styles.featuredCard]}
              >
                <Row icon="sunny-outline" iconColor={theme.primary}>
                  <Text style={styles.cardTitle}>Today's Mantra</Text>
                </Row>
                {todaySupport.theme ? (
                  <Text style={styles.themeText}>{todaySupport.theme}</Text>
                ) : null}
                <Text style={styles.mantraText}>"{todaySupport.mantra}"</Text>
                {todaySupport.trendSentence ? (
                  <Text style={styles.trendSentence}>{todaySupport.trendSentence}</Text>
                ) : null}
                {todaySupport.chartSuggestion ? (
                  <Text style={styles.chartSuggestion}>{todaySupport.chartSuggestion}</Text>
                ) : null}
                <Pressable
                  style={styles.ctaRow}
                  onPress={() => router.push('/(tabs)/journal' as Href)}
                  accessibilityRole="button"
                  accessibilityLabel="Journal from this"
                >
                  <Text style={styles.ctaText}>Journal from this</Text>
                  <Ionicons name="arrow-forward" size={13} color={theme.primary} />
                </Pressable>
              </LinearGradient>
            </Animated.View>
          )}

          {/* ── Section 2: This Week in You ───────────────────────────── */}
          {weekSummary && (
            <Animated.View entering={FadeInDown.delay(180).duration(600)} style={styles.section}>
              <SectionLabel label={`This Week in You · ${weekSummary.periodLabel}`} />

              {/* Metric trio */}
              <LinearGradient colors={['rgba(30,45,71,0.9)', 'rgba(26,39,64,0.6)']} style={styles.card}>
                <Row icon="pulse-outline" iconColor={theme.growth}>
                  <Text style={styles.cardTitle}>Mood, Energy & Stress</Text>
                  <ConfBadge level={conf} />
                </Row>

                <View style={styles.triRow}>
                  <MetricPill
                    label="Mood"
                    value={`${weekSummary.avgMood}/10`}
                    sub={moodLabel(weekSummary.avgMood)}
                    trend={weekSummary.moodTrend}
                    color={theme.love}
                    positiveIsUp
                  />
                  <MetricPill
                    label="Energy"
                    value={energyWord(weekSummary.avgEnergy)}
                    sub={weekSummary.energyTrend.direction === 'stable' ? 'steady' : weekSummary.energyTrend.direction === 'up' ? 'building' : 'lower'}
                    trend={weekSummary.energyTrend}
                    color={theme.energy}
                    positiveIsUp
                  />
                  <MetricPill
                    label="Stress"
                    value={stressWord(weekSummary.avgStress)}
                    sub={stressTrendArrow(weekSummary.stressTrend.direction)}
                    trend={weekSummary.stressTrend}
                    color={theme.warning}
                    positiveIsUp={false}
                  />
                </View>

                {/* Trend detail */}
                <View style={styles.trendDetail}>
                  <TrendLine label="Mood" trend={weekSummary.moodTrend} positiveIsUp />
                  <TrendLine label="Energy" trend={weekSummary.energyTrend} positiveIsUp />
                  <TrendLine label="Stress" trend={weekSummary.stressTrend} positiveIsUp={false} />
                </View>
              </LinearGradient>

              {/* Stability */}
              {isPremium && stability && (
                <LinearGradient
                  colors={['rgba(30,45,71,0.9)', 'rgba(26,39,64,0.6)']}
                  style={[styles.card, { marginTop: theme.spacing.sm }]}
                >
                  <Row icon="analytics-outline" iconColor={theme.growth}>
                    <Text style={styles.cardTitle}>Mood Stability</Text>
                  </Row>
                  <Text style={styles.stabilityLabel}>{stability.label}</Text>
                  <Text style={styles.cardBody}>{stability.description}</Text>
                  <Text style={styles.statLine}>
                    Volatility score: {stability.stddev} · {stability.sampleSize} entries
                  </Text>
                </LinearGradient>
              )}
            </Animated.View>
          )}

          {/* ── Premium Upsell (free users only) ───────────────────── */}
          {!isPremium && (
            <Animated.View entering={FadeInDown.delay(240).duration(600)} style={styles.section}>
              <LinearGradient
                colors={['rgba(201,169,98,0.18)', 'rgba(26,39,64,0.7)']}
                style={[styles.card, { borderColor: 'rgba(201,169,98,0.3)' }]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.md, gap: theme.spacing.sm }}>
                  <Ionicons name="sparkles" size={20} color={theme.primary} />
                  <Text style={[styles.cardTitle, { flex: 1 }]}>Your deeper patterns are ready</Text>
                </View>
                <Text style={styles.cardBody}>
                  Deeper Sky unlocks the insights your data has already revealed:
                </Text>
                {[
                  { icon: 'leaf-outline' as const, text: 'What restores vs drains you' },
                  { icon: 'analytics-outline' as const, text: 'Mood stability & volatility tracking' },
                  { icon: 'time-outline' as const, text: 'Best time of day & day of week' },
                  { icon: 'shield-checkmark-outline' as const, text: 'Tag intelligence & combos' },
                  { icon: 'create-outline' as const, text: 'Journal deep dive & NLP themes' },
                  { icon: 'git-merge-outline' as const, text: 'Chart + mood + journal connections' },
                ].map((item) => (
                  <View key={item.text} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 }}>
                    <Ionicons name={item.icon} size={14} color={theme.primary} />
                    <Text style={{ fontSize: 13, color: theme.textSecondary }}>{item.text}</Text>
                  </View>
                ))}
                <Pressable
                  style={[styles.ctaRow, { borderTopColor: 'rgba(201,169,98,0.2)' }]}
                  onPress={() => router.push('/(tabs)/premium' as Href)}
                  accessibilityRole="button"
                  accessibilityLabel="Unlock Deeper Sky"
                >
                  <Ionicons name="sparkles" size={13} color={theme.primary} />
                  <Text style={[styles.ctaText, { fontWeight: '700' }]}>Unlock with Deeper Sky</Text>
                  <Ionicons name="arrow-forward" size={13} color={theme.primary} />
                </Pressable>
              </LinearGradient>
            </Animated.View>
          )}

          {/* ── Section 3: What Your Data Is Revealing ───────────────── */}
          {isPremium && (tagInsights || timeOfDay || dayOfWeek) && (
            <Animated.View entering={FadeInDown.delay(240).duration(600)} style={styles.section}>
              <SectionLabel label="What Your Data Is Revealing" />

              {/* Tag-based restores / drains */}
              {tagInsights?.hasTagData && (tagInsights.restores.length > 0 || tagInsights.drains.length > 0) && (
                <>
                  {tagInsights.restores.length > 0 && (
                    <LinearGradient colors={['rgba(30,45,71,0.9)', 'rgba(26,39,64,0.6)']} style={styles.card}>
                      <Row icon="leaf-outline" iconColor={theme.energy}>
                        <Text style={styles.cardTitle}>Restores You</Text>
                        <ConfBadge level={tagInsights.confidence} />
                      </Row>
                      {tagInsights.restores.map(t => (
                        <TagLiftRow key={t.tag} item={t} positive />
                      ))}
                    </LinearGradient>
                  )}
                  {tagInsights.drains.length > 0 && (
                    <LinearGradient
                      colors={['rgba(30,45,71,0.9)', 'rgba(26,39,64,0.6)']}
                      style={[styles.card, { marginTop: theme.spacing.sm }]}
                    >
                      <Row icon="thunderstorm-outline" iconColor={theme.stormy}>
                        <Text style={styles.cardTitle}>Drains You</Text>
                      </Row>
                      {tagInsights.drains.map(t => (
                        <TagLiftRow key={t.tag} item={t} positive={false} />
                      ))}
                    </LinearGradient>
                  )}
                </>
              )}

              {/* Fallback when no tags */}
              {tagInsights && !tagInsights.hasTagData && tagInsights.fallbackInsight && (
                <LinearGradient colors={['rgba(30,45,71,0.9)', 'rgba(26,39,64,0.6)']} style={styles.card}>
                  <Row icon="information-circle-outline" iconColor={theme.textMuted}>
                    <Text style={styles.cardTitle}>Energy Patterns</Text>
                  </Row>
                  <Text style={styles.cardBody}>{tagInsights.fallbackInsight}</Text>
                </LinearGradient>
              )}

              {/* Time of day */}
              {timeOfDay && timeOfDay.buckets.length >= 2 && (
                <LinearGradient
                  colors={['rgba(30,45,71,0.9)', 'rgba(26,39,64,0.6)']}
                  style={[styles.card, { marginTop: theme.spacing.sm }]}
                >
                  <Row icon="time-outline" iconColor={theme.growth}>
                    <Text style={styles.cardTitle}>Time of Day</Text>
                  </Row>
                  <Text style={styles.cardBody}>{timeOfDay.insight}</Text>
                  <View style={styles.todBuckets}>
                    {timeOfDay.buckets.map(b => (
                      <TODBucketChip key={b.label} bucket={b} />
                    ))}
                  </View>
                  <Text style={styles.statLine}>{timeOfDay.stat}</Text>
                </LinearGradient>
              )}

              {/* Day of week */}
              {dayOfWeek && (
                <LinearGradient
                  colors={['rgba(30,45,71,0.9)', 'rgba(26,39,64,0.6)']}
                  style={[styles.card, { marginTop: theme.spacing.sm }]}
                >
                  <Row icon="calendar-outline" iconColor={theme.growth}>
                    <Text style={styles.cardTitle}>Day of Week</Text>
                  </Row>
                  <Text style={styles.cardBody}>{dayOfWeek.insight}</Text>
                  {dayOfWeek.highStressDays.length > 0 && (
                    <View style={styles.dayRow}>
                      <Text style={styles.dayLabel}>Higher stress:</Text>
                      <Text style={[styles.dayValue, { color: theme.warning }]}>
                        {dayOfWeek.highStressDays.join(', ')}
                      </Text>
                    </View>
                  )}
                  {dayOfWeek.highMoodDays.length > 0 && (
                    <View style={styles.dayRow}>
                      <Text style={styles.dayLabel}>Higher mood:</Text>
                      <Text style={[styles.dayValue, { color: theme.energy }]}>
                        {dayOfWeek.highMoodDays.join(', ')}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.statLine}>{dayOfWeek.stat}</Text>
                </LinearGradient>
              )}

              {/* Journal linkage */}
              {journalLinkage && (
                <LinearGradient
                  colors={['rgba(30,45,71,0.9)', 'rgba(26,39,64,0.6)']}
                  style={[styles.card, { marginTop: theme.spacing.sm }]}
                >
                  <Row icon="journal-outline" iconColor={theme.growth}>
                    <Text style={styles.cardTitle}>Journal + Mood</Text>
                  </Row>
                  <Text style={styles.cardBody}>{journalLinkage.insight}</Text>
                  <View style={styles.twoColRow}>
                    <View style={styles.twoColItem}>
                      <Text style={styles.twoColNum}>{journalLinkage.moodWithJournal}/10</Text>
                      <Text style={styles.twoColLabel}>Mood w/ journal</Text>
                    </View>
                    <View style={styles.twoColItem}>
                      <Text style={styles.twoColNum}>{journalLinkage.moodWithout}/10</Text>
                      <Text style={styles.twoColLabel}>Mood without</Text>
                    </View>
                    <View style={styles.twoColItem}>
                      <Text style={styles.twoColNum}>{journalLinkage.weeklyFrequency}x</Text>
                      <Text style={styles.twoColLabel}>Per week</Text>
                    </View>
                  </View>
                  <Text style={styles.statLine}>{journalLinkage.stat}</Text>
                </LinearGradient>
              )}

              {/* Journal themes (keyword frequency) */}
              {journalThemes && journalThemes.topWords.length >= 2 && (
                <LinearGradient
                  colors={['rgba(30,45,71,0.9)', 'rgba(26,39,64,0.6)']}
                  style={[styles.card, { marginTop: theme.spacing.sm }]}
                >
                  <Row icon="chatbubble-ellipses-outline" iconColor={theme.growth}>
                    <Text style={styles.cardTitle}>Journal Themes</Text>
                  </Row>
                  <Text style={styles.cardBody}>{journalThemes.insight}</Text>
                  <View style={styles.todBuckets}>
                    {journalThemes.topWords.map(w => (
                      <View key={w} style={styles.todChip}>
                        <Text style={styles.todMood}>{w}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={styles.statLine}>{journalThemes.sampleSize} journal entries analyzed</Text>
                </LinearGradient>
              )}

              {/* Journal frequency impact (weekly comparison) */}
              {journalFrequency && (
                <LinearGradient
                  colors={['rgba(30,45,71,0.9)', 'rgba(26,39,64,0.6)']}
                  style={[styles.card, { marginTop: theme.spacing.sm }]}
                >
                  <Row icon="bar-chart-outline" iconColor={theme.growth}>
                    <Text style={styles.cardTitle}>Journal Frequency</Text>
                    <ConfBadge level={journalFrequency.confidence} />
                  </Row>
                  <Text style={styles.cardBody}>{journalFrequency.insight}</Text>
                  <View style={styles.twoColRow}>
                    <View style={styles.twoColItem}>
                      <Text style={styles.twoColNum}>{journalFrequency.moodHighWeeks}/10</Text>
                      <Text style={styles.twoColLabel}>3+ journal wks</Text>
                    </View>
                    <View style={styles.twoColItem}>
                      <Text style={styles.twoColNum}>{journalFrequency.moodLowWeeks}/10</Text>
                      <Text style={styles.twoColLabel}>{'<3 journal wks'}</Text>
                    </View>
                  </View>
                  <Text style={styles.statLine}>{journalFrequency.stat}</Text>
                </LinearGradient>
              )}
            </Animated.View>
          )}

          {/* ── Section 3.5: Tag Intelligence (V3) ──────────────── */}
          {isPremium && tagAnalytics && tagAnalytics.taggedDays >= 10 && (
            <Animated.View entering={FadeInDown.delay(270).duration(600)} style={styles.section}>
              <SectionLabel label="Tag Intelligence" />

              {/* Classified restorers */}
              {tagAnalytics.classification.restorers.length > 0 && (
                <LinearGradient colors={['rgba(30,45,71,0.9)', 'rgba(26,39,64,0.6)']} style={styles.card}>
                  <Row icon="shield-checkmark-outline" iconColor={theme.energy}>
                    <Text style={styles.cardTitle}>Your Restorers</Text>
                    <ConfBadge level={tagAnalytics.classification.confidence} />
                  </Row>
                  <Text style={styles.cardBody}>
                    Tags that consistently improve your mood and lower stress.
                  </Text>
                  {tagAnalytics.classification.restorers.map(t => (
                    <ClassifiedTagRow key={t.tag} item={t} />
                  ))}
                </LinearGradient>
              )}

              {/* Classified drainers */}
              {tagAnalytics.classification.drainers.length > 0 && (
                <LinearGradient
                  colors={['rgba(30,45,71,0.9)', 'rgba(26,39,64,0.6)']}
                  style={[styles.card, { marginTop: theme.spacing.sm }]}
                >
                  <Row icon="alert-circle-outline" iconColor={theme.stormy}>
                    <Text style={styles.cardTitle}>Your Drainers</Text>
                    <ConfBadge level={tagAnalytics.classification.confidence} />
                  </Row>
                  <Text style={styles.cardBody}>
                    Tags that tend to raise stress or lower mood.
                  </Text>
                  {tagAnalytics.classification.drainers.map(t => (
                    <ClassifiedTagRow key={t.tag} item={t} />
                  ))}
                </LinearGradient>
              )}

              {/* Tag impact on averages */}
              {tagAnalytics.tagImpact.items.length > 0 && (
                <LinearGradient
                  colors={['rgba(30,45,71,0.9)', 'rgba(26,39,64,0.6)']}
                  style={[styles.card, { marginTop: theme.spacing.sm }]}
                >
                  <Row icon="analytics-outline" iconColor={theme.primary}>
                    <Text style={styles.cardTitle}>Tag Impact</Text>
                    <ConfBadge level={tagAnalytics.tagImpact.confidence} />
                  </Row>
                  <Text style={styles.cardBody}>
                    How each tag shifts your averages compared to days without it.
                  </Text>
                  {tagAnalytics.tagImpact.items.slice(0, 5).map(item => (
                    <TagImpactRow key={item.tag} item={item} />
                  ))}
                </LinearGradient>
              )}

              {/* Co-occurrence pairs */}
              {tagAnalytics.tagPairs.hasData && (
                <LinearGradient
                  colors={['rgba(30,45,71,0.9)', 'rgba(26,39,64,0.6)']}
                  style={[styles.card, { marginTop: theme.spacing.sm }]}
                >
                  <Row icon="git-merge-outline" iconColor={theme.primary}>
                    <Text style={styles.cardTitle}>Tag Combos</Text>
                    <ConfBadge level={tagAnalytics.tagPairs.confidence} />
                  </Row>
                  {tagAnalytics.tagPairs.positivePairs.length > 0 && (
                    <>
                      <Text style={[styles.cardBody, { marginBottom: theme.spacing.sm }]}>
                        Combos that lift you up
                      </Text>
                      {tagAnalytics.tagPairs.positivePairs.map(p => (
                        <TagPairRow key={`${p.tagA}-${p.tagB}`} pair={p} positive />
                      ))}
                    </>
                  )}
                  {tagAnalytics.tagPairs.negativePairs.length > 0 && (
                    <>
                      <Text style={[styles.cardBody, { marginTop: theme.spacing.md, marginBottom: theme.spacing.sm }]}>
                        Combos that weigh you down
                      </Text>
                      {tagAnalytics.tagPairs.negativePairs.map(p => (
                        <TagPairRow key={`${p.tagA}-${p.tagB}`} pair={p} positive={false} />
                      ))}
                    </>
                  )}
                </LinearGradient>
              )}

              {/* Tag + journal agreement */}
              {tagAnalytics.journalAgreement.length > 0 && (
                <LinearGradient
                  colors={['rgba(30,45,71,0.9)', 'rgba(26,39,64,0.6)']}
                  style={[styles.card, { marginTop: theme.spacing.sm }]}
                >
                  <Row icon="checkmark-done-outline" iconColor={theme.growth}>
                    <Text style={styles.cardTitle}>Tag + Journal Agreement</Text>
                  </Row>
                  <Text style={styles.cardBody}>
                    When your tags and journal writing align.
                  </Text>
                  {tagAnalytics.journalAgreement.map(a => (
                    <View key={a.tag} style={styles.tagRow}>
                      <Ionicons
                        name={a.supported ? 'checkmark-circle' : 'help-circle-outline'}
                        size={14}
                        color={a.supported ? theme.energy : theme.textMuted}
                        style={styles.tagDot}
                      />
                      <View style={styles.tagContent}>
                        <Text style={styles.tagLabel}>{a.label}</Text>
                        <Text style={styles.tagStat}>{a.insight}</Text>
                      </View>
                    </View>
                  ))}
                </LinearGradient>
              )}

              {/* Tag + chart synergy */}
              {tagAnalytics.chartAgreement.length > 0 && (
                <LinearGradient
                  colors={['rgba(30,45,71,0.9)', 'rgba(26,39,64,0.6)']}
                  style={[styles.card, { marginTop: theme.spacing.sm }]}
                >
                  <Row icon="sparkles-outline" iconColor={theme.primary}>
                    <Text style={styles.cardTitle}>Tags + Your Chart</Text>
                  </Row>
                  {tagAnalytics.chartAgreement.map(c => (
                    <View key={c.tag} style={styles.tagRow}>
                      <Ionicons name="star" size={14} color={theme.primary} style={styles.tagDot} />
                      <View style={styles.tagContent}>
                        <Text style={styles.tagLabel}>{c.label}</Text>
                        <Text style={styles.tagStat}>{c.insight}</Text>
                        <Text style={[styles.statLine, { marginTop: 2 }]}>{c.chartConnection}</Text>
                      </View>
                    </View>
                  ))}
                </LinearGradient>
              )}

              <Text style={styles.statLine}>
                {tagAnalytics.taggedDays} days with tags · {tagAnalytics.uniqueTags} unique tags · {confidenceLabel(tagAnalytics.confidence)}
              </Text>
            </Animated.View>
          )}

          {/* ── Section 4: Journal Deep Dive (V3 Enhanced) ────────── */}
          {isPremium && enhanced && enhanced.journalDays >= 3 && (
            <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.section}>
              <SectionLabel label="Journal Deep Dive" />

              {/* NLP-powered keyword themes */}
              {enhanced.keywordThemes && enhanced.keywordThemes.topKeywords.length >= 2 && (
                <LinearGradient
                  colors={['rgba(30,45,71,0.9)', 'rgba(26,39,64,0.6)']}
                  style={styles.card}
                >
                  <Row icon="text-outline" iconColor={theme.growth}>
                    <Text style={styles.cardTitle}>What You're Writing About</Text>
                    <ConfBadge level={enhanced.confidence} />
                  </Row>
                  <Text style={styles.cardBody}>{enhanced.keywordThemes.insight}</Text>
                  <View style={styles.todBuckets}>
                    {enhanced.keywordThemes.topKeywords.slice(0, 6).map(kw => (
                      <View key={kw.word} style={styles.todChip}>
                        <Text style={styles.todMood}>{kw.word}</Text>
                        <Text style={styles.todCount}>{kw.dayCount} days</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={styles.statLine}>{enhanced.keywordThemes.sampleSize} journal days analyzed</Text>
                </LinearGradient>
              )}

              {/* Emotion tone shift */}
              {enhanced.emotionToneShift && (
                <LinearGradient
                  colors={['rgba(30,45,71,0.9)', 'rgba(26,39,64,0.6)']}
                  style={[styles.card, { marginTop: theme.spacing.sm }]}
                >
                  <Row icon="swap-vertical-outline" iconColor={theme.growth}>
                    <Text style={styles.cardTitle}>Emotional Tone Shift</Text>
                  </Row>
                  <Text style={styles.cardBody}>{enhanced.emotionToneShift.insight}</Text>
                  {enhanced.emotionToneShift.rising.length > 0 && (
                    <View style={styles.dayRow}>
                      <Text style={styles.dayLabel}>Rising:</Text>
                      <Text style={[styles.dayValue, { color: theme.warning }]}>
                        {enhanced.emotionToneShift.rising.map(r => capitalize(r.category)).join(', ')}
                      </Text>
                    </View>
                  )}
                  {enhanced.emotionToneShift.falling.length > 0 && (
                    <View style={styles.dayRow}>
                      <Text style={styles.dayLabel}>Easing:</Text>
                      <Text style={[styles.dayValue, { color: theme.energy }]}>
                        {enhanced.emotionToneShift.falling.map(f => capitalize(f.category)).join(', ')}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.statLine}>{enhanced.emotionToneShift.stat}</Text>
                </LinearGradient>
              )}

              {/* Keyword lift (journal-based restores / drains) */}
              {enhanced.keywordLift.hasData && (
                <>
                  {enhanced.keywordLift.restores.length > 0 && (
                    <LinearGradient
                      colors={['rgba(30,45,71,0.9)', 'rgba(26,39,64,0.6)']}
                      style={[styles.card, { marginTop: theme.spacing.sm }]}
                    >
                      <Row icon="leaf-outline" iconColor={theme.energy}>
                        <Text style={styles.cardTitle}>Keywords on Best Days</Text>
                        <ConfBadge level={enhanced.keywordLift.confidence} />
                      </Row>
                      {enhanced.keywordLift.restores.map(item => (
                        <KeywordLiftRow key={item.label} item={item} positive />
                      ))}
                    </LinearGradient>
                  )}
                  {enhanced.keywordLift.drains.length > 0 && (
                    <LinearGradient
                      colors={['rgba(30,45,71,0.9)', 'rgba(26,39,64,0.6)']}
                      style={[styles.card, { marginTop: theme.spacing.sm }]}
                    >
                      <Row icon="thunderstorm-outline" iconColor={theme.stormy}>
                        <Text style={styles.cardTitle}>Keywords on Hard Days</Text>
                        <ConfBadge level={enhanced.keywordLift.confidence} />
                      </Row>
                      {enhanced.keywordLift.drains.map(item => (
                        <KeywordLiftRow key={item.label} item={item} positive={false} />
                      ))}
                    </LinearGradient>
                  )}
                </>
              )}

              {/* Emotion bucket lift */}
              {enhanced.emotionBucketLift.length > 0 && (
                <LinearGradient
                  colors={['rgba(30,45,71,0.9)', 'rgba(26,39,64,0.6)']}
                  style={[styles.card, { marginTop: theme.spacing.sm }]}
                >
                  <Row icon="heart-half-outline" iconColor={theme.love}>
                    <Text style={styles.cardTitle}>Emotion Patterns</Text>
                  </Row>
                  {enhanced.emotionBucketLift.map(item => (
                    <View key={item.category} style={styles.tagRow}>
                      <Ionicons
                        name={item.lift > 0 ? 'add-circle' : 'remove-circle'}
                        size={14}
                        color={item.lift > 0 ? theme.energy : theme.stormy}
                        style={styles.tagDot}
                      />
                      <View style={styles.tagContent}>
                        <Text style={styles.tagLabel}>{capitalize(item.category)}</Text>
                        <Text style={styles.tagStat}>{item.insight}</Text>
                      </View>
                    </View>
                  ))}
                </LinearGradient>
              )}

              {/* Journal impact cards */}
              {enhanced.journalImpact.map((card, i) => (
                <JournalImpactBlock key={card.type} card={card} marginTop={i === 0 && !enhanced.keywordLift.hasData && enhanced.emotionBucketLift.length === 0} />
              ))}
            </Animated.View>
          )}

          {/* ── Section 5: Your Chart Themes ─────────────────────────── */}
          {(chartThemes.length > 0 || modality || (enhanced && enhanced.chartBaselines.length > 0)) && (
            <Animated.View entering={FadeInDown.delay(360).duration(600)} style={styles.section}>
              <SectionLabel label="Your Chart Themes" />
              {chartThemes.map((t, i) => (
                <ChartThemeBlock key={t.label} card={t} delay={380 + i * 50} />
              ))}

              {/* V3 Chart baselines */}
              {enhanced && enhanced.chartBaselines.map((card) => (
                <LinearGradient
                  key={card.type}
                  colors={['rgba(30,45,71,0.9)', 'rgba(26,39,64,0.6)']}
                  style={[styles.card, { marginTop: theme.spacing.sm }]}
                >
                  <Row icon={chartBaselineIcon(card.type)} iconColor={theme.primary}>
                    <Text style={styles.cardTitle}>{card.label}</Text>
                  </Row>
                  <Text style={styles.cardBody}>{card.body}</Text>
                </LinearGradient>
              ))}

              {modality && (
                <LinearGradient
                  colors={['rgba(30,45,71,0.9)', 'rgba(26,39,64,0.6)']}
                  style={[styles.card, { marginTop: theme.spacing.sm }]}
                >
                  <Row icon="swap-horizontal-outline" iconColor={theme.primary}>
                    <Text style={styles.cardTitle}>{modality.label}</Text>
                  </Row>
                  <Text style={styles.cardBody}>{modality.body}</Text>
                </LinearGradient>
              )}
            </Animated.View>
          )}

          {/* ── Section 6: Where It Connects ─────────────────────────── */}
          {isPremium && ((enhanced && enhanced.blended.length > 0) || blended.length > 0) && (
            <Animated.View entering={FadeInDown.delay(420).duration(600)} style={styles.section}>
              <SectionLabel label="Where It Connects" />
              {/* Prefer V3 blended cards (journal-enhanced) over V2 */}
              {enhanced && enhanced.blended.length > 0 ? (
                enhanced.blended.map((b, i) => (
                  <BlendedV3Block key={i} card={b} onJournal={() => router.push('/(tabs)/journal' as Href)} />
                ))
              ) : (
                blended.map((b, i) => (
                  <BlendedBlock key={i} card={b} onJournal={() => router.push('/(tabs)/journal' as Href)} />
                ))
              )}
            </Animated.View>
          )}

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return <Text style={styles.sectionLabel}>{label}</Text>;
}

function Row({
  icon,
  iconColor,
  children,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={16} color={iconColor} style={styles.rowIcon} />
      {children}
    </View>
  );
}

function ConfBadge({ level }: { level: ConfidenceLevel }) {
  const color = level === 'high' ? theme.energy : level === 'medium' ? theme.primary : theme.textMuted;
  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <Text style={[styles.badgeText, { color }]}>{confidenceLabel(level)}</Text>
    </View>
  );
}

function MetricPill({
  label, value, sub, trend, color, positiveIsUp,
}: {
  label: string; value: string; sub: string;
  trend: TrendResult; color: string; positiveIsUp: boolean;
}) {
  const dir = trend.direction;
  // Determine if the trend is "good"
  const isGood = positiveIsUp ? dir === 'up' : dir === 'down';
  const arrowColor = dir === 'stable' ? theme.textMuted : isGood ? theme.energy : theme.error;
  return (
    <View style={styles.metricPill}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      <Text style={[styles.metricArrow, { color: arrowColor }]}>{trendArrow(dir)}</Text>
      <Text style={styles.metricSub}>{sub}</Text>
    </View>
  );
}

function TrendLine({ label, trend, positiveIsUp }: { label: string; trend: TrendResult; positiveIsUp: boolean }) {
  const dir = trend.direction;
  const isGood = positiveIsUp ? dir === 'up' : dir === 'down';
  const arrowColor = dir === 'stable' ? theme.textMuted : isGood ? theme.energy : theme.error;
  const methodNote = trend.method === 'regression' ? 'slope' : 'avg delta';
  if (dir === 'stable') return null;
  return (
    <View style={styles.trendLineRow}>
      <Text style={styles.trendLineLabel}>{label}</Text>
      <Text style={[styles.trendLineArrow, { color: arrowColor }]}>{trendArrow(dir)}</Text>
      <Text style={styles.trendLineChange}>{trend.displayChange} ({methodNote})</Text>
    </View>
  );
}

function TagLiftRow({ item, positive }: { item: TagLiftItem; positive: boolean }) {
  const freqBestPct = Math.round(item.freqBest * 100);
  const freqHardPct = Math.round(item.freqHard * 100);
  const liftPct = Math.round(Math.abs(item.lift) * 100);
  return (
    <View style={styles.tagRow}>
      <Ionicons
        name={positive ? 'add-circle' : 'remove-circle'}
        size={14}
        color={positive ? theme.energy : theme.stormy}
        style={styles.tagDot}
      />
      <View style={styles.tagContent}>
        <Text style={styles.tagLabel}>{item.label}</Text>
        <Text style={styles.tagStat}>
          {positive
            ? `${freqBestPct}% more on best days vs hard days`
            : `${freqHardPct}% rate on hard days vs ${freqBestPct}% on best`}
          {' · '}{liftPct}% {positive ? 'lift' : 'drag'}
        </Text>
      </View>
    </View>
  );
}

function ClassifiedTagRow({ item }: { item: ClassifiedTag }) {
  const isRestorer = item.classification === 'restorer';
  return (
    <View style={styles.tagRow}>
      <Ionicons
        name={isRestorer ? 'shield-checkmark' : 'alert-circle'}
        size={14}
        color={isRestorer ? theme.energy : theme.stormy}
        style={styles.tagDot}
      />
      <View style={styles.tagContent}>
        <Text style={styles.tagLabel}>{item.label}</Text>
        <Text style={styles.tagStat}>{item.reason}</Text>
        <View style={styles.tagDiffRow}>
          {item.moodDiff !== 0 && (
            <Text style={[styles.tagDiffPill, { color: item.moodDiff > 0 ? theme.energy : theme.stormy }]}>
              {item.moodDiff > 0 ? '+' : ''}{item.moodDiff} mood
            </Text>
          )}
          {item.stressDiff !== 0 && (
            <Text style={[styles.tagDiffPill, { color: item.stressDiff > 0 ? theme.stormy : theme.energy }]}>
              {item.stressDiff > 0 ? '+' : ''}{item.stressDiff} stress
            </Text>
          )}
          {item.energyDiff !== 0 && (
            <Text style={[styles.tagDiffPill, { color: item.energyDiff > 0 ? theme.energy : theme.stormy }]}>
              {item.energyDiff > 0 ? '+' : ''}{item.energyDiff} energy
            </Text>
          )}
          <Text style={styles.tagDiffDays}>{item.totalDays}d</Text>
        </View>
      </View>
    </View>
  );
}

function TagImpactRow({ item }: { item: TagImpactItem }) {
  return (
    <View style={styles.tagRow}>
      <Ionicons
        name="swap-horizontal-outline"
        size={14}
        color={theme.primary}
        style={styles.tagDot}
      />
      <View style={styles.tagContent}>
        <Text style={styles.tagLabel}>{item.label}</Text>
        <Text style={styles.tagStat}>{item.insight}</Text>
        <View style={styles.tagDiffRow}>
          <Text style={[styles.tagDiffPill, { color: item.moodDiff >= 0 ? theme.energy : theme.stormy }]}>
            {item.moodDiff > 0 ? '+' : ''}{item.moodDiff} mood
          </Text>
          <Text style={[styles.tagDiffPill, { color: item.energyDiff >= 0 ? theme.energy : theme.stormy }]}>
            {item.energyDiff > 0 ? '+' : ''}{item.energyDiff} energy
          </Text>
          <Text style={[styles.tagDiffPill, { color: item.stressDiff > 0 ? theme.stormy : theme.energy }]}>
            {item.stressDiff > 0 ? '+' : ''}{item.stressDiff} stress
          </Text>
          <Text style={styles.tagDiffDays}>{item.daysPresent}d</Text>
        </View>
      </View>
    </View>
  );
}

function TagPairRow({ pair, positive }: { pair: TagPairResult; positive: boolean }) {
  return (
    <View style={styles.tagRow}>
      <Ionicons
        name={positive ? 'heart-circle' : 'warning-outline'}
        size={14}
        color={positive ? theme.energy : theme.stormy}
        style={styles.tagDot}
      />
      <View style={styles.tagContent}>
        <Text style={styles.tagLabel}>{pair.labelA} + {pair.labelB}</Text>
        <Text style={styles.tagStat}>{pair.insight}</Text>
        <View style={styles.tagDiffRow}>
          <Text style={[styles.tagDiffPill, { color: pair.moodDiff >= 0 ? theme.energy : theme.stormy }]}>
            {pair.moodDiff > 0 ? '+' : ''}{pair.moodDiff} mood
          </Text>
          <Text style={[styles.tagDiffPill, { color: pair.stressDiff > 0 ? theme.stormy : theme.energy }]}>
            {pair.stressDiff > 0 ? '+' : ''}{pair.stressDiff} stress
          </Text>
          <Text style={styles.tagDiffDays}>{pair.coOccurrDays}d</Text>
        </View>
      </View>
    </View>
  );
}

function TODBucketChip({ bucket }: { bucket: TimeOfDayBucket }) {
  return (
    <View style={styles.todChip}>
      <Text style={styles.todLabel}>{bucket.label}</Text>
      <Text style={styles.todMood}>{bucket.avgMood}/10</Text>
      <Text style={styles.todCount}>{bucket.count} entries</Text>
    </View>
  );
}

function ChartThemeBlock({ card, delay }: { card: ChartThemeCard; delay: number }) {
  const iconMap: Record<ChartThemeCard['source'], keyof typeof Ionicons.glyphMap> = {
    moon: 'moon-outline',
    saturn: 'planet-outline',
    chiron: 'heart-outline',
    element: 'flame-outline',
    house: 'home-outline',
  };
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(500)}>
      <LinearGradient
        colors={['rgba(30,45,71,0.9)', 'rgba(26,39,64,0.6)']}
        style={[styles.card, { marginBottom: theme.spacing.sm }]}
      >
        <Row icon={iconMap[card.source]} iconColor={theme.primary}>
          <Text style={styles.cardTitle}>{card.label}</Text>
        </Row>
        <Text style={styles.cardBody}>{card.body}</Text>
      </LinearGradient>
    </Animated.View>
  );
}

function BlendedBlock({ card, onJournal }: { card: BlendedCard; onJournal: () => void }) {
  return (
    <LinearGradient
      colors={['rgba(30,45,71,0.9)', 'rgba(26,39,64,0.6)']}
      style={[styles.card, { marginBottom: theme.spacing.sm }]}
    >
      <Row icon="git-merge-outline" iconColor={theme.growth}>
        <Text style={styles.cardTitle}>{card.title}</Text>
        <ConfBadge level={card.confidence} />
      </Row>
      <Text style={styles.cardBody}>{card.body}</Text>
      <Text style={styles.statLine}>{card.stat}</Text>
      <Pressable style={styles.ctaRow} onPress={onJournal} accessibilityRole="button" accessibilityLabel={card.journalPrompt}>
        <Ionicons name="pencil-outline" size={12} color={theme.primary} />
        <Text style={styles.ctaText}>{card.journalPrompt}</Text>
        <Ionicons name="arrow-forward" size={12} color={theme.primary} />
      </Pressable>
    </LinearGradient>
  );
}

function BlendedV3Block({ card, onJournal }: { card: BlendedInsightCard; onJournal: () => void }) {
  return (
    <LinearGradient
      colors={['rgba(201,169,98,0.10)', 'rgba(26,39,64,0.6)']}
      style={[styles.card, { marginBottom: theme.spacing.sm, borderColor: 'rgba(201,169,98,0.18)' }]}
    >
      <Row icon="git-merge-outline" iconColor={theme.primary}>
        <Text style={styles.cardTitle}>{card.title}</Text>
        <ConfBadge level={card.confidence} />
      </Row>
      <Text style={styles.cardBody}>{card.body}</Text>
      <Text style={styles.statLine}>{card.stat}</Text>
      {card.sources.length > 0 && (
        <View style={styles.sourceRow}>
          {card.sources.map(s => (
            <View key={s} style={styles.sourceChip}>
              <Text style={styles.sourceText}>{formatSource(s)}</Text>
            </View>
          ))}
        </View>
      )}
      <Pressable style={styles.ctaRow} onPress={onJournal} accessibilityRole="button" accessibilityLabel={card.journalPrompt}>
        <Ionicons name="pencil-outline" size={12} color={theme.primary} />
        <Text style={styles.ctaText}>{card.journalPrompt}</Text>
        <Ionicons name="arrow-forward" size={12} color={theme.primary} />
      </Pressable>
    </LinearGradient>
  );
}

function KeywordLiftRow({ item, positive }: { item: LiftItem; positive: boolean }) {
  const bestPct = Math.round(item.bestRate * 100);
  const hardPct = Math.round(item.hardRate * 100);
  const liftPct = Math.round(Math.abs(item.lift) * 100);
  return (
    <View style={styles.tagRow}>
      <Ionicons
        name={positive ? 'add-circle' : 'remove-circle'}
        size={14}
        color={positive ? theme.energy : theme.stormy}
        style={styles.tagDot}
      />
      <View style={styles.tagContent}>
        <Text style={styles.tagLabel}>{item.label}</Text>
        <Text style={styles.tagStat}>
          {positive
            ? `${bestPct}% of best days vs ${hardPct}% of hard days`
            : `${hardPct}% of hard days vs ${bestPct}% of best days`}
          {' · '}{liftPct}% {positive ? 'lift' : 'drag'}
        </Text>
      </View>
    </View>
  );
}

function JournalImpactBlock({ card, marginTop }: { card: JournalImpactCard; marginTop?: boolean }) {
  const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
    journaling_vs_not: 'create-outline',
    writing_intensity: 'document-text-outline',
    weekly_consistency: 'checkmark-done-outline',
  };
  const titleMap: Record<string, string> = {
    journaling_vs_not: 'Journaling Days vs Not',
    writing_intensity: 'Writing Depth Effect',
    weekly_consistency: 'Weekly Consistency',
  };
  return (
    <LinearGradient
      colors={['rgba(30,45,71,0.9)', 'rgba(26,39,64,0.6)']}
      style={[styles.card, { marginTop: marginTop ? 0 : theme.spacing.sm }]}
    >
      <Row icon={iconMap[card.type] ?? 'journal-outline'} iconColor={theme.growth}>
        <Text style={styles.cardTitle}>{titleMap[card.type] ?? card.type}</Text>
        <ConfBadge level={card.confidence} />
      </Row>
      <Text style={styles.cardBody}>{card.insight}</Text>
      <Text style={styles.statLine}>{card.stat}</Text>
    </LinearGradient>
  );
}

function chartBaselineIcon(type: string): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'regulation_style': return 'shield-outline';
    case 'emotional_need': return 'moon-outline';
    case 'pressure_pattern': return 'planet-outline';
    case 'healing_theme': return 'heart-outline';
    default: return 'sparkles-outline';
  }
}

function formatSource(source: string): string {
  return source
    .replace(/_/g, ' ')
    .replace(/^journal /, '📝 ')
    .replace(/^mood /, '🎯 ')
    .replace(/^stress /, '⚡ ')
    .replace(/^chart /, '✨ ');
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function confColor(level: ConfidenceLevel): string {
  return level === 'high' ? theme.energy : level === 'medium' ? theme.primary : theme.textMuted;
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  safeArea: { flex: 1 },
  loadingText: { color: theme.textSecondary, fontStyle: 'italic' },

  scrollContent: { paddingHorizontal: theme.spacing.lg },

  header: { marginTop: theme.spacing.lg, marginBottom: theme.spacing.xl },
  title: {
    fontSize: 32, fontWeight: '700', color: theme.textPrimary,
    fontFamily: 'serif', letterSpacing: 0.5, marginBottom: 6,
  },
  headerSub: { fontSize: 12, color: theme.textMuted, lineHeight: 18 },
  confidencePill: { fontSize: 12, fontWeight: '600' },

  section: { marginBottom: theme.spacing.lg },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: theme.textMuted,
    textTransform: 'uppercase', letterSpacing: 1.5,
    marginBottom: theme.spacing.sm,
  },

  card: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 0,
  },
  featuredCard: { borderColor: 'rgba(201,169,98,0.28)' },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  rowIcon: { flexShrink: 0 },

  cardTitle: {
    flex: 1, fontSize: 15, fontWeight: '600',
    color: theme.textPrimary, fontFamily: 'serif',
  },
  cardBody: { fontSize: 14, color: theme.textSecondary, lineHeight: 21 },
  statLine: { fontSize: 11, color: theme.textMuted, marginTop: theme.spacing.sm },

  // Today's support
  themeText: {
    fontSize: 13, color: theme.textSecondary, lineHeight: 20,
    marginBottom: theme.spacing.xs,
  },
  mantraText: {
    fontSize: 16, color: theme.textPrimary, fontStyle: 'italic',
    lineHeight: 25, marginBottom: theme.spacing.sm,
  },
  trendSentence: {
    fontSize: 13, color: theme.textSecondary, lineHeight: 20,
    marginBottom: theme.spacing.xs,
  },
  chartSuggestion: {
    fontSize: 13, color: theme.textMuted, lineHeight: 19,
    fontStyle: 'italic', marginBottom: theme.spacing.sm,
  },

  ctaRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: theme.spacing.sm, paddingTop: theme.spacing.sm,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
  },
  ctaText: { flex: 1, fontSize: 12, color: theme.primary, fontWeight: '600' },

  // Metric trio
  triRow: {
    flexDirection: 'row', gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  metricPill: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: theme.borderRadius.md, padding: theme.spacing.md,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10, color: theme.textMuted,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3,
  },
  metricValue: { fontSize: 14, fontWeight: '700' },
  metricArrow: { fontSize: 14, fontWeight: '700', marginTop: 1 },
  metricSub: { fontSize: 10, color: theme.textMuted, marginTop: 3, textAlign: 'center' },

  // Trend detail
  trendDetail: { gap: 3 },
  trendLineRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  trendLineLabel: { fontSize: 11, color: theme.textMuted, width: 46 },
  trendLineArrow: { fontSize: 12, fontWeight: '700' },
  trendLineChange: { fontSize: 11, color: theme.textMuted },

  // Stability
  stabilityLabel: {
    fontSize: 16, fontWeight: '600', color: theme.textPrimary,
    marginBottom: theme.spacing.xs,
  },

  // Badge
  badge: {
    borderWidth: 1, borderRadius: theme.borderRadius.full,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  badgeText: { fontSize: 10, fontWeight: '600' },

  // Tag lift rows
  tagRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingVertical: 5, gap: theme.spacing.sm,
  },
  tagDot: { marginTop: 1 },
  tagContent: { flex: 1 },
  tagLabel: { fontSize: 14, color: theme.textPrimary, fontWeight: '500' },
  tagStat: { fontSize: 11, color: theme.textMuted, marginTop: 1 },
  tagDiffRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 3,
  },
  tagDiffPill: { fontSize: 11, fontWeight: '600' },
  tagDiffDays: { fontSize: 10, color: theme.textMuted },

  // Time of day buckets
  todBuckets: {
    flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm,
    marginVertical: theme.spacing.sm,
  },
  todChip: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm,
    alignItems: 'center', minWidth: 70,
  },
  todLabel: { fontSize: 11, color: theme.textMuted, marginBottom: 2 },
  todMood: { fontSize: 14, fontWeight: '700', color: theme.textPrimary },
  todCount: { fontSize: 10, color: theme.textMuted },

  // Day of week
  dayRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: theme.spacing.xs,
  },
  dayLabel: { fontSize: 12, color: theme.textMuted },
  dayValue: { fontSize: 12, fontWeight: '600' },

  // Two-column stat
  twoColRow: {
    flexDirection: 'row', gap: theme.spacing.sm,
    marginTop: theme.spacing.md, marginBottom: theme.spacing.xs,
  },
  twoColItem: { flex: 1, alignItems: 'center' },
  twoColNum: { fontSize: 16, fontWeight: '700', color: theme.textPrimary },
  twoColLabel: { fontSize: 10, color: theme.textMuted, textAlign: 'center', marginTop: 2 },

  // Source chips (V3 blended cards)
  sourceRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 5,
    marginTop: theme.spacing.sm,
  },
  sourceChip: {
    backgroundColor: 'rgba(201,169,98,0.12)',
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  sourceText: { fontSize: 9, color: theme.textMuted },

  // Empty state
  emptyState: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 60, gap: 12,
  },
  emptyTitle: {
    fontSize: 20, fontWeight: '600', color: theme.textPrimary,
    marginTop: 8, textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14, color: theme.textSecondary, textAlign: 'center',
    lineHeight: 22, maxWidth: 280,
  },
  emptyButton: {
    marginTop: 12, backgroundColor: theme.primary,
    paddingHorizontal: 28, paddingVertical: 12,
    borderRadius: theme.borderRadius.full,
  },
  emptyButtonText: { color: theme.background, fontWeight: '600', fontSize: 15 },
});
