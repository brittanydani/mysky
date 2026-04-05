import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { View, StyleSheet, ViewProps } from 'react-native';

export interface LinearGradientProps extends ViewProps {
  colors: string[];
  locations?: number[] | null;
  start?: { x: number; y: number } | [number, number];
  end?: { x: number; y: number } | [number, number];
  children?: React.ReactNode;
}

function normalizePoint(
  point: { x: number; y: number } | [number, number],
): { x: number; y: number } {
  if (Array.isArray(point)) {
    return { x: point[0], y: point[1] };
  }
  return point;
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
  return (
    <View style={[style, { overflow: 'hidden' }]} {...rest}>
      <LinearGradient
        colors={colors}
        locations={locations ?? undefined}
        start={normalizePoint(start)}
        end={normalizePoint(end)}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
      {children}
    </View>
  );
};
