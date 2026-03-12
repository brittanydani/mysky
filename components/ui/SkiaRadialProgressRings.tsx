import React, { memo, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  Canvas,
  Path,
  Skia,
  BlurMask,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  useDerivedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';

export interface RingMetric {
  label: string;
  /** 0–1 */
  value: number;
  color: string;
}

interface Props {
  metrics: RingMetric[];
  size?: number;
}

const TRACK_ALPHA = 0.15;
const STROKE = 14;
const GAP = 6;
const START_ANGLE = -Math.PI / 2; // 12 o'clock

function hexToRgba(hex: string, alpha: number): string {
  // Handle rgba/rgb strings passed in directly
  if (hex.startsWith('rgba') || hex.startsWith('rgb')) return hex;
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function buildArc(cx: number, cy: number, radius: number, startAngle: number, endAngle: number): string {
  const x1 = cx + radius * Math.cos(startAngle);
  const y1 = cy + radius * Math.sin(startAngle);
  const x2 = cx + radius * Math.cos(endAngle);
  const y2 = cy + radius * Math.sin(endAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
}

function RingLayer({ cx, cy, radius, color, value, animated }: {
  cx: number; cy: number; radius: number; color: string; value: number; animated: ReturnType<typeof useSharedValue>;
}) {
  const trackPath = Skia.Path.MakeFromSVGString(
    buildArc(cx, cy, radius, START_ANGLE, START_ANGLE + Math.PI * 2 - 0.001)
  )!;

  const fillPath = useDerivedValue(() => {
    const sweep = Math.PI * 2 * Math.min(1, Math.max(0, animated.value as number));
    const end = START_ANGLE + sweep;
    const svgStr = sweep < 0.001
      ? 'M 0 0'
      : buildArc(cx, cy, radius, START_ANGLE, end);
    return Skia.Path.MakeFromSVGString(svgStr) ?? Skia.Path.Make();
  });

  const trackColor = hexToRgba(color, TRACK_ALPHA);

  return (
    <>
      <Path path={trackPath} color={trackColor} style="stroke" strokeWidth={STROKE} strokeCap="round" />
      <Path path={fillPath} color={color} style="stroke" strokeWidth={STROKE} strokeCap="round">
        <BlurMask blur={2} style="solid" />
      </Path>
    </>
  );
}

function SkiaRadialProgressRings({ metrics, size = 220 }: Props) {
  const count = Math.min(metrics.length, 4);
  const cx = size / 2;
  const cy = size / 2;
  const maxRadius = size / 2 - STROKE / 2 - 4;

  // Animated values for each ring (up to 4)
  const a0 = useSharedValue(0);
  const a1 = useSharedValue(0);
  const a2 = useSharedValue(0);
  const a3 = useSharedValue(0);
  const animated = [a0, a1, a2, a3];

  useEffect(() => {
    metrics.forEach((m, i) => {
      if (i < 4) {
        animated[i].value = withTiming(m.value, { duration: 900 + i * 120, easing: Easing.out(Easing.cubic) });
      }
    });
  }, [metrics]);

  const radii = Array.from({ length: count }, (_, i) =>
    maxRadius - i * (STROKE + GAP)
  );

  return (
    <View style={{ width: size, height: size }}>
      <Canvas style={StyleSheet.absoluteFill}>
        {Array.from({ length: count }, (_, i) => (
          <RingLayer
            key={i}
            cx={cx}
            cy={cy}
            radius={radii[i]}
            color={metrics[i].color}
            value={metrics[i].value}
            animated={animated[i]}
          />
        ))}
      </Canvas>

      {/* Labels overlay */}
      <View style={[StyleSheet.absoluteFill, styles.labelsContainer]}>
        {metrics.slice(0, count).map((m, i) => (
          <View key={i} style={styles.labelRow}>
            <View style={[styles.dot, { backgroundColor: m.color }]} />
            <Text style={styles.labelText} numberOfLines={1}>{m.label}</Text>
            <Text style={[styles.valueText, { color: m.color }]}>{Math.round(m.value * 100)}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  labelsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  labelText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.55)',
    width: 100,
  },
  valueText: {
    fontSize: 10,
    fontWeight: '700',
    width: 32,
    textAlign: 'right',
  },
});

export default memo(SkiaRadialProgressRings);
