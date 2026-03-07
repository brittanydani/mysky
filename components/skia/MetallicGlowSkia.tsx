/**
 * MetallicGlowSkia
 *
 * Warm champagne-gold radial glow. Must be rendered INSIDE a <Canvas>,
 * placed BEFORE the element it should appear behind.
 *
 * Usage (inside a Canvas):
 *   <MetallicGlow cx={cx} cy={cy} radius={size * 0.35} level="soft" />
 *   <MySkyBookLogoSkia ... />   ← rendered on top of the glow
 *
 * The glow is achieved with a filled circle + BlurMask so it bleeds
 * softly outward, simulating a warm light source behind the icon.
 */
import React, { memo } from 'react';
import { Circle, BlurMask } from '@shopify/react-native-skia';
import { mySkyGold, mySkyGlow, GlowLevel } from '@/constants/mySkyMetallic';

type Props = {
  cx: number;
  cy: number;
  /** Radius of the glow circle — typically 30–50% of the icon size */
  radius: number;
  level?: GlowLevel;
};

const MetallicGlow = memo(function MetallicGlow({
  cx, cy, radius, level = 'soft',
}: Props) {
  const { blur, opacity } = mySkyGlow[level];

  return (
    <Circle cx={cx} cy={cy} r={radius} color={mySkyGold.champagne} opacity={opacity}>
      <BlurMask blur={blur} style="normal" />
    </Circle>
  );
});

export default MetallicGlow;
