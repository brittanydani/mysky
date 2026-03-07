// Advanced scientific correlation mapping for wellness.
// Correlates lifestyle habits (e.g., Movement) with internal states (e.g., Energy).
// Renders a Resonance Map with a grid and data clusters

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
} from '@shopify/react-native-skia';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CHART_SIZE = width - 60;
const PAD_LEFT = 40;
const PAD_BOTTOM = 40;
const PAD_RIGHT = 20;
const PAD_TOP = 20;
const PLOT_W = CHART_SIZE - PAD_LEFT - PAD_RIGHT;
const PLOT_H = CHART_SIZE - PAD_BOTTOM - PAD_TOP;
const ORIGIN_Y = CHART_SIZE - PAD_BOTTOM;

interface DataPoint {
  x: number; // normalized 0-1
  y: number; // normalized 0-1
}

const PALETTE = {
  axis: 'rgba(255, 255, 255, 0.15)',
  grid: 'rgba(255, 255, 255, 0.05)',
  point: '#6EBF8B', // Emerald
  highlight: '#C9AE78', // Gold
  text: 'rgba(255, 255, 255, 0.6)',
  glow: '#6EBF8B',
};

function SkiaBiometricScatter({ 
  points,
  title = "Behavioral Correlation",
  subtitle = "Movement vs. Vitality",
  xAxisLabel = "High Movement",
  yAxisLabel = "High Vitality",
  insight = "A 15% increase in movement correlates with a 2-point rise in emotional mood."
}: { 
  points: DataPoint[];
  title?: string;
  subtitle?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  insight?: string;
}) {

  // Build the axis and grid lines
  const axisPath = useMemo(() => {
    const p = Skia.Path.Make();
    // Y-axis
    p.moveTo(PAD_LEFT, 10);
    p.lineTo(PAD_LEFT, ORIGIN_Y);
    // X-axis
    p.moveTo(PAD_LEFT, ORIGIN_Y);
    p.lineTo(PAD_LEFT + PLOT_W, ORIGIN_Y);

    // Arrows
    // Y arrow
    p.moveTo(PAD_LEFT - 4, 18);
    p.lineTo(PAD_LEFT, 10);
    p.lineTo(PAD_LEFT + 4, 18);
    // X arrow
    const xArrow = PAD_LEFT + PLOT_W;
    p.moveTo(xArrow - 8, ORIGIN_Y - 4);
    p.lineTo(xArrow, ORIGIN_Y);
    p.lineTo(xArrow - 8, ORIGIN_Y + 4);

    return p;
  }, []);

  const gridPath = useMemo(() => {
    const p = Skia.Path.Make();
    const steps = 4;
    // Vertical grid lines
    for (let i = 1; i <= steps; i++) {
        const x = PAD_LEFT + (i / steps) * PLOT_W;
        p.moveTo(x, 20);
        p.lineTo(x, ORIGIN_Y - 2);
    }
    // Horizontal grid lines
    for (let i = 1; i <= steps; i++) {
        const y = ORIGIN_Y - (i / steps) * PLOT_H;
        p.moveTo(PAD_LEFT + 2, y);
        p.lineTo(PAD_LEFT + PLOT_W, y);
    }
    return p;
  }, []);

  // Calculate the "Correlation Heatmap" — blurred circles where data clusters
  const heatmapPath = useMemo(() => {
    const path = Skia.Path.Make();
    points.forEach((p) => {
      const clampedX = Math.max(0, Math.min(1, p.x));
      const clampedY = Math.max(0, Math.min(1, p.y));
      const cx = PAD_LEFT + clampedX * PLOT_W;
      const cy = ORIGIN_Y - clampedY * PLOT_H;
      path.addCircle(cx, cy, 22);
    });
    return path;
  }, [points]);

  if (!points || points.length === 0) {
    return (
      <View style={styles.obsidianCard}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        <View style={styles.emptyState}>
          <Ionicons name="analytics-outline" size={28} color={PALETTE.text} />
          <Text style={styles.emptyStateText}>More check-ins are needed to reveal correlations.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.obsidianCard}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <View style={styles.canvasContainer}>
        {/* Y Axis Label (positioned manually instead of matrix transform origin issues) */}
        <Text style={[styles.axisLabel, styles.yAxis]}>{yAxisLabel}</Text>
        
        <Canvas style={{ width: CHART_SIZE, height: CHART_SIZE }}>
          {/* 0. Grid */}
          <Path path={gridPath} color={PALETTE.grid} style="stroke" strokeWidth={1} />
          
          {/* 1. Axis System */}
          <Path path={axisPath} color={PALETTE.axis} style="stroke" strokeWidth={1.5} />

          {/* 2. Heatmap */}
          <Path path={heatmapPath} color={PALETTE.glow} opacity={0.15}>
            <BlurMask blur={15} style="normal" />
          </Path>

          {/* 3. Data Nodes */}
          {points.map((p, i) => {
            const clampedX = Math.max(0, Math.min(1, p.x));
            const clampedY = Math.max(0, Math.min(1, p.y));
            const cx = PAD_LEFT + clampedX * PLOT_W;
            const cy = ORIGIN_Y - clampedY * PLOT_H;
            return (
              <Group key={i}>
                <Circle cx={cx} cy={cy} r={4.5} color={PALETTE.point}>
                  <BlurMask blur={3} style="outer" />
                </Circle>
                <Circle cx={cx} cy={cy} r={2} color="#F8FAFC" />
              </Group>
            );
          })}
        </Canvas>

        {/* X Axis Label */}
        <Text style={[styles.axisLabel, styles.xAxis]}>{xAxisLabel}</Text>
      </View>

      <View style={styles.insightBox}>
        <Ionicons name="sparkles" size={16} color={PALETTE.highlight} />
        <Text style={styles.insightText}>
          {insight}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  obsidianCard: {
    padding: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderTopColor: 'rgba(255,255,255,0.10)',
  },
  header: { marginBottom: 12 },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    marginBottom: 4,
  },
  subtitle: {
    color: PALETTE.highlight,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    opacity: 0.9,
  },
  canvasContainer: {
    height: CHART_SIZE,
    width: CHART_SIZE,
    position: 'relative',
    marginTop: 10,
  },
  axisLabel: {
    position: 'absolute',
    color: PALETTE.text,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  yAxis: {
    left: 2,
    top: 16,
    maxWidth: 54,
  },
  xAxis: { 
    right: 8,
    bottom: PAD_BOTTOM - 18,
    textAlign: 'right',
    maxWidth: 96,
  },
  insightBox: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(232,214,174,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(232, 214, 174, 0.15)',
  },
  insightText: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 13,
    lineHeight: 19,
    flex: 1,
  },
  emptyState: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  emptyStateText: {
    color: PALETTE.text,
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 220,
    lineHeight: 18,
  },
});

export default memo(SkiaBiometricScatter);
