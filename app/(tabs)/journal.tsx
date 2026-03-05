import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, Alert, Dimensions, ListRenderItemInfo, Platform, ScrollView, TextInput } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Href } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/core';
import * as Haptics from 'expo-haptics';

import { theme } from '../../constants/theme';
import { SkiaDynamicCosmos } from '../../components/ui/SkiaDynamicCosmos';
import PremiumRequiredScreen from '../../components/PremiumRequiredScreen';
import { localDb } from '../../services/storage/localDb';
import { JournalEntry, generateId } from '../../services/storage/models';
import JournalEntryModal from '../../components/JournalEntryModal';
import { usePremium } from '../../context/PremiumContext';
import { logger } from '../../utils/logger';
import { parseLocalDate } from '../../utils/dateUtils';

import ObsidianJournalEntry from '../../components/ui/ObsidianJournalEntry';
import { analyzeJournalContent } from '../../services/journal/nlp';
import SkiaDreamEngine from '../../components/ui/SkiaDreamEngine';
import { SomaticHeatMap } from '../../components/premium/SomaticHeatMap';
import WeeklyResilienceShield from '../../components/ui/WeeklyResilienceShield';

const { width } = Dimensions.get('window');
const PAGE_SIZE = 30;

// ── Cinematic Palette ──
const PALETTE = {
  gold: '#C5B493',
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
  const wordCount = entry.contentWordCount ?? (entry.content || '').trim().split(/\s+/).filter(Boolean).length;
  
  // Create deterministic mock values for demo if they are missing
  const idNum = parseInt(entry.id.replace(/\D/g, '').slice(0, 5) || '0', 10);
  const mockDelta = entry.stabilityDelta ?? ((idNum % 20) - 5); // between -5 and +14
  
  const colors = ['#8BC4E8', '#C5B493', '#CD7F5D', '#6EBF8B'];
  let somaticColor = colors[idNum % colors.length];
  if (entry.somaticSnapshotData) {
    try {
      const parsed = typeof entry.somaticSnapshotData === 'string' 
        ? JSON.parse(entry.somaticSnapshotData) 
        : entry.somaticSnapshotData;
      if (parsed?.color) somaticColor = parsed.color;
      else somaticColor = '#CD7F5D'; // glowing Copper
    } catch {
      somaticColor = '#CD7F5D';
    }
  }

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
      stabilityDelta={mockDelta}
      somaticSnapshotColor={somaticColor}
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

  const [expandedEntryIds, setExpandedEntryIds] = useState<Set<string>>(new Set());
  const [contextFilter, setContextFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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
    }, [])
  );

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

  const moodToLevel = (mood: string): number => {
    const map: Record<string, number> = {
      calm: 5,
      soft: 4,
      okay: 3,
      heavy: 2,
      stormy: 1,
    };
    return map[mood] ?? 3;
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
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
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

  const categories = useMemo(() => {
    const counts: Record<string, number> = {};
    entries.forEach((e) => {
      const mockScore = (e.content && e.content.length) ? e.content.length % 4 : 0;
      const cat = e.contextCategory || ['Parenting', 'Work', 'Relationships', 'Health'][mockScore];
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [entries]);

  const filteredEntries = useMemo(() => {
    let result = entries;
    if (contextFilter) {
      result = result.filter((e) => {
        const mockScore = (e.content && e.content.length) ? e.content.length % 4 : 0;
        const assignedCat = e.contextCategory || ['Parenting', 'Work', 'Relationships', 'Health'][mockScore];
        return assignedCat === contextFilter;
      });
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((e) => 
        (e.title && e.title.toLowerCase().includes(q)) || 
        (e.content && e.content.toLowerCase().includes(q)) ||
        (e.contentKeywords && e.contentKeywords.toLowerCase().includes(q))
      );
    }
    return result;
  }, [entries, contextFilter, searchQuery]);

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

  const shieldScore = useMemo(() => {
    if (!entries.length) return 82;
    const recent = entries.slice(0, 7);
    const avgMood = recent.reduce((sum, e) => {
      const level = { calm: 5, soft: 4, okay: 3, heavy: 2, stormy: 1 }[e.mood] || 3;
      return sum + level;
    }, 0) / recent.length;
    return Math.min(100, Math.round(avgMood * 20));
  }, [entries]);

  const ListHeader = useMemo(() => (
    <>
      <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Archive</Text>
            <Text style={styles.subtitle}>Subconscious field · Pattern memory</Text>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={16} color={theme.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search keywords, somatic feelings..."
            placeholderTextColor={theme.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </Animated.View>

      <View style={styles.entriesSection}>
        <WeeklyResilienceShield score={shieldScore} />
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {categories.map(([cat, count]) => (
            <Pressable
              key={cat}
              onPress={() => setContextFilter(contextFilter === cat ? null : cat)}
              style={[
                styles.filterChip,
                contextFilter === cat && styles.filterChipActive
              ]}
            >
              <Text style={[
                styles.filterChipText,
                contextFilter === cat && styles.filterChipTextActive
              ]}>{`${cat} (${count})`}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.entriesHeader}>
          <Text style={styles.sectionTitle}>Recent Entries</Text>
          <Text style={styles.entriesCount}>{filteredEntries.length} entries</Text>
        </View>
      </View>
    </>
  ), [totalCount, contextFilter, filteredEntries.length, searchQuery, categories, shieldScore]);

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
      
      const autoTags: string[] = [];
      const lowerContent = contentText.toLowerCase();
      if (lowerContent.includes('son') || lowerContent.includes('school')) autoTags.push('Parenting');
      if (lowerContent.includes('code') || lowerContent.includes('work') || lowerContent.includes('meeting')) autoTags.push('Work');
      if (lowerContent.includes('health') || lowerContent.includes('workout') || lowerContent.includes('gym')) autoTags.push('Health');
      if (lowerContent.includes('partner') || lowerContent.includes('friend')) autoTags.push('Relationships');

      const nlpFields = {
        contentKeywords: JSON.stringify(nlp.keywords),
        contentEmotions: JSON.stringify(nlp.emotions),
        contentSentiment: JSON.stringify(nlp.sentiment),
        contentWordCount: nlp.wordCount,
        contentReadingMinutes: nlp.readingMinutes,
        contextCategory: data.contextCategory ?? editingEntry?.contextCategory ?? autoTags[0] ?? 'Uncategorized',
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
      <SkiaDynamicCosmos />
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
            data={filteredEntries}
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
              <LinearGradient colors={['#FFF4D4', '#C5B493', '#8B6508']} style={styles.fabGradient}>
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

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    paddingHorizontal: 12,
    marginTop: 20,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 15,
    paddingVertical: 12,
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

  premiumBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(197, 180, 147, 0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
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
  confidenceSuggested: { backgroundColor: 'rgba(197, 180, 147, 0.15)' },
  confidenceText: { fontSize: 10, color: PALETTE.textMain, textTransform: 'uppercase', fontWeight: '700', letterSpacing: 0.5 },
  insightDescription: { fontSize: 15, color: theme.textSecondary, lineHeight: 22, marginBottom: 10 },
  insightEvidence: { fontSize: 13, color: theme.textMuted, fontStyle: 'italic', marginBottom: 8 },
  insightActionable: { fontSize: 14, fontWeight: '600', marginTop: 4 },

  entriesSection: { marginBottom: 16 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', marginRight: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  filterChipActive: { backgroundColor: 'rgba(197, 180, 147, 0.2)', borderColor: '#C5B493' },
  filterChipText: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontFamily: Platform.select({ ios: 'Times New Roman', android: 'serif' }) },
  filterChipTextActive: { color: '#C5B493', fontWeight: 'bold' },
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
  fab: { width: 60, height: 60, borderRadius: 30, overflow: 'hidden', shadowColor: '#C5B493', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  fabPressed: { opacity: 0.9, transform: [{ scale: 0.95 }] },
  fabGradient: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
});

