// File: components/ui/SkiaResonanceSlider.tsx
/**
 * SkiaResonanceSlider — Celestial String "Beads of Light" slider
 *
 * Three visual layers drawn in Skia:
 *   1. Track (The String) — 1.5pt dashed line in ghostly silver.
 *   2. Active Fill (The Energy) — colored stroke + animated BlurMask glow.
 *   3. Thumb (The Pearl) — RadialGradient (white→color) + Shadow + pulsing aura.
 *
 * Haptic: impactAsync(Light) fires at every integer step.
 * Floating label: "{value}/{max}" floats above the thumb during active drag.
 * Visual intensity scales with value — dim at 1-2, steady at 5, vibrant+pulsing at 8-9.
 *
 * Requires: @shopify/react-native-skia 2.x, react-native-reanimated 3.x+
 */

import React, { memo, useMemo, useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  Platform,
} from 'react-native';
import {
  Canvas,
  Path,
  Circle,
  Group,
  RadialGradient,
  BlurMask,
  Shadow,
  DashPathEffect,
  Skia,
  vec,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  useDerivedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const TRACK_H = 56;
const THUMB_R = 12;

// ── Props ───────────────────────────────────────────────────────────────────

interface Props {
  /** Slider label (e.g. "Internal Climate") */
  question: string;
  /** Current value (1–9) */
  value: number;
  /** Value change handler */
  onChange: (v: number) => void;
  /** Accent colour for fill/glow/pearl */
  color: string;
  /** Three anchor labels [low, mid, high] */
  anchors: [string, string, string];
  /** Min value (default 1) */
  min?: number;
  /** Max value (default 9) */
  max?: number;
}

// ── Component ───────────────────────────────────────────────────────────────

const SkiaResonanceSlider = memo(function SkiaResonanceSlider({
  question,
  value,
  onChange,
  color,
  anchors,
  min = 1,
  max = 9,
}: Props) {
  const [trackWidth, setTrackWidth] = useState(0);
  const trackWidthRef = useRef(0);
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const startValueRef = useRef(value);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => { valueRef.current = value; }, [value]);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  // ── Continuous pulse (0 → 1, looping) ──
  const pulseValue = useSharedValue(0);
  useEffect(() => {
    pulseValue.value = withRepeat(
      withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [pulseValue]);

  // ── Intensity (0–1) mirrors slider position ──
  const intensitySv = useSharedValue((value - min) / (max - min));
  useEffect(() => {
    intensitySv.value = (value - min) / (max - min);
  }, [value, min, max, intensitySv]);

  // ── isDrag shared value for worklet-side aura expansion ──
  const isDragSv = useSharedValue(0);

  // ── Animated aura opacity ──
  const auraOpacity = useDerivedValue(() => {
    'worklet';
    const base = 0.09 + intensitySv.value * 0.46;
    const dragBoost = isDragSv.value * 0.12;
    const pulse = pulseValue.value * intensitySv.value * 0.2;
    return base + dragBoost + pulse;
  });

  // ── Animated aura radius ──
  const auraR = useDerivedValue(() => {
    'worklet';
    const base = 16 + isDragSv.value * 8;
    const extra = intensitySv.value * 8;
    const pulse = pulseValue.value * intensitySv.value * 6;
    return base + extra + pulse;
  });

  // ── Animated fill glow opacity ──
  const fillGlowOp = useDerivedValue(() => {
    'worklet';
    return 0.06 + intensitySv.value * 0.30 + pulseValue.value * intensitySv.value * 0.12;
  });

  // ── Pan responder ──
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => {
        setIsDragging(true);
        isDragSv.value = 1;
        const tw = trackWidthRef.current;
        if (tw > 0) {
          const pct = Math.min(1, Math.max(0, e.nativeEvent.locationX / tw));
          const tapped = Math.round(min + pct * (max - min));
          startValueRef.current = tapped;
          if (tapped !== valueRef.current) {
            valueRef.current = tapped;
            onChangeRef.current(tapped);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          }
        } else {
          startValueRef.current = valueRef.current;
        }
      },
      onPanResponderMove: (_, gs) => {
        const tw = trackWidthRef.current;
        if (tw === 0) return;
        const deltaPct = gs.dx / tw;
        const raw = startValueRef.current + deltaPct * (max - min);
        const clamped = Math.round(Math.min(max, Math.max(min, raw)));
        if (clamped !== valueRef.current) {
          valueRef.current = clamped;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          onChangeRef.current(clamped);
        }
      },
      onPanResponderRelease: () => { setIsDragging(false); isDragSv.value = 0; },
      onPanResponderTerminate: () => { setIsDragging(false); isDragSv.value = 0; },
    })
  ).current;

  // ── Derived layout ──
  const fillPct = (value - min) / (max - min);
  const fillWidth = trackWidth * fillPct;
  const thumbX = fillWidth;

  // ── Skia paths (rebuilt only when dimensions change) ──
  const trackPath = useMemo(() => {
    if (trackWidth <= 0) return null;
    const p = Skia.Path.Make();
    p.moveTo(0, TRACK_H / 2);
    p.lineTo(trackWidth, TRACK_H / 2);
    return p;
  }, [trackWidth]);

  const fillPath = useMemo(() => {
    if (fillWidth <= 0) return null;
    const p = Skia.Path.Make();
    p.moveTo(0, TRACK_H / 2);
    p.lineTo(fillWidth, TRACK_H / 2);
    return p;
  }, [fillWidth]);

  // ── Floating label position (clamped to track bounds) ──
  const labelLeft = Math.max(
    0,
    Math.min(trackWidth > 0 ? trackWidth - 32 : 0, thumbX - 16),
  );

  return (
    <View style={styles.container}>
      {/* Slider label in accent color, small-caps */}
      <Text style={[styles.question, { color }]}>{question}</Text>

      {/* Touch target + canvas wrapper */}
      <View
        style={styles.trackContainer}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          setTrackWidth(w);
          trackWidthRef.current = w;
        }}
        {...panResponder.panHandlers}
      >
        {/* Floating drag value label */}
        {isDragging && trackWidth > 0 && (
          <View
            style={[styles.floatingLabel, { left: labelLeft }]}
            pointerEvents="none"
          >
            <Text style={[styles.floatingLabelText, { color }]}>
              {value}/{max}
            </Text>
          </View>
        )}

        {trackWidth > 0 && (
          <Canvas
            style={[styles.trackCanvas, { width: trackWidth, height: TRACK_H }]}
            pointerEvents="none"
          >
            {/* ── Layer 1: Track — etched celestial string ── */}
            {trackPath && (
              <Path
                path={trackPath}
                strokeWidth={1.5}
                style="stroke"
                color="rgba(255, 255, 255, 0.1)"
              >
                <DashPathEffect intervals={[3, 4]} phase={0} />
              </Path>
            )}

            {/* ── Layer 2: Active fill — energy traveling the string ── */}
            {fillPath && (
              <Group>
                {/* Soft glow halo behind the line */}
                <Path
                  path={fillPath}
                  strokeWidth={8}
                  style="stroke"
                  color={color}
                  opacity={fillGlowOp}
                >
                  <BlurMask blur={6} style="normal" />
                </Path>
                {/* Crisp fill line on top */}
                <Path
                  path={fillPath}
                  strokeWidth={1.5}
                  style="stroke"
                  color={color}
                  opacity={0.85}
                />
              </Group>
            )}

            {/* ── Layer 3a: Thumb aura — pulsing bloom ── */}
            <Group opacity={auraOpacity}>
              <Circle cx={thumbX} cy={TRACK_H / 2} r={auraR} color={color}>
                <BlurMask blur={15} style="normal" />
              </Circle>
            </Group>

            {/* ── Layer 3b: Thumb pearl — RadialGradient + Shadow ── */}
            <Group>
              <Circle cx={thumbX} cy={TRACK_H / 2} r={THUMB_R}>
                <RadialGradient
                  c={vec(thumbX, TRACK_H / 2)}
                  r={THUMB_R}
                  colors={['#FFFFFF', color]}
                />
                <Shadow dx={0} dy={0} blur={10} color={color} />
              </Circle>
            </Group>
          </Canvas>
        )}
      </View>

      {/* Anchor labels */}
      <View style={styles.anchorRow}>
        <Text style={[styles.anchor, { textAlign: 'left', flex: 1 }]}>{anchors[0]}</Text>
        <Text style={[styles.anchor, { textAlign: 'center', flex: 1 }]}>{anchors[1]}</Text>
        <Text style={[styles.anchor, { textAlign: 'right', flex: 1 }]}>{anchors[2]}</Text>
      </View>
    </View>
  );
});

export default SkiaResonanceSlider;

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  question: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 4,
    paddingLeft: 2,
    fontFamily: Platform.select({ ios: 'SF Pro Text', android: 'sans-serif-medium' }),
  },
  trackContainer: {
    height: TRACK_H,
    justifyContent: 'center',
  },
  trackCanvas: {
    height: TRACK_H,
  },
  floatingLabel: {
    position: 'absolute',
    top: 0,
    zIndex: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(2, 8, 23, 0.75)',
    alignItems: 'center',
  },
  floatingLabelText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    fontFamily: Platform.select({ ios: 'SF Pro Text', android: 'sans-serif-medium' }),
  },
  anchorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  anchor: {
    color: 'rgba(255, 255, 255, 0.35)',
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});
