// File: app/(tabs)/checkin.tsx
// MySky — The Ritual: Observatory Input Portal
//
// The bridge where the user's raw reality enters the Observatory.
// A frosted-glass bottom sheet slides up over the cosmos, presenting
// three pathways as Skia-drawn symbols. The "Hold to Seal" ring anchors
// data with a gold SweepGradient and haptic heartbeat.
//
// Visual Architecture:
//   - Full-screen SkiaDynamicCosmos background (stars visible through glass)
//   - BlurView over upper 30% to simulate the "blurred Today" effect
//   - Frosted glass panel occupies lower 70%, springs in on mount
//   - RitualSelectorIcons: Sun (Weather) · Moon (Rest) · Pen (Journal)
//   - SkiaHoldRing: gold sweep ring with DashPathEffect progress
//   - RitualCompletionOverlay: star burst + delta insight

import React, { useState, useCallback } from 'react';
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
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter, Href } from 'expo-router';
import { useFocusEffect } from '@react-navigation/core';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { getTagColor } from '../../constants/tagColors';
import { SkiaDynamicCosmos } from '../../components/ui/SkiaDynamicCosmos';
import SkiaHoldRing from '../../components/ui/SkiaHoldRing';
import SkiaResonanceSlider from '../../components/ui/SkiaResonanceSlider';
import SkiaMoonDragger from '../../components/ui/SkiaMoonDragger';
import RitualSelectorIcons, { RitualType } from '../../components/ui/RitualSelectorIcons';
import RitualCompletionOverlay from '../../components/ui/RitualCompletionOverlay';
import { localDb } from '../../services/storage/localDb';
import { AstrologyCalculator } from '../../services/astrology/calculator';
import { NatalChart } from '../../services/astrology/types';
import { CheckInService, CheckInInput, TIME_OF_DAY_LABELS } from '../../services/patterns/checkInService';
import { generateDailySynthesis } from '../../services/today/dailySynthesis';
import { ThemeTag, EnergyLevel, StressLevel, TimeOfDay } from '../../services/patterns/types';
import { SleepEntry, generateId } from '../../services/storage/models';
import { usePremium } from '../../context/PremiumContext';
import { logger } from '../../utils/logger';
import { toLocalDateString } from '../../utils/dateUtils';

const { height: SCREEN_H } = Dimensions.get('window');

// ── Palette ──
const PALETTE = {
  gold: '#D4AF37',
  goldLight: '#EBC07D',
  cyan: '#7DEBDB',
  lavender: '#A286F2',
  sage: 'rgba(110, 191, 139, 1)',
  sageSoft: 'rgba(110, 191, 139, 0.15)',
  sageBorder: 'rgba(110, 191, 139, 0.35)',
  silverBlue: '#8BC4E8',
  textMain: '#FFFFFF',
  textSoft: 'rgba(255,255,255,0.75)',
  textMuted: 'rgba(255,255,255,0.45)',
  glassBg: 'rgba(8, 14, 36, 0.78)',
  glassBorder: 'rgba(255,255,255,0.06)',
  glassHighlight: 'rgba(255,255,255,0.10)',
};

const MOOD_COLOR   = '#D4AF37';
const ENERGY_COLOR = '#7DEBDB';
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
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [completionInsight, setCompletionInsight] = useState('');
  const [completionType, setCompletionType] = useState<'weather' | 'rest'>('weather');
  const [previousMood, setPreviousMood] = useState(5);
  const [currentMood, setCurrentMood] = useState(5);

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

  // ── Bottom sheet spring animation ──
  const panelTranslateY = useSharedValue(SCREEN_H);
  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: panelTranslateY.value }],
  }));

  // Animate panel in when screen gains focus
  const springPanel = useCallback(() => {
    panelTranslateY.value = withSpring(0, { damping: 26, stiffness: 220, mass: 1 });
  }, [panelTranslateY]);

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

      // Spring panel in
      springPanel();

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
          setUserName(saved.name ?? '');
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

          // Load previous mood for delta calculation
          try {
            const recentCheckIns = await localDb.getCheckIns(saved.id, 2);
            if (recentCheckIns.length >= 1) {
              const prev = recentCheckIns[0].moodScore ?? 5;
              setPreviousMood(prev);
            }
          } catch {
            // Ignore — delta will default to zero
          }
        } catch (e) {
          logger.error('[CheckIn] load failed:', e);
        } finally {
          setLoading(false);
        }
      })();
    }, [springPanel])
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

      setCurrentMood(moodSlider);
      setCompletionType('weather');
      try {
        const synth = await generateDailySynthesis(userChart, chartId);
        setCompletionInsight(synth.weatherMicroInsight);
      } catch {
        setCompletionInsight('');
      }
      setShowCompletion(true);
    } catch (e) {
      logger.error('[CheckIn] weather save failed:', e);
      Alert.alert('Save Error', 'Could not save check-in. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [userChart, chartId, moodSlider, energySlider, stressSlider, selectedTags, selectedTimeSlot, saving]);

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

      setCompletionType('rest');
      try {
        if (userChart) {
          const synth = await generateDailySynthesis(userChart, chartId);
          setCompletionInsight(synth.restMicroInsight);
        } else {
          setCompletionInsight('');
        }
      } catch {
        setCompletionInsight('');
      }
      setShowCompletion(true);
    } catch (e) {
      logger.error('[CheckIn] rest save failed:', e);
      Alert.alert('Save Error', 'Could not save sleep entry. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [chartId, sleepDuration, sleepQuality, dreamText, saving, userChart]);

  const handleCompletionDone = useCallback(() => {
    setShowCompletion(false);
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/home' as Href);
  }, [router]);

  // ── Path selection handlers ──────────────────────────────────────────────

  const handleRitualSelect = useCallback((type: RitualType) => {
    Haptics.selectionAsync().catch(() => {});
    if (type === 'journal') {
      router.push('/(tabs)/journal' as Href);
      return;
    }
    setPath(type === 'weather' ? 'weather' : 'rest');
    setWeatherStep('sliders');
    setRestStep('duration');
  }, [router]);

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
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Preparing your space…</Text>
        </View>
      </View>
    );
  }

  // ── The selected ritual type for the selector (null = none chosen yet) ──
  const ritualSelected: RitualType | null =
    path === 'weather' ? 'weather' : path === 'rest' ? 'rest' : null;

  // ── Tension → cosmos twinkle speed (1.0 calm → 2.1 high tension) ──
  const cosmosSpeedMultiplier =
    stressSlider >= 7 ? 2.1 : stressSlider >= 4 ? 1.5 : 1.0;

  // ── Shared panel wrapper used for all views ──────────────────────────────
  //    Top 30%: blurred cosmos  |  Bottom 70%: frosted glass with content
  const renderPanel = (content: React.ReactNode) => (
    <View style={styles.container}>
      <SkiaDynamicCosmos twinkleSpeedMultiplier={cosmosSpeedMultiplier} />

      {/* Blur layer over upper area — simulates the "blurred Today" effect */}
      <BlurView intensity={18} tint="dark" style={styles.blurTop} pointerEvents="none" />

      {/* Frosted glass bottom sheet */}
      <Animated.View style={[styles.glassPanel, panelStyle]}>
        <View style={styles.panelHandle} />
        {content}
      </Animated.View>

      {/* Completion overlay */}
      <RitualCompletionOverlay
        visible={showCompletion}
        onDone={handleCompletionDone}
        microInsight={completionInsight}
        checkInType={completionType}
        userName={userName}
        currentMood={currentMood}
        previousMood={previousMood}
      />
    </View>
  );

  // ── Render: Pathway Selection ────────────────────────────────────────────

  if (path === 'select') {
    return renderPanel(
      <ScrollView
        contentContainerStyle={styles.selectContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(500)}>
          <Text style={styles.selectQuestion}>The Ritual</Text>
          <Text style={styles.selectSubtext}>What are we anchoring today?</Text>
        </Animated.View>

        {/* Skia ritual selector icons */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={{ marginTop: 28 }}>
          <RitualSelectorIcons
            selected={ritualSelected}
            onSelect={handleRitualSelect}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.selectHintRow}>
          <Text style={styles.selectHint}>Tap a symbol to begin</Text>
        </Animated.View>
      </ScrollView>
    );
  }

  // ── Render: Morning Rest Flow ────────────────────────────────────────────

  if (path === 'rest') {
    return renderPanel(
      <>
        {/* Back + step dots */}
        <View style={styles.panelTopRow}>
          <Pressable style={styles.backButton} onPress={goBack} accessibilityRole="button" accessibilityLabel="Go back">
            <Ionicons name="chevron-back" size={22} color={PALETTE.textSoft} />
          </Pressable>
          <View style={styles.stepRow}>
            {(['duration', 'quality', 'dream', 'sync'] as RestStep[]).map((s, i) => {
              const steps: RestStep[] = ['duration', 'quality', 'dream', 'sync'];
              return (
                <View
                  key={s}
                  style={[
                    styles.stepDot,
                    restStep === s && styles.stepDotActive,
                    steps.indexOf(restStep) > i && styles.stepDotDone,
                  ]}
                />
              );
            })}
          </View>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.flowContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Step: Duration */}
          {restStep === 'duration' && (
            <Animated.View entering={FadeInDown.duration(400)} style={styles.stepContainer}>
              <Text style={styles.stepTitle}>How long did you sleep?</Text>
              <Text style={styles.stepSubtext}>Adjust to your best estimate</Text>

              <View style={styles.durationDisplay}>
                <Text style={styles.durationValue}>{sleepDuration.toFixed(1)}</Text>
                <Text style={styles.durationUnit}>hours</Text>
              </View>

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
              <Text style={styles.stepSubtext}>Drag the moon to set your rest quality</Text>

              <View style={styles.moonRow}>
                <SkiaMoonDragger value={sleepQuality} onChange={setSleepQuality} />
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

                {/* Gold serif border dream input */}
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

          {/* Step: Hold to Seal */}
          {restStep === 'sync' && (
            <Animated.View entering={FadeInDown.duration(400)} style={styles.syncContainer}>
              <Text style={styles.syncLabel}>Anchor your rest data</Text>
              <Text style={styles.syncHint}>Hold the ring for 2.5 seconds to seal</Text>
              <SkiaHoldRing onSyncComplete={handleRestSave} />
            </Animated.View>
          )}
        </ScrollView>
      </>
    );
  }

  // ── Render: Internal Weather Flow ────────────────────────────────────────

  return renderPanel(
    <>
      {/* Back + step dots */}
      <View style={styles.panelTopRow}>
        <Pressable style={styles.backButton} onPress={goBack} accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={22} color={PALETTE.textSoft} />
        </Pressable>
        <View style={styles.stepRow}>
          {(['sliders', 'context', 'sync'] as WeatherStep[]).map((s, i) => {
            const steps: WeatherStep[] = ['sliders', 'context', 'sync'];
            return (
              <View
                key={s}
                style={[
                  styles.stepDot,
                  weatherStep === s && styles.stepDotActiveCyan,
                  steps.indexOf(weatherStep) > i && styles.stepDotDoneCyan,
                ]}
              />
            );
          })}
        </View>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.flowContent} showsVerticalScrollIndicator={false}>
        {/* ── Sliders ── */}
        {weatherStep === 'sliders' && (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Internal Weather</Text>
            <Text style={styles.stepSubtext}>
              {TIME_OF_DAY_LABELS[selectedTimeSlot].emoji}{' '}
              {TIME_OF_DAY_LABELS[selectedTimeSlot].label} check-in
            </Text>

            <View style={styles.sliderGroup}>
              <SkiaResonanceSlider
                question="Internal Climate"
                value={moodSlider}
                onChange={setMoodSlider}
                color={MOOD_COLOR}
                anchors={['Depleted', 'Balanced', 'Expansive']}
                min={1}
                max={9}
              />
              <SkiaResonanceSlider
                question="Vitality Pulse"
                value={energySlider}
                onChange={setEnergySlider}
                color={ENERGY_COLOR}
                anchors={['Exhausted', 'Steady', 'Energized']}
                min={1}
                max={9}
              />
              <SkiaResonanceSlider
                question="Somatic Pressure"
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

        {/* ── Context tags ── */}
        {weatherStep === 'context' && (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.stepContainer}>
            <Text style={styles.stepTitle}>What shaped your day?</Text>
            <Text style={styles.stepSubtext}>Select up to 3 influences</Text>

            <View style={styles.tagGrid}>
              {INFLUENCE_TAGS.map(tag => {
                const isSelected = selectedTags.includes(tag);
                const tagColor = getTagColor(tag);
                return (
                  <Pressable
                    key={tag}
                    style={[
                      styles.tagPill,
                      isSelected && {
                        borderColor: `${tagColor}55`,
                        backgroundColor: `${tagColor}15`,
                        // Shadow glow (Blur ~10 approximated via shadow)
                        shadowColor: tagColor,
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.65,
                        shadowRadius: 10,
                        elevation: 6,
                      },
                    ]}
                    onPress={() => toggleTag(tag)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons
                        name={INFLUENCE_ICONS[tag] ?? 'ellipse-outline'}
                        size={14}
                        color={isSelected ? tagColor : PALETTE.textSoft}
                      />
                      <Text style={[styles.tagText, isSelected && { color: tagColor, fontWeight: '600' }]}>
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

        {/* ── Hold to Seal ── */}
        {weatherStep === 'sync' && (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.syncContainer}>
            <Text style={styles.syncLabel}>Anchor your internal weather</Text>
            <Text style={styles.syncHint}>Hold the ring for 2.5 seconds to seal</Text>
            <SkiaHoldRing onSyncComplete={handleWeatherSave} />
          </Animated.View>
        )}
      </ScrollView>
    </>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const PANEL_HEIGHT = SCREEN_H * 0.72;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020817' },

  // ── Frosted glass panel ──
  blurTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_H * 0.30,
  },
  glassPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: PANEL_HEIGHT,
    backgroundColor: PALETTE.glassBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: PALETTE.glassHighlight,
    overflow: 'hidden',
  },
  panelHandle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginTop: 10,
    marginBottom: 4,
  },
  panelTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 8,
  },

  // ── Loading ──
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: PALETTE.textMuted, fontSize: 15, fontWeight: '500' },

  safeArea: { flex: 1 },

  // ── Pathway Selection ──
  selectContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 16,
  },
  selectQuestion: {
    color: PALETTE.textMain,
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  selectSubtext: {
    color: PALETTE.textSoft,
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
  },
  selectHintRow: { alignItems: 'center', marginTop: 24 },
  selectHint: {
    color: PALETTE.textMuted,
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  // ── Flow shared ──
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flowContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  stepRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    alignItems: 'center',
  },
  stepDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  stepDotActive: { backgroundColor: PALETTE.lavender, width: 24 },
  stepDotDone: { backgroundColor: 'rgba(162, 134, 242, 0.45)' },
  stepDotActiveCyan: { backgroundColor: PALETTE.cyan, width: 24 },
  stepDotDoneCyan: { backgroundColor: 'rgba(125, 235, 219, 0.35)' },

  stepContainer: { gap: 16, paddingTop: 8 },
  stepTitle: {
    color: PALETTE.textMain,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  stepSubtext: {
    color: PALETTE.textSoft,
    fontSize: 14,
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
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    marginTop: 20,
    gap: 6,
  },
  nextBtnText: {
    color: PALETTE.textMain,
    fontSize: 16,
    fontWeight: '600',
  },

  // ── Duration step ──
  durationDisplay: { alignItems: 'center', marginVertical: 20 },
  durationValue: {
    color: PALETTE.lavender,
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
    backgroundColor: PALETTE.lavender,
  },

  // ── Quality step ──
  moonRow: { alignItems: 'center', marginVertical: 12 },

  // ── Dream step — gold serif border ──
  dreamInput: {
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: `${PALETTE.gold}60`,
    color: PALETTE.textMain,
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 130,
    textAlignVertical: 'top',
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
  },
  charCount: {
    color: PALETTE.textMuted,
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },

  // ── Sync step ──
  syncContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 32,
    gap: 10,
  },
  syncLabel: {
    color: PALETTE.textMain,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  syncHint: {
    color: PALETTE.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 8,
  },

  // ── Sliders ──
  sliderGroup: { gap: 24 },

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
  tagText: {
    color: PALETTE.textSoft,
    fontSize: 13,
    fontWeight: '500',
  },
});
