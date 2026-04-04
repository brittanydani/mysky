// app/past-reflections.tsx
// MySky — Past Reflections Browser
// Browse sealed reflections grouped by date, filterable by category.

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from '../components/ui/SkiaGradient';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/core';
import * as Haptics from 'expo-haptics';

import { SkiaDynamicCosmos } from '../components/ui/SkiaDynamicCosmos';
import { GoldSubtitle } from '../components/ui/GoldSubtitle';
import { MetallicIcon } from '../components/ui/MetallicIcon';

import {
  loadReflections,
  ReflectionAnswer,
} from '../services/insights/dailyReflectionService';
import {
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  ReflectionCategory,
} from '../constants/dailyReflectionQuestions';
import { VALUES_THEME_MAP } from '../services/insights/reflectionProfileSync';

// ─────────────────────────────────────────────────────────────────────────────
// Palette (consistent with daily-reflection screen)
// ─────────────────────────────────────────────────────────────────────────────

const PALETTE = {
  gold: '#D9BF8C',
  lavender: '#A89BC8',
  silverBlue: '#C9AE78',
  emerald: '#6EBF8B',
  rose: '#C88BA8',
  textMain: '#FFFFFF',
  textMuted: 'rgba(255,255,255,0.55)',
  glassBorder: 'rgba(255,255,255,0.08)',
  bg: '#020817',
};

const CATEGORY_COLORS: Record<ReflectionCategory, string> = {
  values: PALETTE.gold,
  archetypes: PALETTE.lavender,
  cognitive: PALETTE.silverBlue,
};

type FilterOption = 'all' | ReflectionCategory;

interface DayGroup {
  date: string;
  label: string;
  answers: ReflectionAnswer[];
}

interface ThemeTrend {
  theme: string;
  early: number;  // avg scaleValue, first half of sealed dates
  recent: number; // avg scaleValue, second half
  direction: 'rising' | 'falling' | 'steady';
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function computeThemeTrends(answers: ReflectionAnswer[]): ThemeTrend[] {
  const valuesAnswers = answers.filter(a => a.category === 'values' && a.scaleValue != null);
  if (valuesAnswers.length < 6) return [];

  // Sort by date ascending
  const sorted = [...valuesAnswers].sort((a, b) => a.date.localeCompare(b.date));
  const mid = Math.floor(sorted.length / 2);
  const earlyAnswers = sorted.slice(0, mid);
  const recentAnswers = sorted.slice(mid);

  const results: ThemeTrend[] = [];

  for (const entry of VALUES_THEME_MAP) {
    const [lo, hi] = entry.range;
    const themeName = entry.values[0]; // Use first value as label
    const earlyTheme = earlyAnswers.filter(a => a.questionId >= lo && a.questionId <= hi);
    const recentTheme = recentAnswers.filter(a => a.questionId >= lo && a.questionId <= hi);
    if (earlyTheme.length < 2 || recentTheme.length < 2) continue;

    const avgEarly = earlyTheme.reduce((s, a) => s + (a.scaleValue ?? 0), 0) / earlyTheme.length;
    const avgRecent = recentTheme.reduce((s, a) => s + (a.scaleValue ?? 0), 0) / recentTheme.length;

    const delta = avgRecent - avgEarly;
    const direction: ThemeTrend['direction'] =
      delta >= 0.4 ? 'rising' : delta <= -0.4 ? 'falling' : 'steady';

    results.push({ theme: themeName, early: avgEarly, recent: avgRecent, direction });
  }

  return results.sort((a, b) => Math.abs(b.recent - b.early) - Math.abs(a.recent - a.early));
}

function formatDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  // Local midnight for the entry date — avoids UTC-parse timezone offset
  const entryMidnight = new Date(y, m - 1, d);
  const now = new Date();
  // Compare against today's local midnight for calendar-day diff
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((todayMidnight.getTime() - entryMidnight.getTime()) / 86400000);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return entryMidnight.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function groupByDate(answers: ReflectionAnswer[], filter: FilterOption): DayGroup[] {
  const filtered = filter === 'all' ? answers : answers.filter(a => a.category === filter);

  const map = new Map<string, ReflectionAnswer[]>();
  for (const a of filtered) {
    const existing = map.get(a.date);
    if (existing) {
      existing.push(a);
    } else {
      map.set(a.date, [a]);
    }
  }

  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0])) // newest first
    .map(([date, dayAnswers]) => ({
      date,
      label: formatDateLabel(date),
      answers: dayAnswers,
    }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────────────────────

export default function PastReflectionsScreen() {
  const router = useRouter();
  const [groups, setGroups] = useState<DayGroup[]>([]);
  const [filter, setFilter] = useState<FilterOption>('all');
  const [allAnswers, setAllAnswers] = useState<ReflectionAnswer[]>([]);
  const [showTrends, setShowTrends] = useState(false);
  const [trends, setTrends] = useState<ThemeTrend[]>([]);

  useFocusEffect(
    useCallback(() => {
      const init = async () => {
        try {
          const data = await loadReflections();
          setAllAnswers(data.answers);
          setGroups(groupByDate(data.answers, 'all'));          setTrends(computeThemeTrends(data.answers));        } catch { /* retain empty state on failure */ }
      };
      init().catch(() => {});
    }, []),
  );

  const applyFilter = (f: FilterOption) => {
    Haptics.selectionAsync().catch(() => {});
    setFilter(f);
    setGroups(groupByDate(allAnswers, f));
  };

  const FILTERS: { key: FilterOption; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'values', label: 'Values' },
    { key: 'archetypes', label: 'Archetypes' },
    { key: 'cognitive', label: 'Cognitive' },
  ];

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />

      <LinearGradient
        colors={['rgba(217, 191, 140, 0.06)', 'transparent']}
        style={styles.topGlow}
      />

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable
            style={styles.closeButton}
            onPress={() => { Haptics.selectionAsync().catch(() => {}); router.back(); }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <MetallicIcon name="close-outline" size={22} color={PALETTE.textMuted} />
          </Pressable>
        </View>

        <View style={styles.titleArea}>
          <Text style={styles.headerTitle}>Past Reflections</Text>
          <GoldSubtitle style={styles.headerSubtitle}>
            Your sealed answers, organized by date
          </GoldSubtitle>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >

          {/* Filter Chips */}
          <Animated.View entering={FadeInDown.delay(140).duration(500)} style={styles.filterRow}>
            {FILTERS.map(f => {
              const active = filter === f.key;
              const chipColor = f.key === 'all'
                ? PALETTE.textMain
                : CATEGORY_COLORS[f.key as ReflectionCategory];
              return (
                <Pressable
                  key={f.key}
                  style={[styles.filterChip, active && { borderColor: chipColor }]}
                  onPress={() => applyFilter(f.key)}
                >
                  <Text style={[
                    styles.filterLabel,
                    active && { color: chipColor },
                  ]}>
                    {f.label}
                  </Text>
                </Pressable>
              );
            })}
            {trends.length > 0 && (
              <Pressable
                style={[styles.filterChip, showTrends && { borderColor: PALETTE.lavender }]}
                onPress={() => { Haptics.selectionAsync().catch(() => {}); setShowTrends(v => !v); }}
              >
                <Text style={[styles.filterLabel, showTrends && { color: PALETTE.lavender }]}>
                  Trends
                </Text>
              </Pressable>
            )}
          </Animated.View>

          {/* Trends View */}
          {showTrends && trends.length > 0 && (
            <Animated.View entering={FadeInDown.delay(60).duration(400)} style={styles.trendsSection}>
              <Text style={styles.trendsSectionHeader}>HOW YOU'VE CHANGED</Text>
              <Text style={styles.trendsSectionSub}>
                Comparing your earliest vs. most recent values reflections
              </Text>
              {trends.map((t, i) => {
                const arrow = t.direction === 'rising' ? '▲' : t.direction === 'falling' ? '▼' : '—';
                const arrowColor = t.direction === 'rising'
                  ? PALETTE.emerald
                  : t.direction === 'falling'
                    ? PALETTE.rose
                    : PALETTE.textMuted;
                return (
                  <View key={t.theme} style={styles.trendRow}>
                    <View style={styles.trendThemeBox}>
                      <Text style={styles.trendTheme}>{t.theme}</Text>
                    </View>
                    <View style={styles.trendBar}>
                      <View
                        style={[
                          styles.trendBarFill,
                          { width: `${Math.min(100, (t.recent / 3) * 100)}%`, backgroundColor: arrowColor },
                        ]}
                      />
                    </View>
                    <Text style={[styles.trendArrow, { color: arrowColor }]}>{arrow}</Text>
                    <Text style={styles.trendScore}>{t.recent.toFixed(1)}</Text>
                  </View>
                );
              })}
            </Animated.View>
          )}

          {/* Empty State */}
          {groups.length === 0 && (
            <Animated.View entering={FadeIn.duration(500)} style={styles.emptyCard}>
              <MetallicIcon name="document-text-outline" size={36} color={PALETTE.textMuted} />
              <Text style={styles.emptyText}>
                No sealed reflections yet.{'\n'}Complete your first daily reflection to see them here.
              </Text>
            </Animated.View>
          )}

          {/* Day Groups */}
          {groups.map((group, gIdx) => (
            <Animated.View
              key={group.date}
              entering={FadeInDown.delay(200 + gIdx * 80).duration(500)}
              style={styles.dayGroup}
            >
              {/* Day Header */}
              <View style={styles.dayHeader}>
                <View style={styles.dayHeaderLeft}>
                  <Text style={styles.dayLabel}>{group.label}</Text>
                  <Text style={styles.dayDate}>{group.date}</Text>
                </View>
                <View style={styles.dayBadge}>
                  <Text style={styles.dayBadgeText}>{group.answers.length}</Text>
                </View>
              </View>

              {/* Answers */}
              {(() => {
                // Track which category notes have already been displayed this day
                const shownNoteCategories = new Set<string>();
                return group.answers.map((a) => {
                  const catColor = CATEGORY_COLORS[a.category];
                  // Show the note once per category per day (notes are spread on all answers in batch)
                  const noteKey = `${a.date}-${a.category}`;
                  const showNote = !!a.notes?.trim() && !shownNoteCategories.has(noteKey);
                  if (showNote) shownNoteCategories.add(noteKey);

                  return (
                    <LinearGradient
                      key={`${a.date}-${a.category}-${a.questionId}`}
                      colors={[`${catColor}18`, 'transparent']}
                      style={styles.answerCard}
                    >
                      {/* Category tag */}
                      <View style={styles.categoryTag}>
                        <Text style={[styles.categoryTagIcon, { color: catColor }]}>
                          {CATEGORY_ICONS[a.category]}
                        </Text>
                        <Text style={[styles.categoryTagText, { color: catColor }]}>
                          {CATEGORY_LABELS[a.category]}
                        </Text>
                      </View>

                      {/* Question */}
                      <Text style={styles.questionText}>{a.questionText}</Text>

                      {/* Answer */}
                      <Text style={styles.answerText}>{a.answer}</Text>

                      {/* Note — shown once per category per day */}
                      {showNote && (
                        <Text style={styles.answerNote}>"{a.notes}"</Text>
                      )}
                    </LinearGradient>
                  );
                });
              })()}
            </Animated.View>
          ))}

          <View style={{ height: 120 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020817' },
  safeArea: { flex: 1 },
  topGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 400 },

  header:      { flexDirection: 'row', alignItems: 'center', paddingTop: 8, paddingHorizontal: 24, paddingBottom: 8 },
  titleArea:   { paddingHorizontal: 24, paddingBottom: 8 },
  closeButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },

  scrollContent: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 140 },

  headerTitle: {
    fontSize: 34,
    color: PALETTE.textMain,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  headerSubtitle: { fontSize: 12, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)' },

  // Filter chips
  filterRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 32,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  filterLabel: {
    fontSize: 13,
    color: PALETTE.textMuted,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Empty state
  emptyCard: { borderRadius: 24, borderWidth: 1, borderColor: PALETTE.glassBorder, padding: 40, alignItems: 'center', gap: 16, backgroundColor: 'rgba(255,255,255,0.02)' },
  emptyText: {
    fontSize: 14,
    color: PALETTE.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Day groups
  dayGroup: {
    marginBottom: 32,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dayHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dayLabel: {
    fontSize: 16,
    color: PALETTE.textMain,
    fontWeight: '700',
  },
  dayDate: {
    fontSize: 12,
    color: PALETTE.textMuted,
    fontWeight: '500',
  },
  dayBadge: {
    backgroundColor: 'rgba(217, 191, 140, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(217, 191, 140, 0.15)',
  },
  dayBadgeText: {
    fontSize: 11,
    color: PALETTE.gold,
    fontWeight: '700',
  },

  // Answer cards — match blueprint identity card style
  answerCard: {
    padding: 28,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
    backgroundColor: 'rgba(255,255,255,0.02)',
    marginBottom: 16,
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  categoryTagIcon: { fontSize: 14 },
  categoryTagText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  questionText: {
    fontSize: 20,
    color: PALETTE.textMain,
    fontWeight: '700',
    lineHeight: 28,
    marginBottom: 8,
  },
  answerText: {
    fontSize: 16,
    color: PALETTE.textMuted,
    lineHeight: 24,
  },
  answerNote: {
    marginTop: 12,
    fontSize: 13,
    color: 'rgba(255,255,255,0.35)',
    fontStyle: 'italic',
    lineHeight: 19,
  },

  // Trends section
  trendsSection: {
    marginBottom: 32,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(168,155,200,0.2)',
    backgroundColor: 'rgba(168,155,200,0.04)',
    padding: 24,
    gap: 14,
  },
  trendsSectionHeader: {
    fontSize: 10,
    color: PALETTE.lavender,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  trendsSectionSub: {
    fontSize: 12,
    color: PALETTE.textMuted,
    lineHeight: 17,
    marginBottom: 4,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  trendThemeBox: {
    width: 90,
  },
  trendTheme: {
    fontSize: 12,
    color: PALETTE.textMain,
    fontWeight: '700',
  },
  trendBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.07)',
    overflow: 'hidden',
  },
  trendBarFill: {
    height: '100%',
    borderRadius: 3,
    opacity: 0.8,
  },
  trendArrow: {
    fontSize: 12,
    fontWeight: '800',
    width: 16,
    textAlign: 'center',
  },
  trendScore: {
    fontSize: 12,
    color: PALETTE.textMuted,
    fontWeight: '700',
    width: 28,
    textAlign: 'right',
  },
});
