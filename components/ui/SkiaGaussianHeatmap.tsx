/**
 * SkiaGaussianHeatmap
 * Chart B — Gaussian Blob Correlation Heatmap
 *
 * Plots Energy (X-axis) vs Mood (Y-axis). Each data point is rendered as
 * a soft Gaussian blob (Circle + BlurMask) instead of a hard dot. Where
 * blobs overlap or cluster, their colors blend transparently, creating a
 * glowing "Tension Nebula" effect in areas of high emotional activity.
 *
 * Color quadrants (from luxuryTheme):
 *   High Mood + High Energy → Cyan   (#7DEBDB) — Aligned / Flow state
 *   Low Mood  + High Energy → Orange (#D4832A) — Turbulent / Activated
 *   High Mood + Low Energy  → Lavender (#A286F2) — Dreamy / Calm
 *   Low Mood  + Low Energy  → Dim Blue (#4A577A) — Depleted / Heavy
 *
 * Requires: @shopify/react-native-skia 2.x
 */

import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import {
  Canvas,
  Circle,
  Group,
  BlurMask,
  Path,
  Skia,
  vec,
  LinearGradient,
} from '@shopify/react-native-skia';
import type { DailyCheckIn } from '../../services/patterns/types';

// ─── Layout ───────────────────────────────────────────────────────────────────

const { width: SCREEN_W } = Dimensions.get('window');
const DEFAULT_W = SCREEN_W - 40;
const CHART_H = 180;
const PAD = 28; // uniform padding for axis space

// ─── Palette ──────────────────────────────────────────────────────────────────

const QUADRANT_COLORS = {
  topRight: '#7DEBDB',   // High Mood, High Energy → Cyan
  bottomRight: '#D4832A', // Low Mood, High Energy  → Orange
  topLeft: '#A286F2',    // High Mood, Low Energy   → Lavender
  bottomLeft: '#4A577A', // Low Mood, Low Energy    → Dim Blue
};

const AXIS_COLOR = 'rgba(255,255,255,0.12)';
const LABEL_COLOR = 'rgba(255,255,255,0.35)';
const TITLE_COLOR = '#FFFFFF';

function blobColor(normMood: number, normEnergy: number): string {
  // Blend between quadrant colors based on position
  if (normMood >= 0.5 && normEnergy >= 0.5) return QUADRANT_COLORS.topRight;
  if (normMood < 0.5 && normEnergy >= 0.5) return QUADRANT_COLORS.bottomRight;
  if (normMood >= 0.5 && normEnergy < 0.5) return QUADRANT_COLORS.topLeft;
  return QUADRANT_COLORS.bottomLeft;
}

function energyToNorm(level: string): number {
  if (level === 'high') return 0.85;
  if (level === 'medium') return 0.5;
  return 0.18;
}

// ─── Axis helper paths ────────────────────────────────────────────────────────

function makeAxisPath(plotX: number, plotY: number, plotW: number, plotH: number) {
  const p = Skia.Path.Make();
  // X axis (bottom)
  p.moveTo(plotX, plotY + plotH);
  p.lineTo(plotX + plotW, plotY + plotH);
  // Y axis (left)
  p.moveTo(plotX, plotY);
  p.lineTo(plotX, plotY + plotH);
  // Center crosshair (dashed approximation via short segments)
  const cx = plotX + plotW / 2;
  const cy = plotY + plotH / 2;
  for (let i = 0; i < 8; i++) {
    const t = i / 8;
    p.moveTo(cx, plotY + t * plotH);
    p.lineTo(cx, plotY + (t + 0.05) * plotH);
  }
  for (let i = 0; i < 8; i++) {
    const t = i / 8;
    p.moveTo(plotX + t * plotW, cy);
    p.lineTo(plotX + (t + 0.05) * plotW, cy);
  }
  return p;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  checkIns: DailyCheckIn[];
  width?: number;
}

const SkiaGaussianHeatmap = memo(function SkiaGaussianHeatmap({ checkIns, width = DEFAULT_W }: Props) {
  const plotX = PAD;
  const plotY = PAD;
  const plotW = width - PAD * 2;
  const plotH = CHART_H - PAD * 2;

  const blobData = useMemo(() => {
    const sample = checkIns.slice(-60);
    return sample.map((c) => {
      const normMood = Math.max(0, Math.min(1, (c.moodScore - 1) / 9));
      const normEnergy = energyToNorm(c.energyLevel);
      const px = plotX + normEnergy * plotW;
      const py = plotY + (1 - normMood) * plotH;
      return {
        px,
        py,
        color: blobColor(normMood, normEnergy),
        normMood,
        normEnergy,
      };
    });
  }, [checkIns, plotX, plotY, plotW, plotH]);

  const axisPath = useMemo(
    () => makeAxisPath(plotX, plotY, plotW, plotH),
    [plotX, plotY, plotW, plotH],
  );

  const quadrantGlowPath = useMemo(() => {
    const p = Skia.Path.Make();
    p.addCircle(plotX + plotW * 0.75, plotY + plotH * 0.25, plotW * 0.25);
    return p;
  }, [plotX, plotY, plotW, plotH]);

  if (blobData.length < 3) {
    return (
      <View style={[styles.container, { width }]}>
        <Text style={styles.title}>Mood × Energy Field</Text>
        <Text style={styles.subtitle}>GAUSSIAN CORRELATION MAP</Text>
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>Log check-ins to reveal your correlation nebula</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { width }]}>
      <Text style={styles.title}>Mood × Energy Field</Text>
      <Text style={styles.subtitle}>
        GAUSSIAN CORRELATION · {blobData.length} CHECK-INS
      </Text>

      <Canvas style={{ width, height: CHART_H }}>
        {/* ── Ambient nebula glow in high-activity quadrant ──── */}
        <Path path={quadrantGlowPath} color={QUADRANT_COLORS.topRight} opacity={0.04}>
          <BlurMask blur={40} style="normal" />
        </Path>

        {/* ── Axis lines ────────────────────────────────────── */}
        <Path
          path={axisPath}
          style="stroke"
          strokeWidth={1}
          color={AXIS_COLOR}
          strokeCap="round"
        />

        {/* ── Gaussian blobs ────────────────────────────────── */}
        {blobData.map((b, i) => (
          <Group key={i}>
            {/* Outer bloom */}
            <Circle cx={b.px} cy={b.py} r={18} color={b.color} opacity={0.12}>
              <BlurMask blur={12} style="normal" />
            </Circle>
            {/* Inner core */}
            <Circle cx={b.px} cy={b.py} r={7} color={b.color} opacity={0.38}>
              <BlurMask blur={5} style="normal" />
            </Circle>
            {/* Pinpoint */}
            <Circle cx={b.px} cy={b.py} r={2.5} color={b.color} opacity={0.75} />
          </Group>
        ))}
      </Canvas>

      {/* ── Axis labels ────────────────────────────────────────── */}
      <View style={styles.axisLabels}>
        <View style={styles.xAxis}>
          <Text style={styles.axisLabel}>Low Energy</Text>
          <Text style={styles.axisLabel}>High Energy</Text>
        </View>
      </View>
      <View style={styles.yAxisContainer}>
        <Text style={[styles.axisLabel, styles.yLabelTop]}>High Mood</Text>
        <Text style={[styles.axisLabel, styles.yLabelBot]}>Low Mood</Text>
      </View>

      {/* ── Legend ─────────────────────────────────────────────── */}
      <View style={styles.legend}>
        {([
          { color: QUADRANT_COLORS.topRight, label: 'Aligned' },
          { color: QUADRANT_COLORS.topLeft, label: 'Dreamy' },
          { color: QUADRANT_COLORS.bottomRight, label: 'Turbulent' },
          { color: QUADRANT_COLORS.bottomLeft, label: 'Depleted' },
        ] as const).map((item) => (
          <View key={item.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <Text style={styles.legendText}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
});

export default SkiaGaussianHeatmap;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderTopColor: 'rgba(255,255,255,0.10)',
    paddingTop: 16,
    overflow: 'hidden',
  },
  title: {
    color: TITLE_COLOR,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    paddingHorizontal: 16,
    marginBottom: 3,
  },
  subtitle: {
    color: '#7DEBDB',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    marginBottom: 0,
  },
  emptyBox: {
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    color: LABEL_COLOR,
    fontSize: 13,
    textAlign: 'center',
  },
  axisLabels: {
    paddingHorizontal: PAD,
    marginTop: -PAD + 4,
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  axisLabel: {
    color: LABEL_COLOR,
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  yAxisContainer: {
    position: 'absolute',
    right: 8,
    top: PAD + 52,
    height: CHART_H - PAD * 2,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  yLabelTop: {},
  yLabelBot: {},
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 8,
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  legendText: {
    color: LABEL_COLOR,
    fontSize: 10,
    fontWeight: '600',
  },
});
