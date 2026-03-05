import React, { useEffect } from 'react';
import { Canvas, Circle, BlurMask } from '@shopify/react-native-skia';
import { useSharedValue, withRepeat, withTiming, Easing, useDerivedValue } from 'react-native-reanimated';

export const ParentalResiliencePortal = ({ type }: { type: 'Overwhelm' | 'Burnout' | 'Fatigue' }) => {
  const pulse = useSharedValue(1);

  useEffect(() => {
    // High-speed calibration (Box Breathing example)
    const duration = type === 'Overwhelm' ? 4000 : 6000;
    pulse.value = withRepeat(
      withTiming(1.5, { duration, easing: Easing.inOut(Easing.sine) }),
      -1,
      true
    );
  }, [type, pulse]);

  const radius = useDerivedValue(() => 40 * pulse.value);

  return (
    <Canvas style={{ width: 200, height: 200 }}>
      {/* A single, heavy-glowing focus point for rapid grounding */}
      <Circle 
        cx={100} 
        cy={100} 
        r={radius} 
        color={type === 'Overwhelm' ? '#6EBF8B' : '#D4AF37'}
      >
        <BlurMask blur={15} style="outer" />
      </Circle>
    </Canvas>
  );
};
