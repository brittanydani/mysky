// Advanced scientific correlation mapping for wellness.
// Correlates lifestyle habits (e.g., Movement) with internal states (e.g., Energy).
// Renders a Resonance Map with a grid and data clusters

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import {
  Canvas,
  Circle,
  Group,
  BlurMask,
  Path,
  Skia,
  LinearGradient as SkiaGradient,
  vec,
} from '@shopify/react-native-skia';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CHART_SIZE = width - 60;
const PAD_LEFT = 40;
const PAD_BOTTOM = 40;
const PLOT_W = CHART_SIZE - PAD_LEFT - 20; // Leave 20px padding on right
const PLOT_H = CHART_SIZE - PAD_BOTTOM - 20; // Leave 20px padding on top
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

export default function SkiaBiometricScatter({ 
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
    p.lineTo(CHART_SIZE - 5, ORIGIN_Y);

    // Arrows
    // Y arrow
    p.moveTo(PAD_LEFT - 4, 18);
    p.lineTo(PAD_LEFT, 10);
    p.lineTo(PAD_LEFT + 4, 18);
    // X arrow
    p.moveTo(CHART_SIZE - 13, ORIGIN_Y - 4);
    p.lineTo(CHART_SIZE - 5, ORIGIN_Y);
    p.lineTo(CHART_SIZE - 13, ORIGIN_Y + 4);

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
      const cx = PAD_LEFT + p.x * PLOT_W;
      const cy = ORIGIN_Y - p.y * PLOT_H;
      path.addCircle(cx, cy, 22);
    });
    return path;
  }, [points]);

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
            const cx = PAD_LEFT + p.x * PLOT_W;
            const cy = ORIGIN_Y - p.y * PLOT_H;
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
  },
  header: { marginBottom: 12 },
  title: {
    color: '#F0EAD6',
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
    left: PAD_LEFT + 8,
    top: -5,
  },
  xAxis: { 
    right: 5, 
    bottom: PAD_BOTTOM - 20, 
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
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    lineHeight: 20,
    flex: 1,
  },
});
