// app/daily-reflection.tsx
// MySky — Daily Reflection
// Presents 2–3 rotating questions per category each day.
// Answers are encrypted, sealed, and feed the insights engine.

import React, { useCallback, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  Platform,
  KeyboardAvoidingView,
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
  sealTodayAnswers,
  loadReflections,
  getCurrentStreak,
  DayQuestions,
  ReflectionAnswer,
} from '../services/insights/dailyReflectionService';
import {
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  ReflectionCategory,
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
// Screen
// ─────────────────────────────────────────────────────────────────────────────

export default function DailyReflectionScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  const [dayQuestions, setDayQuestions] = useState<DayQuestions[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [sealed, setSealed] = useState(false);
  const [streak, setStreak] = useState(0);
  const [totalDays, setTotalDays] = useState(0);
  // Capture the date when questions were loaded — prevents midnight edge case
  // where sealing after midnight would file old questions under the new date
  const loadedDateRef = useRef<string>(getTodayKey());

  // Load today's questions & check if already sealed
  useFocusEffect(
    useCallback(() => {
      const init = async () => {
        const today = getTodayKey();
        loadedDateRef.current = today;
        const questions = getAllTodayQuestions();
        setDayQuestions(questions);

        const data = await loadReflections();
        const todayAnswers = data.answers.filter(a => a.date === today);
        const alreadySealed = todayAnswers.length > 0;

        setSealed(alreadySealed);
        // Derive from actual data — not the stored counter (avoids stale values)
        setTotalDays(new Set(data.answers.map(a => a.date)).size);

        if (alreadySealed) {
          // Pre-fill with existing answers
          const filled: Record<string, string> = {};
          for (const a of todayAnswers) {
            filled[`${a.category}-${a.questionId}`] = a.answer;
          }
          setAnswers(filled);
        } else {
          setAnswers({});
        }

        const s = await getCurrentStreak();
        setStreak(s);
      };

      init();
    }, []),
  );

  const answerKey = (category: ReflectionCategory, questionId: number) =>
    `${category}-${questionId}`;

  const setAnswer = (category: ReflectionCategory, questionId: number, text: string) => {
    setAnswers(prev => ({ ...prev, [answerKey(category, questionId)]: text }));
  };

  const totalQuestions = dayQuestions.reduce((sum, dq) => sum + dq.questions.length, 0);
  const answeredCount = Object.values(answers).filter(v => v.trim().length > 0).length;
  const allAnswered = answeredCount === totalQuestions && totalQuestions > 0;

  const handleSeal = async () => {
    if (!allAnswered) {
      Alert.alert('Incomplete', 'Answer all questions before sealing your reflections.');
      return;
    }

    // Use the date captured when questions were loaded — not the current time.
    // This prevents a midnight edge case where sealing after midnight would
    // save old questions under the new date, blocking the new day's questions.
    const sealDate = loadedDateRef.current;
    const batch: Omit<ReflectionAnswer, 'sealedAt'>[] = [];

    for (const dq of dayQuestions) {
      for (const q of dq.questions) {
        const key = answerKey(dq.category, q.id);
        batch.push({
          questionId: q.id,
          category: dq.category,
          questionText: q.text,
          answer: answers[key] || '',
          date: sealDate,
        });
      }
    }

    try {
      const result = await sealTodayAnswers(batch);
      setSealed(true);
      setTotalDays(result.totalDaysCompleted);
      const s = await getCurrentStreak();
      setStreak(s);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      scrollRef.current?.scrollTo({ y: 0, animated: true });
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
          <MetallicIcon name="arrow-back" size={20} color={PALETTE.lavender} />
          <MetallicText style={styles.backText} color={PALETTE.lavender}>Inner World</MetallicText>
        </Pressable>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={100}
        >
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <Animated.View entering={FadeInDown.delay(80).duration(600)} style={styles.header}>
              <Text style={styles.headerTitle}>Daily Reflection</Text>
              <GoldSubtitle style={styles.headerSubtitle}>
                New questions each day — building who you are
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
            {sealed && (
              <Animated.View entering={FadeIn.duration(500)} style={styles.sealedBanner}>
                <MetallicIcon name="shield-checkmark" size={16} color={PALETTE.emerald} />
                <MetallicText style={styles.sealedText} color={PALETTE.emerald}>
                  TODAY'S REFLECTIONS SEALED
                </MetallicText>
              </Animated.View>
            )}

            {/* Category Sections */}
            {dayQuestions.map((dq, catIdx) => {
              const color = CATEGORY_COLORS[dq.category];
              const rgb = CATEGORY_RGB[dq.category];

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
                  </View>

                  {/* Questions */}
                  {dq.questions.map((q, qIdx) => {
                    const key = answerKey(dq.category, q.id);
                    const value = answers[key] || '';
                    const hasAnswer = value.trim().length > 0;

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

                          <TextInput
                            style={[
                              styles.answerInput,
                              hasAnswer && styles.answerInputFilled,
                              sealed && styles.answerInputSealed,
                            ]}
                            value={value}
                            onChangeText={t => setAnswer(dq.category, q.id, t)}
                            placeholder="Reflect honestly…"
                            placeholderTextColor="rgba(255,255,255,0.25)"
                            multiline
                            textAlignVertical="top"
                            editable={!sealed}
                          />

                          {hasAnswer && (
                            <View style={styles.answerMeta}>
                              <MetallicIcon
                                name={sealed ? 'lock-closed' : 'create-outline'}
                                size={11}
                                color={sealed ? PALETTE.emerald : PALETTE.textMuted}
                              />
                              <Text style={[
                                styles.answerMetaText,
                                sealed && { color: PALETTE.emerald },
                              ]}>
                                {sealed ? 'Sealed' : 'Draft'}
                              </Text>
                            </View>
                          )}
                        </View>
                      </Animated.View>
                    );
                  })}
                </Animated.View>
              );
            })}

            {/* Seal Button */}
            {!sealed && dayQuestions.length > 0 && (
              <Animated.View entering={FadeInDown.delay(600).duration(500)}>
                <Pressable
                  style={({ pressed }) => [
                    styles.sealButton,
                    !allAnswered && styles.sealButtonDisabled,
                    pressed && allAnswered && styles.sealButtonPressed,
                  ]}
                  onPress={handleSeal}
                  disabled={!allAnswered}
                >
                  <MetallicIcon
                    name="shield-checkmark"
                    size={18}
                    color={allAnswered ? '#0A0A0C' : PALETTE.textMuted}
                  />
                  <Text style={[
                    styles.sealButtonText,
                    !allAnswered && styles.sealButtonTextDisabled,
                  ]}>
                    Seal Today's Reflections
                  </Text>
                </Pressable>
              </Animated.View>
            )}

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
                  <MetallicIcon name="chevron-forward" size={14} color={PALETTE.gold} />
                </Pressable>
              </Animated.View>
            )}

            <View style={{ height: 120 }} />
          </ScrollView>
        </KeyboardAvoidingView>
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

  // Answer input
  answerInput: {
    minHeight: 80,
    maxHeight: 200,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: 14,
    color: PALETTE.textMain,
    fontSize: 14,
    lineHeight: 20,
  },
  answerInputFilled: {
    borderColor: 'rgba(217, 191, 140, 0.2)',
  },
  answerInputSealed: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderColor: 'rgba(110, 191, 139, 0.15)',
  },

  // Answer meta
  answerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  answerMetaText: {
    fontSize: 10,
    color: PALETTE.textMuted,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  // Seal button
  sealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: PALETTE.gold,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 20,
    marginTop: 8,
  },
  sealButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
  },
  sealButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  sealButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0A0A0C',
    letterSpacing: 0.5,
  },
  sealButtonTextDisabled: {
    color: PALETTE.textMuted,
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
