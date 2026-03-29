/**
 * PatternOrbitMap.tsx
 * MySky — Cosmic Circular Pattern Visualization (Skia + Reanimated)
 *
 * A radial orbit map that replaces the linear 30-day chart with a
 * circular cosmic visualization inspired by celestial navigation.
 *
 * Architecture:
 *   • 7 life dimensions arranged in a circle
 *   • Flowing energy arcs between dimensions, colored per-dimension
 *   • Arc intensity/opacity driven by real check-in data
 *   • Animated breathing glow + orbiting particles
 *   • Center area shows month, top themes, and a summary line
 *
 * Pure @shopify/react-native-skia + Reanimated — no R3F / THREE
 */

import React, { memo, useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, Platform } from 'react-native';
import {
  Canvas,
  Circle,
  Path,
  Skia,
  BlurMask,
  Group,
  Text as SkiaText,
  matchFont,
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

// ── Metallic core colors (from metallicPalettes.ts) ──────────────────────────
// Each dimension uses the "core" stop of its metallic gradient.

const CLR_EMOTIONAL  = '#E07A98';  // METALLIC_LOVE core
const CLR_CREATIVITY = '#C9AE78';  // METALLIC_GOLD core
const CLR_CONNECTION = '#9D76C1';  // METALLIC_PURPLE core
const CLR_STRESS     = '#CD7F5D';  // METALLIC_COPPER core
const CLR_REST       = '#8BC4E8';  // METALLIC_BLUE core
const CLR_TRUST      = '#6EBF8B';  // METALLIC_GREEN core
const CLR_CLARITY    = '#A89BC8';  // METALLIC_LAVENDER core

// Metallic "light" tints for glow halos (first stop of each gradient)
const GLOW_EMOTIONAL  = '#F5D0DA';
const GLOW_CREATIVITY = '#FFF4D6';
const GLOW_CONNECTION = '#E8D5F5';
const GLOW_STRESS     = '#F5E0D6';
const GLOW_REST       = '#D6EEFF';
const GLOW_TRUST      = '#D6F5E3';
const GLOW_CLARITY    = '#E0D6F0';

// ── Dimension definitions ─────────────────────────────────────────────────────

interface Dimension {
  key: string;
  label: string;
  icon: string;
  color: string;
  glow: string;
}

const DIMENSIONS: Dimension[] = [
  { key: 'emotional',  label: 'EMOTIONAL\nDEPTH',     icon: '♡',  color: CLR_EMOTIONAL,  glow: GLOW_EMOTIONAL },
  { key: 'creativity', label: 'CREATIVITY',            icon: '✦',  color: CLR_CREATIVITY, glow: GLOW_CREATIVITY },
  { key: 'connection', label: 'CONNECTION',             icon: '◎',  color: CLR_CONNECTION, glow: GLOW_CONNECTION },
  { key: 'stress',     label: 'STRESS &\nRELEASE',     icon: '❋',  color: CLR_STRESS,     glow: GLOW_STRESS },
  { key: 'rest',       label: 'REST &\nRECOVERY',      icon: '☽',  color: CLR_REST,       glow: GLOW_REST },
  { key: 'trust',      label: 'SELF-\nTRUST',          icon: '♧',  color: CLR_TRUST,      glow: GLOW_TRUST },
  { key: 'clarity',    label: 'CLARITY\n& FOCUS',      icon: '◉',  color: CLR_CLARITY,    glow: GLOW_CLARITY },
];

const NUM_DIM = DIMENSIONS.length;

const SERIF_FAMILY = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' })!;
const SANS_FAMILY = Platform.select({ ios: 'Helvetica Neue', android: 'sans-serif-medium', default: 'sans-serif' })!;

// ── Helpers ───────────────────────────────────────────────────────────────────

function levelToNum(level: 'low' | 'medium' | 'high'): number {
  return level === 'low' ? 2 : level === 'medium' ? 5 : 9;
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function withAlpha(hex: string, alpha: number): string {
  return hex + Math.round(alpha * 255).toString(16).padStart(2, '0');
}

/** Derive 0–1 normalized scores for each dimension from check-in data */
function computeDimensionScores(checkIns: DailyCheckIn[]): number[] {
  if (!checkIns.length) return DIMENSIONS.map(() => 0.1);

  const moods = checkIns.map(c => c.moodScore);
  const energies = checkIns.map(c => levelToNum(c.energyLevel));
  const stresses = checkIns.map(c => levelToNum(c.stressLevel));
  const allTags = checkIns.flatMap(c => c.tags ?? []);

  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const stdDev = (arr: number[]) => {
    const m = avg(arr);
    return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length);
  };

  const avgEnergy = avg(energies);
  const avgStress = avg(stresses);
  const moodStd = stdDev(moods);
  const hasNotes = checkIns.filter(c => c.note && c.note.length > 10).length;
  const noteRatio = hasNotes / checkIns.length;
  const consistency = clamp01(checkIns.length / 20);

  const tagCount = (keys: string[]) => allTags.filter(t => keys.includes(t)).length;
  const totalTags = Math.max(1, allTags.length);

  // Each dimension score: base 0.10 floor so empty dimensions still render faintly
  return [
    // Emotional Depth: mood range + journal depth (notes written)
    clamp01(0.10 + (moodStd / 4) * 0.5 + noteRatio * 0.5),
    // Creativity: creative/inspired tags + higher energy
    clamp01(0.10 + (tagCount(['creativity', 'creative']) / totalTags) * 2.5 + (avgEnergy - 1) / 8 * 0.3),
    // Connection: social/relationship tags
    clamp01(0.10 + (tagCount(['relationships', 'social', 'intimacy', 'family']) / totalTags) * 2.5),
    // Stress & Release: inverse of average stress (lower stress = higher score)
    clamp01(0.10 + (10 - avgStress) / 8 * 0.8),
    // Rest & Recovery: rest-related tags + low-stress proportion
    clamp01(0.10 + (tagCount(['sleep', 'rest', 'alone_time', 'nature']) / totalTags) * 2.5 + (10 - avgStress) / 8 * 0.2),
    // Self-Trust: check-in consistency + journaling regularity
    clamp01(0.10 + consistency * 0.5 + noteRatio * 0.4),
    // Clarity & Focus: focus/grounded tags + mood stability (low std dev = clarity)
    clamp01(0.10 + (tagCount(['eq_focused', 'eq_grounded', 'clarity', 'productivity']) / totalTags) * 2.5 + clamp01(1 - moodStd / 3) * 0.3),
  ];
}

/** Pick top 3 theme words ranked by score */
function deriveThemes(scores: number[]): string[] {
  const themeWords = ['Depth', 'Creativity', 'Connection', 'Release', 'Rest', 'Trust', 'Clarity'];
  return scores
    .map((s, i) => ({ s, i }))
    .sort((a, b) => b.s - a.s)
    .slice(0, 3)
    .map(x => themeWords[x.i]);
}

/** Summary line based on the highest-scoring dimension */
function deriveSummary(scores: number[]): string {
  const maxIdx = scores.indexOf(Math.max(...scores));
  const summaries = [
    'You are processing deeply.',
    'Creative energy is flowing.',
    'Your connections are active.',
    'You are finding release.',
    'Rest is restoring you.',
    'Self-trust is growing.',
    'Clarity is emerging.',
  ];
  return summaries[maxIdx] ?? 'You are evolving.';
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface PatternOrbitMapProps {
  checkIns: DailyCheckIn[];
  size: number;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const PatternOrbitMap = memo(function PatternOrbitMap({ checkIns, size }: PatternOrbitMapProps) {
  const cx = size / 2;
  const cy = size / 2;
  const orbitR = size * 0.36;       // main orbit radius for dimension nodes
  const innerR = size * 0.20;       // inner ring for flowing arcs
  const outerR = size * 0.42;       // outer decorative ring

  const scores = useMemo(() => computeDimensionScores(checkIns), [checkIns]);
  const themes = useMemo(() => deriveThemes(scores), [scores]);
  const summary = useMemo(() => deriveSummary(scores), [scores]);

  // Month label
  const monthLabel = useMemo(() => {
    if (!checkIns.length) return '';
    const dates = checkIns.map(c => new Date(c.date + 'T12:00:00'));
    const latest = dates.reduce((a, b) => a > b ? a : b);
    return latest.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  }, [checkIns]);

  // ── Animation: breathing pulse ──────────────────────────────────────────
  const breath = useSharedValue(0);

  // ── Skia fonts for in-canvas text ──────────────────────────────────────
  const serifTheme = useMemo(() => matchFont({ fontFamily: SERIF_FAMILY, fontSize: 13, fontWeight: '600' }), []);
  const sansMonth = useMemo(() => matchFont({ fontFamily: SANS_FAMILY, fontSize: 11, fontWeight: '500' }), []);
  const sansSummary = useMemo(() => matchFont({ fontFamily: SANS_FAMILY, fontSize: 10, fontWeight: '400' }), []);
  const sansDimLabel = useMemo(() => matchFont({ fontFamily: SANS_FAMILY, fontSize: 9, fontWeight: '700' }), []);
  useEffect(() => {
    breath.value = withRepeat(
      withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [breath]);

  // Orbiting particle angle
  const orbitAngle = useSharedValue(0);
  useEffect(() => {
    orbitAngle.value = withRepeat(
      withTiming(Math.PI * 2, { duration: 12000, easing: Easing.linear }),
      -1,
      false,
    );
  }, [orbitAngle]);

  // Animated orbit particle position
  const particleX = useDerivedValue(() => cx + orbitR * Math.cos(orbitAngle.value));
  const particleY = useDerivedValue(() => cy + orbitR * Math.sin(orbitAngle.value));

  // Second particle (opposite phase, inner orbit)
  const particle2X = useDerivedValue(() => cx + innerR * 1.1 * Math.cos(orbitAngle.value + Math.PI));
  const particle2Y = useDerivedValue(() => cy + innerR * 1.1 * Math.sin(orbitAngle.value + Math.PI));

  const { nodes, flowArcs, outerRingPath, innerRingPath } = useMemo(() => {
    const startAngle = -Math.PI / 2; // top
    const angleStep = (Math.PI * 2) / NUM_DIM;

    // Node positions
    const nodePositions = DIMENSIONS.map((dim, i) => {
      const angle = startAngle + i * angleStep;
      return {
        ...dim,
        x: cx + orbitR * Math.cos(angle),
        y: cy + orbitR * Math.sin(angle),
        angle,
        score: scores[i],
      };
    });

    // Flowing arc paths between adjacent nodes (curved through inner radius)
    const arcs = nodePositions.map((node, i) => {
      const next = nodePositions[(i + 1) % NUM_DIM];
      const midAngle = (node.angle + next.angle) / 2 + (i >= NUM_DIM - 1 ? Math.PI : 0);
      // Control point pulled toward center for a curved flow
      const cpR = innerR * (0.7 + scores[i] * 0.4);
      const cpX = cx + cpR * Math.cos(midAngle);
      const cpY = cy + cpR * Math.sin(midAngle);

      const p = Skia.Path.Make();
      p.moveTo(node.x, node.y);
      p.quadTo(cpX, cpY, next.x, next.y);
      return { path: p, color: node.color, glow: node.glow, score: node.score, x1: node.x, y1: node.y, x2: next.x, y2: next.y };
    });

    // Cross-connections: connect every other node for the web effect
    const crossArcs = nodePositions.flatMap((node, i) => {
      const acrossIdx = (i + 3) % NUM_DIM;
      const across = nodePositions[acrossIdx];
      const avgScore = (scores[i] + scores[acrossIdx]) / 2;
      if (avgScore < 0.2) return [];

      const p = Skia.Path.Make();
      p.moveTo(node.x, node.y);
      // Deterministic control point: slightly offset from center based on index
      const offsetAngle = (node.angle + across.angle) / 2;
      const cpX = cx + size * 0.04 * Math.cos(offsetAngle + Math.PI / 2);
      const cpY = cy + size * 0.04 * Math.sin(offsetAngle + Math.PI / 2);
      p.quadTo(cpX, cpY, across.x, across.y);
      return [{ path: p, color: node.color, glow: node.glow, score: avgScore, x1: node.x, y1: node.y, x2: across.x, y2: across.y }];
    });

    // Outer decorative ring
    const outerP = Skia.Path.Make();
    outerP.addCircle(cx, cy, outerR);

    // Inner decorative ring
    const innerP = Skia.Path.Make();
    innerP.addCircle(cx, cy, innerR);

    return {
      nodes: nodePositions,
      flowArcs: [...arcs, ...crossArcs],
      outerRingPath: outerP,
      innerRingPath: innerP,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scores, cx, cy, orbitR, innerR, outerR, size]);

  if (!checkIns.length) {
    return (
      <View style={[styles.root, { width: size, height: size }]}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTxt}>Complete check-ins to reveal your pattern map</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { width: size, height: size }]}>
      {/* ── Skia Canvas ── */}
      <Canvas style={StyleSheet.absoluteFill}>
        {/* Background ambient glow */}
        <Circle cx={cx} cy={cy} r={size * 0.45} color="rgba(20, 10, 40, 0.6)">
          <BlurMask blur={40} style="normal" />
        </Circle>

        {/* Outer orbit ring */}
        <Path
          path={outerRingPath}
          style="stroke"
          strokeWidth={0.5}
          color="rgba(255,255,255,0.08)"
        />

        {/* Inner orbit ring */}
        <Path
          path={innerRingPath}
          style="stroke"
          strokeWidth={0.5}
          color="rgba(255,255,255,0.06)"
        />

        {/* Main orbit ring (where nodes sit) */}
        <Circle cx={cx} cy={cy} r={orbitR} style="stroke" strokeWidth={0.8} color="rgba(255,255,255,0.05)" />

        {/* ── Flow arcs between dimensions ── */}
        <Group>
          {flowArcs.map((arc, i) => (
            <React.Fragment key={`arc-${i}`}>
              {/* Wide outer glow — metallic light tint */}
              <Path
                path={arc.path}
                style="stroke"
                strokeWidth={12 * arc.score}
                strokeCap="round"
                color={withAlpha(arc.glow, 0.06 * arc.score)}
              >
                <BlurMask blur={16} style="solid" />
              </Path>
              {/* Mid glow — metallic tint */}
              <Path
                path={arc.path}
                style="stroke"
                strokeWidth={5 * arc.score}
                strokeCap="round"
                color={withAlpha(arc.glow, 0.12 * arc.score)}
              >
                <BlurMask blur={6} style="solid" />
              </Path>
              {/* Core stroke with metallic gradient */}
              <Path
                path={arc.path}
                style="stroke"
                strokeWidth={1.5}
                strokeCap="round"
                opacity={0.35 + arc.score * 0.3}
              >
                <LinearGradient
                  start={vec(arc.x1, arc.y1)}
                  end={vec(arc.x2, arc.y2)}
                  colors={[arc.glow, arc.color, '#FFFFFF', arc.color, arc.glow]}
                />
              </Path>
            </React.Fragment>
          ))}
        </Group>

        {/* ── Dimension node dots ── */}
        {nodes.map((node, i) => (
          <React.Fragment key={`node-${i}`}>
            {/* Outer metallic glow halo */}
            <Circle
              cx={node.x}
              cy={node.y}
              r={10 + node.score * 8}
              color={withAlpha(node.glow, 0.10 + node.score * 0.12)}
            >
              <BlurMask blur={12} style="normal" />
            </Circle>
            {/* Core dot — metallic radial gradient */}
            <Circle
              cx={node.x}
              cy={node.y}
              r={3 + node.score * 3}
              opacity={0.85 + node.score * 0.15}
            >
              <RadialGradient
                c={vec(node.x - (3 + node.score * 3) * 0.3, node.y - (3 + node.score * 3) * 0.3)}
                r={(3 + node.score * 3) * 1.8}
                colors={[node.glow, node.color, withAlpha(node.color, 0.15)]}
                positions={[0, 0.45, 1]}
              />
            </Circle>
            {/* Bright center pip */}
            <Circle
              cx={node.x}
              cy={node.y}
              r={1.5}
              color="#FFFFFF"
              opacity={0.5 + node.score * 0.4}
            />
          </React.Fragment>
        ))}

        {/* ── Center metallic glow ── */}
        <Circle cx={cx} cy={cy} r={size * 0.12} color="rgba(201, 174, 120, 0.06)">
          <BlurMask blur={30} style="normal" />
        </Circle>
        <Circle cx={cx} cy={cy} r={size * 0.04} color="rgba(201, 174, 120, 0.15)">
          <BlurMask blur={8} style="normal" />
        </Circle>
        {/* Tiny star at center */}
        <Circle cx={cx} cy={cy} r={2} color="#C9AE78" opacity={0.6} />

        {/* ── Orbiting particle (metallic gold) ── */}
        <Circle cx={particleX} cy={particleY} r={2.5} color="rgba(201, 174, 120, 0.7)">
          <BlurMask blur={4} style="solid" />
        </Circle>
        <Circle cx={particleX} cy={particleY} r={6} color="rgba(255, 244, 214, 0.10)">
          <BlurMask blur={10} style="normal" />
        </Circle>

        {/* Second particle (metallic blue) */}
        <Circle cx={particle2X} cy={particle2Y} r={2} color="rgba(139, 196, 232, 0.5)">
          <BlurMask blur={3} style="solid" />
        </Circle>
        <Circle cx={particle2X} cy={particle2Y} r={5} color="rgba(214, 238, 255, 0.08)">
          <BlurMask blur={8} style="normal" />
        </Circle>

        {/* ── Center text (white, precisely centered) ── */}
        {(() => {
          const themeStr = themes.join(' · ');
          const monthW = sansMonth ? sansMonth.getTextWidth(monthLabel) : monthLabel.length * 5;
          const themeW = serifTheme ? serifTheme.getTextWidth(themeStr) : themeStr.length * 6;
          const summaryW = sansSummary ? sansSummary.getTextWidth(summary) : summary.length * 4.5;

          // Total block height: month(11) + gap(6) + theme(13) + gap(5) + summary(10) = 45
          const blockH = 45;
          const topY = cy - blockH / 2;

          return (
            <Group>
              {sansMonth && (
                <SkiaText
                  x={cx - monthW / 2}
                  y={topY + 11}
                  text={monthLabel}
                  font={sansMonth}
                  color="rgba(255,255,255,0.45)"
                />
              )}
              {serifTheme && (
                <SkiaText
                  x={cx - themeW / 2}
                  y={topY + 11 + 6 + 13}
                  text={themeStr}
                  font={serifTheme}
                  color="#FFFFFF"
                />
              )}
              {sansSummary && (
                <SkiaText
                  x={cx - summaryW / 2}
                  y={topY + 11 + 6 + 13 + 5 + 10}
                  text={summary}
                  font={sansSummary}
                  color="rgba(255,255,255,0.5)"
                />
              )}
            </Group>
          );
        })()}
      </Canvas>

      {/* ── Dimension labels ── */}
      {nodes.map((node, i) => {
        const labelR = orbitR + 44;
        const lx = cx + labelR * Math.cos(node.angle);
        const ly = cy + labelR * Math.sin(node.angle);
        const lines = node.label.split('\n');
        const canvasW = 80;
        const lineH = 11;
        const canvasH = lines.length * lineH;

        return (
          <View
            key={`label-${i}`}
            style={[
              styles.dimLabel,
              {
                left: lx - 40,
                top: ly - 12,
                width: 80,
              },
            ]}
          >
            <Text style={[styles.dimIcon, { color: node.color }]}>{node.icon}</Text>
            <Canvas style={{ width: canvasW, height: canvasH }}>
              <Group>
                <LinearGradient
                  start={vec(0, 0)}
                  end={vec(canvasW, canvasH)}
                  colors={[node.glow, node.color, node.glow]}
                />
                {sansDimLabel && lines.map((line, j) => {
                  const tw = sansDimLabel.getTextWidth(line);
                  return (
                    <SkiaText
                      key={j}
                      x={(canvasW - tw) / 2}
                      y={j * lineH + lineH - 1}
                      text={line}
                      font={sansDimLabel}
                    />
                  );
                })}
              </Group>
            </Canvas>
          </View>
        );
      })}
    </View>
  );
});

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    position: 'relative',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTxt: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  dimLabel: {
    position: 'absolute',
    alignItems: 'center',
    gap: 1,
  },
  dimIcon: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
});
