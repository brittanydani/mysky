/**
 * MonthlySynthesisCard
 * Card Type C — Monthly Synthesis
 *
 * Appears in the journal feed every ~30 entries (or at month boundaries).
 * Summarises the month's emotional landscape:
 *   • Dominant keyword (highest frequency) labelled "Strongest Frequency"
 *   • Sentiment trend vs previous month (+/- %)
 *   • Month name in Gold Serif as a chapter heading
 *   • Gaussian glow bar showing keyword distribution
 *
 * Usage: inject one of these into the FlatList feed at every month boundary.
 *
 * Requires: @shopify/react-native-skia 2.x
 */

import React, { memo, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import {
  Canvas,
  RoundedRect,
  LinearGradient,
  BlurMask,
  Circle,
  Group,
  Path,
  Skia,
  vec,
} from '@shopify/react-native-skia';
import type { JournalEntry } from '../../services/storage/models';

// ─── Layout ───────────────────────────────────────────────────────────────────

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = SCREEN_W - 32;
const CARD_H = 200;
const BORDER_R = 20;
const BAR_H = 28;

// ─── Palette ──────────────────────────────────────────────────────────────────

const GOLD = '#C9AE78';
const GOLD_DIM = 'rgba(201,174,120,0.14)';
const GOLD_MID = 'rgba(201,174,120,0.28)';
const CYAN = '#7DEBDB';
const LAVENDER = '#A286F2';
const GLASS = 'rgba(255,255,255,0.03)';
const BORDER = 'rgba(255,255,255,0.07)';

// ─── Helpers ─────────────────────────────────────────────────────────────────

interface MonthStats {
  month: string;           // e.g. "February 2026"
  entryCount: number;
  dominantKeyword: string;
  dominantCount: number;
  sentimentAvg: number;    // -1 to +1
  prevSentimentAvg: number | null;
  topKeywords: Array<{ word: string; count: number }>;
}

function computeMonthStats(
  entries: JournalEntry[],
  month: string,             // YYYY-MM
  prevEntries?: JournalEntry[],
): MonthStats {
  // Aggregate keywords
  const wordCounts: Record<string, number> = {};
  let sentimentSum = 0;
  let sentimentN = 0;

  for (const e of entries) {
    // Keywords
    if (e.contentKeywords) {
      try {
        const kw: { top?: Array<{ w: string; c: number }> } = JSON.parse(e.contentKeywords);
        for (const { w, c } of kw.top ?? []) {
          wordCounts[w] = (wordCounts[w] ?? 0) + c;
        }
      } catch {}
    }
    // Sentiment
    if (e.contentSentiment) {
      try {
        const s: { sentiment?: number } = JSON.parse(e.contentSentiment);
        if (s.sentiment != null) {
          sentimentSum += s.sentiment;
          sentimentN++;
        }
      } catch {}
    }
  }

  const sorted = Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const dominant = sorted[0] ?? ['—', 0];

  // Previous month sentiment
  let prevSentimentAvg: number | null = null;
  if (prevEntries && prevEntries.length > 0) {
    let ps = 0; let pn = 0;
    for (const e of prevEntries) {
      if (e.contentSentiment) {
        try {
          const s: { sentiment?: number } = JSON.parse(e.contentSentiment);
          if (s.sentiment != null) { ps += s.sentiment; pn++; }
        } catch {}
      }
    }
    prevSentimentAvg = pn > 0 ? ps / pn : null;
  }

  // Human-readable month label
  const [y, m] = month.split('-').map(Number);
  const label = new Date(y, m - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return {
    month: label,
    entryCount: entries.length,
    dominantKeyword: dominant[0],
    dominantCount: dominant[1] as number,
    sentimentAvg: sentimentN > 0 ? sentimentSum / sentimentN : 0,
    prevSentimentAvg,
    topKeywords: sorted.map(([word, count]) => ({ word, count: count as number })),
  };
}

function sentimentLabel(s: number): string {
  if (s > 0.3) return 'Expansive';
  if (s > 0.1) return 'Open';
  if (s > -0.1) return 'Neutral';
  if (s > -0.3) return 'Contracted';
  return 'Dense';
}

function sentimentColor(s: number): string {
  if (s > 0.2) return CYAN;
  if (s < -0.2) return '#D4832A';
  return GOLD;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  monthKey: string;      // YYYY-MM
  entries: JournalEntry[];
  prevEntries?: JournalEntry[];
}

const MonthlySynthesisCard = memo(function MonthlySynthesisCard({ monthKey, entries, prevEntries }: Props) {
  const stats = useMemo(
    () => computeMonthStats(entries, monthKey, prevEntries),
    [entries, monthKey, prevEntries],
  );

  const maxKeywordCount = Math.max(...stats.topKeywords.map(k => k.count), 1);

  const trendPercent = useMemo(() => {
    if (stats.prevSentimentAvg == null) return null;
    const prev = stats.prevSentimentAvg;
    const curr = stats.sentimentAvg;
    if (Math.abs(prev) < 0.001) return null;
    const pct = Math.round(((curr - prev) / Math.abs(prev)) * 100);
    return pct;
  }, [stats]);

  return (
    <View style={styles.wrapper}>
      {/* ── Skia glass layer ─────────────────────────────────── */}
      <Canvas style={styles.canvas}>
        <Group>
          {/* Surface */}
          <RoundedRect x={0} y={0} width={CARD_W} height={CARD_H} r={BORDER_R} color={GLASS} />

          {/* Gold ambient glow */}
          <RoundedRect x={0} y={0} width={CARD_W} height={CARD_H} r={BORDER_R} color={GOLD_DIM}>
            <BlurMask blur={24} style="normal" />
          </RoundedRect>

          {/* Specular top */}
          <RoundedRect x={1} y={1} width={CARD_W - 2} height={CARD_H * 0.4} r={BORDER_R}>
            <LinearGradient
              start={vec(0, 0)}
              end={vec(0, CARD_H * 0.4)}
              colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.0)']}
            />
          </RoundedRect>

          {/* Gold border */}
          <RoundedRect
            x={0.5}
            y={0.5}
            width={CARD_W - 1}
            height={CARD_H - 1}
            r={BORDER_R}
            color={GOLD_MID}
            style="stroke"
            strokeWidth={1}
          />

          {/* Decorative center sparkle */}
          <Circle cx={CARD_W / 2} cy={12} r={2} color={GOLD}>
            <BlurMask blur={4} style="outer" />
          </Circle>
        </Group>
      </Canvas>

      {/* ── Content layer ────────────────────────────────────── */}
      <View style={styles.content}>
        {/* Chapter heading */}
        <View style={styles.chapterRow}>
          <Text style={styles.chapterDivider}>✦ ─────────────────── ✦</Text>
        </View>
        <Text style={styles.monthTitle}>{stats.month}</Text>
        <Text style={styles.entryCount}>{stats.entryCount} entries · Monthly Synthesis</Text>

        {/* Dominant keyword */}
        <View style={styles.dominantRow}>
          <View style={styles.dominantCard}>
            <Text style={styles.dominantLabel}>STRONGEST FREQUENCY</Text>
            <Text style={styles.dominantWord}>{stats.dominantKeyword}</Text>
          </View>
          <View style={[styles.dominantCard, { borderColor: `${sentimentColor(stats.sentimentAvg)}33` }]}>
            <Text style={styles.dominantLabel}>TONE</Text>
            <Text style={[styles.dominantWord, { color: sentimentColor(stats.sentimentAvg) }]}>
              {sentimentLabel(stats.sentimentAvg)}
            </Text>
            {trendPercent != null && (
              <Text style={[styles.trendBadge, { color: trendPercent >= 0 ? CYAN : '#D4832A' }]}>
                {trendPercent >= 0 ? '+' : ''}{trendPercent}% vs last month
              </Text>
            )}
          </View>
        </View>

        {/* Keyword glow bars */}
        <View style={styles.barsContainer}>
          {stats.topKeywords.slice(0, 4).map((kw) => {
            const fillW = Math.max(0.05, kw.count / maxKeywordCount);
            return (
              <View key={kw.word} style={styles.barRow}>
                <Text style={styles.barLabel}>{kw.word}</Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${(fillW * 100).toFixed(0)}%`,
                        backgroundColor: LAVENDER,
                        shadowColor: LAVENDER,
                        shadowRadius: 4,
                        shadowOpacity: 0.5,
                        shadowOffset: { width: 0, height: 0 },
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
});

export default MonthlySynthesisCard;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    width: CARD_W,
    height: CARD_H,
    marginBottom: 24,
    marginTop: 8,
    alignSelf: 'center',
    position: 'relative',
  },
  canvas: {
    ...StyleSheet.absoluteFillObject,
    width: CARD_W,
    height: CARD_H,
    borderRadius: BORDER_R,
    overflow: 'hidden',
  },
  content: {
    ...StyleSheet.absoluteFillObject,
    padding: 16,
    paddingTop: 8,
  },
  chapterRow: {
    alignItems: 'center',
    marginBottom: 4,
  },
  chapterDivider: {
    color: 'rgba(201,174,120,0.35)',
    fontSize: 9,
    letterSpacing: 1,
  },
  monthTitle: {
    color: GOLD,
    fontSize: 22,
    fontWeight: '700',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    textAlign: 'center',
    marginBottom: 2,
  },
  entryCount: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  dominantRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  dominantCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(201,174,120,0.18)',
  },
  dominantLabel: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  dominantWord: {
    color: GOLD,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
  trendBadge: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
  },
  barsContainer: {
    gap: 4,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  barLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    width: 64,
    fontWeight: '500',
  },
  barTrack: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
});
