import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, Alert, ListRenderItemInfo, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';

import { Ionicons } from '@expo/vector-icons';
import { MetallicText } from '../../../components/ui/MetallicText';
import { MetallicIcon } from '../../../components/ui/MetallicIcon';
import { useRouter, Href } from 'expo-router';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/core';
import * as Haptics from '../../../utils/haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { theme } from '../../../constants/theme';

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
import { SkiaGradient as LinearGradient } from '../../../components/ui/SkiaGradient';
import { SkiaDynamicCosmos } from '../../../components/ui/SkiaDynamicCosmos';
import { DreamClusterMap } from '../../../components/ui/DreamClusterMap';

const PAGE_SIZE = 30;

const PALETTE = {
  gold: '#C9AE78',
  silverBlue: '#C9AE78',
  copper: '#CD7F5D',
  emerald: '#C9AE78',
  rose: '#D4A3B3',
  bg: '#0A0A0C',
  textMain: '#FFFFFF',
  glassBorder: 'rgba(255,255,255,0.08)',
  glassHighlight: 'rgba(255,255,255,0.12)',
};

// ── Mood helpers ──

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
      style={({ pressed }) => [styles.dreamCardWrapper, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
      accessibilityRole="button"
      accessibilityLabel={`Dream entry for ${formatDate(entry.date)}`}
    >
      <LinearGradient
        colors={['rgba(201,174,120,0.18)', 'transparent']}
        style={styles.dreamCard}
      >
        <View style={styles.dreamCardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.dreamCardDate}>{formatDate(entry.date)}</Text>
            {(moons || durationText) && (
              <View style={styles.dreamMeta}>
                {moons && <MetallicText color="#C9AE78" style={styles.dreamMoons}>{moons}</MetallicText>}
                {qualityLabel && <MetallicText color="#C9AE78" style={styles.dreamQualityLabel}>{qualityLabel}</MetallicText>}
                {durationText && <Text style={styles.dreamDuration}> · {durationText}</Text>}
              </View>
            )}
          </View>
          <MetallicIcon name="moon-outline" size={16} color="#C9AE78" />
        </View>
        {hasDream ? (
          <Text style={styles.dreamExcerpt} numberOfLines={3}>{entry.dreamText}</Text>
        ) : (
          <Text style={styles.dreamNone}>No dream recalled</Text>
        )}
      </LinearGradient>
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
  const handleLongPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    Alert.alert('Entry Options', undefined, [
      { text: 'Edit', onPress: () => onEdit(entry) },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(entry) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [entry, onEdit, onDelete]);
  return (
    <ObsidianJournalEntry
      title={entry.title}
      content={entry.content}
      dateLabel={formatDate(entry.date)}
      timeLabel={formatTime(entry.createdAt)}
      mood={entry.mood}
      isExpanded={isExpanded}
      onPress={() => void onEdit(entry)}
      onLongPress={handleLongPress}
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
  const [moodInsightsEnabled, setMoodInsightsEnabled] = useState(true);
  const [expandedEntryIds, setExpandedEntryIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'reflections' | 'dreams'>('reflections');
  const [sleepEntries, setSleepEntries] = useState<SleepEntry[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;
    const q = searchQuery.toLowerCase();
    return entries.filter(e =>
      (e.title || '').toLowerCase().includes(q) ||
      (e.content || '').toLowerCase().includes(q) ||
      (e.mood || '').toLowerCase().includes(q) ||
      (e.tags || []).some((t) => t.toLowerCase().includes(q))
    );
  }, [entries, searchQuery]);

  const filteredSleepEntries = useMemo(() => {
    if (!searchQuery.trim()) return sleepEntries.filter(e => !e.isDeleted);
    const q = searchQuery.toLowerCase();
    return sleepEntries.filter(e =>
      !e.isDeleted && (e.dreamText ?? '').toLowerCase().includes(q)
    );
  }, [sleepEntries, searchQuery]);

  const toggleBrowseSearch = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    setShowSearch(prev => {
      if (prev) setSearchQuery('');
      return !prev;
    });
  }, []);

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
      AsyncStorage.getItem('pref_mood_insights').then(v => {
        setMoodInsightsEnabled(v === null || v === '1');
      }).catch(() => {});
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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch {}
    setEditingEntry(undefined);
    setShowEntryModal(true);
  };

  const handleEditEntry = useCallback(async (entry: JournalEntry) => {
    try {
      Haptics.selectionAsync().catch(() => {});
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
      <Animated.View entering={FadeInDown.duration(1000)} style={styles.header}>
        <View>
          <Text style={styles.greeting}>Archive</Text>
          <GoldSubtitle style={styles.dateLabel}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}
          </GoldSubtitle>
        </View>
      </Animated.View>

      {/* ── Browse + Search ── */}
      {(totalCount > 0 || sleepEntries.length > 0) && (
        <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.filterSection}>
          <Pressable onPress={toggleBrowseSearch} style={styles.browseSectionHeader}>
            <MetallicIcon name="library-outline" size={18} color={PALETTE.gold} />
            <Text style={styles.browseSectionTitle}>Browse</Text>
            <MetallicIcon name={showSearch ? 'close-outline' : 'search-outline'} size={16} color={PALETTE.gold} style={{ marginLeft: 'auto' }} />
          </Pressable>
          {showSearch && (
            <Animated.View entering={FadeInDown.duration(300)} style={styles.searchContainer}>
              <Ionicons name="search-outline" size={16} color={theme.textMuted} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={activeTab === 'reflections' ? 'Search entries...' : 'Search dreams...'}
                placeholderTextColor={theme.textMuted}
                returnKeyType="search"
                autoCorrect={false}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                  <Ionicons name="close-circle-outline" size={16} color={theme.textMuted} />
                </Pressable>
              )}
            </Animated.View>
          )}
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
                {(() => {
                  const count = tab === 'reflections' ? totalCount : sleepEntries.length;
                  if (!count) return null;
                  return <Text style={[styles.segmentCount, activeTab === tab && styles.segmentCountActive]}>{count}</Text>;
                })()}
              </Pressable>
            ))}
          </View>
        </Animated.View>
      )}



      {activeTab === 'reflections' && isPremium && moodInsightsEnabled && patternInsights.length > 0 && (
        <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.insightsSection}>
          <SectionHeader title="Pattern Insights" icon="analytics-outline" />
          <Text style={styles.insightsSubtitle}>What your journal reveals over time</Text>

          {patternInsights.map((insight, idx) => {
            const isTransit = insight.type === 'transit_correlation';
            const accentColor = isTransit ? '#A89BC8' : '#C9AE78';
            const gradientColors: [string, string] = isTransit
              ? ['rgba(168,155,200,0.18)', 'rgba(10,10,12,0.9)']
              : ['rgba(201,174,120,0.18)', 'rgba(10,10,12,0.9)'];

            return (
              <LinearGradient key={`${insight.title}-${idx}`} colors={gradientColors} style={styles.insightCard}>
                <View style={styles.insightHeader}>
                  <MetallicIcon
                    name={(insight.icon ?? (isTransit ? 'planet-outline' : 'analytics-outline')) as any}
                    size={16}
                    color={accentColor}
                    style={{ marginRight: 8 }}
                  />
                  <View style={{ flex: 1, flexShrink: 1, overflow: 'hidden' }}>
                    <MetallicText color={accentColor} style={styles.insightTitle}>{insight.title}</MetallicText>
                  </View>
                  <View style={[styles.confidenceBadge, insight.confidence === 'strong' && styles.confidenceStrong, insight.confidence === 'suggested' && styles.confidenceSuggested]}>
                    <Text style={[styles.confidenceText, insight.confidence === 'suggested' && { color: PALETTE.gold }]}>{insight.confidence.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={styles.insightDescription}>{insight.description}</Text>
                {!!insight.evidence && <Text style={styles.insightEvidence}>{insight.evidence}</Text>}
                {!!insight.actionable && (
                  <Text style={[styles.insightActionable, { color: 'rgba(255,255,255,0.85)' }]}>{insight.actionable}</Text>
                )}
              </LinearGradient>
            );
          })}
        </Animated.View>
      )}

      {activeTab === 'reflections' && !isPremium && totalCount >= 5 && (
        <Animated.View entering={FadeInDown.delay(250).duration(600)} style={styles.insightsSection}>
          <Pressable onPress={() => router.push('/(tabs)/premium' as Href)} accessibilityRole="button" accessibilityLabel="See your patterns">
            <LinearGradient colors={['rgba(201,174,120,0.18)', 'rgba(10,10,12,0.9)']} style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <MetallicIcon name="analytics-outline" size={18} color={PALETTE.gold} />
                <MetallicText color="#C9AE78" style={styles.insightTitle}>Pattern Insights</MetallicText>
                <View style={[styles.premiumBadge, { marginLeft: 'auto' }]}>
                  <MetallicIcon name="sparkles-outline" size={10} color={PALETTE.gold} />
                  <Text style={styles.premiumBadgeText}>Deeper Sky</Text>
                </View>
              </View>
              <Text style={styles.insightDescription}>
                With {totalCount} entries, Deeper Sky can reveal which energy patterns lift your mood, when you tend to journal most, and what emotional themes keep appearing.
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 }}>
                <Text style={[styles.insightActionable, { marginTop: 0, color: PALETTE.gold }]}>Reveal your patterns</Text>
                <MetallicIcon name="arrow-forward-outline" size={14} color={PALETTE.gold} />
              </View>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      )}

      {activeTab === 'dreams' && isPremium && sleepEntries.some(e => e.dreamText) && (
        <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.insightsSection}>
          <SectionHeader title="Dream Symbols" icon="planet-outline" />
          <View style={styles.clusterCard}>
            <LinearGradient colors={['rgba(20, 24, 35, 0.8)', 'rgba(10, 12, 18, 0.95)']} style={StyleSheet.absoluteFill} />
            <View style={styles.clusterCardHeader}>
              <MetallicIcon name="planet-outline" size={14} color="#C9AE78" />
              <MetallicText color="#C9AE78" style={styles.clusterCardEyebrow}>RECURRING THEMES</MetallicText>
            </View>
            <DreamClusterMap height={280} />
          </View>
        </Animated.View>
      )}

      <View style={styles.entriesSection}>
        <SectionHeader
          title={searchQuery
            ? 'Search Results'
            : activeTab === 'reflections'
            ? 'Entries'
            : 'Dreams'}
          icon={activeTab === 'reflections' ? 'book-outline' : 'moon-outline'}
        />
        <View style={styles.entriesHeader}>
          <Text style={styles.entriesCount}>
            {activeTab === 'reflections'
              ? `${filteredEntries.length}${searchQuery ? ' found' : ''} · ${totalCount} total`
              : `${filteredSleepEntries.length}${searchQuery ? ' found' : ''} · ${sleepEntries.length} total`}
          </Text>
        </View>
      </View>
    </>
  ), [isPremium, patternInsights, totalCount, sleepEntries, router, searchQuery, filteredEntries.length, filteredSleepEntries.length, activeTab, showSearch, toggleBrowseSearch, setActiveTab, moodInsightsEnabled]);

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
            <LinearGradient colors={['rgba(201,174,120,0.07)', 'transparent']} style={styles.emptyCard}>
              <Ionicons name="moon-outline" size={48} color={theme.textMuted} style={{ marginBottom: 12 }} />
              <Text style={styles.emptyTitle}>No dreams found</Text>
              <Text style={styles.emptyDescription}>
                {searchQuery
                  ? `No dream entries matching "${searchQuery}".`
                  : 'No sleep entries yet. Visit the Sleep tab to start recording.'}
              </Text>
            </LinearGradient>
          </View>
        );
      }
      return (
        <View style={styles.emptyContainer}>
          <LinearGradient colors={['rgba(201,174,120,0.07)', 'transparent']} style={styles.emptyCard}>
            <Ionicons name="moon-outline" size={48} color={theme.textMuted} style={{ marginBottom: 12 }} />
            <Text style={styles.emptyTitle}>No dreams logged yet</Text>
            <Text style={styles.emptyDescription}>
              Visit the Sleep tab to record your nightly rest and dream experiences.
            </Text>
          </LinearGradient>
        </View>
      );
    }

    if (totalCount > 0 && filteredEntries.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <LinearGradient colors={['rgba(212,184,114,0.07)', 'transparent']} style={styles.emptyCard}>
            <Ionicons name="search-outline" size={48} color={theme.textMuted} style={{ marginBottom: 12 }} />
            <Text style={styles.emptyTitle}>No entries found</Text>
            <Text style={styles.emptyDescription}>
              {searchQuery
                ? `No entries matching "${searchQuery}".`
                : 'Start journaling to see your entries here.'}
            </Text>
          </LinearGradient>
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <LinearGradient colors={['rgba(212,184,114,0.07)', 'transparent']} style={styles.emptyCard}>
          <Ionicons name="book-outline" size={48} color={theme.textMuted} style={{ marginBottom: 12 }} />
          <Text style={styles.emptyTitle}>Start Your Journey</Text>
          <Text style={styles.emptyDescription}>Begin tracking your emotional patterns and personal insights</Text>
        </LinearGradient>
      </View>
    );
  }, [loading, activeTab, sleepEntries.length, filteredSleepEntries.length, totalCount, filteredEntries.length, searchQuery]);

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
      <SkiaDynamicCosmos />

      {/* Nebula depth — atmospheric glow orbs */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={[styles.glowOrb, { top: -60, right: -60, backgroundColor: 'rgba(110, 140, 180, 0.12)' }]} />
        <View style={[styles.glowOrb, { bottom: 160, left: -120, backgroundColor: 'rgba(217, 191, 140, 0.06)' }]} />
      </View>

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {showPremiumRequired ? (
          <FlatList
            data={[]}
            renderItem={null}
            contentContainerStyle={{ paddingBottom: 140 }}
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
            contentContainerStyle={{ paddingBottom: 140, paddingHorizontal: 24 }}
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
            contentContainerStyle={{ paddingBottom: 140, paddingHorizontal: 24 }}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.5}
            initialNumToRender={15}
            maxToRenderPerBatch={10}
            windowSize={7}
            removeClippedSubviews={true}
            showsVerticalScrollIndicator={false}
          />
        )}

        {!showPremiumRequired && activeTab === 'reflections' && (
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

// ── Section Header (matches Today screen) ────────────────────────────────

function SectionHeader({ title, icon }: { title: string; icon: string }) {
  return (
    <View style={sectionHeaderStyles.container}>
      <MetallicIcon name={icon as any} size={18} variant="gold" />
      <MetallicText style={sectionHeaderStyles.title} variant="gold">{title}</MetallicText>
    </View>
  );
}

const sectionHeaderStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
    marginTop: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
});

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

  // Header — matches Today screen
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 32,
  },
  greeting: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 4,
  },

  // Nebula glow orbs
  glowOrb: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    opacity: 0.6,
  },

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
  insightsTitle: { fontSize: 20, color: theme.textPrimary, marginBottom: 6, fontWeight: '700' },
  insightsSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 20, lineHeight: 20 },

  insightCard: {
    padding: 28,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
    marginBottom: 32,
  },
  insightHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  insightTitle: { fontSize: 14, fontWeight: '700', color: PALETTE.gold, letterSpacing: 1.5, textTransform: 'uppercase' },
  confidenceBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: 'transparent', marginLeft: 8, flexShrink: 0, overflow: 'visible' },
  confidenceStrong: { backgroundColor: 'rgba(110, 191, 139, 0.2)' },
  confidenceSuggested: { backgroundColor: 'transparent' },
  confidenceText: { fontSize: 10, textTransform: 'uppercase', fontWeight: '800', letterSpacing: 1.2 },
  insightDescription: { fontSize: 16, color: 'rgba(255,255,255,0.7)', lineHeight: 24, marginBottom: 12 },
  insightEvidence: { fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 22, marginBottom: 8 },
  insightActionable: { fontSize: 15, fontWeight: '600', marginTop: 6, lineHeight: 22 },

  filterSection: {
    marginBottom: 32,
  },
  browseSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
    marginTop: 8,
  },
  browseSectionTitle: {
    color: PALETTE.textMain,
    fontSize: 19,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
    paddingLeft: 12,
    paddingRight: 12,
    paddingVertical: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.textPrimary,
    padding: 0,
  },

  entriesSection: { marginBottom: 20 },
  entriesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: -12 },
  sectionTitle: {
    color: PALETTE.textMain,
    fontSize: 19,
    fontWeight: '700',
  },
  entriesCount: { fontSize: 12, color: 'rgba(255,255,255,0.4)', fontVariant: ['tabular-nums'], fontWeight: '600', letterSpacing: 0.5 },

  loadingContainer: { padding: 40, alignItems: 'center' },
  loadingText: { fontSize: 15, color: 'rgba(255,255,255,0.6)' },

  emptyContainer: { paddingVertical: 32 },
  emptyCard: { borderRadius: 24, padding: 40, alignItems: 'center', borderWidth: 1, borderColor: PALETTE.glassBorder },
  emptyTitle: { fontSize: 22, color: PALETTE.textMain, marginBottom: 8, fontWeight: '700' },
  emptyDescription: { fontSize: 16, color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 26 },

  entryCard: { borderRadius: 24, backgroundColor: 'rgba(212,184,114,0.10)', borderWidth: 1, borderColor: PALETTE.glassBorder, marginBottom: 16 },
  entryGradient: { padding: 28 },
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
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 6,
  },
  segmentBtnActive: {
    backgroundColor: `${PALETTE.gold}18`,
    borderWidth: 1,
    borderColor: `${PALETTE.gold}40`,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.35)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  segmentTextActive: {
    color: PALETTE.gold,
  },
  segmentCount: {
    fontSize: 8,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
    overflow: 'hidden',
    letterSpacing: 0.4,
  },
  segmentCountActive: {
    color: PALETTE.gold,
    backgroundColor: `${PALETTE.gold}22`,
  },

  // ── Dream card ──
  dreamCardWrapper: {
    marginBottom: 16,
  },
  dreamCard: {
    padding: 28,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
  },
  dreamCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  dreamCardDate: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  dreamMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dreamMoons: {
    fontSize: 14,
    color: '#C9AE78',
    letterSpacing: 1,
  },
  dreamQualityLabel: {
    fontSize: 12,
    color: 'rgba(201,174,120,0.7)',
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
    lineHeight: 26,
  },
  dreamNone: {
    fontSize: 16,
    color: theme.textMuted,
  },

  // ── Dream cluster card ──
  clusterCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
    overflow: 'hidden',
    padding: 20,
  },
  clusterCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  clusterCardEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
});

