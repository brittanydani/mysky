/**
 * SkiaMoodTimeline
 * Chart A — "Mood Heartbeat"
 *
 * Renders a smooth Cyan (#7DEBDB) curve through daily mood scores,
 * with a LinearGradient fill below the line. Uses Catmull-Rom → cubic
 * Bézier conversion so the line never looks jagged.
 *
 * Scrubbing: a horizontal Pan gesture slides a vertical scrub line across
 * the chart; expo-haptics fires SelectionFeedbackAsync as it crosses each
 * data point, giving the feeling of touching each moment in time.
 *
 * Requires: @shopify/react-native-skia 2.x, react-native-reanimated 4.x,
 *           react-native-gesture-handler 2.x, expo-haptics
 */

import React, { useMemo, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import {
  Canvas,
  Path,
  Skia,
  BlurMask,
  Circle,
  Group,
  LinearGradient,
  vec,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  useDerivedValue,
  runOnJS,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import type { DailyCheckIn } from '../../services/patterns/types';

// ─── Layout ───────────────────────────────────────────────────────────────────

const { width: SCREEN_W } = Dimensions.get('window');
const DEFAULT_W = SCREEN_W - 40;
const CHART_H = 116;
const PAD_L = 14;
const PAD_R = 14;
const PAD_T = 12;
const PAD_B = 12;

// ─── Palette ──────────────────────────────────────────────────────────────────

const CYAN = '#7DEBDB';
const CYAN_FILL_TOP = 'rgba(125,235,219,0.26)';
const CYAN_FILL_BOT = 'rgba(125,235,219,0.0)';

// ─── Catmull-Rom → cubic Bézier ──────────────────────────────────────────────

interface Pt { x: number; y: number }

function catmullBezier(
  p0: Pt, p1: Pt, p2: Pt, p3: Pt, alpha = 0.5,
): { cp1x: number; cp1y: number; cp2x: number; cp2y: number } {
  return {
    cp1x: p1.x + (p2.x - p0.x) * alpha / 3,
    cp1y: p1.y + (p2.y - p0.y) * alpha / 3,
    cp2x: p2.x - (p3.x - p1.x) * alpha / 3,
    cp2y: p2.y - (p3.y - p1.y) * alpha / 3,
  };
}

function buildLinePath(pts: Pt[]) {
  const path = Skia.Path.Make();
  if (pts.length < 2) return path;
  const n = pts.length;
  path.moveTo(pts[0].x, pts[0].y);
  for (let i = 0; i < n - 1; i++) {
    const { cp1x, cp1y, cp2x, cp2y } = catmullBezier(
      pts[Math.max(0, i - 1)],
      pts[i],
      pts[i + 1],
      pts[Math.min(n - 1, i + 2)],
    );
    path.cubicTo(cp1x, cp1y, cp2x, cp2y, pts[i + 1].x, pts[i + 1].y);
  }
  return path;
}

function buildFillPath(pts: Pt[], plotH: number) {
  const path = Skia.Path.Make();
  if (pts.length < 2) return path;
  const n = pts.length;
  const bottom = PAD_T + plotH;
  path.moveTo(pts[0].x, pts[0].y);
  for (let i = 0; i < n - 1; i++) {
    const { cp1x, cp1y, cp2x, cp2y } = catmullBezier(
      pts[Math.max(0, i - 1)],
      pts[i],
      pts[i + 1],
      pts[Math.min(n - 1, i + 2)],
    );
    path.cubicTo(cp1x, cp1y, cp2x, cp2y, pts[i + 1].x, pts[i + 1].y);
  }
  path.lineTo(pts[n - 1].x, bottom);
  path.lineTo(pts[0].x, bottom);
  path.close();
  return path;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  checkIns: DailyCheckIn[];
  width?: number;
}

export default function SkiaMoodTimeline({ checkIns, width = DEFAULT_W }: Props) {
  const plotW = width - PAD_L - PAD_R;
  const plotH = CHART_H - PAD_T - PAD_B;

  const lastHapticIdx = useRef(-1);

  // Build normalised pixel positions from check-in mood scores
  const { pts, dotXs, dotYs } = useMemo(() => {
    const sorted = [...checkIns]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30);

    if (sorted.length < 2) return { pts: [] as Pt[], dotXs: [] as number[], dotYs: [] as number[] };

    const n = sorted.length;
    const result = sorted.map((c, i) => {
      const normX = n > 1 ? i / (n - 1) : 0.5;
      // moodScore 1–10 → normalize then invert Y (high mood = top of chart)
      const normMood = Math.max(0, Math.min(1, (c.moodScore - 1) / 9));
      return {
        x: PAD_L + normX * plotW,
        y: PAD_T + (1 - normMood) * plotH,
      };
    });

    return {
      pts: result,
      dotXs: result.map(r => r.x),
      dotYs: result.map(r => r.y),
    };
  }, [checkIns, plotW, plotH]);

  const linePath = useMemo(() => buildLinePath(pts), [pts]);
  const fillPath = useMemo(() => buildFillPath(pts, plotH), [pts, plotH]);

  // ── Scrub animation ──────────────────────────────────────────────────────

  const scrubX = useSharedValue(PAD_L);
  const scrubVisible = useSharedValue(0);
  const sharedDotXs = useSharedValue(dotXs);
  const sharedDotYs = useSharedValue(dotYs);

  // Keep shared arrays synced when data changes
  React.useEffect(() => {
    sharedDotXs.value = dotXs;
    sharedDotYs.value = dotYs;
  }, [dotXs, dotYs, sharedDotXs, sharedDotYs]);

  // Compute the Y of the nearest data point to the scrub line (in worklet)
  const scrubDotY = useDerivedValue(() => {
    'worklet';
    const xs = sharedDotXs.value;
    const ys = sharedDotYs.value;
    if (xs.length === 0) return PAD_T + plotH / 2;
    let nearest = 0;
    let minDist = Math.abs(xs[0] - scrubX.value);
    for (let i = 1; i < xs.length; i++) {
      const d = Math.abs(xs[i] - scrubX.value);
      if (d < minDist) { minDist = d; nearest = i; }
    }
    return ys[nearest] ?? (PAD_T + plotH / 2);
  });

  // Vertical scrub line path (animated in worklet)
  const scrubLinePath = useDerivedValue(() => {
    'worklet';
    const p = Skia.Path.Make();
    p.moveTo(scrubX.value, PAD_T);
    p.lineTo(scrubX.value, PAD_T + plotH);
    return p;
  });

  const resetHapticIdx = useCallback(() => { lastHapticIdx.current = -1; }, []);

  const onScrubMove = useCallback((px: number) => {
    if (dotXs.length === 0) return;
    let nearest = 0;
    let minDist = Math.abs(dotXs[0] - px);
    for (let i = 1; i < dotXs.length; i++) {
      const d = Math.abs(dotXs[i] - px);
      if (d < minDist) { minDist = d; nearest = i; }
    }
    if (nearest !== lastHapticIdx.current) {
      lastHapticIdx.current = nearest;
      void Haptics.selectionAsync();
    }
  }, [dotXs]);

  const pan = Gesture.Pan()
    .activeOffsetX([-8, 8])
    .failOffsetY([-10, 10])
    .onBegin((e) => {
      'worklet';
      scrubX.value = Math.max(PAD_L, Math.min(PAD_L + plotW, e.x));
      scrubVisible.value = withTiming(1, { duration: 100 });
    })
    .onUpdate((e) => {
      'worklet';
      const clamped = Math.max(PAD_L, Math.min(PAD_L + plotW, e.x));
      scrubX.value = clamped;
      runOnJS(onScrubMove)(clamped);
    })
    .onFinalize(() => {
      'worklet';
      scrubVisible.value = withTiming(0, { duration: 350, easing: Easing.out(Easing.ease) });
      runOnJS(resetHapticIdx)();
    });

  if (pts.length < 2) {
    return (
      <View style={[styles.container, { width }]}>
        <Text style={styles.title}>Mood Timeline</Text>
        <Text style={styles.subtitle}>EMOTIONAL WAVE</Text>
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>Log check-ins to see your mood timeline emerge</Text>
        </View>
      </View>
    );
  }

  const dayCount = Math.min(checkIns.length, 30);

  return (
    <View style={[styles.container, { width }]}>
      <Text style={styles.title}>Mood Timeline</Text>
      <Text style={styles.subtitle}>EMOTIONAL WAVE · LAST {dayCount} DAYS</Text>
      <GestureDetector gesture={pan}>
        <Canvas style={{ width, height: CHART_H }}>
          {/* ── Ambient glow behind chart ─────────────────────────── */}
          <Circle
            cx={width / 2}
            cy={CHART_H / 2}
            r={CHART_H}
            color="rgba(125,235,219,0.035)"
          >
            <BlurMask blur={40} style="normal" />
          </Circle>

          {/* ── Gradient fill below line ─────────────────────────── */}
          <Path path={fillPath} opacity={0.65}>
            <LinearGradient
              start={vec(0, PAD_T)}
              end={vec(0, PAD_T + plotH)}
              colors={[CYAN_FILL_TOP, CYAN_FILL_BOT]}
            />
          </Path>

          {/* ── Soft glow pass ───────────────────────────────────── */}
          <Path
            path={linePath}
            style="stroke"
            strokeWidth={7}
            color={CYAN}
            opacity={0.18}
            strokeCap="round"
            strokeJoin="round"
          >
            <BlurMask blur={10} style="normal" />
          </Path>

          {/* ── Sharp cyan heartbeat line ─────────────────────────── */}
          <Path
            path={linePath}
            style="stroke"
            strokeWidth={2}
            color={CYAN}
            strokeCap="round"
            strokeJoin="round"
          />

          {/* ── Data-point dots ──────────────────────────────────── */}
          {dotXs.map((x, i) => (
            <Group key={i}>
              <Circle cx={x} cy={dotYs[i]} r={7} color={CYAN} opacity={0.15}>
                <BlurMask blur={5} style="normal" />
              </Circle>
              <Circle cx={x} cy={dotYs[i]} r={2.5} color={CYAN} />
            </Group>
          ))}

          {/* ── Scrub overlay ────────────────────────────────────── */}
          <Group opacity={scrubVisible}>
            <Path
              path={scrubLinePath}
              style="stroke"
              strokeWidth={1.5}
              color="rgba(255,255,255,0.55)"
              strokeCap="round"
            />
            <Circle cx={scrubX} cy={scrubDotY} r={9} color={CYAN} opacity={0.3}>
              <BlurMask blur={8} style="normal" />
            </Circle>
            <Circle cx={scrubX} cy={scrubDotY} r={4} color="#FFFFFF" />
          </Group>
        </Canvas>
      </GestureDetector>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderTopColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 0,
    paddingTop: 16,
    paddingBottom: 4,
    overflow: 'hidden',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    paddingHorizontal: 16,
    marginBottom: 3,
  },
  subtitle: {
    color: CYAN,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  emptyBox: {
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 13,
    textAlign: 'center',
  },
});
