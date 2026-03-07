// File: components/ui/SkiaDreamEngine.tsx
/**
 * SkiaDreamEngine
 * Visualizes psychological dream archetypes using sigil geometry.
 * Features: Subconscious Blur, Archetypal Morphology, and Jewel-Tone Shaders.
 *
 * Each sigil is a unique geometric construction based on the archetype:
 *   Shadow         – Inverted, sharp-edged polygon with deep Amethyst light.
 *   Self           – Radiant, perfect circle with a Golden core flare.
 *   Anima          – Fluid, organic curves with a Silver-Blue aura.
 *   Transformation – Dual-triangle "Hourglass" with a Copper glow.
 *   Persona        – Masked square outline in spectral White.
 *   Threshold      – Liminal crosshairs in Emerald.
 *   Integration    – Convergent diagonals in Warm Gold.
 *
 * Intensity Mapping:
 *   Tie the `intensity` prop (0–1) to keyword frequency in dream text.
 *   One keyword match → faint sigil. Many keywords → maximum radiance.
 *
 * Requires: @shopify/react-native-skia 2.x
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Canvas,
  Path,
  Skia,
  BlurMask,
  Circle,
  Group,
  LinearGradient,
  Morphology,
  vec,
} from '@shopify/react-native-skia';
import { DreamArchetype } from '../../constants/dreamSymbols';

// ─── Layout Constants ─────────────────────────────────────────────────────────

const SIGIL_SIZE = 100;
const CENTER = SIGIL_SIZE / 2;

// ─── Archetype Visual Configurations ──────────────────────────────────────────

/**
 * Build a circular SVG path string centred on (cx, cy) with the given radius.
 * Uses two arcs so the path is closed and fillable.
 */
function circlePath(cx: number, cy: number, r: number): string {
  return [
    `M ${cx} ${cy - r}`,
    `A ${r} ${r} 0 1 1 ${cx} ${cy + r}`,
    `A ${r} ${r} 0 1 1 ${cx} ${cy - r}`,
    'Z',
  ].join(' ');
}

const ARCHETYPE_CONFIG: Record<DreamArchetype, { color: string; path: string }> = {
  // ── Shadow ── inverted triangle pointing downward
  Shadow: {
    color: '#9D76C1', // Amethyst
    path: `M ${CENTER} ${CENTER + 20} L ${CENTER - 25} ${CENTER - 15} L ${CENTER + 25} ${CENTER - 15} Z`,
  },

  // ── Self ── perfect circle
  Self: {
    color: '#C9AE78', // Gold
    path: circlePath(CENTER, CENTER, 30),
  },

  // ── Anima ── organic double-curve (infinity-like lemniscate)
  Anima: {
    color: '#8BC4E8', // Silver-Blue
    path: [
      `M ${CENTER - 20} ${CENTER}`,
      `C ${CENTER - 20} ${CENTER - 40}, ${CENTER + 20} ${CENTER - 40}, ${CENTER + 20} ${CENTER}`,
      `S ${CENTER - 20} ${CENTER + 40}, ${CENTER - 20} ${CENTER}`,
    ].join(' '),
  },

  // ── Transformation ── hourglass (two opposing triangles)
  Transformation: {
    color: '#CD7F5D', // Copper
    path: [
      // upper triangle
      `M ${CENTER} ${CENTER - 28}`,
      `L ${CENTER - 22} ${CENTER}`,
      `L ${CENTER + 22} ${CENTER}`,
      'Z',
      // lower triangle
      `M ${CENTER} ${CENTER + 28}`,
      `L ${CENTER - 22} ${CENTER}`,
      `L ${CENTER + 22} ${CENTER}`,
      'Z',
    ].join(' '),
  },

  // ── Persona ── masked square
  Persona: {
    color: '#FFFFFF',
    path: `M ${CENTER - 20} ${CENTER - 20} H ${CENTER + 20} V ${CENTER + 20} H ${CENTER - 20} Z`,
  },

  // ── Threshold ── liminal crosshairs
  Threshold: {
    color: '#6EBF8B', // Emerald
    path: `M ${CENTER - 30} ${CENTER} L ${CENTER + 30} ${CENTER} M ${CENTER} ${CENTER - 30} L ${CENTER} ${CENTER + 30}`,
  },

  // ── Integration ── convergent diagonals
  Integration: {
    color: '#E9D9B8', // Warm Gold
    path: `M ${CENTER - 20} ${CENTER - 20} L ${CENTER + 20} ${CENTER + 20} M ${CENTER + 20} ${CENTER - 20} L ${CENTER - 20} ${CENTER + 20}`,
  },
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  /** Which Jungian archetype the sigil represents. */
  archetype: DreamArchetype;
  /** 0.0 → faint trace … 1.0 → maximum radiance (based on keyword frequency). */
  intensity: number;
  /** Optional override for sigil width/height (default 100 × 100). */
  size?: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SkiaDreamEngine({ archetype, intensity, size }: Props) {
  const config = ARCHETYPE_CONFIG[archetype];
  // Clamp intensity to [0, 1]
  const i = Math.max(0, Math.min(1, intensity));
  const s = size ?? SIGIL_SIZE;
  const scale = s / SIGIL_SIZE;

  return (
    <View style={styles.container}>
      <Canvas style={{ width: s, height: s }}>
        <Group transform={[{ scale }]}>
          {/* ── 1. Subconscious Echo (Background Glow) ────────────────── */}
          <Path
            path={config.path}
            color={config.color}
            opacity={0.2 * i}
          >
            <BlurMask blur={15} style="normal" />
            <Morphology radius={5} />
          </Path>

          {/* ── 2. The Primary Sigil ──────────────────────────────────── */}
          <Path
            path={config.path}
            style="stroke"
            strokeWidth={2}
            color={config.color}
            strokeCap="round"
            strokeJoin="round"
          >
            <BlurMask blur={3 * i} style="outer" />
            <LinearGradient
              start={vec(0, 0)}
              end={vec(SIGIL_SIZE, SIGIL_SIZE)}
              colors={[config.color, 'white', config.color]}
            />
          </Path>

          {/* ── 3. Center Spark (The "Insight" point) ─────────────────── */}
          <Circle cx={CENTER} cy={CENTER} r={2} color="white">
            <BlurMask blur={4} style="solid" />
          </Circle>
        </Group>
      </Canvas>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
