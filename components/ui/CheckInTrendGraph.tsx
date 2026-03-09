import React, { useMemo, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, Platform, PanResponder, GestureResponderEvent, PanResponderGestureState } from 'react-native';
import { Canvas, Path, Circle, LinearGradient as SkiaGradient, vec, Line as SkiaLine } from '@shopify/react-native-skia';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { theme } from '../../constants/theme';
import { DailyCheckIn } from '../../services/patterns/types';
import { parseLocalDate } from '../../utils/dateUtils';

/* ── Cinematic Palette ── */
const PALETTE = {
  gold: theme.textGold,
  silverBlue: theme.growth,
  copper: theme.cinematic.copper,
  emerald: theme.energy,
  textMain: theme.textPrimary,
  glassBorder: theme.cardBorder,
};

const TIME_OF_DAY_ORDER: Record<string, number> = {
  morning: 0, afternoon: 1, evening: 2, night: 3,
};

type MetricKey = 'mood' | 'energy' | 'stress';

interface MetricConfig {
  key: MetricKey;
  label: string;
  color: string;
  yLabels: string[];
}

const METRICS: MetricConfig[] = [
  { key: 'mood', label: 'Mood', color: PALETTE.gold, yLabels: ['Low', '', 'Mid', '', 'High'] },
  { key: 'energy', label: 'Energy', color: PALETTE.silverBlue, yLabels: ['Low', '', 'Mid', '', 'High'] },
  { key: 'stress', label: 'Stress', color: PALETTE.copper, yLabels: ['Low', '', 'Mid', '', 'High'] },
];

const padding = { top: 20, right: 20, bottom: 35, left: 20 };

export default function CheckInTrendGraph({
  checkIns,
  width = Dimensions.get('window').width - 40,
  height = 200,
}: {
  checkIns: DailyCheckIn[];
  width?: number;
  height?: number;
}) {
  const [activeMetric, setActiveMetric] = useState<MetricKey>('mood');
  const [scrubIndex, setScrubIndex] = useState<number | null>(null);
  const lastScrubRef = useRef<number>(-1);
  const metric = METRICS.find(m => m.key === activeMetric) ?? METRICS[0];

  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const sorted = useMemo(() => {
    return [...checkIns]
      .sort((a, b) => a.date.localeCompare(b.date) || (TIME_OF_DAY_ORDER[a.timeOfDay] ?? 0) - (TIME_OF_DAY_ORDER[b.timeOfDay] ?? 0))
      .slice(-12);
  }, [checkIns]);

  const points = useMemo(() => {
    if (sorted.length === 0) return [];
    return sorted.map((ci, i) => {
      const x = padding.left + (sorted.length === 1 ? chartW / 2 : (i / (sorted.length - 1)) * chartW);
      const extract = () => {
        if (activeMetric === 'mood') return ci.moodScore;
        const map: any = { low: 2, medium: 5, high: 9 };
        return activeMetric === 'energy' ? map[ci.energyLevel] : map[ci.stressLevel];
      };
      const val = extract();
      const y = padding.top + chartH - ((val - 1) / 9) * chartH;
      const dayIdx = parseLocalDate(ci.date).getDay();
      const label = ['Su','M','Tu','W','Th','F','Sa'][dayIdx];
      const tag = ci.tags?.[0] ?? null;
      return { x, y, label, score: val, tag };
    });
  }, [sorted, activeMetric, chartW, chartH]);

  // ── Scrub gesture ──
  const findClosestPoint = useCallback((touchX: number) => {
    if (points.length === 0) return -1;
    let closest = 0;
    let minDist = Math.abs(points[0].x - touchX);
    for (let i = 1; i < points.length; i++) {
      const dist = Math.abs(points[i].x - touchX);
      if (dist < minDist) {
        minDist = dist;
        closest = i;
      }
    }
    return closest;
  }, [points]);

  const chartLayoutRef = useRef({ x: 0, y: 0 });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        const touchX = e.nativeEvent.locationX;
        const idx = findClosestPoint(touchX);
        if (idx >= 0) {
          setScrubIndex(idx);
          lastScrubRef.current = idx;
          Haptics.selectionAsync().catch(() => {});
        }
      },
      onPanResponderMove: (e) => {
        const touchX = e.nativeEvent.locationX;
        const idx = findClosestPoint(touchX);
        if (idx >= 0 && idx !== lastScrubRef.current) {
          setScrubIndex(idx);
          lastScrubRef.current = idx;
          Haptics.selectionAsync().catch(() => {});
        }
      },
      onPanResponderRelease: () => {
        setScrubIndex(null);
        lastScrubRef.current = -1;
      },
      onPanResponderTerminate: () => {
        setScrubIndex(null);
        lastScrubRef.current = -1;
      },
    })
  ).current;

  const linePath = useMemo(() => {
    if (points.length < 2) return '';
    let path = `M${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const cpX = (points[i].x + points[i + 1].x) / 2;
      path += ` C${cpX},${points[i].y} ${cpX},${points[i+1].y} ${points[i+1].x},${points[i+1].y}`;
    }
    return path;
  }, [points]);

  const areaPath = useMemo(() => {
    if (points.length < 2) return '';
    return `${linePath} L${points[points.length-1].x},${padding.top + chartH} L${points[0].x},${padding.top + chartH} Z`;
  }, [linePath, points, chartH]);

  if (checkIns.length < 2) {
    return (
      <View style={[styles.emptyCard, { width }]}>
        <Ionicons name="pulse" size={32} color={theme.textSecondary} />
        <Text style={styles.emptyText}>Add more check-ins to reveal trends</Text>
      </View>
    );
  }

  return (
    <View style={{ width }}>
      {/* Metric Tabs */}
      <View style={styles.tabBar}>
        {METRICS.map(m => (
          <Pressable key={m.key} onPress={() => setActiveMetric(m.key)} style={[
            styles.tab,
            activeMetric === m.key && {
              backgroundColor: `${m.color}18`,
              borderColor: `${m.color}55`,
            },
          ]}>
            <Text style={[styles.tabText, activeMetric === m.key && { color: m.color }]}>{m.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* Chart Panel */}
      <View style={styles.chartContainer} {...panResponder.panHandlers}>
        <Canvas style={{ width, height }}>
          {/* Guidelines */}
          {[0, 0.5, 1].map(p => (
            <SkiaLine 
              key={p} 
              p1={vec(padding.left, padding.top + p * chartH)} 
              p2={vec(padding.left + chartW, padding.top + p * chartH)} 
              color="rgba(255,255,255,0.06)" 
              strokeWidth={1} 
            />
          ))}

          <Path path={areaPath} style="fill">
            <SkiaGradient
              start={vec(0, padding.top)}
              end={vec(0, padding.top + chartH)}
              colors={[`${metric.color}4D`, `${metric.color}00`]} 
            />
          </Path>
          <Path path={linePath} color={metric.color} style="stroke" strokeWidth={2.5} strokeJoin="round" />

          {points.map((pt, i) => (
            <Circle key={i} cx={pt.x} cy={pt.y} r={scrubIndex === i ? 6 : 3.5} color={metric.color} />
          ))}

          {/* Scrub indicator line */}
          {scrubIndex !== null && points[scrubIndex] && (
            <SkiaLine
              p1={vec(points[scrubIndex].x, padding.top)}
              p2={vec(points[scrubIndex].x, padding.top + chartH)}
              color={`${metric.color}55`}
              strokeWidth={1}
            />
          )}
        </Canvas>

        {/* Scrub tooltip */}
        {scrubIndex !== null && points[scrubIndex] && (
          <View
            style={[
              styles.tooltip,
              {
                left: Math.max(8, Math.min(points[scrubIndex].x - 50, width - 108)),
                top: Math.max(2, points[scrubIndex].y - 44),
              },
            ]}
          >
            <Text style={styles.tooltipScore}>
              {metric.label}: {points[scrubIndex].score.toFixed(1)}
            </Text>
            {points[scrubIndex].tag && (
              <Text style={styles.tooltipTag}>{points[scrubIndex].tag}</Text>
            )}
          </View>
        )}

        {points.map((pt, i) => (
          <Text 
            key={`l-${i}`} 
            style={{
              position: 'absolute',
              left: pt.x - 15,
              top: padding.top + chartH + 10,
              width: 30,
              textAlign: 'center',
              fontSize: 10,
              color: theme.textMuted,
              fontWeight: '600'
            }}
          >
            {pt.label}
          </Text>
        ))}

        <View style={styles.yAxis}>
          {metric.yLabels.map((l, i) => <Text key={i} style={styles.yLabel}>{l}</Text>)}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    backgroundColor: 'transparent',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  chartContainer: {
    borderRadius: 20,
    backgroundColor: 'rgba(14,24,48,0.32)',
    borderWidth: 1,
    borderColor: theme.cardBorder,
    overflow: 'hidden',
  },
  yAxis: { position: 'absolute', right: 10, top: padding.top, height: 145, justifyContent: 'space-between', alignItems: 'flex-end' },
  yLabel: {
    fontSize: 9,
    color: theme.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  emptyCard: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    backgroundColor: 'rgba(14,24,48,0.32)',
  },
  emptyText: { color: theme.textMuted, fontSize: 14, marginTop: 12, fontStyle: 'italic' },
  tooltip: {
    position: 'absolute',
    backgroundColor: 'rgba(10,18,36,0.92)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 100,
    alignItems: 'center',
  },
  tooltipScore: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tooltipTag: {
    fontSize: 11,
    color: 'rgba(226,232,240,0.7)',
    marginTop: 2,
  },
});
