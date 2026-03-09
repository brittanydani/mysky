/**
 * PersonalInsightDashboard — Master Signal Card
 *
 * Synthesizes three "Pro" intelligence metrics at the top of the Journal tab:
 *   1. Volatility Score   — how much mood fluctuated this week (std dev → 1–10)
 *   2. Sentiment Shift    — are journals trending "Open" or "Guarding"?
 *   3. Restoration Efficiency — how well sleep quality → next-day mood lift
 *
 * All math is done on-device, no network calls.
 */
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { SkiaGradient as LinearGradient } from './SkiaGradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { DailyCheckIn } from '../../services/patterns/types';
import { JournalEntry } from '../../services/storage/models';
import { SleepEntry } from '../../services/storage/models';

// ── Utility ───────────────────────────────────────────────────────────────────

function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  return Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length);
}

function clamp(v: number, lo: number, hi: number) {
  return Math.min(Math.max(v, lo), hi);
}

// ── Metric Computation ────────────────────────────────────────────────────────

/** 1 — Volatility: std dev of weekly mood scores, mapped to 0–10 */
function computeVolatility(checkIns: DailyCheckIn[]): { score: number; label: string; color: string } {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const recent = checkIns.filter(c => new Date(c.date) >= oneWeekAgo);
  const scores = recent.map(c => c.moodScore);

  if (scores.length < 2) return { score: 0, label: '—', color: theme.textMuted };

  const sd = stdDev(scores);
  // Mood std dev on a [1–10] scale: sd ~0–3 → map to 0–10
  const score = Math.round(clamp((sd / 3) * 10, 0, 10));
  const label = score <= 3 ? 'Stable' : score <= 6 ? 'Variable' : 'Turbulent';
  const color = score <= 3 ? theme.energy : score <= 6 ? theme.textGold : theme.cinematic.copper;
  return { score, label, color };
}

/**
 * 2 — Sentiment Shift: compares average NLP sentiment (contentSentiment, −1 to +1)
 * of the last 14 days vs the 14 days before that.
 * Returns direction: "Opening" (positive trend), "Guarding" (negative), "Neutral".
 */
function computeSentimentShift(
  entries: JournalEntry[],
): { direction: string; delta: number; color: string } {
  const now = new Date();
  const cutA = new Date(now); cutA.setDate(cutA.getDate() - 14);
  const cutB = new Date(now); cutB.setDate(cutB.getDate() - 28);

  const parseSentiment = (e: JournalEntry): number | null => {
    if (!e.contentSentiment) return null;
    try {
      const parsed = JSON.parse(e.contentSentiment);
      // SentimentResult may be { score: number } or a raw number
      const v = typeof parsed === 'number' ? parsed : parsed?.score ?? null;
      return typeof v === 'number' ? clamp(v, -1, 1) : null;
    } catch {
      return null;
    }
  };

  const recent = entries
    .filter(e => {
      const d = new Date(e.date);
      return d >= cutA && d <= now;
    })
    .map(parseSentiment)
    .filter((v): v is number => v !== null);

  const prior = entries
    .filter(e => {
      const d = new Date(e.date);
      return d >= cutB && d < cutA;
    })
    .map(parseSentiment)
    .filter((v): v is number => v !== null);

  if (recent.length < 2 || prior.length < 2) {
    return { direction: '—', delta: 0, color: theme.textMuted };
  }

  const recentAvg = recent.reduce((s, v) => s + v, 0) / recent.length;
  const priorAvg = prior.reduce((s, v) => s + v, 0) / prior.length;
  const delta = recentAvg - priorAvg;

  const direction = delta > 0.05 ? 'Opening' : delta < -0.05 ? 'Guarding' : 'Neutral';
  const color =
    direction === 'Opening' ? theme.energy :
    direction === 'Guarding' ? theme.cinematic.copper :
    theme.textMuted;

  return { direction, delta, color };
}

/**
 * 3 — Restoration Efficiency: for each sleep entry with quality data,
 * find the next-day's mood and compute (moodNext − moodPrev) / (sleepQuality − 1).
 * Normalised to 0–100%.
 */
function computeRestorationEfficiency(
  sleepEntries: SleepEntry[],
  checkIns: DailyCheckIn[],
): { score: number; label: string; color: string } {
  if (sleepEntries.length < 3 || checkIns.length < 3) {
    return { score: 0, label: '—', color: theme.textMuted };
  }

  // Build date → avg moodScore map
  const moodByDate: Record<string, number> = {};
  for (const ci of checkIns) {
    if (!moodByDate[ci.date]) moodByDate[ci.date] = 0;
    moodByDate[ci.date] = (moodByDate[ci.date] + ci.moodScore) / 2; // rough avg
  }

  const lifts: number[] = [];

  for (const sleep of sleepEntries) {
    if (!sleep.quality || sleep.quality < 1) continue;

    // Get next date
    const baseDate = new Date(sleep.date + 'T00:00:00');
    const nextDate = new Date(baseDate);
    nextDate.setDate(nextDate.getDate() + 1);
    const nextKey = nextDate.toISOString().slice(0, 10);

    const prevMood = moodByDate[sleep.date];
    const nextMood = moodByDate[nextKey];

    if (prevMood === undefined || nextMood === undefined) continue;

    // Normalise: (mood lift) proportional to (sleep quality above baseline)
    const sleepAboveBase = (sleep.quality - 1) / 4; // 0–1
    if (sleepAboveBase < 0.1) continue; // ignore baseline quality nights

    const moodLift = (nextMood - prevMood) / 9; // −1 to +1
    lifts.push(moodLift / sleepAboveBase);
  }

  if (lifts.length < 2) return { score: 0, label: '—', color: theme.textMuted };

  const avgLift = lifts.reduce((s, v) => s + v, 0) / lifts.length;
  const score = Math.round(clamp((avgLift + 1) / 2 * 100, 0, 100));
  const label = score >= 65 ? 'Restorative' : score >= 40 ? 'Partial' : 'Low';
  const color = score >= 65 ? theme.energy : score >= 40 ? theme.textGold : theme.cinematic.copper;

  return { score, label, color };
}

// ── Component ──────────────────────────────────────────────────────────────────

interface Props {
  checkIns: DailyCheckIn[];
  entries: JournalEntry[];
  sleepEntries: SleepEntry[];
}

export default function PersonalInsightDashboard({ checkIns, entries, sleepEntries }: Props) {
  const volatility = useMemo(() => computeVolatility(checkIns), [checkIns]);
  const sentiment = useMemo(() => computeSentimentShift(entries), [entries]);
  const restoration = useMemo(() => computeRestorationEfficiency(sleepEntries, checkIns), [sleepEntries, checkIns]);

  const hasEnoughData = checkIns.length >= 4 || entries.length >= 3;

  return (
    <LinearGradient
      colors={['rgba(232, 214, 174, 0.07)', 'rgba(14,24,48,0.45)']}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="sparkles" size={14} color={theme.textGold} />
          <Text style={styles.headerLabel}>Personal Intelligence</Text>
        </View>
        <Text style={styles.headerSub}>7-day synthesis</Text>
      </View>

      {/* 3 Metric Cards */}
      <View style={styles.metricsRow}>
        <MetricCell
          icon="pulse"
          label="Volatility"
          value={volatility.score > 0 ? `${volatility.score}/10` : '—'}
          subLabel={volatility.label}
          color={volatility.color}
          hasData={volatility.score > 0}
        />
        <View style={styles.divider} />
        <MetricCell
          icon="trending-up"
          label="Sentiment"
          value={sentiment.direction}
          subLabel={sentiment.delta !== 0 ? `${sentiment.delta >= 0 ? '+' : ''}${(sentiment.delta * 100).toFixed(0)}%` : 'Insufficient data'}
          color={sentiment.color}
          hasData={sentiment.direction !== '—'}
        />
        <View style={styles.divider} />
        <MetricCell
          icon="moon"
          label="Restoration"
          value={restoration.score > 0 ? `${restoration.score}%` : '—'}
          subLabel={restoration.label}
          color={restoration.color}
          hasData={restoration.score > 0}
        />
      </View>

      {/* Narrative hint */}
      {!hasEnoughData && (
        <Text style={styles.hintText}>
          Log {Math.max(0, 4 - checkIns.length)} more check-ins and {Math.max(0, 3 - entries.length)} more journal entries to unlock your full intelligence read.
        </Text>
      )}
    </LinearGradient>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MetricCell({
  icon,
  label,
  value,
  subLabel,
  color,
  hasData,
}: {
  icon: string;
  label: string;
  value: string;
  subLabel: string;
  color: string;
  hasData: boolean;
}) {
  return (
    <View style={styles.metricCell}>
      <Ionicons name={icon as any} size={14} color={hasData ? color : theme.textMuted} style={styles.metricIcon} />
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, { color: hasData ? color : theme.textMuted }]}>
        {value}
      </Text>
      <Text style={styles.metricSub}>{subLabel}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(232, 214, 174, 0.15)',
    borderTopColor: 'rgba(232, 214, 174, 0.25)',
    padding: 18,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.textGold,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    letterSpacing: 0.3,
  },
  headerSub: {
    fontSize: 10,
    color: theme.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  metricCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
    gap: 3,
  },
  metricIcon: {
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 10,
    color: theme.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    lineHeight: 24,
  },
  metricSub: {
    fontSize: 11,
    color: theme.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
  },
  divider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: 4,
  },
  hintText: {
    fontSize: 12,
    color: theme.textMuted,
    fontStyle: 'italic',
    lineHeight: 18,
    marginTop: 12,
    textAlign: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
});
