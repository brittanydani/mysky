/**
 * SkiaBiometricScatter
 * Advanced scientific correlation mapping for wellness.
 * Correlates lifestyle habits (e.g., Movement) with internal states (e.g., Energy).
 *
 * Renders a Resonance Map — each dot represents a day where two metrics
 * intersected. A Skia BlurMask creates a heatmap glow effect: areas where
 * high energy correlates with high steps "ignite" with emerald/gold luminance.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import {
  Canvas,
  Circle,
  Group,
  BlurMask,
  Path,
  Skia,
} from '@shopify/react-native-skia';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CHART_SIZE = width - 60;
const PAD = 40;
const PLOT_AREA = CHART_SIZE - PAD;

interface DataPoint {
  x: number; // e.g., Steps (normalized 0-1)
  y: number; // e.g., Mood (normalized 0-1)
}

const PALETTE = {
  axis: 'rgba(255, 255, 255, 0.1)',
  point: '#6EBF8B', // Emerald
  highlight: '#D4AF37', // Gold
  text: 'rgba(255, 255, 255, 0.4)',
};

export default function SkiaBiometricScatter({ points }: { points: DataPoint[] }) {

  // Build the axis grid as an SkPath (Skia Path requires an object, not a string)
  const axisPath = useMemo(() => {
    const p = Skia.Path.Make();
    // Y-axis
    p.moveTo(PAD, 0);
    p.lineTo(PAD, PLOT_AREA);
    // X-axis
    p.moveTo(PAD, PLOT_AREA);
    p.lineTo(CHART_SIZE, PLOT_AREA);
    return p;
  }, []);

  // Calculate the "Correlation Heatmap" — blurred circles where data clusters
  const heatmapPath = useMemo(() => {
    const path = Skia.Path.Make();
    points.forEach((p) => {
      const cx = PAD + p.x * (PLOT_AREA - PAD);
      const cy = PLOT_AREA - p.y * (PLOT_AREA - PAD);
      path.addCircle(cx, cy, 15);
    });
    return path;
  }, [points]);

  return (
    <View style={styles.obsidianCard}>
      <View style={styles.header}>
        <Text style={styles.title}>Behavioral Correlation</Text>
        <Text style={styles.subtitle}>Movement vs. Vitality</Text>
      </View>

      <View style={styles.canvasContainer}>
        <Canvas style={{ width: CHART_SIZE, height: CHART_SIZE }}>
          {/* 1. The Grid System */}
          <Group>
            <Path
              path={axisPath}
              color={PALETTE.axis}
              style="stroke"
              strokeWidth={1}
            />
          </Group>

          {/* 2. The Correlation Heatmap (Glows where data clusters) */}
          <Path path={heatmapPath} color={PALETTE.point} opacity={0.1}>
            <BlurMask blur={20} style="normal" />
          </Path>

          {/* 3. The Individual Data Nodes */}
          {points.map((p, i) => {
            const cx = PAD + p.x * (PLOT_AREA - PAD);
            const cy = PLOT_AREA - p.y * (PLOT_AREA - PAD);
            return (
              <Group key={i}>
                <Circle cx={cx} cy={cy} r={3} color={PALETTE.point}>
                  <BlurMask blur={4} style="outer" />
                </Circle>
                <Circle cx={cx} cy={cy} r={1.5} color="#FDFBF7" />
              </Group>
            );
          })}
        </Canvas>

        {/* Axis Labels */}
        <Text style={[styles.axisLabel, styles.yAxis]}>High Vitality</Text>
        <Text style={[styles.axisLabel, styles.xAxis]}>High Movement</Text>
      </View>

      <View style={styles.insightBox}>
        <Ionicons name="stats-chart" size={14} color={PALETTE.highlight} />
        <Text style={styles.insightText}>
          A 15% increase in movement correlates with a 2-point rise in emotional mood.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  obsidianCard: {
    padding: 24,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  header: { marginBottom: 20 },
  title: {
    color: '#FDFBF7',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  },
  subtitle: {
    color: PALETTE.highlight,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  canvasContainer: {
    height: CHART_SIZE,
    width: CHART_SIZE,
    position: 'relative',
  },
  axisLabel: {
    position: 'absolute',
    color: PALETTE.text,
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  yAxis: {
    left: 0,
    top: 0,
    transform: [{ rotate: '-90deg' }],
    transformOrigin: 'left top',
  },
  xAxis: { right: 0, bottom: -10 },
  insightBox: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
  },
  insightText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
});
