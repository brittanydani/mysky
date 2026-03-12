import React, { memo, useEffect } from 'react';
import { View } from 'react-native';
import {
  Canvas,
  Circle,
  BlurMask,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  useDerivedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

type Color = 'gold' | 'amethyst' | 'blue' | 'rose' | 'white';

interface Props {
  size?: number;
  color?: Color;
  rings?: number;
}

const colorMap: Record<Color, string[]> = {
  gold: ['rgba(255,218,3,0.55)', 'rgba(255,218,3,0.25)', 'rgba(255,218,3,0.10)'],
  amethyst: ['rgba(148,0,211,0.55)', 'rgba(148,0,211,0.25)', 'rgba(148,0,211,0.10)'],
  blue: ['rgba(99,179,237,0.55)', 'rgba(99,179,237,0.25)', 'rgba(99,179,237,0.10)'],
  rose: ['rgba(231,13,152,0.55)', 'rgba(231,13,152,0.25)', 'rgba(231,13,152,0.10)'],
  white: ['rgba(255,255,255,0.45)', 'rgba(255,255,255,0.20)', 'rgba(255,255,255,0.08)'],
};

function SkiaBreathingRing({ size = 80, color = 'gold', rings = 2 }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const baseRadius = size * 0.28;
  const palette = colorMap[color] ?? colorMap.gold;

  // Breathing scale: oscillates between 0.88 and 1.12
  const breath = useSharedValue(0.88);

  useEffect(() => {
    breath.value = withRepeat(
      withTiming(1.12, { duration: 2800, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, []);

  const ringCount = Math.min(rings, 3);

  // Skia-compatible derived values per ring
  const r0 = useDerivedValue(() => baseRadius * breath.value);
  const r1 = useDerivedValue(() => baseRadius * 1.45 * breath.value);
  const r2 = useDerivedValue(() => baseRadius * 1.90 * breath.value);

  const radii = [r0, r1, r2];

  return (
    <View style={{ width: size, height: size }}>
      <Canvas style={{ flex: 1 }}>
        {Array.from({ length: ringCount }, (_, i) => (
          <Circle
            key={i}
            cx={cx}
            cy={cy}
            r={radii[i]}
            color={palette[i] ?? palette[palette.length - 1]}
          >
            <BlurMask blur={4 + i * 3} style="normal" />
          </Circle>
        ))}
      </Canvas>
    </View>
  );
}

export default memo(SkiaBreathingRing);
