// app/(tabs)/mood.tsx
// MySky — Mood Tab: slider check-in + pattern graphs

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  PanResponder,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter, Href } from 'expo-router';
import { useFocusEffect } from '@react-navigation/core';
import Svg, {
  Path,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
  Circle,
} from 'react-native-svg';

import { theme } from '../../constants/theme';
import StarField from '../../components/ui/StarField';
import { localDb } from '../../services/storage/localDb';
import { AstrologyCalculator } from '../../services/astrology/calculator';
import { NatalChart } from '../../services/astrology/types';
import { usePremium } from '../../context/PremiumContext';
import { CheckInService, CheckInInput, TIME_OF_DAY_LABELS, TIME_OF_DAY_ORDER } from '../../services/patterns/checkInService';
import { DailyCheckIn, ThemeTag, EnergyLevel, StressLevel, TimeOfDay } from '../../services/patterns/types';
import { logger } from '../../utils/logger';
import type { TimeOfDayMetricInsight, TimeOfDayBucket } from '../../utils/insightsEngine';

const { width: SCREEN_W } = Dimensions.get('window');
// card padding (16) × 2 + scroll horizontal padding (16) × 2 = 64
const GRAPH_W = SCREEN_W - 64;
const THUMB = 22;

// ─── Types ────────────────────────────────────────────────────────────────────

type TimeRange = '7d' | '30d' | '90d' | 'all';

// ─── Constants ────────────────────────────────────────────────────────────────

// Influence tags — what shaped your day (max 3)
const INFLUENCE_TAGS: ThemeTag[] = [
  'sleep', 'work', 'social', 'relationships', 'conflict', 'health',
  'movement', 'nature', 'alone_time', 'finances',
  'weather', 'food', 'screens', 'kids', 'productivity', 'substances', 'intimacy',
];

const INFLUENCE_LABELS: Record<string, string> = {
  sleep: '😴 Sleep', work: '💼 Work', social: '👥 Social',
  relationships: '💞 Relationships', conflict: '⚡ Conflict', health: '🏥 Health',
  movement: '🏃 Movement', nature: '🌿 Nature',
  alone_time: '🧘 Alone time',
  finances: '💰 Finances', weather: '🌦️ Weather', food: '🍽️ Food',
  screens: '📱 Screens', kids: '👶 Kids', productivity: '✅ Productivity',
  substances: '🍷 Substances', intimacy: '🔥 Intimacy',
};

// Emotional quality — optional premium single-select
const QUALITY_OPTIONS: ThemeTag[] = [
  'eq_calm', 'eq_anxious', 'eq_focused', 'eq_disconnected', 'eq_hopeful',
  'eq_irritable', 'eq_grounded', 'eq_scattered', 'eq_heavy', 'eq_open',
];

const QUALITY_LABELS: Record<string, string> = {
  eq_calm: '😌 Calm', eq_anxious: '😰 Anxious', eq_focused: '🎯 Focused',
  eq_disconnected: '🌫️ Disconnected', eq_hopeful: '🌅 Hopeful',
  eq_irritable: '😤 Irritable', eq_grounded: '🌳 Grounded',
  eq_scattered: '🌀 Scattered', eq_heavy: '🪨 Heavy', eq_open: '🌸 Open',
};

// Backward-compat label lookup for top-tags display
const ALL_TAG_LABELS: Record<string, string> = {
  ...INFLUENCE_LABELS,
  ...QUALITY_LABELS,
  confidence: '💪 Confidence', money: '💰 Money',
  family: '👨‍👩‍👧 Family', creativity: '🎨 Creativity',
  boundaries: '🛡️ Boundaries', career: '📈 Career', anxiety: '😰 Anxiety',
  joy: '😊 Joy', grief: '🥀 Grief', clarity: '💎 Clarity',
  overwhelm: '😵 Overwhelm', loneliness: '🌑 Loneliness', gratitude: '🙏 Gratitude',
};

const COLORS = {
  mood:   '#c9a962',
  energy: '#6fb3d3',
  stress: '#e07b7b',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sliderToLevel(v: number): 'low' | 'medium' | 'high' {
  if (v <= 3) return 'low';
  if (v <= 7) return 'medium';
  return 'high';
}

function levelToNum(level: 'low' | 'medium' | 'high'): number {
  return level === 'low' ? 2 : level === 'medium' ? 5 : 8;
}

function numToLevelLabel(n: number): string {
  if (n < 3.5) return 'Low';
  if (n < 6.5) return 'Medium';
  return 'High';
}

/** Filter, sort ascending by date, and cap at 30 points for graphing. */
function filterByRange(checkIns: DailyCheckIn[], range: TimeRange): DailyCheckIn[] {
  let filtered: DailyCheckIn[];
  if (range === 'all') {
    filtered = checkIns;
  } else {
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    filtered = checkIns.filter(c => c.date >= cutoffStr);
  }
  return [...filtered]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30);
}

function computeAverages(cis: DailyCheckIn[]) {
  if (!cis.length) return { mood: 0, energy: 0, stress: 0 };
  const mood   = cis.reduce((s, c) => s + c.moodScore, 0) / cis.length;
  const energy = cis.reduce((s, c) => s + levelToNum(c.energyLevel), 0) / cis.length;
  const stress = cis.reduce((s, c) => s + levelToNum(c.stressLevel), 0) / cis.length;
  return { mood, energy, stress };
}

function computeTopTags(cis: DailyCheckIn[], limit = 5): { tag: ThemeTag; count: number }[] {
  const counts: Partial<Record<ThemeTag, number>> = {};
  for (const ci of cis) {
    for (const tag of (ci.tags ?? [])) {
      counts[tag] = (counts[tag] ?? 0) + 1;
    }
  }
  return (Object.entries(counts) as [ThemeTag, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag, count]) => ({ tag, count }));
}

function formatToday(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'short', day: 'numeric',
  });
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── MetricSlider ─────────────────────────────────────────────────────────────

interface SliderProps {
  question: string;
  value: number;
  onChange: (v: number) => void;
  color: string;
  anchors: [string, string, string];
  min?: number;
  max?: number;
}

function MetricSlider({ question, value, onChange, color, anchors, min = 1, max = 10 }: SliderProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const trackWidthRef = useRef(0);
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const startValueRef = useRef(value);

  useEffect(() => { valueRef.current = value; }, [value]);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        const tw = trackWidthRef.current;
        if (tw > 0) {
          // Tap-to-position: jump to tapped location
          const pct = Math.min(1, Math.max(0, e.nativeEvent.locationX / tw));
          const tapped = Math.round(min + pct * (max - min));
          startValueRef.current = tapped;
          onChangeRef.current(tapped);
          Haptics.selectionAsync().catch(() => {});
        } else {
          startValueRef.current = valueRef.current;
        }
      },
      onPanResponderMove: (_, gs) => {
        const tw = trackWidthRef.current;
        if (tw === 0) return;
        const deltaPct = gs.dx / tw;
        const raw = startValueRef.current + deltaPct * (max - min);
        const clamped = Math.round(Math.min(max, Math.max(min, raw)));
        if (clamped !== valueRef.current) {
          Haptics.selectionAsync().catch(() => {});
          onChangeRef.current(clamped);
        }
      },
    })
  ).current;

  const fillPct = (value - min) / (max - min);
  const thumbLeft = trackWidth > 0 ? fillPct * trackWidth - THUMB / 2 : 0;

  return (
    <View
      style={sS.container}
      accessible={true}
      accessibilityRole="adjustable"
      accessibilityLabel={question}
      accessibilityValue={{ min, max, now: value, text: `${value} out of ${max}` }}
      accessibilityActions={[
        { name: 'increment', label: 'Increase' },
        { name: 'decrement', label: 'Decrease' },
      ]}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === 'increment') {
          const next = Math.min(max, value + 1);
          onChange(next);
        } else if (event.nativeEvent.actionName === 'decrement') {
          const next = Math.max(min, value - 1);
          onChange(next);
        }
      }}
    >
      <Text style={sS.question}>{question}</Text>
      <View style={sS.labelRow}>
        <Text style={[sS.val, { color }]}>
          {value}<Text style={sS.valMax}> / 10</Text>
        </Text>
      </View>
      <View
        style={sS.trackWrap}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          setTrackWidth(w);
          trackWidthRef.current = w;
        }}
        {...panResponder.panHandlers}
      >
        <View style={sS.trackBg} />
        <View style={[sS.trackFill, { width: fillPct * trackWidth, backgroundColor: color }]} />
        {trackWidth > 0 && (
          <View style={[sS.thumb, { left: thumbLeft, borderColor: color }]} />
        )}
      </View>
      <View style={sS.anchorRow}>
        <Text style={sS.anchor}>{anchors[0]}</Text>
        <Text style={sS.anchor}>{anchors[1]}</Text>
        <Text style={sS.anchor}>{anchors[2]}</Text>
      </View>
    </View>
  );
}

const sS = StyleSheet.create({
  container: { marginBottom: 18 },
  question: { color: theme.textSecondary, fontSize: 13, fontWeight: '500', marginBottom: 6 },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 8,
  },
  val: { fontSize: 16, fontWeight: '800' },
  valMax: { fontSize: 12, color: theme.textMuted, fontWeight: '400' },
  anchorRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  anchor: { color: theme.textMuted, fontSize: 10, fontWeight: '500' },
  trackWrap: {
    height: THUMB,
    justifyContent: 'center',
    position: 'relative',
  },
  trackBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  trackFill: {
    position: 'absolute',
    left: 0,
    height: 4,
    borderRadius: 2,
  },
  thumb: {
    position: 'absolute',
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: theme.background,
    borderWidth: 2,
    top: 0,
  },
});

// ─── LineGraph ────────────────────────────────────────────────────────────────

interface GraphProps {
  data: number[];
  minY: number;
  maxY: number;
  color: string;
  width: number;
  height: number;
  gradId: string;
}

function LineGraph({ data, minY: absMin, maxY: absMax, color, width, height, gradId }: GraphProps) {
  const PAD = { top: 10, bottom: 10, left: 4, right: 4 };
  const gW = width - PAD.left - PAD.right;
  const gH = height - PAD.top - PAD.bottom;

  if (data.length < 2) {
    return (
      <View style={{ width, height, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: theme.textMuted, fontSize: 12 }}>Not enough data yet</Text>
      </View>
    );
  }

  // Auto-scale to actual data range with padding so trends are prominent
  const dataMin = Math.min(...data);
  const dataMax = Math.max(...data);
  const dataSpan = dataMax - dataMin;
  // Add 20% buffer above/below, but clamp to absolute bounds
  const buf = Math.max(dataSpan * 0.25, 0.5);
  const minY = Math.max(absMin, Math.floor(dataMin - buf));
  const maxY = Math.min(absMax, Math.ceil(dataMax + buf));
  const range = maxY - minY || 1;

  const pts = data.map((v, i) => ({
    x: PAD.left + (i / (data.length - 1)) * gW,
    y: PAD.top + gH - ((v - minY) / range) * gH,
  }));

  // Smooth cubic bezier through points
  let linePath = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1];
    const c = pts[i];
    const cpX = (p.x + c.x) / 2;
    linePath += ` C ${cpX} ${p.y}, ${cpX} ${c.y}, ${c.x} ${c.y}`;
  }

  const last = pts[pts.length - 1];
  const areaPath =
    linePath +
    ` L ${last.x} ${PAD.top + gH} L ${pts[0].x} ${PAD.top + gH} Z`;

  return (
    <Svg width={width} height={height}>
      <Defs>
        <SvgGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={color} stopOpacity={0.45} />
          <Stop offset="100%" stopColor={color} stopOpacity={0.03} />
        </SvgGradient>
      </Defs>
      <Path d={areaPath} fill={`url(#${gradId})`} />
      <Path d={linePath} stroke={color} strokeWidth={2.5} fill="none" strokeLinejoin="round" />
      <Circle cx={last.x} cy={last.y} r={4} fill={color} />
    </Svg>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ icon, title, delay }: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  delay: number;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(600)} style={styles.sectionRow}>
      <Ionicons name={icon} size={18} color={theme.primary} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </Animated.View>
  );
}

function AvgBadge({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.avgBadge}>
      <Text style={[styles.avgValue, { color }]}>{value}</Text>
      <Text style={styles.avgLabel}>{label}</Text>
    </View>
  );
}

function GraphLabel({ label, color }: { label: string; color: string }) {
  return (
    <View style={styles.graphLabelRow}>
      <View style={[styles.graphDot, { backgroundColor: color }]} />
      <Text style={styles.graphLabelTxt}>{label}</Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function MoodScreen() {
  const router = useRouter();
  const { isPremium } = usePremium();

  // Chart state
  const [loading, setLoading] = useState(true);
  const [hasChart, setHasChart] = useState(false);
  const [userName, setUserName] = useState('');
  const [userChart, setUserChart] = useState<NatalChart | null>(null);
  const [chartId, setChartId] = useState('');

  // Check-in form
  const [moodSlider, setMoodSlider] = useState(5);
  const [energySlider, setEnergySlider] = useState(5);
  const [stressSlider, setStressSlider] = useState(5);
  const [selectedTags, setSelectedTags] = useState<ThemeTag[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [selectedQuality, setSelectedQuality] = useState<ThemeTag | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeOfDay>(CheckInService.getCurrentTimeSlot());
  const [completedSlots, setCompletedSlots] = useState<TimeOfDay[]>([]);
  const [todayCheckIns, setTodayCheckIns] = useState<DailyCheckIn[]>([]);

  // History
  const [allCheckIns, setAllCheckIns] = useState<DailyCheckIn[]>([]);
  const [todayCheckIn, setTodayCheckIn] = useState<DailyCheckIn | null>(null);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        try {
          setLoading(true);
          const charts = await localDb.getCharts();
          if (!charts?.length) { setHasChart(false); return; }
          setHasChart(true);

          const saved = charts[0];
          setUserName(saved?.name ?? '');
          const cId = saved?.id ?? '';
          setChartId(cId);

          const natal = AstrologyCalculator.generateNatalChart({
            date: saved.birthDate,
            time: saved.birthTime,
            hasUnknownTime: saved.hasUnknownTime,
            place: saved.birthPlace,
            latitude: saved.latitude,
            longitude: saved.longitude,
            timezone: saved.timezone,
            houseSystem: saved.houseSystem,
          });
          setUserChart(natal);

          const existing = await CheckInService.getTodayCheckInForSlot(cId, CheckInService.getCurrentTimeSlot());
          setTodayCheckIn(existing);
          if (existing) {
            setMoodSlider(existing.moodScore);
            setEnergySlider(levelToNum(existing.energyLevel));
            setStressSlider(levelToNum(existing.stressLevel));
            const restoredTags = existing.tags ?? [];
            const eqTag = restoredTags.find((t: string) => t.startsWith('eq_')) as ThemeTag | undefined;
            setSelectedQuality(eqTag ?? null);
            setSelectedTags(restoredTags.filter((t: string) => !t.startsWith('eq_')));
          }

          // Load all today's check-ins and completed slots
          const todayAll = await CheckInService.getTodayCheckIns(cId);
          setTodayCheckIns(todayAll);
          const slots = todayAll.map(c => c.timeOfDay);
          setCompletedSlots(slots);
          setSelectedTimeSlot(CheckInService.getCurrentTimeSlot());

          const all = await CheckInService.getAllCheckIns(cId);
          setAllCheckIns(all);

          const streak = await CheckInService.getCurrentStreak(cId);
          setCurrentStreak(streak);
        } catch (e) {
          logger.error('[Mood] load failed:', e);
        } finally {
          setLoading(false);
        }
      };
      load();
    }, [])
  );

  const handleSave = useCallback(async () => {
    if (!userChart || !chartId || saving) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setSaving(true);
    try {
      const allTags: ThemeTag[] = [...selectedTags];
      if (selectedQuality) allTags.push(selectedQuality);
      const input: CheckInInput = {
        moodScore: moodSlider,
        energyLevel: sliderToLevel(energySlider) as EnergyLevel,
        stressLevel: sliderToLevel(stressSlider) as StressLevel,
        tags: allTags,
        timeOfDay: selectedTimeSlot,
      };
      const result = await CheckInService.saveCheckIn(input, userChart, chartId);
      setTodayCheckIn(result);
      setSavedAt(new Date());

      // Refresh today's check-ins and completed slots
      const todayAll = await CheckInService.getTodayCheckIns(chartId);
      setTodayCheckIns(todayAll);
      setCompletedSlots(todayAll.map(c => c.timeOfDay));

      const all = await CheckInService.getAllCheckIns(chartId);
      setAllCheckIns(all);

      const streak = await CheckInService.getCurrentStreak(chartId);
      setCurrentStreak(streak);

      setTimeout(() => setSavedAt(null), 2500);
    } catch (e) {
      logger.error('[Mood] save failed:', e);
    } finally {
      setSaving(false);
    }
  }, [userChart, chartId, moodSlider, energySlider, stressSlider, selectedTags, selectedQuality, selectedTimeSlot, saving]);

  // ── Derived ────────────────────────────────────────────────────────────────

  const filteredCheckIns = useMemo(
    () => filterByRange(allCheckIns, timeRange),
    [allCheckIns, timeRange]
  );

  const moodData   = useMemo(() => filteredCheckIns.map(c => c.moodScore), [filteredCheckIns]);
  const energyData = useMemo(() => filteredCheckIns.map(c => levelToNum(c.energyLevel)), [filteredCheckIns]);
  const stressData = useMemo(() => filteredCheckIns.map(c => levelToNum(c.stressLevel)), [filteredCheckIns]);
  const avgs       = useMemo(() => computeAverages(filteredCheckIns), [filteredCheckIns]);
  const topTags    = useMemo(() => computeTopTags(filteredCheckIns), [filteredCheckIns]);

  /** Time-of-day breakdown from check-in data */
  const todInsights = useMemo(() => {
    if (filteredCheckIns.length < 4) return null;

    const data: Record<string, { moods: number[]; energies: number[]; stresses: number[] }> = {
      Morning: { moods: [], energies: [], stresses: [] },
      Afternoon: { moods: [], energies: [], stresses: [] },
      Evening: { moods: [], energies: [], stresses: [] },
      Night: { moods: [], energies: [], stresses: [] },
    };
    const todMap: Record<string, string> = {
      morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening', night: 'Night',
    };

    for (const c of filteredCheckIns) {
      const bucket = c.timeOfDay ? (todMap[c.timeOfDay] ?? 'Morning') : 'Morning';
      data[bucket].moods.push(c.moodScore);
      data[bucket].energies.push(levelToNum(c.energyLevel));
      data[bucket].stresses.push(levelToNum(c.stressLevel));
    }

    const buckets: TimeOfDayBucket[] = (['Morning', 'Afternoon', 'Evening', 'Night'] as const)
      .filter(l => data[l].moods.length >= 1)
      .map(l => ({
        label: l,
        count: data[l].moods.length,
        avgMood: parseFloat((data[l].moods.reduce((a, b) => a + b, 0) / data[l].moods.length).toFixed(1)),
        avgEnergy: parseFloat((data[l].energies.reduce((a, b) => a + b, 0) / data[l].energies.length).toFixed(1)),
        avgStress: parseFloat((data[l].stresses.reduce((a, b) => a + b, 0) / data[l].stresses.length).toFixed(1)),
      }));

    if (buckets.length < 2) return null;

    // Build per-metric insights
    const metrics: Array<{ key: 'mood' | 'energy' | 'stress'; emoji: string; label: string; extract: (b: TimeOfDayBucket) => number }> = [
      { key: 'mood', emoji: '💛', label: 'Mood', extract: b => b.avgMood },
      { key: 'energy', emoji: '⚡', label: 'Energy', extract: b => b.avgEnergy },
      { key: 'stress', emoji: '🔥', label: 'Stress', extract: b => b.avgStress },
    ];

    const metricInsights: TimeOfDayMetricInsight[] = [];
    for (const m of metrics) {
      const sorted = [...buckets].sort((a, b) => m.extract(b) - m.extract(a));
      const high = sorted[0];
      const low = sorted[sorted.length - 1];
      const spread = m.extract(high) - m.extract(low);
      if (spread < 0.3) continue;

      const hl = high.label.toLowerCase();
      const ll = low.label.toLowerCase();
      let text: string;

      if (m.key === 'mood') {
        text = spread >= 1.0
          ? `Your mood peaks in the ${hl} (${m.extract(high).toFixed(1)}) and is lowest at ${ll} (${m.extract(low).toFixed(1)}).`
          : `You tend to feel best in the ${hl} and lowest at ${ll}.`;
      } else if (m.key === 'energy') {
        text = spread >= 1.0
          ? `Your energy is highest in the ${hl} (${m.extract(high).toFixed(1)}) and lowest in the ${ll} (${m.extract(low).toFixed(1)}).`
          : `You tend to have the most energy in the ${hl} and least in the ${ll}.`;
      } else {
        text = spread >= 1.0
          ? `Stress peaks in the ${hl} (${m.extract(high).toFixed(1)}) and is lowest in the ${ll} (${m.extract(low).toFixed(1)}).`
          : `Stress tends to be higher in the ${hl} and lower in the ${ll}.`;
      }

      metricInsights.push({
        metric: m.key, emoji: m.emoji, label: m.label, insight: text,
        highBucket: high.label, lowBucket: low.label,
        highValue: m.extract(high), lowValue: m.extract(low), spread,
      });
    }

    metricInsights.sort((a, b) => b.spread - a.spread);
    return { buckets, metricInsights };
  }, [filteredCheckIns]);

  const dateLabels = useMemo((): [string, string] | undefined => {
    if (filteredCheckIns.length < 2) return undefined;
    return [
      formatDate(filteredCheckIns[0].date),
      formatDate(filteredCheckIns[filteredCheckIns.length - 1].date),
    ];
  }, [filteredCheckIns]);

  // ── No-chart state ────────────────────────────────────────────────────────

  if (!loading && !hasChart) {
    return (
      <View style={styles.container}>
        <StarField starCount={28} />
        <SafeAreaView edges={['top']} style={styles.flex}>
          <Animated.View entering={FadeInDown.delay(80).duration(600)} style={styles.header}>
            <Text style={styles.title}>Mood</Text>
            <Text style={styles.subtitle}>Track how you feel, discover your patterns.</Text>
          </Animated.View>
          <ScrollView
            style={styles.flex}
            contentContainerStyle={[styles.content, { paddingBottom: 32 }]}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View entering={FadeInDown.delay(180).duration(600)}>
              <LinearGradient colors={['rgba(30,45,71,0.65)', 'rgba(26,39,64,0.45)']} style={styles.card}>
                <Ionicons name="sparkles" size={32} color={theme.primary} style={{ marginBottom: 12 }} />
                <Text style={styles.heroText}>Create your chart first</Text>
                <Text style={[styles.body, { marginTop: 8 }]}>
                  Your chart personalizes your check-ins and unlocks pattern insights.
                </Text>
                <Pressable
                  style={[styles.primaryBtn, { marginTop: 16 }]}
                  onPress={() => { Haptics.selectionAsync().catch(() => {}); router.push('/(tabs)/home' as Href); }}
                  accessibilityRole="button"
                  accessibilityLabel="Create Chart"
                >
                  <Ionicons name="add-circle-outline" size={16} color={theme.primary} />
                  <Text style={styles.primaryBtnTxt}>Create Chart</Text>
                </Pressable>
              </LinearGradient>
            </Animated.View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // ── Loading state ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.container}>
        <StarField starCount={28} />
        <SafeAreaView edges={['top']} style={styles.flex}>
          <View style={styles.centered}>
            <Ionicons name="sparkles" size={28} color={theme.primary} />
            <Text style={[styles.body, { marginTop: 12 }]}>Loading…</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <StarField starCount={60} />
      <SafeAreaView edges={['top']} style={styles.flex}>

        {/* Header */}
        <Animated.View entering={FadeInDown.delay(60).duration(600)} style={styles.header}>
          <Text style={styles.title}>Mood</Text>
          <Text style={styles.subtitle}>
            {userName || 'Daily check-in'} · {formatToday()}
          </Text>
        </Animated.View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.content, { paddingBottom: 32 }]}
          showsVerticalScrollIndicator={false}
        >

          {/* Streak row */}
          {currentStreak > 0 && (
            <Animated.View entering={FadeInDown.delay(80).duration(500)} style={styles.streakRow}>
              <Ionicons name="flame-outline" size={14} color={theme.primary} />
              <Text style={styles.streakTxt}>{currentStreak} day streak</Text>
              {allCheckIns.length > 0 && (
                <>
                  <Text style={styles.dot}> · </Text>
                  <Text style={styles.streakTxt}>{allCheckIns.length} total</Text>
                </>
              )}
            </Animated.View>
          )}

          {/* ═══ Quick Check-In ═══ */}
          <SectionLabel icon="heart-outline" title="Quick Check-In" delay={100} />
          <Animated.View entering={FadeInDown.delay(120).duration(600)}>
            <LinearGradient
              colors={['rgba(30,45,71,0.65)', 'rgba(26,39,64,0.45)']}
              style={styles.card}
            >
              {/* Save confirmation */}
              {savedAt && (
                <View style={styles.savedBanner}>
                  <Ionicons name="checkmark-circle" size={16} color={theme.energy} />
                  <Text style={styles.savedTxt}>Check-in saved. Patterns updated.</Text>
                </View>
              )}

              {/* Time-of-day selector */}
              <Text style={[styles.tagsLabel, { marginBottom: 8 }]}>
                When are you checking in?
              </Text>
              <View style={styles.timeSlotRow}>
                {TIME_OF_DAY_ORDER.map(slot => {
                  const info = TIME_OF_DAY_LABELS[slot];
                  const isSelected = selectedTimeSlot === slot;
                  const isCompleted = completedSlots.includes(slot);
                  const isCurrent = CheckInService.getCurrentTimeSlot() === slot;
                  return (
                    <Pressable
                      key={slot}
                      style={[
                        styles.timeSlotChip,
                        isSelected && styles.timeSlotChipOn,
                        isCompleted && !isSelected && styles.timeSlotChipDone,
                      ]}
                      onPress={() => {
                        Haptics.selectionAsync().catch(() => {});
                        setSelectedTimeSlot(slot);
                        // Load existing data for this slot if it exists
                        const existing = todayCheckIns.find(c => c.timeOfDay === slot);
                        if (existing) {
                          setMoodSlider(existing.moodScore);
                          setEnergySlider(levelToNum(existing.energyLevel));
                          setStressSlider(levelToNum(existing.stressLevel));
                          const restoredTags = existing.tags ?? [];
                          const eqTag = restoredTags.find((t: string) => t.startsWith('eq_')) as ThemeTag | undefined;
                          setSelectedQuality(eqTag ?? null);
                          setSelectedTags(restoredTags.filter((t: string) => !t.startsWith('eq_')));
                          setTodayCheckIn(existing);
                        } else {
                          // Reset form for new time slot
                          setMoodSlider(5);
                          setEnergySlider(5);
                          setStressSlider(5);
                          setSelectedTags([]);
                          setSelectedQuality(null);
                          setTodayCheckIn(null);
                        }
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`${info.label} check-in${isCompleted ? ' (completed)' : ''}`}
                      accessibilityState={{ selected: isSelected }}
                    >
                      <Text style={styles.timeSlotEmoji}>{info.emoji}</Text>
                      <Text style={[
                        styles.timeSlotLabel,
                        isSelected && styles.timeSlotLabelOn,
                        isCompleted && !isSelected && styles.timeSlotLabelDone,
                      ]}>
                        {info.label}
                      </Text>
                      {isCompleted && (
                        <Ionicons name="checkmark-circle" size={12} color={isSelected ? theme.primary : theme.energy} style={{ marginTop: 2 }} />
                      )}
                      {isCurrent && !isCompleted && (
                        <View style={styles.currentDot} />
                      )}
                    </Pressable>
                  );
                })}
              </View>

              {/* Today's check-in summary */}
              {todayCheckIns.length > 0 && !savedAt && (
                <View style={styles.todayNotice}>
                  <Ionicons name="time-outline" size={13} color={theme.textMuted} />
                  <Text style={styles.todayNoticeTxt}>
                    {completedSlots.includes(selectedTimeSlot)
                      ? `${TIME_OF_DAY_LABELS[selectedTimeSlot].label} check-in logged — update below`
                      : `${todayCheckIns.length}/4 check-in${todayCheckIns.length !== 1 ? 's' : ''} today`}
                  </Text>
                </View>
              )}

              {/* Sliders */}
              <MetricSlider
                question="How are you feeling emotionally?"
                value={moodSlider} onChange={setMoodSlider} color={COLORS.mood}
                anchors={['Very low', 'Neutral', 'Excellent']}
              />
              <MetricSlider
                question="How is your energy right now?"
                value={energySlider} onChange={setEnergySlider} color={COLORS.energy}
                anchors={['Exhausted', 'Steady', 'Energized']}
              />
              <MetricSlider
                question="How activated or stressed do you feel?"
                value={stressSlider} onChange={setStressSlider} color={COLORS.stress}
                anchors={['Calm', 'Alert', 'Overwhelmed']}
              />

              {/* Influence tags */}
              <Text style={styles.tagsLabel}>What shaped your day? <Text style={styles.tagsMuted}>(pick up to 3)</Text></Text>
              <View style={styles.tagRow}>
                {INFLUENCE_TAGS.map(tag => (
                  <Pressable
                    key={tag}
                    style={[styles.tagChip, selectedTags.includes(tag) && styles.tagChipOn]}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      setSelectedTags(prev =>
                        prev.includes(tag)
                          ? prev.filter(t => t !== tag)
                          : prev.length >= 3 ? prev : [...prev, tag]
                      );
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={INFLUENCE_LABELS[tag]}
                    accessibilityState={{ selected: selectedTags.includes(tag) }}
                  >
                    <Text style={[styles.tagTxt, selectedTags.includes(tag) && styles.tagTxtOn]}>
                      {INFLUENCE_LABELS[tag]}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Premium: Emotional Quality */}
              {isPremium && (
                <>
                  <Text style={[styles.tagsLabel, { marginTop: 4 }]}>
                    What best describes today? <Text style={styles.tagsMuted}>(optional)</Text>
                  </Text>
                  <View style={styles.tagRow}>
                    {QUALITY_OPTIONS.map(q => (
                      <Pressable
                        key={q}
                        style={[styles.qualityChip, selectedQuality === q && styles.qualityChipOn]}
                        onPress={() => {
                          Haptics.selectionAsync().catch(() => {});
                          setSelectedQuality(prev => prev === q ? null : q);
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={QUALITY_LABELS[q]}
                        accessibilityState={{ selected: selectedQuality === q }}
                      >
                        <Text style={[styles.qualityTxt, selectedQuality === q && styles.qualityTxtOn]}>
                          {QUALITY_LABELS[q]}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              )}

              {/* Save button */}
              <Pressable
                style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={saving}
                accessibilityRole="button"
                accessibilityLabel={saving ? 'Saving check-in' : completedSlots.includes(selectedTimeSlot) ? `Update ${TIME_OF_DAY_LABELS[selectedTimeSlot].label} Check-In` : `Save ${TIME_OF_DAY_LABELS[selectedTimeSlot].label} Check-In`}
                accessibilityState={{ disabled: saving }}
              >
                <LinearGradient
                  colors={['rgba(201,169,98,0.22)', 'rgba(201,169,98,0.12)']}
                  style={styles.saveBtnInner}
                >
                  <Ionicons
                    name={saving ? 'hourglass-outline' : 'checkmark-circle-outline'}
                    size={18}
                    color={theme.primary}
                  />
                  <Text style={styles.saveBtnTxt}>
                    {saving
                      ? 'Saving…'
                      : completedSlots.includes(selectedTimeSlot)
                        ? `Update ${TIME_OF_DAY_LABELS[selectedTimeSlot].label} Check-In`
                        : `Save ${TIME_OF_DAY_LABELS[selectedTimeSlot].label} Check-In`}
                  </Text>
                </LinearGradient>
              </Pressable>

              <Text style={styles.hint}>Check in up to 4× daily — morning, afternoon, evening, night.</Text>
            </LinearGradient>
          </Animated.View>

          {/* ═══ Energy Reading link ═══ */}
          <Animated.View entering={FadeInDown.delay(180).duration(600)}>
            <Pressable
              onPress={() => { Haptics.selectionAsync().catch(() => {}); router.push('/(tabs)/energy' as Href); }}
              accessibilityRole="button"
              accessibilityLabel="Energy Reading"
            >
              <LinearGradient
                colors={['rgba(25,38,60,0.50)', 'rgba(20,32,50,0.35)']}
                style={[styles.card, { padding: theme.spacing.md }]}
              >
                <View style={styles.linkRow}>
                  <View style={styles.linkLeft}>
                    <Ionicons name="pulse-outline" size={20} color={theme.primary} />
                    <View>
                      <Text style={styles.linkTitle}>Energy Reading</Text>
                      <Text style={styles.linkSub}>Chakra wheel · Domain breakdown · Guidance</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={theme.primary} />
                </View>
              </LinearGradient>
            </Pressable>
          </Animated.View>

          {/* ═══ Your Patterns ═══ */}
          <SectionLabel icon="analytics-outline" title="Your Patterns" delay={200} />

          {isPremium ? (
            <Animated.View entering={FadeInDown.delay(220).duration(600)}>
              <LinearGradient
                colors={['rgba(30,45,71,0.65)', 'rgba(26,39,64,0.45)']}
                style={styles.card}
              >
                {/* Time range selector */}
                <View style={styles.rangeRow}>
                  {(['7d', '30d', '90d', 'all'] as TimeRange[]).map(r => (
                    <Pressable
                      key={r}
                      style={[styles.rangeBtn, timeRange === r && styles.rangeBtnOn]}
                      onPress={() => {
                        Haptics.selectionAsync().catch(() => {});
                        setTimeRange(r);
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`Show ${r === 'all' ? 'all' : r === '7d' ? '7 day' : r === '30d' ? '30 day' : '90 day'} trends`}
                      accessibilityState={{ selected: timeRange === r }}
                    >
                      <Text style={[styles.rangeTxt, timeRange === r && styles.rangeTxtOn]}>
                        {r === 'all' ? 'All' : r.toUpperCase()}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {filteredCheckIns.length < 2 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="hourglass-outline" size={28} color={theme.primary} />
                    <Text style={[styles.body, { textAlign: 'center', marginTop: 10 }]}>
                      {allCheckIns.length === 0
                        ? 'Log your first check-in above to start tracking'
                        : 'Not enough check-ins in this date range'}
                    </Text>
                  </View>
                ) : (
                  <>
                    {/* Date range labels */}
                    {dateLabels && (
                      <View style={styles.dateRow}>
                        <Text style={styles.dateTxt}>{dateLabels[0]}</Text>
                        <Text style={styles.dateTxt}>{dateLabels[1]}</Text>
                      </View>
                    )}

                    {/* Averages row */}
                    <View style={styles.avgsRow}>
                      <AvgBadge label="Avg Mood" value={avgs.mood.toFixed(1)} color={COLORS.mood} />
                      <AvgBadge label="Avg Energy" value={numToLevelLabel(avgs.energy)} color={COLORS.energy} />
                      <AvgBadge label="Avg Stress" value={numToLevelLabel(avgs.stress)} color={COLORS.stress} />
                    </View>

                    {/* Graph: Mood */}
                    <GraphLabel label="Mood" color={COLORS.mood} />
                    <LineGraph
                      data={moodData}
                      minY={1}
                      maxY={10}
                      color={COLORS.mood}
                      width={GRAPH_W}
                      height={60}
                      gradId="grad_mood"
                    />

                    {/* Graph: Energy */}
                    <GraphLabel label="Energy" color={COLORS.energy} />
                    <LineGraph
                      data={energyData}
                      minY={1}
                      maxY={10}
                      color={COLORS.energy}
                      width={GRAPH_W}
                      height={60}
                      gradId="grad_energy"
                    />

                    {/* Graph: Stress */}
                    <GraphLabel label="Stress" color={COLORS.stress} />
                    <LineGraph
                      data={stressData}
                      minY={1}
                      maxY={10}
                      color={COLORS.stress}
                      width={GRAPH_W}
                      height={60}
                      gradId="grad_stress"
                    />

                    {/* Top themes */}
                    {topTags.length > 0 && (
                      <>
                        <Text style={[styles.graphLabelTxt, { marginTop: 12, marginBottom: 6, color: theme.textSecondary }]}>
                          Most Common Themes
                        </Text>
                        {topTags.map(({ tag, count }) => (
                          <View key={tag} style={styles.tagStatRow}>
                            <Text style={styles.tagStatLabel}>{ALL_TAG_LABELS[tag] ?? tag}</Text>
                            <View style={styles.tagStatBar}>
                              <View
                                style={[
                                  styles.tagStatFill,
                                  { width: `${(count / topTags[0].count) * 100}%` },
                                ]}
                              />
                            </View>
                            <Text style={styles.tagStatCount}>{count}×</Text>
                          </View>
                        ))}
                      </>
                    )}

                    {/* Time-of-Day Insights */}
                    {todInsights && todInsights.buckets.length >= 2 && (
                      <>
                        <Text style={[styles.graphLabelTxt, { marginTop: 16, marginBottom: 8, color: theme.textSecondary }]}>
                          🕐 Time of Day Patterns
                        </Text>

                        {/* Bucket overview */}
                        <View style={styles.todBucketRow}>
                          {todInsights.buckets.map(b => {
                            const emoji: Record<string, string> = {
                              Morning: '🌅', Afternoon: '☀️', Evening: '🌆', Night: '🌙',
                            };
                            return (
                              <View key={b.label} style={styles.todBucket}>
                                <Text style={{ fontSize: 16 }}>{emoji[b.label]}</Text>
                                <Text style={styles.todBucketLabel}>{b.label}</Text>
                                <View style={{ gap: 1, alignItems: 'center' }}>
                                  <Text style={[styles.todBucketVal, { color: COLORS.mood }]}>{b.avgMood.toFixed(1)}</Text>
                                  <Text style={[styles.todBucketVal, { color: COLORS.energy }]}>{b.avgEnergy.toFixed(1)}</Text>
                                  <Text style={[styles.todBucketVal, { color: COLORS.stress }]}>{b.avgStress.toFixed(1)}</Text>
                                </View>
                                <Text style={styles.todBucketCount}>{b.count}×</Text>
                              </View>
                            );
                          })}
                        </View>

                        {/* Legend */}
                        <View style={styles.todLegend}>
                          <View style={styles.todLegendItem}>
                            <View style={[styles.todLegendDot, { backgroundColor: COLORS.mood }]} />
                            <Text style={styles.todLegendTxt}>Mood</Text>
                          </View>
                          <View style={styles.todLegendItem}>
                            <View style={[styles.todLegendDot, { backgroundColor: COLORS.energy }]} />
                            <Text style={styles.todLegendTxt}>Energy</Text>
                          </View>
                          <View style={styles.todLegendItem}>
                            <View style={[styles.todLegendDot, { backgroundColor: COLORS.stress }]} />
                            <Text style={styles.todLegendTxt}>Stress</Text>
                          </View>
                        </View>

                        {/* Per-metric insights */}
                        {todInsights.metricInsights.length > 0 && (
                          <View style={styles.todInsightList}>
                            {todInsights.metricInsights.map(mi => (
                              <View key={mi.metric} style={styles.todInsightRow}>
                                <Text style={styles.todInsightEmoji}>{mi.emoji}</Text>
                                <Text style={styles.todInsightText}>{mi.insight}</Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </>
                    )}
                  </>
                )}
              </LinearGradient>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeInDown.delay(220).duration(600)}>
              <Pressable
                onPress={() => { Haptics.selectionAsync().catch(() => {}); router.push('/(tabs)/premium' as Href); }}
                accessibilityRole="button"
                accessibilityLabel="Unlock Patterns"
              >
                <LinearGradient
                  colors={['rgba(201,169,98,0.10)', 'rgba(201,169,98,0.03)']}
                  style={[styles.card, { borderColor: 'rgba(201,169,98,0.2)' }]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(201,169,98,0.12)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 }}>
                      <Ionicons name="sparkles" size={10} color={theme.primary} />
                      <Text style={{ fontSize: 10, fontWeight: '600', color: theme.primary }}>Deeper Sky</Text>
                    </View>
                  </View>

                  {/* Preview of what pattern analysis looks like */}
                  <View style={{ marginBottom: 14 }}>
                    {allCheckIns.length > 0 ? (
                      <>
                        <Text style={[styles.body, { marginBottom: 8 }]}>
                          You have {allCheckIns.length} check-in{allCheckIns.length !== 1 ? 's' : ''} — enough data to start revealing your emotional rhythms.
                        </Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 10, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' }}>
                          <View style={{ alignItems: 'center' }}>
                            <Text style={{ fontSize: 16, fontWeight: '800', color: theme.textMuted }}>— —</Text>
                            <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 2 }}>Avg Mood</Text>
                          </View>
                          <View style={{ alignItems: 'center' }}>
                            <Text style={{ fontSize: 16, fontWeight: '800', color: theme.textMuted }}>— —</Text>
                            <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 2 }}>Avg Energy</Text>
                          </View>
                          <View style={{ alignItems: 'center' }}>
                            <Text style={{ fontSize: 16, fontWeight: '800', color: theme.textMuted }}>— —</Text>
                            <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 2 }}>Avg Stress</Text>
                          </View>
                        </View>
                      </>
                    ) : (
                      <Text style={styles.body}>
                        See mood, energy, and stress trends over time. Discover which days you feel best and which themes come up most.
                      </Text>
                    )}
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: theme.primary }}>Unlock your patterns</Text>
                    <Ionicons name="arrow-forward" size={14} color={theme.primary} />
                  </View>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          )}

          {/* Footer */}
          <Animated.View entering={FadeInDown.delay(380).duration(600)} style={styles.footer}>
            <Text style={styles.footerTxt}>
              Tracking how you feel is an act of self-awareness, not self-judgment.
            </Text>
          </Animated.View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  flex: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.textPrimary,
    fontFamily: 'serif',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: theme.primary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  content: { paddingHorizontal: theme.spacing.lg },

  card: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.cardBorder,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  heroText: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.textPrimary,
    fontFamily: 'serif',
  },
  body: { color: theme.textSecondary, fontSize: 14, lineHeight: 20 },

  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.textPrimary,
    fontFamily: 'serif',
  },

  streakRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  streakTxt: { color: theme.primary, fontSize: 13, fontWeight: '600' },
  dot: { color: theme.textMuted, fontSize: 13 },

  // Check-in
  savedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(100,200,120,0.10)',
    borderRadius: theme.borderRadius.sm,
    padding: 10,
    marginBottom: 16,
  },
  savedTxt: { color: theme.energy, fontSize: 13, fontWeight: '600' },
  todayNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  todayNoticeTxt: { color: theme.textMuted, fontSize: 12 },

  tagsLabel: {
    color: theme.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  tagsMuted: { color: theme.textMuted, fontWeight: '400', fontSize: 13 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },

  // Time-of-day slots
  timeSlotRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  timeSlotChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  timeSlotChipOn: {
    backgroundColor: 'rgba(201,169,98,0.18)',
    borderColor: theme.primary,
  },
  timeSlotChipDone: {
    backgroundColor: 'rgba(100,200,120,0.08)',
    borderColor: 'rgba(100,200,120,0.25)',
  },
  timeSlotEmoji: {
    fontSize: 18,
    marginBottom: 2,
  },
  timeSlotLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.textMuted,
  },
  timeSlotLabelOn: {
    color: theme.primary,
  },
  timeSlotLabelDone: {
    color: theme.energy,
  },
  currentDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: theme.primary,
    marginTop: 3,
  },
  tagChip: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  tagChipOn: {
    backgroundColor: 'rgba(201,169,98,0.18)',
    borderColor: theme.primary,
  },
  tagTxt: { color: theme.textSecondary, fontSize: 13, fontWeight: '600' },
  tagTxtOn: { color: theme.primary },

  qualityChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  qualityChipOn: {
    backgroundColor: 'rgba(142,111,211,0.18)',
    borderColor: 'rgba(142,111,211,0.5)',
  },
  qualityTxt: { color: theme.textSecondary, fontSize: 12, fontWeight: '600' },
  qualityTxtOn: { color: '#B49EE0' },

  saveBtn: {
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
    marginBottom: 12,
  },
  saveBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(201,169,98,0.22)',
    borderRadius: theme.borderRadius.sm,
  },
  saveBtnTxt: { color: theme.primary, fontSize: 15, fontWeight: '800' },
  hint: { color: theme.textMuted, fontSize: 12, textAlign: 'center', fontStyle: 'italic' },

  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: 'rgba(201,169,98,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(201,169,98,0.22)',
  },
  primaryBtnTxt: { color: theme.primary, fontSize: 14, fontWeight: '800' },

  // Graphs
  rangeRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  rangeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  rangeBtnOn: {
    backgroundColor: 'rgba(201,169,98,0.18)',
    borderColor: theme.primary,
  },
  rangeTxt: { color: theme.textMuted, fontSize: 12, fontWeight: '700' },
  rangeTxtOn: { color: theme.primary },

  emptyState: { alignItems: 'center', paddingVertical: 20 },

  dateRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  dateTxt: { color: theme.textMuted, fontSize: 11 },

  avgsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  avgBadge: { alignItems: 'center' },
  avgValue: { fontSize: 16, fontWeight: '800' },
  avgLabel: { color: theme.textMuted, fontSize: 11, marginTop: 2 },

  graphLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2, marginTop: 8 },
  graphDot: { width: 8, height: 8, borderRadius: 4 },
  graphLabelTxt: { color: theme.textSecondary, fontSize: 13, fontWeight: '700' },

  tagStatRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 5 },
  tagStatLabel: { color: theme.textSecondary, fontSize: 13, width: 130 },
  tagStatBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  tagStatFill: { height: '100%', borderRadius: 2, backgroundColor: theme.primary },
  tagStatCount: { color: theme.textMuted, fontSize: 12, width: 28, textAlign: 'right' },

  // Time-of-day insights
  todBucketRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 8,
  },
  todBucket: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 4,
    gap: 3,
  },
  todBucketLabel: { color: theme.textSecondary, fontSize: 10, fontWeight: '600' },
  todBucketVal: { fontSize: 12, fontWeight: '700' },
  todBucketCount: { color: theme.textMuted, fontSize: 9 },
  todLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    marginBottom: 8,
  },
  todLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  todLegendDot: { width: 8, height: 8, borderRadius: 4 },
  todLegendTxt: { color: theme.textMuted, fontSize: 10 },
  todInsightList: { gap: 6, marginTop: 4 },
  todInsightRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  todInsightEmoji: { fontSize: 14, marginTop: 1 },
  todInsightText: { color: theme.textSecondary, fontSize: 13, flex: 1, lineHeight: 18 },

  // Energy link
  linkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  linkLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, marginRight: 16 },
  linkTitle: { color: theme.textPrimary, fontSize: 15, fontWeight: '700' },
  linkSub: { color: theme.textMuted, fontSize: 12, marginTop: 1 },

  footer: { paddingVertical: theme.spacing.xl, alignItems: 'center' },
  footerTxt: {
    color: theme.textMuted,
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    maxWidth: 280,
  },
});
