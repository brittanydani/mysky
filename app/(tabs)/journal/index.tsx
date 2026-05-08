// File: app/(tabs)/journal.tsx
// MySky — Archive (Journal) Screen
//
// High-End "Lunar Sky" & "Midnight Slate" Aesthetic Update:
// 1. Purged "Muddy Gold" background gradients.
// 2. Implemented "Midnight Slate" for heavy anchor elements (Cluster Map, Action Sheet).
// 3. Implemented "Atmosphere" and "Nebula" washes for insight cards and dream entries.
// 4. Integrated "Velvet Glass" 1px directional light-catch borders globally.
// 5. Reserved Metallic Gold strictly for hardware elements and icons.

import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, Alert, ListRenderItemInfo, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { SkiaGradient as LinearGradient } from '../../../components/ui/SkiaGradient';

import { Ionicons } from '@expo/vector-icons';
import { MetallicText } from '../../../components/ui/MetallicText';
import { MetallicIcon } from '../../../components/ui/MetallicIcon';
import { useRouter, Href } from 'expo-router';
import Animated, { FadeInDown, Layout, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from '../../../utils/haptics';

import { type AppTheme } from '../../../constants/theme';

import PremiumRequiredScreen from '../../../components/PremiumRequiredScreen';
import { supabaseDb } from '../../../services/storage/supabaseDb';
import { JournalEntry, SleepEntry, generateId } from '../../../services/storage/models';
import JournalEntryModal from '../../../components/JournalEntryModal';
import { markTodayInsightsStale } from '../../../services/today/todayInsightRefresh';
import { AdvancedJournalAnalyzer, PatternInsight, JournalEntryMeta, MoodLevel, TransitSnapshot } from '../../../services/premium/advancedJournal';
import { usePremium } from '../../../context/PremiumContext';
import { logger } from '../../../utils/logger';
import { parseLocalDate, toLocalDateString } from '../../../utils/dateUtils';
import ObsidianJournalEntry from '../../../components/ui/ObsidianJournalEntry';
import { analyzeJournalContent } from '../../../services/journal/nlp';
import { GoldSubtitle } from '../../../components/ui/GoldSubtitle';
import { SkiaDynamicCosmos } from '../../../components/ui/SkiaDynamicCosmos';
import { PremiumSegmentedControl } from '../../../components/ui/PremiumSegmentedControl';
import { useAppTheme, useThemedStyles } from '../../../context/ThemeContext';
import { hasDreamContent } from '../../../utils/dreamArchiveSummary';
import { getPersonalizedPremiumTeaser } from '../../../utils/archiveDepth';
import { ErrorBoundary } from '../../../components/ErrorBoundary';
import { MAX_JOURNAL_TAGS } from '../../../services/validation/schemas';

const VALID_MOODS = ['calm', 'soft', 'okay', 'heavy', 'stormy'] as const;

function isValidDateValue(date: Date): boolean {
  return !Number.isNaN(date.getTime());
}

function normalizeJournalTags(tags: JournalEntry['tags']): JournalEntry['tags'] {
  if (!Array.isArray(tags)) return undefined;

  const normalized = Array.from(new Set(tags.filter((t): t is string => typeof t === 'string')))
    .slice(0, MAX_JOURNAL_TAGS);

  return normalized.length > 0 ? normalized : undefined;
}

function sanitizeJournalEntryForEdit(entry: JournalEntry): JournalEntry {
  const parsedEntryDate = parseLocalDate(String(entry.date ?? ''));
  const safeEntryDate = isValidDateValue(parsedEntryDate)
    ? String(entry.date)
    : toLocalDateString();
  const parsedCreatedAt = new Date(String(entry.createdAt ?? ''));
  const safeCreatedAt = isValidDateValue(parsedCreatedAt)
    ? String(entry.createdAt)
    : new Date().toISOString();

  return {
    ...entry,
    date: safeEntryDate,
    createdAt: safeCreatedAt,
    title: typeof entry.title === 'string' ? entry.title : '',
    content: typeof entry.content === 'string' ? entry.content : '',
    mood: (VALID_MOODS as readonly string[]).includes(entry.mood as string)
      ? entry.mood
      : ('okay' as any),
    tags: normalizeJournalTags(entry.tags),
  };
}

const PAGE_SIZE = 30;
const DAY_MS = 86_400_000;
const JOURNAL_FOCUS_REFRESH_CACHE_MS = 60 * 1000;

// ── Cinematic Palette ──
const PALETTE = {
  gold: '#D4AF37',       // Metallic Brand Gold
  atmosphere: '#A2C2E1', // Icy Blue
  slateMid: '#2C3645',   // Anchor Slate Top
  slateDeep: '#1A1E29',  // Anchor Slate Bottom
  nebula: '#A88BEB',     // Dreams
  sage: '#6B9080',       // Growth
  bg: '#0A0A0F',
  textMain: '#FFFFFF',
};

const LIGHT_MODE_INK = '#1A1815';
const LIGHT_MODE_META = 'rgba(26, 24, 21, 0.5)';

// ─── Dream card ───────────────────────────────────────────────────────────────

const DREAM_QUALITY_LABELS: Record<number, string> = {
  1: 'Exhausted',
  2: 'Restless',
  3: 'Neutral',
  4: 'Restored',
  5: 'Vibrant',
};

function formatTitleCaseSegment(segment: string): string {
  const SMALL_WORDS = new Set(['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'if', 'in', 'nor', 'of', 'on', 'or', 'per', 'the', 'to', 'vs', 'via']);
  return segment
    .split(/(\s+)/)
    .map((part, index, all) => {
      if (!part.trim()) return part;
      const normalized = part.toLowerCase();
      const isFirst = index === 0;
      const isLast = index === all.length - 1;
      if (!isFirst && !isLast && SMALL_WORDS.has(normalized)) {
        return normalized;
      }
      return normalized.charAt(0).toUpperCase() + normalized.slice(1);
    })
    .join('');
}

function normalizeJournalTitle(title?: string): string {
  const trimmed = (title ?? '').trim().replace(/\s+/g, ' ');
  if (!trimmed) return '';
  return trimmed
    .split(/([:–—-])/)
    .map((segment) => (/^[:–—-]$/.test(segment) ? segment : formatTitleCaseSegment(segment)))
    .join('')
    .replace(/\s+([:–—-])/g, ' $1')
    .replace(/([:–—-])\s+/g, '$1 ')
    .trim();
}

interface DreamCardProps {
  entry: SleepEntry;
  formatDate: (s: string) => string;
  onPress: (entry: SleepEntry) => void;
  onLongPress: (entry: SleepEntry) => void;
}

const DreamCard = memo(function DreamCard({ entry, formatDate, onPress, onLongPress }: DreamCardProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const textContent = entry.dreamText?.trim() || entry.notes?.trim() || '';
  const hasText = !!textContent;
  const hasDreamData = hasText || !!entry.dreamFeelings?.trim() || !!entry.dreamMetadata?.trim() || !!entry.dreamMood?.trim();
  const quality = Math.max(0, Math.min(5, entry.quality ?? 0));
  const moons = quality > 0 ? '☽'.repeat(quality) : null;
  const remainingMoons = quality > 0 ? '☽'.repeat(5 - quality) : null;
  const qualityLabel = entry.quality ? DREAM_QUALITY_LABELS[entry.quality] : null;
  const durationText = entry.durationHours ? `${entry.durationHours}h` : null;
  const skipNextPressRef = useRef(false);

  return (
    <Pressable
      onPress={() => {
        if (skipNextPressRef.current) {
          skipNextPressRef.current = false;
          return;
        }
        onPress(entry);
      }}
      onLongPress={() => {
        skipNextPressRef.current = true;
        onLongPress(entry);
      }}
      style={({ pressed }) => [styles.dreamCardWrapper, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
      accessibilityRole="button"
      accessibilityLabel={`Dream entry for ${formatDate(entry.date)}`}
      accessibilityHint="Double tap to open. Long press for edit or delete options."
    >
      <LinearGradient
        colors={theme.isDark ? ['rgba(168, 139, 235, 0.12)', 'rgba(168, 139, 235, 0.03)'] : ['rgba(168, 139, 235, 0.18)', 'transparent']}
        style={[styles.dreamCard, theme.isDark && styles.velvetBorder]}
      >
        <View style={styles.dreamCardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.dreamCardDate}>{formatDate(entry.date)}</Text>
            {(moons || durationText) && (
              <View style={styles.dreamMeta}>
                {moons && (
                  <View style={styles.dreamMoonsRow}>
                    <MetallicText color={PALETTE.gold} style={styles.dreamMoons}>{moons}</MetallicText>
                    {!!remainingMoons && <Text style={[styles.dreamMoonsEmpty, !theme.isDark && styles.dreamMoonsEmptyLight]}>{remainingMoons}</Text>}
                  </View>
                )}
                {qualityLabel && <MetallicText color={PALETTE.gold} style={styles.dreamQualityLabel}>{qualityLabel}</MetallicText>}
                {durationText && <Text style={styles.dreamDuration}> · {durationText}</Text>}
              </View>
            )}
          </View>
          <MetallicIcon name="moon-outline" size={16} color={PALETTE.gold} />
        </View>
        {hasText ? (
          <Text style={styles.dreamExcerpt} numberOfLines={3}>{textContent}</Text>
        ) : hasDreamData ? (
          <Text style={styles.dreamExcerpt} numberOfLines={1}>Selected dream themes or feelings</Text>
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
  onToggleExpand: (entryId: string) => void;
  onOpenActions: (entry: JournalEntry) => void;
  formatDate: (s: string) => string;
  formatTime: (s: string) => string;
}

const EntryCard = memo(function EntryCard({
  entry, isExpanded, onToggleExpand, onOpenActions, formatDate, formatTime,
}: EntryCardProps) {
  const wordCount = entry.contentWordCount ?? (entry.content || '').trim().split(/\s+/).filter(Boolean).length;
  const handleToggleExpand = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    onToggleExpand(entry.id);
  }, [entry.id, onToggleExpand]);
  const handleOpenActions = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    onOpenActions(entry);
  }, [entry, onOpenActions]);
  return (
    <Animated.View layout={Layout.duration(180)}>
      <ObsidianJournalEntry
        title={entry.title}
        content={entry.content}
        dateLabel={formatDate(entry.date)}
        timeLabel={formatTime(entry.createdAt)}
        mood={entry.mood}
        isExpanded={isExpanded}
        onToggleExpand={handleToggleExpand}
        onOpenActions={handleOpenActions}
        wordCount={wordCount}
      />
    </Animated.View>
  );
});

// ─── Main screen ──────────────────────────────────────────────────────────────

function JournalContent() {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const { isPremium } = usePremium();
  const reflectionsListRef = useRef<FlatList<JournalEntry> | null>(null);
  const entriesRef = useRef<JournalEntry[]>([]);
  const hasMoreRef = useRef(true);
  const loadingMoreRef = useRef(false);
  const hasLoadedJournalRef = useRef(false);
  const lastJournalLoadedAtRef = useRef(0);

  const [showPremiumRequired] = useState(false);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const [showEntryModal, setShowEntryModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | undefined>(undefined);
  const [actionEntry, setActionEntry] = useState<JournalEntry | null>(null);

  const [patternInsights, setPatternInsights] = useState<PatternInsight[]>([]);
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);
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
      !e.isDeleted && (
        (e.dreamText ?? '').toLowerCase().includes(q) ||
        (e.dreamFeelings ?? '').toLowerCase().includes(q)
      )
    );
  }, [sleepEntries, searchQuery]);

  const archiveDepthCounts = useMemo(() => ({
    journalEntries: totalCount,
    dreamEntries: sleepEntries.filter((entry) => !entry.isDeleted && hasDreamContent(entry)).length,
  }), [sleepEntries, totalCount]);
  const visiblePatternInsights = useMemo<PatternInsight[]>(
    () => patternInsights.filter(i => i.type !== 'transit_correlation' && i.icon !== 'moon-outline' && i.icon !== 'planet-outline'),
    [patternInsights],
  );
  const premiumTeaser = useMemo(
    () => getPersonalizedPremiumTeaser(archiveDepthCounts, {
      detectedPatterns: visiblePatternInsights.length,
      surface: 'archive',
    }),
    [archiveDepthCounts, visiblePatternInsights.length],
  );

  const weeklyReflectionInsight = useMemo<PatternInsight>(() => {
    const today = toLocalDateString();
    const todayDate = new Date(`${today}T12:00:00`);
    const currentStart = toLocalDateString(new Date(todayDate.getTime() - 6 * DAY_MS));
    const previousStart = toLocalDateString(new Date(todayDate.getTime() - 13 * DAY_MS));
    const previousEnd = toLocalDateString(new Date(todayDate.getTime() - 7 * DAY_MS));

    const currentWeekEntries = entries.filter((entry) => entry.date >= currentStart && entry.date <= today);
    const previousWeekEntries = entries.filter((entry) => entry.date >= previousStart && entry.date <= previousEnd);
    const currentCount = currentWeekEntries.length;
    const previousCount = previousWeekEntries.length;

    const topMood = (list: JournalEntry[]): string | null => {
      if (!list.length) return null;
      const counts: Record<string, number> = {};
      for (const entry of list) {
        const key = (entry.mood ?? '').trim();
        if (!key) continue;
        counts[key] = (counts[key] ?? 0) + 1;
      }
      return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    };

    const topTag = (list: JournalEntry[]): string | null => {
      const counts: Record<string, number> = {};
      for (const entry of list) {
        for (const rawTag of entry.tags ?? []) {
          const key = rawTag.trim().toLowerCase();
          if (!key) continue;
          counts[key] = (counts[key] ?? 0) + 1;
        }
      }
      return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    };

    const currentMood = topMood(currentWeekEntries);
    const previousMood = topMood(previousWeekEntries);
    const currentTag = topTag(currentWeekEntries);
    const previousTag = topTag(previousWeekEntries);

    const toneTagNote = (() => {
      const notes: string[] = [];
      if (currentMood && previousMood && currentMood !== previousMood) {
        notes.push(`Tone shifted from ${previousMood} to ${currentMood}.`);
      } else if (currentMood) {
        notes.push(`Dominant tone this week: ${currentMood}.`);
      }

      if (currentTag && previousTag && currentTag !== previousTag) {
        notes.push(`Tag focus shifted from ${previousTag} to ${currentTag}.`);
      } else if (currentTag) {
        notes.push(`Most recurring tag this week: ${currentTag}.`);
      }

      return notes.length ? notes.join(' ') : null;
    })();

    if (visiblePatternInsights.length > 0) {
      const localEpochWeek = Math.floor((Date.now() - new Date().getTimezoneOffset() * 60_000) / (7 * DAY_MS));
      const selectedInsight = visiblePatternInsights[localEpochWeek % visiblePatternInsights.length] ?? visiblePatternInsights[0];
      if (!toneTagNote) return selectedInsight;
      return {
        ...selectedInsight,
        actionable: selectedInsight.actionable
          ? `${selectedInsight.actionable} ${toneTagNote}`
          : toneTagNote,
      };
    }

    if (currentCount === 0 && previousCount === 0) {
      return {
        title: 'Weekly Reflection Insight',
        description: 'No reflection entries are logged in the last two weeks yet. Add one short reflection to begin your weekly archive read.',
        actionable: toneTagNote ?? 'One entry is enough to start a weekly pattern signal.',
        confidence: 'suggested',
        icon: 'book-outline',
        type: 'mood_pattern',
      } as PatternInsight;
    }

    const majorShift = Math.abs(currentCount - previousCount) >= 3;
    return {
      title: majorShift ? 'Weekly Reflection Shift' : 'Weekly Reflection Insight',
      description: majorShift
        ? `Your journaling rhythm shifted this week (${currentCount} entries vs ${previousCount} last week).`
        : `Your journaling rhythm is steady this week (${currentCount} entries logged).`,
      actionable: `${majorShift
        ? 'A shift in writing cadence often marks a meaningful internal transition.'
        : 'Steady reflection supports continuity and clearer pattern recognition over time.'}${toneTagNote ? ` ${toneTagNote}` : ''}`,
      confidence: majorShift ? 'strong' : 'suggested',
      icon: 'book-outline',
      type: 'mood_pattern',
    } as PatternInsight;
  }, [entries, visiblePatternInsights]);

  const weeklyDreamInsight = useMemo(() => {
    const today = toLocalDateString();
    const todayDate = new Date(`${today}T12:00:00`);
    const currentStart = toLocalDateString(new Date(todayDate.getTime() - 6 * DAY_MS));
    const previousStart = toLocalDateString(new Date(todayDate.getTime() - 13 * DAY_MS));
    const previousEnd = toLocalDateString(new Date(todayDate.getTime() - 7 * DAY_MS));

    const validDreamEntries = sleepEntries.filter((entry) => !entry.isDeleted && hasDreamContent(entry));
    const currentDreams = validDreamEntries.filter((entry) => entry.date >= currentStart && entry.date <= today);
    const previousDreams = validDreamEntries.filter((entry) => entry.date >= previousStart && entry.date <= previousEnd);

    const currentCount = currentDreams.length;
    const previousCount = previousDreams.length;
    const currentAvgQuality = currentCount > 0
      ? currentDreams.reduce((sum, entry) => sum + (entry.quality ?? 0), 0) / currentCount
      : 0;
    const previousAvgQuality = previousCount > 0
      ? previousDreams.reduce((sum, entry) => sum + (entry.quality ?? 0), 0) / previousCount
      : 0;
    const majorShift =
      Math.abs(currentCount - previousCount) >= 2 ||
      Math.abs(currentAvgQuality - previousAvgQuality) >= 1.2 ||
      (previousCount >= 2 && currentCount === 0);

    if (currentCount === 0 && previousCount === 0) {
      return {
        title: 'Dream Pattern Insight',
        description: 'No dream entries in the last two weeks yet.',
        actionable: 'One short dream note is enough to start your dream pattern read.',
        confidence: 'suggested' as const,
      };
    }

    if (majorShift) {
      return {
        title: 'Dream Pattern Shift',
        description: `Dream activity shifted this week (${currentCount} entries vs ${previousCount} last week).`,
        actionable: 'This can signal a change in how your system is processing emotional load overnight.',
        confidence: 'strong' as const,
      };
    }

    return {
      title: 'Dream Pattern Insight',
      description: `Your dream rhythm is steady this week (${currentCount} logged).`,
      actionable: 'Your nighttime processing appears consistent without abrupt swings.',
      confidence: 'suggested' as const,
    };
  }, [sleepEntries]);

  const toggleBrowseSearch = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    setShowSearch(prev => {
      if (prev) setSearchQuery('');
      return !prev;
    });
  }, []);

  const toggleExpanded = useCallback((id: string) => {
    setExpandedEntryId((currentId) => {
      if (currentId === id) {
        const index = filteredEntries.findIndex((entry) => entry.id === id);
        if (index >= 0) {
          reflectionsListRef.current?.scrollToIndex({
            index,
            animated: false,
            viewPosition: 0,
            viewOffset: 12,
          });
        }
        return null;
      }
      return id;
    });
  }, [filteredEntries]);

  const moodToLevel = useCallback((mood: string): MoodLevel => {
    const map: Record<string, MoodLevel> = {
      calm: 5, soft: 4, okay: 3, heavy: 2, stormy: 1,
    };
    return map[mood] ?? 3;
  }, []);

  const generatePatternInsights = useCallback(async () => {
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

  const loadEntries = useCallback(async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setLoadError(null);
        hasMoreRef.current = true;
        setHasMore(true);
        const [page, count] = await Promise.all([
          supabaseDb.getJournalEntriesPaginated(PAGE_SIZE),
          supabaseDb.getJournalEntryCount(),
        ]);
        entriesRef.current = page;
        setEntries(page);
        setTotalCount(count);
        const more = page.length >= PAGE_SIZE;
        hasMoreRef.current = more;
        setHasMore(more);
        hasLoadedJournalRef.current = true;
        lastJournalLoadedAtRef.current = Date.now();
      } else {
        if (loadingMoreRef.current || !hasMoreRef.current) return;
        loadingMoreRef.current = true;
        setLoadingMore(true);
        const last = entriesRef.current[entriesRef.current.length - 1];
        const page = await supabaseDb.getJournalEntriesPaginated(
          PAGE_SIZE,
          last?.date,
          last?.createdAt,
        );
        if (page.length < PAGE_SIZE) {
          hasMoreRef.current = false;
          setHasMore(false);
        }
        setEntries(prev => {
          const existingIds = new Set(prev.map(e => e.id));
          const newEntries = page.filter(e => !existingIds.has(e.id));
          const updated = [...prev, ...newEntries];
          entriesRef.current = updated;
          return updated;
        });
      }
    } catch (error) {
      logger.error('Failed to load journal entries:', error);
      if (reset) {
        setLoadError('Could not load your journal archive. Check your connection and try again.');
      } else {
        Alert.alert('Could not load more entries', 'Your saved entries are still in your archive. Please try again.');
      }
    } finally {
      loadingMoreRef.current = false;
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const loadSleepEntries = useCallback(async () => {
    try {
      const charts = await supabaseDb.getCharts();
      if (!charts.length) return;
      const all = await supabaseDb.getSleepEntries(charts[0].id, 365);
      setSleepEntries(all.filter(e => !e.isDeleted));
    } catch (error) {
      logger.error('Failed to load sleep entries:', error);
    }
  }, []);

  const retryJournalLoad = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    void loadEntries(true);
    void loadSleepEntries();
  }, [loadEntries, loadSleepEntries]);

  useFocusEffect(
    useCallback(() => {
      if (
        hasLoadedJournalRef.current &&
        Date.now() - lastJournalLoadedAtRef.current < JOURNAL_FOCUS_REFRESH_CACHE_MS
      ) {
        return;
      }
      void loadEntries(true);
      void loadSleepEntries();
    }, [loadEntries, loadSleepEntries])
  );

  useEffect(() => {
    if (entries.length >= 3) {
      void generatePatternInsights();
    }
  }, [entries.length, generatePatternInsights]);

  const handleAddEntry = async () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch {}
    setEditingEntry(undefined);
    setShowEntryModal(true);
  };

  const handleEditEntry = useCallback((entry: JournalEntry) => {
    setEditingEntry(sanitizeJournalEntryForEdit(entry));
    setShowEntryModal(true);
  }, []);

  const handleDeleteEntry = useCallback(async (entry: JournalEntry) => {
    try {
      setActionEntry((current) => (current?.id === entry.id ? null : current));
      await supabaseDb.deleteJournalEntry(entry.id);
      setExpandedEntryId((current) => (current === entry.id ? null : current));
      await loadEntries(true);
    } catch (error) {
      logger.error('Failed to delete journal entry:', error);
      Alert.alert('Error', 'Could not delete this entry. Please try again.');
    }
  }, [loadEntries]);

  const closeEntryActions = useCallback(() => {
    setActionEntry(null);
  }, []);

  const handleEditAction = useCallback(() => {
    if (!actionEntry) return;
    closeEntryActions();
    handleEditEntry(actionEntry);
  }, [actionEntry, closeEntryActions, handleEditEntry]);

  const handleDeleteAction = useCallback(() => {
    if (!actionEntry) return;
    closeEntryActions();
    void handleDeleteEntry(actionEntry);
  }, [actionEntry, closeEntryActions, handleDeleteEntry]);

  const handleEditDream = useCallback((entry: SleepEntry) => {
    router.push((`/(tabs)/sleep?entryId=${entry.id}`) as Href);
  }, [router]);

  const handleDeleteDream = useCallback(async (entry: SleepEntry) => {
    try {
      await supabaseDb.deleteSleepEntry(entry.id);
      await loadSleepEntries();
    } catch (error) {
      logger.error('Failed to delete dream entry:', error);
      Alert.alert('Error', 'Could not delete this dream entry. Please try again.');
    }
  }, [loadSleepEntries]);

  const stableFormatDate = useCallback((dateString: string) => {
    const date = parseLocalDate(dateString);
    if (!isValidDateValue(date)) return 'Unknown date';
    return date.toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric',
    });
  }, []);

  const stableFormatTime = useCallback((dateString: string) => {
    const date = new Date(dateString);
    if (!isValidDateValue(date)) return 'Unknown time';
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit', hour12: true,
    });
  }, []);

  const presentDreamActions = useCallback((entry: SleepEntry) => {
    Haptics.selectionAsync().catch(() => {});
    Alert.alert(
      'Dream Options',
      stableFormatDate(entry.date),
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Edit Dream', onPress: () => handleEditDream(entry) },
        {
          text: 'Delete Dream',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Delete Dream', 'Remove this dream from saved dreams?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => void handleDeleteDream(entry) },
            ]);
          },
        },
      ],
    );
  }, [handleDeleteDream, handleEditDream, stableFormatDate]);

  const keyExtractor = useCallback((item: JournalEntry | SleepEntry) => item.id, []);

  const presentEntryActions = useCallback((entry: JournalEntry) => {
    setActionEntry(entry);
  }, []);

  const renderEntry = useCallback(({ item }: ListRenderItemInfo<JournalEntry>) => {
    return (
      <EntryCard
        entry={item}
        isExpanded={expandedEntryId === item.id}
        onToggleExpand={toggleExpanded}
        onOpenActions={presentEntryActions}
        formatDate={stableFormatDate}
        formatTime={stableFormatTime}
      />
    );
  }, [expandedEntryId, presentEntryActions, stableFormatDate, stableFormatTime, toggleExpanded]);

  const renderDreamEntry = useCallback(({ item }: ListRenderItemInfo<SleepEntry>) => (
    <DreamCard
      entry={item}
      formatDate={stableFormatDate}
      onPress={(e) => router.push((`/(tabs)/journal/sleep-detail?id=${e.id}`) as Href)}
      onLongPress={presentDreamActions}
    />
  ), [stableFormatDate, router, presentDreamActions]);

  const handleEndReached = useCallback(() => {
    if (activeTab === 'reflections' && !loadingMore && hasMore) {
      void loadEntries(false);
    }
  }, [activeTab, hasMore, loadEntries, loadingMore]);

  // ── List header ────────────────────────────────────────────────────────────

  const ListHeader = (
    <>
      <Animated.View entering={FadeInDown.duration(1000)} style={styles.header}>
        <View>
          <Text style={styles.greeting}>Archive</Text>
          {theme.isDark ? (
            <GoldSubtitle style={styles.dateLabel}>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long', month: 'short', day: 'numeric',
              })}
            </GoldSubtitle>
          ) : (
            <Text style={styles.dateLabelLight}>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long', month: 'short', day: 'numeric',
              })}
            </Text>
          )}
        </View>
      </Animated.View>

      {/* ── Browse + Search ── */}
      {(totalCount > 0 || sleepEntries.length > 0) && (
        <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.filterSection}>
          <View style={styles.browseSectionHeader}>
            <View style={styles.browseTitleGroup}>
              <MetallicIcon name="library-outline" size={18} color={PALETTE.gold} />
              <Text style={styles.browseSectionTitle}>Browse</Text>
            </View>
            <Pressable
              onPress={toggleBrowseSearch}
              style={styles.browseSearchButton}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={showSearch ? 'Close archive search' : 'Search archive'}
              accessibilityState={{ expanded: showSearch }}
            >
              <MetallicIcon name={showSearch ? 'close-outline' : 'search-outline'} size={16} color={PALETTE.gold} />
            </Pressable>
          </View>
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
                accessibilityLabel={activeTab === 'reflections' ? 'Search journal entries' : 'Search dream entries'}
              />
              {searchQuery.length > 0 && (
                <Pressable
                  onPress={() => setSearchQuery('')}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Clear archive search"
                >
                  <Ionicons name="close-circle-outline" size={16} color={theme.textMuted} />
                </Pressable>
              )}
            </Animated.View>
          )}
          {/* ── Tab Switcher ── */}
          <PremiumSegmentedControl
            options={[
              { id: 'reflections', label: 'REFLECTIONS', count: totalCount },
              { id: 'dreams', label: 'DREAMS', count: sleepEntries.filter(e => !e.isDeleted).length },
            ]}
            selectedIndex={activeTab === 'reflections' ? 0 : 1}
            onChange={(index) => {
              Haptics.selectionAsync().catch(() => {});
              setActiveTab(index === 0 ? 'reflections' : 'dreams');
            }}
          />
        </Animated.View>
      )}

      {/* ── Reflection Patterns (journal-based only) ── */}
      {activeTab === 'reflections' && (
        <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.insightsSection}>
          <SectionHeader title="Reflection Patterns" icon="analytics-outline" />
          <Text style={styles.insightsSubtitle}>One weekly read from your journal patterns.</Text>

          <LinearGradient colors={theme.isDark ? ['rgba(107, 144, 128, 0.20)', 'rgba(162, 194, 225, 0.05)'] : ['rgba(236, 247, 241, 0.75)', 'rgba(240, 245, 252, 0.42)']} style={[styles.insightCard, theme.isDark && styles.velvetBorder]}>
            <View style={styles.insightHeader}>
              <MetallicIcon
                name={(weeklyReflectionInsight.icon ?? 'analytics-outline') as any}
                size={16}
                color={PALETTE.gold}
                style={{ marginRight: 8 }}
              />
              <View style={{ flex: 1, flexShrink: 1, overflow: 'hidden' }}>
                {theme.isDark ? (
                  <MetallicText color={PALETTE.gold} style={styles.insightTitle}>{weeklyReflectionInsight.title}</MetallicText>
                ) : (
                  <Text style={styles.insightTitleLight}>{weeklyReflectionInsight.title}</Text>
                )}
              </View>
              <View style={[styles.confidenceBadge, theme.isDark ? weeklyReflectionInsight.confidence === 'strong' && styles.confidenceStrong : styles.confidenceLight, theme.isDark && weeklyReflectionInsight.confidence !== 'strong' && styles.confidenceSuggested]}>
                <Text style={[styles.confidenceText, !theme.isDark && styles.confidenceTextLight, theme.isDark && weeklyReflectionInsight.confidence !== 'strong' && { color: PALETTE.gold }]}>{weeklyReflectionInsight.confidence === 'strong' ? 'CONFIRMED' : 'EMERGING'}</Text>
              </View>
            </View>
            <Text style={styles.insightDescription}>{weeklyReflectionInsight.description}</Text>
            {!!weeklyReflectionInsight.actionable && (
              <Text style={[styles.insightActionable, { color: theme.textPrimary }]}>{weeklyReflectionInsight.actionable}</Text>
            )}
          </LinearGradient>
        </Animated.View>
      )}

      {/* ── Upsell ── */}
      {activeTab === 'reflections' && !isPremium && totalCount >= 5 && (
        <Animated.View entering={FadeInDown.delay(250).duration(600)} style={styles.insightsSection}>
          <Pressable
            onPress={() => router.push('/(tabs)/premium' as Href)}
            accessibilityRole="button"
            accessibilityLabel="Unlock advanced journal patterns"
          >
            <LinearGradient colors={theme.isDark ? ['rgba(162, 194, 225, 0.20)', 'rgba(162, 194, 225, 0.05)'] : ['rgba(240, 245, 252, 0.7)', 'rgba(240, 245, 252, 0.4)']} style={[styles.insightCard, theme.isDark && styles.velvetBorder]}>
              <View style={styles.insightHeader}>
                <MetallicIcon name="analytics-outline" size={18} color={PALETTE.gold} />
                <MetallicText color={PALETTE.gold} style={styles.insightTitle}>{premiumTeaser.eyebrow}</MetallicText>
                <View style={[styles.premiumBadge, { marginLeft: 'auto' }]}>
                  <MetallicIcon name="sparkles-outline" size={10} color={PALETTE.gold} />
                  <Text style={styles.premiumBadgeText}>Deeper Sky</Text>
                </View>
              </View>
              <Text style={styles.insightDescription}>{premiumTeaser.title}</Text>
              <Text style={styles.depthBody}>{premiumTeaser.body}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 }}>
                <Text style={[styles.insightActionable, { marginTop: 0, color: PALETTE.gold }]} numberOfLines={1}>{premiumTeaser.cta}</Text>
                <MetallicIcon name="arrow-forward-outline" size={14} color={PALETTE.gold} />
              </View>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      )}

      {/* ── Dream Pattern Insight ── */}
      {activeTab === 'dreams' && sleepEntries.some(e => !e.isDeleted) && (
        <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.insightsSection}>
          <SectionHeader title="Dream Patterns" icon="moon-outline" />
          <Text style={styles.insightsSubtitle}>One weekly read from your dream patterns.</Text>
          <LinearGradient colors={theme.isDark ? ['rgba(168, 139, 235, 0.16)', 'rgba(44, 54, 69, 0.30)'] : ['rgba(168, 139, 235, 0.12)', 'rgba(240, 245, 252, 0.55)']} style={[styles.insightCard, theme.isDark && styles.velvetBorder]}>
            <View style={styles.insightHeader}>
              <MetallicIcon
                name="moon-outline"
                size={16}
                color={PALETTE.gold}
                style={{ marginRight: 8 }}
              />
              <View style={{ flex: 1, flexShrink: 1, overflow: 'hidden' }}>
                {theme.isDark ? (
                  <MetallicText color={PALETTE.gold} style={styles.insightTitle}>{weeklyDreamInsight.title}</MetallicText>
                ) : (
                  <Text style={styles.insightTitleLight}>{weeklyDreamInsight.title}</Text>
                )}
              </View>
              <View style={[styles.confidenceBadge, theme.isDark ? weeklyDreamInsight.confidence === 'strong' && styles.confidenceStrong : styles.confidenceLight, theme.isDark && weeklyDreamInsight.confidence !== 'strong' && styles.confidenceSuggested]}>
                <Text style={[styles.confidenceText, !theme.isDark && styles.confidenceTextLight, theme.isDark && weeklyDreamInsight.confidence !== 'strong' && { color: PALETTE.gold }]}>{weeklyDreamInsight.confidence === 'strong' ? 'CONFIRMED' : 'EMERGING'}</Text>
              </View>
            </View>
            <Text style={styles.insightDescription}>{weeklyDreamInsight.description}</Text>
            {!!weeklyDreamInsight.actionable && (
              <Text style={[styles.insightActionable, { color: theme.textPrimary }]}>{weeklyDreamInsight.actionable}</Text>
            )}
          </LinearGradient>
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
              ? (searchQuery ? `${filteredEntries.length} found · ${totalCount} total` : `${totalCount} entries`)
              : (searchQuery ? `${filteredSleepEntries.length} found · ${sleepEntries.filter(e => !e.isDeleted).length} total` : `${sleepEntries.filter(e => !e.isDeleted).length} dreams`)}
          </Text>
        </View>
      </View>
    </>
  );

  // ── List footer ────────────────────────────────────────────────────────────
  const ListFooter = (() => {
    if (activeTab === 'reflections' && loadingMore) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading more...</Text>
        </View>
      );
    }
    return null;
  })();

  // ── List empty ─────────────────────────────────────────────────────────────
  const ListEmpty = (() => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading entries...</Text>
        </View>
      );
    }

    if (activeTab === 'reflections' && loadError) {
      return (
        <View style={styles.emptyContainer}>
          <LinearGradient colors={['rgba(205, 127, 93, 0.12)', 'transparent']} style={[styles.emptyCard, theme.isDark && styles.velvetBorder]}>
            <Ionicons name="cloud-offline-outline" size={48} color={theme.textMuted} style={{ marginBottom: 12 }} />
            <Text style={styles.emptyTitle}>Could not load your archive</Text>
            <Text style={styles.emptyDescription}>{loadError}</Text>
            <Pressable
              onPress={retryJournalLoad}
              style={styles.emptyActionButton}
              accessibilityRole="button"
              accessibilityLabel="Try loading journal entries again"
            >
              <Text style={styles.emptyActionText}>Try again</Text>
            </Pressable>
          </LinearGradient>
        </View>
      );
    }

    if (activeTab === 'dreams') {
      const hasAnyDreams = sleepEntries.some(e => !e.isDeleted);
      if (hasAnyDreams && filteredSleepEntries.length === 0) {
        return (
          <View style={styles.emptyContainer}>
            <LinearGradient colors={['rgba(168, 139, 235, 0.10)', 'transparent']} style={[styles.emptyCard, theme.isDark && styles.velvetBorder]}>
              <Ionicons name="moon-outline" size={48} color={theme.textMuted} style={{ marginBottom: 12 }} />
              <Text style={styles.emptyTitle}>No dreams found</Text>
              <Text style={styles.emptyDescription}>
                {searchQuery
                  ? `No dream entries matching "${searchQuery}".`
                  : 'No dream entries available.'}
              </Text>
            </LinearGradient>
          </View>
        );
      }
      return (
        <View style={styles.emptyContainer}>
          <LinearGradient colors={['rgba(168, 139, 235, 0.10)', 'transparent']} style={[styles.emptyCard, theme.isDark && styles.velvetBorder]}>
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
          <LinearGradient colors={['rgba(162, 194, 225, 0.10)', 'transparent']} style={[styles.emptyCard, theme.isDark && styles.velvetBorder]}>
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
        <LinearGradient colors={['rgba(162, 194, 225, 0.10)', 'transparent']} style={[styles.emptyCard, theme.isDark && styles.velvetBorder]}>
          <Ionicons name="book-outline" size={48} color={theme.textMuted} style={{ marginBottom: 12 }} />
          <Text style={styles.emptyTitle}>No reflections saved yet</Text>
          <Text style={styles.emptyDescription}>Write a reflection to start building a private archive you can revisit over time.</Text>
        </LinearGradient>
      </View>
    );
  })();

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
      const safeTags = normalizeJournalTags(data.tags ?? editingEntry?.tags);

      const savedDate = (data.date ?? editingEntry?.date ?? toLocalDateString()) as string;

      if (editingEntry?.id) {
        const updated: JournalEntry = {
          ...editingEntry,
          ...data,
          title: normalizeJournalTitle(data.title ?? editingEntry.title),
          ...nlpFields,
          id: editingEntry.id,
          createdAt: editingEntry.createdAt ?? nowIso,
          updatedAt: nowIso,
          date: savedDate,
          chartId: data.chartId ?? editingEntry.chartId,
          transitSnapshot: data.transitSnapshot ?? editingEntry.transitSnapshot,
          tags: safeTags,
        } as JournalEntry;

        await supabaseDb.updateJournalEntry(updated);
      } else {
        const created: JournalEntry = {
          id: generateId(),
          title: normalizeJournalTitle(data.title),
          content: data.content ?? '',
          mood: (data.mood ?? 'okay') as any,
          moonPhase: (data.moonPhase ?? 'new') as any,
          date: savedDate as any,
          createdAt: nowIso,
          updatedAt: nowIso,
          isDeleted: false,
          chartId: data.chartId,
          transitSnapshot: data.transitSnapshot,
          tags: safeTags,
          ...nlpFields,
        } as JournalEntry;

        await supabaseDb.addJournalEntry(created);
      }

      if (savedDate === toLocalDateString()) {
        markTodayInsightsStale('journal');
      }

      setShowEntryModal(false);
      setEditingEntry(undefined);
      await loadEntries(true);
    } catch (error) {
      logger.error('Failed to save journal entry:', error);
      Alert.alert('Error', 'Could not save this entry. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />

      {/* Nebula/Atmosphere glow orbs */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={[styles.glowOrb, { top: -60, right: -60, backgroundColor: 'rgba(162, 194, 225, 0.12)' }]} />
        <View style={[styles.glowOrb, { bottom: 160, left: -120, backgroundColor: 'rgba(168, 139, 235, 0.08)' }]} />
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
            ref={reflectionsListRef}
            data={filteredEntries}
            renderItem={renderEntry}
            keyExtractor={keyExtractor}
            ListHeaderComponent={ListHeader}
            ListFooterComponent={ListFooter}
            ListEmptyComponent={ListEmpty}
            contentContainerStyle={{ paddingBottom: 140, paddingHorizontal: 24 }}
            onScrollToIndexFailed={() => {}}
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
          onClose={() => { setShowEntryModal(false); setEditingEntry(undefined); }}
          onSave={handleSaveEntry}
          initialData={editingEntry}
        />

        {/* ── Entry Action Sheet ── */}
        <Modal
          visible={!!actionEntry}
          transparent
          animationType="fade"
          onRequestClose={closeEntryActions}
        >
          <View style={styles.entryActionOverlay}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={closeEntryActions}
              accessible={false}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            />
            <View style={styles.entryActionSheetWrap}>
              <LinearGradient
                colors={theme.isDark ? ['rgba(44, 54, 69, 0.98)', 'rgba(26, 30, 41, 0.98)'] : [theme.cardSurfaceStrong, 'rgba(244, 238, 229, 0.98)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.entryActionSheet, theme.isDark && styles.velvetBorder]}
              >
                <View style={styles.entryActionHandle} />
                <View style={styles.entryActionHeader}>
                  <MetallicText variant="gold" style={styles.entryActionEyebrow}>Reflection Options</MetallicText>
                  <Text style={styles.entryActionTitle} numberOfLines={2}>
                    {actionEntry?.title?.trim() || 'Untitled Reflection'}
                  </Text>
                  <Text style={styles.entryActionSubtitle}>
                    {actionEntry ? stableFormatDate(actionEntry.date) : ''}
                  </Text>
                </View>

                <View style={styles.entryActionList}>
                  <Pressable
                    style={styles.entryActionButton}
                    onPress={handleEditAction}
                    accessibilityRole="button"
                    accessibilityLabel="Edit this reflection"
                  >
                    <View style={styles.entryActionIconWrap}>
                      <MetallicIcon name="create-outline" size={18} variant="gold" />
                    </View>
                    <View style={styles.entryActionTextWrap}>
                      <Text style={styles.entryActionLabel}>Edit Entry</Text>
                      <Text style={styles.entryActionHint}>Open this reflection in the journal editor.</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.32)" />
                  </Pressable>

                  <Pressable
                    style={[styles.entryActionButton, styles.entryActionButtonDanger]}
                    onPress={handleDeleteAction}
                    accessibilityRole="button"
                    accessibilityLabel="Delete this reflection"
                  >
                    <View style={[styles.entryActionIconWrap, styles.entryActionIconWrapDanger]}>
                      <Ionicons name="trash-outline" size={18} color="#F3A3A3" />
                    </View>
                    <View style={styles.entryActionTextWrap}>
                      <Text style={[styles.entryActionLabel, styles.entryActionLabelDanger]}>Delete Entry</Text>
                      <Text style={styles.entryActionHint}>Remove this saved reflection.</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="rgba(243,163,163,0.5)" />
                  </Pressable>
                </View>

                <Pressable
                  style={styles.entryActionCancel}
                  onPress={closeEntryActions}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel reflection options"
                >
                  <Text style={styles.entryActionCancelText}>Cancel</Text>
                </Pressable>
              </LinearGradient>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

export default function JournalScreen() {
  return (
    <ErrorBoundary screenName="journal">
      <JournalContent />
    </ErrorBoundary>
  );
}

// ── Section Header ────────────────────────────────

function SectionHeader({ title, icon }: { title: string; icon: string }) {
  const sectionHeaderStyles = useThemedStyles(createSectionHeaderStyles);

  return (
    <View style={sectionHeaderStyles.container}>
      <MetallicIcon name={icon as any} size={18} variant="gold" />
      <MetallicText style={sectionHeaderStyles.title} variant="gold">{title}</MetallicText>
    </View>
  );
}

const createSectionHeaderStyles = (theme: AppTheme) => StyleSheet.create({
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

// ── Luminous Journal FAB ────────────────────────────────

function JournalFAB({ onPress }: { onPress: () => void }) {
  const theme = useAppTheme();
  const journalFabStyles = useThemedStyles(createJournalFabStyles);
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
        <BlurView
          pointerEvents="none"
          intensity={60}
          tint={theme.blurTint}
          style={journalFabStyles.glassCircle}
        >
          <MetallicIcon name="add-outline" size={28} variant="gold" />
        </BlurView>
      </Animated.View>
    </Pressable>
  );
}

const createJournalFabStyles = (theme: AppTheme) => StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 120,
    right: 24,
    zIndex: 100,
  },
  glowWrapper: {
    shadowColor: '#D4AF37',
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

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  safeArea: { flex: 1 },
  iconBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.10)' : theme.cardSurface, justifyContent: 'center', alignItems: 'center', marginTop: 4 },

  // Velvet Glass Mixin
  velvetBorder: {
    borderWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.20)',
    borderLeftColor: 'rgba(255,255,255,0.10)',
    borderRightColor: 'rgba(255,255,255,0.10)',
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 32,
  },
  greeting: {
    color: theme.textPrimary,
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
  dateLabelLight: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 4,
    color: LIGHT_MODE_META,
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

  premiumBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'transparent', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  premiumBadgeText: { fontSize: 10, fontWeight: '700', color: theme.textGold },

  insightsSection: { marginBottom: 32 },
  insightsSubtitle: { fontSize: 13, color: theme.textMuted, marginBottom: 20, lineHeight: 20 },

  insightCard: {
    padding: 28,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    marginBottom: 32,
    overflow: 'hidden',
  },
  insightHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  insightTitle: { fontSize: 14, fontWeight: '700', color: PALETTE.gold, letterSpacing: 1.5, textTransform: 'uppercase' },
  insightTitleLight: { fontSize: 14, fontWeight: '700', color: LIGHT_MODE_INK, letterSpacing: 1.5, textTransform: 'uppercase' },
  confidenceBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: 'transparent', marginLeft: 8, flexShrink: 0, overflow: 'visible' },
  confidenceStrong: { backgroundColor: 'rgba(110, 191, 139, 0.2)' },
  confidenceSuggested: { backgroundColor: 'transparent' },
  confidenceLight: { backgroundColor: 'rgba(0, 0, 0, 0.04)', borderColor: 'rgba(0, 0, 0, 0.08)' },
  confidenceText: { fontSize: 10, textTransform: 'uppercase', fontWeight: '800', letterSpacing: 1.2 },
  confidenceTextLight: { color: LIGHT_MODE_INK },
  aiFreshnessText: { fontSize: 11, color: theme.isDark ? 'rgba(255,255,255,0.48)' : LIGHT_MODE_META, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 12 },
  insightDescription: { fontSize: 16, color: theme.isDark ? 'rgba(255,255,255,0.68)' : theme.textSecondary, lineHeight: 26, letterSpacing: 0.2, marginBottom: 12 },
  depthBody: { fontSize: 13, color: theme.textSecondary, lineHeight: 20, marginBottom: 12 },
  depthCount: { marginTop: -4, marginBottom: 10, fontSize: 10, fontWeight: '700', color: 'rgba(212,175,55,0.62)', textTransform: 'uppercase', letterSpacing: 0.8 },
  depthProgressTrack: {
    height: 5,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.10)',
    marginTop: 6,
  },
  depthProgressFill: { height: '100%', borderRadius: 999, backgroundColor: PALETTE.gold },
  depthMeta: { marginTop: 8, fontSize: 11, fontWeight: '700', color: 'rgba(212,175,55,0.68)', textTransform: 'uppercase', letterSpacing: 0.8 },
  insightEvidence: { fontSize: 13, color: theme.isDark ? theme.textMuted : LIGHT_MODE_META, lineHeight: 21, marginBottom: 8 },
  insightActionable: { fontSize: 15, fontWeight: '600', marginTop: 6, lineHeight: 22, color: theme.isDark ? 'rgba(255,255,255,0.78)' : theme.textPrimary },

  filterSection: {
    marginBottom: 32,
  },
  browseSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
    justifyContent: 'space-between',
  },
  browseTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  browseSearchButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.cardBorder,
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : theme.cardSurface,
  },
  browseSectionTitle: {
    color: theme.textPrimary,
    fontSize: 19,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : theme.cardSurface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.cardBorder,
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
  entriesCount: { fontSize: 12, color: theme.textMuted, fontVariant: ['tabular-nums'], fontWeight: '600', letterSpacing: 0.5 },

  loadingContainer: { padding: 40, alignItems: 'center' },
  loadingText: { fontSize: 15, color: theme.textSecondary },

  emptyContainer: { paddingVertical: 32 },
  emptyCard: { borderRadius: 24, padding: 40, alignItems: 'center', borderWidth: 1, borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'transparent' : theme.cardSurfaceStrong },
  emptyTitle: { fontSize: 22, color: theme.textPrimary, marginBottom: 8, fontWeight: '700' },
  emptyDescription: { fontSize: 16, color: theme.textSecondary, textAlign: 'center', lineHeight: 26 },
  emptyActionButton: { minHeight: 44, marginTop: 18, paddingHorizontal: 20, borderRadius: 22, borderWidth: 1, borderColor: theme.cardBorder, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : theme.cardSurfaceStrong },
  emptyActionText: { fontSize: 14, fontWeight: '700', color: theme.textPrimary },

  entryActionOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2,8,23,0.72)',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 28,
  },
  entryActionSheetWrap: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.4,
    shadowRadius: 32,
    elevation: 24,
  },
  entryActionSheet: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(212, 175, 55, 0.18)',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 20,
    overflow: 'hidden',
  },
  entryActionHandle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.72)',
    marginBottom: 16,
  },
  entryActionHeader: {
    marginBottom: 18,
    gap: 6,
  },
  entryActionEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  entryActionTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    color: theme.textPrimary,
    letterSpacing: -0.4,
  },
  entryActionSubtitle: {
    fontSize: 13,
    color: theme.isDark ? 'rgba(255,255,255,0.5)' : 'rgba(22,32,51,0.56)',
    letterSpacing: 0.3,
  },
  entryActionList: {
    gap: 12,
  },
  entryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(212, 175, 55, 0.14)',
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.035)' : 'rgba(255,255,255,0.78)',
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  entryActionButtonDanger: {
    backgroundColor: 'rgba(243,163,163,0.06)',
    borderColor: 'rgba(243,163,163,0.16)',
  },
  entryActionIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(162, 194, 225, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55,0.18)',
  },
  entryActionIconWrapDanger: {
    backgroundColor: 'rgba(243,163,163,0.10)',
    borderColor: 'rgba(243,163,163,0.16)',
  },
  entryActionTextWrap: {
    flex: 1,
    gap: 3,
  },
  entryActionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  entryActionLabelDanger: {
    color: '#FFD4D4',
  },
  entryActionHint: {
    fontSize: 13,
    lineHeight: 18,
    color: theme.isDark ? 'rgba(255,255,255,0.52)' : 'rgba(22,32,51,0.56)',
  },
  entryActionCancel: {
    marginTop: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(212, 175, 55, 0.14)',
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.78)',
  },
  entryActionCancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.textPrimary,
    letterSpacing: 0.2,
  },

  // ── Dream card ──
  dreamCardWrapper: {
    marginBottom: 16,
  },
  dreamCard: {
    padding: 28,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.cardBorder,
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
    color: theme.textMuted,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  dreamMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  dreamMoonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dreamMoons: {
    fontSize: 14,
    color: PALETTE.gold,
    letterSpacing: 1,
  },
  dreamMoonsEmpty: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.1)',
    letterSpacing: 1,
  },
  dreamMoonsEmptyLight: {
    color: 'rgba(0, 0, 0, 0.05)',
  },
  dreamQualityLabel: {
    fontSize: 12,
    color: 'rgba(212,175,55,0.8)',
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
    color: theme.textPrimary,
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
    borderColor: theme.cardBorder,
    overflow: 'hidden',
    padding: 20,
  },
  clusterCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  clusterChevron: {
    marginLeft: 'auto',
  },
  clusterCardEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  dreamPatternChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  dreamPatternChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(168, 139, 235, 0.28)',
    backgroundColor: theme.isDark ? 'rgba(168, 139, 235, 0.10)' : 'rgba(168, 139, 235, 0.08)',
  },
  dreamPatternChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.textPrimary,
    letterSpacing: 0.2,
  },
});
