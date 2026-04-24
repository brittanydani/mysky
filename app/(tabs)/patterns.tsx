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
import { getArchiveDepth, getPersonalizedPremiumTeaser, type ArchiveDepthCounts } from '../../utils/archiveDepth';
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
  const patternRows = useMemo(() => (leadInsight ? [leadInsight] : []), [leadInsight]);
  const archiveDepth = useMemo(() => getArchiveDepth(archiveDepthCounts), [archiveDepthCounts]);
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
                  <MetallicText style={styles.cardLabel} variant="gold">WHAT'S BECOMING CLEAR</MetallicText>
                  <View style={styles.confirmedBadge}>
                    <Text style={styles.confirmedText}>{item.isConfirmed ? 'SEEN REPEATEDLY' : 'EARLY SIGNAL'}</Text>
                  </View>
                </View>
                <Text style={styles.patternTitle}>{item.title}</Text>
                <Text style={styles.insightBody}>{item.body}</Text>
                {item.heroMetrics && item.heroMetrics.length > 0 && (
                  <View style={styles.heroMetricsRow}>
                    {item.heroMetrics.map((m) => (
                      <View key={m.label} style={styles.heroMetricChip}>
                        <Text style={styles.heroMetricValue}>{m.value}</Text>
                        <Text style={styles.heroMetricLabel}>{m.label}</Text>
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
                    <MetallicText style={[styles.deepDiveButtonTitle, { textAlign: 'center' }]} variant="gold">What Your Archive Is Learning</MetallicText>
                    <Text style={[styles.deepDiveButtonSub, { textAlign: 'center' }]}>{feedInsights.length} patterns your history is beginning to name</Text>
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
                    <Text style={styles.deepDiveButtonSub}>{premiumTeaser.title}</Text>
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
                <GoldSubtitle style={styles.subtitle}>A mirror built from your entries</GoldSubtitle>
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

              <VelvetGlassSurface style={styles.depthCard} intensity={25}>
                <LinearGradient colors={['rgba(107, 144, 128, 0.16)', 'rgba(26,30,41,0.35)']} style={StyleSheet.absoluteFill} />
                <View style={styles.cardHeader}>
                  <MetallicText style={styles.cardLabel} variant="gold">{archiveDepth.label.toUpperCase()}</MetallicText>
                  <Text style={styles.depthCount}>{archiveDepth.totalSignals} signals</Text>
                </View>
                <Text style={styles.patternTitle}>{archiveDepth.headline}</Text>
                <Text style={styles.insightBody}>{archiveDepth.body}</Text>
                <View style={styles.depthProgressTrack}>
                  <View style={[styles.depthProgressFill, { width: `${Math.max(8, archiveDepth.progress * 100)}%` }]} />
                </View>
                {!!archiveDepth.nextMilestone && (
                  <Text style={styles.depthMeta}>{archiveDepth.remaining} more to reach {archiveDepth.nextMilestone}</Text>
                )}
              </VelvetGlassSurface>

              <View style={[styles.orbitCard, theme.velvetBorder]}>
                <LinearGradient colors={['rgba(162, 194, 225, 0.20)', 'rgba(162, 194, 225, 0.05)']} style={StyleSheet.absoluteFill} />
                <View style={styles.orbitCardHeader}>
                  <MetallicIcon name="planet-outline" size={14} variant="gold" />
                  <MetallicText style={styles.orbitCardEyebrow} variant="gold">PATTERN ORBIT MAP</MetallicText>
                </View>
                {orbitLoading ? <ActivityIndicator size="large" color={PALETTE.gold} /> : <PatternOrbitMap checkIns={trendCheckIns} size={ORBIT_SIZE} />}
              </View>

              <SectionHeader label="BECOMING CLEAR" icon="radio-outline" />
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
                    <Text style={styles.patternTitle}>{premiumTeaser.title}</Text>
                    <Text style={styles.insightBody}>
                      {premiumTeaser.body}
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
                  <Text style={styles.patternTitle}>{5 - snapshot.checkInCount} more check-ins until your first pattern insight</Text>
                  <Text style={styles.insightBody}>
                    Keep logging — once you have 5 check-ins, Deeper Sky can start surfacing what your mood, stress, and energy levels are really telling you.
                  </Text>
                </VelvetGlassSurface>
              )}
              {!loading && loadError ? (
                <VelvetGlassSurface style={styles.emptyCard} intensity={25}>
                  <LinearGradient colors={['rgba(162, 194, 225, 0.20)', 'rgba(162, 194, 225, 0.05)']} style={StyleSheet.absoluteFill} />
                  <Text style={styles.emptyTitle}>Couldn't load patterns right now</Text>
                  <Text style={styles.emptyBody}>Something went wrong while analyzing your data. Try again in a moment.</Text>
                </VelvetGlassSurface>
              ) : !loading && patternRows.length === 0 ? (
                <VelvetGlassSurface style={styles.emptyCard} intensity={25}>
                  <LinearGradient colors={['rgba(162, 194, 225, 0.20)', 'rgba(162, 194, 225, 0.05)']} style={StyleSheet.absoluteFill} />
                  <Text style={styles.emptyTitle}>Your patterns are forming</Text>
                  <Text style={styles.emptyBody}>This space comes alive after a few days of data. Here's what feeds it:</Text>
                  <View style={{ marginTop: 16, gap: 10 }}>
                    <Text style={styles.emptyBody}>{'\u2022'} Check in with your mood, energy, and stress daily</Text>
                    <Text style={styles.emptyBody}>{'\u2022'} Log sleep duration and dream notes</Text>
                    <Text style={styles.emptyBody}>{'\u2022'} Write a journal entry when something feels important</Text>
                  </View>
                  <Text style={[styles.emptyBody, { marginTop: 16, fontStyle: 'italic' }]}>3–5 days of check-ins typically surfaces your first insight.</Text>
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
              <MetallicText style={styles.libraryButtonText} variant="gold">Your Pattern Archive</MetallicText>
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
              <MetallicText style={styles.modalTitle} variant="gold">What Your Archive Is Learning</MetallicText>
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
            <Text style={styles.modalIntro}>
              These are not generic traits. They are patterns forming from what your history keeps repeating, reinforcing, and revealing over time.
            </Text>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: '85%' }}>
              <View style={{ gap: 16, paddingBottom: 8 }}>
                {feedInsights.map((insight, idx) => (
                  <View key={insight.id} style={styles.deepDiveInsightCard}>
                    <LinearGradient colors={['rgba(162, 194, 225, 0.15)', 'rgba(162, 194, 225, 0.03)']} style={StyleSheet.absoluteFill} />
                    <Text style={styles.deepDiveInsightTitle}>{insight.title}</Text>
                    <Text style={[styles.insightBody, { fontSize: 14 }]}>{insight.body}</Text>
                    {insight.heroMetrics && insight.heroMetrics.length > 0 && (
                      <View style={[styles.heroMetricsRow, { marginTop: 12 }]}>
                        {insight.heroMetrics.map((m) => (
                          <View key={m.label} style={styles.heroMetricChip}>
                            <Text style={styles.heroMetricValue}>{m.value}</Text>
                            <Text style={styles.heroMetricLabel}>{m.label}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                    {insight.takeaway && (
                      <View style={[styles.supportCallout, { marginTop: 12 }]}>
                        <Text style={styles.supportCalloutLabel}>{insight.takeaway.label}</Text>
                        <Text style={styles.supportCalloutBody}>{insight.takeaway.body}</Text>
                      </View>
                    )}
                    <Text style={[styles.rotationHint, { textAlign: 'left', marginTop: 8 }]}>Insight {idx + 1} of {feedInsights.length}</Text>
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
        <View style={styles.modalBackdrop}>
          <BlurView intensity={30} tint={theme.blurTint} style={StyleSheet.absoluteFill} />
          <VelvetGlassSurface style={styles.modalCard} intensity={35}>
            <LinearGradient colors={['rgba(44, 54, 69, 0.92)', 'rgba(26, 30, 41, 0.72)']} style={StyleSheet.absoluteFill} />
            <View style={styles.modalHeader}>
              <MetallicText style={styles.modalTitle} variant="gold">Your Archive</MetallicText>
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
            <Text style={styles.modalBody}>
              As your history grows, this space surfaces what keeps repeating — across your mood, nervous system, energy, and the way you tend to move through hard things.
            </Text>
            <Text style={styles.modalStatus}>{libraryState.statusLine}</Text>
            <Text style={styles.modalBodyMuted}>{libraryState.helperText}</Text>
            {libraryState.sections.length > 0 ? (
              <View style={styles.libraryList}>
                {libraryState.sections.map((section) => (
                  <View key={section.title} style={styles.librarySection}>
                    <Text style={styles.librarySectionTitle}>{section.title}</Text>
                    {section.items.map((item) => (
                      <View key={`${section.title}-${item.title}`} style={styles.libraryItem}>
                        <Text style={styles.libraryItemTitle}>{item.title}</Text>
                        <Text style={styles.libraryItemBody}>{item.body}</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            ) : null}
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
        <Text style={styles.supportCalloutLabel}>{label}</Text>
      </View>
      <Text style={styles.supportCalloutBody}>{body}</Text>
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
  emptyTitle: { color: theme.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptyBody: { color: theme.textSecondary, fontSize: 14, lineHeight: 20 },
  orbitCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, position: 'absolute', top: 24, left: 24 },
  orbitCardEyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },

  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  sectionHeaderLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2 },

  insightCard: { padding: 32, borderRadius: 24, marginBottom: 24, overflow: 'hidden' },
  depthCard: { padding: 28, borderRadius: 24, marginBottom: 24, overflow: 'hidden' },
  depthCount: { fontSize: 11, fontWeight: '800', color: 'rgba(212,175,55,0.72)', textTransform: 'uppercase', letterSpacing: 1 },
  depthProgressTrack: {
    height: 5,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.10)',
    marginTop: 18,
  },
  depthProgressFill: { height: '100%', borderRadius: 999, backgroundColor: PALETTE.gold },
  depthMeta: { marginTop: 8, fontSize: 11, fontWeight: '700', color: 'rgba(212,175,55,0.68)', textTransform: 'uppercase', letterSpacing: 0.8 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  confirmedBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: 'rgba(107,144,128,0.15)', borderWidth: 1, borderColor: 'rgba(107,144,128,0.3)' },
  confirmedText: { fontSize: 8, fontWeight: '800', color: '#6B9080' },
  lockedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: 'rgba(212,175,55,0.12)', borderWidth: 1, borderColor: 'rgba(212,175,55,0.25)' },
  lockedText: { fontSize: 8, fontWeight: '800', color: '#D4AF37' },
  patternTitle: { fontSize: 18, fontWeight: '700', color: theme.textPrimary, marginBottom: 12 },
  insightBody: { fontSize: 15, color: 'rgba(255,255,255,0.7)', lineHeight: 24 },

  blurredInsightPreview: { padding: 32, gap: 10 },
  blurredInsightLine: { height: 14, borderRadius: 7, width: '95%', backgroundColor: 'rgba(255,255,255,0.25)' },

  supportCallout: { marginTop: 24, padding: 16, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  supportCalloutHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  supportCalloutLabel: { fontSize: 11, fontWeight: '800', color: theme.textPrimary, textTransform: 'uppercase' },
  supportCalloutBody: { fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 20 },

  libraryButton: { height: 60, borderRadius: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  libraryButtonText: { fontSize: 15, fontWeight: '700' },

  modalBackdrop: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  modalCard: { borderRadius: 24, padding: 24, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  modalIntro: { fontSize: 14, lineHeight: 22, color: 'rgba(255,255,255,0.72)', marginBottom: 16 },
  modalBody: { fontSize: 15, lineHeight: 24, color: theme.textPrimary, marginBottom: 12 },
  modalStatus: { fontSize: 12, fontWeight: '700', color: 'rgba(212,175,55,0.9)', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8 },
  modalBodyMuted: { fontSize: 14, lineHeight: 22, color: 'rgba(255,255,255,0.62)' },
  libraryList: { marginTop: 18, gap: 12 },
  librarySection: { gap: 10 },
  librarySectionTitle: { fontSize: 12, fontWeight: '700', color: 'rgba(212,175,55,0.9)', textTransform: 'uppercase', letterSpacing: 1.1 },
  libraryItem: { padding: 14, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  libraryItemTitle: { fontSize: 13, fontWeight: '700', color: theme.textPrimary, marginBottom: 6 },
  libraryItemBody: { fontSize: 13, lineHeight: 20, color: 'rgba(255,255,255,0.66)' },

  glowOrb: { position: 'absolute', width: 320, height: 320, borderRadius: 160, opacity: 0.6 },

  rotationHint: { marginTop: 16, fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center', letterSpacing: 0.5 },

  deepDiveButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
    borderRadius: 24, padding: 20, marginBottom: 24, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  deepDiveButtonTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  deepDiveButtonSub: { fontSize: 12, color: 'rgba(255,255,255,0.56)', lineHeight: 18 },

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
  deepDiveInsightTitle: { fontSize: 16, fontWeight: '700', color: theme.textPrimary, marginBottom: 10 },
});
