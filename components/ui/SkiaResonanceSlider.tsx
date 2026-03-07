// File: components/ui/SkiaResonanceSlider.tsx
/**
 * SkiaResonanceSlider — Resonance-enhanced metric slider
 *
 * Replaces the standard PanResponder slider with a Skia-powered track
 * that physically vibrates and glows brighter as the user reaches the
 * "Radiant" (10/10) or "Intense" ends of the scale.
 *
 * Layers:
 *   1. Obsidian glass track with subtle specular highlight.
 *   2. Gradient fill whose luminance scales with value.
 *   3. "Resonance glow" — a pulsing radial bloom under the thumb that
 *      intensifies at extreme values.
 *   4. Animated thumb with inner star-point catch-light.
 *
 * Haptic feedback fires on each integer step.
 *
 * Requires: @shopify/react-native-skia 2.x, react-native-reanimated 4.x
 */

import React, { memo, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  Dimensions,
  Platform,
} from 'react-native';
import {
  Canvas,
  Rect,
  RoundedRect,
  Circle,
  Group,
  LinearGradient,
  RadialGradient,
  BlurMask,
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
import { theme } from '../../constants/theme';

const TRACK_H = 48;
const TRACK_R = 12;
const THUMB_R = 12;

// ── Props ───────────────────────────────────────────────────────────────────

interface Props {
  /** Question text */
  question: string;
  /** Current value (1–10) */
  value: number;
  /** Value change handler */
  onChange: (v: number) => void;
  /** Accent colour for the fill/glow */
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
  const [trackWidth, setTrackWidth] = React.useState(0);
  const trackWidthRef = useRef(0);
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const startValueRef = useRef(value);

  useEffect(() => { valueRef.current = value; }, [value]);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  // ── Resonance pulse ──
  const pulseValue = useSharedValue(0);

  useEffect(() => {
    pulseValue.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [pulseValue]);

  // ── Pan responder ──
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => {
        const tw = trackWidthRef.current;
        if (tw > 0) {
          const pct = Math.min(1, Math.max(0, e.nativeEvent.locationX / tw));
          const tapped = Math.round(min + pct * (max - min));
          startValueRef.current = tapped;
          if (tapped !== valueRef.current) {
            valueRef.current = tapped;
            onChangeRef.current(tapped);
            Haptics.selectionAsync().catch(() => {});
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
          Haptics.selectionAsync().catch(() => {});
          onChangeRef.current(clamped);
        }
      },
    })
  ).current;

  // ── Derived layout ──
  const fillPct = (value - min) / (max - min);
  const fillWidth = trackWidth * fillPct;
  const thumbX = fillWidth;

  // Resonance intensity — higher at extremes
  const resonanceIntensity = useMemo(() => {
    const norm = (value - min) / (max - min); // 0–1
    // U-shaped curve: max at 0 and 1, min at 0.5
    return Math.pow(Math.abs(norm - 0.5) * 2, 1.5);
  }, [value, min, max]);

  // Resonance glow opacity (animated)
  const glowOp = useDerivedValue(() => {
    'worklet';
    return 0.05 + resonanceIntensity * (0.2 + pulseValue.value * 0.15);
  });

  const glowR = useDerivedValue(() => {
    'worklet';
    return 20 + resonanceIntensity * (15 + pulseValue.value * 8);
  });

  return (
    <View style={styles.container}>
      {/* Question */}
      <Text style={styles.question}>{question}</Text>

      {/* Value display */}
      <View style={styles.valueRow}>
        <Text style={[styles.valueText, { color }]}>
          {value}<Text style={styles.maxText}> / {max}</Text>
        </Text>
      </View>

      {/* Skia Track */}
      <View
        style={styles.trackContainer}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          setTrackWidth(w);
          trackWidthRef.current = w;
        }}
        {...panResponder.panHandlers}
      >
        {trackWidth > 0 && (
          <Canvas style={[styles.trackCanvas, { width: trackWidth, height: TRACK_H }]} pointerEvents="none" mode="continuous">
            {/* Track background (obsidian glass) */}
            <RoundedRect
              x={0}
              y={TRACK_H / 2 - 4}
              width={trackWidth}
              height={8}
              r={4}
              color="rgba(30, 35, 50, 0.9)"
            />
            {/* Specular highlight */}
            <RoundedRect
              x={0}
              y={TRACK_H / 2 - 4}
              width={trackWidth}
              height={4}
              r={4}
              color="rgba(255, 255, 255, 0.04)"
            />

            {/* Fill */}
            <RoundedRect
              x={0}
              y={TRACK_H / 2 - 4}
              width={fillWidth}
              height={8}
              r={4}
            >
              <LinearGradient
                start={vec(0, 0)}
                end={vec(fillWidth, 0)}
                colors={[`${color}40`, color]}
              />
            </RoundedRect>

            {/* Fill glow */}
            <RoundedRect
              x={0}
              y={TRACK_H / 2 - 6}
              width={fillWidth}
              height={12}
              r={6}
              color={color}
              opacity={0.2}
            >
              <BlurMask blur={8} style="normal" />
            </RoundedRect>

            {/* Resonance glow under thumb */}
            <Group opacity={glowOp}>
              <Circle cx={thumbX} cy={TRACK_H / 2} r={glowR} color={color}>
                <BlurMask blur={15} style="normal" />
              </Circle>
            </Group>

            {/* Thumb */}
            <Group>
              <Circle
                cx={thumbX}
                cy={TRACK_H / 2}
                r={THUMB_R}
                color="rgba(25, 30, 45, 1)"
              />
              <Circle
                cx={thumbX}
                cy={TRACK_H / 2}
                r={THUMB_R}
                color={color}
                style="stroke"
                strokeWidth={2}
              />
              {/* Inner catch-light star */}
              <Circle
                cx={thumbX - 2}
                cy={TRACK_H / 2 - 2}
                r={2.5}
                color="rgba(255, 255, 255, 0.35)"
              >
                <BlurMask blur={1.5} style="solid" />
              </Circle>
            </Group>
          </Canvas>
        )}
      </View>

      {/* Anchors */}
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
    marginBottom: 18,
  },
  question: {
    color: theme.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 8,
  },
  valueText: {
    fontSize: 16,
    fontWeight: '800',
  },
  maxText: {
    fontSize: 12,
    color: theme.textMuted,
    fontWeight: '400',
  },
  trackContainer: {
    height: TRACK_H,
    justifyContent: 'center',
  },
  trackCanvas: {
    height: TRACK_H,
  },
  anchorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  anchor: {
    color: theme.textMuted,
    fontSize: 10,
    fontWeight: '500',
  },
});
