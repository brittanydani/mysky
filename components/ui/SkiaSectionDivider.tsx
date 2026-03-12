import React, { memo } from 'react';
import { View } from 'react-native';
import { Canvas, Line, vec } from '@shopify/react-native-skia';

type Variant = 'subtle' | 'default' | 'glow';

interface Props {
  variant?: Variant;
  marginVertical?: number;
}

const HEIGHT = 12;

const variantColor: Record<Variant, string> = {
  subtle: 'rgba(255, 255, 255, 0.08)',
  default: 'rgba(255, 218, 3, 0.18)',
  glow: 'rgba(255, 218, 3, 0.45)',
};

const variantStrokeWidth: Record<Variant, number> = {
  subtle: 0.5,
  default: 1,
  glow: 1.5,
};

function SkiaSectionDivider({ variant = 'default', marginVertical = 8 }: Props) {
  const color = variantColor[variant];
  const strokeWidth = variantStrokeWidth[variant];

  return (
    <View style={{ marginVertical, height: HEIGHT, width: '100%' }}>
      <Canvas style={{ flex: 1 }}>
        <Line
          p1={vec(0, HEIGHT / 2)}
          p2={vec(10000, HEIGHT / 2)}
          color={color}
          strokeWidth={strokeWidth}
        />
      </Canvas>
    </View>
  );
}

export default memo(SkiaSectionDivider);
