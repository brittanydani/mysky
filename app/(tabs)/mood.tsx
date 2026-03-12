// File: app/(tabs)/mood.tsx
// MySky — Mood Tab: slider check-in + pattern graphs

import React, { useCallback, useEffect, useMemo, useState, memo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  TextInput,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from '../../components/ui/SkiaGradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter, Href } from 'expo-router';
import { useFocusEffect } from '@react-navigation/core';
import AsyncStorage from '@react-native-async-storage/async-storage';


import { theme, MYSTIC } from '../../constants/theme';
import { SkiaDynamicCosmos } from '../../components/ui/SkiaDynamicCosmos';
import { localDb } from '../../services/storage/localDb';
import { AstrologyCalculator } from '../../services/astrology/calculator';
import { NatalChart } from '../../services/astrology/types';
import { usePremium } from '../../context/PremiumContext';
import { CheckInService, CheckInInput, TIME_OF_DAY_LABELS, TIME_OF_DAY_ORDER } from '../../services/patterns/checkInService';
import { DailyCheckIn, ThemeTag, EnergyLevel, StressLevel, TimeOfDay } from '../../services/patterns/types';
import { logger } from '../../utils/logger';
import { toLocalDateString } from '../../utils/dateUtils';
import type { TimeOfDayMetricInsight, TimeOfDayBucket } from '../../utils/insightsEngine';
import SkiaUnifiedAura from '../../components/ui/SkiaUnifiedAura';
import SkiaResonanceSlider from '../../components/ui/SkiaResonanceSlider';
import SkiaPulseMonitor from '../../components/ui/SkiaPulseMonitor';
import SkiaBiometricScatter from '../../components/ui/SkiaBiometricScatter';
import { NeonWaveChart } from '../../components/ui/NeonWaveChart';

const { width: SCREEN_W } = Dimensions.get('window');
// card padding (16) × 2 + scroll horizontal padding (16) × 2 = 64
const GRAPH_W = SCREEN_W - 64;

// ─── Types ────────────────────────────────────────────────────────────────────

type TimeRange = '7d' | '30d' | '90d' | 'all';

// ─── Constants ────────────────────────────────────────────────────────────────

// Influence tags — what shaped your day (max 3)
const INFLUENCE_TAGS: ThemeTag[] = [
  'sleep', 'work', 'social', 'relationships', 'conflict', 'health',
  'movement', 'nature', 'alone_time', 'finances',
  'weather', 'food', 'screens', 'kids', 'productivity', 'substances', 'intimacy',
];

const INFLUENCE_LABELS: Record<string, string> = {
  sleep: '😴 Sleep', work: '💼 Work', social: '👥 Social',
  relationships: '💞 Relationships', conflict: '⚡ Conflict', health: '🏥 Health',
  movement: '🏃 Movement', nature: '🌿 Nature',
  alone_time: '🧘 Alone time',
  finances: '💰 Finances', weather: '🌦️ Weather', food: '🍽️ Food',
  screens: '📱 Screens', kids: '👶 Kids', productivity: '✅ Productivity',
  substances: '🍷 Substances', intimacy: '🔥 Intimacy',
};

// Emotional quality — optional premium single-select
const QUALITY_OPTIONS: ThemeTag[] = [
  'eq_calm', 'eq_anxious', 'eq_focused', 'eq_disconnected', 'eq_hopeful',
  'eq_irritable', 'eq_grounded', 'eq_scattered', 'eq_heavy', 'eq_open',
];

const QUALITY_LABELS: Record<string, string> = {
  eq_calm: '😌 Calm', eq_anxious: '😰 Anxious', eq_focused: '🎯 Focused',
  eq_disconnected: '🌫️ Disconnected', eq_hopeful: '🌅 Hopeful',
  eq_irritable: '😤 Irritable', eq_grounded: '🌳 Grounded',
  eq_scattered: '🌀 Scattered', eq_heavy: '🪨 Heavy', eq_open: '🌸 Open',
};

// Backward-compat label lookup for top-tags display
const ALL_TAG_LABELS: Record<string, string> = {
  ...INFLUENCE_LABELS,
  ...QUALITY_LABELS,
  confidence: '💪 Confidence', money: '💰 Money',
  family: '👨‍👩‍👧 Family', creativity: '🎨 Creativity',
  boundaries: '🛡️ Boundaries', career: '📈 Career', anxiety: '😰 Anxiety',
  joy: '😊 Joy', grief: '🥀 Grief', clarity: '💎 Clarity',
  overwhelm: '😵 Overwhelm', loneliness: '🌑 Loneliness', gratitude: '🙏 Gratitude',
};

const COLORS = {
  mood: '#C9AE78',
  energy: '#6fb3d3',
  stress: '#e07b7b',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sliderToLevel(v: number): 'low' | 'medium' | 'high' {
  if (v <= 3) return 'low';
  if (v <= 7) return 'medium';
  return 'high';
}

function levelToNum(level: 'low' | 'medium' | 'high'): number {
  return level === 'low' ? 2 : level === 'medium' ? 5 : 9;
}

function numToLevelLabel(n: number): string {
  if (n < 3.5) return 'Low';
  if (n < 6.5) return 'Medium';
  return 'High';
}

/** Filter, sort ascending by date, and cap at 30 points for graphing. */
function filterByRange(checkIns: DailyCheckIn[], range: TimeRange): DailyCheckIn[] {
  let filtered: DailyCheckIn[];
  if (range === 'all') {
    filtered = checkIns;
  } else {
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    filtered = checkIns.filter(c => c.date >= cutoffStr);
  }
  return [...filtered]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30);
}

function computeAverages(cis: DailyCheckIn[]) {
  if (!cis.length) return { mood: 0, energy: 0, stress: 0 };
  const mood = cis.reduce((s, c) => s + c.moodScore, 0) / cis.length;
  const energy = cis.reduce((s, c) => s + levelToNum(c.energyLevel), 0) / cis.length;
  const stress = cis.reduce((s, c) => s + levelToNum(c.stressLevel), 0) / cis.length;
  return { mood, energy, stress };
}

function computeTopTags(cis: DailyCheckIn[], limit = 5): { tag: ThemeTag; count: number }[] {
  const counts: Partial<Record<ThemeTag, number>> = {};
  for (const ci of cis) {
    for (const tag of (ci.tags ?? [])) {
      counts[tag] = (counts[tag] ?? 0) + 1;
    }
  }
  return (Object.entries(counts) as [ThemeTag, number][])
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([tag, count]) => ({ tag, count }));
}

function formatToday(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'short', day: 'numeric',
  });
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}



// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionLabel = memo(function SectionLabel({
  icon,
  title,
  delay,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  delay: number;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(600)} style={styles.sectionRow}>
      <Ionicons name={icon} size={18} color={theme.primary} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </Animated.View>
  );
});

const AvgBadge = memo(function AvgBadge({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.avgBadge} accessibilityLabel={`${label}: ${value}`}>
      <Text style={[styles.avgValue, { color }]}>{value}</Text>
      <Text style={styles.avgLabel}>{label}</Text>
    </View>
  );
});



// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function MoodScreen() {
  const router = useRouter();
  const { isPremium } = usePremium();

  // Chart state
  const [loading, setLoading] = useState(true);
  const [hasChart, setHasChart] = useState(false);
  const [userName, setUserName] = useState('');
  const [userChart, setUserChart] = useState<NatalChart | null>(null);
  const [chartId, setChartId] = useState('');

  // Check-in form
  const [moodSlider, setMoodSlider] = useState(5);
  const [energySlider, setEnergySlider] = useState(5);
  const [stressSlider, setStressSlider] = useState(5);
  const [selectedTags, setSelectedTags] = useState<ThemeTag[]>([]);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customInputText, setCustomInputText] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedQuality, setSelectedQuality] = useState<ThemeTag | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeOfDay>(CheckInService.getCurrentTimeSlot());
  const [completedSlots, setCompletedSlots] = useState<TimeOfDay[]>([]);
  const [todayCheckIns, setTodayCheckIns] = useState<DailyCheckIn[]>([]);

  // History
  const [allCheckIns, setAllCheckIns] = useState<DailyCheckIn[]>([]);
  const [todayCheckIn, setTodayCheckIn] = useState<DailyCheckIn | null>(null);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  const [isEditingUnlocked, setIsEditingUnlocked] = useState(false);
  const draftCacheRef = useRef<Record<string, any>>({});

  useEffect(() => {
    if (!loading && !hasChart) {
      // If user somehow hits Mood with no chart, send them to chart creation
      router.replace('/(tabs)/home' as Href);
    }
  }, [loading, hasChart, router]);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        try {
          setLoading(true);
          const charts = await localDb.getCharts();
          if (!charts?.length) {
            setHasChart(false);
            return;
          }
          setHasChart(true);

          const saved = charts[0];
          setUserName(saved?.name ?? '');
          const cId = saved?.id ?? '';
          setChartId(cId);

          const natal = AstrologyCalculator.generateNatalChart({
            date: saved.birthDate,
            time: saved.birthTime,
            hasUnknownTime: saved.hasUnknownTime,
            place: saved.birthPlace,
            latitude: saved.latitude,
            longitude: saved.longitude,
            timezone: saved.timezone,
            houseSystem: saved.houseSystem,
          });
          setUserChart(natal);

          const existing = await CheckInService.getTodayCheckInForSlot(cId, CheckInService.getCurrentTimeSlot());
          setTodayCheckIn(existing);
          if (existing) {
            const todayStr = toLocalDateString(new Date());
            let cachedExactStr = await AsyncStorage.getItem(`exact_${todayStr}_${existing.timeOfDay}`);
            if (!cachedExactStr) {
               const fallbackStr = new Date().toISOString().slice(0, 10);
               cachedExactStr = await AsyncStorage.getItem(`exact_${fallbackStr}_${existing.timeOfDay}`);
            }
            let exactE = levelToNum(existing.energyLevel);
            let exactS = levelToNum(existing.stressLevel);
            if (cachedExactStr) {
               try { 
                 const parsed = JSON.parse(cachedExactStr);
                 exactE = parsed.energy;
                 exactS = parsed.stress;
               } catch(e) {}
            }
            setMoodSlider(existing.moodScore);
            setEnergySlider(exactE);
            setStressSlider(exactS);
            const restoredTags = existing.tags ?? [];
            const eqTag = restoredTags.find((t: string) => t.startsWith('eq_')) as ThemeTag | undefined;
            setSelectedQuality(eqTag ?? null);
            setSelectedTags(restoredTags.filter((t: string) => !t.startsWith('eq_')));
            setShowCustomInput(false);
            setCustomInputText('');
          }

          // Load all today's check-ins and completed slots
          const todayAll = await CheckInService.getTodayCheckIns(cId);
          setTodayCheckIns(todayAll);
          const slots = todayAll.map(c => c.timeOfDay);
          setCompletedSlots(slots);
          setSelectedTimeSlot(CheckInService.getCurrentTimeSlot());

          const all = await CheckInService.getAllCheckIns(cId, 365);
          setAllCheckIns(all);

          const streak = await CheckInService.getCurrentStreak(cId);
          setCurrentStreak(streak);
          setLoadError(null);
        } catch (e) {
          logger.error('[Mood] load failed:', e);
          setLoadError('Could not load your check-in data. Please try again.');
        } finally {
          setLoading(false);
        }
      };

      load();
    }, [])
  );

  const handleSave = useCallback(async () => {
    if (!userChart || !chartId || saving) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setSaving(true);
    setSaveError(null);

    try {
      const allTags: ThemeTag[] = [...selectedTags];
      if (selectedQuality) allTags.push(selectedQuality);

      const input: CheckInInput = {
        moodScore: moodSlider,
        energyLevel: sliderToLevel(energySlider) as EnergyLevel,
        stressLevel: sliderToLevel(stressSlider) as StressLevel,
        tags: allTags,
        timeOfDay: selectedTimeSlot,
      };

      const result = await CheckInService.saveCheckIn(input, userChart, chartId);
      
      const todayStr = toLocalDateString(new Date());
      await AsyncStorage.setItem(`exact_${todayStr}_${selectedTimeSlot}`, JSON.stringify({
         energy: energySlider,
         stress: stressSlider
      }));

      setTodayCheckIn(result);
      setSavedAt(new Date());
      setIsEditingUnlocked(false);

      // Refresh today's check-ins and completed slots
      const todayAll = await CheckInService.getTodayCheckIns(chartId);
      setTodayCheckIns(todayAll);
      setCompletedSlots(todayAll.map(c => c.timeOfDay));

      const all = await CheckInService.getAllCheckIns(chartId, 365);
      setAllCheckIns(all);

      const streak = await CheckInService.getCurrentStreak(chartId);
      setCurrentStreak(streak);

      setTimeout(() => setSavedAt(null), 2500);
    } catch (e) {
      logger.error('[Mood] save failed:', e);
      let isOffline = false;
      try { await fetch('https://clients3.google.com/generate_204', { method: 'HEAD', mode: 'no-cors' }); } catch { isOffline = true; }
      const msg = isOffline
        ? 'You appear to be offline. Check-in could not be saved.'
        : 'Could not save check-in. Please try again.';
      setSaveError(msg);
      Alert.alert('Save Error', msg);
    } finally {
      setSaving(false);
    }
  }, [userChart, chartId, moodSlider, energySlider, stressSlider, selectedTags, selectedQuality, selectedTimeSlot, saving]);

  const handleAddCustomTag = useCallback(() => {
    const raw = customInputText.trim().slice(0, 20);
    const trimmed = raw.charAt(0).toUpperCase() + raw.slice(1);
    if (trimmed && !selectedTags.includes(trimmed as ThemeTag) && selectedTags.length < 3) {
      setSelectedTags(prev => [...prev, trimmed as ThemeTag]);
    }
    setCustomInputText('');
    setShowCustomInput(false);
  }, [customInputText, selectedTags]);

  // ── Derived ────────────────────────────────────────────────────────────────

  const filteredCheckIns = useMemo(
    () => filterByRange(allCheckIns, timeRange),
    [allCheckIns, timeRange]
  );


  const avgs = useMemo(() => computeAverages(filteredCheckIns), [filteredCheckIns]);
  const topTags = useMemo(() => computeTopTags(filteredCheckIns), [filteredCheckIns]);

  /** Time-of-day breakdown from check-in data */
  const todInsights = useMemo(() => {
    if (filteredCheckIns.length < 4) return null;

    const data: Record<string, { moods: number[]; energies: number[]; stresses: number[] }> = {
      Morning: { moods: [], energies: [], stresses: [] },
      Afternoon: { moods: [], energies: [], stresses: [] },
      Evening: { moods: [], energies: [], stresses: [] },
      Night: { moods: [], energies: [], stresses: [] },
    };

    const todMap: Record<string, string> = {
      morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening', night: 'Night',
    };

    for (const c of filteredCheckIns) {
      const bucket = c.timeOfDay ? (todMap[c.timeOfDay] ?? 'Morning') : 'Morning';
      data[bucket].moods.push(c.moodScore);
      data[bucket].energies.push(levelToNum(c.energyLevel));
      data[bucket].stresses.push(levelToNum(c.stressLevel));
    }

    const buckets: TimeOfDayBucket[] = (['Morning', 'Afternoon', 'Evening', 'Night'] as const)
      .filter(l => data[l].moods.length >= 1)
      .map(l => ({
        label: l,
        count: data[l].moods.length,
        avgMood: parseFloat((data[l].moods.reduce((a, b) => a + b, 0) / data[l].moods.length).toFixed(1)),
        avgEnergy: parseFloat((data[l].energies.reduce((a, b) => a + b, 0) / data[l].energies.length).toFixed(1)),
        avgStress: parseFloat((data[l].stresses.reduce((a, b) => a + b, 0) / data[l].stresses.length).toFixed(1)),
      }));

    if (buckets.length < 2) return null;

    // Build per-metric insights
    const metrics: Array<{ key: 'mood' | 'energy' | 'stress'; emoji: string; label: string; extract: (b: TimeOfDayBucket) => number }> = [
      { key: 'mood', emoji: '💛', label: 'Mood', extract: b => b.avgMood },
      { key: 'energy', emoji: '⚡', label: 'Energy', extract: b => b.avgEnergy },
      { key: 'stress', emoji: '🔥', label: 'Stress', extract: b => b.avgStress },
    ];

    const metricInsights: TimeOfDayMetricInsight[] = [];
    for (const m of metrics) {
      const sorted = [...buckets].sort((a, b) => m.extract(b) - m.extract(a));
      const high = sorted[0];
      const low = sorted[sorted.length - 1];
      const spread = m.extract(high) - m.extract(low);
      if (spread < 0.3) continue;

      const hl = high.label.toLowerCase();
      const ll = low.label.toLowerCase();

      let text: string;
      if (m.key === 'mood') {
        text = spread >= 1.0
          ? `Your mood peaks in the ${hl} (${m.extract(high).toFixed(1)}) and is lowest at ${ll} (${m.extract(low).toFixed(1)}).`
          : `You tend to feel best in the ${hl} and lowest at ${ll}.`;
      } else if (m.key === 'energy') {
        text = spread >= 1.0
          ? `Your energy is highest in the ${hl} (${m.extract(high).toFixed(1)}) and lowest in the ${ll} (${m.extract(low).toFixed(1)}).`
          : `You tend to have the most energy in the ${hl} and least in the ${ll}.`;
      } else {
        text = spread >= 1.0
          ? `Stress peaks in the ${hl} (${m.extract(high).toFixed(1)}) and is lowest in the ${ll} (${m.extract(low).toFixed(1)}).`
          : `Stress tends to be higher in the ${hl} and lower in the ${ll}.`;
      }

      metricInsights.push({
        metric: m.key,
        emoji: m.emoji,
        label: m.label,
        insight: text,
        highBucket: high.label,
        lowBucket: low.label,
        highValue: m.extract(high),
        lowValue: m.extract(low),
        spread,
      });
    }

    metricInsights.sort((a, b) => b.spread - a.spread || a.label.localeCompare(b.label));
    return { buckets, metricInsights };
  }, [filteredCheckIns]);

  const dateLabels = useMemo((): [string, string] | undefined => {
    if (filteredCheckIns.length < 2) return undefined;
    return [
      formatDate(filteredCheckIns[0].date),
      formatDate(filteredCheckIns[filteredCheckIns.length - 1].date),
    ];
  }, [filteredCheckIns]);

  // ── Loading state ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.container}>
        <SkiaDynamicCosmos />
        <SafeAreaView edges={['top']} style={styles.flex}>
          <View style={styles.centered}>
            <Ionicons name="sparkles" size={28} color={theme.primary} />
            <Text style={[styles.body, { marginTop: 12 }]}>Loading…</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ✅ HARD STOP: Mood should never render without a chart (prevents flicker/pop-in UI)
  if (!hasChart) {
    return null;
  }

  // ── Load error state ──────────────────────────────────────────────────────
  // If you ever get here, we DO have a chart, so it's fine to show.
  if (loadError) {
    return (
      <View style={styles.container}>
        <SkiaDynamicCosmos />
        <SafeAreaView edges={['top']} style={styles.flex}>
          <View style={styles.centered}>
            <Ionicons name="cloud-offline-outline" size={36} color="#E85D75" />
            <Text style={[styles.heroText, { marginTop: 16, textAlign: 'center' }]}>Could not load data</Text>
            <Text style={[styles.body, { marginTop: 8, textAlign: 'center', paddingHorizontal: 32 }]}>
              {loadError}
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />
      <SafeAreaView edges={['top']} style={styles.flex}>
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(60).duration(600)} style={styles.header}>
          <Text style={styles.title}>Internal Weather</Text>
          <Text style={styles.subtitle}>
            Daily check-in · {formatToday()}
          </Text>
        </Animated.View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.content, { paddingBottom: 120 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
            {/* Streak row */}
            {currentStreak > 0 && (
              <Animated.View entering={FadeInDown.delay(80).duration(500)} style={styles.streakRow}>
                <Ionicons name="flame-outline" size={14} color={MYSTIC.gold} />
                <Text style={[styles.streakTxt, { color: MYSTIC.gold }]}>{currentStreak} day streak</Text>
                {allCheckIns.length > 0 && (
                  <>
                    <Text style={styles.dot}> · </Text>
                    <Text style={[styles.streakTxt, { color: MYSTIC.silverBlue }]}>{allCheckIns.length} total</Text>
                  </>
                )}
              </Animated.View>
            )}

            {/* ═══ Unified Aura — Internal Weather Station ═══ */}
            {allCheckIns.length > 0 && (
              <Animated.View entering={FadeInDown.delay(90).duration(600)} style={{ marginBottom: 8 }}>
                <SkiaUnifiedAura
                  mood={moodSlider}
                  energy={energySlider}
                  tension={stressSlider}
                />
              </Animated.View>
            )}

            {/* ═══ Quick Check-In ═══ */}
            <SectionLabel icon="heart-outline" title="Quick Check-In" delay={100} />
            <Animated.View entering={FadeInDown.delay(120).duration(600)}>
              <LinearGradient
                colors={['rgba(14,24,48,0.40)', 'rgba(2,8,23,0.50)']}
                style={styles.card}
              >
                {/* Save confirmation */}
                {savedAt && (
                  <View style={styles.savedBanner}>
                    <Ionicons name="checkmark-circle" size={16} color={theme.energy} />
                    <Text style={styles.savedTxt}>Check-in saved. Patterns updated.</Text>
                  </View>
                )}

                {/* Time-of-day selector */}
                <Text style={[styles.tagsLabel, { marginBottom: 8 }]}>
                  When are you checking in?
                </Text>
                <View style={styles.timeSlotRow}>
                  {TIME_OF_DAY_ORDER.map(slot => {
                    const info = TIME_OF_DAY_LABELS[slot];
                    const isSelected = selectedTimeSlot === slot;
                    const isCompleted = completedSlots.includes(slot);
                    const isCurrent = CheckInService.getCurrentTimeSlot() === slot;

                    return (
                      <Pressable
                        key={slot}
                        style={[
                          styles.timeSlotChip,
                          isSelected && styles.timeSlotChipOn,
                          isCompleted && !isSelected && styles.timeSlotChipDone,
                        ]}
                        onPress={async () => {
                          Haptics.selectionAsync().catch(() => {});
                          if (slot !== selectedTimeSlot) {
                            draftCacheRef.current[selectedTimeSlot] = {
                              moodSlider, energySlider, stressSlider,
                              selectedTags, selectedQuality,
                              showCustomInput, customInputText
                            };
                            setSelectedTimeSlot(slot);
                            setIsEditingUnlocked(false);

                            // Load existing data for this slot if it exists
                          const existing = todayCheckIns.find(c => c.timeOfDay === slot);
                          if (existing) {
                            const todayStr = toLocalDateString(new Date());
                            let cachedExactStr = await AsyncStorage.getItem(`exact_${todayStr}_${existing.timeOfDay}`);
                            if (!cachedExactStr) {
                               const fallbackStr = new Date().toISOString().slice(0, 10);
                               cachedExactStr = await AsyncStorage.getItem(`exact_${fallbackStr}_${existing.timeOfDay}`);
                            }
                            let exactE = levelToNum(existing.energyLevel);
                            let exactS = levelToNum(existing.stressLevel);
                            if (cachedExactStr) {
                               try { 
                                 const parsed = JSON.parse(cachedExactStr);
                                 exactE = parsed.energy;
                                 exactS = parsed.stress;
                               } catch(e) {}
                            }

                            setMoodSlider(existing.moodScore);
                            setEnergySlider(exactE);
                            setStressSlider(exactS);

                            const restoredTags = existing.tags ?? [];
                            const eqTag = restoredTags.find((t: string) => t.startsWith('eq_')) as ThemeTag | undefined;

                            setSelectedQuality(eqTag ?? null);
                            setSelectedTags(restoredTags.filter((t: string) => !t.startsWith('eq_')));
                            setShowCustomInput(false);
                            setCustomInputText('');
                            setTodayCheckIn(existing);
                          } else {
                            const draft = draftCacheRef.current[slot as TimeOfDay];
                            setMoodSlider(draft ? draft.moodSlider : 5);
                            setEnergySlider(draft ? draft.energySlider : 5);
                            setStressSlider(draft ? draft.stressSlider : 5);
                            setSelectedTags(draft ? draft.selectedTags : []);
                            setSelectedQuality(draft ? draft.selectedQuality : null);
                            setShowCustomInput(draft ? draft.showCustomInput : false);
                            setCustomInputText(draft ? draft.customInputText : '');
                            setTodayCheckIn(null);
                          }
                        }
                      }}
                        accessibilityRole="button"
                        accessibilityLabel={`${info.label} check-in${isCompleted ? ' (completed)' : ''}`}
                        accessibilityState={{ selected: isSelected }}
                      >
                        <Text style={styles.timeSlotEmoji}>{info.emoji}</Text>
                        <Text
                          style={[
                            styles.timeSlotLabel,
                            isSelected && styles.timeSlotLabelOn,
                            isCompleted && !isSelected && styles.timeSlotLabelDone,
                          ]}
                        >
                          {info.label}
                        </Text>
                        {isCompleted && (
                          <Ionicons
                            name="checkmark-circle"
                            size={12}
                            color={isSelected ? theme.primary : theme.energy}
                            style={{ marginTop: 2 }}
                          />
                        )}
                        {isCurrent && !isCompleted && (
                          <View style={styles.currentDot} />
                        )}
                      </Pressable>
                    );
                  })}
                </View>

                {/* Today's check-in summary */}
                {todayCheckIns.length > 0 && !savedAt && (
                  <View style={styles.todayNotice}>
                    <Ionicons name="time-outline" size={13} color={theme.textMuted} />
                    <Text style={styles.todayNoticeTxt}>
                      {completedSlots.includes(selectedTimeSlot)
                        ? `${TIME_OF_DAY_LABELS[selectedTimeSlot].label} check-in logged — update below`
                        : `${todayCheckIns.length}/4 check-in${todayCheckIns.length !== 1 ? 's' : ''} today`}
                    </Text>
                  </View>
                )}

                <View pointerEvents={(completedSlots.includes(selectedTimeSlot) && !isEditingUnlocked) ? 'none' : 'auto'} style={{ opacity: (completedSlots.includes(selectedTimeSlot) && !isEditingUnlocked) ? 0.7 : 1 }}>
                  {/* Sliders — Resonance-enhanced */}
                <SkiaResonanceSlider
                  question="How are you feeling emotionally?"
                  value={moodSlider}
                  onChange={setMoodSlider}
                  color={COLORS.mood}
                  anchors={['Very low', 'Neutral', 'Excellent']}
                  min={1}
                  max={9}
                />
                <SkiaResonanceSlider
                  question="How is your energy right now?"
                  value={energySlider}
                  onChange={setEnergySlider}
                  color={COLORS.energy}
                  anchors={['Exhausted', 'Steady', 'Energized']}
                  min={1}
                  max={9}
                />
                <SkiaResonanceSlider
                  question="How activated or stressed do you feel?"
                  value={stressSlider}
                  onChange={setStressSlider}
                  color={COLORS.stress}
                  anchors={['Calm', 'Alert', 'Overwhelmed']}
                  min={1}
                  max={9}
                />

                {/* Influence tags */}
                <Text style={styles.tagsLabel}>
                  What shaped your day? <Text style={styles.tagsMuted}>(pick up to 3)</Text>
                </Text>
                <View style={styles.tagRow}>
                  {INFLUENCE_TAGS.map(tag => (
                    <Pressable
                      key={tag}
                      style={[styles.tagChip, selectedTags.includes(tag) && styles.tagChipOn]}
                      onPress={() => {
                        Haptics.selectionAsync().catch(() => {});
                        setSelectedTags(prev =>
                          prev.includes(tag)
                            ? prev.filter(t => t !== tag)
                            : prev.length >= 3 ? prev : [...prev, tag]
                        );
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={INFLUENCE_LABELS[tag]}
                      accessibilityState={{ selected: selectedTags.includes(tag) }}
                      accessibilityHint={
                        selectedTags.includes(tag)
                          ? 'Double-tap to remove'
                          : selectedTags.length >= 3
                            ? 'Maximum 3 tags already selected'
                            : 'Double-tap to add, up to 3 tags'
                      }
                    >
                      <Text style={[styles.tagTxt, selectedTags.includes(tag) && styles.tagTxtOn]}>
                        {INFLUENCE_LABELS[tag]}
                      </Text>
                    </Pressable>
                  ))}

                  {/* Custom tags — up to 3 total (preset + custom); hold to remove */}
                  {selectedTags
                    .filter(t => !(INFLUENCE_TAGS as string[]).includes(t) && !t.startsWith('eq_'))
                    .map(customTag => (
                      <Pressable
                        key={customTag}
                        style={[styles.tagChip, styles.tagChipOn]}
                        onLongPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                          setSelectedTags(prev => prev.filter(t => t !== customTag));
                        }}
                        delayLongPress={600}
                        accessibilityRole="button"
                        accessibilityLabel={`${customTag}, hold to remove`}
                      >
                        <Text style={[styles.tagTxt, styles.tagTxtOn]}>✏️ {customTag}</Text>
                      </Pressable>
                    ))}

                  {/* "+ other" chip or inline input */}
                  {(() => {
                    if (showCustomInput) {
                      return (
                        <View style={styles.customTagInputRow}>
                          <TextInput
                            style={styles.customTagInput}
                            value={customInputText}
                            onChangeText={t => setCustomInputText(t.slice(0, 20))}
                            placeholder="e.g. travel"
                            placeholderTextColor={theme.textSecondary}
                            autoFocus
                            returnKeyType="done"
                            onSubmitEditing={handleAddCustomTag}
                            onBlur={() => { if (!customInputText.trim()) setShowCustomInput(false); }}
                            maxLength={20}
                            accessibilityLabel="Custom influence tag"
                            accessibilityHint="Type a custom tag and press done to add it"
                          />
                        </View>
                      );
                    }

                    if (selectedTags.length >= 3) return null;

                    return (
                      <Pressable
                        style={styles.tagChipOther}
                        onPress={() => { Haptics.selectionAsync().catch(() => {}); setShowCustomInput(true); }}
                        accessibilityRole="button"
                        accessibilityLabel="Add your own influence"
                      >
                        <Text style={styles.tagTxtOther}>+ other</Text>
                      </Pressable>
                    );
                  })()}
                </View>

                {/* Premium: Emotional Quality */}
                {isPremium && (
                  <>
                    <Text style={[styles.tagsLabel, { marginTop: 4 }]}>
                      What best describes today? <Text style={styles.tagsMuted}>(optional)</Text>
                    </Text>
                    <View style={styles.tagRow}>
                      {QUALITY_OPTIONS.map(q => (
                        <Pressable
                          key={q}
                          style={[styles.qualityChip, selectedQuality === q && styles.qualityChipOn]}
                          onPress={() => {
                            Haptics.selectionAsync().catch(() => {});
                            setSelectedQuality(prev => prev === q ? null : q);
                          }}
                          accessibilityRole="button"
                          accessibilityLabel={QUALITY_LABELS[q]}
                          accessibilityState={{ selected: selectedQuality === q }}
                        >
                          <Text style={[styles.qualityTxt, selectedQuality === q && styles.qualityTxtOn]}>
                            {QUALITY_LABELS[q]}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </>
                )}

                </View>{/* end of locked inputs view */}

                {/* Somatic Pulse Monitor / Action Area */}
                {completedSlots.includes(selectedTimeSlot) && !isEditingUnlocked ? (
                  <View style={[styles.pulseSection, { paddingVertical: 24 }]}>
                    <Text style={[styles.pulseLabel, { color: theme.energy, marginBottom: 16 }]}>
                      Check-in sealed for {TIME_OF_DAY_LABELS[selectedTimeSlot].label.toLowerCase()}{' '}
                      {TIME_OF_DAY_LABELS[selectedTimeSlot].emoji}
                    </Text>
                    <Pressable 
                      style={{ backgroundColor: 'transparent', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 20, borderWidth: 1, borderColor: '#333842', alignSelf: 'center' }}
                      onPress={() => { Haptics.selectionAsync().catch(()=>{}); setIsEditingUnlocked(true); }}
                    >
                      <Text style={{ color: theme.textPrimary, fontSize: 14, fontWeight: '600' }}>Edit Entry</Text>
                    </Pressable>
                  </View>
                ) : (
                  <>
                    <View style={styles.pulseSection}>
                      <Text style={styles.pulseLabel}>Hold to sync your {TIME_OF_DAY_LABELS[selectedTimeSlot].label.toLowerCase()} check-in</Text>
                      <Text style={styles.pulseHint}>Hold to seal and confirm</Text>
                      <SkiaPulseMonitor onSyncComplete={handleSave} />
                    </View>
                    <Text style={styles.hint}>Daily sync — up to 4× daily. Morning, afternoon, evening, night.</Text>
                  </>
                )}

                {/* Save error banner */}
                {saveError && (
                  <View style={styles.errorBanner}>
                    <Ionicons name="warning-outline" size={16} color="#E85D75" />
                    <Text style={styles.errorBannerText}>{saveError}</Text>
                    <Pressable
                      onPress={() => setSaveError(null)}
                      accessibilityRole="button"
                      accessibilityLabel="Dismiss error"
                    >
                      <Ionicons name="close" size={16} color={theme.textMuted} />
                    </Pressable>
                  </View>
                )}
              </LinearGradient>
            </Animated.View>

            {/* ═══ Mood Scatter — mood vs energy connection ═══ */}
            {allCheckIns.length >= 3 && (
              <Animated.View entering={FadeInDown.delay(180).duration(600)}>
                <LinearGradient
                  colors={['rgba(14, 24, 48,0.50)', 'rgba(10, 18, 36,0.35)']}
                  style={styles.card}
                >
                  <View style={styles.scatterSection}>
                    <Text style={styles.scatterTitle}>Mood × Energy Connection</Text>
                    <Text style={styles.scatterHint}>Each point maps one check-in — clusters reveal your baseline patterns</Text>
                    <SkiaBiometricScatter
                      points={allCheckIns.slice(0, 30).map(c => ({
                        x: c.moodScore / 10,
                        y: c.energyLevel === 'high' ? 0.85 : c.energyLevel === 'medium' ? 0.5 : 0.2,
                      }))}
                      title="Mental State Correlation"
                      subtitle="Emotional Mood vs. Physical Energy"
                      xAxisLabel="High Mood"
                      yAxisLabel="High Energy"
                      insight="Your energy levels and mood scores tend to move together. Focus on physical recharge to boost emotional state."
                    />
                  </View>
                </LinearGradient>
              </Animated.View>
            )}

            {/* ═══ Energy Reading link ═══ */}
            <Animated.View entering={FadeInDown.delay(200).duration(600)}>
              <Pressable
                onPress={() => { Haptics.selectionAsync().catch(() => {}); router.push('/(tabs)/energy' as Href); }}
                accessibilityRole="button"
                accessibilityLabel="Energy Reading"
              >
                <LinearGradient
                  colors={['rgba(14, 24, 48,0.50)', 'rgba(10, 18, 36,0.35)']}
                  style={[styles.card, { padding: theme.spacing.md }]}
                >
                  <View style={styles.linkRow}>
                    <View style={styles.linkLeft}>
                      <Ionicons name="pulse-outline" size={20} color={theme.primary} />
                      <View>
                        <Text style={styles.linkTitle}>Energy Reading</Text>
                        <Text style={styles.linkSub}>Chakra wheel · Domain breakdown · Guidance</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={theme.primary} />
                  </View>
                </LinearGradient>
              </Pressable>
            </Animated.View>

            {/* ═══ Your Patterns ═══ */}
            <SectionLabel icon="analytics-outline" title="Your Patterns" delay={200} />

            {isPremium ? (
              <Animated.View entering={FadeInDown.delay(220).duration(600)}>
                <LinearGradient
                  colors={['rgba(14,24,48,0.40)', 'rgba(2,8,23,0.50)']}
                  style={styles.card}
                >
                  {/* Time range selector */}
                  <View style={styles.rangeRow}>
                    {(['7d', '30d', '90d', 'all'] as TimeRange[]).map(r => (
                      <Pressable
                        key={r}
                        style={[styles.rangeBtn, timeRange === r && styles.rangeBtnOn]}
                        onPress={() => {
                          Haptics.selectionAsync().catch(() => {});
                          setTimeRange(r);
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={`Show ${r === 'all' ? 'all' : r === '7d' ? '7 day' : r === '30d' ? '30 day' : '90 day'} trends`}
                        accessibilityState={{ selected: timeRange === r }}
                      >
                        <Text style={[styles.rangeTxt, timeRange === r && styles.rangeTxtOn]}>
                          {r === 'all' ? 'All' : r.toUpperCase()}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  {filteredCheckIns.length < 2 ? (
                    <View style={styles.emptyState}>
                      <Ionicons name="hourglass-outline" size={28} color={theme.primary} />
                      <Text style={[styles.body, { textAlign: 'center', marginTop: 10 }]}>
                        {allCheckIns.length === 0
                          ? 'Log your first check-in above to start tracking'
                          : 'Not enough check-ins in this date range'}
                      </Text>
                    </View>
                  ) : (
                    <>
                      {/* Date range labels */}
                      {dateLabels && (
                        <View style={styles.dateRow}>
                          <Text style={styles.dateTxt}>{dateLabels[0]}</Text>
                          <Text style={styles.dateTxt}>{dateLabels[1]}</Text>
                        </View>
                      )}

                      {/* Averages row */}
                      <View style={styles.avgsRow}>
                        <AvgBadge label="Avg Mood" value={avgs.mood.toFixed(1)} color={COLORS.mood} />
                        <AvgBadge label="Avg Energy" value={numToLevelLabel(avgs.energy)} color={COLORS.energy} />
                        <AvgBadge label="Avg Stress" value={numToLevelLabel(avgs.stress)} color={COLORS.stress} />
                      </View>

                      {/* Cinematic 3D wave chart — mood · energy · stress */}
                      <NeonWaveChart
                        checkIns={filteredCheckIns}
                        width={GRAPH_W}
                        height={220}
                      />

                      {/* Top themes */}
                      {topTags.length > 0 && (
                        <>
                          <Text style={[styles.graphLabelTxt, { marginTop: 12, marginBottom: 6, color: theme.textSecondary }]}>
                            Most Common Themes
                          </Text>
                          {topTags.map(({ tag, count }) => (
                            <View key={tag} style={styles.tagStatRow}>
                              <Text style={styles.tagStatLabel}>{ALL_TAG_LABELS[tag] ?? tag}</Text>
                              <View style={styles.tagStatBar}>
                                <View
                                  style={[
                                    styles.tagStatFill,
                                    { width: `${(count / topTags[0].count) * 100}%` },
                                  ]}
                                />
                              </View>
                              <Text style={styles.tagStatCount}>{count}×</Text>
                            </View>
                          ))}
                        </>
                      )}

                      {/* Time-of-Day Insights */}
                      {todInsights && todInsights.buckets.length >= 2 && (
                        <>
                          <Text style={[styles.graphLabelTxt, { marginTop: 16, marginBottom: 8, color: theme.textSecondary }]}>
                            🕐 Time of Day Patterns
                          </Text>

                          {/* Bucket overview */}
                          <View style={styles.todBucketRow}>
                            {todInsights.buckets.map(b => {
                              const emoji: Record<string, string> = {
                                Morning: '🌅', Afternoon: '☀️', Evening: '🌆', Night: '🌙',
                              };
                              return (
                                <View key={b.label} style={styles.todBucket}>
                                  <Text style={{ fontSize: 16 }}>{emoji[b.label]}</Text>
                                  <Text style={styles.todBucketLabel}>{b.label}</Text>
                                  <View style={{ gap: 1, alignItems: 'center' }}>
                                    <Text style={[styles.todBucketVal, { color: COLORS.mood }]}>{b.avgMood.toFixed(1)}</Text>
                                    <Text style={[styles.todBucketVal, { color: COLORS.energy }]}>{b.avgEnergy.toFixed(1)}</Text>
                                    <Text style={[styles.todBucketVal, { color: COLORS.stress }]}>{b.avgStress.toFixed(1)}</Text>
                                  </View>
                                  <Text style={styles.todBucketCount}>{b.count}×</Text>
                                </View>
                              );
                            })}
                          </View>

                          {/* Legend */}
                          <View style={styles.todLegend}>
                            <View style={styles.todLegendItem}>
                              <View style={[styles.todLegendDot, { backgroundColor: COLORS.mood }]} />
                              <Text style={styles.todLegendTxt}>Mood</Text>
                            </View>
                            <View style={styles.todLegendItem}>
                              <View style={[styles.todLegendDot, { backgroundColor: COLORS.energy }]} />
                              <Text style={styles.todLegendTxt}>Energy</Text>
                            </View>
                            <View style={styles.todLegendItem}>
                              <View style={[styles.todLegendDot, { backgroundColor: COLORS.stress }]} />
                              <Text style={styles.todLegendTxt}>Stress</Text>
                            </View>
                          </View>

                          {/* Per-metric insights */}
                          {todInsights.metricInsights.length > 0 && (
                            <View style={styles.todInsightList}>
                              {todInsights.metricInsights.map(mi => (
                                <View key={mi.metric} style={styles.todInsightRow}>
                                  <Text style={styles.todInsightEmoji}>{mi.emoji}</Text>
                                  <Text style={styles.todInsightText}>{mi.insight}</Text>
                                </View>
                              ))}
                            </View>
                          )}
                        </>
                      )}
                    </>
                  )}
                </LinearGradient>
              </Animated.View>
            ) : (
              <Animated.View entering={FadeInDown.delay(220).duration(600)}>
                <Pressable
                  onPress={() => { Haptics.selectionAsync().catch(() => {}); router.push('/(tabs)/premium' as Href); }}
                  accessibilityRole="button"
                  accessibilityLabel="Unlock Patterns"
                >
                  <LinearGradient
                    colors={['rgba(232,214,174,0.08)', 'rgba(232,214,174,0.03)']}
                    style={[styles.card, { borderColor: 'rgba(232,214,174,0.18)' }]}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'transparent', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 }}>
                        <Ionicons name="sparkles" size={10} color={theme.primary} />
                        <Text style={{ fontSize: 10, fontWeight: '600', color: theme.primary }}>Deeper Sky</Text>
                      </View>
                    </View>

                    {/* Preview of what pattern analysis looks like */}
                    <View style={{ marginBottom: 14 }}>
                      {allCheckIns.length > 0 ? (
                        <>
                          <Text style={[styles.body, { marginBottom: 8 }]}>
                            You have {allCheckIns.length} check-in{allCheckIns.length !== 1 ? 's' : ''} — enough data to start revealing your emotional rhythms.
                          </Text>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 10, borderRadius: 8, backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' }}>
                            <View style={{ alignItems: 'center' }}>
                              <Text style={{ fontSize: 16, fontWeight: '800', color: theme.textMuted }}>— —</Text>
                              <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 2 }}>Avg Mood</Text>
                            </View>
                            <View style={{ alignItems: 'center' }}>
                              <Text style={{ fontSize: 16, fontWeight: '800', color: theme.textMuted }}>— —</Text>
                              <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 2 }}>Avg Energy</Text>
                            </View>
                            <View style={{ alignItems: 'center' }}>
                              <Text style={{ fontSize: 16, fontWeight: '800', color: theme.textMuted }}>— —</Text>
                              <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 2 }}>Avg Stress</Text>
                            </View>
                          </View>
                        </>
                      ) : (
                        <Text style={styles.body}>
                          See mood, energy, and stress trends over time. Discover which days you feel best and which themes come up most.
                        </Text>
                      )}
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: theme.primary }}>Unlock your patterns</Text>
                      <Ionicons name="arrow-forward" size={14} color={theme.primary} />
                    </View>
                  </LinearGradient>
                </Pressable>
              </Animated.View>
            )}

            {/* Footer */}
            <Animated.View entering={FadeInDown.delay(380).duration(600)} style={styles.footer}>
              <Text style={styles.footerTxt}>
                Tracking how you feel is an act of self-awareness, not self-judgment.
              </Text>
            </Animated.View>
          </ScrollView>
        </SafeAreaView>
      </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  flex: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
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
    color: 'rgba(255, 255, 255, 0.55)',
    fontStyle: 'italic',
    marginTop: 2,
  },
  content: { paddingHorizontal: theme.spacing.lg },

  card: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.cardBorder,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  heroText: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.textPrimary,
    fontFamily: 'serif',
  },
  body: { color: theme.textSecondary, fontSize: 14, lineHeight: 20 },

  sectionRow: {
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

  streakRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  streakTxt: { color: theme.primary, fontSize: 13, fontWeight: '600' },
  dot: { color: theme.textMuted, fontSize: 13 },

  // Check-in
  savedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(100,200,120,0.10)',
    borderRadius: theme.borderRadius.sm,
    padding: 10,
    marginBottom: 16,
  },
  savedTxt: { color: theme.energy, fontSize: 13, fontWeight: '600' },
  todayNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  todayNoticeTxt: { color: theme.textMuted, fontSize: 12 },

  tagsLabel: {
    color: theme.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  tagsMuted: { color: theme.textMuted, fontWeight: '400', fontSize: 13 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },

  // Time-of-day slots
  timeSlotRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  timeSlotChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 12,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  timeSlotChipOn: {
    backgroundColor: 'transparent',
    borderColor: theme.primary,
  },
  timeSlotChipDone: {
    backgroundColor: 'rgba(100,200,120,0.08)',
    borderColor: 'rgba(100,200,120,0.25)',
  },
  timeSlotEmoji: {
    fontSize: 18,
    marginBottom: 2,
  },
  timeSlotLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.textMuted,
  },
  timeSlotLabelOn: {
    color: theme.primary,
  },
  timeSlotLabelDone: {
    color: theme.energy,
  },
  currentDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: theme.primary,
    marginTop: 3,
  },

  tagChip: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  tagChipOn: {
    backgroundColor: 'transparent',
    borderColor: theme.primary,
  },
  tagTxt: { color: theme.textSecondary, fontSize: 13, fontWeight: '600' },
  tagTxtOn: { color: theme.primary },
  tagChipOther: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    borderStyle: 'dashed',
  },
  tagTxtOther: { color: theme.textMuted, fontSize: 13, fontWeight: '600' },
  customTagInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.20)',
  },
  customTagInput: {
    color: theme.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    minWidth: 90,
    maxWidth: 140,
    height: 20,
  },

  qualityChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  qualityChipOn: {
    backgroundColor: 'rgba(142,111,211,0.18)',
    borderColor: 'rgba(142,111,211,0.5)',
  },
  qualityTxt: { color: theme.textSecondary, fontSize: 12, fontWeight: '600' },
  qualityTxtOn: { color: '#B49EE0' },

  saveBtn: {
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
    marginBottom: 12,
  },
  saveBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(232, 214, 174,0.22)',
    borderRadius: theme.borderRadius.sm,
  },
  saveBtnTxt: { color: theme.primary, fontSize: 15, fontWeight: '800' },
  hint: { color: theme.textMuted, fontSize: 12, textAlign: 'center', fontStyle: 'italic' },

  // Error banner
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(232,93,117,0.12)',
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(232,93,117,0.25)',
    padding: 10,
    marginTop: 12,
  },
  errorBannerText: {
    flex: 1,
    color: '#E85D75',
    fontSize: 13,
    lineHeight: 18,
  },

  // Graphs
  rangeRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  rangeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'transparent',
  },
  rangeBtnOn: {
    backgroundColor: 'transparent',
    borderColor: theme.primary,
  },
  rangeTxt: { color: theme.textMuted, fontSize: 12, fontWeight: '700' },
  rangeTxtOn: { color: theme.primary },

  emptyState: { alignItems: 'center', paddingVertical: 20 },

  dateRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  dateTxt: { color: theme.textMuted, fontSize: 11 },

  avgsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  avgBadge: { alignItems: 'center' },
  avgValue: { fontSize: 16, fontWeight: '800' },
  avgLabel: { color: theme.textMuted, fontSize: 11, marginTop: 2 },

  graphLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2, marginTop: 8 },
  graphDot: { width: 8, height: 8, borderRadius: 4 },
  graphLabelTxt: { color: theme.textSecondary, fontSize: 13, fontWeight: '700' },

  tagStatRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 5 },
  tagStatLabel: { color: theme.textSecondary, fontSize: 13, width: 130 },
  tagStatBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  tagStatFill: { height: '100%', borderRadius: 2, backgroundColor: theme.primary },
  tagStatCount: { color: theme.textMuted, fontSize: 12, width: 28, textAlign: 'right' },

  // Time-of-day insights
  todBucketRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 8,
  },
  todBucket: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 4,
    gap: 3,
  },
  todBucketLabel: { color: theme.textSecondary, fontSize: 10, fontWeight: '600' },
  todBucketVal: { fontSize: 12, fontWeight: '700' },
  todBucketCount: { color: theme.textMuted, fontSize: 9 },
  todLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    marginBottom: 8,
  },
  todLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  todLegendDot: { width: 8, height: 8, borderRadius: 4 },
  todLegendTxt: { color: theme.textMuted, fontSize: 10 },
  todInsightList: { gap: 6, marginTop: 4 },
  todInsightRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  todInsightEmoji: { fontSize: 14, marginTop: 1 },
  todInsightText: { color: theme.textSecondary, fontSize: 13, flex: 1, lineHeight: 18 },

  // Pulse monitor
  pulseSection: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 10,
  },
  pulseLabel: {
    color: theme.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  pulseHint: {
    color: theme.textMuted,
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
  },

  // Biometric scatter
  scatterSection: {
    marginTop: 4,
    alignItems: 'center',
    gap: 8,
  },
  scatterTitle: {
    color: theme.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  scatterHint: {
    color: theme.textMuted,
    fontSize: 11,
    textAlign: 'center',
    maxWidth: 260,
  },

  // Energy link
  linkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  linkLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, marginRight: 16 },
  linkTitle: { color: theme.textPrimary, fontSize: 15, fontWeight: '700' },
  linkSub: { color: theme.textMuted, fontSize: 12, marginTop: 1 },

  footer: { paddingVertical: theme.spacing.xl, alignItems: 'center' },
  footerTxt: {
    color: theme.textMuted,
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    maxWidth: 280,
  },
});
