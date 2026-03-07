import React, { memo, useMemo } from 'react';
import { ViewStyle } from 'react-native';
import {
  Canvas,
  Circle,
  Path,
  Skia,
  LinearGradient,
  SweepGradient,
  Group,
  vec,
} from '@shopify/react-native-skia';
import {
  mySkyGold,
  metallicStopsHero, metallicPositionsHero,
  metallicStopsSweep, metallicPositionsSweep,
  metallicStopsHub, metallicPositionsHub,
} from '@/constants/mySkyMetallic';

// ── helpers ──────────────────────────────────────────────────────────────────

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg - 90) * Math.PI / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

/**
 * Diamond-shaped compass blade:
 *   tip  → waist-left → base → waist-right → close
 * Waist sits at the midpoint along the radial, offset perpendicular by halfW.
 */
function makeBlade(
  cx: number, cy: number,
  innerR: number, outerR: number,
  halfW: number,
  angleDeg: number,
) {
  const theta = (angleDeg - 90) * Math.PI / 180;
  const midR = innerR + (outerR - innerR) * 0.38; // waist closer to base → elongated look

  const tip  = { x: cx + outerR * Math.cos(theta), y: cy + outerR * Math.sin(theta) };
  const base = { x: cx + innerR * Math.cos(theta), y: cy + innerR * Math.sin(theta) };
  const midX = cx + midR * Math.cos(theta);
  const midY = cy + midR * Math.sin(theta);
  const px   = -Math.sin(theta); // perpendicular unit vector
  const py   =  Math.cos(theta);
  const wL   = { x: midX + halfW * px, y: midY + halfW * py };
  const wR   = { x: midX - halfW * px, y: midY - halfW * py };

  const p = Skia.Path.Make();
  p.moveTo(tip.x, tip.y);
  p.lineTo(wL.x, wL.y);
  p.lineTo(base.x, base.y);
  p.lineTo(wR.x, wR.y);
  p.close();
  return p;
}

// ── component ────────────────────────────────────────────────────────────────

type Props = {
  size?: number;
  style?: ViewStyle;
};

/**
 * MySkyCompassSkia
 *
 * Classic 8-point compass rose: 4 cardinal diamond blades (N/S/E/W),
 * 4 smaller ordinal blades (NE/NW/SE/SW), concentric rings, and a centre hub.
 * All rendered with the shared champagne-gold metallic system.
 */
const MySkyCompassSkia = memo(function MySkyCompassSkia({ size = 512, style }: Props) {
  const cx = size / 2;
  const cy = size / 2;

  // Ring radii
  const outerRingR = size * 0.435;
  const innerRingR = size * 0.400;

  // Cardinal blade dimensions (N / S / E / W)
  const cardOuter  = size * 0.390;
  const cardInner  = size * 0.072;
  const cardHalfW  = size * 0.055;

  // Ordinal blade dimensions (NE / NW / SE / SW)
  const ordOuter   = size * 0.215;
  const ordInner   = size * 0.065;
  const ordHalfW   = size * 0.038;

  // Centre hub
  const hubOuter   = size * 0.048;
  const hubInner   = size * 0.026;

  // Cardinal blades (0° = N, 90° = E, 180° = S, 270° = W)
  const cardAngles  = [0, 90, 180, 270];
  const ordAngles   = [45, 135, 225, 315];

  const cardPaths = useMemo(
    () => cardAngles.map(a => makeBlade(cx, cy, cardInner, cardOuter, cardHalfW, a)),
    [cx, cy, cardInner, cardOuter, cardHalfW],
  );
  const ordPaths = useMemo(
    () => ordAngles.map(a => makeBlade(cx, cy, ordInner, ordOuter, ordHalfW, a)),
    [cx, cy, ordInner, ordOuter, ordHalfW],
  );

  // Metallic gradient: top → bottom covers the full compass height
  const gradStart = vec(cx, cy - cardOuter);
  const gradEnd   = vec(cx, cy + cardOuter);

  const ringColors    = [...metallicStopsSweep];
  const ringPositions = [...metallicPositionsSweep];

  return (
    <Canvas style={[{ width: size, height: size }, style]}>
      {/* ── Outer decorative ring ── */}
      <Circle cx={cx} cy={cy} r={outerRingR} style="stroke" strokeWidth={size * 0.013}>
        <SweepGradient c={vec(cx, cy)} colors={ringColors} positions={ringPositions} />
      </Circle>

      {/* ── Inner ring ── */}
      <Circle cx={cx} cy={cy} r={innerRingR} style="stroke" strokeWidth={size * 0.006}>
        <SweepGradient c={vec(cx, cy)} colors={ringColors} positions={ringPositions} />
      </Circle>

      {/* ── Ordinal blades (behind cardinal) ── */}
      {ordPaths.map((path, i) => (
        <Path key={`ord-${i}`} path={path}>
          <LinearGradient start={gradStart} end={gradEnd} colors={[...metallicStopsHero]} positions={[...metallicPositionsHero]} />
        </Path>
      ))}

      {/* ── Cardinal blades ── */}
      {cardPaths.map((path, i) => (
        <Path key={`card-${i}`} path={path}>
          <LinearGradient start={gradStart} end={gradEnd} colors={[...metallicStopsHero]} positions={[...metallicPositionsHero]} />
        </Path>
      ))}

      {/* ── Blade edge strokes for crisp metallic definition ── */}
      {[...cardPaths, ...ordPaths].map((path, i) => (
        <Path key={`stroke-${i}`} path={path} style="stroke" strokeWidth={size * 0.004} color={mySkyGold.shadow} />
      ))}

      {/* ── Centre hub outer ── */}
      <Circle cx={cx} cy={cy} r={hubOuter}>
        <LinearGradient
          start={vec(cx, cy - hubOuter)}
          end={vec(cx, cy + hubOuter)}
          colors={[...metallicStopsHub]}
          positions={[...metallicPositionsHub]}
        />
      </Circle>
      <Circle cx={cx} cy={cy} r={hubOuter} style="stroke" strokeWidth={size * 0.004} color={mySkyGold.shadow} />

      {/* ── Centre hub inner dot ── */}
      <Circle cx={cx} cy={cy} r={hubInner}>
        <LinearGradient
          start={vec(cx, cy - hubInner)}
          end={vec(cx, cy + hubInner)}
          colors={[mySkyGold.glossBright, mySkyGold.goldMid, mySkyGold.shadow]}
          positions={[0, 0.5, 1]}
        />
      </Circle>
    </Canvas>
  );
});

export default MySkyCompassSkia;
