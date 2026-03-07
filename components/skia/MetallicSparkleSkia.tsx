/**
 * MetallicSparkleSkia
 *
 * Reusable 4-point sparkle star. Must be rendered INSIDE a <Canvas>.
 *
 * Usage (inside a Canvas):
 *   <MetallicSparkle cx={cx} cy={cy} outer={size * 0.04} mode="soft" />
 *
 * The outer/inner ratio is fixed at 3.5:1 which gives the classic
 * elongated 4-point star shape. Adjust `outer` to scale it.
 */
import React, { memo, useMemo } from 'react';
import { Path, Skia, LinearGradient, vec } from '@shopify/react-native-skia';
import { mySkyGold, getMetallicStops, MetallicMode } from '@/constants/mySkyMetallic';

type Props = {
  cx: number;
  cy: number;
  /** Outer (tip) radius of the star */
  outer: number;
  /** Inner (waist) radius — defaults to outer / 3.5 */
  inner?: number;
  mode?: MetallicMode;
};

const MetallicSparkle = memo(function MetallicSparkle({
  cx, cy, outer, inner, mode = 'soft',
}: Props) {
  const innerR = inner ?? outer / 3.5;
  const { colors, positions } = getMetallicStops(mode);

  const path = useMemo(() => {
    const p = Skia.Path.Make();
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI / 4) * i - Math.PI / 2;
      const r = i % 2 === 0 ? outer : innerR;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    p.close();
    return p;
  }, [cx, cy, outer, innerR]);

  return (
    <Path path={path}>
      <LinearGradient
        start={vec(cx, cy - outer)}
        end={vec(cx, cy + outer)}
        colors={colors as string[]}
        positions={positions as number[]}
      />
    </Path>
  );
});

export default MetallicSparkle;
