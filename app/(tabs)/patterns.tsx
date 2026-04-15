// File: app/(tabs)/patterns.tsx
// MySky — Patterns Hub
//
// High-End "Lunar Sky" & "Midnight Slate" Aesthetic Update:
// 1. Purged "Muddy Gold" background gradients; implemented Midnight Slate Anchors.
// 2. Implemented Smoked Glass architecture (Atmosphere, Nebula, Sage) for insight cards.
// 3. Integrated "Velvet Glass" 1px directional light-catch borders globally.
// 4. Enhanced Typography: Pure White data hero numbers and crisp Metallic Gold headers.

import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, Dimensions, ActivityIndicator, Modal } from 'react-native';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from '../../components/ui/SkiaGradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/core';
import * as Haptics from 'expo-haptics';

import { SkiaDynamicCosmos } from '../../components/ui/SkiaDynamicCosmos';
import { localDb } from '../../services/storage/localDb';
import { runPipeline } from '../../services/insights/pipeline';
import { type DailyAggregate } from '../../services/insights/types';
import { computeNarrativeInsights, NarrativeInsightBundle } from '../../utils/narrativeInsights';
import { buildPersonalProfile } from '../../utils/personalProfile';
import { computeDeepInsights, DeepInsightBundle } from '../../utils/deepInsights';
import { PatternOrbitMap } from '../../components/ui/PatternOrbitMap';
import { DailyCheckIn } from '../../services/patterns/types';
import { GoldSubtitle } from '../../components/ui/GoldSubtitle';
import { MetallicIcon } from '../../components/ui/MetallicIcon';
import { MetallicText } from '../../components/ui/MetallicText';
import { VelvetGlassSurface } from '../../components/ui/VelvetGlassSurface';
import { loadSelfKnowledgeContext } from '../../services/insights/selfKnowledgeContext';
import { enhancePatternInsights } from '../../services/insights/geminiInsightsService';
import { buildPatternLibraryState, refineCrossRefCopy } from './patternsHelpers';
import {
  computeSelfKnowledgeCrossRef,
  CrossRefInsight,
} from '../../utils/selfKnowledgeCrossRef';
import { type AppTheme } from '../../constants/theme';
import { useAppTheme, useThemedStyles } from '../../context/ThemeContext';
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
  const [trendCheckIns, setTrendCheckIns] = useState<DailyCheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [crossRefs, setCrossRefs] = useState<CrossRefInsight[]>([]);
  const [dailyAggregates, setDailyAggregates] = useState<DailyAggregate[]>([]);
  const [, setNarrative] = useState<NarrativeInsightBundle | null>(null);
  const [, setDeepInsights] = useState<DeepInsightBundle | null>(null);
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      trackGrowthEvent('analytics_screen_viewed', { screen: 'patterns' }).catch(() => {});
      (async () => {
        try {
          const charts = await localDb.getCharts();
          if (!charts?.length) return;
          const chartId = charts[0].id;
          const [checkIns, sleepEntries, journalEntries] = await Promise.all([
            localDb.getCheckIns(chartId, 90),
            localDb.getSleepEntries(chartId, 90),
            localDb.getJournalEntries(),
          ]);
          if (!active) return;
          const recentJournalEntries = journalEntries.filter((entry) => {
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - 90);
            return new Date(`${entry.date}T12:00:00`) >= cutoff;
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
          setLastUpdated(new Date().toISOString());

          const skContext = await loadSelfKnowledgeContext();
          if (!active) return;
          const refs = computeSelfKnowledgeCrossRef(skContext, checkIns);
          const enhancedRefs = await enhancePatternInsights(refs, skContext, checkIns);
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
    }, [])
  );

  const libraryState = useMemo(() => buildPatternLibraryState(dailyAggregates), [dailyAggregates]);
  const leadInsight = useMemo(
    () => (crossRefs.length > 0 ? refineCrossRefCopy(crossRefs[0]) : null),
    [crossRefs],
  );
  const patternRows = useMemo(() => (leadInsight ? [leadInsight] : []), [leadInsight]);

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
            <VelvetGlassSurface style={styles.insightCard} intensity={25}>
              <LinearGradient colors={['rgba(162, 194, 225, 0.20)', 'rgba(162, 194, 225, 0.05)']} style={StyleSheet.absoluteFill} />
              <View style={styles.cardHeader}>
                <MetallicText style={styles.cardLabel} variant="gold">PERSONAL PATTERN</MetallicText>
                <View style={styles.confirmedBadge}><Text style={styles.confirmedText}>DATA CONFIRMED</Text></View>
              </View>
              <Text style={styles.patternTitle}>{item.title}</Text>
              <Text style={styles.insightBody}>{item.body}</Text>
              <GlassTakeaway label="Gentle read" body="Treat the pattern as information, not a diagnosis." icon="compass-outline" />
            </VelvetGlassSurface>
          )}
          ListHeaderComponent={(
            <>
              <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
                <Text style={styles.title}>Patterns</Text>
                <GoldSubtitle style={styles.subtitle}>Analysis of your internal weather</GoldSubtitle>
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
                {loading ? <ActivityIndicator size="large" color={PALETTE.gold} /> : <PatternOrbitMap checkIns={trendCheckIns} size={ORBIT_SIZE} />}
              </View>

              <SectionHeader label="SURFACING TODAY" icon="radio-outline" />
              {!isPremium && !loading && snapshot.checkInCount >= 7 && (
                <Pressable onPress={() => router.push('/(tabs)/premium' as Href)}>
                  <VelvetGlassSurface style={styles.insightCard} intensity={25}>
                    <LinearGradient colors={['rgba(168, 139, 235, 0.20)', 'rgba(168, 139, 235, 0.05)']} style={StyleSheet.absoluteFill} />
                    <View style={styles.cardHeader}>
                      <MetallicText style={styles.cardLabel} variant="gold">PATTERNS DETECTED</MetallicText>
                      <View style={styles.lockedBadge}><MetallicIcon name="lock-closed-outline" size={10} variant="gold" /><Text style={styles.lockedText}>PREMIUM</Text></View>
                    </View>
                    <Text style={styles.patternTitle}>We found recurring themes in your data</Text>
                    <Text style={styles.insightBody}>
                      With {snapshot.checkInCount} check-ins logged, your mood and stress patterns are starting to reveal what restores you and what drains you. Unlock Deeper Sky to see the full picture.
                    </Text>
                  </VelvetGlassSurface>
                </Pressable>
              )}
              {!isPremium && !loading && snapshot.checkInCount >= 3 && snapshot.checkInCount < 7 && (
                <VelvetGlassSurface style={styles.insightCard} intensity={25}>
                  <LinearGradient colors={['rgba(107, 144, 128, 0.15)', 'rgba(107, 144, 128, 0.05)']} style={StyleSheet.absoluteFill} />
                  <View style={styles.cardHeader}>
                    <MetallicText style={styles.cardLabel} variant="gold">BUILDING YOUR ARCHIVE</MetallicText>
                  </View>
                  <Text style={styles.patternTitle}>{7 - snapshot.checkInCount} more check-ins until your first pattern insight</Text>
                  <Text style={styles.insightBody}>
                    Keep logging — once we have a week of data, Deeper Sky can surface what your mood, stress, and energy levels are trying to tell you.
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
              <MetallicText style={styles.libraryButtonText} variant="gold">View Pattern Library</MetallicText>
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
              <MetallicText style={styles.modalTitle} variant="gold">Pattern Library</MetallicText>
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
              As your check-in history grows, this space will begin surfacing recurring patterns across your mood, nervous system, and reflections.
            </Text>
            <Text style={styles.modalStatus}>{libraryState.statusLine}</Text>
            <Text style={styles.modalBodyMuted}>{libraryState.helperText}</Text>
            {libraryState.items.length > 0 ? (
              <View style={styles.libraryList}>
                {libraryState.items.map((item) => (
                  <View key={item.title} style={styles.libraryItem}>
                    <Text style={styles.libraryItemTitle}>{item.title}</Text>
                    <Text style={styles.libraryItemBody}>{item.body}</Text>
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
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
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
  title: { fontSize: 32, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 },
  subtitle: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' },
  freshnessText: { marginTop: 8, fontSize: 12, color: theme.textSecondary },
  
  snapshotRow: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  metricCard: { flex: 1, height: 110, borderRadius: 24, padding: 20, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  metricLabel: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.4)', letterSpacing: 1.2, marginBottom: 8 },
  metricValue: { fontSize: 32, fontWeight: '700', color: '#FFFFFF' },

  orbitCard: { height: ORBIT_SIZE + 80, borderRadius: 24, marginBottom: 40, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  emptyCard: { borderRadius: 24, padding: 24, marginBottom: 24, overflow: 'hidden' },
  emptyTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptyBody: { color: theme.textSecondary, fontSize: 14, lineHeight: 20 },
  orbitCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, position: 'absolute', top: 24, left: 24 },
  orbitCardEyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },

  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  sectionHeaderLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2 },

  insightCard: { padding: 32, borderRadius: 24, marginBottom: 24, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  confirmedBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: 'rgba(107,144,128,0.15)', borderWidth: 1, borderColor: 'rgba(107,144,128,0.3)' },
  confirmedText: { fontSize: 8, fontWeight: '800', color: '#6B9080' },
  lockedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: 'rgba(212,175,55,0.12)', borderWidth: 1, borderColor: 'rgba(212,175,55,0.25)' },
  lockedText: { fontSize: 8, fontWeight: '800', color: '#D4AF37' },
  patternTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 12 },
  insightBody: { fontSize: 15, color: 'rgba(255,255,255,0.7)', lineHeight: 24 },

  supportCallout: { marginTop: 24, padding: 16, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  supportCalloutHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  supportCalloutLabel: { fontSize: 11, fontWeight: '800', color: '#FFFFFF', textTransform: 'uppercase' },
  supportCalloutBody: { fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 20 },

  libraryButton: { height: 60, borderRadius: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  libraryButtonText: { fontSize: 15, fontWeight: '700' },

  modalBackdrop: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  modalCard: { borderRadius: 24, padding: 24, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  modalBody: { fontSize: 15, lineHeight: 24, color: '#FFFFFF', marginBottom: 12 },
  modalStatus: { fontSize: 12, fontWeight: '700', color: 'rgba(212,175,55,0.9)', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8 },
  modalBodyMuted: { fontSize: 14, lineHeight: 22, color: 'rgba(255,255,255,0.62)' },
  libraryList: { marginTop: 18, gap: 12 },
  libraryItem: { padding: 14, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  libraryItemTitle: { fontSize: 13, fontWeight: '700', color: '#FFFFFF', marginBottom: 6 },
  libraryItemBody: { fontSize: 13, lineHeight: 20, color: 'rgba(255,255,255,0.66)' },

  glowOrb: { position: 'absolute', width: 320, height: 320, borderRadius: 160, opacity: 0.6 },
});


