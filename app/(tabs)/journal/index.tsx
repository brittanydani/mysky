import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, Alert, ListRenderItemInfo, Platform, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';

import { Ionicons } from '@expo/vector-icons';
import { MetallicText } from '../../../components/ui/MetallicText';
import { MetallicIcon } from '../../../components/ui/MetallicIcon';
import { useRouter, Href } from 'expo-router';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/core';
import * as Haptics from 'expo-haptics';

import { theme } from '../../../constants/theme';

import { GoldIcon } from '../../../components/ui/GoldIcon';
import PremiumRequiredScreen from '../../../components/PremiumRequiredScreen';
import { localDb } from '../../../services/storage/localDb';
import { JournalEntry, SleepEntry, generateId } from '../../../services/storage/models';
import JournalEntryModal from '../../../components/JournalEntryModal';
import { AdvancedJournalAnalyzer, PatternInsight, JournalEntryMeta, MoodLevel, TransitSnapshot } from '../../../services/premium/advancedJournal';
import { usePremium } from '../../../context/PremiumContext';
import { logger } from '../../../utils/logger';
import { parseLocalDate } from '../../../utils/dateUtils';
import ObsidianJournalEntry from '../../../components/ui/ObsidianJournalEntry';
import { analyzeJournalContent } from '../../../services/journal/nlp';
import { GoldSubtitle } from '../../../components/ui/GoldSubtitle';

const PAGE_SIZE = 30;

const PALETTE = {
  gold: '#D4B872',
  amethyst: '#9D76C1',
  bg: '#0A0A0C',
  glassBorder: 'rgba(255,255,255,0.08)',
};

// ── Mood helpers ──
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// ── Cinematic Palette ──

// ─── Dream card ───────────────────────────────────────────────────────────────

const DREAM_QUALITY_LABELS: Record<number, string> = {
  1: 'Exhausted',
  2: 'Restless',
  3: 'Neutral',
  4: 'Restored',
  5: 'Vibrant',
};

interface DreamCardProps {
  entry: SleepEntry;
  formatDate: (s: string) => string;
  onPress: (entry: SleepEntry) => void;
}

const DreamCard = memo(function DreamCard({ entry, formatDate, onPress }: DreamCardProps) {
  const hasDream = !!(entry.dreamText?.trim());
  const moons = entry.quality ? '☽'.repeat(entry.quality) : null;
  const qualityLabel = entry.quality ? DREAM_QUALITY_LABELS[entry.quality] : null;
  const durationText = entry.durationHours ? `${entry.durationHours}h` : null;

  return (
    <Pressable
      onPress={() => onPress(entry)}
      style={({ pressed }) => [styles.dreamCard, pressed && { opacity: 0.85 }]}
      accessibilityRole="button"
      accessibilityLabel={`Dream entry for ${formatDate(entry.date)}`}
    >
      <View style={styles.dreamCardInner}>
        <View style={styles.dreamAccentBar} />
        <View style={{ flex: 1 }}>
          <View style={styles.dreamCardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.dreamCardDate}>{formatDate(entry.date)}</Text>
              {(moons || durationText) && (
                <View style={styles.dreamMeta}>
                  {moons && <MetallicText color="#8BC4E8" style={styles.dreamMoons}>{moons}</MetallicText>}
                  {qualityLabel && <MetallicText color="#8BC4E8" style={styles.dreamQualityLabel}>{qualityLabel}</MetallicText>}
                  {durationText && <Text style={styles.dreamDuration}> · {durationText}</Text>}
                </View>
              )}
            </View>
            <MetallicIcon name="moon-outline" size={16} color="#8BC4E8" />
          </View>
          {hasDream ? (
            <Text style={styles.dreamExcerpt} numberOfLines={3}>{entry.dreamText}</Text>
          ) : (
            <Text style={styles.dreamNone}>No dream recalled</Text>
          )}
        </View>
      </View>
    </Pressable>
  );
});

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
  const router = useRouter();
  const { isPremium } = usePremium();

  const [showPremiumRequired] = useState(false);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [showEntryModal, setShowEntryModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | undefined>(undefined);

  const [patternInsights, setPatternInsights] = useState<PatternInsight[]>([]);
  const [expandedEntryIds, setExpandedEntryIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'reflections' | 'dreams'>('reflections');
  const [sleepEntries, setSleepEntries] = useState<SleepEntry[]>([]);

  // ── Month/Year filter ──
  const [filterMonth, setFilterMonth] = useState<number>(new Date().getMonth()); // 0-indexed
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEntries = useMemo(() => {
    let filtered = entries.filter(e => {
      const d = parseLocalDate(e.date);
      return d.getMonth() === filterMonth && d.getFullYear() === filterYear;
    });
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(e =>
        (e.title || '').toLowerCase().includes(q) ||
        (e.content || '').toLowerCase().includes(q) ||
        (e.mood || '').toLowerCase().includes(q) ||
        (e.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    }
    return filtered;
  }, [entries, filterMonth, filterYear, searchQuery]);

  const filteredSleepEntries = useMemo(() => {
    let filtered = sleepEntries.filter(e => {
      const d = parseLocalDate(e.date);
      return d.getMonth() === filterMonth && d.getFullYear() === filterYear;
    });
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(e =>
        (e.dreamText ?? '').toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [sleepEntries, filterMonth, filterYear, searchQuery]);

  // Available months for navigation (derived from entries)
  const navigateMonth = useCallback((direction: -1 | 1) => {
    Haptics.selectionAsync().catch(() => {});
    setFilterMonth(prev => {
      let newMonth = prev + direction;
      let newYear = filterYear;
      if (newMonth < 0) { newMonth = 11; newYear--; }
      if (newMonth > 11) { newMonth = 0; newYear++; }
      setFilterYear(newYear);
      return newMonth;
    });
  }, [filterYear]);

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
      void loadSleepEntries();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  useEffect(() => {
    if (entries.length >= 3) generatePatternInsights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries.length, isPremium]);

  const moodToLevel = useCallback((mood: string): MoodLevel => {
    const map: Record<string, MoodLevel> = {
      calm: 5,
      soft: 4,
      okay: 3,
      heavy: 2,
      stormy: 1,
    };
    return map[mood] ?? 3;
  }, []);

  const generatePatternInsights = useCallback(() => {
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
  }, [entries, isPremium, moodToLevel]);

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


  const loadSleepEntries = async () => {
    try {
      const charts = await localDb.getCharts();
      if (!charts.length) return;
      const all = await localDb.getSleepEntries(charts[0].id, 365);
      setSleepEntries(all.filter(e => !e.isDeleted));
    } catch (error) {
      logger.error('Failed to load sleep entries:', error);
    }
  };

  const handleAddEntry = async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stableFormatDate = useCallback((dateString: string) => {
    const date = parseLocalDate(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  const stableFormatTime = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }, []);

  const keyExtractor = useCallback((item: JournalEntry | SleepEntry) => item.id, []);

  const renderEntry = useCallback(({ item }: ListRenderItemInfo<JournalEntry>) => {
    return (
      <EntryCard
        entry={item}
        isExpanded={expandedEntryIds.has(item.id)}
        onToggle={toggleExpanded}
        onEdit={handleEditEntry}
        onDelete={handleDeleteEntry}
        formatDate={stableFormatDate}
        formatTime={stableFormatTime}
      />
    );
  }, [expandedEntryIds, toggleExpanded, handleEditEntry, handleDeleteEntry, stableFormatDate, stableFormatTime]);

  const renderDreamEntry = useCallback(({ item }: ListRenderItemInfo<SleepEntry>) => (
    <DreamCard
      entry={item}
      formatDate={stableFormatDate}
      onPress={(e) => router.push((`/(tabs)/journal/sleep-detail?id=${e.id}`) as Href)}
    />
  ), [stableFormatDate, router]);

  const handleEndReached = useCallback(() => {
    if (activeTab === 'reflections' && !loadingMore && hasMore) {
      void loadEntries(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, loadingMore, hasMore]);

  // ── List header ────────────────────────────────────────────────────────────

  const ListHeader = useMemo(() => (
    <>
      <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Archive</Text>
            <GoldSubtitle style={styles.subtitle}>Subconscious field · Pattern memory</GoldSubtitle>
          </View>
          <Pressable
            onPress={() => router.push('/(tabs)/insights' as Href)}
            accessibilityRole="button"
            accessibilityLabel="View pattern insights"
            style={{ paddingTop: 4 }}
          >
            <Ionicons name="analytics-outline" size={22} color={theme.textMuted} />
          </Pressable>
        </View>
      </Animated.View>

      {/* ── Month/Year Navigation + Search ── */}
      {(totalCount > 0 || sleepEntries.length > 0) && (
        <Animated.View entering={FadeInDown.delay(150).duration(600)} style={styles.filterSection}>
          {/* ── Tab Switcher ── */}
          <View style={styles.segmentedControl}>
            {(['reflections', 'dreams'] as const).map((tab) => (
              <Pressable
                key={tab}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setActiveTab(tab);
                }}
                style={[styles.segmentBtn, activeTab === tab && styles.segmentBtnActive]}
                accessibilityRole="button"
                accessibilityLabel={`Switch to ${tab} tab`}
              >
                {activeTab === tab ? (
                  <MetallicIcon
                    name={tab === 'reflections' ? 'book-outline' : 'moon-outline'}
                    size={14}
                    color="#D4B872"
                  />
                ) : (
                  <Ionicons
                    name={tab === 'reflections' ? 'book-outline' : 'moon-outline'}
                    size={14}
                    color="rgba(255,255,255,0.35)"
                  />
                )}
                {activeTab === tab ? (
                  <MetallicText color="#D4B872" style={[styles.segmentText, styles.segmentTextActive]}>
                    {tab === 'reflections' ? 'Reflections' : 'Dreams'}
                  </MetallicText>
                ) : (
                  <Text style={styles.segmentText}>
                    {tab === 'reflections' ? 'Reflections' : 'Dreams'}
                  </Text>
                )}
              </Pressable>
            ))}
          </View>
          <View style={styles.monthNav}>
            <Pressable
              onPress={() => navigateMonth(-1)}
              style={styles.monthNavBtn}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Previous month"
            >
              <Ionicons name="chevron-back-outline" size={20} color="rgba(255,255,255,0.5)" />
            </Pressable>
            <Text style={styles.monthLabel}>
              {MONTH_NAMES[filterMonth]} {filterYear}
            </Text>
            <Pressable
              onPress={() => navigateMonth(1)}
              style={styles.monthNavBtn}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Next month"
            >
              <Ionicons name="chevron-forward-outline" size={20} color="rgba(255,255,255,0.5)" />
            </Pressable>
          </View>
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={16} color={theme.textMuted} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={activeTab === 'reflections' ? 'Search entries...' : 'Search dreams...'}
              placeholderTextColor={theme.textMuted}
              returnKeyType="search"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                <Ionicons name="close-circle-outline" size={16} color={theme.textMuted} />
              </Pressable>
            )}
          </View>
        </Animated.View>
      )}



      {activeTab === 'reflections' && isPremium && patternInsights.length > 0 && (
        <Animated.View entering={FadeInDown.delay(250).duration(600)} style={styles.insightsSection}>
          <Text style={styles.insightsTitle}>Pattern Insights</Text>
          <Text style={styles.insightsSubtitle}>What your journal reveals over time</Text>

          {patternInsights.map((insight, idx) => {
            const isTransit = insight.type === 'transit_correlation';
            const colors = isTransit 
              ? ['rgba(157, 118, 193, 0.15)', 'rgba(74, 53, 89, 0.6)'] // Amethyst tone
              : ['rgba(232, 214, 174, 0.15)', 'rgba(122, 92, 19, 0.6)']; // Gold tone

            return (
              <View key={`${insight.title}-${idx}`} style={[styles.insightCard, { backgroundColor: colors[0] }]}>
                <View style={styles.insightHeader}>
                  <Text style={styles.insightTitle}>{insight.title}</Text>
                  <View style={[styles.confidenceBadge, insight.confidence === 'strong' && styles.confidenceStrong, insight.confidence === 'suggested' && styles.confidenceSuggested]}>
                    <Text style={styles.confidenceText}>{insight.confidence}</Text>
                  </View>
                </View>
                <Text style={styles.insightDescription}>{insight.description}</Text>
                {!!insight.evidence && <Text style={styles.insightEvidence}>{insight.evidence}</Text>}
                {!!insight.actionable && (
                  isTransit ? (
                    <MetallicText color="#D4A3B3" style={styles.insightActionable}>{insight.actionable}</MetallicText>
                  ) : (
                    <Text style={[styles.insightActionable, { color: theme.textGold }]}>{insight.actionable}</Text>
                  )
                )}
              </View>
            );
          })}
        </Animated.View>
      )}

      {activeTab === 'reflections' && !isPremium && totalCount >= 5 && (
        <Animated.View entering={FadeInDown.delay(250).duration(600)} style={styles.insightsSection}>
          <Pressable onPress={() => router.push('/(tabs)/premium' as Href)} accessibilityRole="button" accessibilityLabel="See your patterns">
            <View style={[styles.insightCard, { backgroundColor: 'rgba(232, 214, 174, 0.05)', borderColor: 'rgba(232, 214, 174, 0.3)', borderTopColor: theme.glass.highlight }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Ionicons name="analytics-outline" size={18} color={theme.textGold} />
                <Text style={styles.insightTitle}>Pattern Insights</Text>
                <View style={[styles.premiumBadge, { marginLeft: 'auto' }]}>
                  <Ionicons name="sparkles-outline" size={10} color={theme.textGold} />
                  <Text style={styles.premiumBadgeText}>Deeper Sky</Text>
                </View>
              </View>
              <Text style={styles.insightDescription}>
                With {totalCount} entries, Deeper Sky can reveal which energy patterns lift your mood, when you tend to journal most, and what emotional themes keep appearing.
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 }}>
                <Text style={[styles.insightActionable, { marginTop: 0, color: theme.textGold }]}>Reveal your patterns</Text>
                <Ionicons name="arrow-forward-outline" size={14} color={theme.textGold} />
              </View>
            </View>
          </Pressable>
        </Animated.View>
      )}

      <View style={styles.entriesSection}>
        <View style={styles.entriesHeader}>
          <Text style={styles.sectionTitle}>
            {searchQuery
              ? 'Search Results'
              : activeTab === 'reflections'
              ? `${MONTH_NAMES[filterMonth]} Entries`
              : `${MONTH_NAMES[filterMonth]} Dreams`}
          </Text>
          <Text style={styles.entriesCount}>
            {activeTab === 'reflections'
              ? `${filteredEntries.length}${searchQuery ? ' found' : ''} · ${totalCount} total`
              : `${filteredSleepEntries.length}${searchQuery ? ' found' : ''} · ${sleepEntries.length} total`}
          </Text>
        </View>
      </View>
    </>
  ), [isPremium, patternInsights, totalCount, sleepEntries.length, router, filterMonth, filterYear, searchQuery, filteredEntries.length, filteredSleepEntries.length, activeTab, navigateMonth, setActiveTab]);

  // ── List footer ────────────────────────────────────────────────────────────

  const ListFooter = useMemo(() => {
    if (activeTab === 'reflections' && loadingMore) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading more...</Text>
        </View>
      );
    }
    return null;
  }, [activeTab, loadingMore]);

  // ── List empty ─────────────────────────────────────────────────────────────

  const ListEmpty = useMemo(() => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading entries...</Text>
        </View>
      );
    }

    if (activeTab === 'dreams') {
      if (sleepEntries.length > 0 && filteredSleepEntries.length === 0) {
        return (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyCard, { backgroundColor: 'rgba(255, 255, 255, 0.03)' }]}>
              <Ionicons name="moon-outline" size={48} color={theme.textMuted} style={{ marginBottom: 12 }} />
              <Text style={styles.emptyTitle}>No dreams this month</Text>
              <Text style={styles.emptyDescription}>
                {searchQuery
                  ? `No dream entries matching "${searchQuery}" in ${MONTH_NAMES[filterMonth]} ${filterYear}.`
                  : `No sleep entries in ${MONTH_NAMES[filterMonth]} ${filterYear}. Try another month.`}
              </Text>
            </View>
          </View>
        );
      }
      return (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyCard, { backgroundColor: 'rgba(255, 255, 255, 0.03)' }]}>
            <Ionicons name="moon-outline" size={48} color={theme.textMuted} style={{ marginBottom: 12 }} />
            <Text style={styles.emptyTitle}>No dreams logged yet</Text>
            <Text style={styles.emptyDescription}>
              Visit the Sleep tab to record your nightly rest and dream experiences.
            </Text>
          </View>
        </View>
      );
    }

    if (totalCount > 0 && filteredEntries.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyCard, { backgroundColor: 'rgba(255, 255, 255, 0.03)' }]}>
            <Ionicons name="search-outline" size={48} color={theme.textMuted} style={{ marginBottom: 12 }} />
            <Text style={styles.emptyTitle}>No entries found</Text>
            <Text style={styles.emptyDescription}>
              {searchQuery
                ? `No entries matching "${searchQuery}" in ${MONTH_NAMES[filterMonth]} ${filterYear}.`
                : `No entries in ${MONTH_NAMES[filterMonth]} ${filterYear}. Try navigating to another month.`}
            </Text>
          </View>
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <View style={[styles.emptyCard, { position: 'relative', backgroundColor: 'rgba(255, 255, 255, 0.03)' }]}>
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
              <View 
                style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(201, 174, 120, 0.1)' }]}
              />
              <GoldIcon name="add-outline" size={28}  style={{ fontWeight: '900' }}  />
            </Pressable>
          </View>
          <Ionicons name="book-outline" size={48} color={theme.textMuted} style={{ marginBottom: 12 }} />
          <Text style={styles.emptyTitle}>Start Your Journey</Text>
          <Text style={styles.emptyDescription}>Begin tracking your emotional patterns and personal insights</Text>
        </View>
      </View>
    );
  }, [loading, activeTab, sleepEntries.length, filteredSleepEntries.length, totalCount, filteredEntries.length, searchQuery, filterMonth, filterYear]);

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
          tags: data.tags ?? editingEntry.tags,
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
          tags: data.tags,
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
        ) : activeTab === 'reflections' ? (
          <FlatList<JournalEntry>
            data={filteredEntries}
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
        ) : (
          <FlatList<SleepEntry>
            data={filteredSleepEntries}
            renderItem={renderDreamEntry}
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
          activeTab === 'reflections' && entries.length > 0 &&
          <JournalFAB onPress={() => void handleAddEntry()} />
        )}

        <JournalEntryModal
          visible={showEntryModal}
          onClose={() => setShowEntryModal(false)}
          onSave={handleSaveEntry}
          initialData={editingEntry}
        />
      </SafeAreaView>
    </View>
  );
}

// ── Luminous Journal FAB (identical to Today) ────────────────────────────────

function JournalFAB({ onPress }: { onPress: () => void }) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPressIn={() => { scale.value = withSpring(0.88, { mass: 0.5, damping: 12 }); }}
      onPressOut={() => { scale.value = withSpring(1, { mass: 0.5, damping: 12 }); }}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        onPress();
      }}
      style={journalFabStyles.container}
      accessibilityLabel="Add new journal entry"
      accessibilityRole="button"
    >
      <Animated.View style={[journalFabStyles.glowWrapper, animatedStyle]}>
        <BlurView intensity={60} tint="dark" style={journalFabStyles.glassCircle}>
          <MetallicIcon name="add-outline" size={28} variant="gold" />
        </BlurView>
      </Animated.View>
    </Pressable>
  );
}

const journalFabStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 120,
    right: 24,
    zIndex: 100,
  },
  glowWrapper: {
    shadowColor: '#D4B872',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 12,
  },
  glassCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 244, 214, 0.18)',
    overflow: 'hidden',
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020817' },
  safeArea: { flex: 1 },

  header: { marginTop: 24, marginBottom: 32 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 34, fontWeight: '800', color: theme.textPrimary, letterSpacing: -0.5, marginBottom: 4 },
  subtitle: { fontSize: 12, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '600' },

  chartTitle: {
    fontSize: 20,
    color: theme.textPrimary,
    fontWeight: '600',
    marginBottom: 4,
  },
  checkInTrendSection: { marginBottom: 32 },
  checkInTrendSubtitle: {
    fontSize: 13,
    color: theme.textSecondary,
    marginBottom: 20,
  },

  premiumBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'transparent', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  premiumBadgeText: { fontSize: 10, fontWeight: '700', color: theme.textGold },

  lockBox: {
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  lockTitle: { color: theme.textGold, marginTop: 12, fontWeight: '600', fontSize: 16 },
  lockSubtitle: { color: theme.textSecondary, fontSize: 14, marginTop: 6, textAlign: 'center', paddingHorizontal: 20 },

  insightsSection: { marginBottom: 32 },
  insightsTitle: { fontSize: 20, color: theme.textPrimary, marginBottom: 4, fontWeight: '700' },
  insightsSubtitle: { fontSize: 13, color: theme.textSecondary, marginBottom: 20 },

  insightCard: {
    padding: 28,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.02)',
    marginBottom: 16,
  },
  insightHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  insightTitle: { fontSize: 16, fontWeight: '700', color: theme.textPrimary, flex: 1 },
  confidenceBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: 'transparent', marginLeft: 12 },
  confidenceStrong: { backgroundColor: 'rgba(110, 191, 139, 0.2)' },
  confidenceSuggested: { backgroundColor: 'transparent' },
  confidenceText: { fontSize: 10, color: theme.textPrimary, textTransform: 'uppercase', fontWeight: '700', letterSpacing: 0.5 },
  insightDescription: { fontSize: 16, color: 'rgba(255,255,255,0.85)', lineHeight: 24, marginBottom: 10 },
  insightEvidence: { fontSize: 13, color: theme.textMuted, marginBottom: 8 },
  insightActionable: { fontSize: 14, fontWeight: '600', marginTop: 4 },

  filterSection: {
    marginBottom: 28,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 12,
  },
  monthNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.textPrimary,
    minWidth: 140,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingLeft: 8,
    paddingRight: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: theme.textPrimary,
    padding: 0,
  },

  entriesSection: { marginBottom: 28 },
  entriesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 20, color: theme.textPrimary, fontWeight: '700' },
  entriesCount: { fontSize: 14, color: theme.textMuted, fontVariant: ['tabular-nums'] },

  loadingContainer: { padding: 40, alignItems: 'center' },
  loadingText: { fontSize: 15, color: theme.textSecondary,  },

  emptyContainer: { paddingVertical: 32 },
  emptyCard: { borderRadius: 32, padding: 40, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  emptyTitle: { fontSize: 22, color: theme.textPrimary, marginBottom: 8, fontWeight: '700' },
  emptyDescription: { fontSize: 16, color: 'rgba(255,255,255,0.9)', textAlign: 'center', lineHeight: 24 },

  entryCard: { borderRadius: 32, backgroundColor: 'rgba(212,184,114,0.03)', borderWidth: 1, borderColor: 'rgba(212,184,114,0.12)', marginBottom: 16 },
  entryGradient: { padding: 24 },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  entryDate: { fontSize: 16, fontWeight: '600', color: theme.textPrimary },
  entryTime: { fontSize: 12, color: theme.textMuted },

  entryTitle: { fontSize: 18, color: theme.textPrimary, marginBottom: 8 },
  entryContent: { fontSize: 15, color: theme.textSecondary, lineHeight: 24 },
  expandButton: { alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.06)' },



  // ── Segmented control ──
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 4,
    marginBottom: 20,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  segmentBtnActive: {
    backgroundColor: 'rgba(212,184,114,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(212,184,114,0.25)',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.35)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  segmentTextActive: {
    color: '#D4B872',
  },

  // ── Dream card ──
  dreamCard: {
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(139,196,232,0.12)',
    backgroundColor: 'rgba(139,196,232,0.03)',
    marginBottom: 16,
  },
  dreamCardInner: {
    flexDirection: 'row',
    padding: 28,
  },
  dreamAccentBar: {
    width: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.20)',
    marginRight: 14,
  },
  dreamCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  dreamCardDate: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 4,
  },
  dreamMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dreamMoons: {
    fontSize: 13,
    color: '#8BC4E8',
    letterSpacing: 1,
  },
  dreamQualityLabel: {
    fontSize: 11,
    color: 'rgba(139,196,232,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '600',
    marginLeft: 6,
  },
  dreamDuration: {
    fontSize: 12,
    color: theme.textMuted,
  },
  dreamExcerpt: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 24,
  },
  dreamNone: {
    fontSize: 15,
    color: theme.textMuted,
  },
});

