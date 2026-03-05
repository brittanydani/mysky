import React, { useEffect } from 'react';
import { useSharedValue, withTiming, Easing, useDerivedValue } from 'react-native-reanimated';
import { Canvas, Path, Skia, BlurMask } from '@shopify/react-native-skia';

/**
 * QuickStabilityDelta
 * A high-velocity feedback sparkline for 4x daily updates.
 * Shows the immediate impact of the Triad Check-In on the Stability Index.
 */
export const QuickStabilityDelta = ({ delta }: { delta: number }) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) });
  }, [delta, progress]);

  const path = useDerivedValue(() => {
    const p = Skia.Path.Make();
    p.moveTo(0, 20);
    // Dynamic curve based on the delta value (-1.0 to 1.0)
    p.quadTo(40, 20 - (delta * 20), 80, 20 - (delta * 15));
    return p;
  });

  return (
    <Canvas style={{ width: 80, height: 40 }}>
      {/* 
        Positive Delta (Gold Glow): Resilient
        Negative Delta (Copper Pulse): Grounding Needed 
      */}
      <Path path={path} style="stroke" strokeWidth={2} color={delta > 0 ? "#D4AF37" : "#CD7F5D"}>
        <BlurMask blur={3} style="outer" />
      </Path>
    </Canvas>
  );
};
