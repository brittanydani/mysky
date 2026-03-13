/**
 * NeonWaveChart.tsx
 * MySky — Smooth Area Line Chart (Skia)
 *
 * Three smooth bezier area series:
 *   Mood   #C9AE78  · soft gold
 *   Energy #6fb3d3  · muted cyan
 *   Stress #CC6666  · dusty rose
 *
 * Layout: Y-axis labels | plot area | X-axis date labels
 * Interaction: pan-scrub → animated vertical line + floating tooltip
 *
 * No R3F · No THREE · Pure @shopify/react-native-skia + Reanimated
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import {
  Canvas,
  Path,
  Skia,
  LinearGradient,
  Circle,
  BlurMask,
  Group,
  vec,
} from '@shopify/react-native-skia';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { DailyCheckIn } from '../../services/patterns/types';

// ── Palette ───────────────────────────────────────────────────────────────────

const MOOD_COLOR   = '#C9AE78';
const ENERGY_COLOR = '#6fb3d3';
const STRESS_COLOR = '#CC6666';

// ── Helpers ───────────────────────────────────────────────────────────────────

function levelToNum(level: 'low' | 'medium' | 'high'): number {
  return level === 'low' ? 2 : level === 'medium' ? 5 : 9;
}

/** Append alpha (0–1) as 2 hex chars to a #RRGGBB color string */
function withAlpha(color: string, alpha: number): string {
  return color + Math.round(alpha * 255).toString(16).padStart(2, '0');
}

/** Smooth cubic-bezier path through {x,y} points using midpoint control */
function buildLinePath(pts: { x: number; y: number }[]) {
  const p = Skia.Path.Make();
  if (pts.length < 2) return p;
  p.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) {
    const cx = (pts[i - 1].x + pts[i].x) / 2;
    p.cubicTo(cx, pts[i - 1].y, cx, pts[i].y, pts[i].x, pts[i].y);
  }
  return p;
}

/** Line path closed at bottom to form a filled area shape */
function buildAreaPath(pts: { x: number; y: number }[], bottom: number) {
  const p = buildLinePath(pts);
  if (pts.length < 2) return p;
  p.lineTo(pts[pts.length - 1].x, bottom);
  p.lineTo(pts[0].x, bottom);
  p.close();
  return p;
}

// ── Layout ────────────────────────────────────────────────────────────────────

const PAD_L = 36;   // room for y-axis labels
const PAD_R = 10;
const PAD_T = 28;   // room for floating tooltip above
const PAD_B = 28;   // room for x-axis labels

// ── Series config ─────────────────────────────────────────────────────────────

const SERIES = [
  { key: 'stress' as const, color: STRESS_COLOR, label: 'Stress' },
  { key: 'energy' as const, color: ENERGY_COLOR, label: 'Energy' },
  { key: 'mood'   as const, color: MOOD_COLOR,   label: 'Mood'   },
] as const;

// ── Props ─────────────────────────────────────────────────────────────────────

export interface NeonWaveChartProps {
  checkIns: DailyCheckIn[];
  width:    number;
  height?:  number;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function NeonWaveChart({ checkIns, width, height = 240 }: NeonWaveChartProps) {
  const displayed = useMemo(
    () => [...checkIns].sort((a, b) => a.date.localeCompare(b.date)).slice(-20),
    [checkIns],
  );

  const total = displayed.length;

  const seriesValues = useMemo(() => ({
    mood:   displayed.map(c => c.moodScore),
    energy: displayed.map(c => levelToNum(c.energyLevel)),
    stress: displayed.map(c => levelToNum(c.stressLevel)),
  }), [displayed]);

  // Plot rectangle
  const plotW      = width  - PAD_L - PAD_R;
  const plotH      = height - PAD_T - PAD_B;
  const plotBottom = PAD_T + plotH;

  // Build per-series paths (memoized to avoid Skia path recreation on every render)
  const seriesData = useMemo(() =>
    SERIES.map(s => {
      const values = seriesValues[s.key];
      const pts = values.map((v, i) => ({
        x: PAD_L + (total <= 1 ? plotW / 2 : (i / (total - 1)) * plotW),
        y: PAD_T + (1 - (v - 1) / 8) * plotH,   // val 1→bottom, val 9→top
      }));
      return { ...s, pts, linePath: buildLinePath(pts), areaPath: buildAreaPath(pts, plotBottom) };
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [seriesValues, plotW, plotH, plotBottom, total],
  );

  // Grid lines at values 1, 5, 9 (Low / Mid / High)
  const gridRows = useMemo(() =>
    ([9, 5, 1] as const).map((v, i) => {
      const gy = PAD_T + (1 - (v - 1) / 8) * plotH;
      const p  = Skia.Path.Make();
      p.moveTo(PAD_L, gy);
      p.lineTo(PAD_L + plotW, gy);
      return { path: p, gy, label: ['High', 'Mid', 'Low'][i] };
    }),
    [plotH, plotW],
  );

  // X-axis date labels: first · middle · last
  const axisLabels = useMemo(() => {
    if (total < 2) return [];
    const indices = [...new Set([0, Math.floor((total - 1) / 2), total - 1])];
    return indices.map(i => ({
      text: new Date(displayed[i].date + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      x: PAD_L + (i / (total - 1)) * plotW,
    }));
  }, [displayed, total, plotW]);

  // ── Scrub interaction ──────────────────────────────────────────────────────
  const [activeIdx, setActiveIdx] = useState(Math.max(0, total - 1));
  const tooltipVisible = useSharedValue(0);
  const scrubX         = useSharedValue(PAD_L + plotW);

  // Y positions for each series — synced to SharedValue so worklet can read them
  const yPositionsRef = useSharedValue<{ mood: number[]; energy: number[]; stress: number[] }>(
    { mood: [], energy: [], stress: [] }
  );
  const dotYMood   = useSharedValue(0);
  const dotYEnergy = useSharedValue(0);
  const dotYStress = useSharedValue(0);
  const prevSnapIdx = useSharedValue(-1);

  // Compute Y-position lookup table whenever source data changes
  const seriesYPositions = useMemo(() => ({
    mood:   seriesData.find(s => s.key === 'mood')?.pts.map(p => p.y)   ?? [],
    energy: seriesData.find(s => s.key === 'energy')?.pts.map(p => p.y) ?? [],
    stress: seriesData.find(s => s.key === 'stress')?.pts.map(p => p.y) ?? [],
  }), [seriesData]);

  useEffect(() => {
    yPositionsRef.value = seriesYPositions;
    // Seed dot positions to the default (last) data point
    const li = Math.max(0, total - 1);
    if (li < seriesYPositions.mood.length)   dotYMood.value   = seriesYPositions.mood[li];
    if (li < seriesYPositions.energy.length) dotYEnergy.value = seriesYPositions.energy[li];
    if (li < seriesYPositions.stress.length) dotYStress.value = seriesYPositions.stress[li];
  }, [seriesYPositions, total]);

  // Haptic tick — fired via runOnJS from the UI-thread worklet
  const triggerHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, []);

  const updateScrub = (touchX: number) => {
    'worklet';
    const relX = Math.max(0, Math.min(plotW, touchX - PAD_L));
    const idx  = Math.round((relX / plotW) * (total - 1));
    const safe = Math.max(0, Math.min(total - 1, idx));

    // Haptic tick whenever the scrub snaps to a new data point
    if (safe !== prevSnapIdx.value) {
      prevSnapIdx.value = safe;
      runOnJS(triggerHaptic)();
    }

    scrubX.value = PAD_L + (total <= 1 ? plotW / 2 : (safe / (total - 1)) * plotW);

    // Animate indicator dots to the snapped Y positions
    const allY = yPositionsRef.value;
    if (safe < allY.mood.length)   dotYMood.value   = withSpring(allY.mood[safe],   { damping: 18 });
    if (safe < allY.energy.length) dotYEnergy.value = withSpring(allY.energy[safe], { damping: 18 });
    if (safe < allY.stress.length) dotYStress.value = withSpring(allY.stress[safe], { damping: 18 });

    runOnJS(setActiveIdx)(safe);
  };

  const panGesture = Gesture.Pan()
    .activeOffsetX([-6, 6])
    .failOffsetY([-14, 14])
    .onBegin(e  => { 'worklet'; tooltipVisible.value = withSpring(1); updateScrub(e.x); })
    .onChange(e => { 'worklet'; updateScrub(e.x); })
    .onFinalize(() => { 'worklet'; tooltipVisible.value = withSpring(0); });

  const scrubStyle = useAnimatedStyle(() => ({
    opacity:   tooltipVisible.value,
    transform: [{ translateX: scrubX.value }],
  }));

  const tipStyle = useAnimatedStyle(() => ({
    opacity: tooltipVisible.value,
  }));

  const active     = displayed[activeIdx];
  const dateLabel  = active
    ? new Date(active.date + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : '';
  const tooltipLeft = total > 1
    ? Math.max(PAD_L, Math.min(width - 152, PAD_L + (activeIdx / (total - 1)) * plotW - 76))
    : PAD_L;

  if (total < 2) {
    return (
      <View style={[styles.root, { width, height, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.emptyTxt}>Log more check-ins to see your chart</Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { width, height }]}>
      {/* ── Skia canvas — all chart drawing ── */}
      <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
        {/* Horizontal grid lines */}
        {gridRows.map((g, i) => (
          <React.Fragment key={i}>
            <Path
              path={g.path}
              style="stroke"
              strokeWidth={1}
              color="rgba(255,255,255,0.07)"
            />
          </React.Fragment>
        ))}

        {/* Series rendered back-to-front: stress → energy → mood */}
        {seriesData.map(s => (
          <React.Fragment key={s.key}>
          <Group>
            {/* Gradient fill area */}
            <Path path={s.areaPath}>
              <LinearGradient
                start={vec(PAD_L, PAD_T)}
                end={vec(PAD_L, plotBottom)}
                colors={[withAlpha(s.color, 0.22), withAlpha(s.color, 0.00)]}
              />
            </Path>

            {/* Soft glow beneath the line */}
            <Path
              path={s.linePath}
              style="stroke"
              strokeWidth={5}
              strokeCap="round"
              color={withAlpha(s.color, 0.15)}
            >
              <BlurMask blur={6} style="solid" />
            </Path>

            {/* Crisp line */}
            <Path
              path={s.linePath}
              style="stroke"
              strokeWidth={2.5}
              strokeJoin="round"
              strokeCap="round"
              color={s.color}
            />

            {/* Data point dots */}
            {s.pts.map((pt, i) => (
              <React.Fragment key={i}>
              <Group>
                <Circle cx={pt.x} cy={pt.y} r={4} color={withAlpha(s.color, 0.12)}>
                  <BlurMask blur={4} style="normal" />
                </Circle>
                <Circle cx={pt.x} cy={pt.y} r={2} color={s.color} />
              </Group>
              </React.Fragment>
            ))}
          </Group>
          </React.Fragment>
        ))}

        {/* ── Animated scrub indicator: glowing dots that snap to each series line ── */}
        <Group opacity={tooltipVisible}>
          {/* Mood — champagne gold */}
          <Circle cx={scrubX} cy={dotYMood} r={11} color={withAlpha(MOOD_COLOR, 0.15)} blendMode="screen">
            <BlurMask blur={9} style="solid" />
          </Circle>
          <Circle cx={scrubX} cy={dotYMood} r={4.5} color={MOOD_COLOR} />
          <Circle cx={scrubX} cy={dotYMood} r={1.8} color="rgba(255,255,255,0.9)" />
          {/* Energy — soft blue */}
          <Circle cx={scrubX} cy={dotYEnergy} r={11} color={withAlpha(ENERGY_COLOR, 0.15)} blendMode="screen">
            <BlurMask blur={9} style="solid" />
          </Circle>
          <Circle cx={scrubX} cy={dotYEnergy} r={4.5} color={ENERGY_COLOR} />
          <Circle cx={scrubX} cy={dotYEnergy} r={1.8} color="rgba(255,255,255,0.9)" />
          {/* Stress — rose */}
          <Circle cx={scrubX} cy={dotYStress} r={11} color={withAlpha(STRESS_COLOR, 0.15)} blendMode="screen">
            <BlurMask blur={9} style="solid" />
          </Circle>
          <Circle cx={scrubX} cy={dotYStress} r={4.5} color={STRESS_COLOR} />
          <Circle cx={scrubX} cy={dotYStress} r={1.8} color="rgba(255,255,255,0.9)" />
        </Group>

      </Canvas>

      {/* ── Axis labels (RN Views — supports text overflow) ── */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {gridRows.map((g, i) => (
          <React.Fragment key={i}>
            <Text style={[styles.yLabel, { top: g.gy - 7 }]}>
              {g.label}
            </Text>
          </React.Fragment>
        ))}
        {axisLabels.map((item, i) => (
          <React.Fragment key={i}>
            <Text style={[styles.xLabel, { left: item.x - 22, bottom: 4 }]}>
              {item.text}
            </Text>
          </React.Fragment>
        ))}
      </View>

      {/* ── Pan gesture + scrub overlay ── */}
      <GestureDetector gesture={panGesture}>
        <View style={StyleSheet.absoluteFill}>
          {/* Vertical scrub line */}
          <Animated.View
            style={[styles.scrubLine, { height: plotH, top: PAD_T }, scrubStyle]}
            pointerEvents="none"
          />

          {/* Tooltip — positioned above chart area */}
          <Animated.View
            style={[styles.tooltipShell, { top: 0, left: tooltipLeft }, tipStyle]}
            pointerEvents="none"
          >
            {/* Frosted glass base */}
            <BlurView
              intensity={Platform.OS === 'android' ? 20 : 45}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
            {/* Dark navy tint */}
            <View style={styles.tooltipTint} />
            {/* Gold rim */}
            <View style={styles.tooltipRim} />
            {/* Top highlight */}
            <View style={styles.tooltipHighlight} />
            {/* Content */}
            <View style={styles.tooltipContent}>
              <Text style={styles.tooltipDate}>{dateLabel}</Text>
              {[
                { key: 'mood',   color: MOOD_COLOR,   label: 'Mood',
                  val: active ? active.moodScore.toFixed(1) : '—' },
                { key: 'energy', color: ENERGY_COLOR, label: 'Energy',
                  val: active ? levelToNum(active.energyLevel).toFixed(1) : '—' },
                { key: 'stress', color: STRESS_COLOR, label: 'Stress',
                  val: active ? levelToNum(active.stressLevel).toFixed(1) : '—' },
              ].map(row => (
                <React.Fragment key={row.key}>
                <View style={styles.tooltipRow}>
                  <View style={[styles.tooltipDot, { backgroundColor: row.color }]} />
                  <Text style={styles.tooltipLbl}>{row.label}</Text>
                  <Text style={[styles.tooltipVal, { color: row.color }]}>{row.val}</Text>
                </View>
                </React.Fragment>
              ))}
            </View>
          </Animated.View>
        </View>
      </GestureDetector>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    overflow: 'hidden',
    borderRadius: 12,
  },
  emptyTxt: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 13,
    textAlign: 'center',
  },
  yLabel: {
    position:    'absolute',
    left:        0,
    width:       PAD_L - 4,
    color:       'rgba(255,255,255,0.28)',
    fontSize:    9,
    fontWeight:  '600',
    textAlign:   'right',
    letterSpacing: 0.3,
  },
  xLabel: {
    position:    'absolute',
    width:       44,
    textAlign:   'center',
    color:       'rgba(255,255,255,0.28)',
    fontSize:    9,
    fontWeight:  '600',
    letterSpacing: 0.3,
  },
  scrubLine: {
    position:        'absolute',
    width:           1.5,
    backgroundColor: 'rgba(201,174,120,0.75)',  // champagne gold
    borderRadius:    1,
    shadowColor:     '#C9AE78',
    shadowOffset:    { width: 0, height: 0 },
    shadowOpacity:   0.9,
    shadowRadius:    5,
    elevation:       4,
  },
  // ── Tooltip shell (frosted glass) ────────────────────────────────────────
  tooltipShell: {
    position:     'absolute',
    width:        148,
    borderRadius: 14,
    overflow:     'hidden',   // clips BlurView to border radius
    // Elevation shadow
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 6 },
    shadowOpacity:   0.45,
    shadowRadius:    16,
    elevation:       10,
  },
  tooltipTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 8, 23, 0.55)',
  },
  tooltipRim: {
    ...StyleSheet.absoluteFillObject,
    borderRadius:  14,
    borderWidth:   1,
    borderColor:   'rgba(255, 244, 214, 0.14)',
  },
  tooltipHighlight: {
    position:        'absolute',
    top:             0,
    left:            12,
    right:           12,
    height:          1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius:    1,
  },
  tooltipContent: {
    padding: 10,
  },
  tooltipDate: {
    color:         'rgba(255,255,255,0.50)',
    fontSize:      10,
    marginBottom:  6,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  tooltipRow: {
    flexDirection: 'row',
    alignItems:    'center',
    marginBottom:  4,
  },
  tooltipDot: {
    width:        7,
    height:       7,
    borderRadius: 3.5,
    marginRight:  7,
  },
  tooltipLbl: {
    flex:     1,
    color:    'rgba(255,255,255,0.65)',
    fontSize: 11,
  },
  tooltipVal: {
    fontSize:   11,
    fontWeight: '700',
  },
});

