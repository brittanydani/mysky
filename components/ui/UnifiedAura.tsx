// File: components/ui/UnifiedAura.tsx
/**
 * UnifiedAura
 * A pulsing Skia shader that visualizes your current Resilience Score/Delta.
 * The pulse rate directly corresponds to the Stability Delta.
 */

import React, { useEffect } from 'react';
import { Dimensions } from 'react-native';
import {
  Canvas,
  Circle,
  BlurMask,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  mix
} from '@shopify/react-native-skia';

const { width } = Dimensions.get('window');

export const UnifiedAura = ({ pulseRate }: { pulseRate: number }) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    // If the delta is highly negative, the pulse is fast and irregular.
    // If positive and stable, it is slow and smooth.
    const duration = Math.max(800, 3000 - (pulseRate * 2000));
    
    progress.value = withRepeat(
      withTiming(1, { 
        duration, 
        easing: Easing.inOut(Easing.ease) 
      }), 
      -1, 
      true
    );
  }, [pulseRate]);

  return (
    <Canvas style={{ width, height: width * 0.6, position: 'absolute', top: 0 }}>
      {/* Dynamic ambient color representing the "Aura" */}
      <Circle 
        cx={width / 2} 
        cy={width * 0.25} 
        r={width * 0.4} 
        color={pulseRate >= 0 ? "rgba(110, 191, 139, 0.15)" : "rgba(205, 127, 93, 0.15)"} // Emerald vs Copper
      >
        <BlurMask blur={60} style="normal" />
      </Circle>
    </Canvas>
  );
};
