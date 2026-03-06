/**
 * MockDashboardScreen
 *
 * Simplified visual mock of the Home/Dashboard screen for Screenshot #1.
 * Shows: aura orb center, stability graph, insight card, quick-action row.
 * All rendered as static Skia + RN elements — no real data needed.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  Canvas,
  Circle,
  BlurMask,
  SweepGradient,
  vec,
  Path,
  Skia,
  LinearGradient,
  RoundedRect,
  Line,
  Group,
} from '@shopify/react-native-skia';

const PALETTE = {
  gold: '#D8C39A',
  goldLight: '#F3E5AB',
  silverBlue: '#8BC4E8',
  emerald: '#6EBF8B',
  copper: '#CD7F5D',
  rose: '#D4A3B3',
  text: '#FDFBF7',
  textMuted: 'rgba(255,255,255,0.5)',
  surface: '#1E2D47',
  bg: '#0D1421',
  glassBorder: 'rgba(255,255,255,0.06)',
};

interface Props {
  width: number;
  height: number;
}

export default function MockDashboardScreen({ width, height }: Props) {
  const orbSize = width * 0.52;
  const orbCenter = orbSize / 2;
  const cardWidth = width - 32;
  const cardHeight = height * 0.12;

  // Generate a fake Bézier stability graph path
  const graphPath = React.useMemo(() => {
    const gw = cardWidth - 32;
    const gh = cardHeight * 0.5;
    const p = Skia.Path.Make();
    const points = [0.6, 0.45, 0.7, 0.55, 0.8, 0.65, 0.5];
    p.moveTo(16, gh - points[0] * gh + 16);
    for (let i = 1; i < points.length; i++) {
      const x = 16 + (i / (points.length - 1)) * gw;
      const y = gh - points[i] * gh + 16;
      const px = 16 + ((i - 0.5) / (points.length - 1)) * gw;
      p.cubicTo(px, gh - points[i - 1] * gh + 16, px, y, x, y);
    }
    return p;
  }, [cardWidth, cardHeight]);

  return (
    <View style={[styles.container, { width, height }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good morning</Text>
          <Text style={styles.date}>March 4, 2026</Text>
        </View>
        <View style={styles.settingsIcon}>
          <Text style={styles.settingsIconText}>⚙</Text>
        </View>
      </View>

      {/* Aura Orb — the hero element */}
      <View style={[styles.orbContainer, { width: orbSize, height: orbSize }]}>
        <Canvas style={{ width: orbSize, height: orbSize }}>
          {/* Outer glow */}
          <Circle cx={orbCenter} cy={orbCenter} r={orbSize * 0.42} color={PALETTE.gold} opacity={0.15}>
            <BlurMask blur={40} style="normal" />
          </Circle>
          {/* Mid glow */}
          <Circle cx={orbCenter} cy={orbCenter} r={orbSize * 0.32} color={PALETTE.emerald} opacity={0.12}>
            <BlurMask blur={25} style="normal" />
          </Circle>
          {/* Core orb */}
          <Circle cx={orbCenter} cy={orbCenter} r={orbSize * 0.22}>
            <SweepGradient
              c={vec(orbCenter, orbCenter)}
              colors={[PALETTE.gold, PALETTE.emerald, PALETTE.silverBlue, PALETTE.gold]}
            />
            <BlurMask blur={3} style="solid" />
          </Circle>
          {/* Bright center */}
          <Circle cx={orbCenter} cy={orbCenter} r={orbSize * 0.08} color="#FFFFFF" opacity={0.3}>
            <BlurMask blur={12} style="normal" />
          </Circle>
        </Canvas>
      </View>

      {/* Stability Graph Card */}
      <View style={[styles.card, { width: cardWidth, height: cardHeight }]}>
        <Text style={styles.cardLabel}>7-DAY BALANCE</Text>
        <View style={styles.cardRow}>
          <Text style={styles.stabilityValue}>78%</Text>
          <Canvas style={{ width: cardWidth * 0.6, height: cardHeight * 0.65 }}>
            <Path path={graphPath} style="stroke" strokeWidth={2} color={PALETTE.gold}>
              <BlurMask blur={2} style="solid" />
            </Path>
          </Canvas>
        </View>
      </View>

      {/* Wellness Insight Card */}
      <View style={[styles.card, { width: cardWidth, height: cardHeight * 0.7 }]}>
        <Text style={[styles.cardLabel, { color: PALETTE.emerald }]}>WELLNESS INSIGHT</Text>
        <Text style={styles.insightText}>
          Your mood tends to be higher on days when you sleep 7+ hours.
        </Text>
      </View>

      {/* Quick Actions Row */}
      <View style={styles.actionsRow}>
        {[
          { label: 'Weather', emoji: '🌤', color: PALETTE.gold },
          { label: 'Restore', emoji: '🌙', color: PALETTE.silverBlue },
          { label: 'Archive', emoji: '📖', color: PALETTE.rose },
        ].map((action) => (
          <View key={action.label} style={styles.actionCard}>
            <View style={[styles.actionIcon, { backgroundColor: action.color + '20' }]}>
              <Text style={styles.actionEmoji}>{action.emoji}</Text>
            </View>
            <Text style={styles.actionLabel}>{action.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#07090F',
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  greeting: {
    color: PALETTE.text,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Georgia',
  },
  date: {
    color: PALETTE.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  settingsIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIconText: {
    fontSize: 16,
    color: PALETTE.textMuted,
  },
  orbContainer: {
    alignSelf: 'center',
    marginVertical: 8,
  },
  card: {
    backgroundColor: 'rgba(30, 45, 71, 0.5)',
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
    color: PALETTE.gold,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stabilityValue: {
    color: PALETTE.text,
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'Georgia',
  },
  insightText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  actionCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(30, 45, 71, 0.35)',
    borderRadius: 12,
    paddingVertical: 12,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  actionEmoji: {
    fontSize: 18,
  },
  actionLabel: {
    color: PALETTE.textMuted,
    fontSize: 10,
    fontWeight: '500',
  },
});
