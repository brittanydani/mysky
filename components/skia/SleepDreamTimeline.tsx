import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Canvas, Path, Skia, Circle, BlurMask } from '@shopify/react-native-skia';

export type DreamType = 'vivid' | 'none' | 'symbolic' | 'recurring' | 'lucid';
export type DreamTone = 'calm' | 'light' | 'mixed' | 'intense' | 'dark';

export interface SleepDreamPoint {
  label: string;
  hoursSlept: number;       // 0–12
  quality: number;           // 0–10
  interruptions: number;
  dreamIntensity: number;    // 0–10
  dreamRecall: number;       // 0–10
  dreamType: DreamType;
  dreamTone: DreamTone;
}

export const DEFAULT_SLEEP_DREAM_DATA: SleepDreamPoint[] = [
  { label: 'Mon', hoursSlept: 7.5, quality: 7, interruptions: 1, dreamIntensity: 6, dreamRecall: 5, dreamType: 'vivid',    dreamTone: 'calm' },
  { label: 'Tue', hoursSlept: 6.0, quality: 5, interruptions: 2, dreamIntensity: 3, dreamRecall: 2, dreamType: 'none',     dreamTone: 'light' },
  { label: 'Wed', hoursSlept: 8.0, quality: 8, interruptions: 0, dreamIntensity: 7, dreamRecall: 7, dreamType: 'symbolic', dreamTone: 'calm' },
  { label: 'Thu', hoursSlept: 5.5, quality: 4, interruptions: 3, dreamIntensity: 4, dreamRecall: 3, dreamType: 'none',     dreamTone: 'mixed' },
  { label: 'Fri', hoursSlept: 7.0, quality: 6, interruptions: 1, dreamIntensity: 5, dreamRecall: 4, dreamType: 'vivid',    dreamTone: 'light' },
  { label: 'Sat', hoursSlept: 9.0, quality: 9, interruptions: 0, dreamIntensity: 8, dreamRecall: 8, dreamType: 'lucid',    dreamTone: 'calm' },
  { label: 'Sun', hoursSlept: 7.5, quality: 7, interruptions: 1, dreamIntensity: 6, dreamRecall: 6, dreamType: 'vivid',    dreamTone: 'light' },
];

interface Props {
  data?: SleepDreamPoint[];
  width?: number;
  showLegend?: boolean;
  showSymbols?: boolean;
}

const SLEEP_COLOR = '#5CADFF';
const DREAM_COLOR = '#C86BFF';
const QUALITY_COLOR = '#FFDA03';

const TONE_COLORS: Record<DreamTone, string> = {
  calm:    '#5CADFF',
  light:   '#FFDA03',
  mixed:   '#FF9A3C',
  intense: '#C86BFF',
  dark:    '#FF5A5F',
};

const TYPE_SYMBOLS: Record<DreamType, string> = {
  vivid:     '◆',
  none:      '·',
  symbolic:  '◇',
  recurring: '↻',
  lucid:     '✦',
};

const GRAPH_H = 130;
const PAD_L = 20;
const PAD_R = 12;
const PAD_T = 12;
const PAD_B = 24;

function SleepDreamTimeline({ data, width = 320, showLegend = false, showSymbols = false }: Props) {
  const points = (data && data.length > 0) ? data : DEFAULT_SLEEP_DREAM_DATA;
  const graphW = width - PAD_L - PAD_R;
  const innerH = GRAPH_H - PAD_T - PAD_B;

  const xAt = (i: number) => PAD_L + (i / Math.max(points.length - 1, 1)) * graphW;
  const yAt = (v: number, max: number) => PAD_T + innerH - (v / max) * innerH;

  // Build sleep bar rects
  const maxSleep = 12;
  const barW = Math.max(4, graphW / points.length * 0.45);

  // Build quality line path
  const qualityPath = Skia.Path.Make();
  points.forEach((pt, i) => {
    const x = xAt(i);
    const y = yAt(pt.quality, 10);
    if (i === 0) qualityPath.moveTo(x, y);
    else qualityPath.lineTo(x, y);
  });

  // Build dream intensity line path
  const dreamPath = Skia.Path.Make();
  points.forEach((pt, i) => {
    const x = xAt(i);
    const y = yAt(pt.dreamIntensity, 10);
    if (i === 0) dreamPath.moveTo(x, y);
    else dreamPath.lineTo(x, y);
  });

  const totalH = GRAPH_H + (showLegend ? 36 : 8);

  return (
    <View style={[{ width }]}>
      <Canvas style={{ width, height: GRAPH_H }}>
        {/* Sleep bars */}
        {points.map((pt, i) => {
          const x = xAt(i) - barW / 2;
          const barH = Math.max(2, (pt.hoursSlept / maxSleep) * innerH);
          const y = PAD_T + innerH - barH;
          const toneColor = TONE_COLORS[pt.dreamTone] ?? SLEEP_COLOR;
          const path = Skia.Path.Make();
          path.addRRect({ rect: { x, y, width: barW, height: barH }, rx: 2, ry: 2 });
          return (
            <Path
              key={`bar-${i}`}
              path={path}
              color={`${toneColor}50`}
            />
          );
        })}

        {/* Quality line */}
        <Path path={qualityPath} color={QUALITY_COLOR} style="stroke" strokeWidth={2} strokeCap="round" strokeJoin="round" />

        {/* Dream intensity line */}
        <Path path={dreamPath} color={DREAM_COLOR} style="stroke" strokeWidth={1.5} strokeCap="round" strokeJoin="round" />

        {/* Dream type dots */}
        {points.map((pt, i) => {
          if (pt.dreamType === 'none') return null;
          const x = xAt(i);
          const y = yAt(pt.dreamIntensity, 10);
          return (
            <React.Fragment key={`dot-${i}`}>
              <Circle cx={x} cy={y} r={5} color={`${TONE_COLORS[pt.dreamTone]}40`}>
                <BlurMask blur={3} style="normal" />
              </Circle>
              <Circle cx={x} cy={y} r={3} color={TONE_COLORS[pt.dreamTone]} />
            </React.Fragment>
          );
        })}
      </Canvas>

      {/* X labels */}
      <View style={[styles.xLabels, { width }]}>
        {points.map((pt, i) => (
          <Text
            key={i}
            style={[styles.xLabel, { left: xAt(i) - 10 }]}
          >
            {showSymbols ? TYPE_SYMBOLS[pt.dreamType] : pt.label}
          </Text>
        ))}
      </View>

      {showLegend && (
        <View style={styles.legend}>
          <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: QUALITY_COLOR }]} /><Text style={styles.legendText}>Quality</Text></View>
          <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: DREAM_COLOR }]} /><Text style={styles.legendText}>Dream Intensity</Text></View>
          <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: SLEEP_COLOR }]} /><Text style={styles.legendText}>Sleep Hours</Text></View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  xLabels: {
    position: 'relative',
    height: 18,
  },
  xLabel: {
    position: 'absolute',
    fontSize: 9,
    color: 'rgba(255,255,255,0.35)',
    width: 20,
    textAlign: 'center',
  },
  legend: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 4,
    paddingHorizontal: 4,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
  },
});

export default memo(SleepDreamTimeline);
