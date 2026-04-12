/**
 * MockJournalScreen
 *
 * Simplified visual mock of the Journal screen for Screenshot #3.
 * Shows: breathing portal hint, journal entries, trend graph, FAB.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  Canvas,
  Circle,
  BlurMask,
  Path,
  Skia,
  SweepGradient,
  vec,
} from '@shopify/react-native-skia';

const PALETTE = {
  gold: '#D8C39A',
  goldLight: '#F3E5AB',
  indigo: '#2D3A5C',
  rose: '#D4A3B3',
  amethyst: '#9D76C1',
  silverBlue: '#A2C2E1',
  text: '#F8FAFC',
  textMuted: 'rgba(255,255,255,0.5)',
  glassBorder: 'rgba(255,255,255,0.06)',
  surface: 'rgba(30, 45, 71, 0.5)',
};

interface Props {
  width: number;
  height: number;
}

function JournalEntry({
  title,
  date,
  moodColor,
  words,
  width: w,
}: {
  title: string;
  date: string;
  moodColor: string;
  words: number;
  width: number;
}) {
  return (
    <View style={[entryStyles.card, { width: w }]}>
      <View style={entryStyles.row}>
        <View style={[entryStyles.moodDot, { backgroundColor: moodColor }]} />
        <View style={entryStyles.textCol}>
          <Text style={entryStyles.title} numberOfLines={1}>{title}</Text>
          <Text style={entryStyles.meta}>{date} · {words} words</Text>
        </View>
      </View>
    </View>
  );
}

export default function MockJournalScreen({ width, height }: Props) {
  const portalSize = width * 0.3;
  const portalCenter = portalSize / 2;
  const cardWidth = width - 32;

  // Trend graph path
  const trendPath = React.useMemo(() => {
    const gw = cardWidth - 40;
    const gh = 50;
    const p = Skia.Path.Make();
    const pts = [0.4, 0.55, 0.5, 0.65, 0.6, 0.7, 0.55];
    p.moveTo(20, gh - pts[0] * gh + 8);
    for (let i = 1; i < pts.length; i++) {
      p.lineTo(20 + (i / (pts.length - 1)) * gw, gh - pts[i] * gh + 8);
    }
    return p;
  }, [cardWidth]);

  return (
    <View style={[styles.container, { width, height }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Archive</Text>
        <Text style={styles.subtitle}>Subconscious field · Pattern memory</Text>
      </View>

      {/* Breathing Portal (small, glowing ring) */}
      <View style={[styles.portalContainer, { width: portalSize, height: portalSize }]}>
        <Canvas style={{ width: portalSize, height: portalSize }}>
          <Circle cx={portalCenter} cy={portalCenter} r={portalSize * 0.38} color={PALETTE.indigo} opacity={0.2}>
            <BlurMask blur={20} style="normal" />
          </Circle>
          <Circle cx={portalCenter} cy={portalCenter} r={portalSize * 0.3}>
            <SweepGradient
              c={vec(portalCenter, portalCenter)}
              colors={[PALETTE.indigo, PALETTE.rose, PALETTE.amethyst, PALETTE.indigo]}
            />
            <BlurMask blur={4} style="solid" />
          </Circle>
          <Circle cx={portalCenter} cy={portalCenter} r={portalSize * 0.18} color="#020817" />
          <Circle cx={portalCenter} cy={portalCenter} r={portalSize * 0.1} color={PALETTE.amethyst} opacity={0.15}>
            <BlurMask blur={10} style="normal" />
          </Circle>
        </Canvas>
        <Text style={styles.portalLabel}>Breathe to begin</Text>
      </View>

      {/* 7-Day Somatic Trends */}
      <View style={[styles.card, { width: cardWidth, height: 90 }]}>
        <Text style={styles.cardLabel}>7-DAY SOMATIC TRENDS</Text>
        <Canvas style={{ width: cardWidth - 28, height: 55 }}>
          <Path path={trendPath} style="stroke" strokeWidth={2} color={PALETTE.silverBlue}>
            <BlurMask blur={2} style="solid" />
          </Path>
        </Canvas>
      </View>

      {/* Pattern Insights */}
      <View style={[styles.card, { width: cardWidth }]}>
        <Text style={[styles.cardLabel, { color: PALETTE.amethyst }]}>PATTERN INSIGHTS</Text>
        <Text style={styles.insightText}>
          Your journaling depth increases on days with better sleep quality.
        </Text>
        <View style={styles.confidenceBadge}>
          <Text style={styles.confidenceText}>strong</Text>
        </View>
      </View>

      {/* Recent Entries */}
      <Text style={styles.sectionTitle}>Recent Entries (14)</Text>
      <JournalEntry
        title="Morning clarity after the storm"
        date="Mar 4"
        moodColor={PALETTE.goldLight}
        words={342}
        width={cardWidth}
      />
      <JournalEntry
        title="Quiet evening reflection"
        date="Mar 3"
        moodColor={PALETTE.silverBlue}
        words={218}
        width={cardWidth}
      />
      <JournalEntry
        title="Processing yesterday's energy"
        date="Mar 2"
        moodColor={PALETTE.rose}
        words={156}
        width={cardWidth}
      />

      {/* FAB */}
      <View style={styles.fab}>
        <Text style={styles.fabIcon}>+</Text>
      </View>
    </View>
  );
}

const entryStyles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(30, 45, 71, 0.4)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
    padding: 12,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moodDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  textCol: {
    flex: 1,
  },
  title: {
    color: PALETTE.text,
    fontSize: 13,
    fontWeight: '600',
  },
  meta: {
    color: PALETTE.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#020817',
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
  portalContainer: {
    alignSelf: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  portalLabel: {
    color: PALETTE.textMuted,
    fontSize: 10,
    marginTop: 4,
    fontStyle: 'italic',
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
    color: PALETTE.silverBlue,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  insightText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    lineHeight: 18,
  },
  confidenceBadge: {
    alignSelf: 'flex-start',
    marginTop: 6,
    backgroundColor: 'rgba(157, 118, 193, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  confidenceText: {
    color: PALETTE.amethyst,
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionTitle: {
    color: PALETTE.text,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Georgia',
    marginBottom: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: PALETTE.gold,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PALETTE.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  fabIcon: {
    color: '#0B1220',
    fontSize: 28,
    fontWeight: '300',
    marginTop: -2,
  },
});
