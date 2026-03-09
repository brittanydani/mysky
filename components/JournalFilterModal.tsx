// File: components/JournalFilterModal.tsx
// MySky — Journal Filter & Search (The Librarian View)
//
// Slides down as an overlay over the Journal tab.
// Allows searching by keyword, filtering by mood range, tag, and entry type.
// Word Constellation keywords appear as clickable shortcuts.
//
// Trigger: Search icon on Journal header.

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Dimensions,
  Modal,
  ScrollView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { JournalEntry } from '../services/storage/models';
import { DailyCheckIn } from '../services/patterns/types';

const { width, height } = Dimensions.get('window');

// ── Palette ──
const PALETTE = {
  gold: '#C9AE78',
  silverBlue: '#8BC4E8',
  copper: '#CD7F5D',
  emerald: '#6EBF8B',
  amethyst: '#9D76C1',
  textMain: '#FFFFFF',
  textSoft: 'rgba(255,255,255,0.75)',
  textMuted: 'rgba(255,255,255,0.45)',
  glassBg: 'rgba(8, 14, 32, 0.97)',
  glassBorder: 'rgba(255,255,255,0.06)',
  chipBg: 'rgba(255,255,255,0.06)',
  chipActiveBg: 'rgba(201,174,120,0.18)',
  chipActiveBorder: 'rgba(201,174,120,0.45)',
};

// ─── Filter Types ─────────────────────────────────────────────────────────────

export type MoodRange = 'low' | 'mid' | 'high' | null;
export type EntryTypeFilter = 'all' | 'dreams' | 'journals' | 'high-tension';

export interface JournalFilterState {
  query: string;
  moodRange: MoodRange;
  tags: string[];
  entryType: EntryTypeFilter;
}

export const EMPTY_FILTER: JournalFilterState = {
  query: '',
  moodRange: null,
  tags: [],
  entryType: 'all',
};

// Active filter is any state that isn't the empty default
export function isFilterActive(f: JournalFilterState): boolean {
  return (
    f.query.trim().length > 0 ||
    f.moodRange !== null ||
    f.tags.length > 0 ||
    f.entryType !== 'all'
  );
}

// ── Tag options ──
const TAG_OPTIONS = [
  { label: 'Work', value: 'work', icon: 'briefcase-outline' },
  { label: 'Relationships', value: 'relationships', icon: 'heart-outline' },
  { label: 'Health', value: 'health', icon: 'medkit-outline' },
  { label: 'Nature', value: 'nature', icon: 'leaf-outline' },
  { label: 'Anxiety', value: 'anxiety', icon: 'alert-circle-outline' },
  { label: 'Clarity', value: 'clarity', icon: 'telescope-outline' },
  { label: 'Family', value: 'family', icon: 'people-outline' },
  { label: 'Conflict', value: 'conflict', icon: 'flash-outline' },
  { label: 'Movement', value: 'movement', icon: 'walk-outline' },
  { label: 'Social', value: 'social', icon: 'chatbubbles-outline' },
];

// ─── Helper: extract top keywords from entries ────────────────────────────────

function extractTopKeywords(entries: JournalEntry[], limit = 8): string[] {
  const counts: Record<string, number> = {};
  for (const entry of entries) {
    try {
      if (!entry.contentKeywords) continue;
      const parsed = JSON.parse(entry.contentKeywords) as { word: string; count: number }[];
      for (const kw of parsed) {
        if (kw.word && kw.word.length > 3) {
          counts[kw.word] = (counts[kw.word] ?? 0) + (kw.count ?? 1);
        }
      }
    } catch {}
  }
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([w]) => w);
}

// ─── Filter application logic (exported for journal.tsx) ─────────────────────

export function applyJournalFilter(
  entries: JournalEntry[],
  checkIns: DailyCheckIn[],
  filter: JournalFilterState,
): JournalEntry[] {
  if (!isFilterActive(filter)) return entries;

  const MOOD_LABELS_SCORE: Record<string, number> = {
    calm: 8, soft: 6, okay: 5, heavy: 3, stormy: 1,
  };

  // Build a date → mood score map from check-ins
  const moodByDate: Record<string, number> = {};
  for (const ci of checkIns) {
    moodByDate[ci.date] = Math.max(moodByDate[ci.date] ?? 0, ci.moodScore ?? 5);
  }

  return entries.filter((entry) => {
    // ── Keyword search ──
    if (filter.query.trim().length > 0) {
      const q = filter.query.toLowerCase();
      const searchable = [
        entry.title ?? '',
        entry.content ?? '',
        entry.contentKeywords ?? '',
      ].join(' ').toLowerCase();
      if (!searchable.includes(q)) return false;
    }

    // ── Mood range ──
    if (filter.moodRange !== null) {
      const score = MOOD_LABELS_SCORE[entry.mood ?? ''] ?? moodByDate[entry.date] ?? 5;
      if (filter.moodRange === 'low' && score > 3) return false;
      if (filter.moodRange === 'mid' && (score < 4 || score > 6)) return false;
      if (filter.moodRange === 'high' && score < 7) return false;
    }

    // ── Entry type ──
    if (filter.entryType === 'dreams') {
      // For dreams, we look for sleep-linked entries or dream keywords
      const hasDreamContent =
        (entry.content ?? '').length > 0 &&
        /(dream|dreamed|dreamt|nightmare)/i.test(entry.content ?? '');
      if (!hasDreamContent) return false;
    }
    if (filter.entryType === 'journals') {
      // Regular journals — not dreams
      const isDream = /(dream|dreamed|dreamt|nightmare)/i.test(entry.content ?? '');
      if (isDream) return false;
    }
    if (filter.entryType === 'high-tension') {
      const score = moodByDate[entry.date] ?? 5;
      const journalStress = MOOD_LABELS_SCORE[entry.mood ?? ''] ?? 5;
      if (score >= 5 && journalStress >= 5) return false; // filter only low-mood / high-stress days
      return score < 5 || journalStress < 4;
    }

    return true;
  });
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface JournalFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filter: JournalFilterState) => void;
  currentFilter: JournalFilterState;
  allEntries: JournalEntry[];
  resultCount: number;
}

export default function JournalFilterModal({
  visible,
  onClose,
  onApply,
  currentFilter,
  allEntries,
  resultCount,
}: JournalFilterModalProps) {
  const insets = useSafeAreaInsets();

  const [query, setQuery] = useState(currentFilter.query);
  const [moodRange, setMoodRange] = useState<MoodRange>(currentFilter.moodRange);
  const [selectedTags, setSelectedTags] = useState<string[]>(currentFilter.tags);
  const [entryType, setEntryType] = useState<EntryTypeFilter>(currentFilter.entryType);

  const inputRef = useRef<TextInput>(null);

  // Top keywords from all entries — serves as Word Constellation shortcuts
  const topKeywords = useMemo(() => extractTopKeywords(allEntries, 8), [allEntries]);

  // Sync filter state when currentFilter prop changes
  useEffect(() => {
    if (visible) {
      setQuery(currentFilter.query);
      setMoodRange(currentFilter.moodRange);
      setSelectedTags(currentFilter.tags);
      setEntryType(currentFilter.entryType);
    }
  }, [visible, currentFilter]);

  const handleApply = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    onApply({ query, moodRange, tags: selectedTags, entryType });
    onClose();
  }, [query, moodRange, selectedTags, entryType, onApply, onClose]);

  const handleClear = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    setQuery('');
    setMoodRange(null);
    setSelectedTags([]);
    setEntryType('all');
    onApply(EMPTY_FILTER);
    onClose();
  }, [onApply, onClose]);

  const toggleTag = useCallback((tag: string) => {
    Haptics.selectionAsync().catch(() => {});
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag],
    );
  }, []);

  const tapKeyword = useCallback((word: string) => {
    Haptics.selectionAsync().catch(() => {});
    setQuery(word);
  }, []);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback onPress={onClose}>
            <View style={styles.backdropTouchable} />
          </TouchableWithoutFeedback>

          <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
            {/* Handle bar */}
            <View style={styles.handleBar} />

            {/* Header */}
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Filter Archive</Text>
              <Pressable
                onPress={onClose}
                style={styles.closeBtn}
                accessibilityRole="button"
                accessibilityLabel="Close filter"
              >
                <Ionicons name="close" size={20} color={PALETTE.textMuted} />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.sheetScroll}
            >
              {/* ── Search Bar ── */}
              <View style={styles.searchRow}>
                <Ionicons name="search-outline" size={18} color={PALETTE.textMuted} style={styles.searchIcon} />
                <TextInput
                  ref={inputRef}
                  style={styles.searchInput}
                  placeholder="Search by keyword, name, or dream symbol…"
                  placeholderTextColor={PALETTE.textMuted}
                  value={query}
                  onChangeText={setQuery}
                  autoCorrect={false}
                  returnKeyType="search"
                  onSubmitEditing={handleApply}
                />
                {query.length > 0 && (
                  <Pressable onPress={() => setQuery('')} accessibilityRole="button" accessibilityLabel="Clear search">
                    <Ionicons name="close-circle" size={18} color={PALETTE.textMuted} />
                  </Pressable>
                )}
              </View>

              {/* ── Word Constellation shortcuts ── */}
              {topKeywords.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>YOUR FREQUENT WORDS</Text>
                  <View style={styles.chipRow}>
                    {topKeywords.map((word) => (
                      <Pressable
                        key={word}
                        onPress={() => tapKeyword(word)}
                        style={({ pressed }) => [
                          styles.chip,
                          query === word && styles.chipActive,
                          pressed && { opacity: 0.7 },
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={`Filter by ${word}`}
                      >
                        <Text style={[styles.chipText, query === word && styles.chipTextActive]}>
                          {word}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}

              {/* ── Mood Range ── */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>MOOD RANGE</Text>
                <View style={styles.chipRow}>
                  {([
                    { label: '1–3  Heavy', value: 'low', color: '#CD7F5D' },
                    { label: '4–6  Steady', value: 'mid', color: '#C9AE78' },
                    { label: '7–9  Radiant', value: 'high', color: '#6EBF8B' },
                  ] as { label: string; value: MoodRange; color: string }[]).map((opt) => (
                    <Pressable
                      key={opt.value as string}
                      onPress={() => {
                        Haptics.selectionAsync().catch(() => {});
                        setMoodRange(prev => prev === opt.value ? null : opt.value);
                      }}
                      style={({ pressed }) => [
                        styles.chip,
                        moodRange === opt.value && { backgroundColor: `${opt.color}18`, borderColor: `${opt.color}45` },
                        pressed && { opacity: 0.7 },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`Mood range ${opt.label}`}
                    >
                      <Text style={[
                        styles.chipText,
                        moodRange === opt.value && { color: opt.color },
                      ]}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* ── Tags ── */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>TAGS</Text>
                <View style={styles.chipRow}>
                  {TAG_OPTIONS.map((opt) => (
                    <Pressable
                      key={opt.value}
                      onPress={() => toggleTag(opt.value)}
                      style={({ pressed }) => [
                        styles.chip,
                        selectedTags.includes(opt.value) && styles.chipActive,
                        pressed && { opacity: 0.7 },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`Filter by ${opt.label}`}
                    >
                      <Ionicons
                        name={opt.icon as any}
                        size={12}
                        color={selectedTags.includes(opt.value) ? PALETTE.gold : PALETTE.textMuted}
                        style={{ marginRight: 4 }}
                      />
                      <Text style={[
                        styles.chipText,
                        selectedTags.includes(opt.value) && styles.chipTextActive,
                      ]}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* ── Entry Type ── */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>TYPE</Text>
                <View style={styles.chipRow}>
                  {([
                    { label: 'All Entries', value: 'all' },
                    { label: 'Dreams Only', value: 'dreams' },
                    { label: 'Journals Only', value: 'journals' },
                    { label: 'High Tension Days', value: 'high-tension' },
                  ] as { label: string; value: EntryTypeFilter }[]).map((opt) => (
                    <Pressable
                      key={opt.value}
                      onPress={() => {
                        Haptics.selectionAsync().catch(() => {});
                        setEntryType(opt.value);
                      }}
                      style={({ pressed }) => [
                        styles.chip,
                        entryType === opt.value && styles.chipActive,
                        pressed && { opacity: 0.7 },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`Show ${opt.label}`}
                    >
                      <Text style={[styles.chipText, entryType === opt.value && styles.chipTextActive]}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </ScrollView>

            {/* ── Action row ── */}
            <View style={styles.actionRow}>
              <Pressable
                style={({ pressed }) => [styles.clearBtn, pressed && { opacity: 0.7 }]}
                onPress={handleClear}
                accessibilityRole="button"
                accessibilityLabel="Clear all filters"
              >
                <Text style={styles.clearBtnText}>Clear</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.applyBtn, pressed && { opacity: 0.85 }]}
                onPress={handleApply}
                accessibilityRole="button"
                accessibilityLabel={`Show ${resultCount} results`}
              >
                <Text style={styles.applyBtnText}>
                  Show {resultCount} {resultCount === 1 ? 'entry' : 'entries'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  backdropTouchable: { flex: 1 },

  sheet: {
    backgroundColor: PALETTE.glassBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: PALETTE.glassBorder,
    maxHeight: height * 0.88,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },

  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.glassBorder,
  },
  sheetTitle: {
    color: PALETTE.textMain,
    fontSize: 17,
    fontWeight: '700',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  },
  closeBtn: { padding: 4 },

  sheetScroll: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },

  // Search
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 20,
    gap: 8,
  },
  searchIcon: {},
  searchInput: {
    flex: 1,
    color: PALETTE.textMain,
    fontSize: 14,
    padding: 0,
  },

  // Sections
  section: { marginBottom: 20 },
  sectionLabel: {
    color: PALETTE.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: PALETTE.chipBg,
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
  },
  chipActive: {
    backgroundColor: PALETTE.chipActiveBg,
    borderColor: PALETTE.chipActiveBorder,
  },
  chipText: {
    color: PALETTE.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  chipTextActive: {
    color: PALETTE.gold,
    fontWeight: '600',
  },

  // Action row
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: PALETTE.glassBorder,
    gap: 12,
  },
  clearBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  clearBtnText: { color: PALETTE.textMuted, fontSize: 14, fontWeight: '600' },
  applyBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(201,174,120,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(201,174,120,0.45)',
  },
  applyBtnText: { color: PALETTE.gold, fontSize: 14, fontWeight: '700' },
});
