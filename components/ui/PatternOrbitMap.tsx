/**
 * PatternOrbitMap.tsx
 * MySky — Cosmic Circular Pattern Visualization (Skia + Reanimated)
 *
 * Updated to "Lunar Sky" Aesthetic:
 * 1. Purged muddy gold ambient glows; implemented Midnight Slate foundation.
 * 2. Integrated "Velvet Glass" light-machined stroke logic for rings.
 * 3. Enhanced metallic "Gold Foil" logic for primary energy arcs.
 */

import React, { memo, useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  Canvas,
  Circle,
  Path,
  Skia,
  BlurMask,
  Group,
  LinearGradient,
  RadialGradient,
  vec,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  useDerivedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { DailyCheckIn } from '../../services/patterns/types';
import { MetallicText } from './MetallicText';
import { derivePatternOrbitScores, getPatternOrbitThemes } from './patternOrbitHelpers';

// ── Lunar Sky / Midnight Slate Palette ──────────────────────────────────────
const PALETTE = {
  gold: '#D4AF37',       // Metallic hardware stop
  goldLight: '#F9DF9F',  // Gold Foil Highlight
  atmosphere: '#A2C2E1', // Icy Blue
  slateDeep: '#1A1E29',  // Deep Anchor Base
  slateMid: '#2C3645',   // Mid Anchor Base
  white: '#FFFFFF',
};

// ── Dimension definitions (Same as before, but metadata driven) ──────────────
const DIMENSIONS = [
  { key: 'emotional',  label: 'EMOTIONAL\nDEPTH',     icon: '♡',  color: '#D4A3B3',  glow: '#F5D6E0' },
  { key: 'creativity', label: 'CREATIVITY',            icon: '✦',  color: '#D4B872',  glow: '#FFF6DC' },
  { key: 'connection', label: 'CONNECTION',             icon: '◎',  color: '#9D76C1',  glow: '#E8D5F5' },
  { key: 'stress',     label: 'STRESS &\nRELEASE',     icon: '❋',  color: '#CD7F5D',  glow: '#F5E0D6' },
  { key: 'rest',       label: 'REST &\nRECOVERY',      icon: '☽',  color: '#D4AF37',  glow: '#D6EEFF' },
  { key: 'trust',      label: 'SELF-\nTRUST',          icon: '◈',  color: '#6EBF8B',  glow: '#D6F5E3' },
  { key: 'clarity',    label: 'CLARITY\n& FOCUS',      icon: '◉',  color: '#A89BC8',  glow: '#E0D6F0' },
];

const NUM_DIM = DIMENSIONS.length;

// ── Helpers ───────────────────────────────────────────────────────────────────
function withAlpha(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '');
  return `rgba(${parseInt(normalized.slice(0, 2), 16)}, ${parseInt(normalized.slice(2, 4), 16)}, ${parseInt(normalized.slice(4, 6), 16)}, ${alpha})`;
}

export const PatternOrbitMap = memo(function PatternOrbitMap({ checkIns, size }: { checkIns: DailyCheckIn[], size: number }) {
  const cx = size / 2, cy = size / 2;
  const orbitR = size * 0.365, innerR = size * 0.195, outerR = size * 0.43;

  // ── Scores Logic ───────────────────────────────────────────────────────────
  const scores = useMemo(() => derivePatternOrbitScores(checkIns), [checkIns]);

  const themes = useMemo(() => getPatternOrbitThemes(scores), [scores]);

  // ── Animations ─────────────────────────────────────────────────────────────
  const orbitAngle = useSharedValue(0);
  useEffect(() => {
    orbitAngle.value = withRepeat(withTiming(Math.PI * 2, { duration: 16000, easing: Easing.linear }), -1, false);
  }, [orbitAngle]);
  const rotateTransform = useDerivedValue(() => [{ rotate: orbitAngle.value }]);

  const { nodes, flowArcs } = useMemo(() => {
    const startAngle = -Math.PI / 2;
    const angleStep = (Math.PI * 2) / NUM_DIM;

    const nodePositions = DIMENSIONS.map((dim, i) => {
      const angle = startAngle + i * angleStep;
      return { ...dim, x: cx + orbitR * Math.cos(angle), y: cy + orbitR * Math.sin(angle), angle, score: scores[i] };
    });

    const arcs = nodePositions.map((node, i) => {
      const next = nodePositions[(i + 1) % NUM_DIM];
      const midAngle = (node.angle + next.angle) / 2 + (i === NUM_DIM - 1 ? Math.PI : 0);
      const cpR = innerR * (0.8 + scores[i] * 0.3);
      const p = Skia.Path.Make();
      p.moveTo(node.x, node.y);
      p.quadTo(cx + cpR * Math.cos(midAngle), cy + cpR * Math.sin(midAngle), next.x, next.y);
      return { path: p, color: node.color, score: node.score, x1: node.x, y1: node.y, x2: next.x, y2: next.y };
    });

    const outerP = Skia.Path.Make(); outerP.addCircle(cx, cy, outerR);
    const innerP = Skia.Path.Make(); innerP.addCircle(cx, cy, innerR);

    return { nodes: nodePositions, flowArcs: arcs };
  }, [scores, cx, cy, orbitR, innerR, outerR]);

  return (
    <View style={[styles.root, { width: size, height: size }]}>
      <Canvas style={StyleSheet.absoluteFill}>
        {/* Background Anchor Glow (Midnight Slate) */}
        <Circle cx={cx} cy={cy} r={size * 0.45} color={PALETTE.slateDeep}>
          <BlurMask blur={40} style="normal" />
        </Circle>

        {/* Machined Velvet Rings */}
        <Circle cx={cx} cy={cy} r={outerR} style="stroke" strokeWidth={1} color="rgba(255,255,255,0.08)" />
        <Circle cx={cx} cy={cy} r={orbitR} style="stroke" strokeWidth={0.5} color="rgba(255,255,255,0.15)" />
        <Circle cx={cx} cy={cy} r={innerR} style="stroke" strokeWidth={1} color="rgba(255,255,255,0.05)" />

        {/* Flow Arcs (Bioluminescent Glow) */}
        <Group>
          {flowArcs.map((arc, i) => (
            <React.Fragment key={`arc-${i}`}>
              <Path path={arc.path} style="stroke" strokeWidth={1.5} strokeCap="round">
                <LinearGradient
                  start={vec(arc.x1, arc.y1)}
                  end={vec(arc.x2, arc.y2)}
                  colors={[arc.color, PALETTE.atmosphere, PALETTE.white, PALETTE.atmosphere, arc.color]}
                />
              </Path>
            </React.Fragment>
          ))}
        </Group>

        {/* Dimension Nodes (Gold Foil Accents) */}
        {nodes.map((node, i) => (
          <React.Fragment key={`node-${i}`}>
            <Circle cx={node.x} cy={node.y} r={12 + node.score * 6} color={withAlpha(node.color, 0.08)}>
              <BlurMask blur={10} style="normal" />
            </Circle>
            <Circle cx={node.x} cy={node.y} r={4 + node.score * 2}>
              <RadialGradient
                c={vec(node.x, node.y)}
                r={10}
                colors={[PALETTE.goldLight, node.color, 'transparent']}
              />
            </Circle>
          </React.Fragment>
        ))}

        {/* Center Star & Orbiting Particles */}
        <Circle cx={cx} cy={cy} r={2} color={PALETTE.gold} />
        <Group origin={vec(cx, cy)} transform={rotateTransform}>
          {DIMENSIONS.map((dim, j) => (
            <Circle key={j} cx={cx + orbitR * Math.cos(j)} cy={cy + orbitR * Math.sin(j)} r={1.5} color={PALETTE.atmosphere} opacity={0.6} />
          ))}
        </Group>
      </Canvas>

      {/* Editorial Content Layer */}
      <View pointerEvents="none" style={[styles.centerCopyWrap, { width: size * 0.46, left: cx - (size * 0.23), top: cy - 10 }]}> 
        <MetallicText style={styles.centerThemes} variant="gold">{themes.join(' • ')}</MetallicText>
      </View>

      {/* Radial Icons */}
      {nodes.map((node, i) => (
        <View key={i} style={[styles.dimLabel, { left: cx + (orbitR + 22) * Math.cos(node.angle) - 10, top: cy + (orbitR + 22) * Math.sin(node.angle) - 10 }]}>
          <Text style={[styles.dimIcon, { color: node.color }]}>{node.icon}</Text>
        </View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  root: { position: 'relative' },
  centerCopyWrap: { position: 'absolute', alignItems: 'center' },
  centerThemes: { fontSize: 9, fontWeight: '700', letterSpacing: 0.85, textAlign: 'center', opacity: 0.62, textTransform: 'uppercase' },
  dimLabel: { position: 'absolute', width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  dimIcon: { fontSize: 16, fontWeight: '600' },
});
