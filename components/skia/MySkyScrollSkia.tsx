import React, { memo, useMemo } from 'react';
import { ViewStyle } from 'react-native';
import {
  Canvas,
  Path,
  Skia,
  RoundedRect,
  Circle,
  LinearGradient,
  RadialGradient,
  Group,
  vec,
  Shadow,
} from '@shopify/react-native-skia';
import { mySkyGold, metallicStopsSoft, metallicPositionsSoft } from '@/constants/mySkyMetallic';

type Props = { size?: number; style?: ViewStyle };

/**
 * MySkyScrollSkia
 *
 * Rolled parchment scroll with a wax seal — classic iconography for
 * legal documents / terms of service. Champagne-gold metallic system.
 */
const MySkyScrollSkia = memo(function MySkyScrollSkia({ size = 512, style }: Props) {
  const cx = size / 2;

  // ── Parchment body ──────────────────────────────────────────────────────
  const bodyW = size * 0.56;
  const bodyH = size * 0.62;
  const bodyX = cx - bodyW / 2;
  const bodyY = size * 0.14;
  const bodyR = size * 0.03;

  // ── Top roll (cylinder) ─────────────────────────────────────────────────
  const rollH = size * 0.07;
  const rollY = bodyY - rollH * 0.35;
  const rollR = rollH / 2;

  // ── Bottom curl ─────────────────────────────────────────────────────────
  const curlY = bodyY + bodyH;

  const curlPath = useMemo(() => {
    const p = Skia.Path.Make();
    p.moveTo(bodyX, curlY);
    p.cubicTo(
      bodyX + bodyW * 0.15, curlY + size * 0.08,
      bodyX + bodyW * 0.85, curlY + size * 0.08,
      bodyX + bodyW, curlY,
    );
    p.lineTo(bodyX + bodyW, curlY - size * 0.01);
    p.cubicTo(
      bodyX + bodyW * 0.85, curlY + size * 0.05,
      bodyX + bodyW * 0.15, curlY + size * 0.05,
      bodyX, curlY - size * 0.01,
    );
    p.close();
    return p;
  }, [bodyX, bodyW, curlY, size]);

  // ── Horizontal text lines ───────────────────────────────────────────────
  const lineCount = 5;
  const lineStartY = bodyY + size * 0.14;
  const lineGap = size * 0.065;
  const lineXL = bodyX + size * 0.07;
  const lineXR = bodyX + bodyW - size * 0.07;

  // ── Wax seal ────────────────────────────────────────────────────────────
  const sealR = size * 0.09;
  const sealCX = cx + bodyW * 0.22;
  const sealCY = curlY - size * 0.02;

  // Star inside seal
  const starPath = useMemo(() => {
    const p = Skia.Path.Make();
    const points = 5;
    const outerR = sealR * 0.48;
    const innerR = sealR * 0.22;
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const x = sealCX + r * Math.cos(angle);
      const y = sealCY + r * Math.sin(angle);
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    p.close();
    return p;
  }, [sealCX, sealCY, sealR]);

  return (
    <Canvas style={[{ width: size, height: size }, style]}>
      <Group>
        {/* Drop shadow */}
        <Shadow dx={0} dy={size * 0.02} blur={size * 0.04} color="rgba(0,0,0,0.45)" />

        {/* ── Parchment body ── */}
        <RoundedRect x={bodyX} y={bodyY} width={bodyW} height={bodyH} r={bodyR}>
          <LinearGradient
            start={vec(bodyX, bodyY)}
            end={vec(bodyX + bodyW, bodyY + bodyH)}
            colors={[
              mySkyGold.glossBright,
              mySkyGold.champagneLight,
              mySkyGold.champagne,
              mySkyGold.goldMid,
            ]}
            positions={[0, 0.3, 0.65, 1]}
          />
        </RoundedRect>

        {/* Subtle inner highlight */}
        <RoundedRect
          x={bodyX + size * 0.015}
          y={bodyY + size * 0.015}
          width={bodyW - size * 0.03}
          height={bodyH * 0.12}
          r={size * 0.02}
        >
          <LinearGradient
            start={vec(bodyX, bodyY)}
            end={vec(bodyX, bodyY + bodyH * 0.12)}
            colors={['rgba(255,255,255,0.35)', 'rgba(255,255,255,0)']}
          />
        </RoundedRect>

        {/* ── Top roll ── */}
        <RoundedRect x={bodyX - size * 0.02} y={rollY} width={bodyW + size * 0.04} height={rollH} r={rollR}>
          <LinearGradient
            start={vec(bodyX, rollY)}
            end={vec(bodyX, rollY + rollH)}
            colors={metallicStopsSoft}
            positions={metallicPositionsSoft}
          />
          <Shadow dx={0} dy={size * 0.008} blur={size * 0.015} color="rgba(0,0,0,0.3)" />
        </RoundedRect>
        {/* Roll border */}
        <RoundedRect
          x={bodyX - size * 0.02}
          y={rollY}
          width={bodyW + size * 0.04}
          height={rollH}
          r={rollR}
          color={mySkyGold.shadow}
          style="stroke"
          strokeWidth={size * 0.006}
        />

        {/* ── Bottom curl shadow ── */}
        <Path path={curlPath}>
          <LinearGradient
            start={vec(bodyX, curlY)}
            end={vec(bodyX, curlY + size * 0.08)}
            colors={[mySkyGold.goldMid, mySkyGold.shadow, mySkyGold.shadowDeep]}
            positions={[0, 0.5, 1]}
          />
        </Path>

        {/* ── Text lines ── */}
        {Array.from({ length: lineCount }).map((_, i) => (
          <Path
            key={i}
            path={`M ${lineXL} ${lineStartY + i * lineGap} L ${i === lineCount - 1 ? lineXL + (lineXR - lineXL) * 0.55 : lineXR} ${lineStartY + i * lineGap}`}
            color="rgba(77,47,13,0.18)"
            style="stroke"
            strokeWidth={size * 0.011}
            strokeCap="round"
          />
        ))}

        {/* ── Parchment border ── */}
        <RoundedRect
          x={bodyX}
          y={bodyY}
          width={bodyW}
          height={bodyH}
          r={bodyR}
          color={mySkyGold.shadow}
          style="stroke"
          strokeWidth={size * 0.007}
        />

        {/* ── Wax seal ── */}
        <Group>
          <Shadow dx={0} dy={size * 0.01} blur={size * 0.02} color="rgba(0,0,0,0.5)" />
          <Circle cx={sealCX} cy={sealCY} r={sealR}>
            <RadialGradient
              c={vec(sealCX - sealR * 0.3, sealCY - sealR * 0.3)}
              r={sealR * 1.4}
              colors={['#D4574A', '#B5342A', '#8B1A12', '#5C0D08']}
              positions={[0, 0.35, 0.7, 1]}
            />
          </Circle>
          {/* Seal rim */}
          <Circle
            cx={sealCX}
            cy={sealCY}
            r={sealR * 0.82}
            color="rgba(255,200,180,0.15)"
            style="stroke"
            strokeWidth={size * 0.006}
          />
          {/* Star emblem */}
          <Path path={starPath} color="rgba(255,220,190,0.55)" />
        </Group>
      </Group>
    </Canvas>
  );
});

export default MySkyScrollSkia;
