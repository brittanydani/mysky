// File: components/ui/MoodGraph.tsx
// MySky — Beautiful 7-day mood trend with gold line + area gradient fill
// Replaces the plain react-native-chart-kit LineChart

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, {
  Path,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
  Circle,
  Text as SvgText,
  Line,
} from 'react-native-svg';
import { theme } from '../../constants/theme';

interface MoodDataPoint {
  label: string;      // e.g. "Mon"
  value: number;      // 1 (stormy) to 5 (calm)
  mood?: string;       // "calm" | "soft" | "okay" | "heavy" | "stormy"
}

interface MoodGraphProps {
  data: MoodDataPoint[];
  width?: number;
  height?: number;
}

const MOOD_DOT_COLORS: Record<string, string> = {
  calm: '#6EBF8B',
  soft: '#8BC4E8',
  okay: '#C9A962',
  heavy: '#E0B07A',
  stormy: '#E07A7A',
};

const { width: SCREEN_W } = Dimensions.get('window');

export default function MoodGraph({
  data,
  width = SCREEN_W - 32,
  height = 180,
}: MoodGraphProps) {
  const padding = { top: 20, right: 20, bottom: 32, left: 20 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  // Min/Max for y-axis: 1–5
  const yMin = 1;
  const yMax = 5;

  const points = useMemo(() => {
    if (data.length === 0) return [];
    return data.map((d, i) => {
      const x = padding.left + (data.length === 1 ? chartW / 2 : (i / (data.length - 1)) * chartW);
      const y = padding.top + chartH - ((d.value - yMin) / (yMax - yMin)) * chartH;
      return { x, y, ...d };
    });
  }, [data, chartW, chartH]);

  // Build smooth bezier path
  const linePath = useMemo(() => {
    if (points.length < 2) return '';
    let path = `M${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const cpx = (current.x + next.x) / 2;
      path += ` C${cpx},${current.y} ${cpx},${next.y} ${next.x},${next.y}`;
    }
    return path;
  }, [points]);

  // Area fill path (line path + close to bottom)
  const areaPath = useMemo(() => {
    if (points.length < 2) return '';
    const bottomY = padding.top + chartH;
    return `${linePath} L${points[points.length - 1].x},${bottomY} L${points[0].x},${bottomY} Z`;
  }, [linePath, points, chartH]);

  // Y-axis scale labels
  const scaleLabels = ['Stormy', 'Heavy', 'Okay', 'Soft', 'Calm'];

  if (data.length === 0) {
    return (
      <View style={[styles.container, { width, height }]}>
        <Text style={styles.emptyText}>Add journal entries to see your mood pattern</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { width, height: height + 12 }]}>
      <Svg width={width} height={height}>
        <Defs>
          <SvgGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={theme.primary} stopOpacity={0.35} />
            <Stop offset="60%" stopColor={theme.primary} stopOpacity={0.1} />
            <Stop offset="100%" stopColor={theme.primary} stopOpacity={0} />
          </SvgGradient>
          <SvgGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor={theme.primaryLight} stopOpacity={0.7} />
            <Stop offset="50%" stopColor={theme.primary} stopOpacity={1} />
            <Stop offset="100%" stopColor={theme.primaryLight} stopOpacity={0.9} />
          </SvgGradient>
        </Defs>

        {/* Subtle horizontal guide lines */}
        {[1, 2, 3, 4, 5].map(val => {
          const y = padding.top + chartH - ((val - yMin) / (yMax - yMin)) * chartH;
          return (
            <Line
              key={val}
              x1={padding.left}
              y1={y}
              x2={padding.left + chartW}
              y2={y}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={0.8}
            />
          );
        })}

        {/* Area fill under the curve */}
        {points.length >= 2 && (
          <Path d={areaPath} fill="url(#areaFill)" />
        )}

        {/* The gold bezier line */}
        {points.length >= 2 && (
          <Path
            d={linePath}
            fill="none"
            stroke="url(#lineGrad)"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Data point dots */}
        {points.map((pt, i) => {
          const dotColor = pt.mood ? (MOOD_DOT_COLORS[pt.mood] || theme.primary) : theme.primary;
          const isLast = i === points.length - 1;
          return (
            <React.Fragment key={i}>
              {/* Outer glow for last dot */}
              {isLast && (
                <Circle
                  cx={pt.x}
                  cy={pt.y}
                  r={8}
                  fill={dotColor}
                  opacity={0.2}
                />
              )}
              {/* Dark ring background */}
              <Circle
                cx={pt.x}
                cy={pt.y}
                r={isLast ? 5.5 : 4.5}
                fill={theme.background}
                stroke={dotColor}
                strokeWidth={isLast ? 2.5 : 2}
              />
              {/* Inner fill */}
              <Circle
                cx={pt.x}
                cy={pt.y}
                r={isLast ? 2.5 : 2}
                fill={dotColor}
              />
            </React.Fragment>
          );
        })}

        {/* Day labels along bottom */}
        {points.map((pt, i) => {
          const isLast = i === points.length - 1;
          return (
            <SvgText
              key={`label-${i}`}
              x={pt.x}
              y={height - 6}
              textAnchor="middle"
              fill={isLast ? theme.primary : 'rgba(255,255,255,0.45)'}
              fontSize={11}
              fontWeight={isLast ? '600' : '400'}
              fontFamily="System"
            >
              {pt.label}
            </SvgText>
          );
        })}
      </Svg>

      {/* Y-axis mood labels — positioned to the right */}
      <View style={[styles.yAxis, { top: padding.top, height: chartH }]}>
        {scaleLabels.reverse().map((label, i) => (
          <Text
            key={label}
            style={[
              styles.yLabel,
              i === scaleLabels.length - 1 && { color: theme.energy },
              i === 0 && { color: 'rgba(224,122,122,0.6)' },
            ]}
          >
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  emptyText: {
    color: theme.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 40,
  },
  yAxis: {
    position: 'absolute',
    right: 0,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 4,
  },
  yLabel: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.3)',
    fontWeight: '500',
  },
});
