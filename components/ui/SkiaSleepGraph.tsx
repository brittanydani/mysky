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

import React, { memo, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import {
  Canvas,
  Path,
  Skia,
  LinearGradient,
  vec,
  BlurMask,
  Shadow,
  Group,
  Circle,
  Rect,
} from '@shopify/react-native-skia';
import { VelvetGlassSurface } from './VelvetGlassSurface';

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
  isDark?: boolean;
}

// ─── Palette ───────────────────────────────────────────────────────────────────

const COLORS = {
  deepRest: '#E6C785',
  deepRestSoft: '#F5E8C4',
  dreamMist: '#9CB8D8',
  amethyst: '#A88BEB',
  restless: '#556B95',
  moonlightBright: 'rgba(230, 199, 133, 0.40)',
  moonlightDim: 'rgba(86, 106, 148, 0.18)',
  moonCore: '#FFF5DC',
  axisText: 'rgba(240, 234, 214, 0.40)',
  gridLine: 'rgba(255, 255, 255, 0.06)',
};

function formatDuration(duration: number): string {
  const wholeHours = Math.floor(duration);
  const minutes = Math.round((duration - wholeHours) * 60);
  if (minutes === 0) return `${wholeHours}h`;
  return `${wholeHours}h ${minutes}m`;
}

// ─── Component ─────────────────────────────────────────────────────────────────

const SkiaSleepGraph = memo(function SkiaSleepGraph({
  data,
  width,
  height,
  isDark = true,
}: SkiaSleepGraphProps) {
  const [activeIdx, setActiveIdx] = useState<number | null>(data.length - 1);

  const MARGIN = { top: 18, bottom: 34, left: 10, right: 10 };
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
  const { strokePath, areaPath, lastPt, points, minY, maxY } = useMemo(() => {
    if (data.length < 2)
      return { strokePath: null, areaPath: null, lastPt: null, points: [], minY: 0, maxY: 0 };

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

    return { strokePath: stroke, areaPath: area, lastPt: last, points: pts, minY, maxY };
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
  const glowBlur = 10 + avgQualityNorm * 14;
  const coreGlowBlur = 5 + avgQualityNorm * 8;
  const areaBlur = 14 + avgQualityNorm * 18;
  const moonGlow = 8 + avgQualityNorm * 10;

  // Gradient alpha modulated by quality
  const areaAlphaHex = Math.round(0x16 + avgQualityNorm * 0x52)
    .toString(16)
    .padStart(2, '0');

  // Theme-aware colors
  const gridLineColor = isDark ? COLORS.gridLine : 'rgba(0, 0, 0, 0.05)';
  const axisTextColor = isDark ? COLORS.axisText : 'rgba(26, 24, 21, 0.7)';
  const areaFillTop = isDark ? COLORS.moonlightBright : 'rgba(160, 148, 200, 0.12)';
  const areaFillBottom = isDark ? 'rgba(16,22,35,0)' : 'rgba(255,255,255,0)';
  const areaSecondaryBottom = isDark ? 'rgba(10, 14, 22, 0.00)' : 'rgba(255, 255, 255, 0.00)';
  const orb1Color = isDark ? COLORS.moonlightBright : 'rgba(160, 148, 200, 0.08)';
  const orb2Color = isDark ? COLORS.moonlightDim : 'rgba(212, 175, 55, 0.06)';

  const gridValues = Array.from({ length: 4 }, (_, index) => {
    const ratio = index / 3;
    return {
      value: maxY - (maxY - minY) * ratio,
      y: MARGIN.top + graphH * ratio,
    };
  });

  const activePoint = activeIdx !== null ? points[activeIdx] : lastPt;
  const activeDatum = activeIdx !== null ? data[activeIdx] : data[data.length - 1];

  return (
    <View
      style={{ width, height }}
      accessibilityLabel={`Sleep restoration graph showing ${data.length} nights. Average quality ${(avgQualityNorm * 4 + 1).toFixed(1)} out of 5.`}
    >
      <Canvas style={StyleSheet.absoluteFill}>
        <Group>
          <Circle cx={width * 0.78} cy={MARGIN.top + graphH * 0.24} r={34} color={orb1Color}>
            <BlurMask blur={38} style="normal" />
          </Circle>
          <Circle cx={width * 0.2} cy={MARGIN.top + graphH * 0.82} r={42} color={orb2Color}>
            <BlurMask blur={42} style="normal" />
          </Circle>

          {gridValues.map((grid) => (
            <Rect
              key={grid.value}
              x={MARGIN.left}
              y={grid.y}
              width={graphW}
              height={1}
              color={gridLineColor}
            />
          ))}

          <Path path={areaPath} style="fill">
            <LinearGradient
              start={vec(0, MARGIN.top)}
              end={vec(0, MARGIN.top + graphH)}
              colors={[areaFillTop, areaFillBottom]}
            />
            <BlurMask blur={areaBlur} style="normal" />
          </Path>

          <Path path={areaPath} style="fill">
            <LinearGradient
              start={vec(0, MARGIN.top)}
              end={vec(0, MARGIN.top + graphH)}
              colors={[
                `${COLORS.deepRest}${areaAlphaHex}`,
                'rgba(140, 184, 216, 0.08)',
                areaSecondaryBottom,
              ]}
              positions={[0, 0.45, 1]}
            />
          </Path>

          <Path path={strokePath} style="stroke" strokeWidth={3.2} strokeCap="round" strokeJoin="round">
            <LinearGradient
              start={vec(MARGIN.left, MARGIN.top)}
              end={vec(width - MARGIN.right, MARGIN.top)}
              colors={[COLORS.restless, COLORS.amethyst, COLORS.deepRestSoft]}
            />
            <Shadow dx={0} dy={2} blur={6} color="rgba(40, 28, 64, 0.26)" />
            <Shadow dx={0} dy={0} blur={glowBlur} color="rgba(245, 232, 196, 0.34)" />
            <Shadow dx={0} dy={0} blur={coreGlowBlur} color="rgba(245, 232, 196, 0.68)" />
          </Path>

          <Path path={strokePath} style="stroke" strokeWidth={2.2} strokeCap="round" strokeJoin="round" opacity={0.9}>
            <LinearGradient
              start={vec(MARGIN.left, MARGIN.top)}
              end={vec(width - MARGIN.right, MARGIN.top)}
              colors={[COLORS.dreamMist, COLORS.deepRestSoft, '#FFFFFF']}
            />
            <Shadow dx={0} dy={1} blur={12} color="rgba(255, 245, 220, 0.42)" />
          </Path>

          <Path path={strokePath} style="stroke" strokeWidth={1.9} strokeCap="round" strokeJoin="round">
            <LinearGradient
              start={vec(MARGIN.left, MARGIN.top)}
              end={vec(width - MARGIN.right, MARGIN.top)}
              colors={[COLORS.dreamMist, COLORS.amethyst, COLORS.deepRestSoft]}
            />
          </Path>

          {points.map((pt, i) => {
            const qNorm = Math.min(1, Math.max(0, (pt.quality - 1) / 4));
            const isActive = activeIdx === i;
            const fill = qNorm > 0.5 ? COLORS.deepRestSoft : COLORS.dreamMist;
            return (
              <React.Fragment key={i}>
                {isActive && (
                  <Circle cx={pt.x} cy={pt.y} r={11} color="rgba(230, 199, 133, 0.22)">
                    <BlurMask blur={18} style="normal" />
                  </Circle>
                )}
                <Circle cx={pt.x} cy={pt.y} r={isActive ? 4.5 : 3} color={fill} />
              </React.Fragment>
            );
          })}

          <Circle cx={activePoint.x} cy={activePoint.y} r={7} color="rgba(230, 199, 133, 0.36)">
            <BlurMask blur={moonGlow} style="normal" />
          </Circle>
          <Circle cx={activePoint.x} cy={activePoint.y} r={4.2} color={COLORS.deepRest} />
          <Circle cx={activePoint.x} cy={activePoint.y} r={2.2} color={COLORS.moonCore} />
        </Group>
      </Canvas>

      <View style={styles.gridLabels} pointerEvents="none">
        {gridValues.map((grid) => (
          <Text key={grid.value} style={[styles.axisLabel, { top: grid.y - 8, color: axisTextColor }]}>
            {grid.value.toFixed(0)}h
          </Text>
        ))}
      </View>

      {points.map((pt, index) => (
        <Pressable
          key={`${pt.x}-${index}`}
          style={[
            styles.hitTarget,
            {
              left: pt.x - 18,
              top: MARGIN.top,
              height: graphH,
            },
          ]}
          onPress={() => setActiveIdx((current) => (current === index ? null : index))}
          accessibilityRole="button"
          accessibilityLabel={`Sleep data point ${index + 1}`}
        />
      ))}

      <View style={styles.dayLabels} pointerEvents="none">
        {points.map((pt, index) => (
          <Text
            key={`day-${index}`}
            style={[
              styles.dayLabel,
              {
                left: pt.x - 16,
                color: activeIdx === index
                  ? (isDark ? 'rgba(255,255,255,0.88)' : 'rgba(26, 24, 21, 0.9)')
                  : axisTextColor,
              },
            ]}
          >
            {new Date((data[index].date ?? '') + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 1)}
          </Text>
        ))}
      </View>

      {activeIdx !== null && activeDatum && (
        <View
          pointerEvents="none"
          style={[
            styles.tooltipWrap,
            {
              left: Math.max(8, Math.min(width - 172, activePoint.x - 78)),
              top: Math.max(4, activePoint.y - 82),
            },
          ]}
        >
          <VelvetGlassSurface
            style={styles.tooltipSurface}
            intensity={52}
            backgroundColor="rgba(10, 14, 23, 0.34)"
            borderColor="rgba(255,255,255,0.12)"
            highlightColor="rgba(255,255,255,0.05)"
          >
            <View style={styles.tooltipAccent} />
            <Text style={styles.tooltipDate}>{activeDatum.date ? new Date(`${activeDatum.date}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Night'}</Text>
            <Text style={styles.tooltipDuration}>{formatDuration(activeDatum.duration)}</Text>
            <View style={styles.tooltipMetaRow}>
              <View style={styles.tooltipMetaItem}>
                <View style={[styles.tooltipDot, { backgroundColor: COLORS.deepRest }]} />
                <Text style={styles.tooltipMetaLabel}>Quality</Text>
              </View>
              <Text style={styles.tooltipMetaValue}>{activeDatum.quality.toFixed(1)}/5</Text>
            </View>
          </VelvetGlassSurface>
        </View>
      )}
    </View>
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
    textAlign: 'center',
  },
});

const styles = StyleSheet.create({
  hitTarget: {
    position: 'absolute',
    width: 36,
  },
  gridLabels: {
    ...StyleSheet.absoluteFillObject,
  },
  axisLabel: {
    position: 'absolute',
    left: 0,
    fontSize: 10,
    color: COLORS.axisText,
    letterSpacing: 0.6,
  },
  dayLabels: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 22,
  },
  dayLabel: {
    position: 'absolute',
    bottom: 0,
    width: 32,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.9,
  },
  tooltipWrap: {
    position: 'absolute',
    width: 156,
  },
  tooltipSurface: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  tooltipAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(230, 199, 133, 0.62)',
  },
  tooltipDate: {
    color: 'rgba(255,255,255,0.58)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  tooltipDuration: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  tooltipMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tooltipMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tooltipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tooltipMetaLabel: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 11,
    fontWeight: '600',
  },
  tooltipMetaValue: {
    color: COLORS.deepRestSoft,
    fontSize: 11,
    fontWeight: '700',
  },
});
