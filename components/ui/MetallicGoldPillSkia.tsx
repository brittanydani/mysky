/**
 * MetallicGoldPillSkia
 *
 * Pure Skia visual pill with the full logo-matching metallic gold treatment.
 * Renders 7 layered passes for a true reflective look:
 *   1. Outer glow
 *   2. Base metallic 6-stop gradient with position control
 *   3. Horizontal reflection bands (8-stop) — the key to "metal" feel
 *   4. Top gloss strip
 *   5. Bottom shadow to prevent flat look
 *   6. Outer rim light
 *   7. Inner lower rim
 *
 * This is a display-only visual component. For interactive buttons,
 * use SkiaMetallicPill which wraps this with Pressable.
 */

import React from 'react';
import { StyleSheet, View, Text, ViewStyle } from 'react-native';
import {
  Canvas,
  RoundedRect,
  LinearGradient,
  vec,
  Group,
  BlurMask,
} from '@shopify/react-native-skia';
import { METALLIC_GOLD } from '../../constants/theme';

type MetallicGoldPillSkiaProps = {
  width: number;
  height?: number;
  radius?: number;
  label?: string;
  style?: ViewStyle;
  children?: React.ReactNode;
};

export default function MetallicGoldPillSkia({
  width,
  height = 64,
  radius = 999,
  label,
  style,
  children,
}: MetallicGoldPillSkiaProps) {
  return (
    <View style={[styles.container, { width, height }, style]}>
      <Canvas style={{ width, height }}>
        <Group>
          {/* 1. Outer glow */}
          <RoundedRect x={1} y={2} width={width - 2} height={height - 2} r={radius}>
            <LinearGradient
              start={vec(0, 0)}
              end={vec(width, height)}
              colors={[
                'rgba(247,231,194,0.00)',
                METALLIC_GOLD.glow,
                'rgba(247,231,194,0.00)',
              ]}
            />
            <BlurMask blur={10} style="solid" />
          </RoundedRect>

          {/* 2. Base metallic fill */}
          <RoundedRect x={0} y={0} width={width} height={height} r={radius}>
            <LinearGradient
              start={vec(width * 0.05, height * 0.15)}
              end={vec(width * 0.95, height * 0.85)}
              colors={[...METALLIC_GOLD.pillGradient]}
              positions={[0, 0.16, 0.34, 0.56, 0.78, 1]}
            />
          </RoundedRect>

          {/* 3. Reflection bands — these make it feel metallic */}
          <RoundedRect x={0} y={0} width={width} height={height} r={radius}>
            <LinearGradient
              start={vec(0, 0)}
              end={vec(width, 0)}
              colors={[
                'rgba(255,255,255,0.00)',
                'rgba(255,255,255,0.10)',
                'rgba(255,248,220,0.38)',
                'rgba(255,255,255,0.12)',
                'rgba(255,255,255,0.00)',
                'rgba(111,85,46,0.06)',
                'rgba(255,248,220,0.28)',
                'rgba(255,255,255,0.00)',
              ]}
              positions={[0, 0.08, 0.18, 0.28, 0.40, 0.58, 0.78, 1]}
            />
          </RoundedRect>

          {/* 4. Top gloss */}
          <RoundedRect x={6} y={4} width={width - 12} height={height * 0.36} r={radius}>
            <LinearGradient
              start={vec(0, 0)}
              end={vec(0, height * 0.36)}
              colors={[
                'rgba(255,255,255,0.24)',
                'rgba(255,255,255,0.10)',
                'rgba(255,255,255,0.00)',
              ]}
              positions={[0, 0.45, 1]}
            />
          </RoundedRect>

          {/* 5. Bottom shadow */}
          <RoundedRect x={0} y={0} width={width} height={height} r={radius}>
            <LinearGradient
              start={vec(0, height * 0.55)}
              end={vec(0, height)}
              colors={[
                'rgba(0,0,0,0.00)',
                'rgba(78,58,31,0.06)',
                'rgba(78,58,31,0.16)',
              ]}
              positions={[0, 0.55, 1]}
            />
          </RoundedRect>

          {/* 6. Rim light */}
          <RoundedRect
            x={0.5}
            y={0.5}
            width={width - 1}
            height={height - 1}
            r={radius}
            style="stroke"
            strokeWidth={1}
            color={METALLIC_GOLD.rim}
          />

          {/* 7. Inner lower rim */}
          <RoundedRect
            x={1.5}
            y={1.5}
            width={width - 3}
            height={height - 3}
            r={radius}
            style="stroke"
            strokeWidth={1}
            color="rgba(111,85,46,0.18)"
          />
        </Group>
      </Canvas>

      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <View style={styles.labelWrap}>
          {label ? <Text style={styles.label}>{label}</Text> : null}
          {children}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'visible',
  },
  labelWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  label: {
    color: '#0B1220',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
});
