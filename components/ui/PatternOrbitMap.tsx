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

// ── Metallic core colors (from metallicPalettes.ts) ──────────────────────────
// Each dimension uses the "core" stop of its metallic gradient.

const CLR_EMOTIONAL  = '#D4A3B3';  // METALLIC_ROSE core  — matches app-wide rose
const CLR_CREATIVITY = '#D4B872';  // METALLIC_WARM_GOLD core — matches growth screen gold
const CLR_CONNECTION = '#9D76C1';  // METALLIC_PURPLE core
const CLR_STRESS     = '#CD7F5D';  // METALLIC_COPPER core
const CLR_REST       = '#C9AE78';  // METALLIC_GOLD core
const CLR_TRUST      = '#6EBF8B';  // METALLIC_GREEN core
const CLR_CLARITY    = '#A89BC8';  // METALLIC_LAVENDER core

// Metallic "light" tints for glow halos (first stop of each gradient)
const GLOW_EMOTIONAL  = '#F5D6E0';  // METALLIC_ROSE light
const GLOW_CREATIVITY = '#FFF6DC';  // METALLIC_WARM_GOLD light
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
  { key: 'trust',      label: 'SELF-\nTRUST',          icon: '◈',  color: CLR_TRUST,      glow: GLOW_TRUST },
  { key: 'clarity',    label: 'CLARITY\n& FOCUS',      icon: '◉',  color: CLR_CLARITY,    glow: GLOW_CLARITY },
];

const NUM_DIM = DIMENSIONS.length;

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

  const n = checkIns.length;
  const energies = checkIns.map(c => levelToNum(c.energyLevel));
  const moods    = checkIns.map(c => c.moodScore);
  const allTags  = checkIns.flatMap(c => c.tags ?? []);

  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const stdDev = (arr: number[]) => {
    const m = avg(arr);
    return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length);
  };

  const avgEnergy = avg(energies);
  const moodStd   = stdDev(moods);

  // Journaling signals — the richest self-reflection data
  const noteRatio       = checkIns.filter(c => c.note       && c.note.length       > 10).length / n;
  const winsRatio       = checkIns.filter(c => c.wins       && c.wins.length       > 5).length  / n;
  const challengesRatio = checkIns.filter(c => c.challenges && c.challenges.length > 5).length  / n;

  // Consistency = signal of commitment / self-trust (saturates at 30 check-ins)
  const consistency = clamp01(n / 30);

  const tc = (keys: string[]) => allTags.filter(t => keys.includes(t)).length;
  const T  = Math.max(1, allTags.length);

  // ── Emotional Depth ────────────────────────────────────────────────────────
  // Deep emotional engagement = journaling (notes + wins + challenges) AND
  // presence of emotional-processing tags. NOT mood volatility.
  const emotionTags = ['grief', 'anxiety', 'loneliness', 'boundaries', 'joy',
                       'eq_open', 'eq_heavy', 'eq_anxious', 'eq_hopeful'];
  const emotionalDepth =
    clamp01(0.10
      + noteRatio       * 0.35
      + winsRatio       * 0.15
      + challengesRatio * 0.15
      + (tc(emotionTags) / T) * 3.0 * 0.35);

  // ── Creativity ────────────────────────────────────────────────────────────
  // Creative tags + open/inspired emotional quality + higher energy
  const creativeTags = ['creativity', 'creative', 'eq_open'];
  const creativityScore =
    clamp01(0.10
      + (tc(creativeTags) / T) * 3.5 * 0.70
      + clamp01((avgEnergy - 2) / 7) * 0.30);

  // ── Connection ────────────────────────────────────────────────────────────
  // Relational tags — straightforward
  const connectionTags = ['relationships', 'social', 'intimacy', 'family', 'kids'];
  const connectionScore =
    clamp01(0.10 + (tc(connectionTags) / T) * 3.0);

  // ── Stress & Release ──────────────────────────────────────────────────────
  // Measures active stress PROCESSING: stressed days where the user still
  // journaled = healthy release. Bonus for days with genuinely low stress.
  const stressedDays      = checkIns.filter(c => levelToNum(c.stressLevel) >= 5).length;
  const stressWithNote    = checkIns.filter(c => levelToNum(c.stressLevel) >= 5
                              && c.note && c.note.length > 10).length;
  const stressProcessing  = stressedDays > 0 ? stressWithNote / stressedDays : 0;
  const lowStressRatio    = checkIns.filter(c => levelToNum(c.stressLevel) === 2).length / n;
  const stressReleaseScore =
    clamp01(0.10
      + stressProcessing * 0.50
      + lowStressRatio   * 0.40);

  // ── Rest & Recovery ───────────────────────────────────────────────────────
  // Rest tags + low-energy days the user consciously honoured with rest tags
  const restTags = ['sleep', 'rest', 'alone_time', 'nature', 'routine'];
  const consciousRestDays = checkIns.filter(c =>
    levelToNum(c.energyLevel) === 2 && (c.tags ?? []).some(t => restTags.includes(t))).length;
  const restScore =
    clamp01(0.10
      + (tc(restTags) / T) * 3.0 * 0.60
      + (consciousRestDays / n) * 0.40);

  // ── Self-Trust ────────────────────────────────────────────────────────────
  // Consistency of showing up + confidence/grounded tags + reflective writing
  const selfTrustTags = ['confidence', 'boundaries', 'gratitude', 'eq_grounded', 'eq_hopeful'];
  const selfTrustScore =
    clamp01(0.10
      + consistency              * 0.40
      + noteRatio                * 0.25
      + winsRatio                * 0.10
      + (tc(selfTrustTags) / T) * 3.0 * 0.25);

  // ── Clarity & Focus ───────────────────────────────────────────────────────
  // Focus tags + calm high-mood days (clear mind) + mood stability
  const clarityTags = ['eq_focused', 'eq_grounded', 'clarity', 'productivity'];
  const calmClearDays = checkIns.filter(c =>
    c.moodScore >= 7 && levelToNum(c.stressLevel) <= 5).length;
  const clarityScore =
    clamp01(0.10
      + (tc(clarityTags) / T) * 3.0 * 0.50
      + (calmClearDays / n)         * 0.35
      + clamp01(1 - moodStd / 5)    * 0.15);

  return [emotionalDepth, creativityScore, connectionScore,
          stressReleaseScore, restScore, selfTrustScore, clarityScore];
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
  const orbitR = size * 0.34;       // main orbit radius for dimension nodes
  const innerR = size * 0.18;       // inner ring for flowing arcs
  const outerR = size * 0.40;       // outer decorative ring

  const scores = useMemo(() => computeDimensionScores(checkIns), [checkIns]);
  const themes = useMemo(() => deriveThemes(scores), [scores]);
  const summary = useMemo(() => deriveSummary(scores), [scores]);

  // ── Animation: breathing pulse ──────────────────────────────────────────
  const breath = useSharedValue(0);

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

  const rotateTransform = useDerivedValue(() => [{ rotate: orbitAngle.value }]);

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
    <View style={[styles.root, { width: size }]}>
      {/* ── Canvas + node symbols in a fixed-size container ── */}
      <View style={{ width: size, height: size }}>
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

        {/* ── Orbiting particles (one per dimension) ── */}
        <Group origin={vec(cx, cy)} transform={rotateTransform}>
          {DIMENSIONS.map((dim, j) => {
            const angleOffset = (j * Math.PI * 2) / NUM_DIM;
            // Place particles at different radii to make it staggered and organic
            const radiusJitter = (j % 2 === 0) ? orbitR : innerR * 1.08;
            const px = cx + radiusJitter * Math.cos(angleOffset);
            const py = cy + radiusJitter * Math.sin(angleOffset);
            return (
              <React.Fragment key={`orb-${j}`}>
                <Circle cx={px} cy={py} r={2} color={dim.color} opacity={0.7}>
                  <BlurMask blur={3} style="solid" />
                </Circle>
                <Circle cx={px} cy={py} r={6} color={dim.glow} opacity={0.2}>
                  <BlurMask blur={8} style="normal" />
                </Circle>
              </React.Fragment>
            );
          })}
        </Group>

      </Canvas>

      <View
        pointerEvents="none"
        style={[
          styles.centerCopyWrap,
          {
            width: size * 0.58,
            left: cx - size * 0.29,
            top: cy - 28,
          },
        ]}
      >
        <Text style={styles.centerThemes}>{themes.join(' · ').toUpperCase()}</Text>
        <Text style={styles.centerSummary}>{summary}</Text>
      </View>

      {/* ── Dimension symbols only ── */}
      {nodes.map((node, i) => {
        const labelR = orbitR + 18;
        const lx = cx + labelR * Math.cos(node.angle);
        const ly = cy + labelR * Math.sin(node.angle);
        return (
          <View
            key={`label-${i}`}
            style={[styles.dimLabel, { left: lx - 12, top: ly - 12 }]}
          >
            <Text style={[styles.dimIcon, { color: node.color }]}>{node.icon}</Text>
          </View>
        );
      })}
      </View>{/* end canvas container */}

      {/* ── Legend ── */}
      <View style={styles.legend}>
        {DIMENSIONS.map((dim) => (
          <View key={dim.key} style={styles.legendItem}>
            <Text style={[styles.legendIcon, { color: dim.color }]}>{dim.icon}</Text>
            <Text style={styles.legendLabel}>{dim.label.replace('\n', ' ')}</Text>
          </View>
        ))}
      </View>
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
  },
  centerCopyWrap: {
    position: 'absolute',
    alignItems: 'center',
    gap: 8,
  },
  centerThemes: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  centerSummary: {
    color: 'rgba(255,255,255,0.68)',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  dimIcon: {
    fontSize: 18,
    fontWeight: '400',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 2,
    paddingBottom: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendIcon: {
    fontSize: 13,
  },
  legendLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.4,
  },
});
