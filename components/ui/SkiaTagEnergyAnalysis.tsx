/**
 * SkiaTagEnergyAnalysis
 *
 * Chart 6 — Emotional Volatility: Tag-Based Energy Split
 * Splits check-in tags into two columns:
 *   • Elevating — tags most common on high-mood days (moodScore > 7)
 *   • Draining   — tags most common on low-mood days  (moodScore < 4)
 *
 * Renders as a split two-column list with color-coded tag pills.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { DailyCheckIn } from '../../services/patterns/types';

// ─── Palette ─────────────────────────────────────────────────────────────────

const PALETTE = {
  elevating: '#6EBF8B',     // emerald — high energy / growth
  draining: '#CD7F5D',      // copper  — strain / depletion
  highlight: '#C9AE78',     // gold    — section labels
  card: 'rgba(255,255,255,0.03)',
  border: 'rgba(255,255,255,0.06)',
  borderTop: 'rgba(255,255,255,0.10)',
  text: 'rgba(240, 234, 214, 0.88)',
  muted: 'rgba(240, 234, 214, 0.45)',
  rowBg: 'rgba(255,255,255,0.04)',
};

// ─── Tag label formatter ──────────────────────────────────────────────────────

function formatTag(tag: string): string {
  return tag
    .replace(/^eq_/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface TagCount {
  tag: string;
  count: number;
  fraction: number; // 0–1, fraction of eligible days this tag appeared
}

interface Props {
  checkIns: DailyCheckIn[];
  topN?: number; // how many tags to show per column (default 6)
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function SkiaTagEnergyAnalysis({ checkIns, topN = 6 }: Props) {
  const { elevating, draining, totalHigh, totalLow } = useMemo(() => {
    const highMoodDays = checkIns.filter(ci => ci.moodScore > 7);
    const lowMoodDays  = checkIns.filter(ci => ci.moodScore < 4);

    function rankTags(days: DailyCheckIn[]): TagCount[] {
      if (days.length === 0) return [];
      const freq: Record<string, number> = {};
      for (const ci of days) {
        for (const tag of ci.tags) {
          freq[tag] = (freq[tag] ?? 0) + 1;
        }
      }
      return Object.entries(freq)
        .map(([tag, count]) => ({ tag, count, fraction: count / days.length }))
        .sort((a, b) => b.count - a.count)
        .slice(0, topN);
    }

    return {
      elevating: rankTags(highMoodDays),
      draining: rankTags(lowMoodDays),
      totalHigh: highMoodDays.length,
      totalLow: lowMoodDays.length,
    };
  }, [checkIns, topN]);

  const hasData = elevating.length > 0 || draining.length > 0;

  if (!hasData) {
    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>Emotional Patterns</Text>
          <Text style={styles.subtitle}>TAG ENERGY ANALYSIS</Text>
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="analytics-outline" size={28} color={PALETTE.muted} />
          <Text style={styles.emptyText}>Check in consistently to reveal your emotional patterns</Text>
        </View>
      </View>
    );
  }

  const maxCount = Math.max(
    ...elevating.map(t => t.count),
    ...draining.map(t => t.count),
    1,
  );

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Emotional Patterns</Text>
        <Text style={styles.subtitle}>TAG ENERGY ANALYSIS</Text>
      </View>

      {/* Column headers */}
      <View style={styles.columns}>
        <View style={styles.column}>
          <View style={styles.colHead}>
            <View style={[styles.colDot, { backgroundColor: PALETTE.elevating }]} />
            <Text style={[styles.colTitle, { color: PALETTE.elevating }]}>Elevating</Text>
            <Text style={styles.colSub}>{totalHigh} days</Text>
          </View>
          {elevating.map((item, i) => (
            <TagRow
              key={item.tag}
              item={item}
              maxCount={maxCount}
              color={PALETTE.elevating}
              rank={i}
            />
          ))}
          {elevating.length === 0 && (
            <Text style={styles.noneText}>No high-mood days yet</Text>
          )}
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        <View style={styles.column}>
          <View style={styles.colHead}>
            <View style={[styles.colDot, { backgroundColor: PALETTE.draining }]} />
            <Text style={[styles.colTitle, { color: PALETTE.draining }]}>Draining</Text>
            <Text style={styles.colSub}>{totalLow} days</Text>
          </View>
          {draining.map((item, i) => (
            <TagRow
              key={item.tag}
              item={item}
              maxCount={maxCount}
              color={PALETTE.draining}
              rank={i}
            />
          ))}
          {draining.length === 0 && (
            <Text style={styles.noneText}>No low-mood days yet</Text>
          )}
        </View>
      </View>

      {/* Footer insight */}
      {elevating.length > 0 && draining.length > 0 && (
        <View style={styles.insightRow}>
          <Ionicons name="bulb-outline" size={13} color={PALETTE.highlight} />
          <Text style={styles.insightText}>
            "{formatTag(elevating[0].tag)}" appears {elevating[0].count}× on your best days.{' '}
            "{formatTag(draining[0].tag)}" on your hardest.
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── TagRow sub-component ─────────────────────────────────────────────────────

function TagRow({
  item,
  maxCount,
  color,
  rank,
}: {
  item: TagCount;
  maxCount: number;
  color: string;
  rank: number;
}) {
  const barWidth = Math.max(0.06, item.count / maxCount);

  return (
    <View style={styles.tagRow}>
      <Text style={styles.tagLabel} numberOfLines={1}>
        {formatTag(item.tag)}
      </Text>
      <View style={styles.barTrack}>
        <View
          style={[
            styles.barFill,
            {
              flex: barWidth,
              backgroundColor: color,
              opacity: 0.55 + rank * -0.07 + 0.07, // dimm slightly per rank
            },
          ]}
        />
        <View style={{ flex: 1 - barWidth }} />
      </View>
      <Text style={[styles.countBadge, { color }]}>{item.count}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: PALETTE.card,
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderTopColor: PALETTE.borderTop,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 3,
  },
  subtitle: {
    color: PALETTE.highlight,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    opacity: 0.85,
  },
  columns: {
    flexDirection: 'row',
    gap: 0,
  },
  column: {
    flex: 1,
  },
  colHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 10,
  },
  colDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  colTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    flex: 1,
  },
  colSub: {
    color: PALETTE.muted,
    fontSize: 9,
    fontWeight: '600',
  },
  divider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
    marginHorizontal: 12,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 7,
    gap: 5,
  },
  tagLabel: {
    color: PALETTE.text,
    fontSize: 11,
    fontWeight: '500',
    width: 68,
  },
  barTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  barFill: {
    height: 4,
    borderRadius: 2,
  },
  countBadge: {
    fontSize: 10,
    fontWeight: '700',
    width: 18,
    textAlign: 'right',
  },
  noneText: {
    color: PALETTE.muted,
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 4,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 14,
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(201,174,120,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(201,174,120,0.12)',
  },
  insightText: {
    color: 'rgba(240,234,214,0.75)',
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 28,
  },
  emptyText: {
    color: PALETTE.muted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 220,
  },
});
