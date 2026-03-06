// File: components/ui/SkiaOrbitalButton.tsx
/**
 * SkiaOrbitalButton
 * A high-end action button with a GPU-accelerated progress ring
 * and true metallic gold fill (6-layer Skia rendering).
 * Used for securing entries (Mood, Sleep, Journal).
 *
 * Requires: @shopify/react-native-skia 2.x, react-native-reanimated 4.x
 */

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View, Platform, LayoutChangeEvent } from 'react-native';
import {
  Canvas,
  Circle,
  Group,
  Path,
  RoundedRect,
  Skia,
  BlurMask,
  SweepGradient,
  LinearGradient,
  BoxShadow,
  vec,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  useDerivedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { METALLIC_GOLD } from '../../constants/theme';

// Canvas dimensions for the progress ring
const RING_SIZE = 100;
const RING_CX = RING_SIZE / 2;
const RING_CY = RING_SIZE / 2;
const RING_RADIUS = 42;
const NODE_OFFSET = RING_CY - RING_RADIUS;
const BTN_HEIGHT = 60;
const BTN_RADIUS = 16;

interface Props {
  /** Button label text */
  label: string;
  /** When true, shows the orbital progress ring */
  loading: boolean;
  /** Press handler */
  onPress: () => void;
  /** Accent color for the orbital ring */
  accentColor?: string;
}

export default function SkiaOrbitalButton({
  label,
  loading,
  onPress,
  accentColor = '#C9AE78',
}: Props) {
  const [w, setW] = useState(0);
  const onLayout = useCallback((e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width), []);

  // ── Animation Values (Reanimated) ──
  const rotation = useSharedValue(0);
  const ringOpacity = useSharedValue(0);

  useEffect(() => {
    if (loading) {
      ringOpacity.value = withTiming(1, { duration: 300 });
      rotation.value = withRepeat(
        withTiming(Math.PI * 2, { duration: 1200, easing: Easing.linear }),
        -1, false,
      );
    } else {
      ringOpacity.value = withTiming(0, { duration: 300 });
      rotation.value = 0;
    }
  }, [loading, rotation, ringOpacity]);

  const progressPath = useMemo(() => {
    const path = Skia.Path.Make();
    path.addCircle(RING_CX, RING_CY, RING_RADIUS);
    return path;
  }, []);

  const ringTransform = useDerivedValue(() => [{ rotate: rotation.value }]);
  const ringOpacityDerived = useDerivedValue(() => ringOpacity.value);

  return (
    <Pressable onPress={onPress} disabled={loading} onLayout={onLayout} style={styles.container}>
      <View style={styles.buttonFrame}>
        {/* ── Metallic pill fill (6 Skia layers) ── */}
        {w > 0 && (
          <Canvas style={[StyleSheet.absoluteFillObject, { borderRadius: BTN_RADIUS }]}>
            {/* 1. Shadow */}
            <Group>
              <RoundedRect x={0} y={2} width={w} height={BTN_HEIGHT} r={BTN_RADIUS}>
                <BoxShadow dx={0} dy={4} blur={12} color="rgba(0,0,0,0.45)" />
              </RoundedRect>
            </Group>
            {/* 2. Base metallic gradient */}
            <RoundedRect x={0} y={0} width={w} height={BTN_HEIGHT} r={BTN_RADIUS}>
              <LinearGradient
                start={vec(0.05 * w, 0.15 * BTN_HEIGHT)}
                end={vec(0.95 * w, 0.85 * BTN_HEIGHT)}
                colors={[...METALLIC_GOLD.pillGradient]}
              />
            </RoundedRect>
            {/* 3. Narrow reflection band */}
            <Group clip={{ x: 0, y: 0, width: w, height: BTN_HEIGHT }}>
              <RoundedRect x={0} y={BTN_HEIGHT * 0.08} width={w} height={BTN_HEIGHT * 0.18} r={BTN_RADIUS}>
                <LinearGradient
                  start={vec(0, BTN_HEIGHT * 0.08)}
                  end={vec(0, BTN_HEIGHT * 0.26)}
                  colors={['rgba(255,255,255,0.00)', 'rgba(255,248,227,0.32)', 'rgba(255,255,255,0.00)']}
                />
              </RoundedRect>
            </Group>
            {/* 4. Top gloss */}
            <RoundedRect x={0} y={0} width={w} height={BTN_HEIGHT * 0.42} r={BTN_RADIUS}>
              <LinearGradient
                start={vec(0, 0)}
                end={vec(0, BTN_HEIGHT * 0.42)}
                colors={[METALLIC_GOLD.gloss, 'rgba(255,255,255,0.02)']}
              />
            </RoundedRect>
            {/* 5. Bottom shade */}
            <RoundedRect x={0} y={BTN_HEIGHT * 0.6} width={w} height={BTN_HEIGHT * 0.4} r={BTN_RADIUS}>
              <LinearGradient
                start={vec(0, BTN_HEIGHT * 0.6)}
                end={vec(0, BTN_HEIGHT)}
                colors={['rgba(0,0,0,0.00)', 'rgba(78,58,31,0.28)']}
              />
            </RoundedRect>
            {/* 6. Rim stroke */}
            <RoundedRect x={0.5} y={0.5} width={w - 1} height={BTN_HEIGHT - 1} r={BTN_RADIUS} style="stroke" strokeWidth={1} color={METALLIC_GOLD.rim} />
          </Canvas>
        )}

        {/* Label */}
        <Text style={styles.label}>{loading ? '' : label}</Text>

        {/* Orbital ring (shown while saving) */}
        {loading && (
          <View style={styles.canvasOverlay}>
            <Canvas style={{ width: RING_SIZE, height: RING_SIZE }}>
              <Group
                origin={vec(RING_CX, RING_CY)}
                transform={ringTransform}
                opacity={ringOpacityDerived}
              >
                <Path path={progressPath} style="stroke" strokeWidth={3} strokeCap="round">
                  <SweepGradient c={vec(RING_CX, RING_CY)} colors={[accentColor, 'transparent']} />
                  <BlurMask blur={5} style="outer" />
                </Path>
                <Circle cx={RING_CX} cy={NODE_OFFSET} r={3} color="white">
                  <BlurMask blur={3} style="solid" />
                </Circle>
              </Group>
            </Canvas>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    height: BTN_HEIGHT,
    width: '100%',
    borderRadius: BTN_RADIUS,
    overflow: 'hidden',
  },
  buttonFrame: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    color: '#020817',
    fontSize: 17,
    fontWeight: '800',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    letterSpacing: 0.5,
    zIndex: 1,
  },
  canvasOverlay: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    zIndex: 2,
  },
});
