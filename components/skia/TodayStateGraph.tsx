/**
 * TodayStateGraph.tsx
 * MySky — 5-Dimension Scrubbable Bezier Trend Chart (Skia + Gesture Handler)
 *
 * Features:
 *   • Smooth cubic-bezier curves (midpoint control points — no d3)
 *   • Lush fading gradient fill under each series
 *   • Soft glow stroke beneath each crisp line
 *   • PanGestureHandler scrubbing — glowing vertical indicator snaps per day
 *   • Haptic tick fires each time the active day changes
 *   • Frosted-glass floating tooltip shows all 5 values at the active point
 *   • Active-day dot per series pulses via BlurMask
 */
import React, { memo, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  Canvas,
  Path,
  Skia,
  LinearGradient,
  vec,
  Circle,
  BlurMask,
  Line as SkiaLine,
} from '@shopify/react-native-skia';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TodayGraphPoint {
  label: string;
  mood:       number; // 1-10
  energy:     number; // 1-10
  stress:     number; // 1-10
  focus:      number; // 1-10
  connection: number; // 1-10
}

interface Props {
  width:  number;
  height: number;
  data?:  TodayGraphPoint[];
}

// ── Config ────────────────────────────────────────────────────────────────────

const SERIES = [
  { key: 'mood'       as const, color: '#FFC94A', label: 'Mood'       },
  { key: 'energy'     as const, color: '#49DFFF', label: 'Energy'     },
  { key: 'stress'     as const, color: '#FF5A5F', label: 'Stress'     },
  { key: 'focus'      as const, color: '#4EA3FF', label: 'Focus'      },
  { key: 'connection' as const, color: '#C86BFF', label: 'Connection' },
] as const;

type MetricKey = (typeof SERIES)[number]['key'];

const PLACEHOLDER: TodayGraphPoint[] = [
  { label: 'Mon', mood: 4, energy: 5, stress: 6, focus: 5, connection: 4 },
  { label: 'Tue', mood: 5, energy: 6, stress: 5, focus: 6, connection: 5 },
  { label: 'Wed', mood: 7, energy: 7, stress: 4, focus: 7, connection: 6 },
  { label: 'Thu', mood: 6, energy: 5, stress: 5, focus: 6, connection: 7 },
  { label: 'Fri', mood: 8, energy: 8, stress: 3, focus: 8, connection: 7 },
  { label: 'Sat', mood: 9, energy: 7, stress: 2, focus: 7, connection: 9 },
  { label: 'Sun', mood: 8, energy: 6, stress: 3, focus: 6, connection: 8 },
];

const PAD_L = 12;
const PAD_R = 12;
const PAD_T = 20;
const PAD_B = 28;

// ── Path builders ─────────────────────────────────────────────────────────────

/** Smooth cubic bezier through points using midpoint control (no d3 required) */
function buildCurvePath(pts: { x: number; y: number }[]) {
  const p = Skia.Path.Make();
  if (pts.length < 2) return p;
  p.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) {
    const cpX = (pts[i - 1].x + pts[i].x) / 2;
    p.cubicTo(cpX, pts[i - 1].y, cpX, pts[i].y, pts[i].x, pts[i].y);
  }
  return p;
}

/** Closed area path for gradient fill */
function buildAreaPath(pts: { x: number; y: number }[], bottom: number) {
  const p = buildCurvePath(pts);
  if (pts.length < 2) return p;
  p.lineTo(pts[pts.length - 1].x, bottom);
  p.lineTo(pts[0].x, bottom);
  p.close();
  return p;
}

/** Append alpha as hex to a #RRGGBB string */
function withAlpha(color: string, alpha: number): string {
  return color + Math.round(alpha * 255).toString(16).padStart(2, '0');
}

function safeHaptic() {
  Haptics.selectionAsync().catch(() => {});
}

// ── Component ─────────────────────────────────────────────────────────────────

function TodayStateGraph({ width, height, data }: Props) {
  const pts = (data && data.length > 1) ? data : PLACEHOLDER;

  const graphW = width  - PAD_L - PAD_R;
  const graphH = height - PAD_T - PAD_B;
  const bottom = PAD_T + graphH;
  const total  = pts.length;

  const xAt = (i: number) => PAD_L + (total <= 1 ? graphW / 2 : (i / (total - 1)) * graphW);
  const yAt = (v: number) => PAD_T + graphH - ((v - 1) / 9) * graphH;

  // Pixel coords per series
  const seriesData = useMemo(() =>
    SERIES.map(s => {
      const coords = pts.map((pt, i) => ({ x: xAt(i), y: yAt(pt[s.key]) }));
      return {
        ...s,
        coords,
        linePath: buildCurvePath(coords),
        areaPath: buildAreaPath(coords, bottom),
      };
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pts, graphW, graphH, bottom, total],
  );

  // Grid lines at 1, 4, 7, 10
  const gridPaths = useMemo(() =>
    [1, 4, 7, 10].map(v => {
      const y  = yAt(v);
      const gp = Skia.Path.Make();
      gp.moveTo(PAD_L, y);
      gp.lineTo(PAD_L + graphW, y);
      return { path: gp, y };
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [graphW, graphH],
  );

  // ── Scrub state ──────────────────────────────────────────────────────────────
  const [activeIdx, setActiveIdx] = useState(total - 1);
  const prevIdxRef = useRef(activeIdx);

  const tooltipVisible = useSharedValue(0);
  const scrubX         = useSharedValue(xAt(total - 1));

  const handleIndexChange = (idx: number) => {
    if (idx !== prevIdxRef.current) {
      prevIdxRef.current = idx;
      safeHaptic();
    }
    setActiveIdx(idx);
  };

  const updateScrub = (touchX: number) => {
    'worklet';
    const relX = Math.max(0, Math.min(graphW, touchX - PAD_L));
    const idx  = Math.round((relX / graphW) * (total - 1));
    const safe = Math.max(0, Math.min(total - 1, idx));
    scrubX.value = PAD_L + (total <= 1 ? graphW / 2 : (safe / (total - 1)) * graphW);
    runOnJS(handleIndexChange)(safe);
  };

  const panGesture = Gesture.Pan()
    .activeOffsetX([-5, 5])
    .failOffsetY([-12, 12])
    .onBegin(e  => { 'worklet'; tooltipVisible.value = withSpring(1); updateScrub(e.x); })
    .onChange(e => { 'worklet'; updateScrub(e.x); })
    .onFinalize(() => { 'worklet'; tooltipVisible.value = withTiming(0, { duration: 400 }); });

  // Scrub line — must be a plain position value so we can use it in Skia
  // We drive a React-state shadow for the Skia canvas position
  const [canvasScrubX, setCanvasScrubX] = useState(xAt(total - 1));
  // Drive canvasScrubX from activeIdx
  const activeScrubX = xAt(activeIdx);

  const tooltipStyle = useAnimatedStyle(() => ({
    opacity: tooltipVisible.value,
  }));

  const activePt = pts[activeIdx] ?? pts[pts.length - 1];

  // Tooltip positioning — keep it inside the card
  const TOOLTIP_W = 130;
  const tooltipLeft = Math.max(4, Math.min(width - TOOLTIP_W - 4, activeScrubX - TOOLTIP_W / 2));

  return (
    <View style={[styles.container, { width, height }]}>
      <GestureDetector gesture={panGesture}>
        <View style={StyleSheet.absoluteFill}>
          <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
            {/* Horizontal grid lines */}
            {gridPaths.map((g, i) => (
              <Path
                key={i}
                path={g.path}
                style="stroke"
                strokeWidth={1}
                color="rgba(255,255,255,0.06)"
              />
            ))}

            {/* Series: gradient fill + glow + crisp line */}
            {seriesData.map(s => (
              <React.Fragment key={s.key}>
                {/* Gradient fill area */}
                <Path path={s.areaPath}>
                  <LinearGradient
                    start={vec(PAD_L, PAD_T)}
                    end={vec(PAD_L, bottom)}
                    colors={[withAlpha(s.color, 0.28), withAlpha(s.color, 0.00)]}
                  />
                </Path>

                {/* Glow stroke */}
                <Path
                  path={s.linePath}
                  style="stroke"
                  strokeWidth={8}
                  strokeCap="round"
                  color={withAlpha(s.color, 0.18)}
                >
                  <BlurMask blur={6} style="solid" />
                </Path>

                {/* Crisp line */}
                <Path
                  path={s.linePath}
                  style="stroke"
                  strokeWidth={2}
                  strokeJoin="round"
                  strokeCap="round"
                  color={s.color}
                />

                {/* Active day dot — glowing */}
                <Circle
                  cx={activeScrubX}
                  cy={yAt(activePt[s.key])}
                  r={6}
                  color={withAlpha(s.color, 0.25)}
                >
                  <BlurMask blur={5} style="normal" />
                </Circle>
                <Circle
                  cx={activeScrubX}
                  cy={yAt(activePt[s.key])}
                  r={3}
                  color={s.color}
                />
              </React.Fragment>
            ))}

            {/* Scrub vertical indicator */}
            <SkiaLine
              p1={vec(activeScrubX, PAD_T)}
              p2={vec(activeScrubX, bottom)}
              color="rgba(255,255,255,0.35)"
              strokeWidth={1}
            />
            <Circle cx={activeScrubX} cy={PAD_T - 2} r={3} color="rgba(255,255,255,0.5)" />
          </Canvas>
        </View>
      </GestureDetector>

      {/* Floating glass tooltip */}
      <Animated.View
        style={[styles.tooltip, { left: tooltipLeft, top: 4 }, tooltipStyle]}
        pointerEvents="none"
      >
        <Text style={styles.tooltipLabel}>{activePt.label}</Text>
        {SERIES.map(s => (
          <View key={s.key} style={styles.tooltipRow}>
            <View style={[styles.tooltipDot, { backgroundColor: s.color }]} />
            <Text style={[styles.tooltipKey, { color: s.color }]}>{s.label}</Text>
            <Text style={styles.tooltipVal}>{activePt[s.key]}</Text>
          </View>
        ))}
      </Animated.View>

      {/* X-axis labels */}
      <View style={[styles.xLabels, { bottom: 4, left: PAD_L, width: graphW }]}>
        {pts.map((pt, i) => (
          <Text
            key={i}
            style={[
              styles.axisLabel,
              { left: (i / Math.max(total - 1, 1)) * graphW - 12 },
              i === activeIdx && styles.axisLabelActive,
            ]}
          >
            {pt.label}
          </Text>
        ))}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {SERIES.map(s => (
          <View key={s.key} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: s.color }]} />
            <Text style={styles.legendLabel}>{s.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(10,12,24,0.6)',
    borderRadius: 20,
    overflow: 'hidden',
  },
  xLabels: {
    position: 'absolute',
    height: 16,
  },
  axisLabel: {
    position: 'absolute',
    fontSize: 9,
    color: 'rgba(255,255,255,0.30)',
    width: 24,
    textAlign: 'center',
  },
  axisLabelActive: {
    color: 'rgba(255,255,255,0.80)',
    fontWeight: '700',
  },
  legend: {
    position: 'absolute',
    top: 8,
    right: 10,
    flexDirection: 'column',
    gap: 2,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  legendLabel: {
    fontSize: 8,
    color: 'rgba(255,255,255,0.45)',
  },
  tooltip: {
    position: 'absolute',
    width: 130,
    backgroundColor: 'rgba(16,22,48,0.82)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 9,
    paddingVertical: 7,
    gap: 3,
  },
  tooltipLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.70)',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  tooltipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  tooltipDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  tooltipKey: {
    fontSize: 9,
    flex: 1,
  },
  tooltipVal: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
    minWidth: 16,
    textAlign: 'right',
  },
});

export default memo(TodayStateGraph);
