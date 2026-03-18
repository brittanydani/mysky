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

type Props = {
  size?: number;
  style?: ViewStyle;
};

/**
 * MySkyLanternSkia
 *
 * Champagne-gold metallic lantern with inner warm glow and flame —
 * classic iconography for illumination / knowledge / FAQ.
 */
const MySkyLanternSkia = memo(function MySkyLanternSkia({ size = 512, style }: Props) {
  const cx = size / 2;

  // ── Dimensions ──────────────────────────────────────────────────────────
  const capH    = size * 0.06;
  const capY    = size * 0.20;
  const capW    = size * 0.30;
  const bodyTop = capY + capH;
  const bodyBot = size * 0.72;
  const bodyH   = bodyBot - bodyTop;
  const topW    = size * 0.30;
  const botW    = size * 0.36;
  const botCapH = size * 0.055;
  const botCapY = bodyBot;
  const botCapW = size * 0.28;
  const baseH   = size * 0.07;
  const baseY   = botCapY + botCapH;
  const baseW   = size * 0.22;

  // ── Handle arc ──────────────────────────────────────────────────────────
  const handlePath = useMemo(() => {
    const p = Skia.Path.Make();
    const hW = size * 0.10;
    p.moveTo(cx - hW, capY);
    p.quadTo(cx - hW, capY - size * 0.10, cx, capY - size * 0.10);
    p.quadTo(cx + hW, capY - size * 0.10, cx + hW, capY);
    return p;
  }, [cx, capY, size]);

  // ── Glass body (tapered trapezoid) ──────────────────────────────────────
  const glassPath = useMemo(() => {
    const p = Skia.Path.Make();
    const tl = cx - topW / 2;
    const tr = cx + topW / 2;
    const bl = cx - botW / 2;
    const br = cx + botW / 2;
    p.moveTo(tl, bodyTop);
    p.lineTo(tr, bodyTop);
    p.lineTo(br, bodyBot);
    p.lineTo(bl, bodyBot);
    p.close();
    return p;
  }, [cx, topW, botW, bodyTop, bodyBot]);

  // ── Flame (outer) ───────────────────────────────────────────────────────
  const flameCY = bodyTop + bodyH * 0.45;
  const flameOuter = useMemo(() => {
    const p = Skia.Path.Make();
    p.moveTo(cx, flameCY - size * 0.10);
    p.quadTo(cx + size * 0.04, flameCY - size * 0.04, cx + size * 0.035, flameCY + size * 0.03);
    p.quadTo(cx + size * 0.02, flameCY + size * 0.06, cx, flameCY + size * 0.065);
    p.quadTo(cx - size * 0.02, flameCY + size * 0.06, cx - size * 0.035, flameCY + size * 0.03);
    p.quadTo(cx - size * 0.04, flameCY - size * 0.04, cx, flameCY - size * 0.10);
    p.close();
    return p;
  }, [cx, flameCY, size]);

  // ── Flame (inner core) ──────────────────────────────────────────────────
  const flameInner = useMemo(() => {
    const p = Skia.Path.Make();
    p.moveTo(cx, flameCY - size * 0.06);
    p.quadTo(cx + size * 0.022, flameCY - size * 0.02, cx + size * 0.018, flameCY + size * 0.02);
    p.quadTo(cx + size * 0.01, flameCY + size * 0.038, cx, flameCY + size * 0.04);
    p.quadTo(cx - size * 0.01, flameCY + size * 0.038, cx - size * 0.018, flameCY + size * 0.02);
    p.quadTo(cx - size * 0.022, flameCY - size * 0.02, cx, flameCY - size * 0.06);
    p.close();
    return p;
  }, [cx, flameCY, size]);

  // ── Cross-bar lines ─────────────────────────────────────────────────────
  const barFrac1 = 0.30;
  const barFrac2 = 0.70;
  const barY1 = bodyTop + bodyH * barFrac1;
  const barY2 = bodyTop + bodyH * barFrac2;
  const barHalfW1 = topW / 2 + (botW / 2 - topW / 2) * barFrac1;
  const barHalfW2 = topW / 2 + (botW / 2 - topW / 2) * barFrac2;

  // ── Base foot path ──────────────────────────────────────────────────────
  const basePath = useMemo(() => {
    const p = Skia.Path.Make();
    const bl = cx - baseW / 2;
    const br = cx + baseW / 2;
    const r = size * 0.015;
    p.moveTo(bl, baseY);
    p.lineTo(bl, baseY + baseH - r);
    p.quadTo(bl, baseY + baseH, bl + r, baseY + baseH);
    p.lineTo(br - r, baseY + baseH);
    p.quadTo(br, baseY + baseH, br, baseY + baseH - r);
    p.lineTo(br, baseY);
    p.close();
    return p;
  }, [cx, baseW, baseY, baseH, size]);

  return (
    <Canvas style={[{ width: size, height: size }, style]}>
      <Group>
        {/* Drop shadow */}
        <Shadow dx={0} dy={size * 0.02} blur={size * 0.04} color="rgba(0,0,0,0.40)" />

        {/* ── Handle arc ── */}
        <Path
          path={handlePath}
          style="stroke"
          strokeWidth={size * 0.022}
          strokeCap="round"
          color={mySkyGold.goldMid}
        />
        <Path path={handlePath} style="stroke" strokeWidth={size * 0.012} strokeCap="round">
          <LinearGradient
            start={vec(cx - size * 0.10, capY - size * 0.10)}
            end={vec(cx + size * 0.10, capY)}
            colors={[...metallicStopsSoft]}
            positions={[...metallicPositionsSoft]}
          />
        </Path>

        {/* ── Top cap ── */}
        <RoundedRect x={cx - capW / 2} y={capY} width={capW} height={capH} r={size * 0.015}>
          <LinearGradient
            start={vec(cx - capW / 2, capY)}
            end={vec(cx - capW / 2, capY + capH)}
            colors={[...metallicStopsSoft]}
            positions={[...metallicPositionsSoft]}
          />
        </RoundedRect>
        <RoundedRect
          x={cx - capW / 2}
          y={capY}
          width={capW}
          height={capH}
          r={size * 0.015}
          style="stroke"
          strokeWidth={size * 0.006}
          color={mySkyGold.shadow}
        />

        {/* ── Glass body ── */}
        <Path path={glassPath}>
          <LinearGradient
            start={vec(cx, bodyTop)}
            end={vec(cx, bodyBot)}
            colors={[
              'rgba(239,213,150,0.12)',
              'rgba(221,186,106,0.06)',
              'rgba(168,116,46,0.03)',
            ]}
            positions={[0, 0.5, 1]}
          />
        </Path>
        <Path
          path={glassPath}
          style="stroke"
          strokeWidth={size * 0.012}
          color={mySkyGold.goldMid}
        />
        <Path path={glassPath} style="stroke" strokeWidth={size * 0.007}>
          <LinearGradient
            start={vec(cx - botW / 2, bodyTop)}
            end={vec(cx - botW / 2, bodyBot)}
            colors={[...metallicStopsSoft]}
            positions={[...metallicPositionsSoft]}
          />
        </Path>

        {/* ── Inner warm glow ── */}
        <Circle cx={cx} cy={flameCY} r={size * 0.10}>
          <RadialGradient
            c={vec(cx, flameCY)}
            r={size * 0.10}
            colors={[
              'rgba(232,212,154,0.40)',
              'rgba(212,176,96,0.10)',
              'rgba(212,176,96,0)',
            ]}
            positions={[0, 0.7, 1]}
          />
        </Circle>

        {/* ── Outer flame ── */}
        <Path path={flameOuter} color={mySkyGold.champagne} opacity={0.65} />

        {/* ── Inner flame ── */}
        <Path path={flameInner} color={mySkyGold.glossBright} opacity={0.50} />

        {/* ── Cross-bar decorations ── */}
        <Path
          path={`M ${cx - barHalfW1} ${barY1} L ${cx + barHalfW1} ${barY1}`}
          style="stroke"
          strokeWidth={size * 0.006}
          color={mySkyGold.goldMid}
          opacity={0.35}
        />
        <Path
          path={`M ${cx - barHalfW2} ${barY2} L ${cx + barHalfW2} ${barY2}`}
          style="stroke"
          strokeWidth={size * 0.006}
          color={mySkyGold.goldMid}
          opacity={0.35}
        />

        {/* ── Bottom cap ── */}
        <RoundedRect x={cx - botCapW / 2} y={botCapY} width={botCapW} height={botCapH} r={size * 0.012}>
          <LinearGradient
            start={vec(cx - botCapW / 2, botCapY)}
            end={vec(cx - botCapW / 2, botCapY + botCapH)}
            colors={[...metallicStopsSoft]}
            positions={[...metallicPositionsSoft]}
          />
        </RoundedRect>
        <RoundedRect
          x={cx - botCapW / 2}
          y={botCapY}
          width={botCapW}
          height={botCapH}
          r={size * 0.012}
          style="stroke"
          strokeWidth={size * 0.005}
          color={mySkyGold.shadow}
        />

        {/* ── Base foot ── */}
        <Path path={basePath}>
          <LinearGradient
            start={vec(cx - baseW / 2, baseY)}
            end={vec(cx - baseW / 2, baseY + baseH)}
            colors={[...metallicStopsSoft]}
            positions={[...metallicPositionsSoft]}
          />
        </Path>
        <Path
          path={basePath}
          style="stroke"
          strokeWidth={size * 0.005}
          color={mySkyGold.shadow}
        />
      </Group>
    </Canvas>
  );
});

export default MySkyLanternSkia;
