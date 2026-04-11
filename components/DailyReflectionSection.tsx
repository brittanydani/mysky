import React, { useCallback, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, Layout } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/core';
import * as Haptics from 'expo-haptics';

import { GoldSubtitle } from './ui/GoldSubtitle';
import { MetallicIcon } from './ui/MetallicIcon';
import { MetallicText } from './ui/MetallicText';
import { SkiaGradient as LinearGradient } from './ui/SkiaGradient';
import { type AppTheme } from '../constants/theme';
import { useAppTheme, useThemedStyles } from '../context/ThemeContext';
import { logger } from '../utils/logger';
import {
  clearPendingIfAllSealed,
  DayQuestions,
  getCategorySealStatus,
  getCurrentStreak,
  getOrCreateTodayQuestions,
  getReflectionDate,
  getTodayKey,
  loadReflectionDrafts,
  loadReflections,
  ReflectionAnswer,
  sealCategoryAnswers,
  upsertDraftAnswer,
} from '../services/insights/dailyReflectionService';
import {
  getSomaticReflectionCorrelations,
  syncArchetypeProfileFromReflections,
  syncCognitiveStyleFromReflections,
  syncCoreValuesFromReflections,
  syncIntelligenceFromReflections,
} from '../services/insights/reflectionProfileSync';
import {
  ANSWER_SCALES,
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  CATEGORY_SCALE,
  ReflectionCategory,
} from '../constants/dailyReflectionQuestions';

const PALETTE = {
  gold: '#D9BF8C',
  lavender: '#A89BC8',
  silverBlue: '#C9AE78',
  emerald: '#6EBF8B',
  rose: '#C88BA8',
  textMain: '#FFFFFF',
  textMuted: 'rgba(255,255,255,0.55)',
  glassBorder: 'rgba(255,255,255,0.08)',
};

const CATEGORY_COLORS: Record<ReflectionCategory, string> = {
  values: PALETTE.gold,
  archetypes: PALETTE.lavender,
  cognitive: PALETTE.silverBlue,
  intelligence: PALETTE.rose,
};

const CATEGORY_RGB: Record<ReflectionCategory, string> = {
  values: '217, 191, 140',
  archetypes: '168, 155, 200',
  cognitive: '139, 196, 232',
  intelligence: '200, 139, 168',
};

const CATEGORIES: ReflectionCategory[] = ['values', 'archetypes', 'cognitive', 'intelligence'];

interface DailyReflectionSectionProps {
  title?: string;
  subtitle?: string;
}

export default function DailyReflectionSection({
  title = "Today's Questions",
  subtitle = 'Record each category to complete the day',
}: DailyReflectionSectionProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [categoryQuestions, setCategoryQuestions] = useState<Record<ReflectionCategory, DayQuestions>>({
    values: { category: 'values', questions: [] },
    archetypes: { category: 'archetypes', questions: [] },
    cognitive: { category: 'cognitive', questions: [] },
    intelligence: { category: 'intelligence', questions: [] },
  });
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [categorySealed, setCategorySealed] = useState<Record<ReflectionCategory, boolean>>({
    values: false,
    archetypes: false,
    cognitive: false,
    intelligence: false,
  });
  const [categoryNotes, setCategoryNotes] = useState<Record<ReflectionCategory, string>>({
    values: '',
    archetypes: '',
    cognitive: '',
    intelligence: '',
  });
  const [streak, setStreak] = useState(0);
  const [totalDays, setTotalDays] = useState(0);
  const loadedDateRef = useRef<string>(getTodayKey(getReflectionDate()));

  useFocusEffect(
    useCallback(() => {
      const loadDailyReflections = async () => {
        try {
          const refDate = getReflectionDate();
          const today = getTodayKey(refDate);
          loadedDateRef.current = today;

          const [sealStatus, reflData, draftAnswers, currentStreak] = await Promise.all([
            getCategorySealStatus(refDate),
            loadReflections(),
            loadReflectionDrafts(),
            getCurrentStreak(),
          ]);

          const userSeed = reflData.startedAt ?? undefined;
          const [valuesQs, archetypesQs, cognitiveQs, intelligenceQs] = await Promise.all([
            getOrCreateTodayQuestions('values', refDate, userSeed),
            getOrCreateTodayQuestions('archetypes', refDate, userSeed),
            getOrCreateTodayQuestions('cognitive', refDate, userSeed),
            getOrCreateTodayQuestions('intelligence', refDate, userSeed),
          ]);

          setCategoryQuestions({
            values: { category: 'values', questions: valuesQs },
            archetypes: { category: 'archetypes', questions: archetypesQs },
            cognitive: { category: 'cognitive', questions: cognitiveQs },
            intelligence: { category: 'intelligence', questions: intelligenceQs },
          });

          const todayAnswers = reflData.answers.filter((answer) => answer.date === today);
          const todayDraftAnswers = draftAnswers.filter((answer) => answer.date === today);

          if (todayAnswers.length === 0) {
            setCategorySealed({ values: false, archetypes: false, cognitive: false, intelligence: false });
          } else {
            setCategorySealed(sealStatus);
          }

          if (todayAnswers.length > 0 || todayDraftAnswers.length > 0) {
            const filled: Record<string, number> = {};
            for (const answer of todayAnswers) {
              filled[`${answer.category}-${answer.questionId}`] = answer.scaleValue ?? 0;
            }
            for (const answer of todayDraftAnswers) {
              filled[`${answer.category}-${answer.questionId}`] = answer.scaleValue ?? 0;
            }
            setAnswers(filled);
          } else {
            setAnswers({});
          }

          setStreak(currentStreak);
          setTotalDays(new Set(reflData.answers.map((answer) => answer.date)).size);

          getSomaticReflectionCorrelations().catch(() => {});
        } catch (error) {
          logger.warn('[DailyReflectionSection] Failed to load progress', error);
        }
      };

      loadDailyReflections().catch(() => {});
    }, []),
  );

  const answerKey = (category: ReflectionCategory, questionId: number) => `${category}-${questionId}`;

  const syncCategoryProfile = (category: ReflectionCategory, includeDrafts = false) => {
    if (category === 'archetypes') {
      return syncArchetypeProfileFromReflections(includeDrafts ? { includeDrafts: true } : {}).catch(() => {});
    }
    if (category === 'cognitive') {
      return syncCognitiveStyleFromReflections(includeDrafts ? { includeDrafts: true } : {}).catch(() => {});
    }
    if (category === 'values') {
      return syncCoreValuesFromReflections(includeDrafts ? { includeDrafts: true } : {}).catch(() => {});
    }
    return syncIntelligenceFromReflections(includeDrafts ? { includeDrafts: true } : {}).catch(() => {});
  };

  const setAnswer = (category: ReflectionCategory, questionId: number, scaleValue: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setAnswers((prev) => ({ ...prev, [answerKey(category, questionId)]: scaleValue }));

    const questionText = categoryQuestions[category].questions.find((question) => question.id === questionId)?.text;
    const scale = ANSWER_SCALES[CATEGORY_SCALE[category]];
    if (!questionText || !scale[scaleValue]) return;

    upsertDraftAnswer({
      questionId,
      category,
      questionText,
      answer: scale[scaleValue].label,
      scaleValue,
      date: loadedDateRef.current,
    }).then(() => {
      syncCategoryProfile(category, true);
    }).catch(() => {});
  };

  const isCategoryAllAnswered = (category: ReflectionCategory): boolean => {
    const questions = categoryQuestions[category].questions;
    if (questions.length === 0) return false;
    return questions.every((question) => answers[answerKey(category, question.id)] !== undefined);
  };

  const handleSealCategory = async (category: ReflectionCategory) => {
    if (!isCategoryAllAnswered(category)) {
      Alert.alert('Incomplete', `Answer all ${CATEGORY_LABELS[category]} questions before sealing.`);
      return;
    }

    const sealDate = loadedDateRef.current;
    const questions = categoryQuestions[category].questions;
    const scale = ANSWER_SCALES[CATEGORY_SCALE[category]];
    const batch: Omit<ReflectionAnswer, 'sealedAt'>[] = questions.map((question) => {
      const scaleValue = answers[answerKey(category, question.id)] ?? 0;
      return {
        questionId: question.id,
        category,
        questionText: question.text,
        answer: scale[scaleValue].label,
        scaleValue,
        date: sealDate,
      };
    });

    try {
      const result = await sealCategoryAnswers(category, batch, categoryNotes[category] || undefined);
      setCategorySealed((prev) => ({ ...prev, [category]: true }));
      setTotalDays(result.totalDaysCompleted);
      setStreak(await getCurrentStreak());
      await clearPendingIfAllSealed();
      syncCategoryProfile(category);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch {
      Alert.alert('Error', 'Failed to save reflections. Please try again.');
    }
  };

  const allCategoriesSealed = CATEGORIES.every((category) => categorySealed[category]);
  const sealedCount = CATEGORIES.filter((category) => categorySealed[category]).length;
  const reflectionCardGradient = (rgb: string): [string, string] => (
    theme.isDark
      ? [`rgba(${rgb}, 0.06)`, 'rgba(10,10,15,0.85)']
      : [`rgba(${rgb}, 0.12)`, theme.cardSurfaceStrong]
  );

  return (
    <View style={styles.container}>
      {(streak > 0 || totalDays > 0) && (
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.statsBar}>
          <View style={styles.statItem}>
            <MetallicText style={styles.statValue} color={PALETTE.gold}>
              {totalDays}
            </MetallicText>
            <Text style={styles.statLabel}>reflection days</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <MetallicText style={styles.statValue} color={PALETTE.emerald}>
              {streak}
            </MetallicText>
            <Text style={styles.statLabel}>current streak</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <MetallicText style={styles.statValue} color={PALETTE.silverBlue}>
              {sealedCount}/4
            </MetallicText>
            <Text style={styles.statLabel}>categories sealed</Text>
          </View>
        </Animated.View>
      )}

      {allCategoriesSealed && (
        <Animated.View entering={FadeIn.duration(500)} style={styles.sealedBanner}>
          <MetallicIcon name="shield-checkmark-outline" size={16} color={PALETTE.emerald} />
          <MetallicText style={styles.sealedBannerText} color={PALETTE.emerald}>
            ALL CATEGORIES RECORDED TODAY
          </MetallicText>
        </Animated.View>
      )}

      <Animated.View entering={FadeInDown.delay(160).duration(600)} style={styles.dailyHeader}>
        <MetallicText style={styles.dailyHeaderTitle} color={PALETTE.gold}>{title}</MetallicText>
        <GoldSubtitle style={styles.dailyHeaderSub}>{subtitle}</GoldSubtitle>
      </Animated.View>

      {CATEGORIES.map((category, categoryIndex) => {
        const dayQuestions = categoryQuestions[category];
        const color = CATEGORY_COLORS[category];
        const rgb = CATEGORY_RGB[category];
        const isSealed = categorySealed[category];
        const allAnswered = isCategoryAllAnswered(category);

        return (
          <Animated.View
            key={category}
            entering={FadeInDown.delay(220 + categoryIndex * 100).duration(600)}
            layout={Layout.springify()}
            style={styles.categorySection}
          >
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
                  <MetallicText style={styles.categorySealedText} color={PALETTE.emerald}>RECORDED</MetallicText>
                </View>
              )}
            </View>

            {dayQuestions.questions.map((question, questionIndex) => {
              const key = answerKey(category, question.id);
              const selectedValue = answers[key];
              const hasAnswer = selectedValue !== undefined;
              const scale = ANSWER_SCALES[CATEGORY_SCALE[category]];

              return (
                <Animated.View
                  key={question.id}
                  entering={FadeInDown.delay(280 + categoryIndex * 100 + questionIndex * 60).duration(500)}
                >
                  <LinearGradient colors={reflectionCardGradient(rgb)} style={styles.questionCard}>
                    <Text style={styles.questionText}>{question.text}</Text>

                    <View style={styles.scaleRow}>
                      {scale.map((option) => {
                        const isSelected = selectedValue === option.value;
                        return (
                          <Pressable
                            key={option.value}
                            style={[
                              styles.scalePill,
                              styles.scalePillHalf,
                              isSelected && {
                                backgroundColor: `rgba(${rgb}, 0.25)`,
                                borderColor: color,
                              },
                              isSealed && styles.scalePillSealed,
                            ]}
                            onPress={() => setAnswer(category, question.id, option.value)}
                            disabled={isSealed}
                          >
                            <Text
                              style={[
                                styles.scalePillText,
                                isSelected && { color },
                                isSealed && isSelected && { color: PALETTE.emerald },
                              ]}
                            >
                              {option.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>

                    {hasAnswer && isSealed && (
                      <View style={styles.answerMeta}>
                        <MetallicIcon name="lock-closed-outline" size={11} color={PALETTE.emerald} />
                        <Text style={[styles.answerMetaText, { color: PALETTE.emerald }]}>Recorded</Text>
                      </View>
                    )}
                  </LinearGradient>
                </Animated.View>
              );
            })}

            {!isSealed && allAnswered && dayQuestions.questions.length > 0 && (
              <View style={styles.notesContainer}>
                <View style={styles.notesLabelRow}>
                  <Text style={styles.notesLabel}>What made you think of this today?</Text>
                  <Text style={styles.notesOptional}>Optional</Text>
                </View>
                <TextInput
                  style={styles.notesInput}
                  value={categoryNotes[category]}
                  onChangeText={(text) => setCategoryNotes((prev) => ({ ...prev, [category]: text }))}
                  placeholder="A sentence or two about what surfaced…"
                  placeholderTextColor={theme.textMuted}
                  multiline
                  maxLength={300}
                  returnKeyType="done"
                  blurOnSubmit
                />
              </View>
            )}

            {!isSealed && dayQuestions.questions.length > 0 && (
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
                <Text style={[styles.sealCategoryText, allAnswered ? { color } : { color: PALETTE.textMuted }]}>
                  Record {CATEGORY_LABELS[category]}
                </Text>
              </Pressable>
            )}

            {isSealed && (
              <Pressable
                style={({ pressed }) => [
                  styles.sealCategoryButton,
                  {
                    borderColor: 'rgba(110,191,139,0.3)',
                    backgroundColor: 'rgba(110,191,139,0.08)',
                  },
                  pressed && styles.sealButtonPressed,
                ]}
                onPress={() => {
                  setCategorySealed((prev) => ({ ...prev, [category]: false }));
                }}
              >
                <MetallicIcon name="lock-open-outline" size={16} color={PALETTE.emerald} />
                <Text style={[styles.sealCategoryText, { color: PALETTE.emerald }]}>Reopen to Edit</Text>
              </Pressable>
            )}
          </Animated.View>
        );
      })}
    </View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { marginBottom: 32 },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : theme.cardSurface,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 20, fontWeight: '700' },
  statLabel: {
    fontSize: 10,
    color: theme.textMuted,
    fontWeight: '600',
    letterSpacing: 1,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  statDivider: { width: 1, height: 28, backgroundColor: theme.cardBorder },
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
  dailyHeader: { marginBottom: 24 },
  dailyHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  dailyHeaderSub: { fontSize: 13, color: theme.textSecondary },
  categorySection: { marginBottom: 28 },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
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
  questionCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    marginBottom: 14,
    padding: 28,
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : theme.cardSurfaceStrong,
  },
  questionText: {
    fontSize: 15,
    color: theme.textPrimary,
    fontWeight: '400',
    lineHeight: 22,
    marginBottom: 14,
  },
  scaleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  scalePill: {
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : theme.pillSurface,
  },
  scalePillHalf: {
    flexBasis: '48%',
    maxWidth: '48%',
  },
  scalePillSealed: { opacity: 0.7 },
  scalePillText: {
    fontSize: 13,
    color: PALETTE.textMuted,
    fontWeight: '600',
    letterSpacing: 0.2,
    lineHeight: 15,
    textAlign: 'center',
  },
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
  notesContainer: {
    marginTop: 12,
    marginBottom: 4,
    gap: 8,
  },
  notesLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  notesLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.3,
    flex: 1,
  },
  notesOptional: {
    color: theme.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  notesInput: {
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : theme.cardSurface,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: theme.textPrimary,
    lineHeight: 20,
    minHeight: 72,
    textAlignVertical: 'top',
  },
});