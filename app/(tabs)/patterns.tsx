// File: app/(tabs)/patterns.tsx
// MySky — Patterns Hub
//
// High-End "Lunar Sky" & "Midnight Slate" Aesthetic Update:
// 1. Purged "Muddy Gold" background gradients; implemented Midnight Slate Anchors.
// 2. Implemented Smoked Glass architecture (Atmosphere, Nebula, Sage) for insight cards.
// 3. Integrated "Velvet Glass" 1px directional light-catch borders globally.
// 4. Enhanced Typography: Pure White data hero numbers and crisp Metallic Gold headers.

import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, Dimensions, ActivityIndicator, Modal, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from '../../components/ui/SkiaGradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/core';
import * as Haptics from 'expo-haptics';

import { SkiaDynamicCosmos } from '../../components/ui/SkiaDynamicCosmos';
import { supabaseDb } from '../../services/storage/supabaseDb';
import { runPipeline } from '../../services/insights/pipeline';
import { type DailyAggregate } from '../../services/insights/types';
import { computeNarrativeInsights, NarrativeInsightBundle } from '../../utils/narrativeInsights';
import { buildPersonalProfile } from '../../utils/personalProfile';
import { computeDeepInsights, DeepInsightBundle } from '../../utils/deepInsights';
import { buildPatternFeedInsights } from '../../utils/patternFeed';
import { PatternOrbitMap } from '../../components/ui/PatternOrbitMap';
import { DailyCheckIn } from '../../services/patterns/types';
import { GoldSubtitle } from '../../components/ui/GoldSubtitle';
import { MetallicIcon } from '../../components/ui/MetallicIcon';
import { MetallicText } from '../../components/ui/MetallicText';
import { VelvetGlassSurface } from '../../components/ui/VelvetGlassSurface';
import { loadSelfKnowledgeContext } from '../../services/insights/selfKnowledgeContext';
import { enhancePatternInsights } from '../../services/insights/geminiInsightsService';
import { buildPatternLibraryState, refineCrossRefCopy } from '../../utils/patternsHelpers';
import {
  computeSelfKnowledgeCrossRef,
  CrossRefInsight,
} from '../../utils/selfKnowledgeCrossRef';
import { type AppTheme } from '../../constants/theme';
import { useAppTheme, useThemedStyles } from '../../context/ThemeContext';
import { toLocalDateString } from '../../utils/dateUtils';
import { normalizeDisplayText } from '../../utils/textLayout';
import { getPersonalizedPremiumTeaser, type ArchiveDepthCounts } from '../../utils/archiveDepth';
import { trackGrowthEvent } from '../../services/growth/localAnalytics';
import { usePremium } from '../../context/PremiumContext';
import { useRouter, Href } from 'expo-router';
import { logger } from '../../utils/logger';

const SCREEN_W = Dimensions.get('window').width;
const ORBIT_SIZE = SCREEN_W - 48;

// ─── Semantic Palette ─────────────────────────────────────────────────────────
const PALETTE = {
  gold: '#D4AF37',       // Metallic hardware elements
  atmosphere: '#A2C2E1', // Icy Blue for dashboard glass
  slateMid: '#2C3645',   // Anchor Slate Top
  slateDeep: '#1A1E29',  // Anchor Slate Bottom
  nebula: '#A88BEB',     // Dreams/Subconscious
  sage: '#6B9080',       // Growth/Somatic
  ember: '#DC5050',      // Stress/Tension
  bg: '#0A0A0F',
};

const WRAP_AT_WORD_PROPS = {
  android_hyphenationFrequency: 'none' as const,
  lineBreakStrategyIOS: 'none' as const,
  textBreakStrategy: 'simple' as const,
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function PatternsScreen() {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { isPremium } = usePremium();
  const router = useRouter();
  const [snapshot, setSnapshot] = useState({ avgMood: 0, avgStress: 0, checkInCount: 0 });
  const [archiveDepthCounts, setArchiveDepthCounts] = useState<ArchiveDepthCounts>({});
  const [trendCheckIns, setTrendCheckIns] = useState<DailyCheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [orbitLoading, setOrbitLoading] = useState(true);
  const [crossRefs, setCrossRefs] = useState<CrossRefInsight[]>([]);
  const [dailyAggregates, setDailyAggregates] = useState<DailyAggregate[]>([]);
  const [, setNarrative] = useState<NarrativeInsightBundle | null>(null);
  const [deepInsights, setDeepInsights] = useState<DeepInsightBundle | null>(null);
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [showDeepDiveModal, setShowDeepDiveModal] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      setOrbitLoading(true);
      setLoadError(false);
      trackGrowthEvent('analytics_screen_viewed', { screen: 'patterns' }).catch(() => {});
      (async () => {
        try {
          const charts = await supabaseDb.getCharts();
          if (!charts?.length) {
            if (!active) return;
            setTrendCheckIns([]);
            setSnapshot({ avgMood: 0, avgStress: 0, checkInCount: 0 });
            setArchiveDepthCounts({});
            setLastUpdated(null);
            setCrossRefs([]);
            setDailyAggregates([]);
            setDeepInsights(null);
            setOrbitLoading(false);
            return;
          }
          const chartId = charts[0].id;
          const today = toLocalDateString();
          const ninetyDaysAgo = toLocalDateString(
            new Date(new Date(`${today}T12:00:00`).getTime() - 89 * 86_400_000),
          );
          const [checkIns, sleepEntries, journalEntries] = await Promise.all([
            supabaseDb.getCheckInsInRange(chartId, ninetyDaysAgo, today),
            supabaseDb.getSleepEntriesInRange(chartId, ninetyDaysAgo, today),
            supabaseDb.getJournalEntries(),
          ]);
          if (!active) return;
          const recentJournalEntries = journalEntries.filter((entry) => {
            return entry.date >= ninetyDaysAgo && entry.date <= today;
          });
          
          const moods = checkIns.map(c => c.moodScore).filter(v => v != null) as number[];
          const avgMood = moods.length ? moods.reduce((a, b) => a + b, 0) / moods.length : 0;
          const stressValues = checkIns.map((checkIn) => {
            if (checkIn.stressLevel === 'high') return 8;
            if (checkIn.stressLevel === 'low') return 2;
            return 5;
          });
          const avgStress = stressValues.length
            ? stressValues.reduce((sum, value) => sum + value, 0) / stressValues.length
            : 0;

          if (!active) return;
          setTrendCheckIns(checkIns);
          setSnapshot({ avgMood, avgStress, checkInCount: checkIns.length });
          setArchiveDepthCounts({
            checkIns: checkIns.length,
            journalEntries: recentJournalEntries.length,
            dreamEntries: sleepEntries.filter((entry) => !!entry.dreamText?.trim()).length,
          });
          setLastUpdated(new Date().toISOString());
          setOrbitLoading(false);

          const skContext = await loadSelfKnowledgeContext();
          if (!active) return;
          const refs = computeSelfKnowledgeCrossRef(skContext, checkIns);
          const enhancedRefs = await enhancePatternInsights(refs, skContext, checkIns, isPremium);
          if (!active) return;
          const aiBodies = new Map(enhancedRefs?.insights.map((insight) => [insight.id, insight.body]) ?? []);
          setCrossRefs(
            refs.map((insight) =>
              aiBodies.has(insight.id)
                ? {
                    ...insight,
                    body: aiBodies.get(insight.id) ?? insight.body,
                  }
                : insight,
            ),
          );

          const pipelineResult = runPipeline({
            checkIns,
            journalEntries: recentJournalEntries,
            sleepEntries,
            chart: null,
            todayContext: null,
          });
          if (!active) return;
          setDailyAggregates(pipelineResult.dailyAggregates);
          setNarrative(computeNarrativeInsights(pipelineResult.dailyAggregates));
          setDeepInsights(computeDeepInsights(buildPersonalProfile(pipelineResult.dailyAggregates)));

        } catch (e) {
          logger.error('[Patterns] Pipeline error:', e);
          if (active) setLoadError(true);
        } finally {
          if (active) setLoading(false);
        }
      })();
      return () => { active = false; };
    }, [isPremium])
  );

  const libraryState = useMemo(() => buildPatternLibraryState(dailyAggregates, crossRefs), [crossRefs, dailyAggregates]);
  const feedInsights = useMemo(() => {
    const profileInsights = buildPatternFeedInsights(deepInsights);
    return [...profileInsights, ...crossRefs];
  }, [crossRefs, deepInsights]);

  // Rotate through all surfaced insights daily so the feed keeps evolving with the archive.
  const todayIndex = useMemo(() => {
    // Calculate the number of days since the Unix epoch in the local timezone.
    // This provides a guaranteed sequential increment each local day, whereas 
    // hashing the date string caused unpredictable jumps during date rollovers.
    const localEpochDay = Math.floor((Date.now() - new Date().getTimezoneOffset() * 60_000) / 86_400_000);
    return feedInsights.length > 0 ? localEpochDay % feedInsights.length : 0;
  }, [feedInsights.length]);

  const leadInsight = useMemo(
    () => (feedInsights.length > 0 ? refineCrossRefCopy(feedInsights[todayIndex]) : null),
    [feedInsights, todayIndex],
  );
  const deepDiveInsights = useMemo(() => {
    if (feedInsights.length <= 1) return [];
    const rotated = [...feedInsights.slice(todayIndex), ...feedInsights.slice(0, todayIndex)];
    return rotated
      .slice(1)
      .map(refineCrossRefCopy)
      .slice(0, 2);
  }, [feedInsights, todayIndex]);
  const patternRows = useMemo(() => (leadInsight ? [leadInsight] : []), [leadInsight]);
  const premiumTeaser = useMemo(
    () => getPersonalizedPremiumTeaser(archiveDepthCounts, {
      detectedPatterns: feedInsights.length,
      surface: 'patterns',
    }),
    [archiveDepthCounts, feedInsights.length],
  );

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={[styles.glowOrb, { top: -60, right: -60, backgroundColor: 'rgba(162, 194, 225, 0.12)' }]} />
        <View style={[styles.glowOrb, { bottom: 160, left: -120, backgroundColor: 'rgba(44, 54, 69, 0.08)' }]} />
      </View>

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <FlatList<CrossRefInsight>
          data={patternRows}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <>
              <VelvetGlassSurface style={styles.insightCard} intensity={25}>
                <LinearGradient colors={['rgba(162, 194, 225, 0.20)', 'rgba(162, 194, 225, 0.05)']} style={StyleSheet.absoluteFill} />
                <View style={styles.cardHeader}>
                  <MetallicText style={styles.cardLabel} variant="gold">THIS WEEK'S PATTERN</MetallicText>
                  <View style={styles.confirmedBadge}>
                    <Text {...WRAP_AT_WORD_PROPS} style={styles.confirmedText}>{item.isConfirmed ? 'SEEN REPEATEDLY' : 'EARLY SIGNAL'}</Text>
                  </View>
                </View>
                <Text {...WRAP_AT_WORD_PROPS} style={styles.patternTitle}>{normalizeDisplayText(item.title)}</Text>
                <Text {...WRAP_AT_WORD_PROPS} style={styles.insightBody}>{normalizeDisplayText(item.body)}</Text>
                {item.heroMetrics && item.heroMetrics.length > 0 && (
                  <View style={styles.heroMetricsRow}>
                    {item.heroMetrics.map((m) => (
                      <View key={m.label} style={styles.heroMetricChip}>
                        <Text {...WRAP_AT_WORD_PROPS} style={styles.heroMetricValue}>{m.value}</Text>
                        <Text {...WRAP_AT_WORD_PROPS} style={styles.heroMetricLabel}>{m.label}</Text>
                      </View>
                    ))}
                  </View>
                )}
                {item.takeaway && (
                  <GlassTakeaway label={item.takeaway.label} body={item.takeaway.body} icon="compass-outline" />
                )}
                {feedInsights.length > 1 && (
                  <Text style={styles.rotationHint}>
                    Insight {todayIndex + 1} of {feedInsights.length} · refreshes daily
                  </Text>
                )}
              </VelvetGlassSurface>

              {/* Premium: Full Analysis CTA */}
              {isPremium ? (
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setShowDeepDiveModal(true);
                  }}
                    style={styles.deepDiveButton}
                    accessibilityRole="button"
                    accessibilityLabel="See what MySky has noticed"
                >
                  <LinearGradient colors={['rgba(168,139,235,0.25)', 'rgba(168,139,235,0.08)']} style={StyleSheet.absoluteFill} />
                  <View style={{ alignItems: 'center', flex: 1 }}>
                    <MetallicText style={[styles.deepDiveButtonTitle, { textAlign: 'center' }]} variant="gold">Open Weekly Deep Dive</MetallicText>
                    <Text {...WRAP_AT_WORD_PROPS} style={[styles.deepDiveButtonSub, { textAlign: 'center' }]}>{normalizeDisplayText(`${deepDiveInsights.length} deep reads currently in focus`)}</Text>
                  </View>
                </Pressable>
              ) : (
                <Pressable
                  onPress={() => router.push('/(tabs)/premium' as Href)}
                  style={styles.deepDiveButton}
                  accessibilityRole="button"
                  accessibilityLabel="Unlock full pattern analysis"
                >
                  <LinearGradient colors={['rgba(44,54,69,0.85)', 'rgba(26,30,41,0.40)']} style={StyleSheet.absoluteFill} />
                  <MetallicIcon name="lock-closed-outline" size={16} variant="gold" />
                  <View style={{ flex: 1 }}>
                    <MetallicText style={styles.deepDiveButtonTitle} variant="gold">{premiumTeaser.cta}</MetallicText>
                    <Text {...WRAP_AT_WORD_PROPS} style={styles.deepDiveButtonSub}>{normalizeDisplayText(premiumTeaser.title)}</Text>
                  </View>
                  <MetallicIcon name="arrow-forward-outline" size={14} variant="gold" />
                </Pressable>
              )}
            </>
          )}
          ListHeaderComponent={(
            <>
              <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
                <Text style={styles.title}>Patterns</Text>
                <GoldSubtitle style={styles.subtitle}>Recognition over time, grounded in your real archive</GoldSubtitle>
                <Text style={styles.freshnessText}>
                  {lastUpdated
                    ? `Last updated ${new Date(lastUpdated).toLocaleDateString()} from your recent entries`
                    : 'Last updated when recent entries are available'}
                </Text>
              </Animated.View>

              <View style={styles.snapshotRow}>
                <MetricCard label="Mood" value={snapshot.avgMood.toFixed(1)} wash={['rgba(44, 54, 69, 0.85)', 'rgba(26, 30, 41, 0.40)']} />
                <MetricCard label="Stress" value={snapshot.avgStress.toFixed(1)} wash={['rgba(44, 54, 69, 0.85)', 'rgba(26, 30, 41, 0.40)']} />
                <MetricCard label="Logged" value={snapshot.checkInCount.toString()} wash={['rgba(44, 54, 69, 0.85)', 'rgba(26, 30, 41, 0.40)']} />
              </View>

              <View style={[styles.orbitCard, theme.velvetBorder]}>
                <LinearGradient colors={['rgba(162, 194, 225, 0.20)', 'rgba(162, 194, 225, 0.05)']} style={StyleSheet.absoluteFill} />
                <View style={styles.orbitCardHeader}>
                  <MetallicIcon name="planet-outline" size={14} variant="gold" />
                  <MetallicText style={styles.orbitCardEyebrow} variant="gold">PATTERN ORBIT MAP</MetallicText>
                </View>
                {orbitLoading ? <ActivityIndicator size="large" color={PALETTE.gold} /> : <PatternOrbitMap checkIns={trendCheckIns} size={ORBIT_SIZE} />}
              </View>

              <SectionHeader label="THIS WEEK'S PATTERN" icon="radio-outline" />
              {!isPremium && !loading && snapshot.checkInCount >= 5 && (
                <Pressable onPress={() => router.push('/(tabs)/premium' as Href)}>
                  <VelvetGlassSurface style={styles.insightCard} intensity={25}>
                    <LinearGradient colors={['rgba(168, 139, 235, 0.20)', 'rgba(168, 139, 235, 0.05)']} style={StyleSheet.absoluteFill} />
                    {/* Blurred glimpse layer — shows the shape of real content */}
                    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                      <View style={styles.blurredInsightPreview}>
                        <View style={styles.blurredInsightLine} />
                        <View style={[styles.blurredInsightLine, { width: '75%', opacity: 0.5 }]} />
                        <View style={[styles.blurredInsightLine, { width: '88%', opacity: 0.4 }]} />
                        <View style={[styles.blurredInsightLine, { width: '60%', opacity: 0.3 }]} />
                      </View>
                      <BlurView intensity={18} tint="dark" style={StyleSheet.absoluteFill} />
                    </View>
                    <View style={styles.cardHeader}>
                      <MetallicText style={styles.cardLabel} variant="gold">PATTERNS DETECTED</MetallicText>
                      <View style={styles.lockedBadge}><MetallicIcon name="lock-closed-outline" size={10} variant="gold" /><Text style={styles.lockedText}>PREMIUM</Text></View>
                    </View>
                    <Text {...WRAP_AT_WORD_PROPS} style={styles.patternTitle}>{normalizeDisplayText(premiumTeaser.title)}</Text>
                    <Text {...WRAP_AT_WORD_PROPS} style={styles.insightBody}>
                      {normalizeDisplayText(premiumTeaser.body)}
                    </Text>
                  </VelvetGlassSurface>
                </Pressable>
              )}
              {!isPremium && !loading && snapshot.checkInCount >= 3 && snapshot.checkInCount < 5 && (
                <VelvetGlassSurface style={styles.insightCard} intensity={25}>
                  <LinearGradient colors={['rgba(107, 144, 128, 0.15)', 'rgba(107, 144, 128, 0.05)']} style={StyleSheet.absoluteFill} />
                  <View style={styles.cardHeader}>
                    <MetallicText style={styles.cardLabel} variant="gold">BUILDING YOUR ARCHIVE</MetallicText>
                  </View>
                  <Text {...WRAP_AT_WORD_PROPS} style={styles.patternTitle}>{normalizeDisplayText(`${5 - snapshot.checkInCount} more check-ins until your first pattern insight`)}</Text>
                  <Text {...WRAP_AT_WORD_PROPS} style={styles.insightBody}>
                    Keep logging — once you have 5 check-ins, Deeper Sky can start naming what keeps repeating instead of stopping at a recap of the week.
                  </Text>
                </VelvetGlassSurface>
              )}
              {!loading && loadError ? (
                <VelvetGlassSurface style={styles.emptyCard} intensity={25}>
                  <LinearGradient colors={['rgba(162, 194, 225, 0.20)', 'rgba(162, 194, 225, 0.05)']} style={StyleSheet.absoluteFill} />
                  <Text {...WRAP_AT_WORD_PROPS} style={styles.emptyTitle}>Couldn't load patterns right now</Text>
                  <Text {...WRAP_AT_WORD_PROPS} style={styles.emptyBody}>Something went wrong while analyzing your data. Try again in a moment.</Text>
                </VelvetGlassSurface>
              ) : !loading && patternRows.length === 0 ? (
                <VelvetGlassSurface style={styles.emptyCard} intensity={25}>
                  <LinearGradient colors={['rgba(162, 194, 225, 0.20)', 'rgba(162, 194, 225, 0.05)']} style={StyleSheet.absoluteFill} />
                  <Text {...WRAP_AT_WORD_PROPS} style={styles.emptyTitle}>Your archive is not readable yet</Text>
                  <Text {...WRAP_AT_WORD_PROPS} style={styles.emptyBody}>MySky should not invent a pattern before it has earned one. This space gets stronger as these signals overlap:</Text>
                  <View style={{ marginTop: 16, gap: 10 }}>
                    <Text {...WRAP_AT_WORD_PROPS} style={styles.emptyBody}>{'\u2022'} Check in with your mood, energy, and stress daily</Text>
                    <Text {...WRAP_AT_WORD_PROPS} style={styles.emptyBody}>{'\u2022'} Log sleep duration and dream notes</Text>
                    <Text {...WRAP_AT_WORD_PROPS} style={styles.emptyBody}>{'\u2022'} Write a journal entry when something feels important</Text>
                  </View>
                  <Text {...WRAP_AT_WORD_PROPS} style={[styles.emptyBody, { marginTop: 16, fontStyle: 'italic' }]}>3-5 days of check-ins usually gives MySky enough repetition to surface a first real read.</Text>
                </VelvetGlassSurface>
              ) : null}
            </>
          )}
          ListFooterComponent={(
            <Pressable
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                trackGrowthEvent('pattern_library_opened').catch(() => {});
                setShowLibraryModal(true);
              }}
              style={styles.libraryButton}
              accessibilityRole="button"
              accessibilityLabel="View pattern library"
            >
              <LinearGradient colors={['rgba(44, 54, 69, 0.85)', 'rgba(26, 30, 41, 0.40)']} style={StyleSheet.absoluteFill} />
              <MetallicIcon name="library-outline" size={16} variant="gold" />
              <MetallicText style={styles.libraryButtonText} variant="gold">Open Pattern Library</MetallicText>
            </Pressable>
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          initialNumToRender={3}
          maxToRenderPerBatch={4}
          windowSize={5}
          removeClippedSubviews
        />
      </SafeAreaView>

      <Modal
        animationType="slide"
        transparent
        visible={showDeepDiveModal}
        onRequestClose={() => setShowDeepDiveModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <BlurView intensity={30} tint={theme.blurTint} style={StyleSheet.absoluteFill} />
          <VelvetGlassSurface style={[styles.deepDiveModalCard, styles.modalCard]} intensity={35}>
            <LinearGradient colors={['rgba(44, 54, 69, 0.92)', 'rgba(26, 30, 41, 0.72)']} style={StyleSheet.absoluteFill} />
            <View style={styles.modalHeader}>
              <MetallicText style={styles.modalTitle} variant="gold">Weekly Deep Dive</MetallicText>
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setShowDeepDiveModal(false);
                }}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <MetallicIcon name="close-outline" size={18} variant="gold" />
              </Pressable>
            </View>
            <Text {...WRAP_AT_WORD_PROPS} style={styles.modalIntro}>
              Two deeper reads from your archive. These update as patterns intensify, soften, or gain stronger cross-source evidence.
            </Text>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: '85%' }}>
              <View style={{ gap: 16, paddingBottom: 8 }}>
                {deepDiveInsights.map((insight, idx) => (
                  <View key={insight.id} style={styles.deepDiveInsightCard}>
                    <LinearGradient colors={['rgba(162, 194, 225, 0.15)', 'rgba(162, 194, 225, 0.03)']} style={StyleSheet.absoluteFill} />
                    <Text {...WRAP_AT_WORD_PROPS} style={styles.deepDiveInsightTitle}>{insight.title}</Text>
                    <Text {...WRAP_AT_WORD_PROPS} style={[styles.insightBody, { fontSize: 14 }]}>{normalizeDisplayText(insight.body)}</Text>
                    {insight.heroMetrics && insight.heroMetrics.length > 0 && (
                      <View style={[styles.heroMetricsRow, { marginTop: 12 }]}>
                        {insight.heroMetrics.map((m) => (
                          <View key={m.label} style={styles.heroMetricChip}>
                            <Text {...WRAP_AT_WORD_PROPS} style={styles.heroMetricValue}>{m.value}</Text>
                            <Text {...WRAP_AT_WORD_PROPS} style={styles.heroMetricLabel}>{m.label}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                    {insight.takeaway && (
                      <View style={[styles.supportCallout, { marginTop: 12 }]}>
                        <Text {...WRAP_AT_WORD_PROPS} style={styles.supportCalloutLabel}>{insight.takeaway.label}</Text>
                        <Text {...WRAP_AT_WORD_PROPS} style={styles.supportCalloutBody}>{insight.takeaway.body}</Text>
                      </View>
                    )}
                    <Text style={[styles.rotationHint, { textAlign: 'left', marginTop: 8 }]}>Insight {idx + 1} of {deepDiveInsights.length}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </VelvetGlassSurface>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent
        visible={showLibraryModal}
        onRequestClose={() => setShowLibraryModal(false)}
      >
        <View style={[styles.modalBackdrop, styles.libraryModalBackdrop]}>
          <Pressable
            onPress={() => setShowLibraryModal(false)}
            style={StyleSheet.absoluteFill}
            accessibilityRole="button"
            accessibilityLabel="Close pattern library"
          />
          <BlurView intensity={30} tint={theme.blurTint} style={StyleSheet.absoluteFill} />
          <VelvetGlassSurface style={[styles.modalCard, styles.libraryModalCard]} intensity={35}>
            <LinearGradient colors={['rgba(44, 54, 69, 0.92)', 'rgba(26, 30, 41, 0.72)']} style={StyleSheet.absoluteFill} />
            <View style={styles.modalHeader}>
              <MetallicText style={styles.modalTitle} variant="gold">Your Pattern Archive</MetallicText>
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setShowLibraryModal(false);
                }}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Close pattern library"
              >
                <MetallicIcon name="close-outline" size={18} variant="gold" />
              </Pressable>
            </View>
            <ScrollView
              style={styles.libraryModalScroll}
              contentContainerStyle={styles.libraryModalScrollContent}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
            >
              <Text {...WRAP_AT_WORD_PROPS} style={styles.modalBody}>
                {normalizeDisplayText('A living profile of who you are becoming — expanding as MySky learns how you feel, recover, connect, and grow.')}
              </Text>
              <Text {...WRAP_AT_WORD_PROPS} style={styles.modalStatus}>{normalizeDisplayText(libraryState.statusLine)}</Text>
              <Text {...WRAP_AT_WORD_PROPS} style={styles.modalBodyMuted}>{normalizeDisplayText(libraryState.helperText)}</Text>
              {libraryState.sections.length > 0 ? (
                <View style={styles.libraryList}>
                  {libraryState.sections.map((section, sectionIndex) => (
                    <View key={`${section.title}-${sectionIndex}`} style={styles.librarySection}>
                      <Text {...WRAP_AT_WORD_PROPS} style={styles.librarySectionTitle}>{section.title}</Text>
                      {section.items.map((item, itemIndex) => (
                        <View key={`${section.title}-${item.title}-${itemIndex}`} style={styles.libraryItem}>
                          <Text {...WRAP_AT_WORD_PROPS} style={styles.libraryItemTitle}>{normalizeDisplayText(item.title)}</Text>
                          <Text {...WRAP_AT_WORD_PROPS} style={styles.libraryItemBody}>{normalizeDisplayText(item.body)}</Text>
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              ) : null}
            </ScrollView>
            <Pressable
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setShowLibraryModal(false);
              }}
              style={styles.modalCloseButton}
              accessibilityRole="button"
              accessibilityLabel="Done with pattern library"
            >
              <LinearGradient colors={['rgba(44, 54, 69, 0.85)', 'rgba(26, 30, 41, 0.40)']} style={StyleSheet.absoluteFill} />
              <MetallicText style={styles.modalCloseButtonText} variant="gold">Done</MetallicText>
            </Pressable>
          </VelvetGlassSurface>
        </View>
      </Modal>
    </View>
  );
}

// ─── Sub-Components ─────────────────────────────────────────────────────────

const MetricCard = ({ label, value, wash }: { label: string; value: string; wash: [string, string] }) => {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={[styles.metricCard, theme.velvetBorder]}>
      <LinearGradient colors={wash} style={StyleSheet.absoluteFill} />
      <View style={styles.metricContent}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={styles.metricValue}>{value}</Text>
      </View>
    </View>
  );
};

const SectionHeader = ({ label, icon }: { label: string; icon: any }) => {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.sectionHeaderRow}>
      <MetallicIcon name={icon} size={14} variant="gold" />
      <MetallicText style={styles.sectionHeaderLabel} variant="gold">{label}</MetallicText>
    </View>
  );
};

const GlassTakeaway = ({ label, body, icon }: { label: string; body: string; icon: any }) => {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.supportCallout}>
      <View style={styles.supportCalloutHeader}>
        <Ionicons name={icon} size={13} color={PALETTE.sage} />
        <Text {...WRAP_AT_WORD_PROPS} style={styles.supportCalloutLabel}>{label}</Text>
      </View>
      <Text {...WRAP_AT_WORD_PROPS} style={styles.supportCalloutBody}>{body}</Text>
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  safeArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 140 },
  header: { marginBottom: 32 },
  title: { fontSize: 32, fontWeight: '800', color: theme.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' },
  freshnessText: { marginTop: 8, fontSize: 12, color: theme.textSecondary },
  
  snapshotRow: { flexDirection: 'row', gap: 12, marginBottom: 32, alignItems: 'stretch' },
  metricCard: { flex: 1, height: 110, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 20, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  metricContent: { width: '100%', alignItems: 'center', justifyContent: 'center' },
  metricLabel: { width: '100%', fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.4)', letterSpacing: 1.2, marginBottom: 8, textAlign: 'center' },
  metricValue: { width: '100%', fontSize: 32, fontWeight: '700', color: theme.textPrimary, textAlign: 'center' },

  orbitCard: { height: ORBIT_SIZE + 80, borderRadius: 24, marginBottom: 40, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  emptyCard: { borderRadius: 24, padding: 24, marginBottom: 24, overflow: 'hidden' },
  emptyTitle: { width: '100%', flexShrink: 1, color: theme.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptyBody: { width: '100%', flexShrink: 1, color: theme.textSecondary, fontSize: 14, lineHeight: 20 },
  orbitCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, position: 'absolute', top: 24, left: 24 },
  orbitCardEyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },

  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  sectionHeaderLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2 },

  insightCard: { padding: 32, borderRadius: 24, marginBottom: 24, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  confirmedBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: 'rgba(107,144,128,0.15)', borderWidth: 1, borderColor: 'rgba(107,144,128,0.3)' },
  confirmedText: { flexShrink: 1, fontSize: 8, fontWeight: '800', color: '#6B9080' },
  lockedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: 'rgba(212,175,55,0.12)', borderWidth: 1, borderColor: 'rgba(212,175,55,0.25)' },
  lockedText: { fontSize: 8, fontWeight: '800', color: '#D4AF37' },
  patternTitle: { width: '100%', flexShrink: 1, fontSize: 18, fontWeight: '700', color: theme.textPrimary, marginBottom: 12 },
  insightBody: { width: '100%', flexShrink: 1, fontSize: 15, color: 'rgba(255,255,255,0.7)', lineHeight: 24 },

  blurredInsightPreview: { padding: 32, gap: 10 },
  blurredInsightLine: { height: 14, borderRadius: 7, width: '95%', backgroundColor: 'rgba(255,255,255,0.25)' },

  supportCallout: { marginTop: 24, padding: 16, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  supportCalloutHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  supportCalloutLabel: { flexShrink: 1, fontSize: 11, fontWeight: '800', color: theme.textPrimary, textTransform: 'uppercase' },
  supportCalloutBody: { width: '100%', flexShrink: 1, fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 20 },

  libraryButton: { height: 60, borderRadius: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  libraryButtonText: { fontSize: 15, fontWeight: '700' },

  modalBackdrop: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  libraryModalBackdrop: { justifyContent: 'flex-end', paddingBottom: 42 },
  modalCard: { borderRadius: 24, padding: 24, overflow: 'hidden' },
  libraryModalCard: { maxHeight: '86%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  modalIntro: { width: '100%', flexShrink: 1, fontSize: 14, lineHeight: 22, color: 'rgba(255,255,255,0.72)', marginBottom: 16 },
  modalBody: { width: '100%', flexShrink: 1, fontSize: 15, lineHeight: 24, color: theme.textPrimary, marginBottom: 12 },
  modalStatus: { width: '100%', flexShrink: 1, fontSize: 12, fontWeight: '700', color: 'rgba(212,175,55,0.9)', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8 },
  modalBodyMuted: { width: '100%', flexShrink: 1, fontSize: 14, lineHeight: 22, color: 'rgba(255,255,255,0.62)' },
  libraryModalScroll: { flexShrink: 1 },
  libraryModalScrollContent: { paddingBottom: 2 },
  libraryList: { marginTop: 18, gap: 12 },
  librarySection: { gap: 10 },
  librarySectionTitle: { width: '100%', flexShrink: 1, fontSize: 12, fontWeight: '700', color: 'rgba(212,175,55,0.9)', textTransform: 'uppercase', letterSpacing: 1.1 },
  libraryItem: { padding: 14, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  libraryItemTitle: { width: '100%', flexShrink: 1, fontSize: 13, fontWeight: '700', color: theme.textPrimary, marginBottom: 6 },
  libraryItemBody: { width: '100%', flexShrink: 1, fontSize: 13, lineHeight: 20, color: 'rgba(255,255,255,0.66)' },
  modalCloseButton: {
    marginTop: 20,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalCloseButtonText: { fontSize: 14, fontWeight: '700' },

  glowOrb: { position: 'absolute', width: 320, height: 320, borderRadius: 160, opacity: 0.6 },

  rotationHint: { marginTop: 16, fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center', letterSpacing: 0.5 },

  deepDiveButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
    borderRadius: 24, padding: 20, marginBottom: 24, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  deepDiveButtonTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  deepDiveButtonSub: { width: '100%', flexShrink: 1, fontSize: 12, color: 'rgba(255,255,255,0.56)', lineHeight: 18 },

  heroMetricsRow: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8, marginTop: 20, paddingTop: 16,
    borderTopWidth: 1, borderTopColor: theme.cardBorder,
  },
  heroMetricChip: {
    width: '48%',
    minWidth: 130,
    minHeight: 78,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  heroMetricValue: {
    width: '100%',
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '800',
    color: theme.textPrimary,
    textAlign: 'left',
    marginBottom: 8,
  },
  heroMetricLabel: {
    width: '100%',
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.46)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'left',
  },

  deepDiveModalCard: { maxHeight: '90%', paddingBottom: 24 },
  deepDiveInsightCard: { borderRadius: 20, padding: 24, overflow: 'hidden' },
  deepDiveInsightTitle: { width: '100%', flexShrink: 1, fontSize: 16, fontWeight: '700', color: theme.textPrimary, marginBottom: 10 },
});
