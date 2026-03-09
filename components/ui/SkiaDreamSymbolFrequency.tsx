/**
 * SkiaDreamSymbolFrequency — Dream Emotional Motif Chart
 *
 * Renders the top recurring emotional motifs from dream journal entries
 * as horizontal "Glow Capsule" bars. Each bar represents how often a
 * feeling appeared across the user's dream log.
 *
 * Data source: SleepEntry.dreamFeelings (JSON: SelectedFeeling[]) +
 *              SleepEntry.dreamMetadata (JSON: DreamMetadata.overallTheme)
 */
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import { Canvas, RoundedRect, LinearGradient as SkiaLinearGradient, vec, BlurMask } from '@shopify/react-native-skia';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { SleepEntry } from '../../services/storage/models';

const { width: SCREEN_W } = Dimensions.get('window');

// ── Colour mapping for feeling valence groups ──────────────────────────────────

// Map of known feeling IDs to display names (curated top-40 most common)
const FEELING_LABELS: Record<string, string> = {
  anxious: 'Anxious', calm: 'Calm', hopeful: 'Hopeful',
  excited: 'Excited', sad: 'Sad', confused: 'Confused',
  curious: 'Curious', angry: 'Angry', frustrated: 'Frustrated',
  overwhelmed: 'Overwhelmed', safe: 'Safe', peaceful: 'Peaceful',
  lonely: 'Lonely', connected: 'Connected', grounded: 'Grounded',
  afraid: 'Afraid', joyful: 'Joyful', numb: 'Numb',
  heavy: 'Heavy', determined: 'Determined', inspired: 'Inspired',
  lost: 'Lost', empowered: 'Empowered', ashamed: 'Ashamed',
  relieved: 'Relieved', longing: 'Longing', hopeless: 'Hopeless',
  stressed: 'Stressed', grateful: 'Grateful', powerless: 'Powerless',
  trapped: 'Trapped', nostalgic: 'Nostalgic', yearning: 'Yearning',
  dissociated: 'Dissociated', hollow: 'Hollow', free: 'Free',
  warm: 'Warm', seen: 'Seen', understood: 'Understood', restless: 'Restless',
};

// Simple valence classification for color
const POSITIVE_FEELINGS = new Set([
  'calm', 'hopeful', 'excited', 'curious', 'safe', 'peaceful', 'connected',
  'grounded', 'joyful', 'determined', 'inspired', 'empowered', 'relieved',
  'grateful', 'free', 'warm', 'seen', 'understood', 'chosen', 'happy',
  'playful', 'alive', 'brave', 'supported',
]);
const NEGATIVE_FEELINGS = new Set([
  'anxious', 'sad', 'confused', 'angry', 'frustrated', 'overwhelmed',
  'lonely', 'afraid', 'numb', 'heavy', 'lost', 'ashamed', 'longing',
  'hopeless', 'stressed', 'powerless', 'trapped', 'dissociated', 'hollow',
  'restless', 'abandoned', 'exposed', 'rejected', 'helpless', 'guilty',
  'grieving', 'terrified',
]);

function feelingColor(id: string): string {
  if (POSITIVE_FEELINGS.has(id)) return theme.energy;         // emerald
  if (NEGATIVE_FEELINGS.has(id)) return theme.cinematic?.copper ?? '#CD7F5D'; // copper
  return theme.growth ?? '#8BC4E8';                           // silverBlue / neutral
}

// Dream theme labels
const THEME_LABELS: Record<string, string> = {
  adventure: 'Adventure', conflict: 'Conflict', connection: 'Connection',
  transformation: 'Transformation', mystery: 'Mystery', survival: 'Survival',
  loss: 'Loss', discovery: 'Discovery', mundane: 'Mundane', surreal: 'Surreal',
};

interface FrequencyItem {
  id: string;
  label: string;
  count: number;
  pct: number;   // 0–1
  color: string;
  isTheme: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  sleepEntries: SleepEntry[];
  width?: number;
}

export default function SkiaDreamSymbolFrequency({
  sleepEntries,
  width = SCREEN_W - 40,
}: Props) {
  const items: FrequencyItem[] = useMemo(() => {
    const feelingCounts: Record<string, number> = {};
    const themeCounts: Record<string, number> = {};

    for (const entry of sleepEntries) {
      // Aggregate feelings
      if (entry.dreamFeelings) {
        try {
          const parsed = JSON.parse(entry.dreamFeelings) as { id: string; intensity?: number }[];
          for (const f of parsed) {
            feelingCounts[f.id] = (feelingCounts[f.id] ?? 0) + 1;
          }
        } catch {}
      }

      // Aggregate themes from metadata
      if (entry.dreamMetadata) {
        try {
          const meta = JSON.parse(entry.dreamMetadata) as { overallTheme?: string };
          if (meta.overallTheme) {
            themeCounts[meta.overallTheme] = (themeCounts[meta.overallTheme] ?? 0) + 1;
          }
        } catch {}
      }
    }

    const all: FrequencyItem[] = [];

    for (const [id, count] of Object.entries(feelingCounts)) {
      const label = FEELING_LABELS[id] ?? id.charAt(0).toUpperCase() + id.slice(1);
      all.push({ id, label, count, pct: 0, color: feelingColor(id), isTheme: false });
    }
    for (const [id, count] of Object.entries(themeCounts)) {
      const label = THEME_LABELS[id] ?? id.charAt(0).toUpperCase() + id.slice(1);
      all.push({ id: `theme_${id}`, label, count, pct: 0, color: theme.textGold, isTheme: true });
    }

    all.sort((a, b) => b.count - a.count);
    const top = all.slice(0, 7);
    const maxCount = top[0]?.count ?? 1;
    top.forEach(item => { item.pct = item.count / maxCount; });
    return top;
  }, [sleepEntries]);

  if (items.length === 0) {
    return (
      <View style={[styles.emptyCard, { width }]}>
        <Ionicons name="moon" size={26} color={theme.textSecondary} />
        <Text style={styles.emptyText}>Log dreams to reveal your recurring emotional motifs</Text>
      </View>
    );
  }

  const BAR_HEIGHT = 28;
  const GAP = 10;
  const LABEL_W = 100;
  const BAR_AREA_W = width - LABEL_W - 56; // 56 = count text + padding
  const CANVAS_H = items.length * (BAR_HEIGHT + GAP);

  return (
    <View style={{ width }}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Dream Motifs</Text>
          <Text style={styles.subtitle}>Recurring emotional themes · last {sleepEntries.length} dreams</Text>
        </View>
        <Ionicons name="moon-outline" size={18} color={theme.textGold} />
      </View>

      {/* Bars */}
      <View style={[styles.card, { width }]}>
        {items.map((item, i) => {
          const barW = Math.max(8, Math.round(item.pct * BAR_AREA_W));
          return (
            <View key={item.id} style={styles.barRow}>
              {/* Label */}
              <View style={styles.labelContainer}>
                {item.isTheme && (
                  <View style={[styles.themeDot, { backgroundColor: item.color }]} />
                )}
                <Text style={styles.barLabel} numberOfLines={1}>{item.label}</Text>
              </View>

              {/* Bar track */}
              <View style={[styles.barTrack, { width: BAR_AREA_W }]}>
                {/* Background track */}
                <View style={[styles.barBg, { width: BAR_AREA_W }]} />

                {/* Glow capsule */}
                <View
                  style={[
                    styles.barFill,
                    {
                      width: barW,
                      backgroundColor: `${item.color}22`,
                      borderColor: `${item.color}55`,
                    },
                  ]}
                >
                  {/* Inner highlight strip */}
                  <View
                    style={[
                      styles.barHighlight,
                      { backgroundColor: `${item.color}88`, width: Math.max(4, barW * 0.35) },
                    ]}
                  />
                </View>
              </View>

              {/* Count */}
              <Text style={[styles.countText, { color: `${item.color}CC` }]}>{item.count}×</Text>
            </View>
          );
        })}

        {/* Legend */}
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: theme.energy }]} />
            <Text style={styles.legendText}>Positive</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: theme.cinematic?.copper ?? '#CD7F5D' }]} />
            <Text style={styles.legendText}>Negative</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: theme.growth ?? '#8BC4E8' }]} />
            <Text style={styles.legendText}>Neutral</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: theme.textGold }]} />
            <Text style={styles.legendText}>Theme</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.textPrimary,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  },
  subtitle: {
    fontSize: 11,
    color: theme.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  card: {
    borderRadius: 20,
    backgroundColor: 'rgba(14,24,48,0.32)',
    borderWidth: 1,
    borderColor: theme.cardBorder,
    padding: 16,
    gap: 8,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 28,
  },
  labelContainer: {
    width: 96,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  themeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    flexShrink: 0,
  },
  barLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    fontWeight: '600',
    flex: 1,
  },
  barTrack: {
    height: 20,
    justifyContent: 'center',
    position: 'relative',
  },
  barBg: {
    position: 'absolute',
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  barFill: {
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  barHighlight: {
    position: 'absolute',
    top: 4,
    left: 6,
    height: 4,
    borderRadius: 2,
    opacity: 0.6,
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
    width: 28,
    textAlign: 'right',
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    marginTop: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    color: theme.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyCard: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    backgroundColor: 'rgba(14,24,48,0.32)',
    gap: 10,
    paddingHorizontal: 32,
  },
  emptyText: {
    color: theme.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    fontStyle: 'italic',
  },
});
