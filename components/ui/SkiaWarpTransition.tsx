// File: components/ui/SkiaWarpTransition.tsx
/**
 * SkiaWarpTransition
 *
 * A full-screen Skia overlay that renders a radial "hyperspace warp"
 * tunnel effect on demand.  Exposed via an imperative ref so any screen
 * can trigger `warpRef.current?.fire()` for navigation transitions.
 *
 * Layers:
 *   1. Radial speed-lines drawn as thin wedge paths emanating from the centre.
 *   2. A bloom ring that expands outward during the burst.
 *   3. A brief flash vignette that fades to transparent.
 *
 * The effect runs for ~600 ms and auto-resets, keeping the overlay
 * completely transparent the rest of the time (zero GPU cost when idle).
 *
 * Requires: @shopify/react-native-skia 2.x, react-native-reanimated 4.x
 */

import React, {
  forwardRef,
  useImperativeHandle,
  useCallback,
  memo,
} from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import {
  Canvas,
  Group,
  Circle,
  Rect,
  Path,
  Skia,
  BlurMask,
  RadialGradient,
  vec,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  useDerivedValue,
  withTiming,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

const { width: W, height: H } = Dimensions.get('window');
const CX = W / 2;
const CY = H / 2;
const MAX_R = Math.hypot(W, H);

// ── Types ───────────────────────────────────────────────────────────────────

export interface WarpRef {
  /** Trigger the warp burst animation. Optional callback fires on completion. */
  fire: (onComplete?: () => void) => void;
}

// ── Speed Lines ─────────────────────────────────────────────────────────────

const LINE_COUNT = 36;
const SPEED_LINES = Array.from({ length: LINE_COUNT }, (_, i) => {
  const angle = (i / LINE_COUNT) * Math.PI * 2;
  const innerR = 40 + Math.random() * 30;
  const outerR = MAX_R * (0.6 + Math.random() * 0.4);
  const width = 0.4 + Math.random() * 0.6; // radians spread
  const halfW = (width * Math.PI) / 180;

  // Thin wedge path from centre outward
  const path = Skia.Path.Make();
  path.moveTo(
    CX + innerR * Math.cos(angle - halfW),
    CY + innerR * Math.sin(angle - halfW),
  );
  path.lineTo(
    CX + outerR * Math.cos(angle),
    CY + outerR * Math.sin(angle),
  );
  path.lineTo(
    CX + innerR * Math.cos(angle + halfW),
    CY + innerR * Math.sin(angle + halfW),
  );
  path.close();
  return path;
});

// ── Component ───────────────────────────────────────────────────────────────

const SkiaWarpTransition = forwardRef<WarpRef>(function SkiaWarpTransition(
  _props,
  ref,
) {
  // 0 = idle, 1 = peak burst
  const progress = useSharedValue(0);
  const completionCb = useSharedValue<(() => void) | null>(null);

  const fire = useCallback(
    (onComplete?: () => void) => {
      if (onComplete) {
        completionCb.value = onComplete;
      }
      const done = () => {
        const cb = completionCb.value;
        completionCb.value = null;
        if (cb) runOnJS(cb)();
      };

      progress.value = withSequence(
        withTiming(1, { duration: 250, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 350, easing: Easing.in(Easing.cubic) }),
      );

      // Fire completion after full duration
      setTimeout(() => done(), 620);
    },
    [],
  );

  useImperativeHandle(ref, () => ({ fire }), [fire]);

  // ── Derived values ──

  const masterOpacity = useDerivedValue(() =>
    progress.value < 0.01 ? 0 : 1,
  );

  const linesOpacity = useDerivedValue(() => progress.value * 0.6);

  const ringRadius = useDerivedValue(() => 20 + progress.value * MAX_R * 0.5);
  const ringOpacity = useDerivedValue(() => progress.value * 0.35);

  const flashOpacity = useDerivedValue(() => {
    // Quick white flash at peak
    if (progress.value > 0.85) return (progress.value - 0.85) * 3;
    return 0;
  });

  return (
    <Canvas
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    >
      <Group opacity={masterOpacity}>
        {/* Speed lines */}
        <Group opacity={linesOpacity}>
          {SPEED_LINES.map((path, i) => (
            <Path
              key={i}
              path={path}
              color="rgba(232, 214, 174, 0.7)"
              style="fill"
            >
              <BlurMask blur={2} style="normal" />
            </Path>
          ))}
        </Group>

        {/* Expanding bloom ring */}
        <Circle
          cx={CX}
          cy={CY}
          r={ringRadius}
          color="transparent"
          style="stroke"
          strokeWidth={3}
          opacity={ringOpacity}
        >
          <BlurMask blur={12} style="outer" />
        </Circle>
        <Circle
          cx={CX}
          cy={CY}
          r={ringRadius}
          color="#C9AE78"
          style="stroke"
          strokeWidth={1.5}
          opacity={ringOpacity}
        />

        {/* Flash vignette */}
        <Rect
          x={0}
          y={0}
          width={W}
          height={H}
          color="white"
          opacity={flashOpacity}
        >
          <BlurMask blur={40} style="normal" />
        </Rect>
      </Group>
    </Canvas>
  );
});

export default memo(SkiaWarpTransition);
