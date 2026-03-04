/**
 * FeatureHighlight
 *
 * Renders a soft radial glow behind the key visual element in each screenshot.
 * This guides the viewer's eye to the most important feature.
 *
 * The glow color is driven by the screenshot's accent color.
 */

import React from 'react';
import { Canvas, Circle, BlurMask, Group } from '@shopify/react-native-skia';
import { StyleSheet } from 'react-native';

interface Props {
  /** Center X of the glow relative to the parent */
  cx: number;
  /** Center Y of the glow relative to the parent */
  cy: number;
  /** Radius of the glow */
  radius?: number;
  /** Glow color (from screenshot config accentColor) */
  color: string;
  /** Glow opacity */
  opacity?: number;
  /** Canvas width */
  width: number;
  /** Canvas height */
  height: number;
}

export default function FeatureHighlight({
  cx,
  cy,
  radius = 120,
  color,
  opacity = 0.25,
  width,
  height,
}: Props) {
  return (
    <Canvas style={[styles.canvas, { width, height }]} pointerEvents="none">
      <Group>
        {/* Outer soft bloom */}
        <Circle cx={cx} cy={cy} r={radius * 1.5} color={color} opacity={opacity * 0.4}>
          <BlurMask blur={radius} style="normal" />
        </Circle>
        {/* Inner focused glow */}
        <Circle cx={cx} cy={cy} r={radius * 0.6} color={color} opacity={opacity}>
          <BlurMask blur={radius * 0.5} style="normal" />
        </Circle>
        {/* Bright core */}
        <Circle cx={cx} cy={cy} r={radius * 0.15} color="#FFFFFF" opacity={opacity * 0.6}>
          <BlurMask blur={radius * 0.2} style="normal" />
        </Circle>
      </Group>
    </Canvas>
  );
}

const styles = StyleSheet.create({
  canvas: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
