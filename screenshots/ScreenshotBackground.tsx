/**
 * ScreenshotBackground
 *
 * Renders the premium obsidian-glass background for App Store screenshots:
 * 1. Three-stop deep gradient (obsidian)
 * 2. Ambient nebula glow blobs (per-screenshot accent color)
 * 3. Subtle starfield layer
 *
 * All rendered via @shopify/react-native-skia for GPU-accelerated output.
 */

import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import {
  Canvas,
  Rect,
  LinearGradient,
  Circle,
  BlurMask,
  vec,
  Group,
} from '@shopify/react-native-skia';
import {
  OBSIDIAN_GRADIENT,
  STARFIELD,
  type ScreenshotConfig,
} from './config';

interface Props {
  width: number;
  height: number;
  config: ScreenshotConfig;
}

// ─── Deterministic star positions based on screenshot id ───────────
function generateStars(
  count: number,
  width: number,
  height: number,
  seed: number,
) {
  const stars: { x: number; y: number; r: number; opacity: number }[] = [];
  // Simple pseudo-random seeded by screenshot id
  let s = seed * 9301 + 49297;
  const next = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };

  for (let i = 0; i < count; i++) {
    stars.push({
      x: next() * width,
      y: next() * height,
      r:
        STARFIELD.sizeRange[0] +
        next() * (STARFIELD.sizeRange[1] - STARFIELD.sizeRange[0]),
      opacity:
        STARFIELD.opacityRange[0] +
        next() * (STARFIELD.opacityRange[1] - STARFIELD.opacityRange[0]),
    });
  }
  return stars;
}

export default function ScreenshotBackground({ width, height, config }: Props) {
  const stars = useMemo(
    () => generateStars(STARFIELD.count, width, height, config.id),
    [width, height, config.id],
  );

  // Nebula blob positions — two or more glow centers
  const nebulaBlobs = useMemo(() => {
    const blobs: { cx: number; cy: number; r: number; color: string }[] = [];
    config.nebulaColors.forEach((color, i) => {
      const angle = (i / config.nebulaColors.length) * Math.PI * 2 - Math.PI / 4;
      blobs.push({
        cx: width / 2 + Math.cos(angle) * width * 0.25,
        cy: height * 0.45 + Math.sin(angle) * height * 0.15,
        r: config.nebulaBlur,
        color,
      });
    });
    return blobs;
  }, [config, width, height]);

  return (
    <Canvas style={[styles.canvas, { width, height }]}>
      {/* Layer 1: Obsidian gradient */}
      <Rect x={0} y={0} width={width} height={height}>
        <LinearGradient
          start={vec(width / 2, 0)}
          end={vec(width / 2, height)}
          colors={[...OBSIDIAN_GRADIENT]}
        />
      </Rect>

      {/* Layer 2: Nebula ambient glow blobs */}
      <Group>
        {nebulaBlobs.map((blob, i) => (
          <Circle
            key={`nebula-${i}`}
            cx={blob.cx}
            cy={blob.cy}
            r={blob.r}
            color={blob.color}
            opacity={config.nebulaOpacity}
          >
            <BlurMask blur={blob.r * 0.8} style="normal" />
          </Circle>
        ))}
      </Group>

      {/* Layer 3: Subtle starfield */}
      <Group>
        {stars.map((star, i) => (
          <Circle
            key={`star-${i}`}
            cx={star.x}
            cy={star.y}
            r={star.r}
            color="#FFFFFF"
            opacity={star.opacity}
          />
        ))}
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
