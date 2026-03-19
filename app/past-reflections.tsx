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
import { BlurView } from 'expo-blur';
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
  bg: '#0A0A0C',
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
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  useFocusEffect(
    useCallback(() => {
      const init = async () => {
        const data = await loadReflections();
        setAllAnswers(data.answers);
        setGroups(groupByDate(data.answers, 'all'));
        // Auto-expand the most recent day
        if (data.answers.length > 0) {
          const sorted = [...data.answers].sort((a, b) => b.date.localeCompare(a.date));
          setExpandedDates(new Set([sorted[0].date]));
        }
      };
      init();
    }, []),
  );

  const applyFilter = (f: FilterOption) => {
    Haptics.selectionAsync().catch(() => {});
    setFilter(f);
    setGroups(groupByDate(allAnswers, f));
  };

  const toggleDate = (date: string) => {
    Haptics.selectionAsync().catch(() => {});
    setExpandedDates(prev => {
      const next = new Set(prev);
      if (next.has(date)) {
        next.delete(date);
      } else {
        next.add(date);
      }
      return next;
    });
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
        <Pressable
          style={styles.backBtn}
          onPress={() => { Haptics.selectionAsync().catch(() => {}); router.back(); }}
        >
          <MetallicIcon name="arrow-back" size={20} color={PALETTE.gold} />
          <MetallicText style={styles.backText} color={PALETTE.gold}>Daily Reflection</MetallicText>
        </Pressable>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View entering={FadeInDown.delay(80).duration(600)} style={styles.header}>
            <Text style={styles.headerTitle}>Past Reflections</Text>
            <GoldSubtitle style={styles.headerSubtitle}>
              Your sealed answers, organized by date
            </GoldSubtitle>
          </Animated.View>

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
              <BlurView intensity={15} tint="dark" style={StyleSheet.absoluteFill} />
              <MetallicIcon name="document-text-outline" size={36} color={PALETTE.textMuted} />
              <Text style={styles.emptyText}>
                No sealed reflections yet.{'\n'}Complete your first daily reflection to see them here.
              </Text>
            </Animated.View>
          )}

          {/* Day Groups */}
          {groups.map((group, gIdx) => {
            const isExpanded = expandedDates.has(group.date);

            return (
              <Animated.View
                key={group.date}
                entering={FadeInDown.delay(200 + gIdx * 80).duration(500)}
                style={styles.dayGroup}
              >
                {/* Day Header (tap to expand/collapse) */}
                <Pressable
                  style={styles.dayHeader}
                  onPress={() => toggleDate(group.date)}
                >
                  <View style={styles.dayHeaderLeft}>
                    <MetallicIcon
                      name={isExpanded ? 'chevron-down' : 'chevron-forward'}
                      size={16}
                      color={PALETTE.gold}
                    />
                    <Text style={styles.dayLabel}>{group.label}</Text>
                    <Text style={styles.dayDate}>{group.date}</Text>
                  </View>
                  <View style={styles.dayBadge}>
                    <Text style={styles.dayBadgeText}>
                      {group.answers.length} {group.answers.length === 1 ? 'answer' : 'answers'}
                    </Text>
                  </View>
                </Pressable>

                {/* Answers */}
                {isExpanded && group.answers.map((a, aIdx) => {
                  const catColor = CATEGORY_COLORS[a.category];

                  return (
                    <Animated.View
                      key={`${a.date}-${a.category}-${a.questionId}`}
                      entering={FadeInDown.delay(aIdx * 50).duration(400)}
                      style={styles.answerCard}
                    >
                      <BlurView intensity={15} tint="dark" style={StyleSheet.absoluteFill} />

                      <View style={styles.answerContent}>
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
                        <View style={styles.answerBubble}>
                          <Text style={styles.answerText}>{a.answer}</Text>
                        </View>
                      </View>
                    </Animated.View>
                  );
                })}
              </Animated.View>
            );
          })}

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
  container: { flex: 1, backgroundColor: PALETTE.bg },
  safeArea: { flex: 1 },
  topGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 400 },

  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 4,
  },
  backText: { fontSize: 14, color: PALETTE.gold, fontWeight: '600' },

  scrollContent: { paddingHorizontal: 24, paddingTop: 20 },

  header: { marginBottom: 20 },
  headerTitle: {
    fontSize: 34,
    color: PALETTE.textMain,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    fontWeight: '300',
    marginBottom: 8,
  },
  headerSubtitle: { fontSize: 14 },

  // Filter chips
  filterRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
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
  emptyCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
    padding: 40,
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    fontSize: 14,
    color: PALETTE.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Day groups
  dayGroup: {
    marginBottom: 20,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.glassBorder,
    marginBottom: 10,
  },
  dayHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dayLabel: {
    fontSize: 16,
    color: PALETTE.textMain,
    fontWeight: '600',
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

  // Answer cards
  answerCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
    marginBottom: 10,
  },
  answerContent: {
    padding: 16,
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  categoryTagIcon: { fontSize: 14 },
  categoryTagText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  questionText: {
    fontSize: 14,
    color: PALETTE.textMain,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    fontWeight: '400',
    lineHeight: 20,
    marginBottom: 12,
  },
  answerBubble: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(217, 191, 140, 0.1)',
  },
  answerText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 19,
  },
});
