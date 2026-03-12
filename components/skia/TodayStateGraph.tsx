import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Canvas, Path, Skia, LinearGradient, vec, Circle, BlurMask } from '@shopify/react-native-skia';

export interface TodayGraphPoint {
  label: string;
  mood: number;       // 1-10
  energy: number;     // 1-10
  stress: number;     // 1-10
  focus: number;      // 1-10
  connection: number; // 1-10
}

interface Props {
  width: number;
  height: number;
  data?: TodayGraphPoint[];
}

const SERIES = [
  { key: 'mood' as const,       color: '#FFC94A', label: 'Mood' },
  { key: 'energy' as const,     color: '#49DFFF', label: 'Energy' },
  { key: 'stress' as const,     color: '#FF5A5F', label: 'Stress' },
  { key: 'focus' as const,      color: '#4EA3FF', label: 'Focus' },
  { key: 'connection' as const, color: '#C86BFF', label: 'Connection' },
] as const;

const PLACEHOLDER: TodayGraphPoint[] = [
  { label: 'Mon', mood: 5, energy: 5, stress: 5, focus: 5, connection: 5 },
  { label: 'Tue', mood: 6, energy: 6, stress: 4, focus: 6, connection: 6 },
  { label: 'Wed', mood: 7, energy: 7, stress: 3, focus: 7, connection: 7 },
];

function TodayStateGraph({ width, height, data }: Props) {
  const points = (data && data.length > 0) ? data : PLACEHOLDER;

  const PAD_L = 28;
  const PAD_R = 16;
  const PAD_T = 20;
  const PAD_B = 36;
  const graphW = width - PAD_L - PAD_R;
  const graphH = height - PAD_T - PAD_B;

  const xPos = (i: number) => PAD_L + (i / Math.max(points.length - 1, 1)) * graphW;
  const yPos = (v: number) => PAD_T + graphH - ((v - 1) / 9) * graphH;

  function buildLinePath(key: keyof Omit<TodayGraphPoint, 'label'>): ReturnType<typeof Skia.Path.Make> {
    const p = Skia.Path.Make();
    points.forEach((pt, i) => {
      const x = xPos(i);
      const y = yPos(pt[key]);
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    });
    return p;
  }

  return (
    <View style={[styles.container, { width, height }]}>
      <Canvas style={StyleSheet.absoluteFill}>
        {/* Background grid lines */}
        {[2, 4, 6, 8, 10].map(v => {
          const y = yPos(v);
          const gp = Skia.Path.Make();
          gp.moveTo(PAD_L, y);
          gp.lineTo(PAD_L + graphW, y);
          return <Path key={v} path={gp} color="rgba(255,255,255,0.05)" style="stroke" strokeWidth={1} />;
        })}

        {/* Series lines */}
        {SERIES.map(s => (
          <Path
            key={s.key}
            path={buildLinePath(s.key)}
            color={s.color}
            style="stroke"
            strokeWidth={1.5}
            strokeCap="round"
            strokeJoin="round"
          />
        ))}

        {/* Data point dots for last point */}
        {SERIES.map(s => {
          const last = points[points.length - 1];
          return (
            <Circle key={s.key} cx={xPos(points.length - 1)} cy={yPos(last[s.key])} r={3} color={s.color}>
              <BlurMask blur={2} style="normal" />
            </Circle>
          );
        })}
      </Canvas>

      {/* X-axis labels */}
      <View style={[styles.xLabels, { bottom: 6, left: PAD_L, right: PAD_R }]}>
        {points.map((pt, i) => (
          <Text
            key={i}
            style={[styles.axisLabel, { left: ((i / Math.max(points.length - 1, 1)) * graphW) - 12 }]}
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
    flexDirection: 'row',
  },
  axisLabel: {
    position: 'absolute',
    fontSize: 9,
    color: 'rgba(255,255,255,0.35)',
    width: 24,
    textAlign: 'center',
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
});

export default memo(TodayStateGraph);
