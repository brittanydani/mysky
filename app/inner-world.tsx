// app/inner-world.tsx
// MySky — Inner World Hub
// Gateway to Core Values, Archetypes, and Cognitive Style tools,
// with daily reflection questions embedded per-category.

import React, { useCallback, useState, useRef } from 'react';
import { logger } from '../utils/logger';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from '../components/ui/SkiaGradient';
import { BlurView } from 'expo-blur';
import { useRouter, Href } from 'expo-router';
import Animated, { FadeInDown, FadeIn, Layout } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/core';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EncryptedAsyncStorage } from '../services/storage/encryptedAsyncStorage';
import * as Haptics from 'expo-haptics';

import { SkiaDynamicCosmos } from '../components/ui/SkiaDynamicCosmos';
import { GoldSubtitle } from '../components/ui/GoldSubtitle';
import { MetallicText } from '../components/ui/MetallicText';
import { MetallicIcon } from '../components/ui/MetallicIcon';
import {
  getReflectionDate,
  getTodayKey,
  getTodayQuestions,
  getCategorySealStatus,
  sealCategoryAnswers,
  loadReflections,
  getCurrentStreak,
  DayQuestions,
  ReflectionAnswer,
} from '../services/insights/dailyReflectionService';
import {
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  ANSWER_SCALES,
  CATEGORY_SCALE,
  ReflectionCategory,
} from '../constants/dailyReflectionQuestions';

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

const CATEGORY_RGB: Record<ReflectionCategory, string> = {
  values: '217, 191, 140',
  archetypes: '168, 155, 200',
  cognitive: '139, 196, 232',
};

type ToolId = 'values' | 'archetypes' | 'cognitive';

interface ToolCard {
  id: ToolId;
  title: string;
  description: string;
  icon: string;
  iconColor: string;
  accentRgb: string;
  route: Href;
}

const TOOLS: ToolCard[] = [
  {
    id: 'values',
    title: 'Core Values',
    description: 'Identify what guides your everyday choices and uncover hidden contradictions.',
    icon: '◈',
    iconColor: PALETTE.gold,
    accentRgb: '217, 191, 140',
    route: '/core-values' as Href,
  },
  {
    id: 'archetypes',
    title: 'Archetypes',
    description: 'Discover the Jungian patterns driving your behavior and relationships.',
    icon: '⬡',
    iconColor: PALETTE.lavender,
    accentRgb: '168, 155, 200',
    route: '/archetypes' as Href,
  },
  {
    id: 'cognitive',
    title: 'Cognitive Style',
    description: 'Map how your mind naturally processes information and makes decisions.',
    icon: '◉',
    iconColor: PALETTE.silverBlue,
    accentRgb: '139, 196, 232',
    route: '/cognitive-style' as Href,
  },
];

const CATEGORIES: ReflectionCategory[] = ['values', 'archetypes', 'cognitive'];

export default function InnerWorldScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  const [completion, setCompletion] = useState<Record<ToolId, boolean>>({
    values: false,
    archetypes: false,
    cognitive: false,
  });
  // Daily questions state
  const [categoryQuestions, setCategoryQuestions] = useState<
    Record<ReflectionCategory, DayQuestions>
  >({
    values: { category: 'values', questions: [] },
    archetypes: { category: 'archetypes', questions: [] },
    cognitive: { category: 'cognitive', questions: [] },
  });
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [categorySealed, setCategorySealed] = useState<Record<ReflectionCategory, boolean>>({
    values: false,
    archetypes: false,
    cognitive: false,
  });
  const [streak, setStreak] = useState(0);
  const [totalDays, setTotalDays] = useState(0);
  // Capture the date when questions loaded — prevents midnight edge case
  const loadedDateRef = useRef<string>(getTodayKey(getReflectionDate()));

  // Check storage on focus to dynamically update completion badges + load questions
  useFocusEffect(
    useCallback(() => {
      const checkProgress = async () => {
        try {
          const refDate = getReflectionDate();
          const today = getTodayKey(refDate);
          loadedDateRef.current = today;

          const [valuesRaw, archetypesRaw, cognitiveRaw, sealStatus, reflData, currentStreak] =
            await Promise.all([
              AsyncStorage.getItem('@mysky:core_values'),
              EncryptedAsyncStorage.getItem('@mysky:archetype_profile'),
              EncryptedAsyncStorage.getItem('@mysky:cognitive_style'),
              getCategorySealStatus(refDate),
              loadReflections(),
              getCurrentStreak(),
            ]);

          setCompletion({
            values: !!valuesRaw && JSON.parse(valuesRaw).topFive?.length > 0,
            archetypes: !!archetypesRaw,
            cognitive: !!cognitiveRaw && Object.keys(JSON.parse(cognitiveRaw)).length === 3,
          });

          // Load today's questions per category — use startedAt as per-user seed
          const userSeed = reflData.startedAt ?? undefined;
          const qs: Record<ReflectionCategory, DayQuestions> = {
            values: { category: 'values', questions: getTodayQuestions('values', refDate, userSeed) },
            archetypes: { category: 'archetypes', questions: getTodayQuestions('archetypes', refDate, userSeed) },
            cognitive: { category: 'cognitive', questions: getTodayQuestions('cognitive', refDate, userSeed) },
          };
          setCategoryQuestions(qs);
          setCategorySealed(sealStatus);

          // Pre-fill any already-sealed answers
          const todayAnswers = reflData.answers.filter(a => a.date === today);
          if (todayAnswers.length > 0) {
            const filled: Record<string, number> = {};
            for (const a of todayAnswers) {
              filled[`${a.category}-${a.questionId}`] = a.scaleValue ?? 0;
            }
            setAnswers(filled);
          } else {
            setAnswers({});
          }

          setStreak(currentStreak);
          setTotalDays(new Set(reflData.answers.map(a => a.date)).size);
        } catch (e) {
          logger.warn('[InnerWorld] Failed to load progress', e);
        }
      };

      checkProgress();
    }, [])
  );

  const nav = (route: Href) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.push(route);
  };

  const answerKey = (category: ReflectionCategory, questionId: number) =>
    `${category}-${questionId}`;

  const setAnswer = (category: ReflectionCategory, questionId: number, scaleValue: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setAnswers(prev => ({ ...prev, [answerKey(category, questionId)]: scaleValue }));
  };

  const isCategoryAllAnswered = (category: ReflectionCategory): boolean => {
    const qs = categoryQuestions[category].questions;
    if (qs.length === 0) return false;
    return qs.every(q => answers[answerKey(category, q.id)] !== undefined);
  };

  const handleSealCategory = async (category: ReflectionCategory) => {
    if (!isCategoryAllAnswered(category)) {
      Alert.alert('Incomplete', `Answer all ${CATEGORY_LABELS[category]} questions before sealing.`);
      return;
    }

    const sealDate = loadedDateRef.current;
    const qs = categoryQuestions[category].questions;
    const scale = ANSWER_SCALES[CATEGORY_SCALE[category]];
    const batch: Omit<ReflectionAnswer, 'sealedAt'>[] = qs.map(q => {
      const sv = answers[answerKey(category, q.id)] ?? 0;
      return {
        questionId: q.id,
        category,
        questionText: q.text,
        answer: scale[sv].label,
        scaleValue: sv,
        date: sealDate,
      };
    });

    try {
      const result = await sealCategoryAnswers(category, batch);
      setCategorySealed(prev => ({ ...prev, [category]: true }));
      setTotalDays(result.totalDaysCompleted);
      const s = await getCurrentStreak();
      setStreak(s);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch {
      Alert.alert('Error', 'Failed to save reflections. Please try again.');
    }
  };

  const allToolsCompleted = completion.values && completion.archetypes && completion.cognitive;
  const allCategoriesSealed = categorySealed.values && categorySealed.archetypes && categorySealed.cognitive;

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />

      <LinearGradient
        colors={['rgba(168, 155, 200, 0.08)', 'transparent']}
        style={styles.topGlow}
      />

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <Pressable
          style={styles.backBtn}
          onPress={() => { Haptics.selectionAsync().catch(() => {}); router.replace('/(tabs)/blueprint'); }}
        >
          <MetallicIcon name="arrow-back-outline" size={20} color={PALETTE.lavender} />
          <MetallicText style={styles.backText} color={PALETTE.lavender}>Identity</MetallicText>
        </Pressable>

          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View entering={FadeInDown.delay(80).duration(600)} style={styles.header}>
              <Text style={styles.headerTitle}>Inner World</Text>
              <GoldSubtitle style={styles.headerSubtitle}>Mind, values & cognitive patterns</GoldSubtitle>
            </Animated.View>

            {/* Sync Status Banner */}
            {allToolsCompleted && (
              <Animated.View entering={FadeInDown.duration(500)} layout={Layout.springify()} style={styles.syncBanner}>
                <MetallicIcon name="git-network-outline" size={16} color={PALETTE.emerald} />
                <MetallicText style={styles.syncText} color={PALETTE.emerald}>INNER WORLD SYNCHRONIZED</MetallicText>
              </Animated.View>
            )}

            {/* Stats Bar */}
            {(streak > 0 || totalDays > 0) && (
              <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.statsBar}>
                <View style={styles.statItem}>
                  <MetallicText style={styles.statValue} color={PALETTE.gold}>
                    {totalDays}
                  </MetallicText>
                  <Text style={styles.statLabel}>days</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <MetallicText style={styles.statValue} color={PALETTE.emerald}>
                    {streak}
                  </MetallicText>
                  <Text style={styles.statLabel}>streak</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <MetallicText style={styles.statValue} color={PALETTE.silverBlue}>
                    {CATEGORIES.filter(c => categorySealed[c]).length}/3
                  </MetallicText>
                  <Text style={styles.statLabel}>sealed</Text>
                </View>
              </Animated.View>
            )}

            {/* All Sealed Banner */}
            {allCategoriesSealed && (
              <Animated.View entering={FadeIn.duration(500)} style={styles.sealedBanner}>
                <MetallicIcon name="shield-checkmark-outline" size={16} color={PALETTE.emerald} />
                <MetallicText style={styles.sealedBannerText} color={PALETTE.emerald}>
                  ALL CATEGORIES SEALED TODAY
                </MetallicText>
              </Animated.View>
            )}

            {/* Tool Cards */}
            <View style={styles.grid}>
              {TOOLS.map((tool, i) => {
                const isDone = completion[tool.id];

                return (
                  <Animated.View
                    key={tool.id}
                    entering={FadeInDown.delay(160 + i * 80).duration(600)}
                    layout={Layout.springify()}
                  >
                    <Pressable
                      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                      onPress={() => nav(tool.route)}
                    >
                      <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                      <LinearGradient
                        colors={[`rgba(${tool.accentRgb}, 0.1)`, 'transparent']}
                        style={StyleSheet.absoluteFill}
                      />

                      <View style={styles.cardContent}>
                        <View style={styles.cardHeader}>
                          <MetallicText style={[styles.cardIcon]} color={tool.iconColor}>{tool.icon}</MetallicText>

                          <View style={[styles.badge, isDone ? { backgroundColor: `${PALETTE.emerald}20`, borderColor: `${PALETTE.emerald}40` } : { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }]}>
                            {isDone ? (
                              <MetallicText style={styles.badgeText} color={PALETTE.emerald}>SEALED</MetallicText>
                            ) : (
                              <Text style={[styles.badgeText, { color: PALETTE.textMuted }]}>EXPLORE</Text>
                            )}
                            {isDone && <MetallicIcon name="checkmark-outline" size={10} color={PALETTE.emerald} style={{ marginLeft: 4 }} />}
                          </View>
                        </View>

                        <View>
                          <Text style={styles.cardTitle}>{tool.title}</Text>
                          <Text style={styles.cardSubtitle}>{tool.description}</Text>
                        </View>
                      </View>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>

            {/* Daily Questions — per category */}
            <Animated.View entering={FadeInDown.delay(500).duration(600)} style={styles.dailyHeader}>
              <MetallicText style={styles.dailyHeaderTitle} color={PALETTE.gold}>Today's Questions</MetallicText>
              <GoldSubtitle style={styles.dailyHeaderSub}>Seal each category to complete the day</GoldSubtitle>
            </Animated.View>

            {CATEGORIES.map((category, catIdx) => {
              const dq = categoryQuestions[category];
              const color = CATEGORY_COLORS[category];
              const rgb = CATEGORY_RGB[category];
              const isSealed = categorySealed[category];
              const allAnswered = isCategoryAllAnswered(category);

              return (
                <Animated.View
                  key={category}
                  entering={FadeInDown.delay(560 + catIdx * 100).duration(600)}
                  layout={Layout.springify()}
                  style={styles.categorySection}
                >
                  {/* Category Header */}
                  <View style={styles.categoryHeader}>
                    <View style={styles.categoryHeaderLeft}>
                      <MetallicText style={styles.categoryIcon} color={color}>
                        {CATEGORY_ICONS[category]}
                      </MetallicText>
                      <MetallicText style={styles.categoryTitle} color={color}>
                        {CATEGORY_LABELS[category]}
                      </MetallicText>
                    </View>
                    {isSealed && (
                      <View style={styles.categorySealedBadge}>
                        <MetallicIcon name="lock-closed-outline" size={10} color={PALETTE.emerald} />
                        <MetallicText style={styles.categorySealedText} color={PALETTE.emerald}>SEALED</MetallicText>
                      </View>
                    )}
                  </View>

                  {/* Questions */}
                  {dq.questions.map((q, qIdx) => {
                    const key = answerKey(category, q.id);
                    const selectedValue = answers[key];
                    const hasAnswer = selectedValue !== undefined;
                    const scale = ANSWER_SCALES[CATEGORY_SCALE[category]];

                    return (
                      <Animated.View
                        key={q.id}
                        entering={FadeInDown.delay(620 + catIdx * 100 + qIdx * 60).duration(500)}
                        style={styles.questionCard}
                      >
                        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                        <LinearGradient
                          colors={[`rgba(${rgb}, 0.06)`, 'transparent']}
                          style={StyleSheet.absoluteFill}
                        />

                        <View style={styles.questionContent}>
                          <Text style={styles.questionText}>{q.text}</Text>

                          <View style={styles.scaleRow}>
                            {scale.map(opt => {
                              const isSelected = selectedValue === opt.value;
                              return (
                                <Pressable
                                  key={opt.value}
                                  style={[
                                    styles.scalePill,
                                    isSelected && {
                                      backgroundColor: `rgba(${rgb}, 0.25)`,
                                      borderColor: color,
                                    },
                                    isSealed && styles.scalePillSealed,
                                  ]}
                                  onPress={() => setAnswer(category, q.id, opt.value)}
                                  disabled={isSealed}
                                >
                                  <Text style={[
                                    styles.scalePillText,
                                    isSelected && { color },
                                    isSealed && isSelected && { color: PALETTE.emerald },
                                  ]}>
                                    {opt.label}
                                  </Text>
                                </Pressable>
                              );
                            })}
                          </View>

                          {hasAnswer && isSealed && (
                            <View style={styles.answerMeta}>
                              <MetallicIcon name="lock-closed-outline" size={11} color={PALETTE.emerald} />
                              <Text style={[styles.answerMetaText, { color: PALETTE.emerald }]}>
                                Sealed
                              </Text>
                            </View>
                          )}
                        </View>
                      </Animated.View>
                    );
                  })}

                  {/* Seal Category Button */}
                  {!isSealed && dq.questions.length > 0 && (
                    <Pressable
                      style={({ pressed }) => [
                        styles.sealCategoryButton,
                        { borderColor: `rgba(${rgb}, ${allAnswered ? '0.5' : '0.15'})` },
                        allAnswered && { backgroundColor: `rgba(${rgb}, 0.15)` },
                        pressed && allAnswered && styles.sealButtonPressed,
                      ]}
                      onPress={() => handleSealCategory(category)}
                      disabled={!allAnswered}
                    >
                      <MetallicIcon
                        name="shield-checkmark-outline"
                        size={16}
                        color={allAnswered ? color : PALETTE.textMuted}
                      />
                      <Text style={[
                        styles.sealCategoryText,
                        allAnswered ? { color } : { color: PALETTE.textMuted },
                      ]}>
                        Seal {CATEGORY_LABELS[category]}
                      </Text>
                    </Pressable>
                  )}
                </Animated.View>
              );
            })}

            {/* Journey Progress */}
            {totalDays > 0 && (
              <Animated.View entering={FadeIn.delay(900).duration(500)} style={styles.progressSection}>
                <Text style={styles.progressTitle}>Your Journey</Text>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${Math.min((totalDays / 365) * 100, 100)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.progressLabel}>
                  {totalDays} of 365 days — {Math.round((totalDays / 365) * 100)}% of a full cycle
                </Text>

                <Pressable
                  style={styles.pastLink}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    router.push('/past-reflections');
                  }}
                >
                  <MetallicIcon name="time-outline" size={16} color={PALETTE.gold} />
                  <MetallicText style={styles.pastLinkText} color={PALETTE.gold}>
                    View Past Reflections
                  </MetallicText>
                  <MetallicIcon name="chevron-forward-outline" size={14} color={PALETTE.gold} />
                </Pressable>
              </Animated.View>
            )}

            <View style={{ height: 120 }} />
          </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PALETTE.bg },
  safeArea: { flex: 1 },
  topGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 400 },

  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 4 },
  backText: { fontSize: 14, color: PALETTE.lavender, fontWeight: '600' },

  scrollContent: { paddingHorizontal: 24, paddingTop: 20 },
  header: { marginBottom: 32 },
  headerTitle: {
    fontSize: 34,
    color: PALETTE.textMain,
    fontFamily: Platform.select({ ios: 'SFProDisplay-Bold', android: 'sans-serif-bold', default: 'System' }),
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  headerSubtitle: { fontSize: 14 },

  syncBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(110, 191, 139, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(110, 191, 139, 0.3)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  syncText: { fontSize: 11, color: PALETTE.emerald, fontWeight: '800', letterSpacing: 1.5 },

  // Stats bar
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 20, fontWeight: '700' },
  statLabel: { fontSize: 10, color: PALETTE.textMuted, fontWeight: '600', letterSpacing: 1, marginTop: 2, textTransform: 'uppercase' },
  statDivider: { width: 1, height: 28, backgroundColor: PALETTE.glassBorder },

  // Sealed banner
  sealedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(110, 191, 139, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(110, 191, 139, 0.3)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  sealedBannerText: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },

  grid: { gap: 20, marginBottom: 36 },
  card: {
    height: 160,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
  },
  cardPressed: { transform: [{ scale: 0.98 }], opacity: 0.9 },
  cardContent: { flex: 1, padding: 24, justifyContent: 'space-between' },

  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardIcon: { fontSize: 32 },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },

  cardTitle: {
    fontSize: 20,
    color: PALETTE.textMain,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    fontWeight: '400',
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 13,
    color: PALETTE.textMuted,
    lineHeight: 18,
    paddingRight: 10,
  },

  // Daily questions header
  dailyHeader: { marginBottom: 24 },
  dailyHeaderTitle: {
    fontSize: 22,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    fontWeight: '400',
    marginBottom: 6,
  },
  dailyHeaderSub: { fontSize: 13 },

  // Category sections
  categorySection: { marginBottom: 28 },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  categoryHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  categoryIcon: { fontSize: 20 },
  categoryTitle: { fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  categorySealedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(110, 191, 139, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(110, 191, 139, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  categorySealedText: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },

  // Question cards
  questionCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
    marginBottom: 14,
  },
  questionContent: { padding: 20 },
  questionText: {
    fontSize: 15,
    color: PALETTE.textMain,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    fontWeight: '400',
    lineHeight: 22,
    marginBottom: 14,
  },

  // Scale pills
  scaleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  scalePill: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  scalePillSealed: {
    opacity: 0.7,
  },
  scalePillText: {
    fontSize: 13,
    color: PALETTE.textMuted,
    fontWeight: '600',
    letterSpacing: 0.2,
  },

  // Answer meta
  answerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
    alignSelf: 'flex-end',
  },
  answerMetaText: {
    fontSize: 10,
    color: PALETTE.textMuted,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  // Seal category button
  sealCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 4,
  },
  sealButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  sealCategoryText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Progress
  progressSection: {
    marginTop: 8,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: PALETTE.glassBorder,
  },
  progressTitle: {
    fontSize: 13,
    color: PALETTE.textMuted,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: PALETTE.gold,
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 12,
    color: PALETTE.textMuted,
    lineHeight: 16,
  },
  pastLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(217, 191, 140, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(217, 191, 140, 0.15)',
    borderRadius: 14,
  },
  pastLinkText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
});
