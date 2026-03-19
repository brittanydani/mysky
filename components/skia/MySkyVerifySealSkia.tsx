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
  BlurMask,
} from '@shopify/react-native-skia';
import {
  mySkyGold,
  metallicStopsHero,
  metallicPositionsHero,
  metallicStopsSweep,
  metallicPositionsSweep,
  metallicStopsHub,
  metallicPositionsHub,
  metallicStopsSoft,
  metallicPositionsSoft,
} from '@/constants/mySkyMetallic';

type Props = {
  size?: number;
  style?: ViewStyle;
};

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

/**
 * MySkyVerifySealSkia
 *
 * Luxury verification seal inspired by wax seals, coin edges, and high-end
 * hallmarks. Scalloped outer ring, concentric bands, 8-ray starburst,
 * and a bold central checkmark — all rendered with the hero metallic system.
 */
const MySkyVerifySealSkia = memo(function MySkyVerifySealSkia({
  size = 512,
  style,
}: Props) {
  const cx = size / 2;
  const cy = size / 2;

  // ── Scalloped outer ring ─────────────────────────────────────────────
  const scallops = 32;
  const outerR = size * 0.46;
  const innerR = size * 0.42;

  const scallopPath = useMemo(() => {
    const p = Skia.Path.Make();
    const step = 360 / scallops;
    const first = polar(cx, cy, outerR, 0);
    p.moveTo(first.x, first.y);

    for (let i = 0; i < scallops; i++) {
      const midAngle = i * step + step / 2;
      const endAngle = (i + 1) * step;
      const mid = polar(cx, cy, innerR, midAngle);
      const end = polar(cx, cy, outerR, endAngle);
      p.quadTo(mid.x, mid.y, end.x, end.y);
    }
    p.close();
    return p;
  }, [cx, cy, outerR, innerR]);

  // ── Concentric ring radii ────────────────────────────────────────────
  const ringR1 = size * 0.38;
  const ringR2 = size * 0.34;
  const ringR3 = size * 0.20;

  // ── 8-ray starburst ─────────────────────────────────────────────────
  const rays = 8;
  const rayOuterR = size * 0.31;
  const rayInnerR = size * 0.14;
  const rayHalfW = size * 0.025;

  const starburstPath = useMemo(() => {
    const p = Skia.Path.Make();
    const step = 360 / rays;

    for (let i = 0; i < rays; i++) {
      const angle = i * step;
      const theta = ((angle - 90) * Math.PI) / 180;
      const tip = polar(cx, cy, rayOuterR, angle);
      const base = polar(cx, cy, rayInnerR, angle);

      // perpendicular offset for width
      const px = -Math.sin(theta);
      const py = Math.cos(theta);

      const midR = rayInnerR + (rayOuterR - rayInnerR) * 0.35;
      const midX = cx + midR * Math.cos(theta);
      const midY = cy + midR * Math.sin(theta);

      p.moveTo(tip.x, tip.y);
      p.lineTo(midX + rayHalfW * px, midY + rayHalfW * py);
      p.lineTo(base.x, base.y);
      p.lineTo(midX - rayHalfW * px, midY - rayHalfW * py);
      p.close();
    }
    return p;
  }, [cx, cy, rayOuterR, rayInnerR, rayHalfW]);

  // ── Fine tick marks between rings ────────────────────────────────────
  const ticks = 48;
  const tickPath = useMemo(() => {
    const p = Skia.Path.Make();
    const step = 360 / ticks;
    for (let i = 0; i < ticks; i++) {
      const angle = i * step;
      const outer = polar(cx, cy, ringR1 - size * 0.005, angle);
      const inner = polar(cx, cy, ringR2 + size * 0.005, angle);
      p.moveTo(outer.x, outer.y);
      p.lineTo(inner.x, inner.y);
    }
    return p;
  }, [cx, cy, ringR1, ringR2, size]);

  // ── Checkmark ────────────────────────────────────────────────────────
  const checkStroke = size * 0.04;
  const checkmarkPath = useMemo(() => {
    const p = Skia.Path.Make();
    p.moveTo(cx - size * 0.095, cy + size * 0.01);
    p.lineTo(cx - size * 0.025, cy + size * 0.085);
    p.lineTo(cx + size * 0.115, cy - size * 0.075);
    return p;
  }, [cx, cy, size]);

  // ── Gradient anchors ────────────────────────────────────────────────
  const gradStart = vec(cx, cy - outerR);
  const gradEnd = vec(cx, cy + outerR);
  const sweepColors = [...metallicStopsSweep];
  const sweepPositions = [...metallicPositionsSweep];

  return (
    <Canvas style={[{ width: size, height: size }, style]}>
      {/* ── Ambient glow behind seal ── */}
      <Circle cx={cx} cy={cy} r={size * 0.38} color={mySkyGold.champagne} opacity={0.08}>
        <BlurMask blur={size * 0.06} style="normal" />
      </Circle>

      {/* ── Scalloped outer body ── */}
      <Path path={scallopPath}>
        <LinearGradient
          start={gradStart}
          end={gradEnd}
          colors={[...metallicStopsHero]}
          positions={[...metallicPositionsHero]}
        />
      </Path>
      <Path
        path={scallopPath}
        style="stroke"
        strokeWidth={size * 0.006}
        color={mySkyGold.shadow}
      />

      {/* ── Outer ring ── */}
      <Circle
        cx={cx}
        cy={cy}
        r={ringR1}
        style="stroke"
        strokeWidth={size * 0.012}
      >
        <SweepGradient
          c={vec(cx, cy)}
          colors={sweepColors}
          positions={sweepPositions}
        />
      </Circle>

      {/* ── Fine tick marks ── */}
      <Path
        path={tickPath}
        style="stroke"
        strokeWidth={size * 0.003}
        color={mySkyGold.shadow}
        opacity={0.5}
      />

      {/* ── Inner ring ── */}
      <Circle
        cx={cx}
        cy={cy}
        r={ringR2}
        style="stroke"
        strokeWidth={size * 0.008}
      >
        <SweepGradient
          c={vec(cx, cy)}
          colors={sweepColors}
          positions={sweepPositions}
        />
      </Circle>

      {/* ── Inner fill disc ── */}
      <Circle cx={cx} cy={cy} r={ringR2 - size * 0.006}>
        <LinearGradient
          start={vec(cx, cy - ringR2)}
          end={vec(cx, cy + ringR2)}
          colors={[...metallicStopsSoft]}
          positions={[...metallicPositionsSoft]}
        />
      </Circle>

      {/* ── Starburst rays ── */}
      <Path path={starburstPath}>
        <LinearGradient
          start={gradStart}
          end={gradEnd}
          colors={[...metallicStopsHero]}
          positions={[...metallicPositionsHero]}
        />
      </Path>
      <Path
        path={starburstPath}
        style="stroke"
        strokeWidth={size * 0.003}
        color={mySkyGold.shadow}
        opacity={0.6}
      />

      {/* ── Inner accent ring ── */}
      <Circle
        cx={cx}
        cy={cy}
        r={ringR3}
        style="stroke"
        strokeWidth={size * 0.005}
      >
        <SweepGradient
          c={vec(cx, cy)}
          colors={sweepColors}
          positions={sweepPositions}
        />
      </Circle>

      {/* ── Centre hub ── */}
      <Circle cx={cx} cy={cy} r={size * 0.17}>
        <LinearGradient
          start={vec(cx, cy - size * 0.17)}
          end={vec(cx, cy + size * 0.17)}
          colors={[...metallicStopsHub]}
          positions={[...metallicPositionsHub]}
        />
      </Circle>
      <Circle
        cx={cx}
        cy={cy}
        r={size * 0.17}
        style="stroke"
        strokeWidth={size * 0.004}
        color={mySkyGold.shadow}
      />

      {/* ── Checkmark shadow ── */}
      <Group>
        <Path
          path={checkmarkPath}
          style="stroke"
          strokeWidth={checkStroke + size * 0.015}
          strokeCap="round"
          strokeJoin="round"
          color={mySkyGold.shadowDeep}
          opacity={0.5}
        />
        {/* ── Checkmark ── */}
        <Path
          path={checkmarkPath}
          style="stroke"
          strokeWidth={checkStroke}
          strokeCap="round"
          strokeJoin="round"
          color="#020817"
        />
      </Group>
    </Canvas>
  );
});

export default MySkyVerifySealSkia;
