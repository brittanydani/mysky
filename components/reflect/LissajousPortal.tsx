import React, { useEffect } from 'react';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import { useSharedValue, withRepeat, withTiming, Easing, useDerivedValue } from 'react-native-reanimated';

interface LissajousPortalProps {
  size?: number;
  color?: string;
}

export default function LissajousPortal({ size = 300, color = "#a8c0ff" }: LissajousPortalProps) {
  const phase = useSharedValue(0);
  
  useEffect(() => {
    phase.value = withRepeat(
      withTiming(Math.PI * 2, { duration: 5000, easing: Easing.linear }),
      -1,
      false
    );
  }, [phase]);

  const path = useDerivedValue(() => {
    const p = Skia.Path.Make();
    // Lissajous curve parameters
    const a = 3;
    const b = 2;
    const delta = phase.value;
    const A = size / 2.5;
    const B = size / 2.5;
    
    for (let t = 0; t <= Math.PI * 2; t += 0.05) {
      const x = size / 2 + A * Math.sin(a * t + delta);
      const y = size / 2 + B * Math.sin(b * t);
      if (t === 0) {
        p.moveTo(x, y);
      } else {
        p.lineTo(x, y);
      }
    }
    p.close();
    return p;
  });

  return (
    <Canvas style={{ width: size, height: size }}>
      <Path path={path} style="stroke" strokeWidth={3} color={color} />
    </Canvas>
  );
}
