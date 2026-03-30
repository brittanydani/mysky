/**
 * BreathingMandala.tsx
 * MySky — Six-Ring Seed-of-Life Glow Mandala (Skia + Reanimated)
 *
 * Architecture:
 *   • 6 luminous rings arranged in seed-of-life (hexagonal) geometry
 *   • Each ring center is at distance OFFSET from the canvas center,
 *     at 60° increments, so all rings pass through the center point
 *   • blendMode="screen" on the glow Group → where rings intersect,
 *     RGB values add together → intense white-hot hotspots
 *   • Each ring breathes with a slightly different phase offset for
 *     an organic, living quality — like six lungs breathing together
 *   • Center golden core pulses in phase with the whole
 *   • Orbiting comet dot for visual motion at rest
 *
 * No PNG · No SVG · Pure Skia path math + Reanimated UI-thread physics
 */

import React, { memo, useEffect, useMemo } from 'react';
import {
  Canvas,
  Circle,
  Group,
  Path,
  Skia,
  BlurMask,
  vec,
  RadialGradient,
  SweepGradient,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  useDerivedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import {
  METALLIC_GOLD,
  METALLIC_BLUE,
  METALLIC_LOVE,
  METALLIC_PURPLE,
  METALLIC_GREEN,
  METALLIC_COPPER,
} from '../../constants/metallicPalettes';

// ── Ring colours (one per life domain) ──────────────────────────────────────
// Flat base colours kept for glow tints; metallic gradients used for strokes.

const RING_COLORS = [
  '#C5B5A1', // Mood    — champagne gold
  '#49DFFF', // Energy  — electric cyan
  '#FF6B9D', // Stress  — rose pink
  '#9D76C1', // Focus   — violet
  '#6EBF8B', // Rest    — emerald
  '#FF9A3C', // Growth  — amber
] as const;

const RING_METALLIC: readonly (readonly string[])[] = [
  METALLIC_GOLD,   // Mood
  METALLIC_BLUE,   // Energy
  METALLIC_LOVE,   // Stress
  METALLIC_PURPLE, // Focus
  METALLIC_GREEN,  // Rest
  METALLIC_COPPER, // Growth
];

// Sweep positions for 5-stop symmetric metallic: light→mid→core→mid→light
const METALLIC_POSITIONS = [0.0, 0.25, 0.5, 0.75, 1.0] as const;

// ── Props ────────────────────────────────────────────────────────────────────

interface Props {
  size?: number;
}

// ── Component ────────────────────────────────────────────────────────────────

export const BreathingMandala = memo(function BreathingMandala({ size = 300 }: Props) {
  const cx = size / 2;
  const cy = size / 2;

  // Distance from canvas center to each ring's center
  const OFFSET = size * 0.268;
  // Ring stroke radius (= OFFSET so all rings pass through center → seed of life)
  const BASE_RING_R = OFFSET;
  // Breathing amplitude — ring glow radii expand/contract by this much
  const BREATH_AMP = size * 0.022;
  // Base glow radius — slightly larger than stroke radius for bloom
  const BASE_GLOW_R = OFFSET * 1.12;

  // ── Primary breath oscillator (0 → 1 → 0, period 4 s) ───────────────────
  const breath = useSharedValue(0);
  useEffect(() => {
    breath.value = withRepeat(
      withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [breath]);

  // ── Comet orbit ───────────────────────────────────────────────────────────
  const orbitAngle = useSharedValue(0);
  useEffect(() => {
    orbitAngle.value = withRepeat(
      withTiming(Math.PI * 2, { duration: 11000, easing: Easing.linear }),
      -1,
      false,
    );
  }, [orbitAngle]);

  // ── Per-ring animated glow radii (phase-shifted for organic feel) ─────────
  // Phase offsets: 0°, 60°, 120°, 180°, 240°, 300° scaled to turn fraction
  const glowR0 = useDerivedValue(() => BASE_GLOW_R + Math.sin(breath.value * Math.PI * 2 + 0)              * BREATH_AMP);
  const glowR1 = useDerivedValue(() => BASE_GLOW_R + Math.sin(breath.value * Math.PI * 2 + Math.PI / 3)    * BREATH_AMP);
  const glowR2 = useDerivedValue(() => BASE_GLOW_R + Math.sin(breath.value * Math.PI * 2 + 2*Math.PI / 3)  * BREATH_AMP);
  const glowR3 = useDerivedValue(() => BASE_GLOW_R + Math.sin(breath.value * Math.PI * 2 + Math.PI)        * BREATH_AMP);
  const glowR4 = useDerivedValue(() => BASE_GLOW_R + Math.sin(breath.value * Math.PI * 2 + 4*Math.PI / 3)  * BREATH_AMP);
  const glowR5 = useDerivedValue(() => BASE_GLOW_R + Math.sin(breath.value * Math.PI * 2 + 5*Math.PI / 3)  * BREATH_AMP);

  const glowRadii = [glowR0, glowR1, glowR2, glowR3, glowR4, glowR5];

  // ── Center halo (breathes with the whole system) ──────────────────────────
  const centerHaloR = useDerivedValue(() => size * 0.10 + breath.value * size * 0.025);
  const centerCoreR = useDerivedValue(() => size * 0.048 + breath.value * size * 0.010);

  // ── Comet position ────────────────────────────────────────────────────────
  const cometOrbitR = BASE_RING_R + size * 0.03;
  const cometX = useDerivedValue(() => cx + cometOrbitR * Math.cos(orbitAngle.value - Math.PI / 2));
  const cometY = useDerivedValue(() => cy + cometOrbitR * Math.sin(orbitAngle.value - Math.PI / 2));
  const cometOpacity = useDerivedValue(() => 0.45 + breath.value * 0.35);

  // ── Static ring geometry (seed-of-life positions) ─────────────────────────
  const ringCenters = useMemo(() =>
    Array.from({ length: 6 }, (_, i) => {
      const angle = (i / 6) * Math.PI * 2; // 0°, 60°, 120° …
      return {
        x: cx + Math.cos(angle) * OFFSET,
        y: cy + Math.sin(angle) * OFFSET,
      };
    }),
    [cx, cy, OFFSET],
  );

  // ── Static ring stroke paths ───────────────────────────────────────────────
  const ringPaths = useMemo(() =>
    ringCenters.map(({ x, y }) => {
      const p = Skia.Path.Make();
      p.addCircle(x, y, BASE_RING_R);
      return p;
    }),
    [ringCenters, BASE_RING_R],
  );

  // ── Background radiance ────────────────────────────────────────────────────
  const bgRadius = size * 0.50;

  return (
    <Canvas style={{ width: size, height: size }}>

      {/* Subtle radial glow behind the whole mandala */}
      <Circle cx={cx} cy={cy} r={bgRadius}>
        <RadialGradient
          c={vec(cx, cy)}
          r={bgRadius}
          colors={['rgba(201,174,120,0.06)', 'transparent']}
          positions={[0, 1]}
        />
      </Circle>

      {/* ── LAYER 1: soft diffuse ring glows (blendMode=screen) ──────────────
           Large, heavily blurred circles centered on each seed-of-life ring.
           Where multiple glows overlap, screen-blending adds RGB values →
           near-white hotspots at intersections.                               */}
      <Group blendMode="screen">
        {ringCenters.map(({ x, y }, i) => (
          <Circle
            key={`glow-${i}`}
            cx={x}
            cy={y}
            r={glowRadii[i]}
            color={RING_COLORS[i] + '30'} // ~19% opacity tint
          >
            <BlurMask blur={size * 0.07} style="normal" />
          </Circle>
        ))}
      </Group>

      {/* ── LAYER 2: crisp ring strokes with moderate glow (blendMode=screen) ─
           These define the actual ring geometry — a seed-of-life pattern.
           Each ring passes through the canvas center and through 2 neighbours.
           With screen blend, the four-way intersections near the center
           produce the brightest hotspot of all.                               */}
      <Group blendMode="screen">
        {ringPaths.map((path, i) => (
          <Path
            key={`ring-glow-${i}`}
            path={path}
            style="stroke"
            strokeWidth={size * 0.055}
            strokeCap="round"
            opacity={0.22}
          >
            <SweepGradient
              c={vec(ringCenters[i].x, ringCenters[i].y)}
              colors={[...RING_METALLIC[i]]}
              positions={[...METALLIC_POSITIONS]}
            />
            <BlurMask blur={size * 0.04} style="normal" />
          </Path>
        ))}
      </Group>

      {/* ── LAYER 3: thin bright ring lines with metallic sweep (normal blend) ─
           These sit on top of the glow layers and give crisp structural
           definition to each ring with a brushed-metal gradient.              */}
      {ringPaths.map((path, i) => (
        <Path
          key={`ring-line-${i}`}
          path={path}
          style="stroke"
          strokeWidth={1.2}
          opacity={0.65}
        >
          <SweepGradient
            c={vec(ringCenters[i].x, ringCenters[i].y)}
            colors={[...RING_METALLIC[i]]}
            positions={[...METALLIC_POSITIONS]}
          />
        </Path>
      ))}

      {/* ── LAYER 4: Center golden core ──────────────────────────────────────
           Animated halo + bright dot at the convergence point (where all
           6 rings cross) to anchor the mandala visually.                     */}
      <Circle cx={cx} cy={cy} r={centerHaloR} color="rgba(201,174,120,0.20)">
        <BlurMask blur={12} style="normal" />
      </Circle>
      <Circle cx={cx} cy={cy} r={centerCoreR} color="rgba(255,235,160,0.75)" />
      <Circle cx={cx} cy={cy} r={size * 0.022} color="rgba(255,252,240,0.95)" />

      {/* ── LAYER 5: Orbiting comet ───────────────────────────────────────────
           A soft travelling light orbiting just outside the outermost ring
           cross-section — signals that the system is alive and moving.      */}
      <Circle cx={cometX} cy={cometY} r={size * 0.025} color="rgba(255,245,200,0.18)">
        <BlurMask blur={7} style="normal" />
      </Circle>
      <Circle cx={cometX} cy={cometY} r={size * 0.012} color="rgba(255,245,200,0.90)" opacity={cometOpacity} />

    </Canvas>
  );
});

export default BreathingMandala;
