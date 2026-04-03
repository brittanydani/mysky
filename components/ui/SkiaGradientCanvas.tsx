// This file is intentionally separate from SkiaGradient.tsx.
// Importing @shopify/react-native-skia at the top level initializes a
// Reanimated worklet runtime at module eval time, which crashes on
// iOS 26 New Architecture before React mounts. By isolating the Skia
// import here and loading this file via React.lazy(), the import only
// runs after the JS engine is fully bootstrapped.
import React from 'react';
import { StyleSheet } from 'react-native';
import { Canvas, LinearGradient as SkiaLinearGradient, Rect, vec } from '@shopify/react-native-skia';

interface Props {
  width: number;
  height: number;
  colors: string[];
  locations?: number[] | null;
  start: { x: number; y: number } | [number, number];
  end: { x: number; y: number } | [number, number];
}

function getPoint(p: { x: number; y: number } | [number, number], width: number, height: number) {
  if (Array.isArray(p)) {
    return vec(p[0] * width, p[1] * height);
  }
  return vec(p.x * width, p.y * height);
}

export default function SkiaGradientCanvas({ width, height, colors, locations, start, end }: Props) {
  const skiaStart = getPoint(start, width, height);
  const skiaEnd = getPoint(end, width, height);

  return (
    <Canvas style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <Rect x={0} y={0} width={width} height={height}>
        <SkiaLinearGradient
          start={skiaStart}
          end={skiaEnd}
          colors={colors}
          positions={locations || undefined}
        />
      </Rect>
    </Canvas>
  );
}
