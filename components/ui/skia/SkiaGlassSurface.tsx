import React, { useMemo } from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import {
  Canvas,
  RoundedRect,
  LinearGradient,
  Group,
  vec,
} from '@shopify/react-native-skia';
import { luxuryTheme } from '../../../constants/luxuryTheme';

interface SkiaGlassSurfaceProps extends ViewProps {
  width: number;
  height: number;
  borderRadius?: number;
  showFrost?: boolean;
  showOutline?: boolean;
  intensity?: number;
  style?: any;
  children?: React.ReactNode;
}

export function SkiaGlassSurface({
  width,
  height,
  borderRadius = 16,
  showFrost = true,
  showOutline = true,
  intensity = 1,
  style,
  children,
  ...props
}: SkiaGlassSurfaceProps) {
  // Memoize coordinates to prevent Skia vector re-allocation on every render
  const startVec = useMemo(() => vec(0, 0), []);
  const endVec = useMemo(() => vec(width, height), [width, height]);
  const bottomVec = useMemo(() => vec(0, height), [height]);

  return (
    <View style={[styles.container, { width, height }, style]} {...props}>
      <Canvas style={StyleSheet.absoluteFill} mode="continuous">
        <Group>
          {/* Main Glass Body Fill */}
          <RoundedRect x={0} y={0} width={width} height={height} r={borderRadius}>
            <LinearGradient
              start={startVec}
              end={endVec}
              colors={showFrost ? luxuryTheme.gradients.cardFill : ['rgba(255,255,255,0.015)', 'rgba(255,255,255,0.005)']}
            />
          </RoundedRect>

          {/* Top Border / Outline Layer */}
          {showOutline && (
            <RoundedRect
              x={0.5}
              y={0.5}
              width={width - 1}
              height={height - 1}
              r={borderRadius - 0.5}
            >
              <LinearGradient
                start={startVec}
                end={bottomVec}
                colors={[
                  luxuryTheme.card.borderTop,
                  luxuryTheme.card.border,
                  'rgba(255,255,255,0)' // bleed out soft
                ]}
              />
            </RoundedRect>
          )}

          {/* Premium Card Border Gloss */}
          {showOutline && (
            <RoundedRect
              x={1}
              y={1}
              width={width - 2}
              height={height - 2}
              r={borderRadius - 1}
            >
              <LinearGradient
                start={startVec}
                end={endVec}
                colors={luxuryTheme.gradients.cardBorder}
              />
            </RoundedRect>
          )}
        </Group>
      </Canvas>
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
