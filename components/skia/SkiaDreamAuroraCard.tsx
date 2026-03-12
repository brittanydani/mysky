import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Canvas, Rect, LinearGradient, BlurMask, Circle, vec } from '@shopify/react-native-skia';

type DreamTone = 'calm' | 'light' | 'mixed';

interface Props {
  width?: number;
  dreamTone?: DreamTone;
  quality?: number; // 1–5
  seed?: number;
  children?: React.ReactNode;
}

const TONE_PALETTES: Record<DreamTone, [string, string, string]> = {
  calm:  ['rgba(73,180,255,0.18)', 'rgba(80,30,140,0.30)', 'rgba(10,14,30,0.85)'],
  light: ['rgba(255,218,3,0.14)',  'rgba(200,107,255,0.20)', 'rgba(10,14,30,0.80)'],
  mixed: ['rgba(231,13,152,0.14)', 'rgba(55,80,180,0.22)',  'rgba(10,14,30,0.85)'],
};

const HEIGHT = 100;

function SkiaDreamAuroraCard({ width = 320, dreamTone = 'calm', quality = 3, seed = 0, children }: Props) {
  const palette = TONE_PALETTES[dreamTone];
  const glowAlpha = 0.06 + (quality / 5) * 0.14;
  const glowColor = palette[0].replace(/[\d.]+\)$/, `${glowAlpha})`);

  // Deterministic offsets from seed
  const ox1 = (seed % 7) / 7;
  const ox2 = ((seed + 3) % 7) / 7;
  const childH = React.Children.count(children) > 0 ? undefined : HEIGHT;

  return (
    <View style={[styles.card, { width, borderColor: palette[0].replace(/[\d.]+\)$/, '0.22)') }]}>
      <View style={[StyleSheet.absoluteFill, { overflow: 'hidden', borderRadius: 16 }]} pointerEvents="none">
        <Canvas style={{ width, height: HEIGHT + 40 }}>
          {/* Aurora gradient background */}
          <Rect x={0} y={0} width={width} height={HEIGHT + 40} color="transparent">
            <LinearGradient
              start={vec(0, 0)}
              end={vec(width, HEIGHT + 40)}
              colors={palette}
            />
          </Rect>

          {/* Nebula orbs */}
          <Circle cx={width * (0.2 + ox1 * 0.3)} cy={HEIGHT * 0.4} r={HEIGHT * 0.5} color={glowColor}>
            <BlurMask blur={30} style="normal" />
          </Circle>
          <Circle cx={width * (0.6 + ox2 * 0.2)} cy={HEIGHT * 0.6} r={HEIGHT * 0.35} color={palette[1].replace(/[\d.]+\)$/, `${glowAlpha * 0.8})`)}>
            <BlurMask blur={24} style="normal" />
          </Circle>
        </Canvas>
      </View>

      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: 'rgba(8,10,24,0.7)',
  },
  content: {
    padding: 14,
  },
});

export default memo(SkiaDreamAuroraCard);
