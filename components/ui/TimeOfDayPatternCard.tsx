/**
 * TimeOfDayPatternCard
 *
 * Shows when the user tends to feel best or worst across four time segments:
 * Morning · Afternoon · Evening · Night
 *
 * Derived from DailyCheckIn.timeOfDay + moodScore + energyLevel.
 * Renders as four contextual tiles with glow tinting.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { DailyCheckIn, TimeOfDay } from '../../services/patterns/types';

// ─── Palette ──────────────────────────────────────────────────────────────────

const PALETTE = {
  card: 'rgba(255,255,255,0.03)',
  border: 'rgba(255,255,255,0.07)',
  borderTop: 'rgba(255,255,255,0.11)',
  heading: '#FFFFFF',
  subtext: 'rgba(226,232,240,0.55)',
  label: 'rgba(226,232,240,0.85)',
  muted: 'rgba(226,232,240,0.40)',
  gold: '#C9AE78',
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface Segment {
  key: TimeOfDay;
  label: string;
  icon: string;
  count: number;
  avgMood: number | null;
  avgEnergy: number | null; // 0–1 normalised from low=0, medium=0.5, high=1
  insight: string | null;
}

interface Props {
  checkIns: DailyCheckIn[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function energyToNum(level: string): number {
  if (level === 'high') return 1;
  if (level === 'medium') return 0.5;
  return 0;
}

function moodColor(avg: number | null): string {
  if (avg === null) return 'rgba(255,255,255,0.06)';
  if (avg >= 7.5) return 'rgba(125,235,219,0.22)';  // cyan — thriving
  if (avg >= 5.5) return 'rgba(110,191,139,0.18)';  // emerald — good
  if (avg >= 4)   return 'rgba(201,174,120,0.14)';  // gold — neutral
  return 'rgba(205,127,93,0.18)';                    // copper — heavy
}

function moodAccent(avg: number | null): string {
  if (avg === null) return 'rgba(255,255,255,0.25)';
  if (avg >= 7.5) return '#7DEBDB';
  if (avg >= 5.5) return '#6EBF8B';
  if (avg >= 4)   return '#C9AE78';
  return '#CD7F5D';
}

function buildInsight(key: TimeOfDay, avgMood: number | null, avgEnergy: number | null): string | null {
  if (avgMood === null) return null;

  const isHigh = avgMood >= 7;
  const isLow  = avgMood < 4;
  const energyHigh = avgEnergy !== null && avgEnergy > 0.65;
  const energyLow  = avgEnergy !== null && avgEnergy < 0.35;

  const map: Record<TimeOfDay, Record<string, string>> = {
    morning: {
      high: 'Your most stable window',
      mid: 'Solid start to the day',
      low: 'Mornings can feel heavy',
    },
    afternoon: {
      high: energyHigh ? 'Peak performance zone' : 'Calm and clear midday',
      mid: 'Steady ground here',
      low: energyLow ? 'Low point mid-afternoon' : 'Mood tends to soften',
    },
    evening: {
      high: 'Evenings feel expansive',
      mid: 'Winding down well',
      low: 'Emotional weight often peaks here',
    },
    night: {
      high: 'Reflective and at rest',
      mid: 'Quiet close to the day',
      low: 'Night brings more heaviness',
    },
  };

  const tier = isHigh ? 'high' : isLow ? 'low' : 'mid';
  return map[key][tier] ?? null;
}

const SEGMENTS: { key: TimeOfDay; label: string; icon: string }[] = [
  { key: 'morning',   label: 'Morning',   icon: 'sunny-outline' },
  { key: 'afternoon', label: 'Midday',    icon: 'partly-sunny-outline' },
  { key: 'evening',   label: 'Evening',   icon: 'moon-outline' },
  { key: 'night',     label: 'Night',     icon: 'star-outline' },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function TimeOfDayPatternCard({ checkIns }: Props) {
  const segments = useMemo<Segment[]>(() => {
    return SEGMENTS.map(({ key, label, icon }) => {
      const group = checkIns.filter(ci => ci.timeOfDay === key);
      if (group.length === 0) {
        return { key, label, icon, count: 0, avgMood: null, avgEnergy: null, insight: null };
      }
      const avgMood   = group.reduce((s, ci) => s + ci.moodScore, 0) / group.length;
      const avgEnergy = group.reduce((s, ci) => s + energyToNum(ci.energyLevel), 0) / group.length;
      return {
        key,
        label,
        icon,
        count: group.length,
        avgMood,
        avgEnergy,
        insight: buildInsight(key, avgMood, avgEnergy),
      };
    });
  }, [checkIns]);

  // Find the best and lowest mood segments for the insight bar
  const validSegments = segments.filter(s => s.avgMood !== null);
  const best = validSegments.length > 0
    ? validSegments.reduce((a, b) => (a.avgMood! > b.avgMood! ? a : b))
    : null;
  const lowest = validSegments.length > 1
    ? validSegments.reduce((a, b) => (a.avgMood! < b.avgMood! ? a : b))
    : null;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>Time of Day</Text>
      <Text style={styles.subtitle}>When do you feel most like yourself?</Text>

      <View style={styles.grid}>
        {segments.map(seg => {
          const accent = moodAccent(seg.avgMood);
          const bg     = moodColor(seg.avgMood);
          const isBest = best?.key === seg.key && validSegments.length > 1;

          return (
            <View
              key={seg.key}
              style={[
                styles.tile,
                { backgroundColor: bg, borderColor: isBest ? accent : PALETTE.border },
                isBest && { borderColor: accent },
              ]}
            >
              {isBest && (
                <View style={[styles.bestBadge, { backgroundColor: `${accent}22` }]}>
                  <Text style={[styles.bestBadgeText, { color: accent }]}>Best</Text>
                </View>
              )}

              <Ionicons
                name={seg.icon as any}
                size={18}
                color={seg.count > 0 ? accent : PALETTE.muted}
                style={styles.icon}
              />
              <Text style={styles.tileLabel}>{seg.label}</Text>

              {seg.avgMood !== null ? (
                <>
                  <Text style={[styles.moodScore, { color: accent }]}>
                    {seg.avgMood.toFixed(1)}
                  </Text>
                  <Text style={styles.tileCount}>{seg.count} logs</Text>
                  {seg.insight && (
                    <Text style={styles.tileInsight} numberOfLines={2}>
                      {seg.insight}
                    </Text>
                  )}
                </>
              ) : (
                <Text style={styles.tileEmpty}>No data yet</Text>
              )}
            </View>
          );
        })}
      </View>

      {best && lowest && best.key !== lowest.key && (
        <View style={styles.summaryRow}>
          <Ionicons name="analytics-outline" size={13} color={PALETTE.gold} style={{ marginTop: 1 }} />
          <Text style={styles.summaryText}>
            Your mood peaks in the <Text style={styles.summaryAccent}>{best.label.toLowerCase()}</Text>
            {' '}and softens at <Text style={{ color: moodAccent(lowest.avgMood) }}>{lowest.label.toLowerCase()}</Text>.
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 20,
    padding: 20,
    backgroundColor: PALETTE.card,
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderTopColor: PALETTE.borderTop,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: PALETTE.heading,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: PALETTE.subtext,
    fontStyle: 'italic',
    marginBottom: 18,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  tile: {
    width: '47.5%',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    position: 'relative',
    minHeight: 110,
  },

  bestBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  bestBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  icon: {
    marginBottom: 8,
  },
  tileLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.label,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  moodScore: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 2,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
  tileCount: {
    fontSize: 11,
    color: PALETTE.muted,
    marginBottom: 6,
  },
  tileInsight: {
    fontSize: 11,
    color: PALETTE.label,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  tileEmpty: {
    fontSize: 12,
    color: PALETTE.muted,
    fontStyle: 'italic',
    marginTop: 8,
  },

  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  summaryText: {
    fontSize: 13,
    color: PALETTE.label,
    lineHeight: 19,
    flex: 1,
  },
  summaryAccent: {
    color: '#7DEBDB',
  },
});
