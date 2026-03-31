// app/(tabs)/settings/calibration.tsx
/**
 * SkiaVisualCalibration
 * Lets the user choose their preferred color atmosphere for the app's GPU shaders
 * across five distinct mood categories: Steady Flow, High Energy, Deep Focus,
 * Rest & Recovery, and Creative Spark.
 *
 * The user drags an interactive color-frequency orb through a Skia-rendered
 * spectrum ring for each category, mapping personal color-to-mood associations.
 * All profiles are persisted so the Nebula / Aura layers can read them later.
 */

import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
  Pressable,
  Alert,
} from 'react-native';
import Animated, { FadeIn, FadeOut, useSharedValue, useDerivedValue, runOnJS } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Canvas,
  Circle,
  Group,
  BlurMask,
  vec,
  SweepGradient,
} from '@shopify/react-native-skia';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useRouter, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { GoldIcon } from '../../../components/ui/GoldIcon';
import { MetallicText } from '../../../components/ui/MetallicText';
import { MetallicIcon } from '../../../components/ui/MetallicIcon';
import { SkiaDynamicCosmos } from '../../../components/ui/SkiaDynamicCosmos';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

// ── Constants ─────────────────────────────────────────────────────────────────
const { width } = Dimensions.get('window');
const CALIB_SIZE = width * 0.75;
const CENTER = CALIB_SIZE / 2;
const RING_RADIUS = CENTER - 20;

/** Colors that map to the sweep gradient stops on the spectrum ring */
const SPECTRUM_COLORS = [
  '#C9AE78', // Gold
  '#CD7F5D', // Amber
  '#E07A7A', // Rose
  '#C97BBF', // Orchid
  '#4A3B6B', // Indigo
  '#5B8FD4', // Cobalt
  '#8BC4E8', // Azure
  '#6EBF8B', // Emerald
  '#A4C97B', // Sage
  '#E8D38B', // Champagne
  '#C9AE78', // Gold (wraps)
];

const STORAGE_KEY = 'visual_calibration_profiles';  // stores all categories
const LEGACY_STORAGE_KEY = 'visual_calibration_profile'; // old single-profile key
const LEGACY_SOMATIC_KEY = 'somatic_calibration_profile';

// ── Categories ────────────────────────────────────────────────────────────────
interface CalibrationCategory {
  id: string;
  label: string;
  icon: IoniconName;
  prompt: string;
  defaultHue: number;
  defaultSensitivity: number;
}

const CATEGORIES: CalibrationCategory[] = [
  {
    id: 'steady_flow',
    label: 'Flow',
    icon: 'water-outline',
    prompt: 'Choose the color that feels most like your calm, balanced state.',
    defaultHue: 0.25,
    defaultSensitivity: 0.6,
  },
  {
    id: 'high_energy',
    label: 'Energy',
    icon: 'flash-outline',
    prompt: 'Pick the color that matches your most energized, excited feeling.',
    defaultHue: 0.85,
    defaultSensitivity: 0.8,
  },
  {
    id: 'deep_focus',
    label: 'Focus',
    icon: 'eye-outline',
    prompt: 'Select the color that represents deep concentration and clarity.',
    defaultHue: 0.42,
    defaultSensitivity: 0.7,
  },
  {
    id: 'rest_recovery',
    label: 'Rest',
    icon: 'moon-outline',
    prompt: 'Choose the color that feels like winding down and restoring.',
    defaultHue: 0.58,
    defaultSensitivity: 0.5,
  },
  {
    id: 'creative_spark',
    label: 'Creative',
    icon: 'sparkles-outline',
    prompt: 'Pick the color that captures your inspired, playful energy.',
    defaultHue: 0.08,
    defaultSensitivity: 0.75,
  },
];

// ── Types ─────────────────────────────────────────────────────────────────────
interface CalibrationProfile {
  label: string;
  color: string;
  hue: number;
  sensitivity: number;
}

type AllProfiles = Record<string, CalibrationProfile>;

// ── Helpers ───────────────────────────────────────────────────────────────────
function getCalibrationProfile(
  hue: number,
  sens: number,
): CalibrationProfile {
  let label: string;
  let color: string;

  if (hue < 0.10) {
    label = 'Gold';
    color = '#C9AE78';
  } else if (hue < 0.20) {
    label = 'Amber';
    color = '#CD7F5D';
  } else if (hue < 0.30) {
    label = 'Rose';
    color = '#E07A7A';
  } else if (hue < 0.40) {
    label = 'Orchid';
    color = '#C97BBF';
  } else if (hue < 0.50) {
    label = 'Indigo';
    color = '#4A3B6B';
  } else if (hue < 0.60) {
    label = 'Cobalt';
    color = '#5B8FD4';
  } else if (hue < 0.70) {
    label = 'Azure';
    color = '#8BC4E8';
  } else if (hue < 0.80) {
    label = 'Emerald';
    color = '#6EBF8B';
  } else if (hue < 0.90) {
    label = 'Sage';
    color = '#A4C97B';
  } else {
    label = 'Champagne';
    color = '#E8D38B';
  }

  return { label, color, hue, sensitivity: sens };
}

/** Build default profiles for all categories */
function getDefaultProfiles(): AllProfiles {
  const defaults: AllProfiles = {};
  for (const cat of CATEGORIES) {
    defaults[cat.id] = getCalibrationProfile(cat.defaultHue, cat.defaultSensitivity);
  }
  return defaults;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function VisualCalibration() {
  const router = useRouter();
  const navigation = useNavigation();

  // Active category index
  const [activeCatIdx, setActiveCatIdx] = useState(0);
  const activeCat = CATEGORIES[activeCatIdx];

  // All saved profiles (one per category)
  const [allProfiles, setAllProfiles] = useState<AllProfiles>(getDefaultProfiles);

  // The current profile being edited (for the active category)
  const activeProfile = allProfiles[activeCat.id];

  // Animated shared values driving the Skia orb position
  const moodHue = useSharedValue(activeProfile.hue);
  const sensitivity = useSharedValue(activeProfile.sensitivity);
  const prevHueSegment = useSharedValue(-1);

  // Track whether the user has changed any profile since last save
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSavedBanner, setShowSavedBanner] = useState(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Persist / restore calibration ──
  useEffect(() => {
    (async () => {
      try {
        let raw = await AsyncStorage.getItem(STORAGE_KEY);

        // Migrate from old single-profile keys
        if (!raw) {
          let legacyRaw = await AsyncStorage.getItem(LEGACY_STORAGE_KEY);
          if (!legacyRaw) {
            legacyRaw = await AsyncStorage.getItem(LEGACY_SOMATIC_KEY);
          }
          if (legacyRaw) {
            const oldProfile: CalibrationProfile = JSON.parse(legacyRaw);
            const migrated = getDefaultProfiles();
            migrated.steady_flow = oldProfile; // map old single profile to Steady Flow
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
            await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
            await AsyncStorage.removeItem(LEGACY_SOMATIC_KEY);
            raw = JSON.stringify(migrated);
          }
        }

        if (raw) {
          const saved: AllProfiles = JSON.parse(raw);
          // Fill in any missing categories with defaults
          const defaults = getDefaultProfiles();
          const merged = { ...defaults, ...saved };

          // Re-derive labels/colors from hue values to pick up any naming changes
          for (const key of Object.keys(merged)) {
            const p = merged[key];
            merged[key] = getCalibrationProfile(p.hue, p.sensitivity);
          }

          setAllProfiles(merged);

          // Set animated values to the first category
          const first = merged[CATEGORIES[0].id];
          if (first) {
            moodHue.value = first.hue;
            sensitivity.value = first.sensitivity;
          }
        }
      } catch {
        /* first launch — defaults are fine */
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When the user switches categories, update the animated values to match
  const handleCategoryChange = useCallback((idx: number) => {
    setActiveCatIdx(idx);
    const cat = CATEGORIES[idx];
    const prof = allProfiles[cat.id];
    moodHue.value = prof.hue;
    sensitivity.value = prof.sensitivity;
    setShowSavedBanner(false);
    Haptics.selectionAsync().catch(() => {});
  }, [allProfiles, moodHue, sensitivity]);

  // ── Callbacks kept stable for the gesture ──
  const updateProfile = useCallback(
    (hue: number, sens: number) => {
      const next = getCalibrationProfile(hue, sens);
      setAllProfiles((prev) => {
        const current = prev[CATEGORIES[activeCatIdx].id];
        if (current.label === next.label && Math.abs(current.hue - next.hue) < 0.01) return prev;
        setHasUnsavedChanges(true);
        setShowSavedBanner(false);
        return { ...prev, [CATEGORIES[activeCatIdx].id]: next };
      });
    },
    [activeCatIdx],
  );

  const triggerThresholdHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, []);

  // Helper — update profile state on gesture end (no auto-persist)
  const finalizeGesture = useCallback(
    (hue: number, sens: number) => {
      const finalProfile = getCalibrationProfile(hue, sens);
      setAllProfiles((prev) => ({
        ...prev,
        [CATEGORIES[activeCatIdx].id]: finalProfile,
      }));
      setHasUnsavedChanges(true);
    },
    [activeCatIdx],
  );

  // ── Save button handler ──
  const handleSave = useCallback(async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(allProfiles));
      setHasUnsavedChanges(false);
      setShowSavedBanner(true);
      try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}

      // Auto-hide the banner after 2.5s
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => setShowSavedBanner(false), 2500);
    } catch {
      Alert.alert('Save Failed', 'Unable to save your color preferences. Please try again.');
    }
  }, [allProfiles]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  // ── Navigation guard — warn before leaving with unsaved changes ──
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      e.preventDefault();
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved color preferences. Discard and leave?',
        [
          { text: 'Stay', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => navigation.dispatch(e.data.action) },
        ],
      );
    });
    return unsubscribe;
  }, [hasUnsavedChanges, navigation]);

  // ── Gesture — callbacks run as worklets, JS calls wrapped in runOnJS ──
  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .onUpdate((e) => {
          'worklet';
          const dx = e.x - CENTER;
          const dy = e.y - CENTER;

          // Distance from centre → sensitivity (0–1)
          const dist = Math.sqrt(dx * dx + dy * dy) / (CALIB_SIZE / 2);
          const clampedDist = Math.min(Math.max(dist, 0), 1);
          sensitivity.value = clampedDist;

          // Angle → hue fraction (0–1)
          const angle = Math.atan2(dy, dx);
          const hue = (angle + Math.PI) / (Math.PI * 2);
          moodHue.value = hue;

          runOnJS(updateProfile)(hue, clampedDist);
          const segment = Math.floor(hue * 10);
          if (segment !== prevHueSegment.value) {
            prevHueSegment.value = segment;
            runOnJS(triggerThresholdHaptic)();
          }
        })
        .onEnd(() => {
          'worklet';
          runOnJS(finalizeGesture)(moodHue.value, sensitivity.value);
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [updateProfile, triggerThresholdHaptic, finalizeGesture],
  );

  // ── Derived positions for the calibration orb (worklet thread) ──
  const orbX = useDerivedValue(
    () =>
      CENTER +
      RING_RADIUS *
        sensitivity.value *
        Math.cos(moodHue.value * Math.PI * 2 - Math.PI),
  );
  const orbY = useDerivedValue(
    () =>
      CENTER +
      RING_RADIUS *
        sensitivity.value *
        Math.sin(moodHue.value * Math.PI * 2 - Math.PI),
  );

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />
      <SafeAreaView edges={['top']} style={styles.safe}>
        {/* ── Back button ── */}
        <Pressable
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back-outline" size={24} color="#F8FAFC" />
        </Pressable>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Header ── */}
          <View style={styles.header}>
            <Text style={styles.eyebrow}>Visual Customization</Text>
            <Text style={styles.title}>Color Atmosphere</Text>
            <Text style={styles.description}>
              Map your colors to different moods and energies.
            </Text>
          </View>

          {/* ── All Atmospheres — tap a row to edit ── */}
          <View style={styles.summaryCard}>
            <Text style={styles.cardLabel}>All Atmospheres</Text>
            <Text style={styles.summaryHint}>Tap a category to customize its color</Text>
            {CATEGORIES.map((cat, idx) => {
              const prof = allProfiles[cat.id];
              const isCurrent = idx === activeCatIdx;
              return (
                <Pressable
                  key={cat.id}
                  style={[styles.summaryRow, isCurrent && styles.summaryRowActive]}
                  onPress={() => handleCategoryChange(idx)}
                  accessibilityRole="button"
                  accessibilityLabel={`Edit ${cat.label} color`}
                >
                  {isCurrent ? (
                    <MetallicIcon name={cat.icon} size={16} color="#C9AE78" />
                  ) : (
                    <Ionicons name={cat.icon} size={16} color="rgba(255,255,255,0.4)" />
                  )}
                  <Text style={[styles.summaryLabel, isCurrent && styles.summaryLabelActive]}>
                    {cat.label}
                  </Text>
                  <View style={[styles.summaryChip, { backgroundColor: prof.color }]} />
                  <Text style={[styles.summaryValue, isCurrent && styles.summaryValueActive]}>{prof.label}</Text>
                  {isCurrent && (
                    <GoldIcon name="pencil-outline" size={12}  style={{ marginLeft: 4 }}  />
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* ── Active category prompt ── */}
          <Animated.View key={activeCat.id} entering={FadeIn.duration(300)} style={styles.promptBox}>
            <View style={styles.promptHeader}>
              <GoldIcon name={activeCat.icon} size={16}   />
              <Text style={styles.promptTitle}>{activeCat.label}</Text>
            </View>
            <Text style={styles.promptText}>{activeCat.prompt}</Text>
          </Animated.View>

          {/* ── Interactive calibration canvas ── */}
          <GestureDetector gesture={gesture}>
            <View style={styles.calibrationZone}>
              <Canvas style={{ width: CALIB_SIZE, height: CALIB_SIZE }}>
                <Group>
                  {/* 0. Ambient spectrum glow */}
                  <Circle
                    cx={CENTER}
                    cy={CENTER}
                    r={RING_RADIUS}
                    style="stroke"
                    strokeWidth={32}
                    opacity={0.18}
                  >
                    <SweepGradient c={vec(CENTER, CENTER)} colors={SPECTRUM_COLORS} />
                    <BlurMask blur={22} style="normal" />
                  </Circle>

                  {/* 1. Spectrum Ring */}
                  <Circle
                    cx={CENTER}
                    cy={CENTER}
                    r={RING_RADIUS}
                    style="stroke"
                    strokeWidth={2}
                  >
                    <SweepGradient
                      c={vec(CENTER, CENTER)}
                      colors={SPECTRUM_COLORS}
                    />
                    <BlurMask blur={5} style="outer" />
                  </Circle>

                  {/* 2. Calibration Orb — outer glow */}
                  <Circle cx={orbX} cy={orbY} r={15} color={activeProfile.color}>
                    <BlurMask blur={15} style="solid" />
                  </Circle>

                  {/* 3. Calibration Orb — inner core */}
                  <Circle cx={orbX} cy={orbY} r={4} color="white" />
                </Group>
              </Canvas>
            </View>
          </GestureDetector>

          {/* ── Current selection card ── */}
          <View style={styles.obsidianCard}>
            <Text style={styles.cardLabel}>{activeCat.label} — Current</Text>
            <View style={styles.profileRow}>
              <View
                style={[styles.colorChip, { backgroundColor: activeProfile.color }]}
              />
              <Text style={styles.profileText}>
                {activeProfile.label}
              </Text>
            </View>
            <Text style={styles.hint}>
              Drag the orb above to change, then tap Save.
            </Text>
          </View>

          {/* ── Save button ── */}
          <Pressable
            style={[
              styles.saveButton,
              !hasUnsavedChanges && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={!hasUnsavedChanges}
            accessibilityRole="button"
            accessibilityLabel="Save color preferences"
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={20}
              color={hasUnsavedChanges ? '#0A0A0C' : 'rgba(10,10,12,0.4)'}
            />
            <Text
              style={[
                styles.saveButtonText,
                !hasUnsavedChanges && styles.saveButtonTextDisabled,
              ]}
            >
              {hasUnsavedChanges ? 'Save All Preferences' : 'All Saved'}
            </Text>
          </Pressable>

          {/* ── Saved confirmation banner ── */}
          {showSavedBanner && (
            <Animated.View
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(300)}
              style={styles.savedBanner}
            >
              <MetallicIcon name="checkmark-circle-outline" size={18} color="#6EBF8B" />
              <MetallicText style={styles.savedBannerText} color="#6EBF8B">
                All color atmospheres saved
              </MetallicText>
            </Animated.View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020817',
    padding: 24,
  },
  safe: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 60,
  },
  backBtn: {
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  header: {
    marginBottom: 16,
  },
  eyebrow: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 8,
  },
  description: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    lineHeight: 22,
    marginTop: 12,
  },

  // ── Prompt ──
  promptBox: {
    marginTop: 16,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  promptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  promptTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  promptText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 14,
    lineHeight: 21,
  },

  calibrationZone: {
    width: CALIB_SIZE,
    height: CALIB_SIZE,
    alignSelf: 'center',
    marginVertical: 16,
  },
  obsidianCard: {
    padding: 20,
    borderRadius: 24,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  cardLabel: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 12,
    letterSpacing: 1,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  colorChip: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  profileText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  hint: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
    marginTop: 12,
  },

  // ── All-categories summary ──
  summaryHint: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
    marginBottom: 8,
  },
  summaryCard: {
    padding: 20,
    borderRadius: 24,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  summaryRowActive: {
    backgroundColor: 'transparent',
    marginHorizontal: -12,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  summaryLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  summaryLabelActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  summaryChip: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  summaryValue: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 13,
    fontWeight: '500',
    minWidth: 60,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  summaryValueActive: {
    color: 'rgba(255,255,255,0.7)',
  },

  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  saveButtonDisabled: {
    backgroundColor: 'transparent',
  },
  saveButtonText: {
    color: '#0A0A0C',
    fontSize: 16,
    fontWeight: '700',
  },
  saveButtonTextDisabled: {
    color: 'rgba(7,9,15,0.4)',
  },
  savedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(110, 191, 139, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(110, 191, 139, 0.25)',
  },
  savedBannerText: {
    color: '#6EBF8B',
    fontSize: 14,
    fontWeight: '600',
  },
});
