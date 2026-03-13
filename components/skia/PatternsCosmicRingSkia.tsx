/**
 * PatternsCosmicRingSkia.tsx
 * MySky — Breathing Sacred Geometry Mandala (Skia + Reanimated)
 *
 * Architecture:
 *   • 8 orbital nodes drawn with overlapping Skia Circles
 *   • blendMode="screen" on the glow Group — where circles overlap, colors
 *     mathematically add together → intense bright-white energy hotspots
 *   • Slow "breath" SharedValue drives all node radii simultaneously
 *   • Inner-ring halo also breathes, phase-shifted for organic feel
 *   • Rotating comet dot orbits the outer ring
 *   • No PNG · No SVG assets · Pure algorithmic sacred geometry
 */
import React, { memo, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  Canvas,
  Circle,
  Group,
  Path,
  Skia,
  BlurMask,
  BlendMode,
  vec,
  RadialGradient,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  useDerivedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface Props {
  size?:       number;
  monthLabel?: string;
  title?:      string;
  subtitle?:   string;
}

const NODE_COLORS = [
  '#FFDA03', // Mood       — warm gold
  '#49DFFF', // Energy     — cyan
  '#FF5A5F', // Stress     — rose
  '#4EA3FF', // Focus      — sky blue
  '#C86BFF', // Connection — violet
  '#9ACD32', // Rest       — lime
  '#FF9A3C', // Growth     — amber
  '#5CADFF', // Flow       — periwinkle
];

function nodeAngle(i: number, total: number): number {
  return (i / total) * Math.PI * 2 - Math.PI / 2;
}

function nodePos(i: number, total: number, cx: number, cy: number, r: number) {
  const a = nodeAngle(i, total);
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

export function PatternsCosmicRingSkia({ size = 280, monthLabel, title, subtitle }: Props) {
  const cx     = size / 2;
  const cy     = size / 2;
  const outerR = size * 0.40;
  const innerR = size * 0.22;
  const nodeCount = NODE_COLORS.length;

  // ── Breathing oscillator ─────────────────────────────────────────────────────
  const breath = useSharedValue(0);
  useEffect(() => {
    breath.value = withRepeat(
      withTiming(1, { duration: 3800, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [breath]);

  // Comet orbit
  const orbitAngle = useSharedValue(0);
  useEffect(() => {
    orbitAngle.value = withRepeat(
      withTiming(Math.PI * 2, { duration: 9000, easing: Easing.linear }),
      -1,
      false,
    );
  }, [orbitAngle]);

  // Animated derived values (drive Skia on the UI thread via Reanimated)
  const nodeGlowR  = useDerivedValue(() => size * 0.072 + breath.value * size * 0.026);
  const nodeCoreR  = useDerivedValue(() => size * 0.032 + breath.value * size * 0.010);
  const centerHalo = useDerivedValue(() => size * 0.11  + breath.value * size * 0.035);
  const innerHalo  = useDerivedValue(() => size * 0.055 + breath.value * size * 0.014);
  const cometX     = useDerivedValue(() => cx + outerR * Math.cos(orbitAngle.value - Math.PI / 2));
  const cometY     = useDerivedValue(() => cy + outerR * Math.sin(orbitAngle.value - Math.PI / 2));
  const cometOpacity = useDerivedValue(() => 0.55 + breath.value * 0.30);

  // Static paths (computed once)
  const orbitPath = useMemo(() => {
    const p = Skia.Path.Make();
    p.addCircle(cx, cy, outerR);
    return p;
  }, [cx, cy, outerR]);

  const innerPath = useMemo(() => {
    const p = Skia.Path.Make();
    p.addCircle(cx, cy, innerR);
    return p;
  }, [cx, cy, innerR]);

  const spokes = useMemo(() =>
    Array.from({ length: nodeCount }, (_, i) => {
      const pos = nodePos(i, nodeCount, cx, cy, outerR);
      const p   = Skia.Path.Make();
      p.moveTo(cx, cy);
      p.lineTo(pos.x, pos.y);
      return p;
    }),
    [cx, cy, outerR, nodeCount],
  );

  const positions = useMemo(() =>
    Array.from({ length: nodeCount }, (_, i) => nodePos(i, nodeCount, cx, cy, outerR)),
    [cx, cy, outerR, nodeCount],
  );

  return (
    <View style={{ width: size, height: size + 40 }}>
      <Canvas style={{ width: size, height: size }}>

        {/* ── Background center radiance ── */}
        <Circle cx={cx} cy={cy} r={size * 0.48}>
          <RadialGradient
            c={vec(cx, cy)}
            r={size * 0.48}
            colors={['rgba(255,218,3,0.08)', 'transparent']}
            positions={[0, 1]}
          />
        </Circle>

        {/* ── Orbit rings ── */}
        <Path path={orbitPath}  color="rgba(255,218,3,0.14)" style="stroke" strokeWidth={1} />
        <Path path={innerPath}  color="rgba(255,255,255,0.07)" style="stroke" strokeWidth={1} />

        {/* ── Spokes ── */}
        {spokes.map((p, i) => (
          <Path key={`spoke-${i}`} path={p} color={`${NODE_COLORS[i]}14`} style="stroke" strokeWidth={1} />
        ))}

        {/* ── Center core — animated halo + bright dot ── */}
        <Circle cx={cx} cy={cy} r={centerHalo} color="rgba(255,218,3,0.18)">
          <BlurMask blur={14} style="normal" />
        </Circle>
        <Circle cx={cx} cy={cy} r={innerHalo} color="rgba(255,225,120,0.55)" />
        <Circle cx={cx} cy={cy} r={size * 0.028} color="rgba(255,245,200,0.95)" />

        {/* ── Light-blending node glows (blendMode="screen") ──
             Where circles overlap, RGB values add → white-hot hotspots */}
        <Group blendMode={BlendMode.Screen}>
          {positions.map((pos, i) => (
            <Circle
              key={`glow-${i}`}
              cx={pos.x}
              cy={pos.y}
              r={nodeGlowR}
              color={NODE_COLORS[i] + '55'}
            >
              <BlurMask blur={10} style="normal" />
            </Circle>
          ))}
        </Group>

        {/* ── Crisp node cores (normal blend, drawn on top) ── */}
        {positions.map((pos, i) => (
          <Circle
            key={`core-${i}`}
            cx={pos.x}
            cy={pos.y}
            r={nodeCoreR}
            color={NODE_COLORS[i]}
          />
        ))}

        {/* ── Orbiting comet dot ── */}
        <Circle cx={cometX} cy={cometY} r={size * 0.022} color="rgba(255,245,200,0.20)">
          <BlurMask blur={6} style="normal" />
        </Circle>
        <Circle cx={cometX} cy={cometY} r={size * 0.011} color="rgba(255,245,200,0.90)" opacity={cometOpacity} />

      </Canvas>

      {/* Text labels */}
      {(title || subtitle || monthLabel) ? (
        <View style={styles.textRow}>
          {title      && <Text style={styles.title}>{title}</Text>}
          {subtitle   && <Text style={styles.subtitle}>{subtitle}</Text>}
          {monthLabel && <Text style={styles.month}>{monthLabel}</Text>}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  textRow: {
    alignItems: 'center',
    marginTop: 4,
    gap: 2,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,218,3,0.85)',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
  },
  month: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.25)',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
});

export default memo(PatternsCosmicRingSkia);
