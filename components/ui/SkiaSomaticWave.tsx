// File: components/ui/SkiaSomaticWave.tsx
/**
 * SkiaSomaticWave — "The Internal Weather"
 *
 * Three overlapping sinusoidal waves (Mood/Gold, Energy/Cyan, Rest/Lavender)
 * rendered entirely in Skia. blendMode="plusLighter" causes the overlapping
 * peaks to bloom into brilliant near-white light — a living biometric signature.
 *
 * Stability-reactive animation:
 *   Aligned   → slow (0.6×) + smooth waves
 *   Turbulent → fast (2.5×) + jagged amplitude
 *   Other     → neutral speed
 *
 * Touch surface: PanResponder triggers ImpactFeedbackStyle.Light as the user
 * drags across the wave surface, creating a haptic somatic rhythm.
 *
 * y = baseline(value) + sin(time × speed + phase + x × freq) × (amp × roughness)
 *
 * Requires: @shopify/react-native-skia 2.x, react-native-reanimated 4.x
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { Dimensions, PanResponder, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Canvas,
  Path,
  Group,
  LinearGradient,
  vec,
  BlurMask,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  useDerivedValue,
  useFrameCallback,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const { width: SCREEN_W } = Dimensions.get('window');
const WAVE_W = SCREEN_W - 48;
const WAVE_H = 180;
const SEGMENTS = 48; // enough points for jagged turbulent waves

// ── Wave path builder (UI thread) ────────────────────────────────────────

function buildWavePath(
  t: number,
  base: number,
  amp: number,
  phase: number,
  speed: number,
  roughness: number,
  w: number,
  h: number,
): string {
  'worklet';
  const baseline = h * 0.8 - base * h * 0.55;
  const amplitude = amp * h * 0.11 * roughness;
  // More cycles when turbulent (roughness > 1) → jagged look
  const cycleMult = 2 + (roughness - 1) * 1.5;
  const freq = (Math.PI * 2 * cycleMult) / w;

  let d = `M0 ${h}`;
  d += ` L0 ${Math.round(baseline + Math.sin(t * speed + phase) * amplitude)}`;
  for (let i = 1; i <= SEGMENTS; i++) {
    const x = Math.round((i / SEGMENTS) * w);
    const y = Math.round(
      baseline + Math.sin(t * speed * 1.1 + phase + x * freq) * amplitude,
    );
    d += ` L${x} ${y}`;
  }
  d += ` L${w} ${h} Z`;
  return d;
}

// ── Props ─────────────────────────────────────────────────────────────────

interface Props {
  /** Mood score 1–10 */
  mood: number;
  /** Energy score 1–10 */
  energy: number;
  /** Rest duration 0–12 hours */
  rest: number;
  /** Stability label controls animation character */
  stabilityLabel?: string;
}

// ── Component ─────────────────────────────────────────────────────────────

export default function SkiaSomaticWave({ mood, energy, rest, stabilityLabel }: Props) {
  // ── Data → SharedValues ──
  const moodSV   = useSharedValue(mood / 10);
  const energySV = useSharedValue(energy / 10);
  const restSV   = useSharedValue(Math.min(rest / 12, 1));

  useEffect(() => { moodSV.value   = mood / 10; },              [mood, moodSV]);
  useEffect(() => { energySV.value = energy / 10; },            [energy, energySV]);
  useEffect(() => { restSV.value   = Math.min(rest / 12, 1); }, [rest, restSV]);

  // ── Stability → speed & roughness ──
  const speedSV     = useSharedValue(1.0);
  const roughnessSV = useSharedValue(1.0);

  useEffect(() => {
    const isAligned   = stabilityLabel === 'Aligned';
    const isTurbulent = stabilityLabel === 'Turbulent';
    speedSV.value     = withTiming(isTurbulent ? 2.5 : isAligned ? 0.6 : 1.0, { duration: 1800, easing: Easing.inOut(Easing.ease) });
    roughnessSV.value = withTiming(isTurbulent ? 1.7 : isAligned ? 0.7 : 1.0, { duration: 1800, easing: Easing.inOut(Easing.ease) });
  }, [stabilityLabel, speedSV, roughnessSV]);

  // ── Frame-driven time ──
  const time = useSharedValue(0);
  useFrameCallback((info) => {
    'worklet';
    time.value = (info.timeSinceFirstFrame ?? 0) / 1000;
  });

  // ── Animated SVG paths ──
  const moodPath = useDerivedValue(() => {
    'worklet';
    return buildWavePath(time.value, moodSV.value, 0.82, 0, speedSV.value, roughnessSV.value, WAVE_W, WAVE_H);
  });
  const energyPath = useDerivedValue(() => {
    'worklet';
    return buildWavePath(time.value, energySV.value, 0.90, 2.094, speedSV.value, roughnessSV.value, WAVE_W, WAVE_H);
  });
  const restPath = useDerivedValue(() => {
    'worklet';
    return buildWavePath(time.value, restSV.value, 0.74, 4.189, speedSV.value, roughnessSV.value, WAVE_W, WAVE_H);
  });

  // ── Haptic pan responder ──
  const lastHapticAt = useRef(0);
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        },
        onPanResponderMove: () => {
          const now = Date.now();
          if (now - lastHapticAt.current > 80) {
            lastHapticAt.current = now;
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          }
        },
      }),
    [],
  );

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <Canvas style={{ width: WAVE_W, height: WAVE_H }}>
        {/*
         * plusLighter: src + dst clamped to 1.0
         * Where Gold + Cyan + Lavender peaks coincide → brilliant white bloom
         */}
        <Group blendMode="plusLighter">
          {/* Mood — Gold #D4AF37 */}
          <Path path={moodPath} style="fill">
            <LinearGradient
              start={vec(0, 0)}
              end={vec(0, WAVE_H)}
              colors={['rgba(212,175,55,0.78)', 'rgba(212,175,55,0.04)']}
            />
            <BlurMask blur={4} style="normal" />
          </Path>

          {/* Energy — Cyan #7DEBDB */}
          <Path path={energyPath} style="fill">
            <LinearGradient
              start={vec(0, 0)}
              end={vec(0, WAVE_H)}
              colors={['rgba(125,235,219,0.72)', 'rgba(125,235,219,0.04)']}
            />
            <BlurMask blur={4} style="normal" />
          </Path>

          {/* Rest — Lavender #A286F2 */}
          <Path path={restPath} style="fill">
            <LinearGradient
              start={vec(0, 0)}
              end={vec(0, WAVE_H)}
              colors={['rgba(162,134,242,0.70)', 'rgba(162,134,242,0.04)']}
            />
            <BlurMask blur={4} style="normal" />
          </Path>
        </Group>
      </Canvas>

      {/* Wave legend */}
      <View style={styles.legend} pointerEvents="none">
        {[['#D4AF37', 'Mood'], ['#7DEBDB', 'Energy'], ['#A286F2', 'Rest']].map(([color, label]) => (
          <View key={label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color }]} />
          </View>
        ))}
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    width: WAVE_W,
    height: WAVE_H + 20,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 8,
    alignSelf: 'center',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    position: 'absolute',
    bottom: 4,
    left: 0,
    right: 0,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.7,
  },
});

/**
 * SkiaSomaticWave — "The Internal Weather"
 *
 * Three overlapping sinusoidal wave paths representing Mood (Gold),
 * Energy (Emerald), and Rest (Silver-Blue). Each wave wobbles in
 * real-time using a sin(time + offset) * amplitude function driven
 * by useFrameCallback. The three waves are composited with
 * blendMode="screen" so their overlapping regions bloom into a
 * white/luminous glow — a living biometric signature.
 *
 * Touch surface: PanResponder triggers ImpactFeedbackStyle.Light
 * as the user drags across the wave, creating a haptic somatic rhythm.
 *
 * Data → Y coordinate logic:
 *   y_point = baseline(dataValue) + sin(time * speed + phase + x * freq) * amp
 *
 * Requires: @shopify/react-native-skia 2.x, react-native-reanimated 4.x
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { Dimensions, PanResponder, Platform, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Canvas,
  Path,
  Group,
  LinearGradient,
  vec,
  BlurMask,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  useDerivedValue,
  useFrameCallback,
} from 'react-native-reanimated';

const { width: SCREEN_W } = Dimensions.get('window');
const WAVE_W = SCREEN_W - 48;
const WAVE_H = 180;
const SEGMENTS = 42; // x-steps — enough for smooth curves

// ── Wave path builder (runs on Reanimated UI thread) ──────────────────────

/**
 * Builds a filled sine-wave SVG path string.
 * @param t       — current time in seconds (from useFrameCallback)
 * @param base    — normalised baseline height, 0.0–1.0 (0=bottom, 1=top)
 * @param amp     — oscillation amplitude, 0.0–1.0 (relative to height)
 * @param phase   — phase offset in radians (separates the three waves)
 * @param w / h   — canvas dimensions
 */
function buildWavePath(
  t: number,
  base: number,
  amp: number,
  phase: number,
  w: number,
  h: number,
): string {
  'worklet';
  // Map the data value to a y-baseline: 0.0→bottom 15%, 1.0→top 20%
  const baseline = h * 0.8 - base * h * 0.55;
  const amplitude = amp * h * 0.11;
  // Two full sinusoidal cycles across the canvas width
  const freq = (Math.PI * 2 * 2) / w;

  let d = `M0 ${h}`;
  d += ` L0 ${Math.round(baseline + Math.sin(t + phase) * amplitude)}`;
  for (let i = 1; i <= SEGMENTS; i++) {
    const x = Math.round((i / SEGMENTS) * w);
    const y = Math.round(baseline + Math.sin(t * 1.1 + phase + x * freq) * amplitude);
    d += ` L${x} ${y}`;
  }
  d += ` L${w} ${h} Z`;
  return d;
}

// ── Props ─────────────────────────────────────────────────────────────────

interface Props {
  /** Mood score 1–10 */
  mood: number;
  /** Energy score 1–10 */
  energy: number;
  /** Rest duration 0–12 hours */
  rest: number;
}

// ── Component ─────────────────────────────────────────────────────────────

export default function SkiaSomaticWave({ mood, energy, rest }: Props) {
  // ── Shared values driven by props ──
  const moodSV    = useSharedValue(mood / 10);
  const energySV  = useSharedValue(energy / 10);
  const restSV    = useSharedValue(Math.min(rest / 12, 1));

  useEffect(() => { moodSV.value   = mood / 10; },          [mood, moodSV]);
  useEffect(() => { energySV.value = energy / 10; },        [energy, energySV]);
  useEffect(() => { restSV.value   = Math.min(rest / 12, 1); }, [rest, restSV]);

  // ── Frame-driven time ──
  const time = useSharedValue(0);
  useFrameCallback((info) => {
    'worklet';
    time.value = (info.timeSinceFirstFrame ?? 0) / 1000;
  });

  // ── Derived animated SVG path strings ──
  const moodPath = useDerivedValue(() => {
    'worklet';
    return buildWavePath(time.value, moodSV.value, 0.82, 0, WAVE_W, WAVE_H);
  });

  const energyPath = useDerivedValue(() => {
    'worklet';
    return buildWavePath(time.value, energySV.value, 0.9, 2.094, WAVE_W, WAVE_H);
  });

  const restPath = useDerivedValue(() => {
    'worklet';
    return buildWavePath(time.value, restSV.value, 0.74, 4.189, WAVE_W, WAVE_H);
  });

  // ── Haptic PanResponder ──
  const lastHapticAt = useRef(0);
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        },
        onPanResponderMove: () => {
          const now = Date.now();
          if (now - lastHapticAt.current > 80) {
            lastHapticAt.current = now;
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          }
        },
      }),
    [],
  );

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <Canvas style={{ width: WAVE_W, height: WAVE_H }}>
        {/*
         * blendMode="screen": colours add to white where waves overlap —
         * Gold + Emerald ≈ yellow bloom, Emerald + Silver ≈ cyan bloom,
         * all three ≈ near-white aura glow.
         */}
        <Group blendMode="screen">
          {/* ── Mood Wave — Gold ── */}
          <Path path={moodPath} style="fill">
            <LinearGradient
              start={vec(0, 0)}
              end={vec(0, WAVE_H)}
              colors={['rgba(201,174,120,0.72)', 'rgba(201,174,120,0.04)']}
            />
            <BlurMask blur={5} style="normal" />
          </Path>

          {/* ── Energy Wave — Emerald ── */}
          <Path path={energyPath} style="fill">
            <LinearGradient
              start={vec(0, 0)}
              end={vec(0, WAVE_H)}
              colors={['rgba(110,191,139,0.68)', 'rgba(110,191,139,0.04)']}
            />
            <BlurMask blur={5} style="normal" />
          </Path>

          {/* ── Rest Wave — Silver Blue ── */}
          <Path path={restPath} style="fill">
            <LinearGradient
              start={vec(0, 0)}
              end={vec(0, WAVE_H)}
              colors={['rgba(139,196,232,0.64)', 'rgba(139,196,232,0.04)']}
            />
            <BlurMask blur={5} style="normal" />
          </Path>
        </Group>
      </Canvas>

      {/* Wave legend — accessible labels */}
      <View style={styles.legend} pointerEvents="none">
        <LegendDot color="#C9AE78" label="Mood" />
        <LegendDot color="#6EBF8B" label="Energy" />
        <LegendDot color="#8BC4E8" label="Rest" />
      </View>
    </View>
  );
}

// ── Legend dot ────────────────────────────────────────────────────────────

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <View style={[{ color } as any]}>
        {/* RN Text doesn't support dynamic color from variable cleanly here, use inline */}
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    width: WAVE_W,
    height: WAVE_H + 20,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 8,
    alignSelf: 'center',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    position: 'absolute',
    bottom: 4,
    left: 0,
    right: 0,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.7,
  },
});
