import React, { useState } from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { Canvas, LinearGradient as SkiaLinearGradient, Rect, vec } from '@shopify/react-native-skia';

export interface LinearGradientProps extends ViewProps {
  colors: string[];
  locations?: number[] | null;
  start?: { x: number; y: number } | [number, number];
  end?: { x: number; y: number } | [number, number];
  children?: React.ReactNode;
}

export const SkiaGradient: React.FC<LinearGradientProps> = ({
  colors,
  locations,
  start = { x: 0.5, y: 0 },
  end = { x: 0.5, y: 1 },
  style,
  children,
  ...rest
}) => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const getPoint = (p: { x: number; y: number } | [number, number], width: number, height: number) => {
    if (Array.isArray(p)) {
      return vec(p[0] * width, p[1] * height);
    }
    return vec(p.x * width, p.y * height);
  };

  const skiaStart = getPoint(start, dimensions.width, dimensions.height);
  const skiaEnd = getPoint(end, dimensions.width, dimensions.height);

  return (
    <View
      style={[style, { overflow: 'hidden' }]}
      onLayout={(e) => {
        setDimensions({
          width: e.nativeEvent.layout.width,
          height: e.nativeEvent.layout.height,
        });
      }}
      {...rest}
    >
      {dimensions.width > 0 && dimensions.height > 0 && (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <Canvas style={StyleSheet.absoluteFillObject}>
            <Rect x={0} y={0} width={dimensions.width} height={dimensions.height}>
              <SkiaLinearGradient
                start={skiaStart}
                end={skiaEnd}
                colors={colors}
                positions={locations || undefined}
              />
            </Rect>
          </Canvas>
        </View>
      )}
      {children}
    </View>
  );
};
