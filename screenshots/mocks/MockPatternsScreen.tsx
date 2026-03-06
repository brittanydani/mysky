/**
 * MockPatternsScreen
 *
 * Simplified visual mock of the Insights/Patterns screen for Screenshot #5.
 * Shows: reflection prompt, metric snapshot cards, pattern insight cards, explore grid.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  Canvas,
  Circle,
  BlurMask,
  Path,
  Skia,
  RoundedRect,
  LinearGradient,
  vec,
} from '@shopify/react-native-skia';

const PALETTE = {
  gold: '#D8C39A',
  goldLight: '#F3E5AB',
  silverBlue: '#8BC4E8',
  copper: '#CD7F5D',
  emerald: '#6EBF8B',
  amethyst: '#9D76C1',
  text: '#FDFBF7',
  textMuted: 'rgba(255,255,255,0.5)',
  glassBorder: 'rgba(255,255,255,0.06)',
  surface: 'rgba(30, 45, 71, 0.5)',
};

interface Props {
  width: number;
  height: number;
}

function MetricCard({
  label,
  value,
  color,
  trend,
}: {
  label: string;
  value: string;
  color: string;
  trend?: string;
}) {
  return (
    <View style={[metricStyles.card, { borderColor: color + '20' }]}>
      <Text style={[metricStyles.label, { color }]}>{label}</Text>
      <Text style={metricStyles.value}>{value}</Text>
      {trend && <Text style={[metricStyles.trend, { color }]}>{trend}</Text>}
    </View>
  );
}

function PatternCard({
  label,
  text,
  color,
}: {
  label: string;
  text: string;
  color: string;
}) {
  return (
    <View style={patternStyles.card}>
      <View style={[patternStyles.indicator, { backgroundColor: color }]} />
      <View style={patternStyles.content}>
        <Text style={[patternStyles.label, { color }]}>{label}</Text>
        <Text style={patternStyles.text}>{text}</Text>
      </View>
    </View>
  );
}

export default function MockPatternsScreen({ width, height }: Props) {
  const cardWidth = width - 32;

  // Scatter plot dots
  const scatterDots = React.useMemo(() => {
    const dots: { x: number; y: number; r: number; color: string }[] = [];
    const seed = 42;
    let s = seed;
    const next = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
    const colors = [PALETTE.gold, PALETTE.silverBlue, PALETTE.copper, PALETTE.emerald];
    for (let i = 0; i < 24; i++) {
      dots.push({
        x: 20 + next() * (cardWidth - 68),
        y: 10 + next() * 55,
        r: 2 + next() * 4,
        color: colors[Math.floor(next() * colors.length)],
      });
    }
    return dots;
  }, [cardWidth]);

  return (
    <View style={[styles.container, { width, height }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Today's Reflection</Text>
        <Text style={styles.subtitle}>Signal field · Pattern recognition</Text>
      </View>

      {/* Daily Prompt Card */}
      <View style={[styles.promptCard, { width: cardWidth }]}>
        <Text style={styles.promptIcon}>✨</Text>
        <Text style={styles.promptText}>
          What patterns have you noticed between your energy levels and how you spend your mornings?
        </Text>
        <View style={styles.promptActions}>
          <View style={[styles.promptBtn, { backgroundColor: 'rgba(139,196,232,0.15)' }]}>
            <Text style={[styles.promptBtnText, { color: PALETTE.silverBlue }]}>Log Mood</Text>
          </View>
          <View style={[styles.promptBtn, { backgroundColor: 'rgba(212, 175, 55,0.15)' }]}>
            <Text style={[styles.promptBtnText, { color: PALETTE.gold }]}>Write Journal</Text>
          </View>
        </View>
      </View>

      {/* Metric Snapshot Row */}
      <Text style={styles.sectionLabel}>THIS WEEK</Text>
      <View style={styles.metricsRow}>
        <MetricCard label="AVG MOOD" value="7.2" color={PALETTE.silverBlue} />
        <MetricCard label="STRESS" value="3.8" color={PALETTE.copper} trend="↓ trending" />
        <MetricCard label="LOGGED" value="14" color={PALETTE.gold} />
      </View>

      {/* Correlation Scatter Chart */}
      <View style={[styles.card, { width: cardWidth, height: 100 }]}>
        <Text style={[styles.cardLabel, { color: PALETTE.copper }]}>MOOD × SLEEP CORRELATION</Text>
        <Canvas style={{ width: cardWidth - 28, height: 65 }}>
          {scatterDots.map((dot, i) => (
            <Circle key={i} cx={dot.x} cy={dot.y} r={dot.r} color={dot.color} opacity={0.7}>
              <BlurMask blur={1} style="solid" />
            </Circle>
          ))}
        </Canvas>
      </View>

      {/* Pattern Cards */}
      <Text style={styles.sectionLabel}>YOUR PATTERNS</Text>
      <PatternCard
        label="Where it connects"
        text="Higher mood days correlate with 7+ hours of sleep and morning exercise."
        color={PALETTE.silverBlue}
      />
      <PatternCard
        label="From your journal"
        text="Gratitude themes appear 3× more on days rated above 7."
        color={PALETTE.emerald}
      />
      <PatternCard
        label="Emotion tone"
        text="Your emotional range has expanded over the past two weeks."
        color={PALETTE.gold}
      />

      {/* Explore Grid */}
      <View style={styles.exploreGrid}>
        {[
          { label: 'My Story', emoji: '📖', color: PALETTE.gold },
          { label: 'Healing', emoji: '💚', color: PALETTE.emerald },
          { label: 'Journal', emoji: '✍️', color: PALETTE.silverBlue },
          { label: 'Profile', emoji: '🌙', color: PALETTE.amethyst },
        ].map((item) => (
          <View key={item.label} style={styles.exploreChip}>
            <View style={[styles.exploreIcon, { backgroundColor: item.color + '15' }]}>
              <Text style={styles.exploreEmoji}>{item.emoji}</Text>
            </View>
            <Text style={styles.exploreLabel}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const metricStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: 'rgba(30, 45, 71, 0.4)',
    borderRadius: 12,
    padding: 10,
    marginHorizontal: 3,
    borderWidth: 1,
    alignItems: 'center',
  },
  label: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  value: {
    color: PALETTE.text,
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Georgia',
  },
  trend: {
    fontSize: 8,
    marginTop: 2,
    fontWeight: '500',
  },
});

const patternStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30, 45, 71, 0.35)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
    padding: 12,
    marginBottom: 8,
  },
  indicator: {
    width: 3,
    borderRadius: 2,
    marginRight: 10,
  },
  content: {
    flex: 1,
  },
  label: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  text: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 11,
    lineHeight: 16,
  },
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#07090F',
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  header: {
    marginBottom: 10,
  },
  title: {
    color: PALETTE.text,
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Georgia',
  },
  subtitle: {
    color: PALETTE.textMuted,
    fontSize: 11,
    marginTop: 2,
    fontStyle: 'italic',
  },
  promptCard: {
    backgroundColor: 'rgba(139,196,232,0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(139,196,232,0.15)',
    padding: 16,
    marginBottom: 12,
  },
  promptIcon: {
    fontSize: 18,
    marginBottom: 8,
  },
  promptText: {
    color: PALETTE.text,
    fontSize: 14,
    fontFamily: 'Georgia',
    lineHeight: 20,
    marginBottom: 12,
  },
  promptActions: {
    flexDirection: 'row',
    gap: 8,
  },
  promptBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  promptBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sectionLabel: {
    color: PALETTE.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 8,
    marginTop: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  card: {
    backgroundColor: PALETTE.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
    padding: 14,
    marginBottom: 10,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  exploreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  exploreChip: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 45, 71, 0.3)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
  },
  exploreIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  exploreEmoji: {
    fontSize: 14,
  },
  exploreLabel: {
    color: PALETTE.text,
    fontSize: 11,
    fontWeight: '500',
  },
});
