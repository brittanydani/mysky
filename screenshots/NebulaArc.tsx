/**
 * NebulaArc
 *
 * A faint curved nebula arc that frames the phone on Screenshot 1.
 * Creates a cinematic, premium, calming composition.
 *
 * Renders a soft sweeping arc behind the phone using Skia path + blur.
 */

import React, { useMemo } from 'react';
import { Canvas, Path, Skia, BlurMask, Group } from '@shopify/react-native-skia';
import { StyleSheet } from 'react-native';

interface Props {
  width: number;
  height: number;
  /** Center Y of the phone frame — arc wraps around this */
  phoneCenterY: number;
  /** Color of the arc glow */
  color?: string;
  /** Opacity of the arc */
  opacity?: number;
}

export default function NebulaArc({
  width,
  height,
  phoneCenterY,
  color = '#D8C39A',
  opacity = 0.08,
}: Props) {
  const arcPath = useMemo(() => {
    const p = Skia.Path.Make();
    const cx = width / 2;
    const rx = width * 0.55; // horizontal radius — wide sweep
    const ry = height * 0.22; // vertical radius — gentle curve
    const cy = phoneCenterY;

    // Draw an elliptical arc from left to right, curving behind the phone
    // Start from bottom-left, sweep up and over
    const startAngle = 160; // degrees
    const endAngle = 380; // almost full sweep behind

    const steps = 60;
    for (let i = 0; i <= steps; i++) {
      const angle = startAngle + (i / steps) * (endAngle - startAngle);
      const rad = (angle * Math.PI) / 180;
      const x = cx + rx * Math.cos(rad);
      const y = cy + ry * Math.sin(rad);

      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }

    return p;
  }, [width, height, phoneCenterY]);

  return (
    <Canvas style={[styles.canvas, { width, height }]} pointerEvents="none">
      <Group>
        {/* Wide soft nebula arc */}
        <Path
          path={arcPath}
          style="stroke"
          strokeWidth={60}
          strokeCap="round"
          color={color}
          opacity={opacity}
        >
          <BlurMask blur={50} style="normal" />
        </Path>

        {/* Thinner brighter core of the arc */}
        <Path
          path={arcPath}
          style="stroke"
          strokeWidth={8}
          strokeCap="round"
          color={color}
          opacity={opacity * 1.5}
        >
          <BlurMask blur={12} style="normal" />
        </Path>
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
