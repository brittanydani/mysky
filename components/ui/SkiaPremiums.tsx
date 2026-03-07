import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import {
  Canvas,
  LinearGradient,
  RoundedRect,
  vec,
  Shadow,
  BackdropFilter,
  Blur,
  Fill,
  BlendMode,
} from '@shopify/react-native-skia';

export const designTokens = {
  background: {
    top: '#020817',
    bottom: '#030A18',
    base: '#020817',
    elevated: '#0B1220',
    panel: 'rgba(255,255,255,0.02)',
  },
  glow: {
    gold: 'rgba(247,231,194,0.22)',
  },
  metallicReflection: [
    'rgba(255,255,255,0.00)',
    'rgba(255,255,255,0.12)',
    'rgba(255,248,220,0.36)',
    'rgba(255,255,255,0.08)',
    'rgba(255,255,255,0.00)',
    'rgba(111,85,46,0.05)',
    'rgba(255,248,220,0.22)',
    'rgba(255,255,255,0.00)',
  ],
  goldStrong: ['#FFF8E3', '#F7E7C2', '#EED9A7', '#CFAE73', '#9B7A46', '#6F552E'],
  cardBorder: ['rgba(255,248,220,0.42)', 'rgba(221,187,131,0.22)', 'rgba(111,85,46,0.18)'],
  cardFill: ['rgba(255,255,255,0.035)', 'rgba(255,255,255,0.015)', 'rgba(255,255,255,0.01)'],
};

interface SkiaProps {
  style?: ViewStyle | ViewStyle[];
  children?: React.ReactNode;
  width?: number; // Needed to compute reflections well typically
  height?: number; 
  borderRadius?: number;
}

export function SkiaGlassCard({
  style,
  children,
  width = 400,
  height = 600,
  borderRadius = 16,
}: SkiaProps) {
  return (
    <View style={[styles.container, style, { borderRadius }]}>
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Canvas style={StyleSheet.absoluteFillObject}>
          {/* Base Fill */}
          <RoundedRect x={0} y={0} width={width} height={height} r={borderRadius}>
            <LinearGradient
              start={vec(0, 0)}
              end={vec(0, height)}
              colors={designTokens.cardFill}
            />
          </RoundedRect>
          
          {/* Glass Border */}
          <RoundedRect
            x={1}
            y={1}
            width={width - 2}
            height={height - 2}
            r={borderRadius}
            style="stroke"
            strokeWidth={1}
          >
            <LinearGradient
              start={vec(0, 0)}
              end={vec(0, height * 0.5)}
              colors={designTokens.cardBorder}
            />
          </RoundedRect>

          {/* Top Gloss Highlight */}
          <RoundedRect
            x={2}
            y={2}
            width={width - 4}
            height={height * 0.3}
            r={borderRadius}
          >
            <LinearGradient
              start={vec(0, 0)}
              end={vec(0, height * 0.3)}
              colors={['rgba(255,255,255,0.14)', 'rgba(255,255,255,0.0)']}
            />
          </RoundedRect>
        </Canvas>
      </View>
      {children}
    </View>
  );
}

export function SkiaMetallicPill({
  style,
  children,
  width = 120,
  height = 40,
}: SkiaProps) {
  const r = height / 2;
  return (
    <View style={[{ width, height, borderRadius: r, overflow: 'hidden' }, style]}>
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Canvas style={{ flex: 1 }}>
          <RoundedRect x={0} y={0} width={width} height={height} r={r}>
            <LinearGradient
              start={vec(0, 0)}
              end={vec(width, height)}
              colors={designTokens.goldStrong}
            />
          </RoundedRect>

          {/* Reflection sweep */}
          <RoundedRect x={0} y={0} width={width} height={height} r={r}>
            <LinearGradient
              start={vec(0, 0)}
              end={vec(width, height * 0.5)}
              colors={designTokens.metallicReflection}
            />
          </RoundedRect>
        </Canvas>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
