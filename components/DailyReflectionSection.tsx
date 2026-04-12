// File: components/DailyReflectionSection.tsx
// MySky — Today's Questions
//
// Updated to "Lunar Sky" Smoked Glass Aesthetic:
// 1. Purged "goldenish" mud and legacy RGB constants.
// 2. Integrated Semantic Smoked Glass washes from theme.
// 3. Implemented "Tactile Hardware" scale selectors (Recessed vs. Raised).
// 4. Integrated "Velvet Glass" directional light-catch borders.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  Layout,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/core';
import * as Haptics from 'expo-haptics';

import { GoldSubtitle } from './ui/GoldSubtitle';
import { MetallicIcon } from './ui/MetallicIcon';
import { MetallicText } from './ui/MetallicText';
import { SkiaGradient as LinearGradient } from './ui/SkiaGradient';
import { VelvetGlassSurface } from './ui/VelvetGlassSurface';
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

  const headerOpacity = useSharedValue(1);
  const headerAnimStyle = useAnimatedStyle(() => ({
    opacity: withTiming(headerOpacity.value, { duration: 250 }),
  }));

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardWillShow', () => { headerOpacity.value = 0; });
    const hideSub = Keyboard.addListener('keyboardWillHide', () => { headerOpacity.value = 1; });
    return () => { showSub.remove(); hideSub.remove(); };
  }, [headerOpacity]);

  const [categoryQuestions, setCategoryQuestions] = useState<Record<ReflectionCategory, DayQuestions>>({
    values: { category: 'values', questions: [] },
    archetypes: { category: 'archetypes', questions: [] },
    cognitive: { category: 'cognitive', questions: [] },
    intelligence: { category: 'intelligence', questions: [] },
  });
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [categorySealed, setCategorySealed] = useState<Record<ReflectionCategory, boolean>>({
    values: false, archetypes: false, cognitive: false, intelligence: false,
  });
  const [categoryNotes, setCategoryNotes] = useState<Record<ReflectionCategory, string>>({
    values: '', archetypes: '', cognitive: '', intelligence: '',
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

          setCategorySealed(reflData.answers.length === 0 ? { values: false, archetypes: false, cognitive: false, intelligence: false } : sealStatus);

          const filled: Record<string, number> = {};
          [...reflData.answers, ...draftAnswers].forEach(a => {
            if (a.date === today) filled[`${a.category}-${a.questionId}`] = a.scaleValue ?? 0;
          });
          setAnswers(filled);
          setStreak(currentStreak);
          setTotalDays(new Set(reflData.answers.map(a => a.date)).size);
        } catch (error) {
          logger.warn('[DailyReflectionSection] Failed to load progress', error);
        }
      };
      loadDailyReflections().catch(() => {});
    }, []),
  );

  const setAnswer = (category: ReflectionCategory, questionId: number, scaleValue: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const key = `${category}-${questionId}`;
    setAnswers(prev => ({ ...prev, [key]: scaleValue }));

    const question = categoryQuestions[category].questions.find(q => q.id === questionId);
    const scale = ANSWER_SCALES[CATEGORY_SCALE[category]];
    if (!question || !scale[scaleValue]) return;

    upsertDraftAnswer({
      questionId, category, questionText: question.text,
      answer: scale[scaleValue].label, scaleValue, date: loadedDateRef.current,
    }).then(() => {
      const syncFn = category === 'archetypes' ? syncArchetypeProfileFromReflections
        : category === 'cognitive' ? syncCognitiveStyleFromReflections
        : category === 'values' ? syncCoreValuesFromReflections
        : syncIntelligenceFromReflections;
      syncFn({ includeDrafts: true }).catch(() => {});
    }).catch(() => {});
  };

  const handleSealCategory = async (category: ReflectionCategory) => {
    const questions = categoryQuestions[category].questions;
    if (questions.some(q => answers[`${category}-${q.id}`] === undefined)) {
      Alert.alert('Incomplete', `Answer all ${CATEGORY_LABELS[category]} questions before sealing.`);
      return;
    }

    const scale = ANSWER_SCALES[CATEGORY_SCALE[category]];
    const batch: Omit<ReflectionAnswer, 'sealedAt'>[] = questions.map(q => {
      const scaleValue = answers[`${category}-${q.id}`] ?? 0;
      return { questionId: q.id, category, questionText: q.text, answer: scale[scaleValue].label, scaleValue, date: loadedDateRef.current };
    });

    try {
      const result = await sealCategoryAnswers(category, batch, categoryNotes[category] || undefined);
      setCategorySealed(prev => ({ ...prev, [category]: true }));
      setTotalDays(result.totalDaysCompleted);
      setStreak(await getCurrentStreak());
      await clearPendingIfAllSealed();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch {
      Alert.alert('Error', 'Failed to save reflections.');
    }
  };

  const getCategoryTheme = (cat: ReflectionCategory) => {
    if (cat === 'values') return { wash: theme.cardSurfaceValues as readonly string[], accent: theme.silverBlue, pillBg: 'rgba(162, 194, 225, 0.15)', pillBorder: 'rgba(162, 194, 225, 0.40)' };
    if (cat === 'archetypes') return { wash: theme.cardSurfaceRelational as readonly string[], accent: theme.amethyst, pillBg: 'rgba(168, 139, 235, 0.15)', pillBorder: 'rgba(168, 139, 235, 0.40)' };
    if (cat === 'cognitive') return { wash: theme.cardSurfaceCognitive as readonly string[], accent: '#5C7CAA', pillBg: 'rgba(92, 124, 170, 0.15)', pillBorder: 'rgba(92, 124, 170, 0.40)' };
    const roseWash = ['rgba(212, 163, 179, 0.20)', 'rgba(212, 163, 179, 0.05)'];
    // intelligence
    return { wash: (theme.isDark ? roseWash : ['rgba(245, 238, 240, 0.7)', 'rgba(245, 238, 240, 0.4)']) as readonly string[], accent: '#D4A3B3', pillBg: 'rgba(212, 163, 179, 0.15)', pillBorder: 'rgba(212, 163, 179, 0.40)' };

  };

  const sealedCount = CATEGORIES.filter(c => categorySealed[c]).length;

  return (
    <View style={styles.container}>
      {(streak > 0 || totalDays > 0) && (
        <Animated.View entering={FadeInDown.delay(100)} style={headerAnimStyle}>
          <VelvetGlassSurface style={styles.statsBar}>
            <LinearGradient colors={['rgba(44, 54, 69, 0.85)', 'rgba(26, 30, 41, 0.40)']} style={StyleSheet.absoluteFill} />
            <StatItem val={totalDays} label="reflection days" color={theme.primary} />
            <View style={styles.statDivider} />
            <StatItem val={streak} label="current streak" color={theme.success} />
            <View style={styles.statDivider} />
            <StatItem val={`${sealedCount}/4`} label="categories" color={theme.silverBlue} />
          </VelvetGlassSurface>
        </Animated.View>
      )}

      {sealedCount === 4 && (
        <Animated.View entering={FadeIn} style={styles.sealedBanner}>
          <MetallicIcon name="shield-checkmark-outline" size={16} variant="gold" />
          <MetallicText style={styles.sealedBannerText} variant="gold">ALL CATEGORIES RECORDED TODAY</MetallicText>
        </Animated.View>
      )}

      <Animated.View entering={FadeInDown.delay(160)} style={[styles.dailyHeader, headerAnimStyle]}>
        <MetallicText style={styles.dailyHeaderTitle} variant="gold">{title}</MetallicText>
        <GoldSubtitle style={styles.dailyHeaderSub}>{subtitle}</GoldSubtitle>
      </Animated.View>

      {CATEGORIES.map((category, idx) => {
        const { wash, accent, pillBg, pillBorder } = getCategoryTheme(category);
        const isSealed = categorySealed[category];
        const allAnswered = categoryQuestions[category].questions.length > 0 &&
          categoryQuestions[category].questions.every(q => answers[`${category}-${q.id}`] !== undefined);

        return (
          <Animated.View key={category} entering={FadeInDown.delay(220 + idx * 100)} layout={Layout.springify()} style={styles.categorySection}>
            <View style={styles.categoryHeader}>
              <View style={styles.categoryHeaderLeft}>
                <MetallicText style={styles.categoryIcon} color={accent}>{CATEGORY_ICONS[category]}</MetallicText>
                <MetallicText style={styles.categoryTitle} color={accent}>{CATEGORY_LABELS[category]}</MetallicText>
              </View>
              {isSealed && (
                <View style={styles.categorySealedBadge}>
                  <MetallicText style={styles.categorySealedText} variant="gold">RECORDED</MetallicText>
                </View>
              )}
            </View>

            {categoryQuestions[category].questions.map((q, qIdx) => {
              const val = answers[`${category}-${q.id}`];
              const scale = ANSWER_SCALES[CATEGORY_SCALE[category]];
              return (
                <Animated.View key={q.id} entering={FadeInDown.delay(280 + idx * 100 + qIdx * 60)}>
                  <VelvetGlassSurface style={styles.questionCard} intensity={25}>
                    <LinearGradient colors={[...wash]} style={StyleSheet.absoluteFill} />
                    <Text style={styles.questionText}>{q.text}</Text>
                    <View style={styles.scaleRow}>
                      {scale.map(opt => {
                        const isSelected = val === opt.value;
                        return (
                        <Pressable
                          key={opt.value}
                          disabled={isSealed}
                          onPress={() => setAnswer(category, q.id, opt.value)}
                          style={[
                            styles.scalePill,
                            isSelected ? { backgroundColor: pillBg, borderColor: pillBorder, transform: [{translateY: -1}] } : styles.scalePillUnselected,
                            isSealed && styles.scalePillSealed,
                          ]}
                        >
                          <Text style={[styles.scalePillText, isSelected && styles.scalePillTextActive]}>{opt.label}</Text>
                        </Pressable>
                      )})}
                    </View>
                  </VelvetGlassSurface>
                </Animated.View>
              );
            })}

            {!isSealed && allAnswered && (
              <View style={styles.notesContainer}>
                <TextInput
                  style={styles.notesInput}
                  value={categoryNotes[category]}
                  onChangeText={t => setCategoryNotes(p => ({ ...p, [category]: t }))}
                  placeholder="What surfaced today? (Optional)"
                  placeholderTextColor={theme.textMuted}
                  multiline maxLength={300} returnKeyType="done" blurOnSubmit
                />
              </View>
            )}

            <VelvetGlassSurface style={[styles.sealButton, (isSealed || allAnswered) ? undefined : { opacity: 0.6 }]}>
              {allAnswered || isSealed ? <LinearGradient colors={['rgba(44, 54, 69, 0.85)', 'rgba(26, 30, 41, 0.40)']} style={StyleSheet.absoluteFill} /> : null}
              <Pressable
                style={({ pressed }) => [
                  styles.sealButtonContent,
                  pressed && styles.pressed,
                ]}
                onPress={() => isSealed ? setCategorySealed(p => ({ ...p, [category]: false })) : handleSealCategory(category)}
                disabled={!allAnswered && !isSealed}
              >
                <MetallicIcon name={isSealed ? "lock-open-outline" : "shield-checkmark-outline"} size={16} color={isSealed || allAnswered ? accent : theme.textMuted} />
                <Text style={[styles.sealButtonText, { color: isSealed || allAnswered ? accent : theme.textMuted }]}>
                  {isSealed ? 'Reopen to Edit' : `Record ${CATEGORY_LABELS[category]}`}
                </Text>
              </Pressable>
            </VelvetGlassSurface>
          </Animated.View>
        );
      })}
    </View>
  );
}

function StatItem({ val, label, color }: { val: string | number; label: string; color: string }) {
  const theme = useAppTheme();
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <MetallicText style={{ fontSize: 20, fontWeight: '700' }} color={color}>{val}</MetallicText>
      <Text style={{ fontSize: 10, color: theme.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</Text>
    </View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { marginBottom: 32 },
  statsBar: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 16, paddingVertical: 14, marginBottom: 24, overflow: 'hidden'
  },
  statDivider: { width: 1, height: 28, backgroundColor: theme.cardBorder },
  sealedBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.2)', padding: 12, borderRadius: 16, marginBottom: 20,
  },
  sealedBannerText: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  dailyHeader: { marginBottom: 24 },
  dailyHeaderTitle: { fontSize: 20, fontWeight: '700', marginBottom: 6 },
  dailyHeaderSub: { fontSize: 13 },
  categorySection: { marginBottom: 28 },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  categoryHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  categoryIcon: { fontSize: 20 },
  categoryTitle: { fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  categorySealedBadge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
    backgroundColor: 'rgba(212,175,55,0.08)', borderWidth: 1, borderColor: 'rgba(212,175,55,0.2)',
  },
  categorySealedText: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },

  // Smoked Glass Question Cards
  questionCard: {
    borderRadius: 20, marginBottom: 14, padding: 28, overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  questionText: { fontSize: 15, color: theme.textPrimary, lineHeight: 22, marginBottom: 20 },

  // Tactile Interactive Selectors
  scaleRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 },
  scalePill: { flexBasis: '48%', minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 14, borderWidth: 1, paddingVertical: 10, paddingHorizontal: 14 },
  scalePillUnselected: {
    backgroundColor: 'rgba(0, 0, 0, 0.30)',
    borderColor: 'rgba(0, 0, 0, 0.60)',
  },
  scalePillSealed: { opacity: 0.6 },
  scalePillText: { fontSize: 13, color: 'rgba(255, 255, 255, 0.4)', fontWeight: '600', textAlign: 'center' },
  scalePillTextActive: { color: '#FFFFFF' },

  notesContainer: { marginTop: 4, marginBottom: 12 },
  notesInput: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: theme.cardBorder,
    borderRadius: 14, padding: 16, fontSize: 14, color: theme.textPrimary, minHeight: 80, textAlignVertical: 'top',
  },

  // Hardware-style Action Buttons
  sealButton: {
    borderRadius: 18, marginTop: 4, overflow: 'hidden'
  },
  sealButtonContent: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14,
  },
  sealButtonText: { fontSize: 14, fontWeight: '700', letterSpacing: 0.3 },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
});