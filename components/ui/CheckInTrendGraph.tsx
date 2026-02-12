// File: components/ui/CheckInTrendGraph.tsx
// MySky — Check-In Trends: Mood, Energy & Stress over time
// Uses real DailyCheckIn data — nothing fabricated

import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import Svg, {
  Path,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
  Circle,
  Text as SvgText,
  Line,
  Rect,
} from 'react-native-svg';
import { theme } from '../../constants/theme';
import { DailyCheckIn } from '../../services/patterns/types';
import { parseLocalDate } from '../../utils/dateUtils';

/* ── Config ── */

const { width: SCREEN_W } = Dimensions.get('window');

type MetricKey = 'mood' | 'energy' | 'stress';

interface MetricConfig {
  key: MetricKey;
  label: string;
  color: string;
  glowColor: string;
  extract: (c: DailyCheckIn) => number;   // always 1–10 scale
  yLabels: string[];                       // bottom → top (5 labels)
}

const METRICS: MetricConfig[] = [
  {
    key: 'mood',
    label: 'Mood',
    color: '#C9A962',
    glowColor: 'rgba(201,169,98,0.25)',
    extract: (c) => c.moodScore,
    yLabels: ['Low', '', 'Neutral', '', 'High'],
  },
  {
    key: 'energy',
    label: 'Energy',
    color: '#6EBF8B',
    glowColor: 'rgba(110,191,139,0.25)',
    extract: (c) => {
      const map: Record<string, number> = { low: 3, medium: 6, high: 9 };
      return map[c.energyLevel] ?? 5;
    },
    yLabels: ['Low', '', 'Steady', '', 'Elevated'],
  },
  {
    key: 'stress',
    label: 'Stress',
    color: '#E07A7A',
    glowColor: 'rgba(224,122,122,0.25)',
    extract: (c) => {
      const map: Record<string, number> = { low: 3, medium: 6, high: 9 };
      return map[c.stressLevel] ?? 5;
    },
    yLabels: ['Low', '', 'Moderate', '', 'High'],
  },
];

/* ── Component ── */

interface CheckInTrendGraphProps {
  checkIns: DailyCheckIn[];
  width?: number;
  height?: number;
}

export default function CheckInTrendGraph({
  checkIns,
  width = SCREEN_W - 32,
  height = 190,
}: CheckInTrendGraphProps) {
  const [activeMetric, setActiveMetric] = useState<MetricKey>('mood');
  const metric = METRICS.find(m => m.key === activeMetric) ?? METRICS[0];

  const padding = { top: 18, right: 16, bottom: 30, left: 16 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const yMin = 1;
  const yMax = 10;

  // Sort chronologically and take last 7 max
  const sorted = useMemo(() => {
    return [...checkIns]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-7);
  }, [checkIns]);

  // Build data points from real check-in data
  const points = useMemo(() => {
    if (sorted.length === 0) return [];
    return sorted.map((ci, i) => {
      const x = padding.left + (sorted.length === 1
        ? chartW / 2
        : (i / (sorted.length - 1)) * chartW);
      const val = Math.max(yMin, Math.min(yMax, metric.extract(ci)));
      const y = padding.top + chartH - ((val - yMin) / (yMax - yMin)) * chartH;
      const d = parseLocalDate(ci.date);
      const label = d.toLocaleDateString('en-US', { weekday: 'narrow' });
      const dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return { x, y, value: val, label, dateLabel, checkIn: ci };
    });
  }, [sorted, metric, chartW, chartH]);

  // Bezier line path
  const linePath = useMemo(() => {
    if (points.length < 2) return '';
    let path = `M${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const cur = points[i];
      const next = points[i + 1];
      const cpx = (cur.x + next.x) / 2;
      path += ` C${cpx},${cur.y} ${cpx},${next.y} ${next.x},${next.y}`;
    }
    return path;
  }, [points]);

  // Area fill under line
  const areaPath = useMemo(() => {
    if (points.length < 2) return '';
    const bottomY = padding.top + chartH;
    return `${linePath} L${points[points.length - 1].x},${bottomY} L${points[0].x},${bottomY} Z`;
  }, [linePath, points, chartH]);

  // Compute average for the period
  const average = useMemo(() => {
    if (sorted.length === 0) return null;
    const sum = sorted.reduce((acc, ci) => acc + metric.extract(ci), 0);
    return sum / sorted.length;
  }, [sorted, metric]);

  // Compute trend direction (compare first half to second half)
  const trend = useMemo(() => {
    if (sorted.length < 4) return 'stable' as const;
    const mid = Math.floor(sorted.length / 2);
    const firstHalf = sorted.slice(0, mid);
    const secondHalf = sorted.slice(mid);
    const avgFirst = firstHalf.reduce((s, c) => s + metric.extract(c), 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((s, c) => s + metric.extract(c), 0) / secondHalf.length;
    const diff = avgSecond - avgFirst;
    if (diff > 0.8) return 'rising' as const;
    if (diff < -0.8) return 'falling' as const;
    return 'stable' as const;
  }, [sorted, metric]);

  const trendLabel = trend === 'rising' ? '↑ Rising' : trend === 'falling' ? '↓ Falling' : '→ Steady';
  const trendColor = metric.key === 'stress'
    ? (trend === 'rising' ? theme.stormy : trend === 'falling' ? theme.energy : theme.textMuted)
    : (trend === 'rising' ? theme.energy : trend === 'falling' ? theme.stormy : theme.textMuted);

  if (checkIns.length < 2) {
    return (
      <View style={[styles.container, { width }]}>
        <View style={styles.tabRow}>
          {METRICS.map(m => (
            <Pressable
              key={m.key}
              style={[styles.tab, activeMetric === m.key && { borderBottomColor: m.color }]}
              onPress={() => setActiveMetric(m.key)}
            >
              <Text style={[styles.tabText, activeMetric === m.key && { color: m.color }]}>
                {m.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>
            {checkIns.length === 0
              ? 'Complete energy check-ins to see trends'
              : 'One more check-in to start seeing trends'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { width }]}>
      {/* Metric tabs */}
      <View style={styles.tabRow}>
        {METRICS.map(m => (
          <Pressable
            key={m.key}
            style={[styles.tab, activeMetric === m.key && { borderBottomColor: m.color, borderBottomWidth: 2 }]}
            onPress={() => setActiveMetric(m.key)}
          >
            <Text style={[styles.tabText, activeMetric === m.key && { color: m.color, fontWeight: '700' }]}>
              {m.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Summary row */}
      <View style={styles.summaryRow}>
        {average !== null && (
          <Text style={styles.summaryText}>
            Avg: <Text style={{ color: metric.color, fontWeight: '700' }}>{average.toFixed(1)}</Text>
            <Text style={styles.summaryMuted}>/10</Text>
          </Text>
        )}
        <Text style={[styles.trendBadge, { color: trendColor }]}>{trendLabel}</Text>
        <Text style={styles.summaryMuted}>{sorted.length} check-in{sorted.length !== 1 ? 's' : ''}</Text>
      </View>

      {/* SVG chart */}
      <View style={styles.chartWrap}>
        <Svg width={width} height={height}>
          <Defs>
            <SvgGradient id="checkInAreaFill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={metric.color} stopOpacity={0.3} />
              <Stop offset="60%" stopColor={metric.color} stopOpacity={0.08} />
              <Stop offset="100%" stopColor={metric.color} stopOpacity={0} />
            </SvgGradient>
            <SvgGradient id="checkInLineGrad" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0%" stopColor={metric.color} stopOpacity={0.6} />
              <Stop offset="50%" stopColor={metric.color} stopOpacity={1} />
              <Stop offset="100%" stopColor={metric.color} stopOpacity={0.8} />
            </SvgGradient>
          </Defs>

          {/* Horizontal guide lines */}
          {[1, 3, 5, 7, 10].map(val => {
            const y = padding.top + chartH - ((val - yMin) / (yMax - yMin)) * chartH;
            return (
              <Line
                key={val}
                x1={padding.left}
                y1={y}
                x2={padding.left + chartW}
                y2={y}
                stroke="rgba(255,255,255,0.05)"
                strokeWidth={0.8}
              />
            );
          })}

          {/* Average line */}
          {average !== null && (
            <Line
              x1={padding.left}
              y1={padding.top + chartH - ((average - yMin) / (yMax - yMin)) * chartH}
              x2={padding.left + chartW}
              y2={padding.top + chartH - ((average - yMin) / (yMax - yMin)) * chartH}
              stroke={metric.color}
              strokeOpacity={0.2}
              strokeWidth={1}
              strokeDasharray="4 4"
            />
          )}

          {/* Area fill */}
          {points.length >= 2 && (
            <Path d={areaPath} fill="url(#checkInAreaFill)" />
          )}

          {/* Line */}
          {points.length >= 2 && (
            <Path
              d={linePath}
              fill="none"
              stroke="url(#checkInLineGrad)"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data dots */}
          {points.map((pt, i) => {
            const isLast = i === points.length - 1;
            return (
              <React.Fragment key={i}>
                {isLast && (
                  <Circle cx={pt.x} cy={pt.y} r={8} fill={metric.color} opacity={0.18} />
                )}
                <Circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isLast ? 5 : 3.5}
                  fill={theme.background}
                  stroke={metric.color}
                  strokeWidth={isLast ? 2.5 : 1.8}
                />
                <Circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isLast ? 2.2 : 1.5}
                  fill={metric.color}
                />
              </React.Fragment>
            );
          })}

          {/* Date labels — show all (max 7) */}
          {points.map((pt, i) => {
            const isLast = i === points.length - 1;
            return (
              <SvgText
                key={`lbl-${i}`}
                x={pt.x}
                y={height - 6}
                textAnchor="middle"
                fill={isLast ? metric.color : 'rgba(255,255,255,0.4)'}
                fontSize={10}
                fontWeight={isLast ? '600' : '400'}
              >
                {pt.label}
              </SvgText>
            );
          })}
        </Svg>

        {/* Y-axis labels */}
        <View style={[styles.yAxis, { top: padding.top, height: chartH }]}>
          {metric.yLabels.map((label, i) => (
            <Text key={i} style={styles.yLabel}>{label}</Text>
          ))}
        </View>
      </View>
    </View>
  );
}

/* ── Styles ── */

const styles = StyleSheet.create({
  container: {
    marginBottom: 4,
  },
  tabRow: {
    flexDirection: 'row',
    marginBottom: 10,
    gap: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.textMuted,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  summaryText: {
    fontSize: 13,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  summaryMuted: {
    fontSize: 12,
    color: theme.textMuted,
    fontWeight: '400',
  },
  trendBadge: {
    fontSize: 12,
    fontWeight: '700',
  },
  chartWrap: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(20,30,46,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  emptyWrap: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: theme.textMuted,
    fontSize: 13,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  yAxis: {
    position: 'absolute',
    right: 4,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 2,
  },
  yLabel: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.25)',
    fontWeight: '500',
  },
});
