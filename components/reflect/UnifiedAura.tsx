import React, { useEffect } from 'react';
import { Canvas, Circle, Group, Blur, SweepGradient, vec, mix } from '@shopify/react-native-skia';
import { useSharedValue, withRepeat, withTiming, Easing, useDerivedValue } from 'react-native-reanimated';

interface UnifiedAuraProps {
  pulseRate?: number; // 0-1 relative to stability index
  size?: number;
}

export default function UnifiedAura({ pulseRate = 0.5, size = 300 }: UnifiedAuraProps) {
  const r = size / 2;
  const center = vec(r, r);
  
  const progress = useSharedValue(0);

  useEffect(() => {
    // scale duration based on pulseRate
    const duration = 1000 + (1 - pulseRate) * 2000;
    progress.value = withRepeat(
      withTiming(1, { duration, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [pulseRate, progress]);

  const animatedRadius = useDerivedValue(() => {
    return mix(progress.value, r * 0.5, r * 0.8);
  });

  return (
    <Canvas style={{ width: size, height: size }}>
      <Group>
        <Blur blur={r * 0.25} />
        <Circle c={center} r={animatedRadius}>
          <SweepGradient
            c={center}
            colors={['#c2e59c', '#64b3f4', '#c2e59c']}
          />
        </Circle>
      </Group>
    </Canvas>
  );
}
