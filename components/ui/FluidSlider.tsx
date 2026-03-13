// components/ui/FluidSlider.tsx
//
// Bespoke slider with native-thread gesture handling, spring snap physics,
// and Skia-rendered glow track. Drop-in replacement for SkiaResonanceSlider.
//
// Architecture:
//   • Gesture.Pan() runs on the UI thread (no runOnJS(true)) — uninterruptible,
//     120fps-capable, never stalls behind the JS bridge.
//   • All visual state (thumbX, fillWidth, glow) is driven by Reanimated
//     SharedValues → DerivedValues that Skia subscribes to natively.
//   • On gesture end: withSpring() snaps the thumb to the nearest integer,
//     producing a physical "click-into-place" feel.
//   • Haptic ticks fire exactly as the thumb crosses each integer threshold.
//
// Requires: @shopify/react-native-skia ~2.5, react-native-reanimated ~4.x,
//           react-native-gesture-handler ~2.28, expo-haptics

import React, { memo, useMemo, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  Canvas,
  RoundedRect,
  Circle,
  Group,
  LinearGradient,
  BlurMask,
  vec,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  useDerivedValue,
  withSpring,
  withRepeat,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { theme } from '../../constants/theme';

// ── Constants ─────────────────────────────────────────────────────────────────

const TRACK_H = 52;
const TRACK_THICKNESS = 10;
const THUMB_R = 14;

const SPRING_CONFIG = {
  mass: 1,
  damping: 22,
  stiffness: 280,
  overshootClamping: false,
} as const;

// ── Props ─────────────────────────────────────────────────────────────────────

export interface FluidSliderProps {
  question: string;
  value: number;
  onChange: (v: number) => void;
  color: string;
  anchors: [string, string, string];
  min?: number;
  max?: number;
}

// ── Component ─────────────────────────────────────────────────────────────────

const FluidSlider = memo(function FluidSlider({
  question,
  value,
  onChange,
  color,
  anchors,
  min = 1,
  max = 9,
}: FluidSliderProps) {
  // ── Layout ─────────────────────────────────────────────────────────────────
  // trackWidthSV is a shared value so gesture worklets can read it without
  // crossing the JS bridge.
  const trackWidthSV = useSharedValue(0);
  const [trackWidth, setTrackWidth] = React.useState(0);

  // ── Gesture state (UI thread) ──────────────────────────────────────────────
  const thumbFraction = useSharedValue((value - min) / (max - min));
  // lastStepSV tracks the last integer step to detect threshold crossings.
  const lastStepSV = useSharedValue(value);

  // ── Sync external value changes (e.g. restoring a saved check-in) ──────────
  const prevValueRef = useRef(value);
  useEffect(() => {
    if (prevValueRef.current !== value) {
      prevValueRef.current = value;
      const newFraction = (value - min) / (max - min);
      thumbFraction.value = withSpring(newFraction, SPRING_CONFIG);
      lastStepSV.value = value;
    }
  }, [value, min, max, thumbFraction, lastStepSV]);

  // ── Idle resonance pulse ───────────────────────────────────────────────────
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [pulse]);

  // ── Derived values for Skia (all run on the UI thread) ────────────────────
  // Thumb pixel position drives both the fill rect width and the thumb/glow cx.
  const thumbX = useDerivedValue(
    () => thumbFraction.value * trackWidthSV.value,
  );

  // U-shaped resonance intensity: maximum at the extremes (0 and 1),
  // minimum at the midpoint. Creates glow that brightens under strong emotion.
  const resonance = useDerivedValue(() => {
    const norm = thumbFraction.value;
    return Math.pow(Math.abs(norm - 0.5) * 2, 1.5);
  });

  const glowOp = useDerivedValue(
    () => 0.05 + resonance.value * (0.22 + pulse.value * 0.16),
  );
  const glowR = useDerivedValue(
    () => 22 + resonance.value * (18 + pulse.value * 8),
  );

  // ── JS-thread callbacks ────────────────────────────────────────────────────
  const fireHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, []);

  // Use a ref so the gesture closure never needs to be recreated when the
  // parent-supplied onChange changes identity.
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
  const reportChange = useCallback((step: number) => {
    onChangeRef.current(step);
  }, []);

  // ── Pan gesture (UI thread) ────────────────────────────────────────────────
  const panGesture = useMemo(() =>
    Gesture.Pan()
      // onBegin fires on initial touch (before any movement threshold),
      // giving instant visual feedback like a tap.
      .onBegin((e) => {
        'worklet';
        const tw = trackWidthSV.value;
        if (tw <= 0) return;
        const fraction = Math.min(1, Math.max(0, e.x / tw));
        // Snap immediately to nearest integer on touch-down.
        const step = Math.round(min + fraction * (max - min));
        const snappedFraction = (step - min) / (max - min);
        thumbFraction.value = snappedFraction;
        if (step !== lastStepSV.value) {
          lastStepSV.value = step;
          runOnJS(fireHaptic)();
          runOnJS(reportChange)(step);
        }
      })
      // onUpdate provides continuous tracking during drag — the thumb follows
      // the finger in real time, entirely on the UI thread.
      .onUpdate((e) => {
        'worklet';
        const tw = trackWidthSV.value;
        if (tw <= 0) return;
        const fraction = Math.min(1, Math.max(0, e.x / tw));
        thumbFraction.value = fraction;
        // Fire haptic + callback exactly when an integer threshold is crossed.
        const step = Math.round(min + fraction * (max - min));
        if (step !== lastStepSV.value) {
          lastStepSV.value = step;
          runOnJS(fireHaptic)();
          runOnJS(reportChange)(step);
        }
      })
      // onEnd: spring-snap to the nearest integer. This is the "physical click"
      // moment — the thumb doesn't simply stop; it springs into place.
      .onEnd(() => {
        'worklet';
        const fraction = thumbFraction.value;
        const step = Math.round(min + fraction * (max - min));
        const targetFraction = (step - min) / (max - min);
        thumbFraction.value = withSpring(targetFraction, SPRING_CONFIG);
        runOnJS(reportChange)(step);
      }),
    [min, max, fireHaptic, reportChange],
  );

  // ── Track Y offsets ────────────────────────────────────────────────────────
  const trackY = TRACK_H / 2 - TRACK_THICKNESS / 2;
  const trackYMid = TRACK_H / 2;

  return (
    <View style={styles.container}>
      {/* Question label */}
      <Text style={styles.question}>{question}</Text>

      {/* Current value badge */}
      <View style={styles.valueRow}>
        <Text style={[styles.valueText, { color }]}>
          {value}
          <Text style={styles.maxText}> / {max}</Text>
        </Text>
      </View>

      {/* Gesture-captured track region */}
      <GestureDetector gesture={panGesture}>
        <View
          style={{ height: TRACK_H }}
          collapsable={false}
          onLayout={(e) => {
            const w = e.nativeEvent.layout.width;
            setTrackWidth(w);
            trackWidthSV.value = w;
          }}
        >
          {trackWidth > 0 && (
            <Canvas
              style={{ width: trackWidth, height: TRACK_H }}
              pointerEvents="none"
            >
              {/* ── 1. Obsidian glass track base ── */}
              <RoundedRect
                x={0}
                y={trackY}
                width={trackWidth}
                height={TRACK_THICKNESS}
                r={TRACK_THICKNESS / 2}
                color="rgba(22, 28, 46, 0.98)"
              />

              {/* ── 2. Top specular micro-highlight (gives depth / concavity) ── */}
              <RoundedRect
                x={1}
                y={trackY}
                width={trackWidth - 2}
                height={4}
                r={4}
                color="rgba(255, 255, 255, 0.055)"
              />

              {/* ── 3. Bottom inner shadow line ── */}
              <RoundedRect
                x={0}
                y={trackYMid}
                width={trackWidth}
                height={TRACK_THICKNESS / 2}
                r={TRACK_THICKNESS / 4}
                color="rgba(0, 0, 0, 0.40)"
              >
                <BlurMask blur={2} style="normal" />
              </RoundedRect>

              {/* ── 4. Gradient fill — width is an animated DerivedValue ── */}
              <RoundedRect
                x={0}
                y={trackY}
                width={thumbX}
                height={TRACK_THICKNESS}
                r={TRACK_THICKNESS / 2}
              >
                {/* Gradient endpoint uses static trackWidth; the RoundedRect
                    clips to thumbX, so only the relevant portion is visible. */}
                <LinearGradient
                  start={vec(0, 0)}
                  end={vec(trackWidth, 0)}
                  colors={[`${color}38`, color]}
                />
              </RoundedRect>

              {/* ── 5. Fill edge glow ── */}
              <RoundedRect
                x={0}
                y={trackY - 3}
                width={thumbX}
                height={TRACK_THICKNESS + 6}
                r={(TRACK_THICKNESS + 6) / 2}
                color={color}
                opacity={0.20}
              >
                <BlurMask blur={11} style="normal" />
              </RoundedRect>

              {/* ── 6. Resonance glow — breathes under thumb at value extremes ── */}
              <Group opacity={glowOp}>
                <Circle cx={thumbX} cy={trackYMid} r={glowR} color={color}>
                  <BlurMask blur={18} style="normal" />
                </Circle>
              </Group>

              {/* ── 7. Thumb drop shadow ── */}
              <Circle
                cx={thumbX}
                cy={trackYMid + 1.5}
                r={THUMB_R + 1}
                color="rgba(0, 0, 0, 0.50)"
              >
                <BlurMask blur={4} style="normal" />
              </Circle>

              {/* ── 8. Thumb body ── */}
              <Circle
                cx={thumbX}
                cy={trackYMid}
                r={THUMB_R}
                color="rgba(16, 22, 36, 1)"
              />

              {/* ── 9. Thumb accent ring (color-matched to metric) ── */}
              <Circle
                cx={thumbX}
                cy={trackYMid}
                r={THUMB_R}
                color={color}
                style="stroke"
                strokeWidth={2}
              />

              {/* ── 10. Thumb catch-light (sub-pixel specular dot) ── */}
              <Circle
                cx={thumbX}
                cy={trackYMid}
                r={THUMB_R - 2}
                color="rgba(255, 255, 255, 0.06)"
              />
              <Circle
                cx={thumbX}
                cy={trackYMid - 3.5}
                r={2.5}
                color="rgba(255, 255, 255, 0.38)"
              >
                <BlurMask blur={1.5} style="solid" />
              </Circle>
            </Canvas>
          )}
        </View>
      </GestureDetector>

      {/* Low / Mid / High anchor labels */}
      <View style={styles.anchorRow}>
        <Text style={[styles.anchor, { textAlign: 'left' }]}>{anchors[0]}</Text>
        <Text style={[styles.anchor, { textAlign: 'center' }]}>{anchors[1]}</Text>
        <Text style={[styles.anchor, { textAlign: 'right' }]}>{anchors[2]}</Text>
      </View>
    </View>
  );
});

export default FluidSlider;

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  question: {
    color: theme.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    opacity: 0.92,
  },
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 10,
  },
  valueText: {
    fontSize: 15,
    fontWeight: '800',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: 'hidden',
  },
  maxText: {
    fontSize: 11,
    color: theme.textMuted,
    fontWeight: '400',
  },
  anchorRow: {
    flexDirection: 'row',
    marginTop: 6,
    paddingHorizontal: 2,
  },
  anchor: {
    flex: 1,
    fontSize: 11,
    color: theme.textMuted,
    opacity: 0.7,
  },
});
