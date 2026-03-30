// File: components/ui/NebulaBackground.tsx
//
// Skia-powered animated nebula background for the Mood screen.
// Creates layered, drifting gas-cloud blobs whose hues shift based on the
// user's current mood score (1–10).
//
// Architecture:
// - useFrameCallback drives a shared `time` value at 60/120 FPS with zero
//   React re-renders.
// - Each cloud layer's position, radius and color are derived values that
//   smoothly orbit on Lissajous curves so the scene feels alive.
// - A cinematic vignette is composited on top to keep edges dark.
//
// Mood → Color mapping:
//   1–3 (low)    → deep indigo / cool violet   — introspective, heavy
//   4–6 (mid)    → amethyst / dusty copper      — balanced, reflective
//   7–10 (high)  → warm gold / soft rose         — uplifted, vibrant

import React, { memo, useMemo } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import {
  Canvas,
  Group,
  RadialGradient,
  Rect,
  vec,
  Blur,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  useDerivedValue,
  useFrameCallback,
} from 'react-native-reanimated';

const { width: W, height: H } = Dimensions.get('window');

// ── Mood → Color Palette ────────────────────────────────────────────────────

interface MoodPalette {
  /** Primary gas cloud tint */
  primary: string;
  /** Secondary cloud tint (offset position) */
  secondary: string;
  /** Faint tertiary bloom */
  tertiary: string;
  /** Primary opacity 0–1 */
  primaryAlpha: number;
  /** Secondary opacity */
  secondaryAlpha: number;
}

function moodToPalette(mood: number): MoodPalette {
  if (mood <= 3) {
    // Low — cool indigo, muted violet
    return {
      primary: 'rgba(60, 50, 140, ALPHA)',
      secondary: 'rgba(40, 60, 120, ALPHA)',
      tertiary: 'rgba(80, 50, 100, 0.05)',
      primaryAlpha: 0.14,
      secondaryAlpha: 0.08,
    };
  }
  if (mood <= 6) {
    // Mid — amethyst, dusty copper
    return {
      primary: 'rgba(100, 70, 180, ALPHA)',
      secondary: 'rgba(180, 130, 70, ALPHA)',
      tertiary: 'rgba(120, 80, 160, 0.04)',
      primaryAlpha: 0.12,
      secondaryAlpha: 0.07,
    };
  }
  // High — warm gold, soft rose
  return {
    primary: 'rgba(232, 214, 174, ALPHA)',
    secondary: 'rgba(220, 120, 150, ALPHA)',
    tertiary: 'rgba(232, 214, 174, 0.06)',
    primaryAlpha: 0.13,
    secondaryAlpha: 0.09,
  };
}

// Pre-compute static palette strings (we only need 3 tiers)
const PALETTES = {
  low: moodToPalette(2),
  mid: moodToPalette(5),
  high: moodToPalette(8),
};

function tierForMood(mood: number): 'low' | 'mid' | 'high' {
  if (mood <= 3) return 'low';
  if (mood <= 6) return 'mid';
  return 'high';
}

// ── Cloud Layer ─────────────────────────────────────────────────────────────

interface CloudSpec {
  /** Lissajous orbit centre */
  cx: number;
  cy: number;
  /** Orbit amplitude x/y */
  ax: number;
  ay: number;
  /** Phase offsets for x, y */
  phaseX: number;
  phaseY: number;
  /** Orbit speed multiplier */
  speed: number;
  /** Base radius */
  r: number;
  /** Radius pulsation amplitude */
  rPulse: number;
}

const CLOUDS: CloudSpec[] = [
  // Primary cloud — upper-right drift
  { cx: W * 0.65, cy: H * 0.18, ax: W * 0.08, ay: H * 0.04, phaseX: 0, phaseY: Math.PI / 3, speed: 0.15, r: Math.max(W, H) * 0.55, rPulse: 20 },
  // Secondary cloud — lower-left
  { cx: W * 0.25, cy: H * 0.75, ax: W * 0.06, ay: H * 0.05, phaseX: Math.PI / 2, phaseY: 0, speed: 0.12, r: Math.max(W, H) * 0.45, rPulse: 15 },
  // Tertiary wisp — centre
  { cx: W * 0.50, cy: H * 0.45, ax: W * 0.10, ay: H * 0.06, phaseX: Math.PI, phaseY: Math.PI / 4, speed: 0.10, r: Math.max(W, H) * 0.35, rPulse: 12 },
];

const NebulaCloud = memo(function NebulaCloud({
  spec,
  time,
  colors,
  blur,
}: {
  spec: CloudSpec;
  time: { value: number };
  colors: string[];
  blur: number;
}) {
  const cx = useDerivedValue(() => {
    const t = (time.value / 1000) * spec.speed;
    return spec.cx + spec.ax * Math.sin(t + spec.phaseX);
  });

  const cy = useDerivedValue(() => {
    const t = (time.value / 1000) * spec.speed;
    return spec.cy + spec.ay * Math.cos(t + spec.phaseY);
  });

  const r = useDerivedValue(() => {
    const t = (time.value / 1000) * spec.speed * 0.7;
    return spec.r + spec.rPulse * Math.sin(t * 1.3);
  });

  const center = useDerivedValue(() => vec(cx.value, cy.value));

  return (
    <Rect x={0} y={0} width={W} height={H}>
      <RadialGradient
        c={center}
        r={r}
        colors={colors}
      />
      <Blur blur={blur} />
    </Rect>
  );
});

// ── Main Component ──────────────────────────────────────────────────────────

interface NebulaBackgroundProps {
  /** Current mood score (1–10). Controls nebula colour scheme. */
  mood?: number;
  /** Current energy score (1–10). Modulates cloud drift speed. */
  energy?: number;
}

function NebulaBackground({ mood = 5, energy = 5 }: NebulaBackgroundProps) {
  // Energy modulates the animation speed multiplier (0.6x–1.8x)
  const energySpeedFactor = 0.6 + (energy / 10) * 1.2;
  const tier = tierForMood(mood);
  const palette = PALETTES[tier];

  // Build colour arrays for each cloud layer
  const primaryColors = useMemo(
    () => [
      palette.primary.replace('ALPHA', String(palette.primaryAlpha)),
      palette.primary.replace('ALPHA', String(palette.primaryAlpha * 0.3)),
      'transparent',
    ],
    [palette],
  );

  const secondaryColors = useMemo(
    () => [
      palette.secondary.replace('ALPHA', String(palette.secondaryAlpha)),
      palette.secondary.replace('ALPHA', String(palette.secondaryAlpha * 0.25)),
      'transparent',
    ],
    [palette],
  );

  const tertiaryColors = useMemo(
    () => [palette.tertiary, 'transparent'],
    [palette],
  );

  // Frame-driven animation clock — energy scales the perceived time
  const time = useSharedValue(0);
  useFrameCallback((frameInfo) => {
    if (frameInfo.timeSinceFirstFrame !== undefined) {
      time.value = frameInfo.timeSinceFirstFrame * energySpeedFactor;
    }
  });

  const center = vec(W / 2, H / 2);
  const maxR = Math.max(W, H);

  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Base deep space layer */}
      <Rect x={0} y={0} width={W} height={H} color="#020817" />

      {/* Subtle radial depth gradient */}
      <Rect x={0} y={0} width={W} height={H}>
        <RadialGradient
          c={center}
          r={maxR}
          colors={['#0D1526', '#070B12', '#030406']}
          positions={[0, 0.5, 1]}
        />
      </Rect>

      {/* ── Animated Gas Clouds ── */}
      <Group>
        <NebulaCloud
          spec={CLOUDS[0]}
          time={time}
          colors={primaryColors}
          blur={50}
        />
        <NebulaCloud
          spec={CLOUDS[1]}
          time={time}
          colors={secondaryColors}
          blur={45}
        />
        <NebulaCloud
          spec={CLOUDS[2]}
          time={time}
          colors={tertiaryColors}
          blur={55}
        />
      </Group>

      {/* Faint dust band across centre — mood-tinted */}
      <Rect x={0} y={H * 0.35} width={W} height={H * 0.3}>
        <RadialGradient
          c={vec(W * 0.5, H * 0.5)}
          r={W * 0.8}
          colors={[
            palette.primary.replace('ALPHA', '0.04'),
            'transparent',
          ]}
        />
        <Blur blur={60} />
      </Rect>

      {/* Cinematic vignette — darkens edges for depth */}
      <Rect x={0} y={0} width={W} height={H}>
        <RadialGradient
          c={center}
          r={maxR * 1.1}
          colors={['transparent', 'transparent', 'rgba(0,0,0,0.75)']}
          positions={[0, 0.4, 1]}
        />
      </Rect>
    </Canvas>
  );
}

export default memo(NebulaBackground);
