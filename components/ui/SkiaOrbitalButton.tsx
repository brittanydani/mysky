// File: components/ui/SkiaOrbitalButton.tsx
/**
 * SkiaOrbitalButton
 * A high-end action button with a GPU-accelerated progress ring.
 * Used for securing entries (Mood, Sleep, Journal).
 *
 * While saving data, a ring of light orbits the button core,
 * pulsing in sync with the NebulaBackground — pure geometry
 * and light focused on the act of recording your life data.
 *
 * Requires: @shopify/react-native-skia 2.x, react-native-reanimated 4.x
 */

import React, { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View, Platform } from 'react-native';
import {
  Canvas,
  Circle,
  Group,
  Path,
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
import { LinearGradient } from 'expo-linear-gradient';

// Canvas dimensions for the progress ring
const RING_SIZE = 100;
const RING_CX = RING_SIZE / 2;
const RING_CY = RING_SIZE / 2;
const RING_RADIUS = 42;
const NODE_OFFSET = RING_CY - RING_RADIUS; // y position of the orbiting dot

interface Props {
  /** Button label text */
  label: string;
  /** When true, shows the orbital progress ring */
  loading: boolean;
  /** Press handler */
  onPress: () => void;
  /** Accent color for gradients and the orbital ring */
  accentColor?: string;
}

export default function SkiaOrbitalButton({
  label,
  loading,
  onPress,
  accentColor = '#C9AE78',
}: Props) {
  // ── Animation Values (Reanimated) ──
  const rotation = useSharedValue(0);
  const ringOpacity = useSharedValue(0);

  useEffect(() => {
    if (loading) {
      ringOpacity.value = withTiming(1, { duration: 300 });
      rotation.value = withRepeat(
        withTiming(Math.PI * 2, { duration: 1200, easing: Easing.linear }),
        -1,    // infinite
        false, // no reverse
      );
    } else {
      ringOpacity.value = withTiming(0, { duration: 300 });
      // Reset rotation so it starts cleanly next time
      rotation.value = 0;
    }
  }, [loading, rotation, ringOpacity]);

  // ── Static Ring Path ──
  const progressPath = useMemo(() => {
    const path = Skia.Path.Make();
    path.addCircle(RING_CX, RING_CY, RING_RADIUS);
    return path;
  }, []);

  // ── Derived Transform (Reanimated → Skia bridge) ──
  const ringTransform = useDerivedValue(() => [
    { rotate: rotation.value },
  ]);

  const ringOpacityDerived = useDerivedValue(() => ringOpacity.value);

  return (
    <Pressable onPress={onPress} disabled={loading} style={styles.container}>
      <View style={styles.buttonFrame}>
        <LinearGradient
          colors={['#FFF4D6', accentColor, '#6B532E']}
          style={styles.innerGradient}
        >
          <Text style={styles.label}>{loading ? '' : label}</Text>
        </LinearGradient>

        {loading && (
          <View style={styles.canvasOverlay}>
            <Canvas style={{ width: RING_SIZE, height: RING_SIZE }}>
              <Group
                origin={vec(RING_CX, RING_CY)}
                transform={ringTransform}
                opacity={ringOpacityDerived}
              >
                {/* Orbiting sweep-gradient ring */}
                <Path
                  path={progressPath}
                  style="stroke"
                  strokeWidth={3}
                  strokeCap="round"
                >
                  <SweepGradient
                    c={vec(RING_CX, RING_CY)}
                    colors={[accentColor, 'transparent']}
                  />
                  <BlurMask blur={5} style="outer" />
                </Path>

                {/* Leading orbital node — bright dot at the top of the ring */}
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
    height: 60,
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  buttonFrame: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerGradient: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  label: {
    color: '#020817',
    fontSize: 17,
    fontWeight: '800',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    letterSpacing: 0.5,
  },
  canvasOverlay: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
  },
});
