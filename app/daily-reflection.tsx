// app/daily-reflection.tsx
// MySky — Daily Reflection
// Presents 2–3 rotating questions per category each day.
// Answers are encrypted, sealed, and feed the insights engine.

import React, { useCallback, useState, useRef, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  Platform,
  PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from '../components/ui/SkiaGradient';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeIn, Layout } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/core';
import * as Haptics from 'expo-haptics';

import { SkiaDynamicCosmos } from '../components/ui/SkiaDynamicCosmos';
import { GoldSubtitle } from '../components/ui/GoldSubtitle';
import { MetallicText } from '../components/ui/MetallicText';
import { MetallicIcon } from '../components/ui/MetallicIcon';

import {
  getAllTodayQuestions,
  getTodayKey,
  getReflectionDate,
  sealCategoryAnswers,
  getCategorySealStatus,
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
  ScaleOption,
} from '../constants/dailyReflectionQuestions';

// ─────────────────────────────────────────────────────────────────────────────
// Palette (matches inner-world hub & other inner world screens)
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

const CATEGORY_RGB: Record<ReflectionCategory, string> = {
  values: '217, 191, 140',
  archetypes: '168, 155, 200',
  cognitive: '139, 196, 232',
};

// ─────────────────────────────────────────────────────────────────────────────
// Discrete Slider
// ─────────────────────────────────────────────────────────────────────────────

const THUMB = 22;
const TRACK_PAD = THUMB / 2; // 11 — centers thumb over end stops
const TRACK_H = 3;
const STOP_SIZE = 8;

interface SliderProps {
  value: number | undefined;
  onChange: (v: number) => void;
  scale: ScaleOption[];
  color: string;
  disabled: boolean;
}

function ReflectionSlider({ value, onChange, scale, color, disabled }: SliderProps) {
  const [cw, setCw] = useState(0);
  const cwRef = useRef(0);
  const startXRef = useRef(0);
  const lastRef = useRef<number | undefined>(undefined);
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  const steps = scale.length - 1; // 3

  // Map raw X (relative to track view) → snapped 0..steps value
  const xToValue = (x: number): number => {
    const eff = cwRef.current - TRACK_PAD * 2;
    if (eff <= 0) return 0;
    const clamped = Math.max(TRACK_PAD, Math.min(x, TRACK_PAD + eff));
    return Math.round(((clamped - TRACK_PAD) / eff) * steps);
  };

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => !disabled,
    onMoveShouldSetPanResponder: () => !disabled,
    onPanResponderGrant: (e) => {
      startXRef.current = e.nativeEvent.locationX;
      const v = xToValue(e.nativeEvent.locationX);
      if (v !== lastRef.current) {
        lastRef.current = v;
        Haptics.selectionAsync().catch(() => {});
      }
      onChangeRef.current(v);
    },
    onPanResponderMove: (_, gs) => {
      const v = xToValue(startXRef.current + gs.dx);
      if (v !== lastRef.current) {
        lastRef.current = v;
        Haptics.selectionAsync().catch(() => {});
        onChangeRef.current(v);
      }
    },
  }), [disabled]); // eslint-disable-line react-hooks/exhaustive-deps

  const onLayout = (e: { nativeEvent: { layout: { width: number } } }) => {
    cwRef.current = e.nativeEvent.layout.width;
    setCw(e.nativeEvent.layout.width);
  };

  const eff = cw - TRACK_PAD * 2;
  const stopX = (i: number) => (eff > 0 ? TRACK_PAD + (i / steps) * eff : TRACK_PAD);
  const hasValue = value !== undefined;

  return (
    <View style={[sStyles.outer, disabled && sStyles.outerDisabled]}>
      {/* Track area — panHandlers here so label taps don't conflict */}
      <View
        onLayout={onLayout}
        style={sStyles.trackArea}
        {...panResponder.panHandlers}
      >
        {/* Background track */}
        <View style={[sStyles.trackBg, { left: TRACK_PAD, right: TRACK_PAD }]} />

        {/* Colored fill */}
        {hasValue && eff > 0 && (
          <View style={[sStyles.fill, {
            left: TRACK_PAD,
            width: (value / steps) * eff,
            backgroundColor: color,
          }]} />
        )}

        {/* Stop dots */}
        {cw > 0 && scale.map((_, i) => (
          <View key={i} style={[sStyles.stop, {
            left: stopX(i) - STOP_SIZE / 2,
            backgroundColor: hasValue && i <= value! ? color : 'rgba(255,255,255,0.2)',
          }]} />
        ))}

        {/* Thumb */}
        {hasValue && cw > 0 && (
          <View style={[sStyles.thumb, {
            left: stopX(value) - THUMB / 2,
            backgroundColor: color,
            shadowColor: color,
          }]} />
        )}
      </View>

      {/* Labels */}
      {cw > 0 && (
        <View style={sStyles.labelsRow}>
          {scale.map((opt, i) => (
            <Text key={i} style={[
              sStyles.label,
              i === 0 && sStyles.labelFirst,
              i === steps && sStyles.labelLast,
              hasValue && i === value && { color, fontWeight: '700' as const },
            ]}>
              {opt.label}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

const sStyles = StyleSheet.create({
  outer: { marginTop: 8, marginBottom: 4 },
  outerDisabled: { opacity: 0.6 },
  trackArea: {
    height: THUMB,
    position: 'relative',
  },
  trackBg: {
    position: 'absolute',
    top: (THUMB - TRACK_H) / 2,
    height: TRACK_H,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: TRACK_H / 2,
  },
  fill: {
    position: 'absolute',
    top: (THUMB - TRACK_H) / 2,
    height: TRACK_H,
    borderRadius: TRACK_H / 2,
  },
  stop: {
    position: 'absolute',
    top: (THUMB - STOP_SIZE) / 2,
    width: STOP_SIZE,
    height: STOP_SIZE,
    borderRadius: STOP_SIZE / 2,
  },
  thumb: {
    position: 'absolute',
    top: 0,
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.55,
    shadowRadius: 5,
    elevation: 4,
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: TRACK_PAD - 2,
    marginTop: 6,
  },
  label: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '500',
    letterSpacing: 0.2,
    textAlign: 'center',
    flex: 1,
  },
  labelFirst: { textAlign: 'left' },
  labelLast: { textAlign: 'right' },
});

// ─────────────────────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────────────────────

export default function DailyReflectionScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  const [dayQuestions, setDayQuestions] = useState<DayQuestions[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [categorySealed, setCategorySealed] = useState<Record<ReflectionCategory, boolean>>({
    values: false,
    archetypes: false,
    cognitive: false,
  });
  const [streak, setStreak] = useState(0);
  const [totalDays, setTotalDays] = useState(0);
  // Capture the date when questions were loaded — prevents midnight edge case
  // where sealing after midnight would file old questions under the new date
  const loadedDateRef = useRef<string>(getTodayKey(getReflectionDate()));

  // Load today's questions & check if already sealed
  useFocusEffect(
    useCallback(() => {
      const init = async () => {
        const refDate = getReflectionDate();
        const today = getTodayKey(refDate);
        loadedDateRef.current = today;

        const [sealStatus, data, s] = await Promise.all([
          getCategorySealStatus(refDate),
          loadReflections(),
          getCurrentStreak(),
        ]);

        // Use startedAt as a per-user seed so different users see different questions
        const userSeed = data.startedAt ?? undefined;
        const questions = getAllTodayQuestions(refDate, userSeed);
        setDayQuestions(questions);

        setCategorySealed(sealStatus);
        setTotalDays(new Set(data.answers.map(a => a.date)).size);

        // Pre-fill with existing answers
        const todayAnswers = data.answers.filter(a => a.date === today);
        if (todayAnswers.length > 0) {
          const filled: Record<string, number> = {};
          for (const a of todayAnswers) {
            filled[`${a.category}-${a.questionId}`] = a.scaleValue ?? 0;
          }
          setAnswers(filled);
        } else {
          setAnswers({});
        }

        setStreak(s);
      };

      init();
    }, []),
  );

  const answerKey = (category: ReflectionCategory, questionId: number) =>
    `${category}-${questionId}`;

  const setAnswer = (category: ReflectionCategory, questionId: number, scaleValue: number) => {
    setAnswers(prev => ({ ...prev, [answerKey(category, questionId)]: scaleValue }));
  };

  const totalQuestions = dayQuestions.reduce((sum, dq) => sum + dq.questions.length, 0);
  const answeredCount = Object.keys(answers).length;
  const allCategoriesSealed = categorySealed.values && categorySealed.archetypes && categorySealed.cognitive;

  const isCategoryAllAnswered = (category: ReflectionCategory): boolean => {
    const dq = dayQuestions.find(d => d.category === category);
    if (!dq || dq.questions.length === 0) return false;
    return dq.questions.every(q => answers[answerKey(category, q.id)] !== undefined);
  };

  const handleUnsealCategory = (category: ReflectionCategory) => {
    Haptics.selectionAsync().catch(() => {});
    setCategorySealed(prev => ({ ...prev, [category]: false }));
  };

  const handleSealCategory = async (category: ReflectionCategory) => {
    if (!isCategoryAllAnswered(category)) {
      Alert.alert('Incomplete', `Answer all ${CATEGORY_LABELS[category]} statements before sealing.`);
      return;
    }

    const sealDate = loadedDateRef.current;
    const dq = dayQuestions.find(d => d.category === category);
    if (!dq) return;

    const scale = ANSWER_SCALES[CATEGORY_SCALE[category]];
    const batch: Omit<ReflectionAnswer, 'sealedAt'>[] = dq.questions.map(q => {
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
          onPress={() => { Haptics.selectionAsync().catch(() => {}); router.back(); }}
        >
          <MetallicIcon name="arrow-back-outline" size={20} color={PALETTE.lavender} />
          <MetallicText style={styles.backText} color={PALETTE.lavender}>Inner World</MetallicText>
        </Pressable>

          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <Animated.View entering={FadeInDown.delay(80).duration(600)} style={styles.header}>
              <Text style={styles.headerTitle}>Daily Reflection</Text>
              <GoldSubtitle style={styles.headerSubtitle}>
                New statements each day — building who you are
              </GoldSubtitle>
            </Animated.View>

            {/* Stats Bar */}
            <Animated.View entering={FadeInDown.delay(140).duration(500)} style={styles.statsBar}>
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
                  {answeredCount}/{totalQuestions}
                </MetallicText>
                <Text style={styles.statLabel}>today</Text>
              </View>
            </Animated.View>

            {/* Sealed Banner */}
            {allCategoriesSealed && (
              <Animated.View entering={FadeIn.duration(500)} style={styles.sealedBanner}>
                <MetallicIcon name="shield-checkmark-outline" size={16} color={PALETTE.emerald} />
                <MetallicText style={styles.sealedText} color={PALETTE.emerald}>
                  ALL CATEGORIES SEALED FOR TODAY
                </MetallicText>
              </Animated.View>
            )}

            {/* Category Sections */}
            {dayQuestions.map((dq, catIdx) => {
              const color = CATEGORY_COLORS[dq.category];
              const rgb = CATEGORY_RGB[dq.category];
              const isSealed = categorySealed[dq.category];
              const allAnsweredForCat = isCategoryAllAnswered(dq.category);

              return (
                <Animated.View
                  key={dq.category}
                  entering={FadeInDown.delay(200 + catIdx * 120).duration(600)}
                  layout={Layout.springify()}
                  style={styles.categorySection}
                >
                  {/* Category Header */}
                  <View style={styles.categoryHeader}>
                    <MetallicText style={styles.categoryIcon} color={color}>
                      {CATEGORY_ICONS[dq.category]}
                    </MetallicText>
                    <MetallicText style={styles.categoryTitle} color={color}>
                      {CATEGORY_LABELS[dq.category]}
                    </MetallicText>
                    {isSealed && (
                      <MetallicIcon name="shield-checkmark-outline" size={14} color={PALETTE.emerald} />
                    )}
                  </View>

                  {/* Questions */}
                  {dq.questions.map((q, qIdx) => {
                    const key = answerKey(dq.category, q.id);
                    const selectedValue = answers[key];
                    const hasAnswer = selectedValue !== undefined;
                    const scale = ANSWER_SCALES[CATEGORY_SCALE[dq.category]];

                    return (
                      <Animated.View
                        key={q.id}
                        entering={FadeInDown.delay(280 + catIdx * 120 + qIdx * 80).duration(500)}
                        style={styles.questionCard}
                      >
                        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                        <LinearGradient
                          colors={[`rgba(${rgb}, 0.06)`, 'transparent']}
                          style={StyleSheet.absoluteFill}
                        />

                        <View style={styles.questionContent}>
                          <Text style={styles.questionText}>{q.text}</Text>

                          <ReflectionSlider
                            value={selectedValue}
                            onChange={v => setAnswer(dq.category, q.id, v)}
                            scale={scale}
                            color={isSealed ? PALETTE.emerald : color}
                            disabled={isSealed}
                          />

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

                  {/* Per-Category Seal / Edit row */}
                  {isSealed ? (
                    <View style={styles.sealedRow}>
                      <View style={styles.sealedRowLeft}>
                        <MetallicIcon name="shield-checkmark-outline" size={14} color={PALETTE.emerald} />
                        <Text style={[styles.categorySealText, { color: PALETTE.emerald }]}>
                          Sealed
                        </Text>
                      </View>
                      <Pressable
                        style={({ pressed }) => [
                          styles.editBtn,
                          { borderColor: `rgba(${rgb}, 0.5)` },
                          pressed && { opacity: 0.7 },
                        ]}
                        onPress={() => handleUnsealCategory(dq.category)}
                      >
                        <MetallicIcon name="pencil-outline" size={13} color={color} />
                        <Text style={[styles.editBtnText, { color }]}>Edit</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable
                      style={({ pressed }) => [
                        styles.categorySealBtn,
                        { borderColor: `rgba(${rgb}, 0.3)` },
                        allAnsweredForCat && { backgroundColor: `rgba(${rgb}, 0.15)`, borderColor: color },
                        pressed && allAnsweredForCat && { opacity: 0.85 },
                      ]}
                      onPress={() => handleSealCategory(dq.category)}
                      disabled={!allAnsweredForCat}
                    >
                      <MetallicIcon
                        name="shield-checkmark-outline"
                        size={14}
                        color={allAnsweredForCat ? color : PALETTE.textMuted}
                      />
                      <Text style={[
                        styles.categorySealText,
                        allAnsweredForCat ? { color } : { color: PALETTE.textMuted },
                      ]}>
                        Seal {CATEGORY_LABELS[dq.category]}
                      </Text>
                    </Pressable>
                  )}
                </Animated.View>
              );
            })}

            {/* Journey Progress */}
            {totalDays > 0 && (
              <Animated.View entering={FadeIn.delay(700).duration(500)} style={styles.progressSection}>
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

                {/* Past Reflections Link */}
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

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PALETTE.bg },
  safeArea: { flex: 1 },
  topGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 400 },

  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 4 },
  backText: { fontSize: 14, color: PALETTE.lavender, fontWeight: '600' },

  scrollContent: { paddingHorizontal: 24, paddingTop: 20 },
  header: { marginBottom: 24 },
  headerTitle: {
    fontSize: 34,
    color: PALETTE.textMain,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    fontWeight: '300',
    marginBottom: 8,
  },
  headerSubtitle: { fontSize: 14 },

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
    marginBottom: 20,
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
  sealedText: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },

  // Category sections
  categorySection: { marginBottom: 28 },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  categoryIcon: { fontSize: 20 },
  categoryTitle: { fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },

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

  // Sealed row (shown after sealing, with Edit button)
  sealedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(110, 191, 139, 0.2)',
    backgroundColor: 'rgba(110, 191, 139, 0.06)',
    marginTop: 4,
  },
  sealedRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Per-category seal button
  categorySealBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginTop: 4,
  },
  categorySealText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Progress
  progressSection: {
    marginTop: 32,
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
