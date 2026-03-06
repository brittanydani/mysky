// File: components/ui/SkiaRestorationField.tsx
/**
 * SkiaRestorationField — "The Liquid Night"
 *
 * A GPU-driven displacement-map effect for the Sleep screen background.
 * Sleep quality (1–5) controls the visual clarity:
 *   - Quality 1–2 → diffused, low-opacity indigo fog ("restless night")
 *   - Quality 3   → mid-clarity amethyst field
 *   - Quality 4–5 → radiant silver-blue, clear and luminous ("deep restoration")
 *
 * Architecture:
 *   - Animated concentric rings simulate a "restoration field" radiating
 *     from the screen centre.
 *   - A slow breathing animation modulates ring radii for organic life.
 *   - Quality-dependent colour interpolation gives instant visual feedback.
 *
 * Requires: @shopify/react-native-skia 2.x, react-native-reanimated 4.x
 */

import React, { memo, useEffect } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import {
  Canvas,
  Circle,
  Group,
  RadialGradient,
  Rect,
  vec,
  BlurMask,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  useDerivedValue,
  useFrameCallback,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const { width: W, height: H } = Dimensions.get('window');
const CX = W / 2;
const CY = H * 0.35;
const MAX_R = Math.max(W, H) * 0.8;

// ── Quality-keyed palettes ──────────────────────────────────────────────────

interface RestorationPalette {
  core: string;
  mid: string;
  outer: string;
  fog: string;
  coreAlpha: number;
  midAlpha: number;
}

function paletteForQuality(q: number): RestorationPalette {
  if (q <= 2) {
    // Restless — diffused indigo
    return {
      core: 'rgba(60, 50, 120, 0.20)',
      mid: 'rgba(40, 35, 90, 0.12)',
      outer: 'rgba(30, 25, 60, 0.06)',
      fog: 'rgba(50, 40, 80, 0.08)',
      coreAlpha: 0.15,
      midAlpha: 0.08,
    };
  }
  if (q <= 3) {
    // Moderate — amethyst transition
    return {
      core: 'rgba(100, 70, 160, 0.18)',
      mid: 'rgba(80, 60, 140, 0.10)',
      outer: 'rgba(60, 45, 100, 0.05)',
      fog: 'rgba(80, 60, 130, 0.06)',
      coreAlpha: 0.18,
      midAlpha: 0.10,
    };
  }
  // Deep restoration — radiant silver-blue
  return {
    core: 'rgba(139, 196, 232, 0.22)',
    mid: 'rgba(100, 160, 210, 0.14)',
    outer: 'rgba(70, 120, 180, 0.06)',
    fog: 'rgba(120, 180, 220, 0.05)',
    coreAlpha: 0.22,
    midAlpha: 0.14,
  };
}

// ── Ring Layer ───────────────────────────────────────────────────────────────

const RING_COUNT = 5;

// ── Props ───────────────────────────────────────────────────────────────────

interface Props {
  /** Sleep quality 1–5 */
  quality: number;
  /** Optional override for height */
  height?: number;
}

// ── Component ───────────────────────────────────────────────────────────────

const SkiaRestorationField = memo(function SkiaRestorationField({
  quality,
  height = H * 0.5,
}: Props) {
  const q = Math.max(1, Math.min(5, quality));
  const palette = paletteForQuality(q);

  // ── Slow breathing animation ──
  const breathValue = useSharedValue(0);

  useEffect(() => {
    breathValue.value = withRepeat(
      withTiming(1, { duration: 6000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [breathValue]);

  // ── Time for orbital drift ──
  const time = useSharedValue(0);
  useFrameCallback((info) => {
    'worklet';
    time.value = (info.timeSinceFirstFrame ?? 0) / 1000;
  });

  // Ring animations — each ring breathes at slightly different phases
  const ringRadii = Array.from({ length: RING_COUNT }, (_, i) => {
    const baseR = (MAX_R * (i + 1)) / (RING_COUNT + 1);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useDerivedValue(() => {
      'worklet';
      const phase = i * 0.3;
      const pulse = Math.sin(breathValue.value * Math.PI + phase) * 15;
      return baseR + pulse;
    });
  });

  const ringOpacities = Array.from({ length: RING_COUNT }, (_, i) => {
    const baseOpacity = 0.06 + (q / 5) * 0.08 - i * 0.015;
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useDerivedValue(() => {
      'worklet';
      const flicker = Math.sin(breathValue.value * Math.PI + i * 0.5) * 0.02;
      return Math.max(0.01, baseOpacity + flicker);
    });
  });

  // Core glow intensity scales with quality
  const coreRadius = useDerivedValue(() => {
    'worklet';
    return 60 + q * 20 + breathValue.value * 20;
  });

  const coreOpacity = useDerivedValue(() => {
    'worklet';
    return palette.coreAlpha + breathValue.value * 0.04;
  });

  return (
    <Canvas style={[styles.canvas, { height }]} pointerEvents="none">
      {/* ── Restoration Rings ── */}
      <Group>
        {ringRadii.map((r, i) => (
          <Circle
            key={`ring-${i}`}
            cx={CX}
            cy={CY}
            r={r}
            color={i % 2 === 0 ? palette.core : palette.mid}
            opacity={ringOpacities[i]}
            style="stroke"
            strokeWidth={1.5}
          >
            <BlurMask blur={8 + i * 3} style="normal" />
          </Circle>
        ))}
      </Group>

      {/* ── Central Restoration Core ── */}
      <Group opacity={coreOpacity}>
        <Circle cx={CX} cy={CY} r={coreRadius}>
          <RadialGradient
            c={vec(CX, CY)}
            r={200}
            colors={[palette.core, palette.mid, 'transparent']}
          />
          <BlurMask blur={35} style="normal" />
        </Circle>
      </Group>

      {/* ── Ambient Fog Layer ── */}
      <Rect x={0} y={0} width={W} height={height} color={palette.fog}>
        <BlurMask blur={60} style="normal" />
      </Rect>

      {/* ── Vignette ── */}
      <Rect x={0} y={0} width={W} height={height}>
        <RadialGradient
          c={vec(CX, CY)}
          r={MAX_R}
          colors={['transparent', 'rgba(7, 9, 15, 0.7)']}
        />
      </Rect>
    </Canvas>
  );
});

export default SkiaRestorationField;

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  canvas: {
    ...StyleSheet.absoluteFillObject,
    width: W,
  },
});
