import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, Alert, Dimensions, ListRenderItemInfo, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Href } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/core';
import * as Haptics from 'expo-haptics';

import { theme } from '../../constants/theme';
import StarField from '../../components/ui/StarField';
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
import { analyzeJournalContent } from '../../services/journal/nlp';

const { width } = Dimensions.get('window');
const PAGE_SIZE = 30;

// ── Cinematic Palette ──
const PALETTE = {
  gold: '#D4AF37',
  silverBlue: '#8BC4E8',
  copper: '#CD7F5D',
  emerald: '#6EBF8B',
  rose: '#D4A3B3',
  textMain: '#FDFBF7',
  glassBorder: 'rgba(255,255,255,0.06)',
  glassHighlight: 'rgba(255,255,255,0.12)',
};

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
  return (
    <Pressable
      style={styles.entryCard}
      onPress={() => void onEdit(entry)}
      onLongPress={() => void onDelete(entry)}
      accessibilityRole="button"
      accessibilityLabel={`Journal entry: ${entry.title || formatDate(entry.date)}`}
    >
      <LinearGradient
        colors={['rgba(35, 40, 55, 0.4)', 'rgba(20, 24, 34, 0.7)']}
        style={styles.entryGradient}
      >
        <View style={styles.entryHeader}>
          <Text style={styles.entryDate}>{formatDate(entry.date)}</Text>
          <Text style={styles.entryTime}>{formatTime(entry.createdAt)}</Text>
        </View>

        {!!entry.title && (
          <Text style={styles.entryTitle} numberOfLines={1}>
            {entry.title}
          </Text>
        )}

        <Text style={styles.entryContent} numberOfLines={isExpanded ? undefined : 3}>
          {entry.content}
        </Text>

        <Pressable
          style={styles.expandButton}
          onPress={() => onToggle(entry.id)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel={isExpanded ? 'Collapse entry' : 'Expand entry'}
        >
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={theme.textMuted}
          />
        </Pressable>
      </LinearGradient>
    </Pressable>
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
  const [expandedEntryIds, setExpandedEntryIds] = useState<Set<string>>(new Set());

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
      const result = await CheckInService.getAllCheckIns(primaryChart.id, 7);
      setCheckIns(Array.isArray(result) ? result : []);
    } catch (error) {
      logger.error('Failed to load check-ins:', error);
      setCheckIns([]);
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

  const keyExtractor = useCallback((item: JournalEntry) => item.id, []);

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
          <View>
            <Text style={styles.title}>Journal</Text>
            <Text style={styles.subtitle}>Your inner landscape</Text>
          </View>
        </View>

        <Text style={styles.poeticIntro}>
          This is a space for your unfiltered truth. A private space for honest reflection. Let the words come without judgment.
        </Text>
      </Animated.View>

      {checkIns.length >= 2 && (
        isPremium ? (
          <Animated.View entering={FadeInDown.delay(220).duration(600)} style={styles.checkInTrendSection}>
            <Text style={styles.chartTitle}>7-Day Energy Trends</Text>
            <Text style={styles.checkInTrendSubtitle}>From your daily check-ins</Text>
            <CheckInTrendGraph checkIns={checkIns} width={width - 40} />
          </Animated.View>
        ) : (
          <Pressable onPress={() => setShowPremiumRequired(true)} accessibilityRole="button" accessibilityLabel="Unlock 7-day check-in trends">
            <Animated.View entering={FadeInDown.delay(220).duration(600)} style={styles.checkInTrendSection}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={styles.chartTitle}>7-Day Energy Trends</Text>
                <View style={styles.premiumBadge}>
                  <Ionicons name="sparkles" size={10} color={PALETTE.gold} />
                  <Text style={styles.premiumBadgeText}>Deeper Sky</Text>
                </View>
              </View>
              <LinearGradient colors={['rgba(35, 40, 55, 0.4)', 'rgba(20, 24, 34, 0.7)']} style={styles.lockBox}>
                <Ionicons name="trending-up" size={36} color={PALETTE.gold} style={{ marginBottom: 8 }} />
                <Text style={styles.lockTitle}>Your trends are ready</Text>
                <Text style={styles.lockSubtitle}>See how your mood, energy, and stress shift across the week</Text>
              </LinearGradient>
            </Animated.View>
          </Pressable>
        )
      )}

      {isPremium && patternInsights.length > 0 && (
        <Animated.View entering={FadeInDown.delay(250).duration(600)} style={styles.insightsSection}>
          <Text style={styles.insightsTitle}>Pattern Insights</Text>
          <Text style={styles.insightsSubtitle}>What your journal reveals over time</Text>

          {patternInsights.map((insight, idx) => {
            const isTransit = insight.type === 'transit_correlation';
            const colors = isTransit 
              ? ['rgba(157, 118, 193, 0.15)', 'rgba(74, 53, 89, 0.6)'] // Amethyst tone
              : ['rgba(212, 175, 55, 0.15)', 'rgba(122, 92, 19, 0.6)']; // Gold tone

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
                {!!insight.actionable && <Text style={[styles.insightActionable, { color: isTransit ? PALETTE.rose : PALETTE.gold }]}>{insight.actionable}</Text>}
              </LinearGradient>
            );
          })}
        </Animated.View>
      )}

      {!isPremium && totalCount >= 5 && (
        <Animated.View entering={FadeInDown.delay(250).duration(600)} style={styles.insightsSection}>
          <Pressable onPress={() => router.push('/(tabs)/premium' as Href)} accessibilityRole="button" accessibilityLabel="See your patterns">
            <LinearGradient colors={['rgba(212, 175, 55, 0.12)', 'rgba(20, 24, 34, 0.8)']} style={[styles.insightCard, { borderColor: 'rgba(212, 175, 55, 0.25)' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Ionicons name="analytics" size={18} color={PALETTE.gold} />
                <Text style={styles.insightTitle}>Pattern Insights</Text>
                <View style={[styles.premiumBadge, { marginLeft: 'auto' }]}>
                  <Ionicons name="sparkles" size={10} color={PALETTE.gold} />
                  <Text style={styles.premiumBadgeText}>Deeper Sky</Text>
                </View>
              </View>
              <Text style={styles.insightDescription}>
                With {totalCount} entries, Deeper Sky can detect which energy cycles lift your mood, when you tend to journal most, and what emotional themes keep appearing.
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 }}>
                <Text style={[styles.insightActionable, { marginTop: 0, color: PALETTE.gold }]}>Reveal your patterns</Text>
                <Ionicons name="arrow-forward" size={14} color={PALETTE.gold} />
              </View>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      )}

      <View style={styles.entriesSection}>
        <View style={styles.entriesHeader}>
          <Text style={styles.sectionTitle}>Recent Entries</Text>
          <Text style={styles.entriesCount}>{totalCount} entries</Text>
        </View>
      </View>
    </>
  ), [checkIns, isPremium, patternInsights, totalCount, router, width]);

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
        <LinearGradient colors={['rgba(35, 40, 55, 0.4)', 'rgba(20, 24, 34, 0.7)']} style={styles.emptyCard}>
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
      <StarField starCount={40} />
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {showPremiumRequired ? (
          <FlatList
            data={[]}
            renderItem={null}
            contentContainerStyle={{ paddingBottom: 40 }}
            ListHeaderComponent={
              <PremiumRequiredScreen
                feature="Check-In Trends"
                teaser="Visualize how your mood, energy, and stress shift over the past week — and discover which days you feel most aligned."
              />
            }
          />
        ) : (
          <FlatList
            data={entries}
            renderItem={renderEntry}
            keyExtractor={keyExtractor}
            ListHeaderComponent={ListHeader}
            ListFooterComponent={ListFooter}
            ListEmptyComponent={ListEmpty}
            contentContainerStyle={{ paddingBottom: 60, paddingHorizontal: 20 }}
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
          <Animated.View
            entering={FadeInDown.delay(600).duration(600)}
            style={[styles.fabContainer, { bottom: insets.bottom + 20 }]}
          >
            <Pressable style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]} onPress={() => void handleAddEntry()} accessibilityRole="button" accessibilityLabel="Add new journal entry">
              <LinearGradient colors={['#FFF4D4', '#D4AF37', '#7A5C13']} style={styles.fabGradient}>
                <Ionicons name="add" size={28} color="#1A1A1A" />
              </LinearGradient>
            </Pressable>
          </Animated.View>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07090F' },
  safeArea: { flex: 1 },

  header: { paddingVertical: 16, marginBottom: 8 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 34, color: PALETTE.textMain, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }), letterSpacing: 0.5 },
  subtitle: { fontSize: 15, color: theme.textSecondary, fontStyle: 'italic', marginTop: 4, letterSpacing: 0.3 },
  poeticIntro: {
    fontSize: 15,
    color: theme.textSecondary,
    lineHeight: 24,
    marginTop: 20,
  },

  chartTitle: {
    fontSize: 20,
    color: PALETTE.textMain,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    marginBottom: 4,
  },
  checkInTrendSection: { marginBottom: 32 },
  checkInTrendSubtitle: {
    fontSize: 13,
    color: theme.textSecondary,
    fontStyle: 'italic',
    marginBottom: 20,
  },

  premiumBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(212, 175, 55, 0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  premiumBadgeText: { fontSize: 10, fontWeight: '700', color: PALETTE.gold },

  lockBox: {
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
    borderTopColor: PALETTE.glassHighlight,
  },
  lockTitle: { color: PALETTE.gold, marginTop: 12, fontWeight: '600', fontSize: 16 },
  lockSubtitle: { color: theme.textSecondary, fontSize: 14, marginTop: 6, textAlign: 'center', paddingHorizontal: 20 },

  insightsSection: { marginBottom: 32 },
  insightsTitle: { fontSize: 20, color: PALETTE.textMain, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }), marginBottom: 4 },
  insightsSubtitle: { fontSize: 13, color: theme.textSecondary, fontStyle: 'italic', marginBottom: 20 },

  insightCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
    borderTopColor: PALETTE.glassHighlight,
    marginBottom: 12,
  },
  insightHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  insightTitle: { fontSize: 16, fontWeight: '600', color: PALETTE.textMain, flex: 1 },
  confidenceBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: 'rgba(255, 255, 255, 0.08)', marginLeft: 12 },
  confidenceStrong: { backgroundColor: 'rgba(110, 191, 139, 0.2)' },
  confidenceSuggested: { backgroundColor: 'rgba(212, 175, 55, 0.15)' },
  confidenceText: { fontSize: 10, color: PALETTE.textMain, textTransform: 'uppercase', fontWeight: '700', letterSpacing: 0.5 },
  insightDescription: { fontSize: 15, color: theme.textSecondary, lineHeight: 22, marginBottom: 10 },
  insightEvidence: { fontSize: 13, color: theme.textMuted, fontStyle: 'italic', marginBottom: 8 },
  insightActionable: { fontSize: 14, fontWeight: '600', marginTop: 4 },

  entriesSection: { marginBottom: 16 },
  entriesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 20, color: PALETTE.textMain, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }) },
  entriesCount: { fontSize: 14, color: theme.textMuted, fontStyle: 'italic' },

  loadingContainer: { padding: 40, alignItems: 'center' },
  loadingText: { fontSize: 15, color: theme.textSecondary, fontStyle: 'italic' },

  emptyContainer: { paddingVertical: 32 },
  emptyCard: { borderRadius: 20, padding: 40, alignItems: 'center', borderWidth: 1, borderColor: PALETTE.glassBorder, borderTopColor: PALETTE.glassHighlight },
  emptyTitle: { fontSize: 22, color: PALETTE.textMain, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }), marginBottom: 8 },
  emptyDescription: { fontSize: 15, color: theme.textSecondary, textAlign: 'center', lineHeight: 22 },

  entryCard: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: PALETTE.glassBorder, borderTopColor: PALETTE.glassHighlight, marginBottom: 16 },
  entryGradient: { padding: 20 },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  entryDate: { fontSize: 16, fontWeight: '600', color: PALETTE.textMain },
  entryTime: { fontSize: 12, color: theme.textMuted },

  entryTitle: { fontSize: 18, color: PALETTE.textMain, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }), marginBottom: 8 },
  entryContent: { fontSize: 15, color: theme.textSecondary, lineHeight: 24 },
  expandButton: { alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.06)' },

  fabContainer: { position: 'absolute', right: 20, zIndex: 1000 },
  fab: { width: 60, height: 60, borderRadius: 30, overflow: 'hidden', shadowColor: '#D4AF37', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  fabPressed: { opacity: 0.9, transform: [{ scale: 0.95 }] },
  fabGradient: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
});

