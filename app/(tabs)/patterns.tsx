// File: app/(tabs)/patterns.tsx
// MySky — Patterns Hub
//
// High-End "Lunar Sky" & "Midnight Slate" Aesthetic Update:
// 1. Purged "Muddy Gold" background gradients; implemented Midnight Slate Anchors.
// 2. Implemented Smoked Glass architecture (Atmosphere, Nebula, Sage) for insight cards.
// 3. Integrated "Velvet Glass" 1px directional light-catch borders globally.
// 4. Enhanced Typography: Pure White data hero numbers and crisp Metallic Gold headers.

import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  InteractionManager,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from '../../components/ui/SkiaGradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/core';
import * as Haptics from 'expo-haptics';

import { SkiaDynamicCosmos } from '../../components/ui/SkiaDynamicCosmos';
import { buildInsightSurface } from '../../services/insights/buildInsightSurface';
import { type PremiumPersonaProfile } from '../../services/insightsV2/adapters/premiumPersonaProfile';
import {
  type PremiumPatternItem,
  type PremiumPatternProfile,
  type PremiumThisWeekPatternItem,
  type PremiumWeeklyDeepDiveItem,
} from '../../services/insightsV2/adapters/premiumPatterns';
import { GoldSubtitle } from '../../components/ui/GoldSubtitle';
import { MetallicIcon } from '../../components/ui/MetallicIcon';
import { MetallicText } from '../../components/ui/MetallicText';
import { VelvetGlassSurface } from '../../components/ui/VelvetGlassSurface';
import {
  buildPatternLibraryState,
  type PatternLibraryItem,
} from '../../utils/patternsHelpers';
import {
  buildInsightDuplicateKey,
  dedupeExactInsights,
} from '../../utils/insightDedupe';
import { type AppTheme } from '../../constants/theme';
import { useAppTheme, useThemedStyles } from '../../context/ThemeContext';
import { normalizeDisplayText } from '../../utils/textLayout';
import { getPersonalizedPremiumTeaser, type ArchiveDepthCounts } from '../../utils/archiveDepth';
import { trackGrowthEvent } from '../../services/growth/localAnalytics';
import { getUserPreference } from '../../services/storage/userProfileService';
import {
  getInsightFeedbackProfile,
  recordInsightOutcome,
  type InsightOutcomeType,
} from '../../services/insightsV2/feedback/insightOutcomeFeedback';
import {
  type InsightMemorySnapshot,
  getInsightMemoryProfile,
  insightMemorySnapshotFromPremiumPattern,
  insightMemorySnapshotFromThisWeekPattern,
  insightMemorySnapshotFromWeeklyDeepDive,
  recordInsightMemorySnapshots,
} from '../../services/insightsV2/memory/insightMemory';
import { type WeeklyNarrativeThread } from '../../services/insightsV2/narrative/weeklyNarrative';
import { usePremium } from '../../context/PremiumContext';
import { useRouter, Href } from 'expo-router';
import { logger } from '../../utils/logger';

const WRAP_AT_WORD_PROPS = {
  android_hyphenationFrequency: 'none' as const,
  lineBreakStrategyIOS: 'none' as const,
  textBreakStrategy: 'simple' as const,
  maxFontSizeMultiplier: 1.15,
};

const PATTERNS_FOCUS_REFRESH_CACHE_MS = 60 * 1000;

const sentenceCount = (text: string): number => (
  text.match(/[.!?](?=\s|$)/g)?.length ?? 0
);

type WeeklyDeepDiveDisplayItem = {
  id: string;
  title: string;
  body: string;
  whyItMayMatter?: string;
  reframe?: string;
  reflectionPrompt?: string;
  patternKey?: string;
};

function compactDisplayText(text: string, maxLength: number): string {
  const normalized = normalizeDisplayText(text);
  if (normalized.length <= maxLength) return normalized;
  const trimmed = normalized.slice(0, maxLength).replace(/\s+\S*$/, '').trim();
  return `${trimmed}...`;
}

function splitDeepReadSections(body: string): { label: string; body: string }[] {
  const sections = normalizeDisplayText(body)
    .split(/\n{2,}/)
    .map(section => section.trim())
    .filter(Boolean);

  if (sections.length <= 1) {
    return [{ label: 'What stands out', body: sections[0] ?? normalizeDisplayText(body) }];
  }

  const labels = ['What stands out', 'Why it matters', 'The pattern underneath'];
  return sections.slice(0, 3).map((section, index) => ({
    label: labels[index] ?? 'Read deeper',
    body: section,
  }));
}

function weeklyPatternBadgeLabel(pattern: PremiumThisWeekPatternItem): string {
  if (pattern.isEmptyState) return 'GATHERING SIGNAL';
  if (pattern.isLowConfidenceFallback || pattern.confidence === 'emerging') return 'EMERGING';
  if (pattern.confidence === 'moderate') return 'GETTING CLEARER';
  return 'SEEN REPEATEDLY';
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PatternsScreen() {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { isPremium, isReady: premiumReady } = usePremium();
  const effectiveIsPremium = premiumReady && isPremium;
  const router = useRouter();
  const [snapshot, setSnapshot] = useState({ avgMood: 0, avgStress: 0, checkInCount: 0 });
  const [archiveDepthCounts, setArchiveDepthCounts] = useState<ArchiveDepthCounts>({});
  const [loading, setLoading] = useState(true);
  const [premiumPersonaProfile, setPremiumPersonaProfile] = useState<PremiumPersonaProfile | null>(null);
  const [premiumPatterns, setPremiumPatterns] = useState<PremiumPatternItem[]>([]);
  const [premiumPatternProfile, setPremiumPatternProfile] = useState<PremiumPatternProfile | null>(null);
  const [thisWeeksV2Pattern, setThisWeeksV2Pattern] = useState<PremiumThisWeekPatternItem | null>(null);
  const [premiumWeeklyDeepDive, setPremiumWeeklyDeepDive] = useState<PremiumWeeklyDeepDiveItem[]>([]);
  const [weeklyNarrative, setWeeklyNarrative] = useState<WeeklyNarrativeThread | null>(null);
  const [selectedPatternItem, setSelectedPatternItem] = useState<PatternLibraryItem | null>(null);
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [patternModalView, setPatternModalView] = useState<'profile' | 'library'>('profile');
  const [showDeepDiveModal, setShowDeepDiveModal] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [moodInsightsEnabled, setMoodInsightsEnabled] = useState(true);
  const hasLoadedSurfaceRef = useRef(false);
  const lastSurfaceLoadedAtRef = useRef(0);
  const lastSurfacePremiumRef = useRef<boolean | null>(null);
  const handledRefreshKeyRef = useRef(0);
  const recordedPatternMemoryFingerprintsRef = useRef<Map<string, string>>(new Map());
  const pendingPatternMemoryFingerprintsRef = useRef<Map<string, string>>(new Map());

  const recordPatternOutcome = useCallback((
    item: PatternLibraryItem,
    outcome: InsightOutcomeType,
  ) => {
    recordInsightOutcome({
      outcome,
      paragraphId: item.paragraphId,
      patternKey: item.patternKey,
      category: item.category as any,
      majorDomain: item.majorDomain,
      subcategory: item.insightSubcategory,
      patternType: item.patternType as any,
      writerShape: item.writerShape as any,
      tone: item.paragraphTone as any,
      intensity: item.paragraphIntensity as any,
      surface: 'patterns',
      sentenceCount: sentenceCount(item.body),
      hasPracticalPrompt: item.writerShape === 'practicalCapacity' || item.paragraphTone === 'practical',
    }).catch((error) => {
      logger.warn('[Patterns] Failed to record insight outcome:', error);
    });
  }, []);

  const recordPatternMemory = useCallback((
    snapshots: (InsightMemorySnapshot | null | undefined)[],
    context: string,
  ) => {
    const pendingFingerprints: [string, string][] = [];
    const unrecorded = snapshots.filter((snapshot): snapshot is InsightMemorySnapshot => {
      if (!snapshot) return false;
      const fingerprint = [
        snapshot.observedAt,
        snapshot.bodyKey ?? '',
        snapshot.paragraphId ?? '',
        snapshot.title,
        snapshot.score,
        snapshot.confidence,
        snapshot.movement,
      ].join('|');
      if (recordedPatternMemoryFingerprintsRef.current.get(snapshot.id) === fingerprint) return false;
      if (pendingPatternMemoryFingerprintsRef.current.get(snapshot.id) === fingerprint) return false;
      pendingPatternMemoryFingerprintsRef.current.set(snapshot.id, fingerprint);
      pendingFingerprints.push([snapshot.id, fingerprint]);
      return true;
    });

    if (!unrecorded.length) return;

    recordInsightMemorySnapshots(unrecorded)
      .then(() => {
        pendingFingerprints.forEach(([id, fingerprint]) => {
          if (pendingPatternMemoryFingerprintsRef.current.get(id) === fingerprint) {
            pendingPatternMemoryFingerprintsRef.current.delete(id);
          }
          recordedPatternMemoryFingerprintsRef.current.set(id, fingerprint);
        });
      })
      .catch((error) => {
        pendingFingerprints.forEach(([id, fingerprint]) => {
          if (pendingPatternMemoryFingerprintsRef.current.get(id) === fingerprint) {
            pendingPatternMemoryFingerprintsRef.current.delete(id);
          }
        });
        logger.warn(`[Patterns] Failed to record ${context} insight memory:`, error);
      });
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const focusTask = InteractionManager.runAfterInteractions(() => {
        if (!active) return;
        const forcedRefresh = handledRefreshKeyRef.current !== refreshKey;
        const canUseFocusCache =
          !forcedRefresh &&
          hasLoadedSurfaceRef.current &&
          lastSurfacePremiumRef.current === effectiveIsPremium &&
          Date.now() - lastSurfaceLoadedAtRef.current < PATTERNS_FOCUS_REFRESH_CACHE_MS;

        if (canUseFocusCache) {
          trackGrowthEvent('analytics_screen_viewed', { screen: 'patterns' }).catch(() => {});
          return;
        }

        if (!premiumReady) {
          if (!hasLoadedSurfaceRef.current) {
            setLoading(true);
          }
          trackGrowthEvent('analytics_screen_viewed', { screen: 'patterns' }).catch(() => {});
          return;
        }

        if (!hasLoadedSurfaceRef.current) {
          setLoading(true);
        }
        setLoadError(false);
        trackGrowthEvent('analytics_screen_viewed', { screen: 'patterns' }).catch(() => {});
        (async () => {
          try {
            const [moodInsightPref, aiInsightPref, insightFeedbackProfile, insightMemoryProfile] = await Promise.all([
              getUserPreference<string | null>('pref_mood_insights', null).catch(() => null),
              getUserPreference<string | null>('pref_ai_insight_refinement', null).catch(() => null),
              getInsightFeedbackProfile().catch(() => null),
              getInsightMemoryProfile().catch(() => null),
            ]);
            const insightsEnabled = moodInsightPref !== '0';
            const aiInsightRefinementEnabled = insightsEnabled && aiInsightPref !== '0';
            const surface = await buildInsightSurface({
              rangeDays: 90,
              insightsEnabled,
              includeKnowledgeInsight: insightsEnabled,
              insightFeedbackProfile,
              insightMemoryProfile,
              includePremiumPatterns: effectiveIsPremium,
              knowledgeAiEnabled: aiInsightRefinementEnabled,
              knowledgeAiModelTier: effectiveIsPremium ? 'premium' : 'free',
              knowledgeAiSurface: 'patterns',
            });
            if (!active) return;

            setMoodInsightsEnabled(insightsEnabled);
            setSnapshot(surface.snapshot);
            setArchiveDepthCounts(surface.archiveDepthCounts);
            setLastUpdated(surface.lastUpdated);
            setPremiumPersonaProfile(surface.premiumPersonaProfile);
            setPremiumPatterns(surface.premiumPatterns);
            setPremiumPatternProfile(surface.premiumPatternProfile);
            setThisWeeksV2Pattern(surface.thisWeeksV2Pattern);
            setPremiumWeeklyDeepDive(surface.premiumWeeklyDeepDive);
            setWeeklyNarrative(surface.weeklyNarrative);
            hasLoadedSurfaceRef.current = true;
            lastSurfaceLoadedAtRef.current = Date.now();
            lastSurfacePremiumRef.current = effectiveIsPremium;
            if (effectiveIsPremium) {
              recordPatternMemory(
                [surface.thisWeeksV2Pattern
                  ? insightMemorySnapshotFromThisWeekPattern(surface.thisWeeksV2Pattern)
                  : null],
                'this-week',
              );
            }

          } catch (e) {
            logger.error('[Patterns] Pipeline error:', e);
            if (active) {
              setLoadError(true);
              setPremiumPersonaProfile(null);
              setPremiumPatterns([]);
              setPremiumPatternProfile(null);
              setThisWeeksV2Pattern(null);
              setPremiumWeeklyDeepDive([]);
              setWeeklyNarrative(null);
              setSelectedPatternItem(null);
            }
          } finally {
            if (active) {
              handledRefreshKeyRef.current = refreshKey;
              setLoading(false);
            }
          }
        })();
      });
      return () => {
        active = false;
        focusTask.cancel?.();
      };
    }, [effectiveIsPremium, premiumReady, recordPatternMemory, refreshKey])
  );

  const libraryState = useMemo(
    () => buildPatternLibraryState(premiumPatterns),
    [premiumPatterns],
  );
  const fullLibrarySections = useMemo(() => {
    const sections = libraryState.librarySections ?? [];
    const dedupedItems = dedupeExactInsights(
      sections.flatMap((section, sectionIndex) =>
        section.items.map((item, itemIndex) => ({
          ...item,
          sectionIndex,
          itemIndex,
        })),
      ),
      'PatternsScreen:fullLibrarySections',
    );
    const visibleItems = new Set(dedupedItems.map(item => `${item.sectionIndex}:${item.itemIndex}`));

    return sections
      .map((section, sectionIndex) => ({
        ...section,
        items: section.items.filter((_, itemIndex) => visibleItems.has(`${sectionIndex}:${itemIndex}`)),
      }))
      .filter(section => section.items.length > 0);
  }, [libraryState.librarySections]);
  const deepDiveInsights = useMemo<WeeklyDeepDiveDisplayItem[]>(() => {
    const narrativeRead = weeklyNarrative
      ? [{
          id: weeklyNarrative.id,
          title: weeklyNarrative.deepDiveTitle,
          body: weeklyNarrative.deepDiveBody,
          reflectionPrompt: weeklyNarrative.questionToKeep,
          patternKey: weeklyNarrative.id,
        }]
      : [];

    return [
      ...narrativeRead,
      ...premiumWeeklyDeepDive.map(insight => ({
        id: insight.id,
        title: insight.title,
        body: insight.body,
        whyItMayMatter: insight.whyItMayMatter,
        reframe: insight.reframe,
        reflectionPrompt: insight.reflectionPrompt,
        patternKey: insight.patternKey,
      })),
    ];
  }, [premiumWeeklyDeepDive, weeklyNarrative]);
  const patternRows = useMemo(
    () => (thisWeeksV2Pattern ? [thisWeeksV2Pattern] : []),
    [thisWeeksV2Pattern],
  );
  const visiblePatternRows = useMemo(
    () => (effectiveIsPremium ? patternRows : []),
    [effectiveIsPremium, patternRows],
  );
  const premiumTeaser = useMemo(
    () => getPersonalizedPremiumTeaser(archiveDepthCounts, {
      detectedPatterns: premiumPatterns.length || (thisWeeksV2Pattern && !thisWeeksV2Pattern.isEmptyState ? 1 : 0),
      surface: 'patterns',
    }),
    [archiveDepthCounts, premiumPatterns.length, thisWeeksV2Pattern],
  );
  const showFreePremiumPatternTeaser = premiumReady && moodInsightsEnabled && !effectiveIsPremium && !loading && snapshot.checkInCount >= 5;
  const showFreeBuildingArchive = premiumReady && moodInsightsEnabled && !effectiveIsPremium && !loading && snapshot.checkInCount >= 3 && snapshot.checkInCount < 5;

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={[styles.glowOrb, { top: -60, right: -60, backgroundColor: 'rgba(162, 194, 225, 0.12)' }]} />
        <View style={[styles.glowOrb, { bottom: 160, left: -120, backgroundColor: 'rgba(44, 54, 69, 0.08)' }]} />
      </View>

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <FlatList<PremiumThisWeekPatternItem>
          data={visiblePatternRows}
          keyExtractor={(item) => `${item.patternKey}:${item.id}`}
          renderItem={({ item }) => (
            <>
              <VelvetGlassSurface style={styles.insightCard} intensity={25}>
                <LinearGradient colors={['rgba(162, 194, 225, 0.20)', 'rgba(162, 194, 225, 0.05)']} style={StyleSheet.absoluteFill} />
                <View style={styles.cardHeader}>
                  <MetallicText style={styles.cardLabel} variant="gold">THIS WEEK'S PATTERN</MetallicText>
                  <View style={styles.confirmedBadge}>
                    <Text {...WRAP_AT_WORD_PROPS} style={styles.confirmedText}>{weeklyPatternBadgeLabel(item)}</Text>
                  </View>
                </View>
                <Text {...WRAP_AT_WORD_PROPS} style={styles.patternTitle}>{normalizeDisplayText(item.narrativeForward ? 'This Week Forward' : item.title)}</Text>
                <Text {...WRAP_AT_WORD_PROPS} style={styles.insightBody}>{compactDisplayText(item.narrativeForward ?? item.body, 460)}</Text>
                {item.reframe ? (
                  <View style={[styles.supportCallout, { marginTop: 14 }]}>
                    <Text {...WRAP_AT_WORD_PROPS} style={styles.supportCalloutLabel}>Clearer read</Text>
                    <Text {...WRAP_AT_WORD_PROPS} style={styles.supportCalloutBody}>{normalizeDisplayText(item.reframe)}</Text>
                  </View>
                ) : null}
                {item.narrativeQuestion ? (
                  <View style={[styles.supportCallout, { marginTop: 12 }]}>
                    <Text {...WRAP_AT_WORD_PROPS} style={styles.supportCalloutLabel}>Question to keep</Text>
                    <Text {...WRAP_AT_WORD_PROPS} style={styles.supportCalloutBody}>{normalizeDisplayText(item.narrativeQuestion)}</Text>
                  </View>
                ) : null}
              </VelvetGlassSurface>

              {/* Premium: Full Analysis CTA */}
              {effectiveIsPremium ? (
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    recordPatternMemory(
                      premiumWeeklyDeepDive.map((deepDive, index) =>
                        insightMemorySnapshotFromWeeklyDeepDive(deepDive, { rank: index }),
                      ),
                      'weekly-deep-dive',
                    );
                    setShowDeepDiveModal(true);
                  }}
                    style={styles.deepDiveButton}
                    accessibilityRole="button"
                    accessibilityLabel="See weekly deep dive"
                >
                  <LinearGradient colors={['rgba(168,139,235,0.25)', 'rgba(168,139,235,0.08)']} style={StyleSheet.absoluteFill} />
                  <View style={{ alignItems: 'center', flex: 1 }}>
                    <MetallicText style={[styles.deepDiveButtonTitle, { textAlign: 'center' }]} variant="gold">Open Weekly Deep Dive</MetallicText>
                    <Text {...WRAP_AT_WORD_PROPS} style={[styles.deepDiveButtonSub, { textAlign: 'center' }]}>Deeper reads from what kept showing up</Text>
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
                <GoldSubtitle style={styles.subtitle}>Recognition over time, grounded in your recent entries</GoldSubtitle>
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

              {effectiveIsPremium && premiumPersonaProfile ? (
                <>
                  <SectionHeader label="A PART OF YOU" icon="person-circle-outline" />
                  <PersonaProfileCard profile={premiumPersonaProfile} />
                </>
              ) : null}

              {effectiveIsPremium && weeklyNarrative ? (
                <>
                  <SectionHeader label="ACTIVE WEEKLY THEME" icon="git-network-outline" />
                  <VelvetGlassSurface style={styles.activeThemeCard} intensity={25}>
                    <LinearGradient colors={['rgba(168,139,235,0.16)', 'rgba(162,194,225,0.05)']} style={StyleSheet.absoluteFill} />
                    <Text {...WRAP_AT_WORD_PROPS} style={styles.activeThemeText}>
                      {normalizeDisplayText(weeklyNarrative.activeTheme)}
                    </Text>
                    {!thisWeeksV2Pattern?.narrativeQuestion ? (
                      <View style={[styles.supportCallout, { marginTop: 14 }]}>
                        <Text {...WRAP_AT_WORD_PROPS} style={styles.supportCalloutLabel}>Question to keep</Text>
                        <Text {...WRAP_AT_WORD_PROPS} style={styles.supportCalloutBody}>{normalizeDisplayText(weeklyNarrative.questionToKeep)}</Text>
                      </View>
                    ) : null}
                  </VelvetGlassSurface>
                </>
              ) : null}

              <SectionHeader label="THIS WEEK'S PATTERN" icon="radio-outline" />
              {showFreePremiumPatternTeaser && (
                <Pressable
                  onPress={() => router.push('/(tabs)/premium' as Href)}
                  accessibilityRole="button"
                  accessibilityLabel="Unlock weekly pattern insight"
                >
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
              {showFreeBuildingArchive && (
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
                  <Text {...WRAP_AT_WORD_PROPS} style={styles.emptyBody}>Something went wrong while reading your saved signals. Check your connection and try again.</Text>
                  <Pressable
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      hasLoadedSurfaceRef.current = false;
                      lastSurfaceLoadedAtRef.current = 0;
                      setLoadError(false);
                      setLoading(true);
                      setRefreshKey((value) => value + 1);
                    }}
                    style={styles.emptyActionButton}
                    accessibilityRole="button"
                    accessibilityLabel="Try loading patterns again"
                  >
                    <Text style={styles.emptyActionText}>Try again</Text>
                  </Pressable>
                </VelvetGlassSurface>
              ) : !loading && !moodInsightsEnabled ? (
                <VelvetGlassSurface style={styles.emptyCard} intensity={25}>
                  <LinearGradient colors={['rgba(162, 194, 225, 0.20)', 'rgba(162, 194, 225, 0.05)']} style={StyleSheet.absoluteFill} />
                  <Text {...WRAP_AT_WORD_PROPS} style={styles.emptyTitle}>Mood pattern insights are turned off</Text>
                  <Text {...WRAP_AT_WORD_PROPS} style={styles.emptyBody}>Turn on Mood Pattern Insights in Settings when you want recurring patterns from your check-ins.</Text>
                </VelvetGlassSurface>
              ) : !loading && !showFreePremiumPatternTeaser && !showFreeBuildingArchive && visiblePatternRows.length === 0 ? (
                <VelvetGlassSurface style={styles.emptyCard} intensity={25}>
                  <LinearGradient colors={['rgba(162, 194, 225, 0.20)', 'rgba(162, 194, 225, 0.05)']} style={StyleSheet.absoluteFill} />
                  <Text {...WRAP_AT_WORD_PROPS} style={styles.emptyTitle}>Not enough signal yet</Text>
                  <Text {...WRAP_AT_WORD_PROPS} style={styles.emptyBody}>A real pattern needs enough evidence. This space gets stronger as these signals overlap:</Text>
                  <View style={{ marginTop: 16, gap: 10 }}>
                    <Text {...WRAP_AT_WORD_PROPS} style={styles.emptyBody}>{'\u2022'} Check in with your mood, energy, and stress daily</Text>
                    <Text {...WRAP_AT_WORD_PROPS} style={styles.emptyBody}>{'\u2022'} Log sleep duration and dream notes</Text>
                    <Text {...WRAP_AT_WORD_PROPS} style={styles.emptyBody}>{'\u2022'} Write a journal entry when something feels important</Text>
                  </View>
                  <Text {...WRAP_AT_WORD_PROPS} style={[styles.emptyBody, { marginTop: 16, fontStyle: 'italic' }]}>3-5 days of check-ins usually gives enough repetition for a first real read.</Text>
                </VelvetGlassSurface>
              ) : null}
            </>
          )}
          ListFooterComponent={moodInsightsEnabled ? (
            <Pressable
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                if (!effectiveIsPremium) {
                  router.push('/(tabs)/premium' as Href);
                  return;
                }
                trackGrowthEvent('pattern_library_opened').catch(() => {});
                recordPatternMemory(
                  premiumPatterns.map((item, index) =>
                    insightMemorySnapshotFromPremiumPattern(item, {
                      surface: 'patterns',
                      rank: index,
                      isPrimary: index === 0,
                    }),
                  ),
                  'pattern-profile',
                );
                setPatternModalView('profile');
                setShowLibraryModal(true);
              }}
              style={styles.libraryButton}
              accessibilityRole="button"
              accessibilityLabel={effectiveIsPremium ? 'View pattern profile' : 'Unlock pattern profile'}
            >
              <LinearGradient colors={['rgba(44, 54, 69, 0.85)', 'rgba(26, 30, 41, 0.40)']} style={StyleSheet.absoluteFill} />
              <MetallicIcon name={effectiveIsPremium ? 'library-outline' : 'lock-closed-outline'} size={16} variant="gold" />
              <MetallicText style={styles.libraryButtonText} variant="gold">
                {effectiveIsPremium ? 'Open Pattern Profile' : 'Unlock Pattern Profile'}
              </MetallicText>
            </Pressable>
          ) : null}
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
        visible={effectiveIsPremium && showDeepDiveModal}
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
              A few deeper reads from your recent signals, chosen for what feels most useful to notice right now.
            </Text>
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.deepDiveScroll}
              contentContainerStyle={styles.deepDiveScrollContent}
              nestedScrollEnabled
            >
              {deepDiveInsights.map((insight) => (
                <View key={`${insight.patternKey ?? buildInsightDuplicateKey(insight)}:${insight.id}`} style={styles.deepDiveInsightCard}>
                  <LinearGradient colors={['rgba(162, 194, 225, 0.13)', 'rgba(162, 194, 225, 0.03)']} style={StyleSheet.absoluteFill} />
                  <Text {...WRAP_AT_WORD_PROPS} style={styles.deepDiveInsightTitle}>{insight.title}</Text>
                  <View style={styles.deepReadSections}>
                    {splitDeepReadSections(insight.body).map(section => (
                      <View key={section.label} style={styles.deepReadSection}>
                        <Text {...WRAP_AT_WORD_PROPS} style={styles.deepReadSectionLabel}>{section.label}</Text>
                        <Text {...WRAP_AT_WORD_PROPS} style={styles.deepDiveBody}>{compactDisplayText(section.body, 430)}</Text>
                      </View>
                    ))}
                    {insight.whyItMayMatter ? (
                      <View style={styles.deepReadSection}>
                        <Text {...WRAP_AT_WORD_PROPS} style={styles.deepReadSectionLabel}>Why it matters</Text>
                        <Text {...WRAP_AT_WORD_PROPS} style={styles.deepDiveBody}>{compactDisplayText(insight.whyItMayMatter, 360)}</Text>
                      </View>
                    ) : null}
                    {insight.reframe ? (
                      <View style={styles.deepReadSection}>
                        <Text {...WRAP_AT_WORD_PROPS} style={styles.deepReadSectionLabel}>Clearer read</Text>
                        <Text {...WRAP_AT_WORD_PROPS} style={styles.deepDiveBody}>{normalizeDisplayText(insight.reframe)}</Text>
                      </View>
                    ) : null}
                  </View>
                  {insight.reflectionPrompt ? (
                    <View style={styles.deepDivePrompt}>
                      <Text {...WRAP_AT_WORD_PROPS} style={styles.supportCalloutLabel}>Question to keep</Text>
                      <Text {...WRAP_AT_WORD_PROPS} style={styles.supportCalloutBody}>{normalizeDisplayText(insight.reflectionPrompt)}</Text>
                    </View>
                  ) : null}
                </View>
              ))}
            </ScrollView>
          </VelvetGlassSurface>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent
        visible={effectiveIsPremium && showLibraryModal}
        onRequestClose={() => setShowLibraryModal(false)}
      >
        <View style={[styles.modalBackdrop, styles.libraryModalBackdrop]}>
          <Pressable
            onPress={() => setShowLibraryModal(false)}
            style={StyleSheet.absoluteFill}
            accessibilityRole="button"
            accessibilityLabel="Close pattern profile"
          />
          <BlurView intensity={30} tint={theme.blurTint} style={StyleSheet.absoluteFill} />
          <VelvetGlassSurface style={[styles.modalCard, styles.libraryModalCard]} intensity={35}>
            <LinearGradient colors={['rgba(44, 54, 69, 0.92)', 'rgba(26, 30, 41, 0.72)']} style={StyleSheet.absoluteFill} />
            <View style={styles.modalHeader}>
              <MetallicText style={styles.modalTitle} variant="gold">
                {patternModalView === 'profile' ? 'Pattern Profile' : 'Pattern Library'}
              </MetallicText>
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setShowLibraryModal(false);
                  setSelectedPatternItem(null);
                }}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Close pattern profile"
              >
                <MetallicIcon name="close-outline" size={18} variant="gold" />
              </Pressable>
            </View>
            <View style={styles.modalTabs}>
              {([
                { key: 'profile' as const, label: 'Profile' },
                { key: 'library' as const, label: 'Library' },
              ]).map(tab => {
                const active = patternModalView === tab.key;
                return (
                  <Pressable
                    key={tab.key}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      setPatternModalView(tab.key);
                    }}
                    style={[styles.modalTab, active && styles.modalTabActive]}
                    accessibilityRole="button"
                    accessibilityLabel={`Show ${tab.label}`}
                  >
                    <Text style={[styles.modalTabText, active && styles.modalTabTextActive]}>{tab.label}</Text>
                  </Pressable>
                );
              })}
            </View>
            <ScrollView
              style={styles.libraryModalScroll}
              contentContainerStyle={styles.libraryModalScrollContent}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
            >
              {patternModalView === 'profile' ? (
                <>
                  <Text {...WRAP_AT_WORD_PROPS} style={styles.modalBody}>
                    {normalizeDisplayText(premiumPatternProfile?.subtitle ?? 'A deeper read will appear when enough distinct patterns repeat.')}
                  </Text>
                  {premiumPatternProfile ? (
                    <View style={styles.profileRead}>
                      {premiumPatternProfile.areaLabels.length > 0 ? (
                        <View style={styles.profileAreaChips}>
                          {premiumPatternProfile.areaLabels.map(label => (
                            <View key={label} style={styles.profileAreaChip}>
                              <Text {...WRAP_AT_WORD_PROPS} style={styles.profileAreaChipText}>{label}</Text>
                            </View>
                          ))}
                        </View>
                      ) : null}

                      <View style={styles.profilePortraitBlock}>
                        <Text {...WRAP_AT_WORD_PROPS} style={styles.profilePortraitTitle}>
                          {normalizeDisplayText(premiumPatternProfile.title)}
                        </Text>
                        <Text {...WRAP_AT_WORD_PROPS} style={styles.profilePortraitBody}>
                          {normalizeDisplayText(premiumPatternProfile.portrait)}
                        </Text>
                      </View>

                      {premiumPatternProfile.rootPattern ? (
                        <View style={styles.profileGrowthBlock}>
                          <Text {...WRAP_AT_WORD_PROPS} style={styles.profileSectionTitle}>
                            What this protects
                          </Text>
                          <Text {...WRAP_AT_WORD_PROPS} style={styles.profileSectionBody}>
                            {normalizeDisplayText(premiumPatternProfile.rootPattern.protects)}
                          </Text>
                          <Text {...WRAP_AT_WORD_PROPS} style={[styles.profileSectionTitle, { marginTop: 14 }]}>
                            What it costs
                          </Text>
                          <Text {...WRAP_AT_WORD_PROPS} style={styles.profileSectionBody}>
                            {normalizeDisplayText(premiumPatternProfile.rootPattern.costs)}
                          </Text>
                          <Text {...WRAP_AT_WORD_PROPS} style={[styles.profileSectionTitle, { marginTop: 14 }]}>
                            What helps it soften
                          </Text>
                          <Text {...WRAP_AT_WORD_PROPS} style={styles.profileSectionBody}>
                            {normalizeDisplayText(premiumPatternProfile.rootPattern.softens)}
                          </Text>
                        </View>
                      ) : null}

                      {premiumPatternProfile.sections.map(section => (
                        <View key={section.key} style={styles.profileSection}>
                          <Text {...WRAP_AT_WORD_PROPS} style={styles.profileSectionTitle}>{section.title}</Text>
                          <Text {...WRAP_AT_WORD_PROPS} style={styles.profileSectionBody}>{normalizeDisplayText(section.body)}</Text>
                        </View>
                      ))}

                      {premiumPatternProfile.growthOrRecovery ? (
                        <View style={styles.profileGrowthBlock}>
                          <Text {...WRAP_AT_WORD_PROPS} style={styles.profileSectionTitle}>
                            {premiumPatternProfile.growthOrRecovery.title}
                          </Text>
                          <Text {...WRAP_AT_WORD_PROPS} style={styles.profileSectionBody}>
                            {normalizeDisplayText(premiumPatternProfile.growthOrRecovery.body)}
                          </Text>
                        </View>
                      ) : null}

                      <View style={styles.supportCallout}>
                        <Text {...WRAP_AT_WORD_PROPS} style={styles.supportCalloutLabel}>Question to keep</Text>
                        <Text {...WRAP_AT_WORD_PROPS} style={styles.supportCalloutBody}>
                          {normalizeDisplayText(premiumPatternProfile.reflectionPrompt)}
                        </Text>
                      </View>

                      <Pressable
                        onPress={() => {
                          Haptics.selectionAsync().catch(() => {});
                          setPatternModalView('library');
                        }}
                        style={styles.profileLibraryLink}
                        accessibilityRole="button"
                        accessibilityLabel="Browse individual pattern reads"
                      >
                        <Text style={styles.profileLibraryLinkText}>Browse individual reads</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <Text {...WRAP_AT_WORD_PROPS} style={styles.modalBodyMuted}>
                      This profile will fill in as different kinds of signals start repeating.
                    </Text>
                  )}
                </>
              ) : (
                <>
                  <Text {...WRAP_AT_WORD_PROPS} style={styles.modalBody}>
                    {normalizeDisplayText('Short reads from the threads that keep returning. Open the ones that feel uncomfortably familiar.')}
                  </Text>
                  {fullLibrarySections.length > 0 ? (
                    <View style={styles.libraryList}>
                      {fullLibrarySections.map((section, sectionIndex) => (
                        <View key={`${section.title}-${sectionIndex}`} style={styles.librarySection}>
                          <Text {...WRAP_AT_WORD_PROPS} style={styles.librarySectionTitle}>{section.title}</Text>
                          {section.items.map((item, itemIndex) => (
                            <Pressable
                              key={`${section.title}-${buildInsightDuplicateKey(item)}-${itemIndex}`}
                              onPress={() => {
                                Haptics.selectionAsync().catch(() => {});
                                recordPatternOutcome(item, 'expanded');
                                setSelectedPatternItem(item);
                              }}
                              style={styles.libraryItem}
                              accessibilityRole="button"
                              accessibilityLabel={`Read more about ${item.title}`}
                            >
                              <Text {...WRAP_AT_WORD_PROPS} style={styles.libraryItemTitle}>{normalizeDisplayText(item.title)}</Text>
                              <Text {...WRAP_AT_WORD_PROPS} style={styles.libraryItemBody}>{compactDisplayText(item.body, 300)}</Text>
                            </Pressable>
                          ))}
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text {...WRAP_AT_WORD_PROPS} style={styles.modalBodyMuted}>The library will fill in as different kinds of signals start repeating.</Text>
                  )}
                </>
              )}
            </ScrollView>
            <Pressable
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setShowLibraryModal(false);
                setSelectedPatternItem(null);
              }}
              style={styles.modalCloseButton}
              accessibilityRole="button"
              accessibilityLabel="Done with pattern profile"
            >
              <LinearGradient colors={['rgba(44, 54, 69, 0.85)', 'rgba(26, 30, 41, 0.40)']} style={StyleSheet.absoluteFill} />
              <MetallicText style={styles.modalCloseButtonText} variant="gold">Done</MetallicText>
            </Pressable>
          </VelvetGlassSurface>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent
        visible={effectiveIsPremium && !!selectedPatternItem}
        onRequestClose={() => setSelectedPatternItem(null)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            onPress={() => setSelectedPatternItem(null)}
            style={StyleSheet.absoluteFill}
            accessibilityRole="button"
            accessibilityLabel="Close pattern read"
          />
          <BlurView intensity={30} tint={theme.blurTint} style={StyleSheet.absoluteFill} />
          {selectedPatternItem ? (
            <VelvetGlassSurface style={[styles.modalCard, styles.patternReadModalCard]} intensity={35}>
              <LinearGradient colors={['rgba(44, 54, 69, 0.94)', 'rgba(26, 30, 41, 0.78)']} style={StyleSheet.absoluteFill} />
              <View style={styles.modalHeader}>
                <MetallicText style={styles.modalTitle} variant="gold">Read Deeper</MetallicText>
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setSelectedPatternItem(null);
                  }}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                >
                  <MetallicIcon name="close-outline" size={18} variant="gold" />
                </Pressable>
              </View>
              <ScrollView showsVerticalScrollIndicator={false} style={styles.libraryModalScroll} contentContainerStyle={styles.libraryModalScrollContent}>
                <Text {...WRAP_AT_WORD_PROPS} style={styles.deepDiveInsightTitle}>{normalizeDisplayText(selectedPatternItem.title)}</Text>
                <Text {...WRAP_AT_WORD_PROPS} style={styles.modalBody}>
                  {normalizeDisplayText(selectedPatternItem.body)}
                </Text>
                {selectedPatternItem.protectiveStrategy ? (
                  <View style={[styles.supportCallout, { marginTop: 12 }]}>
                    <Text {...WRAP_AT_WORD_PROPS} style={styles.supportCalloutLabel}>Protective move</Text>
                    <Text {...WRAP_AT_WORD_PROPS} style={styles.supportCalloutBody}>
                      {normalizeDisplayText(selectedPatternItem.protectiveStrategy.insightLine)}
                    </Text>
                    <Text {...WRAP_AT_WORD_PROPS} style={[styles.supportCalloutLabel, { marginTop: 12 }]}>What it protects</Text>
                    <Text {...WRAP_AT_WORD_PROPS} style={styles.supportCalloutBody}>
                      {normalizeDisplayText(selectedPatternItem.protectiveStrategy.protects)}
                    </Text>
                    <Text {...WRAP_AT_WORD_PROPS} style={[styles.supportCalloutLabel, { marginTop: 12 }]}>What helps</Text>
                    <Text {...WRAP_AT_WORD_PROPS} style={styles.supportCalloutBody}>
                      {normalizeDisplayText(selectedPatternItem.protectiveStrategy.whatHelps[0] ?? selectedPatternItem.protectiveStrategy.softens)}
                    </Text>
                  </View>
                ) : null}
                {selectedPatternItem.clarityReframe ? (
                  <View style={[styles.supportCallout, { marginTop: 12 }]}>
                    <Text {...WRAP_AT_WORD_PROPS} style={styles.supportCalloutLabel}>Clearer read</Text>
                    <Text {...WRAP_AT_WORD_PROPS} style={styles.supportCalloutBody}>{normalizeDisplayText(selectedPatternItem.clarityReframe)}</Text>
                  </View>
                ) : null}
              </ScrollView>
            </VelvetGlassSurface>
          ) : null}
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

const PersonaProfileCard = ({ profile }: { profile: PremiumPersonaProfile }) => {
  const styles = useThemedStyles(createStyles);
  const strengths = profile.strengths.join(' ');
  const whatHelps = profile.whatHelps.join(' ');

  return (
    <VelvetGlassSurface style={styles.personaProfileCard} intensity={28}>
      <LinearGradient colors={['rgba(168,139,235,0.18)', 'rgba(107,144,128,0.06)']} style={StyleSheet.absoluteFill} />
      <View style={styles.cardHeader}>
        <MetallicText style={styles.cardLabel} variant="gold">{profile.label.toUpperCase()}</MetallicText>
        <View style={styles.personaBadge}>
          <Text {...WRAP_AT_WORD_PROPS} style={styles.personaBadgeText}>PREMIUM</Text>
        </View>
      </View>
      <Text {...WRAP_AT_WORD_PROPS} style={styles.patternTitle}>{normalizeDisplayText(profile.title)}</Text>
      <Text {...WRAP_AT_WORD_PROPS} style={styles.insightBody}>
        {normalizeDisplayText(profile.selectedSentence)}
      </Text>

      <View style={styles.personaSections}>
        <PersonaProfileSection label="Protective purpose" body={profile.protectivePurpose} />
        <PersonaProfileSection label="Strengths" body={strengths} />
        <PersonaProfileSection label="Growth edge" body={profile.growthEdge} />
        <PersonaProfileSection label="What helps" body={whatHelps} />
      </View>

      <View style={styles.supportCallout}>
        <Text {...WRAP_AT_WORD_PROPS} style={styles.supportCalloutLabel}>Reflection prompt</Text>
        <Text {...WRAP_AT_WORD_PROPS} style={styles.supportCalloutBody}>{normalizeDisplayText(profile.reflectionPrompt)}</Text>
      </View>
    </VelvetGlassSurface>
  );
};

const PersonaProfileSection = ({ label, body }: { label: string; body: string }) => {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.personaSection}>
      <Text {...WRAP_AT_WORD_PROPS} style={styles.personaSectionLabel}>{label}</Text>
      <Text {...WRAP_AT_WORD_PROPS} style={styles.personaSectionBody}>{normalizeDisplayText(body)}</Text>
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  safeArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 156 },
  header: { marginBottom: 32 },
  title: { fontSize: 32, fontWeight: '800', color: theme.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' },
  freshnessText: { marginTop: 8, fontSize: 12, color: theme.textSecondary },
  
  snapshotRow: { flexDirection: 'row', gap: 12, marginBottom: 32, alignItems: 'stretch' },
  metricCard: { flex: 1, height: 110, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 20, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  metricContent: { width: '100%', alignItems: 'center', justifyContent: 'center' },
  metricLabel: { width: '100%', fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.4)', letterSpacing: 1.2, marginBottom: 8, textAlign: 'center' },
  metricValue: { width: '100%', fontSize: 32, fontWeight: '700', color: theme.textPrimary, textAlign: 'center' },

  emptyCard: { borderRadius: 24, padding: 24, marginBottom: 24, overflow: 'hidden' },
  emptyTitle: { width: '100%', flexShrink: 1, color: theme.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptyBody: { width: '100%', flexShrink: 1, color: theme.textSecondary, fontSize: 14, lineHeight: 20 },
  emptyActionButton: { minHeight: 44, alignSelf: 'flex-start', marginTop: 18, paddingHorizontal: 18, borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : theme.cardSurface },
  emptyActionText: { color: theme.textPrimary, fontSize: 14, fontWeight: '700' },

  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  sectionHeaderLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2 },

  insightCard: { padding: 24, borderRadius: 22, marginBottom: 22, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  confirmedBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: 'rgba(107,144,128,0.15)', borderWidth: 1, borderColor: 'rgba(107,144,128,0.3)' },
  confirmedText: { flexShrink: 1, fontSize: 8, fontWeight: '800', color: '#6B9080' },
  lockedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: 'rgba(212,175,55,0.12)', borderWidth: 1, borderColor: 'rgba(212,175,55,0.25)' },
  lockedText: { fontSize: 8, fontWeight: '800', color: '#D4AF37' },
  patternTitle: { width: '100%', flexShrink: 1, fontSize: 17, lineHeight: 22, fontWeight: '800', color: theme.textPrimary, marginBottom: 10 },
  insightBody: { width: '100%', flexShrink: 1, fontSize: 14, color: 'rgba(255,255,255,0.68)', lineHeight: 22 },
  activeThemeCard: { padding: 20, borderRadius: 22, marginBottom: 24, overflow: 'hidden' },
  activeThemeText: { width: '100%', flexShrink: 1, fontSize: 16, lineHeight: 23, fontWeight: '700', color: theme.textPrimary },

  personaProfileCard: { padding: 28, borderRadius: 24, marginBottom: 28, overflow: 'hidden' },
  personaBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: 'rgba(168,139,235,0.15)', borderWidth: 1, borderColor: 'rgba(168,139,235,0.30)' },
  personaBadgeText: { flexShrink: 1, fontSize: 8, fontWeight: '800', color: '#A88BEB' },
  personaSections: { gap: 10, marginTop: 20 },
  personaSection: { padding: 14, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.045)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  personaSectionLabel: { width: '100%', flexShrink: 1, fontSize: 10, fontWeight: '800', color: 'rgba(212,175,55,0.86)', textTransform: 'uppercase', letterSpacing: 1 },
  personaSectionBody: { width: '100%', flexShrink: 1, marginTop: 6, fontSize: 13, lineHeight: 20, color: 'rgba(255,255,255,0.68)' },

  blurredInsightPreview: { padding: 32, gap: 10 },
  blurredInsightLine: { height: 14, borderRadius: 7, width: '95%', backgroundColor: 'rgba(255,255,255,0.25)' },

  supportCallout: { marginTop: 16, padding: 14, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.055)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  supportCalloutHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  supportCalloutLabel: { flexShrink: 1, fontSize: 11, fontWeight: '800', color: theme.textPrimary, textTransform: 'uppercase' },
  supportCalloutBody: { width: '100%', flexShrink: 1, fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 20 },

  libraryButton: { height: 60, borderRadius: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  libraryButtonText: { fontSize: 15, fontWeight: '700' },

  modalBackdrop: { flex: 1, justifyContent: 'center', paddingHorizontal: 20 },
  libraryModalBackdrop: { justifyContent: 'flex-end', paddingBottom: 42 },
  modalCard: { borderRadius: 24, padding: 22, overflow: 'hidden' },
  libraryModalCard: { maxHeight: '86%' },
  patternReadModalCard: { maxHeight: '82%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  modalTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  modalTab: {
    flex: 1,
    minHeight: 40,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  modalTabActive: {
    borderColor: 'rgba(212,175,55,0.32)',
    backgroundColor: 'rgba(212,175,55,0.10)',
  },
  modalTabText: {
    fontSize: 12,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.58)',
    letterSpacing: 0.5,
  },
  modalTabTextActive: {
    color: 'rgba(212,175,55,0.92)',
  },
  modalIntro: { width: '100%', flexShrink: 1, fontSize: 14, lineHeight: 21, color: 'rgba(255,255,255,0.72)', marginBottom: 14 },
  modalBody: { width: '100%', flexShrink: 1, fontSize: 15, lineHeight: 24, color: theme.textPrimary, marginBottom: 12 },
  modalStatus: { width: '100%', flexShrink: 1, fontSize: 12, fontWeight: '700', color: 'rgba(212,175,55,0.9)', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8 },
  modalBodyMuted: { width: '100%', flexShrink: 1, fontSize: 14, lineHeight: 22, color: 'rgba(255,255,255,0.62)' },
  profileRead: { marginTop: 8, gap: 14 },
  profileAreaChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 2 },
  profileAreaChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(212,175,55,0.10)', borderWidth: 1, borderColor: 'rgba(212,175,55,0.22)' },
  profileAreaChipText: { fontSize: 10, fontWeight: '800', color: 'rgba(212,175,55,0.92)', textTransform: 'uppercase', letterSpacing: 0.7 },
  profilePortraitBlock: { padding: 16, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.055)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  profilePortraitTitle: { width: '100%', flexShrink: 1, fontSize: 17, fontWeight: '800', color: theme.textPrimary, marginBottom: 10 },
  profilePortraitBody: { width: '100%', flexShrink: 1, fontSize: 15, lineHeight: 24, color: 'rgba(255,255,255,0.76)' },
  profileSection: { paddingVertical: 4 },
  profileSectionTitle: { width: '100%', flexShrink: 1, fontSize: 12, fontWeight: '800', color: 'rgba(212,175,55,0.92)', textTransform: 'uppercase', letterSpacing: 1 },
  profileSectionBody: { width: '100%', flexShrink: 1, marginTop: 8, fontSize: 15, lineHeight: 24, color: 'rgba(255,255,255,0.74)' },
  profileGrowthBlock: { marginTop: 2, padding: 16, borderRadius: 18, backgroundColor: 'rgba(107,144,128,0.10)', borderWidth: 1, borderColor: 'rgba(107,144,128,0.22)' },
  profileLibraryLink: { marginTop: 4, minHeight: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(212,175,55,0.24)', backgroundColor: 'rgba(212,175,55,0.08)' },
  profileLibraryLinkText: { fontSize: 12, fontWeight: '800', color: 'rgba(212,175,55,0.92)', textTransform: 'uppercase', letterSpacing: 0.7 },
  libraryModalScroll: { flexShrink: 1 },
  libraryModalScrollContent: { paddingBottom: 24 },
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
    borderRadius: 22, padding: 18, marginBottom: 24, overflow: 'hidden',
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
  heroMetricChipWide: {
    width: '100%',
    maxWidth: '100%',
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

  deepDiveModalCard: { maxHeight: '88%', paddingBottom: 18 },
  deepDiveScroll: { flexShrink: 1 },
  deepDiveScrollContent: { gap: 14, paddingTop: 2, paddingBottom: 20 },
  deepDiveInsightCard: {
    borderRadius: 18,
    padding: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  deepDiveInsightTitle: { width: '100%', flexShrink: 1, fontSize: 17, lineHeight: 22, fontWeight: '800', color: theme.textPrimary, marginBottom: 12 },
  deepDiveBody: { width: '100%', flexShrink: 1, fontSize: 14, lineHeight: 22, color: 'rgba(255,255,255,0.68)' },
  deepDivePrompt: { marginTop: 14, padding: 14, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.045)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  deepReadSections: { gap: 13 },
  deepReadSection: { gap: 6 },
  deepReadSectionLabel: {
    width: '100%',
    flexShrink: 1,
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(212,175,55,0.82)',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
});
