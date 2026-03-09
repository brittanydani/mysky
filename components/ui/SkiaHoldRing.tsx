// File: components/ui/SkiaHoldRing.tsx
/**
 * SkiaHoldRing — The "Hold to Seal" Ritual Ring
 *
 * The high-end confirmation moment. The user presses and holds for 2.5 s
 * to anchor their data into the Observatory. A gold SweepGradient arc
 * sweeps around a circle, accompanied by a haptic heartbeat every 500 ms.
 * Releasing early springs the progress back to 0.
 *
 * Visual Spec (Gemini):
 *   - Path circle — perfect arc built via Skia.Path.Make() addArc
 *   - SweepGradient colours: ['#D4AF37', '#EBC07D', '#D4AF37']
 *   - Haptic pulse every 500 ms while held
 *   - On complete: Haptics.notificationAsync(Success) → onSyncComplete()
 *
 * Requires: @shopify/react-native-skia 2.x, react-native-reanimated 4.x,
 *           react-native-gesture-handler 2.x
 */

import React, { useCallback, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  Canvas,
  Path,
  Skia,
  Circle,
  Group,
  BlurMask,
  SweepGradient,
  vec,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  useDerivedValue,
  withTiming,
  withSpring,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

// ── Dimensions ───────────────────────────────────────────────────────────────

const SIZE = 160;
const CENTER = SIZE / 2;
const RING_RADIUS = 58;
const STROKE_WIDTH = 3.5;
const HOLD_DURATION = 2500;

// ── Palette ───────────────────────────────────────────────────────────────────

const GOLD_A = '#D4AF37';
const GOLD_B = '#EBC07D';
const TRACK_COLOR = 'rgba(192, 192, 192, 0.20)';

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildArcPath(cx: number, cy: number, r: number, sweepDeg: number) {
  'worklet';
  const path = Skia.Path.Make();
  // Clamp to avoid degenerate paths
  const clampedSweep = Math.max(0.5, Math.min(359.99, sweepDeg));
  const rect = { x: cx - r, y: cy - r, width: r * 2, height: r * 2 };
  path.addArc(rect, -90, clampedSweep);
  return path;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  onSyncComplete: () => void;
  label?: string;
}

export default function SkiaHoldRing({ onSyncComplete, label = 'HOLD TO SEAL' }: Props) {
  const [sealed, setSealed] = useState(false);
  const progress = useSharedValue(0);
  const glowOpacity = useSharedValue(0.4);

  // Haptic interval ref — cleared on release
  const hapticIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startHapticBeat = useCallback(() => {
    hapticIntervalRef.current = setInterval(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }, 500);
  }, []);

  const stopHapticBeat = useCallback(() => {
    if (hapticIntervalRef.current !== null) {
      clearInterval(hapticIntervalRef.current);
      hapticIntervalRef.current = null;
    }
  }, []);

  const handleComplete = useCallback(() => {
    stopHapticBeat();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setSealed(true);
    onSyncComplete();
  }, [stopHapticBeat, onSyncComplete]);

  const handleRelease = useCallback(() => {
    stopHapticBeat();
  }, [stopHapticBeat]);

  // ── Gesture ────────────────────────────────────────────────────────────────

  const holdGesture = Gesture.LongPress()
    .minDuration(HOLD_DURATION)
    .maxDistance(60)
    .onBegin(() => {
      'worklet';
      // Animate progress to 1 over HOLD_DURATION
      progress.value = withTiming(1, {
        duration: HOLD_DURATION,
        easing: Easing.linear,
      });
      glowOpacity.value = withTiming(0.85, { duration: HOLD_DURATION });
      runOnJS(startHapticBeat)();
    })
    .onStart(() => {
      'worklet';
      // Full hold achieved
      runOnJS(handleComplete)();
    })
    .onFinalize((_e, success) => {
      'worklet';
      if (!success) {
        // Released early → spring back
        progress.value = withSpring(0, { damping: 18, stiffness: 180 });
        glowOpacity.value = withTiming(0.4, { duration: 400 });
        runOnJS(handleRelease)();
      }
    });

  // ── Derived Skia values ────────────────────────────────────────────────────

  // Full track ring (always visible, dim)
  const trackPath = useDerivedValue(() => buildArcPath(CENTER, CENTER, RING_RADIUS, 359.99));

  // Progress arc
  const arcPath = useDerivedValue(() =>
    buildArcPath(CENTER, CENTER, RING_RADIUS, progress.value * 359.99),
  );

  // Inner glow circle radius pulses slightly
  const innerGlowR = useDerivedValue(() => RING_RADIUS - STROKE_WIDTH * 3 + progress.value * 8);

  return (
    <View style={styles.wrapper}>
      <GestureDetector gesture={holdGesture}>
        <View style={styles.touchArea}>
          <Canvas style={styles.canvas}>
            <Group>
              {/* 1. Track ring */}
              <Path
                path={trackPath}
                style="stroke"
                strokeWidth={STROKE_WIDTH}
                color={TRACK_COLOR}
                strokeCap="round"
              />

              {/* 2. Gold glow bloom behind arc */}
              <Circle cx={CENTER} cy={CENTER} r={innerGlowR} color="transparent" opacity={glowOpacity}>
                <BlurMask blur={22} style="outer" />
              </Circle>
              <Circle
                cx={CENTER}
                cy={CENTER}
                r={innerGlowR}
                color={GOLD_A}
                opacity={glowOpacity}
              />

              {/* 3. Progress arc with SweepGradient */}
              <Path
                path={arcPath}
                style="stroke"
                strokeWidth={STROKE_WIDTH}
                strokeCap="round"
                color="white" // overridden by SweepGradient
              >
                <SweepGradient
                  c={vec(CENTER, CENTER)}
                  colors={[GOLD_A, GOLD_B, GOLD_A, 'transparent']}
                  positions={[0, 0.45, 0.9, 1]}
                  start={-90}
                  end={270}
                />
              </Path>

              {/* 4. Leading thumb dot */}
              <Circle cx={CENTER} cy={CENTER - RING_RADIUS} r={STROKE_WIDTH * 1.8} color={GOLD_B}>
                <BlurMask blur={6} style="outer" />
              </Circle>
            </Group>
          </Canvas>

          {/* Centre label */}
          <View style={styles.labelContainer} pointerEvents="none">
            <Text style={[styles.labelText, sealed && styles.labelSealed]}>
              {sealed ? 'SEALED' : label}
            </Text>
          </View>
        </View>
      </GestureDetector>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    marginVertical: 12,
  },
  touchArea: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  canvas: {
    width: SIZE,
    height: SIZE,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  labelContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: SIZE,
    height: SIZE,
  },
  labelText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  labelSealed: {
    color: GOLD_B,
  },
});
