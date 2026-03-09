// File: app/(tabs)/checkin.tsx
// MySky — Check-In: The Universal Input Portal
//
// Unified logging experience combining Morning Rest (sleep/dreams) and
// Internal Weather (mood/energy/tension) into a single, ritualistic flow.
//
// Flow:
//   1. Pathway selection — "What are we reflecting on?"
//   2. Guided input sequence (Path A: Rest, Path B: Weather)
//   3. "Hold to Sync" confirmation via SkiaPulseMonitor
//   4. Return to previous tab — user lands right where they were

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from '../../components/ui/SkiaGradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp, FadeOut } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter, Href } from 'expo-router';
import { useFocusEffect } from '@react-navigation/core';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { theme } from '../../constants/theme';
import { SkiaDynamicCosmos } from '../../components/ui/SkiaDynamicCosmos';
import SkiaPulseMonitor from '../../components/ui/SkiaPulseMonitor';
import SkiaResonanceSlider from '../../components/ui/SkiaResonanceSlider';
import SkiaMoonDragger from '../../components/ui/SkiaMoonDragger';
import { localDb } from '../../services/storage/localDb';
import { AstrologyCalculator } from '../../services/astrology/calculator';
import { NatalChart } from '../../services/astrology/types';
import { CheckInService, CheckInInput, TIME_OF_DAY_LABELS } from '../../services/patterns/checkInService';
import { ThemeTag, EnergyLevel, StressLevel, TimeOfDay } from '../../services/patterns/types';
import { SleepEntry, generateId } from '../../services/storage/models';
import { usePremium } from '../../context/PremiumContext';
import { logger } from '../../utils/logger';
import { toLocalDateString } from '../../utils/dateUtils';

const { width: SCREEN_W } = Dimensions.get('window');

// ── Palette ──
const PALETTE = {
  gold: '#C9AE78',
  sage: 'rgba(110, 191, 139, 1)',
  sageSoft: 'rgba(110, 191, 139, 0.15)',
  sageBorder: 'rgba(110, 191, 139, 0.35)',
  sageGlow: 'rgba(110, 191, 139, 0.25)',
  silverBlue: '#8BC4E8',
  copper: '#CD7F5D',
  textMain: '#FFFFFF',
  textSoft: 'rgba(255,255,255,0.75)',
  textMuted: 'rgba(255,255,255,0.45)',
  glassBg: 'rgba(14, 24, 48, 0.50)',
  glassBorder: 'rgba(255,255,255,0.06)',
  glassHighlight: 'rgba(255,255,255,0.12)',
};

const MOOD_COLOR  = '#C9AE78';
const ENERGY_COLOR = '#6fb3d3';
const STRESS_COLOR = '#e07b7b';

// ── Types ──
type CheckInPath = 'select' | 'rest' | 'weather';
type RestStep = 'duration' | 'quality' | 'dream' | 'sync';
type WeatherStep = 'sliders' | 'context' | 'sync';

// ── Influence tags ──
const INFLUENCE_TAGS: ThemeTag[] = [
  'sleep', 'work', 'social', 'relationships', 'conflict', 'health',
  'movement', 'nature', 'alone_time', 'finances',
  'weather', 'food', 'screens', 'kids', 'productivity', 'substances', 'intimacy',
];

const INFLUENCE_LABELS: Record<string, string> = {
  sleep: 'Sleep', work: 'Work', social: 'Social',
  relationships: 'Relationships', conflict: 'Conflict', health: 'Health',
  movement: 'Movement', nature: 'Nature', alone_time: 'Alone time',
  finances: 'Finances', weather: 'Weather', food: 'Food',
  screens: 'Screens', kids: 'Kids', productivity: 'Productivity',
  substances: 'Substances', intimacy: 'Intimacy',
};

const INFLUENCE_ICONS: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  sleep: 'moon-outline', work: 'briefcase-outline', social: 'people-outline',
  relationships: 'heart-outline', conflict: 'flash-outline', health: 'medkit-outline',
  movement: 'walk-outline', nature: 'leaf-outline', alone_time: 'body-outline',
  finances: 'wallet-outline', weather: 'partly-sunny-outline', food: 'restaurant-outline',
  screens: 'phone-portrait-outline', kids: 'happy-outline', productivity: 'checkmark-done-outline',
  substances: 'wine-outline', intimacy: 'flame-outline',
};

// ── Helpers ──
function sliderToLevel(v: number): 'low' | 'medium' | 'high' {
  if (v <= 3) return 'low';
  if (v <= 7) return 'medium';
  return 'high';
}

// ── Main Screen ────────────────────────────────────────────────────────────

export default function CheckInScreen() {
  const router = useRouter();
  const { isPremium } = usePremium();

  // Data state
  const [chartId, setChartId] = useState('');
  const [userChart, setUserChart] = useState<NatalChart | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Navigation state
  const [path, setPath] = useState<CheckInPath>('select');
  const [restStep, setRestStep] = useState<RestStep>('duration');
  const [weatherStep, setWeatherStep] = useState<WeatherStep>('sliders');

  // ── Weather form (Internal Weather) ──
  const [moodSlider, setMoodSlider] = useState(5);
  const [energySlider, setEnergySlider] = useState(5);
  const [stressSlider, setStressSlider] = useState(5);
  const [selectedTags, setSelectedTags] = useState<ThemeTag[]>([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeOfDay>(CheckInService.getCurrentTimeSlot());

  // ── Rest form (Morning Rest) ──
  const [sleepDuration, setSleepDuration] = useState(7.5);
  const [sleepQuality, setSleepQuality] = useState(0);
  const [dreamText, setDreamText] = useState('');

  // Reset flow state when entering the tab
  useFocusEffect(
    useCallback(() => {
      setPath('select');
      setRestStep('duration');
      setWeatherStep('sliders');
      // Reset forms
      setMoodSlider(5);
      setEnergySlider(5);
      setStressSlider(5);
      setSelectedTags([]);
      setSelectedTimeSlot(CheckInService.getCurrentTimeSlot());
      setSleepDuration(7.5);
      setSleepQuality(0);
      setDreamText('');
      setSaving(false);

      // Load chart
      (async () => {
        try {
          setLoading(true);
          const charts = await localDb.getCharts();
          if (!charts?.length) {
            router.replace('/(tabs)/home' as Href); // no chart yet
            return;
          }
          const saved = charts[0];
          setChartId(saved.id);
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
        } catch (e) {
          logger.error('[CheckIn] load failed:', e);
        } finally {
          setLoading(false);
        }
      })();
    }, [])
  );

  // ── Weather Save ──────────────────────────────────────────────────────────

  const handleWeatherSave = useCallback(async () => {
    if (!userChart || !chartId || saving) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setSaving(true);

    try {
      const input: CheckInInput = {
        moodScore: moodSlider,
        energyLevel: sliderToLevel(energySlider) as EnergyLevel,
        stressLevel: sliderToLevel(stressSlider) as StressLevel,
        tags: selectedTags,
        timeOfDay: selectedTimeSlot,
      };

      await CheckInService.saveCheckIn(input, userChart, chartId);

      const todayStr = toLocalDateString(new Date());
      await AsyncStorage.setItem(
        `exact_${todayStr}_${selectedTimeSlot}`,
        JSON.stringify({ energy: energySlider, stress: stressSlider }),
      );

      // Return user to wherever they were
      if (router.canGoBack()) router.back();
      else router.replace('/(tabs)/home' as Href);
    } catch (e) {
      logger.error('[CheckIn] weather save failed:', e);
      Alert.alert('Save Error', 'Could not save check-in. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [userChart, chartId, moodSlider, energySlider, stressSlider, selectedTags, selectedTimeSlot, saving, router]);

  // ── Rest Save ─────────────────────────────────────────────────────────────

  const handleRestSave = useCallback(async () => {
    if (!chartId || saving) return;
    const canSave = sleepQuality > 0 || sleepDuration !== 7.5 || dreamText.trim().length > 0;
    if (!canSave) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setSaving(true);

    try {
      // Logical "today": reset for next day at 6 AM
      const now = new Date();
      if (now.getHours() < 6) now.setDate(now.getDate() - 1);
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const today = `${year}-${month}-${day}`;

      const entry: SleepEntry = {
        id: generateId(),
        chartId,
        date: today,
        durationHours: sleepDuration,
        quality: sleepQuality > 0 ? sleepQuality : undefined,
        dreamText: dreamText.trim() || undefined,
        dreamMood: undefined,
        dreamFeelings: undefined,
        dreamMetadata: undefined,
        notes: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDeleted: false,
      };

      await localDb.saveSleepEntry(entry);

      // Return user to wherever they were
      if (router.canGoBack()) router.back();
      else router.replace('/(tabs)/home' as Href);
    } catch (e) {
      logger.error('[CheckIn] rest save failed:', e);
      Alert.alert('Save Error', 'Could not save sleep entry. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [chartId, sleepDuration, sleepQuality, dreamText, saving, router]);

  // ── Path selection handlers ──────────────────────────────────────────────

  const selectPath = useCallback((p: CheckInPath) => {
    Haptics.selectionAsync().catch(() => {});
    setPath(p);
  }, []);

  const goBack = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    if (path === 'rest') {
      if (restStep === 'duration') setPath('select');
      else if (restStep === 'quality') setRestStep('duration');
      else if (restStep === 'dream') setRestStep('quality');
      else if (restStep === 'sync') setRestStep('dream');
    } else if (path === 'weather') {
      if (weatherStep === 'sliders') setPath('select');
      else if (weatherStep === 'context') setWeatherStep('sliders');
      else if (weatherStep === 'sync') setWeatherStep('context');
    }
  }, [path, restStep, weatherStep]);

  const advanceRest = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    if (restStep === 'duration') setRestStep('quality');
    else if (restStep === 'quality') setRestStep('dream');
    else if (restStep === 'dream') setRestStep('sync');
  }, [restStep]);

  const advanceWeather = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    if (weatherStep === 'sliders') setWeatherStep('context');
    else if (weatherStep === 'context') setWeatherStep('sync');
  }, [weatherStep]);

  const toggleTag = useCallback((tag: ThemeTag) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) return prev.filter(t => t !== tag);
      if (prev.length >= 3) return prev;
      return [...prev, tag];
    });
  }, []);

  // ── Loading ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.container}>
        <SkiaDynamicCosmos />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.centered}>
            <Text style={styles.loadingText}>Preparing your space…</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ── Render: Pathway Selection ────────────────────────────────────────────

  if (path === 'select') {
    return (
      <View style={styles.container}>
        <SkiaDynamicCosmos />
        <SafeAreaView style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.selectContent} showsVerticalScrollIndicator={false}>
            <Animated.View entering={FadeInDown.duration(500)}>
              <Text style={styles.selectQuestion}>What are we reflecting on?</Text>
              <Text style={styles.selectSubtext}>Choose your path for this moment</Text>
            </Animated.View>

            {/* Path A: Morning Rest */}
            <Animated.View entering={FadeInDown.delay(150).duration(500)}>
              <Pressable
                style={({ pressed }) => [styles.pathCard, pressed && styles.pathCardPressed]}
                onPress={() => selectPath('rest')}
                accessibilityRole="button"
                accessibilityLabel="Morning Rest: Sleep quality and dream journal"
              >
                <LinearGradient
                  colors={['rgba(14, 24, 48, 0.60)', 'rgba(10, 18, 36, 0.45)']}
                  style={styles.pathCardInner}
                >
                  <View style={styles.pathIconRow}>
                    <View style={styles.pathIconContainer}>
                      <Ionicons name="moon" size={28} color={PALETTE.silverBlue} />
                    </View>
                    <View style={styles.pathTextCol}>
                      <Text style={styles.pathTitle}>Morning Rest</Text>
                      <Text style={styles.pathSubtext}>Sleep quality & dream journal</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={PALETTE.textMuted} />
                  </View>
                </LinearGradient>
              </Pressable>
            </Animated.View>

            {/* Path B: Internal Weather */}
            <Animated.View entering={FadeInDown.delay(300).duration(500)}>
              <Pressable
                style={({ pressed }) => [styles.pathCard, pressed && styles.pathCardPressed]}
                onPress={() => selectPath('weather')}
                accessibilityRole="button"
                accessibilityLabel="Internal Weather: Mood, energy, and tension"
              >
                <LinearGradient
                  colors={['rgba(14, 24, 48, 0.60)', 'rgba(10, 18, 36, 0.45)']}
                  style={styles.pathCardInner}
                >
                  <View style={styles.pathIconRow}>
                    <View style={styles.pathIconContainer}>
                      <Ionicons name="cloudy" size={28} color={PALETTE.gold} />
                    </View>
                    <View style={styles.pathTextCol}>
                      <Text style={styles.pathTitle}>Internal Weather</Text>
                      <Text style={styles.pathSubtext}>Mood, energy & tension</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={PALETTE.textMuted} />
                  </View>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // ── Render: Morning Rest Flow ────────────────────────────────────────────

  if (path === 'rest') {
    return (
      <View style={styles.container}>
        <SkiaDynamicCosmos />
        <SafeAreaView style={styles.safeArea}>
          {/* Back button */}
          <Pressable style={styles.backButton} onPress={goBack} accessibilityRole="button" accessibilityLabel="Go back">
            <Ionicons name="chevron-back" size={24} color={PALETTE.textSoft} />
          </Pressable>

          <ScrollView contentContainerStyle={styles.flowContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Step indicator */}
            <View style={styles.stepRow}>
              {(['duration', 'quality', 'dream', 'sync'] as RestStep[]).map((s, i) => (
                <View
                  key={s}
                  style={[
                    styles.stepDot,
                    restStep === s && styles.stepDotActive,
                    (['duration', 'quality', 'dream', 'sync'] as RestStep[]).indexOf(restStep) > i && styles.stepDotDone,
                  ]}
                />
              ))}
            </View>

            {/* Step: Duration */}
            {restStep === 'duration' && (
              <Animated.View entering={FadeInDown.duration(400)} style={styles.stepContainer}>
                <Text style={styles.stepTitle}>How long did you sleep?</Text>
                <Text style={styles.stepSubtext}>Adjust to your best estimate</Text>

                <View style={styles.durationDisplay}>
                  <Text style={styles.durationValue}>{sleepDuration.toFixed(1)}</Text>
                  <Text style={styles.durationUnit}>hours</Text>
                </View>

                {/* Simple increment/decrement controls */}
                <View style={styles.durationControls}>
                  <Pressable
                    style={styles.durationBtn}
                    onPress={() => setSleepDuration(prev => Math.max(0, prev - 0.5))}
                    accessibilityRole="button"
                    accessibilityLabel="Decrease sleep duration"
                  >
                    <Ionicons name="remove" size={24} color={PALETTE.textMain} />
                  </Pressable>
                  <View style={styles.durationTrack}>
                    <View style={[styles.durationFill, { width: `${Math.min(100, (sleepDuration / 12) * 100)}%` }]} />
                  </View>
                  <Pressable
                    style={styles.durationBtn}
                    onPress={() => setSleepDuration(prev => Math.min(12, prev + 0.5))}
                    accessibilityRole="button"
                    accessibilityLabel="Increase sleep duration"
                  >
                    <Ionicons name="add" size={24} color={PALETTE.textMain} />
                  </Pressable>
                </View>

                <Pressable style={styles.nextBtn} onPress={advanceRest} accessibilityRole="button">
                  <Text style={styles.nextBtnText}>Next</Text>
                  <Ionicons name="chevron-forward" size={18} color={PALETTE.textMain} />
                </Pressable>
              </Animated.View>
            )}

            {/* Step: Quality */}
            {restStep === 'quality' && (
              <Animated.View entering={FadeInDown.duration(400)} style={styles.stepContainer}>
                <Text style={styles.stepTitle}>How rested do you feel?</Text>
                <Text style={styles.stepSubtext}>Tap a moon to rate your rest</Text>

                <View style={styles.moonRow}>
                  <SkiaMoonDragger
                    value={sleepQuality}
                    onChange={setSleepQuality}
                  />
                </View>

                <Pressable style={styles.nextBtn} onPress={advanceRest} accessibilityRole="button">
                  <Text style={styles.nextBtnText}>Next</Text>
                  <Ionicons name="chevron-forward" size={18} color={PALETTE.textMain} />
                </Pressable>
              </Animated.View>
            )}

            {/* Step: Dream Journal */}
            {restStep === 'dream' && (
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <Animated.View entering={FadeInDown.duration(400)} style={styles.stepContainer}>
                  <Text style={styles.stepTitle}>Any dreams to capture?</Text>
                  <Text style={styles.stepSubtext}>Record fragments before they fade</Text>

                  <TextInput
                    style={styles.dreamInput}
                    placeholder="Describe what you remember…"
                    placeholderTextColor={PALETTE.textMuted}
                    value={dreamText}
                    onChangeText={setDreamText}
                    multiline
                    textAlignVertical="top"
                    maxLength={2000}
                    accessibilityLabel="Dream journal text input"
                  />

                  <Text style={styles.charCount}>{dreamText.length}/2000</Text>

                  <Pressable style={styles.nextBtn} onPress={advanceRest} accessibilityRole="button">
                    <Text style={styles.nextBtnText}>{dreamText.trim() ? 'Next' : 'Skip'}</Text>
                    <Ionicons name="chevron-forward" size={18} color={PALETTE.textMain} />
                  </Pressable>
                </Animated.View>
              </TouchableWithoutFeedback>
            )}

            {/* Step: Hold to Sync */}
            {restStep === 'sync' && (
              <Animated.View entering={FadeInDown.duration(400)} style={styles.syncContainer}>
                <Text style={styles.syncLabel}>Hold to seal your rest data softly 🌙</Text>
                <Text style={styles.syncHint}>Hold to seal and confirm</Text>
                <SkiaPulseMonitor onSyncComplete={handleRestSave} />
              </Animated.View>
            )}
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // ── Render: Internal Weather Flow ────────────────────────────────────────

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />
      <SafeAreaView style={styles.safeArea}>
        {/* Back button */}
        <Pressable style={styles.backButton} onPress={goBack} accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={24} color={PALETTE.textSoft} />
        </Pressable>

        <ScrollView contentContainerStyle={styles.flowContent} showsVerticalScrollIndicator={false}>
          {/* Step indicator */}
          <View style={styles.stepRow}>
            {(['sliders', 'context', 'sync'] as WeatherStep[]).map((s, i) => (
              <View
                key={s}
                style={[
                  styles.stepDot,
                  weatherStep === s && styles.stepDotActive,
                  (['sliders', 'context', 'sync'] as WeatherStep[]).indexOf(weatherStep) > i && styles.stepDotDone,
                ]}
              />
            ))}
          </View>

          {/* Step: Sliders */}
          {weatherStep === 'sliders' && (
            <Animated.View entering={FadeInDown.duration(400)} style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Your internal weather</Text>
              <Text style={styles.stepSubtext}>
                {TIME_OF_DAY_LABELS[selectedTimeSlot].emoji} {TIME_OF_DAY_LABELS[selectedTimeSlot].label} check-in
              </Text>

              <View style={styles.sliderGroup}>
                <SkiaResonanceSlider
                  question="How are you feeling emotionally?"
                  value={moodSlider}
                  onChange={setMoodSlider}
                  color={MOOD_COLOR}
                  anchors={['Very low', 'Neutral', 'Excellent']}
                  min={1}
                  max={9}
                />
                <SkiaResonanceSlider
                  question="How is your energy right now?"
                  value={energySlider}
                  onChange={setEnergySlider}
                  color={ENERGY_COLOR}
                  anchors={['Exhausted', 'Steady', 'Energized']}
                  min={1}
                  max={9}
                />
                <SkiaResonanceSlider
                  question="How activated or stressed do you feel?"
                  value={stressSlider}
                  onChange={setStressSlider}
                  color={STRESS_COLOR}
                  anchors={['Calm', 'Alert', 'Overwhelmed']}
                  min={1}
                  max={9}
                />
              </View>

              <Pressable style={styles.nextBtn} onPress={advanceWeather} accessibilityRole="button">
                <Text style={styles.nextBtnText}>Next</Text>
                <Ionicons name="chevron-forward" size={18} color={PALETTE.textMain} />
              </Pressable>
            </Animated.View>
          )}

          {/* Step: Context tags */}
          {weatherStep === 'context' && (
            <Animated.View entering={FadeInDown.duration(400)} style={styles.stepContainer}>
              <Text style={styles.stepTitle}>What shaped your day?</Text>
              <Text style={styles.stepSubtext}>Select up to 3 influences</Text>

              <View style={styles.tagGrid}>
                {INFLUENCE_TAGS.map(tag => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <Pressable
                      key={tag}
                      style={[styles.tagPill, isSelected && styles.tagPillSelected]}
                      onPress={() => toggleTag(tag)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons
                          name={INFLUENCE_ICONS[tag] ?? 'ellipse-outline'}
                          size={14}
                          color={isSelected ? PALETTE.sage : PALETTE.textSoft}
                        />
                        <Text style={[styles.tagText, isSelected && styles.tagTextSelected]}>
                          {INFLUENCE_LABELS[tag] ?? tag}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              <Pressable style={styles.nextBtn} onPress={advanceWeather} accessibilityRole="button">
                <Text style={styles.nextBtnText}>Next</Text>
                <Ionicons name="chevron-forward" size={18} color={PALETTE.textMain} />
              </Pressable>
            </Animated.View>
          )}

          {/* Step: Hold to Sync */}
          {weatherStep === 'sync' && (
            <Animated.View entering={FadeInDown.duration(400)} style={styles.syncContainer}>
              <Text style={styles.syncLabel}>Hold to sync your internal weather ✨</Text>
              <Text style={styles.syncHint}>Hold to seal and confirm</Text>
              <SkiaPulseMonitor onSyncComplete={handleWeatherSave} />
            </Animated.View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020817' },
  safeArea: { flex: 1 },

  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: PALETTE.textMuted, fontSize: 15, fontWeight: '500' },

  // ── Pathway Selection ──
  selectContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  selectQuestion: {
    color: PALETTE.textMain,
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  selectSubtext: {
    color: PALETTE.textSoft,
    fontSize: 15,
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 40,
  },
  pathCard: { marginBottom: 16, borderRadius: 16, overflow: 'hidden' },
  pathCardPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  pathCardInner: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
  },
  pathIconRow: { flexDirection: 'row', alignItems: 'center' },
  pathIconContainer: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 16,
  },
  pathTextCol: { flex: 1 },
  pathTitle: { color: PALETTE.textMain, fontSize: 18, fontWeight: '700', marginBottom: 4 },
  pathSubtext: { color: PALETTE.textSoft, fontSize: 14, fontWeight: '400' },

  // ── Flow shared ──
  backButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignSelf: 'flex-start',
  },
  flowContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  stepRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
    gap: 8,
  },
  stepDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  stepDotActive: { backgroundColor: PALETTE.sage, width: 24 },
  stepDotDone: { backgroundColor: 'rgba(110, 191, 139, 0.45)' },

  stepContainer: { gap: 16 },
  stepTitle: {
    color: PALETTE.textMain,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  stepSubtext: {
    color: PALETTE.textSoft,
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 8,
  },

  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 28,
    backgroundColor: 'rgba(110, 191, 139, 0.18)',
    borderWidth: 1,
    borderColor: PALETTE.sageBorder,
    marginTop: 24,
    gap: 6,
  },
  nextBtnText: {
    color: PALETTE.textMain,
    fontSize: 16,
    fontWeight: '600',
  },

  // ── Duration step ──
  durationDisplay: {
    alignItems: 'center',
    marginVertical: 24,
  },
  durationValue: {
    color: PALETTE.silverBlue,
    fontSize: 56,
    fontWeight: '200',
    fontVariant: ['tabular-nums'],
  },
  durationUnit: {
    color: PALETTE.textMuted,
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  durationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 16,
  },
  durationBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  durationTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  durationFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: PALETTE.silverBlue,
  },

  // ── Quality step ──
  moonRow: {
    alignItems: 'center',
    marginVertical: 16,
  },

  // ── Dream step ──
  dreamInput: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
    color: PALETTE.textMain,
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 140,
    textAlignVertical: 'top',
  },
  charCount: {
    color: PALETTE.textMuted,
    fontSize: 12,
    textAlign: 'right',
  },

  // ── Sync step ──
  syncContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },
  syncLabel: {
    color: PALETTE.textMain,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  syncHint: {
    color: PALETTE.textMuted,
    fontSize: 13,
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 16,
  },

  // ── Sliders ──
  sliderGroup: { gap: 8 },

  // ── Tags ──
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  tagPill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  tagPillSelected: {
    backgroundColor: PALETTE.sageSoft,
    borderColor: PALETTE.sageBorder,
  },
  tagText: {
    color: PALETTE.textSoft,
    fontSize: 13,
    fontWeight: '500',
  },
  tagTextSelected: {
    color: PALETTE.sage,
    fontWeight: '600',
  },
});
