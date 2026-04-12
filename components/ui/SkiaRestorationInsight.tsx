// File: components/ui/SkiaRestorationInsight.tsx
/**
 * SkiaRestorationInsight — "Illuminated Horizon"
 *
 * Visually compares Sleep Quality vs. Morning Mood using Skia
 * "luminous horizon" bars instead of clinical charts.
 *
 *   High-restoration nights → Silver-Blue luminance
 *   Restless nights → diffused, low-opacity Indigo
 *
 * Each night is rendered as a vertical "horizon band" whose
 * height = quality, glow intensity = mood, and colour shifts
 * from indigo (low) through amethyst (mid) to silver-blue (high).
 *
 * Requires: @shopify/react-native-skia 2.x, react-native-reanimated 4.x
 */

import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import {
  Canvas,
  Rect,
  RoundedRect,
  Group,
  LinearGradient,
  BlurMask,
  vec,
} from '@shopify/react-native-skia';
import { type AppTheme } from '../../constants/theme';
import { useThemedStyles, useAppTheme } from '../../context/ThemeContext';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = SCREEN_W - 32;
const CARD_H = 180;
const GRAPH_H = 110;
const GRAPH_TOP = 20;
const GRAPH_SIDE_PAD = 18;
const BAR_GAP = 14;

// ── Colour stops ────────────────────────────────────────────────────────────

function barColors(quality: number, isDark: boolean): [string, string] {
  if (isDark) {
    if (quality <= 2) return ['rgba(60, 50, 120, 0.6)', 'rgba(40, 35, 90, 0.15)'];
    if (quality <= 3) return ['rgba(120, 80, 180, 0.6)', 'rgba(80, 60, 140, 0.15)'];
    return ['rgba(201, 174, 120, 0.7)', 'rgba(100, 160, 210, 0.15)'];
  }
  // Light mode — more opaque, ink-on-paper feel
  if (quality <= 2) return ['rgba(80, 60, 160, 0.75)', 'rgba(60, 50, 130, 0.25)'];
  if (quality <= 3) return ['rgba(140, 90, 200, 0.75)', 'rgba(100, 70, 160, 0.25)'];
  return ['rgba(180, 148, 72, 0.85)', 'rgba(140, 110, 50, 0.25)'];
}

function moodGlow(moodScore: number): number {
  // moodScore 1–10 → glow opacity 0.05–0.4
  return 0.05 + (moodScore / 10) * 0.35;
}

// ── Types ───────────────────────────────────────────────────────────────────

interface DataPoint {
  /** Day label (e.g. "Mon") */
  label: string;
  /** Sleep quality 1–5 */
  quality: number;
  /** Morning mood score 1–10 */
  moodScore: number;
}

interface Props {
  data: DataPoint[];
  /** Card title */
  title?: string;
}

// ── Component ───────────────────────────────────────────────────────────────

const SkiaRestorationInsight = memo(function SkiaRestorationInsight({
  data,
  title = 'Sleep Quality vs. Morning Mood',
}: Props) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const points = data.slice(-14); // max 14 days
  const barWidth = useMemo(() => {
    if (points.length === 0) return 0;
    const availableWidth = CARD_W - GRAPH_SIDE_PAD * 2 - BAR_GAP * (points.length - 1);
    return Math.max(5, Math.min(8, availableWidth / points.length));
  }, [points.length]);
  const baselineY = GRAPH_TOP + GRAPH_H;

  return (
    <View style={styles.wrapper}>
      {/* Title */}
      <Text style={styles.title}>{title}</Text>

      {/* Illuminated Horizon Graph */}
      <Canvas style={styles.canvas}>
        {/* Glass background */}
        <RoundedRect
          x={0}
          y={0}
          width={CARD_W}
          height={CARD_H}
          r={16}
          color={theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255, 255, 255, 0.75)'}
        />
        <RoundedRect
          x={0.5}
          y={0.5}
          width={CARD_W - 1}
          height={CARD_H - 1}
          r={16}
          style="stroke"
          strokeWidth={1}
          color={theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(26, 24, 21, 0.08)'}
        />

        <Rect
          x={GRAPH_SIDE_PAD}
          y={baselineY + 2}
          width={CARD_W - GRAPH_SIDE_PAD * 2}
          height={1}
          color={theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0, 0, 0, 0.05)'}
        />

        {/* Horizon bars */}
        <Group>
          {points.map((pt, i) => {
            const x = GRAPH_SIDE_PAD + i * (barWidth + BAR_GAP);
            const normQ = pt.quality / 5;
            const barH = Math.max(12, normQ * GRAPH_H);
            const y = GRAPH_TOP + (GRAPH_H - barH);
            const [topColor, botColor] = barColors(pt.quality, theme.isDark);
            const glowOp = moodGlow(pt.moodScore);
            const radius = barWidth / 2;

            return (
              <Group key={i}>
                {/* Glow beneath bar */}
                <RoundedRect
                  x={x - 1}
                  y={y}
                  width={barWidth + 2}
                  height={barH}
                  r={(barWidth + 2) / 2}
                  color={topColor}
                  opacity={glowOp}
                >
                  <BlurMask blur={14} style="normal" />
                </RoundedRect>

                {/* The horizon bar */}
                <RoundedRect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barH}
                  r={radius}
                >
                  <LinearGradient
                    start={vec(x, y + barH)}
                    end={vec(x, y)}
                    colors={[topColor, botColor]}
                    positions={[0, 0.55]}
                  />
                </RoundedRect>

                {/* Specular highlight at top */}
                <RoundedRect
                  x={x + barWidth * 0.22}
                  y={y + 4}
                  width={barWidth * 0.56}
                  height={Math.min(5, Math.max(3, barH * 0.16))}
                  r={999}
                  color="rgba(255, 255, 255, 0.18)"
                />
              </Group>
            );
          })}
        </Group>
      </Canvas>

      {/* Day labels */}
      <View style={styles.labelRow}>
        {points.map((pt, i) => (
          <Text
            key={i}
            style={[styles.dayLabel, { width: barWidth + BAR_GAP }]}
            numberOfLines={1}
          >
            {pt.label}
          </Text>
        ))}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: 'rgba(201, 174, 120, 0.7)' }]} />
          <Text style={styles.legendText}>Restorative</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: 'rgba(60, 50, 120, 0.6)' }]} />
          <Text style={styles.legendText}>Restless</Text>
        </View>
        <Text style={styles.legendNote}>Glow intensity = morning mood</Text>
      </View>
    </View>
  );
});

export default SkiaRestorationInsight;

// ── Styles ──────────────────────────────────────────────────────────────────

const createStyles = (theme: AppTheme) => StyleSheet.create({
  wrapper: {
    width: CARD_W,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    color: theme.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  canvas: {
    width: CARD_W,
    height: CARD_H,
  },
  labelRow: {
    flexDirection: 'row',
    paddingHorizontal: GRAPH_SIDE_PAD,
    marginTop: 6,
  },
  dayLabel: {
    color: theme.isDark ? theme.textMuted : 'rgba(26, 24, 21, 0.5)',
    fontSize: 9,
    textAlign: 'center',
    fontWeight: '500',
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 14,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  legendText: {
    color: theme.isDark ? theme.textMuted : 'rgba(26, 24, 21, 0.5)',
    fontSize: 10,
  },
  legendNote: {
    color: theme.isDark ? theme.textMuted : 'rgba(26, 24, 21, 0.5)',
    fontSize: 9,
    marginLeft: 'auto',
  },
});
