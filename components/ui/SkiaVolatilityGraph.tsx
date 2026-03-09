/**
 * SkiaVolatilityGraph — Emotional Volatility Graph
 *
 * Plots daily mood scores as a spline trend line with a shaded "Stability Band"
 * (±1 standard deviation). A wide band = high turbulence; a tight band = stability.
 * Supports data-scrubbing with micro-haptics.
 */
import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  PanResponder,
} from 'react-native';
import {
  Canvas,
  Path,
  Circle,
  LinearGradient as SkiaLinearGradient,
  vec,
  Line as SkiaLine,
  BlurMask,
} from '@shopify/react-native-skia';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { DailyCheckIn } from '../../services/patterns/types';
import { parseLocalDate } from '../../utils/dateUtils';

// ── Palette ──
const STABLE_COLOR = theme.energy;       // emerald #6EBF8B (tight band)
const TURBULENT_COLOR = theme.cinematic.copper; // copper #CD7F5D (wide band)
const LINE_COLOR = theme.textGold;       // gold

const PAD = { top: 24, right: 16, bottom: 40, left: 16 };
const DOT_R = 3.5;
const SCRUB_R = 6;

// Volatility thresholds (on a 1–10 mood scale)
const LOW_VOLATILITY = 1.2;    // std dev under which band is "stable"
const HIGH_VOLATILITY = 2.8;   // std dev above which band is "turbulent"

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * clamp(t, 0, 1);
}

function clamp(v: number, lo: number, hi: number) {
  return Math.min(Math.max(v, lo), hi);
}

function interpolateColor(t: number, colorA: string, colorB: string): string {
  // Simple hex-to-rgb interpolation
  const parse = (hex: string) => {
    const h = hex.replace('#', '');
    return [
      parseInt(h.substring(0, 2), 16),
      parseInt(h.substring(2, 4), 16),
      parseInt(h.substring(4, 6), 16),
    ];
  };
  const a = parse(colorA);
  const b = parse(colorB);
  const r = Math.round(lerp(a[0], b[0], t));
  const g = Math.round(lerp(a[1], b[1], t));
  const bl = Math.round(lerp(a[2], b[2], t));
  return `rgb(${r},${g},${bl})`;
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface DayPoint {
  x: number;
  y: number;
  mean: number;
  upperBand: number;
  lowerBand: number;
  dateLabel: string;
  dayLabel: string;
}

// ── Component ──────────────────────────────────────────────────────────────────

interface Props {
  checkIns: DailyCheckIn[];
  width?: number;
  height?: number;
}

export default function SkiaVolatilityGraph({
  checkIns,
  width = Dimensions.get('window').width - 40,
  height = 180,
}: Props) {
  const [scrubIndex, setScrubIndex] = useState<number | null>(null);
  const lastScrubRef = useRef<number>(-1);

  const chartW = width - PAD.left - PAD.right;
  const chartH = height - PAD.top - PAD.bottom;

  // Pulse animation for the central line
  const glowOpacity = useSharedValue(0.6);
  useEffect(() => {
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.55, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, []);

  // ── Aggregate check-ins by date ──
  const dayPoints: DayPoint[] = useMemo(() => {
    const byDate: Record<string, number[]> = {};
    const recentCIs = [...checkIns]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14); // last 14 calendar days (at most 14 points)

    for (const ci of recentCIs) {
      if (!byDate[ci.date]) byDate[ci.date] = [];
      byDate[ci.date].push(ci.moodScore);
    }

    const dates = Object.keys(byDate).sort();
    if (dates.length < 2) return [];

    // Compute overall std dev of all daily means (for band color)
    const allMeans = dates.map(d => {
      const scores = byDate[d];
      return scores.reduce((s, v) => s + v, 0) / scores.length;
    });

    const globalMean = allMeans.reduce((s, v) => s + v, 0) / allMeans.length;
    const globalStd = Math.sqrt(
      allMeans.reduce((s, v) => s + (v - globalMean) ** 2, 0) / allMeans.length,
    );

    return dates.map((date, i) => {
      const scores = byDate[date];
      const mean = scores.reduce((s, v) => s + v, 0) / scores.length;

      // Per-day std dev (or global / 2 if only one check-in that day)
      let dayStd = globalStd;
      if (scores.length > 1) {
        dayStd = Math.sqrt(
          scores.reduce((s, v) => s + (v - mean) ** 2, 0) / scores.length,
        );
      }

      const upperBand = clamp(mean + dayStd, 1, 10);
      const lowerBand = clamp(mean - dayStd, 1, 10);

      const x = PAD.left + (i / (dates.length - 1)) * chartW;
      const toY = (v: number) => PAD.top + chartH - ((v - 1) / 9) * chartH;

      const parsed = parseLocalDate(date);
      const dayLabel = ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa'][parsed.getDay()];
      const dateLabel = parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      return {
        x,
        y: toY(mean),
        mean,
        upperBand: toY(upperBand),
        lowerBand: toY(lowerBand),
        dateLabel,
        dayLabel,
      };
    });
  }, [checkIns, chartW, chartH]);

  // ── Volatility score + band color ──
  const { volatilityScore, bandColor, bandColorHex, label } = useMemo(() => {
    if (dayPoints.length === 0) return { volatilityScore: 0, bandColor: STABLE_COLOR, bandColorHex: STABLE_COLOR, label: '—' };

    const means = dayPoints.map(p => p.mean);
    const globalMean = means.reduce((s, v) => s + v, 0) / means.length;
    const std = Math.sqrt(
      means.reduce((s, v) => s + (v - globalMean) ** 2, 0) / means.length,
    );

    const t = clamp((std - LOW_VOLATILITY) / (HIGH_VOLATILITY - LOW_VOLATILITY), 0, 1);
    const score = Math.round(t * 10);
    const hex = interpolateColor(t, STABLE_COLOR, TURBULENT_COLOR);
    const lab = t < 0.3 ? 'Stable' : t < 0.65 ? 'Variable' : 'Turbulent';

    return { volatilityScore: score, bandColor: hex, bandColorHex: hex, label: lab };
  }, [dayPoints]);

  // ── SVG paths ──
  const { linePath, bandfillPath } = useMemo(() => {
    if (dayPoints.length < 2) return { linePath: '', bandfillPath: '' };

    // Smooth Bézier line
    let line = `M${dayPoints[0].x},${dayPoints[0].y}`;
    for (let i = 0; i < dayPoints.length - 1; i++) {
      const cpX = (dayPoints[i].x + dayPoints[i + 1].x) / 2;
      line += ` C${cpX},${dayPoints[i].y} ${cpX},${dayPoints[i + 1].y} ${dayPoints[i + 1].x},${dayPoints[i + 1].y}`;
    }

    // Band: upper edge forward, lower edge backward
    let band = `M${dayPoints[0].x},${dayPoints[0].upperBand}`;
    for (let i = 0; i < dayPoints.length - 1; i++) {
      const cpX = (dayPoints[i].x + dayPoints[i + 1].x) / 2;
      band += ` C${cpX},${dayPoints[i].upperBand} ${cpX},${dayPoints[i + 1].upperBand} ${dayPoints[i + 1].x},${dayPoints[i + 1].upperBand}`;
    }
    // close lower edge (reversed)
    for (let i = dayPoints.length - 1; i >= 1; i--) {
      const cpX = (dayPoints[i].x + dayPoints[i - 1].x) / 2;
      band += ` C${cpX},${dayPoints[i].lowerBand} ${cpX},${dayPoints[i - 1].lowerBand} ${dayPoints[i - 1].x},${dayPoints[i - 1].lowerBand}`;
    }
    band += ' Z';

    return { linePath: line, bandfillPath: band };
  }, [dayPoints]);

  // ── Scrub gesture ──
  const findClosest = useCallback(
    (touchX: number) => {
      if (dayPoints.length === 0) return -1;
      let best = 0;
      let bestDist = Math.abs(dayPoints[0].x - touchX);
      for (let i = 1; i < dayPoints.length; i++) {
        const d = Math.abs(dayPoints[i].x - touchX);
        if (d < bestDist) { bestDist = d; best = i; }
      }
      return best;
    },
    [dayPoints],
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: e => {
        const idx = findClosest(e.nativeEvent.locationX);
        if (idx >= 0) {
          setScrubIndex(idx);
          lastScrubRef.current = idx;
          Haptics.selectionAsync().catch(() => {});
        }
      },
      onPanResponderMove: e => {
        const idx = findClosest(e.nativeEvent.locationX);
        if (idx >= 0 && idx !== lastScrubRef.current) {
          setScrubIndex(idx);
          lastScrubRef.current = idx;
          Haptics.selectionAsync().catch(() => {});
        }
      },
      onPanResponderRelease: () => { setScrubIndex(null); lastScrubRef.current = -1; },
      onPanResponderTerminate: () => { setScrubIndex(null); lastScrubRef.current = -1; },
    }),
  ).current;

  // ── Empty state ──
  if (dayPoints.length < 3) {
    return (
      <View style={[styles.emptyCard, { width }]}>
        <Ionicons name="stats-chart" size={28} color={theme.textSecondary} />
        <Text style={styles.emptyText}>Log 3+ days of check-ins to reveal your stability pattern</Text>
      </View>
    );
  }

  const scrubPt = scrubIndex !== null ? dayPoints[scrubIndex] : null;
  const bandAlpha = '33'; // 20% opacity fill

  return (
    <View style={{ width }}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.titleText}>Emotional Volatility</Text>
          <Text style={styles.subtitleText}>Stability band · {dayPoints.length}-day window</Text>
        </View>
        <View style={[styles.scorePill, { borderColor: `${bandColorHex}44` }]}>
          <Text style={[styles.scoreLabel, { color: bandColorHex }]}>{label}</Text>
        </View>
      </View>

      {/* Canvas */}
      <View style={[styles.canvasCard, { width }]} {...panResponder.panHandlers}>
        <Canvas style={{ width, height }}>
          {/* Grid lines */}
          {[0, 0.5, 1].map(p => (
            <SkiaLine
              key={p}
              p1={vec(PAD.left, PAD.top + p * chartH)}
              p2={vec(PAD.left + chartW, PAD.top + p * chartH)}
              color="rgba(255,255,255,0.05)"
              strokeWidth={1}
            />
          ))}

          {/* Stability band fill */}
          {bandfillPath !== '' && (
            <Path path={bandfillPath} style="fill" color={`${bandColorHex}${bandAlpha}`} />
          )}

          {/* Band glow (outer blur layer) */}
          {bandfillPath !== '' && (
            <Path path={bandfillPath} style="fill" color={`${bandColorHex}22`}>
              <BlurMask blur={10} style="normal" />
            </Path>
          )}

          {/* Mean trend line */}
          {linePath !== '' && (
            <Path
              path={linePath}
              color={LINE_COLOR}
              style="stroke"
              strokeWidth={2.5}
              strokeJoin="round"
            />
          )}

          {/* Data points */}
          {dayPoints.map((pt, i) => (
            <Circle
              key={i}
              cx={pt.x}
              cy={pt.y}
              r={scrubIndex === i ? SCRUB_R : DOT_R}
              color={scrubIndex === i ? LINE_COLOR : `${LINE_COLOR}CC`}
            />
          ))}

          {/* Scrub vertical line */}
          {scrubPt && (
            <SkiaLine
              p1={vec(scrubPt.x, PAD.top)}
              p2={vec(scrubPt.x, PAD.top + chartH)}
              color={`${LINE_COLOR}44`}
              strokeWidth={1}
            />
          )}
        </Canvas>

        {/* Scrub tooltip */}
        {scrubPt && (
          <View
            style={[
              styles.tooltip,
              {
                left: clamp(scrubPt.x - 52, 4, width - 112),
                top: clamp(scrubPt.y - 50, 2, height - 60),
              },
            ]}
          >
            <Text style={styles.tooltipDate}>{scrubPt.dateLabel}</Text>
            <Text style={styles.tooltipScore}>Mood {scrubPt.mean.toFixed(1)}</Text>
          </View>
        )}

        {/* Day labels */}
        {dayPoints.map((pt, i) => (
          <Text
            key={`dl-${i}`}
            style={{
              position: 'absolute',
              left: pt.x - 12,
              top: PAD.top + chartH + 10,
              width: 24,
              textAlign: 'center',
              fontSize: 10,
              color: theme.textMuted,
              fontWeight: '600',
            }}
          >
            {pt.dayLabel}
          </Text>
        ))}

        {/* Y labels */}
        <View style={styles.yAxis}>
          <Text style={styles.yLabel}>High</Text>
          <Text style={styles.yLabel}>Mid</Text>
          <Text style={styles.yLabel}>Low</Text>
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={[styles.legendSwatch, { backgroundColor: `${bandColorHex}44`, borderColor: bandColorHex }]} />
        <Text style={styles.legendText}>Band width = mood variability · Narrow = stable, Wide = turbulent</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.textPrimary,
    fontFamily: 'System',
  },
  subtitleText: {
    fontSize: 11,
    color: theme.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  scorePill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: 'rgba(14,24,48,0.5)',
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  canvasCard: {
    borderRadius: 20,
    backgroundColor: 'rgba(14,24,48,0.32)',
    borderWidth: 1,
    borderColor: theme.cardBorder,
    overflow: 'hidden',
  },
  yAxis: {
    position: 'absolute',
    right: 10,
    top: PAD.top,
    height: 140,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  yLabel: {
    fontSize: 9,
    color: theme.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  emptyCard: {
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    backgroundColor: 'rgba(14,24,48,0.32)',
    gap: 10,
    paddingHorizontal: 32,
  },
  emptyText: {
    color: theme.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    fontStyle: 'italic',
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: 'rgba(10,18,36,0.92)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: `${theme.textGold}33`,
    minWidth: 100,
  },
  tooltipDate: {
    fontSize: 10,
    color: theme.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 1,
  },
  tooltipScore: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.textGold,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingHorizontal: 4,
  },
  legendSwatch: {
    width: 16,
    height: 10,
    borderRadius: 3,
    borderWidth: 1,
    flexShrink: 0,
  },
  legendText: {
    fontSize: 11,
    color: theme.textMuted,
    lineHeight: 14,
    flex: 1,
  },
});
