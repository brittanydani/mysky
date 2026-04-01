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
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from '../components/ui/SkiaGradient';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/core';
import * as Haptics from 'expo-haptics';

import { SkiaDynamicCosmos } from '../components/ui/SkiaDynamicCosmos';
import { GoldSubtitle } from '../components/ui/GoldSubtitle';
import { MetallicText } from '../components/ui/MetallicText';
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

// ─────────────────────────────────────────────────────────────────────────────
// Palette (consistent with daily-reflection screen)
// ─────────────────────────────────────────────────────────────────────────────

const PALETTE = {
  gold: '#D9BF8C',
  lavender: '#A89BC8',
  silverBlue: '#8BC4E8',
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

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatDateLabel(dateStr: string): string {
  const today = new Date();
  const d = new Date(dateStr + 'T12:00:00'); // avoid timezone shift
  const diffMs = today.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return d.toLocaleDateString('en-US', {
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

  useFocusEffect(
    useCallback(() => {
      const init = async () => {
        const data = await loadReflections();
        setAllAnswers(data.answers);
        setGroups(groupByDate(data.answers, 'all'));
      };
      init();
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
          >
            <Text style={styles.closeIcon}>×</Text>
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
          </Animated.View>

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
              {group.answers.map((a, aIdx) => {
                  const catColor = CATEGORY_COLORS[a.category];

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
                    </LinearGradient>
                  );
                })}
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
  closeButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  closeIcon:   { color: '#FFF', fontSize: 24, lineHeight: 28 },

  scrollContent: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 140 },

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
    fontSize: 12,
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
    borderRadius: 12,
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
});
