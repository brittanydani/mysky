// File: app/(tabs)/energy.tsx
// MySky — Energy Screen (Full 8-Section Build)

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter, Href } from 'expo-router';
import { useFocusEffect } from '@react-navigation/core';

import { theme } from '../../constants/theme';
import StarField from '../../components/ui/StarField';
import { localDb } from '../../services/storage/localDb';
import { AstrologyCalculator } from '../../services/astrology/calculator';
import { NatalChart } from '../../services/astrology/types';
import { usePremium } from '../../context/PremiumContext';
import {
  EnergyEngine,
  EnergySnapshot,
  EnergyIntensity,
  ChakraReading,
  ChakraState,
} from '../../services/energy/energyEngine';
import { CheckInService, CheckInInput } from '../../services/patterns/checkInService';
import { PatternAnalyzer } from '../../services/patterns/patternAnalyzer';
import { PatternCard, DailyCheckIn } from '../../services/patterns/types';
import { logger } from '../../utils/logger';
import ChakraWheelComponent, { ChakraLegend } from '../../components/ui/ChakraWheel';
import IntensityBar from '../../components/ui/IntensityBar';

/* ── Constants ── */
const { width: SCREEN_W } = Dimensions.get('window');
const WHEEL_SIZE = SCREEN_W * 0.55;

const INTENSITY_BAR: Record<EnergyIntensity, { fill: number; color: string; label: string }> = {
  Low:      { fill: 0.3,  color: theme.calm,  label: 'Gentle' },
  Moderate: { fill: 0.6,  color: theme.okay,  label: 'Moderate' },
  High:     { fill: 0.95, color: theme.stormy, label: 'Elevated' },
};

const CHAKRA_STATE_COLORS: Record<ChakraState, string> = {
  Flowing:            theme.energy,
  Sensitive:          theme.heavy,
  'Grounding Needed': theme.stormy,
  Quiet:              'rgba(255,255,255,0.25)',
};

/* ── Helpers ── */
function safeHaptic() {
  Haptics.selectionAsync().catch(() => {});
}

function formatToday(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

/* ── Check-In types ── */
type CheckInStep = 'idle' | 'q1' | 'q2' | 'q3' | 'done';

const CHECK_IN_QUESTIONS = [
  { key: 'q1' as const, question: 'How does your body feel right now?', options: ['Tense', 'Calm', 'Restless', 'Heavy', 'Light'] },
  { key: 'q2' as const, question: 'How clear is your mind?', options: ['Foggy', 'Sharp', 'Scattered', 'Still', 'Racing'] },
  { key: 'q3' as const, question: 'What emotion is most present?', options: ['Anxious', 'Content', 'Sad', 'Energized', 'Numb'] },
];

/* ════════════════════════════════════════════════
   MAIN SCREEN
   ════════════════════════════════════════════════ */
export default function EnergyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isPremium } = usePremium();

  const [loading, setLoading] = useState(true);
  const [hasChart, setHasChart] = useState(false);
  const [snapshot, setSnapshot] = useState<EnergySnapshot | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [checkInStep, setCheckInStep] = useState<CheckInStep>('idle');
  const [checkInAnswers, setCheckInAnswers] = useState<Record<string, string>>({});
  const [expandedDomain, setExpandedDomain] = useState<number | null>(null);
  const [userChart, setUserChart] = useState<NatalChart | null>(null);
  const [chartId, setChartId] = useState<string>('');
  const [patternCards, setPatternCards] = useState<PatternCard[]>([]);
  const [checkInCount, setCheckInCount] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [todayCheckIn, setTodayCheckIn] = useState<DailyCheckIn | null>(null);

  /* pulse animation for intensity bar */
  const pulse = useSharedValue(0.7);
  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);
  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }));

  /* load chart + generate snapshot */
  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        try {
          setLoading(true);
          const charts = await localDb.getCharts();
          if (!charts || charts.length === 0) {
            setHasChart(false);
            return;
          }
          setHasChart(true);
          const saved = charts[0];
          setUserName(saved?.name ?? '');
          const cId = saved?.id ?? '';
          setChartId(cId);
          const birthData = {
            date: saved.birthDate,
            time: saved.birthTime,
            hasUnknownTime: saved.hasUnknownTime,
            place: saved.birthPlace,
            latitude: saved.latitude,
            longitude: saved.longitude,
            houseSystem: saved.houseSystem,
          };
          const natal = AstrologyCalculator.generateNatalChart(birthData);
          setUserChart(natal);
          const snap = EnergyEngine.generateSnapshot(natal, new Date());
          setSnapshot(snap);

          // Load check-in history and patterns for premium
          try {
            const existing = await CheckInService.getTodayCheckIn(cId);
            setTodayCheckIn(existing);
            if (existing) {
              setCheckInStep('done');
              setCheckInAnswers({
                q1: existing.note?.split('|')[0] || '',
                q2: existing.note?.split('|')[1] || '',
                q3: existing.note?.split('|')[2] || '',
              });
            }
            const allCheckIns = await CheckInService.getAllCheckIns(cId);
            setCheckInCount(allCheckIns.length);
            const streak = await CheckInService.getCurrentStreak(cId);
            setCurrentStreak(streak);
            if (allCheckIns.length >= 5) {
              const patterns = PatternAnalyzer.analyzePatterns(allCheckIns);
              setPatternCards(patterns);
            }
          } catch (e) {
            logger.error('Failed to load check-in patterns:', e);
          }
        } catch (e) {
          logger.error('Energy load failed:', e);
        } finally {
          setLoading(false);
        }
      };
      load();
    }, [])
  );

  /* check-in handlers */
  const handleCheckInStart = useCallback(() => {
    safeHaptic();
    setCheckInStep('q1');
    setCheckInAnswers({});
  }, []);

  const handleCheckInAnswer = useCallback(async (step: string, answer: string) => {
    safeHaptic();
    const updated = { ...checkInAnswers, [step]: answer };
    setCheckInAnswers(updated);
    if (step === 'q1') setCheckInStep('q2');
    else if (step === 'q2') setCheckInStep('q3');
    else {
      setCheckInStep('done');
      // Save check-in via CheckInService
      if (userChart && chartId) {
        try {
          const bodyAnswer = updated.q1 || '';
          const mindAnswer = updated.q2 || '';
          const emotionAnswer = updated.q3 || '';
          // Map answers to check-in input
          const moodMap: Record<string, number> = { 'Content': 7, 'Energized': 8, 'Calm': 6, 'Anxious': 3, 'Sad': 3, 'Numb': 4, 'Light': 7, 'Heavy': 3, 'Tense': 4, 'Restless': 5 };
          const energyMap: Record<string, 'low' | 'medium' | 'high'> = { 'Heavy': 'low', 'Tense': 'medium', 'Calm': 'medium', 'Restless': 'high', 'Light': 'high', 'Foggy': 'low', 'Sharp': 'high', 'Scattered': 'medium', 'Still': 'medium', 'Racing': 'high' };
          const stressMap: Record<string, 'low' | 'medium' | 'high'> = { 'Calm': 'low', 'Light': 'low', 'Content': 'low', 'Tense': 'high', 'Heavy': 'high', 'Anxious': 'high', 'Restless': 'medium', 'Foggy': 'medium', 'Scattered': 'medium', 'Energized': 'low', 'Sad': 'medium', 'Numb': 'medium', 'Racing': 'high', 'Sharp': 'low', 'Still': 'low' };
          const input: CheckInInput = {
            moodScore: moodMap[emotionAnswer] || 5,
            energyLevel: energyMap[bodyAnswer] || 'medium',
            stressLevel: stressMap[emotionAnswer] || 'medium',
            tags: [],
            note: `${bodyAnswer}|${mindAnswer}|${emotionAnswer}`,
          };
          const saved = await CheckInService.saveCheckIn(input, userChart, chartId);
          setTodayCheckIn(saved);
          setCheckInCount(prev => prev + 1);
          setCurrentStreak(prev => prev + 1);
          // Refresh patterns if enough data
          const allCheckIns = await CheckInService.getAllCheckIns(chartId);
          if (allCheckIns.length >= 5) {
            const patterns = PatternAnalyzer.analyzePatterns(allCheckIns);
            setPatternCards(patterns);
          }
        } catch (e) {
          logger.error('Failed to save check-in:', e);
        }
      }
    }
  }, [checkInAnswers, userChart, chartId]);

  /* ── No-chart state ── */
  if (!loading && !hasChart) {
    return (
      <View style={styles.container}>
        <StarField starCount={28} />
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <Animated.View entering={FadeInDown.delay(80).duration(600)} style={styles.header}>
            <Text style={styles.title}>Energy</Text>
            <Text style={styles.subtitle}>Your personal energy weather {'\u2014'} built from your chart.</Text>
          </Animated.View>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 32) }]}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View entering={FadeInDown.delay(200).duration(600)}>
              <LinearGradient colors={['rgba(30,45,71,0.65)', 'rgba(26,39,64,0.45)']} style={[styles.card, styles.cardPad]}>
                <Ionicons name="sparkles" size={32} color={theme.primary} style={{ marginBottom: 12 }} />
                <Text style={styles.heroToneText}>Energy needs your chart</Text>
                <Text style={[styles.body, { marginTop: 8 }]}>
                  Create your natal chart to unlock your personal energy weather {'\u2014'} chakra awareness, domain tracking, daily guidance, and patterns.
                </Text>
                <Pressable style={styles.primaryBtn} onPress={() => { safeHaptic(); router.push('/(tabs)' as Href); }}>
                  <Ionicons name="add-circle-outline" size={16} color={theme.primary} />
                  <Text style={styles.primaryBtnText}>Create Chart</Text>
                </Pressable>
              </LinearGradient>
            </Animated.View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  /* ── Loading state ── */
  if (loading || !snapshot) {
    return (
      <View style={styles.container}>
        <StarField starCount={28} />
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <Ionicons name="sparkles" size={28} color={theme.primary} />
            <Text style={[styles.body, { marginTop: 12 }]}>Reading your energy{'\u2026'}</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  /* ── Main render ── */
  const barInfo = INTENSITY_BAR[snapshot.intensity];

  return (
    <View style={styles.container}>
      <StarField starCount={40} />
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <Animated.View entering={FadeInDown.delay(60).duration(600)} style={styles.header}>
          <Text style={styles.title}>Energy</Text>
          <Text style={styles.subtitle}>
            {userName ? `${userName}'s energy` : 'Your energy'} {'\u2022'} {formatToday()}
          </Text>
        </Animated.View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 32) + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* ═══ S1 — ENERGY SNAPSHOT (Hero) — FREE ═══ */}
          <Animated.View entering={FadeInDown.delay(100).duration(600)}>
            <LinearGradient
              colors={['rgba(30,45,71,0.75)', 'rgba(26,39,64,0.55)']}
              style={[styles.card, styles.cardPad]}
            >
              <View style={styles.toneBadge}>
                <View style={[styles.toneDot, { backgroundColor: barInfo.color }]} />
                <Text style={styles.toneLabel}>{snapshot.tone}</Text>
                <Text style={styles.intensityLabel}>{'\u2022'} {barInfo.label}</Text>
              </View>
              <View style={styles.intensityBarOuter}>
                <Animated.View
                  style={[
                    styles.intensityBarInner,
                    { width: `${barInfo.fill * 100}%`, backgroundColor: barInfo.color },
                    pulseStyle,
                  ]}
                />
              </View>
              <Text style={styles.driverText}>{snapshot.primaryDriver}</Text>
              <Text style={[styles.body, { marginTop: 6 }]}>{snapshot.quickMeaning}</Text>
            </LinearGradient>
          </Animated.View>

          {/* ═══ S2 — PERSONAL ENERGY WHEEL ═══ */}
          <SectionHeader icon="radio-outline" title="Energy Wheel" delay={160} />
          <Animated.View entering={FadeInDown.delay(180).duration(600)}>
            <LinearGradient colors={['rgba(30,45,71,0.60)', 'rgba(26,39,64,0.40)']} style={[styles.card, styles.cardPad]}>
              <View style={styles.wheelContainer}>
                <ChakraWheelComponent
                  chakras={snapshot.chakras}
                  dominantChakra={snapshot.dominantChakra}
                  size={WHEEL_SIZE}
                />
              </View>
              <ChakraLegend />
              {!isPremium && (
                <View style={styles.lockBanner}>
                  <Ionicons name="lock-closed" size={14} color={theme.primary} />
                  <Text style={styles.lockText}>Tap chakras for body cues and triggers {'\u2014'} Premium</Text>
                </View>
              )}
            </LinearGradient>
          </Animated.View>

          {/* ═══ S3 — CHAKRA FOCUS TODAY ═══ */}
          <SectionHeader icon="body-outline" title="Chakra Focus" delay={240} />
          <Animated.View entering={FadeInDown.delay(260).duration(600)}>
            <ChakraCard chakra={snapshot.dominantChakra} highlight />
            {isPremium ? (
              snapshot.chakras
                .filter(c => c.name !== snapshot.dominantChakra.name)
                .map(c => <ChakraCard key={c.name} chakra={c} role={chakraRoleFromState(c.state)} />)
            ) : (
              <LinearGradient colors={['rgba(30,45,71,0.50)', 'rgba(26,39,64,0.30)']} style={[styles.card, styles.cardPad]}>
                <View style={styles.lockBanner}>
                  <Ionicons name="lock-closed" size={14} color={theme.primary} />
                  <Text style={styles.lockText}>All 7 chakras with body cues and triggers {'\u2014'} Premium</Text>
                </View>
              </LinearGradient>
            )}
          </Animated.View>

          {/* ═══ S4 — ENERGY BY DOMAIN ═══ */}
          <SectionHeader icon="grid-outline" title="Energy by Domain" delay={320} />
          <Animated.View entering={FadeInDown.delay(340).duration(600)}>
            {snapshot.domains.map((d, idx) => {
              const isFree = snapshot.freeDomainIndices.includes(idx);
              const isLocked = !isPremium && !isFree;
              const isExpanded = expandedDomain === idx;
              return (
                <Pressable
                  key={d.name}
                  onPress={() => {
                    if (isLocked) {
                      safeHaptic();
                      router.push('/(tabs)/premium' as Href);
                      return;
                    }
                    safeHaptic();
                    setExpandedDomain(isExpanded ? null : idx);
                  }}
                >
                  <LinearGradient
                    colors={isLocked
                      ? ['rgba(20,30,46,0.5)', 'rgba(13,20,33,0.5)']
                      : ['rgba(30,45,71,0.60)', 'rgba(26,39,64,0.40)']
                    }
                    style={[styles.card, styles.cardPad, { marginBottom: 8 }]}
                  >
                    <View style={styles.domainRow}>
                      <View style={styles.domainIconWrap}>
                        <Ionicons
                          name={(d.icon as keyof typeof Ionicons.glyphMap) || 'ellipse'}
                          size={20}
                          color={isLocked ? theme.textMuted : theme.primary}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.domainName, isLocked && styles.textLocked]}>{d.name}</Text>
                        <Text style={[styles.domainState, isLocked && styles.textLocked]}>
                          {isLocked ? '\u2022\u2022\u2022\u2022\u2022\u2022' : d.state}
                        </Text>
                      </View>
                      <Ionicons
                        name={isLocked ? 'lock-closed' : isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color={isLocked ? theme.textMuted : theme.primary}
                      />
                    </View>
                    {isExpanded && !isLocked && (
                      <View style={styles.domainExpanded}>
                        <Text style={styles.body}>{d.feeling}</Text>
                        <View style={styles.domainWhyRow}>
                          <Ionicons name="information-circle-outline" size={14} color={theme.primary} />
                          <Text style={styles.domainWhyText}>{d.why}</Text>
                        </View>
                        <View style={styles.domainSuggestionRow}>
                          <Ionicons name="bulb-outline" size={14} color={theme.energy} />
                          <Text style={styles.domainSuggestionText}>{d.suggestion}</Text>
                        </View>
                      </View>
                    )}
                  </LinearGradient>
                </Pressable>
              );
            })}
          </Animated.View>

          {/* ═══ S5 — ENERGY GUIDANCE ═══ */}
          <SectionHeader icon="compass-outline" title="Energy Guidance" delay={400} />
          <Animated.View entering={FadeInDown.delay(420).duration(600)}>
            <LinearGradient colors={['rgba(30,45,71,0.60)', 'rgba(26,39,64,0.40)']} style={[styles.card, styles.cardPad]}>
              {isPremium ? (
                <>
                  <GuidanceBlock icon="arrow-up-outline" label="Lean into" text={snapshot.guidance.leanInto} context={snapshot.guidance.leanIntoContext} color={theme.energy} />
                  <View style={styles.divider} />
                  <GuidanceBlock icon="hand-left-outline" label="Move gently around" text={snapshot.guidance.moveGentlyAround} context={snapshot.guidance.moveGentlyContext} color={theme.heavy} />
                  <View style={styles.divider} />
                  <GuidanceBlock icon="flash-outline" label="Best use of energy" text={snapshot.guidance.bestUseOfEnergy} context={snapshot.guidance.bestUseContext} color={theme.primary} />
                  <View style={styles.divider} />
                  <View style={styles.guidanceRitualBlock}>
                    <View style={styles.guidanceHeader}>
                      <Ionicons name="sparkles-outline" size={16} color={theme.calm} />
                      <Text style={[styles.guidanceLabel, { color: theme.calm }]}>Today’s Micro-Ritual</Text>
                    </View>
                    <Text style={styles.guidanceRitualText}>{snapshot.guidance.ritual}</Text>
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.guidanceFree}>{snapshot.freeGuidanceLine}</Text>
                  <View style={[styles.lockBanner, { marginTop: 12 }]}>
                    <Ionicons name="lock-closed" size={14} color={theme.primary} />
                    <Text style={styles.lockText}>Full guidance unlocked with Premium</Text>
                  </View>
                </>
              )}
            </LinearGradient>
          </Animated.View>

          {/* ═══ S6 — MOON PHASE INTEGRATION ═══ */}
          <SectionHeader icon="moon-outline" title="Moon Phase" delay={460} />
          <Animated.View entering={FadeInDown.delay(480).duration(600)}>
            <LinearGradient colors={['rgba(30,45,71,0.60)', 'rgba(26,39,64,0.40)']} style={[styles.card, styles.cardPad]}>
              <View style={styles.moonRow}>
                <Text style={styles.moonEmoji}>{snapshot.moonPhase.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.moonPhaseLabel}>{snapshot.moonPhase.phase}</Text>
                  {isPremium ? (
                    <Text style={[styles.body, { marginTop: 4 }]}>{snapshot.moonPhase.personalMeaning}</Text>
                  ) : (
                    <View style={[styles.lockBanner, { marginTop: 6, marginBottom: 0 }]}>
                      <Ionicons name="lock-closed" size={12} color={theme.primary} />
                      <Text style={styles.lockText}>Personal meaning {'\u2014'} Premium</Text>
                    </View>
                  )}
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* ═══ S7 — ENERGY CHECK-IN ═══ */}
          <SectionHeader icon="heart-outline" title="Energy Check-In" delay={520} />
          <Animated.View entering={FadeInDown.delay(540).duration(600)}>
            <LinearGradient colors={['rgba(30,45,71,0.60)', 'rgba(26,39,64,0.40)']} style={[styles.card, styles.cardPad]}>
              {checkInStep === 'idle' && (
                <>
                  <Text style={styles.body}>A quick body + mind scan grounded in what your chart is activating today.</Text>
                  <Pressable style={[styles.primaryBtn, { marginTop: 14 }]} onPress={handleCheckInStart}>
                    <Ionicons name="pulse-outline" size={16} color={theme.primary} />
                    <Text style={styles.primaryBtnText}>Start Check-In</Text>
                  </Pressable>
                </>
              )}
              {checkInStep !== 'idle' && checkInStep !== 'done' && (
                <>
                  {CHECK_IN_QUESTIONS.filter(q => q.key === checkInStep).map(q => (
                    <View key={q.key}>
                      <Text style={styles.checkInQuestion}>{q.question}</Text>
                      <View style={styles.checkInOptions}>
                        {q.options.map(opt => (
                          <Pressable
                            key={opt}
                            style={[
                              styles.checkInOption,
                              checkInAnswers[q.key] === opt && styles.checkInOptionSelected,
                            ]}
                            onPress={() => handleCheckInAnswer(q.key, opt)}
                          >
                            <Text style={[
                              styles.checkInOptionText,
                              checkInAnswers[q.key] === opt && styles.checkInOptionTextSelected,
                            ]}>
                              {opt}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  ))}
                </>
              )}
              {checkInStep === 'done' && (
                <>
                  <View style={styles.checkInDoneHeader}>
                    <Ionicons name="checkmark-circle" size={24} color={theme.energy} />
                    <Text style={styles.checkInDoneTitle}>Checked in</Text>
                  </View>
                  <Text style={styles.body}>
                    Body: {checkInAnswers.q1} {'\u00b7'} Mind: {checkInAnswers.q2} {'\u00b7'} Emotion: {checkInAnswers.q3}
                  </Text>
                  <Text style={[styles.bodyMuted, { marginTop: 8 }]}>
                    This is a snapshot, not a score. It is a way of noticing, not measuring.
                  </Text>
                  {isPremium ? (
                    <Text style={[styles.bodyMuted, { marginTop: 8, color: theme.primary }]}>
                      {'\u2713'} Saved to your energy pattern history
                    </Text>
                  ) : (
                    <View style={[styles.lockBanner, { marginTop: 12 }]}>
                      <Ionicons name="lock-closed" size={14} color={theme.primary} />
                      <Text style={styles.lockText}>Save check-ins and track patterns {'\u2014'} Premium</Text>
                    </View>
                  )}
                  <Pressable
                    style={[styles.secondaryBtn, { marginTop: 14 }]}
                    onPress={() => { safeHaptic(); setCheckInStep('idle'); }}
                  >
                    <Text style={styles.secondaryBtnText}>Check in again</Text>
                  </Pressable>
                </>
              )}
            </LinearGradient>
          </Animated.View>

          {/* ═══ S8 — ENERGY PATTERNS & MEMORY (Premium Core) ═══ */}
          <SectionHeader icon="analytics-outline" title="Energy Patterns" delay={580} />
          <Animated.View entering={FadeInDown.delay(600).duration(600)}>
            <LinearGradient colors={['rgba(30,45,71,0.60)', 'rgba(26,39,64,0.40)']} style={[styles.card, styles.cardPad]}>
              {isPremium ? (
                <>
                  <Text style={styles.sectionSubhead}>Your energy pattern memory</Text>
                  <Text style={[styles.body, { marginTop: 6 }]}>
                    Over time, MySky learns your rhythms {'\u2014'} which Moon signs drain or recharge you, which chakras are consistently activated, and how your domains shift across cycles.
                  </Text>
                  <View style={styles.patternGrid}>
                    <PatternTile
                      icon="moon-outline"
                      label="Moon rhythm"
                      value={patternCards.find(p => p.type === 'moon_house_mood')?.insight || `${snapshot.dominantChakra.name} dominant under ${snapshot.moonPhase.phase}`}
                      sub={patternCards.find(p => p.type === 'moon_house_mood')?.detail || 'Patterns build as you check in across lunar cycles'}
                    />
                    <PatternTile
                      icon="body-outline"
                      label="Chakra frequency"
                      value={patternCards.find(p => p.type === 'energy_cycle')?.insight || `${snapshot.dominantChakra.name} most active today`}
                      sub={patternCards.find(p => p.type === 'energy_cycle')?.detail || `State: ${snapshot.dominantChakra.state} — ${snapshot.dominantChakra.trigger}`}
                    />
                    <PatternTile
                      icon="pulse-outline"
                      label="Check-in trends"
                      value={
                        checkInCount >= 5
                          ? patternCards.find(p => p.type === 'best_days')?.insight || `${checkInCount} check-ins tracked`
                          : checkInCount > 0
                            ? `${checkInCount} of 5 check-ins to unlock trends`
                            : 'Complete a check-in to start tracking'
                      }
                      sub={
                        checkInCount >= 5
                          ? `${currentStreak} day streak · ${checkInCount} total check-ins`
                          : currentStreak > 0
                            ? `${currentStreak} day streak — keep going!`
                            : 'Daily check-ins reveal patterns over time'
                      }
                    />
                    <PatternTile
                      icon="calendar-outline"
                      label="Weekly cycle"
                      value={patternCards.find(p => p.type === 'stress_pattern')?.insight || `Current tone: ${snapshot.tone} (${snapshot.intensity})`}
                      sub={patternCards.find(p => p.type === 'stress_pattern')?.detail || 'Energy patterns become clearer after 7+ days of use'}
                    />
                  </View>
                </>
              ) : (
                <>
                  <Ionicons name="analytics-outline" size={28} color={theme.primary} style={{ marginBottom: 10 }} />
                  <Text style={styles.sectionSubhead}>Energy Patterns and Memory</Text>
                  <Text style={[styles.body, { marginTop: 6 }]}>
                    Premium tracks your energy over time {'\u2014'} which Moon signs drain you, which chakras are always active, and how your domains shift across cycles.
                  </Text>
                  <Pressable
                    style={[styles.primaryBtn, { marginTop: 14 }]}
                    onPress={() => { safeHaptic(); router.push('/(tabs)/premium' as Href); }}
                  >
                    <Ionicons name="sparkles" size={16} color={theme.primary} />
                    <Text style={styles.primaryBtnText}>Unlock Patterns</Text>
                  </Pressable>
                </>
              )}
            </LinearGradient>
          </Animated.View>

          {/* ── Footer ── */}
          <Animated.View entering={FadeInDown.delay(660).duration(600)} style={styles.footer}>
            <Text style={styles.footerText}>
              Energy is not prediction {'\u2014'} it is a mirror. Your chart creates conditions; you decide what to do with them.
            </Text>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

/* ════════════════════════════════════════════════
   SUB-COMPONENTS
   ════════════════════════════════════════════════ */

function SectionHeader({ icon, title, delay }: { icon: keyof typeof Ionicons.glyphMap; title: string; delay: number }) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(600)} style={styles.sectionTitleRow}>
      <Ionicons name={icon} size={18} color={theme.primary} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </Animated.View>
  );
}

type ChakraRole = 'primary' | 'secondary' | 'background';

const CHAKRA_ROLE_LABELS: Record<ChakraRole, { label: string; color: string }> = {
  primary:    { label: 'Primary focus today', color: theme.primary },
  secondary:  { label: 'Secondary',           color: theme.textSecondary },
  background: { label: 'Background',          color: theme.textMuted },
};

function chakraRoleFromState(state: ChakraState): ChakraRole {
  if (state === 'Grounding Needed' || state === 'Sensitive') return 'secondary';
  return 'background';
}

function ChakraCard({ chakra, highlight, role }: { chakra: ChakraReading; highlight?: boolean; role?: ChakraRole }) {
  const resolvedRole = highlight ? 'primary' : (role ?? 'background');
  const roleInfo = CHAKRA_ROLE_LABELS[resolvedRole];

  return (
    <LinearGradient
      colors={
        highlight
          ? ['rgba(40,55,85,0.70)', 'rgba(30,45,71,0.50)']
          : ['rgba(30,45,71,0.50)', 'rgba(26,39,64,0.30)']
      }
      style={[styles.card, styles.cardPad, { marginBottom: 8 }]}
    >
      {/* Hierarchy label */}
      <View style={styles.chakraRoleBadge}>
        <Text style={[styles.chakraRoleText, { color: roleInfo.color }]}>{roleInfo.label}</Text>
      </View>

      <View style={styles.chakraHeader}>
        <Text style={styles.chakraEmoji}>{chakra.emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.chakraName}>{chakra.name}</Text>
          <View style={styles.chakraStateRow}>
            <View style={[styles.chakraStateDot, { backgroundColor: CHAKRA_STATE_COLORS[chakra.state] }]} />
            <Text style={[styles.chakraStateText, { color: CHAKRA_STATE_COLORS[chakra.state] }]}>{chakra.state}</Text>
          </View>
        </View>
      </View>
      <Text style={[styles.bodyMuted, { marginTop: 6 }]}>{chakra.trigger}</Text>
      <Text style={[styles.body, { marginTop: 4 }]}>{chakra.bodyCue}</Text>

      {/* Element connection */}
      <View style={styles.chakraDetailRow}>
        <Ionicons name="leaf-outline" size={13} color={theme.energy} />
        <Text style={styles.chakraDetailText}>{chakra.elementConnection}</Text>
      </View>

      {/* Healing suggestion */}
      <View style={styles.chakraDetailRow}>
        <Ionicons name="heart-outline" size={13} color={theme.calm} />
        <Text style={styles.chakraDetailText}>{chakra.healingSuggestion}</Text>
      </View>
    </LinearGradient>
  );
}

function GuidanceBlock({ icon, label, text, context, color }: { icon: keyof typeof Ionicons.glyphMap; label: string; text: string; context?: string; color: string }) {
  return (
    <View style={styles.guidanceBlock}>
      <View style={styles.guidanceHeader}>
        <Ionicons name={icon} size={16} color={color} />
        <Text style={[styles.guidanceLabel, { color }]}>{label}</Text>
      </View>
      <Text style={styles.guidanceMainText}>{text}</Text>
      {context ? <Text style={styles.guidanceContextText}>{context}</Text> : null}
    </View>
  );
}

function PatternTile({ icon, label, value, sub }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; sub: string }) {
  return (
    <View style={styles.patternTile}>
      <View style={styles.patternTileHeader}>
        <Ionicons name={icon} size={16} color={theme.primary} />
        <Text style={styles.patternTileLabel}>{label}</Text>
      </View>
      <Text style={styles.patternTileValue}>{value}</Text>
      <Text style={styles.patternTileSub}>{sub}</Text>
    </View>
  );
}

/* ════════════════════════════════════════════════
   STYLES
   ════════════════════════════════════════════════ */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
  },
  card: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.cardBorder,
    marginBottom: theme.spacing.md,
  },
  cardPad: {
    padding: theme.spacing.lg,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.textPrimary,
    fontFamily: 'serif',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: theme.primary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  body: {
    color: theme.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  bodyMuted: {
    color: theme.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  textLocked: {
    color: theme.textMuted,
  },
  sectionSubhead: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  toneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  toneDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  toneLabel: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.textPrimary,
    fontFamily: 'serif',
  },
  intensityLabel: {
    fontSize: 14,
    color: theme.textMuted,
    fontWeight: '500',
  },
  heroToneText: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.textPrimary,
    fontFamily: 'serif',
  },
  intensityBarOuter: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginBottom: 14,
    overflow: 'hidden',
  },
  intensityBarInner: {
    height: 6,
    borderRadius: 3,
  },
  driverText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(201,169,98,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(201,169,98,0.20)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  pillText: {
    color: theme.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.textPrimary,
    fontFamily: 'serif',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: 'rgba(201,169,98,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(201,169,98,0.22)',
    marginTop: 10,
  },
  primaryBtnText: {
    color: theme.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  secondaryBtnText: {
    color: theme.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  lockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 4,
  },
  lockText: {
    color: theme.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: 12,
  },
  wheelContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  wheel: {
    position: 'relative',
  },
  wheelNode: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  wheelNodeEmoji: {
    fontSize: 14,
  },
  wheelCenter: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -40,
    marginTop: -30,
    width: 80,
    alignItems: 'center',
  },
  wheelCenterEmoji: {
    fontSize: 24,
  },
  wheelCenterName: {
    color: theme.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
    textAlign: 'center',
  },
  wheelCenterState: {
    color: theme.textMuted,
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: theme.spacing.md,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    color: theme.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  chakraRoleBadge: {
    marginBottom: 6,
  },
  chakraRoleText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  chakraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  chakraEmoji: {
    fontSize: 26,
  },
  chakraName: {
    color: theme.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  chakraStateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  chakraStateDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chakraStateText: {
    fontSize: 13,
    fontWeight: '600',
  },
  domainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  domainIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(201,169,98,0.10)',
  },
  domainName: {
    color: theme.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  domainState: {
    color: theme.primary,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 1,
  },
  domainExpanded: {
    marginTop: 10,
    paddingLeft: 50,
  },
  domainWhyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  domainWhyText: {
    flex: 1,
    color: theme.primary,
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  domainSuggestionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 8,
  },
  domainSuggestionText: {
    flex: 1,
    color: theme.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  chakraDetailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 8,
    paddingTop: 6,
  },
  chakraDetailText: {
    flex: 1,
    color: theme.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  guidanceBlock: {
    marginBottom: 4,
  },
  guidanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  guidanceLabel: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  guidanceMainText: {
    color: theme.textPrimary,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  guidanceContextText: {
    color: theme.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  guidanceRitualBlock: {
    marginBottom: 4,
    backgroundColor: 'rgba(110,191,139,0.06)',
    borderRadius: theme.borderRadius.sm,
    padding: 12,
  },
  guidanceRitualText: {
    color: theme.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  guidanceFree: {
    color: theme.textPrimary,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    fontFamily: 'serif',
  },
  moonRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  moonEmoji: {
    fontSize: 38,
    marginTop: -4,
  },
  moonPhaseLabel: {
    color: theme.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'serif',
  },
  checkInQuestion: {
    color: theme.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    fontFamily: 'serif',
    marginBottom: 14,
  },
  checkInOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  checkInOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  checkInOptionSelected: {
    backgroundColor: 'rgba(201,169,98,0.18)',
    borderColor: theme.primary,
  },
  checkInOptionText: {
    color: theme.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  checkInOptionTextSelected: {
    color: theme.primary,
  },
  checkInDoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  checkInDoneTitle: {
    color: theme.energy,
    fontSize: 17,
    fontWeight: '700',
    fontFamily: 'serif',
  },
  patternGrid: {
    marginTop: 14,
    gap: 10,
  },
  patternTile: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: theme.borderRadius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  patternTileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  patternTileLabel: {
    color: theme.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  patternTileValue: {
    color: theme.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  patternTileSub: {
    color: theme.textMuted,
    fontSize: 12,
    marginTop: 3,
  },
  footer: {
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
  },
  footerText: {
    color: theme.textMuted,
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    maxWidth: 280,
  },
});
