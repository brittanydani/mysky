// app/(tabs)/settings/calibration.tsx
/**
 * SkiaSomaticCalibration
 * Calibrates the app's GPU Shaders to the user's specific somatic responses.
 * Proves high-end utility and individualization for Health & Wellness categorization.
 *
 * The user drags an interactive color-frequency orb through "Energy Nodes" on a
 * Skia-rendered spectrum ring, mapping their personal color-to-emotion associations.
 * Active profile is persisted so the Nebula / Aura layers can read it later.
 */

import React, { useMemo, useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Canvas,
  Circle,
  Group,
  BlurMask,
  vec,
  SweepGradient,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  useDerivedValue,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Constants ─────────────────────────────────────────────────────────────────
const { width } = Dimensions.get('window');
const CALIB_SIZE = width * 0.85;
const CENTER = CALIB_SIZE / 2;
const RING_RADIUS = CENTER - 20;

/** Colors that map to the sweep gradient stops on the spectrum ring */
const SPECTRUM_COLORS = [
  '#D4AF37', // Gold
  '#6EBF8B', // Emerald
  '#8BC4E8', // Azure
  '#4A3B6B', // Indigo
  '#CD7F5D', // Amber
  '#D4AF37', // Gold (wraps)
];

const STORAGE_KEY = 'somatic_calibration_profile';

// ── Types ─────────────────────────────────────────────────────────────────────
interface CalibrationProfile {
  label: string;
  color: string;
  hue: number;
  sensitivity: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getCalibrationProfile(
  hue: number,
  sens: number,
): CalibrationProfile {
  let label: string;
  let color: string;

  if (hue < 0.17) {
    label = 'Coherent Gold';
    color = '#D4AF37';
  } else if (hue < 0.33) {
    label = 'Coherent Emerald';
    color = '#6EBF8B';
  } else if (hue < 0.50) {
    label = 'Coherent Azure';
    color = '#8BC4E8';
  } else if (hue < 0.67) {
    label = 'Coherent Indigo';
    color = '#4A3B6B';
  } else if (hue < 0.83) {
    label = 'Coherent Amber';
    color = '#CD7F5D';
  } else {
    label = 'Coherent Gold';
    color = '#D4AF37';
  }

  return { label, color, hue, sensitivity: sens };
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function SomaticCalibration() {
  const router = useRouter();

  // Animated shared values driving the Skia orb position
  const moodHue = useSharedValue(0.25);
  const sensitivity = useSharedValue(0.6);

  // UI-level calibration profile state (label + color chip)
  const [profile, setProfile] = useState<CalibrationProfile>(
    getCalibrationProfile(0.25, 0.6),
  );

  // ── Persist / restore calibration ──
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved: CalibrationProfile = JSON.parse(raw);
          moodHue.value = saved.hue;
          sensitivity.value = saved.sensitivity;
          setProfile(saved);
        }
      } catch {
        /* first launch — defaults are fine */
      }
    })();
  }, []);

  const persistProfile = useCallback((p: CalibrationProfile) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(p)).catch(() => {});
  }, []);

  // ── Callbacks kept stable for the gesture ──
  const updateProfile = useCallback(
    (hue: number, sens: number) => {
      const next = getCalibrationProfile(hue, sens);
      setProfile((prev) => {
        if (prev.label === next.label) return prev;
        persistProfile(next);
        return next;
      });
    },
    [persistProfile],
  );

  const triggerHaptic = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
  }, []);

  // ── Gesture — runs on JS thread, updates shared values ──
  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .onUpdate((e) => {
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

          updateProfile(hue, clampedDist);
          triggerHaptic();
        })
        .onEnd(() => {
          // Persist the final position on gesture end
          const finalProfile = getCalibrationProfile(
            moodHue.value,
            sensitivity.value,
          );
          persistProfile(finalProfile);
        }),
    [updateProfile, triggerHaptic, persistProfile],
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
      <SafeAreaView edges={['top']} style={styles.safe}>
        {/* ── Back button ── */}
        <Pressable
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color="#FDFBF7" />
        </Pressable>

        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Instrument Calibration</Text>
          <Text style={styles.title}>Somatic Resonance</Text>
          <Text style={styles.description}>
            Define the light frequency that correlates to your state of
            &ldquo;Steady Flow.&rdquo;
          </Text>
        </View>

        {/* ── Interactive calibration canvas ── */}
        <GestureDetector gesture={gesture}>
          <View style={styles.calibrationZone}>
            <Canvas style={{ width: CALIB_SIZE, height: CALIB_SIZE }}>
              <Group>
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
                <Circle cx={orbX} cy={orbY} r={15} color={profile.color}>
                  <BlurMask blur={15} style="solid" />
                </Circle>

                {/* 3. Calibration Orb — inner core */}
                <Circle cx={orbX} cy={orbY} r={4} color="white" />
              </Group>
            </Canvas>
          </View>
        </GestureDetector>

        {/* ── Profile card ── */}
        <View style={styles.obsidianCard}>
          <Text style={styles.cardLabel}>Current Profile</Text>
          <View style={styles.profileRow}>
            <View
              style={[styles.colorChip, { backgroundColor: profile.color }]}
            />
            <Text style={styles.profileText}>
              Calibration: {profile.label}
            </Text>
          </View>
          <Text style={styles.hint}>
            This frequency will drive the atmospheric rendering of your Nebula
            and Aura fields.
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07090F',
    padding: 24,
  },
  safe: {
    flex: 1,
  },
  backBtn: {
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  header: {
    marginBottom: 20,
  },
  eyebrow: {
    color: '#D4AF37',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  title: {
    color: '#FDFBF7',
    fontSize: 32,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    marginTop: 8,
  },
  description: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    lineHeight: 22,
    marginTop: 12,
  },
  calibrationZone: {
    width: CALIB_SIZE,
    height: CALIB_SIZE,
    alignSelf: 'center',
    marginVertical: 24,
  },
  obsidianCard: {
    padding: 20,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  cardLabel: {
    color: '#D4AF37',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 12,
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
    color: '#FDFBF7',
    fontSize: 15,
    fontWeight: '600',
  },
  hint: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
    marginTop: 12,
    fontStyle: 'italic',
  },
});
