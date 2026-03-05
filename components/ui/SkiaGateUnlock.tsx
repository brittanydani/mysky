import React, { useEffect } from 'react';
import { Dimensions } from 'react-native';
import {
  Canvas,
  Circle,
  useSharedValue,
  withTiming,
  Easing,
  BlurMask,
} from '@shopify/react-native-skia';

const { width, height } = Dimensions.get('window');

interface SkiaGateUnlockProps {
  nodeX: number;
  nodeY: number;
  onComplete: () => void;
}

export const SkiaGateUnlock = ({ nodeX, nodeY, onComplete }: SkiaGateUnlockProps) => {
  const morphProgress = useSharedValue(0);

  useEffect(() => {
    morphProgress.value = withTiming(1, { 
      duration: 1000, 
      easing: Easing.inOut(Easing.bezier(0.25, 1, 0.5, 1)) 
    }, (finished) => {
      if (finished && onComplete) onComplete();
    });
  }, [morphProgress, onComplete]);

  return (
    <Canvas style={{ flex: 1 }}>
      {/* The Tension node expanding and morphing into the Portal center */}
      <Circle 
        cx={nodeX + (width / 2 - nodeX) * morphProgress.value} 
        cy={nodeY + (height / 2 - nodeY) * morphProgress.value} 
        r={20 + morphProgress.value * 100} 
        color="#D4AF37" // Gold
      >
        <BlurMask blur={20 * (1 - morphProgress.value)} style="normal" />
      </Circle>
    </Canvas>
  );
};
