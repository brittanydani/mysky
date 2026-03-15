/**
 * StabilityRibbonChart.tsx
 * MySky — 30-Day Stability Ribbon Visualization (Skia)
 *
 * A filled "corridor" chart that shows inner stability over time:
 *   • Center line = composite daily score (average of mood, energy, inverse-stress)
 *   • Ribbon band = spread between daily min and max metric
 *   • Narrow ribbon = stable day, wide ribbon = volatile day
 *   • Day dots color-shift from gold (stable) to rose (volatile)
 *
 * Visually distinct from NeonWaveChart (which renders 3 separate trend lines).
 */

import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  Canvas,
  Path,
  Skia,
  LinearGradient,
  Circle,
  BlurMask,
  Rect,
  vec,
} from '@shopify/react-native-skia';
import { DailyCheckIn } from '../../services/patterns/types';

// ── Palette ───────────────────────────────────────────────────────────────────

const GOLD       = '#D4B872';
const ROSE       = '#E8807A';
const EMERALD    = '#6EBF8B';
const CENTER_CLR = '#E2C27A';

// ── Helpers ───────────────────────────────────────────────────────────────────

function levelToNum(level: 'low' | 'medium' | 'high'): number {
  return level === 'low' ? 2 : level === 'medium' ? 5 : 9;
}

function withAlpha(color: string, alpha: number): string {
  return color + Math.round(alpha * 255).toString(16).padStart(2, '0');
}

/** Clamp a value between min and max */
function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/** Interpolate between two hex colors (0–1 ratio) */
function lerpColor(a: string, b: string, t: number): string {
  const toRgb = (hex: string) => {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
  };
  const [r1, g1, b1] = toRgb(a);
  const [r2, g2, b2] = toRgb(b);
  const mix = (s: number, e: number) => Math.round(s + (e - s) * t);
  return `#${[mix(r1, r2), mix(g1, g2), mix(b1, b2)].map(c => c.toString(16).padStart(2, '0')).join('')}`;
}

// ── Layout ────────────────────────────────────────────────────────────────────

const PAD_L = 12;
const PAD_R = 12;
const PAD_T = 20;
const PAD_B = 28;

// ── Types ─────────────────────────────────────────────────────────────────────

interface DayMetrics {
  date: string;
  avg: number;    // composite score 1–9
  lo: number;     // min of the three metrics
  hi: number;     // max of the three metrics
  spread: number; // hi - lo (0–8 range)
}

export interface StabilityRibbonChartProps {
  checkIns: DailyCheckIn[];
  width: number;
  height?: number;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function StabilityRibbonChart({ checkIns, width, height = 200 }: StabilityRibbonChartProps) {
  const days = useMemo(() => {
    const sorted = [...checkIns].sort((a, b) => a.date.localeCompare(b.date)).slice(-30);
    return sorted.map((c): DayMetrics => {
      const m = c.moodScore;
      const e = levelToNum(c.energyLevel);
      const s = levelToNum(c.stressLevel);
      // Invert stress so that higher = better / calmer
      const sInv = 10 - s;
      const vals = [m, e, sInv];
      const lo = Math.min(...vals);
      const hi = Math.max(...vals);
      const avg = (m + e + sInv) / 3;
      return { date: c.date, avg: clamp(avg, 1, 9), lo: clamp(lo, 1, 9), hi: clamp(hi, 1, 9), spread: hi - lo };
    });
  }, [checkIns]);

  const total = days.length;
  const plotW = width - PAD_L - PAD_R;
  const plotH = height - PAD_T - PAD_B;
  const plotBottom = PAD_T + plotH;

  // Map a value (1–9) to a Y coordinate
  const valToY = (v: number) => PAD_T + (1 - (v - 1) / 8) * plotH;
  const idxToX = (i: number) => PAD_L + (total <= 1 ? plotW / 2 : (i / (total - 1)) * plotW);

  // Build ribbon upper & lower boundary paths + center line
  const { ribbonPath, centerPath, gridPaths, dots, axisLabels } = useMemo(() => {
    const upperPts = days.map((d, i) => ({ x: idxToX(i), y: valToY(d.hi) }));
    const lowerPts = days.map((d, i) => ({ x: idxToX(i), y: valToY(d.lo) }));
    const centerPts = days.map((d, i) => ({ x: idxToX(i), y: valToY(d.avg) }));

    // Smooth bezier path builder
    const smooth = (pts: { x: number; y: number }[]) => {
      const p = Skia.Path.Make();
      if (pts.length < 2) return p;
      p.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        const cx = (pts[i - 1].x + pts[i].x) / 2;
        p.cubicTo(cx, pts[i - 1].y, cx, pts[i].y, pts[i].x, pts[i].y);
      }
      return p;
    };

    // Ribbon: upper boundary → (reverse) lower boundary, closed
    const ribbon = Skia.Path.Make();
    if (total >= 2) {
      // Upper boundary (left to right)
      ribbon.moveTo(upperPts[0].x, upperPts[0].y);
      for (let i = 1; i < total; i++) {
        const cx = (upperPts[i - 1].x + upperPts[i].x) / 2;
        ribbon.cubicTo(cx, upperPts[i - 1].y, cx, upperPts[i].y, upperPts[i].x, upperPts[i].y);
      }
      // Lower boundary (right to left)
      ribbon.lineTo(lowerPts[total - 1].x, lowerPts[total - 1].y);
      for (let i = total - 2; i >= 0; i--) {
        const cx = (lowerPts[i + 1].x + lowerPts[i].x) / 2;
        ribbon.cubicTo(cx, lowerPts[i + 1].y, cx, lowerPts[i].y, lowerPts[i].x, lowerPts[i].y);
      }
      ribbon.close();
    }

    const center = smooth(centerPts);

    // Grid lines at 9, 5, 1
    const grids = ([9, 5, 1] as const).map(v => {
      const gy = valToY(v);
      const gp = Skia.Path.Make();
      gp.moveTo(PAD_L, gy);
      gp.lineTo(PAD_L + plotW, gy);
      return { path: gp, label: v === 9 ? 'Calm' : v === 5 ? 'Mid' : 'Tense' };
    });

    // Dots: one per day, with spread-based color
    const maxSpread = 8;
    const dotData = days.map((d, i) => {
      const t = clamp(d.spread / maxSpread, 0, 1);
      const color = lerpColor(EMERALD, ROSE, t);
      return { x: centerPts[i].x, y: centerPts[i].y, color, spread: d.spread };
    });

    // X-axis labels: first, middle, last
    const labels: { text: string; x: number }[] = [];
    if (total >= 2) {
      const indices = [...new Set([0, Math.floor((total - 1) / 2), total - 1])];
      for (const i of indices) {
        labels.push({
          text: new Date(days[i].date + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          x: idxToX(i),
        });
      }
    }

    return { ribbonPath: ribbon, centerPath: center, gridPaths: grids, dots: dotData, axisLabels: labels };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days, plotW, plotH, total]);

  if (total < 2) {
    return (
      <View style={[styles.root, { width, height, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.emptyTxt}>Log more check-ins to see your stability map</Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { width, height }]}>
      <Canvas style={StyleSheet.absoluteFill}>
        {/* Plot area background */}
        <Rect x={PAD_L} y={PAD_T} width={plotW} height={plotH}>
          <LinearGradient
            start={vec(PAD_L, PAD_T)}
            end={vec(PAD_L, plotBottom)}
            colors={['rgba(40,30,70,0.20)', 'rgba(8,8,20,0.06)']}
          />
        </Rect>

        {/* Horizontal grid lines */}
        {gridPaths.map((g, i) => (
          <Path key={i} path={g.path} style="stroke" strokeWidth={1} color="rgba(255,255,255,0.08)" />
        ))}

        {/* Stability ribbon — filled band */}
        <Path path={ribbonPath}>
          <LinearGradient
            start={vec(PAD_L, PAD_T)}
            end={vec(PAD_L, plotBottom)}
            colors={[withAlpha(EMERALD, 0.28), withAlpha(GOLD, 0.16), withAlpha(ROSE, 0.10)]}
            positions={[0, 0.5, 1]}
          />
        </Path>

        {/* Ribbon edge glow (top) */}
        <Path path={ribbonPath} style="stroke" strokeWidth={1} color={withAlpha(GOLD, 0.18)}>
          <BlurMask blur={4} style="solid" />
        </Path>

        {/* Center line — outer glow */}
        <Path path={centerPath} style="stroke" strokeWidth={8} strokeCap="round" color={withAlpha(CENTER_CLR, 0.12)}>
          <BlurMask blur={10} style="solid" />
        </Path>

        {/* Center line — core stroke */}
        <Path path={centerPath} style="stroke" strokeWidth={2} strokeCap="round" color={withAlpha(CENTER_CLR, 0.9)} />

        {/* Day dots */}
        {dots.map((d, i) => (
          <React.Fragment key={i}>
            <Circle cx={d.x} cy={d.y} r={3.5} color={d.color} />
            <Circle cx={d.x} cy={d.y} r={6} color={withAlpha(d.color, 0.15)}>
              <BlurMask blur={5} style="normal" />
            </Circle>
          </React.Fragment>
        ))}
      </Canvas>

      {/* Y-axis grid labels */}
      {gridPaths.map((g, i) => {
        const gy = ([9, 5, 1] as const).map(v => valToY(v));
        return (
          <Text key={i} style={[styles.gridLabel, { top: gy[i] - 7 }]}>
            {g.label}
          </Text>
        );
      })}

      {/* X-axis date labels */}
      {axisLabels.map((lbl, i) => (
        <Text
          key={i}
          style={[
            styles.xLabel,
            { left: lbl.x, top: height - PAD_B + 6 },
            i === 0 && { textAlign: 'left', left: lbl.x - 2 },
            i === axisLabels.length - 1 && { textAlign: 'right', left: lbl.x - 48 },
          ]}
        >
          {lbl.text}
        </Text>
      ))}

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: EMERALD }]} />
          <Text style={styles.legendText}>Stable</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: ROSE }]} />
          <Text style={styles.legendText}>Volatile</Text>
        </View>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    position: 'relative',
  },
  emptyTxt: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  gridLabel: {
    position: 'absolute',
    left: 0,
    color: 'rgba(255,255,255,0.28)',
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.6,
  },
  xLabel: {
    position: 'absolute',
    color: 'rgba(255,255,255,0.32)',
    fontSize: 9,
    fontWeight: '500',
    width: 52,
    textAlign: 'center',
  },
  legend: {
    position: 'absolute',
    top: 2,
    right: 4,
    flexDirection: 'row',
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    color: 'rgba(255,255,255,0.38)',
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
});
