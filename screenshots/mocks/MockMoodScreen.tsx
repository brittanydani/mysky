/**
 * MockMoodScreen
 *
 * Simplified visual mock of the Mood Check-In screen for Screenshot #2.
 * Shows: aura orb, three colored sliders, tag pills, trend graph.
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
  RoundedRect,
  LinearGradient,
} from '@shopify/react-native-skia';

const PALETTE = {
  gold: '#C5B493',
  energy: '#6FB3D3',
  stress: '#E07B7B',
  text: '#FDFBF7',
  textMuted: 'rgba(255,255,255,0.5)',
  glassBorder: 'rgba(255,255,255,0.06)',
  surface: 'rgba(30, 45, 71, 0.5)',
};

interface Props {
  width: number;
  height: number;
}

// Fake slider component
function MockSlider({
  label,
  value,
  color,
  width: w,
}: {
  label: string;
  value: number;
  color: string;
  width: number;
}) {
  const trackWidth = w - 80;
  const fillWidth = trackWidth * (value / 10);

  return (
    <View style={sliderStyles.row}>
      <Text style={[sliderStyles.label, { color }]}>{label}</Text>
      <View style={[sliderStyles.track, { width: trackWidth }]}>
        <View style={[sliderStyles.fill, { width: fillWidth, backgroundColor: color }]} />
        <View
          style={[
            sliderStyles.thumb,
            {
              left: fillWidth - 8,
              backgroundColor: color,
              shadowColor: color,
            },
          ]}
        />
      </View>
      <Text style={sliderStyles.value}>{value}</Text>
    </View>
  );
}

export default function MockMoodScreen({ width, height }: Props) {
  const orbSize = width * 0.38;
  const orbCenter = orbSize / 2;
  const cardWidth = width - 32;

  // Fake trend line
  const trendPath = React.useMemo(() => {
    const gw = cardWidth - 40;
    const gh = 60;
    const p = Skia.Path.Make();
    const pts = [0.5, 0.6, 0.55, 0.75, 0.7, 0.65, 0.8];
    p.moveTo(20, gh - pts[0] * gh + 10);
    for (let i = 1; i < pts.length; i++) {
      const x = 20 + (i / (pts.length - 1)) * gw;
      const y = gh - pts[i] * gh + 10;
      p.lineTo(x, y);
    }
    return p;
  }, [cardWidth]);

  return (
    <View style={[styles.container, { width, height }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Internal Weather</Text>
        <Text style={styles.subtitle}>March 4, 2026</Text>
      </View>

      {/* Streak */}
      <View style={styles.streakRow}>
        <Text style={styles.streakIcon}>🔥</Text>
        <Text style={styles.streakText}>12 day streak</Text>
      </View>

      {/* Aura Orb (smaller for this screen) */}
      <View style={[styles.orbContainer, { width: orbSize, height: orbSize }]}>
        <Canvas style={{ width: orbSize, height: orbSize }}>
          <Circle cx={orbCenter} cy={orbCenter} r={orbSize * 0.4} color={PALETTE.gold} opacity={0.12}>
            <BlurMask blur={30} style="normal" />
          </Circle>
          <Circle cx={orbCenter} cy={orbCenter} r={orbSize * 0.25}>
            <SweepGradient
              c={vec(orbCenter, orbCenter)}
              colors={[PALETTE.gold, PALETTE.energy, PALETTE.gold]}
            />
            <BlurMask blur={3} style="solid" />
          </Circle>
        </Canvas>
      </View>

      {/* Quick Check-In Card */}
      <View style={[styles.card, { width: cardWidth }]}>
        <Text style={styles.cardTitle}>Quick Check-In</Text>

        {/* Time of day pills */}
        <View style={styles.timeRow}>
          {['🌅 Morning', '☀️ Afternoon', '🌆 Evening', '🌙 Night'].map((t, i) => (
            <View key={t} style={[styles.timePill, i === 0 && styles.timePillActive]}>
              <Text style={[styles.timePillText, i === 0 && styles.timePillTextActive]}>
                {t}
              </Text>
            </View>
          ))}
        </View>

        {/* Sliders */}
        <MockSlider label="Mood" value={7} color={PALETTE.gold} width={cardWidth} />
        <MockSlider label="Energy" value={6} color={PALETTE.energy} width={cardWidth} />
        <MockSlider label="Stress" value={3} color={PALETTE.stress} width={cardWidth} />

        {/* Influence tags */}
        <View style={styles.tagsRow}>
          {['😴 Sleep', '💼 Work', '🏃 Exercise', '👥 Social'].map((tag, i) => (
            <View key={tag} style={[styles.tag, i < 2 && styles.tagActive]}>
              <Text style={[styles.tagText, i < 2 && styles.tagTextActive]}>{tag}</Text>
            </View>
          ))}
        </View>

        {/* Save button */}
        <View style={styles.saveButton}>
          <Text style={styles.saveText}>Save Check-In</Text>
        </View>
      </View>

      {/* Trend Graph */}
      <View style={[styles.card, { width: cardWidth, height: 100 }]}>
        <Text style={styles.cardLabel}>7-DAY TRENDS</Text>
        <Canvas style={{ width: cardWidth - 28, height: 70 }}>
          <Path path={trendPath} style="stroke" strokeWidth={2} color={PALETTE.gold}>
            <BlurMask blur={2} style="solid" />
          </Path>
        </Canvas>
      </View>
    </View>
  );
}

const sliderStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  label: {
    width: 48,
    fontSize: 11,
    fontWeight: '600',
  },
  track: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    position: 'relative',
  },
  fill: {
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  thumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
    position: 'absolute',
    top: -6,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  value: {
    width: 24,
    textAlign: 'right',
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '600',
  },
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#07090F',
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  header: {
    marginBottom: 6,
  },
  title: {
    color: '#FDFBF7',
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Georgia',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    marginTop: 2,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  streakIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  streakText: {
    color: PALETTE.gold,
    fontSize: 12,
    fontWeight: '600',
  },
  orbContainer: {
    alignSelf: 'center',
    marginVertical: 4,
  },
  card: {
    backgroundColor: PALETTE.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
    padding: 14,
    marginBottom: 10,
  },
  cardTitle: {
    color: '#FDFBF7',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Georgia',
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.2,
    color: PALETTE.gold,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  timeRow: {
    flexDirection: 'row',
    marginBottom: 10,
    gap: 4,
  },
  timePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  timePillActive: {
    backgroundColor: 'rgba(212, 175, 55,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55,0.4)',
  },
  timePillText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 9,
  },
  timePillTextActive: {
    color: PALETTE.gold,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  tagActive: {
    backgroundColor: 'rgba(212, 175, 55,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55,0.3)',
  },
  tagText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
  },
  tagTextActive: {
    color: PALETTE.gold,
  },
  saveButton: {
    marginTop: 12,
    backgroundColor: PALETTE.gold,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  saveText: {
    color: '#1A1A1A',
    fontSize: 13,
    fontWeight: '700',
  },
});
