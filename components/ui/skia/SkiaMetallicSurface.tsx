import React, { memo, useMemo } from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import {
  Canvas,
  RoundedRect,
  LinearGradient,
  Group,
  SweepGradient,
  RadialGradient,
  BlendMode,
  vec,
} from '@shopify/react-native-skia';
import { luxuryTheme } from '../../../constants/luxuryTheme';

interface SkiaMetallicSurfaceProps extends ViewProps {
  width: number;
  height: number;
  borderRadius?: number;
  type?: 'strong' | 'soft' | 'logo';
  showGloss?: boolean;
  showRim?: boolean;
  intensity?: number;
  children?: React.ReactNode;
}

export function SkiaMetallicSurface({
  width,
  height,
  borderRadius = 16,
  type = 'strong',
  showGloss = true,
  showRim = true,
  intensity = 1,
  style,
  children,
  ...props
}: SkiaMetallicSurfaceProps) {
  const gradientColors = useMemo(() => {
    switch (type) {
      case 'logo':
        return luxuryTheme.gradients.goldLogoLike;
      case 'soft':
        return luxuryTheme.gradients.goldSoft;
      case 'strong':
      default:
        return luxuryTheme.gradients.goldStrong;
    }
  }, [type]);

  const centerX = width / 2;
  const centerY = height / 2;

  return (
    <View style={[styles.container, { width, height }, style]} {...props}>
      <Canvas style={StyleSheet.absoluteFill} mode="continuous">
        <Group>
          {/* Base Metallic Gradient */}
          <RoundedRect x={0} y={0} width={width} height={height} r={borderRadius}>
            <LinearGradient
              start={vec(0, 0)}
              end={vec(width, height)}
              colors={gradientColors}
            />
          </RoundedRect>

          {/* Optional Gloss Streak / Metallic Reflection */}
          {showGloss && (
            <RoundedRect x={0} y={0} width={width} height={height} r={borderRadius}>
              <SweepGradient
                c={vec(centerX, centerY)}
                colors={luxuryTheme.gradients.metallicReflection}
                start={0}
                end={360}
              />
            </RoundedRect>
          )}

          {/* Optional Rim Highlight (Top Edge) */}
          {showRim && (
            <RoundedRect
              x={1}
              y={1}
              width={width - 2}
              height={height - 2}
              r={borderRadius - 1}
              color="transparent"
            >
              <LinearGradient
                start={vec(0, 0)}
                end={vec(0, height * 0.4)}
                colors={[
                  luxuryTheme.metallicGold.rim,
                  'rgba(255,255,255,0)',
                ]}
              />
            </RoundedRect>
          )}
          
          {/* Soft Top Gloss overlay per design system */}
          {showGloss && (
             <RoundedRect
               x={0}
               y={0}
               width={width}
               height={height / 2}
               r={borderRadius}
             >
                <LinearGradient
                  start={vec(0, 0)}
                  end={vec(0, height / 2)}
                  colors={luxuryTheme.gradients.glossTop}
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
    overflow: 'hidden', // Ensures native children don't bleed out of bounds
  },
});

export default memo(SkiaMetallicSurface);
