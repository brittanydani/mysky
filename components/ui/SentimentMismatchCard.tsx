/**
 * SentimentMismatchCard
 *
 * System 3 — Sentiment Tone Tracking
 * Detects divergence between a user's logged mood score (numeric, check-in)
 * and the emotional tone of their written journal language (NLP sentiment).
 *
 * "High score, dark words" → suggests social performance / masking
 * "Low score, bright words" → suggests resilience / denial processing
 *
 * Surfaces the top mismatch pattern as a single insight card.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { JournalEntry } from '../../services/storage/models';
import type { DailyCheckIn } from '../../services/patterns/types';

// ─── Thresholds ───────────────────────────────────────────────────────────────

const HIGH_MOOD_THRESHOLD = 6.5;
const LOW_MOOD_THRESHOLD = 4.5;
const MISMATCH_SENTIMENT_THRESHOLD = 0.15;

// ─── Palette ──────────────────────────────────────────────────────────────────

const PALETTE = {
  gold: '#C9AE78',
  copper: '#CD7F5D',
  amethyst: '#9D76C1',
  card: 'rgba(255,255,255,0.03)',
  border: 'rgba(255,255,255,0.06)',
  borderTop: 'rgba(255,255,255,0.10)',
  text: 'rgba(240,234,214,0.88)',
  muted: 'rgba(240,234,214,0.45)',
  surface: 'rgba(255,255,255,0.04)',
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface MismatchResult {
  type: 'masking' | 'resilience' | 'balanced';
  mismatchCount: number;
  totalPaired: number;
  insight: string;
  detailA: string;
  detailB: string;
  accentColor: string;
  icon: keyof typeof import('@expo/vector-icons/build/glyphmaps/Ionicons').default;
}

interface Props {
  entries: JournalEntry[];
  checkIns: DailyCheckIn[];
}

// ─── Analysis ────────────────────────────────────────────────────────────────

function analyzeMismatch(entries: JournalEntry[], checkIns: DailyCheckIn[]): MismatchResult | null {
  if (entries.length < 4 || checkIns.length < 4) return null;

  // Build a date → moodScore map from check-ins (average if multiple per day)
  const moodByDate: Record<string, number[]> = {};
  for (const ci of checkIns) {
    if (!moodByDate[ci.date]) moodByDate[ci.date] = [];
    moodByDate[ci.date].push(ci.moodScore);
  }

  let maskingCount = 0;   // high mood, negative text
  let resilienceCount = 0; // low mood, positive text
  let pairedCount = 0;

  for (const entry of entries) {
    if (!entry.contentSentiment) continue;
    let sentiment = 0;
    try {
      const parsed = JSON.parse(entry.contentSentiment);
      sentiment = parsed.sentiment ?? 0;
    } catch {
      continue;
    }

    const dayMoods = moodByDate[entry.date];
    if (!dayMoods || dayMoods.length === 0) continue;

    pairedCount++;
    const avgMood = dayMoods.reduce((s, v) => s + v, 0) / dayMoods.length;

    if (avgMood >= HIGH_MOOD_THRESHOLD && sentiment < -MISMATCH_SENTIMENT_THRESHOLD) {
      maskingCount++;
    } else if (avgMood <= LOW_MOOD_THRESHOLD && sentiment > MISMATCH_SENTIMENT_THRESHOLD) {
      resilienceCount++;
    }
  }

  if (pairedCount < 3) return null;

  const maskingRate = maskingCount / pairedCount;
  const resilienceRate = resilienceCount / pairedCount;

  if (maskingRate > 0.2 && maskingRate >= resilienceRate) {
    return {
      type: 'masking',
      mismatchCount: maskingCount,
      totalPaired: pairedCount,
      insight: 'Your words carry more weight than your scores suggest.',
      detailA: `On ${maskingCount} day${maskingCount !== 1 ? 's' : ''}, you logged a high mood but wrote in heavier tones.`,
      detailB: 'This can signal filtering or processing quietly. Your language is honest.',
      accentColor: PALETTE.copper,
      icon: 'eye-off-outline',
    };
  }

  if (resilienceRate > 0.15) {
    return {
      type: 'resilience',
      mismatchCount: resilienceCount,
      totalPaired: pairedCount,
      insight: 'Even in hard moments, your language holds hope.',
      detailA: `On ${resilienceCount} day${resilienceCount !== 1 ? 's' : ''}, your mood was low but your writing stayed grounded.`,
      detailB: 'This is a sign of deep emotional resilience — you process rather than collapse.',
      accentColor: PALETTE.amethyst,
      icon: 'flower-outline',
    };
  }

  if (maskingCount + resilienceCount === 0) {
    return {
      type: 'balanced',
      mismatchCount: 0,
      totalPaired: pairedCount,
      insight: 'Your emotional expression feels coherent and honest.',
      detailA: 'Your mood scores and written language are largely in agreement.',
      detailB: 'You are emotionally expressive and self-aware.',
      accentColor: PALETTE.gold,
      icon: 'checkmark-circle-outline',
    };
  }

  return null;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function SentimentMismatchCard({ entries, checkIns }: Props) {
  const result = useMemo(() => analyzeMismatch(entries, checkIns), [entries, checkIns]);

  if (!result) return null;

  const pct = result.totalPaired > 0
    ? Math.round((result.mismatchCount / result.totalPaired) * 100)
    : 0;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Emotional Tone</Text>
        <Text style={styles.subtitle}>SENTIMENT TRACKER</Text>
      </View>

      <View style={[styles.insightBox, { borderColor: `${result.accentColor}22` }]}>
        <View style={[styles.iconCircle, { backgroundColor: `${result.accentColor}18` }]}>
          <Ionicons name={result.icon as any} size={18} color={result.accentColor} />
        </View>
        <View style={styles.insightBody}>
          <Text style={[styles.insightHeadline, { color: result.accentColor }]}>
            {result.insight}
          </Text>
          <Text style={styles.insightDetail}>{result.detailA}</Text>
          <Text style={styles.insightSubtle}>{result.detailB}</Text>
        </View>
      </View>

      {result.type !== 'balanced' && result.totalPaired > 0 && (
        <View style={styles.statsRow}>
          <View style={styles.statPill}>
            <Text style={styles.statValue}>{result.mismatchCount}</Text>
            <Text style={styles.statLabel}>mismatch days</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statValue}>{pct}%</Text>
            <Text style={styles.statLabel}>of entries</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statValue}>{result.totalPaired}</Text>
            <Text style={styles.statLabel}>days tracked</Text>
          </View>
        </View>
      )}
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
    marginBottom: 14,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 3,
  },
  subtitle: {
    color: PALETTE.gold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    opacity: 0.85,
  },
  insightBox: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'flex-start',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  insightBody: {
    flex: 1,
    gap: 4,
  },
  insightHeadline: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  insightDetail: {
    color: PALETTE.text,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 2,
  },
  insightSubtle: {
    color: PALETTE.muted,
    fontSize: 12,
    lineHeight: 17,
    fontStyle: 'italic',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  statPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    color: PALETTE.muted,
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 1,
    textTransform: 'uppercase',
  },
});
