import React, { memo, useMemo } from 'react';
import { ViewStyle } from 'react-native';
import {
  Canvas,
  Path,
  RoundedRect,
  Skia,
  LinearGradient,
  Group,
  vec,
} from '@shopify/react-native-skia';
import { mySkyGold, metallicStopsSoft, metallicPositionsSoft } from '@/constants/mySkyMetallic';

type Props = {
  size?: number;
  style?: ViewStyle;
};

/**
 * MySkyLockSkia
 *
 * Premium padlock logo: rounded body + U-shackle + keyhole.
 * Uses the shared champagne-gold metallic system.
 * Suitable for privacy policy and terms screens.
 */
const MySkyLockSkia = memo(function MySkyLockSkia({ size = 512, style }: Props) {
  const cx = size / 2;

  // ── Body geometry ──────────────────────────────────────────────────────────
  const bodyW  = size * 0.52;
  const bodyH  = size * 0.40;
  const bodyX  = cx - bodyW / 2;
  const bodyY  = size * 0.495;
  const bodyR  = size * 0.055;

  // ── Shackle geometry ──────────────────────────────────────────────────────
  // Two vertical posts rising from the body top, joined by a semicircle.
  const shackleStroke = size * 0.060;   // thick stroke = the shackle "bar"
  const shackleInnerR = size * 0.130;   // inner radius of the semicircle
  const shackleTopY   = size * 0.265;   // centre-Y of the semicircle
  const shackleLeftX  = cx - shackleInnerR - shackleStroke / 2;
  const shackleRightX = cx + shackleInnerR + shackleStroke / 2;
  // Bottom of shackle posts sit inside the body
  const shackleBottomY = bodyY + bodyH * 0.28;

  const shacklePath = useMemo(() => {
    const p = Skia.Path.Make();
    // Left post: straight down
    p.moveTo(shackleLeftX, shackleBottomY);
    p.lineTo(shackleLeftX, shackleTopY);
    // Semicircle across the top (left → right, going up)
    p.arcToOval(
      { x: cx - shackleInnerR - shackleStroke / 2, y: shackleTopY - (shackleInnerR + shackleStroke / 2), width: (shackleInnerR + shackleStroke / 2) * 2, height: (shackleInnerR + shackleStroke / 2) * 2 },
      180, -180, false,
    );
    // Right post: straight down
    p.lineTo(shackleRightX, shackleBottomY);
    return p;
  }, [cx, shackleLeftX, shackleRightX, shackleTopY, shackleBottomY, shackleInnerR, shackleStroke]);

  // ── Keyhole geometry ──────────────────────────────────────────────────────
  const keyholeR     = size * 0.052;
  const keyholeCX    = cx;
  const keyholeCY    = bodyY + bodyH * 0.38;
  const notchHalfW   = size * 0.032;
  const notchH       = size * 0.082;

  const keyholePath = useMemo(() => {
    const p = Skia.Path.Make();
    // Circle
    p.addCircle(keyholeCX, keyholeCY, keyholeR);
    return p;
  }, [keyholeCX, keyholeCY, keyholeR]);

  const notchPath = useMemo(() => {
    const p = Skia.Path.Make();
    // Teardrop notch below the keyhole circle
    p.moveTo(keyholeCX - notchHalfW, keyholeCY + keyholeR * 0.6);
    p.lineTo(keyholeCX, keyholeCY + keyholeR * 0.6 + notchH);
    p.lineTo(keyholeCX + notchHalfW, keyholeCY + keyholeR * 0.6);
    p.close();
    return p;
  }, [keyholeCX, keyholeCY, keyholeR, notchHalfW, notchH]);

  // ── Gradient definitions ───────────────────────────────────────────────────
  const bodyGradStart = vec(bodyX, bodyY);
  const bodyGradEnd   = vec(bodyX, bodyY + bodyH);

  const shackleGradStart = vec(cx, shackleTopY - shackleInnerR);
  const shackleGradEnd   = vec(cx, shackleBottomY);

  return (
    <Canvas style={[{ width: size, height: size }, style]}>
      {/* ── Shackle (drawn behind body) ── */}
      <Group>
        <Path
          path={shacklePath}
          style="stroke"
          strokeWidth={shackleStroke}
          strokeCap="round"
          strokeJoin="round"
        >
          <LinearGradient
            start={shackleGradStart}
            end={shackleGradEnd}
            colors={[...metallicStopsSoft]}
            positions={[...metallicPositionsSoft]}
          />
        </Path>
        {/* Shackle edge definition */}
        <Path
          path={shacklePath}
          style="stroke"
          strokeWidth={shackleStroke + size * 0.008}
          strokeCap="round"
          strokeJoin="round"
          color={mySkyGold.shadowDeep}
          opacity={0.45}
        />
        {/* Re-draw shackle fill on top of outline */}
        <Path
          path={shacklePath}
          style="stroke"
          strokeWidth={shackleStroke}
          strokeCap="round"
          strokeJoin="round"
        >
          <LinearGradient
            start={shackleGradStart}
            end={shackleGradEnd}
            colors={[...metallicStopsSoft]}
            positions={[...metallicPositionsSoft]}
          />
        </Path>
      </Group>

      {/* ── Body fill ── */}
      <RoundedRect x={bodyX} y={bodyY} width={bodyW} height={bodyH} r={bodyR}>
        <LinearGradient
          start={bodyGradStart}
          end={bodyGradEnd}
          colors={[...metallicStopsSoft]}
          positions={[...metallicPositionsSoft]}
        />
      </RoundedRect>

      {/* ── Body border ── */}
      <RoundedRect
        x={bodyX} y={bodyY} width={bodyW} height={bodyH} r={bodyR}
        style="stroke"
        strokeWidth={size * 0.008}
        color={mySkyGold.shadow}
      />

      {/* ── Top body highlight line ── */}
      <RoundedRect
        x={bodyX + size * 0.006}
        y={bodyY + size * 0.006}
        width={bodyW - size * 0.012}
        height={bodyH - size * 0.012}
        r={bodyR - size * 0.003}
        style="stroke"
        strokeWidth={size * 0.003}
        color={mySkyGold.glossBright}
        opacity={0.4}
      />

      {/* ── Keyhole ── */}
      <Path path={keyholePath} color="#020817" />
      <Path path={notchPath} color="#020817" />
      <Path path={keyholePath} style="stroke" strokeWidth={size * 0.004} color={mySkyGold.shadow} opacity={0.6} />
    </Canvas>
  );
});

export default MySkyLockSkia;
