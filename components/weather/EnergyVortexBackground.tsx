import React, { useEffect } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import {
  Canvas,
  SweepGradient,
  vec,
  Circle,
  useClockValue,
  useComputedValue,
  BlurMask,
} from '@shopify/react-native-skia';

const { width, height } = Dimensions.get('window');

export function EnergyVortexBackground() {
  const clock = useClockValue();
  
  const rotation = useComputedValue(() => {
    return (clock.current / 10000) * Math.PI * 2;
  }, [clock]);

  return (
    <Canvas style={StyleSheet.absoluteFill}>
      <Circle cx={width / 2} cy={height / 2} r={height}>
        <SweepGradient
          c={vec(width / 2, height / 2)}
          colors={['#1a1532', '#332b57', '#e1b072', '#211c42', '#1a1532']}
          transform={[{ rotate: rotation }]}
        />
        <BlurMask blur={50} style="normal" />
      </Circle>
    </Canvas>
  );
}
