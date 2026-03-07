/**
 * SkiaSleepGraph — "Nightly Ascent" Restoration Visualization
 *
 * GPU-accelerated sleep graph using Skia.
 * Duration maps to height (the "ascent"), sleep quality drives the
 * "Moonlight" glow intensity — well-rested nights bloom with a radiant
 * Silver-Blue aura, while restless nights appear as a dimmer Indigo.
 *
 * Design language:
 *  - Restoration gradient: Indigo (restless) → Silver-Blue (deep rest)
 *  - Adaptive blur: high-quality weeks glow softly; poor-sleep weeks stay sharp
 *  - Cubic beziers: transitions between nights feel like rolling hills
 *  - Terminal "Moon" node: pulsing indicator on the most recent night
 */

import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
} from '@shopify/react-native-skia';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface SleepPoint {
  /** Hours slept, 0–12 */
  duration: number;
  /** Sleep quality, 1–5 (moon scale) */
  quality: number;
  /** Date label for accessibility */
  date?: string;
}

interface SkiaSleepGraphProps {
  data: SleepPoint[];
  width: number;
  height: number;
}

// ─── Palette ───────────────────────────────────────────────────────────────────

const COLORS = {
  /** High-quality deep rest — radiant silver-blue */
  deepRest: '#8BC4E8',
  /** Low-quality / restless — dim indigo */
  restless: '#4A3B6B',
  /** Moonlight aura for background glow */
  moonlightBright: 'rgba(139, 196, 232, 0.45)',
  moonlightDim: 'rgba(74, 59, 107, 0.20)',
  /** Terminal node inner color */
  moonCore: '#F0EAD6',
  /** Axis text */
  axisText: 'rgba(240, 234, 214, 0.35)',
  /** Grid lines */
  gridLine: 'rgba(255, 255, 255, 0.04)',
};

// ─── Component ─────────────────────────────────────────────────────────────────

const SkiaSleepGraph = memo(function SkiaSleepGraph({
  data,
  width,
  height,
}: SkiaSleepGraphProps) {
  const MARGIN = { top: 16, bottom: 24, left: 4, right: 4 };
  const graphW = width - MARGIN.left - MARGIN.right;
  const graphH = height - MARGIN.top - MARGIN.bottom;

  /** Average quality across all points (1–5) normalized to 0–1 */
  const avgQualityNorm = useMemo(() => {
    if (data.length === 0) return 0;
    const sum = data.reduce((acc, p) => acc + p.quality, 0);
    return Math.min(1, Math.max(0, (sum / data.length - 1) / 4)); // (avg-1)/4 → 0..1
  }, [data]);

  /**
   * Build the three Skia paths:
   *  1. strokePath — the visible "ascent" line
   *  2. areaPath  — the filled region beneath the line (gradient fill)
   *  3. lastPt    — coordinates of the terminal data point ("Moon")
   */
  const { strokePath, areaPath, lastPt, points } = useMemo(() => {
    if (data.length < 2)
      return { strokePath: null, areaPath: null, lastPt: null, points: [] };

    // Auto-scale: use actual data range with padding so small variations show
    const durations = data.map(p => p.duration);
    const dataMin = Math.min(...durations);
    const dataMax = Math.max(...durations);
    const span = dataMax - dataMin;
    const buf = Math.max(span * 0.25, 0.5);
    const minY = Math.max(0, Math.floor(dataMin - buf));
    const maxY = Math.min(12, Math.ceil(dataMax + buf));
    const range = maxY - minY || 1;

    // Map each point to canvas coordinates
    const pts = data.map((p, i) => ({
      x: MARGIN.left + (i / (data.length - 1)) * graphW,
      y: MARGIN.top + graphH - ((p.duration - minY) / range) * graphH,
      quality: p.quality,
    }));

    // ── Stroke path (smooth cubic bezier) ──
    const stroke = Skia.Path.Make();
    stroke.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const cpX = (prev.x + curr.x) / 2;
      stroke.cubicTo(cpX, prev.y, cpX, curr.y, curr.x, curr.y);
    }

    // ── Area fill path (close downward) ──
    const area = Skia.Path.Make();
    area.addPath(stroke);
    const last = pts[pts.length - 1];
    area.lineTo(last.x, MARGIN.top + graphH);
    area.lineTo(pts[0].x, MARGIN.top + graphH);
    area.close();

    return { strokePath: stroke, areaPath: area, lastPt: last, points: pts };
  }, [data, graphW, graphH, MARGIN.left, MARGIN.top]);

  // ── Empty state ──
  if (!strokePath || !areaPath || !lastPt) {
    return (
      <View
        style={[localStyles.emptyWrap, { width, height }]}
        accessibilityLabel="Sleep restoration graph — not enough data"
      >
        <Text style={localStyles.emptyText}>
          {data.length === 0
            ? 'Log a few nights to see your restoration cycle'
            : 'One more night to visualize your pattern'}
        </Text>
      </View>
    );
  }

  // Dynamic blur intensity: well-rested → bloom, restless → sharp
  const glowBlur = 2 + avgQualityNorm * 6;     // 2 … 8
  const areaBlur = 8 + avgQualityNorm * 14;     // 8 … 22
  const moonGlow = 4 + avgQualityNorm * 8;      // 4 … 12

  // Gradient alpha modulated by quality
  const areaAlphaHex = Math.round(0x10 + avgQualityNorm * 0x60)
    .toString(16)
    .padStart(2, '0');

  return (
    <Canvas
      style={{ width, height }}
      accessibilityLabel={`Sleep restoration graph showing ${data.length} nights. Average quality ${(avgQualityNorm * 4 + 1).toFixed(1)} out of 5.`}
     mode="continuous">
      <Group>
        {/* ── 1. Background Atmosphere (quality-driven glow) ── */}
        <Path path={areaPath} style="fill">
          <LinearGradient
            start={vec(0, MARGIN.top)}
            end={vec(0, MARGIN.top + graphH)}
            colors={[
              avgQualityNorm > 0.5
                ? COLORS.moonlightBright
                : COLORS.moonlightDim,
              'transparent',
            ]}
          />
          <BlurMask blur={areaBlur} style="inner" />
        </Path>

        {/* ── 2. Gradient area fill — deep water feel ── */}
        <Path path={areaPath} style="fill">
          <LinearGradient
            start={vec(0, MARGIN.top)}
            end={vec(0, MARGIN.top + graphH)}
            colors={[
              `${COLORS.deepRest}${areaAlphaHex}`,
              `${COLORS.restless}08`,
            ]}
          />
        </Path>

        {/* ── 3. Restoration Line — outer glow (neon bleed) ── */}
        <Path
          path={strokePath}
          style="stroke"
          strokeWidth={3}
          strokeCap="round"
          strokeJoin="round"
        >
          <LinearGradient
            start={vec(0, 0)}
            end={vec(width, 0)}
            colors={[COLORS.restless, COLORS.deepRest, COLORS.deepRest]}
          />
          <BlurMask blur={glowBlur} style="outer" />
        </Path>

        {/* ── 4. Crisp inner stroke ── */}
        <Path
          path={strokePath}
          style="stroke"
          strokeWidth={2}
          strokeCap="round"
          strokeJoin="round"
        >
          <LinearGradient
            start={vec(0, 0)}
            end={vec(width, 0)}
            colors={[COLORS.restless, COLORS.deepRest, COLORS.deepRest]}
          />
        </Path>

        {/* ── 5. Per-night quality dots ── */}
        {points.map((pt, i) => {
          // Normalize quality 1-5 → 0-1 for color interpolation
          const qNorm = Math.min(1, Math.max(0, (pt.quality - 1) / 4));
          // Dim dot for low quality, bright for high
          const dotAlpha = Math.round(0x30 + qNorm * 0xA0)
            .toString(16)
            .padStart(2, '0');
          return (
            <Circle
              key={i}
              cx={pt.x}
              cy={pt.y}
              r={qNorm > 0.6 ? 3 : 2}
              color={
                qNorm > 0.6
                  ? `${COLORS.deepRest}${dotAlpha}`
                  : `${COLORS.restless}${dotAlpha}`
              }
            />
          );
        })}

        {/* ── 6. Terminal "Moon" node — pulsing last-data-point ── */}
        {/* Outer glow */}
        <Circle
          cx={lastPt.x}
          cy={lastPt.y}
          r={7}
          color={`${COLORS.deepRest}50`}
        >
          <BlurMask blur={moonGlow} style="normal" />
        </Circle>
        {/* Mid ring */}
        <Circle
          cx={lastPt.x}
          cy={lastPt.y}
          r={4.5}
          color={COLORS.deepRest}
        />
        {/* Core */}
        <Circle
          cx={lastPt.x}
          cy={lastPt.y}
          r={2.5}
          color={COLORS.moonCore}
        />
      </Group>
    </Canvas>
  );
});

export default SkiaSleepGraph;

// ─── Local Styles ──────────────────────────────────────────────────────────────

const localStyles = StyleSheet.create({
  emptyWrap: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    color: 'rgba(240, 234, 214, 0.4)',
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
