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
 * height = quality, brightness = mood, and colour shifts
 * from indigo (low) through amethyst (mid) to silver-blue (high).
 *
 * Requires: @shopify/react-native-skia 2.x, react-native-reanimated 4.x
 */

import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import {
  Canvas,
  Rect,
  RoundedRect,
  Group,
  LinearGradient,
  BlurMask,
  vec,
} from '@shopify/react-native-skia';
import { theme } from '../../constants/theme';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = SCREEN_W - 32;
const CARD_H = 180;
const GRAPH_H = 110;
const BAR_GAP = 3;

// ── Colour stops ────────────────────────────────────────────────────────────

function barColors(quality: number): [string, string] {
  if (quality <= 2) return ['rgba(60, 50, 120, 0.6)', 'rgba(40, 35, 90, 0.15)'];
  if (quality <= 3) return ['rgba(120, 80, 180, 0.6)', 'rgba(80, 60, 140, 0.15)'];
  return ['rgba(139, 196, 232, 0.7)', 'rgba(100, 160, 210, 0.15)'];
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
  const points = data.slice(-14); // max 14 days
  const barWidth = useMemo(() => {
    if (points.length === 0) return 0;
    return Math.max(6, (CARD_W - 32 - BAR_GAP * (points.length - 1)) / points.length);
  }, [points.length]);

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
          color="rgba(15, 18, 25, 0.85)"
        />
        <RoundedRect
          x={0.5}
          y={0.5}
          width={CARD_W - 1}
          height={CARD_H - 1}
          r={16}
          style="stroke"
          strokeWidth={1}
          color="rgba(255, 255, 255, 0.06)"
        />

        {/* Horizon bars */}
        <Group>
          {points.map((pt, i) => {
            const x = 16 + i * (barWidth + BAR_GAP);
            const normQ = pt.quality / 5;
            const barH = Math.max(4, normQ * GRAPH_H);
            const y = 20 + (GRAPH_H - barH);
            const [topColor, botColor] = barColors(pt.quality);
            const glowOp = moodGlow(pt.moodScore);

            return (
              <Group key={i}>
                {/* Glow beneath bar */}
                <Rect
                  x={x - 2}
                  y={y + barH * 0.5}
                  width={barWidth + 4}
                  height={barH * 0.6}
                  color={topColor}
                  opacity={glowOp}
                >
                  <BlurMask blur={12} style="normal" />
                </Rect>

                {/* The horizon bar */}
                <RoundedRect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barH}
                  r={barWidth / 2}
                >
                  <LinearGradient
                    start={vec(x, y)}
                    end={vec(x, y + barH)}
                    colors={[topColor, botColor]}
                  />
                </RoundedRect>

                {/* Specular highlight at top */}
                <RoundedRect
                  x={x + 1}
                  y={y}
                  width={barWidth - 2}
                  height={Math.min(4, barH * 0.3)}
                  r={(barWidth - 2) / 2}
                  color="rgba(255, 255, 255, 0.15)"
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
          <View style={[styles.legendDot, { backgroundColor: 'rgba(139, 196, 232, 0.7)' }]} />
          <Text style={styles.legendText}>Restorative</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: 'rgba(60, 50, 120, 0.6)' }]} />
          <Text style={styles.legendText}>Restless</Text>
        </View>
        <Text style={styles.legendNote}>Brightness = morning mood</Text>
      </View>
    </View>
  );
});

export default SkiaRestorationInsight;

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    width: CARD_W,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    color: '#FDFBF7',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  canvas: {
    width: CARD_W,
    height: CARD_H,
  },
  labelRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 6,
  },
  dayLabel: {
    color: theme.textMuted,
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
    color: theme.textMuted,
    fontSize: 10,
  },
  legendNote: {
    color: theme.textMuted,
    fontSize: 9,
    fontStyle: 'italic',
    marginLeft: 'auto',
  },
});
