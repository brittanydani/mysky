import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, Alert, Dimensions, ListRenderItemInfo, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from '../../components/ui/SkiaGradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Href } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/core';
import * as Haptics from 'expo-haptics';

import { theme } from '../../constants/theme';
import NebulaBackground from '../../components/ui/NebulaBackground';
import { GoldIcon } from '../../components/ui/GoldIcon';
import SkiaMetallicPill from '../../components/ui/SkiaMetallicPill';
import PremiumRequiredScreen from '../../components/PremiumRequiredScreen';
import { localDb } from '../../services/storage/localDb';
import { JournalEntry, generateId } from '../../services/storage/models';
import JournalEntryModal from '../../components/JournalEntryModal';
import { AdvancedJournalAnalyzer, PatternInsight, JournalEntryMeta, MoodLevel, TransitSnapshot } from '../../services/premium/advancedJournal';
import { usePremium } from '../../context/PremiumContext';
import { logger } from '../../utils/logger';
import { parseLocalDate } from '../../utils/dateUtils';
import { CheckInService } from '../../services/patterns/checkInService';
import { DailyCheckIn } from '../../services/patterns/types';
import CheckInTrendGraph from '../../components/ui/CheckInTrendGraph';
import ObsidianJournalEntry from '../../components/ui/ObsidianJournalEntry';
import { analyzeJournalContent } from '../../services/journal/nlp';
import SkiaDreamEngine from '../../components/ui/SkiaDreamEngine';
import SkiaBiometricScatter from '../../components/ui/SkiaBiometricScatter';
import SkiaVolatilityGraph from '../../components/ui/SkiaVolatilityGraph';
import SkiaDreamSymbolFrequency from '../../components/ui/SkiaDreamSymbolFrequency';
import PersonalInsightDashboard from '../../components/ui/PersonalInsightDashboard';
import { SleepEntry } from '../../services/storage/models';
import SkiaTagEnergyAnalysis from '../../components/ui/SkiaTagEnergyAnalysis';
import WordConstellation from '../../components/ui/WordConstellation';
import SentimentMismatchCard from '../../components/ui/SentimentMismatchCard';
import CharacterTracker from '../../components/ui/CharacterTracker';
import PatternInsightEngine from '../../components/ui/PatternInsightEngine';
import JournalFilterModal, { JournalFilterState, EMPTY_FILTER, isFilterActive, applyJournalFilter } from '../../components/JournalFilterModal';
import SkiaMoodTimeline from '../../components/ui/SkiaMoodTimeline';
import SkiaGaussianHeatmap from '../../components/ui/SkiaGaussianHeatmap';
import DreamPatternCard from '../../components/ui/DreamPatternCard';
import MonthlySynthesisCard from '../../components/ui/MonthlySynthesisCard';
import TimeOfDayPatternCard from '../../components/ui/TimeOfDayPatternCard';

const { width } = Dimensions.get('window');
const PAGE_SIZE = 30;

// ─── Mixed Feed Types ─────────────────────────────────────────────────────────

type FeedItem =
  | { type: 'journal'; id: string; date: string; data: JournalEntry }
  | { type: 'dream';   id: string; date: string; data: SleepEntry }
  | { type: 'monthly'; id: string; date: string; monthKey: string; entries: JournalEntry[]; prevEntries: JournalEntry[] };

function buildFeed(
  journalEntries: JournalEntry[],
  dreamEntries: SleepEntry[],
): FeedItem[] {
  // Merge journal + dream items sorted newest first
  const items: FeedItem[] = [
    ...journalEntries.map(e => ({ type: 'journal' as const, id: e.id, date: e.date, data: e })),
    ...dreamEntries.map(e => ({ type: 'dream' as const, id: `dream-${e.id}`, date: e.date, data: e })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  // Inject monthly synthesis at month boundaries (every time month changes going chronologically)
  const result: FeedItem[] = [];
  let currentMonth = '';
  const monthBuckets: Record<string, JournalEntry[]> = {};

  // Pre-bucket journal entries by month
  for (const e of journalEntries) {
    const mk = e.date.slice(0, 7); // YYYY-MM
    if (!monthBuckets[mk]) monthBuckets[mk] = [];
    monthBuckets[mk].push(e);
  }

  for (const item of items) {
    const itemMonth = item.date.slice(0, 7);
    if (itemMonth !== currentMonth) {
      // Inject synthesis card when we cross a completed month boundary
      if (currentMonth && monthBuckets[currentMonth] && monthBuckets[currentMonth].length >= 3) {
        const prevMonthKey = (() => {
          const [y, m] = currentMonth.split('-').map(Number);
          const pm = m === 1 ? 12 : m - 1;
          const py = m === 1 ? y - 1 : y;
          return `${py}-${String(pm).padStart(2, '0')}`;
        })();
        result.push({
          type: 'monthly',
          id: `monthly-${currentMonth}`,
          date: `${currentMonth}-01`,
          monthKey: currentMonth,
          entries: monthBuckets[currentMonth],
          prevEntries: monthBuckets[prevMonthKey] ?? [],
        });
      }
      currentMonth = itemMonth;
    }
    result.push(item);
  }

  return result;
}

// ── Cinematic Palette ──

// ─── Memoized entry card ───────────────────────────────────────────────────────

interface EntryCardProps {
  entry: JournalEntry;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  onEdit: (entry: JournalEntry) => void;
  onDelete: (entry: JournalEntry) => void;
  formatDate: (s: string) => string;
  formatTime: (s: string) => string;
}

const EntryCard = memo(function EntryCard({
  entry, isExpanded, onToggle, onEdit, onDelete, formatDate, formatTime,
}: EntryCardProps) {
  const wordCount = entry.contentWordCount ?? (entry.content || '').trim().split(/\s+/).filter(Boolean).length;
  return (
    <ObsidianJournalEntry
      title={entry.title}
      content={entry.content}
      dateLabel={formatDate(entry.date)}
      timeLabel={formatTime(entry.createdAt)}
      mood={entry.mood}
      isExpanded={isExpanded}
      onPress={() => void onEdit(entry)}
      onLongPress={() => void onDelete(entry)}
      wordCount={wordCount}
    />
  );
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function JournalScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isPremium } = usePremium();

  const [showPremiumRequired, setShowPremiumRequired] = useState(false);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [showEntryModal, setShowEntryModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | undefined>(undefined);

  const [patternInsights, setPatternInsights] = useState<PatternInsight[]>([]);
  const [checkIns, setCheckIns] = useState<DailyCheckIn[]>([]);
  const [sleepEntries, setSleepEntries] = useState<SleepEntry[]>([]);
  const [expandedEntryIds, setExpandedEntryIds] = useState<Set<string>>(new Set());
  const [showFilter, setShowFilter] = useState(false);
  const [currentFilter, setCurrentFilter] = useState<JournalFilterState>(EMPTY_FILTER);
  const [rangeKey, setRangeKey] = useState<'7D' | '30D' | '90D'>('30D');

  // Filtered entries derived from all loaded entries + current filter
  const filteredEntries = useMemo(
    () => applyJournalFilter(entries, checkIns, currentFilter),
    [entries, checkIns, currentFilter],
  );

  // Range-windowed check-ins for pattern charts
  const rangedCheckIns = useMemo(() => {
    const days = rangeKey === '7D' ? 7 : rangeKey === '30D' ? 30 : 90;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    return checkIns.filter(ci => ci.date >= cutoffStr);
  }, [checkIns, rangeKey]);

  const toggleExpanded = useCallback((id: string) => {
    setExpandedEntryIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadEntries(true);
      void loadCheckIns();
      void loadSleepEntries();
    }, [])
  );

  useEffect(() => {
    if (entries.length >= 3) generatePatternInsights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries.length, isPremium]);

  const formatDate = (dateString: string) => {
    const date = parseLocalDate(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const moodToLevel = (mood: string): MoodLevel => {
    const map: Record<string, MoodLevel> = {
      calm: 5,
      soft: 4,
      okay: 3,
      heavy: 2,
      stormy: 1,
    };
    return map[mood] ?? 3;
  };

  const generatePatternInsights = () => {
    try {
      const sample = entries.slice(0, 90);
      const entryMetas: JournalEntryMeta[] = sample.map((e) => {
        let transitSnapshot: TransitSnapshot | undefined;
        if (e.transitSnapshot) {
          try { transitSnapshot = JSON.parse(e.transitSnapshot); } catch {}
        }
        return {
          id: e.id,
          date: e.date,
          mood: { overall: moodToLevel(e.mood) },
          tags: [],
          wordCount: e.contentWordCount ?? (e.content || '').trim().split(/\s+/).filter(Boolean).length,
          transitSnapshot,
        };
      });

      const insights = AdvancedJournalAnalyzer.analyzePatterns(entryMetas, isPremium);
      setPatternInsights(insights);
    } catch (e) {
      logger.error('[Journal] Pattern analysis failed:', e);
    }
  };

  const loadEntries = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setHasMore(true);
        const [page, count] = await Promise.all([
          localDb.getJournalEntriesPaginated(PAGE_SIZE),
          localDb.getJournalEntryCount(),
        ]);
        setEntries(page);
        setTotalCount(count);
        setHasMore(page.length >= PAGE_SIZE);
      } else {
        if (loadingMore || !hasMore) return;
        setLoadingMore(true);
        const last = entries[entries.length - 1];
        const page = await localDb.getJournalEntriesPaginated(
          PAGE_SIZE,
          last?.date,
          last?.createdAt,
        );
        if (page.length < PAGE_SIZE) setHasMore(false);
        setEntries(prev => {
          const existingIds = new Set(prev.map(e => e.id));
          const newEntries = page.filter(e => !existingIds.has(e.id));
          return [...prev, ...newEntries];
        });
      }
    } catch (error) {
      logger.error('Failed to load journal entries:', error);
      Alert.alert('Error', 'Failed to load journal entries');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadCheckIns = async () => {
    try {
      const charts = await localDb.getCharts();
      const primaryChart = charts[0];
      if (!primaryChart) {
        setCheckIns([]);
        return;
      }
      const result = await CheckInService.getAllCheckIns(primaryChart.id, 90);
      setCheckIns(Array.isArray(result) ? result : []);
    } catch (error) {
      logger.error('Failed to load check-ins:', error);
      setCheckIns([]);
    }
  };

  const loadSleepEntries = async () => {
    try {
      const charts = await localDb.getCharts();
      const primaryChart = charts[0];
      if (!primaryChart) { setSleepEntries([]); return; }
      const result = await localDb.getSleepEntries(primaryChart.id, 30);
      setSleepEntries(Array.isArray(result) ? result : []);
    } catch (error) {
      logger.error('Failed to load sleep entries:', error);
      setSleepEntries([]);
    }
  };

  const handleAddEntry = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setEditingEntry(undefined);
    setShowEntryModal(true);
  };

  const handleEditEntry = useCallback(async (entry: JournalEntry) => {
    try {
      await Haptics.selectionAsync();
    } catch {}
    setEditingEntry(entry);
    setShowEntryModal(true);
  }, []);

  const handleDeleteEntry = useCallback(async (entry: JournalEntry) => {
    Alert.alert('Delete entry?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await localDb.deleteJournalEntry(entry.id);
            await loadEntries(true);
          } catch (error) {
            logger.error('Failed to delete journal entry:', error);
            Alert.alert('Error', 'Failed to delete entry');
          }
        },
      },
    ]);
  }, []);

  const stableFormatDate = useCallback(formatDate, []);
  const stableFormatTime = useCallback(formatTime, []);

  const keyExtractor = useCallback((item: FeedItem) => item.id, []);

  const renderEntry = useCallback(({ item }: ListRenderItemInfo<FeedItem>) => {
    if (item.type === 'dream') {
      return <DreamPatternCard entry={item.data} />;
    }
    if (item.type === 'monthly') {
      return (
        <MonthlySynthesisCard
          monthKey={item.monthKey}
          entries={item.entries}
          prevEntries={item.prevEntries}
        />
      );
    }
    // Default: journal entry
    return (
      <EntryCard
        entry={item.data}
        isExpanded={expandedEntryIds.has(item.data.id)}
        onToggle={toggleExpanded}
        onEdit={handleEditEntry}
        onDelete={handleDeleteEntry}
        formatDate={stableFormatDate}
        formatTime={stableFormatTime}
      />
    );
  }, [expandedEntryIds, toggleExpanded, handleEditEntry, handleDeleteEntry, stableFormatDate, stableFormatTime]);

  const handleEndReached = useCallback(() => {
    if (!loadingMore && hasMore) {
      void loadEntries(false);
    }
  }, [loadingMore, hasMore]);

  // ── List header ────────────────────────────────────────────────────────────

  const ListHeader = useMemo(() => (
    <>
      <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Subconscious Field</Text>
            <Text style={styles.subtitle}>ARCHIVE · ANALYTICS · PATTERN MEMORY</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            {sleepEntries.length >= 1 && (
              <Pressable
                onPress={() => router.push('/(tabs)/dream-engine' as Href)}
                style={styles.dreamFreqBtn}
                accessibilityRole="button"
                accessibilityLabel="Dream Frequency"
              >
                <Ionicons name="moon" size={14} color="#A286F2" />
                <Text style={styles.dreamFreqLabel}>Dream Frequency</Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => setShowFilter(true)}
              style={[styles.searchIconBtn, isFilterActive(currentFilter) && styles.searchIconBtnActive]}
              accessibilityRole="button"
              accessibilityLabel="Open search and filter"
            >
              <Ionicons
                name={isFilterActive(currentFilter) ? 'filter' : 'search-outline'}
                size={18}
                color={isFilterActive(currentFilter) ? '#C9AE78' : 'rgba(255,255,255,0.55)'}
              />
              {isFilterActive(currentFilter) && <View style={styles.filterActiveDot} />}
            </Pressable>
          </View>
        </View>

        <Text style={styles.poeticIntro}>
          Your private archive. Each entry becomes a data point in your personal pattern architecture — revealing what the conscious mind overlooks.
        </Text>
      </Animated.View>

      {/* ── Chart A: Mood Timeline ─────────────────────────────────────────── */}
      {isPremium && checkIns.length >= 3 && (
        <Animated.View entering={FadeInDown.delay(160).duration(600)} style={styles.checkInTrendSection}>
          <SkiaMoodTimeline checkIns={checkIns} width={width - 40} />
        </Animated.View>
      )}

      {/* ── Personal Insight Dashboard (premium, master card) ── */}
      {isPremium && (checkIns.length >= 4 || entries.length >= 3) && (
        <Animated.View entering={FadeInDown.delay(180).duration(600)} style={{ marginBottom: 24 }}>
          <PersonalInsightDashboard
            checkIns={checkIns}
            entries={entries}
            sleepEntries={sleepEntries}
          />
        </Animated.View>
      )}

      {checkIns.length >= 2 && (
        isPremium ? (
          <Animated.View entering={FadeInDown.delay(220).duration(600)} style={styles.checkInTrendSection}>
            <Text style={styles.chartTitle}>7-Day Mood Trends</Text>
            <Text style={styles.checkInTrendSubtitle}>From your daily weather check-ins</Text>
            <CheckInTrendGraph checkIns={checkIns} width={width - 40} />
          </Animated.View>
        ) : (
          <Pressable onPress={() => setShowPremiumRequired(true)} accessibilityRole="button" accessibilityLabel="Unlock 7-day check-in trends">
            <Animated.View entering={FadeInDown.delay(220).duration(600)} style={styles.checkInTrendSection}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={styles.chartTitle}>7-Day Mood Trends</Text>
                <View style={styles.premiumBadge}>
                  <Ionicons name="sparkles" size={10} color={theme.textGold} />
                  <Text style={styles.premiumBadgeText}>Deeper Sky</Text>
                </View>
              </View>
              <LinearGradient colors={['rgba(14,24,48,0.40)', 'rgba(2,8,23,0.60)']} style={styles.lockBox}>
                <Ionicons name="trending-up" size={36} color={theme.textGold} style={{ marginBottom: 8 }} />
                <Text style={styles.lockTitle}>Your trends are ready</Text>
                <Text style={styles.lockSubtitle}>See how your mood, energy, and stress shift across the week</Text>
              </LinearGradient>
            </Animated.View>
          </Pressable>
        )
      )}

      {/* ── Chart B: Gaussian Heatmap (Energy × Mood) ── */}
      {isPremium && checkIns.length >= 3 && (
        <Animated.View entering={FadeInDown.delay(240).duration(600)} style={styles.checkInTrendSection}>
          <SkiaGaussianHeatmap checkIns={checkIns} width={width - 40} />
        </Animated.View>
      )}

      {/* ── Emotional Volatility Graph (NEW) ── */}
      {isPremium && checkIns.length >= 3 && (
        <Animated.View entering={FadeInDown.delay(260).duration(600)} style={styles.checkInTrendSection}>
          <Text style={styles.chartTitle}>Emotional Volatility</Text>
          <Text style={styles.checkInTrendSubtitle}>Stability band · how much your mood fluctuates day to day</Text>
          <SkiaVolatilityGraph checkIns={checkIns} width={width - 40} />
        </Animated.View>
      )}

      {/* ── Subconscious Patterns \u2192 ── */}
      {isPremium && sleepEntries.length >= 1 && (
        <Animated.View entering={FadeInDown.delay(275).duration(600)} style={{ marginBottom: 12 }}>
          <Pressable
            onPress={() => router.push('/(tabs)/insights' as Href)}
            accessibilityRole="button"
            accessibilityLabel="View subconscious patterns"
          >
            <LinearGradient
              colors={['rgba(14, 24, 48, 0.50)', 'rgba(10, 18, 36, 0.35)']}
              style={{ borderRadius: 14, padding: 14, borderWidth: 1, borderColor: 'rgba(157,118,193,0.2)', flexDirection: 'row', alignItems: 'center', gap: 12 }}
            >
              <Ionicons name="moon-outline" size={20} color="#C4A0D8" />
              <View style={{ flex: 1 }}>
                <Text style={styles.chartTitle}>Subconscious Patterns</Text>
                <Text style={styles.checkInTrendSubtitle}>Dream symbol frequency \u00b7 archetypal analysis</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.35)" />
            </LinearGradient>
          </Pressable>
        </Animated.View>
      )}

      {/* ── Dream Symbol Frequency (NEW) ── */}
      {isPremium && sleepEntries.length >= 3 && (
        <Animated.View entering={FadeInDown.delay(280).duration(600)} style={styles.checkInTrendSection}>
          <SkiaDreamSymbolFrequency sleepEntries={sleepEntries} width={width - 40} />
        </Animated.View>
      )}

      {/* ── Tag Energy Analysis (Chart 6) ── */}
      {isPremium && checkIns.length >= 5 && (
        <Animated.View entering={FadeInDown.delay(290).duration(600)} style={styles.checkInTrendSection}>
          <SkiaTagEnergyAnalysis checkIns={checkIns} />
        </Animated.View>
      )}

      {/* ── Pattern Insight Engine (System 7) ── */}
      {isPremium && checkIns.length >= 7 && (
        <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.checkInTrendSection}>
          <PatternInsightEngine
            checkIns={checkIns}
            sleepEntries={sleepEntries}
            entries={entries}
          />
        </Animated.View>
      )}

      {/* ── Word Constellation (System 1) ── */}
      {isPremium && entries.length >= 4 && (
        <Animated.View entering={FadeInDown.delay(310).duration(600)} style={styles.checkInTrendSection}>
          <WordConstellation entries={entries} />
        </Animated.View>
      )}

      {/* ── Sentiment Mismatch Card (System 3) ── */}
      {isPremium && entries.length >= 4 && checkIns.length >= 4 && (
        <Animated.View entering={FadeInDown.delay(320).duration(600)} style={styles.checkInTrendSection}>
          <SentimentMismatchCard entries={entries} checkIns={checkIns} />
        </Animated.View>
      )}

      {/* ── Character Tracker (System 4) ── */}
      {isPremium && entries.length >= 4 && (
        <Animated.View entering={FadeInDown.delay(330).duration(600)} style={styles.checkInTrendSection}>
          <CharacterTracker entries={entries} checkIns={checkIns} />
        </Animated.View>
      )}

      {isPremium && patternInsights.length > 0 && (
        <Animated.View entering={FadeInDown.delay(250).duration(600)} style={styles.insightsSection}>
          <Text style={styles.insightsTitle}>Pattern Insights</Text>
          <Text style={styles.insightsSubtitle}>What your journal reveals over time</Text>

          {patternInsights.map((insight, idx) => {
            const isTransit = insight.type === 'transit_correlation';
            const colors = isTransit 
              ? ['rgba(157, 118, 193, 0.15)', 'rgba(74, 53, 89, 0.6)'] // Amethyst tone
              : ['rgba(232, 214, 174, 0.15)', 'rgba(122, 92, 19, 0.6)']; // Gold tone

            return (
              <LinearGradient key={`${insight.title}-${idx}`} colors={colors as any} style={styles.insightCard}>
                <View style={styles.insightHeader}>
                  <Text style={styles.insightTitle}>{insight.title}</Text>
                  <View style={[styles.confidenceBadge, insight.confidence === 'strong' && styles.confidenceStrong, insight.confidence === 'suggested' && styles.confidenceSuggested]}>
                    <Text style={styles.confidenceText}>{insight.confidence}</Text>
                  </View>
                </View>
                <Text style={styles.insightDescription}>{insight.description}</Text>
                {!!insight.evidence && <Text style={styles.insightEvidence}>{insight.evidence}</Text>}
                {!!insight.actionable && <Text style={[styles.insightActionable, { color: isTransit ? '#D4A3B3' : theme.textGold }]}>{insight.actionable}</Text>}
              </LinearGradient>
            );
          })}
        </Animated.View>
      )}

      {!isPremium && totalCount >= 5 && (
        <Animated.View entering={FadeInDown.delay(250).duration(600)} style={styles.insightsSection}>
          <Pressable onPress={() => router.push('/(tabs)/premium' as Href)} accessibilityRole="button" accessibilityLabel="See your patterns">
            <LinearGradient colors={['rgba(232, 214, 174, 0.10)', theme.cardGradientEnd]} style={[styles.insightCard, { borderColor: 'rgba(232, 214, 174, 0.18)', borderTopColor: theme.glass.highlight }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Ionicons name="analytics" size={18} color={theme.textGold} />
                <Text style={styles.insightTitle}>Pattern Insights</Text>
                <View style={[styles.premiumBadge, { marginLeft: 'auto' }]}>
                  <Ionicons name="sparkles" size={10} color={theme.textGold} />
                  <Text style={styles.premiumBadgeText}>Deeper Sky</Text>
                </View>
              </View>
              <Text style={styles.insightDescription}>
                With {totalCount} entries, Deeper Sky can reveal which energy patterns lift your mood, when you tend to journal most, and what emotional themes keep appearing.
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 }}>
                <Text style={[styles.insightActionable, { marginTop: 0, color: theme.textGold }]}>Reveal your patterns</Text>
                <Ionicons name="arrow-forward" size={14} color={theme.textGold} />
              </View>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      )}

      <View style={styles.entriesSection}>
        <View style={styles.entriesHeader}>
          <Text style={styles.sectionTitle}>
            {isFilterActive(currentFilter) ? 'Filtered Results' : 'Recent Entries'}
          </Text>
          <Pressable
            onPress={() => setShowFilter(true)}
            accessibilityRole="button"
            accessibilityLabel="Search and filter entries"
          >
            <Text style={styles.entriesCount}>
              {isFilterActive(currentFilter)
                ? `${filteredEntries.length} of ${totalCount}`
                : `${totalCount} entries`}
            </Text>
          </Pressable>
        </View>
      </View>
    </>
  ), [checkIns, sleepEntries, entries, isPremium, patternInsights, totalCount, router]);

  // ── List footer ────────────────────────────────────────────────────────────

  const ListFooter = useMemo(() => {
    if (loadingMore) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading more...</Text>
        </View>
      );
    }
    return null;
  }, [loadingMore]);

  // ── List empty ─────────────────────────────────────────────────────────────

  const ListEmpty = useMemo(() => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading entries...</Text>
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <LinearGradient colors={['rgba(14,24,48,0.40)', 'rgba(2,8,23,0.60)']} style={[styles.emptyCard, { position: 'relative' }]}>
          <View style={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}>
            <Pressable 
              onPress={() => void handleAddEntry()} 
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              style={({ pressed }) => [{
                width: 44,
                height: 44,
                borderRadius: 22,
                overflow: 'hidden',
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: 'rgba(201, 174, 120, 0.4)',
                backgroundColor: 'rgba(20, 30, 50, 0.5)',
              }, pressed && { opacity: 0.8 }]}
            >
              <LinearGradient 
                colors={['rgba(201, 174, 120, 0.25)', 'rgba(201, 174, 120, 0.05)']} 
                style={StyleSheet.absoluteFillObject}
              />
              <GoldIcon name="add" size={28}  style={{ fontWeight: '900' }}  />
            </Pressable>
          </View>
          <Ionicons name="book-outline" size={48} color={theme.textMuted} style={{ marginBottom: 12 }} />
          <Text style={styles.emptyTitle}>Start Your Journey</Text>
          <Text style={styles.emptyDescription}>Begin tracking your emotional patterns and personal insights</Text>
        </LinearGradient>
      </View>
    );
  }, [loading]);

  const handleSaveEntry = async (data: Partial<JournalEntry>) => {
    try {
      const nowIso = new Date().toISOString();
      const contentText = data.content ?? editingEntry?.content ?? '';
      const nlp = analyzeJournalContent(contentText);
      const nlpFields = {
        contentKeywords: JSON.stringify(nlp.keywords),
        contentEmotions: JSON.stringify(nlp.emotions),
        contentSentiment: JSON.stringify(nlp.sentiment),
        contentWordCount: nlp.wordCount,
        contentReadingMinutes: nlp.readingMinutes,
      };

      if (editingEntry?.id) {
        const updated: JournalEntry = {
          ...editingEntry,
          ...data,
          ...nlpFields,
          id: editingEntry.id,
          createdAt: editingEntry.createdAt ?? nowIso,
          updatedAt: nowIso,
          date: (data.date ?? editingEntry.date) as string,
          chartId: data.chartId ?? editingEntry.chartId,
          transitSnapshot: data.transitSnapshot ?? editingEntry.transitSnapshot,
        } as JournalEntry;

        await localDb.updateJournalEntry(updated);
      } else {
        const created: JournalEntry = {
          id: generateId(),
          title: data.title ?? '',
          content: data.content ?? '',
          mood: (data.mood ?? 'okay') as any,
          moonPhase: (data.moonPhase ?? 'new') as any,
          date: (data.date ?? parseLocalDate(nowIso).toISOString().slice(0, 10)) as any,
          createdAt: nowIso,
          updatedAt: nowIso,
          isDeleted: false,
          chartId: data.chartId,
          transitSnapshot: data.transitSnapshot,
          ...nlpFields,
        } as JournalEntry;

        await localDb.addJournalEntry(created);
      }

      setShowEntryModal(false);
      setEditingEntry(undefined);
      await loadEntries(true);
    } catch (error) {
      logger.error('Failed to save journal entry:', error);
      Alert.alert('Error', 'Failed to save entry');
    }
  };

  return (
    <View style={styles.container}>
      <NebulaBackground mood={5} energy={8} />
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {showPremiumRequired ? (
          <FlatList
            data={[]}
            renderItem={null}
            contentContainerStyle={{ paddingBottom: 120 }}
            ListHeaderComponent={
              <PremiumRequiredScreen
                feature="Check-In Trends"
                teaser="Visualize how your mood, energy, and stress shift over the past week — and discover which days you feel most aligned."
              />
            }
          />
        ) : (
          <FlatList
            data={isFilterActive(currentFilter)
              ? filteredEntries.map(e => ({ type: 'journal' as const, id: e.id, date: e.date, data: e }))
              : buildFeed(entries, sleepEntries)}
            renderItem={renderEntry}
            keyExtractor={keyExtractor}
            ListHeaderComponent={ListHeader}
            ListFooterComponent={ListFooter}
            ListEmptyComponent={ListEmpty}
            contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 20 }}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.5}
            initialNumToRender={15}
            maxToRenderPerBatch={10}
            windowSize={7}
            removeClippedSubviews={true}
            showsVerticalScrollIndicator={false}
          />
        )}

        {!showPremiumRequired && (
          entries.length > 0 && 
          <Animated.View
            entering={FadeInDown.delay(600).duration(600)}
            style={[styles.fabContainer, { bottom: insets.bottom + 20 }]}
          >
            <Pressable style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]} onPress={() => void handleAddEntry()} accessibilityRole="button" accessibilityLabel="Add new journal entry">
              <SkiaMetallicPill
                label=""
                onPress={() => void handleAddEntry()}
                height={60}
                borderRadius={30}
                icon={<Ionicons name="add" size={32} color="#020817" style={{ fontWeight: '900' }} />}
                style={{ width: 60 }}
              />
            </Pressable>
          </Animated.View>
        )}

        <JournalEntryModal
          visible={showEntryModal}
          onClose={() => setShowEntryModal(false)}
          onSave={handleSaveEntry}
          initialData={editingEntry}
        />

        <JournalFilterModal
          visible={showFilter}
          onClose={() => setShowFilter(false)}
          onApply={(f) => setCurrentFilter(f)}
          currentFilter={currentFilter}
          allEntries={entries}
          resultCount={applyJournalFilter(entries, checkIns, currentFilter).length}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020817' },
  safeArea: { flex: 1 },

  header: { paddingVertical: 20, marginBottom: 4 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 34, fontWeight: '700', color: theme.textPrimary, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }), letterSpacing: 0.4 },
  subtitle: { fontSize: 13, color: 'rgba(201,174,120,0.75)', fontStyle: 'italic', marginTop: 4, letterSpacing: 0.3 },
  poeticIntro: {
    fontSize: 14,
    color: theme.textMuted,
    lineHeight: 22,
    marginTop: 16,
  },

  // ── Module cards ──────────────────────────────────────────────────────────
  moduleSection: {
    marginBottom: 28,
  },
  moduleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  moduleTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.textPrimary,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
  moduleSubtitle: {
    fontSize: 13,
    color: theme.textMuted,
    fontStyle: 'italic',
    marginBottom: 16,
  },

  // ── Range toggle ──────────────────────────────────────────────────────────
  rangeToggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 28,
    alignSelf: 'center',
  },
  rangeBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  rangeBtnActive: {
    borderColor: 'rgba(201,174,120,0.55)',
    backgroundColor: 'rgba(201,174,120,0.12)',
  },
  rangeBtnLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.40)',
    letterSpacing: 0.8,
  },
  rangeBtnLabelActive: {
    color: '#C9AE78',
  },

  // ── Legacy chart styles (kept for backward compat) ────────────────────────
  chartTitle: {
    fontSize: 20,
    color: theme.textPrimary,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    marginBottom: 4,
  },
  checkInTrendSection: { marginBottom: 32 },
  checkInTrendSubtitle: {
    fontSize: 13,
    color: theme.textSecondary,
    fontStyle: 'italic',
    marginBottom: 20,
  },

  premiumBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'transparent', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  premiumBadgeText: { fontSize: 10, fontWeight: '700', color: theme.textGold },

  lockBox: {
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    borderTopColor: theme.glass.highlight,
  },
  lockTitle: { color: theme.textGold, marginTop: 12, fontWeight: '600', fontSize: 16 },
  lockSubtitle: { color: theme.textSecondary, fontSize: 14, marginTop: 6, textAlign: 'center', paddingHorizontal: 20 },

  insightsSection: { marginBottom: 32 },
  insightsTitle: { fontSize: 20, color: theme.textPrimary, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }), marginBottom: 4 },
  insightsSubtitle: { fontSize: 13, color: theme.textSecondary, fontStyle: 'italic', marginBottom: 20 },

  insightCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    borderTopColor: theme.glass.highlight,
    marginBottom: 12,
  },
  insightHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  insightTitle: { fontSize: 16, fontWeight: '600', color: theme.textPrimary, flex: 1 },
  confidenceBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: 'transparent', marginLeft: 12 },
  confidenceStrong: { backgroundColor: 'rgba(110, 191, 139, 0.2)' },
  confidenceSuggested: { backgroundColor: 'transparent' },
  confidenceText: { fontSize: 10, color: theme.textPrimary, textTransform: 'uppercase', fontWeight: '700', letterSpacing: 0.5 },
  insightDescription: { fontSize: 15, color: theme.textSecondary, lineHeight: 22, marginBottom: 10 },
  insightEvidence: { fontSize: 13, color: theme.textMuted, fontStyle: 'italic', marginBottom: 8 },
  insightActionable: { fontSize: 14, fontWeight: '600', marginTop: 4 },

  entriesSection: { marginBottom: 16 },
  entriesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 20, color: theme.textPrimary, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }) },
  entriesCount: { fontSize: 14, color: theme.textMuted, fontStyle: 'italic' },
  searchIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  searchIconBtnActive: {
    backgroundColor: 'rgba(201,174,120,0.12)',
    borderColor: 'rgba(201,174,120,0.30)',
  },
  filterActiveDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#C9AE78',
  },

  loadingContainer: { padding: 40, alignItems: 'center' },
  loadingText: { fontSize: 15, color: theme.textSecondary, fontStyle: 'italic' },

  emptyContainer: { paddingVertical: 32 },
  emptyCard: { borderRadius: 20, padding: 40, alignItems: 'center', borderWidth: 1, borderColor: theme.cardBorder, borderTopColor: theme.glass.highlight },
  emptyTitle: { fontSize: 22, color: theme.textPrimary, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }), marginBottom: 8 },
  emptyDescription: { fontSize: 15, color: theme.textSecondary, textAlign: 'center', lineHeight: 22 },

  entryCard: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: theme.cardBorder, borderTopColor: theme.glass.highlight, marginBottom: 16 },
  entryGradient: { padding: 20 },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  entryDate: { fontSize: 16, fontWeight: '600', color: theme.textPrimary },
  entryTime: { fontSize: 12, color: theme.textMuted },

  entryTitle: { fontSize: 18, color: theme.textPrimary, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }), marginBottom: 8 },
  entryContent: { fontSize: 15, color: theme.textSecondary, lineHeight: 24 },
  expandButton: { alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.06)' },

  fabContainer: { position: 'absolute', right: 20, zIndex: 1000 },
  fab: { width: 60, height: 60, borderRadius: 30, overflow: 'hidden', },
  fabPressed: { opacity: 0.9, transform: [{ scale: 0.95 }] },
  fabGradient: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  dreamFreqBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(162,134,242,0.1)', paddingHorizontal: 10,
    paddingVertical: 6, borderRadius: 14, borderWidth: 1,
    borderColor: 'rgba(162,134,242,0.25)',
  },
  dreamFreqLabel: {
    color: '#A286F2', fontSize: 11, fontWeight: '700',
  },
});

