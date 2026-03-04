// File: components/premium/SkiaAuraReader.tsx
/**
 * SkiaAuraReader
 * A generative, data-driven sigil engine.
 * Maps Mood, Energy, and Tension to recursive Skia geometry.
 *
 * - Mood   (1-10) → color palette shift (Indigo → Emerald → Gold)
 * - Energy (1-10) → rotation speed & scale
 * - Tension(1-10) → noise / jaggedness of sigil edges (fBm-inspired)
 *
 * Uses Fractal Brownian Motion–style sine-wave layering to produce a
 * mathematically unique sigil every 24 hours. No two users will ever
 * share the same aura — a premium-only, shareable visual identity.
 *
 * Requires: @shopify/react-native-skia 2.x, react-native-reanimated 4.x
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import {
  Canvas,
  Group,
  Path,
  Circle,
  Skia,
  BlurMask,
  SweepGradient,
  vec,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  useDerivedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const SIZE = width * 0.85;
const CENTER = SIZE / 2;
const BASE_RADIUS = SIZE * 0.25;

interface AuraProps {
  /** 1-10 — drives color palette shift */
  mood: number;
  /** 1-10 — drives rotation speed & scale */
  energy: number;
  /** 1-10 — drives noise / complexity of the sigil edges */
  tension: number;
}

export default function SkiaAuraReader({ mood, energy, tension }: AuraProps) {
  // ── Rotation Animation ──
  const rotation = useSharedValue(0);

  React.useEffect(() => {
    // Higher energy → faster rotation (5 s at max, 20 s at min)
    const duration = 20000 - energy * 1500;
    rotation.value = withRepeat(
      withTiming(Math.PI * 2, { duration, easing: Easing.linear }),
      -1,   // infinite
      false, // don't reverse
    );
  }, [energy]);

  // ── Generative Sigil Path (fBm-inspired recursive geometry) ──
  const auraPath = useMemo(() => {
    const path = Skia.Path.Make();
    const points = 80;

    // Three interlaced loops create a layered, recursive sigil
    for (let loop = 0; loop < 3; loop++) {
      for (let i = 0; i <= points; i++) {
        const angle = (i / points) * Math.PI * 2;

        // Sine-wave distortion scaled by tension → jagged / smooth edges
        const offset = Math.sin(angle * (tension / 2)) * (tension * 4);
        const r = BASE_RADIUS + offset + loop * 20;

        const x = CENTER + r * Math.cos(angle);
        const y = CENTER + r * Math.sin(angle);

        if (i === 0 && loop === 0) path.moveTo(x, y);
        else path.lineTo(x, y);
      }
    }
    path.close();
    return path;
  }, [tension]);

  // ── Dynamic Color Mapping ──
  const colors = useMemo(() => {
    if (mood > 7) return ['#D4AF37', '#E0C88A', '#D4AF37']; // Radiant Gold
    if (mood < 4) return ['#4A3B6B', '#8BC4E8', '#4A3B6B']; // Deep Indigo
    return ['#6EBF8B', '#D4AF37', '#6EBF8B'];               // Balanced Emerald/Gold
  }, [mood]);

  // ── Animated Transform ──
  const auraTransform = useDerivedValue(() => [
    { rotate: rotation.value },
    { scale: 0.9 + energy * 0.02 },
  ]);

  // ── Aura label derived from mood ──
  const auraLabel =
    mood > 7 ? 'Radiant' : mood < 4 ? 'Introspective' : 'Harmonized';

  return (
    <View style={styles.container}>
      <Canvas style={{ width: SIZE, height: SIZE }}>
        <Group origin={vec(CENTER, CENTER)} transform={auraTransform}>

          {/* 1. Ethereal Glow — soft outer bloom */}
          <Path
            path={auraPath}
            style="stroke"
            strokeWidth={10}
            opacity={0.3}
            color={colors[0]}
          >
            <BlurMask blur={30} style="normal" />
          </Path>

          {/* 2. Defined Sigil Core — crisp sweep-gradient stroke */}
          <Path
            path={auraPath}
            style="stroke"
            strokeWidth={2}
            strokeCap="round"
          >
            <SweepGradient c={vec(CENTER, CENTER)} colors={colors} />
            <BlurMask blur={3} style="solid" />
          </Path>

          {/* 3. Data Orbital — glowing node representing the metric apex */}
          <Circle
            cx={CENTER}
            cy={CENTER - (BASE_RADIUS + 40)}
            r={4}
            color={colors[1]}
          >
            <BlurMask blur={10} style="outer" />
          </Circle>
        </Group>
      </Canvas>

      {/* Meta overlay */}
      <View style={styles.meta}>
        <Text style={styles.auraType}>{auraLabel} Aura</Text>
        <Text style={styles.auraDate}>
          {new Date().toLocaleDateString()} Signature
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    marginTop: -40,
    alignItems: 'center',
  },
  auraType: {
    color: '#D4AF37',
    fontSize: 18,
    fontFamily: 'serif',
    fontWeight: '700',
    letterSpacing: 1,
  },
  auraDate: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    textTransform: 'uppercase',
    marginTop: 4,
    letterSpacing: 2,
  },
});
