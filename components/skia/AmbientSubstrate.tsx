import React, { useEffect } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import {
  Canvas,
  Circle,
  Group,
  Blur,
  SweepGradient,
  vec,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Colors } from '../ui/editorial/theme';

export const AmbientSubstrate = () => {
  const { width, height } = useWindowDimensions();

  // --- REANIMATED VALUES ---
  // We use shared values to drive the continuous, slow-breathing animation.
  const rotation1 = useSharedValue(0);
  const rotation2 = useSharedValue(0);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    // Orb 1 rotates slowly clockwise
    rotation1.value = withRepeat(
      withTiming(2 * Math.PI, { duration: 25000, easing: Easing.linear }),
      -1 // Infinite loop
    );

    // Orb 2 rotates even slower counter-clockwise
    rotation2.value = withRepeat(
      withTiming(-2 * Math.PI, { duration: 35000, easing: Easing.linear }),
      -1
    );

    // Subtle pulsing effect for depth
    scale.value = withRepeat(
      withTiming(1.2, { duration: 15000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true // Reverse on repeat
    );
  }, [rotation1, rotation2, scale]);

  return (
    <Canvas style={[StyleSheet.absoluteFill, { backgroundColor: Colors.substrate }]}>
      {/* A massive blur layer. 
        By blurring sharp circles, we create that liquid "mesh gradient" effect.
      */}
      <Blur blur={80}>
        <Group>
          {/* Orb 1: The Deep Navy Base */}
          <Circle
            cx={width * 0.2}
            cy={height * 0.3}
            r={width * 0.8}
            color={Colors.glassNavy}
          />

          {/* Orb 2: The Subtle Taupe / Gold Light */}
          {/* We sweep a gradient across this circle so it shifts color as it rotates */}
          <Circle
            cx={width * 0.8}
            cy={height * 0.7}
            r={width * 0.6}
          >
            <SweepGradient
              c={vec(width * 0.8, height * 0.7)}
              colors={[
                'rgba(214, 199, 180, 0.15)', // Taupe
                'rgba(7, 20, 57, 0.2)',      // Navy blend
                'rgba(214, 199, 180, 0.05)', // Barely visible
                'rgba(214, 199, 180, 0.15)', // Back to Taupe
              ]}
            />
          </Circle>

          {/* Orb 3: A wandering dark spot to create negative space */}
          <Circle
            cx={width * 0.5}
            cy={height * 0.9}
            r={width * 0.5}
            color={Colors.substrate}
          />
        </Group>
      </Blur>
    </Canvas>
  );
};
