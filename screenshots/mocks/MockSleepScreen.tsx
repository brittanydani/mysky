/**
 * MockSleepScreen
 *
 * Simplified visual mock of the Sleep / Restoration screen for Screenshot #4.
 * Shows: moon quality rating, radial moon dragger, duration, dream journal area, sleep graph.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  Canvas,
  Circle,
  BlurMask,
  Path,
  Skia,
} from '@shopify/react-native-skia';

const PALETTE = {
  silverBlue: '#A2C2E1',
  silverBlueDim: 'rgba(212, 175, 55,0.2)',
  amethyst: '#9D76C1',
  gold: '#D8C39A',
  emerald: '#6EBF8B',
  text: '#F8FAFC',
  textMuted: 'rgba(255,255,255,0.5)',
  glassBorder: 'rgba(255,255,255,0.06)',
  surface: 'rgba(30, 45, 71, 0.5)',
};

interface Props {
  width: number;
  height: number;
}

export default function MockSleepScreen({ width, height }: Props) {
  const dialSize = width * 0.42;
  const dialCenter = dialSize / 2;
  const cardWidth = width - 32;

  // Sleep graph path
  const sleepPath = React.useMemo(() => {
    const gw = cardWidth - 40;
    const gh = 50;
    const p = Skia.Path.Make();
    const pts = [0.6, 0.55, 0.7, 0.65, 0.8, 0.75, 0.72];
    p.moveTo(20, gh - pts[0] * gh + 8);
    for (let i = 1; i < pts.length; i++) {
      const x = 20 + (i / (pts.length - 1)) * gw;
      const y = gh - pts[i] * gh + 8;
      p.lineTo(x, y);
    }
    return p;
  }, [cardWidth]);

  // Moon dial arc
  const dialArc = React.useMemo(() => {
    const p = Skia.Path.Make();
    const r = dialSize * 0.38;
    // Draw an arc from ~-150° to +30° (sleep duration indicator)
    for (let deg = -150; deg <= 30; deg += 2) {
      const rad = (deg * Math.PI) / 180;
      const x = dialCenter + r * Math.cos(rad);
      const y = dialCenter + r * Math.sin(rad);
      if (deg === -150) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    return p;
  }, [dialSize, dialCenter]);

  return (
    <View style={[styles.container, { width, height }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Restoration</Text>
        <Text style={styles.subtitle}>Circadian field · Rest architecture</Text>
      </View>

      {/* Main Card */}
      <View style={[styles.card, { width: cardWidth }]}>
        {/* Moon quality rating */}
        <Text style={styles.questionLabel}>How rested do you feel?</Text>
        <View style={styles.moonRow}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Text
              key={i}
              style={[
                styles.moonIcon,
                { color: i <= 4 ? PALETTE.silverBlue : PALETTE.silverBlueDim },
              ]}
            >
              {i <= 4 ? '🌕' : '🌑'}
            </Text>
          ))}
        </View>

        {/* Moon Dial */}
        <View style={[styles.dialContainer, { width: dialSize, height: dialSize }]}>
          <Canvas style={{ width: dialSize, height: dialSize }}>
            {/* Dial background ring */}
            <Circle
              cx={dialCenter}
              cy={dialCenter}
              r={dialSize * 0.38}
              style="stroke"
              strokeWidth={6}
              color="rgba(255,255,255,0.06)"
            />
            {/* Filled arc — silverBlue */}
            <Path
              path={dialArc}
              style="stroke"
              strokeWidth={6}
              strokeCap="round"
              color={PALETTE.silverBlue}
            >
              <BlurMask blur={2} style="solid" />
            </Path>
            {/* Outer glow */}
            <Circle cx={dialCenter} cy={dialCenter} r={dialSize * 0.35} color={PALETTE.silverBlue} opacity={0.06}>
              <BlurMask blur={20} style="normal" />
            </Circle>
            {/* Center moon icon glow */}
            <Circle cx={dialCenter} cy={dialCenter} r={dialSize * 0.12} color={PALETTE.silverBlue} opacity={0.2}>
              <BlurMask blur={10} style="normal" />
            </Circle>
          </Canvas>
          <Text style={styles.dialLabel}>🌙</Text>
        </View>

        {/* Duration display */}
        <View style={styles.durationRow}>
          <View style={styles.stepperBtn}>
            <Text style={styles.stepperText}>−</Text>
          </View>
          <View style={styles.durationDisplay}>
            <Text style={styles.durationValue}>7.5</Text>
            <Text style={styles.durationUnit}>hours</Text>
          </View>
          <View style={styles.stepperBtn}>
            <Text style={styles.stepperText}>+</Text>
          </View>
        </View>

        {/* Dream journal preview */}
        <View style={styles.dreamSection}>
          <Text style={[styles.cardLabel, { color: PALETTE.amethyst }]}>DREAM JOURNAL</Text>
          <View style={styles.dreamInput}>
            <Text style={styles.dreamPlaceholder}>Flying over mountains, crystal water...</Text>
          </View>
        </View>

        {/* Dream feeling pills */}
        <View style={styles.feelingsRow}>
          {['Peaceful', 'Vivid', 'Strange'].map((f, i) => (
            <View key={f} style={[styles.feelingPill, i === 0 && styles.feelingActive]}>
              <Text style={[styles.feelingText, i === 0 && styles.feelingTextActive]}>{f}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Sleep Trend Graph */}
      <View style={[styles.card, { width: cardWidth, height: 90 }]}>
        <Text style={styles.cardLabel}>SLEEP TRENDS</Text>
        <Canvas style={{ width: cardWidth - 28, height: 55 }}>
          <Path path={sleepPath} style="stroke" strokeWidth={2} color={PALETTE.silverBlue}>
            <BlurMask blur={2} style="solid" />
          </Path>
        </Canvas>
      </View>
    </View>
  );
}

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
  questionLabel: {
    color: PALETTE.text,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Georgia',
    textAlign: 'center',
    marginBottom: 10,
  },
  moonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 10,
  },
  moonIcon: {
    fontSize: 22,
  },
  dialContainer: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  dialLabel: {
    position: 'absolute',
    fontSize: 24,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginVertical: 10,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperText: {
    color: PALETTE.silverBlue,
    fontSize: 18,
    fontWeight: '600',
  },
  durationDisplay: {
    alignItems: 'center',
  },
  durationValue: {
    color: PALETTE.text,
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'Georgia',
  },
  durationUnit: {
    color: PALETTE.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  dreamSection: {
    marginTop: 8,
  },
  dreamInput: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
    padding: 10,
    minHeight: 36,
    borderWidth: 1,
    borderColor: 'rgba(157, 118, 193, 0.15)',
  },
  dreamPlaceholder: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
    fontStyle: 'italic',
  },
  feelingsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  feelingPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  feelingActive: {
    backgroundColor: 'rgba(212, 175, 55,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55,0.3)',
  },
  feelingText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
  },
  feelingTextActive: {
    color: PALETTE.silverBlue,
  },
});
