// File: components/ui/SkiaStabilityDashboard.tsx
/**
 * SkiaStabilityDashboard — "Coherence Engine"
 *
 * Proprietary Stability Index built from the last 7 days of Sleep, Mood,
 * and Energy data. Uses high-end Bézier paths to show whether your metrics
 * are "Coherent" (aligned, smooth curves) or "Fragmented" (divergent spikes).
 *
 * Visual Language:
 *   Sleep  → Silver-Blue (#8BC4E8) — restoration layer
 *   Mood   → Gold (#C5B493) — emotional layer
 *   Energy → Emerald (#6EBF8B) — vitality layer
 *
 * The Stability Index (0–100) is derived from the standard deviation across
 * all three normalised signals — low deviation = high coherence.
 *
 * Requires: @shopify/react-native-skia 2.x, react-native-reanimated 4.x
 */

import React, { memo, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import {
  Canvas,
  Path,
  Skia,
  LinearGradient,
  vec,
  BlurMask,
  Group,
  Circle,
  RoundedRect,
  Rect,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  useDerivedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { theme } from '../../constants/theme';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface StabilityDataPoint {
  /** Date string (YYYY-MM-DD) */
  date: string;
  /** Mood score 1–10 */
  mood: number;
  /** Energy score 1–10 */
  energy: number;
  /** Sleep hours 0–12 */
  sleep: number;
}

interface Props {
  /** Last 7 days of combined data */
  data: StabilityDataPoint[];
  /** Card width (defaults to screen width - 48) */
  width?: number;
  /** Card height (defaults to 260) */
  height?: number;
}

// ─── Palette ───────────────────────────────────────────────────────────────────

const COLORS = {
  sleep: '#8BC4E8',
  mood: '#C5B493',
  energy: '#6EBF8B',
  sleepGlow: 'rgba(139, 196, 232, 0.3)',
  moodGlow: 'rgba(197, 180, 147, 0.3)',
  energyGlow: 'rgba(110, 191, 139, 0.3)',
  grid: 'rgba(255, 255, 255, 0.04)',
  axisText: 'rgba(253, 251, 247, 0.35)',
  coherent: '#6EBF8B',
  fragmented: '#CD7F5D',
  indexBg: 'rgba(15, 18, 25, 0.85)',
};

// ─── Stability Computation ─────────────────────────────────────────────────────

function computeStabilityIndex(data: StabilityDataPoint[]): {
  index: number;
  label: 'Coherent' | 'Aligned' | 'Shifting' | 'Fragmented';
  color: string;
} {
  if (data.length < 2) return { index: 50, label: 'Shifting', color: COLORS.mood };

  // Normalise each metric to 0–1
  const normMood = data.map(d => d.mood / 10);
  const normEnergy = data.map(d => d.energy / 10);
  const normSleep = data.map(d => Math.min(d.sleep / 8, 1)); // 8h = full rest

  // Per-day deviation across the three signals
  const deviations = data.map((_, i) => {
    const mean = (normMood[i] + normEnergy[i] + normSleep[i]) / 3;
    const variance =
      ((normMood[i] - mean) ** 2 +
        (normEnergy[i] - mean) ** 2 +
        (normSleep[i] - mean) ** 2) /
      3;
    return Math.sqrt(variance);
  });

  // Mean deviation across the week
  const meanDev = deviations.reduce((s, v) => s + v, 0) / deviations.length;

  // Also factor in the overall level (higher averages = better base)
  const avgLevel =
    (normMood.reduce((s, v) => s + v, 0) +
      normEnergy.reduce((s, v) => s + v, 0) +
      normSleep.reduce((s, v) => s + v, 0)) /
    (data.length * 3);

  // Stability Index: invert deviation, scale, and blend with level
  const coherencePart = Math.max(0, 1 - meanDev * 3); // 0–1 (1 = perfectly coherent)
  const levelPart = avgLevel; // 0–1
  const raw = coherencePart * 0.6 + levelPart * 0.4;
  const index = Math.round(Math.min(100, Math.max(0, raw * 100)));

  if (index >= 80) return { index, label: 'Coherent', color: COLORS.coherent };
  if (index >= 60) return { index, label: 'Aligned', color: COLORS.mood };
  if (index >= 40) return { index, label: 'Shifting', color: '#C5A059' };
  return { index, label: 'Fragmented', color: COLORS.fragmented };
}

// ─── Path Builder ──────────────────────────────────────────────────────────────

function buildBezierPath(
  values: number[],
  graphW: number,
  graphH: number,
  marginLeft: number,
  marginTop: number,
  maxVal: number,
): ReturnType<typeof Skia.Path.Make> {
  const path = Skia.Path.Make();
  if (values.length < 2) return path;

  const pts = values.map((v, i) => ({
    x: marginLeft + (i / (values.length - 1)) * graphW,
    y: marginTop + graphH - (v / maxVal) * graphH,
  }));

  path.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const cpX = (prev.x + curr.x) / 2;
    path.cubicTo(cpX, prev.y, cpX, curr.y, curr.x, curr.y);
  }

  return path;
}

// ─── Component ─────────────────────────────────────────────────────────────────

const SkiaStabilityDashboard = memo(function SkiaStabilityDashboard({
  data,
  width = SCREEN_W - 48,
  height = 260,
}: Props) {
  const MARGIN = { top: 40, bottom: 28, left: 8, right: 8 };
  const graphW = width - MARGIN.left - MARGIN.right;
  const graphH = height - MARGIN.top - MARGIN.bottom;

  // ── Pulse animation ──
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [pulse]);

  const pulseOpacity = useDerivedValue(() => 0.4 + pulse.value * 0.3);

  // ── Stability computation ──
  const stability = useMemo(() => computeStabilityIndex(data), [data]);

  // ── Build paths ──
  const { moodPath, energyPath, sleepPath } = useMemo(() => {
    return {
      moodPath: buildBezierPath(
        data.map(d => d.mood),
        graphW, graphH, MARGIN.left, MARGIN.top, 10,
      ),
      energyPath: buildBezierPath(
        data.map(d => d.energy),
        graphW, graphH, MARGIN.left, MARGIN.top, 10,
      ),
      sleepPath: buildBezierPath(
        data.map(d => Math.min(d.sleep, 12)),
        graphW, graphH, MARGIN.left, MARGIN.top, 12,
      ),
    };
  }, [data, graphW, graphH, MARGIN.left, MARGIN.top]);

  // ── Grid lines ──
  const gridPath = useMemo(() => {
    const p = Skia.Path.Make();
    const steps = 4;
    for (let i = 0; i <= steps; i++) {
      const y = MARGIN.top + (i / steps) * graphH;
      p.moveTo(MARGIN.left, y);
      p.lineTo(MARGIN.left + graphW, y);
    }
    return p;
  }, [graphW, graphH, MARGIN.left, MARGIN.top]);

  // ── Empty state ──
  if (data.length < 2) {
    return (
      <View style={[localStyles.card, { width, height: 120 }]}>
        <Text style={localStyles.emptyText}>
          Log 2+ days of mood, energy, and sleep to see your Stability Index
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[localStyles.card, { width }]}
      accessibilityLabel={`Stability Index: ${stability.index}%, ${stability.label}`}
    >
      {/* ── Header ── */}
      <View style={localStyles.header}>
        <View>
          <Text style={localStyles.eyebrow}>STABILITY INDEX</Text>
          <View style={localStyles.indexRow}>
            <Text style={[localStyles.indexValue, { color: stability.color }]}>
              {stability.index}%
            </Text>
            <View style={[localStyles.statusBadge, { backgroundColor: `${stability.color}20` }]}>
              <Text style={[localStyles.statusText, { color: stability.color }]}>
                {stability.label}
              </Text>
            </View>
          </View>
        </View>
        <View style={localStyles.legend}>
          <View style={localStyles.legendItem}>
            <View style={[localStyles.legendDot, { backgroundColor: COLORS.mood }]} />
            <Text style={localStyles.legendLabel}>Mood</Text>
          </View>
          <View style={localStyles.legendItem}>
            <View style={[localStyles.legendDot, { backgroundColor: COLORS.energy }]} />
            <Text style={localStyles.legendLabel}>Energy</Text>
          </View>
          <View style={localStyles.legendItem}>
            <View style={[localStyles.legendDot, { backgroundColor: COLORS.sleep }]} />
            <Text style={localStyles.legendLabel}>Sleep</Text>
          </View>
        </View>
      </View>

      {/* ── Skia Graph ── */}
      <Canvas style={{ width, height: height - 60 }}>
        {/* Grid */}
        <Path path={gridPath} color={COLORS.grid} style="stroke" strokeWidth={1} />

        {/* Sleep line — Silver-Blue glow */}
        <Group>
          <Path path={sleepPath} style="stroke" strokeWidth={4} strokeCap="round" strokeJoin="round">
            <LinearGradient start={vec(0, 0)} end={vec(width, 0)} colors={[COLORS.sleepGlow, COLORS.sleep]} />
            <BlurMask blur={6} style="solid" />
          </Path>
          <Path path={sleepPath} style="stroke" strokeWidth={2} strokeCap="round" strokeJoin="round" color={COLORS.sleep} />
        </Group>

        {/* Mood line — Gold glow */}
        <Group>
          <Path path={moodPath} style="stroke" strokeWidth={4} strokeCap="round" strokeJoin="round">
            <LinearGradient start={vec(0, 0)} end={vec(width, 0)} colors={[COLORS.moodGlow, COLORS.mood]} />
            <BlurMask blur={6} style="solid" />
          </Path>
          <Path path={moodPath} style="stroke" strokeWidth={2} strokeCap="round" strokeJoin="round" color={COLORS.mood} />
        </Group>

        {/* Energy line — Emerald glow */}
        <Group>
          <Path path={energyPath} style="stroke" strokeWidth={4} strokeCap="round" strokeJoin="round">
            <LinearGradient start={vec(0, 0)} end={vec(width, 0)} colors={[COLORS.energyGlow, COLORS.energy]} />
            <BlurMask blur={6} style="solid" />
          </Path>
          <Path path={energyPath} style="stroke" strokeWidth={2} strokeCap="round" strokeJoin="round" color={COLORS.energy} />
        </Group>

        {/* Terminal dots */}
        {data.length >= 2 && (() => {
          const lastIdx = data.length - 1;
          const lastX = MARGIN.left + (lastIdx / (data.length - 1)) * graphW;
          const moodY = MARGIN.top + graphH - (data[lastIdx].mood / 10) * graphH;
          const energyY = MARGIN.top + graphH - (data[lastIdx].energy / 10) * graphH;
          const sleepY = MARGIN.top + graphH - (Math.min(data[lastIdx].sleep, 12) / 12) * graphH;
          return (
            <Group>
              <Circle cx={lastX} cy={sleepY} r={4} color={COLORS.sleep} />
              <Circle cx={lastX} cy={moodY} r={4} color={COLORS.mood} />
              <Circle cx={lastX} cy={energyY} r={4} color={COLORS.energy} />
            </Group>
          );
        })()}

        {/* Background card */}
        <RoundedRect x={0} y={0} width={width} height={height - 60} r={20} color="transparent" />
      </Canvas>

      {/* ── Day labels ── */}
      <View style={[localStyles.dayLabels, { width }]}>
        {data.slice(-7).map((d, i) => (
          <Text key={`${d.date || 'unknown'}-${i}`} style={localStyles.dayLabel}>
            {d.date
              ? new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'narrow' })
              : ''}
          </Text>
        ))}
      </View>
    </View>
  );
});

export default SkiaStabilityDashboard;
export { computeStabilityIndex };

// ─── Styles ────────────────────────────────────────────────────────────────────

const localStyles = StyleSheet.create({
  card: {
    borderRadius: 20,
    backgroundColor: 'rgba(15, 18, 25, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
    padding: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingBottom: 8,
  },
  eyebrow: {
    color: 'rgba(253, 251, 247, 0.5)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  indexRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  indexValue: {
    fontSize: 32,
    fontWeight: '800',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  legend: {
    gap: 6,
    alignItems: 'flex-start',
    paddingTop: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    color: 'rgba(253, 251, 247, 0.5)',
    fontSize: 10,
    fontWeight: '600',
  },
  dayLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  dayLabel: {
    color: 'rgba(253, 251, 247, 0.35)',
    fontSize: 10,
    fontWeight: '600',
  },
  emptyText: {
    color: 'rgba(253, 251, 247, 0.5)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    padding: 20,
  },
});
