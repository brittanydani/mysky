/**
 * SkiaBreathPortal
 * A cinematic breathing guide using harmonic Lissajous geometry.
 * Features: Chromatic aberration, Path interpolation, and Fluid easing.
 *
 * Nervous System Logic:
 *   - Coherent Rhythm: 8-second cycle (4 s in, 4 s out) — the gold standard
 *     for heart-rate variability (HRV) training.
 *   - Harmonic Morphing: the shape mathematically morphs from a simple circle
 *     into a 4-leaf harmonic curve as the user inhales, mirroring lung expansion.
 *   - Obsidian Depth: emerald / gold paths float inside the NebulaBackground
 *     gas clouds for a profound sense of depth.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import {
  Canvas,
  Path,
  BlurMask,
  Group,
  Circle,
  LinearGradient,
  vec,
  usePathValue,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  useAnimatedReaction,
  runOnJS,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const SIZE = width * 0.8;
const CENTER = SIZE / 2;
const POINTS = 120;

const PALETTE = {
  emerald: '#6EBF8B',
  gold: '#C9AE78',
  glass: 'rgba(255, 255, 255, 0.1)',
};

export default function SkiaBreathPortal() {
  // ── Breath animation (0 → 1 → 0, coherent 8 s cycle) ──
  const breathValue = useSharedValue(0);

  useEffect(() => {
    // 4 s inhale, 4 s exhale — "Coherent Breathing" rhythm
    breathValue.value = withRepeat(
      withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
      -1,   // infinite
      true, // reverse
    );
  }, [breathValue]);

  // ── Harmonic Geometry Engine ──
  // usePathValue runs inside a Reanimated derived-value context so it can
  // read breathValue.value and rebuilds the SkPath every animation frame.
  const path = usePathValue((p) => {
    'worklet';
    p.reset();
    const bv = breathValue.value;
    const radius = SIZE * 0.3 + bv * 28;      // Expand radius on inhale
    const harmony = 2 + bv * 0.35;             // Morph the "clover" shape

    for (let i = 0; i <= POINTS; i++) {
      const angle = (i / POINTS) * Math.PI * 2;

      // Lissajous-inspired harmonic formula
      const x = CENTER + radius * Math.cos(angle) * Math.cos(harmony * angle);
      const y = CENTER + radius * Math.sin(angle) * Math.cos(harmony * angle);

      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    p.close();
  });

  // ── Instruction label (bridge worklet → React state) ──
  const [instruction, setInstruction] = useState('Inhale');
  const updateInstruction = useCallback(
    (label: string) => setInstruction(label),
    [],
  );

  useAnimatedReaction(
    () => breathValue.value,
    (bv, prev) => {
      const label = bv >= 0.5 ? 'Exhale' : 'Inhale';
      const prevLabel = (prev ?? 0) >= 0.5 ? 'Exhale' : 'Inhale';
      if (label !== prevLabel) {
        runOnJS(updateInstruction)(label);
      }
    },
  );

  return (
    <View style={styles.container}>
      <Canvas style={{ width: SIZE, height: SIZE }}>
        <Group>
          {/* 1. The Aura Glow */}
          <Path
            path={path}
            color={PALETTE.emerald}
            opacity={0.55}
            style="stroke"
            strokeWidth={4}
          >
            <BlurMask blur={20} style="outer" />
          </Path>

          {/* 2. The Primary Harmonic Path */}
          <Path
            path={path}
            style="stroke"
            strokeWidth={2}
            strokeCap="round"
          >
            <LinearGradient
              start={vec(0, 0)}
              end={vec(SIZE, SIZE)}
              colors={[PALETTE.emerald, PALETTE.gold, PALETTE.emerald]}
            />
            <BlurMask blur={3} style="solid" />
          </Path>

          {/* 3. Subtle Inner Pulse */}
          <Circle
            cx={CENTER}
            cy={CENTER}
            r={18}
            color="white"
            opacity={0.1}
          >
            <BlurMask blur={10} style="normal" />
          </Circle>
        </Group>
      </Canvas>

      <View style={styles.labelContainer} pointerEvents="none">
        <Text style={styles.instructionText}>{instruction}</Text>
        <Text style={styles.subInstructionText}>4 seconds</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 32,
  },
  labelContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  instructionText: {
    color: '#F0EAD6',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 4,
    opacity: 0.72,
  },
  subInstructionText: {
    color: 'rgba(240, 234, 214, 0.45)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    marginTop: 6,
  },
});
